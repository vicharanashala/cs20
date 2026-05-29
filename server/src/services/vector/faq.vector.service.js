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

import { getQdrantClient, getCollectionNames, withRetry } from '../../config/qdrant.js';
import { generateEmbedding, buildFAQText, CORPUS_FAQ } from './embedding.service.js';
import logger from '../../utils/logger.js';

const { faq: COLLECTION } = getCollectionNames();

function toUUID(id) {
  if (!id) return id;
  const str = id.toString();
  if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str)) {
    return str;
  }
  if (/^[0-9a-fA-F]{24}$/.test(str)) {
    const hex = str.padStart(32, '0');
    return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20, 32)}`;
  }
  return str;
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
  const embedding = generateEmbedding(text, CORPUS_FAQ);
  const payload = buildPayload(faq);

  await withRetry(async () => {
    await getQdrantClient().upsert(COLLECTION, {
      wait: true,
      points: [
        {
          id: toUUID(faq._id),
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
  const embedding = generateEmbedding(text, CORPUS_FAQ);
  return searchFAQSimilarity(embedding, { limit, category });
}

export async function updateFAQVector(faqId, updates) {
  const text = buildFAQText(updates);
  const embedding = generateEmbedding(text, CORPUS_FAQ);
  const payload = buildPayload(updates);

  await withRetry(async () => {
    await getQdrantClient().upsert(COLLECTION, {
      wait: true,
      points: [
        {
          id: toUUID(faqId),
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
      points: [toUUID(faqId)],
    });
  }, 'deleteFAQVector');

  logger.info(`[FAQ-Vector] Deleted vector for FAQ ${faqId}`);
}

export async function getFAQVector(faqId) {
  try {
    const result = await getQdrantClient().retrieve(COLLECTION, {
      ids: [toUUID(faqId)],
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