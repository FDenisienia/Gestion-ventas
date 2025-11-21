import { obtenerToken } from './authStorage';

// Configuración de la API
// Detecta automáticamente si está en Netlify y usa rutas relativas
const getApiBaseUrl = (): string => {
  // Si está configurada manualmente, usarla
  if (import.meta.env.VITE_API_URL) {
    const url = import.meta.env.VITE_API_URL;
    return url.endsWith('/api') ? url : `${url}/api`;
  }
  
  // Desarrollo local
  if (import.meta.env.DEV) {
    return 'http://localhost:3001/api';
  }
  
  // Detectar si estamos en Netlify
  const isNetlify = typeof window !== 'undefined' && 
    (window.location.hostname.includes('netlify.app') || 
     window.location.hostname.includes('netlify.com'));
  
  if (isNetlify) {
    // En Netlify, usar /api porque netlify.toml redirige /api/* a /.netlify/functions/api/:splat
    // Esto es más limpio y funciona correctamente con las redirecciones
    return '/api';
  }
  
  // Producción sin Netlify - intentar usar variable de entorno o localhost
  return 'http://localhost:3001/api';
};

export const API_BASE_URL = getApiBaseUrl();

// Log para debugging (siempre mostrar en consola)
if (typeof window !== 'undefined') {
  console.log(`🔧 API Base URL: ${API_BASE_URL}`);
}

// Función para obtener headers con autenticación
export const getAuthHeaders = (): HeadersInit => {
  const token = obtenerToken();
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };
  
  if (token && token !== 'local-auth-token') {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  return headers;
};

