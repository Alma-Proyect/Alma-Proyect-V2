// lib/limite.js
// Límite de mensajes de la conversación libre (después de los 7 días).
// Alma es gratuita: lo que cuesta dinero es cada respuesta, así que después
// del recorrido cada usuaria tiene un número de mensajes al día.
//
// Solo se guarda un contador por día, nunca lo que escribe: fila de
// journey_days con day = 'libre' y data = { uso: { "2026-11-14": 3, … } }.
// Esa fila se borra con el resto a los 14 días sin actividad.
//
// Si Supabase no responde, se deja pasar (mejor que dejarla sin respuesta);
// la app lleva también su propia cuenta.

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY;

const LIMITE_LIBRE_DIA = 5;        // ← cámbialo aquí si quieres más o menos
const DIAS_QUE_SE_GUARDAN = 7;     // del contador, no de los textos

function hoyEnEspana() {
  // AAAA-MM-DD en hora de Madrid (el día cambia a medianoche en España)
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Madrid" }).format(new Date());
}

const cab = () => ({ apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` });

async function conTiempo(promesaFn, ms) {
  const c = new AbortController();
  const t = setTimeout(() => c.abort(), ms);
  try { return await promesaFn(c.signal); } finally { clearTimeout(t); }
}

// ¿Le quedan mensajes hoy? Devuelve { permitido, usados, uso }
async function consultarLibre(anonId) {
  const hoy = hoyEnEspana();
  try {
    const res = await conTiempo(signal => fetch(
      `${SUPABASE_URL}/rest/v1/journey_days?anon_id=eq.${encodeURIComponent(anonId)}&day=eq.libre&select=data`,
      { headers: cab(), signal }), 1500);
    if (!res.ok) throw new Error("Supabase " + res.status);
    const filas = await res.json();
    const uso = (filas[0] && filas[0].data && filas[0].data.uso) || {};
    const usados = Number(uso[hoy]) || 0;
    return { permitido: usados < LIMITE_LIBRE_DIA, usados, uso, hoy, ok: true };
  } catch (e) {
    console.warn("limite: no se pudo consultar, se deja pasar");
    return { permitido: true, usados: 0, uso: {}, hoy, ok: false };
  }
}

// Suma un mensaje (solo cuando Alma ha respondido de verdad)
async function sumarLibre(anonId, estado) {
  const uso = Object.assign({}, estado.uso);
  uso[estado.hoy] = (Number(uso[estado.hoy]) || 0) + 1;
  // Solo los últimos días: el contador no crece sin fin
  const claves = Object.keys(uso).sort().slice(-DIAS_QUE_SE_GUARDAN);
  const limpio = {};
  claves.forEach(k => { limpio[k] = uso[k]; });
  try {
    await conTiempo(signal => fetch(`${SUPABASE_URL}/rest/v1/journey_days?on_conflict=anon_id,day`, {
      method: "POST",
      headers: { ...cab(), "Content-Type": "application/json", Prefer: "resolution=merge-duplicates,return=minimal" },
      body: JSON.stringify({ anon_id: anonId, day: "libre", data: { uso: limpio }, updated_at: new Date().toISOString() }),
      signal,
    }), 1500);
  } catch (e) {
    console.warn("limite: no se pudo guardar el contador");
  }
  return Math.max(0, LIMITE_LIBRE_DIA - uso[estado.hoy]);
}

module.exports = { LIMITE_LIBRE_DIA, consultarLibre, sumarLibre, hoyEnEspana };
