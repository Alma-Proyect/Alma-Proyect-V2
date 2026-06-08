// netlify/functions/sanctum-distill.js

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY;

async function sbFetch(path, opts = {}) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    method: opts.method || 'GET',
    headers: {
      'Content-Type': 'application/json',
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${SUPABASE_KEY}`,
      'Prefer': 'return=minimal',
    },
    body: opts.body || undefined,
  });
  const text = await res.text();
  return { ok: res.ok, status: res.status, data: text ? JSON.parse(text) : null };
}

exports.handler = async function (event) {
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

  // Últimas 8 entradas, 120 chars cada una — máximo brevedad para no rozar timeout
  const ordenadas = [...entries]
    .sort((a, b) => new Date(a.date) - new Date(b.date))
    .slice(-8);

  const entriesText = ordenadas
    .map((e, i) => `E${i + 1}:${e.content.slice(0, 120)}`)
    .join('\n');

  const contexto = esenciaAnterior
    ? `Previo:tono="${(esenciaAnterior.tono_central||'').slice(0,40)}",hilo="${(esenciaAnterior.hilo_conductor||'').slice(0,40)}".`
    : '';

  const totalWords = entries.reduce((sum, e) => sum + (e.words || 0), 0);

  // Prefill — Claude solo completa, mucho más rápido
  let claudeText = '';
  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 280,
        system: 'Destilador de voz. Completa el JSON. Valores de 5 palabras máximo. Solo JSON, sin markdown.',
        messages: [
          {
            role: 'user',
            content: `${contexto}\nEntradas:\n${entriesText}\n\nCompleta:{"tono_central":"...","sostiene_dolor":"...","valores":["...","...","..."],"nunca":["...","..."],"preguntas":["...","..."],"palabra_semana":"...","hilo_conductor":"..."}`
          },
          {
            role: 'assistant',
            content: '{"tono_central":"'
          }
        ],
      }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error ? err.error.message : `API error ${res.status}`);
    }

    const data = await res.json();
    claudeText = data.content && data.content[0] ? data.content[0].text : '';
  } catch (e) {
    console.error('Claude error:', e.message);
    return { statusCode: 500, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ error: e.message }) };
  }

  // Parse blindado — reconstruye el JSON desde el prefill
  let essenceData;
  try {
    // Reconstruir JSON completo
    const fullJson = '{"tono_central":"' + claudeText;

    // Buscar el último } válido
    const lastBrace = fullJson.lastIndexOf('}');
    if (lastBrace === -1) throw new Error('Sin cierre de JSON');

    const candidate = fullJson.slice(0, lastBrace + 1);
    essenceData = JSON.parse(candidate);

    // Verificar campos mínimos obligatorios
    const required = ['tono_central', 'sostiene_dolor', 'valores', 'nunca', 'preguntas', 'palabra_semana', 'hilo_conductor'];
    for (const field of required) {
      if (!essenceData[field]) {
        essenceData[field] = field === 'valores' || field === 'nunca' || field === 'preguntas' ? [] : '—';
      }
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

  // Guardar en Supabase
  try { await sbFetch('sanctum_essence?created_at=gte.2000-01-01', { method: 'DELETE' }); } catch (e) {}
  try {
    await sbFetch('sanctum_essence', { method: 'POST', body: JSON.stringify({ data: essenceData }) });
  } catch (e) { console.warn('No se pudo guardar:', e.message); }

  // Marcar entradas como destiladas
  for (const entry of entries) {
    try {
      await sbFetch(`sanctum_entries?id=eq.${entry.id}`, { method: 'PATCH', body: JSON.stringify({ distilled: true }) });
    } catch (e) {}
  }

  return {
    statusCode: 200,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ essence: essenceData }),
  };
};
