import mongoose from 'mongoose';

const faqConversionRequestSchema = new mongoose.Schema({
  rtqId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'RTQ',
    required: true
  },
  rtqQuestion: {
    type: String,
    required: true
  },
  rtqAnswer: {
    type: String,
    default: null
  },
  suggestedAnswer: {
    type: String,
    default: null
  },
  requestedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  reviewedAt: {
    type: Date
  },
  reviewedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  adminNote: {
    type: String,
    default: null
  }
});

faqConversionRequestSchema.index({ status: 1, requestedAt: -1 });

export default mongoose.model('FAQConversionRequest', faqConversionRequestSchema);