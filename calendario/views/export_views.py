"""
Vistas para exportación de datos del calendario
"""

import logging
from datetime import datetime
from django.http import JsonResponse
from django.contrib.auth.decorators import login_required

from ..models import Recurso, Reserva
from ..exporters import ExportFactory
from ..decorators import require_staff, log_view_access, measure_performance
from ..query_optimizers import ExportQueryOptimizer
from ..constants import (
    ExportConfig,
    ErrorMessages,
    SuccessMessages
)

logger = logging.getLogger('calendario')


@login_required
@require_staff
@log_view_access
@measure_performance
def export_calendar(request):
    """
    Exportar calendario usando Factory y Strategy patterns
    
    Endpoint: GET /export/
    Parámetros:
        - format: Formato de exportación (pdf, xlsx, excel)
        - date_from: Fecha de inicio (YYYY-MM-DD)
        - date_to: Fecha de fin (YYYY-MM-DD)
        - salas: IDs de salas separados por coma (opcional)
        - include_descriptions: Incluir descripciones (true/false)
        - include_attendees: Incluir asistentes (true/false)
        - include_location: Incluir ubicación (true/false)
    
    Retorna: Archivo de exportación o error JSON
    """
    
    try:
        # Obtener parámetros
        format_type = request.GET.get('format', ExportConfig.DEFAULT_FORMAT)
        date_from = request.GET.get('date_from')
        date_to = request.GET.get('date_to')
        salas = request.GET.get('salas', '').split(',')
        include_descriptions = request.GET.get('include_descriptions', 'false').lower() == 'true'
        include_attendees = request.GET.get('include_attendees', 'false').lower() == 'true'
        include_location = request.GET.get('include_location', 'false').lower() == 'true'
        
        # Validar parámetros
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
        
        # Validar rango de fechas (máximo 1 año)
        if (fecha_fin.date() - fecha_inicio.date()).days > ExportConfig.MAX_EXPORT_DAYS:
            return JsonResponse({
                'error': f'El rango de fechas no puede exceder {ExportConfig.MAX_EXPORT_DAYS} días'
            }, status=400)
        
        # Filtrar salas
        if salas and salas[0]:  # Si se especificaron salas
            try:
                salas_ids = [int(sala) for sala in salas if sala.isdigit()]
                if not salas_ids:
                    return JsonResponse({'error': 'IDs de salas inválidos'}, status=400)
            except ValueError:
                return JsonResponse({'error': 'IDs de salas inválidos'}, status=400)
        else:
            salas_ids = list(Recurso.objects.filter(activo=True).values_list('id', flat=True))
            if not salas_ids:
                return JsonResponse({'error': 'No hay salas disponibles'}, status=404)
        
        # Obtener reservas usando el optimizador
        reservas = ExportQueryOptimizer.get_reservas_para_exportacion(
            salas_ids, fecha_inicio, fecha_fin
        )
        
        # Validar límite de registros
        if reservas.count() > ExportConfig.MAX_RECORDS_PER_EXPORT:
            return JsonResponse({
                'error': f'Demasiados registros para exportar. Máximo: {ExportConfig.MAX_RECORDS_PER_EXPORT}'
            }, status=400)
        
        if not reservas.exists():
            return JsonResponse({
                'error': 'No hay reservas confirmadas en el rango de fechas especificado'
            }, status=404)
        
        # Crear exportador usando Factory
        exporter = ExportFactory.create_exporter(format_type)
        
        # Opciones de exportación
        options = {
            'include_descriptions': include_descriptions,
            'include_attendees': include_attendees,
            'include_location': include_location
        }
        
        logger.info(f'Exportando {reservas.count()} reservas en formato {format_type} para usuario {request.user.username}')
        
        # Generar exportación usando Strategy
        return exporter.export(reservas, fecha_inicio, fecha_fin, options)
            
    except ValueError as e:
        logger.warning(f'Error de validación en export_calendar: {str(e)}')
        return JsonResponse({'error': str(e)}, status=400)
    except Exception as e:
        logger.error(f'Error en export_calendar: {str(e)}', exc_info=True)
        return JsonResponse({'error': ErrorMessages.EXPORT_ERROR.format(error=str(e))}, status=500)
