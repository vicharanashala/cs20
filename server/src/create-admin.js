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

  // Check the specific FAQ
  const faq = await FAQ.findById('6a1924d3dbc08dc779cc25cb');
  console.log(`FAQ ID 6a1924d3: "${faq.question}"`);
  console.log(`Vec mag: ${Math.sqrt(faq.vectorEmbedding.reduce((s, v) => s + v * v, 0)).toFixed(4)}`);

  // Test weather query
  const weatherVec = await embedText("What is the weather like today?");
  const sim = cosineSimilarity(weatherVec, faq.vectorEmbedding);
  console.log(`Weather vs this FAQ: ${sim.toFixed(4)}`);

  // List all unique questions and their count
  const allFaqs = await FAQ.find().select('question vectorEmbedding');
  console.log(`\nTotal FAQs: ${allFaqs.length}`);
  const questionCounts = {};
  for (const f of allFaqs) {
    const q = f.question;
    questionCounts[q] = (questionCounts[q] || 0) + 1;
  }
  console.log(`Unique questions: ${Object.keys(questionCounts).length}`);
  console.log(`Duplicate questions: ${Object.values(questionCounts).filter(c => c > 1).length}`);

  // Show some questions
  console.log('\nSample questions:');
  Object.keys(questionCounts).slice(0, 10).forEach((q, i) => {
    console.log(`  ${i + 1}. "${q.substring(0, 50)}" (${questionCounts[q]}x)`);
  });

  await mongoose.disconnect();
}

check().catch(console.error);
