// netlify/functions/journey-save.js
// Guarda (o actualiza) el día de una usuaria anónima en Supabase.
// Espejo del guardado local del navegador: una fila por usuaria y día.
// La clave de Supabase nunca sale del servidor.

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY;

const DIAS_VALIDOS = new Set(['beta', '1', '2', '3']);
const MAX_BYTES = 120000; // tope generoso para el objeto del día completo
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

exports.handler = async function (event) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  let anonId, day, data, arrivalMode;
  try {
    ({ anonId, day, data, arrivalMode } = JSON.parse(event.body || '{}'));
  } catch (e) {
    return { statusCode: 400, body: JSON.stringify({ error: 'JSON inválido' }) };
  }

  if (!anonId || !UUID_RE.test(String(anonId))) {
    return { statusCode: 400, body: JSON.stringify({ error: 'Identificador inválido' }) };
  }
  if (!DIAS_VALIDOS.has(String(day))) {
    return { statusCode: 400, body: JSON.stringify({ error: 'Día inválido' }) };
  }
  if (!data || typeof data !== 'object') {
    return { statusCode: 400, body: JSON.stringify({ error: 'Sin datos' }) };
  }

  const fila = {
    anon_id: anonId,
    day: String(day),
    data,
    arrival_mode: arrivalMode || null,
    updated_at: new Date().toISOString(),
  };

  const cuerpo = JSON.stringify(fila);
  if (cuerpo.length > MAX_BYTES) {
    return { statusCode: 413, body: JSON.stringify({ error: 'Demasiado grande' }) };
  }

  try {
    // Upsert: si ya existe la fila de esa usuaria y ese día, se actualiza.
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/journey_days?on_conflict=anon_id,day`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${SUPABASE_KEY}`,
          'Prefer': 'resolution=merge-duplicates,return=minimal',
        },
        body: cuerpo,
      }
    );

    if (!res.ok) throw new Error(`Supabase error: ${res.status}`);

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ok: true }),
    };
  } catch (e) {
    console.error('Error en journey-save:', e);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: e.message }),
    };
  }
};
