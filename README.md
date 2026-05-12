# 🪑 Echo-Furniture — Premium E-Commerce Platform

A full-stack furniture e-commerce website built with **HTML/CSS/JS** (frontend), **Node.js + Express** (backend), and **MySQL** (database).

---

## 🗂️ Project Structure

```
echo-furniture/
├── frontend/
│   ├── index.html                  # Home page
│   ├── styles/
│   │   └── main.css                # Global design system
│   ├── scripts/
│   │   └── main.js                 # Shared utilities, API client, navbar/footer
│   └── pages/
│       ├── products.html           # Product listing with filters
│       ├── product-detail.html     # Product detail + reviews
│       ├── cart.html               # Shopping cart
│       ├── checkout.html           # Checkout + payment
│       ├── login.html              # Login + Register
│       ├── profile.html            # User profile
│       ├── orders.html             # Order history + tracking
│       ├── wishlist.html           # Saved items
│       └── admin.html              # Admin dashboard
│
└── backend/
    ├── server.js                   # Express app entry point
    ├── package.json
    ├── .env.example                # Environment variable template
    ├── config/
    │   └── database.js             # MySQL connection pool
    ├── middleware/
    │   ├── auth.js                 # JWT authentication
    │   └── errorHandler.js         # Global error handling
    ├── controllers/
    │   ├── authController.js       # Register, login, profile
    │   ├── productController.js    # Product CRUD + reviews
    │   ├── cartController.js       # Cart management
    │   ├── orderController.js      # Order processing
    │   └── otherControllers.js     # Address, wishlist, categories, admin
    ├── routes/
    │   ├── auth.js                 # Auth routes
    │   ├── products.js             # Product routes
    │   └── index.js                # Cart, orders, address, wishlist, admin routes
    └── database/
        └── schema.sql              # Full DB schema + seed data
```

---

## ⚙️ Prerequisites

- **Node.js** v16+
- **MySQL** 8.0+
- A modern browser

---

## 🚀 Quick Setup

### 1. Database Setup

```bash
# Login to MySQL
mysql -u root -p

# Run the schema (creates DB, tables, and sample data)
mysql -u root -p < backend/database/schema.sql
```

### 2. Backend Setup

```bash
cd backend

# Install dependencies
npm install

# Copy env file and configure
cp .env.example .env
```

Edit `.env`:
```env
PORT=5000
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=echo_furniture
JWT_SECRET=your_secret_key_change_this
```

```bash
# Start backend (development)
npm run dev

# Start backend (production)
npm start
```

Backend runs at: **http://localhost:5000**

### 3. Frontend Setup

No build needed! Open in browser:

**Option A — VS Code Live Server:**
1. Install the "Live Server" extension
2. Right-click `frontend/index.html` → "Open with Live Server"

**Option B — Direct file:**
```
Open: frontend/index.html in your browser
```

> **Note:** Make sure the backend is running on port 5000 before using the frontend.

---

## 🔑 Demo Accounts

| Role  | Email                        | Password   |
|-------|------------------------------|------------|
| Admin | admin@echofurniture.com      | Admin@123  |
| User  | john@example.com             | Admin@123  |
| User  | sarah@example.com            | Admin@123  |

---

## 🎯 Features

### Customer Features
- ✅ Browse products with search, filters (category, price, rating), sorting, and pagination
- ✅ Product detail with image gallery, specs, reviews
- ✅ Add to cart / update quantity / remove items
- ✅ Wishlist (save favourite products)
- ✅ User registration and login (JWT)
- ✅ Checkout with address management, payment method selection
- ✅ Order placement with coupon code support
- ✅ Order history with live tracking progress
- ✅ Order cancellation
- ✅ Profile management (edit details, change password)
- ✅ Product reviews and star ratings

### Admin Features
- ✅ Dashboard with revenue charts, top products, recent orders
- ✅ Add / Edit / Delete products with image preview
- ✅ Manage all orders and update status
- ✅ User management (activate/deactivate)
- ✅ Sales analytics (monthly revenue, order counts)

---

## 🛠️ API Endpoints

### Auth
| Method | Endpoint                  | Description        |
|--------|---------------------------|--------------------|
| POST   | /api/auth/register        | Register user      |
| POST   | /api/auth/login           | Login              |
| GET    | /api/auth/me              | Get current user   |
| PUT    | /api/auth/update-profile  | Update profile     |
| PUT    | /api/auth/change-password | Change password    |

### Products
| Method | Endpoint                    | Description           |
|--------|-----------------------------|-----------------------|
| GET    | /api/products               | List products (filters)|
| GET    | /api/products/featured      | Featured products     |
| GET    | /api/products/:id           | Product detail        |
| POST   | /api/products               | Create (admin)        |
| PUT    | /api/products/:id           | Update (admin)        |
| DELETE | /api/products/:id           | Delete (admin)        |
| POST   | /api/products/:id/reviews   | Add review            |

### Cart
| Method | Endpoint                    | Description    |
|--------|-----------------------------|----------------|
| GET    | /api/cart                   | Get cart       |
| POST   | /api/cart/add               | Add item       |
| PUT    | /api/cart/update/:itemId    | Update qty     |
| DELETE | /api/cart/remove/:itemId    | Remove item    |
| DELETE | /api/cart/clear             | Clear cart     |

### Orders
| Method | Endpoint                        | Description         |
|--------|---------------------------------|---------------------|
| POST   | /api/orders/place               | Place order         |
| GET    | /api/orders                     | User's orders       |
| GET    | /api/orders/:id                 | Order detail        |
| PUT    | /api/orders/:id/cancel          | Cancel order        |
| GET    | /api/orders/admin/all           | All orders (admin)  |
| PUT    | /api/orders/admin/:id/status    | Update status (admin)|

### Other
| Method | Endpoint                    | Description         |
|--------|-----------------------------|---------------------|
| GET    | /api/categories             | All categories      |
| GET    | /api/addresses              | User addresses      |
| POST   | /api/addresses              | Add address         |
| GET    | /api/wishlist               | User wishlist       |
| POST   | /api/wishlist/toggle        | Toggle wishlist     |
| GET    | /api/admin/dashboard        | Dashboard stats     |
| GET    | /api/admin/users            | All users (admin)   |

---

## 🎨 Design System

- **Fonts:** Cormorant Garamond (display) + Jost (body)
- **Palette:** Warm whites, cream, beige, sand, charcoal, dark
- **Accent:** Gold (#8B6914)
- **Responsive:** Mobile-first, breakpoints at 480px / 768px / 1024px

---

## 🔒 Security

- JWT tokens with 7-day expiry
- Passwords hashed with bcrypt (12 rounds)
- Rate limiting (100 req/15min, 10 auth/15min)
- Helmet.js security headers
- CORS configured
- Role-based route protection (admin/user)
- Input validation on all endpoints

---

## 🗃️ Database Schema

| Table         | Description                        |
|---------------|------------------------------------|
| users         | Customer and admin accounts        |
| categories    | Product categories                 |
| products      | Product catalog with images (JSON) |
| cart          | User cart sessions                 |
| cart_items    | Items in each cart                 |
| wishlist      | Saved products per user            |
| orders        | Order records with shipping addr   |
| order_items   | Line items per order               |
| payments      | Payment records per order          |
| reviews       | Product reviews and ratings        |
| addresses     | User delivery addresses            |
| coupons       | Discount coupon codes              |

---

## 💡 Tips

- Run `npm run dev` to auto-restart on file changes (nodemon)
- The `schema.sql` includes sample products, categories, users, and coupons
- Use coupon codes: `ECHO10`, `WELCOME500`, `LUXE20`
- Images use Unsplash URLs — no image hosting needed
- Set `NODE_ENV=production` for production deployments

---

## 📝 License

MIT — Free to use and modify for personal and commercial projects.

---

Built with ❤️ by Echo Furniture Dev Team
