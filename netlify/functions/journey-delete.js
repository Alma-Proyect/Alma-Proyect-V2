// netlify/functions/journey-delete.js
// «Borrar todo lo mío»: borra del servidor todo lo que hay guardado con su
// identificador anónimo (los días del recorrido, la beta, el contador de la
// escritura libre). Es lo mismo que pasa solo a los catorce días, pero ahora.
//
// Usa el mismo identificador anónimo con el que se guarda (journey-save) y se
// recupera (journey-load): quien lo tiene ya puede leerlo, así que borrarlo
// no da más acceso del que ya había. No recibe ni registra ningún texto.

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY;

const RE_UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const json = (code, o) => ({ statusCode: code, headers: { "Content-Type": "application/json" }, body: JSON.stringify(o) });

exports.handler = async function (event) {
  if (event.httpMethod !== "POST") return { statusCode: 405, body: "Method Not Allowed" };

  let datos;
  try { datos = JSON.parse(event.body || "{}"); } catch (e) { return json(400, { ok: false }); }
  const anonId = String(datos.anonId || "");
  if (!RE_UUID.test(anonId)) return json(400, { ok: false });
  if (!SUPABASE_URL || !SUPABASE_KEY) return json(500, { ok: false });

  const c = new AbortController();
  const t = setTimeout(() => c.abort(), 6000);
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/journey_days?anon_id=eq.${encodeURIComponent(anonId)}`, {
      method: "DELETE",
      headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}`, Prefer: "return=minimal" },
      signal: c.signal,
    });
    clearTimeout(t);
    if (!res.ok) throw new Error("Supabase " + res.status);
    return json(200, { ok: true });
  } catch (e) {
    clearTimeout(t);
    console.error("Error en journey-delete:", e.message);
    return json(502, { ok: false });
  }
};
