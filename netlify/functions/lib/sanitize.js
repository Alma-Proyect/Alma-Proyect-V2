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

// Respuesta de conversación: todas las redes, en el mismo orden que el original.
function limpiarRespuesta(text) {
  return sanitizeTrailingQuestion(sanitizeMuletillas(sanitizeDashes(sanitizeFirma(text))));
}

// Reflejo: guiones y muletillas (sin tocar sus preguntas, que no las lleva).
function limpiarReflejo(text) {
  return sanitizeMuletillas(sanitizeDashes(text));
}

module.exports = {
  sanitizeDashes, sanitizeMuletillas, sanitizeTrailingQuestion, sanitizeFirma,
  limpiarRespuesta, limpiarReflejo,
};
