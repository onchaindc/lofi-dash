export const GAME = {
  WIDTH: 1280,
  HEIGHT: 720,

  // Core feel — these numbers define the game
  PLAYER_SPEED: 460,
  JUMP_VELOCITY: -820,
  GRAVITY: 2600,
  GROUND_Y: 580,

  // Quality of life that makes it feel fair
  COYOTE_TIME: 0.09,      // seconds after leaving ground you can still jump
  JUMP_BUFFER: 0.12,      // seconds before landing that a jump press is remembered

  // Fixed timestep
  PHYSICS_HZ: 240,
  DT: 1 / 240,

  // Visual language
  BG: 0x08080f,
  GROUND_COLOR: 0x141422,
  ACCENT: 0x8b5cf6,
  ACCENT_DIM: 0x4c1d95,
  ACCENT_GLOW: 0xa78bfa,

  PLAYER_SIZE: 46,
  HITBOX_SCALE: 0.36
} as const