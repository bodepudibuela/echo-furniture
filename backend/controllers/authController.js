// ============================================================
// Auth Controller
// ============================================================
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { query } = require('../config/database');
const { asyncHandler } = require('../middleware/errorHandler');

// Generate JWT token
const generateToken = (userId, role) => {
  return jwt.sign({ id: userId, role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d'
  });
};

// @POST /api/auth/register
const register = asyncHandler(async (req, res) => {
  const { first_name, last_name, email, password, phone } = req.body;

  // Validate required fields
  if (!first_name || !last_name || !email || !password) {
    return res.status(400).json({ success: false, message: 'Please provide all required fields.' });
  }
  if (password.length < 6) {
    return res.status(400).json({ success: false, message: 'Password must be at least 6 characters.' });
  }

  // Check if email exists
  const existing = await query('SELECT id FROM users WHERE email = ?', [email.toLowerCase()]);
  if (existing.length) {
    return res.status(409).json({ success: false, message: 'Email already registered. Please login.' });
  }

  // Hash password
  const hashedPassword = await bcrypt.hash(password, 12);

  // Insert user
  const result = await query(
    'INSERT INTO users (first_name, last_name, email, password, phone) VALUES (?, ?, ?, ?, ?)',
    [first_name.trim(), last_name.trim(), email.toLowerCase(), hashedPassword, phone || null]
  );

  const userId = result.insertId;
  const token = generateToken(userId, 'user');

  res.status(201).json({
    success: true,
    message: 'Account created successfully! Welcome to Echo Furniture.',
    token,
    user: { id: userId, first_name, last_name, email: email.toLowerCase(), role: 'user' }
  });
});

// @POST /api/auth/login
const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ success: false, message: 'Email and password are required.' });
  }

  // Find user
  const users = await query('SELECT * FROM users WHERE email = ? AND is_active = 1', [email.toLowerCase()]);
  if (!users.length) {
    return res.status(401).json({ success: false, message: 'Invalid email or password.' });
  }

  const user = users[0];

  // Verify password
  const isValid = await bcrypt.compare(password, user.password);
  if (!isValid) {
    return res.status(401).json({ success: false, message: 'Invalid email or password.' });
  }

  const token = generateToken(user.id, user.role);

  res.json({
    success: true,
    message: `Welcome back, ${user.first_name}!`,
    token,
    user: {
      id: user.id,
      first_name: user.first_name,
      last_name: user.last_name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      profile_image: user.profile_image
    }
  });
});

// @GET /api/auth/me
const getMe = asyncHandler(async (req, res) => {
  const users = await query(
    'SELECT id, first_name, last_name, email, phone, role, profile_image, created_at FROM users WHERE id = ?',
    [req.user.id]
  );
  if (!users.length) {
    return res.status(404).json({ success: false, message: 'User not found.' });
  }
  res.json({ success: true, user: users[0] });
});

// @PUT /api/auth/update-profile
const updateProfile = asyncHandler(async (req, res) => {
  const { first_name, last_name, phone } = req.body;
  await query(
    'UPDATE users SET first_name = ?, last_name = ?, phone = ?, updated_at = NOW() WHERE id = ?',
    [first_name, last_name, phone, req.user.id]
  );
  res.json({ success: true, message: 'Profile updated successfully.' });
});

// @PUT /api/auth/change-password
const changePassword = asyncHandler(async (req, res) => {
  const { current_password, new_password } = req.body;
  if (!current_password || !new_password) {
    return res.status(400).json({ success: false, message: 'Both current and new password are required.' });
  }
  if (new_password.length < 6) {
    return res.status(400).json({ success: false, message: 'New password must be at least 6 characters.' });
  }

  const users = await query('SELECT password FROM users WHERE id = ?', [req.user.id]);
  const isValid = await bcrypt.compare(current_password, users[0].password);
  if (!isValid) {
    return res.status(401).json({ success: false, message: 'Current password is incorrect.' });
  }

  const hashed = await bcrypt.hash(new_password, 12);
  await query('UPDATE users SET password = ?, updated_at = NOW() WHERE id = ?', [hashed, req.user.id]);
  res.json({ success: true, message: 'Password changed successfully.' });
});

module.exports = { register, login, getMe, updateProfile, changePassword };
