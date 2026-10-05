#!/usr/bin/env python
"""Apply database migrations explicitly; never create or reset user accounts."""
import os
import django
from django.core.management import call_command


def initialize_database():
    os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'calendario_reservas.settings_production')
    django.setup()
    call_command('migrate', interactive=False)


if __name__ == '__main__':
    initialize_database()
