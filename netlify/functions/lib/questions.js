// lib/questions.js
// Fuente única de verdad para todas las preguntas de Alma
// 10 preguntas potentes por estado, mas 4 de cierre para el final del recorrido largo.
// Se eligen al azar segun el numero de dias (3, 5 o 7). Nunca se repite una.
// Cada experiencia es unica.

// ── PREGUNTA CERO — pantalla de bienvenida ────────────────────────────────
const ARRIVAL_QUESTION = {
  text: "Antes de empezar, ¿cómo llegas?",
  options: [
    { id: "weight",  label: "Con algo que pesa",      almaMode: "pain"      },
    { id: "curiosity", label: "Con ganas de conocerme", almaMode: "curiosity" },
    { id: "open",    label: "Sin saber muy bien",      almaMode: "open"      },
    { id: "depth",   label: "Profundizar en mí",       almaMode: "depth"     },
  ],
};

// ── BANCO DE PREGUNTAS — 10 por estado de ánimo ───────────────────────────
const QUESTION_BANK = {
  pain: [
    "¿Con quién puedes dejar de fingir que estás bien?",
    "¿Hay algo que callas para que los demás estén cómodos?",
    "Si una amiga sintiera lo que tú sientes ahora, ¿qué le dirías?",
    "¿Qué es lo que más te cuesta soltar?",
    "La última vez que estuviste mal, ¿qué hiciste con ello?",
    "¿Qué llevas tiempo sin contarle a nadie?",
    "¿Qué estás cargando que quizá no te toca cargar?",
    "¿Qué prefieres no mirar hoy?",
    "¿Qué pasaría si dejaras de vigilar lo que sientes?",
    "¿Qué necesitas ahora mismo y nadie sabe?",
  ],
  curiosity: [
    "¿Qué parte de ti necesita más espacio?",
    "¿Qué das por hecho de ti misma sin haberlo cuestionado?",
    "¿Qué sientes cuando no tienes que interpretar ningún papel?",
    "¿Cómo eres cuando nadie te mira?",
    "¿Qué deseo llevas tiempo dejando para después?",
    "¿Qué te sorprendió de ti misma esta semana, aunque fuera algo pequeño?",
    "¿Qué sabes de ti que todavía no te has dicho en voz alta?",
    "¿Qué necesitas sentir hoy, sin tener que resolver nada?",
    "¿Qué parte de ti aparece cuando bajas la guardia?",
    "¿Qué le dirías a la mujer que eras hace dos años?",
  ],
  open: [
    "¿Cómo estás, de verdad? No la respuesta de siempre.",
    "¿Qué emoción hay debajo de ese 'no sé muy bien'?",
    "¿Qué te vino a la mente al abrir esto hoy?",
    "¿Hay algo que sientes y todavía no sabes nombrar?",
    "Si tuvieras que ponerle una sola palabra a lo que sientes, ¿cuál sería?",
    "¿Hay algo que sostienes hoy y no sabes si merece espacio?",
    "¿Qué hay detrás de tu 'estoy bien'?",
    "Si pudieras hablar de cualquier cosa hoy, ¿de qué hablarías?",
    "¿Qué te hizo parar hoy, aunque fuera un momento?",
    "¿Qué necesitas hoy que no has pedido?",
  ],
  depth: [
    "¿Qué sientes cuando todo está tranquilo pero tú no?",
    "¿Alguna vez has confundido estar bien con estar perdida?",
    "Cuando todo se siente plano, ¿qué te dices?",
    "¿Qué haces cuando el silencio se siente vacío y no en paz?",
    "¿Qué esperas que ocurra para sentir que ya estás bien?",
    "¿Qué ya no duele como antes, pero aún no te atreves a tocar?",
    "¿Y si lo que sientes no es confusión, sino algo que aún no tiene nombre?",
    "¿Cuándo empezaste a leer la calma como señal de alarma?",
    "¿Qué parte de ti espera que esto se rompa?",
    "¿Qué pregunta sobre ti llevas tiempo evitando?",
  ],
};

// ── BANCO DE CIERRE — solo días 6 y 7 del recorrido de 7 ──────────────────
// Recogen el recorrido en vez de abrir herida. Solo las ve quien llega al
// final. Quien hace 1, 3 o 5 días nunca las recibe: se lleva siempre lo más
// potente del banco normal.
const CLOSING_BANK = {
  pain: [
      "Después de todos estos días diciendo lo que callabas, ¿qué se ha aflojado por dentro?",
      "Lo que trajiste el primer día pesaba de una forma. ¿Pesa igual ahora?",
      "Si la mujer del primer día te viera hoy, ¿qué notaría distinto en ti?",
      "De todo lo que has soltado aquí, ¿qué es lo que ya no quieres volver a cargar?"
    ],

  curiosity: [
      "De todo lo que has descubierto de ti estos días, ¿qué es lo que no quieres olvidar?",
      "¿Qué parte de ti, que estaba callada al empezar, ha encontrado su voz aquí?",
      "Si tuvieras que quedarte con una sola cosa que has descubierto de ti, ¿cuál sería?",
      "¿Qué vas a hacer distinto ahora que has descubierto algo nuevo en esta etapa?"
    ],

  open: [
      "Empezaste sin saber muy bien. ¿Has podido ordenar un poco lo que sentías?",
      "De todo lo que ha ido saliendo estos días, ¿qué era lo que de verdad pedía espacio?",
      "¿Qué palabra le pondrías ahora a eso que al principio no sabías nombrar?",
      "Si pudieras llevarte una frase ancla para los días que vuelvas a perderte, ¿cuál sería?"
    ],

  depth: [
      "Después de mirar tan adentro estos días, ¿qué has encontrado que no esperabas?",
      "¿Qué has dejado de necesitar entender para poder estar en paz?",
      "¿Qué has dejado de ver como alarma y has empezado a sostener con calma?",
      "De todo lo que ha aparecido aquí, ¿qué te llevas para cuando la vida vuelva a estar en silencio?"
    ],
};


// ── PREGUNTAS BETA — una por modo de llegada (ids beta_*, como en index.html) ──
// Simples. Directas. La profundidad la pone Alma en la respuesta.
const BETA_QUESTIONS = {
  beta_pain:    "¿Qué es lo que más te pesa hoy?",
  beta_search:  "¿Qué parte de ti quieres escuchar hoy?",
  beta_self:    "¿Qué te está pidiendo atención últimamente?",
  beta_unclear: "¿Qué te ha traído aquí hoy?",
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
  return BETA_QUESTIONS[arrivalMode] || BETA_QUESTIONS.beta_unclear;
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
