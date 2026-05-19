// netlify/functions/sanctum-essence.js
// Lee la esencia destilada del Sanctum desde Supabase
// y la devuelve para que alma.js la use como contexto de voz

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY;

exports.handler = async function(event) {
  if (event.httpMethod !== 'GET') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/sanctum_essence?select=data,created_at&order=created_at.desc&limit=1`,
      {
        headers: {
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${SUPABASE_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    if (!res.ok) throw new Error(`Supabase error: ${res.status}`);

    const rows = await res.json();
    const essence = rows && rows[0] ? rows[0].data : null;

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ essence })
    };

  } catch(e) {
    console.error('Error leyendo esencia:', e);
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ essence: null })
    };
  }
};
