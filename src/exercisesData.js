// exercisesData.js
// Catálogo definitivo de ejercicios revisado y aprobado por Miquel.
// Cada fase tiene los vídeos verificados públicamente en YouTube mediante oEmbed.
// Fases 2, 3 y 4 en progresión in crescendo. Cero repeticiones en A, B y C de cada categoría.
// startTime = segundos de inicio del vídeo (cuando el vídeo empieza en un punto específico).

export const EXERCISE_CATEGORIES = ['pierna', 'empuje', 'tiron', 'potencia', 'movilidad'];

export const categoryLabels = {
  pierna:    'Piernas (Tren Inferior)',
  empuje:    'Empuje (Pecho, Hombros y Tríceps)',
  tiron:     'Tirón (Espalda y Cadena Posterior)',
  potencia:  'Potencia (Cardio y Metabólico)',
  movilidad: 'Movilidad (Elasticidad y Postura)'
};

export const categoryIcons = {
  pierna:    '🦵',
  empuje:    '💪',
  tiron:     '🛡️',
  potencia:  '🔥',
  movilidad: '🧘'
};

export const exercisesData = {

  // ─── PIERNAS ───────────────────────────────────────────────────────────────
  // 10 ejercicios únicos con vídeo: Sentadillas, Sentadilla Isométrica,
  // Sentadillas con Salto, Zancadas Laterales, Sentadilla en Pared,
  // Puente de Glúteos, Zancadas Atrás, Sentadillas Sumo, Elevación de Talones,
  // Zancadas Cruzadas (Split Jacks).
  pierna: [
    {
      routineName: 'Rutina A: Sentadilla en Progresión',
      phases: [
        { phase: 1, duration: 10, name: 'Chest Expansions',       desc: 'Abre y cierra los brazos horizontalmente para calentar hombros.',        muscles: 'Hombros, Escápulas',             youtubeId: 'El_Sj5hisSs' },
        { phase: 2, duration: 25, name: 'Sentadillas',             desc: 'Desciende la cadera a la paralela y sube empujando los talones.',        muscles: 'Cuádriceps, Glúteos',            youtubeId: 'PyUP10dh8CE' },
        { phase: 3, duration: 25, name: 'Sentadilla Isométrica',   desc: 'Baja a 90° libre y aguanta sin tocar ningún apoyo.',                    muscles: 'Cuádriceps, Core, Hombros',      youtubeId: 'OpiE9QGKfuo' },
        { phase: 4, duration: 25, name: 'Sentadillas con Salto',   desc: 'Sentadilla y despega verticalmente de forma explosiva.',                muscles: 'Cuádriceps, Glúteos, Cardio',    youtubeId: 'bv7as8mDXLQ' },
        { phase: 5, duration: 35, name: 'Respiración Profunda',    desc: 'Inhala lento y exhala soltando toda la tensión muscular.',              muscles: 'Recuperación',                   youtubeId: '' }
      ]
    },
    {
      routineName: 'Rutina B: Zancada y Estabilidad',
      phases: [
        { phase: 1, duration: 10, name: 'Rotaciones de Brazos',    desc: 'Círculos cortos con brazos estirados para calentar articulaciones.',   muscles: 'Hombros, Trapecio',              youtubeId: 'D40wm6vbI_0' },
        { phase: 2, duration: 25, name: 'Zancadas Laterales',      desc: 'Abre una pierna hacia el lado y baja el peso; alterna cada rep.',      muscles: 'Aductores, Glúteos, Cuádriceps', youtubeId: 'dTGZS-WCH4U' },
        { phase: 3, duration: 25, name: 'Sentadilla en Pared',     desc: 'Espalda plana en la pared, muslos a 90°, aguanta la posición.',        muscles: 'Cuádriceps, Isquiotibiales',     youtubeId: 'mDdLC-yKudY' },
        { phase: 4, duration: 25, name: 'Zancadas Cruzadas',       desc: 'Salta abriendo y cruzando pies en tijera de forma alternada.',        muscles: 'Cuádriceps, Glúteo Medio, Cardio',youtubeId: '83cVgok6KrI' },
        { phase: 5, duration: 35, name: 'Respiración Profunda',    desc: 'Respira pausadamente y relaja las piernas.',                           muscles: 'Recuperación',                   youtubeId: '' }
      ]
    },
    {
      routineName: 'Rutina C: Cadena Posterior',
      phases: [
        { phase: 1, duration: 10, name: 'Jumping Jacks Suaves',    desc: 'Saltos suaves abriendo brazos y piernas para activar el cuerpo.',      muscles: 'Full Body, Cardio',              youtubeId: 'gG2Z1siSvkk' },
        { phase: 2, duration: 25, name: 'Elevación de Talones',    desc: 'Sube lentamente sobre las puntas y baja controlando la bajada.',       muscles: 'Pantorrillas, Tobillos',         youtubeId: 'UV8gOrHmuKc' },
        { phase: 3, duration: 25, name: 'Puente de Glúteos',       desc: 'Tumbado boca arriba, eleva la cadera apretando glúteos arriba.',       muscles: 'Glúteos, Isquiotibiales, Core',  youtubeId: 'LORVjN2bg5o' },
        { phase: 4, duration: 25, name: 'Zancadas Atrás',          desc: 'Pasos alternos hacia atrás bajando la rodilla trasera a 90°.',         muscles: 'Glúteos, Cuádriceps, Isquios',   youtubeId: '-Q_2HR5OhEY' },
        { phase: 5, duration: 35, name: 'Respiración Profunda',    desc: 'Cierra los ojos y respira lentamente para recuperar el pulso basal.',  muscles: 'Recuperación',                   youtubeId: '' }
      ]
    },
    {
      routineName: 'Rutina D: Sumo y Potencia',
      phases: [
        { phase: 1, duration: 10, name: 'Chest Expansions',        desc: 'Aperturas horizontales de pecho para calentar.',                        muscles: 'Hombros, Escápulas',             youtubeId: 'El_Sj5hisSs' },
        { phase: 2, duration: 25, name: 'Sentadillas Sumo',        desc: 'Pies bien separados y puntas afuera, baja despacio.',                   muscles: 'Aductores, Glúteo Mayor',        youtubeId: 'rmEVorjxBWs' },
        { phase: 3, duration: 25, name: 'Sentadillas',             desc: 'Sentadillas clásicas a ritmo constante.',                               muscles: 'Cuádriceps, Glúteos',            youtubeId: 'PyUP10dh8CE' },
        { phase: 4, duration: 25, name: 'Sentadillas con Salto',   desc: 'Explosión vertical desde sentadilla.',                                  muscles: 'Cuádriceps, Potencia',           youtubeId: 'bv7as8mDXLQ' },
        { phase: 5, duration: 35, name: 'Respiración Profunda',    desc: 'Recupera el ritmo cardíaco respirando hondo.',                         muscles: 'Recuperación',                   youtubeId: '' }
      ]
    },
    {
      routineName: 'Rutina E: Resistencia Lateral',
      phases: [
        { phase: 1, duration: 10, name: 'Rotaciones de Brazos',    desc: 'Calentamiento de hombros y escapular.',                                muscles: 'Hombros, Trapecio',              youtubeId: 'D40wm6vbI_0' },
        { phase: 2, duration: 25, name: 'Sentadilla Isométrica',   desc: 'Mantén la sentadilla baja sin apoyo.',                                 muscles: 'Cuádriceps, Core',               youtubeId: 'OpiE9QGKfuo' },
        { phase: 3, duration: 25, name: 'Zancadas Laterales',      desc: 'Desplazamientos laterales alternos sintiendo el aductor.',              muscles: 'Aductores, Glúteos',             youtubeId: 'dTGZS-WCH4U' },
        { phase: 4, duration: 25, name: 'Zancadas Cruzadas',       desc: 'Tijeras de pies rápidas en el sitio.',                                 muscles: 'Cardio, Gemelos, Glúteos',       youtubeId: '83cVgok6KrI' },
        { phase: 5, duration: 35, name: 'Respiración Profunda',    desc: 'Inhala profundo y relaja las piernas.',                                muscles: 'Recuperación',                   youtubeId: '' }
      ]
    },
    {
      routineName: 'Rutina F: Isometría en Pared',
      phases: [
        { phase: 1, duration: 10, name: 'Jumping Jacks Suaves',    desc: 'Activación aeróbica suave previa.',                                    muscles: 'Cardio, Full Body',              youtubeId: 'gG2Z1siSvkk' },
        { phase: 2, duration: 25, name: 'Elevación de Talones',    desc: 'Trabaja la pantorrilla subiendo despacio y bajando controlado.',        muscles: 'Pantorrillas',                   youtubeId: 'UV8gOrHmuKc' },
        { phase: 3, duration: 25, name: 'Sentadilla en Pared',     desc: 'Apoya la espalda y sostén la posición isométrica.',                    muscles: 'Cuádriceps, Resistencia',        youtubeId: 'mDdLC-yKudY' },
        { phase: 4, duration: 25, name: 'Sentadillas Sumo',        desc: 'Sumo squats amplias a ritmo dinámico.',                                muscles: 'Aductores, Glúteos',             youtubeId: 'rmEVorjxBWs' },
        { phase: 5, duration: 35, name: 'Respiración Profunda',    desc: 'Pausa consciente y respira diafragmáticamente.',                       muscles: 'Recuperación',                   youtubeId: '' }
      ]
    },
    {
      routineName: 'Rutina G: Glúteos y Salto',
      phases: [
        { phase: 1, duration: 10, name: 'Chest Expansions',        desc: 'Aperturas de pecho y escapular.',                                      muscles: 'Hombros, Escápulas',             youtubeId: 'El_Sj5hisSs' },
        { phase: 2, duration: 25, name: 'Puente de Glúteos',       desc: 'Eleva la pelvis lentamente apretando glúteos en el punto alto.',        muscles: 'Glúteos, Isquiotibiales',        youtubeId: 'LORVjN2bg5o' },
        { phase: 3, duration: 25, name: 'Zancadas Atrás',          desc: 'Zancadas alternadas atrás manteniendo el tronco erguido.',             muscles: 'Glúteos, Cuádriceps',            youtubeId: '-Q_2HR5OhEY' },
        { phase: 4, duration: 25, name: 'Sentadillas con Salto',   desc: 'Saltos reactivos desde la sentadilla para activar pulsaciones.',       muscles: 'Cuádriceps, Potencia',           youtubeId: 'bv7as8mDXLQ' },
        { phase: 5, duration: 35, name: 'Respiración Profunda',    desc: 'Disminuye la frecuencia cardíaca inspirando hondo.',                   muscles: 'Recuperación',                   youtubeId: '' }
      ]
    },
    {
      routineName: 'Rutina H: Resistencia Muscular',
      phases: [
        { phase: 1, duration: 10, name: 'Rotaciones de Brazos',    desc: 'Prepara el tren superior con círculos de brazos.',                     muscles: 'Hombros',                        youtubeId: 'D40wm6vbI_0' },
        { phase: 2, duration: 25, name: 'Sentadillas Sumo',        desc: 'Amplitud de piernas para sentadilla sumo.',                           muscles: 'Aductores, Glúteos',             youtubeId: 'rmEVorjxBWs' },
        { phase: 3, duration: 25, name: 'Zancadas Laterales',      desc: 'Lateral lunges alternos con buen rango de movimiento.',               muscles: 'Aductores, Cuádriceps',          youtubeId: 'dTGZS-WCH4U' },
        { phase: 4, duration: 25, name: 'Zancadas Cruzadas',       desc: 'Tijeras explosivas de pies a buen ritmo.',                           muscles: 'Cardio, Glúteos',                youtubeId: '83cVgok6KrI' },
        { phase: 5, duration: 35, name: 'Respiración Profunda',    desc: 'Recupera el pulso con respiraciones profundas.',                      muscles: 'Recuperación',                   youtubeId: '' }
      ]
    },
    {
      routineName: 'Rutina I: Isometría Avanzada',
      phases: [
        { phase: 1, duration: 10, name: 'Jumping Jacks Suaves',    desc: 'Abre y cierra piernas suavemente como calentamiento.',               muscles: 'Full Body, Cardio',              youtubeId: 'gG2Z1siSvkk' },
        { phase: 2, duration: 25, name: 'Elevación de Talones',    desc: 'Aísla el gemelo subiendo y bajando controladamente.',                 muscles: 'Pantorrillas',                   youtubeId: 'UV8gOrHmuKc' },
        { phase: 3, duration: 25, name: 'Sentadilla Isométrica',   desc: 'Baja y sostén la sentadilla libre sin apoyo.',                        muscles: 'Cuádriceps, Core',               youtubeId: 'OpiE9QGKfuo' },
        { phase: 4, duration: 25, name: 'Sentadillas',             desc: 'Sentadillas clásicas a buen ritmo para terminar fuerte.',             muscles: 'Cuádriceps, Glúteos',            youtubeId: 'PyUP10dh8CE' },
        { phase: 5, duration: 35, name: 'Respiración Profunda',    desc: 'Respira lento y deja que el cuerpo se recupere.',                     muscles: 'Recuperación',                   youtubeId: '' }
      ]
    },
    {
      routineName: 'Rutina J: Completo de Pierna',
      phases: [
        { phase: 1, duration: 10, name: 'Chest Expansions',        desc: 'Calentamiento de hombros y pecho.',                                   muscles: 'Hombros, Pecho',                 youtubeId: 'El_Sj5hisSs' },
        { phase: 2, duration: 25, name: 'Puente de Glúteos',       desc: 'Activa la cadena posterior antes de los ejercicios de pie.',          muscles: 'Glúteos, Core',                  youtubeId: 'LORVjN2bg5o' },
        { phase: 3, duration: 25, name: 'Zancadas Atrás',          desc: 'Trabaja el glúteo y el cuádriceps con pasos atrás alternos.',         muscles: 'Glúteos, Cuádriceps',            youtubeId: '-Q_2HR5OhEY' },
        { phase: 4, duration: 25, name: 'Sentadillas con Salto',   desc: 'Termina con saltos explosivos para disparar pulsaciones.',            muscles: 'Cuádriceps, Potencia',           youtubeId: 'bv7as8mDXLQ' },
        { phase: 5, duration: 35, name: 'Respiración Profunda',    desc: 'Baja el ritmo cardíaco con respiraciones lentas y profundas.',        muscles: 'Recuperación',                   youtubeId: '' }
      ]
    }
  ],

  // ─── EMPUJE ────────────────────────────────────────────────────────────────
  // 10 ejercicios únicos: Knee Push-Ups, Push-Ups, Diamond Push-Ups,
  // Pike Push-Ups, Shoulder Taps, Commandos, Plank Leg Raises,
  // Chair Dips, Burpees, Elbow Plank Leg Raises.
  empuje: [
    {
      routineName: 'Rutina A: Flexión Clásica',
      phases: [
        { phase: 1, duration: 10, name: 'Chest Expansions',        desc: 'Aperturas horizontales para calentar pecho y hombros.',               muscles: 'Hombros, Escápulas',             youtubeId: 'El_Sj5hisSs' },
        { phase: 2, duration: 25, name: 'Flexiones de Rodilla',    desc: 'Flexiones con rodillas en el suelo, enfocando la contracción del pecho.',muscles: 'Pectorales, Tríceps',           youtubeId: 'rrVwNeIpy-k' },
        { phase: 3, duration: 25, name: 'Flexiones en Suelo',      desc: 'Flexiones completas manteniendo el cuerpo en tabla recta.',            muscles: 'Pectoral Mayor, Deltoides, Tríceps',youtubeId: 'v9LABVJzv8A' },
        { phase: 4, duration: 25, name: 'Flexiones Diamante',      desc: 'Manos juntas formando un rombo bajo el pecho para aislar tríceps.',    muscles: 'Tríceps, Pectoral, Core',        youtubeId: '1Y8pTxdwf3M' },
        { phase: 5, duration: 35, name: 'Respiración Profunda',    desc: 'Relaja los hombros y respira hondo recuperando el ritmo cardíaco.',    muscles: 'Recuperación',                   youtubeId: '' }
      ]
    },
    {
      routineName: 'Rutina B: Fuerza de Hombros',
      phases: [
        { phase: 1, duration: 10, name: 'Rotaciones de Brazos',    desc: 'Moviliza la articulación del hombro con círculos cortos.',             muscles: 'Hombros, Trapecio',              youtubeId: 'D40wm6vbI_0' },
        { phase: 2, duration: 25, name: 'Toques de Hombro',        desc: 'En plancha alta, toca tu hombro contrario sin rotar la cadera.',       muscles: 'Deltoides, Core, Tríceps',       youtubeId: 'gWHQpMUd7vw' },
        { phase: 3, duration: 25, name: 'Flexiones de Pica',       desc: 'Cadera alta en V invertida, baja la coronilla hacia las manos.',       muscles: 'Deltoides, Trapecio, Tríceps',   youtubeId: '782MhTFvIBQ' },
        { phase: 4, duration: 25, name: 'Commandos',               desc: 'Pasa de antebrazos a plancha alta y vuelve, alternando el brazo guía.',muscles: 'Tríceps, Deltoides, Core',       youtubeId: 'yDfw9De-sNI' },
        { phase: 5, duration: 35, name: 'Respiración Profunda',    desc: 'Relaja los hombros y baja la frecuencia cardíaca.',                   muscles: 'Recuperación',                   youtubeId: '' }
      ]
    },
    {
      routineName: 'Rutina C: Tríceps y Core',
      phases: [
        { phase: 1, duration: 10, name: 'Jumping Jacks Suaves',    desc: 'Activación aeróbica ligera como aproximación.',                        muscles: 'Full Body, Cardio',              youtubeId: 'gG2Z1siSvkk' },
        { phase: 2, duration: 25, name: 'Fondos de Tríceps',       desc: 'Manos en silla o escritorio, baja flexionando los codos.',             muscles: 'Tríceps, Deltoides Anterior',    youtubeId: '1mRpK_-d_H4' },
        { phase: 3, duration: 25, name: 'Elevación de Piernas en Plancha', desc: 'En plancha alta, eleva piernas de forma alterna sin rotar.', muscles: 'Glúteos, Core, Deltoides',       youtubeId: 'IexgiQZetb8' },
        { phase: 4, duration: 25, name: 'Burpees',                 desc: 'Flexión al suelo y salto vertical explosivo sin parar.',              muscles: 'Full Body, Cardio, Pecho',       youtubeId: 'E-Oc0zjeqWo' },
        { phase: 5, duration: 35, name: 'Respiración Profunda',    desc: 'Exhala todo el aire lentamente y recupera la calma.',                 muscles: 'Recuperación',                   youtubeId: '' }
      ]
    },
    {
      routineName: 'Rutina D: Fondos y Planchas',
      phases: [
        { phase: 1, duration: 10, name: 'Chest Expansions',        desc: 'Calentamiento escapular para preparar el tren superior.',             muscles: 'Hombros, Pecho',                 youtubeId: 'El_Sj5hisSs' },
        { phase: 2, duration: 25, name: 'Plancha en Codo con Elevación', desc: 'Plancha de codos elevando piernas alternamente.',               muscles: 'Core, Glúteos, Hombros',         youtubeId: 'Akf3IP0H9fA' },
        { phase: 3, duration: 25, name: 'Fondos de Tríceps',       desc: 'Trabaja el tríceps bajando en silla o escritorio.',                   muscles: 'Tríceps, Hombros',               youtubeId: '1mRpK_-d_H4' },
        { phase: 4, duration: 25, name: 'Flexiones Diamante',      desc: 'Flexiones cerradas para explosionar el tríceps.',                     muscles: 'Tríceps, Pecho',                 youtubeId: '1Y8pTxdwf3M' },
        { phase: 5, duration: 35, name: 'Respiración Profunda',    desc: 'Recuperación activa respirando hondo.',                               muscles: 'Recuperación',                   youtubeId: '' }
      ]
    },
    {
      routineName: 'Rutina E: Dinamismo de Core',
      phases: [
        { phase: 1, duration: 10, name: 'Rotaciones de Brazos',    desc: 'Activa los hombros con rotaciones lentas.',                           muscles: 'Hombros',                        youtubeId: 'D40wm6vbI_0' },
        { phase: 2, duration: 25, name: 'Flexiones de Rodilla',    desc: 'Flexiones con rodillas en el suelo a ritmo fluido.',                  muscles: 'Pectorales, Tríceps',            youtubeId: 'rrVwNeIpy-k' },
        { phase: 3, duration: 25, name: 'Toques de Hombro',        desc: 'Estabilidad de core tocando hombros alternamente en plancha alta.',   muscles: 'Core, Deltoides',                youtubeId: 'gWHQpMUd7vw' },
        { phase: 4, duration: 25, name: 'Commandos',               desc: 'Baja y sube de antebrazos a plancha a buen ritmo.',                   muscles: 'Core, Hombros, Tríceps',         youtubeId: 'yDfw9De-sNI' },
        { phase: 5, duration: 35, name: 'Respiración Profunda',    desc: 'Respira con el diafragma para reducir las pulsaciones.',              muscles: 'Recuperación',                   youtubeId: '' }
      ]
    },
    {
      routineName: 'Rutina F: Potencia de Empuje',
      phases: [
        { phase: 1, duration: 10, name: 'Jumping Jacks Suaves',    desc: 'Activación cardiovascular general.',                                  muscles: 'Cardio, Hombros',                youtubeId: 'gG2Z1siSvkk' },
        { phase: 2, duration: 25, name: 'Flexiones de Pica',       desc: 'V invertida bajando coronilla hacia el suelo.',                       muscles: 'Deltoides, Hombros',             youtubeId: '782MhTFvIBQ' },
        { phase: 3, duration: 25, name: 'Flexiones en Suelo',      desc: 'Push-ups estándar a ritmo constante.',                                muscles: 'Pectorales, Tríceps',            youtubeId: 'v9LABVJzv8A' },
        { phase: 4, duration: 25, name: 'Burpees',                 desc: 'Flexión al suelo + salto vertical a máxima intensidad.',              muscles: 'Full Body, Cardio',              youtubeId: 'E-Oc0zjeqWo' },
        { phase: 5, duration: 35, name: 'Respiración Profunda',    desc: 'Disminuye la frecuencia cardíaca gradualmente.',                      muscles: 'Recuperación',                   youtubeId: '' }
      ]
    },
    {
      routineName: 'Rutina G: Estabilidad Postural',
      phases: [
        { phase: 1, duration: 10, name: 'Chest Expansions',        desc: 'Abre el pecho y escápulas para calentar.',                           muscles: 'Hombros, Escápulas',             youtubeId: 'El_Sj5hisSs' },
        { phase: 2, duration: 25, name: 'Plancha en Codo con Elevación', desc: 'Isometría de core con elevación alterna de piernas.',           muscles: 'Core, Glúteos, Hombros',         youtubeId: 'Akf3IP0H9fA' },
        { phase: 3, duration: 25, name: 'Flexiones de Rodilla',    desc: 'Flexiones con rodillas para bombear el pecho.',                       muscles: 'Pectorales, Tríceps',            youtubeId: 'rrVwNeIpy-k' },
        { phase: 4, duration: 25, name: 'Flexiones en Suelo',      desc: 'Flexiones completas terminando la sesión fuerte.',                    muscles: 'Pectoral Mayor, Tríceps',        youtubeId: 'v9LABVJzv8A' },
        { phase: 5, duration: 35, name: 'Respiración Profunda',    desc: 'Relajación activa post-esfuerzo.',                                    muscles: 'Recuperación',                   youtubeId: '' }
      ]
    },
    {
      routineName: 'Rutina H: Hombros y Tríceps',
      phases: [
        { phase: 1, duration: 10, name: 'Rotaciones de Brazos',    desc: 'Círculos de brazos para preparar la articulación del hombro.',        muscles: 'Hombros',                        youtubeId: 'D40wm6vbI_0' },
        { phase: 2, duration: 25, name: 'Toques de Hombro',        desc: 'Core activo tocando hombros alternamente en plancha alta.',           muscles: 'Core, Deltoides',                youtubeId: 'gWHQpMUd7vw' },
        { phase: 3, duration: 25, name: 'Fondos de Tríceps',       desc: 'Fondos en silla focalizando en el tríceps.',                          muscles: 'Tríceps, Hombros',               youtubeId: '1mRpK_-d_H4' },
        { phase: 4, duration: 25, name: 'Flexiones Diamante',      desc: 'Cierra las manos en rombo para máxima activación del tríceps.',       muscles: 'Tríceps, Pecho',                 youtubeId: '1Y8pTxdwf3M' },
        { phase: 5, duration: 35, name: 'Respiración Profunda',    desc: 'Inhala profundo y baja la temperatura corporal.',                     muscles: 'Recuperación',                   youtubeId: '' }
      ]
    },
    {
      routineName: 'Rutina I: Coordinación de Brazos',
      phases: [
        { phase: 1, duration: 10, name: 'Jumping Jacks Suaves',    desc: 'Calentamiento cardiovascular general.',                               muscles: 'Cardio, Full Body',              youtubeId: 'gG2Z1siSvkk' },
        { phase: 2, duration: 25, name: 'Commandos',               desc: 'Sube y baja de plancha alta a plancha de codos de forma rítmica.',    muscles: 'Core, Tríceps, Hombros',         youtubeId: 'yDfw9De-sNI' },
        { phase: 3, duration: 25, name: 'Flexiones de Pica',       desc: 'V invertida descendiendo la cabeza hacia el suelo.',                  muscles: 'Deltoides, Hombros',             youtubeId: '782MhTFvIBQ' },
        { phase: 4, duration: 25, name: 'Burpees',                 desc: 'Burpee rápido e intenso para terminar la sesión.',                    muscles: 'Full Body, Pecho, Cardio',       youtubeId: 'E-Oc0zjeqWo' },
        { phase: 5, duration: 35, name: 'Respiración Profunda',    desc: 'Respira lento para ralentizar las pulsaciones.',                      muscles: 'Recuperación',                   youtubeId: '' }
      ]
    },
    {
      routineName: 'Rutina J: Resistencia de Brazos',
      phases: [
        { phase: 1, duration: 10, name: 'Chest Expansions',        desc: 'Movilidad de pecho y escápulas como calentamiento.',                  muscles: 'Hombros, Pecho',                 youtubeId: 'El_Sj5hisSs' },
        { phase: 2, duration: 25, name: 'Plancha en Codo con Elevación', desc: 'Sostén la plancha de codos elevando piernas de forma alterna.',  muscles: 'Core, Glúteos',                  youtubeId: 'Akf3IP0H9fA' },
        { phase: 3, duration: 25, name: 'Elevación de Piernas en Plancha', desc: 'En plancha alta, eleva piernas alternamente sin rotar.',       muscles: 'Glúteos, Core, Hombros',         youtubeId: 'IexgiQZetb8' },
        { phase: 4, duration: 25, name: 'Flexiones en Suelo',      desc: 'Flexiones completas en el suelo para terminar.',                      muscles: 'Pectorales, Tríceps',            youtubeId: 'v9LABVJzv8A' },
        { phase: 5, duration: 35, name: 'Respiración Profunda',    desc: 'Inhala por la nariz y exhala soltando toda la tensión.',              muscles: 'Recuperación',                   youtubeId: '' }
      ]
    }
  ],

  // ─── TIRÓN ─────────────────────────────────────────────────────────────────
  // 9 ejercicios únicos en A-B-C sin ninguna repetición entre rutinas.
  // Rutina A: Isometría Posterior | Rutina B: Bisagra y Tracción | Rutina C: Tracción Dinámica
  tiron: [
    {
      routineName: 'Rutina A: Isometría Posterior',
      phases: [
        { phase: 1, duration: 10, name: 'Chest Expansions',        desc: 'Abre los brazos hacia atrás juntando escápulas para calentar.',       muscles: 'Hombros, Espalda Alta',          youtubeId: 'El_Sj5hisSs' },
        { phase: 2, duration: 25, name: 'Cobra en Prono',          desc: 'Boca abajo, eleva el torso contrayendo la espalda baja.',              muscles: 'Lumbar, Glúteos, Espalda Alta',  youtubeId: '2Z7uGBbsvf8', startTime: 187 },
        { phase: 3, duration: 25, name: 'Superman Alternado',      desc: 'Boca abajo, eleva el brazo y pierna contrarios de forma alterna.',     muscles: 'Lumbar, Glúteos, Espalda Alta',  youtubeId: 'DFk3yGZv62U' },
        { phase: 4, duration: 25, name: 'W Raise en Prono',        desc: 'Boca abajo, brazos en W, eleva y aprieta las escápulas fuerte.',       muscles: 'Trapecio Medio, Romboides',      youtubeId: 'q-qFjjKl1Ko' },
        { phase: 5, duration: 35, name: 'Respiración Profunda',    desc: 'Inhala expandiendo el pecho y exhala liberando la tensión.',           muscles: 'Recuperación',                   youtubeId: '' }
      ]
    },
    {
      routineName: 'Rutina B: Bisagra y Tracción',
      phases: [
        { phase: 1, duration: 10, name: 'Rotaciones de Brazos',    desc: 'Círculos de brazos para calentar hombros y espalda alta.',             muscles: 'Hombros, Trapecio',              youtubeId: 'D40wm6vbI_0' },
        { phase: 2, duration: 25, name: 'Buenos Días',             desc: 'De pie, bisagra de cadera inclinando el torso hacia adelante.',        muscles: 'Isquiotibiales, Lumbar, Glúteos',youtubeId: 'DPcz2up4Yxc' },
        { phase: 3, duration: 25, name: 'Peso Muerto Unilateral',  desc: 'Bisagra sobre un pie estirando la pierna libre hacia atrás.',          muscles: 'Glúteos, Isquiotibiales, Core',  youtubeId: 'X28U6NKcaWc' },
        { phase: 4, duration: 25, name: 'Plancha Invertida',       desc: 'Siéntate, apoya manos detrás y eleva la cadera formando una tabla.',   muscles: 'Glúteos, Isquios, Espalda',      youtubeId: 'T_OPGz218B4' },
        { phase: 5, duration: 35, name: 'Respiración Profunda',    desc: 'Relaja la espalda y respira profundo para recuperar el pulso basal.',  muscles: 'Recuperación',                   youtubeId: '' }
      ]
    },
    {
      routineName: 'Rutina C: Tracción Dinámica',
      phases: [
        { phase: 1, duration: 10, name: 'Jumping Jacks Suaves',    desc: 'Activación aeróbica general para entrar en calor.',                   muscles: 'Full Body, Cardio',              youtubeId: 'gG2Z1siSvkk' },
        { phase: 2, duration: 25, name: 'Ángeles de Pared',        desc: 'Espalda en la pared, sube y baja los brazos manteniendo contacto.',    muscles: 'Deltoides, Trapecio, Romboides', youtubeId: '479HYhGmNfI', startTime: 34 },
        { phase: 3, duration: 25, name: 'Remo en Marco de Puerta', desc: 'Sujétate del marco y tira del cuerpo activando el dorsal.',            muscles: 'Dorsales, Bíceps, Escápulas',    youtubeId: 'eCojBl6k_HE' },
        { phase: 4, duration: 25, name: 'Donkey Kicks',            desc: 'En cuadrupedia, da patadas atrás y arriba apretando el glúteo.',       muscles: 'Glúteos, Lumbar, Core',          youtubeId: 'QGiiuBOQn3Y' },
        { phase: 5, duration: 35, name: 'Respiración Profunda',    desc: 'Respira hondo soltando la tensión de hombros y espalda.',              muscles: 'Recuperación',                   youtubeId: '' }
      ]
    }
  ],

  // ─── POTENCIA ──────────────────────────────────────────────────────────────
  // 9 ejercicios únicos en A-B-C sin ninguna repetición entre rutinas.
  // Rutina A: Crescendo Aeróbico | Rutina B: Core Cardio | Rutina C: Explosivo Pliométrico
  potencia: [
    {
      routineName: 'Rutina A: Crescendo Aeróbico',
      phases: [
        { phase: 1, duration: 10, name: 'Chest Expansions',        desc: 'Aperturas de pecho para calentar el tren superior.',                  muscles: 'Hombros, Escápulas',             youtubeId: 'El_Sj5hisSs' },
        { phase: 2, duration: 25, name: 'Butt Kicks',              desc: 'Lleva los talones hacia los glúteos corriendo o trotando en el sitio.',muscles: 'Cardio, Isquiotibiales',         youtubeId: 'lVZi-AwxLPo' },
        { phase: 3, duration: 25, name: 'Rodillas Arriba',         desc: 'Alterna levantando rodillas al pecho a máxima velocidad.',            muscles: 'Cardio, Flexores de Cadera',     youtubeId: 'DfjpR6dzLVg' },
        { phase: 4, duration: 25, name: 'Burpees',                 desc: 'Baja al suelo haciendo flexión y salta vertical al subir.',           muscles: 'Full Body, Cardio, Core',        youtubeId: 'E-Oc0zjeqWo' },
        { phase: 5, duration: 35, name: 'Respiración Profunda',    desc: 'Exhala largo para bajar las pulsaciones después del pico.',           muscles: 'Recuperación',                   youtubeId: '' }
      ]
    },
    {
      routineName: 'Rutina B: Core Cardio',
      phases: [
        { phase: 1, duration: 10, name: 'Rotaciones de Brazos',    desc: 'Círculos de brazos como activación antes del core.',                  muscles: 'Hombros, Trapecio',              youtubeId: 'D40wm6vbI_0' },
        { phase: 2, duration: 25, name: 'Plank Jacks',             desc: 'En plancha alta, salta abriendo y cerrando piernas como tijeras.',    muscles: 'Core, Hombros, Cardio',          youtubeId: '3VpkyIcnT64' },
        { phase: 3, duration: 25, name: 'Escaladores',             desc: 'En plancha alta, lleva rodillas al pecho de forma alternada y rápida.',muscles: 'Core, Hombros, Flexores Cadera', youtubeId: 'w2iTOneGPdU' },
        { phase: 4, duration: 25, name: 'Saltos de Patinador',     desc: 'Salta de lado a lado aterrizando sobre un pie como un patinador.',    muscles: 'Piernas, Glúteos, Cardio',       youtubeId: 'JQUqVHxbYEw' },
        { phase: 5, duration: 35, name: 'Respiración Profunda',    desc: 'Inhala 4 segundos y exhala 6 para calmar el sistema nervioso.',       muscles: 'Recuperación',                   youtubeId: '' }
      ]
    },
    {
      routineName: 'Rutina C: Explosivo Pliométrico',
      phases: [
        { phase: 1, duration: 10, name: 'Half Jacks',              desc: 'Versión suave de jumping jacks para entrar en calor gradualmente.',   muscles: 'Full Body, Cardio',              youtubeId: 'F16nHvGbsiw' },
        { phase: 2, duration: 25, name: 'Jumping Jacks',           desc: 'Salta abriendo y cerrando piernas y brazos a ritmo sostenido.',       muscles: 'Full Body, Cardio',              youtubeId: 'gG2Z1siSvkk' },
        { phase: 3, duration: 25, name: 'Sentadillas con Salto',   desc: 'Sentadilla y despegue vertical explosivo.',                           muscles: 'Cuádriceps, Glúteos, Potencia',  youtubeId: 'bv7as8mDXLQ' },
        { phase: 4, duration: 25, name: 'Zancadas Cruzadas',       desc: 'Tijeras de pies saltando con máxima amplitud y velocidad.',           muscles: 'Piernas, Glúteos, Cardio',       youtubeId: '83cVgok6KrI' },
        { phase: 5, duration: 35, name: 'Respiración Profunda',    desc: 'Respira lento y profundo para recuperar el pulso basal.',             muscles: 'Recuperación',                   youtubeId: '' }
      ]
    }
  ],

  // ─── MOVILIDAD ─────────────────────────────────────────────────────────────
  // 9 ejercicios únicos en A-B-C sin ninguna repetición entre rutinas.
  // Rutina A: Postura y Apertura | Rutina B: Cadera y Cadena Posterior | Rutina C: Relajación Profunda
  movilidad: [
    {
      routineName: 'Rutina A: Postura y Apertura',
      phases: [
        { phase: 1, duration: 10, name: 'Rotaciones de Brazos',    desc: 'Círculos de brazos lentos y amplios para movilizar el hombro.',        muscles: 'Hombros, Trapecio',              youtubeId: 'D40wm6vbI_0' },
        { phase: 2, duration: 25, name: 'Chest Expansions',        desc: 'Abre los brazos hacia atrás juntando escápulas y suelta lentamente.', muscles: 'Pectorales, Deltoides, Omóplatos',youtubeId: 'El_Sj5hisSs' },
        { phase: 3, duration: 25, name: 'Inclinaciones Laterales', desc: 'Inclina el tronco de lado a lado estirando los flancos despacio.',     muscles: 'Oblicuos, Cuadrado Lumbar',      youtubeId: 'uWLFCRHU0Og' },
        { phase: 4, duration: 25, name: 'Giro de Torso',           desc: 'De pie, rota el tronco de lado a lado con los brazos libres.',        muscles: 'Oblicuos, Columna, Cadera',      youtubeId: 'f4Qah0bQTIo' },
        { phase: 5, duration: 35, name: 'Respiración Profunda',    desc: 'Cierra los ojos y respira expandiendo el abdomen lentamente.',        muscles: 'Recuperación',                   youtubeId: '' }
      ]
    },
    {
      routineName: 'Rutina B: Cadera y Cadena Posterior',
      phases: [
        { phase: 1, duration: 10, name: 'Rotaciones de Cuello',    desc: 'Gira el cuello lentamente de lado a lado para liberar la tensión cervical.',muscles: 'Cervicales, Trapecio',        youtubeId: 'JpaYwJLzElM' },
        { phase: 2, duration: 25, name: 'Círculos de Cadera',      desc: 'De pie, dibuja círculos amplios con la cadera en ambas direcciones.',  muscles: 'Cadera, Lumbar, Iliopsoas',      youtubeId: 'yFi1FDOFXq0', startTime: 20 },
        { phase: 3, duration: 25, name: 'Balanceo de Piernas',     desc: 'Apoya la mano en la pared y balancea cada pierna adelante y atrás.',   muscles: 'Cadera, Flexores, Isquiotibiales',youtubeId: 'difYoBtZi2s' },
        { phase: 4, duration: 25, name: 'Superman Alternado',      desc: 'Boca abajo, eleva lentamente el brazo y pierna contrarios.',           muscles: 'Lumbar, Glúteos, Espalda Alta',  youtubeId: 'DFk3yGZv62U' },
        { phase: 5, duration: 35, name: 'Respiración Profunda',    desc: 'Inhala largo y exhala soltando la tensión de cadera y espalda.',       muscles: 'Recuperación',                   youtubeId: '' }
      ]
    },
    {
      routineName: 'Rutina C: Relajación Profunda',
      phases: [
        { phase: 1, duration: 10, name: 'Elevación de Talones',    desc: 'Sube y baja lentamente sobre las puntas activando las pantorrillas.', muscles: 'Pantorrillas, Tobillos',         youtubeId: 'UV8gOrHmuKc' },
        { phase: 2, duration: 25, name: 'Elevación Lateral de Pierna', desc: 'Tumbado de lado, eleva y baja la pierna de forma controlada.',    muscles: 'Glúteo Medio, Abductores',       youtubeId: 'H8RrfDOLiZU' },
        { phase: 3, duration: 25, name: 'Ángeles de Pared',        desc: 'Espalda pegada a la pared, sube los brazos sin despegar los codos.',  muscles: 'Deltoides, Trapecio, Romboides', youtubeId: '479HYhGmNfI', startTime: 34 },
        { phase: 4, duration: 25, name: 'Postura del Niño',        desc: 'Arrodíllate y estira los brazos al frente descansando el torso.',     muscles: 'Lumbar, Cadera, Hombros',        youtubeId: 'eqVMAPM00DM', startTime: 185 },
        { phase: 5, duration: 35, name: 'Respiración Profunda',    desc: 'Mantén la postura del niño respirando hondo para relajar la espalda.',muscles: 'Recuperación',                   youtubeId: '' }
      ]
    }
  ]
};
