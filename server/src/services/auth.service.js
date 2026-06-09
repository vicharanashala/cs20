import jwt from 'jsonwebtoken';
import User from '../models/User.model.js';
import RoleRequest from '../models/RoleRequest.model.js';
import EmailWhitelist from '../models/EmailWhitelist.model.js';
import AccessRequest from '../models/AccessRequest.model.js';
import { config } from '../config/env.js';
import logger from '../utils/logger.js';
import { awardQP } from './qp.service.js';

function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function signupUser({ name, username, email, password }) {
  const existingUser = await User.findOne({ $or: [{ email }, { username }] });

  if (existingUser) {
    if (existingUser.status === 'blocked') {
      const pendingRequest = await RoleRequest.findOne({ email, status: 'pending' });
      if (pendingRequest) {
        return { error: 'A re-access request is already pending for this account. Please wait for admin approval.' };
      }
      return {
        error: 'Your account is blocked. Please submit a re-access request.',
        blocked: true,
        userId: existingUser._id
      };
    }
    if (existingUser.email === email) return { error: 'Email already registered' };
    return { error: 'Username already taken' };
  }

  const normalizedEmail = email.toLowerCase().trim();
  const inWhitelist = await EmailWhitelist.findOne({ email: normalizedEmail });
  if (!inWhitelist) {
    return {
      restricted: true,
      email: normalizedEmail,
      error: 'Access Restricted. This email is not on the accepted list.'
    };
  }

  const otp = generateOTP();
  const otpExpiry = new Date(Date.now() + config.OTP_EXPIRY_MINUTES * 60 * 1000);

  const user = await User.create({
    name, username, email, password,
    emailOtp: otp,
    emailOtpExpires: otpExpiry
  });

  logger.info(`[OTP] For ${email}: ${otp}`);
  return { userId: user._id, otp };
}

export async function requestAccess({ name, username, email, password }) {
  const normalizedEmail = email.toLowerCase().trim();

  const existingUser = await User.findOne({ $or: [{ email: normalizedEmail }, { username }] });
  if (existingUser) {
    return { error: 'A user with this email or username already exists.' };
  }

  const inWhitelist = await EmailWhitelist.findOne({ email: normalizedEmail });
  if (inWhitelist) {
    return { error: 'This email is already on the accepted list. You can sign up directly.' };
  }

  const pendingRequest = await AccessRequest.findOne({ email: normalizedEmail, status: 'pending' });
  if (pendingRequest) {
    return { error: 'An access request is already pending for this email.' };
  }

  const request = await AccessRequest.create({
    name,
    username,
    email: normalizedEmail,
    password
  });

  logger.info(`[AccessRequest] Pending request from ${normalizedEmail}`);
  return { requestId: request._id, message: 'Access request submitted. An admin will review it shortly.' };
}

export async function requestReAccess(userId, { name, username, email, password }) {
  const user = await User.findById(userId);
  if (!user || user.status !== 'blocked') {
    return { error: 'User not found or not blocked' };
  }

  const pendingRequest = await RoleRequest.findOne({ email, status: 'pending' });
  if (pendingRequest) {
    return { error: 'A re-access request is already pending. Please wait for admin approval.' };
  }

  const request = await RoleRequest.create({
    userId: user._id,
    name: name || user.name,
    username: username || user.username,
    email,
    password,
    requestedRole: 'student'
  });

  return { requestId: request._id, message: 'Re-access request submitted. An admin will review it shortly.' };
}

export async function verifyOTP(userId, otp) {
  const user = await User.findById(userId);
  if (!user) return { error: 'User not found' };
  if (user.status === 'active') return { error: 'Already verified' };
  if (user.emailOtp !== otp || new Date() > user.emailOtpExpires) {
    return { error: 'Invalid or expired OTP' };
  }

  user.status = 'active';
  user.emailOtp = undefined;
  user.emailOtpExpires = undefined;
  await user.save();
  await awardQP(user._id, 100, 'Welcome bonus - Account activated');
  const updatedUser = await User.findById(userId);
  return { user: updatedUser };
}

export async function loginUser(email, password) {
  const user = await User.findOne({ email });
  if (!user) return { error: 'Invalid credentials' };
  if (user.status === 'blocked') return { error: 'Account is blocked. Please request re-access.' };
  if (user.status !== 'active') return { error: 'Account not active. Please verify your email.' };

  const isMatch = await user.comparePassword(password);
  if (!isMatch) return { error: 'Invalid credentials' };

  const token = jwt.sign(
    { id: user._id, role: user.role, qp: user.qp },
    config.JWT_SECRET,
    { expiresIn: config.JWT_EXPIRES_IN }
  );

  return { token, user };
}

export async function getMe(userId) {
  const user = await User.findById(userId);
  return user ? user.toJSON() : null;
}