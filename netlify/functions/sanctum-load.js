// netlify/functions/sanctum-load.js
// Carga entradas y esencia del Sanctum desde Supabase.
// La clave de Supabase nunca sale del servidor.

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY;

async function sbFetch(path) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    headers: {
      'Content-Type': 'application/json',
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${SUPABASE_KEY}`,
      'Prefer': ''
    }
  });
  if (!res.ok) throw new Error(`Supabase error: ${res.status}`);
  const text = await res.text();
  return text ? JSON.parse(text) : null;
}

exports.handler = async function (event) {
  if (event.httpMethod !== 'GET') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const [entryRows, essenceRows] = await Promise.all([
      sbFetch('sanctum_entries?select=*&order=created_at.desc'),
      sbFetch('sanctum_essence?select=*&order=created_at.desc&limit=1')
    ]);

    const entries = (entryRows || []).map(r => ({
      id: r.id,
      date: r.created_at,
      mood: r.mood,
      prompt: r.prompt,
      content: r.content,
      words: r.words,
      distilled: r.distilled
    }));

    const essence = essenceRows && essenceRows[0] ? essenceRows[0].data : null;

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ entries, essence })
    };
  } catch (e) {
    console.error('Error en sanctum-load:', e);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: e.message })
    };
  }
};
