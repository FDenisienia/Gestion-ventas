// Script para limpiar completamente el proyecto
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.join(__dirname, '..');

console.log('🧹 Limpiando proyecto...');

// Directorios y archivos a limpiar
const toClean = [
  'dist',
  'node_modules/.vite',
  'src/build-version.ts'
];

toClean.forEach(item => {
  const fullPath = path.join(rootDir, item);
  if (fs.existsSync(fullPath)) {
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      console.log(`  - Eliminando directorio: ${item}`);
      fs.rmSync(fullPath, { recursive: true, force: true });
    } else {
      console.log(`  - Eliminando archivo: ${item}`);
      fs.unlinkSync(fullPath);
    }
  }
});

console.log('✅ Limpieza completada');

