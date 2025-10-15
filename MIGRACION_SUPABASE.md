# 🚀 Guía de Migración de Railway a Supabase

Esta guía te ayudará a migrar tu aplicación Django del servicio de base de datos de Railway a Supabase (PostgreSQL).

## 📋 Índice

1. [¿Por qué Supabase?](#por-qué-supabase)
2. [Requisitos Previos](#requisitos-previos)
3. [Paso 1: Crear Proyecto en Supabase](#paso-1-crear-proyecto-en-supabase)
4. [Paso 2: Obtener Credenciales](#paso-2-obtener-credenciales)
5. [Paso 3: Exportar Datos de Railway](#paso-3-exportar-datos-de-railway)
6. [Paso 4: Configurar el Proyecto](#paso-4-configurar-el-proyecto)
7. [Paso 5: Migrar la Base de Datos](#paso-5-migrar-la-base-de-datos)
8. [Paso 6: Importar Datos](#paso-6-importar-datos)
9. [Paso 7: Verificar y Probar](#paso-7-verificar-y-probar)
10. [Rollback (en caso de problemas)](#rollback-en-caso-de-problemas)

---

## 🎯 ¿Por qué Supabase?

**Ventajas de Supabase:**
- ✅ **Plan gratuito generoso**: 500 MB de espacio, 2 GB de transferencia
- ✅ **PostgreSQL completo**: Versión actualizada con todas las características
- ✅ **Backups automáticos**: En plan gratuito (hasta 7 días)
- ✅ **Panel de administración**: Interfaz web para gestionar datos
- ✅ **APIs REST automáticas**: Si las necesitas en el futuro
- ✅ **Autenticación integrada**: Opcional para futuras implementaciones
- ✅ **Sin límite de conexiones** en plan gratuito
- ✅ **Rendimiento superior**: Servidores optimizados

---

## 📦 Requisitos Previos

Antes de comenzar, asegúrate de tener:

- [ ] Acceso a tu proyecto en Railway
- [ ] Cuenta en Supabase (crear en https://supabase.com)
- [ ] Python y PostgreSQL instalados localmente
- [ ] Backup de tus datos actuales
- [ ] Acceso al código del proyecto

---

## 🆕 Paso 1: Crear Proyecto en Supabase

### 1.1 Registrarse en Supabase

1. Ve a https://supabase.com
2. Haz clic en "Start your project"
3. Regístrate con GitHub, Google o email

### 1.2 Crear un Nuevo Proyecto

1. En el dashboard, haz clic en **"New project"**
2. Completa los datos:
   - **Name**: `calendario-saipe` (o el nombre que prefieras)
   - **Database Password**: Genera una contraseña segura (¡GUÁRDALA!)
   - **Region**: Selecciona `South America (São Paulo)` para mejor latencia
   - **Pricing Plan**: Free (o el que prefieras)
3. Haz clic en **"Create new project"**
4. Espera 2-3 minutos mientras se crea el proyecto

---

## 🔑 Paso 2: Obtener Credenciales

### 2.1 Obtener Credenciales de Conexión

1. En tu proyecto de Supabase, ve a **Settings** (⚙️) → **Database**
2. En la sección **Connection string**, encontrarás varias opciones
3. Selecciona la pestaña **URI** (no session pooler)
4. Copia la URI que se ve así:

```
postgresql://postgres.xxxxxxxxxxxxx:[YOUR-PASSWORD]@aws-0-sa-east-1.pooler.supabase.com:5432/postgres
```

### 2.2 Reemplazar la Contraseña

⚠️ **IMPORTANTE**: Reemplaza `[YOUR-PASSWORD]` con la contraseña que generaste en el paso 1.2

La URL final debe verse así:
```
postgresql://postgres.xxxxxxxxxxxxx:tu-password-aqui@aws-0-sa-east-1.pooler.supabase.com:5432/postgres
```

### 2.3 Credenciales Individuales (alternativa)

Si prefieres usar credenciales separadas, en la misma página encontrarás:

```
Host: aws-0-sa-east-1.pooler.supabase.com
Database name: postgres
Port: 5432
User: postgres.xxxxxxxxxxxxx
Password: [tu-password]
```

---

## 💾 Paso 3: Exportar Datos de Railway

### 3.1 Método Automático (Recomendado)

Usa el script proporcionado para exportar tus datos:

```bash
python export_railway_data.py
```

Este script:
- Se conecta a tu base de datos de Railway
- Exporta todas las tablas a archivos JSON
- Crea un backup completo en la carpeta `backup_railway/`

### 3.2 Método Manual (PostgreSQL)

Si prefieres usar herramientas de PostgreSQL:

#### Opción A: Usando pg_dump desde Railway

1. En Railway, ve a tu servicio de PostgreSQL
2. Copia las credenciales de conexión
3. Ejecuta:

```bash
# Exportar toda la base de datos
pg_dump -h hostname -U username -d database_name > backup_railway.sql

# O si tienes DATABASE_URL de Railway:
pg_dump $DATABASE_URL > backup_railway.sql
```

#### Opción B: Desde el panel de Railway

1. Ve a tu base de datos en Railway
2. Click en la pestaña "Data"
3. Usa la herramienta de exportación si está disponible

---

## ⚙️ Paso 4: Configurar el Proyecto

### 4.1 Actualizar Variables de Entorno

Crea o actualiza tu archivo `.env`:

```bash
# Configuración de Django
SECRET_KEY=tu-clave-secreta-aqui
DEBUG=True
ALLOWED_HOSTS=127.0.0.1,localhost

# Base de datos Supabase
DATABASE_URL=postgresql://postgres.xxxxxxxxxxxxx:tu-password@aws-0-sa-east-1.pooler.supabase.com:5432/postgres

# Alternativa: Usar variables individuales
SUPABASE_DB_HOST=aws-0-sa-east-1.pooler.supabase.com
SUPABASE_DB_NAME=postgres
SUPABASE_DB_USER=postgres.xxxxxxxxxxxxx
SUPABASE_DB_PASSWORD=tu-password-aqui
SUPABASE_DB_PORT=5432
```

### 4.2 Configurar Variables en Producción

Si despliegas en otro servicio (Render, Vercel, etc.):

1. Ve a la configuración de variables de entorno
2. Agrega `DATABASE_URL` con tu URL de Supabase
3. Asegúrate de que `DJANGO_SETTINGS_MODULE=calendario_reservas.settings_production`

---

## 🔄 Paso 5: Migrar la Base de Datos

### 5.1 Aplicar Migraciones a Supabase

Con las nuevas credenciales configuradas:

```bash
# 1. Activar entorno virtual (si usas uno)
# Windows
venv\Scripts\activate
# Linux/Mac
source venv/bin/activate

# 2. Aplicar migraciones a Supabase
python manage.py migrate

# 3. Verificar que las tablas se crearon
python manage.py dbshell
```

En el shell de PostgreSQL:
```sql
\dt  -- Ver todas las tablas
\q   -- Salir
```

### 5.2 Crear Superusuario

```bash
python manage.py createsuperuser
```

---

## 📥 Paso 6: Importar Datos

### 6.1 Método Automático (Recomendado)

Usa el script de importación:

```bash
python import_to_supabase.py
```

Este script:
- Lee los archivos de backup de Railway
- Importa todos los datos a Supabase
- Verifica la integridad de los datos

### 6.2 Método Manual (SQL)

Si exportaste con pg_dump:

```bash
# Importar el backup SQL a Supabase
psql $DATABASE_URL < backup_railway.sql

# O especificando las credenciales:
psql -h aws-0-sa-east-1.pooler.supabase.com \
     -U postgres.xxxxxxxxxxxxx \
     -d postgres \
     -f backup_railway.sql
```

### 6.3 Cargar Usuarios desde Excel (si es necesario)

Si necesitas recrear usuarios:

```bash
python manage.py cargar_usuarios_excel
```

---

## ✅ Paso 7: Verificar y Probar

### 7.1 Verificar Conexión

```bash
python manage.py check --database default
```

### 7.2 Probar la Aplicación

```bash
# Iniciar servidor de desarrollo
python manage.py runserver

# Acceder a:
# http://127.0.0.1:8000/admin/
# http://127.0.0.1:8000/
```

### 7.3 Verificar Datos

1. Accede al admin de Django
2. Verifica que todos los usuarios estén presentes
3. Verifica que las reservas estén correctas
4. Verifica que los recursos estén completos

### 7.4 Panel de Supabase

También puedes verificar desde el panel de Supabase:

1. Ve a **Table Editor** en tu proyecto
2. Selecciona las tablas para ver los datos
3. Verifica que todo esté correcto

---

## 🔧 Configuración Adicional de Supabase

### 7.1 Configurar Extensiones PostgreSQL

Supabase tiene extensiones útiles. Para habilitarlas:

1. Ve a **Database** → **Extensions** en Supabase
2. Habilita las que necesites:
   - `pg_stat_statements` (métricas de rendimiento)
   - `pgcrypto` (encriptación)
   - `uuid-ossp` (UUIDs)

### 7.2 Configurar Políticas de Seguridad (Row Level Security)

Si usas el API de Supabase (opcional):

```sql
-- Desactivar RLS para Django (Django maneja la seguridad)
ALTER TABLE calendario_recurso DISABLE ROW LEVEL SECURITY;
ALTER TABLE calendario_reserva DISABLE ROW LEVEL SECURITY;
-- Repite para todas tus tablas
```

---

## 🔙 Rollback (en caso de problemas)

Si necesitas volver a Railway:

### Opción 1: Cambiar DATABASE_URL

1. Restaura la `DATABASE_URL` de Railway en tus variables de entorno
2. Reinicia tu aplicación
3. Los datos en Railway permanecen intactos

### Opción 2: Restaurar Backup

Si borraste datos de Railway:

```bash
# Restaurar desde el backup
psql $RAILWAY_DATABASE_URL < backup_railway.sql
```

---

## 📊 Comparación de Planes Gratuitos

| Característica | Railway (Free) | Supabase (Free) |
|---------------|----------------|-----------------|
| **Espacio** | 100 MB | 500 MB |
| **RAM** | Limitada | 256 MB dedicados |
| **Transferencia** | 100 GB | 2 GB |
| **Conexiones** | 5 | Sin límite |
| **Backups** | No | Sí (7 días) |
| **Panel Admin** | Básico | Completo |
| **Uptime** | 99% | 99.9% |

---

## 🆘 Solución de Problemas

### Error: "connection refused"

**Problema**: No se puede conectar a Supabase
**Solución**:
- Verifica que la URL sea correcta
- Verifica que reemplazaste `[YOUR-PASSWORD]`
- Verifica tu conexión a internet
- Intenta desde el panel de Supabase (SQL Editor)

### Error: "authentication failed"

**Problema**: Contraseña incorrecta
**Solución**:
- Verifica que la contraseña no tenga espacios
- Resetea la contraseña en Settings → Database → Reset password
- Actualiza la `DATABASE_URL` con la nueva contraseña

### Error: "SSL required"

**Problema**: Supabase requiere SSL
**Solución**:
Agrega `?sslmode=require` al final de tu DATABASE_URL:
```
postgresql://user:pass@host:5432/db?sslmode=require
```

### Migraciones no se aplican

**Problema**: Las migraciones fallan
**Solución**:
```bash
# Limpiar migraciones anteriores
python manage.py migrate --fake-initial

# O comenzar desde cero
python manage.py migrate --run-syncdb
```

### Datos no aparecen

**Problema**: Los datos no se importaron correctamente
**Solución**:
- Verifica los logs del script de importación
- Verifica en el panel de Supabase (Table Editor)
- Revisa las foreign keys y constraints
- Importa tabla por tabla manualmente

---

## 📞 Recursos Adicionales

- **Documentación Supabase**: https://supabase.com/docs
- **Supabase PostgreSQL**: https://supabase.com/docs/guides/database
- **Django + Supabase**: https://supabase.com/docs/guides/getting-started/tutorials/with-django
- **Comunidad Supabase**: https://github.com/supabase/supabase/discussions

---

## ✨ Próximos Pasos

Una vez migrado exitosamente a Supabase:

1. [ ] Configurar backups automáticos adicionales
2. [ ] Explorar las APIs REST de Supabase (opcional)
3. [ ] Configurar autenticación de Supabase (opcional)
4. [ ] Explorar Supabase Storage para archivos (opcional)
5. [ ] Configurar monitoreo y alertas

---

## 🎉 ¡Migración Completada!

Si llegaste hasta aquí y todo funciona, ¡felicitaciones! Tu aplicación ahora usa Supabase.

**Beneficios que ahora tienes:**
- ✅ Más espacio de almacenamiento
- ✅ Backups automáticos
- ✅ Panel de administración mejorado
- ✅ Mejor rendimiento
- ✅ Sin límite de conexiones

---

## 📝 Checklist Final

- [ ] Proyecto creado en Supabase
- [ ] Credenciales obtenidas y guardadas
- [ ] Datos exportados de Railway
- [ ] Variables de entorno actualizadas
- [ ] Migraciones aplicadas en Supabase
- [ ] Datos importados correctamente
- [ ] Aplicación probada y funcionando
- [ ] Backup de Railway guardado (por si acaso)
- [ ] Documentación actualizada

---

**Autor**: Sistema de Calendario SAIPE
**Última actualización**: Octubre 2025
**Versión**: 1.0

