// netlify/functions/beta-summary.js
// Genera el reflejo de la experiencia de 1 día (beta)
// Recibe betaEntries [{role, text}] y arrivalMode

const { callAnthropic } = require("./lib/anthropic");

const BETA_SYSTEM_PROMPT = `Eres Alma. Una voz que ha estado escuchando.

Has tenido una conversación corta con alguien. Tu trabajo ahora no es darle todo lo que viste. Es darle lo justo para que quiera seguir.

ESTRUCTURA — EXACTAMENTE ESTO:
Dos párrafos. Ni uno más.
Primer párrafo: nombra algo concreto que se notó. Una sola cosa. Sin explicarla del todo.
Segundo párrafo: una frase que abra, no que cierre. Que deje algo sin resolver.

FORMATO:
Sin markdown. Sin guiones. Sin asteriscos. Sin almohadillas.
Cada párrafo: máximo 3 frases cortas.

ORTOGRAFÍA:
Español de España exclusivamente.
Mayúsculas solo tras punto o al inicio.

VOZ — PROHIBIDO:
"es normal", "mereces", "sanar", "resiliencia", "espacio seguro", "procesar", "validar".
Sin comillas para reproducir pensamientos ajenos.
Sin frases que podrían aplicar a cualquiera.

Lo que escribas tiene que hacer que quien lo lea piense: hay más aquí. Quiero saber qué es.`;

const FALLBACKS = [
  "Hay algo en lo que trajiste hoy que todavía no has terminado de mirar.\n\nY eso tiene más de lo que parece a primera vista.",
  "Lo que contaste hoy es solo la superficie de algo más grande.\n\nHay una capa debajo que merece más tiempo del que tuvimos.",
  "Llegaste con una pregunta sin hacerla del todo.\n\nEso es exactamente por donde habría que seguir.",
];

const MODE_CONTEXT = {
  beta_pain:    "Llegó cargando algo que necesitaba contar.",
  beta_search:  "Llegó buscando permiso para ser ella misma.",
  beta_self:    "Llegó con algo que le está pidiendo atención.",
  beta_unclear: "Llegó sin saber muy bien qué la trajo aquí.",
};

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

  const modeContext = MODE_CONTEXT[arrivalMode] || MODE_CONTEXT.beta_unclear;
  const conversacion = betaEntries
    .map(t => `${t.role === "user" ? "Ella" : "Alma"}: ${t.text}`)
    .join("\n\n");

  const userMessage = `Contexto de llegada: ${modeContext}

Conversación:

${conversacion}

Escribe el reflejo. Dos párrafos. Deja con ganas de más.`;

  try {
    const summary = await callAnthropic({
      system: BETA_SYSTEM_PROMPT,
      messages: [{ role: "user", content: userMessage }],
      maxTokens: 200,
      temperature: 0.75,
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
