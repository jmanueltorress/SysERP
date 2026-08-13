# SystemaWeb ERP

Sistema ERP web desarrollado para centralizar y automatizar procesos administrativos y operativos de una empresa dedicada a la fabricación y comercialización de muebles, productos personalizados y trabajos de producción.

El sistema está desarrollado con una arquitectura separada de **Frontend + Backend + Base de Datos**, permitiendo incorporar nuevos módulos e integraciones conforme avance el proyecto.

---

## Estado del proyecto

🚧 **En desarrollo**

Actualmente se está construyendo el MVP del sistema.

### Módulo de Compras

El módulo de compras es el primer flujo operativo implementado.

Flujo:

```text
Nueva orden
    ↓
Borrador
    ├── Editar
    └── Solicitar
           ↓
       Solicitada
        ├── Aceptar
        │      ↓
        │  Confirmada
        │      ↓
        │  Recepción
        │    ├── Parcial
        │    └── Recibida
        │
        └── Rechazar
               ↓
           Rechazada
```

Actualmente incluye:

- Creación de órdenes de compra.
- Folio automático.
- Selección de proveedor.
- Selección de productos.
- Cantidades y precios de compra.
- Cálculo de subtotal.
- IVA.
- Total.
- Estado inicial `Borrador`.
- Edición de órdenes en borrador.
- Solicitud de autorización.
- Aceptación y rechazo.
- Recepción de mercancía.
- Recepciones parciales.
- Actualización automática de inventario.
- Registro de movimientos de inventario.
- Historial de compras.
- Filtros por estado.
- Consulta del detalle de cada orden.

---

# Tecnologías

## Frontend

- Vue 3
- Vite
- TypeScript / JavaScript
- Vue Router
- Tailwind CSS
- TailAdmin
- Axios

## Backend

- Node.js
- Express
- JavaScript ES Modules
- MySQL2
- dotenv
- nodemon

## Base de datos

- MySQL

---

# Estructura del proyecto

```text
SystemaWeb/
│
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   ├── views/
│   │   ├── router/
│   │   ├── services/
│   │   └── ...
│   │
│   ├── package.json
│   ├── package-lock.json
│   └── .gitignore
│
├── backend/
│   ├── src/
│   │   ├── config/
│   │   ├── controllers/
│   │   ├── routes/
│   │   └── ...
│   │
│   ├── package.json
│   ├── package-lock.json
│   ├── .env
│   ├── .env.example
│   └── .gitignore
│
└── README.md
```

---

# Requisitos

Antes de ejecutar el proyecto es necesario tener instalado:

### Node.js

Se recomienda utilizar una versión LTS reciente.

Comprobar instalación:

```bash
node --version
npm --version
```

### MySQL

Se necesita un servidor MySQL para almacenar la información del ERP.

Comprobar:

```bash
mysql --version
```

También puede utilizarse:

- MySQL Workbench
- phpMyAdmin
- DBeaver
- Otro cliente compatible con MySQL

### Git

Comprobar:

```bash
git --version
```

---

# Instalación

## 1. Clonar el repositorio

```bash
git clone URL_DEL_REPOSITORIO
```

Entrar al proyecto:

```bash
cd SystemaWeb
```

---

## 2. Instalar frontend

Entrar a:

```bash
cd frontend
```

Instalar dependencias:

```bash
npm install
```

Iniciar Vite:

```bash
npm run dev
```

Normalmente el frontend estará disponible en:

```text
http://localhost:5173
```

---

## 3. Instalar backend

Desde la raíz:

```bash
cd backend
```

Instalar dependencias:

```bash
npm install
```

Ejecutar en desarrollo:

```bash
npm run dev
```

El API utiliza actualmente:

```text
http://localhost:3000
```

---

# Variables de entorno

El archivo real:

```text
backend/.env
```

**NO debe subirse al repositorio.**

Debe utilizarse un archivo:

```text
backend/.env.example
```

como referencia.

Ejemplo:

```env
PORT=3000

DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=
DB_NAME=systemaweb

FRONTEND_URL=http://localhost:5173
```

Cada desarrollador deberá crear su propio `.env`:

```text
.env.example
      ↓
    .env
```

y configurar sus credenciales locales.

---

# Base de datos

Base de datos principal:

```text
systemaweb
```

Entre las entidades contempladas actualmente se encuentran:

```text
roles
usuarios
clientes
proveedores
categorias
productos
producto_proveedores

inventario
movimientos_inventario

cotizaciones
cotizacion_detalles

pedidos
pedido_detalles

ordenes_compra
orden_compra_detalles

listas_materiales
lista_material_detalles

ordenes_fabricacion

entregas

reservas_inventario

fondos
movimientos_financieros
```

> Los nombres exactos deben mantenerse sincronizados con el esquema SQL vigente del proyecto.

---

# API

El backend expone una API REST.

Ejemplo:

```text
/api/compras
```

Endpoints principales implementados para Compras:

```text
GET    /api/compras
GET    /api/compras/:id

POST   /api/compras
PUT    /api/compras/:id

PUT    /api/compras/:id/solicitar
PUT    /api/compras/:id/confirmar
PUT    /api/compras/:id/rechazar
PUT    /api/compras/:id/cancelar

POST   /api/compras/:id/recepcion
```

Catálogos:

```text
GET /api/compras/catalogos/proveedores
GET /api/compras/catalogos/productos
```

---

# Módulos contemplados

La arquitectura está pensada para incorporar progresivamente:

- Dashboard
- Usuarios
- Roles y permisos
- Clientes
- Productos
- Proveedores
- Compras
- Inventario
- Cotizaciones
- Pedidos
- Producción
- Entregas
- Finanzas
- Reportes
- Notificaciones
- Configuración

---

# Flujo general proyectado

```text
Cliente
   ↓
Cotización
   ↓
Pedido
   ↓
Inventario
   ↓
Producción
   ↓
Entrega
```

Abastecimiento:

```text
Inventario / Necesidad
        ↓
      Compra
        ↓
    Proveedor
        ↓
    Recepción
        ↓
    Inventario
```

---

# Inventario

El inventario está diseñado para registrar movimientos y mantener trazabilidad.

Por ejemplo, al recibir una orden de compra:

```text
Orden Confirmada
       ↓
Recepción
       ↓
Movimiento de Entrada
       ↓
Inventario +
```

Las recepciones pueden ser parciales:

```text
Confirmada
    ↓
Recepción parcial
    ↓
Parcial
    ↓
Recepción restante
    ↓
Recibida
```

---

# Seguridad

Nunca deben subirse al repositorio:

```text
.env
node_modules/
contraseñas
tokens
credenciales
backups privados
logs con información sensible
```

Los archivos `.gitignore` del frontend y backend están configurados para excluir estos archivos.

---

# Desarrollo

Para trabajar con frontend y backend simultáneamente se pueden utilizar dos terminales.

Terminal 1:

```bash
cd frontend
npm run dev
```

Terminal 2:

```bash
cd backend
npm run dev
```

Arquitectura durante desarrollo:

```text
Vue / Vite
localhost:5173
      ↓
    Axios
      ↓
Express API
localhost:3000
      ↓
    MySQL
      ↓
 systemaweb
```

---

# Git

Antes de realizar cambios importantes se recomienda crear un commit.

Ejemplo:

```bash
git status
git add .
git commit -m "feat: descripcion del cambio"
```

Convención sugerida:

```text
feat: nueva funcionalidad
fix: corrección de error
refactor: reorganización de código
docs: documentación
style: cambios visuales
test: pruebas
chore: configuración o mantenimiento
```

---

# Próximos pasos

Entre las siguientes etapas del desarrollo se contemplan:

1. Completar usuarios, roles y permisos.
2. Integrar autenticación.
3. Consolidar inventario.
4. Desarrollar flujo de cotizaciones.
5. Integrar pedidos.
6. Integrar producción.
7. Integrar entregas.
8. Dashboard operativo.
9. Notificaciones.
10. Reportes y finanzas.

---

# Notas

Este proyecto se encuentra en desarrollo activo.

Los módulos, endpoints y estructura de base de datos pueden evolucionar conforme se incorporen nuevos procesos operativos.