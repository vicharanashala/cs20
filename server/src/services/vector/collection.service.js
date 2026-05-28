/**
 * Collection Service
 * ==================
 *
 * Handles Qdrant collection lifecycle: creation, configuration, and health checks.
 *
 * HNSW INDEXING EXPLAINED:
 * ------------------------
 * HNSW (Hierarchical Navigable Small World) is a graph-based ANN algorithm that:
 *   - Builds a multi-layer graph from vectors (higher layers = longer edges = faster search)
 *   - Uses random entry points and greedy traversal to find approximate nearest neighbors
 *   - Trades a small amount of accuracy for O(log n) search complexity instead of O(n)
 *   - Ideal for high-dimensional dense vectors like our 384-dim TF-IDF embeddings
 *
 * COSINE DISTANCE METRIC:
 * -----------------------
 * Qdrant supports: "Cosine", "Dot", and "Euclidean" distance metrics.
 * We use Cosine because:
 *   - TF-IDF vectors can have vastly different magnitudes (long docs vs short docs)
 *   - Cosine normalizes by magnitude, comparing direction only
 *   - range: 0 (identical) to 2 (opposite); Qdrant converts to similarity = 1 - distance
 *
 * PAYLOAD INDEXING:
 * -----------------
 * Payload fields (mongoId, question, category, etc.) are indexed separately from vectors.
 * This allows filtered searches (e.g., "find similar FAQ in category Admissions").
 * We index: mongoId (uuid, unique), category (keyword), status (keyword), createdBy (uuid).
 *
 * 384 VECTOR DIMENSION:
 * ---------------------
 * Matches our TF-IDF embedder output dimension (384-dim). Qdrant requires this to match
 * exactly. Mismatched dimensions cause insertion failures.
 */

import { getQdrantClient, getCollectionNames, withRetry } from '../../config/qdrant.js';
import logger from '../../utils/logger.js';
import { config } from '../../config/env.js';

const VECTOR_DIMENSION = config.vectors?.DIMENSION || 384;

const HNSW_CONFIG = {
  type: 'hnsw',
  params: {
    m: 16,         // Number of bi-directional links per node. Higher = better recall, more memory
    efConstruct: 128, // Size of the dynamic candidate list during construction. Higher = better index, slower build
  },
  on_disk: false,  // Keep index in RAM for faster queries (enable if dataset is huge)
};

const PARAMS_CONFIG = {
  vector_size: VECTOR_DIMENSION,
  distance: 'Cosine',
};

const PAYLOAD_INDEX_CONFIG = {
  'mongoId': {
    type: 'uuid',
  },
  'category': {
    type: 'keyword',
  },
  'status': {
    type: 'keyword',
  },
  'createdBy': {
    type: 'uuid',
  },
};

/**
 * Collection info shape returned by Qdrant REST API.
 * @typedef {Object} CollectionInfo
 * @property {string} status
 * @property {Object} config
 * @property {Object} vectors_count
 * @property {Object} indexed_vectors_count
 * @property {Object} points_count
 * @property {Object} segments_count
 * @property {Object} sparse_vectors_count
 */

async function createCollectionIfNotExists(collectionName) {
  const client = getQdrantClient();

  const exists = await withRetry(async () => {
    const result = await client.collectionExists(collectionName);
    return result.exists ?? false;
  }, `checkCollectionExists(${collectionName})`);

  if (exists) {
    logger.info(`[Qdrant] Collection "${collectionName}" already exists — skipping creation`);
    return false;
  }

  await withRetry(async () => {
    await client.createCollection(collectionName, {
      vectors: {
        size: VECTOR_DIMENSION,
        distance: 'Cosine',
      },
      params: {
        hnsw_config: HNSW_CONFIG,
      },
      optimizers_config: {
        default_segment_number: 2,     // Number of parallel search segments. More = faster search, more RAM
        indexing_threshold: 20000,     // Start indexing after this many vectors. Lower = faster indexing, slower initial search
        max_indexing_threads: 1,       // CPU threads for indexing. 0 = auto
        memmap_threshold: 50000,       // Use memory-mapped files above this size
      },
    });

    logger.info(`[Qdrant] Collection "${collectionName}" created successfully (dim=${VECTOR_DIMENSION}, metric=Cosine, hnsw_m=16)`);
  }, `createCollection(${collectionName})`);

  return true;
}

async function setupPayloadIndex(collectionName) {
  const client = getQdrantClient();

  try {
    await withRetry(async () => {
      await client.createPayloadIndex(collectionName, {
        payload_schema: PAYLOAD_INDEX_CONFIG,
      });
    }, `createPayloadIndex(${collectionName})`);

    logger.info(`[Qdrant] Payload index created on "${collectionName}"`);
  } catch (err) {
    if (err.message.includes('already exists') || err.message.includes('already_indexed')) {
      logger.info(`[Qdrant] Payload index already exists on "${collectionName}"`);
    } else {
      logger.warn(`[Qdrant] Payload index creation failed for "${collectionName}": ${err.message}`);
    }
  }
}

export async function initializeAllCollections() {
  const { faq, rtq } = getCollectionNames();
  const results = { faq: false, rtq: false };

  logger.info('[Qdrant] Starting collection initialization...');

  try {
    results.faq = await createCollectionIfNotExists(faq);
    if (results.faq) await setupPayloadIndex(faq);

    results.rtq = await createCollectionIfNotExists(rtq);
    if (results.rtq) await setupPayloadIndex(rtq);

    logger.info('[Qdrant] Collection initialization complete', results);
  } catch (err) {
    logger.error('[Qdrant] Collection initialization failed:', err.message);
    throw err;
  }

  return results;
}

export async function getCollectionStats(collectionName) {
  try {
    const client = getQdrantClient();
    const info = await withRetry(async () => client.getCollection(collectionName), `getCollection(${collectionName})`);

    return {
      name: collectionName,
      status: info.status,
      vectorsCount: info.vectors_count ?? 0,
      indexedVectorsCount: info.indexed_vectors_count ?? 0,
      pointsCount: info.points_count ?? 0,
      segmentsCount: info.segments_count ?? 0,
      dimension: info.config?.params?.vector_size ?? VECTOR_DIMENSION,
      distance: info.config?.params?.distance ?? 'Cosine',
    };
  } catch (err) {
    logger.error(`[Qdrant] Failed to get stats for "${collectionName}":`, err.message);
    return {
      name: collectionName,
      status: 'error',
      error: err.message,
      vectorsCount: 0,
    };
  }
}

export async function deleteCollection(collectionName) {
  try {
    const client = getQdrantClient();
    await withRetry(async () => client.deleteCollection(collectionName), `deleteCollection(${collectionName})`);
    logger.info(`[Qdrant] Collection "${collectionName}" deleted`);
    return true;
  } catch (err) {
    if (err.message.includes('not found') || err.message.includes('404')) {
      logger.info(`[Qdrant] Collection "${collectionName}" does not exist — nothing to delete`);
      return false;
    }
    logger.error(`[Qdrant] Failed to delete "${collectionName}":`, err.message);
    throw err;
  }
}

export async function recreateCollection(collectionName) {
  await deleteCollection(collectionName);
  await createCollectionIfNotExists(collectionName);
  await setupPayloadIndex(collectionName);
  logger.info(`[Qdrant] Collection "${collectionName}" recreated`);
}

export { VECTOR_DIMENSION };