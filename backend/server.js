import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import User from './models/User.js';
import VerificationCode from './models/VerificationCode.js';
import CrisisAlert from './models/CrisisAlert.js';
import { hashPassword, verifyPassword, generateToken, generateVerificationCode } from './utils/crypto.js';
import { initializeEmailService, sendVerificationEmail, sendPasswordResetEmail, sendCrisisAlertEmail, sendAdminContactEmail } from './utils/email.js';
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

// Forgot Password - Send reset link
app.post('/api/auth/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    // Check if user exists
    const user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
      // Don't reveal if user exists (security best practice)
      return res.status(200).json({ 
        message: 'If an account exists with this email, a reset link has been sent.' 
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
    try {
      await sendPasswordResetEmail(
        email,
        `${process.env.FRONTEND_URL || 'http://localhost:5173'}/reset-password?token=${resetToken}&code=${resetCode}`
      );
      console.log('✅ Password reset email sent to:', email);
    } catch (emailError) {
      console.error('Failed to send reset email:', emailError);
      // Still return success to user (don't leak email errors)
    }

    res.status(200).json({ 
      message: 'If an account exists with this email, a reset link has been sent.' 
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

// =====================
// ADMIN ROUTES
// =====================

// Admin login
app.post('/api/admin/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }

    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');

    if (!user || !user.isAdmin) {
      return res.status(401).json({ error: 'Invalid admin credentials' });
    }

    const isPasswordValid = await verifyPassword(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Invalid admin credentials' });
    }

    const token = generateToken(user._id);
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

    console.log('📝 Creating crisis alert for user:', userId);
    console.log('📝 Alert content:', content);
    console.log('📝 Risk level:', riskLevel);

    // Validate required fields
    if (!userId || !content) {
      console.error('❌ Missing required fields - userId or content');
      return res.status(400).json({ error: 'User ID and content are required' });
    }

    // Create crisis alert
    const alert = new CrisisAlert({
      userId,
      content,
      contentType,
      riskLevel,
      riskScore,
      detectedKeywords: detectedKeywords || [],
      riskFactors: riskFactors || [],
      conversationId,
      journalId,
      urgencyLevel: riskLevel === 'critical' ? 'emergency' : riskLevel === 'high' ? 'urgent' : 'routine',
    });

    await alert.save();
    console.log('✅ Crisis alert saved to database:', alert._id);

    // Fetch user details for email
    const userDetails = await User.findById(userId);
    console.log('👤 User details fetched:', userDetails?.name, userDetails?.email);

    // Send email notification to admin
    try {
      if (userDetails) {
        const adminEmail = process.env.ADMIN_EMAIL || 'akashaqbl@gmail.com';
        console.log('📧 Sending crisis alert email to:', adminEmail);
        console.log('   From:', process.env.GMAIL_USER);
        
        await sendCrisisAlertEmail(
          adminEmail,
          userDetails,
          alert
        );
        console.log('✅ Crisis alert email sent successfully!');
      } else {
        console.error('❌ User details not found for ID:', userId);
      }
    } catch (emailError) {
      console.error('❌ Failed to send crisis alert email:', emailError.message);
      console.error('Email error details:', emailError);
      console.error('Email error stack:', emailError.stack);
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

    // Get the crisis alert
    const alert = await CrisisAlert.findById(alertId).populate('userId');
    if (!alert) {
      console.error('❌ Alert not found:', alertId);
      return res.status(404).json({ error: 'Alert not found' });
    }

    if (!alert.userId || !alert.userId.email) {
      console.error('❌ User email not found for alert:', alertId);
      return res.status(400).json({ error: 'User email not found' });
    }

    console.log('✅ Sending contact email to:', alert.userId.email);
    console.log('   User name:', alert.userId.name);
    console.log('   Message length:', message.length);

    // Send email to user
    await sendAdminContactEmail(
      alert.userId.email,
      alert.userId.name || 'User',
      message
    );

    // Update alert to mark that contact was sent
    alert.interventionTaken = 'message_sent';
    alert.interventionDetails = message;
    await alert.save();
    console.log('✅ Alert updated with contact intervention');

    res.status(200).json({
      message: 'Email sent successfully to user',
      userEmail: alert.userId.email,
    });
  } catch (error) {
    console.error('Contact user error:', error);
    res.status(500).json({ error: error.message || 'Failed to send email' });
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

// 404 handler
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

app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});
