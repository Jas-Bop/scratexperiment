import { lerp, wrapAngle } from './math.js';

/** Interpolate saved road-relative samples without running a second physics simulation. */
export function sampleGhost(frames, time) {
  if (!frames?.length || time > frames.at(-1)[0]) return null;
  let low = 0,
    high = frames.length - 1;
  while (low < high) {
    const middle = Math.floor((low + high) / 2);
    if (frames[middle][0] < time) low = middle + 1;
    else high = middle;
  }
  const b = frames[low],
    a = frames[Math.max(0, low - 1)];
  const blend = b[0] === a[0] ? 0 : Math.max(0, Math.min(1, (time - a[0]) / (b[0] - a[0])));
  return {
    distance: lerp(a[1], b[1], blend),
    offset: lerp(a[2], b[2], blend),
    heading: a[3] + wrapAngle(b[3] - a[3]) * blend,
    airHeight: lerp(a[4], b[4], blend),
  };
}
