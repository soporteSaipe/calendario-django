/**
 * Sistema de Notificaciones Mejorado
 * Reemplaza los alert() nativos con notificaciones elegantes y accesibles
 */

// Asegurar que CalendarioApp existe
window.CalendarioApp = window.CalendarioApp || {};

CalendarioApp.Notifications = {
    /**
     * Mostrar notificación toast
     */
    show: function(message, type = 'info', duration = 5000, options = {}) {
        const notification = this.createNotification(message, type, options);
        this.displayNotification(notification, duration);
        return notification;
    },

    /**
     * Crear elemento de notificación
     */
    createNotification: function(message, type, options = {}) {
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.setAttribute('role', 'alert');
        notification.setAttribute('aria-live', 'polite');
        
        // Iconos por tipo
        const icons = {
            success: 'fas fa-check-circle',
            error: 'fas fa-exclamation-circle',
            warning: 'fas fa-exclamation-triangle',
            info: 'fas fa-info-circle',
            loading: 'fas fa-spinner fa-spin'
        };
        
        const icon = options.icon || icons[type] || icons.info;
        
        notification.innerHTML = `
            <div class="notification-content">
                <div class="notification-icon">
                    <i class="${icon}" aria-hidden="true"></i>
                </div>
                <div class="notification-message">
                    <div class="notification-title">${options.title || this.getDefaultTitle(type)}</div>
                    <div class="notification-text">${message}</div>
                </div>
                ${options.closable !== false ? `
                    <button class="notification-close" aria-label="Cerrar notificación">
                        <i class="fas fa-times" aria-hidden="true"></i>
                    </button>
                ` : ''}
            </div>
            ${options.progress !== false ? '<div class="notification-progress"></div>' : ''}
        `;
        
        // Configurar evento de cierre
        const closeBtn = notification.querySelector('.notification-close');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => this.hide(notification));
        }
        
        return notification;
    },

    /**
     * Mostrar notificación en pantalla
     */
    displayNotification: function(notification, duration) {
        // Crear contenedor si no existe
        let container = document.getElementById('notifications-container');
        if (!container) {
            container = document.createElement('div');
            container.id = 'notifications-container';
            container.className = 'notifications-container';
            document.body.appendChild(container);
        }
        
        container.appendChild(notification);
        
        // Anunciar a lectores de pantalla
        this.announceToScreenReader(notification.textContent);
        
        // Auto-ocultar si tiene duración
        if (duration > 0) {
            setTimeout(() => this.hide(notification), duration);
        }
        
        // Iniciar barra de progreso
        const progressBar = notification.querySelector('.notification-progress');
        if (progressBar && duration > 0) {
        }
    },

    /**
     * Ocultar notificación
     */
    hide: function(notification) {
        if (!notification || !notification.parentNode) return;
        
        notification.classList.add('notification-hiding');
        
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    },

    /**
     * Obtener título por defecto según tipo
     */
    getDefaultTitle: function(type) {
        const titles = {
            success: 'Éxito',
            error: 'Error',
            warning: 'Advertencia',
            info: 'Información',
            loading: 'Procesando...'
        };
        return titles[type] || 'Notificación';
    },

    /**
     * Anunciar a lectores de pantalla
     */
    announceToScreenReader: function(message) {
        const announcement = document.createElement('div');
        announcement.setAttribute('aria-live', 'polite');
        announcement.setAttribute('aria-atomic', 'true');
        announcement.className = 'sr-only';
        announcement.textContent = message;
        
        document.body.appendChild(announcement);
        
        setTimeout(() => {
            if (announcement.parentNode) {
                document.body.removeChild(announcement);
            }
        }, 1000);
    },

    /**
     * Métodos de conveniencia
     */
    success: function(message, options = {}) {
        return this.show(message, 'success', 4000, options);
    },

    error: function(message, options = {}) {
        return this.show(message, 'error', 6000, options);
    },

    warning: function(message, options = {}) {
        return this.show(message, 'warning', 5000, options);
    },

    info: function(message, options = {}) {
        return this.show(message, 'info', 4000, options);
    },

    loading: function(message, options = {}) {
        return this.show(message, 'loading', 0, { ...options, closable: false });
    },

    /**
     * Confirmación personalizada
     */
    confirm: function(message, options = {}) {
        return new Promise((resolve) => {
            const notification = this.createNotification(message, 'warning', {
                ...options,
                closable: false,
                progress: false
            });
            
            // Agregar botones de acción
            const content = notification.querySelector('.notification-content');
            const actions = document.createElement('div');
            actions.className = 'notification-actions';
            actions.innerHTML = `
                <button class="btn btn-sm btn-secondary notification-btn-cancel">
                    <i class="fas fa-times me-1"></i>Cancelar
                </button>
                <button class="btn btn-sm btn-primary notification-btn-confirm">
                    <i class="fas fa-check me-1"></i>Confirmar
                </button>
            `;
            
            content.appendChild(actions);
            
            // Configurar eventos
            const cancelBtn = notification.querySelector('.notification-btn-cancel');
            const confirmBtn = notification.querySelector('.notification-btn-confirm');
            
            cancelBtn.addEventListener('click', () => {
                this.hide(notification);
                resolve(false);
            });
            
            confirmBtn.addEventListener('click', () => {
                this.hide(notification);
                resolve(true);
            });
            
            this.displayNotification(notification, 0);
        });
    }
};

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', function() {
    console.log('🔔 Sistema de notificaciones inicializado');
});
