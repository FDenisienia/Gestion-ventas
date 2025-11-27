import express from 'express'
import { getAllUsers, getUserById, createUser, updateUser, deleteUser } from '../users.js'
import { authenticateToken, requireAdmin } from '../middleware/auth.js'
import { initUserDB } from '../database.js'

const router = express.Router()

// Todas las rutas requieren autenticación
router.use(authenticateToken)

// Obtener todos los usuarios (solo admin)
router.get('/', requireAdmin, (req, res) => {
  try {
    const users = getAllUsers()
    res.json(users)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Obtener un usuario por ID
router.get('/:id', (req, res) => {
  try {
    // Los usuarios normales solo pueden ver su propio perfil
    // Los admins pueden ver cualquier perfil
    const userId = parseInt(req.params.id)
    if (req.user.role !== 'admin' && req.user.id !== userId) {
      return res.status(403).json({ error: 'No tienes permiso para ver este usuario' })
    }

    const user = getUserById(userId)
    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado' })
    }
    res.json(user)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Crear nuevo usuario (solo admin)
router.post('/', requireAdmin, (req, res) => {
  try {
    const { username, password, nombre, email, role } = req.body

    if (!username || !password) {
      return res.status(400).json({ error: 'Usuario y contraseña son requeridos' })
    }

    const newUser = createUser({
      username,
      password,
      nombre: nombre || username,
      email: email || '',
      role: role || 'user'
    })

    // Inicializar la base de datos para el nuevo usuario
    try {
      initUserDB(newUser.id)
      console.log(`Base de datos inicializada para usuario ${newUser.id} (${newUser.username})`)
    } catch (dbError) {
      console.error('Error al inicializar base de datos para nuevo usuario:', dbError)
      // No fallar la creación del usuario si hay error en la BD
    }

    res.status(201).json(newUser)
  } catch (error) {
    res.status(400).json({ error: error.message })
  }
})

// Actualizar usuario
router.put('/:id', requireAdmin, (req, res) => {
  try {
    const userId = parseInt(req.params.id)
    const updates = { ...req.body }
    
    // Si no se proporciona password, no actualizarlo
    if (!updates.password || updates.password === '') {
      delete updates.password
    }

    const updatedUser = updateUser(userId, updates)
    res.json(updatedUser)
  } catch (error) {
    res.status(400).json({ error: error.message })
  }
})

// Eliminar usuario (solo admin)
router.delete('/:id', requireAdmin, (req, res) => {
  try {
    const userId = parseInt(req.params.id)
    deleteUser(userId)
    res.status(204).send()
  } catch (error) {
    res.status(400).json({ error: error.message })
  }
})

export default router

