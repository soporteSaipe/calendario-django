#!/bin/bash

# Script de deploy de emergencia para Calendario de Reservas
# Usa configuración simplificada para evitar problemas

set -e

echo "🚨 Deploy de emergencia iniciado..."

# Verificar que estamos en el directorio correcto
if [ ! -f "manage.py" ]; then
    echo "❌ Error: No se encontró manage.py. Ejecuta este script desde la raíz del proyecto."
    exit 1
fi

echo "🔧 Configurando variables de entorno..."
export DJANGO_SETTINGS_MODULE=calendario_reservas.settings_simple
export DEBUG=False
export SECRET_KEY=emergency-secret-key-12345

echo "📦 Instalando dependencias..."
pip install -r requirements.txt

echo "🗄️ Ejecutando migraciones..."
python manage.py migrate

echo "📁 Recopilando archivos estáticos..."
python manage.py collectstatic --noinput

echo "🚀 Iniciando servidor..."
python manage.py runserver 0.0.0.0:8000
