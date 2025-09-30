/**
 * CALENDARIO INTEGRATION
 * Archivo de integración que conecta todos los sistemas nuevos
 * con la funcionalidad existente
 */

// CalendarioApp ya está inicializado en calendario-core.js

CalendarioApp.Integration = {
  // Estado de integración
  isInitialized: false,
  integrationStatus: {
    core: false,
    state: false,
    modals: false,
    errors: false
  },

  /**
   * Inicializar todos los sistemas de integración
   */
  init: function() {
    CalendarioApp.Core.Logger.debug('🔗 Iniciando integración de sistemas...');
    
    // Verificar dependencias
    this.checkDependencies();
    
    // Inicializar sistemas en orden
    this.initSystems();
    
    // Configurar integraciones
    this.setupIntegrations();
    
    // Configurar compatibilidad con código existente
    this.setupCompatibility();
    
    // Marcar como inicializado
    this.isInitialized = true;
    
    CalendarioApp.Core.Logger.debug('Integración completada');
    this.logIntegrationStatus();
  },

  /**
   * Verificar que todas las dependencias estén disponibles
   */
  checkDependencies: function() {
    const dependencies = [
      'CalendarioApp.Core',
      'CalendarioApp.StateManager', 
      'CalendarioApp.ModalFactory',
      'CalendarioApp.ErrorHandler'
    ];

    dependencies.forEach(dep => {
      const parts = dep.split('.');
      let current = window;
      let found = true;
      
      for (const part of parts) {
        if (current && typeof current === 'object' && part in current) {
          current = current[part];
        } else {
          found = false;
          break;
        }
      }
      
      if (!found) {
        throw new Error(`Dependencia requerida no encontrada: ${dep}`);
      }
    });

    CalendarioApp.Core.Logger.debug('Todas las dependencias están disponibles');
  },

  /**
   * Inicializar sistemas individuales
   */
  initSystems: function() {
    try {
      // Core ya se inicializa automáticamente
      this.integrationStatus.core = true;
      
      // StateManager
      if (window.CalendarioApp.StateManager) {
        this.integrationStatus.state = true;
      }
      
      // ModalFactory
      if (window.CalendarioApp.ModalFactory) {
        this.integrationStatus.modals = true;
      }
      
      // ErrorHandler
      if (window.CalendarioApp.ErrorHandler) {
        this.integrationStatus.errors = true;
      }
      
    } catch (error) {
      console.error('Error inicializando sistemas:', error);
      throw error;
    }
  },

  /**
   * Configurar integraciones entre sistemas
   */
  setupIntegrations: function() {
    // 1. Integrar ErrorHandler con StateManager
    this.integrateErrorHandlerWithState();
    
    // 2. Integrar ModalFactory con StateManager
    this.integrateModalFactoryWithState();
    
    // 3. Integrar Core con StateManager
    this.integrateCoreWithState();
    
    // 4. Configurar interceptores globales
    this.setupGlobalInterceptors();
  },

  /**
   * Integrar ErrorHandler con StateManager
   */
  integrateErrorHandlerWithState: function() {
    if (!this.integrationStatus.errors || !this.integrationStatus.state) return;

    // Suscribirse a cambios de estado para detectar errores
    CalendarioApp.StateManager.subscribe('*', (state, path, value) => {
      // Detectar errores en el estado
      if (path && path.includes('error')) {
        CalendarioApp.ErrorHandler.specific.stateError(
          new Error(`Error en estado: ${path}`),
          path,
          'state_change'
        );
      }
    });

    // Agregar errores al estado cuando se manejan
    const originalHandle = CalendarioApp.ErrorHandler.handle.bind(CalendarioApp.ErrorHandler);
    CalendarioApp.ErrorHandler.handle = function(error, context, options) {
      const result = originalHandle(error, context, options);
      
      // Actualizar estado de errores
      if (CalendarioApp.StateManager) {
        const recentErrors = CalendarioApp.StateManager.getState('errors.recent') || [];
        CalendarioApp.StateManager.setState('errors.recent', [result, ...recentErrors].slice(0, 10));
      }
      
      return result;
    };

    CalendarioApp.Core.Logger.debug('🔗 ErrorHandler integrado con StateManager');
  },

  /**
   * Integrar ModalFactory con StateManager
   */
  integrateModalFactoryWithState: function() {
    if (!this.integrationStatus.modals || !this.integrationStatus.state) return;

    // Suscribirse a cambios en modales activos
    CalendarioApp.StateManager.subscribe('ui.activeModals', (activeModals) => {
      // Actualizar estadísticas de modales
      CalendarioApp.StateManager.setState('ui.modalStats', {
        activeCount: activeModals.length,
        activeModals: activeModals
      });
    });

    // Interceptar creación de modales para actualizar estado
    const originalCreate = CalendarioApp.ModalFactory.create.bind(CalendarioApp.ModalFactory);
    CalendarioApp.ModalFactory.create = function(templateName, options) {
      const modalId = originalCreate(templateName, options);
      
      // Actualizar estado
      if (CalendarioApp.StateManager) {
        const activeModals = CalendarioApp.StateManager.getState('ui.activeModals') || [];
        if (!activeModals.includes(modalId)) {
          CalendarioApp.StateManager.setState('ui.activeModals', [...activeModals, modalId]);
        }
      }
      
      return modalId;
    };

    CalendarioApp.Core.Logger.debug('🔗 ModalFactory integrado con StateManager');
  },

  /**
   * Integrar Core con StateManager
   */
  integrateCoreWithState: function() {
    if (!this.integrationStatus.core || !this.integrationStatus.state) return;

    // Sincronizar configuración
    const coreConfig = CalendarioApp.Core.config;
    CalendarioApp.StateManager.setState('config.core', coreConfig);

    // Sincronizar URLs
    const coreUrls = CalendarioApp.Core.urls;
    CalendarioApp.StateManager.setState('config.urls', coreUrls);

    // Configurar utilidades para usar StateManager
    CalendarioApp.Core.enhanced = {
      // API calls con manejo de estado
      apiRequest: async function(url, options = {}) {
        CalendarioApp.StateManager.actions.setGlobalLoading(true);
        
        try {
          const result = await CalendarioApp.Core.ApiUtils.request(url, options);
          return result;
        } catch (error) {
          CalendarioApp.ErrorHandler.specific.apiError(error, url, options.method || 'GET');
          throw error;
        } finally {
          CalendarioApp.StateManager.actions.setGlobalLoading(false);
        }
      },

      // Notificaciones con estado
      notify: function(message, type = 'info', options = {}) {
        if (CalendarioApp.StateManager) {
          CalendarioApp.StateManager.actions.addNotification({
            message,
            type,
            ...options
          });
        }
        
        // También usar el sistema de notificaciones existente
        if (CalendarioApp.Notifications) {
          CalendarioApp.Notifications[type](message, options);
        }
      }
    };

    CalendarioApp.Core.Logger.debug('🔗 Core integrado con StateManager');
  },

  /**
   * Configurar interceptores globales
   */
  setupGlobalInterceptors: function() {
    // Interceptor para fetch requests
    const originalFetch = window.fetch;
    window.fetch = async function(...args) {
      const [url, options = {}] = args;
      
      // Agregar headers por defecto
      options.headers = {
        'X-Requested-With': 'XMLHttpRequest',
        ...options.headers
      };
      
      // Agregar CSRF token si es necesario
      if (options.method && options.method !== 'GET') {
        const csrfToken = document.querySelector('[name=csrfmiddlewaretoken]')?.value;
        if (csrfToken) {
          options.headers['X-CSRFToken'] = csrfToken;
        }
      }
      
      try {
        const response = await originalFetch.call(this, url, options);
        
        // Log de requests exitosos en modo debug
        CalendarioApp.Core.Logger.debug(`📡 API Request: ${options.method || 'GET'} ${url}`, response.status);
        
        return response;
      } catch (error) {
        // Manejar errores de red
        CalendarioApp.ErrorHandler.specific.networkError(error, url);
        throw error;
      }
    };

    // Interceptor para errores de JavaScript
    window.addEventListener('error', (event) => {
      CalendarioApp.ErrorHandler.specific.domError(
        event.error || new Error(event.message),
        event.target,
        'javascript_error'
      );
    });

    CalendarioApp.Core.Logger.debug('🔗 Interceptores globales configurados');
  },

  /**
   * Configurar compatibilidad con código existente
   */
  setupCompatibility: function() {
    // Crear aliases para funcionalidades existentes
    window.CalendarioAppV2 = {
      // Aliases para mantener compatibilidad
      Notifications: CalendarioApp.Notifications,
      Calendar: CalendarioApp.Calendar,
      CalendarViews: CalendarioApp.CalendarViews,
      
      // Nuevos sistemas
      Core: CalendarioApp.Core,
      StateManager: CalendarioApp.StateManager,
      ModalFactory: CalendarioApp.ModalFactory,
      ErrorHandler: CalendarioApp.ErrorHandler,
      
      // Utilidades integradas
      Utils: {
        // Utilidades mejoradas que usan los nuevos sistemas
        generateTimeOptions: function(selectInicioId, selectFinId, constraints) {
          return CalendarioApp.Core.TimeUtils.generateTimeOptions(selectInicioId, selectFinId, constraints);
        },
        
        validateForm: function(formElement, rules) {
          return CalendarioApp.Core.FormUtils.validateForm(formElement, rules);
        },
        
        showModal: function(templateName, options) {
          const modalId = CalendarioApp.ModalFactory.create(templateName, options);
          return CalendarioApp.ModalFactory.show(modalId, options);
        },
        
        showConfirm: function(message, options) {
          return CalendarioApp.ModalFactory.utils.confirm(message, options);
        },
        
        apiRequest: function(url, options) {
          return CalendarioApp.Core.enhanced.apiRequest(url, options);
        },
        
        notify: function(message, type, options) {
          return CalendarioApp.Core.enhanced.notify(message, type, options);
        }
      }
    };

    // Funciones globales de compatibilidad
    window.showConfirmModal = function(message, options) {
      return CalendarioApp.ModalFactory.utils.confirm(message, options);
    };

    window.showAlertModal = function(message, options) {
      return CalendarioApp.ModalFactory.utils.alert(message, options);
    };

    window.showLoadingModal = function(message, options) {
      return CalendarioApp.ModalFactory.utils.loading(message, options);
    };

    window.hideLoadingModal = function(modalId) {
      return CalendarioApp.ModalFactory.utils.hideLoading(modalId);
    };

    // Funciones globales del sistema original
    window.handleLogout = function() {
      // Mostrar confirmación
      CalendarioApp.ModalFactory.utils.confirm(
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
          CalendarioApp.ModalFactory.utils.alert('Cerrando sesión...', {
            title: 'Procesando',
            icon: 'fas fa-spinner fa-spin',
            closable: false
          });
          
          // Crear y enviar formulario de logout
          const form = document.createElement('form');
          form.method = 'post';
          form.action = window.logoutUrl || CalendarioApp.Core.urls.views.logout || '/logout/';
          
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
      CalendarioApp.ModalFactory.utils.alert('Funcionalidad de creación de reserva en desarrollo', { 
        title: 'Información',
        type: 'info' 
      });
    };

    // Migrar funcionalidades existentes a nuevos sistemas
    this.migrateExistingFeatures();

    CalendarioApp.Core.Logger.debug('🔗 Compatibilidad configurada');
  },

  /**
   * Migrar funcionalidades existentes
   */
  migrateExistingFeatures: function() {
    // Migrar datos de salas al StateManager
    if (window.CalendarioApp?.Calendar?.salasData) {
      const salasData = window.CalendarioApp.Calendar.salasData;
      CalendarioApp.StateManager.actions.setSalasData(salasData);
    }

    // Migrar configuración de calendario
    if (window.CalendarioApp?.Calendar?.currentSalaFilter) {
      CalendarioApp.StateManager.actions.setSalaFilter(
        window.CalendarioApp.Calendar.currentSalaFilter
      );
    }

    // Migrar tema actual
    const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
    CalendarioApp.StateManager.actions.setTheme(currentTheme);

    CalendarioApp.Core.Logger.debug('Funcionalidades existentes migradas');
  },

  /**
   * Crear bridge entre sistemas viejos y nuevos
   */
  createBridge: function() {
    // Bridge para el sistema de calendario existente
    if (window.CalendarioApp?.Calendar) {
      const originalInit = window.CalendarioApp.Calendar.init.bind(window.CalendarioApp.Calendar);
      
      window.CalendarioApp.Calendar.init = function() {
        // Llamar inicialización original
        originalInit();
        
        // Integrar con nuevos sistemas
        if (this.calendar) {
          CalendarioApp.StateManager.actions.setCalendarInstance(this.calendar);
        }
        
        if (this.currentSalaFilter) {
          CalendarioApp.StateManager.actions.setSalaFilter(this.currentSalaFilter);
        }
      };
    }

    // Bridge para notificaciones
    if (window.CalendarioApp?.Notifications) {
      const originalShow = window.CalendarioApp.Notifications.show.bind(window.CalendarioApp.Notifications);
      
      window.CalendarioApp.Notifications.show = function(message, type, duration, options) {
        // Llamar función original
        const result = originalShow(message, type, duration, options);
        
        // También actualizar estado
        CalendarioApp.StateManager.actions.addNotification({
          message,
          type,
          duration,
          ...options
        });
        
        return result;
      };
    }

    CalendarioApp.Core.Logger.debug('🌉 Bridge creado entre sistemas');
  },

  /**
   * Configurar debugging y monitoreo (solo en modo debug)
   */
  setupDebugging: function() {
    // Solo exponer debugging en modo debug
    if (CalendarioApp.Core?.config?.debug) {
      window.CalendarioDebug = {
        state: () => CalendarioApp.StateManager.getState(),
        errors: () => CalendarioApp.ErrorHandler.debug.getStats(),
        modals: () => CalendarioApp.ModalFactory.getStats(),
        integration: () => this.getIntegrationStatus(),
        
        // Utilidades de debugging
        clearErrors: () => CalendarioApp.ErrorHandler.debug.clearLogs(),
        exportErrors: () => CalendarioApp.ErrorHandler.debug.exportLogs(),
        closeAllModals: () => CalendarioApp.ModalFactory.cleanup(),
        resetState: () => CalendarioApp.StateManager.utils.resetState()
      };

      CalendarioApp.Core.Logger.debug('🐛 Debugging configurado - usa window.CalendarioDebug');
    } else {
      CalendarioApp.Core.Logger.debug('🐛 Debugging deshabilitado en producción');
    }
  },

  /**
   * Obtener estado de integración
   */
  getIntegrationStatus: function() {
    return {
      initialized: this.isInitialized,
      systems: this.integrationStatus,
      timestamp: new Date().toISOString()
    };
  },

  /**
   * Log del estado de integración
   */
  logIntegrationStatus: function() {
    CalendarioApp.Core.Logger.debug('Estado de integración:', this.getIntegrationStatus());
  },

  /**
   * Verificar salud del sistema
   */
  healthCheck: function() {
    const health = {
      core: !!window.CalendarioApp?.Core,
      state: !!window.CalendarioApp?.StateManager,
      modals: !!window.CalendarioApp?.ModalFactory,
      errors: !!window.CalendarioApp?.ErrorHandler,
      integration: this.isInitialized
    };

    const allHealthy = Object.values(health).every(status => status === true);
    
    CalendarioApp.Core.Logger.debug('🏥 Health Check:', health);
    
    if (!allHealthy) {
      CalendarioApp.Core.Logger.warn('⚠️ Algunos sistemas no están funcionando correctamente');
    }

    return health;
  },

  /**
   * Reinicializar sistemas
   */
  reinitialize: function() {
    CalendarioApp.Core.Logger.debug('🔄 Reinicializando sistemas...');
    
    this.isInitialized = false;
    this.integrationStatus = {
      core: false,
      state: false,
      modals: false,
      errors: false
    };
    
    this.init();
  }
};

// Registrar con el controlador centralizado
if (window.CalendarioController) {
  window.CalendarioController.register('Integration', function() {
    try {
      // Verificar que no se haya inicializado ya
      if (CalendarioApp.Integration && CalendarioApp.Integration.isInitialized) {
        CalendarioApp.Core.Logger.debug('⚠️ Integración ya completada, saltando...');
        return;
      }
      
      CalendarioApp.Integration.init();
      CalendarioApp.Integration.createBridge();
      CalendarioApp.Integration.setupDebugging();
      
      // Health check inicial
      CalendarioApp.Integration.healthCheck();
      
    } catch (error) {
      console.error('❌ Error en integración:', error);
      throw error; // Re-lanzar para que el controlador lo maneje
    }
  }, 10); // Alta prioridad
} else {
  CalendarioApp.Core.Logger.warn('⚠️ CalendarioController no disponible, usando fallback');
  
  // Fallback: usar DOMContentLoaded directamente
  document.addEventListener('DOMContentLoaded', function() {
    setTimeout(() => {
      try {
        CalendarioApp.Integration.init();
        CalendarioApp.Integration.createBridge();
        CalendarioApp.Integration.setupDebugging();
        CalendarioApp.Integration.healthCheck();
      } catch (error) {
        console.error('❌ Error en integración (fallback):', error);
      }
    }, 100);
  });
}

// Hacer disponible globalmente
window.CalendarioIntegration = CalendarioApp.Integration;
