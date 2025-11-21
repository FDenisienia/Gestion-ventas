# 🚀 Configurar Railway - Guía Paso a Paso con Imágenes

## 📋 Paso 1: Acceder a Railway

1. Ve a [railway.app](https://railway.app)
2. Inicia sesión con tu cuenta (GitHub, Google, etc.)
3. Selecciona tu proyecto

## 📋 Paso 2: Seleccionar el Servicio

1. En la lista de servicios, haz clic en el servicio que creaste (o crea uno nuevo)
2. Si no tienes un servicio, crea uno:
   - Haz clic en **"New"** o **"+"**
   - Selecciona **"GitHub Repo"** o **"Empty Project"**
   - Si usas GitHub, selecciona tu repositorio

## 📋 Paso 3: Ir a Settings (Configuración)

1. En la parte superior del servicio, verás varias pestañas:
   - **Deployments** (Despliegues)
   - **Metrics** (Métricas)
   - **Logs** (Registros)
   - **Settings** (Configuración) ⬅️ **Haz clic aquí**

## 📋 Paso 4: Configurar Service Settings

1. En el menú lateral izquierdo de Settings, busca:
   - **Service** ⬅️ **Haz clic aquí**

2. Verás un formulario con varios campos:

### Campo 1: Root Directory
- **Nombre del campo**: "Root Directory" o "Working Directory"
- **Valor a poner**: `server`
- ⚠️ **IMPORTANTE**: Debe ser exactamente `server` (sin comillas, sin espacios)

### Campo 2: Build Command
- **Nombre del campo**: "Build Command" o "Build"
- **Valor a poner**: `npm install`
- ⚠️ **IMPORTANTE**: Debe ser exactamente `npm install` (sin comillas)

### Campo 3: Start Command
- **Nombre del campo**: "Start Command" o "Start"
- **Valor a poner**: `npm start`
- ⚠️ **IMPORTANTE**: Debe ser exactamente `npm start` (sin comillas)

## 📋 Paso 5: Guardar los Cambios

1. Después de llenar los campos, busca el botón:
   - **"Save"** (Guardar) o **"Update"** (Actualizar)
2. Haz clic en el botón para guardar

## 📋 Paso 6: Verificar el Deploy

1. Railway automáticamente iniciará un nuevo deploy
2. Ve a la pestaña **"Deployments"** para ver el progreso
3. Haz clic en el deploy más reciente para ver los logs
4. Deberías ver:
   ```
   Installing dependencies...
   added 123 packages
   npm start
   🚀 Servidor corriendo...
   ```

## 📋 Paso 7: Configurar Variables de Entorno (Opcional pero Recomendado)

1. En Settings, haz clic en **"Variables"** en el menú lateral
2. Haz clic en **"New Variable"** o **"Add Variable"**
3. Agrega estas variables una por una:

   **Variable 1:**
   - **Key**: `NODE_ENV`
   - **Value**: `production`
   - Haz clic en **"Add"** o **"Save"**

   **Variable 2:**
   - **Key**: `JWT_SECRET`
   - **Value**: `tu-secreto-super-seguro-12345` (cambia esto por un string largo y aleatorio)
   - Haz clic en **"Add"** o **"Save"**

   **Variable 3:**
   - **Key**: `FRONTEND_URL`
   - **Value**: `https://tu-app.netlify.app` (reemplaza con tu URL real de Netlify)
   - Haz clic en **"Add"** o **"Save"**

   **Variable 4:**
   - **Key**: `NETLIFY_URL`
   - **Value**: `https://tu-app.netlify.app` (reemplaza con tu URL real de Netlify)
   - Haz clic en **"Add"** o **"Save"**

## ✅ Verificación Final

Después de configurar todo, verifica:

1. **Root Directory** = `server` ✅
2. **Build Command** = `npm install` ✅
3. **Start Command** = `npm start` ✅
4. **Variables de entorno** configuradas ✅
5. **Deploy completado** sin errores ✅

## 🆘 Si No Encuentras los Campos

Si la interfaz de Railway es diferente:

1. **Busca "Settings"** o "Configuración" en el menú
2. **Busca "Service"** o "Servicio" en el submenú
3. **Busca campos como**:
   - "Working Directory"
   - "Build"
   - "Start"
   - "Run Command"

## 📸 Ubicación Aproximada en la Interfaz

```
Railway Dashboard
├── Tu Proyecto
    ├── Tu Servicio
        ├── [Pestañas superiores]
        │   ├── Deployments
        │   ├── Metrics
        │   ├── Logs
        │   └── Settings ⬅️ AQUÍ
        │       ├── [Menú lateral]
        │       │   ├── Service ⬅️ AQUÍ
        │       │   ├── Variables
        │       │   ├── Networking
        │       │   └── ...
        │       └── [Formulario]
        │           ├── Root Directory: server
        │           ├── Build Command: npm install
        │           └── Start Command: npm start
```

## 🎯 Resumen Rápido

1. Railway → Tu Servicio → **Settings** → **Service**
2. Llena:
   - Root Directory: `server`
   - Build Command: `npm install`
   - Start Command: `npm start`
3. Guarda
4. Espera el deploy
5. ¡Listo!

