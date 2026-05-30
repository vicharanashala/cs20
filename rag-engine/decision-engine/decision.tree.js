/**
 * Decision Tree — RAG Duplicate Detection Engine
 * ===============================================
 *
 * Evaluates incoming questions against existing FAQ and RTQ collections
 * using semantic similarity via Qdrant vector search.
 *
 * EMBEDDING: all-MiniLM-L6-v2 (384-dim, via @xenova/transformers)
 * SEARCH: Qdrant Cloud ANN (HNSW, cosine distance)
 * SCORING: Qdrant returns cosine similarity in [0, 1] where 1 = identical
 *
 * DECISION FLOW:
 * ──────────────
 * Step 1: Embed question → search FAQ collection (top-1)
 * Step 2: If F2 or F3 → search RTQ collection (top-1)
 * Step 3: Apply decision tree rules (thresholds unchanged)
 *
 * DECISION CASES:
 * ───────────────
 * F1 (FAQ > 80%):           REJECT, -5 QP, auto-upvote FAQ
 * F2+R1 (FAQ 50-80%, RTQ > 60%): REJECT, -5 QP, auto-upvote FAQ
 * F2+R2 (FAQ 50-80%, RTQ 20-60%): REJECT, no penalty
 * F2+R3 (FAQ 50-80%, RTQ ≤ 20%):  ACCEPT → RTQ
 * F3+R1 (FAQ ≤ 50%, RTQ > 60%):   REJECT, no penalty, auto-upvote RTQ
 * F3+R2 (FAQ ≤ 50%, RTQ 20-60%):  ACCEPT → RTQ
 * F3+R3 (FAQ ≤ 50%, RTQ ≤ 20%):   ACCEPT → RTQ
 *
 * NOTE: This module does NOT execute QP deduction or upvotes directly.
 * It returns flags (shouldAutoUpvoteFAQ, shouldAutoUpvoteRTQ, penalty)
 * that the calling controller (rtq.controller.js) acts on.
 */

import { RAG_THRESHOLDS } from '../../shared/constants.js';
import { generateEmbedding } from '../../server/src/services/vector/embedding.service.js';
import { searchFAQSimilarity } from '../../server/src/services/vector/faq.vector.service.js';
import { searchRTQSimilarity } from '../../server/src/services/vector/rtq.vector.service.js';

export async function evaluateQuestion(questionText) {
  // Step 1: Generate embedding using Sentence Transformer (all-MiniLM-L6-v2)
  const questionEmbedding = await generateEmbedding(questionText);
  console.log(`[DecisionTree] Question: "${questionText.substring(0, 40)}", embedding dim: ${questionEmbedding.length}`);

  // Step 2: Search FAQ collection via Qdrant (top-1 match)
  const topFAQs = await searchFAQSimilarity(questionEmbedding, { limit: 1 });
  const bestFAQ = topFAQs[0] || null;
  const faqScore = bestFAQ ? bestFAQ.score : 0;
  console.log(`[DecisionTree] Best FAQ: "${bestFAQ?.question?.substring(0, 40) || 'none'}", score: ${faqScore.toFixed(4)}`);

  // ─── CASE F1: FAQ > 80% ─── REJECT + penalty + auto-upvote FAQ ───
  if (faqScore > RAG_THRESHOLDS.FAQ_F1) {
    return {
      status: 'REJECT',
      shouldAutoUpvoteFAQ: true,
      autoUpvoteFAQId: bestFAQ.mongoId,
      shouldAutoUpvoteRTQ: false,
      autoUpvoteRTQId: null,
      matchedFAQ: { _id: bestFAQ.mongoId, question: bestFAQ.question, answer: bestFAQ.answer },
      penalty: -5,
      faqScore,
      rtqScore: 0,
      reason: 'F1: Strong FAQ match (>80%)'
    };
  }

  // Step 3: Search RTQ collection via Qdrant (top-1 match) — only for F2/F3
  const topRTQs = await searchRTQSimilarity(questionEmbedding, { limit: 1 });
  const bestRTQ = topRTQs[0] || null;
  const rtqScore = bestRTQ ? bestRTQ.score : 0;
  console.log(`[DecisionTree] Best RTQ: "${bestRTQ?.question?.substring(0, 40) || 'none'}", score: ${rtqScore.toFixed(4)}`);

  // ─── CASE F2: FAQ 50-80% ───
  if (faqScore > RAG_THRESHOLDS.FAQ_F2_MIN && faqScore <= RAG_THRESHOLDS.FAQ_F1) {

    // F2+R1: RTQ > 60% → REJECT + penalty + auto-upvote FAQ
    if (rtqScore > RAG_THRESHOLDS.RTQ_R1) {
      return {
        status: 'REJECT',
        shouldAutoUpvoteFAQ: true,
        autoUpvoteFAQId: bestFAQ.mongoId,
        shouldAutoUpvoteRTQ: false,
        autoUpvoteRTQId: null,
        matchedFAQ: { _id: bestFAQ.mongoId, question: bestFAQ.question, answer: bestFAQ.answer },
        matchedRTQ: { _id: bestRTQ.mongoId, question: bestRTQ.question },
        penalty: -5,
        faqScore,
        rtqScore,
        reason: 'F2+R1: FAQ medium match (>50%) + RTQ high match (>60%)'
      };
    }

    // F2+R2: RTQ 20-60% → REJECT, no penalty
    if (rtqScore > RAG_THRESHOLDS.RTQ_R2_MIN && rtqScore <= RAG_THRESHOLDS.RTQ_R1) {
      return {
        status: 'REJECT',
        shouldAutoUpvoteFAQ: false,
        autoUpvoteFAQId: null,
        shouldAutoUpvoteRTQ: false,
        autoUpvoteRTQId: null,
        matchedFAQ: { _id: bestFAQ.mongoId, question: bestFAQ.question, answer: bestFAQ.answer },
        matchedRTQ: { _id: bestRTQ.mongoId, question: bestRTQ.question },
        penalty: 0,
        faqScore,
        rtqScore,
        reason: 'F2+R2: FAQ medium match (50-80%) + RTQ medium match (20-60%)'
      };
    }

    // F2+R3: RTQ ≤ 20% → ACCEPT → RTQ
    return {
      status: 'ACCEPT',
      shouldAutoUpvoteFAQ: false,
      autoUpvoteFAQId: null,
      shouldAutoUpvoteRTQ: false,
      autoUpvoteRTQId: null,
      target: 'RTQ',
      matchedFAQ: { _id: bestFAQ.mongoId, question: bestFAQ.question, answer: bestFAQ.answer },
      matchedRTQ: null,
      penalty: 0,
      faqScore,
      rtqScore,
      reason: 'F2+R3: FAQ medium match (50-80%) + RTQ low match (<=20%) -> Accept to RTQ'
    };
  }

  // ─── CASE F3: FAQ ≤ 50% ───
  if (faqScore <= RAG_THRESHOLDS.FAQ_F2_MIN) {

    // F3+R1: RTQ > 60% → REJECT, no penalty, auto-upvote RTQ
    if (rtqScore > RAG_THRESHOLDS.RTQ_R1) {
      return {
        status: 'REJECT',
        shouldAutoUpvoteFAQ: false,
        autoUpvoteFAQId: null,
        shouldAutoUpvoteRTQ: true,
        autoUpvoteRTQId: bestRTQ.mongoId,
        matchedFAQ: bestFAQ ? { _id: bestFAQ.mongoId, question: bestFAQ.question, answer: bestFAQ.answer } : null,
        matchedRTQ: { _id: bestRTQ.mongoId, question: bestRTQ.question },
        penalty: 0,
        faqScore,
        rtqScore,
        reason: 'F3+R1: FAQ low match (<=50%) + RTQ high match (>60%)'
      };
    }

    // F3+R2/R3: RTQ ≤ 60% → ACCEPT → RTQ
    return {
      status: 'ACCEPT',
      shouldAutoUpvoteFAQ: false,
      autoUpvoteFAQId: null,
      shouldAutoUpvoteRTQ: false,
      autoUpvoteRTQId: null,
      target: 'RTQ',
      matchedFAQ: bestFAQ ? { _id: bestFAQ.mongoId, question: bestFAQ.question, answer: bestFAQ.answer } : null,
      matchedRTQ: null,
      penalty: 0,
      faqScore,
      rtqScore,
      reason: 'F3+R2/R3: FAQ low match (<=50%) + RTQ <= 60% -> Accept to RTQ'
    };
  }

  // ─── FALLBACK: Accept to RTQ ───
  return {
    status: 'ACCEPT',
    shouldAutoUpvoteFAQ: false,
    autoUpvoteFAQId: null,
    shouldAutoUpvoteRTQ: false,
    autoUpvoteRTQId: null,
    target: 'RTQ',
    matchedFAQ: null,
    matchedRTQ: null,
    penalty: 0,
    faqScore,
    rtqScore,
    reason: 'Fallback: Accept to RTQ'
  };
}
