"""
Vistas API para el sistema de calendario
"""

import logging
from datetime import datetime, time, timedelta
from django.http import JsonResponse
from django.utils import timezone
from django.core.exceptions import ValidationError

from ..models import Recurso, Reserva
from ..utils import ReservaService, DateTimeService
from ..decorators import rate_limit, log_view_access
from ..query_optimizers import ReservaQueryOptimizer
from ..constants import (
    RateLimitConfig,
    ValidationMessages,
    ErrorMessages,
    APIConfig,
    BusinessRules
)
from ..http_responses import HTTP, ERROR_CODES

logger = logging.getLogger('calendario')


@rate_limit(requests_per_minute=RateLimitConfig.API_REQUESTS)
@log_view_access
def api_sala_detalles(request, sala_id):
    """
    API para obtener los detalles completos de una sala
    
    Endpoint: GET /api/sala/<id>/detalles/
    
    Retorna: Detalles completos de la sala incluyendo características
    """
    try:
        # Obtener la sala
        sala = Recurso.objects.get(id=sala_id, activo=True)
        
        # Obtener características activas
        caracteristicas = sala.get_caracteristicas_activas()
        
        # Obtener descripción completa
        descripcion_completa = sala.get_descripcion_completa()
        
        # Obtener horario de uso
        horario_uso = sala.horario_uso or 'Lunes a Viernes de 7:00 AM a 4:00 PM'
        
        # Datos de respuesta
        datos_sala = {
            'id': sala.id,
            'nombre': sala.nombre,
            'descripcion': sala.descripcion,
            'descripcion_detallada': descripcion_completa,
            'capacidad': sala.capacidad,
            'color': sala.color,
            'horario_uso': horario_uso,
            'caracteristicas': caracteristicas,
            'activo': sala.activo
        }
        
        logger.info(f'Detalles de sala obtenidos: {sala.nombre}')
        return JsonResponse(datos_sala)
        
    except Recurso.DoesNotExist:
        logger.warning(f'Sala no encontrada: {sala_id}')
        return HTTP.not_found(
            message=ValidationMessages.RESOURCE_NOT_FOUND,
            resource_type='sala',
            resource_id=sala_id
        )
    except Exception as e:
        logger.error(f'Error obteniendo detalles de sala {sala_id}: {str(e)}')
        return HTTP.server_error(
            message=ErrorMessages.INTERNAL_SERVER_ERROR
        )


@rate_limit(requests_per_minute=RateLimitConfig.API_REQUESTS)
@log_view_access
def api_reservas(request):
    """
    API para obtener las reservas en formato JSON para el calendario
    
    Endpoint: GET /api/reservas/
    Parámetros:
        - start: Fecha de inicio (ISO format)
        - end: Fecha de fin (ISO format)
        - sala: ID de la sala (opcional)
    
    Retorna: Lista de eventos en formato JSON para FullCalendar
    """
    fecha_inicio = request.GET.get('start')
    fecha_fin = request.GET.get('end')
    sala_id = request.GET.get('sala')
    
    logger.debug(f'API reservas - Parámetros: start={fecha_inicio}, end={fecha_fin}, sala={sala_id}')
    
    # Usar optimizador de consultas
    fecha_inicio_dt = None
    fecha_fin_dt = None
    sala_id_int = None
    
    if fecha_inicio and fecha_fin:
        try:
            fecha_inicio_dt = datetime.fromisoformat(fecha_inicio.replace('Z', '+00:00'))
            fecha_fin_dt = datetime.fromisoformat(fecha_fin.replace('Z', '+00:00'))
            logger.debug(f'Filtro de fecha aplicado: {fecha_inicio_dt} - {fecha_fin_dt}')
        except (ValueError, AttributeError) as e:
            logger.warning(f'Error parseando fechas en API: {str(e)}')
    
    # Rango por defecto si no se envían start/end (evita devolver todas las reservas)
    if fecha_inicio_dt is None or fecha_fin_dt is None:
        now = timezone.now()
        fecha_inicio_dt = now - timedelta(days=APIConfig.API_DEFAULT_PAST_DAYS)
        fecha_fin_dt = now + timedelta(days=BusinessRules.MAX_FUTURE_DAYS)
        logger.debug(f'Usando rango por defecto: {fecha_inicio_dt} - {fecha_fin_dt}')
    
    if sala_id and sala_id != 'todas':
        try:
            sala_id_int = int(sala_id)
            logger.debug(f'Filtro de sala aplicado: {sala_id}')
        except ValueError as e:
            logger.warning(f'Error parseando sala_id: {str(e)}')
    
    # Obtener reservas usando el optimizador (con límite para evitar respuestas excesivas)
    reservas = ReservaQueryOptimizer.get_reservas_para_calendario(
        fecha_inicio=fecha_inicio_dt,
        fecha_fin=fecha_fin_dt,
        sala_id=sala_id_int
    )[:APIConfig.API_MAX_RESERVAS]
    
    eventos = [
        {
            'id': reserva.id,
            'title': reserva.titulo,
            'start': reserva.fecha_inicio.isoformat(),
            'end': reserva.fecha_fin.isoformat(),
            'color': reserva.recurso.color,
            'resourceId': reserva.recurso.id,
            'extendedProps': {
                'descripcion': reserva.descripcion,
                'usuario': reserva.usuario.username,
                'estado': reserva.estado,
                'sala': reserva.recurso.nombre,
                'capacidad': reserva.recurso.capacidad,
            }
        }
        for reserva in reservas
    ]
    
    logger.debug(f'API reservas - Retornando {len(eventos)} eventos')
    
    return JsonResponse(eventos, safe=False)


def api_horarios_ocupados(request):
    """
    API para obtener horarios ocupados de una sala en una fecha específica
    
    Endpoint: GET /api/horarios-ocupados/
    Parámetros:
        - recurso_id: ID del recurso
        - fecha: Fecha en formato YYYY-MM-DD
    
    Retorna: Lista de horarios ocupados con restricciones específicas
    """
    recurso_id = request.GET.get('recurso_id')
    fecha = request.GET.get('fecha')
    
    if not recurso_id or not fecha:
        return HTTP.bad_request(
            message='recurso_id y fecha son requeridos',
            error_code=ERROR_CODES.MISSING_REQUIRED_FIELD,
            details={'required_params': ['recurso_id', 'fecha']},
            request=request
        )
    
    try:
        # Convertir fecha a datetime
        fecha_dt = datetime.strptime(fecha, '%Y-%m-%d').date()
        fecha_inicio = timezone.make_aware(datetime.combine(fecha_dt, time.min))
        fecha_fin = timezone.make_aware(datetime.combine(fecha_dt, time.max))
        
        # Obtener reservas confirmadas para esa sala y fecha
        reservas = Reserva.objects.filter(
            recurso_id=recurso_id,
            estado='confirmada',
            fecha_inicio__date=fecha_dt
        ).values('fecha_inicio', 'fecha_fin')
        
        # Convertir a formato de horas para el frontend
        horarios_ocupados = []
        for reserva in reservas:
            inicio = reserva['fecha_inicio'].time()
            fin = reserva['fecha_fin'].time()
            horarios_ocupados.append({
                'inicio': inicio.strftime('%H:%M'),
                'fin': fin.strftime('%H:%M'),
                'tipo': 'reserva'
            })
        
        # Obtener restricciones específicas del recurso
        try:
            recurso = Recurso.objects.get(id=recurso_id)
            horarios_restringidos = recurso.get_horarios_restringidos()
            horarios_ocupados.extend(horarios_restringidos)
        except Recurso.DoesNotExist:
            pass
        
        return JsonResponse({
            'horarios_ocupados': horarios_ocupados,
            'fecha': fecha,
            'recurso_id': recurso_id
        })
        
    except ValueError as e:
        return HTTP.bad_request(
            message=f'Formato de fecha inválido: {str(e)}',
            error_code=ERROR_CODES.INVALID_DATE_FORMAT,
            details={'received_date': fecha},
            request=request
        )
    except Exception as e:
        logger.error(f'Error en api_horarios_ocupados: {str(e)}', exc_info=True)
        return HTTP.internal_server_error(
            message=ErrorMessages.UNEXPECTED_ERROR.format(error=str(e)),
            request=request
        )


@rate_limit(requests_per_minute=RateLimitConfig.VALIDATION_REQUESTS)
@log_view_access
def api_validar_conflicto(request):
    """
    API para validar conflictos de reservas en tiempo real
    
    Endpoint: GET /api/validar-conflicto/
    Parámetros:
        - sala: ID de la sala
        - fecha: Fecha en formato YYYY-MM-DD
        - hora_inicio: Hora de inicio en formato HH:MM
        - hora_fin: Hora de fin en formato HH:MM
    
    Retorna: Resultado de la validación con posibles conflictos
    """
    if request.method != 'GET':
        return HTTP.method_not_allowed(
            allowed_methods=['GET'],
            request=request
        )
    
    try:
        # Obtener parámetros
        sala_id = request.GET.get('sala')
        fecha = request.GET.get('fecha')
        hora_inicio = request.GET.get('hora_inicio')
        hora_fin = request.GET.get('hora_fin')
        
        logger.debug(f'API validar conflicto - Parámetros: sala={sala_id}, fecha={fecha}, hora_inicio={hora_inicio}, hora_fin={hora_fin}')
        
        if not all([sala_id, fecha, hora_inicio, hora_fin]):
            logger.warning('Parámetros faltantes en API validar conflicto')
            return HTTP.bad_request(
                message='Parámetros faltantes',
                error_code=ERROR_CODES.MISSING_REQUIRED_FIELD,
                details={'required_params': ['sala', 'fecha', 'hora_inicio', 'hora_fin']},
                request=request
            )
        
        # Obtener recurso
        try:
            recurso = Recurso.objects.get(id=sala_id, activo=True)
        except Recurso.DoesNotExist:
            logger.warning(f'Recurso no encontrado: {sala_id}')
            return HTTP.not_found(
                message=ValidationMessages.RESOURCE_NOT_FOUND,
                resource_type='sala',
                resource_id=str(sala_id),
                request=request
            )
        
        # Crear fechas usando el servicio
        try:
            fecha_inicio = DateTimeService.parse_datetime_from_form(fecha, hora_inicio)
            fecha_fin = DateTimeService.parse_datetime_from_form(fecha, hora_fin)
        except ValidationError as e:
            logger.warning(f'Error parseando fechas en validación: {str(e)}')
            return HTTP.bad_request(
                message=str(e),
                error_code=ERROR_CODES.INVALID_DATE_FORMAT,
                request=request
            )
        
        # Usar el servicio para validar la reserva
        try:
            ReservaService.validar_reserva_completa(recurso, fecha_inicio, fecha_fin)
            
            logger.debug('Validación completada: válida=True')
            
            return JsonResponse({
                'conflicts': [],
                'valid': True,
                'fecha': fecha,
                'hora_inicio': hora_inicio,
                'hora_fin': hora_fin,
                'sala_id': sala_id
            })
            
        except Exception as validation_error:
            # El middleware manejará las excepciones específicas
            # Aquí solo capturamos cualquier error de validación
            conflictos = [{
                'type': 'validation_error',
                'message': str(validation_error)
            }]
            
            logger.debug(f'Validación completada: válida=False, errores={len(conflictos)}')
            
            return HTTP.unprocessable_entity(
                message='La reserva no puede ser realizada',
                validation_errors={
                    'conflicts': conflictos,
                    'fecha': fecha,
                    'hora_inicio': hora_inicio,
                    'hora_fin': hora_fin,
                    'sala_id': sala_id
                },
                request=request
            )
        
    except Exception as e:
        logger.error(f'Error inesperado en API validar conflicto: {str(e)}', exc_info=True)
        return HTTP.internal_server_error(
            message=ErrorMessages.UNEXPECTED_ERROR.format(error=str(e)),
            request=request
        )
