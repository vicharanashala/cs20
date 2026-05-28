import app from './app.js';
import { connectDB } from './config/db.js';
import { config } from './config/env.js';
import { validateConnection, isQdrantConnected } from './config/qdrant.js';
import { initializeAllCollections } from './services/vector/collection.service.js';
import logger from './utils/logger.js';

const start = async () => {
  try {
    await connectDB();
    logger.info('[INFO] MongoDB connected');

    const qdrantOk = await validateConnection();
    if (qdrantOk) {
      await initializeAllCollections();
      logger.info('[INFO] Qdrant collections initialized');
    } else {
      logger.warn('[WARN] Qdrant not connected — vector services unavailable. Set QDRANT_URL and QDRANT_API_KEY in .env');
    }

    app.listen(config.PORT, () => {
      logger.info(`[INFO] Server running on port ${config.PORT}`);
      logger.info(`[INFO] Environment: ${process.env.NODE_ENV || 'development'}`);
      logger.info(`[INFO] Qdrant: ${isQdrantConnected() ? 'connected' : 'DISCONNECTED'}`);
    });
  } catch (err) {
    logger.error('[ERROR] Failed to start server:', err);
    process.exit(1);
  }
};

start();