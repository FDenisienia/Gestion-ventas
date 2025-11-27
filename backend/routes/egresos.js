import express from 'express'
import { egresosDB } from '../database.js'
import { authenticateToken } from '../middleware/auth.js'

const router = express.Router()

// Todas las rutas requieren autenticación
router.use(authenticateToken)

// Obtener todos los egresos
router.get('/', (req, res) => {
  try {
    const egresos = egresosDB.getAll(req.user.id)
    res.json(egresos)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Obtener un egreso por ID
router.get('/:id', (req, res) => {
  try {
    const egreso = egresosDB.getById(req.params.id, req.user.id)
    if (!egreso) {
      return res.status(404).json({ error: 'Egreso no encontrado' })
    }
    res.json(egreso)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Crear un nuevo egreso
router.post('/', (req, res) => {
  try {
    const { descripcion, monto, moneda, metodo_pago, cuenta_transferencia, categoria, fecha } = req.body
    
    if (!descripcion || !monto) {
      return res.status(400).json({ 
        error: 'Descripción y monto son requeridos' 
      })
    }

    // Validar cuenta de transferencia si el método es transferencia
    if (metodo_pago === 'transferencia' && !cuenta_transferencia) {
      return res.status(400).json({ 
        error: 'Debe especificar la cuenta de transferencia' 
      })
    }

    const nuevoEgreso = egresosDB.create({
      descripcion,
      monto,
      moneda: moneda || 'ARS',
      metodo_pago: metodo_pago || 'efectivo',
      cuenta_transferencia: cuenta_transferencia || '',
      categoria: categoria || '',
      fecha: fecha || new Date().toISOString().split('T')[0]
    }, req.user.id)
    
    res.status(201).json(nuevoEgreso)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Actualizar un egreso
router.put('/:id', (req, res) => {
  try {
    const { descripcion, monto, moneda, metodo_pago, cuenta_transferencia, categoria, fecha } = req.body
    
    const egresoExistente = egresosDB.getById(req.params.id, req.user.id)
    if (!egresoExistente) {
      return res.status(404).json({ error: 'Egreso no encontrado' })
    }

    // Validar cuenta de transferencia si el método es transferencia
    if (metodo_pago === 'transferencia' && !cuenta_transferencia) {
      return res.status(400).json({ 
        error: 'Debe especificar la cuenta de transferencia' 
      })
    }

    const egresoActualizado = egresosDB.update(req.params.id, {
      descripcion: descripcion !== undefined ? descripcion : egresoExistente.descripcion,
      monto: monto !== undefined ? monto : egresoExistente.monto,
      moneda: moneda !== undefined ? moneda : egresoExistente.moneda,
      metodo_pago: metodo_pago !== undefined ? metodo_pago : egresoExistente.metodo_pago,
      cuenta_transferencia: cuenta_transferencia !== undefined ? cuenta_transferencia : egresoExistente.cuenta_transferencia,
      categoria: categoria !== undefined ? categoria : egresoExistente.categoria,
      fecha: fecha !== undefined ? fecha : egresoExistente.fecha
    }, req.user.id)
    
    res.json(egresoActualizado)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Eliminar un egreso
router.delete('/:id', (req, res) => {
  try {
    const egreso = egresosDB.getById(req.params.id, req.user.id)
    if (!egreso) {
      return res.status(404).json({ error: 'Egreso no encontrado' })
    }

    egresosDB.delete(req.params.id, req.user.id)
    res.json({ message: 'Egreso eliminado correctamente' })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

export default router

