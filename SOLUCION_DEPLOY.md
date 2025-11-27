# 🚀 Solución Rápida: Railway No Hace Deploy

## ⚡ Solución Inmediata (5 minutos)

### 1. Verificar Root Directory en Railway

**Esto es lo MÁS IMPORTANTE:**

1. Ve a Railway → Tu Proyecto → Tu Servicio
2. Click en **"Settings"**
3. Busca **"Root Directory"**
4. **DEBE decir**: `backend`
5. Si está vacío o dice `/`, cámbialo a `backend` y guarda

### 2. Forzar Deploy Manual

1. Ve a la pestaña **"Deployments"**
2. Click en el botón **"Deploy"** o **"Redeploy"**
3. Selecciona la rama `main`
4. Click en **"Deploy"**

### 3. Verificar Auto-Deploy

1. Ve a **"Settings"** → **"Source"**
2. Verifica que **"Auto Deploy"** esté activado (toggle ON)
3. Verifica que la rama sea `main`

## 🔧 Si Aún No Funciona

### Opción A: Crear Servicio Nuevo

1. **Elimina el servicio actual** (si existe)
2. Click en **"New"** → **"Empty Service"**
3. Click en **"Settings"** → **"Connect GitHub Repo"**
4. Selecciona: `FDenisienia/Gestion-clientes`
5. En **"Settings"** del servicio:
   - **Root Directory**: `backend` ⚠️ MUY IMPORTANTE
   - **Start Command**: `npm start` (o déjalo vacío)
6. Click en **"Deploy"** en la pestaña Deployments

### Opción B: Trigger desde GitHub

Haz un commit vacío para forzar el deploy:

```bash
git commit --allow-empty -m "Trigger Railway deploy"
git push
```

## 📋 Checklist Rápido

- [ ] Root Directory = `backend` (en Settings)
- [ ] Auto Deploy = ON (en Settings → Source)
- [ ] Rama = `main` (en Settings → Source)
- [ ] Deploy manual intentado (en Deployments)
- [ ] Logs revisados (busca errores específicos)

## 🐛 Errores Comunes y Soluciones

### "Cannot find module"
→ Root Directory no está configurado como `backend`

### "No start script"
→ Ya está solucionado en package.json ✅

### "Port already in use"
→ Ya está solucionado (usa process.env.PORT) ✅

### Deploy se queda en "Building..."
→ Espera 2-3 minutos, Railway puede tardar

## 📸 Qué Revisar en Railway

1. **Settings → Root Directory**: Debe ser `backend`
2. **Settings → Source**: Auto Deploy ON, rama `main`
3. **Deployments**: Último deploy debe estar en progreso o completado
4. **Logs**: Revisa si hay errores rojos

## ✅ Después del Deploy Exitoso

Una vez que el deploy funcione:

1. Copia la URL del servicio (ej: `https://tu-proyecto.railway.app`)
2. Esta será tu `VITE_API_URL` para Netlify
3. Agrega variables de entorno:
   - `NODE_ENV=production`
   - `FRONTEND_URL=https://tu-sitio.netlify.app` (después de desplegar frontend)

---

**¿Sigue sin funcionar?** Revisa `RAILWAY_TROUBLESHOOTING.md` para más detalles.

