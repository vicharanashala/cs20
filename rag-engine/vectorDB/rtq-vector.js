import RTQ from '../../server/src/models/RTQ.model.js';
import { cosineSimilarity } from '../similarity/cosine.similarity.js';
import embedder from '../embedding/embedder.js';

export class RTQVectorDB {
  async rebuildIndex() {
    const rtqs = await RTQ.find();
    const texts = rtqs.map(r => `${r.question} ${r.category} ${r.tags.join(' ')}`);

    // FIX #11: Rebuild shared IDF vocabulary from the full corpus before embedding
    embedder.rebuildVocabulary(texts);

    const vectors = embedder.embed(texts);
    await Promise.all(rtqs.map((rtq, i) => {
      rtq.vectorEmbedding = vectors[i];
      return rtq.save();
    }));
    return { count: rtqs.length };
  }

  async findMostSimilar(questionEmbedding, { limit = 5 } = {}) {
    const rtqs = await RTQ.find();
    const scored = rtqs.map(rtq => ({
      rtq,
      score: cosineSimilarity(questionEmbedding, rtq.vectorEmbedding || new Array(384).fill(0))
    }));
    scored.sort((a, b) => b.score - a.score);
    return scored.slice(0, limit);
  }

  async upvoteRTQ(rtqId) {
    return await RTQ.findByIdAndUpdate(rtqId, { $inc: { upvotes: 1 } }, { new: true });
  }
}

export default new RTQVectorDB();
