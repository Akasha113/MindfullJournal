#!/usr/bin/env node

/**
 * Admin Setup Script
 * Run this to create your admin account
 * Usage: node backend/scripts/setupAdmin.js
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User.js';
import { hashPassword } from '../utils/crypto.js';

dotenv.config();

const connectDB = async () => {
  try {
    const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/zenify';
    await mongoose.connect(uri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('MongoDB connected');
  } catch (error) {
    console.error('MongoDB connection failed:', error.message);
    process.exit(1);
  }
};

const setupAdmin = async () => {
  try {
    await connectDB();

    const adminEmail = 'aqudoos126@gmail.com';
    const adminPassword = 'Akasha@114'; // Change this!

    // Delete existing admin to recreate fresh
    console.log('Checking for existing admin account...');
    const existingAdmin = await User.findOne({ email: adminEmail });
    if (existingAdmin) {
      console.log('Found existing admin, deleting to recreate...');
      await User.deleteOne({ email: adminEmail });
      console.log('Deleted old admin account');
    }

    // Create admin account
    const hashedPassword = await hashPassword(adminPassword);
    const admin = new User({
      name: 'Administrator',
      email: adminEmail,
      password: hashedPassword,
      verified: true,
      verifiedAt: new Date(),
      isAdmin: true,
    });

    await admin.save();

    console.log('\n✅ Admin account created successfully!\n');
    console.log('Admin Credentials:');
    console.log(`Email: ${adminEmail}`);
    console.log(`Password: ${adminPassword}`);
    console.log('\n⚠️  IMPORTANT: Change this password after first login!');
    console.log('Access admin portal at: http://localhost:5173/admin\n');

    process.exit(0);
  } catch (error) {
    console.error('Error creating admin:', error.message);
    process.exit(1);
  }
};

setupAdmin();
