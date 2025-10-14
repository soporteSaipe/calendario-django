#!/usr/bin/env python
"""
Script de inicio para la aplicación Django en Railway
"""
import os
import sys
import subprocess
import django
from django.core.management import execute_from_command_line

def run_command(command):
    """Ejecutar un comando y mostrar el resultado"""
    print(f"Ejecutando: {command}")
    result = subprocess.run(command, shell=True, capture_output=True, text=True)
    if result.stdout:
        print(result.stdout)
    if result.stderr:
        print(f"Error: {result.stderr}")
    return result.returncode == 0

def initialize_database():
    """Inicializar la base de datos"""
    print("=== Inicializando base de datos ===")
    
    # Railway ya configuró DJANGO_SETTINGS_MODULE
    # Solo necesitamos configurar Django
    django.setup()
    
    # Ejecutar migraciones
    if not run_command("python manage.py migrate --noinput"):
        print("Error ejecutando migraciones")
        return False
    
    # Recopilar archivos estáticos
    if not run_command("python manage.py collectstatic --noinput"):
        print("Error recopilando archivos estáticos")
        return False
    
    # Cargar usuarios desde Excel si existe el archivo
    print("Verificando archivo de credenciales...")
    if not run_command("python manage.py cargar_usuarios_excel --archivo credenciales.xlsx"):
        print("No se pudieron cargar usuarios desde Excel (puede que el archivo no exista)")
    
    # Crear superusuario si no existe
    from django.contrib.auth.models import User
    if not User.objects.filter(username='admin').exists():
        print("Creando superusuario...")
        User.objects.create_superuser('admin', 'admin@example.com', 'admin123')
        print("Superusuario creado: admin/admin123")
    else:
        print("Superusuario ya existe")
    
    # Crear usuario de prueba normal
    if not User.objects.filter(username='usuario_prueba').exists():
        print("Creando usuario de prueba...")
        User.objects.create_user(
            username='usuario_prueba',
            email='usuario@prueba.com',
            password='prueba123',
            first_name='Usuario',
            last_name='Prueba'
        )
        print("Usuario de prueba creado: usuario_prueba/prueba123")
    else:
        print("Usuario de prueba ya existe")
    
    # Crear recursos de ejemplo si no existen
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
    
    print("=== Inicialización completada ===")
    return True

if __name__ == '__main__':
    print("Iniciando aplicación Django...")
    
    # Inicializar base de datos
    if not initialize_database():
        print("Error en la inicialización. Saliendo...")
        sys.exit(1)
    
    # Obtener puerto
    port = os.getenv('PORT', '8000')
    
    # Iniciar Gunicorn
    print(f"Iniciando Gunicorn en puerto {port}...")
    os.execvp('gunicorn', [
        'gunicorn',
        'calendario_reservas.wsgi:application',
        '--bind', f'0.0.0.0:{port}'
    ])
