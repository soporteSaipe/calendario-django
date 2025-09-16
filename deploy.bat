@echo off
REM Script de deploy para Calendario de Reservas (Windows)
REM Uso: deploy.bat [railway|render|heroku|digitalocean]

set PLATFORM=%1
if "%PLATFORM%"=="" set PLATFORM=railway

echo 🚀 Iniciando deploy en %PLATFORM%...

REM Verificar que estamos en el directorio correcto
if not exist "manage.py" (
    echo ❌ Error: No se encontró manage.py. Ejecuta este script desde la raíz del proyecto.
    pause
    exit /b 1
)

REM Verificar que no hay archivos sin commitear
git status --porcelain >nul 2>&1
if %errorlevel% equ 0 (
    echo ⚠️  Advertencia: Hay archivos sin commitear. ¿Deseas continuar? (y/N)
    set /p response=
    if /i not "%response%"=="y" (
        echo ❌ Deploy cancelado.
        pause
        exit /b 1
    )
)

if "%PLATFORM%"=="railway" (
    echo 🚂 Deployando en Railway...
    railway login
    railway up
) else if "%PLATFORM%"=="render" (
    echo 🎨 Deployando en Render...
    render deploy
) else if "%PLATFORM%"=="heroku" (
    echo 🟣 Deployando en Heroku...
    git push heroku main
    heroku run python manage.py migrate
    heroku run python manage.py collectstatic --noinput
) else if "%PLATFORM%"=="digitalocean" (
    echo 🌊 Deployando en DigitalOcean...
    echo ℹ️  Para DigitalOcean, configura la app desde el dashboard web.
    echo 📖 Guía: https://docs.digitalocean.com/products/app-platform/
) else (
    echo ❌ Plataforma no soportada: %PLATFORM%
    echo Plataformas disponibles: railway, render, heroku, digitalocean
    pause
    exit /b 1
)

echo ✅ Deploy completado en %PLATFORM%!
echo 🔗 Verifica tu aplicación en la URL proporcionada.
pause
