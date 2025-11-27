import express from 'express'
import { ventasDB } from '../database.js'
import { authenticateToken } from '../middleware/auth.js'

const router = express.Router()

// Todas las rutas requieren autenticación
router.use(authenticateToken)

// Obtener todas las ventas
router.get('/', (req, res) => {
  try {
    const ventas = ventasDB.getAll(req.user.id)
    res.json(ventas)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Obtener ventas de un cliente específico
router.get('/cliente/:clienteId', (req, res) => {
  try {
    const ventas = ventasDB.getByClienteId(req.params.clienteId, req.user.id)
    res.json(ventas)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Obtener una venta por ID
router.get('/:id', (req, res) => {
  try {
    const venta = ventasDB.getById(req.params.id, req.user.id)
    if (!venta) {
      return res.status(404).json({ error: 'Venta no encontrada' })
    }
    res.json(venta)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Crear una nueva venta
router.post('/', (req, res) => {
  try {
    const { 
      cliente_id, 
      items, 
      categoria_venta_id,
      fecha_emision,
      fecha_vencimiento,
      descuento_porcentaje,
      descuento_monto,
      subtotal,
      total_neto,
      total_venta,
      nota_cliente,
      tipo,
      estado,
      moneda,
      metodo_pago,
      cuenta_transferencia,
      estado_pago,
      pendiente
    } = req.body
    
    if (!cliente_id) {
      return res.status(400).json({ 
        error: 'cliente_id es requerido' 
      })
    }

    if (!items || items.length === 0) {
      return res.status(400).json({ 
        error: 'La venta debe tener al menos un item' 
      })
    }

    const nuevaVenta = ventasDB.create({
      cliente_id,
      items,
      categoria_venta_id,
      fecha_emision,
      fecha_vencimiento,
      descuento_porcentaje,
      descuento_monto,
      subtotal,
      total_neto,
      total_venta,
      nota_cliente,
      tipo,
      estado: estado || 'pendiente',
      moneda: moneda || 'ARS',
      metodo_pago: metodo_pago || 'efectivo',
      cuenta_transferencia: cuenta_transferencia || '',
      estado_pago: estado_pago || (estado === 'completada' ? 'pagado' : 'pendiente'),
      pendiente: pendiente !== undefined ? pendiente : (estado_pago === 'pagado' ? 0 : total_venta || 0),
      descripcion: items.map(i => i.nombre).join(', ')
    }, req.user.id)
    
    res.status(201).json(nuevaVenta)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Actualizar una venta
router.put('/:id', (req, res) => {
  try {
    const { 
      items,
      categoria_venta_id,
      fecha_emision,
      fecha_vencimiento,
      descuento_porcentaje,
      descuento_monto,
      subtotal,
      total_neto,
      total_venta,
      nota_cliente,
      tipo,
      estado,
      estado_pago,
      pendiente,
      moneda,
      metodo_pago,
      cuenta_transferencia
    } = req.body
    
    const ventaExistente = ventasDB.getById(req.params.id, req.user.id)
    if (!ventaExistente) {
      return res.status(404).json({ error: 'Venta no encontrada' })
    }

    const ventaActualizada = ventasDB.update(req.params.id, {
      items: items !== undefined ? items : ventaExistente.items,
      categoria_venta_id: categoria_venta_id !== undefined ? categoria_venta_id : ventaExistente.categoria_venta_id,
      fecha_emision: fecha_emision !== undefined ? fecha_emision : ventaExistente.fecha_emision,
      fecha_vencimiento: fecha_vencimiento !== undefined ? fecha_vencimiento : ventaExistente.fecha_vencimiento,
      descuento_porcentaje: descuento_porcentaje !== undefined ? descuento_porcentaje : ventaExistente.descuento_porcentaje,
      descuento_monto: descuento_monto !== undefined ? descuento_monto : ventaExistente.descuento_monto,
      subtotal: subtotal !== undefined ? subtotal : ventaExistente.subtotal,
      total_neto: total_neto !== undefined ? total_neto : ventaExistente.total_neto,
      total_venta: total_venta !== undefined ? total_venta : ventaExistente.total_venta,
      nota_cliente: nota_cliente !== undefined ? nota_cliente : ventaExistente.nota_cliente,
      tipo: tipo !== undefined ? tipo : ventaExistente.tipo,
      estado: estado !== undefined ? estado : ventaExistente.estado,
      estado_pago: estado_pago !== undefined ? estado_pago : ventaExistente.estado_pago,
      pendiente: pendiente !== undefined ? parseFloat(pendiente) : ventaExistente.pendiente,
      moneda: moneda !== undefined ? moneda : ventaExistente.moneda,
      metodo_pago: metodo_pago !== undefined ? metodo_pago : ventaExistente.metodo_pago,
      cuenta_transferencia: cuenta_transferencia !== undefined ? cuenta_transferencia : ventaExistente.cuenta_transferencia
    }, req.user.id)
    
    res.json(ventaActualizada)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Eliminar una venta
router.delete('/:id', (req, res) => {
  try {
    const venta = ventasDB.getById(req.params.id, req.user.id)
    if (!venta) {
      return res.status(404).json({ error: 'Venta no encontrada' })
    }

    ventasDB.delete(req.params.id, req.user.id)
    res.json({ message: 'Venta eliminada correctamente' })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

export default router
