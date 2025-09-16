#!/usr/bin/env python
"""
Script para poblar la base de datos con datos de ejemplo
"""
import os
import sys
import django
from datetime import datetime, timedelta
import random
from django.utils import timezone

# Configurar Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'calendario_reservas.settings')
django.setup()

from django.contrib.auth.models import User
from django.db import transaction
from calendario.models import Recurso, Reserva

@transaction.atomic
def create_sample_data():
    """Crear datos de ejemplo usando transacciones para mejor rendimiento"""
    print("Creando datos de ejemplo...")
    
    # Crear usuario de ejemplo si no existe
    user, created = User.objects.get_or_create(
        username='usuario_ejemplo',
        defaults={
            'email': 'usuario@example.com',
            'first_name': 'Usuario',
            'last_name': 'Ejemplo'
        }
    )
    if created:
        user.set_password('password123')
        user.save()
        print(f"✅ Usuario creado: {user.username}")
    else:
        print(f"ℹ️ Usuario ya existe: {user.username}")
    
    # Crear recursos de ejemplo para equipos internos (4 salas)
    recursos_data = [
        {
            'nombre': 'Sala 1',
            'descripcion': 'Sala de reuniones principal para equipos ejecutivos. Capacidad para 8 personas.',
            'capacidad': 8,
            'color': '#4F46E5'  # Azul menos saturado
        },
        {
            'nombre': 'Sala 2',
            'descripcion': 'Sala de reuniones para equipos de desarrollo. Capacidad para 6 personas.',
            'capacidad': 6,
            'color': '#E11D48'  # Rojo menos saturado
        },
        {
            'nombre': 'Sala 3',
            'descripcion': 'Sala de reuniones para equipos de contabilidad. Capacidad para 4 personas.',
            'capacidad': 4,
            'color': '#059669'  # Verde menos saturado
        },
        {
            'nombre': 'Sala 4',
            'descripcion': 'Sala de reuniones para capacitaciones y presentaciones. Capacidad para 12 personas.',
            'capacidad': 12,
            'color': '#9333EA'  # Púrpura menos saturado
        }
    ]
    
    recursos = []
    for recurso_data in recursos_data:
        recurso, created = Recurso.objects.get_or_create(
            nombre=recurso_data['nombre'],
            defaults=recurso_data
        )
        if created:
            print(f"✅ Recurso creado: {recurso.nombre}")
        else:
            print(f"ℹ️ Recurso ya existe: {recurso.nombre}")
        recursos.append(recurso)
    
    # Crear reservas de ejemplo para equipos internos
    reservas_data = [
        {
            'titulo': 'Reunión de Equipo - Contabilidad',
            'descripcion': 'Reunión semanal del equipo de contabilidad para revisar avances y planificar actividades',
            'fecha_inicio': timezone.now() + timedelta(days=1, hours=9),
            'fecha_fin': timezone.now() + timedelta(days=1, hours=11),
            'estado': 'confirmada'
        },
        {
            'titulo': 'Presentación de Resultados Q1',
            'descripcion': 'Presentación de resultados del primer trimestre a la gerencia',
            'fecha_inicio': timezone.now() + timedelta(days=2, hours=14),
            'fecha_fin': timezone.now() + timedelta(days=2, hours=16),
            'estado': 'confirmada'
        },
        {
            'titulo': 'Capacitación en Nuevo Software',
            'descripcion': 'Capacitación del equipo en el nuevo sistema contable implementado',
            'fecha_inicio': timezone.now() + timedelta(days=3, hours=10),
            'fecha_fin': timezone.now() + timedelta(days=3, hours=12),
            'estado': 'confirmada'
        },
        {
            'titulo': 'Reunión de Seguimiento - Proyectos',
            'descripcion': 'Reunión de seguimiento de proyectos en curso y asignación de tareas',
            'fecha_inicio': timezone.now() + timedelta(days=5, hours=9),
            'fecha_fin': timezone.now() + timedelta(days=5, hours=15),
            'estado': 'confirmada'
        },
        {
            'titulo': 'Revisión de Procesos Internos',
            'descripcion': 'Revisión y mejora de procesos contables internos del departamento',
            'fecha_inicio': timezone.now() + timedelta(days=7, hours=13),
            'fecha_fin': timezone.now() + timedelta(days=7, hours=15),
            'estado': 'confirmada'
        },
        {
            'titulo': 'Reunión Matutina - Equipo',
            'descripcion': 'Reunión diaria del equipo para coordinación de actividades',
            'fecha_inicio': timezone.now() + timedelta(days=1, hours=7),
            'fecha_fin': timezone.now() + timedelta(days=1, hours=8),
            'estado': 'confirmada'
        },
        {
            'titulo': 'Sesión de Trabajo - Auditoría',
            'descripcion': 'Sesión de trabajo para preparar documentación de auditoría externa',
            'fecha_inicio': timezone.now() + timedelta(days=2, hours=8),
            'fecha_fin': timezone.now() + timedelta(days=2, hours=10),
            'estado': 'confirmada'
        }
    ]
    
    # Crear reservas usando bulk_create para mejor rendimiento
    reservas_a_crear = []
    for reserva_data in reservas_data:
        reserva_data['recurso'] = random.choice(recursos)
        reserva_data['usuario'] = user
        
        # Verificar si ya existe
        if not Reserva.objects.filter(
            titulo=reserva_data['titulo'],
            fecha_inicio=reserva_data['fecha_inicio']
        ).exists():
            reservas_a_crear.append(Reserva(**reserva_data))
    
    if reservas_a_crear:
        Reserva.objects.bulk_create(reservas_a_crear)
        print(f"✅ {len(reservas_a_crear)} reservas creadas")
    else:
        print("ℹ️ No se crearon nuevas reservas (ya existen)")
    
    print("\n🎉 ¡Datos de ejemplo procesados exitosamente!")
    print(f"👤 Usuario: {user.username} (contraseña: password123)")
    print(f"🏢 Recursos disponibles: {len(recursos)}")
    print(f"📅 Total de reservas: {Reserva.objects.count()}")

if __name__ == '__main__':
    create_sample_data()
