# 🚀 Deploy en Render con Supabase

Guía completa para deployar tu aplicación Django en Render (plan gratuito).

## ✅ Por qué Render

- **Plan gratuito generoso:** 750 horas/mes (suficiente para 24/7)
- **No requiere tarjeta:** Gratis sin tarjeta de crédito
- **Deploy automático:** Desde GitHub
- **Compatible con Supabase**
- **Mejor que Railway Free:** No requiere serverless

---

## 📋 Paso 1: Preparar el Proyecto (YA HECHO)

Ya tienes todo listo:
- ✅ `requirements.txt` - Dependencias
- ✅ `settings_production.py` - Configuración de producción
- ✅ `render.yaml` - Configuración de Render
- ✅ Supabase configurado

---

## 🌐 Paso 2: Crear Cuenta en Render

1. **Ve a:** https://render.com
2. **Sign Up** con GitHub
3. **Autoriza** el acceso a tus repositorios

---

## 📦 Paso 3: Crear Web Service

### Desde el Dashboard de Render:

1. **Click en "New +"** (arriba a la derecha)
2. **Selecciona "Web Service"**
3. **Conecta tu repositorio:**
   - Busca: `calendario-reservas` (o el nombre de tu repo)
   - Click en **"Connect"**

---

## ⚙️ Paso 4: Configurar el Servicio

Render detectará automáticamente `render.yaml`, pero verifica:

### Información Básica:
- **Name:** `calendario-saipe`
- **Region:** Oregon (US West) o el más cercano
- **Branch:** `feature/calendario-django` (o la rama que uses)
- **Environment:** Python 3

### Build & Deploy:
- **Build Command:**
  ```bash
  pip install -r requirements.txt && python manage.py collectstatic --no-input && python manage.py migrate
  ```

- **Start Command:**
  ```bash
  gunicorn calendario_reservas.wsgi:application
  ```

### Plan:
- **Instance Type:** Free

---

## 🔐 Paso 5: Configurar Variables de Entorno

En la sección **Environment Variables**, agrega:

```bash
DJANGO_SETTINGS_MODULE=calendario_reservas.settings_production

DATABASE_URL=postgresql://postgres.twpoddtqdxqlayepmtts:QfWo5LMTB1XKB0qW@aws-1-us-east-1.pooler.supabase.com:5432/postgres

SECRET_KEY=tu-clave-secreta-generada-aleatoriamente

DEBUG=False

PYTHON_VERSION=3.11.0
```

**Nota:** Render puede generar `SECRET_KEY` automáticamente.

---

## 🚀 Paso 6: Deploy

1. **Click en "Create Web Service"**
2. **Espera** 5-10 minutos mientras hace el deploy
3. **Verifica los logs** para ver el progreso

---

## ✅ Paso 7: Verificar

Una vez completado el deploy:

1. **Tu URL será:**
   ```
   https://calendario-saipe.onrender.com
   ```

2. **Accede y verifica:**
   - Login funciona
   - Calendario carga
   - Datos de Supabase están disponibles

---

## 🔄 Deploy Automático

Una vez configurado:

1. **Haces push a GitHub:**
   ```bash
   git push origin feature/calendario-django
   ```

2. **Render detecta el cambio** automáticamente

3. **Hace deploy automático** en 5-10 minutos

---

## 📊 Comparación: Railway vs Render

| Característica | Railway Free (2024) | Render Free |
|---------------|---------------------|-------------|
| **Horas/mes** | Serverless only | 750 horas |
| **Tipo** | Serverless requerido | Web Service tradicional |
| **Tarjeta** | No requerida | No requerida |
| **Sleep** | N/A | Después de 15 min inactividad |
| **Wake up** | N/A | ~30 segundos |
| **Deploy automático** | ✅ | ✅ |
| **PostgreSQL incluido** | ✅ Limitado | ❌ (usar Supabase) |

---

## ⚠️ Limitaciones del Plan Free de Render

1. **Sleep después de 15 min de inactividad**
   - La primera petición tarda ~30 seg en despertar
   - Luego funciona normal

2. **750 horas/mes**
   - Suficiente para uso 24/7 con algunos sleeps
   - Más que suficiente para uso laboral

3. **Build time limitado**
   - 90 segundos para build
   - Django normalmente toma 30-60 seg

---

## 🔧 Troubleshooting

### Error: "Build failed"

**Solución:**
1. Verifica `requirements.txt`
2. Verifica que `gunicorn` esté en requirements

### Error: "Application failed to respond"

**Solución:**
1. Verifica `ALLOWED_HOSTS` en settings_production.py
2. Debe incluir `.onrender.com`

### Error: "Database connection failed"

**Solución:**
1. Verifica `DATABASE_URL` en variables de entorno
2. Verifica que sea la URL de Supabase

---

## 🎯 Alternativas si Render No Funciona

### PythonAnywhere
- Plan gratuito limitado pero estable
- Tu app siempre activa
- URL: `tu-usuario.pythonanywhere.com`

### Fly.io
- Plan generoso
- Más técnico de configurar
- Requiere Dockerfile

### Vercel (para Django limitado)
- Solo para aplicaciones muy simples
- No recomendado para Django completo

---

## 📝 Checklist de Deploy en Render

- [ ] Cuenta creada en Render
- [ ] Repositorio conectado
- [ ] Web Service creado
- [ ] Variables de entorno configuradas
- [ ] Build exitoso
- [ ] App funcionando en `*.onrender.com`
- [ ] Login probado
- [ ] Datos de Supabase visibles
- [ ] Deploy automático configurado

---

## 🎉 Ventajas de esta Configuración

- ✅ **App en Render** (gratis, 750h/mes)
- ✅ **Base de datos en Supabase** (gratis, 500MB)
- ✅ **Deploy automático** desde GitHub
- ✅ **Sin costo** si usas plan gratuito
- ✅ **Backup automático** en Supabase
- ✅ **Escalable** a plan pago cuando crezcas

---

## 📞 Recursos

- **Render Docs:** https://render.com/docs
- **Render Django Guide:** https://render.com/docs/deploy-django
- **Supabase Docs:** https://supabase.com/docs

---

**Última actualización:** Octubre 2024
**Autor:** Sistema de Calendario SAIPE

