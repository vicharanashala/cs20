import FAQ from '../../server/src/models/FAQ.model.js';
import { cosineSimilarity } from '../similarity/cosine.similarity.js';
import embedder from '../embedding/embedder.js';

export class FAQVectorDB {
  async rebuildIndex() {
    const faqs = await FAQ.find();
    const texts = faqs.map(f => `${f.question} ${f.answer} ${f.category} ${f.tags.join(' ')}`);

    // FIX #11: Rebuild shared IDF vocabulary from the full corpus before embedding
    embedder.rebuildVocabulary(texts);

    const vectors = embedder.embed(texts);
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

  async upvoteFAQ(faqId) {
    return await FAQ.findByIdAndUpdate(faqId, { $inc: { upvotes: 1 } }, { new: true });
  }
}

export default new FAQVectorDB();
