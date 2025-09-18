/**
 * Sistema de Notificaciones Mejorado v2.0
 * Notificaciones avanzadas con sonidos, agrupación y mejor UX
 */

// Asegurar que CalendarioApp existe
window.CalendarioApp = window.CalendarioApp || {};

CalendarioApp.Notifications = {
    // Configuración
    config: {
        maxNotifications: 5,
        defaultDuration: 5000,
        enableSounds: true,
        enableVibration: true,
        groupSimilar: true,
        position: 'top-right'
    },

    // Sonidos (usando Web Audio API)
    sounds: {
        success: null,
        error: null,
        warning: null,
        info: null
    },

    // Inicializar sonidos
    initSounds: function() {
        if (!this.config.enableSounds) return;
        
        try {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            
            // Crear sonidos programáticamente
            this.sounds.success = this.createTone(audioContext, 800, 0.1, 'sine');
            this.sounds.error = this.createTone(audioContext, 300, 0.2, 'sawtooth');
            this.sounds.warning = this.createTone(audioContext, 600, 0.15, 'triangle');
            this.sounds.info = this.createTone(audioContext, 500, 0.1, 'sine');
        } catch (e) {
            this.config.enableSounds = false;
        }
    },

    // Crear tono
    createTone: function(audioContext, frequency, duration, type) {
        return function() {
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            
            oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime);
            oscillator.type = type;
            
            gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration);
            
            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + duration);
        };
    },

    // Reproducir sonido
    playSound: function(type) {
        if (!this.config.enableSounds || !this.sounds[type]) return;
        
        try {
            this.sounds[type]();
        } catch (e) {
            // Error silencioso al reproducir sonido
        }
    },

    // Vibrar (si está disponible)
    vibrate: function(pattern = [100, 50, 100]) {
        if (!this.config.enableVibration || !navigator.vibrate) return;
        
        try {
            navigator.vibrate(pattern);
        } catch (e) {
            // Error silencioso con vibración
        }
    },

    /**
     * Mostrar notificación mejorada
     */
    show: function(message, type = 'info', duration = null, options = {}) {
        const finalDuration = duration !== null ? duration : this.config.defaultDuration;
        const notification = this.createNotification(message, type, options);
        
        // Reproducir sonido
        this.playSound(type);
        
        // Vibrar para errores
        if (type === 'error') {
            this.vibrate();
        }
        
        this.displayNotification(notification, finalDuration);
        return notification;
    },

    /**
     * Crear notificación con mejoras
     */
    createNotification: function(message, type, options = {}) {
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.setAttribute('role', 'alert');
        notification.setAttribute('aria-live', 'polite');
        
        // Agregar clase de no leída si es necesario
        if (options.unread) {
            notification.classList.add('notification-unread');
        }
        
        // Iconos mejorados
        const icons = {
            success: 'fas fa-check-circle',
            error: 'fas fa-exclamation-circle',
            warning: 'fas fa-exclamation-triangle',
            info: 'fas fa-info-circle',
            loading: 'fas fa-spinner fa-spin',
            question: 'fas fa-question-circle',
            star: 'fas fa-star'
        };
        
        const icon = options.icon || icons[type] || icons.info;
        
        // Crear contenido HTML mejorado
        notification.innerHTML = `
            <div class="notification-content">
                <div class="notification-icon">
                    <i class="${icon}" aria-hidden="true"></i>
                </div>
                <div class="notification-message">
                    <div class="notification-title">${options.title || this.getDefaultTitle(type)}</div>
                    <div class="notification-text">${message}</div>
                    ${options.subtitle ? `<div class="notification-subtitle">${options.subtitle}</div>` : ''}
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
        
        // Configurar click en la notificación
        if (options.onClick) {
            notification.style.cursor = 'pointer';
            notification.addEventListener('click', options.onClick);
        }
        
        return notification;
    },

    /**
     * Mostrar notificación con mejoras
     */
    displayNotification: function(notification, duration) {
        // Crear contenedor si no existe
        let container = document.getElementById('notifications-container');
        if (!container) {
            container = document.createElement('div');
            container.id = 'notifications-container';
            container.className = `notifications-container notifications-${this.config.position}`;
            document.body.appendChild(container);
        }
        
        // Limitar número de notificaciones
        const existingNotifications = container.querySelectorAll('.notification');
        if (existingNotifications.length >= this.config.maxNotifications) {
            this.hide(existingNotifications[0]);
        }
        
        container.appendChild(notification);
        
        // Anunciar a lectores de pantalla
        this.announceToScreenReader(notification.textContent);
        
        // Auto-ocultar si tiene duración
        if (duration > 0) {
            setTimeout(() => this.hide(notification), duration);
        }
        
        // Configurar barra de progreso
        const progressBar = notification.querySelector('.notification-progress');
        if (progressBar && duration > 0) {
            progressBar.style.setProperty('--duration', `${duration}ms`);
        }
    },

    /**
     * Ocultar notificación con animación
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
     * Ocultar todas las notificaciones
     */
    hideAll: function() {
        const container = document.getElementById('notifications-container');
        if (!container) return;
        
        const notifications = container.querySelectorAll('.notification');
        notifications.forEach(notification => this.hide(notification));
    },

    /**
     * Métodos de conveniencia mejorados
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
     * Confirmación mejorada con más opciones
     */
    confirm: function(message, options = {}) {
        return new Promise((resolve) => {
            const notification = this.createNotification(message, 'warning', {
                ...options,
                closable: false,
                progress: false,
                title: options.title || 'Confirmar acción'
            });
            
            // Agregar botones de acción mejorados
            const content = notification.querySelector('.notification-content');
            const actions = document.createElement('div');
            actions.className = 'notification-actions';
            
            const confirmText = options.confirmText || 'Confirmar';
            const cancelText = options.cancelText || 'Cancelar';
            const confirmIcon = options.confirmIcon || 'fas fa-check';
            const cancelIcon = options.cancelIcon || 'fas fa-times';
            
            actions.innerHTML = `
                <button class="btn btn-sm btn-secondary notification-btn-cancel">
                    <i class="${cancelIcon} me-1"></i>${cancelText}
                </button>
                <button class="btn btn-sm btn-primary notification-btn-confirm">
                    <i class="${confirmIcon} me-1"></i>${confirmText}
                </button>
            `;
            
            content.appendChild(actions);
            
            // Configurar eventos
            const cancelBtn = notification.querySelector('.notification-btn-cancel');
            const confirmBtn = notification.querySelector('.notification-btn-confirm');
            
            const cleanup = () => {
                this.hide(notification);
            };
            
            cancelBtn.addEventListener('click', () => {
                cleanup();
                resolve(false);
            });
            
            confirmBtn.addEventListener('click', () => {
                cleanup();
                resolve(true);
            });
            
            // Cerrar con Escape
            const handleKeydown = (e) => {
                if (e.key === 'Escape') {
                    cleanup();
                    resolve(false);
                    document.removeEventListener('keydown', handleKeydown);
                }
            };
            document.addEventListener('keydown', handleKeydown);
            
            this.displayNotification(notification, 0);
        });
    },

    /**
     * Notificación de progreso
     */
    progress: function(message, options = {}) {
        const notification = this.createNotification(message, 'loading', {
            ...options,
            closable: false,
            progress: false
        });
        
        // Agregar barra de progreso personalizada
        const content = notification.querySelector('.notification-content');
        const progressContainer = document.createElement('div');
        progressContainer.className = 'notification-progress-container';
        progressContainer.innerHTML = `
            <div class="notification-progress-bar">
                <div class="notification-progress-fill" style="width: 0%"></div>
            </div>
            <div class="notification-progress-text">0%</div>
        `;
        content.appendChild(progressContainer);
        
        this.displayNotification(notification, 0);
        
        return {
            update: (percent) => {
                const fill = notification.querySelector('.notification-progress-fill');
                const text = notification.querySelector('.notification-progress-text');
                if (fill) fill.style.width = `${percent}%`;
                if (text) text.textContent = `${Math.round(percent)}%`;
            },
            complete: (message = 'Completado') => {
                notification.querySelector('.notification-text').textContent = message;
                notification.classList.remove('notification-loading');
                notification.classList.add('notification-success');
                notification.querySelector('.notification-icon i').className = 'fas fa-check-circle';
                setTimeout(() => this.hide(notification), 2000);
            },
            error: (message = 'Error') => {
                notification.querySelector('.notification-text').textContent = message;
                notification.classList.remove('notification-loading');
                notification.classList.add('notification-error');
                notification.querySelector('.notification-icon i').className = 'fas fa-exclamation-circle';
                setTimeout(() => this.hide(notification), 4000);
            }
        };
    },

    /**
     * Obtener título por defecto
     */
    getDefaultTitle: function(type) {
        const titles = {
            success: '¡Éxito!',
            error: 'Error',
            warning: 'Advertencia',
            info: 'Información',
            loading: 'Procesando...',
            question: 'Pregunta',
            star: 'Destacado'
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
    }
};

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', function() {
    CalendarioApp.Notifications.initSounds();
});
