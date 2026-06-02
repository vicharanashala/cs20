import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import FAQ from '../server/src/models/FAQ.model.js';
import RTQ from '../server/src/models/RTQ.model.js';
import CategoryUpvote from '../server/src/models/CategoryUpvote.model.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load env variables from the server directory
dotenv.config({ path: path.join(__dirname, '../server/.env') });

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/qa-platform';

console.log('Connecting to database:', MONGO_URI);

const VALID_CATEGORIES = [
  'About the internship',
  'Timing and dates',
  'NOC (No Objection Certificate)',
  'Selection, offer letter, and certificate',
  'Work, mentorship, and projects',
  'Code of conduct - communication channels',
  'Interviews Related',
  'Certificate',
  'Rosetta - your internship journal',
  'General'
];

const categoryMap = {
  'Admissions': 'Selection, offer letter, and certificate',
  'Academics': 'Rosetta - your internship journal',
  'Placements': 'Interviews Related',
  'Campus Life': 'About the internship',
  'Fees & Scholarships': 'General',
  'Examinations': 'General',
  'Hostel & Facilities': 'About the internship',
  'Clubs & Activities': 'About the internship',
};

async function run() {
  await mongoose.connect(MONGO_URI);
  console.log('Connected to MongoDB.');

  const faqs = await FAQ.find({});
  console.log(`Found ${faqs.length} FAQs to process.`);

  let updatedFAQs = 0;
  for (const faq of faqs) {
    const oldCat = faq.category;
    if (!oldCat) continue;

    let newCat = oldCat.replace(/^\d+\.\s*/, '').trim();
    if (categoryMap[newCat]) {
      newCat = categoryMap[newCat];
    }

    if (!VALID_CATEGORIES.includes(newCat)) {
      newCat = 'General';
    }

    if (newCat !== oldCat) {
      faq.category = newCat;
      await faq.save();
      updatedFAQs++;
    }
  }
  console.log(`Updated ${updatedFAQs} FAQs.`);

  const rtqs = await RTQ.find({});
  console.log(`Found ${rtqs.length} RTQs to process.`);

  let updatedRTQs = 0;
  for (const rtq of rtqs) {
    const oldCat = rtq.category;
    if (!oldCat) continue;

    let newCat = oldCat.replace(/^\d+\.\s*/, '').trim();
    if (categoryMap[newCat]) {
      newCat = categoryMap[newCat];
    }

    if (!VALID_CATEGORIES.includes(newCat)) {
      newCat = 'General';
    }

    if (newCat !== oldCat) {
      rtq.category = newCat;
      await rtq.save();
      updatedRTQs++;
    }
  }
  console.log(`Updated ${updatedRTQs} RTQs.`);

  // Clean up CategoryUpvote collection
  console.log('Cleaning up CategoryUpvote collection...');
  await CategoryUpvote.deleteMany({});
  
  // Seed the CategoryUpvote documents for the 10 valid categories
  for (const catName of VALID_CATEGORIES) {
    await CategoryUpvote.create({
      categoryName: catName,
      upvotes: 0,
      upvotedBy: [],
      lastActivity: new Date()
    });
  }
  console.log('Seeded CategoryUpvote collection for the 10 valid categories.');

  await mongoose.disconnect();
  console.log('Disconnected from MongoDB. Migration completed successfully.');
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
