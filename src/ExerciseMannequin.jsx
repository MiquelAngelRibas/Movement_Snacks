import React from 'react';

const standing = {
  head: [100, 24], torso: [[100, 42], [100, 100]],
  leftArm: [[91, 53], [70, 77], [55, 101]], rightArm: [[109, 53], [130, 77], [145, 101]],
  leftLeg: [[93, 100], [78, 132], [72, 166]], rightLeg: [[107, 100], [122, 132], [128, 166]]
};

const floor = {
  head: [54, 93], torso: [[67, 99], [121, 126]],
  leftArm: [[72, 105], [64, 134], [57, 163]], rightArm: [[79, 108], [83, 137], [83, 163]],
  leftLeg: [[121, 126], [148, 148], [169, 164]], rightLeg: [[116, 132], [137, 156], [151, 166]]
};

const withPose = (base, changes) => ({ ...base, ...changes });

function targetStanding(motion) {
  switch (motion) {
    case 'jumping_jacks': return withPose(standing, {
      leftArm: [[91, 53], [58, 37], [45, 16]], rightArm: [[109, 53], [142, 37], [155, 16]],
      leftLeg: [[93, 100], [68, 134], [50, 166]], rightLeg: [[107, 100], [132, 134], [150, 166]]
    });
    case 'half_jacks': return withPose(standing, {
      leftArm: [[91, 53], [62, 48], [49, 34]], rightArm: [[109, 53], [138, 48], [151, 34]],
      leftLeg: [[93, 100], [72, 132], [60, 166]], rightLeg: [[107, 100], [128, 132], [140, 166]]
    });
    case 'high_knees':
    case 'march': return withPose(standing, {
      leftArm: [[91, 53], [72, 69], [60, 82]], rightArm: [[109, 53], [128, 71], [141, 88]],
      leftLeg: [[93, 100], [67, 103], [73, 125]], rightLeg: [[107, 100], [125, 135], [128, 166]]
    });
    case 'butt_kicks': return withPose(standing, { leftLeg: [[93, 100], [73, 131], [93, 139]] });
    case 'skater': return withPose(standing, {
      head: [87, 31], torso: [[89, 48], [78, 105]],
      leftArm: [[80, 58], [53, 74], [38, 81]], rightArm: [[98, 57], [123, 69], [145, 75]],
      leftLeg: [[72, 105], [54, 133], [43, 164]], rightLeg: [[84, 105], [120, 129], [154, 150]]
    });
    case 'squat': return withPose(standing, {
      head: [100, 42], torso: [[100, 59], [100, 121]],
      leftArm: [[91, 67], [65, 68], [47, 75]], rightArm: [[109, 67], [135, 68], [153, 75]],
      leftLeg: [[93, 121], [63, 130], [71, 166]], rightLeg: [[107, 121], [137, 130], [129, 166]]
    });
    case 'lunge': return withPose(standing, {
      torso: [[100, 42], [110, 103]], leftLeg: [[104, 103], [73, 128], [52, 166]], rightLeg: [[116, 103], [137, 138], [148, 166]]
    });
    case 'good_morning':
    case 'single_leg_hinge': return withPose(standing, {
      head: [69, 67], torso: [[79, 73], [104, 105]],
      leftArm: [[82, 77], [58, 91], [42, 108]], rightArm: [[90, 78], [70, 98], [57, 116]],
      rightLeg: motion === 'single_leg_hinge' ? [[110, 105], [142, 104], [169, 111]] : standing.rightLeg
    });
    case 'wall_angels':
    case 'arm_circles': return withPose(standing, {
      leftArm: [[91, 53], [58, 37], [45, 16]], rightArm: [[109, 53], [142, 37], [155, 16]]
    });
    case 'side_reach': return withPose(standing, {
      head: [88, 28], torso: [[90, 45], [96, 100]], leftArm: [[82, 55], [61, 35], [62, 13]]
    });
    case 'torso_twist': return withPose(standing, {
      head: [114, 24], leftArm: [[98, 53], [66, 57], [45, 55]], rightArm: [[108, 53], [137, 68], [157, 72]]
    });
    case 'leg_swing': return withPose(standing, {
      leftArm: [[91, 53], [67, 61], [47, 61]], rightLeg: [[107, 100], [130, 111], [156, 91]]
    });
    default: return withPose(standing, {
      leftArm: [[91, 53], [56, 58], [40, 49]], rightArm: [[109, 53], [144, 58], [160, 49]]
    });
  }
}

function targetFloor(motion) {
  if (motion === 'glute_bridge' || motion === 'reverse_plank') return withPose(floor, {
    head: [50, 132], torso: [[65, 135], [116, 101]], leftLeg: [[116, 101], [149, 136], [169, 164]], rightLeg: [[110, 105], [137, 147], [151, 166]]
  });
  if (motion === 'child_pose') return withPose(floor, {
    head: [77, 135], torso: [[88, 137], [119, 143]], leftArm: [[89, 139], [61, 145], [42, 154]], rightArm: [[95, 139], [68, 151], [50, 160]]
  });
  if (motion === 'cobra' || motion === 'superman') return withPose(floor, {
    head: [motion === 'cobra' ? 59 : 43, motion === 'cobra' ? 64 : 80], torso: [[70, 76], [120, 123]],
    leftArm: [[75, 82], [65, 129], [57, 164]], rightArm: [[81, 86], [83, 132], [83, 164]]
  });
  if (motion === 'mountain_climbers') return withPose(floor, { leftLeg: [[121, 126], [103, 143], [88, 158]] });
  if (motion === 'pike_pushup') return withPose(floor, { head: [66, 131], torso: [[78, 135], [123, 90]] });
  if (motion === 'side_leg_raise') return withPose(floor, { rightLeg: [[110, 140], [135, 115], [161, 93]] });
  return withPose(floor, { head: [54, 119], torso: [[67, 125], [121, 143]] });
}

const floorMotions = new Set(['pushup', 'pike_pushup', 'plank', 'mountain_climbers', 'glute_bridge', 'child_pose', 'cobra', 'superman', 'cat_cow', 'reverse_plank', 'side_leg_raise']);
const points = (coordinates) => coordinates.map(([x, y]) => `${x},${y}`).join(' ');

function Limb({ from, to, className, duration }) {
  const initial = points(from);
  const target = points(to);
  return (
    <>
      <polyline className="exercise-ghost" points={target} />
      <polyline className={className} points={initial}>
        <animate attributeName="points" values={`${initial};${target};${initial}`} dur={duration} repeatCount="indefinite" calcMode="spline" keySplines="0.42 0 0.58 1;0.42 0 0.58 1" />
      </polyline>
    </>
  );
}

export default function ExerciseMannequin({ motion = 'breathing', compact = false }) {
  const isFloor = floorMotions.has(motion);
  const from = isFloor ? floor : standing;
  const to = isFloor ? targetFloor(motion) : targetStanding(motion);
  const duration = ['high_knees', 'mountain_climbers', 'butt_kicks'].includes(motion) ? '0.85s' : '1.55s';

  return (
    <div className={`exercise-mannequin articulate ${compact ? 'compact' : ''}`} aria-label="Maniquí animado demostrando el ejercicio">
      <svg className="exercise-skeleton" viewBox="0 0 200 180" role="img">
        <defs>
          <linearGradient id="exercise-body" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#d9f3ff" /><stop offset="0.5" stopColor="#1b8bc5" /><stop offset="1" stopColor="#075985" /></linearGradient>
          <filter id="exercise-shadow"><feDropShadow dx="0" dy="3" stdDeviation="2" floodColor="#0f172a" floodOpacity="0.3" /></filter>
        </defs>
        <path className="exercise-grid" d="M20 166 H180 M20 126 H180 M20 86 H180 M20 46 H180" />
        {isFloor && <path className="exercise-floor" d="M24 166 H176" />}
        <Limb from={from.torso} to={to.torso} className="exercise-torso" duration={duration} />
        <Limb from={from.leftArm} to={to.leftArm} className="exercise-limb" duration={duration} />
        <Limb from={from.rightArm} to={to.rightArm} className="exercise-limb" duration={duration} />
        <Limb from={from.leftLeg} to={to.leftLeg} className="exercise-limb" duration={duration} />
        <Limb from={from.rightLeg} to={to.rightLeg} className="exercise-limb" duration={duration} />
        <circle className="exercise-ghost-head" cx={to.head[0]} cy={to.head[1]} r="12" />
        <circle className="exercise-head" cx={from.head[0]} cy={from.head[1]} r="12">
          <animate attributeName="cx" values={`${from.head[0]};${to.head[0]};${from.head[0]}`} dur={duration} repeatCount="indefinite" />
          <animate attributeName="cy" values={`${from.head[1]};${to.head[1]};${from.head[1]}`} dur={duration} repeatCount="indefinite" />
        </circle>
        <path className="exercise-direction" d="M174 27h-17m9-7 8 7-8 7" />
      </svg>
      {!compact && <span className="exercise-motion-caption">AZUL: MOVIMIENTO · NARANJA: POSICIÓN OBJETIVO</span>}
    </div>
  );
}