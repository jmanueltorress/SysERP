import express from 'express'

import {
  obtenerAlmacenes,
  obtenerAlmacen,
  crearAlmacen,
  actualizarAlmacen,
  eliminarAlmacen,
  obtenerUbicaciones,
  crearUbicacion,
  actualizarUbicacion,
  eliminarUbicacion,
} from '../controllers/almacenes.controller.js'

const router = express.Router()

// ============================================
// ALMACENES
// ============================================

// Obtener todos los almacenes
router.get(
  '/',
  obtenerAlmacenes
)

// Crear almacén
router.post(
  '/',
  crearAlmacen
)

// ============================================
// UBICACIONES DE UN ALMACÉN
// ============================================

// Obtener ubicaciones de un almacén
// GET /api/almacenes/:id/ubicaciones
router.get(
  '/:id/ubicaciones',
  obtenerUbicaciones
)

// Crear ubicación dentro de un almacén
// POST /api/almacenes/:id/ubicaciones
router.post(
  '/:id/ubicaciones',
  crearUbicacion
)

// ============================================
// UBICACIONES INDIVIDUALES
// ============================================

// Actualizar ubicación
// PUT /api/almacenes/ubicaciones/:id
router.put(
  '/ubicaciones/:id',
  actualizarUbicacion
)

// Eliminar ubicación
// DELETE /api/almacenes/ubicaciones/:id
router.delete(
  '/ubicaciones/:id',
  eliminarUbicacion
)

// ============================================
// ALMACÉN INDIVIDUAL
// ============================================

// Obtener un almacén
// GET /api/almacenes/:id
router.get(
  '/:id',
  obtenerAlmacen
)

// Actualizar almacén
// PUT /api/almacenes/:id
router.put(
  '/:id',
  actualizarAlmacen
)

// Eliminar almacén
// DELETE /api/almacenes/:id
router.delete(
  '/:id',
  eliminarAlmacen
)

export default router