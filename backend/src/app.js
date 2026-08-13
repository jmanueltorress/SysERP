import express from 'express'
import cors from 'cors'
import comprasRoutes from './routes/compras.routes.js'
import almacenesRoutes from './routes/almacenes.routes.js'

const app = express()

app.use(cors())
app.use(express.json())

// ============================================
// API
// ============================================

app.get('/api', (req, res) => {
  res.json({
    success: true,
    message: 'API SYSOLO funcionando',
  })
})

// ============================================
// COMPRAS
// ============================================

app.use('/api/compras', comprasRoutes)

// ============================================
// ALMACENES
// ============================================

app.use('/api/almacenes', almacenesRoutes)

export default app