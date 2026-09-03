const express = require('express');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { User } = require('../models');
const { sendOTPEmail } = require('../services/email');

const router = express.Router();

// ── helpers ──────────────────────────────────────────────────────────────────

function generateOTP() {
  // Cryptographically random 6-digit code (100000–999999)
  return crypto.randomInt(100000, 1000000).toString();
}

function otpExpiry() {
  return new Date(Date.now() + 10 * 60 * 1000); // 10 minutes from now
}

// ── POST /auth/register ───────────────────────────────────────────────────────
// Step 1: submit email → receive OTP
// If the email already has a completed registration, reject.
// If the email is pending (is_registered: false), regenerate & resend OTP.

router.post('/register', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_INPUT', message: 'Email is required' },
      });
    }

    const existing = await User.findOne({ where: { email } });

    if (existing && existing.is_registered) {
      return res.status(409).json({
        success: false,
        error: { code: 'EMAIL_IN_USE', message: 'Email is already registered' },
      });
    }

    const otp = generateOTP();
    const otp_expires_at = otpExpiry();

    if (existing) {
      // Pending user — regenerate OTP and resend
      await existing.update({ otp, otp_expires_at }, { hooks: false });
    } else {
      await User.create({ email, otp, otp_expires_at }, { hooks: false });
    }

    await sendOTPEmail(email, otp);

    res.status(200).json({
      success: true,
      data: { email },
      message: 'OTP sent to your email. Please verify within 10 minutes.',
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: 'Server error' },
    });
  }
});

// ── POST /auth/verify ─────────────────────────────────────────────────────────
// Step 2: submit OTP + choose username & password → complete registration

router.post('/verify', async (req, res) => {
  try {
    const { email, otp, user_name, password } = req.body;

    if (!email || !otp || !user_name || !password) {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_INPUT', message: 'email, otp, user_name, and password are required' },
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_INPUT', message: 'Password must be at least 6 characters' },
      });
    }

    if (user_name.length < 3 || user_name.length > 30) {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_INPUT', message: 'Username must be 3–30 characters' },
      });
    }

    const user = await User.findOne({ where: { email, is_registered: false } });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'No pending registration found for this email' },
      });
    }

    if (!user.otp || !user.otp_expires_at) {
      return res.status(400).json({
        success: false,
        error: { code: 'NO_OTP', message: 'No OTP was issued. Please register again.' },
      });
    }

    if (new Date() > new Date(user.otp_expires_at)) {
      return res.status(400).json({
        success: false,
        error: { code: 'OTP_EXPIRED', message: 'OTP has expired. Please register again to receive a new code.' },
      });
    }

    if (user.otp !== otp) {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_OTP', message: 'Incorrect OTP' },
      });
    }

    // Check username availability
    const takenUsername = await User.findOne({ where: { username: user_name } });
    if (takenUsername) {
      return res.status(409).json({
        success: false,
        error: { code: 'USERNAME_TAKEN', message: 'Username is already taken' },
      });
    }

    const password_hash = await bcrypt.hash(password, 10);

    await user.update(
      {
        username: user_name,
        password_hash,
        is_registered: true,
        otp: null,
        otp_expires_at: null,
      },
      { hooks: false },
    );

    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: '7d' });

    res.status(201).json({
      success: true,
      data: {
        token,
        user: { id: user.id, user_name: user.username, email: user.email, is_admin: user.is_admin },
      },
      message: 'Email verified. Registration complete.',
    });
  } catch (error) {
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(409).json({
        success: false,
        error: { code: 'USERNAME_TAKEN', message: 'Username is already taken' },
      });
    }
    console.error(error);
    res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: 'Server error' },
    });
  }
});

// ── POST /auth/login ──────────────────────────────────────────────────────────

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_INPUT', message: 'Email and password are required' },
      });
    }

    const user = await User.findOne({ where: { email } });

    if (!user || !(await user.validatePassword(password))) {
      return res.status(401).json({
        success: false,
        error: { code: 'INVALID_CREDENTIALS', message: 'Invalid email or password' },
      });
    }

    if (!user.is_registered) {
      return res.status(403).json({
        success: false,
        error: { code: 'EMAIL_NOT_VERIFIED', message: 'Please verify your email before logging in' },
      });
    }

    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: '7d' });

    res.json({
      success: true,
      data: {
        token,
        user: { id: user.id, user_name: user.username, email: user.email, is_admin: user.is_admin },
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: 'Server error' },
    });
  }
});

module.exports = router;
