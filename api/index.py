import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'calendario_reservas.settings_production')

from calendario_reservas.wsgi import application

app = application
