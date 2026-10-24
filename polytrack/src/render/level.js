import * as THREE from 'three';

export const ENVIRONMENTS = {
  alpine: {
    sky: '#88c9eb',
    fog: '#b4d9e6',
    ground: '#78a77a',
    mountain: '#638769',
    tree: '#345e49',
    light: '#fff9e8',
  },
  desert: {
    sky: '#c8dce1',
    fog: '#e8d0b4',
    ground: '#c7a16e',
    mountain: '#b1875e',
    tree: '#8a7950',
    light: '#fff0cc',
  },
  night: {
    sky: '#182540',
    fog: '#344d70',
    ground: '#2b4655',
    mountain: '#344c65',
    tree: '#2c4850',
    light: '#becfff',
  },
};

function seeded(seed) {
  return () => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed / 4294967296;
  };
}
const rough = (color) => new THREE.MeshStandardMaterial({ color, roughness: 1, flatShading: true });

/** One buffered ribbon per road surface keeps rendering fast and geometry easy to inspect. */
function ribbon(track, profile, colorForSegment, steps = 700) {
  const positions = [],
    colors = [];
  for (let i = 0; i < steps; i++) {
    const a = track.sample((track.length * i) / steps),
      b = track.sample((track.length * (i + 1)) / steps);
    const vertices = [
      a.point
        .clone()
        .addScaledVector(a.right, profile[0][0])
        .addScaledVector(a.normal, profile[0][1]),
      a.point
        .clone()
        .addScaledVector(a.right, profile[1][0])
        .addScaledVector(a.normal, profile[1][1]),
      b.point
        .clone()
        .addScaledVector(b.right, profile[0][0])
        .addScaledVector(b.normal, profile[0][1]),
      b.point
        .clone()
        .addScaledVector(b.right, profile[1][0])
        .addScaledVector(b.normal, profile[1][1]),
    ];
    const color = new THREE.Color(colorForSegment(i / steps, i));
    for (const index of [0, 2, 1, 1, 2, 3]) {
      positions.push(...vertices[index].toArray());
      colors.push(color.r, color.g, color.b);
    }
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
  geometry.computeVertexNormals();
  const mesh = new THREE.Mesh(
    geometry,
    new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.95, side: THREE.DoubleSide }),
  );
  mesh.receiveShadow = true;
  return mesh;
}

function label(text, width = 512, height = 128) {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext('2d');
  context.fillStyle = '#12213a';
  context.fillRect(0, 0, width, height);
  context.fillStyle = '#e8ff78';
  context.font = 'italic 900 54px Arial';
  context.textAlign = 'center';
  context.textBaseline = 'middle';
  context.fillText(text, width / 2, height / 2);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return new THREE.MeshBasicMaterial({ map: texture, side: THREE.DoubleSide });
}

function gate(track, distance, text, finish = false) {
  const group = new THREE.Group(),
    sample = track.sample(distance);
  group.position.copy(sample.point);
  group.rotation.y = sample.heading;
  const surface = rough(finish ? '#e4edee' : '#52bded');
  for (const x of [-track.width / 2 - 0.3, track.width / 2 + 0.3]) {
    const pillar = new THREE.Mesh(new THREE.BoxGeometry(0.6, 6.7, 0.6), surface);
    pillar.position.set(x, 3.35, 0);
    group.add(pillar);
  }
  const beam = new THREE.Mesh(new THREE.BoxGeometry(track.width + 1.2, 0.65, 0.65), surface);
  beam.position.y = 6.7;
  group.add(beam);
  const sign = new THREE.Mesh(new THREE.PlaneGeometry(8, 1.5), label(text));
  sign.position.set(0, 6.75, -0.36);
  sign.rotation.y = Math.PI;
  group.add(sign);
  return { group, material: surface };
}

export function createLevel(track) {
  const group = new THREE.Group(),
    theme = ENVIRONMENTS[track.definition.environment];
  const half = track.width / 2;
  group.add(
    ribbon(
      track,
      [
        [-half, 0],
        [half, 0],
      ],
      (fraction) => (track.isBoost(fraction * track.length) ? '#b6d64d' : '#697786'),
    ),
  );
  for (const side of [-1, 1]) {
    group.add(
      ribbon(
        track,
        [
          [side * (half - 0.6), 0.035],
          [side * half, 0.035],
        ],
        (fraction) => (Math.floor((fraction * track.length) / 3) % 2 ? '#f6f6ea' : '#e2684d'),
      ),
    );
    group.add(
      ribbon(
        track,
        [
          [side * half, -0.8],
          [side * half, 0],
        ],
        () => '#3b4653',
      ),
    );
    if (track.definition.barriers)
      group.add(
        ribbon(
          track,
          [
            [side * (half + 0.05), 0],
            [side * (half + 0.05), 0.85],
          ],
          () => '#25313c',
        ),
      );
  }
  const gates = track.checkpoints.map((distance, index) =>
    gate(track, distance, `CHECKPOINT ${String(index + 1).padStart(2, '0')}`),
  );
  for (const checkpoint of gates) group.add(checkpoint.group);
  group.add(gate(track, 0, 'START / FINISH', true).group);
  const start = track.sample(0),
    startGrid = new THREE.Group();
  startGrid.position.copy(start.point);
  startGrid.rotation.y = start.heading;
  const squares = [rough('#17212c'), rough('#fbfbef')];
  for (let x = 0; x < 16; x++)
    for (let z = 0; z < 2; z++) {
      const square = new THREE.Mesh(
        new THREE.BoxGeometry(track.width / 16, 0.035, 0.8),
        squares[(x + z) % 2],
      );
      square.position.set(-half + ((x + 0.5) * track.width) / 16, 0.035, (z - 0.5) * 0.8);
      startGrid.add(square);
    }
  group.add(startGrid);
  const supportCount = Math.floor(track.length / 42);
  const supports = new THREE.InstancedMesh(
    new THREE.CylinderGeometry(0.9, 1.5, 1, 6),
    rough('#647b83'),
    supportCount,
  );
  const dummy = new THREE.Object3D();
  for (let i = 0; i < supportCount; i++) {
    const point = track.sample((track.length * i) / supportCount).point;
    dummy.position.set(point.x, point.y / 2, point.z);
    dummy.scale.set(1, point.y, 1);
    dummy.updateMatrix();
    supports.setMatrixAt(i, dummy.matrix);
  }
  group.add(supports);
  const ground = new THREE.Mesh(new THREE.CircleGeometry(1700, 64), rough(theme.ground));
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  group.add(ground);
  const random = seeded(7231),
    mountainCount = 65;
  const mountains = new THREE.InstancedMesh(
    new THREE.ConeGeometry(1, 1, 5),
    rough(theme.mountain),
    mountainCount,
  );
  for (let i = 0; i < mountainCount; i++) {
    const angle = (i / mountainCount) * Math.PI * 2,
      radius = 450 + random() * 500;
    const height = 35 + random() * 170,
      width = 45 + random() * 110;
    dummy.position.set(
      100 + Math.cos(angle) * radius,
      height / 2 - 1,
      -30 + Math.sin(angle) * radius,
    );
    dummy.scale.set(width, height, width);
    dummy.rotation.set(0, random() * 6, 0);
    dummy.updateMatrix();
    mountains.setMatrixAt(i, dummy.matrix);
  }
  group.add(mountains);
  const treeCount = theme === ENVIRONMENTS.desert ? 35 : 140;
  const trees = new THREE.InstancedMesh(
    new THREE.ConeGeometry(2.8, 9, 5),
    rough(theme.tree),
    treeCount,
  );
  for (let i = 0; i < treeCount; i++) {
    const sample = track.sample(random() * track.length),
      side = random() > 0.5 ? 1 : -1;
    const position = sample.point
      .clone()
      .addScaledVector(sample.right, side * (half + 14 + random() * 90));
    dummy.position.set(position.x, 4.5, position.z);
    dummy.scale.setScalar(0.7 + random() * 1.5);
    dummy.rotation.set(0, random() * 6, 0);
    dummy.updateMatrix();
    trees.setMatrixAt(i, dummy.matrix);
  }
  group.add(trees);
  return { group, theme, gates };
}

export function disposeLevel(group) {
  const geometries = new Set(),
    materials = new Set(),
    textures = new Set();
  group.traverse((object) => {
    if (object.geometry) geometries.add(object.geometry);
    for (const material of [object.material].flat().filter(Boolean)) {
      materials.add(material);
      if (material.map) textures.add(material.map);
    }
  });
  geometries.forEach((item) => item.dispose());
  materials.forEach((item) => item.dispose());
  textures.forEach((item) => item.dispose());
}
