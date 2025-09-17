"""
WSGI config for calendario_reservas project.

It exposes the WSGI callable as a module-level variable named ``application``.

For more information on this file, see
https://docs.djangoproject.com/en/5.2/howto/deployment/wsgi/
"""

import os
import sys
from pathlib import Path

# Add the project directory to the Python path
BASE_DIR = Path(__file__).resolve().parent.parent
sys.path.append(str(BASE_DIR))

from django.core.wsgi import get_wsgi_application

# Use production settings for Railway
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'calendario_reservas.settings_production')

application = get_wsgi_application()