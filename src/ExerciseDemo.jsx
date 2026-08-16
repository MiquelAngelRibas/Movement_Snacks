import React, { useState } from 'react';
import ExerciseMannequin from './ExerciseMannequin';

const assetNames = {
  'Carrera Suave en el Sitio': 'Butt Kicks',
  'Marcha Activa': 'Rodillas Arriba',
  'Escalador con Rotación Torácica': 'Escaladores'
};

function BreathingVisual({ compact }) {
  return (
    <div className={`breathing-visual ${compact ? 'compact' : ''}`} role="img" aria-label="Círculo de respiración guiada">
      <div className="breathing-ring" />
      <div className="breathing-core" />
      {!compact && (
        <div className="breathing-copy">
          <strong>INHALA · MANTÉN · EXHALA</strong>
          <span>Sigue el pulso del círculo</span>
        </div>
      )}
    </div>
  );
}

function ChallengeVisual({ visual, compact }) {
  const isStairs = visual === 'kettlebell-stairs';
  return (
    <div className={`challenge-visual ${compact ? 'compact' : ''} ${visual}`} role="img" aria-label={isStairs ? 'Reto de escaleras con kettlebells' : 'Reto de suspensión en barra'}>
      {isStairs ? (
        <>
          <div className="challenge-kettlebell left">KB</div>
          <div className="challenge-stairs"><i /><i /><i /></div>
          <div className="challenge-kettlebell right">KB</div>
          {!compact && <strong>3 PISOS · PASO FIRME</strong>}
        </>
      ) : (
        <>
          <div className="challenge-bar" />
          <div className="challenge-hanger"><span /><i /><b /><em /><em /></div>
          {!compact && <strong>AGUANTA · DESCANSA · REPITE</strong>}
        </>
      )}
    </div>
  );
}

export default function ExerciseDemo({ phase, compact = false }) {
  const [hasAssetError, setHasAssetError] = useState(false);
  const assetName = assetNames[phase.name] || phase.name;
  const imagePath = `/exercises/${encodeURIComponent(assetName)}/animation.gif`;

  if (phase.motion === 'breathing') {
    return <BreathingVisual compact={compact} />;
  }

  if (phase.visual) {
    return <ChallengeVisual visual={phase.visual} compact={compact} />;
  }

  if (hasAssetError) {
    return <ExerciseMannequin motion={phase.motion} compact={compact} />;
  }

  return (
    <div className={`exercise-demo ${compact ? 'compact' : ''}`}>
      <img
        src={imagePath}
        alt={`Demostración animada de ${phase.name}`}
        onError={() => setHasAssetError(true)}
      />
    </div>
  );
}