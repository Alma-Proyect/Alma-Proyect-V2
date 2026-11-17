// public/cuaderno/textos.js
// Textos fijos del cuaderno descargable: escritos y revisados a mano, nunca
// generados. Aquí se corrige cualquier palabra del cuaderno.
// Cada historia tiene su ilustración en /cuaderno/img/<id>.jpg; si falta la
// imagen, la historia sale sola.

window.CUADERNO = {
  // Lo que se lee antes de los ejercicios, según el tramo
  intro: {
    3: "Estas páginas son para seguir escribiendo, esta vez a mano. Aquí tienes dos propuestas. Puedes elegir una, las dos o ninguna. No hay nada que completar.",
    5: "Dos propuestas más, para cuando quieras escribir con calma. Lo que salga está bien, aunque sean cuatro líneas.",
    7: "Estas dos propuestas se quedan contigo, por si algún día te apetece volver a escribir a partir de ellas. Sirven todas las veces que quieras.",
  },
  cuidado: "Si algo se vuelve demasiado difícil, puedes parar o dejarlo para otro día.",
  sinFuerzas: "Si hoy no tienes fuerzas para ninguno, no lo hagas. El cuaderno no tiene prisa.",
  cierre: "No tienes que terminar estas páginas. Puedes escribir una línea, dejarlas en blanco o volver a ellas otro día. Son tuyas.",
  cierreCarta: "Al principio está lo que escribiste estos días, con tus palabras.",
  telefonos: "Si en algún momento lo estás pasando muy mal, puedes llamar al 024 o al 717 003 717, gratis y a cualquier hora. Si alguien te da miedo o te hace daño, el 016, que no sale en la factura, o por WhatsApp el 600 000 016.",
  paginaLibre: "Para lo que quieras escribir",
  // «Conversaciones conmigo» en papel: tercera propuesta del cuaderno de 3 días,
  // en todas las puertas. La hoja se parte en dos columnas.
  conversacion: {
    titulo: "Una conversación contigo.",
    para: "Para escuchar a las dos.",
    texto: "Piensa en algo que llevas tiempo queriendo hacer, o dejar de hacer. A la izquierda, escribe lo que te dice la parte de ti que se protege: sus miedos, sus razones, lo que intenta evitarte. A la derecha, lo que le contestaría la parte de ti que se escucha. No tienen que ponerse de acuerdo. Basta con que hablen.",
    columnas: ["La que se protege dice…", "La que se escucha responde…"],
  },
  // Página antes de las propuestas, en todos los cuadernos
  botiquin: {
    titulo: "Tu botiquín",
    intro: "Antes de las propuestas, deja esto preparado. Es para los días en que algo vuelva a apretar, o por si alguna de estas páginas te remueve más de la cuenta.",
    apartados: [
      { titulo: "Personas a las que puedo escribir o llamar", lineas: 4 },
      { titulo: "Cosas que me calman, aunque sea un poco", lineas: 5 },
      { titulo: "Un sitio donde estoy tranquila", lineas: 2 },
    ],
  },
  // Penúltima página: para seguir escribiendo cuando acabe Alma
  seguir: {
    titulo: "Para seguir escribiendo",
    intro: "Cuando acabes con Alma, puedes seguir aquí. Cada noche, antes de dormir, una línea: algo que te ha gustado de hoy, o de ti. Al principio cuesta, porque la cabeza se va sola a lo que salió mal. Si una noche no sale nada, deja la línea en blanco y sigue al día siguiente.",
    lineas: 21,
  },
  numeros: { 3: "Tres días", 5: "Cinco días", 7: "Siete días" },

  // Los días que entró «con algo bueno que contar»: un apartado aparte,
  // dorado, al final del cuaderno, con una de las historias alegres.
  bueno: {
    titulo: "Un día bueno",
    intro: "Algún día de estos viniste con algo bueno que contar. Estas páginas son para guardarlo.",
    propuesta: { titulo: "Lo bueno, con detalle.", para: "Para que no se pierda.",
      texto: "Escribe ese momento con todo el detalle que recuerdes: dónde estabas, quién había, qué se oía, cómo te sentías. Si te apetece, añade otros ratos buenos de estos días, aunque sean pequeños." },
  },

  // Dos ejercicios por puerta y tramo. cuidado: true pone delante la línea de cuidado.
  // Si un tramo tiene tres, el primero sale siempre y el segundo se elige al
  // azar entre los otros dos (y se guarda, para que no cambie al volver a descargar).
  ejercicios: {
    nudos: {
      3: [
        { titulo: "Escríbelo como salga.", para: "Para sacar el nudo de la cabeza y verlo en el papel.",
          texto: "Escribe unos minutos lo que te pesa. Puedes parar, dejar huecos o cambiar de tema. No hace falta contarlo todo ni que quede bien. Si te quedas en blanco, para: también vale." },
        { titulo: "Lo que sé y lo que me pregunto.", para: "Para separar lo que ya ha pasado de lo que da vueltas.",
          texto: "Divide la hoja en dos. A la izquierda, lo que sabes de lo que te pasa: lo que ya ha ocurrido. A la derecha, lo que te preguntas, lo que temes o lo que imaginas. No tienes que resolver nada: solo ver en qué lado está cada cosa." },
      ],
      5: [
        { titulo: "Una carta que no vas a mandar.", para: "Para decir lo que se ha quedado dentro.", cuidado: true,
          texto: "Escribe a alguien de esta historia lo que no le has dicho. Puede ser a otra persona o a ti misma de antes. No la vas a enviar, así que no tienes que medir nada: ni ser justa, ni ser amable, ni tener razón. Cuando acabes, guárdala o rómpela, lo que te pida el cuerpo." },
        { titulo: "De quién es cada cosa.", para: "Para ver lo que llevas encima.",
          texto: "Haz una lista de todo lo que estás cargando con este nudo. Al lado de cada cosa, apunta si depende de ti, de otra persona, de las dos, o si no lo tienes claro. No hace falta soltar nada hoy. Solo mirar de quién es cada cosa." },
        { titulo: "Lo que necesito, en una frase.", para: "Para saber qué necesitas, aunque todavía no lo pidas.",
          texto: "Piensa en la persona de este nudo y escribe lo que necesitas de ella en una sola frase, sencilla, como si se lo dijeras a la cara. Sin explicar por qué, sin pedir perdón y sin suavizarlo. No tienes que decírselo nunca. A veces basta con saber qué es." },
      ],
      7: [
        { titulo: "Tres líneas.", para: "Para los días en que algo vuelva a apretar.",
          texto: "Escribe solo tres líneas: qué ha pasado, qué has sentido, qué necesitas ahora. Si quieres seguir, sigue. Si no, con eso ya lo has sacado de la cabeza." },
        { titulo: "Cómo lo diría hoy.", para: "Para ver tu propio camino con tus palabras.",
          texto: "Escribe cómo contarías hoy lo que te pesa, como si se lo contaras a alguien por primera vez. Si te apetece, y solo si te apetece, relee después lo que escribiste el primer día y fíjate en si algo ha cambiado al contarlo. Puede que hoy pese igual o más, y también vale." },
        { titulo: "De quién es esta vergüenza.", para: "Para dejar en su sitio lo que no es tuyo.", cuidado: true,
          texto: "Escribe algo que te dé vergüenza de ti o de lo que has vivido, aunque sea pequeño. Al lado, pregúntate de dónde viene: si la sentirías igual si nadie te hubiera dicho nunca nada, o si es de alguien que te la pasó. No tienes que soltarla hoy. Solo mirar si es tuya." },
      ],
    },
    sinsaber: {
      3: [
        { titulo: "Cómo estoy hoy.", para: "Para escribir lo que notas sin tener que explicarlo.",
          texto: "Escribe cómo estás hoy con lo que notas: cómo tienes el cuerpo, qué te apetece y qué no, qué te cuesta. No hace falta buscar el motivo. Si sale alguno, déjalo ahí; si no sale, también está bien." },
        { titulo: "Un rato un poco menos malo.", para: "Para que no se pierda.",
          texto: "Busca un momento del día en el que hayas estado un poco menos mal, por pequeño que sea: un café, una conversación, cinco minutos en la cama. Escríbelo con detalle: dónde estabas, qué había alrededor. Si hoy no lo ha habido, escribe eso, que también vale." },
      ],
      5: [
        { titulo: "Palabras sueltas.", para: "Para los días en que no salen frases.",
          texto: "Si no te salen frases, no las fuerces. Escribe palabras sueltas, las que vengan: colores, sitios, nombres, cosas del día. No tienen que tener sentido juntas. A veces es lo único que se puede escribir, y basta." },
        { titulo: "Algo que sí sé de mí.", para: "Para acordarte de ti cuando todo está borroso.",
          texto: "Cuando no sabes qué te pasa, puede parecer que no sabes nada de ti. Escribe una cosa que sí sabes de ti, aunque sea pequeña: cómo te gusta el café, una canción que siempre vuelves a poner, a quién llamarías si pudieras. Una basta. Si salen más, sigue." },
        { titulo: "Lo que se ve y lo que no.", para: "Para mirar también lo que guardas.",
          texto: "Haz una raya en mitad de la hoja. Arriba, escribe lo que los demás ven de ti estos días: lo que contestas cuando te preguntan, la cara que pones. Abajo, lo que no ve nadie. No hace falta explicar nada ni saber de dónde viene. Solo dejar que las dos partes estén en el mismo papel." },
      ],
      7: [
        { titulo: "Hoy no sé qué me pasa, pero noto que…", para: "Para los días en que vuelva a costarte sin motivo.",
          texto: "Abre el cuaderno y empieza con esa frase. Sigue a partir de ahí con lo que salga. No tienes que llegar a ninguna conclusión." },
        { titulo: "Una carta para ese día.", para: "Para tener algo tuyo a mano.",
          texto: "Escribe algo corto para ti misma, una carta o solo tres palabras, para leerlo el próximo día en que te cueste todo sin saber por qué. Qué te gustaría que te dijeran ese día. Qué te ha servido estos días, aunque sea poco. Dóblalo y guárdalo dentro de este cuaderno." },
      ],
    },
    agotada: {
      3: [
        { titulo: "Una frase y ya.", para: "Para escribir sin gastar lo que no tienes.",
          texto: "Escribe una sola frase sobre cómo estás hoy. Si sale más, bien. Si no, con esa frase basta. No hace falta que esté bien escrita." },
        { titulo: "Una cosa que sostienes.", para: "Para que quede escrita en algún sitio.",
          texto: "Escribe una cosa que estés sosteniendo ahora mismo: una persona, una tarea, una preocupación. Si te apetece, añade otra. No tienes que resolver nada." },
      ],
      5: [
        { titulo: "Algo que nadie vio.", para: "Para que no pase sin que nadie lo vea.",
          texto: "Escribe una cosa de esta semana que nadie vio: algo pequeño que hiciste, algo que sentiste y no contaste, un rato que fue solo tuyo. No tiene que ser un esfuerzo ni algo que hiciste por otros." },
        { titulo: "Si alguien te preguntara de verdad.", para: "Para contestar sin el «bien» de siempre.",
          texto: "Imagina que alguien que te quiere te pregunta cómo estás y espera la respuesta, sin prisa. Escribe lo que le contestarías de verdad." },
      ],
      7: [
        { titulo: "Lo que te diría alguien que te quiere.", para: "Para oír lo que nadie te dice.",
          texto: "Escribe lo que te diría hoy alguien que te quiere de verdad y te ve cansada, sin pedirte nada a cambio. Puede ser alguien de tu vida o alguien que te habría gustado tener. Con sus palabras, o con las que te gustaría oír." },
        { titulo: "Lo que me da un respiro.", para: "Para tenerlo a mano el día que no te acuerdes.",
          texto: "Escribe las cosas pequeñas que, cuando estás así, te dan un respiro aunque sea de cinco minutos: una persona, un sitio, algo que te gusta comer, una canción. No tienes que hacer ninguna. Guarda esta lista para el día en que no se te ocurra nada." },
      ],
    },
    volver: {
      3: [
        { titulo: "Cosas que eran tuyas.", para: "Para acordarte de lo que fuiste dejando.",
          texto: "Escribe cosas que te gustaban y que has ido dejando por el camino: un sitio, una costumbre, una forma de vestir, algo que hacías sola. No tienes que recuperarlas. Solo acordarte de que estaban." },
        { titulo: "Hoy me he hecho caso cuando…", para: "Para fijarte en lo pequeño.",
          texto: "Busca un momento de hoy, o de estos días, en el que te hayas hecho caso: dijiste que no, elegiste lo que te apetecía, paraste cuando estabas cansada. Escríbelo. Si no encuentras ninguno, escribe un momento en el que te habría gustado hacerte caso." },
        { titulo: "Algo que te costó y lo hiciste.", para: "Para acordarte de lo que has podido.",
          texto: "Escribe algo que hiciste aunque te costaba, de ahora o de hace tiempo: una conversación, un cambio, levantarte un día que no podías. No hace falta que sea grande ni que saliera bien. Cuenta cómo fue, qué te ayudó a hacerlo y quién estaba cerca." },
      ],
      5: [
        { titulo: "Cómo te hablas.", para: "Para oír la voz con la que te tratas.",
          texto: "Acuérdate de un momento reciente en el que algo te salió mal y de cómo te hablaste por dentro. Escribe esa frase tal cual. Debajo, escribe cómo se lo dirías a una amiga a la que quieres si le pasara lo mismo." },
        { titulo: "Lo que te ha traído hasta aquí.", para: "Para mirar tu camino entero.",
          texto: "Escribe tres cosas de tu vida que de alguna forma te han traído hasta aquí, fáciles o difíciles, las que tú elijas. No hace falta dar las gracias por las que dolieron. Solo reconocer que estuvieron y que aquí sigues." },
        { titulo: "Alguien con quien estás tranquila.", para: "Para tener cerca una voz que te hace bien.",
          texto: "Piensa en una persona con la que te sientes tranquila, alguien con quien no tienes que hacerte la fuerte. Puede ser de ahora o de otro momento de tu vida. Escribe qué te diría si supiera lo que te está costando volver a ti. Si no te viene nadie, escribe cómo te gustaría que fuera esa persona." },
      ],
      7: [
        { titulo: "Qué necesito yo hoy.", para: "Para los días en que sientas que te has vuelto a perder.",
          texto: "Escribe la respuesta a esta pregunta: ¿qué necesito yo hoy, sin pensar en nadie más? Una línea basta, aunque sea algo muy pequeño." },
        { titulo: "Carta a la que fuiste.", para: "Para hablarte con cariño.", cuidado: true,
          texto: "Escribe una carta a la mujer que fuiste en algún momento importante para ti. Sin reñirle ni darle consejos: cuéntale lo que ahora sabes y lo que te habría gustado que alguien le dijera. No tienes que volver a ser ella. Si no te apetece mirar atrás, escríbele solo una frase." },
        { titulo: "Lo que intenta evitar esa voz.", para: "Para entender a la voz que te riñe, sin darle la razón.",
          texto: "Escribe una frase que te dices por dentro cuando algo te sale mal, tal como suena. Si ya la escribiste otro día, puede ser la misma. Debajo, intenta responder: ¿de qué intenta librarte esa voz? A veces riñe para que nadie más te riña, o para que nada te pille desprevenida. No tienes que hacerle caso. Solo saber qué busca." },
      ],
    },
  },

  // Banco de historias. El servidor (cuaderno-historia.js) elige el id según
  // lo que ella escribió; si no encaja ninguna, sale una al azar de su puerta.
  // azar: false = nunca sale al azar (solo si Haiku la elige). Las historias
  // alegres (N9-N10, B9-B10, A9-A10, I9-I10) son así: solo salen si ella misma
  // ha escrito algo bueno, nunca para animarla, y nunca si habla de una muerte.
  historias: {
    nudos: [
      { id: "N1", titulo: "El cordón", texto: "Carmen tenía prisa y el cordón de la zapatilla se le hizo un nudo. Tiró de un lado, tiró del otro, tiró de los dos a la vez, y el nudo se fue haciendo más pequeño y más duro. Se sentó en el escalón del portal, enfadada, con ganas de cortarlo. Al final dejó de tirar. Lo miró de cerca y vio por dónde entraba el lazo. Metió la uña ahí, solo ahí. Tardó un rato. El nudo no se deshizo de golpe: se aflojó una vuelta, luego otra. Llegó tarde, pero con el cordón entero." },
      { id: "N2", titulo: "El cajón", texto: "Lucía llevaba meses sin abrir el cajón de la cómoda. Un domingo lo vació entero encima de la cama: cartas, cargadores, fotos, un pendiente sin pareja, recibos de hace años. Durante un buen rato la habitación estuvo peor que nunca, y le entraron ganas de meterlo todo otra vez dentro y cerrar. No lo hizo. Fue cogiendo las cosas de una en una. Algunas las tiró. Otras volvieron al cajón. Una foto se la quedó en la mesilla. Esa noche el cajón no estaba perfecto, pero ya sabía lo que había dentro." },
      { id: "N3", titulo: "La mochila", texto: "Elena siempre llevaba la mochila llena: las llaves de su madre por si acaso, los papeles de su hermano, un paraguas para quien lo necesitara, la merienda de alguien. Un día, esperando el autobús, la dejó en el banco y notó los hombros raros, como si fueran de otra persona. Abrió la mochila y fue sacando cosas. Las miró una a una. Algunas eran suyas. De muchas no sabía ni cuándo habían entrado. No las tiró allí mismo. Solo se preguntó, por primera vez, de quién era cada una." },
      { id: "N4", titulo: "Los auriculares", texto: "Pilar sacó los auriculares del bolso y eran una bola. Tenía cinco minutos antes de entrar en la reunión y tiró fuerte, a ver si salían. Cuanto más tiraba, más se apretaban las vueltas. Se le escapó un taco. Luego los dejó encima de la mesa y empezó por un extremo. Una vuelta. Otra. Durante un rato parecía que no avanzaba nada. Cuando ya casi se había rendido, el cable se soltó entero, como si llevara todo ese tiempo esperando a que fuera despacio." },
      { id: "N5", titulo: "Las dos calles", texto: "Marta salió del metro en un barrio que no conocía, con el móvil sin batería, y se encontró con dos calles. Una subía, con tiendas y gente. La otra bajaba, más tranquila. Se quedó parada en la esquina tanto rato que un señor le preguntó si se había perdido. Le dijo que no, que estaba mirando. Y era verdad. Miró cada calle hasta el fondo, todo lo que se veía desde allí. No eligió enseguida. Pero cuando echó a andar, sabía por qué iba por esa." },
      { id: "N6", titulo: "Lo que no se deja en el suelo", azar: false, texto: "Cuando murió su padre, Ana sentía que llevaba algo muy pesado en los brazos todo el día: en el trabajo, en la cola del súper, en la cama. No se podía dejar en ningún sitio. La gente le decía que con el tiempo pesaría menos. No pesó menos. Pero un día, meses después, se dio cuenta de que había aprendido a llevarlo de otra manera, más pegado al cuerpo, con los brazos menos rígidos. Seguía ahí. Solo que ya podía, a ratos, mirar alrededor mientras lo llevaba." },
      { id: "N7", titulo: "La puerta", texto: "En casa de Rocío la puerta siempre estaba abierta. Entraba el ruido de la escalera, el frío de enero, la vecina a pedir sal, el primo a quedarse a cenar sin avisar. A ella le gustaba que su casa fuera así. Hasta que un invierno se dio cuenta de que nunca tenía un rato para ella, ni para sentarse con un café. Un día entornó la puerta. No la cerró del todo. La vecina vino igual, y el primo también. Pero ahora llamaban. Y Rocío podía decidir cuándo abrir." },
      { id: "N8", titulo: "La persiana", texto: "Inés pasó un invierno entero con la persiana bajada. Se acostumbró a la luz de la lámpara, al sitio exacto de cada mueble en penumbra. Una mañana de marzo alguien subió la persiana de golpe y el sol le dio en la cara. Lo primero que sintió fue molestia, y casi ganas de volver a bajarla. Tardó unos días en dejar de entornar los ojos. Le pareció raro que algo bueno costara tanto. Luego pensó que tenía sentido, después de tanto tiempo a oscuras." },
      { id: "N9", titulo: "La receta equivocada", azar: false, texto: "Marisa llevaba toda la mañana preparando una tarta para el cumpleaños de su hermana. Cuando la sacó del horno, tenía una forma rarísima: un lado enorme y el otro hundido. Intentó arreglarla con nata, pero quedó peor. Su hermana llegó antes de tiempo y la encontró en la cocina, con las manos blancas y cara de pocos amigos. Se miraron y empezaron a reírse. Al final pusieron las velas en el lado que había subido. Su hermana pidió la receta. Marisa le dijo que no tenía ni idea de cómo volver a hacerla." },
      { id: "N10", titulo: "El cajón de los botones", azar: false, texto: "Lourdes abrió el cajón de los botones buscando uno para su abrigo. Había botones de todos los tamaños, algunos todavía sujetos a cartoncitos, otros sueltos desde hacía años. Encontró uno rojo que recordaba de un vestido de su madre y tres dorados que no sabía de dónde habían salido. Se sentó a separarlos por colores. Su marido entró y preguntó qué estaba haciendo. «No tengo ni idea», contestó. Una hora después seguía allí, haciendo montoncitos. El botón del abrigo apareció debajo de una caja de cerillas." },
      { id: "N11", titulo: "El trozo de tela", azar: false, texto: "Cuando murió su madre, a Consuelo le tocó la rebeca gris que su madre se ponía para todo, para ir a la compra y para estar en casa. A Consuelo le quedaba grande y nunca se la iba a poner, pero tampoco podía meterla en una bolsa. La tuvo meses colgada detrás de la puerta. Una tarde cogió las tijeras de la costura y cortó un trocito del bolsillo, del tamaño de un sello. Lo guardó en la cartera, junto al carné. La rebeca siguió detrás de la puerta un tiempo más, hasta que supo qué hacer con ella. El trocito sigue en la cartera. A veces lo roza buscando las monedas, y no le hace falta sacarlo para saber qué es." },
    ],
    sinsaber: [
      { id: "B1", titulo: "La casa a oscuras", texto: "Teresa se despertó a las tres de la mañana con sed y no encendió la luz grande, para no despejarse del todo. Fue por el pasillo a tientas. No veía nada, pero la mano encontraba la pared, el marco de la puerta, el interruptor que no pulsó. Llegó a la cocina sin tropezar. Bebió agua a oscuras, apoyada en la encimera. No supo por qué se había despertado. Volvió a la cama igual que había ido, tocando las cosas una a una." },
      { id: "B2", titulo: "El jersey de siempre", texto: "Nuria se puso el jersey azul, el de siempre, el que le gustaba. Se miró en el espejo del ascensor y no le sentaba bien. El jersey era el mismo, la luz también. Pero algo no encajaba. Estuvo todo el día tirándose de las mangas. Por la noche se lo quitó y lo dejó en la silla. No supo decir qué le pasaba al jersey ni qué le pasaba a ella. Solo que ese día no estaba a gusto dentro de nada. Y que eso, aunque no tuviera explicación, era verdad." },
      { id: "B3", titulo: "El volumen bajo", texto: "Begoña fue al cine con sus amigas a ver una comedia. Todo el mundo se reía. Ella entendía los chistes, sabía que eran graciosos, pero la risa no le llegaba. Era como si la película tuviera el volumen muy bajo solo para ella. Al salir, las demás comentaban las escenas y ella asentía. No estaba triste exactamente. Estaba como detrás de un cristal. En el autobús de vuelta se acordó de cuando se reía hasta llorar. Y pensó que no era culpa suya que ahora no pudiera." },
      { id: "B4", titulo: "La sala de espera", texto: "Sara llevaba un buen rato en una sala de espera sin reloj. No había ventana, el móvil apenas tenía cobertura y nadie decía cuánto faltaba. Lo que más le cansaba era no saber cuánto. Si alguien le hubiera dicho «veinte minutos», habría leído una revista tranquila. Sin saberlo, cada minuto se hacía largo. Se dio cuenta de que llevaba dos cansancios encima: el de la espera y el de no saber si iba a acabar pronto. Y de que los dos pesaban." },
      { id: "B5", titulo: "El banco del parque", texto: "Laura se sentó en un banco del parque una tarde sin saber muy bien qué hacía allí. Al rato, una señora mayor se sentó en el otro extremo con una bolsa de pan. No le preguntó nada. No le dijo que sonriera. Solo estuvo. Dieron de comer a las palomas sin hablar. Cuando la señora se fue, Laura seguía sin saber qué le pasaba. Pero durante media hora no había estado sola con ello, y eso se le quedó." },
      { id: "B6", titulo: "La punta de la lengua", texto: "Isabel estaba contando algo en la cena y se le fue una palabra. La tenía ahí, en la punta de la lengua, y no salía. Cuanto más la buscaba, más se escondía. Al final dijo «eso, lo que sea» y siguió contando, y todos la entendieron igual. La palabra le vino dos horas después, fregando los platos, cuando ya no la buscaba. Otras veces no le ha vuelto nunca. Y la historia se ha entendido igual." },
      { id: "B7", titulo: "La gotera", texto: "En el bloque de Amparo, al piso de abajo se le inundó la cocina entera. Ella solo tenía una gotera pequeña en el baño, una mancha en el techo que crecía despacio. No se quejaba, porque lo de abajo era peor. Puso un cubo y siguió. Pero el cubo se llenaba cada noche, y el ruido de la gota no la dejaba dormir. Un día llamó al fontanero. Lo de su vecina seguía siendo más grande. Lo suyo también mojaba." },
      { id: "B8", titulo: "La canción", texto: "Raquel puso en el coche su canción favorita, la que se sabía de memoria desde los quince años. Ese día le sonó rara, como si fuera de otra persona. Se sabía cada palabra, pero no la sentía suya. Bajó el volumen, un poco asustada, y la dejó sonar hasta el final sin cantarla. Al apagar el coche pensó que la canción seguía siendo suya, aunque ese día no la reconociera." },
      { id: "B9", titulo: "El vestido amarillo", azar: false, texto: "Ainhoa entró en una tienda para comprar calcetines. Al fondo vio un vestido amarillo que jamás se habría probado. Era demasiado llamativo, demasiado distinto a su ropa de siempre. Lo cogió por curiosidad y entró en el probador. Cuando salió, la dependienta sonrió. Ainhoa se miró en el espejo y se echó a reír. Parecía que iba a una fiesta en agosto, aunque fuera martes y estuviera lloviendo. Compró los calcetines y el vestido. Al llegar a casa se lo puso otra vez, solo para cenar un bocadillo en la cocina." },
      { id: "B10", titulo: "La canción del supermercado", azar: false, texto: "Yolanda estaba eligiendo tomates cuando empezó a sonar una canción que conocía de memoria. Sin darse cuenta, comenzó a mover los hombros. Un hombre mayor, al otro lado del expositor, seguía el ritmo con los dedos sobre el carrito. Se miraron. Él levantó una ceja y ella soltó una carcajada. Durante unos segundos bailaron cada uno desde su lado de los tomates. Cuando terminó la canción, el hombre hizo una pequeña reverencia y siguió hacia la frutería. Yolanda se quedó buscando los tomates más maduros, todavía con ganas de tararear." },
      { id: "B11", titulo: "Lo que se queda debajo", texto: "En octubre, Paloma enterró unos bulbos en una maceta del balcón, porque se los había regalado una vecina. Durante todo el invierno la maceta pareció vacía: tierra oscura y nada más. Más de una vez estuvo a punto de remover la tierra para ver si había algo, o de tirarla y usar la maceta para otra cosa. No lo hizo. Solo la regaba de vez en cuando, sin saber muy bien para qué. Una mañana de marzo había dos puntas verdes asomando. Paloma no supo nunca qué había pasado ahí abajo todos esos meses. No le hizo falta saberlo." },
    ],
    agotada: [
      { id: "A1", titulo: "La bolsa", texto: "Silvia volvió del súper andando, con la bolsa pesada siempre en la misma mano porque en la otra llevaba el móvil. Eran diez minutos. Al llegar a casa no le dolía solo la mano: le dolía el brazo, el hombro, el cuello, hasta la cabeza. Se sentó en el sofá y no le apetecía ni quitarse el abrigo, ni poner la tele, ni llamar a nadie. Todo el cuerpo estaba cansado de una sola bolsa llevada demasiado rato, y ese cansancio llegaba también a las cosas que le gustaban." },
      { id: "A2", titulo: "El móvil al uno por ciento", texto: "A Mercedes se le quedó el móvil al uno por ciento a media tarde. Bajó el brillo, lo cerró todo y lo dejó quieto en el bolso. Iba lento, tardaba en abrir los mensajes, y no se le ocurrió enfadarse con él. Le pareció lo más lógico del mundo. Esa noche, tumbada, se dio cuenta de que llevaba semanas exigiéndose ir a toda velocidad con muchas menos fuerzas que el móvil. Y de que con ella no tenía la misma paciencia." },
      { id: "A3", titulo: "El moratón", texto: "Julia se dio un golpe con la esquina de la mesa y le salió un moratón enorme en el muslo. Durante días, cualquier roce le dolía: la costura del vaquero, el bolso, el gato subiéndose encima. Saltaba por todo. Su hermana le dijo que estaba muy borde. Julia se enfadó todavía más, y luego se echó a llorar en el baño. Tenía un golpe que nadie veía, y todo lo que lo rozaba le dolía." },
      { id: "A4", titulo: "Los platos", texto: "Alicia trabajó un verano de camarera y aprendió a llevar cuatro platos a la vez. Mientras los llevaba, no podía pensar en nada. Si alguien le preguntaba algo por el camino, no le salía la respuesta: toda la atención se le iba en que no se cayera ninguno. Años después, en una época de llevar demasiado a la vez en casa y en el trabajo, se acordó de aquello. No le salían las palabras ni las decisiones. Tenía las manos llenas por dentro." },
      { id: "A5", titulo: "La compra", texto: "Cristina subía cada sábado la compra por las escaleras, cuatro pisos sin ascensor. Un día, en el portal, su vecino le cogió dos bolsas sin preguntar. Subieron juntos charlando de cualquier cosa. Los escalones eran los mismos y las bolsas pesaban lo mismo. Pero llegó arriba con aire. Se quedó un momento en el rellano, con las llaves en la mano, pensando en cuántos sábados había subido sola sin preguntarse si alguien la ayudaría." },
      { id: "A6", titulo: "El vaso", texto: "Lola se puso a llorar en el súper porque no quedaba su yogur de siempre. Allí, delante de la nevera, con el carro a medio llenar. Le dio muchísima vergüenza. Una chica le preguntó si estaba bien. Lola dijo que sí, que era una tontería. Y era verdad que el yogur era una tontería. Pero ella llevaba meses llena hasta arriba, como un vaso al borde, y el yogur fue solo la última gota." },
      { id: "A7", titulo: "El banco de la cuesta", texto: "Rosa subía cada día la cuesta del colegio de sus hijos. A mitad había un banco, y nunca se sentaba: le parecía que si paraba, ya no arrancaría. Un día de mucho calor se sentó, solo un minuto. La cuesta seguía igual de larga. Pero recuperó el aire, se secó la frente, miró la calle desde allí. Luego siguió subiendo. Llegó arriba a la misma hora que siempre." },
      { id: "A8", titulo: "Las sillas", texto: "En todas las fiestas de la familia, Paula era la última en irse. Recogía las sillas, fregaba los vasos, guardaba la comida que sobraba. Todos le decían lo mismo al despedirse: «Qué haríamos sin ti, eres una máquina». Ella sonreía. Una noche, ya sola, con la espalda hecha polvo, se sentó en la última silla sin recoger. Pensó que nadie le había preguntado nunca si le dolía la espalda. Y que lo de ser una máquina no le quitaba ni una silla." },
      { id: "A9", titulo: "La cena de los jueves", azar: false, texto: "Los jueves, Gloria cenaba con tres amigas. Durante años había sido ella quien reservaba, recordaba la hora y preguntaba quién podía ir. Una semana se olvidó por completo. A las ocho recibió un mensaje: «Estamos abajo. Baja». Sus amigas habían comprado tortillas, pan y una botella de limonada. Se sentaron en un banco de la plaza y cenaron con las servilletas sobre las rodillas. Una contó una historia tan absurda del trabajo que Gloria acabó llorando de risa. Al volver a casa encontró otro mensaje: «El jueves que viene elegimos nosotras»." },
      { id: "A10", titulo: "El domingo en pijama", azar: false, texto: "Esther se despertó el domingo con una lista mental de cosas pendientes. Puso una lavadora, preparó café y se sentó un momento en el sofá. En la televisión daban una película antigua que había visto veinte veces. Se quedó mirando. Cuando terminó, empezó otra que también conocía. A mediodía seguía en pijama, con una tostada en la mano y el pelo revuelto. Su hija llamó para preguntarle qué había hecho durante la mañana. Esther miró la taza vacía, las zapatillas debajo de la mesa y la película que acababa de empezar. «Pues mira, poca cosa», dijo sonriendo." },
    ],
    volver: [
      { id: "I1", titulo: "La casa de antes", texto: "Irene volvió al piso donde había vivido de niña, ahora vacío, para ayudar con la venta. Al entrar, todo le pareció pequeño y extraño, de otra gente. Las paredes estaban pintadas de otro color. Iba a irse cuando abrió la puerta de la cocina y chirrió igual que hace treinta años. Se quedó quieta. Luego reconoció el olor del patio, la baldosa suelta del pasillo, las rayas de su altura en el marco. No lo reconoció todo. Pero fue encontrando cosas que seguían siendo suyas." },
      { id: "I2", titulo: "Los zapatos", texto: "Concha llevó durante años unos zapatos medio número más pequeños, porque eran bonitos y estaban rebajados. Se acostumbró a andar un poco encogida y ya ni lo notaba. Un verano los tiró. Los primeros días, descalza por casa, se sentía rara, como si le faltara algo, como si el suelo estuviera demasiado cerca. Hasta echaba de menos el apretón. Tardó un tiempo en entender que eso también era parte de quitárselos." },
      { id: "I3", titulo: "La lista de canciones", texto: "Beatriz encontró en un cajón un reproductor de música viejo con una lista que había hecho a los veinte años. Lo cargó y se lo puso para pasear. Algunas canciones ya no le decían nada, y las pasó sin pena. Otras la devolvieron de golpe a una chica que bailaba sola en su cuarto y que se le había olvidado. Esa noche hizo una lista nueva. Metió tres de aquellas y dejó fuera el resto." },
      { id: "I4", titulo: "La puerta baja", texto: "Noelia vivió años en una casa de pueblo con una puerta muy baja entre la cocina y el patio. Para pasar, siempre se agachaba. Cuando se mudó a un piso de techos altos, seguía agachando la cabeza al cruzar cualquier puerta. Su hija se reía. Ella ni se daba cuenta. Le costó meses volver a pasar recta. Las primeras veces, ponerse derecha le daba una sensación rara, como de estar ocupando demasiado sitio." },
      { id: "I5", titulo: "Los muebles", texto: "Eva cambió el sofá de sitio, quitó la alfombra que le había regalado su suegra y pintó una pared de verde. Cuando vino la familia a comer, todos lo notaron. Su cuñada dijo «uy, qué distinto está todo», con una cara que no era de gustarle. Su madre preguntó por la alfombra. Eva se quedó un poco cortada. Cuando se fueron, se sentó en el sofá, en su sitio nuevo, miró la pared verde y pensó que la casa seguía siendo la suya. Más que antes, incluso." },
      { id: "I6", titulo: "El plato", texto: "Maite cocinaba cada domingo para ocho. Servía a todos, rellenaba los vasos, se levantaba a por el pan. Cuando por fin se sentaba, la fuente estaba vacía, y comía de pie lo que quedaba en la cazuela. Un domingo se sirvió la primera. Le temblaba un poco la mano, como si estuviera robando. Nadie se quedó sin comer. Nadie dijo nada. Ella comió sentada y caliente, por primera vez en años." },
      { id: "I7", titulo: "La escalera de caracol", texto: "Clara subía la escalera de caracol de un faro con su sobrino. A cada vuelta veían otra vez la misma ventana, el mismo puerto, la misma barca. El niño protestó: «estamos dando vueltas, no subimos». Clara se asomó. La barca era la misma, pero ahora se veía más pequeña, y detrás aparecía el pueblo entero. Pasaban por el mismo sitio, sí. Cada vez un poco más arriba." },
      { id: "I8", titulo: "El silencio", texto: "Cuando sus hijos se fueron de casa, Sonia no soportaba el silencio. Ponía la radio en cuanto entraba, la tele de fondo, cualquier ruido. Un domingo se fue la luz toda la tarde. Al principio se puso nerviosa, sin saber qué hacer con tanto silencio. Luego se hizo un café en el camping gas, se sentó junto a la ventana y oyó cosas que hacía años que no oía: el reloj de la cocina, a los vecinos de arriba riendo, su propia respiración. Aquel silencio, por un rato, fue suyo." },
      { id: "I9", titulo: "Las clases de baile", azar: false, texto: "A los cincuenta y dos años, Charo se apuntó a clases de baile. El primer día se equivocó tantas veces que acabó girando hacia el lado contrario de todo el grupo. El profesor le dijo que siguiera la música. «La música va por un lado y yo por otro», contestó. Las demás se rieron. A la tercera clase ya conocía a dos compañeras y habían quedado para tomar café después. Seguía confundiendo los pasos, pero había descubierto que se podía bailar bastante mal y pasarlo estupendamente. Se compró unas zapatillas rojas para el siguiente jueves." },
      { id: "I10", titulo: "La mesa junto a la ventana", azar: false, texto: "Celia llevaba meses pasando por delante de una cafetería pequeña. Siempre miraba la mesa de la ventana, donde daba el sol por la mañana. Un sábado entró y pidió un café con tostadas. Sacó un libro del bolso, pero apenas lo abrió. Se entretuvo mirando a la gente que pasaba, a un perro que no quería caminar y a una niña que saltaba todas las rayas de la acera. Cuando terminó el café, pidió otro. La camarera le preguntó si esperaba a alguien. «No», dijo Celia. Y volvió a mirar por la ventana." },
      { id: "I11", titulo: "La voz prestada", texto: "Cada vez que algo le salía regular, Mónica oía por dentro la misma frase: eso se puede hacer mejor. La oía al doblar la ropa, al mandar un correo, al hacer una tortilla que se le había quedado un poco cruda. Un día, ordenando un cajón, encontró un cuaderno de piano de cuando tenía nueve años. En el margen de una partitura, a lápiz, con la letra de su profesora, ponía esa frase. Se quedó un buen rato mirándola. Llevaba treinta años diciéndose algo que ni siquiera había empezado siendo suyo. No borró la frase. Pero debajo, con su letra de ahora, escribió otra." },
    ],
  },
};
