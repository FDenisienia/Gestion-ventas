# Guía Rápida de Configuración en Railway

## ⚠️ Solución de Error: "There was an error deploying from source"

Si ves este error, sigue estos pasos:

### 1. Verificar Root Directory

1. Ve a tu proyecto en Railway
2. Click en el servicio que está fallando
3. Ve a "Settings"
4. En "Root Directory", asegúrate de que esté configurado como: `backend`
5. Guarda los cambios

### 2. Verificar Start Command

1. En "Settings" del servicio
2. Verifica que "Start Command" sea uno de estos:
   - `npm start`
   - `node server.js`
   - O déjalo vacío (Railway usará el script "start" del package.json)

### 3. Verificar package.json

El `backend/package.json` debe tener un script "start":

```json
{
  "scripts": {
    "start": "node server.js",
    "dev": "node --watch server.js"
  }
}
```

### 4. Forzar Re-deploy

1. Ve a la pestaña "Deployments"
2. Click en "Redeploy" en el último deployment
3. O haz un pequeño cambio y push a GitHub para forzar un nuevo deploy

### 5. Verificar Logs

1. Ve a la pestaña "Logs" del servicio
2. Revisa los errores específicos
3. Los errores más comunes son:
   - "Cannot find module": Falta instalar dependencias
   - "Port already in use": Conflicto de puerto
   - "EADDRINUSE": Puerto ocupado

### 6. Configuración Manual del Servicio

Si Railway no detecta automáticamente el proyecto:

1. Crea un nuevo servicio
2. Selecciona "Empty Service"
3. En "Settings":
   - **Root Directory**: `backend`
   - **Build Command**: `npm install` (o déjalo vacío)
   - **Start Command**: `npm start` o `node server.js`

### 7. Variables de Entorno Requeridas

Asegúrate de tener estas variables configuradas:

```
PORT=3001
NODE_ENV=production
```

### 8. Verificar que el Código esté en GitHub

Railway despliega desde GitHub, así que:
1. Asegúrate de que todos los cambios estén en GitHub
2. Haz push de los cambios si es necesario:
   ```bash
   git add .
   git commit -m "Fix Railway deployment"
   git push
   ```

## ✅ Checklist de Verificación

- [ ] Root Directory configurado como `backend`
- [ ] Script "start" existe en `backend/package.json`
- [ ] Variables de entorno configuradas
- [ ] Código actualizado en GitHub
- [ ] Logs revisados para errores específicos

## 🔍 Comandos Útiles para Debugging

Si necesitas verificar localmente que todo funciona:

```bash
cd backend
npm install
npm start
```

Esto debería iniciar el servidor sin errores.

