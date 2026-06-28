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
  // Protección: Supabase puede devolver body vacío o texto no-JSON
  let data = null;
  try {
    const text = await res.text();
    if (text && text.trim().startsWith('{') || text.trim().startsWith('[')) {
      data = JSON.parse(text);
    }
  } catch (e) {}
  return { ok: res.ok, status: res.status, data };
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

  // Últimas 5 entradas ordenadas por fecha — normalizar campo fecha
  const ordenadas = [...entries]
    .sort((a, b) => {
      const da = new Date(a.date || a.created_at || 0).getTime();
      const db = new Date(b.date || b.created_at || 0).getTime();
      return da - db;
    })
    .slice(-5);

  const entriesText = ordenadas
    .map((e, i) => `E${i + 1}:${e.content.slice(0, 280)}`)
    .join('\n');

  const contexto = esenciaAnterior
    ? `Previo:tono="${(esenciaAnterior.tono_central || '').slice(0, 40)}",hilo="${(esenciaAnterior.hilo_conductor || '').slice(0, 40)}".`
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
