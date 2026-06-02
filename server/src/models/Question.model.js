import mongoose from 'mongoose';

const questionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  question: { type: String, required: true },
  category: { type: String, required: true },
  tags: [{ type: String }],
  status: { type: String, enum: ['unresolved', 'partially_resolved', 'resolved'], default: 'unresolved' },
  faqMatched: { type: Boolean, default: false },
  rtqMatched: { type: Boolean, default: false },
  answers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Answer' }],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

questionSchema.index({ userId: 1, createdAt: -1 });

export default mongoose.model('Question', questionSchema);