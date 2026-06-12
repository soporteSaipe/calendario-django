/**
 * MUNDIAL-ARGENTINA.JS - Efectos temporales Mundial 2026
 * Para revertir: eliminar este archivo y quitar su referencia en base.html
 */
(function () {
  'use strict';

  var CONFETTI_COLORS = ['#75AADB', '#FFFFFF', '#F5C518', '#1B3A6E', '#C8DDEF'];
  var CONFETTI_DURATION = 4000;
  var CONFETTI_COUNT = 80;
  var prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

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

    var ball = document.createElement('div');
    ball.className = 'mundial-float-ball';
    ball.setAttribute('aria-hidden', 'true');
    ball.title = 'Mundial Argentina 2026';
    ball.textContent = '\u26BD';
    document.body.appendChild(ball);
  }

  function init() {
    createFloatingBall();
    createConfetti();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
