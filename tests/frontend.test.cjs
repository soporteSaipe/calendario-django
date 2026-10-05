// Run with: node --test tests/frontend.test.cjs
// Evaluate the shipped scripts in an isolated browser-shaped context. No npm
// dependencies, real timers, network requests or production services are used.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

function browser(...files) {
  const elements = new Map();
  const timers = [];
  const notifications = [];
  const noop = () => {};
  const context = vm.createContext({
    console: { log: noop, error: noop, warn: noop, info: noop },
    URLSearchParams, DOMException,
    navigator: { userAgent: 'regression-tests' },
    location: { href: 'https://calendar.example.test/', hostname: 'calendar.example.test', search: '' },
    document: {
      addEventListener: noop,
      getElementById: id => elements.get(id) || null,
      createElement: () => ({}),
      head: { appendChild: noop },
      documentElement: { getAttribute: () => null },
    },
    addEventListener: noop,
    setTimeout: callback => { timers.push(callback); return timers.length; },
    localStorage: { getItem: () => null, setItem: noop },
    bootstrap: { Modal: class { show() {} } },
    fetch: () => { throw new Error('Unexpected network request'); },
    CalendarioController: { register: noop },
    CalendarioApp: {
      Core: { Logger: { debug: noop, warn: noop, error: noop } },
      Notifications: { error: message => notifications.push(message) },
    },
  });
  context.window = context;
  for (const file of files) {
    vm.runInContext(fs.readFileSync(path.join(__dirname, '../static/js', file), 'utf8'), context, { filename: file });
  }
  return { context, elements, timers, notifications, app: context.CalendarioApp };
}

test('state updates preserve a circular calendar instance and isolate plain data', () => {
  const { context, app } = browser('calendario-state.js');
  // Construct in the script realm so the plain-object prototype matches it.
  const source = vm.runInContext(`(() => {
    class Calendar { constructor() { this.self = this; } }
    const data = { nested: { value: 1 }, calendar: new Calendar(), date: new Date('2026-10-05') };
    data.self = data;
    data.items = [data.nested, data];
    return data;
  })()`, context);
  const cloned = app.StateManager.deepClone(source);
  assert.notEqual(cloned, source);
  assert.equal(cloned.self, cloned);
  assert.equal(cloned.items[1], cloned);
  assert.equal(cloned.items[0], cloned.nested);
  assert.equal(cloned.calendar, source.calendar);
  assert.notEqual(cloned.date, source.date);
  assert.equal(cloned.date.getTime(), source.date.getTime());
  cloned.nested.value = 2;
  assert.equal(source.nested.value, 1);

  app.StateManager.actions.setCalendarInstance(source.calendar);
  app.StateManager.actions.setSalaFilter('7');
  app.StateManager.actions.setGlobalLoading(true);
  assert.equal(app.StateManager.getState('calendar.calendarInstance'), source.calendar);
  assert.equal(app.StateManager.getState('salas.currentSala'), '7');
});

test('a network failure is recorded and notified once after error/state integration', () => {
  const { context, app, notifications } = browser(
    'calendario-state.js', 'calendario-errors.js', 'calendario-integration.js'
  );
  app.ErrorHandler.config.enableLogging = false;
  app.Integration.integrationStatus.errors = true;
  app.Integration.integrationStatus.state = true;
  app.Integration.integrateErrorHandlerWithState();

  // A VM timeout also catches an accidentally reintroduced error feedback loop.
  vm.runInContext(`CalendarioApp.ErrorHandler.specific.networkError(new TypeError('fetch failed'), '/api/reservas/')`, context, { timeout: 1000 });
  assert.equal(app.StateManager.getState('errors.recent').length, 1);
  assert.equal(app.StateManager.getState('errors.recent')[0].message, 'fetch failed');
  assert.equal(app.ErrorHandler.errorCounts.get('NETWORK_ERROR'), 1);
  assert.equal(notifications.length, 1);
});

test('a timed notification expires without calling a nonexistent state method', () => {
  const { app, timers } = browser('calendario-state.js');
  app.StateManager.actions.addNotification({ message: 'Reserva guardada', duration: 100 });
  assert.equal(app.StateManager.getState('ui.notifications').length, 1);
  assert.equal(timers.length, 1);
  timers[0]();
  assert.equal(app.StateManager.getState('ui.notifications').length, 0);
});

test('reservation modal renders untrusted fields as literal content', () => {
  const { app, elements } = browser('calendario-main.js');
  const label = { textContent: '', innerHTML: '' };
  const details = { innerHTML: '' };
  elements.set('reservaModalDetalles', {});
  elements.set('reservaModalDetallesLabel', label);
  elements.set('reservaDetailsContent', details);
  const payload = '<img src=x onerror="alert(1)"> & \'quoted\'';
  const event = {
    title: payload, start: new Date('2026-10-05T12:00:00Z'), end: new Date('2026-10-05T13:00:00Z'),
    extendedProps: { usuario: payload, sala: payload, descripcion: payload, estado: payload },
  };
  app.Calendar.handleEventClick({ event });
  assert.equal(label.textContent, payload);
  assert.equal(label.innerHTML, '');
  assert.ok(!details.innerHTML.includes('<img'));
  assert.equal(details.innerHTML.split('&lt;img').length - 1, 5);
  assert.ok(details.innerHTML.includes('&quot;alert(1)&quot;'));
  assert.ok(details.innerHTML.includes('&amp; &#39;quoted&#39;'));
});

test('room details escape API content and reject CSS attribute injection', async () => {
  const { context, app, elements } = browser('calendario-main.js');
  const content = { innerHTML: '' };
  elements.set('salaDetailsContent', content);
  const payload = '<svg onload="alert(1)"></svg>';
  const color = '#000000;" onmouseover="alert(1)';
  context.fetch = async () => ({ ok: true, json: async () => ({
    nombre: payload, capacidad: payload, descripcion_detallada: payload,
    horario_uso: payload, caracteristicas: [payload], color,
  }) });
  app.Calendar.loadSalaDetails({ id: 1 });
  // The UI method intentionally does not return its promise chain.
  await new Promise(resolve => setImmediate(resolve));
  assert.ok(!content.innerHTML.includes('<svg'));
  assert.equal(content.innerHTML.split('&lt;svg').length - 1, 5);
  assert.ok(!content.innerHTML.includes('onmouseover='));
  assert.ok(content.innerHTML.includes('background-color: #445371;'));
  assert.equal(app.Calendar.safeColor('#aA00ff'), '#aA00ff');
});

test('conflict validation sends the vehicle return date and retains server conflicts', async () => {
  const { context, app } = browser('calendario-main.js');
  const urls = [];
  context.validarConflictoUrl = '/custom/validar/';
  context.fetch = async url => {
    urls.push(new URL(url, context.location.href));
    return { ok: false, json: async () => ({
      validation_errors: { conflicts: [{ message: 'El vehículo está reservado.' }] },
    }) };
  };
  const conflicts = await app.Calendar.validarConflictos('3', '2026-10-05', '09:00', '08:00', '2026-10-07');
  assert.equal(urls[0].pathname, '/custom/validar/');
  assert.equal(urls[0].searchParams.get('fecha_vuelta'), '2026-10-07');
  assert.equal(urls[0].searchParams.get('hora_fin'), '08:00');
  assert.equal(conflicts[0].message, 'El vehículo está reservado.');
  await app.Calendar.validarConflictos('1', '2026-10-05', '09:00', '10:00');
  assert.equal(urls[1].searchParams.has('fecha_vuelta'), false);
});

test('vehicle edit preserves an earlier return clock time only when its date is later', () => {
  const { context, elements } = browser('mis-reservas.js');
  const errors = [];
  context.mostrarError = message => errors.push(message);
  const departure = new Date();
  departure.setDate(departure.getDate() + 1);
  const arrival = new Date(departure);
  arrival.setDate(arrival.getDate() + 1);
  const dateString = date => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  const options = ['08:00', '09:00', '10:00'].map(value => ({ value, style: { display: 'none' } }));
  elements.set('editRecurso', {
    value: '3', selectedIndex: 0,
    options: [{ getAttribute: () => 'vehiculo' }],
  });
  elements.set('editFecha', { value: dateString(departure) });
  elements.set('editFechaVuelta', { value: dateString(arrival) });
  elements.set('editHoraInicio', { value: '09:00' });
  elements.set('editHoraFin', { value: '08:00', querySelectorAll: () => options });
  elements.set('editResponsable', { value: 'Operador' });
  elements.set('editDestino', { value: 'Sucursal' });

  context.validarHoraFinEdicion();
  assert.equal(elements.get('editHoraFin').value, '08:00');
  assert.ok(options.every(option => option.style.display === 'block'));
  assert.equal(context.validarFormularioEdicion(), true);
  assert.equal(errors.length, 0);

  elements.get('editFechaVuelta').value = dateString(departure);
  assert.equal(context.validarFormularioEdicion(), false);
  assert.match(errors.at(-1), /regreso deben ser posteriores a la salida/);

  elements.get('editHoraFin').value = '09:00';
  assert.equal(context.validarFormularioEdicion(), false);
  elements.get('editHoraFin').value = '10:00';
  assert.equal(context.validarFormularioEdicion(), true);
});

test('room edit still clears and hides an end time before its start time', () => {
  const { context, elements } = browser('mis-reservas.js');
  const options = ['08:00', '09:00', '10:00'].map(value => ({ value, style: {} }));
  elements.set('editRecurso', {
    value: '1', selectedIndex: 0,
    options: [{ getAttribute: () => 'sala' }],
  });
  elements.set('editHoraInicio', { value: '09:00' });
  elements.set('editHoraFin', { value: '08:00', querySelectorAll: () => options });
  context.validarHoraFinEdicion();
  assert.equal(elements.get('editHoraFin').value, '');
  assert.equal(options[0].style.display, 'none');
  assert.equal(options[1].style.display, 'none');
  assert.equal(options[2].style.display, 'block');
});
