import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import './Header.css'

function Header() {
  const { user, logout, isAdmin } = useAuth()
  const navigate = useNavigate()

  const menuItems = [
    { path: '/ingresos', label: 'Ingresos' },
    { path: '/egresos', label: 'Egresos' },
    { path: '/base-datos', label: 'Base de datos' },
    { path: '/informes', label: 'Informes' },
    { path: '/tesoreria', label: 'Resumen de cuentas' }
  ]

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <header className="sidebar">
      <div className="sidebar-header">
        <h1 className="sidebar-title">Gestión</h1>
        {user && (
          <div className="user-info">
            <div className="user-name">{user.nombre || user.username}</div>
            <div className="user-role">{user.role === 'admin' ? 'Administrador' : 'Usuario'}</div>
          </div>
        )}
      </div>
      <nav className="sidebar-nav">
        {menuItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `nav-item ${isActive ? 'active' : ''}`
            }
          >
            {item.label}
          </NavLink>
        ))}
        {isAdmin && (
          <NavLink
            to="/usuarios"
            className={({ isActive }) =>
              `nav-item ${isActive ? 'active' : ''}`
            }
          >
            Usuarios
          </NavLink>
        )}
      </nav>
      <div className="sidebar-footer">
        <button className="logout-button" onClick={handleLogout}>
          Cerrar Sesión
        </button>
      </div>
    </header>
  )
}

export default Header

