"""
Configuración de Gunicorn con warmup para evitar 503 en primera petición.
Precalienta la conexión a BD y el cache de recursos al arrancar cada worker.
El warmup corre en un hilo para no bloquear al worker (evita "No open HTTP ports").
"""

import threading


def _do_warmup():
    """Ejecutar warmup: conexión BD y cache de recursos."""
    try:
        from django.db import connection
        connection.ensure_connection()
        from calendario.utils import CacheService
        CacheService.get_recursos_activos()
    except Exception:
        pass


def post_worker_init(worker):
    """Lanzar warmup en segundo plano para no bloquear al worker."""
    thread = threading.Thread(target=_do_warmup, daemon=True)
    thread.start()
