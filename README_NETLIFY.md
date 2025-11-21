# Despliegue en Netlify

## ⚠️ IMPORTANTE: Configuración Requerida

Netlify solo sirve archivos estáticos (frontend). El backend debe estar desplegado en otro servicio como:
- Railway
- Render
- Heroku
- DigitalOcean
- VPS propio

## Pasos para Desplegar

### 1. Preparar el Backend

El backend debe estar desplegado y accesible públicamente. Una vez desplegado, obtén la URL del backend (ej: `https://tu-backend.railway.app`)

### 2. Configurar Netlify

1. **Conecta tu repositorio** a Netlify
2. **Configura las variables de entorno** en Netlify:
   - Ve a: Site settings → Environment variables
   - Agrega: `VITE_API_URL` = `https://tu-backend.railway.app/api`
   - (Reemplaza con la URL real de tu backend)

3. **Configuración de Build** (ya está en `netlify.toml`):
   - Build command: `npm run build`
   - Publish directory: `dist`

### 3. Build y Deploy

Netlify automáticamente:
1. Ejecutará `npm run build` (que incluye `prebuild` y `postbuild`)
2. Limpiará datos viejos antes del build
3. Generará una nueva versión del build
4. Desplegará los archivos de `dist/`

### 4. Limpieza Automática de Datos

El sistema automáticamente:
- Detecta cuando es un nuevo build
- Limpia localStorage de datos viejos
- Migra usuarios antiguos (GOD, admin, etc.) a `gestionapp`

## Variables de Entorno en Netlify

```
VITE_API_URL=https://tu-backend-url.com/api
```

## Solución de Problemas

### Problema: Aparecen datos viejos
**Solución**: El sistema limpia automáticamente localStorage cuando detecta un nuevo build. Si persiste:
1. Limpia el cache del navegador
2. Abre en modo incógnito
3. Verifica que `VITE_API_URL` esté configurada correctamente

### Problema: No se conecta al backend
**Solución**: 
1. Verifica que `VITE_API_URL` esté configurada en Netlify
2. Verifica que el backend esté accesible públicamente
3. Verifica CORS en el backend para permitir tu dominio de Netlify

### Problema: Usuario GOD aparece como gestionapp
**Solución**: Esto es correcto. El sistema migra automáticamente usuarios antiguos. Si quieres mantener "GOD", modifica `src/utils/authStorage.ts`

## Scripts Disponibles

- `npm run build` - Build completo con limpieza automática
- `npm run clean` - Limpiar archivos generados
- `npm run prebuild` - Limpiar antes del build (automático)
- `npm run postbuild` - Verificar build (automático)

