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

let extractor = null;
let isReady = false;

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
    texts.map(text =>
      ext(text, { pooling: 'mean', normalize: true })
    )
  );

  return results.map(r => Array.from(r.data));
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
