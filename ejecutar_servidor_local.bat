@echo off
echo ========================================
echo   CALENDARIO SAIPE - Servidor Local
echo ========================================
echo.
echo Tu IP local es: 192.168.101.176
echo.
echo El servidor sera accesible en:
echo   - Desde esta PC: http://127.0.0.1:8000/
echo   - Desde otras PCs: http://192.168.101.176:8000/
echo.
echo Presiona Ctrl+C para detener el servidor
echo ========================================
echo.

REM Activar entorno virtual si existe
if exist venv\Scripts\activate.bat (
    call venv\Scripts\activate.bat
)

REM Ejecutar servidor en todas las interfaces (0.0.0.0)
python manage.py runserver 0.0.0.0:8000

