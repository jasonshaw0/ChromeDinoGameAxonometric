export const GRAVITY = 0.6;
export const JUMP_FORCE = 11;
export const INITIAL_SPEED = 1.5;
export const MAX_SPEED = 2;
export const SPEED_INCREMENT = 0.005;

export const GROUND_LEVEL = 0;
export const LANE_WIDTH = 40;

export const DINO_SIZE = { w: 10, d: 6, h: 10 };
export const VOXEL_SIZE = 4;

export const CACTUS_SMALL_SIZE = { w: 8, d: 4, h: 15 };
export const CACTUS_LARGE_SIZE = { w: 12, d: 6, h: 20 };
export const PTERODACTYL_SIZE = { w: 8, d: 6, h: 4 };
export const ROCK_SIZE = { w: 6, d: 5, h: 4 };

export const COLORS = {
  GROUND_BASE: '#d1ba94',
  PATH: '#e0c89f',
  SAND_LIGHT: '#ebd7b2',
  SAND_DARK: '#bfa075',
  SAND_DETAIL: '#bfa075',
  PEBBLE_LIGHT: '#d4c3a3',
  PEBBLE_DARK: '#8b7355',
  HEAT_HAZE: 'rgba(255, 255, 255, 0.05)',

  SKY_TOP: '#3b82f6',
  SKY_BOTTOM: '#b4cfef', // Blended transition sky

  MOUNTAIN_FAR: '#bfdbfe',
  MOUNTAIN_NEAR: '#e5e7eb',

  DINO_SKIN: '#4ade80',
  DINO_BELLY: '#fef08a',
  DINO_SPOTS: '#15803d',
  DINO_EYE: '#ffffff',
  DINO_PUPIL: '#000000',

  CACTUS_MAIN: '#166534',
  CACTUS_LIGHT: '#22c55e',
  ROCK_LIGHT: '#9ca3af',
  ROCK_DARK: '#4b5563',
  SANDSTONE_LIGHT: '#c9ac7b',
  SANDSTONE_DARK: '#a08254',
  DRIFTWOOD: '#8b5a38',
  DRIFTWOOD_LIGHT: '#aa734a',
  BUSH: '#b68a55',
  BUSH_HIGHLIGHT: '#d8b179',
  BONE: '#f1ede0',
  BONE_SHADOW: '#d6ccb7',

  BIRD_BODY: '#7c3aed',
  BIRD_WING: '#a78bfa',

  SHADOW: 'rgba(0, 0, 0, 0.25)',

  TEXT: '#1f2937',
};

// Negative angle creates a "Chase View" where +X moves Up-Right on screen
export const VIEW_ANGLE = -30 * (Math.PI / 180); 
