/**
 * SISTEMA DE NOTIFICACIONES EN TIEMPO REAL
 * WebSockets para notificaciones instantáneas de reservas
 */

CalendarioApp.RealtimeNotifications = {
  // Estado del sistema
  state: {
    socket: null,
    connected: false,
    reconnectAttempts: 0,
    maxReconnectAttempts: 5,
    reconnectDelay: 1000,
    heartbeatInterval: null,
    lastHeartbeat: null
  },

  // Configuración
  config: {
    wsUrl: 'ws://localhost:8000/ws/notifications/',
    heartbeatInterval: 30000, // 30 segundos
    reconnectDelay: 1000,
    maxReconnectAttempts: 5
  },

  // Inicialización
  init: function() {
    console.log('Inicializando sistema de notificaciones en tiempo real...');
    this.connect();
    this.setupEventListeners();
  },

  // Conectar al WebSocket
  connect: function() {
    try {
      console.log('Conectando a WebSocket:', this.config.wsUrl);
      this.state.socket = new WebSocket(this.config.wsUrl);
      
      this.state.socket.onopen = this.handleOpen.bind(this);
      this.state.socket.onmessage = this.handleMessage.bind(this);
      this.state.socket.onclose = this.handleClose.bind(this);
      this.state.socket.onerror = this.handleError.bind(this);
      
    } catch (error) {
      console.error('Error al conectar WebSocket:', error);
      this.scheduleReconnect();
    }
  },

  // Manejar conexión abierta
  handleOpen: function(event) {
    console.log('WebSocket conectado exitosamente');
    this.state.connected = true;
    this.state.reconnectAttempts = 0;
    
    // Iniciar heartbeat
    this.startHeartbeat();
    
    // Notificar al usuario
    if (window.CalendarioApp && CalendarioApp.Notifications) {
      CalendarioApp.Notifications.success('Conectado a notificaciones en tiempo real', {
        duration: 3000
      });
    }
    
    // Solicitar sincronización de datos
    this.requestDataSync();
  },

  // Manejar mensajes recibidos
  handleMessage: function(event) {
    try {
      const data = JSON.parse(event.data);
      console.log('Mensaje recibido:', data);
      
      switch (data.type) {
        case 'reserva_created':
          this.handleReservaCreated(data);
          break;
        case 'reserva_updated':
          this.handleReservaUpdated(data);
          break;
        case 'reserva_deleted':
          this.handleReservaDeleted(data);
          break;
        case 'conflict_detected':
          this.handleConflictDetected(data);
          break;
        case 'heartbeat':
          this.handleHeartbeat(data);
          break;
        case 'data_sync':
          this.handleDataSync(data);
          break;
        default:
          console.warn('Tipo de mensaje desconocido:', data.type);
      }
    } catch (error) {
      console.error('Error al procesar mensaje:', error);
    }
  },

  // Manejar cierre de conexión
  handleClose: function(event) {
    console.log('WebSocket desconectado:', event.code, event.reason);
    this.state.connected = false;
    this.stopHeartbeat();
    
    if (event.code !== 1000) { // No es cierre normal
      this.scheduleReconnect();
    }
  },

  // Manejar errores
  handleError: function(error) {
    console.error('Error en WebSocket:', error);
    this.state.connected = false;
  },

  // Programar reconexión
  scheduleReconnect: function() {
    if (this.state.reconnectAttempts >= this.config.maxReconnectAttempts) {
      console.error('Máximo número de intentos de reconexión alcanzado');
      if (window.CalendarioApp && CalendarioApp.Notifications) {
        CalendarioApp.Notifications.error('No se pudo conectar a las notificaciones en tiempo real', {
          duration: 5000
        });
      }
      return;
    }

    this.state.reconnectAttempts++;
    const delay = this.config.reconnectDelay * Math.pow(2, this.state.reconnectAttempts - 1);
    
    console.log(`Reintentando conexión en ${delay}ms (intento ${this.state.reconnectAttempts})`);
    
    setTimeout(() => {
      this.connect();
    }, delay);
  },

  // Iniciar heartbeat
  startHeartbeat: function() {
    this.state.heartbeatInterval = setInterval(() => {
      if (this.state.connected) {
        this.sendMessage({
          type: 'heartbeat',
          timestamp: new Date().toISOString()
        });
      }
    }, this.config.heartbeatInterval);
  },

  // Detener heartbeat
  stopHeartbeat: function() {
    if (this.state.heartbeatInterval) {
      clearInterval(this.state.heartbeatInterval);
      this.state.heartbeatInterval = null;
    }
  },

  // Manejar heartbeat
  handleHeartbeat: function(data) {
    this.state.lastHeartbeat = new Date();
    console.log('Heartbeat recibido');
  },

  // Enviar mensaje
  sendMessage: function(message) {
    if (this.state.connected && this.state.socket) {
      try {
        this.state.socket.send(JSON.stringify(message));
        return true;
      } catch (error) {
        console.error('Error al enviar mensaje:', error);
        return false;
      }
    }
    return false;
  },

  // Solicitar sincronización de datos
  requestDataSync: function() {
    this.sendMessage({
      type: 'request_sync',
      sala_id: this.getCurrentSalaId()
    });
  },

  // Obtener ID de sala actual
  getCurrentSalaId: function() {
    const salaFilter = document.getElementById('salaFilter');
    return salaFilter ? salaFilter.value : null;
  },

  // Manejar reserva creada
  handleReservaCreated: function(data) {
    console.log('Nueva reserva creada:', data);
    
    // Actualizar calendario
    this.refreshCalendar();
    
    // Mostrar notificación
    if (window.CalendarioApp && CalendarioApp.Notifications) {
      CalendarioApp.Notifications.info(`Nueva reserva: ${data.reserva.titulo}`, {
        duration: 4000,
        actions: [
          {
            label: 'Ver',
            action: () => this.showReservaDetails(data.reserva.id)
          }
        ]
      });
    }
  },

  // Manejar reserva actualizada
  handleReservaUpdated: function(data) {
    console.log('Reserva actualizada:', data);
    
    // Actualizar calendario
    this.refreshCalendar();
    
    // Mostrar notificación
    if (window.CalendarioApp && CalendarioApp.Notifications) {
      CalendarioApp.Notifications.info(`Reserva actualizada: ${data.reserva.titulo}`, {
        duration: 4000
      });
    }
  },

  // Manejar reserva eliminada
  handleReservaDeleted: function(data) {
    console.log('Reserva eliminada:', data);
    
    // Actualizar calendario
    this.refreshCalendar();
    
    // Mostrar notificación
    if (window.CalendarioApp && CalendarioApp.Notifications) {
      CalendarioApp.Notifications.warning(`Reserva eliminada: ${data.reserva.titulo}`, {
        duration: 4000
      });
    }
  },

  // Manejar conflicto detectado
  handleConflictDetected: function(data) {
    console.log('Conflicto detectado:', data);
    
    // Mostrar notificación de conflicto
    if (window.CalendarioApp && CalendarioApp.Notifications) {
      CalendarioApp.Notifications.error(`Conflicto detectado: ${data.message}`, {
        duration: 6000,
        actions: [
          {
            label: 'Resolver',
            action: () => this.showConflictResolution(data)
          }
        ]
      });
    }
  },

  // Manejar sincronización de datos
  handleDataSync: function(data) {
    console.log('Sincronización de datos recibida:', data);
    
    // Actualizar calendario con nuevos datos
    this.refreshCalendar();
  },

  // Refrescar calendario
  refreshCalendar: function() {
    if (window.CalendarioApp && CalendarioApp.Calendar && CalendarioApp.Calendar.calendar) {
      CalendarioApp.Calendar.calendar.refetchEvents();
    }
  },

  // Mostrar detalles de reserva
  showReservaDetails: function(reservaId) {
    // Implementar lógica para mostrar detalles
    console.log('Mostrando detalles de reserva:', reservaId);
  },

  // Mostrar resolución de conflictos
  showConflictResolution: function(conflictData) {
    // Implementar lógica para resolver conflictos
    console.log('Mostrando resolución de conflictos:', conflictData);
  },

  // Configurar event listeners
  setupEventListeners: function() {
    // Escuchar cambios en la sala seleccionada
    const salaFilter = document.getElementById('salaFilter');
    if (salaFilter) {
      salaFilter.addEventListener('change', () => {
        this.requestDataSync();
      });
    }

    // Escuchar cambios de vista
    document.addEventListener('calendarViewChanged', (event) => {
      this.requestDataSync();
    });
  },

  // Desconectar
  disconnect: function() {
    this.stopHeartbeat();
    if (this.state.socket) {
      this.state.socket.close(1000, 'Desconexión manual');
      this.state.socket = null;
    }
    this.state.connected = false;
  },

  // Verificar estado de conexión
  isConnected: function() {
    return this.state.connected;
  },

  // Obtener estadísticas
  getStats: function() {
    return {
      connected: this.state.connected,
      reconnectAttempts: this.state.reconnectAttempts,
      lastHeartbeat: this.state.lastHeartbeat
    };
  }
};

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', function() {
  if (document.getElementById('calendar')) {
    CalendarioApp.RealtimeNotifications.init();
  }
});

// También inicializar después de un delay para asegurar que todo esté cargado
setTimeout(() => {
  if (document.getElementById('calendar') && !CalendarioApp.RealtimeNotifications.state.socket) {
    CalendarioApp.RealtimeNotifications.init();
  }
}, 2000);
