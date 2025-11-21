// Adaptador para Netlify Functions
// Exporta el app de Express para usar en Netlify Functions

import app from './index.js';

// Exportar el handler para Netlify Functions
export const handler = async (event, context) => {
  // Convertir evento de Netlify a request de Express
  const url = new URL(event.rawUrl || `https://${event.headers.host}${event.path}`);
  
  const req = {
    method: event.httpMethod,
    url: url.pathname + url.search,
    path: event.path.replace('/.netlify/functions/api', ''),
    headers: event.headers,
    query: event.queryStringParameters || {},
    body: event.body ? (event.isBase64Encoded ? Buffer.from(event.body, 'base64').toString() : event.body) : '',
    ip: event.requestContext?.http?.sourceIp || event.headers['x-forwarded-for'] || 'unknown'
  };

  // Crear respuesta
  let statusCode = 200;
  const headers = {};
  let body = '';

  const res = {
    status: (code) => {
      statusCode = code;
      return res;
    },
    json: (data) => {
      body = JSON.stringify(data);
      headers['Content-Type'] = 'application/json';
      return res;
    },
    send: (data) => {
      body = typeof data === 'string' ? data : JSON.stringify(data);
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
      if (data) body = data;
      return res;
    }
  };

  try {
    // Parsear body si es JSON
    if (req.body && req.headers['content-type']?.includes('application/json')) {
      try {
        req.body = JSON.parse(req.body);
      } catch (e) {
        // No es JSON válido, dejar como está
      }
    }

    // Llamar a Express app
    await new Promise((resolve, reject) => {
      app(req, res, (err) => {
        if (err) reject(err);
        else resolve();
      });
    });

    return {
      statusCode,
      headers,
      body
    };
  } catch (error) {
    console.error('Error en Netlify Function:', error);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Error interno del servidor' })
    };
  }
};

