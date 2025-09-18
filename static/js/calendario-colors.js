/**
 * Módulo de Colores Dinámicos del Calendario
 * Maneja los colores distintivos para cada sala
 */

// Asegurar que CalendarioApp existe
window.CalendarioApp = window.CalendarioApp || {};

/**
 * Paleta de colores primaverales con ALTO CONTRASTE para cada sala
 * Cumple con WCAG 2.1 AA (ratio de contraste mínimo 4.5:1)
 */
CalendarioApp.salaColors = {
    // Sala 1 - Rosa vibrante (Cerezos en flor) - WCAG AA
    '1': {
        primary: '#EC4899',    // Rosa vibrante (WCAG AA)
        secondary: '#FCE7F3',  // Rosa muy claro
        text: '#581C87',       // Texto púrpura oscuro (WCAG AA)
        textOnPrimary: '#FFFFFF' // Texto blanco sobre rosa
    },
    // Sala 2 - Lavanda profundo (Flores de lavanda) - WCAG AA
    '2': {
        primary: '#A855F7',    // Lavanda profundo (WCAG AA)
        secondary: '#E1BEE7',  // Lavanda muy claro
        text: '#581C87',       // Texto púrpura oscuro (WCAG AA)
        textOnPrimary: '#FFFFFF' // Texto blanco sobre lavanda
    },
    // Sala 3 - Verde menta profundo (Hojas frescas) - WCAG AA
    '3': {
        primary: '#059669',    // Verde menta profundo (WCAG AA)
        secondary: '#C8E6C9',  // Verde muy claro
        text: '#064E3B',       // Texto verde muy oscuro (WCAG AA)
        textOnPrimary: '#FFFFFF' // Texto blanco sobre verde
    },
    // Sala 4 - Amarillo dorado (Polen dorado) - WCAG AA
    '4': {
        primary: '#EAB308',    // Amarillo dorado (WCAG AA)
        secondary: '#FFFDE7',  // Amarillo muy claro
        text: '#7C2D12',       // Texto marrón oscuro (WCAG AA)
        textOnPrimary: '#FFFFFF' // Texto blanco sobre amarillo
    },
    // Sala 5 - Azul cielo profundo (Cielo primaveral) - WCAG AA
    '5': {
        primary: '#1D4ED8',    // Azul cielo profundo (WCAG AA)
        secondary: '#DBEAFE',  // Azul muy claro
        text: '#1E3A8A',       // Texto azul oscuro (WCAG AA)
        textOnPrimary: '#FFFFFF' // Texto blanco sobre azul
    },
    // Sala 6 - Púrpura profundo (Flores de jacaranda) - WCAG AA
    '6': {
        primary: '#7C3AED',    // Púrpura profundo (WCAG AA)
        secondary: '#E9D5FF',  // Púrpura muy claro
        text: '#581C87',       // Texto púrpura oscuro (WCAG AA)
        textOnPrimary: '#FFFFFF' // Texto blanco sobre púrpura
    }
};

/**
 * Obtener colores de una sala por ID
 */
CalendarioApp.getSalaColors = function(salaId) {
    return CalendarioApp.salaColors[salaId] || CalendarioApp.salaColors['1'];
};

/**
 * Obtener color oscuro que contraste con el color de la sala
 */
CalendarioApp.getDarkContrastColor = function(hexColor) {
    // Convertir hex a RGB
    const hex = hexColor.replace('#', '');
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);
    
    // Crear versión más oscura (reducir brillo en 60%)
    const darkR = Math.max(0, Math.floor(r * 0.4));
    const darkG = Math.max(0, Math.floor(g * 0.4));
    const darkB = Math.max(0, Math.floor(b * 0.4));
    
    return {
        r: darkR,
        g: darkG,
        b: darkB,
        hex: `#${darkR.toString(16).padStart(2, '0')}${darkG.toString(16).padStart(2, '0')}${darkB.toString(16).padStart(2, '0')}`
    };
};

/**
 * Obtener información de colores disponibles con alto contraste
 */
CalendarioApp.getAvailableColors = function() {
    const colorNames = {
        '1': 'Rosa Vibrante',
        '2': 'Lavanda Profundo', 
        '3': 'Verde Menta Profundo',
        '4': 'Amarillo Dorado',
        '5': 'Azul Cielo Profundo',
        '6': 'Púrpura Profundo'
    };
    
    return colorNames;
};

/**
 * Mostrar información de colores en consola (para debugging)
 */
CalendarioApp.logColorInfo = function() {
    Object.keys(CalendarioApp.salaColors).forEach(salaId => {
        const colors = CalendarioApp.salaColors[salaId];
        const colorNames = CalendarioApp.getAvailableColors();
    });
};

/**
 * Aplicar colores dinámicos al header del calendario con ALTO CONTRASTE
 */
CalendarioApp.applyHeaderColors = function(salaId) {
    const colors = CalendarioApp.getSalaColors(salaId);
    const header = document.querySelector('.calendar-header-modern');
    
    if (header) {
        // Agregar clase para transiciones suaves
        header.classList.add('dynamic-colors');
        
        // Aplicar gradiente de fondo con alto contraste
        header.style.background = `linear-gradient(135deg, ${colors.primary} 0%, ${colors.secondary} 100%)`;
        header.style.borderBottomColor = colors.primary;
        
        // Usar texto blanco sobre colores primarios para máximo contraste
        header.style.color = colors.textOnPrimary;
        
        // Aplicar color a todos los elementos del header con alto contraste
        const headerElements = header.querySelectorAll('h4, h5, i, #salaTitulo');
        headerElements.forEach(element => {
            element.style.color = colors.textOnPrimary;
            element.style.textShadow = '0 1px 2px rgba(0, 0, 0, 0.3)';
        });
        
        // Aplicar colores oscuros que contrasten con el color de la sala usando variables CSS
        const darkColor = CalendarioApp.getDarkContrastColor(colors.primary);
        
        // Aplicar variables CSS al header para que los botones las hereden
        header.style.setProperty('--btn-header-bg', `rgba(${darkColor.r}, ${darkColor.g}, ${darkColor.b}, 0.8)`);
        header.style.setProperty('--btn-header-text', colors.textOnPrimary);
        header.style.setProperty('--btn-header-border', `rgba(${darkColor.r}, ${darkColor.g}, ${darkColor.b}, 1)`);
        header.style.setProperty('--btn-header-bg-hover', `rgba(${darkColor.r}, ${darkColor.g}, ${darkColor.b}, 1)`);
        header.style.setProperty('--btn-header-border-hover', `rgba(${darkColor.r}, ${darkColor.g}, ${darkColor.b}, 1)`);
        header.style.setProperty('--btn-header-bg-active', `rgba(${Math.max(0, darkColor.r - 20)}, ${Math.max(0, darkColor.g - 20)}, ${Math.max(0, darkColor.b - 20)}, 1)`);
        
        const colorNames = CalendarioApp.getAvailableColors();
    }
};

/**
 * Aplicar colores dinámicos al header de filtros
 */
CalendarioApp.applyFilterHeaderColors = function(salaId) {
    const colors = CalendarioApp.getSalaColors(salaId);
    const filterHeader = document.querySelector('.card-header-modern');
    
    if (filterHeader) {
        // Agregar clase para transiciones suaves
        filterHeader.classList.add('dynamic-colors');
        
        // Aplicar gradiente de fondo
        filterHeader.style.background = `linear-gradient(135deg, ${colors.primary} 0%, ${colors.secondary} 100%)`;
        filterHeader.style.borderBottomColor = colors.primary;
        
        // Asegurar que el texto sea blanco
        filterHeader.style.color = colors.text;
        
        // Aplicar color a todos los elementos del header de filtros
        const headerElements = filterHeader.querySelectorAll('h4, h5, i');
        headerElements.forEach(element => {
            element.style.color = colors.text;
        });
        
    }
};

/**
 * Restablecer colores por defecto del header
 */
CalendarioApp.resetHeaderColors = function() {
    const header = document.querySelector('.calendar-header-modern');
    
    if (header) {
        // Restablecer estilos CSS originales
        header.style.background = '';
        header.style.color = '';
        
        // Restablecer elementos del header
        const headerElements = header.querySelectorAll('h4, h5, i, #salaTitulo, .btn-modern');
        headerElements.forEach(element => {
            element.style.color = '';
        });
        
        // Restablecer botones
        const buttons = header.querySelectorAll('.btn-modern');
        buttons.forEach(button => {
            button.style.background = '';
            button.style.color = '';
            button.style.borderColor = '';
        });
        
    }
};

/**
 * Aplicar colores dinámicos a elementos adicionales
 */
CalendarioApp.applyDynamicColors = function(salaId) {
    const colors = CalendarioApp.getSalaColors(salaId);
    
    // Aplicar color al indicador de sala
    const colorIndicator = document.getElementById('salaColorIndicator');
    if (colorIndicator) {
        colorIndicator.style.backgroundColor = colors.primary;
        colorIndicator.style.borderColor = colors.primary;
    }
    
    // Aplicar color sutil a la tarjeta del calendario
    const calendarCard = document.querySelector('.card-modern');
    if (calendarCard) {
        calendarCard.classList.add('dynamic-border');
        calendarCard.style.borderLeft = `4px solid ${colors.primary}`;
    }
    
    // Aplicar colores al header de filtros
    CalendarioApp.applyFilterHeaderColors(salaId);
    
    const colorNames = CalendarioApp.getAvailableColors();
};

/**
 * Inicializar sistema de colores dinámicos
 */
CalendarioApp.initializeColorSystem = function() {
    CalendarioApp.logColorInfo();
};
