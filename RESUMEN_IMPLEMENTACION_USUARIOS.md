# 📋 Resumen de Implementación: Carga de Usuarios desde Excel

## ✅ Archivos Creados/Modificados

### 1. **Comando de Django Management** 
📁 `calendario/management/commands/cargar_usuarios_excel.py`
- Lee archivo Excel con columnas "usuario" y "contraseña"
- Genera email automáticamente como `usuario@saipe.com.ar`
- Verifica duplicados antes de crear usuarios
- Muestra estadísticas detalladas al finalizar
- Maneja errores graciosamente

### 2. **Script de Inicio Modificado**
📁 `start_app.py` (líneas 39-42)
- Ejecuta automáticamente el comando de carga de usuarios
- Se ejecuta después de las migraciones
- Continúa el deploy aunque el archivo no exista

### 3. **Documentación**
📁 `INSTRUCCIONES_CREDENCIALES.md`
- Guía completa de uso
- Formato del archivo Excel
- Ejemplos de salida
- Notas de seguridad
- Troubleshooting

### 4. **Gitignore Actualizado**
📁 `.gitignore` (líneas 204-206)
- Preparado para ignorar credenciales.xlsx (comentado por ahora)

## 🚀 Cómo Usar

### Paso 1: Crear el archivo Excel
Crea `credenciales.xlsx` en la raíz del proyecto:

```
| usuario      | contraseña  |
|--------------|-------------|
| juan.perez   | password123 |
| maria.gomez  | pass456     |
| carlos.lopez | mi_clave789 |
```

### Paso 2: Subir a GitHub
```bash
git add credenciales.xlsx
git commit -m "Agregar credenciales para carga inicial de usuarios"
git push
```

### Paso 3: Deploy en Railway
Railway detectará los cambios y ejecutará automáticamente:
1. Migraciones de base de datos
2. Collectstatic
3. **Carga de usuarios desde Excel** ← NUEVO
4. Creación de superusuario (si no existe)
5. Inicio del servidor Gunicorn

### Paso 4: Verificar en los logs de Railway
Busca en los logs:
```
Verificando archivo de credenciales...
Cargando archivo: credenciales.xlsx
Fila 2: Usuario "juan.perez" creado exitosamente
...
✓ Usuarios creados: X
```

### Paso 5: Eliminar archivo de credenciales (IMPORTANTE)
Después de verificar que los usuarios se crearon:
```bash
git rm credenciales.xlsx
git commit -m "Eliminar credenciales después de carga inicial"
git push
```

Luego descomenta en `.gitignore`:
```
credenciales.xlsx
```

## 🔍 Características del Sistema

### ✅ Lo que hace:
- ✓ Lee Excel (.xlsx) con openpyxl (ya incluido en requirements.txt)
- ✓ Salta la primera fila (encabezados)
- ✓ Genera emails automáticamente: `usuario@saipe.com.ar`
- ✓ Hashea contraseñas automáticamente con Django
- ✓ Verifica duplicados (no crea si ya existe el usuario)
- ✓ Usuarios normales (is_staff=False, is_superuser=False)
- ✓ Se ejecuta solo en el primer deploy (si el archivo existe)
- ✓ Muestra estadísticas detalladas
- ✓ Manejo robusto de errores

### ❌ Protecciones:
- ✗ No falla el deploy si el archivo no existe
- ✗ No duplica usuarios existentes
- ✗ No requiere interacción manual
- ✗ No expone contraseñas en logs

## 📊 Ejemplo de Salida Exitosa

```
=== Inicializando base de datos ===
Ejecutando: python manage.py migrate --noinput
Operations to perform:
  Apply all migrations: admin, auth, calendario, contenttypes, sessions
Running migrations:
  No migrations to apply.

Ejecutando: python manage.py collectstatic --noinput
168 static files copied to '/app/staticfiles'.

Verificando archivo de credenciales...
Ejecutando: python manage.py cargar_usuarios_excel --archivo credenciales.xlsx
Cargando archivo: credenciales.xlsx
Fila 2: Usuario "juan.perez" creado exitosamente
Fila 3: Usuario "maria.gomez" creado exitosamente
Fila 4: Usuario "carlos.lopez" creado exitosamente

============================================================
✓ Usuarios creados: 3
============================================================

Creando superusuario...
Superusuario creado: admin/admin123
Creando usuario de prueba...
Usuario de prueba creado: usuario_prueba/prueba123
Se crearon 4 recursos de ejemplo
=== Inicialización completada ===
Iniciando Gunicorn en puerto 8000...
```

## 🧪 Probar Localmente (Opcional)

```bash
# Activar entorno virtual
python -m venv venv
source venv/bin/activate  # En Windows: venv\Scripts\activate

# Instalar dependencias
pip install -r requirements.txt

# Ejecutar comando manualmente
python manage.py cargar_usuarios_excel --archivo credenciales.xlsx

# O con otro archivo
python manage.py cargar_usuarios_excel --archivo /ruta/otro_archivo.xlsx
```

## ⚠️ Recordatorios de Seguridad

1. ✅ **ELIMINA** `credenciales.xlsx` del repositorio después del primer deploy exitoso
2. ✅ **NO** subas contraseñas reales a repositorios públicos
3. ✅ **ACTIVA** el gitignore para credenciales.xlsx después de eliminar el archivo
4. ✅ Cambia las contraseñas desde el panel admin de Django en producción
5. ✅ Considera usar variables de entorno para credenciales en el futuro

## 📞 Soporte

Si encuentras problemas:
1. Revisa los logs de Railway
2. Verifica que el archivo Excel tenga el formato correcto
3. Asegúrate de que openpyxl esté instalado (ya está en requirements.txt)
4. Consulta `INSTRUCCIONES_CREDENCIALES.md` para más detalles

---

**Estado**: ✅ Implementación completa y lista para usar
**Última actualización**: 14 de octubre de 2025

