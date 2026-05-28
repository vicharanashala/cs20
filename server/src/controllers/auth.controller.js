import { signupUser, verifyOTP, loginUser, getMe, requestReAccess } from '../services/auth.service.js';

export async function signup(req, res) {
  try {
    const { name, username, email, password } = req.body;
    if (!name || !username || !email || !password) {
      return res.status(400).json({ message: 'All fields are required' });
    }
    const result = await signupUser({ name, username, email, password });
    if (result.error) {
      return res.status(400).json({
        message: result.error,
        blocked: result.blocked || false,
        userId: result.userId || null
      });
    }
    res.status(201).json({ userId: result.userId, otp: result.otp, message: 'OTP sent to your email' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
}

export async function verifyOtp(req, res) {
  try {
    const { userId, otp } = req.body;
    if (!userId || !otp) {
      return res.status(400).json({ message: 'userId and otp are required' });
    }
    const result = await verifyOTP(userId, otp);
    if (result.error) {
      return res.status(400).json({ message: result.error });
    }
    res.json({ message: 'Account verified successfully', user: result.user });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
}

export async function login(req, res) {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }
    const result = await loginUser(email, password);
    if (result.error) {
      return res.status(401).json({ message: result.error });
    }
    res.json({ token: result.token, user: result.user });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
}

export async function me(req, res) {
  try {
    res.json(req.user);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
}

export async function logout(req, res) {
  res.json({ message: 'Logged out successfully' });
}

export async function requestReAccessUser(req, res) {
  try {
    const { userId, name, username, email, password } = req.body;
    if (!userId || !email || !password) {
      return res.status(400).json({ message: 'userId, email, and password are required' });
    }
    const result = await requestReAccess(userId, { name, username, email, password });
    if (result.error) {
      return res.status(400).json({ message: result.error });
    }
    res.status(201).json({ requestId: result.requestId, message: result.message });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
}