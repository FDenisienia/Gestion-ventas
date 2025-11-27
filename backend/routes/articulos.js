import express from 'express'
import { articulosDB } from '../database.js'
import { authenticateToken } from '../middleware/auth.js'

const router = express.Router()

// Todas las rutas requieren autenticación
router.use(authenticateToken)

// Obtener todos los artículos
router.get('/', (req, res) => {
  try {
    const articulos = articulosDB.getAll(req.user.id)
    res.json(articulos)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Obtener un artículo por ID
router.get('/:id', (req, res) => {
  try {
    const articulo = articulosDB.getById(req.params.id, req.user.id)
    if (!articulo) {
      return res.status(404).json({ error: 'Artículo no encontrado' })
    }
    res.json(articulo)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Crear un nuevo artículo
router.post('/', (req, res) => {
  try {
    const { marca, nombre, costo, venta, stock, categoria_id, moneda } = req.body
    
    if (!nombre) {
      return res.status(400).json({ error: 'El nombre es requerido' })
    }
    
    if (costo === undefined || costo === null) {
      return res.status(400).json({ error: 'El costo es requerido' })
    }
    
    if (venta === undefined || venta === null) {
      return res.status(400).json({ error: 'El precio de venta es requerido' })
    }
    
    if (stock === undefined || stock === null) {
      return res.status(400).json({ error: 'El stock es requerido' })
    }

    const nuevoArticulo = articulosDB.create({
      marca: marca || '',
      nombre,
      costo,
      venta,
      stock,
      categoria_id: categoria_id || null,
      moneda: moneda || 'ARS'
    }, req.user.id)
    
    console.log('Artículo creado:', nuevoArticulo)
    res.status(201).json(nuevoArticulo)
  } catch (error) {
    console.error('Error al crear artículo:', error)
    res.status(500).json({ error: error.message })
  }
})

// Actualizar un artículo
router.put('/:id', (req, res) => {
  try {
    const { marca, nombre, costo, venta, stock, categoria_id, moneda } = req.body
    
    const articuloExistente = articulosDB.getById(req.params.id, req.user.id)
    if (!articuloExistente) {
      return res.status(404).json({ error: 'Artículo no encontrado' })
    }

    const articuloActualizado = articulosDB.update(req.params.id, {
      marca: marca !== undefined ? marca : articuloExistente.marca,
      nombre: nombre !== undefined ? nombre : articuloExistente.nombre,
      costo: costo !== undefined ? costo : articuloExistente.costo,
      venta: venta !== undefined ? venta : articuloExistente.venta,
      stock: stock !== undefined ? stock : articuloExistente.stock,
      categoria_id: categoria_id !== undefined ? categoria_id : articuloExistente.categoria_id,
      moneda: moneda !== undefined ? moneda : articuloExistente.moneda
    }, req.user.id)
    
    res.json(articuloActualizado)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Eliminar un artículo
router.delete('/:id', (req, res) => {
  try {
    const articulo = articulosDB.getById(req.params.id, req.user.id)
    if (!articulo) {
      return res.status(404).json({ error: 'Artículo no encontrado' })
    }

    articulosDB.delete(req.params.id, req.user.id)
    res.json({ message: 'Artículo eliminado correctamente' })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

export default router

