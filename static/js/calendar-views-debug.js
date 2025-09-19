/**
 * ARCHIVO DE DEBUG PARA VISTAS DE CALENDARIO
 * Este archivo ayuda a diagnosticar problemas con los controles de vista
 */

// Función de debug para verificar el estado
window.debugCalendarViews = function() {
  console.log('=== DEBUG CALENDAR VIEWS ===');
  console.log('CalendarioApp existe:', !!window.CalendarioApp);
  console.log('CalendarioApp.Calendar existe:', !!(window.CalendarioApp && CalendarioApp.Calendar));
  console.log('CalendarioApp.Calendar.calendar existe:', !!(window.CalendarioApp && CalendarioApp.Calendar && CalendarioApp.Calendar.calendar));
  console.log('CalendarioApp.CalendarViews existe:', !!(window.CalendarioApp && CalendarioApp.CalendarViews));
  
  if (window.CalendarioApp && CalendarioApp.CalendarViews) {
    console.log('Estado de CalendarViews:', CalendarioApp.CalendarViews.state);
    console.log('Instancia del calendario:', CalendarioApp.CalendarViews.state.calendarInstance);
  }
  
  const calendarElement = document.getElementById('calendar');
  console.log('Elemento calendar existe:', !!calendarElement);
  console.log('Elemento calendar._fullCalendar existe:', !!(calendarElement && calendarElement._fullCalendar));
  
  const viewControls = document.getElementById('calendarViewControls');
  console.log('Controles de vista existen:', !!viewControls);
  
  const viewOptions = document.querySelectorAll('.view-option');
  console.log('Opciones de vista encontradas:', viewOptions.length);
  
  console.log('=== FIN DEBUG ===');
};

// Función para probar cambio de vista manualmente
window.testCalendarView = function(view) {
  const friendlyNames = {
    'timeGridDay': 'Día',
    'timeGridWeek': 'Semana', 
    'dayGridMonth': 'Mes'
  };
  const friendlyName = friendlyNames[view] || view;
  console.log('Probando cambio a vista:', friendlyName);
  if (window.CalendarioApp && CalendarioApp.CalendarViews) {
    CalendarioApp.CalendarViews.changeView(view);
  } else {
    console.error('CalendarioApp.CalendarViews no está disponible');
  }
};

// Funciones de prueba con nombres correctos
window.testDayView = function() { testCalendarView('timeGridDay'); };
window.testWeekView = function() { testCalendarView('timeGridWeek'); };
window.testMonthView = function() { testCalendarView('dayGridMonth'); };

// Función para probar navegación
window.testCalendarNavigation = function(direction) {
  console.log('Probando navegación:', direction);
  if (window.CalendarioApp && CalendarioApp.CalendarViews) {
    CalendarioApp.CalendarViews.navigateView(direction);
  } else {
    console.error('CalendarioApp.CalendarViews no está disponible');
  }
};

// Auto-ejecutar debug después de 2 segundos
setTimeout(() => {
  console.log('Ejecutando debug automático...');
  if (typeof window.debugCalendarViews === 'function') {
    window.debugCalendarViews();
  }
}, 2000);
