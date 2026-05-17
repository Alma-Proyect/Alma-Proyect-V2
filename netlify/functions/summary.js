// netlify/functions/summary.js
// Genera el reflejo final de los tres días — descargable
// Recibe el historial completo de los tres días con todos los turnos

const { callAnthropic } = require("./lib/anthropic");
const { SUMMARY_SYSTEM_PROMPT, getSummaryUserMessage } = require("./lib/prompts");

const FALLBACKS = [
  "Algo cambió esta semana. No sé si tú lo notaste, pero estaba en tus palabras.\n\nHay una honestidad en lo que escribiste que no todo el mundo se permite.\n\nEso no es pequeño.",
  "Escribiste sobre cosas que normalmente se quedan dentro.\n\nEso ya es un acto.\n\nNo sé qué vas a hacer con todo esto, pero me alegra que lo hayas puesto en palabras.",
  "Tres días. Tres preguntas. Muchas capas.\n\nLo que más me quedó es la forma en que te buscas — aunque a veces no sepas que lo estás haciendo.\n\nSigue así.",
];

exports.handler = async function (event) {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  const { entries, plan, arrivalMode } = JSON.parse(event.body || "{}");

  if (!entries || !entries.day1) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: "No se recibieron entradas." }),
    };
  }

  try {
    const summary = await callAnthropic({
      system: SUMMARY_SYSTEM_PROMPT,
      messages: [{ role: "user", content: getSummaryUserMessage(entries, arrivalMode) }],
      maxTokens: 300,
      temperature: 0.75,
      plan: plan || "free",
    });

    // Generamos también el texto listo para descargar
    const downloadText = buildDownloadText(entries, summary);

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ summary, downloadText }),
    };
  } catch (error) {
    console.error("Error en summary.js:", error);
    const fallback = FALLBACKS[Math.floor(Math.random() * FALLBACKS.length)];
    const downloadText = buildDownloadText(entries, fallback);
    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ summary: fallback, downloadText }),
    };
  }
};

// ─────────────────────────────────────────────
// Construye el texto completo para descargar
// Incluye las preguntas, lo que escribió la usuaria,
// y el reflejo de Alma al final
// ─────────────────────────────────────────────
function buildDownloadText(entries, summary) {
  const fecha = new Date().toLocaleDateString("es-ES", {
    weekday: "long", day: "numeric", month: "long", year: "numeric"
  });

  const PREGUNTAS = {
    1: "¿Hay algo que llevas dentro y que casi nunca dices en voz alta?",
    2: "¿Recuerdas la última vez que hiciste algo solo para ti, sin sentir que tenías que justificarlo?",
    3: "Si te hablaras como hablarías a alguien a quien quieres, ¿qué sería diferente?",
  };

  function formatDayForDownload(dayEntries, pregunta, numDia) {
    if (!dayEntries) return `DÍA ${numDia}\n${pregunta}\n\n(Este día elegiste no escribir)\n`;
    if (typeof dayEntries === "string") {
      return `DÍA ${numDia}\n${pregunta}\n\n${dayEntries}\n`;
    }
    // Array de turnos
    const lines = dayEntries
      .filter(t => t.role === "user")
      .map(t => t.text)
      .join("\n\n");
    return `DÍA ${numDia}\n${pregunta}\n\n${lines}\n`;
  }

  return `ALMA PROYECT · Tu espacio emocional
${fecha}
${"─".repeat(40)}

${formatDayForDownload(entries.day1, PREGUNTAS[1], 1)}
${"─".repeat(40)}

${formatDayForDownload(entries.day2, PREGUNTAS[2], 2)}
${"─".repeat(40)}

${formatDayForDownload(entries.day3, PREGUNTAS[3], 3)}
${"─".repeat(40)}

LO QUE ALMA VIO

${summary}

${"─".repeat(40)}
alma proyect · tu espacio emocional
`;
}
