"""
Vistas API para el sistema de calendario
"""

import logging
from datetime import datetime, time, timedelta
from django.http import JsonResponse
from django.utils import timezone
from django.core.exceptions import ValidationError
from django.views.decorators.http import require_GET
from ..exceptions import ConflictoReservaError, FechaInvalidaError, HorarioTrabajoError, RestriccionHorarioError

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


@require_GET
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
        return HTTP.internal_server_error(
            message='No se pudieron obtener los detalles del recurso.'
        )


@require_GET
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
    
    if fecha_inicio or fecha_fin:
        if not fecha_inicio or not fecha_fin:
            return HTTP.bad_request(message='start y end deben enviarse juntos.', request=request)
        try:
            fecha_inicio_dt = datetime.fromisoformat(fecha_inicio.replace('Z', '+00:00'))
            fecha_fin_dt = datetime.fromisoformat(fecha_fin.replace('Z', '+00:00'))
            if timezone.is_naive(fecha_inicio_dt):
                fecha_inicio_dt = timezone.make_aware(fecha_inicio_dt)
            if timezone.is_naive(fecha_fin_dt):
                fecha_fin_dt = timezone.make_aware(fecha_fin_dt)
            if not timedelta(0) < fecha_fin_dt - fecha_inicio_dt <= timedelta(days=366):
                raise ValueError
        except (ValueError, OverflowError):
            return HTTP.bad_request(message='Rango de fechas inválido (máximo 366 días).', request=request)
    else:
        now = timezone.now()
        fecha_inicio_dt = now - timedelta(days=APIConfig.API_DEFAULT_PAST_DAYS)
        fecha_fin_dt = now + timedelta(days=BusinessRules.MAX_FUTURE_DAYS)
    if sala_id and sala_id != 'todas':
        try:
            sala_id_int = int(sala_id)
            if not 0 < sala_id_int <= 2147483647:
                raise ValueError
        except (ValueError, OverflowError):
            return HTTP.bad_request(message='El recurso debe ser un identificador válido.', request=request)

    # Obtener reservas usando el optimizador (con límite para evitar respuestas excesivas)
    reservas = list(ReservaQueryOptimizer.get_reservas_para_calendario(
        fecha_inicio=fecha_inicio_dt,
        fecha_fin=fecha_fin_dt,
        sala_id=sala_id_int
    )[:APIConfig.API_MAX_RESERVAS + 1])
    if len(reservas) > APIConfig.API_MAX_RESERVAS:
        return HTTP.unprocessable_entity(
            message='Hay demasiadas reservas. Selecciona un recurso o un período más corto.', request=request)
    
    eventos = [
        {
            'id': reserva.id,
            'title': reserva.titulo if request.user.is_authenticated else 'Reservado',
            'start': reserva.fecha_inicio.isoformat(),
            'end': reserva.fecha_fin.isoformat(),
            'color': reserva.recurso.color,
            'resourceId': reserva.recurso.id,
            'extendedProps': {
                'descripcion': reserva.descripcion if request.user.is_authenticated else '',
                'usuario': reserva.usuario.username if request.user.is_authenticated else '',
                'estado': reserva.estado,
                'sala': reserva.recurso.nombre,
                'capacidad': reserva.recurso.capacidad,
            }
        }
        for reserva in reservas
    ]
    
    logger.debug(f'API reservas - Retornando {len(eventos)} eventos')
    
    return JsonResponse(eventos, safe=False)


@require_GET
@rate_limit(requests_per_minute=RateLimitConfig.API_REQUESTS)
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
        recurso_id = int(recurso_id)
        if not 0 < recurso_id <= 2147483647:
            raise ValueError
        fecha_dt = datetime.strptime(fecha, '%Y-%m-%d').date()
        fecha_inicio = timezone.make_aware(datetime.combine(fecha_dt, time.min))
        fecha_fin = fecha_inicio + timedelta(days=1)
        try:
            recurso = Recurso.objects.get(id=recurso_id, activo=True)
        except Recurso.DoesNotExist:
            return HTTP.not_found(message=ValidationMessages.RESOURCE_NOT_FOUND, request=request)
        reservas = Reserva.objects.filter(
            recurso=recurso,
            estado__in=('confirmada', 'en_curso'),
            fecha_inicio__lt=fecha_fin,
            fecha_fin__gt=fecha_inicio,
        ).values('fecha_inicio', 'fecha_fin')
        horarios_ocupados = []
        for reserva in reservas:
            inicio = max(timezone.localtime(reserva['fecha_inicio']), fecha_inicio)
            fin = min(timezone.localtime(reserva['fecha_fin']), fecha_fin)
            horarios_ocupados.append({
                'inicio': inicio.strftime('%H:%M'),
                'fin': '24:00' if fin == fecha_fin else fin.strftime('%H:%M'),
                'tipo': 'reserva',
            })
        horarios_ocupados.extend(recurso.get_horarios_restringidos())

        return JsonResponse({
            'horarios_ocupados': horarios_ocupados,
            'fecha': fecha,
            'recurso_id': recurso_id
        })
        
    except ValueError as e:
        return HTTP.bad_request(
            message='Fecha o recurso inválido.',
            error_code=ERROR_CODES.INVALID_DATE_FORMAT,
            details={'received_date': fecha},
            request=request
        )
    except Exception as e:
        logger.error(f'Error en api_horarios_ocupados: {str(e)}', exc_info=True)
        return HTTP.internal_server_error(
            message='No se pudo completar la consulta.',
            request=request
        )


@require_GET
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
        except (Recurso.DoesNotExist, ValueError, OverflowError):
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
            fecha_fin = DateTimeService.parse_datetime_from_form(
                request.GET.get('fecha_vuelta') or fecha if recurso.es_vehiculo() else fecha, hora_fin
            )
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
            
        except (ValidationError, ConflictoReservaError, FechaInvalidaError, HorarioTrabajoError, RestriccionHorarioError) as validation_error:
            # El middleware manejará las excepciones específicas
            # Aquí solo capturamos cualquier error de validación
            conflictos = [{
                'type': 'validation_error',
                'message': ('El recurso ya está reservado en ese horario.'
                            if isinstance(validation_error, ConflictoReservaError) and not request.user.is_authenticated
                            else str(validation_error))
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
            message='No se pudo completar la consulta.',
            request=request
        )
