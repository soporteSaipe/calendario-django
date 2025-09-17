# Gunicorn configuration file for Railway
import os

# Get port from environment variable
port = os.getenv('PORT', '8000')

# Bind to all interfaces on the specified port
bind = f"0.0.0.0:{port}"

# Worker configuration
workers = 2
worker_class = 'sync'
worker_connections = 1000
timeout = 30
keepalive = 2

# Logging
accesslog = '-'
errorlog = '-'
loglevel = 'info'

# Process naming
proc_name = 'calendario_reservas'

# Preload app for better performance
preload_app = True

# Max requests before worker restart
max_requests = 1000
max_requests_jitter = 100
