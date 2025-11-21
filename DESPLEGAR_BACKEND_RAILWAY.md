# 🚀 Desplegar Backend en Railway - Guía Completa

Esta guía te permitirá desplegar el backend en Railway para que **cualquier PC pueda acceder** y los usuarios persistan correctamente.

## ⚡ Solución Rápida (15 minutos)

### Paso 1: Crear Cuenta en Railway

1. Ve a [railway.app](https://railway.app)
2. Haz clic en **"Start a New Project"** o **"Login"**
3. Inicia sesión con **GitHub** (recomendado) o con email

### Paso 2: Crear Nuevo Proyecto

1. Una vez dentro, haz clic en **"New Project"**
2. Selecciona **"Deploy from GitHub repo"**
3. Autoriza Railway a acceder a tu repositorio si es necesario
4. Selecciona tu repositorio: **Gestion-Ventas-App**

### Paso 3: Configurar el Servicio

Railway detectará automáticamente que es un proyecto Node.js. Si no:

1. Haz clic en el servicio que se creó
2. Ve a la pestaña **"Settings"**
3. Configura:
   - **Root Directory**: `server`
   - **Build Command**: `npm install` (o déjalo vacío, Railway lo detecta)
   - **Start Command**: `npm start`

### Paso 4: Agregar Variables de Entorno

1. En el servicio, ve a la pestaña **"Variables"**
2. Haz clic en **"New Variable"** y agrega estas variables:

```
PORT=3001
NODE_ENV=production
FRONTEND_URL=https://tu-app.netlify.app
NETLIFY_URL=https://tu-app.netlify.app
JWT_SECRET=tu-secreto-super-seguro-cambiar-en-produccion-12345
```

**⚠️ IMPORTANTE:**
- Reemplaza `https://tu-app.netlify.app` con la URL real de tu app en Netlify
- Cambia `JWT_SECRET` por un secreto seguro (puede ser cualquier string largo y aleatorio)

### Paso 5: Obtener la URL del Backend

1. En Railway, ve a la pestaña **"Settings"** del servicio
2. Busca la sección **"Networking"** o **"Domains"**
3. Railway generará automáticamente una URL como:
   - `https://tu-app-production.up.railway.app`
   - O puedes crear un dominio personalizado

4. **Copia esta URL** (sin `/api` al final)

### Paso 6: Configurar Netlify

1. Ve a [app.netlify.com](https://app.netlify.com)
2. Selecciona tu sitio
3. Ve a **"Site settings"** → **"Environment variables"**
4. Agrega o actualiza:
   - **Key**: `VITE_API_URL`
   - **Value**: `https://tu-app-production.up.railway.app` (la URL de Railway, sin `/api`)

### Paso 7: Redesplegar

1. En Netlify, ve a **"Deploys"**
2. Haz clic en **"Trigger deploy"** → **"Clear cache and deploy site"**
3. Espera a que termine (1-3 minutos)

### Paso 8: Verificar

1. Abre tu app en Netlify
2. Intenta hacer login
3. Crea un usuario nuevo
4. Abre la app desde otra PC/IP
5. Verifica que puedas hacer login con el usuario creado

## ✅ Verificación de Funcionamiento

### Desde tu PC:
- ✅ Login funciona
- ✅ Puedes crear usuarios
- ✅ Los datos persisten

### Desde otra PC/IP:
- ✅ Login funciona
- ✅ Puedes ver los usuarios creados
- ✅ Los datos son los mismos

## 🔧 Solución de Problemas

### Error: "Cannot connect to backend"
- Verifica que `VITE_API_URL` esté configurada en Netlify
- Verifica que la URL de Railway sea correcta (sin `/api`)
- Verifica que Railway esté corriendo (debe mostrar "Active" o "Running")

### Error: "CORS blocked"
- Verifica que `FRONTEND_URL` y `NETLIFY_URL` en Railway sean correctas
- Deben ser las URLs exactas de tu app en Netlify

### Error: "Database not found"
- Railway crea la base de datos automáticamente
- Si hay problemas, elimina el servicio y créalo de nuevo

### Los usuarios no persisten
- Verifica que Railway esté usando el directorio `server/`
- Verifica que la base de datos se esté creando (revisa los logs en Railway)

## 📊 Monitoreo

En Railway puedes:
- Ver logs en tiempo real
- Ver métricas de uso
- Ver el estado del servicio

## 💰 Costos

**Railway tiene un plan gratuito** que incluye:
- $5 de crédito gratis por mes
- Suficiente para una app pequeña/mediana
- Si necesitas más, puedes actualizar

## 🎯 Resultado Final

Después de seguir estos pasos:
- ✅ Cualquier PC puede acceder
- ✅ Los usuarios persisten
- ✅ Los datos se guardan correctamente
- ✅ Funciona desde cualquier IP/lugar

## 📝 Notas Importantes

1. **La base de datos SQLite se guarda en Railway**, no en Netlify
2. **Railway mantiene el estado** entre requests
3. **Cualquier cambio en el código** requiere hacer commit y push, Railway se actualiza automáticamente
4. **Los backups** se guardan en Railway (puedes descargarlos desde los logs)

## 🆘 ¿Necesitas Ayuda?

Si tienes problemas:
1. Revisa los logs en Railway (pestaña "Deployments" → "View Logs")
2. Revisa los logs en Netlify (pestaña "Functions" → "Logs")
3. Verifica que todas las variables de entorno estén correctas

