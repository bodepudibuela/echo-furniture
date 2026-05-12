// ============================================================
// Additional Controllers: Address, Wishlist, Categories, Admin
// ============================================================
const { query } = require('../config/database');
const { asyncHandler } = require('../middleware/errorHandler');

// ============================================================
// ADDRESS CONTROLLER
// ============================================================
const getAddresses = asyncHandler(async (req, res) => {
  const addresses = await query('SELECT * FROM addresses WHERE user_id = ? ORDER BY is_default DESC', [req.user.id]);
  res.json({ success: true, addresses });
});

const addAddress = asyncHandler(async (req, res) => {
  const { label, full_name, phone, address_line1, address_line2, city, state, postal_code, country, is_default } = req.body;
  if (!full_name || !phone || !address_line1 || !city || !state || !postal_code) {
    return res.status(400).json({ success: false, message: 'Please fill all required address fields.' });
  }

  if (is_default) {
    await query('UPDATE addresses SET is_default = 0 WHERE user_id = ?', [req.user.id]);
  }

  const result = await query(
    'INSERT INTO addresses (user_id, label, full_name, phone, address_line1, address_line2, city, state, postal_code, country, is_default) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
    [req.user.id, label || 'Home', full_name, phone, address_line1, address_line2, city, state, postal_code, country || 'India', is_default ? 1 : 0]
  );
  res.status(201).json({ success: true, message: 'Address added.', id: result.insertId });
});

const updateAddress = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { label, full_name, phone, address_line1, address_line2, city, state, postal_code, country, is_default } = req.body;
  if (is_default) await query('UPDATE addresses SET is_default = 0 WHERE user_id = ?', [req.user.id]);
  await query(
    'UPDATE addresses SET label=?, full_name=?, phone=?, address_line1=?, address_line2=?, city=?, state=?, postal_code=?, country=?, is_default=? WHERE id=? AND user_id=?',
    [label, full_name, phone, address_line1, address_line2, city, state, postal_code, country, is_default ? 1 : 0, id, req.user.id]
  );
  res.json({ success: true, message: 'Address updated.' });
});

const deleteAddress = asyncHandler(async (req, res) => {
  const { id } = req.params;
  await query('DELETE FROM addresses WHERE id = ? AND user_id = ?', [id, req.user.id]);
  res.json({ success: true, message: 'Address deleted.' });
});

// ============================================================
// WISHLIST CONTROLLER
// ============================================================
const getWishlist = asyncHandler(async (req, res) => {
  const items = await query(
    `SELECT w.id, w.product_id, w.created_at, p.name, p.price, p.original_price, p.images, p.avg_rating, p.stock_quantity
     FROM wishlist w JOIN products p ON w.product_id = p.id
     WHERE w.user_id = ? ORDER BY w.created_at DESC`,
    [req.user.id]
  );
  const parsed = items.map(i => ({
    ...i,
    images: typeof i.images === 'string' ? JSON.parse(i.images || '[]') : (i.images || [])
  }));
  res.json({ success: true, wishlist: parsed });
});

const toggleWishlist = asyncHandler(async (req, res) => {
  const { product_id } = req.body;
  const existing = await query('SELECT id FROM wishlist WHERE user_id = ? AND product_id = ?', [req.user.id, product_id]);
  if (existing.length) {
    await query('DELETE FROM wishlist WHERE id = ?', [existing[0].id]);
    return res.json({ success: true, added: false, message: 'Removed from wishlist.' });
  }
  await query('INSERT INTO wishlist (user_id, product_id) VALUES (?, ?)', [req.user.id, product_id]);
  res.json({ success: true, added: true, message: 'Added to wishlist.' });
});

// ============================================================
// CATEGORIES CONTROLLER
// ============================================================
const getCategories = asyncHandler(async (req, res) => {
  const categories = await query(
    `SELECT c.*, COUNT(p.id) as product_count
     FROM categories c LEFT JOIN products p ON c.id = p.category_id AND p.is_active = 1
     WHERE c.is_active = 1 GROUP BY c.id ORDER BY c.name`,
  );
  res.json({ success: true, categories });
});

// ============================================================
// ADMIN CONTROLLER
// ============================================================
const getDashboardStats = asyncHandler(async (req, res) => {
  const [totalOrders] = await query('SELECT COUNT(*) as count, IFNULL(SUM(total_amount), 0) as revenue FROM orders WHERE status != "cancelled"');
  const [totalUsers] = await query('SELECT COUNT(*) as count FROM users WHERE role = "user"');
  const [totalProducts] = await query('SELECT COUNT(*) as count FROM products WHERE is_active = 1');
  const [pendingOrders] = await query('SELECT COUNT(*) as count FROM orders WHERE status IN ("pending", "confirmed", "processing")');

  const recentOrders = await query(
    `SELECT o.id, o.order_number, o.status, o.total_amount, o.created_at, u.first_name, u.last_name
     FROM orders o JOIN users u ON o.user_id = u.id ORDER BY o.created_at DESC LIMIT 5`
  );

  const topProducts = await query(
    `SELECT p.name, p.price, p.avg_rating, IFNULL(SUM(oi.quantity), 0) as total_sold
     FROM products p LEFT JOIN order_items oi ON p.id = oi.product_id
     GROUP BY p.id ORDER BY total_sold DESC LIMIT 5`
  );

  const salesByMonth = await query(
    `SELECT DATE_FORMAT(created_at, '%Y-%m') as month, SUM(total_amount) as revenue, COUNT(*) as orders
     FROM orders WHERE status != 'cancelled' AND created_at >= DATE_SUB(NOW(), INTERVAL 6 MONTH)
     GROUP BY month ORDER BY month`
  );

  res.json({
    success: true,
    stats: {
      totalOrders: totalOrders.count,
      totalRevenue: totalOrders.revenue,
      totalUsers: totalUsers.count,
      totalProducts: totalProducts.count,
      pendingOrders: pendingOrders.count
    },
    recentOrders,
    topProducts,
    salesByMonth
  });
});

const getAdminUsers = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20 } = req.query;
  const offset = (page - 1) * limit;
  const users = await query(
    'SELECT id, first_name, last_name, email, phone, role, is_active, created_at FROM users ORDER BY created_at DESC LIMIT ? OFFSET ?',
    [parseInt(limit), offset]
  );
  const [{ total }] = await query('SELECT COUNT(*) as total FROM users');
  res.json({ success: true, users, pagination: { total, page: parseInt(page), pages: Math.ceil(total / limit) } });
});

const updateUserStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { is_active } = req.body;
  await query('UPDATE users SET is_active = ?, updated_at = NOW() WHERE id = ?', [is_active ? 1 : 0, id]);
  res.json({ success: true, message: 'User status updated.' });
});

module.exports = {
  getAddresses, addAddress, updateAddress, deleteAddress,
  getWishlist, toggleWishlist,
  getCategories,
  getDashboardStats, getAdminUsers, updateUserStatus
};
