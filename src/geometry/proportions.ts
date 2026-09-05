/**
 * Anatomical and construction proportions adapted from Andrew Loomis and George Bridgman.
 * Proportions are calculated dynamically from detected joint coordinates,
 * ensuring robust adaptation to any gender, body type, or camera distance.
 */
export const Proportions = {
  // Head proportions
  CRANIUM_WIDTH_TO_HEIGHT: 0.78,
  JAW_WIDTH_TO_CRANIUM: 0.65,
  JAW_HEIGHT_TO_CRANIUM: 0.45,

  // Torso proportions
  RIBCAGE_WIDTH_PADDING: 1.15, // Multiplier on shoulder-to-shoulder width
  RIBCAGE_HEIGHT_RATIO: 1.25,   // Relative to cranium height
  PELVIS_WIDTH_PADDING: 1.12,   // Multiplier on hip-to-hip width
  PELVIS_HEIGHT_RATIO: 0.95,

  // Limb thickness ratios (relative to segment length or head scale)
  UPPER_ARM_THICKNESS_RATIO: 0.32,  // Width relative to upper arm length
  FOREARM_THICKNESS_RATIO: 0.28,    // Width relative to forearm length
  THIGH_THICKNESS_RATIO: 0.36,      // Width relative to thigh length
  CALF_THICKNESS_RATIO: 0.30,       // Width relative to calf length

  // Extremity scale
  HAND_LENGTH_RATIO: 0.75, // Relative to cranium height
  HAND_WIDTH_RATIO: 0.40,
  FOOT_LENGTH_RATIO: 0.95,
  FOOT_WIDTH_RATIO: 0.42,

  // Palette colors for Loomis/Bridgman primitives
  COLORS: {
    headStroke: '#38bdf8',      // Sky blue
    headFill: '#0284c7',
    torsoStroke: '#f43f5e',     // Rose / Magenta
    torsoFill: '#e11d48',
    pelvisStroke: '#a855f7',    // Purple
    pelvisFill: '#9333ea',
    armsStroke: '#eab308',      // Amber
    armsFill: '#ca8a04',
    legsStroke: '#22c55e',      // Green
    legsFill: '#16a34a',
    handsStroke: '#f97316',     // Orange
    handsFill: '#ea580c',
    feetStroke: '#f97316',      // Orange
    feetFill: '#ea580c',
    crossContour: '#94a3b8',    // Slate
    spine: '#f43f5e'
  }
};
