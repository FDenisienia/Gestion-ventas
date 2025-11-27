import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { ProtectedRoute } from './components/ProtectedRoute'
import Layout from './components/Layout'
import Login from './pages/Login'
import Ingresos from './pages/Ingresos'
import Egresos from './pages/Egresos'
import BaseDatos from './pages/BaseDatos'
import Informes from './pages/Informes'
import Tesoreria from './pages/Tesoreria'
import Operaciones from './pages/Operaciones'
import Usuarios from './pages/Usuarios'

function App() {
  return (
    <Router
      future={{
        v7_startTransition: true,
        v7_relativeSplatPath: true
      }}
    >
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route
          path="/*"
          element={
            <ProtectedRoute>
              <Layout>
                <Routes>
                  <Route path="/" element={<Navigate to="/ingresos" replace />} />
                  <Route path="/ingresos" element={<Ingresos />} />
                  <Route path="/egresos" element={<Egresos />} />
                  <Route path="/base-datos" element={<BaseDatos />} />
                  <Route path="/informes" element={<Informes />} />
                  <Route path="/tesoreria" element={<Tesoreria />} />
                  <Route path="/operaciones" element={<Operaciones />} />
                  <Route path="/usuarios" element={<Usuarios />} />
                </Routes>
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </Router>
  )
}

export default App

