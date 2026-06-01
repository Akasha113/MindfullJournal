import jwt from 'jsonwebtoken';

export const authMiddleware = (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
      return res.status(401).json({ error: 'No authorization token provided' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret-key');
    req.userId = decoded.id;
    req.userEmail = decoded.email;

    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid or expired token' });
  }
};

// Optional auth - allows requests without token but validates if token present
export const optionalAuthMiddleware = (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];

    if (token) {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret-key');
        req.userId = decoded.id;
        req.userEmail = decoded.email;
        req.isAuthenticated = true;
      } catch (err) {
        // Invalid token - treat as anonymous
        console.warn('⚠️ Invalid/expired token - treating as anonymous:', err.message);
        req.isAuthenticated = false;
        // Use conversation ID from header or generate one
        req.userId = req.headers['x-conversation-id'] || 'anonymous-' + Date.now();
      }
    } else {
      req.isAuthenticated = false;
      // Use conversation ID from header or generate one
      req.userId = req.headers['x-conversation-id'] || 'anonymous-' + Date.now();
    }
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(500).json({ error: 'Authentication processing failed' });
  }
};

export const errorHandler = (err, req, res, next) => {
  console.error('Error:', err);

  if (err.name === 'ValidationError') {
    return res.status(400).json({
      error: 'Validation error',
      details: Object.values(err.errors).map((e) => e.message),
    });
  }

  if (err.name === 'MongoError' || err.code === 11000) {
    return res.status(409).json({ error: 'Duplicate entry' });
  }

  res.status(500).json({
    error: err.message || 'Internal server error',
  });
};
