import express, { Express, Request, Response, NextFunction } from 'express'
import cors, { CorsOptions } from 'cors'
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

const app: Express = express()
const PORT: number = parseInt(process.env.PORT || '3001', 10)

// Configurar CORS
const corsOptions: CorsOptions = {
  origin: [
    'http://localhost:3000', // Desarrollo local
    process.env.FRONTEND_URL, // URL de producción desde variable de entorno
    /\.netlify\.app$/, // Todos los dominios de Netlify
  ].filter(Boolean) as (string | RegExp)[], // Elimina valores undefined
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}

app.use(cors(corsOptions))
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
app.get('/', (_req: Request, res: Response) => {
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

app.get('/api/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', message: 'Servidor funcionando correctamente' })
})

// Middleware de manejo de errores
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error('Error en el servidor:', err)
  res.status(500).json({ error: err.message || 'Error interno del servidor' })
})

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Servidor backend corriendo en puerto ${PORT}`)
  console.log('Base de datos inicializada correctamente')
  if (process.env.NODE_ENV === 'production') {
    console.log('Modo producción activado')
  }
})

export default app

