# ⚠️ PROBLEMA CRÍTICO: SQLite en Netlify Functions

**Netlify Functions NO puede mantener una base de datos SQLite persistente.**

Cada invocación de función es aislada y la base de datos se reinicia. **Necesitas desplegar el backend en un servicio separado** (Railway, Render, etc.) o usar una base de datos externa.

📖 **Ver `PROBLEMA_NETLIFY_SQLITE.md` para más detalles y soluciones paso a paso.**

---

# 🔧 Configurar VITE_API_URL en Netlify - Guía Paso a Paso

## 📋 Pasos para Configurar la Variable de Entorno

### Paso 1: Acceder a la Configuración de Netlify

1. Ve a [app.netlify.com](https://app.netlify.com)
2. Inicia sesión con tu cuenta
3. Selecciona tu sitio: **gestion-ventas1**

### Paso 2: Ir a Site Settings

1. En el menú superior, haz clic en **"Site settings"** (o "Configuración del sitio")
2. En el menú lateral izquierdo, busca y haz clic en **"Environment variables"** (Variables de entorno)

### Paso 3: Agregar la Variable VITE_API_URL

1. Haz clic en el botón **"Add a variable"** (Agregar una variable) o **"Add variable"**

2. Completa los campos:
   - **Key** (Clave): `VITE_API_URL`
   - **Value** (Valor): `https://tu-backend-url.com/api`
   
   ⚠️ **IMPORTANTE**: Reemplaza `https://tu-backend-url.com/api` con la URL real de tu backend desplegado.

3. Haz clic en **"Save"** (Guardar)

### Paso 4: Verificar que el Backend Esté Desplegado

**Antes de configurar Netlify, necesitas tener el backend desplegado en:**
- Railway: https://railway.app
- Render: https://render.com
- Heroku: https://heroku.com
- O cualquier otro servicio

**La URL del backend debe ser algo como:**
- `https://tu-app.railway.app/api`
- `https://tu-app.onrender.com/api`
- `https://tu-app.herokuapp.com/api`

### Paso 5: Redesplegar el Sitio

Después de agregar la variable:

1. Ve a la pestaña **"Deploys"** (Despliegues)
2. Haz clic en **"Trigger deploy"** (Activar despliegue)
3. Selecciona **"Clear cache and deploy site"** (Limpiar caché y desplegar sitio)
4. Espera a que termine el despliegue (puede tardar 1-3 minutos)

## ✅ Verificación

Después del despliegue:

1. Abre tu sitio en Netlify: https://gestion-ventas1.netlify.app
2. Abre la consola del navegador (F12)
3. Deberías ver: `🔧 API Base URL: https://tu-backend-url.com/api`
4. El error debería desaparecer

## 🎯 Ejemplo Completo

Si tu backend está en Railway y la URL es `https://gestion-backend.railway.app`:

**En Netlify, configura:**
```
Key: VITE_API_URL
Value: https://gestion-backend.railway.app/api
```

**Nota:** Asegúrate de que la URL termine en `/api`

## 🐛 Solución de Problemas

### El error sigue apareciendo después de configurar

1. **Verifica que la variable esté guardada:**
   - Ve a Site settings → Environment variables
   - Debe aparecer `VITE_API_URL` en la lista

2. **Verifica que hayas hecho redeploy:**
   - Ve a Deploys
   - Debe haber un deploy reciente después de agregar la variable

3. **Verifica la URL del backend:**
   - Abre la URL del backend directamente en el navegador
   - Debe responder (puede mostrar un error de CORS, pero debe responder)

4. **Limpia el caché del navegador:**
   - Presiona Ctrl+Shift+R (o Cmd+Shift+R en Mac)
   - O abre en modo incógnito

### No tengo el backend desplegado

**Necesitas desplegar el backend primero.** Opciones:

#### Opción 1: Railway (Recomendado - Gratis)
1. Ve a https://railway.app
2. Crea cuenta con GitHub
3. "New Project" → "Deploy from GitHub repo"
4. Selecciona tu repositorio
5. Railway detectará automáticamente el backend
6. Configura variables de entorno:
   - `FRONTEND_URL=https://gestion-ventas1.netlify.app`
   - `NODE_ENV=production`
7. Copia la URL pública (ej: `https://xxx.railway.app`)

#### Opción 2: Render (Gratis)
1. Ve a https://render.com
2. "New" → "Web Service"
3. Conecta tu repositorio
4. Configuración:
   - Build Command: `cd server && npm install`
   - Start Command: `cd server && npm start`
5. Agrega variables de entorno
6. Copia la URL pública

## 📝 Checklist

Antes de configurar Netlify, verifica:

- [ ] Backend desplegado y accesible públicamente
- [ ] Tienes la URL completa del backend (ej: `https://xxx.railway.app`)
- [ ] El backend tiene configurado CORS para permitir Netlify
- [ ] Tienes acceso a la configuración de Netlify

Después de configurar:

- [ ] Variable `VITE_API_URL` agregada en Netlify
- [ ] Valor correcto (termina en `/api`)
- [ ] Redeploy realizado con "Clear cache"
- [ ] Verificado en consola del navegador

## 🆘 ¿Necesitas Ayuda?

Si después de seguir estos pasos aún tienes problemas:

1. Verifica los logs de Netlify en el deploy
2. Verifica los logs del backend
3. Revisa la consola del navegador para más detalles del error

