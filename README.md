# 📅 Sistema de Reservas de Salas - Calendario Django

Un sistema completo de gestión de reservas de salas de reunión desarrollado con Django, que incluye un calendario interactivo, autenticación de usuarios y una interfaz moderna con efectos glassmorphism.

## ✨ Características

- 🗓️ **Calendario Interactivo**: Visualización completa de reservas con FullCalendar.js
- 🔐 **Autenticación**: Sistema de login/logout integrado
- 📱 **Responsive**: Diseño adaptable a dispositivos móviles
- 🎨 **UI Moderna**: Interfaz con efectos glassmorphism y animaciones
- ⚡ **Validación en Tiempo Real**: Validación de horarios y conflictos
- 🔄 **AJAX**: Creación de reservas sin recargar la página
- 🎯 **Filtros**: Filtrado por sala y visualización de colores
- 📊 **Gestión Completa**: CRUD completo de reservas

## 🚀 Tecnologías Utilizadas

- **Backend**: Django 5.2.6
- **Frontend**: HTML5, CSS3, JavaScript (ES6+)
- **Base de Datos**: SQLite (desarrollo) / PostgreSQL (producción)
- **Cache**: Redis
- **Servidor**: Gunicorn
- **Estilos**: Bootstrap 5 + CSS personalizado
- **Calendario**: FullCalendar.js
- **Iconos**: Font Awesome

## 📋 Requisitos del Sistema

- Python 3.8+
- pip o uv
- PostgreSQL (para producción)
- Redis (opcional, para cache)

## 🛠️ Instalación Local

### 1. Clonar el repositorio
```bash
git clone https://github.com/tu-usuario/calendario-reservas.git
cd calendario-reservas
```

### 2. Crear entorno virtual
```bash
# Con venv
python -m venv venv
source venv/bin/activate  # En Windows: venv\Scripts\activate

# O con uv (recomendado)
uv venv
uv pip install -r requirements.txt
```

### 3. Instalar dependencias
```bash
pip install -r requirements.txt
```

### 4. Configurar variables de entorno
```bash
# Copiar archivo de ejemplo
cp env.example .env

# Editar .env con tus configuraciones
nano .env
```

### 5. Configurar base de datos
```bash
# Aplicar migraciones
python manage.py migrate

# Crear superusuario
python manage.py createsuperuser

# Cargar datos de ejemplo (opcional)
python manage.py shell < populate_data.py
```

### 6. Ejecutar servidor de desarrollo
```bash
python manage.py runserver
```

Visita `http://127.0.0.1:8000` para ver la aplicación.

## 🌐 Variables de Entorno

Crea un archivo `.env` en la raíz del proyecto con las siguientes variables:

```env
# Django
SECRET_KEY=tu-clave-secreta-muy-segura
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1

# Base de datos (desarrollo)
DB_NAME=calendario_db
DB_USER=postgres
DB_PASSWORD=tu-password
DB_HOST=localhost
DB_PORT=5432

# Cache Redis (opcional)
REDIS_URL=redis://127.0.0.1:6379/1

# Email (opcional)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_HOST_USER=tu-email@gmail.com
EMAIL_HOST_PASSWORD=tu-app-password
DEFAULT_FROM_EMAIL=noreply@tu-dominio.com
```

## 🚀 Deploy en Producción

### Opción 1: Railway (Recomendado)

1. **Conectar repositorio**:
   - Ve a [Railway.app](https://railway.app)
   - Conecta tu cuenta de GitHub
   - Selecciona este repositorio

2. **Configurar variables de entorno**:
   ```env
   SECRET_KEY=tu-clave-secreta-muy-segura
   DEBUG=False
   ALLOWED_HOSTS=tu-app.railway.app
   DB_NAME=railway
   DB_USER=postgres
   DB_PASSWORD=generado-automaticamente
   DB_HOST=containers-us-west-xxx.railway.app
   DB_PORT=5432
   ```

3. **Railway detectará automáticamente**:
   - Python
   - requirements.txt
   - Comandos de migración

### Opción 2: Render

1. **Crear nuevo servicio**:
   - Ve a [Render.com](https://render.com)
   - Conecta tu cuenta de GitHub
   - Selecciona "New Web Service"

2. **Configuración**:
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `gunicorn calendario_reservas.wsgi:application`
   - **Python Version**: 3.11

3. **Variables de entorno**:
   ```env
   SECRET_KEY=tu-clave-secreta
   DEBUG=False
   ALLOWED_HOSTS=tu-app.onrender.com
   ```

### Opción 3: Heroku

1. **Instalar Heroku CLI** y crear aplicación:
   ```bash
   heroku create tu-app-nombre
   heroku addons:create heroku-postgresql:hobby-dev
   heroku addons:create heroku-redis:hobby-dev
   ```

2. **Configurar variables**:
   ```bash
   heroku config:set SECRET_KEY=tu-clave-secreta
   heroku config:set DEBUG=False
   heroku config:set ALLOWED_HOSTS=tu-app.herokuapp.com
   ```

3. **Deploy**:
   ```bash
   git push heroku main
   heroku run python manage.py migrate
   heroku run python manage.py createsuperuser
   ```

### Opción 4: DigitalOcean App Platform

1. **Crear aplicación**:
   - Ve a [DigitalOcean App Platform](https://cloud.digitalocean.com/apps)
   - Conecta tu repositorio de GitHub

2. **Configuración automática**:
   - Detecta Django automáticamente
   - Configura PostgreSQL y Redis

3. **Variables de entorno**:
   ```env
   SECRET_KEY=tu-clave-secreta
   DEBUG=False
   ALLOWED_HOSTS=tu-app.ondigitalocean.app
   ```

## 📁 Estructura del Proyecto

```
calendario-reservas/
├── calendario/                 # App principal
│   ├── migrations/            # Migraciones de BD
│   ├── templates/             # Templates HTML
│   ├── static/js/            # JavaScript del calendario
│   ├── models.py             # Modelos de datos
│   ├── views.py              # Vistas y lógica
│   ├── forms.py              # Formularios
│   └── urls.py               # URLs de la app
├── calendario_reservas/       # Configuración del proyecto
│   ├── settings.py           # Configuración desarrollo
│   ├── settings_production.py # Configuración producción
│   ├── urls.py               # URLs principales
│   └── wsgi.py               # WSGI para deploy
├── static/                   # Archivos estáticos
│   ├── css/                  # Estilos CSS
│   └── js/                   # JavaScript general
├── requirements.txt          # Dependencias Python
├── .env.example             # Ejemplo variables entorno
├── .gitignore              # Archivos ignorados por Git
└── README.md               # Este archivo
```

## 🎨 Características de la UI

- **Glassmorphism**: Efectos de vidrio modernos
- **Animaciones**: Transiciones suaves y efectos hover
- **Responsive**: Adaptable a móviles y tablets
- **Tema Spring**: Colores vibrantes y modernos
- **Accesibilidad**: Navegación por teclado y lectores de pantalla

## 🔧 Comandos Útiles

```bash
# Crear migraciones
python manage.py makemigrations

# Aplicar migraciones
python manage.py migrate

# Crear superusuario
python manage.py createsuperuser

# Recopilar archivos estáticos
python manage.py collectstatic

# Ejecutar tests
python manage.py test

# Shell interactivo
python manage.py shell
```

## 🐛 Solución de Problemas

### Error de migraciones
```bash
python manage.py migrate --run-syncdb
```

### Problemas con archivos estáticos
```bash
python manage.py collectstatic --clear
```

### Error de permisos en Linux/Mac
```bash
chmod +x manage.py
```

## 📝 Licencia

Este proyecto está bajo la Licencia MIT. Ver el archivo `LICENSE` para más detalles.

## 🤝 Contribuciones

Las contribuciones son bienvenidas. Por favor:

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📞 Soporte

Si tienes problemas o preguntas:

- Abre un [issue](https://github.com/tu-usuario/calendario-reservas/issues)
- Revisa la [documentación](https://docs.djangoproject.com/)
- Consulta los [foros de Django](https://forum.djangoproject.com/)

---

⭐ ¡Si te gusta este proyecto, no olvides darle una estrella en GitHub!
