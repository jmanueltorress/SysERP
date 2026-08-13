import bcrypt from 'bcryptjs'
import pool from '../config/database.js'

const email = 'admin@systemaweb.com'
const nuevaPassword = process.env.ADMIN_NEW_PASSWORD

async function restablecerAdmin() {
  if (!nuevaPassword || nuevaPassword.length < 10) {
    console.error(
      'ADMIN_NEW_PASSWORD debe contener al menos 10 caracteres.'
    )

    process.exitCode = 1
    return
  }

  try {
    const passwordHash = await bcrypt.hash(
      nuevaPassword,
      12
    )

    const [resultado] = await pool.query(
      `
        UPDATE usuarios
        SET password = ?
        WHERE email = ?
      `,
      [passwordHash, email]
    )

    if (resultado.affectedRows === 0) {
      console.error('No se encontró el usuario administrador.')
      process.exitCode = 1
      return
    }

    console.log(
      'Contraseña del administrador actualizada correctamente.'
    )
  } catch (error) {
    console.error('No fue posible actualizar la contraseña:')
    console.error(error.message)
    process.exitCode = 1
  } finally {
    await pool.end()
  }
}

restablecerAdmin()