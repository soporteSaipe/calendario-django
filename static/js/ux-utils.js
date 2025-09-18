/**
 * Utilidades de UX y Mejoras de Experiencia de Usuario
 * Funciones auxiliares para mejorar la interacción del usuario
 */

// Asegurar que CalendarioApp existe
window.CalendarioApp = window.CalendarioApp || {};

CalendarioApp.UX = {
    /**
     * Configurar tooltips informativos
     */
    setupTooltips: function() {
        // Tooltips para botones de acción
        const actionButtons = document.querySelectorAll('[data-tooltip]');
        actionButtons.forEach(button => {
            const tooltipText = button.getAttribute('data-tooltip');
            button.setAttribute('title', tooltipText);
            button.setAttribute('aria-label', tooltipText);
        });
        
        // Tooltips para campos de formulario
        const formFields = document.querySelectorAll('[data-help]');
        formFields.forEach(field => {
            const helpText = field.getAttribute('data-help');
            const helpElement = document.createElement('small');
            helpElement.className = 'form-text text-muted';
            helpElement.innerHTML = `<i class="fas fa-info-circle me-1"></i>${helpText}`;
            
            const parent = field.parentNode;
            if (parent) {
                parent.appendChild(helpElement);
            }
        });
    },

    /**
     * Configurar validación en tiempo real mejorada
     */
    setupRealTimeValidation: function() {
        const forms = document.querySelectorAll('form[data-validate]');
        
        forms.forEach(form => {
            const fields = form.querySelectorAll('input, select, textarea');
            
            fields.forEach(field => {
                // Validación al perder el foco
                field.addEventListener('blur', () => {
                    this.validateField(field);
                });
                
                // Limpiar errores al escribir
                field.addEventListener('input', () => {
                    this.clearFieldError(field);
                });
            });
        });
    },

    /**
     * Validar campo individual con feedback visual
     */
    validateField: function(field) {
        const isValid = field.checkValidity();
        const fieldContainer = field.closest('.form-group-modern, .mb-3');
        
        if (isValid) {
            this.showFieldSuccess(field, fieldContainer);
        } else {
            this.showFieldError(field, fieldContainer, field.validationMessage);
        }
        
        return isValid;
    },

    /**
     * Mostrar error en campo
     */
    showFieldError: function(field, container, message) {
        // Limpiar estados anteriores
        this.clearFieldStates(field, container);
        
        // Aplicar estado de error
        field.classList.add('is-invalid');
        container?.classList.add('has-error');
        
        // Mostrar mensaje de error
        const errorElement = document.createElement('div');
        errorElement.className = 'field-error-message text-danger small mt-1';
        errorElement.innerHTML = `<i class="fas fa-exclamation-circle me-1"></i>${message}`;
        errorElement.setAttribute('aria-live', 'polite');
        
        if (container) {
            container.appendChild(errorElement);
        }
    },

    /**
     * Mostrar éxito en campo
     */
    showFieldSuccess: function(field, container) {
        // Limpiar estados anteriores
        this.clearFieldStates(field, container);
        
        // Aplicar estado de éxito
        field.classList.add('is-valid');
        container?.classList.add('has-success');
        
        // Mostrar mensaje de éxito
        const successElement = document.createElement('div');
        successElement.className = 'field-success-message text-success small mt-1';
        successElement.innerHTML = `<i class="fas fa-check-circle me-1"></i>Campo válido`;
        successElement.setAttribute('aria-live', 'polite');
        
        if (container) {
            container.appendChild(successElement);
        }
    },

    /**
     * Limpiar estados de campo
     */
    clearFieldStates: function(field, container) {
        field.classList.remove('is-invalid', 'is-valid');
        container?.classList.remove('has-error', 'has-success');
        
        // Remover mensajes existentes
        const existingMessages = container?.querySelectorAll('.field-error-message, .field-success-message');
        existingMessages?.forEach(msg => msg.remove());
    },

    /**
     * Limpiar error de campo
     */
    clearFieldError: function(field) {
        const container = field.closest('.form-group-modern, .mb-3');
        this.clearFieldStates(field, container);
    },

    /**
     * Configurar confirmaciones mejoradas
     */
    setupConfirmations: function() {
        const confirmElements = document.querySelectorAll('[data-confirm]');
        
        confirmElements.forEach(element => {
            element.addEventListener('click', (e) => {
                e.preventDefault();
                
                const message = element.getAttribute('data-confirm');
                const title = element.getAttribute('data-confirm-title') || 'Confirmar acción';
                const confirmText = element.getAttribute('data-confirm-text') || 'Confirmar';
                const cancelText = element.getAttribute('data-cancel-text') || 'Cancelar';
                
                CalendarioApp.Notifications.confirm(message, {
                    title: title,
                    confirmText: confirmText,
                    cancelText: cancelText
                }).then(confirmed => {
                    if (confirmed) {
                        // Ejecutar acción original
                        if (element.tagName === 'A') {
                            window.location.href = element.href;
                        } else if (element.tagName === 'BUTTON' && element.form) {
                            element.form.submit();
                        } else {
                            element.click();
                        }
                    }
                });
            });
        });
    },

    /**
     * Configurar auto-guardado
     */
    setupAutoSave: function() {
        const autoSaveForms = document.querySelectorAll('form[data-autosave]');
        
        autoSaveForms.forEach(form => {
            const interval = parseInt(form.getAttribute('data-autosave-interval')) || 30000; // 30 segundos por defecto
            let saveTimeout;
            
            const fields = form.querySelectorAll('input, select, textarea');
            fields.forEach(field => {
                field.addEventListener('input', () => {
                    clearTimeout(saveTimeout);
                    saveTimeout = setTimeout(() => {
                        this.autoSaveForm(form);
                    }, interval);
                });
            });
        });
    },

    /**
     * Auto-guardar formulario
     */
    autoSaveForm: function(form) {
        const formData = new FormData(form);
        const autoSaveUrl = form.getAttribute('data-autosave-url');
        
        if (!autoSaveUrl) return;
        
        // Mostrar indicador de auto-guardado
        const indicator = this.createAutoSaveIndicator();
        document.body.appendChild(indicator);
        
        fetch(autoSaveUrl, {
            method: 'POST',
            body: formData,
            headers: {
                'X-Requested-With': 'XMLHttpRequest',
                'X-CSRFToken': document.querySelector('[name=csrfmiddlewaretoken]').value
            }
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                this.showAutoSaveSuccess(indicator);
            } else {
                this.showAutoSaveError(indicator, data.error);
            }
        })
        .catch(error => {
            this.showAutoSaveError(indicator, 'Error de conexión');
        });
    },

    /**
     * Crear indicador de auto-guardado
     */
    createAutoSaveIndicator: function() {
        const indicator = document.createElement('div');
        indicator.className = 'autosave-indicator';
        indicator.innerHTML = `
            <i class="fas fa-save me-2"></i>
            <span>Auto-guardando...</span>
        `;
        return indicator;
    },

    /**
     * Mostrar éxito de auto-guardado
     */
    showAutoSaveSuccess: function(indicator) {
        indicator.className = 'autosave-indicator autosave-success';
        indicator.innerHTML = `
            <i class="fas fa-check me-2"></i>
            <span>Auto-guardado exitoso</span>
        `;
        
        setTimeout(() => {
            if (indicator.parentNode) {
                indicator.parentNode.removeChild(indicator);
            }
        }, 2000);
    },

    /**
     * Mostrar error de auto-guardado
     */
    showAutoSaveError: function(indicator, error) {
        indicator.className = 'autosave-indicator autosave-error';
        indicator.innerHTML = `
            <i class="fas fa-exclamation-triangle me-2"></i>
            <span>Error en auto-guardado: ${error}</span>
        `;
        
        setTimeout(() => {
            if (indicator.parentNode) {
                indicator.parentNode.removeChild(indicator);
            }
        }, 4000);
    },

    /**
     * Configurar navegación por teclado mejorada
     */
    setupKeyboardNavigation: function() {
        // Navegación con teclas de flecha en listas
        const lists = document.querySelectorAll('.keyboard-navigable');
        
        lists.forEach(list => {
            const items = list.querySelectorAll('[tabindex="0"]');
            let currentIndex = -1;
            
            list.addEventListener('keydown', (e) => {
                switch(e.key) {
                    case 'ArrowDown':
                        e.preventDefault();
                        currentIndex = Math.min(currentIndex + 1, items.length - 1);
                        items[currentIndex]?.focus();
                        break;
                    case 'ArrowUp':
                        e.preventDefault();
                        currentIndex = Math.max(currentIndex - 1, 0);
                        items[currentIndex]?.focus();
                        break;
                    case 'Home':
                        e.preventDefault();
                        currentIndex = 0;
                        items[currentIndex]?.focus();
                        break;
                    case 'End':
                        e.preventDefault();
                        currentIndex = items.length - 1;
                        items[currentIndex]?.focus();
                        break;
                }
            });
        });
    },

    /**
     * Configurar atajos de teclado
     */
    setupKeyboardShortcuts: function() {
        document.addEventListener('keydown', (e) => {
            // Ctrl/Cmd + S para guardar
            if ((e.ctrlKey || e.metaKey) && e.key === 's') {
                e.preventDefault();
                const form = document.querySelector('form[data-shortcut-save]');
                if (form) {
                    form.submit();
                }
            }
            
            // Escape para cerrar modales
            if (e.key === 'Escape') {
                const openModal = document.querySelector('.modal.show');
                if (openModal) {
                    const modal = bootstrap.Modal.getInstance(openModal);
                    if (modal) {
                        modal.hide();
                    }
                }
            }
        });
    },

    /**
     * Configurar indicadores de progreso
     */
    setupProgressIndicators: function() {
        const progressElements = document.querySelectorAll('[data-progress]');
        
        progressElements.forEach(element => {
            const progress = parseInt(element.getAttribute('data-progress'));
            const progressBar = element.querySelector('.progress-bar');
            
            if (progressBar) {
                progressBar.style.width = `${Math.min(100, Math.max(0, progress))}%`;
                progressBar.setAttribute('aria-valuenow', progress);
            }
        });
    },

    /**
     * Inicializar todas las utilidades de UX
     */
    init: function() {
        
        this.setupTooltips();
        this.setupRealTimeValidation();
        this.setupConfirmations();
        this.setupAutoSave();
        this.setupKeyboardNavigation();
        this.setupKeyboardShortcuts();
        this.setupProgressIndicators();
        
    }
};

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', function() {
    CalendarioApp.UX.init();
});
