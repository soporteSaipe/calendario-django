/**
 * Módulo de Inicialización del Calendario
 * Maneja la configuración inicial y el setup principal
 */

// Variables globales compartidas
window.CalendarioApp = window.CalendarioApp || {};
window.CalendarioApp.calendar = null;
window.CalendarioApp.currentSalaFilter = null;
window.CalendarioApp.salasData = {};

/**
 * Inicialización principal del calendario
 */
document.addEventListener('DOMContentLoaded', function() {
    // Obtener datos de salas desde el DOM
    CalendarioApp.initializeSalasData();
    
    // Establecer sala inicial primero
    CalendarioApp.setInitialSala();
    
    // Verificar que FullCalendar esté disponible
    if (typeof FullCalendar === 'undefined') {
        console.error('FullCalendar no está cargado');
        return;
    }
    
    // Inicializar calendario principal
    CalendarioApp.initializeMainCalendar();
    
    // Configurar event listeners para filtros
    CalendarioApp.setupFilterListeners();
    
    // Configurar modal de crear reserva
    CalendarioApp.setupCrearReservaModal();
    
    // Configurar micro-interacciones
    CalendarioApp.setupMicroInteractions();
    
    // Inicializar sistema de colores dinámicos
    CalendarioApp.initializeColorSystem();
    
    // Actualizar información de sala inicial
    CalendarioApp.updateSalaInfo();
    CalendarioApp.updateMainCalendar();
});

/**
 * Inicializar datos de salas desde el DOM
 */
CalendarioApp.initializeSalasData = function() {
    CalendarioApp.salasData = {};
    const salaOptions = document.querySelectorAll('#salaFilter option');
    
    salaOptions.forEach(function(option) {
        if (option.value) {
            const textContent = option.textContent.trim();
            const match = textContent.match(/capacidad: (\d+)/);
            const capacidad = match ? parseInt(match[1]) : 1;
            
            CalendarioApp.salasData[option.value] = {
                nombre: textContent.split(' (')[0].trim(),
                color: option.getAttribute('data-color') || '#64748B',
                capacidad: capacidad
            };
        }
    });
};

/**
 * Establecer sala inicial
 */
CalendarioApp.setInitialSala = function() {
    const salaSelect = document.getElementById('salaFilter');
    
    if (!salaSelect) {
        console.error('No se encontró el elemento #salaFilter');
        return;
    }
    
    // Verificar si hay un parámetro 'sala' en la URL
    const urlParams = new URLSearchParams(window.location.search);
    const salaFromUrl = urlParams.get('sala');
    
    if (salaFromUrl && salaSelect) {
        // Verificar que la sala existe en las opciones
        const option = salaSelect.querySelector(`option[value="${salaFromUrl}"]`);
        if (option) {
            salaSelect.value = salaFromUrl;
            CalendarioApp.currentSalaFilter = salaFromUrl;
            return;
        }
    }
    
    // Si no hay parámetro de URL o no es válido, usar la primera opción disponible
    if (salaSelect.options.length > 0) {
        const firstOption = salaSelect.options[0];
        if (firstOption.value) {
            salaSelect.value = firstOption.value;
            CalendarioApp.currentSalaFilter = firstOption.value;
        }
    } else {
        console.error('No hay opciones de sala disponibles');
    }
};

/**
 * Inicializar el calendario principal
 */
CalendarioApp.initializeMainCalendar = function() {
    const calendarEl = document.getElementById('calendar');
    
    if (!calendarEl) {
        console.error('No se encontró el elemento #calendar');
        return;
    }
    
    CalendarioApp.calendar = new FullCalendar.Calendar(calendarEl, {
        locale: 'es',
        initialView: 'timeGridWeek',
        lazyFetching: false,
        headerToolbar: {
            left: 'prev,next today',
            center: 'title',
            right: 'timeGridWeek,dayGridMonth,timeGridDay'
        },
        buttonText: {
            today: 'Hoy',
            month: 'Mes',
            week: 'Semana',
            day: 'Día',
            timeGridWeek: 'Semana',
            dayGridMonth: 'Mes',
            timeGridDay: 'Día'
        },
        weekends: true,
        slotMinTime: '07:00:00',
        slotMaxTime: '16:00:00',
        slotDuration: '00:30:00',
        slotLabelInterval: '01:00:00',
        allDaySlot: false,
        events: function(info) {
            // Verificar que tenemos una sala válida seleccionada
            if (!CalendarioApp.currentSalaFilter || CalendarioApp.currentSalaFilter === 'undefined') {
                console.warn('No hay sala seleccionada, usando la primera disponible');
                const salaSelect = document.getElementById('salaFilter');
                if (salaSelect && salaSelect.options.length > 0) {
                    CalendarioApp.currentSalaFilter = salaSelect.options[0].value;
                } else {
                    console.error('No hay salas disponibles');
                    return [];
                }
            }
            
            const url = window.calendarioApiUrl + '?sala=' + CalendarioApp.currentSalaFilter;
            
            return fetch(url)
                .then(response => {
                    if (!response.ok) {
                        throw new Error(`HTTP error! status: ${response.status}`);
                    }
                    return response.json();
                })
                .then(data => {
                    return data;
                })
                .catch(error => {
                    console.error('Error al cargar eventos:', error);
                    return [];
                });
        },
        eventClick: CalendarioApp.handleEventClick,
        eventDidMount: CalendarioApp.handleEventDidMount,
        dateClick: CalendarioApp.handleDateClick,
        eventTimeFormat: {
            hour: '2-digit',
            minute: '2-digit',
            hour12: false
        },
        slotLabelFormat: {
            hour: '2-digit',
            minute: '2-digit',
            hour12: false
        },
        height: 'auto',
        aspectRatio: 1.8
    });
    
    CalendarioApp.calendar.render();
};

/**
 * Obtener URL de eventos
 */
CalendarioApp.getEventsUrl = function() {
    // Verificar que tenemos una sala válida seleccionada
    if (!CalendarioApp.currentSalaFilter || CalendarioApp.currentSalaFilter === 'undefined') {
        const salaSelect = document.getElementById('salaFilter');
        if (salaSelect && salaSelect.options.length > 0) {
            CalendarioApp.currentSalaFilter = salaSelect.options[0].value;
        } else {
            console.error('No hay salas disponibles');
            return window.calendarioApiUrl;
        }
    }
    
    return window.calendarioApiUrl + '?sala=' + CalendarioApp.currentSalaFilter;
};
