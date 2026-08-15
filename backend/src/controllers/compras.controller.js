import pool from '../config/database.js'

// =====================================================
// OBTENER ÓRDENES ACTIVAS
// No incluye borradores descartados
// =====================================================

export const obtenerCompras = async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT
        oc.id,
        oc.folio,
        oc.proveedor_id,
        p.nombre AS proveedor,
        oc.usuario_id,
        oc.fecha_orden,
        oc.fecha_entrega_estimada,
        oc.subtotal,
        oc.descuento,
        oc.impuesto,
        oc.total,
        oc.estado,
        oc.notas,
        oc.fecha_creacion,
        oc.fecha_actualizacion
      FROM ordenes_compra oc
      INNER JOIN proveedores p
        ON p.id = oc.proveedor_id
      WHERE oc.estado <> 'Descartada'
      ORDER BY oc.id DESC
    `)

    return res.json({
      success: true,
      data: rows,
    })

  } catch (error) {
    console.error(
      'Error al obtener compras:',
      error
    )

    return res.status(500).json({
      success: false,
      message:
        'Error al obtener las órdenes de compra.',
    })
  }
}
// =====================================================
// OBTENER HISTORIAL DE COMPRAS
// Incluye órdenes descartadas
// =====================================================

export const obtenerHistorialCompras = async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT
        oc.id,
        oc.folio,
        oc.proveedor_id,
        p.nombre AS proveedor,
        oc.usuario_id,
        oc.fecha_orden,
        oc.fecha_entrega_estimada,
        oc.subtotal,
        oc.descuento,
        oc.impuesto,
        oc.total,
        oc.estado,
        oc.notas,
        oc.fecha_creacion,
        oc.fecha_actualizacion
      FROM ordenes_compra oc
      INNER JOIN proveedores p
        ON p.id = oc.proveedor_id
      ORDER BY oc.id DESC
    `)

    return res.json({
      success: true,
      data: rows,
    })

  } catch (error) {
    console.error(
      'Error al obtener historial de compras:',
      error
    )

    return res.status(500).json({
      success: false,
      message:
        'Error al obtener el historial de compras.',
    })
  }
}
// =====================================================
// OBTENER UNA ORDEN
// =====================================================

export const obtenerCompra = async (req, res) => {
  const { id } = req.params

  try {
    const [ordenes] = await pool.query(`
  SELECT
    oc.id,
    oc.folio,
    oc.proveedor_id,
    p.nombre AS proveedor,
    oc.usuario_id,
    oc.solicitado_por,
    oc.fecha_solicitud,
    oc.aprobado_por,
    oc.fecha_aprobacion,
    oc.rechazado_por,
    CONCAT_WS(
  ' ',
  usuario_rechazo.nombre,
  usuario_rechazo.apellido
) AS rechazado_por_nombre,
    oc.fecha_rechazo,
    oc.motivo_rechazo,
    oc.cancelado_por,
    CONCAT_WS(
  ' ',
  usuario_cancelacion.nombre,
  usuario_cancelacion.apellido
) AS cancelado_por_nombre,
    oc.fecha_cancelacion,
    oc.motivo_cancelacion,
    oc.descartado_por,
CONCAT_WS(
  ' ',
  usuario_descarte.nombre,
  usuario_descarte.apellido
) AS descartado_por_nombre,
oc.fecha_descarte,
    oc.fecha_orden,
    oc.fecha_entrega_estimada,
    oc.subtotal,
    oc.descuento,
    oc.impuesto,
    oc.total,
    oc.estado,
    oc.notas,
    oc.fecha_creacion,
    oc.fecha_actualizacion
  FROM ordenes_compra oc

INNER JOIN proveedores p
  ON p.id = oc.proveedor_id

LEFT JOIN usuarios usuario_rechazo
  ON usuario_rechazo.id = oc.rechazado_por

LEFT JOIN usuarios usuario_cancelacion
  ON usuario_cancelacion.id = oc.cancelado_por

LEFT JOIN usuarios usuario_descarte
  ON usuario_descarte.id = oc.descartado_por

WHERE oc.id = ?
LIMIT 1
`, [id])

    if (ordenes.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Orden de compra no encontrada.',
      })
    }

    const [detalles] = await pool.query(`
      SELECT
        d.id,
        d.orden_compra_id,
        d.producto_id,
        p.nombre AS producto,
        d.cantidad,
        d.cantidad_recibida,
        d.precio_unitario,
        d.descuento,
        d.impuesto,
        d.subtotal,
        d.total,
        d.notas
      FROM orden_compra_detalles d
      INNER JOIN productos p
        ON p.id = d.producto_id
      WHERE d.orden_compra_id = ?
      ORDER BY d.id ASC
    `, [id])

    res.json({
      success: true,
      data: {
        ...ordenes[0],
        detalles,
      },
    })

  } catch (error) {
    console.error('Error al obtener compra:', error)

    res.status(500).json({
      success: false,
      message: 'Error al obtener la orden de compra.',
    })
  }
}


// =====================================================
// CREAR ORDEN DE COMPRA
// =====================================================

export const crearCompra = async (req, res) => {
  const connection = await pool.getConnection()

  try {
    const {
      proveedor_id,
      fecha_orden,
      fecha_entrega_estimada,
      notas,
      subtotal,
      descuento,
      impuesto,
      total,
      detalles,
    } = req.body


    // ================================================
    // VALIDACIONES
    // ================================================

    if (!proveedor_id) {
      return res.status(400).json({
        success: false,
        message: 'El proveedor es obligatorio.',
      })
    }

    if (!fecha_orden) {
      return res.status(400).json({
        success: false,
        message: 'La fecha de orden es obligatoria.',
      })
    }

    if (!Array.isArray(detalles) || detalles.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'La orden debe contener al menos un producto.',
      })
    }


    // ================================================
    // VALIDAR DETALLES
    // ================================================

    for (const detalle of detalles) {

      if (!detalle.producto_id) {
        return res.status(400).json({
          success: false,
          message: 'Todos los detalles deben tener un producto.',
        })
      }

      if (Number(detalle.cantidad) <= 0) {
        return res.status(400).json({
          success: false,
          message: 'La cantidad debe ser mayor a cero.',
        })
      }

      if (Number(detalle.precio_unitario) < 0) {
        return res.status(400).json({
          success: false,
          message: 'El precio no puede ser negativo.',
        })
      }
    }


    // ================================================
    // INICIAR TRANSACCIÓN
    // ================================================

    await connection.beginTransaction()


    // ================================================
    // GENERAR FOLIO
    // ================================================

    const [ultimoFolio] = await connection.query(`
      SELECT folio
      FROM ordenes_compra
      ORDER BY id DESC
      LIMIT 1
    `)

    let numero = 1

    if (ultimoFolio.length > 0) {
      const match = ultimoFolio[0].folio.match(/(\d+)$/)

      if (match) {
        numero = parseInt(match[1], 10) + 1
      }
    }

    const folio = `OC-${String(numero).padStart(4, '0')}`


    // ================================================
    // USUARIO AUTENTICADO
    // ================================================

    const usuario_id = req.user.id


    // ================================================
    // INSERTAR ORDEN
    // ================================================

    const [resultadoOrden] = await connection.query(`
      INSERT INTO ordenes_compra (
        proveedor_id,
        usuario_id,
        folio,
        fecha_orden,
        fecha_entrega_estimada,
        subtotal,
        descuento,
        impuesto,
        total,
        estado,
        notas
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'Borrador', ?)
    `, [
      proveedor_id,
      usuario_id,
      folio,
      fecha_orden,
      fecha_entrega_estimada || null,
      Number(subtotal || 0),
      Number(descuento || 0),
      Number(impuesto || 0),
      Number(total || 0),
      notas || null,
    ])


    const ordenCompraId = resultadoOrden.insertId


    // ================================================
    // INSERTAR DETALLES
    // ================================================

    for (const detalle of detalles) {

      const cantidad = Number(detalle.cantidad || 0)
      const precio = Number(detalle.precio_unitario || 0)

      const subtotalDetalle = cantidad * precio

      const impuestoDetalle = subtotalDetalle * 0.16

      const totalDetalle =
        subtotalDetalle + impuestoDetalle


      await connection.query(`
        INSERT INTO orden_compra_detalles (
          orden_compra_id,
          producto_id,
          cantidad,
          cantidad_recibida,
          precio_unitario,
          descuento,
          impuesto,
          subtotal,
          total,
          notas
        )
        VALUES (?, ?, ?, 0, ?, 0, ?, ?, ?, ?)
      `, [
        ordenCompraId,
        detalle.producto_id,
        cantidad,
        precio,
        impuestoDetalle,
        subtotalDetalle,
        totalDetalle,
        detalle.notas || null,
      ])
    }


    // ================================================
    // CONFIRMAR TRANSACCIÓN
    // ================================================

    await connection.commit()


    res.status(201).json({
      success: true,
      message: 'Orden de compra creada correctamente.',
      data: {
        id: ordenCompraId,
        folio,
      },
    })

  } catch (error) {

    await connection.rollback()

    console.error('Error al crear orden de compra:', error)

    res.status(500).json({
      success: false,
      message: 'No se pudo crear la orden de compra.',
      error: error.message,
    })

  } finally {

    connection.release()
  }
}
// =====================================================
// ACTUALIZAR ORDEN DE COMPRA
// Solo Borrador
// =====================================================

export const actualizarCompra = async (req, res) => {
  const { id } = req.params

  const connection = await pool.getConnection()

  try {
    const {
      proveedor_id,
      fecha_orden,
      fecha_entrega_estimada,
      notas,
      subtotal,
      descuento,
      impuesto,
      total,
      detalles,
    } = req.body


    // ================================================
    // VALIDACIONES
    // ================================================

    if (!proveedor_id) {
      return res.status(400).json({
        success: false,
        message: 'El proveedor es obligatorio.',
      })
    }

    if (!fecha_orden) {
      return res.status(400).json({
        success: false,
        message: 'La fecha de orden es obligatoria.',
      })
    }

    if (!Array.isArray(detalles) || detalles.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'La orden debe contener al menos un producto.',
      })
    }

    for (const detalle of detalles) {
      if (!detalle.producto_id) {
        return res.status(400).json({
          success: false,
          message: 'Todos los detalles deben tener un producto.',
        })
      }

      if (Number(detalle.cantidad) <= 0) {
        return res.status(400).json({
          success: false,
          message: 'La cantidad debe ser mayor a cero.',
        })
      }

      if (Number(detalle.precio_unitario) < 0) {
        return res.status(400).json({
          success: false,
          message: 'El precio no puede ser negativo.',
        })
      }
    }


    // ================================================
    // INICIAR TRANSACCIÓN
    // ================================================

    await connection.beginTransaction()


    // ================================================
    // OBTENER ORDEN
    // ================================================

    const [ordenes] = await connection.query(`
      SELECT
        id,
        folio,
        estado
      FROM ordenes_compra
      WHERE id = ?
      FOR UPDATE
    `, [id])


    if (ordenes.length === 0) {
      await connection.rollback()

      return res.status(404).json({
        success: false,
        message: 'Orden de compra no encontrada.',
      })
    }


    const orden = ordenes[0]


    // ================================================
    // SOLO BORRADOR
    // ================================================

    if (orden.estado !== 'Borrador') {
      await connection.rollback()

      return res.status(400).json({
        success: false,
        message:
          `La orden "${orden.folio}" no puede editarse ` +
          `porque se encuentra en estado "${orden.estado}".`,
      })
    }


    // ================================================
    // ACTUALIZAR CABECERA
    // ================================================

    await connection.query(`
      UPDATE ordenes_compra
      SET
        proveedor_id = ?,
        fecha_orden = ?,
        fecha_entrega_estimada = ?,
        subtotal = ?,
        descuento = ?,
        impuesto = ?,
        total = ?,
        notas = ?
      WHERE id = ?
        AND estado = 'Borrador'
    `, [
      proveedor_id,
      fecha_orden,
      fecha_entrega_estimada || null,
      Number(subtotal || 0),
      Number(descuento || 0),
      Number(impuesto || 0),
      Number(total || 0),
      notas || null,
      id,
    ])


    // ================================================
    // ELIMINAR DETALLES ANTERIORES
    // ================================================

    await connection.query(`
      DELETE FROM orden_compra_detalles
      WHERE orden_compra_id = ?
    `, [id])


    // ================================================
    // INSERTAR DETALLES NUEVOS
    // ================================================

    for (const detalle of detalles) {
      const cantidad =
        Number(detalle.cantidad || 0)

      const precio =
        Number(detalle.precio_unitario || 0)

      const subtotalDetalle =
        cantidad * precio

      const impuestoDetalle =
        subtotalDetalle * 0.16

      const totalDetalle =
        subtotalDetalle + impuestoDetalle


      await connection.query(`
        INSERT INTO orden_compra_detalles (
          orden_compra_id,
          producto_id,
          cantidad,
          cantidad_recibida,
          precio_unitario,
          descuento,
          impuesto,
          subtotal,
          total,
          notas
        )
        VALUES (?, ?, ?, 0, ?, 0, ?, ?, ?, ?)
      `, [
        id,
        detalle.producto_id,
        cantidad,
        precio,
        impuestoDetalle,
        subtotalDetalle,
        totalDetalle,
        detalle.notas || null,
      ])
    }


    // ================================================
    // CONFIRMAR
    // ================================================

    await connection.commit()


    res.json({
      success: true,
      message: 'Orden de compra actualizada correctamente.',
      data: {
        id: Number(id),
        folio: orden.folio,
        estado: 'Borrador',
      },
    })

  } catch (error) {
    await connection.rollback()

    console.error(
      'Error al actualizar orden de compra:',
      error
    )

    res.status(500).json({
      success: false,
      message: 'No se pudo actualizar la orden de compra.',
      error: error.message,
    })

  } finally {
    connection.release()
  }
}

// =====================================================
// SOLICITAR ORDEN DE COMPRA
// Borrador → Solicitada
// =====================================================

export const solicitarCompra = async (req, res) => {
  const { id } = req.params
  const usuarioId = req.user.id

  try {

    // ================================================
    // OBTENER ORDEN
    // ================================================

    const [ordenes] = await pool.query(`
      SELECT
        id,
        folio,
        estado
      FROM ordenes_compra
      WHERE id = ?
      LIMIT 1
    `, [id])

    if (ordenes.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Orden de compra no encontrada.',
      })
    }

    const orden = ordenes[0]

    // ================================================
    // VALIDAR ESTADO
    // ================================================

    if (orden.estado !== 'Borrador') {
      return res.status(400).json({
        success: false,
        message:
          `La orden "${orden.folio}" no puede solicitarse ` +
          `porque se encuentra en estado "${orden.estado}".`,
      })
    }

    // ================================================
    // SOLICITAR
    // ================================================

    const [resultado] = await pool.query(`
      UPDATE ordenes_compra
      SET
        estado = 'Solicitada',
        solicitado_por = ?,
        fecha_solicitud = NOW()
      WHERE id = ?
        AND estado = 'Borrador'
    `, [
      usuarioId,
      id,
    ])

    if (resultado.affectedRows === 0) {
      return res.status(409).json({
        success: false,
        message:
          'La orden cambió de estado y no pudo ser solicitada.',
      })
    }

    // ================================================
    // RESPUESTA
    // ================================================

    return res.json({
      success: true,
      message: 'Orden de compra solicitada correctamente.',
      data: {
        id: Number(id),
        folio: orden.folio,
        estado: 'Solicitada',
        solicitado_por: usuarioId,
      },
    })

  } catch (error) {
    console.error(
      'Error al solicitar orden de compra:',
      error
    )

    return res.status(500).json({
      success: false,
      message: 'No se pudo solicitar la orden de compra.',
    })
  }
}
// =====================================================
// CONFIRMAR / APROBAR ORDEN DE COMPRA
// Solicitada → Confirmada
// =====================================================

export const confirmarCompra = async (req, res) => {
  const { id } = req.params
  const usuarioId = req.user.id

  try {

    // ================================================
    // OBTENER ORDEN
    // ================================================

    const [ordenes] = await pool.query(`
      SELECT
        id,
        folio,
        estado,
        solicitado_por
      FROM ordenes_compra
      WHERE id = ?
      LIMIT 1
    `, [id])

    if (ordenes.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Orden de compra no encontrada.',
      })
    }

    const orden = ordenes[0]

    // ================================================
    // VALIDAR ESTADO
    // ================================================

    if (orden.estado !== 'Solicitada') {
      return res.status(400).json({
        success: false,
        message:
          `La orden "${orden.folio}" no puede aprobarse ` +
          `porque se encuentra en estado "${orden.estado}".`,
      })
    }

    // ================================================
    // EVITAR AUTOAPROBACIÓN
    // ================================================

    if (
      Number(orden.solicitado_por) ===
      Number(usuarioId)
    ) {
      return res.status(403).json({
        success: false,
        message:
          'No puedes aprobar una orden de compra que tú mismo solicitaste.',
      })
    }

    // ================================================
    // APROBAR
    // ================================================

    const [resultado] = await pool.query(`
      UPDATE ordenes_compra
      SET
        estado = 'Confirmada',
        aprobado_por = ?,
        fecha_aprobacion = NOW()
      WHERE id = ?
        AND estado = 'Solicitada'
    `, [
      usuarioId,
      id,
    ])

    if (resultado.affectedRows === 0) {
      return res.status(409).json({
        success: false,
        message:
          'La orden cambió de estado y no pudo ser aprobada.',
      })
    }

    // ================================================
    // RESPUESTA
    // ================================================

    return res.json({
      success: true,
      message: 'Orden de compra aprobada correctamente.',
      data: {
        id: Number(id),
        folio: orden.folio,
        estado: 'Confirmada',
        aprobado_por: usuarioId,
      },
    })

  } catch (error) {
    console.error(
      'Error al aprobar orden de compra:',
      error
    )

    return res.status(500).json({
      success: false,
      message: 'No se pudo aprobar la orden de compra.',
    })
  }
}

// =====================================================
// RECHAZAR ORDEN DE COMPRA
// Solicitada → Rechazada
// =====================================================

export const rechazarCompra = async (req, res) => {
  const { id } = req.params
  const usuarioId = req.user.id
  const motivo = String(req.body.motivo || '').trim()

  try {

    // ================================================
    // VALIDAR MOTIVO
    // ================================================

    if (!motivo) {
      return res.status(400).json({
        success: false,
        message:
          'Debe proporcionar el motivo del rechazo.',
      })
    }

    // ================================================
    // OBTENER ORDEN
    // ================================================

    const [ordenes] = await pool.query(`
      SELECT
        id,
        folio,
        estado,
        solicitado_por
      FROM ordenes_compra
      WHERE id = ?
      LIMIT 1
    `, [id])

    if (ordenes.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Orden de compra no encontrada.',
      })
    }

    const orden = ordenes[0]

    // ================================================
    // VALIDAR ESTADO
    // ================================================

    if (orden.estado !== 'Solicitada') {
      return res.status(400).json({
        success: false,
        message:
          `La orden "${orden.folio}" no puede rechazarse ` +
          `porque se encuentra en estado "${orden.estado}".`,
      })
    }

    // ================================================
    // EVITAR AUTORRECHAZO
    // ================================================

    if (
      Number(orden.solicitado_por) ===
      Number(usuarioId)
    ) {
      return res.status(403).json({
        success: false,
        message:
          'No puedes rechazar una orden que tú mismo solicitaste.',
      })
    }

    // ================================================
    // RECHAZAR
    // ================================================

    const [resultado] = await pool.query(`
      UPDATE ordenes_compra
      SET
        estado = 'Rechazada',
        rechazado_por = ?,
        fecha_rechazo = NOW(),
        motivo_rechazo = ?
      WHERE id = ?
        AND estado = 'Solicitada'
    `, [
      usuarioId,
      motivo,
      id,
    ])

    if (resultado.affectedRows === 0) {
      return res.status(409).json({
        success: false,
        message:
          'La orden cambió de estado y no pudo ser rechazada.',
      })
    }

    return res.json({
      success: true,
      message: 'Orden de compra rechazada correctamente.',
      data: {
        id: Number(id),
        folio: orden.folio,
        estado: 'Rechazada',
        rechazado_por: usuarioId,
        motivo_rechazo: motivo,
      },
    })

  } catch (error) {
    console.error(
      'Error al rechazar orden de compra:',
      error
    )

    return res.status(500).json({
      success: false,
      message: 'No se pudo rechazar la orden de compra.',
    })
  }
}

// =====================================================
// DESCARTAR / CANCELAR ORDEN DE COMPRA
//
// Borrador             → Descartada
// Solicitada/Confirmada → Cancelada
// =====================================================

export const cancelarCompra = async (req, res) => {
  const { id } = req.params
  const usuarioId = req.user.id
  const motivo = String(req.body.motivo || '').trim()

  try {

    // ================================================
    // OBTENER ORDEN
    // ================================================

    const [ordenes] = await pool.query(`
      SELECT
        id,
        folio,
        estado
      FROM ordenes_compra
      WHERE id = ?
      LIMIT 1
    `, [id])

    if (ordenes.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Orden de compra no encontrada.',
      })
    }

    const orden = ordenes[0]

    // ================================================
    // DESCARTAR BORRADOR
    // No requiere motivo
    // ================================================

    if (orden.estado === 'Borrador') {
      const [resultado] = await pool.query(`
        UPDATE ordenes_compra
        SET
          estado = 'Descartada',
          descartado_por = ?,
          fecha_descarte = NOW()
        WHERE id = ?
          AND estado = 'Borrador'
      `, [
        usuarioId,
        id,
      ])

      if (resultado.affectedRows === 0) {
        return res.status(409).json({
          success: false,
          message:
            'La orden cambió de estado y no pudo descartarse.',
        })
      }

      return res.json({
        success: true,
        message: 'Borrador descartado correctamente.',
        data: {
          id: Number(id),
          folio: orden.folio,
          estado: 'Descartada',
          descartado_por: usuarioId,
        },
      })
    }

    // ================================================
    // VALIDAR CANCELACIÓN
    // ================================================

    if (
      orden.estado !== 'Solicitada' &&
      orden.estado !== 'Confirmada'
    ) {
      return res.status(400).json({
        success: false,
        message:
          `La orden "${orden.folio}" no puede cancelarse ` +
          `porque se encuentra en estado "${orden.estado}".`,
      })
    }

    // ================================================
    // MOTIVO OBLIGATORIO PARA CANCELAR
    // ================================================

    if (!motivo) {
      return res.status(400).json({
        success: false,
        message:
          'Debe proporcionar el motivo de la cancelación.',
      })
    }

    // ================================================
    // CANCELAR ORDEN
    // ================================================

    const [resultado] = await pool.query(`
      UPDATE ordenes_compra
      SET
        estado = 'Cancelada',
        cancelado_por = ?,
        fecha_cancelacion = NOW(),
        motivo_cancelacion = ?
      WHERE id = ?
        AND estado IN (
          'Solicitada',
          'Confirmada'
        )
    `, [
      usuarioId,
      motivo,
      id,
    ])

    if (resultado.affectedRows === 0) {
      return res.status(409).json({
        success: false,
        message:
          'La orden cambió de estado y no pudo ser cancelada.',
      })
    }

    return res.json({
      success: true,
      message: 'Orden de compra cancelada correctamente.',
      data: {
        id: Number(id),
        folio: orden.folio,
        estado: 'Cancelada',
        cancelado_por: usuarioId,
        motivo_cancelacion: motivo,
      },
    })

  } catch (error) {
    console.error(
      'Error al descartar o cancelar orden de compra:',
      error
    )

    return res.status(500).json({
      success: false,
      message:
        'No se pudo descartar o cancelar la orden de compra.',
    })
  }
}

// =====================================================
// PROVEEDORES
// =====================================================

export const obtenerProveedores = async (req, res) => {

  try {

    const [rows] = await pool.query(`
      SELECT
        id,
        nombre
      FROM proveedores
      ORDER BY nombre ASC
    `)


    res.json({
      success: true,
      data: rows,
    })

  } catch (error) {

    console.error('Error al obtener proveedores:', error)

    res.status(500).json({
      success: false,
      message: 'No se pudieron obtener los proveedores.',
    })
  }
}


// =====================================================
// PRODUCTOS
// =====================================================

export const obtenerProductos = async (req, res) => {

  try {

    const [rows] = await pool.query(`
      SELECT
        id,
        nombre,
        precio_compra
      FROM productos
      ORDER BY nombre ASC
    `)


    res.json({
      success: true,
      data: rows,
    })

  } catch (error) {

    console.error('Error al obtener productos:', error)

    res.status(500).json({
      success: false,
      message: 'No se pudieron obtener los productos.',
    })
  }
}


// =====================================================
// RECIBIR ORDEN DE COMPRA
// =====================================================

export const recibirCompra = async (req, res) => {
  const { id } = req.params
  const { detalles } = req.body

  const connection = await pool.getConnection()

  try {

    // =====================================================
    // VALIDACIONES INICIALES
    // =====================================================

    if (!Array.isArray(detalles) || detalles.length === 0) {

      return res.status(400).json({
        success: false,
        message: 'Debe indicar al menos un producto para recibir.',
      })
    }


    // =====================================================
    // INICIAR TRANSACCIÓN
    // =====================================================

    await connection.beginTransaction()


    // =====================================================
    // OBTENER ORDEN
    // =====================================================

    const [ordenes] = await connection.query(`
      SELECT
        id,
        folio,
        estado
      FROM ordenes_compra
      WHERE id = ?
      FOR UPDATE
    `, [id])


    if (ordenes.length === 0) {

      await connection.rollback()

      return res.status(404).json({
        success: false,
        message: 'Orden de compra no encontrada.',
      })
    }


    const orden = ordenes[0]


    // =====================================================
    // VALIDAR ESTADO
    // =====================================================

    if (
      orden.estado !== 'Confirmada' &&
      orden.estado !== 'Parcial'
    ) {

      await connection.rollback()

      return res.status(400).json({
        success: false,
        message:
          `La orden se encuentra en estado "${orden.estado}" ` +
          `y no puede recibir mercancía.`,
      })
    }


    // =====================================================
    // OBTENER DETALLES DE LA ORDEN
    // =====================================================

    const [detallesOrden] = await connection.query(`
      SELECT
        d.id,
        d.producto_id,
        d.cantidad,
        d.cantidad_recibida,
        p.nombre AS producto,
        p.codigo
      FROM orden_compra_detalles d
      INNER JOIN productos p
        ON p.id = d.producto_id
      WHERE d.orden_compra_id = ?
      FOR UPDATE
    `, [id])


    if (detallesOrden.length === 0) {

      await connection.rollback()

      return res.status(400).json({
        success: false,
        message: 'La orden no contiene productos.',
      })
    }


    // =====================================================
    // CREAR MAPA DE DETALLES
    // =====================================================

    const detallesMap = new Map()

    for (const detalle of detallesOrden) {
      detallesMap.set(Number(detalle.id), detalle)
    }


    // =====================================================
    // USUARIO
    // =====================================================

    const usuario_id = req.user.id


    // =====================================================
    // PROCESAR RECEPCIÓN
    // =====================================================

    for (const detalleRecibido of detalles) {

      const detalleId =
        Number(detalleRecibido.detalle_id)

      const cantidadRecibida =
        Number(
          detalleRecibido.cantidad_recibida || 0
        )


      // -----------------------------------------------
      // VALIDAR DETALLE
      // -----------------------------------------------

      if (!detalleId) {

        await connection.rollback()

        return res.status(400).json({
          success: false,
          message:
            'Uno de los detalles recibidos no tiene un ID válido.',
        })
      }


      const detalle = detallesMap.get(detalleId)


      if (!detalle) {

        await connection.rollback()

        return res.status(400).json({
          success: false,
          message:
            `El detalle ${detalleId} no pertenece a esta orden.`,
        })
      }


      // -----------------------------------------------
      // VALIDAR CANTIDAD
      // -----------------------------------------------

      if (cantidadRecibida <= 0) {

        await connection.rollback()

        return res.status(400).json({
          success: false,
          message:
            `La cantidad recibida para "${detalle.producto}" ` +
            `debe ser mayor a cero.`,
        })
      }


      // -----------------------------------------------
      // CALCULAR PENDIENTE
      // -----------------------------------------------

      const cantidadOrdenada =
        Number(detalle.cantidad)

      const cantidadYaRecibida =
        Number(detalle.cantidad_recibida || 0)

      const cantidadPendiente =
        cantidadOrdenada - cantidadYaRecibida


      // -----------------------------------------------
      // EVITAR RECIBIR MÁS DE LO PENDIENTE
      // -----------------------------------------------

      if (cantidadRecibida > cantidadPendiente) {

        await connection.rollback()

        return res.status(400).json({
          success: false,
          message:
            `No se pueden recibir ${cantidadRecibida} unidades ` +
            `de "${detalle.producto}". ` +
            `Solo quedan ${cantidadPendiente} pendientes.`,
        })
      }


      // -----------------------------------------------
      // NUEVA CANTIDAD RECIBIDA
      // -----------------------------------------------

      const nuevaCantidadRecibida =
        cantidadYaRecibida + cantidadRecibida


      // =================================================
      // ACTUALIZAR DETALLE DE LA ORDEN
      // =================================================

      await connection.query(`
        UPDATE orden_compra_detalles
        SET cantidad_recibida = ?
        WHERE id = ?
      `, [
        nuevaCantidadRecibida,
        detalleId,
      ])


      // =================================================
      // ACTUALIZAR INVENTARIO
      // =================================================

      const [inventario] = await connection.query(`
        SELECT
          id,
          cantidad
        FROM inventario
        WHERE producto_id = ?
        FOR UPDATE
      `, [detalle.producto_id])


      if (inventario.length === 0) {

        await connection.query(`
          INSERT INTO inventario (
            producto_id,
            cantidad,
            cantidad_reservada,
            ubicacion
          )
          VALUES (?, ?, 0, NULL)
        `, [
          detalle.producto_id,
          cantidadRecibida,
        ])

      } else {

        const cantidadActual =
          Number(inventario[0].cantidad || 0)

        const nuevaCantidad =
          cantidadActual + cantidadRecibida

        await connection.query(`
          UPDATE inventario
          SET cantidad = ?
          WHERE producto_id = ?
        `, [
          nuevaCantidad,
          detalle.producto_id,
        ])
      }


      // =================================================
      // REGISTRAR MOVIMIENTO DE INVENTARIO
      // =================================================

      await connection.query(`
        INSERT INTO movimientos_inventario (
          producto_id,
          usuario_id,
          orden_fabricacion_id,
          orden_compra_id,
          tipo,
          cantidad,
          motivo,
          referencia
        )
        VALUES (?, ?, NULL, ?, 'Entrada', ?, ?, ?)
      `, [
        detalle.producto_id,
        usuario_id,
        id,
        cantidadRecibida,
        'Recepción de compra',
        orden.folio,
      ])
    }


    // =====================================================
    // DETERMINAR ESTADO DE LA ORDEN
    // =====================================================

    const [pendientes] = await connection.query(`
      SELECT
        COUNT(*) AS pendientes
      FROM orden_compra_detalles
      WHERE orden_compra_id = ?
        AND cantidad_recibida < cantidad
    `, [id])


    const cantidadPendientes =
      Number(pendientes[0].pendientes)


    let nuevoEstado = 'Recibida'


    if (cantidadPendientes > 0) {
      nuevoEstado = 'Parcial'
    }


    // =====================================================
    // ACTUALIZAR ESTADO
    // =====================================================

    await connection.query(`
      UPDATE ordenes_compra
      SET estado = ?
      WHERE id = ?
    `, [
      nuevoEstado,
      id,
    ])


    // =====================================================
    // CONFIRMAR TRANSACCIÓN
    // =====================================================

    await connection.commit()


    // =====================================================
    // RESPUESTA
    // =====================================================

    res.json({
      success: true,
      message: 'Recepción registrada correctamente.',
      data: {
        orden_id: Number(id),
        folio: orden.folio,
        estado: nuevoEstado,
      },
    })

  } catch (error) {

    await connection.rollback()

    console.error(
      'Error al recibir orden de compra:',
      error
    )

    res.status(500).json({
      success: false,
      message:
        'No se pudo registrar la recepción de la orden.',
      error: error.message,
    })

  } finally {

    connection.release()
  }
}