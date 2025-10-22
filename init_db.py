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
    
    # Crear o actualizar superusuario
    admin_user, created = User.objects.get_or_create(
        username='admin',
        defaults={
            'email': 'admin@example.com',
            'is_staff': True,
            'is_superuser': True
        }
    )
    admin_user.set_password('admin123')
    admin_user.is_staff = True
    admin_user.is_superuser = True
    admin_user.save()
    
    # Crear o actualizar usuario de prueba
    usuario_prueba, created = User.objects.get_or_create(
        username='usuario_prueba',
        defaults={
            'email': 'usuario@prueba.com',
            'first_name': 'Usuario',
            'last_name': 'Prueba'
        }
    )
    usuario_prueba.set_password('prueba123')
    usuario_prueba.first_name = 'Usuario'
    usuario_prueba.last_name = 'Prueba'
    usuario_prueba.save()
    
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
