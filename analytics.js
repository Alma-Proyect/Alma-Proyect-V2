// analytics.js
// Analítica sin cookies con Umami Cloud. Es el ÚNICO sitio donde hay que poner el ID.
// Se carga igual en la portada (index.html), la app (app.html / /tu-espacio) y beta-aviso.html.
(function () {
  // Umami: Settings > Websites > almaproyect.com > Edit > "Website ID" (no es un secreto: va en el código público)
  var WEBSITE_ID = '5064216c-382d-4d55-901b-2b9495df8d7b';
  // Solo cuenta visitas reales: no cuenta pruebas en local ni vistas previas de Netlify
  var DOMINIOS = 'almaproyect.com,www.almaproyect.com';

  var activo = !!WEBSITE_ID && WEBSITE_ID.indexOf('PEGA-AQUI') !== 0;

  if (activo) {
    var s = document.createElement('script');
    s.defer = true;
    s.src = 'https://cloud.umami.is/script.js';
    s.setAttribute('data-website-id', WEBSITE_ID);
    s.setAttribute('data-domains', DOMINIOS);
    document.head.appendChild(s);
  }

  // Evento propio. Seguro aunque Umami no haya cargado todavía o esté bloqueado:
  // reintenta unos segundos y, si no puede, no hace nada (nunca rompe la página).
  window.almaTrack = function (nombre, datos) {
    if (!activo) return;
    var intentos = 0;
    (function enviar() {
      if (window.umami && typeof window.umami.track === 'function') {
        try { datos ? window.umami.track(nombre, datos) : window.umami.track(nombre); } catch (e) {}
      } else if (intentos++ < 20) {
        setTimeout(enviar, 250);
      }
    })();
  };
})();
