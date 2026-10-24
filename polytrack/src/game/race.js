import { Car } from './car.js';
import { PHYSICS } from './config.js';

/** Race state is independent of the DOM and renderer, making checkpoint logic testable. */
export class Race extends EventTarget {
  constructor(track) {
    super();
    this.track = track;
    this.car = new Car(track);
    this.restart();
  }
  restart() {
    this.car.reset();
    this.mode = 'ready';
    this.elapsed = 0;
    this.checkpoint = 0;
    this.recording = [];
    this.recordTimer = 0;
    this.respawns = 0;
    this.dispatchEvent(new Event('restart'));
  }
  update(input, dt) {
    if (this.mode === 'ready' && input.throttle > 0) {
      this.mode = 'running';
      this.dispatchEvent(new Event('start'));
    }
    if (this.mode !== 'running') return;
    this.elapsed += dt;
    const previousDistance = this.car.distance;
    this.car.update(input, dt);
    if (this.car.falling && this.car.fallTime >= PHYSICS.fallResetSeconds) {
      this.respawn();
      return;
    }
    const next = this.track.checkpoints[this.checkpoint];
    if (
      !this.car.falling &&
      next !== undefined &&
      previousDistance < next &&
      this.car.distance >= next
    ) {
      this.checkpoint++;
      this.dispatchEvent(new Event('checkpoint'));
    }
    this.recordTimer += dt;
    if (this.recordTimer >= 0.05 && this.recording.length < 12000) {
      this.recording.push([
        this.elapsed,
        this.car.distance,
        this.car.offset,
        this.car.heading,
        this.car.airHeight,
      ]);
      this.recordTimer = 0;
    }
    if (
      !this.car.falling &&
      this.car.distance >= this.track.length &&
      this.checkpoint === this.track.checkpoints.length
    ) {
      this.mode = 'finished';
      this.dispatchEvent(new Event('finish'));
    }
  }
  respawn() {
    const distance = this.checkpoint ? this.track.checkpoints[this.checkpoint - 1] + 0.5 : 0;
    this.car.reset(distance);
    this.respawns++;
    this.dispatchEvent(new Event('respawn'));
  }
  pause() {
    if (['running', 'ready'].includes(this.mode)) {
      this.previousMode = this.mode;
      this.mode = 'paused';
    }
  }
  resume() {
    if (this.mode === 'paused') this.mode = this.previousMode;
  }
}
