/**
 * Auto-Upvote Service
 * ===================
 *
 * Handles automatic upvoting of FAQ and RTQ questions triggered by RAG
 * duplicate detection decisions.
 *
 * USAGE:
 * - F1 case: autoUpvoteFAQ(faqId, userId) — upvote the matched FAQ
 * - F2+R1 case: autoUpvoteFAQ(faqId, userId) — upvote the matched FAQ
 * - F3+R1 case: autoUpvoteRTQ(rtqId, userId) — upvote the matched RTQ
 *
 * DUPLICATE PREVENTION:
 * Uses MongoDB $addToSet to atomically prevent duplicate upvotes
 * from the same user-question pair.
 *
 * This service consolidates auto-upvote logic that was previously
 * scattered across rag-engine/vectorDB/faq-vector.js and rtq-vector.js.
 */

import FAQ from '../models/FAQ.model.js';
import RTQ from '../models/RTQ.model.js';
import logger from '../utils/logger.js';

/**
 * Auto-upvote a FAQ question. Uses atomic $inc + $addToSet to prevent
 * duplicate upvotes for the same user-FAQ pair.
 *
 * @param {string} faqId - MongoDB FAQ document _id
 * @param {string} userId - The user who triggered the duplicate detection
 * @returns {{ success: boolean, reason: string, upvotes?: number }}
 */
export async function autoUpvoteFAQ(faqId, userId) {
  try {
    const faq = await FAQ.findById(faqId);
    if (!faq) return { success: false, reason: 'FAQ not found' };

    // Check if user already upvoted this FAQ
    const alreadyUpvoted = faq.upvotedBy.some(
      id => id.toString() === userId.toString()
    );
    if (alreadyUpvoted) {
      return { success: false, reason: 'already_upvoted', upvotes: faq.upvotes };
    }

    // Atomic update: increment upvotes and add user to upvotedBy
    const updated = await FAQ.findByIdAndUpdate(
      faqId,
      {
        $inc: { upvotes: 1 },
        $addToSet: { upvotedBy: userId }
      },
      { new: true }
    );

    logger.info(`[AutoUpvote] FAQ ${faqId} auto-upvoted by user ${userId}`);
    return { success: true, reason: 'auto_upvoted', upvotes: updated.upvotes };
  } catch (err) {
    logger.error(`[AutoUpvote] FAQ auto-upvote failed for ${faqId}:`, err.message);
    return { success: false, reason: err.message };
  }
}

/**
 * Auto-upvote an RTQ question. Uses atomic $inc + $addToSet to prevent
 * duplicate upvotes for the same user-RTQ pair.
 *
 * @param {string} rtqId - MongoDB RTQ document _id
 * @param {string} userId - The user who triggered the duplicate detection
 * @returns {{ success: boolean, reason: string, upvotes?: number }}
 */
export async function autoUpvoteRTQ(rtqId, userId) {
  try {
    const rtq = await RTQ.findById(rtqId);
    if (!rtq) return { success: false, reason: 'RTQ not found' };

    // Check if user already upvoted this RTQ
    const alreadyUpvoted = rtq.upvotedBy.some(
      id => id.toString() === userId.toString()
    );
    if (alreadyUpvoted) {
      return { success: false, reason: 'already_upvoted', upvotes: rtq.upvotes };
    }

    // Atomic update: increment upvotes and add user to upvotedBy
    const updated = await RTQ.findByIdAndUpdate(
      rtqId,
      {
        $inc: { upvotes: 1 },
        $addToSet: { upvotedBy: userId }
      },
      { new: true }
    );

    logger.info(`[AutoUpvote] RTQ ${rtqId} auto-upvoted by user ${userId}`);
    return { success: true, reason: 'auto_upvoted', upvotes: updated.upvotes };
  } catch (err) {
    logger.error(`[AutoUpvote] RTQ auto-upvote failed for ${rtqId}:`, err.message);
    return { success: false, reason: err.message };
  }
}

/**
 * Get the author (createdBy) of a FAQ document.
 * @param {string} faqId
 * @returns {ObjectId|null}
 */
export async function getFAQAuthorId(faqId) {
  try {
    const faq = await FAQ.findById(faqId).select('createdBy');
    return faq ? faq.createdBy : null;
  } catch (err) {
    logger.error(`[AutoUpvote] getFAQAuthorId failed for ${faqId}:`, err.message);
    return null;
  }
}

/**
 * Get the author (postedBy) of an RTQ document.
 * @param {string} rtqId
 * @returns {ObjectId|null}
 */
export async function getRTQAuthorId(rtqId) {
  try {
    const rtq = await RTQ.findById(rtqId).select('postedBy');
    return rtq ? rtq.postedBy : null;
  } catch (err) {
    logger.error(`[AutoUpvote] getRTQAuthorId failed for ${rtqId}:`, err.message);
    return null;
  }
}
