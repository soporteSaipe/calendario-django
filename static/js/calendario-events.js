/**
 * Módulo de Manejo de Eventos del Calendario
 * Maneja los eventos del calendario, modales y interacciones
 */

// Asegurar que CalendarioApp existe
window.CalendarioApp = window.CalendarioApp || {};

/**
 * Manejar clic en evento
 */
CalendarioApp.handleEventClick = function(info) {
    const event = info.event;
    const modal = new bootstrap.Modal(document.getElementById('reservaModal'));
    
    // Verificar que el modal existe antes de usarlo
    if (!modal) {
        console.error('Modal no encontrado');
        return;
    }
    
    document.getElementById('reservaModalTitle').textContent = event.title || 'Reserva';
    document.getElementById('reservaModalBody').innerHTML = `
        <div class="row">
            <div class="col-6">
                <strong>Inicio:</strong><br>
                ${event.start ? new Date(event.start).toLocaleString('es-ES') : 'No disponible'}
            </div>
            <div class="col-6">
                <strong>Fin:</strong><br>
                ${event.end ? new Date(event.end).toLocaleString('es-ES') : 'No disponible'}
            </div>
        </div>
        <hr>
        <div class="row">
            <div class="col-12">
                <strong>Descripción:</strong><br>
                ${event.extendedProps && event.extendedProps.descripcion ? event.extendedProps.descripcion : 'Sin descripción'}
            </div>
        </div>
        <hr>
        <div class="row">
            <div class="col-6">
                <strong>Usuario:</strong><br>
                ${event.extendedProps && event.extendedProps.usuario ? event.extendedProps.usuario : 'No disponible'}
            </div>
            <div class="col-6">
                <strong>Estado:</strong><br>
                <span class="badge bg-${CalendarioApp.getEstadoColor(event.extendedProps && event.extendedProps.estado ? event.extendedProps.estado : 'desconocido')}">
                    ${event.extendedProps && event.extendedProps.estado ? event.extendedProps.estado : 'Desconocido'}
                </span>
            </div>
        </div>
    `;
    
    modal.show();
};

/**
 * Manejar montaje de evento
 */
CalendarioApp.handleEventDidMount = function(info) {
    // Agregar tooltip con información adicional
    const title = info.event.title || 'Reserva';
    const usuario = info.event.extendedProps && info.event.extendedProps.usuario ? info.event.extendedProps.usuario : 'No disponible';
    const estado = info.event.extendedProps && info.event.extendedProps.estado ? info.event.extendedProps.estado : 'Desconocido';
    
    info.el.setAttribute('title', 
        `${title}\n` +
        `Usuario: ${usuario}\n` +
        `Estado: ${estado}`
    );
    
    // Los eventos mantienen su color neutro por defecto
    // No se aplican colores de sala a los eventos
};

/**
 * Manejar clic en fecha
 */
CalendarioApp.handleDateClick = function(info) {
    // Verificar si es fin de semana
    const clickedDate = new Date(info.dateStr);
    const dayOfWeek = clickedDate.getDay();
    
    // Si es sábado (6) o domingo (0), no permitir clic
    if (dayOfWeek === 0 || dayOfWeek === 6) {
        return false;
    }
    
    // Verificar si el botón de reserva existe (indica que el usuario está autenticado)
    const reservarBtn = document.querySelector('a[href*="crear_reserva"]');
    if (reservarBtn) {
        // Redirigir a crear reserva con fecha preseleccionada
        const fecha = info.dateStr;
        const url = window.crearReservaUrl + '?fecha=' + fecha;
        window.location.href = url;
    }
};

/**
 * Configurar modal de crear reserva
 */
CalendarioApp.setupCrearReservaModal = function() {
    // Generar opciones de hora (07:00 a 15:30, intervalos de 30 min)
    const horaInicioSelect = document.getElementById('id_hora_inicio');
    const horaFinSelect = document.getElementById('id_hora_fin');
    
    if (horaInicioSelect && horaFinSelect) {
        // Limpiar opciones existentes
        horaInicioSelect.innerHTML = '<option value="">Seleccionar hora</option>';
        horaFinSelect.innerHTML = '<option value="">Seleccionar hora</option>';
        
        // Generar horas de 07:00 a 15:30
        for (let hora = 7; hora <= 15; hora++) {
            for (let minuto = 0; minuto < 60; minuto += 30) {
                if (hora === 15 && minuto > 30) break; // Parar en 15:30
                
                const horaStr = hora.toString().padStart(2, '0');
                const minutoStr = minuto.toString().padStart(2, '0');
                const horaCompleta = `${horaStr}:${minutoStr}`;
                
                // Agregar a ambos selects
                const optionInicio = new Option(horaCompleta, horaCompleta);
                const optionFin = new Option(horaCompleta, horaCompleta);
                
                horaInicioSelect.add(optionInicio);
                horaFinSelect.add(optionFin);
            }
        }
        
        // Configurar fecha mínima como hoy
        const fechaInput = document.getElementById('id_fecha');
        if (fechaInput) {
            const today = new Date();
            fechaInput.min = today.toISOString().split('T')[0];
        }
        
        // Configurar validación de horas
        horaInicioSelect.addEventListener('change', function() {
            const horaInicio = this.value;
            const horaFinSelect = document.getElementById('id_hora_fin');
            
            // Limpiar opciones de hora fin
            horaFinSelect.innerHTML = '<option value="">Seleccionar hora</option>';
            
            if (horaInicio) {
                const [hora, minuto] = horaInicio.split(':').map(Number);
                const horaInicioMinutos = hora * 60 + minuto;
                
                // Agregar solo horas posteriores a la hora de inicio
                for (let h = 7; h <= 15; h++) {
                    for (let m = 0; m < 60; m += 30) {
                        if (h === 15 && m > 30) break;
                        
                        const horaActualMinutos = h * 60 + m;
                        if (horaActualMinutos > horaInicioMinutos) {
                            const horaStr = h.toString().padStart(2, '0');
                            const minutoStr = m.toString().padStart(2, '0');
                            const horaCompleta = `${horaStr}:${minutoStr}`;
                            
                            const option = new Option(horaCompleta, horaCompleta);
                            horaFinSelect.add(option);
                        }
                    }
                }
            }
        });
    }
};

/**
 * Obtener color de estado
 */
CalendarioApp.getEstadoColor = function(estado) {
    switch(estado) {
        case 'pendiente': return 'warning';
        case 'confirmada': return 'success';
        case 'cancelada': return 'danger';
        case 'completada': return 'info';
        case 'desconocido': return 'secondary';
        default: return 'secondary';
    }
};
