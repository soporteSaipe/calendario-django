import logging
from datetime import datetime, timedelta
from django.shortcuts import render, get_object_or_404, redirect
from django.contrib.auth.decorators import login_required
from django.contrib.auth.models import User
from django.contrib import messages
from django.http import JsonResponse, HttpResponse
from django.urls import reverse
from django.core.exceptions import ValidationError
from django.db.models import Q, Count
from django.core.paginator import Paginator

from .models import Recurso, Reserva
from .forms import ReservaForm
from .utils import ReservaService, CacheService, DateTimeService

logger = logging.getLogger('calendario')

def calendario_view(request):
    """Vista principal del calendario"""
    logger.info(f'Acceso al calendario por usuario: {request.user.username if request.user.is_authenticated else "Anónimo"}')
    
    # Obtener recursos activos usando el servicio de cache
    recursos = CacheService.get_recursos_activos()
    
    # Obtener sala seleccionada desde parámetro URL
    sala_seleccionada = request.GET.get('sala')
    sala_activa = None
    
    if sala_seleccionada:
        try:
            sala_activa = Recurso.objects.get(id=sala_seleccionada, activo=True)
            logger.debug(f'Sala seleccionada: {sala_activa.nombre}')
        except Recurso.DoesNotExist:
            logger.warning(f'Intento de acceso a sala inexistente: {sala_seleccionada}')
            sala_activa = None
    
    # Si no hay sala seleccionada, usar la primera disponible
    if not sala_activa and recursos:
        sala_activa = recursos[0]
        logger.debug(f'Usando sala por defecto: {sala_activa.nombre if sala_activa else "Ninguna"}')
    
    context = {
        'recursos': recursos,
        'sala_activa': sala_activa
    }
    
    return render(request, 'calendario/calendario.html', context)

@login_required
def crear_reserva(request):
    """Vista para crear una nueva reserva"""
    if not request.user.is_authenticated:
        logger.warning('Intento de crear reserva sin autenticación')
        messages.error(request, 'Debes iniciar sesión para crear reservas.')
        return redirect('login')
    
    # Verificar si el usuario ha excedido el límite de rate limiting
    if getattr(request, 'limited', False):
        error_msg = 'Has alcanzado el límite de reservas (10 por minuto). Intenta en unos minutos.'
        logger.warning(f'Rate limit excedido para usuario: {request.user.username}')
        
        # Verificar si es una petición AJAX
        is_ajax = request.headers.get('X-Requested-With') == 'XMLHttpRequest'
        if is_ajax:
            return JsonResponse({
                'success': False, 
                'error': error_msg,
                'error_type': 'rate_limit_exceeded',
                'retry_after': 60
            }, status=429)
        else:
            messages.error(request, error_msg)
            return redirect('calendario:calendario')
    
    if request.method == 'POST':
        # Verificar si es una petición AJAX
        is_ajax = request.headers.get('X-Requested-With') == 'XMLHttpRequest'
        
        try:
            # Extraer datos del POST
            recurso_id = request.POST.get('recurso')
            titulo = request.POST.get('titulo')
            descripcion = request.POST.get('descripcion', '')
            fecha = request.POST.get('fecha')
            hora_inicio = request.POST.get('hora_inicio')
            hora_fin = request.POST.get('hora_fin')
            
            logger.info(f'Creando reserva: usuario={request.user.username}, recurso={recurso_id}, fecha={fecha}')
            
            # Validar campos obligatorios
            campos_requeridos = {
                'recurso': recurso_id,
                'titulo': titulo,
                'fecha': fecha,
                'hora_inicio': hora_inicio,
                'hora_fin': hora_fin
            }
            
            campos_faltantes = [campo for campo, valor in campos_requeridos.items() 
                              if not valor or valor.strip() == '']
            
            if campos_faltantes:
                error_msg = f'Campos obligatorios faltantes: {", ".join(campos_faltantes)}'
                logger.warning(f'Campos faltantes en creación de reserva: {campos_faltantes}')
                if is_ajax:
                    return JsonResponse({'success': False, 'error': error_msg}, status=400)
                messages.error(request, error_msg)
                return redirect('calendario:calendario')
            
            # Validar que el recurso existe
            try:
                recurso = Recurso.objects.get(id=recurso_id, activo=True)
            except Recurso.DoesNotExist:
                error_msg = 'El recurso seleccionado no existe o no está activo'
                logger.warning(f'Intento de reservar recurso inexistente: {recurso_id}')
                if is_ajax:
                    return JsonResponse({'success': False, 'error': error_msg}, status=400)
                messages.error(request, error_msg)
                return redirect('calendario:calendario')
            
            # Crear fechas usando el servicio
            try:
                fecha_inicio = DateTimeService.parse_datetime_from_form(fecha, hora_inicio)
                fecha_fin = DateTimeService.parse_datetime_from_form(fecha, hora_fin)
            except ValidationError as e:
                logger.error(f'Error parseando fechas: {str(e)}')
                if is_ajax:
                    return JsonResponse({'success': False, 'error': str(e)}, status=400)
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
            
            success_msg = f'Reserva creada exitosamente en {recurso.nombre}.'
            
            if is_ajax:
                return JsonResponse({
                    'success': True, 
                    'message': success_msg,
                    'reserva_id': reserva.id,
                    'recurso_id': recurso.id,
                    'recurso_nombre': recurso.nombre
                })
            messages.success(request, success_msg)
            return redirect(f"{reverse('calendario:calendario')}?sala={recurso.id}")
            
        except Exception as e:
            error_msg = f'Error inesperado al crear la reserva: {str(e)}'
            logger.error(f'Error inesperado en crear_reserva: {str(e)}', exc_info=True)
            if is_ajax:
                return JsonResponse({'success': False, 'error': error_msg}, status=500)
            messages.error(request, error_msg)
            return redirect('calendario:calendario')
    
    return redirect('calendario:calendario')

@login_required
def mis_reservas(request):
    """Vista para mostrar las reservas del usuario"""
    import json
    
    logger.info(f'Acceso a mis reservas por usuario: {request.user.username}')
    
    # Optimizar consulta con select_related para evitar N+1 queries
    reservas_query = Reserva.objects.filter(usuario=request.user).select_related(
        'recurso', 'usuario'
    ).order_by('-fecha_inicio')
    
    # Paginación simple
    paginator = Paginator(reservas_query, 15)  # 15 reservas por página
    page_number = request.GET.get('page')
    reservas = paginator.get_page(page_number)
    
    recursos = CacheService.get_recursos_activos()
    
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
def editar_reserva(request, reserva_id):
    """Vista para editar una reserva"""
    reserva = get_object_or_404(Reserva, id=reserva_id, usuario=request.user)
    
    logger.info(f'Edición de reserva ID: {reserva_id} por usuario: {request.user.username}')
    
    # Verificar si el usuario ha excedido el límite de rate limiting
    if getattr(request, 'limited', False):
        error_msg = 'Has alcanzado el límite de ediciones (15 por minuto). Intenta en unos minutos.'
        logger.warning(f'Rate limit excedido para usuario: {request.user.username}')
        
        # Verificar si es una petición AJAX
        is_ajax = request.headers.get('X-Requested-With') == 'XMLHttpRequest'
        if is_ajax:
            return JsonResponse({
                'success': False, 
                'error': error_msg,
                'error_type': 'rate_limit_exceeded',
                'retry_after': 60
            }, status=429)
        else:
            messages.error(request, error_msg)
            return redirect('calendario:mis_reservas')
    
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
                    'message': 'Reserva actualizada exitosamente.'
                })
            else:
                messages.success(request, 'Reserva actualizada exitosamente.')
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
def eliminar_reserva(request, reserva_id):
    """Vista para eliminar una reserva"""
    reserva = get_object_or_404(Reserva, id=reserva_id, usuario=request.user)
    
    logger.info(f'Eliminación de reserva ID: {reserva_id} por usuario: {request.user.username}')
    
    # Verificar si el usuario ha excedido el límite de rate limiting
    if getattr(request, 'limited', False):
        error_msg = 'Has alcanzado el límite de eliminaciones (20 por minuto). Intenta en unos minutos.'
        logger.warning(f'Rate limit excedido para usuario: {request.user.username}')
        
        # Verificar si es una petición AJAX
        is_ajax = request.headers.get('X-Requested-With') == 'XMLHttpRequest'
        if is_ajax:
            return JsonResponse({
                'success': False, 
                'error': error_msg,
                'error_type': 'rate_limit_exceeded',
                'retry_after': 60
            }, status=429)
        else:
            messages.error(request, error_msg)
            return redirect('calendario:mis_reservas')
    
    if request.method == 'POST':
        # Verificar si es una petición AJAX
        is_ajax = request.headers.get('X-Requested-With') == 'XMLHttpRequest'
        
        try:
            reserva.delete()
            logger.info(f'Reserva eliminada exitosamente: {reserva_id}')
            
            if is_ajax:
                return JsonResponse({
                    'success': True,
                    'message': 'Reserva eliminada exitosamente.'
                })
            else:
                messages.success(request, 'Reserva eliminada exitosamente.')
                return redirect('calendario:mis_reservas')
        except Exception as e:
            logger.error(f'Error al eliminar reserva {reserva_id}: {str(e)}', exc_info=True)
            
            if is_ajax:
                return JsonResponse({
                    'success': False,
                    'message': 'Error al eliminar la reserva.'
                }, status=500)
            else:
                messages.error(request, 'Error al eliminar la reserva.')
                return redirect('calendario:mis_reservas')
    
    return render(request, 'calendario/eliminar_reserva.html', {'reserva': reserva})


@login_required
def dashboard(request):
    """Dashboard con métricas básicas - Solo para administradores"""
    from datetime import datetime, timedelta
    from django.utils import timezone
    from django.contrib.auth.decorators import user_passes_test
    
    # Verificar que el usuario sea admin
    if not request.user.is_staff and not request.user.is_superuser:
        logger.warning(f'Intento de acceso al dashboard por usuario no admin: {request.user.username}')
        messages.error(request, 'No tienes permisos para acceder al dashboard.')
        return redirect('calendario:calendario')
    
    hoy = timezone.now().date()
    semana_pasada = hoy - timedelta(days=7)
    mes_pasado = hoy - timedelta(days=30)
    
    logger.info(f'Acceso al dashboard por admin: {request.user.username}')
    
    # Métricas globales del sistema
    context = {
        'reservas_hoy': Reserva.objects.filter(
            fecha_inicio__date=hoy
        ).count(),
        
        'reservas_semana': Reserva.objects.filter(
            fecha_inicio__date__gte=semana_pasada
        ).count(),
        
        'reservas_mes': Reserva.objects.filter(
            fecha_inicio__date__gte=mes_pasado
        ).count(),
        
        'recursos_activos': Recurso.objects.filter(activo=True).count(),
        
        'usuarios_activos': User.objects.filter(is_active=True).count(),
        
        'proxima_reserva': Reserva.objects.filter(
            fecha_inicio__gte=timezone.now(),
            estado='confirmada'
        ).order_by('fecha_inicio').first(),
        
        'reservas_recientes': Reserva.objects.select_related('recurso', 'usuario').order_by('-fecha_inicio')[:10],
        
        'recurso_mas_usado': Reserva.objects.values('recurso__nombre').annotate(
            count=Count('id')
        ).order_by('-count').first(),
        
        'usuarios_mas_activos': Reserva.objects.values('usuario__username', 'usuario__first_name', 'usuario__last_name').annotate(
            count=Count('id')
        ).order_by('-count')[:5],
    }
    
    logger.debug(f'Dashboard generado - Reservas hoy: {context["reservas_hoy"]}')
    
    return render(request, 'calendario/dashboard.html', context)

def api_reservas(request):
    """API para obtener las reservas en formato JSON para el calendario"""
    fecha_inicio = request.GET.get('start')
    fecha_fin = request.GET.get('end')
    sala_id = request.GET.get('sala')
    
    logger.debug(f'API reservas - Parámetros: start={fecha_inicio}, end={fecha_fin}, sala={sala_id}')
    
    # Verificar si el usuario ha excedido el límite de rate limiting
    if getattr(request, 'limited', False):
        error_msg = 'Has alcanzado el límite de consultas (30 por minuto). Intenta en unos minutos.'
        logger.warning(f'Rate limit excedido para API reservas: {request.user.username if request.user.is_authenticated else "Anónimo"}')
        return JsonResponse({
            'error': error_msg,
            'error_type': 'rate_limit_exceeded',
            'retry_after': 60
        }, status=429)
    
    # Consulta optimizada con select_related y prefetch_related
    reservas = Reserva.objects.select_related('recurso', 'usuario').filter(
        estado='confirmada'
    ).only(
        'id', 'titulo', 'fecha_inicio', 'fecha_fin', 'descripcion', 'estado',
        'recurso__id', 'recurso__nombre', 'recurso__color', 'recurso__capacidad',
        'usuario__username'
    )
    
    if fecha_inicio and fecha_fin:
        from datetime import datetime
        try:
            fecha_inicio_dt = datetime.fromisoformat(fecha_inicio.replace('Z', '+00:00'))
            fecha_fin_dt = datetime.fromisoformat(fecha_fin.replace('Z', '+00:00'))
            
            reservas = reservas.filter(
                fecha_inicio__lt=fecha_fin_dt,
                fecha_fin__gt=fecha_inicio_dt
            )
            logger.debug(f'Filtro de fecha aplicado: {fecha_inicio_dt} - {fecha_fin_dt}')
        except (ValueError, AttributeError) as e:
            logger.warning(f'Error parseando fechas en API: {str(e)}')
    
    if sala_id and sala_id != 'todas':
        try:
            reservas = reservas.filter(recurso_id=sala_id)
            logger.debug(f'Filtro de sala aplicado: {sala_id}')
        except ValueError as e:
            logger.warning(f'Error parseando sala_id: {str(e)}')
    
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
    """API para obtener horarios ocupados de una sala en una fecha específica"""
    recurso_id = request.GET.get('recurso_id')
    fecha = request.GET.get('fecha')
    
    if not recurso_id or not fecha:
        return JsonResponse({'error': 'recurso_id y fecha son requeridos'}, status=400)
    
    try:
        from datetime import datetime, time
        from django.utils import timezone
        
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
        return JsonResponse({'error': f'Formato de fecha inválido: {str(e)}'}, status=400)
    except Exception as e:
        return JsonResponse({'error': f'Error interno: {str(e)}'}, status=500)


def api_validar_conflicto(request):
    """
    API para validar conflictos de reservas en tiempo real usando el servicio centralizado
    """
    if request.method != 'GET':
        return JsonResponse({'error': 'Método no permitido'}, status=405)
    
    # Verificar si el usuario ha excedido el límite de rate limiting
    if getattr(request, 'limited', False):
        error_msg = 'Has alcanzado el límite de validaciones (50 por minuto). Intenta en unos minutos.'
        logger.warning(f'Rate limit excedido para API validar conflicto: {request.user.username if request.user.is_authenticated else "Anónimo"}')
        return JsonResponse({
            'error': error_msg,
            'error_type': 'rate_limit_exceeded',
            'retry_after': 60
        }, status=429)
    
    try:
        # Obtener parámetros
        sala_id = request.GET.get('sala')
        fecha = request.GET.get('fecha')
        hora_inicio = request.GET.get('hora_inicio')
        hora_fin = request.GET.get('hora_fin')
        
        logger.debug(f'API validar conflicto - Parámetros: sala={sala_id}, fecha={fecha}, hora_inicio={hora_inicio}, hora_fin={hora_fin}')
        
        if not all([sala_id, fecha, hora_inicio, hora_fin]):
            logger.warning('Parámetros faltantes en API validar conflicto')
            return JsonResponse({'error': 'Parámetros faltantes'}, status=400)
        
        # Obtener recurso
        try:
            recurso = Recurso.objects.get(id=sala_id, activo=True)
        except Recurso.DoesNotExist:
            logger.warning(f'Recurso no encontrado: {sala_id}')
            return JsonResponse({
                'conflicts': [{
                    'type': 'resource_not_found',
                    'message': 'La sala seleccionada no existe'
                }],
                'valid': False
            })
        
        # Crear fechas usando el servicio
        try:
            fecha_inicio = DateTimeService.parse_datetime_from_form(fecha, hora_inicio)
            fecha_fin = DateTimeService.parse_datetime_from_form(fecha, hora_fin)
        except ValidationError as e:
            logger.warning(f'Error parseando fechas en validación: {str(e)}')
            return JsonResponse({'error': str(e)}, status=400)
        
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
        
        return JsonResponse({
            'conflicts': conflictos,
                'valid': False,
            'fecha': fecha,
            'hora_inicio': hora_inicio,
            'hora_fin': hora_fin,
            'sala_id': sala_id
        })
        
    except Exception as e:
        logger.error(f'Error inesperado en API validar conflicto: {str(e)}', exc_info=True)
        return JsonResponse({'error': f'Error interno: {str(e)}'}, status=500)


def export_calendar(request):
    """
    Exportar calendario usando Factory y Strategy patterns
    """
    if not request.user.is_staff:
        return JsonResponse({'error': 'Acceso denegado'}, status=403)
    
    try:
        from .exporters import ExportFactory
        
        # Obtener parámetros
        format_type = request.GET.get('format', 'pdf')
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
            return JsonResponse({'error': f'Formato no soportado: {format_type}. Formatos disponibles: {supported_formats}'}, status=400)
        
        # Convertir fechas
        try:
            fecha_inicio = datetime.strptime(date_from, '%Y-%m-%d')
            fecha_fin = datetime.strptime(date_to, '%Y-%m-%d')
        except ValueError as e:
            return JsonResponse({'error': f'Formato de fecha inválido: {str(e)}'}, status=400)
        
        if fecha_inicio > fecha_fin:
            return JsonResponse({'error': 'Fecha de inicio debe ser anterior a fecha de fin'}, status=400)
        
        # Validar rango de fechas (máximo 1 año)
        if (fecha_fin.date() - fecha_inicio.date()).days > 365:
            return JsonResponse({'error': 'El rango de fechas no puede exceder 1 año'}, status=400)
        
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
        
        # Obtener reservas
        reservas = Reserva.objects.filter(
            recurso_id__in=salas_ids,
            fecha_inicio__date__range=[fecha_inicio.date(), fecha_fin.date()],
            estado='confirmada'
        ).select_related('recurso', 'usuario').order_by('fecha_inicio')
        
        if not reservas.exists():
            return JsonResponse({'error': 'No hay reservas confirmadas en el rango de fechas especificado'}, status=404)
        
        # Crear exportador usando Factory
        exporter = ExportFactory.create_exporter(format_type)
        
        # Opciones de exportación
        options = {
            'include_descriptions': include_descriptions,
            'include_attendees': include_attendees,
            'include_location': include_location
        }
        
        # Generar exportación usando Strategy
        return exporter.export(reservas, fecha_inicio, fecha_fin, options)
            
    except ValueError as e:
        logger.warning(f'Error de validación en export_calendar: {str(e)}')
        return JsonResponse({'error': str(e)}, status=400)
    except Exception as e:
        logger.error(f'Error en export_calendar: {str(e)}', exc_info=True)
        return JsonResponse({'error': f'Error interno del servidor: {str(e)}'}, status=500)

