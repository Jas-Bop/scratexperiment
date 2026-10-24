import { PHYSICS } from './config.js';
import { clamp, damp, wrapAngle } from './math.js';

/** Road-relative arcade physics. Steering cancels road curvature, so corners need real input. */
export class Car {
  constructor(track) {
    this.track = track;
    this.reset();
  }

  reset(distance = 0) {
    Object.assign(this, {
      distance,
      offset: 0,
      speed: 0,
      heading: 0,
      steering: 0,
      airHeight: 0,
      verticalSpeed: 0,
      falling: false,
      fallTime: 0,
      boost: false,
      wallHit: false,
    });
    this.lastJump = -1;
  }

  update(input, dt) {
    this.wallHit = false;
    if (this.falling) {
      this.fallTime += dt;
      this.verticalSpeed -= PHYSICS.gravity * dt;
      this.airHeight += this.verticalSpeed * dt;
      this.distance += Math.cos(this.heading) * this.speed * dt;
      this.offset += Math.sin(this.heading) * this.speed * dt;
      return;
    }
    this.steering = damp(this.steering, input.steer, PHYSICS.steeringResponse, dt);
    this.boost = this.track.isBoost(this.distance) && this.airHeight < 0.6;
    const throttle = clamp(input.throttle, -1, 1);
    const acceleration = throttle >= 0 ? throttle * PHYSICS.acceleration : -PHYSICS.braking;
    const resistance =
      Math.sign(this.speed) * (PHYSICS.rollingResistance + this.speed ** 2 * PHYSICS.drag);
    this.speed +=
      (acceleration - resistance + (this.boost && throttle > 0 ? PHYSICS.boostAcceleration : 0)) *
      dt;
    if (input.brake) this.speed = damp(this.speed, 0, 1.4, dt);
    if (Math.abs(this.speed) < 0.08 && !throttle) this.speed = 0;
    this.speed = clamp(
      this.speed,
      -PHYSICS.reverseSpeed,
      this.boost ? PHYSICS.boostMaxSpeed : PHYSICS.maxSpeed,
    );

    const before = this.track.sample(this.distance);
    const grip = input.brake ? 1.55 : 1;
    this.heading +=
      this.steering * PHYSICS.steeringRate * grip * (this.speed / (Math.abs(this.speed) + 12)) * dt;
    this.distance += Math.cos(this.heading) * this.speed * dt;
    this.offset += Math.sin(this.heading) * this.speed * dt;
    const after = this.track.sample(this.distance);
    this.heading = wrapAngle(this.heading - wrapAngle(after.heading - before.heading));

    for (const [index, jump] of this.track.definition.jumps.entries()) {
      const at = jump.at * this.track.length;
      if (
        this.lastJump !== index &&
        this.distance >= at &&
        this.distance - at < Math.max(2, this.speed * dt * 2) &&
        this.speed > 22
      ) {
        this.verticalSpeed = jump.velocity;
        this.airHeight = 0.02;
        this.lastJump = index;
      }
    }
    if (this.airHeight > 0 || this.verticalSpeed > 0) {
      this.verticalSpeed -= PHYSICS.gravity * dt;
      this.airHeight += this.verticalSpeed * dt;
      if (this.airHeight < 0) {
        this.airHeight = 0;
        this.verticalSpeed = 0;
      }
    }
    const edge = this.track.width / 2 - 1.05;
    if (Math.abs(this.offset) > edge) {
      if (this.track.definition.barriers && this.airHeight < 1) {
        this.offset = clamp(this.offset, -edge, edge);
        this.speed *= 0.88;
        this.heading = -Math.sign(this.offset) * 0.12;
        this.wallHit = true;
      } else if (Math.abs(this.offset) > this.track.width / 2 + 0.5) {
        this.falling = true;
        this.verticalSpeed = Math.min(0, this.verticalSpeed);
      }
    }
  }

  pose() {
    const sample = this.track.sample(this.distance);
    const position = sample.point.clone().addScaledVector(sample.right, this.offset);
    position.y += this.airHeight + 0.15;
    return { ...sample, position, yaw: this.heading };
  }
}
