import express from 'express';
import cors from 'cors';
import sqlite3 from 'sqlite3';
import { promisify } from 'util';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { body, param, validationResult } from 'express-validator';
import xss from 'xss';
import dotenv from 'dotenv';
import compression from 'compression';

// Cargar variables de entorno
dotenv.config();

// Configuración de entorno
const IS_DEVELOPMENT = process.env.NODE_ENV !== 'production';

// Logger optimizado (solo en desarrollo, pero siempre mostrar errores)
// En Railway, mostrar logs importantes para debugging
const isRailway = process.env.RAILWAY_ENVIRONMENT || process.env.RAILWAY_PROJECT_ID;
const logger = {
  log: (...args) => (IS_DEVELOPMENT || isRailway) && console.log(...args),
  error: (...args) => console.error(...args), // Siempre mostrar errores
  warn: (...args) => (IS_DEVELOPMENT || isRailway) && console.warn(...args),
  info: (...args) => (IS_DEVELOPMENT || isRailway) && console.info(...args),
};

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;
const JWT_SECRET = process.env.JWT_SECRET || 'tu-secreto-super-seguro-cambiar-en-produccion';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';

// ========== CONFIGURACIÓN DE SEGURIDAD ==========

// Helmet para headers de seguridad
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
  crossOriginEmbedderPolicy: false,
}));

// CORS configurado para desarrollo y producción
const getAllowedOrigins = () => {
  const origins = [];
  
  // Desarrollo local
  origins.push('http://localhost:5173');
  origins.push('http://localhost:3000');
  origins.push('http://127.0.0.1:5173');
  origins.push('http://127.0.0.1:3000');
  
  // Frontend URL desde variable de entorno (puede ser múltiples URLs separadas por coma)
  if (process.env.FRONTEND_URL) {
    const frontendUrls = process.env.FRONTEND_URL.split(',').map(url => url.trim());
    origins.push(...frontendUrls);
  }
  
  // Netlify (agregar tu dominio de Netlify aquí o usar variable de entorno)
  if (process.env.NETLIFY_URL) {
    origins.push(process.env.NETLIFY_URL);
  }
  
  // Permitir cualquier dominio de Netlify (tanto en desarrollo como en producción)
  // Esto es necesario para que funcione desde cualquier PC/IP
  origins.push(/^https:\/\/.*\.netlify\.app$/);
  origins.push(/^https:\/\/.*\.netlify\.com$/);
  
  // En producción, también permitir cualquier origin si está configurado
  // Esto permite acceso desde cualquier IP/PC
  if (process.env.ALLOW_ALL_ORIGINS === 'true') {
    origins.push(/^https?:\/\/.*$/); // Permitir cualquier origen HTTP/HTTPS
  }
  
  return origins;
};

const corsOptions = {
  origin: (origin, callback) => {
    const allowedOrigins = getAllowedOrigins();
    
    // Permitir requests sin origin (mobile apps, Postman, etc.)
    if (!origin) {
      return callback(null, true);
    }
    
    // Verificar si el origin está permitido
    const isAllowed = allowedOrigins.some(allowedOrigin => {
      if (typeof allowedOrigin === 'string') {
        return origin === allowedOrigin;
      }
      if (allowedOrigin instanceof RegExp) {
        return allowedOrigin.test(origin);
      }
      return false;
    });
    
    if (isAllowed) {
      callback(null, true);
    } else {
      logger.warn(`CORS bloqueado para origin: ${origin}`);
      callback(new Error('No permitido por CORS'));
    }
  },
  credentials: true,
  optionsSuccessStatus: 200,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};
app.use(cors(corsOptions));

// Rate limiting (más permisivo en desarrollo)
const limiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minuto (reducido para resetear más rápido)
  max: 500, // máximo 500 requests por minuto (aumentado para desarrollo)
  message: 'Demasiadas solicitudes desde esta IP, por favor intenta más tarde.',
  standardHeaders: true,
  legacyHeaders: false,
  // No aplicar rate limiting en desarrollo para evitar problemas
  skip: () => process.env.NODE_ENV !== 'production',
});
app.use('/api/', limiter);

// Rate limiting más estricto para login (más permisivo en desarrollo)
const loginLimiter = rateLimit({
  windowMs: process.env.NODE_ENV === 'production' ? 15 * 60 * 1000 : 1 * 60 * 1000, // 15 min en producción, 1 min en desarrollo
  max: process.env.NODE_ENV === 'production' ? 5 : 100, // 5 en producción, 100 en desarrollo
  message: 'Demasiados intentos de login, por favor intenta más tarde.',
  skipSuccessfulRequests: true,
  // En desarrollo, permitir más intentos y resetear más rápido para evitar bloqueos durante pruebas
});

// Compresión de respuestas (optimización de rendimiento)
app.use(compression({
  level: 6, // Balance entre compresión y velocidad
  filter: (req, res) => {
    // No comprimir si el cliente no lo soporta o si es muy pequeño
    if (req.headers['x-no-compression']) {
      return false;
    }
    return compression.filter(req, res);
  }
}));

// Limitar tamaño del body
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ========== CONFIGURACIÓN DE BASE DE DATOS ==========

// En Netlify Functions, usar /tmp para la base de datos (único directorio escribible)
// En desarrollo/producción normal, usar el directorio del servidor
const isNetlifyFunction = process.env.NETLIFY === 'true' || process.env.AWS_LAMBDA_FUNCTION_NAME;
const DB_PATH = isNetlifyFunction 
  ? path.join('/tmp', 'database.db')
  : path.join(__dirname, 'database.db');
const BACKUP_DIR = isNetlifyFunction
  ? path.join('/tmp', 'backups')
  : path.join(__dirname, 'backups');

// Asegurar que el directorio de backups existe
if (!fs.existsSync(BACKUP_DIR)) {
  fs.mkdirSync(BACKUP_DIR, { recursive: true });
}

// Crear conexión a la base de datos con optimizaciones
const db = new sqlite3.Database(DB_PATH, sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE, (err) => {
  if (err) {
    logger.error('Error al conectar con la base de datos:', err);
  } else {
    logger.log('Conectado a la base de datos SQLite');
    // Optimizaciones de SQLite para mejor rendimiento
    db.run('PRAGMA journal_mode = WAL', (err) => {
      if (err) logger.error('Error al configurar WAL:', err);
    });
    db.run('PRAGMA synchronous = NORMAL', (err) => {
      if (err) logger.error('Error al configurar synchronous:', err);
    });
    db.run('PRAGMA cache_size = -64000', (err) => {
      if (err) logger.error('Error al configurar cache:', err);
    });
    db.run('PRAGMA foreign_keys = ON', (err) => {
      if (err) {
        logger.error('Error al habilitar foreign keys:', err);
      } else {
        logger.log('Foreign keys habilitadas');
      }
    });
    inicializarBaseDatos();
  }
});

// Promisificar métodos de la base de datos
const dbGet = promisify(db.get.bind(db));
const dbAll = promisify(db.all.bind(db));

// Función personalizada para dbRun que devuelve el resultado con changes
const dbRun = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function(err) {
      if (err) {
        reject(err);
      } else {
        resolve({
          changes: this.changes,
          lastID: this.lastID
        });
      }
    });
  });
};

// ========== FUNCIONES DE SEGURIDAD ==========

// Sanitizar string para prevenir XSS
function sanitizeString(str) {
  if (typeof str !== 'string') return str;
  return xss(str, {
    whiteList: {},
    stripIgnoreTag: true,
    stripIgnoreTagBody: ['script'],
  });
}

// Sanitizar objeto completo
function sanitizeObject(obj) {
  if (Array.isArray(obj)) {
    return obj.map(item => sanitizeObject(item));
  }
  if (obj !== null && typeof obj === 'object') {
    const sanitized = {};
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        sanitized[key] = typeof obj[key] === 'string' ? sanitizeString(obj[key]) : sanitizeObject(obj[key]);
      }
    }
    return sanitized;
  }
  return typeof obj === 'string' ? sanitizeString(obj) : obj;
}

// Middleware de validación
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ 
      error: 'Error de validación',
      details: errors.array() 
    });
  }
  next();
};

// Middleware de autenticación JWT
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ error: 'Token de autenticación requerido' });
  }

  jwt.verify(token, JWT_SECRET, async (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Token inválido o expirado' });
    }
    // Obtener información completa del usuario incluyendo el rol
    try {
      const usuarioCompleto = await dbGet('SELECT id, username, role FROM usuarios WHERE id = ?', [user.id]);
      if (!usuarioCompleto) {
        return res.status(403).json({ error: 'Usuario no encontrado' });
      }
      req.user = {
        id: usuarioCompleto.id,
        username: usuarioCompleto.username,
        role: usuarioCompleto.role
      };
      next();
    } catch (error) {
      logger.error('Error al obtener usuario:', error);
      return res.status(500).json({ error: 'Error interno del servidor' });
    }
  });
};

// Middleware para verificar si es administrador
const requireAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Acceso denegado. Se requieren permisos de administrador' });
  }
  next();
};

// ========== INICIALIZACIÓN DE BASE DE DATOS ==========

// Función para encontrar el siguiente ID disponible y limpiarlo
async function obtenerSiguienteIdDisponible() {
  try {
    // Obtener todos los IDs existentes ordenados
    const usuarios = await dbAll('SELECT id FROM usuarios ORDER BY id ASC');
    const idsExistentes = usuarios.map(u => u.id);
    
    // Buscar el primer ID disponible empezando desde 1
    let siguienteId = 1;
    while (idsExistentes.includes(siguienteId)) {
      siguienteId++;
    }
    
    // CRÍTICO: Limpiar COMPLETAMENTE cualquier dato residual del ID antes de devolverlo
    // Esto asegura que el ID esté completamente limpio cuando se asigne
    logger.log(`Limpiando ID ${siguienteId} antes de asignarlo...`);
    
    // Deshabilitar foreign keys temporalmente
    await dbRun('PRAGMA foreign_keys = OFF');
    
    // PASO 1: Revertir stock de ventas antes de eliminarlas
    const ventasParaRevertir = await dbAll('SELECT productoId, cantidad FROM ventas WHERE userId = ? OR CAST(userId AS TEXT) = ? OR CAST(userId AS INTEGER) = ?', [siguienteId, String(siguienteId), siguienteId]);
    for (const venta of ventasParaRevertir) {
      if (venta.productoId && venta.cantidad) {
        try {
          const producto = await dbGet('SELECT stock, id FROM productos WHERE id = ?', [venta.productoId]);
          if (producto) {
            const nuevoStock = (producto.stock || 0) + (venta.cantidad || 0);
            await dbRun('UPDATE productos SET stock = ?, updatedAt = datetime(\'now\') WHERE id = ?', [nuevoStock, venta.productoId]);
          }
        } catch (error) {
          logger.error(`Error al revertir stock:`, error);
        }
      }
    }
    
    // PASO 2: Eliminar todos los datos asociados a este ID (múltiples métodos y pasadas)
    for (let i = 0; i < 20; i++) {
      // Productos - múltiples métodos
      await dbRun('DELETE FROM productos WHERE userId = ?', [siguienteId]);
      await dbRun('DELETE FROM productos WHERE CAST(userId AS INTEGER) = ?', [siguienteId]);
      await dbRun(`DELETE FROM productos WHERE userId = ${siguienteId}`);
      await dbRun('DELETE FROM productos WHERE CAST(userId AS TEXT) = ?', [String(siguienteId)]);
      
      // Ventas - múltiples métodos
      const resultadoV1 = await dbRun('DELETE FROM ventas WHERE userId = ?', [siguienteId]);
      const resultadoV2 = await dbRun('DELETE FROM ventas WHERE CAST(userId AS INTEGER) = ?', [siguienteId]);
      const resultadoV3 = await dbRun(`DELETE FROM ventas WHERE userId = ${siguienteId}`);
      const resultadoV4 = await dbRun('DELETE FROM ventas WHERE CAST(userId AS TEXT) = ?', [String(siguienteId)]);
      
      if (resultadoV1.changes === 0 && resultadoV2.changes === 0 && resultadoV3.changes === 0 && resultadoV4.changes === 0) break;
    }
    
    // PASO 3: Verificación exhaustiva y limpieza final
    const productosRestantes = await dbAll('SELECT COUNT(*) as count FROM productos WHERE userId = ? OR CAST(userId AS TEXT) = ? OR CAST(userId AS INTEGER) = ?', [siguienteId, String(siguienteId), siguienteId]);
    const ventasRestantes = await dbAll('SELECT COUNT(*) as count FROM ventas WHERE userId = ? OR CAST(userId AS TEXT) = ? OR CAST(userId AS INTEGER) = ?', [siguienteId, String(siguienteId), siguienteId]);
    
    if ((productosRestantes[0]?.count || 0) > 0 || (ventasRestantes[0]?.count || 0) > 0) {
      logger.warn(`⚠️  ID ${siguienteId} aún tiene datos. Limpiando forzadamente...`);
      // Limpieza forzada final
      await dbRun('DELETE FROM productos WHERE userId = ?', [siguienteId]);
      await dbRun('DELETE FROM ventas WHERE userId = ?', [siguienteId]);
      await dbRun(`DELETE FROM productos WHERE userId = ${siguienteId}`);
      await dbRun(`DELETE FROM ventas WHERE userId = ${siguienteId}`);
    }
    
    // Rehabilitar foreign keys
    await dbRun('PRAGMA foreign_keys = ON');
    
    // Verificación final
    const verificacionFinal = await dbAll('SELECT COUNT(*) as count FROM productos WHERE userId = ?', [siguienteId]);
    const verificacionVentasFinal = await dbAll('SELECT COUNT(*) as count FROM ventas WHERE userId = ?', [siguienteId]);
    
    if ((verificacionFinal[0]?.count || 0) > 0 || (verificacionVentasFinal[0]?.count || 0) > 0) {
      logger.error(`❌ ERROR: ID ${siguienteId} aún tiene datos después de limpiar: ${verificacionFinal[0]?.count || 0} productos, ${verificacionVentasFinal[0]?.count || 0} ventas`);
    } else {
      logger.log(`✅ ID ${siguienteId} limpiado correctamente`);
    }
    
    return siguienteId;
  } catch (error) {
    logger.error('Error al obtener siguiente ID:', error);
    // Si hay error, obtener el máximo ID y sumar 1
    const maxId = await dbGet('SELECT MAX(id) as maxId FROM usuarios');
    const nuevoId = (maxId?.maxId || 0) + 1;
    
    // Limpiar este ID también
    await dbRun('DELETE FROM productos WHERE userId = ?', [nuevoId]);
    await dbRun('DELETE FROM ventas WHERE userId = ?', [nuevoId]);
    
    return nuevoId;
  }
}

// Función para reorganizar IDs (asegurar que admin sea 1)
async function reorganizarIds() {
  try {
    // Obtener todos los usuarios ordenados: primero admins, luego users
    const usuarios = await dbAll('SELECT id, username, role FROM usuarios ORDER BY role DESC, id ASC');
    
    if (usuarios.length === 0) return;
    
    // Crear una tabla temporal para mapear IDs antiguos a nuevos
    const mapeoIds = new Map();
    let nuevoId = 1;
    
    // Primero asignar IDs a admins
    for (const usuario of usuarios) {
      if (usuario.role === 'admin') {
        mapeoIds.set(usuario.id, nuevoId);
        nuevoId++;
      }
    }
    
    // Luego asignar IDs a users
    for (const usuario of usuarios) {
      if (usuario.role === 'user') {
        mapeoIds.set(usuario.id, nuevoId);
        nuevoId++;
      }
    }
    
    // Si no hay cambios necesarios, salir
    let necesitaReorganizacion = false;
    for (const [idAntiguo, idNuevo] of mapeoIds) {
      if (idAntiguo !== idNuevo) {
        necesitaReorganizacion = true;
        break;
      }
    }
    
    if (!necesitaReorganizacion) return;
    
    // Deshabilitar foreign keys temporalmente para reorganizar
    await dbRun('PRAGMA foreign_keys = OFF');
    
    // Crear tabla temporal
    await dbRun(`
      CREATE TABLE IF NOT EXISTS usuarios_temp (
        id INTEGER PRIMARY KEY,
        username TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        role TEXT NOT NULL DEFAULT 'user' CHECK(role IN ('admin', 'user')),
        createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
        updatedAt TEXT DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // PRIMERO: Eliminar datos huérfanos de usuarios que ya no existen
    const idsUsuariosExistentes = Array.from(mapeoIds.keys());
    if (idsUsuariosExistentes.length > 0) {
      const placeholdersExistentes = idsUsuariosExistentes.map(() => '?').join(',');
      await dbRun(`DELETE FROM productos WHERE userId NOT IN (${placeholdersExistentes})`, idsUsuariosExistentes);
      await dbRun(`DELETE FROM ventas WHERE userId NOT IN (${placeholdersExistentes})`, idsUsuariosExistentes);
    }
    
    // SEGUNDO: Obtener todos los nuevos IDs que se van a asignar
    const todosLosNuevosIds = Array.from(mapeoIds.values());
    
    // TERCERO: Para cada usuario que cambia de ID, eliminar sus datos y limpiar el nuevo ID
    for (const [idAntiguo, idNuevo] of mapeoIds) {
      if (idAntiguo !== idNuevo) {
        // Eliminar datos del ID antiguo del usuario (el usuario empieza limpio con el nuevo ID)
        await dbRun('DELETE FROM productos WHERE userId = ?', [idAntiguo]);
        await dbRun('DELETE FROM ventas WHERE userId = ?', [idAntiguo]);
        
        // Eliminar cualquier dato residual que pueda estar en el nuevo ID
        // Esto asegura que el nuevo ID esté completamente limpio
        await dbRun('DELETE FROM productos WHERE userId = ?', [idNuevo]);
        await dbRun('DELETE FROM ventas WHERE userId = ?', [idNuevo]);
      }
    }
    
    // CUARTO: Como medida adicional, eliminar datos de todos los nuevos IDs que se van a usar
    // Esto garantiza que no queden datos residuales de ningún tipo
    if (todosLosNuevosIds.length > 0) {
      const placeholdersNuevos = todosLosNuevosIds.map(() => '?').join(',');
      await dbRun(`DELETE FROM productos WHERE userId IN (${placeholdersNuevos})`, todosLosNuevosIds);
      await dbRun(`DELETE FROM ventas WHERE userId IN (${placeholdersNuevos})`, todosLosNuevosIds);
    }
    
    // TERCERO: Copiar usuarios con nuevos IDs
    for (const usuario of usuarios) {
      const nuevoId = mapeoIds.get(usuario.id);
      const usuarioCompleto = await dbGet('SELECT * FROM usuarios WHERE id = ?', [usuario.id]);
      
      // Insertar en tabla temporal con nuevo ID
      await dbRun(
        'INSERT INTO usuarios_temp (id, username, password, role, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?)',
        [nuevoId, usuarioCompleto.username, usuarioCompleto.password, usuarioCompleto.role, usuarioCompleto.createdAt, usuarioCompleto.updatedAt]
      );
    }
    
    // Eliminar tabla original y renombrar temporal
    await dbRun('DROP TABLE usuarios');
    await dbRun('ALTER TABLE usuarios_temp RENAME TO usuarios');
    
    // Rehabilitar foreign keys
    await dbRun('PRAGMA foreign_keys = ON');
    
    logger.log('IDs reorganizados correctamente');
  } catch (error) {
    logger.error('Error al reorganizar IDs:', error);
    // Rehabilitar foreign keys en caso de error
    await dbRun('PRAGMA foreign_keys = ON');
  }
}

async function inicializarBaseDatos() {
  try {
    // Tabla de usuarios (sin AUTOINCREMENT para manejar IDs manualmente)
    await dbRun(`
      CREATE TABLE IF NOT EXISTS usuarios (
        id INTEGER PRIMARY KEY,
        username TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        role TEXT NOT NULL DEFAULT 'user' CHECK(role IN ('admin', 'user')),
        createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
        updatedAt TEXT DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Agregar columna role si no existe (migración)
    try {
      const tableInfo = await dbAll("PRAGMA table_info(usuarios)");
      const hasRoleColumn = tableInfo.some((col) => col.name === 'role');
      if (!hasRoleColumn) {
        await dbRun('ALTER TABLE usuarios ADD COLUMN role TEXT DEFAULT "user"');
        // Actualizar usuarios existentes sin role
        await dbRun('UPDATE usuarios SET role = "user" WHERE role IS NULL');
        // NO forzar roles de usuarios - respetar los roles existentes
      }
    } catch (e) {
      // La columna ya existe, ignorar error
      logger.log('Columna role ya existe o error en migración:', e.message);
    }

    // Tabla de productos
    await dbRun(`
      CREATE TABLE IF NOT EXISTS productos (
        id TEXT PRIMARY KEY,
        nombre TEXT NOT NULL,
        marca TEXT NOT NULL,
        categoria TEXT NOT NULL,
        stock INTEGER NOT NULL DEFAULT 0,
        costoUnitario REAL NOT NULL,
        precioVenta REAL NOT NULL,
        descripcion TEXT,
        userId INTEGER NOT NULL,
        createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
        updatedAt TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (userId) REFERENCES usuarios(id) ON DELETE CASCADE
      )
    `);

    // Agregar columna userId si no existe (migración)
    try {
      const productosInfo = await dbAll("PRAGMA table_info(productos)");
      const hasUserIdColumn = productosInfo.some((col) => col.name === 'userId');
      if (!hasUserIdColumn) {
        await dbRun('ALTER TABLE productos ADD COLUMN userId INTEGER DEFAULT 1');
        // Asignar productos existentes al primer usuario admin o al usuario por defecto
        const adminUser = await dbGet('SELECT id FROM usuarios WHERE role = "admin" LIMIT 1');
        if (adminUser) {
          await dbRun('UPDATE productos SET userId = ? WHERE userId IS NULL OR userId = 1', [adminUser.id]);
        }
      }
    } catch (e) {
      logger.log('Columna userId en productos ya existe o error en migración:', e.message);
    }

    // Tabla de ventas
    await dbRun(`
      CREATE TABLE IF NOT EXISTS ventas (
        id TEXT PRIMARY KEY,
        nombreCliente TEXT NOT NULL,
        apellidoCliente TEXT NOT NULL,
        dni TEXT NOT NULL,
        producto TEXT NOT NULL,
        productoId TEXT,
        marca TEXT,
        tipo TEXT,
        categoria TEXT NOT NULL,
        costo REAL NOT NULL,
        precioVenta REAL NOT NULL,
        cantidad INTEGER NOT NULL,
        fecha TEXT NOT NULL,
        ganancia REAL NOT NULL,
        estadoPago TEXT NOT NULL CHECK(estadoPago IN ('pagado', 'parcial', 'pendiente')),
        montoPagado REAL,
        metodoPago TEXT CHECK(metodoPago IN ('efectivo', 'transferencia')),
        cuentaBanco TEXT,
        userId INTEGER NOT NULL,
        createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
        updatedAt TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (userId) REFERENCES usuarios(id) ON DELETE CASCADE
      )
    `);

    // Agregar columna userId si no existe (migración)
    try {
      const ventasInfo = await dbAll("PRAGMA table_info(ventas)");
      const hasUserIdColumn = ventasInfo.some((col) => col.name === 'userId');
      if (!hasUserIdColumn) {
        await dbRun('ALTER TABLE ventas ADD COLUMN userId INTEGER DEFAULT 1');
        // Asignar ventas existentes al primer usuario admin o al usuario por defecto
        const adminUser = await dbGet('SELECT id FROM usuarios WHERE role = "admin" LIMIT 1');
        if (adminUser) {
          await dbRun('UPDATE ventas SET userId = ? WHERE userId IS NULL OR userId = 1', [adminUser.id]);
        }
      }
    } catch (e) {
      logger.log('Columna userId en ventas ya existe o error en migración:', e.message);
    }

    // NO crear usuario por defecto automáticamente
    // Los usuarios deben ser creados manualmente o a través de la API
    // Esto evita conflictos con usuarios personalizados como "GOD"

    // Reorganizar IDs para que admin sea 1 y los demás sigan secuencialmente
    // COMENTADO: La reorganización automática causa transferencia de datos entre usuarios
    // Es mejor permitir gaps en los IDs que transferir datos incorrectamente
    // await reorganizarIds();

    logger.log('Base de datos inicializada correctamente');
    
    // Realizar backup inicial
    realizarBackup();
  } catch (error) {
    logger.error('Error al inicializar la base de datos:', error);
  }
}

// Función para realizar backup
function realizarBackup() {
  try {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupFileName = `backup_${timestamp}.db`;
    const backupPath = path.join(BACKUP_DIR, backupFileName);
    
    // Copiar archivo de base de datos
    fs.copyFileSync(DB_PATH, backupPath);
    logger.log(`Backup creado: ${backupFileName}`);
    
    // Mantener solo los últimos 10 backups
    const backups = fs.readdirSync(BACKUP_DIR)
      .filter(file => file.startsWith('backup_') && file.endsWith('.db'))
      .map(file => ({
        name: file,
        time: fs.statSync(path.join(BACKUP_DIR, file)).mtime.getTime()
      }))
      .sort((a, b) => b.time - a.time);
    
    // Eliminar backups antiguos
    if (backups.length > 10) {
      backups.slice(10).forEach(backup => {
        fs.unlinkSync(path.join(BACKUP_DIR, backup.name));
        logger.log(`Backup antiguo eliminado: ${backup.name}`);
      });
    }
  } catch (error) {
    logger.error('Error al realizar backup:', error);
  }
}

// Realizar backup cada 6 horas
setInterval(realizarBackup, 6 * 60 * 60 * 1000);

// ========== ENDPOINTS DE AUTENTICACIÓN ==========

// POST /api/auth/login - Iniciar sesión
app.post('/api/auth/login', loginLimiter, [
  body('username').trim().notEmpty().withMessage('Usuario requerido'),
  body('password').notEmpty().withMessage('Contraseña requerida'),
], validate, async (req, res) => {
  try {
    const { username, password } = req.body;
    
    // Buscar usuario (case-insensitive: no importa mayúsculas o minúsculas)
    const usuario = await dbGet('SELECT * FROM usuarios WHERE LOWER(username) = LOWER(?)', [username]);
    
    if (!usuario) {
      return res.status(401).json({ error: 'Usuario o contraseña incorrectos' });
    }
    
    // Verificar contraseña
    const passwordMatch = await bcrypt.compare(password, usuario.password);
    
    if (!passwordMatch) {
      return res.status(401).json({ error: 'Usuario o contraseña incorrectos' });
    }
    
    // Generar token JWT
    const token = jwt.sign(
      { id: usuario.id, username: usuario.username, role: usuario.role },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );
    
    res.json({
      token,
      user: {
        id: usuario.id,
        username: usuario.username,
        role: usuario.role,
      },
    });
  } catch (error) {
    logger.error('Error en login:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// POST /api/auth/verify - Verificar token
app.post('/api/auth/verify', authenticateToken, (req, res) => {
  res.json({ valid: true, user: req.user });
});

// ========== ENDPOINTS DE PRODUCTOS (PROTEGIDOS) ==========

// GET /api/productos - Obtener todos los productos (filtrados por usuario)
app.get('/api/productos', authenticateToken, async (req, res) => {
  try {
    // Los admins pueden ver todos los productos, los usuarios solo los suyos
    const query = req.user.role === 'admin' 
      ? 'SELECT * FROM productos ORDER BY nombre ASC'
      : 'SELECT * FROM productos WHERE userId = ? ORDER BY nombre ASC';
    const params = req.user.role === 'admin' ? [] : [req.user.id];
    const productos = await dbAll(query, params);
    res.json(productos);
  } catch (error) {
    logger.error('Error al obtener productos:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// GET /api/productos/:id - Obtener un producto por ID
app.get('/api/productos/:id', authenticateToken, [
  param('id').trim().notEmpty().withMessage('ID requerido'),
], validate, async (req, res) => {
  try {
    const query = req.user.role === 'admin'
      ? 'SELECT * FROM productos WHERE id = ?'
      : 'SELECT * FROM productos WHERE id = ? AND userId = ?';
    const params = req.user.role === 'admin' 
      ? [req.params.id]
      : [req.params.id, req.user.id];
    const producto = await dbGet(query, params);
    if (!producto) {
      return res.status(404).json({ error: 'Producto no encontrado' });
    }
    res.json(producto);
  } catch (error) {
    logger.error('Error al obtener producto:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// POST /api/productos - Crear un nuevo producto
app.post('/api/productos', authenticateToken, [
  body('id').trim().notEmpty().withMessage('ID requerido'),
  body('nombre').trim().notEmpty().isLength({ min: 1, max: 200 }).withMessage('Nombre requerido (máx 200 caracteres)'),
  body('marca').trim().notEmpty().isLength({ min: 1, max: 100 }).withMessage('Marca requerida (máx 100 caracteres)'),
  body('categoria').trim().notEmpty().withMessage('Categoría requerida'),
  body('stock').isInt({ min: 0 }).withMessage('Stock debe ser un número entero positivo'),
  body('costoUnitario').isFloat({ min: 0 }).withMessage('Costo unitario debe ser un número positivo'),
  body('precioVenta').isFloat({ min: 0 }).withMessage('Precio de venta debe ser un número positivo'),
  body('descripcion').optional().trim().isLength({ max: 500 }).withMessage('Descripción máxima 500 caracteres'),
], validate, async (req, res) => {
  try {
    const data = sanitizeObject(req.body);
    const { id, nombre, marca, categoria, stock, costoUnitario, precioVenta, descripcion } = data;
    
    await dbRun(
      `INSERT INTO productos (id, nombre, marca, categoria, stock, costoUnitario, precioVenta, descripcion, userId, updatedAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))`,
      [id, nombre, marca, categoria, stock, costoUnitario, precioVenta, descripcion || null, req.user.id]
    );
    
    realizarBackup();
    res.status(201).json({ message: 'Producto creado correctamente' });
  } catch (error) {
    logger.error('Error al crear producto:', error);
    if (error.message.includes('UNIQUE constraint')) {
      return res.status(409).json({ error: 'El producto con este ID ya existe' });
    }
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// PUT /api/productos/:id - Actualizar un producto
app.put('/api/productos/:id', authenticateToken, [
  param('id').trim().notEmpty().withMessage('ID requerido'),
  body('nombre').trim().notEmpty().isLength({ min: 1, max: 200 }).withMessage('Nombre requerido (máx 200 caracteres)'),
  body('marca').trim().notEmpty().isLength({ min: 1, max: 100 }).withMessage('Marca requerida (máx 100 caracteres)'),
  body('categoria').trim().notEmpty().withMessage('Categoría requerida'),
  body('stock').isInt({ min: 0 }).withMessage('Stock debe ser un número entero positivo'),
  body('costoUnitario').isFloat({ min: 0 }).withMessage('Costo unitario debe ser un número positivo'),
  body('precioVenta').isFloat({ min: 0 }).withMessage('Precio de venta debe ser un número positivo'),
  body('descripcion').optional().trim().isLength({ max: 500 }).withMessage('Descripción máxima 500 caracteres'),
], validate, async (req, res) => {
  try {
    const data = sanitizeObject(req.body);
    const { nombre, marca, categoria, stock, costoUnitario, precioVenta, descripcion } = data;
    
    // Verificar que el producto pertenece al usuario (o es admin)
    const producto = await dbGet('SELECT userId FROM productos WHERE id = ?', [req.params.id]);
    if (!producto) {
      return res.status(404).json({ error: 'Producto no encontrado' });
    }
    if (req.user.role !== 'admin' && producto.userId !== req.user.id) {
      return res.status(403).json({ error: 'No tienes permiso para modificar este producto' });
    }
    
    const result = await dbRun(
      `UPDATE productos 
       SET nombre = ?, marca = ?, categoria = ?, stock = ?, costoUnitario = ?, precioVenta = ?, descripcion = ?, updatedAt = datetime('now')
       WHERE id = ?`,
      [nombre, marca, categoria, stock, costoUnitario, precioVenta, descripcion || null, req.params.id]
    );
    
    if (result.changes === 0) {
      return res.status(404).json({ error: 'Producto no encontrado' });
    }
    
    realizarBackup();
    res.json({ message: 'Producto actualizado correctamente' });
  } catch (error) {
    logger.error('Error al actualizar producto:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// DELETE /api/productos/:id - Eliminar un producto
app.delete('/api/productos/:id', authenticateToken, [
  param('id').trim().notEmpty().withMessage('ID requerido'),
], validate, async (req, res) => {
  try {
    // Verificar que el producto pertenece al usuario (o es admin)
    const producto = await dbGet('SELECT userId FROM productos WHERE id = ?', [req.params.id]);
    if (!producto) {
      return res.status(404).json({ error: 'Producto no encontrado' });
    }
    if (req.user.role !== 'admin' && producto.userId !== req.user.id) {
      return res.status(403).json({ error: 'No tienes permiso para eliminar este producto' });
    }
    
    const result = await dbRun('DELETE FROM productos WHERE id = ?', [req.params.id]);
    
    if (result.changes === 0) {
      return res.status(404).json({ error: 'Producto no encontrado' });
    }
    
    realizarBackup();
    res.json({ message: 'Producto eliminado correctamente' });
  } catch (error) {
    logger.error('Error al eliminar producto:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// ========== ENDPOINTS DE VENTAS (PROTEGIDOS) ==========

// GET /api/ventas - Obtener todas las ventas (filtradas por usuario)
app.get('/api/ventas', authenticateToken, async (req, res) => {
  try {
    // Los admins pueden ver todas las ventas, los usuarios solo las suyas
    const query = req.user.role === 'admin'
      ? 'SELECT * FROM ventas ORDER BY fecha DESC, createdAt DESC'
      : 'SELECT * FROM ventas WHERE userId = ? ORDER BY fecha DESC, createdAt DESC';
    const params = req.user.role === 'admin' ? [] : [req.user.id];
    const ventas = await dbAll(query, params);
    
    // Logging para debugging - verificar qué ventas se están devolviendo
    if (req.user.role !== 'admin') {
      logger.log(`\n[GET /api/ventas] Usuario ${req.user.id} (${req.user.username}) solicitó ventas`);
      logger.log(`  Query: ${query}`);
      logger.log(`  Params: [${params.join(', ')}]`);
      logger.log(`  Ventas encontradas: ${ventas.length}`);
      if (ventas.length > 0) {
        logger.log(`  Muestra de ventas (primeras 3):`, ventas.slice(0, 3).map(v => ({
          id: v.id,
          cliente: v.nombreCliente,
          userId: v.userId,
          tipo: typeof v.userId,
          userIdComparado: v.userId === req.user.id,
          userIdLoose: v.userId == req.user.id
        })));
      }
    }
    
    res.json(ventas);
  } catch (error) {
    logger.error('Error al obtener ventas:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// GET /api/ventas/:id - Obtener una venta por ID
app.get('/api/ventas/:id', authenticateToken, [
  param('id').trim().notEmpty().withMessage('ID requerido'),
], validate, async (req, res) => {
  try {
    const query = req.user.role === 'admin'
      ? 'SELECT * FROM ventas WHERE id = ?'
      : 'SELECT * FROM ventas WHERE id = ? AND userId = ?';
    const params = req.user.role === 'admin'
      ? [req.params.id]
      : [req.params.id, req.user.id];
    const venta = await dbGet(query, params);
    if (!venta) {
      return res.status(404).json({ error: 'Venta no encontrada' });
    }
    res.json(venta);
  } catch (error) {
    logger.error('Error al obtener venta:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// POST /api/ventas - Crear una nueva venta
app.post('/api/ventas', authenticateToken, [
  body('id').trim().notEmpty().withMessage('ID requerido'),
  body('nombreCliente').trim().notEmpty().isLength({ min: 1, max: 100 }).withMessage('Nombre de cliente requerido'),
  body('apellidoCliente').trim().notEmpty().isLength({ min: 1, max: 100 }).withMessage('Apellido de cliente requerido'),
  body('dni').trim().notEmpty().isLength({ min: 1, max: 20 }).withMessage('DNI requerido'),
  body('producto').trim().notEmpty().isLength({ min: 1, max: 200 }).withMessage('Producto requerido'),
  body('categoria').trim().notEmpty().withMessage('Categoría requerida'),
  body('costo').isFloat({ min: 0 }).withMessage('Costo debe ser un número positivo'),
  body('precioVenta').isFloat({ min: 0 }).withMessage('Precio de venta debe ser un número positivo'),
  body('cantidad').isInt({ min: 1 }).withMessage('Cantidad debe ser un número entero positivo'),
  body('fecha').isISO8601().withMessage('Fecha inválida'),
  body('ganancia').isFloat().withMessage('Ganancia debe ser un número'),
  body('estadoPago').isIn(['pagado', 'parcial', 'pendiente']).withMessage('Estado de pago inválido'),
  body('montoPagado').optional().isFloat({ min: 0 }).withMessage('Monto pagado debe ser un número positivo'),
  body('metodoPago').optional().isIn(['efectivo', 'transferencia']).withMessage('Método de pago inválido'),
  body('cuentaBanco').optional().trim().isLength({ max: 100 }).withMessage('Cuenta bancaria máxima 100 caracteres'),
], validate, async (req, res) => {
  try {
    const data = sanitizeObject(req.body);
    const venta = data;
    
    await dbRun(
      `INSERT INTO ventas (
        id, nombreCliente, apellidoCliente, dni, producto, productoId, marca, tipo,
        categoria, costo, precioVenta, cantidad, fecha, ganancia, estadoPago,
        montoPagado, metodoPago, cuentaBanco, userId, updatedAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))`,
      [
        venta.id, venta.nombreCliente, venta.apellidoCliente, venta.dni,
        venta.producto, venta.productoId || null, venta.marca || null, venta.tipo || null,
        venta.categoria, venta.costo, venta.precioVenta, venta.cantidad,
        venta.fecha, venta.ganancia, venta.estadoPago,
        venta.montoPagado || null, venta.metodoPago || null, venta.cuentaBanco || null,
        req.user.id
      ]
    );
    
    realizarBackup();
    res.status(201).json({ message: 'Venta creada correctamente' });
  } catch (error) {
    logger.error('Error al crear venta:', error);
    if (error.message.includes('UNIQUE constraint')) {
      return res.status(409).json({ error: 'La venta con este ID ya existe' });
    }
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// PUT /api/ventas/:id - Actualizar una venta
app.put('/api/ventas/:id', authenticateToken, [
  param('id').trim().notEmpty().withMessage('ID requerido'),
  body('nombreCliente').trim().notEmpty().isLength({ min: 1, max: 100 }).withMessage('Nombre de cliente requerido'),
  body('apellidoCliente').trim().notEmpty().isLength({ min: 1, max: 100 }).withMessage('Apellido de cliente requerido'),
  body('dni').trim().notEmpty().isLength({ min: 1, max: 20 }).withMessage('DNI requerido'),
  body('producto').trim().notEmpty().isLength({ min: 1, max: 200 }).withMessage('Producto requerido'),
  body('categoria').trim().notEmpty().withMessage('Categoría requerida'),
  body('costo').isFloat({ min: 0 }).withMessage('Costo debe ser un número positivo'),
  body('precioVenta').isFloat({ min: 0 }).withMessage('Precio de venta debe ser un número positivo'),
  body('cantidad').isInt({ min: 1 }).withMessage('Cantidad debe ser un número entero positivo'),
  body('fecha').isISO8601().withMessage('Fecha inválida'),
  body('ganancia').isFloat().withMessage('Ganancia debe ser un número'),
  body('estadoPago').isIn(['pagado', 'parcial', 'pendiente']).withMessage('Estado de pago inválido'),
  body('montoPagado').optional().isFloat({ min: 0 }).withMessage('Monto pagado debe ser un número positivo'),
  body('metodoPago').optional().isIn(['efectivo', 'transferencia']).withMessage('Método de pago inválido'),
  body('cuentaBanco').optional().trim().isLength({ max: 100 }).withMessage('Cuenta bancaria máxima 100 caracteres'),
], validate, async (req, res) => {
  try {
    const data = sanitizeObject(req.body);
    const venta = data;
    
    // Verificar que la venta pertenece al usuario (o es admin)
    const ventaExistente = await dbGet('SELECT userId FROM ventas WHERE id = ?', [req.params.id]);
    if (!ventaExistente) {
      return res.status(404).json({ error: 'Venta no encontrada' });
    }
    if (req.user.role !== 'admin' && ventaExistente.userId !== req.user.id) {
      return res.status(403).json({ error: 'No tienes permiso para modificar esta venta' });
    }
    
    const result = await dbRun(
      `UPDATE ventas 
       SET nombreCliente = ?, apellidoCliente = ?, dni = ?, producto = ?, productoId = ?,
           marca = ?, tipo = ?, categoria = ?, costo = ?, precioVenta = ?, cantidad = ?,
           fecha = ?, ganancia = ?, estadoPago = ?, montoPagado = ?, metodoPago = ?,
           cuentaBanco = ?, updatedAt = datetime('now')
       WHERE id = ?`,
      [
        venta.nombreCliente, venta.apellidoCliente, venta.dni, venta.producto,
        venta.productoId || null, venta.marca || null, venta.tipo || null,
        venta.categoria, venta.costo, venta.precioVenta, venta.cantidad,
        venta.fecha, venta.ganancia, venta.estadoPago,
        venta.montoPagado || null, venta.metodoPago || null, venta.cuentaBanco || null,
        req.params.id
      ]
    );
    
    if (result.changes === 0) {
      return res.status(404).json({ error: 'Venta no encontrada' });
    }
    
    realizarBackup();
    res.json({ message: 'Venta actualizada correctamente' });
  } catch (error) {
    logger.error('Error al actualizar venta:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// DELETE /api/ventas/:id - Eliminar una venta
app.delete('/api/ventas/:id', authenticateToken, [
  param('id').trim().notEmpty().withMessage('ID requerido'),
], validate, async (req, res) => {
  try {
    // Verificar que la venta pertenece al usuario (o es admin)
    const venta = await dbGet('SELECT * FROM ventas WHERE id = ?', [req.params.id]);
    if (!venta) {
      return res.status(404).json({ error: 'Venta no encontrada' });
    }
    if (req.user.role !== 'admin' && venta.userId !== req.user.id) {
      return res.status(403).json({ error: 'No tienes permiso para eliminar esta venta' });
    }
    
    // REVERTIR EL STOCK: Si la venta tiene productoId, revertir el stock
    if (venta.productoId) {
      const producto = await dbGet('SELECT stock FROM productos WHERE id = ?', [venta.productoId]);
      if (producto) {
        // Revertir el stock sumando la cantidad vendida
        const nuevoStock = (producto.stock || 0) + (venta.cantidad || 0);
        await dbRun('UPDATE productos SET stock = ?, updatedAt = datetime(\'now\') WHERE id = ?', [nuevoStock, venta.productoId]);
        logger.log(`Stock revertido para producto ${venta.productoId}: +${venta.cantidad} unidades`);
      }
    }
    
    // Eliminar la venta
    const result = await dbRun('DELETE FROM ventas WHERE id = ?', [req.params.id]);
    
    if (result.changes === 0) {
      return res.status(404).json({ error: 'Venta no encontrada' });
    }
    
    realizarBackup();
    res.json({ message: 'Venta eliminada correctamente y stock revertido' });
  } catch (error) {
    logger.error('Error al eliminar venta:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// ========== ENDPOINTS DE USUARIOS (SOLO ADMIN) ==========

// GET /api/usuarios - Obtener todos los usuarios (solo admin)
app.get('/api/usuarios', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const usuarios = await dbAll('SELECT id, username, role, createdAt, updatedAt FROM usuarios ORDER BY username ASC');
    res.json(usuarios);
  } catch (error) {
    logger.error('Error al obtener usuarios:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// GET /api/usuarios/:id - Obtener un usuario por ID (solo admin)
app.get('/api/usuarios/:id', authenticateToken, requireAdmin, [
  param('id').trim().notEmpty().withMessage('ID requerido'),
], validate, async (req, res) => {
  try {
    const usuario = await dbGet('SELECT id, username, role, createdAt, updatedAt FROM usuarios WHERE id = ?', [req.params.id]);
    if (!usuario) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }
    res.json(usuario);
  } catch (error) {
    logger.error('Error al obtener usuario:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// POST /api/usuarios - Crear un nuevo usuario (solo admin)
app.post('/api/usuarios', authenticateToken, requireAdmin, [
  body('username').trim().notEmpty().isLength({ min: 3, max: 50 }).withMessage('Usuario requerido (3-50 caracteres)'),
  body('password').isLength({ min: 6 }).withMessage('Contraseña debe tener al menos 6 caracteres'),
  body('role').optional().isIn(['admin', 'user']).withMessage('Rol inválido (admin o user)'),
], validate, async (req, res) => {
  try {
    const data = sanitizeObject(req.body);
    const { username, password, role = 'user' } = data;
    
    // Verificar si el usuario ya existe
    const usuarioExistente = await dbGet('SELECT id FROM usuarios WHERE username = ?', [username]);
    if (usuarioExistente) {
      return res.status(409).json({ error: 'El usuario ya existe' });
    }
    
    // Hashear contraseña
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Obtener el siguiente ID disponible (ya limpia el ID automáticamente en la función)
    const nuevoId = await obtenerSiguienteIdDisponible();
    
    logger.log(`\n=== CREANDO NUEVO USUARIO CON ID ${nuevoId} ===`);
    
    // Verificación final antes de crear (por seguridad adicional)
    const verificacionPrevia = await dbAll('SELECT COUNT(*) as count FROM productos WHERE userId = ? OR CAST(userId AS TEXT) = ? OR CAST(userId AS INTEGER) = ?', [nuevoId, String(nuevoId), nuevoId]);
    const verificacionVentasPrevia = await dbAll('SELECT COUNT(*) as count FROM ventas WHERE userId = ? OR CAST(userId AS TEXT) = ? OR CAST(userId AS INTEGER) = ?', [nuevoId, String(nuevoId), nuevoId]);
    
    if ((verificacionPrevia[0]?.count || 0) > 0 || (verificacionVentasPrevia[0]?.count || 0) > 0) {
      logger.warn(`⚠️  ID ${nuevoId} aún tiene datos. Limpiando nuevamente...`);
      
      // Revertir stock de ventas residuales
      const ventasResiduales = await dbAll('SELECT productoId, cantidad FROM ventas WHERE userId = ? OR CAST(userId AS TEXT) = ? OR CAST(userId AS INTEGER) = ?', [nuevoId, String(nuevoId), nuevoId]);
      for (const venta of ventasResiduales) {
        if (venta.productoId && venta.cantidad) {
          try {
            const producto = await dbGet('SELECT stock, id FROM productos WHERE id = ?', [venta.productoId]);
            if (producto) {
              const nuevoStock = (producto.stock || 0) + (venta.cantidad || 0);
              await dbRun('UPDATE productos SET stock = ?, updatedAt = datetime(\'now\') WHERE id = ?', [nuevoStock, venta.productoId]);
            }
          } catch (error) {
            logger.error(`Error al revertir stock residual:`, error);
          }
        }
      }
      
      // Eliminar datos residuales con múltiples métodos
      await dbRun('PRAGMA foreign_keys = OFF');
      await dbRun('DELETE FROM productos WHERE userId = ?', [nuevoId]);
      await dbRun('DELETE FROM productos WHERE CAST(userId AS INTEGER) = ?', [nuevoId]);
      await dbRun(`DELETE FROM productos WHERE userId = ${nuevoId}`);
      await dbRun('DELETE FROM ventas WHERE userId = ?', [nuevoId]);
      await dbRun('DELETE FROM ventas WHERE CAST(userId AS INTEGER) = ?', [nuevoId]);
      await dbRun(`DELETE FROM ventas WHERE userId = ${nuevoId}`);
      await dbRun('PRAGMA foreign_keys = ON');
      
      // Verificación final
      const verificacionFinal = await dbAll('SELECT COUNT(*) as count FROM ventas WHERE userId = ?', [nuevoId]);
      if ((verificacionFinal[0]?.count || 0) > 0) {
        logger.error(`❌ ERROR CRÍTICO: Aún quedan ${verificacionFinal[0]?.count || 0} ventas después de limpiar ID ${nuevoId}`);
      }
    }
    
    // Crear el usuario
    await dbRun(
      'INSERT INTO usuarios (id, username, password, role) VALUES (?, ?, ?, ?)',
      [nuevoId, username, hashedPassword, role]
    );
    
    logger.log(`✅ Usuario ${username} creado con ID ${nuevoId}`);
    
    // Obtener el usuario recién creado
    const nuevoUsuario = await dbGet('SELECT id, username, role FROM usuarios WHERE id = ?', [nuevoId]);
    
    realizarBackup();
    res.status(201).json({ 
      message: 'Usuario creado correctamente',
      user: {
        id: nuevoUsuario.id,
        username: nuevoUsuario.username,
        role: nuevoUsuario.role
      }
    });
  } catch (error) {
    logger.error('Error al crear usuario:', error);
    if (error.message.includes('UNIQUE constraint')) {
      return res.status(409).json({ error: 'El usuario ya existe' });
    }
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// PUT /api/usuarios/:id - Actualizar un usuario (solo admin)
app.put('/api/usuarios/:id', authenticateToken, requireAdmin, [
  param('id').trim().notEmpty().withMessage('ID requerido'),
  body('username').optional().trim().isLength({ min: 3, max: 50 }).withMessage('Usuario debe tener 3-50 caracteres'),
  body('password').optional({ nullable: true }).custom((value) => {
    // Si se proporciona password, debe tener al menos 6 caracteres
    if (value !== undefined && value !== null && value !== '' && value.length < 6) {
      throw new Error('Contraseña debe tener al menos 6 caracteres');
    }
    return true;
  }),
  body('role').optional().isIn(['admin', 'user']).withMessage('Rol inválido (admin o user)'),
], validate, async (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    if (isNaN(userId)) {
      return res.status(400).json({ error: 'ID inválido' });
    }
    
    const data = sanitizeObject(req.body);
    const { username, password, role } = data;
    
    // Verificar que el usuario existe
    const usuarioExistente = await dbGet('SELECT * FROM usuarios WHERE id = ?', [userId]);
    if (!usuarioExistente) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }
    
    // Construir query de actualización dinámicamente
    const updates = [];
    const params = [];
    
    if (username !== undefined && username !== null && username !== '') {
      // Verificar que el nuevo username no esté en uso
      const usernameEnUso = await dbGet('SELECT id FROM usuarios WHERE username = ? AND id != ?', [username, userId]);
      if (usernameEnUso) {
        return res.status(409).json({ error: 'El nombre de usuario ya está en uso' });
      }
      updates.push('username = ?');
      params.push(username);
    }
    
    if (password !== undefined && password !== null && password !== '') {
      const hashedPassword = await bcrypt.hash(password, 10);
      updates.push('password = ?');
      params.push(hashedPassword);
    }
    
    if (role !== undefined && role !== null && role !== '') {
      updates.push('role = ?');
      params.push(role);
    }
    
    if (updates.length === 0) {
      return res.status(400).json({ error: 'No hay campos para actualizar' });
    }
    
    updates.push('updatedAt = datetime(\'now\')');
    params.push(userId);
    
    const query = `UPDATE usuarios SET ${updates.join(', ')} WHERE id = ?`;
    const result = await dbRun(query, params);
    
    if (result.changes === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }
    
    realizarBackup();
    res.json({ message: 'Usuario actualizado correctamente' });
  } catch (error) {
    logger.error('Error al actualizar usuario:', error);
    // Proporcionar un mensaje de error más específico
    if (error.message) {
      return res.status(500).json({ error: 'Error interno del servidor: ' + error.message });
    }
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// PUT /api/usuarios/me - Actualizar el propio perfil del usuario logueado
app.put('/api/usuarios/me', authenticateToken, [
  body('username').optional().trim().isLength({ min: 3, max: 50 }).withMessage('Usuario debe tener 3-50 caracteres'),
  body('password').optional({ nullable: true }).custom((value) => {
    if (value !== undefined && value !== null && value !== '' && value.length < 6) {
      throw new Error('Contraseña debe tener al menos 6 caracteres');
    }
    return true;
  }),
  body('passwordActual').notEmpty().withMessage('Debes proporcionar tu contraseña actual para confirmar los cambios'),
], validate, async (req, res) => {
  try {
    const userId = req.user.id;
    const data = sanitizeObject(req.body);
    const { username, password, passwordActual } = data;
    
    // Verificar que el usuario existe
    const usuarioExistente = await dbGet('SELECT * FROM usuarios WHERE id = ?', [userId]);
    if (!usuarioExistente) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }
    
    // Verificar que la contraseña actual sea correcta
    const passwordMatch = await bcrypt.compare(passwordActual, usuarioExistente.password);
    if (!passwordMatch) {
      return res.status(401).json({ error: 'La contraseña actual es incorrecta' });
    }
    
    // Construir query de actualización dinámicamente
    const updates = [];
    const params = [];
    
    if (username !== undefined && username !== null && username !== '') {
      // Verificar que el nuevo username no esté en uso (case-insensitive)
      const usernameEnUso = await dbGet('SELECT id FROM usuarios WHERE LOWER(username) = LOWER(?) AND id != ?', [username, userId]);
      if (usernameEnUso) {
        return res.status(409).json({ error: 'El nombre de usuario ya está en uso' });
      }
      updates.push('username = ?');
      params.push(username);
    }
    
    if (password !== undefined && password !== null && password !== '') {
      const hashedPassword = await bcrypt.hash(password, 10);
      updates.push('password = ?');
      params.push(hashedPassword);
    }
    
    if (updates.length === 0) {
      return res.status(400).json({ error: 'Debes proporcionar al menos un campo para actualizar' });
    }
    
    updates.push('updatedAt = datetime(\'now\')');
    params.push(userId);
    
    const query = `UPDATE usuarios SET ${updates.join(', ')} WHERE id = ?`;
    await dbRun(query, params);
    
    // Obtener el usuario actualizado
    const usuarioActualizado = await dbGet('SELECT id, username, role FROM usuarios WHERE id = ?', [userId]);
    
    realizarBackup();
    res.json({ 
      message: 'Perfil actualizado correctamente', 
      user: usuarioActualizado 
    });
  } catch (error) {
    logger.error('Error al actualizar perfil:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// DELETE /api/usuarios/:id - Eliminar un usuario (solo admin)
app.delete('/api/usuarios/:id', authenticateToken, requireAdmin, [
  param('id').trim().notEmpty().withMessage('ID requerido'),
], validate, async (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    if (isNaN(userId)) {
      return res.status(400).json({ error: 'ID inválido' });
    }
    
    // No permitir eliminar el propio usuario
    if (userId === req.user.id) {
      return res.status(400).json({ error: 'No puedes eliminar tu propio usuario' });
    }
    
    // Verificar que el usuario existe
    const usuario = await dbGet('SELECT id FROM usuarios WHERE id = ?', [userId]);
    if (!usuario) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }
    
    // ========== ELIMINACIÓN COMPLETA Y TOTAL DE TODOS LOS DATOS DEL USUARIO ==========
    
    logger.log(`\n=== ELIMINACIÓN COMPLETA DEL USUARIO ${userId} ===`);
    
    // Contar datos antes de eliminar (para logging)
    const productosAntes = await dbAll('SELECT COUNT(*) as count FROM productos WHERE userId = ? OR CAST(userId AS TEXT) = ? OR CAST(userId AS INTEGER) = ?', [userId, String(userId), userId]);
    const ventasAntes = await dbAll('SELECT COUNT(*) as count FROM ventas WHERE userId = ? OR CAST(userId AS TEXT) = ? OR CAST(userId AS INTEGER) = ?', [userId, String(userId), userId]);
    logger.log(`Datos encontrados: ${productosAntes[0]?.count || 0} productos, ${ventasAntes[0]?.count || 0} ventas`);
    
    // Variables para tracking
    let productosEliminados = 0;
    let ventasEliminadas = 0;
    let stockRevertido = 0;
    let totalEliminaciones = 0;
    
    // PASO 1: Deshabilitar foreign keys temporalmente para forzar eliminación
    await dbRun('PRAGMA foreign_keys = OFF');
    
    // PASO 1.5: Obtener todos los productos y ventas con este userId para debugging
    const productosDebug = await dbAll('SELECT id, nombre, userId, typeof(userId) as userIdType FROM productos WHERE userId = ? LIMIT 10', [userId]);
    const ventasDebug = await dbAll('SELECT id, nombreCliente, userId, typeof(userId) as userIdType FROM ventas WHERE userId = ? LIMIT 10', [userId]);
    if (productosDebug.length > 0 || ventasDebug.length > 0) {
      logger.log('Datos encontrados antes de eliminar:');
      logger.log('Productos:', productosDebug);
      logger.log('Ventas:', ventasDebug);
    }
    
    // PASO 2: Eliminar TODOS los productos del usuario (múltiples métodos y pasadas)
    logger.log('Eliminando productos...');
    for (let i = 0; i < 20; i++) {
      // Método 1: Con parámetro
      const resultado1 = await dbRun('DELETE FROM productos WHERE userId = ?', [userId]);
      productosEliminados += resultado1.changes || 0;
      totalEliminaciones += resultado1.changes || 0;
      
      // Método 2: Con CAST
      const resultado2 = await dbRun('DELETE FROM productos WHERE CAST(userId AS INTEGER) = ?', [userId]);
      productosEliminados += resultado2.changes || 0;
      totalEliminaciones += resultado2.changes || 0;
      
      // Método 3: Con comparación directa
      const resultado3 = await dbRun(`DELETE FROM productos WHERE userId = ${userId}`);
      productosEliminados += resultado3.changes || 0;
      totalEliminaciones += resultado3.changes || 0;
      
      if (resultado1.changes === 0 && resultado2.changes === 0 && resultado3.changes === 0) break;
      if (i < 5) logger.log(`  Pasada ${i + 1}: ${resultado1.changes + resultado2.changes + resultado3.changes} productos eliminados`);
    }
    
    // PASO 3: REVERTIR STOCK de TODAS las ventas antes de eliminarlas (múltiples métodos de búsqueda)
    logger.log('Revirtiendo stock de ventas...');
    const ventasParaRevertir = await dbAll(`
      SELECT DISTINCT productoId, cantidad 
      FROM ventas 
      WHERE (userId = ? OR CAST(userId AS TEXT) = ? OR CAST(userId AS INTEGER) = ?) 
        AND productoId IS NOT NULL 
        AND productoId != ''
    `, [userId, String(userId), userId]);
    
    logger.log(`  Encontradas ${ventasParaRevertir.length} ventas con productos para revertir stock`);
    
    for (const venta of ventasParaRevertir) {
      if (venta.productoId && venta.cantidad) {
        try {
          const producto = await dbGet('SELECT stock, id FROM productos WHERE id = ?', [venta.productoId]);
          if (producto) {
            const nuevoStock = (producto.stock || 0) + (venta.cantidad || 0);
            await dbRun('UPDATE productos SET stock = ?, updatedAt = datetime(\'now\') WHERE id = ?', [nuevoStock, venta.productoId]);
            stockRevertido++;
            logger.log(`  Stock revertido para producto ${venta.productoId}: +${venta.cantidad} unidades (nuevo stock: ${nuevoStock})`);
          }
        } catch (error) {
          logger.error(`Error al revertir stock para producto ${venta.productoId}:`, error);
        }
      }
    }
    logger.log(`✅ Stock revertido para ${stockRevertido} productos`);
    
    // PASO 4: Eliminar TODAS las ventas del usuario (múltiples métodos y pasadas)
    logger.log('Eliminando ventas...');
    
    // Primero obtener TODAS las ventas que puedan estar asociadas a este userId (con todos los métodos posibles)
    const todasLasVentas = await dbAll(`
      SELECT id, nombreCliente, userId, typeof(userId) as userIdType,
             CAST(userId AS TEXT) as userIdText,
             CAST(userId AS INTEGER) as userIdInt
      FROM ventas 
      WHERE userId = ? 
         OR CAST(userId AS TEXT) = ? 
         OR CAST(userId AS INTEGER) = ?
         OR userId = '${userId}'
         OR userId = "${userId}"
    `, [userId, String(userId), userId]);
    
    logger.log(`  Encontradas ${todasLasVentas.length} ventas para eliminar`);
    if (todasLasVentas.length > 0) {
      logger.log('  Muestra de ventas encontradas:', todasLasVentas.slice(0, 5).map(v => ({
        id: v.id,
        cliente: v.nombreCliente,
        userId: v.userId,
        tipo: v.userIdType,
        userIdText: v.userIdText,
        userIdInt: v.userIdInt
      })));
    }
    
    // Eliminar por ID específico primero (más directo y seguro)
    for (const venta of todasLasVentas) {
      try {
        const resultado = await dbRun('DELETE FROM ventas WHERE id = ?', [venta.id]);
        if (resultado.changes > 0) {
          ventasEliminadas += resultado.changes;
          totalEliminaciones += resultado.changes;
        }
      } catch (error) {
        logger.error(`Error al eliminar venta ${venta.id}:`, error);
      }
    }
    
    // Luego hacer pasadas adicionales con diferentes métodos de búsqueda
    for (let i = 0; i < 30; i++) { // Aumentado a 30 pasadas
      // Método 1: Con parámetro
      const resultado1 = await dbRun('DELETE FROM ventas WHERE userId = ?', [userId]);
      ventasEliminadas += resultado1.changes || 0;
      totalEliminaciones += resultado1.changes || 0;
      
      // Método 2: Con CAST a INTEGER
      const resultado2 = await dbRun('DELETE FROM ventas WHERE CAST(userId AS INTEGER) = ?', [userId]);
      ventasEliminadas += resultado2.changes || 0;
      totalEliminaciones += resultado2.changes || 0;
      
      // Método 3: Con comparación directa
      const resultado3 = await dbRun(`DELETE FROM ventas WHERE userId = ${userId}`);
      ventasEliminadas += resultado3.changes || 0;
      totalEliminaciones += resultado3.changes || 0;
      
      // Método 4: Con CAST a TEXT
      const resultado4 = await dbRun('DELETE FROM ventas WHERE CAST(userId AS TEXT) = ?', [String(userId)]);
      ventasEliminadas += resultado4.changes || 0;
      totalEliminaciones += resultado4.changes || 0;
      
      // Método 5: Con LIKE (por si hay espacios o caracteres extra)
      const resultado5 = await dbRun('DELETE FROM ventas WHERE CAST(userId AS TEXT) LIKE ?', [`%${userId}%`]);
      ventasEliminadas += resultado5.changes || 0;
      totalEliminaciones += resultado5.changes || 0;
      
      if (resultado1.changes === 0 && resultado2.changes === 0 && resultado3.changes === 0 && resultado4.changes === 0 && resultado5.changes === 0) break;
      if (i < 5) logger.log(`  Pasada ${i + 1}: ${resultado1.changes + resultado2.changes + resultado3.changes + resultado4.changes + resultado5.changes} ventas eliminadas`);
    }
    
    // Verificación adicional después de las pasadas
    const ventasRestantesDespues = await dbAll('SELECT COUNT(*) as count FROM ventas WHERE userId = ? OR CAST(userId AS TEXT) = ? OR CAST(userId AS INTEGER) = ?', [userId, String(userId), userId]);
    if ((ventasRestantesDespues[0]?.count || 0) > 0) {
      logger.warn(`⚠️  Aún quedan ${ventasRestantesDespues[0]?.count || 0} ventas después de ${30} pasadas. Intentando eliminación forzada...`);
      // Obtener los IDs de las ventas problemáticas
      const ventasProblematicas = await dbAll('SELECT id, userId, typeof(userId) as userIdType FROM ventas WHERE userId = ? OR CAST(userId AS TEXT) = ? OR CAST(userId AS INTEGER) = ? LIMIT 10', [userId, String(userId), userId]);
      logger.error('Ventas problemáticas:', ventasProblematicas);
      
      // Intentar eliminar por ID específico
      for (const venta of ventasProblematicas) {
        await dbRun('DELETE FROM ventas WHERE id = ?', [venta.id]);
      }
    }
    
    // PASO 5: Verificación exhaustiva - contar lo que queda
    const productosRestantes = await dbAll('SELECT COUNT(*) as count FROM productos WHERE userId = ?', [userId]);
    const ventasRestantes = await dbAll('SELECT COUNT(*) as count FROM ventas WHERE userId = ?', [userId]);
    const productosRestantesCount = productosRestantes[0]?.count || 0;
    const ventasRestantesCount = ventasRestantes[0]?.count || 0;
    
    logger.log(`Datos eliminados: ${productosEliminados} productos, ${ventasEliminadas} ventas`);
    logger.log(`Datos restantes: ${productosRestantesCount} productos, ${ventasRestantesCount} ventas`);
    
    // PASO 6: Si aún quedan datos, eliminación forzada adicional
    if (productosRestantesCount > 0 || ventasRestantesCount > 0) {
      logger.warn('⚠️  Aún quedan datos, forzando eliminación adicional...');
      
      // Intentar con diferentes queries
      await dbRun('DELETE FROM productos WHERE userId = ?', [userId]);
      await dbRun('DELETE FROM ventas WHERE userId = ?', [userId]);
      
      // También intentar con LIKE por si hay algún problema de tipo
      await dbRun('DELETE FROM productos WHERE CAST(userId AS TEXT) = ?', [String(userId)]);
      await dbRun('DELETE FROM ventas WHERE CAST(userId AS TEXT) = ?', [String(userId)]);
      
      // Verificar nuevamente
      const productosFinal = await dbAll('SELECT COUNT(*) as count FROM productos WHERE userId = ?', [userId]);
      const ventasFinal = await dbAll('SELECT COUNT(*) as count FROM ventas WHERE userId = ?', [userId]);
      
      if ((productosFinal[0]?.count || 0) > 0 || (ventasFinal[0]?.count || 0) > 0) {
        logger.error(`❌ ERROR CRÍTICO: Aún quedan ${productosFinal[0]?.count || 0} productos y ${ventasFinal[0]?.count || 0} ventas`);
        // Obtener los IDs de los registros que no se pueden eliminar para debugging
        const productosProblematicos = await dbAll('SELECT id, nombre, userId FROM productos WHERE userId = ? LIMIT 5', [userId]);
        const ventasProblematicas = await dbAll('SELECT id, nombreCliente, userId FROM ventas WHERE userId = ? LIMIT 5', [userId]);
        logger.error('Productos problemáticos:', productosProblematicos);
        logger.error('Ventas problemáticas:', ventasProblematicas);
      }
    }
    
    // PASO 7: Eliminar el usuario
    logger.log('Eliminando usuario...');
    const result = await dbRun('DELETE FROM usuarios WHERE id = ?', [userId]);
    
    if (result.changes === 0) {
      await dbRun('PRAGMA foreign_keys = ON');
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }
    
    // PASO 8: LIMPIEZA FINAL EXHAUSTIVA DEL ID - Asegurar que quede completamente vacío
    logger.log('=== LIMPIEZA FINAL EXHAUSTIVA DEL ID ===');
    
    // Obtener TODAS las ventas que puedan estar asociadas a este ID (con todos los métodos posibles)
    const ventasResidualesParaRevertir = await dbAll(`
      SELECT id, productoId, cantidad, userId 
      FROM ventas 
      WHERE userId = ? OR CAST(userId AS TEXT) = ? OR CAST(userId AS INTEGER) = ?
    `, [userId, String(userId), userId]);
    
    // Revertir stock de cualquier venta residual
    for (const venta of ventasResidualesParaRevertir) {
      if (venta.productoId && venta.cantidad) {
        try {
          const producto = await dbGet('SELECT stock, id FROM productos WHERE id = ?', [venta.productoId]);
          if (producto) {
            const nuevoStock = (producto.stock || 0) + (venta.cantidad || 0);
            await dbRun('UPDATE productos SET stock = ?, updatedAt = datetime(\'now\') WHERE id = ?', [nuevoStock, venta.productoId]);
            logger.log(`  Stock revertido (limpieza final) para producto ${venta.productoId}: +${venta.cantidad} unidades`);
          }
        } catch (error) {
          logger.error(`Error al revertir stock final:`, error);
        }
      }
    }
    
    // Eliminar TODOS los datos residuales con TODOS los métodos posibles
    logger.log('Eliminando datos residuales finales...');
    for (let i = 0; i < 50; i++) { // 50 pasadas para asegurar eliminación completa
      // Productos - todos los métodos
      await dbRun('DELETE FROM productos WHERE userId = ?', [userId]);
      await dbRun('DELETE FROM productos WHERE CAST(userId AS INTEGER) = ?', [userId]);
      await dbRun(`DELETE FROM productos WHERE userId = ${userId}`);
      await dbRun('DELETE FROM productos WHERE CAST(userId AS TEXT) = ?', [String(userId)]);
      
      // Ventas - todos los métodos
      const resultadoV1 = await dbRun('DELETE FROM ventas WHERE userId = ?', [userId]);
      const resultadoV2 = await dbRun('DELETE FROM ventas WHERE CAST(userId AS INTEGER) = ?', [userId]);
      const resultadoV3 = await dbRun(`DELETE FROM ventas WHERE userId = ${userId}`);
      const resultadoV4 = await dbRun('DELETE FROM ventas WHERE CAST(userId AS TEXT) = ?', [String(userId)]);
      
      if (resultadoV1.changes === 0 && resultadoV2.changes === 0 && resultadoV3.changes === 0 && resultadoV4.changes === 0) break;
    }
    
    // Eliminar por ID específico si aún quedan ventas
    const ventasResiduales = await dbAll(`
      SELECT id FROM ventas 
      WHERE userId = ? OR CAST(userId AS TEXT) = ? OR CAST(userId AS INTEGER) = ?
    `, [userId, String(userId), userId]);
    
    for (const venta of ventasResiduales) {
      await dbRun('DELETE FROM ventas WHERE id = ?', [venta.id]);
    }
    
    // PASO 9: Rehabilitar foreign keys
    await dbRun('PRAGMA foreign_keys = ON');
    
    // PASO 10: VERIFICACIÓN FINAL ABSOLUTA - El ID debe estar completamente vacío
    logger.log('=== VERIFICACIÓN FINAL ABSOLUTA ===');
    const verificacionFinalProductos = await dbAll(`
      SELECT COUNT(*) as count FROM productos 
      WHERE userId = ? OR CAST(userId AS TEXT) = ? OR CAST(userId AS INTEGER) = ?
    `, [userId, String(userId), userId]);
    
    const verificacionFinalVentas = await dbAll(`
      SELECT COUNT(*) as count FROM ventas 
      WHERE userId = ? OR CAST(userId AS TEXT) = ? OR CAST(userId AS INTEGER) = ?
    `, [userId, String(userId), userId]);
    
    const productosFinales = verificacionFinalProductos[0]?.count || 0;
    const ventasFinalesCount = verificacionFinalVentas[0]?.count || 0;
    
    if (productosFinales > 0 || ventasFinalesCount > 0) {
      logger.error(`❌ ERROR CRÍTICO: El ID ${userId} AÚN tiene datos después de limpieza exhaustiva:`);
      logger.error(`  - Productos: ${productosFinales}`);
      logger.error(`  - Ventas: ${ventasFinalesCount}`);
      
      // Último intento desesperado - eliminar todo lo relacionado con este ID
      await dbRun('PRAGMA foreign_keys = OFF');
      await dbRun(`DELETE FROM productos WHERE userId = ${userId} OR CAST(userId AS TEXT) = '${userId}' OR CAST(userId AS INTEGER) = ${userId}`);
      await dbRun(`DELETE FROM ventas WHERE userId = ${userId} OR CAST(userId AS TEXT) = '${userId}' OR CAST(userId AS INTEGER) = ${userId}`);
      await dbRun('PRAGMA foreign_keys = ON');
    } else {
      logger.log(`✅ ID ${userId} COMPLETAMENTE LIMPIO - Sin productos, sin ventas, sin datos residuales`);
    }
    
    realizarBackup();
    
    // NO reorganizar IDs después de eliminar para evitar transferencia de datos
    // Los IDs pueden quedar con gaps, pero esto es preferible a transferir datos entre usuarios
    
    res.json({ 
      message: 'Usuario y TODOS sus datos asociados eliminados correctamente',
      datosEliminados: {
        productos: productosEliminados,
        ventas: ventasEliminadas,
        stockRevertido: stockRevertido,
        total: totalEliminaciones
      },
      verificacion: {
        productosRestantes: productosFinales,
        ventasRestantes: ventasFinalesCount,
        estado: productosFinales === 0 && ventasFinalesCount === 0 ? 'COMPLETO - ID TOTALMENTE LIMPIO' : 'INCOMPLETO'
      }
    });
  } catch (error) {
    logger.error('Error al eliminar usuario:', error);
    // Proporcionar un mensaje de error más específico
    if (error.message && error.message.includes('FOREIGN KEY')) {
      return res.status(400).json({ 
        error: 'No se puede eliminar el usuario porque tiene datos asociados. Por favor, elimina primero los productos y ventas asociados.' 
      });
    }
    const errorMessage = error.message || 'Error interno del servidor';
    res.status(500).json({ error: errorMessage });
  }
});

// GET /api/admin/verificar-ventas-usuario/:id - Verificar todas las ventas de un usuario específico (solo admin)
app.get('/api/admin/verificar-ventas-usuario/:id', authenticateToken, requireAdmin, [
  param('id').trim().notEmpty().withMessage('ID requerido'),
], validate, async (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    if (isNaN(userId)) {
      return res.status(400).json({ error: 'ID inválido' });
    }
    
    // Obtener todas las ventas con diferentes métodos de búsqueda
    const ventasMetodo1 = await dbAll('SELECT * FROM ventas WHERE userId = ?', [userId]);
    const ventasMetodo2 = await dbAll('SELECT * FROM ventas WHERE CAST(userId AS INTEGER) = ?', [userId]);
    const ventasMetodo3 = await dbAll('SELECT * FROM ventas WHERE CAST(userId AS TEXT) = ?', [String(userId)]);
    const ventasMetodo4 = await dbAll(`SELECT * FROM ventas WHERE userId = ${userId}`);
    
    // Obtener todas las ventas para comparar
    const todasLasVentas = await dbAll('SELECT id, nombreCliente, userId, typeof(userId) as userIdType FROM ventas');
    
    res.json({
      userId: userId,
      ventas: {
        metodo1_userId_igual: {
          query: 'SELECT * FROM ventas WHERE userId = ?',
          cantidad: ventasMetodo1.length,
          datos: ventasMetodo1.slice(0, 10)
        },
        metodo2_cast_integer: {
          query: 'SELECT * FROM ventas WHERE CAST(userId AS INTEGER) = ?',
          cantidad: ventasMetodo2.length,
          datos: ventasMetodo2.slice(0, 10)
        },
        metodo3_cast_text: {
          query: 'SELECT * FROM ventas WHERE CAST(userId AS TEXT) = ?',
          cantidad: ventasMetodo3.length,
          datos: ventasMetodo3.slice(0, 10)
        },
        metodo4_directo: {
          query: `SELECT * FROM ventas WHERE userId = ${userId}`,
          cantidad: ventasMetodo4.length,
          datos: ventasMetodo4.slice(0, 10)
        }
      },
      todasLasVentas: {
        total: todasLasVentas.length,
        muestra: todasLasVentas.slice(0, 20).map(v => ({
          id: v.id,
          cliente: v.nombreCliente,
          userId: v.userId,
          tipo: v.userIdType,
          coincide: v.userId == userId || v.userId === userId
        }))
      }
    });
  } catch (error) {
    logger.error('Error en verificación:', error);
    res.status(500).json({ 
      error: 'Error interno del servidor',
      detalles: error.message 
    });
  }
});

// ========== ENDPOINT DE DIAGNÓSTICO DE ID (SOLO ADMIN) ==========

// GET /api/admin/diagnostico-id/:id - Diagnosticar qué datos tiene un ID específico
app.get('/api/admin/diagnostico-id/:id', authenticateToken, requireAdmin, [
  param('id').trim().notEmpty().withMessage('ID requerido'),
], validate, async (req, res) => {
  try {
    const idADiagnosticar = parseInt(req.params.id);
    if (isNaN(idADiagnosticar)) {
      return res.status(400).json({ error: 'ID inválido' });
    }
    
    // Verificar si el usuario existe
    const usuario = await dbGet('SELECT * FROM usuarios WHERE id = ?', [idADiagnosticar]);
    
    // Obtener todos los productos con este userId (con información de tipo)
    const productos = await dbAll(`
      SELECT id, nombre, userId, typeof(userId) as userIdType, 
             CAST(userId AS TEXT) as userIdText,
             CAST(userId AS INTEGER) as userIdInt
      FROM productos 
      WHERE userId = ? OR CAST(userId AS TEXT) = ? OR CAST(userId AS INTEGER) = ?
      LIMIT 50
    `, [idADiagnosticar, String(idADiagnosticar), idADiagnosticar]);
    
    // Obtener todas las ventas con este userId
    const ventas = await dbAll(`
      SELECT id, nombreCliente, userId, typeof(userId) as userIdType,
             CAST(userId AS TEXT) as userIdText,
             CAST(userId AS INTEGER) as userIdInt
      FROM ventas 
      WHERE userId = ? OR CAST(userId AS TEXT) = ? OR CAST(userId AS INTEGER) = ?
      LIMIT 50
    `, [idADiagnosticar, String(idADiagnosticar), idADiagnosticar]);
    
    // Contar totales
    const totalProductos = await dbAll('SELECT COUNT(*) as count FROM productos WHERE userId = ?', [idADiagnosticar]);
    const totalVentas = await dbAll('SELECT COUNT(*) as count FROM ventas WHERE userId = ?', [idADiagnosticar]);
    
    res.json({
      id: idADiagnosticar,
      usuario: usuario || null,
      datos: {
        productos: {
          total: totalProductos[0]?.count || 0,
          muestra: productos,
          tipos: productos.map(p => p.userIdType).filter((v, i, a) => a.indexOf(v) === i)
        },
        ventas: {
          total: totalVentas[0]?.count || 0,
          muestra: ventas,
          tipos: ventas.map(v => v.userIdType).filter((v, i, a) => a.indexOf(v) === i)
        }
      },
      recomendacion: (totalProductos[0]?.count || 0) > 0 || (totalVentas[0]?.count || 0) > 0 
        ? 'Este ID tiene datos asociados. Use el endpoint de limpieza para eliminarlos.'
        : 'Este ID está limpio.'
    });
  } catch (error) {
    logger.error('Error en diagnóstico:', error);
    res.status(500).json({ 
      error: 'Error interno del servidor',
      detalles: error.message 
    });
  }
});

// ========== ENDPOINT DE LIMPIEZA DE DATOS HUÉRFANOS (SOLO ADMIN) ==========

// POST /api/admin/limpiar-datos-huérfanos - Limpiar datos huérfanos y residuales
app.post('/api/admin/limpiar-datos-huérfanos', authenticateToken, requireAdmin, async (req, res) => {
  try {
    logger.log('Iniciando limpieza de datos huérfanos...');
    
    // Obtener todos los IDs de usuarios existentes
    const usuarios = await dbAll('SELECT id FROM usuarios');
    const idsUsuariosExistentes = usuarios.map(u => u.id);
    
    // Contar datos huérfanos antes de eliminar
    let productosHuérfanos = 0;
    let ventasHuérfanas = 0;
    
    if (idsUsuariosExistentes.length > 0) {
      const placeholders = idsUsuariosExistentes.map(() => '?').join(',');
      
      // Contar productos huérfanos
      const productosCount = await dbAll(
        `SELECT COUNT(*) as count FROM productos WHERE userId NOT IN (${placeholders})`,
        idsUsuariosExistentes
      );
      productosHuérfanos = productosCount[0]?.count || 0;
      
      // Contar ventas huérfanas
      const ventasCount = await dbAll(
        `SELECT COUNT(*) as count FROM ventas WHERE userId NOT IN (${placeholders})`,
        idsUsuariosExistentes
      );
      ventasHuérfanas = ventasCount[0]?.count || 0;
      
      // Eliminar productos huérfanos
      const resultadoProductos = await dbRun(
        `DELETE FROM productos WHERE userId NOT IN (${placeholders})`,
        idsUsuariosExistentes
      );
      
      // Eliminar ventas huérfanas
      const resultadoVentas = await dbRun(
        `DELETE FROM ventas WHERE userId NOT IN (${placeholders})`,
        idsUsuariosExistentes
      );
      
      logger.log(`Datos huérfanos eliminados: ${resultadoProductos.changes} productos, ${resultadoVentas.changes} ventas`);
    } else {
      // Si no hay usuarios, eliminar todos los datos
      const resultadoProductos = await dbRun('DELETE FROM productos');
      const resultadoVentas = await dbRun('DELETE FROM ventas');
      productosHuérfanos = resultadoProductos.changes || 0;
      ventasHuérfanas = resultadoVentas.changes || 0;
    }
    
    // Limpiar datos de IDs que no tienen usuario (por si hay datos residuales)
    // Obtener todos los userIds únicos de productos y ventas
    const userIdsProductos = await dbAll('SELECT DISTINCT userId FROM productos');
    const userIdsVentas = await dbAll('SELECT DISTINCT userId FROM ventas');
    const todosLosUserIds = new Set([
      ...userIdsProductos.map(p => p.userId),
      ...userIdsVentas.map(v => v.userId)
    ]);
    
    let datosResidualesEliminados = 0;
    for (const userId of todosLosUserIds) {
      if (!idsUsuariosExistentes.includes(userId)) {
        const resultadoP = await dbRun('DELETE FROM productos WHERE userId = ?', [userId]);
        const resultadoV = await dbRun('DELETE FROM ventas WHERE userId = ?', [userId]);
        datosResidualesEliminados += (resultadoP.changes || 0) + (resultadoV.changes || 0);
      }
    }
    
    // Verificación final: obtener estadísticas después de la limpieza
    const productosFinales = await dbAll('SELECT COUNT(*) as count FROM productos');
    const ventasFinales = await dbAll('SELECT COUNT(*) as count FROM ventas');
    const usuariosFinales = await dbAll('SELECT COUNT(*) as count FROM usuarios');
    
    realizarBackup();
    
    res.json({
      message: 'Limpieza de datos huérfanos completada',
      datosEliminados: {
        productosHuérfanos: productosHuérfanos,
        ventasHuérfanas: ventasHuérfanas,
        datosResiduales: datosResidualesEliminados,
        total: productosHuérfanos + ventasHuérfanas + datosResidualesEliminados
      },
      estadoFinal: {
        usuarios: usuariosFinales[0]?.count || 0,
        productos: productosFinales[0]?.count || 0,
        ventas: ventasFinales[0]?.count || 0
      }
    });
  } catch (error) {
    logger.error('Error al limpiar datos huérfanos:', error);
    res.status(500).json({ 
      error: 'Error interno del servidor',
      detalles: error.message 
    });
  }
});

// ========== ENDPOINT DE VERIFICACIÓN Y REPARACIÓN DE BASE DE DATOS (SOLO ADMIN) ==========

// POST /api/admin/verificar-reparar-db - Verificar y reparar la estructura de la base de datos
app.post('/api/admin/verificar-reparar-db', authenticateToken, requireAdmin, async (req, res) => {
  try {
    logger.log('Iniciando verificación y reparación de base de datos...');
    
    // Verificar foreign keys
    const fkStatus = await dbGet('PRAGMA foreign_keys');
    const foreignKeysHabilitadas = fkStatus?.foreign_keys === 1;
    
    // Verificar estructura de tablas
    const productosInfo = await dbAll("PRAGMA table_info(productos)");
    const ventasInfo = await dbAll("PRAGMA table_info(ventas)");
    const usuariosInfo = await dbAll("PRAGMA table_info(usuarios)");
    
    // Verificar foreign keys en las tablas
    const fkProductos = await dbAll("PRAGMA foreign_key_list(productos)");
    const fkVentas = await dbAll("PRAGMA foreign_key_list(ventas)");
    
    const reporte = {
      foreignKeysHabilitadas,
      estructura: {
        usuarios: usuariosInfo.length,
        productos: productosInfo.length,
        ventas: ventasInfo.length
      },
      foreignKeysConfiguradas: {
        productos: fkProductos.length > 0,
        ventas: fkVentas.length > 0
      },
      acciones: []
    };
    
    // Habilitar foreign keys si no están habilitadas
    if (!foreignKeysHabilitadas) {
      await dbRun('PRAGMA foreign_keys = ON');
      reporte.acciones.push('Foreign keys habilitadas');
    }
    
    // Verificar y limpiar datos huérfanos
    const usuarios = await dbAll('SELECT id FROM usuarios');
    const idsUsuarios = usuarios.map(u => u.id);
    
    if (idsUsuarios.length > 0) {
      const placeholders = idsUsuarios.map(() => '?').join(',');
      const productosHuérfanos = await dbRun(
        `DELETE FROM productos WHERE userId NOT IN (${placeholders})`,
        idsUsuarios
      );
      const ventasHuérfanas = await dbRun(
        `DELETE FROM ventas WHERE userId NOT IN (${placeholders})`,
        idsUsuarios
      );
      
      if (productosHuérfanos.changes > 0 || ventasHuérfanas.changes > 0) {
        reporte.acciones.push(
          `Eliminados ${productosHuérfanos.changes} productos huérfanos y ${ventasHuérfanas.changes} ventas huérfanas`
        );
      }
    }
    
    // Verificar que no haya datos con userId que no existe
    const productosConUserIdInvalido = await dbAll(`
      SELECT DISTINCT p.userId 
      FROM productos p 
      LEFT JOIN usuarios u ON p.userId = u.id 
      WHERE u.id IS NULL
    `);
    
    const ventasConUserIdInvalido = await dbAll(`
      SELECT DISTINCT v.userId 
      FROM ventas v 
      LEFT JOIN usuarios u ON v.userId = u.id 
      WHERE u.id IS NULL
    `);
    
    if (productosConUserIdInvalido.length > 0 || ventasConUserIdInvalido.length > 0) {
      for (const item of productosConUserIdInvalido) {
        await dbRun('DELETE FROM productos WHERE userId = ?', [item.userId]);
      }
      for (const item of ventasConUserIdInvalido) {
        await dbRun('DELETE FROM ventas WHERE userId = ?', [item.userId]);
      }
      reporte.acciones.push(
        `Eliminados datos con userId inválido: ${productosConUserIdInvalido.length} productos, ${ventasConUserIdInvalido.length} ventas`
      );
    }
    
    realizarBackup();
    
    res.json({
      message: 'Verificación y reparación completada',
      reporte,
      estado: 'OK'
    });
  } catch (error) {
    logger.error('Error al verificar/reparar base de datos:', error);
    res.status(500).json({ 
      error: 'Error interno del servidor',
      detalles: error.message 
    });
  }
});

// ========== ENDPOINT DE LIMPIEZA DE ID ESPECÍFICO (SOLO ADMIN) ==========

// POST /api/admin/limpiar-id/:id - Limpiar completamente un ID específico
app.post('/api/admin/limpiar-id/:id', authenticateToken, requireAdmin, [
  param('id').trim().notEmpty().withMessage('ID requerido'),
], validate, async (req, res) => {
  try {
    const idALimpiar = parseInt(req.params.id);
    if (isNaN(idALimpiar)) {
      return res.status(400).json({ error: 'ID inválido' });
    }
    
    logger.log(`\n=== LIMPIANDO ID ${idALimpiar} ===`);
    
    // Deshabilitar foreign keys temporalmente
    await dbRun('PRAGMA foreign_keys = OFF');
    
    // Contar datos antes de eliminar
    const productosAntes = await dbAll('SELECT COUNT(*) as count FROM productos WHERE userId = ?', [idALimpiar]);
    const ventasAntes = await dbAll('SELECT COUNT(*) as count FROM ventas WHERE userId = ?', [idALimpiar]);
    
    let productosEliminados = 0;
    let ventasEliminadas = 0;
    
    // Eliminar productos (múltiples pasadas)
    for (let i = 0; i < 20; i++) {
      const resultado = await dbRun('DELETE FROM productos WHERE userId = ?', [idALimpiar]);
      productosEliminados += resultado.changes || 0;
      if (resultado.changes === 0) break;
    }
    
    // Eliminar ventas (múltiples pasadas)
    for (let i = 0; i < 20; i++) {
      const resultado = await dbRun('DELETE FROM ventas WHERE userId = ?', [idALimpiar]);
      ventasEliminadas += resultado.changes || 0;
      if (resultado.changes === 0) break;
    }
    
    // Métodos alternativos
    await dbRun('DELETE FROM productos WHERE CAST(userId AS TEXT) = ?', [String(idALimpiar)]);
    await dbRun('DELETE FROM ventas WHERE CAST(userId AS TEXT) = ?', [String(idALimpiar)]);
    
    // Rehabilitar foreign keys
    await dbRun('PRAGMA foreign_keys = ON');
    
    // Verificación final
    const productosDespues = await dbAll('SELECT COUNT(*) as count FROM productos WHERE userId = ?', [idALimpiar]);
    const ventasDespues = await dbAll('SELECT COUNT(*) as count FROM ventas WHERE userId = ?', [idALimpiar]);
    
    const productosRestantes = productosDespues[0]?.count || 0;
    const ventasRestantes = ventasDespues[0]?.count || 0;
    
    realizarBackup();
    
    res.json({
      message: `Limpieza del ID ${idALimpiar} completada`,
      datosEncontrados: {
        productos: productosAntes[0]?.count || 0,
        ventas: ventasAntes[0]?.count || 0
      },
      datosEliminados: {
        productos: productosEliminados,
        ventas: ventasEliminadas,
        total: productosEliminados + ventasEliminadas
      },
      estadoFinal: {
        productosRestantes,
        ventasRestantes,
        limpio: productosRestantes === 0 && ventasRestantes === 0
      }
    });
  } catch (error) {
    logger.error('Error al limpiar ID:', error);
    res.status(500).json({ 
      error: 'Error interno del servidor',
      detalles: error.message 
    });
  }
});

// ========== ENDPOINT DE BACKUP MANUAL (PROTEGIDO) ==========

// POST /api/backup - Crear backup manual
app.post('/api/backup', authenticateToken, (req, res) => {
  try {
    realizarBackup();
    res.json({ message: 'Backup creado correctamente' });
  } catch (error) {
    logger.error('Error al crear backup:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// GET /api/backups - Listar backups disponibles
app.get('/api/backups', authenticateToken, (req, res) => {
  try {
    const backups = fs.readdirSync(BACKUP_DIR)
      .filter(file => file.startsWith('backup_') && file.endsWith('.db'))
      .map(file => {
        const stats = fs.statSync(path.join(BACKUP_DIR, file));
        return {
          nombre: file,
          fecha: stats.mtime,
          tamaño: stats.size
        };
      })
      .sort((a, b) => b.fecha - a.fecha);
    
    res.json(backups);
  } catch (error) {
    logger.error('Error al listar backups:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// ========== MANEJO DE ERRORES ==========

// Middleware de manejo de errores
app.use((err, req, res, next) => {
  logger.error('Error no manejado:', err);
  res.status(500).json({ error: 'Error interno del servidor' });
});

// GET /api/rutas - Listar todas las rutas disponibles (solo para debugging)
app.get('/api/rutas', (req, res) => {
  const rutas = [
    'POST /api/auth/login',
    'POST /api/auth/verify',
    'GET /api/productos',
    'GET /api/productos/:id',
    'POST /api/productos',
    'PUT /api/productos/:id',
    'DELETE /api/productos/:id',
    'GET /api/ventas',
    'GET /api/ventas/:id',
    'POST /api/ventas',
    'PUT /api/ventas/:id',
    'DELETE /api/ventas/:id',
    'GET /api/usuarios (admin)',
    'GET /api/usuarios/:id (admin)',
    'POST /api/usuarios (admin)',
    'PUT /api/usuarios/:id (admin)',
    'DELETE /api/usuarios/:id (admin)',
    'GET /api/admin/verificar-ventas-usuario/:id (admin)',
    'GET /api/admin/diagnostico-id/:id (admin)',
    'POST /api/admin/limpiar-datos-huérfanos (admin)',
    'POST /api/admin/limpiar-id/:id (admin)',
    'POST /api/backup',
    'GET /api/backups'
  ];
  res.json({ rutas, total: rutas.length });
});

// Ruta no encontrada para API
app.use('/api/*', (req, res) => {
  logger.log(`⚠️  Ruta no encontrada: ${req.method} ${req.path}`);
  res.status(404).json({ 
    error: 'Ruta no encontrada',
    metodo: req.method,
    ruta: req.path,
    sugerencia: 'Visita GET /api/rutas para ver todas las rutas disponibles'
  });
});

// Servir archivos estáticos del frontend (solo si existe dist/)
const DIST_PATH = path.join(__dirname, '..', 'dist');
if (fs.existsSync(DIST_PATH)) {
  // Servir archivos estáticos
  app.use(express.static(DIST_PATH, {
    maxAge: IS_DEVELOPMENT ? 0 : '1y', // Cache en producción
    etag: true,
  }));
  
  // Para SPA: todas las rutas que no sean /api/* deben servir index.html
  app.get('*', (req, res) => {
    // Si es una ruta de API, ya fue manejada arriba
    if (req.path.startsWith('/api/')) {
      return;
    }
    // Para todas las demás rutas, servir index.html (SPA routing)
    res.sendFile(path.join(DIST_PATH, 'index.html'), (err) => {
      if (err) {
        logger.error('Error al servir index.html:', err);
        res.status(500).send('Error al cargar la aplicación');
      }
    });
  });
  
  logger.log('📁 Serviendo archivos estáticos desde dist/');
}

// ========== INICIAR SERVIDOR ==========

// Solo iniciar el servidor si no estamos en modo serverless (Netlify Functions)
if (process.env.NETLIFY !== 'true' && !process.env.AWS_LAMBDA_FUNCTION_NAME) {
  app.listen(PORT, '0.0.0.0', () => {
    logger.log(`🚀 Servidor corriendo en puerto ${PORT}`);
    logger.log(`🌐 Escuchando en: http://0.0.0.0:${PORT}`);
    logger.log('🔒 Seguridad habilitada: JWT, Helmet, Rate Limiting, Validación, XSS Protection');
    logger.log(`📦 Compresión: ${IS_DEVELOPMENT ? 'Deshabilitada (desarrollo)' : 'Habilitada (producción)'}`);
    
    // Información sobre archivos estáticos
    if (fs.existsSync(DIST_PATH)) {
      logger.log('📁 Serviendo frontend desde: dist/');
    } else {
      logger.log('⚠️  Frontend no encontrado en dist/. Solo API disponible.');
    }
    
    // Información específica de Railway
    if (isRailway) {
      logger.log('🚂 Railway: Servidor listo para recibir conexiones');
      logger.log(`📊 Railway URL: ${process.env.RAILWAY_PUBLIC_DOMAIN || 'Configurar en Railway'}`);
    }
  }).on('error', (err) => {
    logger.error('❌ Error al iniciar el servidor:', err);
    if (err.code === 'EADDRINUSE') {
      logger.error(`⚠️  Puerto ${PORT} ya está en uso`);
    }
    process.exit(1);
  });
}

// Exportar app para uso en Netlify Functions
export default app;

// Manejo de cierre graceful
process.on('SIGINT', () => {
  db.close((err) => {
    if (err) {
      logger.error('Error al cerrar la base de datos:', err);
    } else {
      logger.log('Base de datos cerrada correctamente');
    }
    process.exit(0);
  });
});
