#!/usr/bin/env python
"""
Script para inicializar la base de datos en Railway
"""
import os
import sys
import django
from django.core.management import execute_from_command_line

if __name__ == '__main__':
    os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'calendario_reservas.settings_production')
    django.setup()
    
    execute_from_command_line(['manage.py', 'migrate', '--noinput'])
    
    from django.contrib.auth.models import User
    if not User.objects.filter(username='admin').exists():
        User.objects.create_superuser('admin', 'admin@example.com', 'admin123')
    
    if not User.objects.filter(username='usuario_prueba').exists():
        User.objects.create_user(
            username='usuario_prueba',
            email='usuario@prueba.com',
            password='prueba123',
            first_name='Usuario',
            last_name='Prueba'
        )
    
    from calendario.models import Recurso
    if not Recurso.objects.exists():
        recursos = [
            {'nombre': 'Sala de Juntas A', 'descripcion': 'Sala principal para reuniones', 'capacidad': 10, 'color': '#007bff'},
            {'nombre': 'Sala de Juntas B', 'descripcion': 'Sala secundaria para reuniones', 'capacidad': 8, 'color': '#28a745'},
            {'nombre': 'Auditorio', 'descripcion': 'Espacio para presentaciones grandes', 'capacidad': 50, 'color': '#dc3545'},
            {'nombre': 'Sala de Capacitación', 'descripcion': 'Espacio para entrenamientos', 'capacidad': 20, 'color': '#ffc107'},
        ]
        
        for recurso_data in recursos:
            Recurso.objects.create(**recurso_data)
