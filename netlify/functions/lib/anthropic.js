// lib/anthropic.js
// Llamada compartida a la API de Anthropic

// ── MODELOS POR NIVEL ──────────────────────────────────────────────────────
// "free" → Haiku   (rápido, eficiente, nivel gratuito)
// "pro"  → Sonnet  (más profundo, nivel de pago)
// Para volver a Haiku 4.5 basta con cambiar la línea de "free" por
// "claude-haiku-4-5-20251001": el resto se adapta solo.
const MODELS = {
  free: "claude-haiku-5-5",
  pro:  "claude-sonnet-5-5",
};

function getModel(plan) {
  return MODELS[plan] || MODELS.free;
}

// ── MODELOS ANTIGUOS (Haiku 4.5, Sonnet 4.6) ───────────────────────────────
// Solo estos aceptan «temperature» y funcionan sin «pensamiento». Los nuevos
// (Haiku 5.5, Sonnet 5.5…) cambian tres cosas que, sin tocarlas, rompen Alma:
//   1. No admiten «temperature» (hay que quitarla).
//   2. «Piensan» antes de responder por defecto: la respuesta puede empezar por
//      un bloque de pensamiento (el texto ya no está en la primera posición),
//      ese pensamiento gasta del tope de tokens y tarda (Netlify corta a 10 s).
//   3. Cuentan unos 30 % más de tokens por el mismo texto: el tope se queda corto.
const MODELOS_ANTIGUOS = new Set([
  "claude-haiku-4-5-20251001",
  "claude-sonnet-4-6",
]);

// Cómo se usa el pensamiento en los modelos nuevos.
// "disabled" + effort "high": responde directa y rápida, y "high" es lo que
// Anthropic recomienda cuando importa que siga bien las instrucciones.
// SI EN LAS PRUEBAS ALMA ESCRIBE RAZONAMIENTOS EN VOZ ALTA (frases sobre
// "la usuaria", "voy a responder…"), cambia a: { thinking: "adaptive", effort: "medium" }
// (es lo que Anthropic aconseja para ese caso; tarda algo más).
const PENSAMIENTO = { thinking: "disabled", effort: "high" };

const FACTOR_TOKENS_NUEVOS = 1.3;  // mismo texto, ~30 % más tokens
const MARGEN_PENSAMIENTO = 1500;   // solo si el pensamiento está activado

function cuerpoPeticion({ model, maxTokens, temperature, system, messages }) {
  if (MODELOS_ANTIGUOS.has(model)) {
    return { model, max_tokens: maxTokens, temperature, system, messages };
  }
  const piensa = PENSAMIENTO.thinking !== "disabled";
  return {
    model,
    max_tokens: Math.ceil(maxTokens * FACTOR_TOKENS_NUEVOS) + (piensa ? MARGEN_PENSAMIENTO : 0),
    thinking: { type: piensa ? "adaptive" : "disabled" },
    output_config: { effort: PENSAMIENTO.effort },
    system,
    messages,
  };
}

// Error especial: el filtro de seguridad de la API no ha dejado responder.
// alma.js lo distingue de un fallo normal para darle a ella los teléfonos de
// ayuda en vez de un mensaje genérico.
class RechazoError extends Error {
  constructor() { super("La API rechazó responder (stop_reason: refusal)"); this.rechazo = true; }
}

// callAnthropic — respuesta completa, sin streaming
// Timeout interno: Netlify mata la función a los 10s, así que cortamos antes
// nosotros para poder responder limpio en vez de con un 502 mudo. Por defecto
// 9s; quien ya haya gastado tiempo antes (alma.js espera hasta 0,8s a la
// esencia del Sanctum) pasa el tiempo que le queda en timeoutMs.
async function callAnthropic({ system, messages, userMessage, maxTokens = 300, temperature = 0.75, plan = "free", timeoutMs = 9000 }) {
  const model = getModel(plan);
  const finalMessages = messages || [{ role: "user", content: userMessage }];

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), Math.max(1000, timeoutMs));

  let response;
  try {
    response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify(cuerpoPeticion({ model, maxTokens, temperature, system, messages: finalMessages })),
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

  if (data.stop_reason === "refusal") throw new RechazoError();

  // El texto se busca por tipo de bloque, no por posición: en los modelos
  // nuevos puede ir detrás de un bloque de pensamiento.
  const text = (data.content || [])
    .filter(b => b && b.type === "text" && typeof b.text === "string")
    .map(b => b.text)
    .join("")
    .trim();
  const truncated = data.stop_reason === "max_tokens";

  if (truncated) {
    // Sin copiar el texto: es una respuesta a lo que ella escribió
    console.warn(`Respuesta truncada por max_tokens (modelo ${model}, límite ${maxTokens})`);
  }
  if (!text) throw new Error("La API devolvió una respuesta sin texto");

  return { text, truncated };
}

module.exports = { callAnthropic, MODELS, getModel, RechazoError };
