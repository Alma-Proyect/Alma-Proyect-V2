// lib/bueno.js
// «Con algo bueno que contar»: no es una puerta. Es un día suelto que ella
// puede elegir cualquier día. Ese día no hay guardiana: responde Alma con su
// prompt base (con el protocolo de crisis y todas sus reglas), sin capa de voz.
// La pregunta es la misma que ve en la app (PREGUNTA_BUENO en app.html).

const PREGUNTA_BUENO = "¿Qué ha pasado de bueno que quieras contar?";

// ¿Es un día bueno? La app lo dice con bueno: true; por si acaso, también se
// reconoce por la puerta o el modo.
function esDiaBueno(datos) {
  return !!datos && (datos.bueno === true || datos.puerta === "bueno" || datos.arrivalMode === "bueno");
}

// Lo que se añade al prompt base el día bueno, en el sitio donde iría la
// guardiana. Cómo responder a algo alegre está en el prompt base (sirve
// también cuando una buena noticia aparece cualquier otro día).
const CAPA_BUENO = `HOY HA VENIDO CON ALGO BUENO QUE CONTAR:
Hoy no ha entrado por ninguna puerta: ha elegido contarte algo bueno. Sigue lo que dicen tus instrucciones para cuando te cuentan algo bueno, y además:
- No saques tú lo de días anteriores, aunque lo tengas delante. Hoy es su día bueno. Si ella misma lo relaciona con lo de otros días, síguela.
- Si lo que cuenta resulta no ser tan bueno, o viene mezclado con algo que pesa, no la corrijas ni le digas que eso no era bueno: acompaña lo que haya.
- El cierre nace de lo bueno que ha contado. Sin «guárdalo», sin «ojalá vengan más días así».`;

module.exports = { PREGUNTA_BUENO, CAPA_BUENO, esDiaBueno };
