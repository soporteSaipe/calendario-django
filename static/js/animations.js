// Sistema de Animaciones Simplificado
// Solo efectos hover y funcionalidades básicas

class AnimationController {
    constructor() {
        this.init();
    }

    init() {
        // Solo configurar efectos de hover dinámicos
        this.setupHoverEffects();
    }

    // Efectos de hover dinámicos (sin animaciones automáticas)
    setupHoverEffects() {
        // Efectos de hover para botones
        document.querySelectorAll('.btn-modern').forEach(button => {
            button.addEventListener('mouseenter', () => {
                button.style.transform = 'translateY(-2px)';
                button.style.transition = 'transform 0.2s ease';
            });
            
            button.addEventListener('mouseleave', () => {
                button.style.transform = 'translateY(0)';
            });
        });

        // Efectos de hover para tarjetas
        document.querySelectorAll('.card-modern').forEach(card => {
            card.addEventListener('mouseenter', () => {
                card.style.transform = 'translateY(-4px)';
                card.style.transition = 'transform 0.3s ease';
            });
            
            card.addEventListener('mouseleave', () => {
                card.style.transform = 'translateY(0)';
            });
        });
    }
}

// Funcionalidades adicionales de animaciones de página
class PageAnimations {
    constructor() {
        this.init();
    }

    init() {
        // Configurar efectos básicos y animaciones de carga
        this.setupBasicEffects();
        this.setupPageLoadAnimations();
    }

    setupBasicEffects() {
        // Efectos de hover para elementos específicos
        document.querySelectorAll('.spring-icon').forEach(icon => {
            icon.addEventListener('mouseenter', () => {
                icon.style.transform = 'scale(1.1)';
                icon.style.transition = 'transform 0.2s ease';
            });
            
            icon.addEventListener('mouseleave', () => {
                icon.style.transform = 'scale(1)';
            });
        });
    }

    setupPageLoadAnimations() {
        // Marcar la página como cargada
        document.body.classList.add('page-loaded');
        
        // Configurar animaciones específicas con delays
        this.setupSpecificAnimations();
    }

    /**
     * Configurar animaciones específicas para elementos de la página
     */
    setupSpecificAnimations() {
        
        // Navbar - fade in desde arriba
        const navbar = document.querySelector('.navbar-modern');
        if (navbar) {
            navbar.classList.add('animate-fade-in-down', 'animate-delay-100');
        }

        // Header principal - fade in desde arriba con delay
        const header = document.querySelector('.accounting-header');
        if (header) {
            header.classList.add('animate-fade-in-down', 'animate-delay-200');
        }

        // Tarjeta de filtro - fade in desde la izquierda
        const filterCard = document.querySelector('.card-modern:first-of-type');
        if (filterCard) {
            filterCard.classList.add('animate-fade-in-left', 'animate-delay-300');
        }

        // Tarjeta del calendario - fade in desde abajo
        const calendarCard = document.querySelector('.card-modern:last-of-type');
        if (calendarCard) {
            calendarCard.classList.add('animate-fade-in-up', 'animate-delay-400');
        }

        // Footer - fade in simple
        const footer = document.querySelector('.footer-modern');
        if (footer) {
            footer.classList.add('animate-fade-in', 'animate-delay-500');
        }

        // Mensajes de alerta - scale in con bounce
        const alerts = document.querySelectorAll('.alert-modern');
        alerts.forEach((alert, index) => {
            alert.classList.add('animate-scale-in-bounce');
            alert.style.animationDelay = `${0.6 + (index * 0.1)}s`;
        });

        if (alerts.length > 0) {
        }

        // Botones principales - fade in desde la derecha
        const primaryButtons = document.querySelectorAll('.btn-primary, .btn-primary-modern');
        primaryButtons.forEach((button, index) => {
            button.classList.add('animate-fade-in-right');
            button.style.animationDelay = `${0.7 + (index * 0.1)}s`;
        });

        if (primaryButtons.length > 0) {
        }

    }

    /**
     * Aplicar animación a un elemento específico
     */
    animateElement(element, animationClass, delay = 0) {
        if (element) {
            element.classList.add(animationClass);
            if (delay > 0) {
                element.style.animationDelay = `${delay}s`;
            }
            return true;
        }
        return false;
    }

    /**
     * Aplicar animación a múltiples elementos con delays escalonados
     */
    animateElements(elements, animationClass, baseDelay = 0, delayIncrement = 0.1) {
        elements.forEach((element, index) => {
            if (element) {
                element.classList.add(animationClass);
                element.style.animationDelay = `${baseDelay + (index * delayIncrement)}s`;
            }
        });
    }
}

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    new AnimationController();
    new PageAnimations();
});

// Exportar para uso global
window.AnimationController = AnimationController;
window.PageAnimations = PageAnimations;

// Compatibilidad con CalendarioApp
window.CalendarioApp = window.CalendarioApp || {};
window.CalendarioApp.PageAnimations = PageAnimations;