// netlify/functions/alma.js
// Llama a la API de Anthropic y devuelve la respuesta completa en JSON.
// El efecto de escritura palabra a palabra lo hace el typewriter en el frontend.

const { getAlmaSystemPrompt } = require("./lib/prompts");
const { getQuestion, MAX_TURNS_PER_DAY } = require("./lib/questions");
const { callAnthropic } = require("./lib/anthropic");

const FALLBACKS = [
  "Algo en lo que escribiste me hizo pararme.\n\nNecesito un momento para estar con esto contigo.\n\nEstoy aquí.",
  "Lo que acabas de escribir tiene peso.\n\nNo quiero responder deprisa.\n\nEstoy aquí.",
  "Hay cosas que no necesitan respuesta inmediata.\n\nEsto es una de ellas.\n\nMe quedo con lo que dijiste.",
];

exports.handler = async function (event) {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  const {
    day,
    turn,
    entry,
    conversationHistory,
    previousEntries,
    arrivalMode,
    plan,
    questionSet,
    isBeta,
    betaMaxTurns,
  } = JSON.parse(event.body || "{}");

  if (!entry || entry.trim().length === 0) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: "No se recibió ningún texto." }),
    };
  }

  const currentTurn = turn || 1;
  const maxTurns    = (isBeta && betaMaxTurns) ? betaMaxTurns : MAX_TURNS_PER_DAY;
  const isLastTurn  = currentTurn >= maxTurns;

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
      content: `La pregunta de hoy era: "${getQuestion(arrivalMode, day, questionSet)}"\n\nEsto es lo que escribió:\n\n"${entry}"`,
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

    const response = await callAnthropic({
      system: getAlmaSystemPrompt(day, currentTurn, previousEntries, arrivalMode, essence),
      messages,
      maxTokens: 200,
      temperature: 0.85,
      plan: plan || "free",
    });

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        response,
        isLastTurn,
        turnsLeft: MAX_TURNS_PER_DAY - currentTurn,
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
        turnsLeft: MAX_TURNS_PER_DAY - currentTurn,
      }),
    };
  }
};
