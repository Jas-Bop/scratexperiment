import { CatmullRomCurve3, Vector3 } from 'three';
import { createCustomTrack, validateTrack, Track } from '../tracks/track.js';

/** A bounded, JSON-based spline editor. It has no dependency on race or renderer internals. */
export class TrackEditor {
  constructor(root, callbacks) {
    this.root = root;
    this.callbacks = callbacks;
    this.canvas = root.querySelector('#editor-canvas');
    this.ctx = this.canvas.getContext('2d');
    this.history = [];
    this.selected = 0;
    this.zoom = 1;
    this.bind();
    new ResizeObserver(() => {
      if (!this.root.hidden) this.draw();
    }).observe(this.canvas);
  }
  open(template) {
    this.draft = template.id.startsWith('custom-')
      ? structuredClone(template)
      : createCustomTrack(template);
    this.history = [];
    this.selected = 0;
    this.zoom = 1;
    this.root.hidden = false;
    this.sync();
    requestAnimationFrame(() => {
      this.fit();
      this.draw();
    });
  }
  close() {
    this.root.hidden = true;
    this.dragging = false;
  }
  snapshot() {
    this.history.push(structuredClone(this.draft));
    if (this.history.length > 40) this.history.shift();
  }
  sync() {
    this.root.querySelector('#track-name').value = this.draft.name;
    this.root.querySelector('#track-environment').value = this.draft.environment;
    this.root.querySelector('#track-width').value = this.draft.width;
    this.root.querySelector('#width-value').textContent = `${this.draft.width} m`;
    this.root.querySelector('#track-barriers').checked = this.draft.barriers;
    this.root.querySelector('#point-height').value = this.draft.points[this.selected][1];
    this.root.querySelector('#height-value').textContent =
      `${this.draft.points[this.selected][1]} m`;
    this.root.querySelector('#point-number').textContent = String(this.selected + 1).padStart(
      2,
      '0',
    );
    this.root.querySelector('#point-delete').disabled = this.draft.points.length <= 4;
    this.root.querySelector('#editor-undo').disabled = !this.history.length;
  }
  fit() {
    const xs = this.draft.points.map((p) => p[0]),
      zs = this.draft.points.map((p) => p[2]);
    this.center = {
      x: (Math.min(...xs) + Math.max(...xs)) / 2,
      z: (Math.min(...zs) + Math.max(...zs)) / 2,
    };
    this.extent = {
      x: Math.max(...xs) - Math.min(...xs) + 110,
      z: Math.max(...zs) - Math.min(...zs) + 110,
    };
    this.zoom = 1;
    this.draw();
  }
  projection() {
    const rect = this.canvas.getBoundingClientRect();
    const scale = Math.min(rect.width / this.extent.x, rect.height / this.extent.z) * this.zoom;
    return {
      width: rect.width,
      height: rect.height,
      scale,
      toScreen: (p) => [
        (p[0] - this.center.x) * scale + rect.width / 2,
        (p[2] - this.center.z) * scale + rect.height / 2,
      ],
      toWorld: (x, y) => [
        (x - rect.width / 2) / scale + this.center.x,
        (y - rect.height / 2) / scale + this.center.z,
      ],
    };
  }
  draw() {
    if (!this.draft || !this.extent) return;
    const projection = this.projection(),
      { width, height, scale, toScreen } = projection;
    if (!width || !height) return;
    const ratio = Math.min(devicePixelRatio, 2);
    this.canvas.width = width * ratio;
    this.canvas.height = height * ratio;
    const ctx = this.ctx;
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    ctx.clearRect(0, 0, width, height);
    ctx.strokeStyle = '#6683a025';
    ctx.lineWidth = 1;
    const spacing = 25 * scale;
    if (spacing > 7) {
      for (let x = width / 2 - this.center.x * scale; x < width; x += spacing) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }
      for (let x = width / 2 - this.center.x * scale - spacing; x > 0; x -= spacing) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }
      for (let y = height / 2 - this.center.z * scale; y < height; y += spacing) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }
      for (let y = height / 2 - this.center.z * scale - spacing; y > 0; y -= spacing) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }
    }
    const curve = new CatmullRomCurve3(
      this.draft.points.map((p) => new Vector3(...p)),
      true,
      'centripetal',
    );
    ctx.beginPath();
    for (let i = 0; i <= 400; i++) {
      const point = curve.getPoint(i / 400);
      const [x, y] = toScreen([point.x, point.y, point.z]);
      if (i) ctx.lineTo(x, y);
      else ctx.moveTo(x, y);
    }
    ctx.closePath();
    ctx.lineJoin = 'round';
    ctx.strokeStyle = '#647b91';
    ctx.lineWidth = this.draft.width * scale + 3;
    ctx.stroke();
    ctx.strokeStyle = '#9caeba';
    ctx.lineWidth = this.draft.width * scale;
    ctx.stroke();
    ctx.setLineDash([8, 8]);
    ctx.strokeStyle = '#e0ebee88';
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.setLineDash([]);
    for (const [index, point] of this.draft.points.entries()) {
      const [x, y] = toScreen(point);
      ctx.beginPath();
      ctx.arc(x, y, index === this.selected ? 12 : 9, 0, Math.PI * 2);
      ctx.fillStyle = index === this.selected ? '#c9ff37' : index === 0 ? '#59c5f0' : '#1b304a';
      ctx.fill();
      ctx.strokeStyle = '#d3e9ef';
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.fillStyle = index === this.selected ? '#14223b' : '#fff';
      ctx.font = 'bold 9px monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(index + 1, x, y);
    }
  }
  status(message, error = false) {
    const element = this.root.querySelector('#editor-status');
    element.textContent = message;
    element.style.color = error ? '#ffad91' : '#b4c8db';
  }
  check() {
    try {
      validateTrack(this.draft);
      return true;
    } catch (error) {
      this.status(error.message, true);
      return false;
    }
  }
  addPoint(world) {
    if (this.draft.points.length >= 80) {
      this.status('80 points is the maximum.', true);
      return;
    }
    this.snapshot();
    const a = this.draft.points[this.selected],
      b = this.draft.points[(this.selected + 1) % this.draft.points.length];
    const point = world
      ? [world[0], a[1], world[1]]
      : [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2];
    this.draft.points.splice(this.selected + 1, 0, point);
    this.selected++;
    this.sync();
    this.draw();
    this.status('Point added. Drag to adjust its position.');
  }
  bind() {
    const on = (id, event, handler) =>
      this.root.querySelector(`#${id}`).addEventListener(event, handler);
    on('editor-back', 'click', () => this.callbacks.onClose());
    on('editor-test', 'click', () => {
      if (this.check()) {
        this.draft.goldTime = new Track(this.draft).length / 40;
        this.draft.silverTime = this.draft.goldTime * 1.3;
        this.draft.bronzeTime = this.draft.goldTime * 1.7;
        this.callbacks.onTest(structuredClone(this.draft));
      }
    });
    on('editor-save', 'click', () => {
      if (this.check()) {
        this.callbacks.onSave(structuredClone(this.draft));
        this.status('Saved in this browser. Ready to race.');
      }
    });
    on('track-name', 'change', (event) => {
      this.snapshot();
      this.draft.name = event.target.value;
      this.sync();
    });
    on('track-environment', 'change', (event) => {
      this.snapshot();
      this.draft.environment = event.target.value;
      this.sync();
    });
    on('track-width', 'input', (event) => {
      this.snapshot();
      this.draft.width = Number(event.target.value);
      this.sync();
      this.draw();
    });
    on('track-barriers', 'change', (event) => {
      this.snapshot();
      this.draft.barriers = event.target.checked;
      this.sync();
    });
    on('point-height', 'input', (event) => {
      this.snapshot();
      this.draft.points[this.selected][1] = Number(event.target.value);
      this.sync();
      this.draw();
    });
    on('point-add', 'click', () => this.addPoint());
    on('point-delete', 'click', () => {
      if (this.draft.points.length <= 4) return;
      this.snapshot();
      this.draft.points.splice(this.selected, 1);
      this.selected = Math.min(this.selected, this.draft.points.length - 1);
      this.sync();
      this.draw();
    });
    on('editor-undo', 'click', () => {
      if (this.history.length) {
        this.draft = this.history.pop();
        this.selected = Math.min(this.selected, this.draft.points.length - 1);
        this.sync();
        this.draw();
      }
    });
    on('editor-fit', 'click', () => this.fit());
    on('editor-zoom-in', 'click', () => {
      this.zoom = Math.min(4, this.zoom * 1.2);
      this.draw();
    });
    on('editor-zoom-out', 'click', () => {
      this.zoom = Math.max(0.3, this.zoom / 1.2);
      this.draw();
    });
    on('editor-export', 'click', () => {
      if (!this.check()) return;
      const data = { format: 'polytrack-local', version: 1, track: this.draft };
      const url = URL.createObjectURL(
        new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }),
      );
      const link = document.createElement('a');
      link.href = url;
      link.download = `${this.draft.name.toLowerCase().replace(/[^a-z0-9]+/g, '-') || 'circuit'}.json`;
      link.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      this.status('Circuit exported. Share the JSON file with a friend.');
    });
    on('editor-import', 'click', () => this.root.querySelector('#import-file').click());
    on('import-file', 'change', async (event) => {
      try {
        const file = event.target.files[0];
        if (!file) return;
        if (file.size > 128000) throw new Error('Track files must be smaller than 128 KB.');
        const data = JSON.parse(await file.text());
        if (data.format !== 'polytrack-local' || data.version !== 1)
          throw new Error('Choose a circuit exported by this editor.');
        validateTrack(data.track);
        this.snapshot();
        this.draft = structuredClone(data.track);
        if (!this.draft.id.startsWith('custom-'))
          this.draft.id = `custom-${Date.now().toString(36)}`;
        this.selected = 0;
        this.sync();
        this.fit();
        this.status('Circuit imported. Save it to add it to your garage.');
      } catch (error) {
        this.status(error.message, true);
      } finally {
        event.target.value = '';
      }
    });
    this.canvas.addEventListener('pointerdown', (event) => {
      const rect = this.canvas.getBoundingClientRect(),
        x = event.clientX - rect.left,
        y = event.clientY - rect.top,
        projection = this.projection();
      if (event.shiftKey) {
        this.addPoint(projection.toWorld(x, y));
        return;
      }
      const index = this.draft.points.findIndex((point) => {
        const [px, py] = projection.toScreen(point);
        return Math.hypot(x - px, y - py) < 18;
      });
      if (index < 0) return;
      this.snapshot();
      this.selected = index;
      this.dragging = true;
      this.canvas.setPointerCapture(event.pointerId);
      this.sync();
      this.draw();
    });
    this.canvas.addEventListener('pointermove', (event) => {
      if (!this.dragging) return;
      const rect = this.canvas.getBoundingClientRect();
      const [x, z] = this.projection().toWorld(event.clientX - rect.left, event.clientY - rect.top);
      this.draft.points[this.selected][0] = Math.round(Math.max(-1400, Math.min(1400, x)));
      this.draft.points[this.selected][2] = Math.round(Math.max(-1400, Math.min(1400, z)));
      this.draw();
    });
    for (const name of ['pointerup', 'pointercancel', 'lostpointercapture'])
      this.canvas.addEventListener(name, () => {
        this.dragging = false;
        this.check();
      });
    this.canvas.addEventListener(
      'wheel',
      (event) => {
        event.preventDefault();
        this.zoom = Math.max(0.3, Math.min(4, this.zoom * Math.exp(-event.deltaY * 0.001)));
        this.draw();
      },
      { passive: false },
    );
  }
}
