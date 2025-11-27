import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import './Login.css'

function Login() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [redirecting, setRedirecting] = useState(false)
  const { login, isAuthenticated, loading: authLoading } = useAuth()
  const navigate = useNavigate()

  // Solo redirigir si ya está autenticado al cargar la página (una sola vez)
  useEffect(() => {
    if (!authLoading && isAuthenticated && !redirecting) {
      setRedirecting(true)
      navigate('/ingresos', { replace: true })
    }
  }, [authLoading, isAuthenticated, redirecting, navigate])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const result = await login(username, password)
      
      if (result && result.success) {
        // No redirigir aquí, dejar que el useEffect maneje la redirección
        setLoading(false)
      } else {
        setError(result?.error || 'Error al iniciar sesión')
        setLoading(false)
      }
    } catch (err) {
      console.error('Error en login:', err)
      setError('Error al iniciar sesión. Verifica que el servidor esté corriendo en http://localhost:3001')
      setLoading(false)
    }
  }

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <h1>Sistema de Gestión</h1>
          <p>Inicia sesión para continuar</p>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          {error && <div className="error-message">{error}</div>}

          <div className="form-group">
            <label htmlFor="username">Usuario</label>
            <input
              type="text"
              id="username"
              name="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="username"
              required
              autoFocus
              placeholder="Ingresa tu usuario"
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Contraseña</label>
            <input
              type="password"
              id="password"
              name="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              required
              placeholder="Ingresa tu contraseña"
            />
          </div>

          <button type="submit" className="login-button" disabled={loading}>
            {loading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
          </button>
        </form>

        <div className="login-footer">
          <p>Usuario por defecto: <strong>admin</strong> / Contraseña: <strong>admin123</strong></p>
        </div>
      </div>
    </div>
  )
}

export default Login

