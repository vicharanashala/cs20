/**
 * Embedding Service
 * =================
 *
 * SEMANTIC SEARCH USING TRANSFORMERS:
 * ----------------------------------
 * We now use Xenova/all-MiniLM-L6-v2 transformer model for semantic embeddings.
 * This understands meaning, not just word frequency like TF-IDF.
 *
 * Examples of semantic understanding:
 * - "I forgot my password" ≈ "I can't log in" ≈ "reset password issue"
 * - "How to apply for internship?" ≈ "What is the internship process?"
 *
 * Model: all-MiniLM-L6-v2
 * - 384 dimensions (compatible with existing Qdrant setup)
 * - Cosine similarity ready (vectors are normalized)
 * - Fast inference via WebAssembly
 */

import { embedText, embedBatch, warmup, isTransformerReady } from './transformer.service.js';
import logger from '../../utils/logger.js';

export const CORPUS_FAQ = 'faq';
export const CORPUS_RTQ = 'rtq';

const USE_TRANSFORMER = false;

export async function preprocessText(text) {
  if (!text || typeof text !== 'string') return '';
  return text.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim();
}

export function buildFAQText(faq) {
  return [faq.question || '', faq.answer || '', faq.category || '', ...(faq.tags || [])].join(' ');
}

export function buildRTQText(rtq) {
  return [rtq.question || '', rtq.category || '', ...(rtq.tags || [])].join(' ');
}

export async function generateEmbedding(text, corpusName = null) {
  const clean = await preprocessText(text);
  if (!clean) return new Array(384).fill(0);

  try {
    let embedding;
    if (USE_TRANSFORMER) {
      embedding = await embedText(clean);
    } else {
      const embedder = (await import('../../../rag-engine/embedding/embedder.js')).default;
      embedding = embedder.embedSingle(clean, corpusName);
    }

    if (!embedding || embedding.length === 0) {
      logger.warn('[Embedding] Generated empty embedding for text:', clean.substring(0, 50));
      return new Array(384).fill(0);
    }

    const sanitized = embedding.map(v => {
      if (!Number.isFinite(v)) return 0;
      if (Math.abs(v) > 1e10) return Math.sign(v) * 1e10;
      return v;
    });

    return sanitized;
  } catch (err) {
    logger.error('[Embedding] Failed to generate embedding:', err.message);
    return new Array(384).fill(0);
  }
}

export async function generateMultipleEmbeddings(texts, corpusName = null) {
  if (!texts || texts.length === 0) return [];
  
  try {
    if (USE_TRANSFORMER) {
      return await embedBatch(texts);
    } else {
      const embedder = (await import('../../../rag-engine/embedding/embedder.js')).default;
      return texts.map(t => embedder.embedSingle(t, corpusName));
    }
  } catch (err) {
    logger.error('[Embedding] Batch embedding failed:', err.message);
    return texts.map(() => new Array(384).fill(0));
  }
}

export async function rebuildCorpus(corpusName, texts) {
  if (!texts || texts.length === 0) {
    logger.warn(`[Embedding] rebuildCorpus(${corpusName}) called with empty texts`);
    return;
  }
  logger.info(`[Embedding] Transformer model handles corpus '${corpusName}' — no IDF rebuild needed (${texts.length} documents)`);
}

export function getEmbedder() {
  return { embedSingle: generateEmbedding, embed: generateMultipleEmbeddings };
}

export { warmup, isTransformerReady };