/**
 * EJEMPLO DE USO - Sistema de Hojas y Flores Cayendo
 * 
 * Este archivo muestra diferentes formas de usar el sistema de hojas cayendo
 * con configuraciones específicas para diferentes páginas o momentos.
 */

// Importar el módulo (si usas ES6 modules)
// import { createFallingPetals } from './fallingPetals.js';

/**
 * EJEMPLO 1: Configuración básica para primavera
 */
function createSpringEffect() {
  return createFallingPetals(document, {
    theme: 'spring',
    density: 0.8,
    driftX: 15,
    gravityY: 50,
    windOscillation: { amplitude: 20, frequency: 0.3 },
    size: { min: 6, max: 18 },
    spin: { min: -0.5, max: 0.5 },
    opacity: 0.9,
    interactive: true,
    zIndex: 1
  });
}

/**
 * EJEMPLO 2: Configuración para otoño
 */
function createAutumnEffect() {
  return createFallingPetals(document, {
    theme: 'autumn',
    density: 0.6,
    driftX: 25,
    gravityY: 70,
    windOscillation: { amplitude: 30, frequency: 0.2 },
    size: { min: 10, max: 25 },
    spin: { min: -1.0, max: 1.0 },
    opacity: 0.85,
    interactive: false,
    zIndex: 0
  });
}

/**
 * EJEMPLO 3: Efecto mixto con alta densidad
 */
function createDenseEffect() {
  return createFallingPetals(document, {
    theme: 'mixed',
    density: 1.2,
    maxParticles: 200,
    driftX: 20,
    gravityY: 60,
    windOscillation: { amplitude: 35, frequency: 0.25 },
    size: { min: 5, max: 20 },
    spin: { min: -0.8, max: 0.8 },
    opacity: 0.8,
    interactive: true,
    spawnArea: 'top+edges',
    zIndex: 0
  });
}

/**
 * EJEMPLO 4: Efecto sutil para páginas de contenido
 */
function createSubtleEffect() {
  return createFallingPetals(document, {
    theme: 'spring',
    density: 0.3,
    driftX: 10,
    gravityY: 40,
    windOscillation: { amplitude: 15, frequency: 0.4 },
    size: { min: 4, max: 12 },
    spin: { min: -0.3, max: 0.3 },
    opacity: 0.6,
    interactive: false,
    zIndex: -1
  });
}

/**
 * EJEMPLO 5: Control dinámico del efecto
 */
function createDynamicEffect() {
  const effect = createFallingPetals(document, {
    theme: 'mixed',
    density: 0.5,
    interactive: true
  });
  
  // Cambiar tema según la hora del día
  const hour = new Date().getHours();
  if (hour >= 6 && hour < 12) {
    effect.setOptions({ theme: 'spring' });
  } else if (hour >= 12 && hour < 18) {
    effect.setOptions({ theme: 'mixed' });
  } else {
    effect.setOptions({ theme: 'autumn' });
  }
  
  // Cambiar intensidad según el tamaño de pantalla
  const updateIntensity = () => {
    if (window.innerWidth < 768) {
      effect.setOptions({ density: 0.3, maxParticles: 80 });
    } else if (window.innerWidth < 1200) {
      effect.setOptions({ density: 0.5, maxParticles: 120 });
    } else {
      effect.setOptions({ density: 0.7, maxParticles: 160 });
    }
  };
  
  window.addEventListener('resize', updateIntensity);
  updateIntensity();
  
  return effect;
}

/**
 * EJEMPLO 6: Efecto con controles de usuario
 */
function createControlledEffect() {
  const effect = createFallingPetals(document, {
    theme: 'mixed',
    density: 0.6,
    interactive: true
  });
  
  // Crear controles de usuario (opcional)
  const controls = document.createElement('div');
  controls.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: rgba(255, 255, 255, 0.9);
    padding: 10px;
    border-radius: 8px;
    z-index: 1000;
    font-family: Arial, sans-serif;
    font-size: 12px;
  `;
  
  controls.innerHTML = `
    <div>
      <label>Tema: 
        <select id="theme-select">
          <option value="spring">Primavera</option>
          <option value="autumn">Otoño</option>
          <option value="mixed">Mixto</option>
        </select>
      </label>
    </div>
    <div>
      <label>Densidad: 
        <input type="range" id="density-slider" min="0" max="1.5" step="0.1" value="0.6">
        <span id="density-value">0.6</span>
      </label>
    </div>
    <div>
      <button id="toggle-effect">Detener</button>
    </div>
  `;
  
  document.body.appendChild(controls);
  
  // Event listeners para controles
  document.getElementById('theme-select').addEventListener('change', (e) => {
    effect.setOptions({ theme: e.target.value });
  });
  
  const densitySlider = document.getElementById('density-slider');
  const densityValue = document.getElementById('density-value');
  
  densitySlider.addEventListener('input', (e) => {
    const value = parseFloat(e.target.value);
    densityValue.textContent = value.toFixed(1);
    effect.setOptions({ density: value });
  });
  
  let isRunning = true;
  document.getElementById('toggle-effect').addEventListener('click', () => {
    if (isRunning) {
      effect.stop();
      document.getElementById('toggle-effect').textContent = 'Iniciar';
    } else {
      effect.start();
      document.getElementById('toggle-effect').textContent = 'Detener';
    }
    isRunning = !isRunning;
  });
  
  return effect;
}

// Auto-inicialización con configuración por defecto
document.addEventListener('DOMContentLoaded', () => {
  // Solo crear si no existe ya una instancia
  if (!window.fallingPetalsInstance) {
    // Detectar si estamos en una página específica para usar configuración diferente
    const path = window.location.pathname;
    
    let effect;
    if (path.includes('calendario')) {
      // Página del calendario - efecto mixto
      effect = createDenseEffect();
    } else if (path.includes('login')) {
      // Página de login - efecto sutil
      effect = createSubtleEffect();
    } else {
      // Páginas generales - efecto dinámico
      effect = createDynamicEffect();
    }
    
    window.fallingPetalsInstance = effect;
    effect.start();
  }
});

// Exportar funciones para uso externo
if (typeof window !== 'undefined') {
  window.FallingPetalsExamples = {
    createSpringEffect,
    createAutumnEffect,
    createDenseEffect,
    createSubtleEffect,
    createDynamicEffect,
    createControlledEffect
  };
}
