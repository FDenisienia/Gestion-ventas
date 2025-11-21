# ⚡ Guía Rápida: Desplegar Backend en Railway

## 🎯 Objetivo
Hacer que **cualquier PC pueda hacer login** y que los usuarios persistan.

## ⏱️ Tiempo: 15 minutos

### 1️⃣ Crear Cuenta (2 min)
- Ve a [railway.app](https://railway.app)
- Login con GitHub

### 2️⃣ Desplegar (5 min)
- Click "New Project"
- "Deploy from GitHub repo"
- Selecciona tu repo
- Railway detecta automáticamente Node.js

### 3️⃣ Configurar Variables (3 min)
En Railway → Variables, agrega:

```
PORT=3001
NODE_ENV=production
FRONTEND_URL=https://tu-app.netlify.app
NETLIFY_URL=https://tu-app.netlify.app
JWT_SECRET=tu-secreto-super-seguro-12345
```

**Reemplaza:**
- `https://tu-app.netlify.app` con tu URL real de Netlify
- `JWT_SECRET` con cualquier string largo y aleatorio

### 4️⃣ Obtener URL (1 min)
- Railway → Settings → Networking
- Copia la URL (ej: `https://tu-app.up.railway.app`)

### 5️⃣ Configurar Netlify (2 min)
- Netlify → Site settings → Environment variables
- Agrega: `VITE_API_URL` = `https://tu-app.up.railway.app` (sin `/api`)

### 6️⃣ Redesplegar (2 min)
- Netlify → Deploys → "Trigger deploy" → "Clear cache and deploy"

## ✅ Listo!

Ahora:
- ✅ Cualquier PC puede acceder
- ✅ Los usuarios persisten
- ✅ Funciona desde cualquier IP

## 📖 Guía Completa
Ver `DESPLEGAR_BACKEND_RAILWAY.md` para más detalles.

