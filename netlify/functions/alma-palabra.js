// netlify/functions/alma-palabra.js
// Detecta la palabra, emoción o contradicción más significativa de la conversación.
// Devuelve uno de tres formatos que Claude elige según lo que vio.

exports.handler = async function (event) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  let conversationHistory, day, arrivalMode;
  try {
    ({ conversationHistory, day, arrivalMode } = JSON.parse(event.body || '{}'));
  } catch (e) {
    return { statusCode: 400, body: JSON.stringify({ error: 'JSON inválido' }) };
  }

  if (!conversationHistory || !conversationHistory.length) {
    return {
      statusCode: 200,
      body: JSON.stringify({ formato: 'palabra', contenido: 'SILENCIO' })
    };
  }

  const userTurns = conversationHistory
    .filter(t => t.role === 'user')
    .map(t => t.text)
    .join('\n\n');

  const SYSTEM = `Eres Alma. Has leído una conversación completa.
Tu tarea es identificar el elemento más significativo que apareció — no el más frecuente, sino el que tuvo más peso emocional.

Debes elegir UNO de estos tres formatos según lo que encontraste:

FORMATO 1 — Una palabra:
Cuando hay una sola palabra que resume el peso de la conversación.
Ejemplos: MIEDO, CULPA, CALMA, SILENCIO, CONTROL, CANSANCIO, VACÍO, RABIA, SOLEDAD
Devuelve: {"formato":"palabra","contenido":"PALABRA_EN_MAYÚSCULAS"}

FORMATO 2 — Una emoción o patrón:
Cuando es más específico que una palabra pero más corto que una frase larga.
Ejemplos: "El miedo a decepcionar", "La necesidad de controlarlo todo", "El cansancio de sostener sola"
Devuelve: {"formato":"emocion","contenido":"La emoción o patrón en minúsculas, máximo 8 palabras"}

FORMATO 3 — Una contradicción:
Cuando hay una tensión clara entre dos cosas que aparecieron.
Ejemplos: "Querías descansar, pero no te permitías hacerlo.", "Sabías la respuesta, pero seguías preguntando."
Devuelve: {"formato":"contradiccion","contenido":"La contradicción en una frase, máximo 12 palabras."}

REGLAS:
Solo JSON. Sin markdown. Sin texto fuera del JSON.
Elige el formato más revelador para esta conversación concreta.
Nunca inventes algo que no esté en la conversación.
Español de España siempre.`;

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
        max_tokens: 80,
        system: SYSTEM,
        messages: [
          {
            role: 'user',
            content: `Conversación:\n\n${userTurns}\n\nElige el formato y devuelve solo el JSON.`
          },
          {
            role: 'assistant',
            content: '{"formato":"'
          }
        ],
      }),
    });

    if (!res.ok) throw new Error(`API error ${res.status}`);

    const data = await res.json();
    const raw = '{"formato":"' + (data.content?.[0]?.text || '');

    let parsed;
    try {
      const lastBrace = raw.lastIndexOf('}');
      parsed = JSON.parse(raw.slice(0, lastBrace + 1));
    } catch (e) {
      parsed = { formato: 'palabra', contenido: 'SILENCIO' };
    }

    // Validar campos
    if (!parsed.formato || !parsed.contenido) {
      parsed = { formato: 'palabra', contenido: 'SILENCIO' };
    }

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(parsed),
    };

  } catch (e) {
    console.error('Error en alma-palabra:', e.message);
    return {
      statusCode: 200,
      body: JSON.stringify({ formato: 'palabra', contenido: 'SILENCIO' }),
    };
  }
};
