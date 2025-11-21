# 🔍 Diagnóstico Rápido: Error 502 en Railway

## ⚡ Verificación Inmediata

### 1. Ver Logs en Railway (CRÍTICO)

1. Ve a Railway → Tu Servicio → **Logs**
2. Revisa los últimos 50-100 líneas
3. **Busca:**
   - ❌ Errores en rojo
   - ❌ "Error al conectar con la base de datos"
   - ❌ "Error al iniciar el servidor"
   - ❌ "process.exit"
   - ❌ "Cannot find module"
   - ✅ "🚀 Servidor corriendo en puerto"

### 2. Verificar Estado del Servicio

En Railway → Tu Servicio:
- **¿Qué dice el estado?**
  - ✅ "Active" o "Running" = Servidor funcionando
  - ❌ "Crashed" o "Stopped" = Servidor caído
  - ⚠️ "Deploying" = Aún desplegando

### 3. Verificar Último Deploy

1. Ve a Railway → Deployments
2. **¿El último deploy fue exitoso?**
   - ✅ Verde = Exitoso
   - ❌ Rojo = Falló
   - ⚠️ Amarillo = En progreso

## 🛠️ Soluciones Rápidas

### Solución 1: Redeploy

1. Railway → Deployments
2. Haz clic en los 3 puntos (⋯) del último deploy
3. Selecciona **"Redeploy"**
4. Espera 2-3 minutos
5. Prueba de nuevo: `https://gestion-ventas-production.up.railway.app/api/rutas`

### Solución 2: Verificar Configuración

1. Railway → Settings → Service
2. Verifica:
   - Root Directory: `server` ✅
   - Build Command: `npm install` ✅
   - Start Command: `npm start` ✅

### Solución 3: Verificar Variables

1. Railway → Settings → Variables
2. Verifica que tengas:
   ```
   NODE_ENV=production
   JWT_SECRET=algo-aqui
   FRONTEND_URL=https://gestion-ventas1.netlify.app
   NETLIFY_URL=https://gestion-ventas1.netlify.app
   ```

## 🔍 Errores Comunes

### "Error al conectar con la base de datos"
**Solución**: El código ahora continúa aunque falle la BD. Verifica los logs.

### "Cannot find module"
**Solución**: Verifica que Build Command sea `npm install`

### "Port already in use"
**Solución**: No configures `PORT` manualmente

### "Memory limit exceeded"
**Solución**: Railway tiene límites, pero debería ser suficiente

## 📋 Checklist

Antes de reportar, verifica:

- [ ] Logs en Railway (¿qué errores hay?)
- [ ] Estado del servicio (¿está corriendo?)
- [ ] Último deploy (¿fue exitoso?)
- [ ] Configuración correcta (Root Directory, Build, Start)
- [ ] Variables de entorno configuradas
- [ ] Código actualizado en GitHub

## 🆘 Si Sigue Fallando

**Copia los logs completos** de Railway y compártelos. Los logs dirán exactamente qué está pasando.

## 💡 Nota

Un error 502 puede ser temporal. A veces Railway necesita:
- 1-2 minutos para iniciar el servidor
- Tiempo para conectar a la base de datos
- Tiempo para cargar dependencias

**Espera 2-3 minutos** después de un deploy antes de probar.

