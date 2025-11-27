import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import './BaseDatos.css'
import './Ingresos.css'

function BaseDatos() {
  const { token } = useAuth()
  const [activeTab, setActiveTab] = useState('clientes')
  const [clientes, setClientes] = useState([])
  const [articulos, setArticulos] = useState([])
  const [categorias, setCategorias] = useState([])
  const [categoriasVenta, setCategoriasVenta] = useState([])
  const [showModal, setShowModal] = useState(false)
  const [showCategoriaModal, setShowCategoriaModal] = useState(false)
  const [showCategoriaVentaModal, setShowCategoriaVentaModal] = useState(false)
  const [showHistorialModal, setShowHistorialModal] = useState(false)
  const [clienteHistorial, setClienteHistorial] = useState(null)
  const [ventasCliente, setVentasCliente] = useState([])
  const [ventasExpandidas, setVentasExpandidas] = useState({})
  const [modalType, setModalType] = useState(null) // 'cliente' o 'articulo'
  const [editingItem, setEditingItem] = useState(null)
  const [categoriaNombre, setCategoriaNombre] = useState('')
  const [categoriaVentaNombre, setCategoriaVentaNombre] = useState('')
  const [editingCategoriaVenta, setEditingCategoriaVenta] = useState(null)
  const [formData, setFormData] = useState({
    nombre: '',
    dni: '',
    telefono: '',
    marca: '',
    costo: '',
    venta: '',
    stock: '',
    categoria_id: '',
    moneda: 'ARS'
  })
  const [filtroCategoria, setFiltroCategoria] = useState('todas')

  useEffect(() => {
    if (token) {
      fetchClientes()
      fetchArticulos()
      fetchCategorias()
      fetchCategoriasVenta()
    }
  }, [token])

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
      setClientes([])
    }
  }


  const fetchCategoriasVenta = async () => {
    try {
      const response = await fetch('/api/categorias-venta', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`)
      }
      const data = await response.json()
      setCategoriasVenta(data || [])
    } catch (error) {
      console.error('Error al cargar categorías de venta:', error)
      setCategoriasVenta([])
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
      setArticulos([])
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
      setCategorias([])
    }
  }

  const handleOpenModal = (type, item = null) => {
    setModalType(type)
    setEditingItem(item)
    if (item) {
      if (type === 'cliente') {
        setFormData({
          nombre: item.nombre || '',
          dni: item.dni || '',
          telefono: item.telefono || ''
        })
      } else if (type === 'articulo') {
        setFormData({
          marca: item.marca || '',
          nombre: item.nombre || '',
          costo: item.costo || '',
          venta: item.venta || '',
          stock: item.stock || '',
          categoria_id: item.categoria_id || '',
          moneda: item.moneda || 'ARS'
        })
      }
    } else {
      setFormData({
        nombre: '',
        dni: '',
        telefono: '',
        marca: '',
        costo: '',
        venta: '',
        stock: '',
        categoria_id: '',
        moneda: 'ARS'
      })
    }
    setShowModal(true)
  }

  const handleCloseModal = () => {
    setShowModal(false)
    setEditingItem(null)
    setFormData({
      nombre: '',
      dni: '',
      telefono: '',
      marca: '',
      costo: '',
      venta: '',
      stock: '',
      categoria_id: '',
      moneda: 'ARS'
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      let url
      if (modalType === 'cliente') {
        url = '/api/clientes'
      } else if (modalType === 'articulo') {
        url = '/api/articulos'
      }
      
      const method = editingItem ? 'PUT' : 'POST'
      const endpoint = editingItem ? `${url}/${editingItem.id}` : url

      const response = await fetch(endpoint, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      })

      if (response.ok) {
        if (modalType === 'cliente') {
          fetchClientes()
        } else if (modalType === 'articulo') {
          fetchArticulos()
        }
        handleCloseModal()
      } else {
        const errorData = await response.json().catch(() => ({ error: 'Error desconocido' }))
        alert(`Error: ${errorData.error || 'Error al procesar la solicitud'}`)
      }
    } catch (error) {
      console.error('Error al guardar:', error)
      if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
        alert('Error de conexión: Verifica que el servidor backend esté corriendo en http://localhost:3001')
      } else {
        alert(`Error al guardar los datos: ${error.message}`)
      }
    }
  }

  const handleDelete = async (type, id) => {
    if (!confirm(`¿Estás seguro de eliminar este ${type}?`)) return

    try {
      let url
      if (type === 'cliente') {
        url = `/api/clientes/${id}`
      } else if (type === 'articulo') {
        url = `/api/articulos/${id}`
      }

      const response = await fetch(url, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      
      if (response.ok) {
        if (type === 'cliente') {
          fetchClientes()
        } else if (type === 'articulo') {
          fetchArticulos()
        }
      } else {
        const errorData = await response.json().catch(() => ({ error: 'Error desconocido' }))
        alert(`Error: ${errorData.error || 'Error al eliminar'}`)
      }
    } catch (error) {
      console.error('Error al eliminar:', error)
      alert('Error al eliminar')
    }
  }

  const handleCreateCategoria = async () => {
    if (!categoriaNombre.trim()) {
      alert('Por favor ingrese un nombre para la categoría')
      return
    }

    try {
      const response = await fetch('/api/categorias', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ nombre: categoriaNombre })
      })

      if (response.ok) {
        setCategoriaNombre('')
        fetchCategorias()
      } else {
        const errorData = await response.json().catch(() => ({ error: 'Error desconocido' }))
        alert(`Error: ${errorData.error || 'Error al crear categoría'}`)
      }
    } catch (error) {
      console.error('Error al crear categoría:', error)
      alert('Error al crear categoría')
    }
  }

  const handleDeleteCategoria = async (id) => {
    if (!confirm('¿Estás seguro de eliminar esta categoría?')) return

    try {
      const response = await fetch(`/api/categorias/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      
      if (response.ok) {
        fetchCategorias()
        fetchArticulos() // Actualizar artículos por si alguno tenía esta categoría
      } else {
        const errorData = await response.json().catch(() => ({ error: 'Error desconocido' }))
        alert(`Error: ${errorData.error || 'Error al eliminar categoría'}`)
      }
    } catch (error) {
      console.error('Error al eliminar categoría:', error)
      alert('Error al eliminar categoría')
    }
  }

  const handleCreateCategoriaVenta = async () => {
    if (!categoriaVentaNombre.trim()) {
      alert('Por favor ingrese un nombre para la categoría')
      return
    }

    try {
      const response = await fetch('/api/categorias-venta', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nombre: categoriaVentaNombre })
      })

      if (response.ok) {
        setCategoriaVentaNombre('')
        fetchCategoriasVenta()
      } else {
        const errorData = await response.json().catch(() => ({ error: 'Error desconocido' }))
        alert(`Error: ${errorData.error || 'Error al crear categoría'}`)
      }
    } catch (error) {
      console.error('Error al crear categoría de venta:', error)
      alert('Error al crear categoría')
    }
  }

  const handleEditCategoriaVenta = (categoria) => {
    setEditingCategoriaVenta(categoria)
    setCategoriaVentaNombre(categoria.nombre)
  }

  const handleUpdateCategoriaVenta = async () => {
    if (!categoriaVentaNombre.trim()) {
      alert('Por favor ingrese un nombre para la categoría')
      return
    }

    try {
      const response = await fetch(`/api/categorias-venta/${editingCategoriaVenta.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ nombre: categoriaVentaNombre })
      })

      if (response.ok) {
        setCategoriaVentaNombre('')
        setEditingCategoriaVenta(null)
        fetchCategoriasVenta()
      } else {
        const errorData = await response.json().catch(() => ({ error: 'Error desconocido' }))
        alert(`Error: ${errorData.error || 'Error al actualizar categoría'}`)
      }
    } catch (error) {
      console.error('Error al actualizar categoría de venta:', error)
      alert('Error al actualizar categoría')
    }
  }

  const handleDeleteCategoriaVenta = async (id) => {
    if (!confirm('¿Estás seguro de eliminar esta categoría?')) return

    try {
      const response = await fetch(`/api/categorias-venta/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      
      if (response.ok) {
        fetchCategoriasVenta()
      } else {
        const errorData = await response.json().catch(() => ({ error: 'Error desconocido' }))
        alert(`Error: ${errorData.error || 'Error al eliminar categoría'}`)
      }
    } catch (error) {
      console.error('Error al eliminar categoría de venta:', error)
      alert('Error al eliminar categoría')
    }
  }

  const handleVerHistorial = async (cliente) => {
    setClienteHistorial(cliente)
    setVentasExpandidas({})
    try {
      const response = await fetch(`/api/ventas/cliente/${cliente.id}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`)
      }
      const data = await response.json()
      // Procesar las ventas para incluir items_detalle similar a Ingresos
      const ventasProcesadas = Array.isArray(data) ? data.map(venta => {
        const itemsDetalle = (venta.items || []).map(item => ({
          nombre: item.producto || item.nombre || 'Producto',
          cantidad: item.cantidad || 1,
          precio: item.precio_venta || item.precio || 0,
          costo_unit: item.costo_unit || 0,
          categoria: item.categoria || ''
        }))
        
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
          items_detalle: itemsDetalle,
          estado_pago: estadoPago,
          pendiente: pendiente,
          total_venta: totalVenta
        }
      }) : []
      setVentasCliente(ventasProcesadas)
      setShowHistorialModal(true)
    } catch (error) {
      console.error('Error al cargar historial:', error)
      alert('Error al cargar el historial de ventas')
    }
  }

  const toggleVenta = (ventaId) => {
    setVentasExpandidas(prev => ({
      ...prev,
      [ventaId]: !prev[ventaId]
    }))
  }

  return (
    <div className="base-datos-container">
      <div className="tabs">
        <button
          className={activeTab === 'clientes' ? 'active' : ''}
          onClick={() => setActiveTab('clientes')}
        >
          Clientes
        </button>
        <button
          className={activeTab === 'stock' ? 'active' : ''}
          onClick={() => setActiveTab('stock')}
        >
          Stock
        </button>
      </div>

      <div className="content-section">
        {activeTab === 'clientes' && (
          <div className="clientes-section">
            <div className="section-header">
              <div>
                <h1 className="section-title">Gestión de Clientes</h1>
                <p className="section-subtitle">Administra tu base de datos de clientes</p>
              </div>
              <button 
                className="btn-nueva-venta"
                onClick={() => handleOpenModal('cliente')}
              >
                + Nuevo Cliente
              </button>
            </div>

            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Nombre Completo</th>
                    <th>DNI</th>
                    <th>Teléfono</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {clientes.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="empty-state">
                        No hay clientes registrados
                      </td>
                    </tr>
                  ) : (
                    Array.isArray(clientes) && clientes.map(cliente => (
                      <tr key={cliente.id}>
                        <td>{cliente.id}</td>
                        <td>{cliente.nombre}</td>
                        <td>{cliente.dni || '-'}</td>
                        <td>{cliente.telefono || '-'}</td>
                        <td>
                          <button
                            className="btn-historial"
                            onClick={() => handleVerHistorial(cliente)}
                            title="Ver historial de ventas"
                          >
                            📋 Historial
                          </button>
                          <button
                            className="btn-edit"
                            onClick={() => handleOpenModal('cliente', cliente)}
                          >
                            Editar
                          </button>
                          <button
                            className="btn-delete"
                            onClick={() => handleDelete('cliente', cliente.id)}
                          >
                            Eliminar
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'stock' && (
          <div className="stock-section">
            <div className="section-header">
              <div>
                <h1 className="section-title">Gestión de Stock</h1>
                <p className="section-subtitle">Administra tu inventario de productos</p>
              </div>
              <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                <button 
                  className="btn-secondary"
                  onClick={() => setShowCategoriaModal(true)}
                >
                  Gestionar Categorías
                </button>
                <button 
                  className="btn-nueva-venta"
                  onClick={() => handleOpenModal('articulo')}
                >
                  + Nuevo Artículo
                </button>
              </div>
            </div>

            <div className="filtro-categoria-container">
              <label htmlFor="filtro-categoria" className="filtro-label">
                Filtrar por categoría:
              </label>
              <select
                id="filtro-categoria"
                value={filtroCategoria}
                onChange={(e) => setFiltroCategoria(e.target.value)}
                className="filtro-categoria-select"
              >
                <option value="todas">Todas las categorías</option>
                <option value="sin-categoria">Sin categoría</option>
                {Array.isArray(categorias) && categorias.map(cat => (
                  <option key={cat.id} value={cat.id}>
                    {cat.nombre}
                  </option>
                ))}
              </select>
            </div>

            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Marca</th>
                    <th>Nombre</th>
                    <th>Costo</th>
                    <th>Venta</th>
                    <th>Moneda</th>
                    <th>Stock</th>
                    <th>Categoría</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {(() => {
                    // Filtrar artículos según la categoría seleccionada
                    const articulosFiltrados = !Array.isArray(articulos) ? [] : filtroCategoria === 'todas'
                      ? articulos
                      : filtroCategoria === 'sin-categoria'
                        ? articulos.filter(a => !a.categoria_id)
                        : articulos.filter(a => a.categoria_id === parseInt(filtroCategoria))

                    if (articulosFiltrados.length === 0) {
                      return (
                        <tr>
                          <td colSpan="9" className="empty-state">
                            {filtroCategoria === 'todas' 
                              ? 'No hay artículos registrados'
                              : 'No hay artículos en esta categoría'}
                          </td>
                        </tr>
                      )
                    }

                    return articulosFiltrados.map(articulo => {
                      const simbolo = articulo.moneda === 'USD' ? 'US$' : '$'
                      return (
                        <tr key={articulo.id}>
                          <td>{articulo.id}</td>
                          <td>{articulo.marca || '-'}</td>
                          <td>{articulo.nombre}</td>
                          <td>{simbolo}{parseFloat(articulo.costo).toFixed(2)}</td>
                          <td>{simbolo}{parseFloat(articulo.venta).toFixed(2)}</td>
                          <td>
                            <span className={`badge badge-moneda badge-${articulo.moneda === 'USD' ? 'usd' : 'ars'}`}>
                              {articulo.moneda || 'ARS'}
                            </span>
                          </td>
                          <td>
                            <span className={articulo.stock <= 5 ? 'stock-bajo' : ''}>
                              {articulo.stock}
                            </span>
                          </td>
                          <td>{articulo.categoria_nombre || '-'}</td>
                          <td>
                            <button
                              className="btn-edit"
                              onClick={() => handleOpenModal('articulo', articulo)}
                            >
                              Editar
                            </button>
                            <button
                              className="btn-delete"
                              onClick={() => handleDelete('articulo', articulo.id)}
                            >
                              Eliminar
                            </button>
                          </td>
                        </tr>
                      )
                    })
                  })()}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={handleCloseModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>
                {editingItem 
                  ? `Editar ${modalType === 'cliente' ? 'Cliente' : 'Artículo'}`
                  : `Nuevo ${modalType === 'cliente' ? 'Cliente' : 'Artículo'}`
                }
              </h3>
              <button className="btn-close" onClick={handleCloseModal}>×</button>
            </div>

            <form onSubmit={handleSubmit}>
              {modalType === 'cliente' ? (
                <>
                  <div className="form-group">
                    <label>Nombre Completo *</label>
                    <input
                      type="text"
                      name="nombre"
                      value={formData.nombre}
                      onChange={(e) => setFormData({...formData, nombre: e.target.value})}
                      autoComplete="name"
                      required
                      placeholder="Ingrese el nombre completo"
                    />
                  </div>
                  <div className="form-group">
                    <label>DNI *</label>
                    <input
                      type="text"
                      name="dni"
                      value={formData.dni}
                      onChange={(e) => setFormData({...formData, dni: e.target.value})}
                      autoComplete="off"
                      required
                      placeholder="Ingrese el DNI"
                    />
                  </div>
                  <div className="form-group">
                    <label>Número de Teléfono *</label>
                    <input
                      type="tel"
                      name="telefono"
                      value={formData.telefono}
                      onChange={(e) => setFormData({...formData, telefono: e.target.value})}
                      autoComplete="tel"
                      required
                      placeholder="Ingrese el número de teléfono"
                    />
                  </div>
                </>
              ) : modalType === 'articulo' ? (
                <>
                  <div className="form-group">
                    <label>Marca del Producto</label>
                    <input
                      type="text"
                      name="marca"
                      value={formData.marca}
                      onChange={(e) => setFormData({...formData, marca: e.target.value})}
                      autoComplete="organization"
                      placeholder="Ingrese la marca"
                    />
                  </div>
                  <div className="form-group">
                    <label>Nombre *</label>
                    <input
                      type="text"
                      name="nombre-articulo"
                      value={formData.nombre}
                      onChange={(e) => setFormData({...formData, nombre: e.target.value})}
                      autoComplete="off"
                      required
                      placeholder="Ingrese el nombre del artículo"
                    />
                  </div>
                  <div className="form-group">
                    <label>Valor al Costo *</label>
                    <input
                      type="number"
                      name="costo"
                      step="0.01"
                      value={formData.costo}
                      onChange={(e) => setFormData({...formData, costo: e.target.value})}
                      autoComplete="off"
                      required
                      placeholder="0.00"
                    />
                  </div>
                  <div className="form-group">
                    <label>Valor de Venta *</label>
                    <input
                      type="number"
                      name="venta"
                      step="0.01"
                      value={formData.venta}
                      onChange={(e) => setFormData({...formData, venta: e.target.value})}
                      autoComplete="off"
                      required
                      placeholder="0.00"
                    />
                  </div>
                  <div className="form-group">
                    <label>Stock *</label>
                    <input
                      type="number"
                      name="stock"
                      value={formData.stock}
                      onChange={(e) => setFormData({...formData, stock: e.target.value})}
                      autoComplete="off"
                      required
                      placeholder="0"
                    />
                  </div>
                  <div className="form-group">
                    <label>Moneda *</label>
                    <select
                      value={formData.moneda}
                      onChange={(e) => setFormData({...formData, moneda: e.target.value})}
                      required
                    >
                      <option value="ARS">Pesos Argentinos (ARS)</option>
                      <option value="USD">Dólares (USD)</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Categoría</label>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <select
                        value={formData.categoria_id}
                        onChange={(e) => setFormData({...formData, categoria_id: e.target.value})}
                        style={{ flex: 1 }}
                      >
                        <option value="">Seleccionar categoría</option>
                        {categorias.map(categoria => (
                          <option key={categoria.id} value={categoria.id}>
                            {categoria.nombre}
                          </option>
                        ))}
                      </select>
                      <button
                        type="button"
                        className="btn-secondary"
                        onClick={(e) => {
                          e.preventDefault()
                          setShowCategoriaModal(true)
                        }}
                        style={{ whiteSpace: 'nowrap' }}
                      >
                        + Nueva
                      </button>
                    </div>
                  </div>
                </>
              ) : null}

              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={handleCloseModal}>
                  Cancelar
                </button>
                <button type="submit" className="btn-primary">
                  {editingItem ? 'Actualizar' : 'Crear'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showCategoriaModal && (
        <div className="modal-overlay" onClick={() => setShowCategoriaModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Gestionar Categorías</h3>
              <button className="btn-close" onClick={() => setShowCategoriaModal(false)}>×</button>
            </div>

            <div style={{ padding: '1.5rem' }}>
              <div style={{ marginBottom: '1.5rem' }}>
                <h4 style={{ marginBottom: '1rem' }}>Crear Nueva Categoría</h4>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <input
                    type="text"
                    value={categoriaNombre}
                    onChange={(e) => setCategoriaNombre(e.target.value)}
                    placeholder="Nombre de la categoría"
                    style={{ flex: 1, padding: '0.75rem', border: '1px solid #d1d5db', borderRadius: '6px' }}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault()
                        handleCreateCategoria()
                      }
                    }}
                  />
                  <button
                    type="button"
                    className="btn-primary"
                    onClick={handleCreateCategoria}
                  >
                    Crear
                  </button>
                </div>
              </div>

              <div>
                <h4 style={{ marginBottom: '1rem' }}>Categorías Existentes</h4>
                <div className="table-container">
                  <table>
                    <thead>
                      <tr>
                        <th>ID</th>
                        <th>Nombre</th>
                        <th>Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {categorias.length === 0 ? (
                        <tr>
                          <td colSpan="3" className="empty-state">
                            No hay categorías registradas
                          </td>
                        </tr>
                      ) : (
                        Array.isArray(categorias) && categorias.map(categoria => (
                          <tr key={categoria.id}>
                            <td>{categoria.id}</td>
                            <td>{categoria.nombre}</td>
                            <td>
                              <button
                                className="btn-delete"
                                onClick={() => handleDeleteCategoria(categoria.id)}
                              >
                                Eliminar
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {showHistorialModal && clienteHistorial && (
        <div className="modal-overlay" onClick={() => setShowHistorialModal(false)}>
          <div className="modal-content detalle-venta-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Historial de Ventas - {clienteHistorial.nombre}</h3>
              <button className="btn-close" onClick={() => setShowHistorialModal(false)}>×</button>
            </div>

            <div className="modal-body">
              <div className="detalle-venta-info">
                <div className="info-row">
                  <strong>Cliente:</strong> {clienteHistorial.nombre}
                </div>
                <div className="info-row">
                  <strong>DNI:</strong> {clienteHistorial.dni || '-'}
                </div>
                <div className="info-row">
                  <strong>Teléfono:</strong> {clienteHistorial.telefono || '-'}
                </div>
                <div className="info-row">
                  <strong>Total de Ventas:</strong> {ventasCliente.length}
                </div>
                <div className="info-row">
                  <strong>Total Facturado:</strong>
                  <span>
                    {ventasCliente.length > 0 && ventasCliente[0].moneda === 'USD' ? 'US$' : '$'}
                    {ventasCliente.reduce((sum, v) => sum + parseFloat(v.total_venta || v.monto || 0), 0).toFixed(2)}
                  </span>
                </div>
              </div>

              {ventasCliente.length === 0 ? (
                <div className="empty-state" style={{ textAlign: 'center', padding: '3rem' }}>
                  Este cliente no tiene ventas registradas
                </div>
              ) : (
                <div className="ventas-accordion-container">
                  {Array.isArray(ventasCliente) && ventasCliente.map(venta => {
                    const isExpanded = ventasExpandidas[venta.id]
                    const simbolo = venta.moneda === 'USD' ? 'US$' : '$'
                    
                    return (
                      <div key={venta.id} className="venta-accordion-item">
                        <div 
                          className="venta-accordion-header"
                          onClick={() => toggleVenta(venta.id)}
                        >
                          <div className="venta-accordion-title">
                            <span className="accordion-icon">{isExpanded ? '▼' : '▶'}</span>
                            <span>Venta #{venta.id} - {new Date(venta.fecha_emision || venta.fecha_venta || venta.fecha).toLocaleDateString('es-AR')}</span>
                          </div>
                          <div className="venta-accordion-summary">
                            <span className={`badge badge-estado badge-${venta.estado_pago || 'pendiente'}`}>
                              {venta.estado_pago === 'pagado' || venta.pendiente === 0 ? 'Pagado' : 
                               venta.estado_pago === 'parcial' || (venta.pendiente > 0 && venta.pendiente < venta.total_venta) ? 'Pago Parcial' : 
                               'Pendiente'}
                            </span>
                            <span className="venta-total">{simbolo}{parseFloat(venta.total_venta || venta.monto || 0).toFixed(2)}</span>
                          </div>
                        </div>
                        
                        {isExpanded && (
                          <div className="venta-accordion-content">
                            <div className="detalle-venta-info">
                              <div className="info-row">
                                <strong>Fecha:</strong> {new Date(venta.fecha_emision || venta.fecha_venta || venta.fecha).toLocaleDateString('es-AR')}
                              </div>
                              <div className="info-row">
                                <strong>Método de Pago:</strong>
                                <span className={`badge badge-metodo badge-${venta.metodo_pago === 'efectivo' ? 'efectivo' : 'transferencia'}`}>
                                  {venta.metodo_pago === 'efectivo' ? 'Efectivo' : venta.metodo_pago === 'transferencia' ? 'Transferencia' : venta.metodo_pago || '-'}
                                </span>
                              </div>
                              <div className="info-row">
                                <strong>Estado de Pago:</strong>
                                <span className={`badge badge-estado badge-${venta.estado_pago || 'pendiente'}`}>
                                  {venta.estado_pago === 'pagado' || venta.pendiente === 0 ? 'Pagado' : 
                                   venta.estado_pago === 'parcial' || (venta.pendiente > 0 && venta.pendiente < venta.total_venta) ? 'Pago Parcial' : 
                                   'Pendiente'}
                                </span>
                              </div>
                              <div className="info-row">
                                <strong>Pendiente:</strong>
                                <span>
                                  {simbolo}{parseFloat(venta.pendiente || 0).toFixed(2)}
                                </span>
                              </div>
                            </div>

                            <div className="detalle-items-section">
                              <h4>Artículos de la Venta</h4>
                              <div className="table-responsive">
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
                                    {venta.items_detalle && venta.items_detalle.length > 0 ? (
                                      venta.items_detalle.map((item, index) => (
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
                                      ))
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
                                          {simbolo}{parseFloat(venta.total_venta || venta.monto || 0).toFixed(2)}
                                        </strong>
                                      </td>
                                    </tr>
                                    <tr>
                                      <td colSpan="4" className="total-label">
                                        <strong>Ganancia Total:</strong>
                                      </td>
                                      <td className="total-amount">
                                        <strong>
                                          {simbolo}{parseFloat(venta.items_detalle.reduce((sum, item) => sum + ((item.precio || 0) - (item.costo_unit || 0)) * (item.cantidad || 1), 0)).toFixed(2)}
                                        </strong>
                                      </td>
                                    </tr>
                                  </tfoot>
                                </table>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {showCategoriaVentaModal && (
        <div className="modal-overlay" onClick={() => {
          setShowCategoriaVentaModal(false)
          setEditingCategoriaVenta(null)
          setCategoriaVentaNombre('')
        }}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Gestionar Categorías de Venta</h3>
              <button className="btn-close" onClick={() => {
                setShowCategoriaVentaModal(false)
                setEditingCategoriaVenta(null)
                setCategoriaVentaNombre('')
              }}>×</button>
            </div>

            <div style={{ padding: '1.5rem' }}>
              <div style={{ marginBottom: '1.5rem' }}>
                <h4 style={{ marginBottom: '1rem' }}>
                  {editingCategoriaVenta ? 'Editar Categoría' : 'Crear Nueva Categoría'}
                </h4>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <input
                    type="text"
                    value={categoriaVentaNombre}
                    onChange={(e) => setCategoriaVentaNombre(e.target.value)}
                    placeholder="Nombre de la categoría"
                    style={{ flex: 1, padding: '0.75rem', border: '1px solid #d1d5db', borderRadius: '6px' }}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault()
                        if (editingCategoriaVenta) {
                          handleUpdateCategoriaVenta()
                        } else {
                          handleCreateCategoriaVenta()
                        }
                      }
                    }}
                  />
                  <button
                    type="button"
                    className="btn-primary"
                    onClick={editingCategoriaVenta ? handleUpdateCategoriaVenta : handleCreateCategoriaVenta}
                  >
                    {editingCategoriaVenta ? 'Actualizar' : 'Crear'}
                  </button>
                  {editingCategoriaVenta && (
                    <button
                      type="button"
                      className="btn-secondary"
                      onClick={() => {
                        setEditingCategoriaVenta(null)
                        setCategoriaVentaNombre('')
                      }}
                    >
                      Cancelar
                    </button>
                  )}
                </div>
              </div>

              <div>
                <h4 style={{ marginBottom: '1rem' }}>Categorías Existentes</h4>
                <div className="table-container">
                  <table>
                    <thead>
                      <tr>
                        <th>ID</th>
                        <th>Nombre</th>
                        <th>Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {categoriasVenta.length === 0 ? (
                        <tr>
                          <td colSpan="3" className="empty-state">
                            No hay categorías registradas
                          </td>
                        </tr>
                      ) : (
                        Array.isArray(categoriasVenta) && categoriasVenta.map(categoria => (
                          <tr key={categoria.id}>
                            <td>{categoria.id}</td>
                            <td>{categoria.nombre}</td>
                            <td>
                              <button
                                className="btn-edit"
                                onClick={() => handleEditCategoriaVenta(categoria)}
                                style={{ marginRight: '0.5rem' }}
                              >
                                Editar
                              </button>
                              <button
                                className="btn-delete"
                                onClick={() => handleDeleteCategoriaVenta(categoria.id)}
                              >
                                Eliminar
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default BaseDatos
