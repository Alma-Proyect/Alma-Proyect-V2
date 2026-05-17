// lib/questions.js
// Fuente única de verdad para todas las preguntas de Alma
// Si cambias una pregunta, aquí es el único sitio donde tocarlo

// ── PREGUNTA CERO — pantalla de bienvenida ────────────────────────────────
// Le dice a Alma cómo llega la usuaria antes de empezar.
// Tres opciones, sin texto libre. El resto viene después.
const ARRIVAL_QUESTION = {
  text: "Antes de empezar — ¿cómo llegas?",
  options: [
    { id: "weight",    label: "Con algo que pesa",      almaMode: "pain"      },
    { id: "curiosity", label: "Con ganas de conocerme", almaMode: "curiosity" },
    { id: "open",      label: "Sin saber muy bien",     almaMode: "open"      },
  ],
};

// ── PREGUNTAS POR ESTADO DE ÁNIMO ─────────────────────────────────────────
// "pain"      → llega con algo que pesa
// "curiosity" → llega desde el bienestar o la curiosidad
// "open"      → no sabe muy bien — usa el set de pain por defecto
//               porque es más seguro acoger desde ahí

const QUESTIONS = {
  pain: {
    1: "¿Cuándo fue la última vez que sentiste que alguien podía sostener lo que te pasaba… y tú dejaste de fingir que estabas bien?",
    2: "¿En qué momento empezaste a creer que tus emociones eran demasiado para los demás?",
    3: "Si alguien a quien amas estuviera sintiendo exactamente lo que tú sientes ahora… ¿qué le dirías? Y por qué nunca te lo dices a ti?",
  },
  curiosity: {
    1: "¿Qué parte de ti existe en silencio simplemente porque nunca ha tenido espacio para aparecer?",
    2: "¿Qué hay en ti que has llamado \"normal\" solo porque siempre has sido así?",
    3: "¿Qué parte de ti está esperando vivir con más verdad?",
  },
};

// "open" recibe el set de pain — es más seguro acoger desde la presencia
// que desde la ligereza cuando no sabemos cómo llega
QUESTIONS.open = QUESTIONS.pain;

// ── NÚMERO MÁXIMO DE TURNOS POR DÍA ───────────────────────────────────────
// 3 turnos: usuaria escribe → Alma → usuaria → Alma → usuaria → Alma cierra
const MAX_TURNS_PER_DAY = 3;

// ── HELPER — devuelve la pregunta correcta ─────────────────────────────────
function getQuestion(arrivalMode, day) {
  const mode = QUESTIONS[arrivalMode] ? arrivalMode : "pain";
  return QUESTIONS[mode][day] || QUESTIONS.pain[day];
}

module.exports = { ARRIVAL_QUESTION, QUESTIONS, MAX_TURNS_PER_DAY, getQuestion };
