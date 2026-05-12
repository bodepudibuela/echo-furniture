// ============================================================
// Products Controller
// ============================================================
const { query } = require('../config/database');
const { asyncHandler } = require('../middleware/errorHandler');

// Build product query with filters
const buildProductQuery = (filters = {}) => {
  let sql = `
    SELECT p.*, c.name as category_name, c.slug as category_slug
    FROM products p
    JOIN categories c ON p.category_id = c.id
    WHERE p.is_active = 1
  `;
  const params = [];

  if (filters.category) {
    sql += ' AND c.slug = ?';
    params.push(filters.category);
  }
  if (filters.search) {
    sql += ' AND (p.name LIKE ? OR p.description LIKE ? OR p.brand LIKE ?)';
    const s = `%${filters.search}%`;
    params.push(s, s, s);
  }
  if (filters.min_price) {
    sql += ' AND p.price >= ?';
    params.push(parseFloat(filters.min_price));
  }
  if (filters.max_price) {
    sql += ' AND p.price <= ?';
    params.push(parseFloat(filters.max_price));
  }
  if (filters.min_rating) {
    sql += ' AND p.avg_rating >= ?';
    params.push(parseFloat(filters.min_rating));
  }
  if (filters.featured) {
    sql += ' AND p.is_featured = 1';
  }

  return { sql, params };
};

// @GET /api/products
const getProducts = asyncHandler(async (req, res) => {
  const { category, search, min_price, max_price, min_rating, sort = 'newest', page = 1, limit = 12, featured } = req.query;
  const offset = (parseInt(page) - 1) * parseInt(limit);

  const { sql, params } = buildProductQuery({ category, search, min_price, max_price, min_rating, featured });

  // Count query
  const countSql = sql.replace('SELECT p.*, c.name as category_name, c.slug as category_slug', 'SELECT COUNT(*) as total');
  const countResult = await query(countSql, params);
const total = countResult[0] ? countResult[0].total : 0;

  // Sort
  let orderBy = ' ORDER BY p.created_at DESC';
  if (sort === 'price_asc') orderBy = ' ORDER BY p.price ASC';
  if (sort === 'price_desc') orderBy = ' ORDER BY p.price DESC';
  if (sort === 'rating') orderBy = ' ORDER BY p.avg_rating DESC';
  if (sort === 'popular') orderBy = ' ORDER BY p.review_count DESC';

  const finalSql = sql + orderBy + ' LIMIT ? OFFSET ?';
 const products = await query(finalSql, [...params, Number(limit), Number(offset)]);
  // Parse images JSON
  const parsed = products.map(p => ({
    ...p,
    images: typeof p.images === 'string' ? JSON.parse(p.images || '[]') : (p.images || [])
  }));

  res.json({
    success: true,
    products: parsed,
    pagination: {
      total: parseInt(total),
      page: parseInt(page),
      limit: parseInt(limit),
      pages: Math.ceil(total / limit)
    }
  });
});

// @GET /api/products/featured
const getFeaturedProducts = asyncHandler(async (req, res) => {
  const products = await query(
    `SELECT p.*, c.name as category_name FROM products p
     JOIN categories c ON p.category_id = c.id
     WHERE p.is_featured = 1 AND p.is_active = 1
     ORDER BY p.avg_rating DESC LIMIT 8`
  );
  const parsed = products.map(p => ({
    ...p,
    images: typeof p.images === 'string' ? JSON.parse(p.images || '[]') : (p.images || [])
  }));
  res.json({ success: true, products: parsed });
});

// @GET /api/products/:id
const getProductById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const isSlug = isNaN(id);

  const products = await query(
    `SELECT p.*, c.name as category_name, c.slug as category_slug
     FROM products p JOIN categories c ON p.category_id = c.id
     WHERE ${isSlug ? 'p.slug' : 'p.id'} = ? AND p.is_active = 1`,
    [id]
  );
  if (!products.length) {
    return res.status(404).json({ success: false, message: 'Product not found.' });
  }

  const product = {
    ...products[0],
    images: typeof products[0].images === 'string' ? JSON.parse(products[0].images || '[]') : (products[0].images || [])
  };

  // Get reviews
  const reviews = await query(
    `SELECT r.*, u.first_name, u.last_name FROM reviews r
     JOIN users u ON r.user_id = u.id
     WHERE r.product_id = ? AND r.is_approved = 1
     ORDER BY r.created_at DESC LIMIT 10`,
    [product.id]
  );

  // Related products
  const related = await query(
    `SELECT p.*, c.name as category_name FROM products p
     JOIN categories c ON p.category_id = c.id
     WHERE p.category_id = ? AND p.id != ? AND p.is_active = 1
     ORDER BY p.avg_rating DESC LIMIT 4`,
    [product.category_id, product.id]
  );

  res.json({
    success: true,
    product,
    reviews,
    related: related.map(p => ({
      ...p,
      images: typeof p.images === 'string' ? JSON.parse(p.images || '[]') : (p.images || [])
    }))
  });
});

// @POST /api/products (Admin)
const createProduct = asyncHandler(async (req, res) => {
  const {
    category_id, name, description, short_description, price, original_price,
    discount_percent, stock_quantity, sku, brand, material, dimensions,
    weight, color, is_featured, images, tags
  } = req.body;

  if (!name || !price || !category_id) {
    return res.status(400).json({ success: false, message: 'Name, price, and category are required.' });
  }

  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') + '-' + Date.now();
  const imagesJson = JSON.stringify(images || []);

  const result = await query(
    `INSERT INTO products (category_id, name, slug, description, short_description, price, original_price,
     discount_percent, stock_quantity, sku, brand, material, dimensions, weight, color, is_featured, images, tags)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [category_id, name, slug, description, short_description, price, original_price,
     discount_percent || 0, stock_quantity || 0, sku, brand, material, dimensions,
     weight, color, is_featured ? 1 : 0, imagesJson, tags]
  );

  res.status(201).json({ success: true, message: 'Product created successfully.', productId: result.insertId });
});

// @PUT /api/products/:id (Admin)
const updateProduct = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const {
    category_id, name, description, short_description, price, original_price,
    discount_percent, stock_quantity, sku, brand, material, dimensions,
    weight, color, is_featured, images, tags, is_active
  } = req.body;

  const existing = await query('SELECT id FROM products WHERE id = ?', [id]);
  if (!existing.length) {
    return res.status(404).json({ success: false, message: 'Product not found.' });
  }

  await query(
    `UPDATE products SET category_id=?, name=?, description=?, short_description=?, price=?,
     original_price=?, discount_percent=?, stock_quantity=?, sku=?, brand=?, material=?,
     dimensions=?, weight=?, color=?, is_featured=?, images=?, tags=?, is_active=?, updated_at=NOW()
     WHERE id=?`,
    [category_id, name, description, short_description, price, original_price,
     discount_percent || 0, stock_quantity || 0, sku, brand, material, dimensions,
     weight, color, is_featured ? 1 : 0, JSON.stringify(images || []), tags, is_active ? 1 : 0, id]
  );

  res.json({ success: true, message: 'Product updated successfully.' });
});

// @DELETE /api/products/:id (Admin)
const deleteProduct = asyncHandler(async (req, res) => {
  const { id } = req.params;
  await query('UPDATE products SET is_active = 0, updated_at = NOW() WHERE id = ?', [id]);
  res.json({ success: true, message: 'Product deleted successfully.' });
});

// @POST /api/products/:id/reviews
const addReview = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { rating, title, comment } = req.body;
  const userId = req.user.id;

  if (!rating || rating < 1 || rating > 5) {
    return res.status(400).json({ success: false, message: 'Rating must be between 1 and 5.' });
  }

  const existing = await query('SELECT id FROM reviews WHERE product_id = ? AND user_id = ?', [id, userId]);
  if (existing.length) {
    return res.status(409).json({ success: false, message: 'You have already reviewed this product.' });
  }

  await query(
    'INSERT INTO reviews (product_id, user_id, rating, title, comment) VALUES (?, ?, ?, ?, ?)',
    [id, userId, rating, title, comment]
  );

  // Update product avg rating
  const [{ avg, count }] = await query(
    'SELECT AVG(rating) as avg, COUNT(*) as count FROM reviews WHERE product_id = ? AND is_approved = 1',
    [id]
  );
  await query('UPDATE products SET avg_rating = ?, review_count = ? WHERE id = ?', [avg.toFixed(2), count, id]);

  res.status(201).json({ success: true, message: 'Review submitted successfully.' });
});

module.exports = { getProducts, getFeaturedProducts, getProductById, createProduct, updateProduct, deleteProduct, addReview };
