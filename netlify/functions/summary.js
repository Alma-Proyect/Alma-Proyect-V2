// netlify/functions/beta-summary.js
// Genera el reflejo del día beta — breve, sin PDF, diseñado para enganchar

const { callAnthropic } = require("./lib/anthropic");
const { BETA_SUMMARY_SYSTEM_PROMPT, getBetaSummaryUserMessage } = require("./lib/prompts");

const FALLBACKS = [
  "Hay algo en lo que escribiste que no suena a queja ni a miedo.\nSuena a algo que llevas tiempo sabiendo y que hoy, por fin, dejaste salir un poco.\nEso no es pequeño.",
  "Lo que dijiste hoy no es fácil de decir.\nNo porque sea dramático — sino porque es tuyo de verdad.\nY eso que es tuyo de verdad merece más que un día.",
  "Escribiste desde un sitio real.\nNo desde lo que creías que había que decir — desde lo que hay.\nEso es lo más difícil, y lo hiciste.",
];

exports.handler = async function (event) {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  const { betaEntries, arrivalMode, plan } = JSON.parse(event.body || "{}");

  if (!betaEntries || betaEntries.length === 0) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: "No se recibieron entradas." }),
    };
  }

  try {
    const summary = await callAnthropic({
      system: BETA_SUMMARY_SYSTEM_PROMPT,
      messages: [{ role: "user", content: getBetaSummaryUserMessage(betaEntries, arrivalMode) }],
      maxTokens: 180,
      temperature: 0.8,
      plan: plan || "free",
    });

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
