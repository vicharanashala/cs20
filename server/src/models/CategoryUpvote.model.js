import mongoose from 'mongoose';

const categoryUpvoteSchema = new mongoose.Schema({
  categoryName: { type: String, required: true, unique: true },
  upvotes: { type: Number, default: 0 },
  upvotedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  lastActivity: { type: Date, default: Date.now }
});

export default mongoose.model('CategoryUpvote', categoryUpvoteSchema);
