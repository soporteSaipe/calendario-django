#!/bin/bash

# Script de deploy para Calendario de Reservas
# Uso: ./deploy.sh [railway|render|heroku|digitalocean]

set -e

PLATFORM=${1:-railway}

echo "🚀 Iniciando deploy en $PLATFORM..."

# Verificar que estamos en el directorio correcto
if [ ! -f "manage.py" ]; then
    echo "❌ Error: No se encontró manage.py. Ejecuta este script desde la raíz del proyecto."
    exit 1
fi

# Verificar que no hay archivos sin commitear
if [ -n "$(git status --porcelain)" ]; then
    echo "⚠️  Advertencia: Hay archivos sin commitear. ¿Deseas continuar? (y/N)"
    read -r response
    if [[ ! "$response" =~ ^[Yy]$ ]]; then
        echo "❌ Deploy cancelado."
        exit 1
    fi
fi

case $PLATFORM in
    "railway")
        echo "🚂 Deployando en Railway..."
        if ! command -v railway &> /dev/null; then
            echo "❌ Railway CLI no está instalado. Instálalo desde: https://docs.railway.app/develop/cli"
            exit 1
        fi
        railway login
        railway up
        ;;
    
    "render")
        echo "🎨 Deployando en Render..."
        if ! command -v render &> /dev/null; then
            echo "❌ Render CLI no está instalado. Instálalo desde: https://render.com/docs/cli"
            exit 1
        fi
        render deploy
        ;;
    
    "heroku")
        echo "🟣 Deployando en Heroku..."
        if ! command -v heroku &> /dev/null; then
            echo "❌ Heroku CLI no está instalado. Instálalo desde: https://devcenter.heroku.com/articles/heroku-cli"
            exit 1
        fi
        git push heroku main
        heroku run python manage.py migrate
        heroku run python manage.py collectstatic --noinput
        ;;
    
    "digitalocean")
        echo "🌊 Deployando en DigitalOcean..."
        echo "ℹ️  Para DigitalOcean, configura la app desde el dashboard web."
        echo "📖 Guía: https://docs.digitalocean.com/products/app-platform/"
        ;;
    
    *)
        echo "❌ Plataforma no soportada: $PLATFORM"
        echo "Plataformas disponibles: railway, render, heroku, digitalocean"
        exit 1
        ;;
esac

echo "✅ Deploy completado en $PLATFORM!"
echo "🔗 Verifica tu aplicación en la URL proporcionada."
