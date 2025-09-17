"""
Configuración de producción simplificada para casos de emergencia
"""
from .settings import *
import os

# Configuración básica de producción
DEBUG = False
SECRET_KEY = os.getenv('SECRET_KEY', 'fallback-secret-key-for-emergency')
ALLOWED_HOSTS = ['*']  # Permitir todos los hosts temporalmente

# Configuración de archivos estáticos
STATIC_ROOT = BASE_DIR / 'staticfiles'

# Base de datos - usar SQLite como fallback si no hay PostgreSQL
if os.getenv('DATABASE_URL'):
    import dj_database_url
    DATABASES = {
        'default': dj_database_url.parse(os.getenv('DATABASE_URL'))
    }
else:
    # Mantener SQLite como fallback
    DATABASES = {
        'default': {
            'ENGINE': 'django.db.backends.sqlite3',
            'NAME': BASE_DIR / 'db.sqlite3',
        }
    }

# Cache simple en memoria
CACHES = {
    'default': {
        'BACKEND': 'django.core.cache.backends.locmem.LocMemCache',
        'LOCATION': 'unique-snowflake',
    }
}

# Logging solo a consola
LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'handlers': {
        'console': {
            'class': 'logging.StreamHandler',
        },
    },
    'root': {
        'handlers': ['console'],
    },
}

# Configuración de archivos estáticos con WhiteNoise
if 'whitenoise.middleware.WhiteNoiseMiddleware' not in MIDDLEWARE:
    MIDDLEWARE.insert(1, 'whitenoise.middleware.WhiteNoiseMiddleware')
