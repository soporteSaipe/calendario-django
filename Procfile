web: DJANGO_SETTINGS_MODULE=calendario_reservas.settings_simple gunicorn calendario_reservas.wsgi:application --bind 0.0.0.0:$PORT
release: python manage.py migrate
