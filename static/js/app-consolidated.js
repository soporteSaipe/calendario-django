/**
 * SISTEMA JAVASCRIPT CONSOLIDADO
 * Todas las funcionalidades principales en un solo archivo optimizado
 */

// ===== CONFIGURACIÓN GLOBAL =====
window.CalendarioApp = window.CalendarioApp || {};

// Configuración de la aplicación
CalendarioApp.config = {
  version: '1.0.0',
  debug: false,
  animationDuration: 300,
  notificationDuration: 5000,
  apiEndpoints: {
    reservas: null,
    crearReserva: null,
    horariosOcupados: null,
    logout: null
  }
};

// ===== SISTEMA DE NOTIFICACIONES =====
CalendarioApp.Notifications = {
  container: null,
  
  init: function() {
    this.createContainer();
  },
  
  createContainer: function() {
    if (!this.container) {
      this.container = document.createElement('div');
      this.container.id = 'notifications-container';
      this.container.className = 'notifications-container';
      document.body.appendChild(this.container);
    }
  },
  
  show: function(message, type = 'info', duration = 5000, options = {}) {
    const notification = this.createNotification(message, type, options);
    this.displayNotification(notification, duration);
    return notification;
  },
  
  createNotification: function(message, type, options = {}) {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.setAttribute('role', 'alert');
    notification.setAttribute('aria-live', 'polite');
    
    const icons = {
      success: 'fas fa-check-circle',
      error: 'fas fa-exclamation-circle',
      warning: 'fas fa-exclamation-triangle',
      info: 'fas fa-info-circle',
      loading: 'fas fa-spinner fa-spin'
    };
    
    const icon = options.icon || icons[type] || icons.info;
    
    notification.innerHTML = `
      <div class="notification-content">
        <div class="notification-icon">
          <i class="${icon}" aria-hidden="true"></i>
        </div>
        <div class="notification-message">
          <div class="notification-title">${options.title || this.getDefaultTitle(type)}</div>
          <div class="notification-text">${message}</div>
        </div>
        ${options.closable !== false ? `
          <button class="notification-close" aria-label="Cerrar notificación">
            <i class="fas fa-times" aria-hidden="true"></i>
          </button>
        ` : ''}
      </div>
      ${options.progress !== false ? '<div class="notification-progress"></div>' : ''}
    `;
    
    const closeBtn = notification.querySelector('.notification-close');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => this.hide(notification));
    }
    
    return notification;
  },
  
  displayNotification: function(notification, duration) {
    this.init();
    this.container.appendChild(notification);
    
    this.announceToScreenReader(notification.textContent);
    
    if (duration > 0) {
      setTimeout(() => this.hide(notification), duration);
    }
  },
  
  hide: function(notification) {
    if (!notification || !notification.parentNode) return;
    
    notification.classList.add('notification-hiding');
    
    setTimeout(() => {
      if (notification.parentNode) {
        notification.parentNode.removeChild(notification);
      }
    }, 300);
  },
  
  getDefaultTitle: function(type) {
    const titles = {
      success: 'Éxito',
      error: 'Error',
      warning: 'Advertencia',
      info: 'Información',
      loading: 'Procesando...'
    };
    return titles[type] || 'Notificación';
  },
  
  announceToScreenReader: function(message) {
    const announcement = document.createElement('div');
    announcement.setAttribute('aria-live', 'polite');
    announcement.setAttribute('aria-atomic', 'true');
    announcement.className = 'sr-only';
    announcement.textContent = message;
    
    document.body.appendChild(announcement);
    
    setTimeout(() => {
      if (announcement.parentNode) {
        document.body.removeChild(announcement);
      }
    }, 1000);
  },
  
  // Métodos de conveniencia
  success: function(message, options = {}) {
    return this.show(message, 'success', 4000, options);
  },
  
  error: function(message, options = {}) {
    return this.show(message, 'error', 6000, options);
  },
  
  warning: function(message, options = {}) {
    return this.show(message, 'warning', 5000, options);
  },
  
  info: function(message, options = {}) {
    return this.show(message, 'info', 4000, options);
  },
  
  confirm: function(message, options = {}) {
    return new Promise((resolve) => {
      const modal = document.createElement('div');
      modal.className = 'modal fade';
      modal.innerHTML = `
        <div class="modal-dialog">
          <div class="modal-content modal-content-modern">
            <div class="modal-header modal-header-modern">
              <h5 class="modal-title modal-title-modern">
                <i class="fas fa-question-circle me-2"></i>
                ${options.title || 'Confirmar acción'}
              </h5>
              <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
            </div>
            <div class="modal-body">
              <p>${message}</p>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn-modern btn-secondary-modern" data-bs-dismiss="modal">
                <i class="fas fa-times me-2"></i>${options.cancelText || 'Cancelar'}
              </button>
              <button type="button" class="btn-modern btn-danger-modern" id="confirmBtn">
                <i class="fas fa-check me-2"></i>${options.confirmText || 'Confirmar'}
              </button>
            </div>
          </div>
        </div>
      `;
      
      document.body.appendChild(modal);
      const bsModal = new bootstrap.Modal(modal);
      
      modal.querySelector('#confirmBtn').addEventListener('click', () => {
        bsModal.hide();
        resolve(true);
      });
      
      modal.addEventListener('hidden.bs.modal', () => {
        document.body.removeChild(modal);
        resolve(false);
      });
      
      bsModal.show();
    });
  }
};

// ===== SISTEMA DE ACCESIBILIDAD =====
CalendarioApp.Accessibility = {
  init: function() {
    this.setupKeyboardNavigation();
    this.setupButtonLoadingStates();
    this.setupFormValidation();
    this.setupAutoAnnouncements();
  },
  
  setupKeyboardNavigation: function() {
    // Navegación por teclado en modales
    document.addEventListener('keydown', function(e) {
      if (e.key === 'Escape') {
        const openModal = document.querySelector('.modal.show');
        if (openModal) {
          const modal = bootstrap.Modal.getInstance(openModal);
          if (modal) {
            modal.hide();
          }
        }
      }
    });

    // Navegación por teclado en formularios
    document.addEventListener('keydown', function(e) {
      if (e.key === 'Enter' && e.target.classList.contains('form-control-modern')) {
        const form = e.target.closest('form');
        if (form) {
          const submitBtn = form.querySelector('button[type="submit"]');
          if (submitBtn && !submitBtn.disabled) {
            submitBtn.click();
          }
        }
      }
    });
  },
  
  setupButtonLoadingStates: function() {
    document.addEventListener('click', function(e) {
      const button = e.target.closest('button[type="submit"]');
      if (button && button.form) {
        CalendarioApp.Accessibility.setButtonLoading(button, true);
        
        setTimeout(() => {
          CalendarioApp.Accessibility.setButtonLoading(button, false);
        }, 2000);
      }
    });
  },
  
  setButtonLoading: function(button, loading) {
    if (loading) {
      button.classList.add('loading');
      button.disabled = true;
      button.setAttribute('aria-disabled', 'true');
      
      const originalText = button.innerHTML;
      button.setAttribute('data-original-text', originalText);
      
      button.innerHTML = '<span class="sr-only">Procesando...</span>';
    } else {
      button.classList.remove('loading');
      button.disabled = false;
      button.removeAttribute('aria-disabled');
      
      const originalText = button.getAttribute('data-original-text');
      if (originalText) {
        button.innerHTML = originalText;
        button.removeAttribute('data-original-text');
      }
    }
  },
  
  setupFormValidation: function() {
    // Validación en tiempo real para campos requeridos
    document.querySelectorAll('input[required], select[required], textarea[required]').forEach(field => {
      field.addEventListener('blur', function() {
        CalendarioApp.Accessibility.validateField(this);
      });

      field.addEventListener('input', function() {
        if (this.classList.contains('is-invalid')) {
          this.classList.remove('is-invalid');
          CalendarioApp.Accessibility.hideValidationMessage(this.id);
        }
      });
    });

    // Validación de formularios al enviar
    const forms = document.querySelectorAll('form:not([action*="login"])');
    
    forms.forEach((form, index) => {
      form.addEventListener('submit', function(e) {
        const requiredFields = this.querySelectorAll('input[required], select[required], textarea[required]');
        
        let isValid = true;
        
        requiredFields.forEach(field => {
          if (!field.value.trim()) {
            field.classList.add('is-invalid');
            isValid = false;
          } else {
            field.classList.remove('is-invalid');
            field.classList.add('is-valid');
          }
        });
        
        if (!isValid) {
          e.preventDefault();
        }
      });
    });
  },
  
  validateField: function(field) {
    const isValid = field.checkValidity();
    const fieldId = field.id;
    
    if (isValid) {
      field.classList.remove('is-invalid');
      field.classList.add('is-valid');
      this.hideValidationMessage(fieldId);
    } else {
      field.classList.remove('is-valid');
      field.classList.add('is-invalid');
      
      let message = field.validationMessage;
      if (field.validity.valueMissing) {
        message = 'Este campo es obligatorio';
      } else if (field.validity.typeMismatch) {
        message = 'Por favor, ingresa un formato válido';
      }
      
      this.showValidationMessage(fieldId, message, 'error');
    }
    
    return isValid;
  },
  
  showValidationMessage: function(elementId, message, type = 'error') {
    const element = document.getElementById(elementId);
    if (!element) return;

    const validationDiv = element.querySelector('.validation-message') || 
                         element.parentElement.querySelector('.validation-message');
    
    if (validationDiv) {
      validationDiv.className = `validation-message ${type}`;
      validationDiv.innerHTML = `
        <i class="fas fa-${type === 'error' ? 'exclamation-circle' : 'check-circle'}" aria-hidden="true"></i>
        <span>${message}</span>
      `;
      validationDiv.style.display = 'flex';
      
      validationDiv.setAttribute('aria-live', 'polite');
    }
  },
  
  hideValidationMessage: function(elementId) {
    const element = document.getElementById(elementId);
    if (!element) return;

    const validationDiv = element.querySelector('.validation-message') || 
                         element.parentElement.querySelector('.validation-message');
    
    if (validationDiv) {
      validationDiv.style.display = 'none';
      validationDiv.removeAttribute('aria-live');
    }
  },
  
  setupAutoAnnouncements: function() {
    // Anunciar cuando se muestre un modal
    document.addEventListener('shown.bs.modal', function(e) {
      const modalTitle = e.target.querySelector('.modal-title');
      if (modalTitle) {
        CalendarioApp.Accessibility.announceToScreenReader(
          `Modal abierto: ${modalTitle.textContent}`
        );
      }
    });

    // Anunciar cuando se oculte un modal
    document.addEventListener('hidden.bs.modal', function(e) {
      CalendarioApp.Accessibility.announceToScreenReader('Modal cerrado');
    });
  },
  
  announceToScreenReader: function(message, priority = 'polite') {
    const announcement = document.createElement('div');
    announcement.setAttribute('aria-live', priority);
    announcement.setAttribute('aria-atomic', 'true');
    announcement.className = 'sr-only';
    announcement.textContent = message;
    
    document.body.appendChild(announcement);
    
    setTimeout(() => {
      if (announcement.parentNode) {
        document.body.removeChild(announcement);
      }
    }, 1000);
  },
  
  showGlobalLoading: function(message = 'Procesando solicitud...', subtext = '') {
    // Crear overlay de carga global
    let loadingOverlay = document.getElementById('globalLoadingOverlay');
    
    if (!loadingOverlay) {
      loadingOverlay = document.createElement('div');
      loadingOverlay.id = 'globalLoadingOverlay';
      loadingOverlay.className = 'loading-overlay';
      document.body.appendChild(loadingOverlay);
    }
    
    loadingOverlay.innerHTML = `
      <div class="loading-content">
        <div class="loading-spinner"></div>
        <div class="loading-text">${message}</div>
        ${subtext ? `<div class="loading-subtext">${subtext}</div>` : ''}
        <div class="loading-progress">
          <div class="loading-progress-bar"></div>
        </div>
      </div>
    `;
    
    loadingOverlay.classList.add('show');
    loadingOverlay.setAttribute('aria-hidden', 'false');
    
    // Animar la barra de progreso
    setTimeout(() => {
      const progressBar = loadingOverlay.querySelector('.loading-progress-bar');
      if (progressBar) {
        progressBar.style.width = '100%';
      }
    }, 100);
  },
  
  hideGlobalLoading: function() {
    const loadingOverlay = document.getElementById('globalLoadingOverlay');
    if (loadingOverlay) {
      loadingOverlay.classList.remove('show');
      setTimeout(() => {
        loadingOverlay.setAttribute('aria-hidden', 'true');
      }, 300);
    }
  }
};

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
    
    // Establecer vista semanal por defecto
    this.calendar.changeView('timeGridWeek');
  },
  
  initializeSalasData: function() {
    this.salasData = {};
    const salaOptions = document.querySelectorAll('#salaFilter option');
    
    salaOptions.forEach(function(option) {
      if (option.value) {
        const textContent = option.textContent.trim();
        const match = textContent.match(/capacidad: (\d+)/);
        const capacidad = match ? parseInt(match[1]) : 1;
        
        this.salasData[option.value] = {
          nombre: textContent.split(' (')[0].trim(),
          color: option.getAttribute('data-color') || '#64748B',
          capacidad: capacidad
        };
      }
    }.bind(this));
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
          slotMinTime: '07:00:00',
          slotMaxTime: '18:00:00',
          slotDuration: '00:30:00'
        },
        timeGridWeek: {
          slotMinTime: '07:00:00',
          slotMaxTime: '18:00:00',
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
      slotMaxTime: '16:00:00',
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
    const apiUrl = window.calendarioApiUrl || CalendarioApp.config.apiEndpoints.reservas;
    
    if (!apiUrl) {
      console.error('URL de API no configurada');
      CalendarioApp.Notifications.error('Error de configuración: URL de API no encontrada');
      return [];
    }
    
    const url = apiUrl + '?sala=' + this.currentSalaFilter;
    console.log('Cargando eventos desde URL:', url);
    
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
        CalendarioApp.Notifications.error('Error al cargar eventos del calendario');
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
    const crearReservaUrl = window.crearReservaUrl || CalendarioApp.config.apiEndpoints.crearReserva;
    
    if (crearReservaUrl) {
      const url = crearReservaUrl + '?fecha=' + fecha;
      window.location.href = url;
    } else {
      CalendarioApp.Notifications.warning('URL de creación de reserva no configurada');
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
      this.generateTimeOptions(horaInicioSelect, horaFinSelect);
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
      });
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
    
    
    // Resetear título
    const modalTitle = document.getElementById('reservaModalCrearLabel');
    if (modalTitle) {
      modalTitle.textContent = 'Crear Nueva Reserva';
    }
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
    
    if (!recurso || !titulo || !fecha || !horaInicio || !horaFin) {
      CalendarioApp.Notifications.error('Por favor, completa todos los campos obligatorios');
      return;
    }
    
    // Validar que la hora de fin sea posterior a la de inicio
    if (horaInicio >= horaFin) {
      CalendarioApp.Notifications.error('La hora de fin debe ser posterior a la hora de inicio');
      return;
    }
    
    // Validar conflictos de horarios
    this.validarConflictos(recurso, fecha, horaInicio, horaFin)
      .then(conflictos => {
        if (conflictos.length > 0) {
          const mensaje = conflictos.map(c => c.message).join('\n');
          CalendarioApp.Notifications.error(`Conflictos encontrados:\n${mensaje}`);
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
    const url = `${window.horariosOcupadosUrl}?recurso_id=${recurso}&fecha=${fecha}&hora_inicio=${horaInicio}&hora_fin=${horaFin}`;
    
    return fetch(url)
      .then(response => response.json())
      .then(data => {
        if (data.conflicts) {
          return data.conflicts;
        }
        return [];
      });
  },
  
  enviarReserva: function(form) {
    // Mostrar loading global
    CalendarioApp.Accessibility.showGlobalLoading(
      'Creando reserva...', 
      'Esto puede tomar unos segundos'
    );
    
    // Mostrar loading en botón
    const btnCrear = document.getElementById('btnCrearReserva');
    CalendarioApp.Accessibility.setButtonLoading(btnCrear, true);
    
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
      CalendarioApp.Accessibility.setButtonLoading(btnCrear, false);
      CalendarioApp.Accessibility.hideGlobalLoading();
      
      if (data.success) {
        CalendarioApp.Notifications.success(data.message);
        
        // Cerrar modal
        const modal = bootstrap.Modal.getInstance(document.getElementById('reservaModalCrear'));
        if (modal) {
          modal.hide();
        }
        
        // Actualizar calendario
        this.updateMainCalendar();
      } else {
        CalendarioApp.Notifications.error(data.error || 'Error al crear la reserva');
      }
    })
    .catch(error => {
      console.error('Error al crear reserva:', error);
      CalendarioApp.Accessibility.setButtonLoading(btnCrear, false);
      CalendarioApp.Accessibility.hideGlobalLoading();
      CalendarioApp.Notifications.error('Error de conexión al crear la reserva');
    });
  },
  
  
  
  generateTimeOptions: function(horaInicioSelect, horaFinSelect) {
    horaInicioSelect.innerHTML = '<option value="">Seleccionar hora</option>';
    horaFinSelect.innerHTML = '<option value="">Seleccionar hora</option>';
    
    // Generar opciones de hora de inicio (7:00 a 15:30)
    for (let hora = 7; hora <= 15; hora++) {
      for (let minuto = 0; minuto < 60; minuto += 30) {
        if (hora === 15 && minuto > 30) break;
        
        const horaStr = hora.toString().padStart(2, '0');
        const minutoStr = minuto.toString().padStart(2, '0');
        const horaCompleta = `${horaStr}:${minutoStr}`;
        
        const optionInicio = new Option(horaCompleta, horaCompleta);
        horaInicioSelect.add(optionInicio);
      }
    }
    
    // Generar opciones de hora de fin (7:30 a 16:00)
    for (let hora = 7; hora <= 16; hora++) {
      for (let minuto = 0; minuto < 60; minuto += 30) {
        if (hora === 7 && minuto < 30) continue; // Empezar desde 7:30
        if (hora === 16 && minuto > 0) break; // Terminar en 16:00
        
        const horaStr = hora.toString().padStart(2, '0');
        const minutoStr = minuto.toString().padStart(2, '0');
        const horaCompleta = `${horaStr}:${minutoStr}`;
        
        const optionFin = new Option(horaCompleta, horaCompleta);
        horaFinSelect.add(optionFin);
      }
    }
    
    const fechaInput = document.getElementById('fecha');
    if (fechaInput) {
      const today = new Date();
      fechaInput.min = today.toISOString().split('T')[0];
    }
  },
  
  setupTimeValidation: function(horaInicioSelect, horaFinSelect) {
    const self = this; // Guardar referencia al contexto
    
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
        
        // Generar opciones de hora de fin (7:30 a 16:00)
        for (let h = 7; h <= 16; h++) {
          for (let m = 0; m < 60; m += 30) {
            if (h === 7 && m < 30) continue; // Empezar desde 7:30
            if (h === 16 && m > 0) break; // Terminar en 16:00
            
            const horaActualMinutos = h * 60 + m;
            
            // Solo agregar si es posterior a la hora de inicio
            if (horaActualMinutos > horaInicioMinutos) {
              // Aplicar restricciones del comedor
              if (esComedor) {
                // No permitir reservas que se extiendan durante el horario de comida (12:00-14:30)
                const horaFinMinutos = horaActualMinutos;
                const inicioComida = 12 * 60; // 12:00
                const finComida = 14 * 60 + 30; // 14:30
                
                // Si la reserva se extiende durante el horario de comida, no permitir
                if (horaInicioMinutos < finComida && horaFinMinutos > inicioComida) {
                  continue;
                }
              }
              
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
  
  updateTimeOptionsForSala: function() {
    const recursoSelect = document.getElementById('recurso');
    const horaInicioSelect = document.getElementById('hora_inicio');
    const horaFinSelect = document.getElementById('hora_fin');
    
    if (!recursoSelect || !horaInicioSelect || !horaFinSelect) return;
    
    const salaSeleccionada = recursoSelect.value;
    const esComedor = this.isComedor(salaSeleccionada);
    
    // Limpiar opciones actuales
    horaInicioSelect.innerHTML = '<option value="">Seleccionar hora</option>';
    horaFinSelect.innerHTML = '<option value="">Seleccionar hora</option>';
    
    // Generar opciones de hora de inicio según la sala
    if (esComedor) {
      // Comedor: 7:00 a 11:30
      for (let hora = 7; hora <= 11; hora++) {
        for (let minuto = 0; minuto < 60; minuto += 30) {
          if (hora === 11 && minuto > 30) break;
          
          const horaStr = hora.toString().padStart(2, '0');
          const minutoStr = minuto.toString().padStart(2, '0');
          const horaCompleta = `${horaStr}:${minutoStr}`;
          
          const option = new Option(horaCompleta, horaCompleta);
          horaInicioSelect.add(option);
        }
      }
    } else {
      // Otras salas: 7:00 a 15:30
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
  },
  
  setupMicroInteractions: function() {
    // Efectos hover en cards
    document.querySelectorAll('.card-modern').forEach(card => {
      card.addEventListener('mouseenter', function() {
        this.style.transform = 'translateY(-2px)';
      });
      
      card.addEventListener('mouseleave', function() {
        this.style.transform = 'translateY(0)';
      });
    });
    
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
    if (this.currentSalaFilter && this.salasData[this.currentSalaFilter]) {
      const salaData = this.salasData[this.currentSalaFilter];
      const modal = new bootstrap.Modal(document.getElementById('salaDetailsModal'));
      
      // Actualizar título
      document.getElementById('salaDetailsTitle').textContent = `Detalles de ${salaData.nombre}`;
      
      // Mostrar contenido de detalles
      this.loadSalaDetails(salaData);
      
      modal.show();
    } else {
      CalendarioApp.Notifications.warning('Selecciona una sala para ver sus detalles');
    }
  },
  
  loadSalaDetails: function(salaData) {
    const content = document.getElementById('salaDetailsContent');
    
    // Simular carga de datos de la base de datos
    // En una implementación real, aquí harías una llamada AJAX
    setTimeout(() => {
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
            <p>${salaData.descripcion || 'Sala de reunión equipada con proyector, pizarra y sistema de videoconferencia. Ideal para reuniones de equipo y presentaciones.'}</p>
          </div>
          
          <div class="sala-features">
            <h6><i class="fas fa-cogs me-2"></i>Características</h6>
            <div class="row">
              <div class="col-md-6">
                <ul class="list-unstyled">
                  <li><i class="fas fa-check text-success me-2"></i>Proyector HD</li>
                  <li><i class="fas fa-check text-success me-2"></i>Pizarra blanca</li>
                  <li><i class="fas fa-check text-success me-2"></i>Sistema de audio</li>
                </ul>
              </div>
              <div class="col-md-6">
                <ul class="list-unstyled">
                  <li><i class="fas fa-check text-success me-2"></i>Videoconferencia</li>
                  <li><i class="fas fa-check text-success me-2"></i>WiFi de alta velocidad</li>
                  <li><i class="fas fa-check text-success me-2"></i>Climatización</li>
                </ul>
              </div>
            </div>
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
    }, 500);
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

// ===== FUNCIONES DE UTILIDAD =====
CalendarioApp.Utils = {
  debounce: function(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  },
  
  throttle: function(func, limit) {
    let inThrottle;
    return function() {
      const args = arguments;
      const context = this;
      if (!inThrottle) {
        func.apply(context, args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    };
  },
  
  formatDate: function(date, format = 'es-ES') {
    return new Date(date).toLocaleDateString(format);
  },
  
  formatTime: function(date, format = 'es-ES') {
    return new Date(date).toLocaleTimeString(format, {
      hour: '2-digit',
      minute: '2-digit'
    });
  }
};

// ===== INICIALIZACIÓN =====
document.addEventListener('DOMContentLoaded', function() {
  // Inicializar sistemas básicos
  CalendarioApp.Notifications.init();
  CalendarioApp.Accessibility.init();
  
  // Esperar a que se configuren las URLs antes de inicializar el calendario
  const initCalendar = () => {
    // Configurar URLs de API si están disponibles
    if (window.calendarioApiUrl) {
      CalendarioApp.config.apiEndpoints.reservas = window.calendarioApiUrl;
    }
    if (window.crearReservaUrl) {
      CalendarioApp.config.apiEndpoints.crearReserva = window.crearReservaUrl;
    }
    if (window.horariosOcupadosUrl) {
      CalendarioApp.config.apiEndpoints.horariosOcupados = window.horariosOcupadosUrl;
    }
    if (window.logoutUrl) {
      CalendarioApp.config.apiEndpoints.logout = window.logoutUrl;
    }
    
    // Inicializar calendario si existe
    if (document.getElementById('calendar')) {
      CalendarioApp.Calendar.init();
    }
    
    console.log('CalendarioApp inicializado correctamente');
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
        console.warn('URLs de API no configuradas, inicializando sin calendario');
        initCalendar();
      }
    }, 100);
  }
});

// ===== FUNCIONES GLOBALES PARA COMPATIBILIDAD =====
window.handleLogout = function() {
  // Mostrar confirmación
  CalendarioApp.Notifications.confirm(
    '¿Estás seguro de que quieres cerrar sesión?',
    {
      title: 'Confirmar cierre de sesión',
      icon: 'fas fa-sign-out-alt',
      confirmText: 'Sí, cerrar sesión',
      cancelText: 'Cancelar'
    }
  ).then(function(confirmed) {
    if (confirmed) {
      // Mostrar notificación de procesamiento
      CalendarioApp.Notifications.show('Cerrando sesión...', 'loading', 0, {
        title: 'Procesando',
        icon: 'fas fa-spinner fa-spin',
        closable: false
      });
      
      // Crear y enviar formulario de logout
      const form = document.createElement('form');
      form.method = 'post';
      form.action = window.logoutUrl || CalendarioApp.config.apiEndpoints.logout || '/logout/';
      
      const csrfToken = document.createElement('input');
      csrfToken.type = 'hidden';
      csrfToken.name = 'csrfmiddlewaretoken';
      csrfToken.value = document.querySelector('[name=csrfmiddlewaretoken]')?.value || '';
      
      form.appendChild(csrfToken);
      document.body.appendChild(form);
      form.submit();
    }
  });
};

window.crearReserva = function() {
  // Implementar lógica de creación de reserva
  CalendarioApp.Notifications.info('Funcionalidad de creación de reserva en desarrollo');
};
