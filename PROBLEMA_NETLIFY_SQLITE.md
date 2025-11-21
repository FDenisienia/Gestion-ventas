# ⚠️ PROBLEMA CRÍTICO: SQLite en Netlify Functions

## El Problema

**Netlify Functions NO puede mantener una base de datos SQLite persistente.**

### ¿Por qué?

1. **Cada invocación es aislada**: Cada vez que se llama a una función, se crea un nuevo entorno
2. **`/tmp` se limpia**: El directorio `/tmp` se borra entre invocaciones
3. **Sin estado persistente**: No hay forma de mantener archivos entre requests

### Síntomas

- ✅ Funciona en tu PC (desarrollo local)
- ❌ No funciona desde otra IP/PC
- ❌ La base de datos se reinicia cada vez
- ❌ Los usuarios no persisten
- ❌ Los datos se pierden

## Soluciones

### Opción 1: Desplegar Backend Separado (RECOMENDADO)

Desplegar el backend en un servicio que mantenga estado:

#### Railway (Recomendado - Gratis)
1. Ve a [railway.app](https://railway.app)
2. Conecta tu repositorio
3. Selecciona el directorio `server/`
4. Railway detecta automáticamente Node.js
5. Agrega variables de entorno:
   - `PORT=3001`
   - `NODE_ENV=production`
   - `FRONTEND_URL=https://tu-app.netlify.app`
   - `NETLIFY_URL=https://tu-app.netlify.app`
6. Railway te dará una URL como: `https://tu-app.up.railway.app`
7. En Netlify, configura `VITE_API_URL=https://tu-app.up.railway.app`

#### Render (Alternativa - Gratis)
1. Ve a [render.com](https://render.com)
2. Crea un nuevo "Web Service"
3. Conecta tu repositorio
4. Configura:
   - **Build Command**: `cd server && npm install`
   - **Start Command**: `cd server && npm start`
   - **Environment**: Node
5. Agrega las mismas variables de entorno
6. Render te dará una URL como: `https://tu-app.onrender.com`
7. En Netlify, configura `VITE_API_URL=https://tu-app.onrender.com`

### Opción 2: Usar Base de Datos Externa

Reemplazar SQLite con una base de datos en la nube:

#### Supabase (PostgreSQL - Gratis)
- Base de datos PostgreSQL gratuita
- Perfecto para reemplazar SQLite
- Necesita migrar el código

#### PlanetScale (MySQL - Gratis)
- Base de datos MySQL gratuita
- Escalable y fácil de usar

### Opción 3: Usar Netlify + Base de Datos Externa

Mantener Netlify Functions pero con base de datos externa:
- Supabase
- Firebase
- MongoDB Atlas

## Configuración Actual

El código ya intenta usar `/tmp` en Netlify Functions:

```javascript
const isNetlifyFunction = process.env.NETLIFY === 'true' || process.env.AWS_LAMBDA_FUNCTION_NAME;
const DB_PATH = isNetlifyFunction 
  ? path.join('/tmp', 'database.db')
  : path.join(__dirname, 'database.db');
```

**Pero esto NO funciona** porque `/tmp` se limpia entre invocaciones.

## Solución Rápida (Temporal)

Si necesitas que funcione AHORA mientras preparas la solución definitiva:

1. **Despliega el backend en Railway o Render** (15 minutos)
2. **Configura `VITE_API_URL` en Netlify** (2 minutos)
3. **Haz un nuevo deploy** (5 minutos)

## Pasos Detallados para Railway

### 1. Crear cuenta en Railway
- Ve a [railway.app](https://railway.app)
- Inicia sesión con GitHub

### 2. Crear nuevo proyecto
- Click en "New Project"
- Selecciona "Deploy from GitHub repo"
- Selecciona tu repositorio

### 3. Configurar servicio
- Railway detectará automáticamente Node.js
- Si no, configura manualmente:
  - **Root Directory**: `server`
  - **Build Command**: `npm install`
  - **Start Command**: `npm start`

### 4. Variables de entorno
Agrega estas variables en Railway:
```
PORT=3001
NODE_ENV=production
FRONTEND_URL=https://tu-app.netlify.app
NETLIFY_URL=https://tu-app.netlify.app
JWT_SECRET=tu-secreto-super-seguro-cambiar-en-produccion
```

### 5. Obtener URL del backend
- Railway te dará una URL como: `https://tu-app.up.railway.app`
- Copia esta URL

### 6. Configurar Netlify
En Netlify, agrega variable de entorno:
- **Key**: `VITE_API_URL`
- **Value**: `https://tu-app.up.railway.app` (sin `/api` al final)

### 7. Nuevo deploy
- Haz commit y push de los cambios
- Netlify hará deploy automáticamente

## Verificación

Después del deploy:
1. Abre la app en Netlify
2. Intenta hacer login
3. Verifica que los datos persistan
4. Prueba desde otra PC/IP

## Nota Importante

**SQLite NO es compatible con serverless functions**. Necesitas:
- Un backend con estado persistente (Railway, Render, etc.)
- O una base de datos externa (Supabase, PlanetScale, etc.)

La solución más rápida es desplegar el backend en Railway (gratis y fácil).

