# 🚀 Guía Rápida: Carga de Usuarios desde Excel en Railway

## 📋 Pasos a Seguir

### 1️⃣ Crear el Archivo Excel (5 minutos)

**Crea** un archivo llamado `credenciales.xlsx` en la raíz del proyecto con este formato:

| usuario | contraseña |
|---------|------------|
| juan.perez | password123 |
| maria.gomez | pass456 |
| carlos.lopez | clave789 |

> 💡 **Tip**: Los emails se generan automáticamente como `usuario@saipe.com.ar`

📄 **Ver más detalles**: `TEMPLATE_EXCEL.md`

---

### 2️⃣ Probar Localmente (Opcional - 2 minutos)

```bash
python test_carga_usuarios.py
```

Esto te mostrará si el archivo es válido y cuántos usuarios se crearán.

---

### 3️⃣ Subir a GitHub (1 minuto)

```bash
git add credenciales.xlsx
git commit -m "Agregar credenciales para carga inicial de usuarios"
git push
```

---

### 4️⃣ Deploy Automático en Railway (3-5 minutos)

Railway detectará los cambios y ejecutará automáticamente:

1. ✅ Migraciones de base de datos
2. ✅ Collectstatic
3. ✅ **Carga de usuarios desde Excel** ← NUEVO
4. ✅ Creación de superusuario
5. ✅ Inicio del servidor

**Busca en los logs de Railway**:
```
Verificando archivo de credenciales...
Cargando archivo: credenciales.xlsx
Fila 2: Usuario "juan.perez" creado exitosamente
...
✓ Usuarios creados: 3
```

---

### 5️⃣ Verificar y Limpiar (2 minutos)

**a) Verifica que funcione:**
- Intenta hacer login con uno de los usuarios creados
- Verifica en el admin de Django que los usuarios existen

**b) ELIMINA el archivo de credenciales** (IMPORTANTE):
```bash
git rm credenciales.xlsx
git commit -m "Eliminar credenciales después de carga inicial"
git push
```

**c) Activa el .gitignore:**
Edita `.gitignore` y descomenta la línea:
```
credenciales.xlsx  # Descomenta esta línea
```

---

## ✅ Resultado Final

Habrás creado:
- ✓ Usuarios normales (no admin) desde el Excel
- ✓ Emails automáticos: `usuario@saipe.com.ar`
- ✓ Contraseñas hasheadas de forma segura
- ✓ Sin duplicados (verifica antes de crear)

---

## 🆘 Si Algo Sale Mal

### El comando no se ejecuta:
- Verifica que el archivo se llame exactamente `credenciales.xlsx`
- Verifica que esté en la raíz del proyecto
- Revisa los logs de Railway para errores específicos

### "No module named 'openpyxl'":
- La dependencia ya está en `requirements.txt`
- Haz rebuild del proyecto en Railway

### Los usuarios no se crean:
- Verifica que la primera fila del Excel sean los encabezados
- Verifica que no haya filas vacías
- Revisa los logs para ver qué usuarios se saltaron

---

## 📚 Documentación Completa

- **Guía completa**: `INSTRUCCIONES_CREDENCIALES.md`
- **Template Excel**: `TEMPLATE_EXCEL.md`
- **Resumen técnico**: `RESUMEN_IMPLEMENTACION_USUARIOS.md`

---

## ⏱️ Tiempo Total: ~15 minutos

- Crear Excel: 5 min
- Probar local (opcional): 2 min
- Git push: 1 min
- Deploy Railway: 3-5 min
- Verificar y limpiar: 2 min

---

## 🔐 Recordatorios de Seguridad

- ⚠️ **ELIMINA** el archivo Excel del repo después del deploy
- ⚠️ Las contraseñas se almacenan hasheadas (seguro)
- ⚠️ Usa contraseñas temporales y pide a los usuarios que las cambien
- ⚠️ No subas el Excel a repositorios públicos con contraseñas reales

---

**¡Listo!** 🎉 Tus usuarios estarán creados automáticamente en cada deploy.

