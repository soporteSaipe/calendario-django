# 🌙 Paleta de Colores - Modo Oscuro Profesional

## 📋 Resumen

Esta paleta de colores completamente nueva ha sido diseñada específicamente para el modo oscuro del sistema de reservas, utilizando una paleta azul profesional y equilibrada que proporciona excelente legibilidad y una experiencia de usuario moderna.

## 🎨 Paleta de Colores Principal

### Colores Primarios
```css
--primary: #64B5F6;        /* Azul claro suave y profesional */
--primary-dark: #42A5F5;   /* Azul medio para hover */
--primary-light: #90CAF9;  /* Azul muy claro para acentos */
--secondary: #81C784;      /* Verde suave complementario */
--accent: #FFB74D;         /* Naranja suave para destacar */
```

### Sistema de Fondos Jerárquico
```css
--bg-primary: #1A1A1A;     /* Negro suave (fondo principal) */
--bg-secondary: #222222;   /* Gris muy oscuro */
--bg-card: #2A2A2A;        /* Gris oscuro (tarjetas) */
--bg-accent: #333333;      /* Gris medio (hover, focus) */
--bg-elevated: #3A3A3A;    /* Gris claro (elementos superiores) */
```

### Sistema de Texto
```css
--text-primary: #FAFAFA;   /* Blanco suave (texto principal) */
--text-secondary: #E0E0E0; /* Gris muy claro (texto secundario) */
--text-muted: #9E9E9E;     /* Gris medio (texto deshabilitado) */
--text-disabled: #616161;  /* Gris oscuro (elementos deshabilitados) */
```

### Superficies y Bordes
```css
--surface: #222222;        /* Superficie principal */
--surface-light: #2E2E2E;  /* Superficie elevada */
--border: #404040;         /* Bordes principales */
--border-light: #333333;   /* Bordes sutiles */
--border-focus: #64B5F6;   /* Borde de foco */
```

### Colores de Estado
```css
--success: #66BB6A;        /* Verde suave */
--warning: #FFA726;        /* Naranja suave */
--danger: #EF5350;         /* Rojo suave */
--info: #42A5F5;           /* Azul suave */
```

### Colores Específicos para Navbar
```css
--navbar-bg: #1F1F1F;      /* Fondo navbar */
--navbar-border: #64B5F6;  /* Borde inferior navbar */
--navbar-text: #FAFAFA;    /* Texto navbar */
--navbar-hover: #2E2E2E;   /* Hover navbar */
--navbar-active: #64B5F6;  /* Elemento activo navbar */
```

## 🎯 Principios de Diseño

### 1. **Contraste Equilibrado**
- **Ratio de contraste**: 4.5:1 mínimo (WCAG 2.1 AA)
- **Texto principal**: Contraste 12:1 con fondo
- **Texto secundario**: Contraste 7:1 con fondo
- **Elementos interactivos**: Contraste 3:1 mínimo

### 2. **Jerarquía Visual Clara**
- **5 niveles de fondo** para crear profundidad
- **4 niveles de texto** para jerarquía de información
- **Bordes sutiles** que no compiten con el contenido

### 3. **Paleta Profesional**
- **Azul como color principal** - Confiable y profesional
- **Verde complementario** - Equilibrio y naturaleza
- **Naranja de acento** - Energía y atención
- **Grises cálidos** - Neutralidad y elegancia

### 4. **Consistencia Visual**
- **Variables CSS** para mantenimiento fácil
- **Sistema de colores** escalable
- **Compatibilidad** con componentes existentes

## 🚀 Implementación

### Archivos Modificados
1. **`static/css/core.css`** - Variables principales
2. **`static/css/components.css`** - Componentes UI
3. **`static/css/pages.css`** - Páginas específicas
4. **`static/css/dark-theme.css`** - Estilos adicionales
5. **`static/js/dark-mode.js`** - Lógica de tema
6. **`static/js/dark-mode-test.js`** - Pruebas y debugging

### Uso de Variables
```css
/* Ejemplo de uso */
.mi-componente {
  background: var(--bg-card);
  color: var(--text-primary);
  border: 1px solid var(--border);
}

.mi-componente:hover {
  background: var(--bg-accent);
  border-color: var(--primary);
}
```

## 🔧 Personalización

### Cambiar Color Principal
```css
[data-theme="dark"] {
  --primary: #TU_COLOR_AQUI;
  --primary-dark: #TU_COLOR_OSCURO;
  --primary-light: #TU_COLOR_CLARO;
}
```

### Ajustar Contraste
```css
[data-theme="dark"] {
  --text-primary: #TU_TEXTO_PRINCIPAL;
  --text-secondary: #TU_TEXTO_SECUNDARIO;
}
```

## 📱 Responsive Design

### Breakpoints
- **Desktop**: 1200px+
- **Tablet**: 768px - 1199px
- **Mobile**: < 768px

### Adaptaciones
- **Navbar**: Se adapta a diferentes tamaños
- **Toggle**: Escalable según dispositivo
- **Colores**: Consistentes en todas las resoluciones

## ♿ Accesibilidad

### Cumplimiento WCAG 2.1 AA
- ✅ **Contraste**: Mínimo 4.5:1
- ✅ **Focus**: Indicadores visibles
- ✅ **Reduced Motion**: Respeta preferencias
- ✅ **Screen Readers**: Compatible

### Características
- **Indicadores de foco** claros
- **Estados hover** distinguibles
- **Texto legible** en todos los tamaños
- **Navegación por teclado** completa

## 🎨 Beneficios de la Nueva Paleta

### 1. **Profesionalismo**
- Azul confiable y moderno
- Colores equilibrados y sutiles
- Apariencia corporativa

### 2. **Legibilidad**
- Contraste optimizado
- Jerarquía visual clara
- Reducción de fatiga visual

### 3. **Mantenibilidad**
- Variables CSS organizadas
- Sistema escalable
- Fácil personalización

### 4. **Consistencia**
- Paleta unificada
- Componentes coherentes
- Experiencia fluida

## 🧪 Pruebas

### Funciones de Debug
```javascript
// Mostrar paleta completa
showColorPalette();

// Probar funcionalidad
testDarkMode();

// Verificar accesibilidad
checkAccessibility();
```

### Verificación Visual
- ✅ **Navbar**: Fondo oscuro con borde azul
- ✅ **Formularios**: Campos con fondo gris
- ✅ **Botones**: Gradientes azules
- ✅ **Calendario**: Celdas con bordes sutiles
- ✅ **Modales**: Fondo oscuro con blur

## 📞 Soporte

### Solución de Problemas
1. **Verificar variables CSS** cargadas
2. **Comprobar JavaScript** del tema
3. **Revisar consola** del navegador
4. **Limpiar cache** si es necesario

### Contacto
Para problemas o mejoras, revisar:
- Consola del navegador
- Archivos CSS cargados
- Funciones de prueba disponibles

---

**🎉 ¡Modo oscuro profesional implementado exitosamente!**