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
from .export_views import export_calendar_simple
from .docs_views import (
    api_documentation_view,
    api_docs_json,
    api_docs_openapi,
    api_docs_markdown,
    system_metrics_view,
    health_check_endpoint
)

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
    'export_calendar_simple',
    'api_documentation_view',
    'api_docs_json',
    'api_docs_openapi',
    'api_docs_markdown',
    'system_metrics_view',
    'health_check_endpoint',
]
