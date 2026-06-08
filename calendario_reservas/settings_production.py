"""
Configuración para producción en Railway
"""
from .settings import *
import os
from .db_config import configure_database

# Configuración de seguridad para producción
DEBUG = os.getenv('DEBUG', 'False').lower() == 'true'
SECRET_KEY = os.getenv('SECRET_KEY', 'django-insecure-fallback-key-for-railway')

# ALLOWED_HOSTS - crítico para Railway y Render
ALLOWED_HOSTS = os.getenv('ALLOWED_HOSTS', '').split(',') if os.getenv('ALLOWED_HOSTS') else [
    'healthcheck.railway.app',  # Para healthcheck de Railway
    'calendariosaipe.up.railway.app',  # Tu dominio Railway específico
    '*.up.railway.app',  # Todos los dominios de Railway
    '*.onrender.com',  # Todos los dominios de Render
    'localhost',
    '127.0.0.1'
]

# CSRF_TRUSTED_ORIGINS para Railway y Render
CSRF_TRUSTED_ORIGINS = os.getenv('CSRF_TRUSTED_ORIGINS', '').split(',') if os.getenv('CSRF_TRUSTED_ORIGINS') else [
    'https://calendariosaipe.up.railway.app',  # Tu dominio Railway específico
    'https://*.up.railway.app',  # Todos los dominios HTTPS de Railway
    'https://*.onrender.com',  # Todos los dominios HTTPS de Render
    'https://healthcheck.railway.app'
]

# Filtrar valores vacíos y asegurar que todos tengan https://
CSRF_TRUSTED_ORIGINS = [origin.strip() for origin in CSRF_TRUSTED_ORIGINS if origin.strip()]
CSRF_TRUSTED_ORIGINS = [origin if origin.startswith('https://') else f'https://{origin}' for origin in CSRF_TRUSTED_ORIGINS]

# Configuración de seguridad
X_FRAME_OPTIONS = 'DENY'

# Configuración de archivos estáticos para producción
STATIC_URL = '/static/'
STATIC_ROOT = BASE_DIR / 'staticfiles'

# Configuración de archivos multimedia
MEDIA_ROOT = BASE_DIR / 'media'
MEDIA_URL = '/media/'

# Base de datos para producción (PostgreSQL)
# Soporta Railway, Supabase, Render, etc.
DATABASE_URL = os.getenv('DATABASE_URL')

# Si no hay DATABASE_URL, construir desde variables individuales (útil para Supabase)
if not DATABASE_URL:
    # Intentar construir desde variables individuales de Supabase
    SUPABASE_HOST = os.getenv('SUPABASE_DB_HOST')
    SUPABASE_NAME = os.getenv('SUPABASE_DB_NAME', 'postgres')
    SUPABASE_USER = os.getenv('SUPABASE_DB_USER')
    SUPABASE_PASSWORD = os.getenv('SUPABASE_DB_PASSWORD')
    SUPABASE_PORT = os.getenv('SUPABASE_DB_PORT', '6543')
    
    if SUPABASE_HOST and SUPABASE_USER and SUPABASE_PASSWORD:
        DATABASE_URL = f"postgresql://{SUPABASE_USER}:{SUPABASE_PASSWORD}@{SUPABASE_HOST}:{SUPABASE_PORT}/{SUPABASE_NAME}"
        print(f"✅ DATABASE_URL construida desde variables de Supabase")
    else:
        raise ValueError("DATABASE_URL o credenciales de Supabase (SUPABASE_DB_*) son requeridas para producción")

# Debug: mostrar información de conexión (solo en logs)
print(f"🔗 DATABASE_URL encontrada: {DATABASE_URL[:50]}...")

DATABASES = {
    'default': configure_database(DATABASE_URL)
}

if 'supabase' in DATABASE_URL:
    print("Configurado Supabase transaction pooler (puerto 6543, CONN_MAX_AGE=0)")

# Cache en memoria (suficiente para ~80 usuarios, 4-5 conexiones simultáneas)
CACHES = {
    'default': {
        'BACKEND': 'django.core.cache.backends.locmem.LocMemCache',
        'LOCATION': 'unique-snowflake',
        'TIMEOUT': 300,
    },
    'recursos': {
        'BACKEND': 'django.core.cache.backends.locmem.LocMemCache',
        'LOCATION': 'unique-snowflake-recursos',
        'TIMEOUT': 600,
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

# RequestTimingMiddleware: detecta requests lentos (después de SecurityMiddleware)
if 'calendario.middleware.RequestTimingMiddleware' not in MIDDLEWARE:
    MIDDLEWARE.insert(1, 'calendario.middleware.RequestTimingMiddleware')

# Agregar middleware personalizado si no está presente
if 'calendario.middleware.RequestLoggingMiddleware' not in MIDDLEWARE:
    MIDDLEWARE.append('calendario.middleware.RequestLoggingMiddleware')
if 'calendario.middleware.CalendarioErrorMiddleware' not in MIDDLEWARE:
    MIDDLEWARE.append('calendario.middleware.CalendarioErrorMiddleware')

# Configuración adicional de WhiteNoise
WHITENOISE_USE_FINDERS = True
WHITENOISE_AUTOREFRESH = True

# Configuración de zona horaria para Railway (US East)
# Railway está en US East (Virginia) que es UTC-5 (EST) o UTC-4 (EDT)
# Pero queremos mantener la zona horaria de Buenos Aires para los usuarios
TIME_ZONE = 'America/Argentina/Buenos_Aires'
USE_TZ = True

# Configuración específica para manejo de fechas en producción
# Esto asegura que las fechas se interpreten correctamente
import os
os.environ['TZ'] = 'America/Argentina/Buenos_Aires'