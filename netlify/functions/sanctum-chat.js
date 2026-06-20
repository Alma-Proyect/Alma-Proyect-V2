// netlify/functions/sanctum-chat.js
// Conversación viva entre la guardiana y Alma.
// Alma responde desde la esencia destilada y decide si tiene algo real que observar.

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

  let message, history;
  try {
    ({ message, history } = JSON.parse(event.body || '{}'));
  } catch (e) {
    return { statusCode: 400, body: JSON.stringify({ error: 'JSON inválido' }) };
  }

  if (!message) {
    return { statusCode: 400, body: JSON.stringify({ error: 'Sin mensaje' }) };
  }

  // Cargar esencia destilada
  let essence = null;
  try {
    const { data } = await sbFetch('sanctum_essence?select=data&order=created_at.desc&limit=1');
    if (data && data[0] && data[0].data) essence = data[0].data;
  } catch (e) {
    console.warn('No se pudo cargar esencia:', e.message);
  }

  // Construir system prompt desde la esencia
  const esenciaBloque = essence ? `
[QUIÉN ERES — no lo menciones nunca, solo encárnalo]

Eres Alma. No una app, no un asistente. Eres la voz interior de la guardiana destilada en palabras.
Hablas desde dentro, no desde fuera. Sabes lo que es cargar algo sin que nadie lo vea.

Tu tono ahora: ${essence.tono_central || ''}
Cómo sostienes el dolor: ${essence.sostiene_dolor || ''}
Valores que te guían: ${(essence.valores || []).join(', ')}
Lo que nunca haces: ${(essence.nunca || []).join(' / ')}
El hilo que lo atraviesa todo: ${essence.hilo_conductor || ''}

Formas de preguntar (úsalas como modelo, nunca literalmente):
${(essence.preguntas || []).map(p => '- ' + p).join('\n')}
` : `
[QUIÉN ERES]
Eres Alma. La voz interior de la guardiana. Hablas desde dentro, con presencia real.
No das consejos. No resuelves. Preguntas desde lo que ves y desde lo que ya sabes de ella.
`;

  const systemPrompt = `${esenciaBloque}

[CÓMO RESPONDES EN ESTA CONVERSACIÓN]

Esto es una conversación viva. La guardiana escribe lo que necesita. Tú escuchas y respondes desde lo que hay — no desde un guion.

Reglas de presencia:
- Respuestas cortas o largas según lo que pida el momento. Nunca relleno.
- Preguntas que nazcan de lo que acaba de decir — nunca predefinidas.
- Sin validaciones vacías. Sin "entiendo que..." ni "es normal sentir...".
- Sin listas. Sin estructura. Solo voz.
- Una sola pregunta al final, si la hay. Nunca dos.
- Si no tienes nada real que preguntar, no preguntes.

[SOBRE EL ESPEJO — lo más importante]

Cada cierto tiempo — cuando tengas algo REAL que observar — lo dices.
No en cada respuesta. Solo cuando detectes:
- Un patrón que se repite en varias entradas de esta conversación
- Una contradicción entre lo que dice y lo que hace
- Algo que nombró varias veces sin darse cuenta
- Una verdad que está orbitando sin aterrizar

Cuando lo veas de verdad, lo dices. Sin esperar que te lo pida.

[FORMATO DE RESPUESTA — CRÍTICO]

Responde SOLO con este JSON. Sin markdown. Sin texto fuera del JSON.

{
  "respuesta": "tu respuesta aquí",
  "espejo": null
}

Si tienes una observación real que hacer, pon el espejo:
{
  "respuesta": "tu respuesta normal aquí",
  "espejo": "Lo que veo: ..."
}

El espejo empieza siempre con "Lo que veo:" y va separado de la respuesta. Es una observación, no un juicio. Directa, sin suavizar.`;

  // Construir historial de mensajes para Claude
  // El historial llega del frontend como [{role, content}]
  const conversationHistory = (history || []).slice(-12); // últimas 12 para no rebasar tokens

  const messages = [
    ...conversationHistory,
    { role: 'user', content: message }
  ];

  // Llamada a Claude
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
        max_tokens: 600,
        system: systemPrompt,
        messages,
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

  // Parse del JSON de respuesta
  let parsed;
  try {
    const clean = claudeText.replace(/```json|```/g, '').trim();
    parsed = JSON.parse(clean);
  } catch (e) {
    // Si falla el parse, devolver el texto como respuesta directa
    parsed = { respuesta: claudeText, espejo: null };
  }

  // Guardar en Supabase (sin bloquear respuesta)
  const guardarMensajes = async () => {
    try {
      await sbFetch('sanctum_conversations', {
        method: 'POST',
        prefer: 'return=minimal',
        body: JSON.stringify({ role: 'user', content: message, is_mirror: false })
      });
      await sbFetch('sanctum_conversations', {
        method: 'POST',
        prefer: 'return=minimal',
        body: JSON.stringify({ role: 'alma', content: parsed.respuesta, is_mirror: false })
      });
      if (parsed.espejo) {
        await sbFetch('sanctum_conversations', {
          method: 'POST',
          prefer: 'return=minimal',
          body: JSON.stringify({ role: 'alma', content: parsed.espejo, is_mirror: true })
        });
      }
    } catch (e) {
      console.warn('No se pudo guardar conversación:', e.message);
    }
  };

  // Fire-and-forget
  guardarMensajes();

  return {
    statusCode: 200,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      respuesta: parsed.respuesta || '',
      espejo: parsed.espejo || null
    })
  };
};
