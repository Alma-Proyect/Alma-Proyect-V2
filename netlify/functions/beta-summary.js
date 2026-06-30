// netlify/functions/beta-summary.js
// Genera el reflejo de la experiencia de 1 día (beta)
// Usa el prompt y el mensaje definidos en lib/prompts.js

const { callAnthropic } = require("./lib/anthropic");
const { BETA_SUMMARY_SYSTEM_PROMPT, getBetaSummaryUserMessage } = require("./lib/prompts");

// Si la respuesta llegó truncada por tope de tokens, recorta hasta el último
// signo de puntuación de cierre de frase para no dejar una palabra a medias.
function cleanIfTruncated(text, truncated) {
  if (!truncated) return text;
  const lastPunct = Math.max(
    text.lastIndexOf("."),
    text.lastIndexOf("?"),
    text.lastIndexOf("!")
  );
  if (lastPunct === -1) return text;
  return text.slice(0, lastPunct + 1);
}

const FALLBACKS = [
  "Hay algo en lo que trajiste hoy que todavía no has terminado de mirar.\n\nY eso tiene más de lo que parece a primera vista.",
  "Lo que contaste hoy es solo la superficie de algo más grande.\n\nHay una capa debajo que merece más tiempo del que tuvimos.",
  "Llegaste con una pregunta sin hacerla del todo.\n\nEso es exactamente por donde habría que seguir.",
];

exports.handler = async function (event) {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  let betaEntries, arrivalMode, plan;
  try {
    ({ betaEntries, arrivalMode, plan } = JSON.parse(event.body || "{}"));
  } catch (e) {
    return { statusCode: 400, body: JSON.stringify({ error: "JSON inválido" }) };
  }

  if (!betaEntries || !betaEntries.length) {
    return { statusCode: 400, body: JSON.stringify({ error: "Sin entradas." }) };
  }

  try {
    const result = await callAnthropic({
      system: BETA_SUMMARY_SYSTEM_PROMPT,
      messages: [{ role: "user", content: getBetaSummaryUserMessage(betaEntries, arrivalMode) }],
      maxTokens: 200,
      temperature: 0.75,
      plan: plan || "free",
    });

    const summary = cleanIfTruncated(result.text, result.truncated);

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ summary }),
    };

  } catch (error) {
    console.error("Error en beta-summary.js:", error);
    const fallback = FALLBACKS[Math.floor(Math.random() * FALLBACKS.length)];
    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ summary: fallback }),
    };
  }
};
