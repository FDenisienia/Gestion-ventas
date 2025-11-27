import { readFileSync, writeFileSync, existsSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Función para obtener la ruta de la base de datos según el userId
function getDBPath(userId) {
  if (!userId) {
    // Si no hay userId, usar la base de datos por defecto (para migración)
    return join(__dirname, 'database.json')
  }
  return join(__dirname, `database_${userId}.json`)
}

// Inicializar base de datos por defecto si no existe (para migración)
const defaultDbPath = getDBPath(null)
if (!existsSync(defaultDbPath)) {
  const initialData = {
    clientes: [],
    ventas: [],
    egresos: [],
    articulos: [],
    categorias: [],
    categoriasVenta: []
  }
  writeFileSync(defaultDbPath, JSON.stringify(initialData, null, 2))
} else {
  // Migrar base de datos existente
  try {
    const db = JSON.parse(readFileSync(defaultDbPath, 'utf-8'))
    if (!db.articulos) {
      db.articulos = []
    }
    if (!db.categorias) {
      db.categorias = []
    }
    if (!db.categoriasVenta) {
      db.categoriasVenta = []
    }
    if (!db.egresos) {
      db.egresos = []
    }
    // Migrar artículos antiguos si tienen categoría como string
    if (db.articulos && db.articulos.length > 0) {
      db.articulos = db.articulos.map(art => {
        if (typeof art.categoria === 'string' && art.categoria && !art.categoria_id) {
          // Buscar o crear categoría
          let cat = db.categorias.find(c => c.nombre === art.categoria)
          if (!cat) {
            const newCatId = db.categorias.length > 0 
              ? Math.max(...db.categorias.map(c => c.id)) + 1 
              : 1
            cat = { id: newCatId, nombre: art.categoria, fecha_creacion: new Date().toISOString() }
            db.categorias.push(cat)
          }
          art.categoria_id = cat.id
          delete art.categoria
        }
        // Migrar precio a costo y venta si no existen
        if (art.precio && !art.costo) {
          art.costo = art.precio
          art.venta = art.precio
          delete art.precio
        }
        // Agregar marca si no existe
        if (!art.marca) {
          art.marca = ''
        }
        // Eliminar descripción
        delete art.descripcion
        return art
      })
    }
    // Migrar ventas antiguas
    if (db.ventas && db.ventas.length > 0) {
      db.ventas = db.ventas.map(venta => {
        if (!venta.items) {
          venta.items = [{
            articulo_id: null,
            nombre: venta.descripcion || 'Producto',
            cantidad: 1,
            precio: venta.monto || 0,
            descuento: 0,
            impuestos: 0,
            total: venta.monto || 0
          }]
        }
        // Migrar items para incluir información del artículo
        if (venta.items && venta.items.length > 0) {
          venta.items = venta.items.map(item => {
            if (item.articulo_id) {
              const articulo = db.articulos.find(a => a.id === item.articulo_id)
              if (articulo) {
                item.marca = articulo.marca || ''
                item.producto = articulo.nombre
                item.categoria = articulo.categoria_nombre || ''
                item.costo_unit = articulo.costo || 0
                item.precio_venta = item.precio || articulo.venta || 0
              }
            }
            if (!item.marca) item.marca = ''
            if (!item.producto) item.producto = item.nombre || 'Producto'
            if (!item.categoria) item.categoria = ''
            if (!item.costo_unit) item.costo_unit = 0
            if (!item.precio_venta) item.precio_venta = item.precio || 0
            return item
          })
        }
        if (!venta.fecha_emision) {
          venta.fecha_emision = venta.fecha_venta || new Date().toISOString()
        }
        if (!venta.fecha_vencimiento) {
          venta.fecha_vencimiento = venta.fecha_emision
        }
        if (!venta.categoria_venta_id) {
          venta.categoria_venta_id = null
        }
        if (!venta.descuento_porcentaje) {
          venta.descuento_porcentaje = 0
        }
        if (!venta.descuento_monto) {
          venta.descuento_monto = 0
        }
        if (!venta.nota_cliente) {
          venta.nota_cliente = ''
        }
        if (!venta.tipo) {
          venta.tipo = 'venta'
        }
        if (!venta.moneda) {
          venta.moneda = 'ARS'
        }
        if (!venta.metodo_pago) {
          venta.metodo_pago = 'efectivo'
        }
        if (!venta.estado_pago) {
          venta.estado_pago = venta.estado === 'completada' ? 'pagado' : 'pendiente'
        }
        if (!venta.pendiente) {
          venta.pendiente = venta.estado_pago === 'pagado' ? 0 : venta.total_venta || venta.monto || 0
        }
        if (!venta.subtotal) {
          venta.subtotal = venta.monto || 0
        }
        if (!venta.total_neto) {
          venta.total_neto = venta.monto || 0
        }
        if (!venta.total_venta) {
          venta.total_venta = venta.monto || 0
        }
        if (!venta.cuenta_transferencia) {
          venta.cuenta_transferencia = ''
        }
        return venta
      })
    }
    writeFileSync(defaultDbPath, JSON.stringify(db, null, 2))
  } catch (error) {
    console.error('Error al migrar base de datos:', error)
  }
}

// Inicializar base de datos para un usuario específico
function initUserDB(userId) {
  const dbPath = getDBPath(userId)
  if (!existsSync(dbPath)) {
    const initialData = {
      clientes: [],
      ventas: [],
      egresos: [],
      articulos: [],
      categorias: [],
      categoriasVenta: []
    }
    writeFileSync(dbPath, JSON.stringify(initialData, null, 2))
  }
}

// Leer base de datos
function readDB(userId) {
  if (userId) {
    initUserDB(userId)
  }
  const dbPath = getDBPath(userId)
  try {
    const data = readFileSync(dbPath, 'utf-8')
    return JSON.parse(data)
  } catch (error) {
    return { clientes: [], ventas: [], egresos: [], articulos: [], categorias: [], categoriasVenta: [] }
  }
}

// Escribir base de datos
function writeDB(data, userId) {
  const dbPath = getDBPath(userId)
  try {
    writeFileSync(dbPath, JSON.stringify(data, null, 2))
  } catch (error) {
    console.error('Error al escribir base de datos:', error)
    throw error
  }
}

// Exportar getDBPath para uso en otros módulos
export { getDBPath, initUserDB }

// Funciones para clientes
export const clientesDB = {
  getAll: (userId) => {
    const db = readDB(userId)
    return db.clientes.sort((a, b) => new Date(b.fecha_creacion) - new Date(a.fecha_creacion))
  },
  
  getById: (id, userId) => {
    const db = readDB(userId)
    return db.clientes.find(c => c.id === parseInt(id))
  },
  
  create: (cliente, userId) => {
    try {
      const db = readDB(userId)
      const newId = db.clientes.length > 0 
        ? Math.max(...db.clientes.map(c => c.id)) + 1 
        : 1
      const nuevoCliente = {
        id: newId,
        nombre: cliente.nombre,
        dni: cliente.dni || '',
        telefono: cliente.telefono || '',
        fecha_creacion: new Date().toISOString()
      }
      db.clientes.push(nuevoCliente)
      writeDB(db, userId)
      return nuevoCliente
    } catch (error) {
      console.error('Error en clientesDB.create:', error)
      throw error
    }
  },
  
  update: (id, updates, userId) => {
    const db = readDB(userId)
    const index = db.clientes.findIndex(c => c.id === parseInt(id))
    if (index === -1) return null
    db.clientes[index] = { ...db.clientes[index], ...updates }
    writeDB(db, userId)
    return db.clientes[index]
  },
  
  delete: (id, userId) => {
    const db = readDB(userId)
    const index = db.clientes.findIndex(c => c.id === parseInt(id))
    if (index === -1) return false
    db.clientes.splice(index, 1)
    writeDB(db, userId)
    return true
  }
}

// Funciones para ventas
export const ventasDB = {
  getAll: (userId) => {
    const db = readDB(userId)
    const clientes = db.clientes
    const categoriasVenta = db.categoriasVenta
    const articulos = db.articulos
    const categorias = db.categorias
    
    // Devolver ventas completas (no expandidas)
    return db.ventas
      .map(venta => {
        const cliente = clientes.find(c => c.id === venta.cliente_id)
        const categoriaVenta = categoriasVenta.find(c => c.id === venta.categoria_venta_id)
        
        // Procesar items para obtener detalles
        const itemsDetalle = (venta.items || []).map(item => {
          const articulo = item.articulo_id ? articulos.find(a => a.id === item.articulo_id) : null
          const categoria = articulo && articulo.categoria_id ? categorias.find(c => c.id === articulo.categoria_id) : null
          
          return {
            nombre: item.producto || item.nombre || 'Producto',
            marca: item.marca || (articulo ? articulo.marca : '') || '',
            cantidad: item.cantidad || 1,
            precio: item.precio_venta || item.precio || 0,
            costo_unit: item.costo_unit || (articulo ? articulo.costo : 0),
            categoria: item.categoria || (categoria ? categoria.nombre : '') || '',
            moneda: articulo ? (articulo.moneda || 'ARS') : (venta.moneda || 'ARS') // Moneda del artículo
          }
        })
        
        // Calcular estado de pago basado en pendiente
        const pendiente = venta.pendiente !== undefined ? parseFloat(venta.pendiente) : (venta.estado_pago === 'pagado' ? 0 : venta.total_venta || 0)
        const totalVenta = parseFloat(venta.total_venta || 0)
        let estadoPago = venta.estado_pago
        
        // Si no hay estado_pago, calcularlo basado en pendiente
        if (!estadoPago) {
          if (pendiente === 0) {
            estadoPago = 'pagado'
          } else if (pendiente > 0 && pendiente < totalVenta) {
            estadoPago = 'parcial'
          } else {
            estadoPago = 'pendiente'
          }
        }
        
        return {
          id: venta.id,
          venta_id: venta.id,
          cliente_id: venta.cliente_id,
          cliente_nombre: cliente ? cliente.nombre : 'Cliente eliminado',
          cliente_dni: cliente ? cliente.dni : '',
          items: venta.items || [],
          items_detalle: itemsDetalle,
          moneda: venta.moneda || 'ARS',
          total_venta: totalVenta,
          estado_pago: estadoPago,
          metodo_pago: venta.metodo_pago || 'efectivo',
          cuenta_transferencia: venta.cuenta_transferencia || '',
          pendiente: pendiente,
          fecha: venta.fecha_emision || venta.fecha_venta,
          categoria_venta_nombre: categoriaVenta ? categoriaVenta.nombre : ''
        }
      })
      .sort((a, b) => new Date(b.fecha) - new Date(a.fecha))
  },

  getById: (id, userId) => {
    const db = readDB(userId)
    const venta = db.ventas.find(v => v.id === parseInt(id))
    if (!venta) return null
    
    const cliente = db.clientes.find(c => c.id === venta.cliente_id)
    const categoriaVenta = db.categoriasVenta.find(c => c.id === venta.categoria_venta_id)
    const articulos = db.articulos
    const categorias = db.categorias
    
    // Procesar items para obtener detalles
    const itemsDetalle = (venta.items || []).map(item => {
      const articulo = item.articulo_id ? articulos.find(a => a.id === item.articulo_id) : null
      const categoria = articulo && articulo.categoria_id ? categorias.find(c => c.id === articulo.categoria_id) : null
      
      return {
        nombre: item.producto || item.nombre || 'Producto',
        marca: item.marca || (articulo ? articulo.marca : '') || '',
        cantidad: item.cantidad || 1,
        precio: item.precio_venta || item.precio || 0,
        costo_unit: item.costo_unit || (articulo ? articulo.costo : 0),
        categoria: item.categoria || (categoria ? categoria.nombre : '') || '',
        moneda: articulo ? (articulo.moneda || 'ARS') : (venta.moneda || 'ARS') // Moneda del artículo
      }
    })
    
    // Calcular estado de pago basado en pendiente
    const pendiente = venta.pendiente !== undefined ? parseFloat(venta.pendiente) : (venta.estado_pago === 'pagado' ? 0 : venta.total_venta || 0)
    const totalVenta = parseFloat(venta.total_venta || 0)
    let estadoPago = venta.estado_pago
    
    if (!estadoPago) {
      if (pendiente === 0) {
        estadoPago = 'pagado'
      } else if (pendiente > 0 && pendiente < totalVenta) {
        estadoPago = 'parcial'
      } else {
        estadoPago = 'pendiente'
      }
    }
    
    return {
      id: venta.id,
      venta_id: venta.id,
      cliente_id: venta.cliente_id,
      cliente_nombre: cliente ? cliente.nombre : 'Cliente eliminado',
      cliente_dni: cliente ? cliente.dni : '',
      items: venta.items || [],
      items_detalle: itemsDetalle,
      moneda: venta.moneda || 'ARS',
      total_venta: totalVenta,
      estado_pago: estadoPago,
      metodo_pago: venta.metodo_pago || 'efectivo',
      cuenta_transferencia: venta.cuenta_transferencia || '',
      pendiente: pendiente,
      fecha: venta.fecha_emision || venta.fecha_venta,
      categoria_venta_nombre: categoriaVenta ? categoriaVenta.nombre : ''
    }
  },
  
  getByClienteId: (clienteId, userId) => {
    const db = readDB(userId)
    const cliente = db.clientes.find(c => c.id === parseInt(clienteId))
    const categoriasVenta = db.categoriasVenta
    const articulos = db.articulos
    const categorias = db.categorias
    
    return db.ventas
      .filter(v => v.cliente_id === parseInt(clienteId))
      .map(venta => {
        const categoriaVenta = categoriasVenta.find(c => c.id === venta.categoria_venta_id)
        
        // Procesar items para obtener detalles
        const itemsDetalle = (venta.items || []).map(item => {
          const articulo = item.articulo_id ? articulos.find(a => a.id === item.articulo_id) : null
          const categoria = articulo && articulo.categoria_id ? categorias.find(c => c.id === articulo.categoria_id) : null
          
          return {
            nombre: item.producto || item.nombre || 'Producto',
            marca: item.marca || (articulo ? articulo.marca : '') || '',
            cantidad: item.cantidad || 1,
            precio: item.precio_venta || item.precio || 0,
            costo_unit: item.costo_unit || (articulo ? articulo.costo : 0),
            categoria: item.categoria || (categoria ? categoria.nombre : '') || '',
            moneda: articulo ? (articulo.moneda || 'ARS') : (venta.moneda || 'ARS') // Moneda del artículo
          }
        })
        
        // Calcular estado de pago basado en pendiente
        const pendiente = venta.pendiente !== undefined ? parseFloat(venta.pendiente) : (venta.estado_pago === 'pagado' ? 0 : venta.total_venta || 0)
        const totalVenta = parseFloat(venta.total_venta || 0)
        let estadoPago = venta.estado_pago
        
        if (!estadoPago) {
          if (pendiente === 0) {
            estadoPago = 'pagado'
          } else if (pendiente > 0 && pendiente < totalVenta) {
            estadoPago = 'parcial'
          } else {
            estadoPago = 'pendiente'
          }
        }
        
        return {
          ...venta,
          cliente_nombre: cliente ? cliente.nombre : 'Cliente eliminado',
          cliente_dni: cliente ? cliente.dni : '',
          categoria_venta_nombre: categoriaVenta ? categoriaVenta.nombre : '',
          items_detalle: itemsDetalle,
          estado_pago: estadoPago,
          pendiente: pendiente,
          total_venta: totalVenta
        }
      })
      .sort((a, b) => new Date(b.fecha_emision || b.fecha_venta) - new Date(a.fecha_emision || a.fecha_venta))
  },
  
  create: (venta, userId) => {
    const db = readDB(userId)
    const cliente = db.clientes.find(c => c.id === parseInt(venta.cliente_id))
    if (!cliente) throw new Error('Cliente no encontrado')
    
    const newId = db.ventas.length > 0 
      ? Math.max(...db.ventas.map(v => v.id)) + 1 
      : 1
    
    // Procesar items para incluir información completa y descontar stock
    const itemsProcesados = (venta.items || []).map(item => {
      const articulo = item.articulo_id ? db.articulos.find(a => a.id === parseInt(item.articulo_id)) : null
      
      // Descontar stock del artículo si existe
      if (articulo && item.articulo_id) {
        const cantidad = parseInt(item.cantidad) || 1
        const stockActual = parseInt(articulo.stock) || 0
        const nuevoStock = Math.max(0, stockActual - cantidad) // No permitir stock negativo
        articulo.stock = nuevoStock
      }
      
      return {
        articulo_id: item.articulo_id ? parseInt(item.articulo_id) : null,
        nombre: item.nombre || (articulo ? articulo.nombre : 'Producto'),
        marca: item.marca || (articulo ? articulo.marca : '') || '',
        producto: item.producto || item.nombre || (articulo ? articulo.nombre : 'Producto'),
        categoria: item.categoria || '',
        cantidad: parseInt(item.cantidad) || 1,
        precio: parseFloat(item.precio) || (articulo ? articulo.venta : 0),
        costo_unit: parseFloat(item.costo_unit) || (articulo ? articulo.costo : 0),
        precio_venta: parseFloat(item.precio_venta) || parseFloat(item.precio) || (articulo ? articulo.venta : 0),
        descuento: parseFloat(item.descuento) || 0,
        impuestos: parseFloat(item.impuestos) || 0,
        total: parseFloat(item.total) || (parseFloat(item.precio) || (articulo ? articulo.venta : 0)) * (parseInt(item.cantidad) || 1)
      }
    })
    
    const nuevaVenta = {
      id: newId,
      cliente_id: parseInt(venta.cliente_id),
      items: itemsProcesados,
      categoria_venta_id: venta.categoria_venta_id || null,
      fecha_emision: venta.fecha_emision || new Date().toISOString(),
      fecha_vencimiento: venta.fecha_vencimiento || venta.fecha_emision || new Date().toISOString(),
      descuento_porcentaje: parseFloat(venta.descuento_porcentaje) || 0,
      descuento_monto: parseFloat(venta.descuento_monto) || 0,
      subtotal: parseFloat(venta.subtotal) || 0,
      total_neto: parseFloat(venta.total_neto) || 0,
      total_venta: parseFloat(venta.total_venta) || 0,
      nota_cliente: venta.nota_cliente || '',
      tipo: venta.tipo || 'venta',
      estado: venta.estado || 'pendiente',
      moneda: venta.moneda || 'ARS',
      metodo_pago: venta.metodo_pago || 'efectivo',
      cuenta_transferencia: venta.cuenta_transferencia || '',
      estado_pago: venta.estado_pago || (venta.estado === 'completada' ? 'pagado' : 'pendiente'),
      pendiente: parseFloat(venta.pendiente) !== undefined ? parseFloat(venta.pendiente) : (venta.estado_pago === 'pagado' ? 0 : parseFloat(venta.total_venta) || 0),
      fecha_venta: new Date().toISOString(),
      // Campos legacy para compatibilidad
      descripcion: venta.descripcion || '',
      monto: parseFloat(venta.total_venta) || 0
    }
    db.ventas.push(nuevaVenta)
    writeDB(db, userId)
    const categoriaVenta = db.categoriasVenta.find(c => c.id === nuevaVenta.categoria_venta_id)
    return {
      ...nuevaVenta,
      cliente_nombre: cliente.nombre,
      cliente_dni: cliente.dni,
      categoria_venta_nombre: categoriaVenta ? categoriaVenta.nombre : ''
    }
  },
  
  update: (id, updates, userId) => {
    const db = readDB(userId)
    const index = db.ventas.findIndex(v => v.id === parseInt(id))
    if (index === -1) return null
    db.ventas[index] = { 
      ...db.ventas[index], 
      ...updates,
      monto: updates.total_venta !== undefined ? parseFloat(updates.total_venta) : db.ventas[index].monto,
      descuento_porcentaje: updates.descuento_porcentaje !== undefined ? parseFloat(updates.descuento_porcentaje) : db.ventas[index].descuento_porcentaje,
      descuento_monto: updates.descuento_monto !== undefined ? parseFloat(updates.descuento_monto) : db.ventas[index].descuento_monto,
      subtotal: updates.subtotal !== undefined ? parseFloat(updates.subtotal) : db.ventas[index].subtotal,
      total_neto: updates.total_neto !== undefined ? parseFloat(updates.total_neto) : db.ventas[index].total_neto,
      total_venta: updates.total_venta !== undefined ? parseFloat(updates.total_venta) : db.ventas[index].total_venta,
      estado_pago: updates.estado_pago !== undefined ? updates.estado_pago : db.ventas[index].estado_pago,
      pendiente: updates.pendiente !== undefined ? parseFloat(updates.pendiente) : db.ventas[index].pendiente,
      moneda: updates.moneda !== undefined ? updates.moneda : db.ventas[index].moneda,
      metodo_pago: updates.metodo_pago !== undefined ? updates.metodo_pago : db.ventas[index].metodo_pago,
      cuenta_transferencia: updates.cuenta_transferencia !== undefined ? updates.cuenta_transferencia : (db.ventas[index].cuenta_transferencia || '')
    }
    writeDB(db, userId)
    const venta = db.ventas[index]
    const cliente = db.clientes.find(c => c.id === venta.cliente_id)
    const categoriaVenta = db.categoriasVenta.find(c => c.id === venta.categoria_venta_id)
    return {
      ...venta,
      cliente_nombre: cliente ? cliente.nombre : 'Cliente eliminado',
      cliente_dni: cliente ? cliente.dni : '',
      categoria_venta_nombre: categoriaVenta ? categoriaVenta.nombre : ''
    }
  },
  
  delete: (id, userId) => {
    const db = readDB(userId)
    const index = db.ventas.findIndex(v => v.id === parseInt(id))
    if (index === -1) return false
    
    const venta = db.ventas[index]
    
    // Restaurar stock de los artículos
    if (venta.items && venta.items.length > 0) {
      venta.items.forEach(item => {
        if (item.articulo_id) {
          const articuloIndex = db.articulos.findIndex(a => a.id === parseInt(item.articulo_id))
          if (articuloIndex !== -1) {
            const cantidad = parseInt(item.cantidad) || 1
            db.articulos[articuloIndex].stock = (parseInt(db.articulos[articuloIndex].stock) || 0) + cantidad
          }
        }
      })
    }
    
    db.ventas.splice(index, 1)
    writeDB(db, userId)
    return true
  }
}

// Funciones para egresos
export const egresosDB = {
  getAll: (userId) => {
    const db = readDB(userId)
    return db.egresos
      .map(egreso => ({
        ...egreso,
        monto: parseFloat(egreso.monto) || 0,
        fecha: egreso.fecha || egreso.fecha_emision || new Date().toISOString()
      }))
      .sort((a, b) => new Date(b.fecha) - new Date(a.fecha))
  },
  
  getById: (id, userId) => {
    const db = readDB(userId)
    return db.egresos.find(e => e.id === parseInt(id))
  },
  
  create: (egreso, userId) => {
    const db = readDB(userId)
    const newId = db.egresos.length > 0 
      ? Math.max(...db.egresos.map(e => e.id)) + 1 
      : 1
    
    const nuevoEgreso = {
      id: newId,
      descripcion: egreso.descripcion || '',
      monto: parseFloat(egreso.monto) || 0,
      moneda: egreso.moneda || 'ARS',
      metodo_pago: egreso.metodo_pago || 'efectivo',
      cuenta_transferencia: egreso.cuenta_transferencia || '',
      categoria: egreso.categoria || '',
      fecha: egreso.fecha || new Date().toISOString().split('T')[0],
      fecha_creacion: new Date().toISOString()
    }
    
    db.egresos.push(nuevoEgreso)
    writeDB(db, userId)
    return nuevoEgreso
  },

  update: (id, updates, userId) => {
    const db = readDB(userId)
    const index = db.egresos.findIndex(e => e.id === parseInt(id))
    if (index === -1) return null
    
    db.egresos[index] = {
      ...db.egresos[index],
      ...updates,
      monto: updates.monto !== undefined ? parseFloat(updates.monto) : db.egresos[index].monto
    }
    
    writeDB(db, userId)
    return db.egresos[index]
  },
  
  delete: (id, userId) => {
    const db = readDB(userId)
    const index = db.egresos.findIndex(e => e.id === parseInt(id))
    if (index === -1) return false
    
    db.egresos.splice(index, 1)
    writeDB(db, userId)
    return true
  }
}

// Funciones para categorías de venta
export const categoriasVentaDB = {
  getAll: (userId) => {
    const db = readDB(userId)
    return db.categoriasVenta.sort((a, b) => new Date(b.fecha_creacion) - new Date(a.fecha_creacion))
  },

  getById: (id, userId) => {
    const db = readDB(userId)
    return db.categoriasVenta.find(c => c.id === parseInt(id))
  },

  create: (categoria, userId) => {
    try {
      const db = readDB(userId)
      const newId = db.categoriasVenta.length > 0 
        ? Math.max(...db.categoriasVenta.map(c => c.id)) + 1 
        : 1
      const nuevaCategoria = {
        id: newId,
        nombre: categoria.nombre,
        fecha_creacion: new Date().toISOString()
      }
      db.categoriasVenta.push(nuevaCategoria)
      writeDB(db, userId)
      return nuevaCategoria
    } catch (error) {
      console.error('Error en categoriasVentaDB.create:', error)
      throw error
    }
  },
  
  update: (id, updates, userId) => {
    const db = readDB(userId)
    const index = db.categoriasVenta.findIndex(c => c.id === parseInt(id))
    if (index === -1) return null
    db.categoriasVenta[index] = { ...db.categoriasVenta[index], ...updates }
    writeDB(db, userId)
    return db.categoriasVenta[index]
  },
  
  delete: (id, userId) => {
    const db = readDB(userId)
    const index = db.categoriasVenta.findIndex(c => c.id === parseInt(id))
    if (index === -1) return false
    // Verificar si hay ventas usando esta categoría
    const ventasConCategoria = db.ventas.filter(v => v.categoria_venta_id === parseInt(id))
    if (ventasConCategoria.length > 0) {
      throw new Error('No se puede eliminar la categoría porque hay ventas asociadas')
    }
    db.categoriasVenta.splice(index, 1)
    writeDB(db, userId)
    return true
  }
}

// Funciones para categorías
export const categoriasDB = {
  getAll: (userId) => {
    const db = readDB(userId)
    return db.categorias.sort((a, b) => new Date(b.fecha_creacion) - new Date(a.fecha_creacion))
  },

  getById: (id, userId) => {
    const db = readDB(userId)
    return db.categorias.find(c => c.id === parseInt(id))
  },

  create: (categoria, userId) => {
    try {
      const db = readDB(userId)
      const newId = db.categorias.length > 0 
        ? Math.max(...db.categorias.map(c => c.id)) + 1 
        : 1
      const nuevaCategoria = {
        id: newId,
        nombre: categoria.nombre,
        fecha_creacion: new Date().toISOString()
      }
      db.categorias.push(nuevaCategoria)
      writeDB(db, userId)
      return nuevaCategoria
    } catch (error) {
      console.error('Error en categoriasDB.create:', error)
      throw error
    }
  },
  
  update: (id, updates, userId) => {
    const db = readDB(userId)
    const index = db.categorias.findIndex(c => c.id === parseInt(id))
    if (index === -1) return null
    db.categorias[index] = { ...db.categorias[index], ...updates }
    writeDB(db, userId)
    return db.categorias[index]
  },
  
  delete: (id, userId) => {
    const db = readDB(userId)
    const index = db.categorias.findIndex(c => c.id === parseInt(id))
    if (index === -1) return false
    // Verificar si hay artículos usando esta categoría
    const articulosConCategoria = db.articulos.filter(a => a.categoria_id === parseInt(id))
    if (articulosConCategoria.length > 0) {
      throw new Error('No se puede eliminar la categoría porque hay artículos asociados')
    }
    db.categorias.splice(index, 1)
    writeDB(db, userId)
    return true
  }
}

// Funciones para artículos/stock
export const articulosDB = {
  getAll: (userId) => {
    const db = readDB(userId)
    const categorias = db.categorias
    return db.articulos
      .map(articulo => {
        const categoria = categorias.find(c => c.id === articulo.categoria_id)
        return {
          ...articulo,
          categoria_nombre: categoria ? categoria.nombre : ''
        }
      })
      .sort((a, b) => new Date(b.fecha_creacion) - new Date(a.fecha_creacion))
  },
  
  getById: (id, userId) => {
    const db = readDB(userId)
    const articulo = db.articulos.find(a => a.id === parseInt(id))
    if (!articulo) return null
    const categoria = db.categorias.find(c => c.id === articulo.categoria_id)
    return {
      ...articulo,
      categoria_nombre: categoria ? categoria.nombre : ''
    }
  },
  
  create: (articulo, userId) => {
    try {
      const db = readDB(userId)
      const newId = db.articulos.length > 0 
        ? Math.max(...db.articulos.map(a => a.id)) + 1 
        : 1
      const nuevoArticulo = {
        id: newId,
        marca: articulo.marca || '',
        nombre: articulo.nombre,
        costo: parseFloat(articulo.costo) || 0,
        venta: parseFloat(articulo.venta) || 0,
        stock: parseInt(articulo.stock) || 0,
        categoria_id: articulo.categoria_id ? parseInt(articulo.categoria_id) : null,
        moneda: articulo.moneda || 'ARS',
        fecha_creacion: new Date().toISOString()
      }
      db.articulos.push(nuevoArticulo)
      writeDB(db, userId)
      const categoria = db.categorias.find(c => c.id === nuevoArticulo.categoria_id)
      return {
        ...nuevoArticulo,
        categoria_nombre: categoria ? categoria.nombre : ''
      }
    } catch (error) {
      console.error('Error en articulosDB.create:', error)
      throw error
    }
  },
  
  update: (id, updates, userId) => {
    const db = readDB(userId)
    const index = db.articulos.findIndex(a => a.id === parseInt(id))
    if (index === -1) return null
    db.articulos[index] = { 
      ...db.articulos[index], 
      ...updates,
      costo: updates.costo !== undefined ? parseFloat(updates.costo) : db.articulos[index].costo,
      venta: updates.venta !== undefined ? parseFloat(updates.venta) : db.articulos[index].venta,
      stock: updates.stock !== undefined ? parseInt(updates.stock) : db.articulos[index].stock,
      categoria_id: updates.categoria_id !== undefined ? (updates.categoria_id ? parseInt(updates.categoria_id) : null) : db.articulos[index].categoria_id,
      moneda: updates.moneda !== undefined ? updates.moneda : (db.articulos[index].moneda || 'ARS')
    }
    writeDB(db, userId)
    const articulo = db.articulos[index]
    const categoria = db.categorias.find(c => c.id === articulo.categoria_id)
    return {
      ...articulo,
      categoria_nombre: categoria ? categoria.nombre : ''
    }
  },
  
  delete: (id, userId) => {
    const db = readDB(userId)
    const index = db.articulos.findIndex(a => a.id === parseInt(id))
    if (index === -1) return false
    db.articulos.splice(index, 1)
    writeDB(db, userId)
    return true
  }
}
