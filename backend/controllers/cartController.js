// ============================================================
// Cart Controller
// ============================================================
const { query, transaction } = require('../config/database');
const { asyncHandler } = require('../middleware/errorHandler');

// Get or create cart for user
const getOrCreateCart = async (userId) => {
  let carts = await query('SELECT id FROM cart WHERE user_id = ?', [userId]);
  if (!carts.length) {
    const result = await query('INSERT INTO cart (user_id) VALUES (?)', [userId]);
    return result.insertId;
  }
  return carts[0].id;
};

// @GET /api/cart
const getCart = asyncHandler(async (req, res) => {
  const cartId = await getOrCreateCart(req.user.id);

  const items = await query(
    `SELECT ci.id, ci.quantity, ci.price, ci.product_id,
     p.name, p.images, p.stock_quantity, p.is_active, p.price as current_price
     FROM cart_items ci
     JOIN products p ON ci.product_id = p.id
     WHERE ci.cart_id = ?`,
    [cartId]
  );

  const parsedItems = items.map(item => ({
    ...item,
    images: typeof item.images === 'string' ? JSON.parse(item.images || '[]') : (item.images || [])
  }));

  const subtotal = parsedItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const itemCount = parsedItems.reduce((sum, item) => sum + item.quantity, 0);

  res.json({
    success: true,
    cart: { id: cartId, items: parsedItems, subtotal, itemCount }
  });
});

// @POST /api/cart/add
const addToCart = asyncHandler(async (req, res) => {
  const { product_id, quantity = 1 } = req.body;
  if (!product_id) return res.status(400).json({ success: false, message: 'Product ID is required.' });

  const products = await query('SELECT id, price, stock_quantity, is_active FROM products WHERE id = ? AND is_active = 1', [product_id]);
  if (!products.length) return res.status(404).json({ success: false, message: 'Product not found.' });

  const product = products[0];
  if (product.stock_quantity < quantity) {
    return res.status(400).json({ success: false, message: 'Insufficient stock.' });
  }

  const cartId = await getOrCreateCart(req.user.id);

  // Check if item exists in cart
  const existing = await query('SELECT id, quantity FROM cart_items WHERE cart_id = ? AND product_id = ?', [cartId, product_id]);

  if (existing.length) {
    const newQty = existing[0].quantity + parseInt(quantity);
    if (newQty > product.stock_quantity) {
      return res.status(400).json({ success: false, message: 'Cannot add more than available stock.' });
    }
    await query('UPDATE cart_items SET quantity = ?, updated_at = NOW() WHERE id = ?', [newQty, existing[0].id]);
  } else {
    await query(
      'INSERT INTO cart_items (cart_id, product_id, quantity, price) VALUES (?, ?, ?, ?)',
      [cartId, product_id, quantity, product.price]
    );
  }

  res.json({ success: true, message: 'Item added to cart.' });
});

// @PUT /api/cart/update/:itemId
const updateCartItem = asyncHandler(async (req, res) => {
  const { itemId } = req.params;
  const { quantity } = req.body;
  if (!quantity || quantity < 1) {
    return res.status(400).json({ success: false, message: 'Quantity must be at least 1.' });
  }

  const cartId = await getOrCreateCart(req.user.id);
  const items = await query('SELECT ci.id, p.stock_quantity FROM cart_items ci JOIN products p ON ci.product_id = p.id WHERE ci.id = ? AND ci.cart_id = ?', [itemId, cartId]);

  if (!items.length) return res.status(404).json({ success: false, message: 'Cart item not found.' });
  if (quantity > items[0].stock_quantity) {
    return res.status(400).json({ success: false, message: 'Insufficient stock.' });
  }

  await query('UPDATE cart_items SET quantity = ?, updated_at = NOW() WHERE id = ?', [quantity, itemId]);
  res.json({ success: true, message: 'Cart updated.' });
});

// @DELETE /api/cart/remove/:itemId
const removeFromCart = asyncHandler(async (req, res) => {
  const { itemId } = req.params;
  const cartId = await getOrCreateCart(req.user.id);
  await query('DELETE FROM cart_items WHERE id = ? AND cart_id = ?', [itemId, cartId]);
  res.json({ success: true, message: 'Item removed from cart.' });
});

// @DELETE /api/cart/clear
const clearCart = asyncHandler(async (req, res) => {
  const cartId = await getOrCreateCart(req.user.id);
  await query('DELETE FROM cart_items WHERE cart_id = ?', [cartId]);
  res.json({ success: true, message: 'Cart cleared.' });
});

module.exports = { getCart, addToCart, updateCartItem, removeFromCart, clearCart };
