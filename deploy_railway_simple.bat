@echo off
REM Script de deploy para Railway con configuración simplificada (SQLite)

echo 🚂 Deployando en Railway con configuración simplificada...

REM Verificar que estamos en el directorio correcto
if not exist "manage.py" (
    echo ❌ Error: No se encontró manage.py. Ejecuta este script desde la raíz del proyecto.
    pause
    exit /b 1
)

echo 🔧 Configurando variables de entorno para Railway...
set DJANGO_SETTINGS_MODULE=calendario_reservas.settings_simple
set DEBUG=False

echo 📦 Instalando dependencias...
pip install -r requirements.txt

echo 🗄️ Ejecutando migraciones...
python manage.py migrate

echo 📁 Recopilando archivos estáticos...
python manage.py collectstatic --noinput

echo 🚀 Desplegando en Railway...
railway up

echo ✅ Deploy completado! Verifica tu aplicación en Railway.
pause
