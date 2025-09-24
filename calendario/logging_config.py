"""
Configuración avanzada de logging para el sistema de calendario
Proporciona logging estructurado y contextual
"""

import logging
import json
import traceback
from datetime import datetime
from typing import Dict, Any, Optional
from django.conf import settings
from django.http import HttpRequest


class StructuredFormatter(logging.Formatter):
    """
    Formatter que produce logs estructurados en formato JSON
    """
    
    def format(self, record):
        log_entry = {
            'timestamp': datetime.fromtimestamp(record.created).isoformat(),
            'level': record.levelname,
            'logger': record.name,
            'message': record.getMessage(),
            'module': record.module,
            'function': record.funcName,
            'line': record.lineno,
        }
        
        # Agregar información adicional si está disponible
        if hasattr(record, 'user_id'):
            log_entry['user_id'] = record.user_id
        if hasattr(record, 'request_id'):
            log_entry['request_id'] = record.request_id
        if hasattr(record, 'duration'):
            log_entry['duration'] = record.duration
        if hasattr(record, 'extra_data'):
            log_entry['extra_data'] = record.extra_data
        
        # Agregar excepción si existe
        if record.exc_info:
            log_entry['exception'] = {
                'type': record.exc_info[0].__name__,
                'message': str(record.exc_info[1]),
                'traceback': traceback.format_exception(*record.exc_info)
            }
        
        return json.dumps(log_entry, ensure_ascii=False, indent=2)


class CalendarioLogger:
    """
    Logger especializado para el sistema de calendario
    """
    
    def __init__(self, name: str = 'calendario'):
        self.logger = logging.getLogger(name)
        self._setup_logger()
    
    def _setup_logger(self):
        """Configurar el logger con handlers y formatters"""
        if not self.logger.handlers:
            # Handler para consola
            console_handler = logging.StreamHandler()
            console_handler.setLevel(logging.INFO)
            console_formatter = logging.Formatter(
                '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
            )
            console_handler.setFormatter(console_formatter)
            self.logger.addHandler(console_handler)
            
            # Handler para archivo (si está configurado)
            if hasattr(settings, 'LOGGING') and 'handlers' in settings.LOGGING:
                file_handler = logging.FileHandler('logs/calendario.log')
                file_handler.setLevel(logging.DEBUG)
                file_formatter = StructuredFormatter()
                file_handler.setFormatter(file_formatter)
                self.logger.addHandler(file_handler)
    
    def _add_context(self, extra_data: Optional[Dict[str, Any]] = None, 
                    request: Optional[HttpRequest] = None) -> Dict[str, Any]:
        """Agregar contexto a los logs"""
        context = {}
        
        if request:
            context.update({
                'user_id': getattr(request.user, 'id', None) if hasattr(request, 'user') else None,
                'username': getattr(request.user, 'username', 'Anonymous') if hasattr(request, 'user') else 'Anonymous',
                'ip_address': self._get_client_ip(request),
                'user_agent': request.META.get('HTTP_USER_AGENT', ''),
                'request_method': request.method,
                'request_path': request.path,
                'request_id': getattr(request, 'id', None),
            })
        
        if extra_data:
            context['extra_data'] = extra_data
        
        return context
    
    def _get_client_ip(self, request: HttpRequest) -> str:
        """Obtener IP del cliente"""
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip = x_forwarded_for.split(',')[0]
        else:
            ip = request.META.get('REMOTE_ADDR')
        return ip
    
    def info(self, message: str, extra_data: Optional[Dict[str, Any]] = None, 
             request: Optional[HttpRequest] = None):
        """Log de información"""
        context = self._add_context(extra_data, request)
        self.logger.info(message, extra=context)
    
    def warning(self, message: str, extra_data: Optional[Dict[str, Any]] = None, 
                request: Optional[HttpRequest] = None):
        """Log de advertencia"""
        context = self._add_context(extra_data, request)
        self.logger.warning(message, extra=context)
    
    def error(self, message: str, extra_data: Optional[Dict[str, Any]] = None, 
              request: Optional[HttpRequest] = None, exc_info: bool = True):
        """Log de error"""
        context = self._add_context(extra_data, request)
        self.logger.error(message, extra=context, exc_info=exc_info)
    
    def debug(self, message: str, extra_data: Optional[Dict[str, Any]] = None, 
              request: Optional[HttpRequest] = None):
        """Log de debug"""
        context = self._add_context(extra_data, request)
        self.logger.debug(message, extra=context)
    
    def critical(self, message: str, extra_data: Optional[Dict[str, Any]] = None, 
                 request: Optional[HttpRequest] = None):
        """Log crítico"""
        context = self._add_context(extra_data, request)
        self.logger.critical(message, extra=context)


class PerformanceLogger:
    """
    Logger especializado para métricas de performance
    """
    
    def __init__(self):
        self.logger = CalendarioLogger('calendario.performance')
    
    def log_view_performance(self, view_name: str, duration: float, 
                           request: Optional[HttpRequest] = None,
                           extra_metrics: Optional[Dict[str, Any]] = None):
        """Log de performance de vistas"""
        extra_data = {
            'view_name': view_name,
            'duration': duration,
            'performance_category': 'view_execution'
        }
        
        if extra_metrics:
            extra_data.update(extra_metrics)
        
        if duration > 2.0:
            self.logger.warning(
                f'Vista {view_name} tardó {duration:.3f} segundos (lenta)',
                extra_data=extra_data,
                request=request
            )
        else:
            self.logger.info(
                f'Vista {view_name} ejecutada en {duration:.3f} segundos',
                extra_data=extra_data,
                request=request
            )
    
    def log_query_performance(self, query_type: str, duration: float, 
                            query_count: int, request: Optional[HttpRequest] = None):
        """Log de performance de consultas"""
        extra_data = {
            'query_type': query_type,
            'duration': duration,
            'query_count': query_count,
            'performance_category': 'database_query'
        }
        
        if duration > 1.0 or query_count > 10:
            self.logger.warning(
                f'Consulta {query_type} tardó {duration:.3f}s con {query_count} queries',
                extra_data=extra_data,
                request=request
            )
        else:
            self.logger.debug(
                f'Consulta {query_type} ejecutada en {duration:.3f}s con {query_count} queries',
                extra_data=extra_data,
                request=request
            )


class SecurityLogger:
    """
    Logger especializado para eventos de seguridad
    """
    
    def __init__(self):
        self.logger = CalendarioLogger('calendario.security')
    
    def log_rate_limit_exceeded(self, user_id: Optional[int], ip_address: str, 
                              endpoint: str, limit: int, request: Optional[HttpRequest] = None):
        """Log de rate limiting excedido"""
        extra_data = {
            'security_event': 'rate_limit_exceeded',
            'user_id': user_id,
            'ip_address': ip_address,
            'endpoint': endpoint,
            'limit': limit
        }
        
        self.logger.warning(
            f'Rate limit excedido: {limit} requests por minuto en {endpoint}',
            extra_data=extra_data,
            request=request
        )
    
    def log_unauthorized_access(self, user_id: Optional[int], resource: str, 
                              action: str, request: Optional[HttpRequest] = None):
        """Log de acceso no autorizado"""
        extra_data = {
            'security_event': 'unauthorized_access',
            'user_id': user_id,
            'resource': resource,
            'action': action
        }
        
        self.logger.warning(
            f'Acceso no autorizado: {action} en {resource}',
            extra_data=extra_data,
            request=request
        )
    
    def log_suspicious_activity(self, activity_type: str, details: str, 
                              request: Optional[HttpRequest] = None):
        """Log de actividad sospechosa"""
        extra_data = {
            'security_event': 'suspicious_activity',
            'activity_type': activity_type,
            'details': details
        }
        
        self.logger.warning(
            f'Actividad sospechosa detectada: {activity_type} - {details}',
            extra_data=extra_data,
            request=request
        )


class BusinessLogger:
    """
    Logger especializado para eventos de negocio
    """
    
    def __init__(self):
        self.logger = CalendarioLogger('calendario.business')
    
    def log_reserva_created(self, reserva_id: int, user_id: int, recurso_id: int, 
                          fecha_inicio: datetime, request: Optional[HttpRequest] = None):
        """Log de reserva creada"""
        extra_data = {
            'business_event': 'reserva_created',
            'reserva_id': reserva_id,
            'user_id': user_id,
            'recurso_id': recurso_id,
            'fecha_inicio': fecha_inicio.isoformat()
        }
        
        self.logger.info(
            f'Reserva creada: ID {reserva_id} por usuario {user_id}',
            extra_data=extra_data,
            request=request
        )
    
    def log_reserva_updated(self, reserva_id: int, user_id: int, 
                          changes: Dict[str, Any], request: Optional[HttpRequest] = None):
        """Log de reserva actualizada"""
        extra_data = {
            'business_event': 'reserva_updated',
            'reserva_id': reserva_id,
            'user_id': user_id,
            'changes': changes
        }
        
        self.logger.info(
            f'Reserva actualizada: ID {reserva_id} por usuario {user_id}',
            extra_data=extra_data,
            request=request
        )
    
    def log_reserva_deleted(self, reserva_id: int, user_id: int, 
                          request: Optional[HttpRequest] = None):
        """Log de reserva eliminada"""
        extra_data = {
            'business_event': 'reserva_deleted',
            'reserva_id': reserva_id,
            'user_id': user_id
        }
        
        self.logger.info(
            f'Reserva eliminada: ID {reserva_id} por usuario {user_id}',
            extra_data=extra_data,
            request=request
        )
    
    def log_conflict_detected(self, reserva_id: int, conflicto_id: int, 
                            recurso_id: int, request: Optional[HttpRequest] = None):
        """Log de conflicto detectado"""
        extra_data = {
            'business_event': 'conflict_detected',
            'reserva_id': reserva_id,
            'conflicto_id': conflicto_id,
            'recurso_id': recurso_id
        }
        
        self.logger.warning(
            f'Conflicto detectado: Reserva {reserva_id} vs {conflicto_id} en recurso {recurso_id}',
            extra_data=extra_data,
            request=request
        )


# Instancias globales de loggers (inicializadas bajo demanda)
_calendario_logger = None
_performance_logger = None
_security_logger = None
_business_logger = None


def get_calendario_logger():
    """Obtener instancia del logger de calendario"""
    global _calendario_logger
    if _calendario_logger is None:
        _calendario_logger = CalendarioLogger()
    return _calendario_logger


def get_performance_logger():
    """Obtener instancia del logger de performance"""
    global _performance_logger
    if _performance_logger is None:
        _performance_logger = PerformanceLogger()
    return _performance_logger


def get_security_logger():
    """Obtener instancia del logger de seguridad"""
    global _security_logger
    if _security_logger is None:
        _security_logger = SecurityLogger()
    return _security_logger


def get_business_logger():
    """Obtener instancia del logger de negocio"""
    global _business_logger
    if _business_logger is None:
        _business_logger = BusinessLogger()
    return _business_logger


# Alias para compatibilidad
calendario_logger = get_calendario_logger
performance_logger = get_performance_logger
security_logger = get_security_logger
business_logger = get_business_logger
