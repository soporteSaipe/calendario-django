/**
 * Eliminar Reserva - Aplicación de colores dinámicos
 * Maneja la aplicación de colores a los badges de recursos
 */

document.addEventListener('DOMContentLoaded', function() {
    // Aplicar colores dinámicos a los badges
    const badges = document.querySelectorAll('.badge-modern[data-color]');
    badges.forEach(badge => {
        const color = badge.getAttribute('data-color');
        badge.style.backgroundColor = color;
        badge.style.color = 'white';
    });
});
