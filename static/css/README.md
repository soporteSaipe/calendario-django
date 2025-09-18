# Estructura de Archivos CSS

Este directorio contiene los archivos CSS organizados por funcionalidad para facilitar el mantenimiento y debugging.

## Archivos CSS

### 1. `spring-theme/spring-theme.css` (Tema Principal)
- Archivo principal que importa todos los módulos del tema primaveral
- Variables CSS globales, componentes y efectos
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

### 4. `header.css` y `header-override.css`
- Estilos del header principal del calendario
- Título y párrafo descriptivo
- **Incluye estilos específicos para contraste del título**

### 5. `calendar.css`
- Estilos específicos de FullCalendar
- Eventos, celdas, toolbars
- Personalización del calendario

### 6. `responsive.css`
- Media queries
- Diseño responsive
- Adaptaciones para móviles y tablets

### 7. `glassmorphism.css`
- Efectos de cristal y transparencias
- Backdrop filters y blur effects

### 8. `animations.css`
- Animaciones avanzadas y efectos visuales
- Keyframes y transiciones complejas
- **Consolidado (eliminado animation-fixes.css duplicado)**

### 9. `notifications.css`
- Estilos para sistema de notificaciones
- Alertas y mensajes del sistema

### 10. `loading-states.css`
- Estados de carga y spinners
- Indicadores de progreso

### 11. `ux-utils.css`
- Utilidades de UX
- Mejoras de accesibilidad

### 12. `login-forms.css`
- Estilos específicos para formularios de login
- Validaciones y estados de error

## Orden de Carga

El orden de carga en el HTML es importante:

1. Bootstrap CSS (CDN)
2. FullCalendar CSS (CDN)
3. Font Awesome (CDN)
4. **Nuestros archivos CSS en orden:**
   - spring-theme/spring-theme.css
   - base.css
   - navbar.css
   - header.css
   - header-override.css
   - calendar.css
   - responsive.css
   - glassmorphism.css
   - animations.css
   - notifications.css
   - loading-states.css
   - ux-utils.css
   - login-forms.css

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
