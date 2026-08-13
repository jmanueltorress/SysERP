import express from 'express'


import {
  obtenerCompras,
  obtenerCompra,
  crearCompra,
  actualizarCompra,
  solicitarCompra,
  confirmarCompra,
  rechazarCompra,
  cancelarCompra,
  recibirCompra,
  obtenerProveedores,
  obtenerProductos,
} from '../controllers/compras.controller.js'

const router = express.Router()


// ================================
// CATÁLOGOS
// ================================


router.get(
  '/catalogos/proveedores',
  obtenerProveedores
)


router.get(
  '/catalogos/productos',
  obtenerProductos
)


// ================================
// ÓRDENES DE COMPRA
// ================================


router.get(
  '/',
  obtenerCompras
)


router.get(
  '/:id',
  obtenerCompra
)


router.post(
  '/',
  crearCompra
)
// ================================
// ACTUALIZAR ORDEN
// Solo Borrador
// ================================

router.put(
  '/:id',
  actualizarCompra
)

// ================================
// SOLICITAR ORDEN
// Borrador -> Solicitada
// ================================


router.put(
  '/:id/solicitar',
  solicitarCompra
)


// ================================
// CONFIRMAR / ACEPTAR ORDEN
// Solicitada -> Confirmada
// ================================


router.put(
  '/:id/confirmar',
  confirmarCompra
)


// ================================
// RECHAZAR ORDEN
// Solicitada -> Rechazada
// ================================


router.put(
  '/:id/rechazar',
  rechazarCompra
)


// ================================
// CANCELAR ORDEN
// ================================


router.put(
  '/:id/cancelar',
  cancelarCompra
)


// ================================
// RECEPCIÓN
// Confirmada / Parcial
// ================================


router.post(
  '/:id/recepcion',
  recibirCompra
)


export default router