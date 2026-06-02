import User from '../models/User.model.js';
import Answer from '../models/Answer.model.js';
import Question from '../models/Question.model.js';

export async function listUsers(req, res) {
  try {
    const { role, search } = req.query;
    const filter = {};
    if (role) filter.role = role;
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { username: { $regex: search, $options: 'i' } }
      ];
    }

    if (req.user.role !== 'senior' && req.user.role !== 'admin') {
      filter.role = { $ne: 'senior' };
    }

    const users = await User.find(filter).select('-password -emailOtp -emailOtpExpires').sort({ qp: -1 });
    res.json(users);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
}

export async function getUser(req, res) {
  try {
    const user = await User.findById(req.params.id).select('-password -emailOtp -emailOtpExpires');
    if (!user) return res.status(404).json({ message: 'User not found' });

    const questionsAnswered = await Answer.countDocuments({ userId: req.params.id });
    const questionsRaised = await Question.countDocuments({ userId: req.params.id });

    res.json({ ...user.toObject(), questionsAnswered, questionsRaised });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
}

export async function updateProfile(req, res) {
  try {
    const { name } = req.body;
    const user = await User.findById(req.user._id);
    if (name) user.name = name;
    user.updatedAt = new Date();
    await user.save();
    res.json(user);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
}

export async function changePassword(req, res) {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user._id);
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) return res.status(400).json({ message: 'Current password is incorrect' });

    user.password = newPassword;
    await user.save();
    res.json({ message: 'Password changed successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
}

export async function restrictUser(req, res) {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    user.restrictedAt = user.restrictedAt ? null : new Date();
    await user.save();
    res.json({ message: user.restrictedAt ? 'User restricted' : 'User unrestricted', user });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
}

export async function removeUser(req, res) {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    user.status = 'blocked';
    user.email = `${user.email}_removed_${Date.now()}`;
    await user.save();
    res.json({ message: 'User removed (blocked)' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
}

// FIX #10: Removed duplicate getLeaderboard — use qp.controller.js version only
