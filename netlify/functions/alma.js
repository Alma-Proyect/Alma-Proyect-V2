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
  } = JSON.parse(event.body || "{}");

  if (!entry || entry.trim().length === 0) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: "No se recibió ningún texto." }),
    };
  }

  const currentTurn = turn || 1;
  const isLastTurn  = currentTurn >= MAX_TURNS_PER_DAY;

  // Construir historial de mensajes
  const messages = [];
  if (conversationHistory && conversationHistory.length > 0) {
    for (const t of conversationHistory) {
      messages.push({
        role: t.role === "alma" ? "assistant" : "user",
        content: t.text,
      });
    }
    messages.push({ role: "user", content: entry });
  } else {
    messages.push({
      role: "user",
      content: `La pregunta de hoy era: "${getQuestion(arrivalMode, day)}"\n\nEsto es lo que escribió:\n\n"${entry}"`,
    });
  }

  try {
    const response = await callAnthropic({
      system: getAlmaSystemPrompt(day, currentTurn, previousEntries, arrivalMode),
      messages,
      maxTokens: 400,
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
