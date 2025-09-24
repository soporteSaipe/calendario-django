"""
Constantes del sistema de calendario de reservas
Centraliza todos los valores de configuración y reglas de negocio
"""


class CacheConfig:
    """Configuración de cache"""
    RECURSOS_TIMEOUT = 600  # 10 minutos
    RESERVAS_TIMEOUT = 300  # 5 minutos
    CACHE_KEY_RECURSOS = 'recursos_activos'


class RateLimitConfig:
    """Configuración de rate limiting"""
    CREATE_RESERVA = 10  # 10 reservas por minuto
    EDIT_RESERVA = 15    # 15 ediciones por minuto
    DELETE_RESERVA = 20  # 20 eliminaciones por minuto
    API_REQUESTS = 30    # 30 consultas API por minuto
    VALIDATION_REQUESTS = 50  # 50 validaciones por minuto
    WINDOW_SECONDS = 60  # Ventana de tiempo en segundos


class BusinessRules:
    """Reglas de negocio del sistema"""
    MIN_HOUR = 7         # Hora mínima para reservas
    MAX_HOUR = 18        # Hora máxima para reservas
    MAX_FUTURE_DAYS = 180  # Máximo 6 meses en el futuro
    MAX_EXPORT_DAYS = 365  # Máximo 1 año para exportaciones
    MIN_RESERVATION_DURATION = 30  # Duración mínima en minutos
    MAX_RESERVATION_DURATION = 480  # Duración máxima en minutos (8 horas)


class PaginationConfig:
    """Configuración de paginación"""
    RESERVAS_PER_PAGE = 15
    DASHBOARD_ITEMS_PER_PAGE = 10


class ExportConfig:
    """Configuración de exportación"""
    SUPPORTED_FORMATS = ['pdf', 'xlsx', 'excel']
    DEFAULT_FORMAT = 'pdf'
    MAX_RECORDS_PER_EXPORT = 10000


class TimezoneConfig:
    """Configuración de zonas horarias"""
    DEFAULT_TIMEZONE = 'America/Argentina/Buenos_Aires'
    UTC_TIMEZONE = 'UTC'


class LoggingConfig:
    """Configuración de logging"""
    LOG_LEVEL = 'INFO'
    LOG_FORMAT = '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
    LOG_FILE = 'logs/django.log'


class SecurityConfig:
    """Configuración de seguridad"""
    CSRF_COOKIE_SECURE = True
    SESSION_COOKIE_SECURE = True
    SECURE_BROWSER_XSS_FILTER = True
    SECURE_CONTENT_TYPE_NOSNIFF = True


class DatabaseConfig:
    """Configuración de base de datos"""
    CONN_MAX_AGE = 0  # No reutilizar conexiones
    CONN_HEALTH_CHECKS = True


class StaticFilesConfig:
    """Configuración de archivos estáticos"""
    STATIC_URL = 'static/'
    STATIC_ROOT = 'staticfiles'
    MEDIA_URL = 'media/'
    MEDIA_ROOT = 'media'


class EmailConfig:
    """Configuración de email (para futuras notificaciones)"""
    EMAIL_BACKEND = 'django.core.mail.backends.console.EmailBackend'
    DEFAULT_FROM_EMAIL = 'noreply@calendario-saipe.com'
    EMAIL_SUBJECT_PREFIX = '[Calendario SAIPE] '


class APIConfig:
    """Configuración de API"""
    DEFAULT_PAGE_SIZE = 20
    MAX_PAGE_SIZE = 100
    API_VERSION = 'v1'
    API_PREFIX = 'api'


class CalendarConfig:
    """Configuración específica del calendario"""
    DEFAULT_VIEW = 'month'
    AVAILABLE_VIEWS = ['month', 'week', 'day']
    FIRST_DAY_OF_WEEK = 1  # Lunes
    BUSINESS_HOURS_START = 7
    BUSINESS_HOURS_END = 18
    WEEKEND_DISABLED = False


class NotificationConfig:
    """Configuración de notificaciones"""
    ENABLE_EMAIL_NOTIFICATIONS = False
    ENABLE_BROWSER_NOTIFICATIONS = True
    NOTIFICATION_TYPES = [
        'reserva_created',
        'reserva_updated',
        'reserva_cancelled',
        'reserva_reminder'
    ]


class ValidationMessages:
    """Mensajes de validación"""
    REQUIRED_FIELDS = 'Campos obligatorios faltantes: {fields}'
    INVALID_DATE_RANGE = 'La fecha de fin debe ser posterior a la fecha de inicio'
    PAST_DATE_NOT_ALLOWED = 'No se pueden realizar reservas en fechas pasadas'
    FUTURE_DATE_EXCEEDED = 'Las reservas solo pueden realizarse hasta 6 meses en el futuro'
    WORKING_HOURS_VIOLATION = 'Las reservas solo pueden realizarse entre las 07:00 y 18:00'
    RESOURCE_NOT_FOUND = 'El recurso seleccionado no existe o no está activo'
    CONFLICT_DETECTED = 'Ya existe una reserva para este recurso en el horario seleccionado'
    RATE_LIMIT_EXCEEDED = 'Has alcanzado el límite de solicitudes. Intenta en unos minutos.'


class SuccessMessages:
    """Mensajes de éxito"""
    RESERVA_CREATED = 'Reserva creada exitosamente en {recurso}.'
    RESERVA_UPDATED = 'Reserva actualizada exitosamente.'
    RESERVA_DELETED = 'Reserva eliminada exitosamente.'
    EXPORT_GENERATED = 'Exportación generada exitosamente.'


class ErrorMessages:
    """Mensajes de error"""
    UNEXPECTED_ERROR = 'Error inesperado: {error}'
    VALIDATION_ERROR = 'Error de validación: {error}'
    PERMISSION_DENIED = 'No tienes permisos para realizar esta acción'
    RESOURCE_UNAVAILABLE = 'El recurso no está disponible en este momento'
    EXPORT_ERROR = 'Error al generar la exportación: {error}'
