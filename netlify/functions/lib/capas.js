// lib/capas.js
// Capas cortas que se suman al prompt según cómo llega ella hoy:
// - «Hoy solo quiero soltar»: Alma recibe sin preguntar nada.
// - Vuelve después de unos días sin escribir: sin reproches ni «ayer».
// Van en el sitio de la guardiana, antes del recordatorio final.

const CAPA_SOLTAR = `HOY HA PEDIDO ESCRIBIR SIN PREGUNTAS:
Hoy ella ha elegido soltar sin que le preguntes nada. Esto va por encima de lo que diga tu manera de acompañar sobre preguntar.
- No hagas ninguna pregunta: ni al final, ni a mitad, ni disfrazada («me pregunto si…», «quizá te apetezca contarme…»).
- Recibe lo que escribe. Puedes devolverle algo concreto de lo que ha contado, con tus palabras, y quedarte ahí con ella.
- Más corto que otros días. No hace falta llenar el silencio.
- El cierre no invita a seguir contando: basta con que sepa que lo has recibido.
- Solo hay una excepción: si lo que cuenta hace pensar que está en peligro, su seguridad va antes, y entonces sí puedes preguntarle si está a salvo.`;

function capaAusencia(dias) {
  return `VUELVE DESPUÉS DE UNOS DÍAS:
La última vez que escribió aquí fue hace ${dias} días, no ayer. No le digas «ayer» al hablar de lo que escribió.
- No le señales que ha tardado, no le preguntes por qué no ha venido y no le digas que la echabas de menos. Nada de «cuánto tiempo» ni «me alegra que hayas vuelto».
- Recíbela como si fuera lo más normal del mundo volver cuando una puede.
- Lo que escribió la otra vez puede que ya no sea lo que siente hoy: empieza por lo de hoy, y solo si ella lo conecta, conéctalo tú.`;
}

// Red de seguridad para el día de soltar: quita las frases que preguntan.
// Si la respuesta lleva un teléfono de ayuda, no se toca nada (ahí puede
// hacer falta preguntar si está a salvo).
function quitarPreguntas(text) {
  if (!text || !text.includes("?")) return text;
  if (/\b(024|016|112|717 ?003 ?717)\b/.test(text)) return text;
  const parrafos = text.split(/\n{2,}/).map(p => {
    const frases = p.match(/[^.!?…]+(?:[.!?…]+|$)/g) || [p];
    return frases.filter(f => !f.includes("?")).join("").trim();
  }).filter(Boolean);
  const limpio = parrafos.join("\n\n").trim();
  if (limpio !== text) console.warn("capas: quitada una pregunta en un día de soltar");
  return limpio || "Aquí queda, recibido.";
}

// Cómo empezó y cerró Alma sus respuestas de otros días, para no repetirse.
// Llegan del navegador: se limpian y se recortan, y van como datos.
function limpiarFrasesAnteriores(lista) {
  if (!Array.isArray(lista)) return [];
  return lista
    .filter(f => typeof f === "string")
    .map(f => f.replace(/[\r\n«»"]/g, " ").replace(/\s+/g, " ").trim().slice(0, 160))
    .filter(f => f.length >= 4)
    .slice(0, 10);
}

function capaNoRepetir(frases) {
  if (!frases.length) return "";
  return `CÓMO EMPEZASTE Y CERRASTE OTROS DÍAS (para no repetirte):
${frases.map(f => `- «${f}»`).join("\n")}
Hoy no empieces ni cierres con ninguna de esas frases ni con otras que se les parezcan en forma o en arranque. Una amiga que te escucha cada día no te saluda ni se despide siempre igual. Esto es solo para variar tu forma: no lo menciones ni comentes lo que dijiste otros días.`;
}

// «No me has entendido»: ella dice por qué la respuesta no le ha servido y
// Alma lo intenta otra vez. El motivo llega como código cerrado; el texto
// anterior es la respuesta de Alma (no de ella), recortado.
const MOTIVOS_REINTENTO = {
  general:   "le ha sonado demasiado general, como si valiera para cualquiera",
  consejo:   "no quería un consejo",
  supuesto:  "has supuesto algo que no es así",
  preguntas: "prefiere que no le preguntes nada",
};

function limpiarReintento(r) {
  if (!r || typeof r !== "object" || !MOTIVOS_REINTENTO[r.motivo]) return null;
  const anterior = typeof r.anterior === "string" ? r.anterior.replace(/\s+/g, " ").trim().slice(0, 1200) : "";
  return { motivo: r.motivo, anterior };
}

function capaReintento(r) {
  return `TU RESPUESTA ANTERIOR NO LE HA SERVIDO:
${r.anterior ? `Le respondiste esto: «${r.anterior}»\n` : ""}Ella ha dicho que no la has entendido: ${MOTIVOS_REINTENTO[r.motivo]}.
- Vuelve a responder a lo que escribió, de otra forma. No repitas ideas, imágenes ni frases de esa respuesta.
- No te disculpes ni te expliques. Como mucho, una frase muy corta que reconozca que no lo habías pillado.
${r.motivo === "supuesto" ? "- No vuelvas a suponer nada: quédate con lo que ella ha dicho, con sus palabras.\n" : ""}${r.motivo === "general" ? "- Agárrate a algo concreto y suyo de lo que ha escrito, algo que solo valga para ella.\n" : ""}${r.motivo === "consejo" ? "- Nada de consejos, sugerencias ni «quizá podrías». Solo recibir lo que ha contado.\n" : ""}- Más corta que la anterior.`;
}

module.exports = { CAPA_SOLTAR, capaAusencia, quitarPreguntas, limpiarFrasesAnteriores, capaNoRepetir, limpiarReintento, capaReintento };
