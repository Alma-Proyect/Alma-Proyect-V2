// netlify/functions/sanctum-load.js
// Carga entradas y esencia del Sanctum desde Supabase.
// La clave de Supabase nunca sale del servidor.
// Protegido: solo responde si la petición trae la clave del Sanctum.

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY;
const SANCTUM_SECRET = process.env.SANCTUM_SECRET;

function autorizada(event) {
  const clave = event.headers['x-sanctum-key'] || event.headers['X-Sanctum-Key'];
  return SANCTUM_SECRET && clave === SANCTUM_SECRET;
}

// Las preguntas viven aquí, en el servidor, y solo salen tras la clave.
// Antes estaban en el HTML del Sanctum, donde cualquiera que abriera la
// página podía leerlas sin necesidad de contraseña alguna.
const PROMPTS = [
  "¿En qué momento de esta semana te sostuviste sola sin hacer ruido sobre ello?",
  "¿Qué dejaste de sostener esta semana — aunque solo fuera por un momento? ¿Qué apareció debajo?",
  "¿Cuándo fue la última vez que lloraste sin intentar parar antes de tiempo?",
  "¿Qué parte de Alma nació para la mujer que fuiste — y cuál está naciendo para la que eres ahora?",
  "¿Qué escribió alguien esta semana que sentiste también dentro de ti?",
  "¿Dónde termina acompañar a otras y empieza dejarte a ti para después?",
  "¿Qué crees que necesitaría escuchar hoy la mujer que empezó todo esto?",
  "¿Qué crees que diría tu padre de lo que estás construyendo?",
  "¿Hubo un momento esta semana donde sentiste que te elegiste a ti misma?",
  "¿Y algún momento pequeño donde te abandonaste un poco para sostener otra cosa?",
  "¿Cómo estuvo la soledad esta semana — pesada, ligera, tuya?",
  "¿Hubo un momento donde estuviste sola y fue exactamente lo que necesitabas?",
  "¿Qué descubriste esta semana sobre la persona con la que más vas a vivir: tú?",
  "¿Qué patrón viejo apareció esta semana disfrazado de algo nuevo?",
  "¿Dónde sigues dándote menos de lo que le darías a alguien que quieres?",
  "¿Qué límite pusiste esta semana — aunque costara?",
  "¿Qué límite no pusiste — y sabes por qué?",
  "¿Qué verdad se quedó esta semana atrapada en tu garganta?",
  "¿Qué parte de tu esencia apareció esta semana sin que la llamaras?",
  "¿Cuándo te escuchaste esta semana sin corregir lo que sentías?",
  "¿Dónde está la luz hoy — grande, pequeña, casi invisible?",
  "¿Qué desearía para su vida la mujer que ya no le teme a la soledad?",
  "¿Qué semilla plantaste esta semana — para ti, no para nadie más?",
  "¿Qué necesita la guardiana que nadie ha pensado en darle?"
];

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
  if (!autorizada(event)) {
    return { statusCode: 401, body: JSON.stringify({ error: 'No autorizado' }) };
  }

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
      body: JSON.stringify({ entries, essence, prompts: PROMPTS })
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
