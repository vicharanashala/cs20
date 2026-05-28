/**
 * Vector Health Routes
 * ====================
 *
 * Provides system health visibility into the vector infrastructure.
 *
 * GET /api/vector/health
 * Returns:
 *   - Qdrant connection status
 *   - Collection status (faq_collection, rtq_collection)
 *   - Vector counts (MongoDB vs Qdrant)
 *   - MongoDB ↔ Qdrant sync status
 *   - Missing/stray vector counts
 *
 * GET /api/vector/rebuild
 * Triggers full reindex of specified collection (faq, rtq, or all)
 * Protected: Senior/Admin only
 *
 * This endpoint is intentionally lightweight — full repair runs async.
 */

import express from 'express';
import { isQdrantConnected, validateConnection, checkCollectionsExist, getCollectionNames } from '../config/qdrant.js';
import { getCollectionStats } from '../services/vector/collection.service.js';
import { countFAQVectors } from '../services/vector/faq.vector.service.js';
import { countRTQVectors } from '../services/vector/rtq.vector.service.js';
import {
  detectMissingFAQVectors,
  detectStrayFAQVectors,
  detectMissingRTQVectors,
  detectStrayRTQVectors,
  rebuildFAQRVectors,
  rebuildRTQVectors,
  fullRepair,
} from '../services/sync/sync.repair.service.js';
import FAQ from '../models/FAQ.model.js';
import RTQ from '../models/RTQ.model.js';
import logger from '../utils/logger.js';

const router = express.Router();

router.get('/health', async (req, res) => {
  try {
    const { faq: FAQ_COLLECTION, rtq: RTQ_COLLECTION } = getCollectionNames();

    const [faqStats, rtqStats, faqVectorCount, rtqVectorCount, mongoFaqCount, mongoRtqCount] =
      await Promise.all([
        getCollectionStats(FAQ_COLLECTION).catch(err => ({ name: FAQ_COLLECTION, status: 'error', error: err.message })),
        getCollectionStats(RTQ_COLLECTION).catch(err => ({ name: RTQ_COLLECTION, status: 'error', error: err.message })),
        countFAQVectors(),
        countRTQVectors(),
        FAQ.countDocuments(),
        RTQ.countDocuments(),
      ]);

    const [missingFaq, strayFaq, missingRtq, strayRtq] = await Promise.all([
      detectMissingFAQVectors().catch(() => []),
      detectStrayFAQVectors().catch(() => []),
      detectMissingRTQVectors().catch(() => []),
      detectStrayRTQVectors().catch(() => []),
    ]);

    const isConnected = isQdrantConnected();

    res.json({
      timestamp: new Date().toISOString(),
      qdrant: {
        connected: isConnected,
        status: isConnected ? 'operational' : 'disconnected',
        url: process.env.QDRANT_URL ? '***' : 'not configured',
      },
      collections: {
        faq: {
          ...faqStats,
          qdrantVectors: faqVectorCount,
          mongoDocuments: mongoFaqCount,
          vectorDiff: mongoFaqCount - faqVectorCount,
          missingVectors: missingFaq.length,
          strayVectors: strayFaq.length,
          missingIds: missingFaq.slice(0, 10),
          strayIds: strayFaq.slice(0, 10),
        },
        rtq: {
          ...rtqStats,
          qdrantVectors: rtqVectorCount,
          mongoDocuments: mongoRtqCount,
          vectorDiff: mongoRtqCount - rtqVectorCount,
          missingVectors: missingRtq.length,
          strayVectors: strayRtq.length,
          missingIds: missingRtq.slice(0, 10),
          strayIds: strayRtq.slice(0, 10),
        },
      },
      sync: {
        status: (missingFaq.length + strayFaq.length + missingRtq.length + strayRtq.length) === 0
          ? 'synced'
          : 'inconsistent',
        totalIssues: missingFaq.length + strayFaq.length + missingRtq.length + strayRtq.length,
        missingCount: missingFaq.length + missingRtq.length,
        strayCount: strayFaq.length + strayRtq.length,
      },
    });
  } catch (err) {
    logger.error('[Vector-Health] Health check failed:', err.message);
    res.status(500).json({ error: 'Health check failed', message: err.message });
  }
});

router.post('/rebuild', async (req, res) => {
  try {
    const { collection = 'all', repair = true } = req.body;

    if (!['faq', 'rtq', 'all'].includes(collection)) {
      return res.status(400).json({ error: 'Invalid collection. Must be faq, rtq, or all' });
    }

    logger.info(`[Vector-Rebuild] Starting rebuild for: ${collection}, repair=${repair}`);

    if (repair) {
      const result = await fullRepair();
      return res.json({
        message: 'Repair completed',
        result,
        timestamp: new Date().toISOString(),
      });
    }

    if (collection === 'faq' || collection === 'all') {
      const result = await rebuildFAQRVectors();
      return res.json({
        message: 'FAQ rebuild completed',
        result,
        timestamp: new Date().toISOString(),
      });
    }

    if (collection === 'rtq' || collection === 'all') {
      const result = await rebuildRTQVectors();
      return res.json({
        message: 'RTQ rebuild completed',
        result,
        timestamp: new Date().toISOString(),
      });
    }
  } catch (err) {
    logger.error('[Vector-Rebuild] Rebuild failed:', err.message);
    res.status(500).json({ error: 'Rebuild failed', message: err.message });
  }
});

router.post('/validate', async (req, res) => {
  try {
    const connected = await validateConnection();
    res.json({
      connected,
      status: connected ? 'valid' : 'invalid',
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    res.status(500).json({ error: 'Validation failed', message: err.message });
  }
});

export default router;