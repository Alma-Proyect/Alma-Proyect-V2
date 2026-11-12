// netlify/functions/journey-load.js
// La llave: devuelve el recorrido de una usuaria a partir de su identificador
// anónimo, para que pueda seguir en otro navegador (por ejemplo, si empezó
// dentro de Instagram y vuelve desde el calendario en Safari).
//
// El identificador es un UUID aleatorio (122 bits): imposible de adivinar,
// así que funciona como llave. Quien tenga el enlace puede leer el recorrido;
// por eso la app lo lleva en el # del enlace (no viaja en las peticiones ni
// queda en los registros) y aquí se recibe por POST, nunca en la URL.
//
// Solo se devuelve un recorrido con actividad en los últimos 14 días, que es
// lo que promete el aviso. La clave de Supabase nunca sale del servidor.

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY;

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const DIAS_VALIDOS = new Set(['beta', '0', '1', '2', '3', '4', '5', '6']);
const CATORCE_DIAS_MS = 14 * 24 * 60 * 60 * 1000;

const json = (statusCode, obj) => ({
  statusCode,
  headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
  body: JSON.stringify(obj),
});

exports.handler = async function (event) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  let anonId;
  try {
    ({ anonId } = JSON.parse(event.body || '{}'));
  } catch (e) {
    return json(400, { error: 'JSON inválido' });
  }
  if (!anonId || !UUID_RE.test(String(anonId))) {
    return json(400, { error: 'Llave inválida' });
  }

  try {
    const url = `${SUPABASE_URL}/rest/v1/journey_days`
      + `?anon_id=eq.${encodeURIComponent(anonId)}`
      + `&select=day,data,arrival_mode,updated_at`;
    const res = await fetch(url, {
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
      },
    });
    if (!res.ok) throw new Error(`Supabase error: ${res.status}`);
    const filas = (await res.json()).filter(f => DIAS_VALIDOS.has(String(f.day)));

    // Recorrido entero o nada: si el último movimiento tiene más de 14 días,
    // ya no se devuelve (aunque siguiera en la base de datos).
    const ultimo = Math.max(0, ...filas.map(f => Date.parse(f.updated_at) || 0));
    if (!filas.length || Date.now() - ultimo > CATORCE_DIAS_MS) {
      return json(200, { dias: [] });
    }

    return json(200, {
      dias: filas.map(f => ({ day: String(f.day), data: f.data, arrivalMode: f.arrival_mode })),
    });
  } catch (e) {
    console.error('Error en journey-load:', e.message);
    return json(500, { error: 'No disponible' });
  }
};
