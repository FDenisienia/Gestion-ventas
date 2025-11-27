# Despliegue Manual en Railway (Cuando el Deploy Automático No Funciona)

Si Railway no te deja hacer el deploy del repositorio directamente, sigue estos pasos para crear un servicio manualmente:

## 🎯 Método 1: Servicio Vacío (Recomendado)

### Paso 1: Crear Proyecto Nuevo
1. Ve a [railway.app](https://railway.app)
2. Click en **"New Project"**
3. Selecciona **"Empty Project"** (NO selecciones "Deploy from GitHub repo")

### Paso 2: Conectar GitHub
1. En el proyecto vacío, click en **"+ New"**
2. Selecciona **"GitHub Repo"**
3. Selecciona tu repositorio: `FDenisienia/Gestion-clientes`
4. Railway creará un servicio conectado a tu repo

### Paso 3: Configurar el Servicio
1. Click en el servicio que acabas de crear
2. Ve a **"Settings"**
3. Busca **"Root Directory"**
4. Escribe: `backend`
5. Guarda los cambios

### Paso 4: Configurar Start Command
1. En **"Settings"**, busca **"Start Command"**
2. Escribe: `npm start`
3. O déjalo vacío (usará el script del package.json)
4. Guarda los cambios

### Paso 5: Variables de Entorno
1. Ve a la pestaña **"Variables"**
2. Agrega:
   ```
   NODE_ENV=production
   PORT=3001
   ```

### Paso 6: Deploy
1. Railway debería iniciar el deploy automáticamente
2. Si no, ve a **"Deployments"** → **"Redeploy"**

---

## 🎯 Método 2: Usar Railway CLI

Si prefieres usar la línea de comandos:

### Instalación
```bash
npm i -g @railway/cli
railway login
```

### Desplegar
```bash
cd backend
railway init
railway up
```

Esto creará un servicio y desplegará automáticamente.

---

## 🎯 Método 3: Fork y Deploy Directo

Si Railway no detecta tu repositorio:

1. **Crea un fork del repositorio** (opcional, pero a veces ayuda)
2. En Railway, intenta conectar el fork
3. O crea un repositorio nuevo y copia solo la carpeta `backend/`

---

## 🔧 Configuración Manual Completa

Si nada funciona, configura todo manualmente:

### 1. Crear Servicio Vacío
- New Project → Empty Project
- + New → Empty Service

### 2. Configurar Source
- Settings → Source
- Connect GitHub
- Selecciona tu repo

### 3. Configurar Build
- Settings → Root Directory: `backend`
- Settings → Build Command: (dejar vacío o `npm install`)
- Settings → Start Command: `npm start`

### 4. Variables
```
NODE_ENV=production
PORT=3001
FRONTEND_URL=https://tu-sitio.netlify.app
```

### 5. Deploy Manual
- Deployments → Redeploy

---

## 🐛 Solución de Problemas Específicos

### Error: "No buildpack detected"
**Solución:**
- Asegúrate de que `backend/package.json` exista
- Verifica que Root Directory sea `backend`

### Error: "Cannot find module"
**Solución:**
- Agrega Build Command: `npm install`
- O verifica que las dependencias estén en `package.json`

### Error: "Root directory not found"
**Solución:**
- Verifica que la carpeta `backend/` esté en GitHub
- El Root Directory debe ser exactamente `backend` (sin `/` al final)

### Error: "Start command failed"
**Solución:**
- Verifica que `backend/package.json` tenga `"start": "node server.js"`
- Prueba con Start Command: `node server.js` directamente

---

## ✅ Verificación Final

Después de configurar, verifica:

1. **Settings:**
   - ✅ Root Directory: `backend`
   - ✅ Start Command: `npm start` o `node server.js`

2. **Variables:**
   - ✅ `NODE_ENV=production`
   - ✅ `PORT=3001`

3. **Logs:**
   - ✅ No hay errores en rojo
   - ✅ El servidor inicia correctamente
   - ✅ Mensaje: "Servidor backend corriendo en puerto XXXX"

4. **Health Check:**
   - Visita: `https://tu-proyecto.railway.app/api/health`
   - Debe responder: `{"status":"ok","message":"Servidor funcionando correctamente"}`

---

## 📞 Si Nada Funciona

1. **Elimina todo y empieza de nuevo:**
   - Elimina el proyecto en Railway
   - Crea uno nuevo desde cero
   - Sigue el Método 1 paso a paso

2. **Verifica localmente:**
   ```bash
   cd backend
   npm install
   npm start
   ```
   Si funciona localmente, debería funcionar en Railway

3. **Revisa los logs completos:**
   - Copia el error completo de los logs
   - Busca en Google el error específico
   - O abre un issue en GitHub con los detalles

---

## 🎓 Tips Adicionales

- **Railway detecta automáticamente Node.js** si encuentra `package.json`
- **El Root Directory es crítico** - debe apuntar a donde está `package.json`
- **Las variables de entorno** se pueden agregar después del primer deploy
- **Los logs son tu mejor amigo** - siempre revísalos primero

