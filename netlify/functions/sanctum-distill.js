// netlify/functions/sanctum-distill.js
// Destilación acumulativa — el retrato crece con cada entrada nueva.

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY;

async function sbFetch(path, opts = {}) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    method: opts.method || 'GET',
    headers: {
      'Content-Type': 'application/json',
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${SUPABASE_KEY}`,
      'Prefer': opts.prefer || 'return=minimal',
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

  // 1. Cargar esencia anterior desde Supabase
  let esenciaAnterior = null;
  try {
    const { data } = await sbFetch('sanctum_essence?select=data&order=created_at.desc&limit=1');
    if (data && data[0] && data[0].data) esenciaAnterior = data[0].data;
  } catch (e) {
    console.warn('No se pudo cargar esencia anterior:', e.message);
  }

  // 2. Ordenar entradas por fecha y construir texto
  const ordenadas = [...entries].sort((a, b) => new Date(a.date) - new Date(b.date));
  const entriesText = ordenadas
    .map((e, i) => `Entrada ${i + 1} (${new Date(e.date).toLocaleDateString('es-ES')}):\n${e.content}`)
    .join('\n\n---\n\n');

  // 3. Construir mensaje
  let mensajeUsuario;
  if (esenciaAnterior) {
    mensajeUsuario = `RETRATO ANTERIOR:\n- Tono: ${esenciaAnterior.tono_central}\n- Sostiene: ${esenciaAnterior.sostiene_dolor}\n- Valores: ${(esenciaAnterior.valores||[]).join(', ')}\n- Nunca: ${(esenciaAnterior.nunca||[]).join(', ')}\n- Hilo: ${esenciaAnterior.hilo_conductor||''}\n\nENTRADAS (${ordenadas.length} en total):\n\n${entriesText}\n\nProfundiza el retrato con todo lo que ves.`;
  } else {
    mensajeUsuario = `ENTRADAS (${ordenadas.length} en total):\n\n${entriesText}\n\nDestila la voz de esta mujer.`;
  }

  // 4. Llamar a Claude con prefill para garantizar JSON puro
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
        max_tokens: 400,
        system: 'Eres un destilador de voz. Responde SOLO con JSON. Sin markdown, sin bloques de código, sin texto adicional. Solo el objeto JSON.',
        messages: [
          { role: 'user', content: mensajeUsuario },
          { role: 'assistant', content: '{"tono_central":' }
        ],
      }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error && err.error.message ? err.error.message : `API error ${res.status}`);
    }

    const data = await res.json();
    claudeText = (data.content && data.content[0] && data.content[0].text) ? data.content[0].text : '';
  } catch (e) {
    console.error('Error llamando a Claude:', e.message);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Error llamando a Claude: ' + e.message }),
    };
  }

  // 5. Parsear JSON — el prefill añadió '{"tono_central":', Claude completa desde ahí
  let essenceData;
  try {
    const fullJson = '{"tono_central":' + claudeText;
    // Encontrar el cierre del JSON
    const lastBrace = fullJson.lastIndexOf('}');
    if (lastBrace === -1) throw new Error('Sin cierre de JSON. Raw: ' + claudeText.slice(0, 100));
    essenceData = JSON.parse(fullJson.slice(0, lastBrace + 1));
  } catch (e) {
    console.error('JSON parse error:', e.message);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'JSON inválido: ' + e.message }),
    };
  }

  essenceData.generatedAt = new Date().toISOString();
  essenceData.count = entries.length;
  essenceData.total_words = entries.reduce((acc, e) => acc + (e.words || 0), 0);

  // 6. Guardar en Supabase — borrar anterior y guardar nueva
  try {
    await sbFetch('sanctum_essence?created_at=gte.2000-01-01', { method: 'DELETE' });
  } catch (e) {
    console.warn('No se pudo borrar esencia anterior:', e.message);
  }
  try {
    await sbFetch('sanctum_essence', {
      method: 'POST',
      body: JSON.stringify({ data: essenceData }),
    });
  } catch (e) {
    console.warn('No se pudo guardar esencia:', e.message);
  }

  // 7. Marcar entradas como destiladas
  for (const entry of entries) {
    try {
      await sbFetch(`sanctum_entries?id=eq.${entry.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ distilled: true }),
      });
    } catch (e) {
      // Continuar aunque falle una entrada
    }
  }

  return {
    statusCode: 200,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ essence: essenceData }),
  };
};
