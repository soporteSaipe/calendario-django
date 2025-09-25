/**
 * DARK MODE JAVASCRIPT
 * Manejo completo del modo oscuro con detección automática y toggle manual
 */

class DarkModeManager {
    constructor() {
        this.themeKey = 'calendario-theme';
        this.themeToggle = null;
        this.themeIndicator = null;
        
        this.init();
    }
    
    init() {
        // Crear elementos del toggle si no existen
        this.createThemeToggle();
        this.createThemeIndicator();
        
        // Aplicar tema inicial
        this.applyInitialTheme();
        
        // Configurar eventos
        this.setupEventListeners();
        
        // Detectar cambios en preferencias del sistema
        this.setupSystemThemeDetection();
        
        console.log('🌙 Dark Mode Manager inicializado');
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
            
            // Insertar en la navbar
            const navbar = document.querySelector('.navbar-nav');
            if (navbar) {
                const li = document.createElement('li');
                li.className = 'nav-item';
                li.appendChild(this.themeToggle);
                navbar.appendChild(li);
            }
        }
    }
    
    createThemeIndicator() {
        // Crear indicador visual del tema activo
        this.themeIndicator = document.createElement('div');
        this.themeIndicator.className = 'theme-indicator';
        this.themeIndicator.setAttribute('aria-hidden', 'true');
        
        // Agregar al body
        document.body.appendChild(this.themeIndicator);
    }
    
    applyInitialTheme() {
        const savedTheme = localStorage.getItem(this.themeKey);
        const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        
        let theme = 'light'; // Por defecto
        
        if (savedTheme) {
            // Usar preferencia guardada
            theme = savedTheme;
        } else if (systemPrefersDark) {
            // Usar preferencia del sistema
            theme = 'dark';
        }
        
        this.setTheme(theme);
        this.updateIndicator();
    }
    
    setTheme(theme) {
        // Aplicar tema al documento
        document.documentElement.setAttribute('data-theme', theme);
        
        // Guardar preferencia
        localStorage.setItem(this.themeKey, theme);
        
        // Actualizar toggle
        this.updateToggle(theme);
        
        // Emitir evento personalizado
        window.dispatchEvent(new CustomEvent('themeChanged', {
            detail: { theme: theme }
        }));
        
        console.log(`🎨 Tema cambiado a: ${theme}`);
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
    
    updateIndicator() {
        if (this.themeIndicator) {
            const currentTheme = this.getCurrentTheme();
            const icon = currentTheme === 'dark' ? '🌙' : '☀️';
            this.themeIndicator.textContent = icon;
        }
    }
    
    getCurrentTheme() {
        return document.documentElement.getAttribute('data-theme') || 'light';
    }
    
    toggleTheme() {
        const currentTheme = this.getCurrentTheme();
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        this.setTheme(newTheme);
        this.updateIndicator();
        
        // Animación de feedback removida - no más transformaciones
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
        
        // Indicador click para toggle rápido
        if (this.themeIndicator) {
            this.themeIndicator.addEventListener('click', () => {
                this.toggleTheme();
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
                this.updateIndicator();
                console.log('🔄 Tema del sistema cambiado, aplicando:', newTheme);
            }
        });
    }
    
    // Métodos públicos para control externo
    setLightMode() {
        this.setTheme('light');
        this.updateIndicator();
    }
    
    setDarkMode() {
        this.setTheme('dark');
        this.updateIndicator();
    }
    
    resetToSystem() {
        localStorage.removeItem(this.themeKey);
        this.applyInitialTheme();
        console.log('🔄 Tema reseteado a preferencias del sistema');
    }
    
    getThemeInfo() {
        return {
            current: this.getCurrentTheme(),
            saved: localStorage.getItem(this.themeKey),
            systemPrefersDark: window.matchMedia('(prefers-color-scheme: dark)').matches,
            toggle: this.themeToggle ? 'created' : 'not found',
            indicator: this.themeIndicator ? 'created' : 'not found'
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
    
    console.log('🌙 Dark Mode Manager cargado');
    console.log('📊 Info del tema:', window.darkModeManager.getThemeInfo());
});

// Exportar para uso en módulos
if (typeof module !== 'undefined' && module.exports) {
    module.exports = DarkModeManager;
}
