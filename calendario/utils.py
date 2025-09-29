"""
Utilidades y servicios para el sistema de calendario
"""
import logging
from datetime import datetime, timedelta
from django.core.cache import cache
from django.core.exceptions import ValidationError
from django.db import models
from django.utils import timezone
from typing import List, Dict, Optional, Tuple
from .models import Recurso, Reserva
from .exceptions import (
    ReservaValidationError, 
    RecursoNotFoundError, 
    ConflictoReservaError,
    RestriccionHorarioError,
    FechaInvalidaError,
    HorarioTrabajoError
)
from .constants import (
    BusinessRules,
    CacheConfig,
    TimezoneConfig
)
from .query_optimizers import ReservaQueryOptimizer

# Configurar logger específico para el módulo
logger = logging.getLogger(__name__)

class ReservaService:
    """
    Servicio centralizado para la lógica de negocio de reservas
    """
    
    @staticmethod
    def validar_horarios_trabajo(fecha_inicio: datetime, fecha_fin: datetime) -> None:
        """
        Validar que las reservas estén dentro del horario de trabajo
        """
        # Verificar horario de inicio
        if fecha_inicio.time() < datetime.strptime(f'{BusinessRules.MIN_HOUR:02d}:00', '%H:%M').time():
            raise HorarioTrabajoError(f'Las reservas solo pueden realizarse a partir de las {BusinessRules.MIN_HOUR:02d}:00')
        
        # Verificar horario de fin
        if fecha_fin.time() > datetime.strptime(f'{BusinessRules.MAX_HOUR:02d}:00', '%H:%M').time():
            raise HorarioTrabajoError(f'Las reservas solo pueden realizarse hasta las {BusinessRules.MAX_HOUR:02d}:00')
    
    @staticmethod
    def validar_fechas(fecha_inicio: datetime, fecha_fin: datetime) -> None:
        """
        Validar fechas de reserva
        """
        hoy = datetime.now().date()
        
        # Verificar que la fecha no sea en el pasado
        if fecha_inicio.date() < hoy:
            raise FechaInvalidaError('No se pueden realizar reservas en fechas pasadas')
        
        # Verificar que la fecha no sea más de 6 meses en el futuro
        max_fecha = hoy + timedelta(days=BusinessRules.MAX_FUTURE_DAYS)
        if fecha_inicio.date() > max_fecha:
            raise FechaInvalidaError(f'Las reservas solo pueden realizarse hasta {BusinessRules.MAX_FUTURE_DAYS} días en el futuro')
        
        # Verificar que fecha_fin sea posterior a fecha_inicio
        if fecha_fin <= fecha_inicio:
            raise FechaInvalidaError('La fecha de fin debe ser posterior a la fecha de inicio')
    
    @staticmethod
    def validar_conflictos_reserva(recurso: Recurso, fecha_inicio: datetime, 
                                 fecha_fin: datetime, reserva_excluir: Optional[int] = None) -> None:
        """
        Validar conflictos con reservas existentes
        """
        # Usar optimizador de consultas
        reservas_conflicto = ReservaQueryOptimizer.get_reservas_conflicto(
            recurso, fecha_inicio, fecha_fin, reserva_excluir
        )
        
        reserva_conflicto = reservas_conflicto.first()
        
        if reserva_conflicto:
            logger.warning(f'Conflicto de reserva detectado: {reserva_conflicto.titulo}')
            raise ConflictoReservaError(reserva_conflicto)
    
    @staticmethod
    def validar_restricciones_recurso(recurso: Recurso, fecha_inicio: datetime, 
                                    fecha_fin: datetime) -> None:
        """
        Validar restricciones específicas del recurso
        """
        horarios_restringidos = recurso.get_horarios_restringidos()
        
        for restriccion in horarios_restringidos:
            hora_inicio_reserva = fecha_inicio.time()
            hora_fin_reserva = fecha_fin.time()
            hora_inicio_restriccion = datetime.strptime(restriccion['inicio'], '%H:%M').time()
            hora_fin_restriccion = datetime.strptime(restriccion['fin'], '%H:%M').time()
            
            # Verificar si hay solapamiento con horario restringido
            if (hora_inicio_reserva < hora_fin_restriccion and 
                hora_fin_reserva > hora_inicio_restriccion):
                logger.info(f'Restricción de horario aplicada para {recurso.nombre}')
                raise RestriccionHorarioError(restriccion, recurso)
    
    @staticmethod
    def validar_reserva_completa(recurso: Recurso, fecha_inicio: datetime, 
                               fecha_fin: datetime, reserva_excluir: Optional[int] = None) -> None:
        """
        Validación completa de una reserva - lanza excepciones si hay errores
        """
        logger.info(f'Iniciando validación de reserva para {recurso.nombre} desde {fecha_inicio} hasta {fecha_fin}')
        
        # Validar fechas básicas
        ReservaService.validar_fechas(fecha_inicio, fecha_fin)
        
        # Validar horarios de trabajo
        ReservaService.validar_horarios_trabajo(fecha_inicio, fecha_fin)
        
        # Validar conflictos con otras reservas
        ReservaService.validar_conflictos_reserva(recurso, fecha_inicio, fecha_fin, reserva_excluir)
        
        # Validar restricciones del recurso
        ReservaService.validar_restricciones_recurso(recurso, fecha_inicio, fecha_fin)
        
        logger.info(f'Validación completada exitosamente para {recurso.nombre}')
    
    @staticmethod
    def crear_reserva(usuario, recurso: Recurso, titulo: str, descripcion: str,
                     fecha_inicio: datetime, fecha_fin: datetime, 
                     responsable: str = '', destino: str = '') -> Reserva:
        """
        Crear una nueva reserva con validación completa
        """
        logger.info(f'Creando reserva para usuario {usuario.username} en {recurso.nombre}')
        
        # Validar reserva (lanza excepciones si hay errores)
        ReservaService.validar_reserva_completa(recurso, fecha_inicio, fecha_fin)
        
        try:
            # Crear la reserva
            reserva = Reserva.objects.create(
                recurso=recurso,
                usuario=usuario,
                titulo=titulo,
                descripcion=descripcion,
                fecha_inicio=fecha_inicio,
                fecha_fin=fecha_fin,
                responsable=responsable,
                destino=destino,
                estado='confirmada'
            )
            
            # Limpiar cache de recursos
            CacheService.invalidar_cache_recursos()
            
            logger.info(f'Reserva creada exitosamente con ID: {reserva.id}')
            
            return reserva
            
        except Exception as e:
            logger.error(f'Error al crear reserva: {str(e)}')
            raise ReservaValidationError(f'Error inesperado al crear la reserva: {str(e)}')
    
    @staticmethod
    def actualizar_reserva(reserva: Reserva, titulo: str, descripcion: str,
                          fecha_inicio: datetime, fecha_fin: datetime) -> Reserva:
        """
        Actualizar una reserva existente con validación completa
        """
        logger.info(f'Actualizando reserva ID: {reserva.id}')
        
        # Validar reserva (excluyendo la reserva actual)
        ReservaService.validar_reserva_completa(
            reserva.recurso, fecha_inicio, fecha_fin, reserva.id
        )
        
        try:
            # Actualizar la reserva
            reserva.titulo = titulo
            reserva.descripcion = descripcion
            reserva.fecha_inicio = fecha_inicio
            reserva.fecha_fin = fecha_fin
            reserva.save()
            
            logger.info(f'Reserva actualizada exitosamente: {reserva.id}')
            
            return reserva
            
        except Exception as e:
            logger.error(f'Error al actualizar reserva: {str(e)}')
            raise ReservaValidationError(f'Error inesperado al actualizar la reserva: {str(e)}')


class CacheService:
    """
    Servicio para manejo de cache
    """
    
    @staticmethod
    def get_recursos_activos():
        """
        Obtener recursos activos con cache optimizado
        """
        from django.core.cache import caches
        
        # Intentar usar cache específico de recursos si está disponible
        try:
            cache_recursos = caches['recursos']
        except Exception:
            cache_recursos = cache
        
        cache_key = CacheConfig.CACHE_KEY_RECURSOS
        recursos = cache_recursos.get(cache_key)
        
        if recursos is None:
            logger.debug('Cache miss para recursos activos, consultando BD')
            recursos = list(Recurso.objects.filter(activo=True).select_related())
            cache_recursos.set(cache_key, recursos, CacheConfig.RECURSOS_TIMEOUT)
            logger.info(f'Recursos activos cacheados: {len(recursos)} recursos')
        else:
            logger.debug(f'Cache hit para recursos activos: {len(recursos)} recursos')
        
        return recursos
    
    @staticmethod
    def invalidar_cache_recursos():
        """
        Invalidar cache de recursos
        """
        from django.core.cache import caches
        
        try:
            cache_recursos = caches['recursos']
            cache_recursos.delete(CacheConfig.CACHE_KEY_RECURSOS)
        except Exception:
            cache.delete(CacheConfig.CACHE_KEY_RECURSOS)
        
        logger.info('Cache de recursos invalidado')
    
    @staticmethod
    def get_reservas_cache_key(fecha_inicio, fecha_fin, sala_id=None):
        """
        Generar clave de cache para reservas
        """
        key_parts = ['reservas', str(fecha_inicio.date()), str(fecha_fin.date())]
        if sala_id:
            key_parts.append(f'sala_{sala_id}')
        return '_'.join(key_parts)
    
    @staticmethod
    def get_reservas_cached(fecha_inicio, fecha_fin, sala_id=None):
        """
        Obtener reservas con cache
        """
        cache_key = CacheService.get_reservas_cache_key(fecha_inicio, fecha_fin, sala_id)
        reservas = cache.get(cache_key)
        
        if reservas is None:
            logger.debug(f'Cache miss para reservas: {cache_key}')
            # La consulta se hace en la vista
            return None
        else:
            logger.debug(f'Cache hit para reservas: {cache_key}')
            return reservas
    
    @staticmethod
    def set_reservas_cache(reservas, fecha_inicio, fecha_fin, sala_id=None, timeout=300):
        """
        Guardar reservas en cache
        """
        cache_key = CacheService.get_reservas_cache_key(fecha_inicio, fecha_fin, sala_id)
        cache.set(cache_key, reservas, timeout)
        logger.debug(f'Reservas cacheadas: {cache_key} ({len(reservas)} eventos)')


class DateTimeService:
    """
    Servicio para manejo de fechas y zonas horarias
    """
    
    @staticmethod
    def parse_datetime_from_form(fecha_str: str, hora_str: str) -> datetime:
        """
        Parsear fecha y hora desde formulario a datetime aware
        """
        try:
            import pytz
            
            # Crear datetime naive
            fecha_inicio_naive = datetime.strptime(f"{fecha_str} {hora_str}", "%Y-%m-%d %H:%M")
            
            # Localizar en zona horaria configurada
            timezone_tz = pytz.timezone(TimezoneConfig.DEFAULT_TIMEZONE)
            fecha_inicio = timezone_tz.localize(fecha_inicio_naive)
            
            logger.debug(f'Fecha parseada: {fecha_inicio} (UTC: {fecha_inicio.astimezone(pytz.UTC)})')
            
            return fecha_inicio
            
        except ValueError as e:
            logger.error(f'Error parseando fecha: {str(e)}')
            raise ValidationError(f'Error en el formato de fecha: {str(e)}')


def setup_logging():
    """
    Configurar logging para la aplicación
    """
    logging.basicConfig(
        level=logging.INFO,
        format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
        handlers=[
            logging.StreamHandler(),
        ]
    )
    
    # Configurar logger específico para calendario
    logger = logging.getLogger('calendario')
    logger.setLevel(logging.INFO)
    
    return logger
