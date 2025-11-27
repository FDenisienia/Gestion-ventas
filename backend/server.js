import express from 'express'
import cors from 'cors'
import authRouter from './routes/auth.js'
import usersRouter from './routes/users.js'
import clientesRouter from './routes/clientes.js'
import ventasRouter from './routes/ventas.js'
import egresosRouter from './routes/egresos.js'
import articulosRouter from './routes/articulos.js'
import categoriasRouter from './routes/categorias.js'
import categoriasVentaRouter from './routes/categoriasVenta.js'
// Inicializar base de datos
import './database.js'

const app = express()
const PORT = 3001

app.use(cors())
app.use(express.json())

// Rutas públicas
app.use('/api/auth', authRouter)

// Rutas protegidas (requieren autenticación)
app.use('/api/users', usersRouter)
app.use('/api/clientes', clientesRouter)
app.use('/api/ventas', ventasRouter)
app.use('/api/egresos', egresosRouter)
app.use('/api/articulos', articulosRouter)
app.use('/api/categorias', categoriasRouter)
app.use('/api/categorias-venta', categoriasVentaRouter)

// Ruta raíz
app.get('/', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'API del sistema de gestión',
    version: '1.0.0',
    endpoints: {
      auth: '/api/auth',
      health: '/api/health'
    }
  })
})

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Servidor funcionando correctamente' })
})

// Middleware de manejo de errores
app.use((err, req, res, next) => {
  console.error('Error en el servidor:', err)
  res.status(500).json({ error: err.message || 'Error interno del servidor' })
})

app.listen(PORT, () => {
  console.log(`Servidor backend corriendo en http://localhost:${PORT}`)
  console.log('Base de datos inicializada correctamente')
})

