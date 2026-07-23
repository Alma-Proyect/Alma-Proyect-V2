// netlify/functions/registro.js
// Guarda el correo de quien quiere seguir escribiendo después de los tres días.
// Se guarda junto al identificador anónimo del navegador: es lo que permitirá,
// cuando exista el acceso con cuenta, reunir a la persona con lo que escribió.
// La clave de Supabase nunca sale del servidor.

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

exports.handler = async function (event) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  let email, anonId;
  try {
    ({ email, anonId } = JSON.parse(event.body || '{}'));
  } catch (e) {
    return { statusCode: 400, body: JSON.stringify({ error: 'JSON inválido' }) };
  }

  email = String(email || '').trim().toLowerCase();

  if (!EMAIL_RE.test(email) || email.length > 254) {
    return { statusCode: 400, body: JSON.stringify({ error: 'Correo inválido' }) };
  }
  // El identificador es opcional: si el navegador lo bloqueó, el correo se
  // guarda igual. Pero si viene, tiene que tener la forma correcta.
  if (anonId && !UUID_RE.test(String(anonId))) {
    return { statusCode: 400, body: JSON.stringify({ error: 'Identificador inválido' }) };
  }

  try {
    // Upsert por correo: si vuelve a apuntarse, se actualiza en lugar de duplicar.
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/registros?on_conflict=email`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${SUPABASE_KEY}`,
          'Prefer': 'resolution=merge-duplicates,return=minimal',
        },
        body: JSON.stringify({
          email,
          anon_id: anonId || null,
          updated_at: new Date().toISOString(),
        }),
      }
    );

    if (!res.ok) {
      const detalle = await res.text();
      throw new Error(`Supabase ${res.status}: ${detalle}`);
    }

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ok: true }),
    };

  } catch (e) {
    console.error('Error en registro:', e.message);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'No se pudo guardar' }),
    };
  }
};
