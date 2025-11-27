import express from 'express'
import { categoriasDB } from '../database.js'
import { authenticateToken } from '../middleware/auth.js'

const router = express.Router()

// Todas las rutas requieren autenticación
router.use(authenticateToken)

// Obtener todas las categorías
router.get('/', (req, res) => {
  try {
    const categorias = categoriasDB.getAll(req.user.id)
    res.json(categorias)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Obtener una categoría por ID
router.get('/:id', (req, res) => {
  try {
    const categoria = categoriasDB.getById(req.params.id, req.user.id)
    if (!categoria) {
      return res.status(404).json({ error: 'Categoría no encontrada' })
    }
    res.json(categoria)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Crear una nueva categoría
router.post('/', (req, res) => {
  try {
    const { nombre } = req.body
    
    if (!nombre) {
      return res.status(400).json({ error: 'El nombre es requerido' })
    }

    const nuevaCategoria = categoriasDB.create({ nombre }, req.user.id)
    
    console.log('Categoría creada:', nuevaCategoria)
    res.status(201).json(nuevaCategoria)
  } catch (error) {
    console.error('Error al crear categoría:', error)
    res.status(500).json({ error: error.message })
  }
})

// Actualizar una categoría
router.put('/:id', (req, res) => {
  try {
    const { nombre } = req.body
    
    const categoriaExistente = categoriasDB.getById(req.params.id, req.user.id)
    if (!categoriaExistente) {
      return res.status(404).json({ error: 'Categoría no encontrada' })
    }

    const categoriaActualizada = categoriasDB.update(req.params.id, {
      nombre: nombre !== undefined ? nombre : categoriaExistente.nombre
    }, req.user.id)
    
    res.json(categoriaActualizada)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Eliminar una categoría
router.delete('/:id', (req, res) => {
  try {
    const categoria = categoriasDB.getById(req.params.id, req.user.id)
    if (!categoria) {
      return res.status(404).json({ error: 'Categoría no encontrada' })
    }

    categoriasDB.delete(req.params.id, req.user.id)
    res.json({ message: 'Categoría eliminada correctamente' })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

export default router

