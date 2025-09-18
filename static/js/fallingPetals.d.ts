/**
 * Definiciones de tipos TypeScript para Falling Petals
 * @fileoverview Tipos para el sistema de animación de hojas y flores cayendo
 */

/**
 * Configuración de oscilación del viento
 */
export interface WindOscillation {
  /** Amplitud de oscilación en píxeles */
  amplitude: number;
  /** Frecuencia en Hz (ciclos por segundo) */
  frequency: number;
}

/**
 * Rango de valores numéricos
 */
export interface Range {
  /** Valor mínimo */
  min: number;
  /** Valor máximo */
  max: number;
}

/**
 * Opciones de configuración del sistema
 */
export interface Options {
  /** Partículas por 100k px² (por defecto: 0.6) */
  density?: number;
  /** Límite duro de partículas (por defecto: 160) */
  maxParticles?: number;
  /** Deriva base hacia la derecha en px/s (por defecto: 18) */
  driftX?: number;
  /** Caída vertical en px/s (por defecto: 60) */
  gravityY?: number;
  /** Configuración de oscilación del viento */
  windOscillation?: WindOscillation;
  /** Rango de rotación en rad/s (por defecto: { min: -0.8, max: 0.8 }) */
  spin?: Range;
  /** Rango de tamaño en px (por defecto: { min: 8, max: 22 }) */
  size?: Range;
  /** Área de spawn (por defecto: 'top') */
  spawnArea?: 'top' | 'top+edges';
  /** Tema de colores (por defecto: 'mixed') */
  theme?: 'autumn' | 'spring' | 'mixed';
  /** Opacidad general 0-1 (por defecto: 0.95) */
  opacity?: number;
  /** Z-index del canvas (por defecto: 0) */
  zIndex?: number;
  /** Interacción con mouse (por defecto: false) */
  interactive?: boolean;
}

/**
 * Partícula individual del sistema
 */
export interface Particle {
  /** Posición X */
  x: number;
  /** Posición Y */
  y: number;
  /** Velocidad X */
  vx: number;
  /** Velocidad Y */
  vy: number;
  /** Tamaño de la partícula */
  size: number;
  /** Rotación actual en radianes */
  rotation: number;
  /** Velocidad de rotación en rad/s */
  spin: number;
  /** Fase del viento para oscilación */
  windPhase: number;
  /** Tipo de partícula */
  type: 'leaf' | 'flower';
  /** Variante específica de la forma */
  variant: string;
  /** Color de la partícula */
  color: string;
  /** Opacidad individual */
  opacity: number;
}

/**
 * Configuración de tema visual
 */
export interface Theme {
  /** Colores disponibles para el tema */
  colors: string[];
  /** Formas disponibles para el tema */
  shapes: string[];
  /** Tipos de partículas del tema */
  types: ('leaf' | 'flower')[];
}

/**
 * API pública del sistema de hojas cayendo
 */
export interface FallingPetalsAPI {
  /** Inicia la animación */
  start(): void;
  /** Detiene la animación */
  stop(): void;
  /** Destruye el sistema y limpia recursos */
  destroy(): void;
  /** Actualiza opciones del sistema */
  setOptions(partialOpts: Partial<Options>): void;
}

/**
 * Clase principal del sistema de hojas cayendo
 */
export declare class FallingPetalsSystem {
  constructor(container: HTMLElement | Document, options?: Options);
  
  /** Opciones actuales del sistema */
  options: Options;
  /** Canvas del sistema */
  canvas: HTMLCanvasElement | null;
  /** Contexto 2D del canvas */
  ctx: CanvasRenderingContext2D | null;
  /** Array de partículas activas */
  particles: Particle[];
  /** ID de la animación actual */
  animationId: number | null;
  /** Estado de ejecución */
  isRunning: boolean;
  /** Posición X del mouse */
  mouseX: number;
  /** Posición Y del mouse */
  mouseY: number;
  /** Número objetivo de partículas */
  targetParticleCount: number;
  /** Configuración de temas */
  themes: Record<string, Theme>;
  
  /** Fusiona opciones con valores por defecto */
  mergeOptions(options: Options): Options;
  /** Inicializa los temas de colores y formas */
  initializeThemes(): Record<string, Theme>;
  /** Verifica soporte de canvas */
  checkCanvasSupport(): boolean;
  /** Inicializa el sistema */
  init(): void;
  /** Crea el canvas y lo añade al contenedor */
  createCanvas(): void;
  /** Redimensiona el canvas para High-DPI */
  resizeCanvas(): void;
  /** Calcula el número de partículas basado en densidad */
  calculateParticleCount(): void;
  /** Genera partículas iniciales */
  spawnInitialParticles(): void;
  /** Crea una nueva partícula */
  spawnParticle(): Particle;
  /** Genera un valor aleatorio en un rango */
  randomRange(range: Range): number;
  /** Actualiza una partícula */
  updateParticle(particle: Particle, deltaTime: number): void;
  /** Recicla una partícula */
  recycleParticle(particle: Particle): void;
  /** Dibuja una partícula */
  drawParticle(particle: Particle): void;
  /** Dibuja la forma de una partícula */
  drawShape(particle: Particle): void;
  /** Dibuja una hoja */
  drawLeaf(size: number, variant: string): void;
  /** Dibuja una flor */
  drawFlower(size: number, variant: string): void;
  /** Oscurece un color */
  darkenColor(color: string, factor: number): string;
  /** Bucle principal de animación */
  animate(currentTime: number): void;
  /** Vincula eventos del sistema */
  bindEvents(): void;
  /** Inicia la animación */
  start(): void;
  /** Detiene la animación */
  stop(): void;
  /** Pausa la animación */
  pause(): void;
  /** Reanuda la animación */
  resume(): void;
  /** Actualiza opciones del sistema */
  setOptions(newOptions: Partial<Options>): void;
  /** Destruye el sistema y limpia recursos */
  destroy(): void;
}

/**
 * Crea una instancia del sistema de hojas cayendo
 * @param container - Contenedor donde crear el canvas
 * @param options - Opciones de configuración
 * @returns API del sistema
 */
export declare function createFallingPetals(
  container: HTMLElement | Document, 
  options?: Options
): FallingPetalsAPI;

/**
 * Ejemplos de configuración predefinidos
 */
export declare namespace FallingPetalsExamples {
  /** Crea efecto de primavera */
  function createSpringEffect(): FallingPetalsAPI;
  /** Crea efecto de otoño */
  function createAutumnEffect(): FallingPetalsAPI;
  /** Crea efecto con alta densidad */
  function createDenseEffect(): FallingPetalsAPI;
  /** Crea efecto sutil */
  function createSubtleEffect(): FallingPetalsAPI;
  /** Crea efecto dinámico */
  function createDynamicEffect(): FallingPetalsAPI;
  /** Crea efecto con controles de usuario */
  function createControlledEffect(): FallingPetalsAPI;
}
