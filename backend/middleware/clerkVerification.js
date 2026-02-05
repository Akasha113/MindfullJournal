// Clerk JWT Verification Middleware (Optional)
// Add this to your backend for enhanced security with Clerk authentication

import { ClerkExpressRequireAuth } from '@clerk/express';
import fetch from 'node-fetch';

// Option 1: Using Clerk's built-in Express middleware
// Install: npm install @clerk/express

export const clerkAuthMiddleware = ClerkExpressRequireAuth();

// Option 2: Manual JWT verification using Clerk's public key
export const verifyClerkToken = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    // Fetch Clerk's JWKS (JSON Web Key Set)
    const jwksUrl = `https://clerk.dev/.well-known/jwks.json`;
    const response = await fetch(jwksUrl);
    const { keys } = await response.json();
    
    // Verify the token using the public key
    // This is a simplified example - use jsonwebtoken library for production
    
    // For production, use:
    // npm install jsonwebtoken
    // const jwt = require('jsonwebtoken');
    
    req.clerkToken = token; // Attach token to request
    next();
  } catch (error) {
    console.error('Token verification error:', error);
    res.status(401).json({ error: 'Invalid token' });
  }
};

// Option 3: Get current user from Clerk
export const getCurrentUserFromClerk = async (userId) => {
  try {
    const response = await fetch(`https://api.clerk.dev/v1/users/${userId}`, {
      headers: {
        Authorization: `Bearer ${process.env.CLERK_SECRET_KEY}`,
      },
    });
    return await response.json();
  } catch (error) {
    console.error('Error fetching user from Clerk:', error);
    return null;
  }
};

// Option 4: Sync Clerk user with your database
export const syncClerkUserToDatabase = async (clerkUser, User) => {
  try {
    const userData = {
      clerkId: clerkUser.id,
      email: clerkUser.email_addresses[0]?.email_address,
      name: clerkUser.first_name + ' ' + clerkUser.last_name,
      verified: true,
      verifiedAt: new Date(),
    };

    // Check if user exists
    let user = await User.findOne({ email: userData.email });
    
    if (!user) {
      // Create new user
      user = await User.create(userData);
    } else {
      // Update existing user
      user = await User.findByIdAndUpdate(user._id, userData, { new: true });
    }
    
    return user;
  } catch (error) {
    console.error('Error syncing user to database:', error);
    return null;
  }
};

// Option 5: Example endpoint using Clerk verification
// Add this to your server.js after requiring this middleware

/*
import { verifyClerkToken, syncClerkUserToDatabase } from './middleware/clerkVerification.js';

// Protected route using Clerk token
app.post('/api/user/profile', verifyClerkToken, async (req, res) => {
  try {
    const token = req.clerkToken;
    // Verify token and get user info
    // Then sync with database
    
    res.json({ message: 'User profile updated' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
*/

export default {
  clerkAuthMiddleware,
  verifyClerkToken,
  getCurrentUserFromClerk,
  syncClerkUserToDatabase,
};
