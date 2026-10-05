"""Configuración de producción para Vercel y otros servidores WSGI."""
import os
from urllib.parse import quote
from django.core.exceptions import ImproperlyConfigured
from .settings import *
from .db_config import configure_database

DEBUG = False
SECRET_KEY = os.getenv('SECRET_KEY', '')
if len(SECRET_KEY) < 50 or SECRET_KEY.startswith('django-insecure-'):
    raise ImproperlyConfigured('Configura SECRET_KEY con al menos 50 caracteres aleatorios en producción.')

# Dominios de este proyecto: nunca confiar en todos los clientes del proveedor.
ALLOWED_HOSTS = [h.strip() for h in os.getenv('ALLOWED_HOSTS', '').split(',') if h.strip()]
for variable in ('VERCEL_URL', 'VERCEL_PROJECT_PRODUCTION_URL', 'VERCEL_BRANCH_URL', 'RAILWAY_PUBLIC_DOMAIN', 'RENDER_EXTERNAL_HOSTNAME'):
    host = os.getenv(variable)
    if host:
        ALLOWED_HOSTS.append(host.strip())
ALLOWED_HOSTS = list(dict.fromkeys(ALLOWED_HOSTS))
if any('*' in host or host.startswith('.') for host in ALLOWED_HOSTS):
    raise ImproperlyConfigured('ALLOWED_HOSTS debe contener dominios explícitos, sin comodines.')
CSRF_TRUSTED_ORIGINS = [origin.strip() for origin in os.getenv('CSRF_TRUSTED_ORIGINS', '').split(',') if origin.strip()]
if any('*' in origin or not origin.startswith('https://') for origin in CSRF_TRUSTED_ORIGINS):
    raise ImproperlyConfigured('CSRF_TRUSTED_ORIGINS debe contener orígenes HTTPS explícitos.')

SECURE_PROXY_SSL_HEADER = ('HTTP_X_FORWARDED_PROTO', 'https')
SECURE_SSL_REDIRECT = True
SESSION_COOKIE_SECURE = True
CSRF_COOKIE_SECURE = True
SECURE_HSTS_SECONDS = 31536000
SECURE_HSTS_INCLUDE_SUBDOMAINS = False
SECURE_HSTS_PRELOAD = False
X_FRAME_OPTIONS = 'DENY'

DATABASE_URL = os.getenv('DATABASE_URL')
if not DATABASE_URL:
    host = os.getenv('SUPABASE_DB_HOST')
    user = os.getenv('SUPABASE_DB_USER')
    password = os.getenv('SUPABASE_DB_PASSWORD')
    if not (host and user and password):
        raise ImproperlyConfigured('Configura DATABASE_URL o las credenciales SUPABASE_DB_* en producción.')
    database = quote(os.getenv('SUPABASE_DB_NAME', 'postgres'), safe='')
    port = os.getenv('SUPABASE_DB_PORT', '6543')
    DATABASE_URL = f'postgresql://{quote(user, safe="")}:{quote(password, safe="")}@{host}:{port}/{database}'
DATABASES = {'default': configure_database(DATABASE_URL)}
if DATABASES['default']['ENGINE'] != 'django.db.backends.postgresql':
    raise ImproperlyConfigured('Producción requiere PostgreSQL para garantizar el bloqueo de reservas.')

MIDDLEWARE = list(MIDDLEWARE)
MIDDLEWARE.insert(1, 'whitenoise.middleware.WhiteNoiseMiddleware')
MIDDLEWARE.insert(2, 'calendario.middleware.RequestTimingMiddleware')
STORAGES = {
    'default': {'BACKEND': 'django.core.files.storage.FileSystemStorage'},
    'staticfiles': {'BACKEND': 'whitenoise.storage.CompressedManifestStaticFilesStorage'},
}
WHITENOISE_USE_FINDERS = False
WHITENOISE_AUTOREFRESH = False
MEDIA_ROOT = BASE_DIR / 'media'
MEDIA_URL = '/media/'

# Redis permite compartir límites entre instancias serverless.
if os.getenv('REDIS_URL'):
    CACHES = {'default': {
        'BACKEND': 'django.core.cache.backends.redis.RedisCache',
        'LOCATION': os.environ['REDIS_URL'], 'TIMEOUT': 300,
    }}

# Solo consola: Vercel no ofrece archivos persistentes para logs.
LOGGING = {
    'version': 1, 'disable_existing_loggers': False,
    'formatters': {'simple': {'format': '{levelname} {message}', 'style': '{'}},
    'handlers': {'console': {'class': 'logging.StreamHandler', 'formatter': 'simple'}},
    'root': {'handlers': ['console'], 'level': 'INFO'},
    'loggers': {'calendario': {'handlers': ['console'], 'level': 'INFO', 'propagate': False}},
}
