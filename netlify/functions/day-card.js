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

  let conversationHistory, day;
  try {
    ({ conversationHistory, day } = JSON.parse(event.body || "{}"));
  } catch (e) {
    return { statusCode: 400, body: JSON.stringify({ error: "JSON inválido" }) };
  }

  if (!Array.isArray(conversationHistory) || !conversationHistory.length) {
    const fallback = FALLBACKS[Math.floor(Math.random() * FALLBACKS.length)];
    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ frase: fallback }),
    };
  }

  // Solo los turnos de la usuaria para que Alma observe desde lo que hay
  // Con tope: como mucho 8 mensajes de 2000 caracteres. Un día tiene 3 o 4
  // turnos, así que nunca se recorta nada real, pero nadie puede mandar un
  // texto enorme y hacer que pague Alma.
  const userTurns = conversationHistory
    .filter(t => t && t.role === "user" && typeof t.text === "string")
    .slice(-8)
    .map(t => t.text.slice(0, 2000))
    .join("\n\n");

  if (!userTurns.trim()) {
    const fallback = FALLBACKS[Math.floor(Math.random() * FALLBACKS.length)];
    return { statusCode: 200, headers: { "Content-Type": "application/json" }, body: JSON.stringify({ frase: fallback }) };
  }

  const diaNum = Number.isInteger(Number(day)) && Number(day) >= 1 && Number(day) <= 7 ? Number(day) : 1;
  const userMessage = `Día ${diaNum}. Esto es lo que escribió hoy:\n\n${userTurns}\n\nEscribe la frase para su libreta.`;

  try {
    const result = await callAnthropic({
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: userMessage }],
      maxTokens: 90,
      temperature: 0.8,
      plan: "free", // nunca se acepta del navegador: cualquiera podría pedir el modelo caro
    });

    // Limpiar por si Claude añade comillas o puntuación extra
    const clean = result.text
      .split("\n")[0]
      .replace(/^["«»""]|["«»""]$/g, "")
      .replace(/\.$/, "")
      .trim();
    if (!clean || clean.length > 200) throw new Error("Frase vacía o demasiado larga");

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ frase: clean }),
    };

  } catch (error) {
    console.error("Error en day-card.js:", error.message);
    const fallback = FALLBACKS[Math.floor(Math.random() * FALLBACKS.length)];
    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ frase: fallback }),
    };
  }
};
