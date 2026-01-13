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
            const reservaData = {
                reservaId: this.getAttribute('data-reserva-id'),
                titulo: this.getAttribute('data-titulo') || '',
                recursoId: this.getAttribute('data-recurso-id'),
                tipoRecurso: this.getAttribute('data-recurso-tipo') || 'sala',
                fecha: this.getAttribute('data-fecha'),
                horaInicio: this.getAttribute('data-hora-inicio'),
                horaFin: this.getAttribute('data-hora-fin'),
                descripcion: this.getAttribute('data-descripcion') || '',
                responsable: this.getAttribute('data-responsable') || '',
                destino: this.getAttribute('data-destino') || '',
                fechaVuelta: this.getAttribute('data-fecha-vuelta') || ''
            };
            
            abrirModalEdicion(reservaData);
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
    
    // Cambio de recurso - actualizar campos según tipo
    document.getElementById('editRecurso').addEventListener('change', function() {
        const recursoId = this.value;
        const selectedOption = this.options[this.selectedIndex];
        const tipoRecurso = selectedOption ? selectedOption.getAttribute('data-tipo') : 'sala';
        
        // Actualizar campos mostrados según el tipo
        if (tipoRecurso === 'vehiculo') {
            mostrarCamposVehiculo();
        } else {
            mostrarCamposSala();
        }
        
        // Regenerar horarios
        generarHorarios('editHoraInicio', 'editHoraFin', recursoId);
        
        // Limpiar horarios seleccionados al cambiar recurso
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
function abrirModalEdicion(data) {
    // Cargar salas disponibles en el select
    cargarSalasDisponibles();
    
    // Llenar formulario con datos básicos
    document.getElementById('reservaId').value = data.reservaId;
    document.getElementById('editRecurso').value = data.recursoId;
    document.getElementById('editFecha').value = data.fecha;
    document.getElementById('editDescripcion').value = data.descripcion;
    
    // Configurar campos según el tipo de recurso
    if (data.tipoRecurso === 'vehiculo') {
        mostrarCamposVehiculo();
        document.getElementById('editResponsable').value = data.responsable;
        document.getElementById('editDestino').value = data.destino;
        document.getElementById('editFechaVuelta').value = data.fechaVuelta;
    } else {
        mostrarCamposSala();
        document.getElementById('editTitulo').value = data.titulo;
    }
    
    // Generar horarios para el recurso seleccionado
    generarHorarios('editHoraInicio', 'editHoraFin', data.recursoId);
    
    // Establecer horarios después de que se generen las opciones
    setTimeout(() => {
        document.getElementById('editHoraInicio').value = data.horaInicio;
        document.getElementById('editHoraFin').value = data.horaFin;
        validarHoraFinEdicion();
    }, 200);
    
    // Mostrar modal
    modalEditarReserva.show();
}

/**
 * Mostrar campos específicos para vehículos
 */
function mostrarCamposVehiculo() {
    // Ocultar campos de sala
    const tituloField = document.getElementById('editTituloField');
    const tituloInput = document.getElementById('editTitulo');
    if (tituloField && tituloInput) {
        tituloField.style.display = 'none';
        tituloInput.required = false;
        tituloInput.value = '';
    }
    
    // Mostrar campos de vehículo
    const responsableField = document.getElementById('editResponsableField');
    const destinoField = document.getElementById('editDestinoField');
    const fechaVueltaField = document.getElementById('editFechaVueltaField');
    
    if (responsableField) {
        responsableField.style.display = 'block';
        document.getElementById('editResponsable').required = true;
    }
    if (destinoField) {
        destinoField.style.display = 'block';
        document.getElementById('editDestino').required = true;
    }
    if (fechaVueltaField) {
        fechaVueltaField.style.display = 'block';
        document.getElementById('editFechaVuelta').required = true;
    }
    
    // Actualizar labels y título del modal
    const modalTitle = document.getElementById('modalEditarReservaTitle');
    const recursoIcon = document.getElementById('editRecursoIcon');
    const recursoLabel = document.getElementById('editRecursoLabel');
    const fechaLabel = document.getElementById('editFechaLabel');
    
    if (modalTitle) modalTitle.innerHTML = '<i class="fas fa-car me-2"></i>Editar Reserva de Vehículo';
    if (recursoIcon) recursoIcon.className = 'fas fa-car me-2';
    if (recursoLabel) recursoLabel.textContent = 'Vehículo *';
    if (fechaLabel) fechaLabel.textContent = 'Fecha de Salida *';
}

/**
 * Mostrar campos específicos para salas
 */
function mostrarCamposSala() {
    // Mostrar campos de sala
    const tituloField = document.getElementById('editTituloField');
    if (tituloField) {
        tituloField.style.display = 'block';
        document.getElementById('editTitulo').required = true;
    }
    
    // Ocultar campos de vehículo
    const responsableField = document.getElementById('editResponsableField');
    const destinoField = document.getElementById('editDestinoField');
    const fechaVueltaField = document.getElementById('editFechaVueltaField');
    
    if (responsableField) {
        responsableField.style.display = 'none';
        document.getElementById('editResponsable').required = false;
    }
    if (destinoField) {
        destinoField.style.display = 'none';
        document.getElementById('editDestino').required = false;
    }
    if (fechaVueltaField) {
        fechaVueltaField.style.display = 'none';
        document.getElementById('editFechaVuelta').required = false;
    }
    
    // Actualizar labels y título del modal
    const modalTitle = document.getElementById('modalEditarReservaTitle');
    const recursoIcon = document.getElementById('editRecursoIcon');
    const recursoLabel = document.getElementById('editRecursoLabel');
    const fechaLabel = document.getElementById('editFechaLabel');
    
    if (modalTitle) modalTitle.innerHTML = '<i class="fas fa-edit me-2"></i>Editar Reserva';
    if (recursoIcon) recursoIcon.className = 'fas fa-door-open me-2';
    if (recursoLabel) recursoLabel.textContent = 'Sala *';
    if (fechaLabel) fechaLabel.textContent = 'Fecha *';
}

/**
 * Cargar salas disponibles en el select
 */
function cargarSalasDisponibles() {
    const selectRecurso = document.getElementById('editRecurso');
    
    // Limpiar opciones existentes
    selectRecurso.innerHTML = '<option value="">Selecciona un recurso</option>';
    
    // Cargar recursos desde el elemento JSON
    const salasDataElement = document.getElementById('salas-data');
    if (salasDataElement) {
        try {
            const recursosDisponibles = JSON.parse(salasDataElement.textContent);
            if (recursosDisponibles && recursosDisponibles.length > 0) {
                recursosDisponibles.forEach(recurso => {
                    const option = document.createElement('option');
                    option.value = recurso.id;
                    option.textContent = recurso.nombre;
                    option.setAttribute('data-tipo', recurso.tipo);
                    selectRecurso.appendChild(option);
                });
            }
        } catch (error) {
            console.error('Error al parsear datos de recursos:', error);
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
    
    // Determinar tipo de recurso
    const recursoSelect = document.getElementById('editRecurso');
    const selectedOption = recursoSelect.options[recursoSelect.selectedIndex];
    const tipoRecurso = selectedOption ? selectedOption.getAttribute('data-tipo') : 'sala';
    
    let fechaInicio, fechaFin;
    
    if (tipoRecurso === 'vehiculo') {
        // Para vehículos: usar fecha de vuelta
        const fechaVuelta = formData.get('fecha_vuelta');
        fechaInicio = `${fecha}T${horaInicio}:00`;
        fechaFin = `${fechaVuelta}T${horaFin}:00`;
        
        // Asegurar que campos de vehículo se envíen (incluso si están ocultos)
        const responsable = document.getElementById('editResponsable').value;
        const destino = document.getElementById('editDestino').value;
        formData.set('responsable', responsable);
        formData.set('destino', destino);
        formData.set('fecha_vuelta', fechaVuelta);
        // Para vehículos, título puede estar vacío (se genera automáticamente)
        formData.set('titulo', formData.get('titulo') || '');
    } else {
        // Para salas: ambas en la misma fecha
        fechaInicio = `${fecha}T${horaInicio}:00`;
        fechaFin = `${fecha}T${horaFin}:00`;
        
        // Asegurar que título se envíe para salas
        const titulo = document.getElementById('editTitulo').value;
        formData.set('titulo', titulo);
    }
    
    // Agregar campos combinados al FormData
    formData.set('fecha_inicio', fechaInicio);
    formData.set('fecha_fin', fechaFin);
    
    // Mantener campos separados para compatibilidad con el backend
    // El backend puede usar tanto los campos separados como los combinados
    
    // Configurar URL de edición usando la URL de Django
    const editUrl = `/calendario/editar/${reservaId}/`;
    formEditarReserva.action = editUrl;
    
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
        // Verificar si la respuesta es JSON
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
            if (response.ok) {
                return response.json();
            } else {
                return response.json().then(errorData => {
                    // Construir mensaje de error más detallado
                    let mensajeError = errorData.message || 'Error en el formulario';
                    
                    if (errorData.errors) {
                        const erroresDetallados = [];
                        for (const [campo, mensajes] of Object.entries(errorData.errors)) {
                            if (Array.isArray(mensajes)) {
                                erroresDetallados.push(`${campo}: ${mensajes.join(', ')}`);
                            } else {
                                erroresDetallados.push(`${campo}: ${mensajes}`);
                            }
                        }
                        if (erroresDetallados.length > 0) {
                            mensajeError += '\n' + erroresDetallados.join('\n');
                        }
                    }
                    
                    throw new Error(mensajeError);
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
    const recursoSelect = document.getElementById('editRecurso');
    const selectedOption = recursoSelect.options[recursoSelect.selectedIndex];
    const tipoRecurso = selectedOption ? selectedOption.getAttribute('data-tipo') : 'sala';
    
    const recurso = recursoSelect.value;
    const fecha = document.getElementById('editFecha').value;
    const horaInicio = document.getElementById('editHoraInicio').value;
    const horaFin = document.getElementById('editHoraFin').value;
    
    const errores = [];
    
    // Validar campos comunes
    if (!recurso) {
        errores.push('Debe seleccionar un recurso');
    }
    
    // Validar campos específicos según tipo de recurso
    if (tipoRecurso === 'vehiculo') {
        const responsable = document.getElementById('editResponsable').value.trim();
        const destino = document.getElementById('editDestino').value.trim();
        const fechaVuelta = document.getElementById('editFechaVuelta').value;
        
        if (!responsable) {
            errores.push('El responsable es obligatorio para vehículos');
        } else if (responsable.length < 3) {
            errores.push('El nombre del responsable debe tener al menos 3 caracteres');
        }
        
        if (!destino) {
            errores.push('El destino es obligatorio para vehículos');
        } else if (destino.length < 3) {
            errores.push('El destino debe tener al menos 3 caracteres');
        }
        
        if (!fechaVuelta) {
            errores.push('La fecha de vuelta es obligatoria para vehículos');
        }
    } else {
        const titulo = document.getElementById('editTitulo').value.trim();
        
        if (!titulo) {
            errores.push('El título es obligatorio para salas');
        } else if (titulo.length < 3) {
            errores.push('El título debe tener al menos 3 caracteres');
        } else if (titulo.length > 100) {
            errores.push('El título no puede exceder 100 caracteres');
        }
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
        // Para SALAS: validar que hora fin sea posterior a hora inicio (mismo día)
        // Para VEHÍCULOS: NO validar porque pueden tener viajes de varios días
        if (tipoRecurso !== 'vehiculo') {
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
    
    // Determinar el tipo de recurso
    let esComedor = false;
    let esVehiculo = false;
    
    if (recursoId) {
        // Obtener tipo desde el select de recurso
        const recursoSelect = document.getElementById('editRecurso');
        if (recursoSelect) {
            const option = recursoSelect.querySelector(`option[value="${recursoId}"]`);
            if (option) {
                const tipo = option.getAttribute('data-tipo');
                esVehiculo = tipo === 'vehiculo';
                
                // Si no es vehículo, verificar si es comedor
                if (!esVehiculo) {
                    const nombreRecurso = option.textContent.toLowerCase();
                    esComedor = nombreRecurso.includes('comedor');
                }
            }
        }
    }
    
    let horaInicioMin, horaInicioMax, horaFinMin, horaFinMax;
    
    if (esVehiculo) {
        // Vehículos: 24/7
        horaInicioMin = 0;
        horaInicioMax = 23.5;
        horaFinMin = 0;
        horaFinMax = 24;
    } else if (esComedor) {
        // Comedor: 7:00-18:30 (excluyendo 12:00-14:30)
        horaInicioMin = 7;
        horaInicioMax = 18.5;
        horaFinMin = 7.5;
        horaFinMax = 19;
    } else {
        // Salas normales: 7:30-18:00
        horaInicioMin = 7.5;
        horaInicioMax = 18;
        horaFinMin = 8;
        horaFinMax = 20;
    }
    
    // Generar horarios de inicio
    if (esVehiculo) {
        // Para vehículos: generar 00:00 - 23:30
        for (let hora = 0; hora <= 23; hora++) {
            for (let minuto = 0; minuto < 60; minuto += 30) {
                const tiempo = `${hora.toString().padStart(2, '0')}:${minuto.toString().padStart(2, '0')}`;
                const optionInicio = document.createElement('option');
                optionInicio.value = tiempo;
                optionInicio.textContent = tiempo;
                selectInicio.appendChild(optionInicio);
            }
        }
    } else if (esComedor) {
        // Para comedor: 7:00-11:30 y 14:30-18:30
        const horariosComedor = [
            '07:00', '07:30', '08:00', '08:30', '09:00', '09:30', 
            '10:00', '10:30', '11:00', '11:30',
            '14:30', '15:00', '15:30', '16:00', '16:30', 
            '17:00', '17:30', '18:00', '18:30'
        ];
        horariosComedor.forEach(tiempo => {
            const optionInicio = document.createElement('option');
            optionInicio.value = tiempo;
            optionInicio.textContent = tiempo;
            selectInicio.appendChild(optionInicio);
        });
    } else {
        // Para salas normales: 7:30-18:00
        for (let hora = Math.floor(horaInicioMin); hora <= Math.floor(horaInicioMax); hora++) {
            for (let minuto = 0; minuto < 60; minuto += 30) {
                const horaDecimal = hora + (minuto / 60);
                
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
    }
    
    // Generar horarios de fin
    if (esVehiculo) {
        // Para vehículos: 00:00 - 23:30 + 00:00 (fin del día siguiente)
        for (let hora = 0; hora <= 23; hora++) {
            for (let minuto = 0; minuto < 60; minuto += 30) {
                const tiempo = `${hora.toString().padStart(2, '0')}:${minuto.toString().padStart(2, '0')}`;
                const optionFin = document.createElement('option');
                optionFin.value = tiempo;
                optionFin.textContent = tiempo;
                selectFin.appendChild(optionFin);
            }
        }
        // Agregar 00:00 como fin del día siguiente
        const option00 = document.createElement('option');
        option00.value = '00:00';
        option00.textContent = '00:00';
        selectFin.appendChild(option00);
    } else if (esComedor) {
        // Para comedor: 07:30-12:00 y 15:00-19:00
        const horariosFinComedor = [
            '07:30', '08:00', '08:30', '09:00', '09:30', 
            '10:00', '10:30', '11:00', '11:30', '12:00',
            '15:00', '15:30', '16:00', '16:30', 
            '17:00', '17:30', '18:00', '18:30', '19:00'
        ];
        horariosFinComedor.forEach(tiempo => {
            const optionFin = document.createElement('option');
            optionFin.value = tiempo;
            optionFin.textContent = tiempo;
            selectFin.appendChild(optionFin);
        });
    } else {
        // Para salas normales: 8:00-20:00
        for (let hora = Math.floor(horaFinMin); hora <= Math.floor(horaFinMax); hora++) {
            for (let minuto = 0; minuto < 60; minuto += 30) {
                const horaDecimal = hora + (minuto / 60);
                
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
 * Actualizar calendario después de cambios
 */
function actualizarCalendario() {
    if (window.CalendarioApp && window.CalendarioApp.Core) {
        if (window.CalendarioApp.Core.updateMainCalendar) {
            window.CalendarioApp.Core.updateMainCalendar();
        } else if (window.CalendarioApp.Core.calendar && window.CalendarioApp.Core.calendar.refetchEvents) {
            window.CalendarioApp.Core.calendar.refetchEvents();
        }
    }
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
        
        // Actualizar el calendario si existe
        actualizarCalendario();
        
        // Si estamos en la página de mis reservas, recargar la tabla
        if (window.location.pathname.includes('mis-reservas')) {
            setTimeout(() => {
                window.location.reload();
            }, 1000);
        }
    })
    .catch(error => {
        hideLoadingIndicator();
        showNotification('Error al eliminar la reserva: ' + error.message, 'error');
        console.error('Error al eliminar reserva:', error);
    });
}
