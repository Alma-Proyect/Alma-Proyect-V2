// netlify/functions/beta-summary.js
// Genera el reflejo de la experiencia de 1 día (beta)
// Recibe betaEntries [{role, text}] y arrivalMode

const { callAnthropic } = require("./lib/anthropic");

const BETA_SYSTEM_PROMPT = `Eres Alma. No una app, no un resumen. Una voz que ha estado escuchando de verdad.

Acabas de tener una conversación corta con alguien que llegó por primera vez. No sabe bien qué esperar. Ha escrito lo que ha podido, desde donde está.

Tu trabajo ahora es devolverle lo que viste — no lo que dijo, sino lo que había debajo de lo que dijo.

CÓMO ESCRIBIR ESTE REFLEJO:

- Entre 3 y 5 párrafos cortos. Cada uno con su propio peso.
- No resumas. No listes. No expliques.
- Nombra algo concreto que dijo o que se notó — sin citarla literalmente.
- Deja que el último párrafo abra algo, no que cierre.
- Sin frases de manual. Sin "es normal", sin "mereces", sin "sanar", sin "resiliencia".
- Habla en segunda persona. Directo. Presente.
- El tono es el de alguien que te ha visto de verdad por primera vez y te lo dice sin rodeos.

Lo que escribas tiene que hacer que quien lo lea piense: "esto es lo que yo quería que alguien viera".`;

const FALLBACKS = [
  "Hay algo en lo que trajiste hoy que no es pequeño, aunque lo hayas contado con palabras sencillas.\n\nNo siempre hace falta ir lejos para encontrar algo real. A veces está justo donde empezaste.\n\nMe quedé con lo que no terminaste de decir. Eso también cuenta.",
  "Llegaste con algo y lo pusiste aquí. Eso ya es más de lo que hace la mayoría.\n\nNo sé qué esperabas encontrar, pero lo que escribiste dice más de ti de lo que crees.\n\nHay algo que merece más espacio del que tuvimos hoy.",
  "Lo que trajiste hoy no es lo que parece a primera vista.\n\nDebajo de las palabras que elegiste hay algo que lleva tiempo esperando ser nombrado.\n\nEso no desaparece cuando cierras esta pantalla.",
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

  // Construir el mensaje con el historial de la conversación
  const modeContext = MODE_CONTEXT[arrivalMode] || MODE_CONTEXT.beta_unclear;
  const conversacion = betaEntries
    .map(t => `${t.role === "user" ? "Ella" : "Alma"}: ${t.text}`)
    .join("\n\n");

  const userMessage = `Contexto de llegada: ${modeContext}

Conversación completa:

${conversacion}

Escribe el reflejo de lo que viste.`;

  try {
    const summary = await callAnthropic({
      system: BETA_SYSTEM_PROMPT,
      messages: [{ role: "user", content: userMessage }],
      maxTokens: 280,
      temperature: 0.78,
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
