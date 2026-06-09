import User from '../models/User.model.js';
import FAQ from '../models/FAQ.model.js';
import RoleRequest from '../models/RoleRequest.model.js';
import { notifyUser } from '../services/notification.service.js';
import { awardQP } from '../services/qp.service.js';
import bcrypt from 'bcryptjs';

export async function getUsers(req, res) {
  try {
    const users = await User.find()
      .select('-password -emailOtp -emailOtpExpires')
      .sort({ createdAt: -1 });
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
    res.json(user);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
}

export async function addUser(req, res) {
  try {
    const { name, username, email, password, role } = req.body;
    if (!name || !username || !email || !password) {
      return res.status(400).json({ message: 'name, username, email, and password are required' });
    }

    const existing = await User.findOne({ $or: [{ email }, { username }] });
    if (existing) {
      if (existing.email === email) return res.status(400).json({ message: 'Email already registered' });
      return res.status(400).json({ message: 'Username already taken' });
    }

    const user = await User.create({
      name, username, email, password,
      role: role || 'student',
      status: 'active'
    });

    await awardQP(user._id, 100, 'Welcome bonus - Account activated');
    const updatedUser = await User.findById(user._id);

    await notifyUser(user._id, user.role, 'account_created_by_admin',
      'Your account was created by an admin. You can now login.', 0);

    const safeUser = updatedUser.toJSON();
    res.status(201).json(safeUser);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
}

export async function updateUser(req, res) {
  try {
    const { name, username, email } = req.body;
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    if (name) user.name = name;
    if (username) {
      const taken = await User.findOne({ username, _id: { $ne: user._id } });
      if (taken) return res.status(400).json({ message: 'Username already taken' });
      user.username = username;
    }
    if (email) {
      const taken = await User.findOne({ email, _id: { $ne: user._id } });
      if (taken) return res.status(400).json({ message: 'Email already in use' });
      user.email = email;
    }
    user.updatedAt = new Date();
    await user.save();

    res.json({ message: 'User updated', user: user.toJSON() });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
}

export async function assignRole(req, res) {
  try {
    const userId = req.params.id || req.body.userId;
    const { role } = req.body;
    if (!userId || !role) return res.status(400).json({ message: 'userId and role are required' });

    const validRoles = ['student', 'moderator', 'senior', 'admin'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({ message: 'Invalid role. Must be student, moderator, senior, or admin' });
    }

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    user.role = role;
    user.updatedAt = new Date();
    await user.save();

    await notifyUser(userId, role, 'role_changed',
      `Your role has been changed to ${role} by an admin`, 0);

    res.json({ message: `Role assigned: ${role}`, userId: user._id, user: user.toJSON() });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
}

export async function blockUser(req, res) {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    if (user.role === 'admin') return res.status(403).json({ message: 'Cannot block an admin' });

    user.status = 'blocked';
    user.restrictedAt = new Date();
    user.updatedAt = new Date();
    await user.save();

    await notifyUser(user._id, user.role, 'account_blocked',
      'Your account has been blocked by an admin', 0);

    res.json({ message: 'User blocked', user: user.toJSON() });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
}

export async function unblockUser(req, res) {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    user.status = 'active';
    user.restrictedAt = null;
    user.updatedAt = new Date();
    await user.save();

    await notifyUser(user._id, user.role, 'account_unblocked',
      'Your account has been unblocked by an admin', 0);

    res.json({ message: 'User unblocked', user: user.toJSON() });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
}

export async function reactivateUser(req, res) {
  try {
    const { email, username, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: 'email and password are required' });
    }

    const request = await RoleRequest.findOne({ email, status: 'approved' }).sort({ reviewedAt: -1 });
    if (!request) return res.status(404).json({ message: 'No approved re-access request found' });

    const user = await User.findById(request.userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    user.status = 'active';
    user.restrictedAt = null;
    user.email = email;
    user.username = username || user.username;
    if (password) user.password = password;
    user.updatedAt = new Date();
    await user.save();

    await RoleRequest.deleteMany({ userId: user._id, status: 'approved' });

    res.json({ message: 'User reactivated', user: user.toJSON() });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
}

export async function getPendingUsers(req, res) {
  try {
    const users = await User.find({ status: 'pending' }).select('-password -emailOtp -emailOtpExpires');
    res.json(users);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
}

export async function approveUser(req, res) {
  try {
    const { userId } = req.body;
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    user.status = 'active';
    user.updatedAt = new Date();
    await user.save();

    await awardQP(user._id, 100, 'Welcome bonus - Account activated');
    const updatedUser = await User.findById(userId);

    await notifyUser(userId, updatedUser.role, 'account_approved', 'Your account has been approved!', 0);
    res.json({ message: 'User approved', user: updatedUser.toJSON() });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
}

export async function rejectUser(req, res) {
  try {
    const { userId } = req.body;
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    user.status = 'blocked';
    user.updatedAt = new Date();
    await user.save();
    res.json({ message: 'User rejected and blocked' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
}

export async function getRoleRequests(req, res) {
  try {
    const { status = 'pending' } = req.query;
    const requests = await RoleRequest.find({ status })
      .populate('reviewedBy', 'name email')
      .sort({ requestedAt: -1 });
    res.json(requests);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
}

export async function approveRoleRequest(req, res) {
  try {
    const { requestId } = req.params;

    const request = await RoleRequest.findById(requestId);
    if (!request) return res.status(404).json({ message: 'Role request not found' });
    if (request.status !== 'pending') return res.status(400).json({ message: 'Request already processed' });

    let user = await User.findById(request.userId);

    if (!user) {
      user = await User.create({
        name: request.name,
        username: request.username,
        email: request.email,
        password: request.password,
        role: request.requestedRole,
        status: 'active'
      });
      await awardQP(user._id, 100, 'Welcome bonus - Account activated');
    } else {
      user.name = request.name;
      user.username = request.username;
      user.email = request.email;
      user.password = request.password;
      user.role = request.requestedRole;
      user.status = 'active';
      user.restrictedAt = null;
      user.updatedAt = new Date();
      await user.save();
    }

    const updatedUser = await User.findById(user._id);

    request.status = 'approved';
    request.reviewedAt = new Date();
    request.reviewedBy = req.user._id;
    await request.save();

    await notifyUser(updatedUser._id, updatedUser.role, 'reaccess_approved',
      'Your re-access request has been approved. You can now login.', 0);

    res.json({ message: 'Role request approved', user: updatedUser.toJSON() });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
}

export async function rejectRoleRequest(req, res) {
  try {
    const { requestId } = req.params;
    const { adminNote } = req.body;

    const request = await RoleRequest.findById(requestId);
    if (!request) return res.status(404).json({ message: 'Role request not found' });
    if (request.status !== 'pending') return res.status(400).json({ message: 'Request already processed' });

    request.status = 'rejected';
    request.reviewedAt = new Date();
    request.reviewedBy = req.user._id;
    request.adminNote = adminNote || null;
    await request.save();

    await notifyUser(request.userId, 'student', 'reaccess_rejected',
      'Your re-access request has been rejected.', 0);

    res.json({ message: 'Role request rejected' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
}

export async function deleteUser(req, res) {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    if (user.role === 'admin') return res.status(403).json({ message: 'Cannot delete an admin' });

    await User.findByIdAndDelete(req.params.id);
    await RoleRequest.deleteMany({ userId: req.params.id });

    res.json({ message: 'User deleted permanently' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
}

export async function bulkImportFAQs(req, res) {
  try {
    const { faqs } = req.body;
    if (!Array.isArray(faqs) || faqs.length === 0) {
      return res.status(400).json({ message: 'faqs array is required' });
    }

    const adminUser = req.user;
    const created = [];
    const errors = [];

    for (let i = 0; i < faqs.length; i++) {
      const item = faqs[i];
      try {
        const existing = await FAQ.findOne({ question: item.question });
        if (existing) {
          errors.push({ index: i, question: item.question, error: 'Duplicate — skipped' });
          continue;
        }
        const faq = await FAQ.create({
          question: item.question,
          answer: item.answer,
          category: item.category || 'General',
          tags: Array.isArray(item.tags) ? item.tags : [],
          createdBy: adminUser._id,
        });
        created.push({ _id: faq._id, question: faq.question, category: faq.category });
      } catch (err) {
        errors.push({ index: i, question: item.question, error: err.message });
      }
    }

    const { syncFAQInsert } = await import('../services/sync/faq.sync.service.js');
    for (const faq of created) {
      await syncFAQInsert(faq).catch(err => console.error('[BulkImport] Qdrant sync failed for', faq._id, err.message));
    }

    res.json({
      imported: created.length,
      skipped: errors.filter(e => e.error.includes('Duplicate')).length,
      errors: errors.filter(e => !e.error.includes('Duplicate')),
      details: created,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
}