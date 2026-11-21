@echo off
REM Script para iniciar Frontend y Backend en Windows
REM Abre dos ventanas de Terminal
echo.
echo ========================================
echo  Iniciando Bitacora de Vehiculos
echo ========================================
echo.

REM Abrir Terminal para Backend
echo [1/2] Iniciando Backend en puerto 3000...
start cmd /k "cd backend && npm run dev"

REM Esperar un poco para que inicie el backend
timeout /t 3 /nobreak

REM Abrir Terminal para Frontend
echo [2/2] Iniciando Frontend en puerto 5173...
start cmd /k "npm run dev"

echo.
echo ✅ Ambos servidores en ejecución!
echo.
echo Frontend: http://localhost:5173
echo Backend:  http://localhost:3000
echo.
