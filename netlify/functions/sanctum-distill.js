// netlify/functions/sanctum-distill.js

const { callAnthropic } = require('./lib/anthropic');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY;
const SANCTUM_SECRET = process.env.SANCTUM_SECRET;

function autorizada(event) {
  const clave = event.headers['x-sanctum-key'] || event.headers['X-Sanctum-Key'];
  return SANCTUM_SECRET && clave === SANCTUM_SECRET;
}

async function sbFetch(path, opts = {}) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 1500);
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
      method: opts.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Prefer': 'return=minimal',
      },
      body: opts.body || undefined,
      signal: controller.signal,
    });
    // Protección: Supabase puede devolver body vacío o texto no-JSON
    let data = null;
    try {
      const text = await res.text();
      if (text && text.trim().startsWith('{') || text.trim().startsWith('[')) {
        data = JSON.parse(text);
      }
    } catch (e) {}
    return { ok: res.ok, status: res.status, data };
  } finally {
    clearTimeout(timeout);
  }
}

exports.handler = async function (event) {
  if (!autorizada(event)) {
    return { statusCode: 401, body: JSON.stringify({ error: 'No autorizado' }) };
  }

  const startTime = Date.now();

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  let entries, fromScratch;
  try {
    ({ entries, fromScratch } = JSON.parse(event.body || '{}'));
  } catch (e) {
    return { statusCode: 400, body: JSON.stringify({ error: 'JSON inválido' }) };
  }

  if (!entries || !entries.length) {
    return { statusCode: 400, body: JSON.stringify({ error: 'No hay entradas.' }) };
  }

  // Cargar esencia anterior — salvo que se pida regenerar desde cero.
  // fromScratch rompe la cadena una vez: ignora el retrato previo y las etapas,
  // para que una esencia contaminada no reinfecte a la nueva.
  let esenciaAnterior = null;
  if (!fromScratch) {
    try {
      const { data } = await sbFetch('sanctum_essence?select=data&order=created_at.desc&limit=1');
      if (data && data[0] && data[0].data) esenciaAnterior = data[0].data;
    } catch (e) {}
  }

  // Últimas 8 entradas escritas ordenadas por fecha
  const ordenadas = [...entries]
    .sort((a, b) => {
      const da = new Date(a.date || a.created_at || 0).getTime();
      const db = new Date(b.date || b.created_at || 0).getTime();
      return da - db;
    })
    .slice(-8);

  const entriesText = ordenadas
    .map((e, i) => `E${i + 1}:${e.content.slice(0, 400)}`)
    .join('\n');

  // La esencia se destila SOLO de las entradas de diario, nunca del chat.
  // Antes también leía sanctum_conversations, y eso creaba un bucle: la voz de
  // Alma se guardaba como conversación, la siguiente destilación la leía, y la
  // voz se destilaba a sí misma, torciéndose un poco más en cada vuelta y
  // aprendiendo a hablar en segunda persona. La esencia representa la voz de la
  // guardiana, y esa voz vive en la escritura reflexiva, no en el diálogo.

  const etapasPrevias = (esenciaAnterior && Array.isArray(esenciaAnterior.etapas))
    ? esenciaAnterior.etapas
    : [];

  const etapasTexto = etapasPrevias.length
    ? `\n\nEtapas vitales ya registradas (memoria acumulada, no las borres ni las repitas si siguen vigentes):\n` +
      etapasPrevias.map((et, i) => `${i + 1}. ${et.nombre}: ${et.aprendizaje}`).join('\n')
    : '';

  const contexto = esenciaAnterior
    ? `Retrato anterior (núcleo a integrar, no a descartar): tono="${(esenciaAnterior.tono_central || '').slice(0, 40)}", hilo="${(esenciaAnterior.hilo_conductor || '').slice(0, 40)}".`
    : '';

  const totalWords = entries.reduce((sum, e) => sum + (e.words || 0), 0);

  // Antes se usaba «prefill» (empezar nosotros la respuesta con
  // {"tono_central":" para que Claude solo completara). Haiku 5.5 no lo admite
  // y devuelve error, así que ahora se le pide el JSON entero y se recorta
  // desde la primera llave.
  // Presupuesto total: Netlify mata la función a los 10s. Calculamos lo que
  // queda tras las llamadas a Supabase ya hechas, con colchón para el resto.
  let claudeText = '';
  try {
    const elapsed = Date.now() - startTime;
    const remaining = 8000 - elapsed; // deja margen para las 3 llamadas a Supabase posteriores
    const claudeTimeout = Math.max(remaining, 3000);

    ({ text: claudeText } = await callAnthropic({
      system: 'Destilas la VOZ de una guardiana a partir de su escritura reflexiva: cómo acompaña, cómo sostiene, desde dónde mira. No resumes su vida ni sus problemas, destilas su manera de escuchar. Todo en primera persona o en modo de cualidad, nunca dirigiéndote a nadie en segunda persona. Cada valor de string, máximo 5 palabras, sin comas dentro. Las etapas son memoria y solo crecen: copia las anteriores tal cual y añade una nueva solo si el momento vital es claramente distinto. Si ya hay 6, fusiona las dos más parecidas. Responde ÚNICAMENTE con el objeto JSON: tu respuesta empieza por { y acaba por }. Nada antes ni después, sin markdown, sin explicaciones.',
      messages: [
        {
          role: 'user',
          content: `${contexto}${etapasTexto}\n\nLO QUE ESCRIBIÓ AHORA:\n${entriesText}\n\nDevuelve este JSON relleno con valores MUY CORTOS (máximo 5 palabras por valor de string, sin comas dentro de los strings):\n{"tono_central":"[3-5 palabras]","sostiene_dolor":"[3-5 palabras]","valores":["[3 palabras]","[3 palabras]","[3 palabras]"],"nunca":["[3 palabras]","[3 palabras]"],"preguntas":["[pregunta corta]","[pregunta corta]"],"palabra_semana":"[1 palabra]","hilo_conductor":"[4-5 palabras]","etapas":[{"nombre":"[3-5 palabras]","aprendizaje":"[5-8 palabras]"}]}`
        }
      ],
      maxTokens: 900,
      plan: 'free',
      timeoutMs: claudeTimeout,
    }));
  } catch (e) {
    console.error('Claude error:', e.message);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: e.message })
    };
  }

  // Cierra un JSON que se cortó a media escritura: recorta cualquier cola
  // incompleta y añade las comillas, corchetes y llaves que falten, en el
  // orden correcto. Así se rescata aunque el corte cayera dentro de un valor.
  function repararJson(txt) {
    let s = txt;
    // Fuera una posible última pareja "clave":"valor a medias sin cerrar
    // y cualquier coma suelta al final.
    let dentro = false, esc = false, ultimoCierreSeguro = -1, pila = [];
    for (let i = 0; i < s.length; i++) {
      const c = s[i];
      if (esc) { esc = false; continue; }
      if (c === '\\') { esc = true; continue; }
      if (c === '"') { dentro = !dentro; continue; }
      if (dentro) continue;
      if (c === '{' || c === '[') pila.push(c);
      else if (c === '}' || c === ']') { pila.pop(); ultimoCierreSeguro = i; }
    }
    // Si acabó dentro de un string, el corte cayó dentro de un valor. Retroceder
    // hasta justo antes de esa última clave incompleta y descartarla entera:
    // intentar cerrarla dejaría un objeto o array roto.
    if (dentro) {
      // Buscar el comienzo de la última pareta "clave": que quedó a medias.
      // Retrocedemos hasta el último separador estructural ( , { [ ) fuera de string.
      let corte = -1, d2 = false, e2 = false;
      for (let i = 0; i < s.length; i++) {
        const c = s[i];
        if (e2) { e2 = false; continue; }
        if (c === '\\') { e2 = true; continue; }
        if (c === '"') { d2 = !d2; continue; }
        if (d2) continue;
        if (c === ',' || c === '{' || c === '[') corte = i;
      }
      if (corte !== -1) s = s.slice(0, corte);
      // Si el carácter de corte era una coma, la quitamos; si era { o [, lo dejamos.
      s = s.replace(/,\s*$/, '');
    } else {
      s = s.replace(/,\s*$/, '');
    }

    // Recalcular la pila sobre el texto ya saneado y cerrar lo que falte.
    pila = []; dentro = false; esc = false;
    for (let i = 0; i < s.length; i++) {
      const c = s[i];
      if (esc) { esc = false; continue; }
      if (c === '\\') { esc = true; continue; }
      if (c === '"') { dentro = !dentro; continue; }
      if (dentro) continue;
      if (c === '{' || c === '[') pila.push(c);
      else if (c === '}' || c === ']') pila.pop();
    }
    s = s.replace(/,\s*$/, '');
    while (pila.length) s += pila.pop() === '{' ? '}' : ']';
    return s;
  }

  // Parse blindado: desde la primera llave, sin vallas de markdown
  let essenceData;
  try {
    let fullJson = claudeText.replace(/```json|```/g, '').trim();
    const ini = fullJson.indexOf('{');
    if (ini === -1) throw new Error('La respuesta no trae JSON');
    fullJson = fullJson.slice(ini);
    const fin = fullJson.lastIndexOf('}');

    try {
      essenceData = JSON.parse(fin !== -1 ? fullJson.slice(0, fin + 1) : fullJson);
    } catch (e) {
      // Reparar el corte y volver a intentar
      essenceData = JSON.parse(repararJson(fullJson));
    }

    // Verificar y rellenar campos mínimos obligatorios
    const arrayFields = ['valores', 'nunca', 'preguntas'];
    const stringFields = ['tono_central', 'sostiene_dolor', 'palabra_semana', 'hilo_conductor'];
    for (const field of arrayFields) {
      if (!essenceData[field] || !Array.isArray(essenceData[field])) {
        essenceData[field] = [];
      }
    }
    for (const field of stringFields) {
      if (!essenceData[field] || typeof essenceData[field] !== 'string') {
        essenceData[field] = '—';
      }
    }

    // Etapas: si el modelo no devolvió un array válido (por ejemplo si se
    // truncó antes de llegar a ese campo), nunca perdemos las que ya había.
    // La memoria acumulada es justo lo que no se puede permitir perder.
    if (!Array.isArray(essenceData.etapas) || essenceData.etapas.length === 0) {
      essenceData.etapas = etapasPrevias;
    } else {
      // Filtrar entradas mal formadas dentro del array, sin descartar el resto
      essenceData.etapas = essenceData.etapas.filter(
        et => et && typeof et.nombre === 'string' && typeof et.aprendizaje === 'string'
      );
      if (essenceData.etapas.length === 0) essenceData.etapas = etapasPrevias;
    }
  } catch (e) {
    console.error('JSON parse error:', e.message, '| Largo de la respuesta:', claudeText.length);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Parse fallido' })
    };
  }

  essenceData.generatedAt = new Date().toISOString();
  essenceData.count = entries.length;
  essenceData.total_words = totalWords;

  // Guardar en Supabase — borrar anterior e insertar nueva
  try {
    await sbFetch('sanctum_essence?created_at=gte.2000-01-01', { method: 'DELETE' });
  } catch (e) {
    console.warn('No se pudo borrar esencia anterior:', e.message);
  }
  try {
    await sbFetch('sanctum_essence', {
      method: 'POST',
      body: JSON.stringify({ data: essenceData })
    });
  } catch (e) {
    console.warn('No se pudo guardar esencia:', e.message);
  }

  // Marcar todas las entradas como destiladas en una sola llamada
  // Los IDs pueden ser UUIDs (strings) o números — los convertimos a string entre comillas
  try {
    const ids = entries
      .map(e => String(e.id))
      .filter(Boolean)
      .join(',');
    if (ids) {
      await sbFetch(`sanctum_entries?id=in.(${ids})`, {
        method: 'PATCH',
        body: JSON.stringify({ distilled: true })
      });
    }
  } catch (e) {
    console.warn('No se pudo marcar como destiladas:', e.message);
  }

  return {
    statusCode: 200,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ essence: essenceData }),
  };
};
