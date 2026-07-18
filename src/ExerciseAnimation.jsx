import React from 'react';

export default function ExerciseAnimation({ type }) {
  // Generamos diferentes animaciones utilizando puro SVG + CSS Keyframes inyectado
  const renderSVG = () => {
    switch (type) {
      case 'breathing':
        return (
          <svg width="150" height="150" viewBox="0 0 100 100">
            <style>{`
              .breath-circle {
                fill: none;
                stroke: var(--accent);
                stroke-width: 4;
                transform-origin: center;
                animation: breathe 4s ease-in-out infinite;
              }
              .breath-inner {
                fill: var(--accent-bg);
                transform-origin: center;
                animation: breathe-inner 4s ease-in-out infinite;
              }
              @keyframes breathe {
                0%, 100% { transform: scale(0.6); stroke-color: var(--accent); }
                50% { transform: scale(0.95); stroke-color: var(--accent-red); }
              }
              @keyframes breathe-inner {
                0%, 100% { transform: scale(0.3); opacity: 0.3; }
                50% { transform: scale(0.8); opacity: 0.6; }
              }
            `}</style>
            <circle cx="50" cy="50" r="45" className="breath-circle" />
            <circle cx="50" cy="50" r="45" className="breath-inner" />
            <text x="50" y="54" textAnchor="middle" fontSize="8" fontWeight="bold" fill="var(--text-primary)">RESPIRA</text>
          </svg>
        );

      case 'squat':
      case 'squat_hold':
      case 'squat_load':
        return (
          <svg width="150" height="180" viewBox="0 0 100 120">
            <style>{`
              .body-group {
                animation: squat-movement 3s ease-in-out infinite;
              }
              .weight {
                fill: var(--accent-red);
                display: ${type === 'squat_load' ? 'block' : 'none'};
              }
              @keyframes squat-movement {
                0%, 100% { transform: translateY(0px); }
                50% { transform: translateY(30px); }
              }
            `}</style>
            {/* Suelo */}
            <line x1="10" y1="110" x2="90" y2="110" stroke="var(--text-primary)" strokeWidth="3" />
            
            {/* Cuerpo */}
            <g className="body-group">
              {/* Cabeza */}
              <circle cx="50" cy="30" r="10" fill="var(--text-primary)" />
              {/* Torso */}
              <line x1="50" y1="40" x2="50" y2="75" stroke="var(--text-primary)" strokeWidth="4" />
              {/* Brazos */}
              <line x1="50" y1="48" x2="70" y2="48" stroke="var(--text-primary)" strokeWidth="3.5" strokeLinecap="round" />
              {/* Peso (si aplica) */}
              <rect x="65" y="40" width="10" height="16" rx="2" className="weight" />
              {/* Piernas superiores */}
              <line x1="50" y1="75" x2="65" y2="90" stroke="var(--text-primary)" strokeWidth="4" strokeLinecap="round" />
            </g>
            {/* Piernas inferiores fijas al suelo */}
            <line x1="65" y1="90" x2="65" y2="110" stroke="var(--text-primary)" strokeWidth="4" strokeLinecap="round" />
            <line x1="50" y1="75" x2="35" y2="90" stroke="var(--text-primary)" strokeWidth="4" strokeLinecap="round" />
            <line x1="35" y1="90" x2="35" y2="110" stroke="var(--text-primary)" strokeWidth="4" strokeLinecap="round" />
          </svg>
        );

      case 'pushup_incline':
      case 'pushup_floor':
      case 'pushup_diamond':
        return (
          <svg width="150" height="150" viewBox="0 0 120 100">
            <style>{`
              .pushup-body {
                transform-origin: 90px 80px;
                animation: pushup-movement 2.5s ease-in-out infinite;
              }
              @keyframes pushup-movement {
                0%, 100% { transform: rotate(0deg); }
                50% { transform: rotate(-20deg); }
              }
            `}</style>
            {/* Suelo o soporte */}
            <line x1="10" y1="80" x2="110" y2="80" stroke="var(--text-primary)" strokeWidth="3" />
            {type === 'pushup_incline' && (
              <line x1="90" y1="80" x2="90" y2="40" stroke="var(--text-secondary)" strokeWidth="4" strokeLinecap="round" />
            )}
            
            {/* Cuerpo */}
            <g className="pushup-body">
              {/* Cabeza */}
              <circle cx="30" cy="35" r="8" fill="var(--text-primary)" />
              {/* Torso/Piernas */}
              <line x1="38" y1="40" x2="90" y2="80" stroke="var(--text-primary)" strokeWidth="4" strokeLinecap="round" />
              {/* Brazos */}
              <line x1="45" y1="45" x2="45" y2="79" stroke="var(--text-primary)" strokeWidth="3.5" strokeLinecap="round" />
            </g>
          </svg>
        );

      case 'jump_squat':
      case 'jumping_jacks':
      case 'high_knees':
      case 'burpee':
        return (
          <svg width="150" height="180" viewBox="0 0 100 120">
            <style>{`
              .jumping-body {
                animation: jumping-movement 1.5s ease-in-out infinite;
              }
              @keyframes jumping-movement {
                0%, 100% { transform: translateY(15px); }
                50% { transform: translateY(-20px); }
              }
            `}</style>
            <line x1="10" y1="110" x2="90" y2="110" stroke="var(--text-primary)" strokeWidth="3" />
            <g className="jumping-body">
              <circle cx="50" cy="40" r="9" fill="var(--text-primary)" />
              <line x1="50" y1="49" x2="50" y2="80" stroke="var(--text-primary)" strokeWidth="4" />
              {/* Brazos alzados */}
              <line x1="50" y1="55" x2="25" y2="35" stroke="var(--text-primary)" strokeWidth="3.5" strokeLinecap="round" />
              <line x1="50" y1="55" x2="75" y2="35" stroke="var(--text-primary)" strokeWidth="3.5" strokeLinecap="round" />
              {/* Piernas abiertas */}
              <line x1="50" y1="80" x2="35" y2="105" stroke="var(--text-primary)" strokeWidth="4" strokeLinecap="round" />
              <line x1="50" y1="80" x2="65" y2="105" stroke="var(--text-primary)" strokeWidth="4" strokeLinecap="round" />
            </g>
          </svg>
        );

      case 'wall_angels':
        return (
          <svg width="150" height="150" viewBox="0 0 100 100">
            <style>{`
              .left-arm {
                transform-origin: 40px 45px;
                animation: left-arm-move 3s ease-in-out infinite;
              }
              .right-arm {
                transform-origin: 60px 45px;
                animation: right-arm-move 3s ease-in-out infinite;
              }
              @keyframes left-arm-move {
                0%, 100% { transform: rotate(40deg); }
                50% { transform: rotate(-50deg); }
              }
              @keyframes right-arm-move {
                0%, 100% { transform: rotate(-40deg); }
                50% { transform: rotate(50deg); }
              }
            `}</style>
            {/* Pared */}
            <line x1="20" y1="10" x2="20" y2="90" stroke="var(--text-secondary)" strokeWidth="2" strokeDasharray="4 4" />
            
            {/* Persona apoyada */}
            <circle cx="50" cy="30" r="8" fill="var(--text-primary)" />
            <line x1="50" y1="38" x2="50" y2="80" stroke="var(--text-primary)" strokeWidth="4" />
            {/* Brazos W */}
            <g className="left-arm">
              <line x1="40" y1="45" x2="25" y2="30" stroke="var(--text-primary)" strokeWidth="3.5" strokeLinecap="round" />
            </g>
            <g className="right-arm">
              <line x1="60" y1="45" x2="75" y2="30" stroke="var(--text-primary)" strokeWidth="3.5" strokeLinecap="round" />
            </g>
            {/* Piernas */}
            <line x1="50" y1="80" x2="40" y2="95" stroke="var(--text-primary)" strokeWidth="4" strokeLinecap="round" />
            <line x1="50" y1="80" x2="60" y2="95" stroke="var(--text-primary)" strokeWidth="4" strokeLinecap="round" />
          </svg>
        );

      case 'good_morning':
      case 'deadlift_unilateral':
      case 'deadlift_load':
        return (
          <svg width="150" height="150" viewBox="0 0 100 100">
            <style>{`
              .torso-hinge {
                transform-origin: 50px 70px;
                animation: hinge-move 3s ease-in-out infinite;
              }
              @keyframes hinge-move {
                0%, 100% { transform: rotate(0deg); }
                50% { transform: rotate(60deg); }
              }
            `}</style>
            <line x1="10" y1="90" x2="90" y2="90" stroke="var(--text-primary)" strokeWidth="3" />
            
            {/* Torso articulado */}
            <g className="torso-hinge">
              <circle cx="50" cy="35" r="8" fill="var(--text-primary)" />
              <line x1="50" y1="43" x2="50" y2="70" stroke="var(--text-primary)" strokeWidth="4" />
              {/* Manos tras la nuca */}
              <path d="M 50 43 Q 65 35 50 35 Q 35 35 50 43" fill="none" stroke="var(--text-primary)" strokeWidth="3" strokeLinecap="round" />
            </g>
            {/* Piernas estables */}
            <line x1="50" y1="70" x2="45" y2="90" stroke="var(--text-primary)" strokeWidth="4" strokeLinecap="round" />
            <line x1="50" y1="70" x2="55" y2="90" stroke="var(--text-primary)" strokeWidth="4" strokeLinecap="round" />
          </svg>
        );

      case 'row_bodyweight':
      case 'row_load':
      case 'row_dynamic':
      case 'clean_press':
        return (
          <svg width="150" height="150" viewBox="0 0 100 100">
            <style>{`
              .pull-arm {
                animation: row-pull 2s ease-in-out infinite;
              }
              @keyframes row-pull {
                0%, 100% { transform: translateY(0px) scaleY(1); }
                50% { transform: translateY(-15px) scaleY(0.7); }
              }
            `}</style>
            <line x1="10" y1="90" x2="90" y2="90" stroke="var(--text-primary)" strokeWidth="3" />
            
            {/* Torso inclinado a 45 grados */}
            <g transform="rotate(30, 50, 70)">
              <circle cx="50" cy="35" r="8" fill="var(--text-primary)" />
              <line x1="50" y1="43" x2="50" y2="70" stroke="var(--text-primary)" strokeWidth="4" />
              {/* Brazos que tiran de la carga */}
              <g className="pull-arm">
                <line x1="50" y1="48" x2="55" y2="65" stroke="var(--accent)" strokeWidth="3.5" strokeLinecap="round" />
                <rect x="50" y="65" width="10" height="10" fill="var(--accent-red)" rx="2" />
              </g>
            </g>
            {/* Piernas semi-flexionadas */}
            <line x1="50" y1="70" x2="45" y2="90" stroke="var(--text-primary)" strokeWidth="4" strokeLinecap="round" />
            <line x1="50" y1="70" x2="55" y2="90" stroke="var(--text-primary)" strokeWidth="4" strokeLinecap="round" />
          </svg>
        );

      case 'mobility':
      default:
        return (
          <svg width="150" height="150" viewBox="0 0 100 100">
            <style>{`
              .spin-circle {
                fill: none;
                stroke: var(--accent);
                stroke-width: 2;
                stroke-dasharray: 4 4;
                transform-origin: center;
                animation: spin 6s linear infinite;
              }
              .body-joints {
                animation: idle-bob 2s ease-in-out infinite;
              }
              @keyframes spin {
                100% { transform: rotate(360deg); }
              }
              @keyframes idle-bob {
                0%, 100% { transform: translateY(0); }
                50% { transform: translateY(3px); }
              }
            `}</style>
            <circle cx="50" cy="50" r="35" className="spin-circle" />
            <g className="body-joints">
              <circle cx="50" cy="30" r="8" fill="var(--text-primary)" />
              <line x1="50" y1="38" x2="50" y2="70" stroke="var(--text-primary)" strokeWidth="4" />
              <line x1="50" y1="45" x2="30" y2="45" stroke="var(--text-primary)" strokeWidth="3.5" strokeLinecap="round" />
              <line x1="50" y1="45" x2="70" y2="45" stroke="var(--text-primary)" strokeWidth="3.5" strokeLinecap="round" />
              <line x1="50" y1="70" x2="40" y2="90" stroke="var(--text-primary)" strokeWidth="4" strokeLinecap="round" />
              <line x1="50" y1="70" x2="60" y2="90" stroke="var(--text-primary)" strokeWidth="4" strokeLinecap="round" />
            </g>
          </svg>
        );
    }
  };

  return <div className="animation-container">{renderSVG()}</div>;
}
