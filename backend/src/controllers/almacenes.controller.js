import pool from '../config/database.js'

// =====================================================
// OBTENER TODOS LOS ALMACENES
// =====================================================

export const obtenerAlmacenes = async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT
        id,
        nombre,
        codigo,
        descripcion,
        activo
      FROM almacenes
      ORDER BY id ASC
    `)

    res.json({
      success: true,
      data: rows,
    })

  } catch (error) {

    console.error('Error al obtener almacenes:', error)

    res.status(500).json({
      success: false,
      message: 'Error al obtener los almacenes.',
    })
  }
}


// =====================================================
// OBTENER UN ALMACÉN
// =====================================================

export const obtenerAlmacen = async (req, res) => {
  const { id } = req.params

  try {

    const [almacenes] = await pool.query(`
      SELECT
        id,
        nombre,
        codigo,
        descripcion,
        activo
      FROM almacenes
      WHERE id = ?
      LIMIT 1
    `, [id])

    if (almacenes.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Almacén no encontrado.',
      })
    }

    res.json({
      success: true,
      data: almacenes[0],
    })

  } catch (error) {

    console.error('Error al obtener almacén:', error)

    res.status(500).json({
      success: false,
      message: 'Error al obtener el almacén.',
    })
  }
}


// =====================================================
// CREAR ALMACÉN
// =====================================================

export const crearAlmacen = async (req, res) => {

  try {

    const {
      nombre,
      codigo,
      descripcion,
      activo,
    } = req.body


    // ================================================
    // VALIDACIONES
    // ================================================

    if (!nombre || !nombre.trim()) {
      return res.status(400).json({
        success: false,
        message: 'El nombre del almacén es obligatorio.',
      })
    }

    if (!codigo || !codigo.trim()) {
      return res.status(400).json({
        success: false,
        message: 'El código del almacén es obligatorio.',
      })
    }


    // ================================================
    // VERIFICAR CÓDIGO
    // ================================================

    const [existente] = await pool.query(`
      SELECT
        id
      FROM almacenes
      WHERE codigo = ?
      LIMIT 1
    `, [
      codigo.trim(),
    ])


    if (existente.length > 0) {

      return res.status(400).json({
        success: false,
        message: 'El código del almacén ya existe.',
      })
    }


    // ================================================
    // INSERTAR
    // ================================================

    const [resultado] = await pool.query(`
      INSERT INTO almacenes (
        nombre,
        codigo,
        descripcion,
        activo
      )
      VALUES (?, ?, ?, ?)
    `, [
      nombre.trim(),
      codigo.trim(),
      descripcion?.trim() || null,
      activo !== undefined
        ? Number(activo)
        : 1,
    ])


    res.status(201).json({
      success: true,
      message: 'Almacén creado correctamente.',
      data: {
        id: resultado.insertId,
      },
    })

  } catch (error) {

    console.error('Error al crear almacén:', error)

    res.status(500).json({
      success: false,
      message: 'No se pudo crear el almacén.',
      error: error.message,
    })
  }
}


// =====================================================
// ACTUALIZAR ALMACÉN
// =====================================================

export const actualizarAlmacen = async (req, res) => {

  const { id } = req.params

  try {

    const {
      nombre,
      codigo,
      descripcion,
      activo,
    } = req.body


    // ================================================
    // VALIDACIONES
    // ================================================

    if (!nombre || !nombre.trim()) {
      return res.status(400).json({
        success: false,
        message: 'El nombre del almacén es obligatorio.',
      })
    }

    if (!codigo || !codigo.trim()) {
      return res.status(400).json({
        success: false,
        message: 'El código del almacén es obligatorio.',
      })
    }


    // ================================================
    // VERIFICAR ALMACÉN
    // ================================================

    const [almacen] = await pool.query(`
      SELECT
        id
      FROM almacenes
      WHERE id = ?
      LIMIT 1
    `, [id])


    if (almacen.length === 0) {

      return res.status(404).json({
        success: false,
        message: 'Almacén no encontrado.',
      })
    }


    // ================================================
    // VERIFICAR CÓDIGO DUPLICADO
    // ================================================

    const [codigoExistente] = await pool.query(`
      SELECT
        id
      FROM almacenes
      WHERE codigo = ?
        AND id <> ?
      LIMIT 1
    `, [
      codigo.trim(),
      id,
    ])


    if (codigoExistente.length > 0) {

      return res.status(400).json({
        success: false,
        message: 'El código del almacén ya pertenece a otro almacén.',
      })
    }


    // ================================================
    // ACTUALIZAR
    // ================================================

    await pool.query(`
      UPDATE almacenes
      SET
        nombre = ?,
        codigo = ?,
        descripcion = ?,
        activo = ?
      WHERE id = ?
    `, [
      nombre.trim(),
      codigo.trim(),
      descripcion?.trim() || null,
      activo !== undefined
        ? Number(activo)
        : 1,
      id,
    ])


    res.json({
      success: true,
      message: 'Almacén actualizado correctamente.',
    })

  } catch (error) {

    console.error('Error al actualizar almacén:', error)

    res.status(500).json({
      success: false,
      message: 'No se pudo actualizar el almacén.',
      error: error.message,
    })
  }
}


// =====================================================
// ELIMINAR ALMACÉN
// =====================================================

export const eliminarAlmacen = async (req, res) => {

  const { id } = req.params

  const connection = await pool.getConnection()

  try {

    // ================================================
    // INICIAR TRANSACCIÓN
    // ================================================

    await connection.beginTransaction()


    // ================================================
    // VERIFICAR ALMACÉN
    // ================================================

    const [almacenes] = await connection.query(`
      SELECT
        id,
        nombre
      FROM almacenes
      WHERE id = ?
      LIMIT 1
    `, [
      id,
    ])


    if (almacenes.length === 0) {

      await connection.rollback()

      return res.status(404).json({
        success: false,
        message: 'Almacén no encontrado.',
      })
    }


    // ================================================
    // VERIFICAR UBICACIONES
    // ================================================

    const [ubicaciones] = await connection.query(`
      SELECT
        id,
        nombre
      FROM ubicaciones_almacen
      WHERE almacen_id = ?
    `, [
      id,
    ])


    if (ubicaciones.length > 0) {

      await connection.rollback()

      return res.status(400).json({
        success: false,
        message:
          `No se puede eliminar el almacén "${almacenes[0].nombre}" ` +
          `porque tiene ${ubicaciones.length} ubicación(es) asociada(s). ` +
          `Elimina primero sus ubicaciones.`,
      })
    }


    // ================================================
    // ELIMINAR ALMACÉN
    // ================================================

    await connection.query(`
      DELETE FROM almacenes
      WHERE id = ?
    `, [
      id,
    ])


    // ================================================
    // CONFIRMAR TRANSACCIÓN
    // ================================================

    await connection.commit()


    res.json({
      success: true,
      message: 'Almacén eliminado correctamente.',
      data: {
        id: Number(id),
      },
    })

  } catch (error) {

    await connection.rollback()

    console.error('Error al eliminar almacén:', error)

    res.status(500).json({
      success: false,
      message: 'No se pudo eliminar el almacén.',
      error: error.message,
    })

  } finally {

    connection.release()
  }
}


// =====================================================
// OBTENER UBICACIONES DE UN ALMACÉN
// =====================================================

export const obtenerUbicaciones = async (req, res) => {

  const { id } = req.params

  try {

    const [rows] = await pool.query(`
      SELECT
        u.id,
        u.almacen_id,
        a.nombre AS almacen,
        u.nombre,
        u.codigo,
        u.descripcion,
        u.activo
      FROM ubicaciones_almacen u
      INNER JOIN almacenes a
        ON a.id = u.almacen_id
      WHERE u.almacen_id = ?
      ORDER BY u.id ASC
    `, [
      id,
    ])


    res.json({
      success: true,
      data: rows,
    })

  } catch (error) {

    console.error('Error al obtener ubicaciones:', error)

    res.status(500).json({
      success: false,
      message: 'No se pudieron obtener las ubicaciones.',
    })
  }
}


// =====================================================
// CREAR UBICACIÓN
// =====================================================

export const crearUbicacion = async (req, res) => {
  const { id } = req.params

  try {
    const {
      nombre,
      codigo,
      descripcion,
      activo,
    } = req.body

    // ================================================
    // VALIDAR NOMBRE
    // ================================================

    if (!nombre || !nombre.trim()) {
      return res.status(400).json({
        success: false,
        message: 'El nombre de la ubicación es obligatorio.',
      })
    }

    // ================================================
    // VALIDAR CÓDIGO
    // ================================================

    if (!codigo || !codigo.trim()) {
      return res.status(400).json({
        success: false,
        message: 'El código de la ubicación es obligatorio.',
      })
    }

    const codigoLimpio = codigo.trim().toUpperCase()

    // ================================================
    // VERIFICAR ALMACÉN
    // ================================================

    const [almacen] = await pool.query(`
      SELECT
        id,
        nombre,
        activo
      FROM almacenes
      WHERE id = ?
      LIMIT 1
    `, [id])

    if (almacen.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Almacén no encontrado.',
      })
    }

    // ================================================
    // VERIFICAR QUE EL ALMACÉN ESTÉ ACTIVO
    // ================================================

    if (Number(almacen[0].activo) !== 1) {
      return res.status(400).json({
        success: false,
        message: 'No se pueden crear ubicaciones en un almacén inactivo.',
      })
    }

    // ================================================
    // VERIFICAR CÓDIGO DUPLICADO
    // DENTRO DEL MISMO ALMACÉN
    // ================================================

    const [codigoExistente] = await pool.query(`
      SELECT
        id,
        nombre
      FROM ubicaciones_almacen
      WHERE almacen_id = ?
        AND codigo = ?
      LIMIT 1
    `, [
      id,
      codigoLimpio,
    ])

    if (codigoExistente.length > 0) {
      return res.status(400).json({
        success: false,
        message:
          `El código "${codigoLimpio}" ya existe en el almacén "${almacen[0].nombre}".`,
      })
    }

    // ================================================
    // INSERTAR UBICACIÓN
    // ================================================

    const [resultado] = await pool.query(`
      INSERT INTO ubicaciones_almacen (
        almacen_id,
        nombre,
        codigo,
        descripcion,
        activo
      )
      VALUES (?, ?, ?, ?, ?)
    `, [
      id,
      nombre.trim(),
      codigoLimpio,
      descripcion?.trim() || null,
      activo !== undefined ? Number(activo) : 1,
    ])

    // ================================================
    // RESPUESTA
    // ================================================

    res.status(201).json({
      success: true,
      message: 'Ubicación creada correctamente.',
      data: {
        id: resultado.insertId,
        almacen_id: Number(id),
        nombre: nombre.trim(),
        codigo: codigoLimpio,
      },
    })

  } catch (error) {

    console.error('Error al crear ubicación:', error)

    // ================================================
    // DUPLICADO MYSQL
    // ================================================

    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({
        success: false,
        message:
          'El código de la ubicación ya existe dentro de este almacén.',
      })
    }

    res.status(500).json({
      success: false,
      message: 'No se pudo crear la ubicación.',
      error: error.message,
    })
  }
}

// =====================================================
// ACTUALIZAR UBICACIÓN
// =====================================================

export const actualizarUbicacion = async (req, res) => {
  const { id } = req.params

  try {

    const {
      nombre,
      codigo,
      descripcion,
      activo,
    } = req.body

    // ================================================
    // VALIDAR NOMBRE
    // ================================================

    if (!nombre || !nombre.trim()) {
      return res.status(400).json({
        success: false,
        message: 'El nombre de la ubicación es obligatorio.',
      })
    }

    // ================================================
    // VALIDAR CÓDIGO
    // ================================================

    if (!codigo || !codigo.trim()) {
      return res.status(400).json({
        success: false,
        message: 'El código de la ubicación es obligatorio.',
      })
    }

    const codigoLimpio = codigo.trim().toUpperCase()

    // ================================================
    // OBTENER UBICACIÓN
    // ================================================

    const [ubicacion] = await pool.query(`
      SELECT
        id,
        almacen_id
      FROM ubicaciones_almacen
      WHERE id = ?
      LIMIT 1
    `, [id])

    if (ubicacion.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Ubicación no encontrada.',
      })
    }

    const almacenId = ubicacion[0].almacen_id

    // ================================================
    // VERIFICAR CÓDIGO DUPLICADO
    // EN EL MISMO ALMACÉN
    // ================================================

    const [codigoExistente] = await pool.query(`
      SELECT id
      FROM ubicaciones_almacen
      WHERE almacen_id = ?
        AND codigo = ?
        AND id <> ?
      LIMIT 1
    `, [
      almacenId,
      codigoLimpio,
      id,
    ])

    if (codigoExistente.length > 0) {
      return res.status(400).json({
        success: false,
        message:
          `El código "${codigoLimpio}" ya pertenece a otra ubicación de este almacén.`,
      })
    }

    // ================================================
    // ACTUALIZAR
    // ================================================

    await pool.query(`
      UPDATE ubicaciones_almacen
      SET
        nombre = ?,
        codigo = ?,
        descripcion = ?,
        activo = ?
      WHERE id = ?
    `, [
      nombre.trim(),
      codigoLimpio,
      descripcion?.trim() || null,
      activo !== undefined ? Number(activo) : 1,
      id,
    ])

    res.json({
      success: true,
      message: 'Ubicación actualizada correctamente.',
    })

  } catch (error) {

    console.error('Error al actualizar ubicación:', error)

    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({
        success: false,
        message:
          'El código de la ubicación ya existe dentro de este almacén.',
      })
    }

    res.status(500).json({
      success: false,
      message: 'No se pudo actualizar la ubicación.',
      error: error.message,
    })
  }
}


// =====================================================
// ELIMINAR UBICACIÓN
// =====================================================

export const eliminarUbicacion = async (req, res) => {

  const { id } = req.params

  try {

    // ================================================
    // VERIFICAR UBICACIÓN
    // ================================================

    const [ubicacion] = await pool.query(`
      SELECT
        id
      FROM ubicaciones_almacen
      WHERE id = ?
      LIMIT 1
    `, [
      id,
    ])


    if (ubicacion.length === 0) {

      return res.status(404).json({
        success: false,
        message: 'Ubicación no encontrada.',
      })
    }


    // ================================================
    // VERIFICAR INVENTARIO
    // ================================================

    const [inventario] = await pool.query(`
      SELECT
        id
      FROM inventario
      WHERE ubicacion_id = ?
      LIMIT 1
    `, [
      id,
    ])


    if (inventario.length > 0) {

      return res.status(400).json({
        success: false,
        message:
          'No se puede eliminar la ubicación porque está asociada a registros de inventario.',
      })
    }


    // ================================================
    // ELIMINAR UBICACIÓN
    // ================================================

    await pool.query(`
      DELETE FROM ubicaciones_almacen
      WHERE id = ?
    `, [
      id,
    ])


    res.json({
      success: true,
      message: 'Ubicación eliminada correctamente.',
      data: {
        id: Number(id),
      },
    })

  } catch (error) {

    console.error('Error al eliminar ubicación:', error)

    res.status(500).json({
      success: false,
      message: 'No se pudo eliminar la ubicación.',
      error: error.message,
    })
  }
}