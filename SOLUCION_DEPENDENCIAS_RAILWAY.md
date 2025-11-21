# 🔧 Solución: Error "Cannot find package 'express'" en Railway

## 🔍 Problema

El error `ERR_MODULE_NOT_FOUND: Cannot find package 'express'` significa que **las dependencias no están instaladas** en Railway.

## ✅ Solución Rápida

### Opción 1: Configurar Build Command (Recomendado)

1. Ve a Railway → Tu Servicio → **Settings** → **Service**
2. Configura:
   - **Root Directory**: `server`
   - **Build Command**: `npm install` ⚠️ **CRÍTICO**
   - **Start Command**: `npm start`
3. Guarda los cambios
4. Railway hará un nuevo deploy automáticamente

### Opción 2: Usar railway.json (Alternativa)

He creado un archivo `railway.json` en la raíz del proyecto. Si Railway lo detecta, usará esta configuración automáticamente.

## 🔍 Verificación

Después de configurar el Build Command, verifica en los logs:

1. Deberías ver: `npm install` ejecutándose
2. Deberías ver: `Installing dependencies...`
3. Deberías ver: `added X packages`
4. Luego: `npm start` ejecutándose
5. Finalmente: `🚀 Servidor corriendo en puerto...`

## ⚠️ Errores Comunes

### Error: "Cannot find package 'express'"
**Causa**: Build Command no configurado o incorrecto
**Solución**: Configura `Build Command: npm install`

### Error: "Cannot find module"
**Causa**: Root Directory incorrecto
**Solución**: Configura `Root Directory: server`

### Error: "npm: command not found"
**Causa**: Node.js no está instalado
**Solución**: Railway debería detectarlo automáticamente, pero verifica que Node Version sea 18+

## 📝 Configuración Correcta en Railway

### Settings → Service

```
Root Directory: server
Build Command: npm install
Start Command: npm start
```

### Settings → Variables

```
NODE_ENV=production
JWT_SECRET=tu-secreto-super-seguro-12345
FRONTEND_URL=https://tu-app.netlify.app
NETLIFY_URL=https://tu-app.netlify.app
```

## 🚀 Después de Configurar

1. Railway ejecutará automáticamente:
   - `cd server` (por el Root Directory)
   - `npm install` (Build Command)
   - `npm start` (Start Command)

2. Espera a que termine el deploy (1-3 minutos)

3. Verifica los logs:
   - Debe mostrar "Installing dependencies"
   - Debe mostrar "added X packages"
   - Debe mostrar "🚀 Servidor corriendo"

## ✅ Checklist

- [ ] Root Directory configurado como `server`
- [ ] Build Command configurado como `npm install`
- [ ] Start Command configurado como `npm start`
- [ ] Variables de entorno configuradas
- [ ] Deploy completado sin errores
- [ ] Logs muestran que el servidor está corriendo

## 🆘 Si Sigue Fallando

1. **Elimina el servicio** en Railway
2. **Crea un nuevo servicio** desde GitHub
3. **Configura TODO antes** de que Railway haga el primer deploy:
   - Root Directory: `server`
   - Build Command: `npm install`
   - Start Command: `npm start`
   - Variables de entorno
4. **Espera** a que termine el deploy completo

