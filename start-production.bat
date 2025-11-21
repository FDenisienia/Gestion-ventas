@echo off
echo ========================================
echo   BUILD Y PRODUCCION
echo ========================================
echo.

echo Construyendo aplicacion...
call npm run build

if %ERRORLEVEL% EQU 0 (
    echo.
    echo Build completado exitosamente!
    echo.
    echo Iniciando servidor de produccion...
    echo.
    echo ========================================
    echo   Servidor disponible en:
    echo   http://localhost:3001
    echo ========================================
    echo.
    echo Presiona Ctrl+C para detener el servidor
    echo.
    cd server
    call npm start
) else (
    echo.
    echo Error en el build. El servidor no se iniciara.
    echo.
    exit /b 1
)
