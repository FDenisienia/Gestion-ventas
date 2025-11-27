# Solución: "There was an error deploying from source"

## 🔍 Diagnóstico Rápido

Si ves el error "There was an error deploying from source", sigue estos pasos:

## Paso 1: Revisar los Logs

1. En Railway, click en tu servicio
2. Ve a la pestaña **"Logs"**
3. Busca errores en **rojo**
4. Los errores más comunes son:

### Error: "Cannot find module"
**Causa:** Falta instalar dependencias o el Root Directory está mal configurado

**Solución:**
- Verifica que Root Directory sea `backend`
- Agrega Build Command: `npm install`

### Error: "Root directory not found"
**Causa:** Railway no encuentra la carpeta `backend/`

**Solución:**
- Verifica que la carpeta `backend/` exista en GitHub
- Verifica que Root Directory sea exactamente `backend` (sin `/` al final)

### Error: "Start command failed"
**Causa:** El comando de inicio no funciona

**Solución:**
- Verifica que Start Command sea `npm start`
- O usa directamente: `node server.js`

## Paso 2: Verificar Configuración del Servicio

1. Ve a **"Settings"** del servicio
2. Verifica estas configuraciones:

### Root Directory (CRÍTICO)
- Debe ser: `backend`
- NO debe ser: `/backend` o `backend/` o vacío

### Start Command
- Debe ser: `npm start`
- O: `node server.js`
- NO debe estar vacío

### Build Command (Opcional)
- Puede estar vacío (Railway lo detecta automáticamente)
- O: `npm install`

## Paso 3: Verificar Archivos en GitHub

Asegúrate de que estos archivos existan en GitHub:

- ✅ `backend/package.json`
- ✅ `backend/server.js`
- ✅ `backend/routes/` (carpeta)
- ✅ `backend/middleware/` (carpeta)

## Paso 4: Solución Rápida

### Opción A: Reconfigurar el Servicio Actual

1. Ve a **"Settings"**
2. Verifica/cambia:
   - **Root Directory**: `backend`
   - **Start Command**: `npm start`
3. Guarda los cambios
4. Ve a **"Deployments"** → **"Redeploy"**

### Opción B: Eliminar y Recrear el Servicio

1. Elimina el servicio actual (Settings → Delete Service)
2. Crea un nuevo servicio:
   - Click en **"+ New"** → **"GitHub Repo"**
   - Selecciona tu repositorio
3. Configura inmediatamente:
   - **Root Directory**: `backend`
   - **Start Command**: `npm start`
4. Guarda y espera el deploy

## Paso 5: Verificar Variables de Entorno

Aunque no son críticas para el deploy inicial, agrégalas:

1. Ve a **"Variables"**
2. Agrega:
   ```
   NODE_ENV=production
   PORT=3001
   ```

## 🔧 Configuración Correcta Final

Tu servicio debe tener:

**Settings:**
```
Root Directory: backend
Start Command: npm start
Build Command: (vacío o npm install)
```

**Variables:**
```
NODE_ENV=production
PORT=3001
```

**Archivos en GitHub:**
```
backend/
  ├── package.json ✅
  ├── server.js ✅
  ├── routes/ ✅
  └── middleware/ ✅
```

## 🐛 Si el Error Persiste

1. **Copia el error completo de los Logs**
2. **Verifica localmente:**
   ```bash
   cd backend
   npm install
   npm start
   ```
   Si funciona localmente, el problema es de configuración en Railway

3. **Prueba con Start Command directo:**
   - Cambia Start Command a: `node server.js`
   - Guarda y redeploya

4. **Verifica la versión de Node.js:**
   - Railway usa Node.js 20 por defecto
   - Tu código debe ser compatible

## ✅ Checklist de Verificación

Antes de intentar el deploy, verifica:

- [ ] Root Directory = `backend` (exactamente así)
- [ ] Start Command = `npm start` o `node server.js`
- [ ] `backend/package.json` existe en GitHub
- [ ] `backend/server.js` existe en GitHub
- [ ] Script `start` existe en `package.json`
- [ ] Logs revisados para error específico
- [ ] Variables de entorno configuradas (opcional al inicio)

## 📝 Nota Importante

Railway necesita que el **Root Directory** apunte a donde está el `package.json`. Como tu `package.json` está en `backend/`, el Root Directory debe ser `backend`.

Si el Root Directory está vacío o es `/`, Railway buscará `package.json` en la raíz del repositorio, pero tu `package.json` está en `backend/`, por eso falla.

