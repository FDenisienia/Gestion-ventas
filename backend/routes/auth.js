import express from 'express'
import { verifyPassword, getUserById } from '../users.js'
import { generateToken, authenticateToken } from '../middleware/auth.js'

const router = express.Router()

// Login
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body

    if (!username || !password) {
      return res.status(400).json({ error: 'Usuario y contraseña son requeridos' })
    }

    const user = verifyPassword(username, password)
    
    if (!user) {
      return res.status(401).json({ error: 'Credenciales inválidas' })
    }

    const token = generateToken(user)

    res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
        nombre: user.nombre,
        email: user.email
      }
    })
  } catch (error) {
    console.error('Error en login:', error)
    res.status(500).json({ error: error.message })
  }
})

// Verificar token (para mantener sesión)
router.get('/verify', authenticateToken, (req, res) => {
  try {
    // Obtener información completa del usuario desde la base de datos
    const user = getUserById(req.user.id)
    
    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado' })
    }

    // Devolver información completa del usuario
    res.json({
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
        nombre: user.nombre || user.username,
        email: user.email || ''
      }
    })
  } catch (error) {
    console.error('Error en verify:', error)
    // Si hay error, devolver al menos la información del token
    res.json({
      user: {
        id: req.user.id,
        username: req.user.username,
        role: req.user.role,
        nombre: req.user.username,
        email: ''
      }
    })
  }
})

export default router

