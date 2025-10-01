"""
Optimizadores de consultas para el sistema de calendario
Centraliza las consultas optimizadas para evitar N+1 queries y mejorar performance
"""

import logging
from datetime import datetime, timedelta
from django.db.models import Q, Count, Prefetch, F
from django.utils import timezone
from typing import List, Optional, Dict, Any

from .models import Recurso, Reserva
from .constants import BusinessRules

logger = logging.getLogger('calendario')


class ReservaQueryOptimizer:
    """
    Optimizador de consultas para el modelo Reserva
    """
    
    @staticmethod
    def get_reservas_para_calendario(fecha_inicio: Optional[datetime] = None, 
                                   fecha_fin: Optional[datetime] = None,
                                   sala_id: Optional[int] = None) -> List[Reserva]:
        """
        Obtener reservas optimizadas para el calendario
        
        Args:
            fecha_inicio: Fecha de inicio del rango
            fecha_fin: Fecha de fin del rango
            sala_id: ID de la sala específica
            
        Returns:
            QuerySet optimizado de reservas
        """
        # Consulta base optimizada
        queryset = Reserva.objects.select_related(
            'recurso', 'usuario'
        ).only(
            'id', 'titulo', 'fecha_inicio', 'fecha_fin', 'descripcion', 'estado',
            'recurso__id', 'recurso__nombre', 'recurso__color', 'recurso__capacidad',
            'usuario__username'
        ).filter(estado='confirmada')
        
        # Aplicar filtros de fecha si se proporcionan
        if fecha_inicio and fecha_fin:
            queryset = queryset.filter(
                fecha_inicio__lt=fecha_fin,
                fecha_fin__gt=fecha_inicio
            )
        
        # Aplicar filtro de sala si se proporciona
        if sala_id:
            queryset = queryset.filter(recurso_id=sala_id)
        
        return queryset.order_by('fecha_inicio')
    
    @staticmethod
    def get_reservas_usuario_optimizadas(usuario, page_size: int = 15) -> List[Reserva]:
        """
        Obtener reservas del usuario con paginación optimizada
        
        Args:
            usuario: Usuario del cual obtener las reservas
            page_size: Tamaño de página
            
        Returns:
            QuerySet optimizado de reservas del usuario
        """
        return Reserva.objects.filter(usuario=usuario).select_related(
            'recurso', 'usuario'
        ).order_by('-fecha_inicio')
    
    @staticmethod
    def get_todas_las_reservas_optimizadas() -> List[Reserva]:
        """
        Obtener TODAS las reservas del sistema (solo para staff/superusuarios)
        
        Returns:
            QuerySet optimizado de todas las reservas
        """
        return Reserva.objects.select_related(
            'recurso', 'usuario'
        ).order_by('-fecha_inicio')
    
    @staticmethod
    def get_reservas_por_fecha(fecha: datetime, sala_id: Optional[int] = None) -> List[Reserva]:
        """
        Obtener reservas para una fecha específica
        
        Args:
            fecha: Fecha para la cual obtener reservas
            sala_id: ID de la sala específica
            
        Returns:
            QuerySet de reservas para la fecha
        """
        queryset = Reserva.objects.filter(
            fecha_inicio__date=fecha.date(),
            estado='confirmada'
        ).select_related('recurso', 'usuario')
        
        if sala_id:
            queryset = queryset.filter(recurso_id=sala_id)
        
        return queryset.order_by('fecha_inicio')
    
    @staticmethod
    def get_reservas_conflicto(recurso, fecha_inicio: datetime, 
                             fecha_fin: datetime, reserva_excluir: Optional[int] = None) -> List[Reserva]:
        """
        Obtener reservas que podrían estar en conflicto
        
        Args:
            recurso: Recurso para verificar conflictos
            fecha_inicio: Fecha de inicio de la reserva
            fecha_fin: Fecha de fin de la reserva
            reserva_excluir: ID de reserva a excluir (para edición)
            
        Returns:
            QuerySet de reservas en conflicto
        """
        queryset = Reserva.objects.filter(
            recurso=recurso,
            estado='confirmada',
            fecha_inicio__lt=fecha_fin,
            fecha_fin__gt=fecha_inicio
        ).select_related('usuario')
        
        if reserva_excluir:
            queryset = queryset.exclude(id=reserva_excluir)
        
        return queryset


class RecursoQueryOptimizer:
    """
    Optimizador de consultas para el modelo Recurso
    """
    
    @staticmethod
    def get_recursos_activos_optimizados() -> List[Recurso]:
        """
        Obtener recursos activos optimizados
        
        Returns:
            QuerySet optimizado de recursos activos
        """
        return Recurso.objects.filter(activo=True).select_related().order_by('nombre')
    
    @staticmethod
    def get_recurso_con_estadisticas(recurso_id: int) -> Optional[Recurso]:
        """
        Obtener un recurso con estadísticas de uso
        
        Args:
            recurso_id: ID del recurso
            
        Returns:
            Recurso con estadísticas o None
        """
        try:
            return Recurso.objects.select_related().prefetch_related(
                Prefetch(
                    'reserva_set',
                    queryset=Reserva.objects.filter(estado='confirmada').select_related('usuario'),
                    to_attr='reservas_confirmadas'
                )
            ).get(id=recurso_id, activo=True)
        except Recurso.DoesNotExist:
            return None


class DashboardQueryOptimizer:
    """
    Optimizador de consultas para el dashboard
    """
    
    @staticmethod
    def get_metricas_dashboard() -> Dict[str, Any]:
        """
        Obtener métricas optimizadas para el dashboard
        
        Returns:
            Diccionario con métricas del dashboard
        """
        hoy = timezone.now().date()
        semana_pasada = hoy - timedelta(days=7)
        mes_pasado = hoy - timedelta(days=30)
        
        # Usar una sola consulta para obtener múltiples métricas
        reservas_hoy = Reserva.objects.filter(fecha_inicio__date=hoy).count()
        reservas_semana = Reserva.objects.filter(fecha_inicio__date__gte=semana_pasada).count()
        reservas_mes = Reserva.objects.filter(fecha_inicio__date__gte=mes_pasado).count()
        
        # Obtener recursos activos
        recursos_activos = Recurso.objects.filter(activo=True).count()
        
        # Obtener próxima reserva
        proxima_reserva = Reserva.objects.filter(
            fecha_inicio__gte=timezone.now(),
            estado='confirmada'
        ).select_related('recurso', 'usuario').order_by('fecha_inicio').first()
        
        # Obtener reservas recientes
        reservas_recientes = Reserva.objects.select_related(
            'recurso', 'usuario'
        ).order_by('-fecha_inicio')[:10]
        
        # Obtener recurso más usado
        recurso_mas_usado = Reserva.objects.values('recurso__nombre').annotate(
            count=Count('id')
        ).order_by('-count').first()
        
        # Obtener usuarios más activos
        usuarios_mas_activos = Reserva.objects.values(
            'usuario__username', 'usuario__first_name', 'usuario__last_name'
        ).annotate(
            count=Count('id')
        ).order_by('-count')[:5]
        
        return {
            'reservas_hoy': reservas_hoy,
            'reservas_semana': reservas_semana,
            'reservas_mes': reservas_mes,
            'recursos_activos': recursos_activos,
            'proxima_reserva': proxima_reserva,
            'reservas_recientes': reservas_recientes,
            'recurso_mas_usado': recurso_mas_usado,
            'usuarios_mas_activos': usuarios_mas_activos,
        }
    
    @staticmethod
    def get_estadisticas_por_recurso(fecha_inicio: Optional[datetime] = None,
                                   fecha_fin: Optional[datetime] = None) -> List[Dict[str, Any]]:
        """
        Obtener estadísticas de uso por recurso
        
        Args:
            fecha_inicio: Fecha de inicio del período
            fecha_fin: Fecha de fin del período
            
        Returns:
            Lista de diccionarios con estadísticas por recurso
        """
        queryset = Reserva.objects.filter(estado='confirmada')
        
        if fecha_inicio and fecha_fin:
            queryset = queryset.filter(
                fecha_inicio__date__range=[fecha_inicio.date(), fecha_fin.date()]
            )
        
        return queryset.values('recurso__nombre', 'recurso__capacidad').annotate(
            total_reservas=Count('id'),
            horas_totales=F('fecha_fin') - F('fecha_inicio')
        ).order_by('-total_reservas')


class ExportQueryOptimizer:
    """
    Optimizador de consultas para exportación
    """
    
    @staticmethod
    def get_reservas_para_exportacion(salas_ids: List[int], 
                                    fecha_inicio: datetime,
                                    fecha_fin: datetime) -> List[Reserva]:
        """
        Obtener reservas optimizadas para exportación
        
        Args:
            salas_ids: Lista de IDs de salas
            fecha_inicio: Fecha de inicio del período
            fecha_fin: Fecha de fin del período
            
        Returns:
            QuerySet optimizado para exportación
        """
        return Reserva.objects.filter(
            recurso_id__in=salas_ids,
            fecha_inicio__date__range=[fecha_inicio.date(), fecha_fin.date()],
            estado='confirmada'
        ).select_related('recurso', 'usuario').order_by('fecha_inicio')
    
    @staticmethod
    def get_reservas_por_periodo(fecha_inicio: datetime, 
                               fecha_fin: datetime,
                               limite: int = 10000) -> List[Reserva]:
        """
        Obtener reservas por período con límite
        
        Args:
            fecha_inicio: Fecha de inicio
            fecha_fin: Fecha de fin
            limite: Límite máximo de registros
            
        Returns:
            QuerySet limitado de reservas
        """
        return Reserva.objects.filter(
            fecha_inicio__date__range=[fecha_inicio.date(), fecha_fin.date()],
            estado='confirmada'
        ).select_related('recurso', 'usuario')[:limite]


class CacheQueryOptimizer:
    """
    Optimizador de consultas con cache
    """
    
    @staticmethod
    def get_recursos_activos_cached():
        """
        Obtener recursos activos con cache
        
        Returns:
            Lista de recursos activos
        """
        from django.core.cache import cache
        from .constants import CacheConfig
        
        cache_key = CacheConfig.CACHE_KEY_RECURSOS
        recursos = cache.get(cache_key)
        
        if recursos is None:
            logger.debug('Cache miss para recursos activos, consultando BD')
            recursos = list(RecursoQueryOptimizer.get_recursos_activos_optimizados())
            cache.set(cache_key, recursos, CacheConfig.RECURSOS_TIMEOUT)
            logger.info(f'Recursos activos cacheados: {len(recursos)} recursos')
        else:
            logger.debug(f'Cache hit para recursos activos: {len(recursos)} recursos')
        
        return recursos
    
    @staticmethod
    def invalidar_cache_recursos():
        """
        Invalidar cache de recursos
        """
        from django.core.cache import cache
        from .constants import CacheConfig
        
        cache.delete(CacheConfig.CACHE_KEY_RECURSOS)
        logger.info('Cache de recursos invalidado')
