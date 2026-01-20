import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import User from './models/User.js';
import Journal from './models/Journal.js';
import Chat from './models/Chat.js';
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
// JOURNAL ROUTES
// =====================

// Create journal
app.post('/api/journals', authMiddleware, async (req, res) => {
  try {
    const { title, content, mood, moodScore, tags, isPrivate } = req.body;

    if (!title || !content) {
      return res.status(400).json({ error: 'Title and content are required' });
    }

    const journal = await Journal.create({
      userId: req.userId,
      title,
      content,
      mood: mood || 'neutral',
      moodScore: moodScore || 5,
      tags: tags || [],
      isPrivate: isPrivate !== undefined ? isPrivate : true,
    });

    // Update user stats
    await User.findByIdAndUpdate(req.userId, {
      $inc: { 'stats.totalJournals': 1 },
    });

    res.status(201).json({
      message: 'Journal created successfully',
      journal,
    });
  } catch (error) {
    console.error('Journal creation error:', error);
    res.status(500).json({ error: error.message || 'Failed to create journal' });
  }
});

// Get all journals for user
app.get('/api/journals', authMiddleware, async (req, res) => {
  try {
    const { page = 1, limit = 10, mood, tag, search } = req.query;

    let query = { userId: req.userId, isArchived: false };

    if (mood) {
      query.mood = mood;
    }

    if (tag) {
      query.tags = { $in: [tag] };
    }

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { content: { $regex: search, $options: 'i' } },
      ];
    }

    const skip = (page - 1) * limit;

    const journals = await Journal.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Journal.countDocuments(query);

    res.status(200).json({
      journals,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Journal fetch error:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch journals' });
  }
});

// Get single journal
app.get('/api/journals/:id', authMiddleware, async (req, res) => {
  try {
    const journal = await Journal.findOne({
      _id: req.params.id,
      userId: req.userId,
    });

    if (!journal) {
      return res.status(404).json({ error: 'Journal not found' });
    }

    res.status(200).json({ journal });
  } catch (error) {
    console.error('Journal fetch error:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch journal' });
  }
});

// Update journal
app.put('/api/journals/:id', authMiddleware, async (req, res) => {
  try {
    const { title, content, mood, moodScore, tags, isPrivate, isFavorite } = req.body;

    const journal = await Journal.findOne({
      _id: req.params.id,
      userId: req.userId,
    });

    if (!journal) {
      return res.status(404).json({ error: 'Journal not found' });
    }

    // Store edit history
    if (journal.content !== content) {
      journal.editHistory.push({
        content: journal.content,
        editedAt: new Date(),
      });
    }

    journal.title = title || journal.title;
    journal.content = content || journal.content;
    journal.mood = mood || journal.mood;
    journal.moodScore = moodScore || journal.moodScore;
    journal.tags = tags || journal.tags;
    journal.isPrivate = isPrivate !== undefined ? isPrivate : journal.isPrivate;
    journal.isFavorite = isFavorite !== undefined ? isFavorite : journal.isFavorite;

    await journal.save();

    res.status(200).json({
      message: 'Journal updated successfully',
      journal,
    });
  } catch (error) {
    console.error('Journal update error:', error);
    res.status(500).json({ error: error.message || 'Failed to update journal' });
  }
});

// Delete journal
app.delete('/api/journals/:id', authMiddleware, async (req, res) => {
  try {
    const journal = await Journal.findOneAndDelete({
      _id: req.params.id,
      userId: req.userId,
    });

    if (!journal) {
      return res.status(404).json({ error: 'Journal not found' });
    }

    // Update user stats
    await User.findByIdAndUpdate(req.userId, {
      $inc: { 'stats.totalJournals': -1 },
    });

    res.status(200).json({
      message: 'Journal deleted successfully',
    });
  } catch (error) {
    console.error('Journal deletion error:', error);
    res.status(500).json({ error: error.message || 'Failed to delete journal' });
  }
});

// Archive journal
app.patch('/api/journals/:id/archive', authMiddleware, async (req, res) => {
  try {
    const journal = await Journal.findOneAndUpdate(
      { _id: req.params.id, userId: req.userId },
      { isArchived: true },
      { new: true }
    );

    if (!journal) {
      return res.status(404).json({ error: 'Journal not found' });
    }

    res.status(200).json({
      message: 'Journal archived successfully',
      journal,
    });
  } catch (error) {
    console.error('Journal archive error:', error);
    res.status(500).json({ error: error.message || 'Failed to archive journal' });
  }
});

// =====================
// CHAT ROUTES
// =====================

// Create chat conversation
app.post('/api/chats', authMiddleware, async (req, res) => {
  try {
    const { conversationTitle, initialMessage } = req.body;

    const chat = await Chat.create({
      userId: req.userId,
      conversationTitle: conversationTitle || 'New Conversation',
      messages: initialMessage
        ? [
            {
              role: 'user',
              content: initialMessage,
              timestamp: new Date(),
            },
          ]
        : [],
    });

    // Update user stats
    await User.findByIdAndUpdate(req.userId, {
      $inc: { 'stats.totalChats': 1 },
    });

    res.status(201).json({
      message: 'Chat created successfully',
      chat,
    });
  } catch (error) {
    console.error('Chat creation error:', error);
    res.status(500).json({ error: error.message || 'Failed to create chat' });
  }
});

// Get all chats for user
app.get('/api/chats', authMiddleware, async (req, res) => {
  try {
    const { page = 1, limit = 10, sentiment, riskLevel } = req.query;

    let query = { userId: req.userId, isArchived: false };

    if (sentiment) {
      query.sentiment = sentiment;
    }

    if (riskLevel) {
      query.riskLevel = riskLevel;
    }

    const skip = (page - 1) * limit;

    const chats = await Chat.find(query)
      .select('-messages')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Chat.countDocuments(query);

    res.status(200).json({
      chats,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Chat fetch error:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch chats' });
  }
});

// Get single chat
app.get('/api/chats/:id', authMiddleware, async (req, res) => {
  try {
    const chat = await Chat.findOne({
      _id: req.params.id,
      userId: req.userId,
    });

    if (!chat) {
      return res.status(404).json({ error: 'Chat not found' });
    }

    res.status(200).json({ chat });
  } catch (error) {
    console.error('Chat fetch error:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch chat' });
  }
});

// Add message to chat
app.post('/api/chats/:id/messages', authMiddleware, async (req, res) => {
  try {
    const { content, role = 'user' } = req.body;

    if (!content) {
      return res.status(400).json({ error: 'Message content is required' });
    }

    const chat = await Chat.findOne({
      _id: req.params.id,
      userId: req.userId,
    });

    if (!chat) {
      return res.status(404).json({ error: 'Chat not found' });
    }

    chat.messages.push({
      role,
      content,
      timestamp: new Date(),
    });

    await chat.save();

    res.status(201).json({
      message: 'Message added successfully',
      chat,
    });
  } catch (error) {
    console.error('Message add error:', error);
    res.status(500).json({ error: error.message || 'Failed to add message' });
  }
});

// Update chat metadata
app.put('/api/chats/:id', authMiddleware, async (req, res) => {
  try {
    const { conversationTitle, sentiment, riskLevel, tags, isFavorite, summary } = req.body;

    const chat = await Chat.findOneAndUpdate(
      { _id: req.params.id, userId: req.userId },
      {
        conversationTitle: conversationTitle || undefined,
        sentiment: sentiment || undefined,
        riskLevel: riskLevel || undefined,
        tags: tags || undefined,
        isFavorite: isFavorite !== undefined ? isFavorite : undefined,
        summary: summary || undefined,
      },
      { new: true, runValidators: true }
    );

    if (!chat) {
      return res.status(404).json({ error: 'Chat not found' });
    }

    res.status(200).json({
      message: 'Chat updated successfully',
      chat,
    });
  } catch (error) {
    console.error('Chat update error:', error);
    res.status(500).json({ error: error.message || 'Failed to update chat' });
  }
});

// Delete chat
app.delete('/api/chats/:id', authMiddleware, async (req, res) => {
  try {
    const chat = await Chat.findOneAndDelete({
      _id: req.params.id,
      userId: req.userId,
    });

    if (!chat) {
      return res.status(404).json({ error: 'Chat not found' });
    }

    // Update user stats
    await User.findByIdAndUpdate(req.userId, {
      $inc: { 'stats.totalChats': -1 },
    });

    res.status(200).json({
      message: 'Chat deleted successfully',
    });
  } catch (error) {
    console.error('Chat deletion error:', error);
    res.status(500).json({ error: error.message || 'Failed to delete chat' });
  }
});

// Archive chat
app.patch('/api/chats/:id/archive', authMiddleware, async (req, res) => {
  try {
    const chat = await Chat.findOneAndUpdate(
      { _id: req.params.id, userId: req.userId },
      { isArchived: true },
      { new: true }
    );

    if (!chat) {
      return res.status(404).json({ error: 'Chat not found' });
    }

    res.status(200).json({
      message: 'Chat archived successfully',
      chat,
    });
  } catch (error) {
    console.error('Chat archive error:', error);
    res.status(500).json({ error: error.message || 'Failed to archive chat' });
  }
});

// Get chat statistics for user
app.get('/api/stats/overview', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    const journalsCount = await Journal.countDocuments({
      userId: req.userId,
      isArchived: false,
    });
    const chatsCount = await Chat.countDocuments({
      userId: req.userId,
      isArchived: false,
    });

    const moodStats = await Journal.aggregate([
      { $match: { userId: mongoose.Types.ObjectId(req.userId) } },
      { $group: { _id: '$mood', count: { $sum: 1 } } },
    ]);

    res.status(200).json({
      user: {
        name: user.name,
        email: user.email,
        verified: user.verified,
        createdAt: user.createdAt,
      },
      stats: {
        totalJournals: journalsCount,
        totalChats: chatsCount,
        lastActive: user.stats.lastActive,
      },
      moodStats,
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
