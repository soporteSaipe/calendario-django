"""
Decoradores personalizados para el sistema de calendario
Elimina duplicación de código y centraliza funcionalidad común
"""

import logging
from functools import wraps
from django.http import JsonResponse
from django.contrib import messages
from django.shortcuts import redirect
from django.core.exceptions import ValidationError

from .constants import (
    RateLimitConfig,
    ValidationMessages,
    ErrorMessages
)

logger = logging.getLogger('calendario')


def rate_limit(requests_per_minute=None, window_seconds=None, error_message=None):
    """
    Decorador para aplicar rate limiting a las vistas
    
    Args:
        requests_per_minute: Número de requests permitidos por minuto
        window_seconds: Ventana de tiempo en segundos (default: 60)
        error_message: Mensaje personalizado de error
    
    Usage:
        @rate_limit(requests_per_minute=10)
        def crear_reserva(request):
            # ...
    """
    def decorator(view_func):
        @wraps(view_func)
        def wrapper(request, *args, **kwargs):
            # Verificar si el usuario ha excedido el límite
            if getattr(request, 'limited', False):
                error_msg = error_message or ValidationMessages.RATE_LIMIT_EXCEEDED
                logger.warning(f'Rate limit excedido para usuario: {request.user.username if request.user.is_authenticated else "Anónimo"}')
                
                # Verificar si es una petición AJAX
                is_ajax = request.headers.get('X-Requested-With') == 'XMLHttpRequest'
                if is_ajax:
                    return JsonResponse({
                        'success': False,
                        'error': error_msg,
                        'error_type': 'rate_limit_exceeded',
                        'retry_after': window_seconds or RateLimitConfig.WINDOW_SECONDS
                    }, status=429)
                else:
                    messages.error(request, error_msg)
                    return redirect('calendario:calendario')
            
            return view_func(request, *args, **kwargs)
        return wrapper
    return decorator


def require_authentication(view_func):
    """
    Decorador para requerir autenticación
    
    Usage:
        @require_authentication
        def vista_protegida(request):
            # ...
    """
    @wraps(view_func)
    def wrapper(request, *args, **kwargs):
        if not request.user.is_authenticated:
            logger.warning('Intento de acceso sin autenticación')
            messages.error(request, 'Debes iniciar sesión para acceder a esta página.')
            return redirect('login')
        return view_func(request, *args, **kwargs)
    return wrapper


def require_staff(view_func):
    """
    Decorador para requerir permisos de staff
    
    Usage:
        @require_staff
        def vista_admin(request):
            # ...
    """
    @wraps(view_func)
    def wrapper(request, *args, **kwargs):
        if not request.user.is_staff and not request.user.is_superuser:
            logger.warning(f'Intento de acceso a vista admin por usuario no staff: {request.user.username}')
            messages.error(request, 'No tienes permisos para acceder a esta página.')
            return redirect('calendario:calendario')
        return view_func(request, *args, **kwargs)
    return wrapper


def validate_request_data(required_fields=None, optional_fields=None):
    """
    Decorador para validar datos de request
    
    Args:
        required_fields: Lista de campos obligatorios
        optional_fields: Lista de campos opcionales
    
    Usage:
        @validate_request_data(['recurso', 'titulo', 'fecha'])
        def crear_reserva(request):
            # ...
    """
    def decorator(view_func):
        @wraps(view_func)
        def wrapper(request, *args, **kwargs):
            if request.method == 'POST':
                # Validar campos obligatorios
                if required_fields:
                    missing_fields = []
                    for field in required_fields:
                        value = request.POST.get(field)
                        if not value or value.strip() == '':
                            missing_fields.append(field)
                    
                    if missing_fields:
                        error_msg = ValidationMessages.REQUIRED_FIELDS.format(fields=', '.join(missing_fields))
                        logger.warning(f'Campos faltantes en {view_func.__name__}: {missing_fields}')
                        
                        is_ajax = request.headers.get('X-Requested-With') == 'XMLHttpRequest'
                        if is_ajax:
                            return JsonResponse({'success': False, 'error': error_msg}, status=400)
                        else:
                            messages.error(request, error_msg)
                            return redirect('calendario:calendario')
                
                # Validar campos opcionales (si se proporcionan)
                if optional_fields:
                    for field in optional_fields:
                        value = request.POST.get(field)
                        if value and value.strip() == '':
                            logger.warning(f'Campo opcional vacío en {view_func.__name__}: {field}')
            
            return view_func(request, *args, **kwargs)
        return wrapper
    return decorator


def handle_ajax_response(view_func):
    """
    Decorador para manejar respuestas AJAX de forma consistente
    
    Usage:
        @handle_ajax_response
        def vista_con_ajax(request):
            # ...
    """
    @wraps(view_func)
    def wrapper(request, *args, **kwargs):
        is_ajax = request.headers.get('X-Requested-With') == 'XMLHttpRequest'
        
        try:
            response = view_func(request, *args, **kwargs)
            
            # Si la vista retorna un HttpResponse, devolverlo tal como está
            if hasattr(response, 'status_code'):
                return response
            
            # Si es una respuesta AJAX, convertir a JSON
            if is_ajax:
                if isinstance(response, dict):
                    return JsonResponse(response)
                else:
                    return JsonResponse({'success': True, 'data': response})
            
            return response
            
        except ValidationError as e:
            error_msg = str(e)
            logger.warning(f'Error de validación en {view_func.__name__}: {error_msg}')
            
            if is_ajax:
                return JsonResponse({
                    'success': False,
                    'error': error_msg,
                    'error_type': 'validation_error'
                }, status=400)
            else:
                messages.error(request, error_msg)
                return redirect('calendario:calendario')
                
        except Exception as e:
            error_msg = ErrorMessages.UNEXPECTED_ERROR.format(error=str(e))
            logger.error(f'Error inesperado en {view_func.__name__}: {str(e)}', exc_info=True)
            
            if is_ajax:
                return JsonResponse({
                    'success': False,
                    'error': error_msg,
                    'error_type': 'server_error'
                }, status=500)
            else:
                messages.error(request, error_msg)
                return redirect('calendario:calendario')
    
    return wrapper


def log_view_access(view_func):
    """
    Decorador para logging de acceso a vistas
    
    Usage:
        @log_view_access
        def vista_importante(request):
            # ...
    """
    @wraps(view_func)
    def wrapper(request, *args, **kwargs):
        logger.info(f'Acceso a {view_func.__name__} por usuario: {request.user.username if request.user.is_authenticated else "Anónimo"}')
        return view_func(request, *args, **kwargs)
    return wrapper


def cache_view_result(cache_key_func, timeout=300):
    """
    Decorador para cachear resultados de vistas
    
    Args:
        cache_key_func: Función que genera la clave de cache
        timeout: Tiempo de expiración en segundos
    
    Usage:
        @cache_view_result(lambda request: f'vista_{request.user.id}')
        def vista_cacheable(request):
            # ...
    """
    def decorator(view_func):
        @wraps(view_func)
        def wrapper(request, *args, **kwargs):
            from django.core.cache import cache
            
            # Generar clave de cache
            cache_key = cache_key_func(request, *args, **kwargs)
            
            # Intentar obtener resultado del cache
            cached_result = cache.get(cache_key)
            if cached_result is not None:
                logger.debug(f'Cache hit para {view_func.__name__}: {cache_key}')
                return cached_result
            
            # Ejecutar vista y cachear resultado
            result = view_func(request, *args, **kwargs)
            cache.set(cache_key, result, timeout)
            logger.debug(f'Resultado cacheado para {view_func.__name__}: {cache_key}')
            
            return result
        return wrapper
    return decorator


def validate_resource_access(view_func):
    """
    Decorador para validar acceso a recursos
    
    Usage:
        @validate_resource_access
        def editar_reserva(request, reserva_id):
            # ...
    """
    @wraps(view_func)
    def wrapper(request, *args, **kwargs):
        # Si hay un reserva_id en los kwargs, validar que pertenece al usuario
        if 'reserva_id' in kwargs:
            from .models import Reserva
            from django.shortcuts import get_object_or_404
            
            reserva_id = kwargs['reserva_id']
            reserva = get_object_or_404(Reserva, id=reserva_id, usuario=request.user)
            kwargs['reserva'] = reserva  # Pasar la reserva validada a la vista
        
        return view_func(request, *args, **kwargs)
    return wrapper


def measure_performance(view_func):
    """
    Decorador para medir performance de vistas
    
    Usage:
        @measure_performance
        def vista_lenta(request):
            # ...
    """
    @wraps(view_func)
    def wrapper(request, *args, **kwargs):
        import time
        start_time = time.time()
        
        result = view_func(request, *args, **kwargs)
        
        execution_time = time.time() - start_time
        logger.info(f'Vista {view_func.__name__} ejecutada en {execution_time:.3f} segundos')
        
        # Log warning si la vista es muy lenta
        if execution_time > 2.0:
            logger.warning(f'Vista {view_func.__name__} tardó {execution_time:.3f} segundos (lenta)')
        
        return result
    return wrapper
