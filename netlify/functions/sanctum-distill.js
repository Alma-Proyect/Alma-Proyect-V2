// netlify/functions/sanctum-distill.js

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

  let entries;
  try {
    ({ entries } = JSON.parse(event.body || '{}'));
  } catch (e) {
    return { statusCode: 400, body: JSON.stringify({ error: 'JSON inválido' }) };
  }

  if (!entries || !entries.length) {
    return { statusCode: 400, body: JSON.stringify({ error: 'No hay entradas.' }) };
  }

  // Cargar esencia anterior
  let esenciaAnterior = null;
  try {
    const { data } = await sbFetch('sanctum_essence?select=data&order=created_at.desc&limit=1');
    if (data && data[0] && data[0].data) esenciaAnterior = data[0].data;
  } catch (e) {}

  // Últimas 5 entradas escritas ordenadas por fecha
  const ordenadas = [...entries]
    .sort((a, b) => {
      const da = new Date(a.date || a.created_at || 0).getTime();
      const db = new Date(b.date || b.created_at || 0).getTime();
      return da - db;
    })
    .slice(-5);

  const entriesText = ordenadas
    .map((e, i) => `E${i + 1}:${e.content.slice(0, 400)}`)
    .join('\n');

  // Últimas conversaciones del chat de Alma — también alimentan la destilación
  let conversacionesText = '';
  try {
    const { data: convData } = await sbFetch(
      'sanctum_conversations?select=role,content,is_mirror&order=created_at.desc&limit=40'
    );
    if (convData && convData.length > 0) {
      const convs = [...convData].reverse(); // cronológico
      conversacionesText = '\n\nConversaciones recientes con Alma:\n' +
        convs
          .filter(c => !c.is_mirror) // excluir espejos, solo el diálogo
          .map(c => `${c.role === 'user' ? 'Guardiana' : 'Alma'}: ${(c.content || '').slice(0, 350)}`)
          .join('\n');
    }
  } catch (e) {
    console.warn('No se pudieron cargar conversaciones:', e.message);
  }

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

  // Prefill — Claude solo completa, mucho más rápido
  // Presupuesto total: Netlify mata la función a los 10s. Calculamos lo que
  // queda tras las llamadas a Supabase ya hechas, con colchón para el resto.
  let claudeText = '';
  try {
    const elapsed = Date.now() - startTime;
    const remaining = 8000 - elapsed; // deja margen para las 3 llamadas a Supabase posteriores
    const claudeTimeout = Math.max(remaining, 3000);

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), claudeTimeout);

    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 480,
        system: 'JSON puro, sin markdown. Valores de máximo 5 palabras cada uno — nunca frases largas, nunca comas dentro de un valor de string. Las etapas solo crecen: copia las anteriores exactas y añade una nueva si el momento vital es distinto. Si ya hay 6 etapas, fusiona la más antigua con la más similar. Completa el objeto JSON.',
        messages: [
          {
            role: 'user',
            content: `${contexto}${etapasTexto}\n\nLO QUE ESCRIBIÓ Y HABLÓ AHORA:\n${entriesText}${conversacionesText}\n\nCompleta este JSON con valores MUY CORTOS (máximo 5 palabras por valor de string, sin comas dentro de los strings):\n{"tono_central":"[3-5 palabras]","sostiene_dolor":"[3-5 palabras]","valores":["[3 palabras]","[3 palabras]","[3 palabras]"],"nunca":["[3 palabras]","[3 palabras]"],"preguntas":["[pregunta corta]","[pregunta corta]"],"palabra_semana":"[1 palabra]","hilo_conductor":"[4-5 palabras]","etapas":[{"nombre":"[3-5 palabras]","aprendizaje":"[5-8 palabras]"}]}`
          },
          {
            role: 'assistant',
            content: '{"tono_central":"'
          }
        ],
      }),
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error ? err.error.message : `API error ${res.status}`);
    }

    const data = await res.json();
    claudeText = data.content && data.content[0] ? data.content[0].text : '';
  } catch (e) {
    console.error('Claude error:', e.message);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: e.message })
    };
  }

  // Parse blindado — reconstruye el JSON desde el prefill
  let essenceData;
  try {
    const fullJson = '{"tono_central":"' + claudeText;

    // Intentar parsear el JSON completo primero
    let candidate = fullJson;
    try {
      essenceData = JSON.parse(candidate);
    } catch (e) {
      // Si falla, buscar el último } válido y truncar ahí
      const lastBrace = fullJson.lastIndexOf('}');
      if (lastBrace === -1) throw new Error('Sin cierre de JSON');
      candidate = fullJson.slice(0, lastBrace + 1);
      essenceData = JSON.parse(candidate);
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
    console.error('JSON parse error:', e.message, '| Raw:', claudeText.slice(0, 200));
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Parse fallido', raw: claudeText.slice(0, 200) })
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
