from django.urls import path
from .views import (
    calendar_views,
    reservation_views,
    api_views,
    dashboard_views,
    export_views,
    docs_views
)

app_name = 'calendario'

urlpatterns = [
    # Vistas del calendario
    path('', calendar_views.calendario_view, name='calendario'),
    
    # Vistas de reservas
    path('crear/', reservation_views.crear_reserva, name='crear_reserva'),
    path('mis-reservas/', reservation_views.mis_reservas, name='mis_reservas'),
    path('editar/<int:reserva_id>/', reservation_views.editar_reserva, name='editar_reserva'),
    path('eliminar/<int:reserva_id>/', reservation_views.eliminar_reserva, name='eliminar_reserva'),
    
    # API endpoints
    path('api/reservas/', api_views.api_reservas, name='api_reservas'),
    path('api/horarios-ocupados/', api_views.api_horarios_ocupados, name='api_horarios_ocupados'),
    path('api/validar-conflicto/', api_views.api_validar_conflicto, name='api_validar_conflicto'),
    
    # Dashboard administrativo
    path('dashboard/', dashboard_views.dashboard, name='dashboard'),
    
    # Exportación
    path('export/', export_views.export_calendar, name='export_calendar'),
    
    # Documentación y métricas
    path('docs/', docs_views.api_documentation_view, name='api_docs'),
    path('docs/json/', docs_views.api_docs_json, name='api_docs_json'),
    path('docs/openapi/', docs_views.api_docs_openapi, name='api_docs_openapi'),
    path('docs/markdown/', docs_views.api_docs_markdown, name='api_docs_markdown'),
    path('metrics/', docs_views.system_metrics_view, name='system_metrics'),
    path('health/', docs_views.health_check_endpoint, name='health_check'),
]
