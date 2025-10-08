"""
Vistas para el CRUD de reservas
"""

import json
import logging
from django.shortcuts import render, get_object_or_404, redirect
from django.contrib.auth.decorators import login_required
from django.contrib.auth.models import User
from django.contrib import messages
from django.http import JsonResponse
from django.urls import reverse
from django.core.paginator import Paginator
from django.db import models

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
@validate_request_data(['recurso', 'fecha', 'hora_inicio', 'hora_fin'])
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
            titulo = request.POST.get('titulo', '')
            descripcion = request.POST.get('descripcion', '')
            responsable = request.POST.get('responsable', '')
            destino = request.POST.get('destino', '')
            fecha = request.POST.get('fecha')
            hora_inicio = request.POST.get('hora_inicio')
            hora_fin = request.POST.get('hora_fin')
            fecha_vuelta = request.POST.get('fecha_vuelta')
            
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
            
            # Validar que los campos de fecha y hora no estén vacíos
            if not fecha or not fecha.strip():
                error_msg = "La fecha es requerida"
                logger.warning(f'Fecha vacía en reserva: usuario={request.user.username}')
                if is_ajax:
                    return HTTP.bad_request(message=error_msg, request=request)
                messages.error(request, error_msg)
                return redirect('calendario:calendario')
            
            if not hora_inicio or not hora_inicio.strip():
                error_msg = "La hora de inicio es requerida"
                logger.warning(f'Hora inicio vacía en reserva: usuario={request.user.username}')
                if is_ajax:
                    return HTTP.bad_request(message=error_msg, request=request)
                messages.error(request, error_msg)
                return redirect('calendario:calendario')
            
            if not hora_fin or not hora_fin.strip():
                error_msg = "La hora de fin es requerida"
                logger.warning(f'Hora fin vacía en reserva: usuario={request.user.username}')
                if is_ajax:
                    return HTTP.bad_request(message=error_msg, request=request)
                messages.error(request, error_msg)
                return redirect('calendario:calendario')
            
            # Crear fechas usando el servicio
            try:
                fecha_inicio = DateTimeService.parse_datetime_from_form(fecha, hora_inicio)
                
                # Para vehículos, usar fecha_vuelta si está disponible y no está vacío
                if recurso.es_vehiculo() and fecha_vuelta and fecha_vuelta.strip():
                    fecha_fin = DateTimeService.parse_datetime_from_form(fecha_vuelta, hora_fin)
                else:
                    # Para salas o vehículos sin fecha_vuelta (compatibilidad)
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
            fecha_vuelta_final = fecha_vuelta if fecha_vuelta and fecha_vuelta.strip() else None
            
            reserva = ReservaService.crear_reserva(
                usuario=request.user,
                recurso=recurso,
                titulo=titulo,
                descripcion=descripcion,
                fecha_inicio=fecha_inicio,
                fecha_fin=fecha_fin,
                responsable=responsable,
                destino=destino,
                fecha_vuelta=fecha_vuelta_final
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
    
    - Usuarios normales: Solo ven sus propias reservas
    - Staff/Superusuarios: Ven TODAS las reservas del sistema
    
    Incluye paginación y optimización de consultas para evitar N+1 queries.
    Filtra reservas por estado y fecha para mostrar solo las relevantes.
    """
    
    from django.utils import timezone
    from datetime import timedelta
    
    # Determinar si el usuario es staff o superusuario
    es_staff = request.user.is_staff or request.user.is_superuser
    
    if es_staff:
        # Staff/Superusuarios ven TODAS las reservas sin restricciones
        logger.info(f'Staff/Superusuario {request.user.username} accediendo a todas las reservas')
        reservas_query = ReservaQueryOptimizer.get_todas_las_reservas_optimizadas()
        # Para staff, no aplicamos filtros de estado - ven TODO
        logger.info(f'Staff: Mostrando todas las reservas sin filtros de estado')
    else:
        # Usuarios normales ven solo sus reservas con filtros de estado
        logger.info(f'Usuario normal {request.user.username} accediendo a sus reservas')
        reservas_query = ReservaQueryOptimizer.get_reservas_usuario_optimizadas(request.user)
        
        # Obtener fecha de hace 30 días para mostrar reservas recientes
        fecha_limite = timezone.now() - timedelta(days=30)
        
        # Filtrar reservas: confirmadas, canceladas recientemente, o futuras
        reservas_query = reservas_query.filter(
            models.Q(estado='confirmada') | 
            models.Q(estado='cancelada', fecha_inicio__gte=fecha_limite) |
            models.Q(fecha_inicio__gte=timezone.now())
        )
        logger.info(f'Usuario normal: Aplicando filtros de estado y fecha')
    
    # Ordenar por fecha de inicio (más recientes primero)
    reservas_query = reservas_query.order_by('-fecha_inicio')
    
    # Paginación
    paginator = Paginator(reservas_query, PaginationConfig.RESERVAS_PER_PAGE)
    page_number = request.GET.get('page')
    reservas = paginator.get_page(page_number)
    
    recursos = CacheQueryOptimizer.get_recursos_activos_cached()
    
    # Crear JSON de recursos para JavaScript
    salas_data = []
    for recurso in recursos:
        salas_data.append({
            'id': recurso.id,
            'nombre': recurso.nombre,
            'tipo': recurso.tipo,  # ¡CRÍTICO! Agregar tipo de recurso
            'esComedor': 'comedor' in recurso.nombre.lower()
        })
    
    salas_json = json.dumps(salas_data, ensure_ascii=False)
    
    # Logging detallado para debugging
    total_reservas = reservas_query.count()
    logger.info(f'Total de reservas encontradas: {total_reservas}')
    logger.info(f'Mostrando página {page_number or 1} con {len(reservas)} reservas para usuario {request.user.username}')
    logger.info(f'Usuario es staff: {es_staff}')
    logger.info(f'Usuario is_staff: {request.user.is_staff}')
    logger.info(f'Usuario is_superuser: {request.user.is_superuser}')
    
    # Log de algunas reservas para verificar
    if reservas:
        logger.info(f'Primeras 3 reservas: {[(r.id, r.usuario.username, r.titulo, r.estado) for r in reservas[:3]]}')
    else:
        logger.warning(f'No se encontraron reservas para mostrar')
        
    # Debug adicional: contar reservas por estado
    if es_staff:
        from django.db.models import Count
        estados_count = Reserva.objects.values('estado').annotate(count=Count('id'))
        logger.info(f'Reservas por estado: {list(estados_count)}')
    
    context = {
        'reservas': reservas,
        'recursos': recursos,
        'salas_json': salas_json,
        'es_staff': es_staff,
        'usuario_actual': request.user
    }
    
    return render(request, 'calendario/mis_reservas.html', context)


@login_required
@rate_limit(requests_per_minute=RateLimitConfig.EDIT_RESERVA)
@validate_resource_access
@log_view_access
def editar_reserva(request, reserva_id, reserva=None):
    """
    Vista para editar una reserva existente
    
    - Usuarios normales: Solo pueden editar sus propias reservas
    - Staff/Superusuarios: Pueden editar cualquier reserva
    """
    es_staff = request.user.is_staff or request.user.is_superuser
    logger.info(f'Edición de reserva ID: {reserva_id} por usuario: {request.user.username} (Staff: {es_staff})')
    
    # Log adicional para staff editando reservas de otros usuarios
    if es_staff and reserva.usuario != request.user:
        logger.info(f'Staff {request.user.username} editando reserva de usuario {reserva.usuario.username}')
    
    if request.method == 'POST':
        # Verificar si es una petición AJAX
        is_ajax = request.headers.get('X-Requested-With') == 'XMLHttpRequest'
        
        form = ReservaForm(request.POST, instance=reserva)
        
        if form.is_valid():
            # Extraer datos del formulario
            titulo = form.cleaned_data['titulo']
            descripcion = form.cleaned_data['descripcion']
            
            # Manejar fechas - puede venir como campos separados o combinados
            if 'fecha_inicio' in form.cleaned_data and 'fecha_fin' in form.cleaned_data:
                fecha_inicio = form.cleaned_data['fecha_inicio']
                fecha_fin = form.cleaned_data['fecha_fin']
            else:
                # Si vienen como campos separados, combinarlos
                fecha = request.POST.get('fecha')
                hora_inicio = request.POST.get('hora_inicio')
                hora_fin = request.POST.get('hora_fin')
                
                if fecha and hora_inicio and hora_fin:
                    try:
                        fecha_inicio = DateTimeService.parse_datetime_from_form(fecha, hora_inicio)
                        fecha_fin = DateTimeService.parse_datetime_from_form(fecha, hora_fin)
                    except Exception as e:
                        logger.error(f'Error parseando fechas en edición: {str(e)}')
                        if is_ajax:
                            return JsonResponse({
                                'success': False,
                                'message': 'Error en el formato de fechas.',
                                'errors': {'fecha': ['Formato de fecha inválido']}
                            }, status=400)
                        else:
                            messages.error(request, 'Error en el formato de fechas.')
                            return redirect('calendario:mis_reservas')
                else:
                    if is_ajax:
                        return JsonResponse({
                            'success': False,
                            'message': 'Fechas y horarios son requeridos.',
                            'errors': {'fecha': ['Fechas y horarios son requeridos']}
                        }, status=400)
                    else:
                        messages.error(request, 'Fechas y horarios son requeridos.')
                        return redirect('calendario:mis_reservas')
            
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
    
    - Usuarios normales: Solo pueden eliminar sus propias reservas
    - Staff/Superusuarios: Pueden eliminar cualquier reserva
    """
    es_staff = request.user.is_staff or request.user.is_superuser
    logger.info(f'Eliminación de reserva ID: {reserva_id} por usuario: {request.user.username} (Staff: {es_staff})')
    
    # Log adicional para staff eliminando reservas de otros usuarios
    if es_staff and reserva.usuario != request.user:
        logger.info(f'Staff {request.user.username} eliminando reserva de usuario {reserva.usuario.username}')
    
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


@login_required
@log_view_access
def buscar_reservas(request):
    """
    Vista para buscar y filtrar reservas con criterios avanzados
    
    Permite filtrar por:
    - Rango de fechas
    - Recurso/Sala específica
    - Usuario
    - Estado de la reserva
    """
    from django.db.models import Q
    from datetime import datetime, timedelta
    
    logger.info(f'Búsqueda de reservas por usuario: {request.user.username}')
    
    # Determinar si el usuario es staff
    es_staff = request.user.is_staff or request.user.is_superuser
    
    # Obtener parámetros de búsqueda
    fecha_desde = request.GET.get('fecha_desde')
    fecha_hasta = request.GET.get('fecha_hasta')
    recurso_id = request.GET.get('recurso')
    usuario_id = request.GET.get('usuario')
    estado = request.GET.get('estado')
    busqueda_texto = request.GET.get('q', '').strip()
    
    # Comenzar con todas las reservas o solo las del usuario
    if es_staff:
        reservas_query = ReservaQueryOptimizer.get_todas_las_reservas_optimizadas()
    else:
        reservas_query = ReservaQueryOptimizer.get_reservas_usuario_optimizadas(request.user)
    
    # Aplicar filtros
    if fecha_desde:
        try:
            fecha_desde_dt = datetime.strptime(fecha_desde, '%Y-%m-%d')
            reservas_query = reservas_query.filter(fecha_inicio__gte=fecha_desde_dt)
            logger.debug(f'Filtro aplicado: fecha_desde={fecha_desde}')
        except ValueError:
            logger.warning(f'Formato de fecha inválido: {fecha_desde}')
            messages.warning(request, 'Formato de fecha desde inválido')
    
    if fecha_hasta:
        try:
            fecha_hasta_dt = datetime.strptime(fecha_hasta, '%Y-%m-%d')
            # Agregar 1 día para incluir todo el día hasta
            fecha_hasta_dt = fecha_hasta_dt + timedelta(days=1)
            reservas_query = reservas_query.filter(fecha_inicio__lt=fecha_hasta_dt)
            logger.debug(f'Filtro aplicado: fecha_hasta={fecha_hasta}')
        except ValueError:
            logger.warning(f'Formato de fecha inválido: {fecha_hasta}')
            messages.warning(request, 'Formato de fecha hasta inválido')
    
    if recurso_id and recurso_id != 'todos':
        try:
            reservas_query = reservas_query.filter(recurso_id=int(recurso_id))
            logger.debug(f'Filtro aplicado: recurso_id={recurso_id}')
        except ValueError:
            logger.warning(f'ID de recurso inválido: {recurso_id}')
    
    if usuario_id and usuario_id != 'todos' and es_staff:
        try:
            reservas_query = reservas_query.filter(usuario_id=int(usuario_id))
            logger.debug(f'Filtro aplicado: usuario_id={usuario_id}')
        except ValueError:
            logger.warning(f'ID de usuario inválido: {usuario_id}')
    
    if estado and estado != 'todos':
        reservas_query = reservas_query.filter(estado=estado)
        logger.debug(f'Filtro aplicado: estado={estado}')
    
    if busqueda_texto:
        reservas_query = reservas_query.filter(
            Q(titulo__icontains=busqueda_texto) |
            Q(descripcion__icontains=busqueda_texto) |
            Q(recurso__nombre__icontains=busqueda_texto)
        )
        logger.debug(f'Búsqueda de texto aplicada: {busqueda_texto}')
    
    # Ordenar resultados
    reservas_query = reservas_query.order_by('-fecha_inicio')
    
    # Paginación
    from django.core.paginator import Paginator
    paginator = Paginator(reservas_query, PaginationConfig.RESERVAS_PER_PAGE)
    page_number = request.GET.get('page')
    reservas = paginator.get_page(page_number)
    
    # Obtener recursos y usuarios para los filtros
    recursos = CacheService.get_recursos_activos()
    usuarios = User.objects.filter(is_active=True).order_by('username') if es_staff else []
    
    # Contar resultados
    total_resultados = reservas_query.count()
    logger.info(f'Búsqueda completada: {total_resultados} resultados encontrados')
    
    context = {
        'reservas': reservas,
        'recursos': recursos,
        'usuarios': usuarios,
        'es_staff': es_staff,
        'total_resultados': total_resultados,
        # Mantener filtros aplicados
        'filtros': {
            'fecha_desde': fecha_desde or '',
            'fecha_hasta': fecha_hasta or '',
            'recurso': recurso_id or 'todos',
            'usuario': usuario_id or 'todos',
            'estado': estado or 'todos',
            'q': busqueda_texto
        }
    }
    
    return render(request, 'calendario/buscar_reservas.html', context)