"""
Sistema mejorado de respuestas HTTP con headers informativos
Centraliza el manejo de errores y respuestas con códigos consistentes
"""

import uuid
from datetime import datetime, timezone
from django.http import JsonResponse
from django.utils import timezone as django_timezone
from typing import Dict, Any, Optional

from .constants import ValidationMessages, ErrorMessages


class HTTPResponseBuilder:
    """
    Constructor de respuestas HTTP estandarizado
    Incluye headers informativos y códigos de error consistentes
    """
    
    @staticmethod
    def _create_base_response(data: Dict[str, Any], status_code: int, 
                            request=None, extra_headers: Optional[Dict[str, str]] = None) -> JsonResponse:
        """
        Crear respuesta base con headers informativos
        
        Args:
            data: Datos de la respuesta
            status_code: Código de estado HTTP
            request: Objeto request para contexto
            extra_headers: Headers adicionales
        """
        # Agregar metadatos estándar
        data.update({
            'timestamp': django_timezone.now().isoformat(),
            'request_id': str(uuid.uuid4())[:8]
        })
        
        # Crear respuesta
        response = JsonResponse(data, status=status_code)
        
        # Headers informativos estándar
        headers = {
            'Content-Language': 'es-ES',
            'X-Request-ID': data['request_id'],
            'X-API-Version': 'v1',
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0'
        }
        
        # Agregar headers específicos según el código de estado
        if status_code == 429:  # Rate Limited
            headers.update({
                'Retry-After': '60',
                'X-RateLimit-Limit': '10',
                'X-RateLimit-Remaining': '0',
                'X-RateLimit-Reset': str(int(datetime.now().timestamp()) + 60)
            })
        
        elif status_code == 503:  # Service Unavailable
            headers['Retry-After'] = '30'
        
        elif status_code == 422:  # Unprocessable Entity
            headers['X-Validation-Errors'] = 'true'
        
        # Agregar headers adicionales si se proporcionan
        if extra_headers:
            headers.update(extra_headers)
        
        # Aplicar headers a la respuesta
        for key, value in headers.items():
            response[key] = value
        
        return response
    
    @staticmethod
    def success(data: Dict[str, Any] = None, message: str = None, 
                request=None) -> JsonResponse:
        """Respuesta de éxito (200)"""
        response_data = {
            'success': True,
            'message': message or 'Operación exitosa'
        }
        if data:
            response_data.update(data)
        
        return HTTPResponseBuilder._create_base_response(response_data, 200, request)
    
    @staticmethod
    def bad_request(message: str, error_code: str = None, 
                   details: Dict[str, Any] = None, request=None) -> JsonResponse:
        """Respuesta de solicitud incorrecta (400)"""
        response_data = {
            'success': False,
            'error': message,
            'error_type': 'bad_request',
            'error_code': error_code or 'BAD_REQUEST'
        }
        if details:
            response_data['details'] = details
        
        return HTTPResponseBuilder._create_base_response(response_data, 400, request)
    
    @staticmethod
    def unauthorized(message: str = None, request=None) -> JsonResponse:
        """Respuesta de no autorizado (401)"""
        response_data = {
            'success': False,
            'error': message or 'No autorizado',
            'error_type': 'unauthorized',
            'error_code': 'UNAUTHORIZED'
        }
        return HTTPResponseBuilder._create_base_response(response_data, 401, request)
    
    @staticmethod
    def forbidden(message: str = None, request=None) -> JsonResponse:
        """Respuesta de prohibido (403)"""
        response_data = {
            'success': False,
            'error': message or 'Acceso denegado',
            'error_type': 'forbidden',
            'error_code': 'FORBIDDEN'
        }
        return HTTPResponseBuilder._create_base_response(response_data, 403, request)
    
    @staticmethod
    def not_found(message: str, resource_type: str = None, 
                  resource_id: str = None, request=None) -> JsonResponse:
        """Respuesta de recurso no encontrado (404)"""
        response_data = {
            'success': False,
            'error': message,
            'error_type': 'not_found',
            'error_code': 'RESOURCE_NOT_FOUND'
        }
        if resource_type:
            response_data['resource_type'] = resource_type
        if resource_id:
            response_data['resource_id'] = resource_id
        
        return HTTPResponseBuilder._create_base_response(response_data, 404, request)
    
    @staticmethod
    def method_not_allowed(allowed_methods: list = None, request=None) -> JsonResponse:
        """Respuesta de método no permitido (405)"""
        response_data = {
            'success': False,
            'error': 'Método no permitido',
            'error_type': 'method_not_allowed',
            'error_code': 'METHOD_NOT_ALLOWED'
        }
        if allowed_methods:
            response_data['allowed_methods'] = allowed_methods
        
        return HTTPResponseBuilder._create_base_response(response_data, 405, request)
    
    @staticmethod
    def conflict(message: str, conflict_details: Dict[str, Any] = None, 
                request=None) -> JsonResponse:
        """Respuesta de conflicto (409)"""
        response_data = {
            'success': False,
            'error': message,
            'error_type': 'conflict',
            'error_code': 'RESOURCE_CONFLICT'
        }
        if conflict_details:
            response_data['conflict_details'] = conflict_details
        
        return HTTPResponseBuilder._create_base_response(response_data, 409, request)
    
    @staticmethod
    def unprocessable_entity(message: str, validation_errors: Dict[str, Any] = None, 
                           request=None) -> JsonResponse:
        """Respuesta de entidad no procesable (422)"""
        response_data = {
            'success': False,
            'error': message,
            'error_type': 'validation_error',
            'error_code': 'UNPROCESSABLE_ENTITY'
        }
        if validation_errors:
            response_data['validation_errors'] = validation_errors
        
        return HTTPResponseBuilder._create_base_response(response_data, 422, request)
    
    @staticmethod
    def rate_limited(retry_after: int = 60, limit: int = 10, 
                    remaining: int = 0, request=None) -> JsonResponse:
        """Respuesta de límite de velocidad excedido (429)"""
        response_data = {
            'success': False,
            'error': 'Límite de solicitudes excedido',
            'error_type': 'rate_limited',
            'error_code': 'RATE_LIMIT_EXCEEDED',
            'retry_after': retry_after
        }
        
        extra_headers = {
            'Retry-After': str(retry_after),
            'X-RateLimit-Limit': str(limit),
            'X-RateLimit-Remaining': str(remaining),
            'X-RateLimit-Reset': str(int(datetime.now().timestamp()) + retry_after)
        }
        
        return HTTPResponseBuilder._create_base_response(response_data, 429, request, extra_headers)
    
    @staticmethod
    def internal_server_error(message: str = None, error_id: str = None, 
                            request=None) -> JsonResponse:
        """Respuesta de error interno del servidor (500)"""
        response_data = {
            'success': False,
            'error': message or 'Error interno del servidor',
            'error_type': 'server_error',
            'error_code': 'INTERNAL_SERVER_ERROR'
        }
        if error_id:
            response_data['error_id'] = error_id
        
        return HTTPResponseBuilder._create_base_response(response_data, 500, request)
    
    @staticmethod
    def service_unavailable(message: str = None, retry_after: int = 30, 
                          request=None) -> JsonResponse:
        """Respuesta de servicio no disponible (503)"""
        response_data = {
            'success': False,
            'error': message or 'Servicio no disponible',
            'error_type': 'service_unavailable',
            'error_code': 'SERVICE_UNAVAILABLE'
        }
        
        extra_headers = {'Retry-After': str(retry_after)}
        return HTTPResponseBuilder._create_base_response(response_data, 503, request, extra_headers)


class ErrorCodes:
    """
    Códigos de error estandarizados para toda la aplicación
    """
    # Validación de entrada
    INVALID_DATE_FORMAT = 'INVALID_DATE_FORMAT'
    MISSING_REQUIRED_FIELD = 'MISSING_REQUIRED_FIELD'
    DATE_RANGE_INVALID = 'DATE_RANGE_INVALID'
    INVALID_FORMAT = 'INVALID_FORMAT'
    
    # Recursos
    RESOURCE_NOT_FOUND = 'RESOURCE_NOT_FOUND'
    RESOURCE_INACTIVE = 'RESOURCE_INACTIVE'
    RESOURCE_UNAVAILABLE = 'RESOURCE_UNAVAILABLE'
    
    # Conflictos de negocio
    RESERVA_CONFLICT = 'RESERVA_CONFLICT'
    HORARIO_RESTRICTION = 'HORARIO_RESTRICTION'
    WORKING_HOURS_VIOLATION = 'WORKING_HOURS_VIOLATION'
    
    # Permisos y autenticación
    INSUFFICIENT_PERMISSIONS = 'INSUFFICIENT_PERMISSIONS'
    UNAUTHORIZED = 'UNAUTHORIZED'
    RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED'
    
    # Errores del servidor
    INTERNAL_SERVER_ERROR = 'INTERNAL_SERVER_ERROR'
    SERVICE_UNAVAILABLE = 'SERVICE_UNAVAILABLE'
    EXPORT_ERROR = 'EXPORT_ERROR'


# Alias para compatibilidad y facilidad de uso
HTTP = HTTPResponseBuilder
ERROR_CODES = ErrorCodes
