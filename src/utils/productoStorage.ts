import type { Producto } from '../types/producto';
import { API_BASE_URL, getAuthHeaders } from './apiConfig';

// Función auxiliar para disparar eventos de actualización
const dispararEventoActualizacion = () => {
  setTimeout(() => {
    window.dispatchEvent(new Event('productosActualizados'));
  }, 0);
};

export const obtenerProductos = async (): Promise<Producto[]> => {
  try {
    const response = await fetch(`${API_BASE_URL}/productos`, {
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
    const productos = await response.json();
    return productos;
  } catch (error: any) {
    // NO usar localStorage como fallback - puede contener datos de otros usuarios
    // Si el servidor no está disponible, retornar array vacío
    console.error('Error al obtener productos:', error);
    return [];
  }
};

export const agregarProducto = async (producto: Producto): Promise<void> => {
  try {
    const response = await fetch(`${API_BASE_URL}/productos`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(producto),
    });
    
    if (!response.ok) {
      throw new Error(`Error HTTP: ${response.status}`);
    }
    
    dispararEventoActualizacion();
  } catch (error: any) {
    // NO usar localStorage como fallback - puede causar problemas de seguridad
    console.error('Error al agregar producto:', error);
    throw error; // Re-lanzar el error para que el componente lo maneje
  }
};

export const actualizarProducto = async (id: string, productoActualizado: Producto): Promise<void> => {
  try {
    const response = await fetch(`${API_BASE_URL}/productos/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(productoActualizado),
    });
    
    if (!response.ok) {
      throw new Error(`Error HTTP: ${response.status}`);
    }
    
    dispararEventoActualizacion();
  } catch (error: any) {
    // NO usar localStorage como fallback - puede causar problemas de seguridad
    console.error('Error al actualizar producto:', error);
    throw error; // Re-lanzar el error para que el componente lo maneje
  }
};

export const eliminarProducto = async (id: string): Promise<void> => {
  try {
    const response = await fetch(`${API_BASE_URL}/productos/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    
    if (!response.ok) {
      throw new Error(`Error HTTP: ${response.status}`);
    }
    
    dispararEventoActualizacion();
  } catch (error: any) {
    // NO usar localStorage como fallback - puede causar problemas de seguridad
    console.error('Error al eliminar producto:', error);
    throw error; // Re-lanzar el error para que el componente lo maneje
  }
};

export const obtenerProductoPorId = async (id: string): Promise<Producto | undefined> => {
  try {
    const response = await fetch(`${API_BASE_URL}/productos/${id}`, {
      headers: getAuthHeaders(),
    });
    if (!response.ok) {
      if (response.status === 404) {
        return undefined;
      }
      if (response.status === 401 || response.status === 403) {
        // Token inválido, limpiar sesión
        const { cerrarSesion } = await import('./authStorage');
        cerrarSesion();
        window.location.reload();
        return undefined;
      }
      throw new Error(`Error HTTP: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    // NO usar localStorage como fallback - puede contener datos de otros usuarios
    console.error('Error al obtener producto:', error);
    return undefined;
  }
};

export const obtenerProductosPorCategoria = async (categoria: string): Promise<Producto[]> => {
  try {
    const productos = await obtenerProductos();
    return productos.filter(p => p.categoria === categoria);
  } catch (error) {
    // NO usar localStorage como fallback - puede contener datos de otros usuarios
    console.error('Error al obtener productos por categoría:', error);
    return [];
  }
};

export const descontarStock = async (productoId: string, cantidad: number): Promise<boolean> => {
  try {
    const producto = await obtenerProductoPorId(productoId);
    
    if (!producto) {
      return false;
    }
    
    if (producto.stock < cantidad) {
      return false; // No hay suficiente stock
    }
    
    producto.stock -= cantidad;
    await actualizarProducto(productoId, producto);
    return true;
  } catch (error) {
    // NO usar localStorage como fallback - puede causar problemas de seguridad
    console.error('Error al descontar stock:', error);
    return false;
  }
};

export const aumentarStock = async (productoId: string, cantidad: number): Promise<void> => {
  try {
    const producto = await obtenerProductoPorId(productoId);
    
    if (producto) {
      producto.stock += cantidad;
      await actualizarProducto(productoId, producto);
    }
  } catch (error) {
    // NO usar localStorage como fallback - puede causar problemas de seguridad
    console.error('Error al aumentar stock:', error);
    throw error; // Re-lanzar el error para que el componente lo maneje
  }
};

// Funciones de fallback eliminadas por seguridad
// Ya no se usan localStorage para evitar mostrar datos de otros usuarios


