/**
 * Mis Reservas - Gestión de reservas del usuario
 * Maneja confirmaciones de eliminación, colores dinámicos, accesibilidad y edición modal
 */

// Variables globales para el modal de edición
let modalEditarReserva = null;
let formEditarReserva = null;

/**
 * Funciones auxiliares para reemplazar dependencias de CalendarioApp
 */

// Mostrar indicador de carga elegante
function showLoadingIndicator(message = 'Cargando...') {
    // Crear overlay de carga si no existe
    let loadingOverlay = document.getElementById('loading-overlay');
    if (!loadingOverlay) {
        loadingOverlay = document.createElement('div');
        loadingOverlay.id = 'loading-overlay';
        loadingOverlay.className = 'loading-overlay';
        document.body.appendChild(loadingOverlay);
    }
    
    loadingOverlay.innerHTML = `
        <div class="loading-content">
            <div class="modern-spinner"></div>
            <div class="loading-message">
                ${message}
                <div class="loading-dots">
                    <span></span>
                    <span></span>
                    <span></span>
                </div>
            </div>
            <div class="progress-modern">
                <div class="progress-bar-modern"></div>
            </div>
        </div>
    `;
    
    // Mostrar con animación
    setTimeout(() => {
        loadingOverlay.classList.add('show');
    }, 10);
}

// Ocultar indicador de carga
function hideLoadingIndicator() {
    const loadingOverlay = document.getElementById('loading-overlay');
    if (loadingOverlay) {
        loadingOverlay.classList.remove('show');
        // Remover el overlay después de la animación
        setTimeout(() => {
            if (loadingOverlay.parentElement) {
                loadingOverlay.remove();
            }
        }, 300);
    }
}

// Mostrar notificación
function showNotification(message, type = 'info') {
    // Crear contenedor de notificaciones si no existe
    let notificationContainer = document.getElementById('notification-container');
    if (!notificationContainer) {
        notificationContainer = document.createElement('div');
        notificationContainer.id = 'notification-container';
        notificationContainer.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 10000;
            max-width: 400px;
        `;
        document.body.appendChild(notificationContainer);
    }
    
    // Crear notificación
    const notification = document.createElement('div');
    notification.style.cssText = `
        background: ${type === 'success' ? '#28a745' : type === 'error' ? '#dc3545' : '#007bff'};
        color: white;
        padding: 15px 20px;
        border-radius: 8px;
        margin-bottom: 10px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        transform: translateX(100%);
        transition: transform 0.3s ease;
        font-weight: 500;
        position: relative;
    `;
    
    notification.innerHTML = `
        <div style="display: flex; align-items: center; gap: 10px;">
            <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
            <span>${message}</span>
            <button onclick="this.parentElement.parentElement.remove()" style="
                background: none;
                border: none;
                color: white;
                font-size: 18px;
                cursor: pointer;
                margin-left: auto;
                padding: 0;
                width: 20px;
                height: 20px;
                display: flex;
                align-items: center;
                justify-content: center;
            ">&times;</button>
        </div>
    `;
    
    notificationContainer.appendChild(notification);
    
    // Animar entrada
    setTimeout(() => {
        notification.style.transform = 'translateX(0)';
    }, 100);
    
    // Auto-remover después de 5 segundos
    setTimeout(() => {
        if (notification.parentElement) {
            notification.style.transform = 'translateX(100%)';
            setTimeout(() => {
                if (notification.parentElement) {
                    notification.remove();
                }
            }, 300);
        }
    }, 5000);
}

// Agregar animación CSS para el spinner
if (!document.getElementById('loading-styles')) {
    const style = document.createElement('style');
    style.id = 'loading-styles';
    style.textContent = `
        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
    `;
    document.head.appendChild(style);
}

// Inicializar tooltips modernos
function initializeTooltips() {
    document.querySelectorAll('.tooltip-modern').forEach(element => {
        const tooltipText = element.getAttribute('data-tooltip');
        if (tooltipText) {
            // Crear elemento de tooltip si no existe
            if (!element.querySelector('.tooltip-text')) {
                const tooltipElement = document.createElement('span');
                tooltipElement.className = 'tooltip-text';
                tooltipElement.innerHTML = tooltipText;
                tooltipElement.style.display = 'none'; // Asegurar que esté oculto
                element.appendChild(tooltipElement);
            }
        }
    });
}

document.addEventListener('DOMContentLoaded', function() {
    // Inicializar tooltips
    initializeTooltips();
    
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
            if (confirm(`${confirmMessage}\n\nReserva: ${reservaTitle}`)) {
                // Mostrar indicador de carga
                showLoadingIndicator('Eliminando reserva...');
                
                // Realizar eliminación real
                eliminarReserva(this.href);
            }
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
        
        // Resetear filtro de horas fin
        resetearFiltroHorasFin('editHoraFin');
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
        
        // NO aplicar filtro automáticamente al abrir el modal
        // El filtro se aplicará cuando el usuario cambie la hora de inicio
        // Esto permite ver todas las opciones disponibles al abrir el modal
        
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
    
    // Cargar salas desde el elemento JSON
    const salasDataElement = document.getElementById('salas-data');
    if (salasDataElement) {
        try {
            const salasDisponibles = JSON.parse(salasDataElement.textContent);
            if (salasDisponibles && salasDisponibles.length > 0) {
                salasDisponibles.forEach(sala => {
                    const option = document.createElement('option');
                    option.value = sala.id;
                    option.textContent = sala.nombre;
                    selectRecurso.appendChild(option);
                });
            }
        } catch (error) {
            console.error('Error al parsear datos de salas:', error);
        }
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
    showLoadingIndicator('Guardando cambios...');
    
    // Preparar datos del formulario
    const formData = new FormData(formEditarReserva);
    const reservaId = formData.get('reserva_id');
    
    // Obtener valores del formulario
    const fecha = formData.get('fecha');
    const horaInicio = formData.get('hora_inicio');
    const horaFin = formData.get('hora_fin');
    
    // Crear fechas completas en formato ISO
    const fechaInicio = `${fecha}T${horaInicio}:00`;
    const fechaFin = `${fecha}T${horaFin}:00`;
    
    // Agregar campos combinados al FormData
    formData.set('fecha_inicio', fechaInicio);
    formData.set('fecha_fin', fechaFin);
    
    // Mantener campos separados para compatibilidad con el backend
    // El backend puede usar tanto los campos separados como los combinados
    
    // Configurar URL de edición usando la URL de Django
    const editUrl = `/calendario/editar/${reservaId}/`;
    formEditarReserva.action = editUrl;
    
    console.log('Enviando datos a URL:', editUrl);
    console.log('Datos del formulario:', Object.fromEntries(formData));
    console.log('Fecha inicio combinada:', fechaInicio);
    console.log('Fecha fin combinada:', fechaFin);
    
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
        
        // Verificar si la respuesta es JSON
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
            if (response.ok) {
                return response.json();
            } else {
                return response.json().then(errorData => {
                    throw new Error(errorData.message || `Error del servidor: ${response.status}`);
                });
            }
        } else {
            // Si no es JSON, manejar como error de servidor
            if (response.ok) {
                throw new Error('Respuesta del servidor no válida');
            } else {
                throw new Error(`Error del servidor: ${response.status} ${response.statusText}`);
            }
        }
    })
    .then(data => {
        console.log('Datos recibidos del servidor:', data);
        
        hideLoadingIndicator();
        
        if (data.success) {
            showNotification(data.message || 'Reserva actualizada exitosamente', 'success');
            
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
        hideLoadingIndicator();
        showNotification('Error al guardar cambios: ' + error.message, 'error');
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
    
    const errores = [];
    
    if (!titulo) {
        errores.push('El título es obligatorio');
    } else if (titulo.length < 3) {
        errores.push('El título debe tener al menos 3 caracteres');
    } else if (titulo.length > 100) {
        errores.push('El título no puede exceder 100 caracteres');
    }
    
    if (!recurso) {
        errores.push('Debe seleccionar una sala');
    }
    
    if (!fecha) {
        errores.push('La fecha es obligatoria');
    } else {
        // Validar que la fecha no sea anterior a hoy
        const fechaSeleccionada = new Date(fecha);
        const hoy = new Date();
        hoy.setHours(0, 0, 0, 0);
        
        if (fechaSeleccionada < hoy) {
            errores.push('No se puede editar una reserva con fecha anterior a hoy');
        }
    }
    
    if (!horaInicio) {
        errores.push('La hora de inicio es obligatoria');
    }
    
    if (!horaFin) {
        errores.push('La hora de fin es obligatoria');
    }
    
    if (horaInicio && horaFin) {
        if (horaInicio >= horaFin) {
            errores.push('La hora de fin debe ser posterior a la hora de inicio');
        }
        
        // Validar que la diferencia mínima sea de 30 minutos
        const inicio = new Date(`2000-01-01T${horaInicio}:00`);
        const fin = new Date(`2000-01-01T${horaFin}:00`);
        const diferencia = (fin - inicio) / (1000 * 60); // en minutos
        
        if (diferencia < 30) {
            errores.push('La reserva debe durar al menos 30 minutos');
        }
    }
    
    if (errores.length > 0) {
        mostrarError(errores.join('<br>'));
        return false;
    }
    
    return true;
}

/**
 * Mostrar error en el modal
 */
function mostrarError(mensaje) {
    showNotification(mensaje, 'error');
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
    if (recursoId) {
        const salasDataElement = document.getElementById('salas-data');
        if (salasDataElement) {
            try {
                const salasDisponibles = JSON.parse(salasDataElement.textContent);
                const sala = salasDisponibles.find(s => s.id == recursoId);
                esComedor = sala ? sala.esComedor : false;
            } catch (error) {
                console.error('Error al parsear datos de salas:', error);
            }
        }
    }
    
    // Horarios de inicio: 7:30-18:30 (excepto comedor que puede ser 7:00-18:30)
    const horaInicioMin = esComedor ? 7 : 7.5; // 7:00 para comedor, 7:30 para otros
    const horaInicioMax = 18.5; // 18:30
    
    // Horarios de fin: 8:00-19:00
    const horaFinMin = 8; // 8:00
    const horaFinMax = 19; // 19:00
    
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
    
    if (horaInicio && horaFin) {
        const horaInicioMinutos = convertirHoraAMinutos(horaInicio);
        const horaFinMinutos = convertirHoraAMinutos(horaFin);
        
        if (horaFinMinutos <= horaInicioMinutos) {
            // Resetear hora de fin si es inválida
            document.getElementById('editHoraFin').value = '';
        }
    }
    
    // Filtrar opciones de hora fin para mostrar solo las posteriores
    if (horaInicio) {
        filtrarHorasFin('editHoraFin', horaInicio);
    }
}

/**
 * Filtrar opciones de hora fin para mostrar solo las posteriores a hora inicio
 */
function filtrarHorasFin(selectFinId, horaInicio) {
    const selectFin = document.getElementById(selectFinId);
    const opciones = selectFin.querySelectorAll('option');
    
    opciones.forEach(opcion => {
        if (opcion.value === '') {
            // Mantener la opción vacía
            opcion.style.display = 'block';
            return;
        }
        
        // Convertir horarios a minutos para comparación correcta
        const horaInicioMinutos = convertirHoraAMinutos(horaInicio);
        const horaOpcionMinutos = convertirHoraAMinutos(opcion.value);
        
        // Mostrar solo horas posteriores a la hora de inicio
        if (horaOpcionMinutos > horaInicioMinutos) {
            opcion.style.display = 'block';
        } else {
            opcion.style.display = 'none';
        }
    });
}

/**
 * Convertir hora en formato HH:MM a minutos desde medianoche
 */
function convertirHoraAMinutos(hora) {
    if (!hora || hora === '') return 0;
    const [horas, minutos] = hora.split(':').map(Number);
    return horas * 60 + minutos;
}

/**
 * Resetear filtro de horas fin para mostrar todas las opciones
 */
function resetearFiltroHorasFin(selectFinId) {
    const selectFin = document.getElementById(selectFinId);
    const opciones = selectFin.querySelectorAll('option');
    
    opciones.forEach(opcion => {
        opcion.style.display = 'block';
    });
}

/**
 * Eliminar reserva mediante petición AJAX
 */
function eliminarReserva(deleteUrl) {
    // Obtener token CSRF
    const csrfToken = document.querySelector('[name=csrfmiddlewaretoken]').value;
    
    fetch(deleteUrl, {
        method: 'POST',
        headers: {
            'X-CSRFToken': csrfToken,
            'X-Requested-With': 'XMLHttpRequest'
        }
    })
    .then(response => {
        // Verificar si la respuesta es JSON
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
            if (response.ok) {
                return response.json();
            } else {
                return response.json().then(errorData => {
                    throw new Error(errorData.message || `Error al eliminar la reserva: ${response.status}`);
                });
            }
        } else {
            if (response.ok) {
                // Si no es JSON pero está OK, asumir éxito
                return { success: true, message: 'Reserva eliminada exitosamente' };
            } else {
                throw new Error(`Error del servidor: ${response.status} ${response.statusText}`);
            }
        }
    })
    .then(data => {
        hideLoadingIndicator();
        showNotification('Reserva eliminada exitosamente', 'success');
        
        // Recargar la página para mostrar los cambios
        setTimeout(() => {
            window.location.reload();
        }, 1000);
    })
    .catch(error => {
        hideLoadingIndicator();
        showNotification('Error al eliminar la reserva: ' + error.message, 'error');
        console.error('Error al eliminar reserva:', error);
    });
}
