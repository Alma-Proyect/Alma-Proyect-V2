// netlify/functions/summary.js
// Genera el reflejo de cada tramo (3 o 5 días) y el reflejo final (7 días).
// Recibe el historial completo de los días con todos los turnos.

const { callAnthropic } = require("./lib/anthropic");
const { SUMMARY_SYSTEM_PROMPT, SUMMARY_TOTAL_SYSTEM_PROMPT, getSummaryUserMessage, notaReflejo } = require("./lib/prompts");
const { resolverPuerta } = require("./lib/guardianas");
const { getQuestion } = require("./lib/questions");
const { limpiarReflejo } = require("./lib/sanitize");

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

// ── Límites de lo que se acepta del navegador ───────────────────────────
// La app nunca manda más que esto. Si llega más, se recorta para que cada
// llamada cueste como una normal.
const MAX_CHARS_TEXTO = 8000;   // el día 1 que viene de la beta junta varias entradas
const MAX_MENSAJES_DIA = 8;     // beta: 4 de ella + 4 de Alma

function limpiarEntradas(entries) {
  const limpio = {};
  if (!entries || typeof entries !== "object") return limpio;
  for (let i = 1; i <= 7; i++) {
    const d = entries["day" + i];
    if (d === undefined) continue;
    if (d === null) { limpio["day" + i] = null; continue; }
    if (typeof d === "string") { limpio["day" + i] = d.slice(0, MAX_CHARS_TEXTO); continue; }
    if (Array.isArray(d)) {
      limpio["day" + i] = d
        .filter(t => t && (t.role === "user" || t.role === "alma") && typeof t.text === "string")
        .slice(0, MAX_MENSAJES_DIA)
        .map(t => ({ role: t.role, text: t.text.slice(0, MAX_CHARS_TEXTO) }));
    }
  }
  return limpio;
}

// Si el reflejo no se puede escribir, se devuelve un error y NO un texto
// genérico. Antes se devolvía un «reflejo» de plantilla («Tres días. Tres
// preguntas…», aunque fueran cinco o siete) que la app guardaba para siempre
// como lo que Alma vio en ella, y acababa en su carta y en Tu refugio. Ahora la
// app le dice la verdad («hoy no he podido escribirte tu reflejo») y lo
// vuelve a intentar cuando ella lo pida.
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
  const { arrivalMode, questionSet, reflejoTotal } = datos;
  const puerta = resolverPuerta(datos.puerta, arrivalMode); // su guardiana
  const entries = limpiarEntradas(datos.entries);

  if (!entries.day1) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: "No se recibieron entradas." }),
    };
  }

  try {
    const esTotal = reflejoTotal === true;
    const result = await callAnthropic({
      system: (esTotal ? SUMMARY_TOTAL_SYSTEM_PROMPT : SUMMARY_SYSTEM_PROMPT) + notaReflejo(puerta),
      messages: [{ role: "user", content: getSummaryUserMessage(entries, arrivalMode, questionSet, esTotal) }],
      maxTokens: esTotal ? 520 : 360,
      temperature: 0.78,
      plan: "free", // nunca lo decide el navegador
    });

    const summary = limpiarReflejo(cleanIfTruncated(result.text, result.truncated));
    if (!summary || !summary.trim()) throw new Error("Reflejo vacío");

    // Generamos también el texto listo para descargar
    const downloadText = buildDownloadText(entries, summary, arrivalMode, questionSet);

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ summary, downloadText }),
    };
  } catch (error) {
    console.error("Error en summary.js:", error.message);
    return {
      statusCode: 503,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ error: "Reflejo no disponible ahora mismo" }),
    };
  }
};

// ─────────────────────────────────────────────
// Construye el texto completo para descargar
// Incluye las preguntas, lo que escribió la usuaria,
// y el reflejo de Alma al final
// ─────────────────────────────────────────────
function buildDownloadText(entries, summary, arrivalMode, questionSet) {
  const fecha = new Date().toLocaleDateString("es-ES", {
    weekday: "long", day: "numeric", month: "long", year: "numeric"
  });

  const mode = arrivalMode || "pain";
  const sep = "─".repeat(40);

  function formatDayForDownload(dayEntries, pregunta, numDia) {
    if (!dayEntries) return `DÍA ${numDia}\n${pregunta}\n\n(Este día elegiste no escribir)\n`;
    if (typeof dayEntries === "string") {
      return `DÍA ${numDia}\n${pregunta}\n\n${dayEntries}\n`;
    }
    const lines = dayEntries
      .filter(t => t.role === "user")
      .map(t => t.text)
      .join("\n\n");
    return `DÍA ${numDia}\n${pregunta}\n\n${lines}\n`;
  }

  // Recorre todos los días presentes, sean 3, 5 o 7.
  let dias = "";
  for (let i = 1; i <= 7; i++) {
    if (entries["day" + i] === undefined) continue;
    dias += `\n${formatDayForDownload(entries["day" + i], getQuestion(mode, i, questionSet), i)}\n${sep}\n`;
  }

  return `ALMA PROYECT · Tu espacio emocional
${fecha}
${sep}
${dias}
LO QUE ALMA VIO

${summary}

${sep}
alma proyect · tu espacio emocional
`;
}
