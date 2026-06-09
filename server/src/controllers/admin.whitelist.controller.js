/**
 * Admin Whitelist & Access Request Controller
 * ==========================================
 *
 * Handles:
 * - EmailWhitelist: add, remove, list emails allowed to sign up
 * - AccessRequest: view pending signup requests, approve (→ add to whitelist + create user), reject
 */

import EmailWhitelist from '../models/EmailWhitelist.model.js';
import AccessRequest from '../models/AccessRequest.model.js';
import User from '../models/User.model.js';
import { notifyUser } from '../services/notification.service.js';
import { awardQP } from '../services/qp.service.js';

export async function getWhitelist(req, res) {
  try {
    const entries = await EmailWhitelist.find()
      .populate('addedBy', 'name email role')
      .sort({ addedAt: -1 });
    res.json(entries);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
}

export async function addToWhitelist(req, res) {
  try {
    const { email, note } = req.body;
    if (!email) return res.status(400).json({ message: 'email is required' });

    const normalizedEmail = email.toLowerCase().trim();

    const existing = await EmailWhitelist.findOne({ email: normalizedEmail });
    if (existing) return res.status(400).json({ message: 'Email already in whitelist' });

    const entry = await EmailWhitelist.create({
      email: normalizedEmail,
      addedBy: req.user._id,
      note: note || null
    });

    const populated = await EmailWhitelist.findById(entry._id).populate('addedBy', 'name email role');
    res.status(201).json(populated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
}

export async function removeFromWhitelist(req, res) {
  try {
    const entry = await EmailWhitelist.findByIdAndDelete(req.params.id);
    if (!entry) return res.status(404).json({ message: 'Entry not found' });
    res.json({ message: 'Email removed from whitelist' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
}

export async function getAccessRequests(req, res) {
  try {
    const { status = 'pending' } = req.query;
    const requests = await AccessRequest.find({ status })
      .populate('reviewedBy', 'name email')
      .sort({ requestedAt: -1 });
    res.json(requests);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
}

export async function approveAccessRequest(req, res) {
  try {
    const { requestId } = req.params;

    const request = await AccessRequest.findById(requestId);
    if (!request) return res.status(404).json({ message: 'Access request not found' });
    if (request.status !== 'pending') return res.status(400).json({ message: 'Request already processed' });

    const existingUser = await User.findOne({ email: request.email });
    if (existingUser) {
      return res.status(400).json({ message: 'A user with this email already exists' });
    }

    const user = await User.create({
      name: request.name,
      username: request.username,
      email: request.email,
      password: request.password,
      role: 'student',
      status: 'active'
    });

    await awardQP(user._id, 100, 'Welcome bonus - Account activated');

    await EmailWhitelist.create({
      email: request.email.toLowerCase(),
      addedBy: req.user._id,
      note: `Approved from access request by ${req.user.name}`
    });

    request.status = 'approved';
    request.reviewedAt = new Date();
    request.reviewedBy = req.user._id;
    await request.save();

    await notifyUser(user._id, 'student', 'access_approved',
      'Your signup request has been approved. You can now login.', 0);

    res.json({ message: 'Access request approved — user created and email added to whitelist', userId: user._id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
}

export async function rejectAccessRequest(req, res) {
  try {
    const { requestId } = req.params;
    const { adminNote } = req.body;

    const request = await AccessRequest.findById(requestId);
    if (!request) return res.status(404).json({ message: 'Access request not found' });
    if (request.status !== 'pending') return res.status(400).json({ message: 'Request already processed' });

    request.status = 'rejected';
    request.reviewedAt = new Date();
    request.reviewedBy = req.user._id;
    request.adminNote = adminNote || null;
    await request.save();

    res.json({ message: 'Access request rejected' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
}