#!/usr/bin/env python
"""Start a persistent WSGI server without modifying accounts or seeding data."""
import os
import django
from django.core.management import call_command


def initialize_database():
    os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'calendario_reservas.settings_production')
    django.setup()
    call_command('migrate', interactive=False)
    call_command('collectstatic', interactive=False)


if __name__ == '__main__':
    initialize_database()
    port = int(os.getenv('PORT', '8000'))
    if not 1 <= port <= 65535:
        raise ValueError('PORT must be between 1 and 65535')
    os.execvp('gunicorn', ['gunicorn', 'calendario_reservas.wsgi:application',
                         '--bind', f'0.0.0.0:{port}'])
