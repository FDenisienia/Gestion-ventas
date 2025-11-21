# 🚀 Guía de Producción

## ⚠️ IMPORTANTE: Netlify vs Servidor Local

### Netlify (Solo Frontend)
- **Netlify solo sirve archivos estáticos** (HTML, CSS, JS)
- **NO puede ejecutar Node.js** (no puede levantar el servidor backend)
- El backend debe estar desplegado en otro servicio (Railway, Render, etc.)

### Servidor Local (Desarrollo/Testing)
- Puedes levantar el servidor completo (backend + frontend)
- El servidor sirve los archivos del build automáticamente

## 📦 Opciones para Levantar el Servidor

### Opción 1: Script Automático (Recomendado)

**PowerShell:**
```powershell
.\start-production.ps1
```

**Batch (CMD):**
```cmd
start-production.bat
```

**NPM:**
```bash
npm run production
```

Esto hará:
1. ✅ Build del frontend
2. ✅ Iniciar el servidor backend
3. ✅ Servir los archivos del build automáticamente

### Opción 2: Manual

```bash
# 1. Hacer build
npm run build

# 2. Iniciar servidor
npm run start
# o
cd server
npm start
```

### Opción 3: Comando Directo

```bash
npm run build:start
```

## 🌐 URLs Disponibles

Una vez que el servidor esté corriendo:

- **Frontend + Backend**: http://localhost:3001
- **Solo API**: http://localhost:3001/api
- **Rutas disponibles**: http://localhost:3001/api/rutas

## 🔍 Verificación

### ¿El servidor está corriendo?
1. Abre http://localhost:3001 en tu navegador
2. Deberías ver la aplicación React
3. Si ves "Frontend no encontrado", ejecuta `npm run build` primero

### ¿El build existe?
```bash
# Verificar que dist/ existe
dir dist
# o
ls dist
```

Si no existe, ejecuta:
```bash
npm run build
```

## 🐛 Solución de Problemas

### Error: "Frontend no encontrado en dist/"
**Solución:**
```bash
npm run build
```

### Error: "Puerto 3001 ya en uso"
**Solución:**
1. Cierra otros procesos usando el puerto 3001
2. O cambia el puerto en `server/.env`:
   ```
   PORT=3002
   ```

### El servidor no inicia después del build
**Solución:**
1. Verifica que `dist/` existe después del build
2. Verifica que el servidor tenga permisos
3. Revisa los logs del servidor para errores

## 📝 Para Netlify

**Recuerda:** En Netlify el servidor NO se levanta automáticamente porque Netlify solo sirve archivos estáticos.

**Lo que necesitas:**
1. Desplegar el backend en Railway/Render/Heroku
2. Configurar `VITE_API_URL` en Netlify
3. Netlify solo servirá los archivos de `dist/`

Ver `NETLIFY_SETUP.md` para más detalles.

