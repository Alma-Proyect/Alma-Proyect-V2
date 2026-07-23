// cookies.js — consentimiento de cookies para Alma Proyect
//
// Google Analytics NO se carga hasta que la usuaria acepta. Antes de eso solo
// existe una cola en memoria (dataLayer), que no es una cookie ni sale del
// navegador: si acepta más tarde, los eventos ya registrados se envían
// entonces; si no acepta, se pierden y no ha salido nada.
//
// Va en la misma carpeta que los HTML, y se carga desde el <head> SIN defer,
// para que gtag() exista antes de que cualquier página lo llame.

(function () {
  var ID_ANALITICA = 'G-P3FN83B6K5';
  var CLAVE = 'alma_cookies';
  // El aviso no aparece en el primer segundo: competir con la pantalla de
  // entrada es la forma más rápida de perder a alguien. Nada se carga
  // mientras tanto, así que esperar es legítimo — solo se retrasa preguntar.
  var RETRASO_MS = 12000;

  // La cola existe siempre: recoger no es rastrear, y sin esto las llamadas
  // a gtag() repartidas por las páginas darían error.
  window.dataLayer = window.dataLayer || [];
  window.gtag = window.gtag || function () { window.dataLayer.push(arguments); };

  function leer() {
    try { return localStorage.getItem(CLAVE); } catch (e) { return null; }
  }
  function guardar(valor) {
    try { localStorage.setItem(CLAVE, valor); } catch (e) {}
  }

  function cargarAnalitica() {
    if (document.getElementById('ga-script')) return;
    var s = document.createElement('script');
    s.id = 'ga-script';
    s.async = true;
    s.src = 'https://www.googletagmanager.com/gtag/js?id=' + ID_ANALITICA;
    document.head.appendChild(s);
    gtag('js', new Date());
    gtag('config', ID_ANALITICA, { anonymize_ip: true });
  }

  var decision = leer();
  if (decision === 'todas') { cargarAnalitica(); return; }
  if (decision === 'necesarias') return;

  function mostrarBanner() {
    if (document.getElementById('alma-cookies')) return;

    var caja = document.createElement('div');
    caja.id = 'alma-cookies';
    caja.setAttribute('role', 'dialog');
    caja.setAttribute('aria-label', 'Aviso de cookies');
    caja.style.cssText = [
      'position:fixed', 'left:0', 'right:0', 'bottom:0', 'z-index:99999',
      'background:#FDF8E7', 'border-top:1px solid rgba(139,111,94,0.25)',
      'box-shadow:0 -4px 24px rgba(42,37,32,0.10)',
      "font-family:'DM Sans','Jost',system-ui,sans-serif",
      'padding:1.1rem 1.3rem', 'display:flex', 'flex-wrap:wrap',
      'align-items:center', 'justify-content:center', 'gap:0.9rem',
      'transform:translateY(100%)', 'transition:transform 0.45s ease'
    ].join(';');

    var texto = document.createElement('p');
    texto.style.cssText = [
      'margin:0', 'flex:1 1 320px', 'min-width:240px', 'max-width:560px',
      'font-size:0.82rem', 'font-weight:300', 'line-height:1.65', 'color:#5a524a'
    ].join(';');
    texto.innerHTML = 'Usamos cookies de analítica para saber cuánta gente llega y ' +
      'dónde se pierde. Nada de publicidad ni de perfiles. Puedes decir que no y ' +
      'Alma funciona igual. <a href="privacidad.html" style="color:#8b6f5e;' +
      'text-decoration:underline;text-underline-offset:3px;">Más detalle</a>.';

    var botones = document.createElement('div');
    botones.style.cssText = 'display:flex;gap:0.6rem;flex:0 0 auto;flex-wrap:wrap';

    function boton(etiqueta, principal) {
      var b = document.createElement('button');
      b.type = 'button';
      b.textContent = etiqueta;
      b.style.cssText = [
        'font-family:inherit', 'font-size:0.8rem', 'font-weight:400',
        'letter-spacing:0.03em', 'padding:0.62rem 1.15rem', 'border-radius:9px',
        'cursor:pointer', 'transition:opacity 0.2s', 'min-height:42px',
        'white-space:nowrap',
        principal ? 'background:#2a2520;color:#f7f3ee;border:1px solid #2a2520'
                  : 'background:transparent;color:#5a524a;border:1px solid rgba(139,111,94,0.4)'
      ].join(';');
      b.addEventListener('mouseenter', function () { b.style.opacity = '0.82'; });
      b.addEventListener('mouseleave', function () { b.style.opacity = '1'; });
      return b;
    }

    function cerrar() {
      caja.style.transform = 'translateY(100%)';
      setTimeout(function () { if (caja.parentNode) caja.remove(); }, 500);
    }

    var rechazar = boton('Solo lo necesario', false);
    rechazar.addEventListener('click', function () {
      guardar('necesarias');
      cerrar();
    });

    var aceptar = boton('Aceptar', true);
    aceptar.addEventListener('click', function () {
      guardar('todas');
      cargarAnalitica();
      cerrar();
    });

    botones.appendChild(rechazar);
    botones.appendChild(aceptar);
    caja.appendChild(texto);
    caja.appendChild(botones);
    document.body.appendChild(caja);

    requestAnimationFrame(function () {
      requestAnimationFrame(function () { caja.style.transform = 'translateY(0)'; });
    });
  }

  function programar() { setTimeout(mostrarBanner, RETRASO_MS); }
  if (document.body) programar();
  else document.addEventListener('DOMContentLoaded', programar);
})();
