import type { Venta } from '../types/venta';
import { API_BASE_URL, getAuthHeaders } from './apiConfig';

// Función auxiliar para disparar eventos de actualización
const dispararEventoActualizacion = () => {
  setTimeout(() => {
    const event = new CustomEvent('ventasActualizadas', { 
      detail: { timestamp: Date.now() } 
    });
    window.dispatchEvent(event);
  }, 0);
};

export const obtenerVentas = async (): Promise<Venta[]> => {
  try {
    const response = await fetch(`${API_BASE_URL}/ventas`, {
      headers: getAuthHeaders(),
    });
    if (!response.ok) {
      if (response.status === 401 || response.status === 403) {
        // Token inválido, limpiar sesión
        const { cerrarSesion } = await import('./authStorage');
        cerrarSesion();
        window.location.reload();
        return [];
      }
      throw new Error(`Error HTTP: ${response.status}`);
    }
    const ventas = await response.json();
    return ventas;
  } catch (error: any) {
    // NO usar localStorage como fallback - puede contener datos de otros usuarios
    // Si el servidor no está disponible, retornar array vacío
    console.error('Error al obtener ventas:', error);
    return [];
  }
};

export const agregarVenta = async (venta: Venta): Promise<void> => {
  try {
    const response = await fetch(`${API_BASE_URL}/ventas`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(venta),
    });
    
    if (!response.ok) {
      throw new Error(`Error HTTP: ${response.status}`);
    }
    
    dispararEventoActualizacion();
  } catch (error: any) {
    // NO usar localStorage como fallback - puede causar problemas de seguridad
    console.error('Error al agregar venta:', error);
    throw error; // Re-lanzar el error para que el componente lo maneje
  }
};

export const actualizarVenta = async (id: string, ventaActualizada: Venta): Promise<void> => {
  try {
    const response = await fetch(`${API_BASE_URL}/ventas/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(ventaActualizada),
    });
    
    if (!response.ok) {
      throw new Error(`Error HTTP: ${response.status}`);
    }
    
    dispararEventoActualizacion();
  } catch (error: any) {
    // NO usar localStorage como fallback - puede causar problemas de seguridad
    console.error('Error al actualizar venta:', error);
    throw error; // Re-lanzar el error para que el componente lo maneje
  }
};

export const eliminarVenta = async (id: string): Promise<void> => {
  try {
    const response = await fetch(`${API_BASE_URL}/ventas/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    
    if (!response.ok) {
      throw new Error(`Error HTTP: ${response.status}`);
    }
    
    dispararEventoActualizacion();
  } catch (error: any) {
    // NO usar localStorage como fallback - puede causar problemas de seguridad
    console.error('Error al eliminar venta:', error);
    throw error; // Re-lanzar el error para que el componente lo maneje
  }
};

// Funciones de fallback eliminadas por seguridad
// Ya no se usan localStorage para evitar mostrar datos de otros usuarios

