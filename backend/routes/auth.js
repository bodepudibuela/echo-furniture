// ============================================================
// Auth Routes
// ============================================================
const express = require('express');
const authRouter = express.Router();
const { register, login, getMe, updateProfile, changePassword } = require('../controllers/authController');
const { authenticate } = require('../middleware/auth');

authRouter.post('/register', register);
authRouter.post('/login', login);
authRouter.get('/me', authenticate, getMe);
authRouter.put('/update-profile', authenticate, updateProfile);
authRouter.put('/change-password', authenticate, changePassword);

module.exports.authRouter = authRouter;
