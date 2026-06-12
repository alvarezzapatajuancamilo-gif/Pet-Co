# PetShop Virtual 🐾

Una tienda virtual de mascotas moderna, responsiva y **100% Serverless SPA (Single Page Application)**. La aplicación se ejecuta directamente desde el navegador (por ejemplo, con **Live Server**) y cuenta con gestión de usuarios (roles Cliente/Administrador), catálogo dinámico de productos, carrito de compras y panel de administración interactivo.

---

## 🚀 Arquitectura Serverless y Doble Modo

Este proyecto no requiere de ningún servidor Node.js/Express corriendo en segundo plano ni de instalaciones locales complejas. Se diseñó para funcionar de forma híbrida:

1. **Modo Offline (LocalStorage) [Por Defecto]**:
   - Ideal para pruebas inmediatas y desarrollo local sin Internet.
   - Si no se configuran credenciales de Supabase, la aplicación simula por completo una base de datos relacional y autenticación segura con `bcryptjs` directamente en el navegador, guardando la información en el `localStorage` del cliente.
   - Se auto-inicializa con 10 categorías, 12 productos del catálogo, 2 pedidos de muestra y cuentas de prueba pre-creadas en la primera carga.

2. **Modo Online (Supabase Directo)**:
   - Persistencia real en la nube conectando el navegador directamente a los endpoints REST de **Supabase** mediante peticiones HTTP asíncronas (`fetch`).
   - La validación y registro de usuarios se realiza mediante cifrado bcrypt ejecutado en el cliente antes de interactuar con la base de datos PostgreSQL de Supabase.

---

## 🛠️ Estructura del Proyecto

El código fuente está estructurado de manera simple y organizada en la carpeta `public/`:

```text
├── public/                 # Archivos estáticos del Frontend (SPA)
│   ├── css/
│   │   └── index.css       # Estilos CSS personalizados (variables, transiciones y HSL)
│   ├── js/
│   │   ├── api.js          # Adaptador híbrido (LocalStorage / Supabase Fetch REST)
│   │   ├── app.js          # Ruteador SPA, manejo de estados y renderizado
│   │   ├── config.js       # Archivo de configuración para las credenciales de Supabase
│   │   └── ui.js           # Utilidades UI (notificaciones Toasts, alertas)
│   └── index.html          # HTML5 semántico (Bootstrap 5, bcryptjs CDN, contenedor principal)
├── schema.sql              # Estructura de tablas y datos de inicialización para Supabase
└── README.md               # Este documento de documentación
```

---

## 📦 Ejecución de la Aplicación

Dado que es una SPA estática, no se requiere Node.js ni comandos de instalación en la terminal.

1. **Requisito**: Tener instalado el editor **VS Code**.
2. **Instalación de Extensión**: Instale la extensión **Live Server** (creada por Ritwick Dey) en VS Code.
3. **Inicio**:
   - Abra la carpeta del proyecto en VS Code (`c:\Users\ADSO\Desktop\Pet & Co`).
   - Haga clic derecho sobre [public/index.html](file:///c:/Users/ADSO/Desktop/Pet%20&%20Co/public/index.html) y seleccione **Open with Live Server**.
   - El sitio se abrirá automáticamente en su navegador (usualmente en la dirección `http://127.0.0.1:5500/public/index.html`).

---

## 💾 Cuentas de Prueba Pre-Creadas

Tanto en **Modo Offline** (auto-generado al iniciar) como en **Modo Online** (insertado a través de SQL), dispone de las siguientes cuentas de prueba:

* **Cuenta de Administrador**:
  * **Correo**: `admin@petshop.com`
  * **Contraseña**: `admin123`
* **Cuenta de Cliente**:
  * **Correo**: `cliente@petshop.com`
  * **Contraseña**: `cliente123`

---

## ☁️ Conexión con la Base de Datos (Supabase)

Si desea probar el **Modo Online** con persistencia real en la nube:

1. **Crear Proyecto**: Regístrese y cree un proyecto gratis en [Supabase](https://supabase.com/).
2. **Crear y Poblar Tablas**:
   - Vaya a la sección **SQL Editor** en la consola web de su proyecto de Supabase.
   - Haga clic en **New Query**.
   - Copie todo el contenido del archivo [schema.sql](file:///c:/Users/ADSO/Desktop/Pet%20&%20Co/schema.sql) de este proyecto, péguelo en el editor de Supabase y haga clic en **Run**.
   - Esto creará la estructura de tablas (`categories`, `users`, `products`, `orders`, `order_items`, `order_status_history`) e insertará los datos semilla iniciales de categorías, productos, usuarios y pedidos.
3. **Deshabilitar RLS o Configurar Políticas (Recomendado para pruebas)**:
   - Dado que el cliente se comunica directamente con la API REST sin backend intermedio, asegúrese de deshabilitar la seguridad de nivel de fila (RLS) en sus tablas de Supabase en **Database > Tables** (o configure políticas `ALL` permisivas para el rol `anon`), para que el navegador pueda insertar y consultar de forma directa.
4. **Obtener Credenciales**:
   - En Supabase, vaya a **Project Settings > API**.
   - Copie la **Project URL** y la clave **anon (public)**.
5. **Configurar el Cliente**:
   - Abra el archivo [public/js/config.js](file:///c:/Users/ADSO/Desktop/Pet%20&%20Co/public/js/config.js).
   - Introduzca sus credenciales:
     ```javascript
     export const SUPABASE_CONFIG = {
       url: 'https://tu-proyecto.supabase.co',
       anonKey: 'tu-anon-key-aqui'
     };
     ```
   - Guarde el archivo y recargue el navegador. La consola web indicará que el modo activo ahora es: `%c PetShop Virtual - Modo activo: ONLINE (SUPABASE DIRECTO)`.

---

## 👥 Roles y Permisos Implementados

### 👔 Administrador
- **Estadísticas de Negocio**: Visualización en tiempo real de ingresos totales (pedidos entregados), ingresos pendientes, recuentos de categorías, productos, clientes, pedidos y alerta rápida de productos con bajo inventario (stock <= 3).
- **Gestor de Catálogo**: Crear, editar y desactivar categorías y productos.
- **Gestión de Pedidos**: Listado global de pedidos realizados, actualización de estado (`Pendiente`, `Enviado`, `Entregado`, `Cancelado`) y agregación de comentarios en el historial del pedido.
- **Gestión de Usuarios**: Visualizar usuarios registrados, cambiar roles entre Cliente/Administrador y eliminar usuarios.

### 👤 Cliente
- **Registro y Acceso**: Formulario de creación de cuenta y login integrado con validación de hashes bcrypt.
- **Perfil**: Actualización de datos de contacto (teléfono, dirección predeterminada de despacho y enlace de avatar).
- **Catálogo Interactivo**: Búsqueda por palabras clave, filtros por categoría e intervalo de precios, y ordenamiento por novedades y precios.
- **Carrito de Compras**: Añadir, modificar cantidades y remover artículos con persistencia automatizada en el dispositivo.
- **Checkout Express**: Confirmación de dirección, teléfono, método de pago y procesamiento de pedido (descontando stock).
- **Historial de Compras**: Línea de tiempo interactiva que muestra el progreso del pedido y los comentarios del administrador en tiempo real.
