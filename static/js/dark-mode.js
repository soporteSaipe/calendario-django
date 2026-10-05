/* Apply before paint; storage may be unavailable in private browsing. */
(() => {
  const key = 'calendario-theme';
  const system = window.matchMedia('(prefers-color-scheme: dark)');
  let preference = 'system';
  try { preference = localStorage.getItem(key) || 'system'; } catch (_) {}
  if (!['system', 'light', 'dark'].includes(preference)) preference = 'system';
  function apply() {
    const theme = preference === 'system' ? (system.matches ? 'dark' : 'light') : preference;
    document.documentElement.dataset.theme = theme;
    document.documentElement.dataset.bsTheme = theme;
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', theme === 'dark' ? '#17191F' : '#FDF7ED');
  }
  apply();
  system.addEventListener('change', apply);
  document.addEventListener('DOMContentLoaded', () => {
    const selector = document.getElementById('themePreference');
    if (!selector) return;
    selector.value = preference;
    selector.addEventListener('change', () => {
      preference = selector.value;
      try { localStorage.setItem(key, preference); } catch (_) {}
      apply();
    });
  });
})();
