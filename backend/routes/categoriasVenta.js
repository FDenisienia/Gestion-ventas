import express from 'express'
import { categoriasVentaDB } from '../database.js'
import { authenticateToken } from '../middleware/auth.js'

const router = express.Router()

// Todas las rutas requieren autenticación
router.use(authenticateToken)

// Obtener todas las categorías de venta
router.get('/', (req, res) => {
  try {
    const categorias = categoriasVentaDB.getAll(req.user.id)
    res.json(categorias)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Obtener una categoría de venta por ID
router.get('/:id', (req, res) => {
  try {
    const categoria = categoriasVentaDB.getById(req.params.id, req.user.id)
    if (!categoria) {
      return res.status(404).json({ error: 'Categoría no encontrada' })
    }
    res.json(categoria)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Crear una nueva categoría de venta
router.post('/', (req, res) => {
  try {
    const { nombre } = req.body
    
    if (!nombre) {
      return res.status(400).json({ error: 'El nombre es requerido' })
    }

    const nuevaCategoria = categoriasVentaDB.create({ nombre }, req.user.id)
    
    console.log('Categoría de venta creada:', nuevaCategoria)
    res.status(201).json(nuevaCategoria)
  } catch (error) {
    console.error('Error al crear categoría de venta:', error)
    res.status(500).json({ error: error.message })
  }
})

// Actualizar una categoría de venta
router.put('/:id', (req, res) => {
  try {
    const { nombre } = req.body
    
    const categoriaExistente = categoriasVentaDB.getById(req.params.id, req.user.id)
    if (!categoriaExistente) {
      return res.status(404).json({ error: 'Categoría no encontrada' })
    }

    const categoriaActualizada = categoriasVentaDB.update(req.params.id, {
      nombre: nombre !== undefined ? nombre : categoriaExistente.nombre
    }, req.user.id)
    
    res.json(categoriaActualizada)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Eliminar una categoría de venta
router.delete('/:id', (req, res) => {
  try {
    const categoria = categoriasVentaDB.getById(req.params.id, req.user.id)
    if (!categoria) {
      return res.status(404).json({ error: 'Categoría no encontrada' })
    }

    categoriasVentaDB.delete(req.params.id, req.user.id)
    res.json({ message: 'Categoría eliminada correctamente' })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

export default router

