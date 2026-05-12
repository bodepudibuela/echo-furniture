// ============================================================
// Echo-Furniture Global JS Utilities
// ============================================================

const API_BASE = 'https://echo-furniture.onrender.com/api';

// ============================================================
// Smart Path Resolver
// Detects current page location and builds correct relative links
// Works with any Live Server setup:
//   127.0.0.1:5500/echo-furniture/frontend/index.html
//   127.0.0.1:5500/echo-furniture/frontend/pages/cart.html
//   127.0.0.1:5500/frontend/index.html
//   127.0.0.1:5500/index.html
// ============================================================
const path = (() => {
  const loc = window.location.pathname; // e.g. /echo-furniture/frontend/pages/cart.html
  const inPages = loc.includes('/pages/');

  // Base is the frontend root (where index.html lives)
  // From /pages/xxx.html we go up one level: ../
  // From index.html we stay: ./
  const base = inPages ? '../' : './';

  return {
    home:          () => `${base}index.html`,
    products:      (q = '') => `${base}pages/products.html${q}`,
    productDetail: (id) => `${base}pages/product-detail.html?id=${id}`,
    cart:          () => `${base}pages/cart.html`,
    checkout:      () => `${base}pages/checkout.html`,
    login:         (r = '') => `${base}pages/login.html${r ? '?redirect=' + encodeURIComponent(r) : ''}`,
    profile:       () => `${base}pages/profile.html`,
    orders:        () => `${base}pages/orders.html`,
    wishlist:      () => `${base}pages/wishlist.html`,
    admin:         () => `${base}pages/admin.html`,
  };
})();

// ============================================================
// API Client
// ============================================================
const api = {
  async request(endpoint, options = {}) {
    const token = localStorage.getItem('echo_token');
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers
      },
      ...options
    };

    try {
      const res = await fetch(`${API_BASE}${endpoint}`, config);
      const data = await res.json();

      if (!res.ok) {
        if (res.status === 401) {
          auth.logout();
          window.location.href = path.login();
        }
        throw new Error(data.message || 'Something went wrong');
      }
      return data;
    } catch (error) {
      throw error;
    }
  },

  get:    (endpoint)        => api.request(endpoint, { method: 'GET' }),
  post:   (endpoint, body)  => api.request(endpoint, { method: 'POST',   body: JSON.stringify(body) }),
  put:    (endpoint, body)  => api.request(endpoint, { method: 'PUT',    body: JSON.stringify(body) }),
  delete: (endpoint)        => api.request(endpoint, { method: 'DELETE' })
};

// ============================================================
// Auth State Management
// ============================================================
const auth = {
  getToken:   () => localStorage.getItem('echo_token'),
  getUser:    () => {
    try { return JSON.parse(localStorage.getItem('echo_user') || 'null'); }
    catch { return null; }
  },
  isLoggedIn: () => !!localStorage.getItem('echo_token'),
  isAdmin:    () => { const u = auth.getUser(); return u && u.role === 'admin'; },

  login(token, user) {
    localStorage.setItem('echo_token', token);
    localStorage.setItem('echo_user', JSON.stringify(user));
    updateNavUser();
    updateCartCount();
  },
  logout() {
    localStorage.removeItem('echo_token');
    localStorage.removeItem('echo_user');
    updateNavUser();
    updateCartCount();
  }
};

// ============================================================
// Toast Notifications
// ============================================================
const toast = {
  container: null,

  init() {
    if (!this.container) {
      this.container = document.createElement('div');
      this.container.className = 'toast-container';
      document.body.appendChild(this.container);
    }
  },

  show(message, type = 'success', duration = 3500) {
    this.init();
    const icons = {
      success: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="color:#4A7C59"><circle cx="12" cy="12" r="10"/><path d="M9 12l2 2 4-4"/></svg>`,
      error:   `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="color:#C0392B"><circle cx="12" cy="12" r="10"/><path d="M15 9l-6 6M9 9l6 6"/></svg>`,
      warning: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="color:#D4890A"><path d="M12 9v4M12 17h.01"/><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/></svg>`,
      info:    `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="color:#2C6FAC"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/></svg>`
    };
    const el = document.createElement('div');
    el.className = `toast ${type}`;
    el.innerHTML = `
      <span class="toast-icon">${icons[type]}</span>
      <span class="toast-message">${message}</span>
      <button class="toast-close" onclick="this.parentElement.remove()">×</button>
    `;
    this.container.appendChild(el);
    setTimeout(() => { if (el.parentElement) el.remove(); }, duration);
  },

  success: (msg) => toast.show(msg, 'success'),
  error:   (msg) => toast.show(msg, 'error'),
  warning: (msg) => toast.show(msg, 'warning'),
  info:    (msg) => toast.show(msg, 'info')
};

// ============================================================
// Formatters
// ============================================================
const fmt = {
  price: (amount) => '₹' + Number(amount).toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 }),
  date:  (d) => new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
  stars: (rating) => {
    const full = Math.floor(rating);
    const half = rating % 1 >= 0.5;
    let html = '';
    for (let i = 0; i < 5; i++) {
      if (i < full)
        html += `<svg class="star" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>`;
      else if (i === full && half)
        html += `<svg class="star" viewBox="0 0 24 24" fill="currentColor" style="opacity:0.5"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>`;
      else
        html += `<svg class="star" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="opacity:0.3"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>`;
    }
    return html;
  }
};

// ============================================================
// Cart Count
// ============================================================
async function updateCartCount() {
  if (!auth.isLoggedIn()) {
    document.querySelectorAll('.cart-badge').forEach(b => b.style.display = 'none');
    return;
  }
  try {
    const data = await api.get('/cart');
    const count = data.cart?.itemCount || 0;
    document.querySelectorAll('.cart-badge').forEach(b => {
      b.textContent = count;
      b.style.display = count > 0 ? 'flex' : 'none';
    });
  } catch {}
}

// ============================================================
// Nav User State
// ============================================================
function updateNavUser() {
  const user = auth.getUser();
  const loginBtns  = document.querySelectorAll('.nav-login-btn');
  const userMenus  = document.querySelectorAll('.user-menu');
  const adminLinks = document.querySelectorAll('.admin-only');

  if (user) {
    loginBtns.forEach(b  => b.style.display = 'none');
    userMenus.forEach(m  => m.style.display = 'block');
    adminLinks.forEach(l => l.style.display = user.role === 'admin' ? 'block' : 'none');
    document.querySelectorAll('.user-name-display').forEach(el => el.textContent = user.first_name);
  } else {
    loginBtns.forEach(b  => b.style.display = 'flex');
    userMenus.forEach(m  => m.style.display = 'none');
    adminLinks.forEach(l => l.style.display = 'none');
  }
}

// ============================================================
// Add to Cart
// ============================================================
async function addToCart(productId, quantity = 1) {
  if (!auth.isLoggedIn()) {
    toast.warning('Please login to add items to cart');
    setTimeout(() => { window.location.href = path.login(); }, 1500);
    return;
  }
  try {
    await api.post('/cart/add', { product_id: productId, quantity });
    toast.success('Added to cart!');
    updateCartCount();
  } catch (err) {
    toast.error(err.message || 'Failed to add to cart');
  }
}

// ============================================================
// Wishlist Toggle
// ============================================================
async function toggleWishlist(productId, btn) {
  if (!auth.isLoggedIn()) {
    toast.warning('Please login to save to wishlist');
    return;
  }
  try {
    const data = await api.post('/wishlist/toggle', { product_id: productId });
    if (btn) btn.classList.toggle('wishlisted', data.added);
    toast.success(data.message);
  } catch (err) {
    toast.error(err.message || 'Failed to update wishlist');
  }
}

// ============================================================
// Product Card Builder
// ============================================================
function buildProductCard(product) {
  const images = Array.isArray(product.images)
    ? product.images
    : JSON.parse(product.images || '[]');
  const img         = images[0] || 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=600';
  const discount    = product.discount_percent;
  const hasDiscount = discount > 0 && product.original_price;

  return `
    <div class="product-card fade-in" onclick="window.location='${path.productDetail(product.id)}'">
      <div class="product-img-wrap">
        <img src="${img}" alt="${product.name}" class="product-img" loading="lazy"
             onerror="this.src='https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=600'">
        ${hasDiscount
          ? `<span class="product-badge badge-sale">-${discount}%</span>`
          : product.is_featured
            ? `<span class="product-badge badge-featured">Featured</span>`
            : ''}
        <div class="product-actions">
          <button class="product-action-btn"
                  onclick="event.stopPropagation(); toggleWishlist(${product.id}, this)"
                  title="Wishlist">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
          </button>
          <button class="product-action-btn"
                  onclick="event.stopPropagation(); window.location='${path.productDetail(product.id)}'"
                  title="Quick View">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
          </button>
        </div>
      </div>
      <div class="product-info">
        <p class="product-category">${product.category_name || 'Furniture'}</p>
        <h3 class="product-name">${product.name}</h3>
        <div class="product-rating">
          <div class="stars">${fmt.stars(product.avg_rating || 0)}</div>
          <span class="rating-count">(${product.review_count || 0})</span>
        </div>
        <div class="product-price-row">
          <div class="price-group">
            <span class="price-current">${fmt.price(product.price)}</span>
            ${hasDiscount ? `<span class="price-original">${fmt.price(product.original_price)}</span>` : ''}
          </div>
          <button class="add-to-cart-btn"
                  onclick="event.stopPropagation(); addToCart(${product.id})"
                  title="Add to Cart">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 01-8 0"/></svg>
          </button>
        </div>
      </div>
    </div>
  `;
}

// ============================================================
// Navbar
// ============================================================
function renderNavbar() {
  const navEl = document.getElementById('navbar');
  if (!navEl) return;

  navEl.innerHTML = `
    <div class="container">
      <div class="navbar-inner">

        <a href="${path.home()}" class="navbar-logo">Echo<span>·</span>Furniture</a>

        <nav class="navbar-links">
          <a href="${path.home()}"                          class="nav-link">Home</a>
          <a href="${path.products()}"                       class="nav-link">Shop</a>
          <a href="${path.products('?category=sofas')}"      class="nav-link">Sofas</a>
          <a href="${path.products('?category=beds')}"       class="nav-link">Beds</a>
          <a href="${path.products('?category=chairs')}"     class="nav-link">Chairs</a>
          <a href="${path.products('?category=tables')}"     class="nav-link">Tables</a>
        </nav>

        <div class="navbar-actions">

          <a href="${path.products()}" class="nav-icon-btn" title="Search">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
          </a>

          <a href="${path.cart()}" class="nav-icon-btn" title="Cart">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 01-8 0"/></svg>
            <span class="cart-badge" style="display:none">0</span>
          </a>

          <a href="${path.login()}" class="nav-icon-btn nav-login-btn" title="Login">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
          </a>

          <div class="user-menu" style="display:none">
            <button class="nav-icon-btn" onclick="toggleUserDropdown()" title="Account">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
            </button>
            <div class="user-dropdown" id="userDropdown">
              <div style="padding:12px 14px;border-bottom:1px solid var(--beige);margin-bottom:4px;">
                <span style="font-weight:600;font-size:0.9rem;" class="user-name-display">User</span>
                <div style="font-size:0.75rem;color:var(--warm-gray);">My Account</div>
              </div>
              <a href="${path.profile()}">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" width="16" height="16"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                Profile
              </a>
              <a href="${path.orders()}">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" width="16" height="16"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                My Orders
              </a>
              <a href="${path.wishlist()}">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" width="16" height="16"><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/></svg>
                Wishlist
              </a>
              <a href="${path.admin()}" class="admin-only" style="display:none">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" width="16" height="16"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
                Admin Panel
              </a>
              <button onclick="handleLogout()">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" width="16" height="16"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
                Logout
              </button>
            </div>
          </div>

          <button class="hamburger" onclick="toggleMobileMenu()">
            <span></span><span></span><span></span>
          </button>

        </div>
      </div>
    </div>

    <div class="mobile-menu" id="mobileMenu">
      <a href="${path.home()}"                          class="nav-link">Home</a>
      <a href="${path.products()}"                       class="nav-link">Shop All</a>
      <a href="${path.products('?category=sofas')}"      class="nav-link">Sofas</a>
      <a href="${path.products('?category=beds')}"       class="nav-link">Beds</a>
      <a href="${path.products('?category=chairs')}"     class="nav-link">Chairs</a>
      <a href="${path.products('?category=tables')}"     class="nav-link">Tables</a>
      <a href="${path.cart()}"                           class="nav-link">Cart</a>
      <a href="${path.profile()}"                        class="nav-link">Profile</a>
    </div>
  `;

  // Sticky scroll effect
  window.addEventListener('scroll', () => {
    navEl.classList.toggle('scrolled', window.scrollY > 20);
  });

  // Highlight active link
  navEl.querySelectorAll('.nav-link').forEach(l => {
    if (l.href === location.href) l.classList.add('active');
  });

  updateNavUser();
  updateCartCount();
}

function toggleUserDropdown() {
  document.getElementById('userDropdown')?.classList.toggle('open');
}

document.addEventListener('click', (e) => {
  const dd = document.getElementById('userDropdown');
  if (dd && !e.target.closest('.user-menu')) dd.classList.remove('open');
});

function toggleMobileMenu() {
  document.getElementById('mobileMenu')?.classList.toggle('open');
}

function handleLogout() {
  auth.logout();
  toast.success('Logged out successfully');
  setTimeout(() => { window.location.href = path.home(); }, 1000);
}

// ============================================================
// Footer
// ============================================================
function renderFooter() {
  const footerEl = document.getElementById('footer');
  if (!footerEl) return;
  footerEl.innerHTML = `
    <footer class="footer">
      <div class="container">
        <div class="footer-grid">
          <div class="footer-brand">
            <span class="navbar-logo" style="color:white">Echo<span>·</span>Furniture</span>
            <p>Crafting spaces where life unfolds beautifully. Premium furniture for modern living, delivered to your door with care.</p>
            <div class="social-links" style="margin-top:24px">
              <a href="#" class="social-link">f</a>
              <a href="#" class="social-link">in</a>
              <a href="#" class="social-link">ig</a>
              <a href="#" class="social-link">yt</a>
            </div>
          </div>
          <div>
            <h4 class="footer-heading">Shop</h4>
            <div class="footer-links">
              <a href="${path.products('?category=sofas')}">Sofas &amp; Sectionals</a>
              <a href="${path.products('?category=beds')}">Beds &amp; Bedroom</a>
              <a href="${path.products('?category=chairs')}">Chairs</a>
              <a href="${path.products('?category=tables')}">Tables</a>
              <a href="${path.products('?category=office-furniture')}">Office</a>
              <a href="${path.products('?category=decor')}">Decor</a>
            </div>
          </div>
          <div>
            <h4 class="footer-heading">Support</h4>
            <div class="footer-links">
              <a href="#">Help Center</a>
              <a href="#">Track Order</a>
              <a href="#">Returns &amp; Refunds</a>
              <a href="#">Shipping Info</a>
              <a href="#">Assembly Guide</a>
              <a href="#">Contact Us</a>
            </div>
          </div>
          <div>
            <h4 class="footer-heading">Newsletter</h4>
            <p style="font-size:0.85rem;margin-bottom:8px;line-height:1.6">Get design inspiration, new arrivals, and exclusive offers.</p>
            <form class="newsletter-form" onsubmit="event.preventDefault(); toast.success('Subscribed! Welcome to Echo.')">
              <input type="email" class="newsletter-input" placeholder="Your email">
              <button type="submit" class="newsletter-btn">Join</button>
            </form>
          </div>
        </div>
        <div class="footer-bottom">
          <p>&copy; 2024 Echo Furniture. All rights reserved.</p>
          <div style="display:flex;gap:20px;font-size:0.8rem">
            <a href="#" style="color:rgba(255,255,255,0.5)">Privacy Policy</a>
            <a href="#" style="color:rgba(255,255,255,0.5)">Terms of Service</a>
          </div>
        </div>
      </div>
    </footer>
  `;
}

// ============================================================
// Init
// ============================================================
document.addEventListener('DOMContentLoaded', () => {
  renderNavbar();
  renderFooter();
});
