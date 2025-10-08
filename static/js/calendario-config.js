/**
 * Calendario Config - Configuración de URLs y variables globales
 * Define las URLs necesarias para el funcionamiento del calendario
 */

// URLs para el JavaScript - Estas se configuran desde el template
// window.calendarioApiUrl = '{% url "calendario:api_reservas" %}';
// window.crearReservaUrl = '{% url "calendario:crear_reserva" %}';
// window.horariosOcupadosUrl = '{% url "calendario:api_horarios_ocupados" %}';

// Función para configurar las URLs desde el template
function configurarUrlsCalendario(urls) {
    window.calendarioApiUrl = urls.calendarioApiUrl;
    window.crearReservaUrl = urls.crearReservaUrl;
    window.horariosOcupadosUrl = urls.horariosOcupadosUrl;
    window.logoutUrl = urls.logoutUrl;
}
