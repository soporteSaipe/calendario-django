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
    supportedFormats: ['pdf', 'xlsx'],
    maxExportSize: 1000, // Máximo número de eventos a exportar
    exportTimeout: 30000, // 30 segundos timeout
    retryAttempts: 3,
    retryDelay: 1000
  },

  // Inicialización
  init: function() {
    this.createExportControls();
    this.setupEventListeners();
  },

  // Crear controles de exportación
  createExportControls: function() {
    // Solo mostrar para administradores
    if (!this.isAdmin()) {
      return;
    }

    const calendarContainer = document.querySelector('.calendar-container');
    if (!calendarContainer) {
      return;
    }

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
        <button class="btn-export btn-export-excel" data-format="xlsx" title="Exportar como Excel">
          <i class="fas fa-file-excel me-1"></i>Excel
        </button>
        <button class="btn-export btn-export-options" title="Configurar exportación">
          <i class="fas fa-calendar-alt me-1"></i>Configurar
        </button>
      </div>
      </div>
    `;

    calendarContainer.insertAdjacentHTML('beforebegin', exportControls.outerHTML);
    
    // Crear modal de exportación
    this.createExportModal();
    this.setDefaultDateRange();
  },

  // Crear modal de exportación
  createExportModal: function() {
    const modalHTML = `
      <div class="modal fade" id="exportModal" tabindex="-1" aria-labelledby="exportModalLabel" aria-hidden="true">
        <div class="modal-dialog modal-lg">
          <div class="modal-content modal-content-modern">
            <div class="modal-header modal-header-modern">
              <h5 class="modal-title modal-title-modern" id="exportModalLabel">
                <i class="fas fa-download me-2"></i>
                Configurar Exportación
              </h5>
              <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Cerrar"></button>
            </div>
            <div class="modal-body">
              <div class="export-form">
                <div class="form-group">
                  <label class="form-label">
                    <i class="fas fa-calendar-alt"></i>
                    Rango de Fechas
                  </label>
                  <div class="date-range-inputs">
                    <div class="date-input-group">
                      <label class="date-label">Desde</label>
                      <input type="date" id="exportDateFrom" class="form-control" />
                    </div>
                    <div class="date-input-group">
                      <label class="date-label">Hasta</label>
                      <input type="date" id="exportDateTo" class="form-control" />
                    </div>
                  </div>
                  <div class="date-info">
                    <i class="fas fa-info-circle"></i>
                    Máximo 365 días de diferencia
                  </div>
                </div>

                <div class="form-group">
                  <label class="form-label">
                    <i class="fas fa-file-export"></i>
                    Formato de Archivo
                  </label>
                  <div class="format-selector">
                    <label class="format-option">
                      <input type="radio" name="exportFormat" value="pdf" checked>
                      <div class="format-card">
                        <i class="fas fa-file-pdf"></i>
                        <span>PDF</span>
                        <small>Documento imprimible</small>
                      </div>
                    </label>
                    <label class="format-option">
                      <input type="radio" name="exportFormat" value="xlsx">
                      <div class="format-card">
                        <i class="fas fa-file-excel"></i>
                        <span>Excel</span>
                        <small>Hoja de cálculo</small>
                      </div>
                    </label>
                  </div>
                </div>

                <div class="export-info">
                  <div class="info-item">
                    <i class="fas fa-check-circle"></i>
                    <span>Incluye todas las salas activas</span>
                  </div>
                  <div class="info-item">
                    <i class="fas fa-check-circle"></i>
                    <span>Solo reservas confirmadas</span>
                  </div>
                  <div class="info-item">
                    <i class="fas fa-check-circle"></i>
                    <span>Incluye descripciones</span>
                  </div>
                </div>
              </div>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn-modern btn-secondary-modern" data-bs-dismiss="modal">
                <i class="fas fa-times me-1"></i>Cancelar
              </button>
              <button type="button" class="btn-modern btn-primary-modern" id="confirmExport">
                <i class="fas fa-download me-1"></i>Exportar
              </button>
            </div>
          </div>
        </div>
      </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalHTML);
  },

  // Verificar si es administrador
  isAdmin: function() {
    // Verificar si el usuario es administrador
    const userMenu = document.querySelector('.dropdown-menu');
    const adminLink = userMenu && userMenu.querySelector('a[href="/admin/"]');
    
    return adminLink !== null;
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
      if (e.target.matches('.btn-export-pdf, .btn-export-excel')) {
        const format = e.target.dataset.format;
        this.showExportModal(format);
      } else if (e.target.matches('.btn-export-options')) {
        this.showExportModal();
      } else if (e.target.matches('#confirmExport')) {
        this.confirmExport();
      }
    });

    // Cambios en el formato
    document.addEventListener('change', (e) => {
      if (e.target.name === 'exportFormat') {
        this.updateExportFormat(e.target.value);
      }
    });
  },

  // Mostrar modal de exportación
  showExportModal: function(format) {
    const modal = document.getElementById('exportModal');
    if (modal) {
      // Seleccionar formato si se especifica
      if (format) {
        const formatInput = document.querySelector(`input[name="exportFormat"][value="${format}"]`);
        if (formatInput) {
          formatInput.checked = true;
        }
      }
      
      // Mostrar modal usando Bootstrap
      const bootstrapModal = new bootstrap.Modal(modal);
      bootstrapModal.show();
    }
  },

  // Actualizar formato de exportación
  updateExportFormat: function(format) {
    // Actualizar UI según el formato seleccionado
    const buttons = document.querySelectorAll('.btn-export');
    buttons.forEach(btn => {
      btn.classList.remove('active');
      if (btn.dataset.format === format) {
        btn.classList.add('active');
      }
    });
  },

  // Confirmar exportación
  confirmExport: function() {
    const exportData = this.getExportData();
    if (!exportData) return;

    // Cerrar modal
    const modal = document.getElementById('exportModal');
    if (modal) {
      const bootstrapModal = bootstrap.Modal.getInstance(modal);
      if (bootstrapModal) {
        bootstrapModal.hide();
      }
    }

    this.startExport(exportData);
  },

  // Obtener datos de exportación
  getExportData: function() {
    const dateFrom = document.getElementById('exportDateFrom')?.value;
    const dateTo = document.getElementById('exportDateTo')?.value;
    const format = document.querySelector('input[name="exportFormat"]:checked')?.value;

    // Validación básica
    if (!dateFrom || !dateTo || !format) {
      this.showError('Por favor completa todos los campos requeridos', 'warning');
      return null;
    }

    const startDate = new Date(dateFrom);
    const endDate = new Date(dateTo);

    if (startDate > endDate) {
      this.showError('La fecha de inicio debe ser anterior a la fecha de fin', 'error');
      return null;
    }

    const daysDiff = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24));
    if (daysDiff > 365) {
      this.showError('El rango de fechas no puede ser mayor a 365 días', 'warning');
      return null;
    }

    return {
      dateFrom,
      dateTo,
      format
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
      date_to: exportData.dateTo
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
  showError: function(message, type = 'error') {
    if (window.CalendarioApp && CalendarioApp.Notifications) {
      const notificationType = type === 'warning' ? 'warning' : 'error';
      CalendarioApp.Notifications[notificationType](message, {
        duration: 5000
      });
    } else {
      // Fallback para cuando no hay sistema de notificaciones
      this.showFallbackNotification(message, type);
    }
  },

  // Notificación de respaldo
  showFallbackNotification: function(message, type) {
    const notification = document.createElement('div');
    notification.className = `export-notification ${type}`;
    notification.innerHTML = `
      <div class="notification-content">
        <i class="fas fa-${type === 'error' ? 'exclamation-triangle' : 'info-circle'}"></i>
        <span>${message}</span>
        <button class="notification-close" onclick="this.parentElement.parentElement.remove()">
          <i class="fas fa-times"></i>
        </button>
      </div>
    `;
    
    document.body.appendChild(notification);
    
    // Auto-remove después de 5 segundos
    setTimeout(() => {
      if (notification.parentElement) {
        notification.remove();
      }
    }, 5000);
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
