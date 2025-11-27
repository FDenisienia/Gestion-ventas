# Instrucciones de Instalación para TypeScript

## 📦 Instalación de Dependencias

### Backend

```bash
cd backend
npm install
```

Esto instalará:
- TypeScript y tipos
- tsx para desarrollo con hot reload
- Vitest para testing
- Todas las dependencias de tipos (@types/*)

### Frontend

```bash
cd frontend
npm install
```

Esto instalará:
- TypeScript
- Vitest y Testing Library para tests
- Todas las dependencias de tipos

## 🚀 Comandos Disponibles

### Backend

```bash
# Desarrollo con hot reload
npm run dev

# Compilar TypeScript
npm run build

# Ejecutar en producción (después de build)
npm start

# Type checking sin compilar
npm run type-check

# Tests
npm test

# Tests con cobertura
npm run test:coverage
```

### Frontend

```bash
# Desarrollo
npm run dev

# Build para producción
npm run build

# Type checking
npm run type-check

# Tests
npm test

# Tests con UI
npm run test:ui

# Tests con cobertura
npm run test:coverage
```

## ⚠️ Nota Importante

**La migración está en progreso**. Algunos archivos aún están en JavaScript (.js/.jsx) y se migrarán gradualmente a TypeScript (.ts/.tsx).

Los archivos TypeScript compilados se generan en:
- Backend: `backend/dist/`
- Frontend: `frontend/dist/` (solo en build de producción)

## 🔄 Próximos Pasos

1. Instalar dependencias (comandos arriba)
2. Verificar que todo compile: `npm run type-check` en ambos proyectos
3. Ejecutar tests: `npm test` en ambos proyectos
4. Continuar con la migración gradual de archivos

