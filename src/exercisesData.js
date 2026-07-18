// exercisesData.js
// Catálogo de ejercicios estructurado con tiempos ajustados: 10s calentamiento, 25s por ejercicio y 35s de respiración pausada (Total 120 segundos / 2 minutos).
// Cada una de las categorías dispone de rutinas estructuradas e independientes con ejercicios únicos.

export const EXERCISE_CATEGORIES = ['pierna', 'empuje', 'tiron', 'potencia', 'movilidad'];

export const categoryLabels = {
  pierna: 'Piernas (Tren Inferior)',
  empuje: 'Empuje (Pecho, Hombros y Tríceps)',
  tiron: 'Tirón (Espalda y Cadena Posterior)',
  potencia: 'Potencia (Cardio y Metabólico)',
  movilidad: 'Movilidad (Movilidad y Elasticidad)'
};

export const categoryIcons = {
  pierna: '🦵',
  empuje: '💪',
  tiron: '🛡️',
  potencia: '🔥',
  movilidad: '🧘'
};

export const exercisesData = {
  pierna: [
    {
      "routineName": "Rutina A: Fuerza y Empuje de Piernas",
      "phases": [
            {
                  "phase": 1,
                  "duration": 10,
                  "name": "Movilidad de Cadera (Hip Rotations)",
                  "desc": "Círculos amplios con la cadera para calentar las articulaciones del tren inferior.",
                  "muscles": "Caderas, Lumbar",
                  "youtubeId": "yX3HnK_pA78"
            },
            {
                  "phase": 2,
                  "duration": 25,
                  "name": "Sentadillas (Squats)",
                  "desc": "Baja la cadera empujando los glúteos atrás. Pies al ancho de hombros.",
                  "muscles": "Cuádriceps, Glúteos",
                  "youtubeId": "PyUP10dh8CE"
            },
            {
                  "phase": 3,
                  "duration": 25,
                  "name": "Zancadas Atrás (Lunges)",
                  "desc": "Pasos alternos atrás flexionando la rodilla trasera a 90 grados.",
                  "muscles": "Glúteos, Cuádriceps, Isquiotibiales",
                  "youtubeId": "-Q_2HR5OhEY"
            },
            {
                  "phase": 4,
                  "duration": 25,
                  "name": "Sentadillas con Salto (Jump Squats)",
                  "desc": "Sentadilla dinámica terminando en un salto vertical explosivo.",
                  "muscles": "Cuádriceps, Glúteos, Pantorrillas",
                  "youtubeId": "bv7as8mDXLQ"
            },
            {
                  "phase": 5,
                  "duration": 35,
                  "name": "Respiración Profunda (Cooldown)",
                  "desc": "Siéntate o quédate de pie. Inhala lento por la nariz expandiendo el abdomen y exhala suavemente.",
                  "muscles": "Recuperación, Calma",
                  "youtubeId": ""
            }
      ]
},
    {
      "routineName": "Rutina B: Isometría y Resistencia de Piernas",
      "phases": [
            {
                  "phase": 1,
                  "duration": 10,
                  "name": "Elevación de Rodillas (High Knees)",
                  "desc": "Lleva las rodillas alternamente al pecho a ritmo suave para calentar.",
                  "muscles": "Cardio, Flexores de Cadera",
                  "youtubeId": "DfjpR6dzLVg"
            },
            {
                  "phase": 2,
                  "duration": 25,
                  "name": "Zancadas Laterales (Side Lunges)",
                  "desc": "Da un paso amplio lateral flexionando una rodilla y manteniendo la otra estirada.",
                  "muscles": "Aductores, Glúteos, Cuádriceps",
                  "youtubeId": "KXoVm0WXcfE"
            },
            {
                  "phase": 3,
                  "duration": 25,
                  "name": "Elevación de Talones (Calf Raises)",
                  "desc": "Eleva los talones controladamente apretando las pantorrillas arriba.",
                  "muscles": "Pantorrillas, Tobillos",
                  "youtubeId": "UV8gOrHmuKc"
            },
            {
                  "phase": 4,
                  "duration": 25,
                  "name": "Sentadilla en Pared (Wall Sit)",
                  "desc": "Apoya la espalda firmemente en la pared y mantén los muslos paralelos al suelo formando 90º.",
                  "muscles": "Cuádriceps, Isquiotibiales, Estabilidad",
                  "youtubeId": "mDdLC-yKudY"
            },
            {
                  "phase": 5,
                  "duration": 35,
                  "name": "Respiración Profunda (Cooldown)",
                  "desc": "Inhala profundamente llenando los pulmones y exhala despacio liberando toda la tensión.",
                  "muscles": "Recuperación, Calma",
                  "youtubeId": ""
            }
      ]
},
    {
      "routineName": "Rutina C: Cardio Tono Inferior",
      "phases": [
            {
                  "phase": 1,
                  "duration": 10,
                  "name": "Jumping Jacks Suaves",
                  "desc": "Salta abriendo brazos y piernas a ritmo suave para calentar.",
                  "muscles": "Full Body, Cardio",
                  "youtubeId": "gG2Z1siSvkk"
            },
            {
                  "phase": 2,
                  "duration": 25,
                  "name": "Sentadillas Isométricas (Squat Hold)",
                  "desc": "Baja a posición de sentadilla profunda y mantén la posición de forma estática.",
                  "muscles": "Cuádriceps, Core, Hombros",
                  "youtubeId": "OpiE9QGKfuo"
            },
            {
                  "phase": 3,
                  "duration": 25,
                  "name": "Puente de Glúteos (Glute Bridges)",
                  "desc": "Túmbate boca arriba con rodillas dobladas y eleva la cadera contrayendo glúteos.",
                  "muscles": "Glúteos, Isquiotibiales, Core",
                  "youtubeId": "LORVjN2bg5o"
            },
            {
                  "phase": 4,
                  "duration": 25,
                  "name": "Zancadas Cruzadas Dinámicas (Split Jacks)",
                  "desc": "Realiza saltos alternando el pie de apoyo adelante y atrás en tijera.",
                  "muscles": "Cuádriceps, Gluteo Medio, Cardio",
                  "youtubeId": "83cVgok6KrI"
            },
            {
                  "phase": 5,
                  "duration": 35,
                  "name": "Respiración Profunda (Cooldown)",
                  "desc": "Cierra los ojos, respira a un ritmo pausado y reduce tus latidos cardíacos.",
                  "muscles": "Recuperación, Calma",
                  "youtubeId": ""
            }
      ]
},
    {
          routineName: 'Rutina D: Movilidad y Lateralidad',
          phases: [
            { phase: 1, duration: 10, name: 'Movilidad de Hombros (Chest Expansions)', desc: 'Aperturas horizontales para calentar tren superior.', muscles: 'Hombros, Pecho', youtubeId: 'El_Sj5hisSs' },
            { phase: 2, duration: 25, name: 'Zancadas Laterales (Side Lunges)', desc: 'Da un paso amplio lateral flexionando una rodilla y manteniendo la otra estirada.', muscles: 'Aductores, Glúteos, Cuádriceps', youtubeId: 'KXoVm0WXcfE' },
            { phase: 3, duration: 25, name: 'Sentadillas (Squats)', desc: 'Desciende buscando la paralela de manera fluida.', muscles: 'Cuádriceps, Glúteos', youtubeId: 'PyUP10dh8CE' },
            { phase: 4, duration: 25, name: 'Sentadillas con Salto (Jump Squats)', desc: 'Sentadilla con despegue explosivo vertical.', muscles: 'Cuádriceps, Pantorrillas, Cardio', youtubeId: 'bv7as8mDXLQ' },
            { phase: 5, duration: 35, name: 'Respiración Profunda (Cooldown)', desc: 'Recupera el ritmo respiratorio pausando los movimientos.', muscles: 'Recuperación, Calma', youtubeId: '' }
          ]
        },
    {
          routineName: 'Rutina E: Cadena Posterior e Isquios',
          phases: [
            { phase: 1, duration: 10, name: 'Rotaciones de Brazos (Raised Arms Circles)', desc: 'Círculos pequeños y fluidos para calentar la parte alta.', muscles: 'Hombros, Trapecio', youtubeId: 'D40wm6vbI_0' },
            { phase: 2, duration: 25, name: 'Sentadilla Sumo (Sumo Squats)', desc: 'Sentadilla con pies bien separados y puntas hacia afuera para incidir en abductores.', muscles: 'Aductores, Glúteo Mayor, Cuádriceps', youtubeId: 'rmEVorjxBWs' },
            { phase: 3, duration: 25, name: 'Puente de Glúteos (Glute Bridges)', desc: 'Túmbate boca arriba con rodillas dobladas y eleva la cadera contrayendo glúteos.', muscles: 'Glúteos, Isquiotibiales, Core', youtubeId: 'LORVjN2bg5o' },
            { phase: 4, duration: 25, name: 'Elevación de Talones (Calf Raises)', desc: 'Ponte de puntillas y aprieta las pantorrillas.', muscles: 'Pantorrillas, Tobillos', youtubeId: 'UV8gOrHmuKc' },
            { phase: 5, duration: 35, name: 'Respiración Profunda (Cooldown)', desc: 'Estira el torso y respira lento expandiendo el abdomen.', muscles: 'Recuperación, Calma', youtubeId: '' }
          ]
        },
    {
          routineName: 'Rutina F: Resistencia en Pared',
          phases: [
            { phase: 1, duration: 10, name: 'Jumping Jacks Suaves', desc: 'Activación aeróbica general previa.', muscles: 'Cardio, Piernas', youtubeId: 'gG2Z1siSvkk' },
            { phase: 2, duration: 25, name: 'Sentadilla en Pared (Wall Sit)', desc: 'Apoya la espalda firmemente en la pared y mantén los muslos paralelos al suelo formando 90º.', muscles: 'Cuádriceps, Isquiotibiales, Estabilidad', youtubeId: 'mDdLC-yKudY' },
            { phase: 3, duration: 25, name: 'Zancadas Laterales (Side Lunges)', desc: 'Desplazamientos laterales alternos sintiendo el estiramiento interno.', muscles: 'Glúteos, Aductores, Cuádriceps', youtubeId: 'KXoVm0WXcfE' },
            { phase: 4, duration: 25, name: 'Zancadas Cruzadas Dinámicas (Split Jacks)', desc: 'Tijeras de pies rápidas para activar el corazón.', muscles: 'Cardio, Pantorrillas, Cuádriceps', youtubeId: '83cVgok6KrI' },
            { phase: 5, duration: 35, name: 'Respiración Profunda (Cooldown)', desc: 'Inhalaciones lentas por la nariz y exhalaciones relajadas por la boca.', muscles: 'Recuperación, Calma', youtubeId: '' }
          ]
        },
    {
          routineName: 'Rutina G: Potencia y Glúteos',
          phases: [
            { phase: 1, duration: 10, name: 'Movilidad de Hombros (Chest Expansions)', desc: 'Movimientos de pecho y omóplatos.', muscles: 'Hombros, Trapecio', youtubeId: 'El_Sj5hisSs' },
            { phase: 2, duration: 25, name: 'Sentadillas (Squats)', desc: 'Sentadillas profundas controladas.', muscles: 'Cuádriceps, Glúteos', youtubeId: 'PyUP10dh8CE' },
            { phase: 3, duration: 25, name: 'Puente de Glúteos (Glute Bridges)', desc: 'Aprieta bien los glúteos arriba durante un segundo.', muscles: 'Glúteos, Isquiotibiales', youtubeId: 'LORVjN2bg5o' },
            { phase: 4, duration: 25, name: 'Sentadillas con Salto (Jump Squats)', desc: 'Salto pliométrico reactivo.', muscles: 'Cardio, Cuádriceps, Potencia', youtubeId: 'bv7as8mDXLQ' },
            { phase: 5, duration: 35, name: 'Respiración Profunda (Cooldown)', desc: 'Pausa basal consciente.', muscles: 'Recuperación, Calma', youtubeId: '' }
          ]
        },
    {
          routineName: 'Rutina H: Resistencia y Aductores',
          phases: [
            { phase: 1, duration: 10, name: 'Rotaciones de Brazos (Raised Arms Circles)', desc: 'Rotación escapular alta.', muscles: 'Hombros', youtubeId: 'D40wm6vbI_0' },
            { phase: 2, duration: 25, name: 'Zancadas Laterales (Side Lunges)', desc: 'Desplázate a los lados de forma alterna y rítmica.', muscles: 'Aductores, Glúteos', youtubeId: 'KXoVm0WXcfE' },
            { phase: 3, duration: 25, name: 'Sentadilla Sumo (Sumo Squats)', desc: 'Sentadillas bien abiertas estilo sumo.', muscles: 'Aductores, Cuádriceps', youtubeId: 'rmEVorjxBWs' },
            { phase: 4, duration: 25, name: 'Elevación de Talones (Calf Raises)', desc: 'Aísla el gemelo subiendo despacio.', muscles: 'Pantorrillas', youtubeId: 'UV8gOrHmuKc' },
            { phase: 5, duration: 35, name: 'Respiración Profunda (Cooldown)', desc: 'Baja latidos diafragmáticamente.', muscles: 'Recuperación, Calma', youtubeId: '' }
          ]
        },
    {
          routineName: 'Rutina I: Isometría Avanzada',
          phases: [
            { phase: 1, duration: 10, name: 'Jumping Jacks Suaves', desc: 'Aperturas aeróbicas progresivas.', muscles: 'Cardio, Full Body', youtubeId: 'gG2Z1siSvkk' },
            { phase: 2, duration: 25, name: 'Sentadilla en Pared (Wall Sit)', desc: 'Sostén la posición isométrica contra la pared.', muscles: 'Cuádriceps, Resistencia', youtubeId: 'mDdLC-yKudY' },
            { phase: 3, duration: 25, name: 'Sentadillas Isométricas (Squat Hold)', desc: 'Aguanta la sentadilla libre.', muscles: 'Cuádriceps, Core, Hombros', youtubeId: 'OpiE9QGKfuo' },
            { phase: 4, duration: 25, name: 'Zancadas Cruzadas Dinámicas (Split Jacks)', desc: 'Zancadas cortas reactivas en el sitio.', muscles: 'Cardio, Gemelos', youtubeId: '83cVgok6KrI' },
            { phase: 5, duration: 35, name: 'Respiración Profunda (Cooldown)', desc: 'Cierra los ojos y calma tu respiración.', muscles: 'Recuperación, Calma', youtubeId: '' }
          ]
        },
    {
          routineName: 'Rutina J: Reclutamiento de Cadera Posterior',
          phases: [
            { phase: 1, duration: 10, name: 'Rotaciones de Brazos (Raised Arms Circles)', desc: 'Activación del tren superior.', muscles: 'Hombros', youtubeId: 'D40wm6vbI_0' },
            { phase: 2, duration: 25, name: 'Puente de Glúteos (Glute Bridges)', desc: 'Eleva la pelvis contrayendo glúteos.', muscles: 'Glúteos, Isquios', youtubeId: 'LORVjN2bg5o' },
            { phase: 3, duration: 25, name: 'Sentadilla Sumo (Sumo Squats)', desc: 'Sumo squats lentas enfatizando la bajada.', muscles: 'Aductores, Glúteos', youtubeId: 'rmEVorjxBWs' },
            { phase: 4, duration: 25, name: 'Sentadillas con Salto (Jump Squats)', desc: 'Saltos explosivos para acabar fatigando las piernas.', muscles: 'Cuádriceps, Potencia', youtubeId: 'bv7as8mDXLQ' },
            { phase: 5, duration: 35, name: 'Respiración Profunda (Cooldown)', desc: 'Disminuye la frecuencia cardíaca.', muscles: 'Recuperación, Calma', youtubeId: '' }
          ]
        }
  ],
  empuje: [
    {
      "routineName": "Rutina A: Pecho y Tríceps Estándar",
      "phases": [
            {
                  "phase": 1,
                  "duration": 10,
                  "name": "Movilidad de Hombros (Chest Expansions)",
                  "desc": "Aperturas horizontales controladas para calentar los hombros.",
                  "muscles": "Hombros, Escápulas",
                  "youtubeId": "El_Sj5hisSs"
            },
            {
                  "phase": 2,
                  "duration": 25,
                  "name": "Flexiones Inclinadas (Push-Ups)",
                  "desc": "Manos apoyadas en mesa o escritorio. Torso alineado en tabla.",
                  "muscles": "Pectoral Inferior, Tríceps, Deltoides",
                  "youtubeId": "v9LABVJzv8A"
            },
            {
                  "phase": 3,
                  "duration": 25,
                  "name": "Plancha con Patada Atrás (Elbow Plank Leg Raises)",
                  "desc": "Apóyate en antebrazos y eleva de forma alterna las piernas manteniendo el core tenso.",
                  "muscles": "Core, Pectorales, Glúteos",
                  "youtubeId": "Akf3IP0H9fA"
            },
            {
                  "phase": 4,
                  "duration": 25,
                  "name": "Flexiones Diamante (Diamond Push-Ups)",
                  "desc": "Junta manos formando un diamante bajo el pecho para aislar los tríceps.",
                  "muscles": "Tríceps, Pectoral, Core",
                  "youtubeId": "1Y8pTxdwf3M"
            },
            {
                  "phase": 5,
                  "duration": 35,
                  "name": "Respiración Profunda (Cooldown)",
                  "desc": "Relaja la respiración, inspira hondo por la nariz reteniendo el aire y suelta con calma.",
                  "muscles": "Recuperación, Calma",
                  "youtubeId": ""
            }
      ]
},
    {
      "routineName": "Rutina B: Resistencia y Core de Empuje",
      "phases": [
            {
                  "phase": 1,
                  "duration": 10,
                  "name": "Rotaciones de Brazos (Raised Arms Circles)",
                  "desc": "Moviliza la articulación del hombro estirando bien los brazos.",
                  "muscles": "Hombros, Trapecio",
                  "youtubeId": "D40wm6vbI_0"
            },
            {
                  "phase": 2,
                  "duration": 25,
                  "name": "Flexiones en Suelo (Push-Ups)",
                  "desc": "Apoya rodillas o pies. Baja el pecho cerca del suelo manteniendo el abdomen tenso.",
                  "muscles": "Pectoral Mayor, Deltoides Anterior, Tríceps",
                  "youtubeId": "v9LABVJzv8A"
            },
            {
                  "phase": 3,
                  "duration": 25,
                  "name": "Fondos de Tríceps (Chair Dips)",
                  "desc": "Apoya las manos en el borde de una silla estable o escritorio y baja la cadera flexionando codos.",
                  "muscles": "Tríceps, Deltoides Anterior, Pectoral",
                  "youtubeId": "1mRpK_-d_H4"
            },
            {
                  "phase": 4,
                  "duration": 25,
                  "name": "Plancha Toques de Hombro (Shoulder Taps)",
                  "desc": "En posición de flexión, toca alternamente tus hombros con la mano opuesta sin balancear la cadera.",
                  "muscles": "Deltoides, Core, Tríceps",
                  "youtubeId": "gWHQpMUd7vw"
            },
            {
                  "phase": 5,
                  "duration": 35,
                  "name": "Respiración Profunda (Cooldown)",
                  "desc": "Pausa el ritmo respiratorio para bajar la temperatura corporal y volver al trabajo relajado.",
                  "muscles": "Recuperación, Calma",
                  "youtubeId": ""
            }
      ]
},
    {
      "routineName": "Rutina C: Cardio Empuje Intenso",
      "phases": [
            {
                  "phase": 1,
                  "duration": 10,
                  "name": "Jumping Jacks Suaves",
                  "desc": "Salta abriendo brazos y piernas suavemente para calentar.",
                  "muscles": "Full Body, Cardio",
                  "youtubeId": "gG2Z1siSvkk"
            },
            {
                  "phase": 2,
                  "duration": 25,
                  "name": "Flexiones de Pica (Pike Push-Ups)",
                  "desc": "Eleva la cadera formando una V invertida. Desciende inclinando la coronilla hacia tus manos.",
                  "muscles": "Deltoides, Trapecio, Tríceps",
                  "youtubeId": "782MhTFvIBQ"
            },
            {
                  "phase": 3,
                  "duration": 25,
                  "name": "Flexiones de Rodilla (Knee Push-Ups)",
                  "desc": "Flexiones estándar apoyando rodillas, enfocadas en la contracción lenta del pectoral.",
                  "muscles": "Pectorales, Tríceps",
                  "youtubeId": "rrVwNeIpy-k"
            },
            {
                  "phase": 4,
                  "duration": 25,
                  "name": "Plancha Commando (Plank Commandos)",
                  "desc": "Pasa alternativamente de apoyarte en antebrazos a apoyarte en las manos (plancha alta a baja).",
                  "muscles": "Tríceps, Deltoides, Core",
                  "youtubeId": "yDfw9De-sNI"
            },
            {
                  "phase": 5,
                  "duration": 35,
                  "name": "Respiración Profunda (Cooldown)",
                  "desc": "Respira con control. Inhalaciones lentas para apaciguar el pulso.",
                  "muscles": "Recuperación, Calma",
                  "youtubeId": ""
            }
      ]
},
    {
          routineName: 'Rutina D: Fondos y Estabilidad escapular',
          phases: [
            { phase: 1, duration: 10, name: 'Movilidad de Hombros (Chest Expansions)', desc: 'Calentamiento horizontal del pectoral y deltoides.', muscles: 'Hombros, Escápulas', youtubeId: 'El_Sj5hisSs' },
            { phase: 2, duration: 25, name: 'Fondos de Tríceps (Chair Dips)', desc: 'Apoya las manos en el borde de una silla estable o escritorio y baja la cadera flexionando codos.', muscles: 'Tríceps, Deltoides Anterior, Pectoral', youtubeId: '1mRpK_-d_H4' },
            { phase: 3, duration: 25, name: 'Flexiones Inclinadas (Push-Ups)', desc: 'Flexiones inclinadas rítmicas sobre escritorio.', muscles: 'Pectorales, Tríceps', youtubeId: 'v9LABVJzv8A' },
            { phase: 4, duration: 25, name: 'Plancha Toques de Hombro (Shoulder Taps)', desc: 'En posición de flexión, toca alternamente tus hombros con la mano opuesta sin balancear la cadera.', muscles: 'Deltoides, Core, Tríceps', youtubeId: 'gWHQpMUd7vw' },
            { phase: 5, duration: 35, name: 'Respiración Profunda (Cooldown)', desc: 'Relaja los hombros y realiza respiraciones profundas abdominales.', muscles: 'Recuperación, Calma', youtubeId: '' }
          ]
        },
    {
          routineName: 'Rutina E: Hombros y Planchas dinámicas',
          phases: [
            { phase: 1, duration: 10, name: 'Rotaciones de Brazos (Raised Arms Circles)', desc: 'Rotación del hombro en círculos cortos.', muscles: 'Hombros, Cuello', youtubeId: 'D40wm6vbI_0' },
            { phase: 2, duration: 25, name: 'Flexiones de Pica (Pike Push-Ups)', desc: 'Eleva la cadera formando una V invertida. Desciende inclinando la coronilla hacia tus manos.', muscles: 'Deltoides, Trapecio, Tríceps', youtubeId: '782MhTFvIBQ' },
            { phase: 3, duration: 25, name: 'Flexiones de Rodilla (Knee Push-Ups)', desc: 'Flexiones estándar apoyando rodillas, enfocadas en la contracción lenta del pectoral.', muscles: 'Pectorales, Tríceps', youtubeId: 'rrVwNeIpy-k' },
            { phase: 4, duration: 25, name: 'Plancha Commando (Plank Commandos)', desc: 'Pasa alternativamente de apoyarte en antebrazos a apoyarte en las manos (plancha alta a baja).', muscles: 'Tríceps, Deltoides, Core', youtubeId: 'yDfw9De-sNI' },
            { phase: 5, duration: 35, name: 'Respiración Profunda (Cooldown)', desc: 'Calma el ritmo e inhala con el diafragma.', muscles: 'Recuperación, Calma', youtubeId: '' }
          ]
        },
    {
          routineName: 'Rutina F: Fuerza de Tríceps y Pliometría',
          phases: [
            { phase: 1, duration: 10, name: 'Jumping Jacks Suaves', desc: 'Calentamiento dinámico del cuerpo.', muscles: 'Cardio, Hombros', youtubeId: 'gG2Z1siSvkk' },
            { phase: 2, duration: 25, name: 'Fondos de Tríceps (Chair Dips)', desc: 'Trabajo localizado de tríceps en silla.', muscles: 'Tríceps, Hombros', youtubeId: '1mRpK_-d_H4' },
            { phase: 3, duration: 25, name: 'Plancha Toques de Hombro (Shoulder Taps)', desc: 'Estabilidad de core y hombros.', muscles: 'Deltoides, Core', youtubeId: 'gWHQpMUd7vw' },
            { phase: 4, duration: 25, name: 'Burpees Completos (Burpees)', desc: 'Flexión y salto explosivo.', muscles: 'Full Body, Pecho, Cardio', youtubeId: 'E-Oc0zjeqWo' },
            { phase: 5, duration: 35, name: 'Respiración Profunda (Cooldown)', desc: 'Respira hondo y baja pulsaciones de forma progresiva.', muscles: 'Recuperación, Calma', youtubeId: '' }
          ]
        },
    {
          routineName: 'Rutina G: Fuerza y Hombros',
          phases: [
            { phase: 1, duration: 10, name: 'Movilidad de Hombros (Chest Expansions)', desc: 'Aperturas de pecho y escápulas.', muscles: 'Escápulas, Hombros', youtubeId: 'El_Sj5hisSs' },
            { phase: 2, duration: 25, name: 'Flexiones de Pica (Pike Push-Ups)', desc: 'Flexiones en V invertida enfocadas en hombros.', muscles: 'Deltoides, Hombros', youtubeId: '782MhTFvIBQ' },
            { phase: 3, duration: 25, name: 'Flexiones Inclinadas (Push-Ups)', desc: 'Flexiones en mesa manteniendo ritmo fluido.', muscles: 'Pectoral, Tríceps', youtubeId: 'v9LABVJzv8A' },
            { phase: 4, duration: 25, name: 'Flexiones Diamante (Diamond Push-Ups)', desc: 'Flexiones cerradas para explotar tríceps.', muscles: 'Tríceps, Pecho', youtubeId: '1Y8pTxdwf3M' },
            { phase: 5, duration: 35, name: 'Respiración Profunda (Cooldown)', desc: 'Siente cómo se recupera tu cuerpo.', muscles: 'Recuperación, Calma', youtubeId: '' }
          ]
        },
    {
          routineName: 'Rutina H: Estabilidad Postural de Core',
          phases: [
            { phase: 1, duration: 10, name: 'Rotaciones de Brazos (Raised Arms Circles)', desc: 'Rotación escapular.', muscles: 'Hombros', youtubeId: 'D40wm6vbI_0' },
            { phase: 2, duration: 25, name: 'Plancha Toques de Hombro (Shoulder Taps)', desc: 'Toques cruzados alternos en plancha.', muscles: 'Core, Deltoides', youtubeId: 'gWHQpMUd7vw' },
            { phase: 3, duration: 25, name: 'Flexiones de Rodilla (Knee Push-Ups)', desc: 'Flexiones sencillas para bombear el pecho.', muscles: 'Pectorales, Tríceps', youtubeId: 'rrVwNeIpy-k' },
            { phase: 4, duration: 25, name: 'Plancha con Patada Atrás (Elbow Plank Leg Raises)', desc: 'Elevaciones de piernas en plancha sobre codos.', muscles: 'Glúteos, Core, Hombros', youtubeId: 'Akf3IP0H9fA' },
            { phase: 5, duration: 35, name: 'Respiración Profunda (Cooldown)', desc: 'Inhala profundamente bajando el diafragma.', muscles: 'Recuperación, Calma', youtubeId: '' }
          ]
        },
    {
          routineName: 'Rutina I: Coordinación y Potencia',
          phases: [
            { phase: 1, duration: 10, name: 'Jumping Jacks Suaves', desc: 'Preparación y cardio ligero.', muscles: 'Full Body', youtubeId: 'gG2Z1siSvkk' },
            { phase: 2, duration: 25, name: 'Plancha Commando (Plank Commandos)', desc: 'Baja y sube codos de manera rítmica.', muscles: 'Core, Hombros, Tríceps', youtubeId: 'yDfw9De-sNI' },
            { phase: 3, duration: 25, name: 'Fondos de Tríceps (Chair Dips)', desc: 'Focaliza tríceps bajando en silla.', muscles: 'Tríceps, Hombros', youtubeId: '1mRpK_-d_H4' },
            { phase: 4, duration: 25, name: 'Burpees Completos (Burpees)', desc: 'Burpee rápido e intenso.', muscles: 'Cardio, Pecho, Piernas', youtubeId: 'E-Oc0zjeqWo' },
            { phase: 5, duration: 35, name: 'Respiración Profunda (Cooldown)', desc: 'Ralentiza los latidos.', muscles: 'Recuperación, Calma', youtubeId: '' }
          ]
        },
    {
          routineName: 'Rutina J: Resistencia Localizada de Brazos',
          phases: [
            { phase: 1, duration: 10, name: 'Rotaciones de Brazos (Raised Arms Circles)', desc: 'Dibuja círculos con los brazos.', muscles: 'Hombros', youtubeId: 'D40wm6vbI_0' },
            { phase: 2, duration: 25, name: 'Flexiones de Rodilla (Knee Push-Ups)', desc: 'Flexiones con rodillas en el suelo a ritmo constante.', muscles: 'Pectorales, Tríceps', youtubeId: 'rrVwNeIpy-k' },
            { phase: 3, duration: 25, name: 'Plancha Toques de Hombro (Shoulder Taps)', desc: 'Estabilidad escapular sin rotación.', muscles: 'Core, Deltoides', youtubeId: 'gWHQpMUd7vw' },
            { phase: 4, duration: 25, name: 'Plancha Commando (Plank Commandos)', desc: 'Comandos de codo a plancha alta.', muscles: 'Hombros, Tríceps, Core', youtubeId: 'yDfw9De-sNI' },
            { phase: 5, duration: 35, name: 'Respiración Profunda (Cooldown)', desc: 'Relaja la musculatura e inspira lento.', muscles: 'Recuperación, Calma', youtubeId: '' }
          ]
        }
  ],
  tiron: [
    {
      "routineName": "Rutina A: Cadena Posterior Básica",
      "phases": [
            {
                  "phase": 1,
                  "duration": 10,
                  "name": "Movilidad de Hombros (Chest Expansions)",
                  "desc": "Junta escápulas atrás al abrir los brazos para calentar la espalda.",
                  "muscles": "Hombros, Espalda Alta",
                  "youtubeId": "El_Sj5hisSs"
            },
            {
                  "phase": 2,
                  "duration": 25,
                  "name": "Superman Alternado (Alternative Arm/Leg Raises)",
                  "desc": "Tumbado boca abajo, eleva alternativamente brazo y pierna contrarios.",
                  "muscles": "Lumbar, Glúteos, Espalda Alta",
                  "youtubeId": "DFk3yGZv62U"
            },
            {
                  "phase": 3,
                  "duration": 25,
                  "name": "Peso Muerto Rumano Unilateral (Single Leg Deadlift)",
                  "desc": "Haz bisagra sobre un pie buscando el suelo con las manos y estirando la pierna contraria atrás.",
                  "muscles": "Glúteos, Isquiotibiales, Core",
                  "youtubeId": "X28U6NKcaWc"
            },
            {
                  "phase": 4,
                  "duration": 25,
                  "name": "Remo en Marco de Puerta (Door Frame Rows)",
                  "desc": "Sujétate del marco de la puerta con una mano y tira del cuerpo con fuerza.",
                  "muscles": "Dorsales, Bíceps, Escápulas",
                  "youtubeId": "eCojBl6k_HE"
            },
            {
                  "phase": 5,
                  "duration": 35,
                  "name": "Respiración Profunda (Cooldown)",
                  "desc": "Inhala lento, abre el diafragma y relaja completamente los hombros y el cuello.",
                  "muscles": "Recuperación, Calma",
                  "youtubeId": ""
            }
      ]
},
    {
      "routineName": "Rutina B: Bisagra y Estabilidad",
      "phases": [
            {
                  "phase": 1,
                  "duration": 10,
                  "name": "Rotaciones de Brazos (Raised Arms Circles)",
                  "desc": "Círculos controlados de brazos para calentar hombros y espalda alta.",
                  "muscles": "Hombros, Trapecio",
                  "youtubeId": "D40wm6vbI_0"
            },
            {
                  "phase": 2,
                  "duration": 25,
                  "name": "Buenos Días (Good Mornings)",
                  "desc": "De pie, realiza una bisagra de cadera manteniendo la espalda recta.",
                  "muscles": "Isquiotibiales, Lumbar, Glúteos",
                  "youtubeId": "ZryZ1Yt194Y"
            },
            {
                  "phase": 3,
                  "duration": 25,
                  "name": "Cobra en Prono (Prone Cobra)",
                  "desc": "Túmbate boca abajo y eleva el pecho apretando la espalda alta y los omóplatos.",
                  "muscles": "Espalda Alta, Lumbar, Glúteos",
                  "youtubeId": "hD2Uu_gqYv4"
            },
            {
                  "phase": 4,
                  "duration": 25,
                  "name": "Deslizamientos en Pared (Wall Slides)",
                  "desc": "Apoya espalda y brazos en la pared y deslízalos arriba y abajo controladamente.",
                  "muscles": "Escápulas, Hombros, Postura",
                  "youtubeId": "1N8R_EupVb4"
            },
            {
                  "phase": 5,
                  "duration": 35,
                  "name": "Respiración Profunda (Cooldown)",
                  "desc": "Inhala aire fresco pausadamente y suéltalo con suavidad.",
                  "muscles": "Recuperación, Calma",
                  "youtubeId": ""
            }
      ]
},
    {
      "routineName": "Rutina C: Tracción Activa",
      "phases": [
            {
                  "phase": 1,
                  "duration": 10,
                  "name": "Jumping Jacks Suaves",
                  "desc": "Salta abriendo brazos y piernas suavemente para calentar.",
                  "muscles": "Full Body, Cardio",
                  "youtubeId": "gG2Z1siSvkk"
            },
            {
                  "phase": 2,
                  "duration": 25,
                  "name": "Ángeles de Pared (Wall Angels)",
                  "desc": "Apoya cabeza, espalda y brazos en la pared. Desliza los codos manteniendo contacto.",
                  "muscles": "Hombros, Escápulas, Deltoides Posterior",
                  "youtubeId": "h5pP6KqPz4M"
            },
            {
                  "phase": 3,
                  "duration": 25,
                  "name": "Plancha Invertida (Reverse Plank)",
                  "desc": "Apóyate en talones y manos mirando al techo, eleva la cadera en línea recta.",
                  "muscles": "Glúteos, Isquiotibiales, Lumbar, Hombros",
                  "youtubeId": "99hG_A5aL9E"
            },
            {
                  "phase": 4,
                  "duration": 25,
                  "name": "Extensiones en W (W-Extensions)",
                  "desc": "Boca abajo en el suelo, retrae los codos formando una W para activar la espalda alta.",
                  "muscles": "Dorsales, Trapecio, Espalda Alta",
                  "youtubeId": "eD0uX1NcsLI"
            },
            {
                  "phase": 5,
                  "duration": 35,
                  "name": "Respiración Profunda (Cooldown)",
                  "desc": "Respira hondo y despacio. Recupera una respiración natural.",
                  "muscles": "Recuperación, Calma",
                  "youtubeId": ""
            }
      ]
}
  ],
  potencia: [
    {
      "routineName": "Rutina A: Acondicionamiento Plio",
      "phases": [
            {
                  "phase": 1,
                  "duration": 10,
                  "name": "Jumping Jacks Suaves",
                  "desc": "Abre brazos y piernas saltando a ritmo cómodo.",
                  "muscles": "Full Body, Cardio",
                  "youtubeId": "gG2Z1siSvkk"
            },
            {
                  "phase": 2,
                  "duration": 25,
                  "name": "Rodillas Arriba (High Knees)",
                  "desc": "Lleva rodillas rápido al pecho de forma alterna.",
                  "muscles": "Cardio, Flexores de cadera",
                  "youtubeId": "DfjpR6dzLVg"
            },
            {
                  "phase": 3,
                  "duration": 25,
                  "name": "Sentadillas con Salto (Jump Squats)",
                  "desc": "Sentadilla y salto vertical explosivo cayendo de forma amortiguada.",
                  "muscles": "Cuádriceps, Glúteos, Pantorrillas",
                  "youtubeId": "bv7as8mDXLQ"
            },
            {
                  "phase": 4,
                  "duration": 25,
                  "name": "Burpees Completos (Burpees)",
                  "desc": "Haz burpees a ritmo constante sin parar para máxima fatiga aeróbica.",
                  "muscles": "Full Body, Cardio, Core",
                  "youtubeId": "E-Oc0zjeqWo"
            },
            {
                  "phase": 5,
                  "duration": 35,
                  "name": "Respiración Profunda (Cooldown)",
                  "desc": "Exhala de forma prolongada. Concéntrate en relajar los latidos.",
                  "muscles": "Recuperación, Calma",
                  "youtubeId": ""
            }
      ]
},
    {
      "routineName": "Rutina B: Cardio Core y Potencia",
      "phases": [
            {
                  "phase": 1,
                  "duration": 10,
                  "name": "Patadas al Glúteo (Butt Kicks)",
                  "desc": "Trote en el sitio llevando de forma alterna los talones a los glúteos.",
                  "muscles": "Cardio, Isquiotibiales",
                  "youtubeId": "81sL8xY7h-c"
            },
            {
                  "phase": 2,
                  "duration": 25,
                  "name": "Plancha Jacks (Plank Jacks)",
                  "desc": "Posición de plancha alta, salta abriendo y cerrando las piernas.",
                  "muscles": "Core, Hombros, Cardio",
                  "youtubeId": "3VpkyIcnT64"
            },
            {
                  "phase": 3,
                  "duration": 25,
                  "name": "Escaladores (Climbers)",
                  "desc": "Posición de flexión, lleva rodillas de forma alterna hacia el pecho de manera muy rápida.",
                  "muscles": "Core, Hombros, Flexores de cadera",
                  "youtubeId": "w2iTOneGPdU"
            },
            {
                  "phase": 4,
                  "duration": 25,
                  "name": "Zancadas Cruzadas Dinámicas (Split Jacks)",
                  "desc": "Tijeras de pies con salto dinámico y continuo.",
                  "muscles": "Piernas, Glúteos, Cardio",
                  "youtubeId": "83cVgok6KrI"
            },
            {
                  "phase": 5,
                  "duration": 35,
                  "name": "Respiración Profunda (Cooldown)",
                  "desc": "Inhala en 4 segundos, retén el aire y exhala muy despacio por la boca.",
                  "muscles": "Recuperación, Calma",
                  "youtubeId": ""
            }
      ]
},
    {
      "routineName": "Rutina C: Cardio Isométrico Híbrido",
      "phases": [
            {
                  "phase": 1,
                  "duration": 10,
                  "name": "Patadas Altas (High Kicks)",
                  "desc": "Lanza las piernas estiradas adelante alternamente, buscando tocar la punta del pie con la mano opuesta.",
                  "muscles": "Isquiotibiales, Cardio, Flexores de Cadera",
                  "youtubeId": "2uG8h_ZqA4M"
            },
            {
                  "phase": 2,
                  "duration": 25,
                  "name": "Saltos de Esquiador (Skier Jacks)",
                  "desc": "Salta de lado a lado manteniendo los pies juntos, simulando esquí.",
                  "muscles": "Cardio, Abductores, Gemelos",
                  "youtubeId": "U8gO_rHMUKc"
            },
            {
                  "phase": 3,
                  "duration": 25,
                  "name": "Caminata en Plancha (Plank Walkouts)",
                  "desc": "De pie, dobla el torso, camina con las manos hasta plancha alta, mantén 1s y regresa.",
                  "muscles": "Core, Hombros, Flexibilidad Posterior",
                  "youtubeId": "Ao-nV3IdINQ"
            },
            {
                  "phase": 4,
                  "duration": 25,
                  "name": "Zancadas con Salto (Jumping Lunges)",
                  "desc": "Realiza zancadas alternas dando un salto explosivo en cada cambio de pierna.",
                  "muscles": "Cuádriceps, Glúteos, Potencia, Cardio",
                  "youtubeId": "Kq5lZ4o26Ho"
            },
            {
                  "phase": 5,
                  "duration": 35,
                  "name": "Respiración Profunda (Cooldown)",
                  "desc": "Realiza respiraciones pausadas diafragmáticas para relajar el sistema nervioso.",
                  "muscles": "Recuperación, Calma",
                  "youtubeId": ""
            }
      ]
}
  ],
  movilidad: [
    {
      "routineName": "Rutina A: Apertura y Postura",
      "phases": [
            {
                  "phase": 1,
                  "duration": 10,
                  "name": "Movilidad de Hombros (Chest Expansions)",
                  "desc": "Círculos escapulares y aperturas de pecho.",
                  "muscles": "Hombros, Espalda Alta",
                  "youtubeId": "El_Sj5hisSs"
            },
            {
                  "phase": 2,
                  "duration": 25,
                  "name": "Rotaciones de Brazos (Raised Arms Circles)",
                  "desc": "Brazos abiertos horizontales, dibuja círculos lentos hacia adelante.",
                  "muscles": "Deltoides, Trapecio",
                  "youtubeId": "D40wm6vbI_0"
            },
            {
                  "phase": 3,
                  "duration": 25,
                  "name": "Inclinaciones Laterales (Side Bends)",
                  "desc": "De pie, desliza la mano por el lateral del muslo inclinando el torso a cada lado.",
                  "muscles": "Oblicuos, Lumbar, Columna",
                  "youtubeId": "uWLFCRHU0Og"
            },
            {
                  "phase": 4,
                  "duration": 25,
                  "name": "Movilidad de Cadera (Hip Rotations)",
                  "desc": "Dibuja círculos grandes con la cadera para liberar tensión articular.",
                  "muscles": "Cadera, Articulaciones",
                  "youtubeId": "yX3HnK_pA78"
            },
            {
                  "phase": 5,
                  "duration": 35,
                  "name": "Respiración Profunda (Cooldown)",
                  "desc": "Cierra los ojos. Respira hondo y lento para recuperar el pulso basal.",
                  "muscles": "Recuperación, Calma",
                  "youtubeId": ""
            }
      ]
},
    {
      "routineName": "Rutina B: Flexibilidad y Postura Espalda",
      "phases": [
            {
                  "phase": 1,
                  "duration": 10,
                  "name": "Gato-Camello (Cat Cow)",
                  "desc": "En cuadrupedia o de pie apoyado en mesa, arquea y redondea la columna lenta y controladamente.",
                  "muscles": "Columna Vertebral, Lumbar, Cuello",
                  "youtubeId": "1mRpK_-d_H4"
            },
            {
                  "phase": 2,
                  "duration": 25,
                  "name": "Giro de Torso (Torso Twists)",
                  "desc": "Gira el torso de lado a lado manteniendo la cadera al frente y los brazos relajados.",
                  "muscles": "Columna, Core, Flexibilidad",
                  "youtubeId": "rX8yG_HMUuK"
            },
            {
                  "phase": 3,
                  "duration": 25,
                  "name": "Encogimiento Escapular (Scapula Shrugs)",
                  "desc": "Mueve los hombros adelante, arriba, atrás y abajo para relajar la zona cervical.",
                  "muscles": "Trapecio, Escápulas, Cuello",
                  "youtubeId": "tH_B_gqYv4A"
            },
            {
                  "phase": 4,
                  "duration": 25,
                  "name": "Movilidad de Cuello (Neck Rotations)",
                  "desc": "Gira la cabeza suavemente a la izquierda y derecha liberando rigidez cervical.",
                  "muscles": "Cuello, Cervicales",
                  "youtubeId": "9o8yG_HMUuK"
            },
            {
                  "phase": 5,
                  "duration": 35,
                  "name": "Respiración Profunda (Cooldown)",
                  "desc": "Inhala aire profundamente y exhala de forma muy controlada y larga.",
                  "muscles": "Recuperación, Calma",
                  "youtubeId": ""
            }
      ]
},
    {
      "routineName": "Rutina C: Cardio Movilidad Híbrida",
      "phases": [
            {
                  "phase": 1,
                  "duration": 10,
                  "name": "Jumping Jacks Suaves",
                  "desc": "Salta abriendo brazos y piernas suavemente para calentar.",
                  "muscles": "Full Body, Cardio",
                  "youtubeId": "gG2Z1siSvkk"
            },
            {
                  "phase": 2,
                  "duration": 25,
                  "name": "Estiramiento de Gemelos (Calf Stretch)",
                  "desc": "Apoya las manos en la pared, estira una pierna atrás presionando el talón contra el suelo.",
                  "muscles": "Pantorrillas, Tendón de Aquiles",
                  "youtubeId": "z4zQ-A5aL9E"
            },
            {
                  "phase": 3,
                  "duration": 25,
                  "name": "Movilidad de Tobillos (Ankle Rotations)",
                  "desc": "Dibuja círculos lentos con la punta del pie apoyada en el suelo.",
                  "muscles": "Tobillos, Articulaciones",
                  "youtubeId": "o8yG_HMUuKc"
            },
            {
                  "phase": 4,
                  "duration": 25,
                  "name": "Movilidad de Muñecas (Wrist Rotations)",
                  "desc": "Entrelaza los dedos de las manos y dibuja infinitos o círculos suaves para calentar muñecas.",
                  "muscles": "Muñecas, Antebrazos",
                  "youtubeId": "yG_HMUuKc8o"
            },
            {
                  "phase": 5,
                  "duration": 35,
                  "name": "Respiración Profunda (Cooldown)",
                  "desc": "Inspira profundamente llenando el diafragma y exhala todo el aire relajando el cuerpo.",
                  "muscles": "Recuperación, Calma",
                  "youtubeId": ""
            }
      ]
}
  ]
};
