/**
 * CALENDARIO STATE MANAGER
 * Gestión centralizada del estado de la aplicación
 */

// CalendarioApp ya está inicializado en calendario-core.js

CalendarioApp.StateManager = {
  // Estado central de la aplicación
  state: {
    // Estado del calendario
    calendar: {
      currentView: 'timeGridWeek',
      currentDate: new Date(),
      currentSalaFilter: null,
      calendarInstance: null,
      isLoading: false,
      lastUpdated: null
    },

    // Estado de salas
    salas: {
      data: {},
      currentSala: null,
      selectedSala: null,
      lastLoaded: null
    },

    // Estado de reservas
    reservas: {
      data: [],
      currentReserva: null,
      isLoading: false,
      lastFetched: null,
      filters: {
        sala: null,
        fecha: null,
        estado: null
      }
    },

    // Estado de UI
    ui: {
      loading: false,
      notifications: [],
      activeModals: [],
      theme: 'light',
      sidebarOpen: false,
      currentPage: null
    },

    // Estado de usuario
    user: {
      isAuthenticated: false,
      isAdmin: false,
      permissions: [],
      profile: null
    },

    // Estado de configuración
    config: {
      debug: false,
      apiEndpoints: {},
      features: {
        darkMode: true,
        notifications: true,
        export: false,
        advancedFilters: false
      }
    }
  },

  // Suscriptores para cambios de estado
  subscribers: new Map(),

  // Historial de cambios para debugging
  history: [],

  /**
   * Obtener estado completo o una parte específica
   */
  getState: function(path = null) {
    if (!path) {
      return { ...this.state };
    }

    const keys = path.split('.');
    let current = this.state;
    
    for (const key of keys) {
      if (current && typeof current === 'object' && key in current) {
        current = current[key];
      } else {
        return undefined;
      }
    }
    
    return current;
  },

  /**
   * Establecer estado de forma inmutable
   */
  setState: function(path, value, options = {}) {
    const { silent = false, source = 'unknown' } = options;
    
    // Crear copia profunda del estado
    const newState = this.deepClone(this.state);
    
    // Actualizar la ruta específica
    this.setNestedProperty(newState, path, value);
    
    // Guardar en historial si no es silencioso
    if (!silent) {
      this.history.push({
        timestamp: Date.now(),
        path: path,
        oldValue: this.getState(path),
        newValue: value,
        source: source
      });

      // Limitar historial a 100 entradas
      if (this.history.length > 100) {
        this.history = this.history.slice(-100);
      }
    }

    // Actualizar estado
    this.state = newState;

    // Notificar a suscriptores
    if (!silent) {
      this.notifySubscribers(path, value, this.getState(path));
    }

    // Log en modo debug
    if (this.state.config.debug) {
      console.log(`State updated: ${path} =`, value, `(source: ${source})`);
    }
  },

  /**
   * Actualizar múltiples propiedades de una vez
   */
  setMultipleState: function(updates, options = {}) {
    const { silent = false, source = 'unknown' } = options;
    
    Object.entries(updates).forEach(([path, value]) => {
      this.setState(path, value, { silent: true, source });
    });

    // Notificar una sola vez al final
    if (!silent) {
      this.notifySubscribers('multiple', updates, this.state);
    }
  },

  /**
   * Suscribirse a cambios de estado
   */
  subscribe: function(path, callback, options = {}) {
    const { immediate = false } = options;
    
    if (!this.subscribers.has(path)) {
      this.subscribers.set(path, new Set());
    }
    
    this.subscribers.get(path).add(callback);

    // Ejecutar callback inmediatamente si se solicita
    if (immediate) {
      callback(this.getState(path), path);
    }

    // Retornar función de desuscripción
    return () => {
      const subscribers = this.subscribers.get(path);
      if (subscribers) {
        subscribers.delete(callback);
        if (subscribers.size === 0) {
          this.subscribers.delete(path);
        }
      }
    };
  },

  /**
   * Notificar a suscriptores
   */
  notifySubscribers: function(path, newValue, fullState) {
    // Notificar suscriptores específicos de la ruta
    const specificSubscribers = this.subscribers.get(path);
    if (specificSubscribers) {
      specificSubscribers.forEach(callback => {
        try {
          callback(newValue, path, fullState);
        } catch (error) {
          console.error('Error in state subscriber:', error);
        }
      });
    }

    // Notificar suscriptores de rutas padre
    const pathParts = path.split('.');
    for (let i = pathParts.length - 1; i > 0; i--) {
      const parentPath = pathParts.slice(0, i).join('.');
      const parentSubscribers = this.subscribers.get(parentPath);
      if (parentSubscribers) {
        parentSubscribers.forEach(callback => {
          try {
            callback(this.getState(parentPath), parentPath, fullState);
          } catch (error) {
            console.error('Error in parent state subscriber:', error);
          }
        });
      }
    }

    // Notificar suscriptores globales
    const globalSubscribers = this.subscribers.get('*');
    if (globalSubscribers) {
      globalSubscribers.forEach(callback => {
        try {
          callback(this.state, path, newValue);
        } catch (error) {
          console.error('Error in global state subscriber:', error);
        }
      });
    }
  },

  /**
   * Acciones específicas para el calendario
   */
  actions: {
    // Acciones del calendario
    setCalendarView: function(view) {
      CalendarioApp.StateManager.setState('calendar.currentView', view, { source: 'calendar' });
    },

    setCalendarDate: function(date) {
      CalendarioApp.StateManager.setState('calendar.currentDate', date, { source: 'calendar' });
    },

    setSalaFilter: function(salaId) {
      CalendarioApp.StateManager.setState('calendar.currentSalaFilter', salaId, { source: 'calendar' });
      CalendarioApp.StateManager.setState('salas.currentSala', salaId, { source: 'calendar' });
    },

    setCalendarInstance: function(instance) {
      CalendarioApp.StateManager.setState('calendar.calendarInstance', instance, { source: 'calendar' });
    },

    setCalendarLoading: function(loading) {
      CalendarioApp.StateManager.setState('calendar.isLoading', loading, { source: 'calendar' });
    },

    // Acciones de salas
    setSalasData: function(salasData) {
      CalendarioApp.StateManager.setState('salas.data', salasData, { source: 'salas' });
      CalendarioApp.StateManager.setState('salas.lastLoaded', Date.now(), { source: 'salas' });
    },

    setSelectedSala: function(salaId) {
      CalendarioApp.StateManager.setState('salas.selectedSala', salaId, { source: 'salas' });
    },

    // Acciones de reservas
    setReservasData: function(reservas) {
      CalendarioApp.StateManager.setState('reservas.data', reservas, { source: 'reservas' });
      CalendarioApp.StateManager.setState('reservas.lastFetched', Date.now(), { source: 'reservas' });
    },

    setCurrentReserva: function(reserva) {
      CalendarioApp.StateManager.setState('reservas.currentReserva', reserva, { source: 'reservas' });
    },

    setReservasLoading: function(loading) {
      CalendarioApp.StateManager.setState('reservas.isLoading', loading, { source: 'reservas' });
    },

    setReservasFilter: function(filterType, value) {
      CalendarioApp.StateManager.setState(`reservas.filters.${filterType}`, value, { source: 'reservas' });
    },

    // Acciones de UI
    setGlobalLoading: function(loading) {
      CalendarioApp.StateManager.setState('ui.loading', loading, { source: 'ui' });
    },

    addNotification: function(notification) {
      const notifications = CalendarioApp.StateManager.getState('ui.notifications') || [];
      const newNotification = {
        id: Date.now() + Math.random(),
        timestamp: Date.now(),
        ...notification
      };
      
      CalendarioApp.StateManager.setState('ui.notifications', [...notifications, newNotification], { source: 'ui' });
      
      // Auto-remove después de duración
      if (newNotification.duration > 0) {
        setTimeout(() => {
          CalendarioApp.StateManager.removeNotification(newNotification.id);
        }, newNotification.duration);
      }
    },

    removeNotification: function(notificationId) {
      const notifications = CalendarioApp.StateManager.getState('ui.notifications') || [];
      const filtered = notifications.filter(n => n.id !== notificationId);
      CalendarioApp.StateManager.setState('ui.notifications', filtered, { source: 'ui' });
    },

    setTheme: function(theme) {
      CalendarioApp.StateManager.setState('ui.theme', theme, { source: 'ui' });
      document.documentElement.setAttribute('data-theme', theme);
      localStorage.setItem('calendario-theme', theme);
    },

    setCurrentPage: function(page) {
      CalendarioApp.StateManager.setState('ui.currentPage', page, { source: 'ui' });
    },

    // Acciones de usuario
    setUserAuth: function(isAuthenticated, userData = null) {
      CalendarioApp.StateManager.setState('user.isAuthenticated', isAuthenticated, { source: 'user' });
      if (userData) {
        CalendarioApp.StateManager.setState('user.profile', userData, { source: 'user' });
      }
    },

    setUserAdmin: function(isAdmin) {
      CalendarioApp.StateManager.setState('user.isAdmin', isAdmin, { source: 'user' });
    },

    // Acciones de configuración
    setConfig: function(key, value) {
      CalendarioApp.StateManager.setState(`config.${key}`, value, { source: 'config' });
    },

    setFeature: function(feature, enabled) {
      CalendarioApp.StateManager.setState(`config.features.${feature}`, enabled, { source: 'config' });
    }
  },

  /**
   * Utilidades para el estado
   */
  utils: {
    /**
     * Verificar si el estado ha cambiado
     */
    hasChanged: function(path, compareValue) {
      const currentValue = this.getState(path);
      return JSON.stringify(currentValue) !== JSON.stringify(compareValue);
    },

    /**
     * Obtener estado anterior desde historial
     */
    getPreviousState: function(path, stepsBack = 1) {
      const relevantHistory = this.history
        .filter(entry => entry.path === path)
        .slice(-stepsBack - 1, -stepsBack);
      
      return relevantHistory.length > 0 ? relevantHistory[0].oldValue : undefined;
    },

    /**
     * Resetear estado a valores por defecto
     */
    resetState: function(path = null) {
      if (path) {
        // Resetear ruta específica
        const keys = path.split('.');
        const defaultValue = this.getDefaultValue(keys[0]);
        this.setState(path, defaultValue, { source: 'reset' });
      } else {
        // Resetear todo el estado
        this.state = this.getInitialState();
        this.notifySubscribers('*', this.state, this.state);
      }
    },

    /**
     * Obtener valores por defecto
     */
    getDefaultValue: function(category) {
      const defaults = {
        calendar: {
          currentView: 'timeGridWeek',
          currentDate: new Date(),
          currentSalaFilter: null,
          calendarInstance: null,
          isLoading: false,
          lastUpdated: null
        },
        salas: {
          data: {},
          currentSala: null,
          selectedSala: null,
          lastLoaded: null
        },
        reservas: {
          data: [],
          currentReserva: null,
          isLoading: false,
          lastFetched: null,
          filters: {
            sala: null,
            fecha: null,
            estado: null
          }
        },
        ui: {
          loading: false,
          notifications: [],
          activeModals: [],
          theme: 'light',
          sidebarOpen: false,
          currentPage: null
        }
      };
      
      return defaults[category] || {};
    },

    /**
     * Obtener estado inicial
     */
    getInitialState: function() {
      return {
        calendar: this.getDefaultValue('calendar'),
        salas: this.getDefaultValue('salas'),
        reservas: this.getDefaultValue('reservas'),
        ui: this.getDefaultValue('ui'),
        user: {
          isAuthenticated: false,
          isAdmin: false,
          permissions: [],
          profile: null
        },
        config: {
          debug: false,
          apiEndpoints: {},
          features: {
            darkMode: true,
            notifications: true,
            export: false,
            advancedFilters: false
          }
        }
      };
    }
  },

  /**
   * Utilidades de clonación profunda
   */
  deepClone: function(obj) {
    if (obj === null || typeof obj !== 'object') {
      return obj;
    }

    if (obj instanceof Date) {
      return new Date(obj.getTime());
    }

    if (obj instanceof Array) {
      return obj.map(item => this.deepClone(item));
    }

    if (typeof obj === 'object') {
      const cloned = {};
      Object.keys(obj).forEach(key => {
        cloned[key] = this.deepClone(obj[key]);
      });
      return cloned;
    }

    return obj;
  },

  /**
   * Establecer propiedad anidada
   */
  setNestedProperty: function(obj, path, value) {
    const keys = path.split('.');
    let current = obj;

    for (let i = 0; i < keys.length - 1; i++) {
      const key = keys[i];
      if (!(key in current) || typeof current[key] !== 'object') {
        current[key] = {};
      }
      current = current[key];
    }

    current[keys[keys.length - 1]] = value;
  },

  /**
   * Inicializar State Manager
   */
  init: function() {
    console.log('📊 StateManager inicializado');
    
    // Cargar estado persistente
    this.loadPersistentState();
    
    // Configurar debug mode
    this.state.config.debug = window.location.hostname === 'localhost' || 
                              window.location.search.includes('debug=true');
  },

  /**
   * Cargar estado persistente desde localStorage
   */
  loadPersistentState: function() {
    try {
      // Cargar tema
      const savedTheme = localStorage.getItem('calendario-theme');
      if (savedTheme) {
        this.actions.setTheme(savedTheme);
      }

      // Cargar configuración de usuario
      const savedConfig = localStorage.getItem('calendario-config');
      if (savedConfig) {
        const config = JSON.parse(savedConfig);
        this.setState('config', { ...this.state.config, ...config }, { source: 'localStorage' });
      }
    } catch (error) {
      console.warn('Error loading persistent state:', error);
    }
  },

  /**
   * Guardar estado persistente
   */
  savePersistentState: function() {
    try {
      // Guardar configuración
      localStorage.setItem('calendario-config', JSON.stringify(this.state.config));
    } catch (error) {
      console.warn('Error saving persistent state:', error);
    }
  },

  /**
   * Obtener información de debugging
   */
  getDebugInfo: function() {
    return {
      state: this.state,
      subscribers: Array.from(this.subscribers.keys()),
      historyLength: this.history.length,
      memoryUsage: this.getMemoryUsage()
    };
  },

  /**
   * Obtener uso de memoria (aproximado)
   */
  getMemoryUsage: function() {
    const stateString = JSON.stringify(this.state);
    return {
      stateSize: stateString.length,
      historySize: this.history.length,
      subscribersCount: this.subscribers.size
    };
  }
};

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', function() {
  CalendarioApp.StateManager.init();
});

// Hacer disponible globalmente
window.StateManager = CalendarioApp.StateManager;
