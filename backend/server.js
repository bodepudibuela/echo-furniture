// ============================================================
// Echo-Furniture Backend Server
// ============================================================
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const path = require('path');

const { testConnection } = require('./config/database');
const { authRouter } = require('./routes/auth');
const productsRouter = require('./routes/products');
const { cartRouter, orderRouter, addressRouter, wishlistRouter, categoryRouter, adminRouter } = require('./routes/index');
const { notFound, errorHandler } = require('./middleware/errorHandler');

const app = express();
const PORT = process.env.PORT || 5000;

// ============================================================
// Security Middleware
// ============================================================
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' }
}));

app.use(cors({
  origin: process.env.FRONTEND_URL || '*',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: (process.env.RATE_LIMIT_WINDOW || 15) * 60 * 1000,
  max: process.env.RATE_LIMIT_MAX || 100,
  message: { success: false, message: 'Too many requests. Please try again later.' }
});
app.use('/api/', limiter);

// Auth rate limiting (stricter)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { success: false, message: 'Too many login attempts. Please try again after 15 minutes.' }
});

// ============================================================
// General Middleware
// ============================================================
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(morgan('dev'));

// Serve static files
app.use('/uploads', express.static(path.join(__dirname, 'public/uploads')));

// ============================================================
// API Routes
// ============================================================
app.use('/api/auth', authLimiter, authRouter);
app.use('/api/products', productsRouter);
app.use('/api/cart', cartRouter);
app.use('/api/orders', orderRouter);
app.use('/api/addresses', addressRouter);
app.use('/api/wishlist', wishlistRouter);
app.use('/api/categories', categoryRouter);
app.use('/api/admin', adminRouter);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'Echo Furniture API is running!', version: '1.0.0', timestamp: new Date().toISOString() });
});

// ============================================================
// Error Handling
// ============================================================
app.use(notFound);
app.use(errorHandler);

// ============================================================
// Start Server
// ============================================================
const startServer = async () => {
  await testConnection();
  app.listen(PORT, () => {
    console.log(`\n🪑 Echo Furniture API Server`);
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    console.log(`✅ Server running on http://localhost:${PORT}`);
    console.log(`📦 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);
  });
};

startServer().catch(console.error);

module.exports = app;
