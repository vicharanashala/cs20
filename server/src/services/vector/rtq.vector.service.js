/**
 * RTQ Vector Service
 * ==================
 *
 * Manages RTQ (Real-Time Query) vectors in Qdrant (rtq_collection).
 *
 * PAYLOAD STRUCTURE:
 * {
 *   mongoId: string,      // MongoDB RTQ document _id
 *   question: string,     // RTQ question text
 *   status: string,       // open/resolved (filterable)
 *   category: string,     // RTQ category
 *   tags: string[],       // Tags array
 *   upvotes: number,      // Current upvote count
 *   createdBy: string,    // User mongoId who asked
 * }
 *
 * SYNC WITH MONGODB:
 * These methods should ONLY be called after successful MongoDB operations.
 * See rtq.sync.service.js for transactional sync logic with rollback support.
 */

import { getQdrantClient, getCollectionNames, withRetry } from '../../config/qdrant.js';
import { generateEmbedding, buildRTQText } from './embedding.service.js';
import logger from '../../utils/logger.js';

const { rtq: COLLECTION } = getCollectionNames();

function buildPayload(rtq) {
  return {
    mongoId: rtq._id?.toString() || rtq.mongoId,
    question: rtq.question || '',
    status: rtq.status || 'open',
    category: rtq.category || 'General',
    tags: Array.isArray(rtq.tags) ? rtq.tags : [],
    upvotes: rtq.upvotes || 0,
    createdBy: rtq.createdBy?.toString() || '',
  };
}

export async function insertRTQVector(rtq) {
  if (!rtq || !rtq._id) {
    throw new Error('[RTQ-Vector] insertRTQVector: rtq must have _id');
  }

  const text = buildRTQText(rtq);
  const embedding = generateEmbedding(text);
  const payload = buildPayload(rtq);

  await withRetry(async () => {
    await getQdrantClient().upsert(COLLECTION, {
      wait: true,
      points: [
        {
          id: rtq._id.toString(),
          vector: embedding,
          payload,
        },
      ],
    });
  }, 'insertRTQVector');

  logger.info(`[RTQ-Vector] Inserted vector for RTQ ${rtq._id} (${rtq.status})`);
  return { mongoId: rtq._id.toString(), vector: embedding };
}

export async function searchRTQSimilarity(queryEmbedding, { limit = 5, status = null, category = null } = {}) {
  const must = [];
  if (status) must.push({ key: 'status', match: { value: status } });
  if (category) must.push({ key: 'category', match: { value: category } });
  const filter = must.length > 0 ? { must } : undefined;

  const results = await withRetry(async () => {
    return await getQdrantClient().search(COLLECTION, {
      vector: queryEmbedding,
      limit,
      filter,
      with_payload: true,
    });
  }, 'searchRTQSimilarity');

  return results.map(r => ({
    mongoId: r.payload?.mongoId,
    question: r.payload?.question,
    status: r.payload?.status,
    category: r.payload?.category,
    tags: r.payload?.tags,
    upvotes: r.payload?.upvotes,
    score: r.score,
  }));
}

export async function searchRTQByText(text, { limit = 5, status = null, category = null } = {}) {
  const embedding = generateEmbedding(text);
  return searchRTQSimilarity(embedding, { limit, status, category });
}

export async function updateRTQVector(rtqId, updates) {
  const text = buildRTQText(updates);
  const embedding = generateEmbedding(text);
  const payload = buildPayload(updates);

  await withRetry(async () => {
    await getQdrantClient().upsert(COLLECTION, {
      wait: true,
      points: [
        {
          id: rtqId.toString(),
          vector: embedding,
          payload,
        },
      ],
    });
  }, 'updateRTQVector');

  logger.info(`[RTQ-Vector] Updated vector for RTQ ${rtqId}`);
  return { mongoId: rtqId.toString(), vector: embedding };
}

export async function deleteRTQVector(rtqId) {
  await withRetry(async () => {
    await getQdrantClient().deletePoints(COLLECTION, {
      wait: true,
      points: [rtqId.toString()],
    });
  }, 'deleteRTQVector');

  logger.info(`[RTQ-Vector] Deleted vector for RTQ ${rtqId}`);
}

export async function getRTQVector(rtqId) {
  try {
    const result = await getQdrantClient().retrieve(COLLECTION, {
      ids: [rtqId.toString()],
      with_payload: true,
    });
    return result[0] || null;
  } catch (err) {
    if (err.message.includes('not found') || err.message.includes('404')) return null;
    throw err;
  }
}

export async function countRTQVectors() {
  try {
    const info = await getQdrantClient().getCollection(COLLECTION);
    return info.vectors_count ?? 0;
  } catch (err) {
    logger.error('[RTQ-Vector] countRTQVectors failed:', err.message);
    return 0;
  }
}