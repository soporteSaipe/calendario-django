/**
 * SCRIPT DE PRUEBA SIMPLE
 * Prueba básica sin causar bucles infinitos
 */

(function() {
    'use strict';
    
    console.log('🧪 Script de prueba simple iniciando...');
    
    // Función para probar sistemas básicos
    function testBasicSystems() {
        console.log('\n🔍 === PRUEBA BÁSICA DE SISTEMAS ===');
        
        const tests = [
            {
                name: 'CalendarioApp',
                test: () => !!window.CalendarioApp
            },
            {
                name: 'CalendarioApp.Core',
                test: () => !!(window.CalendarioApp && window.CalendarioApp.Core)
            },
            {
                name: 'CalendarioApp.StateManager',
                test: () => !!(window.CalendarioApp && window.CalendarioApp.StateManager)
            },
            {
                name: 'CalendarioApp.ModalFactory',
                test: () => !!(window.CalendarioApp && window.CalendarioApp.ModalFactory)
            },
            {
                name: 'CalendarioApp.ErrorHandler',
                test: () => !!(window.CalendarioApp && window.CalendarioApp.ErrorHandler)
            },
            {
                name: 'CalendarioApp.Integration',
                test: () => !!(window.CalendarioApp && window.CalendarioApp.Integration)
            }
        ];
        
        let passed = 0;
        let total = tests.length;
        
        tests.forEach(test => {
            try {
                const result = test.test();
                console.log(`${result ? '✅' : '❌'} ${test.name}: ${result ? 'OK' : 'NO ENCONTRADO'}`);
                if (result) passed++;
            } catch (error) {
                console.error(`❌ ${test.name}: ERROR - ${error.message}`);
            }
        });
        
        console.log(`\n📊 RESULTADO: ${passed}/${total} sistemas funcionando`);
        
        if (passed === total) {
            console.log('🎉 ¡TODOS LOS SISTEMAS FUNCIONANDO!');
        } else {
            console.log('⚠️ ALGUNOS SISTEMAS NECESITAN ATENCIÓN');
        }
        
        return { passed, total };
    }
    
    // Función para probar funcionalidad básica
    function testBasicFunctionality() {
        console.log('\n🧪 === PRUEBA DE FUNCIONALIDAD BÁSICA ===');
        
        try {
            // Probar Core
            if (window.CalendarioApp && window.CalendarioApp.Core) {
                console.log('✅ Core: Disponible');
                if (typeof window.CalendarioApp.Core.utils === 'object') {
                    console.log('✅ Core.utils: Disponible');
                }
            }
            
            // Probar StateManager
            if (window.CalendarioApp && window.CalendarioApp.StateManager) {
                console.log('✅ StateManager: Disponible');
                if (typeof window.CalendarioApp.StateManager.setState === 'function') {
                    console.log('✅ StateManager.setState: Disponible');
                }
            }
            
            // Probar ModalFactory
            if (window.CalendarioApp && window.CalendarioApp.ModalFactory) {
                console.log('✅ ModalFactory: Disponible');
                if (typeof window.CalendarioApp.ModalFactory.create === 'function') {
                    console.log('✅ ModalFactory.create: Disponible');
                }
            }
            
            console.log('🎉 Pruebas básicas completadas');
            
        } catch (error) {
            console.error('❌ Error en pruebas básicas:', error);
        }
    }
    
    // Función para crear modal de prueba
    function createTestModal() {
        console.log('🎭 Creando modal de prueba...');
        
        try {
            if (window.CalendarioApp && window.CalendarioApp.ModalFactory) {
                // Verificar métodos disponibles
                const methods = Object.keys(window.CalendarioApp.ModalFactory);
                console.log('🔧 Métodos disponibles en ModalFactory:', methods);
                
                // Intentar crear modal usando el método create
                const modalId = window.CalendarioApp.ModalFactory.create('confirm', {
                    title: 'Modal de Prueba',
                    message: '¿Este es un modal de prueba?',
                    onConfirm: () => console.log('✅ Confirmado'),
                    onCancel: () => console.log('❌ Cancelado')
                });
                
                console.log('✅ Modal creado:', modalId);
                return modalId;
            } else {
                console.error('❌ ModalFactory no disponible');
                return null;
            }
        } catch (error) {
            console.error('❌ Error al crear modal:', error);
            return null;
        }
    }
    
    // Hacer funciones disponibles globalmente
    window.testBasicSystems = testBasicSystems;
    window.testBasicFunctionality = testBasicFunctionality;
    window.createTestModal = createTestModal;
    
    console.log('🧪 Script de prueba simple cargado');
    console.log('🔧 Comandos disponibles: testBasicSystems(), testBasicFunctionality(), createTestModal()');
    
})();
