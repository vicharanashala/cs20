/**
 * Qdrant Cloud Configuration
 * ==========================
 *
 * WHY MONGODB AND QDRANT ARE SEPARATED:
 * ------------------------------------
 * MongoDB Atlas is a document database optimized for CRUD operations, querying,
 * and relational data (users, questions, answers, QP transactions). It is NOT
 * designed for dense vector similarity search at scale.
 *
 * Qdrant Cloud is a purpose-built vector database optimized for:
 *   - High-dimensional embedding storage (384-dim TF-IDF vectors here)
 *   - Approximate Nearest Neighbor (ANN) search via HNSW indexing
 *   - Cosine similarity scoring for semantic matching
 *   - Fast top-k retrieval across millions of vectors
 *
 * Separating them gives us the best of both worlds:
 *   - MongoDB: ACID transactions, flexible schemas, rich queries, QP economy
 *   - Qdrant:  lightning-fast semantic similarity for RAG decision engine
 *
 * WHY COLLECTIONS ARE SEPARATED (faq_collection vs rtq_collection):
 * ---------------------------------------------------------------
 * - faq_collection: stores APPROVED FAQ entries (senior-created or RTQ-converted).
 *   High-quality, curated content. Used in RAG F1/F2 similarity checks.
 *
 * - rtq_collection: stores active Real-Time Query entries that haven't been
 *   promoted to FAQ yet. Used in RAG R1/R2/R3 checks.
 *
 * Separating them allows independent scaling, separate retention policies,
 * and cleaner sync logic (FAQ deletions don't affect RTQ tracking).
 */

import { QdrantClient } from '@qdrant/js-client-rest';
import dotenv from 'dotenv';
import logger from '../utils/logger.js';

dotenv.config();

const {
  QDRANT_URL,
  QDRANT_API_KEY,
  QDRANT_FAQ_COLLECTION = 'faq_collection',
  QDRANT_RTQ_COLLECTION = 'rtq_collection',
  NODE_ENV
} = process.env;

if (!QDRANT_URL || !QDRANT_API_KEY) {
  logger.warn('[Qdrant] Credentials not configured. Vector services will be unavailable until QDRANT_URL and QDRANT_API_KEY are set in .env');
}

const RETRY_CONFIG = {
  maxRetries: 3,
  initialDelayMs: 1000,
  maxDelayMs: 10000,
};

let client = null;
let isConnected = false;

function getClient() {
  if (!client) {
    client = new QdrantClient({
      url: QDRANT_URL || 'http://localhost:6333',
      apiKey: QDRANT_API_KEY || undefined,
      timeout: NODE_ENV === 'production' ? 10000 : 30000,
    });
  }
  return client;
}

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function withRetry(fn, label = 'operation') {
  let lastError;
  for (let attempt = 1; attempt <= RETRY_CONFIG.maxRetries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;
      logger.warn(`[Qdrant] ${label} attempt ${attempt}/${RETRY_CONFIG.maxRetries} failed: ${err.message}`);
      if (attempt < RETRY_CONFIG.maxRetries) {
        const delay = Math.min(RETRY_CONFIG.initialDelayMs * Math.pow(2, attempt - 1), RETRY_CONFIG.maxDelayMs);
        await sleep(delay);
      }
    }
  }
  logger.error(`[Qdrant] ${label} failed after ${RETRY_CONFIG.maxRetries} attempts: ${lastError.message}`);
  throw lastError;
}

export async function validateConnection() {
  if (!QDRANT_URL || !QDRANT_API_KEY) {
    isConnected = false;
    return false;
  }

  try {
    await withRetry(async () => {
      const exists = await getClient().collectionExists(QDRANT_FAQ_COLLECTION);
      return exists;
    }, 'validateConnection');

    isConnected = true;
    logger.info('[Qdrant] Connection validated successfully');
    return true;
  } catch (err) {
    isConnected = false;
    logger.error('[Qdrant] Connection validation failed:', err.message);
    return false;
  }
}

export async function checkCollectionsExist() {
  if (!QDRANT_URL || !QDRANT_API_KEY) return { faq: false, rtq: false };

  try {
    const [faq, rtq] = await Promise.all([
      getClient().collectionExists(QDRANT_FAQ_COLLECTION).catch(() => ({ exists: false })),
      getClient().collectionExists(QDRANT_RTQ_COLLECTION).catch(() => ({ exists: false })),
    ]);
    return {
      faq: faq.exists ?? false,
      rtq: rtq.exists ?? false,
    };
  } catch (err) {
    logger.error('[Qdrant] Failed to check collections:', err.message);
    return { faq: false, rtq: false };
  }
}

export function getCollectionNames() {
  return {
    faq: QDRANT_FAQ_COLLECTION,
    rtq: QDRANT_RTQ_COLLECTION,
  };
}

export function getQdrantClient() {
  return getClient();
}

export function isQdrantConnected() {
  return isConnected;
}

export { withRetry, getClient as qdrantClient };