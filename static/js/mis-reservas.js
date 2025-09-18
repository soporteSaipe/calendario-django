/**
 * Mis Reservas - Gestión de reservas del usuario
 * Maneja confirmaciones de eliminación, colores dinámicos y accesibilidad
 */

document.addEventListener('DOMContentLoaded', function() {
    // Función mejorada para confirmar eliminación
    const deleteButtons = document.querySelectorAll('a[data-confirm]');
    
    deleteButtons.forEach(button => {
        button.addEventListener('click', function(e) {
            e.preventDefault();
            
            const confirmMessage = this.getAttribute('data-confirm');
            const reservaTitle = this.getAttribute('aria-label').replace('Eliminar reserva: ', '');
            
            // Crear modal de confirmación personalizado
            const confirmModal = CalendarioApp.Accessibility.createConfirmModal(
                'Confirmar eliminación',
                `${confirmMessage}<br><br><strong>Reserva:</strong> ${reservaTitle}`,
                'Eliminar',
                'Cancelar'
            );
            
            confirmModal.then(confirmed => {
                if (confirmed) {
                    // Mostrar indicador de carga
                    CalendarioApp.Loading.show('Eliminando reserva...', {
                        spinner: 'pulse'
                    });
                    
                    // Simular eliminación (en producción esto sería una petición real)
                    setTimeout(() => {
                        CalendarioApp.Loading.hide();
                        CalendarioApp.Notifications.success('Reserva eliminada exitosamente', {
                            title: 'Eliminación exitosa',
                            duration: 3000
                        });
                        setTimeout(() => {
                            window.location.href = this.href;
                        }, 1000);
                    }, 1000);
                }
            });
        });
    });
    
    // Aplicar colores dinámicos a los badges
    const badges = document.querySelectorAll('.badge-modern[data-color]');
    badges.forEach(badge => {
        const color = badge.getAttribute('data-color');
        badge.style.backgroundColor = color;
        badge.style.color = 'white';
    });
    
    // Mejorar accesibilidad de la tabla
    const table = document.querySelector('.table-modern');
    if (table) {
        table.setAttribute('role', 'table');
        table.setAttribute('aria-label', 'Lista de reservas de salas');
    }
    
    // Agregar navegación por teclado a las filas de la tabla
    const tableRows = document.querySelectorAll('.table-modern tbody tr');
    tableRows.forEach((row, index) => {
        row.setAttribute('tabindex', '0');
        row.setAttribute('role', 'row');
        
        row.addEventListener('keydown', function(e) {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                const editButton = this.querySelector('a[href*="editar"]');
                if (editButton) {
                    editButton.click();
                }
            }
        });
    });
});
