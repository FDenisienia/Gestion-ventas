# ⚡ Guía Rápida - Configurar Netlify

## 🎯 Solución Rápida al Error

El error dice: *"La URL del backend no está configurada"*

### Solución en 3 Pasos:

#### 1️⃣ Desplegar Backend (si no lo tienes)
- **Railway**: https://railway.app (gratis, fácil)
- **Render**: https://render.com (gratis)
- Copia la URL pública (ej: `https://tu-app.railway.app`)

#### 2️⃣ Configurar Netlify
1. Ve a: https://app.netlify.com
2. Selecciona tu sitio: **gestion-ventas1**
3. **Site settings** → **Environment variables**
4. Agrega:
   ```
   Key: VITE_API_URL
   Value: https://tu-backend-url.com/api
   ```
   (Reemplaza con tu URL real)

#### 3️⃣ Redesplegar
1. Ve a **Deploys**
2. **Trigger deploy** → **Clear cache and deploy site**

## ✅ Listo!

Después del deploy, el error desaparecerá.

---

**¿No tienes backend desplegado?** Ver `CONFIGURAR_NETLIFY.md` para instrucciones detalladas.

