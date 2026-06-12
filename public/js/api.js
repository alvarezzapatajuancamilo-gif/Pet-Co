import { SUPABASE_CONFIG } from './config.js';

// Determine if we should connect directly to Supabase REST endpoints
const hasSupabase = SUPABASE_CONFIG.url && SUPABASE_CONFIG.anonKey;
const mode = hasSupabase ? 'ONLINE (SUPABASE DIRECTO)' : 'OFFLINE (LOCAL STORAGE)';
console.log(`%c PetShop Virtual - Modo activo: ${mode} `, 'background: #4CAF50; color: #white; font-weight: bold; padding: 4px;');

// ==========================================
// 1. DATA SEEDING FOR OFFLINE / INITIAL STORAGE
// ==========================================
const DEFAULT_CATEGORIES = [
  { _id: 'cat_perros', name: 'Alimentos para perros', description: 'Comida seca, húmeda y snacks premium para perros.', active: true },
  { _id: 'cat_gatos', name: 'Alimentos para gatos', description: 'Comida seca, húmeda y snacks premium para gatos.', active: true },
  { _id: 'cat_juguetes', name: 'Juguetes', description: 'Juguetes interactivos, de goma, peluches y rasguñadores.', active: true },
  { _id: 'cat_accs', name: 'Accesorios', description: 'Collares, correas, arneses, platos y comederos.', active: true },
  { _id: 'cat_higiene', name: 'Higiene y cuidado', description: 'Shampoos, cepillos, antipulgas y arenas sanitarias.', active: true },
  { _id: 'cat_meds', name: 'Medicamentos', description: 'Suplementos vitamínicos, desparasitantes y medicamentos básicos.', active: true },
  { _id: 'cat_camas', name: 'Camas y transportadoras', description: 'Camas acolchadas, colchonetas y bolsos de viaje.', active: true },
  { _id: 'cat_peces', name: 'Acuarios y peces', description: 'Alimento para peces, filtros, peceras y decoración.', active: true },
  { _id: 'cat_aves', name: 'Aves', description: 'Jaulas, alimento balanceado, juguetes y nidos.', active: true },
  { _id: 'cat_roedores', name: 'Roedores', description: 'Alimento, viruta, jaulas y juguetes para hámsters y cobayas.', active: true }
];

// Seeded passwords (both hash to admin123 and cliente123 respectively, compatible with seed.js)
const DEFAULT_USERS = [
  {
    _id: 'usr_admin1',
    name: 'Administrador PetShop',
    email: 'admin@petshop.com',
    password: '$2a$10$vWd0nBvTusq7qZ65j3JbI.xWq7hW7725y0/9yY92k2.Z7k3z5z85C', // admin123
    role: 'Administrador',
    phone: '555-0199',
    address: 'Av. Mascotas 123, Central Pet',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop'
  },
  {
    _id: 'usr_client1',
    name: 'Juan Pérez',
    email: 'cliente@petshop.com',
    password: '$2a$10$T1Kq21hD69xT3bW5n5b3e.M21jW9y/Zq1qW3eE8y9k6t5z43m7wYm', // cliente123
    role: 'Cliente',
    phone: '555-0144',
    address: 'Calle Falsa 123, Depto 4B',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop'
  }
];

const DEFAULT_PRODUCTS = [
  { _id: 'prod_1', name: 'Croquetas Premium Perro Adulto', description: 'Alimento premium balanceado para perros adultos de raza mediana a grande. Bolsa de 15kg. Rico en proteínas.', price: 45.99, stock: 25, category: 'Alimentos para perros', imageUrl: 'https://images.unsplash.com/photo-1589924691995-400dc9ecc119?w=500&auto=format&fit=crop', active: true, createdAt: new Date(Date.now() - 5*24*60*60*1000).toISOString() },
  { _id: 'prod_2', name: 'Lata Comida Húmeda de Salmón Gato', description: 'Alimento húmedo gourmet para gatos adultos sabor salmón. Deliciosa textura en paté rica en omega 3. Lata de 85g.', price: 1.89, stock: 120, category: 'Alimentos para gatos', imageUrl: 'https://images.unsplash.com/photo-1569591159212-b02ea8a9f239?w=500&auto=format&fit=crop', active: true, createdAt: new Date(Date.now() - 4*24*60*60*1000).toISOString() },
  { _id: 'prod_3', name: 'Pelota de Goma Ultra Resistente', description: 'Juguete interactivo para perros. Bota alto y es ideal para morder. Ayuda a limpiar los dientes de tu mascota.', price: 8.50, stock: 45, category: 'Juguetes', imageUrl: 'https://images.unsplash.com/photo-1576201836106-db1758fd1c97?w=500&auto=format&fit=crop', active: true, createdAt: new Date(Date.now() - 3*24*60*60*1000).toISOString() },
  { _id: 'prod_4', name: 'Árbol Rascador para Gatos Multinivel', description: 'Rascador de 120cm de altura con plataformas para siesta, cueva acogedora y postes forrados en yute para afilar garras.', price: 59.99, stock: 8, category: 'Juguetes', imageUrl: 'https://images.unsplash.com/photo-1545249390-6bdfa286032f?w=500&auto=format&fit=crop', active: true, createdAt: new Date(Date.now() - 2*24*60*60*1000).toISOString() },
  { _id: 'prod_5', name: 'Arnés de Nylon Ajustable Reflectante', description: 'Arnés ergonómico para pasear perros medianos. Costuras reflectantes para mayor seguridad durante paseos nocturnos.', price: 15.20, stock: 30, category: 'Accesorios', imageUrl: 'https://images.unsplash.com/photo-1544568100-847a948585b9?w=500&auto=format&fit=crop', active: true, createdAt: new Date(Date.now() - 1*24*60*60*1000).toISOString() },
  { _id: 'prod_6', name: 'Cama Ortopédica Premium Memory Foam', description: 'Cama acolchada de espuma viscoelástica para perros medianos a grandes. Alivia el dolor de articulaciones. Funda lavable.', price: 38.50, stock: 15, category: 'Camas y transportadoras', imageUrl: 'https://images.unsplash.com/photo-1541599540903-216a46ca1ad0?w=500&auto=format&fit=crop', active: true, createdAt: new Date().toISOString() },
  { _id: 'prod_7', name: 'Filtro para Acuario Cascada Silencioso', description: 'Filtro colgante de mochila para acuarios de hasta 60 litros. Filtración física, química y biológica eficiente.', price: 22.99, stock: 12, category: 'Acuarios y peces', imageUrl: 'https://images.unsplash.com/photo-1522069169874-c58ec4b76be5?w=500&auto=format&fit=crop', active: true, createdAt: new Date().toISOString() },
  { _id: 'prod_8', name: 'Shampoo de Avena Orgánica e Hipoalergénico', description: 'Fórmula suave para pieles sensibles y con picazón. Limpia, acondiciona y humecta el pelaje de perros y gatos.', price: 9.99, stock: 2, category: 'Higiene y cuidado', imageUrl: 'https://images.unsplash.com/photo-1516733725897-1aa73b87c8e8?w=500&auto=format&fit=crop', active: true, createdAt: new Date().toISOString() },
  { _id: 'prod_9', name: 'Jaula Espaciosa para Canarios y Aves', description: 'Jaula metálica con bandejas extraíbles de limpieza fácil, perchas de madera y comederos incluidos. Medidas: 50x30x40cm.', price: 27.50, stock: 6, category: 'Aves', imageUrl: 'https://images.unsplash.com/photo-1452570053594-1b985d6ea890?w=500&auto=format&fit=crop', active: true, createdAt: new Date().toISOString() },
  { _id: 'prod_10', name: 'Rueda de Ejercicio para Hámster Silenciosa', description: 'Rueda giratoria de acrílico transparente para hámsters y pequeños roedores. Rodamiento silencioso que no perturba el sueño.', price: 6.40, stock: 20, category: 'Roedores', imageUrl: 'https://images.unsplash.com/photo-1548767797-d8c844163c4c?w=500&auto=format&fit=crop', active: true, createdAt: new Date().toISOString() },
  { _id: 'prod_11', name: 'Snacks Dentales para Perro (Bolsa)', description: 'Golosinas masticables diarias para reducir el sarro y mal aliento en perros pequeños. Bolsa con 14 unidades.', price: 4.99, stock: 65, category: 'Alimentos para perros', imageUrl: 'https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?w=500&auto=format&fit=crop', active: true, createdAt: new Date().toISOString() },
  { _id: 'prod_12', name: 'Suplemento Multivitamínico Mascotas', description: 'Jarabe concentrado con vitaminas A, D, E y complejo B para fortalecer el sistema inmune de cachorros y gatitos.', price: 11.50, stock: 1, category: 'Medicamentos', imageUrl: 'https://images.unsplash.com/photo-1584017911766-d451b3d0e843?w=500&auto=format&fit=crop', active: true, createdAt: new Date().toISOString() }
];

const DEFAULT_ORDERS = [
  {
    _id: 'ord_sample1',
    userId: 'usr_client1',
    clientName: 'Juan Pérez',
    clientEmail: 'cliente@petshop.com',
    items: [
      { productId: 'prod_1', name: 'Croquetas Premium Perro Adulto', price: 45.99, quantity: 1, imageUrl: 'https://images.unsplash.com/photo-1589924691995-400dc9ecc119?w=500&auto=format&fit=crop' },
      { productId: 'prod_3', name: 'Pelota de Goma Ultra Resistente', price: 8.50, quantity: 2, imageUrl: 'https://images.unsplash.com/photo-1576201836106-db1758fd1c97?w=500&auto=format&fit=crop' }
    ],
    total: 62.99,
    shippingAddress: 'Calle Falsa 123, Depto 4B',
    phone: '555-0144',
    paymentMethod: 'Tarjeta de Crédito',
    status: 'Entregado',
    statusHistory: [
      { status: 'Pendiente', date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), comment: 'Pedido recibido.' },
      { status: 'Enviado', date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), comment: 'Envío realizado por Servientrega. Guía #12345' },
      { status: 'Entregado', date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), comment: 'Entregado en puerta, firmado por el cliente.' }
    ],
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    _id: 'ord_sample2',
    userId: 'usr_client1',
    clientName: 'Juan Pérez',
    clientEmail: 'cliente@petshop.com',
    items: [
      { productId: 'prod_6', name: 'Cama Ortopédica Premium Memory Foam', price: 38.50, quantity: 1, imageUrl: 'https://images.unsplash.com/photo-1541599540903-216a46ca1ad0?w=500&auto=format&fit=crop' }
    ],
    total: 38.50,
    shippingAddress: 'Calle Falsa 123, Depto 4B',
    phone: '555-0144',
    paymentMethod: 'Transferencia Bancaria',
    status: 'Pendiente',
    statusHistory: [
      { status: 'Pendiente', date: new Date().toISOString(), comment: 'Pedido recibido, en espera de comprobante de pago.' }
    ],
    createdAt: new Date().toISOString()
  }
];

// Helper to initialize LocalStorage collections if empty
function initLocalStorageDB() {
  if (!localStorage.getItem('petshop_db_initialized')) {
    localStorage.setItem('petshop_db_categories', JSON.stringify(DEFAULT_CATEGORIES));
    localStorage.setItem('petshop_db_users', JSON.stringify(DEFAULT_USERS));
    localStorage.setItem('petshop_db_products', JSON.stringify(DEFAULT_PRODUCTS));
    localStorage.setItem('petshop_db_orders', JSON.stringify(DEFAULT_ORDERS));
    localStorage.setItem('petshop_db_initialized', 'true');
    console.log('%c Base de datos local (LocalStorage) inicializada con datos de prueba. ', 'color: #388E3C; font-weight: bold;');
  }
}

// Read/Write LocalStorage collections helper
function readLocal(key) {
  initLocalStorageDB();
  return JSON.parse(localStorage.getItem(`petshop_db_${key}`) || '[]');
}

function writeLocal(key, data) {
  localStorage.setItem(`petshop_db_${key}`, JSON.stringify(data));
}

// ==========================================
// 2. MOCK REST CONTROLLER (LOCAL STORAGE MODE)
// ==========================================
function localDBRequest(endpoint, options = {}) {
  // Simulate network delay
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      try {
        const urlObj = new URL(endpoint, 'http://localhost');
        const path = urlObj.pathname;
        const method = options.method || 'GET';
        const body = options.body;

        // Current logged in user ID from token simulation
        const token = localStorage.getItem('petshop_token');
        let sessionUser = null;
        if (token) {
          const users = readLocal('users');
          sessionUser = users.find(u => u._id === token);
        }

        // --- AUTH ROUTES ---
        if (path === '/auth/login') {
          const { email, password } = body;
          const users = readLocal('users');
          const user = users.find(u => u.email === email);
          if (!user) {
            return resolve({ success: false, message: 'Credenciales inválidas. Correo o contraseña incorrectos.' });
          }
          const isMatch = dcodeIO.bcrypt.compareSync(password, user.password);
          if (!isMatch) {
            return resolve({ success: false, message: 'Credenciales inválidas. Correo o contraseña incorrectos.' });
          }
          return resolve({
            success: true,
            token: user._id, // we simulate JWT token using user id
            user: { ...user, password: minifiedPassword(user.password) }
          });
        }
        
        if (path === '/auth/register') {
          const { name, email, password, phone, address } = body;
          const users = readLocal('users');
          if (users.find(u => u.email === email)) {
            return resolve({ success: false, message: 'Este correo electrónico ya está registrado.' });
          }
          const newUser = {
            _id: 'usr_' + Math.random().toString(36).substr(2, 9),
            name,
            email,
            password: dcodeIO.bcrypt.hashSync(password, 10),
            role: 'Cliente',
            phone: phone || '',
            address: address || '',
            avatar: '',
            createdAt: new Date().toISOString()
          };
          users.push(newUser);
          writeLocal('users', users);
          return resolve({ success: true, message: 'Registro exitoso.', user: newUser });
        }

        if (path === '/auth/logout') {
          return resolve({ success: true, message: 'Sesión cerrada exitosamente.' });
        }

        if (path === '/auth/recover') {
          const { email } = body;
          const users = readLocal('users');
          const user = users.find(u => u.email === email);
          if (!user) {
            return resolve({ success: false, message: 'No se encontró ningún usuario con este correo electrónico.' });
          }
          const tempPassword = 'temp_' + Math.random().toString(36).substr(2, 6);
          user.password = dcodeIO.bcrypt.hashSync(tempPassword, 10);
          writeLocal('users', users);
          return resolve({
            success: true,
            message: `Enlace de recuperación enviado. Se ha restablecido temporalmente tu contraseña.`,
            tempPassword: tempPassword
          });
        }

        if (path === '/auth/profile') {
          if (!sessionUser) return reject(new Error('No autenticado.'));
          if (method === 'GET') {
            return resolve({ success: true, user: sessionUser });
          }
          if (method === 'PUT') {
            const users = readLocal('users');
            const idx = users.findIndex(u => u._id === sessionUser._id);
            if (idx === -1) return reject(new Error('Usuario no encontrado.'));

            const { name, phone, address, avatar, password } = body;
            if (name) users[idx].name = name;
            if (phone !== undefined) users[idx].phone = phone;
            if (address !== undefined) users[idx].address = address;
            if (avatar !== undefined) users[idx].avatar = avatar;
            if (password) users[idx].password = dcodeIO.bcrypt.hashSync(password, 10);

            writeLocal('users', users);
            return resolve({ success: true, message: 'Perfil actualizado exitosamente.', user: users[idx] });
          }
        }

        // --- CATEGORIES ROUTES ---
        if (path === '/categories') {
          const categories = readLocal('categories');
          if (method === 'GET') {
            return resolve({ success: true, categories });
          }
          if (method === 'POST') {
            if (!sessionUser || sessionUser.role !== 'Administrador') return reject(new Error('Acceso denegado.'));
            const { name, description } = body;
            if (categories.find(c => c.name.toLowerCase() === name.toLowerCase())) {
              return resolve({ success: false, message: 'Ya existe una categoría con este nombre.' });
            }
            const newCat = {
              _id: 'cat_' + Math.random().toString(36).substr(2, 9),
              name,
              description: description || '',
              active: true,
              createdAt: new Date().toISOString()
            };
            categories.push(newCat);
            writeLocal('categories', categories);
            return resolve({ success: true, message: 'Categoría creada exitosamente.', category: newCat });
          }
        }

        if (path.startsWith('/categories/')) {
          if (!sessionUser || sessionUser.role !== 'Administrador') return reject(new Error('Acceso denegado.'));
          const id = path.split('/')[2];
          const categories = readLocal('categories');
          const idx = categories.findIndex(c => c._id === id);
          if (idx === -1) return resolve({ success: false, message: 'Categoría no encontrada.' });

          if (method === 'PUT') {
            const { name, description, active } = body;
            if (name) categories[idx].name = name;
            if (description !== undefined) categories[idx].description = description;
            if (active !== undefined) categories[idx].active = active;
            writeLocal('categories', categories);
            return resolve({ success: true, message: 'Categoría actualizada exitosamente.', category: categories[idx] });
          }
          if (method === 'DELETE') {
            // Check if products are in category
            const products = readLocal('products');
            const hasProducts = products.some(p => p.category === categories[idx].name);
            if (hasProducts) {
              return resolve({ success: false, message: 'No se puede eliminar la categoría porque contiene productos asociados.' });
            }
            categories.splice(idx, 1);
            writeLocal('categories', categories);
            return resolve({ success: true, message: 'Categoría eliminada exitosamente.' });
          }
        }

        // --- PRODUCTS ROUTES ---
        if (path === '/products') {
          const products = readLocal('products');
          if (method === 'GET') {
            let result = [...products];
            // Filter by active (default for client, admin can pass all=true)
            const all = urlObj.searchParams.get('all');
            if (all !== 'true') {
              result = result.filter(p => p.active);
            }
            // Filter by category
            const cat = urlObj.searchParams.get('category');
            if (cat) {
              result = result.filter(p => p.category === cat);
            }
            // Filter by search term
            const search = urlObj.searchParams.get('search');
            if (search) {
              const term = search.toLowerCase();
              result = result.filter(p => p.name.toLowerCase().includes(term) || p.description.toLowerCase().includes(term));
            }
            // Filter price bounds
            const min = urlObj.searchParams.get('minPrice');
            const max = urlObj.searchParams.get('maxPrice');
            if (min) result = result.filter(p => p.price >= Number(min));
            if (max) result = result.filter(p => p.price <= Number(max));
            
            // Sort
            const sort = urlObj.searchParams.get('sort') || 'newest';
            if (sort === 'price-asc') result.sort((a,b) => a.price - b.price);
            else if (sort === 'price-desc') result.sort((a,b) => b.price - a.price);
            else if (sort === 'newest') result.sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt));

            return resolve({ success: true, products: result });
          }

          if (method === 'POST') {
            if (!sessionUser || sessionUser.role !== 'Administrador') return reject(new Error('Acceso denegado.'));
            const { name, description, price, stock, category, imageUrl, active } = body;
            const newProd = {
              _id: 'prod_' + Math.random().toString(36).substr(2, 9),
              name,
              description: description || '',
              price: Number(price),
              stock: Number(stock),
              category,
              imageUrl: imageUrl || '',
              active: active !== undefined ? active : true,
              createdAt: new Date().toISOString()
            };
            products.push(newProd);
            writeLocal('products', products);
            return resolve({ success: true, message: 'Producto creado exitosamente.', product: newProd });
          }
        }

        if (path.startsWith('/products/')) {
          const id = path.split('/')[2];
          const products = readLocal('products');
          const idx = products.findIndex(p => p._id === id);
          if (idx === -1) return resolve({ success: false, message: 'Producto no encontrado.' });

          if (method === 'GET') {
            return resolve({ success: true, product: products[idx] });
          }
          if (!sessionUser || sessionUser.role !== 'Administrador') return reject(new Error('Acceso denegado.'));

          if (method === 'PUT') {
            const { name, description, price, stock, category, imageUrl, active } = body;
            if (name) products[idx].name = name;
            if (description !== undefined) products[idx].description = description;
            if (price !== undefined) products[idx].price = Number(price);
            if (stock !== undefined) products[idx].stock = Number(stock);
            if (category) products[idx].category = category;
            if (imageUrl !== undefined) products[idx].imageUrl = imageUrl;
            if (active !== undefined) products[idx].active = active;
            
            writeLocal('products', products);
            return resolve({ success: true, message: 'Producto actualizado exitosamente.', product: products[idx] });
          }
          if (method === 'DELETE') {
            const deleted = products.splice(idx, 1)[0];
            writeLocal('products', products);
            return resolve({ success: true, message: 'Producto eliminado exitosamente.', product: deleted });
          }
        }

        // --- ORDERS ROUTES ---
        if (path === '/orders') {
          const orders = readLocal('orders');
          if (method === 'GET') {
            if (!sessionUser || sessionUser.role !== 'Administrador') return reject(new Error('Acceso denegado.'));
            return resolve({ success: true, orders });
          }
          if (method === 'POST') {
            if (!sessionUser) return reject(new Error('No autenticado.'));
            const { items, shippingAddress, phone, paymentMethod } = body;
            
            // Validate and deduct stock
            const products = readLocal('products');
            const orderItems = [];
            let total = 0;
            
            for (let item of items) {
              const prod = products.find(p => p._id === item.productId);
              if (!prod) return resolve({ success: false, message: `Producto no encontrado.` });
              if (prod.stock < item.quantity) {
                return resolve({ success: false, message: `Stock insuficiente para ${prod.name}.` });
              }
              prod.stock -= item.quantity;
              total += prod.price * item.quantity;
              orderItems.push({
                productId: prod._id,
                name: prod.name,
                price: prod.price,
                quantity: item.quantity,
                imageUrl: prod.imageUrl
              });
            }
            writeLocal('products', products);

            const newOrder = {
              _id: 'ord_' + Math.random().toString(36).substr(2, 9),
              userId: sessionUser._id,
              clientName: sessionUser.name,
              clientEmail: sessionUser.email,
              items: orderItems,
              total: Number(total.toFixed(2)),
              shippingAddress,
              phone,
              paymentMethod,
              status: 'Pendiente',
              statusHistory: [
                { status: 'Pendiente', date: new Date().toISOString(), comment: 'Pedido creado exitosamente.' }
              ],
              createdAt: new Date().toISOString()
            };
            orders.unshift(newOrder); // Add to beginning
            writeLocal('orders', orders);
            return resolve({ success: true, message: '¡Pedido realizado exitosamente!', order: newOrder });
          }
        }

        if (path === '/orders/my') {
          if (!sessionUser) return reject(new Error('No autenticado.'));
          const orders = readLocal('orders');
          const myOrders = orders.filter(o => o.userId === sessionUser._id);
          return resolve({ success: true, orders: myOrders });
        }

        if (path.startsWith('/orders/')) {
          const id = path.split('/')[2];
          const orders = readLocal('orders');
          const order = orders.find(o => o._id === id);
          if (!order) return resolve({ success: false, message: 'Pedido no encontrado.' });

          if (method === 'GET') {
            if (order.userId !== sessionUser._id && sessionUser.role !== 'Administrador') {
              return reject(new Error('Acceso denegado.'));
            }
            return resolve({ success: true, order });
          }

          if (method === 'PUT') {
            if (!sessionUser || sessionUser.role !== 'Administrador') return reject(new Error('Acceso denegado.'));
            const { status, comment } = body;
            
            // Stock recovery if canceled
            if (status === 'Cancelado' && order.status !== 'Cancelado') {
              const products = readLocal('products');
              order.items.forEach(item => {
                const prod = products.find(p => p._id === item.productId);
                if (prod) prod.stock += item.quantity;
              });
              writeLocal('products', products);
            }

            order.status = status;
            order.statusHistory.push({
              status,
              date: new Date().toISOString(),
              comment: comment || `Estado del pedido cambiado a: ${status}`
            });
            writeLocal('orders', orders);
            return resolve({ success: true, message: 'Pedido actualizado exitosamente.', order });
          }
        }

        // --- ADMIN DASHBOARD & USER MANAGEMENT ---
        if (path === '/admin/stats') {
          if (!sessionUser || sessionUser.role !== 'Administrador') return reject(new Error('Acceso denegado.'));
          
          const orders = readLocal('orders');
          const products = readLocal('products');
          const users = readLocal('users');
          const categories = readLocal('categories');

          let totalSales = 0;
          let pendingSales = 0;
          orders.forEach(o => {
            if (o.status === 'Entregado') totalSales += o.total;
            else if (o.status !== 'Cancelado') pendingSales += o.total;
          });

          const lowStock = products.filter(p => p.stock <= 3);
          const statusCounts = { Pendiente: 0, Enviado: 0, Entregado: 0, Cancelado: 0 };
          orders.forEach(o => { if (statusCounts[o.status] !== undefined) statusCounts[o.status]++; });

          return resolve({
            success: true,
            stats: {
              totalOrders: orders.length,
              totalProducts: products.length,
              totalUsers: users.length,
              totalCategories: categories.length,
              totalSales: Number(totalSales.toFixed(2)),
              pendingSales: Number(pendingSales.toFixed(2)),
              lowStockAlertCount: lowStock.length,
              lowStockProducts: lowStock,
              statusCounts,
              recentOrders: orders.slice(0, 5)
            }
          });
        }

        if (path === '/admin/users') {
          if (!sessionUser || sessionUser.role !== 'Administrador') return reject(new Error('Acceso denegado.'));
          const users = readLocal('users');
          return resolve({ success: true, users: users.map(u => ({ ...u, password: '' })) });
        }

        if (path.startsWith('/admin/users/')) {
          if (!sessionUser || sessionUser.role !== 'Administrador') return reject(new Error('Acceso denegado.'));
          const parts = path.split('/');
          const id = parts[3];
          const users = readLocal('users');
          const idx = users.findIndex(u => u._id === id);
          if (idx === -1) return resolve({ success: false, message: 'Usuario no encontrado.' });

          if (path.endsWith('/role') && method === 'PUT') {
            users[idx].role = body.role;
            writeLocal('users', users);
            return resolve({ success: true, message: `Rol actualizado a ${body.role} exitosamente.` });
          }

          if (method === 'DELETE') {
            if (id === sessionUser._id) {
              return resolve({ success: false, message: 'No puedes eliminar tu propio usuario administrador.' });
            }
            users.splice(idx, 1);
            writeLocal('users', users);
            return resolve({ success: true, message: 'Usuario eliminado exitosamente.' });
          }
        }

        return reject(new Error(`Endpoint no encontrado: ${method} ${path}`));
      } catch (err) {
        reject(err);
      }
    }, 200);
  });
}

function minifiedPassword(pass) {
  return pass ? '••••••••' : '';
}

// ==========================================
// 3. BASE FETCH WRAPPER FOR DIRECT SUPABASE API
// ==========================================
async function supabaseFetch(endpoint, method = 'GET', body = null, forceAnon = false) {
  const url = `${SUPABASE_CONFIG.url}${endpoint}`;
  
  const headers = {
    'apikey': SUPABASE_CONFIG.anonKey,
    'Content-Type': 'application/json'
  };

  // If fetching representation after INSERT/PATCH (required to get values back)
  if (method === 'POST' || method === 'PATCH') {
    headers['Prefer'] = 'return=representation';
  }

  // In Direct REST mode, we always authorize REST requests using the anonKey (which is a valid JWT).
  // The local userToken (user ID) is only used on the client-side to manage session identity.
  const token = SUPABASE_CONFIG.anonKey;
  headers['Authorization'] = `Bearer ${token}`;

  const config = {
    method,
    headers
  };

  if (body) {
    config.body = JSON.stringify(body);
  }

  try {
    const response = await fetch(url, config);
    
    // Deletes might return 204 No Content
    if (response.status === 204) return [];

    const data = await response.json();
    if (!response.ok) {
      // Handles unauthenticated status
      if (response.status === 401 && !window.location.hash.includes('/login')) {
        localStorage.removeItem('petshop_token');
        localStorage.removeItem('petshop_user');
        window.dispatchEvent(new Event('authChange'));
      }
      throw new Error(data.message || data.error_description || 'Error al comunicarse con Supabase.');
    }

    return data;
  } catch (error) {
    console.error(`Supabase REST Error on ${endpoint}:`, error.message);
    throw error;
  }
}

// ==========================================
// 4. MAIN EXPORTED API WRAPPER
// ==========================================
export const API = {
  // Auth & Profile
  login: async (email, password) => {
    if (!hasSupabase) {
      return localDBRequest('/auth/login', { method: 'POST', body: { email, password } });
    }
    
    // In Direct Supabase mode, we retrieve the user from public.users schema directly
    const users = await supabaseFetch(`/rest/v1/users?email=eq.${encodeURIComponent(email)}`, 'GET');
    const user = users[0];
    if (!user) {
      throw new Error('Credenciales inválidas. Correo o contraseña incorrectos.');
    }

    const isMatch = dcodeIO.bcrypt.compareSync(password, user.password);
    if (!isMatch) {
      throw new Error('Credenciales inválidas. Correo o contraseña incorrectos.');
    }

    // Generate local token (using user id for simplicity since direct connection bypasses backend signToken)
    // In direct supabase, using their database primary key as token allows query mapping
    return {
      success: true,
      token: user.id,
      user: {
        _id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone || '',
        address: user.address || '',
        avatar: user.avatar || '',
        createdAt: user.created_at
      }
    };
  },

  register: async (userData) => {
    if (!hasSupabase) {
      return localDBRequest('/auth/register', { method: 'POST', body: userData });
    }

    // Check if email already registered in public.users
    const existing = await supabaseFetch(`/rest/v1/users?email=eq.${encodeURIComponent(userData.email)}`, 'GET');
    if (existing.length > 0) {
      throw new Error('Este correo electrónico ya está registrado.');
    }

    const hashedPassword = dcodeIO.bcrypt.hashSync(userData.password, 10);
    const userId = 'usr_' + Math.random().toString(36).substr(2, 9);
    
    const userResult = await supabaseFetch('/rest/v1/users', 'POST', {
      id: userId,
      name: userData.name,
      email: userData.email,
      password: hashedPassword,
      role: 'Cliente',
      phone: userData.phone || '',
      address: userData.address || '',
      avatar: userData.avatar || ''
    });

    return {
      success: true,
      message: 'Usuario registrado exitosamente.',
      user: userResult[0]
    };
  },

  logout: async () => {
    if (!hasSupabase) {
      return localDBRequest('/auth/logout', { method: 'POST' });
    }
    // Static serverless logout just deletes LocalStorage token
    localStorage.removeItem('petshop_token');
    localStorage.removeItem('petshop_user');
    window.dispatchEvent(new Event('authChange'));
    return { success: true, message: 'Sesión cerrada exitosamente.' };
  },

  recover: async (email) => {
    if (!hasSupabase) {
      return localDBRequest('/auth/recover', { method: 'POST', body: { email } });
    }

    const users = await supabaseFetch(`/rest/v1/users?email=eq.${encodeURIComponent(email)}`, 'GET');
    const user = users[0];
    if (!user) {
      throw new Error('No se encontró ningún usuario con este correo electrónico.');
    }

    const tempPassword = 'temp_' + Math.random().toString(36).substr(2, 6);
    const hashedTemp = dcodeIO.bcrypt.hashSync(tempPassword, 10);

    await supabaseFetch(`/rest/v1/users?id=eq.${user.id}`, 'PATCH', { password: hashedTemp });

    return {
      success: true,
      message: 'Enlace de recuperación enviado. Se ha restablecido temporalmente tu contraseña.',
      tempPassword: tempPassword
    };
  },

  getProfile: async () => {
    if (!hasSupabase) {
      return localDBRequest('/auth/profile', { method: 'GET' });
    }
    const userId = localStorage.getItem('petshop_token');
    if (!userId) throw new Error('No autenticado.');

    const users = await supabaseFetch(`/rest/v1/users?id=eq.${userId}`, 'GET');
    const user = users[0];
    if (!user) throw new Error('Usuario no encontrado.');

    return {
      success: true,
      user: {
        _id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone || '',
        address: user.address || '',
        avatar: user.avatar || '',
        createdAt: user.created_at
      }
    };
  },

  updateProfile: async (profileData) => {
    if (!hasSupabase) {
      return localDBRequest('/auth/profile', { method: 'PUT', body: profileData });
    }
    const userId = localStorage.getItem('petshop_token');
    if (!userId) throw new Error('No autenticado.');

    const updates = {};
    if (profileData.name) updates.name = profileData.name;
    if (profileData.phone !== undefined) updates.phone = profileData.phone;
    if (profileData.address !== undefined) updates.address = profileData.address;
    if (profileData.avatar !== undefined) updates.avatar = profileData.avatar;
    if (profileData.password) {
      updates.password = dcodeIO.bcrypt.hashSync(profileData.password, 10);
    }

    const result = await supabaseFetch(`/rest/v1/users?id=eq.${userId}`, 'PATCH', updates);
    const user = result[0];

    return {
      success: true,
      message: 'Perfil actualizado exitosamente.',
      user: {
        _id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone || '',
        address: user.address || '',
        avatar: user.avatar || '',
        createdAt: user.created_at
      }
    };
  },

  // Categories CRUD
  getCategories: async () => {
    if (!hasSupabase) {
      return localDBRequest('/categories', { method: 'GET' });
    }
    const list = await supabaseFetch('/rest/v1/categories?order=name.asc', 'GET');
    return {
      success: true,
      categories: list.map(c => ({
        _id: c.id,
        name: c.name,
        description: c.description || '',
        active: c.active,
        createdAt: c.created_at
      }))
    };
  },

  createCategory: async (catData) => {
    if (!hasSupabase) {
      return localDBRequest('/categories', { method: 'POST', body: catData });
    }
    const catId = 'cat_' + Math.random().toString(36).substr(2, 9);
    const result = await supabaseFetch('/rest/v1/categories', 'POST', {
      id: catId,
      name: catData.name,
      description: catData.description || '',
      active: true
    });
    return {
      success: true,
      message: 'Categoría creada exitosamente.',
      category: {
        _id: result[0].id,
        name: result[0].name,
        description: result[0].description || '',
        active: result[0].active,
        createdAt: result[0].created_at
      }
    };
  },

  updateCategory: async (id, catData) => {
    if (!hasSupabase) {
      return localDBRequest(`/categories/${id}`, { method: 'PUT', body: catData });
    }
    const updates = {};
    if (catData.name) updates.name = catData.name;
    if (catData.description !== undefined) updates.description = catData.description;
    if (catData.active !== undefined) updates.active = catData.active;

    const result = await supabaseFetch(`/rest/v1/categories?id=eq.${id}`, 'PATCH', updates);
    return {
      success: true,
      message: 'Categoría actualizada exitosamente.',
      category: {
        _id: result[0].id,
        name: result[0].name,
        description: result[0].description || '',
        active: result[0].active,
        createdAt: result[0].created_at
      }
    };
  },

  deleteCategory: async (id) => {
    if (!hasSupabase) {
      return localDBRequest(`/categories/${id}`, { method: 'DELETE' });
    }
    // Validate if any products refer to this category
    const catList = await supabaseFetch(`/rest/v1/categories?id=eq.${id}`, 'GET');
    const cat = catList[0];
    if (cat) {
      const prodCheck = await supabaseFetch(`/rest/v1/products?category=eq.${encodeURIComponent(cat.name)}`, 'GET');
      if (prodCheck.length > 0) {
        throw new Error('No se puede eliminar la categoría porque contiene productos asociados.');
      }
    }
    await supabaseFetch(`/rest/v1/categories?id=eq.${id}`, 'DELETE');
    return { success: true, message: 'Categoría eliminada exitosamente.' };
  },

  // Products CRUD
  getProducts: async (params = {}) => {
    if (!hasSupabase) {
      return localDBRequest('/products', { method: 'GET', searchParams: params });
    }

    let query = '';
    const filters = [];
    
    if (params.all !== 'true') {
      filters.push('active=eq.true');
    }
    if (params.category) {
      filters.push(`category=eq.${encodeURIComponent(params.category)}`);
    }
    if (params.search) {
      const escaped = encodeURIComponent(params.search);
      filters.push(`or=(name.ilike.%${escaped}%,description.ilike.%${escaped}%)`);
    }
    if (params.minPrice) {
      filters.push(`price=gte.${params.minPrice}`);
    }
    if (params.maxPrice) {
      filters.push(`price=lte.${params.maxPrice}`);
    }

    let sortParam = 'order=created_at.desc';
    if (params.sort === 'price-asc') sortParam = 'order=price.asc';
    else if (params.sort === 'price-desc') sortParam = 'order=price.desc';

    const filterString = filters.length > 0 ? `&${filters.join('&')}` : '';
    const list = await supabaseFetch(`/rest/v1/products?${sortParam}${filterString}`, 'GET');

    return {
      success: true,
      count: list.length,
      products: list.map(p => ({
        _id: p.id,
        name: p.name,
        description: p.description || '',
        price: Number(p.price),
        stock: Number(p.stock),
        category: p.category,
        imageUrl: p.image_url || '',
        active: p.active,
        createdAt: p.created_at
      }))
    };
  },

  getProduct: async (id) => {
    if (!hasSupabase) {
      return localDBRequest(`/products/${id}`, { method: 'GET' });
    }
    const list = await supabaseFetch(`/rest/v1/products?id=eq.${id}`, 'GET');
    const p = list[0];
    if (!p) throw new Error('Producto no encontrado.');

    return {
      success: true,
      product: {
        _id: p.id,
        name: p.name,
        description: p.description || '',
        price: Number(p.price),
        stock: Number(p.stock),
        category: p.category,
        imageUrl: p.image_url || '',
        active: p.active,
        createdAt: p.created_at
      }
    };
  },

  createProduct: async (productData) => {
    if (!hasSupabase) {
      return localDBRequest('/products', { method: 'POST', body: productData });
    }
    const prodId = 'prod_' + Math.random().toString(36).substr(2, 9);
    const result = await supabaseFetch('/rest/v1/products', 'POST', {
      id: prodId,
      name: productData.name,
      description: productData.description || '',
      price: Number(productData.price),
      stock: Number(productData.stock),
      category: productData.category,
      image_url: productData.imageUrl || '',
      active: productData.active !== undefined ? productData.active : true
    });
    const p = result[0];
    return {
      success: true,
      message: 'Producto creado exitosamente.',
      product: {
        _id: p.id,
        name: p.name,
        description: p.description || '',
        price: Number(p.price),
        stock: Number(p.stock),
        category: p.category,
        imageUrl: p.image_url || '',
        active: p.active,
        createdAt: p.created_at
      }
    };
  },

  updateProduct: async (id, productData) => {
    if (!hasSupabase) {
      return localDBRequest(`/products/${id}`, { method: 'PUT', body: productData });
    }
    const updates = {};
    if (productData.name) updates.name = productData.name;
    if (productData.description !== undefined) updates.description = productData.description;
    if (productData.price !== undefined) updates.price = Number(productData.price);
    if (productData.stock !== undefined) updates.stock = Number(productData.stock);
    if (productData.category) updates.category = productData.category;
    if (productData.imageUrl !== undefined) updates.image_url = productData.imageUrl;
    if (productData.active !== undefined) updates.active = productData.active;

    const result = await supabaseFetch(`/rest/v1/products?id=eq.${id}`, 'PATCH', updates);
    const p = result[0];
    return {
      success: true,
      message: 'Producto actualizado exitosamente.',
      product: {
        _id: p.id,
        name: p.name,
        description: p.description || '',
        price: Number(p.price),
        stock: Number(p.stock),
        category: p.category,
        imageUrl: p.image_url || '',
        active: p.active,
        createdAt: p.created_at
      }
    };
  },

  deleteProduct: async (id) => {
    if (!hasSupabase) {
      return localDBRequest(`/products/${id}`, { method: 'DELETE' });
    }
    await supabaseFetch(`/rest/v1/products?id=eq.${id}`, 'DELETE');
    return { success: true, message: 'Producto eliminado exitosamente.' };
  },

  // Orders Operations
  createOrder: async (orderData) => {
    if (!hasSupabase) {
      return localDBRequest('/orders', { method: 'POST', body: orderData });
    }
    const userId = localStorage.getItem('petshop_token');
    const user = JSON.parse(localStorage.getItem('petshop_user') || '{}');

    // 1. Fetch products to verify stock and calculate total
    let total = 0;
    const validatedItems = [];
    
    for (let item of orderData.items) {
      const prodList = await supabaseFetch(`/rest/v1/products?id=eq.${item.productId}`, 'GET');
      const prod = prodList[0];
      if (!prod) throw new Error('Producto no encontrado en inventario.');
      if (prod.stock < item.quantity) {
        throw new Error(`Stock insuficiente para "${prod.name}".`);
      }
      
      // Deduct stock in Supabase
      const updatedStock = prod.stock - item.quantity;
      await supabaseFetch(`/rest/v1/products?id=eq.${prod.id}`, 'PATCH', { stock: updatedStock });
      
      total += Number(prod.price) * item.quantity;
      validatedItems.push({
        productId: prod.id,
        name: prod.name,
        price: Number(prod.price),
        quantity: item.quantity,
        imageUrl: prod.image_url
      });
    }

    // 2. Insert main order
    const orderId = 'ord_' + Math.random().toString(36).substr(2, 9);
    const orderRes = await supabaseFetch('/rest/v1/orders', 'POST', {
      id: orderId,
      user_id: userId,
      client_name: user.name,
      client_email: user.email,
      total: Number(total.toFixed(2)),
      shipping_address: orderData.shippingAddress,
      phone: orderData.phone,
      payment_method: orderData.paymentMethod || 'Tarjeta de Crédito',
      status: 'Pendiente'
    });
    const order = orderRes[0];

    // 3. Insert order_items
    for (let item of validatedItems) {
      await supabaseFetch('/rest/v1/order_items', 'POST', {
        order_id: order.id,
        product_id: item.productId,
        name: item.name,
        price: item.price,
        quantity: item.quantity,
        image_url: item.imageUrl
      });
    }

    // 4. Insert order_status_history
    await supabaseFetch('/rest/v1/order_status_history', 'POST', {
      order_id: order.id,
      status: 'Pendiente',
      comment: 'El pedido fue recibido y está en espera de procesamiento.'
    });

    return {
      success: true,
      message: '¡Pedido realizado exitosamente! Tu compra está siendo procesada.',
      order: {
        _id: order.id,
        userId: order.user_id,
        clientName: order.client_name,
        clientEmail: order.client_email,
        total: Number(order.total),
        shippingAddress: order.shipping_address,
        phone: order.phone,
        paymentMethod: order.payment_method,
        status: order.status,
        createdAt: order.created_at,
        items: validatedItems,
        statusHistory: [{ status: 'Pendiente', date: order.created_at, comment: 'El pedido fue recibido y está en espera de procesamiento.' }]
      }
    };
  },

  getMyOrders: async () => {
    if (!hasSupabase) {
      return localDBRequest('/orders/my', { method: 'GET' });
    }
    const userId = localStorage.getItem('petshop_token');
    const orderList = await supabaseFetch(`/rest/v1/orders?user_id=eq.${userId}&order=created_at.desc`, 'GET');

    const populatedOrders = [];
    for (let o of orderList) {
      const items = await supabaseFetch(`/rest/v1/order_items?order_id=eq.${o.id}`, 'GET');
      const history = await supabaseFetch(`/rest/v1/order_status_history?order_id=eq.${o.id}&order=date.asc`, 'GET');
      
      populatedOrders.push({
        _id: o.id,
        userId: o.user_id,
        clientName: o.client_name,
        clientEmail: o.client_email,
        total: Number(o.total),
        shippingAddress: o.shipping_address,
        phone: o.phone,
        paymentMethod: o.payment_method,
        status: o.status,
        createdAt: o.created_at,
        items: items.map(i => ({
          productId: i.product_id,
          name: i.name,
          price: Number(i.price),
          quantity: Number(i.quantity),
          imageUrl: i.image_url || ''
        })),
        statusHistory: history.map(h => ({
          status: h.status,
          date: h.date,
          comment: h.comment || ''
        }))
      });
    }

    return { success: true, orders: populatedOrders };
  },

  getOrder: async (id) => {
    if (!hasSupabase) {
      return localDBRequest(`/orders/${id}`, { method: 'GET' });
    }
    const orderList = await supabaseFetch(`/rest/v1/orders?id=eq.${id}`, 'GET');
    const o = orderList[0];
    if (!o) throw new Error('Pedido no encontrado.');

    const items = await supabaseFetch(`/rest/v1/order_items?order_id=eq.${o.id}`, 'GET');
    const history = await supabaseFetch(`/rest/v1/order_status_history?order_id=eq.${o.id}&order=date.asc`, 'GET');

    return {
      success: true,
      order: {
        _id: o.id,
        userId: o.user_id,
        clientName: o.client_name,
        clientEmail: o.client_email,
        total: Number(o.total),
        shippingAddress: o.shipping_address,
        phone: o.phone,
        paymentMethod: o.payment_method,
        status: o.status,
        createdAt: o.created_at,
        items: items.map(i => ({
          productId: i.product_id,
          name: i.name,
          price: Number(i.price),
          quantity: Number(i.quantity),
          imageUrl: i.image_url || ''
        })),
        statusHistory: history.map(h => ({
          status: h.status,
          date: h.date,
          comment: h.comment || ''
        }))
      }
    };
  },

  getAllOrders: async () => {
    if (!hasSupabase) {
      return localDBRequest('/orders', { method: 'GET' });
    }
    const orderList = await supabaseFetch('/rest/v1/orders?order=created_at.desc', 'GET');

    const populatedOrders = [];
    for (let o of orderList) {
      const items = await supabaseFetch(`/rest/v1/order_items?order_id=eq.${o.id}`, 'GET');
      const history = await supabaseFetch(`/rest/v1/order_status_history?order_id=eq.${o.id}&order=date.asc`, 'GET');
      
      populatedOrders.push({
        _id: o.id,
        userId: o.user_id,
        clientName: o.client_name,
        clientEmail: o.client_email,
        total: Number(o.total),
        shippingAddress: o.shipping_address,
        phone: o.phone,
        paymentMethod: o.payment_method,
        status: o.status,
        createdAt: o.created_at,
        items: items.map(i => ({
          productId: i.product_id,
          name: i.name,
          price: Number(i.price),
          quantity: Number(i.quantity),
          imageUrl: i.image_url || ''
        })),
        statusHistory: history.map(h => ({
          status: h.status,
          date: h.date,
          comment: h.comment || ''
        }))
      });
    }

    return { success: true, count: populatedOrders.length, orders: populatedOrders };
  },

  updateOrderStatus: async (id, status, comment) => {
    if (!hasSupabase) {
      return localDBRequest(`/orders/${id}`, { method: 'PUT', body: { status, comment } });
    }

    const orderList = await supabaseFetch(`/rest/v1/orders?id=eq.${id}`, 'GET');
    const order = orderList[0];
    if (!order) throw new Error('Pedido no encontrado.');

    // Stock recovery if order gets canceled
    if (status === 'Cancelado' && order.status !== 'Cancelado') {
      const items = await supabaseFetch(`/rest/v1/order_items?order_id=eq.${order.id}`, 'GET');
      for (let item of items) {
        const prodList = await supabaseFetch(`/rest/v1/products?id=eq.${item.product_id}`, 'GET');
        const prod = prodList[0];
        if (prod) {
          await supabaseFetch(`/rest/v1/products?id=eq.${prod.id}`, 'PATCH', { stock: prod.stock + item.quantity });
        }
      }
    }

    // Update status in orders table
    await supabaseFetch(`/rest/v1/orders?id=eq.${id}`, 'PATCH', { status });

    // Append to status history
    await supabaseFetch('/rest/v1/order_status_history', 'POST', {
      order_id: id,
      status,
      comment: comment || `Estado del pedido cambiado a: ${status}`
    });

    return {
      success: true,
      message: `El pedido fue actualizado a "${status}" exitosamente.`
    };
  },

  // Admin Actions & Dashboard
  getStats: async () => {
    if (!hasSupabase) {
      return localDBRequest('/admin/stats', { method: 'GET' });
    }

    const orders = await supabaseFetch('/rest/v1/orders', 'GET');
    const products = await supabaseFetch('/rest/v1/products', 'GET');
    const users = await supabaseFetch('/rest/v1/users', 'GET');
    const categories = await supabaseFetch('/rest/v1/categories', 'GET');

    let totalSales = 0;
    let pendingSales = 0;
    
    orders.forEach(order => {
      if (order.status === 'Entregado') {
        totalSales += Number(order.total);
      } else if (order.status !== 'Cancelado') {
        pendingSales += Number(order.total);
      }
    });

    const lowStockProducts = products.filter(p => p.stock <= 3).map(p => ({
      _id: p.id,
      name: p.name,
      stock: p.stock,
      price: p.price
    }));

    const statusCounts = { Pendiente: 0, Enviado: 0, Entregado: 0, Cancelado: 0 };
    orders.forEach(order => {
      if (statusCounts[order.status] !== undefined) {
        statusCounts[order.status]++;
      }
    });

    const recentOrders = orders.slice(0, 5).map(o => ({
      _id: o.id,
      clientName: o.client_name,
      total: Number(o.total),
      status: o.status,
      createdAt: o.created_at
    }));

    return {
      success: true,
      stats: {
        totalOrders: orders.length,
        totalProducts: products.length,
        totalUsers: users.length,
        totalCategories: categories.length,
        totalSales: Number(totalSales.toFixed(2)),
        pendingSales: Number(pendingSales.toFixed(2)),
        lowStockAlertCount: lowStockProducts.length,
        lowStockProducts,
        statusCounts,
        recentOrders
      }
    };
  },

  getUsers: async () => {
    if (!hasSupabase) {
      return localDBRequest('/admin/users', { method: 'GET' });
    }
    const list = await supabaseFetch('/rest/v1/users?order=created_at.desc', 'GET');
    return {
      success: true,
      users: list.map(u => ({
        _id: u.id,
        name: u.name,
        email: u.email,
        role: u.role,
        phone: u.phone || '',
        address: u.address || '',
        createdAt: u.created_at
      }))
    };
  },

  updateUserRole: async (id, role) => {
    if (!hasSupabase) {
      return localDBRequest(`/admin/users/${id}/role`, { method: 'PUT', body: { role } });
    }
    await supabaseFetch(`/rest/v1/users?id=eq.${id}`, 'PATCH', { role });
    return { success: true, message: `Rol del usuario actualizado a ${role} exitosamente.` };
  },

  deleteUser: async (id) => {
    if (!hasSupabase) {
      return localDBRequest(`/admin/users/${id}`, { method: 'DELETE' });
    }
    await supabaseFetch(`/rest/v1/users?id=eq.${id}`, 'DELETE');
    return { success: true, message: 'Usuario eliminado exitosamente.' };
  }
};
