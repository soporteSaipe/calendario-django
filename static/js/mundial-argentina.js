/**
 * MUNDIAL-ARGENTINA.JS - Efectos temporales Mundial 2026
 * Para revertir: eliminar este archivo y quitar su referencia en base.html
 */
(function () {
  'use strict';

  var CONFETTI_COLORS = ['#75AADB', '#FFFFFF', '#F5C518', '#1B3A6E', '#C8DDEF'];
  var CONFETTI_DURATION = 4000;
  var CONFETTI_COUNT = 80;
  var STORAGE_KEY = 'mundial-fondo';
  var LABEL_DURATION = 1800;
  var prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var TEMAS = [
    { clase: 'fondo-camiseta', nombre: '⚽ Camiseta Argentina' },
    { clase: 'fondo-estadio', nombre: '🌙 Estadio Nocturno' },
    { clase: 'fondo-cielo', nombre: '🌤 Cielo de estadio' }
  ];

  var labelTimeout = null;

  function getTemaActual() {
    var guardado = localStorage.getItem(STORAGE_KEY);
    return TEMAS.findIndex(function (t) {
      return t.clase === guardado;
    });
  }

  function aplicarTema(idx) {
    TEMAS.forEach(function (t) {
      document.body.classList.remove(t.clase);
    });
    document.body.classList.add(TEMAS[idx].clase);
    localStorage.setItem(STORAGE_KEY, TEMAS[idx].clase);
  }

  function mostrarLabel(nombre) {
    var label = document.querySelector('.mundial-theme-label');
    if (!label) {
      label = document.createElement('div');
      label.className = 'mundial-theme-label';
      label.setAttribute('aria-live', 'polite');
      document.body.appendChild(label);
    }

    label.textContent = nombre;
    label.classList.add('visible');

    if (labelTimeout) {
      clearTimeout(labelTimeout);
    }

    labelTimeout = setTimeout(function () {
      label.classList.remove('visible');
    }, LABEL_DURATION);
  }

  function ciclarTema() {
    var actual = getTemaActual();
    var siguiente = (actual + 1) % TEMAS.length;
    aplicarTema(siguiente);
    mostrarLabel(TEMAS[siguiente].nombre);
  }

  function createConfetti() {
    if (prefersReducedMotion) return;

    var canvas = document.createElement('canvas');
    canvas.id = 'mundial-confetti-canvas';
    document.body.appendChild(canvas);

    var ctx = canvas.getContext('2d');
    var particles = [];
    var startTime = Date.now();

    function resize() {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    }

    resize();
    window.addEventListener('resize', resize);

    for (var i = 0; i < CONFETTI_COUNT; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height * -0.5 - 20,
        w: Math.random() * 8 + 4,
        h: Math.random() * 6 + 3,
        color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
        rotation: Math.random() * 360,
        rotationSpeed: (Math.random() - 0.5) * 8,
        speedX: (Math.random() - 0.5) * 3,
        speedY: Math.random() * 3 + 2,
        opacity: Math.random() * 0.5 + 0.5
      });
    }

    function animate() {
      var elapsed = Date.now() - startTime;
      if (elapsed > CONFETTI_DURATION) {
        canvas.remove();
        window.removeEventListener('resize', resize);
        return;
      }

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      var fadeOut = elapsed > CONFETTI_DURATION - 800
        ? (CONFETTI_DURATION - elapsed) / 800
        : 1;

      particles.forEach(function (p) {
        p.x += p.speedX;
        p.y += p.speedY;
        p.rotation += p.rotationSpeed;
        p.speedY += 0.05;

        ctx.save();
        ctx.globalAlpha = p.opacity * fadeOut;
        ctx.translate(p.x, p.y);
        ctx.rotate((p.rotation * Math.PI) / 180);
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
        ctx.restore();
      });

      requestAnimationFrame(animate);
    }

    requestAnimationFrame(animate);
  }

  function createFloatingBall() {
    if (document.querySelector('.mundial-float-ball')) return;

    var ball = document.createElement('button');
    ball.type = 'button';
    ball.className = 'mundial-float-ball';
    ball.setAttribute('aria-label', 'Cambiar fondo del tema Mundial');
    ball.title = 'Clic para cambiar el fondo';
    ball.textContent = '\u26BD';

    ball.addEventListener('click', function () {
      ciclarTema();
      ball.style.animation = 'none';
      setTimeout(function () {
        ball.style.animation = '';
      }, 300);
    });

    document.body.appendChild(ball);
  }

  function init() {
    var idx = getTemaActual();
    aplicarTema(idx < 0 ? 0 : idx);
    createFloatingBall();
    createConfetti();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
