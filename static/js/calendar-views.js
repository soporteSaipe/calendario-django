/**
 * VISTAS DE CALENDARIO AVANZADAS
 * Sistema de vistas múltiples para el calendario (día, semana, mes)
 */

CalendarioApp.CalendarViews = {
  // Configuración
  config: {
    defaultView: 'dayGridMonth',
    availableViews: [
      { value: 'timeGridDay', label: 'Día', icon: 'fas fa-calendar-day' },
      { value: 'timeGridWeek', label: 'Semana', icon: 'fas fa-calendar-week' },
      { value: 'dayGridMonth', label: 'Mes', icon: 'fas fa-calendar-alt' }
    ],
    dateQuickOptions: []
  },

  // Estado actual
  state: {
    currentView: 'dayGridMonth',
    currentDate: new Date(),
    calendarInstance: null
  },

  // Inicialización
  init: function() {
    this.createViewControls();
    this.bindEvents();
    
    // Esperar a que el calendario esté inicializado
    this.waitForCalendar();
  },

  // Esperar a que el calendario esté listo
  waitForCalendar: function() {
    let attempts = 0;
    const maxAttempts = 20; // Reducido a 2 segundos máximo
    
    const checkCalendar = () => {
      attempts++;
      
      // Buscar en CalendarioApp primero
      if (window.CalendarioApp && CalendarioApp.Calendar && CalendarioApp.Calendar.calendar) {
        this.state.calendarInstance = CalendarioApp.Calendar.calendar;
        this.updateCalendarView();
        return;
      }
      
      // Buscar en el DOM
      const calendarElement = document.getElementById('calendar');
      if (calendarElement && calendarElement._fullCalendar) {
        this.state.calendarInstance = calendarElement._fullCalendar;
        this.updateCalendarView();
        return;
      }
      
      // Reintentar si no hemos alcanzado el máximo
      if (attempts < maxAttempts) {
        setTimeout(checkCalendar, 100);
      } else {
        // Fallback: intentar inicializar sin conexión
        this.initializeFallback();
      }
    };
    
    checkCalendar();
  },

  // Inicialización de respaldo
  initializeFallback: function() {
    // Crear controles básicos sin conexión al calendario
    this.createViewControls();
    this.bindEvents();
  },

  // Crear controles de vista
  createViewControls: function() {
    const calendarContainer = document.querySelector('.calendar-container');
    if (!calendarContainer) return;

    const controlsHTML = `
      <div class="calendar-view-controls" id="calendarViewControls">
        <div class="view-selector" id="viewSelector">
          ${this.config.availableViews.map(view => `
            <button class="view-option ${view.value === this.config.defaultView ? 'active' : ''}" 
                    data-view="${view.value}">
              <i class="${view.icon} me-1"></i>
              ${view.label}
            </button>
          `).join('')}
        </div>
        
        <div class="navigation-controls">
          <button class="nav-btn" id="prevBtn" title="Anterior">
            <i class="fas fa-chevron-left"></i>
          </button>
          
          <h5 class="current-view-title" id="currentViewTitle">
            ${this.getCurrentViewTitle()}
          </h5>
          
          <button class="nav-btn" id="nextBtn" title="Siguiente">
            <i class="fas fa-chevron-right"></i>
          </button>
        </div>
        
        
        <div class="view-indicator">
          <i class="fas fa-eye"></i>
          <span id="viewIndicatorText">Vista ${this.state.currentView}</span>
        </div>
      </div>
    `;

    calendarContainer.insertAdjacentHTML('beforebegin', controlsHTML);
  },

  // Vincular eventos
  bindEvents: function() {
    // Selector de vista
    const viewSelector = document.getElementById('viewSelector');
    if (viewSelector) {
      viewSelector.addEventListener('click', (e) => {
        const viewOption = e.target.closest('.view-option');
        if (viewOption) {
          this.changeView(viewOption.dataset.view);
        }
      });
    }

    // Navegación
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');
    
    if (prevBtn) {
      prevBtn.addEventListener('click', () => {
        this.navigateView('prev');
      });
    }
    
    if (nextBtn) {
      nextBtn.addEventListener('click', () => {
        this.navigateView('next');
      });
    }


    // Navegación con teclado
    document.addEventListener('keydown', (e) => {
      if (e.ctrlKey || e.metaKey) {
        switch (e.key) {
          case 'ArrowLeft':
            e.preventDefault();
            this.navigateView('prev');
            break;
          case 'ArrowRight':
            e.preventDefault();
            this.navigateView('next');
            break;
          case '1':
            e.preventDefault();
            this.changeView('timeGridDay');
            break;
          case '2':
            e.preventDefault();
            this.changeView('timeGridWeek');
            break;
          case '3':
            e.preventDefault();
            this.changeView('dayGridMonth');
            break;
        }
      }
    });
  },

  // Cambiar vista
  changeView: function(view) {
    if (this.state.currentView === view) return;

    console.log('Cambiando vista a:', view);

    // Actualizar estado
    this.state.currentView = view;

    // Actualizar UI
    this.updateViewSelector();
    this.updateViewIndicator();
    this.updateCalendarView();
    this.updateNavigationButtons();

    // Notificar cambio
    if (window.CalendarioApp && CalendarioApp.Notifications) {
      const friendlyName = this.getFriendlyViewName(view);
      CalendarioApp.Notifications.info(`Cambiado a vista ${friendlyName}`, {
        duration: 2000
      });
    }
  },

  // Navegar en la vista actual
  navigateView: function(direction) {
    if (!this.state.calendarInstance) {
      console.warn('Instancia del calendario no disponible');
      return;
    }

    const calendar = this.state.calendarInstance;
    
    try {
      switch (direction) {
        case 'prev':
          calendar.prev();
          break;
        case 'next':
          calendar.next();
          break;
        case 'today':
          calendar.today();
          break;
      }

      this.updateCurrentDate();
      this.updateViewTitle();
    } catch (error) {
      console.warn('Error al navegar en el calendario:', error);
    }
  },


  // Ir a una fecha específica
  goToDate: function(date) {
    if (!this.state.calendarInstance) return;

    this.state.calendarInstance.gotoDate(date);
    this.state.currentDate = new Date(date);
    this.updateViewTitle();
  },

  // Actualizar vista del calendario
  updateCalendarView: function() {
    if (!this.state.calendarInstance) {
      console.warn('Instancia del calendario no disponible para cambiar vista');
      return;
    }

    try {
      console.log('Cambiando vista del calendario a:', this.state.currentView);
      this.state.calendarInstance.changeView(this.state.currentView);
      this.updateCurrentDate();
      this.updateViewTitle();
      console.log('Vista cambiada exitosamente');
    } catch (error) {
      console.error('Error al cambiar la vista del calendario:', error);
    }
  },

  // Actualizar selector de vista
  updateViewSelector: function() {
    const viewOptions = document.querySelectorAll('.view-option');
    viewOptions.forEach(option => {
      option.classList.toggle('active', option.dataset.view === this.state.currentView);
    });
  },

  // Actualizar indicador de vista
  updateViewIndicator: function() {
    const indicatorText = document.getElementById('viewIndicatorText');
    if (indicatorText) {
      const viewLabel = this.config.availableViews.find(v => v.value === this.state.currentView)?.label || this.state.currentView;
      indicatorText.textContent = `Vista ${viewLabel}`;
    }
  },

  // Actualizar título de la vista actual
  updateViewTitle: function() {
    const titleElement = document.getElementById('currentViewTitle');
    if (titleElement) {
      titleElement.textContent = this.getCurrentViewTitle();
    }
  },

  // Obtener título de la vista actual
  getCurrentViewTitle: function() {
    const date = this.state.currentDate;
    
    switch (this.state.currentView) {
      case 'timeGridDay':
        return date.toLocaleDateString('es-ES', { 
          weekday: 'long', 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric' 
        });
      case 'timeGridWeek':
        const weekStart = new Date(date);
        weekStart.setDate(date.getDate() - date.getDay());
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 6);
        
        return `${weekStart.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })} - ${weekEnd.toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })}`;
      case 'dayGridMonth':
        return date.toLocaleDateString('es-ES', { 
          year: 'numeric', 
          month: 'long' 
        });
      default:
        return 'Calendario';
    }
  },

  // Actualizar fecha actual
  updateCurrentDate: function() {
    if (this.state.calendarInstance) {
      this.state.currentDate = this.state.calendarInstance.getDate();
    }
  },

  // Actualizar botones de navegación
  updateNavigationButtons: function() {
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');
    
    if (prevBtn && nextBtn) {
      // Actualizar tooltips según la vista
      const viewLabels = {
        timeGridDay: 'día',
        timeGridWeek: 'semana',
        dayGridMonth: 'mes'
      };
      
      const viewLabel = viewLabels[this.state.currentView] || 'período';
      
      prevBtn.title = `${viewLabel.charAt(0).toUpperCase() + viewLabel.slice(1)} anterior`;
      nextBtn.title = `${viewLabel.charAt(0).toUpperCase() + viewLabel.slice(1)} siguiente`;
    }
  },

  // Obtener configuración de FullCalendar para la vista actual
  getViewConfig: function() {
    const baseConfig = {
      headerToolbar: false, // Usamos nuestros propios controles
      height: 'auto',
      aspectRatio: 1.35,
      dayMaxEvents: true,
      moreLinkClick: 'popover',
      eventDisplay: 'block',
      eventTimeFormat: {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      }
    };

    switch (this.state.currentView) {
      case 'timeGridDay':
        return {
          ...baseConfig,
          aspectRatio: 1.8,
          slotMinTime: '07:00:00',
          slotMaxTime: '18:00:00',
          slotDuration: '00:30:00'
        };
      case 'timeGridWeek':
        return {
          ...baseConfig,
          aspectRatio: 1.6,
          slotMinTime: '07:00:00',
          slotMaxTime: '18:00:00',
          slotDuration: '00:30:00'
        };
      case 'dayGridMonth':
        return {
          ...baseConfig,
          aspectRatio: 1.35,
          dayMaxEvents: 3
        };
      default:
        return baseConfig;
    }
  },

  // Obtener vista actual
  getCurrentView: function() {
    return this.state.currentView;
  },

  // Obtener nombre amigable de la vista
  getFriendlyViewName: function(view) {
    const friendlyNames = {
      'timeGridDay': 'Día',
      'timeGridWeek': 'Semana', 
      'dayGridMonth': 'Mes'
    };
    return friendlyNames[view] || view;
  },

  // Obtener fecha actual
  getCurrentDate: function() {
    return this.state.currentDate;
  },

  // Establecer instancia del calendario
  setCalendarInstance: function(calendarInstance) {
    this.state.calendarInstance = calendarInstance;
  }
};

// Función para integrar con el calendario existente
CalendarioApp.CalendarViews.integrateWithCalendar = function(calendarInstance) {
  console.log('Integrando con calendario:', calendarInstance);
  this.state.calendarInstance = calendarInstance;
  this.updateCalendarView();
};

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', function() {
  if (document.getElementById('calendar')) {
    CalendarioApp.CalendarViews.init();
  }
});

// También inicializar después de un delay para asegurar que el calendario esté listo
setTimeout(() => {
  if (document.getElementById('calendar') && !CalendarioApp.CalendarViews.state.calendarInstance) {
    CalendarioApp.CalendarViews.init();
  }
}, 1000);
