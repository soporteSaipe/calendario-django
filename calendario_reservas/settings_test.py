"""Pruebas aisladas: nunca cargan .env ni conectan a servicios externos."""
import os

os.environ['DJANGO_SKIP_DOTENV'] = '1'
os.environ['DATABASE_URL'] = 'sqlite://:memory:'
os.environ['SECRET_KEY'] = 'test-only-key-not-for-production'

from .settings import *  # noqa: E402,F403

DEBUG = False
DATABASES = {'default': {'ENGINE': 'django.db.backends.sqlite3', 'NAME': ':memory:'}}
ALLOWED_HOSTS = ['testserver', 'localhost', '127.0.0.1']
PASSWORD_HASHERS = ['django.contrib.auth.hashers.MD5PasswordHasher']
EMAIL_BACKEND = 'django.core.mail.backends.locmem.EmailBackend'
LOGGING = {'version': 1, 'disable_existing_loggers': False, 'handlers': {
    'null': {'class': 'logging.NullHandler'}}, 'root': {'handlers': ['null']}}
