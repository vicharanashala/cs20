import FAQConversionRequest from '../models/FAQConversionRequest.model.js';
import RTQ from '../models/RTQ.model.js';
import FAQ from '../models/FAQ.model.js';
import Answer from '../models/Answer.model.js';
import { awardQP } from '../services/qp.service.js';
import { notifyUser } from '../services/notification.service.js';
import { QP_RULES } from '../../../shared/constants.js';

export async function createConversionRequest(req, res) {
  try {
    const { rtqId, suggestedAnswer } = req.body;
    const rtq = await RTQ.findById(rtqId).populate('answers').populate('postedBy', 'name');
    if (!rtq) return res.status(404).json({ message: 'RTQ not found' });

    const existing = await FAQConversionRequest.findOne({ rtqId, status: 'pending' });
    if (existing) return res.status(400).json({ message: 'A conversion request already exists for this RTQ' });

    let topAnswer = null;
    if (rtq.answers?.length > 0) {
      const sorted = [...rtq.answers].sort((a, b) => b.upvotes - a.upvotes);
      topAnswer = sorted[0]?.answer || null;
    }

    const request = await FAQConversionRequest.create({
      rtqId,
      rtqQuestion: rtq.question,
      rtqAnswer: topAnswer,
      suggestedAnswer: suggestedAnswer || null,
      requestedBy: req.user._id
    });

    await notifyUser(req.user._id, req.user.role, 'faq_conversion_requested',
      `Your FAQ conversion request for "${rtq.question.slice(0, 50)}" has been submitted for admin review.`, 0, rtqId);

    res.status(201).json({ message: 'Conversion request submitted', request });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
}

export async function listConversionRequests(req, res) {
  try {
    const { status } = req.query;
    const filter = status ? { status } : {};
    const requests = await FAQConversionRequest.find(filter)
      .populate('requestedBy', 'name role')
      .populate('reviewedBy', 'name role')
      .sort({ requestedAt: -1 });
    res.json(requests);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
}

export async function approveConversionRequest(req, res) {
  try {
    const request = await FAQConversionRequest.findById(req.params.id);
    if (!request) return res.status(404).json({ message: 'Request not found' });
    if (request.status !== 'pending') return res.status(400).json({ message: 'Request already processed' });

    const rtq = await RTQ.findById(request.rtqId);
    if (!rtq) return res.status(404).json({ message: 'RTQ not found' });

    const answerToUse = request.suggestedAnswer || request.rtqAnswer;
    if (!answerToUse) return res.status(400).json({ message: 'No answer available for FAQ conversion' });

    const faq = await FAQ.create({
      question: request.rtqQuestion,
      answer: answerToUse,
      category: rtq.category,
      tags: rtq.tags,
      createdBy: request.requestedBy
    });

    request.status = 'approved';
    request.reviewedAt = new Date();
    request.reviewedBy = req.user._id;
    await request.save();

    await awardQP(request.requestedBy, QP_RULES.QUESTION_ADDED_TO_FAQ,
      'FAQ conversion request approved', faq._id);
    await awardQP(req.user._id, QP_RULES.SENIOR_CONVERT_RTQ_TO_FAQ,
      'Approved FAQ conversion request', faq._id);

    await notifyUser(request.requestedBy, 'student',
      'faq_conversion_approved',
      `Your FAQ conversion request was approved. +${QP_RULES.QUESTION_ADDED_TO_FAQ} QP`,
      QP_RULES.QUESTION_ADDED_TO_FAQ, faq._id);

    res.json({ message: 'Conversion request approved', faq });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
}

export async function rejectConversionRequest(req, res) {
  try {
    const { adminNote } = req.body;
    const request = await FAQConversionRequest.findById(req.params.id);
    if (!request) return res.status(404).json({ message: 'Request not found' });
    if (request.status !== 'pending') return res.status(400).json({ message: 'Request already processed' });

    request.status = 'rejected';
    request.reviewedAt = new Date();
    request.reviewedBy = req.user._id;
    request.adminNote = adminNote || null;
    await request.save();

    await notifyUser(request.requestedBy, 'student',
      'faq_conversion_rejected',
      `Your FAQ conversion request was rejected.${adminNote ? ` Note: ${adminNote}` : ''}`,
      0, request.rtqId);

    res.json({ message: 'Conversion request rejected', request });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
}