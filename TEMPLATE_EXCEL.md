# 📊 Template para credenciales.xlsx

## Formato Requerido

Crea un archivo Excel llamado **`credenciales.xlsx`** con la siguiente estructura:

### Hoja 1 (Sheet1 - por defecto)

| **usuario** | **contraseña** |
|-------------|----------------|
| juan.perez  | MiClave123!    |
| ana.garcia  | Password456    |
| luis.rodriguez | SuperPass789 |
| maria.lopez | Secure2024     |
| carlos.martinez | Admin2024! |

## ⚠️ Importante

### Requisitos del Excel:
- ✅ **Nombre de archivo**: Exactamente `credenciales.xlsx` (minúsculas)
- ✅ **Ubicación**: Raíz del proyecto (mismo nivel que `manage.py`)
- ✅ **Primera fila**: DEBE contener los encabezados `usuario` y `contraseña`
- ✅ **Formato**: `.xlsx` (Excel 2007 o superior)
- ✅ **Columnas**: Solo 2 columnas (usuario y contraseña)

### Datos:
- ✅ **Usuario**: Letras, números, guiones y puntos (sin espacios)
- ✅ **Contraseña**: Texto plano (se hasheará automáticamente)
- ✅ **Email**: Se generará automáticamente como `{usuario}@saipe.com.ar`

### Permisos:
- ❌ **is_staff**: False (no son administradores)
- ❌ **is_superuser**: False (no son superusuarios)

## 📝 Ejemplo de Usuarios Generados

Con el template de arriba se crearán:

| Username | Email | Password (hasheada) | Staff | Superuser |
|----------|-------|---------------------|-------|-----------|
| juan.perez | juan.perez@saipe.com.ar | (hasheada) | ❌ | ❌ |
| ana.garcia | ana.garcia@saipe.com.ar | (hasheada) | ❌ | ❌ |
| luis.rodriguez | luis.rodriguez@saipe.com.ar | (hasheada) | ❌ | ❌ |
| maria.lopez | maria.lopez@saipe.com.ar | (hasheada) | ❌ | ❌ |
| carlos.martinez | carlos.martinez@saipe.com.ar | (hasheada) | ❌ | ❌ |

## 🚀 Pasos para Crear el Excel

### Opción 1: Microsoft Excel / LibreOffice Calc
1. Abre Excel o LibreOffice Calc
2. En la celda A1 escribe: `usuario`
3. En la celda B1 escribe: `contraseña`
4. A partir de la fila 2, ingresa los datos de usuarios
5. Guarda como `credenciales.xlsx` en la raíz del proyecto

### Opción 2: Google Sheets
1. Crea una nueva hoja de cálculo en Google Sheets
2. Copia y pega los datos del template
3. Descarga como: Archivo → Descargar → Microsoft Excel (.xlsx)
4. Renombra a `credenciales.xlsx` si es necesario
5. Coloca en la raíz del proyecto

### Opción 3: Python (Programático)
```python
import openpyxl

# Crear workbook
wb = openpyxl.Workbook()
ws = wb.active

# Encabezados
ws['A1'] = 'usuario'
ws['B1'] = 'contraseña'

# Datos de ejemplo
usuarios = [
    ['juan.perez', 'MiClave123!'],
    ['ana.garcia', 'Password456'],
    ['luis.rodriguez', 'SuperPass789'],
]

for i, (usuario, password) in enumerate(usuarios, start=2):
    ws[f'A{i}'] = usuario
    ws[f'B{i}'] = password

# Guardar
wb.save('credenciales.xlsx')
print("✓ Archivo credenciales.xlsx creado")
```

## 🔍 Validación del Archivo

Antes de hacer deploy, verifica:

- [ ] El archivo se llama exactamente `credenciales.xlsx`
- [ ] Está en la raíz del proyecto
- [ ] La primera fila tiene los encabezados `usuario` y `contraseña`
- [ ] No hay filas vacías entre los datos
- [ ] Los nombres de usuario no tienen espacios
- [ ] Todas las contraseñas están completas

## 🧪 Probar Localmente (Opcional)

```bash
# Ejecutar el script de prueba
python test_carga_usuarios.py
```

Esto te mostrará:
- ✓ Si el archivo existe
- ✓ Cuántos usuarios se crearán
- ✓ Lista de usuarios creados
- ✓ Estadísticas finales

## 📋 Checklist Final

Antes de hacer push a GitHub:

1. ✅ Archivo `credenciales.xlsx` creado con formato correcto
2. ✅ Probado localmente con `test_carga_usuarios.py` (opcional)
3. ✅ Verificado que los usuarios se crean correctamente
4. ✅ Listo para commit y push

Después del deploy en Railway:

5. ✅ Verificar logs de Railway para confirmar creación
6. ✅ Probar login con algún usuario
7. ✅ **ELIMINAR** `credenciales.xlsx` del repositorio
8. ✅ Descomentar línea en `.gitignore`

---

**¿Necesitas ayuda?** Consulta `INSTRUCCIONES_CREDENCIALES.md` para más detalles.

