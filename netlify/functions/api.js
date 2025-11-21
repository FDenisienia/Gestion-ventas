// Netlify Function para servir el backend
// Adapta el servidor Express para funcionar en Netlify Functions

import app from '../../server/index.js';

// Función para parsear el body
function parseBody(body, contentType) {
  if (!body) return {};
  
  if (contentType?.includes('application/json')) {
    try {
      return JSON.parse(body);
    } catch (e) {
      return {};
    }
  }
  
  if (contentType?.includes('application/x-www-form-urlencoded')) {
    const params = new URLSearchParams(body);
    const result = {};
    for (const [key, value] of params) {
      result[key] = value;
    }
    return result;
  }
  
  return body;
}

export const handler = async (event, context) => {
  // Construir URL completa
  const host = event.headers.host || event.headers.Host || 'localhost';
  const protocol = event.headers['x-forwarded-proto'] || 'https';
  
  // IMPORTANTE: Netlify redirige /api/* a /.netlify/functions/api/:splat
  // El :splat contiene la parte después de /api
  // event.path será /.netlify/functions/api/usuarios (ejemplo)
  // event.rawPath también puede contener el path original
  let path = event.rawPath || event.path;
  
  // Si el path incluye /.netlify/functions/api, reconstruir la ruta /api/...
  if (path.includes('/.netlify/functions/api')) {
    // Extraer la parte después de /.netlify/functions/api
    // Ejemplo: /.netlify/functions/api/usuarios -> /api/usuarios
    const afterFunction = path.replace('/.netlify/functions/api', '');
    path = '/api' + (afterFunction || '');
  }
  
  // Si el path no empieza con /api, agregarlo
  // Esto maneja casos donde el path viene directamente como /usuarios
  if (!path.startsWith('/api')) {
    path = '/api' + (path.startsWith('/') ? path : '/' + path);
  }
  
  // Asegurar que empiece con /
  if (!path.startsWith('/')) {
    path = '/' + path;
  }
  
  // Log para debugging (solo en desarrollo)
  if (process.env.NETLIFY_DEV) {
    console.log(`[Netlify Function] Path original: ${event.path}, Path procesado: ${path}`);
  }
  
  // Parsear query string
  const query = event.queryStringParameters || {};
  
  // Construir query string para la URL
  const queryString = Object.keys(query).length > 0
    ? '?' + new URLSearchParams(query).toString()
    : '';
  
  // Parsear body
  let body = event.body || '';
  if (event.isBase64Encoded) {
    body = Buffer.from(body, 'base64').toString('utf-8');
  }
  
  const contentType = event.headers['content-type'] || event.headers['Content-Type'] || '';
  const parsedBody = parseBody(body, contentType);
  
  // Crear objeto request compatible con Express
  const req = {
    method: event.httpMethod,
    url: path + queryString,
    path: path,
    originalUrl: path + queryString,
    headers: event.headers,
    query: query,
    body: parsedBody,
    ip: event.requestContext?.http?.sourceIp || 
        event.headers['x-forwarded-for']?.split(',')[0] || 
        event.headers['x-real-ip'] || 
        'unknown',
    protocol: protocol,
    hostname: host,
    get: (header) => {
      const lowerHeader = header.toLowerCase();
      return event.headers[lowerHeader] || event.headers[header] || null;
    }
  };
  
  // Crear objeto response compatible con Express
  let statusCode = 200;
  const headers = {};
  let responseBody = '';
  let responseSent = false;
  
  const res = {
    status: (code) => {
      statusCode = code;
      return res;
    },
    json: (data) => {
      if (!responseSent) {
        responseBody = JSON.stringify(data);
        headers['Content-Type'] = 'application/json';
        responseSent = true;
      }
      return res;
    },
    send: (data) => {
      if (!responseSent) {
        if (typeof data === 'object') {
          responseBody = JSON.stringify(data);
          headers['Content-Type'] = 'application/json';
        } else {
          responseBody = String(data);
        }
        responseSent = true;
      }
      return res;
    },
    setHeader: (key, value) => {
      headers[key] = value;
      return res;
    },
    header: (key, value) => {
      headers[key] = value;
      return res;
    },
    end: (data) => {
      if (!responseSent) {
        if (data) {
          responseBody = typeof data === 'string' ? data : JSON.stringify(data);
        }
        responseSent = true;
      }
      return res;
    },
    cookie: () => res,
    clearCookie: () => res
  };
  
  // Función next para middlewares
  const next = (err) => {
    if (err) {
      statusCode = 500;
      responseBody = JSON.stringify({ error: 'Error interno del servidor' });
      headers['Content-Type'] = 'application/json';
      responseSent = true;
    }
  };
  
  try {
    // Llamar a Express app
    await new Promise((resolve, reject) => {
      // Timeout de seguridad (Netlify Functions tienen límite de 26s en Pro, 10s en Free)
      const timeout = setTimeout(() => {
        reject(new Error('Function timeout'));
      }, 25000);
      
      app(req, res, (err) => {
        clearTimeout(timeout);
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    });
    
    // Si no se envió respuesta, enviar una por defecto
    if (!responseSent) {
      statusCode = 404;
      responseBody = JSON.stringify({ error: 'Ruta no encontrada' });
      headers['Content-Type'] = 'application/json';
    }
    
    return {
      statusCode,
      headers: {
        ...headers,
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS'
      },
      body: responseBody
    };
  } catch (error) {
    console.error('Error en Netlify Function:', error);
    return {
      statusCode: 500,
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({ 
        error: 'Error interno del servidor',
        message: process.env.NODE_ENV !== 'production' ? error.message : undefined
      })
    };
  }
};
