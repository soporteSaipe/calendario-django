#!/bin/bash

# Get the port from Railway or use default
PORT=${PORT:-8000}

# Run migrations
python manage.py migrate

# Collect static files
python manage.py collectstatic --noinput

# Start the application
exec gunicorn calendario_reservas.wsgi:application --bind 0.0.0.0:$PORT
