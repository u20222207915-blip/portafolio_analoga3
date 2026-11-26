/* Señal analógica animada del hero, scroll reveal, contadores, tema y "volver arriba" */
(function () {
  'use strict';

  var reducido = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- Tema claro / oscuro ---------- */
  var raiz = document.documentElement;
  var botonTema = document.getElementById('boton-tema');
  try {
    var guardado = localStorage.getItem('tema-portafolio');
    if (guardado) raiz.setAttribute('data-tema', guardado);
  } catch (e) { /* almacenamiento no disponible */ }
  if (botonTema) {
    botonTema.addEventListener('click', function () {
      var nuevo = raiz.getAttribute('data-tema') === 'oscuro' ? 'claro' : 'oscuro';
      raiz.setAttribute('data-tema', nuevo);
      botonTema.setAttribute('aria-pressed', nuevo === 'oscuro' ? 'true' : 'false');
      try { localStorage.setItem('tema-portafolio', nuevo); } catch (e) { }
    });
  }

  /* ---------- Señal analógica en Canvas ---------- */
  var canvas = document.getElementById('senal-hero');
  if (canvas && canvas.getContext) {
    var ctx = canvas.getContext('2d');
    var ancho = 0, alto = 0, dpr = Math.min(window.devicePixelRatio || 1, 2), t = 0, animando = true;

    function ajustar() {
      var r = canvas.getBoundingClientRect();
      ancho = r.width; alto = r.height;
      canvas.width = ancho * dpr; canvas.height = alto * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    var trazos = [
      { amp: 0.10, frec: 1.6, vel: 0.55, fase: 0, color: 'rgba(223,212,166,0.55)', grosor: 2 },
      { amp: 0.06, frec: 3.1, vel: -0.8, fase: 1.3, color: 'rgba(223,212,166,0.22)', grosor: 1.4 },
      { amp: 0.14, frec: 0.9, vel: 0.35, fase: 2.1, color: 'rgba(169,27,35,0.55)', grosor: 2.2 }
    ];

    function dibujar() {
      ctx.clearRect(0, 0, ancho, alto);
      // retícula de osciloscopio
      ctx.strokeStyle = 'rgba(223,212,166,0.07)';
      ctx.lineWidth = 1;
      var paso = 48;
      for (var x = 0; x < ancho; x += paso) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, alto); ctx.stroke(); }
      for (var y = 0; y < alto; y += paso) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(ancho, y); ctx.stroke(); }

      var base = alto * 0.72;
      trazos.forEach(function (s, i) {
        ctx.beginPath();
        ctx.strokeStyle = s.color; ctx.lineWidth = s.grosor;
        for (var px = 0; px <= ancho; px += 4) {
          var k = px / ancho * Math.PI * 2;
          var env = 0.6 + 0.4 * Math.sin(k * 0.5 + t * 0.2);
          var yy = base - (i * 18) + Math.sin(k * s.frec * 2 + t * s.vel + s.fase) * alto * s.amp * env;
          if (px === 0) ctx.moveTo(px, yy); else ctx.lineTo(px, yy);
        }
        ctx.stroke();
      });

      // punto de "barrido" del osciloscopio
      var bx = (t * 60) % (ancho + 200) - 100;
      var g = ctx.createLinearGradient(bx - 120, 0, bx, 0);
      g.addColorStop(0, 'rgba(223,212,166,0)');
      g.addColorStop(1, 'rgba(223,212,166,0.10)');
      ctx.fillStyle = g; ctx.fillRect(bx - 120, 0, 120, alto);
    }

    function bucle() {
      if (!animando) return;
      t += 0.016;
      dibujar();
      requestAnimationFrame(bucle);
    }

    ajustar();
    window.addEventListener('resize', function () { ajustar(); if (reducido) dibujar(); });
    if (reducido) { dibujar(); }
    else {
      // Pausa la animación cuando el hero no es visible (rendimiento)
      if ('IntersectionObserver' in window) {
        new IntersectionObserver(function (ent) {
          var vis = ent[0].isIntersecting;
          if (vis && !animando) { animando = true; bucle(); }
          if (!vis) animando = false;
        }).observe(canvas);
      }
      bucle();
    }
    document.addEventListener('panel:activado', function (e) {
      if (e.detail.id === 'inicio') { ajustar(); dibujar(); }
    });
  }

  /* ---------- Contadores animados ---------- */
  function animarContador(el) {
    var meta = parseFloat(el.getAttribute('data-contador'));
    var dec = parseInt(el.getAttribute('data-decimales') || '0', 10);
    var prefijo = el.getAttribute('data-prefijo') || '';
    if (reducido) { el.textContent = prefijo + meta.toFixed(dec).replace('.', ','); return; }
    var inicio = null, dur = 1400;
    function paso(ts) {
      if (!inicio) inicio = ts;
      var p = Math.min((ts - inicio) / dur, 1);
      var e = 1 - Math.pow(1 - p, 3);
      el.textContent = prefijo + (meta * e).toFixed(dec).replace('.', ',');
      if (p < 1) requestAnimationFrame(paso);
    }
    requestAnimationFrame(paso);
  }

  /* ---------- Scroll reveal ---------- */
  var observador = null;
  if ('IntersectionObserver' in window && !reducido) {
    observador = new IntersectionObserver(function (entradas) {
      entradas.forEach(function (en) {
        if (!en.isIntersecting) return;
        en.target.classList.add('visible');
        if (en.target.hasAttribute('data-contador')) animarContador(en.target);
        en.target.querySelectorAll && en.target.querySelectorAll('[data-contador]').forEach(animarContador);
        observador.unobserve(en.target);
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
  }

  function registrar(ambito) {
    var els = (ambito || document).querySelectorAll('.revelar:not(.visible)');
    els.forEach(function (el, i) {
      if (!observador) {
        el.classList.add('visible');
        el.querySelectorAll('[data-contador]').forEach(animarContador);
        return;
      }
      el.style.transitionDelay = Math.min(i % 6, 5) * 60 + 'ms';
      observador.observe(el);
    });
  }
  registrar();
  document.addEventListener('panel:activado', function (e) {
    registrar(document.getElementById(e.detail.id));
  });

  /* ---------- Volver arriba ---------- */
  var arriba = document.getElementById('volver-arriba');
  if (arriba) {
    window.addEventListener('scroll', function () {
      arriba.classList.toggle('visible', window.scrollY > 600);
    }, { passive: true });
    arriba.addEventListener('click', function () { window.scrollTo({ top: 0, behavior: reducido ? 'auto' : 'smooth' }); });
  }
})();
