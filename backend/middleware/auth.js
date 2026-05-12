// ============================================================
// Authentication Middleware
// ============================================================
const jwt = require('jsonwebtoken');
const { query } = require('../config/database');

// Verify JWT token
const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, message: 'Access denied. No token provided.' });
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Check if user still exists and is active
    const users = await query('SELECT id, email, role, is_active FROM users WHERE id = ?', [decoded.id]);
    if (!users.length || !users[0].is_active) {
      return res.status(401).json({ success: false, message: 'User account is inactive or deleted.' });
    }

    req.user = users[0];
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ success: false, message: 'Token has expired. Please login again.' });
    }
    return res.status(401).json({ success: false, message: 'Invalid token.' });
  }
};

// Require admin role
const requireAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ success: false, message: 'Access denied. Admin privileges required.' });
  }
  next();
};

// Optional auth (doesn't fail if no token)
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const users = await query('SELECT id, email, role, is_active FROM users WHERE id = ?', [decoded.id]);
      if (users.length && users[0].is_active) {
        req.user = users[0];
      }
    }
  } catch (error) {
    // Silently ignore auth errors for optional routes
  }
  next();
};

module.exports = { authenticate, requireAdmin, optionalAuth };
