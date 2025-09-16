from django.shortcuts import render, get_object_or_404, redirect
from django.contrib.auth.decorators import login_required
from django.contrib import messages
from django.http import JsonResponse
from django.core.cache import cache

from .models import Recurso, Reserva
from .forms import ReservaForm

def calendario_view(request):
    """Vista principal del calendario"""
    cache_key = 'recursos_activos'
    recursos = cache.get(cache_key)
    if recursos is None:
        recursos = list(Recurso.objects.filter(activo=True))
        cache.set(cache_key, recursos, 300)
    
    return render(request, 'calendario/calendario.html', {'recursos': recursos})

@login_required
def crear_reserva(request):
    """Vista para crear una nueva reserva"""
    if not request.user.is_authenticated:
        messages.error(request, 'Debes iniciar sesión para crear reservas.')
        return redirect('login')
    
    if request.method == 'POST':
        # Verificar si es una petición AJAX
        is_ajax = request.headers.get('X-Requested-With') == 'XMLHttpRequest'
        
        try:
            recurso_id = request.POST.get('recurso')
            titulo = request.POST.get('titulo')
            descripcion = request.POST.get('descripcion', '')
            fecha = request.POST.get('fecha')
            hora_inicio = request.POST.get('hora_inicio')
            hora_fin = request.POST.get('hora_fin')
            
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
                if is_ajax:
                    return JsonResponse({'success': False, 'error': error_msg}, status=400)
                messages.error(request, error_msg)
                return redirect('calendario:calendario')
            
            # Validar que el recurso existe
            try:
                recurso = Recurso.objects.get(id=recurso_id, activo=True)
            except Recurso.DoesNotExist:
                error_msg = 'El recurso seleccionado no existe o no está activo'
                if is_ajax:
                    return JsonResponse({'success': False, 'error': error_msg}, status=400)
                messages.error(request, error_msg)
                return redirect('calendario:calendario')
            
            # Crear fechas
            from datetime import datetime
            from django.utils import timezone
            
            try:
                fecha_inicio = timezone.make_aware(
                    datetime.strptime(f"{fecha} {hora_inicio}", "%Y-%m-%d %H:%M")
                )
                fecha_fin = timezone.make_aware(
                    datetime.strptime(f"{fecha} {hora_fin}", "%Y-%m-%d %H:%M")
                )
            except ValueError as e:
                error_msg = f'Error en el formato de fecha: {str(e)}'
                if is_ajax:
                    return JsonResponse({'success': False, 'error': error_msg}, status=400)
                messages.error(request, error_msg)
                return redirect('calendario:calendario')
            
            # Validar que la fecha de fin sea posterior a la de inicio
            if fecha_fin <= fecha_inicio:
                error_msg = 'La hora de fin debe ser posterior a la hora de inicio'
                if is_ajax:
                    return JsonResponse({'success': False, 'error': error_msg}, status=400)
                messages.error(request, error_msg)
                return redirect('calendario:calendario')
            
            # Verificar conflictos de horarios
            reservas_conflicto = Reserva.objects.filter(
                recurso=recurso,
                estado='confirmada',
                fecha_inicio__lt=fecha_fin,
                fecha_fin__gt=fecha_inicio
            )
            
            if reservas_conflicto.exists():
                reserva_conflicto = reservas_conflicto.first()
                error_msg = (f'Ya existe una reserva para este recurso en el horario seleccionado: '
                           f'{reserva_conflicto.titulo} '
                           f'({reserva_conflicto.fecha_inicio.strftime("%d/%m/%Y %H:%M")} - '
                           f'{reserva_conflicto.fecha_fin.strftime("%d/%m/%Y %H:%M")})')
                if is_ajax:
                    return JsonResponse({'success': False, 'error': error_msg}, status=400)
                messages.error(request, error_msg)
                return redirect('calendario:calendario')
            
            # Crear la reserva
            reserva = Reserva.objects.create(
                recurso=recurso,
                usuario=request.user,
                titulo=titulo,
                descripcion=descripcion,
                fecha_inicio=fecha_inicio,
                fecha_fin=fecha_fin,
                estado='confirmada'
            )
            
            success_msg = 'Reserva creada exitosamente.'
            if is_ajax:
                return JsonResponse({
                    'success': True, 
                    'message': success_msg,
                    'reserva_id': reserva.id
                })
            messages.success(request, success_msg)
            return redirect('calendario:calendario')
            
        except Exception as e:
            error_msg = f'Error inesperado al crear la reserva: {str(e)}'
            if is_ajax:
                return JsonResponse({'success': False, 'error': error_msg}, status=500)
            messages.error(request, error_msg)
            return redirect('calendario:calendario')
    
    return redirect('calendario:calendario')

@login_required
def mis_reservas(request):
    """Vista para mostrar las reservas del usuario"""
    reservas = Reserva.objects.filter(usuario=request.user).order_by('-fecha_inicio')
    return render(request, 'calendario/mis_reservas.html', {'reservas': reservas})

@login_required
def editar_reserva(request, reserva_id):
    """Vista para editar una reserva"""
    reserva = get_object_or_404(Reserva, id=reserva_id, usuario=request.user)
    
    if request.method == 'POST':
        form = ReservaForm(request.POST, instance=reserva)
        if form.is_valid():
            form.save()
            messages.success(request, 'Reserva actualizada exitosamente.')
            return redirect('calendario:mis_reservas')
    else:
        form = ReservaForm(instance=reserva)
    
    return render(request, 'calendario/editar_reserva.html', {'form': form, 'reserva': reserva})

@login_required
def eliminar_reserva(request, reserva_id):
    """Vista para eliminar una reserva"""
    reserva = get_object_or_404(Reserva, id=reserva_id, usuario=request.user)
    
    if request.method == 'POST':
        reserva.delete()
        messages.success(request, 'Reserva eliminada exitosamente.')
        return redirect('calendario:mis_reservas')
    
    return render(request, 'calendario/eliminar_reserva.html', {'reserva': reserva})

def api_reservas(request):
    """API para obtener las reservas en formato JSON para el calendario"""
    fecha_inicio = request.GET.get('start')
    fecha_fin = request.GET.get('end')
    sala_id = request.GET.get('sala')
    
    reservas = Reserva.objects.select_related('recurso', 'usuario').only(
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
        except (ValueError, AttributeError):
            pass
    
    if sala_id and sala_id != 'todas':
        try:
            reservas = reservas.filter(recurso_id=sala_id)
        except ValueError:
            pass
    
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
    
    return JsonResponse(eventos, safe=False)
