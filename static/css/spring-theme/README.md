# Tema Primaveral - Estructura Modular

Este directorio contiene todos los archivos del tema primaveral organizados de manera modular para facilitar el mantenimiento y la comprensión del código.

## Estructura de Archivos

### CSS (static/css/spring-theme/)

- **`spring-theme.css`** - Archivo principal que importa todos los módulos
- **`variables.css`** - Variables CSS del tema (colores, sombras, transiciones)
- **`components.css`** - Estilos para componentes (botones, navbar, headers, etc.)
- **`petals.css`** - Estilos específicos para pétalos flotantes
- **`effects.css`** - Efectos especiales y animaciones

### JavaScript (static/js/spring-theme/)

- **`spring-effects.js`** - Archivo principal que coordina todos los módulos
- **`petals.js`** - Lógica para creación y animación de pétalos
- **`interactions.js`** - Efectos de interacción (hover, clics, micro-interacciones)

## Cómo Usar

### En Templates Django

```html
<!-- CSS del tema primaveral -->
<link rel="stylesheet" href="{% static 'css/spring-theme/spring-theme.css' %}">

<!-- JavaScript del tema primaveral -->
<script src="{% static 'js/spring-theme/petals.js' %}"></script>
<script src="{% static 'js/spring-theme/interactions.js' %}"></script>
<script src="{% static 'js/spring-theme/spring-effects.js' %}"></script>
```

### Modificar el Tema

1. **Colores**: Edita `variables.css` para cambiar la paleta de colores
2. **Componentes**: Modifica `components.css` para ajustar estilos de botones, navbar, etc.
3. **Pétalos**: Edita `petals.css` para cambiar la apariencia de los pétalos
4. **Efectos**: Modifica `effects.css` para agregar o cambiar efectos especiales
5. **Interacciones**: Edita `interactions.js` para cambiar comportamientos de hover/clic
6. **Animaciones**: Modifica `petals.js` para ajustar las animaciones de caída

## Características del Tema

- 🌸 **Pétalos flotantes** con movimiento diagonal realista
- 🎨 **Paleta de colores primaveral** (rosas, lavandas, verdes, amarillos)
- ✨ **Efectos de interacción** suaves y elegantes
- 🌬️ **Animaciones de viento** que simulan corrientes de aire
- 📱 **Responsive** y optimizado para rendimiento

## Mantenimiento

- Cada módulo es independiente y puede modificarse sin afectar otros
- Los archivos están bien documentados con comentarios explicativos
- La estructura modular facilita la colaboración en equipo
- Es fácil agregar nuevos efectos o modificar existentes
