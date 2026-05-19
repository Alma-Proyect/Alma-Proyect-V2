// netlify/functions/sanctum-delete.js
// Borra una entrada del Sanctum en Supabase.
// La clave de Supabase nunca sale del servidor.

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY;

exports.handler = async function (event) {
  if (event.httpMethod !== 'DELETE') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  let id;
  try {
    ({ id } = JSON.parse(event.body || '{}'));
  } catch (e) {
    return { statusCode: 400, body: JSON.stringify({ error: 'JSON inválido' }) };
  }

  if (!id) {
    return { statusCode: 400, body: JSON.stringify({ error: 'Sin id' }) };
  }

  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/sanctum_entries?id=eq.${id}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Prefer': 'return=minimal'
      }
    });

    if (!res.ok) throw new Error(`Supabase error: ${res.status}`);

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ok: true })
    };
  } catch (e) {
    console.error('Error en sanctum-delete:', e);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: e.message })
    };
  }
};
