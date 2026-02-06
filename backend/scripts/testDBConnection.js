#!/usr/bin/env node

/**
 * Database Connection Test Script
 * Tests MongoDB connection and provides diagnostic information
 * Usage: node backend/scripts/testDBConnection.js
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const testConnection = async () => {
  console.log('\n🔍 MongoDB Connection Test');
  console.log('==========================\n');

  // Check environment variables
  console.log('📋 Configuration Check:');
  console.log('  MONGODB_URI:', process.env.MONGODB_URI || 'NOT SET');
  console.log('  NODE_ENV:', process.env.NODE_ENV || 'development');

  // Test local MongoDB connection
  if (!process.env.MONGODB_URI || process.env.MONGODB_URI.includes('localhost')) {
    console.log('\n⚠️  Using Local MongoDB Detection');
    console.log('  Make sure MongoDB is running locally:');
    console.log('  Windows: net start MongoDB');
    console.log('  Mac: brew services start mongodb-community');
    console.log('  Linux: sudo systemctl start mongod');
  }

  try {
    console.log('\n🔗 Attempting connection...');
    const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/mindful-journal';
    
    await mongoose.connect(uri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000,
    });

    console.log('✅ MongoDB Connection Successful!\n');

    // Get database stats
    const db = mongoose.connection.db;
    const admin = db.admin();
    const stats = await admin.serverStatus();

    console.log('📊 Database Statistics:');
    console.log('  MongoDB Version:', stats.version);
    console.log('  Database:', db.getName() || 'mindful-journal');
    
    // List collections
    const collections = await db.listCollections().toArray();
    console.log('  Collections:', collections.length > 0 ? collections.map(c => c.name).join(', ') : 'None');

    // Test write operation
    const testCol = db.collection('test_connection');
    const result = await testCol.insertOne({ test: true, timestamp: new Date() });
    console.log('  ✅ Write Test: Successful (Test doc inserted)');
    
    // Clean up test
    await testCol.deleteOne({ _id: result.insertedId });

    console.log('\n🎉 All tests passed! Your database is working correctly.\n');
    console.log('Next steps:');
    console.log('1. npm start (in the project root - starts both frontend and backend)');
    console.log('2. Navigate to http://localhost:5173');
    console.log('3. Register a new account to test the registration flow\n');

    process.exit(0);
  } catch (error) {
    console.error('\n❌ Connection Failed!\n');
    console.error('Error:', error.message);

    if (error.message.includes('connect ECONNREFUSED')) {
      console.error('\n💡 Troubleshooting Steps:');
      console.error('1. MongoDB is not running. Start it:');
      console.error('   Windows (Admin CMD): net start MongoDB');
      console.error('   Mac: brew services start mongodb-community');
      console.error('   Linux: sudo systemctl start mongod');
      console.error('');
      console.error('2. Or use MongoDB Atlas (Cloud):');
      console.error('   - Create account at https://www.mongodb.com/cloud/atlas');
      console.error('   - Create a database cluster');
      console.error('   - Get connection string');
      console.error('   - Update MONGODB_URI in backend/.env');
      console.error('   - Typically looks like:');
      console.error('     mongodb+srv://username:password@cluster.mongodb.net/dbname');
    } else if (error.message.includes('Invalid credentials')) {
      console.error('\n💡 Authentication failed. Check your MongoDB Atlas credentials:');
      console.error('   - Verify username and password in connection string');
      console.error('   - Make sure your IP address is whitelisted in Atlas');
    }

    process.exit(1);
  }
};

testConnection();
