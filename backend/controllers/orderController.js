// ============================================================
// Order Controller
// ============================================================
const { query, transaction } = require('../config/database');
const { asyncHandler } = require('../middleware/errorHandler');
const { v4: uuidv4 } = require('uuid');

// Generate order number
const generateOrderNumber = () => `EF-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

// @POST /api/orders/place
const placeOrder = asyncHandler(async (req, res) => {
  const { address_id, payment_method, coupon_code, notes } = req.body;
  const userId = req.user.id;

  if (!address_id || !payment_method) {
    return res.status(400).json({ success: false, message: 'Address and payment method are required.' });
  }

  // Get address
  const addresses = await query('SELECT * FROM addresses WHERE id = ? AND user_id = ?', [address_id, userId]);
  if (!addresses.length) return res.status(404).json({ success: false, message: 'Address not found.' });
  const address = addresses[0];

  // Get cart items
  const carts = await query('SELECT id FROM cart WHERE user_id = ?', [userId]);
  if (!carts.length) return res.status(400).json({ success: false, message: 'Cart is empty.' });

  const cartId = carts[0].id;
  const items = await query(
    `SELECT ci.*, p.name, p.price as current_price, p.stock_quantity, p.images, p.is_active
     FROM cart_items ci JOIN products p ON ci.product_id = p.id WHERE ci.cart_id = ?`,
    [cartId]
  );

  if (!items.length) return res.status(400).json({ success: false, message: 'Cart is empty.' });

  // Validate stock
  for (const item of items) {
    if (!item.is_active) return res.status(400).json({ success: false, message: `${item.name} is no longer available.` });
    if (item.quantity > item.stock_quantity) return res.status(400).json({ success: false, message: `Insufficient stock for ${item.name}.` });
  }

  // Calculate totals
  let subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const taxRate = 0.18; // 18% GST
  const shippingAmount = subtotal > 10000 ? 0 : 999; // Free shipping above ₹10,000
  let discountAmount = 0;

  // Apply coupon if provided
  if (coupon_code) {
    const coupons = await query(
      'SELECT * FROM coupons WHERE code = ? AND is_active = 1 AND (expires_at IS NULL OR expires_at > NOW())',
      [coupon_code.toUpperCase()]
    );
    if (coupons.length) {
      const coupon = coupons[0];
      if (subtotal >= coupon.min_order_amount) {
        if (coupon.discount_type === 'percentage') {
          discountAmount = Math.min((subtotal * coupon.discount_value) / 100, coupon.max_discount || Infinity);
        } else {
          discountAmount = coupon.discount_value;
        }
        await query('UPDATE coupons SET used_count = used_count + 1 WHERE id = ?', [coupon.id]);
      }
    }
  }

  const taxAmount = (subtotal - discountAmount) * taxRate;
  const totalAmount = subtotal - discountAmount + taxAmount + shippingAmount;
  const orderNumber = generateOrderNumber();
  const estimatedDelivery = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  const shippingAddress = {
    full_name: address.full_name,
    phone: address.phone,
    address_line1: address.address_line1,
    address_line2: address.address_line2,
    city: address.city,
    state: address.state,
    postal_code: address.postal_code,
    country: address.country
  };

  // Create order transaction
  const orderResult = await query(
    `INSERT INTO orders (user_id, order_number, subtotal, tax_amount, shipping_amount, discount_amount, total_amount, shipping_address, notes, estimated_delivery, status)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'confirmed')`,
    [userId, orderNumber, subtotal, taxAmount, shippingAmount, discountAmount, totalAmount, JSON.stringify(shippingAddress), notes, estimatedDelivery]
  );

  const orderId = orderResult.insertId;

  // Insert order items & update stock
  for (const item of items) {
    const imgArr = typeof item.images === 'string' ? JSON.parse(item.images || '[]') : (item.images || []);
    await query(
      'INSERT INTO order_items (order_id, product_id, product_name, product_image, quantity, unit_price, total_price) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [orderId, item.product_id, item.name, imgArr[0] || '', item.quantity, item.price, item.price * item.quantity]
    );
    await query('UPDATE products SET stock_quantity = stock_quantity - ? WHERE id = ?', [item.quantity, item.product_id]);
  }

  // Record payment
  await query(
    'INSERT INTO payments (order_id, payment_method, payment_status, amount, transaction_id) VALUES (?, ?, ?, ?, ?)',
    [orderId, payment_method, payment_method === 'cod' ? 'pending' : 'completed', totalAmount, `TXN-${uuidv4().substring(0, 8).toUpperCase()}`]
  );

  // Clear cart
  await query('DELETE FROM cart_items WHERE cart_id = ?', [cartId]);

  res.status(201).json({
    success: true,
    message: 'Order placed successfully!',
    order: { id: orderId, order_number: orderNumber, total_amount: totalAmount, estimated_delivery: estimatedDelivery }
  });
});

// @GET /api/orders
const getUserOrders = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10 } = req.query;
  const offset = (page - 1) * limit;

  const orders = await query(
    `SELECT o.*, p.payment_method, p.payment_status, p.transaction_id
     FROM orders o LEFT JOIN payments p ON o.id = p.order_id
     WHERE o.user_id = ? ORDER BY o.created_at DESC LIMIT ? OFFSET ?`,
    [req.user.id, parseInt(limit), offset]
  );

  const [{ total }] = await query('SELECT COUNT(*) as total FROM orders WHERE user_id = ?', [req.user.id]);

  res.json({ success: true, orders, pagination: { total, page: parseInt(page), pages: Math.ceil(total / limit) } });
});

// @GET /api/orders/:id
const getOrderById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;
  const isAdmin = req.user.role === 'admin';

  const orders = await query(
    `SELECT o.*, p.payment_method, p.payment_status, p.transaction_id
     FROM orders o LEFT JOIN payments p ON o.id = p.order_id
     WHERE o.id = ? ${!isAdmin ? 'AND o.user_id = ?' : ''}`,
    isAdmin ? [id] : [id, userId]
  );

  if (!orders.length) return res.status(404).json({ success: false, message: 'Order not found.' });

  const order = {
    ...orders[0],
    shipping_address: typeof orders[0].shipping_address === 'string' ? JSON.parse(orders[0].shipping_address) : orders[0].shipping_address
  };

  const items = await query('SELECT * FROM order_items WHERE order_id = ?', [id]);
  res.json({ success: true, order, items });
});

// @PUT /api/orders/:id/cancel
const cancelOrder = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const orders = await query('SELECT id, status FROM orders WHERE id = ? AND user_id = ?', [id, req.user.id]);
  if (!orders.length) return res.status(404).json({ success: false, message: 'Order not found.' });

  if (!['pending', 'confirmed'].includes(orders[0].status)) {
    return res.status(400).json({ success: false, message: 'Order cannot be cancelled at this stage.' });
  }

  await query('UPDATE orders SET status = "cancelled", updated_at = NOW() WHERE id = ?', [id]);
  res.json({ success: true, message: 'Order cancelled successfully.' });
});

// @GET /api/admin/orders (Admin)
const getAllOrders = asyncHandler(async (req, res) => {
  const { status, page = 1, limit = 20 } = req.query;
  const offset = (page - 1) * limit;

  let sql = `SELECT o.*, u.first_name, u.last_name, u.email, p.payment_method, p.payment_status
             FROM orders o JOIN users u ON o.user_id = u.id
             LEFT JOIN payments p ON o.id = p.order_id`;
  const params = [];
  if (status) { sql += ' WHERE o.status = ?'; params.push(status); }
  sql += ' ORDER BY o.created_at DESC LIMIT ? OFFSET ?';
  params.push(parseInt(limit), offset);

  const orders = await query(sql, params);
  const [{ total }] = await query('SELECT COUNT(*) as total FROM orders' + (status ? ' WHERE status = ?' : ''), status ? [status] : []);

  res.json({ success: true, orders, pagination: { total, page: parseInt(page), pages: Math.ceil(total / limit) } });
});

// @PUT /api/admin/orders/:id/status (Admin)
const updateOrderStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  const validStatuses = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded'];

  if (!validStatuses.includes(status)) {
    return res.status(400).json({ success: false, message: 'Invalid status.' });
  }

  const extra = status === 'delivered' ? ', delivered_at = NOW()' : '';
  await query(`UPDATE orders SET status = ?${extra}, updated_at = NOW() WHERE id = ?`, [status, id]);
  res.json({ success: true, message: 'Order status updated.' });
});

module.exports = { placeOrder, getUserOrders, getOrderById, cancelOrder, getAllOrders, updateOrderStatus };
