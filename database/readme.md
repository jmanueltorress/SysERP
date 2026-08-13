# Base de Datos — SysERP

Base de datos MySQL utilizada por el sistema **SysERP**.

## Motor

- MySQL
- Charset recomendado: `utf8mb4`
- Collation: `utf8mb4_unicode_ci`

## Base de datos

```sql
systemaweb
```

---

## Instalación

Crear la base de datos:

```sql
CREATE DATABASE systemaweb
CHARACTER SET utf8mb4
COLLATE utf8mb4_unicode_ci;

USE systemaweb;
```

Si el repositorio contiene el archivo:

```text
database/systemaweb.sql
```

puede importarse mediante:

```bash
mysql -u root -p systemaweb < database/systemaweb.sql
```

También puede importarse utilizando MySQL Workbench, phpMyAdmin o DBeaver.

---

## Tablas principales

El sistema contempla módulos relacionados con:

### Seguridad

```text
roles
usuarios
```

### Clientes y ventas

```text
clientes
cotizaciones
cotizacion_detalles
pedidos
pedido_detalles
```

### Productos

```text
categorias
productos
producto_proveedores
```

### Proveedores y compras

```text
proveedores
ordenes_compra
orden_compra_detalles
```

### Inventario

```text
inventario
movimientos_inventario
```

### Producción

```text
listas_materiales
lista_material_detalles
ordenes_fabricacion
reservas_inventario
```

### Logística

```text
entregas
```

### Finanzas

```text
fondos
movimientos_financieros
```

---

## Flujo de órdenes de compra

Las órdenes de compra utilizan los siguientes estados:

```text
Borrador
   ↓
Solicitada
   ├── Aceptar  → Confirmada
   │                 ↓
   │             Recepción
   │              ├── Parcial
   │              └── Recibida
   │
   └── Rechazar → Rechazada
```

También existe el estado:

```text
Cancelada
```

### Estados

| Estado | Descripción |
|---|---|
| Borrador | Orden creada y todavía editable |
| Solicitada | Orden enviada para autorización |
| Confirmada | Orden aceptada y pendiente de recepción |
| Parcial | Se recibió solamente parte de la mercancía |
| Recibida | Orden recibida completamente |
| Rechazada | Solicitud de compra rechazada |
| Cancelada | Orden cancelada |

---

## Relaciones principales de Compras

```text
proveedores
     │
     │
     ▼
ordenes_compra
     │
     │ 1:N
     ▼
orden_compra_detalles
     │
     ▼
productos
```

Una orden pertenece a un proveedor y puede contener múltiples productos.

---

## Compras e inventario

Cuando una orden está:

```text
Confirmada
```

puede comenzar su recepción.

Una recepción genera:

```text
orden_compra_detalles
        ↓
cantidad_recibida
        ↓
inventario
        ↓
movimientos_inventario
```

Si no se recibe toda la mercancía:

```text
Confirmada → Parcial
```

Cuando se completa:

```text
Parcial → Recibida
```

---

## Integridad de datos

Las tablas utilizan llaves foráneas para mantener relaciones entre:

- órdenes y proveedores;
- detalles y órdenes;
- detalles y productos;
- movimientos y productos;
- movimientos y órdenes de compra;
- inventario y productos.

No se recomienda eliminar registros directamente en producción sin revisar previamente sus relaciones.

---

## Datos de desarrollo

Los datos incluidos en el repositorio deben ser exclusivamente datos ficticios o de prueba.

No deben incluirse:

```text
contraseñas reales
datos personales
tokens
credenciales
información confidencial de clientes
información confidencial de proveedores
```

---

## Exportar la base de datos

Para exportar estructura y datos de desarrollo:

```bash
mysqldump -u root -p systemaweb > database/systemaweb.sql
```

Solo estructura:

```bash
mysqldump -u root -p --no-data systemaweb > database/systemaweb.sql
```

Para un repositorio compartido se recomienda mantener un dump limpio con estructura y, cuando sea necesario, datos ficticios.

---

## Reiniciar datos de pruebas de Compras

En desarrollo pueden eliminarse los detalles y órdenes:

```sql
DELETE FROM orden_compra_detalles;
DELETE FROM ordenes_compra;
```

Para reiniciar los `AUTO_INCREMENT`:

```sql
ALTER TABLE orden_compra_detalles AUTO_INCREMENT = 1;
ALTER TABLE ordenes_compra AUTO_INCREMENT = 1;
```

> Esto debe utilizarse únicamente en entornos de desarrollo.

---

## Convenciones

### Primary Keys

```text
id
```

### Foreign Keys

Se utiliza el formato:

```text
entidad_id
```

Ejemplos:

```text
proveedor_id
producto_id
usuario_id
orden_compra_id
```

### Fechas

Se recomienda mantener nombres descriptivos:

```text
fecha_creacion
fecha_actualizacion
fecha_orden
fecha_entrega_estimada
```

---

## Importante

La estructura SQL del repositorio debe mantenerse sincronizada con los cambios realizados durante el desarrollo.

Cuando se agregue o modifique una tabla, columna, índice, llave foránea o `ENUM`, deberá actualizarse también la documentación y el esquema SQL correspondiente.