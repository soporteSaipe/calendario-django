/**
 * CALENDARIO CONTROLLER
 * Controlador centralizado para evitar conflictos entre múltiples DOMContentLoaded
 */

(function() {
    'use strict';
    
    // CalendarioApp.Core.Logger.debug('🎛️ Calendario Controller iniciando...');
    
    // Estado del controlador
    const controller = {
        isInitialized: false,
        initQueue: [],
        errorCount: 0,
        maxErrors: 10
    };
    
    // Función para registrar inicializaciones
    function registerInit(name, initFunction, priority = 0) {
        controller.initQueue.push({
            name: name,
            func: initFunction,
            priority: priority,
            executed: false
        });
        
        // Ordenar por prioridad (mayor prioridad primero)
        controller.initQueue.sort((a, b) => b.priority - a.priority);
        
        // CalendarioApp.Core.Logger.debug(`📝 Registrada inicialización: ${name} (prioridad: ${priority})`);
    }
    
    // Función para ejecutar inicializaciones
    function executeInitializations() {
        if (controller.isInitialized) {
            // CalendarioApp.Core.Logger.debug('⚠️ Controller ya inicializado, saltando...');
            return;
        }
        
        // CalendarioApp.Core.Logger.debug('🚀 Ejecutando inicializaciones...');
        
        for (const item of controller.initQueue) {
            if (item.executed) continue;
            
            try {
                // CalendarioApp.Core.Logger.debug(`▶️ Ejecutando: ${item.name}`);
                item.func();
                item.executed = true;
                // CalendarioApp.Core.Logger.debug(`✅ Completado: ${item.name}`);
            } catch (error) {
                controller.errorCount++;
                console.error(`❌ Error en ${item.name}:`, error);
                
                if (controller.errorCount >= controller.maxErrors) {
                    console.error('🚨 Máximo de errores alcanzado, deteniendo inicializaciones');
                    break;
                }
            }
        }
        
        controller.isInitialized = true;
        // CalendarioApp.Core.Logger.debug('🎉 Todas las inicializaciones completadas');
    }
    
    // Función para verificar estado
    function getStatus() {
        return {
            isInitialized: controller.isInitialized,
            queueLength: controller.initQueue.length,
            executedCount: controller.initQueue.filter(item => item.executed).length,
            errorCount: controller.errorCount
        };
    }
    
    // Hacer funciones disponibles globalmente
    window.CalendarioController = {
        register: registerInit,
        execute: executeInitializations,
        getStatus: getStatus,
        isReady: () => controller.isInitialized
    };
    
    // Ejecutar cuando el DOM esté listo
    document.addEventListener('DOMContentLoaded', function() {
        // CalendarioApp.Core.Logger.debug('🎛️ DOMContentLoaded detectado por Controller');
        
        // Esperar un poco para que todos los scripts se carguen
        setTimeout(() => {
            executeInitializations();
        }, 500);
    });
    
    // CalendarioApp.Core.Logger.debug('🎛️ Calendario Controller configurado');
    
})();
