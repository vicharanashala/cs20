import mongoose from 'mongoose';

const answerSchema = new mongoose.Schema({
  questionId: { type: mongoose.Schema.Types.ObjectId, ref: 'RTQ', required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  answer: { type: String, required: true },
  upvotes: { type: Number, default: 0 },
  upvotedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  isApproved: { type: Boolean, default: false },
  approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  approvals: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  rejections: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  markedForReview: { type: Boolean, default: false },
  isSelectedForFAQ: { type: Boolean, default: false },
  reports: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

export default mongoose.model('Answer', answerSchema);