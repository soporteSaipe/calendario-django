"""
Vista de exportación simplificada para debugging
"""

import logging
from datetime import datetime
from django.http import JsonResponse
from django.contrib.auth.decorators import login_required

from ..models import Recurso, Reserva
from ..exporters import ExportFactory
from ..constants import ExportConfig

logger = logging.getLogger('calendario')


@login_required
def export_calendar_debug(request):
    """
    Vista de exportación simplificada para debugging
    """
    try:
        # Verificar permisos básicos
        if not request.user.is_staff:
            return JsonResponse({'error': 'Acceso denegado'}, status=403)
        
        # Obtener parámetros básicos
        format_type = request.GET.get('format', 'pdf')
        date_from = request.GET.get('date_from')
        date_to = request.GET.get('date_to')
        
        logger.info(f'Exportación solicitada: formato={format_type}, desde={date_from}, hasta={date_to}')
        
        # Validar parámetros básicos
        if not all([date_from, date_to]):
            return JsonResponse({'error': 'Fechas requeridas'}, status=400)
        
        # Verificar formato soportado
        if not ExportFactory.is_format_supported(format_type):
            supported_formats = ', '.join(ExportFactory.get_supported_formats())
            return JsonResponse({
                'error': f'Formato no soportado: {format_type}. Formatos disponibles: {supported_formats}'
            }, status=400)
        
        # Convertir fechas
        try:
            fecha_inicio = datetime.strptime(date_from, '%Y-%m-%d')
            fecha_fin = datetime.strptime(date_to, '%Y-%m-%d')
        except ValueError as e:
            return JsonResponse({'error': f'Formato de fecha inválido: {str(e)}'}, status=400)
        
        if fecha_inicio > fecha_fin:
            return JsonResponse({'error': 'Fecha de inicio debe ser anterior a fecha de fin'}, status=400)
        
        # Validar rango de fechas
        if (fecha_fin.date() - fecha_inicio.date()).days > ExportConfig.MAX_EXPORT_DAYS:
            return JsonResponse({
                'error': f'El rango de fechas no puede exceder {ExportConfig.MAX_EXPORT_DAYS} días'
            }, status=400)
        
        # Obtener todas las salas activas
        salas_ids = list(Recurso.objects.filter(activo=True).values_list('id', flat=True))
        if not salas_ids:
            return JsonResponse({'error': 'No hay salas disponibles'}, status=404)
        
        logger.info(f'Salas encontradas: {salas_ids}')
        
        # Obtener reservas de manera simple
        reservas = Reserva.objects.filter(
            recurso_id__in=salas_ids,
            fecha_inicio__date__range=[fecha_inicio.date(), fecha_fin.date()],
            estado='confirmada'
        ).select_related('recurso', 'usuario').order_by('fecha_inicio')
        
        logger.info(f'Reservas encontradas: {reservas.count()}')
        
        if not reservas.exists():
            return JsonResponse({
                'error': 'No hay reservas confirmadas en el rango de fechas especificado'
            }, status=404)
        
        # Crear exportador
        exporter = ExportFactory.create_exporter(format_type)
        logger.info(f'Exportador creado: {type(exporter).__name__}')
        
        # Opciones básicas
        options = {
            'include_descriptions': True,
            'include_attendees': False,
            'include_location': False
        }
        
        # Generar exportación
        logger.info('Iniciando generación de exportación...')
        response = exporter.export(reservas, fecha_inicio, fecha_fin, options)
        logger.info('Exportación generada exitosamente')
        
        return response
            
    except Exception as e:
        logger.error(f'Error en export_calendar_debug: {str(e)}', exc_info=True)
        return JsonResponse({'error': f'Error interno del servidor: {str(e)}'}, status=500)
