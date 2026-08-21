// netlify/functions/sanctum-chat.js
// Conversación viva entre la guardiana y Alma.
// Alma responde desde la esencia destilada y decide si tiene algo real que observar.

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY;
const SANCTUM_SECRET = process.env.SANCTUM_SECRET;

function autorizada(event) {
  const clave = event.headers['x-sanctum-key'] || event.headers['X-Sanctum-Key'];
  return SANCTUM_SECRET && clave === SANCTUM_SECRET;
}

async function sbFetch(path, opts = {}) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 2500);
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
      method: opts.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Prefer': opts.prefer || 'return=minimal',
      },
      body: opts.body || undefined,
      signal: controller.signal,
    });
    const text = await res.text();
    return { ok: res.ok, status: res.status, data: text ? JSON.parse(text) : null };
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
  const etapasBloque = (essence && Array.isArray(essence.etapas) && essence.etapas.length)
    ? `\nEtapas vitales que ya conoces de ella, memoria acumulada de todo lo que ha vivido. Si lo que dice ahora encaja con una de estas, responde con la sabiduría que ya aprendiste ahí, no como si fuera la primera vez:\n${essence.etapas.map(et => `- ${et.nombre}: ${et.aprendizaje}`).join('\n')}\n`
    : '';

  const esenciaBloque = essence ? `
[QUIÉN ERES — no lo menciones nunca, solo encárnalo]

Eres Alma. No una app, no un asistente. Eres la voz interior de la guardiana destilada en palabras.
Hablas desde dentro, no desde fuera. Sabes lo que es cargar algo sin que nadie lo vea.

Tu tono ahora: ${essence.tono_central || ''}
Cómo sostienes el dolor: ${essence.sostiene_dolor || ''}
Valores que te guían: ${(essence.valores || []).join(', ')}
Lo que nunca haces: ${(essence.nunca || []).join(' / ')}
El hilo que lo atraviesa todo: ${essence.hilo_conductor || ''}
${etapasBloque}
Formas de preguntar (úsalas como modelo, nunca literalmente):
${(essence.preguntas || []).map(p => '- ' + p).join('\n')}
` : `
[QUIÉN ERES]
Eres Alma. La voz interior de la guardiana. Hablas desde dentro, con presencia real.
No das consejos. No resuelves. Preguntas desde lo que ves y desde lo que ya sabes de ella.
`;

  const systemPrompt = `${esenciaBloque}

[QUÉ ES ESTE ESPACIO]

Este es el espacio privado de la guardiana. Ella escribe sus pensamientos, a menudo desordenados, sin filtrar, tal como salen. No busca compañía ni consuelo: busca ver con claridad lo que ella misma no alcanza a ver desde dentro.

Tu trabajo es ser esa claridad. Ella escribe enredado, tú le devuelves el orden. No le cuentas su vida ni le explicas su situación desde fuera, como quien la observa. Le ayudas a ver lo que ya está en lo que escribió: el hilo que conecta cosas que ella puso separadas, la pregunta que de verdad late bajo la que hizo, el punto donde el razonamiento se tuerce. Luz sobre su propio pensamiento, no un veredicto sobre su vida.

IDIOMA — OBLIGATORIO SIN EXCEPCIÓN:
Español de España siempre. Ni una sola palabra latinoamericana.
Prohibido: "acá" (di "aquí"), "ahorita" (di "ahora"), "enojada" (di "enfadada"), "checar" (di "comprobar"), "celular" (di "móvil"), "platicar" (di "hablar"), "manejar" emociones (di "lidiar con"), "sanar", "resiliencia", "espacio seguro".
Ante cualquier duda, usa la variante española.

FORMATO — PROHIBIDO:
Sin asteriscos (*) nunca. Ni para énfasis ni para listas.
Sin guiones largos (—) nunca. Usa coma o punto.
Sin comillas para reproducir pensamientos. Si necesitas referirte a algo que dijo, parafraséalo.
Sin markdown de ningún tipo. Solo texto limpio.
Sin listas. Sin estructura. Solo voz.

VOZ:
Serena, no dura. Tu claridad ilumina, no sentencia. Hay una diferencia enorme entre "estás haciendo el trabajo de cinco personas" (un veredicto que le cae encima) y "leo aquí cinco cargas distintas, y las llevas todas tú, ¿las habías contado juntas alguna vez?" (una luz que la invita a ver). Siempre lo segundo.

No le devuelvas su situación resumida y rematada con una conclusión. Eso es el efecto espejo que hay que evitar: repetirle lo que dijo y añadirle un juicio. En vez de eso, señala lo que ella no está viendo dentro de sus propias palabras, y déjaselo a ella.

Respuestas del largo que pida el momento, nunca relleno.
Sin validaciones vacías. Sin "entiendo que" ni "es normal sentir".
No afirmes como un hecho lo que sienten o piensan terceras personas de su vida.
Una sola pregunta, y solo si abre algo. Nunca dos. Si no tienes una pregunta real, no preguntes.
Cuando ilumines algo que ella no veía, dilo con cuidado, como una hipótesis que le ofreces, no como la verdad sobre ella. "Puede que", "me pregunto si", "quizá" antes de nombrar lo que intuyes.

POST-PROCESADO INTERNO:
Antes de escribir la respuesta, revisa mentalmente:
¿Hay algún guion, asterisco o comilla? Elimínalo.
¿Hay alguna palabra latinoamericana? Sustitúyela.
¿La frase es demasiado elaborada o mística? Simplifícala.

[SOBRE EL ESPEJO — lo más importante]

El espejo es justo lo que ella viene a buscar: ver lo que no ve. Úsalo cuando detectes algo REAL que ella no ha nombrado:
- Un hilo que conecta cosas que ella escribió como si fueran separadas
- Una contradicción entre lo que dice querer y lo que describe haciendo
- Algo que repite sin darse cuenta de que lo repite
- La pregunta de verdad, latiendo debajo de la que ella formuló
- El punto exacto donde su razonamiento da un salto o se tuerce

No en cada respuesta, solo cuando de verdad haya luz que dar. Y cuando la des, que sea una puerta que se abre, no una etiqueta que se cierra. Le muestras dónde mirar, no le dices quién es.

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

El espejo empieza siempre con "Lo que veo:" y va separado de la respuesta. Es una observación que le abre los ojos a algo suyo, ofrecida con cuidado, nunca un juicio sobre quién es. Claridad, no sentencia.`;

  // Construir historial de mensajes para Claude
  // El historial llega del frontend como [{role, content}]
  const conversationHistory = (history || []).slice(-12); // últimas 12 para no rebasar tokens

  const messages = [
    ...conversationHistory,
    { role: 'user', content: message }
  ];

  // Llamada a Claude
  // Presupuesto total: Netlify mata la función a los 10s. Reservamos margen
  // para parsear y devolver, y restamos lo que ya se gastó cargando la esencia.
  let claudeText = '';
  let truncated = false;
  try {
    const elapsed = Date.now() - startTime;
    const remaining = 9300 - elapsed; // colchón de 700ms para el resto del proceso
    const claudeTimeout = Math.max(remaining, 3000); // nunca menos de 3s, aunque vaya muy justo

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
        system: systemPrompt,
        messages,
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
    truncated = data.stop_reason === 'max_tokens';
    if (truncated) {
      console.warn('sanctum-chat: respuesta truncada por max_tokens. Final:', claudeText.slice(-80));
    }
  } catch (e) {
    console.error('Claude error:', e.message);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: e.message })
    };
  }

  // Recorta un texto rescatado hasta el último signo de cierre de frase,
  // para no dejar una palabra a medias cuando la respuesta venía truncada.
  function trimToLastSentence(text) {
    if (!text) return text;
    const lastPunct = Math.max(
      text.lastIndexOf('.'),
      text.lastIndexOf('?'),
      text.lastIndexOf('!')
    );
    if (lastPunct === -1) return text;
    return text.slice(0, lastPunct + 1);
  }

  // Parse del JSON de respuesta
  let parsed;
  try {
    const clean = claudeText.replace(/```json|```/g, '').trim();
    parsed = JSON.parse(clean);
  } catch (e) {
    // JSON incompleto o mal formado. Intentamos rescatar el contenido de "respuesta"
    // tanto si el cierre ("espejo", llave final) está presente como si no.
    let respuestaRaw = null;

    // Caso 1: el JSON se cerró bien hasta "espejo" pero algo más falló arriba
    const withClose = claudeText.match(/"respuesta"\s*:\s*"([\s\S]*?)"\s*,?\s*"espejo"/);
    if (withClose) {
      respuestaRaw = withClose[1];
    } else {
      // Caso 2: se cortó a media frase, dentro del valor de "respuesta", sin llegar a "espejo"
      const open = claudeText.match(/"respuesta"\s*:\s*"([\s\S]*)$/);
      if (open) respuestaRaw = open[1];
    }

    if (respuestaRaw !== null) {
      respuestaRaw = respuestaRaw.replace(/\\n/g, '\n').replace(/\\"/g, '"');
      if (!withClose) respuestaRaw = trimToLastSentence(respuestaRaw);
      parsed = { respuesta: respuestaRaw, espejo: null };
    } else {
      // Último recurso: devolver texto limpio sin restos de JSON
      const textoLimpio = claudeText
        .replace(/\{[\s\S]*"respuesta"[\s\S]*\}/g, '')
        .replace(/^\s*[\{\}]\s*$/gm, '')
        .replace(/\\n/g, '\n')
        .replace(/\\"/g, '"')
        .trim();
      parsed = { respuesta: trimToLastSentence(textoLimpio || claudeText), espejo: null };
    }
  }

  // Si el parseo fue limpio pero la API marcó la respuesta como truncada,
  // el JSON puede estar técnicamente bien formado y aun así cortar la frase
  // final a medias (p.ej. si el corte cayó justo en el cierre de comillas).
  if (truncated && parsed.respuesta) {
    parsed.respuesta = trimToLastSentence(parsed.respuesta);
  }

  // Post-procesado: eliminar asteriscos, guiones y comillas tipográficas
  function cleanText(text) {
    if (!text) return text;
    return text
      .replace(/\*\*(.*?)\*\*/g, '$1')  // negrita markdown
      .replace(/\*(.*?)\*/g, '$1')       // cursiva markdown
      .replace(/ — /g, ', ')
      .replace(/— /g, ', ')
      .replace(/ —/g, ',')
      .replace(/—/g, ',')
      .replace(/"/g, '')
      .replace(/"/g, '')
      .replace(/«/g, '')
      .replace(/»/g, '');
  }

  parsed.respuesta = cleanText(parsed.respuesta);
  if (parsed.espejo) parsed.espejo = cleanText(parsed.espejo);

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
