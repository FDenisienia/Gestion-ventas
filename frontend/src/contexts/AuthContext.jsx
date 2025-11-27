import { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [token, setToken] = useState(() => localStorage.getItem('token'))

  useEffect(() => {
    // Verificar token al cargar
    let isMounted = true
    
    const verifyToken = async () => {
      const storedToken = localStorage.getItem('token')
      if (!storedToken) {
        if (isMounted) {
          setLoading(false)
        }
        return
      }

      try {
        const response = await fetch('/api/auth/verify', {
          headers: {
            'Authorization': `Bearer ${storedToken}`
          }
        })

        if (!isMounted) return

        if (response.ok) {
          const data = await response.json()
          setUser(data.user)
          setToken(storedToken)
        } else {
          // Token inválido
          setToken(null)
          setUser(null)
          localStorage.removeItem('token')
        }
      } catch (error) {
        console.error('Error al verificar token:', error)
        if (isMounted) {
          setToken(null)
          setUser(null)
          localStorage.removeItem('token')
        }
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    verifyToken()

    return () => {
      isMounted = false
    }
  }, []) // Solo ejecutar una vez al montar

  const login = useCallback(async (username, password) => {
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ username, password })
      })

      const data = await response.json()

      if (response.ok) {
        // Actualizar estado de forma síncrona
        const token = data.token
        const user = data.user
        
        localStorage.setItem('token', token)
        // Actualizar estado en un solo batch
        setToken(token)
        setUser(user)
        
        return { success: true }
      } else {
        return { success: false, error: data.error || 'Credenciales inválidas' }
      }
    } catch (error) {
      console.error('Error en login:', error)
      return { success: false, error: 'Error de conexión. Verifica que el servidor esté corriendo.' }
    }
  }, [])

  const logout = useCallback(() => {
    setToken(null)
    setUser(null)
    localStorage.removeItem('token')
  }, [])

  // Calcular valores derivados de forma estable
  // Calcular valores derivados FUERA del useMemo
  const isAuthenticated = !!user && !!token
  const isAdmin = user?.role === 'admin'

  // NO incluir isAuthenticated e isAdmin en las dependencias para evitar bucles
  const value = useMemo(() => ({
    user,
    token,
    login,
    logout,
    loading,
    isAuthenticated,
    isAdmin
  }), [user, token, login, logout, loading])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth debe usarse dentro de AuthProvider')
  }
  return context
}

