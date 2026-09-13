/** Canvas campus and collision-aware navigation. World units are independent of viewport size. */
export const WORLD_BOUNDS = Object.freeze({ minX: 3, minY: 3, maxX: 97, maxY: 97 });
const BUILDINGS = [
  { id: 'dorm', x: 8, y: 5, w: 20, d: 13, h: 8.3, wall: '#e7debf', side: '#cabe9b', roof: '#aa7660', floors: 3, cols: 7 },
  { id: 'library', x: 61, y: 3, w: 22, d: 13, h: 10, wall: '#e8e3ce', side: '#c4c8b6', roof: '#87978b', floors: 3, cols: 7 },
  { id: 'canteen', x: 72, y: 34, w: 22, d: 15, h: 6.2, wall: '#e8d5ad', side: '#c6b58e', roof: '#b7775a', floors: 2, cols: 7 },
];
const POND = { x: 83, y: 80.5, rx: 12, ry: 8.5 };
const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
const distance = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
const project = (x, y, z = 0) => ({ x: (x - y) * 8, y: (x + y) * 4.2 - z * 8 });

export function isWalkable(x, y) {
  if (!Number.isFinite(x) || !Number.isFinite(y) || x < 3 || x > 97 || y < 3 || y > 97) return false;
  if (BUILDINGS.some((b) => x >= b.x - 0.8 && x <= b.x + b.w + 0.8 && y >= b.y - 0.8 && y <= b.y + b.d + 0.8)) return false;
  return ((x - POND.x) / (POND.rx + 1)) ** 2 + ((y - POND.y) / (POND.ry + 1)) ** 2 > 1;
}

function clearSegment(a, b) {
  if (!isWalkable(a.x, a.y) || !isWalkable(b.x, b.y)) return false;
  const dx = b.x - a.x, dy = b.y - a.y;
  // Slab intersection is exact even when a segment barely touches a building corner.
  for (const building of BUILDINGS) {
    let enter = 0, leave = 1;
    for (const [origin, delta, min, max] of [
      [a.x, dx, building.x - 0.8, building.x + building.w + 0.8],
      [a.y, dy, building.y - 0.8, building.y + building.d + 0.8],
    ]) {
      if (Math.abs(delta) < 1e-12) {
        if (origin < min || origin > max) { enter = 2; break; }
      } else {
        const t1 = (min - origin) / delta, t2 = (max - origin) / delta;
        enter = Math.max(enter, Math.min(t1, t2)); leave = Math.min(leave, Math.max(t1, t2));
      }
    }
    if (enter <= leave) return false;
  }
  // The pond becomes a unit circle after scaling; test the closest point on the segment.
  const ox = (a.x - POND.x) / (POND.rx + 1), oy = (a.y - POND.y) / (POND.ry + 1);
  const vx = dx / (POND.rx + 1), vy = dy / (POND.ry + 1);
  const t = clamp(-(ox * vx + oy * vy) / (vx * vx + vy * vy || 1), 0, 1);
  return (ox + vx * t) ** 2 + (oy + vy * t) ** 2 > 1;
}

function anchor(point) {
  const candidates = [];
  for (let x = Math.max(4, Math.round(point.x / 2) * 2 - 4); x <= Math.min(96, Math.round(point.x / 2) * 2 + 4); x += 2) {
    for (let y = Math.max(4, Math.round(point.y / 2) * 2 - 4); y <= Math.min(96, Math.round(point.y / 2) * 2 + 4); y += 2) {
      const candidate = { x, y };
      if (isWalkable(x, y) && clearSegment(point, candidate)) candidates.push(candidate);
    }
  }
  return candidates.sort((a, b) => distance(a, point) - distance(b, point))[0];
}

/** A* on a two-unit lattice, followed by visibility-safe smoothing. No diagonal corner cutting. */
export function findPath(start, end) {
  if (!start || !end || !isWalkable(start.x, start.y) || !isWalkable(end.x, end.y) || distance(start, end) < 0.02) return [];
  if (clearSegment(start, end)) return [{ x: end.x, y: end.y }];
  const first = anchor(start), last = anchor(end);
  if (!first || !last) return [];
  const key = (p) => `${p.x},${p.y}`;
  const goalKey = key(last), startKey = key(first);
  const open = [{ ...first, f: distance(first, last) }];
  const scores = new Map([[startKey, 0]]), parents = new Map(), closed = new Set();
  const directions = [[2, 0], [-2, 0], [0, 2], [0, -2], [2, 2], [2, -2], [-2, 2], [-2, -2]];
  while (open.length) {
    let bestIndex = 0;
    for (let i = 1; i < open.length; i++) if (open[i].f < open[bestIndex].f) bestIndex = i;
    const current = open.splice(bestIndex, 1)[0], currentKey = key(current);
    if (closed.has(currentKey)) continue;
    if (currentKey === goalKey) {
      const points = [{ x: end.x, y: end.y }];
      let cursor = last;
      while (cursor) { points.unshift({ x: cursor.x, y: cursor.y }); cursor = parents.get(key(cursor)); }
      points.unshift({ x: start.x, y: start.y });
      const result = [];
      let index = 0;
      while (index < points.length - 1) {
        let furthest = index + 1;
        for (let next = points.length - 1; next > index + 1; next--) {
          if (clearSegment(points[index], points[next])) { furthest = next; break; }
        }
        if (distance(points[index], points[furthest]) > 0.01) result.push(points[furthest]);
        index = furthest;
      }
      return result;
    }
    closed.add(currentKey);
    for (const [dx, dy] of directions) {
      const next = { x: current.x + dx, y: current.y + dy }, nextKey = key(next);
      if (closed.has(nextKey) || !isWalkable(next.x, next.y)) continue;
      if (dx && dy && (!isWalkable(current.x + dx, current.y) || !isWalkable(current.x, current.y + dy))) continue;
      if (!clearSegment(current, next)) continue;
      const cost = scores.get(currentKey) + Math.hypot(dx, dy);
      if (cost >= (scores.get(nextKey) ?? Infinity)) continue;
      scores.set(nextKey, cost);
      parents.set(nextKey, current);
      open.push({ ...next, f: cost + distance(next, last) });
    }
  }
  return [];
}

function seeded(seed) {
  return () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };
}
const TREE_SPOTS = [
  [4, 9, 1.0], [5, 24, 0.95], [8, 35, 1.0], [15, 36, 0.92], [32, 8, 1.05], [34, 21, 0.85],
  [43, 11, 1.05], [51, 9, 0.95], [57, 23, 1.0], [89, 7, 1.1], [91, 21, 1.05], [95, 29, 0.95],
  [39, 37, 1.1], [49, 38, 1.15], [40, 48, 1.02], [55, 47, 0.9], [57, 61, 0.85],
  [5, 47, 0.85], [43, 63, 0.9], [43, 77, 1.0], [40, 89, 1.05], [50, 91, 1.1],
  [60, 81, 1.02], [66, 88, 0.9], [70, 69, 0.95], [94, 61, 1.0], [94, 94, 1.08],
  [5, 93, 0.98], [31, 96, 1.0], [57, 96, 0.8], [82, 96, 0.88], [97, 74, 0.88],
];
const BENCHES = [[43, 53], [49, 43], [54, 56], [64, 27], [34, 47], [67, 71], [29, 28]];
const LAMPS = [[17, 27], [34, 31], [51, 28], [66, 23], [65, 48], [80, 58], [37, 57], [45, 84], [21, 94], [68, 91]];

export function createWorldRenderer(canvas) {
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas2D is unavailable.');
  let width = 1, height = 1, pixelRatio = 1, scale = 1, baseScale = 1, initialized = false;
  let camera = project(49, 48), labelRects = [], lastPlayer = { x: 20, y: 27 };
  let elapsed = 0, minute = 920;
  const terrain = canvas.ownerDocument.createElement('canvas');
  terrain.width = 1840; terrain.height = 1060;
  const ground = terrain.getContext('2d');
  ground.translate(920, 80);

  function polygon(context, points, fill, stroke = null, lineWidth = 1) {
    context.beginPath();
    points.forEach((point, index) => {
      const p = project(point[0], point[1], point[2] || 0);
      if (index) context.lineTo(p.x, p.y); else context.moveTo(p.x, p.y);
    });
    context.closePath();
    if (fill) { context.fillStyle = fill; context.fill(); }
    if (stroke) { context.strokeStyle = stroke; context.lineWidth = lineWidth; context.stroke(); }
  }
  function line(context, points, color, lineWidth = 1) {
    context.beginPath();
    points.forEach((point, index) => {
      const p = project(point[0], point[1], point[2] || 0);
      if (index) context.lineTo(p.x, p.y); else context.moveTo(p.x, p.y);
    });
    context.strokeStyle = color; context.lineWidth = lineWidth; context.lineCap = 'round'; context.lineJoin = 'round'; context.stroke();
  }
  function ellipse(context, x, y, rx, ry, fill, stroke = null, z = 0, lineWidth = 1) {
    const points = Array.from({ length: 64 }, (_, i) => [x + Math.cos(i / 64 * Math.PI * 2) * rx, y + Math.sin(i / 64 * Math.PI * 2) * ry, z]);
    polygon(context, points, fill, stroke, lineWidth);
  }
  function road(points, roadWidth = 5) {
    line(ground, points, '#bab9a0', roadWidth * 8 + 4);
    line(ground, points, '#eee7d3', roadWidth * 8);
    line(ground, points, '#f7f0dd', roadWidth * 8 - 6);
    ground.save(); ground.setLineDash([1, 18]);
    line(ground, points, '#d1c8af', roadWidth * 8 - 6); ground.restore();
  }

  function buildTerrain() {
    polygon(ground, [[0, 0, -1.4], [100, 0, -1.4], [100, 100, -1.4], [0, 100, -1.4]], '#c8c9ae', '#b9bda4', 2);
    polygon(ground, [[0, 0], [100, 0], [100, 100], [0, 100]], '#dce0bf', '#bdc5a6', 2);
    const random = seeded(24691);
    for (let i = 0; i < 430; i++) {
      const x = 1 + random() * 98, y = 1 + random() * 98;
      ellipse(ground, x, y, 0.25 + random() * 1.4, 0.3 + random() * 0.7, ['#d5dab9', '#e3e6c9', '#cfd6b0'][Math.floor(random() * 3)]);
    }
    road([[18, 99], [18, 88], [41, 66], [46, 48], [42, 29], [19, 23]], 5.2);
    road([[42, 29], [69, 23], [68, 52], [80, 57], [97, 58]], 5);
    road([[46, 48], [68, 52]], 4.5);
    road([[41, 66], [47, 82], [68, 94], [83, 94]], 3.8);
    road([[18, 46], [35, 46], [46, 48]], 3.4);
    road([[20, 24], [20, 19]], 5);
    road([[69, 23], [69, 16]], 7);
    road([[80, 57], [80, 49]], 6);
    // Training field: the clay oval is walkable, including its infield.
    ellipse(ground, 21.5, 70, 19, 20, '#c3c5aa', '#a7ad93', 0, 2);
    ellipse(ground, 21.5, 70, 18.4, 19.4, '#ba816b');
    for (let lane = 0; lane < 5; lane++) ellipse(ground, 21.5, 70, 17.8 - lane * 1.2, 18.7 - lane * 1.2, null, '#e8c9b1', 0, 1);
    ellipse(ground, 21.5, 70, 11.3, 12.3, '#a6bc92', '#ece7c9', 0, 1.8);
    polygon(ground, [[15, 61], [28, 61], [28, 79], [15, 79]], null, '#e7e6ca', 1.7);
    line(ground, [[15, 70], [28, 70]], '#e7e6ca', 1.4);
    ellipse(ground, 21.5, 70, 3.8, 3.8, null, '#e7e6ca', 0, 1.4);
    polygon(ground, [[18, 61], [25, 61], [25, 64], [18, 64]], null, '#e7e6ca', 1.4);
    polygon(ground, [[18, 76], [25, 76], [25, 79], [18, 79]], null, '#e7e6ca', 1.4);
    line(ground, [[16, 89], [19, 86]], '#ead1b7', 2);
    // A pond is an actual obstacle. Stone edging makes that boundary legible.
    ellipse(ground, POND.x, POND.y, POND.rx + 1, POND.ry + 1, '#c7c8b3', '#b4b9a3', 0, 2);
    ellipse(ground, POND.x, POND.y, POND.rx, POND.ry, '#a8c5bd', '#91b0a7', 0, 1.5);
    for (let i = 0; i < 20; i++) {
      const angle = random() * Math.PI * 2, radius = random() * 0.85;
      const x = POND.x + Math.cos(angle) * POND.rx * radius, y = POND.y + Math.sin(angle) * POND.ry * radius;
      line(ground, [[x, y], [x + 0.9, y - 0.2]], '#d5e1ce', 1.1);
    }
    for (const [x, y] of [[77, 81], [79, 79], [85, 85], [87, 84]]) ellipse(ground, x, y, 0.65, 0.65, '#799f80');
    // Courtyard paving and narrow planting beds.
    polygon(ground, [[34, 36], [54, 36], [58, 55], [39, 60]], '#d4d7b6');
    for (let row = 0; row < 4; row++) line(ground, [[35 + row * 4, 37], [40 + row * 4, 55]], '#c3caa6', 1);
    ellipse(ground, 46, 46, 8, 6.5, '#c0c99f');
    for (const b of BUILDINGS) {
      polygon(ground, [[b.x - 1, b.y - 1], [b.x + b.w + 2, b.y - 1], [b.x + b.w + 2, b.y + b.d + 2], [b.x - 1, b.y + b.d + 2]], '#d7d1b8');
      polygon(ground, [[b.x + 4, b.y + b.d], [b.x + b.w + 8, b.y + b.d + 5], [b.x + b.w + 5, b.y + 3], [b.x + b.w, b.y]], '#b5bca1');
    }
    // Ink hatching and flowers are deterministic and cached once.
    for (let i = 0; i < 270; i++) {
      const x = 2 + random() * 96, y = 2 + random() * 96;
      if (isWalkable(x, y) && !((x - 22) ** 2 / 400 + (y - 70) ** 2 / 441 < 1)) {
        const p = project(x, y);
        ground.strokeStyle = '#a8b98e88'; ground.lineWidth = 0.8;
        ground.beginPath(); ground.moveTo(p.x, p.y); ground.lineTo(p.x - 1, p.y - 2); ground.moveTo(p.x, p.y); ground.lineTo(p.x + 2, p.y - 3); ground.stroke();
      }
    }
    // Side path trim and gate stones.
    polygon(ground, [[8, 95], [27, 95], [27, 98], [8, 98]], '#e3dcc5', '#c4bea7');
  }
  buildTerrain();

  function building(b) {
    const { x, y, w, d, h } = b;
    polygon(ctx, [[x, y + d], [x + w, y + d], [x + w, y + d, h], [x, y + d, h]], b.wall, '#9d9c83', 1.1);
    polygon(ctx, [[x + w, y], [x + w, y + d], [x + w, y + d, h], [x + w, y, h]], b.side, '#989b82', 1.1);
    // A lighter plinth anchors the facade, with floor ledges and inset windows.
    for (let row = 0; row < b.floors; row++) {
      const z = 1 + row * (h - 1) / b.floors;
      line(ctx, [[x, y + d, z - 0.45], [x + w, y + d, z - 0.45]], '#bdb59c', 1.2);
      for (let col = 0; col < b.cols; col++) {
        const wx = x + 1.2 + col * (w - 1.5) / b.cols;
        const ww = b.id === 'library' ? 1.9 : 1.45;
        const wh = b.id === 'library' ? 1.55 : 1.15;
        polygon(ctx, [[wx, y + d + 0.03, z], [wx + ww, y + d + 0.03, z], [wx + ww, y + d + 0.03, z + wh], [wx, y + d + 0.03, z + wh]], minute >= 1110 && (row + col) % 3 ? '#dfbd75' : '#8a9e96', '#b6ad91', 0.9);
        line(ctx, [[wx + ww / 2, y + d + 0.05, z], [wx + ww / 2, y + d + 0.05, z + wh]], '#e1dbc3', 0.65);
        line(ctx, [[wx, y + d + 0.05, z + wh / 2], [wx + ww, y + d + 0.05, z + wh / 2]], '#d4ceb7', 0.65);
        if (b.id === 'dorm' && row && col % 2 === 0) {
          line(ctx, [[wx - 0.25, y + d + 0.5, z - 0.1], [wx + ww + 0.25, y + d + 0.5, z - 0.1]], '#8e9681', 1);
          polygon(ctx, [[wx + 0.25, y + d + 0.5, z - 0.05], [wx + 0.9, y + d + 0.5, z - 0.05], [wx + 0.9, y + d + 0.5, z - 0.85], [wx + 0.25, y + d + 0.5, z - 0.85]], '#ddd5ba');
        }
      }
      for (let col = 0; col < 4; col++) {
        const wy = y + 1.5 + col * (d - 2) / 4;
        polygon(ctx, [[x + w + 0.02, wy, z], [x + w + 0.02, wy + 1.2, z], [x + w + 0.02, wy + 1.2, z + 1.2], [x + w + 0.02, wy, z + 1.2]], '#84968b', '#b5b49b', 0.8);
      }
    }
    // Entrance recess and steps, staying inside the collision footprint.
    const entrance = x + w * 0.52;
    polygon(ctx, [[entrance - 1.9, y + d, 0], [entrance + 1.9, y + d, 0], [entrance + 1.9, y + d, 2.2], [entrance - 1.9, y + d, 2.2]], '#687f76', '#b8b59d', 1);
    line(ctx, [[entrance, y + d + 0.02, 0], [entrance, y + d + 0.02, 2.2]], '#d6d4bf', 1);
    polygon(ctx, [[x - 0.8, y - 0.7, h], [x + w + 0.8, y - 0.7, h], [x + w + 0.8, y + d / 2, h + 2.5], [x - 0.8, y + d / 2, h + 2.5]], b.id === 'library' ? '#a4b2a2' : '#c18d73', '#8c8f77', 1.2);
    polygon(ctx, [[x - 0.8, y + d / 2, h + 2.5], [x + w + 0.8, y + d / 2, h + 2.5], [x + w + 0.8, y + d + 0.8, h], [x - 0.8, y + d + 0.8, h]], b.roof, '#8d816c', 1.2);
    for (let tile = 0; tile <= w + 1; tile += 0.75) line(ctx, [[x - 0.7 + tile, y + d / 2, h + 2.52], [x - 0.7 + tile, y + d + 0.8, h + 0.02]], '#dfc5a14d', 0.7);
    for (let tile = 1; tile < 5; tile++) {
      const t = tile / 5;
      line(ctx, [[x - 0.7, y + d / 2 + (d / 2 + 0.8) * t, h + 2.5 * (1 - t)], [x + w + 0.7, y + d / 2 + (d / 2 + 0.8) * t, h + 2.5 * (1 - t)]], '#775d4438', 0.65);
    }
    line(ctx, [[x - 1, y + d / 2, h + 2.7], [x + w + 1, y + d / 2, h + 2.7]], '#777c66', 2);
  }

  function tree(x, y, size, index) {
    const p = project(x, y), random = seeded(217 + index * 197), sway = Math.sin(elapsed * 0.55 + index) * 1.1;
    ctx.save(); ctx.translate(p.x, p.y);
    ctx.fillStyle = '#70805b22'; ctx.beginPath(); ctx.ellipse(15, 6, 23 * size, 9 * size, -0.18, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#7f8062'; ctx.lineWidth = 4 * size; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(-1, -37 * size); ctx.stroke();
    ctx.lineWidth = 2 * size; ctx.beginPath(); ctx.moveTo(0, -17 * size); ctx.lineTo(-12, -35 * size); ctx.moveTo(0, -20 * size); ctx.lineTo(12, -41 * size); ctx.stroke();
    const colors = index % 4 === 0 ? ['#b8be80', '#c7c886', '#d3ce93', '#a5b476'] : ['#93aa77', '#a6b782', '#b7c38f', '#c1c99b'];
    for (let leaf = 0; leaf < 14; leaf++) {
      const angle = random() * Math.PI * 2, radius = Math.sqrt(random()) * 21 * size;
      const lx = Math.cos(angle) * radius + sway, ly = -44 * size + Math.sin(angle) * radius * 0.8;
      ctx.fillStyle = colors[leaf % colors.length]; ctx.beginPath(); ctx.ellipse(lx, ly, (9 + random() * 7) * size, (8 + random() * 8) * size, 0, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = '#73875935'; ctx.lineWidth = 0.8; ctx.beginPath(); ctx.arc(lx, ly, 7 * size, 3.7, 5.8); ctx.stroke();
    }
    ctx.restore();
  }

  function bench(x, y) {
    for (const z of [0.8, 1.1, 1.4]) line(ctx, [[x - 2.2, y, z], [x + 2.2, y, z]], '#9c8867', 2.5);
    line(ctx, [[x - 1.8, y, 0], [x - 1.8, y, 1.4]], '#717a68', 2);
    line(ctx, [[x + 1.8, y, 0], [x + 1.8, y, 1.4]], '#717a68', 2);
    line(ctx, [[x - 2.2, y - 0.7, 2.5], [x + 2.2, y - 0.7, 2.5]], '#a59270', 4);
    line(ctx, [[x - 2.2, y - 0.7, 1.9], [x + 2.2, y - 0.7, 1.9]], '#b29f7b', 3);
  }

  function lamp(x, y) {
    line(ctx, [[x, y, 0], [x, y, 5]], '#7f8a72', 2.6);
    const p = project(x, y, 5);
    ctx.fillStyle = minute >= 1095 ? '#f8e2a9' : '#eee7c9';
    ctx.strokeStyle = '#7f8a72'; ctx.lineWidth = 1.2;
    ctx.beginPath(); ctx.roundRect(p.x - 4, p.y - 6, 8, 10, 2); ctx.fill(); ctx.stroke();
    if (minute >= 1095) {
      const halo = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, 30);
      halo.addColorStop(0, '#f7dd9e44'); halo.addColorStop(1, '#f7dd9e00');
      ctx.fillStyle = halo; ctx.beginPath(); ctx.arc(p.x, p.y, 30, 0, Math.PI * 2); ctx.fill();
    }
  }

  function gate() {
    for (const x of [10, 27]) {
      polygon(ctx, [[x, 96], [x + 1.7, 96], [x + 1.7, 97.5], [x, 97.5]], '#aaa88e');
      polygon(ctx, [[x, 97.5], [x + 1.7, 97.5], [x + 1.7, 97.5, 5.5], [x, 97.5, 5.5]], '#e4ddc1', '#aaa88e');
      polygon(ctx, [[x + 1.7, 96], [x + 1.7, 97.5], [x + 1.7, 97.5, 5.5], [x + 1.7, 96, 5.5]], '#bfc2a5');
      polygon(ctx, [[x - 0.4, 95.6, 5.5], [x + 2.1, 95.6, 5.5], [x + 2.1, 97.9, 5.5], [x - 0.4, 97.9, 5.5]], '#829179', '#71826a');
    }
    line(ctx, [[11.4, 96.9, 5], [27, 96.9, 5]], '#86927a', 5);
    const p = project(19, 96.9, 4.7);
    ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(Math.atan2(4.2, 8));
    ctx.fillStyle = '#d8bda0'; ctx.fillRect(-46, -8, 92, 13);
    ctx.fillStyle = '#716952'; ctx.font = '9px "PingFang SC", sans-serif'; ctx.textAlign = 'center'; ctx.fillText('欢迎新同学', 0, 2); ctx.restore();
  }

  function person(personData, player, moving, characters, relationships) {
    const p = project(personData.x, personData.y);
    const character = characters?.[personData.id] || {}, relation = relationships?.[personData.id] || {};
    const step = moving ? Math.sin(elapsed * 11) : Math.sin(elapsed * 1.5 + personData.x) * 0.12;
    ctx.save(); ctx.translate(p.x, p.y);
    ctx.fillStyle = '#697a6035'; ctx.beginPath(); ctx.ellipse(2, 2, 8, 3.3, 0, 0, Math.PI * 2); ctx.fill();
    if (player) {
      ctx.strokeStyle = '#faf5d8'; ctx.lineWidth = 3; ctx.beginPath(); ctx.ellipse(0, 0, 13, 6.3, 0, 0, Math.PI * 2); ctx.stroke();
      ctx.strokeStyle = '#6c8b70'; ctx.lineWidth = 1.2; ctx.stroke();
      if (moving) {
        ctx.fillStyle = '#f9f2d0aa'; ctx.beginPath(); ctx.ellipse(-4 - step * 2, 6, 1.7, 0.9, 0, 0, Math.PI * 2); ctx.fill();
      }
    }
    // Shoes, trouser legs, sleeves and torso keep figures legible at map scale.
    ctx.strokeStyle = '#627462'; ctx.lineWidth = 4.2; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(-3, -9); ctx.lineTo(-3 - step * 2, -2); ctx.moveTo(3, -9); ctx.lineTo(3 + step * 2, -2); ctx.stroke();
    ctx.strokeStyle = '#525c50'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(-4 - step * 2, -1); ctx.lineTo(-1 - step * 2, -1); ctx.moveTo(2 + step * 2, -1); ctx.lineTo(5 + step * 2, -1); ctx.stroke();
    ctx.fillStyle = player ? '#f1e8d1' : character.color || '#81977a'; ctx.strokeStyle = player ? '#c1bba4' : '#667860'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.roundRect(-7, -22, 14, 14, 3); ctx.fill(); ctx.stroke();
    ctx.strokeStyle = player ? '#dcd4bf' : '#6f826c'; ctx.lineWidth = 4.3; ctx.beginPath(); ctx.moveTo(-7, -19); ctx.lineTo(-8.5 - step, -11); ctx.moveTo(7, -19); ctx.lineTo(8.5 + step, -11); ctx.stroke();
    if (!player) {
      ctx.fillStyle = '#cad0a8'; ctx.fillRect(-4, -19, 2.5, 2.5); ctx.fillRect(1, -12, 3, 2);
      ctx.fillStyle = '#657660'; ctx.fillRect(2, -18, 3, 2); ctx.fillRect(-4, -13, 2, 3);
      ctx.strokeStyle = '#a9b69a'; ctx.lineWidth = 0.8; ctx.beginPath(); ctx.moveTo(0, -21); ctx.lineTo(0, -9); ctx.stroke();
    }
    ctx.fillStyle = player ? '#f4ead3' : relation.clarity > 0 ? '#d8bb97' : '#e7dbbd';
    ctx.beginPath(); ctx.ellipse(0, -28, 6, 7.2, 0, 0, Math.PI * 2); ctx.fill();
    if (player) {
      ctx.strokeStyle = '#d2c4a7'; ctx.lineWidth = 0.8; ctx.beginPath(); ctx.arc(0, -29, 6, 3.2, 6); ctx.stroke();
    } else if (personData.id === 'chen') {
      ctx.fillStyle = '#5b6356'; ctx.beginPath(); ctx.ellipse(0, -31.5, 7, 5, 0, Math.PI, Math.PI * 2); ctx.fill();
      ctx.fillRect(-7, -32, 2.4, 10); ctx.fillRect(4.6, -32, 2.4, 10);
      if (relation.clarity >= 1) {
        ctx.strokeStyle = '#75836e'; ctx.lineWidth = 0.8;
        for (const ex of [-2.7, 2.7]) { ctx.beginPath(); ctx.arc(ex, -28.5, 2.2, 0, Math.PI * 2); ctx.stroke(); }
      }
      ctx.fillStyle = '#e1d3b4'; ctx.strokeStyle = '#ab9c7d'; ctx.lineWidth = 0.7; ctx.beginPath(); ctx.roundRect(-5, -18, 10, 7, 1); ctx.fill(); ctx.stroke();
    } else if (personData.id === 'roommate') {
      ctx.fillStyle = '#626b59'; ctx.beginPath(); ctx.ellipse(0, -32, 6.5, 4, -0.15, Math.PI, Math.PI * 2); ctx.fill();
    } else {
      ctx.fillStyle = personData.id === 'instructor' ? '#61755c' : '#879a70';
      ctx.beginPath(); ctx.ellipse(-0.5, -33, 7, 3.5, personData.id === 'li' ? -0.13 : 0, Math.PI, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = '#667859'; ctx.lineWidth = 2.6; ctx.beginPath(); ctx.moveTo(-7, -32); ctx.lineTo(7.5, personData.id === 'li' ? -33.7 : -32); ctx.stroke();
    }
    if (!player && relation.clarity >= 2) {
      ctx.fillStyle = '#596653'; ctx.beginPath(); ctx.arc(-2.3, -28, 0.7, 0, Math.PI * 2); ctx.arc(2.3, -28, 0.7, 0, Math.PI * 2); ctx.fill();
      if (relation.clarity >= 3) { ctx.strokeStyle = '#a87766'; ctx.lineWidth = 0.7; ctx.beginPath(); ctx.arc(0, -25.4, 1.3, 0.15, Math.PI - 0.15); ctx.stroke(); }
    }
    ctx.restore();
  }

  function label(text, x, y, active = false, npc = false, id = null) {
    const p = toScreen(x, y);
    ctx.save(); ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
    const fontSize = npc ? 10.5 : 11;
    ctx.font = `${npc ? 500 : 600} ${fontSize}px "PingFang SC", "Microsoft YaHei", sans-serif`;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    const tw = ctx.measureText(text).width;
    let px = p.x, py = p.y + (npc ? -Math.max(23, 40 * scale) : 16);
    const overlap = (cx, cy) => labelRects.some((rect) => cx - tw / 2 - 11 < rect.right && cx + tw / 2 + 11 > rect.left && cy - 12 < rect.bottom && cy + 12 > rect.top);
    if (npc && overlap(px, py)) {
      const originalY = py;
      let placed = false;
      for (const dy of [-24, -48, 24, -72]) {
        for (const dx of [0, -28, 28, -55, 55]) {
          if (!overlap(p.x + dx, originalY + dy)) { px = p.x + dx; py = originalY + dy; placed = true; break; }
        }
        if (placed) break;
      }
      ctx.strokeStyle = '#77896f70'; ctx.lineWidth = 0.7; ctx.beginPath(); ctx.moveTo(p.x, p.y - 34 * scale); ctx.lineTo(px, py + 10); ctx.stroke();
    }
    ctx.fillStyle = active ? '#496950' : npc ? '#f8f3e3e8' : '#f6f0decf';
    ctx.strokeStyle = active ? '#496950' : '#b9bea18f'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.roundRect(px - tw / 2 - 9, py - 10, tw + 18, 20, 10); ctx.fill(); ctx.stroke();
    ctx.fillStyle = active ? '#fff9e7' : '#52634d'; ctx.fillText(text, px, py + 0.5);
    labelRects.push({ kind: npc ? 'npc' : 'location', id, x, y, left: px - tw / 2 - 9, right: px + tw / 2 + 9, top: py - 10, bottom: py + 10 });
    ctx.restore();
  }

  function resize() {
    const wasMobile = width < 650;
    const bounds = canvas.getBoundingClientRect();
    width = Math.max(1, bounds.width || canvas.clientWidth || 900);
    height = Math.max(1, bounds.height || canvas.clientHeight || 650);
    pixelRatio = Math.min(2, globalThis.devicePixelRatio || 1);
    canvas.width = Math.round(width * pixelRatio); canvas.height = Math.round(height * pixelRatio);
    const nextBase = Math.min(width / 1580, height / 945) * 0.97;
    const isMobile = width < 650;
    if (!initialized) {
      baseScale = nextBase;
      scale = isMobile ? Math.max(0.72, baseScale * 1.75) : Math.max(0.62, baseScale);
      camera = isMobile ? project(lastPlayer.x, lastPlayer.y) : project(48, 46);
      initialized = true;
    } else if (wasMobile !== isMobile) {
      baseScale = nextBase;
      scale = isMobile ? Math.max(0.72, baseScale * 1.75) : Math.max(0.62, baseScale);
      camera = isMobile ? project(lastPlayer.x, lastPlayer.y) : project(48, 46);
    } else {
      // Browser chrome and orientation changes must not shrink the campus into a thumbnail.
      scale = Math.max(isMobile ? 0.65 : 0.62, scale / baseScale * nextBase);
      baseScale = nextBase;
    }
  }
  function toScreen(x, y) { const p = project(x, y); return { x: width / 2 + (p.x - camera.x) * scale, y: height / 2 + (p.y - camera.y) * scale }; }
  function toWorld(screenX, screenY) {
    const px = (screenX - width / 2) / scale + camera.x, py = (screenY - height / 2) / scale + camera.y;
    return { x: (px / 8 + py / 4.2) / 2, y: (py / 4.2 - px / 8) / 2 };
  }
  function pan(dxPixels, dyPixels) { camera.x -= dxPixels / scale; camera.y -= dyPixels / scale; camera.x = clamp(camera.x, -740, 740); camera.y = clamp(camera.y, 20, 820); }
  function zoomBy(factor) { if (Number.isFinite(factor) && factor > 0) scale = clamp(scale * factor, Math.max(0.24, baseScale * 0.75), 1.8); }
  function focus(x, y) { camera = project(x, y); }
  function hitTest(screenX, screenY, npcs = [], locations = []) {
    for (let i = labelRects.length - 1; i >= 0; i--) {
      const rect = labelRects[i];
      if (screenX >= rect.left && screenX <= rect.right && screenY >= rect.top && screenY <= rect.bottom) return { kind: rect.kind, id: rect.id, x: rect.x, y: rect.y };
    }
    const candidates = npcs.map((npc) => { const p = toScreen(npc.x, npc.y); return { kind: 'npc', ...npc, distance: Math.hypot(p.x - screenX, p.y - 17 * scale - screenY) }; }).filter((npc) => npc.distance < Math.max(18, 22 * scale));
    candidates.sort((a, b) => a.distance - b.distance);
    if (candidates[0]) { const { id, x, y } = candidates[0]; return { kind: 'npc', id, x, y }; }
    for (const location of locations) {
      const p = toScreen(location.x, location.y);
      if (Math.abs(screenX - p.x) <= 35 && Math.abs(screenY - p.y - 16) <= 13) return { kind: 'location', id: location.id, x: location.x, y: location.y };
    }
    return null;
  }

  function draw({ state, npcs = [], characters = {}, locations = [], route = [], elapsed: time = 0, hoverId = null, moving = false }) {
    elapsed = time; minute = state?.minute ?? 920; labelRects = [];
    if (state?.player) lastPlayer = { ...state.player };
    ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = '#eeeddc'; ctx.fillRect(0, 0, width, height);
    const sunlight = ctx.createLinearGradient(0, 0, width, height); sunlight.addColorStop(0, '#fbf5df99'); sunlight.addColorStop(1, '#c8d2b630'); ctx.fillStyle = sunlight; ctx.fillRect(0, 0, width, height);
    ctx.setTransform(pixelRatio * scale, 0, 0, pixelRatio * scale, pixelRatio * (width / 2 - camera.x * scale), pixelRatio * (height / 2 - camera.y * scale));
    ctx.drawImage(terrain, -920, -80);
    if (route.length && state?.player) {
      ctx.save(); ctx.setLineDash([4, 7]); line(ctx, [[state.player.x, state.player.y], ...route.map((p) => [p.x, p.y])], '#6c886ca0', 2 / Math.sqrt(scale)); ctx.restore();
      const target = route[route.length - 1]; ellipse(ctx, target.x, target.y, 1.2, 1.2, null, '#698368', 0, 1.5);
    }
    // World objects share the same depth ordering, so people walk behind facades and trees.
    const objects = [
      ...BUILDINGS.map((b) => ({ depth: b.x + b.y + b.w + b.d, render: () => building(b) })),
      ...TREE_SPOTS.map(([x, y, size], i) => ({ depth: x + y, render: () => tree(x, y, size, i) })),
      ...BENCHES.map(([x, y]) => ({ depth: x + y, render: () => bench(x, y) })),
      ...LAMPS.map(([x, y]) => ({ depth: x + y, render: () => lamp(x, y) })),
      { depth: 126, render: gate },
      ...npcs.map((npc) => ({ depth: npc.x + npc.y, render: () => person(npc, false, false, characters, state?.relationships) })),
    ];
    if (state?.player) objects.push({ depth: state.player.x + state.player.y + 0.01, render: () => person(state.player, true, moving, characters, state.relationships) });
    objects.sort((a, b) => a.depth - b.depth).forEach((object) => object.render());
    // Water glints move slowly; there are no random per-frame textures.
    for (let i = 0; i < 5; i++) { const x = 77 + i * 2.6, y = 79 + Math.sin(i * 2) * 3; line(ctx, [[x, y], [x + 0.8 + Math.sin(elapsed * 0.7 + i) * 0.4, y - 0.1]], '#eff2dc9c', 1); }
    if (minute > 1050 || minute < 480) {
      const night = minute > 1050 ? clamp((minute - 1050) / 250, 0, 0.33) : 0.07;
      ctx.save(); ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0); ctx.fillStyle = `rgba(53, 70, 92, ${night})`; ctx.fillRect(0, 0, width, height); ctx.restore();
    }
    for (const location of locations) label(location.name, location.x, location.y, hoverId === location.id || hoverId === `location:${location.id}`, false, location.id);
    for (const npc of npcs) {
      const relation = state?.relationships?.[npc.id], character = characters[npc.id];
      const active = hoverId === npc.id || hoverId === `npc:${npc.id}`;
      if (!active && (!state?.player || distance(state.player, npc) > 17)) continue;
      label(relation?.knownName ? character?.name || npc.id : character?.unknownName || '那个谁', npc.x, npc.y, active, true, npc.id);
    }
    if (state?.player) {
      const p = toScreen(state.player.x, state.player.y);
      ctx.save(); ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0); ctx.fillStyle = '#5e7c60'; ctx.font = '10px "PingFang SC", sans-serif'; ctx.textAlign = 'center'; ctx.fillText('你', p.x, p.y + 17); ctx.restore();
    }
  }
  resize();
  return { draw, toWorld, toScreen, pan, zoomBy, focus, resize, hitTest };
}
