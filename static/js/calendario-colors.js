/**
 * Módulo de Colores Dinámicos del Calendario
 * Maneja los colores distintivos para cada sala
 */

// Asegurar que CalendarioApp existe
window.CalendarioApp = window.CalendarioApp || {};

/**
 * Sistema de colores dinámicos basado en la base de datos
 * Los colores se obtienen dinámicamente desde CalendarioApp.salasData
 */
CalendarioApp.salaColors = {};

/**
 * Obtener colores de una sala por ID desde datos dinámicos
 */
CalendarioApp.getSalaColors = function(salaId) {
    // Obtener color de la base de datos desde salasData
    const salaData = CalendarioApp.salasData[salaId];
    if (salaData && salaData.color) {
        const primaryColor = salaData.color;
        return {
            primary: primaryColor,
            secondary: CalendarioApp.lightenColor(primaryColor, 0.8),
            text: CalendarioApp.getContrastTextColor(primaryColor),
            textOnPrimary: '#FFFFFF'
        };
    }
    
    // Color por defecto si no se encuentra
    return {
        primary: '#64748B',
        secondary: '#F1F5F9',
        text: '#1E293B',
        textOnPrimary: '#FFFFFF'
    };
};

/**
 * Aclarar un color hexadecimal
 */
CalendarioApp.lightenColor = function(hexColor, factor = 0.8) {
    const hex = hexColor.replace('#', '');
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);
    
    // Mezclar con blanco para aclarar
    const lightR = Math.floor(r + (255 - r) * factor);
    const lightG = Math.floor(g + (255 - g) * factor);
    const lightB = Math.floor(b + (255 - b) * factor);
    
    return `#${lightR.toString(16).padStart(2, '0')}${lightG.toString(16).padStart(2, '0')}${lightB.toString(16).padStart(2, '0')}`;
};

/**
 * Obtener color de texto que contraste con el fondo
 */
CalendarioApp.getContrastTextColor = function(hexColor) {
    const hex = hexColor.replace('#', '');
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);
    
    // Calcular luminancia
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    
    // Retornar negro o blanco según el contraste
    return luminance > 0.5 ? '#1E293B' : '#FFFFFF';
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
 * Obtener información de colores disponibles dinámicamente
 */
CalendarioApp.getAvailableColors = function() {
    const colorNames = {};
    
    // Obtener nombres de colores desde los datos de salas
    Object.keys(CalendarioApp.salasData).forEach(salaId => {
        const sala = CalendarioApp.salasData[salaId];
        if (sala && sala.nombre) {
            colorNames[salaId] = sala.nombre;
        }
    });
    
    return colorNames;
};

/**
 * Mostrar información de colores dinámicos
 */
CalendarioApp.logColorInfo = function() {
    const colorNames = CalendarioApp.getAvailableColors();
    Object.keys(CalendarioApp.salasData).forEach(salaId => {
        const sala = CalendarioApp.salasData[salaId];
        if (sala && sala.color) {
            const colors = CalendarioApp.getSalaColors(salaId);
            // Información disponible para debugging si es necesario
        }
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
    
};

/**
 * Inicializar sistema de colores dinámicos
 */
CalendarioApp.initializeColorSystem = function() {
    CalendarioApp.logColorInfo();
};
