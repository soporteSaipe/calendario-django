/**
 * Módulo de Mejoras de Accesibilidad y UX
 * Maneja indicadores de carga, validación de formularios y navegación por teclado
 */

// Asegurar que CalendarioApp existe
window.CalendarioApp = window.CalendarioApp || {};

/**
 * Utilidades de Accesibilidad
 */
CalendarioApp.Accessibility = {
    /**
     * Mostrar indicador de carga global
     */
    showGlobalLoading: function(message = 'Procesando solicitud...') {
        const spinner = document.getElementById('globalLoadingSpinner');
        const overlay = document.getElementById('globalLoadingOverlay');
        
        if (spinner) {
            const messageElement = spinner.querySelector('small');
            if (messageElement) {
                messageElement.textContent = message;
            }
            spinner.style.display = 'block';
            spinner.setAttribute('aria-hidden', 'false');
        }
        
        if (overlay) {
            overlay.style.display = 'flex';
            overlay.setAttribute('aria-hidden', 'false');
        }
        
        // Deshabilitar interacciones
        document.body.style.pointerEvents = 'none';
    },

    /**
     * Ocultar indicador de carga global
     */
    hideGlobalLoading: function() {
        const spinner = document.getElementById('globalLoadingSpinner');
        const overlay = document.getElementById('globalLoadingOverlay');
        
        if (spinner) {
            spinner.style.display = 'none';
            spinner.setAttribute('aria-hidden', 'true');
        }
        
        if (overlay) {
            overlay.style.display = 'none';
            overlay.setAttribute('aria-hidden', 'true');
        }
        
        // Rehabilitar interacciones
        document.body.style.pointerEvents = 'auto';
    },

    /**
     * Mostrar mensaje de validación
     */
    showValidationMessage: function(elementId, message, type = 'error') {
        const element = document.getElementById(elementId);
        if (!element) return;

        const validationDiv = element.querySelector('.validation-message') || 
                             element.parentElement.querySelector('.validation-message');
        
        if (validationDiv) {
            validationDiv.className = `validation-message ${type}`;
            validationDiv.innerHTML = `
                <i class="fas fa-${type === 'error' ? 'exclamation-circle' : 'check-circle'}" aria-hidden="true"></i>
                <span>${message}</span>
            `;
            validationDiv.style.display = 'flex';
            
            // Agregar aria-live para lectores de pantalla
            validationDiv.setAttribute('aria-live', 'polite');
        }
    },

    /**
     * Ocultar mensaje de validación
     */
    hideValidationMessage: function(elementId) {
        const element = document.getElementById(elementId);
        if (!element) return;

        const validationDiv = element.querySelector('.validation-message') || 
                             element.parentElement.querySelector('.validation-message');
        
        if (validationDiv) {
            validationDiv.style.display = 'none';
            validationDiv.removeAttribute('aria-live');
        }
    },

    /**
     * Configurar navegación por teclado mejorada
     */
    setupKeyboardNavigation: function() {
        // Navegación por teclado en modales
        document.addEventListener('keydown', function(e) {
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

        // Navegación por teclado en formularios
        document.addEventListener('keydown', function(e) {
            if (e.key === 'Enter' && e.target.classList.contains('form-control-modern')) {
                const form = e.target.closest('form');
                if (form) {
                    const submitBtn = form.querySelector('button[type="submit"]');
                    if (submitBtn && !submitBtn.disabled) {
                        submitBtn.click();
                    }
                }
            }
        });
    },

    /**
     * Configurar estados de carga en botones
     */
    setupButtonLoadingStates: function() {
        document.addEventListener('click', function(e) {
            const button = e.target.closest('button[type="submit"]');
            if (button && button.form) {
                CalendarioApp.Accessibility.setButtonLoading(button, true);
                
                // Simular carga (en producción esto se manejaría con la respuesta real)
                setTimeout(() => {
                    CalendarioApp.Accessibility.setButtonLoading(button, false);
                }, 2000);
            }
        });
    },

    /**
     * Establecer estado de carga en botón
     */
    setButtonLoading: function(button, loading) {
        if (loading) {
            button.classList.add('loading');
            button.disabled = true;
            button.setAttribute('aria-disabled', 'true');
            
            // Guardar texto original
            const originalText = button.innerHTML;
            button.setAttribute('data-original-text', originalText);
            
            button.innerHTML = '<span class="sr-only">Procesando...</span>';
        } else {
            button.classList.remove('loading');
            button.disabled = false;
            button.removeAttribute('aria-disabled');
            
            // Restaurar texto original
            const originalText = button.getAttribute('data-original-text');
            if (originalText) {
                button.innerHTML = originalText;
                button.removeAttribute('data-original-text');
            }
        }
    },

    /**
     * Configurar validación de formularios en tiempo real
     */
    setupFormValidation: function() {
        // Validación en tiempo real para campos requeridos
        document.querySelectorAll('input[required], select[required], textarea[required]').forEach(field => {
            field.addEventListener('blur', function() {
                CalendarioApp.Accessibility.validateField(this);
            });

            field.addEventListener('input', function() {
                // Limpiar mensaje de error al escribir
                if (this.classList.contains('is-invalid')) {
                    this.classList.remove('is-invalid');
                    CalendarioApp.Accessibility.hideValidationMessage(this.id);
                }
            });
        });

        // Validación de formularios al enviar - EXCLUIR FORMULARIO DE LOGIN
        const forms = document.querySelectorAll('form:not([action*="login"])');
        
        forms.forEach((form, index) => {
            form.addEventListener('submit', function(e) {
                
                // Validación básica - solo verificar campos requeridos
                const requiredFields = this.querySelectorAll('input[required], select[required], textarea[required]');
                
                let isValid = true;
                
                requiredFields.forEach(field => {
                    if (!field.value.trim()) {
                        field.classList.add('is-invalid');
                        isValid = false;
                    } else {
                        field.classList.remove('is-invalid');
                        field.classList.add('is-valid');
                    }
                });
                
                if (!isValid) {
                    e.preventDefault();
                } else {
                }
            });
        });
    },

    /**
     * Validar campo individual
     */
    validateField: function(field) {
        const isValid = field.checkValidity();
        const fieldId = field.id;
        
        if (isValid) {
            field.classList.remove('is-invalid');
            field.classList.add('is-valid');
            CalendarioApp.Accessibility.hideValidationMessage(fieldId);
        } else {
            field.classList.remove('is-valid');
            field.classList.add('is-invalid');
            
            let message = field.validationMessage;
            if (field.validity.valueMissing) {
                message = 'Este campo es obligatorio';
            } else if (field.validity.typeMismatch) {
                message = 'Por favor, ingresa un formato válido';
            }
            
            CalendarioApp.Accessibility.showValidationMessage(fieldId, message, 'error');
        }
        
        return isValid;
    },

    /**
     * Validar formulario completo
     */
    validateForm: function(form) {
        let isValid = true;
        const requiredFields = form.querySelectorAll('input[required], select[required], textarea[required]');
        
        
        requiredFields.forEach(field => {
            if (!CalendarioApp.Accessibility.validateField(field)) {
                isValid = false;
            }
        });

        // Validación personalizada para fechas
        const fechaInicio = form.querySelector('#id_fecha');
        const horaInicio = form.querySelector('#id_hora_inicio');
        const horaFin = form.querySelector('#id_hora_fin');
        
        
        if (fechaInicio && horaInicio && horaFin) {
            if (fechaInicio.value && horaInicio.value && horaFin.value) {
                const fecha = new Date(fechaInicio.value);
                const hoy = new Date();
                hoy.setHours(0, 0, 0, 0);
                
                
                if (fecha < hoy) {
                    CalendarioApp.Accessibility.showValidationMessage('id_fecha', 'La fecha no puede ser anterior a hoy', 'error');
                    fechaInicio.classList.add('is-invalid');
                    isValid = false;
                }
                
                if (horaInicio.value >= horaFin.value) {
                    CalendarioApp.Accessibility.showValidationMessage('id_hora_fin', 'La hora de fin debe ser posterior a la hora de inicio', 'error');
                    horaFin.classList.add('is-invalid');
                    isValid = false;
                }
            } else {
            }
        } else {
        }
        
        return isValid;
    },

    /**
     * Configurar anuncios para lectores de pantalla
     */
    announceToScreenReader: function(message, priority = 'polite') {
        const announcement = document.createElement('div');
        announcement.setAttribute('aria-live', priority);
        announcement.setAttribute('aria-atomic', 'true');
        announcement.className = 'sr-only';
        announcement.textContent = message;
        
        document.body.appendChild(announcement);
        
        // Remover después de un tiempo
        setTimeout(() => {
            document.body.removeChild(announcement);
        }, 1000);
    },

    /**
     * Inicializar todas las mejoras de accesibilidad
     */
    init: function() {
        
        this.setupKeyboardNavigation();
        this.setupButtonLoadingStates();
        this.setupFormValidation();
        
        // Configurar anuncios automáticos para cambios de estado
        this.setupAutoAnnouncements();
        
    },

    /**
     * Configurar anuncios automáticos
     */
    setupAutoAnnouncements: function() {
        // Anunciar cuando se muestre un modal
        document.addEventListener('shown.bs.modal', function(e) {
            const modalTitle = e.target.querySelector('.modal-title');
            if (modalTitle) {
                CalendarioApp.Accessibility.announceToScreenReader(
                    `Modal abierto: ${modalTitle.textContent}`
                );
            }
        });

        // Anunciar cuando se oculte un modal
        document.addEventListener('hidden.bs.modal', function(e) {
            CalendarioApp.Accessibility.announceToScreenReader('Modal cerrado');
        });
    },

    /**
     * Crear modal de confirmación personalizado
     */
    createConfirmModal: function(title, message, confirmText = 'Confirmar', cancelText = 'Cancelar') {
        return new Promise((resolve) => {
            // Crear modal HTML
            const modalHtml = `
                <div class="modal fade" id="confirmModal" tabindex="-1" aria-labelledby="confirmModalLabel" aria-hidden="true">
                    <div class="modal-dialog modal-dialog-centered">
                        <div class="modal-content modal-content-modern">
                            <div class="modal-header modal-header-modern">
                                <h5 class="modal-title modal-title-modern" id="confirmModalLabel">
                                    <i class="fas fa-exclamation-triangle me-2" aria-hidden="true"></i>
                                    ${title}
                                </h5>
                                <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Cerrar"></button>
                            </div>
                            <div class="modal-body">
                                <div class="alert alert-warning-modern">
                                    <i class="fas fa-warning me-2" aria-hidden="true"></i>
                                    ${message}
                                </div>
                            </div>
                            <div class="modal-footer">
                                <button type="button" class="btn-modern btn-secondary-modern" data-bs-dismiss="modal">
                                    <i class="fas fa-times me-1" aria-hidden="true"></i>
                                    ${cancelText}
                                </button>
                                <button type="button" class="btn-modern btn-danger-modern" id="confirmButton">
                                    <i class="fas fa-check me-1" aria-hidden="true"></i>
                                    ${confirmText}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            `;

            // Agregar modal al DOM
            document.body.insertAdjacentHTML('beforeend', modalHtml);
            
            const modal = new bootstrap.Modal(document.getElementById('confirmModal'));
            const confirmButton = document.getElementById('confirmButton');
            const cancelButton = document.querySelector('#confirmModal .btn-secondary-modern');

            // Configurar eventos
            confirmButton.addEventListener('click', function() {
                modal.hide();
                resolve(true);
            });

            cancelButton.addEventListener('click', function() {
                modal.hide();
                resolve(false);
            });

            // Limpiar modal cuando se oculte
            document.getElementById('confirmModal').addEventListener('hidden.bs.modal', function() {
                document.body.removeChild(this);
            });

            // Mostrar modal
            modal.show();
        });
    },

};

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', function() {
    CalendarioApp.Accessibility.init();
});

// También intentar inicializar inmediatamente si el DOM ya está listo
if (document.readyState === 'loading') {
} else {
    CalendarioApp.Accessibility.init();
}
