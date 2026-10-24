export const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
export const lerp = (a, b, t) => a + (b - a) * t;
export const wrapAngle = (angle) => Math.atan2(Math.sin(angle), Math.cos(angle));
export const damp = (a, b, rate, dt) => lerp(a, b, 1 - Math.exp(-rate * dt));

export function formatTime(seconds) {
  if (!Number.isFinite(seconds)) return '—';
  const milliseconds = Math.max(0, Math.round(seconds * 1000));
  return `${String(Math.floor(milliseconds / 60000)).padStart(2, '0')}:${String(Math.floor(milliseconds / 1000) % 60).padStart(2, '0')}.${String(milliseconds % 1000).padStart(3, '0')}`;
}
