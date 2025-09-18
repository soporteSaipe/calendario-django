/**
 * Login Form - Validación del formulario de login
 * Maneja la validación y estado de carga del formulario de login
 */

document.addEventListener('DOMContentLoaded', function() {
    const form = document.querySelector('form[method="post"]');
    const usernameInput = document.querySelector('input[name="username"]');
    const passwordInput = document.querySelector('input[name="password"]');
    const submitBtn = document.querySelector('button[type="submit"]');
    
    // Evento click en botón de login
    if (submitBtn) {
        submitBtn.addEventListener('click', function(e) {
            // Validar campos antes de enviar
            if (!usernameInput?.value.trim()) {
                e.preventDefault();
                return false;
            }
            
            if (!passwordInput?.value.trim()) {
                e.preventDefault();
                return false;
            }
            
            // Mostrar estado de carga
            this.disabled = true;
            this.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Iniciando sesión...';
            this.classList.add('btn-loading');
            
            // Enviar formulario
            form.submit();
        });
    }
});
