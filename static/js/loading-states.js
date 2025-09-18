/**
 * Sistema de Estados de Carga Mejorado
 * Maneja indicadores de carga globales y por elemento
 */

// Asegurar que CalendarioApp existe
window.CalendarioApp = window.CalendarioApp || {};

CalendarioApp.Loading = {
    /**
     * Mostrar indicador de carga global
     */
    show: function(message = 'Procesando...', options = {}) {
        const overlay = this.createOverlay(message, options);
        document.body.appendChild(overlay);
        
        // Anunciar a lectores de pantalla
        CalendarioApp.Accessibility?.announceToScreenReader(message);
        
        return overlay;
    },

    /**
     * Ocultar indicador de carga global
     */
    hide: function() {
        const overlay = document.getElementById('global-loading-overlay');
        if (overlay) {
            overlay.classList.add('loading-fade-out');
            setTimeout(() => {
                if (overlay.parentNode) {
                    overlay.parentNode.removeChild(overlay);
                }
            }, 300);
        }
    },

    /**
     * Crear overlay de carga
     */
    createOverlay: function(message, options = {}) {
        const overlay = document.createElement('div');
        overlay.id = 'global-loading-overlay';
        overlay.className = 'global-loading-overlay';
        overlay.setAttribute('role', 'dialog');
        overlay.setAttribute('aria-modal', 'true');
        overlay.setAttribute('aria-labelledby', 'loading-message');
        
        const spinner = options.spinner || 'dots'; // dots, bars, pulse, ring
        
        overlay.innerHTML = `
            <div class="loading-content">
                <div class="loading-spinner loading-${spinner}">
                    ${this.getSpinnerHTML(spinner)}
                </div>
                <div class="loading-message" id="loading-message">${message}</div>
                ${options.showProgress ? '<div class="loading-progress"><div class="loading-progress-bar"></div></div>' : ''}
            </div>
        `;
        
        return overlay;
    },

    /**
     * Obtener HTML del spinner según tipo
     */
    getSpinnerHTML: function(type) {
        const spinners = {
            dots: `
                <div class="loading-dot"></div>
                <div class="loading-dot"></div>
                <div class="loading-dot"></div>
            `,
            bars: `
                <div class="loading-bar"></div>
                <div class="loading-bar"></div>
                <div class="loading-bar"></div>
                <div class="loading-bar"></div>
            `,
            pulse: `
                <div class="loading-pulse"></div>
            `,
            ring: `
                <div class="loading-ring"></div>
            `
        };
        
        return spinners[type] || spinners.dots;
    },

    /**
     * Configurar estado de carga en botón
     */
    setButtonLoading: function(button, loading, text = null) {
        
        if (!button) return;
        
        if (loading) {
            // Guardar estado original
            button.setAttribute('data-original-text', button.innerHTML);
            button.setAttribute('data-original-disabled', button.disabled);
            
            // Aplicar estado de carga
            button.disabled = true;
            button.classList.add('btn-loading');
            button.setAttribute('aria-disabled', 'true');
            
            const loadingText = text || 'Procesando...';
            button.innerHTML = `
                <span class="btn-loading-spinner">
                    <i class="fas fa-spinner fa-spin" aria-hidden="true"></i>
                </span>
                <span class="btn-loading-text">${loadingText}</span>
            `;
            
        } else {
            // Restaurar estado original
            const originalText = button.getAttribute('data-original-text');
            const originalDisabled = button.getAttribute('data-original-disabled') === 'true';
            
            if (originalText) {
                button.innerHTML = originalText;
                button.removeAttribute('data-original-text');
            }
            
            button.disabled = originalDisabled;
            button.classList.remove('btn-loading');
            button.removeAttribute('aria-disabled');
            button.removeAttribute('data-original-disabled');
            
        }
    },

    /**
     * Configurar estado de carga en formulario
     */
    setFormLoading: function(form, loading, message = 'Enviando...') {
        const submitBtn = form.querySelector('button[type="submit"]');
        if (submitBtn) {
            this.setButtonLoading(submitBtn, loading, message);
        }
        
        // Deshabilitar todos los campos del formulario
        const inputs = form.querySelectorAll('input, select, textarea, button');
        inputs.forEach(input => {
            if (loading) {
                input.setAttribute('data-original-disabled', input.disabled);
                input.disabled = true;
            } else {
                const originalDisabled = input.getAttribute('data-original-disabled') === 'true';
                input.disabled = originalDisabled;
                input.removeAttribute('data-original-disabled');
            }
        });
    },

    /**
     * Mostrar progreso de carga
     */
    showProgress: function(percentage, message = 'Cargando...') {
        let progressOverlay = document.getElementById('progress-overlay');
        
        if (!progressOverlay) {
            progressOverlay = this.createProgressOverlay(message);
            document.body.appendChild(progressOverlay);
        }
        
        const progressBar = progressOverlay.querySelector('.progress-bar');
        const progressText = progressOverlay.querySelector('.progress-text');
        
        if (progressBar) {
            progressBar.style.width = `${Math.min(100, Math.max(0, percentage))}%`;
        }
        
        if (progressText) {
            progressText.textContent = message;
        }
        
        return progressOverlay;
    },

    /**
     * Crear overlay de progreso
     */
    createProgressOverlay: function(message) {
        const overlay = document.createElement('div');
        overlay.id = 'progress-overlay';
        overlay.className = 'progress-overlay';
        overlay.setAttribute('role', 'dialog');
        overlay.setAttribute('aria-modal', 'true');
        overlay.setAttribute('aria-labelledby', 'progress-message');
        
        overlay.innerHTML = `
            <div class="progress-content">
                <div class="progress-message" id="progress-message">${message}</div>
                <div class="progress-container">
                    <div class="progress-bar"></div>
                </div>
                <div class="progress-percentage">0%</div>
            </div>
        `;
        
        return overlay;
    },

    /**
     * Ocultar progreso
     */
    hideProgress: function() {
        const progressOverlay = document.getElementById('progress-overlay');
        if (progressOverlay) {
            progressOverlay.classList.add('loading-fade-out');
            setTimeout(() => {
                if (progressOverlay.parentNode) {
                    progressOverlay.parentNode.removeChild(progressOverlay);
                }
            }, 300);
        }
    },

    /**
     * Configurar carga automática en enlaces
     */
    setupAutoLoading: function() {
        // Enlaces que requieren carga
        document.addEventListener('click', (e) => {
            const link = e.target.closest('a[data-loading]');
            if (link) {
                e.preventDefault();
                const message = link.getAttribute('data-loading-message') || 'Cargando...';
                this.show(message);
                
                // Simular navegación (en producción sería real)
                setTimeout(() => {
                    this.hide();
                    window.location.href = link.href;
                }, 1000);
            }
        });
        
        // Formularios que requieren carga
        document.addEventListener('submit', (e) => {
            const form = e.target;
            if (form.hasAttribute('data-loading')) {
                const message = form.getAttribute('data-loading-message') || 'Enviando...';
                this.setFormLoading(form, true, message);
            }
        });
    },

    /**
     * Inicializar sistema de carga
     */
    init: function() {
        this.setupAutoLoading();
    }
};

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', function() {
    CalendarioApp.Loading.init();
});
