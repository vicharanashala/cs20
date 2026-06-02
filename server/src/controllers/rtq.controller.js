import RTQ from '../models/RTQ.model.js';
import Answer from '../models/Answer.model.js';
import FAQ from '../models/FAQ.model.js';
import User from '../models/User.model.js';
import { awardQP, deductQP } from '../services/qp.service.js';
import { notifyUser } from '../services/notification.service.js';
import { QP_RULES } from '../../../shared/constants.js';
import { generateEmbedding } from '../services/vector/embedding.service.js';
import { evaluateQuestion } from '../../../rag-engine/decision-engine/decision.tree.js';
import { syncRTQInsert, syncRTQDelete, rollbackRTQInsert } from '../services/sync/rtq.sync.service.js';
import { syncFAQInsert } from '../services/sync/faq.sync.service.js';
import { autoUpvoteFAQ, autoUpvoteRTQ, getFAQAuthorId, getRTQAuthorId } from '../services/autoupvote.service.js';
import logger from '../utils/logger.js';

export async function listRTQs(req, res) {
  try {
    const { sort = 'upvotes', filter, category, page = 1, limit = 50 } = req.query;
    const pageNum = Math.max(1, parseInt(page, 10));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10)));

    let allRtqs = await RTQ.find()
      .populate('postedBy', 'name role')
      .populate({
        path: 'answers',
        populate: { path: 'userId', select: 'name role' }
      })
      .sort({ [sort]: -1, createdAt: -1 })
      .lean();

    if (filter === 'unresolved') {
      allRtqs = allRtqs.filter(r => ['unresolved', 'open'].includes(r.status) && !r.isAccepted);
    } else if (filter === 'resolved') {
      allRtqs = allRtqs.filter(r => r.status === 'resolved' || r.isAccepted);
    } else if (filter === 'partial') {
      allRtqs = allRtqs.filter(r => r.status === 'partially_resolved' || (r.answers?.length > 0 && !r.isAccepted));
    }

    if (category) {
      let normalizedCategory = category.replace(/[\u2010-\u2015\u2212]/g, '-').replace(/\s*-\s*/g, ' - ');
      const escapedCategory = normalizedCategory.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
      const categoryPattern = escapedCategory.replace('\\ -\\ ', '\\s*[\\u2010-\\u2015\\u2212\\-]\\s*');
      const regex = new RegExp(`^(?:\\d+\\.\\s*)?${categoryPattern}$`, 'i');
      allRtqs = allRtqs.filter(r => r.category && regex.test(r.category));
    }

    const total = allRtqs.length;
    const paginated = allRtqs.slice((pageNum - 1) * limitNum, pageNum * limitNum);

    res.json({ data: paginated, pagination: { page: pageNum, limit: limitNum, total } });
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

    const result = await evaluateQuestion(question);

    if (result.status === 'REJECT') {
      if (result.penalty < 0) {
        await deductQP(req.user._id, Math.abs(result.penalty), `Question rejected: ${result.reason}`, null);
        await notifyUser(req.user._id, req.user.role, 'question_rejected',
          `Question rejected (duplicate). ${result.penalty} QP`, result.penalty, null);
      }

      let faqAutoUpvoteDone = false;
      if (result.shouldAutoUpvoteFAQ && result.autoUpvoteFAQId) {
        const faqResult = await autoUpvoteFAQ(result.autoUpvoteFAQId, req.user._id);
        if (faqResult.success) {
          const faqAuthorId = await getFAQAuthorId(result.autoUpvoteFAQId);
          if (faqAuthorId && faqAuthorId.toString() !== req.user._id.toString()) {
            await awardQP(faqAuthorId, QP_RULES.QUESTION_UPVOTE_BONUS,
              `Auto-upvote from RAG duplicate detection on FAQ: ${result.matchedFAQ.question.slice(0, 50)}`,
              result.autoUpvoteFAQId);
            await notifyUser(faqAuthorId, 'student', 'faq_upvote_received',
              `Your FAQ received an auto-upvote via RAG duplicate detection. +${QP_RULES.QUESTION_UPVOTE_BONUS} QP`,
              QP_RULES.QUESTION_UPVOTE_BONUS, result.autoUpvoteFAQId);
          }
          logger.info(`[RAG] Auto-upvoted FAQ ${result.autoUpvoteFAQId} for user ${req.user._id} — ${faqResult.reason}`);
          faqAutoUpvoteDone = true;
        } else {
          logger.info(`[RAG] FAQ ${result.autoUpvoteFAQId} auto-upvote skipped: ${faqResult.reason}`);
        }
      }

      // RTQ auto-upvote (F3+R1 case)
      let rtqAutoUpvoteDone = false;
      if (result.shouldAutoUpvoteRTQ && result.autoUpvoteRTQId) {
        const rtqResult = await autoUpvoteRTQ(result.autoUpvoteRTQId, req.user._id);
        if (rtqResult.success) {
          const rtqAuthorId = await getRTQAuthorId(result.autoUpvoteRTQId);
          if (rtqAuthorId && rtqAuthorId.toString() !== req.user._id.toString()) {
            await awardQP(rtqAuthorId, QP_RULES.QUESTION_UPVOTE_BONUS,
              `Auto-upvote from RAG duplicate detection on RTQ: ${result.matchedRTQ.question.slice(0, 50)}`,
              result.autoUpvoteRTQId);
            await notifyUser(rtqAuthorId, 'student', 'rtq_upvote_received',
              `Your RTQ received an auto-upvote via RAG duplicate detection. +${QP_RULES.QUESTION_UPVOTE_BONUS} QP`,
              QP_RULES.QUESTION_UPVOTE_BONUS, result.autoUpvoteRTQId);
          }
          logger.info(`[RAG] Auto-upvoted RTQ ${result.autoUpvoteRTQId} for user ${req.user._id} — ${rtqResult.reason}`);
          rtqAutoUpvoteDone = true;
        } else {
          logger.info(`[RAG] RTQ ${result.autoUpvoteRTQId} auto-upvote skipped: ${rtqResult.reason}`);
        }
      }

      return res.status(200).json({ ...result, faqAutoUpvoteDone, rtqAutoUpvoteDone });
    }

    const vectorEmbedding = await generateEmbedding(`${question} ${category} ${(tags || []).join(' ')}`);
    const rtq = await RTQ.create({
      question,
      category,
      tags: tags || [],
      postedBy: req.user._id,
      vectorEmbedding,
      status: 'unresolved',
      isAccepted: false
    });

    try {
      await syncRTQInsert(rtq);
    } catch (vecErr) {
      logger.error(`[RTQ-Controller] Qdrant sync failed for RTQ ${rtq._id} — rolling back MongoDB`);
      await rollbackRTQInsert(rtq._id);
      return res.status(500).json({ message: 'Failed to index question in vector store', error: vecErr.message });
    }

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

    const wasAlreadyResolved = rtq.status === 'resolved';

    const newAnswer = await Answer.create({
      questionId: rtq._id,
      userId: req.user._id,
      answer
    });

    rtq.answers.push(newAnswer._id);
    if (!wasAlreadyResolved && (req.user.role === 'senior' || req.user.role === 'admin')) {
      rtq.status = 'resolved';
    }
    await rtq.save();

    if (!wasAlreadyResolved) {
      const qpAmount = req.user.role === 'senior' || req.user.role === 'admin' ? QP_RULES.SENIOR_ANSWER : QP_RULES.ANSWER_QUESTION;
      await awardQP(req.user._id, qpAmount, 'Answered a question', newAnswer._id);
      await notifyUser(req.user._id, req.user.role, 'answer_added',
        `You answered a question. +${qpAmount} QP`, qpAmount, newAnswer._id);
    }

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

    // check max 2 approvals per question per moderator
    const userApprovalsCount = await Answer.countDocuments({
      questionId: answer.questionId,
      approvals: req.user._id
    });
    if (userApprovalsCount >= 2 && !answer.approvals.includes(req.user._id)) {
      return res.status(400).json({ message: 'You have reached the maximum of 2 approvals per question' });
    }

    if (answer.approvals.some(id => id.toString() === req.user._id.toString())) {
      return res.status(400).json({ message: 'You have already approved this answer' });
    }

    // Change of decision: If previously rejected by this moderator, remove their rejection first!
    if (answer.rejections.some(id => id.toString() === req.user._id.toString())) {
      answer.rejections = answer.rejections.filter(id => id.toString() !== req.user._id.toString());
      // Revert the rejection reward for moderator (+3 QP -> deduct 3 QP)
      await deductQP(req.user._id, 3, 'Reverted answer rejection: changed decision to Approve', answer._id);
      // Revert the rejection penalty for answerer (-3 QP -> award +3 QP)
      await awardQP(answer.userId, 3, 'Reverted answer rejection: changed decision to Approve', answer._id);
    }

    // Add to approvals
    answer.approvals.push(req.user._id);

    answer.isApproved = true;
    answer.approvedBy = req.user._id;
    await answer.save();

    if (!rtq.approvedAnswer) {
      rtq.approvedAnswer = answer._id;
      await rtq.save();
    }

    if (rtq.status !== 'resolved') {
      const qpAmount = req.user.role === 'senior' || req.user.role === 'admin' ? QP_RULES.SENIOR_APPROVE_ANSWER : 3;
      await awardQP(req.user._id, qpAmount, `${req.user.role} approved an answer`, answer._id);
      await awardQP(answer.userId, 5, 'Answer approved by moderator', answer._id);

      await notifyUser(answer.userId, 'student', 'answer_approved',
        `Your answer was approved. +5 QP`, 5, answer._id);
    }

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

    if (rtq.isAccepted) {
      return res.status(400).json({ message: 'Question is already accepted' });
    }

    const wasAlreadyResolved = rtq.status === 'resolved';

    // Change of decision: If previously rejected by this moderator, remove their rejection first!
    if (rtq.rejectedBy.some(id => id.toString() === req.user._id.toString())) {
      rtq.rejectedBy = rtq.rejectedBy.filter(id => id.toString() !== req.user._id.toString());
      // Revert the moderator's rejection reward (+3 QP -> deduct 3 QP)
      await deductQP(req.user._id, 3, 'Reverted question rejection: changed decision to Accept', rtq._id);
      if (rtq.rejectedBy.length === 0) {
        rtq.status = 'unresolved';
      }
    }

    rtq.isAccepted = true;
    rtq.status = 'resolved';
    rtq.acceptedBy = req.user._id;
    await rtq.save();

    if (!wasAlreadyResolved) {
      // Award +5 QP to questioner, +3 QP to moderator (or SENIOR_APPROVE_ANSWER if senior/admin)
      const qpAmount = req.user.role === 'senior' || req.user.role === 'admin' ? QP_RULES.SENIOR_APPROVE_ANSWER : 3;
      await awardQP(rtq.postedBy, 5, 'Question accepted by moderator', rtq._id);
      await awardQP(req.user._id, qpAmount, `${req.user.role} accepted question`, rtq._id);

      await notifyUser(rtq.postedBy, 'student', 'question_accepted',
        `Your question was accepted by a moderator. +5 QP`, 5, rtq._id);
    }

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

    await syncRTQDelete(req.params.id);

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
    const rtq = await RTQ.findById(req.params.id).populate({
      path: 'answers',
      populate: { path: 'userId', select: '_id name role' }
    });
    if (!rtq) return res.status(404).json({ message: 'RTQ not found' });

    const answers = [...(rtq.answers || [])].sort((a, b) => b.upvotes - a.upvotes);

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

    try {
      await syncRTQDelete(rtq._id);
      await syncFAQInsert(faq);
    } catch (vecErr) {
      logger.error(`[RTQ-Controller] RTQ→FAQ Qdrant sync failed: ${vecErr.message}`);
      return res.status(500).json({ message: 'Server error during vector sync' });
    }

    res.status(201).json({ message: 'Converted to FAQ', faq });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
}

export async function updateRTQStatus(req, res) {
  try {
    const { status } = req.body;
    if (!['unresolved', 'partially_resolved', 'resolved'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    const rtq = await RTQ.findById(req.params.questionId);
    if (!rtq) {
      return res.status(404).json({ message: 'Question not found' });
    }

    // Only owner (question creator) can change status
    if (rtq.postedBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Only the question owner can change the status' });
    }

    rtq.status = status;
    rtq.updatedAt = new Date();
    await rtq.save();

    res.json({ message: 'Status updated successfully', rtq });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
}

export async function rejectAnswer(req, res) {
  try {
    const answer = await Answer.findById(req.params.answerId);
    if (!answer) return res.status(404).json({ message: 'Answer not found' });

    if (answer.rejections.some(id => id.toString() === req.user._id.toString())) {
      return res.status(400).json({ message: 'You have already rejected this answer' });
    }

    const rtq = await RTQ.findById(answer.questionId);

    // Change of decision: If previously approved by this moderator, remove their approval first!
    if (answer.approvals.some(id => id.toString() === req.user._id.toString())) {
      answer.approvals = answer.approvals.filter(id => id.toString() !== req.user._id.toString());
      // Revert the approval reward for moderator (+3 QP -> deduct 3 QP)
      await deductQP(req.user._id, 3, 'Reverted answer approval: changed decision to Reject', answer._id);
      // Revert the approval reward for answerer (+5 QP -> deduct 5 QP)
      await deductQP(answer.userId, 5, 'Reverted answer approval: changed decision to Reject', answer._id);

      if (answer.approvals.length === 0) {
        answer.isApproved = false;
        answer.approvedBy = null;
        if (rtq && rtq.approvedAnswer?.toString() === answer._id.toString()) {
          rtq.approvedAnswer = null;
          await rtq.save();
        }
      }
    }

    // Add to rejections
    answer.rejections.push(req.user._id);
    await answer.save();

    // -3 QP to answerer, +3 QP to moderator
    await deductQP(answer.userId, 3, 'Answer rejected by moderator', answer._id);
    await awardQP(req.user._id, 3, 'Moderator rejected an answer', answer._id);

    await notifyUser(answer.userId, 'student', 'answer_rejected',
      `Your answer was marked as rejected by a moderator. -3 QP`, -3, answer._id);

    res.json({ message: 'Answer rejected', answer });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
}

export async function rejectQuestion(req, res) {
  try {
    const rtq = await RTQ.findById(req.params.id);
    if (!rtq) return res.status(404).json({ message: 'RTQ not found' });

    if (rtq.rejectedBy.some(id => id.toString() === req.user._id.toString())) {
      return res.status(400).json({ message: 'You have already rejected this question' });
    }

    // Change of decision: If previously accepted, remove the accept first!
    if (rtq.isAccepted) {
      rtq.isAccepted = false;
      const prevAcceptor = rtq.acceptedBy;
      rtq.acceptedBy = null;
      
      // Revert acceptor moderator's reward (+3 QP)
      if (prevAcceptor) {
        await deductQP(prevAcceptor, 3, 'Reverted question accept: question rejected later', rtq._id);
      }
      // Revert questioner's reward (+5 QP)
      await deductQP(rtq.postedBy, 5, 'Reverted question accept: question rejected later', rtq._id);
    }

    rtq.rejectedBy.push(req.user._id);

    // If another moderator rejects the same question (so count >= 2)
    if (rtq.rejectedBy.length >= 2) {
      await deductQP(rtq.postedBy, 5, 'Question permanently removed: rejected by multiple moderators', rtq._id);
      await awardQP(req.user._id, 3, 'Moderator rejected a question', rtq._id);
      
      await notifyUser(rtq.postedBy, 'student', 'question_removed',
        `Your question was permanently removed after being rejected by multiple moderators. -5 QP`, -5, rtq._id);

      await RTQ.findByIdAndDelete(rtq._id);
      await syncRTQDelete(rtq._id);

      return res.json({ message: 'Question rejected by multiple moderators and permanently removed', deleted: true });
    } else {
      // First rejection: set status to 'rejected'
      rtq.status = 'rejected';
      await rtq.save();

      await awardQP(req.user._id, 3, 'Moderator rejected a question', rtq._id);
      
      res.json({ message: 'Question marked as rejected', rtq, deleted: false });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
}

export async function markRTQForReview(req, res) {
  try {
    const rtq = await RTQ.findById(req.params.id);
    if (!rtq) return res.status(404).json({ message: 'RTQ not found' });

    rtq.markedForReview = true;
    await rtq.save();

    res.json({ message: 'Question marked for review', rtq });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
}

export async function markAnswerForReview(req, res) {
  try {
    const answer = await Answer.findById(req.params.answerId);
    if (!answer) return res.status(404).json({ message: 'Answer not found' });

    answer.markedForReview = true;
    await answer.save();

    res.json({ message: 'Answer marked for review', answer });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
}
