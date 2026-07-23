// netlify/functions/sanctum-delete.js
// Borra una entrada del Sanctum en Supabase.
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

  if (event.httpMethod !== 'DELETE') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  let id;
  try {
    ({ id } = JSON.parse(event.body || '{}'));
  } catch (e) {
    return { statusCode: 400, body: JSON.stringify({ error: 'JSON inválido' }) };
  }

  // El id de sanctum_entries es un entero. Se exige que lo sea antes de
  // construir la URL: así nada de lo que llegue puede colar parámetros
  // extra y convertir el borrado de una fila en el de varias.
  const idNum = Number(id);
  if (!Number.isInteger(idNum) || idNum <= 0) {
    return { statusCode: 400, body: JSON.stringify({ error: 'Identificador inválido' }) };
  }

  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/sanctum_entries?id=eq.${idNum}`, {
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
