/**
 * RTQ Sync Service
 * ================
 *
 * Handles automatic MongoDB ↔ Qdrant synchronization for RTQ documents.
 *
 * SYNC CONSISTENCY MODEL:
 * -----------------------
 * Same as FAQ Sync Service — MongoDB is source of truth.
 *
 * KEY SYNC SCENARIOS:
 *
 * 1. RTQ CREATED (question accepted by RAG):
 *    → MongoDB RTQ document created
 *    → syncRTQInsert(rtq) called
 *    → Vector inserted into rtq_collection
 *    If Qdrant fails → caller should delete MongoDB RTQ document (rollback)
 *
 * 2. RTQ REMOVED (deleted by Senior/Moderator):
 *    → MongoDB RTQ document deleted
 *    → syncRTQDelete(rtqId) called
 *    → Vector removed from rtq_collection
 *    If Qdrant fails → log stray vector, don't block the delete
 *
 * 3. RTQ → FAQ CONVERSION:
 *    Step 1: RTQ is deleted from MongoDB (by controller)
 *    Step 2: syncRTQDelete(rtqId) → removes RTQ vector from rtq_collection
 *    Step 3: FAQ is created in MongoDB (by controller)
 *    Step 4: syncFAQInsert(faq) → inserts FAQ vector into faq_collection
 *
 *    If Step 4 (FAQ vector insert) fails:
 *    → FAQ document already exists in MongoDB
 *    → RTQ vector was already deleted from Qdrant
 *    → We surface the error so Senior can retry FAQ insert
 *    → No auto-rollback (Senior should manually resolve)
 *
 * 4. RTQ STATUS CHANGED (open → resolved):
 *    → MongoDB updated
 *    → syncRTQUpdate(rtqId, updates) → upserts updated vector to rtq_collection
 *    → Qdrant vector updated with new status/text
 */

import syncEvents, { SYNC_EVENTS } from './sync.events.js';
import * as rtqVector from '../vector/rtq.vector.service.js';
import RTQ from '../../models/RTQ.model.js';
import logger from '../../utils/logger.js';

export async function syncRTQInsert(rtq) {
  try {
    await rtqVector.insertRTQVector(rtq);
    syncEvents.emitSyncSuccess(SYNC_EVENTS.RTQ_INSERT, rtq._id.toString(), 'rtq_collection');
    return { success: true, mongoId: rtq._id.toString() };
  } catch (err) {
    syncEvents.emitSyncFailure(SYNC_EVENTS.RTQ_INSERT, rtq._id?.toString(), 'rtq_collection', err);
    throw err;
  }
}

export async function syncRTQUpdate(rtqId, updates) {
  try {
    await rtqVector.updateRTQVector(rtqId, updates);
    syncEvents.emitSyncSuccess(SYNC_EVENTS.RTQ_UPDATE, rtqId.toString(), 'rtq_collection');
    return { success: true, mongoId: rtqId.toString() };
  } catch (err) {
    syncEvents.emitSyncFailure(SYNC_EVENTS.RTQ_UPDATE, rtqId.toString(), 'rtq_collection', err);
    throw err;
  }
}

export async function syncRTQDelete(rtqId) {
  try {
    await rtqVector.deleteRTQVector(rtqId);
    syncEvents.emitSyncSuccess(SYNC_EVENTS.RTQ_DELETE, rtqId.toString(), 'rtq_collection');
    return { success: true, mongoId: rtqId.toString() };
  } catch (err) {
    syncEvents.emitSyncFailure(SYNC_EVENTS.RTQ_DELETE, rtqId.toString(), 'rtq_collection', err);
    logger.warn(`[RTQ-Sync] Qdrant delete failed for ${rtqId} — stray vector may exist. Error: ${err.message}`);
    return { success: false, mongoId: rtqId.toString(), error: err.message };
  }
}

export async function rollbackRTQInsert(rtqId) {
  try {
    await RTQ.findByIdAndDelete(rtqId);
    syncEvents.emitRollback(SYNC_EVENTS.RTQ_INSERT, rtqId.toString(), 'rtq', 'Qdrant insert failed, MongoDB rolled back');
    logger.info(`[RTQ-Sync] Rolled back RTQ ${rtqId} (MongoDB delete)`);
    return { success: true };
  } catch (err) {
    logger.error(`[RTQ-Sync] Rollback failed for RTQ ${rtqId}:`, err.message);
    return { success: false, error: err.message };
  }
}

export async function syncRTQBatchInsert(rtqs) {
  const results = await Promise.allSettled(rtqs.map(rtq => syncRTQInsert(rtq)));
  const succeeded = results.filter(r => r.status === 'fulfilled').length;
  const failed = results.filter(r => r.status === 'rejected').length;
  logger.info(`[RTQ-Sync] Batch insert complete: ${succeeded} succeeded, ${failed} failed`);
  return { succeeded, failed, results };
}