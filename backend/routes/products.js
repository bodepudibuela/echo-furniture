const express = require('express');
const router = express.Router();
const { getProducts, getFeaturedProducts, getProductById, createProduct, updateProduct, deleteProduct, addReview } = require('../controllers/productController');
const { authenticate, requireAdmin } = require('../middleware/auth');

router.get('/', getProducts);
router.get('/featured', getFeaturedProducts);
router.get('/:id', getProductById);
router.post('/', authenticate, requireAdmin, createProduct);
router.put('/:id', authenticate, requireAdmin, updateProduct);
router.delete('/:id', authenticate, requireAdmin, deleteProduct);
router.post('/:id/reviews', authenticate, addReview);

module.exports = router;
