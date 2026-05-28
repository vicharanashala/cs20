/**
 * Sync Events
 * ===========
 *
 * Central event emitter for MongoDB ↔ Qdrant synchronization.
 * This is the "source of truth" for all sync-related events.
 *
 * WHY AN EVENT EMITTER:
 * ---------------------
 * Instead of tightly coupling controllers to sync logic, we emit events.
 * This allows:
 *   - Sync services to listen and react to MongoDB changes
 *   - Future listeners (logging, analytics, webhooks) to be added without code changes
 *   - Clear audit trail of all sync operations
 *
 * EVENT FLOW:
 * -----------
 * MongoDB write happens → Controller emits event → Sync service listener reacts
 *                                                  → Qdrant write happens
 *                                                  → Success/failure logged
 *
 * ROLLBACK STRATEGY:
 * ------------------
 * If Qdrant write fails after MongoDB succeeds:
 *   1. Emit 'sync:failed' event
 *   2. Listeners can roll back MongoDB (delete the document we just created)
 *   3. Error is logged with full context (mongoId, operation, error)
 *
 * CONSISTENCY GUARANTEE:
 * ----------------------
 * MongoDB is the primary store. Qdrant is a derived index.
 * If Qdrant goes down, MongoDB operations continue normally.
 * A repair service (sync.repair.service.js) can reconcile differences later.
 */

import { EventEmitter } from 'events';
import logger from '../../utils/logger.js';

class SyncEventEmitter extends EventEmitter {
  constructor() {
    super();
    this.setMaxListeners(50);

    this.on('sync:failed', (data) => {
      logger.error('[Sync-Event] Sync failed:', {
        operation: data.operation,
        mongoId: data.mongoId,
        collection: data.collection,
        error: data.error?.message || data.error,
        timestamp: new Date().toISOString(),
      });
    });

    this.on('sync:success', (data) => {
      logger.info('[Sync-Event] Sync success:', {
        operation: data.operation,
        mongoId: data.mongoId,
        collection: data.collection,
        timestamp: new Date().toISOString(),
      });
    });

    this.on('sync:retry', (data) => {
      logger.warn('[Sync-Event] Sync retrying:', {
        operation: data.operation,
        mongoId: data.mongoId,
        attempt: data.attempt,
        error: data.error?.message || data.error,
      });
    });

    this.on('sync:rollback', (data) => {
      logger.warn('[Sync-Event] Rollback executed:', {
        operation: data.operation,
        mongoId: data.mongoId,
        collection: data.collection,
        reason: data.reason,
      });
    });
  }

  emitSyncSuccess(operation, mongoId, collection) {
    this.emit('sync:success', { operation, mongoId, collection });
  }

  emitSyncFailure(operation, mongoId, collection, error) {
    this.emit('sync:failed', { operation, mongoId, collection, error });
  }

  emitSyncRetry(operation, mongoId, attempt, error) {
    this.emit('sync:retry', { operation, mongoId, attempt, error });
  }

  emitRollback(operation, mongoId, collection, reason) {
    this.emit('sync:rollback', { operation, mongoId, collection, reason });
  }
}

const syncEvents = new SyncEventEmitter();

export default syncEvents;

export const SYNC_EVENTS = {
  FAQ_INSERT: 'faq:insert',
  FAQ_UPDATE: 'faq:update',
  FAQ_DELETE: 'faq:delete',
  RTQ_INSERT: 'rtq:insert',
  RTQ_UPDATE: 'rtq:update',
  RTQ_DELETE: 'rtq:delete',
  RTQ_TO_FAQ: 'rtq:convert_to_faq',
  SYNC_SUCCESS: 'sync:success',
  SYNC_FAILED: 'sync:failed',
  SYNC_RETRY: 'sync:retry',
  SYNC_ROLLBACK: 'sync:rollback',
};