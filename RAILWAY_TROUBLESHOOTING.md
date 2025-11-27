# Solución: Railway No Hace Deploy

Si Railway no está haciendo el deploy automáticamente, sigue estos pasos en orden:

## 🔍 Paso 1: Verificar Conexión con GitHub

1. Ve a tu proyecto en Railway
2. Click en "Settings" → "Source"
3. Verifica que:
   - El repositorio esté conectado correctamente
   - La rama sea `main` (o `master`)
   - El "Auto Deploy" esté activado

## 🔍 Paso 2: Verificar Configuración del Servicio

1. Ve a tu servicio en Railway
2. Click en "Settings"
3. Verifica estas configuraciones:

### Root Directory (MUY IMPORTANTE)
- Debe estar configurado como: `backend`
- Si está vacío o dice `/`, cámbialo a `backend`

### Build Command
- Puede estar vacío (Railway lo detectará automáticamente)
- O puedes poner: `npm install`

### Start Command
- Debe ser: `npm start` o `node server.js`
- O déjalo vacío (usará el script "start" del package.json)

## 🔍 Paso 3: Forzar Deploy Manual

### Opción A: Desde Railway Dashboard

1. Ve a la pestaña "Deployments"
2. Click en el botón "Deploy" o "Redeploy"
3. Selecciona la rama `main`
4. Click en "Deploy"

### Opción B: Desde GitHub (Trigger Manual)

1. Ve a tu repositorio en GitHub
2. Haz un pequeño cambio (puede ser un espacio en blanco)
3. Haz commit y push:
   ```bash
   git commit --allow-empty -m "Trigger Railway deploy"
   git push
   ```

## 🔍 Paso 4: Verificar Logs

1. Ve a la pestaña "Logs" en Railway
2. Revisa si hay errores específicos
3. Los errores más comunes son:

### Error: "Cannot find module"
**Solución**: Railway no está instalando dependencias
- Verifica que `backend/package.json` exista
- Asegúrate de que Root Directory sea `backend`

### Error: "Port already in use"
**Solución**: Conflicto de puerto
- Verifica que `server.js` use `process.env.PORT`
- Ya está configurado correctamente ✅

### Error: "No start script"
**Solución**: Falta script "start" en package.json
- Ya está agregado ✅
- Verifica que el archivo esté en GitHub

## 🔍 Paso 5: Verificar Archivos en GitHub

Asegúrate de que estos archivos estén en GitHub:

```bash
# Verificar que los archivos estén en el repositorio
git ls-files | grep -E "(backend/package.json|backend/server.js|backend/railway.json)"
```

Deben aparecer:
- `backend/package.json`
- `backend/server.js`
- `backend/railway.json` (opcional pero recomendado)

## 🔍 Paso 6: Crear Servicio desde Cero

Si nada funciona, crea un nuevo servicio:

1. En Railway, click en "New" → "Empty Service"
2. Click en "Settings" → "Connect GitHub Repo"
3. Selecciona tu repositorio `Gestion-clientes`
4. En "Settings" del servicio:
   - **Root Directory**: `backend`
   - **Start Command**: `npm start`
5. Agrega variables de entorno:
   - `NODE_ENV=production`
   - `PORT=3001` (opcional, Railway asignará uno automáticamente)
6. Click en "Deploy"

## 🔍 Paso 7: Verificar railway.json

El archivo `backend/railway.json` debe estar en la raíz del directorio `backend/`:

```json
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "NIXPACKS"
  },
  "deploy": {
    "startCommand": "node server.js",
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 10
  }
}
```

## 🔍 Paso 8: Verificar package.json

El `backend/package.json` debe tener:

```json
{
  "scripts": {
    "start": "node server.js"
  }
}
```

Ya está configurado correctamente ✅

## ✅ Checklist Final

Antes de pedir ayuda, verifica:

- [ ] Root Directory configurado como `backend`
- [ ] Repositorio conectado a GitHub
- [ ] Auto Deploy activado
- [ ] Script "start" en package.json
- [ ] Archivos en GitHub (haz push si falta algo)
- [ ] Logs revisados para errores específicos
- [ ] Variables de entorno configuradas

## 🆘 Si Nada Funciona

1. **Elimina el servicio actual** en Railway
2. **Crea uno nuevo** desde cero
3. **Conecta el repositorio** de GitHub
4. **Configura Root Directory** como `backend`
5. **Haz deploy manual** desde la pestaña Deployments

## 📞 Información para Debugging

Si necesitas ayuda adicional, proporciona:

1. Screenshot de la pestaña "Settings" del servicio
2. Screenshot de los "Logs" (últimas 50 líneas)
3. Screenshot de la pestaña "Deployments"
4. URL de tu repositorio en GitHub

