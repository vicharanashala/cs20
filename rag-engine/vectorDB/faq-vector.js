import FAQ from '../../server/src/models/FAQ.model.js';
import { cosineSimilarity } from '../similarity/cosine.similarity.js';
import embedder from '../embedding/embedder.js';

export class FAQVectorDB {
  async rebuildIndex() {
    const faqs = await FAQ.find();
    // Use only question text to match decision tree query behavior
    const texts = faqs.map(f => f.question);

    const vectors = await embedder.embedAsync(texts);
    await Promise.all(faqs.map((faq, i) => {
      faq.vectorEmbedding = vectors[i];
      return faq.save();
    }));
    return { count: faqs.length };
  }

  async findMostSimilar(questionEmbedding, { limit = 5 } = {}) {
    const faqs = await FAQ.find();
    const scored = faqs.map(faq => ({
      faq,
      score: cosineSimilarity(questionEmbedding, faq.vectorEmbedding || new Array(384).fill(0))
    }));
    scored.sort((a, b) => b.score - a.score);
    return scored.slice(0, limit);
  }

  async autoUpvoteFAQ(faqId, askerUserId) {
    const faq = await FAQ.findById(faqId);
    if (!faq) return { success: false, reason: 'FAQ not found' };

    if (faq.upvotedBy.includes(askerUserId)) {
      return { success: false, reason: 'already_upvoted', upvotes: faq.upvotes };
    }

    const updated = await FAQ.findByIdAndUpdate(
      faqId,
      {
        $inc: { upvotes: 1 },
        $addToSet: { upvotedBy: askerUserId }
      },
      { new: true }
    );

    return { success: true, reason: 'auto_upvoted', upvotes: updated.upvotes };
  }

  async getFAQAuthorId(faqId) {
    const faq = await FAQ.findById(faqId).select('createdBy');
    return faq ? faq.createdBy : null;
  }
}

export default new FAQVectorDB();
