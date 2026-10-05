/* A single set of controls, synchronized with FullCalendar's actual visible range. */
CalendarioApp.CalendarViews = {
  state: { calendarInstance: null, currentView: 'timeGridWeek' },
  init: function() {
    if (document.getElementById('calendarViewControls')) return;
    const container = document.querySelector('.calendar-container');
    if (!container) return;
    container.insertAdjacentHTML('beforebegin', `
      <div class="calendar-view-controls" id="calendarViewControls">
        <div class="navigation-controls">
          <button type="button" class="nav-btn" id="prevBtn" aria-label="Período anterior" title="Período anterior"><i class="fas fa-chevron-left" aria-hidden="true"></i></button>
          <h2 class="current-view-title" id="currentViewTitle" aria-live="polite">Calendario</h2>
          <button type="button" class="nav-btn" id="nextBtn" aria-label="Período siguiente" title="Período siguiente"><i class="fas fa-chevron-right" aria-hidden="true"></i></button>
          <button type="button" class="nav-btn today-btn" id="todayBtn">Hoy</button>
        </div>
        <div class="view-selector" role="group" aria-label="Vista del calendario">
          <button type="button" class="view-option" data-view="timeGridDay" aria-pressed="false">Día</button>
          <button type="button" class="view-option" data-view="timeGridWeek" aria-pressed="false">Semana</button>
          <button type="button" class="view-option" data-view="dayGridMonth" aria-pressed="false">Mes</button>
        </div>
      </div>`);
    document.getElementById('prevBtn').addEventListener('click', () => this.navigateView('prev'));
    document.getElementById('nextBtn').addEventListener('click', () => this.navigateView('next'));
    document.getElementById('todayBtn').addEventListener('click', () => this.navigateView('today'));
    document.querySelectorAll('.view-option').forEach(button => button.addEventListener('click', () => this.changeView(button.dataset.view)));
    this.sync();
  },
  integrateWithCalendar: function(calendar) {
    if (this.state.calendarInstance === calendar) return;
    this.state.calendarInstance = calendar;
    calendar.on('datesSet', () => this.sync());
    this.sync();
  },
  sync: function() {
    const calendar = this.state.calendarInstance;
    if (!calendar) return;
    this.state.currentView = calendar.view.type;
    const title = document.getElementById('currentViewTitle');
    if (title) title.textContent = calendar.view.title;
    document.querySelectorAll('.view-option').forEach(button => {
      const active = button.dataset.view === calendar.view.type;
      button.classList.toggle('active', active);
      button.setAttribute('aria-pressed', String(active));
    });
  },
  changeView: function(view) { this.state.calendarInstance?.changeView(view); },
  navigateView: function(direction) { this.state.calendarInstance?.[direction](); },
  getCurrentView: function() { return this.state.currentView; },
  getCurrentDate: function() { return this.state.calendarInstance?.getDate(); }
};
document.addEventListener('DOMContentLoaded', () => CalendarioApp.CalendarViews.init());
