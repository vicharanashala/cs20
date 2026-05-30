/**
 * Transformer Embedding Service
 * =============================
 *
 * Uses Xenova/transformers (WebAssembly-based, no Python/C++ required)
 * to generate semantic embeddings via the all-MiniLM-L6-v2 model.
 *
 * Model: all-MiniLM-L6-v2
 * - 384 dimensions
 * - 6 layers, 22M parameters
 * - Cosine similarity ready (already normalized)
 * - Semantic: understands meaning, not just word frequency
 *
 * EMBEDDING CACHE:
 * - LRU cache (max 500 entries) to avoid re-computing embeddings
 *   for identical text within the same server session.
 * - Cache key is the raw text string (after lowercase trimming).
 * - Evicts oldest entries when cache exceeds max size.
 *
 * Usage:
 *   import { getTransformerEmbedder, embedText, embedBatch } from './transformer.service.js';
 *
 *   const emb = await embedText("How do I reset my password?");
 *   const batch = await embedBatch(["Q1", "Q2", "Q3"]);
 */

import { pipeline, env } from '@xenova/transformers';

env.allowLocalModels = false;
env.useBrowserCache = false;

const MODEL_NAME = 'Xenova/all-MiniLM-L6-v2';
const DIMENSION = 384;
const CACHE_MAX_SIZE = 500;

let extractor = null;
let isReady = false;

// LRU embedding cache: Map preserves insertion order, oldest entries evicted first
const embeddingCache = new Map();

function cacheGet(key) {
  if (!embeddingCache.has(key)) return null;
  // Move to end (most recently used)
  const value = embeddingCache.get(key);
  embeddingCache.delete(key);
  embeddingCache.set(key, value);
  return value;
}

function cacheSet(key, value) {
  if (embeddingCache.has(key)) {
    embeddingCache.delete(key);
  } else if (embeddingCache.size >= CACHE_MAX_SIZE) {
    // Evict oldest (first) entry
    const oldestKey = embeddingCache.keys().next().value;
    embeddingCache.delete(oldestKey);
  }
  embeddingCache.set(key, value);
}

async function getExtractor() {
  if (!extractor) {
    console.log('[Transformer] Loading model:', MODEL_NAME);
    extractor = await pipeline('feature-extraction', MODEL_NAME, {
      quantized: true,
    });
    console.log('[Transformer] Model loaded successfully');
    isReady = true;
  }
  return extractor;
}

export async function embedText(text) {
  const cacheKey = (text || '').toLowerCase().trim();
  const cached = cacheGet(cacheKey);
  if (cached) return cached;

  const ext = await getExtractor();
  const result = await ext(text, {
    pooling: 'mean',
    normalize: true,
  });

  const embedding = Array.from(result.data);
  cacheSet(cacheKey, embedding);
  return embedding;
}

export async function embedBatch(texts) {
  const ext = await getExtractor();
  const results = await Promise.all(
    texts.map(async (text) => {
      const cacheKey = (text || '').toLowerCase().trim();
      const cached = cacheGet(cacheKey);
      if (cached) return cached;

      const result = await ext(text, { pooling: 'mean', normalize: true });
      const embedding = Array.from(result.data);
      cacheSet(cacheKey, embedding);
      return embedding;
    })
  );

  return results;
}

export function getDimension() {
  return DIMENSION;
}

export function isTransformerReady() {
  return isReady;
}

export async function warmup() {
  console.log('[Transformer] Warming up...');
  await embedText('warmup');
  console.log('[Transformer] Warmup complete');
}
