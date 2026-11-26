/* Visor modal (lightbox) con zoom y arrastre para esquemáticos, pósteres y fotos */
(function () {
  'use strict';

  var caja = document.getElementById('lightbox');
  if (!caja) return;
  var escena = caja.querySelector('.lightbox__escena');
  var img = caja.querySelector('img');
  var titulo = caja.querySelector('.lightbox__titulo');
  var grupo = [], indice = 0, escala = 1, dx = 0, dy = 0, ultimoFoco = null;

  function aplicar() {
    img.style.transform = 'translate(' + dx + 'px,' + dy + 'px) scale(' + escala + ')';
  }
  function reiniciar() { escala = 1; dx = 0; dy = 0; aplicar(); }

  function mostrar(i) {
    indice = (i + grupo.length) % grupo.length;
    var fig = grupo[indice];
    var fuente = fig.querySelector('img');
    img.src = fig.getAttribute('data-grande') || fuente.src;
    img.alt = fuente.alt;
    var cap = fig.querySelector('figcaption');
    titulo.textContent = (cap ? cap.textContent : fuente.alt) + (grupo.length > 1 ? '  ·  ' + (indice + 1) + ' / ' + grupo.length : '');
    reiniciar();
  }

  function abrir(fig) {
    var galeria = fig.closest('.galeria') || fig.parentElement;
    grupo = Array.prototype.slice.call(galeria.querySelectorAll('.figura'));
    ultimoFoco = document.activeElement;
    caja.classList.add('abierto');
    caja.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    mostrar(grupo.indexOf(fig));
    caja.querySelector('[data-accion="cerrar"]').focus();
  }

  function cerrar() {
    caja.classList.remove('abierto');
    caja.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    img.removeAttribute('src');
    if (ultimoFoco) ultimoFoco.focus();
  }

  function zoom(f) {
    escala = Math.min(Math.max(escala * f, 1), 6);
    if (escala === 1) { dx = 0; dy = 0; }
    aplicar();
  }

  document.addEventListener('click', function (e) {
    var fig = e.target.closest('.figura');
    if (fig) { abrir(fig); return; }
    var abrirPoster = e.target.closest('[data-abrir-figura]');
    if (abrirPoster) {
      e.preventDefault();
      var destino = document.getElementById(abrirPoster.getAttribute('data-abrir-figura'));
      if (destino) abrir(destino);
    }
  });
  document.addEventListener('keydown', function (e) {
    var fig = e.target.closest && e.target.closest('.figura');
    if (fig && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); abrir(fig); return; }
    if (!caja.classList.contains('abierto')) return;
    if (e.key === 'Escape') cerrar();
    if (e.key === 'ArrowRight') mostrar(indice + 1);
    if (e.key === 'ArrowLeft') mostrar(indice - 1);
    if (e.key === '+' || e.key === '=') zoom(1.25);
    if (e.key === '-') zoom(0.8);
  });

  caja.addEventListener('click', function (e) {
    var b = e.target.closest('[data-accion]');
    if (b) {
      var a = b.getAttribute('data-accion');
      if (a === 'cerrar') cerrar();
      if (a === 'mas') zoom(1.3);
      if (a === 'menos') zoom(0.77);
      if (a === 'restablecer') reiniciar();
      if (a === 'siguiente') mostrar(indice + 1);
      if (a === 'anterior') mostrar(indice - 1);
      return;
    }
    if (e.target === escena) cerrar();
  });

  escena.addEventListener('wheel', function (e) {
    e.preventDefault();
    zoom(e.deltaY < 0 ? 1.15 : 0.87);
  }, { passive: false });

  img.addEventListener('dblclick', function () { escala > 1 ? reiniciar() : zoom(2.2); });

  // Arrastre con puntero (ratón o táctil) cuando hay zoom
  var arrastrando = false, x0 = 0, y0 = 0;
  escena.addEventListener('pointerdown', function (e) {
    if (escala === 1 || e.target !== img) return;
    arrastrando = true; x0 = e.clientX - dx; y0 = e.clientY - dy;
    escena.classList.add('arrastrando');
    escena.setPointerCapture(e.pointerId);
  });
  escena.addEventListener('pointermove', function (e) {
    if (!arrastrando) return;
    dx = e.clientX - x0; dy = e.clientY - y0;
    img.style.transition = 'none'; aplicar();
  });
  escena.addEventListener('pointerup', function () {
    arrastrando = false; img.style.transition = '';
    escena.classList.remove('arrastrando');
  });
})();
