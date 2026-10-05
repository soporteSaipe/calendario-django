document.addEventListener('DOMContentLoaded', () => {
  const form = document.querySelector('form[data-validate]');
  const submit = form?.querySelector('button[type="submit"]');
  if (!form || !submit) return;
  form.addEventListener('submit', () => {
    submit.disabled = true;
    submit.textContent = 'Iniciando sesión…';
  });
  window.addEventListener('pageshow', () => { submit.disabled = false; submit.textContent = 'Iniciar sesión'; });
});
