# 🚀 Configuración para Netlify - SOLUCIÓN AL ERROR CORS

## ⚠️ PROBLEMA ACTUAL

Tu app en Netlify está intentando conectarse a `http://localhost:3001`, lo cual **NO FUNCIONA** porque:
- `localhost` solo existe en tu computadora
- Netlify necesita la URL pública de tu backend

## ✅ SOLUCIÓN PASO A PASO

### Paso 1: Desplegar el Backend

El backend debe estar desplegado en un servicio público. Opciones:

#### Opción A: Railway (Recomendado - Gratis)
1. Ve a [railway.app](https://railway.app)
2. Crea una cuenta
3. "New Project" → "Deploy from GitHub repo"
4. Selecciona tu repositorio
5. Railway detectará automáticamente el backend
6. Configura la variable de entorno: `PORT=3001`
7. Copia la URL pública (ej: `https://tu-app.railway.app`)

#### Opción B: Render (Gratis)
1. Ve a [render.com](https://render.com)
2. "New" → "Web Service"
3. Conecta tu repositorio
4. Configuración:
   - Build Command: `cd server && npm install`
   - Start Command: `cd server && npm start`
   - Environment: `Node`
5. Copia la URL pública

#### Opción C: Heroku, DigitalOcean, VPS, etc.

### Paso 2: Configurar CORS en el Backend

Una vez desplegado el backend, configura las variables de entorno:

**En Railway/Render/Heroku, agrega:**
```
FRONTEND_URL=https://gestion-ventas1.netlify.app
NETLIFY_URL=https://gestion-ventas1.netlify.app
NODE_ENV=production
```

**O si tienes múltiples dominios:**
```
FRONTEND_URL=https://gestion-ventas1.netlify.app,http://localhost:5173
```

### Paso 3: Configurar Netlify

1. Ve a tu proyecto en Netlify
2. Ve a: **Site settings** → **Environment variables**
3. Agrega la variable:
   ```
   Key: VITE_API_URL
   Value: https://tu-backend.railway.app/api
   ```
   (Reemplaza con la URL real de tu backend)

4. **IMPORTANTE**: Después de agregar la variable:
   - Ve a **Deploys**
   - Haz clic en **Trigger deploy** → **Clear cache and deploy site**

### Paso 4: Verificar

1. Espera a que Netlify termine el deploy
2. Abre tu app en Netlify
3. Abre la consola del navegador (F12)
4. Deberías ver: `🔧 API Base URL: https://tu-backend.railway.app/api`
5. El error de CORS debería desaparecer

## 🔍 Verificación Rápida

### ¿El backend está desplegado?
- ✅ Sí: Tienes una URL pública (ej: `https://xxx.railway.app`)
- ❌ No: Despliega primero (ver Paso 1)

### ¿Está configurada VITE_API_URL en Netlify?
- ✅ Sí: Ve a Site settings → Environment variables
- ❌ No: Agrega la variable (ver Paso 3)

### ¿Está configurado CORS en el backend?
- ✅ Sí: Tienes `FRONTEND_URL` configurado en el backend
- ❌ No: Configura las variables de entorno del backend (ver Paso 2)

## 📝 Variables de Entorno Necesarias

### En Netlify:
```
VITE_API_URL=https://tu-backend-url.com/api
```

### En el Backend (Railway/Render/etc):
```
FRONTEND_URL=https://gestion-ventas1.netlify.app
NETLIFY_URL=https://gestion-ventas1.netlify.app
NODE_ENV=production
PORT=3001
JWT_SECRET=tu-secreto-super-seguro
```

## 🐛 Solución de Problemas

### Error: "Access to fetch blocked by CORS"
**Causa**: El backend no permite tu dominio de Netlify
**Solución**: 
1. Verifica que `FRONTEND_URL` en el backend incluya `https://gestion-ventas1.netlify.app`
2. Reinicia el backend después de cambiar las variables

### Error: "Failed to load resource: net::ERR_FAILED"
**Causa**: La URL del backend es incorrecta o no está accesible
**Solución**:
1. Verifica que `VITE_API_URL` en Netlify sea correcta
2. Prueba la URL del backend directamente en el navegador
3. Asegúrate de que termine en `/api`

### La app sigue usando localhost
**Causa**: Netlify no tiene la variable `VITE_API_URL` o el cache
**Solución**:
1. Verifica que la variable esté configurada en Netlify
2. Haz un "Clear cache and deploy" en Netlify
3. Espera a que termine el deploy completo

## 📞 ¿Necesitas Ayuda?

Si después de seguir estos pasos aún tienes problemas:
1. Verifica que el backend esté corriendo (abre la URL en el navegador)
2. Revisa los logs del backend para ver errores
3. Revisa los logs de Netlify en el deploy

