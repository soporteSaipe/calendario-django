/**
 * Calendario Modal - Gestión de reservas
 * Maneja la lógica del modal para crear reservas
 */

document.addEventListener('DOMContentLoaded', function() {
    
    const btnAbrir = document.getElementById('abrirModalReserva');
    const modal = document.getElementById('modalCrearReserva');
    const form = document.getElementById('formCrearReserva');
    const fecha = document.getElementById('fecha');
    const horaInicio = document.getElementById('hora_inicio');
    const horaFin = document.getElementById('hora_fin');
    const recursoSelect = document.getElementById('recurso');
    
    if (!btnAbrir || !modal || !form) {
        return;
    }
    
    // Configurar fecha mínima
    fecha.min = new Date().toISOString().split('T')[0];
    
    // Generar opciones de hora (07:00 a 16:00, intervalos de 30 min)
    function generarHoras(horariosOcupados = []) {
        horaInicio.innerHTML = '<option value="">Seleccionar hora</option>';
        horaFin.innerHTML = '<option value="">Seleccionar hora</option>';
        
        // Función para verificar si una hora está ocupada
        function esHoraOcupada(hora) {
            return horariosOcupados.some(ocupado => {
                return hora >= ocupado.inicio && hora < ocupado.fin;
            });
        }
        
        // Obtener sala seleccionada
        const salaSeleccionada = recursoSelect.value;
        const esComedor = salaSeleccionada && document.querySelector(`option[value="${salaSeleccionada}"]`).textContent.toLowerCase().includes('comedor');
        
        if (esComedor) {
            // LÓGICA ESPECIAL PARA COMEDOR: Dos bloques de horarios
            
            // BLOQUE MAÑANA: 07:00 a 11:30 (hora inicio)
            for (let h = 7; h <= 11; h++) {
                for (let m = 0; m < 60; m += 30) {
                    if (h === 11 && m > 30) break; // Parar en 11:30
                    const hora = `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
                    
                    if (!esHoraOcupada(hora)) {
                        horaInicio.innerHTML += `<option value="${hora}">${hora}</option>`;
                    }
                }
            }
            
            // BLOQUE TARDE: 14:30 a 15:30 (hora inicio)
            for (let h = 14; h <= 15; h++) {
                for (let m = 0; m < 60; m += 30) {
                    if (h === 14 && m < 30) continue; // Empezar en 14:30
                    if (h === 15 && m > 30) break; // Parar en 15:30
                    const hora = `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
                    
                    if (!esHoraOcupada(hora)) {
                        horaInicio.innerHTML += `<option value="${hora}">${hora}</option>`;
                    }
                }
            }
            
            // HORAS DE FIN PARA COMEDOR: 07:30 a 12:00 y 15:00 a 16:00
            // Bloque mañana: 07:30 a 12:00
            for (let h = 7; h <= 12; h++) {
                for (let m = 0; m < 60; m += 30) {
                    if (h === 7 && m < 30) continue; // Empezar en 07:30
                    if (h === 12 && m > 0) break; // Parar en 12:00
                    const hora = `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
                    
                    if (!esHoraOcupada(hora)) {
                        horaFin.innerHTML += `<option value="${hora}">${hora}</option>`;
                    }
                }
            }
            
            // Bloque tarde: 15:00 a 16:00
            for (let h = 15; h <= 16; h++) {
                for (let m = 0; m < 60; m += 30) {
                    if (h === 15 && m < 0) continue; // Empezar en 15:00
                    if (h === 16 && m > 0) break; // Parar en 16:00
                    const hora = `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
                    
                    if (!esHoraOcupada(hora)) {
                        horaFin.innerHTML += `<option value="${hora}">${hora}</option>`;
                    }
                }
            }
            
        } else {
            // LÓGICA NORMAL PARA OTRAS SALAS
            
            // Generar horas de inicio (07:00 a 15:30)
            for (let h = 7; h <= 15; h++) {
                for (let m = 0; m < 60; m += 30) {
                    if (h === 15 && m > 30) break; // Parar en 15:30 para hora inicio
                    const hora = `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
                    
                    // Solo agregar si no está ocupada
                    if (!esHoraOcupada(hora)) {
                        horaInicio.innerHTML += `<option value="${hora}">${hora}</option>`;
                    }
                }
            }
            
            // Generar horas de fin (07:30 a 16:00)
            for (let h = 7; h <= 16; h++) {
                for (let m = 0; m < 60; m += 30) {
                    if (h === 16 && m > 0) break; // Parar en 16:00 para hora fin
                    const hora = `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
                    
                    // Solo agregar si no está ocupada
                    if (!esHoraOcupada(hora)) {
                        horaFin.innerHTML += `<option value="${hora}">${hora}</option>`;
                    }
                }
            }
        }
    }
    
    // Función para obtener horarios ocupados
    async function obtenerHorariosOcupados(recursoId, fecha) {
        if (!recursoId || !fecha) return [];
        
        try {
            const response = await fetch(`${window.horariosOcupadosUrl}?recurso_id=${recursoId}&fecha=${fecha}`);
            if (response.ok) {
                const data = await response.json();
                return data.horarios_ocupados || [];
            }
        } catch (error) {
            // Error silencioso al obtener horarios ocupados
        }
        return [];
    }
    
    // Función para actualizar horarios cuando cambie fecha o recurso
    async function actualizarHorarios() {
        const recursoId = recursoSelect.value;
        const fechaSeleccionada = fecha.value;
        
        if (recursoId && fechaSeleccionada) {
            // Mostrar indicador de carga
            horaInicio.innerHTML = '<option value="">Cargando horarios...</option>';
            horaFin.innerHTML = '<option value="">Cargando horarios...</option>';
            
            // Obtener horarios ocupados
            const horariosOcupados = await obtenerHorariosOcupados(recursoId, fechaSeleccionada);
            
            // Generar horarios filtrados
            generarHoras(horariosOcupados);
        } else {
            generarHoras();
        }
    }
    
    // Event listeners para actualizar horarios
    fecha.addEventListener('change', actualizarHorarios);
    recursoSelect.addEventListener('change', actualizarHorarios);
    
    // Validar que la hora fin sea posterior a la hora inicio
    horaInicio.addEventListener('change', async function() {
        const horaInicioVal = this.value;
        horaFin.innerHTML = '<option value="">Seleccionar hora</option>';
        
        if (horaInicioVal) {
            const recursoId = recursoSelect.value;
            const fechaSeleccionada = fecha.value;
            const horariosOcupados = await obtenerHorariosOcupados(recursoId, fechaSeleccionada);
            
            const [hora, minuto] = horaInicioVal.split(':').map(Number);
            const horaInicioMinutos = hora * 60 + minuto;
            
            // Función para verificar si una hora está ocupada
            function esHoraOcupada(hora) {
                return horariosOcupados.some(ocupado => {
                    return hora >= ocupado.inicio && hora < ocupado.fin;
                });
            }
            
            // Verificar si es comedor
            const esComedor = recursoId && document.querySelector(`option[value="${recursoId}"]`).textContent.toLowerCase().includes('comedor');
            
            if (esComedor) {
                // LÓGICA ESPECIAL PARA COMEDOR
                
                if (horaInicioMinutos <= 11 * 60 + 30) {
                    // BLOQUE MAÑANA: Hora fin hasta 12:00
                    for (let h = 7; h <= 12; h++) {
                        for (let m = 0; m < 60; m += 30) {
                            if (h === 7 && m < 30) continue; // Empezar en 07:30
                            if (h === 12 && m > 0) break; // Parar en 12:00
                            
                            const horaActualMinutos = h * 60 + m;
                            const horaStr = `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
                            
                            if (horaActualMinutos > horaInicioMinutos && !esHoraOcupada(horaStr)) {
                                horaFin.innerHTML += `<option value="${horaStr}">${horaStr}</option>`;
                            }
                        }
                    }
                } else {
                    // BLOQUE TARDE: Hora fin hasta 16:00
                    for (let h = 15; h <= 16; h++) {
                        for (let m = 0; m < 60; m += 30) {
                            if (h === 15 && m < 0) continue; // Empezar en 15:00
                            if (h === 16 && m > 0) break; // Parar en 16:00
                            
                            const horaActualMinutos = h * 60 + m;
                            const horaStr = `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
                            
                            if (horaActualMinutos > horaInicioMinutos && !esHoraOcupada(horaStr)) {
                                horaFin.innerHTML += `<option value="${horaStr}">${horaStr}</option>`;
                            }
                        }
                    }
                }
            } else {
                // LÓGICA NORMAL PARA OTRAS SALAS
                for (let h = 7; h <= 16; h++) {
                    for (let m = 0; m < 60; m += 30) {
                        if (h === 16 && m > 0) break; // Parar en 16:00
                        
                        const horaActualMinutos = h * 60 + m;
                        const horaStr = `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
                        
                        if (horaActualMinutos > horaInicioMinutos && !esHoraOcupada(horaStr)) {
                            horaFin.innerHTML += `<option value="${horaStr}">${horaStr}</option>`;
                        }
                    }
                }
            }
        } else {
            await actualizarHorarios();
        }
    });
    
    // Inicializar horas
    generarHoras();
    
    // Abrir modal
    btnAbrir.addEventListener('click', async function() {
        form.reset();
        fecha.min = new Date().toISOString().split('T')[0];
        
        // Preseleccionar la sala actual si hay una seleccionada
        const salaActual = document.getElementById('salaFilter');
        if (salaActual && recursoSelect) {
            recursoSelect.value = salaActual.value;
        }
        
        // Actualizar horarios con filtros
        await actualizarHorarios();
        
        new bootstrap.Modal(modal).show();
    });
});
