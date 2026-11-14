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
  // Caso 2: abre una frase que sigue: se quita y se pone mayúscula.
  result = result.replace(
    /(^|[.!?]\s+)(?:Eso es|Ahí está|Aquí está)\s+([a-záéíóúñ])/g,
    (match, prefix, letter) => prefix + letter.toUpperCase()
  );
  // Caso 3: a mitad de frase, tras "Pero", "Y" o "Pues".
  result = result.replace(
    /(Pero\s+|Y\s+|Pues\s+)(?:eso es|ahí está|aquí está)\s+/gi,
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

const PALABRA_OPCION = "(?:es|era|son|fue|más|solo|sólo|hay|si|lo|la|el|está|estás|te|eres|sientes|tienes|cuando|algo|quizá|quizás|tal|prefieres|crees|notas|parece|pasa|viene|lo)";
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
  if (m) {
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

// Frases de manual con «entiendo»: se quita la frase entera si es corta y
// empieza por «(Te/Lo) entiendo» o acaba en «lo entiendo.» («Entiendo que
// quieras algo concreto.», «Lo de no quejarte lo entiendo.»). Si la frase es
// larga, se deja: quitarla podría llevarse algo que importa.
function sanitizeManual(text) {
  if (!text) return text;
  const frases = text.split(/(?<=[.!?])(?=\s)/);
  const quedan = frases.map(f => {
    const t = f.trim();
    if (t.length > 90 || /\?$/.test(t)) return f;
    const manual = /^(?:Te |Lo )?[Ee]ntiendo\b/.test(t) || /\blo entiendo\.$/i.test(t) || /^Y entiendo que\b/.test(t)
      || /^(?:Y )?[Ee]s (?:muy |lo más )?normal(?: del mundo)? que\b/.test(t) || /^(?:Y )?[Ee]so ya es algo\.$/.test(t);
    // si se quita, se conserva el salto de párrafo que llevaba delante
    return manual ? (f.match(/^\s*/)[0].includes("\n") ? "\n\n" : "") : f;
  });
  let r = quedan.join("");
  // limpiar huecos y poner mayúscula al inicio de cada párrafo
  r = r.replace(/^[ \t]+/gm, "").replace(/\n\s*\n\s*\n+/g, "\n\n").trim();
  r = r.replace(/(^|\n)([a-záéíóúñ])/g, (m, p1, c) => p1 + c.toUpperCase());
  return r || text;
}

// Respuesta de conversación: todas las redes, en el mismo orden que el original.
function limpiarRespuesta(text) {
  return recortarPreguntas(sanitizeManual(sanitizeEspana(sanitizeTrailingQuestion(sanitizeMuletillas(sanitizeDashes(sanitizeFirma(text)))))));
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
  return quitarCierreQuePregunta(sanitizeEspana(sanitizeMuletillas(sanitizeDashes(text))));
}

module.exports = {
  sanitizeDashes, sanitizeMuletillas, sanitizeTrailingQuestion, sanitizeFirma,
  sanitizeEspana, tienePreguntaConOpciones, recortarPreguntas, sanitizeManual,
  limpiarRespuesta, limpiarReflejo,
};
