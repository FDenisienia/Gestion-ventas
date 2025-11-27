import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import './Egresos.css'

function Egresos() {
  const { token } = useAuth()
  const [egresos, setEgresos] = useState([])
  const [ventas, setVentas] = useState([]) // Para obtener cuentas bancarias
  const [showModal, setShowModal] = useState(false)
  const [editingEgreso, setEditingEgreso] = useState(null)
  const [formData, setFormData] = useState({
    descripcion: '',
    monto: '',
    moneda: 'ARS',
    metodo_pago: 'efectivo',
    cuenta_transferencia: '',
    categoria: '',
    fecha: new Date().toISOString().split('T')[0]
  })

  useEffect(() => {
    if (token) {
      fetchEgresos()
      fetchVentas()
    }
  }, [token])

  const fetchEgresos = async () => {
    try {
      const response = await fetch('/api/egresos', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`)
      }
      const data = await response.json()
      setEgresos(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error('Error al cargar egresos:', error)
      setEgresos([])
    }
  }

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
      setVentas(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error('Error al cargar ventas:', error)
      setVentas([])
    }
  }

  // Obtener cuentas bancarias únicas de las ventas
  const obtenerCuentasBancarias = () => {
    const cuentas = new Set()
    if (Array.isArray(ventas)) {
      ventas.forEach(venta => {
        if (venta.metodo_pago === 'transferencia' && venta.cuenta_transferencia) {
          cuentas.add(venta.cuenta_transferencia)
        }
      })
    }
    return Array.from(cuentas).sort()
  }

  const handleOpenModal = (egreso = null) => {
    if (egreso) {
      setEditingEgreso(egreso)
      setFormData({
        descripcion: egreso.descripcion || '',
        monto: egreso.monto || '',
        moneda: egreso.moneda || 'ARS',
        metodo_pago: egreso.metodo_pago || 'efectivo',
        cuenta_transferencia: egreso.cuenta_transferencia || '',
        categoria: egreso.categoria || '',
        fecha: egreso.fecha ? new Date(egreso.fecha).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]
      })
    } else {
      setEditingEgreso(null)
      setFormData({
        descripcion: '',
        monto: '',
        moneda: 'ARS',
        metodo_pago: 'efectivo',
        cuenta_transferencia: '',
        categoria: '',
        fecha: new Date().toISOString().split('T')[0]
      })
    }
    setShowModal(true)
  }

  const handleCloseModal = () => {
    setShowModal(false)
    setEditingEgreso(null)
    setFormData({
      descripcion: '',
      monto: '',
      moneda: 'ARS',
      metodo_pago: 'efectivo',
      cuenta_transferencia: '',
      categoria: '',
      fecha: new Date().toISOString().split('T')[0]
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!formData.descripcion.trim()) {
      alert('La descripción es requerida')
      return
    }

    if (!formData.monto || parseFloat(formData.monto) <= 0) {
      alert('El monto debe ser mayor a 0')
      return
    }

    if (formData.metodo_pago === 'transferencia' && !formData.cuenta_transferencia.trim()) {
      alert('Debe seleccionar o ingresar la cuenta de transferencia')
      return
    }

    try {
      const url = editingEgreso ? `/api/egresos/${editingEgreso.id}` : '/api/egresos'
      const method = editingEgreso ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          descripcion: formData.descripcion,
          monto: parseFloat(formData.monto),
          moneda: formData.moneda,
          metodo_pago: formData.metodo_pago,
          cuenta_transferencia: formData.metodo_pago === 'transferencia' ? formData.cuenta_transferencia : '',
          categoria: formData.categoria,
          fecha: formData.fecha
        })
      })

      if (response.ok) {
        alert(editingEgreso ? 'Egreso actualizado correctamente' : 'Egreso creado correctamente')
        handleCloseModal()
        fetchEgresos()
      } else {
        const error = await response.json()
        alert(`Error: ${error.error}`)
      }
    } catch (error) {
      console.error('Error al guardar egreso:', error)
      alert('Error al guardar el egreso')
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('¿Estás seguro de eliminar este egreso?')) return

    try {
      const response = await fetch(`/api/egresos/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        alert('Egreso eliminado correctamente')
        fetchEgresos()
      } else {
        const error = await response.json()
        alert(`Error: ${error.error}`)
      }
    } catch (error) {
      console.error('Error al eliminar egreso:', error)
      alert('Error al eliminar el egreso')
    }
  }

  const cuentasBancarias = obtenerCuentasBancarias()
  const simboloMoneda = formData.moneda === 'USD' ? 'US$' : '$'

  return (
    <div className="egresos-container">
      <div className="egresos-header">
        <div>
          <h1 className="egresos-title">Gestión de Egresos</h1>
          <p className="egresos-subtitle">Registra y administra tus gastos</p>
        </div>
        <button 
          className="btn-nuevo-egreso"
          onClick={() => handleOpenModal()}
        >
          + Nuevo Egreso
        </button>
      </div>

      <div className="egresos-table-container">
        <table className="egresos-table">
          <thead>
            <tr>
              <th>Descripción</th>
              <th>Categoría</th>
              <th>Monto</th>
              <th>Método de Pago</th>
              <th>Cuenta</th>
              <th>Fecha</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {egresos.length === 0 ? (
              <tr>
                <td colSpan="7" className="empty-state">
                  No hay egresos registrados
                </td>
              </tr>
            ) : (
              egresos.map(egreso => {
                const simbolo = egreso.moneda === 'USD' ? 'US$' : '$'
                return (
                  <tr key={egreso.id}>
                    <td>{egreso.descripcion}</td>
                    <td>
                      {egreso.categoria ? (
                        <span className="badge badge-categoria">{egreso.categoria}</span>
                      ) : '-'}
                    </td>
                    <td className="monto-egreso">{simbolo}{parseFloat(egreso.monto || 0).toFixed(2)}</td>
                    <td>
                      <span className={`badge badge-metodo badge-${egreso.metodo_pago === 'efectivo' ? 'efectivo' : 'transferencia'}`}>
                        {egreso.metodo_pago === 'efectivo' ? 'Efectivo' : egreso.metodo_pago === 'transferencia' ? 'Transferencia' : egreso.metodo_pago || '-'}
                      </span>
                    </td>
                    <td>{egreso.cuenta_transferencia || '-'}</td>
                    <td>{new Date(egreso.fecha).toLocaleDateString('es-AR')}</td>
                    <td>
                      <button 
                        className="btn-edit" 
                        onClick={() => handleOpenModal(egreso)}
                      >
                        Editar
                      </button>
                      <button 
                        className="btn-delete" 
                        onClick={() => handleDelete(egreso.id)}
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
        <div className="modal-overlay" onClick={handleCloseModal}>
          <div className="modal-content egreso-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editingEgreso ? 'Editar Egreso' : 'Nuevo Egreso'}</h3>
              <button className="btn-close" onClick={handleCloseModal}>×</button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="form-section">
                  <div className="form-group">
                    <label>Descripción *</label>
                    <input
                      type="text"
                      value={formData.descripcion}
                      onChange={(e) => setFormData({...formData, descripcion: e.target.value})}
                      required
                      placeholder="Ej: Pago de servicios, Compra de materiales, etc."
                    />
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label>Monto *</label>
                      <input
                        type="number"
                        step="0.01"
                        value={formData.monto}
                        onChange={(e) => setFormData({...formData, monto: e.target.value})}
                        required
                        placeholder="0.00"
                        min="0.01"
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
                  </div>

                  <div className="form-group">
                    <label>Categoría</label>
                    <input
                      type="text"
                      value={formData.categoria}
                      onChange={(e) => setFormData({...formData, categoria: e.target.value})}
                      placeholder="Ej: Servicios, Materiales, Alquiler, etc."
                    />
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label>Método de Pago *</label>
                      <select
                        value={formData.metodo_pago}
                        onChange={(e) => {
                          setFormData({
                            ...formData, 
                            metodo_pago: e.target.value,
                            cuenta_transferencia: e.target.value === 'efectivo' ? '' : formData.cuenta_transferencia
                          })
                        }}
                        required
                      >
                        <option value="efectivo">Efectivo</option>
                        <option value="transferencia">Transferencia</option>
                      </select>
                    </div>

                    <div className="form-group">
                      <label>Fecha *</label>
                      <input
                        type="date"
                        value={formData.fecha}
                        onChange={(e) => setFormData({...formData, fecha: e.target.value})}
                        required
                      />
                    </div>
                  </div>

                  {formData.metodo_pago === 'transferencia' && (
                    <div className="form-group">
                      <label>Cuenta de Transferencia *</label>
                      {cuentasBancarias.length > 0 ? (
                        <>
                          <select
                            value={formData.cuenta_transferencia}
                            onChange={(e) => setFormData({...formData, cuenta_transferencia: e.target.value})}
                            required
                          >
                            <option value="">Selecciona una cuenta</option>
                            {cuentasBancarias.map(cuenta => (
                              <option key={cuenta} value={cuenta}>{cuenta}</option>
                            ))}
                          </select>
                          <small className="helper-text">
                            O puedes ingresar una nueva cuenta manualmente
                          </small>
                        </>
                      ) : null}
                      <input
                        type="text"
                        value={formData.cuenta_transferencia}
                        onChange={(e) => setFormData({...formData, cuenta_transferencia: e.target.value})}
                        placeholder="Ej: Banco Nación - CBU 1234567890123456789012"
                        required={formData.metodo_pago === 'transferencia'}
                      />
                      <small className="helper-text">
                        {cuentasBancarias.length > 0 
                          ? 'Selecciona una cuenta existente o ingresa una nueva'
                          : 'Ingresa la cuenta bancaria desde donde se descontará el monto'}
                      </small>
                    </div>
                  )}
                </div>

                <div className="form-section">
                  <div className="resumen-egreso">
                    <div className="resumen-item">
                      <span className="resumen-label">Monto Total:</span>
                      <span className="resumen-valor">{simboloMoneda}{parseFloat(formData.monto || 0).toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn-secondary" onClick={handleCloseModal}>
                  Cancelar
                </button>
                <button type="submit" className="btn-primary">
                  {editingEgreso ? 'Actualizar' : 'Guardar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default Egresos
