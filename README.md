# Calendario de Reservas

Sistema de gestión de reservas con calendario interactivo desarrollado en Django.

## Características

- Calendario interactivo para visualizar reservas
- Gestión de recursos (salas, equipos, etc.)
- Sistema de autenticación de usuarios
- Interfaz moderna y responsive
- API REST para integración

## Tecnologías

- Django 5.2.6
- PostgreSQL
- HTML5/CSS3/JavaScript
- Bootstrap

## Instalación

1. Clona el repositorio
2. Instala las dependencias:
   ```bash
   pip install -r requirements.txt
   ```

3. Configura las variables de entorno:
   ```bash
   cp env.example .env
   # Edita .env con tus configuraciones
   ```

4. Configura PostgreSQL y crea la base de datos

5. Ejecuta las migraciones:
   ```bash
   python manage.py migrate
   ```

6. Crea un superusuario:
   ```bash
   python manage.py createsuperuser
   ```

7. Inicia el servidor:
   ```bash
   python manage.py runserver
   ```

## Deploy

El proyecto está configurado para deploy en:
- Railway
- Render
- Heroku
- Docker

Usa `settings_production.py` para producción con PostgreSQL.

## Estructura del Proyecto

```
calendario_reservas/
├── calendario/           # App principal
├── static/              # Archivos estáticos
├── templates/           # Templates HTML
├── requirements.txt     # Dependencias
└── manage.py           # Script de Django
```