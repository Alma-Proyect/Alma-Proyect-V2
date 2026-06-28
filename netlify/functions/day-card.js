// netlify/functions/day-card.js
// Genera la frase que Alma escribe en la tarjeta al final de cada día.
// Recibe el historial de conversación del día y devuelve una frase corta.

const { callAnthropic } = require("./lib/anthropic");

const SYSTEM_PROMPT = `Eres Alma. Al final de cada día de escritura, escribes una sola frase en la libreta de la usuaria.

Esta frase es lo que viste en ella hoy. No un resumen. No un consejo. Una observación real, concreta, que solo alguien que la escuchó de verdad podría escribir.

REGLAS:
- Una sola frase. Máximo 20 palabras.
- Empieza con "Hoy vi" o "Hoy escuché" o "Hoy noté" — nunca con "Hoy elijo" ni con el nombre de la usuaria.
- Habla de algo concreto que dijo o que se notó — no de emociones genéricas.
- Sin comillas. Sin puntos suspensivos. Sin guiones.
- Español de España. Mayúsculas solo al inicio.
- No uses: "sanar", "resiliencia", "espacio seguro", "duele" (usa: pesa, cuesta, cansa).
- Si no hay material real, escribe algo honesto sobre el hecho de haber llegado.

Devuelve SOLO la frase. Sin explicación, sin preamble, sin comillas.`;

const FALLBACKS = [
  "Hoy vi a alguien que llegó aunque podría no haberlo hecho.",
  "Hoy noté que hay algo que llevas tiempo sin decirte a ti misma.",
  "Hoy escuché más en lo que no dijiste que en lo que sí escribiste.",
];

exports.handler = async function (event) {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  let conversationHistory, day, arrivalMode, plan;
  try {
    ({ conversationHistory, day, arrivalMode, plan } = JSON.parse(event.body || "{}"));
  } catch (e) {
    return { statusCode: 400, body: JSON.stringify({ error: "JSON inválido" }) };
  }

  if (!conversationHistory || !conversationHistory.length) {
    const fallback = FALLBACKS[Math.floor(Math.random() * FALLBACKS.length)];
    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ frase: fallback }),
    };
  }

  // Solo los turnos de la usuaria para que Alma observe desde lo que hay
  const userTurns = conversationHistory
    .filter(t => t.role === "user")
    .map(t => t.text)
    .join("\n\n");

  const userMessage = `Día ${day || 1}. Esto es lo que escribió hoy:\n\n${userTurns}\n\nEscribe la frase para su libreta.`;

  try {
    const frase = await callAnthropic({
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: userMessage }],
      maxTokens: 60,
      temperature: 0.8,
      plan: plan || "free",
    });

    // Limpiar por si Claude añade comillas o puntuación extra
    const clean = frase
      .replace(/^["«»""]|["«»""]$/g, "")
      .replace(/\.$/, "")
      .trim();

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ frase: clean }),
    };

  } catch (error) {
    console.error("Error en day-card.js:", error);
    const fallback = FALLBACKS[Math.floor(Math.random() * FALLBACKS.length)];
    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ frase: fallback }),
    };
  }
};
