"""
Vista de exportación simplificada para producción
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
def export_calendar_simple(request):
    """
    Vista de exportación completamente simplificada
    """
    try:
        # Verificar permisos de staff
        if not request.user.is_staff:
            return JsonResponse({'error': 'Acceso denegado'}, status=403)
        
        logger.info(f'Exportación solicitada por: {request.user.username}')
        
        # Obtener parámetros básicos
        format_type = request.GET.get('format', 'pdf')
        date_from = request.GET.get('date_from')
        date_to = request.GET.get('date_to')
        
        logger.info(f'Parámetros: formato={format_type}, desde={date_from}, hasta={date_to}')
        
        # Validar parámetros básicos
        if not all([date_from, date_to]):
            logger.warning('Fechas faltantes en la solicitud')
            return JsonResponse({'error': 'Fechas requeridas'}, status=400)
        
        # Verificar formato soportado
        if not ExportFactory.is_format_supported(format_type):
            supported_formats = ', '.join(ExportFactory.get_supported_formats())
            logger.warning(f'Formato no soportado: {format_type}')
            return JsonResponse({
                'error': f'Formato no soportado: {format_type}. Formatos disponibles: {supported_formats}'
            }, status=400)
        
        # Convertir fechas
        try:
            fecha_inicio = datetime.strptime(date_from, '%Y-%m-%d')
            fecha_fin = datetime.strptime(date_to, '%Y-%m-%d')
            logger.info(f'Fechas convertidas: {fecha_inicio} - {fecha_fin}')
        except ValueError as e:
            logger.error(f'Error parseando fechas: {str(e)}')
            return JsonResponse({'error': f'Formato de fecha inválido: {str(e)}'}, status=400)
        
        if fecha_inicio > fecha_fin:
            logger.warning('Fecha de inicio posterior a fecha de fin')
            return JsonResponse({'error': 'Fecha de inicio debe ser anterior a fecha de fin'}, status=400)
        
        # Validar rango de fechas
        if (fecha_fin.date() - fecha_inicio.date()).days > ExportConfig.MAX_EXPORT_DAYS:
            logger.warning(f'Rango de fechas excede el límite: {(fecha_fin.date() - fecha_inicio.date()).days} días')
            return JsonResponse({
                'error': f'El rango de fechas no puede exceder {ExportConfig.MAX_EXPORT_DAYS} días'
            }, status=400)
        
        # Obtener todas las salas activas
        try:
            salas_ids = list(Recurso.objects.filter(activo=True).values_list('id', flat=True))
            logger.info(f'Salas activas encontradas: {salas_ids}')
        except Exception as e:
            logger.error(f'Error obteniendo salas: {str(e)}')
            return JsonResponse({'error': 'Error obteniendo salas disponibles'}, status=500)
        
        if not salas_ids:
            logger.warning('No hay salas activas')
            return JsonResponse({'error': 'No hay salas disponibles'}, status=404)
        
        # Obtener reservas
        try:
            reservas = Reserva.objects.filter(
                recurso_id__in=salas_ids,
                fecha_inicio__date__range=[fecha_inicio.date(), fecha_fin.date()],
                estado='confirmada'
            ).select_related('recurso', 'usuario').order_by('fecha_inicio')
            
            reservas_count = reservas.count()
            logger.info(f'Reservas encontradas: {reservas_count}')
        except Exception as e:
            logger.error(f'Error obteniendo reservas: {str(e)}')
            return JsonResponse({'error': 'Error obteniendo reservas'}, status=500)
        
        # Validar límite de registros
        if reservas_count > ExportConfig.MAX_RECORDS_PER_EXPORT:
            logger.warning(f'Demasiados registros: {reservas_count}')
            return JsonResponse({
                'error': f'Demasiados registros para exportar. Máximo: {ExportConfig.MAX_RECORDS_PER_EXPORT}'
            }, status=400)
        
        if reservas_count == 0:
            logger.info('No hay reservas para exportar')
            return JsonResponse({
                'error': 'No hay reservas confirmadas en el rango de fechas especificado'
            }, status=404)
        
        # Crear exportador
        try:
            logger.info(f'Creando exportador para formato: {format_type}')
            exporter = ExportFactory.create_exporter(format_type)
            logger.info(f'Exportador creado: {type(exporter).__name__}')
        except Exception as e:
            logger.error(f'Error creando exportador: {str(e)}')
            return JsonResponse({'error': 'Error creando exportador'}, status=500)
        
        # Opciones básicas
        options = {
            'include_descriptions': True,
            'include_attendees': False,
            'include_location': False
        }
        
        # Generar exportación
        try:
            logger.info('Iniciando generación de exportación...')
            response = exporter.export(reservas, fecha_inicio, fecha_fin, options)
            logger.info('Exportación generada exitosamente')
            return response
        except Exception as e:
            logger.error(f'Error generando exportación: {str(e)}')
            import traceback
            logger.error(f'Traceback: {traceback.format_exc()}')
            return JsonResponse({'error': f'Error generando exportación: {str(e)}'}, status=500)
            
    except Exception as e:
        logger.error(f'Error inesperado en export_calendar_simple: {str(e)}')
        import traceback
        logger.error(f'Traceback completo: {traceback.format_exc()}')
        return JsonResponse({'error': f'Error inesperado: {str(e)}'}, status=500)
