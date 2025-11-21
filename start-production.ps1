# Script para build y producción - Inicia servidor automáticamente
Write-Host '========================================' -ForegroundColor Cyan
Write-Host '  BUILD Y PRODUCCIÓN' -ForegroundColor Cyan
Write-Host '========================================' -ForegroundColor Cyan
Write-Host ''

Write-Host '📦 Construyendo aplicación...' -ForegroundColor Green
npm run build

if ($LASTEXITCODE -eq 0) {
    Write-Host ''
    Write-Host '✅ Build completado exitosamente!' -ForegroundColor Green
    Write-Host ''
    Write-Host '🚀 Iniciando servidor de producción...' -ForegroundColor Cyan
    Write-Host ''
    Write-Host '════════════════════════════════════' -ForegroundColor Yellow
    Write-Host '  Servidor disponible en:' -ForegroundColor Yellow
    Write-Host '  http://localhost:3001' -ForegroundColor Yellow
    Write-Host '════════════════════════════════════' -ForegroundColor Yellow
    Write-Host ''
    Write-Host 'Presiona Ctrl+C para detener el servidor' -ForegroundColor Gray
    Write-Host ''
    
    cd server
    npm start
} else {
    Write-Host ''
    Write-Host '❌ Error en el build. El servidor no se iniciará.' -ForegroundColor Red
    Write-Host ''
    exit 1
}
