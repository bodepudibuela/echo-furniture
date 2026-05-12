const express = require('express');

// Cart Routes
const cartRouter = express.Router();
const { getCart, addToCart, updateCartItem, removeFromCart, clearCart } = require('../controllers/cartController');
const { authenticate } = require('../middleware/auth');

cartRouter.get('/', authenticate, getCart);
cartRouter.post('/add', authenticate, addToCart);
cartRouter.put('/update/:itemId', authenticate, updateCartItem);
cartRouter.delete('/remove/:itemId', authenticate, removeFromCart);
cartRouter.delete('/clear', authenticate, clearCart);

// Order Routes
const orderRouter = express.Router();
const { placeOrder, getUserOrders, getOrderById, cancelOrder, getAllOrders, updateOrderStatus } = require('../controllers/orderController');
const { requireAdmin } = require('../middleware/auth');

orderRouter.post('/place', authenticate, placeOrder);
orderRouter.get('/', authenticate, getUserOrders);
orderRouter.get('/:id', authenticate, getOrderById);
orderRouter.put('/:id/cancel', authenticate, cancelOrder);
orderRouter.get('/admin/all', authenticate, requireAdmin, getAllOrders);
orderRouter.put('/admin/:id/status', authenticate, requireAdmin, updateOrderStatus);

// Address Routes
const addressRouter = express.Router();
const { getAddresses, addAddress, updateAddress, deleteAddress } = require('../controllers/otherControllers');

addressRouter.get('/', authenticate, getAddresses);
addressRouter.post('/', authenticate, addAddress);
addressRouter.put('/:id', authenticate, updateAddress);
addressRouter.delete('/:id', authenticate, deleteAddress);

// Wishlist Routes
const wishlistRouter = express.Router();
const { getWishlist, toggleWishlist } = require('../controllers/otherControllers');

wishlistRouter.get('/', authenticate, getWishlist);
wishlistRouter.post('/toggle', authenticate, toggleWishlist);

// Category Routes
const categoryRouter = express.Router();
const { getCategories } = require('../controllers/otherControllers');
categoryRouter.get('/', getCategories);

// Admin Routes
const adminRouter = express.Router();
const { getDashboardStats, getAdminUsers, updateUserStatus } = require('../controllers/otherControllers');

adminRouter.get('/dashboard', authenticate, requireAdmin, getDashboardStats);
adminRouter.get('/users', authenticate, requireAdmin, getAdminUsers);
adminRouter.put('/users/:id/status', authenticate, requireAdmin, updateUserStatus);

module.exports = { cartRouter, orderRouter, addressRouter, wishlistRouter, categoryRouter, adminRouter };
