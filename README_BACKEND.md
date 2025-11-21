# Backend - Gestion App

## Instalación

1. Navega a la carpeta `server`:
```bash
cd server
```

2. Instala las dependencias:
```bash
npm install
```

3. Inicia el servidor:
```bash
npm start
```

O para desarrollo con auto-reload:
```bash
npm run dev
```

El servidor estará disponible en `http://localhost:3001`

## Estructura

- `index.js`: Servidor Express con todas las rutas de la API
- `database.db`: Base de datos SQLite (se crea automáticamente)
- `backups/`: Directorio donde se guardan los backups automáticos

## API Endpoints

### Productos
- `GET /api/productos` - Obtener todos los productos
- `GET /api/productos/:id` - Obtener un producto por ID
- `POST /api/productos` - Crear un nuevo producto
- `PUT /api/productos/:id` - Actualizar un producto
- `DELETE /api/productos/:id` - Eliminar un producto

### Ventas
- `GET /api/ventas` - Obtener todas las ventas
- `GET /api/ventas/:id` - Obtener una venta por ID
- `POST /api/ventas` - Crear una nueva venta
- `PUT /api/ventas/:id` - Actualizar una venta
- `DELETE /api/ventas/:id` - Eliminar una venta

### Backups
- `POST /api/backup` - Crear un backup manual
- `GET /api/backups` - Listar todos los backups disponibles

## Sistema de Backups

El sistema realiza backups automáticos:
- Cada 6 horas automáticamente
- Después de cada operación de escritura (POST, PUT, DELETE)
- Mantiene los últimos 10 backups
- Los backups se guardan en la carpeta `backups/`

## Configuración del Frontend

El frontend está configurado para conectarse a `http://localhost:3001/api` por defecto.

Puedes cambiar la URL de la API creando un archivo `.env` en la raíz del proyecto frontend:

```
VITE_API_URL=http://localhost:3001/api
```

## Migración de Datos

Si tienes datos en localStorage, el sistema automáticamente usará localStorage como fallback si la API no está disponible. Para migrar datos existentes, puedes:

1. Asegurarte de que el backend esté corriendo
2. Los datos se migrarán automáticamente cuando uses la aplicación
3. O puedes crear un script de migración manual si es necesario


