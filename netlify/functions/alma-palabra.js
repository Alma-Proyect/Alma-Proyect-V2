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
// Si algo falla: una palabra neutra (antes era SILENCIO, que pesa)
const PALABRA_RESERVA = { formato: "palabra", contenido: "PAUSA" };

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

  // Antes pedía «lo que tuvo más peso emocional», con ejemplos casi todos
  // negativos y un segundo formato de patrón («Hoy volviste varias veces a…»)
  // que señalaba patrones, justo lo que Alma no hace. Ahora: una palabra que
  // acompañe, la más presente en lo que escribió, agradable o no.
  const SYSTEM = `Eres Alma. Has leído lo que ella ha escrito hoy.
Elige UNA palabra que pueda acompañar este momento: la que más presente estuvo en lo que ella escribió, sea agradable o no.

CÓMO ELEGIRLA:
- Si puedes, una palabra que ella misma haya usado, o muy cercana a las suyas.
- No subas la intensidad: si dijo «cansada», CANSANCIO, nunca AGOTAMIENTO; si dijo «me agobié un rato», no ANGUSTIA.
- Si contó algo bueno y algo que pesa, no elijas lo que pesa por defecto: elige lo que tuvo más sitio en lo que escribió.
- Si fue algo cotidiano, ligero o una prueba, una palabra sencilla y ligera sacada de lo que contó.
- Nada que ella no haya dicho: ni diagnósticos, ni causas, ni etiquetas, ni patrones.
Ejemplos, de todo tipo y ninguno mejor que otro: CALMA, ALIVIO, ILUSIÓN, ALEGRÍA, GANAS, TERNURA, ORGULLO, CANSANCIO, DUDA, PRISA, NOSTALGIA, MIEDO.

Devuelve solo: {"formato":"palabra","contenido":"PALABRA_EN_MAYÚSCULAS"}
Una sola palabra (como mucho dos). Solo JSON, sin markdown ni texto fuera del JSON.
Nunca inventes algo que no esté en lo que escribió.
Español de España siempre.${nota}`;

  try {
    // Misma llamada que el resto de Alma (modelo, pensamiento y tope de
    // tokens se ajustan solos en lib/anthropic.js). Sin «prefill»: los modelos
    // nuevos lo rechazan.
    const { text: raw } = await callAnthropic({
      system: SYSTEM,
      messages: [{ role: "user", content: `Conversación:\n\n${userTurns}\n\nDevuelve solo el JSON con la palabra.` }],
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
    // Solo palabra: una o dos, nunca una frase (el formato de patrón se retiró)
    parsed.formato = "palabra";
    if (parsed.contenido.trim().split(/\s+/).length > 2) parsed = { ...PALABRA_RESERVA };
    // Sin etiquetas ni código: la app lo pinta tal cual
    let contenido = parsed.contenido.replace(/[<>]/g, "").trim();
    if (parsed.formato === "palabra") contenido = contenido.toLocaleUpperCase("es-ES");
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
