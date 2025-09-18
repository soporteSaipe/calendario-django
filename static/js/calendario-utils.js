/**
 * Módulo de Utilidades y Micro-interacciones
 * Maneja efectos visuales y utilidades generales
 */

// Asegurar que CalendarioApp existe
window.CalendarioApp = window.CalendarioApp || {};

/**
 * Configurar micro-interacciones
 */
CalendarioApp.setupMicroInteractions = function() {
    // Efecto de ripple deshabilitado para mejor rendimiento
    // Los botones mantienen solo las animaciones CSS suaves
    
    // Efecto de hover en tarjetas - suavizado
    document.querySelectorAll('.card-modern').forEach(card => {
        card.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-2px)';
        });
        
        card.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0)';
        });
    });
    
    // Efecto de typing en inputs
    document.querySelectorAll('input, textarea, select').forEach(input => {
        input.addEventListener('focus', function() {
            this.parentElement.classList.add('focused');
        });
        
        input.addEventListener('blur', function() {
            this.parentElement.classList.remove('focused');
        });
    });
    
    // Animación de carga en formularios
    document.querySelectorAll('form').forEach(form => {
        form.addEventListener('submit', function() {
            const submitBtn = this.querySelector('button[type="submit"]');
            if (submitBtn) {
                submitBtn.innerHTML = '<span class="spinner"></span> Procesando...';
                submitBtn.disabled = true;
            }
        });
    });
    
};

// Función de ripple eliminada para mejor rendimiento
// Los botones usan solo animaciones CSS suaves
