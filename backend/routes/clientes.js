import express from 'express'
import { clientesDB } from '../database.js'
import { authenticateToken } from '../middleware/auth.js'

const router = express.Router()

// Todas las rutas requieren autenticación
router.use(authenticateToken)

// Obtener todos los clientes
router.get('/', (req, res) => {
  try {
    const clientes = clientesDB.getAll(req.user.id)
    res.json(clientes)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Obtener un cliente por ID
router.get('/:id', (req, res) => {
  try {
    const cliente = clientesDB.getById(req.params.id, req.user.id)
    if (!cliente) {
      return res.status(404).json({ error: 'Cliente no encontrado' })
    }
    res.json(cliente)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Crear un nuevo cliente
router.post('/', (req, res) => {
  try {
    const { nombre, dni, telefono } = req.body
    
    if (!nombre) {
      return res.status(400).json({ error: 'El nombre es requerido' })
    }
    
    if (!dni) {
      return res.status(400).json({ error: 'El DNI es requerido' })
    }
    
    if (!telefono) {
      return res.status(400).json({ error: 'El teléfono es requerido' })
    }

    const nuevoCliente = clientesDB.create({
      nombre,
      dni,
      telefono
    }, req.user.id)
    
    console.log('Cliente creado:', nuevoCliente)
    res.status(201).json(nuevoCliente)
  } catch (error) {
    console.error('Error al crear cliente:', error)
    res.status(500).json({ error: error.message })
  }
})

// Actualizar un cliente
router.put('/:id', (req, res) => {
  try {
    const { nombre, dni, telefono } = req.body
    
    const clienteExistente = clientesDB.getById(req.params.id, req.user.id)
    if (!clienteExistente) {
      return res.status(404).json({ error: 'Cliente no encontrado' })
    }

    const clienteActualizado = clientesDB.update(req.params.id, {
      nombre: nombre !== undefined ? nombre : clienteExistente.nombre,
      dni: dni !== undefined ? dni : clienteExistente.dni,
      telefono: telefono !== undefined ? telefono : clienteExistente.telefono
    }, req.user.id)
    
    res.json(clienteActualizado)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Eliminar un cliente
router.delete('/:id', (req, res) => {
  try {
    const cliente = clientesDB.getById(req.params.id, req.user.id)
    if (!cliente) {
      return res.status(404).json({ error: 'Cliente no encontrado' })
    }

    clientesDB.delete(req.params.id, req.user.id)
    res.json({ message: 'Cliente eliminado correctamente' })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

export default router
