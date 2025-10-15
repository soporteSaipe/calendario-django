# 🚀 Inicio Rápido con Supabase

Esta es una guía rápida para configurar tu proyecto con Supabase en **5 minutos**.

## ⚡ Configuración Express

### 1️⃣ Crear Proyecto en Supabase (2 minutos)

1. Ve a https://supabase.com y crea una cuenta
2. Click en "New Project"
3. Completa:
   - **Name**: `calendario-saipe`
   - **Password**: Genera y **GUARDA** la contraseña
   - **Region**: `South America (São Paulo)`
4. Click "Create new project"

### 2️⃣ Obtener Credenciales (1 minuto)

1. En tu proyecto, ve a **Settings** (⚙️) → **Database**
2. En "Connection string", selecciona pestaña **URI**
3. Copia la URL y reemplaza `[YOUR-PASSWORD]` con tu contraseña

Ejemplo:
```
postgresql://postgres.abc123:MiPassword123@aws-0-sa-east-1.pooler.supabase.com:5432/postgres
```

### 3️⃣ Configurar tu Proyecto (1 minuto)

Crea o edita tu archivo `.env`:

```bash
# Pega tu URL de Supabase aquí
DATABASE_URL=postgresql://postgres.abc123:MiPassword123@aws-0-sa-east-1.pooler.supabase.com:5432/postgres
```

### 4️⃣ Migrar la Base de Datos (1 minuto)

```bash
# Aplicar migraciones
python manage.py migrate

# Crear superusuario
python manage.py createsuperuser

# Iniciar servidor
python manage.py runserver
```

## ✅ ¡Listo!

Tu aplicación ahora usa Supabase. Accede a http://127.0.0.1:8000

---

## 🔄 Migrar Datos desde Railway

Si ya tienes datos en Railway:

### Paso 1: Exportar datos de Railway

```bash
python export_railway_data.py
```

### Paso 2: Configurar Supabase

Sigue los pasos 1-3 de arriba

### Paso 3: Aplicar migraciones

```bash
python manage.py migrate
```

### Paso 4: Importar datos

```bash
python import_to_supabase.py
```

---

## 📊 Verificar en el Panel de Supabase

1. Ve a tu proyecto en https://supabase.com
2. Click en **Table Editor**
3. Verás tus tablas:
   - `auth_user` (usuarios)
   - `calendario_recurso` (recursos)
   - `calendario_reserva` (reservas)

---

## 🔧 Configuración Avanzada

### Usar Variables Separadas

Si prefieres no usar DATABASE_URL, edita tu `.env`:

```bash
SUPABASE_DB_HOST=aws-0-sa-east-1.pooler.supabase.com
SUPABASE_DB_NAME=postgres
SUPABASE_DB_USER=postgres.abc123
SUPABASE_DB_PASSWORD=MiPassword123
SUPABASE_DB_PORT=5432
```

### Para Producción (Render, Vercel, etc.)

1. En tu servicio de hosting, ve a Variables de Entorno
2. Agrega:
   ```
   DATABASE_URL=tu-url-de-supabase
   DJANGO_SETTINGS_MODULE=calendario_reservas.settings_production
   ```

---

## 🆘 Solución de Problemas

### "connection refused"
- ✅ Verifica que la URL sea correcta
- ✅ Verifica tu conexión a internet
- ✅ Intenta desde el SQL Editor de Supabase

### "authentication failed"
- ✅ Verifica que reemplazaste `[YOUR-PASSWORD]`
- ✅ Resetea la contraseña en Settings → Database

### "SSL required"
La configuración ya está incluida en `settings_production.py`

---

## 📚 Documentación Completa

Para una guía detallada, ver: [MIGRACION_SUPABASE.md](./MIGRACION_SUPABASE.md)

---

## 🎯 Ventajas de Supabase

- ✅ **500 MB** de espacio (vs 100 MB en Railway)
- ✅ **Backups automáticos** (7 días)
- ✅ **Panel de administración** completo
- ✅ **Sin límite de conexiones**
- ✅ **APIs REST** automáticas (opcional)
- ✅ **Mejor rendimiento**

---

**¿Necesitas ayuda?** Revisa la documentación completa en [MIGRACION_SUPABASE.md](./MIGRACION_SUPABASE.md)

