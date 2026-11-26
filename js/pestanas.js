/* Navegación por pestañas con soporte de hash (#inicio, #proyecto-1 ...) */
(function () {
  'use strict';

  var lista = document.querySelector('.pestanas__lista');
  var indicador = document.querySelector('.pestanas__indicador');
  var pestanas = Array.prototype.slice.call(document.querySelectorAll('.pestana'));
  var paneles = Array.prototype.slice.call(document.querySelectorAll('.panel'));
  var ids = pestanas.map(function (p) { return p.getAttribute('aria-controls'); });

  function moverIndicador(pestana) {
    if (!indicador || !pestana) return;
    indicador.style.width = pestana.offsetWidth + 'px';
    indicador.style.transform = 'translateX(' + pestana.offsetLeft + 'px)';
  }

  function activar(id, opciones) {
    opciones = opciones || {};
    if (ids.indexOf(id) === -1) id = 'inicio';

    pestanas.forEach(function (p) {
      var sel = p.getAttribute('aria-controls') === id;
      p.setAttribute('aria-selected', sel ? 'true' : 'false');
      p.tabIndex = sel ? 0 : -1;
      if (sel) {
        moverIndicador(p);
        // Desplaza la barra en móviles para que la pestaña activa quede visible
        var izq = p.offsetLeft - (lista.clientWidth - p.offsetWidth) / 2;
        lista.scrollTo({ left: Math.max(0, izq), behavior: opciones.instantaneo ? 'auto' : 'smooth' });
      }
    });

    paneles.forEach(function (panel) {
      var activo = panel.id === id;
      panel.classList.toggle('activo', activo);
      panel.hidden = !activo;
    });

    if (!opciones.sinHash && location.hash !== '#' + id) {
      history.pushState(null, '', '#' + id);
    }
    if (!opciones.sinScroll) window.scrollTo({ top: 0, behavior: opciones.instantaneo ? 'auto' : 'smooth' });

    document.dispatchEvent(new CustomEvent('panel:activado', { detail: { id: id } }));
  }

  pestanas.forEach(function (p, i) {
    p.addEventListener('click', function () { activar(p.getAttribute('aria-controls')); });
    p.addEventListener('keydown', function (e) {
      var destino = null;
      if (e.key === 'ArrowRight') destino = pestanas[(i + 1) % pestanas.length];
      if (e.key === 'ArrowLeft') destino = pestanas[(i - 1 + pestanas.length) % pestanas.length];
      if (e.key === 'Home') destino = pestanas[0];
      if (e.key === 'End') destino = pestanas[pestanas.length - 1];
      if (destino) {
        e.preventDefault();
        destino.focus();
        activar(destino.getAttribute('aria-controls'));
      }
    });
  });

  // Enlaces internos (tarjetas de acceso rápido, botones "ir al proyecto")
  document.addEventListener('click', function (e) {
    var enlace = e.target.closest('[data-ir]');
    if (!enlace) return;
    e.preventDefault();
    activar(enlace.getAttribute('data-ir'));
  });

  window.addEventListener('popstate', function () {
    activar(location.hash.replace('#', '') || 'inicio', { sinHash: true });
  });
  window.addEventListener('resize', function () {
    moverIndicador(document.querySelector('.pestana[aria-selected="true"]'));
  });

  activar(location.hash.replace('#', '') || 'inicio', { sinHash: true, instantaneo: true, sinScroll: true });
  // Recalcula el indicador cuando cargan las fuentes
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(function () {
      moverIndicador(document.querySelector('.pestana[aria-selected="true"]'));
    });
  }
})();
