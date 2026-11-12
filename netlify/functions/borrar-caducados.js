// netlify/functions/borrar-caducados.js
// Cumple lo que promete el aviso: «se borran solas a los catorce días».
// Se ejecuta sola una vez al día (ver netlify.toml). Borra el recorrido
// ENTERO de cada usuaria cuya última actividad tiene más de 14 días.
// Recorrido entero y no día a día: si alguien va despacio, no se le
// borran los primeros días mientras sigue escribiendo los últimos.
//
// No registra identificadores ni contenido: solo cuántos recorridos borró.

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY;

const CATORCE_DIAS_MS = 14 * 24 * 60 * 60 * 1000;
const PAGINA = 1000;   // Supabase devuelve como mucho 1000 filas por petición
const LOTE_BORRADO = 50;
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const cabeceras = () => ({
  'apikey': SUPABASE_KEY,
  'Authorization': `Bearer ${SUPABASE_KEY}`,
});

async function leerTodas() {
  const filas = [];
  for (let offset = 0; ; offset += PAGINA) {
    const url = `${SUPABASE_URL}/rest/v1/journey_days`
      + `?select=anon_id,updated_at&order=anon_id.asc,day.asc`
      + `&limit=${PAGINA}&offset=${offset}`;
    const res = await fetch(url, { headers: cabeceras() });
    if (!res.ok) throw new Error(`Supabase lectura: ${res.status}`);
    const pagina = await res.json();
    filas.push(...pagina);
    if (pagina.length < PAGINA) return filas;
  }
}

exports.handler = async function () {
  try {
    const filas = await leerTodas();

    // Última actividad de cada recorrido
    const ultima = new Map();
    let fechasRaras = 0;
    for (const f of filas) {
      const t = Date.parse(f.updated_at);
      if (isNaN(t)) { fechasRaras++; continue; }
      if (!ultima.has(f.anon_id) || t > ultima.get(f.anon_id)) ultima.set(f.anon_id, t);
    }

    const ahora = Date.now();
    const caducados = [...ultima.entries()]
      .filter(([id, t]) => ahora - t > CATORCE_DIAS_MS && UUID_RE.test(String(id)))
      .map(([id]) => id);

    for (let i = 0; i < caducados.length; i += LOTE_BORRADO) {
      const lote = caducados.slice(i, i + LOTE_BORRADO);
      const url = `${SUPABASE_URL}/rest/v1/journey_days?anon_id=in.(${lote.join(',')})`;
      const res = await fetch(url, {
        method: 'DELETE',
        headers: { ...cabeceras(), 'Prefer': 'return=minimal' },
      });
      if (!res.ok) throw new Error(`Supabase borrado: ${res.status}`);
    }

    const resumen = { recorridos: ultima.size, borrados: caducados.length };
    if (fechasRaras) resumen.filasSinFechaValida = fechasRaras; // no se borran: revisar a mano
    console.log('borrar-caducados:', JSON.stringify(resumen));
    return { statusCode: 200, body: JSON.stringify(resumen) };
  } catch (e) {
    console.error('Error en borrar-caducados:', e.message);
    return { statusCode: 500, body: JSON.stringify({ error: e.message }) };
  }
};
