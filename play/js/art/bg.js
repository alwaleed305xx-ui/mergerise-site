// Backgrounds: the 5 story homes (TIER_SCENES) + special scenes sold as 'bg' items.
// Scene = full SVG content for a 360x640 portrait viewBox, drawn BEHIND the avatar.
// Story (art direction v2): NYC sidewalk → Brooklyn studio → Manhattan loft → suburban home → Beverly Hills mansion.
// REAL HUB LAYOUT (css/app.css: .hub-avatar bottom:25% width:56%, scene xMidYMax slice, 360x640 screen):
//   hero svg box x≈79–281 / y≈152–480; the body itself covers x≈127–233 (head y≈176–294, feet y≈451).
//   The progress panel + Play/side buttons + the .hub-scene::after dark gradient hide everything below y≈495,
//   and a 19.5:9 phone crops the scene to x≈32–328. So: hero props live in the band y≈300–500 inside the
//   side lanes x 36–124 and x 236–324; y>500 holds plain ground texture only; skies/hills/skylines may run
//   off-canvas. (gallery.html draws the avatar lower — feet y≈575 — so props sit higher there than in-game.)
import { P, F, SH, HL, C, E, R, L, T, G, STAR, SPARK, single, dark, light } from './_kit.js';

const SW = 3; // outline width for scene props
const rect = (x, y, w, h, c, o) => F(`M${x},${y} h${w} v${h} h${-w} Z`, c, o);
const band = (y, h, c, o) => rect(0, y, 360, h, c, o);
const bands = list => list.map(b => band(b[0], b[1], b[2])).join('');
const poly = (pts, c, o) => F('M' + pts.join(' L') + ' Z', c, o);
const glow = (x, y, r, c, op) => C(x, y, r, c, { sw: 0, op });
// Light falloff without gradients: three stepped discs (r, .65r, .4r) at ≈.05/.07/.10 × k — reads as light, not a plate.
const halo = (x, y, r, c, k) => { const m = k || 1; return glow(x, y, r, c, +(0.05 * m).toFixed(3)) + glow(x, y, +(r * 0.65).toFixed(1), c, +(0.07 * m).toFixed(3)) + glow(x, y, +(r * 0.4).toFixed(1), c, +(0.1 * m).toFixed(3)); };
const dots = (list, c, op) => list.map(p => C(p[0], p[1], p[2] || 1.6, c, { sw: 0, op: op || 0.9 })).join('');
const pr = (d, c, o) => P(d, c, Object.assign({ sw: SW }, o || {}));
const rr = (x, y, w, h, rx, c, o) => R(x, y, w, h, rx, c, Object.assign({ sw: SW }, o || {}));
const cc = (x, y, r, c, o) => C(x, y, r, c, Object.assign({ sw: SW }, o || {}));
const ee = (x, y, rx, ry, c, o) => E(x, y, rx, ry, c, Object.assign({ sw: SW }, o || {}));
const rep = (n, fn) => { let s = ''; for (let i = 0; i < n; i++) s += fn(i); return s; };
// draw a prop in its own local space (origin = the prop's ground point)
const at = (x, y, inner) => G(inner, { transform: `translate(${x} ${y})` });
// flat building silhouettes: [x, y, w, h, spire?]
const sil = (list, c) => list.map(b => rect(b[0], b[1], b[2], b[3], c) + (b[4] ? L(`M${b[0] + b[2] / 2},${b[1]} V${b[1] - b[4]}`, c, 3) : '')).join('');
// mortar lines of a brick wall between y0..y1 (full width)
const bricks = (y0, y1, mortar, step) => { const s = step || 18; let d = ''; for (let y = y0; y + 2 < y1; y += s) { d += `M0,${y} H360 `; for (let x = (((y - y0) / s) % 2 ? 22 : 0); x < 360; x += 44) d += `M${x},${y} V${Math.min(y + s, y1)} `; } return L(d, mortar, 2); };
// glass skyscraper with a deterministic grid of lit windows. o: {p: lit density 0..10, lit2, spire, crown, sw, cw, ch, gx, gy}
const tower = (x, y, w, h, col, lit, o) => {
  o = o || {};
  const cw = o.cw || 5, ch = o.ch || 8, gx = o.gx || 10, gy = o.gy || 13, p = o.p == null ? 6 : o.p;
  const cols = Math.max(1, Math.floor((w - 6) / gx)), rows = Math.max(1, Math.floor((h - 8) / gy));
  const ox = x + (w - ((cols - 1) * gx + cw)) / 2, oy = y + 7;
  let wins = '';
  for (let r = 0; r < rows; r++) for (let q = 0; q < cols; q++) { const k = (r * 7 + q * 11 + x + y + r * q * 3) % 10; if (k < p) wins += rect(ox + q * gx, oy + r * gy, cw, ch, k % 4 === 0 && o.lit2 ? o.lit2 : lit, { op: 0.9 }); }
  const line = { stroke: dark(col, 0.4), sw: o.sw || 2.5 };
  return (o.crown ? pr(`M${x + 4},${y + 2} L${x + w / 2},${y - o.crown} L${x + w - 4},${y + 2} Z`, col, line) : '') +
    (o.spire ? L(`M${x + w / 2},${y} V${y - o.spire}`, dark(col, 0.3), 3) + glow(x + w / 2, y - o.spire, 5, '#ef4444', 0.5) + cc(x + w / 2, y - o.spire, 2, '#ef4444', { sw: 0 }) : '') +
    pr(`M${x},${y} h${w} v${h} h${-w} Z`, col, line) + wins + HL(`M${x + 4},${y + 4} h4 v${h - 8} h-4 Z`, 0.14) + SH(`M${x + w - 9},${y + 4} h6 v${h - 8} h-6 Z`, 0.2);
};
// neon tube text (glow = two fat low-opacity copies behind a bright core)
const neon = (x, y, txt, size, col) => T(x, y, txt, size, col, { stroke: col, sw: 14, op: 0.16 }) + T(x, y, txt, size, col, { stroke: col, sw: 7, op: 0.28 }) + T(x, y, txt, size, light(col, 0.6), { stroke: col, sw: 2.2 });
// graffiti tag: offset colour shadow + fat outlined letters
const tag = (x, y, txt, size, col, col2) => T(x + 4, y + 4, txt, size, col2, { stroke: col2, sw: 6, op: 0.9 }) + T(x, y, txt, size, col, { stroke: dark(col, 0.5), sw: 5 });
const hollywood = (x, y, size) => T(x, y, 'HOLLYWOOD', size || 9, '#f8fafc', { stroke: '#4b5563', sw: 1.2 });
const usFlag = (x, y, w, h) => { const s = h / 7; return rep(7, i => rect(x, y + i * s, w, s, i % 2 ? '#f8fafc' : '#dc2626')) + rect(x, y, w * 0.42, s * 4, '#1e3a8a') +
  dots([[x + w * 0.1, y + s * 1.1, 1.3], [x + w * 0.21, y + s * 1.1, 1.3], [x + w * 0.32, y + s * 1.1, 1.3], [x + w * 0.155, y + s * 2.2, 1.3], [x + w * 0.265, y + s * 2.2, 1.3], [x + w * 0.1, y + s * 3.2, 1.3], [x + w * 0.21, y + s * 3.2, 1.3], [x + w * 0.32, y + s * 3.2, 1.3]], '#fff', 0.95) + L(`M${x},${y} h${w} v${h} h${-w} Z`, '#7f1d1d', 2); };

// ---- shared props -------------------------------------------------------------------------
const STARS = [[24, 40, 1.8], [70, 90, 1.2], [120, 30], [160, 120, 1.4], [210, 60], [250, 150, 1.2], [300, 40, 1.8], [330, 110], [40, 170, 1.2], [190, 200, 1.1], [280, 220, 1.3], [100, 230], [350, 250, 1.1], [140, 260, 1.2], [60, 300], [240, 290, 1.1], [320, 320, 1.2]];
const cloud = (x, y, s, c, op) => {
  const k = s || 1, col = c || '#ffffff';
  const d = `M${x - 34 * k},${y + 8 * k} C${x - 44 * k},${y - 6 * k} ${x - 26 * k},${y - 14 * k} ${x - 18 * k},${y - 8 * k} C${x - 16 * k},${y - 26 * k} ${x + 4 * k},${y - 28 * k} ${x + 8 * k},${y - 12 * k} C${x + 20 * k},${y - 20 * k} ${x + 34 * k},${y - 10 * k} ${x + 30 * k},${y + 2 * k} C${x + 42 * k},${y + 4 * k} ${x + 40 * k},${y + 14 * k} ${x + 28 * k},${y + 14 * k} L${x - 28 * k},${y + 14 * k} C${x - 40 * k},${y + 14 * k} ${x - 42 * k},${y + 10 * k} ${x - 34 * k},${y + 8 * k} Z`;
  return pr(d, col, { stroke: dark(col, 0.16), op }) + HL(`M${x - 24 * k},${y - 2 * k} C${x - 14 * k},${y - 14 * k} ${x + 2 * k},${y - 18 * k} ${x + 4 * k},${y - 10 * k} C${x - 6 * k},${y - 10 * k} ${x - 16 * k},${y - 4 * k} ${x - 24 * k},${y - 2 * k} Z`, 0.5);
};
const sun = (x, y, r, rays) => {
  const ray = rays ? rep(8, i => { const a = (i * Math.PI) / 4; return L(`M${(x + Math.cos(a) * (r + 10)).toFixed(1)},${(y + Math.sin(a) * (r + 10)).toFixed(1)} L${(x + Math.cos(a) * (r + 22)).toFixed(1)},${(y + Math.sin(a) * (r + 22)).toFixed(1)}`, '#fbbf24', 5); }) : '';
  return halo(x, y, r + 30, '#fff7cc', 1.5) + ray + cc(x, y, r, '#fde047', { stroke: '#f59e0b' }) + HL(`M${x - r * 0.6},${y - r * 0.2} C${x - r * 0.5},${y - r * 0.7} ${x - r * 0.1},${y - r * 0.8} ${x + r * 0.2},${y - r * 0.6} C${x - r * 0.1},${y - r * 0.5} ${x - r * 0.4},${y - r * 0.3} ${x - r * 0.6},${y - r * 0.2} Z`, 0.5);
};
const moon = (x, y, r) => halo(x, y, r + 26, '#fef3c7', 1) + cc(x, y, r, '#fef3c7', { stroke: '#e2c66e' }) +
  cc(x - r * 0.3, y - r * 0.25, r * 0.22, '#f3dfa0', { sw: 0 }) + cc(x + r * 0.3, y + r * 0.2, r * 0.3, '#f3dfa0', { sw: 0 }) + cc(x - r * 0.1, y + r * 0.45, r * 0.14, '#f3dfa0', { sw: 0 }) +
  HL(`M${x - r * 0.7},${y - r * 0.1} C${x - r * 0.6},${y - r * 0.7} ${x - r * 0.1},${y - r * 0.9} ${x + r * 0.3},${y - r * 0.7} C${x - r * 0.2},${y - r * 0.6} ${x - r * 0.5},${y - r * 0.4} ${x - r * 0.7},${y - r * 0.1} Z`, 0.45);
// palm tree: base at (x,y), height h, leaning dir (+1 right / -1 left)
const palm = (x, y, h, dir) => {
  const d = dir || 1, tx = x + d * h * 0.18, ty = y - h;
  const trunk = `M${x},${y} C${x + d * 4},${y - h * 0.4} ${tx - d * 6},${y - h * 0.7} ${tx},${ty}`;
  const leaf = (a, len) => G(pr(`M0,0 C${len * 0.3},-${len * 0.3} ${len * 0.7},-${len * 0.32} ${len},-4 C${len * 0.7},${len * 0.1} ${len * 0.3},${len * 0.16} 0,0 Z`, '#2f9e44', { stroke: '#1e6b2e' }) + L(`M4,0 L${len - 8},-4`, '#1e6b2e', 2, { op: 0.5 }), { transform: `translate(${tx} ${ty}) rotate(${a})` });
  return L(trunk, '#5a3a1a', 14) + L(trunk, '#9c6a3a', 9) + L(`M${x + 3},${y - 10} C${x + d * 6},${y - h * 0.4} ${tx - d * 4},${y - h * 0.7} ${tx + 1},${ty + 8}`, '#c08a52', 3, { op: 0.6 }) +
    rep(6, i => L(`M${x - 7 + d * i * 2},${y - 14 - i * 20} q6,-4 12,0`, '#5a3a1a', 2, { op: 0.5 })) +
    leaf(-150, 60) + leaf(-110, 66) + leaf(-70, 62) + leaf(-30, 60) + leaf(10, 56) + leaf(190, 50) +
    cc(tx - 6, ty + 2, 6, '#92400e') + cc(tx + 6, ty + 4, 6, '#92400e') + cc(tx, ty - 4, 6, '#b45309');
};
// pine tree: base (x,y), width w, height h
const pine = (x, y, w, h, snowy) => {
  const tier = (yy, ww, hh) => pr(`M${x},${yy - hh} L${x + ww / 2},${yy} L${x - ww / 2},${yy} Z`, '#1f7a4d', { stroke: '#135233' }) + SH(`M${x},${yy - hh} L${x + ww / 2},${yy} L${x + ww / 6},${yy} Z`, 0.16) +
    (snowy ? HL(`M${x},${yy - hh + 4} L${x + ww * 0.3},${yy - hh * 0.4} Q${x},${yy - hh * 0.28} ${x - ww * 0.3},${yy - hh * 0.4} Z`, 0.85) : '');
  return rr(x - 7, y - 20, 14, 24, 3, '#6b4423') + tier(y - 8, w, h * 0.45) + tier(y - h * 0.3, w * 0.8, h * 0.42) + tier(y - h * 0.55, w * 0.58, h * 0.4);
};
// round tree
const tree = (x, y, s, c) => {
  const k = s || 1, col = c || '#3fa34d';
  return rr(x - 9 * k, y - 60 * k, 18 * k, 64 * k, 5, '#8a5a2b') + L(`M${x - 2 * k},${y - 30 * k} L${x - 2 * k},${y - 6 * k}`, '#5c3a1a', 2, { op: 0.5 }) +
    cc(x - 26 * k, y - 66 * k, 24 * k, col) + cc(x + 26 * k, y - 68 * k, 24 * k, col) + cc(x, y - 92 * k, 28 * k, col) + cc(x, y - 66 * k, 30 * k, col, { sw: 0 }) +
    SH(`M${x + 10 * k},${y - 44 * k} C${x + 40 * k},${y - 50 * k} ${x + 44 * k},${y - 80 * k} ${x + 20 * k},${y - 104 * k} C${x + 30 * k},${y - 80 * k} ${x + 28 * k},${y - 54 * k} ${x + 10 * k},${y - 44 * k} Z`, 0.14) +
    HL(`M${x - 34 * k},${y - 76 * k} C${x - 30 * k},${y - 96 * k} ${x - 14 * k},${y - 108 * k} ${x - 2 * k},${y - 110 * k} C${x - 16 * k},${y - 100 * k} ${x - 26 * k},${y - 88 * k} ${x - 34 * k},${y - 76 * k} Z`, 0.3);
};
// yellow NYC cab, side view facing left; origin = ground under the front bumper, 124 wide
const cab = (x, y, night) => {
  const yel = '#f8c224', dk = '#8a5a08', gl = night ? '#9fc5ff' : '#bfdbfe';
  return at(x, y, ee(62, 0, 64, 6, '#000', { sw: 0, op: 0.3 }) +
    pr('M4,-24 L6,-40 Q8,-46 16,-46 L32,-46 L46,-66 L90,-66 L104,-46 L114,-46 Q120,-46 120,-40 L120,-24 Q120,-18 114,-18 L10,-18 Q4,-18 4,-24 Z', yel, { stroke: dk }) +
    pr('M36,-46 L48,-62 L64,-62 L64,-46 Z', gl, { stroke: dk, sw: 2.5 }) + pr('M70,-46 L70,-62 L88,-62 L98,-46 Z', gl, { stroke: dk, sw: 2.5 }) + HL('M40,-48 L50,-60 L58,-60 L48,-48 Z', 0.5) + HL('M74,-48 L74,-60 L82,-60 L82,-48 Z', 0.3) +
    L('M66,-46 V-20', dk, 2) + rr(70, -40, 9, 3, 1.5, dk, { sw: 0 }) + rr(52, -40, 9, 3, 1.5, dk, { sw: 0 }) +
    rep(9, i => rect(10 + i * 12, -36, 6, 5, '#1f2937') + rect(16 + i * 12, -31, 6, 5, '#1f2937')) +
    (night ? glow(68, -73, 18, '#fde68a', 0.3) : '') + rr(53, -79, 30, 12, 3, '#fde68a', { stroke: dk, sw: 2.5 }) + T(68, -70, 'TAXI', 9, '#1f2937') +
    (night ? glow(0, -36, 26, '#fef3c7', 0.14) + glow(0, -36, 14, '#fef3c7', 0.2) : '') + rr(4, -40, 7, 8, 2, '#fef9c3', { stroke: dk, sw: 2 }) + rr(113, -40, 7, 8, 2, '#ef4444', { stroke: dk, sw: 2 }) +
    rr(0, -26, 8, 7, 2, '#cbd5e1', { stroke: '#64748b', sw: 2 }) + rr(116, -26, 8, 7, 2, '#cbd5e1', { stroke: '#64748b', sw: 2 }) +
    HL('M48,-64 L88,-64 L86,-60 L50,-60 Z', 0.4) + HL('M8,-44 L30,-44 L28,-41 L10,-41 Z', 0.35) + SH('M8,-24 L116,-24 L116,-18 L8,-18 Z', 0.2) +
    cc(30, -12, 13, '#1f2937', { stroke: '#000' }) + cc(30, -12, 6, '#9ca3af', { stroke: '#4b5563', sw: 2 }) + cc(96, -12, 13, '#1f2937', { stroke: '#000' }) + cc(96, -12, 6, '#9ca3af', { stroke: '#4b5563', sw: 2 }));
};
// car, side view facing left; kind 'sport' (low wedge + spoiler) or 'ev' (crossover). origin = ground under the front bumper, 124 wide
const car = (x, y, col, kind) => {
  const dk = dark(col, 0.45), gl = '#bfdbfe', sport = kind === 'sport';
  const body = sport ? 'M2,-18 L6,-30 L36,-34 L54,-52 L96,-52 L110,-34 L122,-30 L124,-18 Q124,-12 118,-12 L8,-12 Q2,-12 2,-18 Z' : 'M2,-22 L4,-38 L30,-42 L46,-64 L96,-64 L112,-42 L122,-38 L124,-22 Q124,-16 118,-16 L8,-16 Q2,-16 2,-22 Z';
  const win = sport ? pr('M42,-34 L58,-48 L92,-48 L104,-34 Z', gl, { stroke: dk, sw: 2.5 }) + HL('M46,-36 L60,-46 L72,-46 L58,-36 Z', 0.5)
    : pr('M36,-42 L50,-60 L70,-60 L70,-42 Z', gl, { stroke: dk, sw: 2.5 }) + pr('M76,-42 L76,-60 L94,-60 L106,-42 Z', gl, { stroke: dk, sw: 2.5 }) + HL('M40,-44 L52,-58 L62,-58 L50,-44 Z', 0.5);
  const wy = sport ? -10 : -12, wr = sport ? 12 : 13;
  const wheel = (wx) => cc(wx, wy, wr, '#1f2937', { stroke: '#000' }) + cc(wx, wy, wr * 0.45, '#e5e7eb', { stroke: '#6b7280', sw: 2 });
  return at(x, y, ee(62, 0, 64, 6, '#000', { sw: 0, op: 0.3 }) + pr(body, col, { stroke: dk }) + win +
    (sport ? rr(102, -58, 24, 5, 2, dk, { sw: 0 }) + L('M112,-53 V-48', dk, 3) : L('M73,-62 V-18', dk, 2) + rr(58, -36, 10, 3, 1.5, dk, { sw: 0 }) + rr(80, -36, 10, 3, 1.5, dk, { sw: 0 })) +
    rr(4, sport ? -28 : -36, 8, 6, 2, '#fef9c3', { stroke: dk, sw: 2 }) + rr(112, sport ? -28 : -36, 8, 6, 2, '#ef4444', { stroke: dk, sw: 2 }) +
    HL(sport ? 'M8,-30 L34,-33 L34,-29 L10,-27 Z' : 'M6,-38 L28,-41 L28,-37 L8,-35 Z', 0.4) + HL(sport ? 'M56,-50 L94,-50 L92,-47 L58,-47 Z' : 'M48,-62 L94,-62 L92,-59 L50,-59 Z', 0.35) +
    SH(`M6,${wy - 8} L120,${wy - 8} L120,${wy - 2} L8,${wy - 2} Z`, 0.18) + wheel(30) + wheel(96));
};
const hydrant = (x, y) => at(x, y, ee(0, 2, 16, 5, '#000', { sw: 0, op: 0.25 }) + rr(-13, -8, 26, 9, 3, '#b91c1c', { stroke: '#7f1d1d' }) + rr(-9, -48, 18, 42, 7, '#ef4444', { stroke: '#7f1d1d' }) +
  rr(-18, -36, 36, 10, 4, '#ef4444', { stroke: '#7f1d1d' }) + cc(-18, -31, 5.5, '#dc2626', { stroke: '#7f1d1d', sw: 2 }) + cc(18, -31, 5.5, '#dc2626', { stroke: '#7f1d1d', sw: 2 }) +
  cc(0, -52, 10, '#ef4444', { stroke: '#7f1d1d' }) + cc(0, -54, 4, '#dc2626', { stroke: '#7f1d1d', sw: 2 }) + L('M-7,-18 H7', '#7f1d1d', 2) + HL('M-6,-44 h3 v26 h-3 Z', 0.35) + SH('M3,-44 h4 v30 h-4 Z', 0.16));
// modern street lamp with an arm to the right; origin = base centre; H = pole height
const lamp = (x, y, H) => at(x, y, halo(42, -H + 6, 96, '#fde68a', 1.9) + rr(-16, -9, 32, 10, 3, '#374151', { stroke: '#111827' }) + rr(-5, -H + 6, 10, H - 14, 3, '#374151', { stroke: '#111827' }) + rr(-9, -H + 10, 18, 6, 2, '#374151', { stroke: '#111827', sw: 2 }) +
  pr(`M-5,${-H + 6} Q-5,${-H - 10} 12,${-H - 10} L36,${-H - 10} L36,${-H} L12,${-H} Q5,${-H} 5,${-H + 6} Z`, '#374151', { stroke: '#111827' }) + rr(22, -H - 20, 42, 14, 4, '#374151', { stroke: '#111827' }) + rect(25, -H - 7, 36, 5, '#fde68a') + glow(43, -H - 2, 10, '#fff7cc', 0.7) +
  HL(`M-3,${-H + 12} h4 v${H - 24} h-4 Z`, 0.25) + HL(`M26,${-H - 18} h8 v4 h-8 Z`, 0.3));
const manhole = (x, y) => at(x, y, ee(0, 0, 20, 6, '#4b5563', { stroke: '#1f2937' }) + ee(0, 0, 13, 4, '#374151', { sw: 0 }) + L('M-9,-1 H9 M-7,2 H7', '#1f2937', 1.5));
const steam = (x, y) => at(x, y, glow(2, -12, 8, '#fff', 0.3) + glow(-4, -28, 10, '#fff', 0.25) + glow(4, -48, 13, '#fff', 0.2) + glow(-3, -72, 16, '#fff', 0.14) + glow(5, -100, 19, '#fff', 0.09));
const box = (x, y) => at(x, y, ee(0, 0, 32, 6, '#000', { sw: 0, op: 0.35 }) + rr(-27, -42, 54, 42, 3, '#c8a26a', { stroke: '#8a6a3a' }) + pr('M-27,-42 L0,-42 L-13,-56 L-37,-50 Z', '#b58d55', { stroke: '#8a6a3a' }) + pr('M0,-42 L27,-42 L25,-60 L-3,-56 Z', '#d6b57c', { stroke: '#8a6a3a' }) +
  L('M0,-38 V-2', '#8a6a3a', 2, { op: 0.6 }) + L('M-19,-20 L-7,-20 M7,-20 L19,-20', '#8a6a3a', 3, { op: 0.6 }) + SH('M13,-40 h14 v38 h-14 Z', 0.14) + HL('M-24,-39 h6 v36 h-6 Z', 0.22));
const trashBag = (x, y) => at(x, y, ee(0, 0, 26, 5, '#000', { sw: 0, op: 0.35 }) + pr('M-24,-2 C-32,-16 -28,-36 -12,-44 L-6,-58 L6,-46 C24,-38 30,-16 22,-2 Z', '#1f2937', { stroke: '#000' }) + L('M-6,-58 L-14,-66 M6,-46 L14,-56', '#1f2937', 4) +
  HL('M-18,-10 C-22,-24 -16,-36 -6,-40 C-12,-32 -16,-20 -18,-10 Z', 0.16) + SH('M6,-36 C18,-30 22,-16 18,-4 L4,-4 C10,-14 10,-26 6,-36 Z', 0.3));
const monstera = (x, y) => {
  const leaf = (a, s) => G(pr('M0,0 C10,-14 26,-24 44,-20 L36,-12 L48,-8 L38,-2 L48,6 L36,10 L44,20 C26,24 10,14 0,0 Z', '#16a34a', { stroke: '#14532d' }) + L('M4,0 L38,0', '#14532d', 2, { op: 0.5 }), { transform: `rotate(${a}) scale(${s})` });
  return at(x, y, ee(0, 0, 24, 6, '#000', { sw: 0, op: 0.3 }) + at(0, -44, leaf(-150, 1.1) + leaf(-110, 1.2) + leaf(-70, 1.1) + leaf(-30, 1) + leaf(-200, 0.9)) +
    pr('M-20,-44 L20,-44 L16,0 L-16,0 Z', '#f1f5f9', { stroke: '#94a3b8' }) + rr(-23, -50, 46, 10, 3, '#e2e8f0', { stroke: '#94a3b8' }) + SH('M8,-40 L16,-40 L13,-2 L6,-2 Z', 0.12) + HL('M-16,-40 h5 v36 h-5 Z', 0.4));
};
// low modern sofa, 100 wide; origin = ground under the left leg
const sofa = (x, y, col, p1, p2) => at(x, y, ee(50, 0, 56, 6, '#000', { sw: 0, op: 0.25 }) + rr(0, -56, 100, 30, 8, col, { stroke: dark(col, 0.4) }) + rr(-6, -34, 112, 26, 8, light(col, 0.12), { stroke: dark(col, 0.4) }) +
  rr(-8, -42, 14, 36, 6, dark(col, 0.12), { stroke: dark(col, 0.4) }) + rr(94, -42, 14, 36, 6, dark(col, 0.12), { stroke: dark(col, 0.4) }) + rr(12, -52, 32, 24, 7, p1, { stroke: dark(p1, 0.4) }) + rr(50, -52, 32, 24, 7, p2, { stroke: dark(p2, 0.4) }) +
  L('M50,-30 V-10', dark(col, 0.3), 2, { op: 0.5 }) + HL('M-2,-32 h40 v5 h-40 Z', 0.3) + SH('M60,-30 h44 v22 h-44 Z', 0.1) + rr(2, -8, 6, 8, 2, '#111827', { stroke: '#000', sw: 2 }) + rr(92, -8, 6, 8, 2, '#111827', { stroke: '#000', sw: 2 }));
// flat TV showing a streaming grid; origin = top-left
const tv = (x, y, w, h) => { const tw = (w - 20) / 4, th = (h - 20) / 3, pal = ['#ec4899', '#22d3ee', '#a855f7', '#f59e0b', '#22c55e', '#3b82f6'];
  return at(x, y, rr(0, 0, w, h, 4, '#111827', { stroke: '#000' }) + rect(6, 6, w - 12, h - 12, '#0f172a') + rep(3, i => rep(4, j => rr(10 + j * tw, 12 + i * th, tw - 4, th - 4, 2, pal[(i * 4 + j) % 6], { sw: 0, op: 0.9 }))) +
    F(`M${10 + tw * 0.35},${12 + th * 0.25} L${10 + tw * 0.75},${12 + th * 0.5} L${10 + tw * 0.35},${12 + th * 0.75} Z`, '#fff') + HL(`M8,8 h10 v${h - 16} h-10 Z`, 0.08) + cc(w / 2, h - 3, 1.5, '#22c55e', { sw: 0 })); };
// pendant lamp hanging from the ceiling at x down to y
const pendant = (x, y, col) => L(`M${x},0 V${y - 20}`, '#1f2937', 2.5) + halo(x, y + 14, 46, '#fde68a', 1.2) + pr(`M${x - 22},${y} L${x + 22},${y} L${x + 14},${y - 22} L${x - 14},${y - 22} Z`, col, { stroke: dark(col, 0.4) }) + rect(x - 18, y - 2, 36, 4, '#fde68a') + HL(`M${x - 12},${y - 20} h6 v18 h-6 Z`, 0.3);
const fence = (x0, x1, y, h) => rr(x0 - 2, y - h * 0.72, x1 - x0 + 4, 6, 2, '#f8fafc', { stroke: '#94a3b8', sw: 2.5 }) + rr(x0 - 2, y - h * 0.32, x1 - x0 + 4, 6, 2, '#f8fafc', { stroke: '#94a3b8', sw: 2.5 }) +
  rep(Math.floor((x1 - x0) / 18), i => { const px = x0 + 4 + i * 18; return pr(`M${px},${y} V${y - h + 8} L${px + 6},${y - h} L${px + 12},${y - h + 8} V${y} Z`, '#f8fafc', { stroke: '#94a3b8', sw: 2.5 }) + SH(`M${px + 8},${y - h + 10} h3 v${h - 12} h-3 Z`, 0.08); });
const mailbox = (x, y) => at(x, y, ee(0, 0, 14, 4, '#000', { sw: 0, op: 0.25 }) + rr(-4, -52, 8, 52, 2, '#6b4423', { stroke: '#3f2a14' }) + rr(-18, -74, 36, 24, 8, '#1e3a8a', { stroke: '#111827' }) + rr(-18, -62, 36, 4, 1, '#111827', { sw: 0 }) +
  rr(16, -84, 4, 16, 1.5, '#ef4444', { stroke: '#7f1d1d', sw: 1.5 }) + HL('M-14,-70 h10 v8 h-10 Z', 0.3) + T(0, -53, '12', 8, '#fff'));
const lounger = (x, y, col) => at(x, y, ee(44, 0, 48, 5, '#000', { sw: 0, op: 0.25 }) + rr(0, -26, 60, 10, 3, '#f8fafc', { stroke: '#94a3b8' }) + pr('M60,-26 L84,-58 L92,-54 L68,-18 Z', '#f8fafc', { stroke: '#94a3b8' }) +
  rr(2, -24, 56, 7, 2, col, { sw: 0 }) + rep(4, i => rect(6 + i * 13, -24, 6, 7, light(col, 0.45))) + pr('M64,-26 L82,-52 L88,-50 L70,-24 Z', col, { sw: 0 }) + L('M6,-16 V-2 M54,-16 V-2 M80,-20 V-2', '#94a3b8', 3) + HL('M4,-25 h20 v3 h-20 Z', 0.4));
const speaker = (x, y) => rr(x, y, 60, 140, 6, '#1f2937', { stroke: '#000' }) + cc(x + 30, y + 36, 22, '#374151', { stroke: '#000' }) + cc(x + 30, y + 36, 8, '#111', { stroke: '#000' }) + cc(x + 30, y + 100, 26, '#374151', { stroke: '#000' }) + cc(x + 30, y + 100, 10, '#111', { stroke: '#000' }) +
  HL(`M${x + 12},${y + 28} C${x + 14},${y + 20} ${x + 24},${y + 16} ${x + 30},${y + 18} C${x + 22},${y + 20} ${x + 16},${y + 26} ${x + 12},${y + 28} Z`, 0.25) + rr(x + 6, y + 6, 48, 6, 2, '#4b5563', { stroke: '#000', sw: 2 }) + cc(x + 52, y + 130, 3, '#22c55e', { sw: 0 });

// ---- story homes ---------------------------------------------------------------------------
// 0 — NYC sidewalk at night: glass towers, neon, graffiti, a parked cab, the hero's cardboard "home" under a street lamp
function sidewalk() {
  const sky = '#0e1636', wallC = '#7a3f32', walk = '#5f6775';
  return band(0, 640, sky) + dots(STARS.slice(0, 12), '#fff', 0.8) + moon(306, 62, 18) +
    tower(14, 120, 34, 180, '#172149', '#3d5290', { p: 4, spire: 28, sw: 2 }) + tower(104, 96, 44, 204, '#172149', '#3d5290', { p: 4, crown: 26, sw: 2 }) + tower(232, 110, 38, 190, '#172149', '#3d5290', { p: 4, sw: 2 }) + tower(300, 134, 60, 170, '#172149', '#3d5290', { p: 4, spire: 24, sw: 2 }) +
    tower(-10, 176, 62, 130, '#22305e', '#fde68a', { lit2: '#7dd3fc' }) + tower(56, 140, 46, 166, '#243568', '#fde68a', { lit2: '#7dd3fc', spire: 34 }) + tower(150, 112, 56, 194, '#22305e', '#fde68a', { lit2: '#7dd3fc', crown: 30 }) +
    tower(212, 178, 40, 128, '#243568', '#fcd34d', { lit2: '#7dd3fc' }) + tower(258, 150, 54, 156, '#22305e', '#fde68a', { lit2: '#7dd3fc' }) + tower(318, 190, 50, 116, '#243568', '#fcd34d', { lit2: '#7dd3fc' }) +
    // building: cornice + brick wall + shuttered store front behind the hero
    rect(0, 288, 360, 14, '#3f4756') + L('M0,288 H360', '#1f2937', 2.5) + rect(0, 302, 360, 134, wallC) + bricks(302, 436, dark(wallC, 0.32)) + HL('M0,302 H360 V308 H0 Z', 0.1) + L('M0,302 H360', dark(wallC, 0.5), 2.5) +
    rr(136, 318, 90, 118, 3, '#4b5563', { stroke: '#1f2937' }) + rep(9, i => L(`M140,${330 + i * 12} H222`, '#374151', 2)) + rr(130, 310, 102, 10, 3, '#374151', { stroke: '#1f2937' }) +
    // neon pizza sign (right lane) + graffiti tag (left lane)
    halo(286, 342, 62, '#ff4fd8', 1.3) + rr(240, 318, 92, 48, 6, '#111827', { stroke: '#000' }) + L('M248,326 h76 v32 h-76 Z', '#22d3ee', 6, { op: 0.25 }) + L('M248,326 h76 v32 h-76 Z', '#22d3ee', 2) + neon(286, 352, 'PIZZA', 24, '#ff4fd8') +
    tag(100, 386, 'RISE', 32, '#f472b6', '#22d3ee') + L('M78,388 V402 M112,388 V398', '#f472b6', 3, { op: 0.8 }) + dots([[134, 356, 2.5], [62, 366, 2], [130, 392, 1.8]], '#22d3ee', 0.8) +
    // pavement + curb + road
    rect(0, 436, 360, 204, walk) + rect(0, 436, 360, 14, '#8b94a3') + L('M0,436 H360 M0,450 H360', '#3d4452', 2.5) + L('M90,450 V596 M200,450 V596 M300,450 V596 M0,524 H360', '#4b525f', 2) +
    rect(0, 596, 360, 10, '#9ca3af') + L('M0,596 H360', '#3d4452', 2) + rect(0, 606, 360, 34, '#262b38') + L('M0,628 H360', '#facc15', 3, { dash: '18 12', op: 0.8 }) +
    // props: lamp + cardboard box + trash bag (left), cab + hydrant + steaming manhole (right)
    lamp(44, 484, 150) + box(82, 494) + trashBag(114, 498) +
    cab(262, 492, true) + hydrant(246, 496) + manhole(334, 548) + steam(334, 548);
}

// 1 — Brooklyn studio: exposed brick, fire-escape window at dusk, mini fridge, poster, LED strip, mattress on a pallet
function studio() {
  const wall = '#b9644b', mortar = '#8a4432', floor = '#c69c6d';
  let planks = '';
  for (let y = 476; y < 640; y += 34) planks += `M0,${y} H360 `;
  for (let i = 0; i < 6; i++) planks += `M${40 + i * 62},${442 + (i % 2) * 34} V${476 + (i % 2) * 34} `;
  return band(0, 640, wall) + bricks(0, 436, mortar, 20) + HL('M0,0 H360 V120 H0 Z', 0.06) +
    rect(0, 424, 360, 14, '#e7d8c4') + L('M0,424 H360', '#a68a6e', 2.5) +
    rect(0, 438, 360, 202, floor) + L(planks, dark(floor, 0.25), 2) + L('M0,438 H360', dark(floor, 0.45), 2.5) + HL('M0,440 H360 V446 H0 Z', 0.12) +
    // fire-escape window (left): black steel frame, dusk city outside, iron railing + stair
    rr(24, 104, 104, 226, 4, '#1f2937', { stroke: '#000' }) + rect(32, 112, 88, 70, '#c4b5fd') + rect(32, 182, 88, 50, '#f9a8d4') + rect(32, 232, 88, 90, '#fdba74') +
    sil([[32, 222, 14, 100], [48, 200, 12, 122, 10], [62, 236, 18, 86], [82, 190, 10, 132, 14], [94, 216, 16, 106], [112, 230, 8, 92]], '#4c1d95') + dots([[40, 240], [54, 212], [70, 250], [86, 206], [100, 234], [52, 262], [88, 258], [68, 282], [116, 244]], '#fde68a', 0.9) +
    L('M32,250 H120 M32,262 H120', '#111827', 3) + rep(8, i => L(`M${38 + i * 11},250 V300`, '#111827', 2.5)) + L('M32,300 H120', '#111827', 3) + L('M120,300 L96,322 M120,290 L92,314', '#111827', 2.5) + rep(4, i => L(`M${114 - i * 6},${297 + i * 6} l-6,-5`, '#111827', 2)) +
    L('M76,112 V322 M32,182 H120 M32,252 H120', '#1f2937', 5) + rr(16, 326, 120, 10, 3, '#374151', { stroke: '#111827' }) + HL('M34,114 L66,114 L34,150 Z', 0.3) +
    // mini fridge with magnets + a succulent on top (left)
    ee(74, 494, 34, 6, '#000', { sw: 0, op: 0.25 }) + rr(44, 404, 60, 90, 5, '#f1f5f9', { stroke: '#64748b' }) + L('M48,436 H100', '#94a3b8', 2) + rr(92, 412, 5, 18, 2, '#374151', { stroke: '#111827', sw: 2 }) + rr(92, 442, 5, 30, 2, '#374151', { stroke: '#111827', sw: 2 }) +
    cc(60, 420, 4, '#ef4444', { sw: 0 }) + cc(70, 416, 4, '#22d3ee', { sw: 0 }) + rr(56, 448, 14, 10, 2, '#facc15', { stroke: '#a16207', sw: 1.5 }) + cc(50, 490, 2, '#22c55e', { sw: 0 }) + HL('M48,408 h6 v80 h-6 Z', 0.5) + SH('M86,406 h14 v84 h-14 Z', 0.08) +
    rr(60, 390, 20, 14, 3, '#f97316', { stroke: '#9a3412' }) + cc(70, 384, 8, '#22c55e', { stroke: '#14532d' }) + cc(63, 380, 6, '#4ade80', { stroke: '#14532d', sw: 2 }) + cc(77, 380, 6, '#4ade80', { stroke: '#14532d', sw: 2 }) +
    // poster (right wall)
    rr(252, 150, 80, 104, 3, '#111827', { stroke: '#000' }) + T(292, 184, 'BKLYN', 20, '#f8fafc') + cc(292, 218, 20, '#f97316', { stroke: '#7c2d12' }) + L('M272,218 H312 M292,198 V238 M278,204 Q292,218 278,232 M306,204 Q292,218 306,232', '#7c2d12', 2) + HL('M256,154 h8 v96 h-8 Z', 0.08) +
    rect(252, 146, 12, 6, '#cbd5e1') + rect(320, 250, 12, 6, '#cbd5e1') +
    // floating shelf: bluetooth speaker, books, a vinyl record (right wall)
    rr(244, 312, 100, 8, 2, '#374151', { stroke: '#111827' }) + rr(250, 292, 36, 20, 5, '#1f2937', { stroke: '#000' }) + dots([[258, 302, 2], [266, 302, 2], [274, 302, 2]], '#22d3ee', 0.9) + HL('M254,295 h10 v3 h-10 Z', 0.3) +
    rr(292, 286, 10, 26, 2, '#ef4444', { stroke: '#7f1d1d', sw: 2 }) + rr(304, 290, 9, 22, 2, '#3b82f6', { stroke: '#1e3a8a', sw: 2 }) + cc(328, 298, 14, '#111827', { stroke: '#000' }) + cc(328, 298, 5, '#f472b6', { sw: 0 }) + L('M318,292 A12,12 0 0 1 326,286', '#4b5563', 1.5) +
    // skateboard leaning on the wall beside the fridge
    G(rr(-8, -88, 16, 88, 8, '#22d3ee', { stroke: '#0e7490' }) + rect(-8, -70, 16, 10, '#f472b6') + rect(-8, -34, 16, 10, '#fde047') + cc(-10, -66, 4, '#111827', { stroke: '#000', sw: 1.5 }) + cc(-10, -24, 4, '#111827', { stroke: '#000', sw: 1.5 }) + HL('M-5,-84 h3 v80 h-3 Z', 0.4), { transform: 'translate(118 494) rotate(14)' }) +
    // LED strip on the wall behind the bed + glow
    halo(292, 396, 70, '#ff2d95', 1.3) + rr(232, 392, 122, 6, 3, '#ff2d95', { stroke: '#9d174d', sw: 2 }) + rep(10, i => cc(240 + i * 12, 395, 1.6, '#fff', { sw: 0, op: 0.8 })) +
    // pallet + mattress + pillow + blanket (right)
    ee(296, 500, 60, 6, '#000', { sw: 0, op: 0.2 }) + rr(236, 484, 116, 10, 2, '#b08350', { stroke: '#6b4423' }) + rr(242, 494, 10, 6, 1, '#8a5a2b', { stroke: '#6b4423', sw: 2 }) + rr(292, 494, 10, 6, 1, '#8a5a2b', { stroke: '#6b4423', sw: 2 }) + rr(336, 494, 10, 6, 1, '#8a5a2b', { stroke: '#6b4423', sw: 2 }) + L('M260,486 V494 M284,486 V494 M308,486 V494 M330,486 V494', '#6b4423', 2) +
    rr(240, 448, 108, 36, 8, '#f8fafc', { stroke: '#94a3b8' }) + dots([[260, 466], [284, 466], [308, 466], [332, 466]], '#cbd5e1', 1) + L('M244,470 H344', '#cbd5e1', 2) +
    pr('M240,462 L300,462 L296,484 L242,484 Z', '#8b5cf6', { stroke: '#4c1d95' }) + L('M250,474 H290', '#a78bfa', 3) + HL('M244,465 h40 v5 h-40 Z', 0.3) +
    rr(302, 450, 42, 20, 7, '#fff', { stroke: '#94a3b8' }) + HL('M308,454 h26 v5 h-26 Z', 0.5) +
    // sneakers kicked off beside the bed
    pr('M212,492 L238,492 L238,482 Q226,478 216,484 Z', '#ef4444', { stroke: '#7f1d1d', sw: 2.5 }) + rect(212, 489, 26, 3, '#f8fafc') + pr('M226,500 L252,500 L252,490 Q240,486 230,492 Z', '#ef4444', { stroke: '#7f1d1d', sw: 2.5 }) + rect(226, 497, 26, 3, '#f8fafc');
}

// 2 — Manhattan loft: floor-to-ceiling glass wall on the dusk skyline, pendants, TV wall, monstera, low sofa, arc lamp, rug
function loft() {
  const floor = '#d9b98a';
  let planks = '';
  for (let y = 470; y < 640; y += 34) planks += `M0,${y} H360 `;
  for (let i = 0; i < 7; i++) planks += `M${20 + i * 56},${436 + (i % 2) * 34} V${470 + (i % 2) * 34} `;
  const tw = (x, y, w, h, o) => tower(x, y, w, h, '#3b2a5c', '#fdba74', Object.assign({ p: 5, sw: 2, cw: 4, ch: 6, gx: 9, gy: 11 }, o || {}));
  return bands([[0, 150, '#312e81'], [150, 90, '#7c3aed'], [240, 70, '#ec4899'], [310, 60, '#f97316'], [370, 70, '#fbbf24']]) + dots(STARS.slice(0, 8), '#fff', 0.7) +
    halo(96, 298, 70, '#fff7cc', 1.2) + cc(96, 298, 26, '#fde047', { stroke: '#f59e0b', sw: 2.5 }) + HL('M82,292 C84,282 92,276 102,276 C92,280 86,286 82,292 Z', 0.5) +
    sil([[-6, 330, 40, 100], [150, 300, 40, 130, 20], [196, 340, 30, 90], [230, 296, 30, 134], [330, 316, 40, 114]], '#4c2a6b') +
    tw(26, 236, 40, 194) + at(46, 236, pr('M-12,0 L-12,-26 L-6,-26 L-6,-44 L6,-44 L6,-26 L12,-26 L12,0 Z', '#3b2a5c', { stroke: dark('#3b2a5c', 0.4), sw: 2 }) + L('M0,-44 V-82', '#3b2a5c', 3) + glow(0, -82, 5, '#ef4444', 0.8)) +
    tw(124, 268, 30, 162) + tw(160, 240, 38, 190) + tw(206, 290, 30, 140) + tw(248, 200, 40, 230, { spire: 52 }) + tw(296, 276, 44, 154) + tw(344, 250, 36, 180) +
    // glass wall: reflections, black mullions, floor track
    HL('M30,0 L90,0 L0,160 L0,80 Z', 0.07) + HL('M300,0 L360,0 L360,40 L250,220 L250,120 Z', 0.07) +
    rep(4, i => rect(i * 120 - 4, 0, 8, 430, '#1f2937')) + rect(0, 212, 360, 5, '#1f2937') + rect(0, 426, 360, 12, '#1f2937') +
    rect(0, 438, 360, 202, floor) + L(planks, dark(floor, 0.22), 2) + L('M0,438 H360', dark(floor, 0.45), 2.5) + HL('M0,440 H360 V448 H0 Z', 0.12) +
    // rug (the hero stands on it)
    ee(180, 560, 130, 32, '#c7d2fe', { stroke: '#6366f1' }) + ee(180, 560, 100, 22, '#e0e7ff', { stroke: '#6366f1', sw: 2 }) + L('M100,560 H260 M180,540 V580', '#a5b4fc', 2.5) + HL('M60,552 C100,536 260,536 300,552 C260,544 100,544 60,552 Z', 0.3) +
    pendant(90, 160, '#111827') + pendant(180, 118, '#111827') + pendant(270, 160, '#111827') +
    // TV on a white console + soundbar (left)
    ee(72, 496, 56, 6, '#000', { sw: 0, op: 0.2 }) + rr(16, 440, 112, 36, 4, '#f8fafc', { stroke: '#94a3b8' }) + L('M72,444 V472', '#cbd5e1', 2) + rr(22, 476, 8, 18, 2, '#1f2937', { stroke: '#000', sw: 2 }) + rr(114, 476, 8, 18, 2, '#1f2937', { stroke: '#000', sw: 2 }) +
    rr(40, 454, 20, 6, 2, '#94a3b8', { sw: 0 }) + rr(84, 454, 20, 6, 2, '#94a3b8', { sw: 0 }) + HL('M20,443 h100 v4 h-100 Z', 0.5) +
    rr(30, 426, 84, 10, 3, '#374151', { stroke: '#111827' }) + dots([[40, 431], [48, 431], [56, 431]], '#22d3ee', 0.9) + tv(14, 334, 116, 76) +
    // arc floor lamp + sofa + monstera (right)
    L('M352,494 Q352,370 304,372', '#374151', 5) + rr(338, 490, 28, 8, 3, '#374151', { stroke: '#111827' }) + glow(304, 402, 26, '#fde68a', 0.3) + pr('M290,372 L318,372 L312,392 L296,392 Z', '#111827', { stroke: '#000' }) + rect(296, 390, 16, 3, '#fde68a') +
    monstera(242, 496) + sofa(262, 498, '#4b5563', '#f472b6', '#22d3ee');
}

// 3 — Suburban home: modern two-storey house, porch with the flag, EV on the driveway, lawn, white fence, mailbox
function suburb() {
  const grass = '#6cc04a', house = '#f8fafc';
  const win = (x, y, w, h) => rr(x, y, w, h, 3, '#7dd3fc', { stroke: '#1f2937' }) + HL(`M${x + 4},${y + 4} L${x + w * 0.45},${y + 4} L${x + 4},${y + h * 0.6} Z`, 0.5) + L(`M${x + w / 2},${y} V${y + h}`, '#1f2937', 3) + SH(`M${x + w - 10},${y + 4} h7 v${h - 8} h-7 Z`, 0.1);
  return band(0, 640, '#8fd3f4') + sun(60, 72, 28, true) + cloud(200, 70, 0.8) + cloud(300, 130, 0.55) + cloud(120, 160, 0.5) +
    pr('M-10,386 C60,356 120,370 180,380 C240,360 300,366 370,384 V440 H-10 Z', '#4fa84a', { stroke: '#3a8a36' }) + tree(60, 404, 1.15) + tree(130, 410, 0.75, '#56b45a') +
    // house: roof slab, body, wood accent, windows, floor divider
    rr(160, 162, 240, 16, 3, '#374151', { stroke: '#1f2937' }) + rr(170, 176, 224, 262, 4, house, { stroke: '#94a3b8' }) + SH('M356,180 h34 v254 h-34 Z', 0.08) +
    rect(170, 176, 20, 262, '#d6a26a') + rep(10, i => L(`M172,${184 + i * 25} H188`, '#9a6a3a', 2)) + L('M190,176 V438', '#94a3b8', 2.5) + rect(190, 296, 204, 6, '#cbd5e1') +
    win(196, 194, 50, 60) + win(252, 194, 50, 60) + win(196, 314, 62, 80) +
    // porch: canopy, door, light, glass side panel, post, steps, flag
    rr(284, 292, 110, 10, 3, '#374151', { stroke: '#1f2937' }) + rr(300, 302, 46, 112, 3, '#1e3a8a', { stroke: '#111827' }) + rr(336, 350, 4, 24, 2, '#e5e7eb', { sw: 0 }) + HL('M304,306 h8 v100 h-8 Z', 0.12) +
    rr(350, 302, 22, 112, 2, '#7dd3fc', { stroke: '#1f2937', sw: 2.5 }) + HL('M352,306 h8 v50 h-8 Z', 0.5) + rr(376, 302, 10, 134, 3, '#e5e7eb', { stroke: '#94a3b8' }) +
    glow(290, 318, 16, '#fde68a', 0.5) + cc(290, 318, 5, '#fde68a', { stroke: '#92400e', sw: 2 }) +
    rr(286, 414, 112, 12, 3, '#9ca3af', { stroke: '#4b5563' }) + rr(282, 426, 120, 12, 3, '#9ca3af', { stroke: '#4b5563' }) +
    L('M318,292 V236', '#374151', 4) + cc(318, 234, 3.5, '#f59e0b', { sw: 0 }) + usFlag(320, 238, 40, 24) +
    // lawn with mowing stripes, driveway, fence, mailbox, EV + charger
    rect(0, 438, 360, 202, grass) + L('M0,438 H360', '#3f8f3a', 2.5) + rep(3, i => rect(0, 466 + i * 60, 360, 30, '#78cc58')) +
    poly(['232,438', '360,438', '360,640', '176,640'], '#cbd5e1') + L('M232,438 L176,640', '#94a3b8', 3) + L('M300,446 L292,640', '#e5e7eb', 2, { op: 0.6 }) +
    fence(0, 150, 436, 46) + mailbox(60, 494) +
    rr(222, 450, 14, 44, 3, '#f8fafc', { stroke: '#64748b' }) + cc(229, 460, 2.5, '#22c55e', { sw: 0 }) + L('M234,470 Q246,462 250,452', '#1f2937', 3) + car(240, 492, '#22d3ee', 'ev');
}

// 4 — Beverly Hills mansion: golden sunset, HOLLYWOOD on the hills, white modern villa, palms, infinity pool, sports car
function mansion() {
  const glass = (x, y, w, h) => rr(x, y, w, h, 3, '#fde68a', { stroke: '#1f2937' }) + rep(Math.floor(w / 32), i => L(`M${x + 32 + i * 32},${y} V${y + h}`, '#1f2937', 2.5)) + HL(`M${x + 4},${y + 4} L${x + w * 0.3},${y + 4} L${x + 4},${y + h * 0.5} Z`, 0.4) + SH(`M${x + w - 12},${y + 4} h8 v${h - 8} h-8 Z`, 0.08);
  return bands([[0, 70, '#7e22ce'], [70, 70, '#a21caf'], [140, 70, '#e879f9'], [210, 60, '#fb923c'], [270, 70, '#fbbf24'], [340, 100, '#fde68a']]) + halo(130, 300, 90, '#fff7cc', 1.4) + cc(130, 300, 36, '#fde047', { stroke: '#f59e0b', sw: 2.5 }) + HL('M110,294 C112,280 124,272 136,272 C124,278 116,286 110,294 Z', 0.5) +
    L('M40,210 q8,-8 16,0 q8,-8 16,0 M250,150 q7,-7 14,0 q7,-7 14,0', '#7c2d12', 2.5, { op: 0.6 }) +
    pr('M-10,340 C40,300 90,296 150,330 C200,300 260,306 300,336 C330,320 350,322 370,330 V440 H-10 Z', '#9f7aea', { stroke: '#7c5cc4' }) + hollywood(96, 334, 10) +
    pr('M-10,392 C60,360 140,372 200,392 C260,370 320,376 370,398 V440 H-10 Z', '#6d5a95', { stroke: '#4c3d6e' }) + dots([[30, 396], [70, 384], [110, 392], [330, 400], [350, 394]], '#fde68a', 0.9) + HL('M-10,398 C60,366 140,378 200,398 L200,402 C140,384 60,372 -10,404 Z', 0.15) +
    palm(372, 440, 270, -1) + palm(20, 440, 180, 1) +
    // villa: lower box, cantilevered upper box, roof slabs, glass, door
    rr(150, 304, 240, 134, 4, '#f8fafc', { stroke: '#a1a1aa' }) + SH('M356,308 h30 v126 h-30 Z', 0.08) + HL('M154,308 h6 v126 h-6 Z', 0.5) +
    glass(166, 322, 64, 98) + glass(240, 322, 64, 98) + rr(318, 328, 40, 92, 3, '#111827', { stroke: '#000' }) + rr(352, 364, 3, 24, 1.5, '#e5e7eb', { sw: 0 }) + glow(338, 374, 14, '#fde68a', 0.25) +
    rr(188, 198, 212, 110, 4, '#f1f5f9', { stroke: '#a1a1aa' }) + rr(180, 188, 228, 12, 3, '#4b5563', { stroke: '#1f2937' }) + glass(204, 216, 170, 58) + rr(188, 300, 212, 8, 2, '#4b5563', { stroke: '#1f2937' }) +
    L('M192,284 H396', '#94a3b8', 2) + rep(8, i => L(`M${204 + i * 24},284 V296`, '#94a3b8', 2)) + SPARK(214, 232, 7) + SPARK(330, 350, 6) +
    // stone deck, infinity pool (left) + sports car (right)
    rect(0, 438, 360, 202, '#e4e4e7') + L('M0,438 H360', '#a1a1aa', 2.5) + L('M120,438 V640 M240,438 V640 M0,520 H360 M0,600 H360', '#c4c4c8', 2) +
    rr(-20, 450, 130, 58, 10, '#22d3ee', { stroke: '#0e7490' }) + rect(-20, 452, 130, 7, '#a5f3fc') + L('M-10,470 q10,-5 20,0 q10,5 20,0 q10,-5 20,0 q10,5 20,0 M10,488 q10,-5 20,0 q10,5 20,0 q10,-5 20,0', '#fff', 2.5, { op: 0.7 }) + SH('M84,456 h20 v48 h-20 Z', 0.08) +
    cc(56, 482, 14, '#f472b6', { stroke: '#be185d' }) + cc(56, 482, 6, '#22d3ee', { sw: 0 }) + HL('M46,476 C48,470 54,468 58,470 C52,472 48,474 46,476 Z', 0.6) +
    rr(116, 470, 10, 20, 3, '#f8fafc', { stroke: '#94a3b8', sw: 2 }) + rect(118, 476, 6, 10, '#f97316') + L('M121,470 V462', '#ef4444', 2) + cc(124, 468, 2.5, '#22c55e', { sw: 0 }) +
    car(240, 494, '#ef4444', 'sport');
}

export const TIER_SCENES = [sidewalk, studio, loft, suburb, mansion];

// ---- special scenes (bg items) -------------------------------------------------------------
const crowdRow = (y, offset, cols) => rep(18, i => { const x = 10 + i * 20 + offset, col = cols[i % cols.length]; return rr(x - 8, y + 6, 16, 12, 5, col, { sw: 0 }) + cc(x, y, 7, col, { sw: 0 }) + cc(x - 2, y - 2, 2, '#fff', { sw: 0, op: 0.5 }); });
const floodTower = (x) => rr(x - 4, 66, 8, 160, 2, '#6b7280', { stroke: '#374151' }) + L(`M${x - 4},90 L${x + 4},110 M${x + 4},90 L${x - 4},110 M${x - 4},130 L${x + 4},150 M${x + 4},130 L${x - 4},150`, '#374151', 2) +
  halo(x, 50, 70, '#fff', 1.4) + rr(x - 26, 36, 52, 30, 4, '#374151', { stroke: '#111827' }) + dots([[x - 16, 46, 4], [x, 46, 4], [x + 16, 46, 4], [x - 16, 58, 4], [x, 58, 4], [x + 16, 58, 4]], '#fef9c3', 1);
const billboard = (x, y, w, h, col, inner) => halo(x + w / 2, y + h / 2, w * 0.7, col, 0.8) + rr(x, y, w, h, 3, col, { stroke: dark(col, 0.5), sw: 2.5 }) + inner + HL(`M${x + 4},${y + 4} h6 v${h - 8} h-6 Z`, 0.14) + SH(`M${x + w - 10},${y + 4} h6 v${h - 8} h-6 Z`, 0.1);

export const TEMPLATES = {
  times_square: (c) => {
    const a = c.a || '#ff2d95';
    return { scene: band(0, 640, '#0b1030') +
      tower(118, -20, 124, 420, '#1a2550', '#fde68a', { p: 3, lit2: '#7dd3fc' }) + rr(150, 60, 60, 300, 4, '#111827', { stroke: '#000' }) + rep(6, i => rect(156, 68 + i * 48, 48, 38, [a, '#22d3ee', '#facc15', '#f8fafc', '#a3e635', '#f97316'][i], { op: 0.9 })) +
      // left stack of billboards
      billboard(-6, 36, 130, 96, '#22d3ee', cc(58, 84, 26, '#fff', { sw: 0 }) + cc(58, 84, 16, '#22d3ee', { sw: 0 }) + cc(58, 84, 7, '#fff', { sw: 0 })) +
      billboard(-6, 142, 130, 96, a, rep(5, i => rect(-6 + i * 30 + 8, 142, 14, 96, '#fff', { op: 0.18 })) + T(58, 202, 'LIVE', 34, '#fff', { stroke: dark(a, 0.5), sw: 3 })) +
      billboard(-6, 248, 130, 110, '#facc15', T(58, 320, 'NYC', 46, '#111827') + dots([[14, 262, 3], [102, 262, 3], [14, 344, 3], [102, 344, 3]], '#111827', 0.8)) +
      // right stack
      billboard(236, 30, 130, 96, '#ef4444', T(300, 92, 'HOT', 36, '#fff', { stroke: '#7f1d1d', sw: 3 }) + L('M250,106 H350', '#fff', 4, { op: 0.6 })) +
      billboard(236, 136, 130, 96, '#3b82f6', STAR(300, 184, 34, '#fff', { sw: 0 }) + STAR(300, 184, 16, '#3b82f6', { sw: 0 })) +
      billboard(236, 242, 130, 116, '#a3e635', cc(300, 300, 36, '#facc15', { stroke: '#a16207' }) + dots([[288, 292, 4], [312, 292, 4]], '#111827', 1) + L('M284,308 Q300,324 316,308', '#111827', 4)) +
      // wet asphalt with colour reflections + sidewalk
      band(400, 240, '#1f2541') + L('M0,400 H360', '#0b1030', 2.5) + ee(58, 480, 76, 18, a, { sw: 0, op: 0.12 }) + ee(58, 480, 44, 10, a, { sw: 0, op: 0.12 }) + ee(300, 480, 76, 18, '#22d3ee', { sw: 0, op: 0.12 }) + ee(300, 480, 44, 10, '#22d3ee', { sw: 0, op: 0.12 }) +
      L('M0,440 H360 M0,520 H360 M0,600 H360', '#2a3152', 2) + L('M120,400 V640 M240,400 V640', '#2a3152', 2) +
      // hot dog cart (left) + Broadway sign post with a traffic light (right)
      at(80, 494, ee(0, 0, 44, 6, '#000', { sw: 0, op: 0.3 }) + rr(-3, -112, 6, 50, 2, '#374151', { stroke: '#111827' }) + pr('M-48,-110 Q0,-150 48,-110 Z', '#3b82f6', { stroke: '#1e3a8a' }) + F('M-30,-111 Q-14,-141 -2,-147 Q-6,-128 -14,-111 Z', '#facc15') + F('M14,-111 Q6,-128 2,-147 Q14,-141 30,-111 Z', '#facc15') + HL('M-40,-112 Q-30,-130 -16,-138 Q-26,-124 -30,-112 Z', 0.3) +
        rr(-40, -64, 80, 46, 5, '#d1d5db', { stroke: '#4b5563' }) + rect(-40, -44, 80, 8, '#ef4444') + T(0, -49, 'HOT DOGS', 9, '#111827') + rr(-36, -72, 22, 8, 2, '#9ca3af', { stroke: '#4b5563', sw: 2 }) + ee(14, -70, 14, 6, '#f5c542', { stroke: '#b45309', sw: 2 }) + ee(14, -72, 11, 3.5, '#b45309', { sw: 0 }) + L('M6,-73 q4,-3 8,0 q4,3 8,0', '#facc15', 2) +
        HL('M-36,-60 h6 v36 h-6 Z', 0.4) + SH('M26,-60 h12 v38 h-12 Z', 0.1) + cc(-24, -10, 10, '#1f2937', { stroke: '#000' }) + cc(24, -10, 10, '#1f2937', { stroke: '#000' }) + cc(-24, -10, 4, '#9ca3af', { sw: 0 }) + cc(24, -10, 4, '#9ca3af', { sw: 0 })) +
      at(300, 494, rr(-10, -8, 20, 8, 3, '#374151', { stroke: '#111827' }) + rr(-3, -176, 6, 170, 2, '#374151', { stroke: '#111827' }) + rr(-14, -124, 28, 58, 5, '#1f2937', { stroke: '#000' }) + glow(0, -112, 14, '#ef4444', 0.35) + cc(0, -112, 7, '#ef4444', { stroke: '#7f1d1d', sw: 2 }) + cc(0, -95, 7, '#f59e0b', { stroke: '#92400e', sw: 2, op: 0.5 }) + cc(0, -78, 7, '#22c55e', { stroke: '#14532d', sw: 2, op: 0.5 }) +
        rr(-46, -176, 76, 18, 3, '#15803d', { stroke: '#052e16' }) + T(-8, -162, 'BROADWAY', 10, '#fff') + rr(-24, -150, 60, 18, 3, '#15803d', { stroke: '#052e16' }) + T(6, -136, 'W 42 ST', 10, '#fff') + HL('M-42,-174 h60 v3 h-60 Z', 0.3)) };
  },
  route66: () => ({ scene: bands([[0, 200, '#60a5fa'], [200, 120, '#93c5fd'], [320, 70, '#dbeafe']]) + sun(300, 72, 26, true) + cloud(90, 70, 0.7) + cloud(220, 124, 0.5) +
    pr('M-10,384 L-10,330 L30,330 L44,300 L96,300 L110,330 L150,330 L160,384 Z', '#c2410c', { stroke: '#7c2d12' }) + L('M-4,348 H154 M4,366 H158', '#9a3412', 2, { op: 0.6 }) + HL('M-6,332 L28,332 L42,304 L60,304 L46,336 L-6,336 Z', 0.2) +
    pr('M200,384 L210,340 L250,340 L262,312 L320,312 L330,340 L370,340 L370,384 Z', '#ea580c', { stroke: '#9a3412' }) + L('M212,356 H368 M216,370 H368', '#c2410c', 2, { op: 0.6 }) + HL('M214,342 L248,342 L260,316 L276,316 L264,346 L212,346 Z', 0.25) +
    rect(0, 384, 360, 256, '#e8b86d') + L('M0,384 H360', '#b7813e', 2.5) + dots([[40, 420, 2.5], [330, 460, 2.5], [20, 560, 2], [340, 600, 2.2], [120, 620, 2]], '#b7813e', 0.6) + L('M20,470 q6,-8 12,0 M300,540 q6,-8 12,0 M60,600 q6,-8 12,0', '#9a6a2e', 2.5) +
    pr('M168,386 L192,386 L390,640 L-30,640 Z', '#4b5563', { stroke: '#1f2937' }) + L('M180,396 L180,640', '#facc15', 5, { dash: '16 18' }) + L('M172,392 L-8,640 M188,392 L368,640', '#f8fafc', 3, { op: 0.8 }) + HL('M176,388 L184,388 L300,640 L220,640 Z', 0.05) +
    // Route 66 shield (left), saguaro + tumbleweed (right)
    at(70, 494, ee(0, 0, 12, 4, '#000', { sw: 0, op: 0.25 }) + rr(-4, -120, 8, 120, 2, '#6b7280', { stroke: '#374151' }) + pr('M-32,-182 H32 V-160 C32,-130 12,-110 0,-102 C-12,-110 -32,-130 -32,-160 Z', '#f8fafc', { stroke: '#111827' }) + T(0, -164, 'ROUTE', 10, '#111827') + L('M-26,-158 H26', '#111827', 2.5) + T(0, -120, '66', 32, '#111827') + HL('M-28,-178 h10 v40 h-10 Z', 0.3)) +
    at(292, 494, ee(0, 0, 20, 5, '#000', { sw: 0, op: 0.25 }) + rr(-11, -118, 22, 118, 11, '#4d9d4a', { stroke: '#2f6b2e' }) + pr('M-11,-62 L-28,-62 Q-38,-62 -38,-72 L-38,-98 Q-38,-110 -28,-110 Q-18,-110 -18,-98 L-18,-80 L-11,-80 Z', '#4d9d4a', { stroke: '#2f6b2e' }) + pr('M11,-50 L24,-50 Q34,-50 34,-60 L34,-86 Q34,-98 24,-98 Q14,-98 14,-86 L14,-68 L11,-68 Z', '#4d9d4a', { stroke: '#2f6b2e' }) +
      L('M-5,-110 V-10 M5,-108 V-12 M-30,-100 V-70 M24,-90 V-58', '#2f6b2e', 2, { op: 0.5 }) + HL('M-8,-112 h3 v96 h-3 Z', 0.3) + cc(0, -120, 6, '#f472b6', { stroke: '#be185d', sw: 2 }) + cc(0, -120, 2.5, '#fde047', { sw: 0 })) +
    at(336, 486, cc(0, 0, 14, '#c9a46a', { stroke: '#8a6a3a', sw: 2, op: 0.9 }) + L('M-10,-6 Q0,6 10,-6 M-8,6 Q0,-8 8,6 M-12,0 Q0,-12 12,0 M-6,-11 Q4,2 6,10', '#8a6a3a', 1.5)) }),
  miami_beach: () => {
    const deco = (x, y, w, h, col) => rr(x + w * 0.25, y - 18, w * 0.5, 20, 3, col, { stroke: dark(col, 0.45) }) + rr(x, y, w, h, 4, col, { stroke: dark(col, 0.45) }) + rep(3, i => L(`M${x + 6},${y + 12 + i * 9} H${x + w - 6}`, '#fff', 2.5, { op: 0.75 })) +
      rep(Math.max(1, Math.floor((h - 50) / 30)), r => rep(Math.floor((w - 10) / 24), q => cc(x + 16 + q * 24, y + 56 + r * 30, 5, '#fff', { stroke: dark(col, 0.45), sw: 2 }))) + HL(`M${x + 4},${y + 4} h6 v${h - 8} h-6 Z`, 0.3) + SH(`M${x + w - 10},${y + 4} h6 v${h - 8} h-6 Z`, 0.12);
    return { scene: bands([[0, 160, '#bae6fd'], [160, 120, '#e0f2fe'], [280, 160, '#fbcfe8']]) + sun(282, 92, 28, true) + cloud(80, 90, 0.7) + cloud(180, 150, 0.45) +
      deco(-10, 236, 110, 196, '#f9a8d4') + deco(104, 262, 72, 170, '#a7f3d0') + deco(184, 250, 80, 182, '#c4b5fd') + deco(270, 230, 100, 202, '#fde68a') +
      rr(88, 252, 22, 96, 3, '#111827', { stroke: '#000' }) + rep(5, i => neon(99, 272 + i * 18, 'OCEAN'[i], 13, '#ff4fd8')) +
      palm(40, 436, 130, 1) + palm(262, 436, 120, 1) +
      band(428, 14, '#4b5563') + L('M0,428 H360', '#1f2937', 2) + rect(0, 442, 360, 198, '#f6dfa4') + rect(0, 442, 360, 10, '#e9c98a') + dots([[90, 500, 1.4], [170, 540], [250, 520, 1.3], [60, 610], [200, 600, 1.4]], '#c9a46a', 0.6) +
      pr('M-10,600 Q40,588 90,600 Q150,612 200,598 Q260,586 310,600 Q340,606 370,598 V640 H-10 Z', '#22d3ee', { stroke: '#0e7490' }) + HL('M-10,606 Q40,594 90,606 Q150,618 200,604 Q260,592 310,606 Q340,612 370,604 V612 Q340,620 310,612 Q260,600 200,612 Q150,626 90,614 Q40,602 -10,614 Z', 0.5) +
      // lifeguard tower (left)
      at(80, 494, ee(0, 0, 40, 5, '#000', { sw: 0, op: 0.25 }) + L('M-28,-4 L-24,-60 M28,-4 L24,-60 M-30,-30 H30', '#92400e', 5) + pr('M-34,-110 L34,-110 L34,-60 L-34,-60 Z', '#f472b6', { stroke: '#9d174d' }) + pr('M-42,-110 L0,-136 L42,-110 Z', '#22d3ee', { stroke: '#0e7490' }) +
        rr(-22, -100, 44, 24, 3, '#fde68a', { stroke: '#9d174d', sw: 2 }) + L('M0,-100 V-76', '#9d174d', 2) + rr(-34, -62, 68, 6, 2, '#facc15', { stroke: '#a16207', sw: 2 }) + L('M-34,-64 L-60,-6', '#92400e', 5) + rep(4, i => L(`M${-38 - i * 6},${-56 + i * 14} l-6,0`, '#92400e', 3)) +
        HL('M-30,-106 h6 v40 h-6 Z', 0.35) + SH('M22,-106 h8 v42 h-8 Z', 0.1) + T(0, -66, 'LIFEGUARD', 7, '#9d174d')) +
      // surfboard, beach ball + flamingo float (right)
      at(262, 494, G(pr('M0,-130 C16,-104 18,-30 6,0 L-6,0 C-18,-30 -16,-104 0,-130 Z', '#22d3ee', { stroke: '#0e7490' }) + rect(-12, -84, 24, 10, '#f472b6') + rect(-15, -60, 30, 8, '#fde047') + L('M0,-120 V-10', '#0e7490', 2, { op: 0.4 }) + HL('M-8,-110 C-4,-100 -6,-60 -4,-20 L-8,-20 C-12,-60 -12,-100 -8,-110 Z', 0.4), { transform: 'rotate(8)' })) +
      at(316, 490, ee(0, 4, 30, 6, '#000', { sw: 0, op: 0.25 }) + ee(0, -12, 30, 14, '#f472b6', { stroke: '#be185d' }) + ee(0, -12, 12, 6, '#f6dfa4', { sw: 0 }) + pr('M-22,-20 C-30,-40 -26,-58 -16,-60 C-8,-60 -6,-50 -10,-46 L-20,-46 L-18,-56 C-20,-52 -22,-40 -18,-24 Z', '#f472b6', { stroke: '#be185d' }) + pr('M-16,-66 C-6,-70 -2,-60 -10,-56 Z', '#111827', { stroke: '#000', sw: 2 }) + cc(-14, -62, 1.5, '#fff', { sw: 0 }) + HL('M-24,-16 C-22,-24 -12,-26 -4,-24 C-12,-22 -20,-18 -24,-16 Z', 0.45)) +
      at(240, 490, cc(0, -12, 13, '#f8fafc', { stroke: '#374151' }) + F('M0,-25 A13,13 0 0 1 13,-12 L0,-12 Z', '#ef4444') + F('M0,1 A13,13 0 0 1 -13,-12 L0,-12 Z', '#3b82f6') + HL('M-8,-18 C-6,-22 -2,-24 2,-22 C-4,-20 -6,-18 -8,-18 Z', 0.6)) };
  },
  la_rooftop: (c) => {
    const a = c.a || '#f472b6';
    const bulbs = [[36, 364], [72, 376], [108, 384], [144, 389], [180, 390], [216, 389], [252, 384], [288, 376], [324, 364]];
    return { scene: bands([[0, 60, '#5b21b6'], [60, 60, '#7e22ce'], [120, 60, '#c026d3'], [180, 60, '#f472b6'], [240, 50, '#fb923c'], [290, 150, '#fcd34d']]) + halo(250, 298, 80, '#fff7cc', 1.4) + cc(250, 298, 30, '#fde047', { stroke: '#f59e0b', sw: 2.5 }) + HL('M234,294 C236,282 246,276 256,276 C246,282 240,288 234,294 Z', 0.5) +
      pr('M-10,330 C40,296 90,292 140,318 C180,298 220,306 260,330 C300,312 340,316 370,326 V420 H-10 Z', '#8b5cf6', { stroke: '#6d28d9' }) + hollywood(90, 324, 10) +
      sil([[20, 362, 24, 60], [50, 342, 20, 80, 12], [76, 374, 30, 48], [246, 352, 28, 70], [282, 332, 22, 90], [310, 366, 30, 56]], '#4c1d95') + dots([[30, 380], [58, 360], [90, 388], [258, 370], [292, 350], [322, 380]], '#fdba74', 0.9) +
      palm(342, 420, 130, -1) +
      // glass railing + string lights
      F('M-4,386 h368 v36 h-368 Z', '#bae6fd', { op: 0.35 }) + rep(7, i => rect(i * 60 - 2, 386, 4, 36, '#374151')) + rr(-4, 382, 368, 6, 2, '#4b5563', { stroke: '#1f2937' }) +
      L('M0,352 Q180,404 360,352', '#374151', 2.5) + bulbs.map(b => glow(b[0], b[1], 11, '#fde68a', 0.16) + glow(b[0], b[1], 7, '#fde68a', 0.22) + cc(b[0], b[1], 4, '#fde68a', { stroke: '#b45309', sw: 1.5 })).join('') +
      // deck
      rect(0, 420, 360, 220, '#c9a16b') + L('M0,420 H360', '#7c5a2b', 2.5) + rep(6, i => L(`M0,${452 + i * 34} H360`, '#a67c42', 2)) + L('M60,420 V452 M180,452 V486 M300,420 V452 M120,486 V520 M240,520 V554', '#a67c42', 2) +
      // pool (left) with a donut float, lounger + side table with a drink (right)
      rr(-14, 446, 142, 58, 10, '#22d3ee', { stroke: '#0e7490' }) + rect(-14, 448, 142, 7, '#a5f3fc') + L('M-4,470 q10,-5 20,0 q10,5 20,0 q10,-5 20,0 M20,488 q10,-5 20,0 q10,5 20,0 q10,-5 20,0', '#fff', 2.5, { op: 0.7 }) + SH('M100,452 h22 v46 h-22 Z', 0.08) +
      cc(66, 480, 15, a, { stroke: dark(a, 0.45) }) + cc(66, 480, 6, '#22d3ee', { sw: 0 }) + HL('M56,474 C58,468 64,466 68,468 C62,470 58,472 56,474 Z', 0.6) +
      lounger(238, 494, a) + rr(326, 462, 24, 32, 3, '#f8fafc', { stroke: '#94a3b8' }) + rr(332, 446, 10, 16, 2, '#fb923c', { stroke: '#c2410c', sw: 2 }) + L('M337,446 V436', '#ef4444', 2) + rr(334, 454, 6, 4, 1, '#fde047', { sw: 0 }) };
  },
  stadium: (c) => {
    const a = c.a || '#ef4444';
    const crowd = ['#ef4444', '#f8fafc', '#3b82f6', '#facc15', a];
    return { scene: band(0, 640, '#1e3a8a') + band(150, 80, '#3b5bb5') + band(214, 22, '#4b5563') + L('M0,236 H360', '#111827', 2.5) +
      band(236, 170, '#8a95ab') + rep(4, r => L(`M0,${282 + r * 34} H360`, '#6b7280', 2.5)) + rep(4, r => crowdRow(264 + r * 34, (r % 2) * 10, crowd)) +
      rect(0, 404, 360, 16, '#f8fafc') + rep(6, i => rect(i * 60 + 4, 407, 52, 10, i % 2 ? a : '#1e3a8a', { op: 0.9 })) + L('M0,404 H360', '#111827', 2) +
      floodTower(48) + floodTower(312) +
      rr(112, 80, 136, 68, 6, '#111827', { stroke: '#000' }) + T(146, 100, 'HOME', 11, '#f8fafc') + T(214, 100, 'AWAY', 11, '#f8fafc') + T(146, 134, '24', 30, '#fde047') + T(214, 134, '21', 30, '#fde047') + T(180, 110, 'Q4', 10, a) + T(180, 130, '2:00', 11, '#f8fafc') + HL('M116,84 h12 v60 h-12 Z', 0.08) +
      // football field: yard lines, numbers, hash marks
      rect(0, 420, 360, 220, '#2f9e44') + rep(3, i => rect(i * 120 + 60, 420, 60, 220, '#36ad4c')) + L('M0,420 H360', '#1f7a33', 3) +
      rep(7, i => L(`M${i * 60},420 V640`, '#fff', 3, { op: 0.9 })) + rep(6, i => T(30 + i * 60, 612, ['10', '20', '30', '40', '50', '40'][i], 20, '#fff', { op: 0.85 })) + rep(6, i => L(`M${30 + i * 60},520 V532 M${30 + i * 60},548 V560`, '#fff', 2.5, { op: 0.7 })) +
      // goal post (right), football + pylon (left)
      at(300, 494, ee(0, 0, 18, 5, '#000', { sw: 0, op: 0.25 }) + L('M0,-2 V-104', '#b45309', 11) + L('M0,-2 V-104', '#facc15', 7) + L('M-40,-104 H40', '#b45309', 11) + L('M-40,-104 H40', '#facc15', 7) + L('M-40,-104 V-200 M40,-104 V-200', '#b45309', 11) + L('M-40,-104 V-200 M40,-104 V-200', '#facc15', 7) + cc(0, -104, 6, '#facc15', { stroke: '#b45309', sw: 2 }) + HL('M-2,-100 h2 v96 h-2 Z', 0.4)) +
      at(84, 486, ee(0, 6, 26, 5, '#000', { sw: 0, op: 0.25 }) + G(ee(0, 0, 25, 15, '#92400e', { stroke: '#451a03' }) + L('M-24,0 Q-20,-10 -10,-14 M24,0 Q20,-10 10,-14', '#f8fafc', 3) + L('M-9,-4 H9 M-6,-8 V0 M0,-8 V0 M6,-8 V0', '#f8fafc', 2) + HL('M-18,-6 C-14,-12 -4,-14 2,-12 C-6,-10 -12,-8 -18,-6 Z', 0.3), { transform: 'rotate(-16)' })) +
      rr(34, 464, 12, 30, 3, '#f97316', { stroke: '#c2410c' }) + HL('M37,468 h3 v22 h-3 Z', 0.4) };
  },
  vegas: (c) => {
    const a = c.a || '#ff2d95';
    return { scene: band(0, 640, '#07071f') + dots(STARS.slice(0, 10), '#fff', 0.8) +
      tower(-6, 150, 70, 262, '#2a1f4f', '#fde68a', { p: 7, lit2: a }) + L('M-6,150 V412 M64,150 V412', a, 2, { op: 0.8 }) + tower(72, 120, 50, 292, '#1f1a3f', '#fcd34d', { p: 6, lit2: '#22d3ee', spire: 30 }) + L('M72,120 V412 M122,120 V412', '#22d3ee', 2, { op: 0.8 }) +
      F('M162,246 L178,246 L200,-10 L140,-10 Z', '#fff', { op: 0.14 }) + F('M166,246 L174,246 L184,-10 L156,-10 Z', '#fff', { op: 0.16 }) + pr('M104,412 L170,246 L236,412 Z', '#2b2352', { stroke: '#120f2e' }) + F('M170,246 L236,412 L170,412 Z', '#1e1840') + L('M170,250 L236,412 M170,250 L104,412', '#fde68a', 2, { op: 0.6 }) + rep(5, i => L(`M${150 - i * 8},${296 + i * 24} H${190 + i * 8}`, '#fde68a', 1.2, { op: 0.35 })) + glow(170, 248, 7, '#fff', 0.8) +
      tower(232, 100, 60, 312, '#2a1f4f', '#fde68a', { p: 7, lit2: a }) + L('M232,100 V412 M292,100 V412', a, 2, { op: 0.8 }) + rr(316, 70, 10, 342, 2, '#1f1a3f', { stroke: '#0b0a1f', sw: 2 }) + ee(321, 78, 28, 12, '#2a1f4f', { stroke: '#22d3ee' }) + glow(321, 56, 8, '#ef4444', 0.8) + L('M321,70 V54', '#1f1a3f', 3) + cc(321, 54, 3, '#ef4444', { sw: 0 }) +
      halo(60, 300, 70, a, 0.8) + halo(300, 280, 70, '#22d3ee', 0.8) +
      // the Strip: sidewalk with colour reflections
      band(410, 230, '#2a2a44') + rect(0, 410, 360, 12, '#4b4b6b') + L('M0,410 H360 M0,422 H360', '#15152b', 2.5) + ee(80, 478, 70, 14, a, { sw: 0, op: 0.12 }) + ee(296, 478, 70, 14, '#22d3ee', { sw: 0, op: 0.12 }) + L('M120,422 V640 M240,422 V640 M0,520 H360 M0,600 H360', '#20203a', 2) +
      // welcome sign (left) + neon casino arrow (right)
      at(80, 494, ee(0, 0, 40, 5, '#000', { sw: 0, op: 0.3 }) + rr(-34, -112, 7, 112, 2, '#9ca3af', { stroke: '#4b5563' }) + rr(27, -112, 7, 112, 2, '#9ca3af', { stroke: '#4b5563' }) +
        halo(0, -150, 70, '#fde047', 1) + pr('M-46,-196 L46,-196 L56,-154 L46,-112 L-46,-112 L-56,-154 Z', '#1d4ed8', { stroke: '#f8fafc' }) + rep(7, i => cc(-36 + i * 12, -202 - Math.sin((i / 6) * Math.PI) * 14, 4.5, '#fff', { stroke: '#fde047', sw: 2 })) + STAR(0, -224, 10, '#ef4444', { sw: 2, stroke: '#7f1d1d' }) +
        T(0, -176, 'WELCOME', 11, '#fff') + T(0, -162, 'TO FABULOUS', 8, '#fde047') + neon(0, -134, 'LAS VEGAS', 15, '#fde047') + T(0, -118, 'NEVADA', 7, '#fff') + HL('M-44,-194 h8 v80 h-8 Z', 0.15)) +
      at(296, 494, ee(0, 0, 20, 5, '#000', { sw: 0, op: 0.3 }) + rr(-4, -150, 8, 150, 2, '#374151', { stroke: '#111827' }) + halo(0, -170, 70, '#22d3ee', 1) + rr(-44, -204, 88, 56, 6, '#111827', { stroke: a }) + neon(0, -166, 'CASINO', 17, '#22d3ee') +
        pr('M-44,-148 L40,-148 L58,-126 L40,-104 L-44,-104 Z', '#facc15', { stroke: '#b45309' }) + dots([[-34, -136], [-22, -136], [-10, -136], [2, -136], [14, -136], [26, -136], [-34, -116], [-22, -116], [-10, -116], [2, -116], [14, -116], [26, -116], [42, -126]], '#fff', 0.9) + HL('M-40,-146 h70 v4 h-70 Z', 0.35)) };
  },
  gaming_room: (c) => {
    const a = c.a || '#22d3ee';
    const rgb = ['#ff2d95', a, '#39ff14', '#ffe600', '#ff3b3b', '#4c6fff'];
    const hex = (x, y, col) => pr(`M${x},${y - 16} L${x + 14},${y - 8} L${x + 14},${y + 8} L${x},${y + 16} L${x - 14},${y + 8} L${x - 14},${y - 8} Z`, col, { stroke: '#111', sw: 2, op: 0.9 }) + glow(x, y, 22, col, 0.12);
    return { scene: band(0, 640, '#1b1f33') + rep(12, i => rect(i * 30, 0, 30, 10, rgb[i % 6], { op: 0.9 })) + rect(0, 10, 360, 24, '#fff', { op: 0.05 }) +
      glow(62, 200, 76, '#ff2d95', 0.04) + glow(62, 200, 50, '#ff2d95', 0.05) + glow(62, 200, 28, '#ff2d95', 0.07) + glow(288, 372, 96, a, 0.04) + glow(288, 372, 62, a, 0.05) + glow(288, 372, 36, a, 0.07) +
      // RGB hex panels + shelf with a trophy and a console (left)
      hex(40, 160, '#ff2d95') + hex(68, 176, a) + hex(40, 192, '#39ff14') + hex(68, 208, '#ffe600') + hex(96, 192, '#ff2d95') + hex(96, 160, '#4c6fff') +
      rr(12, 292, 100, 8, 2, '#2f3350', { stroke: '#111' }) + pr('M34,262 L58,262 L54,286 L38,286 Z', '#f5c542', { stroke: '#b8860b' }) + rr(40, 286, 12, 6, 1, '#b8860b', { stroke: '#7c5a10', sw: 2 }) + L('M34,266 Q24,270 34,278 M58,266 Q68,270 58,278', '#f5c542', 3) + HL('M38,266 h4 v16 h-4 Z', 0.5) +
      rr(70, 276, 34, 16, 3, '#374151', { stroke: '#111' }) + cc(78, 284, 2.5, '#39ff14', { sw: 0 }) + L('M86,284 H98', '#111', 2) +
      // floor + LED strip
      rect(0, 440, 360, 200, '#2a2f4a') + L('M0,440 H360', '#111', 2.5) + rep(12, i => rect(i * 30, 434, 30, 6, rgb[(i + 3) % 6], { op: 0.9 })) + rect(0, 442, 360, 30, '#fff', { op: 0.04 }) +
      // desk with dual monitors, keyboard, mouse, headset + energy drink (right)
      rr(234, 436, 10, 64, 2, '#2a2d45', { stroke: '#111' }) + rr(322, 436, 10, 64, 2, '#2a2d45', { stroke: '#111' }) +
      rr(242, 340, 92, 62, 4, '#0b0d19', { stroke: '#000' }) + rect(248, 346, 80, 50, '#1e293b') + F('M248,396 L270,366 L286,382 L302,356 L328,396 Z', '#4c6fff') + rect(248, 346, 80, 8, '#ff2d95', { op: 0.6 }) + cc(316, 360, 5, a, { sw: 0 }) +
      G(rr(300, 326, 60, 66, 4, '#0b0d19', { stroke: '#000' }) + rect(305, 331, 50, 56, '#1e293b') + rect(305, 331, 50, 8, '#39ff14', { op: 0.6 }) + rep(4, i => rect(309, 345 + i * 10, 20 + (i * 13) % 22, 5, a, { op: 0.6 })), { transform: 'rotate(-6 300 360)' }) +
      rr(280, 402, 16, 20, 3, '#111', { stroke: '#000' }) + rr(266, 418, 44, 6, 3, '#111', { stroke: '#000' }) +
      rr(226, 422, 112, 14, 4, '#3b3f5c', { stroke: '#1a1c2e' }) + HL('M230,424 h80 v3 h-80 Z', 0.15) +
      rr(248, 410, 56, 10, 2, '#111827', { stroke: '#000' }) + dots([[254, 415, 1.3], [262, 415, 1.3], [270, 415, 1.3], [278, 415, 1.3], [286, 415, 1.3], [294, 415, 1.3]], a, 0.9) + ee(318, 414, 7, 9, '#111827', { stroke: '#000' }) + cc(318, 410, 1.5, '#ff2d95', { sw: 0 }) +
      L('M236,406 Q236,392 248,392 Q260,392 260,406', '#111827', 5) + ee(236, 410, 5, 7, '#111827', { stroke: '#000', sw: 2 }) + ee(260, 410, 5, 7, '#111827', { stroke: '#000', sw: 2 }) + cc(260, 410, 2, '#ff2d95', { sw: 0 }) +
      rr(228, 400, 10, 22, 2, '#22c55e', { stroke: '#14532d', sw: 2 }) + rect(230, 406, 6, 6, '#111827') +
      // PC tower under the desk (right)
      rr(286, 446, 40, 76, 4, '#111827', { stroke: '#000' }) + rect(292, 454, 28, 50, '#1e293b') + cc(306, 479, 12, '#0b0d19', { stroke: a }) + cc(306, 479, 5, a, { sw: 0, op: 0.9 }) + L('M306,467 V491 M294,479 H318', a, 1.5, { op: 0.6 }) + cc(318, 512, 2.5, '#39ff14', { sw: 0 }) + HL('M290,450 h4 v66 h-4 Z', 0.15) +
      // bean bag + controller (left)
      ee(52, 470, 46, 28, '#7c3aed', { stroke: '#4c1d95' }) + ee(46, 456, 30, 16, '#8b5cf6', { stroke: '#4c1d95', sw: 2 }) + L('M20,474 Q52,484 86,474', '#4c1d95', 2, { op: 0.6 }) + HL('M22,464 C26,448 44,442 58,446 C44,448 30,456 22,464 Z', 0.3) +
      pr('M30,448 L62,448 C72,448 72,464 62,464 L30,464 C20,464 20,448 30,448 Z', '#1f2937', { stroke: '#000' }) + dots([[57, 453, 2], [61, 457, 2], [53, 457, 2], [57, 461, 2]], a, 1) + L('M34,452 V460 M30,456 H38', '#9ca3af', 2) };
  },
  concert: (c) => {
    const a = c.a || '#f472b6';
    const conf = ['#fde047', a, '#22d3ee', '#4ade80'];
    const crowd = rep(14, i => { const x = i * 28 + 4, y = 500 + (i % 2) * 4; return L(`M${x - 8},${y} L${x - 16},${y - 30} M${x + 8},${y} L${x + 16},${y - 32}`, '#0b0c22', 5) + cc(x - 16, y - 30, 3.5, '#0b0c22', { sw: 0 }) + cc(x + 16, y - 32, 3.5, '#0b0c22', { sw: 0 }) + cc(x, y + 2, 12, '#0b0c22', { sw: 0 }) + (i % 3 ? '' : glow(x + 16, y - 36, 7, '#fde68a', 0.6) + cc(x + 16, y - 36, 2.5, '#fde68a', { sw: 0 })); });
    return { scene: band(0, 640, '#121431') + band(120, 320, '#1a1d44') + L('M0,120 H360', '#2a2f6b', 2) +
      // LED wall behind the stage
      rep(9, r => rep(12, q => rect(q * 30 + 2, 124 + r * 34, 26, 30, ((q + r) % 3 === 0 ? a : (q + r) % 3 === 1 ? '#22d3ee' : '#4c1d95'), { op: 0.22 + ((q * 7 + r * 5) % 4) * 0.06 }))) +
      F('M60,56 L-30,440 L150,440 Z', a, { op: 0.18 }) + F('M300,56 L210,440 L390,440 Z', '#22d3ee', { op: 0.18 }) + F('M180,56 L120,440 L240,440 Z', '#fff', { op: 0.08 }) +
      L('M20,60 L340,300 M340,60 L20,300 M20,180 L340,120', '#39ff14', 1.5, { op: 0.45 }) +
      glow(180, 126, 60, '#fde047', 0.06) + glow(180, 126, 46, '#fde047', 0.08) + STAR(180, 126, 42, '#fde047', { sw: 3, stroke: '#b45309' }) + HL('M180,88 L171,110 L148,114 Z', 0.35) +
      rr(-10, 40, 380, 16, 3, '#374151', { stroke: '#111827' }) + rep(18, i => L(`M${i * 20},40 L${i * 20 + 20},56`, '#4b5563', 2)) +
      rep(9, i => glow(20 + i * 40, 68, 16, i % 2 ? a : '#22d3ee', 0.3) + cc(20 + i * 40, 68, 8, i % 2 ? a : '#22d3ee', { stroke: '#111827' }) + rr(16 + i * 40, 54, 8, 8, 2, '#374151', { stroke: '#111827', sw: 2 })) +
      rep(12, i => G(rect(0, 0, 7, 3.5, conf[i % 4]), { transform: `translate(${(i * 71) % 340 + 10} ${(i * 53) % 300 + 90}) rotate(${i * 37})` })) +
      rect(0, 440, 360, 32, '#4b3b63') + L('M0,440 H360', '#2b2240', 3) + ee(92, 458, 54, 10, a, { sw: 0, op: 0.22 }) + ee(268, 458, 54, 10, '#22d3ee', { sw: 0, op: 0.22 }) +
      rect(0, 470, 360, 34, '#352948') + L('M0,470 H360', '#6d5a8a', 3) + rep(12, i => rect(i * 30 + 4, 476, 22, 4, conf[i % 4], { op: 0.8 })) + rect(0, 504, 360, 136, '#141026') +
      speaker(36, 300) + speaker(264, 300) +
      pr('M40,470 L92,470 L100,448 L50,448 Z', '#1f2937', { stroke: '#000' }) + ee(70, 459, 10, 7, '#374151', { stroke: '#000' }) + pr('M320,470 L268,470 L260,448 L310,448 Z', '#1f2937', { stroke: '#000' }) + ee(290, 459, 10, 7, '#374151', { stroke: '#000' }) +
      crowd };
  },
  aspen: (c) => {
    const a = c.a || '#ef4444';
    const cabin = (x, y) => L(`M${x},${y - 14} V${y}`, '#374151', 3) + rr(x - 11, y, 22, 20, 4, '#ef4444', { stroke: '#7f1d1d', sw: 2 }) + rect(x - 7, y + 4, 14, 8, '#bae6fd') + HL(`M${x - 9},${y + 2} h4 v14 h-4 Z`, 0.3);
    return { scene: bands([[0, 150, '#a78bfa'], [150, 120, '#f0abfc'], [270, 90, '#fde68a'], [360, 80, '#fef3c7']]) + dots([[40, 40, 1.6], [120, 80, 1.3], [250, 50, 1.6], [320, 110, 1.2]], '#fff', 0.8) +
      pr('M-10,372 L60,250 L120,330 L190,220 L260,320 L320,260 L370,340 V420 H-10 Z', '#9fb6cf', { stroke: '#6f8aa8' }) +
      HL('M60,250 L84,292 L72,286 L60,296 L48,286 L36,292 Z', 0.9) + HL('M190,220 L214,262 L202,256 L190,266 L178,256 L166,262 Z', 0.9) + HL('M320,260 L338,292 L328,286 L320,296 L312,286 L302,292 Z', 0.9) +
      L('M-10,172 L370,112', '#374151', 2) + cabin(90, 162) + cabin(262, 134) +
      pr('M-10,400 C100,380 240,400 370,386 V640 H-10 Z', '#f8fbfe', { stroke: '#b8cfe3' }) + F('M-10,470 C100,460 240,480 370,466 V490 C240,500 100,484 -10,494 Z', '#dbe9f5') + F('M-10,590 C100,580 240,600 370,586 V640 H-10 Z', '#d9e8f4') +
      dots([[30, 120, 2.2], [90, 60, 1.8], [150, 150, 2], [220, 100, 1.6], [260, 180, 2.2], [340, 150, 1.8], [60, 240, 1.6], [190, 300, 2], [120, 330, 1.6], [300, 360, 1.8], [40, 460, 1.6], [330, 470, 1.6]], '#fff', 0.95) + SPARK(140, 70, 7) + SPARK(240, 240, 6) +
      pine(24, 428, 64, 140, true) + pine(112, 416, 44, 100, true) + pine(348, 404, 36, 76, true) +
      // timber lodge (right)
      at(300, 486, ee(0, 4, 80, 8, '#b8cfe3', { sw: 0, op: 0.6 }) + rr(-70, -40, 140, 40, 3, '#9ca3af', { stroke: '#4b5563' }) + rep(3, i => L(`M-64,${-30 + i * 10} H64`, '#6b7280', 2)) + L('M-40,-40 V-2 M0,-30 V-2 M36,-40 V-2', '#6b7280', 2) +
        rr(-66, -140, 132, 102, 4, '#a16a3f', { stroke: '#5c3a1a' }) + rep(5, i => L(`M-62,${-128 + i * 20} H62`, '#7a4a22', 2)) + HL('M-62,-136 h6 v96 h-6 Z', 0.25) + SH('M50,-136 h12 v96 h-12 Z', 0.12) +
        rr(30, -210, 16, 44, 2, '#6b7280', { stroke: '#374151' }) + glow(38, -222, 10, '#e5e7eb', 0.5) + glow(44, -240, 13, '#e5e7eb', 0.4) + glow(36, -262, 16, '#e5e7eb', 0.3) +
        pr('M-86,-140 L0,-236 L86,-140 Z', '#5c3a1a', { stroke: '#3b2314' }) + rep(4, i => L(`M${-70 + i * 14},${-156 + i * 2} L${0},${-230}`, '#3b2314', 1.5, { op: 0.4 })) + pr('M-56,-172 L0,-232 L56,-172 Q30,-180 0,-178 Q-30,-180 -56,-172 Z', '#f8fbfe', { stroke: '#b8cfe3', sw: 2 }) +
        L('M-86,-140 L0,-236 L86,-140', '#f8fbfe', 7) + L('M-86,-140 L0,-236 L86,-140', '#b8cfe3', 1.5, { op: 0.6 }) + L('M-80,-136 Q-40,-124 0,-134 Q40,-124 80,-136', '#f8fbfe', 5) +
        halo(-36, -104, 34, '#fde68a', 1.4) + rr(-54, -122, 36, 36, 3, '#fde68a', { stroke: '#3b2314' }) + L('M-36,-122 V-86 M-54,-104 H-18', '#3b2314', 2.5) + halo(36, -104, 34, '#fde68a', 1.4) + rr(18, -122, 36, 36, 3, '#fde68a', { stroke: '#3b2314' }) + L('M36,-122 V-86 M18,-104 H54', '#3b2314', 2.5) +
        rr(-14, -78, 28, 38, 3, '#3b2314', { stroke: '#1f1208' }) + cc(6, -58, 2.5, '#fde68a', { sw: 0 }) + glow(-24, -66, 10, '#fde68a', 0.5) + cc(-24, -66, 4, '#fde68a', { stroke: '#3b2314', sw: 2 }) +
        rr(-70, -44, 140, 8, 3, '#f8fbfe', { stroke: '#b8cfe3', sw: 2 })) +
      // snowboard + skis (left)
      at(60, 494, G(rr(-11, -126, 22, 126, 11, a, { stroke: dark(a, 0.45) }) + rect(-11, -100, 22, 14, '#22d3ee') + rect(-11, -50, 22, 14, '#22d3ee') + STAR(0, -76, 8, '#fde047', { sw: 2 }) + rr(-8, -112, 16, 6, 2, '#111827', { stroke: '#000', sw: 2 }) + rr(-8, -36, 16, 6, 2, '#111827', { stroke: '#000', sw: 2 }) + HL('M-7,-120 h3 v110 h-3 Z', 0.35), { transform: 'rotate(-10)' })) +
      at(104, 494, G(rr(-4, -140, 8, 140, 4, '#4c6fff', { stroke: '#1e3a8a', sw: 2 }) + rr(8, -140, 8, 140, 4, '#4c6fff', { stroke: '#1e3a8a', sw: 2 }) + rect(-4, -120, 8, 6, '#fde047') + rect(8, -120, 8, 6, '#fde047') + HL('M-2,-136 h2 v120 h-2 Z', 0.4) + HL('M10,-136 h2 v120 h-2 Z', 0.4), { transform: 'rotate(6)' }) + L('M24,-110 L30,0', '#374151', 3) + cc(24, -112, 3, '#ef4444', { sw: 0 }) + cc(30, -10, 6, '#374151', { stroke: '#111827', sw: 2 })) };
  },
  subway: () => {
    let tiles = '';
    for (let y = 0; y < 436; y += 12) { tiles += `M0,${y} H360 `; for (let x = ((y / 12) % 2 ? 12 : 0); x < 360; x += 24) tiles += `M${x},${y} V${Math.min(y + 12, 436)} `; }
    return { scene: band(0, 640, '#e5e7eb') + L(tiles, '#cbd5e1', 1.2) +
      rect(0, 310, 360, 30, '#111827') + rep(18, i => F(`M${i * 20 + 10},314 l6,11 l-6,11 l-6,-11 Z`, '#22c55e')) + L('M0,312 H360 M0,338 H360', '#f8fafc', 2) +
      // station name + line badges (left wall) · hanging direction sign (right)
      rr(34, 196, 96, 32, 2, '#f8fafc', { stroke: '#111827' }) + T(82, 220, '42 ST', 22, '#111827') + cc(60, 262, 14, '#ef4444', { stroke: '#7f1d1d' }) + T(60, 268, '1', 16, '#fff') + cc(98, 262, 14, '#facc15', { stroke: '#a16207' }) + T(98, 268, 'N', 16, '#111827') +
      L('M250,120 V150 M320,120 V150', '#374151', 2.5) + rr(236, 150, 98, 36, 3, '#111827', { stroke: '#000' }) + T(278, 174, 'UPTOWN', 14, '#fff') + L('M310,168 L324,168 L318,162 M324,168 L318,174', '#fff', 3) + HL('M240,154 h8 v28 h-8 Z', 0.1) +
      // framed subway map on the right wall
      rr(244, 204, 90, 90, 3, '#f8fafc', { stroke: '#374151' }) + L('M252,284 L270,236 L300,226 L326,212', '#ef4444', 4) + L('M250,230 L286,250 L326,246', '#2563eb', 4) + L('M262,212 L276,262 L326,282', '#22c55e', 4) + L('M250,262 L300,268 L326,260', '#f59e0b', 3) + dots([[270, 236, 2.5], [286, 250, 2.5], [276, 262, 2.5], [300, 268, 2.5]], '#111827', 1) + rr(252, 210, 30, 8, 2, '#111827', { sw: 0 }) +
      // steel column + bench (left)
      rr(36, 300, 28, 6, 1, '#15803d', { stroke: '#052e16' }) + rr(42, 304, 16, 184, 2, '#15803d', { stroke: '#052e16' }) + rr(36, 488, 28, 8, 1, '#15803d', { stroke: '#052e16' }) + HL('M45,308 h4 v176 h-4 Z', 0.3) + SH('M52,308 h4 v176 h-4 Z', 0.15) +
      at(100, 494, ee(0, 0, 32, 4, '#000', { sw: 0, op: 0.25 }) + rr(-26, -34, 6, 34, 2, '#374151', { stroke: '#111827' }) + rr(20, -34, 6, 34, 2, '#374151', { stroke: '#111827' }) + rr(-30, -62, 60, 8, 3, '#b08350', { stroke: '#6b4423' }) + rr(-30, -44, 60, 10, 3, '#b08350', { stroke: '#6b4423' }) + L('M-24,-62 V-44 M24,-62 V-44', '#6b4423', 2.5) + HL('M-26,-60 h30 v3 h-30 Z', 0.35)) +
      // platform floor + yellow tactile strip
      rect(0, 436, 360, 204, '#9ca3af') + L('M0,436 H360', '#4b5563', 2.5) + dots([[30, 540, 1.3], [120, 560, 1.3], [200, 620, 1.3], [330, 580, 1.3], [80, 610, 1.3]], '#6b7280', 0.6) +
      rect(0, 486, 360, 12, '#facc15') + L('M0,486 H360 M0,498 H360', '#374151', 2.5) + rep(30, i => cc(6 + i * 12, 492, 1.8, '#a16207', { sw: 0, op: 0.7 })) +
      // silver train with a blue stripe at the right edge
      at(232, 496, rr(0, -180, 164, 172, 10, '#cbd5e1', { stroke: '#475569' }) + rr(4, -188, 156, 12, 4, '#94a3b8', { stroke: '#475569' }) + rect(0, -104, 164, 12, '#2563eb') + rect(0, -20, 164, 12, '#1f2937') +
        rr(12, -160, 36, 42, 4, '#fef3c7', { stroke: '#475569', sw: 2.5 }) + rr(56, -160, 36, 42, 4, '#fef3c7', { stroke: '#475569', sw: 2.5 }) + rr(104, -164, 52, 150, 4, '#b7c0cc', { stroke: '#475569' }) + L('M130,-164 V-14', '#475569', 2.5) + rr(110, -158, 16, 42, 3, '#fef3c7', { stroke: '#475569', sw: 2 }) + rr(134, -158, 16, 42, 3, '#fef3c7', { stroke: '#475569', sw: 2 }) +
        cc(30, -74, 16, '#facc15', { stroke: '#a16207' }) + T(30, -68, 'N', 18, '#111827') + T(76, -70, 'METRO', 10, '#1f2937') + HL('M6,-176 h8 v150 h-8 Z', 0.3) + SH('M150,-176 h8 v150 h-8 Z', 0.12) + glow(6, -40, 10, '#fef3c7', 0.5) + cc(6, -40, 4, '#fef3c7', { stroke: '#475569', sw: 2 })) };
  },
  brooklyn_bridge: () => {
    let susp = '';
    for (let x = 20; x <= 340; x += 20) { if (Math.abs(x - 180) < 66) continue; const cy = 66 + (x - 180) * (x - 180) * 0.0084; susp += `M${x},${cy.toFixed(1)} V396 `; }
    let stays = '';
    for (let i = 0; i < 4; i++) stays += `M180,160 L${30 + i * 22},396 M180,160 L${330 - i * 22},396 `;
    const arch = (x) => F(`M${x - 16},-130 V-270 L${x},-306 L${x + 16},-270 V-130 Z`, '#3b1d5c') + L(`M${x - 16},-130 V-270 L${x},-306 L${x + 16},-270 V-130`, '#4a3f33', 2.5) + L(`M${x - 10},-262 L${x},-290 L${x + 10},-262`, '#6e604f', 1.5, { op: 0.6 }) + F(`M${x - 10},-326 V-350 L${x},-366 L${x + 10},-350 V-326 Z`, '#3b1d5c');
    return { scene: bands([[0, 60, '#4c1d95'], [60, 60, '#6d28d9'], [120, 60, '#a21caf'], [180, 60, '#ec4899'], [240, 50, '#fb923c'], [290, 120, '#fcd34d']]) + halo(70, 300, 80, '#fff7cc', 1.4) + cc(70, 300, 28, '#fde047', { stroke: '#f59e0b', sw: 2.5 }) + HL('M56,296 C58,284 68,278 78,278 C68,284 62,290 56,296 Z', 0.5) +
      sil([[-6, 330, 30, 70], [26, 300, 26, 100, 14], [54, 346, 34, 54], [90, 316, 24, 84], [116, 340, 40, 60], [230, 320, 30, 80], [262, 290, 28, 110, 30], [292, 338, 36, 62], [330, 310, 40, 90]], '#3b1d5c') +
      dots([[10, 350], [38, 330], [70, 364], [100, 340], [130, 360], [244, 346], [274, 320], [306, 360], [344, 334]], '#fdba74', 0.9) + rect(0, 400, 360, 8, '#4c1d95') +
      // granite tower with two pointed gothic arches (behind the hero)
      at(180, 436, rr(-52, -380, 104, 384, 4, '#8b7b6b', { stroke: '#4a3f33' }) + rep(4, i => rect(-50 + i * 28, -390, 16, 12, '#8b7b6b')) + L('M-50,-390 H-34 M-22,-390 H-6 M6,-390 H22 M34,-390 H50', '#4a3f33', 2.5) + rect(-52, -316, 104, 6, '#6e604f') +
        arch(-24) + arch(24) + rep(5, i => L(`M-48,${-110 + i * 16} H48`, '#6e604f', 1.5, { op: 0.6 })) + L('M-26,-100 V-20 M26,-100 V-20', '#6e604f', 1.5, { op: 0.4 }) + HL('M-48,-376 h7 v370 h-7 Z', 0.2) + SH('M38,-376 h10 v370 h-10 Z', 0.15)) +
      // main cables, suspenders, diagonal stays
      L('M180,58 C110,200 30,300 -10,376', '#1f2937', 3) + L('M180,58 C250,200 330,300 370,376', '#1f2937', 3) + L(susp, '#1f2937', 1.4, { op: 0.8 }) + L(stays, '#1f2937', 1.1, { op: 0.55 }) +
      // walkway + railings
      rect(0, 400, 360, 240, '#b7791f') + L('M0,400 H360', '#7c4a12', 2.5) + rep(7, i => L(`M0,${428 + i * 32} H360`, '#8f5e18', 2)) + L('M60,400 V428 M180,428 V460 M300,400 V428 M120,460 V492 M240,492 V524', '#8f5e18', 2) +
      rr(-4, 396, 368, 6, 2, '#374151', { stroke: '#1f2937' }) + rep(19, i => rect(i * 20 - 1, 402, 2, 20, '#374151')) + rr(-4, 420, 368, 4, 1, '#374151', { stroke: '#1f2937', sw: 1.5 }) +
      // the bridge's iconic lamp posts (both lanes)
      at(60, 494, ee(0, 0, 14, 4, '#000', { sw: 0, op: 0.25 }) + rr(-10, -8, 20, 8, 3, '#1f2937', { stroke: '#000' }) + rr(-3, -150, 6, 144, 2, '#1f2937', { stroke: '#000' }) + halo(0, -168, 44, '#fde68a', 1.4) + pr('M-12,-156 L12,-156 L8,-186 L-8,-186 Z', '#fde68a', { stroke: '#1f2937' }) + pr('M-16,-186 L16,-186 L0,-200 Z', '#1f2937', { stroke: '#000' }) + HL('M-9,-160 h4 v-22 h-4 Z', 0.4)) +
      at(300, 494, ee(0, 0, 14, 4, '#000', { sw: 0, op: 0.25 }) + rr(-10, -8, 20, 8, 3, '#1f2937', { stroke: '#000' }) + rr(-3, -150, 6, 144, 2, '#1f2937', { stroke: '#000' }) + halo(0, -168, 44, '#fde68a', 1.4) + pr('M-12,-156 L12,-156 L8,-186 L-8,-186 Z', '#fde68a', { stroke: '#1f2937' }) + pr('M-16,-186 L16,-186 L0,-200 Z', '#1f2937', { stroke: '#000' }) + HL('M-9,-160 h4 v-22 h-4 Z', 0.4)) +
      L('M86,220 q8,-8 16,0 q8,-8 16,0 M296,250 q6,-6 12,0 q6,-6 12,0', '#3b1d5c', 2.5, { op: 0.7 }) };
  },
};

export const ITEMS = [
  single('bg', 'subway', 'platform', { a: '#facc15' }, { en: 'Subway Platform', ar: 'رصيف المترو' }, 'common', { tier: 2 }),
  single('bg', 'route66', 'desert', { a: '#f8fafc' }, { en: 'Route 66', ar: 'طريق 66' }, 'rare', { tier: 3 }),
  single('bg', 'miami_beach', 'deco', { a: '#f472b6' }, { en: 'Miami Beach', ar: 'شاطئ ميامي' }, 'rare', { tier: 4 }),
  single('bg', 'brooklyn_bridge', 'sunset', { a: '#fb923c' }, { en: 'Brooklyn Bridge', ar: 'جسر بروكلين' }, 'rare', { tier: 5 }),
  single('bg', 'aspen', 'lodge', { a: '#ef4444' }, { en: 'Aspen Lodge', ar: 'كوخ آسبن' }, 'rare', { tier: 5 }),
  single('bg', 'stadium', 'final', { a: '#ef4444' }, { en: 'Friday Night Lights', ar: 'ملعب الفوتبول' }, 'epic', { tier: 7 }),
  single('bg', 'gaming_room', 'rgb', { a: '#22d3ee' }, { en: 'RGB Gaming Den', ar: 'غرفة الألعاب' }, 'epic', { tier: 8 }),
  single('bg', 'la_rooftop', 'sunset', { a: '#f472b6' }, { en: 'LA Rooftop', ar: 'سطح لوس أنجلوس' }, 'epic', { tier: 9 }),
  single('bg', 'times_square', 'lights', { a: '#ff2d95' }, { en: 'Times Square', ar: 'تايمز سكوير' }, 'epic', { tier: 10 }),
  single('bg', 'concert', 'live', { a: '#f472b6' }, { en: 'Live Concert', ar: 'حفلة لايف' }, 'legendary', { tier: 10 }),
  single('bg', 'vegas', 'strip', { a: '#ff2d95' }, { en: 'Vegas Strip', ar: 'شارع فيغاس' }, 'legendary', { tier: 12 }),
];
