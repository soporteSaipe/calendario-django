"""
Documentación de API para el sistema de calendario
Genera documentación automática de los endpoints
"""

from typing import Dict, Any, List, Optional
from datetime import datetime
import json


class APIDocumentation:
    """
    Generador de documentación de API
    """
    
    def __init__(self):
        self.endpoints = {}
        self._register_endpoints()
    
    def _register_endpoints(self):
        """Registrar todos los endpoints de la API"""
        
        # API de Reservas
        self.endpoints['/api/reservas/'] = {
            'method': 'GET',
            'description': 'Obtener reservas en formato JSON para el calendario',
            'parameters': {
                'start': {
                    'type': 'string',
                    'format': 'ISO 8601',
                    'required': False,
                    'description': 'Fecha de inicio del rango (ej: 2024-01-01T00:00:00Z)'
                },
                'end': {
                    'type': 'string',
                    'format': 'ISO 8601',
                    'required': False,
                    'description': 'Fecha de fin del rango (ej: 2024-01-31T23:59:59Z)'
                },
                'sala': {
                    'type': 'integer',
                    'required': False,
                    'description': 'ID de la sala específica (opcional)'
                }
            },
            'response': {
                'type': 'array',
                'items': {
                    'type': 'object',
                    'properties': {
                        'id': {'type': 'integer', 'description': 'ID de la reserva'},
                        'title': {'type': 'string', 'description': 'Título de la reserva'},
                        'start': {'type': 'string', 'format': 'ISO 8601', 'description': 'Fecha y hora de inicio'},
                        'end': {'type': 'string', 'format': 'ISO 8601', 'description': 'Fecha y hora de fin'},
                        'color': {'type': 'string', 'description': 'Color del recurso'},
                        'resourceId': {'type': 'integer', 'description': 'ID del recurso'},
                        'extendedProps': {
                            'type': 'object',
                            'properties': {
                                'descripcion': {'type': 'string', 'description': 'Descripción de la reserva'},
                                'usuario': {'type': 'string', 'description': 'Nombre de usuario'},
                                'estado': {'type': 'string', 'description': 'Estado de la reserva'},
                                'sala': {'type': 'string', 'description': 'Nombre de la sala'},
                                'capacidad': {'type': 'integer', 'description': 'Capacidad de la sala'}
                            }
                        }
                    }
                }
            },
            'rate_limit': '30 requests per minute',
            'authentication': 'None required'
        }
        
        # API de Horarios Ocupados
        self.endpoints['/api/horarios-ocupados/'] = {
            'method': 'GET',
            'description': 'Obtener horarios ocupados de una sala en una fecha específica',
            'parameters': {
                'recurso_id': {
                    'type': 'integer',
                    'required': True,
                    'description': 'ID del recurso/sala'
                },
                'fecha': {
                    'type': 'string',
                    'format': 'YYYY-MM-DD',
                    'required': True,
                    'description': 'Fecha para consultar horarios (ej: 2024-01-15)'
                }
            },
            'response': {
                'type': 'object',
                'properties': {
                    'horarios_ocupados': {
                        'type': 'array',
                        'items': {
                            'type': 'object',
                            'properties': {
                                'inicio': {'type': 'string', 'format': 'HH:MM', 'description': 'Hora de inicio'},
                                'fin': {'type': 'string', 'format': 'HH:MM', 'description': 'Hora de fin'},
                                'tipo': {'type': 'string', 'description': 'Tipo de ocupación (reserva, restricción)'}
                            }
                        }
                    },
                    'fecha': {'type': 'string', 'description': 'Fecha consultada'},
                    'recurso_id': {'type': 'integer', 'description': 'ID del recurso'}
                }
            },
            'rate_limit': '30 requests per minute',
            'authentication': 'None required'
        }
        
        # API de Validación de Conflictos
        self.endpoints['/api/validar-conflicto/'] = {
            'method': 'GET',
            'description': 'Validar conflictos de reservas en tiempo real',
            'parameters': {
                'sala': {
                    'type': 'integer',
                    'required': True,
                    'description': 'ID de la sala'
                },
                'fecha': {
                    'type': 'string',
                    'format': 'YYYY-MM-DD',
                    'required': True,
                    'description': 'Fecha de la reserva (ej: 2024-01-15)'
                },
                'hora_inicio': {
                    'type': 'string',
                    'format': 'HH:MM',
                    'required': True,
                    'description': 'Hora de inicio (ej: 09:00)'
                },
                'hora_fin': {
                    'type': 'string',
                    'format': 'HH:MM',
                    'required': True,
                    'description': 'Hora de fin (ej: 10:00)'
                }
            },
            'response': {
                'type': 'object',
                'properties': {
                    'conflicts': {
                        'type': 'array',
                        'items': {
                            'type': 'object',
                            'properties': {
                                'type': {'type': 'string', 'description': 'Tipo de conflicto'},
                                'message': {'type': 'string', 'description': 'Mensaje descriptivo del conflicto'}
                            }
                        }
                    },
                    'valid': {'type': 'boolean', 'description': 'Si la reserva es válida'},
                    'fecha': {'type': 'string', 'description': 'Fecha validada'},
                    'hora_inicio': {'type': 'string', 'description': 'Hora de inicio validada'},
                    'hora_fin': {'type': 'string', 'description': 'Hora de fin validada'},
                    'sala_id': {'type': 'integer', 'description': 'ID de la sala validada'}
                }
            },
            'rate_limit': '50 requests per minute',
            'authentication': 'None required'
        }
        
        # API de Exportación
        self.endpoints['/export/'] = {
            'method': 'GET',
            'description': 'Exportar calendario en diferentes formatos',
            'parameters': {
                'format': {
                    'type': 'string',
                    'enum': ['pdf', 'xlsx', 'excel'],
                    'required': False,
                    'default': 'pdf',
                    'description': 'Formato de exportación'
                },
                'date_from': {
                    'type': 'string',
                    'format': 'YYYY-MM-DD',
                    'required': True,
                    'description': 'Fecha de inicio del período'
                },
                'date_to': {
                    'type': 'string',
                    'format': 'YYYY-MM-DD',
                    'required': True,
                    'description': 'Fecha de fin del período'
                },
                'salas': {
                    'type': 'string',
                    'required': False,
                    'description': 'IDs de salas separados por coma (ej: 1,2,3)'
                },
                'include_descriptions': {
                    'type': 'boolean',
                    'required': False,
                    'default': False,
                    'description': 'Incluir descripciones en la exportación'
                },
                'include_attendees': {
                    'type': 'boolean',
                    'required': False,
                    'default': False,
                    'description': 'Incluir asistentes en la exportación'
                },
                'include_location': {
                    'type': 'boolean',
                    'required': False,
                    'default': False,
                    'description': 'Incluir ubicación en la exportación'
                }
            },
            'response': {
                'type': 'file',
                'description': 'Archivo de exportación en el formato solicitado'
            },
            'rate_limit': '10 requests per minute',
            'authentication': 'Staff required'
        }
    
    def get_endpoint_documentation(self, endpoint: str) -> Optional[Dict[str, Any]]:
        """Obtener documentación de un endpoint específico"""
        return self.endpoints.get(endpoint)
    
    def get_all_endpoints(self) -> Dict[str, Any]:
        """Obtener documentación de todos los endpoints"""
        return self.endpoints
    
    def generate_openapi_spec(self) -> Dict[str, Any]:
        """Generar especificación OpenAPI 3.0"""
        return {
            'openapi': '3.0.0',
            'info': {
                'title': 'Sistema de Calendario de Reservas API',
                'description': 'API para el sistema de gestión de reservas de salas',
                'version': '1.0.0',
                'contact': {
                    'name': 'Equipo de Desarrollo',
                    'email': 'dev@calendario-saipe.com'
                }
            },
            'servers': [
                {
                    'url': 'http://localhost:8000',
                    'description': 'Servidor de desarrollo'
                }
            ],
            'paths': self._generate_paths(),
            'components': {
                'schemas': self._generate_schemas(),
                'securitySchemes': {
                    'sessionAuth': {
                        'type': 'apiKey',
                        'in': 'cookie',
                        'name': 'sessionid'
                    }
                }
            },
            'security': [
                {'sessionAuth': []}
            ]
        }
    
    def _generate_paths(self) -> Dict[str, Any]:
        """Generar sección de paths para OpenAPI"""
        paths = {}
        
        for endpoint, doc in self.endpoints.items():
            path_item = {
                'get': {
                    'summary': doc['description'],
                    'parameters': self._generate_parameters(doc.get('parameters', {})),
                    'responses': self._generate_responses(doc.get('response', {})),
                    'security': self._generate_security(doc.get('authentication', 'None required'))
                }
            }
            
            # Agregar rate limiting como extensión
            if 'rate_limit' in doc:
                path_item['get']['x-rate-limit'] = doc['rate_limit']
            
            paths[endpoint] = path_item
        
        return paths
    
    def _generate_parameters(self, parameters: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Generar parámetros para OpenAPI"""
        params = []
        
        for name, param in parameters.items():
            param_def = {
                'name': name,
                'in': 'query',
                'description': param['description'],
                'required': param.get('required', False),
                'schema': {
                    'type': param['type']
                }
            }
            
            if 'format' in param:
                param_def['schema']['format'] = param['format']
            
            if 'enum' in param:
                param_def['schema']['enum'] = param['enum']
            
            if 'default' in param:
                param_def['schema']['default'] = param['default']
            
            params.append(param_def)
        
        return params
    
    def _generate_responses(self, response: Dict[str, Any]) -> Dict[str, Any]:
        """Generar respuestas para OpenAPI"""
        if response.get('type') == 'file':
            return {
                '200': {
                    'description': 'Archivo de exportación',
                    'content': {
                        'application/pdf': {
                            'schema': {'type': 'string', 'format': 'binary'}
                        },
                        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': {
                            'schema': {'type': 'string', 'format': 'binary'}
                        }
                    }
                }
            }
        else:
            return {
                '200': {
                    'description': 'Respuesta exitosa',
                    'content': {
                        'application/json': {
                            'schema': response
                        }
                    }
                },
                '400': {
                    'description': 'Error de validación',
                    'content': {
                        'application/json': {
                            'schema': {
                                'type': 'object',
                                'properties': {
                                    'error': {'type': 'string'},
                                    'error_type': {'type': 'string'}
                                }
                            }
                        }
                    }
                },
                '429': {
                    'description': 'Rate limit excedido',
                    'content': {
                        'application/json': {
                            'schema': {
                                'type': 'object',
                                'properties': {
                                    'error': {'type': 'string'},
                                    'error_type': {'type': 'string'},
                                    'retry_after': {'type': 'integer'}
                                }
                            }
                        }
                    }
                }
            }
    
    def _generate_security(self, auth_requirement: str) -> List[Dict[str, Any]]:
        """Generar configuración de seguridad"""
        if auth_requirement == 'Staff required':
            return [{'sessionAuth': []}]
        else:
            return []
    
    def _generate_schemas(self) -> Dict[str, Any]:
        """Generar esquemas de datos para OpenAPI"""
        return {
            'Reserva': {
                'type': 'object',
                'properties': {
                    'id': {'type': 'integer'},
                    'title': {'type': 'string'},
                    'start': {'type': 'string', 'format': 'date-time'},
                    'end': {'type': 'string', 'format': 'date-time'},
                    'color': {'type': 'string'},
                    'resourceId': {'type': 'integer'},
                    'extendedProps': {
                        'type': 'object',
                        'properties': {
                            'descripcion': {'type': 'string'},
                            'usuario': {'type': 'string'},
                            'estado': {'type': 'string'},
                            'sala': {'type': 'string'},
                            'capacidad': {'type': 'integer'}
                        }
                    }
                }
            },
            'Error': {
                'type': 'object',
                'properties': {
                    'error': {'type': 'string'},
                    'error_type': {'type': 'string'},
                    'details': {'type': 'string'}
                }
            }
        }
    
    def generate_markdown_docs(self) -> str:
        """Generar documentación en formato Markdown"""
        docs = []
        
        docs.append("# API del Sistema de Calendario de Reservas")
        docs.append("")
        docs.append("Esta documentación describe los endpoints disponibles en la API del sistema de calendario.")
        docs.append("")
        docs.append("## Información General")
        docs.append("")
        docs.append("- **Base URL**: `http://localhost:8000`")
        docs.append("- **Formato de respuesta**: JSON")
        docs.append("- **Autenticación**: Sesión de Django (para endpoints protegidos)")
        docs.append("")
        docs.append("## Rate Limiting")
        docs.append("")
        docs.append("La API implementa rate limiting para prevenir abuso:")
        docs.append("")
        docs.append("- **API de reservas**: 30 requests por minuto")
        docs.append("- **API de validación**: 50 requests por minuto")
        docs.append("- **API de exportación**: 10 requests por minuto")
        docs.append("")
        docs.append("## Endpoints")
        docs.append("")
        
        for endpoint, doc in self.endpoints.items():
            docs.append(f"### {doc['method']} {endpoint}")
            docs.append("")
            docs.append(doc['description'])
            docs.append("")
            
            if doc.get('parameters'):
                docs.append("#### Parámetros")
                docs.append("")
                docs.append("| Parámetro | Tipo | Requerido | Descripción |")
                docs.append("|-----------|------|-----------|-------------|")
                
                for param_name, param_info in doc['parameters'].items():
                    required = "Sí" if param_info.get('required', False) else "No"
                    docs.append(f"| `{param_name}` | {param_info['type']} | {required} | {param_info['description']} |")
                
                docs.append("")
            
            docs.append(f"#### Rate Limit: {doc.get('rate_limit', 'No limit')}")
            docs.append("")
            docs.append(f"#### Autenticación: {doc.get('authentication', 'None required')}")
            docs.append("")
            
            if doc.get('response'):
                docs.append("#### Respuesta")
                docs.append("")
                if doc['response'].get('type') == 'file':
                    docs.append("Archivo de exportación en el formato solicitado.")
                else:
                    docs.append("```json")
                    docs.append(json.dumps(doc['response'], indent=2, ensure_ascii=False))
                    docs.append("```")
                docs.append("")
            
            docs.append("---")
            docs.append("")
        
        return "\n".join(docs)


# Instancia global
api_docs = APIDocumentation()
