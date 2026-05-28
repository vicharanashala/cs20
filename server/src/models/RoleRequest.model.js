import mongoose from 'mongoose';

const roleRequestSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  email: {
    type: String,
    required: true,
    lowercase: true,
    trim: true
  },
  name: {
    type: String,
    required: true
  },
  username: {
    type: String,
    required: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  requestedRole: {
    type: String,
    enum: ['student', 'moderator', 'senior', 'admin'],
    default: 'student'
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  requestedAt: {
    type: Date,
    default: Date.now
  },
  reviewedAt: {
    type: Date
  },
  reviewedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  adminNote: {
    type: String
  }
});

roleRequestSchema.index({ email: 1, status: 1 });
roleRequestSchema.index({ status: 1, requestedAt: -1 });

export default mongoose.model('RoleRequest', roleRequestSchema);