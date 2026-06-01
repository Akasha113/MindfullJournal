import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import User from './models/User.js';
import VerificationCode from './models/VerificationCode.js';
import CrisisAlert from './models/CrisisAlert.js';
import EncryptedChat from './models/EncryptedChat.js';
import EncryptedJournal from './models/EncryptedJournal.js';
import { hashPassword, verifyPassword, generateToken, generateVerificationCode } from './utils/crypto.js';
import { initializeEmailService, isEmailServiceReady, sendVerificationEmail, sendPasswordResetEmail, sendCrisisAlertEmail, sendAdminContactEmail } from './utils/email.js';
import { authMiddleware, optionalAuthMiddleware, errorHandler } from './middleware/auth.js';

dotenv.config();

const app = express();

// Middleware
app.use(express.json());

const corsOptions = {
  origin: [
    'http://localhost:5173',
    'http://localhost:5174',
    'http://localhost:5175',
    'http://localhost:3000',
    process.env.FRONTEND_URL || 'http://localhost:5173',
    /^http:\/\/localhost:\d+$/,       // Allow all localhost ports
    /\.vercel\.app$/,                 // Allow all Vercel deployment URLs
    'https://mindfuljournal.it.com',
    'http://mindfuljournal.it.com',
    'https://www.mindfuljournal.it.com',  // ✅ ADDED - www subdomain
    'http://www.mindfuljournal.it.com',
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions)); // ✅ ADDED - Handle preflight requests

// Initialize email service
initializeEmailService();

// MongoDB Connection
const connectDB = async () => {
  try {
    const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/mindful-journal';
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
      expiresAt: new Date(Date.now() + 10 * 60 * 1000),
    });

    // Send verification email
    try {
      await sendVerificationEmail(email, verificationCode);
      console.log('✅ Verification email sent to:', email);
    } catch (emailError) {
      console.error('❌ Email send failed:', emailError.message);
      // Continue anyway - user can see the code in console for testing
      console.log('🔐 Verification code (for testing):', verificationCode);
    }

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

    // Trim and remove all whitespace from code
    const trimmedCode = code.trim().replace(/\s/g, '');
    
    console.log('🔍 Verify request - Email:', email);
    console.log('   Received code:', code);
    console.log('   Trimmed code:', trimmedCode);

    if (!email || !trimmedCode) {
      return res.status(400).json({ error: 'Email and code are required' });
    }

    // Check if verification code exists
    const verificationData = await VerificationCode.findOne({
      email: email.toLowerCase(),
    });

    if (!verificationData) {
      return res.status(400).json({ error: 'No verification code found. Please register again.' });
    }

    console.log('   Stored code:', verificationData.code);
    console.log('   Code match:', verificationData.code === trimmedCode);

    // Check if code is expired
    if (Date.now() > verificationData.expiresAt) {
      await VerificationCode.deleteOne({ _id: verificationData._id });
      return res.status(400).json({ error: 'Verification code has expired. Please register again.' });
    }

    // Check if code matches (compare trimmed codes)
    if (verificationData.code !== trimmedCode) {
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

    // Generate password hash for encryption key derivation on frontend
    const passwordHash = crypto
      .createHash('sha256')
      .update(email.toLowerCase() + verificationData.userData.password + 'mindful-encryption-salt-v1')
      .digest('hex');

    // Clean up verification code
    await VerificationCode.deleteOne({ _id: verificationData._id });

    res.status(201).json({
      message: 'Email verified successfully. You can now login.',
      success: true,
      user: {
        id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        passwordHash: passwordHash, // Add for encryption key derivation
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

    // Generate password hash for encryption key derivation on frontend
    const passwordHash = crypto
      .createHash('sha256')
      .update(email + password + 'mindful-encryption-salt-v1')
      .digest('hex');

    const userData = {
      id: user._id,
      name: user.name,
      email: user.email,
      avatar: user.avatar,
      isAdmin: user.isAdmin,
      passwordHash: passwordHash, // Add for encryption key derivation
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

// Forgot Password - Send reset link
app.post('/api/auth/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    // Check if user exists and is verified
    const user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
      return res.status(400).json({ 
        error: 'Email not registered. Please enter a registered email address.' 
      });
    }

    if (!user.verified) {
      return res.status(400).json({ 
        error: 'Email not verified. Please verify your email first.' 
      });
    }

    // Generate reset token and code
    const resetCode = generateVerificationCode();
    const resetToken = jwt.sign({ userId: user._id, resetCode }, process.env.JWT_SECRET, {
      expiresIn: '1h',
    });

    // Store reset code in verification collection
    let verificationData = await VerificationCode.findOne({ email });

    if (!verificationData) {
      verificationData = new VerificationCode({
        email,
        code: resetCode,
        type: 'password_reset',
        expiresAt: new Date(Date.now() + 60 * 60 * 1000), // 1 hour
      });
    } else {
      verificationData.code = resetCode;
      verificationData.type = 'password_reset';
      verificationData.expiresAt = new Date(Date.now() + 60 * 60 * 1000);
    }

    await verificationData.save();

    // Send reset link email
    const resetURL = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/reset-password?token=${resetToken}&code=${resetCode}`;
    
    try {
      await sendPasswordResetEmail(email, resetURL);
      console.log('✅ Password reset email sent to:', email);
    } catch (emailError) {
      console.error('⚠️ Failed to send reset email:', emailError.message);
      // Log reset link for testing/development
      if (process.env.NODE_ENV === 'development') {
        console.log('🔐 TEST MODE - Reset link (copy this):', resetURL);
        console.log('🔐 TEST MODE - Reset code:', resetCode);
      }
    }

    res.status(200).json({ 
      message: 'If an account exists with this email, a reset link has been sent.',
      // Include reset URL for testing (remove in production)
      ...(process.env.NODE_ENV === 'development' && { resetURL, resetCode })
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ error: error.message || 'Failed to process password reset' });
  }
});

// Reset Password - Actually change the password
app.post('/api/auth/reset-password', async (req, res) => {
  try {
    const { token, code, newPassword, confirmPassword } = req.body;

    console.log('🔐 Reset password request received');
    console.log('Request body:', JSON.stringify({ token: !!token, code, newPassword: !!newPassword, confirmPassword: !!confirmPassword }));

    if (!token || !code || !newPassword || !confirmPassword) {
      console.error('❌ Missing fields:', { token: !!token, code: !!code, newPassword: !!newPassword, confirmPassword: !!confirmPassword });
      return res.status(400).json({ error: 'Missing required fields' });
    }

    if (newPassword !== confirmPassword) {
      console.error('❌ Passwords do not match');
      return res.status(400).json({ error: 'Passwords do not match' });
    }

    if (newPassword.length < 6) {
      console.error('❌ Password too short:', newPassword.length);
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    // Verify JWT token
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
      console.log('✅ JWT verified successfully');
      console.log('Decoded JWT:', { userId: decoded.userId, hasResetCode: !!decoded.resetCode });
    } catch (err) {
      console.error('❌ JWT verification failed:', err.message);
      return res.status(400).json({ error: 'Invalid or expired reset link' });
    }

    const { userId, resetCode } = decoded;

    // Find user
    const user = await User.findById(userId);

    if (!user) {
      console.error('❌ User not found for ID:', userId);
      return res.status(404).json({ error: 'User not found' });
    }

    console.log('✅ User found:', user.email);

    // Verify the reset code matches what we sent
    // The code sent in the request should match the resetCode in the JWT
    console.log('Comparing codes:');
    console.log('  Code from URL:', code);
    console.log('  ResetCode from JWT:', resetCode);
    console.log('  Match:', code === resetCode);

    if (code !== resetCode) {
      console.error('❌ Code mismatch. Sent:', code, 'Expected:', resetCode);
      return res.status(400).json({ error: 'Invalid reset code' });
    }

    // Find verification record to check expiration
    console.log('Looking for verification record with email:', user.email, 'and code:', code);
    const verificationData = await VerificationCode.findOne({
      email: user.email,
      code: code,
    });

    if (!verificationData) {
      console.error('❌ Verification record not found for email:', user.email);
      console.error('Searching with:', { email: user.email, code });
      return res.status(400).json({ error: 'Verification record not found' });
    }

    console.log('✅ Verification record found');

    // Check if code is expired
    if (verificationData.expiresAt < new Date()) {
      console.error('❌ Reset code expired at:', verificationData.expiresAt);
      await VerificationCode.deleteOne({ _id: verificationData._id });
      return res.status(400).json({ error: 'Reset link has expired. Please request a new one.' });
    }

    console.log('✅ Code is valid and not expired');

    // Hash new password
    const hashedPassword = await hashPassword(newPassword);
    user.password = hashedPassword;
    await user.save();

    console.log('✅ Password updated successfully');

    // Delete verification code
    await VerificationCode.deleteOne({ _id: verificationData._id });

    res.status(200).json({
      message: 'Password has been reset successfully. You can now login with your new password.',
      success: true,
    });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ error: error.message || 'Failed to reset password' });
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
    verificationData.expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
    await verificationData.save();

    console.log('✅ Generated new verification code:', newCode);

    // Send new code
    let emailSent = false;
    try {
      await sendVerificationEmail(email, newCode);
      emailSent = true;
      console.log('✅ Resent verification email to:', email);
    } catch (emailError) {
      console.error('❌ Email send failed during resend:', emailError.message);
      console.log('🔐 New verification code (for testing):', newCode);
      // Continue anyway - code is saved in DB
    }

    res.status(200).json({
      message: 'New verification code sent to your email',
      code: newCode, // Include for testing (remove in production)
      emailSent: emailSent,
    });
  } catch (error) {
    console.error('Resend code error:', error);
    res.status(500).json({ error: error.message || 'Failed to resend code' });
  }
});

// Debug endpoint to test email sending
app.post('/api/debug/test-email', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    console.log('\n🧪 Testing email send to:', email);
    console.log('📧 Gmail User:', process.env.GMAIL_USER);
    console.log('🔑 Gmail Password Set:', !!process.env.GMAIL_APP_PASSWORD);

    const testCode = '123456';
    await sendVerificationEmail(email, testCode);

    res.status(200).json({
      success: true,
      message: 'Test email sent successfully!',
      testTo: email,
      testCode: testCode,
    });
  } catch (error) {
    console.error('❌ Test email failed:', error.message);
    res.status(500).json({
      success: false,
      error: error.message,
      hint: 'Check your Gmail credentials in .env file. Make sure 2FA is enabled and you have an App Password.',
    });
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

// =====================
// ADMIN ROUTES
// =====================

// Admin login
app.post('/api/admin/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    console.log('\n👤 Admin Login Attempt:');
    console.log('  Email:', email);

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }

    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');

    console.log('  User found:', !!user);
    console.log('  isAdmin:', user?.isAdmin);

    if (!user || !user.isAdmin) {
      console.log('  ❌ Not an admin or user not found');
      return res.status(401).json({ error: 'Invalid admin credentials' });
    }

    const isPasswordValid = await verifyPassword(password, user.password);
    console.log('  Password valid:', isPasswordValid);

    if (!isPasswordValid) {
      console.log('  ❌ Invalid password');
      return res.status(401).json({ error: 'Invalid admin credentials' });
    }

    const token = generateToken(user._id);
    console.log('  ✅ Login successful');
    res.status(200).json({
      message: 'Admin logged in successfully',
      token,
      admin: {
        id: user._id,
        name: user.name,
        email: user.email,
        isAdmin: user.isAdmin,
      },
    });
  } catch (error) {
    console.error('❌ Admin login error:', error);
    res.status(500).json({ error: error.message || 'Admin login failed' });
  }
});

// Get all users (admin only)
app.get('/api/admin/users', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user || !user.isAdmin) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    const users = await User.find({}).select('-password');
    res.status(200).json({
      message: 'Users fetched successfully',
      count: users.length,
      users: users.map(u => ({
        id: u._id,
        name: u.name,
        email: u.email,
        verified: u.verified,
        createdAt: u.createdAt,
        isAdmin: u.isAdmin,
      })),
    });
  } catch (error) {
    res.status(500).json({ error: error.message || 'Failed to fetch users' });
  }
});

// Get user details (admin only)
app.get('/api/admin/users/:userId', authMiddleware, async (req, res) => {
  try {
    const adminUser = await User.findById(req.userId);
    if (!adminUser || !adminUser.isAdmin) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    const user = await User.findById(req.params.userId).select('-password');
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.status(200).json({
      message: 'User details fetched',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        verified: user.verified,
        verifiedAt: user.verifiedAt,
        createdAt: user.createdAt,
        bio: user.bio,
        isAdmin: user.isAdmin,
      },
    });
  } catch (error) {
    res.status(500).json({ error: error.message || 'Failed to fetch user' });
  }
});

// =====================
// CRISIS MONITORING ROUTES
// =====================

// Create crisis alert (called from detection system)
// Create crisis alert (called from detection system) - Optional auth
app.post('/api/admin/crisis-alerts', async (req, res) => {
  try {
    const { userId, content, contentType, riskLevel, riskScore, detectedKeywords, riskFactors, conversationId, journalId } = req.body;

    // Normalize and resolve userId: allow anonymous alerts when userId is missing/invalid.
    // If the client supplied an email address instead of an ObjectId, attempt to
    // resolve that to the user's ObjectId so admins can contact the correct user.
    let normalizedUserId = null;
    try {
      const mongoose = await import('mongoose');
      if (userId && mongoose.Types.ObjectId.isValid(userId)) {
        normalizedUserId = new mongoose.Types.ObjectId(userId);
      } else if (userId) {
        // Not a valid ObjectId; try to resolve by email
        try {
          const found = await User.findOne({ email: String(userId).toLowerCase() }).select('_id');
          if (found) {
            normalizedUserId = found._id;
            console.log('Resolved userId from email to ObjectId:', normalizedUserId.toString());
          } else {
            console.warn('Could not resolve provided userId value as ObjectId or email:', userId);
          }
        } catch (resolveErr) {
          console.warn('Error resolving userId by email:', resolveErr.message);
        }
      }
    } catch (e) {
      console.warn('Could not validate userId for crisis alert:', e.message);
    }

    console.log('📝 Creating crisis alert for user:', userId);
    console.log('📝 Alert content:', content);
    console.log('📝 User snapshot from request:', req.body.userName, req.body.userEmail);

    // Validate required fields (content is required; userId is optional/anonymous)
    if (!content) {
      console.error('❌ Missing required field - content');
      return res.status(400).json({ error: 'Content is required' });
    }

    // Build alert data, include userId only when normalizedUserId is valid
    const alertData = {
      content,
      contentType,
      riskLevel,
      riskScore,
      detectedKeywords: detectedKeywords || [],
      riskFactors: riskFactors || [],
      conversationId,
      journalId,
      urgencyLevel: riskLevel === 'critical' ? 'emergency' : riskLevel === 'high' ? 'urgent' : 'routine',
    };

    if (normalizedUserId) {
      alertData.userId = normalizedUserId;
    }

    // Attach user snapshot when available (either resolved user or client-supplied)
    if (!alertData.userSnapshot) {
      // try to get name/email from request body if supplied (check multiple possible field names)
      const userName = req.body.userName || req.body.name || req.body.userName || req.body.displayName;
      const userEmail = req.body.userEmail || req.body.email || req.body.userEmail || req.body.mail;
      if (userName || userEmail) {
        alertData.userSnapshot = {
          name: userName || '',
          email: userEmail || '',
        };
        console.log('📧 Created user snapshot:', alertData.userSnapshot);
      }
    }

    // Create crisis alert
    const alert = new CrisisAlert(alertData);

    await alert.save();
    console.log('✅ Crisis alert saved to database:', alert._id);

    // Fetch user details for email (prefer real user record), otherwise use snapshot
    let userDetails = null;
    if (normalizedUserId) {
      userDetails = await User.findById(normalizedUserId);
      console.log('👤 User details fetched:', userDetails?.name, userDetails?.email);
    } else if (alert.userSnapshot && alert.userSnapshot.email) {
      userDetails = {
        name: alert.userSnapshot.name || 'Unknown',
        email: alert.userSnapshot.email,
      };
      console.log('👤 Using user snapshot for contact:', userDetails.name, userDetails.email);
    } else {
      console.log('👤 Alert created as anonymous (no valid user ID or snapshot)');
    }

    console.log('📧 Final userDetails for email:', userDetails);

    // Send email notification to admin
    try {
      const adminEmail = process.env.ADMIN_EMAIL || 'mindfuljounralofficial@gmail.com';
      console.log('📧 Sending crisis alert email to:', adminEmail);
      console.log('   From:', process.env.GMAIL_USER);
      
      // Use user details if available; otherwise use placeholder
      const emailUserDetails = userDetails || {
        name: 'Anonymous User',
        email: 'unknown@anonymous.local'
      };
      
      await sendCrisisAlertEmail(
        adminEmail,
        emailUserDetails,
        alert
      );
      console.log('✅ Crisis alert email sent successfully!');
    } catch (emailError) {
      console.error('❌ Failed to send crisis alert email:', emailError.message);
      console.error('Email error details:', emailError);
      // Continue - alert was saved to DB successfully, email is secondary
    }

    res.status(201).json({
      message: 'Crisis alert created',
      alert: alert,
    });
  } catch (error) {
    console.error('❌ Error creating crisis alert:', error);
    res.status(500).json({ error: error.message || 'Failed to create crisis alert' });
  }
});

// Get all crisis alerts (admin only)
app.get('/api/admin/crisis-alerts', authMiddleware, async (req, res) => {
  try {
    const adminUser = await User.findById(req.userId);
    if (!adminUser || !adminUser.isAdmin) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    const { status, riskLevel, sort } = req.query;
    const filter = {};

    if (status) filter.status = status;
    if (riskLevel) filter.riskLevel = riskLevel;

    const alerts = await CrisisAlert.find(filter)
      .populate('userId', 'name email')
      .populate('reviewedBy', 'name email')
      .sort({ createdAt: -1 })
      .limit(100);

    res.status(200).json({
      message: 'Crisis alerts fetched',
      count: alerts.length,
      alerts: alerts,
    });
  } catch (error) {
    res.status(500).json({ error: error.message || 'Failed to fetch crisis alerts' });
  }
});

// Get specific crisis alert
app.get('/api/admin/crisis-alerts/:alertId', authMiddleware, async (req, res) => {
  try {
    const adminUser = await User.findById(req.userId);
    if (!adminUser || !adminUser.isAdmin) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    const alert = await CrisisAlert.findById(req.params.alertId)
      .populate('userId', 'name email bio')
      .populate('reviewedBy', 'name email');

    if (!alert) {
      return res.status(404).json({ error: 'Alert not found' });
    }

    res.status(200).json({
      message: 'Alert details fetched',
      alert: alert,
    });
  } catch (error) {
    res.status(500).json({ error: error.message || 'Failed to fetch alert' });
  }
});

// Update crisis alert status and add intervention
app.patch('/api/admin/crisis-alerts/:alertId', authMiddleware, async (req, res) => {
  try {
    const adminUser = await User.findById(req.userId);
    if (!adminUser || !adminUser.isAdmin) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    const { status, adminNotes, interventionTaken, interventionDetails, followUpRequired, followUpDate } = req.body;

    const alert = await CrisisAlert.findByIdAndUpdate(
      req.params.alertId,
      {
        status,
        adminNotes,
        interventionTaken,
        interventionDetails,
        followUpRequired,
        followUpDate,
        reviewedAt: new Date(),
        reviewedBy: adminUser._id,
      },
      { new: true }
    ).populate('userId', 'name email').populate('reviewedBy', 'name email');

    res.status(200).json({
      message: 'Alert updated successfully',
      alert: alert,
    });
  } catch (error) {
    res.status(500).json({ error: error.message || 'Failed to update alert' });
  }
});

// Get crisis alerts for a specific user
app.get('/api/admin/users/:userId/crisis-alerts', authMiddleware, async (req, res) => {
  try {
    const adminUser = await User.findById(req.userId);
    if (!adminUser || !adminUser.isAdmin) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    const alerts = await CrisisAlert.find({ userId: req.params.userId })
      .sort({ createdAt: -1 });

    res.status(200).json({
      message: 'User crisis alerts fetched',
      count: alerts.length,
      alerts: alerts,
    });
  } catch (error) {
    res.status(500).json({ error: error.message || 'Failed to fetch user alerts' });
  }
});

// Get crisis statistics
app.get('/api/admin/crisis-stats', authMiddleware, async (req, res) => {
  try {
    const adminUser = await User.findById(req.userId);
    if (!adminUser || !adminUser.isAdmin) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    const totalAlerts = await CrisisAlert.countDocuments();
    const pendingAlerts = await CrisisAlert.countDocuments({ status: 'pending' });
    const criticalAlerts = await CrisisAlert.countDocuments({ riskLevel: 'critical' });
    const highRiskAlerts = await CrisisAlert.countDocuments({ riskLevel: 'high' });
    const emergencyAlerts = await CrisisAlert.countDocuments({ urgencyLevel: 'emergency' });

    const alertsByStatus = await CrisisAlert.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
        },
      },
    ]);

    const alertsByRisk = await CrisisAlert.aggregate([
      {
        $group: {
          _id: '$riskLevel',
          count: { $sum: 1 },
        },
      },
    ]);

    res.status(200).json({
      message: 'Crisis statistics fetched',
      stats: {
        totalAlerts,
        pendingAlerts,
        criticalAlerts,
        highRiskAlerts,
        emergencyAlerts,
        byStatus: alertsByStatus,
        byRiskLevel: alertsByRisk,
      },
    });
  } catch (error) {
    res.status(500).json({ error: error.message || 'Failed to fetch crisis stats' });
  }
});

// Contact user from crisis alert
app.post('/api/admin/crisis-alerts/:alertId/contact-user', authMiddleware, async (req, res) => {
  try {
    console.log('📧 Contact user endpoint called');
    console.log('   Alert ID:', req.params.alertId);
    console.log('   Admin User ID:', req.userId);

    const adminUser = await User.findById(req.userId);
    if (!adminUser || !adminUser.isAdmin) {
      console.error('❌ Not authorized - user is not admin');
      return res.status(403).json({ error: 'Not authorized' });
    }

    const { alertId } = req.params;
    const { message } = req.body;

    if (!message || message.trim() === '') {
      console.error('❌ Message is empty');
      return res.status(400).json({ error: 'Message is required' });
    }

    // Get the crisis alert and try to use either a linked user or stored snapshot
    const alert = await CrisisAlert.findById(alertId).populate('userId', 'name email');
    if (!alert) {
      console.error('❌ Alert not found:', alertId);
      return res.status(404).json({ error: 'Alert not found' });
    }

    console.log('📧 Contact user endpoint - alert details:');
    console.log('   userId linked:', !!alert.userId, alert.userId?.email);
    console.log('   userSnapshot:', alert.userSnapshot);

    // Prefer populated userId email; fall back to stored snapshot
    const targetEmail = alert.userId?.email || (alert.userSnapshot && alert.userSnapshot.email) || null;
    const targetName = alert.userId?.name || (alert.userSnapshot && alert.userSnapshot.name) || 'User';

    if (!targetEmail) {
      console.error('❌ User email not found for alert:', alertId);
      console.error('   Linked user email:', alert.userId?.email);
      console.error('   Snapshot email:', alert.userSnapshot?.email);
      return res.status(400).json({ error: 'User email not found' });
    }

    console.log('✅ Sending contact email to:', targetEmail);
    console.log('   User name:', targetName);
    console.log('   Message length:', message.length);
    console.log('   Email service ready:', isEmailServiceReady());

    // Send email to user
    const emailResult = await sendAdminContactEmail(
      targetEmail,
      targetName,
      message
    );

    if (!emailResult) {
      console.warn('⚠️ Contact email failed to send to user:', targetEmail);
      // Do not mark interventionTaken so admin can retry later
      return res.status(500).json({
        error: 'Failed to send email. Check server logs for details or update Gmail credentials.',
        userEmail: targetEmail,
      });
    }

    // Update alert to mark that contact was sent
    alert.interventionTaken = 'message_sent';
    alert.interventionDetails = message;
    await alert.save();
    console.log('✅ Alert updated with contact intervention');

    res.status(200).json({
      message: 'Email sent successfully to user',
      userEmail: targetEmail,
    });

  } catch (error) {
    console.error('Contact user error:', error);
    res.status(500).json({ error: error.message || 'Failed to send email' });
  }
});

// Check if email service is configured and ready.
app.get('/api/admin/email-ready', authMiddleware, async (req, res) => {
  try {
    const adminUser = await User.findById(req.userId);
    if (!adminUser || !adminUser.isAdmin) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    const ready = isEmailServiceReady();
    res.status(200).json({ enabled: ready });
  } catch (err) {
    console.error('Failed to check email readiness:', err);
    res.status(500).json({ error: 'Unable to determine email configuration' });
  }
});

// Get admin dashboard stats
app.get('/api/admin/stats', authMiddleware, async (req, res) => {
  try {
    const adminUser = await User.findById(req.userId);
    if (!adminUser || !adminUser.isAdmin) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    const totalUsers = await User.countDocuments();
    const verifiedUsers = await User.countDocuments({ verified: true });
    const unverifiedUsers = await User.countDocuments({ verified: false });

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const newUsersToday = await User.countDocuments({ createdAt: { $gte: today } });

    res.status(200).json({
      message: 'Dashboard stats fetched',
      stats: {
        totalUsers,
        verifiedUsers,
        unverifiedUsers,
        newUsersToday,
        adminCount: await User.countDocuments({ isAdmin: true }),
      },
    });
  } catch (error) {
    res.status(500).json({ error: error.message || 'Failed to fetch stats' });
  }
});

// Error handling middleware
app.use(errorHandler);

// Test email endpoint
app.post('/api/test-email', async (req, res) => {
  try {
    console.log('📧 TEST EMAIL ENDPOINT CALLED');
    console.log('GMAIL_USER:', process.env.GMAIL_USER);
    console.log('GMAIL_APP_PASSWORD:', process.env.GMAIL_APP_PASSWORD ? '***SET***' : 'NOT SET');
    console.log('ADMIN_EMAIL:', process.env.ADMIN_EMAIL);

    await sendCrisisAlertEmail(
      process.env.ADMIN_EMAIL || 'aqudoos126@gmail.com',
      {
        name: 'Test User',
        email: 'testuser@example.com',
        _id: 'test123'
      },
      {
        _id: 'alert123',
        content: 'Test crisis message',
        contentType: 'chat',
        riskLevel: 'critical',
        riskScore: 0.95,
        detectedKeywords: ['test'],
        riskFactors: ['testing'],
        conversationId: 'conv123'
      }
    );

    res.status(200).json({ message: '✅ Test email sent successfully!' });
  } catch (error) {
    console.error('❌ Test email failed:', error);
    res.status(500).json({ error: error.message });
  }
});

// =====================
// ENCRYPTED CHAT ROUTES - SYNCED ACROSS DEVICES
// =====================

/**
 * 🔒 SAVE/SYNC ENCRYPTED CHAT
 * Client sends encrypted chat data
 * Backend stores without access to decrypted content
 */
app.post('/api/chats/sync', optionalAuthMiddleware, async (req, res) => {
  try {
    const { conversationId, encryptedData, iv, authTag, clientUpdatedAt, dataHash } = req.body;

    // Validation
    if (!conversationId || !encryptedData || !iv || !authTag || !dataHash) {
      return res.status(400).json({ error: 'Missing required encryption fields' });
    }

    // Use authenticated user ID or conversation ID for anonymous users
    const userId = req.isAuthenticated ? req.userId : conversationId;

    // Find or create encrypted chat record
    let chat = await EncryptedChat.findOne({
      userId: userId,
      conversationId: conversationId,
    });

    if (chat) {
      // Update existing chat
      chat.encryptedData = encryptedData;
      chat.iv = iv;
      chat.authTag = authTag;
      chat.dataHash = dataHash;
      chat.clientUpdatedAt = new Date(clientUpdatedAt);
      chat.isDeleted = false;
    } else {
      // Create new chat
      chat = new EncryptedChat({
        userId: userId,
        conversationId: conversationId,
        encryptedData,
        iv,
        authTag,
        dataHash,
        clientUpdatedAt: new Date(clientUpdatedAt),
        isDeleted: false,
      });
    }

    await chat.save();

    res.status(200).json({
      message: 'Chat synced successfully',
      chatId: chat._id,
      conversationId: conversationId,
      isAuthenticated: req.isAuthenticated,
    });
  } catch (error) {
    console.error('Chat sync error:', error);
    res.status(500).json({ error: error.message || 'Failed to sync chat' });
  }
});

/**
 * 🔒 GET ALL ENCRYPTED CHATS FOR USER
 * Returns encrypted data - client will decrypt
 */
app.get('/api/chats/all', optionalAuthMiddleware, async (req, res) => {
  try {
    // Use authenticated user ID or conversation ID for anonymous users
    const userId = req.isAuthenticated ? req.userId : req.headers['x-conversation-id'] || 'anonymous';
    
    const chats = await EncryptedChat.find({
      userId: userId,
      isDeleted: false,
    }).select('conversationId encryptedData iv authTag dataHash clientUpdatedAt createdAt');

    res.status(200).json({
      message: 'Chats retrieved successfully',
      count: chats.length,
      chats: chats,
      isAuthenticated: req.isAuthenticated,
    });
  } catch (error) {
    console.error('Get chats error:', error);
    res.status(500).json({ error: error.message || 'Failed to retrieve chats' });
  }
});

/**
 * 🔒 GET SPECIFIC ENCRYPTED CHAT
 */
app.get('/api/chats/:conversationId', authMiddleware, async (req, res) => {
  try {
    const chat = await EncryptedChat.findOne({
      userId: req.userId,
      conversationId: req.params.conversationId,
      isDeleted: false,
    });

    if (!chat) {
      return res.status(404).json({ error: 'Chat not found' });
    }

    res.status(200).json({
      message: 'Chat retrieved successfully',
      chat: {
        conversationId: chat.conversationId,
        encryptedData: chat.encryptedData,
        iv: chat.iv,
        authTag: chat.authTag,
        dataHash: chat.dataHash,
        clientUpdatedAt: chat.clientUpdatedAt,
        createdAt: chat.createdAt,
      },
    });
  } catch (error) {
    console.error('Get chat error:', error);
    res.status(500).json({ error: error.message || 'Failed to retrieve chat' });
  }
});

/**
 * 🔒 DELETE ENCRYPTED CHAT (Soft delete)
 */
app.delete('/api/chats/:conversationId', authMiddleware, async (req, res) => {
  try {
    const chat = await EncryptedChat.findOne({
      userId: req.userId,
      conversationId: req.params.conversationId,
    });

    if (!chat) {
      return res.status(404).json({ error: 'Chat not found' });
    }

    // Soft delete
    chat.isDeleted = true;
    await chat.save();

    res.status(200).json({
      message: 'Chat deleted successfully',
      conversationId: req.params.conversationId,
    });
  } catch (error) {
    console.error('Delete chat error:', error);
    res.status(500).json({ error: error.message || 'Failed to delete chat' });
  }
});

// =====================
// ENCRYPTED JOURNAL ROUTES - SYNCED ACROSS DEVICES
// =====================

/**
 * 🔒 SAVE/SYNC ENCRYPTED JOURNAL ENTRY
 * Client sends encrypted journal data
 * Backend stores without access to decrypted content
 */
app.post('/api/journals/sync', authMiddleware, async (req, res) => {
  try {
    const { entryId, encryptedData, iv, authTag, clientUpdatedAt, dataHash } = req.body;

    // Validation
    if (!entryId || !encryptedData || !iv || !authTag || !dataHash) {
      return res.status(400).json({ error: 'Missing required encryption fields' });
    }

    // Find or create encrypted journal record
    let journal = await EncryptedJournal.findOne({
      userId: req.userId,
      entryId: entryId,
    });

    if (journal) {
      // Update existing journal
      journal.encryptedData = encryptedData;
      journal.iv = iv;
      journal.authTag = authTag;
      journal.dataHash = dataHash;
      journal.clientUpdatedAt = new Date(clientUpdatedAt);
      journal.isDeleted = false;
    } else {
      // Create new journal
      journal = new EncryptedJournal({
        userId: req.userId,
        entryId: entryId,
        encryptedData,
        iv,
        authTag,
        dataHash,
        clientUpdatedAt: new Date(clientUpdatedAt),
        isDeleted: false,
      });
    }

    await journal.save();

    res.status(200).json({
      message: 'Journal synced successfully',
      journalId: journal._id,
      entryId: entryId,
    });
  } catch (error) {
    console.error('Journal sync error:', error);
    res.status(500).json({ error: error.message || 'Failed to sync journal' });
  }
});

/**
 * 🔒 GET ALL ENCRYPTED JOURNAL ENTRIES FOR USER
 * Returns encrypted data - client will decrypt
 */
app.get('/api/journals/all', authMiddleware, async (req, res) => {
  try {
    const journals = await EncryptedJournal.find({
      userId: req.userId,
      isDeleted: false,
    }).select('entryId encryptedData iv authTag dataHash clientUpdatedAt createdAt');

    res.status(200).json({
      message: 'Journals retrieved successfully',
      count: journals.length,
      journals: journals,
    });
  } catch (error) {
    console.error('Get journals error:', error);
    res.status(500).json({ error: error.message || 'Failed to retrieve journals' });
  }
});

/**
 * 🔒 GET SPECIFIC ENCRYPTED JOURNAL ENTRY
 */
app.get('/api/journals/:entryId', authMiddleware, async (req, res) => {
  try {
    const journal = await EncryptedJournal.findOne({
      userId: req.userId,
      entryId: req.params.entryId,
      isDeleted: false,
    });

    if (!journal) {
      return res.status(404).json({ error: 'Journal entry not found' });
    }

    res.status(200).json({
      message: 'Journal retrieved successfully',
      journal: {
        entryId: journal.entryId,
        encryptedData: journal.encryptedData,
        iv: journal.iv,
        authTag: journal.authTag,
        dataHash: journal.dataHash,
        clientUpdatedAt: journal.clientUpdatedAt,
        createdAt: journal.createdAt,
      },
    });
  } catch (error) {
    console.error('Get journal error:', error);
    res.status(500).json({ error: error.message || 'Failed to retrieve journal' });
  }
});

/**
 * 🔒 DELETE ENCRYPTED JOURNAL ENTRY (Soft delete)
 */
app.delete('/api/journals/:entryId', authMiddleware, async (req, res) => {
  try {
    const journal = await EncryptedJournal.findOne({
      userId: req.userId,
      entryId: req.params.entryId,
    });

    if (!journal) {
      return res.status(404).json({ error: 'Journal entry not found' });
    }

    // Soft delete
    journal.isDeleted = true;
    await journal.save();

    res.status(200).json({
      message: 'Journal entry deleted successfully',
      entryId: req.params.entryId,
    });
  } catch (error) {
    console.error('Delete journal error:', error);
    res.status(500).json({ error: error.message || 'Failed to delete journal' });
  }
});

const PORT = process.env.PORT || 3002;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});