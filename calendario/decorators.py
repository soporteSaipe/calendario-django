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
            from django.core.cache import cache
            from hashlib import sha256
            import time
            from .http_responses import HTTP

            window = window_seconds or RateLimitConfig.WINDOW_SECONDS
            limit = requests_per_minute or RateLimitConfig.API_REQUESTS
            # Trust REMOTE_ADDR only; arbitrary forwarded headers can bypass a limit.
            identity = f'user:{request.user.pk}' if request.user.is_authenticated else f'ip:{request.META.get("REMOTE_ADDR", "unknown")}'
            bucket = int(time.time()) // window
            key = 'rate:' + sha256(f'{view_func.__module__}.{view_func.__name__}:{identity}:{bucket}'.encode()).hexdigest()
            if cache.add(key, 1, timeout=window + 1):
                count = 1
            else:
                try:
                    count = cache.incr(key)
                except ValueError:
                    cache.set(key, 1, timeout=window + 1)
                    count = 1
            if count > limit:
                return HTTP.rate_limited(retry_after=window - int(time.time()) % window,
                                         limit=limit, request=request)

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
    
    - Usuarios normales: Solo pueden acceder a sus propias reservas
    - Staff/Superusuarios: Pueden acceder a cualquier reserva
    
    Usage:
        @validate_resource_access
        def editar_reserva(request, reserva_id):
            # ...
    """
    @wraps(view_func)
    def wrapper(request, *args, **kwargs):
        # Si hay un reserva_id en los kwargs, validar acceso
        if 'reserva_id' in kwargs:
            from .models import Reserva
            from django.shortcuts import get_object_or_404
            
            reserva_id = kwargs['reserva_id']
            
            # Determinar si el usuario es staff o superusuario
            es_staff = request.user.is_staff or request.user.is_superuser
            
            if es_staff:
                # Staff/Superusuarios pueden acceder a cualquier reserva
                logger.info(f'Staff/Superusuario {request.user.username} accediendo a reserva {reserva_id}')
                reserva = get_object_or_404(Reserva, id=reserva_id)
            else:
                # Usuarios normales solo pueden acceder a sus propias reservas
                logger.info(f'Usuario normal {request.user.username} accediendo a reserva {reserva_id}')
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
