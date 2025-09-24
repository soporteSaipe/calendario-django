"""
Estrategia avanzada de cache para el sistema de calendario
Implementa cache inteligente con invalidación automática
"""

import logging
import hashlib
import json
from datetime import datetime, timedelta
from typing import Any, Optional, Dict, List, Callable
from django.core.cache import cache
from django.core.cache.utils import make_template_fragment_key
from django.db.models import Model
from django.conf import settings

from .constants import CacheConfig
from .logging_config import calendario_logger

logger = calendario_logger


class CacheKeyGenerator:
    """
    Generador de claves de cache consistentes
    """
    
    @staticmethod
    def generate_key(prefix: str, *args, **kwargs) -> str:
        """
        Generar clave de cache consistente
        
        Args:
            prefix: Prefijo de la clave
            *args: Argumentos posicionales
            **kwargs: Argumentos con nombre
            
        Returns:
            Clave de cache generada
        """
        # Crear hash de los argumentos
        args_str = '_'.join(str(arg) for arg in args)
        kwargs_str = '_'.join(f"{k}_{v}" for k, v in sorted(kwargs.items()))
        
        # Combinar todo
        key_parts = [prefix, args_str, kwargs_str]
        key_string = '_'.join(filter(None, key_parts))
        
        # Crear hash para claves largas
        if len(key_string) > 200:
            key_hash = hashlib.md5(key_string.encode()).hexdigest()
            key_string = f"{prefix}_{key_hash}"
        
        return key_string
    
    @staticmethod
    def generate_model_key(model_class: type, instance_id: Optional[int] = None, 
                          fields: Optional[List[str]] = None) -> str:
        """
        Generar clave para modelos Django
        
        Args:
            model_class: Clase del modelo
            instance_id: ID de la instancia (opcional)
            fields: Campos específicos (opcional)
            
        Returns:
            Clave de cache para el modelo
        """
        model_name = model_class.__name__.lower()
        
        if instance_id:
            key = f"model_{model_name}_{instance_id}"
        else:
            key = f"model_{model_name}_list"
        
        if fields:
            fields_str = '_'.join(sorted(fields))
            key = f"{key}_fields_{fields_str}"
        
        return key
    
    @staticmethod
    def generate_query_key(model_class: type, filters: Dict[str, Any], 
                          order_by: Optional[str] = None) -> str:
        """
        Generar clave para consultas específicas
        
        Args:
            model_class: Clase del modelo
            filters: Filtros aplicados
            order_by: Ordenamiento (opcional)
            
        Returns:
            Clave de cache para la consulta
        """
        model_name = model_class.__name__.lower()
        
        # Crear hash de los filtros
        filters_str = json.dumps(filters, sort_keys=True)
        filters_hash = hashlib.md5(filters_str.encode()).hexdigest()[:8]
        
        key = f"query_{model_name}_{filters_hash}"
        
        if order_by:
            order_hash = hashlib.md5(order_by.encode()).hexdigest()[:8]
            key = f"{key}_order_{order_hash}"
        
        return key


class CacheManager:
    """
    Gestor de cache con invalidación inteligente
    """
    
    def __init__(self):
        self.logger = calendario_logger
        self.key_generator = CacheKeyGenerator()
        self.cache_tags = {}  # Mapeo de claves a tags
    
    def get(self, key: str, default: Any = None) -> Any:
        """
        Obtener valor del cache
        
        Args:
            key: Clave de cache
            default: Valor por defecto
            
        Returns:
            Valor del cache o default
        """
        try:
            value = cache.get(key)
            if value is not None:
                self.logger.debug(f'Cache hit: {key}')
                return value
            else:
                self.logger.debug(f'Cache miss: {key}')
                return default
        except Exception as e:
            self.logger.error(f'Error obteniendo del cache {key}: {str(e)}')
            return default
    
    def set(self, key: str, value: Any, timeout: int = None, 
            tags: Optional[List[str]] = None) -> bool:
        """
        Establecer valor en el cache
        
        Args:
            key: Clave de cache
            value: Valor a cachear
            timeout: Tiempo de expiración en segundos
            tags: Tags para invalidación selectiva
            
        Returns:
            True si se guardó correctamente
        """
        try:
            if timeout is None:
                timeout = CacheConfig.RECURSOS_TIMEOUT
            
            cache.set(key, value, timeout)
            
            # Registrar tags si se proporcionan
            if tags:
                self.cache_tags[key] = tags
                # Guardar mapeo de tags
                for tag in tags:
                    tag_key = f"tag_{tag}"
                    tagged_keys = cache.get(tag_key, [])
                    if key not in tagged_keys:
                        tagged_keys.append(key)
                        cache.set(tag_key, tagged_keys, timeout)
            
            self.logger.debug(f'Cache set: {key} (timeout: {timeout}s)')
            return True
            
        except Exception as e:
            self.logger.error(f'Error guardando en cache {key}: {str(e)}')
            return False
    
    def delete(self, key: str) -> bool:
        """
        Eliminar clave del cache
        
        Args:
            key: Clave a eliminar
            
        Returns:
            True si se eliminó correctamente
        """
        try:
            cache.delete(key)
            self.logger.debug(f'Cache delete: {key}')
            return True
        except Exception as e:
            self.logger.error(f'Error eliminando del cache {key}: {str(e)}')
            return False
    
    def invalidate_by_tag(self, tag: str) -> int:
        """
        Invalidar todas las claves con un tag específico
        
        Args:
            tag: Tag a invalidar
            
        Returns:
            Número de claves invalidadas
        """
        try:
            tag_key = f"tag_{tag}"
            tagged_keys = cache.get(tag_key, [])
            
            deleted_count = 0
            for key in tagged_keys:
                if cache.delete(key):
                    deleted_count += 1
            
            # Limpiar el tag
            cache.delete(tag_key)
            
            self.logger.info(f'Invalidado tag {tag}: {deleted_count} claves')
            return deleted_count
            
        except Exception as e:
            self.logger.error(f'Error invalidando tag {tag}: {str(e)}')
            return 0
    
    def invalidate_pattern(self, pattern: str) -> int:
        """
        Invalidar claves que coincidan con un patrón
        
        Args:
            pattern: Patrón a buscar
            
        Returns:
            Número de claves invalidadas
        """
        try:
            # Nota: Esta implementación es básica
            # En producción se recomienda usar Redis con SCAN
            deleted_count = 0
            
            # Obtener todas las claves (esto puede ser costoso en producción)
            all_keys = cache._cache.get_client().keys('*') if hasattr(cache._cache, 'get_client') else []
            
            for key in all_keys:
                if pattern in key:
                    if cache.delete(key):
                        deleted_count += 1
            
            self.logger.info(f'Invalidado patrón {pattern}: {deleted_count} claves')
            return deleted_count
            
        except Exception as e:
            self.logger.error(f'Error invalidando patrón {pattern}: {str(e)}')
            return 0


class ModelCacheMixin:
    """
    Mixin para agregar funcionalidad de cache a los modelos
    """
    
    @classmethod
    def get_cached(cls, instance_id: int, fields: Optional[List[str]] = None) -> Optional['Model']:
        """
        Obtener instancia del modelo desde cache
        
        Args:
            instance_id: ID de la instancia
            fields: Campos específicos a obtener
            
        Returns:
            Instancia del modelo o None
        """
        cache_manager = CacheManager()
        key_generator = CacheKeyGenerator()
        
        key = key_generator.generate_model_key(cls, instance_id, fields)
        return cache_manager.get(key)
    
    def cache_instance(self, timeout: int = None, fields: Optional[List[str]] = None) -> bool:
        """
        Cachear esta instancia del modelo
        
        Args:
            timeout: Tiempo de expiración
            fields: Campos específicos a cachear
            
        Returns:
            True si se cacheó correctamente
        """
        cache_manager = CacheManager()
        key_generator = CacheKeyGenerator()
        
        key = key_generator.generate_model_key(self.__class__, self.id, fields)
        
        # Preparar datos para cachear
        if fields:
            data = {field: getattr(self, field) for field in fields if hasattr(self, field)}
        else:
            data = self
        
        return cache_manager.set(key, data, timeout, tags=[f"model_{self.__class__.__name__.lower()}"])
    
    def invalidate_cache(self):
        """
        Invalidar cache de esta instancia
        """
        cache_manager = CacheManager()
        key_generator = CacheKeyGenerator()
        
        # Invalidar instancia específica
        key = key_generator.generate_model_key(self.__class__, self.id)
        cache_manager.delete(key)
        
        # Invalidar listas que podrían contener esta instancia
        cache_manager.invalidate_by_tag(f"model_{self.__class__.__name__.lower()}")


class QueryCacheMixin:
    """
    Mixin para cachear consultas de base de datos
    """
    
    @classmethod
    def get_cached_queryset(cls, filters: Dict[str, Any], 
                           order_by: Optional[str] = None,
                           timeout: int = None) -> Optional[List['Model']]:
        """
        Obtener queryset desde cache
        
        Args:
            filters: Filtros de la consulta
            order_by: Ordenamiento
            timeout: Tiempo de expiración
            
        Returns:
            Lista de instancias o None
        """
        cache_manager = CacheManager()
        key_generator = CacheKeyGenerator()
        
        key = key_generator.generate_query_key(cls, filters, order_by)
        return cache_manager.get(key)
    
    @classmethod
    def cache_queryset(cls, queryset, filters: Dict[str, Any], 
                      order_by: Optional[str] = None,
                      timeout: int = None) -> bool:
        """
        Cachear queryset
        
        Args:
            queryset: QuerySet a cachear
            filters: Filtros aplicados
            order_by: Ordenamiento
            timeout: Tiempo de expiración
            
        Returns:
            True si se cacheó correctamente
        """
        cache_manager = CacheManager()
        key_generator = CacheKeyGenerator()
        
        key = key_generator.generate_query_key(cls, filters, order_by)
        
        # Convertir queryset a lista para cachear
        data = list(queryset)
        
        return cache_manager.set(
            key, 
            data, 
            timeout, 
            tags=[f"query_{cls.__name__.lower()}"]
        )


class CacheDecorator:
    """
    Decorador para cachear resultados de funciones
    """
    
    def __init__(self, timeout: int = None, key_prefix: str = None, 
                 tags: Optional[List[str]] = None):
        self.timeout = timeout or CacheConfig.RECURSOS_TIMEOUT
        self.key_prefix = key_prefix
        self.tags = tags or []
        self.cache_manager = CacheManager()
        self.key_generator = CacheKeyGenerator()
    
    def __call__(self, func: Callable) -> Callable:
        def wrapper(*args, **kwargs):
            # Generar clave de cache
            if self.key_prefix:
                key = self.key_generator.generate_key(self.key_prefix, *args, **kwargs)
            else:
                key = self.key_generator.generate_key(func.__name__, *args, **kwargs)
            
            # Intentar obtener del cache
            result = self.cache_manager.get(key)
            if result is not None:
                return result
            
            # Ejecutar función y cachear resultado
            result = func(*args, **kwargs)
            self.cache_manager.set(key, result, self.timeout, self.tags)
            
            return result
        
        return wrapper


# Instancias globales
cache_manager = CacheManager()
cache_key_generator = CacheKeyGenerator()

# Decorador de cache para uso fácil
def cached(timeout: int = None, key_prefix: str = None, tags: Optional[List[str]] = None):
    """
    Decorador para cachear resultados de funciones
    
    Usage:
        @cached(timeout=300, tags=['expensive_operation'])
        def expensive_function(param1, param2):
            # ... lógica costosa
            return result
    """
    return CacheDecorator(timeout, key_prefix, tags)
