# Guía Completa de Despliegue en Railway

## 🚨 Problema: "No me deja hacer el deploy"

Sigue estos pasos en orden:

## Paso 1: Verificar que el código esté en GitHub

1. Ve a tu repositorio en GitHub: `https://github.com/FDenisienia/Gestion-clientes`
2. Verifica que la carpeta `backend/` esté presente
3. Verifica que `backend/package.json` tenga el script `"start": "node server.js"`

## Paso 2: Crear un Nuevo Proyecto en Railway

1. Ve a [railway.app](https://railway.app)
2. Inicia sesión con GitHub
3. Click en **"New Project"**
4. Selecciona **"Deploy from GitHub repo"**
5. Selecciona tu repositorio: `FDenisienia/Gestion-clientes`
6. Railway creará un nuevo proyecto

## Paso 3: Configurar el Servicio (MUY IMPORTANTE)

### Opción A: Si Railway creó un servicio automáticamente

1. Click en el servicio que Railway creó
2. Ve a **"Settings"** (Configuración)
3. Busca **"Root Directory"**
4. Cambia a: `backend`
5. Guarda los cambios

### Opción B: Crear un servicio manualmente

1. En tu proyecto de Railway, click en **"+ New"**
2. Selecciona **"Empty Service"**
3. Click en **"Settings"**
4. En **"Source"**, selecciona tu repositorio de GitHub
5. En **"Root Directory"**, escribe: `backend`
6. Guarda los cambios

## Paso 4: Configurar Variables de Entorno

1. En el servicio, ve a la pestaña **"Variables"**
2. Click en **"+ New Variable"**
3. Agrega estas variables una por una:

```
NODE_ENV = production
PORT = 3001
FRONTEND_URL = https://tu-sitio.netlify.app
```

⚠️ **Nota**: Reemplaza `https://tu-sitio.netlify.app` con la URL real de tu frontend (la agregarás después de desplegar en Netlify)

## Paso 5: Configurar el Start Command

1. Ve a **"Settings"** del servicio
2. Busca **"Start Command"**
3. Debe ser uno de estos:
   - `npm start` (recomendado)
   - `node server.js`
4. Si está vacío, escribe: `npm start`
5. Guarda los cambios

## Paso 6: Forzar el Deploy

1. Ve a la pestaña **"Deployments"**
2. Si hay un deployment fallido, click en los **"..."** (tres puntos)
3. Selecciona **"Redeploy"**
4. O haz un pequeño cambio y push a GitHub para forzar un nuevo deploy

## Paso 7: Verificar los Logs

1. Ve a la pestaña **"Logs"**
2. Espera a que el build termine
3. Busca errores en rojo
4. Los errores comunes son:
   - `Cannot find module`: Falta instalar dependencias
   - `Port already in use`: Conflicto de puerto
   - `EADDRINUSE`: Puerto ocupado

## 🔍 Verificación de Configuración

Asegúrate de que:

- ✅ Root Directory = `backend`
- ✅ Start Command = `npm start` o `node server.js`
- ✅ Variables de entorno configuradas
- ✅ El código está en GitHub
- ✅ `backend/package.json` tiene el script `start`

## 🐛 Errores Comunes y Soluciones

### Error: "Cannot find module 'express'"

**Solución:**
- Verifica que `backend/package.json` tenga todas las dependencias
- Railway debería ejecutar `npm install` automáticamente
- Si no, agrega en Settings → Build Command: `npm install`

### Error: "Port 3001 is already in use"

**Solución:**
- Railway asigna un puerto automáticamente
- Asegúrate de que `server.js` use `process.env.PORT || 3001`
- No uses un puerto fijo

### Error: "Root Directory not found"

**Solución:**
- Verifica que la carpeta `backend/` exista en GitHub
- Verifica que el Root Directory esté configurado como `backend` (sin barra al final)

### Error: "Deploy did not succeed"

**Solución:**
1. Revisa los logs completos
2. Verifica que todos los archivos estén en GitHub
3. Asegúrate de que `backend/server.js` exista
4. Verifica que `backend/package.json` tenga el script `start`

## 📋 Checklist Final

Antes de intentar el deploy, verifica:

- [ ] Código subido a GitHub
- [ ] Carpeta `backend/` existe en GitHub
- [ ] `backend/package.json` tiene script `start`
- [ ] `backend/server.js` existe
- [ ] Root Directory configurado como `backend`
- [ ] Start Command configurado como `npm start`
- [ ] Variables de entorno configuradas
- [ ] Logs revisados para errores específicos

## 🆘 Si Nada Funciona

1. **Elimina el servicio y créalo de nuevo:**
   - En Railway, elimina el servicio actual
   - Crea un nuevo "Empty Service"
   - Configura desde cero siguiendo los pasos

2. **Verifica localmente:**
   ```bash
   cd backend
   npm install
   npm start
   ```
   Si funciona localmente, debería funcionar en Railway

3. **Contacta soporte:**
   - Revisa los logs completos
   - Toma capturas de pantalla
   - Abre un issue en GitHub con los detalles

## ✅ Configuración Correcta

Tu configuración debería verse así:

**Settings:**
- Root Directory: `backend`
- Start Command: `npm start`
- Build Command: (vacío o `npm install`)

**Variables:**
- `NODE_ENV=production`
- `PORT=3001`
- `FRONTEND_URL=https://tu-sitio.netlify.app`

**Archivos en GitHub:**
- `backend/server.js` ✅
- `backend/package.json` ✅
- `backend/routes/` ✅
- `backend/middleware/` ✅

