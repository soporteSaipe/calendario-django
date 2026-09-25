"""
Configuración para producción en Railway
"""
from .settings import *
import os
from .db_config import configure_database

# Configuración de seguridad para producción
DEBUG = os.getenv('DEBUG', 'False').lower() == 'true'
SECRET_KEY = os.getenv('SECRET_KEY', 'django-insecure-fallback-key-for-railway')

# ALLOWED_HOSTS - crítico para Railway, Render y Vercel
# Django usa .dominio.com (punto inicial), NO *.dominio.com
_DEFAULT_ALLOWED_HOSTS = [
    'healthcheck.railway.app',
    'calendariosaipe.up.railway.app',
    '.up.railway.app',
    '.onrender.com',
    '.vercel.app',
    'localhost',
    '127.0.0.1',
]


def _normalize_allowed_host(host):
    host = host.strip()
    if host.startswith('*.'):
        return '.' + host[2:]
    return host


_env_hosts = os.getenv('ALLOWED_HOSTS')
if _env_hosts:
    env_hosts = [_normalize_allowed_host(h) for h in _env_hosts.split(',') if h.strip()]
    ALLOWED_HOSTS = list(dict.fromkeys(env_hosts + _DEFAULT_ALLOWED_HOSTS))
else:
    ALLOWED_HOSTS = _DEFAULT_ALLOWED_HOSTS

# CSRF_TRUSTED_ORIGINS para Railway, Render y Vercel
_DEFAULT_CSRF_ORIGINS = [
    'https://calendariosaipe.up.railway.app',
    'https://*.up.railway.app',
    'https://*.onrender.com',
    'https://*.vercel.app',
    'https://healthcheck.railway.app',
]

_env_csrf = os.getenv('CSRF_TRUSTED_ORIGINS')
if _env_csrf:
    CSRF_TRUSTED_ORIGINS = [origin.strip() for origin in _env_csrf.split(',') if origin.strip()]
    CSRF_TRUSTED_ORIGINS = list(dict.fromkeys(CSRF_TRUSTED_ORIGINS + _DEFAULT_CSRF_ORIGINS))
else:
    CSRF_TRUSTED_ORIGINS = _DEFAULT_CSRF_ORIGINS

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
STATICFILES_STORAGE = 'whitenoise.storage.CompressedManifestStaticFilesStorage'

# Configuración de zona horaria para Railway (US East)
# Railway está en US East (Virginia) que es UTC-5 (EST) o UTC-4 (EDT)
# Pero queremos mantener la zona horaria de Buenos Aires para los usuarios
TIME_ZONE = 'America/Argentina/Buenos_Aires'
USE_TZ = True

# Configuración específica para manejo de fechas en producción
# Esto asegura que las fechas se interpreten correctamente
import os
os.environ['TZ'] = 'America/Argentina/Buenos_Aires'