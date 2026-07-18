// netlify/functions/sanctum-save.js
// Guarda una entrada del Sanctum en Supabase.
// La clave de Supabase nunca sale del servidor.
// Protegido: solo responde si la petición trae la clave del Sanctum.

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY;
const SANCTUM_SECRET = process.env.SANCTUM_SECRET;

function autorizada(event) {
  const clave = event.headers['x-sanctum-key'] || event.headers['X-Sanctum-Key'];
  return SANCTUM_SECRET && clave === SANCTUM_SECRET;
}

exports.handler = async function (event) {
  if (!autorizada(event)) {
    return { statusCode: 401, body: JSON.stringify({ error: 'No autorizado' }) };
  }

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  let entry;
  try {
    ({ entry } = JSON.parse(event.body || '{}'));
  } catch (e) {
    return { statusCode: 400, body: JSON.stringify({ error: 'JSON inválido' }) };
  }

  if (!entry || !entry.content) {
    return { statusCode: 400, body: JSON.stringify({ error: 'Sin contenido' }) };
  }

  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/sanctum_entries`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Prefer': 'return=representation'
      },
      body: JSON.stringify(entry)
    });

    if (!res.ok) throw new Error(`Supabase error: ${res.status}`);
    const saved = await res.json();

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ entry: saved[0] || null })
    };
  } catch (e) {
    console.error('Error en sanctum-save:', e);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: e.message })
    };
  }
};
