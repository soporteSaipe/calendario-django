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
    
    print("Inicializando base de datos...")
    
    # Ejecutar migraciones
    print("Ejecutando migraciones...")
    execute_from_command_line(['manage.py', 'migrate', '--noinput'])
    
    # Crear superusuario si no existe
    print("Verificando superusuario...")
    from django.contrib.auth.models import User
    if not User.objects.filter(username='admin').exists():
        print("Creando superusuario...")
        User.objects.create_superuser('admin', 'admin@example.com', 'admin123')
        print("Superusuario creado: admin/admin123")
    else:
        print("Superusuario ya existe")
    
    # Crear recursos de ejemplo si no existen
    print("Verificando recursos...")
    from calendario.models import Recurso
    if not Recurso.objects.exists():
        print("Creando recursos de ejemplo...")
        recursos = [
            {'nombre': 'Sala de Juntas A', 'descripcion': 'Sala principal para reuniones', 'capacidad': 10, 'color': '#007bff'},
            {'nombre': 'Sala de Juntas B', 'descripcion': 'Sala secundaria para reuniones', 'capacidad': 8, 'color': '#28a745'},
            {'nombre': 'Auditorio', 'descripcion': 'Espacio para presentaciones grandes', 'capacidad': 50, 'color': '#dc3545'},
            {'nombre': 'Sala de Capacitación', 'descripcion': 'Espacio para entrenamientos', 'capacidad': 20, 'color': '#ffc107'},
        ]
        
        for recurso_data in recursos:
            Recurso.objects.create(**recurso_data)
        print(f"Se crearon {len(recursos)} recursos de ejemplo")
    else:
        print("Los recursos ya existen")
    
    print("Inicialización completada exitosamente!")
