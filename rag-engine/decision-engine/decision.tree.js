import { cosineSimilarity } from '../similarity/cosine.similarity.js';
import { RAG_THRESHOLDS } from '../../shared/constants.js';
import faqVectorDB from '../vectorDB/faq-vector.js';
import rtqVectorDB from '../vectorDB/rtq-vector.js';
import embedder from '../embedding/embedder.js';

export async function evaluateQuestion(questionText) {
  const questionEmbedding = await embedder.embedSingleAsync(questionText);
  const qMag = Math.sqrt(questionEmbedding.reduce((s, v) => s + v * v, 0));
  console.log(`[DecisionTree] Question: "${questionText.substring(0, 40)}", embedding mag: ${qMag.toFixed(4)}, first5: ${questionEmbedding.slice(0,5).map(v => v.toFixed(3)).join(',')}`);

  const topFAQs = await faqVectorDB.findMostSimilar(questionEmbedding, { limit: 10 });
  const bestFAQ = topFAQs[0];
  const faqScore = bestFAQ ? bestFAQ.score : 0;
  console.log(`[DecisionTree] Best FAQ: "${bestFAQ?.faq?.question?.substring(0, 40)}", score: ${faqScore.toFixed(4)}, vecMag: ${bestFAQ ? Math.sqrt(bestFAQ.faq.vectorEmbedding.reduce((s, v) => s + v * v, 0)).toFixed(4) : 'N/A'}`);

  if (faqScore > RAG_THRESHOLDS.FAQ_F1) {
    return {
      status: 'REJECT',
      shouldAutoUpvoteFAQ: true,
      autoUpvoteFAQId: bestFAQ.faq._id,
      matchedFAQ: { _id: bestFAQ.faq._id, question: bestFAQ.faq.question, answer: bestFAQ.faq.answer },
      penalty: -5,
      faqScore,
      rtqScore: 0,
      reason: 'F1: Strong FAQ match (>80%)'
    };
  }

  const topRTQs = await rtqVectorDB.findMostSimilar(questionEmbedding, { limit: 10 });
  const bestRTQ = topRTQs[0];
  const rtqScore = bestRTQ ? bestRTQ.score : 0;

  if (faqScore > RAG_THRESHOLDS.FAQ_F2_MIN && faqScore <= RAG_THRESHOLDS.FAQ_F1) {
    if (rtqScore > RAG_THRESHOLDS.RTQ_R1) {
      return {
        status: 'REJECT',
        shouldAutoUpvoteFAQ: true,
        autoUpvoteFAQId: bestFAQ.faq._id,
        matchedFAQ: { _id: bestFAQ.faq._id, question: bestFAQ.faq.question, answer: bestFAQ.faq.answer },
        matchedRTQ: { _id: bestRTQ.rtq._id, question: bestRTQ.rtq.question },
        penalty: -5,
        faqScore,
        rtqScore,
        reason: 'F2+R1: FAQ medium match (>50%) + RTQ high match (>60%)'
      };
    }
    if (rtqScore > RAG_THRESHOLDS.RTQ_R2_MIN && rtqScore <= RAG_THRESHOLDS.RTQ_R1) {
      return {
        status: 'REJECT',
        shouldAutoUpvoteFAQ: false,
        matchedFAQ: { _id: bestFAQ.faq._id, question: bestFAQ.faq.question, answer: bestFAQ.faq.answer },
        matchedRTQ: { _id: bestRTQ.rtq._id, question: bestRTQ.rtq.question },
        penalty: 0,
        faqScore,
        rtqScore,
        reason: 'F2+R2: FAQ medium match (50-80%) + RTQ medium match (20-60%)'
      };
    }
    return {
      status: 'ACCEPT',
      shouldAutoUpvoteFAQ: false,
      target: 'RTQ',
      matchedFAQ: { _id: bestFAQ.faq._id, question: bestFAQ.faq.question, answer: bestFAQ.faq.answer },
      matchedRTQ: null,
      penalty: 0,
      faqScore,
      rtqScore,
      reason: 'F2+R3: FAQ medium match (50-80%) + RTQ low match (<=20%) -> Accept to RTQ'
    };
  }

  if (faqScore <= RAG_THRESHOLDS.FAQ_F2_MIN) {
    if (rtqScore > RAG_THRESHOLDS.RTQ_R1) {
      return {
        status: 'REJECT',
        shouldAutoUpvoteFAQ: false,
        matchedFAQ: bestFAQ ? { _id: bestFAQ.faq._id, question: bestFAQ.faq.question, answer: bestFAQ.faq.answer } : null,
        matchedRTQ: { _id: bestRTQ.rtq._id, question: bestRTQ.rtq.question },
        penalty: 0,
        faqScore,
        rtqScore,
        reason: 'F3+R1: FAQ low match (<=50%) + RTQ high match (>60%)'
      };
    }
    return {
      status: 'ACCEPT',
      shouldAutoUpvoteFAQ: false,
      target: 'RTQ',
      matchedFAQ: bestFAQ ? { _id: bestFAQ.faq._id, question: bestFAQ.faq.question, answer: bestFAQ.faq.answer } : null,
      matchedRTQ: null,
      penalty: 0,
      faqScore,
      rtqScore,
      reason: 'F3+R2/R3: FAQ low match (<=50%) + RTQ <= 60% -> Accept to RTQ'
    };
  }

  return {
    status: 'ACCEPT',
    shouldAutoUpvoteFAQ: false,
    target: 'RTQ',
    matchedFAQ: null,
    matchedRTQ: null,
    penalty: 0,
    faqScore,
    rtqScore,
    reason: 'Fallback: Accept to RTQ'
  };
}
