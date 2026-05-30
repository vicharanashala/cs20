import CategoryUpvote from '../models/CategoryUpvote.model.js';
import { FAQ_CATEGORIES } from '../../../shared/constants.js';

/**
 * GET /api/faq/categories/ranked
 * Returns all categories sorted by upvotes (desc), then lastActivity (desc).
 * Categories with no DB record yet are included with upvotes: 0.
 */
export async function listCategoriesWithUpvotes(req, res) {
  try {
    const dbCategories = await CategoryUpvote.find();
    const dbMap = {};
    for (const cat of dbCategories) {
      dbMap[cat.categoryName] = cat;
    }

    const userId = req.user?._id?.toString();

    const ranked = FAQ_CATEGORIES.map(name => {
      const doc = dbMap[name];
      return {
        categoryName: name,
        upvotes: doc?.upvotes || 0,
        hasUpvoted: doc?.upvotedBy?.some(id => id.toString() === userId) || false,
        lastActivity: doc?.lastActivity || new Date(0),
        _id: doc?._id || null,
      };
    });

    // Sort: highest upvotes first, then most recent activity
    ranked.sort((a, b) => {
      if (b.upvotes !== a.upvotes) return b.upvotes - a.upvotes;
      return new Date(b.lastActivity) - new Date(a.lastActivity);
    });

    res.json(ranked);
  } catch (err) {
    console.error('[CategoryUpvote] listCategoriesWithUpvotes error:', err);
    res.status(500).json({ message: 'Server error' });
  }
}

/**
 * POST /api/faq/categories/upvote/:categoryName
 * Toggles upvote for the given category. Prevents duplicate votes.
 */
export async function upvoteCategory(req, res) {
  try {
    const { categoryName } = req.params;
    const decodedName = decodeURIComponent(categoryName);

    // Validate category exists in the master list
    if (!FAQ_CATEGORIES.includes(decodedName)) {
      return res.status(400).json({ message: `Invalid category: ${decodedName}` });
    }

    const userId = req.user._id;

    // Find or create the category upvote document
    let catDoc = await CategoryUpvote.findOne({ categoryName: decodedName });
    if (!catDoc) {
      catDoc = await CategoryUpvote.create({ categoryName: decodedName });
    }

    const alreadyUpvoted = catDoc.upvotedBy.some(id => id.toString() === userId.toString());

    if (alreadyUpvoted) {
      // Toggle off — remove upvote
      catDoc.upvotedBy = catDoc.upvotedBy.filter(id => id.toString() !== userId.toString());
      catDoc.upvotes = Math.max(0, catDoc.upvotes - 1);
    } else {
      // Toggle on — add upvote
      catDoc.upvotedBy.push(userId);
      catDoc.upvotes += 1;
    }

    catDoc.lastActivity = new Date();
    await catDoc.save();

    res.json({
      categoryName: decodedName,
      upvotes: catDoc.upvotes,
      upvoted: !alreadyUpvoted,
    });
  } catch (err) {
    console.error('[CategoryUpvote] upvoteCategory error:', err);
    res.status(500).json({ message: 'Server error' });
  }
}
