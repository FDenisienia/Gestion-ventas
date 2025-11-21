# 🚀 Backend en Netlify Functions - Configuración Automática

## ✅ Solución Implementada

He configurado el backend para que funcione automáticamente en Netlify usando **Netlify Functions**, sin necesidad de desplegar el backend por separado.

## 🔧 Cómo Funciona

1. **Netlify Functions**: El backend se ejecuta como función serverless en Netlify
2. **Detección Automática**: El frontend detecta automáticamente si está en Netlify y usa rutas relativas
3. **Sin Configuración**: No necesitas configurar `VITE_API_URL` - funciona automáticamente

## 📦 Estructura

```
netlify/
  functions/
    api.js          # Función Netlify que adapta Express
server/
  index.js          # Servidor Express (modificado para serverless)
```

## 🎯 Características

- ✅ **Funciona automáticamente** - Sin configuración adicional
- ✅ **Base de datos SQLite** - Usa `/tmp` en Netlify (persistente durante la ejecución)
- ✅ **Todas las rutas API** - Funcionan igual que antes
- ✅ **CORS configurado** - Permite tu dominio de Netlify automáticamente

## ⚠️ Limitaciones de Netlify Functions

### Base de Datos
- La base de datos se guarda en `/tmp` que es **temporal**
- Los datos se pierden cuando la función se "duerme" (cold start)
- **Solución**: Para datos persistentes, considera usar una base de datos externa (PostgreSQL, MongoDB, etc.)

### Tiempo de Ejecución
- Límite de 10 segundos en plan gratuito
- Límite de 26 segundos en plan Pro
- Para operaciones largas, puede ser necesario optimizar

### Memoria
- Límite de 1GB en plan gratuito
- Puede ser insuficiente para bases de datos grandes

## 🔄 Alternativa: Base de Datos Externa

Si necesitas persistencia de datos, puedes:

1. **Usar una base de datos externa** (PostgreSQL, MongoDB, etc.)
2. **Usar servicios como Supabase, PlanetScale, o MongoDB Atlas** (tienen planes gratuitos)
3. **Modificar el código** para usar la base de datos externa en lugar de SQLite

## 📝 Para Desplegar

1. **Haz commit y push** de los cambios
2. **Netlify detectará automáticamente** el `netlify.toml`
3. **El build se ejecutará** automáticamente
4. **Las funciones se desplegarán** automáticamente

## ✅ Verificación

Después del deploy:

1. Abre tu sitio en Netlify
2. Abre la consola del navegador (F12)
3. Deberías ver: `🔧 API Base URL: /.netlify/functions/api`
4. El error de CORS debería desaparecer
5. La app debería funcionar normalmente

## 🐛 Solución de Problemas

### Error: "Function not found"
- Verifica que `netlify/functions/api.js` existe
- Verifica que `netlify.toml` tiene la configuración de funciones
- Revisa los logs de Netlify en el deploy

### Error: "Database locked" o problemas con SQLite
- Es normal en Netlify Functions debido a la naturaleza serverless
- Considera usar una base de datos externa para producción

### La función tarda mucho
- Optimiza las queries
- Considera usar caché
- Verifica el tamaño de la base de datos

## 💡 Recomendación

Para producción con datos persistentes, considera:
- **Supabase** (PostgreSQL gratuito)
- **MongoDB Atlas** (MongoDB gratuito)
- **PlanetScale** (MySQL gratuito)
- **Railway** (PostgreSQL gratuito)

Estos servicios ofrecen bases de datos persistentes y gratuitas que funcionan mejor que SQLite en entornos serverless.

