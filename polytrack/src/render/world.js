import * as THREE from 'three';
import { createCar } from './car-model.js';
import { createLevel, disposeLevel } from './level.js';
import { sampleGhost } from '../game/ghost.js';

/** Rendering consumes race state; it never advances the simulation. */
export class World {
  constructor(canvas, settings) {
    this.settings = settings;
    this.renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      powerPreference: 'high-performance',
    });
    this.renderer.setPixelRatio(Math.min(devicePixelRatio, 1.75));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.2;
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(62, innerWidth / innerHeight, 0.3, 1800);
    this.scene.add(new THREE.HemisphereLight('#d6edff', '#57715b', 2.3));
    this.sun = new THREE.DirectionalLight('#fff6e8', 2.8);
    this.sun.position.set(-180, 260, 110);
    this.sun.castShadow = true;
    this.sun.shadow.mapSize.set(2048, 2048);
    this.sun.shadow.camera.left = -330;
    this.sun.shadow.camera.right = 330;
    this.sun.shadow.camera.top = 330;
    this.sun.shadow.camera.bottom = -330;
    this.sun.shadow.camera.far = 650;
    this.sun.shadow.normalBias = 0.1;
    this.scene.add(this.sun);
    this.car = createCar(settings.color);
    this.ghost = createCar('#8cdcff', true);
    this.scene.add(this.car.group, this.ghost.group);
    this.basis = new THREE.Matrix4();
    this.yaw = new THREE.Matrix4();
    this.rotation = new THREE.Quaternion();
    this.lookTarget = new THREE.Vector3();
    this.desired = new THREE.Vector3();
    this.cameraReady = false;
    window.addEventListener('resize', () => this.resize());
    this.resize();
  }
  resize() {
    this.renderer.setSize(innerWidth, innerHeight);
    this.camera.aspect = innerWidth / innerHeight;
    this.camera.updateProjectionMatrix();
  }
  load(track) {
    if (this.level) {
      this.scene.remove(this.level.group);
      disposeLevel(this.level.group);
    }
    this.track = track;
    this.level = createLevel(track);
    this.scene.add(this.level.group);
    this.scene.background = new THREE.Color(this.level.theme.sky);
    this.scene.fog = new THREE.Fog(this.level.theme.fog, 240, 1150);
    this.sun.color.set(this.level.theme.light);
    this.cameraReady = false;
  }
  applySettings() {
    this.car.body.color.set(this.settings.color);
    this.renderer.setPixelRatio(
      this.settings.quality === 'low' ? 1 : Math.min(devicePixelRatio, 1.75),
    );
    this.renderer.shadowMap.enabled = this.settings.quality !== 'low';
  }
  place(model, pose) {
    model.group.position.copy(pose.position);
    this.basis.makeBasis(pose.right, pose.normal, pose.forward);
    this.yaw.makeRotationY(pose.yaw);
    this.basis.multiply(this.yaw);
    model.group.quaternion.setFromRotationMatrix(this.basis);
  }
  render(race, record, menu, dt, time) {
    const pose = race.car.pose();
    this.place(this.car, pose);
    for (const [index, wheel] of this.car.wheels.entries()) {
      wheel.rotation.x -= (race.car.speed * dt) / 0.46;
      if (index % 2) wheel.rotation.y = race.car.steering * 0.35;
    }
    const ghost =
      !menu && this.settings.ghost && record && sampleGhost(record.frames, race.elapsed);
    this.ghost.group.visible = Boolean(ghost && race.mode !== 'ready');
    if (ghost) {
      const sample = this.track.sample(ghost.distance),
        position = sample.point.clone().addScaledVector(sample.right, ghost.offset);
      position.y += ghost.airHeight + 0.15;
      this.place(this.ghost, { ...sample, position, yaw: ghost.heading });
    }
    this.level.gates.forEach((gate, index) =>
      gate.material.color.set(index < race.checkpoint ? '#c9ff37' : '#52bded'),
    );
    const forward = pose.forward.clone().applyAxisAngle(pose.normal, pose.yaw);
    if (menu) {
      this.desired
        .copy(pose.position)
        .addScaledVector(pose.forward, -13)
        .addScaledVector(pose.right, 9 + Math.sin(time * 0.15) * 2);
      this.desired.y += 7;
      this.lookTarget.copy(pose.position).addScaledVector(pose.forward, 16);
      this.lookTarget.y += 1;
    } else if (this.settings.camera === 'hood') {
      this.desired.copy(pose.position).addScaledVector(forward, 0.8);
      this.desired.y += 1.45;
      this.lookTarget.copy(pose.position).addScaledVector(forward, 35);
      this.lookTarget.y += 1.3;
    } else {
      this.desired
        .copy(pose.position)
        .addScaledVector(forward, -5.1 - Math.abs(race.car.speed) * 0.008);
      this.desired.y += 2.65;
      this.lookTarget.copy(pose.position).addScaledVector(forward, 14);
      this.lookTarget.y += 1.1;
    }
    if (!this.cameraReady) {
      this.camera.position.copy(this.desired);
      this.cameraReady = true;
    }
    this.camera.position.lerp(this.desired, 1 - Math.exp(-dt * (menu ? 2 : 35)));
    this.camera.lookAt(this.lookTarget);
    const fov =
      this.settings.camera === 'hood' && !menu
        ? 75
        : 62 + Math.min(12, Math.abs(race.car.speed) * 0.12);
    if (Math.abs(this.camera.fov - fov) > 0.05) {
      this.camera.fov = fov;
      this.camera.updateProjectionMatrix();
    }
    this.renderer.render(this.scene, this.camera);
  }
}
