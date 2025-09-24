"""
Módulo de vistas del sistema de calendario
Organiza las vistas en módulos especializados para mejor mantenibilidad
"""

from .calendar_views import calendario_view
from .reservation_views import (
    crear_reserva,
    mis_reservas,
    editar_reserva,
    eliminar_reserva
)
from .api_views import (
    api_reservas,
    api_horarios_ocupados,
    api_validar_conflicto
)
from .dashboard_views import dashboard
from .export_views import export_calendar

__all__ = [
    'calendario_view',
    'crear_reserva',
    'mis_reservas',
    'editar_reserva',
    'eliminar_reserva',
    'api_reservas',
    'api_horarios_ocupados',
    'api_validar_conflicto',
    'dashboard',
    'export_calendar',
]
