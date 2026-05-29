import dotenv from 'dotenv';
dotenv.config({ path: './.env' });
import mongoose from 'mongoose';
import FAQ from './models/FAQ.model.js';

function cosineSimilarity(a, b) {
  if (!a || !b || a.length !== b.length) return 0;
  let dot = 0, magA = 0, magB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    magA += a[i] * a[i];
    magB += b[i] * b[i];
  }
  const denom = Math.sqrt(magA) * Math.sqrt(magB);
  return denom === 0 ? 0 : dot / denom;
}

async function embedText(text) {
  const { pipeline, env } = await import('@xenova/transformers');
  env.allowLocalModels = false;
  env.useBrowserCache = false;
  const extractor = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2', { quantized: true });
  const result = await extractor(text, { pooling: 'mean', normalize: true });
  return Array.from(result.data);
}

async function check() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected to MongoDB');

  const faqs = await FAQ.find();
  console.log(`Total FAQs in DB: ${faqs.length}`);

  const firstFaq = faqs[0];
  console.log(`First FAQ: "${firstFaq.question}"`);
  console.log(`Has vectorEmbedding: ${!!firstFaq.vectorEmbedding}`);
  console.log(`Vector length: ${firstFaq.vectorEmbedding?.length}`);

  if (firstFaq.vectorEmbedding) {
    const mag = Math.sqrt(firstFaq.vectorEmbedding.reduce((s, v) => s + v * v, 0));
    console.log(`Vector magnitude: ${mag.toFixed(4)}`);
  }

  const weatherVec = await embedText("What is the weather like today?");
  console.log(`\nWeather vector magnitude: ${Math.sqrt(weatherVec.reduce((s, v) => s + v * v, 0)).toFixed(4)}`);

  if (firstFaq.vectorEmbedding) {
    const sim = cosineSimilarity(weatherVec, firstFaq.vectorEmbedding);
    console.log(`Weather vs first FAQ: ${sim.toFixed(4)}`);
  }

  await mongoose.disconnect();
}

check().catch(console.error);
