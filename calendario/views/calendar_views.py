"""
Vistas relacionadas con la visualización del calendario
"""

import logging
from django.shortcuts import render
from django.contrib.auth.decorators import login_required

from ..models import Recurso
from ..utils import CacheService

logger = logging.getLogger('calendario')


def calendario_view(request):
    """
    Vista principal del calendario
    
    Muestra el calendario con los recursos disponibles y permite
    seleccionar una sala específica mediante parámetro URL.
    """
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
