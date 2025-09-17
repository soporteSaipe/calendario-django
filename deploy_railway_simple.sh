#!/bin/bash

# Script de deploy para Railway con configuración simplificada (SQLite)

set -e

echo "🚂 Deployando en Railway con configuración simplificada..."

# Verificar que estamos en el directorio correcto
if [ ! -f "manage.py" ]; then
    echo "❌ Error: No se encontró manage.py. Ejecuta este script desde la raíz del proyecto."
    exit 1
fi

echo "🔧 Configurando variables de entorno para Railway..."
export DJANGO_SETTINGS_MODULE=calendario_reservas.settings_simple
export DEBUG=False

echo "📦 Instalando dependencias..."
pip install -r requirements.txt

echo "🗄️ Ejecutando migraciones..."
python manage.py migrate

echo "📁 Recopilando archivos estáticos..."
python manage.py collectstatic --noinput

echo "🚀 Desplegando en Railway..."
railway up

echo "✅ Deploy completado! Verifica tu aplicación en Railway."
