# Script optimizado para iniciar backend y frontend
Write-Host 'Iniciando servidores de desarrollo...' -ForegroundColor Green
Write-Host ''

# Verificar que Node.js este instalado
if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
    Write-Host 'Error: Node.js no esta instalado' -ForegroundColor Red
    exit 1
}

# Verificar que npm este instalado
if (-not (Get-Command npm -ErrorAction SilentlyContinue)) {
    Write-Host 'Error: npm no esta instalado' -ForegroundColor Red
    exit 1
}

# Iniciar backend en una nueva ventana
Write-Host 'Iniciando backend en puerto 3001...' -ForegroundColor Cyan
$backendPath = Join-Path $PWD 'server'
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$backendPath'; Write-Host 'Backend iniciando...' -ForegroundColor Cyan; npm start"

# Esperar un poco antes de iniciar el frontend
Start-Sleep -Seconds 2

# Iniciar frontend en una nueva ventana
Write-Host 'Iniciando frontend en puerto 5173...' -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PWD'; Write-Host 'Frontend iniciando...' -ForegroundColor Green; npm run dev"

Write-Host ''
Write-Host 'Servidores iniciados en ventanas separadas' -ForegroundColor Green
Write-Host 'Backend: http://localhost:3001' -ForegroundColor Cyan
Write-Host 'Frontend: http://localhost:5173' -ForegroundColor Green
Write-Host ''
Write-Host 'Presiona Enter para salir...' -ForegroundColor Yellow
Read-Host
