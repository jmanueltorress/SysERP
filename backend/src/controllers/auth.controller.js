import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import pool from '../config/database.js'

// =====================================================
// OBTENER ROLES DE UN USUARIO
// =====================================================

const obtenerRolesUsuario = async (connection, usuarioId) => {
  const [roles] = await connection.query(
    `
      SELECT
        r.id,
        r.nombre,
        r.descripcion
      FROM usuario_roles ur
      INNER JOIN roles r
        ON r.id = ur.rol_id
      WHERE ur.usuario_id = ?
        AND r.activo = 1
      ORDER BY r.nombre
    `,
    [usuarioId]
  )

  return roles
}

// =====================================================
// OBTENER PERMISOS EFECTIVOS
// Roles + concesiones individuales - denegaciones
// =====================================================

const obtenerPermisosUsuario = async (
  connection,
  usuarioId
) => {
  const [permisos] = await connection.query(
    `
      SELECT DISTINCT
        p.clave
      FROM permisos p
      WHERE p.activo = 1
        AND (
          EXISTS (
            SELECT 1
            FROM usuario_roles ur
            INNER JOIN rol_permisos rp
              ON rp.rol_id = ur.rol_id
            WHERE ur.usuario_id = ?
              AND rp.permiso_id = p.id
          )

          OR EXISTS (
            SELECT 1
            FROM usuario_permisos up
            WHERE up.usuario_id = ?
              AND up.permiso_id = p.id
              AND up.tipo = 'Conceder'
          )
        )

        AND NOT EXISTS (
          SELECT 1
          FROM usuario_permisos up
          WHERE up.usuario_id = ?
            AND up.permiso_id = p.id
            AND up.tipo = 'Denegar'
        )

      ORDER BY p.clave
    `,
    [
      usuarioId,
      usuarioId,
      usuarioId,
    ]
  )

  return permisos.map((permiso) => permiso.clave)
}

// =====================================================
// LOGIN
// =====================================================

export const login = async (req, res) => {
  const email = String(req.body.email || '')
    .trim()
    .toLowerCase()

  const password = String(req.body.password || '')

  if (!email || !password) {
    return res.status(400).json({
      success: false,
      message: 'El correo y la contraseña son obligatorios.',
    })
  }

  const connection = await pool.getConnection()

  try {
    const [usuarios] = await connection.query(
      `
        SELECT
          id,
          nombre,
          apellido,
          email,
          password,
          telefono,
          activo
        FROM usuarios
        WHERE email = ?
        LIMIT 1
      `,
      [email]
    )

    if (usuarios.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Correo o contraseña incorrectos.',
      })
    }

    const usuario = usuarios[0]

    if (!usuario.activo) {
      return res.status(403).json({
        success: false,
        message: 'La cuenta se encuentra desactivada.',
      })
    }

    const passwordValida = await bcrypt.compare(
      password,
      usuario.password
    )

    if (!passwordValida) {
      return res.status(401).json({
        success: false,
        message: 'Correo o contraseña incorrectos.',
      })
    }

    const roles = await obtenerRolesUsuario(
      connection,
      usuario.id
    )

    const permisos = await obtenerPermisosUsuario(
      connection,
      usuario.id
    )

    if (!process.env.JWT_SECRET) {
      throw new Error(
        'La variable JWT_SECRET no está configurada.'
      )
    }

    const token = jwt.sign(
      {
        id: usuario.id,
        email: usuario.email,
      },
      process.env.JWT_SECRET,
      {
        expiresIn: process.env.JWT_EXPIRES_IN || '8h',
      }
    )

    return res.json({
      success: true,
      message: 'Inicio de sesión correcto.',
      data: {
        token,
        usuario: {
          id: usuario.id,
          nombre: usuario.nombre,
          apellido: usuario.apellido,
          nombre_completo:
            `${usuario.nombre} ${usuario.apellido}`,
          email: usuario.email,
          telefono: usuario.telefono,
          roles,
          permisos,
        },
      },
    })

  } catch (error) {
    console.error('Error al iniciar sesión:', error)

    return res.status(500).json({
      success: false,
      message: 'Error interno al iniciar sesión.',
    })

  } finally {
    connection.release()
  }
}