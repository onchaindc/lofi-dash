export const GAME = {
  WIDTH: 1280,
  HEIGHT: 720,

  // Core feel numbers — these are the ones that matter
  PLAYER_SPEED: 420,          // constant forward velocity
  JUMP_VELOCITY: -780,
  GRAVITY: 2400,
  GROUND_Y: 580,

  // Fixed timestep (matches Geometry Dash philosophy)
  PHYSICS_HZ: 240,
  DT: 1 / 240,

  // Visual
  BG: 0x0a0a12,
  GROUND_COLOR: 0x1a1a2e,
  ACCENT: 0x7c5cff,           // soft purple neon
  ACCENT_DIM: 0x3d2b8a,

  // Player size
  PLAYER_SIZE: 48
} as const