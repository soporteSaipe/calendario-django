/**
 * CALENDARIO CORE - Núcleo del sistema
 * Utilidades compartidas y funcionalidades base para toda la aplicación
 */

// Inicializar CalendarioApp si no existe
window.CalendarioApp = window.CalendarioApp || {};

CalendarioApp.Core = {
  // Configuración central
  config: {
    version: '2.0.0',
    debug: false, // Cambiar a true solo en desarrollo
    animationDuration: 300,
    notificationDuration: 5000,
    apiTimeout: 30000,
    cacheTTL: 300000, // 5 minutos
    supportedFormats: ['pdf', 'xlsx'],
    maxExportSize: 1000
  },

  // Sistema de logging condicional
  Logger: {
    debug: function(message, ...args) {
      if (CalendarioApp.Core.config.debug) {
        console.log(`[DEBUG] ${message}`, ...args);
      }
    },
    info: function(message, ...args) {
      if (CalendarioApp.Core.config.debug) {
        console.info(`[INFO] ${message}`, ...args);
      }
    },
    warn: function(message, ...args) {
      console.warn(`[WARN] ${message}`, ...args);
    },
    error: function(message, ...args) {
      console.error(`[ERROR] ${message}`, ...args);
    },
    log: function(message, ...args) {
      if (CalendarioApp.Core.config.debug) {
        console.log(message, ...args);
      }
    }
  },

  // URLs centralizadas
  urls: {
    api: {
      baseUrl: '/calendario/api/',
      reservas: 'reservas/',
      crearReserva: 'crear-reserva/',
      horariosOcupados: 'horarios-ocupados/',
      editar: 'editar/{id}/',
      eliminar: 'eliminar/{id}/',
      salas: 'salas/',
      salaDetalles: 'sala/{id}/detalles/'
    },
    views: {
      calendario: '/calendario/',
      misReservas: '/calendario/mis-reservas/',
      login: '/accounts/login/',
      logout: '/accounts/logout/',
      admin: '/admin/'
    }
  },

  // Cache simple
  cache: new Map(),
  
  // Utilidades de tiempo
  TimeUtils: {
    /**
     * Generar opciones de horarios con restricciones
     */
    generateTimeOptions: function(selectInicioId, selectFinId, constraints = {}) {
      const selectInicio = document.getElementById(selectInicioId);
      const selectFin = document.getElementById(selectFinId);
      
      if (!selectInicio || !selectFin) {
        console.warn('Selects de horario no encontrados');
        return;
      }

      // Limpiar opciones existentes
      selectInicio.innerHTML = '<option value="">Seleccionar hora</option>';
      selectFin.innerHTML = '<option value="">Seleccionar hora</option>';

      // Configuración por defecto
      const defaults = {
        horaInicioMin: 7.5, // 7:30
        horaInicioMax: 18.5, // 18:30
        horaFinMin: 8, // 8:00
        horaFinMax: 19, // 19:00
        intervalo: 30, // minutos
        esComedor: false
      };

      const config = { ...defaults, ...constraints };

      // Ajustar para comedor
      if (config.esComedor) {
        config.horaInicioMin = 7; // 7:00 para comedor
      }

      // Generar horarios de inicio
      this.generateTimeSlots(selectInicio, config.horaInicioMin, config.horaInicioMax, config.intervalo);
      
      // Generar horarios de fin
      this.generateTimeSlots(selectFin, config.horaFinMin, config.horaFinMax, config.intervalo);
    },

    /**
     * Generar slots de tiempo
     */
    generateTimeSlots: function(select, horaMin, horaMax, intervalo) {
      for (let hora = Math.floor(horaMin); hora <= Math.floor(horaMax); hora++) {
        for (let minuto = 0; minuto < 60; minuto += intervalo) {
          const horaDecimal = hora + (minuto / 60);
          
          // Aplicar restricciones
          if (horaDecimal < horaMin || horaDecimal > horaMax) {
            continue;
          }
          
          const tiempo = `${hora.toString().padStart(2, '0')}:${minuto.toString().padStart(2, '0')}`;
          
          const option = document.createElement('option');
          option.value = tiempo;
          option.textContent = tiempo;
          select.appendChild(option);
        }
      }
    },

    /**
     * Filtrar horas de fin basado en hora de inicio
     */
    filterEndTimes: function(selectFinId, horaInicio) {
      const selectFin = document.getElementById(selectFinId);
      if (!selectFin) return;

      const opciones = selectFin.querySelectorAll('option');
      
      opciones.forEach(opcion => {
        if (opcion.value === '') {
          opcion.style.display = 'block';
          return;
        }
        
        opcion.style.display = opcion.value > horaInicio ? 'block' : 'none';
      });
    },

    /**
     * Resetear filtro de horas
     */
    resetTimeFilter: function(selectId) {
      const select = document.getElementById(selectId);
      if (!select) return;

      const opciones = select.querySelectorAll('option');
      opciones.forEach(opcion => {
        opcion.style.display = 'block';
      });
    },

    /**
     * Validar rango de horas
     */
    validateTimeRange: function(horaInicio, horaFin) {
      if (!horaInicio || !horaFin) {
        return { valid: false, message: 'Ambas horas son requeridas' };
      }

      if (horaInicio >= horaFin) {
        return { valid: false, message: 'La hora de fin debe ser posterior a la hora de inicio' };
      }

      return { valid: true };
    },

    /**
     * Calcular duración entre dos horas
     */
    calculateDuration: function(start, end) {
      const startDate = new Date(`2000-01-01T${start}:00`);
      const endDate = new Date(`2000-01-01T${end}:00`);
      const diffMs = endDate - startDate;
      
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
      
      if (diffHours > 0) {
        return `${diffHours}h ${diffMinutes}m`;
      } else {
        return `${diffMinutes}m`;
      }
    },

    /**
     * Formatear fecha para display
     */
    formatDate: function(date, format = 'es-ES', options = {}) {
      const defaultOptions = {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      };
      
      return new Date(date).toLocaleDateString(format, { ...defaultOptions, ...options });
    },

    /**
     * Formatear hora para display
     */
    formatTime: function(date, format = 'es-ES') {
      return new Date(date).toLocaleTimeString(format, {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      });
    }
  },

  // Utilidades de formulario
  FormUtils: {
    /**
     * Validar formulario con reglas personalizadas
     */
    validateForm: function(formElement, rules = {}) {
      const errors = [];
      const formData = new FormData(formElement);
      
      // Validaciones por defecto
      const defaultRules = {
        required: ['titulo', 'recurso', 'fecha', 'hora_inicio', 'hora_fin'],
        email: ['email'],
        minLength: { titulo: 3 },
        maxLength: { titulo: 100, descripcion: 500 }
      };

      const validationRules = { ...defaultRules, ...rules };

      // Validar campos requeridos
      validationRules.required.forEach(fieldName => {
        const value = formData.get(fieldName);
        if (!value || value.trim() === '') {
          errors.push({
            field: fieldName,
            message: `${this.getFieldLabel(fieldName)} es obligatorio`
          });
        }
      });

      // Validar longitud mínima
      Object.entries(validationRules.minLength || {}).forEach(([field, minLen]) => {
        const value = formData.get(field);
        if (value && value.length < minLen) {
          errors.push({
            field: field,
            message: `${this.getFieldLabel(field)} debe tener al menos ${minLen} caracteres`
          });
        }
      });

      // Validar longitud máxima
      Object.entries(validationRules.maxLength || {}).forEach(([field, maxLen]) => {
        const value = formData.get(field);
        if (value && value.length > maxLen) {
          errors.push({
            field: field,
            message: `${this.getFieldLabel(field)} no puede exceder ${maxLen} caracteres`
          });
        }
      });

      // Validar emails
      validationRules.email?.forEach(fieldName => {
        const value = formData.get(fieldName);
        if (value && !this.isValidEmail(value)) {
          errors.push({
            field: fieldName,
            message: `${this.getFieldLabel(fieldName)} no es válido`
          });
        }
      });

      return {
        valid: errors.length === 0,
        errors: errors
      };
    },

    /**
     * Obtener etiqueta del campo
     */
    getFieldLabel: function(fieldName) {
      const labels = {
        titulo: 'Título',
        recurso: 'Sala',
        fecha: 'Fecha',
        hora_inicio: 'Hora de inicio',
        hora_fin: 'Hora de fin',
        descripcion: 'Descripción',
        email: 'Email',
        username: 'Usuario',
        password: 'Contraseña'
      };
      return labels[fieldName] || fieldName;
    },

    /**
     * Validar email
     */
    isValidEmail: function(email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return emailRegex.test(email);
    },

    /**
     * Limpiar formulario
     */
    resetForm: function(formElement) {
      if (formElement && formElement.reset) {
        formElement.reset();
      }
      
      // Limpiar clases de validación
      const inputs = formElement?.querySelectorAll('.is-valid, .is-invalid');
      inputs?.forEach(input => {
        input.classList.remove('is-valid', 'is-invalid');
      });
    },

    /**
     * Mostrar errores de validación
     */
    showValidationErrors: function(formElement, errors) {
      errors.forEach(error => {
        const field = formElement.querySelector(`[name="${error.field}"]`);
        if (field) {
          field.classList.add('is-invalid');
          
          // Mostrar mensaje de error
          CalendarioApp.Core.UIUtils.showFieldError(field, error.message);
        }
      });
    },

    /**
     * Limpiar errores de validación
     */
    clearValidationErrors: function(formElement) {
      const invalidFields = formElement.querySelectorAll('.is-invalid');
      invalidFields.forEach(field => {
        field.classList.remove('is-invalid');
        CalendarioApp.Core.UIUtils.hideFieldError(field);
      });
    }
  },

  // Utilidades de UI
  UIUtils: {
    /**
     * Mostrar error en campo específico
     */
    showFieldError: function(field, message) {
      if (!field) return;

      // Remover error anterior
      this.hideFieldError(field);

      const errorDiv = document.createElement('div');
      errorDiv.className = 'validation-message error';
      errorDiv.innerHTML = `
        <i class="fas fa-exclamation-circle" aria-hidden="true"></i>
        <span>${message}</span>
      `;
      
      field.parentNode.appendChild(errorDiv);
      field.setAttribute('aria-describedby', errorDiv.id || 'error');
    },

    /**
     * Ocultar error de campo
     */
    hideFieldError: function(field) {
      if (!field) return;

      const existingError = field.parentNode.querySelector('.validation-message');
      if (existingError) {
        existingError.remove();
      }
      
      field.removeAttribute('aria-describedby');
    },

    /**
     * Crear elemento con atributos
     */
    createElement: function(tag, attributes = {}, content = '') {
      const element = document.createElement(tag);
      
      Object.entries(attributes).forEach(([key, value]) => {
        if (key === 'className') {
          element.className = value;
        } else if (key === 'innerHTML') {
          element.innerHTML = value;
        } else {
          element.setAttribute(key, value);
        }
      });
      
      if (content && !attributes.innerHTML) {
        element.textContent = content;
      }
      
      return element;
    },

    /**
     * Animar elemento
     */
    animateElement: function(element, animation, duration = 300) {
      if (!element) return Promise.resolve();

      return new Promise((resolve) => {
        element.style.transition = `all ${duration}ms ease`;
        element.classList.add(animation);
        
        setTimeout(() => {
          element.classList.remove(animation);
          resolve();
        }, duration);
      });
    },

    /**
     * Debounce function
     */
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

    /**
     * Throttle function
     */
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
    }
  },

  // Utilidades de API
  ApiUtils: {
    /**
     * Hacer petición HTTP con manejo de errores
     */
    request: async function(url, options = {}) {
      const defaultOptions = {
        method: 'GET',
        headers: {
          'X-Requested-With': 'XMLHttpRequest',
          'Content-Type': 'application/json'
        },
        timeout: CalendarioApp.Core.config.apiTimeout
      };

      const requestOptions = { ...defaultOptions, ...options };

      // Agregar CSRF token si es necesario
      if (requestOptions.method !== 'GET') {
        const csrfToken = document.querySelector('[name=csrfmiddlewaretoken]')?.value;
        if (csrfToken) {
          requestOptions.headers['X-CSRFToken'] = csrfToken;
        }
      }

      try {
        const response = await fetch(url, requestOptions);
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        // Intentar parsear como JSON, si falla devolver texto
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          return await response.json();
        } else {
          return await response.text();
        }
      } catch (error) {
        console.error('API request failed:', error);
        throw error;
      }
    },

    /**
     * Construir URL con parámetros
     */
    buildUrl: function(endpoint, params = {}) {
      let url = endpoint;
      
      // Reemplazar placeholders
      Object.entries(params).forEach(([key, value]) => {
        url = url.replace(`{${key}}`, value);
      });
      
      return url;
    },

    /**
     * Obtener datos con cache
     */
    getCachedData: async function(cacheKey, fetchFunction, ttl = null) {
      const cacheTTL = ttl || CalendarioApp.Core.config.cacheTTL;
      
      // Verificar cache
      const cached = CalendarioApp.Core.cache.get(cacheKey);
      if (cached && Date.now() - cached.timestamp < cacheTTL) {
        return cached.data;
      }

      // Obtener datos frescos
      try {
        const data = await fetchFunction();
        
        // Guardar en cache
        CalendarioApp.Core.cache.set(cacheKey, {
          data: data,
          timestamp: Date.now()
        });
        
        return data;
      } catch (error) {
        // En caso de error, devolver datos del cache si existen
        if (cached) {
          console.warn('Using cached data due to API error:', error);
          return cached.data;
        }
        throw error;
      }
    }
  },

  // Utilidades de salas
  SalaUtils: {
    /**
     * Determinar si una sala es comedor
     */
    isComedor: function(salaId, salasData = null) {
      const salas = salasData || this.getSalasData();
      const sala = salas.find(s => s.id == salaId);
      return sala ? sala.nombre.toLowerCase().includes('comedor') : false;
    },

    /**
     * Obtener datos de salas desde el DOM
     */
    getSalasData: function() {
      const salasDataElement = document.getElementById('salas-data');
      if (!salasDataElement) return [];

      try {
        return JSON.parse(salasDataElement.textContent);
      } catch (error) {
        console.error('Error parsing salas data:', error);
        return [];
      }
    },

    /**
     * Obtener datos de sala específica
     */
    getSalaData: function(salaId) {
      const salas = this.getSalasData();
      return salas.find(s => s.id == salaId);
    },

    /**
     * Cargar salas en select
     */
    loadSalasInSelect: function(selectId, placeholder = 'Selecciona una sala') {
      const select = document.getElementById(selectId);
      if (!select) return;

      select.innerHTML = `<option value="">${placeholder}</option>`;
      
      const salas = this.getSalasData();
      salas.forEach(sala => {
        const option = document.createElement('option');
        option.value = sala.id;
        option.textContent = sala.nombre;
        select.appendChild(option);
      });
    }
  },

  // Utilidades de colores
  ColorUtils: {
    /**
     * Obtener color para estado
     */
    getEstadoColor: function(estado) {
      const colors = {
        pendiente: 'warning',
        confirmada: 'success',
        cancelada: 'danger',
        completada: 'info',
        desconocido: 'secondary'
      };
      return colors[estado] || 'secondary';
    },

    /**
     * Aplicar colores dinámicos a badges
     */
    applyDynamicColors: function() {
      const badges = document.querySelectorAll('.badge-modern[data-color]');
      badges.forEach(badge => {
        const color = badge.getAttribute('data-color');
        if (color) {
          badge.style.backgroundColor = color;
          badge.style.color = 'white';
        }
      });
    }
  },

  // Inicialización
  init: function() {
    // Aplicar colores dinámicos
    this.ColorUtils.applyDynamicColors();
    
    // Configurar URLs si están disponibles globalmente
    this.configureUrls();
  },

  /**
   * Configurar URLs desde variables globales
   */
  configureUrls: function() {
    if (window.calendarioApiUrl) {
      this.urls.api.reservas = window.calendarioApiUrl;
    }
    if (window.crearReservaUrl) {
      this.urls.api.crearReserva = window.crearReservaUrl;
    }
    if (window.horariosOcupadosUrl) {
      this.urls.api.horariosOcupados = window.horariosOcupadosUrl;
    }
    if (window.logoutUrl) {
      this.urls.views.logout = window.logoutUrl;
    }
  }
};

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', function() {
  CalendarioApp.Core.init();
});

// Hacer disponible globalmente
window.CalendarioCore = CalendarioApp.Core;
