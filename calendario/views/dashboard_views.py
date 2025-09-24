"""
Vistas para el dashboard administrativo
"""

import logging
from datetime import datetime, timedelta
from django.shortcuts import render, redirect
from django.contrib.auth.decorators import login_required
from django.contrib.auth.models import User
from django.contrib import messages
from django.utils import timezone
from django.db.models import Count

from ..models import Recurso, Reserva
from ..decorators import require_staff, log_view_access, measure_performance
from ..query_optimizers import DashboardQueryOptimizer
from ..constants import PaginationConfig

logger = logging.getLogger('calendario')


@login_required
@require_staff
@log_view_access
@measure_performance
def dashboard(request):
    """
    Dashboard con métricas básicas - Solo para administradores
    
    Muestra estadísticas del sistema, reservas recientes y métricas de uso.
    """
    
    logger.info(f'Acceso al dashboard por admin: {request.user.username}')
    
    # Usar optimizador de consultas para obtener métricas
    context = DashboardQueryOptimizer.get_metricas_dashboard()
    
    # Agregar métricas adicionales
    context['usuarios_activos'] = User.objects.filter(is_active=True).count()
    
    logger.debug(f'Dashboard generado - Reservas hoy: {context["reservas_hoy"]}')
    
    return render(request, 'calendario/dashboard.html', context)
