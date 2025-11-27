# Guía Detallada de Despliegue

Esta guía te ayudará a desplegar el proyecto paso a paso.

## 🔧 Actualizar Peticiones Fetch en el Frontend

Para que el frontend funcione en producción, necesitas actualizar todas las peticiones `fetch` para usar `getApiUrl()`.

### Ejemplo de actualización:

**Antes:**
```javascript
const response = await fetch('/api/ventas', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
})
```

**Después:**
```javascript
import { getApiUrl } from '../config'

const response = await fetch(getApiUrl('/api/ventas'), {
  headers: {
    'Authorization': `Bearer ${token}`
  }
})
```

### Archivos que necesitan actualización:

Busca todos los archivos que contengan `fetch('/api/` y actualízalos:

```bash
# Buscar archivos con peticiones fetch
grep -r "fetch('/api" frontend/src/
```

### Archivos principales a actualizar:

1. `frontend/src/pages/Ingresos.jsx`
2. `frontend/src/pages/Egresos.jsx`
3. `frontend/src/pages/BaseDatos.jsx`
4. `frontend/src/pages/Tesoreria.jsx`
5. `frontend/src/pages/Informes.jsx`
6. `frontend/src/pages/Usuarios.jsx`
7. `frontend/src/utils/api.js` (si existe)

### Script de búsqueda y reemplazo:

Puedes usar este patrón para buscar y reemplazar:

**Buscar:**
```javascript
fetch('/api/
```

**Reemplazar con:**
```javascript
fetch(getApiUrl('/api/
```

Y agregar el import al inicio del archivo:
```javascript
import { getApiUrl } from '../config'
```

## 🚂 Configuración de Railway

### Variables de Entorno en Railway:

1. Ve a tu proyecto en Railway
2. Click en tu servicio
3. Ve a la pestaña "Variables"
4. Agrega:

```
PORT=3001
NODE_ENV=production
FRONTEND_URL=https://tu-sitio.netlify.app
```

⚠️ **Importante**: Reemplaza `https://tu-sitio.netlify.app` con la URL real de tu sitio en Netlify.

### Configurar el Directorio Raíz:

1. En Railway, ve a "Settings"
2. En "Root Directory", selecciona: `backend`
3. Guarda los cambios

## 🌐 Configuración de Netlify

### Variables de Entorno en Netlify:

1. Ve a tu sitio en Netlify
2. Click en "Site settings"
3. Ve a "Environment variables"
4. Agrega:

```
VITE_API_URL=https://tu-backend.railway.app
```

⚠️ **Importante**: Reemplaza `https://tu-backend.railway.app` con la URL real de tu backend en Railway.

### Configuración de Build:

- **Base directory**: `frontend`
- **Build command**: `npm install && npm run build`
- **Publish directory**: `frontend/dist`

## ✅ Checklist de Despliegue

- [ ] Backend desplegado en Railway
- [ ] Variables de entorno configuradas en Railway
- [ ] Frontend desplegado en Netlify
- [ ] Variable `VITE_API_URL` configurada en Netlify
- [ ] Todas las peticiones fetch actualizadas para usar `getApiUrl()`
- [ ] CORS configurado en el backend con la URL de Netlify
- [ ] Probar login en producción
- [ ] Verificar que las peticiones API funcionen

## 🐛 Troubleshooting

### Error: "CORS policy: No 'Access-Control-Allow-Origin'"

**Solución:**
1. Verifica que `FRONTEND_URL` esté configurada en Railway
2. Verifica que la URL en `FRONTEND_URL` coincida exactamente con tu dominio de Netlify
3. Reinicia el servicio en Railway

### Error: "Failed to fetch" en producción

**Solución:**
1. Verifica que `VITE_API_URL` esté configurada en Netlify
2. Verifica que la URL del backend en Railway sea correcta
3. Verifica que el backend esté funcionando (visita `https://tu-backend.railway.app/api/health`)
4. Revisa la consola del navegador para ver el error exacto

### El frontend muestra "localhost:3001" en las peticiones

**Solución:**
- Asegúrate de haber actualizado todas las peticiones fetch para usar `getApiUrl()`
- Verifica que `VITE_API_URL` esté configurada en Netlify
- Reconstruye el sitio en Netlify después de agregar la variable de entorno

## 📝 Notas Adicionales

- Railway asigna un dominio aleatorio, pero puedes configurar un dominio personalizado
- Netlify también permite dominios personalizados
- Las bases de datos JSON se crean automáticamente por usuario en Railway
- Cada usuario tiene su propia base de datos aislada

