import * as THREE from 'three';

/** Procedural open-wheel car: editable geometry, no copied game models. */
export function createCar(color, ghost = false) {
  const group = new THREE.Group();
  const material = (shade) =>
    new THREE.MeshStandardMaterial({
      color: shade,
      roughness: 0.65,
      metalness: 0.12,
      transparent: ghost,
      opacity: ghost ? 0.28 : 1,
      depthWrite: !ghost,
    });
  const body = material(color),
    white = material('#f5f8fb'),
    dark = material(ghost ? '#81deff' : '#17222d');
  const rubber = material(ghost ? '#81deff' : '#10151c'),
    metal = material('#aebdcc');
  function box(size, position, surface = body) {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(...size), surface);
    mesh.position.set(...position);
    mesh.castShadow = !ghost;
    group.add(mesh);
    return mesh;
  }
  box([1.1, 0.42, 3.35], [0, 0.65, 0]);
  box([0.52, 0.29, 2], [0, 0.74, 0.9]);
  box([1.55, 0.42, 1.25], [0, 0.8, -0.95]);
  box([1.65, 0.18, 0.7], [0, 0.38, -1.1]);
  box([2.25, 0.1, 0.55], [0, 0.34, 1.96]);
  box([2.12, 0.12, 0.58], [0, 1.14, -1.75]);
  box([0.1, 0.62, 0.12], [-0.72, 0.82, -1.75], dark);
  box([0.1, 0.62, 0.12], [0.72, 0.82, -1.75], dark);
  box([0.14, 0.025, 1.8], [0, 0.9, 1.05], white);
  box([0.14, 0.025, 1.1], [0, 1.02, -1.13], white);
  const cockpit = new THREE.Mesh(new THREE.SphereGeometry(0.5, 8, 5), dark);
  cockpit.scale.set(0.9, 0.48, 1.35);
  cockpit.position.set(0, 1.01, -0.1);
  group.add(cockpit);
  const helmet = new THREE.Mesh(new THREE.SphereGeometry(0.23, 8, 6), white);
  helmet.position.set(0, 1.21, -0.08);
  group.add(helmet);
  const wheels = [];
  for (const x of [-1.06, 1.06])
    for (const z of [-1.18, 1.22]) {
      const wheel = new THREE.Group();
      wheel.position.set(x, 0.46, z);
      const tire = new THREE.Mesh(new THREE.CylinderGeometry(0.46, 0.46, 0.38, 12), rubber);
      tire.rotation.z = Math.PI / 2;
      tire.castShadow = !ghost;
      wheel.add(tire);
      const rim = new THREE.Mesh(new THREE.CylinderGeometry(0.26, 0.26, 0.39, 8), metal);
      rim.rotation.z = Math.PI / 2;
      wheel.add(rim);
      group.add(wheel);
      wheels.push(wheel);
      box([0.9, 0.065, 0.08], [x * 0.55, 0.45, z], dark);
    }
  return { group, body, wheels };
}
