"""
Configuración centralizada de base de datos para Supabase y otros proveedores PostgreSQL.
"""

import dj_database_url


def configure_database(database_url: str) -> dict:
    """
    Parsea DATABASE_URL sin cambiar el puerto y configura conexiones serverless.
    """
    config = dj_database_url.parse(database_url, conn_max_age=0, ssl_require=True)

    if config['ENGINE'] == 'django.db.backends.postgresql':
        config.setdefault('OPTIONS', {}).setdefault('connect_timeout', 10)
        config['CONN_MAX_AGE'] = 0
        config['CONN_HEALTH_CHECKS'] = True
        config['DISABLE_SERVER_SIDE_CURSORS'] = True

    return config
