/**
 * Módulo de Filtros y Manejo de Salas
 * Maneja los filtros de sala y actualización de información
 */

// Asegurar que CalendarioApp existe
window.CalendarioApp = window.CalendarioApp || {};

/**
 * Configurar event listeners para filtros
 */
CalendarioApp.setupFilterListeners = function() {
    // Filtro de sala
    const salaFilter = document.getElementById('salaFilter');
    if (salaFilter) {
        salaFilter.addEventListener('change', function() {
            CalendarioApp.currentSalaFilter = this.value;
            CalendarioApp.updateSalaInfo();
            CalendarioApp.updateMainCalendar();
        });
    }
};

/**
 * Actualizar información de sala
 * CON COLORES DINÁMICOS - Aplica colores distintivos por sala
 */
CalendarioApp.updateSalaInfo = function() {
    if (CalendarioApp.currentSalaFilter && CalendarioApp.salasData[CalendarioApp.currentSalaFilter]) {
        const sala = CalendarioApp.salasData[CalendarioApp.currentSalaFilter];
        
        // Actualizar texto del título
        const salaTitulo = document.getElementById('salaTitulo');
        if (salaTitulo) {
            salaTitulo.textContent = 'Calendario - ' + sala.nombre;
        }
        
        // Actualizar información de capacidad
        const salaInfo = document.getElementById('salaInfo');
        if (salaInfo) {
            salaInfo.textContent = 'Capacidad: ' + sala.capacidad + ' personas';
        }
        
        // Aplicar colores dinámicos al header del calendario
        CalendarioApp.applyHeaderColors(CalendarioApp.currentSalaFilter);
        
        // Aplicar colores dinámicos a elementos adicionales
        CalendarioApp.applyDynamicColors(CalendarioApp.currentSalaFilter);
        
    }
};

/**
 * Actualizar calendario principal
 * CON COLORES DINÁMICOS - Recarga eventos y mantiene colores
 */
CalendarioApp.updateMainCalendar = function() {
    if (CalendarioApp.calendar) {
        // Recargar eventos del calendario
        CalendarioApp.calendar.refetchEvents();
        
        // Los colores dinámicos se mantienen aplicados
    }
};
