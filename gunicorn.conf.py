"""
Configuración de Gunicorn con warmup para evitar 503 en primera petición.
Precalienta la conexión a BD y el cache de recursos al arrancar cada worker.
"""


def post_worker_init(worker):
    """Precalentar BD y cache al arrancar cada worker."""
    try:
        from django.db import connection
        connection.ensure_connection()
        from calendario.utils import CacheService
        CacheService.get_recursos_activos()
    except Exception:
        pass  # No fallar el arranque si el warmup falla
