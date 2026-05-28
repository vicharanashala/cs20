/**
 * Similarity Service
 * ==================
 *
 * Provides pure mathematical similarity computation for vectors.
 * These functions run client-side (not in Qdrant) for cases where we need
 * to score vectors that Qdrant doesn't yet hold, or to verify Qdrant scores.
 *
 * COSINE SIMILARITY:
 * cos(θ) = (A · B) / (||A|| × ||B||)
 * Range: -1 to 1 (Qdrant stores as similarity = 1 - distance, so 0 to 2 → normalized to 0-1)
 *
 * DOT PRODUCT:
 * A · B = Σ(Ai × Bi)
 * Good for comparing raw TF-IDF vectors before L2 normalization.
 *
 * Both are provided for flexibility — our pipeline uses cosine similarity.
 */

import { cosineSimilarity as cosineSim } from '../../../../rag-engine/similarity/cosine.similarity.js';
import logger from '../../utils/logger.js';

export function cosineSimilarity(vecA, vecB) {
  if (!vecA || !vecB) {
    logger.warn('[Similarity] Received null vector');
    return 0;
  }
  if (vecA.length !== vecB.length) {
    logger.error(`[Similarity] Vector dimension mismatch: ${vecA.length} vs ${vecB.length}`);
    return 0;
  }
  return cosineSim(vecA, vecB);
}

export function dotProduct(vecA, vecB) {
  if (!vecA || !vecB || vecA.length !== vecB.length) return 0;
  return vecA.reduce((sum, val, i) => sum + val * vecB[i], 0);
}

export function vectorMagnitude(vec) {
  if (!vec || vec.length === 0) return 0;
  return Math.sqrt(vec.reduce((sum, val) => sum + val * val, 0));
}

export function normalizeVector(vec) {
  const mag = vectorMagnitude(vec);
  if (mag === 0) return vec;
  return vec.map(v => v / mag);
}

export function euclideanDistance(vecA, vecB) {
  if (!vecA || !vecB || vecA.length !== vecB.length) return Infinity;
  const sumSquaredDiffs = vecA.reduce((sum, val, i) => sum + Math.pow(val - vecB[i], 2), 0);
  return Math.sqrt(sumSquaredDiffs);
}

export function rankBySimilarity(queryVector, vectors) {
  return vectors
    .map((v, idx) => ({
      index: idx,
      score: cosineSimilarity(queryVector, v.vector || v.embedding),
      mongoId: v.mongoId,
    }))
    .sort((a, b) => b.score - a.score);
}