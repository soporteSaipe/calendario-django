"""
Configuración de Gunicorn para producción (Render).
Incluye warmup de BD y cache al arrancar cada worker para evitar timeouts en la primera request.
"""

import time

# Timeouts
timeout = 180  # 3 minutos para primera request tras cold start
graceful_timeout = 30  # Tiempo para terminar requests antes de reinicio

# Workers
workers = 1
max_requests = 500
max_requests_jitter = 50


def post_worker_init(worker):
    """
    Warmup al arrancar el worker: conexión BD y cache de recursos.
    Reduce la latencia de la primera request tras cold start.
    """
    start = time.time()
    try:
        from django.db import connection
        connection.ensure_connection()  # Establece conexión a Supabase
        from calendario.utils import CacheService
        CacheService.get_recursos_activos()  # Pre-carga cache usado por /calendario/
    except Exception as e:
        worker.log.warning(f"Warmup falló: {e}")
    worker.log.info(f"Warmup completado en {time.time() - start:.1f}s")


def worker_exit(server, worker):
    from django.db import connections
    connections.close_all()
