# Estructura de Archivos CSS

Este directorio contiene los archivos CSS organizados por funcionalidad para facilitar el mantenimiento y debugging.

## Archivos CSS

### 1. `variables.css`
- Variables CSS globales
- Paleta de colores
- Espaciados, sombras, transiciones
- **Cargar primero**

### 2. `base.css`
- Reset CSS
- Estilos base del body
- Tipografía
- Animaciones básicas
- Contenedor principal y footer

### 3. `navbar.css`
- Estilos específicos de la barra de navegación
- Estados activos e hover
- Dropdowns
- **Incluye estilos para navbar activa con máximo contraste**

### 4. `header.css`
- Estilos del header principal del calendario
- Título y párrafo descriptivo
- **Incluye estilos específicos para contraste del título**

### 5. `components.css`
- Componentes reutilizables
- Cards, botones, formularios
- Alertas, modales
- Estadísticas

### 6. `calendar.css`
- Estilos específicos de FullCalendar
- Eventos, celdas, toolbars
- Personalización del calendario

### 7. `responsive.css`
- Media queries
- Diseño responsive
- Adaptaciones para móviles y tablets

### 8. `main.css`
- Archivo principal que importa todos los demás
- Alternativa para cargar todo de una vez

## Orden de Carga

El orden de carga en el HTML es importante:

1. Bootstrap CSS (CDN)
2. FullCalendar CSS (CDN)
3. Font Awesome (CDN)
4. **Nuestros archivos CSS en orden:**
   - variables.css
   - base.css
   - navbar.css
   - header.css
   - components.css
   - calendar.css
   - responsive.css

## Debugging

Si hay problemas de estilos:

1. Verificar que todos los archivos se cargan correctamente
2. Revisar el orden de carga
3. Usar las herramientas de desarrollador del navegador
4. Verificar que no hay estilos inline conflictivos

## Especificidad CSS

Los estilos están organizados con especificidad adecuada:
- `.navbar-modern .navbar-nav .nav-item .nav-link.active` para navbar activa
- `.accounting-header h1` para el título principal
- Sin uso excesivo de `!important`
