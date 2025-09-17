"""
Configuración para producción en Railway
"""
from .settings import *
import os
import dj_database_url

# Configuración de seguridad para producción
DEBUG = os.getenv('DEBUG', 'False').lower() == 'true'
SECRET_KEY = os.getenv('SECRET_KEY', 'django-insecure-fallback-key-for-railway')

# ALLOWED_HOSTS - crítico para Railway
ALLOWED_HOSTS = os.getenv('ALLOWED_HOSTS', '').split(',') if os.getenv('ALLOWED_HOSTS') else [
    'healthcheck.railway.app',  # Para healthcheck de Railway
    'calendariosaipe.up.railway.app',  # Tu dominio específico
    '*.up.railway.app',  # Todos los dominios de Railway
    'localhost',
    '127.0.0.1'
]

# CSRF_TRUSTED_ORIGINS para Railway
CSRF_TRUSTED_ORIGINS = os.getenv('CSRF_TRUSTED_ORIGINS', '').split(',') if os.getenv('CSRF_TRUSTED_ORIGINS') else [
    'https://calendariosaipe.up.railway.app',  # Tu dominio específico
    'https://*.up.railway.app',  # Todos los dominios HTTPS de Railway
    'https://healthcheck.railway.app'
]

# Configuración de seguridad
X_FRAME_OPTIONS = 'DENY'

# Configuración de archivos estáticos para producción
STATIC_URL = '/static/'
STATIC_ROOT = BASE_DIR / 'staticfiles'

# Configuración de archivos multimedia
MEDIA_ROOT = BASE_DIR / 'media'
MEDIA_URL = '/media/'

# Base de datos para producción (PostgreSQL)
# Railway siempre proporciona DATABASE_URL
DATABASES = {
    'default': dj_database_url.parse(
        os.getenv('DATABASE_URL', 'postgresql://postgres:password@localhost:5432/calendario_db')
    )
}

# Configuración de cache
CACHES = {
    'default': {
        'BACKEND': 'django.core.cache.backends.locmem.LocMemCache',
        'LOCATION': 'unique-snowflake',
    }
}

# Configuración de logging para producción
LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'formatters': {
        'simple': {
            'format': '{levelname} {message}',
            'style': '{',
        },
    },
    'handlers': {
        'console': {
            'level': 'INFO',
            'class': 'logging.StreamHandler',
            'formatter': 'simple',
        },
    },
    'root': {
        'handlers': ['console'],
        'level': 'INFO',
    },
}

# Configuración de archivos estáticos con WhiteNoise
if 'whitenoise.middleware.WhiteNoiseMiddleware' not in MIDDLEWARE:
    MIDDLEWARE.insert(1, 'whitenoise.middleware.WhiteNoiseMiddleware')

# Configuración adicional de WhiteNoise
WHITENOISE_USE_FINDERS = True
WHITENOISE_AUTOREFRESH = True