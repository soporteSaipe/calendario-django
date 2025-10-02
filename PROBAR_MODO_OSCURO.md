# 🌙 Cómo Probar el Modo Oscuro

## 🚀 Instrucciones Rápidas

### 1. **Reinicia tu servidor Django**
```bash
python manage.py runserver
```

### 2. **Abre tu navegador y ve a tu aplicación**
- Ve a la página de login o cualquier página de tu sistema
- Abre la consola del navegador (F12 → Console)

### 3. **Verifica que todo funcione**
En la consola verás mensajes como:
```
🚀 Dark Mode Test Suite iniciado
🎨 PALETA DE COLORES DEL MODO OSCURO:
✅ DarkModeManager cargado correctamente
```

### 4. **Prueba el toggle manual**
- Busca el botón de sol/luna en la navbar (junto al dropdown del usuario)
- Haz clic para cambiar entre modo claro y oscuro
- Deberías ver una transición suave

### 5. **Prueba la detección automática**
- En la consola ejecuta: `window.darkModeManager.resetToSystem()`
- Esto resetea a las preferencias del sistema
- Cambia el tema de tu sistema operativo y verás cómo se adapta automáticamente

## 🧪 Funciones de Prueba Disponibles

En la consola del navegador puedes usar:

```javascript
// Probar funcionalidad básica
testDarkMode()

// Ver la paleta de colores completa
showColorPalette()

// Verificar accesibilidad
checkAccessibility()

// Cambiar tema manualmente
window.darkModeManager.toggleTheme()

// Ver información del tema actual
window.darkModeManager.getThemeInfo()

// Forzar modo claro
window.darkModeManager.setLightMode()

// Forzar modo oscuro
window.darkModeManager.setDarkMode()

// Resetear a preferencias del sistema
window.darkModeManager.resetToSystem()
```

## 🎨 Elementos a Verificar

### ✅ **Navbar**
- Fondo oscuro con borde rosa
- Logo y texto bien contrastados
- Botón toggle visible y funcional

### ✅ **Página de Login**
- Fondo degradado oscuro
- Tarjeta de login con fondo oscuro
- Campos de formulario con bordes rosa
- Botón con gradiente rosa

### ✅ **Calendario**
- Fondo oscuro
- Celdas del calendario con bordes sutiles
- Eventos bien visibles
- Botones de navegación con colores primarios

### ✅ **Formularios**
- Campos de entrada con fondo oscuro
- Bordes rosa en focus
- Placeholders con color apropiado
- Botones con gradientes

### ✅ **Modales**
- Fondo oscuro con blur
- Headers con gradiente rosa
- Contenido bien contrastado

## 🐛 Solución de Problemas

### **Si no ves el toggle:**
```javascript
// Verificar que el DarkModeManager esté cargado
console.log(window.darkModeManager);
```

### **Si los colores no cambian:**
1. Verifica que `dark-theme.css` esté cargado
2. Abre DevTools → Network y busca el archivo
3. Verifica que no haya errores 404

### **Si hay problemas de contraste:**
```javascript
// Verificar variables CSS
const styles = getComputedStyle(document.documentElement);
console.log('Primary:', styles.getPropertyValue('--primary'));
console.log('Background:', styles.getPropertyValue('--bg-primary'));
```

## 📱 Prueba en Diferentes Dispositivos

### **Desktop**
- Verifica que el toggle esté en la navbar
- Prueba con diferentes tamaños de ventana

### **Mobile**
- El toggle debería adaptarse al tamaño
- Verifica que los colores se vean bien en pantalla pequeña

### **Tablet**
- Verifica la responsividad
- Prueba orientación horizontal y vertical

## 🎯 Resultado Esperado

Deberías ver:
- ✅ **Transición suave** entre temas
- ✅ **Colores vibrantes** pero no agresivos
- ✅ **Excelente contraste** en todo el texto
- ✅ **Consistencia visual** con tu marca
- ✅ **Funcionalidad completa** en todos los elementos

## 🔧 Personalización Rápida

Si quieres ajustar algún color, edita estas variables en `static/css/core.css`:

```css
[data-theme="dark"] {
  --primary: #TU_COLOR_AQUI;        /* Color principal */
  --bg-primary: #TU_FONDO_AQUI;     /* Fondo principal */
  --text-primary: #TU_TEXTO_AQUI;   /* Color de texto */
}
```

## 📞 Soporte

Si encuentras algún problema:
1. Revisa la consola del navegador
2. Verifica que todos los archivos CSS estén cargados
3. Prueba en modo incógnito para descartar cache
4. Verifica que no haya conflictos con otros CSS

¡Disfruta tu nuevo modo oscuro! 🌙✨
