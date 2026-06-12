import { API } from './api.js';
import { showToast, showLoader, hideLoader } from './ui.js';

// ==========================================
// STATE MANAGEMENT
// ==========================================
let currentUser = JSON.parse(localStorage.getItem('petshop_user') || 'null');
let cart = JSON.parse(localStorage.getItem('petshop_cart') || '[]');
let activeAdminTab = 'stats'; // Default admin tab

// Initialize profile check if logged in
async function checkSession() {
  if (currentUser) {
    try {
      const data = await API.getProfile();
      if (data.success) {
        currentUser = data.user;
        localStorage.setItem('petshop_user', JSON.stringify(currentUser));
        updateNavbar();
      }
    } catch (err) {
      console.warn('Sesión inválida o expirada:', err.message);
      logout();
    }
  }
}

// ==========================================
// CART OPERATIONS
// ==========================================
function saveCart() {
  localStorage.setItem('petshop_cart', JSON.stringify(cart));
  updateCartBadge();
}

function addToCart(product, quantity = 1) {
  const existingItem = cart.find(item => item.productId === product._id);
  if (existingItem) {
    const newQty = existingItem.quantity + quantity;
    if (newQty > product.stock) {
      showToast(`No puedes agregar más de ${product.stock} unidades de este producto.`, 'warning');
      return;
    }
    existingItem.quantity = newQty;
  } else {
    if (quantity > product.stock) {
      showToast(`Stock insuficiente. Solo quedan ${product.stock} unidades.`, 'warning');
      return;
    }
    cart.push({
      productId: product._id,
      name: product.name,
      price: product.price,
      quantity: quantity,
      imageUrl: product.imageUrl,
      stock: product.stock
    });
  }
  saveCart();
  showToast(`"${product.name}" agregado al carrito.`);
}

function updateCartQuantity(productId, quantity) {
  const item = cart.find(item => item.productId === productId);
  if (item) {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }
    if (quantity > item.stock) {
      showToast(`Stock insuficiente. Solo quedan ${item.stock} unidades.`, 'warning');
      return;
    }
    item.quantity = quantity;
    saveCart();
    // Re-render cart if on the cart page
    if (window.location.hash === '#/cart') {
      renderCart();
    }
  }
}

function removeFromCart(productId) {
  cart = cart.filter(item => item.productId !== productId);
  saveCart();
  showToast('Producto removido del carrito.', 'info');
  // Re-render cart if on the cart page
  if (window.location.hash === '#/cart') {
    renderCart();
  }
}

function clearCart() {
  cart = [];
  saveCart();
}

function getCartCount() {
  return cart.reduce((sum, item) => sum + item.quantity, 0);
}

// Subtotal total sales
function getCartTotal() {
  return cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
}

function updateCartBadge() {
  const count = getCartCount();
  const badge = document.getElementById('cart-counter');
  if (badge) {
    if (count > 0) {
      badge.textContent = count;
      badge.classList.remove('d-none');
    } else {
      badge.classList.add('d-none');
    }
  }
}

// ==========================================
// AUTH OPERATIONS
// ==========================================
function logout() {
  localStorage.removeItem('petshop_token');
  localStorage.removeItem('petshop_user');
  currentUser = null;
  updateNavbar();
  showToast('Sesión cerrada con éxito.', 'info');
  window.location.hash = '#/';
}

function updateNavbar() {
  const navUserDropdown = document.getElementById('nav-user-dropdown');
  const btnNavLogin = document.getElementById('btn-nav-login');
  const navAdminPanel = document.getElementById('nav-admin-panel');
  const navUserName = document.getElementById('nav-user-name');
  const navUserAvatar = document.getElementById('nav-user-avatar');

  // Highlight active link
  const hash = window.location.hash || '#/';
  document.querySelectorAll('.navbar-nav .nav-link').forEach(link => {
    if (link.getAttribute('href') === hash) {
      link.classList.add('active');
    } else {
      link.classList.remove('active');
    }
  });

  if (currentUser) {
    navUserDropdown.classList.remove('d-none');
    btnNavLogin.classList.add('d-none');
    navUserName.textContent = currentUser.name.split(' ')[0];
    
    // Set user avatar or default
    navUserAvatar.src = currentUser.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop';
    
    // Show admin link if role is Administrador
    if (currentUser.role === 'Administrador') {
      navAdminPanel.classList.remove('d-none');
    } else {
      navAdminPanel.classList.add('d-none');
    }
  } else {
    navUserDropdown.classList.add('d-none');
    btnNavLogin.classList.remove('d-none');
    navAdminPanel.classList.add('d-none');
  }
}

// Listen to login/logout state changes
window.addEventListener('authChange', () => {
  currentUser = JSON.parse(localStorage.getItem('petshop_user') || 'null');
  updateNavbar();
});

// Expose handlers to the global scope so inline onclick attributes can use them
window.app = {
  // Cart operations
  addToCart: async (productId, qty = 1) => {
    try {
      showLoader();
      const data = await API.getProduct(productId);
      hideLoader();
      if (data.success) {
        addToCart(data.product, Number(qty));
      }
    } catch (err) {
      hideLoader();
      showToast(err.message, 'error');
    }
  },
  updateCartQty: (productId, qty) => {
    updateCartQuantity(productId, Number(qty));
  },
  removeFromCart: (productId) => {
    removeFromCart(productId);
  },
  
  // Dashboard tab switching
  changeAdminTab: (tabName) => {
    activeAdminTab = tabName;
    renderAdmin();
  },

  // Auth Operations
  logout: () => {
    logout();
  },

  // Admin Actions
  deleteProduct: async (id) => {
    if (confirm('¿Está seguro de que desea eliminar este producto?')) {
      try {
        showLoader();
        const res = await API.deleteProduct(id);
        hideLoader();
        if (res.success) {
          showToast(res.message);
          renderAdmin();
        }
      } catch (err) {
        hideLoader();
        showToast(err.message, 'error');
      }
    }
  },

  deleteCategory: async (id) => {
    if (confirm('¿Está seguro de que desea eliminar esta categoría?')) {
      try {
        showLoader();
        const res = await API.deleteCategory(id);
        hideLoader();
        if (res.success) {
          showToast(res.message);
          renderAdmin();
        }
      } catch (err) {
        hideLoader();
        showToast(err.message, 'error');
      }
    }
  },

  deleteUser: async (id) => {
    if (confirm('¿Está seguro de que desea eliminar este usuario?')) {
      try {
        showLoader();
        const res = await API.deleteUser(id);
        hideLoader();
        if (res.success) {
          showToast(res.message);
          renderAdmin();
        }
      } catch (err) {
        hideLoader();
        showToast(err.message, 'error');
      }
    }
  },

  updateUserRole: async (id, currentRole) => {
    const newRole = currentRole === 'Administrador' ? 'Cliente' : 'Administrador';
    if (confirm(`¿Desea cambiar el rol del usuario a ${newRole}?`)) {
      try {
        showLoader();
        const res = await API.updateUserRole(id, newRole);
        hideLoader();
        if (res.success) {
          showToast(res.message);
          renderAdmin();
        }
      } catch (err) {
        hideLoader();
        showToast(err.message, 'error');
      }
    }
  },

  updateOrderStatus: async (id) => {
    const statusSelect = document.getElementById(`order-status-select-${id}`);
    const commentInput = document.getElementById(`order-status-comment-${id}`);
    if (!statusSelect) return;

    const status = statusSelect.value;
    const comment = commentInput ? commentInput.value : '';

    try {
      showLoader();
      const res = await API.updateOrderStatus(id, status, comment);
      hideLoader();
      if (res.success) {
        showToast(res.message);
        renderAdmin();
      }
    } catch (err) {
      hideLoader();
      showToast(err.message, 'error');
    }
  },

  toggleOrderDetails: (id) => {
    const detailsRow = document.getElementById(`order-details-${id}`);
    if (detailsRow) {
      detailsRow.classList.toggle('d-none');
    }
  }
};

// ==========================================
// VIEW RENDERERS
// ==========================================
const appContainer = document.getElementById('app');

// ------------------------------------------
// 1. HOME VIEW RENDERER
// ------------------------------------------
async function renderHome() {
  appContainer.innerHTML = `
    <div class="view-container">
      <!-- Premium Hero Section -->
      <section class="hero-section text-center text-md-start">
        <div class="hero-shape hero-shape-1"></div>
        <div class="hero-shape hero-shape-2"></div>
        <div class="container hero-content">
          <div class="row align-items-center g-5">
            <div class="col-md-6">
              <span class="badge bg-warning text-dark px-3 py-2 rounded-pill fw-bold mb-3 shadow-sm" style="font-size: 0.9rem;">
                <i class="fa-solid fa-sparkles me-2"></i>Nueva Experiencia PetShop
              </span>
              <h1 class="display-4 fw-black mb-3 text-dark" style="line-height: 1.2;">
                El Paraíso de tus <span class="text-primary">Mascotas</span> Favoritas
              </h1>
              <p class="lead text-muted mb-4">
                Ofrecemos la mejor selección de alimentos premium, juguetes interactivos, camas ortopédicas y medicamentos aprobados para perros, gatos, aves y roedores.
              </p>
              <div class="d-flex flex-wrap gap-3 justify-content-center justify-content-md-start">
                <a href="#/catalog" class="btn btn-primary btn-lg shadow-lg">
                  <i class="fa-solid fa-shopping-bag me-2"></i>Comprar Ahora
                </a>
                <a href="#/catalog?category=Juguetes" class="btn btn-outline-primary btn-lg">
                  <i class="fa-solid fa-gamepad me-2"></i>Ver Juguetes
                </a>
              </div>
            </div>
            <div class="col-md-6 text-center">
              <img src="https://images.unsplash.com/photo-1543466835-00a7907e9de1?w=600&auto=format&fit=crop" 
                   alt="Cute Dog" 
                   class="img-fluid rounded-4 shadow-lg border border-5 border-white"
                   style="max-height: 400px; object-fit: cover; width: 100%;">
            </div>
          </div>
        </div>
      </section>

      <!-- Core Features Grid -->
      <section class="container py-5 mt-4">
        <div class="row g-4">
          <div class="col-md-3 col-sm-6">
            <div class="p-4 bg-white rounded-4 shadow-sm border border-light text-center h-100 pet-card">
              <div class="icon-wrapper bg-success-subtle text-primary rounded-circle mx-auto mb-3" style="width: 60px; height: 60px; display: flex; align-items: center; justify-content: center;">
                <i class="fa-solid fa-truck-fast fs-3"></i>
              </div>
              <h5 class="fw-bold">Envíos Rápidos</h5>
              <p class="text-muted small mb-0">Gratis en compras mayores a $50 a nivel nacional.</p>
            </div>
          </div>
          <div class="col-md-3 col-sm-6">
            <div class="p-4 bg-white rounded-4 shadow-sm border border-light text-center h-100 pet-card">
              <div class="icon-wrapper bg-warning-subtle text-warning rounded-circle mx-auto mb-3" style="width: 60px; height: 60px; display: flex; align-items: center; justify-content: center;">
                <i class="fa-solid fa-credit-card fs-3"></i>
              </div>
              <h5 class="fw-bold">Pago Seguro</h5>
              <p class="text-muted small mb-0">Múltiples métodos de pago 100% encriptados.</p>
            </div>
          </div>
          <div class="col-md-3 col-sm-6">
            <div class="p-4 bg-white rounded-4 shadow-sm border border-light text-center h-100 pet-card">
              <div class="icon-wrapper bg-info-subtle text-info rounded-circle mx-auto mb-3" style="width: 60px; height: 60px; display: flex; align-items: center; justify-content: center;">
                <i class="fa-solid fa-shield-heart fs-3"></i>
              </div>
              <h5 class="fw-bold">Garantía de Calidad</h5>
              <p class="text-muted small mb-0">Solo marcas certificadas y recomendadas por veterinarios.</p>
            </div>
          </div>
          <div class="col-md-3 col-sm-6">
            <div class="p-4 bg-white rounded-4 shadow-sm border border-light text-center h-100 pet-card">
              <div class="icon-wrapper bg-danger-subtle text-danger rounded-circle mx-auto mb-3" style="width: 60px; height: 60px; display: flex; align-items: center; justify-content: center;">
                <i class="fa-solid fa-headset fs-3"></i>
              </div>
              <h5 class="fw-bold">Atención 24/7</h5>
              <p class="text-muted small mb-0">Soporte experto para cuidar el bienestar de tu mascota.</p>
            </div>
          </div>
        </div>
      </section>

      <!-- Popular Categories Grid -->
      <section class="container py-5 bg-white rounded-4 my-5 shadow-sm border border-light">
        <div class="text-center mb-5">
          <h2 class="fw-bold">Categorías Populares</h2>
          <p class="text-muted">Explora productos pensados especialmente para cada tipo de mascota</p>
        </div>
        <div class="row g-4 px-3">
          <div class="col-lg-3 col-md-6">
            <a href="#/catalog?category=Alimentos para perros" class="text-decoration-none card text-center p-4 border border-light rounded-4 shadow-sm hover-shadow h-100 transition">
              <i class="fa-solid fa-dog text-primary display-4 mb-3"></i>
              <h5 class="text-dark fw-bold mb-1">Perros</h5>
              <span class="text-muted small">Croquetas, snacks y más</span>
            </a>
          </div>
          <div class="col-lg-3 col-md-6">
            <a href="#/catalog?category=Alimentos para gatos" class="text-decoration-none card text-center p-4 border border-light rounded-4 shadow-sm hover-shadow h-100 transition">
              <i class="fa-solid fa-cat text-primary display-4 mb-3"></i>
              <h5 class="text-dark fw-bold mb-1">Gatos</h5>
              <span class="text-muted small">Húmedo, seco y rascadores</span>
            </a>
          </div>
          <div class="col-lg-3 col-md-6">
            <a href="#/catalog?category=Juguetes" class="text-decoration-none card text-center p-4 border border-light rounded-4 shadow-sm hover-shadow h-100 transition">
              <i class="fa-solid fa-bone text-primary display-4 mb-3"></i>
              <h5 class="text-dark fw-bold mb-1">Juguetes</h5>
              <span class="text-muted small">Pelotas, cuerdas e ingenio</span>
            </a>
          </div>
          <div class="col-lg-3 col-md-6">
            <a href="#/catalog?category=Accesorios" class="text-decoration-none card text-center p-4 border border-light rounded-4 shadow-sm hover-shadow h-100 transition">
              <i class="fa-solid fa-shield-cat text-primary display-4 mb-3"></i>
              <h5 class="text-dark fw-bold mb-1">Accesorios</h5>
              <span class="text-muted small">Collares, correas y comederos</span>
            </a>
          </div>
        </div>
      </section>

      <!-- Featured Products Area -->
      <section class="container py-5 mb-5">
        <div class="d-flex justify-content-between align-items-center mb-4">
          <div>
            <h2 class="fw-bold mb-1">Últimos Productos</h2>
            <p class="text-muted mb-0">Novedades recién llegadas a nuestra tienda</p>
          </div>
          <a href="#/catalog" class="btn btn-outline-primary rounded-pill">Ver Catálogo Completo</a>
        </div>
        <div class="row g-4" id="home-featured-products">
          <div class="text-center py-5">
            <div class="spinner-border text-primary" role="status">
              <span class="visually-hidden">Cargando...</span>
            </div>
          </div>
        </div>
      </section>
    </div>
  `;

  // Fetch featured products
  try {
    const data = await API.getProducts({ sort: 'newest' });
    const productList = document.getElementById('home-featured-products');
    if (productList && data.success) {
      const featured = data.products.slice(0, 4);
      if (featured.length === 0) {
        productList.innerHTML = `<div class="col-12 text-center text-muted">No hay productos disponibles por el momento.</div>`;
        return;
      }

      productList.innerHTML = featured.map(prod => {
        const outOfStock = prod.stock === 0;
        const lowStock = prod.stock > 0 && prod.stock <= 3;
        let stockBadge = '';
        if (outOfStock) {
          stockBadge = `<span class="badge bg-danger position-absolute" style="top: 15px; right: 15px; z-index: 10;">Agotado</span>`;
        } else if (lowStock) {
          stockBadge = `<span class="badge bg-warning text-dark position-absolute" style="top: 15px; right: 15px; z-index: 10;">¡Últimas ${prod.stock}!</span>`;
        }

        return `
          <div class="col-lg-3 col-md-6 col-sm-6">
            <div class="card pet-card position-relative h-100">
              ${stockBadge}
              <div class="card-img-wrapper">
                <img src="${prod.imageUrl || 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?w=500&auto=format&fit=crop'}" 
                     class="card-img-top" alt="${prod.name}">
                <span class="badge-category">${prod.category}</span>
              </div>
              <div class="card-body d-flex flex-column p-4">
                <h6 class="card-title fw-bold text-dark mb-2">${prod.name}</h6>
                <p class="card-text text-muted small flex-grow-1 text-truncate-2" style="display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;">
                  ${prod.description}
                </p>
                <div class="d-flex justify-content-between align-items-center mt-3 pt-3 border-top">
                  <span class="fs-5 fw-bold text-primary">$${prod.price.toFixed(2)}</span>
                  <a href="#/product/${prod._id}" class="btn btn-sm btn-outline-primary rounded-circle" style="width: 36px; height: 36px; display: flex; align-items: center; justify-content: center;" title="Ver Detalle">
                    <i class="fa-solid fa-eye"></i>
                  </a>
                </div>
                <button class="btn btn-primary w-100 mt-3" 
                        onclick="app.addToCart('${prod._id}', 1)"
                        ${outOfStock ? 'disabled' : ''}>
                  <i class="fa-solid fa-cart-plus me-2"></i>${outOfStock ? 'Agotado' : 'Agregar al carrito'}
                </button>
              </div>
            </div>
          </div>
        `;
      }).join('');
    }
  } catch (err) {
    const productList = document.getElementById('home-featured-products');
    if (productList) {
      productList.innerHTML = `<div class="col-12 text-center text-danger">Error cargando productos: ${err.message}</div>`;
    }
  }
}

// ------------------------------------------
// 2. CATALOG VIEW RENDERER
// ------------------------------------------
async function renderCatalog(queryParams = {}) {
  showLoader();
  try {
    const categoriesData = await API.getCategories();
    hideLoader();

    const selectedCategory = queryParams.category || '';
    const searchVal = queryParams.search || '';
    const minPrice = queryParams.minPrice || '';
    const maxPrice = queryParams.maxPrice || '';
    const sortBy = queryParams.sort || 'newest';

    const categories = categoriesData.categories || [];

    // Create Page Template
    appContainer.innerHTML = `
      <div class="view-container container py-5">
        <div class="row g-4">
          <!-- Filters Sidebar -->
          <div class="col-lg-3">
            <div class="card border border-light rounded-4 shadow-sm p-4 bg-white sticky-lg-top" style="top: 100px; z-index: 10;">
              <h5 class="fw-bold mb-4"><i class="fa-solid fa-filter text-primary me-2"></i>Filtros</h5>
              
              <!-- Search Bar -->
              <div class="mb-4">
                <label class="form-label fw-semibold text-dark">Buscar Producto</label>
                <div class="input-group">
                  <span class="input-group-text bg-light border-0 text-muted"><i class="fa-solid fa-magnifying-glass"></i></span>
                  <input type="text" class="form-control bg-light border-0" id="filter-search" placeholder="Escribe para buscar..." value="${searchVal}">
                </div>
              </div>

              <!-- Categories pills / list -->
              <div class="mb-4">
                <label class="form-label fw-semibold text-dark mb-2">Categorías</label>
                <div class="d-flex flex-column gap-2" id="filter-category-container">
                  <button class="btn btn-sm text-start py-2 px-3 border-0 rounded-3 filter-cat-btn ${selectedCategory === '' ? 'btn-primary' : 'btn-light text-dark'}" data-category="">
                    <i class="fa-solid fa-paw me-2"></i>Todas las mascotas
                  </button>
                  ${categories.map(cat => `
                    <button class="btn btn-sm text-start py-2 px-3 border-0 rounded-3 filter-cat-btn ${selectedCategory === cat.name ? 'btn-primary' : 'btn-light text-dark'}" data-category="${cat.name}">
                      <i class="fa-solid fa-chevron-right fs-8 me-2"></i>${cat.name}
                    </button>
                  `).join('')}
                </div>
              </div>

              <!-- Price bounds -->
              <div class="mb-4">
                <label class="form-label fw-semibold text-dark">Rango de Precios</label>
                <div class="d-flex align-items-center gap-2">
                  <input type="number" class="form-control bg-light border-0" id="filter-price-min" placeholder="Min" min="0" value="${minPrice}">
                  <span class="text-muted">-</span>
                  <input type="number" class="form-control bg-light border-0" id="filter-price-max" placeholder="Max" min="0" value="${maxPrice}">
                </div>
              </div>

              <!-- Action buttons -->
              <div class="d-flex gap-2">
                <button class="btn btn-primary w-100 rounded-3" id="btn-apply-filters">
                  Filtrar
                </button>
                <button class="btn btn-light w-100 rounded-3 text-dark border" id="btn-clear-filters">
                  Limpiar
                </button>
              </div>
            </div>
          </div>

          <!-- Product Catalog Content -->
          <div class="col-lg-9">
            <div class="d-flex flex-column flex-sm-row justify-content-between align-items-sm-center mb-4 gap-3">
              <div>
                <h2 class="fw-bold mb-1">Catálogo de Productos</h2>
                <p class="text-muted mb-0" id="product-count-label">Cargando catálogo...</p>
              </div>

              <!-- Sorting dropdown -->
              <div class="d-flex align-items-center gap-2">
                <label class="text-muted small text-nowrap mb-0"><i class="fa-solid fa-arrow-down-wide-short me-1"></i>Ordenar por:</label>
                <select class="form-select bg-white border border-light rounded-pill" id="filter-sort" style="width: 180px;">
                  <option value="newest" ${sortBy === 'newest' ? 'selected' : ''}>Más recientes</option>
                  <option value="price-asc" ${sortBy === 'price-asc' ? 'selected' : ''}>Menor precio</option>
                  <option value="price-desc" ${sortBy === 'price-desc' ? 'selected' : ''}>Mayor precio</option>
                </select>
              </div>
            </div>

            <!-- Products Grid -->
            <div class="row g-4" id="catalog-products-grid">
              <div class="text-center py-5">
                <div class="spinner-border text-primary" role="status">
                  <span class="visually-hidden">Cargando...</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;

    // Fetch and render filtered products
    async function loadFilteredProducts() {
      const search = document.getElementById('filter-search').value;
      const min = document.getElementById('filter-price-min').value;
      const max = document.getElementById('filter-price-max').value;
      const sort = document.getElementById('filter-sort').value;
      const categoryBtn = document.querySelector('.filter-cat-btn.btn-primary');
      const cat = categoryBtn ? categoryBtn.dataset.category : '';

      const grid = document.getElementById('catalog-products-grid');
      const countLabel = document.getElementById('product-count-label');
      
      grid.innerHTML = `
        <div class="text-center w-100 py-5">
          <div class="spinner-border text-primary" role="status">
            <span class="visually-hidden">Cargando...</span>
          </div>
        </div>
      `;

      try {
        const prodData = await API.getProducts({
          category: cat,
          search: search,
          minPrice: min,
          maxPrice: max,
          sort: sort
        });

        if (prodData.success) {
          const products = prodData.products;
          countLabel.textContent = `${products.length} productos encontrados`;

          if (products.length === 0) {
            grid.innerHTML = `
              <div class="col-12 text-center py-5">
                <i class="fa-solid fa-face-frown text-muted display-1 mb-3"></i>
                <h4 class="fw-bold text-dark">No se encontraron productos</h4>
                <p class="text-muted">Prueba eliminando algunos filtros o cambiando los términos de búsqueda.</p>
              </div>
            `;
            return;
          }

          grid.innerHTML = products.map(prod => {
            const outOfStock = prod.stock === 0;
            const lowStock = prod.stock > 0 && prod.stock <= 3;
            let stockBadge = '';
            if (outOfStock) {
              stockBadge = `<span class="badge bg-danger position-absolute" style="top: 15px; right: 15px; z-index: 10;">Agotado</span>`;
            } else if (lowStock) {
              stockBadge = `<span class="badge bg-warning text-dark position-absolute" style="top: 15px; right: 15px; z-index: 10;">¡Últimas ${prod.stock}!</span>`;
            }

            return `
              <div class="col-md-4 col-sm-6">
                <div class="card pet-card position-relative h-100">
                  ${stockBadge}
                  <div class="card-img-wrapper">
                    <img src="${prod.imageUrl || 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?w=500&auto=format&fit=crop'}" 
                         class="card-img-top" alt="${prod.name}">
                    <span class="badge-category">${prod.category}</span>
                  </div>
                  <div class="card-body d-flex flex-column p-4">
                    <h6 class="card-title fw-bold text-dark mb-2 text-truncate" title="${prod.name}">${prod.name}</h6>
                    <p class="card-text text-muted small flex-grow-1 text-truncate-2" style="display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;">
                      ${prod.description}
                    </p>
                    <div class="d-flex justify-content-between align-items-center mt-3 pt-3 border-top">
                      <span class="fs-5 fw-bold text-primary">$${prod.price.toFixed(2)}</span>
                      <a href="#/product/${prod._id}" class="btn btn-sm btn-outline-primary rounded-circle" style="width: 36px; height: 36px; display: flex; align-items: center; justify-content: center;" title="Ver Detalle">
                        <i class="fa-solid fa-eye"></i>
                      </a>
                    </div>
                    <button class="btn btn-primary w-100 mt-3" 
                            onclick="app.addToCart('${prod._id}', 1)"
                            ${outOfStock ? 'disabled' : ''}>
                      <i class="fa-solid fa-cart-plus me-2"></i>${outOfStock ? 'Agotado' : 'Agregar al carrito'}
                    </button>
                  </div>
                </div>
              </div>
            `;
          }).join('');
        }
      } catch (err) {
        grid.innerHTML = `<div class="col-12 text-center text-danger">Error cargando productos: ${err.message}</div>`;
      }
    }

    // Set up filter handlers
    document.querySelectorAll('.filter-cat-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        document.querySelectorAll('.filter-cat-btn').forEach(b => {
          b.classList.remove('btn-primary');
          b.classList.add('btn-light', 'text-dark');
        });
        btn.classList.remove('btn-light', 'text-dark');
        btn.classList.add('btn-primary');
        loadFilteredProducts();
      });
    });

    document.getElementById('btn-apply-filters').addEventListener('click', loadFilteredProducts);
    document.getElementById('filter-sort').addEventListener('change', loadFilteredProducts);

    document.getElementById('btn-clear-filters').addEventListener('click', () => {
      document.getElementById('filter-search').value = '';
      document.getElementById('filter-price-min').value = '';
      document.getElementById('filter-price-max').value = '';
      document.querySelectorAll('.filter-cat-btn').forEach(b => {
        b.classList.remove('btn-primary');
        b.classList.add('btn-light', 'text-dark');
      });
      const allBtn = document.querySelector('.filter-cat-btn[data-category=""]');
      if (allBtn) {
        allBtn.classList.remove('btn-light', 'text-dark');
        allBtn.classList.add('btn-primary');
      }
      loadFilteredProducts();
    });

    // Run initial load
    loadFilteredProducts();

  } catch (err) {
    hideLoader();
    appContainer.innerHTML = `<div class="container py-5 text-center text-danger">Error cargando catálogo: ${err.message}</div>`;
  }
}

// ------------------------------------------
// 3. PRODUCT DETAIL VIEW RENDERER
// ------------------------------------------
async function renderProductDetail(id) {
  showLoader();
  try {
    const data = await API.getProduct(id);
    hideLoader();

    if (!data.success || !data.product) {
      appContainer.innerHTML = `
        <div class="container py-5 text-center">
          <h3>Producto no encontrado.</h3>
          <a href="#/catalog" class="btn btn-primary mt-3">Volver al Catálogo</a>
        </div>
      `;
      return;
    }

    const prod = data.product;
    const outOfStock = prod.stock === 0;
    const lowStock = prod.stock > 0 && prod.stock <= 3;

    appContainer.innerHTML = `
      <div class="view-container container py-5">
        <nav aria-label="breadcrumb" class="mb-4">
          <ol class="breadcrumb">
            <li class="breadcrumb-item"><a href="#/">Inicio</a></li>
            <li class="breadcrumb-item"><a href="#/catalog">Catálogo</a></li>
            <li class="breadcrumb-item active" aria-current="page">${prod.name}</li>
          </ol>
        </nav>

        <div class="row g-5 bg-white rounded-4 shadow-sm border border-light p-4 p-md-5">
          <!-- Left side: Image -->
          <div class="col-md-6 text-center">
            <img src="${prod.imageUrl || 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?w=600&auto=format&fit=crop'}" 
                 class="img-fluid rounded-4 shadow-sm border" 
                 alt="${prod.name}"
                 style="max-height: 450px; object-fit: cover; width: 100%;">
          </div>

          <!-- Right side: Info -->
          <div class="col-md-6 d-flex flex-column">
            <div>
              <span class="badge bg-success-subtle text-primary px-3 py-2 rounded-pill fw-semibold mb-3">
                ${prod.category}
              </span>
              <h1 class="fw-bold mb-2">${prod.name}</h1>
              <div class="d-flex align-items-center gap-3 mb-4">
                <span class="h2 text-primary fw-bold mb-0">$${prod.price.toFixed(2)}</span>
                
                ${outOfStock ? 
                  `<span class="badge bg-danger px-3 py-2 rounded-pill"><i class="fa-solid fa-times-circle me-1"></i>Agotado</span>` : 
                  (lowStock ? 
                    `<span class="badge bg-warning text-dark px-3 py-2 rounded-pill"><i class="fa-solid fa-exclamation-triangle me-1"></i>Pocas unidades (${prod.stock})</span>` :
                    `<span class="badge bg-success px-3 py-2 rounded-pill"><i class="fa-solid fa-circle-check me-1"></i>En Stock (${prod.stock})</span>`
                  )
                }
              </div>

              <hr class="my-4 border-light">
              <h5 class="fw-bold mb-2">Descripción</h5>
              <p class="text-muted leading-relaxed mb-4">${prod.description}</p>
            </div>

            <!-- Cart Addition controls -->
            <div class="mt-auto pt-4 border-top">
              ${outOfStock ? `
                <div class="alert alert-danger rounded-3" role="alert">
                  <i class="fa-solid fa-circle-info me-2"></i>Este producto no se encuentra disponible temporalmente. Déjanos tu correo para avisarte al reponer stock.
                </div>
              ` : `
                <div class="d-flex flex-column flex-sm-row gap-3 align-items-sm-center">
                  <div class="d-flex align-items-center border border-light rounded-3" style="width: fit-content; background-color: var(--bg-main);">
                    <button class="btn px-3 py-2 text-dark border-0" id="btn-qty-minus"><i class="fa-solid fa-minus"></i></button>
                    <input type="number" class="form-control text-center border-0 fw-semibold bg-transparent" id="qty-selector-input" value="1" min="1" max="${prod.stock}" style="width: 60px;">
                    <button class="btn px-3 py-2 text-dark border-0" id="btn-qty-plus"><i class="fa-solid fa-plus"></i></button>
                  </div>
                  
                  <button class="btn btn-primary btn-lg flex-grow-1" id="btn-detail-add-to-cart">
                    <i class="fa-solid fa-cart-plus me-2"></i>Agregar al carrito
                  </button>
                </div>
              `}
            </div>
          </div>
        </div>
      </div>
    `;

    // Handle Quantity selectors
    if (!outOfStock) {
      const input = document.getElementById('qty-selector-input');
      const minus = document.getElementById('btn-qty-minus');
      const plus = document.getElementById('btn-qty-plus');
      const addToCartBtn = document.getElementById('btn-detail-add-to-cart');

      minus.addEventListener('click', () => {
        let val = Number(input.value);
        if (val > 1) {
          input.value = val - 1;
        }
      });

      plus.addEventListener('click', () => {
        let val = Number(input.value);
        if (val < prod.stock) {
          input.value = val + 1;
        }
      });

      addToCartBtn.addEventListener('click', () => {
        const qty = Number(input.value);
        if (qty > 0 && qty <= prod.stock) {
          addToCart(prod, qty);
        } else {
          showToast('Cantidad inválida.', 'error');
        }
      });
    }

  } catch (err) {
    hideLoader();
    appContainer.innerHTML = `<div class="container py-5 text-center text-danger">Error: ${err.message}</div>`;
  }
}

// ------------------------------------------
// 4. CART & CHECKOUT VIEW RENDERER
// ------------------------------------------
function renderCart() {
  const total = getCartTotal();
  const count = getCartCount();

  if (cart.length === 0) {
    appContainer.innerHTML = `
      <div class="view-container container py-5 text-center">
        <div class="card p-5 border border-light rounded-4 shadow-sm bg-white" style="max-width: 600px; margin: 0 auto;">
          <i class="fa-solid fa-basket-shopping text-muted display-1 mb-4"></i>
          <h2 class="fw-bold mb-2">Tu Carrito está vacío</h2>
          <p class="text-muted mb-4">
            Parece que aún no has agregado productos a tu carrito. ¡Explora nuestro catálogo para encontrar lo mejor para tu mascota!
          </p>
          <a href="#/catalog" class="btn btn-primary btn-lg rounded-3">
            <i class="fa-solid fa-store me-2"></i>Ver Catálogo
          </a>
        </div>
      </div>
    `;
    return;
  }

  // Shipping Fee: Free above 50, otherwise 5.00
  const shippingFee = total >= 50 ? 0 : 5.00;
  const grandTotal = total + shippingFee;

  appContainer.innerHTML = `
    <div class="view-container container py-5">
      <h2 class="fw-bold mb-4"><i class="fa-solid fa-cart-shopping text-primary me-2"></i>Mi Carrito</h2>
      
      <div class="row g-4">
        <!-- Cart Items List (Left Column) -->
        <div class="col-lg-8">
          <div class="card border border-light rounded-4 shadow-sm p-4 bg-white">
            <div class="table-responsive">
              <table class="table align-middle table-borderless">
                <thead>
                  <tr class="border-bottom border-light text-muted small">
                    <th>Producto</th>
                    <th class="text-center">Precio</th>
                    <th class="text-center">Cantidad</th>
                    <th class="text-end">Subtotal</th>
                    <th class="text-center">Eliminar</th>
                  </tr>
                </thead>
                <tbody>
                  ${cart.map(item => `
                    <tr class="border-bottom border-light">
                      <td>
                        <div class="d-flex align-items-center gap-3 py-2">
                          <img src="${item.imageUrl || 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?w=100&auto=format&fit=crop'}" 
                               class="rounded-3 border" 
                               alt="${item.name}" 
                               style="width: 60px; height: 60px; object-fit: cover;">
                          <div>
                            <h6 class="fw-bold text-dark mb-0">${item.name}</h6>
                            <span class="text-muted small">ID: ${item.productId.substring(0,8)}</span>
                          </div>
                        </div>
                      </td>
                      <td class="text-center fw-medium">$${item.price.toFixed(2)}</td>
                      <td class="text-center">
                        <div class="d-flex align-items-center justify-content-center border border-light rounded-pill mx-auto" style="width: fit-content; max-width: 120px; background-color: var(--bg-main);">
                          <button class="btn btn-sm px-2 text-dark border-0" onclick="app.updateCartQty('${item.productId}', ${item.quantity - 1})"><i class="fa-solid fa-minus fs-8"></i></button>
                          <span class="mx-2 fw-semibold">${item.quantity}</span>
                          <button class="btn btn-sm px-2 text-dark border-0" onclick="app.updateCartQty('${item.productId}', ${item.quantity + 1})"><i class="fa-solid fa-plus fs-8"></i></button>
                        </div>
                      </td>
                      <td class="text-end fw-bold text-dark">$${(item.price * item.quantity).toFixed(2)}</td>
                      <td class="text-center">
                        <button class="btn btn-link text-danger p-1" onclick="app.removeFromCart('${item.productId}')">
                          <i class="fa-solid fa-trash"></i>
                        </button>
                      </td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <!-- Summary & Checkout (Right Column) -->
        <div class="col-lg-4">
          <!-- Summary card -->
          <div class="card border border-light rounded-4 shadow-sm p-4 bg-white mb-4">
            <h5 class="fw-bold mb-4">Resumen del Pedido</h5>
            <div class="d-flex justify-content-between mb-2">
              <span class="text-muted">Subtotal (${count} items)</span>
              <span class="fw-medium">$${total.toFixed(2)}</span>
            </div>
            <div class="d-flex justify-content-between mb-3">
              <span class="text-muted">Envío</span>
              <span class="fw-medium text-success">${shippingFee === 0 ? 'Gratis' : `$${shippingFee.toFixed(2)}`}</span>
            </div>
            ${shippingFee > 0 ? `
              <div class="alert alert-warning py-2 rounded-3 small mb-3">
                <i class="fa-solid fa-circle-info me-1"></i>Agrega <strong>$${(50 - total).toFixed(2)}</strong> más para envío gratuito.
              </div>
            ` : ''}
            <hr class="border-light my-3">
            <div class="d-flex justify-content-between mb-4">
              <span class="fw-bold text-dark fs-5">Total</span>
              <span class="fw-bold text-primary fs-5">$${grandTotal.toFixed(2)}</span>
            </div>

            <!-- Checkout actions -->
            <div id="cart-checkout-container">
              ${currentUser ? `
                <button class="btn btn-primary w-100 btn-lg rounded-3" id="btn-cart-proceed">
                  Proceder al Pago <i class="fa-solid fa-arrow-right ms-2"></i>
                </button>
              ` : `
                <div class="alert alert-info rounded-3 text-center mb-3">
                  Debes iniciar sesión para finalizar tu pedido.
                </div>
                <a href="#/login" class="btn btn-primary w-100 rounded-3">
                  Iniciar Sesión
                </a>
              `}
            </div>
          </div>

          <!-- Checkout Address / Details Form (Hidden until Proceed is clicked) -->
          <div class="card border border-light rounded-4 shadow-sm p-4 bg-white d-none" id="cart-checkout-form-card">
            <h5 class="fw-bold mb-4">Datos de Entrega y Pago</h5>
            <form id="checkout-form">
              <div class="mb-3">
                <label class="form-label fw-semibold small text-dark">Dirección de Envío</label>
                <textarea class="form-control bg-light border-0" id="checkout-address" rows="3" required placeholder="Calle, Número, Depto, Ciudad...">${currentUser ? (currentUser.address || '') : ''}</textarea>
              </div>

              <div class="mb-3">
                <label class="form-label fw-semibold small text-dark">Teléfono de Contacto</label>
                <input type="text" class="form-control bg-light border-0" id="checkout-phone" value="${currentUser ? (currentUser.phone || '') : ''}" required placeholder="Ej. +52 555-1234">
              </div>

              <div class="mb-4">
                <label class="form-label fw-semibold small text-dark">Método de Pago</label>
                <select class="form-select bg-light border-0" id="checkout-payment" required>
                  <option value="Tarjeta de Crédito">Tarjeta de Crédito / Débito</option>
                  <option value="Transferencia Bancaria">Transferencia Bancaria SPEI</option>
                  <option value="Contra Entrega">Pago Contra Entrega en Efectivo</option>
                </select>
              </div>

              <button type="submit" class="btn btn-secondary w-100 btn-lg rounded-3">
                Confirmar y Pagar
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  `;

  // Attach Checkout proceed actions
  if (currentUser) {
    const proceedBtn = document.getElementById('btn-cart-proceed');
    const formCard = document.getElementById('cart-checkout-form-card');
    const checkoutForm = document.getElementById('checkout-form');

    proceedBtn.addEventListener('click', () => {
      formCard.classList.remove('d-none');
      proceedBtn.disabled = true;
      // Scroll to checkout form card smoothly
      formCard.scrollIntoView({ behavior: 'smooth' });
    });

    checkoutForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      const items = cart.map(item => ({
        productId: item.productId,
        quantity: item.quantity
      }));

      const shippingAddress = document.getElementById('checkout-address').value;
      const phone = document.getElementById('checkout-phone').value;
      const paymentMethod = document.getElementById('checkout-payment').value;

      showLoader();
      try {
        const res = await API.createOrder({
          items,
          shippingAddress,
          phone,
          paymentMethod
        });
        hideLoader();

        if (res.success) {
          clearCart();
          showToast(res.message, 'success');
          // Navigate to user profile to see orders
          window.location.hash = '#/profile';
        }
      } catch (err) {
        hideLoader();
        showToast(err.message, 'error');
      }
    });
  }
}

// ------------------------------------------
// 5. LOGIN / REGISTER VIEW RENDERER
// ------------------------------------------
function renderLogin() {
  appContainer.innerHTML = `
    <div class="view-container container py-5">
      <div class="row justify-content-center">
        <div class="col-md-6 col-lg-5">
          <div class="card border border-light rounded-4 shadow-sm bg-white overflow-hidden">
            <!-- Tabs -->
            <div class="d-flex text-center border-bottom border-light">
              <button class="btn w-50 py-3 rounded-0 fw-bold auth-tab-btn active" id="tab-btn-login" style="border-right: 1px solid var(--primary-light);">
                Iniciar Sesión
              </button>
              <button class="btn w-50 py-3 rounded-0 fw-bold auth-tab-btn" id="tab-btn-register">
                Registrarse
              </button>
            </div>

            <div class="p-4 p-md-5">
              <!-- LOGIN FORM -->
              <div id="auth-login-view">
                <h3 class="fw-bold text-center mb-4">Bienvenido de vuelta</h3>
                <form id="login-form">
                  <div class="mb-3">
                    <label class="form-label fw-semibold small text-dark">Correo Electrónico</label>
                    <input type="email" class="form-control bg-light border-0" id="login-email" required placeholder="correo@ejemplo.com">
                  </div>
                  <div class="mb-3">
                    <label class="form-label fw-semibold small text-dark">Contraseña</label>
                    <input type="password" class="form-control bg-light border-0" id="login-password" required placeholder="••••••••">
                  </div>
                  <div class="text-end mb-4">
                    <button type="button" class="btn btn-link text-muted small p-0 text-decoration-none" id="btn-toggle-recover">¿Olvidaste tu contraseña?</button>
                  </div>
                  <button type="submit" class="btn btn-primary w-100 btn-lg rounded-3">
                    Ingresar
                  </button>
                </form>
              </div>

              <!-- REGISTER FORM -->
              <div id="auth-register-view" class="d-none">
                <h3 class="fw-bold text-center mb-4">Crea una cuenta</h3>
                <form id="register-form">
                  <div class="mb-3">
                    <label class="form-label fw-semibold small text-dark">Nombre Completo</label>
                    <input type="text" class="form-control bg-light border-0" id="reg-name" required placeholder="Juan Pérez">
                  </div>
                  <div class="mb-3">
                    <label class="form-label fw-semibold small text-dark">Correo Electrónico</label>
                    <input type="email" class="form-control bg-light border-0" id="reg-email" required placeholder="correo@ejemplo.com">
                  </div>
                  <div class="mb-3">
                    <label class="form-label fw-semibold small text-dark">Contraseña</label>
                    <input type="password" class="form-control bg-light border-0" id="reg-password" required placeholder="Mínimo 6 caracteres">
                  </div>
                  <div class="mb-3">
                    <label class="form-label fw-semibold small text-dark">Confirmar Contraseña</label>
                    <input type="password" class="form-control bg-light border-0" id="reg-password-confirm" required placeholder="••••••••">
                  </div>
                  <div class="mb-3">
                    <label class="form-label fw-semibold small text-dark">Teléfono</label>
                    <input type="text" class="form-control bg-light border-0" id="reg-phone" placeholder="Ej. 555-1234">
                  </div>
                  <div class="mb-4">
                    <label class="form-label fw-semibold small text-dark">Dirección Inicial de Envío</label>
                    <input type="text" class="form-control bg-light border-0" id="reg-address" placeholder="Av. Principal 123, Ciudad">
                  </div>
                  <button type="submit" class="btn btn-primary w-100 btn-lg rounded-3">
                    Registrarse
                  </button>
                </form>
              </div>

              <!-- PASSWORD RECOVERY FORM -->
              <div id="auth-recover-view" class="d-none">
                <h3 class="fw-bold text-center mb-4">Recuperar Contraseña</h3>
                <p class="text-muted small text-center mb-4">Ingresa tu correo registrado y te enviaremos instrucciones de recuperación.</p>
                <form id="recover-form">
                  <div class="mb-4">
                    <label class="form-label fw-semibold small text-dark">Correo Electrónico</label>
                    <input type="email" class="form-control bg-light border-0" id="recover-email" required placeholder="correo@ejemplo.com">
                  </div>
                  <button type="submit" class="btn btn-primary w-100 btn-lg rounded-3 mb-3">
                    Enviar Instrucciones
                  </button>
                  <button type="button" class="btn btn-light w-100 rounded-3 text-dark border" id="btn-recover-back">
                    Volver al Inicio de Sesión
                  </button>
                </form>
              </div>

            </div>
          </div>
        </div>
      </div>
    </div>
  `;

  // UI Tabs toggle
  const tabLogin = document.getElementById('tab-btn-login');
  const tabRegister = document.getElementById('tab-btn-register');
  const loginView = document.getElementById('auth-login-view');
  const registerView = document.getElementById('auth-register-view');
  const recoverView = document.getElementById('auth-recover-view');

  tabLogin.addEventListener('click', () => {
    tabLogin.classList.add('active');
    tabRegister.classList.remove('active');
    loginView.classList.remove('d-none');
    registerView.classList.add('d-none');
    recoverView.classList.add('d-none');
  });

  tabRegister.addEventListener('click', () => {
    tabRegister.classList.add('active');
    tabLogin.classList.remove('active');
    registerView.classList.remove('d-none');
    loginView.classList.add('d-none');
    recoverView.classList.add('d-none');
  });

  document.getElementById('btn-toggle-recover').addEventListener('click', () => {
    recoverView.classList.remove('d-none');
    loginView.classList.add('d-none');
    registerView.classList.add('d-none');
  });

  document.getElementById('btn-recover-back').addEventListener('click', () => {
    loginView.classList.remove('d-none');
    recoverView.classList.add('d-none');
    registerView.classList.add('d-none');
  });

  // Handle forms
  document.getElementById('login-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;

    showLoader();
    try {
      const res = await API.login(email, password);
      hideLoader();
      if (res.success) {
        localStorage.setItem('petshop_token', res.token);
        localStorage.setItem('petshop_user', JSON.stringify(res.user));
        showToast(`¡Bienvenido de vuelta, ${res.user.name}!`);
        
        window.dispatchEvent(new Event('authChange'));
        
        // Redirect to homepage or profile
        if (res.user.role === 'Administrador') {
          window.location.hash = '#/admin';
        } else {
          window.location.hash = '#/';
        }
      }
    } catch (err) {
      hideLoader();
      showToast(err.message, 'error');
    }
  });

  document.getElementById('register-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = document.getElementById('reg-name').value;
    const email = document.getElementById('reg-email').value;
    const password = document.getElementById('reg-password').value;
    const confirmPass = document.getElementById('reg-password-confirm').value;
    const phone = document.getElementById('reg-phone').value;
    const address = document.getElementById('reg-address').value;

    if (password !== confirmPass) {
      showToast('Las contraseñas no coinciden.', 'error');
      return;
    }

    showLoader();
    try {
      const res = await API.register({ name, email, password, phone, address });
      hideLoader();
      if (res.success) {
        showToast(res.message);
        // Automatically login
        const loginRes = await API.login(email, password);
        if (loginRes.success) {
          localStorage.setItem('petshop_token', loginRes.token);
          localStorage.setItem('petshop_user', JSON.stringify(loginRes.user));
          window.dispatchEvent(new Event('authChange'));
          window.location.hash = '#/';
        }
      }
    } catch (err) {
      hideLoader();
      showToast(err.message, 'error');
    }
  });

  document.getElementById('recover-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('recover-email').value;
    
    showLoader();
    try {
      const res = await API.recover(email);
      hideLoader();
      if (res.success) {
        showToast(res.message, 'success');
        loginView.classList.remove('d-none');
        recoverView.classList.add('d-none');
      }
    } catch (err) {
      hideLoader();
      showToast(err.message, 'error');
    }
  });
}

// ------------------------------------------
// 6. PROFILE / MY ORDERS VIEW RENDERER
// ------------------------------------------
async function renderProfile() {
  if (!currentUser) {
    window.location.hash = '#/login';
    return;
  }

  showLoader();
  try {
    const ordersData = await API.getMyOrders();
    hideLoader();

    const orders = ordersData.orders || [];

    appContainer.innerHTML = `
      <div class="view-container container py-5">
        <div class="row g-4">
          <!-- Profile Edit Column (Left) -->
          <div class="col-lg-4">
            <div class="card border border-light rounded-4 shadow-sm p-4 bg-white mb-4">
              <h5 class="fw-bold mb-4">Mis Datos de Perfil</h5>
              <div class="text-center mb-4">
                <img src="${currentUser.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop'}" 
                     alt="Avatar" class="rounded-circle border border-3 border-light shadow-sm" style="width: 100px; height: 100px; object-fit: cover;" id="profile-avatar-preview">
                <div class="mt-2 text-muted small">${currentUser.role}</div>
              </div>

              <form id="profile-update-form">
                <div class="mb-3">
                  <label class="form-label fw-semibold small text-dark">Nombre Completo</label>
                  <input type="text" class="form-control bg-light border-0" id="prof-name" value="${currentUser.name}" required>
                </div>
                <div class="mb-3">
                  <label class="form-label fw-semibold small text-dark">Correo Electrónico (No modificable)</label>
                  <input type="email" class="form-control bg-light border-0 text-muted" value="${currentUser.email}" disabled>
                </div>
                <div class="mb-3">
                  <label class="form-label fw-semibold small text-dark">Teléfono</label>
                  <input type="text" class="form-control bg-light border-0" id="prof-phone" value="${currentUser.phone || ''}">
                </div>
                <div class="mb-3">
                  <label class="form-label fw-semibold small text-dark">Dirección de Envío</label>
                  <textarea class="form-control bg-light border-0" id="prof-address" rows="3">${currentUser.address || ''}</textarea>
                </div>
                <div class="mb-4">
                  <label class="form-label fw-semibold small text-dark">URL del Avatar / Foto de Perfil</label>
                  <input type="text" class="form-control bg-light border-0" id="prof-avatar" value="${currentUser.avatar || ''}" placeholder="URL de imagen externa">
                </div>
                
                <button type="submit" class="btn btn-primary w-100 rounded-3">
                  Guardar Cambios
                </button>
              </form>
            </div>
          </div>

          <!-- Orders History Column (Right) -->
          <div class="col-lg-8">
            <div class="card border border-light rounded-4 shadow-sm p-4 bg-white">
              <h5 class="fw-bold mb-4">Mis Pedidos Realizados</h5>
              
              ${orders.length === 0 ? `
                <div class="text-center py-5">
                  <i class="fa-solid fa-receipt text-muted display-3 mb-3"></i>
                  <h6 class="fw-bold text-muted">Aún no tienes pedidos registrados</h6>
                  <a href="#/catalog" class="btn btn-sm btn-primary mt-2">Explorar Productos</a>
                </div>
              ` : `
                <div class="table-responsive">
                  <table class="table align-middle table-hover">
                    <thead>
                      <tr class="text-muted small">
                        <th>Pedido ID</th>
                        <th>Fecha</th>
                        <th>Estado</th>
                        <th>Total</th>
                        <th class="text-center">Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      ${orders.map(order => {
                        let badgeColor = 'bg-warning text-dark';
                        if (order.status === 'Enviado') badgeColor = 'bg-info text-white';
                        if (order.status === 'Entregado') badgeColor = 'bg-success text-white';
                        if (order.status === 'Cancelado') badgeColor = 'bg-danger text-white';

                        const formattedDate = new Date(order.createdAt).toLocaleDateString('es-ES', {
                          year: 'numeric', month: 'long', day: 'numeric'
                        });

                        return `
                          <tr style="cursor: pointer;" onclick="app.toggleOrderDetails('${order._id}')">
                            <td class="fw-bold text-dark">${order._id.substring(0, 8)}...</td>
                            <td class="text-muted">${formattedDate}</td>
                            <td><span class="badge ${badgeColor}">${order.status}</span></td>
                            <td class="fw-bold">$${order.total.toFixed(2)}</td>
                            <td class="text-center">
                              <button class="btn btn-sm btn-light border py-1 px-3 rounded-pill text-nowrap">
                                <i class="fa-solid fa-eye me-1"></i>Ver Detalle
                              </button>
                            </td>
                          </tr>

                          <!-- Detailed Order Row (Collapsible) -->
                          <tr class="d-none" id="order-details-${order._id}" style="background-color: var(--primary-light);">
                            <td colspan="5" class="p-4 border-0">
                              <div class="card border border-light rounded-3 p-4 shadow-sm bg-white">
                                <h6 class="fw-bold mb-3 text-primary"><i class="fa-solid fa-circle-info me-2"></i>Detalle de Pedido #${order._id}</h6>
                                
                                <div class="row g-4">
                                  <div class="col-md-6">
                                    <h6 class="fw-bold small text-dark mb-2">Artículos:</h6>
                                    <div class="list-group list-group-flush mb-3">
                                      ${order.items.map(item => `
                                        <div class="list-group-item d-flex justify-content-between align-items-center py-2 px-0 border-light bg-transparent">
                                          <div class="d-flex align-items-center gap-2">
                                            <img src="${item.imageUrl || 'https://via.placeholder.com/50'}" class="rounded border" style="width: 40px; height: 40px; object-fit: cover;">
                                            <div>
                                              <span class="fw-medium text-dark d-block small">${item.name}</span>
                                              <span class="text-muted small">$${item.price.toFixed(2)} x ${item.quantity}</span>
                                            </div>
                                          </div>
                                          <span class="fw-bold text-dark small">$${(item.price * item.quantity).toFixed(2)}</span>
                                        </div>
                                      `).join('')}
                                    </div>
                                    <div class="d-flex justify-content-between pt-2 border-top">
                                      <span class="fw-bold text-dark">Total pagado:</span>
                                      <span class="fw-bold text-primary fs-5">$${order.total.toFixed(2)}</span>
                                    </div>
                                  </div>

                                  <div class="col-md-6">
                                    <h6 class="fw-bold small text-dark mb-2">Datos de Entrega:</h6>
                                    <p class="mb-1 small"><strong>Dirección:</strong> ${order.shippingAddress}</p>
                                    <p class="mb-1 small"><strong>Teléfono:</strong> ${order.phone}</p>
                                    <p class="mb-3 small"><strong>Método de pago:</strong> ${order.paymentMethod}</p>

                                    <!-- Status timeline tracker -->
                                    <h6 class="fw-bold small text-dark mb-2">Historial de Estado:</h6>
                                    <div class="timeline ps-2">
                                      ${order.statusHistory.map((h, i) => {
                                        const hDate = new Date(h.date).toLocaleDateString('es-ES', {
                                          month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                                        });
                                        const isActive = i === order.statusHistory.length - 1;
                                        return `
                                          <div class="timeline-item ${isActive ? 'active' : ''} pb-2">
                                            <div class="fw-bold small text-dark">${h.status}</div>
                                            <div class="text-muted fs-8">${hDate}</div>
                                            <div class="text-muted small italic">${h.comment}</div>
                                          </div>
                                        `;
                                      }).join('')}
                                    </div>

                                  </div>
                                </div>
                              </div>
                            </td>
                          </tr>
                        `;
                      }).join('')}
                    </tbody>
                  </table>
                </div>
              `}
            </div>
          </div>
        </div>
      </div>
    `;

    // Handle Profile Update Form
    const form = document.getElementById('profile-update-form');
    const avatarInput = document.getElementById('prof-avatar');
    const avatarPreview = document.getElementById('profile-avatar-preview');

    avatarInput.addEventListener('input', () => {
      avatarPreview.src = avatarInput.value || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop';
    });

    form.addEventListener('submit', async (e) => {
      e.preventDefault();

      const name = document.getElementById('prof-name').value;
      const phone = document.getElementById('prof-phone').value;
      const address = document.getElementById('prof-address').value;
      const avatar = avatarInput.value;

      showLoader();
      try {
        const res = await API.updateProfile({ name, phone, address, avatar });
        hideLoader();
        if (res.success) {
          showToast(res.message);
          localStorage.setItem('petshop_user', JSON.stringify(res.user));
          window.dispatchEvent(new Event('authChange'));
          renderProfile();
        }
      } catch (err) {
        hideLoader();
        showToast(err.message, 'error');
      }
    });

  } catch (err) {
    hideLoader();
    appContainer.innerHTML = `<div class="container py-5 text-center text-danger">Error cargando perfil: ${err.message}</div>`;
  }
}

// ------------------------------------------
// 7. ADMIN DASHBOARD VIEW RENDERER
// ------------------------------------------
async function renderAdmin() {
  if (!currentUser || currentUser.role !== 'Administrador') {
    window.location.hash = '#/';
    return;
  }

  showLoader();
  try {
    const statsData = await API.getStats();
    const categoriesData = await API.getCategories();
    const productsData = await API.getProducts({ all: true }); // includes inactive
    const usersData = await API.getUsers();
    const ordersData = await API.getAllOrders();
    hideLoader();

    const stats = statsData.stats || {};
    const categories = categoriesData.categories || [];
    const products = productsData.products || [];
    const users = usersData.users || [];
    const orders = ordersData.orders || [];

    // Main Admin Layout
    appContainer.innerHTML = `
      <div class="view-container container py-5">
        <h2 class="fw-bold mb-4"><i class="fa-solid fa-gauge-high text-primary me-2"></i>Panel de Control</h2>
        
        <!-- Tabs Navigation -->
        <ul class="nav nav-tabs border-light mb-4 flex-nowrap overflow-auto" id="admin-tabs" role="tablist">
          <li class="nav-item">
            <button class="nav-link py-3 px-4 fw-bold border-0 text-dark bg-transparent ${activeAdminTab === 'stats' ? 'active border-bottom border-3 border-primary' : ''}" onclick="app.changeAdminTab('stats')">
              <i class="fa-solid fa-chart-line me-2"></i>Resumen General
            </button>
          </li>
          <li class="nav-item">
            <button class="nav-link py-3 px-4 fw-bold border-0 text-dark bg-transparent ${activeAdminTab === 'products' ? 'active border-bottom border-3 border-primary' : ''}" onclick="app.changeAdminTab('products')">
              <i class="fa-solid fa-boxes-stacked me-2"></i>Productos
            </button>
          </li>
          <li class="nav-item">
            <button class="nav-link py-3 px-4 fw-bold border-0 text-dark bg-transparent ${activeAdminTab === 'categories' ? 'active border-bottom border-3 border-primary' : ''}" onclick="app.changeAdminTab('categories')">
              <i class="fa-solid fa-tags me-2"></i>Categorías
            </button>
          </li>
          <li class="nav-item">
            <button class="nav-link py-3 px-4 fw-bold border-0 text-dark bg-transparent ${activeAdminTab === 'orders' ? 'active border-bottom border-3 border-primary' : ''}" onclick="app.changeAdminTab('orders')">
              <i class="fa-solid fa-receipt me-2"></i>Pedidos
            </button>
          </li>
          <li class="nav-item">
            <button class="nav-link py-3 px-4 fw-bold border-0 text-dark bg-transparent ${activeAdminTab === 'users' ? 'active border-bottom border-3 border-primary' : ''}" onclick="app.changeAdminTab('users')">
              <i class="fa-solid fa-users me-2"></i>Usuarios
            </button>
          </li>
        </ul>

        <div id="admin-tab-content" class="p-3">
          <!-- Dynamic Content based on activeAdminTab -->
        </div>
      </div>
    `;

    const contentDiv = document.getElementById('admin-tab-content');

    // ----------------- TAB: STATS -----------------
    if (activeAdminTab === 'stats') {
      contentDiv.innerHTML = `
        <div class="row g-4 mb-5">
          <!-- Metric 1 -->
          <div class="col-md-3 col-sm-6">
            <div class="metric-card bg-primary text-white">
              <div>
                <h6 class="text-white-50 mb-1">Ventas Entregadas</h6>
                <h3 class="fw-bold mb-0">$${stats.totalSales ? stats.totalSales.toFixed(2) : '0.00'}</h3>
              </div>
              <div class="icon-wrapper bg-white text-primary"><i class="fa-solid fa-sack-dollar"></i></div>
            </div>
          </div>
          <!-- Metric 2 -->
          <div class="col-md-3 col-sm-6">
            <div class="metric-card bg-warning text-white">
              <div>
                <h6 class="text-white-50 mb-1">Pedidos Activos</h6>
                <h3 class="fw-bold mb-0">${stats.totalOrders || 0}</h3>
              </div>
              <div class="icon-wrapper bg-white text-warning"><i class="fa-solid fa-truck-ramp-box"></i></div>
            </div>
          </div>
          <!-- Metric 3 -->
          <div class="col-md-3 col-sm-6">
            <div class="metric-card bg-info text-white">
              <div>
                <h6 class="text-white-50 mb-1">Usuarios Activos</h6>
                <h3 class="fw-bold mb-0">${stats.totalUsers || 0}</h3>
              </div>
              <div class="icon-wrapper bg-white text-info"><i class="fa-solid fa-user-check"></i></div>
            </div>
          </div>
          <!-- Metric 4 -->
          <div class="col-md-3 col-sm-6">
            <div class="metric-card bg-danger text-white">
              <div>
                <h6 class="text-white-50 mb-1">Alertas Stock</h6>
                <h3 class="fw-bold mb-0">${stats.lowStockAlertCount || 0}</h3>
              </div>
              <div class="icon-wrapper bg-white text-danger"><i class="fa-solid fa-triangle-exclamation"></i></div>
            </div>
          </div>
        </div>

        <div class="row g-4">
          <!-- Low Stock Products List -->
          <div class="col-md-5">
            <div class="card border border-light rounded-4 shadow-sm p-4 bg-white h-100">
              <h5 class="fw-bold mb-3 text-danger"><i class="fa-solid fa-triangle-exclamation me-2"></i>Productos con Bajo Stock</h5>
              <p class="text-muted small">Items con 3 o menos unidades que requieren reabastecimiento pronto.</p>
              
              ${stats.lowStockProducts && stats.lowStockProducts.length === 0 ? `
                <div class="alert alert-success py-3 text-center rounded-3">
                  <i class="fa-solid fa-circle-check me-2"></i>¡Todo en orden! No hay productos con stock crítico.
                </div>
              ` : `
                <div class="list-group list-group-flush">
                  ${(stats.lowStockProducts || []).map(p => `
                    <div class="list-group-item d-flex justify-content-between align-items-center py-2 px-0 border-light">
                      <div>
                        <span class="fw-bold text-dark d-block small">${p.name}</span>
                        <span class="text-muted small">Precio: $${p.price.toFixed(2)}</span>
                      </div>
                      <span class="badge bg-danger rounded-pill px-3 py-2">Stock: ${p.stock}</span>
                    </div>
                  `).join('')}
                </div>
              `}
            </div>
          </div>

          <!-- Recent Orders List -->
          <div class="col-md-7">
            <div class="card border border-light rounded-4 shadow-sm p-4 bg-white h-100">
              <h5 class="fw-bold mb-3"><i class="fa-solid fa-receipt me-2"></i>Pedidos Recientes</h5>
              <div class="table-responsive">
                <table class="table align-middle table-sm">
                  <thead>
                    <tr class="text-muted small">
                      <th>ID</th>
                      <th>Cliente</th>
                      <th>Estado</th>
                      <th class="text-end">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${(stats.recentOrders || []).map(o => {
                      let badge = 'bg-warning text-dark';
                      if (o.status === 'Enviado') badge = 'bg-info text-white';
                      if (o.status === 'Entregado') badge = 'bg-success text-white';
                      if (o.status === 'Cancelado') badge = 'bg-danger text-white';

                      return `
                        <tr>
                          <td class="fw-bold text-dark small">${o._id.substring(0, 8)}...</td>
                          <td class="small text-muted">${o.clientName}</td>
                          <td><span class="badge ${badge} fs-8">${o.status}</span></td>
                          <td class="fw-bold text-end small">$${o.total.toFixed(2)}</td>
                        </tr>
                      `;
                    }).join('')}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      `;
    }

    // ----------------- TAB: PRODUCTS -----------------
    else if (activeAdminTab === 'products') {
      contentDiv.innerHTML = `
        <div class="d-flex justify-content-between align-items-center mb-4">
          <h5 class="fw-bold mb-0">Gestión de Inventario (${products.length} productos)</h5>
          <button class="btn btn-primary rounded-3 btn-sm" id="btn-admin-add-product">
            <i class="fa-solid fa-plus me-1"></i>Agregar Producto
          </button>
        </div>

        <!-- Add/Edit form card overlay (hidden initially) -->
        <div class="card border border-light rounded-4 shadow-sm p-4 bg-light mb-4 d-none" id="product-form-card">
          <h5 class="fw-bold mb-4" id="product-form-title">Agregar Nuevo Producto</h5>
          <form id="product-form">
            <input type="hidden" id="prod-form-id">
            <div class="row g-3">
              <div class="col-md-6">
                <label class="form-label fw-semibold small text-dark">Nombre del Producto *</label>
                <input type="text" class="form-control bg-white" id="prod-name" required placeholder="Ej. Croquetas Adulto 10kg">
              </div>
              <div class="col-md-6">
                <label class="form-label fw-semibold small text-dark">Categoría *</label>
                <select class="form-select bg-white" id="prod-category" required>
                  <option value="">Seleccione...</option>
                  ${categories.map(c => `<option value="${c.name}">${c.name}</option>`).join('')}
                </select>
              </div>
              <div class="col-md-4">
                <label class="form-label fw-semibold small text-dark">Precio *</label>
                <input type="number" step="0.01" class="form-control bg-white" id="prod-price" required min="0" placeholder="Ej. 19.99">
              </div>
              <div class="col-md-4">
                <label class="form-label fw-semibold small text-dark">Stock *</label>
                <input type="number" class="form-control bg-white" id="prod-stock" required min="0" placeholder="Ej. 50">
              </div>
              <div class="col-md-4">
                <label class="form-label fw-semibold small text-dark">¿Disponible para la venta?</label>
                <select class="form-select bg-white" id="prod-active">
                  <option value="true">Sí (Activo)</option>
                  <option value="false">No (Inactivo/Borrador)</option>
                </select>
              </div>
              <div class="col-12">
                <label class="form-label fw-semibold small text-dark">URL de Imagen del Producto</label>
                <input type="text" class="form-control bg-white" id="prod-imageurl" placeholder="https://images.unsplash.com/photo-...">
              </div>
              <div class="col-12">
                <label class="form-label fw-semibold small text-dark">Descripción</label>
                <textarea class="form-control bg-white" id="prod-desc" rows="3" placeholder="Información sobre tamaño, ingredientes, modo de uso..."></textarea>
              </div>
            </div>
            
            <div class="d-flex gap-2 mt-4">
              <button type="submit" class="btn btn-primary rounded-3 px-4">Guardar Producto</button>
              <button type="button" class="btn btn-light border text-dark rounded-3 px-4" id="btn-cancel-product-form">Cancelar</button>
            </div>
          </form>
        </div>

        <div class="table-responsive">
          <table class="table align-middle table-striped table-hover bg-white rounded-3 shadow-sm overflow-hidden">
            <thead class="table-dark">
              <tr class="small text-nowrap">
                <th>Imagen</th>
                <th>Nombre</th>
                <th>Categoría</th>
                <th>Precio</th>
                <th class="text-center">Stock</th>
                <th class="text-center">Estado</th>
                <th class="text-center">Acciones</th>
              </tr>
            </thead>
            <tbody>
              ${products.map(p => `
                <tr>
                  <td>
                    <img src="${p.imageUrl || 'https://via.placeholder.com/60'}" 
                         class="rounded border shadow-sm" style="width: 50px; height: 50px; object-fit: cover;">
                  </td>
                  <td class="fw-semibold text-dark">${p.name}</td>
                  <td><span class="badge bg-secondary-subtle text-dark">${p.category}</span></td>
                  <td class="fw-bold text-primary">$${p.price.toFixed(2)}</td>
                  <td class="text-center">
                    <span class="badge ${p.stock <= 3 ? 'bg-danger' : 'bg-success'}">${p.stock}</span>
                  </td>
                  <td class="text-center">
                    <span class="badge ${p.active ? 'bg-success' : 'bg-secondary'}">${p.active ? 'Activo' : 'Inactivo'}</span>
                  </td>
                  <td class="text-center">
                    <div class="d-flex gap-2 justify-content-center">
                      <button class="btn btn-sm btn-outline-info" id="btn-edit-prod-${p._id}"><i class="fa-solid fa-pen-to-square"></i></button>
                      <button class="btn btn-sm btn-outline-danger" onclick="app.deleteProduct('${p._id}')"><i class="fa-solid fa-trash"></i></button>
                    </div>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      `;

      // Set up listeners for add/edit product
      const productFormCard = document.getElementById('product-form-card');
      const addProductBtn = document.getElementById('btn-admin-add-product');
      const cancelFormBtn = document.getElementById('btn-cancel-product-form');
      const productForm = document.getElementById('product-form');

      addProductBtn.addEventListener('click', () => {
        productForm.reset();
        document.getElementById('prod-form-id').value = '';
        document.getElementById('product-form-title').textContent = 'Agregar Nuevo Producto';
        productFormCard.classList.remove('d-none');
        productFormCard.scrollIntoView({ behavior: 'smooth' });
      });

      cancelFormBtn.addEventListener('click', () => {
        productFormCard.classList.add('d-none');
      });

      productForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const id = document.getElementById('prod-form-id').value;
        const name = document.getElementById('prod-name').value;
        const category = document.getElementById('prod-category').value;
        const price = Number(document.getElementById('prod-price').value);
        const stock = Number(document.getElementById('prod-stock').value);
        const active = document.getElementById('prod-active').value === 'true';
        const imageUrl = document.getElementById('prod-imageurl').value;
        const description = document.getElementById('prod-desc').value;

        showLoader();
        try {
          let res;
          if (id) {
            // Update
            res = await API.updateProduct(id, { name, category, price, stock, active, imageUrl, description });
          } else {
            // Create
            res = await API.createProduct({ name, category, price, stock, active, imageUrl, description });
          }

          hideLoader();
          if (res.success) {
            showToast(res.message);
            productFormCard.classList.add('d-none');
            renderAdmin();
          }
        } catch (err) {
          hideLoader();
          showToast(err.message, 'error');
        }
      });

      // Bind edit handlers dynamically
      products.forEach(p => {
        const editBtn = document.getElementById(`btn-edit-prod-${p._id}`);
        if (editBtn) {
          editBtn.addEventListener('click', () => {
            document.getElementById('prod-form-id').value = p._id;
            document.getElementById('prod-name').value = p.name;
            document.getElementById('prod-category').value = p.category;
            document.getElementById('prod-price').value = p.price;
            document.getElementById('prod-stock').value = p.stock;
            document.getElementById('prod-active').value = p.active ? 'true' : 'false';
            document.getElementById('prod-imageurl').value = p.imageUrl || '';
            document.getElementById('prod-desc').value = p.description || '';

            document.getElementById('product-form-title').textContent = 'Editar Producto';
            productFormCard.classList.remove('d-none');
            productFormCard.scrollIntoView({ behavior: 'smooth' });
          });
        }
      });
    }

    // ----------------- TAB: CATEGORIES -----------------
    else if (activeAdminTab === 'categories') {
      contentDiv.innerHTML = `
        <div class="d-flex justify-content-between align-items-center mb-4">
          <h5 class="fw-bold mb-0">Categorías de la Tienda</h5>
          <button class="btn btn-primary rounded-3 btn-sm" id="btn-admin-add-category">
            <i class="fa-solid fa-plus me-1"></i>Agregar Categoría
          </button>
        </div>

        <!-- Add/Edit form card overlay (hidden initially) -->
        <div class="card border border-light rounded-4 shadow-sm p-4 bg-light mb-4 d-none" id="category-form-card">
          <h5 class="fw-bold mb-4" id="category-form-title">Agregar Nueva Categoría</h5>
          <form id="category-form">
            <input type="hidden" id="cat-form-id">
            <div class="row g-3">
              <div class="col-md-12">
                <label class="form-label fw-semibold small text-dark">Nombre de la Categoría *</label>
                <input type="text" class="form-control bg-white" id="cat-name" required placeholder="Ej. Higiene y cuidado">
              </div>
              <div class="col-12">
                <label class="form-label fw-semibold small text-dark">Descripción</label>
                <textarea class="form-control bg-white" id="cat-desc" rows="3" placeholder="Descripción corta..."></textarea>
              </div>
            </div>
            
            <div class="d-flex gap-2 mt-4">
              <button type="submit" class="btn btn-primary rounded-3 px-4">Guardar Categoría</button>
              <button type="button" class="btn btn-light border text-dark rounded-3 px-4" id="btn-cancel-category-form">Cancelar</button>
            </div>
          </form>
        </div>

        <div class="table-responsive" style="max-width: 800px;">
          <table class="table align-middle table-striped table-hover bg-white rounded-3 shadow-sm overflow-hidden">
            <thead class="table-dark">
              <tr class="small">
                <th>Nombre</th>
                <th>Descripción</th>
                <th class="text-center">Acciones</th>
              </tr>
            </thead>
            <tbody>
              ${categories.map(c => `
                <tr>
                  <td class="fw-semibold text-dark text-nowrap">${c.name}</td>
                  <td class="text-muted small">${c.description || 'Sin descripción'}</td>
                  <td class="text-center">
                    <div class="d-flex gap-2 justify-content-center">
                      <button class="btn btn-sm btn-outline-info" id="btn-edit-cat-${c._id}"><i class="fa-solid fa-pen-to-square"></i></button>
                      <button class="btn btn-sm btn-outline-danger" onclick="app.deleteCategory('${c._id}')"><i class="fa-solid fa-trash"></i></button>
                    </div>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      `;

      // Set up listeners for add/edit category
      const categoryFormCard = document.getElementById('category-form-card');
      const addCategoryBtn = document.getElementById('btn-admin-add-category');
      const cancelCategoryFormBtn = document.getElementById('btn-cancel-category-form');
      const categoryForm = document.getElementById('category-form');

      addCategoryBtn.addEventListener('click', () => {
        categoryForm.reset();
        document.getElementById('cat-form-id').value = '';
        document.getElementById('category-form-title').textContent = 'Agregar Nueva Categoría';
        categoryFormCard.classList.remove('d-none');
        categoryFormCard.scrollIntoView({ behavior: 'smooth' });
      });

      cancelCategoryFormBtn.addEventListener('click', () => {
        categoryFormCard.classList.add('d-none');
      });

      categoryForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const id = document.getElementById('cat-form-id').value;
        const name = document.getElementById('cat-name').value;
        const description = document.getElementById('cat-desc').value;

        showLoader();
        try {
          let res;
          if (id) {
            // Update
            res = await API.updateCategory(id, { name, description });
          } else {
            // Create
            res = await API.createCategory({ name, description });
          }

          hideLoader();
          if (res.success) {
            showToast(res.message);
            categoryFormCard.classList.add('d-none');
            renderAdmin();
          }
        } catch (err) {
          hideLoader();
          showToast(err.message, 'error');
        }
      });

      // Bind edit handlers dynamically
      categories.forEach(c => {
        const editBtn = document.getElementById(`btn-edit-cat-${c._id}`);
        if (editBtn) {
          editBtn.addEventListener('click', () => {
            document.getElementById('cat-form-id').value = c._id;
            document.getElementById('cat-name').value = c.name;
            document.getElementById('cat-desc').value = c.description || '';

            document.getElementById('category-form-title').textContent = 'Editar Categoría';
            categoryFormCard.classList.remove('d-none');
            categoryFormCard.scrollIntoView({ behavior: 'smooth' });
          });
        }
      });
    }

    // ----------------- TAB: ORDERS -----------------
    else if (activeAdminTab === 'orders') {
      contentDiv.innerHTML = `
        <h5 class="fw-bold mb-4">Gestión de Pedidos Clientes</h5>
        
        <div class="table-responsive">
          <table class="table align-middle table-hover bg-white rounded-3 shadow-sm overflow-hidden">
            <thead class="table-dark">
              <tr class="small text-nowrap">
                <th>Pedido ID</th>
                <th>Cliente / Correo</th>
                <th>Fecha</th>
                <th>Método</th>
                <th>Estado</th>
                <th class="text-end">Total</th>
                <th class="text-center">Cambiar Estado</th>
              </tr>
            </thead>
            <tbody>
              ${orders.map(order => {
                let badgeColor = 'bg-warning text-dark';
                if (order.status === 'Enviado') badgeColor = 'bg-info text-white';
                if (order.status === 'Entregado') badgeColor = 'bg-success text-white';
                if (order.status === 'Cancelado') badgeColor = 'bg-danger text-white';

                const oDate = new Date(order.createdAt).toLocaleDateString('es-ES', {
                  year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                });

                return `
                  <tr style="cursor: pointer;" onclick="app.toggleOrderDetails('${order._id}')">
                    <td class="fw-bold small text-dark">${order._id.substring(0,8)}...</td>
                    <td>
                      <div class="small">
                        <strong class="d-block text-dark">${order.clientName}</strong>
                        <span class="text-muted">${order.clientEmail}</span>
                      </div>
                    </td>
                    <td class="text-muted small">${oDate}</td>
                    <td class="small text-muted">${order.paymentMethod}</td>
                    <td><span class="badge ${badgeColor}">${order.status}</span></td>
                    <td class="fw-bold text-end">$${order.total.toFixed(2)}</td>
                    <td class="text-center" onclick="event.stopPropagation();">
                      <div class="d-flex align-items-center gap-1 justify-content-center">
                        <select class="form-select form-select-sm py-1 bg-light border-0" id="order-status-select-${order._id}" style="width: 110px; font-size: 0.8rem;">
                          <option value="Pendiente" ${order.status === 'Pendiente' ? 'selected' : ''}>Pendiente</option>
                          <option value="Enviado" ${order.status === 'Enviado' ? 'selected' : ''}>Enviado</option>
                          <option value="Entregado" ${order.status === 'Entregado' ? 'selected' : ''}>Entregado</option>
                          <option value="Cancelado" ${order.status === 'Cancelado' ? 'selected' : ''}>Cancelar</option>
                        </select>
                        <button class="btn btn-sm btn-primary py-1 px-2" onclick="app.updateOrderStatus('${order._id}')" title="Aplicar Cambio">
                          <i class="fa-solid fa-check"></i>
                        </button>
                      </div>
                    </td>
                  </tr>

                  <!-- Collapsible Admin Details & Comment Section -->
                  <tr class="d-none" id="order-details-${order._id}" style="background-color: var(--primary-light);">
                    <td colspan="7" class="p-4 border-0" onclick="event.stopPropagation();">
                      <div class="card border border-light rounded-3 p-4 shadow-sm bg-white">
                        <div class="row g-4">
                          <div class="col-md-5">
                            <h6 class="fw-bold text-primary mb-2"><i class="fa-solid fa-boxes-packing me-1"></i>Artículos Solicitados:</h6>
                            <div class="list-group list-group-flush mb-3">
                              ${order.items.map(item => `
                                <div class="list-group-item d-flex justify-content-between align-items-center py-2 px-0 border-light bg-transparent">
                                  <div class="d-flex align-items-center gap-2">
                                    <img src="${item.imageUrl || 'https://via.placeholder.com/50'}" class="rounded border" style="width: 35px; height: 35px; object-fit: cover;">
                                    <div>
                                      <span class="fw-medium text-dark d-block small">${item.name}</span>
                                      <span class="text-muted small">$${item.price.toFixed(2)} x ${item.quantity}</span>
                                    </div>
                                  </div>
                                  <span class="fw-bold text-dark small">$${(item.price * item.quantity).toFixed(2)}</span>
                                </div>
                              `).join('')}
                            </div>
                            <div class="d-flex justify-content-between pt-2 border-top">
                              <strong class="text-dark">Subtotal:</strong>
                              <strong class="text-primary fs-5">$${order.total.toFixed(2)}</strong>
                            </div>
                          </div>

                          <div class="col-md-7">
                            <h6 class="fw-bold text-primary mb-2"><i class="fa-solid fa-truck-dot me-1"></i>Datos de Envío y Notas:</h6>
                            <p class="mb-1 small"><strong>Dirección completa:</strong> ${order.shippingAddress}</p>
                            <p class="mb-1 small"><strong>Teléfono cliente:</strong> ${order.phone}</p>
                            
                            <div class="my-3 p-3 bg-light rounded-3">
                              <label class="form-label fw-bold small text-dark mb-1">Comentario para el cliente (al actualizar estado)</label>
                              <input type="text" class="form-control form-control-sm bg-white border border-light" id="order-status-comment-${order._id}" placeholder="Ej. Su pedido ya fue despachado. Guía #198273">
                            </div>

                            <h6 class="fw-bold small text-dark mb-2">Historial de Estado:</h6>
                            <div class="timeline ps-2">
                              ${order.statusHistory.map((h, idx) => {
                                const hDate = new Date(h.date).toLocaleDateString('es-ES', {
                                  month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                                });
                                const isActive = idx === order.statusHistory.length - 1;
                                return `
                                  <div class="timeline-item ${isActive ? 'active' : ''} pb-2">
                                    <div class="fw-bold small text-dark">${h.status}</div>
                                    <div class="text-muted fs-8">${hDate}</div>
                                    <div class="text-muted small italic">${h.comment}</div>
                                  </div>
                                `;
                              }).join('')}
                            </div>
                          </div>
                        </div>
                      </div>
                    </td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>
      `;
    }

    // ----------------- TAB: USERS -----------------
    else if (activeAdminTab === 'users') {
      contentDiv.innerHTML = `
        <h5 class="fw-bold mb-4">Gestión de Usuarios Registrados</h5>

        <div class="table-responsive" style="max-width: 900px;">
          <table class="table align-middle table-striped table-hover bg-white rounded-3 shadow-sm overflow-hidden">
            <thead class="table-dark">
              <tr class="small">
                <th>Avatar</th>
                <th>Nombre</th>
                <th>Correo Electrónico</th>
                <th>Rol</th>
                <th>Dirección predeterminada</th>
                <th class="text-center">Acciones</th>
              </tr>
            </thead>
            <tbody>
              ${users.map(u => `
                <tr>
                  <td>
                    <img src="${u.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop'}" 
                         class="rounded-circle border" style="width: 38px; height: 38px; object-fit: cover;">
                  </td>
                  <td class="fw-bold text-dark text-nowrap">${u.name}</td>
                  <td class="text-muted small">${u.email}</td>
                  <td>
                    <span class="badge ${u.role === 'Administrador' ? 'bg-primary' : 'bg-secondary'}">${u.role}</span>
                  </td>
                  <td class="text-muted small text-truncate" style="max-width: 180px;">${u.address || 'No registrada'}</td>
                  <td class="text-center">
                    <div class="d-flex gap-2 justify-content-center">
                      <button class="btn btn-sm btn-outline-warning" onclick="app.updateUserRole('${u._id}', '${u.role}')" title="Cambiar Rol">
                        <i class="fa-solid fa-user-gear"></i>
                      </button>
                      <button class="btn btn-sm btn-outline-danger" onclick="app.deleteUser('${u._id}')" ${u.email === currentUser.email ? 'disabled' : ''} title="Eliminar Usuario">
                        <i class="fa-solid fa-trash"></i>
                      </button>
                    </div>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      `;
    }

  } catch (err) {
    hideLoader();
    appContainer.innerHTML = `<div class="container py-5 text-center text-danger">Error cargando panel de administrador: ${err.message}</div>`;
  }
}

// ==========================================
// SPA ROUTER
// ==========================================
function parseRoute() {
  const hash = window.location.hash || '#/';
  let routePath = hash;
  let queryParams = {};
  let id = null;

  // Split query parameters
  if (hash.includes('?')) {
    const parts = hash.split('?');
    routePath = parts[0];
    const searchParams = new URLSearchParams(parts[1]);
    for (let [key, val] of searchParams.entries()) {
      queryParams[key] = val;
    }
  }

  // Split dynamic ids (e.g., #/product/123)
  const segments = routePath.split('/');
  if (segments[1] === 'product' && segments[2]) {
    routePath = '/product';
    id = segments[2];
  } else if (segments[1] === 'admin' && segments[2]) {
    routePath = '/admin';
  } else {
    routePath = segments[0] + (segments[1] ? '/' + segments[1] : '/');
  }

  // Clean routePath to match router mapping keys
  if (routePath.startsWith('#')) {
    routePath = routePath.substring(1);
  }
  if (routePath === '') {
    routePath = '/';
  }

  return { routePath, queryParams, id };
}

function router() {
  const { routePath, queryParams, id } = parseRoute();

  // Scroll to top
  window.scrollTo({ top: 0 });

  // Guard routing checks
  const privateRoutes = ['/profile', '/admin'];
  
  if (privateRoutes.includes(routePath) && !currentUser) {
    showToast('Debes iniciar sesión para acceder a esta sección.', 'warning');
    window.location.hash = '#/login';
    return;
  }

  if (routePath === '/admin' && currentUser.role !== 'Administrador') {
    showToast('Acceso denegado. Se requieren permisos de administrador.', 'error');
    window.location.hash = '#/';
    return;
  }

  // Update Navigation UI
  updateNavbar();

  // Match routes
  switch (routePath) {
    case '/':
      renderHome();
      break;
    case '/catalog':
      renderCatalog(queryParams);
      break;
    case '/product':
      if (id) {
        renderProductDetail(id);
      } else {
        window.location.hash = '#/catalog';
      }
      break;
    case '/cart':
      renderCart();
      break;
    case '/login':
      if (currentUser) {
        window.location.hash = '#/';
      } else {
        renderLogin();
      }
      break;
    case '/profile':
      renderProfile();
      break;
    case '/admin':
      renderAdmin();
      break;
    default:
      // Fallback to home
      window.location.hash = '#/';
  }
}

// Listen for hash change and page loading
window.addEventListener('hashchange', router);
window.addEventListener('DOMContentLoaded', () => {
  // Sync session check and start routing
  checkSession().then(() => {
    updateCartBadge();
    router();
  });
});
