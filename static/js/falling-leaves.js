/**
 * SISTEMA DE CAÍDA DE HOJAS Y FLORES
 * Simula hojas y flores cayendo con efectos de viento realistas
 */

class FallingLeavesSystem {
  constructor(options = {}) {
    this.container = null;
    this.isActive = false;
    this.leaves = [];
    this.flowers = [];
    this.particles = [];
    this.windStrength = 0;
    this.windDirection = 1; // 1 = derecha, -1 = izquierda
    this.animationId = null;
    
    // Configuración por defecto - Mayor densidad y velocidad
    this.config = {
      maxLeaves: 25, // Aumentado de 15 a 25
      maxFlowers: 18, // Aumentado de 10 a 18
      maxParticles: 30, // Aumentado de 20 a 30
      spawnRate: 800, // Reducido de 2000 a 800ms (más rápido)
      windChangeRate: 3000, // Reducido de 5000 a 3000ms (viento más dinámico)
      enableWind: true,
      enableParticles: true,
      leafTypes: ['leaf-1', 'leaf-2', 'leaf-3', 'leaf-4'],
      flowerTypes: ['flower-1', 'flower-2', 'flower-3', 'flower-4'],
      animations: [
        'animate-fall-down',
        'animate-fall-wind-left',
        'animate-fall-wind-right',
        'animate-fall-zigzag',
        'animate-fall-float'
      ],
      durations: ['duration-1', 'duration-2', 'duration-3', 'duration-4', 'duration-5'],
      delays: ['delay-1', 'delay-2', 'delay-3', 'delay-4', 'delay-5', 'delay-6'],
      windEffects: ['wind-gentle', 'wind-strong', 'wind-gusty'],
      ...options
    };
    
    this.init();
  }

  init() {
    this.createContainer();
    this.bindEvents();
    this.startWindSystem();
    this.startSpawnSystem();
  }

  createContainer() {
    // Crear contenedor si no existe
    this.container = document.getElementById('falling-leaves-container');
    if (!this.container) {
      this.container = document.createElement('div');
      this.container.id = 'falling-leaves-container';
      this.container.className = 'falling-leaves-container';
      document.body.appendChild(this.container);
    }
  }

  bindEvents() {
    // Detener animaciones cuando la página no es visible
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this.pause();
      } else {
        this.resume();
      }
    });

    // Ajustar según el tamaño de la ventana
    window.addEventListener('resize', () => {
      this.cleanupOffscreenElements();
    });

    // Detener en dispositivos móviles para mejor rendimiento
    if (window.innerWidth <= 768) {
      this.stop();
    }
  }

  start() {
    if (this.isActive) return;
    this.isActive = true;
    this.startSpawnSystem();
    this.startWindSystem();
  }

  stop() {
    this.isActive = false;
    this.clearAll();
    if (this.spawnInterval) {
      clearInterval(this.spawnInterval);
    }
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
    if (this.windInterval) {
      clearInterval(this.windInterval);
    }
  }

  pause() {
    this.isActive = false;
    if (this.spawnInterval) {
      clearInterval(this.spawnInterval);
    }
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
  }

  resume() {
    if (window.innerWidth > 768) {
      this.isActive = true;
      this.startSpawnSystem();
    }
  }

  startSpawnSystem() {
    if (this.spawnInterval) {
      clearInterval(this.spawnInterval);
    }

    this.spawnInterval = setInterval(() => {
      if (this.isActive) {
        this.spawnRandomElement();
      }
    }, this.config.spawnRate);

    // Limpieza más frecuente para optimizar rendimiento
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }

    this.cleanupInterval = setInterval(() => {
      if (this.isActive) {
        this.cleanupOffscreenElements();
      }
    }, 2000); // Limpiar cada 2 segundos
  }

  startWindSystem() {
    if (!this.config.enableWind) return;

    if (this.windInterval) {
      clearInterval(this.windInterval);
    }

    this.windInterval = setInterval(() => {
      this.updateWind();
    }, this.config.windChangeRate);
  }

  updateWind() {
    // Cambiar dirección y fuerza del viento aleatoriamente
    this.windDirection = Math.random() > 0.5 ? 1 : -1;
    this.windStrength = Math.random() * 0.5 + 0.3; // 0.3 a 0.8
    
    // Aplicar efectos de viento a elementos existentes
    this.applyWindToExistingElements();
  }

  applyWindToExistingElements() {
    const elements = [...this.leaves, ...this.flowers];
    elements.forEach(element => {
      if (element && element.style) {
        const windClass = this.getRandomWindClass();
        element.className = element.className.replace(/wind-\w+/g, '');
        element.classList.add(windClass);
      }
    });
  }

  getRandomWindClass() {
    return this.config.windEffects[Math.floor(Math.random() * this.config.windEffects.length)];
  }

  spawnRandomElement() {
    const shouldSpawnLeaf = this.leaves.length < this.config.maxLeaves;
    const shouldSpawnFlower = this.flowers.length < this.config.maxFlowers;
    
    // Spawn múltiple para mayor densidad
    if (shouldSpawnLeaf && shouldSpawnFlower) {
      // Decidir aleatoriamente entre hoja y flor
      Math.random() > 0.6 ? this.spawnLeaf() : this.spawnFlower();
      
      // Spawn adicional ocasional para mayor densidad
      if (Math.random() > 0.7) {
        Math.random() > 0.5 ? this.spawnLeaf() : this.spawnFlower();
      }
    } else if (shouldSpawnLeaf) {
      this.spawnLeaf();
    } else if (shouldSpawnFlower) {
      this.spawnFlower();
    }

    // Spawn partículas más frecuentemente
    if (this.config.enableParticles && this.particles.length < this.config.maxParticles && Math.random() > 0.6) {
      this.spawnParticle();
    }
  }

  spawnLeaf() {
    const leaf = this.createElement('leaf');
    this.leaves.push(leaf);
    this.container.appendChild(leaf);
    
    // Aplicar efecto fade cuando se acerque al borde
    this.applyFadeEffect(leaf);
    
    // Limpiar después de la animación (más tiempo para que llegue al borde)
    setTimeout(() => {
      this.removeElement(leaf, this.leaves);
    }, this.getAnimationDuration(leaf) * 1000 + 2000); // +2 segundos extra
  }

  spawnFlower() {
    const flower = this.createElement('flower');
    this.flowers.push(flower);
    this.container.appendChild(flower);
    
    // Aplicar efecto fade cuando se acerque al borde
    this.applyFadeEffect(flower);
    
    // Limpiar después de la animación (más tiempo para que llegue al borde)
    setTimeout(() => {
      this.removeElement(flower, this.flowers);
    }, this.getAnimationDuration(flower) * 1000 + 2000); // +2 segundos extra
  }

  spawnParticle() {
    const particle = document.createElement('div');
    particle.className = 'particle';
    particle.style.left = Math.random() * window.innerWidth + 'px';
    particle.style.top = Math.random() * window.innerHeight + 'px';
    
    this.particles.push(particle);
    this.container.appendChild(particle);
    
    // Limpiar después de la animación
    setTimeout(() => {
      this.removeElement(particle, this.particles);
    }, 4000);
  }

  createElement(type) {
    const element = document.createElement('div');
    const isLeaf = type === 'leaf';
    
    // Clase base
    element.className = `falling-${type}`;
    
    // Tipo específico
    const types = isLeaf ? this.config.leafTypes : this.config.flowerTypes;
    const typeClass = types[Math.floor(Math.random() * types.length)];
    element.classList.add(typeClass);
    
    // Animación
    const animation = this.config.animations[Math.floor(Math.random() * this.config.animations.length)];
    element.classList.add(animation);
    
    // Duración
    const duration = this.config.durations[Math.floor(Math.random() * this.config.durations.length)];
    element.classList.add(duration);
    
    // Retraso
    const delay = this.config.delays[Math.floor(Math.random() * this.config.delays.length)];
    element.classList.add(delay);
    
    // Efecto de viento
    if (this.config.enableWind) {
      const windClass = this.getRandomWindClass();
      element.classList.add(windClass);
    }
    
    // Posición inicial
    element.style.left = Math.random() * window.innerWidth + 'px';
    element.style.top = '-100px';
    
    // Tamaño aleatorio
    const scale = Math.random() * 0.5 + 0.7; // 0.7 a 1.2
    element.style.transform = `scale(${scale})`;
    
    // Opacidad aleatoria
    const opacity = Math.random() * 0.3 + 0.7; // 0.7 a 1.0
    element.style.opacity = opacity;
    
    return element;
  }

  getAnimationDuration(element) {
    const durationClass = Array.from(element.classList).find(cls => cls.startsWith('duration-'));
    if (durationClass) {
      const durationNumber = parseInt(durationClass.split('-')[1]);
      return durationNumber * 2; // Convertir a segundos aproximados
    }
    return 8; // Duración por defecto
  }

  applyFadeEffect(element) {
    // Guardar opacidad original
    element.dataset.originalOpacity = element.style.opacity || '1';
    
    // Crear función de fade que se ejecute periódicamente
    const fadeCheck = () => {
      if (!element.parentNode) return; // Elemento ya eliminado
      
      const rect = element.getBoundingClientRect();
      const screenHeight = window.innerHeight;
      const screenWidth = window.innerWidth;
      
      // Calcular distancia al borde más cercano
      const distanceToBottom = Math.max(0, rect.top - screenHeight);
      const distanceToTop = Math.max(0, -rect.bottom);
      const distanceToRight = Math.max(0, rect.left - screenWidth);
      const distanceToLeft = Math.max(0, -rect.right);
      
      const minDistance = Math.min(distanceToBottom, distanceToTop, distanceToRight, distanceToLeft);
      
      // Aplicar fade basado en la distancia al borde
      if (minDistance < 150) {
        const fadeOpacity = Math.max(0, minDistance / 150);
        element.style.opacity = fadeOpacity;
        element.classList.add('fade-gradual');
      } else {
        element.style.opacity = element.dataset.originalOpacity;
        element.classList.remove('fade-gradual');
      }
    };
    
    // Ejecutar verificación cada 100ms
    const fadeInterval = setInterval(fadeCheck, 100);
    
    // Guardar interval para limpiarlo después
    element.dataset.fadeInterval = fadeInterval;
  }

  removeElement(element, array) {
    // Limpiar interval de fade si existe
    if (element.dataset.fadeInterval) {
      clearInterval(element.dataset.fadeInterval);
    }
    
    if (element && element.parentNode) {
      element.parentNode.removeChild(element);
    }
    const index = array.indexOf(element);
    if (index > -1) {
      array.splice(index, 1);
    }
  }

  cleanupOffscreenElements() {
    // Limpiar solo elementos que están completamente fuera de la pantalla
    const allElements = [...this.leaves, ...this.flowers, ...this.particles];
    const screenHeight = window.innerHeight;
    const screenWidth = window.innerWidth;
    
    allElements.forEach(element => {
      if (element && element.style) {
        const rect = element.getBoundingClientRect();
        // Solo limpiar elementos que están completamente fuera de la pantalla
        if (rect.top > screenHeight + 100 || 
            rect.bottom < -100 || 
            rect.left > screenWidth + 100 || 
            rect.right < -100) {
          this.removeElement(element, this.leaves);
          this.removeElement(element, this.flowers);
          this.removeElement(element, this.particles);
        }
      }
    });
  }

  clearAll() {
    // Limpiar todos los elementos
    this.leaves.forEach(leaf => {
      if (leaf && leaf.parentNode) {
        leaf.parentNode.removeChild(leaf);
      }
    });
    this.flowers.forEach(flower => {
      if (flower && flower.parentNode) {
        flower.parentNode.removeChild(flower);
      }
    });
    this.particles.forEach(particle => {
      if (particle && particle.parentNode) {
        particle.parentNode.removeChild(particle);
      }
    });
    
    this.leaves = [];
    this.flowers = [];
    this.particles = [];
  }

  // Métodos de configuración
  setSpawnRate(rate) {
    this.config.spawnRate = rate;
    if (this.isActive) {
      this.startSpawnSystem();
    }
  }

  setMaxLeaves(max) {
    this.config.maxLeaves = max;
  }

  setMaxFlowers(max) {
    this.config.maxFlowers = max;
  }

  setWindEnabled(enabled) {
    this.config.enableWind = enabled;
    if (!enabled && this.windInterval) {
      clearInterval(this.windInterval);
    } else if (enabled && this.isActive) {
      this.startWindSystem();
    }
  }

  setParticlesEnabled(enabled) {
    this.config.enableParticles = enabled;
  }

  // Método para cambiar la intensidad del efecto
  setIntensity(level) {
    // level: 0 (desactivado), 1 (bajo), 2 (medio), 3 (alto)
    switch(level) {
      case 0:
        this.stop();
        break;
      case 1:
        this.config.maxLeaves = 5;
        this.config.maxFlowers = 3;
        this.config.spawnRate = 4000;
        break;
      case 2:
        this.config.maxLeaves = 10;
        this.config.maxFlowers = 6;
        this.config.spawnRate = 2500;
        break;
      case 3:
        this.config.maxLeaves = 15;
        this.config.maxFlowers = 10;
        this.config.spawnRate = 1500;
        break;
    }
    
    if (level > 0 && !this.isActive) {
      this.start();
    }
  }
}

  // Inicialización automática cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', function() {
  // Crear instancia global con configuración optimizada
  window.fallingLeavesSystem = new FallingLeavesSystem({
    maxLeaves: 25,
    maxFlowers: 18,
    spawnRate: 800,
    enableWind: true,
    enableParticles: true
  });

  // Iniciar automáticamente
  window.fallingLeavesSystem.start();
});

// Exportar para uso en módulos
if (typeof module !== 'undefined' && module.exports) {
  module.exports = FallingLeavesSystem;
}
