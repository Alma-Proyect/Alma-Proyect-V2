// ─────────────────────────────────────────────
// GUARDIANAS · capas de voz por puerta
// Cada guardiana es una capa que se SUMA a la esencia maestra.
// Vive en lib/ (no en netlify/functions/) para que Netlify no la publique
// como si fuera una función.
// ─────────────────────────────────────────────

const { ITACA } = require("./guardiana-itaca");
const { CALA } = require("./guardiana-cala");
const { SOLAZ } = require("./guardiana-solaz");
const { BRUMA } = require("./guardiana-bruma");

// Mapa: puerta → capa de voz de su guardiana.
const GUARDIANAS = {
  nudos:    SOLAZ,   // "Con nudos"
  sinsaber: BRUMA,   // "Sin saber por qué"
  agotada:  CALA,    // "Agotada"
  volver:   ITACA,   // "Volver a mí"
};

const PUERTAS = Object.keys(GUARDIANAS);

// Quien empezó con las opciones antiguas de la beta (o del recorrido) sigue
// con la guardiana más cercana a lo que eligió. «Con una inquietud» (self /
// depth) no tiene guardiana: responde la voz maestra, como hasta ahora.
const PUERTA_DE_MODO_ANTIGUO = {
  beta_pain: "nudos",    pain: "nudos",
  beta_unclear: "sinsaber", open: "sinsaber",
  beta_search: "volver", curiosity: "volver",
};

// Devuelve la puerta válida a partir de lo que mande la app (puerta o modo antiguo).
function resolverPuerta(puerta, arrivalMode) {
  if (PUERTAS.includes(puerta)) return puerta;
  if (PUERTAS.includes(arrivalMode)) return arrivalMode;
  return PUERTA_DE_MODO_ANTIGUO[arrivalMode] || null;
}

// Devuelve la capa de voz de la guardiana según la puerta, o null.
function getGuardiana(puerta) {
  return GUARDIANAS[puerta] || null;
}

module.exports = { getGuardiana, resolverPuerta, PUERTAS };
