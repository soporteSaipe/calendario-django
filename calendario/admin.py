from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from django.contrib.auth.models import User
from django.utils.html import format_html
from .models import Recurso, Reserva

@admin.register(Recurso)
class RecursoAdmin(admin.ModelAdmin):
    list_display = ['nombre', 'capacidad', 'activo', 'color_preview', 'color']
    list_filter = ['activo']
    search_fields = ['nombre', 'descripcion']
    list_editable = ['activo', 'color']
    
    def color_preview(self, obj):
        """Mostrar una vista previa del color"""
        return format_html(
            '<div style="width: 20px; height: 20px; background-color: {}; border: 1px solid #ccc; border-radius: 3px; display: inline-block;"></div>',
            obj.color
        )
    color_preview.short_description = 'Color'
    color_preview.allow_tags = True
    
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
    list_display = ['titulo', 'recurso', 'usuario', 'fecha_inicio', 'fecha_fin', 'estado']
    list_filter = ['estado', 'recurso', 'fecha_inicio']
    search_fields = ['titulo', 'descripcion', 'usuario__username']
    date_hierarchy = 'fecha_inicio'
    list_editable = ['estado']

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
