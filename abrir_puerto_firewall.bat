@echo off
echo ========================================
echo   Configurar Firewall para Django
echo ========================================
echo.
echo Este script abrira el puerto 8000 en el Firewall de Windows
echo para permitir que otros usuarios accedan al servidor.
echo.
echo IMPORTANTE: Ejecutar como Administrador
echo.
pause

netsh advfirewall firewall add rule name="Django Calendario SAIPE" dir=in action=allow protocol=TCP localport=8000

echo.
echo ========================================
echo   Puerto 8000 configurado exitosamente
echo ========================================
echo.
echo Ahora otros usuarios podran acceder a:
echo http://192.168.101.176:8000/
echo.
pause

