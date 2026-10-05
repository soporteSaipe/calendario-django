# Calendario en Vercel

La rama de despliegue es `calendario-vercel`. El proyecto usa la integración
Django de Vercel, Python 3.13 y WhiteNoise con archivos estáticos versionados.
`manage.py` selecciona producción cuando existe `VERCEL`; para otros servidores
se debe definir `DJANGO_SETTINGS_MODULE=calendario_reservas.settings_production`.

En el proyecto `calendariosaipe`, `calendario-vercel` genera despliegues Preview.
La rama de producción configurada en Vercel es `feature/calendario-django`.
El Preview de `calendario-vercel` usa overrides de `ALLOWED_HOSTS` y
`CSRF_TRUSTED_ORIGINS` con sus dominios explícitos. Las variables compartidas
deben cumplir las mismas restricciones antes de promover a producción.

## Variables del proyecto

- `SECRET_KEY`: clave aleatoria de al menos 50 caracteres. Ya no hay clave de
  respaldo en producción. Se puede generar con
  `python -c "from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())"`.
- `DATABASE_URL`: URL PostgreSQL con SSL. Se conserva el puerto proporcionado;
  para el pooler transaccional Supabase elegir explícitamente el puerto 6543.
  También se admiten las variables `SUPABASE_DB_*` de `env.example`.
- `ALLOWED_HOSTS`: dominios propios separados por comas, sin protocolo ni
  comodines. Vercel añade los dominios de su proyecto automáticamente mediante
  `VERCEL_URL`, `VERCEL_PROJECT_PRODUCTION_URL` y `VERCEL_BRANCH_URL`.
- `CSRF_TRUSTED_ORIGINS`: solo si se necesitan orígenes adicionales; URLs HTTPS
  explícitas, sin comodines de proveedores. Las peticiones del mismo origen
  no necesitan agregarse aquí.
- `REDIS_URL` (recomendado): cache Redis compartido para límites de solicitudes
  entre instancias. Sin Redis, el límite es local a cada proceso y no constituye
  protección global contra fuerza bruta; complementar con el firewall de Vercel.
  Los visitantes anónimos se identifican por `REMOTE_ADDR`: si el proxy agrupa
  direcciones, también comparte ese límite. No se confía en encabezados de IP
  que un cliente pueda falsificar.

Producción fuerza `DEBUG=False`, cookies seguras y redirección HTTPS. El proxy
debe proporcionar `X-Forwarded-Proto`. No ejecutar `runserver` con esta
configuración para navegar por HTTP local.

## Verificación y publicación

1. Instalar `requirements.txt` en un entorno virtual Python 3.13.
2. Ejecutar `python manage.py test --settings=calendario_reservas.settings_test`.
   Estas pruebas usan SQLite en memoria, no leen `.env` ni conectan a producción.
   Ejecutar también `node --test tests/frontend.test.cjs` para regresiones JS.
   La prueba concurrente requiere PostgreSQL y se omite explícitamente en SQLite.
3. Con las variables de producción configuradas, ejecutar
   `python manage.py check --deploy --settings=calendario_reservas.settings_production`.
   HSTS para subdominios/preload permanece desactivado intencionalmente.
4. Ejecutar `python manage.py collectstatic --no-input --settings=calendario_reservas.settings_production`.
5. Aplicar migraciones desde un entorno autorizado antes de publicar si hay
   migraciones nuevas. El build no modifica la base de datos.
6. Revisar un Preview de Vercel: login, calendario, alta/edición/eliminación,
   viajes de varios días, exportaciones, modo oscuro y móvil. La verificación
   local no sustituye este paso ni publica automáticamente la rama.

## Archivos sensibles

`.env.vercel` y `credenciales.xlsx` se quitaron del índice Git conservando las
copias locales. `.gitignore` y `.vercelignore` los excluyen. Esto no borra sus
versiones históricas: rotar las credenciales reales que hayan estado presentes
en esos archivos o en logs antiguos. Una eventual limpieza de historial requiere
coordinar a los colaboradores y no se realiza automáticamente.

Los scripts `start_app.py` e `init_db.py` ya no crean usuarios de demostración,
no restablecen contraseñas administrativas ni importan credenciales al arrancar.
Si se ejecutaron anteriormente, revisar las cuentas `admin` y `usuario_prueba`
existentes y cambiar sus contraseñas o desactivarlas según corresponda.
Crear administradores mediante `python manage.py createsuperuser` en un entorno
autorizado. La importación desde Excel es una operación manual y no actualiza
usuarios existentes salvo que se solicite explícitamente.
Para esa operación deliberada se usa `--actualizar-existentes`; las filas con
contraseñas débiles o datos inválidos se rechazan y el comando termina con error.
Las filas válidas anteriores se conservan porque la transacción es por fila.

## Referencias

- [Django en Vercel](https://vercel.com/docs/frameworks/full-stack/django)
- [Configuración de producción Django](https://docs.djangoproject.com/en/5.2/howto/deployment/checklist/)
- [WhiteNoise y Django](https://whitenoise.readthedocs.io/en/stable/django.html)
