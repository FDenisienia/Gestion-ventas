// Script de pre-build para limpiar datos y asegurar build limpio
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.join(__dirname, '..');

console.log('🧹 Limpiando datos antes del build...');

// Limpiar directorio dist si existe
const distDir = path.join(rootDir, 'dist');
if (fs.existsSync(distDir)) {
  console.log('  - Eliminando directorio dist/ anterior...');
  fs.rmSync(distDir, { recursive: true, force: true });
}

// Generar archivo de versión del build
const buildVersion = Date.now().toString();
const versionFile = path.join(rootDir, 'src', 'build-version.ts');
const versionContent = `// Versión del build generada automáticamente
// Este archivo se regenera en cada build para detectar builds nuevos
export const BUILD_VERSION = '${buildVersion}';
export const BUILD_DATE = '${new Date().toISOString()}';
`;

fs.writeFileSync(versionFile, versionContent, 'utf8');
console.log(`  - Versión del build generada: ${buildVersion}`);

console.log('✅ Pre-build completado');
