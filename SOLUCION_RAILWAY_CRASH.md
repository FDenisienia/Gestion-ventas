# 🔧 Solución: App se Crashea en Railway

## 🔍 Diagnóstico Rápido

### 1. Ver los Logs en Railway

1. Ve a tu proyecto en [railway.app](https://railway.app)
2. Selecciona tu servicio
3. Ve a la pestaña **"Deployments"** o **"Logs"**
4. Revisa los últimos logs para ver el error exacto

### 2. Errores Comunes y Soluciones

#### ❌ Error: "Cannot find module"
**Causa**: Dependencias no instaladas o directorio incorrecto

**Solución**:
1. En Railway → Settings → Service
2. Verifica que **Root Directory** sea: `server`
3. Verifica que **Build Command** sea: `npm install` (o déjalo vacío)
4. Verifica que **Start Command** sea: `npm start`

#### ❌ Error: "Port already in use" o "EADDRINUSE"
**Causa**: Puerto incorrecto o conflicto

**Solución**:
- ✅ **NO configures** `PORT=3001` en Railway
- ✅ Railway asigna el puerto automáticamente en `process.env.PORT`
- ✅ El código ya usa `process.env.PORT || 3001` (correcto)

#### ❌ Error: "Database error" o "SQLite error"
**Causa**: Problemas con la base de datos

**Solución**:
1. El código ahora detecta Railway automáticamente
2. La base de datos se guarda en el directorio del proyecto (persistente)
3. Si hay problemas, elimina el servicio y créalo de nuevo

#### ❌ Error: "Module not found: sqlite3"
**Causa**: sqlite3 requiere compilación nativa

**Solución**:
1. Railway debería compilarlo automáticamente
2. Si falla, verifica que **Node Version** sea 18 o superior
3. En Railway → Settings → Variables, agrega:
   ```
   NODE_VERSION=18
   ```

#### ❌ Error: "Cannot read property" o errores de JavaScript
**Causa**: Código con errores o variables de entorno faltantes

**Solución**:
1. Revisa los logs completos en Railway
2. Verifica que todas las variables de entorno estén configuradas
3. Ver sección "Variables de Entorno Requeridas" abajo

## ✅ Configuración Correcta en Railway

### Settings → Service

- **Root Directory**: `server`
- **Build Command**: (vacío o `npm install`)
- **Start Command**: `npm start`

### Settings → Variables

Agrega estas variables de entorno:

```
NODE_ENV=production
PORT=3001
JWT_SECRET=tu-secreto-super-seguro-minimo-32-caracteres-12345
FRONTEND_URL=https://tu-app.netlify.app
NETLIFY_URL=https://tu-app.netlify.app
```

**⚠️ IMPORTANTE**:
- `PORT` es opcional (Railway lo asigna automáticamente)
- `JWT_SECRET` debe ser un string largo y aleatorio
- Reemplaza las URLs con las reales de tu app

### Settings → Networking

Railway generará automáticamente una URL pública. Cópiala y úsala en Netlify como `VITE_API_URL`.

## 🔍 Verificar que Funciona

### 1. Revisar Logs

Los logs deberían mostrar:
```
🔧 Iniciando servidor...
📁 Ruta de base de datos: /app/server/database.db
🌐 Puerto: 3001 (o el que Railway asigne)
🚂 Detectado Railway
✅ Conectado a la base de datos SQLite
🚀 Servidor corriendo en puerto 3001
```

### 2. Probar el Endpoint

Una vez desplegado, prueba:
```
https://tu-app.up.railway.app/api/rutas
```

Debería devolver un JSON con todas las rutas disponibles.

## 🛠️ Solución Paso a Paso

### Si la app sigue crasheando:

1. **Elimina el servicio actual** en Railway
2. **Crea un nuevo servicio** desde GitHub
3. **Configura correctamente**:
   - Root Directory: `server`
   - Variables de entorno (ver arriba)
4. **Espera a que termine el deploy**
5. **Revisa los logs** para ver si hay errores

### Si sigue fallando:

1. **Revisa los logs completos** en Railway
2. **Copia el error exacto** que aparece
3. **Verifica**:
   - ¿El build se completó?
   - ¿El servidor inició?
   - ¿Hay errores de base de datos?
   - ¿Hay errores de dependencias?

## 📝 Cambios Realizados en el Código

He mejorado el código para Railway:

1. ✅ **Detección automática de Railway**: El código detecta si está en Railway
2. ✅ **Logs mejorados**: Muestra información útil para debugging
3. ✅ **Base de datos persistente**: Usa el directorio del proyecto en Railway
4. ✅ **Manejo de errores**: El servidor sale con código de error si falla
5. ✅ **Escucha en 0.0.0.0**: Acepta conexiones desde cualquier IP

## 🚨 Errores Específicos

### "Error: listen EADDRINUSE"
- **Solución**: No configures `PORT` manualmente, deja que Railway lo asigne

### "Error: Cannot find module 'express'"
- **Solución**: Verifica que Root Directory sea `server` y que `npm install` se ejecute

### "Error: ENOENT: no such file or directory, open 'database.db'"
- **Solución**: El código ahora crea la base de datos automáticamente en el directorio correcto

### "Error: SQLITE_CANTOPEN"
- **Solución**: Railway ahora usa el directorio del proyecto (persistente)

## ✅ Checklist Final

Antes de desplegar, verifica:

- [ ] Root Directory configurado como `server`
- [ ] Variables de entorno configuradas
- [ ] Build Command correcto (o vacío)
- [ ] Start Command: `npm start`
- [ ] Código actualizado (con los cambios recientes)
- [ ] Repositorio en GitHub actualizado

## 🆘 ¿Necesitas Más Ayuda?

Si después de seguir estos pasos sigue crasheando:

1. **Copia los logs completos** de Railway
2. **Indica en qué momento** se crashea (build, inicio, runtime)
3. **Verifica** que el código esté actualizado en GitHub

