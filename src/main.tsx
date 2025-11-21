import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
// Cargar Bootstrap CSS de forma optimizada
import 'bootstrap/dist/css/bootstrap.min.css'
import './style.css'

// Limpiar datos viejos de localStorage si es un nuevo build
const STORAGE_VERSION_KEY = 'app_build_version';

(async () => {
  let buildVersion: string | null = null;

  try {
    // Intentar importar la versión del build (generada en prebuild)
    const buildVersionModule = await import('./build-version');
    buildVersion = buildVersionModule.BUILD_VERSION;
  } catch (e) {
    // En desarrollo sin build, usar timestamp
    buildVersion = `dev-${Date.now()}`;
  }

  // Verificar si es un nuevo build
  const storedVersion = localStorage.getItem(STORAGE_VERSION_KEY);
  if (storedVersion && storedVersion !== buildVersion) {
    // Es un nuevo build, limpiar datos viejos
    console.log('🔄 Nuevo build detectado, limpiando datos antiguos...');
    // Limpiar solo datos de la app, no todo localStorage
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_user');
    localStorage.removeItem('app_credentials');
    localStorage.removeItem('productos');
    localStorage.removeItem('ventas');
    // Guardar la nueva versión
    localStorage.setItem(STORAGE_VERSION_KEY, buildVersion);
    console.log('✅ Datos limpiados, nueva versión guardada');
  } else if (!storedVersion) {
    // Primera vez, guardar versión
    localStorage.setItem(STORAGE_VERSION_KEY, buildVersion);
  }
})();

// Renderizar inmediatamente para mejor tiempo de carga inicial
ReactDOM.createRoot(document.getElementById('app')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)



