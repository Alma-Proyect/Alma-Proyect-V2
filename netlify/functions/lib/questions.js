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
    "¿Cuándo fue la última vez que sentiste que alguien podía sostener lo que te pasaba… y tú dejaste de fingir que estabas bien?",
    "¿Cuándo aprendiste a hacerte pequeña para que los demás estuvieran cómodos?",
    "Si alguien a quien amas sintiera lo que tú sientes ahora, ¿qué le dirías que nunca te dices a ti?",
    "¿Qué es lo que más te cuesta soltar?",
    "¿Cuándo fue la última vez que estuviste mal y lo dejaste estar, sin hacer nada con ello?",
    "¿Qué parte de lo que sientes ahora llevas tiempo sin contárselo a nadie?",
    "¿Qué emoción estás cargando que no es tuya y sigues cargando igual?",
    "¿Qué es lo que hoy no quieres mirar, aunque sabes que está ahí?",
    "¿Qué pasaría si dejaras de vigilar lo que sientes?",
    "¿Qué es lo que nadie sabe que necesitas ahora mismo?",
  ],

  curiosity: [
    "¿Qué parte de ti lleva tiempo sin tener espacio para existir?",
    "¿Qué has asumido de ti misma sin cuestionarlo nunca, solo porque siempre ha sido así?",
    "¿Qué sientes cuando no tienes que interpretar ningún papel?",
    "¿Qué versión de ti misma aparece cuando nadie te está mirando?",
    "¿Qué deseo tuyo llevas tiempo dejando para después, sin una razón clara?",
    "¿Qué te sorprendió de ti misma esta semana, aunque fuera algo pequeño?",
    "¿Qué sabes de ti que todavía no te has dicho a ti misma en voz alta?",
    "¿Qué necesitas sentir, no dar, no resolver, no sostener, solo sentir tú?",
    "¿Qué parte de ti aparece cuando bajas la guardia?",
    "¿Qué relación tienes con la mujer que eras hace dos años?",
  ],

  open: [
    "¿Cómo estás de verdad, no la respuesta de siempre, sino la real?",
    "¿Qué emoción hay debajo de ese 'no sé muy bien'?",
    "¿Qué es lo primero que te vino a la mente cuando decidiste abrir esto hoy?",
    "¿Hay algo que llevas tiempo sintiendo pero que todavía no has podido ponerle nombre?",
    "¿Si tuvieras que ponerle una palabra a lo que sientes ahora mismo, solo una, ¿cuál sería?",
    "¿Hay algo que estás sosteniendo hoy que todavía no sabes si merece espacio?",
    "¿Qué hay detrás del 'estoy bien' que te dices antes de atreverte a quedarte en silencio?",
    "Si pudieras hablar de cualquier cosa hoy, ¿de qué hablarías?",
    "¿Qué es lo que hoy te hizo parar, aunque sea un momento, y escucharte?",
    "¿Qué necesitas hoy que no has pedido?",
  ],

  depth: [
    "¿Qué sientes cuando la vida está tranquila y aun así algo en ti no termina de estarlo?",
    "¿Cuándo fue la última vez que confundiste estar bien con estar perdida?",
    "¿Cuando todo se siente plano, qué es lo primero que te dices?",
    "¿Qué pasa cuando el silencio llega y no se siente paz, se siente vacío?",
    "¿Qué estás esperando que ocurra para saber que ya estás bien?",
    "¿Qué hay en ti que ya no duele como antes, pero que todavía no te atreves a tocar?",
    "¿Y si lo que no entiendes de lo que sientes no es confusión, sino que aún no tiene nombre?",
    "¿Cuándo empezaste a leer la calma como señal de alarma?",
    "¿Qué parte de ti espera que esto se rompa?",
    "¿Qué pregunta sobre ti misma llevas tiempo evitando, y todavía te da vértigo enfrentarla?",
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
