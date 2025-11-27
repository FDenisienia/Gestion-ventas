import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import './Ingresos.css'

function Ingresos() {
  const { token } = useAuth()
  const [ventas, setVentas] = useState([])
  const [clientes, setClientes] = useState([])
  const [articulos, setArticulos] = useState([])
  const [categorias, setCategorias] = useState([])
  const [busquedaDNI, setBusquedaDNI] = useState('')
  const [filtroEstadoPago, setFiltroEstadoPago] = useState('todos')
  const [showModal, setShowModal] = useState(false)
  const [showDetalleModal, setShowDetalleModal] = useState(false)
  const [ventaDetalle, setVentaDetalle] = useState(null)
  const [editingVenta, setEditingVenta] = useState(null)
  const [busquedaCliente, setBusquedaCliente] = useState('')
  const [clienteSeleccionado, setClienteSeleccionado] = useState(null)
  const [itemsVenta, setItemsVenta] = useState([])
  const [itemActual, setItemActual] = useState({
    producto_id: '',
    producto_nombre: '',
    categoria_id: '',
    costo_unitario: '',
    precio_venta: '',
    cantidad: 1
  })
  const [formData, setFormData] = useState({
    estado_pago: 'pendiente',
    metodo_pago: '',
    moneda: 'ARS',
    cuenta_transferencia: '',
    fecha: new Date().toISOString().split('T')[0]
  })

  useEffect(() => {
    if (token) {
      fetchVentas()
      fetchClientes()
      fetchArticulos()
      fetchCategorias()
    }
  }, [token])

  const fetchVentas = async () => {
    try {
      const response = await fetch('/api/ventas', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`)
      }
      const data = await response.json()
      // El backend devuelve ventas completas (no expandidas)
      setVentas(data || [])
    } catch (error) {
      console.error('Error al cargar ventas:', error)
      setVentas([]) // Establecer array vacío en caso de error
    }
  }

  const fetchClientes = async () => {
    try {
      const response = await fetch('/api/clientes', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`)
      }
      const data = await response.json()
      setClientes(data || [])
    } catch (error) {
      console.error('Error al cargar clientes:', error)
      setClientes([]) // Establecer array vacío en caso de error
    }
  }

  const fetchArticulos = async () => {
    try {
      const response = await fetch('/api/articulos', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`)
      }
      const data = await response.json()
      setArticulos(data || [])
    } catch (error) {
      console.error('Error al cargar artículos:', error)
      setArticulos([]) // Establecer array vacío en caso de error
    }
  }

  const fetchCategorias = async () => {
    try {
      const response = await fetch('/api/categorias', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`)
      }
      const data = await response.json()
      setCategorias(data || [])
    } catch (error) {
      console.error('Error al cargar categorías:', error)
      setCategorias([]) // Establecer array vacío en caso de error
    }
  }

  const handleClienteChange = (clienteId) => {
    if (clienteId) {
      const cliente = clientes.find(c => c.id === parseInt(clienteId))
      if (cliente) {
        setClienteSeleccionado(cliente)
        setBusquedaCliente('')
      }
    } else {
      setClienteSeleccionado(null)
    }
  }

  const clientesFiltrados = Array.isArray(clientes) ? clientes.filter(cliente => {
    if (!busquedaCliente) return true
    const busqueda = busquedaCliente.toLowerCase()
    return (
      cliente.nombre?.toLowerCase().includes(busqueda) ||
      cliente.dni?.toString().includes(busqueda) ||
      cliente.telefono?.toString().includes(busqueda)
    )
  }) : []

  const handleProductoChange = (productoId) => {
    if (productoId) {
      const articulo = articulos.find(a => a.id === parseInt(productoId))
      if (articulo) {
        setItemActual({
          producto_id: articulo.id,
          producto_nombre: articulo.nombre,
          categoria_id: articulo.categoria_id || '',
          costo_unitario: articulo.costo || '',
          precio_venta: articulo.venta || '',
          cantidad: 1
        })
        // Actualizar la moneda de la venta según el producto seleccionado
        if (articulo.moneda) {
          setFormData({...formData, moneda: articulo.moneda})
        }
      }
    } else {
      setItemActual({
        producto_id: '',
        producto_nombre: '',
        categoria_id: '',
        costo_unitario: '',
        precio_venta: '',
        cantidad: 1
      })
    }
  }

  const handleAgregarItem = () => {
    if (!itemActual.producto_nombre || !itemActual.precio_venta) {
      alert('Debe ingresar nombre del producto y precio de venta')
      return
    }
    if (itemActual.cantidad <= 0) {
      alert('La cantidad debe ser mayor a 0')
      return
    }

    const categoria = itemActual.categoria_id 
      ? categorias.find(c => c.id === parseInt(itemActual.categoria_id))?.nombre || ''
      : ''

    const articulo = itemActual.producto_id ? articulos.find(a => a.id === parseInt(itemActual.producto_id)) : null
    
    const nuevoItem = {
      id: Date.now(), // ID temporal
      articulo_id: itemActual.producto_id ? parseInt(itemActual.producto_id) : null,
      nombre: itemActual.producto_nombre,
      marca: articulo ? articulo.marca : '',
      producto: itemActual.producto_nombre,
      categoria: categoria,
      cantidad: parseInt(itemActual.cantidad) || 1,
      precio: parseFloat(itemActual.precio_venta) || 0,
      costo_unit: parseFloat(itemActual.costo_unitario) || 0,
      precio_venta: parseFloat(itemActual.precio_venta) || 0,
      total: (parseFloat(itemActual.precio_venta) || 0) * (parseInt(itemActual.cantidad) || 1)
    }
    
    // Si todos los items tienen la misma moneda, actualizar la moneda de la venta
    const itemsConMoneda = [...itemsVenta, nuevoItem].map(item => {
      const art = item.articulo_id ? articulos.find(a => a.id === item.articulo_id) : null
      return art ? art.moneda : formData.moneda
    })
    const monedasUnicas = [...new Set(itemsConMoneda)]
    if (monedasUnicas.length === 1 && monedasUnicas[0]) {
      setFormData({...formData, moneda: monedasUnicas[0]})
    }

    setItemsVenta([...itemsVenta, nuevoItem])
    setItemActual({
      producto_id: '',
      producto_nombre: '',
      categoria_id: '',
      costo_unitario: '',
      precio_venta: '',
      cantidad: 1
    })
  }

  const handleEliminarItem = (itemId) => {
    setItemsVenta(itemsVenta.filter(item => item.id !== itemId))
  }

  const calcularGananciaTotal = () => {
    return itemsVenta.reduce((sum, item) => {
      const ganancia = (item.precio_venta - item.costo_unit) * item.cantidad
      return sum + ganancia
    }, 0)
  }

  const calcularTotalVenta = () => {
    return itemsVenta.reduce((sum, item) => sum + item.total, 0)
  }

  const handleGuardar = async () => {
    if (!clienteSeleccionado) {
      alert('Debe seleccionar un cliente')
      return
    }

    if (itemsVenta.length === 0) {
      alert('Debe agregar al menos un artículo a la venta')
      return
    }

    // Preparar items sin el ID temporal
    const items = itemsVenta.map(({ id, ...item }) => item)

    const totalVenta = calcularTotalVenta()

    // Validar cuenta de transferencia si el método es transferencia
    if (formData.metodo_pago === 'transferencia' && !formData.cuenta_transferencia.trim()) {
      alert('Debe ingresar la cuenta de transferencia')
      return
    }

    // Crear venta
    const venta = {
      cliente_id: clienteSeleccionado.id,
      categoria_venta_id: null,
      items: items,
      fecha_emision: formData.fecha,
      fecha_vencimiento: formData.fecha,
      moneda: formData.moneda,
      metodo_pago: formData.metodo_pago,
      cuenta_transferencia: formData.metodo_pago === 'transferencia' ? formData.cuenta_transferencia : '',
      estado_pago: formData.estado_pago,
      pendiente: formData.estado_pago === 'pagado' ? 0 : formData.estado_pago === 'parcial' ? totalVenta / 2 : totalVenta,
      subtotal: totalVenta,
      total_neto: totalVenta,
      total_venta: totalVenta,
      tipo: 'venta'
    }

    try {
      // Si estamos editando, usar PUT, si no, usar POST
      const ventaId = editingVenta?.id || editingVenta?.venta_id
      const method = ventaId ? 'PUT' : 'POST'
      const url = ventaId ? `/api/ventas/${ventaId}` : '/api/ventas'

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(venta)
      })

      if (response.ok) {
        alert(ventaId ? 'Venta actualizada correctamente' : 'Venta guardada correctamente')
        setShowModal(false)
        resetForm()
        // Esperar un momento antes de recargar para asegurar que el backend haya guardado
        setTimeout(() => {
          fetchVentas()
        }, 100)
      } else {
        const error = await response.json()
        alert(`Error: ${error.error}`)
      }
    } catch (error) {
      console.error('Error al guardar venta:', error)
      alert('Error al guardar la venta')
    }
  }

  const resetForm = () => {
    setClienteSeleccionado(null)
    setBusquedaCliente('')
    setItemsVenta([])
    setItemActual({
      producto_id: '',
      producto_nombre: '',
      categoria_id: '',
      costo_unitario: '',
      precio_venta: '',
      cantidad: 1
    })
    setFormData({
      estado_pago: 'pendiente',
      metodo_pago: '',
      moneda: 'ARS',
      fecha: new Date().toISOString().split('T')[0]
    })
    setVentaDetalle(null)
  }

  const handleEditarVenta = (venta) => {
    // Cargar los datos de la venta en el modal de edición
    setClienteSeleccionado(clientes.find(c => c.id === venta.cliente_id))
    setBusquedaCliente(clientes.find(c => c.id === venta.cliente_id)?.nombre || '')
    // Convertir items a formato con ID temporal para edición
    setItemsVenta((venta.items || []).map((item, index) => ({ ...item, id: index })))
    setFormData({
      estado_pago: venta.estado_pago || 'pendiente',
      metodo_pago: venta.metodo_pago || '',
      moneda: venta.moneda || 'ARS',
      cuenta_transferencia: venta.cuenta_transferencia || '',
      fecha: venta.fecha ? new Date(venta.fecha).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]
    })
    setEditingVenta(venta) // Guardar la venta que se está editando
    setShowModal(true)
  }

  const handleEliminarVenta = async (ventaId) => {
    if (!confirm('¿Estás seguro de eliminar esta venta? Esta acción restaurará el stock de los productos.')) {
      return
    }

    try {
      const response = await fetch(`/api/ventas/${ventaId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        alert('Venta eliminada correctamente')
        fetchVentas()
      } else {
        const error = await response.json()
        alert(`Error: ${error.error}`)
      }
    } catch (error) {
      console.error('Error al eliminar venta:', error)
      alert('Error al eliminar la venta')
    }
  }

  const handleActualizarEstadoPago = async (nuevoEstado, montoPagado = null) => {
    if (!ventaDetalle) return

    let nuevoPendiente = ventaDetalle.pendiente
    let estadoFinal = nuevoEstado

    if (nuevoEstado === 'pagado') {
      nuevoPendiente = 0
    } else if (nuevoEstado === 'parcial') {
      if (montoPagado !== null) {
        nuevoPendiente = Math.max(0, ventaDetalle.total_venta - parseFloat(montoPagado))
        if (nuevoPendiente === 0) {
          estadoFinal = 'pagado'
        }
      } else {
        // Si no se especifica monto, usar la mitad
        nuevoPendiente = ventaDetalle.total_venta / 2
      }
    } else if (nuevoEstado === 'pendiente') {
      nuevoPendiente = ventaDetalle.total_venta
    }

    try {
      const response = await fetch(`/api/ventas/${ventaDetalle.id || ventaDetalle.venta_id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          estado_pago: estadoFinal,
          pendiente: nuevoPendiente,
          estado: estadoFinal === 'pagado' ? 'completada' : 'pendiente'
        })
      })

      if (response.ok) {
        alert('Estado de pago actualizado correctamente')
        fetchVentas()
        // Actualizar el detalle localmente
        setVentaDetalle({
          ...ventaDetalle,
          estado_pago: estadoFinal,
          pendiente: nuevoPendiente
        })
      } else {
        const error = await response.json()
        alert(`Error: ${error.error}`)
      }
    } catch (error) {
      console.error('Error al actualizar estado de pago:', error)
      alert('Error al actualizar el estado de pago')
    }
  }

  const ventasFiltradas = ventas.filter(venta => {
    // Filtro por DNI
    const coincideDNI = !busquedaDNI || (venta.cliente_dni && venta.cliente_dni.toString().includes(busquedaDNI))
    
    // Filtro por estado de pago
    const estadoVenta = venta.estado_pago || (venta.pendiente === 0 ? 'pagado' : venta.pendiente < venta.total_venta ? 'parcial' : 'pendiente')
    const coincideEstado = filtroEstadoPago === 'todos' || estadoVenta === filtroEstadoPago
    
    return coincideDNI && coincideEstado
  })

  const gananciaTotal = calcularGananciaTotal()
  const totalVenta = calcularTotalVenta()
  const simboloMoneda = formData.moneda === 'USD' ? 'US$' : '$'

  return (
    <div className="ingresos-container">
      <div className="ventas-header">
        <div>
          <h1 className="ventas-title">Gestión de Ventas</h1>
          <p className="ventas-subtitle">Administra tus ventas de productos</p>
        </div>
        <button 
          className="btn-nueva-venta"
          onClick={() => setShowModal(true)}
        >
          + Nueva Venta
        </button>
      </div>

      <div className="busqueda-section">
        <div className="filtros-container">
          <input
            type="text"
            placeholder="Buscar por DNI..."
            value={busquedaDNI}
            onChange={(e) => setBusquedaDNI(e.target.value)}
            className="busqueda-input"
          />
          <select
            value={filtroEstadoPago}
            onChange={(e) => setFiltroEstadoPago(e.target.value)}
            className="filtro-estado-select"
          >
            <option value="todos">Todos los estados</option>
            <option value="pagado">Pagadas</option>
            <option value="parcial">Pago Parcial</option>
            <option value="pendiente">Pendientes</option>
          </select>
        </div>
      </div>

      <div className="table-container ventas-table-container">
        <table className="ventas-table">
          <thead>
            <tr>
              <th>Cliente</th>
              <th>DNI</th>
              <th>Detalle de Venta</th>
              <th>Método Pago</th>
              <th>Total</th>
              <th>Estado de Pago</th>
              <th>Pendiente</th>
              <th>Fecha</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {ventasFiltradas.length === 0 ? (
              <tr>
                <td colSpan="9" className="empty-state">
                  No hay ventas registradas
                </td>
              </tr>
            ) : (
              ventasFiltradas.map((venta) => {
                const simbolo = venta.moneda === 'USD' ? 'US$' : '$'
                const detalleVenta = venta.items_detalle && venta.items_detalle.length > 0
                  ? venta.items_detalle.map(item => 
                      `${item.cantidad}x ${item.nombre}${item.categoria ? ` (${item.categoria})` : ''}`
                    ).join(', ')
                  : 'Sin detalles'
                
                return (
                  <tr key={venta.id || venta.venta_id}>
                    <td>{venta.cliente_nombre}</td>
                    <td>{venta.cliente_dni || '-'}</td>
                    <td className="detalle-venta-cell">
                      <div 
                        className="detalle-venta-content clickeable"
                        onClick={() => {
                          setVentaDetalle(venta)
                          setShowDetalleModal(true)
                        }}
                        title="Click para ver detalle completo"
                      >
                        {venta.items_detalle && venta.items_detalle.length > 0
                          ? `${venta.items_detalle.length} artículo${venta.items_detalle.length > 1 ? 's' : ''} - Ver detalle`
                          : 'Sin detalles'}
                      </div>
                    </td>
                    <td>
                      <span className={`badge badge-metodo badge-${venta.metodo_pago === 'efectivo' ? 'efectivo' : 'transferencia'}`}>
                        {venta.metodo_pago === 'efectivo' ? 'Efectivo' : venta.metodo_pago === 'transferencia' ? 'Transferencia' : venta.metodo_pago || '-'}
                      </span>
                    </td>
                    <td>{simbolo}{parseFloat(venta.total_venta || 0).toFixed(2)}</td>
                    <td>
                      <span className={`badge badge-estado badge-${venta.estado_pago || (venta.pendiente === 0 ? 'pagado' : venta.pendiente < venta.total_venta ? 'parcial' : 'pendiente')}`}>
                        {venta.estado_pago === 'pagado' || venta.pendiente === 0 ? 'Pagado' : 
                         venta.estado_pago === 'parcial' || (venta.pendiente > 0 && venta.pendiente < venta.total_venta) ? 'Pago Parcial' : 
                         'Pendiente'}
                      </span>
                    </td>
                    <td>{simbolo}{parseFloat(venta.pendiente || 0).toFixed(2)}</td>
                    <td>{new Date(venta.fecha).toLocaleDateString('es-AR')}</td>
                    <td>
                      <button 
                        className="btn-edit" 
                        onClick={() => handleEditarVenta(venta)}
                      >
                        Editar
                      </button>
                      <button 
                        className="btn-delete" 
                        onClick={() => handleEliminarVenta(venta.id || venta.venta_id)}
                      >
                        Eliminar
                      </button>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content venta-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editingVenta ? 'Editar Venta' : 'Nueva Venta'}</h3>
              <button className="btn-close" onClick={() => setShowModal(false)}>×</button>
            </div>

            <div className="modal-body">
              <div className="form-section">
                <h4>Información del Cliente</h4>
                <div className="form-group">
                  <label>Seleccionar Cliente</label>
                  <div className="cliente-selector-container">
                    <input
                      type="text"
                      value={busquedaCliente}
                      onChange={(e) => setBusquedaCliente(e.target.value)}
                      placeholder="🔍 Buscar por nombre, DNI o teléfono..."
                      className="busqueda-cliente-input"
                    />
                    <select
                      value={clienteSeleccionado ? clienteSeleccionado.id : ''}
                      onChange={(e) => handleClienteChange(e.target.value)}
                      className="cliente-select"
                    >
                      <option value="">{busquedaCliente ? `Resultados para "${busquedaCliente}"` : 'Selecciona un cliente'}</option>
                      {clientesFiltrados.length === 0 && busquedaCliente ? (
                        <option value="" disabled>No se encontraron clientes</option>
                      ) : (
                        clientesFiltrados.map(cliente => (
                          <option key={cliente.id} value={cliente.id}>
                            {cliente.nombre} - DNI: {cliente.dni || 'N/A'}
                          </option>
                        ))
                      )}
                    </select>
                  </div>
                  {clienteSeleccionado && (
                    <div className="cliente-seleccionado-info">
                      <strong>Cliente seleccionado:</strong> {clienteSeleccionado.nombre} 
                      {clienteSeleccionado.dni && ` - DNI: ${clienteSeleccionado.dni}`}
                      {clienteSeleccionado.telefono && ` - Tel: ${clienteSeleccionado.telefono}`}
                    </div>
                  )}
                </div>
              </div>

              <div className="form-section">
                <h4>Artículos de la Venta</h4>
                
                {itemsVenta.length > 0 && (
                  <div className="items-lista">
                    <table className="items-table">
                      <thead>
                        <tr>
                          <th>Producto</th>
                          <th>Cantidad</th>
                          <th>Precio Unit.</th>
                          <th>Total</th>
                          <th>Acción</th>
                        </tr>
                      </thead>
                      <tbody>
                        {itemsVenta.map(item => (
                          <tr key={item.id}>
                            <td>{item.producto}</td>
                            <td>{item.cantidad}</td>
                            <td>{simboloMoneda}{item.precio_venta.toFixed(2)}</td>
                            <td>{simboloMoneda}{item.total.toFixed(2)}</td>
                            <td>
                              <button
                                type="button"
                                className="btn-eliminar-item-small"
                                onClick={() => handleEliminarItem(item.id)}
                              >
                                ✗
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                <div className="agregar-item-section">
                  <h5>Agregar Nuevo Artículo</h5>
                  <div className="form-group">
                    <label>Producto del Stock</label>
                    <select
                      value={itemActual.producto_id}
                      onChange={(e) => handleProductoChange(e.target.value)}
                    >
                      <option value="">Selecciona un producto (o ingresa manualmente)</option>
                      {articulos.map(art => (
                        <option key={art.id} value={art.id}>
                          {art.marca ? `${art.marca} - ` : ''}{art.nombre}
                        </option>
                      ))}
                    </select>
                    <small className="helper-text">
                      Selecciona un producto del stock para auto-completar los datos
                    </small>
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <label>Nombre del Producto</label>
                      <input
                        type="text"
                        value={itemActual.producto_nombre}
                        onChange={(e) => setItemActual({...itemActual, producto_nombre: e.target.value})}
                        placeholder="Nombre del producto"
                      />
                    </div>
                    <div className="form-group">
                      <label>Categoría</label>
                      <select
                        value={itemActual.categoria_id}
                        onChange={(e) => setItemActual({...itemActual, categoria_id: e.target.value})}
                      >
                        <option value="">Selecciona una categoría</option>
                        {categorias.map(cat => (
                          <option key={cat.id} value={cat.id}>
                            {cat.nombre}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <label>Costo Unitario ({simboloMoneda})</label>
                      <input
                        type="number"
                        step="0.01"
                        value={itemActual.costo_unitario}
                        onChange={(e) => setItemActual({...itemActual, costo_unitario: e.target.value})}
                      />
                    </div>
                    <div className="form-group">
                      <label>Precio de Venta ({simboloMoneda})</label>
                      <input
                        type="number"
                        step="0.01"
                        value={itemActual.precio_venta}
                        onChange={(e) => setItemActual({...itemActual, precio_venta: e.target.value})}
                      />
                    </div>
                    <div className="form-group">
                      <label>Cantidad</label>
                      <input
                        type="number"
                        value={itemActual.cantidad}
                        onChange={(e) => setItemActual({...itemActual, cantidad: e.target.value})}
                        min="1"
                      />
                    </div>
                  </div>
                  <button
                    type="button"
                    className="btn-agregar-item"
                    onClick={handleAgregarItem}
                  >
                    + Agregar Artículo
                  </button>
                </div>
              </div>

              <div className="form-section">
                <h4>Información de Pago</h4>
                <div className="form-row">
                  <div className="form-group">
                    <label>Estado de Pago</label>
                    <select
                      value={formData.estado_pago}
                      onChange={(e) => setFormData({...formData, estado_pago: e.target.value})}
                    >
                      <option value="pendiente">Pendiente</option>
                      <option value="parcial">Parcial</option>
                      <option value="pagado">Pagado</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Método de Pago</label>
                    <select
                      value={formData.metodo_pago}
                      onChange={(e) => setFormData({...formData, metodo_pago: e.target.value})}
                    >
                      <option value="">Selecciona método de pago</option>
                      <option value="efectivo">Efectivo</option>
                      <option value="transferencia">Transferencia</option>
                      <option value="tarjeta">Tarjeta</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="form-section">
                {formData.metodo_pago === 'transferencia' && (
                  <div className="form-group">
                    <label>Cuenta de Transferencia *</label>
                    <input
                      type="text"
                      value={formData.cuenta_transferencia}
                      onChange={(e) => setFormData({...formData, cuenta_transferencia: e.target.value})}
                      placeholder="Ej: Banco Nación - CBU 1234567890123456789012"
                      required={formData.metodo_pago === 'transferencia'}
                    />
                    <small className="helper-text">
                      Ingresa la cuenta bancaria donde se recibirá la transferencia
                    </small>
                  </div>
                )}
                <div className="form-group">
                  <label>Fecha</label>
                  <input
                    type="date"
                    value={formData.fecha}
                    onChange={(e) => setFormData({...formData, fecha: e.target.value})}
                  />
                </div>
              </div>

              <div className="ganancia-section">
                <div className="total-info">
                  <strong>Total Venta: {simboloMoneda}{totalVenta.toFixed(2)}</strong>
                </div>
                <div className="ganancia-info">
                  <strong>Ganancia estimada: {simboloMoneda}{gananciaTotal.toFixed(2)}</strong>
                </div>
              </div>
            </div>

            <div className="modal-actions">
              <button type="button" className="btn-secondary" onClick={() => {
                setShowModal(false)
                resetForm()
              }}>
                Cancelar
              </button>
              <button type="button" className="btn-primary" onClick={handleGuardar}>
                Guardar Venta
              </button>
            </div>
          </div>
        </div>
      )}

      {showDetalleModal && ventaDetalle && (
        <div className="modal-overlay" onClick={() => setShowDetalleModal(false)}>
          <div className="modal-content detalle-venta-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Detalle de Venta #{ventaDetalle.id || ventaDetalle.venta_id}</h3>
              <button className="btn-close" onClick={() => setShowDetalleModal(false)}>×</button>
            </div>

            <div className="modal-body">
              <div className="detalle-venta-info">
                <div className="info-row">
                  <strong>Cliente:</strong> {ventaDetalle.cliente_nombre}
                </div>
                <div className="info-row">
                  <strong>DNI:</strong> {ventaDetalle.cliente_dni || '-'}
                </div>
                <div className="info-row">
                  <strong>Fecha:</strong> {new Date(ventaDetalle.fecha).toLocaleDateString('es-AR')}
                </div>
                <div className="info-row">
                  <strong>Método de Pago:</strong>
                  <span className={`badge badge-metodo badge-${ventaDetalle.metodo_pago === 'efectivo' ? 'efectivo' : 'transferencia'}`}>
                    {ventaDetalle.metodo_pago === 'efectivo' ? 'Efectivo' : ventaDetalle.metodo_pago === 'transferencia' ? 'Transferencia' : ventaDetalle.metodo_pago || '-'}
                  </span>
                </div>
                <div className="info-row">
                  <strong>Estado de Pago:</strong>
                  <span className={`badge badge-estado badge-${ventaDetalle.estado_pago || (ventaDetalle.pendiente === 0 ? 'pagado' : ventaDetalle.pendiente < ventaDetalle.total_venta ? 'parcial' : 'pendiente')}`}>
                    {ventaDetalle.estado_pago === 'pagado' || ventaDetalle.pendiente === 0 ? 'Pagado' : 
                     ventaDetalle.estado_pago === 'parcial' || (ventaDetalle.pendiente > 0 && ventaDetalle.pendiente < ventaDetalle.total_venta) ? 'Pago Parcial' : 
                     'Pendiente'}
                  </span>
                </div>
                <div className="info-row">
                  <strong>Pendiente:</strong>
                  <span>
                    {ventaDetalle.moneda === 'USD' ? 'US$' : '$'}
                    {parseFloat(ventaDetalle.pendiente || 0).toFixed(2)}
                  </span>
                </div>
              </div>

              <div className="actualizar-pago-section">
                <h4>Actualizar Estado de Pago</h4>
                <div className="pago-actions">
                  <button
                    type="button"
                    className={`btn-estado-pago btn-pendiente ${ventaDetalle.estado_pago === 'pendiente' ? 'active' : ''}`}
                    onClick={() => handleActualizarEstadoPago('pendiente')}
                  >
                    Marcar como Pendiente
                  </button>
                  <button
                    type="button"
                    className={`btn-estado-pago btn-parcial ${ventaDetalle.estado_pago === 'parcial' ? 'active' : ''}`}
                    onClick={() => {
                      const monto = prompt(`Ingrese el monto pagado (Total: ${ventaDetalle.moneda === 'USD' ? 'US$' : '$'}${ventaDetalle.total_venta.toFixed(2)}):`)
                      if (monto !== null && monto !== '') {
                        handleActualizarEstadoPago('parcial', parseFloat(monto))
                      }
                    }}
                  >
                    Marcar como Parcial
                  </button>
                  <button
                    type="button"
                    className={`btn-estado-pago btn-pagado ${ventaDetalle.estado_pago === 'pagado' ? 'active' : ''}`}
                    onClick={() => handleActualizarEstadoPago('pagado')}
                  >
                    Marcar como Pagado
                  </button>
                </div>
              </div>

              <div className="detalle-items-section">
                <h4>Artículos de la Venta</h4>
                <div className="detalle-items-table-container">
                  <table className="detalle-items-table">
                  <thead>
                    <tr>
                      <th>Producto</th>
                      <th>Categoría</th>
                      <th>Cantidad</th>
                      <th>Precio Unit.</th>
                      <th>Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ventaDetalle.items_detalle && ventaDetalle.items_detalle.length > 0 ? (
                      ventaDetalle.items_detalle.map((item, index) => {
                        const itemCompleto = ventaDetalle.items[index]
                        const simbolo = ventaDetalle.moneda === 'USD' ? 'US$' : '$'
                        return (
                          <tr key={index}>
                            <td>{item.nombre}</td>
                            <td>
                              {item.categoria ? (
                                <span className="badge badge-categoria">{item.categoria}</span>
                              ) : '-'}
                            </td>
                            <td>{item.cantidad}</td>
                            <td>{simbolo}{parseFloat(item.precio || 0).toFixed(2)}</td>
                            <td>{simbolo}{parseFloat((item.precio || 0) * (item.cantidad || 1)).toFixed(2)}</td>
                          </tr>
                        )
                      })
                    ) : (
                      <tr>
                        <td colSpan="5" className="empty-state">No hay artículos</td>
                      </tr>
                    )}
                  </tbody>
                  <tfoot>
                    <tr>
                      <td colSpan="4" className="total-label">
                        <strong>Total Venta:</strong>
                      </td>
                      <td className="total-amount">
                        <strong>
                          {ventaDetalle.moneda === 'USD' ? 'US$' : '$'}
                          {parseFloat(ventaDetalle.total_venta || 0).toFixed(2)}
                        </strong>
                      </td>
                    </tr>
                    <tr>
                      <td colSpan="4" className="total-label">
                        <strong>Pendiente:</strong>
                      </td>
                      <td className="total-amount">
                        <strong>
                          {ventaDetalle.moneda === 'USD' ? 'US$' : '$'}
                          {parseFloat(ventaDetalle.pendiente || 0).toFixed(2)}
                        </strong>
                      </td>
                    </tr>
                  </tfoot>
                  </table>
                </div>
              </div>
            </div>

            <div className="modal-actions">
              <button type="button" className="btn-primary" onClick={() => setShowDetalleModal(false)}>
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Ingresos
