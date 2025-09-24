"""
Comando simple para probar el rate limiting implementado
"""
from django.core.management.base import BaseCommand
from django.test import Client
import time
import json

class Command(BaseCommand):
    help = 'Probar el rate limiting implementado (versión simple)'

    def handle(self, *args, **options):
        self.stdout.write('🧪 Probando rate limiting (versión simple)')
        
        # Crear cliente de prueba
        client = Client()
        
        # Probar rate limiting en API reservas (no requiere autenticación)
        self.test_api_reservas_rate_limit(client)
        
        # Probar rate limiting en API validar conflicto (no requiere autenticación)
        self.test_api_validar_conflicto_rate_limit(client)

    def test_api_reservas_rate_limit(self, client):
        """Probar rate limiting en API reservas"""
        self.stdout.write('\n🔍 Probando rate limiting en API reservas...')
        
        success_count = 0
        rate_limited_count = 0
        
        # Intentar hacer 35 consultas (límite es 30/min)
        for i in range(35):
            response = client.get('/calendario/api/reservas/', {
                'start': '2024-01-01', 
                'end': '2024-12-31'
            })
            
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
            response = client.get('/calendario/api/validar-conflicto/', {
                'sala': '1',
                'fecha': '2024-12-31',
                'hora_inicio': '10:00',
                'hora_fin': '11:00'
            })
            
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
