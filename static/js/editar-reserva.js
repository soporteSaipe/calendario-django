/**
 * Editar Reserva - Validación de formulario
 * Maneja la validación en tiempo real del formulario de edición
 */

document.addEventListener('DOMContentLoaded', function() {
    // Validación en tiempo real
    const fechaInicio = document.getElementById('id_fecha_inicio');
    const fechaFin = document.getElementById('id_fecha_fin');
    
    function validarFechas() {
        if (fechaInicio.value && fechaFin.value) {
            const inicio = new Date(fechaInicio.value);
            const fin = new Date(fechaFin.value);
            
            if (fin <= inicio) {
                fechaFin.setCustomValidity('La fecha de fin debe ser posterior a la fecha de inicio');
            } else {
                fechaFin.setCustomValidity('');
            }
        }
    }
    
    if (fechaInicio && fechaFin) {
        fechaInicio.addEventListener('change', validarFechas);
        fechaFin.addEventListener('change', validarFechas);
    }
});
