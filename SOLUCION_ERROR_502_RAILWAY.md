# 🔧 Solución: Error 502 en Railway

## 🔍 ¿Qué es un Error 502?

Un error **502 Bad Gateway** significa que:
- El servidor no está respondiendo
- El servidor se crasheó
- El servidor está tardando demasiado en responder
- Hay un problema con la conexión

## ✅ Pasos para Diagnosticar

### Paso 1: Verificar Logs en Railway

1. Ve a Railway → Tu Servicio → **Logs**
2. Revisa los últimos logs
3. Busca errores o mensajes de crash

**¿Qué buscar?**
- ❌ Errores en rojo
- ❌ Mensajes de "crash" o "exit"
- ❌ Errores de base de datos
- ❌ Errores de dependencias

### Paso 2: Verificar Estado del Servicio

1. Ve a Railway → Tu Servicio
2. Verifica el estado:
   - ✅ **Active** o **Running** = Servidor funcionando
   - ❌ **Crashed** o **Stopped** = Servidor caído
   - ⚠️ **Deploying** = Aún desplegando

### Paso 3: Verificar Variables de Entorno

1. Ve a Railway → Settings → Variables
2. Verifica que tengas:
   ```
   NODE_ENV=production
   JWT_SECRET=tu-secreto-aqui
   FRONTEND_URL=https://gestion-ventas1.netlify.app
   NETLIFY_URL=https://gestion-ventas1.netlify.app
   ```

### Paso 4: Reiniciar el Servicio

1. Ve a Railway → Deployments
2. Haz clic en los 3 puntos (⋯) del deploy más reciente
3. Selecciona **"Redeploy"**
4. Espera a que termine (1-2 minutos)

## 🔍 Errores Comunes y Soluciones

### Error: "Cannot find module"
**Causa**: Dependencias no instaladas
**Solución**: Verifica que Build Command sea `npm install`

### Error: "Database error" o "SQLite error"
**Causa**: Problema con la base de datos
**Solución**: El código crea la BD automáticamente, pero verifica los logs

### Error: "Port already in use"
**Causa**: Puerto en conflicto
**Solución**: No configures `PORT` manualmente, Railway lo asigna

### Error: "Memory limit exceeded"
**Causa**: Servidor usando demasiada memoria
**Solución**: Railway tiene límites, pero debería ser suficiente

### Error: "Timeout"
**Causa**: Servidor tardando demasiado en iniciar
**Solución**: Verifica que no haya procesos bloqueantes

## 🛠️ Solución Rápida

### Opción 1: Redeploy

1. Railway → Deployments
2. Redeploy del último deploy
3. Espera y verifica logs

### Opción 2: Eliminar y Crear Nuevo Servicio

Si el redeploy no funciona:

1. **Elimina el servicio actual**
2. **Crea un nuevo servicio** desde GitHub
3. **Configura TODO antes del primer deploy:**
   - Root Directory: `server`
   - Build Command: `npm install`
   - Start Command: `npm start`
   - Variables de entorno
4. **Espera a que termine el deploy**

## 📋 Checklist de Verificación

Antes de reportar el problema, verifica:

- [ ] Logs en Railway (¿hay errores?)
- [ ] Estado del servicio (¿está corriendo?)
- [ ] Variables de entorno configuradas
- [ ] Build Command configurado como `npm install`
- [ ] Start Command configurado como `npm start`
- [ ] Root Directory configurado como `server`
- [ ] Código actualizado en GitHub (¿hiciste push?)

## 🆘 Si Nada Funciona

1. **Copia los logs completos** de Railway
2. **Indica qué error específico** aparece
3. **Verifica** que el código esté en GitHub y actualizado

## 💡 Nota Importante

Un error 502 puede ser temporal. A veces Railway necesita unos minutos para:
- Iniciar el servidor
- Conectar a la base de datos
- Cargar todas las dependencias

**Espera 2-3 minutos** después de un deploy antes de probar.

