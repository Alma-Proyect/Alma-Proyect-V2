// lib/entrada.js
// Las preguntas de la entrada nueva («escribir primero»). Viven aquí y no en
// lib/questions.js para no tocar los bancos de los días siguientes.
// Tienen que ser las mismas que BETA_QUESTIONS y QUESTION_BANK.libre de app.html.

// La primera pregunta de cada entrada: sencilla, abierta y sin dar por hecho
// que algo duele. Las preguntas hondas siguen en los bancos de los días
// siguientes, para cuando ella ya ha decidido quedarse.
const PREGUNTAS_ENTRADA = {
  libre:    "¿Qué te apetece contar hoy?",
  nudos:    "¿Qué te ronda hoy por la cabeza?",
  sinsaber: "¿Qué te apetece soltar, aunque no sepas muy bien qué es?",
  agotada:  "¿Cómo llegas hoy de fuerzas?",
  volver:   "¿Qué te apetece contar hoy?",
};

// Sin puerta, los días del recorrido: preguntas cotidianas
const PREGUNTAS_LIBRES = [
  "¿Qué te apetece contar hoy?",
  "¿Cómo ha sido tu día hasta ahora?",
  "¿Qué te ha rondado la cabeza estos días?",
  "¿Ha pasado algo hoy que quieras dejar escrito?",
  "¿Qué te ha sacado una sonrisa últimamente, aunque sea pequeña?",
  "¿Cómo te has levantado hoy?",
  "¿Qué conversación de estos días se te ha quedado?",
  "¿Qué te gustaría que pasara esta semana?",
  "¿Hay algo que te apetezca soltar aquí, sin más?",
  "¿Qué necesitas hoy que no has pedido?",
  // Cierre (días 6 y 7 del recorrido de 7)
  "Después de estos días, ¿cómo te encuentras hoy?",
  "De todo lo que has escrito aquí, ¿qué te gustaría llevarte?",
  "¿Qué te ha sorprendido de lo que has ido contando estos días?",
  "¿Qué te gustaría recordarte cuando vuelvas a abrir esto?",
];

// La pregunta que vio un día sin puerta: la de su set, si es una de estas.
// Si no, la primera (nunca una pregunta que no esté en la lista).
function preguntaLibreDelDia(questionSet, day) {
  const q = questionSet && typeof questionSet === "object" ? questionSet[day] : null;
  return PREGUNTAS_LIBRES.includes(q) ? q : PREGUNTAS_LIBRES[0];
}

module.exports = { PREGUNTAS_ENTRADA, PREGUNTAS_LIBRES, preguntaLibreDelDia };
