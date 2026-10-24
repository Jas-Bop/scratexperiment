import { CatmullRomCurve3, Vector3 } from 'three';
import { ALPINE } from './alpine.js';
import { CANYON } from './canyon.js';
import { SKYLINE } from './skyline.js';

export const BUILTIN_TRACKS = [ALPINE, CANYON, SKYLINE];
const UP = new Vector3(0, 1, 0);

/** The road centreline is shared by physics, meshes, minimaps, ghosts, and the editor. */
export class Track {
  constructor(definition) {
    this.definition = validateTrack(definition);
    this.curve = new CatmullRomCurve3(
      definition.points.map((point) => new Vector3(...point)),
      true,
      'centripetal',
    );
    this.curve.arcLengthDivisions = 1600;
    this.length = this.curve.getLength();
    this.width = definition.width;
    this.checkpoints = definition.checkpoints.map((fraction) => fraction * this.length);
  }

  sample(distance) {
    const fraction = (((distance / this.length) % 1) + 1) % 1;
    const point = this.curve.getPointAt(fraction);
    const forward = this.curve.getTangentAt(fraction).normalize();
    const right = UP.clone().cross(forward).normalize();
    const normal = forward.clone().cross(right).normalize();
    return { point, forward, right, normal, heading: Math.atan2(forward.x, forward.z), fraction };
  }

  isBoost(distance) {
    const fraction = (((distance / this.length) % 1) + 1) % 1;
    return this.definition.boosts.some(([start, end]) => fraction >= start && fraction <= end);
  }
}

/** Validate custom imports before constructing geometry or changing saved tracks. */
export function validateTrack(input) {
  if (!input || typeof input !== 'object') throw new Error('Choose a valid track file.');
  if (typeof input.name !== 'string' || !input.name.trim() || input.name.length > 40)
    throw new Error('Track names need 1–40 characters.');
  if (typeof input.id !== 'string' || !/^[a-z0-9-]{1,70}$/.test(input.id))
    throw new Error('Invalid track ID.');
  if (!Array.isArray(input.points) || input.points.length < 4 || input.points.length > 80)
    throw new Error('A track needs 4–80 control points.');
  for (const point of input.points) {
    if (
      !Array.isArray(point) ||
      point.length !== 3 ||
      !point.every(Number.isFinite) ||
      point.some((value) => Math.abs(value) > 1500) ||
      point[1] < 2
    )
      throw new Error('Track points must be finite, with elevation at least 2 m.');
  }
  for (let i = 0; i < input.points.length; i++) {
    const a = input.points[i],
      b = input.points[(i + 1) % input.points.length];
    if (Math.hypot(a[0] - b[0], a[2] - b[2]) < 8)
      throw new Error('Keep neighbouring points at least 8 m apart.');
  }
  if (!Number.isFinite(input.width) || input.width < 10 || input.width > 26)
    throw new Error('Road width must be 10–26 m.');
  if (!['alpine', 'desert', 'night'].includes(input.environment))
    throw new Error('Unknown environment.');
  if (
    !Array.isArray(input.checkpoints) ||
    input.checkpoints.length < 1 ||
    input.checkpoints.length > 8 ||
    input.checkpoints.some(
      (value, index) =>
        !Number.isFinite(value) ||
        value <= 0 ||
        value >= 1 ||
        (index && value <= input.checkpoints[index - 1]),
    )
  )
    throw new Error('Checkpoints must be ordered between start and finish.');
  if (
    !Array.isArray(input.boosts) ||
    input.boosts.length > 12 ||
    input.boosts.some(
      (zone) =>
        !Array.isArray(zone) ||
        zone.length !== 2 ||
        !zone.every(Number.isFinite) ||
        zone[0] < 0 ||
        zone[1] > 1 ||
        zone[0] >= zone[1],
    )
  )
    throw new Error('Invalid boost zones.');
  if (
    !Array.isArray(input.jumps) ||
    input.jumps.length > 12 ||
    input.jumps.some(
      (jump) =>
        !Number.isFinite(jump.at) ||
        jump.at <= 0 ||
        jump.at >= 1 ||
        !Number.isFinite(jump.velocity) ||
        jump.velocity < 1 ||
        jump.velocity > 20,
    )
  )
    throw new Error('Invalid jump settings.');
  return input;
}

export function createCustomTrack(template = ALPINE) {
  const copy = structuredClone(template);
  return {
    ...copy,
    id: `custom-${Date.now().toString(36)}`,
    name: 'My first circuit',
    subtitle: 'Built by you.',
    difficulty: 'CUSTOM / LOCAL',
  };
}
