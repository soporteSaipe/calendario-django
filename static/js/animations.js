// Animaciones Dinámicas y Efectos Interactivos

class AnimationController {
    constructor() {
        this.init();
        this.setupIntersectionObserver();
        this.setupButtonEffects();
    }

    init() {
        // Aplicar animaciones de entrada a elementos existentes
        this.animateOnLoad();
        
        // Configurar efectos de hover dinámicos
        this.setupHoverEffects();
        
        // Configurar animaciones de scroll
        this.setupScrollAnimations();
    }

    // Animaciones de entrada al cargar la página
    animateOnLoad() {
        const elements = {
            '.accounting-header': 'animate-slide-in-top',
            '.navbar-modern': 'animate-fade-in-down',
            '.card-modern': 'animate-fade-in-up',
            '.btn-modern': 'animate-scale-in-bounce'
        };

        Object.entries(elements).forEach(([selector, animationClass], index) => {
            const element = document.querySelector(selector);
            if (element) {
                element.classList.add(animationClass);
                element.style.animationDelay = `${index * 0.1}s`;
            }
        });
    }

    // Observer para animaciones al hacer scroll
    setupIntersectionObserver() {
        const observerOptions = {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const element = entry.target;
                    const animationType = element.dataset.animation || 'animate-fade-in-up';
                    
                    element.classList.add(animationType);
                    observer.unobserve(element);
                }
            });
        }, observerOptions);

        // Observar elementos con data-animation
        document.querySelectorAll('[data-animation]').forEach(el => {
            observer.observe(el);
        });
    }

    // Efectos de botones avanzados
    setupButtonEffects() {
        // Efecto ripple deshabilitado temporalmente para solucionar problema del botón
        document.querySelectorAll('.btn-modern').forEach(button => {
            // Efecto de click
            button.addEventListener('mousedown', () => {
                button.style.transform = 'scale(0.95)';
            });

            button.addEventListener('mouseup', () => {
                button.style.transform = 'scale(1)';
            });

            button.addEventListener('mouseleave', () => {
                button.style.transform = 'scale(1)';
            });
        });
    }

    // Crear efecto de ripple
    createRippleEffect(event, element) {
        const ripple = document.createElement('span');
        const rect = element.getBoundingClientRect();
        const size = Math.max(rect.width, rect.height);
        const x = event.clientX - rect.left - size / 2;
        const y = event.clientY - rect.top - size / 2;

        ripple.style.cssText = `
            position: absolute;
            width: ${size}px;
            height: ${size}px;
            left: ${x}px;
            top: ${y}px;
            background: rgba(255, 255, 255, 0.3);
            border-radius: 50%;
            transform: scale(0);
            animation: ripple 0.6s ease-out;
            pointer-events: none;
        `;

        element.style.position = 'relative';
        element.style.overflow = 'hidden';
        element.appendChild(ripple);

        setTimeout(() => {
            ripple.remove();
        }, 600);
    }


    // Efectos de hover dinámicos
    setupHoverEffects() {
        // Cards con efecto de tilt - excluir calendario
        document.querySelectorAll('.card-modern').forEach(card => {
            // Excluir cards que contengan el calendario
            if (card.querySelector('#calendar') || card.querySelector('.calendar-container')) {
                return;
            }

            card.addEventListener('mousemove', (e) => {
                this.tiltCard(card, e);
            });

            card.addEventListener('mouseleave', () => {
                this.resetCardTilt(card);
            });
        });

        // Botones con efecto de glow
        document.querySelectorAll('.btn-glass').forEach(button => {
            button.addEventListener('mouseenter', () => {
                button.classList.add('hover-glow');
            });

            button.addEventListener('mouseleave', () => {
                button.classList.remove('hover-glow');
            });
        });
    }

    // Efecto de tilt en cards
    tiltCard(card, event) {
        const rect = card.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;
        const rotateX = (y - centerY) / 10;
        const rotateY = (centerX - x) / 10;

        card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.05, 1.05, 1.05)`;
    }

    resetCardTilt(card) {
        card.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)';
    }

    // Animaciones de scroll
    setupScrollAnimations() {
        let ticking = false;

        const updateScrollAnimations = () => {
            const scrolled = window.pageYOffset;
            const parallaxElements = document.querySelectorAll('[data-parallax]');

            parallaxElements.forEach(element => {
                const speed = element.dataset.parallax || 0.5;
                const yPos = -(scrolled * speed);
                element.style.transform = `translateY(${yPos}px)`;
            });

            ticking = false;
        };

        window.addEventListener('scroll', () => {
            if (!ticking) {
                requestAnimationFrame(updateScrollAnimations);
                ticking = true;
            }
        });
    }



    // Animaciones de notificación
    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <div class="notification-content">
                <i class="fas fa-${this.getNotificationIcon(type)}"></i>
                <span>${message}</span>
            </div>
        `;

        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: var(--bg-card);
            border: 1px solid var(--glass-border);
            border-radius: var(--border-radius-md);
            padding: 1rem;
            box-shadow: var(--glass-shadow);
            backdrop-filter: blur(8px);
            z-index: 1000;
            transform: translateX(100%);
            transition: transform 0.3s ease;
        `;

        document.body.appendChild(notification);

        // Animar entrada
        setTimeout(() => {
            notification.style.transform = 'translateX(0)';
        }, 100);

        // Animar salida
        setTimeout(() => {
            notification.style.transform = 'translateX(100%)';
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }

    getNotificationIcon(type) {
        const icons = {
            success: 'check-circle',
            error: 'exclamation-circle',
            warning: 'exclamation-triangle',
            info: 'info-circle'
        };
        return icons[type] || 'info-circle';
    }

    // Efectos de transición de página
    setupPageTransitions() {
        // Fade in al cargar
        document.body.style.opacity = '0';
        document.body.style.transition = 'opacity 0.5s ease';
        
        window.addEventListener('load', () => {
            document.body.style.opacity = '1';
        });

        // Efectos en enlaces
        document.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', (e) => {
                if (link.hostname === window.location.hostname) {
                    e.preventDefault();
                    document.body.style.opacity = '0.7';
                    setTimeout(() => {
                        window.location.href = link.href;
                    }, 200);
                }
            });
        });
    }
}

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    new AnimationController();
});

// Exportar para uso global
window.AnimationController = AnimationController;
