/**
 * Calendario Reserva - Gestión de creación de reservas
 * Maneja la lógica para crear reservas con AJAX
 */

// Función mejorada para crear reserva
function crearReserva() {
    
    const form = document.getElementById('formCrearReserva');
    const formData = new FormData(form);
    
    // Validar campos obligatorios
    const camposRequeridos = ['recurso', 'titulo', 'fecha', 'hora_inicio', 'hora_fin'];
    let errores = [];
    
    for (let campo of camposRequeridos) {
        const valor = formData.get(campo);
        if (!valor || valor.trim() === '') {
            errores.push(`${campo.replace('_', ' ')} es obligatorio`);
        }
    }
    
    // Validar que la hora fin sea posterior a la hora inicio
    const horaInicio = formData.get('hora_inicio');
    const horaFin = formData.get('hora_fin');
    if (horaInicio && horaFin) {
        const [h1, m1] = horaInicio.split(':').map(Number);
        const [h2, m2] = horaFin.split(':').map(Number);
        const minutosInicio = h1 * 60 + m1;
        const minutosFin = h2 * 60 + m2;
        
        if (minutosFin <= minutosInicio) {
            errores.push('La hora de fin debe ser posterior a la hora de inicio');
        }
    }
    
    if (errores.length > 0) {
        CalendarioApp.Notifications.error('Errores encontrados:<br>' + errores.join('<br>'), {
            title: 'Error de validación',
            duration: 6000
        });
        return;
    }
    
    
    // Configurar estado de carga en el botón
    const btnCrear = document.getElementById('btnCrearReserva');
    CalendarioApp.Loading.setButtonLoading(btnCrear, true, 'Creando reserva...');
    
    // Enviar formulario
    fetch(form.action, {
        method: 'POST',
        body: formData,
        headers: {
            'X-CSRFToken': document.querySelector('[name=csrfmiddlewaretoken]').value,
            'X-Requested-With': 'XMLHttpRequest'
        }
    })
    .then(response => {
        
        // Restaurar botón
        CalendarioApp.Loading.setButtonLoading(btnCrear, false);
        
        if (response.ok) {
            // Intentar parsear como JSON primero
            return response.json().then(data => {
                if (data.success) {
                    // Cerrar modal
                    const modal = bootstrap.Modal.getInstance(document.getElementById('modalCrearReserva'));
                    modal.hide();
                    
                    // Refrescar calendario
                    if (window.CalendarioApp && window.CalendarioApp.calendar) {
                        window.CalendarioApp.calendar.refetchEvents();
                    }
                    
                    // Mostrar mensaje de éxito
                    CalendarioApp.Notifications.success(data.message || '¡Reserva creada exitosamente!', {
                        title: 'Reserva creada',
                        duration: 4000
                    });
                } else {
                    // Error del servidor
                    CalendarioApp.Notifications.error(data.error || 'Error desconocido', {
                        title: 'Error al crear reserva',
                        duration: 6000
                    });
                }
            }).catch(() => {
                // Si no es JSON, es probable que sea un redirect (respuesta HTML)
                // Cerrar modal y refrescar página
                const modal = bootstrap.Modal.getInstance(document.getElementById('modalCrearReserva'));
                modal.hide();
                
                // Refrescar calendario
                if (window.CalendarioApp && window.CalendarioApp.calendar) {
                    window.CalendarioApp.calendar.refetchEvents();
                }
                
                CalendarioApp.Notifications.success('¡Reserva creada exitosamente!', {
                    title: 'Reserva creada',
                    duration: 4000
                });
            });
        } else {
            // Error HTTP
            return response.json().then(data => {
                CalendarioApp.Notifications.error(data.error || 'Error del servidor', {
                    title: 'Error del servidor',
                    duration: 6000
                });
            }).catch(() => {
                CalendarioApp.Notifications.error('Error al crear la reserva. Verifica los datos e intenta nuevamente.', {
                    title: 'Error de conexión',
                    duration: 6000
                });
            });
        }
    })
    .catch(error => {
        
        // Restaurar botón
        CalendarioApp.Loading.setButtonLoading(btnCrear, false);
        
        CalendarioApp.Notifications.error('Error de conexión. Verifica tu conexión a internet e intenta nuevamente.', {
            title: 'Error de conexión',
            duration: 6000
        });
    });
}

// Manejar envío del formulario de crear reserva con AJAX
document.addEventListener('DOMContentLoaded', function() {
    const formCrearReserva = document.getElementById('formCrearReserva');
    if (formCrearReserva) {
        formCrearReserva.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const formData = new FormData(this);
            const submitBtn = this.querySelector('button[type="submit"]');
            
            // Mostrar estado de carga
            if (submitBtn) {
                submitBtn.disabled = true;
                submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Creando...';
            }
            
            // Enviar petición AJAX
            fetch(this.action, {
                method: 'POST',
                body: formData,
                headers: {
                    'X-Requested-With': 'XMLHttpRequest',
                }
            })
            .then(response => response.json())
            .then(data => {
                // Restaurar botón
                if (submitBtn) {
                    submitBtn.disabled = false;
                    submitBtn.innerHTML = 'Crear Reserva';
                }
                
                // Manejar respuesta
                if (window.CalendarioApp && window.CalendarioApp.handleReservaResponse) {
                    window.CalendarioApp.handleReservaResponse(data);
                } else {
                    // Fallback si no está disponible la función
                    if (data.success) {
                        alert(data.message);
                        location.reload();
                    } else {
                        alert(data.error || 'Error al crear la reserva');
                    }
                }
            })
            .catch(error => {
                
                // Restaurar botón
                if (submitBtn) {
                    submitBtn.disabled = false;
                    submitBtn.innerHTML = 'Crear Reserva';
                }
                
                alert('Error de conexión. Intenta nuevamente.');
            });
        });
    }
});
