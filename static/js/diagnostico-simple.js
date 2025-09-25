/**
 * DIAGNÓSTICO SIMPLE
 * Script para identificar problemas básicos
 */

console.log('🔍 DIAGNÓSTICO INICIADO');

// Verificar Bootstrap
console.log('Bootstrap disponible:', typeof bootstrap !== 'undefined');
if (typeof bootstrap !== 'undefined') {
    console.log('Bootstrap Modal:', typeof bootstrap.Modal);
}

// Verificar CalendarioApp
console.log('CalendarioApp disponible:', typeof window.CalendarioApp !== 'undefined');
if (window.CalendarioApp) {
    console.log('CalendarioApp.Notifications:', typeof window.CalendarioApp.Notifications);
    console.log('CalendarioApp.Notifications.confirm:', typeof window.CalendarioApp.Notifications?.confirm);
}

// Verificar handleLogout
console.log('handleLogout disponible:', typeof window.handleLogout !== 'undefined');

// Verificar dropdown del usuario
const userDropdown = document.querySelector('.navbar-nav .dropdown');
console.log('Dropdown del usuario encontrado:', !!userDropdown);

if (userDropdown) {
    const toggle = userDropdown.querySelector('.dropdown-toggle');
    const menu = userDropdown.querySelector('.dropdown-menu');
    console.log('Toggle encontrado:', !!toggle);
    console.log('Menú encontrado:', !!menu);
    
    if (toggle) {
        console.log('data-bs-toggle:', toggle.getAttribute('data-bs-toggle'));
        console.log('aria-expanded:', toggle.getAttribute('aria-expanded'));
    }
}

// Verificar botón de logout
const logoutBtn = document.querySelector('.logout-btn');
console.log('Botón de logout encontrado:', !!logoutBtn);

if (logoutBtn) {
    console.log('onclick del botón:', logoutBtn.getAttribute('onclick'));
}

// Verificar URLs
console.log('logoutUrl:', window.logoutUrl);

// Verificar CSRF token
const csrfToken = document.querySelector('[name=csrfmiddlewaretoken]');
console.log('CSRF token encontrado:', !!csrfToken);
if (csrfToken) {
    console.log('CSRF token valor:', csrfToken.value ? 'SÍ' : 'NO');
}

console.log('🔍 DIAGNÓSTICO COMPLETADO');
