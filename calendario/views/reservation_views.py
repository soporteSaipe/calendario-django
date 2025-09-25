"""
Vistas para el CRUD de reservas
"""

import json
import logging
from django.shortcuts import render, get_object_or_404, redirect
from django.contrib.auth.decorators import login_required
from django.contrib import messages
from django.http import JsonResponse
from django.urls import reverse
from django.core.paginator import Paginator

from ..models import Recurso, Reserva
from ..forms import ReservaForm
from ..utils import ReservaService, CacheService, DateTimeService
from ..decorators import (
    rate_limit,
    require_authentication,
    validate_request_data,
    log_view_access,
    validate_resource_access
)
from ..query_optimizers import ReservaQueryOptimizer, CacheQueryOptimizer
from ..constants import (
    RateLimitConfig, 
    PaginationConfig,
    ValidationMessages,
    SuccessMessages,
    ErrorMessages
)
from ..http_responses import HTTP, ERROR_CODES

logger = logging.getLogger('calendario')


@login_required
@rate_limit(requests_per_minute=RateLimitConfig.CREATE_RESERVA)
@validate_request_data(['recurso', 'titulo', 'fecha', 'hora_inicio', 'hora_fin'])
@log_view_access
def crear_reserva(request):
    """
    Vista para crear una nueva reserva
    
    Maneja tanto peticiones AJAX como formularios tradicionales.
    Incluye validación de rate limiting y validación completa de la reserva.
    """
    
    if request.method == 'POST':
        # Verificar si es una petición AJAX
        is_ajax = request.headers.get('X-Requested-With') == 'XMLHttpRequest'
        
        try:
            # Extraer datos del POST (ya validados por el decorador)
            recurso_id = request.POST.get('recurso')
            titulo = request.POST.get('titulo')
            descripcion = request.POST.get('descripcion', '')
            fecha = request.POST.get('fecha')
            hora_inicio = request.POST.get('hora_inicio')
            hora_fin = request.POST.get('hora_fin')
            
            logger.info(f'Creando reserva: usuario={request.user.username}, recurso={recurso_id}, fecha={fecha}')
            
            # Validar que el recurso existe
            try:
                recurso = Recurso.objects.get(id=recurso_id, activo=True)
            except Recurso.DoesNotExist:
                error_msg = ValidationMessages.RESOURCE_NOT_FOUND
                logger.warning(f'Intento de reservar recurso inexistente: {recurso_id}')
                if is_ajax:
                    return HTTP.not_found(
                        message=error_msg,
                        resource_type='recurso',
                        resource_id=str(recurso_id),
                        request=request
                    )
                messages.error(request, error_msg)
                return redirect('calendario:calendario')
            
            # Crear fechas usando el servicio
            try:
                fecha_inicio = DateTimeService.parse_datetime_from_form(fecha, hora_inicio)
                fecha_fin = DateTimeService.parse_datetime_from_form(fecha, hora_fin)
            except Exception as e:
                logger.error(f'Error parseando fechas: {str(e)}')
                if is_ajax:
                    return HTTP.bad_request(
                        message=str(e),
                        error_code=ERROR_CODES.INVALID_DATE_FORMAT,
                        request=request
                    )
                messages.error(request, str(e))
                return redirect('calendario:calendario')
            
            # Usar el servicio para crear la reserva
            reserva = ReservaService.crear_reserva(
                usuario=request.user,
                recurso=recurso,
                titulo=titulo,
                descripcion=descripcion,
                fecha_inicio=fecha_inicio,
                fecha_fin=fecha_fin
            )
            
            success_msg = SuccessMessages.RESERVA_CREATED.format(recurso=recurso.nombre)
            
            if is_ajax:
                return HTTP.success(
                    data={
                        'reserva_id': reserva.id,
                        'recurso_id': recurso.id,
                        'recurso_nombre': recurso.nombre
                    },
                    message=success_msg,
                    request=request
                )
            messages.success(request, success_msg)
            return redirect(f"{reverse('calendario:calendario')}?sala={recurso.id}")
            
        except Exception as e:
            error_msg = ErrorMessages.UNEXPECTED_ERROR.format(error=str(e))
            logger.error(f'Error inesperado en crear_reserva: {str(e)}', exc_info=True)
            if is_ajax:
                return HTTP.internal_server_error(
                    message=error_msg,
                    request=request
                )
            messages.error(request, error_msg)
            return redirect('calendario:calendario')
    
    return redirect('calendario:calendario')


@login_required
@log_view_access
def mis_reservas(request):
    """
    Vista para mostrar las reservas del usuario
    
    Incluye paginación y optimización de consultas para evitar N+1 queries.
    """
    
    # Usar optimizador de consultas
    reservas_query = ReservaQueryOptimizer.get_reservas_usuario_optimizadas(request.user)
    
    # Paginación
    paginator = Paginator(reservas_query, PaginationConfig.RESERVAS_PER_PAGE)
    page_number = request.GET.get('page')
    reservas = paginator.get_page(page_number)
    
    recursos = CacheQueryOptimizer.get_recursos_activos_cached()
    
    # Crear JSON de salas para JavaScript
    salas_data = []
    for recurso in recursos:
        salas_data.append({
            'id': recurso.id,
            'nombre': recurso.nombre,
            'esComedor': 'comedor' in recurso.nombre.lower()
        })
    
    salas_json = json.dumps(salas_data, ensure_ascii=False)
    
    logger.debug(f'Mostrando página {page_number or 1} con {len(reservas)} reservas para usuario {request.user.username}')
    
    context = {
        'reservas': reservas,
        'recursos': recursos,
        'salas_json': salas_json
    }
    
    return render(request, 'calendario/mis_reservas.html', context)


@login_required
@rate_limit(requests_per_minute=RateLimitConfig.EDIT_RESERVA)
@validate_resource_access
@log_view_access
def editar_reserva(request, reserva_id, reserva=None):
    """
    Vista para editar una reserva existente
    
    Solo permite editar reservas propias del usuario.
    """
    logger.info(f'Edición de reserva ID: {reserva_id} por usuario: {request.user.username}')
    
    if request.method == 'POST':
        # Verificar si es una petición AJAX
        is_ajax = request.headers.get('X-Requested-With') == 'XMLHttpRequest'
        
        form = ReservaForm(request.POST, instance=reserva)
        
        if form.is_valid():
            # Extraer datos del formulario
            titulo = form.cleaned_data['titulo']
            descripcion = form.cleaned_data['descripcion']
            fecha_inicio = form.cleaned_data['fecha_inicio']
            fecha_fin = form.cleaned_data['fecha_fin']
            
            # Usar el servicio para actualizar la reserva
            reserva_actualizada = ReservaService.actualizar_reserva(
                reserva=reserva,
                titulo=titulo,
                descripcion=descripcion,
                fecha_inicio=fecha_inicio,
                fecha_fin=fecha_fin
            )
            
            logger.info(f'Reserva actualizada exitosamente: {reserva_id}')
            
            if is_ajax:
                return JsonResponse({
                    'success': True,
                    'message': SuccessMessages.RESERVA_UPDATED
                })
            else:
                messages.success(request, SuccessMessages.RESERVA_UPDATED)
                return redirect('calendario:mis_reservas')
        else:
            logger.warning(f'Formulario inválido en edición: {form.errors}')
            
            if is_ajax:
                return JsonResponse({
                    'success': False,
                    'message': 'Error en el formulario.',
                    'errors': form.errors
                }, status=400)
            else:
                messages.error(request, 'Error en el formulario.')
    else:
        form = ReservaForm(instance=reserva)
    
    return render(request, 'calendario/editar_reserva.html', {'form': form, 'reserva': reserva})


@login_required
@rate_limit(requests_per_minute=RateLimitConfig.DELETE_RESERVA)
@validate_resource_access
@log_view_access
def eliminar_reserva(request, reserva_id, reserva=None):
    """
    Vista para eliminar una reserva
    
    Solo permite eliminar reservas propias del usuario.
    """
    logger.info(f'Eliminación de reserva ID: {reserva_id} por usuario: {request.user.username}')
    
    if request.method == 'POST':
        # Verificar si es una petición AJAX
        is_ajax = request.headers.get('X-Requested-With') == 'XMLHttpRequest'
        
        try:
            reserva.delete()
            logger.info(f'Reserva eliminada exitosamente: {reserva_id}')
            
            if is_ajax:
                return JsonResponse({
                    'success': True,
                    'message': SuccessMessages.RESERVA_DELETED
                })
            else:
                messages.success(request, SuccessMessages.RESERVA_DELETED)
                return redirect('calendario:mis_reservas')
        except Exception as e:
            logger.error(f'Error al eliminar reserva {reserva_id}: {str(e)}', exc_info=True)
            
            if is_ajax:
                return JsonResponse({
                    'success': False,
                    'message': ErrorMessages.UNEXPECTED_ERROR.format(error=str(e))
                }, status=500)
            else:
                messages.error(request, ErrorMessages.UNEXPECTED_ERROR.format(error=str(e)))
                return redirect('calendario:mis_reservas')
    
    return render(request, 'calendario/eliminar_reserva.html', {'reserva': reserva})
