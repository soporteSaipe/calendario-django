# 🍃 Falling Petals - Sistema de Animación de Hojas y Flores

Un sistema de animación de partículas basado en Canvas para crear efectos visuales de hojas y flores cayendo con viento realista.

## ✨ Características

- **Canvas optimizado** con soporte High-DPI
- **60 FPS** objetivo con `requestAnimationFrame`
- **Reciclado de partículas** para rendimiento óptimo
- **Efectos de viento** con oscilación natural
- **Temas visuales** (primavera, otoño, mixto)
- **Interacción con mouse** opcional
- **Accesibilidad** respeta `prefers-reduced-motion`
- **Responsive** se adapta al tamaño de pantalla
- **Pausa automática** cuando la página no es visible

## 🚀 Uso Básico

### Importación ES6
```javascript
import { createFallingPetals } from './fallingPetals.js';

const effect = createFallingPetals(document, {
  theme: 'mixed',
  density: 0.7,
  interactive: true
});

effect.start();
```

### Uso con Script Tag
```html
<script type="module" src="./fallingPetals.js"></script>
<script>
  // Se auto-inicializa con configuración por defecto
  // O puedes crear tu propia instancia:
  const effect = createFallingPetals(document, {
    theme: 'spring',
    density: 0.5
  });
  effect.start();
</script>
```

## ⚙️ Configuración

### Opciones Disponibles

| Opción | Tipo | Por Defecto | Descripción |
|--------|------|-------------|-------------|
| `density` | `number` | `0.6` | Partículas por 100k px² |
| `maxParticles` | `number` | `160` | Límite máximo de partículas |
| `driftX` | `number` | `18` | Deriva horizontal (px/s) |
| `gravityY` | `number` | `60` | Gravedad vertical (px/s) |
| `windOscillation` | `object` | `{amplitude: 24, frequency: 0.25}` | Configuración del viento |
| `spin` | `object` | `{min: -0.8, max: 0.8}` | Rango de rotación (rad/s) |
| `size` | `object` | `{min: 8, max: 22}` | Rango de tamaño (px) |
| `spawnArea` | `string` | `'top'` | Área de spawn (`'top'` o `'top+edges'`) |
| `theme` | `string` | `'mixed'` | Tema visual (`'autumn'`, `'spring'`, `'mixed'`) |
| `opacity` | `number` | `0.95` | Opacidad general (0-1) |
| `zIndex` | `number` | `0` | Z-index del canvas |
| `interactive` | `boolean` | `false` | Interacción con mouse |

### Ejemplos de Configuración

#### Efecto de Primavera
```javascript
const springEffect = createFallingPetals(document, {
  theme: 'spring',
  density: 0.8,
  driftX: 15,
  gravityY: 50,
  windOscillation: { amplitude: 20, frequency: 0.3 },
  size: { min: 6, max: 18 },
  spin: { min: -0.5, max: 0.5 },
  opacity: 0.9,
  interactive: true
});
```

#### Efecto de Otoño
```javascript
const autumnEffect = createFallingPetals(document, {
  theme: 'autumn',
  density: 0.6,
  driftX: 25,
  gravityY: 70,
  windOscillation: { amplitude: 30, frequency: 0.2 },
  size: { min: 10, max: 25 },
  spin: { min: -1.0, max: 1.0 },
  opacity: 0.85,
  interactive: false
});
```

#### Efecto Mixto con Alta Densidad
```javascript
const denseEffect = createFallingPetals(document, {
  theme: 'mixed',
  density: 1.2,
  maxParticles: 200,
  driftX: 20,
  gravityY: 60,
  windOscillation: { amplitude: 35, frequency: 0.25 },
  size: { min: 5, max: 20 },
  spin: { min: -0.8, max: 0.8 },
  opacity: 0.8,
  interactive: true,
  spawnArea: 'top+edges'
});
```

## 🎨 Temas Visuales

### Primavera (`'spring'`)
- **Colores**: Rosas, blancos, amarillos pastel
- **Formas**: Flores de cerezo, manzana, rosa, tulipán
- **Estilo**: Delicado y suave

### Otoño (`'autumn'`)
- **Colores**: Rojos, dorados, ocres, marrones
- **Formas**: Hojas de arce, roble, olmo, abedul
- **Estilo**: Cálido y nostálgico

### Mixto (`'mixed'`)
- **Colores**: Combinación de primavera y otoño
- **Formas**: Todas las formas disponibles
- **Estilo**: Versátil y dinámico

## 🎮 API

### Métodos Principales

```javascript
const effect = createFallingPetals(document, options);

// Iniciar animación
effect.start();

// Detener animación
effect.stop();

// Actualizar configuración
effect.setOptions({
  theme: 'autumn',
  density: 0.8
});

// Destruir sistema (limpiar recursos)
effect.destroy();
```

### Control Dinámico

```javascript
// Cambiar tema según la hora
const hour = new Date().getHours();
if (hour >= 6 && hour < 12) {
  effect.setOptions({ theme: 'spring' });
} else if (hour >= 12 && hour < 18) {
  effect.setOptions({ theme: 'mixed' });
} else {
  effect.setOptions({ theme: 'autumn' });
}

// Ajustar densidad según el tamaño de pantalla
const updateDensity = () => {
  if (window.innerWidth < 768) {
    effect.setOptions({ density: 0.3, maxParticles: 80 });
  } else if (window.innerWidth < 1200) {
    effect.setOptions({ density: 0.5, maxParticles: 120 });
  } else {
    effect.setOptions({ density: 0.7, maxParticles: 160 });
  }
};

window.addEventListener('resize', updateDensity);
```

## 🔧 Integración con Django

### En tu template base.html

```html
<!-- En el <head> -->
<link rel="stylesheet" href="{% static 'css/falling-leaves.css' %}">

<!-- Antes del </body> -->
<script type="module" src="{% static 'js/fallingPetals.js' %}"></script>
<script>
  // Configuración específica para tu sitio
  document.addEventListener('DOMContentLoaded', () => {
    const effect = createFallingPetals(document, {
      theme: 'mixed',
      density: 0.7,
      driftX: 18,
      gravityY: 60,
      windOscillation: { amplitude: 24, frequency: 0.25 },
      size: { min: 8, max: 22 },
      spin: { min: -0.8, max: 0.8 },
      opacity: 0.95,
      interactive: true,
      zIndex: 0
    });
    
    effect.start();
  });
</script>
```

### Configuración por Página

```javascript
// En calendario.html
const calendarEffect = createFallingPetals(document, {
  theme: 'spring',
  density: 0.8,
  interactive: true
});

// En login.html
const loginEffect = createFallingPetals(document, {
  theme: 'mixed',
  density: 0.3,
  opacity: 0.6,
  interactive: false
});
```

## 🎯 Rendimiento

### Optimizaciones Implementadas

- **Canvas único** con dibujo en batch
- **Reciclado de partículas** sin crear/eliminar objetos
- **Cálculos precomputados** para formas y gradientes
- **Pausa automática** cuando la página no es visible
- **Limpieza de recursos** al destruir el sistema
- **Debounce en resize** para evitar recálculos excesivos

### Recomendaciones

- **Densidad**: 0.3-0.8 para mejor rendimiento
- **Máximo de partículas**: 160-200 en pantallas grandes
- **Interacción**: Deshabilitar en dispositivos móviles
- **Temas**: Usar `'mixed'` para mayor variedad visual

## ♿ Accesibilidad

- **Respeta `prefers-reduced-motion`**: No anima si está activo
- **Canvas con `pointer-events: none`**: No interfiere con la interacción
- **Z-index configurable**: Para controlar la superposición
- **Pausa en background**: Reduce el uso de CPU

## 🐛 Solución de Problemas

### Canvas no se muestra
```javascript
// Verificar soporte de canvas
if (!document.createElement('canvas').getContext) {
  console.warn('Canvas no soportado');
}
```

### Rendimiento bajo
```javascript
// Reducir densidad y partículas
effect.setOptions({
  density: 0.3,
  maxParticles: 80
});
```

### Partículas no aparecen
```javascript
// Verificar que el canvas esté visible
console.log(effect.canvas.offsetWidth, effect.canvas.offsetHeight);

// Verificar preferencias de movimiento
if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
  console.log('Animación deshabilitada por preferencias de usuario');
}
```

## 📝 Licencia

Este código es parte del Sistema de Reservas SAIPE y está disponible para uso interno.

## 🤝 Contribuciones

Para reportar bugs o sugerir mejoras, contacta al equipo de desarrollo.

---

**Versión**: 1.0.0  
**Última actualización**: Diciembre 2024
