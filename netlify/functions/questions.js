// lib/questions.js
// Lógica de selección de preguntas para Alma: el CONTENIDO de las preguntas
// (ARRIVAL_QUESTION, QUESTION_BANK, CLOSING_BANK) vive en
// public/data/questions-data.js — fuente única compartida con el cliente,
// para que nunca vuelvan a desincronizarse. Este archivo solo decide cómo
// se barajan, se reparten por día y se conserva lo ya asignado al ampliar
// un tramo.

const { ARRIVAL_QUESTION, QUESTION_BANK, CLOSING_BANK } = require("../../public/data/questions-data.js");

// ── PREGUNTAS BETA — una por modo de llegada ─────────────────────────────
// Simples. Directas. La profundidad la pone Alma en la respuesta.
const BETA_QUESTIONS = {
  pain:      "¿Hay algo que necesitas contar y no puedes?",
  curiosity: "¿Qué hay en ti ahora mismo que te está pidiendo atención?",
  open:      "¿Qué te ha traído aquí hoy?",
  depth:     "¿De quién necesitas permiso para ser tú misma?",
};

// "open" tiene su propio banco — no cae a pain
// pain es el fallback solo si el modo no existe

// ── NÚMERO MÁXIMO DE TURNOS POR DÍA ───────────────────────────────────────
const MAX_TURNS_PER_DAY = 3;

// ── Baraja una copia, sin tocar el original ───────────────────────────────
function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// ── HELPER — genera el set completo de preguntas para un recorrido ─────────
// totalDays: 3, 5 o 7. Devuelve un objeto { 1: "...", 2: "...", ... } con una
// pregunta por dia, sin repetir ninguna. Las de cierre solo entran en los dos
// ultimos dias de un recorrido de 7; quien hace 3 o 5 recibe siempre el banco
// potente. Se llama una vez al inicio y se guarda en el frontend; al ampliar
// de 3 a 5 o de 5 a 7 se vuelve a llamar conservando las ya asignadas.
function buildQuestionSet(arrivalMode, totalDays, previousSet) {
  const bank = QUESTION_BANK[arrivalMode] || QUESTION_BANK.pain;
  const closing = CLOSING_BANK[arrivalMode] || CLOSING_BANK.pain;
  const days = totalDays || 3;

  const set = {};
  const usadasNormales = new Set();
  const usadasCierre = new Set();

  // Conservar lo ya asignado en tramos anteriores, para no cambiarle a nadie
  // una pregunta que ya vio al ampliar el recorrido.
  if (previousSet) {
    for (const k of Object.keys(previousSet)) {
      set[k] = previousSet[k];
      if (closing.includes(previousSet[k])) usadasCierre.add(previousSet[k]);
      else usadasNormales.add(previousSet[k]);
    }
  }

  const normalesLibres = shuffle(bank.filter(q => !usadasNormales.has(q)));
  const cierreLibres   = shuffle(closing.filter(q => !usadasCierre.has(q)));

  // Los dos ultimos dias de un recorrido de 7 son de cierre. En 3 y 5, no.
  const primerDiaCierre = days >= 7 ? days - 1 : Infinity;

  for (let d = 1; d <= days; d++) {
    if (set[d]) continue; // ya asignada en un tramo anterior
    if (d >= primerDiaCierre && cierreLibres.length) {
      set[d] = cierreLibres.shift();
    } else if (normalesLibres.length) {
      set[d] = normalesLibres.shift();
    } else {
      // Si por lo que sea se agota el banco, se rellena con cierre como respaldo
      set[d] = cierreLibres.shift() || bank[0];
    }
  }
  return set;
}

// ── COMPAT — mantiene el nombre antiguo para 3 dias ───────────────────────
function getRandomQuestions(arrivalMode) {
  return buildQuestionSet(arrivalMode, 3, null);
}

// ── HELPER — devuelve la pregunta correcta dado un set ya elegido ──────────
function getQuestion(arrivalMode, day, questionSet) {
  // Si viene un set aleatorio ya generado, úsalo
  if (questionSet && questionSet[day]) return questionSet[day];
  // Fallback: primera del banco en orden
  const bank = QUESTION_BANK[arrivalMode] || QUESTION_BANK.pain;
  return bank[day - 1] || bank[0];
}

// ── HELPER — devuelve la pregunta beta según modo ─────────────────────────
function getBetaQuestion(arrivalMode) {
  return BETA_QUESTIONS[arrivalMode] || BETA_QUESTIONS.unclear;
}

module.exports = {
  ARRIVAL_QUESTION,
  QUESTION_BANK,
  CLOSING_BANK,
  BETA_QUESTIONS,
  MAX_TURNS_PER_DAY,
  getRandomQuestions,
  buildQuestionSet,
  getQuestion,
  getBetaQuestion,
};
