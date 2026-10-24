/** Driving values use metres, seconds, and radians. Keep tuning out of rendering code. */
export const PHYSICS = Object.freeze({
  step: 1 / 120,
  acceleration: 24,
  braking: 48,
  drag: 0.006,
  rollingResistance: 1.4,
  maxSpeed: 78,
  reverseSpeed: 12,
  steeringRate: 1.45,
  steeringResponse: 7,
  gravity: 26,
  boostAcceleration: 55,
  boostMaxSpeed: 105,
  fallResetSeconds: 1.5,
});

export const DEFAULT_SETTINGS = Object.freeze({
  color: '#c9ff37',
  camera: 'chase',
  sound: true,
  ghost: true,
  quality: 'high',
});

export const PALETTE = ['#c9ff37', '#ff6c36', '#5bafff', '#f162bf', '#f3f5f9'];
