# Sistema de Gestión de Clientes y Ventas

Aplicación web completa para gestionar ventas, clientes, stock, egresos e informes. Construida con React, Vite y Node.js.

## 🚀 Características

- **Gestión de Clientes**: Base de datos completa de clientes con DNI y teléfono
- **Gestión de Stock**: Control de inventario con categorías, marcas y precios
- **Ventas**: Sistema completo de ventas con múltiples artículos por venta
- **Egresos**: Control de gastos con diferentes métodos de pago
- **Informes**: Gráficos y estadísticas de ventas y ganancias
- **Resumen de Cuentas**: Control de efectivo y transferencias bancarias
- **Sistema de Usuarios**: Autenticación y gestión multi-usuario
- **Base de Datos por Usuario**: Cada usuario tiene su propia base de datos aislada

## 📁 Estructura del Proyecto

```
Gestion-clientes/
├── frontend/          # Aplicación React con Vite
│   ├── src/
│   │   ├── components/   # Componentes reutilizables
│   │   ├── contexts/     # Contextos de React (Auth)
│   │   ├── pages/        # Páginas principales
│   │   └── utils/        # Utilidades
│   └── package.json
├── backend/           # API REST con Node.js y Express
│   ├── routes/        # Rutas de la API
│   ├── middleware/    # Middleware de autenticación
│   ├── database.js    # Gestión de base de datos JSON
│   └── server.js      # Servidor Express
└── package.json       # Scripts del proyecto raíz
```

## 🛠️ Instalación Local

### Requisitos Previos

- Node.js 18+ y npm
- Git

### Pasos de Instalación

1. **Clonar el repositorio**
```bash
git clone https://github.com/FDenisienia/Gestion-clientes.git
cd Gestion-clientes
```

2. **Instalar dependencias**
```bash
npm run install:all
```

3. **Ejecutar en desarrollo**
```bash
npm run dev
```

Esto iniciará:
- **Frontend** en `http://localhost:3000`
- **Backend** en `http://localhost:3001`

### Ejecutar por Separado

- Frontend: `npm run dev:frontend`
- Backend: `npm run dev:backend`

## 🌐 Despliegue en Producción

Este proyecto está diseñado para desplegarse en:
- **Frontend**: Netlify
- **Backend**: Railway

### 📋 Paso 1: Desplegar Backend en Railway

1. **Crear cuenta en Railway**
   - Ve a [railway.app](https://railway.app)
   - Regístrate con GitHub

2. **Crear nuevo proyecto**
   - Click en "New Project"
   - Selecciona "Deploy from GitHub repo"
   - Conecta tu repositorio `Gestion-clientes`

3. **Configurar el servicio**
   - Después de conectar el repositorio, Railway te pedirá crear un servicio
   - Selecciona "Empty Service" o "Deploy from GitHub repo"
   - En la configuración del servicio:
     - **Root Directory**: `backend` (IMPORTANTE: selecciona la carpeta backend)
     - Railway detectará automáticamente que es un proyecto Node.js

4. **Verificar la configuración**
   - Ve a "Settings" del servicio
   - Verifica que "Root Directory" esté configurado como `backend`
   - Verifica que "Start Command" sea `npm start` o `node server.js`

5. **Configurar variables de entorno**
   - Ve a la pestaña "Variables" del servicio
   - Agrega las siguientes variables:
     ```
     PORT=3001
     NODE_ENV=production
     FRONTEND_URL=https://tu-sitio.netlify.app
     ```
     ⚠️ **Nota**: Reemplaza `https://tu-sitio.netlify.app` con la URL real de tu frontend en Netlify (la agregarás después de desplegar el frontend)

6. **Desplegar**
   - Railway iniciará el despliegue automáticamente
   - Espera a que el build termine (puede tardar unos minutos)
   - Una vez completado, copia la URL del servicio (ej: `https://tu-proyecto.railway.app`)
   - Esta URL será tu `VITE_API_URL` para Netlify

### 📋 Paso 2: Desplegar Frontend en Netlify

1. **Crear cuenta en Netlify**
   - Ve a [netlify.com](https://www.netlify.com)
   - Regístrate con GitHub

2. **Crear nuevo sitio**
   - Click en "Add new site" → "Import an existing project"
   - Conecta tu repositorio de GitHub
   - Selecciona el repositorio `Gestion-clientes`

3. **Configurar el build**
   - **Base directory**: `frontend`
   - **Build command**: `npm install && npm run build`
   - **Publish directory**: `dist` (⚠️ IMPORTANTE: Solo `dist`, no `frontend/dist` porque el base directory ya es `frontend`)

4. **Configurar variables de entorno**
   - Ve a "Site settings" → "Environment variables"
   - Agrega:
     ```
     VITE_API_URL=https://tu-proyecto.railway.app
     ```
     ⚠️ **Reemplaza** `https://tu-proyecto.railway.app` con la URL real de tu backend en Railway

5. **Configurar el archivo de redirección**
   - Netlify necesita un archivo `_redirects` para el routing de React
   - Ya está incluido en `frontend/public/_redirects`

6. **Desplegar**
   - Click en "Deploy site"
   - Netlify construirá y desplegará tu aplicación

### 📋 Paso 3: Configurar CORS en el Backend

El backend debe permitir peticiones desde tu dominio de Netlify:

1. **Actualizar `backend/server.js`**
   ```javascript
   import cors from 'cors'
   
   const corsOptions = {
     origin: [
       'http://localhost:3000', // Desarrollo local
       'https://tu-sitio.netlify.app', // Producción
       'https://*.netlify.app' // Todos los subdominios de Netlify
     ],
     credentials: true
   }
   
   app.use(cors(corsOptions))
   ```

2. **Hacer commit y push**
   ```bash
   git add backend/server.js
   git commit -m "Configurar CORS para producción"
   git push
   ```

3. **Railway redeployará automáticamente** con los cambios

### 📋 Paso 4: Actualizar Frontend para usar Variable de Entorno

1. **Crear archivo de configuración** `frontend/src/config.js`:
   ```javascript
   export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001'
   ```

2. **Actualizar todas las peticiones fetch** para usar `API_URL`:
   ```javascript
   import { API_URL } from '../config'
   
   const response = await fetch(`${API_URL}/api/auth/login`, {
     // ...
   })
   ```

3. **Hacer commit y push**
   ```bash
   git add .
   git commit -m "Configurar API URL desde variables de entorno"
   git push
   ```

## 🔧 Configuración Adicional

### Variables de Entorno

#### Backend (Railway)
```
PORT=3001
NODE_ENV=production
```

#### Frontend (Netlify)
```
VITE_API_URL=https://tu-backend.railway.app
```

### Credenciales por Defecto

**Usuario Administrador:**
- Usuario: `admin`
- Contraseña: `admin123`

⚠️ **IMPORTANTE**: Cambia estas credenciales después del primer inicio de sesión en producción.

## 📝 Scripts Disponibles

### En el directorio raíz:
- `npm run dev` - Ejecuta frontend y backend simultáneamente
- `npm run dev:frontend` - Solo frontend
- `npm run dev:backend` - Solo backend
- `npm run install:all` - Instala todas las dependencias

### En frontend/:
- `npm run dev` - Servidor de desarrollo
- `npm run build` - Construir para producción
- `npm run preview` - Previsualizar build de producción

### En backend/:
- `npm run dev` - Servidor de desarrollo con watch mode

## 🔒 Seguridad

- Autenticación con JWT (JSON Web Tokens)
- Contraseñas hasheadas con bcrypt
- Base de datos aislada por usuario
- CORS configurado para dominios específicos
- Rutas protegidas con middleware de autenticación

## 🐛 Solución de Problemas

### Error: "Failed to fetch" en producción
- Verifica que `VITE_API_URL` esté configurada correctamente en Netlify
- Verifica que el backend en Railway esté funcionando
- Revisa la configuración de CORS en el backend

### Error: CORS en producción
- Asegúrate de agregar tu dominio de Netlify en la lista de orígenes permitidos en `backend/server.js`
- Verifica que `credentials: true` esté configurado en CORS

### El backend no inicia en Railway
- Verifica que el puerto use `process.env.PORT` en lugar de un puerto fijo
- Revisa los logs en Railway para ver errores específicos

### El frontend no se construye en Netlify
- Verifica que el "Base directory" esté configurado como `frontend`
- Verifica que el "Build command" sea `npm install && npm run build`
- Revisa los logs de build en Netlify

## 📚 Tecnologías Utilizadas

- **Frontend**: React 18, Vite, React Router, Chart.js
- **Backend**: Node.js, Express, JWT, bcrypt
- **Base de Datos**: JSON files (por usuario)
- **Despliegue**: Netlify (Frontend), Railway (Backend)

## 📄 Licencia

Este proyecto es de código abierto y está disponible bajo la licencia MIT.

## 👤 Autor

FDenisienia

## 🤝 Contribuciones

Las contribuciones son bienvenidas. Por favor:
1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

---

**¿Necesitas ayuda?** Abre un issue en GitHub o contacta al desarrollador.
