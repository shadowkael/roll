import { CHARACTERS } from './content.mjs';

const BACKGROUNDS = { dorm: 0, library: 1, canteen: 2, field: 3, shade: 4, gate: 5 };
const COLORS = { ink: '#686b55', seam: '#78836c', skin: '#ddbf9c', skinLight: '#ebd3ad', shadow: '#bea583', green: '#829274', dark: '#576651', paper: '#f2e8cf' };
const clamp = (n, a, b) => Math.max(a, Math.min(b, n));
const mix = (a, b, t) => a + (b - a) * t;
const colorMix = (a, b, t) => {
  const rgb = (color) => [1, 3, 5].map((i) => parseInt(color.slice(i, i + 2), 16));
  const first = rgb(a), last = rgb(b);
  return `rgb(${first.map((v, i) => Math.round(mix(v, last[i], clamp(t, 0, 1)))).join(',')})`;
};
const ease = (n) => { const t = clamp(n, 0, 1); return t * t * (3 - 2 * t); };
const pointMix = (a, b, t) => ({ x: mix(a.x, b.x, t), y: mix(a.y, b.y, t) });
const handheld = new Set(['hanger', 'cap', 'cap-buckle', 'receipt', 'book', 'map', 'tray', 'phone', 'bottle', 'bottle-note', 'whistle', 'notebook', 'earphones', 'uniform', 'shoes', 'watch']);

/** Full-body close-up scene renderer. Coordinates returned by getHotspot are CSS pixels. */
export function createSceneRenderer(canvas) {
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas2D is unavailable.');
  let width = 1, height = 1, dpr = 1, hotspot = { x: 0, y: 0 };
  let currentKey = '', previousTime = null, lens = { zoom: 1, x: 0.52, y: 0.43 };
  const faceTransitions = new Map();
  const ImageType = canvas.ownerDocument?.defaultView?.Image || globalThis.Image;
  const background = ImageType ? new ImageType() : null;
  if (background) background.src = new URL('../art/scene-backgrounds.png', import.meta.url).href;

  function path(points, fill, stroke = null, thickness = 1) {
    ctx.beginPath();
    for (const command of points) {
      if (command[0] === 'M') ctx.moveTo(command[1], command[2]);
      else if (command[0] === 'L') ctx.lineTo(command[1], command[2]);
      else if (command[0] === 'C') ctx.bezierCurveTo(...command.slice(1));
      else if (command[0] === 'Q') ctx.quadraticCurveTo(...command.slice(1));
      else if (command[0] === 'Z') ctx.closePath();
    }
    if (fill) { ctx.fillStyle = fill; ctx.fill(); }
    if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = thickness; ctx.stroke(); }
  }
  function ellipse(x, y, rx, ry, fill, stroke = null, thickness = 1, rotation = 0) {
    ctx.beginPath(); ctx.ellipse(x, y, rx, ry, rotation, 0, Math.PI * 2);
    if (fill) { ctx.fillStyle = fill; ctx.fill(); }
    if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = thickness; ctx.stroke(); }
  }
  function line(x1, y1, x2, y2, color, thickness = 1) {
    ctx.strokeStyle = color; ctx.lineWidth = thickness; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
  }
  function round(x, y, w, h, r, fill, stroke = null, thickness = 1) {
    ctx.beginPath(); ctx.roundRect(x, y, w, h, r);
    if (fill) { ctx.fillStyle = fill; ctx.fill(); }
    if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = thickness; ctx.stroke(); }
  }
  function segment(start, end, broad, narrow, fill, stroke = COLORS.ink) {
    const angle = Math.atan2(end.y - start.y, end.x - start.x), nx = -Math.sin(angle), ny = Math.cos(angle);
    const fabric = ctx.createLinearGradient(start.x + nx * broad / 2, start.y + ny * broad / 2, start.x - nx * broad / 2, start.y - ny * broad / 2);
    fabric.addColorStop(0, colorMix(fill, '#eee4c8', 0.18)); fabric.addColorStop(0.43, fill); fabric.addColorStop(1, colorMix(fill, '#465945', 0.17));
    path([
      ['M', start.x + nx * broad / 2, start.y + ny * broad / 2],
      ['Q', mix(start.x, end.x, 0.48) + nx * broad / 2, mix(start.y, end.y, 0.48) + ny * broad / 2, end.x + nx * narrow / 2, end.y + ny * narrow / 2],
      ['Q', end.x + Math.cos(angle) * 3, end.y + Math.sin(angle) * 3, end.x - nx * narrow / 2, end.y - ny * narrow / 2],
      ['L', start.x - nx * broad / 2, start.y - ny * broad / 2], ['Z'],
    ], fabric);
    // Continuous soft side seams leave elbows rounded instead of outlining each limb as a rigid part.
    path([['M', start.x + nx * broad / 2, start.y + ny * broad / 2], ['Q', mix(start.x, end.x, 0.48) + nx * broad / 2, mix(start.y, end.y, 0.48) + ny * broad / 2, end.x + nx * narrow / 2, end.y + ny * narrow / 2]], null, '#69755b99', 0.75);
    path([['M', start.x - nx * broad / 2, start.y - ny * broad / 2], ['L', end.x - nx * narrow / 2, end.y - ny * narrow / 2]], null, '#69755b88', 0.7);
    line(start.x + nx * broad * 0.21, start.y + ny * broad * 0.21, end.x + nx * narrow * 0.2, end.y + ny * narrow * 0.2, '#e1dfbc34', 2);
    const foldX = mix(start.x, end.x, 0.78), foldY = mix(start.y, end.y, 0.78);
    path([['M', foldX - nx * narrow * 0.29, foldY - ny * narrow * 0.29], ['Q', foldX + Math.cos(angle) * 3, foldY + Math.sin(angle) * 3, foldX + nx * narrow * 0.21, foldY + ny * narrow * 0.21]], null, '#5c6f5738', 0.9);
  }
  function hand(point, tilt = 0, open = false) {
    ctx.save(); ctx.translate(point.x, point.y); ctx.rotate(tilt);
    const skin = ctx.createLinearGradient(-7, -4, 8, 8); skin.addColorStop(0, '#eed5b1'); skin.addColorStop(1, '#cbb28f');
    path([['M', -6, -6], ['Q', -8, 1, -5, 7], ['Q', -2, 12, 3, 9], ['L', 7, 3], ['Q', 9, -2, 5, -6], ['Z']], skin, '#b09d80', 0.7);
    if (open) {
      for (let finger = 0; finger < 4; finger++) line(-4 + finger * 3, 4, -5 + finger * 3, 12 - Math.abs(finger - 1.5) * 1.4, COLORS.skin, 2.8);
    }
    line(-5, -1, -9, 4, COLORS.skin, 3);
    ctx.restore();
  }

  function prop(kind, x, y, scale = 1, turn = 0, progress = 0) {
    ctx.save(); ctx.translate(x, y); ctx.scale(scale, scale); ctx.rotate(turn);
    switch (kind) {
      case 'cap': case 'cap-buckle':
        path([['M', -27, 3], ['Q', -29, -27, 0, -29], ['Q', 23, -26, 24, 3], ['Z']], '#889673', '#657358', 1.5);
        path([['M', -28, 1], ['Q', -44, 11, -9, 15], ['Q', 14, 16, 30, 5], ['L', 24, 1], ['Z']], '#a4ad85', '#68775e', 1.3);
        line(-13, -21, -12, 0, '#c7c9a4', 1); round(11, -7, 8, 5, 1, '#65715a', '#c9c9a5');
        if (kind === 'cap-buckle') { round(-5, 17, 16, 9, 2, '#adba8d', '#626e57'); line(-15, 21, 15 + progress * 10, 21, '#66775d', 4); }
        break;
      case 'book': case 'notebook': case 'map':
        if (kind === 'map') {
          path([['M', -36, -25], ['L', -8, -29], ['L', 14, -24], ['L', 35, -29], ['L', 37, 23], ['L', 13, 27], ['L', -9, 23], ['L', -35, 28], ['Z']], '#eee5cc', '#b2aa8f', 1.2);
          line(-10, -23, -9, 20, '#c7bfaa', 1); line(14, -21, 13, 22, '#c7bfaa', 1);
          path([['M', -28, 13], ['L', -17, -9], ['L', 4, 2], ['L', 20, -17], ['L', 28, 12]], null, '#89a084', 2.3);
          for (const [px, py] of [[-20, 9], [4, -9], [24, 9]]) round(px, py, 8, 5, 1, '#b3b88f');
          path([['M', 10, 12], ['L', 12, 16], ['L', 16, 16], ['L', 13, 19], ['L', 14, 23], ['L', 10, 21], ['L', 7, 23], ['L', 8, 19], ['L', 5, 16], ['L', 9, 16], ['Z']], '#bb936e');
        } else {
          round(-26, -32, 51, 65, 3, kind === 'notebook' ? '#c8ac86' : '#a5af90', '#7f8d75', 1.4);
          round(-23, -28, 46, 56, 1, '#ede4cc', '#c4bba4');
          line(-17, -27, -17, 28, '#bfb79e', 1);
          for (let i = 0; i < 6; i++) line(-10, -15 + i * 7, 14 - (i % 2) * 5, -15 + i * 7, '#bbb39e', 0.8);
          if (kind === 'notebook') { line(7, 9, 7, -3, '#858c74', 1.4); ellipse(4, 9, 3, 2, '#858c74'); }
        }
        break;
      case 'receipt':
        path([['M', -13, -27], ['L', 12, -26], ['L', 13, 25], ['L', 8, 23], ['L', 3, 26], ['L', -2, 23], ['L', -7, 26], ['L', -13, 24], ['Z']], '#faf3dc', '#b8af96');
        for (let row = 0; row < 4; row++) line(-8, -17 + row * 5, 7, -17 + row * 5, '#b8b4a1', 0.7);
        ellipse(0, 12, 6, 4, null, '#9f9f86', 0.8); path([['M', -5, 10], ['L', -5, 6], ['L', -1, 8], ['M', 2, 8], ['L', 6, 6], ['L', 6, 11]], null, '#9f9f86', 0.8);
        break;
      case 'phone':
        round(-15, -28, 30, 55, 5, '#67776d', '#43564e', 1.5); round(-12, -23, 24, 44, 2, '#c7d3bd');
        ellipse(0, -9, 5, 5, '#a2b29a'); round(-8, 0, 16, 10, 4, '#b8c7a9'); ellipse(0, 14, 3.3, 3.3, '#8f9e85');
        break;
      case 'watch':
        round(-9, -42, 18, 82, 4, '#839781', '#607a66', 1.2); round(-20, -22, 40, 43, 9, '#647d6a', '#536e5c', 1.4); round(-15, -17, 30, 32, 5, '#cdd9bb');
        ellipse(0, -1, 11, 11, null, '#a4b296', 1); line(0, -1, 0, -9, '#758b70', 1.4); line(0, -1, 7, 3, '#758b70', 1.4); round(20, -9, 3, 8, 1, '#81977c');
        break;
      case 'bottle': case 'bottle-note':
        round(-15, -29, 30, 56, 9, '#a9b8a0', '#6a806d', 1.5); round(-10, -39, 20, 13, 4, '#748976', '#5d745f');
        line(-9, -17, -9, 17, '#d6dec330', 4);
        if (kind === 'bottle-note') { path([['M', -13, -9], ['L', 13, -11], ['L', 12, 13], ['L', -12, 14], ['Z']], '#f0e4c3', '#c3b897'); for (const [xx, yy] of [[-7, 0], [1, -2], [-5, 8], [4, 7]]) { line(xx, yy - 3, xx + 4, yy + 1, '#939575', 1.1); line(xx + 2, yy - 4, xx + 1, yy + 3, '#939575', 1.1); } }
        break;
      case 'tray':
        round(-44, -18, 88, 43, 8, '#b9c2b3', '#788d7a', 1.6); round(-37, -12, 31, 30, 5, '#e6dfc4', '#a2ac95');
        ellipse(-23, 3, 12, 10, '#f2ebd3'); round(0, -12, 34, 12, 4, '#91a578', '#9aab8c'); round(0, 5, 34, 13, 4, '#bd966b', '#9aab8c');
        line(32, -22, 45, 17, '#9c835e', 2); line(37, -23, 50, 16, '#aa916a', 2);
        break;
      case 'hanger':
        path([['M', -5, -29], ['C', -5, -41, 11, -40, 9, -29], ['L', 3, -21], ['L', 35, 2], ['Q', 41, 8, 31, 9], ['L', -31, 9], ['Q', -41, 8, -34, 2], ['L', 1, -21]], null, '#898c78', 2.8);
        break;
      case 'uniform':
        path([['M', -34, -19], ['L', -13, -27], ['L', -4, -20], ['L', 5, -27], ['L', 34, -16], ['L', 30, 1], ['L', 22, -1], ['L', 25, 24], ['L', -26, 24], ['L', -22, -1], ['L', -31, 1], ['Z']], '#8fa17e', '#65785e', 1.4);
        line(0, -18, 0, 23, '#c0c7a2', 1); round(-18, -7, 12, 8, 1, '#778c6d'); round(7, -7, 12, 8, 1, '#a5b48b');
        line(-24, 15 + progress * 3, 23, 15 + progress * 3, '#6e8467', 1);
        break;
      case 'shoes':
        for (const xx of [-18, 12]) { round(xx - 8, -9, 23, 24, 5, '#ddd8c1', '#939780'); round(xx - 10, 7, 29, 13, 6, '#ece6cd', '#9da18a'); for (let row = 0; row < 3; row++) line(xx - 3, -1 + row * 4, xx + 9, -1 + row * 4, '#929c85'); }
        break;
      case 'earphones':
        path([['M', -21, 5], ['C', -28, -39, 27, -41, 24, 2]], null, '#768977', 4);
        round(-29, -4, 12, 26, 5, '#9daa92', '#6d826f'); round(17, -4, 12, 26, 5, '#9daa92', '#6d826f');
        path([['M', 25, 20], ['Q', 30, 40, 13, 43]], null, '#7a8e78', 1.6);
        break;
      case 'whistle':
        path([['M', 2, 2], ['C', -37, -22, -17, -48, 8, -33], ['C', 23, -22, 9, -10, 3, 3]], null, '#78866e', 1.6);
        round(-7, -2, 20, 12, 3, '#b6bca5', '#7c8974'); round(9, -1, 12, 6, 1, '#9da88f'); ellipse(-1, 4, 3, 3, '#73836f');
        break;
      case 'suitcase':
        round(-31, -36, 63, 80, 8, '#aeb59a', '#72836d', 1.6); round(-11, -50, 24, 14, 4, null, '#7f8a75', 3);
        for (const xx of [-17, -2, 13]) line(xx, -27, xx, 33, '#d0d2b4', 1.8);
        ellipse(-19, 46, 5, 6, '#6f7e67'); ellipse(21, 46, 5, 6, '#6f7e67');
        break;
      case 'water-bucket':
        path([['M', -28, -22], ['L', 28, -22], ['L', 24, 36], ['Q', 0, 47, -23, 36], ['Z']], '#aebdb0', '#728879', 1.5);
        ellipse(0, -22, 28, 9, '#c7d1be', '#708978', 1.5); ellipse(0, -23, 22, 6, '#9cb7ab');
        path([['M', -28, -15], ['C', -31, -67, 30, -67, 29, -15]], null, '#829884', 2.2);
        break;
      case 'bench':
        for (let row = 0; row < 3; row++) round(-68, -22 + row * 10, 136, 7, 2, '#aa9470', '#807f63');
        round(-70, 17, 140, 12, 3, '#b29e77', '#838568'); line(-52, 27, -55, 58, '#7c876f', 6); line(53, 27, 57, 58, '#7c876f', 6);
        break;
      default: break;
    }
    ctx.restore();
  }

  function head(id, clarity, tilt, blink, nod) {
    ctx.save(); ctx.translate(0, -297 + nod); ctx.rotate(tilt); ctx.scale(0.93, 0.84);
    const face = ctx.createLinearGradient(-25, -21, 28, 7);
    face.addColorStop(0, colorMix('#e7dcc3', '#f0d9b7', clarity / 3));
    face.addColorStop(0.55, colorMix('#e6dac0', '#e6cdab', clarity / 3));
    face.addColorStop(1, colorMix('#d6cbb1', '#c7b293', clarity / 3));
    if (id === 'chen') path([['M', -27, -10], ['C', -35, -71, 37, -75, 30, -8], ['L', 33, 35], ['Q', 22, 44, 16, 34], ['L', -25, 36], ['Z']], '#5d6659', '#525e51');
    ellipse(-23, -9, 5.5, 9, COLORS.skin, '#b5a083'); ellipse(23, -9, 5.5, 9, COLORS.skin, '#b5a083');
    path([['M', -22, -34], ['C', -29, -15, -24, 6, -15, 18], ['C', -7, 27, 7, 28, 16, 17], ['C', 26, 5, 27, -15, 22, -34], ['C', 17, -48, -17, -50, -22, -34], ['Z']], face, '#aaa488aa', 0.85);
    path([['M', -20, -5], ['Q', -21, 8, -12, 17]], null, '#f3e2c380', 1.6);
    if (clarity > 0) {
      ctx.save(); ctx.globalAlpha = clamp(clarity, 0, 1);
      path([['M', 1, -10], ['Q', 4, 1, 1, 6], ['L', 5, 7]], null, '#bda88a66', 1);
      ellipse(-13, 7, 6, 3, '#ca9c8222'); ellipse(14, 7, 6, 3, '#ca9c8222');
      ctx.restore();
    }
    if (clarity > 1) {
      ctx.save(); ctx.globalAlpha = clamp((clarity - 1) * 0.8, 0, 0.95);
      for (const side of [-1, 1]) {
        const ex = side * 10;
        path([['M', ex - 5, -10], ['Q', ex, -13 + blink * 4, ex + 5, -10]], null, '#6c715b', 1.5);
        if (blink < 0.65) ellipse(ex, -9, 1.8, 2.2 * (1 - blink), '#5c6654');
        path([['M', ex - 5, -18], ['Q', ex, -20, ex + 5, -18]], null, '#65705a', 1.7);
      }
      ctx.restore();
    }
    if (clarity > 2) {
      ctx.save(); ctx.globalAlpha = clamp(clarity - 2, 0, 1);
      path([['M', -6, 14], ['Q', 0, 18, 7, 13]], null, '#a97e69', 1.3);
      line(-3, 19, 3, 19, '#c2a18199', 0.8);
      ctx.restore();
    }
    if (id === 'chen') {
      path([['M', -25, -32], ['C', -15, -65, 32, -50, 26, -26], ['Q', 5, -39, -8, -43], ['Q', -19, -23, -25, -9], ['Z']], '#5e6659', '#53604f');
      ctx.strokeStyle = '#78856d'; ctx.lineWidth = 1.1;
      for (const x of [-11, 11]) { ctx.beginPath(); ctx.ellipse(x, -9, 8.5, 9, 0, 0, Math.PI * 2); ctx.stroke(); }
      line(-2, -10, 2, -10, '#78856d', 1); line(-20, -11, -26, -13, '#78856d'); line(20, -11, 26, -13, '#78856d');
    } else {
      path([['M', -24, -15], ['C', -29, -30, -30, -44, -14, -49], ['C', -2, -58, 19, -53, 25, -42], ['C', 33, -32, 27, -22, 24, -18], ['C', 23, -29, 16, -34, 14, -37], ['C', 6, -30, 6, -30, 1, -26], ['C', 2, -33, -5, -34, -8, -35], ['C', -10, -23, -18, -21, -21, -12], ['Z']], '#626a59', '#53614f', 0.8);
      for (let strand = 0; strand < 7; strand++) {
        const sx = -20 + strand * 6;
        path([['M', sx, -43 + Math.abs(strand - 3) * 1.2], ['Q', sx + 5, -42, sx + 2, -29 + Math.abs(strand - 3)]], null, strand % 2 ? '#a3aa873e' : '#394d3d33', 0.8);
      }
      if (id !== 'roommate') {
        const hatTilt = id === 'li' ? -0.09 : 0;
        ctx.save(); ctx.rotate(hatTilt); path([['M', -30, -36], ['L', -26, -60], ['Q', 0, -74, 25, -58], ['L', 29, -36], ['Z']], id === 'instructor' ? '#758666' : '#8e9e78', '#5f7358', 1.4);
        path([['M', -30, -38], ['Q', 0, -35, 30, -40], ['Q', 45, -26, -3, -28], ['Q', -25, -29, -30, -38], ['Z']], '#a5b28a', '#64775d', 1.4);
        path([['M', -19, -58], ['L', -10, -58], ['L', -11, -47], ['L', -23, -49], ['Z']], '#a6b58a');
        path([['M', 4, -63], ['L', 15, -59], ['L', 11, -48], ['L', 1, -53], ['Z']], '#687e60'); ctx.restore();
      }
    }
    ctx.restore();
  }

  function pose(gesture, time, beatTime, progress, reducedMotion, seated, propKind = 'none') {
    const idle = { le: { x: -51, y: -200 }, lh: { x: -47, y: -145 }, re: { x: 54, y: -200 }, rh: { x: 49, y: -145 } };
    const wave = reducedMotion ? 0 : Math.sin(time * 3.7), slow = reducedMotion ? 0 : Math.sin(time * 1.4);
    const target = { le: { ...idle.le }, lh: { ...idle.lh }, re: { ...idle.re }, rh: { ...idle.rh } };
    let tilt = 0, nod = 0, stride = 0;
    switch (gesture) {
      case 'wave': target.re = { x: 72, y: -272 }; target.rh = { x: 70 + wave * 8, y: -328 }; tilt = -0.03; break;
      case 'offer': target.re = { x: 59, y: -221 }; target.rh = { x: 104 + progress * 16, y: -215 - progress * 7 }; target.lh = { x: 29, y: -182 }; break;
      case 'reach': target.re = { x: 66, y: -217 }; target.rh = { x: 102 + progress * 22, y: -182 + progress * 9 }; tilt = 0.03; break;
      case 'nod': nod = reducedMotion ? 2 : Math.sin(Math.min(beatTime, 2.2) * Math.PI * 1.8) * 3; tilt = 0.018; break;
      case 'listen': case 'sit': target.le = { x: -51, y: -201 }; target.lh = { x: -21, y: -144 }; target.re = { x: 54, y: -202 }; target.rh = { x: 24, y: -145 }; tilt = -0.035; break;
      case 'step': stride = reducedMotion ? 0 : Math.sin(time * 4.5) * 13; target.lh.x -= stride * 0.4; target.rh.x += stride * 0.4; break;
      case 'clap': target.le = { x: -52, y: -218 }; target.re = { x: 50, y: -218 }; target.lh = { x: -8 - Math.abs(wave) * 16, y: -240 }; target.rh = { x: 8 + Math.abs(wave) * 16, y: -241 }; break;
      case 'sway': tilt = slow * 0.045; target.lh = { x: -47, y: -156 }; target.rh = { x: 49, y: -157 }; break;
      case 'fold': target.le = { x: -47, y: -212 }; target.re = { x: 51, y: -213 }; target.lh = { x: -15 + progress * 15, y: -186 }; target.rh = { x: 18 - progress * 13, y: -182 - Math.abs(slow) * 4 }; break;
      case 'point': target.re = { x: 63, y: -246 }; target.rh = { x: 115, y: -254 + slow * 2 }; break;
      case 'write': target.le = { x: -49, y: -212 }; target.lh = { x: -14, y: -218 }; target.re = { x: 46, y: -216 }; target.rh = { x: 8 + slow * 4, y: -228 }; tilt = 0.045; break;
    }
    if (handheld.has(propKind) && ['idle', 'listen', 'nod', 'sway', 'sit'].includes(gesture)) {
      target.re = { x: 54, y: -216 }; target.rh = { x: 27, y: -218 };
      if (['book', 'map', 'notebook', 'uniform', 'tray'].includes(propKind)) { target.le = { x: -53, y: -214 }; target.lh = { x: -25, y: -211 }; }
    }
    const blend = reducedMotion ? 1 : ease(beatTime / 0.7);
    for (const key of ['le', 'lh', 're', 'rh']) target[key] = pointMix(idle[key], target[key], blend);
    return { ...target, tilt: tilt * blend, nod: nod * blend, stride, seated };
  }

  function figure(id, clarity, x, floor, size, gesture, propKind, elapsed, beatElapsed, progress, reducedMotion, second = false, seated = false) {
    const p = pose(gesture, elapsed, beatElapsed, progress, reducedMotion, seated, propKind);
    const breath = reducedMotion ? 0 : Math.sin(elapsed * 1.75 + (second ? 2 : 0)) * 1.6;
    const blinkPhase = reducedMotion ? 2 : elapsed % 4.3;
    const blink = blinkPhase < 0.16 ? Math.sin(blinkPhase / 0.16 * Math.PI) : 0;
    ctx.save(); ctx.translate(x, floor); ctx.scale(size, size);
    ellipse(4, 5, seated ? 81 : 53, 11, '#50644728');
    if (seated) { round(-82, -138, 165, 12, 3, '#aa9470', '#7b8167'); line(-68, -125, -73, -5, '#788671', 7); line(68, -125, 72, -5, '#788671', 7); }
    // Each leg bends independently. This is an articulated full-body figure, not a portrait sprite.
    const hips = [{ x: -20, y: -140 }, { x: 20, y: -140 }];
    const knees = seated ? [{ x: -43, y: -90 }, { x: 54, y: -101 }] : [{ x: -23 + p.stride, y: -77 }, { x: 21 - p.stride, y: -75 }];
    const feet = seated ? [{ x: -44, y: -9 }, { x: 49, y: -10 }] : [{ x: -24 + p.stride * 1.3, y: -9 }, { x: 25 - p.stride * 1.2, y: -9 }];
    for (let leg = 0; leg < 2; leg++) {
      segment(hips[leg], knees[leg], 30, 24, leg ? '#7e8c70' : '#8e9b7c'); segment(knees[leg], feet[leg], 24, 19, leg ? '#78866b' : '#879577');
      line(knees[leg].x - 6, knees[leg].y + 4, knees[leg].x + 9, knees[leg].y + 1, '#626f595c', 1.5);
      round(feet[leg].x - 12, feet[leg].y - 2, 32, 13, 5, '#ebe4cc', '#858e75', 1.2);
      line(feet[leg].x - 11, feet[leg].y + 9, feet[leg].x + 18, feet[leg].y + 9, '#9b9f86', 2);
      for (let lace = 0; lace < 3; lace++) line(feet[leg].x - 5, feet[leg].y + lace * 2, feet[leg].x + 6, feet[leg].y + lace * 2, '#9aa18a', 0.8);
    }
    ctx.translate(0, breath);
    const jacket = id === 'instructor' ? '#7c8d71' : id === 'chen' ? '#8e9b79' : id === 'roommate' ? '#94a282' : '#8b9d79';
    // Back arm is painted before the jacket; forearms then hands are painted over it.
    segment({ x: -38, y: -250 }, p.le, 28, 23, jacket); ellipse(p.le.x, p.le.y, 11.5, 11, '#93a17f'); segment(p.le, p.lh, 24, 16, '#93a17f');
    segment({ x: 38, y: -250 }, p.re, 28, 23, jacket); ellipse(p.re.x, p.re.y, 11.5, 11, '#839573'); segment(p.re, p.rh, 24, 16, '#839573');
    const neck = ctx.createLinearGradient(-12, -280, 12, -256); neck.addColorStop(0, '#bfa78a'); neck.addColorStop(0.7, '#ddc09b'); neck.addColorStop(1, '#e5cba6');
    round(-10, -285, 20, 29, 7, neck, '#b9a68a77', 0.7);
    const cloth = ctx.createLinearGradient(-45, -235, 50, -186);
    cloth.addColorStop(0, colorMix(jacket, '#e7e0bf', 0.2)); cloth.addColorStop(0.48, jacket); cloth.addColorStop(1, colorMix(jacket, '#4d644a', 0.18));
    path([['M', -19, -267], ['Q', -43, -270, -47, -249], ['C', -47, -221, -35, -205, -38, -181], ['L', -41, -139], ['Q', 0, -128, 42, -139], ['L', 37, -185], ['C', 40, -211, 49, -232, 46, -248], ['Q', 43, -264, 19, -267], ['L', 0, -254], ['Z']], cloth, '#697c6099', 1.1);
    // Quiet camouflage is clipped to the torso instead of tiling a bitmap across anatomy.
    ctx.save(); ctx.beginPath(); ctx.moveTo(-37, -249); ctx.lineTo(37, -249); ctx.lineTo(35, -143); ctx.lineTo(-35, -143); ctx.closePath(); ctx.clip();
    for (const [xx, yy, color] of [[-25, -237, '#b0bd95'], [20, -226, '#6f8564'], [-9, -207, '#829272'], [22, -182, '#adb98e'], [-27, -167, '#687d60'], [2, -152, '#b0bb93']]) {
      path([['M', xx - 9, yy], ['Q', xx - 8, yy - 8, xx - 3, yy - 6], ['Q', xx + 3, yy - 1, xx + 9, yy - 3], ['Q', xx + 12, yy + 1, xx + 6, yy + 6], ['Q', xx + 17, yy + 14, xx + 3, yy + 11], ['Q', xx - 4, yy + 7, xx - 8, yy + 11], ['Z']], color);
    }
    for (let grain = 0; grain < 65; grain++) {
      const gx = -34 + (grain * 17.31 % 69), gy = -246 + (grain * 23.79 % 100);
      line(gx, gy, gx + 0.8, gy - 0.45, grain % 2 ? '#d5dab329' : '#5b725b1e', 0.8);
    }
    ctx.restore();
    // Fine garment folds gather at the waist, shoulder and tucked elbows.
    for (const fold of [
      [-34, -244, -28, -236, -32, -223], [31, -242, 27, -231, 34, -224],
      [-35, -183, -23, -181, -14, -188], [35, -181, 25, -174, 16, -180],
      [-33, -157, -17, -160, -6, -151], [8, -156, 20, -163, 34, -154],
      [-31, -141, -17, -145, -7, -140], [7, -142, 22, -147, 33, -141],
    ]) path([['M', fold[0], fold[1]], ['Q', fold[2], fold[3], fold[4], fold[5]]], null, '#526b4e45', 0.9);
    path([['M', -35, -247], ['Q', -25, -252, -22, -251]], null, '#d9dfb86b', 1.2);
    path([['M', -19, -267], ['L', -4, -253], ['L', -14, -237], ['L', -29, -258], ['Z']], '#b4bf99', '#7e9071');
    path([['M', 19, -267], ['L', 4, -253], ['L', 14, -237], ['L', 29, -258], ['Z']], '#a3b48d', '#7e9071');
    line(0, -251, 0, -139, '#c1cba655', 1.4);
    for (let button = 0; button < 5; button++) ellipse(3, -235 + button * 21, 1.3, 1.3, '#5e7458');
    for (const px of [-29, 12]) { round(px, -222, 20, 21, 2, null, '#6d815f', 1.2); line(px - 1, -218, px + 21, -218, '#c3cca466', 1.2); }
    line(-36, -146, 36, -146, '#60765677', 2);
    head(id, clarity, p.tilt, blink, p.nod);
    if (id === 'instructor') path([['M', -11, -261], ['Q', -16, -211, 4, -212], ['Q', 25, -211, 13, -261]], null, '#576e56', 1.6);
    // Portable props occupy real hands. The other hand can touch or support the object.
    const holding = handheld.has(propKind) && !second;
    let object = p.rh;
    if (['book', 'map', 'notebook', 'uniform', 'tray'].includes(propKind)) object = { x: (p.lh.x + p.rh.x) / 2, y: Math.min(p.lh.y, p.rh.y) - 3 };
    if (holding) prop(propKind, object.x, object.y, propKind === 'uniform' ? 0.9 : 0.8, gesture === 'wave' ? -0.2 : p.tilt, progress);
    hand(p.lh, -0.17, ['clap', 'fold'].includes(gesture)); hand(p.rh, gesture === 'wave' ? -0.4 + Math.sin(elapsed * 3.7) * 0.1 : 0.15, ['offer', 'wave', 'clap', 'point'].includes(gesture));
    if (gesture === 'write') line(p.rh.x - 5, p.rh.y - 8, p.rh.x + 9, p.rh.y + 5, '#788267', 2.4);
    ctx.restore();
    return { x: x + object.x * size, y: floor + (object.y + breath) * size };
  }

  function backdrop(locationId, elapsed, reducedMotion, mood, minute = 920) {
    const index = BACKGROUNDS[locationId] ?? 4;
    if (background?.complete && background.naturalWidth) {
      const cellW = background.naturalWidth / 2, cellH = background.naturalHeight / 3;
      const fit = Math.max(width / cellW, height / cellH) * 1.03;
      const targetW = cellW * fit, targetH = cellH * fit;
      const drift = reducedMotion ? 0 : Math.sin(elapsed * 0.09) * 2;
      ctx.drawImage(background, index % 2 * cellW, Math.floor(index / 2) * cellH, cellW, cellH, (width - targetW) / 2 + drift, (height - targetH) / 2, targetW, targetH);
    } else {
      // A substantive painted-room fallback remains visible while the single atlas decodes.
      const outdoor = ['field', 'shade', 'gate'].includes(locationId);
      ctx.fillStyle = outdoor ? '#dbe1c6' : '#e8dfc6'; ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = outdoor ? '#ccd5b6' : '#c8c5a9'; ctx.fillRect(0, height * 0.48, width, height * 0.52);
      if (outdoor) { for (let tree = 0; tree < 8; tree++) ellipse(tree * width / 7, height * 0.23, width / 9, height * 0.2, tree % 2 ? '#afb987' : '#c0c694'); }
      else { round(width * 0.09, height * 0.06, width * 0.31, height * 0.32, 2, '#f8edd0', '#b6b699', 3); line(width * 0.24, height * 0.06, width * 0.24, height * 0.38, '#bdbaa0', 4); }
      if (locationId === 'library') for (let shelf = 0; shelf < 3; shelf++) { round(width * 0.64, height * (0.13 + shelf * 0.12), width * 0.28, height * 0.07, 2, '#a49976'); for (let book = 0; book < 12; book++) round(width * (0.65 + book * 0.021), height * (0.085 + shelf * 0.12), width * 0.012, height * 0.08, 1, book % 2 ? '#96a386' : '#c6b48c'); }
      if (locationId === 'field') { ctx.fillStyle = '#c8957d'; ctx.fillRect(0, height * 0.52, width, height * 0.48); for (let lane = 0; lane < 4; lane++) line(0, height * (0.6 + lane * 0.1), width, height * (0.51 + lane * 0.1), '#edcbb0', 2); }
    }
    const wash = ctx.createLinearGradient(0, 0, width, height); wash.addColorStop(0, '#fff3ca0f'); wash.addColorStop(1, '#c8d6b027'); ctx.fillStyle = wash; ctx.fillRect(0, 0, width, height);
    const evening = clamp((minute - 1065) / 300, 0, 0.34);
    if (evening || mood === 'night' || mood?.includes?.('夜')) {
      ctx.fillStyle = `rgba(42, 64, 76, ${Math.max(evening, 0.07)})`; ctx.fillRect(0, 0, width, height);
      const glow = ctx.createRadialGradient(width * 0.77, height * 0.2, 5, width * 0.77, height * 0.2, height * 0.72);
      glow.addColorStop(0, '#f5d69932'); glow.addColorStop(1, '#e4c59500'); ctx.fillStyle = glow; ctx.fillRect(0, 0, width, height);
    }
  }

  function foreground(locationId, elapsed, reducedMotion) {
    // Soft out-of-focus leaves and shadows frame the animated figures instead of covering faces.
    if (['shade', 'field', 'gate'].includes(locationId)) {
      ctx.save(); ctx.globalAlpha = 0.62;
      for (let i = 0; i < 11; i++) {
        const sway = reducedMotion ? 0 : Math.sin(elapsed * 0.7 + i) * 5;
        const side = i % 2 ? width : 0;
        ellipse(side + Math.sin(i * 2) * 24 + sway, height * (0.06 + i % 5 * 0.11), 29 + i % 3 * 9, 15, i % 3 ? '#a5b881' : '#c6c18a', null, 1, i * 0.37);
      }
      ctx.restore();
      if (!reducedMotion) {
        for (let leaf = 0; leaf < 4; leaf++) {
          const cycle = (elapsed * (9 + leaf * 2) + leaf * 139) % (height + 90);
          const x = width * (0.09 + leaf * 0.24) + Math.sin(cycle / 70 + leaf) * 22;
          ellipse(x, cycle - 30, 4.2, 1.7, '#bba86c88', null, 1, Math.sin(elapsed + leaf));
        }
      }
    }
    const vignette = ctx.createRadialGradient(width * 0.5, height * 0.34, height * 0.16, width * 0.5, height * 0.4, Math.max(width, height) * 0.72);
    vignette.addColorStop(0, '#373f2600'); vignette.addColorStop(1, '#59613c3b'); ctx.fillStyle = vignette; ctx.fillRect(0, 0, width, height);
    // The lower fade is intentional subtitle space, leaving the scene itself text-free.
    const bottom = ctx.createLinearGradient(0, height * 0.6, 0, height); bottom.addColorStop(0, '#eee5cc00'); bottom.addColorStop(1, '#eee5cc9c'); ctx.fillStyle = bottom; ctx.fillRect(0, height * 0.6, width, height * 0.4);
  }

  function resize() {
    const bounds = canvas.getBoundingClientRect();
    width = Math.max(1, bounds.width || canvas.clientWidth || 1000); height = Math.max(1, bounds.height || canvas.clientHeight || 650);
    dpr = Math.min(2, globalThis.devicePixelRatio || 1); canvas.width = Math.round(width * dpr); canvas.height = Math.round(height * dpr);
    hotspot = { x: width * 0.55, y: height * 0.46 };
  }

  function draw({ plan, beatIndex = 0, state = {}, elapsed = 0, beatElapsed = 0, actionProgress = 0, reducedMotion = false }) {
    if (!plan) return;
    const beat = plan.beats?.[beatIndex] || {}, locationId = plan.locationId || 'shade';
    const cast = (plan.cast || []).filter((id) => CHARACTERS[id]).slice(0, 3);
    if (CHARACTERS[beat.actor] && cast.includes(beat.actor)) { cast.splice(cast.indexOf(beat.actor), 1); cast.unshift(beat.actor); }
    const mobile = width < 620, propKind = beat.prop || plan.prop || 'none';
    const playerAction = beat.actor === 'player' || beat.propOwner === 'player';
    const playerHolds = beat.propOwner === 'player';
    const bodySize = Math.min(height * (mobile ? 0.51 : 0.59) / 356, width * (mobile ? 0.0067 : 0.0042));
    const floor = height * (mobile ? 0.635 : 0.7);
    const primaryX = width * (cast.length > 1 ? mobile ? 0.57 : 0.57 : 0.52);
    const motionTime = reducedMotion ? 0 : elapsed;
    const key = `${plan.id}:${beatIndex}`;
    const target = { zoom: 1, x: 0.52, y: 0.39 };
    if (beat.focus === 'person') {
      target.zoom = mobile ? 1.5 : 1.58;
      target.x = (target.zoom * primaryX / width - 0.53) / (target.zoom - 1);
      target.y = 0.01;
    } else if (beat.focus === 'detail') {
      target.zoom = mobile ? 1.85 : 2;
      let focalPoint = { x: width * (cast.length ? 0.29 : 0.5), y: height * (mobile ? 0.47 : 0.52) };
      if (playerHolds) focalPoint = { x: width * (mobile ? 0.47 : 0.43), y: height * 0.51 };
      else if (playerAction && propKind === 'shoes') focalPoint = { x: width * 0.46, y: height * 0.54 };
      else if (cast[0] && handheld.has(propKind) && !playerAction) {
        const estimated = pose(beat.gesture || 'idle', motionTime, beatElapsed, actionProgress, reducedMotion, false, propKind);
        const handPosition = ['book', 'map', 'notebook', 'uniform', 'tray'].includes(propKind) ? { x: (estimated.lh.x + estimated.rh.x) / 2, y: Math.min(estimated.lh.y, estimated.rh.y) - 3 } : estimated.rh;
        focalPoint = { x: primaryX + handPosition.x * bodySize, y: floor + handPosition.y * bodySize };
      } else if (propKind === 'none' && cast[0]) focalPoint = { x: primaryX, y: floor - 285 * bodySize };
      // Pivot may lie outside the viewport: the prop itself stays centered in a true insert shot.
      target.x = (target.zoom * focalPoint.x / width - 0.5) / (target.zoom - 1);
      target.y = (target.zoom * focalPoint.y / height - 0.44) / (target.zoom - 1);
    }
    if (currentKey !== key) { currentKey = key; previousTime = elapsed; }
    const dt = previousTime === null ? 0.016 : clamp(elapsed - previousTime, 0, 0.1); previousTime = elapsed;
    const blend = reducedMotion ? 1 : 1 - Math.exp(-dt * 4.5);
    lens = { zoom: mix(lens.zoom, target.zoom, blend), x: mix(lens.x, target.x, blend), y: mix(lens.y, target.y, blend) };
    const clarityFor = (id) => {
      const next = clamp(state.relationships?.[id]?.clarity || 0, 0, 3);
      let transition = faceTransitions.get(id);
      if (!transition) { transition = { from: next, target: next, value: next, progress: 1 }; faceTransitions.set(id, transition); }
      if (transition.target !== next) { transition.from = transition.value; transition.target = next; transition.progress = 0; }
      transition.progress = reducedMotion ? 1 : Math.min(1, transition.progress + dt / 1.25);
      transition.value = mix(transition.from, transition.target, ease(transition.progress));
      return transition.value;
    };
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.clearRect(0, 0, width, height);
    backdrop(locationId, motionTime, reducedMotion, plan.ambience, state.minute);
    ctx.save();
    const centerX = width * lens.x, centerY = height * lens.y;
    ctx.translate(centerX, centerY); ctx.scale(lens.zoom, lens.zoom); ctx.translate(-centerX, -centerY);
    // The viewer's side of a table, or a nearby object, creates useful foreground depth.
    if (['library', 'canteen'].includes(locationId)) {
      ctx.save(); ctx.globalAlpha = 0.95;
      path([['M', -width * 0.05, height * 0.65], ['L', width * 0.44, height * 0.6], ['L', width * 0.51, height * 0.77], ['L', -width * 0.03, height * 0.89], ['Z']], '#bfa983', '#9f9578', 1.7);
      line(0, height * 0.67, width * 0.43, height * 0.62, '#e0cda54d', 2); ctx.restore();
    }
    const seated = beat.gesture === 'sit' || (beat.gesture === 'listen' && ['shade', 'library', 'canteen'].includes(locationId));
    // Secondary people are quieter, smaller and farther back; primary remains a legible full figure.
    for (let index = cast.length - 1; index >= 1; index--) {
      const x = width * (index === 1 ? mobile ? 0.25 : 0.31 : mobile ? 0.8 : 0.79);
      figure(cast[index], clarityFor(cast[index]), x, floor - height * 0.025, bodySize * 0.89, 'listen', 'none', motionTime + index, beatElapsed, 0, reducedMotion, true, seated);
    }
    let propPoint;
    if (cast[0]) {
      propPoint = figure(cast[0], clarityFor(cast[0]), primaryX, floor, bodySize, playerAction ? 'listen' : beat.gesture || 'idle', playerAction ? 'none' : propKind, motionTime, beatElapsed, reducedMotion && actionProgress ? 1 : actionProgress, reducedMotion, false, seated);
    }
    if (playerHolds && handheld.has(propKind)) {
      const x = width * (mobile ? 0.47 : 0.43);
      const y = beat.focus === 'person' ? centerY + (height * 0.5 - centerY) / lens.zoom : height * 0.51;
      const objectScale = Math.max(0.8, Math.min(width / 400, height / 410));
      const wrist = { x: x + 13 * objectScale, y: y + 18 * objectScale };
      const elbow = { x: width * 0.65, y: height * 0.68 };
      segment({ x: width * 0.78, y: height * 0.86 }, elbow, objectScale * 48, objectScale * 33, '#91a080');
      segment(elbow, wrist, objectScale * 33, objectScale * 18, '#a5b28e');
      prop(propKind, x, y, objectScale, -0.11, actionProgress);
      ctx.save(); ctx.translate(wrist.x, wrist.y); ctx.scale(objectScale, objectScale); hand({ x: 0, y: 0 }, -0.4, true); ctx.restore();
      propPoint = { x, y };
    } else if (playerAction && propKind === 'shoes') {
      const x = width * 0.46, y = height * 0.54;
      const objectScale = Math.max(1.2, Math.min(width / 300, height / 330));
      const step = reducedMotion ? 0 : Math.sin(motionTime * 3.4) * 7;
      ctx.save(); ctx.translate(x, y); ctx.scale(objectScale, objectScale);
      segment({ x: -20, y: 75 }, { x: -20 - step, y: 4 }, 22, 18, '#8a9d79');
      segment({ x: 21, y: 75 }, { x: 21 + step, y: 4 }, 22, 18, '#7d9171');
      prop('shoes', step * 0.3, -2, 1.3, 0, actionProgress); ctx.restore();
      propPoint = { x, y };
    } else if (playerAction && propKind === 'none' && ['clap', 'point', 'reach', 'fold'].includes(beat.gesture)) {
      const x = width * 0.49, y = height * 0.5, handScale = Math.max(1.2, height / 290);
      const separation = beat.gesture === 'clap' ? (reducedMotion ? 9 : 8 + Math.abs(Math.sin(motionTime * 3)) * 20) : 25;
      ctx.save(); ctx.translate(x, y); ctx.scale(handScale, handScale);
      for (const side of [-1, 1]) {
        segment({ x: side * 59, y: 87 }, { x: side * separation, y: 2 }, 28, 14, '#9aac87');
        hand({ x: side * separation, y: 0 }, side * -0.45, true);
      }
      ctx.restore(); propPoint = { x, y };
    } else if (propKind === 'none' && cast.length) {
      propPoint = { x: primaryX, y: floor - 285 * bodySize };
    } else if (playerAction || !cast.length || !handheld.has(propKind)) {
      const x = width * (cast.length ? 0.29 : 0.5), y = height * (mobile ? 0.47 : 0.52);
      const objectScale = Math.max(0.65, Math.min(width / 350, height / 430)) * (beat.focus === 'detail' ? 1.45 : 1.1);
      prop(propKind, x, y, objectScale, reducedMotion ? 0 : Math.sin(motionTime * 0.6) * 0.015, actionProgress);
      propPoint = { x, y };
    }
    if (propPoint) {
      hotspot = { x: clamp(centerX + (propPoint.x - centerX) * lens.zoom, 42, Math.max(42, width - 42)), y: clamp(centerY + (propPoint.y - centerY) * lens.zoom, 55, height * 0.59) };
      if (actionProgress > 0 && !reducedMotion) {
        const radius = 14 + ease(actionProgress) * 26;
        ctx.save(); ctx.globalAlpha = (1 - actionProgress) * 0.65; ellipse(propPoint.x, propPoint.y, radius, radius * 0.72, null, '#f6e6b2', 2); ctx.restore();
      }
    }
    ctx.restore();
    foreground(locationId, motionTime, reducedMotion);
  }
  resize();
  return { draw, resize, getHotspot: () => ({ ...hotspot }) };
}
