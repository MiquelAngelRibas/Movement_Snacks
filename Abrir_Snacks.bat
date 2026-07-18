@echo off
setlocal
echo ==================================================
echo   Iniciando Snacks de Movimiento (Vite React)...
echo ==================================================
echo.

echo [1/2] Iniciando Servidor de Desarrollo local...
cd /d "%~dp0"
start "Snacks Frontend" /MIN /B npm run dev

echo [2/2] Abriendo en el navegador web...
timeout /t 3 /nobreak > NUL
start http://localhost:5180

echo.
echo Servidor iniciado en http://localhost:5180
echo ¡Listo para entrenar! Puedes cerrar esta ventana.
timeout /t 2 > NUL
exit
