"""
Sistema de monitoreo y métricas para el sistema de calendario
"""

import time
import logging
from datetime import datetime, timedelta
from typing import Dict, Any, Optional, List
from django.core.cache import cache
from django.db import connection
from django.conf import settings

from .logging_config import performance_logger, calendario_logger
from .constants import CacheConfig


class SystemMetrics:
    """
    Recolector de métricas del sistema
    """
    
    def __init__(self):
        self.logger = calendario_logger
    
    def get_database_metrics(self) -> Dict[str, Any]:
        """Obtener métricas de la base de datos"""
        with connection.cursor() as cursor:
            # Número de conexiones activas
            cursor.execute("SELECT count(*) FROM pg_stat_activity WHERE state = 'active'")
            active_connections = cursor.fetchone()[0]
            
            # Tamaño de la base de datos
            cursor.execute("SELECT pg_size_pretty(pg_database_size(current_database()))")
            db_size = cursor.fetchone()[0]
            
            # Número de tablas
            cursor.execute("""
                SELECT count(*) FROM information_schema.tables 
                WHERE table_schema = 'public'
            """)
            table_count = cursor.fetchone()[0]
        
        return {
            'active_connections': active_connections,
            'database_size': db_size,
            'table_count': table_count,
            'timestamp': datetime.now().isoformat()
        }
    
    def get_cache_metrics(self) -> Dict[str, Any]:
        """Obtener métricas del cache"""
        try:
            # Intentar obtener estadísticas del cache
            cache_stats = cache._cache.get_stats() if hasattr(cache._cache, 'get_stats') else {}
        except Exception:
            cache_stats = {}
        
        return {
            'cache_stats': cache_stats,
            'cache_backend': settings.CACHES['default']['BACKEND'],
            'timestamp': datetime.now().isoformat()
        }
    
    def get_application_metrics(self) -> Dict[str, Any]:
        """Obtener métricas de la aplicación"""
        from .models import Reserva, Recurso
        from django.contrib.auth.models import User
        
        return {
            'total_reservas': Reserva.objects.count(),
            'reservas_confirmadas': Reserva.objects.filter(estado='confirmada').count(),
            'recursos_activos': Recurso.objects.filter(activo=True).count(),
            'usuarios_activos': User.objects.filter(is_active=True).count(),
            'reservas_hoy': Reserva.objects.filter(
                fecha_inicio__date=datetime.now().date()
            ).count(),
            'timestamp': datetime.now().isoformat()
        }
    
    def get_performance_metrics(self) -> Dict[str, Any]:
        """Obtener métricas de performance"""
        # Obtener métricas de las últimas 24 horas desde cache
        cache_key = 'performance_metrics_24h'
        metrics = cache.get(cache_key, {})
        
        return {
            'avg_response_time': metrics.get('avg_response_time', 0),
            'slow_queries_count': metrics.get('slow_queries_count', 0),
            'error_rate': metrics.get('error_rate', 0),
            'requests_per_minute': metrics.get('requests_per_minute', 0),
            'timestamp': datetime.now().isoformat()
        }
    
    def get_all_metrics(self) -> Dict[str, Any]:
        """Obtener todas las métricas del sistema"""
        try:
            return {
                'database': self.get_database_metrics(),
                'cache': self.get_cache_metrics(),
                'application': self.get_application_metrics(),
                'performance': self.get_performance_metrics(),
                'system_info': {
                    'django_version': settings.DJANGO_VERSION if hasattr(settings, 'DJANGO_VERSION') else 'Unknown',
                    'python_version': f"{settings.PYTHON_VERSION}" if hasattr(settings, 'PYTHON_VERSION') else 'Unknown',
                    'debug_mode': settings.DEBUG,
                    'timestamp': datetime.now().isoformat()
                }
            }
        except Exception as e:
            self.logger.error(f'Error obteniendo métricas del sistema: {str(e)}')
            return {'error': str(e)}


class HealthChecker:
    """
    Verificador de salud del sistema
    """
    
    def __init__(self):
        self.logger = calendario_logger
    
    def check_database_health(self) -> Dict[str, Any]:
        """Verificar salud de la base de datos"""
        try:
            from django.db import connection
            with connection.cursor() as cursor:
                cursor.execute("SELECT 1")
                result = cursor.fetchone()
            
            return {
                'status': 'healthy',
                'response_time': 0,  # Se puede medir si es necesario
                'message': 'Database connection successful'
            }
        except Exception as e:
            return {
                'status': 'unhealthy',
                'error': str(e),
                'message': 'Database connection failed'
            }
    
    def check_cache_health(self) -> Dict[str, Any]:
        """Verificar salud del cache"""
        try:
            test_key = 'health_check_test'
            test_value = 'test_value'
            
            # Test write
            cache.set(test_key, test_value, 10)
            
            # Test read
            retrieved_value = cache.get(test_key)
            
            if retrieved_value == test_value:
                cache.delete(test_key)
                return {
                    'status': 'healthy',
                    'message': 'Cache read/write successful'
                }
            else:
                return {
                    'status': 'unhealthy',
                    'message': 'Cache read/write failed'
                }
        except Exception as e:
            return {
                'status': 'unhealthy',
                'error': str(e),
                'message': 'Cache operation failed'
            }
    
    def check_disk_space(self) -> Dict[str, Any]:
        """Verificar espacio en disco"""
        try:
            import shutil
            total, used, free = shutil.disk_usage('/')
            
            free_percentage = (free / total) * 100
            
            if free_percentage < 10:
                status = 'critical'
            elif free_percentage < 20:
                status = 'warning'
            else:
                status = 'healthy'
            
            return {
                'status': status,
                'total_gb': round(total / (1024**3), 2),
                'used_gb': round(used / (1024**3), 2),
                'free_gb': round(free / (1024**3), 2),
                'free_percentage': round(free_percentage, 2),
                'message': f'Free space: {free_percentage:.1f}%'
            }
        except Exception as e:
            return {
                'status': 'unknown',
                'error': str(e),
                'message': 'Could not check disk space'
            }
    
    def get_overall_health(self) -> Dict[str, Any]:
        """Obtener estado general de salud del sistema"""
        checks = {
            'database': self.check_database_health(),
            'cache': self.check_cache_health(),
            'disk_space': self.check_disk_space()
        }
        
        # Determinar estado general
        statuses = [check['status'] for check in checks.values()]
        
        if 'unhealthy' in statuses or 'critical' in statuses:
            overall_status = 'unhealthy'
        elif 'warning' in statuses:
            overall_status = 'warning'
        else:
            overall_status = 'healthy'
        
        return {
            'overall_status': overall_status,
            'checks': checks,
            'timestamp': datetime.now().isoformat()
        }


class PerformanceMonitor:
    """
    Monitor de performance en tiempo real
    """
    
    def __init__(self):
        self.logger = performance_logger
        self.metrics_cache = {}
    
    def record_view_performance(self, view_name: str, duration: float, 
                              request=None, extra_metrics: Optional[Dict[str, Any]] = None):
        """Registrar performance de una vista"""
        self.logger.log_view_performance(view_name, duration, request, extra_metrics)
        
        # Actualizar métricas en cache
        cache_key = f'view_performance_{view_name}'
        metrics = cache.get(cache_key, {'count': 0, 'total_time': 0, 'max_time': 0})
        
        metrics['count'] += 1
        metrics['total_time'] += duration
        metrics['max_time'] = max(metrics['max_time'], duration)
        metrics['avg_time'] = metrics['total_time'] / metrics['count']
        metrics['last_updated'] = datetime.now().isoformat()
        
        cache.set(cache_key, metrics, 3600)  # 1 hora
    
    def record_query_performance(self, query_type: str, duration: float, 
                               query_count: int, request=None):
        """Registrar performance de consultas"""
        self.logger.log_query_performance(query_type, duration, query_count, request)
        
        # Actualizar métricas en cache
        cache_key = f'query_performance_{query_type}'
        metrics = cache.get(cache_key, {'count': 0, 'total_time': 0, 'total_queries': 0})
        
        metrics['count'] += 1
        metrics['total_time'] += duration
        metrics['total_queries'] += query_count
        metrics['avg_time'] = metrics['total_time'] / metrics['count']
        metrics['avg_queries'] = metrics['total_queries'] / metrics['count']
        metrics['last_updated'] = datetime.now().isoformat()
        
        cache.set(cache_key, metrics, 3600)  # 1 hora
    
    def get_performance_summary(self) -> Dict[str, Any]:
        """Obtener resumen de performance"""
        summary = {
            'views': {},
            'queries': {},
            'timestamp': datetime.now().isoformat()
        }
        
        # Obtener métricas de vistas
        for key in cache.keys('view_performance_*'):
            view_name = key.replace('view_performance_', '')
            metrics = cache.get(key, {})
            summary['views'][view_name] = metrics
        
        # Obtener métricas de consultas
        for key in cache.keys('query_performance_*'):
            query_type = key.replace('query_performance_', '')
            metrics = cache.get(key, {})
            summary['queries'][query_type] = metrics
        
        return summary


class AlertManager:
    """
    Gestor de alertas del sistema
    """
    
    def __init__(self):
        self.logger = calendario_logger
        self.alert_thresholds = {
            'response_time': 2.0,  # segundos
            'error_rate': 0.05,    # 5%
            'disk_space': 10,      # 10%
            'memory_usage': 90,    # 90%
        }
    
    def check_alerts(self, metrics: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Verificar si hay alertas que disparar"""
        alerts = []
        
        # Verificar performance de vistas
        if 'views' in metrics:
            for view_name, view_metrics in metrics['views'].items():
                if view_metrics.get('avg_time', 0) > self.alert_thresholds['response_time']:
                    alerts.append({
                        'type': 'performance',
                        'severity': 'warning',
                        'message': f'Vista {view_name} tiene tiempo de respuesta alto: {view_metrics["avg_time"]:.2f}s',
                        'view_name': view_name,
                        'avg_time': view_metrics['avg_time']
                    })
        
        # Verificar espacio en disco
        if 'disk_space' in metrics:
            disk_metrics = metrics['disk_space']
            if disk_metrics.get('free_percentage', 100) < self.alert_thresholds['disk_space']:
                alerts.append({
                    'type': 'disk_space',
                    'severity': 'critical',
                    'message': f'Espacio en disco bajo: {disk_metrics["free_percentage"]:.1f}%',
                    'free_percentage': disk_metrics['free_percentage']
                })
        
        return alerts
    
    def send_alert(self, alert: Dict[str, Any]):
        """Enviar alerta"""
        self.logger.warning(
            f'ALERTA: {alert["message"]}',
            extra_data={
                'alert_type': alert['type'],
                'severity': alert['severity'],
                'alert_data': alert
            }
        )
        
        # Aquí se podría integrar con sistemas de notificación externos
        # como Slack, email, etc.


# Instancias globales
system_metrics = SystemMetrics()
health_checker = HealthChecker()
performance_monitor = PerformanceMonitor()
alert_manager = AlertManager()
