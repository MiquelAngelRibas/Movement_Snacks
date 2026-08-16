export const categoryLabels = {
  potencia: 'Cardio metabólico',
  tiron: 'Tirón',
  empuje: 'Empuje',
  pierna: 'Pierna',
  movilidad: 'Movilidad'
};

const phase = (name, motion, muscles, desc, duration = 25, visual = null) => ({
  name,
  motion,
  muscles,
  desc,
  duration,
  visual
});

const warmup = () => phase(
  'Carrera Suave en el Sitio',
  'butt_kicks',
  'Cardio, Piernas, Hombros',
  'Corre muy suave en el sitio, con pasos cortos y brazos relajados.',
  10
);

const mobilityWarmup = () => phase(
  'Rotaciones de Brazos',
  'arm_circles',
  'Hombros, Trapecio',
  'Haz círculos lentos y amplios con los brazos para soltar los hombros.',
  10
);

const cooldown = () => phase(
  'Respiración Profunda',
  'breathing',
  'Recuperación',
  'Recupera el ritmo con una respiración lenta y controlada.',
  35
);

export const DAILY_ROUTINES = {
  morning: [
    {
      id: 'morning-cardio-start',
      category: 'potencia',
      routineName: '1. Activación cardio metabólica',
      phases: [
        warmup(),
        phase('Rodillas Arriba', 'high_knees', 'Cardio, Flexores de Cadera', 'Eleva las rodillas alternando sin perder la postura.'),
        phase('Jumping Jacks Suaves', 'half_jacks', 'Cardio, Hombros, Piernas', 'Abre y cierra brazos y piernas a un ritmo cómodo.'),
        phase('Burpees', 'burpee', 'Cardio, Piernas, Pecho, Core', 'Baja las manos al suelo, lleva los pies atrás y vuelve a subir con control.'),
        cooldown()
      ]
    },
    {
      id: 'morning-pull',
      category: 'tiron',
      routineName: '2. Tirón y postura',
      phases: [
        warmup(),
        phase('Buenos Días', 'good_morning', 'Isquiotibiales, Glúteos, Lumbar', 'Haz una bisagra de cadera con la espalda larga.'),
        phase('Ángeles de Pared', 'wall_angels', 'Deltoides, Trapecio, Escápulas', 'Desliza los brazos por la pared sin despegar la espalda.'),
        phase('Superman Alternado', 'superman', 'Lumbar, Glúteos, Espalda Alta', 'Eleva brazo y pierna contrarios alternando.'),
        cooldown()
      ]
    },
    {
      id: 'morning-push',
      category: 'empuje',
      routineName: '3. Empuje y estabilidad',
      phases: [
        warmup(),
        phase('Flexiones de Rodilla', 'pushup', 'Pectorales, Tríceps', 'Mantén el tronco alineado y baja de forma controlada.'),
        phase('Toques de Hombro', 'plank', 'Core, Deltoides, Tríceps', 'En plancha, toca el hombro contrario sin girar la cadera.'),
        phase('Flexiones de Pica', 'pike_pushup', 'Deltoides, Tríceps', 'Desde una V invertida, dirige la coronilla hacia el suelo.'),
        cooldown()
      ]
    },
    {
      id: 'morning-kettlebell-stairs',
      category: 'pierna',
      routineName: '4. Reto de escaleras con kettlebells',
      phases: [
        phase('3 Pisos con Kettlebells', 'kettlebell_stairs', 'Piernas, Glúteos, Core, Agarre', 'Sube y baja tres pisos con kettlebells ligeras y paso estable. Detente si pierdes el control o la postura.', 120, 'kettlebell-stairs'),
        cooldown()
      ]
    },
    {
      id: 'morning-legs',
      category: 'pierna',
      routineName: '5. Pierna y base',
      phases: [
        warmup(),
        phase('Zancadas Atrás', 'lunge', 'Glúteos, Cuádriceps', 'Da un paso atrás y alterna las piernas.'),
        phase('Puente de Glúteos', 'glute_bridge', 'Glúteos, Isquiotibiales, Core', 'Eleva la cadera apretando glúteos en el punto alto.'),
        phase('Sentadillas', 'squat', 'Cuádriceps, Glúteos', 'Baja la cadera con control y empuja el suelo al subir.'),
        cooldown()
      ]
    },
    {
      id: 'morning-mobility',
      category: 'movilidad',
      routineName: '6. Movilidad de escritorio',
      phases: [
        warmup(),
        phase('Escalador con Rotación Torácica', 'mountain_climbers', 'Core, Hombros, Columna Torácica', 'Desde plancha, acerca una rodilla al pecho y rota el torso abriendo el brazo hacia el techo. Alterna lados.'),
        phase('Inclinaciones Laterales', 'side_reach', 'Oblicuos, Lumbar', 'Alarga un costado y alterna con suavidad.'),
        phase('Giro de Torso', 'torso_twist', 'Oblicuos, Columna', 'Rota el tronco sin mover en exceso la pelvis.'),
        cooldown()
      ]
    },
    {
      id: 'morning-cardio-reset',
      category: 'potencia',
      routineName: '7. Reinicio cardio metabólico',
      phases: [
        warmup(),
        phase('Escaladores', 'mountain_climbers', 'Core, Hombros, Cardio', 'Desde plancha, alterna las rodillas hacia el pecho.'),
        phase('Rodillas Arriba', 'high_knees', 'Cardio, Flexores de Cadera', 'Mantén un ritmo ágil, sin golpear el suelo.'),
        phase('Jumping Jacks', 'jumping_jacks', 'Cardio, Hombros, Piernas', 'Abre y cierra brazos y piernas manteniendo un ritmo constante.'),
        cooldown()
      ]
    }
  ],
  afternoon: [
    {
      id: 'afternoon-neck-shoulders',
      category: 'movilidad',
      routineName: '8. Cuello y hombros',
      phases: [
        mobilityWarmup(),
        phase('Rotaciones de Cuello', 'neck_roll', 'Cervicales, Trapecio', 'Libera tensión con movimientos lentos y cortos.'),
        phase('Chest Expansions', 'chest_open', 'Pectorales, Escápulas', 'Abre el pecho juntando las escápulas suavemente.'),
        phase('Ángeles de Pared', 'wall_angels', 'Deltoides, Trapecio, Escápulas', 'Desliza los brazos manteniendo la postura erguida.'),
        cooldown()
      ]
    },
    {
      id: 'afternoon-hips',
      category: 'movilidad',
      routineName: '9. Cadera y piernas',
      phases: [
        mobilityWarmup(),
        phase('Balanceo de Piernas', 'leg_swing', 'Cadera, Isquiotibiales', 'Balancea una pierna y cambia de lado a mitad de fase.'),
        phase('Círculos de Cadera', 'hip_circles', 'Cadera, Lumbar', 'Dibuja círculos lentos con la cadera en ambos sentidos.'),
        phase('Elevación de Talones', 'calf_raise', 'Pantorrillas, Tobillos', 'Da movilidad al tobillo elevando y bajando los talones.'),
        cooldown()
      ]
    },
    {
      id: 'afternoon-bar-hang',
      category: 'movilidad',
      routineName: '10. Suspensión en barra',
      phases: [
        phase('Aguante en Barra', 'bar_hang', 'Agarre, Hombros, Dorsales', 'Cuélgate de una barra estable y aguanta el máximo que puedas dentro de los dos minutos, descansando y repitiendo cuando lo necesites. Si no aguantas un minuto eres un moñas.', 120, 'bar-hang'),
        cooldown()
      ]
    },
    {
      id: 'afternoon-spine',
      category: 'movilidad',
      routineName: '11. Columna torácica',
      phases: [
        mobilityWarmup(),
        phase('Inclinaciones Laterales', 'side_reach', 'Oblicuos, Lumbar', 'Alarga los flancos elevando un brazo.'),
        phase('Buenos Días', 'good_morning', 'Isquiotibiales, Lumbar', 'Haz una bisagra corta para descargar la espalda.'),
        phase('Cobra en Prono', 'cobra', 'Lumbar, Pectorales', 'Extiende el pecho de forma suave desde el suelo.'),
        cooldown()
      ]
    },
    {
      id: 'afternoon-posterior',
      category: 'movilidad',
      routineName: '12. Cadena posterior',
      phases: [
        mobilityWarmup(),
        phase('Buenos Días', 'good_morning', 'Isquiotibiales, Lumbar', 'Inclina el torso desde la cadera sin forzar el estiramiento.'),
        phase('Inclinaciones Laterales', 'side_reach', 'Oblicuos, Lumbar', 'Alarga los flancos de forma lenta y sin rebotes.'),
        phase('Postura del Niño', 'child_pose', 'Lumbar, Hombros, Cadera', 'Lleva la cadera atrás y alarga los brazos al frente.'),
        cooldown()
      ]
    },
    {
      id: 'afternoon-wrists-core',
      category: 'movilidad',
      routineName: '13. Core y descarga',
      phases: [
        mobilityWarmup(),
        phase('Giro de Torso', 'torso_twist', 'Oblicuos, Columna', 'Rota despacio de un lado a otro sin mover en exceso la pelvis.'),
        phase('Elevación Lateral de Pierna', 'side_leg_raise', 'Glúteo Medio, Abductores', 'Eleva una pierna de lado y cambia a mitad de fase.'),
        phase('Postura del Niño', 'child_pose', 'Lumbar, Hombros', 'Descansa y deja caer el peso del torso.'),
        cooldown()
      ]
    },
    {
      id: 'afternoon-full-reset',
      category: 'movilidad',
      routineName: '14. Reset de movilidad',
      phases: [
        mobilityWarmup(),
        phase('Círculos de Cadera', 'hip_circles', 'Cadera, Lumbar', 'Recupera amplitud de movimiento en la pelvis.'),
        phase('Giro de Torso', 'torso_twist', 'Oblicuos, Columna', 'Haz rotaciones lentas a ambos lados.'),
        phase('Postura del Niño', 'child_pose', 'Espalda, Cadera, Hombros', 'Termina bajando revoluciones y relajando la espalda.'),
        cooldown()
      ]
    }
  ]
};

export const DAILY_ROUTINES_LIST = [...DAILY_ROUTINES.morning, ...DAILY_ROUTINES.afternoon];

export const getRoutineBlock = (lunchEnd = '16:00') => {
  const [hours, minutes] = lunchEnd.split(':').map(Number);
  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  return currentMinutes >= hours * 60 + minutes ? 'afternoon' : 'morning';
};