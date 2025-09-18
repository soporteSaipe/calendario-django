/**
 * EFECTOS DE VIENTO AVANZADOS
 * Sistema de viento dinámico que afecta las hojas y flores
 */

class WindEffectsSystem {
  constructor(fallingLeavesSystem) {
    this.fallingLeavesSystem = fallingLeavesSystem;
    this.windIntensity = 0.5; // 0 a 1
    this.windDirection = 0; // -1 a 1 (izquierda a derecha)
    this.windGusts = [];
    this.isActive = false;
    this.windUpdateInterval = null;
    this.gustInterval = null;
    
    this.init();
  }

  init() {
    this.createWindIndicator();
    this.startWindSystem();
    this.bindEvents();
  }

  createWindIndicator() {
    // Sin indicador visual para simplificar
    this.windIndicator = null;
    this.windArrow = null;
  }

  startWindSystem() {
    this.isActive = true;
    this.windUpdateInterval = setInterval(() => {
      this.updateWind();
    }, 50); // Actualizar cada 50ms para mayor suavidad
    
    this.gustInterval = setInterval(() => {
      this.createWindGust();
    }, 1500 + Math.random() * 2000); // Ráfagas cada 1.5-3.5 segundos (más frecuentes)
  }

  stopWindSystem() {
    this.isActive = false;
    if (this.windUpdateInterval) {
      clearInterval(this.windUpdateInterval);
    }
    if (this.gustInterval) {
      clearInterval(this.gustInterval);
    }
  }

  updateWind() {
    if (!this.isActive) return;
    
    // Simular viento natural con variaciones suaves
    this.windIntensity = this.calculateWindIntensity();
    this.windDirection = this.calculateWindDirection();
    
    // Aplicar viento a elementos existentes
    this.applyWindToElements();
    
    // Actualizar indicador visual
    this.updateWindIndicator();
  }

  calculateWindIntensity() {
    // Simular viento con patrones naturales - Más intenso
    const time = Date.now() * 0.001;
    const baseIntensity = 0.5; // Aumentado de 0.3 a 0.5
    const variation = Math.sin(time * 0.8) * 0.3 + Math.sin(time * 0.2) * 0.2; // Más variación
    const gustEffect = this.calculateGustEffect();
    
    return Math.max(0, Math.min(1, baseIntensity + variation + gustEffect));
  }

  calculateWindDirection() {
    const time = Date.now() * 0.001;
    const baseDirection = Math.sin(time * 0.3) * 0.5;
    const gustDirection = this.calculateGustDirection();
    
    return Math.max(-1, Math.min(1, baseDirection + gustDirection));
  }

  calculateGustEffect() {
    let gustEffect = 0;
    this.windGusts.forEach((gust, index) => {
      const age = Date.now() - gust.startTime;
      const duration = gust.duration;
      const progress = age / duration;
      
      if (progress < 1) {
        // Efecto de ráfaga con curva de intensidad
        const intensity = gust.intensity * (1 - progress) * Math.sin(progress * Math.PI);
        gustEffect += intensity;
      } else {
        // Remover ráfagas expiradas
        this.windGusts.splice(index, 1);
      }
    });
    
    return gustEffect;
  }

  calculateGustDirection() {
    let gustDirection = 0;
    this.windGusts.forEach(gust => {
      const age = Date.now() - gust.startTime;
      const duration = gust.duration;
      const progress = age / duration;
      
      if (progress < 1) {
        const intensity = gust.intensity * (1 - progress);
        gustDirection += gust.direction * intensity;
      }
    });
    
    return gustDirection;
  }

  createWindGust() {
    const gust = {
      startTime: Date.now(),
      duration: 800 + Math.random() * 1200, // 0.8-2 segundos (más cortos)
      intensity: 0.4 + Math.random() * 0.5, // 0.4-0.9 (más intensos)
      direction: (Math.random() - 0.5) * 2 // -1 a 1
    };
    
    this.windGusts.push(gust);
  }

  applyWindToElements() {
    if (!this.fallingLeavesSystem) return;
    
    const elements = [...this.fallingLeavesSystem.leaves, ...this.fallingLeavesSystem.flowers];
    elements.forEach(element => {
      if (element && element.style) {
        this.applyWindToElement(element);
      }
    });
  }

  applyWindToElement(element) {
    const windForce = this.windIntensity * this.windDirection * 50; // Fuerza del viento
    const currentTransform = element.style.transform || '';
    
    // Extraer escala existente
    const scaleMatch = currentTransform.match(/scale\(([^)]+)\)/);
    const scale = scaleMatch ? scaleMatch[1] : '1';
    
    // Aplicar viento como translateX
    const windOffset = windForce * (Math.random() * 0.5 + 0.5); // Variación individual
    element.style.transform = `scale(${scale}) translateX(${windOffset}px)`;
    
    // Aplicar rotación adicional por viento
    const windRotation = this.windIntensity * this.windDirection * 10;
    element.style.transform += ` rotate(${windRotation}deg)`;
  }

  updateWindIndicator() {
    // Sin indicador visual
    return;
  }

  bindEvents() {
    // Detener viento cuando la página no es visible
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this.stopWindSystem();
      } else {
        this.startWindSystem();
      }
    });
  }

  // Métodos públicos para control
  setWindIntensity(intensity) {
    this.windIntensity = Math.max(0, Math.min(1, intensity));
  }

  setWindDirection(direction) {
    this.windDirection = Math.max(-1, Math.min(1, direction));
  }

  createStrongGust() {
    const gust = {
      startTime: Date.now(),
      duration: 2000,
      intensity: 0.8,
      direction: (Math.random() - 0.5) * 2
    };
    this.windGusts.push(gust);
  }

  getWindInfo() {
    return {
      intensity: this.windIntensity,
      direction: this.windDirection,
      gusts: this.windGusts.length
    };
  }
}

// Inicialización cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', function() {
  // Esperar a que el sistema de hojas esté listo
  setTimeout(() => {
    if (window.fallingLeavesSystem) {
      window.windEffectsSystem = new WindEffectsSystem(window.fallingLeavesSystem);
    }
  }, 1000);
});

// Exportar para uso en módulos
if (typeof module !== 'undefined' && module.exports) {
  module.exports = WindEffectsSystem;
}
