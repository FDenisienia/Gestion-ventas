// Script post-build para verificar y limpiar
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.join(__dirname, '..');
const distDir = path.join(rootDir, 'dist');

console.log('✅ Verificando build...');

if (!fs.existsSync(distDir)) {
  console.error('❌ Error: El directorio dist/ no existe después del build');
  process.exit(1);
}

// Verificar que index.html existe
const indexHtml = path.join(distDir, 'index.html');
if (!fs.existsSync(indexHtml)) {
  console.error('❌ Error: index.html no encontrado en dist/');
  process.exit(1);
}

console.log('✅ Build completado correctamente');
console.log(`📦 Archivos en: ${distDir}`);

