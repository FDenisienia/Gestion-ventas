@echo off
echo 🚀 Iniciando servidores de desarrollo...
echo.

REM Verificar Node.js
where node >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Error: Node.js no está instalado
    pause
    exit /b 1
)

REM Iniciar backend
echo 📦 Iniciando backend...
start "Backend - Puerto 3001" cmd /k "cd server && npm start"

REM Esperar un poco
timeout /t 2 /nobreak >nul

REM Iniciar frontend
echo ⚛️  Iniciando frontend...
start "Frontend - Puerto 5173" cmd /k "npm run dev"

echo.
echo ✅ Servidores iniciados
echo 📝 Backend: http://localhost:3001
echo 📝 Frontend: http://localhost:5173
echo.
pause


