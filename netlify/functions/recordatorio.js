// netlify/functions/recordatorio.js
// Devuelve una cita de calendario (.ics) para que vuelva a Alma al día siguiente.
// No guarda nada: solo recibe la hora de inicio y devuelve el archivo.
// El título es neutro a propósito ("Un rato para ti"): su calendario puede
// verlo otra persona, y no tiene por qué saber qué es.

const URL_APP = "https://almaproyect.com/tu-espacio";
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const DURACION_MIN = 20;

function fechaICS(d) {
  // 20261112T201500Z
  return d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
}

function escaparICS(t) {
  return String(t)
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\r?\n/g, "\\n");
}

exports.handler = async function (event) {
  if (event.httpMethod !== "GET") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  const params = event.queryStringParameters || {};
  const ahora = new Date();
  const pedida = new Date(params.inicio || "");
  // Solo se acepta una hora entre ahora y dentro de tres días; si no, mañana a esta hora.
  const valida =
    !isNaN(pedida.getTime()) &&
    pedida.getTime() > ahora.getTime() &&
    pedida.getTime() < ahora.getTime() + 3 * 24 * 60 * 60 * 1000;
  const inicio = valida ? pedida : new Date(ahora.getTime() + 24 * 60 * 60 * 1000);
  const fin = new Date(inicio.getTime() + DURACION_MIN * 60 * 1000);

  // Con la llave, el enlace abre SU recorrido en cualquier navegador.
  // El identificador va en el #: el navegador no lo envía al abrir la página.
  const llave = UUID_RE.test(String(params.llave || "")) ? String(params.llave) : null;
  const enlace = llave ? `${URL_APP}#llave=${llave}` : URL_APP;
  const descripcion = llave
    ? "Alma te espera. Este enlace abre tu recorrido, no lo compartas:\n" + enlace
    : "Alma te espera.\n" + enlace;

  const uid = `${Date.now()}-${Math.random().toString(36).slice(2)}@almaproyect.com`;

  const lineas = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Alma Proyect//Recordatorio//ES",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${uid}`,
    `DTSTAMP:${fechaICS(ahora)}`,
    `DTSTART:${fechaICS(inicio)}`,
    `DTEND:${fechaICS(fin)}`,
    `SUMMARY:${escaparICS("Un rato para ti")}`,
    `DESCRIPTION:${escaparICS(descripcion)}`,
    `URL:${enlace}`,
    "BEGIN:VALARM",
    "ACTION:DISPLAY",
    `DESCRIPTION:${escaparICS("Un rato para ti")}`,
    "TRIGGER:PT0M",
    "END:VALARM",
    "END:VEVENT",
    "END:VCALENDAR",
  ];

  return {
    statusCode: 200,
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": 'attachment; filename="un-rato-para-ti.ics"',
      "Cache-Control": "no-store",
    },
    body: lineas.join("\r\n") + "\r\n",
  };
};
