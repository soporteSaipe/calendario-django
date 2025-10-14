# Instrucciones para Cargar Usuarios desde Excel

## 📋 Formato del Archivo Excel

Crea un archivo llamado **`credenciales.xlsx`** en la raíz del proyecto con el siguiente formato:

| usuario      | contraseña  |
|--------------|-------------|
| juan.perez   | password123 |
| maria.gomez  | pass456     |
| carlos.lopez | mi_clave789 |

### Requisitos:
- **Nombre del archivo**: `credenciales.xlsx`
- **Ubicación**: Raíz del proyecto (mismo nivel que `manage.py`)
- **Primera fila**: Encabezados (`usuario` y `contraseña`)
- **Columna 1**: Nombre de usuario (sin espacios)
- **Columna 2**: Contraseña en texto plano
- **Email**: Se generará automáticamente como `[usuario]@saipe.com.ar`
- **Permisos**: Los usuarios NO serán staff ni superusuarios

## 🚀 Funcionamiento

### En Railway (Deploy Automático)
1. Sube el archivo `credenciales.xlsx` a tu repositorio de GitHub
2. Haz push de los cambios
3. Al hacer deploy en Railway, el script `start_app.py` ejecutará automáticamente:
   ```bash
   python manage.py cargar_usuarios_excel --archivo credenciales.xlsx
   ```
4. Los usuarios se crearán solo si no existen (evita duplicados)
5. **IMPORTANTE**: Después del primer deploy exitoso, elimina el archivo `credenciales.xlsx` del repositorio por seguridad

### Manualmente (Local)
```bash
python manage.py cargar_usuarios_excel --archivo credenciales.xlsx
```

O especificar otro archivo:
```bash
python manage.py cargar_usuarios_excel --archivo /ruta/a/otro_archivo.xlsx
```

## 📊 Ejemplos de Salida

### Éxito:
```
Cargando archivo: credenciales.xlsx
Fila 2: Usuario "juan.perez" creado exitosamente
Fila 3: Usuario "maria.gomez" creado exitosamente
Fila 4: Usuario "carlos.lopez" creado exitosamente

============================================================
✓ Usuarios creados: 3
============================================================
```

### Si hay usuarios duplicados:
```
Cargando archivo: credenciales.xlsx
Fila 2: Usuario "juan.perez" creado exitosamente
Fila 3: Usuario "maria.gomez" ya existe, saltando...
Fila 4: Usuario "carlos.lopez" creado exitosamente

============================================================
✓ Usuarios creados: 2
⚠ Usuarios que ya existían: 1
============================================================
```

### Si el archivo no existe:
```
El archivo credenciales.xlsx no existe. Saltando creación de usuarios.
```

## ⚠️ Notas de Seguridad

1. **NO incluyas contraseñas reales** en el repositorio público
2. Usa este método solo para ambiente de desarrollo o staging
3. Después del primer deploy, **elimina el archivo** `credenciales.xlsx` del repositorio:
   ```bash
   git rm credenciales.xlsx
   git commit -m "Eliminar archivo de credenciales después de carga inicial"
   git push
   ```
4. Para producción, considera usar variables de entorno o un sistema de gestión de secretos

## 🔧 Troubleshooting

### Error: "No module named 'openpyxl'"
- La dependencia ya está en `requirements.txt`. Asegúrate de hacer rebuild en Railway.

### Error: "Usuario o contraseña vacío"
- Verifica que todas las filas tengan valores en ambas columnas

### Los usuarios no se crean
- Verifica que el archivo se llame exactamente `credenciales.xlsx`
- Verifica que esté en la raíz del proyecto
- Revisa los logs de Railway para ver mensajes de error específicos

## 📝 Usuarios Creados

Cada usuario tendrá:
- **Username**: El valor de la columna "usuario"
- **Email**: `[usuario]@saipe.com.ar`
- **Password**: El valor de la columna "contraseña" (hasheado automáticamente)
- **is_staff**: `False`
- **is_superuser**: `False`

