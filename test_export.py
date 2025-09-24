#!/usr/bin/env python
"""
Script de prueba para la exportación
"""

import os
import sys
import django

# Configurar Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'calendario_reservas.settings')
django.setup()

from calendario.exporters import ExportFactory
from calendario.models import Reserva, Recurso
from datetime import datetime, timedelta

def test_export():
    """Probar la exportación"""
    print("=== Prueba de Exportación ===")
    
    # Verificar que hay datos
    reservas_count = Reserva.objects.count()
    recursos_count = Recurso.objects.filter(activo=True).count()
    
    print(f"Reservas en BD: {reservas_count}")
    print(f"Recursos activos: {recursos_count}")
    
    if reservas_count == 0:
        print("No hay reservas para exportar")
        return
    
    # Obtener algunas reservas
    reservas = Reserva.objects.filter(estado='confirmada')[:5]
    print(f"Reservas a exportar: {len(reservas)}")
    
    if not reservas:
        print("No hay reservas confirmadas")
        return
    
    # Fechas de prueba
    fecha_inicio = reservas[0].fecha_inicio
    fecha_fin = reservas[0].fecha_fin + timedelta(days=1)
    
    print(f"Fecha inicio: {fecha_inicio}")
    print(f"Fecha fin: {fecha_fin}")
    
    # Probar PDF
    try:
        print("\n--- Probando PDF ---")
        exporter = ExportFactory.create_exporter('pdf')
        print(f"Exportador PDF creado: {type(exporter).__name__}")
        
        options = {
            'include_descriptions': True,
            'include_attendees': False,
            'include_location': False
        }
        
        response = exporter.export(reservas, fecha_inicio, fecha_fin, options)
        print(f"Respuesta PDF: {type(response).__name__}")
        print(f"Content-Type: {response.get('Content-Type', 'No definido')}")
        print("PDF exportado exitosamente")
        
    except Exception as e:
        print(f"Error en PDF: {str(e)}")
        import traceback
        traceback.print_exc()
    
    # Probar Excel
    try:
        print("\n--- Probando Excel ---")
        exporter = ExportFactory.create_exporter('xlsx')
        print(f"Exportador Excel creado: {type(exporter).__name__}")
        
        options = {
            'include_descriptions': True,
            'include_attendees': False,
            'include_location': False
        }
        
        response = exporter.export(reservas, fecha_inicio, fecha_fin, options)
        print(f"Respuesta Excel: {type(response).__name__}")
        print(f"Content-Type: {response.get('Content-Type', 'No definido')}")
        print("Excel exportado exitosamente")
        
    except Exception as e:
        print(f"Error en Excel: {str(e)}")
        import traceback
        traceback.print_exc()

if __name__ == '__main__':
    test_export()
