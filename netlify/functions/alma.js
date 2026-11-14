// netlify/functions/alma.js
// Llama a la API de Anthropic y devuelve la respuesta completa en JSON.
// El efecto de escritura palabra a palabra lo hace el typewriter en el frontend.

const { getAlmaSystemPrompt } = require("./lib/prompts");
const { getQuestion, getBetaQuestion, MAX_TURNS_PER_DAY } = require("./lib/questions");
const { callAnthropic } = require("./lib/anthropic");
const { getGuardiana, resolverPuerta } = require("./lib/guardianas");
const { limpiarRespuesta, tienePreguntaConOpciones } = require("./lib/sanitize");
const { RECORDATORIO_FINAL } = require("./lib/prompts");
const { consultarLibre, sumarLibre, LIMITE_LIBRE_DIA } = require("./lib/limite");

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const MAX_MENSAJES_LIBRES_EN_HILO = 10; // pares ella/Alma que se le recuerdan

// Esencia del Sanctum: si tarda más de 0,8 s, Alma responde sin ella
async function leerEsencia() {
  try {
    const c = new AbortController();
    const t = setTimeout(() => c.abort(), 800);
    const r = await fetch(`${process.env.URL}/.netlify/functions/sanctum-essence`, {
      headers: { "x-sanctum-key": process.env.SANCTUM_SECRET }, signal: c.signal,
    });
    clearTimeout(t);
    if (r.ok) return (await r.json()).essence || null;
  } catch (e) {}
  return null;
}

// ── CONVERSACIÓN LIBRE (después de los 7 días) ─────────────────────────
// Vuelve con su guardiana cuando lo necesita. Sin días ni turnos, con un
// límite de mensajes al día (lib/limite.js). Lo que escribe no se guarda en
// el servidor: solo el contador.
async function atenderLibre(datos, inicio, puerta, capaGuardiana, arrivalMode) {
  const json = (o) => ({ statusCode: 200, headers: { "Content-Type": "application/json" }, body: JSON.stringify(o) });
  const anonId = String(datos.anonId || "");
  if (!UUID_RE.test(anonId)) {
    return { statusCode: 400, body: JSON.stringify({ error: "Identificador inválido" }) };
  }
  const estado = await consultarLibre(anonId);
  if (!estado.permitido) return json({ limite: true, restantes: 0, limiteDia: LIMITE_LIBRE_DIA });

  const entry = datos.entry.slice(0, MAX_CHARS_ENTRADA);
  const historial = limpiarHistorial(datos.conversationHistory, MAX_MENSAJES_LIBRES_EN_HILO);
  const reflejo = typeof datos.reflejo === "string" ? datos.reflejo.slice(0, 4000) : "";
  const messages = historial.map(t => ({ role: t.role === "alma" ? "assistant" : "user", content: t.text }));
  // La conversación tiene que empezar por ella
  while (messages.length && messages[0].role !== "user") messages.shift();
  messages.push({ role: "user", content: messages.length ? entry : `Vuelve a escribirte. Esto es lo que escribe:\n\n"${entry}"` });

  try {
    const essence = await leerEsencia();
    const result = await callAnthropic({
      system: getAlmaSystemPrompt(1, 1, {}, capaGuardiana ? null : arrivalMode, essence, { libre: true, reflejo })
        + (capaGuardiana ? "\n\n" + capaGuardiana : "") + "\n\n" + RECORDATORIO_FINAL,
      messages,
      maxTokens: 320,
      temperature: 0.85,
      plan: "free",
      timeoutMs: 8800 - (Date.now() - inicio), // deja margen para guardar el contador
    });
    const response = limpiarRespuesta(cleanIfTruncated(result.text, result.truncated));
    if (!response.trim()) throw new Error("Respuesta vacía");
    if (tienePreguntaConOpciones(response)) console.warn(`Pregunta con opciones (puerta: ${puerta || "ninguna"}, libre)`);
    const restantes = await sumarLibre(anonId, estado);
    return json({ response, restantes, limiteDia: LIMITE_LIBRE_DIA });
  } catch (e) {
    console.error("Error en alma.js (libre):", e.message);
    // No se cuenta: si Alma no respondió, el mensaje no gasta
    return json({ error: true, restantes: Math.max(0, LIMITE_LIBRE_DIA - estado.usados) });
  }
}

// Si la respuesta llegó truncada por tope de tokens, recorta hasta el último
// signo de puntuación de cierre de frase para no dejar una palabra a medias.
function cleanIfTruncated(text, truncated) {
  if (!truncated) return text;
  const lastPunct = Math.max(
    text.lastIndexOf("."),
    text.lastIndexOf("?"),
    text.lastIndexOf("!")
  );
  if (lastPunct === -1) return text; // no hay donde cortar limpio, se deja igual
  return text.slice(0, lastPunct + 1);
}

// ── Límites de lo que se acepta del navegador ───────────────────────────
// La app nunca manda más que esto (los cuadros tienen maxlength). Si llega
// más, es alguien llamando a la función a mano: se recorta para que cada
// llamada cueste como una normal. El turno y el tramo se validan aquí, no
// se fían del navegador.
const MAX_CHARS_ENTRADA = 2000;       // cuadro principal 2000, respuestas 1000
const MAX_CHARS_DIA_ANTERIOR = 8000;  // el día 1 que viene de la beta junta 4 entradas
const MAX_TURNOS_BETA = 4;
const TRAMOS_VALIDOS = [3, 5, 7];

function entero(valor, min, max, porDefecto) {
  const n = parseInt(valor, 10);
  if (isNaN(n)) return porDefecto;
  return Math.min(max, Math.max(min, n));
}

function limpiarHistorial(historial, maxTurns) {
  if (!Array.isArray(historial)) return [];
  return historial
    .filter(t => t && (t.role === "user" || t.role === "alma") && typeof t.text === "string")
    .slice(-(maxTurns * 2))
    .map(t => ({ role: t.role, text: t.text.slice(0, MAX_CHARS_ENTRADA) }));
}

function limpiarDiasAnteriores(prev) {
  const limpio = {};
  if (!prev || typeof prev !== "object") return limpio;
  for (let i = 1; i <= 6; i++) {
    const v = prev["day" + i];
    if (typeof v === "string" && v.trim()) limpio["day" + i] = v.slice(0, MAX_CHARS_DIA_ANTERIOR);
  }
  return limpio;
}

const FALLBACKS = [
  "Algo en lo que escribiste me hizo pararme.\n\nNecesito un momento para estar con esto contigo.\n\nEstoy aquí.",
  "Lo que acabas de escribir tiene peso.\n\nNo quiero responder deprisa.\n\nEstoy aquí.",
  "Hay cosas que no necesitan respuesta inmediata.\n\nEsto es una de ellas.\n\nMe quedo con lo que dijiste.",
];

exports.handler = async function (event) {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  const inicio = Date.now(); // Netlify corta a los 10 s: llevamos la cuenta
  let datos;
  try {
    datos = JSON.parse(event.body || "{}");
  } catch (e) {
    return { statusCode: 400, body: JSON.stringify({ error: "JSON inválido" }) };
  }
  const { arrivalMode, questionSet } = datos;
  // La puerta por la que entró (nudos, sinsaber, agotada, volver) decide su
  // guardiana para todo el recorrido. Las opciones antiguas se traducen a la
  // puerta más cercana.
  const puerta = resolverPuerta(datos.puerta, arrivalMode);
  const capaGuardiana = getGuardiana(puerta);
  const isBeta = datos.isBeta === true;

  if (typeof datos.entry !== "string" || datos.entry.trim().length === 0) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: "No se recibió ningún texto." }),
    };
  }

  if (datos.modo === "libre") return atenderLibre(datos, inicio, puerta, capaGuardiana, arrivalMode);

  const maxTurns    = isBeta ? entero(datos.betaMaxTurns, 1, MAX_TURNOS_BETA, MAX_TURNOS_BETA) : MAX_TURNS_PER_DAY;
  const currentTurn = entero(datos.turn, 1, maxTurns, 1);
  const isLastTurn  = currentTurn >= maxTurns;
  const day         = isBeta ? 1 : entero(datos.day, 1, 7, 1);
  const tramo       = TRAMOS_VALIDOS.includes(Number(datos.tramo)) ? Number(datos.tramo) : 3;
  const entry       = datos.entry.slice(0, MAX_CHARS_ENTRADA);
  const conversationHistory = limpiarHistorial(datos.conversationHistory, maxTurns);
  const previousEntries     = limpiarDiasAnteriores(datos.previousEntries);

  // La pregunta que de verdad vio la usuaria. En la beta (ids beta_*) viene de su propio
  // banco; antes caía al primer elemento del banco "pain" y Alma recibía una pregunta
  // distinta a la que se había mostrado en pantalla.
  const preguntaDeHoy = isBeta
    ? getBetaQuestion(arrivalMode)
    : getQuestion(arrivalMode, day, questionSet);

  // Construir historial de mensajes — solo lo esencial para no superar el timeout
  const messages = [];
  if (conversationHistory && conversationHistory.length > 0) {
    // Mandar todos los turnos del día para mantener el hilo completo
    for (const t of conversationHistory) {
      messages.push({
        role: t.role === "alma" ? "assistant" : "user",
        content: t.text,
      });
    }
    // Si es el último turno, indicárselo explícitamente en el mensaje
    const lastTurnNote = isLastTurn
      ? "\n\n[INSTRUCCIÓN DE CIERRE: Este es el último intercambio del día. No hay más turnos después de este. Cierra como una amiga que se queda pensando en lo que acaba de escuchar — con ganas reales de mañana. Nada de frases de app. Nada de hasta mañana mecánico. Solo presencia y algo que la llame de vuelta.]"
      : "";
    messages.push({ role: "user", content: entry + lastTurnNote });
  } else {
    messages.push({
      role: "user",
      content: `La pregunta de hoy era: "${preguntaDeHoy}"\n\nEsto es lo que escribió:\n\n"${entry}"`,
    });
  }

  try {
    // Leer esencia del Sanctum — voz de la guardiana
    // Timeout corto: si tarda, seguimos sin esencia para no arriesgar el timeout total
    let essence = null;
    try {
      const essController = new AbortController();
      const essTimeout = setTimeout(() => essController.abort(), 800);
      const essRes = await fetch(`${process.env.URL}/.netlify/functions/sanctum-essence`, {
        headers: { 'x-sanctum-key': process.env.SANCTUM_SECRET },
        signal: essController.signal,
      });
      clearTimeout(essTimeout);
      if (essRes.ok) {
        const essData = await essRes.json();
        essence = essData.essence || null;
      }
    } catch(e) {
      // Si no hay esencia disponible o tarda demasiado, Alma funciona igual sin ella
    }

    const result = await callAnthropic({
      // Con guardiana, su capa sustituye a la descripción genérica del modo de
      // llegada (que podía contradecirla: «curiosidad, con ligereza» frente a
      // Ítaca). Sin guardiana, todo sigue como antes.
      system: getAlmaSystemPrompt(day, currentTurn, previousEntries, capaGuardiana ? null : arrivalMode, essence, {
        maxTurns, tramo: Math.max(tramo, day), isBeta,
      }) + (capaGuardiana ? "\n\n" + capaGuardiana : "") + "\n\n" + RECORDATORIO_FINAL,
      messages,
      maxTokens: 320,
      temperature: 0.85,
      plan: "free", // nunca lo decide el navegador
      // Lo que queda hasta los ~9,3 s, descontando la espera a la esencia:
      // así siempre da tiempo a responder (aunque sea con el mensaje de
      // reserva) antes de que Netlify corte a los 10 s.
      timeoutMs: 9300 - (Date.now() - inicio),
    });

    const response = limpiarRespuesta(cleanIfTruncated(result.text, result.truncated));
    if (tienePreguntaConOpciones(response)) {
      // Solo el aviso, nunca el texto: lo que escribe ella es privado
      console.warn(`Pregunta con opciones (puerta: ${puerta || "ninguna"}, día ${day}, turno ${currentTurn})`);
    }

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        response,
        isLastTurn,
        turnsLeft: maxTurns - currentTurn,
      }),
    };
  } catch (error) {
    console.error("Error en alma.js:", error);
    const fallback = FALLBACKS[Math.floor(Math.random() * FALLBACKS.length)];
    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        response: fallback,
        isLastTurn,
        turnsLeft: maxTurns - currentTurn,
      }),
    };
  }
};
