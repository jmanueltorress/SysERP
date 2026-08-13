import dotenv from 'dotenv'
import app from './app.js'
import pool from './config/database.js'

dotenv.config()

const PORT = process.env.PORT || 3000

async function startServer() {
  try {
    const connection = await pool.getConnection()

    console.log('MySQL conectado correctamente')

    connection.release()

    app.listen(PORT, () => {
      console.log(`Servidor ejecutándose en http://localhost:${PORT}`)
    })
  } catch (error) {
    console.error('Error al conectar con MySQL:')
    console.error(error.message)

    process.exit(1)
  }
}

startServer()