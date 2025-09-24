"""
Middleware personalizado para el sistema de calendario
"""
import logging
import traceback
from django.http import JsonResponse
from django.core.exceptions import ValidationError
from django.utils.deprecation import MiddlewareMixin
from .exceptions import (
    ReservaValidationError, 
    RecursoNotFoundError, 
    ConflictoReservaError,
    RestriccionHorarioError,
    FechaInvalidaError,
    HorarioTrabajoError
)
# from django_ratelimit.exceptions import Ratelimited  # Temporalmente deshabilitado

logger = logging.getLogger('calendario')


class CalendarioErrorMiddleware(MiddlewareMixin):
    """
    Middleware para manejo centralizado de errores del sistema de calendario
    """
    
    def process_exception(self, request, exception):
        """
        Procesar excepciones específicas del sistema de calendario
        """
        # Solo procesar excepciones en rutas del calendario
        if not request.path.startswith('/calendario/'):
            return None
        
        # Log del error
        logger.error(f'Error en {request.path}: {str(exception)}', exc_info=True)
        
        # Determinar si es una petición AJAX
        is_ajax = request.headers.get('X-Requested-With') == 'XMLHttpRequest'
        
        # Manejar excepciones específicas
        # if isinstance(exception, Ratelimited):
        #     return self._handle_rate_limit_error(request, exception, is_ajax)
        if isinstance(exception, ReservaValidationError):
            return self._handle_validation_error(request, exception, is_ajax)
        elif isinstance(exception, RecursoNotFoundError):
            return self._handle_recurso_not_found(request, exception, is_ajax)
        elif isinstance(exception, ConflictoReservaError):
            return self._handle_conflicto_reserva(request, exception, is_ajax)
        elif isinstance(exception, RestriccionHorarioError):
            return self._handle_restriccion_horario(request, exception, is_ajax)
        elif isinstance(exception, FechaInvalidaError):
            return self._handle_fecha_invalida(request, exception, is_ajax)
        elif isinstance(exception, HorarioTrabajoError):
            return self._handle_horario_trabajo(request, exception, is_ajax)
        elif isinstance(exception, ValidationError):
            return self._handle_django_validation_error(request, exception, is_ajax)
        
        # Para otras excepciones, no hacer nada (dejar que Django las maneje)
        return None
    
    def _handle_rate_limit_error(self, request, exception, is_ajax):
        """Manejar errores de rate limiting"""
        error_data = {
            'success': False,
            'error': 'Has alcanzado el límite de solicitudes. Intenta en unos minutos.',
            'error_type': 'rate_limit_exceeded',
            'retry_after': 60
        }
        
        logger.warning(f'Rate limit excedido en {request.path} por usuario: {request.user.username if request.user.is_authenticated else "Anónimo"}')
        
        if is_ajax:
            return JsonResponse(error_data, status=429)
        else:
            from django.contrib import messages
            messages.error(request, error_data['error'])
            return None
    
    def _handle_validation_error(self, request, exception, is_ajax):
        """Manejar errores de validación de reservas"""
        error_data = {
            'success': False,
            'error': str(exception),
            'error_type': 'validation_error',
            'error_code': getattr(exception, 'error_code', None)
        }
        
        if is_ajax:
            return JsonResponse(error_data, status=400)
        else:
            from django.contrib import messages
            messages.error(request, str(exception))
            return None
    
    def _handle_recurso_not_found(self, request, exception, is_ajax):
        """Manejar cuando un recurso no se encuentra"""
        error_data = {
            'success': False,
            'error': 'El recurso seleccionado no existe o no está activo',
            'error_type': 'resource_not_found',
            'recurso_id': exception.recurso_id
        }
        
        if is_ajax:
            return JsonResponse(error_data, status=404)
        else:
            from django.contrib import messages
            messages.error(request, error_data['error'])
            return None
    
    def _handle_conflicto_reserva(self, request, exception, is_ajax):
        """Manejar conflictos de reservas"""
        error_data = {
            'success': False,
            'error': str(exception),
            'error_type': 'conflict_error',
            'reserva_conflicto': {
                'id': exception.reserva_conflicto.id,
                'titulo': exception.reserva_conflicto.titulo,
                'fecha_inicio': exception.reserva_conflicto.fecha_inicio.isoformat(),
                'fecha_fin': exception.reserva_conflicto.fecha_fin.isoformat()
            }
        }
        
        if is_ajax:
            return JsonResponse(error_data, status=409)  # Conflict
        else:
            from django.contrib import messages
            messages.error(request, str(exception))
            return None
    
    def _handle_restriccion_horario(self, request, exception, is_ajax):
        """Manejar restricciones de horario"""
        error_data = {
            'success': False,
            'error': str(exception),
            'error_type': 'time_restriction',
            'restriccion': exception.restriccion,
            'recurso': exception.recurso.nombre
        }
        
        if is_ajax:
            return JsonResponse(error_data, status=422)  # Unprocessable Entity
        else:
            from django.contrib import messages
            messages.error(request, str(exception))
            return None
    
    def _handle_fecha_invalida(self, request, exception, is_ajax):
        """Manejar fechas inválidas"""
        error_data = {
            'success': False,
            'error': str(exception),
            'error_type': 'invalid_date'
        }
        
        if is_ajax:
            return JsonResponse(error_data, status=400)
        else:
            from django.contrib import messages
            messages.error(request, str(exception))
            return None
    
    def _handle_horario_trabajo(self, request, exception, is_ajax):
        """Manejar errores de horario de trabajo"""
        error_data = {
            'success': False,
            'error': str(exception),
            'error_type': 'working_hours'
        }
        
        if is_ajax:
            return JsonResponse(error_data, status=422)
        else:
            from django.contrib import messages
            messages.error(request, str(exception))
            return None
    
    def _handle_django_validation_error(self, request, exception, is_ajax):
        """Manejar errores de validación de Django"""
        error_data = {
            'success': False,
            'error': 'Error de validación en los datos enviados',
            'error_type': 'django_validation',
            'details': exception.message if hasattr(exception, 'message') else str(exception)
        }
        
        if is_ajax:
            return JsonResponse(error_data, status=400)
        else:
            from django.contrib import messages
            messages.error(request, error_data['error'])
            return None


class RequestLoggingMiddleware(MiddlewareMixin):
    """
    Middleware para logging de requests importantes
    """
    
    def process_request(self, request):
        """Log de requests importantes"""
        if request.path.startswith('/calendario/'):
            logger.info(f'Request: {request.method} {request.path} - Usuario: {request.user.username if request.user.is_authenticated else "Anónimo"} - IP: {self._get_client_ip(request)}')
    
    def _get_client_ip(self, request):
        """Obtener IP del cliente"""
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip = x_forwarded_for.split(',')[0]
        else:
            ip = request.META.get('REMOTE_ADDR')
        return ip
