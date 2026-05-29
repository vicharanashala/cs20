/**
 * Transformer Embedder for RAG Engine
 * ===================================
 *
 * Uses Xenova/all-MiniLM-L6-v2 for semantic embeddings.
 * This provides true semantic understanding vs TF-IDF word frequency.
 *
 * To use: import { embedText, embedBatch } from './transformer.js';
 *
 * Model: all-MiniLM-L6-v2
 * - 384 dimensions (compatible with existing setup)
 * - Cosine similarity ready (normalized vectors)
 */

import { pipeline, env } from '@xenova/transformers';

env.allowLocalModels = false;
env.useBrowserCache = false;

const MODEL_NAME = 'Xenova/all-MiniLM-L6-v2';

let extractor = null;

async function getExtractor() {
  if (!extractor) {
    console.log('[Transformer-Embedder] Loading model:', MODEL_NAME);
    extractor = await pipeline('feature-extraction', MODEL_NAME, {
      quantized: true,
    });
    console.log('[Transformer-Embedder] Model loaded');
  }
  return extractor;
}

export async function embedText(text) {
  const ext = await getExtractor();
  const result = await ext(text, {
    pooling: 'mean',
    normalize: true,
  });
  return Array.from(result.data);
}

export async function embedBatch(texts) {
  const ext = await getExtractor();
  const results = await Promise.all(
    texts.map(text => ext(text, { pooling: 'mean', normalize: true }))
  );
  return results.map(r => Array.from(r.data));
}

export default { embedSingle: embedText, embed: embedBatch };
