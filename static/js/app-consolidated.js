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
        return CalendarioApp.config.apiEndpoints.reservas;
      }
    }
    
    const url = CalendarioApp.config.apiEndpoints.reservas + '?sala=' + this.currentSalaFilter;
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
    const modal = new bootstrap.Modal(document.getElementById('reservaModal'));
    
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
          <span class="badge bg-${this.getEstadoColor(event.extendedProps && event.extendedProps.estado ? event.extendedProps.estado : 'desconocido')}">
            ${event.extendedProps && event.extendedProps.estado ? event.extendedProps.estado : 'Desconocido'}
          </span>
        </div>
      </div>
    `;
    
    modal.show();
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
    
    const reservarBtn = document.querySelector('a[href*="crear_reserva"]');
    if (reservarBtn) {
      const fecha = info.dateStr;
      const url = CalendarioApp.config.apiEndpoints.crearReserva + '?fecha=' + fecha;
      window.location.href = url;
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
    const horaInicioSelect = document.getElementById('id_hora_inicio');
    const horaFinSelect = document.getElementById('id_hora_fin');
    
    if (horaInicioSelect && horaFinSelect) {
      this.generateTimeOptions(horaInicioSelect, horaFinSelect);
      this.setupTimeValidation(horaInicioSelect, horaFinSelect);
    }
  },
  
  generateTimeOptions: function(horaInicioSelect, horaFinSelect) {
    horaInicioSelect.innerHTML = '<option value="">Seleccionar hora</option>';
    horaFinSelect.innerHTML = '<option value="">Seleccionar hora</option>';
    
    for (let hora = 7; hora <= 15; hora++) {
      for (let minuto = 0; minuto < 60; minuto += 30) {
        if (hora === 15 && minuto > 30) break;
        
        const horaStr = hora.toString().padStart(2, '0');
        const minutoStr = minuto.toString().padStart(2, '0');
        const horaCompleta = `${horaStr}:${minutoStr}`;
        
        const optionInicio = new Option(horaCompleta, horaCompleta);
        const optionFin = new Option(horaCompleta, horaCompleta);
        
        horaInicioSelect.add(optionInicio);
        horaFinSelect.add(optionFin);
      }
    }
    
    const fechaInput = document.getElementById('id_fecha');
    if (fechaInput) {
      const today = new Date();
      fechaInput.min = today.toISOString().split('T')[0];
    }
  },
  
  setupTimeValidation: function(horaInicioSelect, horaFinSelect) {
    horaInicioSelect.addEventListener('change', function() {
      const horaInicio = this.value;
      
      horaFinSelect.innerHTML = '<option value="">Seleccionar hora</option>';
      
      if (horaInicio) {
        const [hora, minuto] = horaInicio.split(':').map(Number);
        const horaInicioMinutos = hora * 60 + minuto;
        
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
    const salaColorIndicator = document.getElementById('salaColorIndicator');
    const salaInfo = document.getElementById('salaInfo');
    
    if (salaFilter && this.currentSalaFilter) {
      const salaData = this.salasData[this.currentSalaFilter];
      if (salaData) {
        if (salaColorIndicator) {
          salaColorIndicator.style.backgroundColor = salaData.color;
        }
        
        if (salaInfo) {
          salaInfo.textContent = `${salaData.nombre} - Capacidad: ${salaData.capacidad} personas`;
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
  // Inicializar sistemas
  CalendarioApp.Notifications.init();
  CalendarioApp.Accessibility.init();
  
  // Inicializar calendario si existe
  if (document.getElementById('calendar')) {
    CalendarioApp.Calendar.init();
  }
  
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
  
  console.log('CalendarioApp inicializado correctamente');
});

// ===== FUNCIONES GLOBALES PARA COMPATIBILIDAD =====
window.handleLogout = function() {
  if (CalendarioApp.config.apiEndpoints.logout) {
    window.location.href = CalendarioApp.config.apiEndpoints.logout;
  }
};

window.crearReserva = function() {
  // Implementar lógica de creación de reserva
  CalendarioApp.Notifications.info('Funcionalidad de creación de reserva en desarrollo');
};
