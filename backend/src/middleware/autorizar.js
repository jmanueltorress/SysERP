import pool from '../config/database.js'

// =====================================================
// VERIFICAR PERMISO DEL USUARIO
// =====================================================

export const autorizar = (permisoRequerido) => {
  return async (req, res, next) => {
    if (!req.user?.id) {
      return res.status(401).json({
        success: false,
        message: 'Usuario no autenticado.',
      })
    }

    try {
      const [resultado] = await pool.query(
        `
          SELECT
            CASE
              -- Una denegación individual tiene prioridad
              WHEN EXISTS (
                SELECT 1
                FROM usuario_permisos up
                INNER JOIN permisos p
                  ON p.id = up.permiso_id
                WHERE up.usuario_id = ?
                  AND p.clave = ?
                  AND p.activo = 1
                  AND up.tipo = 'Denegar'
              )
              THEN 0

              -- Una concesión individual permite la acción
              WHEN EXISTS (
                SELECT 1
                FROM usuario_permisos up
                INNER JOIN permisos p
                  ON p.id = up.permiso_id
                WHERE up.usuario_id = ?
                  AND p.clave = ?
                  AND p.activo = 1
                  AND up.tipo = 'Conceder'
              )
              THEN 1

              -- Permiso heredado de cualquiera de sus roles
              WHEN EXISTS (
                SELECT 1
                FROM usuario_roles ur
                INNER JOIN roles r
                  ON r.id = ur.rol_id
                INNER JOIN rol_permisos rp
                  ON rp.rol_id = r.id
                INNER JOIN permisos p
                  ON p.id = rp.permiso_id
                WHERE ur.usuario_id = ?
                  AND r.activo = 1
                  AND p.clave = ?
                  AND p.activo = 1
              )
              THEN 1

              ELSE 0
            END AS permitido
        `,
        [
          req.user.id,
          permisoRequerido,

          req.user.id,
          permisoRequerido,

          req.user.id,
          permisoRequerido,
        ]
      )

      const permitido =
        Boolean(resultado[0]?.permitido)

      if (!permitido) {
        return res.status(403).json({
          success: false,
          message:
            'No tienes permiso para realizar esta acción.',
          permiso: permisoRequerido,
        })
      }

      next()
    } catch (error) {
      console.error(
        'Error al verificar permiso:',
        error
      )

      return res.status(500).json({
        success: false,
        message:
          'Error interno al verificar los permisos.',
      })
    }
  }
}