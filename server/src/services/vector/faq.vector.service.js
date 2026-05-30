/**
 * FAQ Vector Service
 * ==================
 *
 * Manages FAQ vectors in Qdrant (faq_collection).
 *
 * PAYLOAD STRUCTURE:
 * {
 *   mongoId: string,      // MongoDB FAQ document _id
 *   question: string,     // FAQ question text (for display/debug)
 *   answer: string,       // FAQ answer text (for display/debug)
 *   category: string,     // FAQ category (filterable)
 *   tags: string[],       // Tags array
 *   upvotes: number,      // Current upvote count
 *   createdBy: string,    // User mongoId who created it
 * }
 *
 * SYNC WITH MONGODB:
 * These methods should ONLY be called after successful MongoDB operations.
 * See faq.sync.service.js for transactional sync logic with rollback support.
 */

import { createHash } from 'crypto';
import { getQdrantClient, getCollectionNames, withRetry } from '../../config/qdrant.js';
import { generateEmbedding, buildFAQText, CORPUS_FAQ } from './embedding.service.js';
import logger from '../../utils/logger.js';

const { faq: COLLECTION } = getCollectionNames();

function mongoIdToUuid(mongoId) {
  const hash = createHash('sha1').update(mongoId.toString()).digest('hex');
  return `${hash.slice(0,8)}-${hash.slice(8,12)}-5${hash.slice(13,16)}-${hash.slice(16,20)}-${hash.slice(20,32)}`;
}
function buildPayload(faq) {
  return {
    mongoId: faq._id?.toString() || faq.mongoId,
    question: faq.question || '',
    answer: faq.answer || '',
    category: faq.category || 'General',
    tags: Array.isArray(faq.tags) ? faq.tags : [],
    upvotes: faq.upvotes || 0,
    createdBy: faq.createdBy?.toString() || '',
  };
}

export async function insertFAQVector(faq) {
  if (!faq || !faq._id) {
    throw new Error('[FAQ-Vector] insertFAQVector: faq must have _id');
  }

  const text = buildFAQText(faq);
  let embedding = await generateEmbedding(text, CORPUS_FAQ);

  if (!embedding || !Array.isArray(embedding) || embedding.length !== 384 || embedding.some(v => !Number.isFinite(v))) {
    logger.warn(`[FAQ-Vector] Invalid embedding for FAQ ${faq._id} — using zero vector (text: "${text?.substring(0, 50)}")`);
    embedding = new Array(384).fill(0);
  }

  const payload = buildPayload(faq);

  await withRetry(async () => {
    await getQdrantClient().upsert(COLLECTION, {
      wait: true,
      points: [
        {
          id: mongoIdToUuid(faq._id.toString()),
          vector: embedding,
          payload,
        },
      ],
    });
  }, 'insertFAQVector');

  logger.info(`[FAQ-Vector] Inserted vector for FAQ ${faq._id} (${faq.category})`);
  return { mongoId: faq._id.toString(), vector: embedding };
}

export async function searchFAQSimilarity(queryEmbedding, { limit = 5, category = null } = {}) {
  const filter = category
    ? { must: [{ key: 'category', match: { value: category } }] }
    : undefined;

  const results = await withRetry(async () => {
    return await getQdrantClient().search(COLLECTION, {
      vector: queryEmbedding,
      limit,
      filter,
      with_payload: true,
    });
  }, 'searchFAQSimilarity');

  return results.map(r => ({
    mongoId: r.payload?.mongoId,
    question: r.payload?.question,
    answer: r.payload?.answer,
    category: r.payload?.category,
    tags: r.payload?.tags,
    upvotes: r.payload?.upvotes,
    score: r.score,
  }));
}

export async function searchFAQByText(text, { limit = 5, category = null } = {}) {
  const embedding = await generateEmbedding(text, CORPUS_FAQ);
  return searchFAQSimilarity(embedding, { limit, category });
}

export async function updateFAQVector(faqId, updates) {
  const text = buildFAQText(updates);
  let embedding = await generateEmbedding(text, CORPUS_FAQ);

  if (!embedding || !Array.isArray(embedding) || embedding.length !== 384 || embedding.some(v => !Number.isFinite(v))) {
    logger.warn(`[FAQ-Vector] Invalid embedding for FAQ ${faqId} update — using zero vector`);
    embedding = new Array(384).fill(0);
  }

  const payload = buildPayload(updates);

  await withRetry(async () => {
    await getQdrantClient().upsert(COLLECTION, {
      wait: true,
      points: [
        {
          id: mongoIdToUuid(faqId.toString()),
          vector: embedding,
          payload,
        },
      ],
    });
  }, 'updateFAQVector');

  logger.info(`[FAQ-Vector] Updated vector for FAQ ${faqId}`);
  return { mongoId: faqId.toString(), vector: embedding };
}

export async function deleteFAQVector(faqId) {
  await withRetry(async () => {
    await getQdrantClient().deletePoints(COLLECTION, {
      wait: true,
      points: [mongoIdToUuid(faqId.toString())],
    });
  }, 'deleteFAQVector');

  logger.info(`[FAQ-Vector] Deleted vector for FAQ ${faqId}`);
}

export async function getFAQVector(faqId) {
  try {
    const result = await getQdrantClient().retrieve(COLLECTION, {
      ids: [mongoIdToUuid(faqId.toString())],
      with_payload: true,
    });
    return result[0] || null;
  } catch (err) {
    if (err.message.includes('not found') || err.message.includes('404')) return null;
    throw err;
  }
}

export async function countFAQVectors() {
  try {
    const info = await getQdrantClient().getCollection(COLLECTION);
    return info.vectors_count ?? 0;
  } catch (err) {
    logger.error('[FAQ-Vector] countFAQVectors failed:', err.message);
    return 0;
  }
}