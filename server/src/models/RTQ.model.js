import mongoose from 'mongoose';

const rtqSchema = new mongoose.Schema({
  question: { type: String, required: true },
  category: { type: String, required: true },
  tags: [{ type: String }],
  answers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Answer' }],
  status: { type: String, enum: ['unresolved', 'partially_resolved', 'resolved', 'rejected'], default: 'unresolved' },
  upvotes: { type: Number, default: 0 },
  upvotedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  postedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  vectorEmbedding: [{ type: Number }],
  approvedAnswer: { type: mongoose.Schema.Types.ObjectId, ref: 'Answer' },
  faqId: { type: mongoose.Schema.Types.ObjectId, ref: 'FAQ' },
  isAccepted: { type: Boolean, default: false },
  acceptedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  rejectedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  markedForReview: { type: Boolean, default: false },
  reports: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

rtqSchema.index({ question: 'text', category: 'text', tags: 'text' });

export default mongoose.model('RTQ', rtqSchema);