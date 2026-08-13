import bcrypt from 'bcryptjs'
import pool from '../config/database.js'

const RONDAS_BCRYPT = 12

const esPasswordBcrypt = (password) => {
  return (
    password.startsWith('$2a$') ||
    password.startsWith('$2b$') ||
    password.startsWith('$2y$')
  )
}

async function migrarPasswords() {
  const connection = await pool.getConnection()

  try {
    await connection.beginTransaction()

    const [usuarios] = await connection.query(`
      SELECT
        id,
        email,
        password
      FROM usuarios
    `)

    let actualizados = 0
    let omitidos = 0

    for (const usuario of usuarios) {
      if (esPasswordBcrypt(usuario.password)) {
        console.log(`Omitido: ${usuario.email}`)
        omitidos += 1
        continue
      }

      const passwordCifrada = await bcrypt.hash(
        usuario.password,
        RONDAS_BCRYPT
      )

      await connection.query(
        `
          UPDATE usuarios
          SET password = ?
          WHERE id = ?
        `,
        [passwordCifrada, usuario.id]
      )

      console.log(`Actualizado: ${usuario.email}`)
      actualizados += 1
    }

    await connection.commit()

    console.log('')
    console.log('Migración terminada correctamente.')
    console.log(`Usuarios actualizados: ${actualizados}`)
    console.log(`Usuarios omitidos: ${omitidos}`)

  } catch (error) {
    await connection.rollback()

    console.error('Error al migrar contraseñas:')
    console.error(error.message)

    process.exitCode = 1

  } finally {
    connection.release()
    await pool.end()
  }
}

migrarPasswords()