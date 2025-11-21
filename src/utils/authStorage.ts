import { API_BASE_URL } from './apiConfig';

const TOKEN_KEY = 'auth_token';
const USER_KEY = 'auth_user';
const CREDENTIALS_KEY = 'app_credentials';
const DEFAULT_USERNAME = 'gestionapp';
const DEFAULT_PASSWORD = 'admin123';

export interface Credentials {
  username: string;
  password: string;
}

export interface User {
  id: number;
  username: string;
  role?: 'admin' | 'user';
}

export interface LoginResponse {
  token: string;
  user: User;
}

// Obtener credenciales guardadas o usar las por defecto
export const obtenerCredenciales = (): Credentials => {
  const credencialesGuardadas = localStorage.getItem(CREDENTIALS_KEY);
  if (credencialesGuardadas) {
    try {
      const credenciales = JSON.parse(credencialesGuardadas);
      // NO migrar usuarios - usar el username que está guardado
      return credenciales;
    } catch (e) {
      // Si hay error al parsear, limpiar
      localStorage.removeItem(CREDENTIALS_KEY);
    }
  }
  // Si no hay credenciales guardadas, usar las por defecto
  const credencialesDefault: Credentials = {
    username: DEFAULT_USERNAME,
    password: DEFAULT_PASSWORD,
  };
  guardarCredenciales(credencialesDefault);
  return credencialesDefault;
};

// Guardar credenciales
export const guardarCredenciales = (credenciales: Credentials): void => {
  localStorage.setItem(CREDENTIALS_KEY, JSON.stringify(credenciales));
};

// Obtener token JWT
export const obtenerToken = (): string | null => {
  return localStorage.getItem(TOKEN_KEY);
};

// Guardar token JWT
export const guardarToken = (token: string): void => {
  localStorage.setItem(TOKEN_KEY, token);
};

// Obtener usuario actual
export const obtenerUsuario = (): User | null => {
  const userStr = localStorage.getItem(USER_KEY);
  return userStr ? JSON.parse(userStr) : null;
};

// Verificar si el usuario es administrador
export const esAdmin = (): boolean => {
  const usuario = obtenerUsuario();
  return usuario?.role === 'admin';
};

// Guardar usuario
export const guardarUsuario = (user: User): void => {
  localStorage.setItem(USER_KEY, JSON.stringify(user));
};

// Verificar si el usuario está autenticado
export const estaAutenticado = (): boolean => {
  const token = obtenerToken();
  return token !== null && token !== '';
};

// Iniciar sesión con JWT
export const iniciarSesion = async (username: string, password: string): Promise<LoginResponse | null> => {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ username, password }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Error al iniciar sesión');
    }

    const data: LoginResponse = await response.json();
    guardarToken(data.token);
    guardarUsuario(data.user);
    return data;
  } catch (error: any) {
    // Fallback a autenticación local si el servidor no está disponible
    console.warn('API no disponible, usando autenticación local:', error.message);
    const credenciales = obtenerCredenciales();
    if (credenciales.username === username && credenciales.password === password) {
      // Crear un token simulado para compatibilidad
      const fakeToken = 'local-auth-token';
      guardarToken(fakeToken);
      guardarUsuario({ id: 1, username, role: 'admin' });
      return { token: fakeToken, user: { id: 1, username, role: 'admin' } };
    }
    throw error;
  }
};

// Verificar token con el servidor
export const verificarToken = async (): Promise<boolean> => {
  const token = obtenerToken();
  if (!token || token === 'local-auth-token') {
    return estaAutenticado(); // Si es token local, usar verificación local
  }

  try {
    const response = await fetch(`${API_BASE_URL}/auth/verify`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      // Token inválido, limpiar
      cerrarSesion();
      return false;
    }

    const data = await response.json();
    if (data.valid && data.user) {
      guardarUsuario(data.user);
      return true;
    }
    return false;
  } catch (error) {
    // Si hay error de conexión, asumir que el token local es válido
    return estaAutenticado();
  }
};

// Cerrar sesión
export const cerrarSesion = (): void => {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
  // Limpiar datos de productos y ventas para evitar mostrar datos de otros usuarios
  localStorage.removeItem('productos');
  localStorage.removeItem('ventas');
  // Mantener la sesión local para compatibilidad
  localStorage.setItem('app_session', 'false');
};

// Cambiar credenciales (solo para compatibilidad local)
export const cambiarCredenciales = (nuevoUsername: string, nuevaPassword: string, passwordActual: string): boolean => {
  const credenciales = obtenerCredenciales();
  // Verificar que la contraseña actual sea correcta
  if (credenciales.password !== passwordActual) {
    return false;
  }
  const nuevasCredenciales: Credentials = {
    username: nuevoUsername,
    password: nuevaPassword,
  };
  guardarCredenciales(nuevasCredenciales);
  return true;
};

