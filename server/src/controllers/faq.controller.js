import FAQ from '../models/FAQ.model.js';
import { awardQP } from '../services/qp.service.js';
import { notifyUser } from '../services/notification.service.js';
import { FAQ_CATEGORIES } from '../../../shared/constants.js';
import { syncFAQInsert, syncFAQUpdate, syncFAQDelete, rollbackFAQInsert } from '../services/sync/faq.sync.service.js';
import logger from '../utils/logger.js';

export async function listFAQs(req, res) {
  try {
    const { category, sort = 'upvotes', sortDir, page = 1, limit = 30 } = req.query;
    const sortDirNum = sortDir ? parseInt(sortDir, 10) : -1;
    const filter = {};
    if (category) {
      let normalizedCategory = category.replace(/[\u2010-\u2015\u2212]/g, '-').replace(/\s*-\s*/g, ' - ');
      const escapedCategory = normalizedCategory.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
      const categoryPattern = escapedCategory.replace('\\ -\\ ', '\\s*[\\u2010-\\u2015\\u2212\\-]\\s*');
      filter.category = { $regex: new RegExp(`^(?:\\d+\\.\\s*)?${categoryPattern}$`, 'i') };
    }

    const pageNum = Math.max(1, parseInt(page, 10));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10)));
    const skip = (pageNum - 1) * limitNum;

    const [total, faqs, dbCategories] = await Promise.all([
      FAQ.countDocuments(filter),
      FAQ.find(filter)
        .populate('createdBy', 'name role')
        .sort({ [sort]: sortDirNum, createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      FAQ.distinct('category'),
    ]);

    const grouped = faqs.reduce((acc, faq) => {
      if (!acc[faq.category]) acc[faq.category] = [];
      acc[faq.category].push(faq);
      return acc;
    }, {});

    const categories = dbCategories;

    res.json({ faqs, grouped, categories, pagination: { page: pageNum, limit: limitNum, total } });
  } catch (err) {
    console.error('[FAQ listFAQs ERROR]', err);
    res.status(500).json({ message: 'Server error', detail: err.message });
  }
}

export async function getFAQ(req, res) {
  try {
    const faq = await FAQ.findById(req.params.id).populate('createdBy', 'name role');
    if (!faq) return res.status(404).json({ message: 'FAQ not found' });
    res.json(faq);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
}

export async function createFAQ(req, res) {
  try {
    const { question, answer, category, tags } = req.body;
    if (!question || !answer || !category) {
      return res.status(400).json({ message: 'question, answer, category are required' });
    }

    const faq = await FAQ.create({
      question, answer, category, tags: tags || [],
      createdBy: req.user._id
    });

    try {
      await syncFAQInsert(faq);
    } catch (vecErr) {
      logger.error(`[FAQ-Controller] Qdrant sync failed for FAQ ${faq._id} — rolling back MongoDB`);
      await rollbackFAQInsert(faq._id);
      return res.status(500).json({ message: 'Failed to index FAQ in vector store', error: vecErr.message });
    }

    await awardQP(req.user._id, 15, 'Created new FAQ manually', faq._id);
    await notifyUser(req.user._id, req.user.role, 'faq_created', 'Your new FAQ was created. +15 QP', 15, faq._id);

    res.status(201).json(faq);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
}

export async function updateFAQ(req, res) {
  try {
    const { question, answer, category, tags, isTrending, markedForReview } = req.body;
    const faq = await FAQ.findById(req.params.id);
    if (!faq) return res.status(404).json({ message: 'FAQ not found' });

    if (question) faq.question = question;
    if (answer) faq.answer = answer;
    if (category) faq.category = category;
    if (tags) faq.tags = tags;
    if (isTrending !== undefined) faq.isTrending = isTrending;
    if (markedForReview !== undefined) faq.markedForReview = markedForReview;
    faq.updatedAt = new Date();

    await faq.save();

    await syncFAQUpdate(req.params.id, faq);

    res.json(faq);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
}

export async function deleteFAQ(req, res) {
  try {
    const faq = await FAQ.findByIdAndDelete(req.params.id);
    if (!faq) return res.status(404).json({ message: 'FAQ not found' });

    await syncFAQDelete(req.params.id);

    res.json({ message: 'FAQ deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
}

export async function upvoteFAQ(req, res) {
  try {
    const faq = await FAQ.findById(req.params.id);
    if (!faq) return res.status(404).json({ message: 'FAQ not found' });

    const userId = req.user._id;
    const alreadyUpvoted = faq.upvotedBy.some(id => id.toString() === userId.toString());

    if (alreadyUpvoted) {
      faq.upvotedBy = faq.upvotedBy.filter(id => id.toString() !== userId.toString());
      faq.upvotes = Math.max(0, faq.upvotes - 1);
    } else {
      faq.upvotedBy.push(userId);
      faq.upvotes += 1;
    }

    await faq.save();
    res.json({ upvotes: faq.upvotes, upvoted: !alreadyUpvoted });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
}

export async function markFAQForReview(req, res) {
  try {
    const faq = await FAQ.findById(req.params.id);
    if (!faq) return res.status(404).json({ message: 'FAQ not found' });
    faq.markedForReview = true;
    await faq.save();
    try {
      await syncFAQUpdate(req.params.id, faq);
    } catch (err) {
      logger.error(`[FAQ-Controller] Qdrant update sync failed for reviewed FAQ ${faq._id}: ${err.message}`);
    }
    res.json(faq);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
}

export async function toggleTrendingFAQ(req, res) {
  try {
    const faq = await FAQ.findById(req.params.id);
    if (!faq) return res.status(404).json({ message: 'FAQ not found' });
    faq.isTrending = !faq.isTrending;
    await faq.save();
    try {
      await syncFAQUpdate(req.params.id, faq);
    } catch (err) {
      logger.error(`[FAQ-Controller] Qdrant update sync failed for trending FAQ ${faq._id}: ${err.message}`);
    }
    res.json(faq);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
}

export async function getCategories(req, res) {
  res.json(FAQ_CATEGORIES);
}