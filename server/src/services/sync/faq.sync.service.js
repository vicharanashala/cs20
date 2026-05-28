/**
 * FAQ Sync Service
 * ================
 *
 * Handles automatic MongoDB ↔ Qdrant synchronization for FAQ documents.
 *
 * SYNC CONSISTENCY MODEL:
 * -----------------------
 * MongoDB is the source of truth. Operations follow this pattern:
 *
 *   1. Controller does MongoDB write (create/update/delete FAQ)
 *   2. Controller calls sync service method (e.g., syncFAQInsert)
 *   3. Sync service calls Qdrant vector service
 *   4. If Qdrant fails → emit failure event → caller can rollback MongoDB
 *   5. If Qdrant succeeds → emit success event
 *
 * ROLLBACK BEHAVIOR:
 * ------------------
 * - insertFAQ: If Qdrant insert fails, caller should delete the MongoDB document
 * - updateFAQ: If Qdrant update fails, we re-throw — caller should revert MongoDB
 * - deleteFAQ: If Qdrant delete fails, we log and continue (stray vector is better than lost FAQ)
 *
 * CONVERSION RTQ → FAQ:
 * ---------------------
 * When a Senior converts RTQ to FAQ:
 *   Step 1: syncRTQDelete(rtqId) → removes RTQ vector from rtq_collection
 *   Step 2: syncFAQInsert(faq)   → inserts FAQ vector into faq_collection
 *   If Step 2 fails after Step 1 succeeds:
 *     → FAQ document already exists in MongoDB (created by conversion logic)
 *     → We don't auto-rollback because Senior should review and retry
 *     → Error is logged for manual intervention
 */

import syncEvents, { SYNC_EVENTS } from './sync.events.js';
import * as faqVector from '../vector/faq.vector.service.js';
import FAQ from '../../models/FAQ.model.js';
import logger from '../../utils/logger.js';

export async function syncFAQInsert(faq) {
  try {
    await faqVector.insertFAQVector(faq);
    syncEvents.emitSyncSuccess(SYNC_EVENTS.FAQ_INSERT, faq._id.toString(), 'faq_collection');
    return { success: true, mongoId: faq._id.toString() };
  } catch (err) {
    syncEvents.emitSyncFailure(SYNC_EVENTS.FAQ_INSERT, faq._id?.toString(), 'faq_collection', err);
    throw err;
  }
}

export async function syncFAQUpdate(faqId, updates) {
  try {
    await faqVector.updateFAQVector(faqId, updates);
    syncEvents.emitSyncSuccess(SYNC_EVENTS.FAQ_UPDATE, faqId.toString(), 'faq_collection');
    return { success: true, mongoId: faqId.toString() };
  } catch (err) {
    syncEvents.emitSyncFailure(SYNC_EVENTS.FAQ_UPDATE, faqId.toString(), 'faq_collection', err);
    throw err;
  }
}

export async function syncFAQDelete(faqId) {
  try {
    await faqVector.deleteFAQVector(faqId);
    syncEvents.emitSyncSuccess(SYNC_EVENTS.FAQ_DELETE, faqId.toString(), 'faq_collection');
    return { success: true, mongoId: faqId.toString() };
  } catch (err) {
    syncEvents.emitSyncFailure(SYNC_EVENTS.FAQ_DELETE, faqId.toString(), 'faq_collection', err);
    logger.warn(`[FAQ-Sync] Qdrant delete failed for ${faqId} — stray vector may exist. Error: ${err.message}`);
    return { success: false, mongoId: faqId.toString(), error: err.message };
  }
}

export async function syncFAQBatchInsert(faqs) {
  const results = await Promise.allSettled(faqs.map(faq => syncFAQInsert(faq)));
  const succeeded = results.filter(r => r.status === 'fulfilled').length;
  const failed = results.filter(r => r.status === 'rejected').length;
  logger.info(`[FAQ-Sync] Batch insert complete: ${succeeded} succeeded, ${failed} failed`);
  return { succeeded, failed, results };
}

export async function rollbackFAQInsert(faqId) {
  try {
    await FAQ.findByIdAndDelete(faqId);
    syncEvents.emitRollback(SYNC_EVENTS.FAQ_INSERT, faqId.toString(), 'faq', 'Qdrant insert failed, MongoDB rolled back');
    logger.info(`[FAQ-Sync] Rolled back FAQ ${faqId} (MongoDB delete)`);
    return { success: true };
  } catch (err) {
    logger.error(`[FAQ-Sync] Rollback failed for FAQ ${faqId}:`, err.message);
    return { success: false, error: err.message };
  }
}