/**
 * Mis Reservas - Gestión de reservas del usuario
 * Maneja confirmaciones de eliminación, colores dinámicos, accesibilidad y edición modal
 */

// Variables globales para el modal de edición
let modalEditarReserva = null;
let formEditarReserva = null;

document.addEventListener('DOMContentLoaded', function() {
    // Inicializar modal de edición
    initializeEditModal();
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
    
    // Configurar botones de edición
    setupEditButtons();
    
    // Agregar navegación por teclado a las filas de la tabla
    const tableRows = document.querySelectorAll('.table-modern tbody tr');
    tableRows.forEach((row, index) => {
        row.setAttribute('tabindex', '0');
        row.setAttribute('role', 'row');
        
        row.addEventListener('keydown', function(e) {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                const editButton = this.querySelector('.edit-reserva-btn');
                if (editButton) {
                    editButton.click();
                }
            }
        });
    });
});

/**
 * Configurar botones de edición
 */
function setupEditButtons() {
    const editButtons = document.querySelectorAll('.edit-reserva-btn');
    editButtons.forEach(button => {
        button.addEventListener('click', function() {
            const reservaId = this.getAttribute('data-reserva-id');
            const titulo = this.getAttribute('data-titulo');
            const recursoId = this.getAttribute('data-recurso-id');
            const fecha = this.getAttribute('data-fecha');
            const horaInicio = this.getAttribute('data-hora-inicio');
            const horaFin = this.getAttribute('data-hora-fin');
            const descripcion = this.getAttribute('data-descripcion');
            
            abrirModalEdicion(reservaId, titulo, recursoId, fecha, horaInicio, horaFin, descripcion);
        });
    });
}

/**
 * Inicializar el modal de edición
 */
function initializeEditModal() {
    modalEditarReserva = new bootstrap.Modal(document.getElementById('modalEditarReserva'));
    formEditarReserva = document.getElementById('formEditarReserva');
    
    // Configurar event listeners
    setupEditModalListeners();
    
    // Configurar generación de horarios
    setupTimeGeneration();
}

/**
 * Configurar event listeners del modal de edición
 */
function setupEditModalListeners() {
    // Botón de guardar cambios
    document.getElementById('btnEditarReserva').addEventListener('click', function() {
        guardarCambiosReserva();
    });
    
    // Cambio de sala - regenerar horarios
    document.getElementById('editRecurso').addEventListener('change', function() {
        const recursoId = this.value;
        generarHorarios('editHoraInicio', 'editHoraFin', recursoId);
        
        // Limpiar horarios seleccionados al cambiar sala
        document.getElementById('editHoraInicio').value = '';
        document.getElementById('editHoraFin').value = '';
    });
    
    // Cambio de fecha - validar horarios
    document.getElementById('editFecha').addEventListener('change', function() {
        validarHorariosEdicion();
    });
    
    // Cambio de hora inicio - validar hora fin
    document.getElementById('editHoraInicio').addEventListener('change', function() {
        validarHoraFinEdicion();
    });
}

/**
 * Abrir modal de edición con datos de la reserva
 */
function abrirModalEdicion(reservaId, titulo, recursoId, fecha, horaInicio, horaFin, descripcion) {
    // Cargar salas disponibles en el select
    cargarSalasDisponibles();
    
    // Llenar formulario con datos existentes
    document.getElementById('reservaId').value = reservaId;
    document.getElementById('editTitulo').value = titulo;
    document.getElementById('editRecurso').value = recursoId;
    document.getElementById('editFecha').value = fecha;
    document.getElementById('editDescripcion').value = descripcion || '';
    
    // Generar horarios para la sala seleccionada
    generarHorarios('editHoraInicio', 'editHoraFin', recursoId);
    
    // Establecer horarios después de que se generen las opciones
    setTimeout(() => {
        document.getElementById('editHoraInicio').value = horaInicio;
        document.getElementById('editHoraFin').value = horaFin;
        validarHoraFinEdicion();
    }, 200);
    
    // Mostrar modal
    modalEditarReserva.show();
}

/**
 * Cargar salas disponibles en el select
 */
function cargarSalasDisponibles() {
    const selectRecurso = document.getElementById('editRecurso');
    
    // Limpiar opciones existentes
    selectRecurso.innerHTML = '<option value="">Selecciona una sala</option>';
    
    // Cargar salas desde window.salasDisponibles
    if (window.salasDisponibles && window.salasDisponibles.length > 0) {
        window.salasDisponibles.forEach(sala => {
            const option = document.createElement('option');
            option.value = sala.id;
            option.textContent = sala.nombre;
            selectRecurso.appendChild(option);
        });
    }
}

/**
 * Guardar cambios de la reserva
 */
function guardarCambiosReserva() {
    if (!validarFormularioEdicion()) {
        return;
    }
    
    // Mostrar indicador de carga
    if (window.CalendarioApp && window.CalendarioApp.Loading) {
        CalendarioApp.Loading.show('Guardando cambios...', {
            spinner: 'pulse'
        });
    }
    
    // Preparar datos del formulario
    const formData = new FormData(formEditarReserva);
    const reservaId = formData.get('reserva_id');
    
    // Configurar URL de edición usando la URL de Django
    const editUrl = `/calendario/editar/${reservaId}/`;
    formEditarReserva.action = editUrl;
    
    console.log('Enviando datos a URL:', editUrl);
    console.log('Datos del formulario:', Object.fromEntries(formData));
    
    // Enviar formulario
    fetch(editUrl, {
        method: 'POST',
        body: formData,
        headers: {
            'X-CSRFToken': formData.get('csrfmiddlewaretoken'),
            'X-Requested-With': 'XMLHttpRequest'
        }
    })
    .then(response => {
        console.log('Respuesta del servidor:', response.status, response.statusText);
        if (response.ok) {
            return response.json();
        }
        throw new Error(`Error al guardar cambios: ${response.status} ${response.statusText}`);
    })
    .then(data => {
        console.log('Datos recibidos del servidor:', data);
        
        if (window.CalendarioApp && window.CalendarioApp.Loading) {
            CalendarioApp.Loading.hide();
        }
        
        if (data.success) {
            if (window.CalendarioApp && window.CalendarioApp.Notifications) {
                CalendarioApp.Notifications.success(data.message || 'Reserva actualizada exitosamente', {
                    title: 'Cambios guardados',
                    duration: 3000
                });
            }
            
            // Cerrar modal y recargar página
            modalEditarReserva.hide();
            setTimeout(() => {
                window.location.reload();
            }, 1000);
        } else {
            throw new Error(data.message || 'Error desconocido');
        }
    })
    .catch(error => {
        if (window.CalendarioApp && window.CalendarioApp.Loading) {
            CalendarioApp.Loading.hide();
        }
        
        if (window.CalendarioApp && window.CalendarioApp.Notifications) {
            CalendarioApp.Notifications.error('Error al guardar cambios: ' + error.message, {
                title: 'Error',
                duration: 5000
            });
        }
        
        console.error('Error al guardar reserva:', error);
    });
}

/**
 * Validar formulario de edición
 */
function validarFormularioEdicion() {
    const titulo = document.getElementById('editTitulo').value.trim();
    const recurso = document.getElementById('editRecurso').value;
    const fecha = document.getElementById('editFecha').value;
    const horaInicio = document.getElementById('editHoraInicio').value;
    const horaFin = document.getElementById('editHoraFin').value;
    
    if (!titulo) {
        mostrarError('El título es obligatorio');
        return false;
    }
    
    if (!recurso) {
        mostrarError('Debe seleccionar una sala');
        return false;
    }
    
    if (!fecha) {
        mostrarError('La fecha es obligatoria');
        return false;
    }
    
    if (!horaInicio) {
        mostrarError('La hora de inicio es obligatoria');
        return false;
    }
    
    if (!horaFin) {
        mostrarError('La hora de fin es obligatoria');
        return false;
    }
    
    if (horaInicio >= horaFin) {
        mostrarError('La hora de fin debe ser posterior a la hora de inicio');
        return false;
    }
    
    return true;
}

/**
 * Mostrar error en el modal
 */
function mostrarError(mensaje) {
    if (window.CalendarioApp && window.CalendarioApp.Notifications) {
        CalendarioApp.Notifications.error(mensaje, {
            title: 'Error de validación',
            duration: 4000
        });
    } else {
        alert('Error: ' + mensaje);
    }
}

/**
 * Configurar generación de horarios
 */
function setupTimeGeneration() {
    // Generar horarios iniciales
    generarHorarios('editHoraInicio', 'editHoraFin');
}

/**
 * Generar opciones de horarios con restricciones
 */
function generarHorarios(selectInicioId, selectFinId, recursoId = null) {
    const selectInicio = document.getElementById(selectInicioId);
    const selectFin = document.getElementById(selectFinId);
    
    // Limpiar opciones existentes
    selectInicio.innerHTML = '<option value="">Seleccionar hora</option>';
    selectFin.innerHTML = '<option value="">Seleccionar hora</option>';
    
    // Determinar si es comedor
    let esComedor = false;
    if (recursoId && window.salasDisponibles) {
        const sala = window.salasDisponibles.find(s => s.id == recursoId);
        esComedor = sala ? sala.esComedor : false;
    }
    
    // Horarios de inicio: 7:30-15:30 (excepto comedor que puede ser 7:00-15:30)
    const horaInicioMin = esComedor ? 7 : 7.5; // 7:00 para comedor, 7:30 para otros
    const horaInicioMax = 15.5; // 15:30
    
    // Horarios de fin: 8:00-16:00
    const horaFinMin = 8; // 8:00
    const horaFinMax = 16; // 16:00
    
    // Generar horarios de inicio
    for (let hora = Math.floor(horaInicioMin); hora <= Math.floor(horaInicioMax); hora++) {
        for (let minuto = 0; minuto < 60; minuto += 30) {
            const horaDecimal = hora + (minuto / 60);
            
            // Aplicar restricciones de hora de inicio
            if (horaDecimal < horaInicioMin || horaDecimal > horaInicioMax) {
                continue;
            }
            
            const tiempo = `${hora.toString().padStart(2, '0')}:${minuto.toString().padStart(2, '0')}`;
            
            const optionInicio = document.createElement('option');
            optionInicio.value = tiempo;
            optionInicio.textContent = tiempo;
            selectInicio.appendChild(optionInicio);
        }
    }
    
    // Generar horarios de fin
    for (let hora = Math.floor(horaFinMin); hora <= Math.floor(horaFinMax); hora++) {
        for (let minuto = 0; minuto < 60; minuto += 30) {
            const horaDecimal = hora + (minuto / 60);
            
            // Aplicar restricciones de hora de fin
            if (horaDecimal < horaFinMin || horaDecimal > horaFinMax) {
                continue;
            }
            
            const tiempo = `${hora.toString().padStart(2, '0')}:${minuto.toString().padStart(2, '0')}`;
            
            const optionFin = document.createElement('option');
            optionFin.value = tiempo;
            optionFin.textContent = tiempo;
            selectFin.appendChild(optionFin);
        }
    }
}

/**
 * Validar horarios en edición
 */
function validarHorariosEdicion() {
    validarHoraFinEdicion();
}

/**
 * Validar hora de fin en edición
 */
function validarHoraFinEdicion() {
    const horaInicio = document.getElementById('editHoraInicio').value;
    const horaFin = document.getElementById('editHoraFin').value;
    
    if (horaInicio && horaFin && horaInicio >= horaFin) {
        // Resetear hora de fin si es inválida
        document.getElementById('editHoraFin').value = '';
    }
}
