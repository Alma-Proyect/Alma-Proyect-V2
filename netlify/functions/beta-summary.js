// netlify/functions/beta-summary.js
// Genera el reflejo del día de prueba: breve, sin PDF.
//
// Antes este reflejo nunca se escribía de verdad: pedía a prompts.js un prompt
// que no existía, fallaba, y todas recibían uno de tres textos de reserva
// iguales para todas. Ahora el prompt existe (BETA_SUMMARY_SYSTEM_PROMPT) y
// sabe qué guardiana la acompaña. Si falla, devuelve un error y la app le
// dice la verdad, en vez de darle un reflejo genérico como si fuera suyo.

const { callAnthropic } = require("./lib/anthropic");
const { BETA_SUMMARY_SYSTEM_PROMPT, getBetaSummaryUserMessage, notaReflejo } = require("./lib/prompts");
const { getBetaQuestion } = require("./lib/questions");
const { resolverPuerta } = require("./lib/guardianas");
const { limpiarReflejo } = require("./lib/sanitize");

const MAX_CHARS_TEXTO = 2000;
const MAX_MENSAJES = 8; // 4 de ella + 4 de Alma

function cleanIfTruncated(text, truncated) {
  if (!truncated) return text;
  const lastPunct = Math.max(text.lastIndexOf("."), text.lastIndexOf("?"), text.lastIndexOf("!"));
  return lastPunct === -1 ? text : text.slice(0, lastPunct + 1);
}

exports.handler = async function (event) {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  let datos;
  try {
    datos = JSON.parse(event.body || "{}");
  } catch (e) {
    return { statusCode: 400, body: JSON.stringify({ error: "JSON inválido" }) };
  }

  const betaEntries = (Array.isArray(datos.betaEntries) ? datos.betaEntries : [])
    .filter(t => t && (t.role === "user" || t.role === "alma") && typeof t.text === "string")
    .slice(0, MAX_MENSAJES)
    .map(t => ({ role: t.role, text: t.text.slice(0, MAX_CHARS_TEXTO) }));

  if (!betaEntries.some(t => t.role === "user")) {
    return { statusCode: 400, body: JSON.stringify({ error: "No se recibieron entradas." }) };
  }

  const puerta = resolverPuerta(datos.puerta, datos.arrivalMode);
  const pregunta = getBetaQuestion(puerta || datos.arrivalMode);

  try {
    const result = await callAnthropic({
      system: BETA_SUMMARY_SYSTEM_PROMPT + notaReflejo(puerta),
      messages: [{ role: "user", content: getBetaSummaryUserMessage(betaEntries, pregunta) }],
      maxTokens: 260,
      temperature: 0.8,
      plan: "free", // nunca lo decide el navegador
    });

    const summary = limpiarReflejo(cleanIfTruncated(result.text, result.truncated));
    if (!summary || !summary.trim()) throw new Error("Reflejo vacío");

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ summary }),
    };
  } catch (error) {
    console.error("Error en beta-summary.js:", error.message);
    return {
      statusCode: 503,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ error: "Reflejo no disponible ahora mismo" }),
    };
  }
};
