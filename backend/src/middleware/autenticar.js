import jwt from 'jsonwebtoken'
import pool from '../config/database.js'

export const autenticar = async (req, res, next) => {
  try {
    const authorization = req.headers.authorization || ''

    if (!authorization.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Token de acceso requerido.',
      })
    }

    const token = authorization.substring(7).trim()

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Token de acceso requerido.',
      })
    }

    if (!process.env.JWT_SECRET) {
      throw new Error(
        'La variable JWT_SECRET no está configurada.'
      )
    }

    let payload

    try {
      payload = jwt.verify(
        token,
        process.env.JWT_SECRET
      )
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        return res.status(401).json({
          success: false,
          message: 'La sesión ha expirado.',
        })
      }

      return res.status(401).json({
        success: false,
        message: 'Token inválido.',
      })
    }

    const [usuarios] = await pool.query(
      `
        SELECT
          id,
          nombre,
          apellido,
          email,
          telefono,
          activo
        FROM usuarios
        WHERE id = ?
        LIMIT 1
      `,
      [payload.id]
    )

    if (usuarios.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'El usuario de la sesión ya no existe.',
      })
    }

    const usuario = usuarios[0]

    if (!usuario.activo) {
      return res.status(403).json({
        success: false,
        message: 'La cuenta se encuentra desactivada.',
      })
    }

    req.user = {
      id: usuario.id,
      nombre: usuario.nombre,
      apellido: usuario.apellido,
      email: usuario.email,
      telefono: usuario.telefono,
    }

    next()
  } catch (error) {
    console.error(
      'Error al verificar autenticación:',
      error
    )

    return res.status(500).json({
      success: false,
      message: 'Error interno al verificar la sesión.',
    })
  }
}