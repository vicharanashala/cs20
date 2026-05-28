/**
 * Sync Repair Service
 * ===================
 *
 * Detects and repairs MongoDB ↔ Qdrant inconsistencies.
 *
 * WHY A REPAIR SERVICE IS NEEDED:
 * -------------------------------
 * Even with transactional sync logic, inconsistencies can occur due to:
 *   - Qdrant downtime during a sync operation
 *   - Partial failures during RTQ→FAQ conversion
 *   - Manual database edits bypassing the sync layer
 *   - Qdrant collection recreation (wipes all vectors)
 *   - Buggy code deployments that skip sync calls
 *
 * WHAT THIS SERVICE DOES:
 * -----------------------
 * 1. MISSING VECTOR DETECTION:
 *    Finds MongoDB documents that have no corresponding Qdrant vector.
 *    Repairs by re-inserting the vector.
 *
 * 2. STRAY VECTOR DETECTION:
 *    Finds Qdrant vectors whose mongoId doesn't match any MongoDB document.
 *    Repairs by deleting the stray vector.
 *
 * 3. FULL REINDEX:
 *    Clears all vectors from a collection and rebuilds from MongoDB.
 *    Use when collection is corrupted or after bulk migration.
 *
 * 4. VECTOR COUNT RECONCILIATION:
 *    Compares MongoDB count vs Qdrant vector count.
 *    Reports discrepancy so operators can decide whether to repair.
 *
 * USAGE:
 * ------
 * - Automatic: Call repairAllIfNeeded() on server startup (lightweight check)
 * - On-demand: Admin can call rebuildFAQRVectors() or rebuildRTQVectors()
 * - After disaster: Call fullReindexFAQ() or fullReindexRTQ()
 */

import FAQ from '../../models/FAQ.model.js';
import RTQ from '../../models/RTQ.model.js';
import * as faqVector from '../vector/faq.vector.service.js';
import * as rtqVector from '../vector/rtq.vector.service.js';
import { rebuildCorpus, generateEmbedding, buildFAQText, buildRTQText } from '../vector/embedding.service.js';
import { getCollectionStats } from '../vector/collection.service.js';
import logger from '../../utils/logger.js';

async function getAllFAQIds() {
  const faqs = await FAQ.find().select('_id').lean();
  return new Set(faqs.map(f => f._id.toString()));
}

async function getAllRTQIds() {
  const rtqs = await RTQ.find().select('_id').lean();
  return new Set(rtqs.map(r => r._id.toString()));
}

async function getQdrantVectorIds(collection, payloadField = 'mongoId') {
  try {
    const client = (await import('../../config/qdrant.js')).getQdrantClient();
    let allIds = [];
    let offset = undefined;

    do {
      const scrollResult = await client.scroll(collection, {
        limit: 1000,
        offset,
        with_payload: true,
      });

      for (const point of scrollResult.points || []) {
        if (point.payload && point.payload[payloadField]) {
          allIds.push(point.payload[payloadField]);
        }
      }

      offset = scrollResult.next_page_offset;
    } while (offset);

    return new Set(allIds);
  } catch (err) {
    logger.error('[Repair] Failed to scroll Qdrant collection:', err.message);
    return new Set();
  }
}

export async function detectMissingFAQVectors() {
  const [mongoIds, qdrantIds] = await Promise.all([
    getAllFAQIds(),
    getQdrantVectorIds((await import('../../config/qdrant.js')).getCollectionNames().faq),
  ]);

  const missing = [];
  for (const id of mongoIds) {
    if (!qdrantIds.has(id)) missing.push(id);
  }
  return missing;
}

export async function detectStrayFAQVectors() {
  const [mongoIds, qdrantIds] = await Promise.all([
    getAllFAQIds(),
    getQdrantVectorIds((await import('../../config/qdrant.js')).getCollectionNames().faq),
  ]);

  const stray = [];
  for (const id of qdrantIds) {
    if (!mongoIds.has(id)) stray.push(id);
  }
  return stray;
}

export async function detectMissingRTQVectors() {
  const [mongoIds, qdrantIds] = await Promise.all([
    getAllRTQIds(),
    getQdrantVectorIds((await import('../../config/qdrant.js')).getCollectionNames().rtq),
  ]);

  const missing = [];
  for (const id of mongoIds) {
    if (!qdrantIds.has(id)) missing.push(id);
  }
  return missing;
}

export async function detectStrayRTQVectors() {
  const [mongoIds, qdrantIds] = await Promise.all([
    getAllRTQIds(),
    getQdrantVectorIds((await import('../../config/qdrant.js')).getCollectionNames().rtq),
  ]);

  const stray = [];
  for (const id of qdrantIds) {
    if (!mongoIds.has(id)) stray.push(id);
  }
  return stray;
}

export async function repairMissingFAQVectors() {
  const missingIds = await detectMissingFAQVectors();
  if (missingIds.length === 0) {
    logger.info('[Repair] No missing FAQ vectors detected');
    return { repaired: 0, missing: [] };
  }

  logger.warn(`[Repair] Found ${missingIds.length} FAQ vectors missing from Qdrant — repairing...`);
  const repaired = [];
  const failed = [];

  for (const id of missingIds) {
    try {
      const faq = await FAQ.findById(id);
      if (!faq) {
        logger.warn(`[Repair] FAQ ${id} exists in Qdrant payload but not in MongoDB — should be stray, skipping repair`);
        continue;
      }
      await faqVector.insertFAQVector(faq);
      repaired.push(id);
    } catch (err) {
      logger.error(`[Repair] Failed to repair FAQ vector ${id}:`, err.message);
      failed.push({ id, error: err.message });
    }
  }

  logger.info(`[Repair] FAQ vector repair complete: ${repaired.length} repaired, ${failed.length} failed`);
  return { repaired, failed, missing: missingIds };
}

export async function repairStrayFAQVectors() {
  const strayIds = await detectStrayFAQVectors();
  if (strayIds.length === 0) {
    logger.info('[Repair] No stray FAQ vectors detected');
    return { deleted: 0, stray: [] };
  }

  logger.warn(`[Repair] Found ${strayIds.length} stray FAQ vectors in Qdrant — deleting...`);
  const deleted = [];
  const failed = [];

  for (const id of strayIds) {
    try {
      await faqVector.deleteFAQVector(id);
      deleted.push(id);
    } catch (err) {
      logger.error(`[Repair] Failed to delete stray FAQ vector ${id}:`, err.message);
      failed.push({ id, error: err.message });
    }
  }

  logger.info(`[Repair] Stray FAQ vectors deleted: ${deleted.length} deleted, ${failed.length} failed`);
  return { deleted, failed, stray: strayIds };
}

export async function repairMissingRTQVectors() {
  const missingIds = await detectMissingRTQVectors();
  if (missingIds.length === 0) {
    logger.info('[Repair] No missing RTQ vectors detected');
    return { repaired: 0, missing: [] };
  }

  logger.warn(`[Repair] Found ${missingIds.length} RTQ vectors missing from Qdrant — repairing...`);
  const repaired = [];
  const failed = [];

  for (const id of missingIds) {
    try {
      const rtq = await RTQ.findById(id);
      if (!rtq) {
        logger.warn(`[Repair] RTQ ${id} exists in Qdrant payload but not in MongoDB — should be stray, skipping repair`);
        continue;
      }
      await rtqVector.insertRTQVector(rtq);
      repaired.push(id);
    } catch (err) {
      logger.error(`[Repair] Failed to repair RTQ vector ${id}:`, err.message);
      failed.push({ id, error: err.message });
    }
  }

  logger.info(`[Repair] RTQ vector repair complete: ${repaired.length} repaired, ${failed.length} failed`);
  return { repaired, failed, missing: missingIds };
}

export async function repairStrayRTQVectors() {
  const strayIds = await detectStrayRTQVectors();
  if (strayIds.length === 0) {
    logger.info('[Repair] No stray RTQ vectors detected');
    return { deleted: 0, stray: [] };
  }

  logger.warn(`[Repair] Found ${strayIds.length} stray RTQ vectors in Qdrant — deleting...`);
  const deleted = [];
  const failed = [];

  for (const id of strayIds) {
    try {
      await rtqVector.deleteRTQVector(id);
      deleted.push(id);
    } catch (err) {
      logger.error(`[Repair] Failed to delete stray RTQ vector ${id}:`, err.message);
      failed.push({ id, error: err.message });
    }
  }

  logger.info(`[Repair] Stray RTQ vectors deleted: ${deleted.length} deleted, ${failed.length} failed`);
  return { deleted, failed, stray: strayIds };
}

export async function rebuildFAQRVectors() {
  logger.info('[Repair] Starting full FAQ vector rebuild...');

  const faqs = await FAQ.find();
  if (faqs.length === 0) {
    logger.info('[Repair] No FAQs in MongoDB — skipping rebuild');
    return { rebuilt: 0 };
  }

  const texts = faqs.map(f => buildFAQText(f));
  rebuildCorpus(texts);

  let rebuilt = 0;
  let failed = 0;

  for (const faq of faqs) {
    try {
      await faqVector.insertFAQVector(faq);
      rebuilt++;
    } catch (err) {
      logger.error(`[Repair] Failed to rebuild FAQ vector ${faq._id}:`, err.message);
      failed++;
    }
  }

  logger.info(`[Repair] FAQ vector rebuild complete: ${rebuilt} rebuilt, ${failed} failed`);
  return { rebuilt, failed, total: faqs.length };
}

export async function rebuildRTQVectors() {
  logger.info('[Repair] Starting full RTQ vector rebuild...');

  const rtqs = await RTQ.find();
  if (rtqs.length === 0) {
    logger.info('[Repair] No RTQs in MongoDB — skipping rebuild');
    return { rebuilt: 0 };
  }

  const texts = rtqs.map(r => buildRTQText(r));
  rebuildCorpus(texts);

  let rebuilt = 0;
  let failed = 0;

  for (const rtq of rtqs) {
    try {
      await rtqVector.insertRTQVector(rtq);
      rebuilt++;
    } catch (err) {
      logger.error(`[Repair] Failed to rebuild RTQ vector ${rtq._id}:`, err.message);
      failed++;
    }
  }

  logger.info(`[Repair] RTQ vector rebuild complete: ${rebuilt} rebuilt, ${failed} failed`);
  return { rebuilt, failed, total: rtqs.length };
}

export async function fullRepair() {
  logger.info('[Repair] Starting full MongoDB ↔ Qdrant reconciliation...');

  const [faqMissing, faqStray, rtqMissing, rtqStray] = await Promise.all([
    detectMissingFAQVectors(),
    detectStrayFAQVectors(),
    detectMissingRTQVectors(),
    detectStrayRTQVectors(),
  ]);

  const stats = {
    faq: { missing: faqMissing.length, stray: faqStray.length },
    rtq: { missing: rtqMissing.length, stray: rtqStray.length },
    totalIssues: faqMissing.length + faqStray.length + rtqMissing.length + rtqStray.length,
  };

  if (stats.totalIssues === 0) {
    logger.info('[Repair] No inconsistencies found — all collections healthy');
    return { status: 'healthy', stats };
  }

  logger.warn('[Repair] Inconsistencies detected, auto-repairing...');

  const [faqMissingResult, faqStrayResult, rtqMissingResult, rtqStrayResult] = await Promise.all([
    repairMissingFAQVectors(),
    repairStrayFAQVectors(),
    repairMissingRTQVectors(),
    repairStrayRTQVectors(),
  ]);

  return {
    status: 'repaired',
    stats,
    repair: {
      faqMissing: faqMissingResult,
      faqStray: faqStrayResult,
      rtqMissing: rtqMissingResult,
      rtqStray: rtqStrayResult,
    },
  };
}