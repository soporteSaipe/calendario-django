# Guía de Deploy - Calendario de Reservas

## Problemas Identificados y Solucionados

### 1. Inconsistencias de Python
- ✅ **Problema**: `pyproject.toml` requería Python >=3.13 pero `runtime.txt` especificaba 3.11.7
- ✅ **Solución**: Corregido `pyproject.toml` para requerir Python >=3.11

### 2. Configuración de Producción Problemática
- ✅ **Problema**: Redis cache configurado pero no disponible en todos los servicios
- ✅ **Solución**: Cache con fallback a memoria local
- ✅ **Problema**: Logging a archivo sin verificar directorio
- ✅ **Solución**: Logging solo a consola

### 3. Dependencias Innecesarias
- ✅ **Problema**: `redis` y `django-redis` causaban fallos si Redis no estaba disponible
- ✅ **Solución**: Comentadas en `requirements.txt`, configuradas como opcionales

### 4. Dockerfile Mejorado
- ✅ **Problema**: `collectstatic` fallaba durante el build
- ✅ **Solución**: Agregado fallback para casos sin archivos estáticos

### 5. **PROBLEMA PRINCIPAL: Conexión a PostgreSQL**
- ❌ **Problema**: `settings_production.py` intenta conectarse a PostgreSQL en localhost:5432
- ❌ **Error**: `connection to server at "localhost" (::1), port 5432 failed: Connection refused`
- ✅ **Solución**: Cambiar a `settings_simple.py` que usa SQLite como fallback

## Opciones de Deploy

### Opción 1: Deploy con SQLite (Recomendado para empezar)
```bash
# Railway (usando configuración simplificada)
railway up

# Render (usando configuración simplificada)
render deploy

# Heroku (usando configuración simplificada)
git push heroku main
```

### Opción 2: Deploy con PostgreSQL (Avanzado)
```bash
# Primero configurar PostgreSQL en el servicio
# Luego cambiar DJANGO_SETTINGS_MODULE a settings_production
```

### Opción 3: Deploy de Emergencia
Si el deploy normal falla, usa la configuración simplificada:

```bash
# Windows
deploy_emergency.bat

# Linux/Mac
./deploy_emergency.sh
```

### Opción 4: Deploy Manual
```bash
# Configurar variables de entorno
export DJANGO_SETTINGS_MODULE=calendario_reservas.settings_simple
export DEBUG=False
export SECRET_KEY=tu-clave-secreta

# Instalar dependencias
pip install -r requirements.txt

# Ejecutar migraciones
python manage.py migrate

# Recopilar archivos estáticos
python manage.py collectstatic --noinput

# Iniciar servidor
python manage.py runserver 0.0.0.0:8000
```

## Configuraciones Disponibles

### 1. `settings.py` - Desarrollo
- SQLite por defecto
- DEBUG = True
- Configuración básica

### 2. `settings_production.py` - Producción Completa
- PostgreSQL con fallback a SQLite
- Redis cache con fallback a memoria
- Configuración de seguridad completa
- Logging a consola

### 3. `settings_simple.py` - Producción Simplificada
- SQLite como fallback
- Cache en memoria
- Configuración mínima
- Para casos de emergencia

## Variables de Entorno Requeridas

### Mínimas
```
SECRET_KEY=tu-clave-secreta
DEBUG=False
```

### Completas (opcionales)
```
DATABASE_URL=postgresql://...
REDIS_URL=redis://...
ALLOWED_HOSTS=tu-dominio.com
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_HOST_USER=tu-email@gmail.com
EMAIL_HOST_PASSWORD=tu-password
```

## Solución de Problemas

### Error: "No module named 'redis'"
- **Causa**: Redis no está disponible
- **Solución**: Usar `settings_simple.py` o instalar Redis

### Error: "Database connection failed"
- **Causa**: PostgreSQL no configurado
- **Solución**: Usar `settings_simple.py` para SQLite

### Error: "Static files not found"
- **Causa**: Archivos estáticos no recopilados
- **Solución**: Ejecutar `python manage.py collectstatic --noinput`

### Error: "ALLOWED_HOSTS" issue
- **Causa**: Host no permitido
- **Solución**: Configurar `ALLOWED_HOSTS` o usar `settings_simple.py`

## Recomendaciones

1. **Para desarrollo**: Usar `settings.py`
2. **Para producción con PostgreSQL**: Usar `settings_production.py`
3. **Para producción simple**: Usar `settings_simple.py`
4. **Para casos de emergencia**: Usar scripts de deploy de emergencia

## Archivos Modificados

- ✅ `pyproject.toml` - Versión de Python corregida
- ✅ `requirements.txt` - Dependencias opcionales comentadas
- ✅ `settings_production.py` - Configuración más robusta
- ✅ `settings_simple.py` - Nueva configuración simplificada
- ✅ `Dockerfile` - Mejorado para evitar fallos
- ✅ `railway.toml` - Configuración simplificada
- ✅ `deploy_emergency.bat` - Script de emergencia Windows
- ✅ `deploy_emergency.sh` - Script de emergencia Linux/Mac
