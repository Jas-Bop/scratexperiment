/** Shared map projection for course thumbnails and the in-race minimap. */
export function mapProjection(track, width, height, padding = 14) {
  const points = Array.from(
    { length: 220 },
    (_, index) => track.sample((track.length * index) / 219).point,
  );
  const minX = Math.min(...points.map((p) => p.x)),
    maxX = Math.max(...points.map((p) => p.x));
  const minZ = Math.min(...points.map((p) => p.z)),
    maxZ = Math.max(...points.map((p) => p.z));
  const scale = Math.min(
    (width - padding * 2) / Math.max(1, maxX - minX),
    (height - padding * 2) / Math.max(1, maxZ - minZ),
  );
  const project = (point) => [
    (point.x - (minX + maxX) / 2) * scale + width / 2,
    (point.z - (minZ + maxZ) / 2) * scale + height / 2,
  ];
  return { points, project };
}

export function trackThumbnail(track) {
  const { points, project } = mapProjection(track, 120, 80, 8);
  const path =
    points
      .map(
        (point, index) =>
          `${index ? 'L' : 'M'}${project(point)
            .map((n) => n.toFixed(1))
            .join(',')}`,
      )
      .join(' ') + ' Z';
  const start = project(track.sample(0).point);
  return `<svg viewBox="0 0 120 80" aria-hidden="true"><path d="${path}" fill="none" stroke="#6d90ab" stroke-width="8" stroke-linecap="round" stroke-linejoin="round" opacity=".22"/><path d="${path}" fill="none" stroke="#d3e4ed" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/><circle cx="${start[0]}" cy="${start[1]}" r="4" fill="#c9ff37" stroke="#15233c" stroke-width="2"/></svg>`;
}

export class Minimap {
  constructor(canvas) {
    this.canvas = canvas;
    this.context = canvas.getContext('2d');
  }
  load(track) {
    this.track = track;
    this.projection = mapProjection(track, this.canvas.width, this.canvas.height, 20);
  }
  draw(race) {
    const ctx = this.context,
      { canvas } = this;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const { points, project } = this.projection;
    ctx.beginPath();
    points.forEach((point, index) => {
      const [x, y] = project(point);
      if (index) ctx.lineTo(x, y);
      else ctx.moveTo(x, y);
    });
    ctx.closePath();
    ctx.lineJoin = 'round';
    ctx.strokeStyle = '#4a6885';
    ctx.lineWidth = 12;
    ctx.stroke();
    ctx.strokeStyle = '#dce6ef';
    ctx.lineWidth = 4;
    ctx.stroke();
    for (const [index, distance] of this.track.checkpoints.entries()) {
      const [x, y] = project(this.track.sample(distance).point);
      ctx.beginPath();
      ctx.arc(x, y, 5, 0, Math.PI * 2);
      ctx.fillStyle = index < race.checkpoint ? '#c9ff37' : '#55baff';
      ctx.fill();
    }
    const [x, y] = project(race.car.pose().position);
    ctx.beginPath();
    ctx.arc(x, y, 7, 0, Math.PI * 2);
    ctx.fillStyle = '#c9ff37';
    ctx.fill();
    ctx.lineWidth = 3;
    ctx.strokeStyle = '#13223b';
    ctx.stroke();
  }
}
