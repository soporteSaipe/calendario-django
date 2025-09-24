# 🛡️ Rate Limiting - Sistema de Reservas SAIPE

## 📋 **Resumen**

El sistema de rate limiting implementado protege la aplicación contra abuso y ataques, limitando el número de solicitudes que un usuario puede hacer en un período de tiempo específico.

## 🎯 **Límites Implementados**

| Endpoint | Límite | Método | Descripción |
|----------|--------|--------|-------------|
| **Crear Reserva** | 10/min | POST | Previene spam de reservas |
| **Editar Reserva** | 15/min | POST | Previene ediciones excesivas |
| **Eliminar Reserva** | 20/min | POST | Previene eliminaciones masivas |
| **API Reservas** | 30/min | GET | Previene consultas excesivas |
| **API Validar Conflicto** | 50/min | GET | Previene validaciones excesivas |

## 🔧 **Configuración Técnica**

### **Dependencias**
```bash
pip install django-ratelimit>=3.0.0
```

### **Settings.py**
```python
INSTALLED_APPS = [
    # ... otras apps
    'django_ratelimit',
]
```

### **Implementación en Vistas**
```python
from django_ratelimit.decorators import ratelimit

@ratelimit(key='user', rate='10/m', method='POST', block=True)
def crear_reserva(request):
    # Verificar si se excedió el límite
    if getattr(request, 'limited', False):
        return JsonResponse({
            'success': False,
            'error': 'Has alcanzado el límite de reservas (10 por minuto). Intenta en unos minutos.',
            'error_type': 'rate_limit_exceeded',
            'retry_after': 60
        }, status=429)
    # ... resto de la lógica
```

## 🚨 **Manejo de Errores**

### **Respuesta AJAX (429 Too Many Requests)**
```json
{
    "success": false,
    "error": "Has alcanzado el límite de reservas (10 por minuto). Intenta en unos minutos.",
    "error_type": "rate_limit_exceeded",
    "retry_after": 60
}
```

### **Respuesta HTML**
- Mensaje de error mostrado al usuario
- Redirección a la página anterior

### **Logging**
```python
logger.warning(f'Rate limit excedido para usuario: {request.user.username}')
```

## 🧪 **Pruebas**

### **Comando de Prueba**
```bash
python manage.py test_rate_limiting --username admin --password admin
```

### **Pruebas Manuales**
1. **Crear Reserva**: Intentar crear 15 reservas en 1 minuto
2. **API Reservas**: Hacer 35 consultas en 1 minuto
3. **API Validar Conflicto**: Hacer 55 validaciones en 1 minuto

### **Resultados Esperados**
- Las primeras solicitudes (dentro del límite) deben ser exitosas
- Las solicitudes que excedan el límite deben retornar 429
- Los logs deben mostrar las violaciones de rate limiting

## 🔍 **Monitoreo**

### **Logs de Rate Limiting**
```bash
# Buscar en logs
grep "Rate limit excedido" logs/django.log
```

### **Métricas Recomendadas**
- Número de rate limits por usuario
- Endpoints más afectados
- Patrones de abuso

## ⚙️ **Configuración Avanzada**

### **Rate Limiting por IP**
```python
@ratelimit(key='ip', rate='100/h', method='POST')
def crear_reserva(request):
    # ...
```

### **Rate Limiting por Recurso**
```python
@ratelimit(key='user', rate='5/m', method='POST')
def crear_reserva(request):
    # Límite específico por recurso
    # ...
```

### **Rate Limiting Personalizado**
```python
def get_user_rate_limit(request):
    if request.user.is_staff:
        return '50/m'  # Límite más alto para staff
    return '10/m'      # Límite normal para usuarios

@ratelimit(key='user', rate=get_user_rate_limit, method='POST')
def crear_reserva(request):
    # ...
```

## 🚀 **Beneficios**

### **Seguridad**
- ✅ Previene ataques de fuerza bruta
- ✅ Protege contra spam de reservas
- ✅ Evita sobrecarga del servidor

### **Performance**
- ✅ Mantiene la app responsive
- ✅ Reduce carga en base de datos
- ✅ Optimiza uso de recursos

### **Experiencia de Usuario**
- ✅ Mensajes de error claros
- ✅ Límites apropiados para uso normal
- ✅ Protección automática

## 🔧 **Troubleshooting**

### **Problema: Rate limit muy restrictivo**
**Solución**: Ajustar los límites en los decoradores
```python
@ratelimit(key='user', rate='20/m', method='POST')  # Aumentar límite
```

### **Problema: Rate limit no funciona**
**Solución**: Verificar configuración
1. `django_ratelimit` en `INSTALLED_APPS`
2. Decorador aplicado correctamente
3. Cache funcionando (Redis o memoria)

### **Problema: Usuarios legítimos bloqueados**
**Solución**: Implementar límites diferenciados
```python
def get_rate_limit(request):
    if request.user.is_staff:
        return '100/m'
    return '10/m'
```

## 📚 **Referencias**

- [Django Rate Limit Documentation](https://django-ratelimit.readthedocs.io/)
- [Rate Limiting Best Practices](https://cloud.google.com/architecture/rate-limiting-strategies-techniques)
- [HTTP 429 Status Code](https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/429)

---

**Última actualización**: Diciembre 2024  
**Versión**: 1.0  
**Mantenido por**: Equipo de Desarrollo SAIPE
