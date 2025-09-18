/**
 * Demo de Notificaciones Mejoradas
 * Muestra todas las funcionalidades del sistema de notificaciones
 */

// Función para demostrar las notificaciones
function demoNotifications() {
    
    // Notificación de éxito con sonido
    CalendarioApp.Notifications.success('¡Reserva creada exitosamente!', {
        title: 'Operación exitosa',
        subtitle: 'La reserva se ha guardado correctamente',
        onClick: () => {}
    });
    
    // Notificación de error con vibración
    setTimeout(() => {
        CalendarioApp.Notifications.error('Error al conectar con el servidor', {
            title: 'Error de conexión',
            subtitle: 'Verifica tu conexión a internet'
        });
    }, 1000);
    
    // Notificación de advertencia
    setTimeout(() => {
        CalendarioApp.Notifications.warning('Tu sesión expirará en 5 minutos', {
            title: 'Sesión próxima a expirar',
            subtitle: 'Guarda tu trabajo antes de continuar'
        });
    }, 2000);
    
    // Notificación de información
    setTimeout(() => {
        CalendarioApp.Notifications.info('Nueva actualización disponible', {
            title: 'Actualización del sistema',
            subtitle: 'Reinicia la aplicación para aplicar los cambios'
        });
    }, 3000);
    
    // Notificación de progreso
    setTimeout(() => {
        const progress = CalendarioApp.Notifications.progress('Sincronizando datos...', {
            title: 'Sincronización en curso'
        });
        
        // Simular progreso
        let percent = 0;
        const interval = setInterval(() => {
            percent += 10;
            progress.update(percent);
            
            if (percent >= 100) {
                clearInterval(interval);
                progress.complete('¡Sincronización completada!');
            }
        }, 200);
    }, 4000);
    
    // Notificación de confirmación
    setTimeout(() => {
        CalendarioApp.Notifications.confirm(
            '¿Estás seguro de que quieres eliminar esta reserva? Esta acción no se puede deshacer.',
            {
                title: 'Confirmar eliminación',
                confirmText: 'Eliminar',
                cancelText: 'Cancelar',
                confirmIcon: 'fas fa-trash',
                cancelIcon: 'fas fa-times'
            }
        ).then(confirmed => {
            if (confirmed) {
                CalendarioApp.Notifications.success('Reserva eliminada correctamente');
            } else {
                CalendarioApp.Notifications.info('Operación cancelada');
            }
        });
    }, 6000);
}

// Función para probar diferentes posiciones
function testPositions() {
    const positions = ['top-right', 'top-left', 'bottom-right', 'bottom-left', 'top-center', 'bottom-center'];
    let currentIndex = 0;
    
    const testNext = () => {
        if (currentIndex < positions.length) {
            CalendarioApp.Notifications.config.position = positions[currentIndex];
            CalendarioApp.Notifications.info(`Posición: ${positions[currentIndex]}`, {
                title: 'Prueba de posicionamiento'
            });
            currentIndex++;
            setTimeout(testNext, 2000);
        }
    };
    
    testNext();
}

// Función para probar agrupación
function testGrouping() {
    CalendarioApp.Notifications.info('Primera notificación del grupo');
    setTimeout(() => CalendarioApp.Notifications.info('Segunda notificación del grupo'), 500);
    setTimeout(() => CalendarioApp.Notifications.info('Tercera notificación del grupo'), 1000);
}

// Función para probar límite de notificaciones
function testLimit() {
    for (let i = 1; i <= 8; i++) {
        setTimeout(() => {
            CalendarioApp.Notifications.info(`Notificación ${i}`, {
                title: `Mensaje ${i}`
            });
        }, i * 500);
    }
}

// Agregar botones de demo al DOM cuando esté listo
document.addEventListener('DOMContentLoaded', function() {
    // Solo mostrar en modo desarrollo
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
        const demoContainer = document.createElement('div');
        demoContainer.style.cssText = `
            position: fixed;
            bottom: 20px;
            left: 20px;
            z-index: 10000;
            display: flex;
            flex-direction: column;
            gap: 10px;
        `;
        
        demoContainer.innerHTML = `
            <button onclick="demoNotifications()" class="btn btn-primary btn-sm">
                🎭 Demo Notificaciones
            </button>
            <button onclick="testPositions()" class="btn btn-secondary btn-sm">
                📍 Probar Posiciones
            </button>
            <button onclick="testGrouping()" class="btn btn-info btn-sm">
                📦 Probar Agrupación
            </button>
            <button onclick="testLimit()" class="btn btn-warning btn-sm">
                🔢 Probar Límite
            </button>
            <button onclick="CalendarioApp.Notifications.hideAll()" class="btn btn-danger btn-sm">
                ❌ Ocultar Todas
            </button>
        `;
        
        document.body.appendChild(demoContainer);
    }
});
