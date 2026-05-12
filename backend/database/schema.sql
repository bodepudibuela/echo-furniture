-- ============================================================
-- Echo-Furniture Database Schema
-- ============================================================

CREATE DATABASE IF NOT EXISTS echo_furniture;
USE echo_furniture;

-- ============================================================
-- CATEGORIES TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS categories (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  slug VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  image_url VARCHAR(500),
  is_active TINYINT(1) DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- ============================================================
-- USERS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  phone VARCHAR(20),
  role ENUM('user', 'admin') DEFAULT 'user',
  is_active TINYINT(1) DEFAULT 1,
  email_verified TINYINT(1) DEFAULT 0,
  profile_image VARCHAR(500),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- ============================================================
-- ADDRESSES TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS addresses (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  label VARCHAR(50) DEFAULT 'Home',
  full_name VARCHAR(200) NOT NULL,
  phone VARCHAR(20) NOT NULL,
  address_line1 VARCHAR(255) NOT NULL,
  address_line2 VARCHAR(255),
  city VARCHAR(100) NOT NULL,
  state VARCHAR(100) NOT NULL,
  postal_code VARCHAR(20) NOT NULL,
  country VARCHAR(100) DEFAULT 'India',
  is_default TINYINT(1) DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ============================================================
-- PRODUCTS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS products (
  id INT AUTO_INCREMENT PRIMARY KEY,
  category_id INT NOT NULL,
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) NOT NULL UNIQUE,
  description TEXT,
  short_description VARCHAR(500),
  price DECIMAL(10, 2) NOT NULL,
  original_price DECIMAL(10, 2),
  discount_percent INT DEFAULT 0,
  stock_quantity INT DEFAULT 0,
  sku VARCHAR(100) UNIQUE,
  brand VARCHAR(100),
  material VARCHAR(200),
  dimensions VARCHAR(200),
  weight DECIMAL(8, 2),
  color VARCHAR(100),
  is_featured TINYINT(1) DEFAULT 0,
  is_active TINYINT(1) DEFAULT 1,
  images JSON,
  tags VARCHAR(500),
  avg_rating DECIMAL(3, 2) DEFAULT 0,
  review_count INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE RESTRICT
);

-- ============================================================
-- CART TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS cart (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT,
  session_id VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ============================================================
-- CART ITEMS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS cart_items (
  id INT AUTO_INCREMENT PRIMARY KEY,
  cart_id INT NOT NULL,
  product_id INT NOT NULL,
  quantity INT NOT NULL DEFAULT 1,
  price DECIMAL(10, 2) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (cart_id) REFERENCES cart(id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);

-- ============================================================
-- WISHLIST TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS wishlist (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  product_id INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY unique_wishlist (user_id, product_id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);

-- ============================================================
-- ORDERS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS orders (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  order_number VARCHAR(50) NOT NULL UNIQUE,
  status ENUM('pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded') DEFAULT 'pending',
  subtotal DECIMAL(10, 2) NOT NULL,
  tax_amount DECIMAL(10, 2) DEFAULT 0,
  shipping_amount DECIMAL(10, 2) DEFAULT 0,
  discount_amount DECIMAL(10, 2) DEFAULT 0,
  total_amount DECIMAL(10, 2) NOT NULL,
  shipping_address JSON NOT NULL,
  billing_address JSON,
  notes TEXT,
  estimated_delivery DATE,
  delivered_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE RESTRICT
);

-- ============================================================
-- ORDER ITEMS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS order_items (
  id INT AUTO_INCREMENT PRIMARY KEY,
  order_id INT NOT NULL,
  product_id INT NOT NULL,
  product_name VARCHAR(255) NOT NULL,
  product_image VARCHAR(500),
  quantity INT NOT NULL,
  unit_price DECIMAL(10, 2) NOT NULL,
  total_price DECIMAL(10, 2) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE RESTRICT
);

-- ============================================================
-- PAYMENTS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS payments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  order_id INT NOT NULL,
  payment_method ENUM('credit_card', 'debit_card', 'upi', 'net_banking', 'cod', 'wallet') NOT NULL,
  payment_status ENUM('pending', 'processing', 'completed', 'failed', 'refunded') DEFAULT 'pending',
  transaction_id VARCHAR(255),
  amount DECIMAL(10, 2) NOT NULL,
  currency VARCHAR(10) DEFAULT 'INR',
  gateway_response JSON,
  paid_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
);

-- ============================================================
-- REVIEWS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS reviews (
  id INT AUTO_INCREMENT PRIMARY KEY,
  product_id INT NOT NULL,
  user_id INT NOT NULL,
  order_id INT,
  rating INT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  title VARCHAR(255),
  comment TEXT,
  is_verified TINYINT(1) DEFAULT 0,
  is_approved TINYINT(1) DEFAULT 1,
  helpful_count INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY unique_review (product_id, user_id),
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE SET NULL
);

-- ============================================================
-- COUPONS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS coupons (
  id INT AUTO_INCREMENT PRIMARY KEY,
  code VARCHAR(50) NOT NULL UNIQUE,
  description VARCHAR(255),
  discount_type ENUM('percentage', 'fixed') NOT NULL,
  discount_value DECIMAL(10, 2) NOT NULL,
  min_order_amount DECIMAL(10, 2) DEFAULT 0,
  max_discount DECIMAL(10, 2),
  usage_limit INT,
  used_count INT DEFAULT 0,
  is_active TINYINT(1) DEFAULT 1,
  expires_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================
CREATE INDEX idx_products_category ON products(category_id);
CREATE INDEX idx_products_featured ON products(is_featured);
CREATE INDEX idx_products_active ON products(is_active);
CREATE INDEX idx_orders_user ON orders(user_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_cart_user ON cart(user_id);
CREATE INDEX idx_reviews_product ON reviews(product_id);

-- ============================================================
-- SAMPLE DATA
-- ============================================================

-- Categories
INSERT INTO categories (name, slug, description, image_url) VALUES
('Sofas', 'sofas', 'Luxurious and comfortable sofas for your living room', 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=800'),
('Beds', 'beds', 'Premium beds for a perfect night sleep', 'https://images.unsplash.com/photo-1505693314120-0d443867891c?w=800'),
('Chairs', 'chairs', 'Elegant chairs for every room', 'https://images.unsplash.com/photo-1592078615290-033ee584e267?w=800'),
('Tables', 'tables', 'Stylish tables for dining and work', 'https://images.unsplash.com/photo-1611967164521-abae8fba4668?w=800'),
('Office Furniture', 'office-furniture', 'Professional furniture for your workspace', 'https://images.unsplash.com/photo-1593642632559-0c6d3fc62b89?w=800'),
('Decor', 'decor', 'Beautiful decor to complete your home', 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=800');

-- Admin user (password: Admin@123)
INSERT INTO users (first_name, last_name, email, password, role, is_active, email_verified) VALUES
('Admin', 'Echo', 'admin@echofurniture.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewSJXzHMJoVMnEqO', 'admin', 1, 1),
('John', 'Doe', 'john@example.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewSJXzHMJoVMnEqO', 'user', 1, 1),
('Sarah', 'Johnson', 'sarah@example.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewSJXzHMJoVMnEqO', 'user', 1, 1);

-- Products - Sofas
INSERT INTO products (category_id, name, slug, description, short_description, price, original_price, discount_percent, stock_quantity, sku, brand, material, dimensions, color, is_featured, images, avg_rating, review_count) VALUES
(1, 'Milano Premium L-Shaped Sofa', 'milano-l-shaped-sofa', 'The Milano Premium L-Shaped Sofa is a masterpiece of Italian design. Crafted with premium linen fabric and solid hardwood legs, it offers an unparalleled combination of style and comfort. The deep seats and plush cushions make it perfect for lounging, while the timeless design ensures it will remain a centrepiece of your living room for years to come.', 'Italian-inspired L-shaped sofa with premium linen fabric', 89999.00, 119999.00, 25, 15, 'SF-001', 'Echo Luxe', 'Premium Linen, Solid Hardwood', '280cm x 180cm x 85cm', 'Beige', 1, '["https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=800","https://images.unsplash.com/photo-1493663284031-b7e3aefcae8e?w=800"]', 4.8, 124),

(1, 'Nordic 3-Seater Sofa', 'nordic-3-seater-sofa', 'The Nordic 3-Seater Sofa embodies Scandinavian simplicity at its finest. Featuring a solid oak frame and high-density foam cushions wrapped in premium velvet, this sofa offers exceptional comfort without compromising on style.', 'Scandinavian-inspired velvet sofa with solid oak frame', 54999.00, 69999.00, 21, 22, 'SF-002', 'NordHome', 'Premium Velvet, Solid Oak', '220cm x 90cm x 82cm', 'Forest Green', 1, '["https://images.unsplash.com/photo-1506439773649-6e0eb8cfb237?w=800","https://images.unsplash.com/photo-1540574163026-643ea20ade25?w=800"]', 4.6, 89),

(1, 'Luxe Chesterfield Sofa', 'luxe-chesterfield-sofa', 'A timeless classic reimagined for the modern home. The Luxe Chesterfield features genuine leather upholstery with hand-crafted button tufting and rolled arms that have defined sophisticated living for centuries.', 'Classic Chesterfield in genuine leather with button tufting', 124999.00, 149999.00, 17, 8, 'SF-003', 'Heritage Home', 'Genuine Leather, Solid Mahogany', '200cm x 85cm x 78cm', 'Cognac Brown', 1, '["https://images.unsplash.com/photo-1484101403633-562f891dc89a?w=800"]', 4.9, 56),

-- Products - Beds
(2, 'Serene King Platform Bed', 'serene-king-platform-bed', 'Sleep in absolute luxury with the Serene King Platform Bed. The upholstered headboard creates an elegant focal point, while the solid wood slat base provides perfect mattress support. No box spring required.', 'Upholstered platform bed with walnut finish', 74999.00, 94999.00, 21, 12, 'BD-001', 'SleepCraft', 'Upholstered Fabric, Solid Walnut', '200cm x 190cm x 120cm', 'Warm Walnut', 1, '["https://images.unsplash.com/photo-1505693314120-0d443867891c?w=800","https://images.unsplash.com/photo-1588046130717-0eb0c9a3ba15?w=800"]', 4.7, 98),

(2, 'Minimal Floating Bed Frame', 'minimal-floating-bed-frame', 'Create the illusion of space with this beautifully minimal floating bed frame. The hidden leg design gives it an ethereal appearance while maintaining rock-solid stability. Perfect for contemporary bedrooms.', 'Contemporary floating bed with hidden legs', 49999.00, 64999.00, 23, 18, 'BD-002', 'ModSpace', 'Solid Oak, Steel', '180cm x 200cm x 40cm', 'Natural Oak', 0, '["https://images.unsplash.com/photo-1540518614846-7eded433c457?w=800"]', 4.5, 67),

-- Products - Chairs
(3, 'Arc Lounge Chair', 'arc-lounge-chair', 'The Arc Lounge Chair is where architectural beauty meets ergonomic comfort. Its distinctive curved silhouette is not just visually striking but perfectly cradles your body for hours of comfortable sitting. Paired with the matching ottoman for a complete relaxation set.', 'Sculptural lounge chair with curved silhouette', 34999.00, 44999.00, 22, 30, 'CH-001', 'Echo Luxe', 'Boucle Fabric, Solid Beech Wood', '75cm x 85cm x 78cm', 'Cream White', 1, '["https://images.unsplash.com/photo-1592078615290-033ee584e267?w=800","https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=800"]', 4.8, 145),

(3, 'Executive Ergonomic Chair', 'executive-ergonomic-chair', 'Designed for those who take their work seriously. The Executive Ergonomic Chair features 13 points of adjustment, lumbar support, and breathable mesh backing to keep you comfortable through the longest workdays.', 'Professional ergonomic chair with full adjustability', 29999.00, 39999.00, 25, 25, 'CH-002', 'ErgoMaster', 'Mesh, Aluminum, Foam', '65cm x 65cm x 110-120cm', 'Midnight Black', 0, '["https://images.unsplash.com/photo-1580480055273-228ff5388ef8?w=800"]', 4.6, 211),

(3, 'Dining Chair Set of 4', 'dining-chair-set-4', 'Elevate your dining experience with this set of four premium dining chairs. The solid oak frame and padded seat create the perfect combination of durability and comfort for family meals and dinner parties alike.', 'Set of 4 premium solid oak dining chairs', 44999.00, 55999.00, 20, 20, 'CH-003', 'DineWell', 'Solid Oak, Linen Fabric', '48cm x 52cm x 90cm', 'Natural & Oatmeal', 1, '["https://images.unsplash.com/photo-1551298370-9d3d53740c72?w=800"]', 4.4, 78),

-- Products - Tables
(4, 'Marble Top Dining Table', 'marble-top-dining-table', 'Make every meal a luxury experience with our stunning Marble Top Dining Table. The genuine Carrara marble surface is paired with a powder-coated steel base, creating a piece that is both beautiful and built to last generations.', 'Genuine Carrara marble dining table for 6', 119999.00, 149999.00, 20, 10, 'TB-001', 'Artisano', 'Carrara Marble, Steel', '200cm x 100cm x 76cm', 'White & Gold', 1, '["https://images.unsplash.com/photo-1611967164521-abae8fba4668?w=800"]', 4.9, 43),

(4, 'Walnut Coffee Table', 'walnut-coffee-table', 'The Walnut Coffee Table is a study in natural beauty. Each piece is crafted from solid American walnut with a live edge design that celebrates the natural grain and character of the wood. No two tables are exactly alike.', 'Live-edge solid walnut coffee table', 28999.00, 36999.00, 22, 14, 'TB-002', 'NatureCraft', 'Solid American Walnut', '120cm x 60cm x 45cm', 'Dark Walnut', 0, '["https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=800"]', 4.7, 92),

-- Products - Office Furniture
(5, 'Executive Standing Desk', 'executive-standing-desk', 'Transform your productivity with our Electric Height-Adjustable Standing Desk. Transition from sitting to standing in seconds with our whisper-quiet dual motor system. Features built-in cable management and a spacious 160x80cm work surface.', 'Electric height-adjustable desk with dual motors', 64999.00, 84999.00, 24, 20, 'OF-001', 'FlexWork', 'Solid Wood Top, Steel Frame', '160cm x 80cm x 70-120cm', 'Walnut & Black', 1, '["https://images.unsplash.com/photo-1593642632559-0c6d3fc62b89?w=800"]', 4.7, 167),

(5, 'Minimalist Bookshelf', 'minimalist-bookshelf', 'The Minimalist Bookshelf brings order and elegance to your reading collection. Five adjustable shelves provide flexible storage for books, plants, and decorative objects. The powder-coated steel frame ensures lifetime durability.', 'Modern steel and wood adjustable bookshelf', 19999.00, 25999.00, 23, 35, 'OF-002', 'ModSpace', 'Steel, Solid Oak', '90cm x 35cm x 180cm', 'Black & Oak', 0, '["https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800"]', 4.5, 89),

-- Products - Decor
(6, 'Woven Jute Area Rug 3x5', 'woven-jute-area-rug', 'Bring warmth and texture to any room with our handwoven Jute Area Rug. Crafted by skilled artisans using sustainably sourced natural jute, each rug features a subtle herringbone pattern that adds visual interest without overwhelming your decor.', 'Handwoven natural jute herringbone area rug', 12999.00, 16999.00, 24, 50, 'DC-001', 'ArtisanWeave', 'Natural Jute', '150cm x 240cm', 'Natural Beige', 0, '["https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=800"]', 4.6, 134),

(6, 'Arched Floor Lamp', 'arched-floor-lamp', 'Cast a warm, ambient glow over your favorite reading nook or seating area with our elegant Arched Floor Lamp. The matte black finish and linen shade create a perfect balance between industrial and organic aesthetics.', 'Elegant arched floor lamp with linen shade', 8999.00, 11999.00, 25, 40, 'DC-002', 'LightCraft', 'Steel, Linen', 'Height: 180cm, Arm: 120cm', 'Matte Black', 1, '["https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800"]', 4.4, 76);

-- Sample Reviews
INSERT INTO reviews (product_id, user_id, rating, title, comment, is_verified, is_approved) VALUES
(1, 2, 5, 'Absolutely stunning sofa!', 'This sofa completely transformed our living room. The quality is outstanding - the fabric is luxurious and the build feels incredibly solid. Worth every rupee!', 1, 1),
(1, 3, 5, 'Best purchase of the year', 'We had this sofa for 3 months now and it still looks brand new. The L-shape is perfect for our family movie nights. Delivery was smooth and assembly was straightforward.', 1, 1),
(4, 2, 4, 'Beautiful bed, great quality', 'The headboard is even more gorgeous in person. Setup took about 2 hours but the instructions were clear. Very happy with this purchase.', 1, 1),
(6, 3, 5, 'Stunning lounge chair', 'The Arc chair is everything the photos promised and more. The boucle fabric is so soft and the shape is just perfect for reading. Getting compliments from every visitor!', 1, 1),
(9, 2, 5, 'Marble is breathtaking', 'The marble top is absolutely gorgeous. Every guest comments on it. The base is sturdy and the overall quality is exceptional. This will last forever.', 1, 1);

-- Sample Coupon
INSERT INTO coupons (code, description, discount_type, discount_value, min_order_amount, max_discount, usage_limit, is_active) VALUES
('ECHO10', '10% off on all orders', 'percentage', 10, 5000, 5000, 100, 1),
('WELCOME500', 'Flat ₹500 off for new users', 'fixed', 500, 2000, 500, 1000, 1),
('LUXE20', '20% off on premium products', 'percentage', 20, 20000, 10000, 50, 1);
