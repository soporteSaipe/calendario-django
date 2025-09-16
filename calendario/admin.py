from django.contrib import admin
from .models import Recurso, Reserva

@admin.register(Recurso)
class RecursoAdmin(admin.ModelAdmin):
    list_display = ['nombre', 'capacidad', 'activo', 'color']
    list_filter = ['activo']
    search_fields = ['nombre', 'descripcion']
    list_editable = ['activo', 'color']

@admin.register(Reserva)
class ReservaAdmin(admin.ModelAdmin):
    list_display = ['titulo', 'recurso', 'usuario', 'fecha_inicio', 'fecha_fin', 'estado']
    list_filter = ['estado', 'recurso', 'fecha_inicio']
    search_fields = ['titulo', 'descripcion', 'usuario__username']
    date_hierarchy = 'fecha_inicio'
    list_editable = ['estado']
