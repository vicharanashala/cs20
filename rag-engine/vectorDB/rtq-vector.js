import RTQ from '../../server/src/models/RTQ.model.js';
import { cosineSimilarity } from '../similarity/cosine.similarity.js';
import embedder from '../embedding/embedder.js';

export class RTQVectorDB {
  async rebuildIndex() {
    const rtqs = await RTQ.find();
    const texts = rtqs.map(r => `${r.question} ${r.category} ${(r.tags || []).join(' ')}`);

    const vectors = await embedder.embedAsync(texts);
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

  async autoUpvoteRTQ(rtqId, askerUserId) {
    const rtq = await RTQ.findById(rtqId);
    if (!rtq) return { success: false, reason: 'RTQ not found' };

    if (rtq.upvotedBy.includes(askerUserId)) {
      return { success: false, reason: 'already_upvoted', upvotes: rtq.upvotes };
    }

    const updated = await RTQ.findByIdAndUpdate(
      rtqId,
      {
        $inc: { upvotes: 1 },
        $addToSet: { upvotedBy: askerUserId }
      },
      { new: true }
    );

    return { success: true, reason: 'auto_upvoted', upvotes: updated.upvotes };
  }

  async getRTQAuthorId(rtqId) {
    const rtq = await RTQ.findById(rtqId).select('postedBy');
    return rtq ? rtq.postedBy : null;
  }
}

export default new RTQVectorDB();
