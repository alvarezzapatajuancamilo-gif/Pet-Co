-- Esquema de Base de Datos para PetShop Virtual (Supabase PostgreSQL)

-- 1. Tabla de Categorías (categories)
CREATE TABLE IF NOT EXISTS categories (
    id VARCHAR(50) PRIMARY KEY DEFAULT 'cat_' || substring(md5(random()::text) from 1 for 9),
    name VARCHAR(255) NOT NULL UNIQUE,
    description TEXT,
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Tabla de Usuarios (users)
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(50) PRIMARY KEY DEFAULT 'usr_' || substring(md5(random()::text) from 1 for 9),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(50) DEFAULT 'Cliente' CHECK (role IN ('Cliente', 'Administrador')),
    phone VARCHAR(50),
    address VARCHAR(255),
    avatar VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. Tabla de Productos (products)
CREATE TABLE IF NOT EXISTS products (
    id VARCHAR(50) PRIMARY KEY DEFAULT 'prod_' || substring(md5(random()::text) from 1 for 9),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    price NUMERIC(10,2) NOT NULL DEFAULT 0.00,
    stock INTEGER NOT NULL DEFAULT 0,
    category VARCHAR(255) NOT NULL REFERENCES categories(name) ON UPDATE CASCADE,
    image_url VARCHAR(255),
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. Tabla de Pedidos (orders)
CREATE TABLE IF NOT EXISTS orders (
    id VARCHAR(50) PRIMARY KEY DEFAULT 'ord_' || substring(md5(random()::text) from 1 for 9),
    user_id VARCHAR(50) REFERENCES users(id) ON DELETE SET NULL,
    client_name VARCHAR(255) NOT NULL,
    client_email VARCHAR(255) NOT NULL,
    total NUMERIC(10,2) NOT NULL DEFAULT 0.00,
    shipping_address VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    payment_method VARCHAR(100) DEFAULT 'Tarjeta de Crédito',
    status VARCHAR(50) DEFAULT 'Pendiente' CHECK (status IN ('Pendiente', 'Enviado', 'Entregado', 'Cancelado')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 5. Tabla de Artículos del Pedido (order_items)
CREATE TABLE IF NOT EXISTS order_items (
    id SERIAL PRIMARY KEY,
    order_id VARCHAR(50) NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    product_id VARCHAR(50),
    name VARCHAR(255) NOT NULL,
    price NUMERIC(10,2) NOT NULL,
    quantity INTEGER NOT NULL,
    image_url VARCHAR(255)
);

-- 6. Tabla de Historial de Estados del Pedido (order_status_history)
CREATE TABLE IF NOT EXISTS order_status_history (
    id SERIAL PRIMARY KEY,
    order_id VARCHAR(50) NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    status VARCHAR(50) NOT NULL CHECK (status IN ('Pendiente', 'Enviado', 'Entregado', 'Cancelado')),
    date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    comment TEXT
);

-- ==========================================
-- DATOS DE PRUEBA (SEED DATA)
-- ==========================================

-- 1. Insertar Categorías de Prueba
INSERT INTO categories (id, name, description, active) VALUES
('cat_perros', 'Alimentos para perros', 'Comida seca, húmeda y snacks premium para perros.', true),
('cat_gatos', 'Alimentos para gatos', 'Comida seca, húmeda y snacks premium para gatos.', true),
('cat_juguetes', 'Juguetes', 'Juguetes interactivos, de goma, peluches y rasguñadores.', true),
('cat_accs', 'Accesorios', 'Collares, correas, arneses, platos y comederos.', true),
('cat_higiene', 'Higiene y cuidado', 'Shampoos, cepillos, antipulgas y arenas sanitarias.', true),
('cat_meds', 'Medicamentos', 'Suplementos vitamínicos, desparasitantes y medicamentos básicos.', true),
('cat_camas', 'Camas y transportadoras', 'Camas acolchadas, colchonetas y bolsos de viaje.', true),
('cat_peces', 'Acuarios y peces', 'Alimento para peces, filtros, peceras y decoración.', true),
('cat_aves', 'Aves', 'Jaulas, alimento balanceado, juguetes y nidos.', true),
('cat_roedores', 'Roedores', 'Alimento, viruta, jaulas y juguetes para hámsters y cobayas.', true)
ON CONFLICT (name) DO NOTHING;

-- 2. Insertar Usuarios de Prueba
-- Las contraseñas en hash corresponden a:
--   - admin@petshop.com -> admin123
--   - cliente@petshop.com -> cliente123
INSERT INTO users (id, name, email, password, role, phone, address, avatar) VALUES
('usr_admin1', 'Administrador PetShop', 'admin@petshop.com', '$2a$10$vWd0nBvTusq7qZ65j3JbI.xWq7hW7725y0/9yY92k2.Z7k3z5z85C', 'Administrador', '555-0199', 'Av. Mascotas 123, Central Pet', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop'),
('usr_client1', 'Juan Pérez', 'cliente@petshop.com', '$2a$10$T1Kq21hD69xT3bW5n5b3e.M21jW9y/Zq1qW3eE8y9k6t5z43m7wYm', 'Cliente', '555-0144', 'Calle Falsa 123, Depto 4B', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop')
ON CONFLICT (email) DO NOTHING;

-- 3. Insertar Productos de Prueba
INSERT INTO products (id, name, description, price, stock, category, image_url, active) VALUES
('prod_1', 'Croquetas Premium Perro Adulto', 'Alimento premium balanceado para perros adultos de raza mediana a grande. Bolsa de 15kg. Rico en proteínas.', 45.99, 25, 'Alimentos para perros', 'https://images.unsplash.com/photo-1589924691995-400dc9ecc119?w=500&auto=format&fit=crop', true),
('prod_2', 'Lata Comida Húmeda de Salmón Gato', 'Alimento húmedo gourmet para gatos adultos sabor salmón. Deliciosa textura en paté rica en omega 3. Lata de 85g.', 1.89, 120, 'Alimentos para gatos', 'https://images.unsplash.com/photo-1569591159212-b02ea8a9f239?w=500&auto=format&fit=crop', true),
('prod_3', 'Pelota de Goma Ultra Resistente', 'Juguete interactivo para perros. Bota alto y es ideal para morder. Ayuda a limpiar los dientes de tu mascota.', 8.50, 45, 'Juguetes', 'https://images.unsplash.com/photo-1576201836106-db1758fd1c97?w=500&auto=format&fit=crop', true),
('prod_4', 'Árbol Rascador para Gatos Multinivel', 'Rascador de 120cm de altura con plataformas para siesta, cueva acogedora y postes forrados en yute para afilar garras.', 59.99, 8, 'Juguetes', 'https://images.unsplash.com/photo-1545249390-6bdfa286032f?w=500&auto=format&fit=crop', true),
('prod_5', 'Arnés de Nylon Ajustable Reflectante', 'Arnés ergonómico para pasear perros medianos. Costuras reflectantes para mayor seguridad durante paseos nocturnos.', 15.20, 30, 'Accesorios', 'https://images.unsplash.com/photo-1544568100-847a948585b9?w=500&auto=format&fit=crop', true),
('prod_6', 'Cama Ortopédica Premium Memory Foam', 'Cama acolchada de espuma viscoelástica para perros medianos a grandes. Alivia el dolor de articulaciones. Funda lavable.', 38.50, 15, 'Camas y transportadoras', 'https://images.unsplash.com/photo-1541599540903-216a46ca1ad0?w=500&auto=format&fit=crop', true),
('prod_7', 'Filtro para Acuario Cascada Silencioso', 'Filtro colgante de mochila para acuarios de hasta 60 litros. Filtración física, química y biológica eficiente.', 22.99, 12, 'Acuarios y peces', 'https://images.unsplash.com/photo-1522069169874-c58ec4b76be5?w=500&auto=format&fit=crop', true),
('prod_8', 'Shampoo de Avena Orgánica e Hipoalergénico', 'Fórmula suave para pieles sensibles y con picazón. Limpia, acondiciona y humecta el pelaje de perros y gatos.', 9.99, 2, 'Higiene y cuidado', 'https://images.unsplash.com/photo-1516733725897-1aa73b87c8e8?w=500&auto=format&fit=crop', true),
('prod_9', 'Jaula Espaciosa para Canarios y Aves', 'Jaula metálica con bandejas extraíbles de limpieza fácil, perchas de madera y comederos incluidos. Medidas: 50x30x40cm.', 27.50, 6, 'Aves', 'https://images.unsplash.com/photo-1452570053594-1b985d6ea890?w=500&auto=format&fit=crop', true),
('prod_10', 'Rueda de Ejercicio para Hámster Silenciosa', 'Rueda giratoria de acrílico transparente para hámsters y pequeños roedores. Rodamiento silencioso que no perturba el sueño.', 6.40, 20, 'Roedores', 'https://images.unsplash.com/photo-1548767797-d8c844163c4c?w=500&auto=format&fit=crop', true),
('prod_11', 'Snacks Dentales para Perro (Bolsa)', 'Golosinas masticables diarias para reducir el sarro y mal aliento en perros pequeños. Bolsa con 14 unidades.', 4.99, 65, 'Alimentos para perros', 'https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?w=500&auto=format&fit=crop', true),
('prod_12', 'Suplemento Multivitamínico Mascotas', 'Jarabe concentrado con vitaminas A, D, E y complejo B para fortalecer el sistema inmune de cachorros y gatitos.', 11.50, 1, 'Medicamentos', 'https://images.unsplash.com/photo-1584017911766-d451b3d0e843?w=500&auto=format&fit=crop', true)
ON CONFLICT (id) DO NOTHING;

-- 4. Insertar Pedidos de Prueba
INSERT INTO orders (id, user_id, client_name, client_email, total, shipping_address, phone, payment_method, status, created_at) VALUES
('ord_sample1', 'usr_client1', 'Juan Pérez', 'cliente@petshop.com', 62.99, 'Calle Falsa 123, Depto 4B', '555-0144', 'Tarjeta de Crédito', 'Entregado', NOW() - INTERVAL '3 days'),
('ord_sample2', 'usr_client1', 'Juan Pérez', 'cliente@petshop.com', 38.50, 'Calle Falsa 123, Depto 4B', '555-0144', 'Transferencia Bancaria', 'Pendiente', NOW())
ON CONFLICT (id) DO NOTHING;

-- 5. Insertar Detalles de Pedidos de Prueba
INSERT INTO order_items (order_id, product_id, name, price, quantity, image_url) VALUES
('ord_sample1', 'prod_1', 'Croquetas Premium Perro Adulto', 45.99, 1, 'https://images.unsplash.com/photo-1589924691995-400dc9ecc119?w=500&auto=format&fit=crop'),
('ord_sample1', 'prod_3', 'Pelota de Goma Ultra Resistente', 8.50, 2, 'https://images.unsplash.com/photo-1576201836106-db1758fd1c97?w=500&auto=format&fit=crop'),
('ord_sample2', 'prod_6', 'Cama Ortopédica Premium Memory Foam', 38.50, 1, 'https://images.unsplash.com/photo-1541599540903-216a46ca1ad0?w=500&auto=format&fit=crop')
ON CONFLICT DO NOTHING; -- order_items uses SERIAL primary key so no conflict on PK but it is good to avoid errors if repeated

-- 6. Insertar Historial de Estados de Pedidos de Prueba
INSERT INTO order_status_history (order_id, status, date, comment) VALUES
('ord_sample1', 'Pendiente', NOW() - INTERVAL '3 days', 'Pedido creado exitosamente.'),
('ord_sample1', 'Enviado', NOW() - INTERVAL '2 days', 'Envío realizado por Servientrega. Guía #12345'),
('ord_sample1', 'Entregado', NOW() - INTERVAL '1 day', 'Entregado en puerta, firmado por el cliente.'),
('ord_sample2', 'Pendiente', NOW(), 'Pedido recibido, en espera de comprobante de pago.');
