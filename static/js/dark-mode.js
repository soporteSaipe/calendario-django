/**
 * DARK MODE JAVASCRIPT
 * Manejo completo del modo oscuro con detección automática y toggle manual
 */

class DarkModeManager {
    constructor() {
        this.themeKey = 'calendario-theme';
        this.themeToggle = null;
        
        this.init();
    }
    
    init() {
        // MODO OSCURO DESHABILITADO TEMPORALMENTE
        // this.createThemeToggle();
        
        // Aplicar tema inicial (solo modo claro)
        this.applyInitialTheme();
        
        // Configurar eventos
        // this.setupEventListeners();
        
        // Detectar cambios en preferencias del sistema
        // this.setupSystemThemeDetection();
        
        console.log('Dark Mode Manager inicializado (modo oscuro deshabilitado)');
    }
    
    createThemeToggle() {
        // Buscar si ya existe un toggle
        this.themeToggle = document.querySelector('.theme-toggle');
        
        if (!this.themeToggle) {
            // Crear el toggle
            this.themeToggle = document.createElement('button');
            this.themeToggle.className = 'theme-toggle';
            this.themeToggle.setAttribute('aria-label', 'Cambiar tema');
            this.themeToggle.setAttribute('title', 'Alternar entre modo claro y oscuro');
            
            // Agregar iconos
            const sunIcon = document.createElement('i');
            sunIcon.className = 'fas fa-sun sun-icon';
            const moonIcon = document.createElement('i');
            moonIcon.className = 'fas fa-moon moon-icon';
            
            this.themeToggle.appendChild(sunIcon);
            this.themeToggle.appendChild(moonIcon);
            
            // Insertar en la navbar de la derecha (junto al dropdown del usuario)
            const navbarRight = document.querySelector('.navbar-nav:last-child');
            if (navbarRight) {
                const li = document.createElement('li');
                li.className = 'nav-item';
                li.appendChild(this.themeToggle);
                navbarRight.appendChild(li);
            }
        }
    }
    
    
    applyInitialTheme() {
        // MODO OSCURO DESHABILITADO - SIEMPRE MODO CLARO
        this.setTheme('light');
    }
    
    setTheme(theme) {
        // MODO OSCURO DESHABILITADO - SIEMPRE MODO CLARO
        if (theme !== 'light') {
            console.log('Modo oscuro deshabilitado - aplicando modo claro');
            theme = 'light';
        }
        
        // Aplicar tema al documento
        document.documentElement.setAttribute('data-theme', theme);
        
        // Agregar clase de transición para suavizar el cambio
        document.body.classList.add('theme-transition');
        
        // Guardar preferencia (siempre modo claro)
        localStorage.setItem(this.themeKey, 'light');
        
        // Actualizar toggle (deshabilitado)
        // this.updateToggle(theme);
        
        // Actualizar meta tag para color del navegador
        this.updateMetaThemeColor(theme);
        
        // Emitir evento personalizado
        window.dispatchEvent(new CustomEvent('themeChanged', {
            detail: { theme: theme }
        }));
        
        // Remover clase de transición después de un tiempo
        setTimeout(() => {
            document.body.classList.remove('theme-transition');
        }, 300);
        
        console.log(`Tema fijado a: ${theme} (modo oscuro deshabilitado)`);
    }
    
  updateMetaThemeColor(theme) {
    let metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (!metaThemeColor) {
      metaThemeColor = document.createElement('meta');
      metaThemeColor.name = 'theme-color';
      document.head.appendChild(metaThemeColor);
    }

    if (theme === 'dark') {
      metaThemeColor.content = '#1A1A1A';
    } else {
      metaThemeColor.content = '#FDF2F8';
    }
  }
    
    updateToggle(theme) {
        if (this.themeToggle) {
            this.themeToggle.setAttribute('data-theme', theme);
            
            // Actualizar aria-label
            const label = theme === 'dark' ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro';
            this.themeToggle.setAttribute('aria-label', label);
            this.themeToggle.setAttribute('title', label);
        }
    }
    
    
    getCurrentTheme() {
        return document.documentElement.getAttribute('data-theme') || 'light';
    }
    
    toggleTheme() {
        // MODO OSCURO DESHABILITADO
        console.log('Toggle de tema deshabilitado - modo oscuro no disponible');
        return;
    }
    
    setupEventListeners() {
        // Toggle click
        if (this.themeToggle) {
            this.themeToggle.addEventListener('click', () => {
                this.toggleTheme();
            });
        }
        
        // Keyboard support
        if (this.themeToggle) {
            this.themeToggle.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    this.toggleTheme();
                }
            });
        }
        
    }
    
    setupSystemThemeDetection() {
        // Detectar cambios en preferencias del sistema
        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        
        mediaQuery.addEventListener('change', (e) => {
            // Solo aplicar si no hay preferencia guardada
            const savedTheme = localStorage.getItem(this.themeKey);
            if (!savedTheme) {
                const newTheme = e.matches ? 'dark' : 'light';
                this.setTheme(newTheme);
                console.log('Tema del sistema cambiado, aplicando:', newTheme);
            }
        });
    }
    
    // Métodos públicos para control externo
    setLightMode() {
        this.setTheme('light');
    }
    
    setDarkMode() {
        // MODO OSCURO DESHABILITADO
        console.log('setDarkMode() deshabilitado - modo oscuro no disponible');
        this.setTheme('light');
    }
    
    resetToSystem() {
        // MODO OSCURO DESHABILITADO - SIEMPRE MODO CLARO
        localStorage.setItem(this.themeKey, 'light');
        this.applyInitialTheme();
        console.log('Tema fijado a modo claro (modo oscuro deshabilitado)');
    }
    
    getThemeInfo() {
        return {
            current: this.getCurrentTheme(),
            saved: localStorage.getItem(this.themeKey),
            systemPrefersDark: window.matchMedia('(prefers-color-scheme: dark)').matches,
            toggle: this.themeToggle ? 'created' : 'not found'
        };
    }
}

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    // Crear instancia global
    window.darkModeManager = new DarkModeManager();
    
    // Hacer disponible globalmente
    window.toggleTheme = () => window.darkModeManager.toggleTheme();
    window.setLightMode = () => window.darkModeManager.setLightMode();
    window.setDarkMode = () => window.darkModeManager.setDarkMode();
    window.resetTheme = () => window.darkModeManager.resetToSystem();
    
    console.log('Dark Mode Manager cargado');
    console.log('Info del tema:', window.darkModeManager.getThemeInfo());
});

// Exportar para uso en módulos
if (typeof module !== 'undefined' && module.exports) {
    module.exports = DarkModeManager;
}
