/**
 * CALENDARIO ERROR HANDLER
 * Sistema avanzado de manejo de errores y logging
 */

// CalendarioApp ya está inicializado en calendario-core.js

CalendarioApp.ErrorHandler = {
  // Configuración
  config: {
    enableLogging: true,
    enableRemoteLogging: false,
    maxLocalErrors: 100,
    retryAttempts: 3,
    retryDelay: 1000,
    showUserNotifications: true,
    logLevel: 'error' // 'debug', 'info', 'warn', 'error'
  },

  // Almacén local de errores
  errorLog: [],
  
  // Contador de errores por tipo
  errorCounts: new Map(),

  // Tipos de errores
  errorTypes: {
    API_ERROR: 'API_ERROR',
    VALIDATION_ERROR: 'VALIDATION_ERROR',
    NETWORK_ERROR: 'NETWORK_ERROR',
    DOM_ERROR: 'DOM_ERROR',
    STATE_ERROR: 'STATE_ERROR',
    MODAL_ERROR: 'MODAL_ERROR',
    CALENDAR_ERROR: 'CALENDAR_ERROR',
    UNKNOWN_ERROR: 'UNKNOWN_ERROR'
  },

  /**
   * Manejar error principal
   */
  handle: function(error, context = {}, options = {}) {
    const errorInfo = this.processError(error, context, options);
    
    // Log local
    if (this.config.enableLogging) {
      this.logError(errorInfo);
    }

    // Log remoto
    if (this.config.enableRemoteLogging) {
      this.logRemoteError(errorInfo);
    }

    // Actualizar contadores
    this.updateErrorCounts(errorInfo.type);

    // Mostrar notificación al usuario
    if (this.config.showUserNotifications && errorInfo.showToUser) {
      this.showUserNotification(errorInfo);
    }

    // Actualizar estado si está disponible
    if (window.CalendarioApp && CalendarioApp.StateManager) {
      this.updateErrorState(errorInfo);
    }

    return errorInfo;
  },

  /**
   * Procesar y enriquecer información del error
   */
  processError: function(error, context, options) {
    const errorInfo = {
      id: this.generateErrorId(),
      timestamp: Date.now(),
      type: this.detectErrorType(error),
      message: this.extractMessage(error),
      stack: this.extractStack(error),
      context: {
        url: window.location.href,
        userAgent: navigator.userAgent,
        timestamp: new Date().toISOString(),
        ...context
      },
      severity: this.determineSeverity(error, context),
      showToUser: options.showToUser !== false,
      retryable: this.isRetryable(error, context),
      ...options
    };

    return errorInfo;
  },

  /**
   * Detectar tipo de error
   */
  detectErrorType: function(error) {
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      return this.errorTypes.NETWORK_ERROR;
    }
    
    if (error.message && error.message.includes('HTTP error')) {
      return this.errorTypes.API_ERROR;
    }
    
    if (error.message && error.message.includes('validation')) {
      return this.errorTypes.VALIDATION_ERROR;
    }
    
    if (error.message && error.message.includes('modal')) {
      return this.errorTypes.MODAL_ERROR;
    }
    
    if (error.message && error.message.includes('calendar')) {
      return this.errorTypes.CALENDAR_ERROR;
    }
    
    if (error.message && error.message.includes('state')) {
      return this.errorTypes.STATE_ERROR;
    }
    
    if (error instanceof DOMException) {
      return this.errorTypes.DOM_ERROR;
    }
    
    return this.errorTypes.UNKNOWN_ERROR;
  },

  /**
   * Extraer mensaje del error
   */
  extractMessage: function(error) {
    if (typeof error === 'string') {
      return error;
    }
    
    if (error.message) {
      return error.message;
    }
    
    if (error.error && error.error.message) {
      return error.error.message;
    }
    
    return 'Error desconocido';
  },

  /**
   * Extraer stack trace
   */
  extractStack: function(error) {
    if (error.stack) {
      return error.stack;
    }
    
    if (error.error && error.error.stack) {
      return error.error.stack;
    }
    
    return new Error().stack;
  },

  /**
   * Determinar severidad del error
   */
  determineSeverity: function(error, context) {
    // Errores críticos
    if (context.critical || error.name === 'CriticalError') {
      return 'critical';
    }
    
    // Errores de API
    if (this.detectErrorType(error) === this.errorTypes.API_ERROR) {
      return 'high';
    }
    
    // Errores de validación
    if (this.detectErrorType(error) === this.errorTypes.VALIDATION_ERROR) {
      return 'medium';
    }
    
    // Errores de red
    if (this.detectErrorType(error) === this.errorTypes.NETWORK_ERROR) {
      return 'high';
    }
    
    return 'low';
  },

  /**
   * Verificar si el error es reintentable
   */
  isRetryable: function(error, context) {
    // Errores de red son reintentables
    if (this.detectErrorType(error) === this.errorTypes.NETWORK_ERROR) {
      return true;
    }
    
    // Errores de API con códigos específicos
    if (this.detectErrorType(error) === this.errorTypes.API_ERROR) {
      const status = this.extractStatusCode(error);
      return status >= 500 || status === 429; // Server errors o rate limiting
    }
    
    return false;
  },

  /**
   * Extraer código de estado HTTP del error
   */
  extractStatusCode: function(error) {
    const match = error.message.match(/status: (\d+)/);
    return match ? parseInt(match[1]) : null;
  },

  /**
   * Generar ID único para el error
   */
  generateErrorId: function() {
    return `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  },

  /**
   * Log error localmente
   */
  logError: function(errorInfo) {
    this.errorLog.push(errorInfo);
    
    // Limitar tamaño del log
    if (this.errorLog.length > this.config.maxLocalErrors) {
      this.errorLog = this.errorLog.slice(-this.config.maxLocalErrors);
    }
    
    // Console log según nivel
    this.consoleLog(errorInfo);
  },

  /**
   * Log en consola según nivel de severidad
   */
  consoleLog: function(errorInfo) {
    const { severity, message, context, stack } = errorInfo;
    
    const logData = {
      message,
      context,
      severity,
      timestamp: new Date(errorInfo.timestamp).toISOString()
    };
    
    switch (severity) {
      case 'critical':
      case 'high':
        console.error('🚨 Error crítico:', logData, stack);
        break;
      case 'medium':
        console.warn('⚠️ Error medio:', logData);
        break;
      case 'low':
        console.info('ℹ️ Error menor:', logData);
        break;
      default:
        CalendarioApp.Core.Logger.debug('📝 Error:', logData);
    }
  },

  /**
   * Log error remotamente
   */
  logRemoteError: async function(errorInfo) {
    try {
      const payload = {
        ...errorInfo,
        userAgent: navigator.userAgent,
        url: window.location.href,
        timestamp: new Date().toISOString()
      };
      
      // Aquí se implementaría el envío a un servicio de logging
      // Por ejemplo, Sentry, LogRocket, o un endpoint personalizado
      CalendarioApp.Core.Logger.debug('📡 Enviando error a servicio remoto:', payload);
      
    } catch (error) {
      console.error('Error al enviar log remoto:', error);
    }
  },

  /**
   * Mostrar notificación al usuario
   */
  showUserNotification: function(errorInfo) {
    const { type, message, severity } = errorInfo;
    
    // Determinar tipo de notificación
    let notificationType = 'error';
    let userMessage = message;
    
    switch (type) {
      case this.errorTypes.VALIDATION_ERROR:
        notificationType = 'warning';
        break;
      case this.errorTypes.NETWORK_ERROR:
        notificationType = 'error';
        userMessage = 'Error de conexión. Verifica tu internet y vuelve a intentar.';
        break;
      case this.errorTypes.API_ERROR:
        notificationType = 'error';
        userMessage = 'Error del servidor. Por favor, inténtalo de nuevo.';
        break;
      default:
        notificationType = 'error';
        if (severity === 'critical') {
          userMessage = 'Ha ocurrido un error crítico. Nuestro equipo ha sido notificado.';
        }
    }
    
    // Mostrar notificación usando el sistema existente
    if (window.CalendarioApp && CalendarioApp.Notifications) {
      CalendarioApp.Notifications[notificationType](userMessage, {
        duration: severity === 'critical' ? 10000 : 5000,
        title: this.getErrorTitle(type)
      });
    } else {
      // Fallback a alert nativo
      alert(`${this.getErrorTitle(type)}: ${userMessage}`);
    }
  },

  /**
   * Obtener título para el tipo de error
   */
  getErrorTitle: function(type) {
    const titles = {
      [this.errorTypes.API_ERROR]: 'Error del Servidor',
      [this.errorTypes.VALIDATION_ERROR]: 'Error de Validación',
      [this.errorTypes.NETWORK_ERROR]: 'Error de Conexión',
      [this.errorTypes.DOM_ERROR]: 'Error de Interfaz',
      [this.errorTypes.STATE_ERROR]: 'Error de Estado',
      [this.errorTypes.MODAL_ERROR]: 'Error de Modal',
      [this.errorTypes.CALENDAR_ERROR]: 'Error del Calendario',
      [this.errorTypes.UNKNOWN_ERROR]: 'Error Desconocido'
    };
    
    return titles[type] || 'Error';
  },

  /**
   * Actualizar contadores de errores
   */
  updateErrorCounts: function(errorType) {
    const currentCount = this.errorCounts.get(errorType) || 0;
    this.errorCounts.set(errorType, currentCount + 1);
  },

  /**
   * Actualizar estado de errores
   */
  updateErrorState: function(errorInfo) {
    // Verificar que StateManager esté disponible
    if (!CalendarioApp.StateManager || !CalendarioApp.StateManager.getState) {
      console.warn('⚠️ StateManager no disponible para actualizar estado de errores');
      return;
    }
    
    try {
      const currentErrors = CalendarioApp.StateManager.getState('errors.recent') || [];
      const updatedErrors = [errorInfo, ...currentErrors].slice(0, 10); // Mantener solo los 10 más recientes
      
      CalendarioApp.StateManager.setState('errors.recent', updatedErrors, { source: 'errorHandler' });
      CalendarioApp.StateManager.setState('errors.count', this.errorCounts.size, { source: 'errorHandler' });
    } catch (error) {
      console.warn('⚠️ Error al actualizar estado de errores:', error);
    }
  },

  /**
   * Intentar reintentar operación fallida
   */
  retry: async function(operation, context = {}, options = {}) {
    const { maxAttempts = this.config.retryAttempts, delay = this.config.retryDelay } = options;
    let lastError = null;
    
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        const result = await operation();
        
        // Si llegamos aquí, la operación fue exitosa
        if (attempt > 1) {
          CalendarioApp.Core.Logger.debug(`✅ Operación exitosa en intento ${attempt}`);
        }
        
        return result;
      } catch (error) {
        lastError = error;
        
        // Si no es reintentable, fallar inmediatamente
        if (!this.isRetryable(error, context)) {
          throw error;
        }
        
        console.warn(`⚠️ Intento ${attempt}/${maxAttempts} falló:`, error.message);
        
        // Si no es el último intento, esperar antes de reintentar
        if (attempt < maxAttempts) {
          await this.delay(delay * attempt); // Backoff exponencial
        }
      }
    }
    
    // Todos los intentos fallaron
    this.handle(lastError, { ...context, retryAttempts: maxAttempts });
    throw lastError;
  },

  /**
   * Delay utility
   */
  delay: function(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  },

  /**
   * Wrapper para funciones que pueden fallar
   */
  wrap: function(fn, context = {}, options = {}) {
    return async function(...args) {
      try {
        return await fn.apply(this, args);
      } catch (error) {
        CalendarioApp.ErrorHandler.handle(error, context, options);
        throw error;
      }
    };
  },

  /**
   * Wrapper para promesas
   */
  wrapPromise: function(promise, context = {}, options = {}) {
    return promise.catch(error => {
      CalendarioApp.ErrorHandler.handle(error, context, options);
      throw error;
    });
  },

  /**
   * Métodos específicos para diferentes tipos de errores
   */
  specific: {
    /**
     * Manejar errores de API
     */
    apiError: function(error, endpoint, method = 'GET') {
      return CalendarioApp.ErrorHandler.handle(error, {
        endpoint,
        method,
        type: 'API_ERROR'
      }, {
        showToUser: true,
        retryable: true
      });
    },

    /**
     * Manejar errores de validación
     */
    validationError: function(error, formData, field) {
      return CalendarioApp.ErrorHandler.handle(error, {
        formData,
        field,
        type: 'VALIDATION_ERROR'
      }, {
        showToUser: true,
        retryable: false
      });
    },

    /**
     * Manejar errores de red
     */
    networkError: function(error, url) {
      return CalendarioApp.ErrorHandler.handle(error, {
        url,
        type: 'NETWORK_ERROR'
      }, {
        showToUser: true,
        retryable: true
      });
    },

    /**
     * Manejar errores de DOM
     */
    domError: function(error, element, operation) {
      return CalendarioApp.ErrorHandler.handle(error, {
        element: element?.tagName || 'unknown',
        operation,
        type: 'DOM_ERROR'
      }, {
        showToUser: false,
        retryable: false
      });
    },

    /**
     * Manejar errores de estado
     */
    stateError: function(error, statePath, operation) {
      return CalendarioApp.ErrorHandler.handle(error, {
        statePath,
        operation,
        type: 'STATE_ERROR'
      }, {
        showToUser: false,
        retryable: false
      });
    }
  },

  /**
   * Utilidades de debugging
   */
  debug: {
    /**
     * Obtener todos los errores
     */
    getAllErrors: function() {
      return this.errorLog;
    },

    /**
     * Obtener errores por tipo
     */
    getErrorsByType: function(type) {
      return this.errorLog.filter(error => error.type === type);
    },

    /**
     * Obtener estadísticas de errores
     */
    getStats: function() {
      return {
        totalErrors: this.errorLog.length,
        errorCounts: Object.fromEntries(this.errorCounts),
        recentErrors: this.errorLog.slice(-10),
        errorTypes: Object.keys(this.errorTypes)
      };
    },

    /**
     * Limpiar logs de errores
     */
    clearLogs: function() {
      this.errorLog = [];
      this.errorCounts.clear();
    },

    /**
     * Exportar logs para análisis
     */
    exportLogs: function() {
      const data = {
        logs: this.errorLog,
        stats: this.debug.getStats(),
        config: this.config,
        timestamp: new Date().toISOString()
      };
      
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = url;
      a.download = `calendario-errors-${Date.now()}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  },

  /**
   * Configurar Error Handler
   */
  configure: function(config) {
    this.config = { ...this.config, ...config };
  },

  /**
   * Inicializar Error Handler
   */
  init: function() {
    CalendarioApp.Core.Logger.debug('🛡️ ErrorHandler inicializado');
    
    // Capturar errores globales no manejados
    window.addEventListener('error', (event) => {
      this.handle(event.error || event.message, {
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        type: 'GLOBAL_ERROR'
      });
    });

    // Capturar promesas rechazadas no manejadas
    window.addEventListener('unhandledrejection', (event) => {
      this.handle(event.reason, {
        type: 'UNHANDLED_REJECTION'
      });
    });

    // Configurar logging remoto si está habilitado
    if (this.config.enableRemoteLogging) {
      CalendarioApp.Core.Logger.debug('📡 Logging remoto habilitado');
    }
  }
};

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', function() {
  CalendarioApp.ErrorHandler.init();
});

// Hacer disponible globalmente
window.ErrorHandler = CalendarioApp.ErrorHandler;
