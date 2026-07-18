import React from 'react';

export default function AnatomicalModel({ category, musclesList, exerciseName }) {
  // Parsear la lista de músculos de la fase actual para encenderlos dinámicamente
  const getActiveMuscles = () => {
    const muscles = musclesList ? musclesList.toLowerCase() : '';
    const list = [];
    
    if (muscles.includes('cuádriceps') || muscles.includes('cuadriceps')) list.push('quads');
    if (muscles.includes('glúteo') || muscles.includes('gluteo')) list.push('glutes');
    if (muscles.includes('isquiotibial') || muscles.includes('femoral') || muscles.includes('hamstring') || muscles.includes('cadera') || muscles.includes('posterior')) list.push('hamstrings');
    if (muscles.includes('pantorrilla') || muscles.includes('gemelo') || muscles.includes('calves') || muscles.includes('tobillo')) list.push('calves');
    if (muscles.includes('pectoral') || muscles.includes('pecho')) list.push('pectorals');
    if (muscles.includes('deltoide') || muscles.includes('hombro') || muscles.includes('escapular')) {
      list.push('deltoids_front');
      list.push('deltoids_back');
    }
    if (muscles.includes('tríceps') || muscles.includes('triceps')) list.push('triceps');
    if (muscles.includes('bíceps') || muscles.includes('biceps')) list.push('biceps');
    if (muscles.includes('trapecio') || muscles.includes('traps')) list.push('traps');
    if (muscles.includes('dorsal') || muscles.includes('lats') || muscles.includes('espalda alta') || muscles.includes('escápula')) list.push('lats');
    if (muscles.includes('lumbar') || muscles.includes('espalda baja') || muscles.includes('lower_back')) list.push('lower_back');
    if (muscles.includes('core') || muscles.includes('abdomen') || muscles.includes('abdominal') || muscles.includes('estabilidad')) list.push('core');
    
    // Si no hay musclesList (caso base), usar los de la categoría completa
    if (list.length === 0) {
      return {
        pierna: ['quads', 'glutes', 'hamstrings', 'calves'],
        empuje: ['pectorals', 'deltoids_front', 'deltoids_back', 'triceps'],
        tiron: ['traps', 'lats', 'lower_back', 'biceps', 'hamstrings'],
        metabolico: ['quads', 'glutes', 'hamstrings', 'calves', 'pectorals', 'deltoids_front', 'deltoids_back', 'triceps', 'traps', 'lats', 'lower_back', 'biceps', 'core']
      }[category] || [];
    }
    return list;
  };

  const activeMuscles = getActiveMuscles();

  // Función para determinar el color de relleno del músculo (rojo Garmin si está activo, gris neutro si no)
  const getFill = (muscleId) => {
    return activeMuscles.includes(muscleId) ? 'url(#activeGrad)' : 'var(--anatomy-inactive)';
  };

  return (
    <div className="anatomy-widget">
      <h3 className="anatomy-widget-title" style={{ fontSize: '0.85rem', fontWeight: 800 }}>
        Músculos Activos: {exerciseName ? exerciseName.toUpperCase() : category.toUpperCase()}
      </h3>
      
      <div className="anatomy-layout">
        {/* VISTA ANTERIOR (FRONTAL) */}
        <div className="anatomy-view-box">
          <span className="anatomy-label">VISTA ANTERIOR</span>
          <svg width="100%" height="auto" style={{ maxWidth: '130px' }} viewBox="0 0 100 130">
            <defs>
              <linearGradient id="activeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#ef4444" />
                <stop offset="100%" stopColor="#b91c1c" />
              </linearGradient>
              <filter id="glow" x="-10%" y="-10%" width="120%" height="120%">
                <feGaussianBlur stdDeviation="2" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
            </defs>

            <style>{`
              .muscle {
                transition: fill 0.4s ease;
                stroke: var(--bg-card);
                stroke-width: 0.5;
              }
              .active-muscle {
                filter: url(#glow);
                animation: muscle-pulse 2s infinite alternate;
              }
              @keyframes muscle-pulse {
                0% { opacity: 0.85; }
                100% { opacity: 1; filter: drop-shadow(0 0 4px rgba(239, 68, 68, 0.6)); }
              }
              .body-base {
                fill: var(--anatomy-base);
                stroke: var(--border-color);
                stroke-width: 0.75;
              }
            `}</style>

            {/* Silueta Base Frontal */}
            <path 
              d="M 50 15 C 47 15, 45 18, 45 22 C 45 25, 47 28, 50 28 C 53 28, 55 25, 55 22 C 55 18, 53 15, 50 15 Z M 48 28 L 52 28 L 53 32 L 47 32 Z M 43 32 C 38 32, 35 36, 35 45 C 35 52, 36 60, 34 68 C 33 71, 31 75, 29 80 C 27 85, 26 95, 28 98 L 32 98 C 33 93, 34 85, 36 80 L 38 80 C 39 88, 41 98, 42 110 C 43 118, 41 125, 43 126 L 47 126 C 47 120, 48 114, 49 105 L 51 105 C 52 114, 53 120, 53 126 L 57 126 C 59 125, 57 118, 58 110 C 59 98, 61 88, 62 80 L 64 80 C 66 85, 67 93, 68 98 L 72 98 C 74 95, 73 85, 71 80 C 69 75, 67 71, 66 68 C 64 60, 65 52, 65 45 C 65 36, 62 32, 57 32 Z" 
              className="body-base" 
            />

            {/* Cabeza */}
            <circle cx="50" cy="21" r="5.5" fill="var(--anatomy-inactive)" stroke="var(--bg-card)" strokeWidth="0.5" />

            {/* Músculos - Deltoides Frontal (Hombros) */}
            <path d="M 43 32 C 40 32, 38 34, 37 38 C 36 41, 38 43, 40 42 C 42 41, 43 36, 43 32" className="muscle" fill={getFill('deltoids_front')} />
            <path d="M 57 32 C 60 32, 62 34, 63 38 C 64 41, 62 43, 60 42 C 58 41, 57 36, 57 32" className="muscle" fill={getFill('deltoids_front')} />

            {/* Músculos - Pectorales (Pecho) */}
            <path d="M 44 33 Q 48 34, 49 39 Q 45 42, 41 41 Q 40 36, 44 33" className="muscle" fill={getFill('pectorals')} />
            <path d="M 56 33 Q 52 34, 51 39 Q 55 42, 59 41 Q 60 36, 56 33" className="muscle" fill={getFill('pectorals')} />

            {/* Músculos - Core / Abdominales */}
            <path d="M 46 44 L 54 44 L 53 58 L 47 58 Z" className="muscle" fill={getFill('core')} />

            {/* Músculos - Bíceps (Brazos) */}
            <path d="M 37 42 C 36 45, 36 50, 38 52 C 39 50, 39 45, 38 42" className="muscle" fill={getFill('biceps')} />
            <path d="M 63 42 C 64 45, 64 50, 62 52 C 61 50, 61 45, 62 42" className="muscle" fill={getFill('biceps')} />

            {/* Músculos - Cuádriceps (Piernas Frontal) */}
            <path d="M 37 68 C 37 75, 38 85, 41 95 C 43 85, 44 75, 44 68 Z" className="muscle" fill={getFill('quads')} />
            <path d="M 63 68 C 63 75, 62 85, 59 95 C 57 85, 56 75, 56 68 Z" className="muscle" fill={getFill('quads')} />
          </svg>
        </div>

        {/* VISTA POSTERIOR (TRASERA) */}
        <div className="anatomy-view-box">
          <span className="anatomy-label">VISTA POSTERIOR</span>
          <svg width="100%" height="auto" style={{ maxWidth: '130px' }} viewBox="0 0 100 130">
            {/* Silueta Base Trasera */}
            <path 
              d="M 50 15 C 47 15, 45 18, 45 22 C 45 25, 47 28, 50 28 C 53 28, 55 25, 55 22 C 55 18, 53 15, 50 15 Z M 48 28 L 52 28 L 53 32 L 47 32 Z M 43 32 C 38 32, 35 36, 35 45 C 35 52, 36 60, 34 68 C 33 71, 31 75, 29 80 C 27 85, 26 95, 28 98 L 32 98 C 33 93, 34 85, 36 80 L 38 80 C 39 88, 41 98, 42 110 C 43 118, 41 125, 43 126 L 47 126 C 47 120, 48 114, 49 105 L 51 105 C 52 114, 53 120, 53 126 L 57 126 C 59 125, 57 118, 58 110 C 59 98, 61 88, 62 80 L 64 80 C 66 85, 67 93, 68 98 L 72 98 C 74 95, 73 85, 71 80 C 69 75, 67 71, 66 68 C 64 60, 65 52, 65 45 C 65 36, 62 32, 57 32 Z" 
              className="body-base" 
            />

            {/* Cabeza */}
            <circle cx="50" cy="21" r="5.5" fill="var(--anatomy-inactive)" stroke="var(--bg-card)" strokeWidth="0.5" />

            {/* Músculos - Trapecio */}
            <path d="M 47 28 Q 50 32, 53 28 Q 55 35, 45 35 Z" className="muscle" fill={getFill('traps')} />

            {/* Músculos - Hombros Detrás */}
            <path d="M 43 32 C 41 32, 39 34, 38 37 C 37 40, 39 42, 41 41 C 42 40, 43 36, 43 32" className="muscle" fill={getFill('deltoids_back')} />
            <path d="M 57 32 C 59 32, 61 34, 62 37 C 63 40, 61 42, 59 41 C 58 40, 57 36, 57 32" className="muscle" fill={getFill('deltoids_back')} />

            {/* Músculos - Dorsales (Lats) */}
            <path d="M 45 36 C 45 42, 41 47, 43 53 C 46 51, 48 45, 48 38 Z" className="muscle" fill={getFill('lats')} />
            <path d="M 55 36 C 55 42, 59 47, 57 53 C 54 51, 52 45, 52 38 Z" className="muscle" fill={getFill('lats')} />

            {/* Músculos - Tríceps (Brazos Detrás) */}
            <path d="M 36 41 C 35 44, 35 49, 37 51 C 38 49, 38 44, 37 41" className="muscle" fill={getFill('triceps')} />
            <path d="M 64 41 C 65 44, 65 49, 63 51 C 62 49, 62 44, 63 41" className="muscle" fill={getFill('triceps')} />

            {/* Músculos - Espalda Baja */}
            <path d="M 46 54 L 54 54 L 53 62 L 47 62 Z" className="muscle" fill={getFill('lower_back')} />

            {/* Músculos - Glúteos */}
            <path d="M 43 64 C 40 64, 41 74, 49 74 C 49 69, 46 64, 43 64" className="muscle" fill={getFill('glutes')} />
            <path d="M 57 64 C 60 64, 59 74, 51 74 C 51 69, 54 64, 57 64" className="muscle" fill={getFill('glutes')} />

            {/* Músculos - Isquiotibiales (Pierna Detrás) */}
            <path d="M 41 75 C 41 85, 42 93, 44 95 C 46 93, 47 85, 47 75 Z" className="muscle" fill={getFill('hamstrings')} />
            <path d="M 59 75 C 59 85, 58 93, 56 95 C 54 93, 53 85, 53 75 Z" className="muscle" fill={getFill('hamstrings')} />

            {/* Músculos - Pantorrillas (Calves) */}
            <path d="M 42 98 C 41 105, 42 112, 45 116 C 46 112, 45 105, 45 98 Z" className="muscle" fill={getFill('calves')} />
            <path d="M 58 98 C 59 105, 58 112, 55 116 C 54 112, 55 105, 55 98 Z" className="muscle" fill={getFill('calves')} />
          </svg>
        </div>
      </div>
    </div>
  );
}
