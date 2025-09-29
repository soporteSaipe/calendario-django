from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from django.contrib.auth.models import User
from django.utils.html import format_html
from django.db.models import Count, Q
from django.utils import timezone
from .models import Recurso, Reserva

@admin.register(Recurso)
class RecursoAdmin(admin.ModelAdmin):
    list_display = ['nombre', 'tipo', 'capacidad', 'activo', 'reservas_count', 'reservas_hoy', 'color_preview', 'color']
    list_filter = ['activo', 'tipo', 'capacidad']
    search_fields = ['nombre', 'descripcion', 'marca', 'modelo', 'patente']
    list_editable = ['activo', 'color']
    list_per_page = 20  # Paginación para móviles
    save_on_top = True  # Botones de guardar arriba
    fieldsets = (
        ('Información Básica', {
            'fields': ('nombre', 'tipo', 'descripcion', 'capacidad')
        }),
        ('Información de Vehículo', {
            'fields': ('marca', 'modelo', 'patente'),
            'classes': ('collapse',),
            'description': 'Solo para vehículos'
        }),
        ('Descripción Detallada', {
            'fields': ('descripcion_detallada', 'horario_uso'),
            'classes': ('collapse',)
        }),
        ('Características y Equipamiento', {
            'fields': ('tiene_proyector', 'tiene_pizarra', 'tiene_audio', 'tiene_videoconferencia', 'tiene_wifi', 'tiene_climatizacion'),
            'classes': ('collapse',),
            'description': 'Solo para salas'
        }),
        ('Configuración', {
            'fields': ('activo', 'color'),
            'classes': ('collapse',)
        }),
    )
    
    def color_preview(self, obj):
        """Mostrar una vista previa del color"""
        return format_html(
            '<div style="width: 20px; height: 20px; background-color: {}; border: 1px solid #ccc; border-radius: 3px; display: inline-block;"></div>',
            obj.color
        )
    color_preview.short_description = 'Color'
    color_preview.allow_tags = True
    
    def reservas_count(self, obj):
        """Mostrar cantidad de reservas para este recurso"""
        count = obj.reserva_set.filter(estado='confirmada').count()
        return format_html('<span style="color: #007bff; font-weight: bold;">{}</span>', count)
    reservas_count.short_description = 'Reservas'
    
    def reservas_hoy(self, obj):
        """Mostrar reservas de hoy para este recurso"""
        hoy = timezone.now().date()
        count = obj.reserva_set.filter(
            fecha_inicio__date=hoy,
            estado='confirmada'
        ).count()
        return format_html('<span style="color: #28a745; font-weight: bold;">{}</span>', count)
    reservas_hoy.short_description = 'Hoy'
    
    def get_form(self, request, obj=None, **kwargs):
        """Personalizar el formulario para usar input de tipo color"""
        form = super().get_form(request, obj, **kwargs)
        if form.base_fields.get('color'):
            form.base_fields['color'].widget.attrs.update({
                'type': 'color',
                'style': 'width: 60px; height: 30px;'
            })
        return form

@admin.register(Reserva)
class ReservaAdmin(admin.ModelAdmin):
    list_display = ['get_titulo_display', 'recurso', 'usuario', 'fecha_inicio', 'fecha_fin', 'estado']
    list_filter = ['estado', 'recurso', 'recurso__tipo', 'fecha_inicio', 'fecha_creacion']
    search_fields = ['titulo', 'descripcion', 'responsable', 'destino', 'usuario__username', 'usuario__first_name', 'usuario__last_name']
    date_hierarchy = 'fecha_inicio'
    list_editable = ['estado']
    list_per_page = 25  # Paginación para móviles
    save_on_top = True  # Botones de guardar arriba
    readonly_fields = ['fecha_creacion', 'fecha_actualizacion']
    fieldsets = (
        ('Información de la Reserva', {
            'fields': ('recurso', 'usuario', 'titulo', 'descripcion')
        }),
        ('Información de Vehículo', {
            'fields': ('responsable', 'destino'),
            'classes': ('collapse',),
            'description': 'Solo para vehículos'
        }),
        ('Horarios', {
            'fields': ('fecha_inicio', 'fecha_fin', 'estado')
        }),
        ('Metadatos', {
            'fields': ('fecha_creacion', 'fecha_actualizacion'),
            'classes': ('collapse',)
        }),
    )
    
    def get_titulo_display(self, obj):
        """Mostrar título apropiado según el tipo de recurso"""
        if obj.recurso.es_vehiculo():
            return f"{obj.responsable} - {obj.destino}"
        return obj.titulo
    get_titulo_display.short_description = 'Título/Responsable'

# Configuración personalizada para el modelo User
class UserAdmin(BaseUserAdmin):
    """Configuración personalizada para la administración de usuarios"""
    
    # Campos a mostrar en la lista de usuarios
    list_display = ('username', 'email', 'first_name', 'last_name', 'is_staff', 'is_active', 'date_joined')
    list_filter = ('is_staff', 'is_superuser', 'is_active', 'date_joined')
    search_fields = ('username', 'first_name', 'last_name', 'email')
    ordering = ('-date_joined',)
    
    # Campos editables en la lista
    list_editable = ('is_active', 'is_staff')
    
    # Configuración de campos para el formulario de creación
    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': ('username', 'email', 'first_name', 'last_name', 'password1', 'password2'),
        }),
    )
    
    # Configuración de campos para el formulario de edición
    fieldsets = (
        (None, {'fields': ('username', 'password')}),
        ('Información personal', {'fields': ('first_name', 'last_name', 'email')}),
        ('Permisos', {
            'fields': ('is_active', 'is_staff', 'is_superuser', 'groups', 'user_permissions'),
        }),
        ('Fechas importantes', {'fields': ('last_login', 'date_joined')}),
    )
    
    # Campos de solo lectura
    readonly_fields = ('last_login', 'date_joined')

# Desregistrar el UserAdmin por defecto y registrar el personalizado
admin.site.unregister(User)
admin.site.register(User, UserAdmin)

# Configuración personalizada del sitio admin
admin.site.site_header = "Sistema de Reservas SAIPE"
admin.site.site_title = "Admin Reservas"
admin.site.index_title = "Panel de Administración"

# Vista personalizada para estadísticas
class EstadisticasAdmin(admin.AdminSite):
    def index(self, request, extra_context=None):
        """Vista personalizada del índice con estadísticas"""
        hoy = timezone.now().date()
        semana_pasada = hoy - timezone.timedelta(days=7)
        
        # Estadísticas generales
        stats = {
            'total_recursos': Recurso.objects.filter(activo=True).count(),
            'total_reservas': Reserva.objects.count(),
            'reservas_hoy': Reserva.objects.filter(fecha_inicio__date=hoy).count(),
            'reservas_semana': Reserva.objects.filter(fecha_inicio__date__gte=semana_pasada).count(),
            'usuarios_activos': User.objects.filter(is_active=True).count(),
            'recurso_mas_usado': Reserva.objects.values('recurso__nombre').annotate(
                count=Count('id')
            ).order_by('-count').first(),
        }
        
        if extra_context is None:
            extra_context = {}
        extra_context['stats'] = stats
        
        return super().index(request, extra_context)
