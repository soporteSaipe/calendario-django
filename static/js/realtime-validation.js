/**
 * SISTEMA DE VALIDACIÓN DE CONFLICTOS EN TIEMPO REAL
 * Validación instantánea de reservas para prevenir conflictos
 */

CalendarioApp.RealtimeValidation = {
  // Estado del sistema
  state: {
    validationQueue: [],
    isValidationInProgress: false,
    lastValidationTime: null,
    validationCache: new Map(),
    conflictNotifications: new Set()
  },

  // Configuración
  config: {
    validationDelay: 500, // 500ms de delay para evitar validaciones excesivas
    cacheTimeout: 30000, // 30 segundos de cache
    maxConcurrentValidations: 3,
    retryAttempts: 3,
    retryDelay: 1000
  },

  // Inicialización
  init: function() {
    console.log('Inicializando sistema de validación en tiempo real...');
    this.setupEventListeners();
    this.startValidationProcessor();
  },

  // Configurar event listeners
  setupEventListeners: function() {
    // Escuchar cambios en el formulario de reserva
    const form = document.getElementById('formCrearReserva');
    if (form) {
      form.addEventListener('input', this.debounce(this.handleFormChange.bind(this), this.config.validationDelay));
      form.addEventListener('change', this.debounce(this.handleFormChange.bind(this), this.config.validationDelay));
    }

    // Escuchar cambios en la sala seleccionada
    const salaFilter = document.getElementById('salaFilter');
    if (salaFilter) {
      salaFilter.addEventListener('change', this.handleSalaChange.bind(this));
    }

    // Escuchar cambios en fechas y horas
    const fechaInput = document.getElementById('fecha');
    const horaInicioInput = document.getElementById('hora_inicio');
    const horaFinInput = document.getElementById('hora_fin');

    if (fechaInput) {
      fechaInput.addEventListener('change', this.debounce(this.validateCurrentForm.bind(this), this.config.validationDelay));
    }
    if (horaInicioInput) {
      horaInicioInput.addEventListener('change', this.debounce(this.validateCurrentForm.bind(this), this.config.validationDelay));
    }
    if (horaFinInput) {
      horaFinInput.addEventListener('change', this.debounce(this.validateCurrentForm.bind(this), this.config.validationDelay));
    }
  },

  // Función debounce para evitar validaciones excesivas
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

  // Manejar cambios en el formulario
  handleFormChange: function(event) {
    const formData = this.getFormData();
    if (this.isFormValidForValidation(formData)) {
      this.queueValidation(formData);
    }
  },

  // Manejar cambio de sala
  handleSalaChange: function(event) {
    // Limpiar cache cuando cambia la sala
    this.clearCache();
    
    // Validar formulario actual si está completo
    const formData = this.getFormData();
    if (this.isFormValidForValidation(formData)) {
      this.queueValidation(formData);
    }
  },

  // Obtener datos del formulario
  getFormData: function() {
    const form = document.getElementById('formCrearReserva');
    if (!form) return null;

    return {
      sala_id: form.querySelector('#recurso')?.value,
      fecha: form.querySelector('#fecha')?.value,
      hora_inicio: form.querySelector('#hora_inicio')?.value,
      hora_fin: form.querySelector('#hora_fin')?.value,
      titulo: form.querySelector('#titulo')?.value,
      descripcion: form.querySelector('#descripcion')?.value
    };
  },

  // Verificar si el formulario es válido para validación
  isFormValidForValidation: function(formData) {
    return formData && 
           formData.sala_id && 
           formData.fecha && 
           formData.hora_inicio && 
           formData.hora_fin;
  },

  // Agregar validación a la cola
  queueValidation: function(formData) {
    const validationKey = this.getValidationKey(formData);
    
    // Evitar validaciones duplicadas
    if (this.state.validationQueue.some(v => v.key === validationKey)) {
      return;
    }

    // Verificar cache
    if (this.isCached(validationKey)) {
      this.handleCachedResult(validationKey, formData);
      return;
    }

    this.state.validationQueue.push({
      key: validationKey,
      data: formData,
      timestamp: Date.now(),
      attempts: 0
    });

    this.processValidationQueue();
  },

  // Obtener clave de validación
  getValidationKey: function(formData) {
    return `${formData.sala_id}-${formData.fecha}-${formData.hora_inicio}-${formData.hora_fin}`;
  },

  // Verificar si está en cache
  isCached: function(key) {
    const cached = this.state.validationCache.get(key);
    if (!cached) return false;
    
    const now = Date.now();
    return (now - cached.timestamp) < this.config.cacheTimeout;
  },

  // Manejar resultado del cache
  handleCachedResult: function(key, formData) {
    const cached = this.state.validationCache.get(key);
    this.showValidationResult(cached.result, formData);
  },

  // Procesar cola de validaciones
  processValidationQueue: function() {
    if (this.state.isValidationInProgress || this.state.validationQueue.length === 0) {
      return;
    }

    this.state.isValidationInProgress = true;
    const validation = this.state.validationQueue.shift();
    
    this.validateReservation(validation)
      .then(result => {
        this.handleValidationResult(validation, result);
      })
      .catch(error => {
        this.handleValidationError(validation, error);
      })
      .finally(() => {
        this.state.isValidationInProgress = false;
        this.processValidationQueue();
      });
  },

  // Validar reserva
  validateReservation: function(validation) {
    return new Promise((resolve, reject) => {
      const { data } = validation;
      
      // Validación básica del lado cliente
      if (!this.validateBasicRules(data)) {
        resolve({
          valid: false,
          conflicts: [{
            type: 'basic_validation',
            message: 'Los datos del formulario no son válidos'
          }]
        });
        return;
      }

      // Validación de conflictos con el servidor
      this.checkServerConflicts(data)
        .then(conflicts => {
          resolve({
            valid: conflicts.length === 0,
            conflicts: conflicts,
            data: data
          });
        })
        .catch(error => {
          reject(error);
        });
    });
  },

  // Validar reglas básicas
  validateBasicRules: function(data) {
    // Validar que la hora de inicio sea anterior a la de fin
    if (data.hora_inicio >= data.hora_fin) {
      return false;
    }

    // Validar que la fecha no sea en el pasado
    const fecha = new Date(data.fecha);
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    if (fecha < hoy) {
      return false;
    }

    // Validar que la fecha no sea más de 6 meses en el futuro
    const maxDate = new Date();
    maxDate.setMonth(maxDate.getMonth() + 6);
    if (fecha > maxDate) {
      return false;
    }

    return true;
  },

  // Verificar conflictos con el servidor
  checkServerConflicts: function(data) {
    return new Promise((resolve, reject) => {
      const url = `/calendario/api/validar-conflicto/?sala=${data.sala_id}&fecha=${data.fecha}&hora_inicio=${data.hora_inicio}&hora_fin=${data.hora_fin}`;
      
      fetch(url)
        .then(response => {
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }
          return response.json();
        })
        .then(result => {
          resolve(result.conflicts || []);
        })
        .catch(error => {
          console.error('Error al validar conflictos:', error);
          reject(error);
        });
    });
  },

  // Manejar resultado de validación
  handleValidationResult: function(validation, result) {
    const { key, data } = validation;
    
    // Guardar en cache
    this.state.validationCache.set(key, {
      result: result,
      timestamp: Date.now()
    });

    // Mostrar resultado
    this.showValidationResult(result, data);
  },

  // Manejar error de validación
  handleValidationError: function(validation, error) {
    console.error('Error en validación:', error);
    
    // Reintentar si no hemos alcanzado el máximo
    if (validation.attempts < this.config.retryAttempts) {
      validation.attempts++;
      setTimeout(() => {
        this.state.validationQueue.unshift(validation);
        this.processValidationQueue();
      }, this.config.retryDelay);
    } else {
      // Mostrar error después de agotar reintentos
      this.showValidationError(error);
    }
  },

  // Mostrar resultado de validación
  showValidationResult: function(result, formData) {
    const conflictContainer = this.getConflictContainer();
    if (!conflictContainer) return;

    // Limpiar notificaciones anteriores
    this.clearConflictNotifications();

    if (result.valid) {
      this.showSuccessMessage(conflictContainer);
    } else {
      this.showConflictMessages(conflictContainer, result.conflicts, formData);
    }
  },

  // Mostrar error de validación
  showValidationError: function(error) {
    if (window.CalendarioApp && CalendarioApp.Notifications) {
      CalendarioApp.Notifications.error('Error al validar la reserva. Inténtalo de nuevo.', {
        duration: 5000
      });
    }
  },

  // Obtener contenedor de conflictos
  getConflictContainer: function() {
    let container = document.getElementById('conflictContainer');
    if (!container) {
      container = this.createConflictContainer();
    }
    return container;
  },

  // Crear contenedor de conflictos
  createConflictContainer: function() {
    const form = document.getElementById('formCrearReserva');
    if (!form) return null;

    const container = document.createElement('div');
    container.id = 'conflictContainer';
    container.className = 'conflict-container mt-3';
    
    // Insertar después del formulario
    form.parentNode.insertBefore(container, form.nextSibling);
    
    return container;
  },

  // Mostrar mensaje de éxito
  showSuccessMessage: function(container) {
    container.innerHTML = `
      <div class="alert alert-success-modern">
        <i class="fas fa-check-circle me-2"></i>
        <strong>¡Perfecto!</strong> La reserva está disponible en este horario.
      </div>
    `;
  },

  // Mostrar mensajes de conflicto
  showConflictMessages: function(container, conflicts, formData) {
    let html = '<div class="alert alert-warning-modern">';
    html += '<i class="fas fa-exclamation-triangle me-2"></i>';
    html += '<strong>Conflicto detectado:</strong>';
    html += '<ul class="mb-0 mt-2">';
    
    conflicts.forEach(conflict => {
      html += `<li>${conflict.message}</li>`;
      this.state.conflictNotifications.add(conflict);
    });
    
    html += '</ul>';
    html += '</div>';

    // Agregar sugerencias de horarios alternativos
    html += this.generateAlternativeSuggestions(formData);
    
    container.innerHTML = html;
  },

  // Generar sugerencias de horarios alternativos
  generateAlternativeSuggestions: function(formData) {
    const suggestions = this.getAlternativeSuggestions(formData);
    if (suggestions.length === 0) return '';

    let html = '<div class="alert alert-info-modern mt-2">';
    html += '<i class="fas fa-lightbulb me-2"></i>';
    html += '<strong>Horarios alternativos sugeridos:</strong>';
    html += '<div class="suggestion-buttons mt-2">';
    
    suggestions.forEach(suggestion => {
      html += `
        <button type="button" class="btn btn-sm btn-outline-primary me-2 mb-1 suggestion-btn" 
                data-hora-inicio="${suggestion.hora_inicio}" 
                data-hora-fin="${suggestion.hora_fin}">
          ${suggestion.hora_inicio} - ${suggestion.hora_fin}
        </button>
      `;
    });
    
    html += '</div></div>';

    // Agregar event listeners a los botones de sugerencia
    setTimeout(() => {
      this.setupSuggestionButtons();
    }, 100);

    return html;
  },

  // Obtener sugerencias de horarios alternativos
  getAlternativeSuggestions: function(formData) {
    // Lógica para generar sugerencias basadas en el horario actual
    const horaInicio = formData.hora_inicio;
    const horaFin = formData.hora_fin;
    
    const suggestions = [];
    
    // Sugerir 30 minutos después
    const horaInicio30 = this.addMinutes(horaInicio, 30);
    const horaFin30 = this.addMinutes(horaFin, 30);
    if (this.isValidTimeRange(horaInicio30, horaFin30)) {
      suggestions.push({
        hora_inicio: horaInicio30,
        hora_fin: horaFin30
      });
    }
    
    // Sugerir 1 hora después
    const horaInicio60 = this.addMinutes(horaInicio, 60);
    const horaFin60 = this.addMinutes(horaFin, 60);
    if (this.isValidTimeRange(horaInicio60, horaFin60)) {
      suggestions.push({
        hora_inicio: horaInicio60,
        hora_fin: horaFin60
      });
    }
    
    return suggestions.slice(0, 3); // Máximo 3 sugerencias
  },

  // Agregar minutos a una hora
  addMinutes: function(timeString, minutes) {
    const [hours, mins] = timeString.split(':').map(Number);
    const totalMinutes = hours * 60 + mins + minutes;
    const newHours = Math.floor(totalMinutes / 60);
    const newMins = totalMinutes % 60;
    return `${newHours.toString().padStart(2, '0')}:${newMins.toString().padStart(2, '0')}`;
  },

  // Verificar si el rango de tiempo es válido
  isValidTimeRange: function(horaInicio, horaFin) {
    return horaInicio < horaFin && horaInicio >= '07:00' && horaFin <= '18:00';
  },

  // Configurar botones de sugerencia
  setupSuggestionButtons: function() {
    document.querySelectorAll('.suggestion-btn').forEach(button => {
      button.addEventListener('click', (e) => {
        const horaInicio = e.target.dataset.horaInicio;
        const horaFin = e.target.dataset.horaFin;
        
        // Actualizar formulario
        document.getElementById('hora_inicio').value = horaInicio;
        document.getElementById('hora_fin').value = horaFin;
        
        // Validar nuevamente
        this.validateCurrentForm();
      });
    });
  },

  // Limpiar notificaciones de conflicto
  clearConflictNotifications: function() {
    this.state.conflictNotifications.clear();
  },

  // Limpiar cache
  clearCache: function() {
    this.state.validationCache.clear();
  },

  // Validar formulario actual
  validateCurrentForm: function() {
    const formData = this.getFormData();
    if (this.isFormValidForValidation(formData)) {
      this.queueValidation(formData);
    }
  },

  // Iniciar procesador de validaciones
  startValidationProcessor: function() {
    setInterval(() => {
      this.processValidationQueue();
    }, 1000);
  },

  // Obtener estadísticas
  getStats: function() {
    return {
      queueLength: this.state.validationQueue.length,
      isValidationInProgress: this.state.isValidationInProgress,
      cacheSize: this.state.validationCache.size,
      conflictNotifications: this.state.conflictNotifications.size
    };
  }
};

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', function() {
  if (document.getElementById('formCrearReserva')) {
    CalendarioApp.RealtimeValidation.init();
  }
});
