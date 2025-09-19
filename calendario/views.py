from django.shortcuts import render, get_object_or_404, redirect
from django.contrib.auth.decorators import login_required
from django.contrib import messages
from django.http import JsonResponse
from django.core.cache import cache
from django.urls import reverse

from .models import Recurso, Reserva
from .forms import ReservaForm

def calendario_view(request):
    """Vista principal del calendario"""
    # Reducir cache a 30 segundos para cambios más rápidos en admin
    cache_key = 'recursos_activos'
    recursos = cache.get(cache_key)
    if recursos is None:
        recursos = list(Recurso.objects.filter(activo=True))
        cache.set(cache_key, recursos, 30)
    
    # Obtener sala seleccionada desde parámetro URL
    sala_seleccionada = request.GET.get('sala')
    sala_activa = None
    
    if sala_seleccionada:
        try:
            sala_activa = Recurso.objects.get(id=sala_seleccionada, activo=True)
        except Recurso.DoesNotExist:
            sala_activa = None
    
    # Si no hay sala seleccionada, usar la primera disponible
    if not sala_activa and recursos:
        sala_activa = recursos[0]
    
    context = {
        'recursos': recursos,
        'sala_activa': sala_activa
    }
    
    return render(request, 'calendario/calendario.html', context)

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
            from django.conf import settings
            
            try:
                # Crear datetime naive primero
                fecha_inicio_naive = datetime.strptime(f"{fecha} {hora_inicio}", "%Y-%m-%d %H:%M")
                fecha_fin_naive = datetime.strptime(f"{fecha} {hora_fin}", "%Y-%m-%d %H:%M")
                
                # Debug: Imprimir fechas antes de la conversión
                print(f"DEBUG - Fecha inicio naive: {fecha_inicio_naive}")
                print(f"DEBUG - Fecha fin naive: {fecha_fin_naive}")
                print(f"DEBUG - Zona horaria actual: {timezone.get_current_timezone()}")
                print(f"DEBUG - TIME_ZONE setting: {settings.TIME_ZONE}")
                
                # Importar pytz para manejo más preciso de zonas horarias
                import pytz
                
                # Obtener la zona horaria de Buenos Aires
                buenos_aires_tz = pytz.timezone('America/Argentina/Buenos_Aires')
                
                # Localizar las fechas en la zona horaria de Buenos Aires
                # Esto asegura que 10:30 se interprete como 10:30 en Buenos Aires, no en US East
                fecha_inicio = buenos_aires_tz.localize(fecha_inicio_naive)
                fecha_fin = buenos_aires_tz.localize(fecha_fin_naive)
                
                # Debug: Imprimir fechas después de la conversión
                print(f"DEBUG - Fecha inicio aware: {fecha_inicio}")
                print(f"DEBUG - Fecha fin aware: {fecha_fin}")
                print(f"DEBUG - Fecha inicio UTC: {fecha_inicio.astimezone(pytz.UTC)}")
                print(f"DEBUG - Fecha fin UTC: {fecha_fin.astimezone(pytz.UTC)}")
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
            
            # Verificar restricciones específicas del recurso
            horarios_restringidos = recurso.get_horarios_restringidos()
            for restriccion in horarios_restringidos:
                hora_inicio_reserva = fecha_inicio.time()
                hora_fin_reserva = fecha_fin.time()
                hora_inicio_restriccion = datetime.strptime(restriccion['inicio'], '%H:%M').time()
                hora_fin_restriccion = datetime.strptime(restriccion['fin'], '%H:%M').time()
                
                # Verificar si hay solapamiento con horario restringido
                if (hora_inicio_reserva < hora_fin_restriccion and 
                    hora_fin_reserva > hora_inicio_restriccion):
                    error_msg = (f'No se puede reservar en el horario de {restriccion["inicio"]} a '
                               f'{restriccion["fin"]} para {recurso.nombre}: {restriccion["motivo"]}')
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
            # Redirigir con parámetro de sala para mostrar la sala donde se creó la reserva
            return redirect(f"{reverse('calendario:calendario')}?sala={recurso.id}")
            
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
    import json
    
    reservas = Reserva.objects.filter(usuario=request.user).order_by('-fecha_inicio')
    recursos = Recurso.objects.filter(activo=True)
    
    # Crear JSON de salas para JavaScript
    salas_data = []
    for recurso in recursos:
        salas_data.append({
            'id': recurso.id,
            'nombre': recurso.nombre,
            'esComedor': 'comedor' in recurso.nombre.lower()
        })
    
    salas_json = json.dumps(salas_data, ensure_ascii=False)
    
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
    
    if request.method == 'POST':
        # Verificar si es una petición AJAX
        is_ajax = request.headers.get('X-Requested-With') == 'XMLHttpRequest'
        
        print(f"=== DEBUG EDICIÓN RESERVA ===")
        print(f"Reserva ID: {reserva_id}")
        print(f"Usuario: {request.user}")
        print(f"Es AJAX: {is_ajax}")
        print(f"Datos POST: {dict(request.POST)}")
        
        form = ReservaForm(request.POST, instance=reserva)
        print(f"Formulario válido: {form.is_valid()}")
        if not form.is_valid():
            print(f"Errores del formulario: {form.errors}")
        
        if form.is_valid():
            form.save()
            print("Reserva guardada exitosamente")
            
            if is_ajax:
                return JsonResponse({
                    'success': True,
                    'message': 'Reserva actualizada exitosamente.'
                })
            else:
                messages.success(request, 'Reserva actualizada exitosamente.')
                return redirect('calendario:mis_reservas')
        else:
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
    
    if request.method == 'POST':
        # Verificar si es una petición AJAX
        is_ajax = request.headers.get('X-Requested-With') == 'XMLHttpRequest'
        
        try:
            reserva.delete()
            
            if is_ajax:
                return JsonResponse({
                    'success': True,
                    'message': 'Reserva eliminada exitosamente.'
                })
            else:
                messages.success(request, 'Reserva eliminada exitosamente.')
                return redirect('calendario:mis_reservas')
        except Exception as e:
            if is_ajax:
                return JsonResponse({
                    'success': False,
                    'message': 'Error al eliminar la reserva.'
                }, status=500)
            else:
                messages.error(request, 'Error al eliminar la reserva.')
                return redirect('calendario:mis_reservas')
    
    return render(request, 'calendario/eliminar_reserva.html', {'reserva': reserva})

def api_reservas(request):
    """API para obtener las reservas en formato JSON para el calendario"""
    fecha_inicio = request.GET.get('start')
    fecha_fin = request.GET.get('end')
    sala_id = request.GET.get('sala')
    
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
    API para validar conflictos de reservas en tiempo real
    """
    if request.method != 'GET':
        return JsonResponse({'error': 'Método no permitido'}, status=405)
    
    try:
        # Obtener parámetros
        sala_id = request.GET.get('sala')
        fecha = request.GET.get('fecha')
        hora_inicio = request.GET.get('hora_inicio')
        hora_fin = request.GET.get('hora_fin')
        
        if not all([sala_id, fecha, hora_inicio, hora_fin]):
            return JsonResponse({'error': 'Parámetros faltantes'}, status=400)
        
        # Convertir fecha
        fecha_obj = datetime.strptime(fecha, '%Y-%m-%d').date()
        
        # Validar formato de horas
        try:
            hora_inicio_obj = datetime.strptime(hora_inicio, '%H:%M').time()
            hora_fin_obj = datetime.strptime(hora_fin, '%H:%M').time()
        except ValueError:
            return JsonResponse({'error': 'Formato de hora inválido'}, status=400)
        
        # Validar que la hora de inicio sea anterior a la de fin
        if hora_inicio_obj >= hora_fin_obj:
            return JsonResponse({
                'conflicts': [{
                    'type': 'time_validation',
                    'message': 'La hora de inicio debe ser anterior a la hora de fin'
                }]
            })
        
        # Buscar conflictos de reservas existentes
        conflictos = []
        
        # Verificar reservas existentes en el mismo horario
        reservas_existentes = Reserva.objects.filter(
            recurso_id=sala_id,
            fecha=fecha_obj
        ).exclude(
            Q(hora_fin__lte=hora_inicio_obj) | Q(hora_inicio__gte=hora_fin_obj)
        )
        
        for reserva in reservas_existentes:
            conflictos.append({
                'type': 'reserva_conflict',
                'message': f'Conflicto con reserva existente: "{reserva.titulo}" ({reserva.hora_inicio} - {reserva.hora_fin})',
                'reserva_id': reserva.id,
                'reserva_titulo': reserva.titulo,
                'reserva_hora_inicio': reserva.hora_inicio.strftime('%H:%M'),
                'reserva_hora_fin': reserva.hora_fin.strftime('%H:%M')
            })
        
        # Verificar restricciones del recurso
        try:
            recurso = Recurso.objects.get(id=sala_id)
            horarios_restringidos = recurso.get_horarios_restringidos()
            
            for restriccion in horarios_restringidos:
                if (restriccion['hora_inicio'] < hora_fin_obj and 
                    restriccion['hora_fin'] > hora_inicio_obj):
                    conflictos.append({
                        'type': 'restriction_conflict',
                        'message': f'El horario solicitado está restringido: {restriccion["motivo"]}',
                        'restriccion': restriccion
                    })
        except Recurso.DoesNotExist:
            conflictos.append({
                'type': 'resource_not_found',
                'message': 'La sala seleccionada no existe'
            })
        
        # Verificar horarios de trabajo (7:00 - 18:00)
        if hora_inicio_obj < datetime.strptime('07:00', '%H:%M').time():
            conflictos.append({
                'type': 'working_hours',
                'message': 'Las reservas solo pueden realizarse entre las 07:00 y 18:00'
            })
        
        if hora_fin_obj > datetime.strptime('18:00', '%H:%M').time():
            conflictos.append({
                'type': 'working_hours',
                'message': 'Las reservas solo pueden realizarse entre las 07:00 y 18:00'
            })
        
        # Verificar que la fecha no sea en el pasado
        hoy = datetime.now().date()
        if fecha_obj < hoy:
            conflictos.append({
                'type': 'past_date',
                'message': 'No se pueden realizar reservas en fechas pasadas'
            })
        
        # Verificar que la fecha no sea más de 6 meses en el futuro
        max_fecha = hoy + timedelta(days=180)
        if fecha_obj > max_fecha:
            conflictos.append({
                'type': 'future_date',
                'message': 'Las reservas solo pueden realizarse hasta 6 meses en el futuro'
            })
        
        return JsonResponse({
            'conflicts': conflictos,
            'valid': len(conflictos) == 0,
            'fecha': fecha,
            'hora_inicio': hora_inicio,
            'hora_fin': hora_fin,
            'sala_id': sala_id
        })
        
    except ValueError as e:
        return JsonResponse({'error': f'Formato de fecha inválido: {str(e)}'}, status=400)
    except Exception as e:
        return JsonResponse({'error': f'Error interno: {str(e)}'}, status=500)


def export_calendar(request):
    """
    Exportar calendario en formato PDF o iCal
    """
    if not request.user.is_staff:
        return JsonResponse({'error': 'Acceso denegado'}, status=403)
    
    try:
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
        
        if format_type not in ['pdf', 'ical']:
            return JsonResponse({'error': 'Formato no soportado'}, status=400)
        
        # Convertir fechas
        fecha_inicio = datetime.strptime(date_from, '%Y-%m-%d').date()
        fecha_fin = datetime.strptime(date_to, '%Y-%m-%d').date()
        
        if fecha_inicio > fecha_fin:
            return JsonResponse({'error': 'Fecha de inicio debe ser anterior a fecha de fin'}, status=400)
        
        # Filtrar salas
        if salas and salas[0]:  # Si se especificaron salas
            salas_ids = [int(sala) for sala in salas if sala.isdigit()]
        else:
            salas_ids = list(Recurso.objects.values_list('id', flat=True))
        
        # Obtener reservas
        reservas = Reserva.objects.filter(
            recurso_id__in=salas_ids,
            fecha__range=[fecha_inicio, fecha_fin]
        ).select_related('recurso', 'usuario').order_by('fecha', 'hora_inicio')
        
        if not reservas.exists():
            return JsonResponse({'error': 'No hay reservas en el rango de fechas especificado'}, status=404)
        
        # Generar exportación según el formato
        if format_type == 'pdf':
            return generate_pdf_export(reservas, fecha_inicio, fecha_fin, {
                'include_descriptions': include_descriptions,
                'include_attendees': include_attendees,
                'include_location': include_location
            })
        elif format_type == 'ical':
            return generate_ical_export(reservas, fecha_inicio, fecha_fin, {
                'include_descriptions': include_descriptions,
                'include_attendees': include_attendees,
                'include_location': include_location
            })
            
    except ValueError as e:
        return JsonResponse({'error': f'Formato de fecha inválido: {str(e)}'}, status=400)
    except Exception as e:
        return JsonResponse({'error': f'Error interno: {str(e)}'}, status=500)


def generate_pdf_export(reservas, fecha_inicio, fecha_fin, options):
    """
    Generar exportación PDF del calendario
    """
    try:
        from reportlab.lib.pagesizes import letter, A4
        from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
        from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
        from reportlab.lib.units import inch
        from reportlab.lib import colors
        from reportlab.lib.enums import TA_CENTER, TA_LEFT
        from io import BytesIO
        
        # Crear buffer para el PDF
        buffer = BytesIO()
        
        # Crear documento PDF
        doc = SimpleDocTemplate(buffer, pagesize=A4, rightMargin=72, leftMargin=72, topMargin=72, bottomMargin=18)
        
        # Estilos
        styles = getSampleStyleSheet()
        title_style = ParagraphStyle(
            'CustomTitle',
            parent=styles['Heading1'],
            fontSize=18,
            spaceAfter=30,
            alignment=TA_CENTER,
            textColor=colors.HexColor('#2c3e50')
        )
        
        header_style = ParagraphStyle(
            'CustomHeader',
            parent=styles['Heading2'],
            fontSize=14,
            spaceAfter=12,
            textColor=colors.HexColor('#34495e')
        )
        
        # Contenido del PDF
        story = []
        
        # Título
        title = Paragraph("Sistema de Reservas de Salas SAIPE", title_style)
        story.append(title)
        
        # Información del reporte
        info_text = f"""
        <b>Período:</b> {fecha_inicio.strftime('%d/%m/%Y')} - {fecha_fin.strftime('%d/%m/%Y')}<br/>
        <b>Total de reservas:</b> {reservas.count()}<br/>
        <b>Generado el:</b> {datetime.now().strftime('%d/%m/%Y %H:%M')}
        """
        info = Paragraph(info_text, styles['Normal'])
        story.append(info)
        story.append(Spacer(1, 20))
        
        # Agrupar reservas por fecha
        reservas_por_fecha = {}
        for reserva in reservas:
            fecha_str = reserva.fecha.strftime('%d/%m/%Y')
            if fecha_str not in reservas_por_fecha:
                reservas_por_fecha[fecha_str] = []
            reservas_por_fecha[fecha_str].append(reserva)
        
        # Crear tabla para cada fecha
        for fecha_str, reservas_fecha in reservas_por_fecha.items():
            # Encabezado de fecha
            fecha_header = Paragraph(f"<b>{fecha_str}</b>", header_style)
            story.append(fecha_header)
            
            # Crear tabla de reservas
            table_data = [['Hora', 'Sala', 'Título', 'Usuario']]
            
            if options['include_descriptions']:
                table_data[0].append('Descripción')
            if options['include_location']:
                table_data[0].append('Ubicación')
            
            for reserva in reservas_fecha:
                row = [
                    f"{reserva.hora_inicio.strftime('%H:%M')} - {reserva.hora_fin.strftime('%H:%M')}",
                    reserva.recurso.nombre,
                    reserva.titulo,
                    reserva.usuario.username
                ]
                
                if options['include_descriptions']:
                    descripcion = reserva.descripcion or 'Sin descripción'
                    row.append(descripcion[:50] + '...' if len(descripcion) > 50 else descripcion)
                
                if options['include_location']:
                    ubicacion = f"Sala {reserva.recurso.nombre} - Capacidad: {reserva.recurso.capacidad}"
                    row.append(ubicacion)
                
                table_data.append(row)
            
            # Crear tabla
            table = Table(table_data, colWidths=[1.5*inch, 1.2*inch, 2*inch, 1*inch])
            table.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#3498db')),
                ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
                ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
                ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                ('FONTSIZE', (0, 0), (-1, 0), 10),
                ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
                ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
                ('GRID', (0, 0), (-1, -1), 1, colors.black),
                ('FONTSIZE', (0, 1), (-1, -1), 9),
                ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor('#f8f9fa')])
            ]))
            
            story.append(table)
            story.append(Spacer(1, 20))
        
        # Construir PDF
        doc.build(story)
        
        # Obtener contenido del buffer
        buffer.seek(0)
        pdf_content = buffer.getvalue()
        buffer.close()
        
        # Crear respuesta
        response = HttpResponse(pdf_content, content_type='application/pdf')
        response['Content-Disposition'] = f'attachment; filename="calendario_{fecha_inicio.strftime("%Y%m%d")}_{fecha_fin.strftime("%Y%m%d")}.pdf"'
        
        return response
        
    except ImportError:
        return JsonResponse({'error': 'ReportLab no está instalado. Instala con: pip install reportlab'}, status=500)
    except Exception as e:
        return JsonResponse({'error': f'Error al generar PDF: {str(e)}'}, status=500)


def generate_ical_export(reservas, fecha_inicio, fecha_fin, options):
    """
    Generar exportación iCal del calendario
    """
    try:
        from icalendar import Calendar, Event
        from datetime import datetime, timedelta
        import pytz
        
        # Crear calendario iCal
        cal = Calendar()
        cal.add('prodid', '-//SAIPE//Sistema de Reservas//ES')
        cal.add('version', '2.0')
        cal.add('calscale', 'GREGORIAN')
        cal.add('method', 'PUBLISH')
        cal.add('X-WR-CALNAME', 'Reservas de Salas SAIPE')
        cal.add('X-WR-CALDESC', f'Reservas de salas del {fecha_inicio} al {fecha_fin}')
        cal.add('X-WR-TIMEZONE', 'America/Argentina/Buenos_Aires')
        
        # Zona horaria
        tz = pytz.timezone('America/Argentina/Buenos_Aires')
        
        # Crear evento para cada reserva
        for reserva in reservas:
            event = Event()
            
            # ID único del evento
            event.add('uid', f'reserva-{reserva.id}@saipe.com')
            
            # Fecha y hora de inicio
            dtstart = datetime.combine(reserva.fecha, reserva.hora_inicio)
            dtstart = tz.localize(dtstart)
            event.add('dtstart', dtstart)
            
            # Fecha y hora de fin
            dtend = datetime.combine(reserva.fecha, reserva.hora_fin)
            dtend = tz.localize(dtend)
            event.add('dtend', dtend)
            
            # Título
            event.add('summary', reserva.titulo)
            
            # Descripción
            descripcion_parts = [f"Sala: {reserva.recurso.nombre}"]
            if options['include_descriptions'] and reserva.descripcion:
                descripcion_parts.append(f"Descripción: {reserva.descripcion}")
            if options['include_location']:
                descripcion_parts.append(f"Capacidad: {reserva.recurso.capacidad} personas")
            if options['include_attendees']:
                descripcion_parts.append(f"Reservado por: {reserva.usuario.get_full_name() or reserva.usuario.username}")
            
            event.add('description', '\n'.join(descripcion_parts))
            
            # Ubicación
            if options['include_location']:
                event.add('location', f"Sala {reserva.recurso.nombre}")
            
            # Organizador
            event.add('organizer', f"MAILTO:{reserva.usuario.email or 'noreply@saipe.com'}")
            
            # Estado
            event.add('status', 'CONFIRMED')
            
            # Creado y modificado
            event.add('created', reserva.fecha_creacion)
            event.add('last-modified', reserva.fecha_modificacion or reserva.fecha_creacion)
            
            # Agregar evento al calendario
            cal.add_component(event)
        
        # Generar contenido iCal
        ical_content = cal.to_ical().decode('utf-8')
        
        # Crear respuesta
        response = HttpResponse(ical_content, content_type='text/calendar; charset=utf-8')
        response['Content-Disposition'] = f'attachment; filename="calendario_{fecha_inicio.strftime("%Y%m%d")}_{fecha_fin.strftime("%Y%m%d")}.ics"'
        
        return response
        
    except ImportError:
        return JsonResponse({'error': 'icalendar no está instalado. Instala con: pip install icalendar'}, status=500)
    except Exception as e:
        return JsonResponse({'error': f'Error al generar iCal: {str(e)}'}, status=500)