/**
 * SCRIPT DE PRUEBA SIMPLE
 * Archivo temporal para evitar errores 404
 */

console.log('✅ simple-test.js cargado correctamente');

// Verificar que el DOM esté listo antes de ejecutar código
document.addEventListener('DOMContentLoaded', function() {
    console.log('✅ DOM cargado, simple-test.js listo');
    
    // Verificar que los elementos existan antes de agregar event listeners
    const elements = document.querySelectorAll('[data-test]');
    if (elements.length > 0) {
        console.log(`✅ Encontrados ${elements.length} elementos de prueba`);
    }
});
