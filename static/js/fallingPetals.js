/**
 * FALLING PETALS - Sistema de animación de hojas y flores cayendo
 * Canvas-based particle system con efectos de viento y reciclado
 * 
 * @author Sistema de Reservas SAIPE
 * @version 1.0.0
 */

/**
 * @typedef {Object} WindOscillation
 * @property {number} amplitude - Amplitud de oscilación en píxeles
 * @property {number} frequency - Frecuencia en Hz (ciclos por segundo)
 */

/**
 * @typedef {Object} Range
 * @property {number} min - Valor mínimo
 * @property {number} max - Valor máximo
 */

/**
 * @typedef {Object} Options
 * @property {number} [density=0.6] - Partículas por 100k px²
 * @property {number} [maxParticles=160] - Límite duro de partículas
 * @property {number} [driftX=18] - Deriva base hacia la derecha (px/s)
 * @property {number} [gravityY=60] - Caída vertical (px/s)
 * @property {WindOscillation} [windOscillation] - Configuración de oscilación del viento
 * @property {Range} [spin] - Rango de rotación (rad/s)
 * @property {Range} [size] - Rango de tamaño (px)
 * @property {'top'|'top+edges'} [spawnArea='top'] - Área de spawn
 * @property {'autumn'|'spring'|'mixed'} [theme='mixed'] - Tema de colores
 * @property {number} [opacity=0.95] - Opacidad general (0-1)
 * @property {number} [zIndex=0] - Z-index del canvas
 * @property {boolean} [interactive=false] - Interacción con mouse
 */

/**
 * @typedef {Object} Particle
 * @property {number} x - Posición X
 * @property {number} y - Posición Y
 * @property {number} vx - Velocidad X
 * @property {number} vy - Velocidad Y
 * @property {number} size - Tamaño
 * @property {number} rotation - Rotación actual
 * @property {number} spin - Velocidad de rotación
 * @property {number} windPhase - Fase del viento
 * @property {string} type - Tipo de partícula ('leaf' o 'flower')
 * @property {string} variant - Variante específica
 * @property {string} color - Color de la partícula
 * @property {number} opacity - Opacidad individual
 */

class FallingPetalsSystem {
  constructor(container, options = {}) {
    this.container = container;
    this.options = this.mergeOptions(options);
    this.canvas = null;
    this.ctx = null;
    this.particles = [];
    this.animationId = null;
    this.isRunning = false;
    this.lastTime = 0;
    this.mouseX = 0;
    this.mouseY = 0;
    this.resizeDebounce = null;
    
    // Configuración de temas
    this.themes = this.initializeThemes();
    
    // Verificar soporte de canvas
    if (!this.checkCanvasSupport()) {
      console.warn('Canvas no soportado, deshabilitando animación de hojas');
      return;
    }
    
    this.init();
  }

  /**
   * Fusiona opciones con valores por defecto
   * @param {Options} options - Opciones del usuario
   * @returns {Options} - Opciones fusionadas
   */
  mergeOptions(options) {
    return {
      density: 0.6,
      maxParticles: 160,
      driftX: 18,
      gravityY: 60,
      windOscillation: {
        amplitude: 24,
        frequency: 0.25
      },
      spin: { min: -0.8, max: 0.8 },
      size: { min: 12, max: 35 },
      spawnArea: 'top',
      theme: 'mixed',
      opacity: 0.95,
      zIndex: 0,
      interactive: false,
      ...options
    };
  }

  /**
   * Inicializa los temas de colores y formas
   * @returns {Object} - Configuración de temas
   */
  initializeThemes() {
    return {
      autumn: {
        colors: ['#D2691E', '#CD853F', '#A0522D', '#8B4513', '#DAA520', '#B8860B'],
        shapes: ['maple', 'oak', 'elm', 'birch'],
        types: ['leaf']
      },
      spring: {
        colors: ['#FFB6C1', '#FF69B4', '#FFC0CB', '#FFE4E1', '#FFD700', '#FFA500', '#90EE90', '#98FB98', '#F0E68C', '#FFE4B5'],
        shapes: ['daisy', 'daisy', 'daisy', 'cherry', 'apple', 'rose', 'tulip', 'leaf_spring'],
        types: ['flower', 'flower', 'flower', 'flower', 'flower', 'flower', 'flower', 'leaf']
      },
      mixed: {
        colors: ['#D2691E', '#CD853F', '#A0522D', '#FFB6C1', '#FF69B4', '#FFC0CB', '#FFD700', '#DAA520'],
        shapes: ['maple', 'oak', 'cherry', 'rose', 'elm', 'apple'],
        types: ['leaf', 'flower']
      }
    };
  }

  /**
   * Verifica soporte de canvas
   * @returns {boolean} - True si canvas es soportado
   */
  checkCanvasSupport() {
    const canvas = document.createElement('canvas');
    return !!(canvas.getContext && canvas.getContext('2d'));
  }

  /**
   * Inicializa el sistema
   */
  init() {
    this.createCanvas();
    this.bindEvents();
    this.calculateParticleCount();
    this.spawnInitialParticles();
  }

  /**
   * Crea el canvas y lo añade al contenedor
   */
  createCanvas() {
    // Verificar si ya existe un canvas
    const existingCanvas = document.getElementById('falling-petals-canvas');
    if (existingCanvas) {
      this.canvas = existingCanvas;
      this.ctx = this.canvas.getContext('2d');
      this.resizeCanvas();
      return;
    }
    
    this.canvas = document.createElement('canvas');
    this.canvas.id = 'falling-petals-canvas';
    this.canvas.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      pointer-events: none;
      z-index: ${this.options.zIndex + 9999};
    `;
    
    // Si el contenedor es document, usar body
    const targetContainer = this.container === document ? document.body : this.container;
    targetContainer.appendChild(this.canvas);
    this.ctx = this.canvas.getContext('2d');
    this.resizeCanvas();
  }

  /**
   * Redimensiona el canvas para High-DPI
   */
  resizeCanvas() {
    const dpr = window.devicePixelRatio || 1;
    const width = window.innerWidth;
    const height = window.innerHeight;
    
    // Establecer el tamaño real del canvas (para dibujo)
    this.canvas.width = width * dpr;
    this.canvas.height = height * dpr;
    
    // Establecer el tamaño de visualización del canvas
    this.canvas.style.width = width + 'px';
    this.canvas.style.height = height + 'px';
    
    // Escalar el contexto para High-DPI
    this.ctx.scale(dpr, dpr);
  }

  /**
   * Calcula el número de partículas basado en densidad
   */
  calculateParticleCount() {
    const area = window.innerWidth * window.innerHeight;
    const targetCount = Math.floor((area / 100000) * this.options.density);
    this.targetParticleCount = Math.min(targetCount, this.options.maxParticles);
  }

  /**
   * Genera partículas iniciales
   */
  spawnInitialParticles() {
    for (let i = 0; i < this.targetParticleCount; i++) {
      this.spawnParticle();
    }
  }

  /**
   * Crea una nueva partícula
   * @returns {Particle} - Nueva partícula
   */
  spawnParticle() {
    const theme = this.themes[this.options.theme];
    const type = theme.types[Math.floor(Math.random() * theme.types.length)];
    const variant = theme.shapes[Math.floor(Math.random() * theme.shapes.length)];
    const color = theme.colors[Math.floor(Math.random() * theme.colors.length)];
    
    let x, y;
    
    if (this.options.spawnArea === 'top+edges') {
      // Spawn desde arriba y los lados
      const side = Math.random();
      if (side < 0.7) {
        x = Math.random() * window.innerWidth;
        y = -100; // Más arriba
      } else if (side < 0.85) {
        x = -50;
        y = Math.random() * window.innerHeight * 0.3; // Solo parte superior
      } else {
        x = window.innerWidth + 50;
        y = Math.random() * window.innerHeight * 0.3; // Solo parte superior
      }
    } else {
      x = Math.random() * window.innerWidth;
      y = -100; // Más arriba para que se vean caer desde arriba
    }
    
    const size = this.randomRange(this.options.size);
    const spin = this.randomRange(this.options.spin);
    
    return {
      x,
      y,
      vx: this.options.driftX + (Math.random() - 0.5) * 10,
      vy: this.options.gravityY + Math.random() * 20,
      size,
      rotation: Math.random() * Math.PI * 2,
      spin,
      windPhase: Math.random() * Math.PI * 2,
      type,
      variant,
      color,
      opacity: this.options.opacity * (0.7 + Math.random() * 0.3),
      // Nuevas propiedades para movimiento dinámico
      baseVx: this.options.driftX + (Math.random() - 0.5) * 10,
      baseVy: this.options.gravityY + Math.random() * 20,
      trajectoryPhase: Math.random() * Math.PI * 2,
      trajectoryAmplitude: 15 + Math.random() * 25, // Amplitud de la trayectoria
      trajectoryFrequency: 0.5 + Math.random() * 1.5, // Frecuencia de cambio
      swayPhase: Math.random() * Math.PI * 2,
      swayAmplitude: 5 + Math.random() * 15 // Movimiento de balanceo
    };
  }

  /**
   * Genera un valor aleatorio en un rango
   * @param {Range} range - Rango de valores
   * @returns {number} - Valor aleatorio
   */
  randomRange(range) {
    return range.min + Math.random() * (range.max - range.min);
  }

  /**
   * Actualiza una partícula
   * @param {Particle} particle - Partícula a actualizar
   * @param {number} deltaTime - Tiempo transcurrido en segundos
   */
  updateParticle(particle, deltaTime) {
    // Aplicar gravedad
    particle.vy += this.options.gravityY * deltaTime * 0.1;
    
    // Aplicar viento (oscilación horizontal)
    const windOffset = Math.sin(particle.windPhase) * this.options.windOscillation.amplitude;
    particle.windPhase += this.options.windOscillation.frequency * deltaTime;
    
    // Movimiento dinámico de trayectoria
    const time = Date.now() * 0.001;
    
    // Cambio de velocidad horizontal basado en trayectoria
    const trajectoryOffset = Math.sin(particle.trajectoryPhase + time * particle.trajectoryFrequency) * particle.trajectoryAmplitude;
    particle.trajectoryPhase += particle.trajectoryFrequency * deltaTime;
    
    // Movimiento de balanceo (sway)
    const swayOffset = Math.sin(particle.swayPhase + time * 2) * particle.swayAmplitude;
    particle.swayPhase += 2 * deltaTime;
    
    // Aplicar velocidades dinámicas
    particle.vx = particle.baseVx + trajectoryOffset * 0.5;
    particle.vy = particle.baseVy + swayOffset * 0.3;
    
    // Interacción con mouse si está habilitada
    if (this.options.interactive) {
      const dx = this.mouseX - particle.x;
      const dy = this.mouseY - particle.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      const influence = Math.max(0, 100 - distance) / 100;
      
      if (influence > 0) {
        particle.vx += (dx / distance) * influence * 2;
        particle.vy += (dy / distance) * influence * 2;
      }
    }
    
    // Actualizar posición
    particle.x += particle.vx * deltaTime;
    particle.y += particle.vy * deltaTime + windOffset * deltaTime;
    
    // Actualizar rotación con variación
    particle.rotation += particle.spin * deltaTime + (Math.sin(time * 3) * 0.1 * deltaTime);
    
    // Reciclar si sale de la pantalla
    if (particle.y > window.innerHeight + 100 || 
        particle.x < -100 || 
        particle.x > window.innerWidth + 100) {
      this.recycleParticle(particle);
    }
  }

  /**
   * Recicla una partícula (la mueve arriba con nuevos parámetros)
   * @param {Particle} particle - Partícula a reciclar
   */
  recycleParticle(particle) {
    const newParticle = this.spawnParticle();
    Object.assign(particle, newParticle);
  }

  /**
   * Dibuja una partícula
   * @param {Particle} particle - Partícula a dibujar
   */
  drawParticle(particle) {
    this.ctx.save();
    this.ctx.translate(particle.x, particle.y);
    this.ctx.rotate(particle.rotation);
    this.ctx.globalAlpha = particle.opacity;
    
    // Dibujar forma según el tipo y variante
    this.drawShape(particle);
    
    this.ctx.restore();
  }

  /**
   * Dibuja la forma de una partícula
   * @param {Particle} particle - Partícula a dibujar
   */
  drawShape(particle) {
    const { size, color, type, variant } = particle;
    const halfSize = size / 2;
    
    if (type === 'leaf') {
      // Para hojas, usar gradiente para mayor realismo
      this.drawLeafWithGradient(particle, halfSize);
    } else {
      // Para flores, usar colores sólidos
      this.ctx.fillStyle = color;
      this.ctx.strokeStyle = this.darkenColor(color, 0.2);
      this.ctx.lineWidth = 1;
      
      this.ctx.beginPath();
      this.drawFlower(halfSize, variant);
      this.ctx.fill();
      this.ctx.stroke();
    }
  }

  /**
   * Dibuja una hoja con gradiente para mayor realismo
   * @param {Particle} particle - Partícula de hoja
   * @param {number} size - Tamaño de la hoja
   */
  drawLeafWithGradient(particle, size) {
    const { color, variant } = particle;
    const { ctx } = this;
    
    // Crear gradiente radial para la hoja
    const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, size);
    
    // Colores base según el tipo de hoja
    let lightColor, darkColor;
    
    if (variant === 'leaf_spring') {
      // Hojas de primavera: verdes y rosas
      lightColor = color.includes('#90EE90') ? '#B0F0B0' : '#FFE4E1';
      darkColor = this.darkenColor(color, 0.4);
    } else {
      // Hojas de otoño: colores cálidos
      lightColor = this.lightenColor(color, 0.3);
      darkColor = this.darkenColor(color, 0.4);
    }
    
    gradient.addColorStop(0, lightColor);
    gradient.addColorStop(0.7, color);
    gradient.addColorStop(1, darkColor);
    
    // Dibujar la forma de la hoja
    ctx.fillStyle = gradient;
    ctx.strokeStyle = this.darkenColor(color, 0.5);
    ctx.lineWidth = Math.max(1, size * 0.08);
    
    ctx.beginPath();
    this.drawLeaf(size, variant, color);
    ctx.fill();
    ctx.stroke();
  }

  /**
   * Aclara un color
   * @param {string} color - Color en formato hex
   * @param {number} factor - Factor de aclaramiento (0-1)
   * @returns {string} - Color aclarado
   */
  lightenColor(color, factor) {
    const hex = color.replace('#', '');
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);
    
    return `rgb(${Math.floor(r + (255 - r) * factor)}, ${Math.floor(g + (255 - g) * factor)}, ${Math.floor(b + (255 - b) * factor)})`;
  }

  /**
   * Dibuja una hoja
   * @param {number} size - Tamaño de la hoja
   * @param {string} variant - Variante de hoja
   * @param {string} color - Color base de la hoja
   */
  drawLeaf(size, variant, color) {
    const { ctx } = this;
    
    switch (variant) {
      case 'maple':
        // Hoja de arce realista con lóbulos profundos
        ctx.beginPath();
        ctx.moveTo(0, -size);
        // Lóbulo superior izquierdo
        ctx.quadraticCurveTo(-size * 0.2, -size * 0.7, -size * 0.4, -size * 0.4);
        ctx.quadraticCurveTo(-size * 0.6, -size * 0.2, -size * 0.8, 0);
        // Lóbulo inferior izquierdo
        ctx.quadraticCurveTo(-size * 0.6, size * 0.2, -size * 0.4, size * 0.4);
        ctx.quadraticCurveTo(-size * 0.2, size * 0.7, 0, size * 0.8);
        // Lóbulo inferior derecho
        ctx.quadraticCurveTo(size * 0.2, size * 0.7, size * 0.4, size * 0.4);
        ctx.quadraticCurveTo(size * 0.6, size * 0.2, size * 0.8, 0);
        // Lóbulo superior derecho
        ctx.quadraticCurveTo(size * 0.6, -size * 0.2, size * 0.4, -size * 0.4);
        ctx.quadraticCurveTo(size * 0.2, -size * 0.7, 0, -size);
        ctx.closePath();
        
        // Venas de la hoja
        this.drawLeafVeins(ctx, size, 0.3, color);
        break;
        
      case 'oak':
        // Hoja de roble con lóbulos redondeados
        ctx.beginPath();
        ctx.moveTo(0, -size * 0.9);
        // Lóbulos superiores
        ctx.quadraticCurveTo(-size * 0.3, -size * 0.6, -size * 0.5, -size * 0.3);
        ctx.quadraticCurveTo(-size * 0.7, -size * 0.1, -size * 0.8, size * 0.1);
        // Lóbulos laterales
        ctx.quadraticCurveTo(-size * 0.7, size * 0.3, -size * 0.5, size * 0.5);
        ctx.quadraticCurveTo(-size * 0.3, size * 0.7, 0, size * 0.8);
        // Lado derecho
        ctx.quadraticCurveTo(size * 0.3, size * 0.7, size * 0.5, size * 0.5);
        ctx.quadraticCurveTo(size * 0.7, size * 0.3, size * 0.8, size * 0.1);
        ctx.quadraticCurveTo(size * 0.7, -size * 0.1, size * 0.5, -size * 0.3);
        ctx.quadraticCurveTo(size * 0.3, -size * 0.6, 0, -size * 0.9);
        ctx.closePath();
        
        // Venas de la hoja
        this.drawLeafVeins(ctx, size, 0.4, color);
        break;
        
      case 'elm':
        // Hoja de olmo asimétrica realista
        ctx.beginPath();
        ctx.moveTo(0, -size * 0.9);
        // Lado izquierdo con dientes
        ctx.quadraticCurveTo(-size * 0.2, -size * 0.6, -size * 0.4, -size * 0.3);
        ctx.quadraticCurveTo(-size * 0.5, -size * 0.1, -size * 0.6, size * 0.1);
        ctx.quadraticCurveTo(-size * 0.5, size * 0.3, -size * 0.4, size * 0.5);
        ctx.quadraticCurveTo(-size * 0.2, size * 0.7, 0, size * 0.8);
        // Lado derecho
        ctx.quadraticCurveTo(size * 0.2, size * 0.7, size * 0.4, size * 0.5);
        ctx.quadraticCurveTo(size * 0.5, size * 0.3, size * 0.6, size * 0.1);
        ctx.quadraticCurveTo(size * 0.5, -size * 0.1, size * 0.4, -size * 0.3);
        ctx.quadraticCurveTo(size * 0.2, -size * 0.6, 0, -size * 0.9);
        ctx.closePath();
        
        // Venas de la hoja
        this.drawLeafVeins(ctx, size, 0.35, color);
        break;
        
      case 'birch':
        // Hoja de abedul con forma de lágrima y dientes
        ctx.beginPath();
        ctx.moveTo(0, -size * 0.8);
        // Lado izquierdo con dientes pequeños
        ctx.quadraticCurveTo(-size * 0.15, -size * 0.5, -size * 0.3, -size * 0.2);
        ctx.quadraticCurveTo(-size * 0.4, 0, -size * 0.35, size * 0.2);
        ctx.quadraticCurveTo(-size * 0.3, size * 0.4, -size * 0.2, size * 0.6);
        ctx.quadraticCurveTo(-size * 0.1, size * 0.7, 0, size * 0.8);
        // Lado derecho
        ctx.quadraticCurveTo(size * 0.1, size * 0.7, size * 0.2, size * 0.6);
        ctx.quadraticCurveTo(size * 0.3, size * 0.4, size * 0.35, size * 0.2);
        ctx.quadraticCurveTo(size * 0.4, 0, size * 0.3, -size * 0.2);
        ctx.quadraticCurveTo(size * 0.15, -size * 0.5, 0, -size * 0.8);
        ctx.closePath();
        
        // Venas de la hoja
        this.drawLeafVeins(ctx, size, 0.25, color);
        break;
        
      case 'leaf_spring':
        // Hoja de primavera con forma de corazón realista
        ctx.beginPath();
        ctx.moveTo(0, -size * 0.8);
        // Lado izquierdo del corazón
        ctx.quadraticCurveTo(-size * 0.25, -size * 0.5, -size * 0.4, -size * 0.2);
        ctx.quadraticCurveTo(-size * 0.5, 0, -size * 0.45, size * 0.2);
        ctx.quadraticCurveTo(-size * 0.4, size * 0.4, -size * 0.25, size * 0.6);
        ctx.quadraticCurveTo(-size * 0.1, size * 0.7, 0, size * 0.8);
        // Lado derecho del corazón
        ctx.quadraticCurveTo(size * 0.1, size * 0.7, size * 0.25, size * 0.6);
        ctx.quadraticCurveTo(size * 0.4, size * 0.4, size * 0.45, size * 0.2);
        ctx.quadraticCurveTo(size * 0.5, 0, size * 0.4, -size * 0.2);
        ctx.quadraticCurveTo(size * 0.25, -size * 0.5, 0, -size * 0.8);
        ctx.closePath();
        
        // Venas de la hoja
        this.drawLeafVeins(ctx, size, 0.3, color);
        break;
        
      default:
        // Hoja genérica con forma de lágrima
        ctx.beginPath();
        ctx.moveTo(0, -size * 0.8);
        ctx.quadraticCurveTo(-size * 0.3, -size * 0.4, -size * 0.5, 0);
        ctx.quadraticCurveTo(-size * 0.4, size * 0.4, 0, size * 0.8);
        ctx.quadraticCurveTo(size * 0.4, size * 0.4, size * 0.5, 0);
        ctx.quadraticCurveTo(size * 0.3, -size * 0.4, 0, -size * 0.8);
        ctx.closePath();
        
        // Venas de la hoja
        this.drawLeafVeins(ctx, size, 0.3, color);
    }
  }

  /**
   * Dibuja las venas de una hoja
   * @param {CanvasRenderingContext2D} ctx - Contexto del canvas
   * @param {number} size - Tamaño de la hoja
   * @param {number} intensity - Intensidad de las venas (0-1)
   * @param {string} baseColor - Color base de la hoja para las venas
   */
  drawLeafVeins(ctx, size, intensity, baseColor) {
    const originalFillStyle = ctx.fillStyle;
    const originalStrokeStyle = ctx.strokeStyle;
    const originalLineWidth = ctx.lineWidth;
    
    // Color de las venas (más oscuro que el fondo)
    ctx.strokeStyle = this.darkenColor(baseColor, 0.3);
    ctx.lineWidth = Math.max(1, size * 0.05);
    
    // Vena central
    ctx.beginPath();
    ctx.moveTo(0, -size * 0.8);
    ctx.quadraticCurveTo(0, 0, 0, size * 0.8);
    ctx.stroke();
    
    // Venas laterales
    for (let i = 1; i <= 3; i++) {
      const offset = (size * 0.2 * i) * intensity;
      
      // Vena izquierda
      ctx.beginPath();
      ctx.moveTo(0, -size * 0.6);
      ctx.quadraticCurveTo(-offset, -size * 0.3, -offset * 1.5, 0);
      ctx.quadraticCurveTo(-offset, size * 0.3, 0, size * 0.6);
      ctx.stroke();
      
      // Vena derecha
      ctx.beginPath();
      ctx.moveTo(0, -size * 0.6);
      ctx.quadraticCurveTo(offset, -size * 0.3, offset * 1.5, 0);
      ctx.quadraticCurveTo(offset, size * 0.3, 0, size * 0.6);
      ctx.stroke();
    }
    
    // Restaurar estilos originales
    ctx.fillStyle = originalFillStyle;
    ctx.strokeStyle = originalStrokeStyle;
    ctx.lineWidth = originalLineWidth;
  }

  /**
   * Dibuja una flor
   * @param {number} size - Tamaño de la flor
   * @param {string} variant - Variante de flor
   */
  drawFlower(size, variant) {
    const { ctx } = this;
    
    switch (variant) {
      case 'daisy':
        // Margarita (pétalos blancos con centro amarillo)
        // Centro amarillo
        ctx.fillStyle = '#FFD700';
        ctx.beginPath();
        ctx.arc(0, 0, size * 0.15, 0, Math.PI * 2);
        ctx.fill();
        
        // Pétalos blancos
        ctx.fillStyle = this.darkenColor('#FFFFFF', 0.1);
        for (let i = 0; i < 12; i++) {
          const angle = (i * Math.PI * 2) / 12;
          ctx.save();
          ctx.translate(Math.cos(angle) * size * 0.3, Math.sin(angle) * size * 0.3);
          ctx.rotate(angle);
          ctx.beginPath();
          ctx.ellipse(0, 0, size * 0.25, size * 0.08, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        }
        break;
        
      case 'cherry':
        // Flor de cerezo (5 pétalos)
        for (let i = 0; i < 5; i++) {
          const angle = (i * Math.PI * 2) / 5;
          ctx.ellipse(
            Math.cos(angle) * size * 0.3,
            Math.sin(angle) * size * 0.3,
            size * 0.4,
            size * 0.2,
            angle,
            0,
            Math.PI * 2
          );
        }
        break;
        
      case 'apple':
        // Flor de manzana (5 pétalos redondos)
        for (let i = 0; i < 5; i++) {
          const angle = (i * Math.PI * 2) / 5;
          ctx.ellipse(
            Math.cos(angle) * size * 0.4,
            Math.sin(angle) * size * 0.4,
            size * 0.3,
            size * 0.3,
            angle,
            0,
            Math.PI * 2
          );
        }
        break;
        
      case 'rose':
        // Rosa (múltiples pétalos)
        for (let i = 0; i < 8; i++) {
          const angle = (i * Math.PI * 2) / 8;
          ctx.ellipse(
            Math.cos(angle) * size * 0.2,
            Math.sin(angle) * size * 0.2,
            size * 0.3,
            size * 0.15,
            angle,
            0,
            Math.PI * 2
          );
        }
        break;
        
      case 'tulip':
        // Tulipán (forma de copa)
        ctx.ellipse(0, 0, size * 0.6, size * 0.8, 0, 0, Math.PI * 2);
        break;
        
      default:
        ctx.ellipse(0, 0, size, size * 0.6, 0, 0, Math.PI * 2);
    }
  }

  /**
   * Oscurece un color
   * @param {string} color - Color en formato hex
   * @param {number} factor - Factor de oscurecimiento (0-1)
   * @returns {string} - Color oscurecido
   */
  darkenColor(color, factor) {
    const hex = color.replace('#', '');
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);
    
    return `rgb(${Math.floor(r * (1 - factor))}, ${Math.floor(g * (1 - factor))}, ${Math.floor(b * (1 - factor))})`;
  }

  /**
   * Bucle principal de animación
   * @param {number} currentTime - Tiempo actual
   */
  animate(currentTime) {
    if (!this.isRunning) return;
    
    const deltaTime = (currentTime - this.lastTime) / 1000;
    this.lastTime = currentTime;
    
    // Limpiar canvas
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    
    // Actualizar y dibujar partículas
    for (const particle of this.particles) {
      this.updateParticle(particle, deltaTime);
      this.drawParticle(particle);
    }
    
    // Ajustar número de partículas si es necesario
    if (this.particles.length < this.targetParticleCount) {
      this.particles.push(this.spawnParticle());
    } else if (this.particles.length > this.targetParticleCount) {
      this.particles.pop();
    }
    
    this.animationId = requestAnimationFrame((time) => this.animate(time));
  }

  /**
   * Vincula eventos del sistema
   */
  bindEvents() {
    // Resize con debounce
    window.addEventListener('resize', () => {
      if (this.resizeDebounce) {
        clearTimeout(this.resizeDebounce);
      }
      this.resizeDebounce = setTimeout(() => {
        this.resizeCanvas();
        this.calculateParticleCount();
      }, 250);
    });
    
    // Pausar en background
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this.pause();
      } else {
        this.resume();
      }
    });
    
    // Interacción con mouse
    if (this.options.interactive) {
      document.addEventListener('mousemove', (e) => {
        this.mouseX = e.clientX;
        this.mouseY = e.clientY;
      });
    }
  }

  /**
   * Inicia la animación
   */
  start() {
    if (this.isRunning) return;
    
    // Verificar preferencias de movimiento reducido
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return;
    }
    
    this.isRunning = true;
    this.lastTime = performance.now();
    this.animate(this.lastTime);
  }

  /**
   * Detiene la animación
   */
  stop() {
    this.isRunning = false;
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
  }

  /**
   * Pausa la animación
   */
  pause() {
    this.stop();
  }

  /**
   * Reanuda la animación
   */
  resume() {
    this.start();
  }

  /**
   * Actualiza opciones del sistema
   * @param {Partial<Options>} newOptions - Nuevas opciones
   */
  setOptions(newOptions) {
    this.options = { ...this.options, ...newOptions };
    this.calculateParticleCount();
  }

  /**
   * Destruye el sistema y limpia recursos
   */
  destroy() {
    this.stop();
    
    if (this.canvas && this.canvas.parentNode) {
      this.canvas.parentNode.removeChild(this.canvas);
    }
    
    if (this.resizeDebounce) {
      clearTimeout(this.resizeDebounce);
    }
    
    this.particles = [];
    this.canvas = null;
    this.ctx = null;
  }
}

/**
 * Crea una instancia del sistema de hojas cayendo
 * @param {HTMLElement|Document} container - Contenedor donde crear el canvas
 * @param {Options} options - Opciones de configuración
 * @returns {Object} - API del sistema
 */
export function createFallingPetals(container, options = {}) {
  const system = new FallingPetalsSystem(container, options);
  
  return {
    start: () => system.start(),
    stop: () => system.stop(),
    destroy: () => system.destroy(),
    setOptions: (opts) => system.setOptions(opts)
  };
}

// Auto-inicialización si se usa como script (solo si no hay integración)
if (typeof window !== 'undefined' && !window.FallingPetalsInitialized && !window.saipeFallingPetals) {
  window.FallingPetalsInitialized = true;
  
  // Crear instancia por defecto si no hay una existente
  document.addEventListener('DOMContentLoaded', () => {
    // Verificar si ya existe una instancia o canvas
    if (!window.fallingPetalsInstance && !document.getElementById('falling-petals-canvas')) {
      window.fallingPetalsInstance = createFallingPetals(document, {
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
      });
      
      window.fallingPetalsInstance.start();
    }
  });
}
