// lib/anthropic.js
// Llamada compartida a la API de Anthropic

// ── MODELOS POR NIVEL ──────────────────────────────────────────────────────
// "free" → Haiku   (rápido, eficiente, nivel gratuito)
// "pro"  → Sonnet  (más profundo, nivel de pago)
// Para activar Sonnet: cambia el plan de la usuaria a "pro"
// No hay que tocar nada más.
const MODELS = {
  free: "claude-haiku-4-5-20251001",
  pro:  "claude-sonnet-4-6",
};

function getModel(plan) {
  return MODELS[plan] || MODELS.free;
}

// callAnthropic — para summary.js (sin streaming, respuesta completa)
// Timeout interno de 9s: Netlify mata la función a los 10s, así que cortamos
// antes nosotros para poder devolver un fallback limpio en vez de un 502 mudo.
async function callAnthropic({ system, messages, userMessage, maxTokens = 300, temperature = 0.75, plan = "free" }) {
  const model = getModel(plan);
  const finalMessages = messages || [{ role: "user", content: userMessage }];

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 9000);

  let response;
  try {
    response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model,
        max_tokens: maxTokens,
        temperature,
        system,
        messages: finalMessages,
      }),
      signal: controller.signal,
    });
  } catch (err) {
    if (err.name === "AbortError") {
      throw new Error("Timeout: la API de Anthropic no respondió a tiempo");
    }
    throw err;
  } finally {
    clearTimeout(timeout);
  }

  let data;
  try {
    data = await response.json();
  } catch (err) {
    throw new Error(`Respuesta no válida de la API (status ${response.status})`);
  }

  if (!response.ok) {
    throw new Error(data.error?.message || "Error en la API de Anthropic");
  }

  const text = data.content?.[0]?.text || "";
  const truncated = data.stop_reason === "max_tokens";

  if (truncated) {
    console.warn(`Respuesta truncada por max_tokens (límite: ${maxTokens}). Texto cortado:`, text.slice(-80));
  }

  return { text, truncated };
}

module.exports = { callAnthropic, MODELS, getModel };
