/**
 * INTEGRACIÓN RÁPIDA - Sistema de Hojas Cayendo para Django
 * 
 * Este archivo proporciona una integración lista para usar con tu proyecto Django
 * Incluye configuración automática y detección de páginas específicas
 */

// Configuración específica para el Sistema de Reservas SAIPE
const SAIPE_CONFIG = {
  // Configuración por defecto
  default: {
    theme: 'spring',
    density: 0.7,
    driftX: 18,
    gravityY: 60,
    windOscillation: { amplitude: 24, frequency: 0.25 },
    size: { min: 12, max: 35 },
    spin: { min: -0.8, max: 0.8 },
    opacity: 0.95,
    interactive: true,
    zIndex: 0
  },
  
  // Configuración para página de calendario
  calendario: {
    theme: 'spring',
    density: 0.8,
    driftX: 15,
    gravityY: 50,
    windOscillation: { amplitude: 20, frequency: 0.3 },
    size: { min: 10, max: 28 },
    spin: { min: -0.5, max: 0.5 },
    opacity: 0.9,
    interactive: true,
    zIndex: 1
  },
  
  // Configuración para página de login
  login: {
    theme: 'mixed',
    density: 0.4,
    driftX: 12,
    gravityY: 45,
    windOscillation: { amplitude: 15, frequency: 0.4 },
    size: { min: 8, max: 22 },
    spin: { min: -0.3, max: 0.3 },
    opacity: 0.7,
    interactive: false,
    zIndex: -1
  },
  
  // Configuración para páginas de administración
  admin: {
    theme: 'autumn',
    density: 0.3,
    driftX: 10,
    gravityY: 40,
    windOscillation: { amplitude: 12, frequency: 0.5 },
    size: { min: 6, max: 18 },
    spin: { min: -0.2, max: 0.2 },
    opacity: 0.6,
    interactive: false,
    zIndex: -1
  },
  
  // Configuración para dispositivos móviles
  mobile: {
    density: 0.2,
    maxParticles: 60,
    interactive: false,
    opacity: 0.5,
    size: { min: 8, max: 20 }
  }
};

/**
 * Detecta el tipo de página basado en la URL
 * @returns {string} - Tipo de página detectado
 */
function detectPageType() {
  const path = window.location.pathname.toLowerCase();
  
  if (path.includes('calendario')) return 'calendario';
  if (path.includes('login') || path.includes('auth')) return 'login';
  if (path.includes('admin')) return 'admin';
  
  return 'default';
}

/**
 * Detecta si es un dispositivo móvil
 * @returns {boolean} - True si es móvil
 */
function isMobile() {
  return window.innerWidth <= 768 || /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}

/**
 * Obtiene la configuración apropiada para la página actual
 * @returns {Object} - Configuración fusionada
 */
function getConfiguration() {
  const pageType = detectPageType();
  const mobile = isMobile();
  
  let config = { ...SAIPE_CONFIG.default };
  
  // Aplicar configuración específica de página
  if (SAIPE_CONFIG[pageType]) {
    config = { ...config, ...SAIPE_CONFIG[pageType] };
  }
  
  // Aplicar configuración móvil si es necesario
  if (mobile) {
    config = { ...config, ...SAIPE_CONFIG.mobile };
  }
  
  return config;
}

/**
 * Inicializa el sistema de hojas cayendo
 */
function initializeFallingPetals() {
  // Verificar si ya existe una instancia
  if (window.saipeFallingPetals) {
    console.log('Sistema de hojas cayendo ya inicializado');
    return window.saipeFallingPetals;
  }
  
  // Verificar si ya hay un canvas existente
  if (document.getElementById('falling-petals-canvas')) {
    console.log('Canvas de hojas cayendo ya existe');
    return null;
  }
  
  // Verificar soporte de canvas
  if (!document.createElement('canvas').getContext) {
    console.warn('Canvas no soportado, deshabilitando efecto de hojas');
    return null;
  }
  
  // Verificar preferencias de movimiento reducido
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    console.log('Efecto de hojas deshabilitado por preferencias de accesibilidad');
    return null;
  }
  
  try {
    // Importar dinámicamente el módulo
    import('./fallingPetals.js').then(({ createFallingPetals }) => {
      // Verificar nuevamente si ya existe una instancia
      if (window.saipeFallingPetals) {
        console.log('Sistema ya inicializado durante la carga del módulo');
        return;
      }
      
      const config = getConfiguration();
      const effect = createFallingPetals(document, config);
      
      // Guardar referencia global
      window.saipeFallingPetals = effect;
      
      // Iniciar automáticamente
      effect.start();
      
      // Ajustar configuración en resize
      let resizeTimeout;
      window.addEventListener('resize', () => {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(() => {
          const newConfig = getConfiguration();
          effect.setOptions(newConfig);
        }, 250);
      });
      
      console.log('Sistema de hojas cayendo inicializado:', config);
    }).catch(error => {
      console.error('Error al cargar el sistema de hojas cayendo:', error);
    });
    
  } catch (error) {
    console.error('Error al inicializar el sistema de hojas cayendo:', error);
  }
}

/**
 * Controla el sistema de hojas cayendo
 */
const FallingPetalsController = {
  /**
   * Inicia el efecto
   */
  start() {
    if (window.saipeFallingPetals) {
      window.saipeFallingPetals.start();
    }
  },
  
  /**
   * Detiene el efecto
   */
  stop() {
    if (window.saipeFallingPetals) {
      window.saipeFallingPetals.stop();
    }
  },
  
  /**
   * Cambia el tema
   * @param {string} theme - Nuevo tema ('spring', 'autumn', 'mixed')
   */
  setTheme(theme) {
    if (window.saipeFallingPetals) {
      window.saipeFallingPetals.setOptions({ theme });
    }
  },
  
  /**
   * Ajusta la densidad
   * @param {number} density - Nueva densidad (0-2)
   */
  setDensity(density) {
    if (window.saipeFallingPetals) {
      window.saipeFallingPetals.setOptions({ density });
    }
  },
  
  /**
   * Habilita/deshabilita la interacción
   * @param {boolean} interactive - True para habilitar interacción
   */
  setInteractive(interactive) {
    if (window.saipeFallingPetals) {
      window.saipeFallingPetals.setOptions({ interactive });
    }
  },
  
  /**
   * Destruye el sistema
   */
  destroy() {
    if (window.saipeFallingPetals) {
      window.saipeFallingPetals.destroy();
      window.saipeFallingPetals = null;
    }
  }
};

// Auto-inicialización cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', initializeFallingPetals);

// Exportar controlador para uso externo
if (typeof window !== 'undefined') {
  window.FallingPetalsController = FallingPetalsController;
}

// Ejemplo de uso desde la consola:
// FallingPetalsController.setTheme('autumn');
// FallingPetalsController.setDensity(0.5);
// FallingPetalsController.stop();
// FallingPetalsController.start();
