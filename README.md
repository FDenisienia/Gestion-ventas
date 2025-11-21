# 🚀 Sistema de Gestión de Ventas

Aplicación web completa para gestión de ventas, productos, stock y usuarios.

## ⚠️ IMPORTANTE: Despliegue en Producción

**Para que cualquier PC pueda acceder y los usuarios persistan, necesitas desplegar el backend en un servicio separado.**

### 🎯 Solución Rápida (15 minutos)

**Despliega el backend en Railway** (gratis):
- 📖 Ver `GUIA_RAPIDA_RAILWAY.md` para pasos rápidos
- 📖 Ver `DESPLEGAR_BACKEND_RAILWAY.md` para guía completa

**¿Por qué?** Netlify Functions no puede mantener una base de datos SQLite persistente. Cada invocación es aislada y los datos se pierden.

### ✅ Después del despliegue:
- ✅ Cualquier PC puede acceder
- ✅ Los usuarios persisten
- ✅ Funciona desde cualquier IP/lugar

## 🚀 Tecnologías

- **React** - Biblioteca de JavaScript para construir interfaces de usuario
- **Vite** - Herramienta de construcción rápida para desarrollo frontend
- **Bootstrap** - Framework CSS para diseño responsive
- **React Bootstrap** - Componentes Bootstrap para React
- **TypeScript** - Superset de JavaScript con tipado estático

## 📦 Instalación

```bash
npm install
```

## 🛠️ Desarrollo

Para iniciar el servidor de desarrollo:

```bash
npm run dev
```

La aplicación estará disponible en `http://localhost:5173`

## 🏗️ Construcción

Para crear una versión de producción:

```bash
npm run build
```

## 👀 Vista Previa

Para previsualizar la versión de producción:

```bash
npm run preview
```

## 📁 Estructura del Proyecto

```
├── src/
│   ├── App.tsx          # Componente principal
│   ├── main.tsx         # Punto de entrada
│   └── style.css        # Estilos personalizados
├── public/              # Archivos estáticos
├── index.html           # HTML principal
├── vite.config.ts       # Configuración de Vite
└── tsconfig.json        # Configuración de TypeScript
```

## 🎨 Características

- ✅ React con TypeScript
- ✅ Bootstrap 5 integrado
- ✅ Componentes React Bootstrap
- ✅ Hot Module Replacement (HMR)
- ✅ Diseño responsive
- ✅ Configuración lista para producción



