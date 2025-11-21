import { useState, useEffect, Suspense, lazy, useCallback, useMemo, memo } from 'react';
import { Container, Navbar, Nav, NavbarBrand, Button, Spinner, Badge } from 'react-bootstrap';
import Login from './components/Login';
import { estaAutenticado, cerrarSesion, esAdmin, obtenerUsuario } from './utils/authStorage';

// Lazy loading de componentes pesados
const VentasCRUD = lazy(() => import('./components/VentasCRUD'));
const GraficoSemanal = lazy(() => import('./components/GraficoSemanal'));
const StockCRUD = lazy(() => import('./components/StockCRUD'));
const ResumenCuentas = lazy(() => import('./components/ResumenCuentas'));
const Configuracion = lazy(() => import('./components/Configuracion'));
const PanelAdmin = lazy(() => import('./components/PanelAdmin'));

// Componente de carga memoizado
const LoadingSpinner = memo(() => (
  <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '400px' }}>
    <Spinner animation="border" role="status">
      <span className="visually-hidden">Cargando...</span>
    </Spinner>
  </div>
));
LoadingSpinner.displayName = 'LoadingSpinner';

// Tipo para las pestañas
type TabType = 'ventas' | 'grafico' | 'stock' | 'resumen' | 'configuracion' | 'admin';

// Componente de navegación memoizado optimizado
const NavigationLinks = memo(({ isAdmin, activeTab, onTabChange }: {
  isAdmin: boolean;
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
}) => {
  // Memoizar los handlers de click para evitar recrearlos en cada render
  const createHandler = useCallback((tab: TabType) => {
    return () => onTabChange(tab);
  }, [onTabChange]);
  
  const adminLinks = useMemo(() => (
    <>
      <Nav.Link
        active={activeTab === 'admin'}
        onClick={createHandler('admin')}
        style={{ cursor: 'pointer' }}
      >
        Administración
      </Nav.Link>
      <Nav.Link
        active={activeTab === 'configuracion'}
        onClick={createHandler('configuracion')}
        style={{ cursor: 'pointer' }}
      >
        Configuración
      </Nav.Link>
    </>
  ), [activeTab, createHandler]);
  
  const userLinks = useMemo(() => (
    <>
      <Nav.Link
        active={activeTab === 'ventas'}
        onClick={createHandler('ventas')}
        style={{ cursor: 'pointer' }}
      >
        Ventas
      </Nav.Link>
      <Nav.Link
        active={activeTab === 'grafico'}
        onClick={createHandler('grafico')}
        style={{ cursor: 'pointer' }}
      >
        Gráfico
      </Nav.Link>
      <Nav.Link
        active={activeTab === 'resumen'}
        onClick={createHandler('resumen')}
        style={{ cursor: 'pointer' }}
      >
        Resumen Cuentas
      </Nav.Link>
      <Nav.Link
        active={activeTab === 'stock'}
        onClick={createHandler('stock')}
        style={{ cursor: 'pointer' }}
      >
        Stock
      </Nav.Link>
      <Nav.Link
        active={activeTab === 'configuracion'}
        onClick={createHandler('configuracion')}
        style={{ cursor: 'pointer' }}
      >
        Configuración
      </Nav.Link>
    </>
  ), [activeTab, createHandler]);
  
  return isAdmin ? adminLinks : userLinks;
}, (prevProps, nextProps) => {
  // Comparación personalizada para evitar re-renders innecesarios
  // No comparamos onTabChange porque es una función estable (useCallback)
  return prevProps.isAdmin === nextProps.isAdmin && 
         prevProps.activeTab === nextProps.activeTab;
});
NavigationLinks.displayName = 'NavigationLinks';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [activeTab, setActiveTab] = useState<'ventas' | 'grafico' | 'stock' | 'resumen' | 'configuracion' | 'admin'>('ventas');

  useEffect(() => {
    // Verificar si el usuario está autenticado al cargar la app
    const autenticado = estaAutenticado();
    setIsAuthenticated(autenticado);
    if (autenticado) {
      const admin = esAdmin();
      setIsAdmin(admin);
      // Si es admin, iniciar en la pestaña de administración, si no en ventas
      setActiveTab(admin ? 'admin' : 'ventas');
    }
  }, []);

  const handleLoginSuccess = useCallback(() => {
    setIsAuthenticated(true);
    const admin = esAdmin();
    setIsAdmin(admin);
    // Si es admin, iniciar en la pestaña de administración, si no en ventas
    setActiveTab(admin ? 'admin' : 'ventas');
  }, []);

  const handleLogout = useCallback(() => {
    if (window.confirm('¿Estás seguro de que deseas cerrar sesión?')) {
      cerrarSesion();
      setIsAuthenticated(false);
      setIsAdmin(false);
      setActiveTab('ventas');
    }
  }, []);

  const handleTabChange = useCallback((tab: 'ventas' | 'grafico' | 'stock' | 'resumen' | 'configuracion' | 'admin') => {
    setActiveTab(tab);
  }, []);

  // Memoizar el nombre de usuario para evitar llamadas innecesarias
  const username = useMemo(() => obtenerUsuario()?.username, [isAuthenticated]);

  // Memoizar el contenido renderizado según el rol
  const renderContent = useMemo(() => {
    if (isAdmin) {
      return (
        <>
          {activeTab === 'admin' && <PanelAdmin />}
          {activeTab === 'configuracion' && <Configuracion />}
        </>
      );
    }
    return (
      <>
        {activeTab === 'ventas' && <VentasCRUD />}
        {activeTab === 'grafico' && <GraficoSemanal />}
        {activeTab === 'resumen' && <ResumenCuentas />}
        {activeTab === 'stock' && <StockCRUD />}
        {activeTab === 'configuracion' && <Configuracion />}
      </>
    );
  }, [isAdmin, activeTab]);

  // Si no está autenticado, mostrar el login
  if (!isAuthenticated) {
    return <Login onLoginSuccess={handleLoginSuccess} />;
  }

  // Si está autenticado, mostrar la aplicación
  return (
    <>
      <Navbar bg="dark" variant="dark" expand="lg">
        <Container>
          <NavbarBrand>
            Gestion App
            {isAdmin ? (
              <Badge bg="danger" className="ms-2">Admin</Badge>
            ) : (
              <Badge bg="primary" className="ms-2">Usuario</Badge>
            )}
          </NavbarBrand>
          <Navbar.Toggle aria-controls="basic-navbar-nav" />
          <Navbar.Collapse id="basic-navbar-nav">
            <Nav className="me-auto">
              <NavigationLinks
                isAdmin={isAdmin}
                activeTab={activeTab}
                onTabChange={handleTabChange}
              />
            </Nav>
            <Nav>
              <Navbar.Text className="me-3 text-light">
                {username}
              </Navbar.Text>
              <Button variant="outline-light" onClick={handleLogout}>
                Cerrar Sesión
              </Button>
            </Nav>
          </Navbar.Collapse>
        </Container>
      </Navbar>

      <Suspense fallback={<LoadingSpinner />}>
        {renderContent}
      </Suspense>
    </>
  );
}

export default App;

