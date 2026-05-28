import RTQ from '../models/RTQ.model.js';
import Answer from '../models/Answer.model.js';
import FAQ from '../models/FAQ.model.js';
import User from '../models/User.model.js';
import { awardQP, deductQP } from '../services/qp.service.js';
import { notifyUser } from '../services/notification.service.js';
import { QP_RULES } from '../../../shared/constants.js';
import embedder from '../../../rag-engine/embedding/embedder.js';
import { evaluateQuestion } from '../../../rag-engine/decision-engine/decision.tree.js';

export async function listRTQs(req, res) {
  try {
    const { sort = 'upvotes', filter } = req.query;
    const rtqs = await RTQ.find()
      .populate('postedBy', 'name role')
      .populate({
        path: 'answers',
        populate: { path: 'userId', select: 'name role' }
      })
      .sort({ [sort]: -1, createdAt: -1 });

    let filtered = rtqs;
    if (filter === 'unresolved') {
      filtered = rtqs.filter(r => r.status === 'open' && !r.isAccepted);
    } else if (filter === 'resolved') {
      filtered = rtqs.filter(r => r.status === 'resolved' || r.isAccepted);
    } else if (filter === 'partial') {
      filtered = rtqs.filter(r => r.answers.length > 0 && !r.isAccepted);
    }

    res.json(filtered);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
}

export async function getRTQ(req, res) {
  try {
    const rtq = await RTQ.findById(req.params.id)
      .populate('postedBy', 'name role')
      .populate({
        path: 'answers',
        populate: { path: 'userId', select: 'name role' }
      });
    if (!rtq) return res.status(404).json({ message: 'RTQ not found' });
    res.json(rtq);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
}

export async function submitQuestion(req, res) {
  try {
    const { question, category, tags } = req.body;
    if (!question || !category) {
      return res.status(400).json({ message: 'question and category are required' });
    }

    // FIX #1: Run RAG evaluation BEFORE creating the RTQ record
    const result = await evaluateQuestion(question);

    // If rejected, do NOT persist an RTQ — just apply penalty and return
    if (result.status === 'REJECT') {
      if (result.penalty < 0) {
        await deductQP(req.user._id, Math.abs(result.penalty), `Question rejected: ${result.reason}`, null);
        await notifyUser(req.user._id, req.user.role, 'question_rejected',
          `Question rejected (duplicate). ${result.penalty} QP`, result.penalty, null);
      }
      return res.status(200).json({ ...result });
    }

    // ACCEPT — now create the RTQ
    const vectorEmbedding = embedder.embedSingle(`${question} ${category} ${(tags || []).join(' ')}`);
    const rtq = await RTQ.create({
      question,
      category,
      tags: tags || [],
      postedBy: req.user._id,
      vectorEmbedding,
      status: 'open',
      isAccepted: false
    });

    await awardQP(req.user._id, QP_RULES.QUESTION_ACCEPTED, 'Question accepted into RTQ', rtq._id);
    await notifyUser(req.user._id, req.user.role, 'question_accepted',
      `Question accepted and added to RTQ. +${QP_RULES.QUESTION_ACCEPTED} QP`, QP_RULES.QUESTION_ACCEPTED, rtq._id);

    res.status(201).json({ ...result, rtqId: rtq._id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
}

export async function addAnswer(req, res) {
  try {
    const { answer } = req.body;
    if (!answer) return res.status(400).json({ message: 'answer is required' });

    const rtq = await RTQ.findById(req.params.id);
    if (!rtq) return res.status(404).json({ message: 'RTQ not found' });

    const existingAnswer = await Answer.findOne({ questionId: rtq._id, userId: req.user._id });
    if (existingAnswer) {
      return res.status(400).json({ message: 'You have already answered this question' });
    }

    const newAnswer = await Answer.create({
      questionId: rtq._id,
      userId: req.user._id,
      answer
    });

    rtq.answers.push(newAnswer._id);
    await rtq.save();

    const qpAmount = req.user.role === 'senior' ? QP_RULES.SENIOR_ANSWER : QP_RULES.ANSWER_QUESTION;
    await awardQP(req.user._id, qpAmount, 'Answered a question', newAnswer._id);
    await notifyUser(req.user._id, req.user.role, 'answer_added',
      `You answered a question. +${qpAmount} QP`, qpAmount, newAnswer._id);

    if (rtq.postedBy.toString() !== req.user._id.toString()) {
      await notifyUser(rtq.postedBy, 'student', 'new_answer',
        `Your question received an answer from ${req.user.name}`, 0, rtq._id);
    }

    res.status(201).json(newAnswer);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
}

export async function upvoteAnswer(req, res) {
  try {
    const answer = await Answer.findById(req.params.answerId);
    if (!answer) return res.status(404).json({ message: 'Answer not found' });

    const userId = req.user._id;
    const alreadyUpvoted = answer.upvotedBy.some(id => id.toString() === userId.toString());

    if (alreadyUpvoted) {
      answer.upvotedBy = answer.upvotedBy.filter(id => id.toString() !== userId.toString());
      answer.upvotes = Math.max(0, answer.upvotes - 1);
    } else {
      answer.upvotedBy.push(userId);
      answer.upvotes += 1;
    }

    await answer.save();
    res.json({ upvotes: answer.upvotes, upvoted: !alreadyUpvoted });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
}

export async function approveAnswer(req, res) {
  try {
    const answer = await Answer.findById(req.params.answerId);
    if (!answer) return res.status(404).json({ message: 'Answer not found' });

    const rtq = await RTQ.findById(answer.questionId);
    if (!rtq) return res.status(404).json({ message: 'RTQ not found' });

    answer.isApproved = true;
    answer.approvedBy = req.user._id;
    await answer.save();

    if (!rtq.approvedAnswer) {
      rtq.approvedAnswer = answer._id;
      await rtq.save();
    }

    const qpAmount = req.user.role === 'senior' ? QP_RULES.SENIOR_APPROVE_ANSWER : QP_RULES.MODERATOR_APPROVE_ANSWER;
    await awardQP(req.user._id, qpAmount, `${req.user.role} approved an answer`, answer._id);
    await awardQP(answer.userId, QP_RULES.ANSWER_APPROVED, 'Answer approved', answer._id);

    await notifyUser(answer.userId, 'student', 'answer_approved',
      `Your answer was approved. +${QP_RULES.ANSWER_APPROVED} QP`, QP_RULES.ANSWER_APPROVED, answer._id);

    res.json({ message: 'Answer approved', answer });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
}

export async function markAccepted(req, res) {
  try {
    const rtq = await RTQ.findById(req.params.id);
    if (!rtq) return res.status(404).json({ message: 'RTQ not found' });

    rtq.isAccepted = true;
    rtq.status = 'resolved';
    rtq.acceptedBy = req.user._id;
    await rtq.save();

    // FIX #12: Only award QP to the moderator/senior — questioner already got +5 at submission
    const qpAmount = req.user.role === 'senior' ? QP_RULES.SENIOR_APPROVE_ANSWER : QP_RULES.MODERATOR_MARK_ACCEPTED;
    await awardQP(req.user._id, qpAmount, `${req.user.role} accepted question`, rtq._id);

    await notifyUser(rtq.postedBy, 'student', 'question_accepted',
      `Your question was accepted by a ${req.user.role}.`, 0, rtq._id);

    res.json({ message: 'Question accepted', rtq });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
}

export async function removeRTQ(req, res) {
  try {
    const rtq = await RTQ.findById(req.params.id);
    if (!rtq) return res.status(404).json({ message: 'RTQ not found' });

    await deductQP(rtq.postedBy, Math.abs(QP_RULES.PENALTY_QUESTION_REMOVED),
      'Question removed by senior', rtq._id);
    await notifyUser(rtq.postedBy, 'student', 'question_removed',
      `Your question was removed. ${QP_RULES.PENALTY_QUESTION_REMOVED} QP`, QP_RULES.PENALTY_QUESTION_REMOVED, rtq._id);

    await RTQ.findByIdAndDelete(req.params.id);
    res.json({ message: 'RTQ removed' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
}

export async function reportRTQ(req, res) {
  try {
    const rtq = await RTQ.findById(req.params.id);
    if (!rtq) return res.status(404).json({ message: 'RTQ not found' });

    if (!rtq.reports.includes(req.user._id)) {
      rtq.reports.push(req.user._id);
      await rtq.save();
    }

    res.json({ message: 'Report recorded' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
}

export async function convertToFAQ(req, res) {
  try {
    // FIX #3: Populate answers with userId so we can identify the senior's own answer
    const rtq = await RTQ.findById(req.params.id).populate({
      path: 'answers',
      populate: { path: 'userId', select: '_id name role' }
    });
    if (!rtq) return res.status(404).json({ message: 'RTQ not found' });

    // FIX #3: Sort answers by upvotes in JS (Mongoose populate options.sort is unreliable)
    const answers = [...(rtq.answers || [])].sort((a, b) => b.upvotes - a.upvotes);

    // Auto-select: Senior's own answer > Senior-approved > Most upvoted
    let selectedAnswer = null;
    let selectedAnswerDoc = null;

    for (const ans of answers) {
      if (ans.userId?._id?.toString() === req.user._id.toString()) {
        selectedAnswer = ans.answer;
        selectedAnswerDoc = ans;
        break;
      }
    }
    if (!selectedAnswer) {
      for (const ans of answers) {
        if (ans.approvedBy?.toString() === req.user._id.toString()) {
          selectedAnswer = ans.answer;
          selectedAnswerDoc = ans;
          break;
        }
      }
    }
    if (!selectedAnswer && answers.length > 0) {
      selectedAnswer = answers[0].answer;
      selectedAnswerDoc = answers[0];
    }

    if (!selectedAnswer) {
      return res.status(400).json({ message: 'No answer available to convert' });
    }

    const faq = await FAQ.create({
      question: rtq.question,
      answer: selectedAnswer,
      category: rtq.category,
      tags: rtq.tags,
      createdBy: req.user._id
    });

    if (selectedAnswerDoc) {
      selectedAnswerDoc.isSelectedForFAQ = true;
      await selectedAnswerDoc.save();
      await awardQP(selectedAnswerDoc.userId._id, QP_RULES.ANSWER_SELECTED_FOR_FAQ, 'Answer selected for FAQ', selectedAnswerDoc._id);
      await notifyUser(selectedAnswerDoc.userId._id, 'student', 'answer_selected_for_faq',
        `Your answer was selected for FAQ. +${QP_RULES.ANSWER_SELECTED_FOR_FAQ} QP`, QP_RULES.ANSWER_SELECTED_FOR_FAQ, selectedAnswerDoc._id);
    }

    await awardQP(req.user._id, QP_RULES.SENIOR_CONVERT_RTQ_TO_FAQ, 'Converted RTQ to FAQ', faq._id);
    await awardQP(rtq.postedBy, QP_RULES.QUESTION_ADDED_TO_FAQ, 'Question added to FAQ', rtq._id);
    await notifyUser(rtq.postedBy, 'student', 'question_added_to_faq',
      `Your question was added to FAQs. +${QP_RULES.QUESTION_ADDED_TO_FAQ} QP`, QP_RULES.QUESTION_ADDED_TO_FAQ, rtq._id);

    res.status(201).json({ message: 'Converted to FAQ', faq });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
}
