/**
 * CALENDARIO MODAL FACTORY
 * Factory Pattern para creación y gestión de modales
 */

// CalendarioApp ya está inicializado en calendario-core.js

CalendarioApp.ModalFactory = {
  // Instancias de modales activos
  activeModals: new Map(),

  // Configuraciones predefinidas
  templates: {
    confirm: {
      title: 'Confirmar acción',
      body: '¿Estás seguro de que deseas continuar?',
      buttons: {
        cancel: { text: 'Cancelar', class: 'btn-secondary-modern' },
        confirm: { text: 'Confirmar', class: 'btn-primary-modern' }
      }
    },

    alert: {
      title: 'Información',
      body: 'Mensaje de información',
      buttons: {
        ok: { text: 'Aceptar', class: 'btn-primary-modern' }
      }
    },

    loading: {
      title: 'Procesando...',
      body: '<div class="text-center"><div class="loading-spinner"></div><p class="mt-3">Por favor espera...</p></div>',
      buttons: {},
      closable: false
    },

    reservaDetails: {
      title: 'Detalles de Reserva',
      body: '<div id="reservaDetailsContent">Cargando...</div>',
      buttons: {
        close: { text: 'Cerrar', class: 'btn-secondary-modern' }
      }
    },

    editarReserva: {
      title: 'Editar Reserva',
      body: '<div id="editReservaContent">Cargando formulario...</div>',
      buttons: {
        cancel: { text: 'Cancelar', class: 'btn-secondary-modern' },
        save: { text: 'Guardar', class: 'btn-primary-modern' }
      }
    },

    salaDetails: {
      title: 'Detalles de Sala',
      body: '<div id="salaDetailsContent">Cargando...</div>',
      buttons: {
        close: { text: 'Cerrar', class: 'btn-secondary-modern' }
      }
    },

    export: {
      title: 'Exportar Calendario',
      body: '<div id="exportContent">Configurando exportación...</div>',
      buttons: {
        cancel: { text: 'Cancelar', class: 'btn-secondary-modern' },
        export: { text: 'Exportar', class: 'btn-primary-modern' }
      }
    }
  },

  /**
   * Crear modal usando template predefinido
   */
  create: function(templateName, options = {}) {
    const template = this.templates[templateName];
    if (!template) {
      throw new Error(`Template '${templateName}' no encontrado`);
    }

    // Combinar template con opciones personalizadas
    const config = this.mergeTemplateConfig(template, options);
    
    // Generar ID único si no se proporciona
    const modalId = options.id || `modal_${templateName}_${Date.now()}`;
    
    // Crear modal
    const modal = this.buildModal(modalId, config);
    
    // Registrar modal activo
    this.activeModals.set(modalId, {
      element: modal,
      config: config,
      instance: null,
      created: Date.now()
    });

    return modalId;
  },

  /**
   * Crear modal personalizado desde cero
   */
  createCustom: function(options) {
    const defaultConfig = {
      title: 'Modal',
      body: 'Contenido del modal',
      buttons: {},
      size: 'modal-lg',
      closable: true,
      backdrop: true,
      keyboard: true
    };

    const config = { ...defaultConfig, ...options };
    const modalId = options.id || `modal_custom_${Date.now()}`;
    
    const modal = this.buildModal(modalId, config);
    
    this.activeModals.set(modalId, {
      element: modal,
      config: config,
      instance: null,
      created: Date.now()
    });

    return modalId;
  },

  /**
   * Combinar configuración de template con opciones personalizadas
   */
  mergeTemplateConfig: function(template, options) {
    return {
      title: options.title || template.title,
      body: options.body || template.body,
      buttons: { ...template.buttons, ...options.buttons },
      size: options.size || 'modal-lg',
      closable: options.closable !== undefined ? options.closable : template.closable !== false,
      backdrop: options.backdrop !== undefined ? options.backdrop : true,
      keyboard: options.keyboard !== undefined ? options.keyboard : true,
      class: options.class || '',
      ...options
    };
  },

  /**
   * Construir elemento modal HTML
   */
  buildModal: function(modalId, config) {
    const modal = CalendarioApp.Core.UIUtils.createElement('div', {
      id: modalId,
      className: `modal fade ${config.class}`,
      'data-bs-backdrop': config.backdrop,
      'data-bs-keyboard': config.keyboard,
      tabindex: '-1',
      'aria-labelledby': `${modalId}Label`,
      'aria-hidden': 'true'
    });

    const modalDialog = CalendarioApp.Core.UIUtils.createElement('div', {
      className: `modal-dialog ${config.size}`
    });

    const modalContent = CalendarioApp.Core.UIUtils.createElement('div', {
      className: 'modal-content modal-content-modern'
    });

    // Header
    const header = this.buildModalHeader(modalId, config);
    modalContent.appendChild(header);

    // Body
    const body = CalendarioApp.Core.UIUtils.createElement('div', {
      className: 'modal-body'
    }, config.body);
    modalContent.appendChild(body);

    // Footer
    if (Object.keys(config.buttons).length > 0) {
      const footer = this.buildModalFooter(config);
      modalContent.appendChild(footer);
    }

    modalDialog.appendChild(modalContent);
    modal.appendChild(modalDialog);

    // Agregar al DOM
    document.body.appendChild(modal);

    return modal;
  },

  /**
   * Construir header del modal
   */
  buildModalHeader: function(modalId, config) {
    const header = CalendarioApp.Core.UIUtils.createElement('div', {
      className: 'modal-header modal-header-modern'
    });

    const title = CalendarioApp.Core.UIUtils.createElement('h5', {
      className: 'modal-title modal-title-modern',
      id: `${modalId}Label`
    }, config.title);

    header.appendChild(title);

    // Botón de cerrar
    if (config.closable) {
      const closeButton = CalendarioApp.Core.UIUtils.createElement('button', {
        type: 'button',
        className: 'btn-close',
        'data-bs-dismiss': 'modal',
        'aria-label': 'Cerrar'
      });
      header.appendChild(closeButton);
    }

    return header;
  },

  /**
   * Construir footer del modal
   */
  buildModalFooter: function(config) {
    const footer = CalendarioApp.Core.UIUtils.createElement('div', {
      className: 'modal-footer'
    });

    Object.entries(config.buttons).forEach(([key, buttonConfig]) => {
      const button = CalendarioApp.Core.UIUtils.createElement('button', {
        type: 'button',
        className: `btn-modern ${buttonConfig.class}`,
        'data-action': key,
        'data-bs-dismiss': buttonConfig.dismiss !== false ? 'modal' : undefined
      }, buttonConfig.text);

      // Agregar iconos si se especifican
      if (buttonConfig.icon) {
        const icon = CalendarioApp.Core.UIUtils.createElement('i', {
          className: `${buttonConfig.icon} me-1`
        });
        button.insertBefore(icon, button.firstChild);
      }

      footer.appendChild(button);
    });

    return footer;
  },

  /**
   * Mostrar modal
   */
  show: function(modalId, options = {}) {
    const modalData = this.activeModals.get(modalId);
    if (!modalData) {
      console.error(`Modal '${modalId}' no encontrado`);
      return null;
    }

    const modal = modalData.element;
    
    // Crear instancia de Bootstrap Modal si no existe
    if (!modalData.instance) {
      const bsModal = new bootstrap.Modal(modal, {
        backdrop: modalData.config.backdrop,
        keyboard: modalData.config.keyboard
      });
      modalData.instance = bsModal;
    }

    // Configurar eventos si se proporcionan
    if (options.onShow) {
      modal.addEventListener('shown.bs.modal', options.onShow, { once: true });
    }

    if (options.onHide) {
      modal.addEventListener('hidden.bs.modal', options.onHide, { once: true });
    }

    // Mostrar modal
    modalData.instance.show();
    
    // Corregir aria-hidden para accesibilidad
    modal.setAttribute('aria-hidden', 'false');

    // Actualizar estado en StateManager
    if (window.CalendarioApp && CalendarioApp.StateManager) {
      const activeModals = CalendarioApp.StateManager.getState('ui.activeModals') || [];
      if (!activeModals.includes(modalId)) {
        CalendarioApp.StateManager.setState('ui.activeModals', [...activeModals, modalId]);
      }
    }

    return modalData.instance;
  },

  /**
   * Ocultar modal
   */
  hide: function(modalId) {
    const modalData = this.activeModals.get(modalId);
    if (!modalData || !modalData.instance) {
      console.error(`Modal '${modalId}' no encontrado o no está activo`);
      return;
    }

    modalData.instance.hide();
    
    // Restaurar aria-hidden para accesibilidad
    modalData.element.setAttribute('aria-hidden', 'true');

    // Actualizar estado en StateManager
    if (window.CalendarioApp && CalendarioApp.StateManager) {
      const activeModals = CalendarioApp.StateManager.getState('ui.activeModals') || [];
      const filtered = activeModals.filter(id => id !== modalId);
      CalendarioApp.StateManager.setState('ui.activeModals', filtered);
    }
  },

  /**
   * Destruir modal
   */
  destroy: function(modalId) {
    const modalData = this.activeModals.get(modalId);
    if (!modalData) {
      console.error(`Modal '${modalId}' no encontrado`);
      return;
    }

    // Ocultar modal si está activo
    if (modalData.instance) {
      modalData.instance.hide();
    }

    // Remover del DOM
    if (modalData.element && modalData.element.parentNode) {
      modalData.element.parentNode.removeChild(modalData.element);
    }

    // Remover de modales activos
    this.activeModals.delete(modalId);

    // Actualizar estado en StateManager
    if (window.CalendarioApp && CalendarioApp.StateManager) {
      const activeModals = CalendarioApp.StateManager.getState('ui.activeModals') || [];
      const filtered = activeModals.filter(id => id !== modalId);
      CalendarioApp.StateManager.setState('ui.activeModals', filtered);
    }
  },

  /**
   * Obtener instancia de modal
   */
  getInstance: function(modalId) {
    const modalData = this.activeModals.get(modalId);
    return modalData ? modalData.instance : null;
  },

  /**
   * Obtener elemento de modal
   */
  getElement: function(modalId) {
    const modalData = this.activeModals.get(modalId);
    return modalData ? modalData.element : null;
  },

  /**
   * Métodos de conveniencia para modales comunes
   */
  utils: {
    /**
     * Mostrar modal de confirmación
     */
    confirm: function(message, options = {}) {
      return new Promise((resolve) => {
        const modalId = CalendarioApp.ModalFactory.create('confirm', {
          title: options.title || 'Confirmar acción',
          body: message,
          buttons: {
            cancel: { 
              text: options.cancelText || 'Cancelar',
              class: 'btn-secondary-modern',
              dismiss: true
            },
            confirm: { 
              text: options.confirmText || 'Confirmar',
              class: options.confirmClass || 'btn-primary-modern',
              icon: options.confirmIcon || 'fas fa-check'
            }
          }
        });

        const modal = CalendarioApp.ModalFactory.getElement(modalId);
        
        // Configurar eventos
        modal.addEventListener('click', (e) => {
          if (e.target.dataset.action === 'confirm') {
            resolve(true);
            CalendarioApp.ModalFactory.destroy(modalId);
          } else if (e.target.dataset.action === 'cancel') {
            resolve(false);
          }
        });

        modal.addEventListener('hidden.bs.modal', () => {
          resolve(false);
          CalendarioApp.ModalFactory.destroy(modalId);
        });

        CalendarioApp.ModalFactory.show(modalId);
      });
    },

    /**
     * Mostrar modal de alerta
     */
    alert: function(message, options = {}) {
      return new Promise((resolve) => {
        const modalId = CalendarioApp.ModalFactory.create('alert', {
          title: options.title || 'Información',
          body: message,
          buttons: {
            ok: { 
              text: options.okText || 'Aceptar',
              class: 'btn-primary-modern',
              dismiss: true
            }
          }
        });

        const modal = CalendarioApp.ModalFactory.getElement(modalId);
        
        modal.addEventListener('hidden.bs.modal', () => {
          resolve();
          CalendarioApp.ModalFactory.destroy(modalId);
        });

        CalendarioApp.ModalFactory.show(modalId);
      });
    },

    /**
     * Mostrar modal de carga
     */
    loading: function(message = 'Procesando...', options = {}) {
      const modalId = CalendarioApp.ModalFactory.create('loading', {
        title: options.title || 'Procesando...',
        body: `<div class="text-center">
                 <div class="loading-spinner"></div>
                 <p class="mt-3">${message}</p>
                 ${options.subtext ? `<small class="text-muted">${options.subtext}</small>` : ''}
               </div>`,
        size: 'modal-sm',
        closable: false
      });

      CalendarioApp.ModalFactory.show(modalId);
      return modalId;
    },

    /**
     * Ocultar modal de carga
     */
    hideLoading: function(modalId) {
      if (modalId) {
        CalendarioApp.ModalFactory.destroy(modalId);
      } else {
        // Buscar y destruir todos los modales de carga
        this.activeModals.forEach((modalData, id) => {
          if (id.includes('loading')) {
            CalendarioApp.ModalFactory.destroy(id);
          }
        });
      }
    }
  },

  /**
   * Configurar eventos globales para modales
   */
  setupGlobalEvents: function() {
    // Event delegation para botones de modal
    document.addEventListener('click', (e) => {
      const button = e.target.closest('[data-modal]');
      if (button) {
        e.preventDefault();
        const modalId = button.dataset.modal;
        const action = button.dataset.modalAction || 'show';
        
        if (action === 'show') {
          this.show(modalId);
        } else if (action === 'hide') {
          this.hide(modalId);
        } else if (action === 'destroy') {
          this.destroy(modalId);
        }
      }
    });

    // Limpiar modales al cerrar página
    window.addEventListener('beforeunload', () => {
      this.activeModals.forEach((modalData, modalId) => {
        this.destroy(modalId);
      });
    });

    // Manejar tecla Escape para cerrar modales
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        const activeModals = CalendarioApp.StateManager.getState('ui.activeModals') || [];
        if (activeModals.length > 0) {
          const lastModal = activeModals[activeModals.length - 1];
          this.hide(lastModal);
        }
      }
    });
  },

  /**
   * Obtener estadísticas de modales
   */
  getStats: function() {
    return {
      activeCount: this.activeModals.size,
      activeModals: Array.from(this.activeModals.keys()),
      templates: Object.keys(this.templates)
    };
  },

  /**
   * Limpiar todos los modales
   */
  cleanup: function() {
    this.activeModals.forEach((modalData, modalId) => {
      this.destroy(modalId);
    });
  },

  /**
   * Inicializar ModalFactory
   */
  init: function() {
    this.setupGlobalEvents();
  }
};

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', function() {
  CalendarioApp.ModalFactory.init();
});

// Hacer disponible globalmente
window.ModalFactory = CalendarioApp.ModalFactory;
