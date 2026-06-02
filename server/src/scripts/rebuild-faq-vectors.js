import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config({ path: '../../.env' });

import FAQ from '../models/FAQ.model.js';
import { connectDB } from '../config/db.js';
import { validateConnection } from '../config/qdrant.js';
import { initializeAllCollections } from '../services/vector/collection.service.js';
import { insertFAQVector, countFAQVectors } from '../services/vector/faq.vector.service.js';

async function rebuildFAQVectors() {
  console.log('[Rebuild] Starting FAQ vector rebuild...\n');

  await connectDB();
  const qdrantOk = await validateConnection();
  if (!qdrantOk) {
    console.error('[Rebuild] Qdrant not connected. Set QDRANT_URL and QDRANT_API_KEY');
    process.exit(1);
  }
  await initializeAllCollections();

  const faqs = await FAQ.find().lean();
  console.log(`[Rebuild] Found ${faqs.length} FAQs in MongoDB\n`);

  const existing = await countFAQVectors();
  console.log(`[Rebuild] Existing vectors in Qdrant: ${existing}\n`);

  let success = 0;
  let failed = 0;

  for (const faq of faqs) {
    try {
      await insertFAQVector(faq);
      success++;
      process.stdout.write(`[${success + failed}] Embedded: ${faq.question.substring(0, 60)}...\n`);
    } catch (err) {
      failed++;
      console.error(`[Rebuild] Failed for FAQ ${faq._id}: ${err.message}`);
    }
  }

  const after = await countFAQVectors();
  console.log(`\n[Rebuild] Done. Success: ${success}, Failed: ${failed}`);
  console.log(`[Rebuild] Total vectors in Qdrant: ${after}`);

  await mongoose.disconnect();
  process.exit(0);
}

rebuildFAQVectors().catch(err => {
  console.error('[Rebuild] Fatal error:', err);
  process.exit(1);
});