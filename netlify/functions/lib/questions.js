// lib/questions.js
// Fuente única de verdad para todas las preguntas de Alma
// 10 preguntas por estado de ánimo — se eligen 3 al azar para cada usuaria
// Cada experiencia es única — nunca el mismo orden

// ── PREGUNTA CERO — pantalla de bienvenida ────────────────────────────────
const ARRIVAL_QUESTION = {
  text: "Antes de empezar — ¿cómo llegas?",
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
    "Si alguien a quien amas sintiera lo que tú sientes ahora — ¿qué le dirías que nunca te dices a ti?",
    "¿Qué es lo que más te cuesta soltar?",
    "¿Cuándo fue la última vez que estuviste mal y lo dejaste estar — sin hacer nada con ello?",
    "¿Qué parte de lo que sientes ahora llevas tiempo sin contárselo a nadie?",
    "¿Qué emoción estás cargando que no es tuya — y sigues cargando igual?",
    "¿Qué es lo que hoy no quieres mirar — aunque sabes que está ahí?",
    "¿Qué pasaría si dejaras de vigilar lo que sientes?",
    "¿Qué es lo que nadie sabe que necesitas ahora mismo?",
  ],

  curiosity: [
    "¿Qué parte de ti lleva tiempo sin tener espacio para existir?",
    "¿Qué has asumido de ti misma sin cuestionarlo nunca — solo porque siempre ha sido así?",
    "¿Qué sientes cuando no tienes que interpretar ningún papel?",
    "¿Qué versión de ti misma aparece cuando nadie te está mirando?",
    "¿Qué deseo tuyo llevas tiempo dejando para después — sin una razón clara?",
    "¿Qué te sorprendió de ti misma esta semana — aunque fuera algo pequeño?",
    "¿Qué sabes de ti que todavía no te has dicho a ti misma en voz alta?",
    "¿Qué necesitas sentir — no dar, no resolver, no sostener — solo sentir tú?",
    "¿Qué parte de ti aparece cuando bajas la guardia?",
    "¿Qué relación tienes con la mujer que eras hace dos años?",
  ],

  open: [
    "¿Cómo estás de verdad — no la respuesta de siempre, sino la real?",
    "¿Qué emoción hay debajo de ese 'no sé muy bien'?",
    "¿Qué es lo primero que te vino a la mente cuando decidiste abrir esto hoy?",
    "¿Hay algo que llevas tiempo sintiendo pero que todavía no has podido ponerle nombre?",
    "¿Si tuvieras que ponerle una palabra a lo que sientes ahora mismo — solo una — cuál sería?",
    "¿Hay algo que estás sosteniendo hoy que todavía no sabes si merece espacio?",
    "¿Qué hay detrás del 'estoy bien' que te dices antes de atreverte a quedarte en silencio?",
    "Si pudieras hablar de cualquier cosa hoy — ¿de qué hablarías?",
    "¿Qué es lo que hoy te hizo parar — aunque sea un momento — y escucharte?",
    "¿Qué necesitas hoy que no has pedido?",
  ],

  depth: [
    "¿Qué sientes cuando la vida está tranquila y aun así algo en ti no termina de estarlo?",
    "¿Cuándo fue la última vez que confundiste estar bien con estar perdida?",
    "¿Cuando todo se siente plano, qué es lo primero que te dices?",
    "¿Qué pasa cuando el silencio llega y no se siente paz — se siente vacío?",
    "¿Qué estás esperando que ocurra para saber que ya estás bien?",
    "¿Qué hay en ti que ya no duele como antes — pero que todavía no te atreves a tocar?",
    "¿Y si lo que no entiendes de lo que sientes no es confusión — sino que aún no tiene nombre?",
    "¿Cuándo empezaste a leer la calma como señal de alarma?",
    "¿Qué parte de ti espera que esto se rompa?",
    "¿Qué pregunta sobre ti misma llevas tiempo evitando — y todavía te da vértigo enfrentarla?",
  ],
};

// "open" tiene su propio banco — no cae a pain
// pain es el fallback solo si el modo no existe

// ── NÚMERO MÁXIMO DE TURNOS POR DÍA ───────────────────────────────────────
const MAX_TURNS_PER_DAY = 3;

// ── HELPER — elige 3 preguntas al azar del banco para esta usuaria ─────────
// Se llama una vez al inicio de la sesión y se guarda en el frontend
function getRandomQuestions(arrivalMode) {
  const bank = QUESTION_BANK[arrivalMode] || QUESTION_BANK.pain;
  const shuffled = [...bank].sort(() => Math.random() - 0.5);
  return {
    1: shuffled[0],
    2: shuffled[1],
    3: shuffled[2],
  };
}

// ── HELPER — devuelve la pregunta correcta dado un set ya elegido ──────────
function getQuestion(arrivalMode, day, questionSet) {
  // Si viene un set aleatorio ya generado, úsalo
  if (questionSet && questionSet[day]) return questionSet[day];
  // Fallback: primera del banco en orden
  const bank = QUESTION_BANK[arrivalMode] || QUESTION_BANK.pain;
  return bank[day - 1] || bank[0];
}

module.exports = {
  ARRIVAL_QUESTION,
  QUESTION_BANK,
  MAX_TURNS_PER_DAY,
  getRandomQuestions,
  getQuestion
};
