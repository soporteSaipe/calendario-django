/**
 * CALENDARIO MAIN - Sistema principal del calendario
 * Funcionalidad esencial del calendario FullCalendar
 */

// CalendarioApp ya está inicializado en calendario-core.js

// ===== SISTEMA DE CALENDARIO =====
CalendarioApp.Calendar = {
  calendar: null,
  currentSalaFilter: null,
  salasData: {},
  
  init: function() {
    this.initializeSalasData();
    this.setInitialSala();
    
    if (typeof FullCalendar === 'undefined') {
      console.error('FullCalendar no está cargado');
      return;
    }
    
    this.initializeMainCalendar();
    this.setupFilterListeners();
    this.setupCrearReservaModal();
    this.setupMicroInteractions();
    this.initializeColorSystem();
    this.updateSalaInfo();
    this.updateMainCalendar();
    
    // Integrar vistas de calendario si están disponibles
    if (window.CalendarioApp && CalendarioApp.CalendarViews) {
      CalendarioApp.CalendarViews.integrateWithCalendar(this.calendar);
    }
  },
  
  initializeSalasData: function() {
    this.salasData = {};
    const salaOptions = document.querySelectorAll('#salaFilter option');
    
    CalendarioApp.Core.Logger.debug('Inicializando datos de salas. Opciones encontradas:', salaOptions.length);
    
    salaOptions.forEach(function(option) {
      if (option.value) {
        const textContent = option.textContent.trim();
        const tipo = option.getAttribute('data-tipo');
        
        let capacidad = 1;
        let nombre = textContent;
        
        if (tipo === 'vehiculo') {
          // Para vehículos: "Auto de la Empresa - ABC123 (5 pasajeros)"
          const match = textContent.match(/\((\d+) pasajeros\)/);
          capacidad = match ? parseInt(match[1]) : 1;
          // Extraer nombre sin la patente
          nombre = textContent.split(' - ')[0].trim();
        } else {
          // Para salas: "Sala1 (capacidad: 10)"
          const match = textContent.match(/capacidad: (\d+)/);
          capacidad = match ? parseInt(match[1]) : 1;
          nombre = textContent.split(' (')[0].trim();
        }
        
        const salaData = {
          id: option.value,
          nombre: nombre,
          color: option.getAttribute('data-color') || '#64748B',
          capacidad: capacidad,
          tipo: tipo
        };
        
        this.salasData[option.value] = salaData;
        CalendarioApp.Core.Logger.debug('Recurso agregado:', option.value, salaData);
      }
    }.bind(this));
    
    CalendarioApp.Core.Logger.debug('salasData final:', this.salasData);
  },
  
  setInitialSala: function() {
    const salaSelect = document.getElementById('salaFilter');
    
    if (!salaSelect) {
      console.error('No se encontró el elemento #salaFilter');
      return;
    }
    
    const urlParams = new URLSearchParams(window.location.search);
    const salaFromUrl = urlParams.get('sala');
    
    if (salaFromUrl && salaSelect) {
      const option = salaSelect.querySelector(`option[value="${salaFromUrl}"]`);
      if (option) {
        salaSelect.value = salaFromUrl;
        this.currentSalaFilter = salaFromUrl;
        return;
      }
    }
    
    if (salaSelect.options.length > 0) {
      const firstOption = salaSelect.options[0];
      if (firstOption.value) {
        salaSelect.value = firstOption.value;
        this.currentSalaFilter = firstOption.value;
      }
    } else {
      console.error('No hay opciones de sala disponibles');
    }
  },
  
  initializeMainCalendar: function() {
    const calendarEl = document.getElementById('calendar');
    
    if (!calendarEl) {
      console.error('No se encontró el elemento #calendar');
      return;
    }
    
    this.calendar = new FullCalendar.Calendar(calendarEl, {
      locale: 'es',
      initialView: 'timeGridWeek',
      lazyFetching: false,
      headerToolbar: false, // Deshabilitamos el header del calendario para usar nuestros controles
      views: {
        timeGridDay: {
          slotMinTime: '00:00:00',
          slotMaxTime: '24:00:00',
          slotDuration: '00:30:00'
        },
        timeGridWeek: {
          slotMinTime: '00:00:00',
          slotMaxTime: '24:00:00',
          slotDuration: '00:30:00'
        },
        dayGridMonth: {
          dayMaxEvents: 3
        },
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
      slotMaxTime: '19:00:00',
      slotDuration: '00:30:00',
      slotLabelInterval: '01:00:00',
      allDaySlot: false,
      events: this.getEventsUrl.bind(this),
      eventClick: this.handleEventClick.bind(this),
      eventDidMount: this.handleEventDidMount.bind(this),
      dateClick: this.handleDateClick.bind(this),
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
    
    this.calendar.render();
  },
  
  getEventsUrl: function() {
    if (!this.currentSalaFilter || this.currentSalaFilter === 'undefined') {
      const salaSelect = document.getElementById('salaFilter');
      if (salaSelect && salaSelect.options.length > 0) {
        this.currentSalaFilter = salaSelect.options[0].value;
      } else {
        console.error('No hay salas disponibles');
        return [];
      }
    }
    
    // Usar la URL global si está disponible, sino usar la del config
    const apiUrl = window.calendarioApiUrl || CalendarioApp.Core?.urls?.api?.reservas;
    
    if (!apiUrl) {
      console.error('URL de API no configurada');
      if (window.CalendarioApp?.ModalFactory) {
        CalendarioApp.ModalFactory.utils.alert('Error de configuración: URL de API no encontrada', { type: 'error' });
      }
      return [];
    }
    
    const url = apiUrl + '?sala=' + this.currentSalaFilter;
    CalendarioApp.Core.Logger.debug('Cargando eventos desde URL:', url);
    
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
        if (window.CalendarioApp?.ModalFactory) {
          CalendarioApp.ModalFactory.utils.alert('Error al cargar eventos del calendario', { type: 'error' });
        }
        return [];
      });
  },
  
  handleEventClick: function(info) {
    const event = info.event;
    const modal = new bootstrap.Modal(document.getElementById('reservaModalDetalles'));
    
    if (!modal) {
      console.error('Modal no encontrado');
      return;
    }
    
    // Actualizar título del modal
    document.getElementById('reservaModalDetallesLabel').innerHTML = 
      `<i class="fas fa-calendar-check me-2"></i>${event.title || 'Detalles de Reserva'}`;
    
    // Mostrar detalles de la reserva
    this.showReservaDetails(event);
    
    modal.show();
  },
  
  showReservaDetails: function(event) {
    const detailsContent = document.getElementById('reservaDetailsContent');
    if (!detailsContent) return;
    
    const startDate = event.start ? new Date(event.start) : null;
    const endDate = event.end ? new Date(event.end) : null;
    const usuario = event.extendedProps && event.extendedProps.usuario ? event.extendedProps.usuario : 'No disponible';
    const estado = event.extendedProps && event.extendedProps.estado ? event.extendedProps.estado : 'Desconocido';
    const descripcion = event.extendedProps && event.extendedProps.descripcion ? event.extendedProps.descripcion : 'Sin descripción';
    const sala = event.extendedProps && event.extendedProps.sala ? event.extendedProps.sala : 'Sala no especificada';
    
    detailsContent.innerHTML = `
      <div class="reserva-details-container">
        <!-- Header de la reserva -->
        <div class="reserva-details-header mb-4">
          <div class="d-flex align-items-center justify-content-between mb-3">
            <h4 class="reserva-details-title mb-0">
              <i class="fas fa-calendar-check me-2 text-primary"></i>
              ${event.title || 'Reserva'}
            </h4>
            <span class="badge-modern badge-${this.getEstadoColor(estado)} fs-6">${estado}</span>
          </div>
        </div>
        
        <!-- Información principal -->
        <div class="reserva-details-main mb-4">
          <div class="row g-3">
            <!-- Fecha y hora -->
            <div class="col-12">
              <div class="reserva-info-section">
                <h6 class="section-title mb-3">
                  <i class="fas fa-calendar-alt me-2 text-primary"></i>Fecha y Hora
                </h6>
                <div class="row g-2">
                  <div class="col-md-6">
                    <div class="info-item">
                      <div class="info-label">
                        <i class="fas fa-calendar me-2"></i>Fecha
                      </div>
                      <div class="info-value">
                        ${startDate ? startDate.toLocaleDateString('es-ES', { 
                          weekday: 'long', 
                          year: 'numeric', 
                          month: 'long', 
                          day: 'numeric' 
                        }) : 'No disponible'}
                      </div>
                    </div>
                  </div>
                  <div class="col-md-6">
                    <div class="info-item">
                      <div class="info-label">
                        <i class="fas fa-clock me-2"></i>Horario
                      </div>
                      <div class="info-value">
                        ${startDate && endDate ? 
                          `${startDate.toLocaleTimeString('es-ES', {hour: '2-digit', minute: '2-digit'})} - ${endDate.toLocaleTimeString('es-ES', {hour: '2-digit', minute: '2-digit'})}` : 
                          'No disponible'}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <!-- Duración -->
            <div class="col-12">
              <div class="reserva-duration-card">
                <div class="duration-content">
                  <i class="fas fa-stopwatch me-2 text-info"></i>
                  <span class="duration-label">Duración total:</span>
                  <span class="duration-value">
                    ${startDate && endDate ? this.calculateDuration(startDate, endDate) : 'No disponible'}
                  </span>
                </div>
              </div>
            </div>
            
            <!-- Información adicional -->
            <div class="col-12">
              <div class="reserva-info-section">
                <h6 class="section-title mb-3">
                  <i class="fas fa-info-circle me-2 text-primary"></i>Información Adicional
                </h6>
                <div class="row g-2">
                  <div class="col-md-6">
                    <div class="info-item">
                      <div class="info-label">
                        <i class="fas fa-user me-2"></i>Usuario
                      </div>
                      <div class="info-value">${usuario}</div>
                    </div>
                  </div>
                  <div class="col-md-6">
                    <div class="info-item">
                      <div class="info-label">
                        <i class="fas fa-door-open me-2"></i>Sala
                      </div>
                      <div class="info-value">${sala}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <!-- Descripción -->
            <div class="col-12">
              <div class="reserva-description-section">
                <h6 class="section-title mb-3">
                  <i class="fas fa-align-left me-2 text-primary"></i>Descripción
                </h6>
                <div class="description-content">
                  <p class="mb-0">${descripcion}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  },
  
  calculateDuration: function(start, end) {
    const diffMs = end - start;
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    
    if (diffHours > 0) {
      return `${diffHours}h ${diffMinutes}m`;
    } else {
      return `${diffMinutes}m`;
    }
  },
  
  handleEventDidMount: function(info) {
    const title = info.event.title || 'Reserva';
    const usuario = info.event.extendedProps && info.event.extendedProps.usuario ? info.event.extendedProps.usuario : 'No disponible';
    const estado = info.event.extendedProps && info.event.extendedProps.estado ? info.event.extendedProps.estado : 'Desconocido';
    
    info.el.setAttribute('title', 
      `${title}\n` +
      `Usuario: ${usuario}\n` +
      `Estado: ${estado}`
    );
  },
  
  handleDateClick: function(info) {
    const clickedDate = new Date(info.dateStr);
    const dayOfWeek = clickedDate.getDay();
    
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      return false;
    }
    
    const fecha = info.dateStr;
    const crearReservaUrl = window.crearReservaUrl || CalendarioApp.Core?.urls?.api?.crearReserva;
    
    if (crearReservaUrl) {
      const url = crearReservaUrl + '?fecha=' + fecha;
      window.location.href = url;
    } else {
      if (window.CalendarioApp?.ModalFactory) {
        CalendarioApp.ModalFactory.utils.alert('URL de creación de reserva no configurada', { type: 'warning' });
      }
    }
  },
  
  getEstadoColor: function(estado) {
    switch(estado) {
      case 'pendiente': return 'warning';
      case 'confirmada': return 'success';
      case 'cancelada': return 'danger';
      case 'completada': return 'info';
      case 'desconocido': return 'secondary';
      default: return 'secondary';
    }
  },
  
  setupFilterListeners: function() {
    const salaFilter = document.getElementById('salaFilter');
    if (salaFilter) {
      salaFilter.addEventListener('change', function() {
        CalendarioApp.Calendar.currentSalaFilter = this.value;
        CalendarioApp.Calendar.updateSalaInfo();
        CalendarioApp.Calendar.updateMainCalendar();
      });
    }
  },
  
  setupCrearReservaModal: function() {
    const horaInicioSelect = document.getElementById('hora_inicio');
    const horaFinSelect = document.getElementById('hora_fin');
    
    if (horaInicioSelect && horaFinSelect) {
      if (window.CalendarioApp?.Core?.TimeUtils) {
        CalendarioApp.Core.TimeUtils.generateTimeOptions('hora_inicio', 'hora_fin');
      }
      this.setupTimeValidation(horaInicioSelect, horaFinSelect);
    }
    
    // Configurar modal de crear
    this.setupCrearModal();
  },
  
  setupCrearModal: function() {
    // Configurar botón de crear reserva
    const btnCrearReserva = document.getElementById('btnCrearReserva');
    if (btnCrearReserva) {
      btnCrearReserva.addEventListener('click', () => {
        this.crearReserva();
      });
    }
    
    // Configurar selector de sala en el modal
    const recursoSelect = document.getElementById('recurso');
    if (recursoSelect) {
      recursoSelect.addEventListener('change', () => {
        this.updateSalaSelectedInfo();
        this.updateTimeOptionsForSala();
        this.updateFieldsForResourceType();
      });
      
      // Configurar campos por defecto al cargar
      this.updateFieldsForResourceType();
    }
    
    // Configurar fecha mínima
    const fechaInput = document.getElementById('fecha');
    if (fechaInput) {
      const today = new Date();
      fechaInput.min = today.toISOString().split('T')[0];
      
      // Configurar fecha máxima (6 meses en el futuro)
      const maxDate = new Date();
      maxDate.setMonth(maxDate.getMonth() + 6);
      fechaInput.max = maxDate.toISOString().split('T')[0];
    }
    
    // Resetear modal cuando se cierre
    const modal = document.getElementById('reservaModalCrear');
    if (modal) {
      modal.addEventListener('hidden.bs.modal', () => {
        this.resetCrearModal();
      });
    }
  },
  
  updateSalaSelectedInfo: function() {
    const recursoSelect = document.getElementById('recurso');
    const salaSelectedInfo = document.getElementById('salaSelectedInfo');
    const salaSelectedName = document.getElementById('salaSelectedName');
    const salaSelectedCapacity = document.getElementById('salaSelectedCapacity');
    
    if (recursoSelect && recursoSelect.value) {
      const selectedOption = recursoSelect.options[recursoSelect.selectedIndex];
      const salaData = this.salasData[recursoSelect.value];
      
      if (salaData && salaSelectedName && salaSelectedCapacity) {
        salaSelectedName.textContent = salaData.nombre;
        salaSelectedCapacity.textContent = salaData.capacidad;
        salaSelectedInfo.style.display = 'block';
      }
    } else {
      salaSelectedInfo.style.display = 'none';
    }
  },

  updateFieldsForResourceType: function() {
    const recursoSelect = document.getElementById('recurso');
    if (!recursoSelect || !recursoSelect.value) {
      // Si no hay recurso seleccionado, mostrar campos por defecto (salas)
      this.showSalaFields();
      return;
    }

    const selectedOption = recursoSelect.options[recursoSelect.selectedIndex];
    const tipoRecurso = selectedOption ? selectedOption.getAttribute('data-tipo') : null;
    
    if (tipoRecurso === 'vehiculo') {
      this.showVehiculoFields();
    } else {
      this.showSalaFields();
    }
  },

  showVehiculoFields: function() {
    // Ocultar campo título
    const tituloField = document.getElementById('tituloField');
    const tituloInput = document.getElementById('titulo');
    if (tituloField) {
      tituloField.style.display = 'none';
    }
    if (tituloInput) {
      tituloInput.required = false;
    }

    // Mostrar campos de vehículo
    const responsableField = document.getElementById('responsableField');
    const destinoField = document.getElementById('destinoField');
    const fechaVueltaRow = document.getElementById('fechaVueltaRow');
    const responsableInput = document.getElementById('responsable');
    const destinoInput = document.getElementById('destino');
    const fechaVueltaInput = document.getElementById('fecha_vuelta');
    
    if (responsableField) {
      responsableField.style.display = 'block';
    }
    if (destinoField) {
      destinoField.style.display = 'block';
    }
    if (fechaVueltaRow) {
      fechaVueltaRow.style.display = 'block';
    }
    if (responsableInput) {
      responsableInput.required = true;
    }
    if (destinoInput) {
      destinoInput.required = true;
    }
    if (fechaVueltaInput) {
      fechaVueltaInput.required = true;
    }

    // Actualizar etiquetas del modal
    const modalTitle = document.getElementById('modalTitle');
    const recursoLabel = document.getElementById('recursoLabel');
    const recursoIcon = document.getElementById('recursoIcon');
    
    if (modalTitle) modalTitle.textContent = 'Crear Reserva de Vehículo';
    if (recursoLabel) recursoLabel.textContent = 'Vehículo *';
    if (recursoIcon) recursoIcon.className = 'fas fa-car me-2';
  },

  showSalaFields: function() {
    // Mostrar campo título
    const tituloField = document.getElementById('tituloField');
    const tituloInput = document.getElementById('titulo');
    if (tituloField) {
      tituloField.style.display = 'block';
    }
    if (tituloInput) {
      tituloInput.required = true;
    }

    // Ocultar campos de vehículo
    const responsableField = document.getElementById('responsableField');
    const destinoField = document.getElementById('destinoField');
    const fechaVueltaRow = document.getElementById('fechaVueltaRow');
    const responsableInput = document.getElementById('responsable');
    const destinoInput = document.getElementById('destino');
    const fechaVueltaInput = document.getElementById('fecha_vuelta');
    
    if (responsableField) {
      responsableField.style.display = 'none';
    }
    if (destinoField) {
      destinoField.style.display = 'none';
    }
    if (fechaVueltaRow) {
      fechaVueltaRow.style.display = 'none';
    }
    if (responsableInput) {
      responsableInput.required = false;
    }
    if (destinoInput) {
      destinoInput.required = false;
    }
    if (fechaVueltaInput) {
      fechaVueltaInput.required = false;
    }

    // Actualizar etiquetas del modal
    const modalTitle = document.getElementById('modalTitle');
    const recursoLabel = document.getElementById('recursoLabel');
    const recursoIcon = document.getElementById('recursoIcon');
    
    if (modalTitle) modalTitle.textContent = 'Crear Nueva Reserva';
    if (recursoLabel) recursoLabel.textContent = 'Sala *';
    if (recursoIcon) recursoIcon.className = 'fas fa-door-open me-2';
  },
  
  resetCrearModal: function() {
    // Resetear formulario
    const form = document.getElementById('formCrearReserva');
    if (form) {
      form.reset();
    }
    
    // Ocultar información de sala seleccionada
    const salaSelectedInfo = document.getElementById('salaSelectedInfo');
    if (salaSelectedInfo) {
      salaSelectedInfo.style.display = 'none';
    }
    
    // Resetear campos a estado por defecto (salas)
    this.showSalaFields();
  },
  
  crearReserva: function() {
    const form = document.getElementById('formCrearReserva');
    if (!form) return;
    
    // Validar formulario
    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }
    
    // Validación adicional de campos específicos
    const recurso = form.querySelector('#recurso').value;
    const titulo = form.querySelector('#titulo').value.trim();
    const fecha = form.querySelector('#fecha').value;
    const horaInicio = form.querySelector('#hora_inicio').value;
    const horaFin = form.querySelector('#hora_fin').value;
    const fechaVuelta = form.querySelector('#fecha_vuelta').value;
    const responsable = form.querySelector('#responsable').value.trim();
    const destino = form.querySelector('#destino').value.trim();
    
    // Obtener el tipo de recurso seleccionado
    const recursoSelect = form.querySelector('#recurso');
    const selectedOption = recursoSelect.options[recursoSelect.selectedIndex];
    const tipoRecurso = selectedOption ? selectedOption.getAttribute('data-tipo') : null;
    
    // Validar campos básicos obligatorios para todos los recursos
    if (!recurso || !fecha || !horaInicio || !horaFin) {
      if (window.CalendarioApp?.ModalFactory) {
        CalendarioApp.ModalFactory.utils.alert('Por favor, completa todos los campos obligatorios', { type: 'error' });
      }
      return;
    }
    
    // Validar campos específicos según el tipo de recurso
    if (tipoRecurso === 'vehiculo') {
      if (!responsable || !destino || !fechaVuelta) {
        if (window.CalendarioApp?.ModalFactory) {
          CalendarioApp.ModalFactory.utils.alert('Para vehículos, los campos Responsable, Destino y Fecha de vuelta son obligatorios', { type: 'error' });
        }
        return;
      }
    } else {
      if (!titulo) {
        if (window.CalendarioApp?.ModalFactory) {
          CalendarioApp.ModalFactory.utils.alert('Para salas, el campo Título es obligatorio', { type: 'error' });
        }
        return;
      }
    }
    
    // Validar que la hora de fin sea posterior a la de inicio
    if (tipoRecurso === 'vehiculo') {
      // Para vehículos, validar que fecha_vuelta sea posterior o igual a fecha
      if (fechaVuelta) {
        const fechaSalida = new Date(fecha);
        const fechaVueltaDate = new Date(fechaVuelta);
        if (fechaVueltaDate < fechaSalida) {
          if (window.CalendarioApp?.ModalFactory) {
            CalendarioApp.ModalFactory.utils.alert('La fecha de vuelta debe ser posterior o igual a la fecha de salida', { type: 'error' });
          }
          return;
        }
      }
    } else {
      // Para salas, validar que hora fin sea posterior a hora inicio
      if (horaInicio >= horaFin) {
        if (window.CalendarioApp?.ModalFactory) {
          CalendarioApp.ModalFactory.utils.alert('La hora de fin debe ser posterior a la hora de inicio', { type: 'error' });
        }
        return;
      }
    }
    
    // Validar conflictos de horarios
    this.validarConflictos(recurso, fecha, horaInicio, horaFin)
      .then(conflictos => {
        if (conflictos.length > 0) {
          const mensaje = conflictos.map(c => c.message).join('\n');
          if (window.CalendarioApp?.ModalFactory) {
            CalendarioApp.ModalFactory.utils.alert(`Conflictos encontrados:\n${mensaje}`, { type: 'error' });
          }
          return;
        }
        
        // Si no hay conflictos, proceder con el envío
        this.enviarReserva(form);
      })
      .catch(error => {
        console.error('Error al validar conflictos:', error);
        // Si hay error en la validación, proceder de todas formas
        this.enviarReserva(form);
      });
  },
  
  validarConflictos: function(recurso, fecha, horaInicio, horaFin) {
    const validarConflictoUrl = window.validarConflictoUrl || '/calendario/api/validar-conflicto/';
    const url = `${validarConflictoUrl}?sala=${recurso}&fecha=${fecha}&hora_inicio=${horaInicio}&hora_fin=${horaFin}`;
    
    CalendarioApp.Core.Logger.debug('Validando conflictos:', { recurso, fecha, horaInicio, horaFin });
    
    return fetch(url)
      .then(response => {
        if (!response.ok) {
          return response.json().then(errorData => {
            CalendarioApp.Core.Logger.warn('Conflictos detectados:', errorData);
            if (errorData.validation_errors && errorData.validation_errors.conflicts) {
              return errorData.validation_errors.conflicts;
            }
            if (errorData.message) {
              return [{ type: 'error', message: errorData.message }];
            }
            return [];
          });
        }
        return response.json().then(data => {
          CalendarioApp.Core.Logger.debug('Validación exitosa:', data);
          return data.conflicts || [];
        });
      })
      .catch(error => {
        CalendarioApp.Core.Logger.error('Error en validación de conflictos:', error);
        return [];
      });
  },
  
  enviarReserva: function(form) {
    // Mostrar loading global
    if (window.CalendarioApp?.StateManager) {
      CalendarioApp.StateManager.actions.setGlobalLoading(true);
    }
    
    // Mostrar loading en botón
    const btnCrear = document.getElementById('btnCrearReserva');
    if (btnCrear) {
      btnCrear.disabled = true;
      btnCrear.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Creando...';
    }
    
    // Obtener datos del formulario
    const formData = new FormData(form);
    
    // Enviar petición AJAX
    fetch(form.action, {
      method: 'POST',
      body: formData,
      headers: {
        'X-Requested-With': 'XMLHttpRequest',
        'X-CSRFToken': document.querySelector('[name=csrfmiddlewaretoken]').value
      }
    })
    .then(response => response.json())
    .then(data => {
      if (btnCrear) {
        btnCrear.disabled = false;
        btnCrear.innerHTML = '<i class="fas fa-plus me-2"></i>Crear Reserva';
      }
      
      if (window.CalendarioApp?.StateManager) {
        CalendarioApp.StateManager.actions.setGlobalLoading(false);
      }
      
      if (data.success) {
        if (window.CalendarioApp?.ModalFactory) {
          CalendarioApp.ModalFactory.utils.alert(data.message, { type: 'success' });
        }
        
        // Cerrar modal
        const modal = bootstrap.Modal.getInstance(document.getElementById('reservaModalCrear'));
        if (modal) {
          modal.hide();
        }
        
        // Actualizar calendario
        this.updateMainCalendar();
      } else {
        if (window.CalendarioApp?.ModalFactory) {
          CalendarioApp.ModalFactory.utils.alert(data.error || 'Error al crear la reserva', { type: 'error' });
        }
      }
    })
    .catch(error => {
      console.error('Error al crear reserva:', error);
      if (btnCrear) {
        btnCrear.disabled = false;
        btnCrear.innerHTML = '<i class="fas fa-plus me-2"></i>Crear Reserva';
      }
      
      if (window.CalendarioApp?.StateManager) {
        CalendarioApp.StateManager.actions.setGlobalLoading(false);
      }
      
      if (window.CalendarioApp?.ModalFactory) {
        CalendarioApp.ModalFactory.utils.alert('Error de conexión al crear la reserva', { type: 'error' });
      }
    });
  },
  
  setupTimeValidation: function(horaInicioSelect, horaFinSelect) {
    const self = this; // Guardar referencia al contexto
    
    // Verificar que los elementos existan antes de agregar event listeners
    if (!horaInicioSelect || !horaFinSelect) {
      console.warn('setupTimeValidation: Elementos no encontrados, saltando configuración');
      return;
    }
    
    horaInicioSelect.addEventListener('change', function() {
      const horaInicio = this.value;
      
      horaFinSelect.innerHTML = '<option value="">Seleccionar hora</option>';
      
      if (horaInicio) {
        const [hora, minuto] = horaInicio.split(':').map(Number);
        const horaInicioMinutos = hora * 60 + minuto;
        
        // Obtener la sala seleccionada para aplicar restricciones
        const recursoSelect = document.getElementById('recurso');
        const salaSeleccionada = recursoSelect ? recursoSelect.value : null;
        const esComedor = salaSeleccionada && self.isComedor(salaSeleccionada);
        const esVehiculo = salaSeleccionada && self.isVehiculo(salaSeleccionada);
        
        if (esVehiculo) {
          // Para vehículos: generar opciones 24/7 (hasta 00:00 del día siguiente)
          for (let h = 0; h < 24; h++) {
            for (let m = 0; m < 60; m += 30) {
              const horaActualMinutos = h * 60 + m;
              
              // Solo agregar si es posterior a la hora de inicio
              if (horaActualMinutos > horaInicioMinutos) {
                const horaStr = h.toString().padStart(2, '0');
                const minutoStr = m.toString().padStart(2, '0');
                const horaCompleta = `${horaStr}:${minutoStr}`;
                
                const option = new Option(horaCompleta, horaCompleta);
                horaFinSelect.add(option);
              }
            }
          }
          // Agregar 00:00 como opción final (fin del día siguiente)
          const option = new Option('00:00 (fin del día siguiente)', '00:00');
          horaFinSelect.add(option);
        } else if (esComedor) {
          // Horarios especiales para el comedor
          const horariosFinComedor = [
            '07:30', '08:00', '08:30', '09:00', '09:30', '10:00', '10:30', '11:00', '11:30', '12:00',
            '15:00', '15:30', '16:00', '16:30', '17:00', '17:30', '18:00', '18:30', '19:00'
          ];
          
          horariosFinComedor.forEach(horario => {
            const [h, m] = horario.split(':').map(Number);
            const horaActualMinutos = h * 60 + m;
            
            // Solo agregar si es posterior a la hora de inicio
            if (horaActualMinutos > horaInicioMinutos) {
              const option = new Option(horario, horario);
              horaFinSelect.add(option);
            }
          });
        } else {
          // Generar opciones de hora de fin para otras salas (7:30 a 19:00)
          for (let h = 7; h <= 16; h++) {
            for (let m = 0; m < 60; m += 30) {
              if (h === 7 && m < 30) continue; // Empezar desde 7:30
              if (h === 19 && m > 0) break; // Terminar en 19:00
              
              const horaActualMinutos = h * 60 + m;
              
              // Solo agregar si es posterior a la hora de inicio
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
      }
    });
  },
  
  isComedor: function(salaId) {
    // Verificar si la sala seleccionada es el comedor
    const recursoSelect = document.getElementById('recurso');
    if (!recursoSelect) return false;
    
    const option = recursoSelect.querySelector(`option[value="${salaId}"]`);
    if (!option) return false;
    
    const nombreSala = option.textContent.toLowerCase();
    return nombreSala.includes('comedor');
  },
  
  isVehiculo: function(recursoId) {
    // Verificar si el recurso seleccionado es un vehículo
    const recursoSelect = document.getElementById('recurso');
    if (!recursoSelect) return false;
    
    const option = recursoSelect.querySelector(`option[value="${recursoId}"]`);
    if (!option) return false;
    
    const tipo = option.getAttribute('data-tipo');
    return tipo === 'vehiculo';
  },
  
  updateTimeOptionsForSala: function() {
    const recursoSelect = document.getElementById('recurso');
    const horaInicioSelect = document.getElementById('hora_inicio');
    const horaFinSelect = document.getElementById('hora_fin');
    
    if (!recursoSelect || !horaInicioSelect || !horaFinSelect) return;
    
    const salaSeleccionada = recursoSelect.value;
    const esComedor = this.isComedor(salaSeleccionada);
    const esVehiculo = this.isVehiculo(salaSeleccionada);
    
    // Limpiar opciones actuales
    horaInicioSelect.innerHTML = '<option value="">Seleccionar hora</option>';
    horaFinSelect.innerHTML = '<option value="">Seleccionar hora</option>';
    
    // Generar opciones de hora de inicio según el tipo de recurso
    if (esVehiculo) {
      // Vehículos: 24/7 (00:00 a 23:30)
      for (let hora = 0; hora <= 23; hora++) {
        for (let minuto = 0; minuto < 60; minuto += 30) {
          const horaStr = hora.toString().padStart(2, '0');
          const minutoStr = minuto.toString().padStart(2, '0');
          const horaCompleta = `${horaStr}:${minutoStr}`;
          
          const option = new Option(horaCompleta, horaCompleta);
          horaInicioSelect.add(option);
        }
      }
    } else if (esComedor) {
      // Comedor: 7:00 a 11:30 y 14:30 a 18:30
      const horariosInicioComedor = [
        '07:00', '07:30', '08:00', '08:30', '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
        '14:30', '15:00', '15:30', '16:00', '16:30', '17:00', '17:30', '18:00', '18:30'
      ];
      
      horariosInicioComedor.forEach(horario => {
        const option = new Option(horario, horario);
        horaInicioSelect.add(option);
      });
    } else {
      // Otras salas: 7:00 a 18:30
      for (let hora = 7; hora <= 15; hora++) {
        for (let minuto = 0; minuto < 60; minuto += 30) {
          if (hora === 15 && minuto > 30) break;
          
          const horaStr = hora.toString().padStart(2, '0');
          const minutoStr = minuto.toString().padStart(2, '0');
          const horaCompleta = `${horaStr}:${minutoStr}`;
          
          const option = new Option(horaCompleta, horaCompleta);
          horaInicioSelect.add(option);
        }
      }
    }
    
    // Generar opciones de hora de fin (siempre 24/7 para vehículos, horarios laborales para salas)
    if (esVehiculo) {
      // Para vehículos: 24/7
      for (let hora = 0; hora <= 23; hora++) {
        for (let minuto = 0; minuto < 60; minuto += 30) {
          const horaStr = hora.toString().padStart(2, '0');
          const minutoStr = minuto.toString().padStart(2, '0');
          const horaCompleta = `${horaStr}:${minutoStr}`;
          
          const option = new Option(horaCompleta, horaCompleta);
          horaFinSelect.add(option);
        }
      }
    } else {
      // Para salas: horarios laborales
      for (let hora = 7; hora <= 16; hora++) {
        for (let minuto = 0; minuto < 60; minuto += 30) {
          if (hora === 16 && minuto > 0) break;
          
          const horaStr = hora.toString().padStart(2, '0');
          const minutoStr = minuto.toString().padStart(2, '0');
          const horaCompleta = `${horaStr}:${minutoStr}`;
          
          const option = new Option(horaCompleta, horaCompleta);
          horaFinSelect.add(option);
        }
      }
    }
  },
  
  setupMicroInteractions: function() {
    // Configurar acciones rápidas del selector de sala
    this.setupQuickActions();
  },
  
  setupQuickActions: function() {
    // Botón de detalles de sala
    const detailsBtn = document.getElementById('salaDetailsBtn');
    if (detailsBtn) {
      detailsBtn.addEventListener('click', () => {
        this.showRoomDetailsModal();
      });
    }
  },
  
  showRoomDetailsModal: function() {
    CalendarioApp.Core.Logger.debug('currentSalaFilter:', this.currentSalaFilter);
    CalendarioApp.Core.Logger.debug('salasData:', this.salasData);
    
    if (this.currentSalaFilter && this.salasData[this.currentSalaFilter]) {
      const salaData = this.salasData[this.currentSalaFilter];
      CalendarioApp.Core.Logger.debug('salaData encontrado:', salaData);
      
      const modal = new bootstrap.Modal(document.getElementById('salaDetailsModal'));
      
      // Actualizar título
      document.getElementById('salaDetailsTitle').textContent = `Detalles de ${salaData.nombre}`;
      
      // Mostrar contenido de detalles
      this.loadSalaDetails(salaData);
      
      modal.show();
    } else {
      console.error('No se encontró salaData para:', this.currentSalaFilter);
      if (window.CalendarioApp?.ModalFactory) {
        CalendarioApp.ModalFactory.utils.alert('Selecciona una sala para ver sus detalles', { type: 'warning' });
      }
    }
  },
  
  loadSalaDetails: function(salaData) {
    const content = document.getElementById('salaDetailsContent');
    
    // Debug: verificar que salaData tenga id
    CalendarioApp.Core.Logger.debug('salaData recibido:', salaData);
    
    if (!salaData || !salaData.id) {
      console.error('salaData no tiene id:', salaData);
      content.innerHTML = `
        <div class="alert alert-warning">
          <i class="fas fa-exclamation-triangle me-2"></i>
          Error: No se pudo obtener la información de la sala.
        </div>
      `;
      return;
    }
    
    // Mostrar loading
    content.innerHTML = `
      <div class="text-center py-4">
        <div class="loading-spinner"></div>
        <p class="mt-3 text-muted">Cargando detalles de la sala...</p>
      </div>
    `;
    
    // Hacer llamada AJAX para obtener datos reales
    fetch(`/calendario/api/sala/${salaData.id}/detalles/`)
      .then(response => {
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
      })
      .then(datosSala => {
        // Generar características dinámicamente
        const caracteristicasHTML = this.generateCaracteristicasHTML(datosSala.caracteristicas);
        
        content.innerHTML = `
          <div class="sala-details-card">
            <div class="sala-details-header">
              <div class="sala-color-preview" style="background-color: ${datosSala.color};">
                <i class="fas fa-door-open"></i>
              </div>
              <div class="sala-details-info">
                <h4 class="sala-name">${datosSala.nombre}</h4>
                <p class="sala-capacity">
                  <i class="fas fa-users me-2"></i>
                  Capacidad: ${datosSala.capacidad} personas
                </p>
              </div>
            </div>
            
            <div class="sala-description">
              <h6><i class="fas fa-info-circle me-2"></i>Descripción</h6>
              <p>${datosSala.descripcion_detallada}</p>
            </div>
            
            <div class="sala-features">
              <h6><i class="fas fa-cogs me-2"></i>Características</h6>
              <div class="row">
                <div class="col-md-6">
                  ${caracteristicasHTML}
                </div>
              </div>
            </div>
            
            <div class="sala-availability">
              <h6><i class="fas fa-clock me-2"></i>Disponibilidad</h6>
              <p class="text-muted">Horario de uso: ${datosSala.horario_uso}</p>
              <div class="availability-status">
                <span class="badge-modern badge-success">
                  <i class="fas fa-circle me-1"></i>Disponible
                </span>
              </div>
            </div>
          </div>
        `;
      })
      .catch(error => {
        console.error('Error cargando detalles de sala:', error);
        // Fallback a datos básicos si falla la API
        content.innerHTML = `
          <div class="sala-details-card">
            <div class="sala-details-header">
              <div class="sala-color-preview" style="background-color: ${salaData.color};">
                <i class="fas fa-door-open"></i>
              </div>
              <div class="sala-details-info">
                <h4 class="sala-name">${salaData.nombre}</h4>
                <p class="sala-capacity">
                  <i class="fas fa-users me-2"></i>
                  Capacidad: ${salaData.capacidad} personas
                </p>
              </div>
            </div>
            
            <div class="sala-description">
              <h6><i class="fas fa-info-circle me-2"></i>Descripción</h6>
              <p>Sala de reunión equipada con proyector, pizarra y sistema de videoconferencia. Ideal para reuniones de equipo y presentaciones.</p>
            </div>
            
            <div class="sala-availability">
              <h6><i class="fas fa-clock me-2"></i>Disponibilidad</h6>
              <p class="text-muted">Horario de uso: Lunes a Viernes de 7:00 AM a 4:00 PM</p>
              <div class="availability-status">
                <span class="badge-modern badge-success">
                  <i class="fas fa-circle me-1"></i>Disponible
                </span>
              </div>
            </div>
          </div>
        `;
      });
  },
  
  generateCaracteristicasHTML: function(caracteristicas) {
    if (!caracteristicas || caracteristicas.length === 0) {
      return '<p class="text-muted">No hay características específicas configuradas.</p>';
    }
    
    const caracteristicasHTML = caracteristicas.map(caracteristica => 
      `<li><i class="fas fa-check text-success me-2"></i>${caracteristica}</li>`
    ).join('');
    
    return `<ul class="list-unstyled">${caracteristicasHTML}</ul>`;
  },
  
  initializeColorSystem: function() {
    // Sistema de colores dinámicos para salas
    const salaFilter = document.getElementById('salaFilter');
    if (salaFilter) {
      this.updateSalaInfo();
    }
  },
  
  updateSalaInfo: function() {
    const salaFilter = document.getElementById('salaFilter');
    const salaColorPreview = document.getElementById('salaColorPreview');
    const salaName = document.getElementById('salaName');
    const salaCapacityValue = document.getElementById('salaCapacityValue');
    const salaStatus = document.getElementById('salaStatus');
    
    if (salaFilter && this.currentSalaFilter) {
      const salaData = this.salasData[this.currentSalaFilter];
      if (salaData) {
        // Actualizar preview de color
        if (salaColorPreview) {
          salaColorPreview.style.backgroundColor = salaData.color;
          salaColorPreview.innerHTML = '<i class="fas fa-door-open"></i>';
        }
        
        // Actualizar nombre de la sala
        if (salaName) {
          salaName.textContent = salaData.nombre;
        }
        
        // Actualizar capacidad
        if (salaCapacityValue) {
          salaCapacityValue.textContent = salaData.capacidad;
        }
        
        // Actualizar estado (simulado por ahora)
        if (salaStatus) {
          const statusElement = salaStatus.querySelector('span');
          if (statusElement) {
            statusElement.textContent = 'Disponible';
            salaStatus.className = 'sala-status';
          }
        }
        
        // Actualizar título del calendario
        const salaTitulo = document.getElementById('salaTitulo');
        if (salaTitulo) {
          salaTitulo.textContent = `Calendario de ${salaData.nombre}`;
        }
      }
    }
  },
  
  updateMainCalendar: function() {
    if (this.calendar) {
      this.calendar.refetchEvents();
    }
  }
};

// ===== INICIALIZACIÓN =====
document.addEventListener('DOMContentLoaded', function() {
  // Esperar a que se configuren las URLs antes de inicializar el calendario
  const initCalendar = () => {
    // Configurar URLs de API si están disponibles
    if (window.calendarioApiUrl) {
      if (window.CalendarioApp?.Core) {
        CalendarioApp.Core.urls.api.reservas = window.calendarioApiUrl;
      }
    }
    if (window.crearReservaUrl) {
      if (window.CalendarioApp?.Core) {
        CalendarioApp.Core.urls.api.crearReserva = window.crearReservaUrl;
      }
    }
    if (window.horariosOcupadosUrl) {
      if (window.CalendarioApp?.Core) {
        CalendarioApp.Core.urls.api.horariosOcupados = window.horariosOcupadosUrl;
      }
    }
    if (window.logoutUrl) {
      if (window.CalendarioApp?.Core) {
        CalendarioApp.Core.urls.views.logout = window.logoutUrl;
      }
    }
    
    // Inicializar calendario si existe
    if (document.getElementById('calendar')) {
      CalendarioApp.Calendar.init();
    }
    
    CalendarioApp.Core.Logger.debug('CalendarioApp.Calendar inicializado correctamente');
  };
  
  // Si las URLs ya están configuradas, inicializar inmediatamente
  if (window.calendarioApiUrl) {
    initCalendar();
  } else {
    // Si no, esperar un poco y verificar de nuevo
    setTimeout(() => {
      if (window.calendarioApiUrl) {
        initCalendar();
      } else {
        CalendarioApp.Core.Logger.warn('URLs de API no configuradas, inicializando sin calendario');
        initCalendar();
      }
    }, 100);
  }
});

// Hacer disponible globalmente
window.CalendarioMain = CalendarioApp.Calendar;
