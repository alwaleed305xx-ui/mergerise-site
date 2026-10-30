// MERGE CHAIN icons (not clothing). Every icon is SVG inner content for a 100x100 viewBox, drawn in the
// shared sticker style (flat base + outline + SH shadow + HL highlight + one detail) with light from top-left.
// Art direction v2: modern American (NYC sidewalk → Beverly Hills). Gallery: gallery.html?mod=items
import { P, F, SH, HL, C, E, R, L, T, G, MIRROR_AT, STAR, SPARK, starPath, heartPath, dark, light } from './art/_kit.js';

// ---------- shared helpers ----------
const M = s => MIRROR_AT(s, 50);
const GROUND = (rx = 30, cy = 89, ry = 5, op = 0.14) => E(50, cy, rx, ry, '#000', { sw: 0, op });
const SP = (x, y, r, fill = '#fbbf24') => SPARK(x, y, r, fill, 0.95);
const WSP = (x, y, r) => SPARK(x, y, r, '#fff', 0.9);
const N = (en, ar) => ({ en, ar });
const lv = (en, ar, icon) => ({ name: N(en, ar), icon });

const GOLD = '#f5b301', GOLD_D = '#b45309', CREAM = '#fff3d6', BREAD = '#e5a84f', CRUST = '#c9803a', WOOD = '#c48a4a';
const RED = '#ef4444', PINK = '#f472b6', NAVY = '#1e3a8a', STEEL = '#64748b', INK = '#111827', SKY = '#7dd3fc', CYAN = '#22d3ee';
const CUT = { sw: 2.5, stroke: '#c9a46a' };

const SESAME = (x, y) => E(x, y, 3, 1.8, CREAM, { sw: 0 });
const PEP = (x, y) => C(x, y, 5.5, '#dc2626', { sw: 2.5 }) + C(x - 1.5, y - 1.5, 1.6, '#fca5a5', { sw: 0 });
const LEAF = (x, y, s) => P(`M${x - s},${y} C${x - s * 0.6},${y - s} ${x + s * 0.6},${y - s} ${x + s},${y} C${x + s * 0.6},${y + s * 0.6} ${x - s * 0.6},${y + s * 0.6} ${x - s},${y} Z`, '#22c55e', { sw: 2 }) +
  L(`M${x - s * 0.7},${y} L${x + s * 0.7},${y}`, '#15803d', 1.5, { op: 0.6 });
function DRIP(x, y, w, fill) {
  const n = Math.max(3, Math.round(w / 12)), s = w / n;
  let d = `M${x},${y} L${x + w},${y} L${x + w},${y + 5}`;
  for (let i = n; i >= 1; i--) d += ` Q${(x + (i - 0.5) * s).toFixed(1)},${y + (i % 2 ? 17 : 11)} ${(x + (i - 1) * s).toFixed(1)},${y + 5}`;
  return P(d + ' Z', fill, { sw: 2.5, stroke: '#f9a8d4' });
}
const TIER = (x, y, w, h) => R(x, y, w, h, 5, GOLD) +
  SH(`M${x + w - 10},${y + 2} L${x + w - 2},${y + 2} L${x + w - 2},${y + h - 2} L${x + w - 10},${y + h - 2} Z`, 0.14) +
  HL(`M${x + 2},${y + 2} L${x + 8},${y + 2} L${x + 8},${y + h - 2} L${x + 2},${y + h - 2} Z`, 0.3) +
  DRIP(x, y, w, '#fff1f2');
// birthday candle: striped stick + flame (x = centre, y = top of the stick)
const CANDLE = (x, y, col) => R(x - 2.5, y, 5, 14, 2, col, { sw: 2 }) + L(`M${x - 1},${y + 3} L${x - 1},${y + 11}`, '#fff', 1.5, { op: 0.6 }) +
  P(`M${x},${y - 11} C${x + 4.5},${y - 6} ${x + 3.5},${y - 1} ${x},${y - 1} C${x - 3.5},${y - 1} ${x - 4.5},${y - 6} ${x},${y - 11} Z`, '#fb923c', { sw: 2, stroke: '#ea580c' }) + C(x, y - 4, 1.6, '#fde047', { sw: 0 });
const COIN3 = (cx, y, rx, ry) => P(`M${cx - rx},${y - 8} L${cx - rx},${y} A${rx},${ry} 0 0,0 ${cx + rx},${y} L${cx + rx},${y - 8} Z`, GOLD) + E(cx, y - 8, rx, ry, '#fbbf24', { stroke: GOLD_D });
const NOTE = () => R(8, 30, 84, 42, 4, '#4ade80') +
  R(13, 35, 74, 32, 2, '#4ade80', { sw: 2, stroke: '#166534', extra: { 'stroke-dasharray': '3 2' } }) +
  E(50, 51, 13, 13, '#86efac', { sw: 2.5, stroke: '#166534' }) + T(50, 58, '$', 20, '#166534') +
  T(22, 46, '1', 10, '#166534') + T(78, 64, '1', 10, '#166534') +
  HL('M12,34 L34,34 L26,46 L12,46 Z', 0.3) + SH('M74,56 L88,56 L88,68 L66,68 Z', 0.12);
// gold ingot: top face + front face (w x h), with an embossed mint stamp instead of tiny text
const BAR = (x, y, w = 44, h = 18) => {
  const t = Math.round(h * 0.45), a = x + w * 0.15, b = x + w * 0.85;
  return P(`M${x + w * 0.2},${y - t} L${x + w * 0.8},${y - t} L${b},${y} L${a},${y} Z`, '#ffd54a', { sw: 2.5, stroke: GOLD_D }) +
    P(`M${x},${y + h} L${a},${y} L${b},${y} L${x + w},${y + h} Z`, GOLD, { stroke: GOLD_D }) +
    HL(`M${a},${y + 2} L${a + 6},${y + 2} L${x + 8},${y + h - 2} L${x + 3},${y + h - 2} Z`, 0.35) +
    SH(`M${b - 4},${y + 2} L${b},${y + 2} L${x + w - 3},${y + h - 2} L${x + w - 8},${y + h - 2} Z`, 0.14) +
    R(x + w * 0.34, y + h * 0.25, w * 0.32, h * 0.42, 1.5, '#ffd54a', { sw: 2, stroke: GOLD_D }) +
    L(`M${x + w * 0.42},${y + h * 0.46} L${x + w * 0.58},${y + h * 0.46}`, GOLD_D, 1.5, { op: 0.6 });
};
// chunky irregular crumb: 5-point pebble polygon with a soft top-left highlight
const CRUMB = (x, y, r, fill, o) => {
  const k = [[0, -1], [0.95, -0.3], [0.6, 0.85], [-0.6, 0.85], [-0.95, -0.3]], j = [1, 0.8, 0.95, 0.75, 0.9];
  const d = k.map(([px, py], i) => (i ? 'L' : 'M') + (x + px * r * j[i]).toFixed(1) + ',' + (y + py * r * j[i]).toFixed(1)).join(' ') + ' Z';
  return P(d, fill, o) + HL(`M${x - r * 0.5},${y - r * 0.2} L${x - r * 0.1},${y - r * 0.6} L${x + r * 0.2},${y - r * 0.3} L${x - r * 0.3},${y + r * 0.1} Z`, 0.4);
};
const WHEEL = (x, y, r = 8) => C(x, y, r, '#374151') + C(x, y, r * 0.4, '#9ca3af', { sw: 0 }) + HL(`M${x - r * 0.6},${y - r * 0.3} C${x - r * 0.5},${y - r * 0.6} ${x - r * 0.3},${y - r * 0.7} ${x - r * 0.1},${y - r * 0.7} L${x - r * 0.1},${y - r * 0.45} C${x - r * 0.3},${y - r * 0.45} ${x - r * 0.4},${y - r * 0.35} ${x - r * 0.5},${y - r * 0.2} Z`, 0.4);

// ---------- FOOD ----------
const food = {
  // sidewalk leftovers: a crumpled deli wrapper (warm paper, dark outline so it survives on light UI chips) with a bitten bread heel and crumbs spilling off it
  crumbs: () => GROUND(38, 90, 4, 0.12) +
    P('M12,60 L26,44 L50,48 L68,40 L90,58 L82,78 L58,86 L30,82 L16,72 Z', '#f5e6c4', { sw: 3, stroke: '#a57c3c' }) +
    L('M26,44 L38,62 L16,72 M68,40 L60,64 L82,78 M38,62 L58,86', '#a57c3c', 1.5, { op: 0.5 }) +
    HL('M16,60 L27,47 L44,50 L38,62 L20,70 Z', 0.5) + SH('M62,62 L80,76 L58,84 L34,80 Z', 0.09) +
    G(P('M32,62 L32,50 C32,38 40,32 50,32 C55,32 59,33 62,35 C54,38 55,48 66,48 L68,50 L68,62 C68,66 66,68 62,68 L38,68 C34,68 32,66 32,62 Z', CRUST) +
      P('M37,61 L37,50 C37,42 42,37 50,37 C53,37 56,37.5 58.5,38.5 C52,41.5 53,49.5 64,50.5 L63,63 L38,63 Z', CREAM, CUT) +
      SH('M62,52 L66,52 L66,62 C66,66 63,68 60,68 L50,68 C56,66 62,62 62,52 Z', 0.14) +
      HL('M34,58 C34,44 40,36 48,34 C44,38 38,44 37,58 Z', 0.4) +
      C(44, 46, 1.6, '#e8d5b0', { sw: 0 }) + C(50, 54, 1.6, '#e8d5b0', { sw: 0 }) + C(43, 56, 1.3, '#e8d5b0', { sw: 0 }), { transform: 'rotate(-14 50 56) translate(50 56) scale(0.82) translate(-50 -54)' }) +
    CRUMB(24, 76, 7, CREAM, { sw: 2.5, stroke: '#b08a4a' }) + CRUMB(74, 72, 7, BREAD, { sw: 2.5 }) + CRUMB(66, 28, 6, BREAD, { sw: 2.5 }) + CRUMB(20, 52, 5, BREAD, { sw: 2.5 }) +
    C(90, 46, 3, BREAD, { sw: 2 }) + C(8, 68, 3, CRUST, { sw: 2 }) + C(44, 88, 3, CRUST, { sw: 2 }) + C(62, 90, 2.5, BREAD, { sw: 2 }) +
    C(30, 34, 2.5, CRUST, { sw: 2 }) + C(88, 84, 2.2, CRUST, { sw: 2 }) + C(50, 20, 2.5, BREAD, { sw: 2 }) + C(84, 30, 2.2, CRUST, { sw: 2 }) + C(14, 86, 2, BREAD, { sw: 2 }),
  // NYC street-cart hot dog: top bun, sausage with a mustard zig-zag + ketchup squiggle, bottom bun
  hotdog: () => GROUND(46, 90, 4) +
    P('M14,48 C14,32 26,24 42,24 L58,24 C74,24 86,32 86,48 L86,54 L14,54 Z', BREAD) +
    HL('M20,44 C22,34 32,27 42,27 C34,30 26,36 25,46 Z', 0.35) + SH('M68,26 C80,30 84,40 84,52 L76,52 C76,40 74,32 68,26 Z', 0.14) +
    SESAME(36, 32) + SESAME(50, 29) + SESAME(64, 33) + SESAME(43, 40) + SESAME(58, 41) +
    R(2, 40, 96, 24, 12, '#c2410c', { stroke: '#7c2d12' }) + HL('M10,44 C12,42 18,42 60,42 L60,45 L10,45 Z', 0.3) + SH('M12,59 L92,59 L90,62 L14,62 Z', 0.16) +
    L('M6,52 L10,52 M90,52 L94,52', '#7c2d12', 2, { op: 0.5 }) +
    L('M16,50 L24,45 L32,55 L40,45 L48,55 L56,45 L64,55 L72,45 L80,55 L86,50', '#facc15', 4.5) +
    L('M14,54 Q33,49 50,54 Q67,59 86,54', '#dc2626', 3) +
    R(10, 58, 80, 26, 12, BREAD) + HL('M14,62 L20,62 L20,78 L14,78 Z', 0.3) +
    SH('M74,60 L84,60 C87,60 88,64 88,68 L88,74 C88,78 84,82 78,82 L66,82 C72,80 76,74 76,68 Z', 0.14) +
    L('M20,66 L80,66', dark(BREAD), 2, { op: 0.35 }) + L('M30,72 L36,72 M46,74 L54,74 M64,72 L70,72', dark(BREAD), 2, { op: 0.3 }),
  // double-decker cheeseburger: sesame bun, lettuce, tomato, melting cheese, patty
  burger: () => GROUND(44, 92, 4) +
    R(10, 68, 80, 18, 8, BREAD) + SH('M70,70 L86,70 L86,78 C86,82 82,84 78,84 L70,84 Z', 0.14) + HL('M14,72 L20,72 L20,82 L14,82 Z', 0.25) +
    R(8, 58, 84, 13, 5, '#7c3f1d') + SH('M78,60 L90,60 L90,69 L78,69 Z', 0.14) +
    P('M72,56 L78,70 L84,56 Z', '#fbbf24', { sw: 2.5 }) + P('M20,56 L25,68 L30,56 Z', '#fbbf24', { sw: 2.5 }) +
    R(10, 53, 80, 8, 2, '#fbbf24') +
    R(14, 47, 72, 8, 4, '#ef4444') +
    P('M6,53 Q12,43 18,51 Q24,43 30,51 Q36,43 42,51 Q48,43 54,51 Q60,43 66,51 Q72,43 78,51 Q84,43 90,51 L94,56 L6,56 Z', '#4ade80') +
    P('M10,50 C10,26 30,16 50,16 C70,16 90,26 90,50 Z', BREAD) +
    SH('M66,18 C82,24 90,36 90,50 L78,50 C78,36 74,26 66,18 Z', 0.14) + HL('M16,46 C16,34 24,24 34,20 C26,27 22,36 20,46 Z', 0.35) +
    SESAME(32, 32) + SESAME(46, 25) + SESAME(60, 28) + SESAME(40, 40) + SESAME(56, 38) + SESAME(70, 40) + SESAME(26, 42),
  // New York slice: wide triangle, puffy crust, pepperoni + basil
  slice: () => GROUND(36, 93, 4) +
    P('M50,92 L12,26 C34,8 66,8 88,26 Z', '#fbbf24', { stroke: '#d97706' }) +
    HL('M24,36 L40,30 L46,54 L36,50 Z', 0.3) + SH('M66,38 L82,32 L52,88 L54,60 Z', 0.12) +
    P('M12,26 C34,8 66,8 88,26 L82,34 C62,20 38,20 18,34 Z', '#e3a24f') +
    HL('M18,28 C30,18 42,15 50,15 L50,19 C40,19 30,22 22,32 Z', 0.35) + SH('M62,16 C72,18 80,24 86,28 L80,33 C74,28 68,22 62,20 Z', 0.14) +
    C(30, 46, 2, '#fde68a', { sw: 0 }) + C(70, 50, 2, '#fde68a', { sw: 0 }) + C(42, 68, 1.8, '#fde68a', { sw: 0 }) +
    PEP(38, 44) + PEP(62, 46) + PEP(50, 62) + C(48, 77, 3.5, '#dc2626', { sw: 2 }) +
    LEAF(50, 36, 7),
  // fries & shake combo: red fries carton + strawberry shake with whipped cream, striped straw and a cherry
  combo: () => GROUND(44, 92, 4) +
    R(14, 30, 7, 30, 2, '#fbbf24', { sw: 2.5 }) + R(22, 24, 7, 36, 2, '#fbbf24', { sw: 2.5 }) + R(30, 28, 7, 32, 2, '#fbbf24', { sw: 2.5 }) + R(38, 34, 7, 26, 2, '#fbbf24', { sw: 2.5 }) + R(8, 38, 6, 22, 2, '#fbbf24', { sw: 2.5 }) +
    P('M6,54 L48,54 L44,88 L10,88 Z', RED) + L('M16,66 Q27,74 38,66', '#fff', 3) + HL('M9,57 L15,57 L13,85 L11,85 Z', 0.25) + SH('M40,57 L46,57 L43,85 L38,85 Z', 0.14) +
    P('M56,42 L92,42 L87,88 L61,88 Z', '#fbcfe8') + L('M61,52 L87,52 M62,62 L86,62', '#f472b6', 2, { op: 0.5 }) + HL('M59,46 L64,46 L63,84 L61,84 Z', 0.3) + SH('M84,46 L89,46 L86,84 L82,84 Z', 0.14) +
    R(54, 38, 40, 7, 3.5, '#fff', { stroke: '#cbd5e1' }) +
    C(66, 32, 7, '#fff', { stroke: '#cbd5e1' }) + C(80, 32, 7, '#fff', { stroke: '#cbd5e1' }) + C(73, 26, 8, '#fff', { stroke: '#cbd5e1' }) + HL('M66,24 C68,20 72,19 74,19 L74,22 C71,22 69,23 68,26 Z', 0.6) +
    L('M82,36 L86,10', RED, 4.5) + L('M83,30 L84,24 M85,18 L85.5,13', '#fff', 2, { op: 0.8 }) +
    C(72, 17, 4.5, RED) + C(70.5, 15.5, 1.4, '#fff', { sw: 0 }) + L('M72,13 C72,9 76,7 78,9', '#166534', 2),
  // backyard BBQ platter: rack of glazed ribs, corn on the cob, a slate sauce dish with a basting brush, steam
  bbq: () => GROUND(46, 92, 4) +
    E(50, 72, 46, 14, '#e2e8f0', { stroke: '#94a3b8' }) + E(50, 72, 38, 9, '#f8fafc', { sw: 2, stroke: '#cbd5e1' }) +
    G(E(78, 74, 18, 8, '#fde047', { stroke: '#ca8a04' }) + [[-12, 0], [-6, -3.5], [0, 0], [6, -3.5], [12, 0], [-6, 3.5], [6, 3.5], [0, -5], [0, 5]].map(([dx, dy]) => C(78 + dx, 74 + dy, 1.7, '#ca8a04', { sw: 0, op: 0.6 })).join('') + HL('M62,72 C66,68 72,66 80,67 L78,70 C72,69 67,70 65,74 Z', 0.4) + SH('M80,78 C86,78 92,76 94,73 L94,75 C92,79 86,81 80,81 Z', 0.14), { transform: 'rotate(-18 78 74)' }) +
    // rack of ribs: bone ends poke out of the top edge, each rib a rounded ridge under a sticky glaze
    [24, 36, 48, 60, 72].map(x => R(x - 3.5, 30, 7, 14, 3.5, '#fff7ed', { sw: 2.5, stroke: '#a8a29e' }) + SH(`M${x + 1},33 L${x + 2.5},33 L${x + 2.5},42 L${x + 1},42 Z`, 0.12)).join('') +
    P('M10,50 C10,42 16,38 24,38 L74,38 C82,38 88,42 88,50 L86,66 C70,72 28,72 12,66 Z', '#b45309', { stroke: '#7c2d12' }) +
    [30, 42, 54, 66].map(x => L(`M${x},41 L${x + 1},68`, '#7c2d12', 3, { op: 0.45 })).join('') +
    [24, 36, 48, 60, 72].map(x => HL(`M${x - 2.5},42 L${x + 1},42 L${x + 1.5},62 L${x - 2},62 Z`, 0.28)).join('') +
    HL('M14,50 C14,44 19,41 24,41 L60,41 L60,45 L26,45 C21,45 18,47 18,52 Z', 0.4) + SH('M74,42 C82,44 85,48 85,54 L83,65 C78,69 66,71 50,71 C66,69 76,64 76,58 C76,52 76,46 74,42 Z', 0.14) +
    E(40, 64, 5, 2.2, '#7f1d1d', { sw: 0, op: 0.5 }) + E(62, 63, 4, 2, '#7f1d1d', { sw: 0, op: 0.5 }) +
    // sauce dish + brush are drawn AFTER the rack so nothing hides them: shallow slate dish on the plate rim, red sauce surface,
    // white silicone brush handle rising up-right with its red bristle head resting in the sauce
    P('M5,76 L8,87 C9,89.5 27,89.5 28,87 L31,76 Z', '#475569', { stroke: '#1e293b' }) + SH('M23,78 L29,78 L27,87 C26,88.5 23,89 19,89 C22,88 23,84 23,78 Z', 0.22) + HL('M7,79 L11,79 L12,86 L9,86 Z', 0.2) +
    E(18, 76.5, 12.5, 4, '#b91c1c', { sw: 2.5, stroke: '#7f1d1d' }) + HL('M8,76 C10,73.5 14,72.8 18,72.8 L18,74.8 C14,74.8 11,75.4 10,77.5 Z', 0.4) +
    L('M20,68 L36,52', '#334155', 6) + L('M20,68 L36,52', '#f8fafc', 3) +
    G(R(12.5, 66, 9, 12, 2.5, '#dc2626', { sw: 2, stroke: '#991b1b' }) + L('M14.5,70 L14.5,76 M17,70 L17,76 M19.5,70 L19.5,76', '#fecaca', 1.5, { op: 0.7 }) + SH('M19,68 L21,68 L21,77 L19,77 Z', 0.14) +
      R(12, 64.5, 10, 4, 1.5, '#cbd5e1', { sw: 1.5, stroke: '#475569' }), { transform: 'rotate(45 17 72)' }) +
    L('M34,30 C30,24 38,20 34,14 M50,28 C46,22 54,18 50,12 M66,30 C62,24 70,20 66,14', '#94a3b8', 2.5, { op: 0.6 }),
  // golden three-tier birthday cake with icing drips, sprinkles and three candles
  cake: () => GROUND(44, 94, 4) +
    E(50, 88, 46, 6, '#f8fafc', { stroke: '#94a3b8' }) +
    TIER(10, 64, 80, 24) + TIER(20, 44, 60, 22) + TIER(30, 26, 40, 20) +
    [[22, 76], [40, 82], [60, 80], [76, 74], [30, 56], [52, 58], [68, 54], [44, 38], [58, 40]].map(([x, y], i) => E(x, y, 2.6, 1.2, ['#ec4899', '#22d3ee', '#a855f7', '#22c55e'][i % 4], { sw: 0, extra: { transform: `rotate(${(i * 37) % 90} ${x} ${y})` } })).join('') +
    // candles sit 2-4px lower than before so every flame tip (y - 11, 2px stroke) stays inside the 0..100 viewBox
    CANDLE(40, 16, '#f472b6') + CANDLE(50, 14, '#60a5fa') + CANDLE(60, 16, '#4ade80') +
    SP(12, 36, 6) + SP(88, 32, 5) + SP(84, 56, 4) + SP(16, 56, 3.5) + WSP(34, 72, 4) + WSP(60, 50, 3) + SP(22, 14, 4) + SP(78, 14, 4),
};

// ---------- MONEY ----------
const money = {
  // copper penny
  cent: () => GROUND(30) +
    C(50, 50, 36, '#d97d3a', { stroke: '#7c3a12' }) + C(50, 50, 28, '#e8955a', { sw: 2.5, stroke: '#7c3a12' }) +
    T(50, 61, '1¢', 28, '#7c3a12') +
    HL('M20,44 C22,30 32,20 46,17 C36,24 27,33 25,47 Z', 0.45) + SH('M80,54 C78,68 68,78 54,82 C64,76 72,66 74,52 Z', 0.14),
  stack: () => GROUND(38, 92, 4) +
    E(18, 84, 11, 4, GOLD, { stroke: GOLD_D }) +
    COIN3(50, 84, 26, 7) + COIN3(50, 76, 26, 7) + COIN3(50, 68, 26, 7) + COIN3(50, 60, 26, 7) + COIN3(50, 52, 26, 7) +
    E(42, 43, 9, 3, '#fff', { sw: 0, op: 0.45 }) + SH('M70,50 L76,50 L76,84 L70,84 Z', 0.12) +
    C(78, 72, 14, GOLD, { stroke: GOLD_D }) + T(78, 78, '$', 15, GOLD_D) + HL('M67,68 C68,62 72,59 77,59 C73,61 70,64 70,69 Z', 0.45),
  // a pair of fanned dollar bills
  bill: () => GROUND(42, 90, 4) +
    G(R(8, 32, 84, 40, 4, '#22c55e'), { transform: 'rotate(5 50 52)' }) +
    G(NOTE(), { transform: 'rotate(-5 50 52)' }),
  wallet: () => GROUND(42, 91, 4) +
    P('M22,44 L25,24 L69,24 L66,44 Z', '#4ade80') + L('M30,30 L62,30 M29,36 L61,36', '#166534', 2, { op: 0.5 }) +
    P('M62,44 L64,30 L88,30 L86,44 Z', '#3b82f6') + L('M68,36 L84,36', '#fff', 2.5, { op: 0.7 }) +
    R(12, 40, 76, 46, 8, '#92400e') +
    P('M20,40 L80,40 C84,40 88,44 88,48 L88,60 C88,64 85,66 82,66 L18,66 C15,66 12,64 12,60 L12,48 C12,44 16,40 20,40 Z', '#a0522d') +
    L('M18,72 L62,72 M18,80 L82,80', '#fbbf24', 2, { dash: '4 3', op: 0.7 }) +
    R(66, 56, 16, 14, 4, GOLD, { stroke: GOLD_D }) + C(74, 63, 3, GOLD_D, { sw: 0 }) +
    HL('M16,44 L26,44 L26,64 L16,64 Z', 0.25) + SH('M78,70 L86,70 L86,84 L78,84 Z', 0.14),
  bag: () => GROUND(38, 93, 4) +
    P('M34,24 C40,31 60,31 66,24 L70,40 L30,40 Z', '#d6a04d') +
    P('M50,90 C26,90 10,76 14,58 C18,48 30,42 38,38 L62,38 C70,42 82,48 86,58 C90,76 74,90 50,90 Z', '#d6a04d') +
    R(31, 34, 38, 9, 4, '#92400e') +
    T(50, 78, '$', 32, '#7c4a1e') +
    HL('M20,60 C22,50 30,44 38,42 C30,48 26,54 26,64 Z', 0.35) + SH('M78,54 C86,66 82,84 62,89 C76,82 80,70 76,58 Z', 0.14) +
    C(14, 84, 7, GOLD, { sw: 2.5, stroke: GOLD_D }) + C(86, 82, 7, GOLD, { sw: 2.5, stroke: GOLD_D }) + C(26, 90, 5, GOLD, { sw: 2.5, stroke: GOLD_D }) + C(78, 91, 5, GOLD, { sw: 2.5, stroke: GOLD_D }),
  bars: () => GROUND(46, 92, 4) + BAR(5, 70) + BAR(51, 70) + BAR(28, 50) + WSP(38, 56, 3) + SP(90, 36, 5) + SP(10, 40, 4) + WSP(14, 64, 2.5),
  // bank vault: steel door with a spoked wheel handle, gold $ hub and rim bolts
  vault: () => GROUND(44, 94, 4) +
    R(10, 8, 80, 82, 8, '#475569', { stroke: '#1e293b' }) + HL('M14,12 L22,12 L22,86 L14,86 Z', 0.2) + SH('M78,12 L86,12 L86,86 L78,86 Z', 0.14) +
    [[18, 16], [82, 16], [18, 82], [82, 82]].map(([x, y]) => C(x, y, 3, '#94a3b8', { sw: 2, stroke: '#1e293b' })).join('') +
    C(50, 49, 34, '#94a3b8', { stroke: '#1e293b' }) +
    [22.5, 67.5, 112.5, 157.5, 202.5, 247.5, 292.5, 337.5].map(a => { const r = a * Math.PI / 180; return C((50 + 29.5 * Math.cos(r)).toFixed(1), (49 + 29.5 * Math.sin(r)).toFixed(1), 2.4, '#cbd5e1', { sw: 1.5, stroke: '#1e293b' }); }).join('') +
    C(50, 49, 24, '#cbd5e1', { sw: 2.5, stroke: '#64748b' }) +
    HL('M28,44 C30,34 36,28 46,26 C40,30 34,36 33,46 Z', 0.5) + SH('M72,52 C70,62 64,69 54,71 C60,67 66,61 67,51 Z', 0.14) +
    [0, 60, 120, 180, 240, 300].map(a => { const r = a * Math.PI / 180, x = (50 + 18 * Math.cos(r)).toFixed(1), y = (49 + 18 * Math.sin(r)).toFixed(1); return L(`M50,49 L${x},${y}`, '#1e293b', 5) + C(x, y, 3.8, '#fbbf24', { sw: 2, stroke: GOLD_D }); }).join('') +
    C(50, 49, 9.5, '#1e293b', { stroke: '#0f172a' }) + T(50, 54.5, '$', 15, GOLD) +
    SP(6, 6, 5) + SP(94, 8, 4.5) + WSP(34, 32, 3),
};

// ---------- FASHION ----------
const HOLE = (x, y) => C(x, y, 4.5, '#1e40af', { sw: 2, stroke: '#1e3a8a' });
const STITCH = (d) => L(d, '#f59e0b', 2, { dash: '4 3', op: 0.85 });
const VCUFF = P('M8,46 L20,58 L24,54 L12,42 Z', NAVY, { sw: 2.5 }) + L('M11,46 L19,54', '#fbbf24', 2) + L('M14,43.5 L22.5,52', '#fff', 1.5, { op: 0.8 });
const VSLEEVE = P('M31,27 L8,46 L20,58 L27,51 L27,34 Z', '#f8fafc', { stroke: '#94a3b8' }) + HL('M28,31 L12,45 L16,49 L25,40 Z', 0.5);
const SNAP = y => C(50, y, 2.3, '#cbd5e1', { sw: 1.5, stroke: '#64748b' });
const JHALF = P('M24,30 C24,22 32,18 40,18 L50,60 L50,76 C38,78 28,74 24,70 Z', '#111827') + P('M36,19 L50,46 L48,58 L41,19 Z', '#4b5563', { sw: 2, stroke: '#1f2937' });
const fashion = {
  button: () => GROUND(30) +
    C(50, 50, 36, '#60a5fa') + C(50, 50, 27, '#60a5fa', { sw: 2.5, stroke: '#2563eb' }) +
    HL('M20,44 C22,30 32,20 46,17 C36,24 27,33 25,47 Z', 0.4) + SH('M80,54 C78,68 68,78 54,82 C64,76 72,66 74,52 Z', 0.14) +
    HOLE(42, 42) + HOLE(58, 42) + HOLE(42, 58) + HOLE(58, 58) +
    L('M42,42 L58,58 M58,42 L42,58', '#fff', 3.5),
  spool: () => GROUND(34, 91, 4) +
    E(50, 74, 26, 8, WOOD) +
    R(28, 30, 44, 44, 0, WOOD, { sw: 0 }) + L('M28,30 L28,74 M72,30 L72,74', dark(WOOD), 3.5) +
    R(26, 36, 48, 30, 3, PINK) + L('M26,42 L74,42 M26,48 L74,48 M26,54 L74,54 M26,60 L74,60', dark(PINK), 2, { op: 0.45 }) +
    HL('M28,38 L34,38 L34,64 L28,64 Z', 0.3) + SH('M66,38 L72,38 L72,64 L66,64 Z', 0.14) +
    E(50, 30, 26, 8, WOOD) + E(50, 30, 8, 3, dark(WOOD, 0.2), { sw: 0 }) + HL('M28,28 C32,24 42,22 50,22 C44,24 36,26 32,30 Z', 0.35) +
    L('M74,58 C88,54 92,68 84,76 C80,80 84,86 90,84', PINK, 3) + L('M88,86 L96,70', '#9ca3af', 3) + C(89, 84, 2, '#fff', { sw: 1.5, stroke: '#6b7280' }),
  // bolt of raw denim with orange top-stitching and a leather brand patch
  denim: () => GROUND(44, 92, 4) +
    P('M22,60 L84,60 L90,84 Q80,80 70,86 Q60,80 50,86 Q40,80 30,86 Q20,80 14,84 Z', '#4a6fb5') +
    STITCH('M26,66 L82,66') + STITCH('M28,76 L84,76') + SH('M70,62 L84,60 L90,84 L72,84 Z', 0.12) +
    R(10, 26, 78, 36, 18, '#3b5998') +
    STITCH('M16,35 L78,35') + STITCH('M16,53 L78,53') + L('M20,44 L74,44', '#2b4170', 2, { op: 0.5 }) +
    HL('M16,30 L74,30 L74,34 L16,34 Z', 0.3) + SH('M16,56 L74,56 L74,60 L16,60 Z', 0.14) +
    E(86, 44, 9, 18, '#4a6fb5') + E(86, 44, 4, 8, '#3b5998', { sw: 2 }) + HL('M80,32 C82,28 84,27 86,27 L86,31 C84,31 83,33 82,36 Z', 0.4) +
    R(56, 39, 20, 11, 2, '#d6a243', { sw: 2, stroke: '#92400e' }) + T(66, 47.5, 'NYC', 7.5, '#fff7ed'),
  tee: () => GROUND(36, 92, 4) +
    L('M50,18 C50,8 58,6 60,10 C62,14 56,16 53,14', '#6b7280', 3) +
    L('M50,18 L14,40 L86,40 L50,18', '#6b7280', 3.5) +
    P('M30,30 L50,25 L70,30 L90,44 L80,56 L72,50 L72,88 L28,88 L28,50 L20,56 L10,44 Z', RED) +
    L('M38,28 Q50,42 62,28', dark(RED), 3.5) +
    L('M28,52 L32,48 M72,52 L68,48', dark(RED), 2.5, { op: 0.5 }) + L('M32,82 L68,82', dark(RED), 2, { op: 0.4 }) +
    HL('M14,44 L30,32 L34,36 L28,50 L22,54 Z', 0.3) + SH('M68,34 L88,44 L80,54 L74,50 L72,56 L72,86 L66,86 L66,50 Z', 0.12) +
    STAR(50, 60, 11, '#fbbf24', { sw: 2.5, stroke: '#d97706' }),
  // letterman jacket: navy wool body, white leather sleeves, striped rib trim, chenille "A"
  varsity: () => GROUND(38, 92, 4) +
    P('M28,28 L50,22 L72,28 L92,46 L80,58 L74,52 L74,88 L26,88 L26,52 L20,58 L8,46 Z', NAVY, { stroke: '#0f172a' }) +
    VSLEEVE + M(VSLEEVE) + VCUFF + M(VCUFF) +
    HL('M28,54 L34,54 L34,84 L28,84 Z', 0.15) + SH('M68,54 L74,54 L74,86 L68,86 Z', 0.16) +
    R(26, 80, 48, 8, 2, NAVY, { sw: 2.5, stroke: '#0f172a' }) + L('M28,83 L72,83', '#fbbf24', 2) + L('M28,86.5 L72,86.5', '#fff', 1.5, { op: 0.8 }) +
    P('M38,28 Q50,40 62,28 Q50,36 38,28 Z', NAVY, { sw: 2.5, stroke: '#0f172a' }) + L('M40,29 Q50,38 60,29', '#fbbf24', 2) + L('M42,27 Q50,33 58,27', '#fff', 1.5, { op: 0.8 }) +
    L('M50,34 L50,80', '#f8fafc', 4) + SNAP(42) + SNAP(54) + SNAP(66) +
    T(37, 68, 'A', 24, '#fbbf24', { stroke: '#fff', sw: 3 }),
  tuxedo: () => GROUND(28, 93, 4) +
    E(50, 88, 22, 5, '#6b7280') + R(46, 72, 8, 16, 2, '#9ca3af') + SH('M50,74 L54,74 L54,88 L50,88 Z', 0.14) +
    C(50, 14, 6, '#e5e7eb') +
    P('M26,30 C26,20 36,16 50,16 C64,16 74,20 74,30 L76,70 C66,78 34,78 24,70 Z', '#e5e7eb') +
    P('M34,19 L50,62 L66,19 Z', '#fff', { sw: 2, stroke: '#cbd5e1' }) + L('M50,32 L50,58', '#cbd5e1', 2) +
    JHALF + M(JHALF) +
    P('M40,20 L50,24 L60,20 L60,30 L50,26 L40,30 Z', '#dc2626', { sw: 2.5 }) + C(50, 25, 3, '#b91c1c', { sw: 0 }) +
    C(50, 62, 2.5, '#111827', { sw: 1.5, stroke: '#9ca3af' }) + C(50, 70, 2.5, '#111827', { sw: 1.5, stroke: '#9ca3af' }) +
    P('M29,46 L41,46 L39,41 L35,44 L31,41 Z', RED, { sw: 2 }) +
    HL('M28,30 C28,24 34,20 40,20 L42,26 C36,26 32,28 32,34 Z', 0.25),
  // Hollywood star trophy: big faceted gold star on a stem, black marble base with a name plate
  trophy: () => GROUND(38, 95, 4) +
    R(22, 80, 56, 11, 3, '#1e293b', { stroke: '#0f172a' }) + HL('M25,82 L34,82 L34,88 L25,88 Z', 0.2) +
    R(28, 72, 44, 9, 3, GOLD, { stroke: GOLD_D }) + HL('M30,74 L40,74 L40,79 L30,79 Z', 0.3) + SH('M62,74 L70,74 L70,79 L62,79 Z', 0.14) +
    R(42, 50, 16, 24, 3, GOLD, { stroke: GOLD_D }) + SH('M52,54 L56,54 L56,72 L52,72 Z', 0.14) +
    STAR(50, 36, 32, GOLD, { inner: 0.5, stroke: GOLD_D }) + F(starPath(50, 36, 22, 0.5), '#ffd54a') +
    HL('M50,4 L42,26 L19,27 L36,38 L50,38 Z', 0.3) + SH('M50,38 L81,27 L58,26 Z', 0.12) + SH('M50,38 L62,54 L69,66 L50,55 Z', 0.12) +
    C(50, 38, 8, '#ec4899') + C(47.5, 35.5, 2.5, '#fff', { sw: 0 }) +
    R(38, 83, 24, 5, 1.5, GOLD, { sw: 2, stroke: GOLD_D }) +
    WSP(40, 26, 4) + SP(12, 12, 7) + SP(88, 10, 6) + SP(92, 60, 5) + SP(8, 64, 4) + WSP(62, 48, 3),
};

// ---------- HOME ----------
const WIN = (x, y) => R(x, y, 12, 12, 2, SKY) + L(`M${x + 6},${y} L${x + 6},${y + 12} M${x},${y + 6} L${x + 12},${y + 6}`, dark(SKY), 2);
const FLAP = P('M18,42 L10,22 L40,22 L44,42 Z', '#e0b57f');
const PALM = (x, y) => L(`M${x + 4},${y + 40} C${x + 6},${y + 26} ${x + 4},${y + 14} ${x},${y}`, '#92400e', 4) +
  P(`M${x},${y} C${x - 10},${y - 8} ${x - 18},${y - 4} ${x - 16},${y + 2} C${x - 10},${y - 2} ${x - 4},${y} ${x},${y} Z`, '#22c55e', { sw: 2 }) +
  P(`M${x},${y} C${x - 2},${y - 12} ${x + 6},${y - 16} ${x + 10},${y - 10} C${x + 4},${y - 8} ${x + 2},${y - 4} ${x},${y} Z`, '#22c55e', { sw: 2 }) +
  P(`M${x},${y} C${x + 8},${y - 6} ${x + 16},${y} ${x + 12},${y + 8} C${x + 8},${y + 4} ${x + 4},${y + 2} ${x},${y} Z`, '#22c55e', { sw: 2 }) + C(x, y, 2.8, '#a16207', { sw: 2 });
const home = {
  box: () => GROUND(42, 92, 4) +
    R(22, 28, 56, 16, 2, '#7c4a1e') +
    FLAP + M(FLAP) +
    R(18, 42, 64, 44, 4, '#d4a574') +
    R(44, 42, 12, 44, 0, '#efd9a8', { sw: 2.5, stroke: '#c2a26e' }) + L('M50,46 L50,82', '#c2a26e', 1.5, { dash: '3 3' }) +
    L('M24,56 L38,56 M24,63 L38,63 M24,70 L34,70', dark('#d4a574'), 2.5, { op: 0.5 }) +
    L('M68,74 L68,58 M62,64 L68,58 L74,64', dark('#d4a574'), 2.5, { op: 0.6 }) +
    HL('M20,44 L26,44 L26,84 L20,84 Z', 0.3) + SH('M74,44 L80,44 L80,84 L74,84 Z', 0.14),
  tent: () => GROUND(46, 92, 4) +
    L('M50,22 L50,8', '#6b7280', 3) + P('M50,8 L62,12 L50,16 Z', RED, { sw: 2 }) +
    L('M10,80 L4,90 M90,80 L96,90', '#a16207', 2.5) + C(4, 90, 2, '#6b7280', { sw: 1.5 }) + C(96, 90, 2, '#6b7280', { sw: 1.5 }) +
    P('M50,20 L92,86 L8,86 Z', '#f97316') +
    P('M50,38 L66,86 L34,86 Z', '#9a3412', { sw: 2.5 }) +
    P('M50,38 L34,86 L52,80 Z', '#fb923c', { sw: 2.5 }) +
    L('M50,20 L50,38', dark('#f97316'), 2.5, { op: 0.5 }) +
    HL('M50,22 L12,84 L22,84 L50,34 Z', 0.3) + SH('M50,22 L92,86 L70,86 L50,36 Z', 0.12),
  // west-coast camper van: two-tone body, roof rack with a surfboard, big windows
  van: () => GROUND(46, 92, 4) +
    E(46, 27, 30, 5, '#fb7185', { stroke: '#be123c' }) + L('M20,27 L72,27', '#fff', 1.5, { op: 0.7 }) + HL('M20,26 L46,24 L46,27 L24,28 Z', 0.4) +
    R(22, 30, 44, 5, 2, STEEL, { sw: 2 }) +
    P('M8,58 C8,46 14,36 28,36 L70,36 C84,36 92,48 92,60 L92,72 C92,75 89,78 86,78 L14,78 C11,78 8,75 8,72 Z', '#f8fafc', { stroke: '#475569' }) +
    P('M8,60 L92,60 L92,72 C92,75 89,78 86,78 L14,78 C11,78 8,75 8,72 Z', '#14b8a6', { stroke: '#0f766e' }) + L('M10,60 L90,60', '#0f766e', 2.5) +
    HL('M12,56 C12,48 16,40 28,40 L28,44 C20,44 16,50 16,56 Z', 0.35) + SH('M82,40 C88,44 90,52 90,60 L90,74 L84,74 L84,60 C84,52 82,46 78,40 Z', 0.12) +
    R(16, 42, 18, 13, 3, SKY, { stroke: NAVY }) + R(38, 42, 18, 13, 3, SKY, { stroke: NAVY }) +
    P('M60,42 L70,42 C80,42 86,48 88,56 L60,56 Z', SKY, { stroke: NAVY }) + HL('M62,44 L70,44 L64,54 L62,54 Z', 0.5) + HL('M18,44 L26,44 L21,53 L18,53 Z', 0.5) +
    L('M58,40 L58,76', '#94a3b8', 2) + R(60, 64, 6, 3, 1.5, '#475569', { sw: 0 }) +
    C(90, 66, 3, '#fde047', { sw: 2 }) + C(10, 66, 2.5, RED, { sw: 2 }) +
    WHEEL(26, 80) + WHEEL(74, 80),
  // suburban home: red roof, chimney, bay windows, lawn shrubs and a picket fence
  house: () => GROUND(46, 92, 4) +
    C(69, 12, 4, '#e5e7eb', { sw: 2 }) + C(75, 6, 3, '#e5e7eb', { sw: 2 }) +
    R(64, 18, 10, 20, 1, '#9f1239') +
    R(18, 48, 64, 38, 3, '#fde68a') +
    HL('M20,50 L26,50 L26,84 L20,84 Z', 0.25) + SH('M76,52 L80,52 L80,84 L76,84 Z', 0.14) +
    P('M8,52 L50,14 L92,52 Z', RED) +
    SH('M50,16 L90,52 L78,52 L50,26 Z', 0.12) + HL('M50,16 L10,52 L22,52 L50,26 Z', 0.25) +
    R(42, 62, 16, 24, 3, '#92400e') + C(54, 75, 1.8, GOLD, { sw: 0 }) +
    WIN(24, 58) + WIN(64, 58) +
    C(12, 76, 7, '#22c55e', { sw: 2.5 }) + C(88, 76, 7, '#22c55e', { sw: 2.5 }) +
    R(2, 82, 38, 3, 1, '#fff', { sw: 1.5, stroke: '#94a3b8' }) + R(60, 82, 38, 3, 1, '#fff', { sw: 1.5, stroke: '#94a3b8' }) +
    [4, 12, 20, 28, 34, 60, 68, 76, 84, 90].map(x => P(`M${x},78 L${x + 3},73 L${x + 6},78 L${x + 6},90 L${x},90 Z`, '#fff', { sw: 2, stroke: '#94a3b8' })).join(''),
  // sleek glass apartment tower with a smaller neighbour and a rooftop mast
  tower: () => {
    let g = '';
    for (let y = 20; y < 88; y += 10) g += L(`M29,${y} L71,${y}`, NAVY, 1.5, { op: 0.45 });
    for (let x = 38; x < 70; x += 12) g += L(`M${x},13 L${x},89`, NAVY, 1.5, { op: 0.45 });
    return GROUND(44, 94, 4) +
      // two shorter neighbours (rooftop garden on the left one) frame the glass tower like a downtown skyline
      R(6, 44, 24, 48, 3, '#93c5fd', { stroke: NAVY }) + L('M10,52 L26,52 M10,60 L26,60 M10,68 L26,68 M10,76 L26,76 M10,84 L26,84 M18,46 L18,92', NAVY, 1.5, { op: 0.4 }) + SH('M24,46 L28,46 L28,90 L24,90 Z', 0.14) +
      R(8, 41, 20, 5, 1.5, '#22c55e', { sw: 1.5, stroke: '#166534' }) + C(12, 40, 2.5, '#16a34a', { sw: 1.5, stroke: '#166534' }) + C(22, 40, 2.5, '#16a34a', { sw: 1.5, stroke: '#166534' }) +
      R(70, 56, 24, 36, 3, '#bfdbfe', { stroke: NAVY }) + L('M74,64 L90,64 M74,72 L90,72 M74,80 L90,80 M82,58 L82,92', NAVY, 1.5, { op: 0.4 }) + SH('M88,58 L92,58 L92,90 L88,90 Z', 0.14) + R(76, 66, 5, 5, 0.8, '#fde68a', { sw: 0, op: 0.9 }) + R(84, 74, 5, 5, 0.8, '#fde68a', { sw: 0, op: 0.9 }) +
      L('M50,2 L50,12', STEEL, 3) + C(50, 2, 2, RED, { sw: 1.5 }) +
      R(26, 10, 48, 82, 3, '#60a5fa', { stroke: NAVY }) +
      [[39, 21], [63, 31], [51, 41], [30, 61], [63, 61], [39, 81], [63, 51], [39, 61], [51, 71]].map(([x, y]) => R(x, y, x === 30 ? 7 : 10, 8, 1, '#fde68a', { sw: 0, op: 0.9 })).join('') + g +
      HL('M30,14 L46,14 L30,44 Z', 0.3) + HL('M30,52 L70,14 L70,26 L30,66 Z', 0.22) + SH('M66,14 L70,14 L70,90 L66,90 Z', 0.16) +
      R(34, 72, 32, 4, 1, STEEL, { sw: 2 }) + R(40, 76, 20, 16, 2, NAVY, { stroke: '#0f172a' }) + R(43, 79, 14, 13, 1.5, '#fde68a', { sw: 0, op: 0.85 }) + L('M50,79 L50,92', NAVY, 1.5) +
      WSP(36, 22, 3.5) + WSP(80, 36, 2.5) + SP(86, 18, 4);
  },
  // Beverly Hills modern mansion: stacked white boxes, floor-to-ceiling glass, palm + pool
  mansion: () => GROUND(46, 94, 4) +
    PALM(84, 46) +
    R(8, 50, 68, 36, 2, '#f8fafc', { stroke: STEEL }) + HL('M11,53 L16,53 L16,83 L11,83 Z', 0.3) + SH('M68,53 L73,53 L73,83 L68,83 Z', 0.14) +
    R(4, 46, 76, 6, 1.5, '#334155', { stroke: '#0f172a' }) +
    R(14, 22, 44, 28, 2, '#f8fafc', { stroke: STEEL }) + HL('M17,27 L22,27 L22,47 L17,47 Z', 0.3) + SH('M50,27 L55,27 L55,47 L50,47 Z', 0.14) +
    R(10, 18, 52, 6, 1.5, '#334155', { stroke: '#0f172a' }) +
    R(24, 28, 30, 18, 1.5, SKY, { sw: 2.5, stroke: NAVY }) + L('M34,28 L34,46 M44,28 L44,46', NAVY, 1.5, { op: 0.6 }) + HL('M26,30 L33,30 L28,44 L26,44 Z', 0.5) +
    R(38, 56, 34, 26, 1.5, SKY, { sw: 2.5, stroke: NAVY }) + L('M49,56 L49,82 M60,56 L60,82', NAVY, 1.5, { op: 0.6 }) + HL('M40,58 L48,58 L42,78 L40,78 Z', 0.5) +
    R(14, 62, 14, 24, 2, '#334155', { stroke: '#0f172a' }) + C(25, 75, 1.6, GOLD, { sw: 0 }) +
    L('M4,86 L80,86', '#94a3b8', 2) +
    E(72, 91, 24, 6, '#38bdf8', { stroke: '#0284c7' }) + L('M56,91 Q62,89 68,91 Q74,93 80,91', '#fff', 1.8, { op: 0.75 }) + HL('M52,90 Q62,86 76,87 Q64,89 54,91 Z', 0.5) +
    L('M88,84 L88,92 M92,84 L92,92 M88,86 L92,86 M88,90 L92,90', '#e2e8f0', 2) +
    C(10, 90, 5, '#22c55e', { sw: 2.5 }) + C(20, 91, 4, '#16a34a', { sw: 2.5 }) + C(34, 91, 3.5, '#22c55e', { sw: 2.5 }),
  // Manhattan penthouse: dark glass skyscraper, lit windows, gold-lit top floor, spire and sparkles
  penthouse: () => GROUND(42, 94, 4) +
    L('M50,0 L50,14', '#cbd5e1', 3) + C(50, 1.5, 1.8, RED, { sw: 1.5 }) +
    R(10, 52, 18, 40, 2, '#1e40af', { stroke: '#0f172a' }) + R(72, 58, 18, 34, 2, '#1e40af', { stroke: '#0f172a' }) +
    [[14, 58], [20, 58], [14, 66], [20, 66], [14, 74], [20, 74], [14, 82], [20, 82], [76, 64], [82, 64], [76, 72], [82, 72], [76, 80], [82, 80]].map(([x, y]) => R(x, y, 4, 5, 0.5, '#fde68a', { sw: 0, op: 0.85 })).join('') +
    R(26, 22, 48, 70, 3, NAVY, { stroke: '#0f172a' }) +
    (() => { let s = ''; for (let y = 40; y < 90; y += 8) for (let x = 31; x < 70; x += 8) s += R(x, y, 5, 5, 0.8, (x * 7 + y * 3) % 5 < 2 ? '#fde68a' : '#3b82f6', { sw: 0, op: 0.9 }); return s; })() +
    HL('M30,26 L34,26 L34,88 L30,88 Z', 0.2) + SH('M66,26 L70,26 L70,88 L66,88 Z', 0.16) +
    R(30, 14, 40, 14, 3, GOLD, { stroke: GOLD_D }) + R(34, 18, 32, 7, 2, '#fff7d6', { sw: 2, stroke: GOLD_D }) + L('M42,18 L42,25 M50,18 L50,25 M58,18 L58,25', GOLD_D, 1.5, { op: 0.6 }) +
    R(28, 27, 44, 5, 1.5, '#0f172a', { stroke: '#0f172a' }) + L('M30,32 L70,32', GOLD, 2, { op: 0.9 }) +
    SP(8, 20, 6) + SP(92, 14, 5) + SP(94, 44, 4) + SP(6, 44, 3.5) + WSP(40, 36, 3) + WSP(60, 60, 3),
};

// ---------- TECH ----------
const RING = (r, col, frac) => { const c = 2 * Math.PI * r; return L(`M50,${50 - r} a${r},${r} 0 1,1 -0.1,0`, col, 3.2, { dash: `${(c * frac).toFixed(1)} ${(c * 2).toFixed(1)}` }); };
const ROTOR = (x, y) => E(x, y, 17, 6, '#cbd5e1', { sw: 2.5, stroke: '#475569', op: 0.92 }) +
  HL(`M${x - 14},${y - 2} C${x - 10},${y - 5} ${x - 4},${y - 6} ${x},${y - 6} L${x},${y - 3} C${x - 5},${y - 3} ${x - 10},${y - 2} ${x - 12},${y} Z`, 0.5) + C(x, y, 3.5, '#334155', { sw: 2, stroke: '#0f172a' });
// one earbud (left of centre, tilted outward): long stem with a silver tip, round head, grey silicone ear tip on the outer side
const BUD = G(R(31, 52, 10, 30, 5, '#fff', { stroke: '#64748b' }) + R(32.5, 76, 7, 4.5, 1.5, '#cbd5e1', { sw: 0 }) + SH('M38,56 L40.5,56 L40.5,76 L38,76 Z', 0.1) +
  C(36, 50, 10, '#fff', { stroke: '#64748b' }) + SH('M41,42 C45,45 45,55 41,58 C43,53 43,47 41,42 Z', 0.12) +
  E(27.5, 48, 4, 5.5, '#cbd5e1', { sw: 1.5, stroke: '#94a3b8' }) + E(27.5, 48, 1.5, 2.5, '#94a3b8', { sw: 0 }) + C(33, 45, 2, '#e2e8f0', { sw: 0 }), { transform: 'rotate(-16 36 64)' });
const ARM = R(13, 54, 12, 24, 6, '#94a3b8', { stroke: '#475569' }) + SH('M20,58 L22,58 L22,74 L20,74 Z', 0.14) + C(19, 80, 6, '#334155', { stroke: '#0f172a' });
const tech = {
  // two white buds standing in a V in front of their closed electric-blue charging case
  earbuds: () => GROUND(40, 92, 4) +
    R(14, 30, 72, 54, 14, '#3b82f6', { stroke: NAVY }) + HL('M19,36 L26,36 L26,78 L19,78 Z', 0.3) + SH('M74,36 L81,36 L81,78 L74,78 Z', 0.14) +
    L('M15,48 L85,48', NAVY, 2.5) + R(40, 45, 20, 6, 3, '#2563eb', { sw: 1.5, stroke: NAVY }) + HL('M18,33 L60,33 L60,36 L18,36 Z', 0.3) +
    BUD + M(BUD) +
    C(50, 72, 3, CYAN, { sw: 1.5, stroke: '#0e7490' }) + WSP(22, 22, 3) + SP(88, 22, 4, CYAN),
  // smartwatch with activity rings (straps, case and bezel each carry a right-side SH so it has the same depth as the phone/laptop)
  watch: () => GROUND(26, 95, 4) +
    R(37, 4, 26, 24, 5, '#3b82f6', { stroke: NAVY }) + L('M43,10 L57,10 M43,16 L57,16', NAVY, 1.5, { op: 0.4 }) + HL('M39,7 L43,7 L43,24 L39,24 Z', 0.25) + SH('M56,7 L61,7 L61,26 L56,26 Z', 0.16) +
    R(37, 72, 26, 22, 5, '#3b82f6', { stroke: NAVY }) + L('M43,80 L57,80 M43,86 L57,86', NAVY, 1.5, { op: 0.4 }) + C(50, 87, 2, NAVY, { sw: 0 }) + SH('M56,74 L61,74 L61,91 L56,91 Z', 0.16) +
    R(70, 40, 6, 12, 2, STEEL, { sw: 2 }) + R(70, 56, 6, 8, 2, STEEL, { sw: 2 }) + SH('M73,42 L75,42 L75,50 L73,50 Z', 0.16) +
    R(26, 24, 48, 52, 12, INK, { stroke: '#000' }) + HL('M30,30 L36,30 L36,70 L30,70 Z', 0.15) + SH('M66,30 L70,30 L70,70 L66,70 Z', 0.3) +
    R(31, 29, 38, 42, 9, '#0f172a', { sw: 2, stroke: '#334155' }) +
    RING(13, '#f43f5e', 0.78) + RING(8.5, '#84cc16', 0.65) + RING(4, '#22d3ee', 0.9) +
    SH('M64,33 L68,33 L68,67 L64,67 Z', 0.3) + HL('M33,32 L41,32 L35,44 L33,44 Z', 0.25) + WSP(84, 20, 3),
  // smartphone with a colourful app grid
  phone: () => GROUND(28, 95, 4) +
    R(28, 4, 44, 90, 9, INK, { stroke: '#000' }) + HL('M31,10 L35,10 L35,88 L31,88 Z', 0.2) +
    R(32, 10, 36, 78, 6, '#38bdf8', { sw: 2, stroke: '#0c4a6e' }) +
    HL('M34,12 L50,12 L34,44 Z', 0.3) + SH('M64,14 L67,14 L67,84 L64,84 Z', 0.14) +
    E(50, 14, 7, 2.5, INK, { sw: 0 }) +
    (() => { const cols = ['#ef4444', '#22c55e', '#f59e0b', '#a855f7', '#ec4899', '#3b82f6', '#14b8a6', '#f97316', '#fff']; let s = ''; for (let i = 0; i < 9; i++) s += R(37 + (i % 3) * 10, 24 + Math.floor(i / 3) * 10, 7, 7, 2, cols[i], { sw: 1.5, stroke: dark(cols[i], 0.3) }); return s; })() +
    R(36, 72, 28, 10, 5, '#0ea5e9', { sw: 1.5, stroke: '#0c4a6e' }) + C(43, 77, 2.5, '#fff', { sw: 0, op: 0.9 }) + C(50, 77, 2.5, '#fff', { sw: 0, op: 0.9 }) + C(57, 77, 2.5, '#fff', { sw: 0, op: 0.9 }) +
    SH('M38,82 L64,82 L62,85 L40,85 Z', 0.14) +
    L('M42,91 L58,91', '#64748b', 2) + WSP(74, 12, 3),
  // open laptop showing a growth chart
  laptop: () => GROUND(46, 92, 4) +
    P('M20,14 L80,14 C83,14 85,16 85,19 L87,62 L13,62 L15,19 C15,16 17,14 20,14 Z', '#334155', { stroke: '#0f172a' }) +
    P('M22,19 L78,19 L80,57 L20,57 Z', '#38bdf8', { sw: 2, stroke: '#0c4a6e' }) + HL('M24,21 L44,21 L26,55 L23,55 Z', 0.25) +
    R(30, 40, 7, 14, 1, '#22c55e', { sw: 1.5, stroke: '#166534' }) + R(40, 32, 7, 22, 1, '#fbbf24', { sw: 1.5, stroke: '#b45309' }) + R(50, 36, 7, 18, 1, '#f472b6', { sw: 1.5, stroke: '#9d174d' }) + R(60, 24, 7, 30, 1, '#a855f7', { sw: 1.5, stroke: '#6b21a8' }) +
    L('M30,34 L44,28 L54,30 L66,20', '#fff', 2.5) + C(66, 20, 2, '#fff', { sw: 0 }) +
    C(50, 16.5, 1.5, STEEL, { sw: 0 }) +
    P('M6,62 L94,62 L97,72 C97,74 95,76 93,76 L7,76 C5,76 3,74 3,72 Z', '#cbd5e1', { stroke: STEEL }) +
    HL('M10,64 L30,64 L28,68 L10,68 Z', 0.4) + SH('M70,64 L92,64 L94,74 L72,74 Z', 0.12) +
    (() => { let s = ''; for (let i = 0; i < 12; i++) s += R(12 + i * 6.5, 64, 4.5, 3, 0.8, STEEL, { sw: 0 }); for (let i = 0; i < 4; i++) s += R(12 + i * 6.5, 69, 4.5, 3, 0.8, STEEL, { sw: 0 }) + R(64 + i * 6.5, 69, 4.5, 3, 0.8, STEEL, { sw: 0 }); return s; })() +
    R(40, 69, 20, 5, 1.5, '#94a3b8', { sw: 1.5, stroke: STEEL }),
  // VR headset: white shell, glossy black visor with a cyan light bar, head strap
  vr: () => GROUND(42, 92, 4) +
    L('M16,52 C8,22 92,22 84,52', '#334155', 7) + L('M16,52 C8,22 92,22 84,52', '#475569', 3.5) + R(44, 26, 12, 7, 2, STEEL, { sw: 2 }) +
    R(8, 36, 84, 36, 14, '#f8fafc', { stroke: '#94a3b8' }) + HL('M12,40 L26,40 L24,66 L12,64 Z', 0.4) + SH('M80,40 L88,40 L88,66 L80,66 Z', 0.14) +
    R(14, 66, 72, 6, 3, '#cbd5e1', { sw: 0 }) +
    R(14, 42, 72, 20, 8, INK, { stroke: '#000' }) + L('M20,52 L80,52', CYAN, 3) + HL('M18,45 L34,45 L30,50 L18,50 Z', 0.25) +
    C(28, 52, 3, CYAN, { sw: 0 }) + C(72, 52, 3, CYAN, { sw: 0 }) +
    L('M8,54 L3,54 M92,54 L97,54', STEEL, 4) +
    SP(90, 28, 5, CYAN) + WSP(30, 30, 3),
  // quadcopter drone, top-down with a camera gimbal
  drone: () => GROUND(40, 92, 4) +
    L('M50,50 L20,24 M50,50 L80,24 M50,50 L20,76 M50,50 L80,76', '#334155', 7) + L('M50,50 L20,24 M50,50 L80,24 M50,50 L20,76 M50,50 L80,76', '#64748b', 3) +
    ROTOR(20, 24) + ROTOR(80, 24) + ROTOR(20, 76) + ROTOR(80, 76) +
    L('M36,62 L36,78 M64,62 L64,78 M30,78 L42,78 M58,78 L70,78', '#334155', 3) +
    R(32, 38, 36, 26, 8, INK, { stroke: '#000' }) + HL('M36,42 L48,42 L46,50 L36,50 Z', 0.25) + SH('M60,42 L64,42 L64,60 L60,60 Z', 0.14) +
    R(40, 40, 20, 6, 3, '#22c55e', { sw: 1.5, stroke: '#166534' }) +
    C(50, 62, 8, '#334155', { stroke: '#0f172a' }) + C(50, 62, 4.5, '#38bdf8', { sw: 1.5, stroke: '#0c4a6e' }) + C(48.5, 60.5, 1.5, '#fff', { sw: 0 }) +
    C(26, 18, 2, RED, { sw: 0 }) + C(74, 18, 2, '#22c55e', { sw: 0 }) + WSP(50, 30, 3),
  // friendly companion robot: visor eyes, blue body, heart screen, claw hands
  robot: () => GROUND(40, 94, 4) +
    L('M50,14 L50,6', STEEL, 3) + C(50, 5, 3.5, RED, { sw: 2 }) +
    ARM + M(ARM) +
    R(30, 80, 14, 8, 3, '#334155', { stroke: '#0f172a' }) + R(56, 80, 14, 8, 3, '#334155', { stroke: '#0f172a' }) +
    R(44, 45, 12, 5, 1.5, STEEL, { sw: 1.5 }) +
    R(24, 48, 52, 34, 9, '#3b82f6', { stroke: NAVY }) + HL('M28,52 L36,52 L36,78 L28,78 Z', 0.25) + SH('M68,52 L72,52 L72,78 L68,78 Z', 0.14) +
    R(38, 56, 24, 16, 4, INK, { stroke: '#000' }) + P(heartPath(50, 64, 4.5), '#f472b6', { sw: 1.5, stroke: '#be185d' }) +
    C(31, 76, 2, '#22c55e', { sw: 0 }) + C(37, 76, 2, '#fde047', { sw: 0 }) +
    R(28, 14, 44, 34, 10, '#e2e8f0', { stroke: STEEL }) + HL('M32,18 L40,18 L40,44 L32,44 Z', 0.35) + SH('M64,18 L68,18 L68,44 L64,44 Z', 0.14) +
    R(34, 24, 32, 16, 7, INK, { stroke: '#000' }) +
    E(42, 32, 4, 5, CYAN, { sw: 0 }) + E(58, 32, 4, 5, CYAN, { sw: 0 }) + C(41, 30, 1.5, '#fff', { sw: 0 }) + C(57, 30, 1.5, '#fff', { sw: 0 }) +
    L('M45,43 Q50,46 55,43', STEEL, 2) +
    R(22, 26, 6, 10, 2, STEEL, { sw: 2 }) + R(72, 26, 6, 10, 2, STEEL, { sw: 2 }) +
    SP(8, 12, 6, CYAN) + SP(92, 10, 5, CYAN) + SP(92, 46, 4) + WSP(12, 40, 3),
};

// ---------- ENERGY ----------
const energy = {
  spark: () => GROUND(24, 90, 4) +
    P(starPath(50, 50, 36, 0.32, 4), '#fde047', { stroke: '#ca8a04' }) +
    F(starPath(50, 50, 18, 0.32, 4), '#fff', { op: 0.6 }) +
    SH('M50,50 L86,50 L58,58 L50,86 Z', 0.12) +
    P(starPath(80, 26, 10, 0.35, 4), '#fde047', { sw: 2.5, stroke: '#ca8a04' }) + P(starPath(20, 72, 8, 0.35, 4), '#fde047', { sw: 2.5, stroke: '#ca8a04' }) + P(starPath(22, 26, 5, 0.35, 4), '#fde047', { sw: 2, stroke: '#ca8a04' }),
  bolt: () => GROUND(26, 93, 4) +
    P('M58,6 L24,54 L46,54 L36,94 L76,40 L54,40 L66,6 Z', '#facc15', { stroke: '#ca8a04' }) +
    HL('M58,6 L24,54 L34,54 L62,12 Z', 0.4) + SH('M62,40 L76,40 L36,94 L48,62 Z', 0.15) +
    P(starPath(84, 22, 7, 0.35, 4), '#fde047', { sw: 2, stroke: '#ca8a04' }) + P(starPath(16, 30, 5, 0.35, 4), '#fde047', { sw: 2, stroke: '#ca8a04' }),
  battery: () => GROUND(44, 89, 4) +
    R(8, 36, 74, 44, 7, '#374151') + R(82, 49, 10, 18, 2, '#6b7280') +
    R(13, 42, 18, 32, 3, '#22c55e', { sw: 2.5, stroke: '#15803d' }) + R(35, 42, 18, 32, 3, '#22c55e', { sw: 2.5, stroke: '#15803d' }) + R(57, 42, 18, 32, 3, '#22c55e', { sw: 2.5, stroke: '#15803d' }) +
    HL('M13,39 L77,39 L77,42 L13,42 Z', 0.3) + SH('M13,74 L77,74 L77,77 L13,77 Z', 0.3) +
    F('M47,44 L35,60 L44,60 L40,72 L55,55 L46,55 L50,44 Z', '#fff', { op: 0.95 }) +
    P(starPath(90, 28, 6, 0.35, 4), '#fde047', { sw: 2, stroke: '#ca8a04' }) + P(starPath(12, 24, 5, 0.35, 4), '#fde047', { sw: 2, stroke: '#ca8a04' }),
};

// ---------- GENERATORS ----------
const gens = {
  // hot-pink food truck with a striped awning, service window and a burger sign on the roof
  food_truck: () => {
    let aw = '';
    for (let i = 0; i < 6; i++) { const x = 10 + i * 9; aw += P(`M${x},30 L${x + 9},30 L${x + 9},36 Q${x + 4.5},42 ${x},36 Z`, i % 2 ? '#fff' : RED, { sw: 2, stroke: '#b91c1c' }); }
    return GROUND(46, 94, 4) +
      R(6, 30, 66, 46, 5, '#f8fafc', { stroke: STEEL }) +
      R(6, 64, 66, 8, 0, '#ec4899', { sw: 0 }) + L('M6,64 L72,64 M6,72 L72,72', '#be185d', 1.5, { op: 0.5 }) +
      HL('M10,34 L16,34 L16,70 L10,70 Z', 0.25) + SH('M64,34 L70,34 L70,74 L64,74 Z', 0.12) +
      P('M72,42 L84,42 C90,42 94,48 94,56 L94,72 C94,74 92,76 90,76 L72,76 Z', '#ec4899', { stroke: '#9d174d' }) +
      P('M75,46 L84,46 C88,46 90,50 90,56 L75,56 Z', SKY, { sw: 2.5, stroke: NAVY }) + HL('M76,48 L82,48 L78,54 L76,54 Z', 0.5) +
      C(92, 66, 3, '#fde047', { sw: 2 }) + L('M74,64 L84,64', '#9d174d', 2, { op: 0.5 }) +
      P('M28,27 C28,17 34,12 42,12 C50,12 56,17 56,27 Z', BREAD, { sw: 2.5 }) + SESAME(38, 19) + SESAME(46, 17) + R(26, 25, 32, 5, 2.5, '#7c3f1d', { sw: 2 }) +
      R(8, 27, 58, 5, 2.5, RED, { sw: 2, stroke: '#b91c1c' }) + aw +
      R(16, 44, 36, 16, 3, SKY, { stroke: NAVY }) + HL('M19,47 L30,47 L24,57 L19,57 Z', 0.4) + R(14, 59, 40, 5, 2, '#94a3b8', { sw: 2 }) +
      WHEEL(22, 80) + WHEEL(80, 80);
  },
  // cash machine: screen with a glowing $, keypad, card slot and a bill coming out
  atm: () => GROUND(40, 94, 4) +
    R(20, 6, 60, 86, 6, '#cbd5e1', { stroke: '#475569' }) + HL('M24,20 L30,20 L30,86 L24,86 Z', 0.3) + SH('M70,20 L76,20 L76,86 L70,86 Z', 0.14) +
    P('M26,6 L74,6 C77,6 80,9 80,12 L80,19 L20,19 L20,12 C20,9 23,6 26,6 Z', '#3b82f6', { stroke: NAVY }) + T(50, 16, 'ATM', 9, '#fff') +
    R(27, 24, 46, 26, 3, '#0f172a', { stroke: '#1e293b' }) + T(50, 44, '$', 20, '#22c55e') + L('M31,28 L44,28', '#22c55e', 2, { op: 0.6 }) + HL('M30,27 L40,27 L34,36 L30,36 Z', 0.3) +
    R(27, 54, 28, 22, 3, '#94a3b8', { stroke: '#475569' }) +
    [58, 65, 72].map(y => [33, 41, 49].map(x => C(x, y, 2.3, '#475569', { sw: 0 })).join('')).join('') +
    R(62, 54, 10, 8, 1.5, '#f59e0b', { sw: 1.5, stroke: GOLD_D }) + R(60, 60, 14, 4, 1.5, '#1e293b', { stroke: '#0f172a' }) +
    C(67, 70, 2.5, '#22c55e', { sw: 1.5, stroke: '#15803d' }) +
    R(34, 72, 32, 12, 2, '#4ade80', { stroke: '#166534' }) + T(50, 81, '$', 10, '#166534') + R(30, 80, 40, 6, 2, '#1e293b', { stroke: '#0f172a' }),
  // modern computerised sewing machine: C-shaped blue body, LCD stitch screen, hand wheel, pink thread from the spool to the needle
  sewing_machine: () => GROUND(46, 94, 4) +
    R(31, 2, 10, 13, 2.5, PINK, { sw: 2, stroke: '#be185d' }) + L('M33,5 L39,5 M33,8 L39,8 M33,11 L39,11', '#fff', 1.2, { op: 0.5 }) + L('M36,15 L36,18', '#64748b', 2) +
    R(4, 76, 92, 12, 5, NAVY, { stroke: '#0f172a' }) + HL('M8,78 L44,78 L44,81 L8,81 Z', 0.25) + SH('M70,79 L92,79 L92,86 L70,86 Z', 0.14) +
    P('M2,72 L36,72 L40,78 L6,78 Z', '#f9a8d4', { sw: 2, stroke: '#be185d' }) + L('M9,75 L33,75', '#be185d', 1.2, { dash: '2 2', op: 0.7 }) +
    P('M24,16 L84,16 C87,16 90,19 90,22 L90,76 L58,76 L58,36 L44,36 L44,56 C44,58 42,60 40,60 L22,60 C20,60 18,58 18,56 L18,22 C18,19 21,16 24,16 Z', '#3b82f6', { stroke: NAVY }) +
    HL('M22,19 L82,19 L82,23 L22,23 Z', 0.3) + HL('M21,24 L25,24 L25,56 L21,56 Z', 0.25) + SH('M85,22 L88,22 L88,74 L85,74 Z', 0.14) + SH('M46,32 L58,32 L58,36 L46,36 Z', 0.12) +
    R(25, 40, 14, 16, 3, '#60a5fa', { sw: 2, stroke: NAVY }) + C(40, 52, 1.6, '#fde047', { sw: 0 }) +
    L('M30,60 L30,70', '#94a3b8', 3.5) + L('M30,70 L30,75', '#475569', 1.8) + R(24, 69, 12, 4, 1.5, '#cbd5e1', { sw: 1.5, stroke: '#475569' }) +
    L('M41,7 C50,7 48,24 34,26 C30,27 30,34 30,42', PINK, 2) +
    C(50, 26, 4.5, '#1e3a8a', { sw: 2, stroke: '#0f172a' }) + L('M50,22.5 L50,26', '#93c5fd', 1.5) + L('M62,24 L78,24', '#fff', 2, { op: 0.6 }) +
    R(64, 42, 20, 22, 3, INK, { stroke: '#0f172a' }) + L('M68,49 L71,45 L74,49 L77,45 L80,49', CYAN, 2) + L('M68,56 L80,56', CYAN, 2, { dash: '2.5 2' }) + HL('M66,44 L72,44 L68,52 L66,52 Z', 0.25) +
    C(70, 70, 2.2, '#22c55e', { sw: 0 }) + C(78, 70, 2.2, '#f43f5e', { sw: 0 }) +
    C(90, 38, 8, '#1e3a8a', { stroke: '#0f172a' }) + C(90, 38, 3, '#93c5fd', { sw: 1.5, stroke: NAVY }) + HL('M84,35 C85,32 87,31 89,31 L89,33 C87,33 86,34 85,36 Z', 0.4),
  toolbox: () => GROUND(46, 93, 4) +
    R(14, 18, 8, 34, 3, '#d9a066') + R(6, 10, 24, 10, 3, '#6b7280') +
    L('M80,8 L80,22', '#9ca3af', 3.5) + R(76, 22, 8, 26, 3, '#fbbf24') + L('M80,26 L80,40', '#b45309', 1.5, { op: 0.6 }) +
    P('M34,42 L34,30 C34,24 66,24 66,30 L66,42 L60,42 L60,32 C60,29 40,29 40,32 L40,42 Z', '#374151') +
    R(12, 40, 76, 14, 4, '#dc2626') + HL('M14,42 L40,42 L40,46 L14,46 Z', 0.25) +
    R(12, 52, 76, 36, 5, RED) +
    R(44, 50, 12, 10, 2, '#fbbf24') + C(50, 55, 2, '#b45309', { sw: 0 }) +
    R(22, 62, 22, 16, 2, '#fff', { sw: 0, op: 0.9 }) + L('M27,74 L39,66', '#374151', 3) + C(27, 74, 3.5, '#374151', { sw: 0 }) +
    HL('M14,56 L20,56 L20,84 L14,84 Z', 0.25) + SH('M80,56 L86,56 L86,84 L80,84 Z', 0.14),
  // tech lab: 3D printer building a cyan part, LED strip, filament spool on top
  tech_lab: () => GROUND(46, 94, 4) +
    R(12, 20, 76, 68, 6, '#334155', { stroke: '#0f172a' }) + HL('M16,24 L22,24 L22,84 L16,84 Z', 0.2) + SH('M78,24 L84,24 L84,84 L78,84 Z', 0.14) +
    R(20, 28, 60, 50, 3, '#0f172a', { stroke: '#000' }) +
    L('M24,31 L76,31', CYAN, 2.5, { op: 0.9 }) +
    // gantry rail + print head; the filament comes in from the pink spool bolted on the top-right corner
    R(20, 36, 60, 5, 2, '#94a3b8', { sw: 2, stroke: '#475569' }) +
    C(84, 16, 10, '#f472b6', { stroke: '#be185d' }) + C(84, 16, 3.5, '#fff', { sw: 1.5, stroke: '#be185d' }) + HL('M76,13 C77,10 79,8 82,8 L82,10 C80,10 78,12 78,14 Z', 0.5) +
    L('M84,26 C84,34 60,30 52,34', '#f472b6', 2) +
    R(42, 33, 16, 11, 2.5, STEEL, { stroke: '#334155' }) + HL('M44,35 L48,35 L48,42 L44,42 Z', 0.3) + P('M46,44 L54,44 L51.5,50 L48.5,50 Z', '#f59e0b', { sw: 2, stroke: GOLD_D }) +
    L('M50,50 L50,55', CYAN, 2.5, { op: 0.9 }) + C(50, 51.5, 2.2, '#fde047', { sw: 0, op: 0.8 }) +
    R(22, 70, 56, 6, 2, STEEL, { stroke: '#334155' }) + L('M26,73 L74,73', '#334155', 1.2, { op: 0.6 }) +
    // half-printed cyan robot head: finished layers below, the top layer still open
    R(36, 58, 28, 12, 3, CYAN, { stroke: '#0e7490' }) + L('M38,62 L62,62 M38,66 L62,66', '#0e7490', 1.2, { op: 0.6 }) + HL('M38,60 L44,60 L44,68 L38,68 Z', 0.3) +
    R(38, 55, 24, 4, 1.5, '#67e8f9', { sw: 1.5, stroke: '#0e7490' }) + R(42, 63, 5, 4, 1, '#0f172a', { sw: 0 }) + R(53, 63, 5, 4, 1, '#0f172a', { sw: 0 }) +
    R(28, 80, 24, 5, 2, '#22c55e', { sw: 1.5, stroke: '#166534' }) + C(72, 82.5, 2.5, '#fde047', { sw: 1.5, stroke: '#ca8a04' }) +
    WSP(30, 48, 3) + SP(10, 12, 4, CYAN),
};

// ---------- CHAINS ----------
export const CHAINS = {
  food: {
    key: 'food', name: N('Food', 'طعام'), color: '#f97316',
    gen: { name: N('Food Truck', 'شاحنة طعام'), icon: gens.food_truck },
    levels: [
      lv('Crumbs', 'فتات', food.crumbs), lv('Hot Dog', 'هوت دوغ', food.hotdog), lv('Cheeseburger', 'تشيز برغر', food.burger), lv('Pizza Slice', 'شريحة بيتزا', food.slice),
      lv('Fries & Shake', 'بطاطس وميلك شيك', food.combo), lv('BBQ Platter', 'طبق باربكيو', food.bbq), lv('Golden B-Day Cake', 'كيكة عيد ميلاد ذهبية', food.cake),
    ],
  },
  money: {
    key: 'money', name: N('Money', 'مال'), color: '#22c55e',
    gen: { name: N('ATM', 'صراف آلي'), icon: gens.atm },
    levels: [
      lv('Cent', 'سنت', money.cent), lv('Coin Stack', 'كومة عملات', money.stack), lv('Dollar Bill', 'ورقة دولار', money.bill), lv('Wallet', 'محفظة', money.wallet),
      lv('Money Bag', 'كيس دولارات', money.bag), lv('Gold Bar', 'سبيكة ذهب', money.bars), lv('Bank Vault', 'خزنة بنك', money.vault),
    ],
  },
  fashion: {
    key: 'fashion', name: N('Fashion', 'موضة'), color: '#ec4899',
    gen: { name: N('Sewing Machine', 'ماكينة خياطة'), icon: gens.sewing_machine },
    levels: [
      lv('Button', 'زر', fashion.button), lv('Thread Spool', 'بكرة خيط', fashion.spool), lv('Denim Roll', 'لفة جينز', fashion.denim), lv('Tee on Hanger', 'تيشيرت على علاقة', fashion.tee),
      lv('Varsity Jacket', 'جاكيت فارسيتي', fashion.varsity), lv('Tuxedo', 'توكسيدو', fashion.tuxedo), lv('Star Trophy', 'كأس النجمة', fashion.trophy),
    ],
  },
  home: {
    key: 'home', name: N('Home', 'منزل'), color: '#3b82f6',
    gen: { name: N('Toolbox', 'صندوق عدة'), icon: gens.toolbox },
    levels: [
      lv('Cardboard Box', 'صندوق كرتون', home.box), lv('Camping Tent', 'خيمة تخييم', home.tent), lv('Camper Van', 'فان تخييم', home.van), lv('Suburban House', 'بيت ضواحي', home.house),
      lv('Glass Tower', 'برج زجاجي', home.tower), lv('Modern Mansion', 'قصر عصري', home.mansion), lv('Sky Penthouse', 'بنتهاوس', home.penthouse),
    ],
  },
  tech: {
    key: 'tech', name: N('Tech', 'تقنية'), color: '#06b6d4',
    gen: { name: N('Tech Lab', 'مختبر تقني'), icon: gens.tech_lab },
    levels: [
      lv('Earbuds', 'سماعات لاسلكية', tech.earbuds), lv('Smartwatch', 'ساعة ذكية', tech.watch), lv('Smartphone', 'هاتف ذكي', tech.phone), lv('Laptop', 'لابتوب', tech.laptop),
      lv('VR Headset', 'نظارة VR', tech.vr), lv('Drone', 'درون', tech.drone), lv('Robot', 'روبوت', tech.robot),
    ],
  },
  energy: {
    key: 'energy', name: N('Energy', 'طاقة'), color: '#facc15',
    gen: null,
    levels: [lv('Spark', 'شرارة', energy.spark), lv('Lightning Bolt', 'صاعقة', energy.bolt), lv('Battery', 'بطارية', energy.battery)],
  },
};
// Single source of truth for the top merge level (levels.js re-exports it): the longest non-energy chain.
export const MAX_LEVEL = Math.max.apply(null, Object.keys(CHAINS).filter(k => k !== 'energy').map(k => CHAINS[k].levels.length));

// Bilingual name of a chain level (lvl is 1-based; clamped to the chain's range). chain = key or chain object.
export function itemName(chain, lvl) {
  const ch = typeof chain === 'string' ? CHAINS[chain] : chain;
  const levels = (ch && ch.levels) || [];
  if (!levels.length) return N('?', '؟');
  const i = Math.max(0, Math.min(levels.length - 1, (lvl || 1) - 1));
  return levels[i].name;
}
// SVG inner content for a chain level (same rules as itemName).
export function itemIcon(chain, lvl) {
  const ch = typeof chain === 'string' ? CHAINS[chain] : chain;
  const levels = (ch && ch.levels) || [];
  if (!levels.length) return '';
  const i = Math.max(0, Math.min(levels.length - 1, (lvl || 1) - 1));
  return levels[i].icon();
}
