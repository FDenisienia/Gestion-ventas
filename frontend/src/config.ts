// Configuración de la API
// En desarrollo: usa el proxy de Vite (localhost:3001)
// En producción: usa la variable de entorno VITE_API_URL
export const API_URL: string = import.meta.env.VITE_API_URL || ''

// Función helper para construir URLs de API
export function getApiUrl(endpoint: string): string {
  // Si API_URL está definida (producción), úsala
  // Si no (desarrollo), usa rutas relativas que funcionan con el proxy de Vite
  if (API_URL) {
    return `${API_URL}${endpoint}`
  }
  return endpoint
}

