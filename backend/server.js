import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import User from './models/User.js';
import VerificationCode from './models/VerificationCode.js';
import { hashPassword, verifyPassword, generateToken, generateVerificationCode } from './utils/crypto.js';
import { initializeEmailService, sendVerificationEmail, sendPasswordResetEmail } from './utils/email.js';
import { authMiddleware, errorHandler } from './middleware/auth.js';

dotenv.config();

const app = express();

// Middleware
app.use(express.json());
app.use(
  cors({
    origin: [
      'http://localhost:5173',
      'http://localhost:5174',
      'http://localhost:5175',
      'http://localhost:5176',
      process.env.FRONTEND_URL || 'http://localhost:5173'
    ],
    credentials: true,
  })
);

// Initialize email service
initializeEmailService();

// MongoDB Connection
const connectDB = async () => {
  try {
    const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/zenify';
    await mongoose.connect(uri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('MongoDB connected successfully');
  } catch (error) {
    console.error('MongoDB connection failed:', error.message);
    process.exit(1);
  }
};

connectDB();


// =====================
// AUTHENTICATION ROUTES
// =====================

// Register - Send verification code
app.post('/api/auth/register', async (req, res) => {
  try {
    const { name, email, password, confirmPassword } = req.body;

    // Validation
    if (!name || !email || !password || !confirmPassword) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({ error: 'Passwords do not match' });
    }

    // Check if email already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(409).json({ error: 'Email already registered' });
    }

    // Generate verification code
    const verificationCode = generateVerificationCode();
    const hashedPassword = await hashPassword(password);

    // Store verification code with expiration (1 minute)
    await VerificationCode.create({
      email: email.toLowerCase(),
      code: verificationCode,
      userData: {
        name,
        password: hashedPassword,
      },
      expiresAt: new Date(Date.now() + 1 * 60 * 1000),
    });

    // Send verification email
    await sendVerificationEmail(email, verificationCode);

    res.status(200).json({
      message: 'Verification code sent to your email',
      email: email,
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: error.message || 'Registration failed' });
  }
});

// Verify code and complete registration
app.post('/api/auth/verify', async (req, res) => {
  try {
    const { email, code } = req.body;

    if (!email || !code) {
      return res.status(400).json({ error: 'Email and code are required' });
    }

    // Check if verification code exists
    const verificationData = await VerificationCode.findOne({
      email: email.toLowerCase(),
    });

    if (!verificationData) {
      return res.status(400).json({ error: 'No verification code found. Please register again.' });
    }

    // Check if code is expired
    if (Date.now() > verificationData.expiresAt) {
      await VerificationCode.deleteOne({ _id: verificationData._id });
      return res.status(400).json({ error: 'Verification code has expired. Please register again.' });
    }

    // Check if code matches
    if (verificationData.code !== code) {
      verificationData.attempts += 1;
      if (verificationData.attempts >= verificationData.maxAttempts) {
        await VerificationCode.deleteOne({ _id: verificationData._id });
        return res
          .status(400)
          .json({ error: 'Too many failed attempts. Please register again.' });
      }
      await verificationData.save();
      return res.status(400).json({ error: 'Invalid verification code' });
    }

    // Create new user
    const newUser = await User.create({
      name: verificationData.userData.name,
      email: email.toLowerCase(),
      password: verificationData.userData.password,
      verified: true,
      verifiedAt: new Date(),
    });

    // Generate token
    const token = generateToken(newUser._id, newUser.email);

    // Clean up verification code
    await VerificationCode.deleteOne({ _id: verificationData._id });

    res.status(201).json({
      message: 'Email verified successfully. You can now login.',
      success: true,
      user: {
        id: newUser._id,
        name: newUser.name,
        email: newUser.email,
      },
      token,
    });
  } catch (error) {
    console.error('Verification error:', error);
    res.status(500).json({ error: error.message || 'Verification failed' });
  }
});

// Login
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Find user with password field selected
    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');

    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    if (!user.verified) {
      return res.status(403).json({ error: 'Email not verified. Please check your email.' });
    }

    // Verify password
    const passwordMatch = await verifyPassword(password, user.password);
    if (!passwordMatch) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Update last active
    user.stats.lastActive = new Date();
    await user.save();

    // Generate token
    const token = generateToken(user._id, user.email);

    const userData = {
      id: user._id,
      name: user.name,
      email: user.email,
      avatar: user.avatar,
      isAdmin: user.isAdmin,
    };

    res.status(200).json({
      message: 'Login successful',
      user: userData,
      token,
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: error.message || 'Login failed' });
  }
});

// Resend verification code
app.post('/api/auth/resend-code', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    const verificationData = await VerificationCode.findOne({
      email: email.toLowerCase(),
    });

    if (!verificationData) {
      return res.status(400).json({ error: 'No pending verification. Please register again.' });
    }

    // Generate new code
    const newCode = generateVerificationCode();
    verificationData.code = newCode;
    verificationData.attempts = 0;
    verificationData.expiresAt = new Date(Date.now() + 1 * 60 * 1000);
    await verificationData.save();

    // Send new code
    await sendVerificationEmail(email, newCode);

    res.status(200).json({
      message: 'New verification code sent to your email',
    });
  } catch (error) {
    console.error('Resend code error:', error);
    res.status(500).json({ error: error.message || 'Failed to resend code' });
  }
});

// Get user profile
app.get('/api/auth/profile', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.userId).select('-password');

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.status(200).json({
      user,
    });
  } catch (error) {
    console.error('Profile fetch error:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch profile' });
  }
});

// Update user profile
app.put('/api/auth/profile', authMiddleware, async (req, res) => {
  try {
    const { name, bio, avatar, preferences } = req.body;

    const user = await User.findByIdAndUpdate(
      req.userId,
      {
        name: name || undefined,
        bio: bio || undefined,
        avatar: avatar || undefined,
        preferences: preferences || undefined,
      },
      { new: true, runValidators: true }
    );

    res.status(200).json({
      message: 'Profile updated successfully',
      user,
    });
  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({ error: error.message || 'Failed to update profile' });
  }
});

// =====================
// CHAT ROUTES
// =====================

// Get chat statistics for user
app.get('/api/stats/overview', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.userId);

    res.status(200).json({
      user: {
        name: user.name,
        email: user.email,
        verified: user.verified,
        createdAt: user.createdAt,
      },
      stats: {
        lastActive: user.stats.lastActive,
      },
    });
  } catch (error) {
    console.error('Stats fetch error:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch statistics' });
  }
});

// Error handling middleware
app.use(errorHandler);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});
