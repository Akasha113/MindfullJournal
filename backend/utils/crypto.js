import crypto from 'crypto';
import jwt from 'jsonwebtoken';

const SALT_ROUNDS = 10;

// Simple password hashing (use bcrypt in production)
export const hashPassword = async (password) => {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto
    .pbkdf2Sync(password, salt, 1000, 64, 'sha512')
    .toString('hex');
  return `${salt}:${hash}`;
};

// Verify password
export const verifyPassword = async (password, hashed) => {
  const [salt, hash] = hashed.split(':');
  const newHash = crypto
    .pbkdf2Sync(password, salt, 1000, 64, 'sha512')
    .toString('hex');
  return hash === newHash;
};

// Generate JWT token
export const generateToken = (id, email) => {
  return jwt.sign(
    { id, email },
    process.env.JWT_SECRET || 'secret-key',
    { expiresIn: process.env.JWT_EXPIRE || '7d' }
  );
};

// Generate verification code
export const generateVerificationCode = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};
