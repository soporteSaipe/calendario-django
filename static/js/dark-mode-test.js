/**
 * DARK MODE TEST
 * Script de prueba para verificar que el modo oscuro funciona correctamente
 */

// Función para probar el modo oscuro
function testDarkMode() {
    console.log('🧪 Iniciando pruebas del modo oscuro...');
    
    // Verificar que el DarkModeManager esté disponible
    if (typeof window.darkModeManager !== 'undefined') {
        console.log('✅ DarkModeManager cargado correctamente');
        
        // Obtener información del tema
        const themeInfo = window.darkModeManager.getThemeInfo();
        console.log('📊 Información del tema:', themeInfo);
        
        // Probar cambio de tema
        console.log('🔄 Probando cambio de tema...');
        const currentTheme = window.darkModeManager.getCurrentTheme();
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        
        console.log(`📝 Cambiando de ${currentTheme} a ${newTheme}`);
        window.darkModeManager.setTheme(newTheme);
        
        // Verificar que el cambio se aplicó
        setTimeout(() => {
            const updatedTheme = window.darkModeManager.getCurrentTheme();
            if (updatedTheme === newTheme) {
                console.log('✅ Cambio de tema exitoso');
            } else {
                console.error('❌ Error en el cambio de tema');
            }
        }, 100);
        
    } else {
        console.error('❌ DarkModeManager no está disponible');
    }
    
    // Verificar que las variables CSS estén definidas
    const rootStyles = getComputedStyle(document.documentElement);
    const primaryColor = rootStyles.getPropertyValue('--primary');
    const bgPrimary = rootStyles.getPropertyValue('--bg-primary');
    
    console.log('🎨 Variables CSS:');
    console.log(`   --primary: ${primaryColor}`);
    console.log(`   --bg-primary: ${bgPrimary}`);
    
    // Verificar que el toggle esté presente
    const toggle = document.querySelector('.theme-toggle');
    if (toggle) {
        console.log('✅ Toggle de tema encontrado');
        console.log(`   Estado actual: ${toggle.getAttribute('data-theme')}`);
    } else {
        console.warn('⚠️ Toggle de tema no encontrado');
    }
}

// Función para mostrar la paleta de colores
function showColorPalette() {
    console.log('🎨 PALETA DE COLORES DEL MODO OSCURO:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    const colors = {
        'Colores Primarios': {
            '--primary': '#64B5F6',
            '--primary-dark': '#42A5F5',
            '--primary-light': '#90CAF9',
            '--secondary': '#81C784',
            '--accent': '#FFB74D'
        },
        'Fondos': {
            '--bg-primary': '#1A1A1A',
            '--bg-secondary': '#222222',
            '--bg-card': '#2A2A2A',
            '--bg-accent': '#333333',
            '--bg-elevated': '#3A3A3A'
        },
        'Texto': {
            '--text-primary': '#FAFAFA',
            '--text-secondary': '#E0E0E0',
            '--text-muted': '#9E9E9E',
            '--text-disabled': '#616161'
        },
        'Estados': {
            '--success': '#66BB6A',
            '--warning': '#FFA726',
            '--danger': '#EF5350',
            '--info': '#42A5F5'
        },
        'Navbar': {
            '--navbar-bg': '#1F1F1F',
            '--navbar-border': '#64B5F6',
            '--navbar-text': '#FAFAFA',
            '--navbar-hover': '#2E2E2E',
            '--navbar-active': '#64B5F6'
        }
    };
    
    Object.entries(colors).forEach(([category, colorSet]) => {
        console.log(`\n📂 ${category}:`);
        Object.entries(colorSet).forEach(([variable, color]) => {
            console.log(`   ${variable}: ${color}`);
        });
    });
    
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
}

// Función para verificar accesibilidad
function checkAccessibility() {
    console.log('♿ Verificando accesibilidad...');
    
    // Verificar contraste de texto
    const textElements = document.querySelectorAll('p, h1, h2, h3, h4, h5, h6, span, div');
    let goodContrast = 0;
    let poorContrast = 0;
    
    textElements.forEach(element => {
        const styles = getComputedStyle(element);
        const color = styles.color;
        const backgroundColor = styles.backgroundColor;
        
        // Esta es una verificación básica - en un entorno real usarías una librería especializada
        if (color && backgroundColor && color !== backgroundColor) {
            goodContrast++;
        } else {
            poorContrast++;
        }
    });
    
    console.log(`✅ Elementos con buen contraste: ${goodContrast}`);
    if (poorContrast > 0) {
        console.log(`⚠️ Elementos con contraste pobre: ${poorContrast}`);
    }
    
    // Verificar que los elementos de foco sean visibles
    const focusableElements = document.querySelectorAll('button, a, input, select, textarea');
    console.log(`🎯 Elementos enfocables encontrados: ${focusableElements.length}`);
}

// Ejecutar pruebas cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 Dark Mode Test Suite iniciado');
    console.log('═══════════════════════════════════════════════════');
    
    // Mostrar paleta de colores
    showColorPalette();
    
    // Esperar un poco para que el dark mode se inicialice
    setTimeout(() => {
        testDarkMode();
        checkAccessibility();
        
        console.log('\n🎉 Pruebas completadas!');
        console.log('💡 Usa las siguientes funciones en la consola:');
        console.log('   - testDarkMode() - Probar funcionalidad');
        console.log('   - showColorPalette() - Mostrar paleta');
        console.log('   - checkAccessibility() - Verificar accesibilidad');
        console.log('   - window.darkModeManager.toggleTheme() - Cambiar tema');
    }, 500);
});

// Hacer funciones disponibles globalmente
window.testDarkMode = testDarkMode;
window.showColorPalette = showColorPalette;
window.checkAccessibility = checkAccessibility;
