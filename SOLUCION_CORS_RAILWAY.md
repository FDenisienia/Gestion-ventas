# 🔧 Solución: Error de CORS en Railway

## 🔍 Problema

Error en la consola del navegador:
```
Access to fetch at 'https://gestion-ventas-production.up.railway.app/api/auth/login' 
from origin 'https://gestion-ventas1.netlify.app' has been blocked by CORS policy: 
Response to preflight request doesn't pass access control check: 
No 'Access-Control-Allow-Origin' header is present on the requested resource.
```

## ✅ Solución: Configurar Variables de Entorno en Railway

El backend necesita saber qué orígenes permitir. Configura estas variables en Railway:

### Paso 1: Ir a Railway

1. Ve a [railway.app](https://railway.app)
2. Selecciona tu proyecto
3. Selecciona tu servicio

### Paso 2: Configurar Variables

1. Ve a **Settings** → **Variables**
2. Agrega o edita estas variables:

**Variable 1: FRONTEND_URL**
- **Key**: `FRONTEND_URL`
- **Value**: `https://gestion-ventas1.netlify.app`
- Haz clic en **Save**

**Variable 2: NETLIFY_URL**
- **Key**: `NETLIFY_URL`
- **Value**: `https://gestion-ventas1.netlify.app`
- Haz clic en **Save**

### Paso 3: Reiniciar el Servicio

Después de agregar las variables:
1. Railway reiniciará automáticamente el servicio
2. O puedes ir a **Deployments** y hacer clic en **Redeploy**

## 🔍 Verificación

Después de configurar las variables, en los logs de Railway deberías ver:

```
CORS: Verificando origin: https://gestion-ventas1.netlify.app
CORS: Match con regex: /^https:\/\/.*\.netlify\.app$/
CORS: Origin permitido: https://gestion-ventas1.netlify.app
```

## 📋 Variables Necesarias en Railway

Asegúrate de tener estas variables configuradas:

```
NODE_ENV=production
JWT_SECRET=tu-secreto-super-seguro-12345
FRONTEND_URL=https://gestion-ventas1.netlify.app
NETLIFY_URL=https://gestion-ventas1.netlify.app
```

**⚠️ IMPORTANTE:**
- Reemplaza `https://gestion-ventas1.netlify.app` con tu URL real de Netlify
- Las URLs deben ser exactas (con `https://` y sin barra final)

## 🎯 Cómo Funciona

El código de CORS permite orígenes de estas formas:

1. **Variables de entorno**: `FRONTEND_URL` y `NETLIFY_URL`
2. **Regex automático**: Cualquier dominio que termine en `.netlify.app` o `.netlify.com`
3. **Desarrollo local**: `localhost:5173` y `localhost:3000`

## 🆘 Si Sigue Fallando

1. **Verifica los logs de Railway** para ver qué origin está intentando acceder
2. **Verifica que las variables estén correctas** (sin espacios, con https://)
3. **Reinicia el servicio** en Railway
4. **Limpia la caché del navegador** y recarga la página

## ✅ Resultado Esperado

Después de configurar:
- ✅ No más errores de CORS en la consola
- ✅ El login funciona correctamente
- ✅ Las peticiones al API funcionan desde Netlify

