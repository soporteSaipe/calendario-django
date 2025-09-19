/**
 * SISTEMA DE EXPORTACIÓN DE CALENDARIOS
 * Exportación de calendarios en formato PDF e iCal para administradores
 */

CalendarioApp.CalendarExport = {
  // Estado del sistema
  state: {
    isExporting: false,
    exportQueue: [],
    currentExport: null,
    exportHistory: []
  },

  // Configuración
  config: {
    supportedFormats: ['pdf', 'ical'],
    maxExportSize: 1000, // Máximo número de eventos a exportar
    exportTimeout: 30000, // 30 segundos timeout
    retryAttempts: 3,
    retryDelay: 1000
  },

  // Inicialización
  init: function() {
    console.log('Inicializando sistema de exportación de calendarios...');
    this.createExportControls();
    this.setupEventListeners();
  },

  // Crear controles de exportación
  createExportControls: function() {
    // Solo mostrar para administradores
    if (!this.isAdmin()) return;

    const calendarContainer = document.querySelector('.calendar-container');
    if (!calendarContainer) return;

    const exportControls = document.createElement('div');
    exportControls.className = 'calendar-export-controls';
    exportControls.innerHTML = `
      <div class="export-header">
        <h6 class="export-title">
          <i class="fas fa-download me-2"></i>Exportar Calendario
        </h6>
        <div class="export-actions">
          <button class="btn-export btn-export-pdf" data-format="pdf" title="Exportar como PDF">
            <i class="fas fa-file-pdf me-1"></i>PDF
          </button>
          <button class="btn-export btn-export-ical" data-format="ical" title="Exportar como iCal">
            <i class="fas fa-calendar-alt me-1"></i>iCal
          </button>
          <button class="btn-export btn-export-options" title="Opciones de exportación">
            <i class="fas fa-cog me-1"></i>Opciones
          </button>
        </div>
      </div>
      <div class="export-options-panel" id="exportOptionsPanel" style="display: none;">
        <div class="export-options-content">
          <div class="row">
            <div class="col-md-6">
              <div class="form-group-modern">
                <label class="form-label-modern">Rango de fechas</label>
                <div class="date-range-selector">
                  <input type="date" id="exportDateFrom" class="form-control-modern" />
                  <span class="date-separator">hasta</span>
                  <input type="date" id="exportDateTo" class="form-control-modern" />
                </div>
              </div>
            </div>
            <div class="col-md-6">
              <div class="form-group-modern">
                <label class="form-label-modern">Salas a incluir</label>
                <select id="exportSalas" class="form-select-modern" multiple>
                  <!-- Se llenará dinámicamente -->
                </select>
              </div>
            </div>
          </div>
          <div class="row">
            <div class="col-md-6">
              <div class="form-group-modern">
                <label class="form-label-modern">Incluir detalles</label>
                <div class="form-check-group">
                  <label class="form-check-modern">
                    <input type="checkbox" id="includeDescriptions" checked>
                    <span class="checkmark"></span>
                    Descripciones
                  </label>
                  <label class="form-check-modern">
                    <input type="checkbox" id="includeAttendees" checked>
                    <span class="checkmark"></span>
                    Asistentes
                  </label>
                  <label class="form-check-modern">
                    <input type="checkbox" id="includeLocation" checked>
                    <span class="checkmark"></span>
                    Ubicación
                  </label>
                </div>
              </div>
            </div>
            <div class="col-md-6">
              <div class="form-group-modern">
                <label class="form-label-modern">Formato de archivo</label>
                <div class="format-options">
                  <label class="format-option">
                    <input type="radio" name="exportFormat" value="pdf" checked>
                    <span class="format-label">
                      <i class="fas fa-file-pdf"></i>
                      PDF
                    </span>
                  </label>
                  <label class="format-option">
                    <input type="radio" name="exportFormat" value="ical">
                    <span class="format-label">
                      <i class="fas fa-calendar-alt"></i>
                      iCal
                    </span>
                  </label>
                </div>
              </div>
            </div>
          </div>
          <div class="export-actions-footer">
            <button class="btn-modern btn-secondary-modern" id="cancelExport">
              <i class="fas fa-times me-1"></i>Cancelar
            </button>
            <button class="btn-modern btn-primary-modern" id="confirmExport">
              <i class="fas fa-download me-1"></i>Exportar
            </button>
          </div>
        </div>
      </div>
    `;

    calendarContainer.insertAdjacentHTML('beforebegin', exportControls.outerHTML);
    this.loadSalaOptions();
    this.setDefaultDateRange();
  },

  // Verificar si es administrador
  isAdmin: function() {
    // Verificar si el usuario es administrador
    const userMenu = document.querySelector('.dropdown-menu');
    return userMenu && userMenu.querySelector('a[href="/admin/"]');
  },

  // Cargar opciones de salas
  loadSalaOptions: function() {
    const salaFilter = document.getElementById('salaFilter');
    const exportSalas = document.getElementById('exportSalas');
    
    if (!salaFilter || !exportSalas) return;

    const options = Array.from(salaFilter.options).map(option => {
      if (option.value) {
        return `<option value="${option.value}" selected>${option.textContent}</option>`;
      }
      return '';
    }).filter(option => option);

    exportSalas.innerHTML = options.join('');
  },

  // Establecer rango de fechas por defecto
  setDefaultDateRange: function() {
    const today = new Date();
    const nextMonth = new Date(today);
    nextMonth.setMonth(nextMonth.getMonth() + 1);

    const dateFrom = document.getElementById('exportDateFrom');
    const dateTo = document.getElementById('exportDateTo');

    if (dateFrom) {
      dateFrom.value = today.toISOString().split('T')[0];
    }
    if (dateTo) {
      dateTo.value = nextMonth.toISOString().split('T')[0];
    }
  },

  // Configurar event listeners
  setupEventListeners: function() {
    // Botones de exportación
    document.addEventListener('click', (e) => {
      if (e.target.matches('.btn-export-pdf, .btn-export-ical')) {
        const format = e.target.dataset.format;
        this.showExportOptions(format);
      } else if (e.target.matches('.btn-export-options')) {
        this.toggleExportOptions();
      } else if (e.target.matches('#confirmExport')) {
        this.confirmExport();
      } else if (e.target.matches('#cancelExport')) {
        this.hideExportOptions();
      }
    });

    // Cambios en el formato
    document.addEventListener('change', (e) => {
      if (e.target.name === 'exportFormat') {
        this.updateExportFormat(e.target.value);
      }
    });
  },

  // Mostrar opciones de exportación
  showExportOptions: function(format) {
    const panel = document.getElementById('exportOptionsPanel');
    if (panel) {
      panel.style.display = 'block';
      panel.scrollIntoView({ behavior: 'smooth' });
      
      // Seleccionar formato
      const formatInput = document.querySelector(`input[name="exportFormat"][value="${format}"]`);
      if (formatInput) {
        formatInput.checked = true;
      }
    }
  },

  // Alternar opciones de exportación
  toggleExportOptions: function() {
    const panel = document.getElementById('exportOptionsPanel');
    if (panel) {
      panel.style.display = panel.style.display === 'none' ? 'block' : 'none';
    }
  },

  // Ocultar opciones de exportación
  hideExportOptions: function() {
    const panel = document.getElementById('exportOptionsPanel');
    if (panel) {
      panel.style.display = 'none';
    }
  },

  // Actualizar formato de exportación
  updateExportFormat: function(format) {
    console.log('Formato de exportación cambiado a:', format);
  },

  // Confirmar exportación
  confirmExport: function() {
    const exportData = this.getExportData();
    if (!exportData) return;

    this.startExport(exportData);
  },

  // Obtener datos de exportación
  getExportData: function() {
    const dateFrom = document.getElementById('exportDateFrom')?.value;
    const dateTo = document.getElementById('exportDateTo')?.value;
    const salas = Array.from(document.getElementById('exportSalas')?.selectedOptions || [])
      .map(option => option.value);
    const format = document.querySelector('input[name="exportFormat"]:checked')?.value;

    if (!dateFrom || !dateTo || !format) {
      this.showError('Por favor completa todos los campos requeridos');
      return null;
    }

    if (new Date(dateFrom) > new Date(dateTo)) {
      this.showError('La fecha de inicio debe ser anterior a la fecha de fin');
      return null;
    }

    return {
      dateFrom,
      dateTo,
      salas,
      format,
      includeDescriptions: document.getElementById('includeDescriptions')?.checked || false,
      includeAttendees: document.getElementById('includeAttendees')?.checked || false,
      includeLocation: document.getElementById('includeLocation')?.checked || false
    };
  },

  // Iniciar exportación
  startExport: function(exportData) {
    if (this.state.isExporting) {
      this.showError('Ya hay una exportación en progreso');
      return;
    }

    this.state.isExporting = true;
    this.state.currentExport = exportData;

    // Mostrar indicador de progreso
    this.showProgressIndicator();

    // Realizar exportación
    this.performExport(exportData)
      .then(result => {
        this.handleExportSuccess(result);
      })
      .catch(error => {
        this.handleExportError(error);
      })
      .finally(() => {
        this.state.isExporting = false;
        this.state.currentExport = null;
        this.hideProgressIndicator();
      });
  },

  // Realizar exportación
  performExport: function(exportData) {
    return new Promise((resolve, reject) => {
      const url = this.buildExportUrl(exportData);
      
      fetch(url, {
        method: 'GET',
        headers: {
          'X-Requested-With': 'XMLHttpRequest'
        }
      })
      .then(response => {
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.blob();
      })
      .then(blob => {
        resolve({
          blob: blob,
          filename: this.generateFilename(exportData),
          format: exportData.format
        });
      })
      .catch(error => {
        reject(error);
      });
    });
  },

  // Construir URL de exportación
  buildExportUrl: function(exportData) {
    const params = new URLSearchParams({
      format: exportData.format,
      date_from: exportData.dateFrom,
      date_to: exportData.dateTo,
      salas: exportData.salas.join(','),
      include_descriptions: exportData.includeDescriptions,
      include_attendees: exportData.includeAttendees,
      include_location: exportData.includeLocation
    });

    return `/calendario/export/?${params.toString()}`;
  },

  // Generar nombre de archivo
  generateFilename: function(exportData) {
    const dateFrom = exportData.dateFrom.replace(/-/g, '');
    const dateTo = exportData.dateTo.replace(/-/g, '');
    const timestamp = new Date().toISOString().split('T')[0];
    
    return `calendario_${dateFrom}_${dateTo}_${timestamp}.${exportData.format}`;
  },

  // Manejar éxito de exportación
  handleExportSuccess: function(result) {
    // Descargar archivo
    this.downloadFile(result.blob, result.filename);
    
    // Mostrar notificación
    if (window.CalendarioApp && CalendarioApp.Notifications) {
      CalendarioApp.Notifications.success(`Calendario exportado exitosamente: ${result.filename}`, {
        duration: 5000
      });
    }

    // Agregar al historial
    this.state.exportHistory.push({
      filename: result.filename,
      format: result.format,
      timestamp: new Date(),
      size: result.blob.size
    });
  },

  // Manejar error de exportación
  handleExportError: function(error) {
    console.error('Error en exportación:', error);
    
    if (window.CalendarioApp && CalendarioApp.Notifications) {
      CalendarioApp.Notifications.error('Error al exportar el calendario. Inténtalo de nuevo.', {
        duration: 5000
      });
    }
  },

  // Descargar archivo
  downloadFile: function(blob, filename) {
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  },

  // Mostrar indicador de progreso
  showProgressIndicator: function() {
    const indicator = document.createElement('div');
    indicator.id = 'exportProgressIndicator';
    indicator.className = 'export-progress-indicator';
    indicator.innerHTML = `
      <div class="progress-content">
        <div class="spinner"></div>
        <span>Exportando calendario...</span>
      </div>
    `;
    document.body.appendChild(indicator);
  },

  // Ocultar indicador de progreso
  hideProgressIndicator: function() {
    const indicator = document.getElementById('exportProgressIndicator');
    if (indicator) {
      indicator.remove();
    }
  },

  // Mostrar error
  showError: function(message) {
    if (window.CalendarioApp && CalendarioApp.Notifications) {
      CalendarioApp.Notifications.error(message, {
        duration: 5000
      });
    }
  },

  // Obtener historial de exportaciones
  getExportHistory: function() {
    return this.state.exportHistory;
  },

  // Limpiar historial
  clearHistory: function() {
    this.state.exportHistory = [];
  },

  // Obtener estadísticas
  getStats: function() {
    return {
      isExporting: this.state.isExporting,
      queueLength: this.state.exportQueue.length,
      historyCount: this.state.exportHistory.length,
      currentExport: this.state.currentExport
    };
  }
};

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', function() {
  if (document.getElementById('calendar')) {
    CalendarioApp.CalendarExport.init();
  }
});
