/**
 * Editar Reserva - Validación de formulario
 * Maneja la validación en tiempo real del formulario de edición
 */

document.addEventListener('DOMContentLoaded', function() {
    // Obtener elementos del formulario
    const fechaInicio = document.getElementById('id_fecha_inicio');
    const fechaFin = document.getElementById('id_fecha_fin');
    const fechaVuelta = document.getElementById('id_fecha_vuelta');
    const recursoSelect = document.getElementById('id_recurso');
    
    // Determinar el tipo de recurso actual
    function getTipoRecurso() {
        if (!recursoSelect) return 'sala';
        const selectedOption = recursoSelect.options[recursoSelect.selectedIndex];
        return selectedOption ? selectedOption.getAttribute('data-tipo') : 'sala';
    }
    
    // Validación de fechas para SALAS
    function validarFechasSalas() {
        if (fechaInicio && fechaFin && fechaInicio.value && fechaFin.value) {
            const inicio = new Date(fechaInicio.value);
            const fin = new Date(fechaFin.value);
            
            if (fin <= inicio) {
                fechaFin.setCustomValidity('La fecha de fin debe ser posterior a la fecha de inicio');
            } else {
                fechaFin.setCustomValidity('');
            }
        }
    }
    
    // Validación de fechas para VEHÍCULOS
    function validarFechasVehiculos() {
        if (fechaInicio && fechaVuelta && fechaInicio.value && fechaVuelta.value) {
            // Extraer solo la fecha de fecha_inicio (puede ser datetime)
            const inicioDate = new Date(fechaInicio.value);
            const vueltaDate = new Date(fechaVuelta.value);
            
            // Convertir a solo fecha para comparar
            inicioDate.setHours(0, 0, 0, 0);
            vueltaDate.setHours(0, 0, 0, 0);
            
            if (vueltaDate < inicioDate) {
                fechaVuelta.setCustomValidity('La fecha de vuelta debe ser posterior o igual a la fecha de salida');
            } else {
                fechaVuelta.setCustomValidity('');
            }
        }
    }
    
    // Aplicar validación según el tipo de recurso
    function aplicarValidacion() {
        const tipoRecurso = getTipoRecurso();
        
        if (tipoRecurso === 'vehiculo') {
            validarFechasVehiculos();
        } else {
            validarFechasSalas();
        }
    }
    
    // Event listeners
    if (fechaInicio) {
        fechaInicio.addEventListener('change', aplicarValidacion);
    }
    
    if (fechaFin) {
        fechaFin.addEventListener('change', aplicarValidacion);
    }
    
    if (fechaVuelta) {
        fechaVuelta.addEventListener('change', aplicarValidacion);
    }
    
    if (recursoSelect) {
        recursoSelect.addEventListener('change', aplicarValidacion);
    }
    
    // Mejorar visualización de datetime-local
    if (fechaInicio && fechaInicio.type === 'datetime-local') {
        // Asegurar que el formato sea correcto
        if (fechaInicio.value && !fechaInicio.value.includes('T')) {
            const fecha = new Date(fechaInicio.value);
            fechaInicio.value = fecha.toISOString().slice(0, 16);
        }
    }
    
    if (fechaFin && fechaFin.type === 'datetime-local') {
        if (fechaFin.value && !fechaFin.value.includes('T')) {
            const fecha = new Date(fechaFin.value);
            fechaFin.value = fecha.toISOString().slice(0, 16);
        }
    }
    
    // Validación inicial
    aplicarValidacion();
});
