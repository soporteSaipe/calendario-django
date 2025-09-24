"""
Comando para probar el rate limiting implementado
"""
from django.core.management.base import BaseCommand
from django.test import Client
from django.contrib.auth.models import User
from django.urls import reverse
import time
import json

class Command(BaseCommand):
    help = 'Probar el rate limiting implementado'

    def add_arguments(self, parser):
        parser.add_argument(
            '--username',
            type=str,
            default='admin',
            help='Usuario para probar (default: admin)'
        )
        parser.add_argument(
            '--password',
            type=str,
            default='admin',
            help='Contraseña del usuario (default: admin)'
        )

    def handle(self, *args, **options):
        username = options['username']
        password = options['password']
        
        self.stdout.write(f'🧪 Probando rate limiting para usuario: {username}')
        
        # Crear cliente de prueba
        client = Client()
        
        # Intentar hacer login
        login_success = client.login(username=username, password=password)
        if not login_success:
            self.stdout.write(
                self.style.ERROR(f'❌ No se pudo hacer login con usuario: {username}')
            )
            self.stdout.write('💡 Sugerencia: Crear un usuario admin con: python manage.py createsuperuser')
            return
        
        self.stdout.write(self.style.SUCCESS('✅ Login exitoso'))
        
        # Probar rate limiting en crear_reserva
        self.test_crear_reserva_rate_limit(client)
        
        # Probar rate limiting en API reservas
        self.test_api_reservas_rate_limit(client)
        
        # Probar rate limiting en API validar conflicto
        self.test_api_validar_conflicto_rate_limit(client)

    def test_crear_reserva_rate_limit(self, client):
        """Probar rate limiting en crear_reserva"""
        self.stdout.write('\n🔍 Probando rate limiting en crear_reserva...')
        
        # Datos de prueba para crear reserva
        reserva_data = {
            'recurso': '1',
            'titulo': 'Prueba Rate Limit',
            'descripcion': 'Prueba de rate limiting',
            'fecha': '2024-12-31',
            'hora_inicio': '10:00',
            'hora_fin': '11:00'
        }
        
        success_count = 0
        rate_limited_count = 0
        
        # Intentar crear 15 reservas (límite es 10/min)
        for i in range(15):
            response = client.post(
                reverse('calendario:crear_reserva'),
                data=reserva_data,
                HTTP_X_REQUESTED_WITH='XMLHttpRequest'
            )
            
            if response.status_code == 200:
                try:
                    data = json.loads(response.content)
                    if data.get('success'):
                        success_count += 1
                        self.stdout.write(f'  ✅ Reserva {i+1}: Creada exitosamente')
                    else:
                        self.stdout.write(f'  ⚠️  Reserva {i+1}: Error - {data.get("error", "Error desconocido")}')
                except json.JSONDecodeError:
                    self.stdout.write(f'  ⚠️  Reserva {i+1}: Respuesta no JSON')
            elif response.status_code == 429:
                rate_limited_count += 1
                self.stdout.write(f'  🚫 Reserva {i+1}: Rate limit excedido (429)')
            else:
                self.stdout.write(f'  ❌ Reserva {i+1}: Error {response.status_code}')
            
            # Pequeña pausa entre requests
            time.sleep(0.1)
        
        self.stdout.write(
            self.style.SUCCESS(
                f'📊 Resultados crear_reserva: {success_count} exitosas, {rate_limited_count} rate limited'
            )
        )

    def test_api_reservas_rate_limit(self, client):
        """Probar rate limiting en API reservas"""
        self.stdout.write('\n🔍 Probando rate limiting en API reservas...')
        
        success_count = 0
        rate_limited_count = 0
        
        # Intentar hacer 35 consultas (límite es 30/min)
        for i in range(35):
            response = client.get(
                reverse('calendario:api_reservas'),
                {'start': '2024-01-01', 'end': '2024-12-31'}
            )
            
            if response.status_code == 200:
                success_count += 1
                if i < 5:  # Solo mostrar los primeros 5
                    self.stdout.write(f'  ✅ Consulta {i+1}: Exitosa')
            elif response.status_code == 429:
                rate_limited_count += 1
                if i < 35:  # Mostrar cuando se activa el rate limit
                    self.stdout.write(f'  🚫 Consulta {i+1}: Rate limit excedido (429)')
            else:
                self.stdout.write(f'  ❌ Consulta {i+1}: Error {response.status_code}')
            
            time.sleep(0.1)
        
        self.stdout.write(
            self.style.SUCCESS(
                f'📊 Resultados API reservas: {success_count} exitosas, {rate_limited_count} rate limited'
            )
        )

    def test_api_validar_conflicto_rate_limit(self, client):
        """Probar rate limiting en API validar conflicto"""
        self.stdout.write('\n🔍 Probando rate limiting en API validar conflicto...')
        
        success_count = 0
        rate_limited_count = 0
        
        # Intentar hacer 55 validaciones (límite es 50/min)
        for i in range(55):
            response = client.get(
                reverse('calendario:api_validar_conflicto'),
                {
                    'sala': '1',
                    'fecha': '2024-12-31',
                    'hora_inicio': '10:00',
                    'hora_fin': '11:00'
                }
            )
            
            if response.status_code == 200:
                success_count += 1
                if i < 5:  # Solo mostrar los primeros 5
                    self.stdout.write(f'  ✅ Validación {i+1}: Exitosa')
            elif response.status_code == 429:
                rate_limited_count += 1
                if i < 55:  # Mostrar cuando se activa el rate limit
                    self.stdout.write(f'  🚫 Validación {i+1}: Rate limit excedido (429)')
            else:
                self.stdout.write(f'  ❌ Validación {i+1}: Error {response.status_code}')
            
            time.sleep(0.1)
        
        self.stdout.write(
            self.style.SUCCESS(
                f'📊 Resultados API validar conflicto: {success_count} exitosas, {rate_limited_count} rate limited'
            )
        )
        
        self.stdout.write(
            self.style.SUCCESS('\n🎉 Pruebas de rate limiting completadas!')
        )
