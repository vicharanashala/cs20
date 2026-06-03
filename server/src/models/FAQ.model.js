import mongoose from 'mongoose';

const faqSchema = new mongoose.Schema({
  question: { type: String, required: true },
  answer: { type: String, required: true },
  category: { type: String, required: true },
  tags: [{ type: String }],
  upvotes: { type: Number, default: 0 },
  upvotedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  rtqId: { type: mongoose.Schema.Types.ObjectId, ref: 'RTQ' },
  vectorEmbedding: [{ type: Number }],
  isTrending: { type: Boolean, default: false },
  markedForReview: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

faqSchema.index({ question: 'text', answer: 'text', category: 'text', tags: 'text' });

export default mongoose.model('FAQ', faqSchema);