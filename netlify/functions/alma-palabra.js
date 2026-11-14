// netlify/functions/alma-palabra.js
// Detecta la palabra o el patrón más significativo de la conversación.
// Devuelve uno de dos formatos que Claude elige según lo que vio.
// El formato "contradicción" se retiró: era una frase entera sobre lo que vio
// en ella, que es justo lo que hace day-card, y las dos salían seguidas
// diciendo lo mismo.
//
// Ahora sabe qué guardiana la acompaña: con Bruma, por ejemplo, no puede
// devolver una etiqueta de su estado («VACÍO») ni una causa. El modelo sale
// de lib/anthropic.js, para que cambiarlo sea una sola línea en un solo sitio.

const { callAnthropic } = require("./lib/anthropic");
const { resolverPuerta } = require("./lib/guardianas");

const MAX_CHARS_TEXTO = 2000;
const MAX_MENSAJES = 8;
const PALABRA_RESERVA = { formato: "palabra", contenido: "SILENCIO" };

// Lo que cada guardiana no permite al elegir la palabra
const NOTA_PALABRA = {
  nudos: `Si lo que pesa es una muerte o una pérdida, no elijas una palabra que suene a lección o a aprendizaje (ACEPTACIÓN, CRECIMIENTO). Tampoco una que juzgue a otra persona de su historia.`,
  sinsaber: `Ella no sabe por qué está mal. NUNCA elijas una palabra o un patrón que sea una causa ("el peso de las expectativas", "la presión de…") ni una etiqueta de su estado como si fuera un diagnóstico (VACÍO, APATÍA, TRISTEZA, NEGATIVIDAD). Elige algo que ella hizo o necesitó hoy, con sus propias palabras: PAUSA, NO SABER, CANSANCIO, COMPAÑÍA…`,
  agotada: `No elijas palabras que alaben su aguante (FORTALEZA, VALENTÍA, RESISTENCIA): es justo lo que la agota. Mejor algo que nombre lo que carga o lo que necesita.`,
  volver: `No elijas palabras que la empujen a un cambio o a una meta (TRANSFORMACIÓN, DECISIÓN, LIBERTAD) si ella no las ha dicho.`,
};

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

  const conversationHistory = (Array.isArray(datos.conversationHistory) ? datos.conversationHistory : [])
    .filter(t => t && typeof t.text === "string")
    .slice(-MAX_MENSAJES);

  const userTurns = conversationHistory
    .filter(t => t.role === "user")
    .map(t => t.text.slice(0, MAX_CHARS_TEXTO))
    .join("\n\n");

  if (!userTurns.trim()) {
    console.warn("alma-palabra: reserva porque no llegó texto suyo (mensajes recibidos: " + conversationHistory.length + ")");
    return { statusCode: 200, headers: { "Content-Type": "application/json" }, body: JSON.stringify(PALABRA_RESERVA) };
  }

  const puerta = resolverPuerta(datos.puerta, datos.arrivalMode);
  const nota = NOTA_PALABRA[puerta] ? `\n\nQUIÉN ES ELLA HOY (por encima de los ejemplos anteriores):\n${NOTA_PALABRA[puerta]}` : "";

  const SYSTEM = `Eres Alma. Has leído una conversación completa.
Tu tarea es identificar el elemento más significativo que apareció — no el más frecuente, sino el que tuvo más peso emocional.

Debes elegir UNO de estos dos formatos según lo que encontraste:

FORMATO 1 — Una palabra:
Cuando hay una sola palabra que resume el peso de la conversación.
Ejemplos: MIEDO, CULPA, CALMA, SILENCIO, CONTROL, CANSANCIO, VACÍO, RABIA, SOLEDAD
Devuelve: {"formato":"palabra","contenido":"PALABRA_EN_MAYÚSCULAS"}

FORMATO 2 — Una emoción o patrón:
Cuando es más específico que una palabra pero más corto que una frase larga.
En la pantalla va detrás de «Hoy volviste varias veces a…», así que tiene que continuar esa frase: empieza en minúscula, con artículo.
Ejemplos: "el miedo a decepcionar", "la necesidad de controlarlo todo", "el cansancio de sostener sola", "lo que le dijiste a tu hermano"
Devuelve: {"formato":"emocion","contenido":"la emoción o patrón en minúsculas, máximo 8 palabras"}

REGLAS:
Solo JSON. Sin markdown. Sin texto fuera del JSON.
Elige el formato más revelador para esta conversación concreta.
Nunca inventes algo que no esté en la conversación.
Se lo dices a ella: si nombras a alguien o algo suyo, es «tu» («tu hermano», «tu madre»), nunca «su». Nunca hables de ella en tercera persona.
Corto de verdad: como mucho 8 palabras. Si necesitas más, elige otra cosa.
Nunca escribas una frase completa sobre lo que viste en ella: eso ya lo dice
la tarjeta del día y repetirlo resta fuerza a las dos. Aquí solo cabe una
palabra o un patrón corto.
No uses ningún formato distinto de "palabra" o "emocion".
Español de España siempre.${nota}`;

  try {
    // Misma llamada que el resto de Alma (modelo, pensamiento y tope de
    // tokens se ajustan solos en lib/anthropic.js). Sin «prefill»: los modelos
    // nuevos lo rechazan.
    const { text: raw } = await callAnthropic({
      system: SYSTEM,
      messages: [{ role: "user", content: `Conversación:\n\n${userTurns}\n\nElige el formato y devuelve solo el JSON.` }],
      maxTokens: 80,
      plan: "free",
    });

    let parsed = null;
    try {
      const ini = raw.indexOf("{"), fin = raw.lastIndexOf("}");
      if (ini !== -1 && fin > ini) parsed = JSON.parse(raw.slice(ini, fin + 1));
    } catch (e) {
      parsed = null;
    }

    // Validar campos y tamaño (una palabra o un patrón corto, nunca un párrafo)
    if (!parsed || typeof parsed.contenido !== "string" || !parsed.contenido.trim() || parsed.contenido.length > 80) {
      // Solo el motivo, nunca el texto
      console.warn(`alma-palabra: reserva porque la respuesta no traía un JSON válido (largo ${raw.length}, empieza por llave: ${raw.trim().startsWith("{")})`);
      parsed = PALABRA_RESERVA;
    }
    // Solo se aceptan los dos formatos vivos. Cualquier otro se trata como emoción.
    if (parsed.formato !== "palabra" && parsed.formato !== "emocion") parsed.formato = "emocion";
    // Sin etiquetas ni código: la app lo pinta tal cual
    let contenido = parsed.contenido.replace(/[<>]/g, "").trim();
    if (parsed.formato === "emocion") {
      // Se le habla a ella: «su hermano» → «tu hermano». Y continúa la frase
      // «Hoy volviste varias veces a…», así que empieza en minúscula.
      contenido = contenido
        .replace(/\bsus\b/g, "tus").replace(/\bsu\b/g, "tu")
        .replace(/^[A-ZÁÉÍÓÚÑ](?=[a-záéíóúñ])/, c => c.toLowerCase())
        .replace(/\.$/, "");
    }
    parsed = { formato: parsed.formato, contenido };

    return { statusCode: 200, headers: { "Content-Type": "application/json" }, body: JSON.stringify(parsed) };
  } catch (e) {
    console.error("Error en alma-palabra:", e.message);
    return { statusCode: 200, headers: { "Content-Type": "application/json" }, body: JSON.stringify(PALABRA_RESERVA) };
  }
};
