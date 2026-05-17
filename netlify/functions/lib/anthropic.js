// lib/anthropic.js
// Llamada compartida a la API de Anthropic

// ── MODELOS POR NIVEL ──────────────────────────────────────────────────────
// "free" → Haiku   (rápido, eficiente, nivel gratuito)
// "pro"  → Sonnet  (más profundo, nivel de pago)
// Para activar Sonnet: cambia el plan de la usuaria a "pro"
// No hay que tocar nada más.
const MODELS = {
  free: "claude-haiku-4-5-20251001",
  pro:  "claude-sonnet-4-20250514",
};

function getModel(plan) {
  return MODELS[plan] || MODELS.free;
}

// callAnthropic — para summary.js (sin streaming, respuesta completa)
async function callAnthropic({ system, messages, userMessage, maxTokens = 300, temperature = 0.75, plan = "free" }) {
  const model = getModel(plan);
  const finalMessages = messages || [{ role: "user", content: userMessage }];

  const response = await fetch("https://api.anthropic.com/v1/messages", {
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
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error?.message || "Error en la API de Anthropic");
  }

  return data.content?.[0]?.text || "";
}

module.exports = { callAnthropic, MODELS, getModel };
