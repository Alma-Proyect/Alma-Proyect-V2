// lib/sanitize.js
// Redes de seguridad de la voz de Alma, tal como estaban en el alma.js del
// producto continuo. El prompt ya pide todo esto, pero un modelo de lenguaje
// no lo garantiza al cien por cien: aquí se limpia lo que se cuele.

// Guiones largos: suenan a texto de máquina, no a una amiga hablando.
// Se sustituyen por una coma.
function sanitizeDashes(text) {
  if (!text) return text;
  return text
    .replace(/\s*—\s*/g, ", ")   // guion largo con espacios alrededor
    .replace(/—/g, ", ")          // guion largo pegado a las palabras
    .replace(/,\s*,/g, ",")       // por si quedan dos comas seguidas
    .replace(/\s+([,.])/g, "$1"); // quitar espacio suelto antes de coma o punto
}

// Muletillas "Eso es", "Ahí está", "Aquí está": como frase propia, abriendo
// frase o a mitad de frase tras un conector.
function sanitizeMuletillas(text) {
  if (!text) return text;
  let result = text;
  // Caso 1: la muletilla es su propia frase, cerrada con su signo.
  result = result.replace(
    /(^|[.!?]\s+)(?:Eso es|Ahí está|Aquí está)[.!?]+\s*/g,
    (match, prefix) => prefix
  );
  // Caso 2: abre una frase seguida de coma o dos puntos («Eso es, lo que
  // cuentas…»): se quita y se pone mayúscula. Sin coma no se toca, porque
  // entonces es parte de la frase («Eso es cosa tuya», «Ahí está lo difícil»)
  // y quitarlo la rompe.
  result = result.replace(
    /(^|[.!?]\s+)(?:Eso es|Ahí está|Aquí está)[,:]\s+([a-záéíóúñ])/g,
    (match, prefix, letter) => prefix + letter.toUpperCase()
  );
  // Caso 3: a mitad de frase, tras "Pero", "Y" o "Pues", también solo con coma.
  result = result.replace(
    /(Pero\s+|Y\s+|Pues\s+)(?:eso es|ahí está|aquí está)[,:]\s+/gi,
    (match, prefix) => prefix
  );
  return result;
}

// Remate corto final tipo "¿O solo contigo?" cuando ya hay otra pregunta.
function sanitizeTrailingQuestion(text) {
  if (!text) return text;
  const trailingPattern = /\s*¿O[^?]{1,45}\?\s*$/;
  if (trailingPattern.test(text)) {
    const withoutTrailing = text.replace(trailingPattern, "");
    if (/\?/.test(withoutTrailing)) {
      return withoutTrailing.trim();
    }
  }
  return text;
}

// Firma al final ("Alma - Solaz", "Alma, Cala"…), solo si va pegada al final.
function sanitizeFirma(text) {
  if (!text) return text;
  const firmaPattern = /\n*\s*Alma\s*[-,–—]?\s*(Solaz|Cala|Bruma|Ítaca|Itaca)\.?\s*$/i;
  return text.replace(firmaPattern, "").trimEnd();
}

// «afuera» y «adentro» suenan latinoamericanos: en España, «fuera» y «dentro».
function sanitizeEspana(text) {
  if (!text) return text;
  return text
    .replace(/\bafuera\b/g, "fuera").replace(/\bAfuera\b/g, "Fuera")
    .replace(/\badentro\b/g, "dentro").replace(/\bAdentro\b/g, "Dentro");
}

// ── PREGUNTAS ──────────────────────────────────────────────────────────────
// La regla «una sola pregunta, abierta y sin opciones» está dos veces en el
// prompt y aun así se cuela (pruebas de noviembre con Haiku 5.5: en las cuatro
// guardianas). Aquí se corrige sin reescribir nada: solo se recorta.
//   · Si hay varias preguntas, se queda la primera y se quita la frase entera
//     de las demás («Y, al pensarlo ahora, ¿…?»).
//   · Si la que queda ofrece opciones («¿…, o fue más bien…?») o encadena dos
//     («¿Cómo estás, con quién hablas?»), se corta en la primera opción.
// Si un recorte dejaría la pregunta demasiado corta, se deja como estaba.

// Ampliada el 25 nov: «…el decidir en sí o sentir que…», «…de hoy o uno que viene de lejos»
const PALABRA_OPCION = "(?:es|era|son|fue|más|solo|sólo|hay|si|lo|la|el|está|estás|te|eres|sientes|tienes|cuando|algo|quizá|quizás|tal|prefieres|crees|notas|parece|pasa|viene|lo|uno|una|otro|otra|sentir|sentirte|pensar|porque|simplemente|ya)";
// La pregunta directa de seguridad («¿estás pensando en quitarte la vida o en
// hacerte daño?») nunca se toca, aunque lleve una «o».
const RE_PREGUNTA_SEGURIDAD = /\b(vida|daño|morir|matarte|suicid|viva|peligro|miedo de él|miedo de ella)/i;
const RE_OPCION_COMA = /,\s+o\s+/i;
const RE_OPCION = new RegExp("\\s+o\\s+" + PALABRA_OPCION + "\\b", "i");
const RE_SEGUNDA_PREGUNTA = /,\s+(?:y\s+)?(?:qué|cómo|cuándo|dónde|quién|quiénes|cuál|cuáles|cuánto|cuánta|por qué|con quién|para qué|de qué)\s/i;
const MIN_PREGUNTA = 10;

function opcionEn(q) {
  // q incluye ¿ y ?; devuelve la posición donde cortar, o -1
  const coma = q.search(RE_OPCION_COMA);
  if (coma !== -1) return coma;
  const segunda = q.search(RE_SEGUNDA_PREGUNTA);
  const o = q.search(RE_OPCION);
  if (o === -1) return segunda;
  // «¿…con más fuerza, cuando estás sola o cuando…?» → se corta en la coma
  // que abre la primera opción, si la hay y está cerca.
  const antes = q.slice(0, o);
  const ultimaComa = antes.lastIndexOf(",");
  const corte = (ultimaComa !== -1 && o - ultimaComa < 45) ? ultimaComa : o;
  return segunda !== -1 ? Math.min(segunda, corte) : corte;
}

function recortarPreguntas(text) {
  if (!text || text.indexOf("?") === -1) return text;
  let t = text;

  // 1. Solo la primera pregunta
  const preguntas = [...t.matchAll(/¿[^¿?]*\?/g)];
  if (preguntas.length > 1) {
    for (let i = preguntas.length - 1; i >= 1; i--) {
      const m = preguntas[i];
      const fin = m.index + m[0].length;
      // inicio de la frase que contiene la pregunta
      let ini = m.index;
      while (ini > 0 && !/[.!?\n]/.test(t[ini - 1])) ini--;
      t = t.slice(0, ini) + t.slice(fin);
    }
    t = t.replace(/[ \t]+\n/g, "\n").replace(/\n{3,}/g, "\n\n").replace(/[ \t]{2,}/g, " ").trim();
  }

  // 2. Sin opciones ni pregunta encadenada
  const m = t.match(/¿[^¿?]*\?/);
  if (m && !RE_PREGUNTA_SEGURIDAD.test(m[0])) {
    const q = m[0];
    const corte = opcionEn(q);
    if (corte !== -1 && corte >= MIN_PREGUNTA) {
      const nueva = q.slice(0, corte).replace(/[\s,;:]+$/, "") + "?";
      t = t.slice(0, m.index) + nueva + t.slice(m.index + q.length);
    }
  }
  return t;
}

// Para los registros: ¿se coló una pregunta con opciones? (sin copiar el texto)
function tienePreguntaConOpciones(text) {
  if (!text) return false;
  const preguntas = text.match(/¿[^¿?]*\?/g) || [];
  return preguntas.length > 1 || preguntas.some(q => opcionEn(q) !== -1);
}

// ── FRASES CORTAS QUE SOBRAN ───────────────────────────────────────────────
// Quita las frases enteras (cortas y que no son pregunta) que cumplan «esSobra».
// Si la frase es larga, se deja: quitarla podría llevarse algo que importa.
// Si no quedara nada, se devuelve el texto como estaba.
function quitarFrasesCortas(text, esSobra) {
  if (!text) return text;
  const frases = text.split(/(?<=[.!?])(?=\s)/);
  let quitadas = 0;
  const quedan = frases.map(f => {
    const t = f.trim().replace(/^¡/, "");
    if (t.length > 90 || /\?$/.test(t)) return f;
    if (!esSobra(t)) return f;
    quitadas++;
    // si se quita, se conserva el salto de párrafo que llevaba delante
    return f.match(/^\s*/)[0].includes("\n") ? "\n\n" : "";
  });
  if (!quitadas) return text;
  let r = quedan.join("");
  // limpiar huecos y poner mayúscula al inicio de cada párrafo
  r = r.replace(/^[ \t]+/gm, "").replace(/\n\s*\n\s*\n+/g, "\n\n").trim();
  r = r.replace(/(^|\n)([a-záéíóúñ])/g, (m, p1, c) => p1 + c.toUpperCase());
  return r || text;
}

// Frases de manual con «entiendo»: «Entiendo que quieras algo concreto.»,
// «Lo de no quejarte lo entiendo.», «Es normal que…», «Eso ya es algo.».
function esManual(t) {
  return /^(?:Te |Lo )?[Ee]ntiendo\b/.test(t) || /\blo entiendo[.!]$/i.test(t) || /^Y entiendo que\b/.test(t)
    || /^(?:Y )?[Ee]s (?:muy |lo más )?normal(?: del mundo)? que\b/.test(t) || /^(?:Y )?[Ee]so ya es algo[.!]$/.test(t)
    || /^(?:Y )?[Gg]racias por (?:contármelo|contarme|compartir|decírmelo|decirme|confiar|escribir)/.test(t);
}

function sanitizeManual(text) {
  return quitarFrasesCortas(text, esManual);
}

// Frases que la evalúan, aunque sea para bien: «Me parece muy honesto.»,
// «Qué valiente.», «Es muy bonito lo que dices.», «Has sido muy sincera.»,
// «Eso dice mucho de ti.». Una amiga no le pone nota a cómo cuenta las cosas.
// «Me parece que…» (una opinión con cuidado) NO se toca: solo «me parece»
// seguido de un adjetivo que la valora.
// («Eso es muy honesto.» llega aquí como «Muy honesto.», porque la red de
// muletillas ya ha quitado el «Eso es».)
const ADJ_EVAL = "(?:honest[oa]s?|valientes?|bonit[oa]s?|precios[oa]s?|admirables?|sincer[oa]s?|valios[oa]s?|generos[oa]s?|lúcid[oa]s?|madur[oa]s?|sabi[oa]s?|bien|genial|estupendo|de valientes)";
const INTENSIF = "(?:muy |tan |súper |super |realmente |bastante |algo |lo más |de lo más )?";
const RE_EVALUA = [
  new RegExp(`^(?:Y |Pero )?(?:Me parece|Es|Eso es|Lo que (?:dices|cuentas|has escrito|haces) es|Has sido|Estás siendo) ${INTENSIF}${ADJ_EVAL}\\b`, "i"),
  // «Muy honesto.», «Qué valiente.», «Qué bonito que…»; pero no «Muy bien no estás…»
  new RegExp(`^(?:Muy |Tan |Qué )${ADJ_EVAL}(?:[.!]$|,? (?:que|lo que|cómo)\\b)`, "i"),
  /^(?:Y )?(?:Eso )?[Dd]ice mucho de ti\b/,
  /^(?:Y )?Me alegra (?:que|mucho|leerte|saber)\b/,
];

function esEvaluacion(t) {
  return RE_EVALUA.some(re => re.test(t));
}

// El día bueno, alegrarse de lo que ha pasado no es evaluarla: «Qué bien.»,
// «Me alegra mucho», «Qué bonito que…» se dejan. Lo que la evalúa a ella
// («Me parece muy honesto», «Qué valiente», «Dice mucho de ti») se sigue quitando.
const ADJ_EVAL_BUENO = "(?:honest[oa]s?|valientes?|admirables?|sincer[oa]s?|valios[oa]s?|generos[oa]s?|lúcid[oa]s?|madur[oa]s?|sabi[oa]s?|de valientes)";
const RE_EVALUA_BUENO = [
  new RegExp(`^(?:Y |Pero )?(?:Me parece|Es|Eso es|Lo que (?:dices|cuentas|has escrito|haces) es|Has sido|Estás siendo) ${INTENSIF}${ADJ_EVAL_BUENO}\\b`, "i"),
  new RegExp(`^(?:Muy |Tan |Qué )${ADJ_EVAL_BUENO}(?:[.!]$|,? (?:que|lo que|cómo)\\b)`, "i"),
  /^(?:Y )?(?:Eso )?[Dd]ice mucho de ti\b/,
];
function esEvaluacionBueno(t) {
  return RE_EVALUA_BUENO.some(re => re.test(t));
}

function sanitizeEvaluacion(text, bueno) {
  const r = quitarFrasesCortas(text, bueno ? esEvaluacionBueno : esEvaluacion);
  if (r !== text) console.warn("sanitize: frase que la evalúa recortada");
  return r;
}

// ── PREGUNTAS DE DATOS ─────────────────────────────────────────────────────
// Alma guía con preguntas, y eso no se toca. Aquí solo se quitan las que piden
// los hechos de una pérdida o un suceso: «¿Cuánto tiempo hacía que no os
// veíais?», «¿Cuándo fue?», «¿Qué edad tenía?», «¿Cómo murió?». No la ayudan a
// ordenar nada y en un duelo hacen daño. Las que pueden servir para profundizar
// («¿Desde cuándo sientes que te pones la última?», «¿Cuántas veces te has
// dicho eso?») se dejan: ahí decide el prompt de cada guardiana.
// Se quita la frase entera de la pregunta. Si no quedara nada, se deja.
const RE_PREGUNTA_DATOS = new RegExp(
  "^¿\\s*(?:y,?\\s+)?(?:" + [
    "cuánto tiempo hac(?:e|ía) que", "hace cuánto (?:que |fue|pasó|murió|falleció|os|lo|la)", "cuánto hac(?:e|ía) que no",
    "cuántos años tenía", "qué edad",
    "cuándo (?:fue|pasó|ocurrió|murió|falleció|lo supiste|te enteraste|os visteis|os habíais visto|la viste|lo viste|hablasteis)",
    "cómo (?:murió|falleció)", "de qué murió",
    "cómo (?:fue|pasó|ocurrió)\\s*\\?",
  ].join("|") + ")",
  "i"
);

function quitarPreguntasDeDatos(text) {
  if (!text || text.indexOf("?") === -1) return text;
  const preguntas = [...text.matchAll(/¿[^¿?]*\?/g)].filter(m => RE_PREGUNTA_DATOS.test(m[0]));
  if (!preguntas.length) return text;
  let t = text;
  for (let i = preguntas.length - 1; i >= 0; i--) {
    const m = preguntas[i];
    const fin = m.index + m[0].length;
    let ini = m.index;
    while (ini > 0 && !/[.!?\n]/.test(t[ini - 1])) ini--;
    t = t.slice(0, ini) + t.slice(fin);
  }
  t = t.replace(/[ \t]+\n/g, "\n").replace(/\n{3,}/g, "\n\n").replace(/[ \t]{2,}/g, " ").trim();
  if (!t) return text;
  console.warn("sanitize: pregunta de datos recortada");
  return t;
}

// Respuesta de conversación: todas las redes, en el mismo orden que el original.
// Las preguntas de datos se quitan antes de recortar a una sola pregunta: así,
// si la primera era de datos, se queda la siguiente.
// «…y eso cansa»: Alma añadía cansancio que ella no había nombrado
function sanitizeEsoCansa(text) {
  if (!text) return text;
  return text
    .replace(/,?\s+y eso cansa\b/gi, "")
    .replace(/(^|[.!?…]\s+)Eso cansa(?: mucho)?\.\s*/g, "$1")
    .replace(/[ \t]{2,}/g, " ").trim();
}

function limpiarRespuesta(text, opciones = {}) {
  return recortarPreguntas(sanitizeEsoCansa(quitarPreguntasDeDatos(sanitizeEvaluacion(sanitizeManual(sanitizeEspana(sanitizeTrailingQuestion(sanitizeMuletillas(sanitizeDashes(sanitizeFirma(text)))))), opciones.bueno === true))));
}

// Reflejo: guiones y muletillas (sin tocar sus preguntas, que no las lleva).
// El reflejo no pregunta ni pide nada. Si aun así termina en un párrafo que
// es una pregunta («¿Qué es lo que más echas de menos…?») o una petición
// («Cuando puedas, dime…»), ese último párrafo se quita.
function quitarCierreQuePregunta(text) {
  if (!text) return text;
  const parrafos = text.trim().split(/\n\s*\n/);
  if (parrafos.length < 2) return text;
  const ultimo = parrafos[parrafos.length - 1].trim();
  const pregunta = /\?\s*$/.test(ultimo);
  const peticion = ultimo.length < 120 && /\b(dime|cuéntame|me cuentas|escríbeme)\b/i.test(ultimo);
  return (pregunta || peticion) ? parrafos.slice(0, -1).join("\n\n") : text;
}

function limpiarReflejo(text) {
  return quitarCierreQuePregunta(sanitizeEvaluacion(sanitizeEspana(sanitizeMuletillas(sanitizeDashes(text)))));
}

module.exports = {
  sanitizeDashes, sanitizeMuletillas, sanitizeTrailingQuestion, sanitizeFirma,
  sanitizeEspana, tienePreguntaConOpciones, recortarPreguntas, sanitizeManual,
  sanitizeEvaluacion, quitarPreguntasDeDatos,
  limpiarRespuesta, limpiarReflejo,
};
