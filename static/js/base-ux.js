/**
 * Base UX - Funcionalidades generales de la aplicación
 * Maneja logout, animaciones y mejoras de UX
 */

// Función mejorada para manejar logout con notificaciones personalizadas
function handleLogout() {
    // Usar el sistema de notificaciones personalizado para confirmación
    CalendarioApp.Notifications.confirm(
        '¿Estás seguro de que quieres cerrar sesión?',
        {
            title: 'Confirmar cierre de sesión',
            icon: 'fas fa-sign-out-alt'
        }
    ).then(function(confirmed) {
        if (confirmed) {
            // Mostrar notificación de procesamiento
            CalendarioApp.Notifications.loading('Cerrando sesión...', {
                title: 'Procesando',
                icon: 'fas fa-spinner fa-spin'
            });
            
            // Crear y enviar formulario de logout
            const form = document.createElement('form');
            form.method = 'post';
            form.action = window.logoutUrl || '/logout/';
            
            const csrfToken = document.createElement('input');
            csrfToken.type = 'hidden';
            csrfToken.name = 'csrfmiddlewaretoken';
            csrfToken.value = document.querySelector('[name=csrfmiddlewaretoken]')?.value || '';
            
            form.appendChild(csrfToken);
            document.body.appendChild(form);
            form.submit();
        }
    });
}

// Controlar animaciones de página
document.addEventListener('DOMContentLoaded', function() {
    // Marcar body como cargado
    document.body.classList.add('loaded');
    
    // Las animaciones se configuran automáticamente en PageAnimations.init()
    // No necesitamos llamar setupSpecificAnimations manualmente
    // Agregar animación de carga al botón de login
    const loginForm = document.querySelector('form[method="post"]');
    if (loginForm) {
        loginForm.addEventListener('submit', function() {
            const submitBtn = this.querySelector('button[type="submit"]');
            if (submitBtn) {
                CalendarioApp.Loading.setButtonLoading(submitBtn, true, 'Iniciando sesión...');
            }
        });
    }
    
    // Auto-ocultar mensajes después de 5 segundos (mejorado)
    const alerts = document.querySelectorAll('.alert-modern');
    alerts.forEach(function(alert) {
        setTimeout(function() {
            if (alert && alert.parentNode) {
                alert.style.transition = 'opacity 0.5s ease-out, transform 0.5s ease-out';
                alert.style.opacity = '0';
                alert.style.transform = 'translateX(100%)';
                setTimeout(function() {
                    if (alert.parentNode) {
                        alert.parentNode.removeChild(alert);
                    }
                }, 500);
            }
        }, 5000);
    });
    
    // Configurar tooltips para elementos con data-tooltip
    document.querySelectorAll('[data-tooltip]').forEach(element => {
        element.setAttribute('title', element.getAttribute('data-tooltip'));
    });
});
