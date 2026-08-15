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

import {
  autenticar,
} from '../middleware/autenticar.js'

import {
  autorizar,
} from '../middleware/autorizar.js'

const router = express.Router()


// ================================
// AUTENTICACIÓN
// Todas las rutas de Compras
// requieren un usuario autenticado
// ================================

router.use(autenticar)


// ================================
// CATÁLOGOS
// ================================

router.get(
  '/catalogos/proveedores',
  autorizar('compras.ver'),
  obtenerProveedores
)

router.get(
  '/catalogos/productos',
  autorizar('compras.ver'),
  obtenerProductos
)


// ================================
// ÓRDENES DE COMPRA
// ================================

// Obtener todas las órdenes
router.get(
  '/',
  autorizar('compras.ver'),
  obtenerCompras
)

// Obtener una orden
router.get(
  '/:id',
  autorizar('compras.ver'),
  obtenerCompra
)

// Crear una orden
router.post(
  '/',
  autorizar('compras.crear'),
  crearCompra
)


// ================================
// ACTUALIZAR ORDEN
// Solo Borrador
// ================================

router.put(
  '/:id',
  autorizar('compras.editar'),
  actualizarCompra
)


// ================================
// SOLICITAR ORDEN
// Borrador → Solicitada
// ================================

router.put(
  '/:id/solicitar',
  autorizar('compras.solicitar'),
  solicitarCompra
)


// ================================
// CONFIRMAR / APROBAR ORDEN
// Solicitada → Confirmada
// ================================

router.put(
  '/:id/confirmar',
  autorizar('compras.aprobar'),
  confirmarCompra
)


// ================================
// RECHAZAR ORDEN
// Solicitada → Rechazada
// ================================

router.put(
  '/:id/rechazar',
  autorizar('compras.rechazar'),
  rechazarCompra
)


// ================================
// CANCELAR ORDEN
// ================================

router.put(
  '/:id/cancelar',
  autorizar('compras.cancelar'),
  cancelarCompra
)


// ================================
// RECEPCIÓN
// Confirmada / Parcial
// ================================

router.post(
  '/:id/recepcion',
  autorizar('compras.recibir'),
  recibirCompra
)


export default router