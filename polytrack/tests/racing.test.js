import test from 'node:test';
import assert from 'node:assert/strict';
import { BUILTIN_TRACKS, Track, validateTrack } from '../src/tracks/track.js';
import { Car } from '../src/game/car.js';
import { Race } from '../src/game/race.js';
import { PHYSICS } from '../src/game/config.js';
import { sampleGhost } from '../src/game/ghost.js';
import { formatTime } from '../src/game/math.js';

const forward = { throttle: 1, steer: 0, brake: false };
const neutral = { throttle: 0, steer: 0, brake: false };

test('all supplied circuits have finite, closed road frames', () => {
  for (const definition of BUILTIN_TRACKS) {
    const track = new Track(definition);
    assert.ok(track.length > 700);
    assert.ok(track.sample(0).point.distanceTo(track.sample(track.length).point) < 0.001);
    for (let fraction = 0; fraction < 1; fraction += 0.01) {
      const pose = track.sample(track.length * fraction);
      assert.ok(pose.point.toArray().every(Number.isFinite));
      assert.ok(Math.abs(pose.forward.dot(pose.right)) < 0.0001);
      assert.ok(pose.normal.y > 0);
    }
  }
});

test('accelerating, steering, and braking change actual car state', () => {
  const car = new Car(new Track(BUILTIN_TRACKS[0]));
  for (let i = 0; i < 120; i++) car.update(forward, PHYSICS.step);
  assert.ok(car.speed > 15);
  assert.ok(car.distance > 5);
  const previous = car.speed;
  const reference = new Car(car.track);
  Object.assign(reference, car);
  for (let i = 0; i < 30; i++) {
    car.update({ ...neutral, steer: 1 }, PHYSICS.step);
    reference.update(neutral, PHYSICS.step);
  }
  assert.ok(car.offset > reference.offset);
  for (let i = 0; i < 30; i++) car.update({ ...neutral, throttle: -1 }, PHYSICS.step);
  assert.ok(car.speed < previous);
});

test('a finish requires ordered checkpoints; pause and restart reset correctly', () => {
  const race = new Race(new Track(BUILTIN_TRACKS[0]));
  race.update(forward, 0.01);
  race.pause();
  const time = race.elapsed;
  race.update(forward, 1);
  assert.equal(race.elapsed, time);
  race.resume();
  race.car.distance = race.track.length - 0.05;
  race.car.speed = 10;
  race.update(neutral, 0.01);
  assert.notEqual(race.mode, 'finished');
  race.restart();
  assert.equal(race.elapsed, 0);
  assert.equal(race.checkpoint, 0);
  assert.equal(race.mode, 'ready');
  race.update(forward, 0.01);
  for (const checkpoint of race.track.checkpoints) {
    race.car.distance = checkpoint - 0.05;
    race.car.speed = 10;
    race.car.heading = 0;
    race.update(neutral, 0.01);
  }
  assert.equal(race.checkpoint, race.track.checkpoints.length);
  race.car.distance = race.track.length - 0.05;
  race.car.speed = 10;
  race.update(neutral, 0.01);
  assert.equal(race.mode, 'finished');
});

test('falling respawns at the last checkpoint while the clock continues', () => {
  const race = new Race(new Track(BUILTIN_TRACKS[2]));
  race.update(forward, 0.01);
  race.checkpoint = 1;
  race.car.offset = 100;
  race.car.update(neutral, 0.01);
  assert.equal(race.car.falling, true);
  const before = race.elapsed;
  for (let i = 0; i < 200; i++) race.update(neutral, PHYSICS.step);
  assert.ok(race.elapsed > before);
  assert.equal(race.car.falling, false);
  assert.equal(race.respawns, 1);
  assert.ok(Math.abs(race.car.distance - race.track.checkpoints[0]) < 2);
});

test('ghost interpolation handles heading wrap and replay completion', () => {
  const frames = [
    [0, 0, 0, 3.1, 0],
    [1, 20, 2, -3.1, 1],
  ];
  const pose = sampleGhost(frames, 0.5);
  assert.equal(pose.distance, 10);
  assert.equal(pose.offset, 1);
  assert.ok(Math.abs(pose.heading) > 3);
  assert.equal(sampleGhost(frames, 2), null);
  assert.equal(sampleGhost([], 0), null);
});

test('custom track validation rejects malformed imports', () => {
  const copy = structuredClone(BUILTIN_TRACKS[0]);
  copy.points[0][0] = NaN;
  assert.throws(() => validateTrack(copy), /finite/);
  const invalid = structuredClone(BUILTIN_TRACKS[0]);
  invalid.checkpoints = [0.7, 0.2];
  assert.throws(() => validateTrack(invalid), /ordered/);
  const tooClose = structuredClone(BUILTIN_TRACKS[0]);
  tooClose.points[1] = [...tooClose.points[0]];
  assert.throws(() => validateTrack(tooClose), /8 m/);
});

test('race clock formats minutes and milliseconds', () => {
  assert.equal(formatTime(61.234), '01:01.234');
  assert.equal(formatTime(Infinity), '—');
  assert.equal(formatTime(0), '00:00.000');
});

test('every original circuit can be completed through driving inputs without a reset', () => {
  // Test-only feedback driver follows the centreline using the same throttle/steering API as players.
  for (const definition of BUILTIN_TRACKS) {
    const track = new Track(definition),
      race = new Race(track);
    for (let tick = 0; tick < 120 * 120 && race.mode !== 'finished'; tick++) {
      const car = race.car,
        speed = Math.max(5, car.speed);
      const delta = track.sample(car.distance + 3).heading - track.sample(car.distance).heading;
      const curvature = Math.atan2(Math.sin(delta), Math.cos(delta)) / 3;
      const target = Math.max(
        20,
        Math.min(68, Math.sqrt(7 / Math.max(0.001, Math.abs(curvature)))),
      );
      const correction =
        (curvature * speed) / ((PHYSICS.steeringRate * speed) / (speed + 12)) -
        car.heading * 3 -
        car.offset * 0.06;
      race.update(
        {
          throttle: car.speed > target ? -1 : 1,
          steer: Math.max(-1, Math.min(1, correction)),
          brake: false,
        },
        PHYSICS.step,
      );
    }
    assert.equal(race.mode, 'finished', definition.name);
    assert.equal(race.checkpoint, track.checkpoints.length);
    assert.equal(race.respawns, 0);
    assert.ok(race.recording.length > 100);
  }
});
