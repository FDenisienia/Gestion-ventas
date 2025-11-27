import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import './Usuarios.css'

function Usuarios() {
  const { token, isAdmin, loading: authLoading } = useAuth()
  const navigate = useNavigate()
  const [usuarios, setUsuarios] = useState([])
  const [showModal, setShowModal] = useState(false)
  const [editingUser, setEditingUser] = useState(null)
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    nombre: '',
    email: '',
    role: 'user'
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Verificar si es admin
    if (!authLoading) {
      if (!isAdmin) {
        const timer = setTimeout(() => {
          navigate('/ingresos', { replace: true })
        }, 0)
        return () => clearTimeout(timer)
      }
      
      if (isAdmin && token) {
        fetchUsuarios()
      }
    }
  }, [isAdmin, authLoading, navigate, token])

  const fetchUsuarios = async () => {
    try {
      const response = await fetch('/api/users', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setUsuarios(data)
      }
    } catch (error) {
      console.error('Error al cargar usuarios:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleOpenModal = (user = null) => {
    setEditingUser(user)
    if (user) {
      setFormData({
        username: user.username || '',
        password: '',
        nombre: user.nombre || '',
        email: user.email || '',
        role: user.role || 'user'
      })
    } else {
      setFormData({
        username: '',
        password: '',
        nombre: '',
        email: '',
        role: 'user'
      })
    }
    setShowModal(true)
  }

  const handleCloseModal = () => {
    setShowModal(false)
    setEditingUser(null)
    setFormData({
      username: '',
      password: '',
      nombre: '',
      email: '',
      role: 'user'
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!formData.username) {
      alert('El usuario es requerido')
      return
    }

    if (!editingUser && !formData.password) {
      alert('La contraseña es requerida para nuevos usuarios')
      return
    }

    try {
      const method = editingUser ? 'PUT' : 'POST'
      const url = editingUser ? `/api/users/${editingUser.id}` : '/api/users'
      
      // Preparar el body, eliminando password vacío en edición
      const bodyData = { ...formData }
      if (editingUser && !bodyData.password) {
        delete bodyData.password
      }

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(bodyData)
      })

      if (response.ok) {
        alert(editingUser ? 'Usuario actualizado correctamente' : 'Usuario creado correctamente')
        handleCloseModal()
        fetchUsuarios()
      } else {
        const error = await response.json()
        alert(`Error: ${error.error}`)
      }
    } catch (error) {
      console.error('Error al guardar usuario:', error)
      alert('Error al guardar el usuario')
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('¿Estás seguro de eliminar este usuario?')) return

    try {
      const response = await fetch(`/api/users/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        alert('Usuario eliminado correctamente')
        fetchUsuarios()
      } else {
        const error = await response.json()
        alert(`Error: ${error.error}`)
      }
    } catch (error) {
      console.error('Error al eliminar usuario:', error)
      alert('Error al eliminar el usuario')
    }
  }

  if (authLoading || loading) {
    return <div className="usuarios-container">Cargando...</div>
  }

  if (!isAdmin) {
    return null // El useEffect ya redirigirá
  }

  return (
    <div className="usuarios-container">
      <div className="usuarios-header">
        <div>
          <h1 className="usuarios-title">Gestión de Usuarios</h1>
          <p className="usuarios-subtitle">Administra los usuarios del sistema</p>
        </div>
        <button
          className="btn-nuevo-usuario"
          onClick={() => handleOpenModal()}
        >
          + Nuevo Usuario
        </button>
      </div>

      <div className="table-container">
        <table className="usuarios-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Usuario</th>
              <th>Nombre</th>
              <th>Email</th>
              <th>Rol</th>
              <th>Fecha Creación</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {usuarios.length === 0 ? (
              <tr>
                <td colSpan="7" className="empty-state">
                  No hay usuarios registrados
                </td>
              </tr>
            ) : (
              usuarios.map(usuario => (
                <tr key={usuario.id}>
                  <td>{usuario.id}</td>
                  <td>{usuario.username}</td>
                  <td>{usuario.nombre}</td>
                  <td>{usuario.email || '-'}</td>
                  <td>
                    <span className={`badge badge-${usuario.role === 'admin' ? 'admin' : 'user'}`}>
                      {usuario.role === 'admin' ? 'Administrador' : 'Usuario'}
                    </span>
                  </td>
                  <td>{new Date(usuario.fecha_creacion).toLocaleDateString()}</td>
                  <td>
                    <button
                      className="btn-edit"
                      onClick={() => handleOpenModal(usuario)}
                    >
                      Editar
                    </button>
                    <button
                      className="btn-delete"
                      onClick={() => handleDelete(usuario.id)}
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

      {showModal && (
        <div className="modal-overlay" onClick={handleCloseModal}>
          <div className="modal-content usuario-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editingUser ? 'Editar Usuario' : 'Nuevo Usuario'}</h3>
              <button className="btn-close" onClick={handleCloseModal}>×</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="form-group">
                  <label>Usuario *</label>
                  <input
                    type="text"
                    name="username"
                    value={formData.username}
                    onChange={(e) => setFormData({...formData, username: e.target.value})}
                    autoComplete="username"
                    required
                    placeholder="Nombre de usuario"
                  />
                </div>
                <div className="form-group">
                  <label>Contraseña {!editingUser && '*'}</label>
                  <input
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={(e) => setFormData({...formData, password: e.target.value})}
                    autoComplete={editingUser ? "new-password" : "new-password"}
                    required={!editingUser}
                    placeholder={editingUser ? "Dejar vacío para no cambiar" : "Contraseña"}
                  />
                </div>
                <div className="form-group">
                  <label>Nombre</label>
                  <input
                    type="text"
                    name="nombre"
                    value={formData.nombre}
                    onChange={(e) => setFormData({...formData, nombre: e.target.value})}
                    autoComplete="name"
                    placeholder="Nombre completo"
                  />
                </div>
                <div className="form-group">
                  <label>Email</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    autoComplete="email"
                    placeholder="correo@ejemplo.com"
                  />
                </div>
                <div className="form-group">
                  <label>Rol *</label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({...formData, role: e.target.value})}
                    required
                  >
                    <option value="user">Usuario</option>
                    <option value="admin">Administrador</option>
                  </select>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn-secondary" onClick={handleCloseModal}>Cancelar</button>
                <button type="submit" className="btn-primary">
                  {editingUser ? 'Actualizar Usuario' : 'Crear Usuario'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default Usuarios

