// Hats (cat 'hat'): modern American headwear — caps, snapbacks, truckers, sports helmets, streetwear and a few
// legendary showpieces. Sticker style, drawn on the avatar rig (head x 82..238, top y=38, ears at y≈146).
// Closed hats (hidesHairFront) use a skull dome 2-4px OUTSIDE the head so no scalp shows at the temples; the dome's
// open bottom is always hidden behind a brim or band drawn after it. Open-crown hats (cap, snapback, trucker, beret,
// uncle sam) also return `clipHairTop` = the y below which hair.front may show, but avatar.js only honours
// hidesHair / hidesHairFront today, so OPEN_CROWN_HIDES_FRINGE keeps them closed (tall hair never pokes through the
// fabric). Flip it to false once avatar.js clips hair.front with a <clipPath> rect starting at clipHairTop.
// ui.js crops hat thumbnails to viewBox '50 10 220 230', so every piece stays inside x 52..268 / y 12..238.
import { P, F, SH, HL, C, E, R, L, T, MIRROR, STAR, SPARK, COLORS, variants, single, dark, light } from './_kit.js';

// ---------- helpers ----------
const num = v => (Math.round(v * 10) / 10).toString();
const lum = h => { const n = parseInt(h.slice(1), 16); return (0.299 * ((n >> 16) & 255) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255)) / 255; };
// Seam / stitch colour that still reads on near-black fabric.
const seam = a => (lum(a) < 0.2 ? light(a, 0.28) : dark(a, 0.32));
// Outline colour for white pieces (dark(white) is a flat grey; this one is a touch cooler).
const WHITE_LN = '#94a3b8';
// Open-crown hats hide the fringe until avatar.js can clip hair.front at `clipHairTop` (see the header).
const OPEN_CROWN_HIDES_FRINGE = true;
// Outlined tube stroke (face-mask bars, helmet straps).
const TUBE = (d, col, sw) => L(d, dark(col, 0.45), sw + 3.5) + L(d, col, sw);
// Small round gem with a highlight dot.
const gem = (x, y, r, col) => C(x, y, r, col, { sw: 2, stroke: dark(col, 0.35) }) + HL(`M${x - r * 0.5},${y - r * 0.5} a${r * 0.3},${r * 0.3} 0 1 0 0.1,0 Z`, 0.7);
// Five-petal flower (petals + centre), flat sticker look.
function flower(x, y, r, petal, centre) {
  let s = '';
  for (let i = 0; i < 5; i++) {
    const a = -Math.PI / 2 + (i * Math.PI * 2) / 5;
    s += C(num(x + r * Math.cos(a)), num(y + r * Math.sin(a)), num(r * 0.78), petal, { sw: 1.5, stroke: dark(petal, 0.3) });
  }
  return s + C(x, y, num(r * 0.6), centre, { sw: 1.5, stroke: dark(centre, 0.3) });
}
// Grid of short segments wherever pred(x,y) holds (trucker mesh, plaid). Cells are `step` wide.
function mesh(pred, col, step, sw, op, off) {
  const o = off || 0;
  let d = '';
  for (let y = 34 + o; y <= 120; y += step) {
    for (let x = 80 + o; x <= 240; x += step) {
      if (!pred(x, y)) continue;
      if (pred(x + step, y)) d += `M${x},${y}L${x + step},${y}`;
      if (pred(x, y + step)) d += `M${x},${y}L${x},${y + step}`;
    }
  }
  return d ? L(d, col, sw, { op }) : '';
}
// Fluffy fur band: straight rectangle with scalloped top and bottom edges (santa, trapper).
function furBand(x0, x1, y0, y1, col, stroke) {
  const n = 10, st = (x1 - x0) / n;
  let d = `M${x0},${y0}`;
  for (let i = 0; i < n; i++) d += ` Q${num(x0 + st * (i + 0.5))},${y0 - 7} ${num(x0 + st * (i + 1))},${y0}`;
  d += ` L${x1},${y1}`;
  for (let i = n; i > 0; i--) d += ` Q${num(x0 + st * (i - 0.5))},${y1 + 7} ${num(x0 + st * (i - 1))},${y1}`;
  return P(d + ' Z', col, { stroke });
}
// Crown dome 2-4px outside the head (head x 82..238, top y=38). Its flat bottom is hidden behind a brim or band.
const DOME = 'M80,122 C80,52 112,34 160,34 C208,34 240,52 240,122 Z';
const domeShade = (op) => SH('M198,42 C228,58 240,94 240,122 L212,122 C216,92 214,60 198,42 Z', op || 0.14) + HL('M94,84 C98,60 116,44 138,38 C124,52 110,66 102,88 Z', 0.3);
// Curved cap visor with a stitch line, in colour b (drawn after the crown; hides the dome's bottom edge).
const CURVED_BRIM = 'M66,116 L254,116 C262,124 256,134 242,134 C206,140 114,140 78,134 C64,134 58,124 66,116 Z';
const curvedBrim = (b) => P(CURVED_BRIM, b) +
  SH('M160,118 C206,118 240,120 254,116 C256,126 250,134 242,134 C206,140 160,140 160,140 Z', 0.12) +
  HL('M72,118 L150,118 L150,124 L76,124 Z', 0.3) +
  L('M78,128 C120,135 200,135 242,128', seam(b), 2, { op: 0.6, dash: '4 4' });
// Dome bottom shadow (crown meets the brim).
const domeFoot = () => SH('M80,110 L240,110 L240,122 L80,122 Z', 0.12);

// ---------- templates ----------
export const TEMPLATES = {
  // Baseball cap (dad cap): six-panel crown with seams, eyelets, a white star patch, button and curved visor.
  cap: (c) => {
    const a = c.a, b = c.b || a;
    return { hidesHairFront: OPEN_CROWN_HIDES_FRINGE, clipHairTop: 112, front:
      P(DOME, a) + domeShade() +
      L('M160,36 L160,118 M122,42 C112,62 104,92 102,118 M198,42 C208,62 216,92 218,118', seam(a), 2.5, { op: 0.75 }) +
      C(120, 72, 2.8, seam(a), { sw: 0, op: 0.8 }) + C(200, 72, 2.8, seam(a), { sw: 0, op: 0.8 }) +
      STAR(160, 82, 9, '#f8fafc', { sw: 1.5, stroke: '#cbd5e1' }) +
      C(160, 36, 6, a) +
      domeFoot() + curvedBrim(b) };
  },
  // Snapback: boxier crown, flat wide brim with the gold brim sticker, big front letters (item.txt: NY / LA / CHI).
  snapback: (c, ctx, item) => {
    const a = c.a, b = c.b || '#f8fafc', txt = (item && item.txt) || 'NY';
    const crown = 'M80,120 C80,52 108,30 160,30 C212,30 240,52 240,120 Z';
    const brim = 'M60,112 L260,112 L262,128 C200,136 120,136 58,128 Z';
    return { hidesHairFront: OPEN_CROWN_HIDES_FRINGE, clipHairTop: 110, front:
      P(crown, a) +
      SH('M198,38 C228,54 240,92 240,120 L212,120 C216,90 214,58 198,38 Z', 0.14) +
      HL('M94,82 C98,58 116,40 138,34 C124,48 110,64 102,86 Z', 0.3) +
      L('M160,32 L160,112 M118,40 C108,60 102,90 100,112 M202,40 C212,60 218,90 220,112', seam(a), 2.5, { op: 0.75 }) +
      C(118, 66, 2.8, seam(a), { sw: 0, op: 0.8 }) + C(202, 66, 2.8, seam(a), { sw: 0, op: 0.8 }) +
      C(160, 32, 6, a) +
      T(160, 102, txt, 34, b, { stroke: dark(a, 0.5), sw: 2.5 }) +
      SH('M80,106 L240,106 L240,120 L80,120 Z', 0.12) +
      P(brim, b) +
      SH('M160,114 L260,114 L262,128 C230,132 196,135 160,135 Z', 0.12) +
      HL('M66,114 L150,114 L150,120 L68,120 Z', 0.3) +
      R(206, 116, 30, 10, 2, '#f59e0b', { sw: 1.5 }) + L('M211,121 L231,121', '#fff', 1.5, { op: 0.75 }) };
  },
  // Trucker cap: foam front panel (b) with a patch (item.txt), mesh sides drawn as a grid, curved visor.
  trucker: (c, ctx, item) => {
    const a = c.a, b = c.b || '#f8fafc', txt = (item && item.txt) || 'USA';
    const foam = 'M100,122 C102,64 128,38 160,38 C192,38 218,64 220,122 Z';
    const inMesh = (x, y) => {
      if (y > 116) return false;
      const dx = (x - 160) / 76, dy = (y - 122) / 84;
      if (dx * dx + dy * dy > 1) return false;
      const fx = (x - 160) / 64, fy = (y - 122) / 90;
      return fx * fx + fy * fy > 1;
    };
    return { hidesHairFront: OPEN_CROWN_HIDES_FRINGE, clipHairTop: 112, front:
      P(DOME, a) + mesh(inMesh, light(a, 0.5), 7, 1.5, 0.55) + domeShade() +
      P(foam, b) +
      SH('M190,46 C210,62 220,92 220,122 L204,122 C204,96 198,66 186,48 Z', 0.1) +
      HL('M108,100 C110,66 128,46 150,40 C134,52 120,72 116,104 Z', 0.35) +
      L('M160,40 L160,118', seam(b), 2, { op: 0.6 }) +
      R(136, 68, 48, 26, 7, a, { sw: 2.5 }) + T(160, 87, txt, 15, '#fff', { stroke: dark(a, 0.4), sw: 1 }) +
      C(160, 36, 6, a) +
      domeFoot() + curvedBrim(a) };
  },
  // Knit beanie: dome + ribbed fold-up band + pom (b), chevron knit rows and a tiny woven label.
  beanie: (c) => {
    const a = c.a, b = c.b || '#f8fafc';
    const dome = 'M82,122 C82,56 112,34 160,34 C208,34 238,56 238,122 Z';
    let ribs = '';
    for (let x = 94; x <= 226; x += 16) ribs += `M${x},100 L${x},118 `;
    return { hidesHairFront: true, front:
      P(dome, a) +
      SH('M196,42 C226,56 238,90 238,122 L214,122 C216,88 212,58 196,42 Z', 0.14) +
      HL('M96,84 C100,60 118,44 140,38 C126,50 110,64 104,88 Z', 0.3) +
      L('M120,78 L127,88 L134,78 M150,66 L157,76 L164,66 M180,78 L187,88 L194,78 M135,52 L142,62 L149,52 M165,52 L172,62 L179,52 M104,96 L111,106 L118,96 M196,96 L203,106 L210,96', seam(a), 3, { op: 0.85 }) +
      R(80, 96, 160, 26, 12, a) +
      L(ribs, seam(a), 3, { op: 0.85 }) +
      SH('M202,96 L240,96 L240,122 L202,122 Z', 0.12) +
      HL('M84,100 L120,100 L120,106 L86,106 Z', 0.3) +
      R(100, 104, 18, 10, 2, b, { sw: 1.5, stroke: dark(b, 0.3) }) + L('M104,109 L114,109', dark(b, 0.35), 1.5) +
      C(160, 34, 15, b) +
      L('M150,26 L156,34 M164,26 L160,36 M148,40 L156,36 M172,40 L164,36', dark(b, 0.25), 2.2, { op: 0.7 }) +
      HL('M150,24 C154,20 164,20 168,24 C162,24 154,26 150,24 Z', 0.4) };
  },
  // Sport sweatband: chunky terry band (≈25px) low on the forehead, two racing stripes (b, c), terry stitch rows
  // along both edges and a tiny woven label on the left.
  sweatband: (c) => {
    const a = c.a, b = c.b || '#ef4444', cc = c.c || b;
    const band = 'M78,130 C84,94 118,80 160,80 C202,80 236,94 242,130 L242,154 C236,120 202,106 160,106 C118,106 84,120 78,154 Z';
    return { hidesHairFront: false, front:
      P(band, a) +
      L('M82,134 C90,106 122,92 160,92 C198,92 230,106 238,134', b, 5.5) +
      L('M80,144 C88,114 122,100 160,100 C198,100 232,114 240,144', cc, 3.5) +
      L('M84,124 C94,100 124,86 160,86 C196,86 226,100 236,124', seam(a), 2.2, { op: 0.45, dash: '1.5 4' }) +
      L('M82,150 C90,118 122,105 160,105 C198,105 230,118 238,150', seam(a), 2.2, { op: 0.45, dash: '1.5 4' }) +
      SH('M204,88 C226,98 238,112 242,130 L242,154 C238,130 224,116 202,110 Z', 0.14) +
      HL('M84,120 C94,98 120,83 150,81 L150,88 C124,90 102,102 90,122 Z', 0.35) +
      R(98, 106, 16, 9, 2, '#f8fafc', { sw: 1.2, stroke: '#cbd5e1' }) + L('M102,110.5 L110,110.5', b, 1.6) };
  },
  // Sun visor: terry band (a) with a star logo, the hair pokes out above, curved visor in b.
  visor_cap: (c) => {
    const a = c.a, b = c.b || a;
    const band = 'M80,128 C86,98 120,88 160,88 C200,88 234,98 240,128 L240,146 C236,122 202,114 160,114 C118,114 84,122 80,146 Z';
    const brim = 'M64,114 L256,114 C266,124 258,142 240,144 C206,150 114,150 80,146 C62,144 54,124 64,114 Z';
    return { hidesHairFront: false, front:
      P(band, a) +
      SH('M200,92 C224,100 236,112 240,128 L240,146 C236,124 220,114 198,110 Z', 0.14) +
      HL('M86,116 C96,98 120,90 150,89 L150,95 C122,96 100,104 90,120 Z', 0.35) +
      L('M90,118 C100,102 126,96 160,96', '#fff', 2.5, { op: 0.5 }) +
      L('M84,126 C96,110 126,104 160,104 C194,104 224,110 236,126', seam(a), 2, { op: 0.5, dash: '2 4' }) +
      STAR(160, 102, 6.5, b, { sw: 1.5 }) +
      P(brim, b) +
      SH('M160,116 L256,116 C266,124 258,142 240,144 C214,148 188,150 160,150 Z', 0.12) +
      HL('M70,116 L150,116 L150,122 L72,122 Z', 0.3) +
      L('M74,136 C120,146 200,146 246,136', seam(b), 2, { op: 0.6, dash: '4 4' }) };
  },
  // Durag: glossy silk cap low on the forehead, twin seams, side knot + two silk tails hanging behind the right
  // shoulder (drawn in `back`; they end above y=236 so the hat thumbnail crop keeps them whole).
  durag: (c) => {
    const a = c.a;
    const cloth = 'M80,124 C80,56 110,34 160,34 C210,34 240,56 240,124 C226,110 194,104 160,104 C126,104 94,110 80,124 Z';
    const back = P('M226,128 C248,164 260,200 254,234 L244,234 C248,200 238,174 220,142 Z', a) +
      SH('M238,156 C252,182 258,206 254,232 L249,232 C252,206 246,182 234,160 Z', 0.14) +
      HL('M228,150 C244,176 250,200 248,228 L245,228 C246,200 240,178 224,154 Z', 0.3) +
      P('M230,130 C236,168 236,204 226,232 L216,232 C224,204 224,172 218,140 Z', a) +
      HL('M232,146 C236,178 236,204 228,226 L224,226 C230,204 230,178 226,150 Z', 0.3);
    return { hidesHair: true, back, front:
      P(cloth, a) +
      SH('M196,42 C226,58 240,94 240,124 C232,116 222,110 210,108 C212,84 208,60 196,42 Z', 0.16) +
      HL('M98,84 C102,58 122,42 150,38 C132,50 116,66 104,88 Z', 0.4) +
      L('M148,36 C138,58 134,82 136,106 M172,36 C182,58 186,82 184,106', seam(a), 2.5, { op: 0.7 }) +
      L('M106,64 C116,52 130,44 148,42', '#fff', 3, { op: 0.45 }) +
      L('M86,120 C98,112 126,107 160,107 C194,107 222,112 234,120', '#fff', 2, { op: 0.25 }) +
      C(234, 122, 8, a) + HL('M229,118 C231,116 235,116 237,118 C235,118 231,120 229,118 Z', 0.45) };
  },
  // Football helmet (epic): full shell with a face opening, centre stripe + star decals, ear hole, grey face mask
  // bars across the nose/mouth and a chin cup. Covers all hair.
  football_helmet: (c) => {
    const a = c.a, b = c.b || '#f8fafc', bar = '#cbd5e1';
    const shell = 'M70,146 C70,48 110,20 160,20 C210,20 250,48 250,146 C250,178 246,200 236,214 L220,214 L224,120 C216,100 190,92 160,92 C130,92 104,100 96,120 L100,214 L84,214 C74,200 70,178 70,146 Z';
    return { hidesHair: true, front:
      P(shell, a) +
      SH('M196,30 C234,50 250,100 250,146 C250,178 246,200 236,214 L220,214 L224,120 C228,80 220,46 196,30 Z', 0.14) +
      HL('M90,96 C94,62 118,34 150,26 C126,42 106,66 100,100 Z', 0.3) +
      P('M153,21 L167,21 L168,93 L152,93 Z', b, { sw: 2 }) +
      L('M144,24 L143,92 M176,24 L177,92', b, 2.5, { op: 0.85 }) +
      STAR(118, 66, 8, b, { sw: 1.5 }) + STAR(202, 66, 8, b, { sw: 1.5 }) +
      C(84, 150, 6, dark(a, 0.5), { sw: 2, stroke: dark(a, 0.62) }) + C(236, 150, 6, dark(a, 0.5), { sw: 2, stroke: dark(a, 0.62) }) +
      HL('M78,148 a2.5,2.5 0 1 0 0.1,0 Z', 0.5) +
      TUBE('M80,164 C98,180 222,180 240,164', bar, 5) +
      TUBE('M86,190 C102,206 218,206 234,190', bar, 5) +
      TUBE('M106,170 L108,198 M214,170 L212,198', bar, 4.5) +
      L('M84,165 C100,178 150,180 160,180 M90,191 C104,204 150,206 160,206', '#fff', 1.6, { op: 0.6 }) +
      P('M136,214 C146,228 174,228 184,214 L186,226 C174,238 146,238 134,226 Z', '#f8fafc', { stroke: WHITE_LN }) +
      HL('M138,216 C144,224 152,228 160,229 L160,233 C150,232 142,228 137,222 Z', 0.5) };
  },
  // Batting helmet: glossy shell, number on the front (item.txt), single ear flap on the left, hard brim.
  baseball_helmet: (c, ctx, item) => {
    const a = c.a, b = c.b || '#f8fafc', txt = (item && item.txt) || '7';
    const shell = 'M78,124 C78,50 112,28 160,28 C208,28 242,50 242,124 Z';
    const flap = 'M76,120 C70,148 72,172 86,186 C98,194 112,186 112,170 L112,120 Z';
    const brim = 'M64,118 L256,118 C264,126 258,136 244,136 C206,142 114,142 76,136 C62,136 56,126 64,118 Z';
    return { hidesHairFront: true, front:
      P(shell, a) +
      SH('M198,36 C230,52 242,96 242,124 L214,124 C216,92 214,56 198,36 Z', 0.14) +
      HL('M92,90 C96,58 118,38 146,32 C124,48 108,68 100,94 Z', 0.35) +
      L('M104,66 C114,48 130,38 148,34', '#fff', 4, { op: 0.5 }) +
      T(160, 106, txt, 30, b, { stroke: dark(a, 0.5), sw: 2.5 }) +
      SH('M78,112 L242,112 L242,124 L78,124 Z', 0.12) +
      P(flap, a) +
      SH('M100,124 L112,124 L112,170 C112,180 104,188 94,190 C104,180 102,150 100,124 Z', 0.14) +
      C(92, 154, 5, dark(a, 0.5), { sw: 0 }) +
      P(brim, a) +
      SH('M160,120 L256,120 C264,126 258,136 244,136 C214,141 188,142 160,142 Z', 0.12) +
      HL('M70,120 L150,120 L150,126 L72,126 Z', 0.3) };
  },
  // Uncle Sam top hat (legendary): white stovepipe with red stripes, navy star band, round brim.
  uncle_sam_hat: (c) => {
    const a = c.a || '#f8fafc', b = c.b || '#dc2626', cc = c.c || '#1e3a8a';
    const hw = y => 68 + 14 * (y - 24) / 97;   // crown half-width: 68 at the top (y=24) → 82 at the bottom (y=121)
    const crown = 'M78,121 L92,24 A68,10 0 0 0 228,24 L242,121 Z';
    let stripes = '';
    for (const o of [-60, -40, -20, 20, 40, 60]) {
      const yt = 25 + 10 * Math.sqrt(1 - (o / 68) * (o / 68)), s = hw(104) / 68;
      stripes += F(`M${num(160 + o - 5)},${num(yt)} L${num(160 + o + 5)},${num(yt)} L${num(160 + (o + 5) * s)},104 L${num(160 + (o - 5) * s)},104 Z`, b);
    }
    let stars = '';
    for (const x of [100, 130, 160, 190, 220]) stars += STAR(x, 111, 5.5, '#f8fafc', { sw: 1.2, stroke: '#cbd5e1' });
    return { hidesHairFront: OPEN_CROWN_HIDES_FRINGE, clipHairTop: 118, front:
      E(160, 121, 102, 13, a, { stroke: WHITE_LN }) +
      P(crown, a, { stroke: WHITE_LN }) + stripes +
      E(160, 24, 68, 10, a, { stroke: WHITE_LN }) + HL('M100,22 C110,16 140,14 160,15 C136,16 112,19 100,22 Z', 0.5) +
      SH('M228,26 L242,121 L214,121 L206,30 Z', 0.12) +
      HL('M96,30 L104,30 L96,100 L88,100 Z', 0.35) +
      P('M80,100 L240,100 L242,121 L78,121 Z', cc) + stars +
      SH('M204,100 L240,100 L242,121 L206,121 Z', 0.14) +
      P('M58,121 A102,13 0 0 0 262,121 Z', a, { stroke: WHITE_LN }) +
      SH('M160,121 L262,121 A102,13 0 0 1 160,134 Z', 0.1) +
      HL('M64,123 C90,128 120,131 150,132 L150,135 C120,134 88,131 66,126 Z', 0.35) +
      SPARK(118, 40, 5) };
  },
  // Statue of Liberty crown (legendary): patina band with seven radiating spikes and little windows.
  liberty_crown: (c) => {
    const a = c.a || '#6ee7b7';
    const o = { stroke: dark(a, 0.5) };
    const RX = 84, RY = 94, CX = 160, CY = 150;
    const pt = (deg, kx, ky) => { const t = deg * Math.PI / 180; return [CX + kx * Math.sin(t), CY - ky * Math.cos(t)]; };
    const LEN = { 0: 44, 22: 44, 44: 36, 66: 24 }, HW = 8.5;
    let spikes = '';
    for (const deg of [-66, -44, -22, 0, 22, 44, 66]) {
      const t = deg * Math.PI / 180, s = Math.sin(t), co = Math.cos(t);
      let nx = s / RX, ny = -co / RY; const nl = Math.hypot(nx, ny); nx /= nl; ny /= nl;
      let tx = co * RX, ty = s * RY; const tl = Math.hypot(tx, ty); tx /= tl; ty /= tl;
      const b = pt(deg, RX - 6, RY - 6), e = pt(deg, RX, RY), len = LEN[Math.abs(deg)];
      const px = num(e[0] + nx * len), py = num(e[1] + ny * len);
      const bl = `${num(b[0] - tx * HW)},${num(b[1] - ty * HW)}`, br = `${num(b[0] + tx * HW)},${num(b[1] + ty * HW)}`, bm = `${num(b[0])},${num(b[1])}`;
      spikes += P(`M${bl} L${px},${py} L${br} Z`, a, o) +
        HL(`M${bl} L${px},${py} L${bm} Z`, 0.32) + SH(`M${bm} L${px},${py} L${br} Z`, 0.16);
    }
    const l0 = pt(-75, RX, RY), r0 = pt(75, RX, RY), l1 = pt(-75, RX - 12, RY - 12), r1 = pt(75, RX - 12, RY - 12);
    const band = `M${num(l0[0])},${num(l0[1])} A${RX},${RY} 0 0 1 ${num(r0[0])},${num(r0[1])} L${num(r1[0])},${num(r1[1])} A${RX - 12},${RY - 12} 0 0 0 ${num(l1[0])},${num(l1[1])} Z`;
    let windows = '';
    for (const deg of [-56, -34, -11, 11, 34, 56]) {
      const m = pt(deg, RX - 6, RY - 6);
      windows += R(num(m[0] - 2.5), num(m[1] - 4.5), 5, 9, 1.5, dark(a, 0.55), { sw: 0, extra: { transform: `rotate(${deg} ${num(m[0])} ${num(m[1])})` } });
    }
    const arc = (d0, d1) => { const p0 = pt(d0, RX - 6, RY - 6), p1 = pt(d1, RX - 6, RY - 6); return `M${num(p0[0])},${num(p0[1])} A${RX - 6},${RY - 6} 0 0 1 ${num(p1[0])},${num(p1[1])}`; };
    return { hidesHairFront: false, front:
      spikes + P(band, a, o) +
      L(arc(-64, -18), '#fff', 5, { op: 0.35 }) + L(arc(18, 68), '#000', 5, { op: 0.12 }) +
      L(arc(-72, 72), dark(a, 0.3), 1.5, { op: 0.6 }) +
      windows + SPARK(160, 22, 5) + SPARK(214, 32, 3.5) + SPARK(104, 44, 3) };
  },
  // Graduation cap (rare): skull dome covering the whole scalp + a band hiding its flat bottom, the mortarboard seen
  // in perspective sitting on the head top (its apex covers the dome's crown), button and a gold tassel on the left.
  grad_cap: (c) => {
    const a = c.a, b = c.b || '#f59e0b';
    const edge = lum(a) < 0.2 ? light(a, 0.16) : dark(a, 0.3);   // board thickness must still read on black
    return { hidesHairFront: true, front:
      P(DOME, a) + domeShade() +
      P('M80,112 L240,112 L240,126 L80,126 Z', a) +
      SH('M204,112 L240,112 L240,126 L204,126 Z', 0.14) + HL('M84,114 L120,114 L120,118 L86,118 Z', 0.3) +
      P('M60,64 L160,96 L260,64 L260,72 L160,104 L60,72 Z', edge) +
      P('M60,64 L160,32 L260,64 L160,96 Z', a) +
      HL('M72,60 L160,32 L160,40 L86,64 Z', 0.3) + SH('M160,96 L260,64 L248,63 L160,86 Z', 0.1) +
      C(160, 64, 5, light(a, 0.3)) +
      L('M160,64 C150,60 124,64 100,76 L88,84 C84,92 84,104 84,114', b, 3.5) +
      C(84, 116, 6, b) +
      P('M74,120 L94,120 L98,148 L70,148 Z', b) +
      L('M78,124 L77,144 M84,124 L84,144 M90,124 L91,144', dark(b, 0.35), 1.5, { op: 0.8 }) +
      HL('M76,122 L82,122 L80,144 L74,144 Z', 0.3) };
  },
  // Santa hat (rare): floppy red cone bending right, fluffy fur band and pom.
  santa: (c) => {
    const a = c.a, b = c.b || '#f8fafc';
    const cone = 'M80,100 C82,64 112,36 150,34 C190,30 224,28 250,44 C254,50 252,58 244,58 C236,58 232,62 232,70 C236,82 240,92 240,100 Z';
    let fluff = '';
    for (const [x, y] of [[246, 44], [258, 50], [250, 58], [244, 52]]) fluff += C(x, y, 3, '#fff', { sw: 0, op: 0.7 });
    for (const [x, y] of [[96, 88], [118, 98], [140, 88], [162, 98], [184, 88], [206, 98], [228, 88], [108, 102], [172, 90], [216, 102]]) fluff += C(x, y, 2.6, '#e2e8f0', { sw: 0, op: 0.9 });
    return { hidesHairFront: true, front:
      P(cone, a) +
      SH('M232,70 C236,82 240,92 240,100 L216,100 C214,82 210,66 204,54 Z', 0.14) +
      SH('M220,34 C236,34 248,40 250,46 C252,54 246,58 240,56 C236,48 228,40 220,34 Z', 0.12) +
      HL('M96,80 C100,58 120,42 146,36 C128,48 112,64 104,86 Z', 0.3) +
      L('M152,38 C166,50 182,52 200,48', seam(a), 2.5, { op: 0.6 }) +
      furBand(78, 242, 82, 106, b, WHITE_LN) +
      SH('M200,84 L242,84 L242,106 L200,106 Z', 0.1) + HL('M84,86 L124,86 L124,92 L86,92 Z', 0.4) +
      C(252, 50, 12, b, { stroke: WHITE_LN }) + fluff + HL('M244,44 C247,40 253,39 257,42 C252,42 247,44 244,44 Z', 0.6) };
  },
  // Hard hat (rare): construction helmet with a centre ridge, side ridges, badge and an all-round brim.
  hard_hat: (c) => {
    const a = c.a || '#facc15';
    const shell = 'M78,118 C78,50 110,26 160,26 C210,26 242,50 242,118 Z';
    const brim = 'M58,114 L262,114 C270,124 264,138 246,140 C206,148 114,148 74,140 C56,138 50,124 58,114 Z';
    return { hidesHairFront: true, front:
      P(shell, a) +
      SH('M198,34 C230,50 242,92 242,118 L214,118 C216,88 214,54 198,34 Z', 0.14) +
      HL('M92,86 C96,56 118,38 146,30 C124,46 108,66 100,92 Z', 0.3) +
      F('M154,27 L166,27 L172,114 L148,114 Z', dark(a, 0.1)) + L('M154,27 L148,114 M166,27 L172,114', seam(a), 2, { op: 0.6 }) +
      L('M112,46 C102,68 96,92 96,114 M208,46 C218,68 224,92 224,114', seam(a), 2.5, { op: 0.55 }) +
      F('M78,104 L242,104 L242,118 L78,118 Z', dark(a, 0.18)) +
      R(146, 72, 28, 18, 3, '#f8fafc', { stroke: WHITE_LN, sw: 2 }) + L('M152,81 L168,81', '#ef4444', 3.5) +
      P(brim, a) +
      SH('M160,116 L262,116 C270,124 264,138 246,140 C218,146 190,148 160,148 Z', 0.12) +
      HL('M64,116 L150,116 L150,122 L66,122 Z', 0.3) };
  },
  // Bike helmet (rare): aero shell with vents, short visor (b) and a chin strap with buckle.
  bike_helmet: (c) => {
    const a = c.a, b = c.b || '#1f2937';
    const shell = 'M74,124 C74,46 112,22 160,22 C208,22 246,46 246,124 Z';
    const vent = (x, y, rx, ry, rot) => E(x, y, rx, ry, dark(a, 0.55), { sw: 0, extra: { transform: `rotate(${rot} ${x} ${y})` } });
    const visor = 'M72,116 L248,116 C256,122 250,130 238,130 C200,134 120,134 82,130 C70,130 64,122 72,116 Z';
    const strapL = 'M94,126 C102,166 122,204 150,222';
    return { hidesHairFront: true, front:
      P(shell, a) +
      SH('M198,30 C232,46 246,92 246,124 L218,124 C220,90 216,52 198,30 Z', 0.14) +
      HL('M88,90 C92,56 116,34 146,26 C122,42 104,66 96,96 Z', 0.3) +
      vent(160, 52, 7, 22, 0) + vent(132, 62, 7, 20, -22) + vent(188, 62, 7, 20, 22) + vent(106, 94, 6, 16, -45) + vent(214, 94, 6, 16, 45) +
      L('M100,112 C120,118 200,118 220,112', seam(a), 2.5, { op: 0.6 }) +
      SH('M74,110 L246,110 L246,124 L74,124 Z', 0.12) +
      P(visor, b) + HL('M78,118 L150,118 L150,122 L80,122 Z', 0.3) +
      TUBE(strapL, '#1f2937', 3) + MIRROR(TUBE(strapL, '#1f2937', 3)) +
      R(150, 218, 20, 10, 3, '#1f2937') + HL('M152,220 L166,220 L166,222 L152,222 Z', 0.4) };
  },
  // Trapper hat (rare): plaid dome, fur front flap, fur-trimmed ear flaps with tie strings.
  earflap: (c) => {
    const a = c.a, b = c.b || '#fdf6e3', ln = '#b9a98a';
    const inDome = (x, y) => { if (y > 100) return false; const dx = (x - 160) / 76, dy = (y - 122) / 84; return dx * dx + dy * dy < 1; };
    const flap = 'M64,104 C58,146 60,178 80,194 C96,204 114,192 112,172 L112,104 Z';
    const trim = 'M62,166 C64,182 70,190 80,194 C96,204 114,192 112,172 C100,184 78,184 62,166 Z';
    const flapL = P(flap, a) + SH('M100,112 L112,112 L112,172 C112,184 104,194 92,198 C102,188 104,150 100,112 Z', 0.14) +
      HL('M70,112 L80,112 L76,150 L68,150 Z', 0.2) +
      L('M78,120 L76,168 M94,120 L94,172 M68,136 L108,136 M66,154 L108,154', light(a, 0.45), 2.5, { op: 0.45 }) +
      P(trim, b, { stroke: ln }) + C(74, 180, 2.5, '#e2e8f0', { sw: 0, op: 0.8 }) + C(96, 188, 2.5, '#e2e8f0', { sw: 0, op: 0.8 }) +
      L('M88,198 L84,228', ln, 2.5) + C(84, 230, 4.5, b, { stroke: ln });
    let tufts = '';
    for (const [x, y] of [[96, 96], [118, 104], [140, 95], [162, 104], [184, 95], [206, 104], [228, 96]]) tufts += C(x, y, 2.6, '#e2e8f0', { sw: 0, op: 0.85 });
    return { hidesHairFront: true, front:
      P(DOME, a) + mesh(inDome, light(a, 0.45), 14, 3.5, 0.45) + mesh(inDome, dark(a, 0.35), 14, 1.5, 0.5, 7) + domeShade() +
      flapL + MIRROR(flapL) +
      furBand(78, 242, 90, 110, b, ln) +
      SH('M204,92 L242,92 L242,110 L204,110 Z', 0.1) + HL('M84,94 L124,94 L124,100 L86,100 Z', 0.4) + tufts };
  },
  // Royal crown (legendary): five points with gems, jewelled band. Hair shows around it.
  crown: (c) => {
    const a = c.a, b = c.b || '#ef4444', cc = c.c || '#3b82f6';
    const pts = 'M90,100 L96,50 L114,76 L130,42 L146,72 L160,32 L174,72 L190,42 L206,76 L224,50 L230,100 Q160,112 90,100 Z';
    return { hidesHairFront: false, front:
      P(pts, a) +
      SH('M200,50 L224,50 L230,100 Q216,106 202,108 Z', 0.14) +
      HL('M96,56 L114,76 L106,82 L98,62 Z', 0.35) +
      F('M92,82 L228,82 L230,100 Q160,112 90,100 Z', dark(a, 0.14)) +
      L('M92,82 L228,82', dark(a, 0.42), 3) +
      HL('M94,84 L128,84 L128,98 L94,98 Z', 0.3) +
      gem(96, 50, 4.5, cc) + gem(130, 42, 4.5, b) + gem(160, 32, 5.5, cc) + gem(190, 42, 4.5, b) + gem(224, 50, 4.5, cc) +
      gem(128, 92, 5, b) + gem(160, 96, 6, cc) + gem(192, 92, 5, b) +
      SPARK(170, 28, 5) };
  },
  // Tiara (girl): chunky silver arc with a centre jewel (dark outline so it reads on pale skin and over hair).
  tiara: (c) => {
    const a = c.a, b = c.b || '#f472b6', cc = c.c || '#7dd3fc';
    const o = { stroke: dark(a, 0.5) };
    const band = 'M96,108 C102,60 134,42 160,42 C186,42 218,60 224,108 L212,112 C206,76 182,58 160,58 C138,58 114,76 108,112 Z';
    return { hidesHairFront: false, front:
      P(band, a, o) +
      P('M142,50 L150,28 L158,48 Z', a, o) + P('M162,48 L170,28 L178,50 Z', a, o) + P('M150,48 L160,16 L170,48 Z', a, o) +
      SH('M196,66 C210,78 218,94 220,108 L212,112 C208,94 200,80 190,70 Z', 0.16) +
      HL('M102,102 C108,72 132,52 156,48 C136,56 118,74 110,104 Z', 0.4) +
      L('M104,100 C110,70 134,52 158,50', '#fff', 2.5, { op: 0.7 }) +
      gem(160, 30, 6, b) + gem(132, 54, 4, cc) + gem(188, 54, 4, cc) + gem(160, 48, 4, cc) + gem(150, 36, 2.5, b) + gem(170, 36, 2.5, b) + SPARK(168, 22, 4) };
  },
  // Cowboy hat: wide curled brim (inside the thumbnail crop), tall dented crown, band with a buckle.
  cowboy: (c) => {
    const a = c.a, b = c.b || '#1c1917';
    const brim = 'M56,104 C52,92 66,88 76,100 C98,96 222,96 244,100 C254,88 268,92 264,104 C260,126 246,138 228,138 C198,144 122,144 92,138 C72,138 60,126 56,104 Z';
    const lip = 'M60,108 C84,120 116,126 160,126 C204,126 236,120 260,108 C256,126 246,138 228,138 C198,144 122,144 92,138 C72,138 64,126 60,108 Z';
    const crown = 'M80,128 C80,56 110,26 160,26 C210,26 240,56 240,128 Z';
    return { hidesHairFront: true, front:
      P(brim, a) +
      P(crown, a) +
      SH('M192,32 C224,46 240,90 240,128 L212,128 C214,90 208,50 192,32 Z', 0.14) +
      HL('M98,80 C104,52 122,34 146,28 C130,44 114,60 104,86 Z', 0.3) +
      L('M122,44 C140,62 180,62 198,44', seam(a), 3) +
      L('M110,74 C118,56 126,46 136,40 M210,74 C202,56 194,46 184,40', seam(a), 2.5, { op: 0.6 }) +
      P('M83,96 L237,96 L239,110 Q160,116 81,110 Z', b) +
      SH('M200,96 L237,96 L239,110 Q220,114 200,115 Z', 0.16) +
      HL('M86,98 L122,98 L122,103 L87,103 Z', 0.3) +
      R(153, 93, 14, 14, 3, '#facc15', { sw: 2 }) + STAR(160, 100, 4, '#fde68a', { sw: 0 }) +
      P(lip, a) +
      SH('M160,128 C204,128 242,122 260,108 C256,126 246,138 228,138 C198,144 160,144 160,144 Z', 0.12) +
      HL('M64,110 C80,120 106,126 134,128 L134,134 C106,132 80,126 66,116 Z', 0.3) };
  },
  // Party cone: dots, pom, zigzag base and a thin elastic string down the cheek.
  party: (c) => {
    const a = c.a, b = c.b || '#facc15';
    const cone = 'M114,96 L160,20 L206,96 C190,108 130,108 114,96 Z';
    const dot = (x, y, r) => C(x, y, r, b, { sw: 0 });
    return { hidesHairFront: false, front:
      L('M120,102 C108,150 114,196 150,226', dark(a, 0.3), 2, { op: 0.5 }) +
      P(cone, a) +
      SH('M160,20 L206,96 C196,104 178,108 160,108 Z', 0.12) +
      HL('M156,32 L132,80 L140,84 L160,44 Z', 0.3) +
      dot(160, 56, 4) + dot(147, 74, 4) + dot(173, 76, 4) + dot(138, 92, 3.5) + dot(160, 94, 3.5) + dot(182, 92, 3.5) +
      L('M118,98 L126,104 L134,98 L142,105 L150,99 L158,106 L166,99 L174,105 L182,98 L190,104 L198,98', dark(a, 0.42), 2.5) +
      L('M114,96 C130,108 190,108 206,96', dark(a, 0.42), 3.5) +
      C(160, 22, 9, b) + HL('M154,16 C158,14 164,14 168,18 C162,18 156,20 154,16 Z', 0.5) };
  },
  // Bandana: cloth over the head with a knot and tails on the right, white dots.
  bandana: (c) => {
    const a = c.a;
    const cloth = 'M80,126 C80,56 110,34 160,34 C210,34 240,56 240,126 C224,110 192,104 160,104 C128,104 96,110 80,126 Z';
    let dots = '';
    for (const [x, y] of [[120, 60], [140, 50], [160, 46], [180, 50], [200, 60], [110, 80], [130, 72], [150, 66], [170, 66], [190, 72], [210, 80], [100, 100], [120, 90], [140, 84], [160, 82], [180, 84], [200, 90], [220, 100]]) dots += C(x, y, 2.6, '#fff', { sw: 0, op: 0.85 });
    return { hidesHairFront: true, front:
      P('M232,112 L260,98 L258,126 Z', a) + P('M234,120 L258,142 L240,146 Z', a) +
      P(cloth, a) +
      SH('M198,42 C228,58 240,94 240,126 C230,118 220,112 208,108 C210,84 206,60 198,42 Z', 0.14) +
      HL('M94,86 C98,62 116,46 138,40 C124,52 110,66 102,90 Z', 0.3) +
      dots +
      L('M110,96 C140,86 180,86 210,96', seam(a), 2.5, { op: 0.6 }) +
      C(236, 118, 7, a) + HL('M232,114 C234,112 238,112 240,114 C238,114 234,116 232,114 Z', 0.4) };
  },
  // Beret: big tilted puffy disc with a nub. Covers the whole hair dome (open crown, see OPEN_CROWN_HIDES_FRINGE).
  beret: (c) => {
    const a = c.a;
    const disc = 'M74,116 C60,66 100,26 164,24 C228,24 260,66 246,110 C232,122 192,128 160,128 C128,128 98,126 74,116 Z';
    const rimTop = 'M78,111 C98,120 130,124 160,124 C192,124 230,118 243,106';
    return { hidesHairFront: OPEN_CROWN_HIDES_FRINGE, clipHairTop: 112, front:
      L('M164,24 L169,18', dark(a, 0.42), 4) + C(170, 16, 5, a) +
      P(disc, a) +
      F(rimTop + ' L246,110 C232,122 192,128 160,128 C128,128 98,126 74,116 Z', dark(a, 0.3)) +
      L(rimTop, dark(a, 0.3), 3) +
      SH('M200,30 C240,40 258,70 246,106 C236,114 214,120 192,122 C222,108 240,84 232,58 C226,44 214,34 200,30 Z', 0.14) +
      HL('M90,76 C100,50 130,30 160,28 C132,38 108,56 96,84 Z', 0.3) +
      L('M118,44 C126,66 124,88 118,108', dark(a, 0.25), 2.5, { op: 0.6 }) };
  },
  // Bucket hat: skull-wide dome crown, down-sloping brim with stitch lines and a small label.
  bucket: (c) => {
    const a = c.a, b = c.b || '#f8fafc';
    const crown = 'M82,110 C82,56 112,34 160,34 C208,34 238,56 238,110 Z';
    const brim = 'M80,106 L240,106 L258,130 C230,140 90,140 62,130 Z';
    return { hidesHairFront: true, front:
      P(crown, a) +
      SH('M196,42 C226,58 238,86 238,110 L214,110 C216,84 212,58 196,42 Z', 0.14) +
      HL('M96,80 C100,56 118,42 140,38 C124,50 110,62 102,84 Z', 0.3) +
      L('M84,98 C120,104 200,104 236,98', seam(a), 2.5, { op: 0.7 }) +
      C(130, 70, 2.6, seam(a), { sw: 0, op: 0.8 }) + C(190, 70, 2.6, seam(a), { sw: 0, op: 0.8 }) +
      R(150, 82, 20, 11, 2, b, { sw: 1.5, stroke: dark(b, 0.3) }) + L('M154,87.5 L166,87.5', dark(b, 0.35), 1.5) +
      P(brim, a) +
      SH('M160,106 L240,106 L258,130 C230,138 196,140 160,140 Z', 0.12) +
      HL('M86,108 L150,108 L150,114 L88,114 Z', 0.3) +
      L('M72,126 C100,134 220,134 248,126 M78,118 C106,124 214,124 242,118', seam(a), 2.2, { op: 0.7, dash: '5 5' }) };
  },
  // Chef toque: puffy white top on a grey band that wraps the whole head (x 80..240).
  chef_hat: (c) => {
    const a = c.a || '#f8fafc', b = c.b || '#e2e8f0', ln = '#64748b', st = '#94a3b8';
    const toque = 'M84,100 C78,80 76,64 96,54 C86,34 112,18 136,28 C144,14 176,14 184,28 C208,18 234,34 224,54 C244,64 242,80 236,100 Z';
    return { hidesHairFront: true, front:
      P(toque, a, { stroke: ln }) +
      SH('M184,28 C208,18 234,34 224,54 C244,64 242,80 236,100 L214,100 C218,80 220,66 206,56 C216,40 202,28 184,28 Z', 0.12) +
      HL('M96,54 C86,34 112,18 136,28 C118,30 104,40 106,56 Z', 0.5) +
      L('M120,62 C116,76 116,90 118,100 M160,54 L160,100 M200,62 C204,76 204,90 202,100', st, 2.5) +
      L('M136,28 C139,38 140,48 138,58 M184,28 C181,38 180,48 182,58', st, 2, { op: 0.7 }) +
      R(80, 96, 160, 26, 10, b, { stroke: ln }) +
      SH('M200,96 L230,96 A10,10 0 0 1 240,106 L240,112 A10,10 0 0 1 230,122 L200,122 Z', 0.12) +
      HL('M86,99 L124,99 L124,105 L88,105 Z', 0.4) +
      L('M86,109 L234,109', st, 2) };
  },
  // Wizard hat (epic): wide brim, skull dome flowing into a tall floppy cone with stars and a buckle band.
  wizard: (c) => {
    const a = c.a, b = c.b || '#facc15';
    const cone = 'M82,124 C80,98 84,70 100,52 C116,36 138,30 148,20 C152,13 166,12 170,18 C172,24 166,27 160,25 C170,36 200,38 220,56 C236,72 240,98 238,124 Z';
    return { hidesHairFront: true, front:
      E(160, 118, 88, 16, a) +
      P(cone, a) +
      SH('M160,25 C170,36 200,38 220,56 C236,72 240,98 238,124 L212,124 C212,94 206,70 194,56 C180,44 168,36 158,28 Z', 0.14) +
      HL('M146,24 C136,38 118,46 106,58 C94,74 90,98 90,118 L98,118 C98,98 102,78 112,64 C124,50 140,38 150,30 Z', 0.3) +
      STAR(126, 80, 7, b, { sw: 2 }) + STAR(190, 92, 6, b, { sw: 2 }) + STAR(158, 46, 5, b, { sw: 2 }) + C(150, 100, 2.5, b, { sw: 0 }) + C(182, 64, 2.5, b, { sw: 0 }) + C(108, 100, 2.5, b, { sw: 0 }) +
      P('M84,104 L236,104 L238,118 L82,118 Z', b) + R(154, 103, 12, 12, 2, '#f59e0b', { sw: 2 }) +
      F('M72,118 A88,16 0 0 0 248,118 Z', a) + L('M72,118 A88,16 0 0 0 248,118', dark(a, 0.42), 3.5) +
      SH('M160,134 C200,134 240,128 248,118 C244,130 206,136 160,136 Z', 0.12) +
      HL('M78,120 C90,126 120,130 150,130 L150,134 C120,134 90,130 80,124 Z', 0.3) +
      SPARK(176, 38, 4) + SPARK(126, 58, 3) };
  },
  // Pirate tricorn (epic): skull-wide black dome, boat-shaped brim with gold trim and a skull.
  pirate: (c) => {
    const a = c.a, b = c.b || '#f59e0b';
    const dome = 'M82,126 C82,60 112,34 160,34 C208,34 238,60 238,126 Z';
    const brim = 'M56,70 C66,104 106,122 160,120 C214,122 254,104 264,70 C266,98 250,124 230,130 C198,138 122,138 90,130 C68,124 54,98 56,70 Z';
    return { hidesHairFront: true, front:
      P(dome, a) + SH('M196,42 C226,56 238,92 238,126 L214,126 C216,90 212,58 196,42 Z', 0.16) + HL('M96,84 C100,60 118,44 140,38 C126,50 112,66 104,90 Z', 0.2) +
      P(brim, a) +
      SH('M200,124 C230,118 254,100 264,70 C266,98 250,124 230,130 C220,132 210,134 200,134 Z', 0.16) +
      HL('M60,78 C70,100 86,114 112,118 L112,124 C86,120 66,106 62,86 Z', 0.22) +
      L('M60,78 C70,106 106,124 160,122 C214,124 250,106 260,78', b, 3) +
      L('M146,122 L174,136 M174,122 L146,136', '#f8fafc', 4) +
      C(160, 114, 10, '#f8fafc', { sw: 1.5, stroke: WHITE_LN }) + R(154, 121, 12, 7, 2, '#f8fafc', { sw: 1.5, stroke: WHITE_LN }) +
      L('M157,122 L157,127 M160,122 L160,127 M163,122 L163,127', WHITE_LN, 1.2) +
      C(156, 112, 2.6, '#1f2937', { sw: 0 }) + C(164, 112, 2.6, '#1f2937', { sw: 0 }) + F('M158.5,117 L161.5,117 L160,119.5 Z', '#1f2937') };
  },
  // Headband (girl): thin band over the hair with a bow on the left.
  headband: (c) => {
    const a = c.a;
    const band = 'M88,124 C94,72 124,54 160,54 C196,54 226,72 232,124 L222,124 C216,80 192,66 160,66 C128,66 104,80 98,124 Z';
    return { hidesHairFront: false, front:
      P(band, a) +
      SH('M196,70 C212,80 222,100 226,124 L222,124 C216,100 208,84 194,76 Z', 0.14) +
      L('M102,112 C108,82 130,64 158,62', '#fff', 3, { op: 0.55 }) +
      E(98, 74, 10, 6.5, a, { extra: { transform: 'rotate(-35 98 74)' } }) +
      E(118, 70, 10, 6.5, a, { extra: { transform: 'rotate(25 118 70)' } }) +
      HL('M92,70 C94,66 100,66 102,70 C98,70 94,72 92,70 Z', 0.4) +
      C(108, 78, 5, a) };
  },
  // Flower crown (girl): leafy vine with pink/yellow/white blossoms (shadow on the right, highlight top-left).
  flower_crown: (c) => {
    const a = c.a || '#4d7c0f', b = c.b || '#f472b6', cc = c.c || '#fde047';
    const leaf = (x, y, rot) => E(x, y, 8, 3.5, '#65a30d', { sw: 1.5, stroke: '#3f6212', extra: { transform: `rotate(${rot} ${x} ${y})` } });
    return { hidesHairFront: false, front:
      L('M90,118 C96,74 124,56 160,56 C196,56 224,74 230,118', a, 6) +
      leaf(100, 100, -70) + leaf(126, 68, -30) + leaf(146, 58, -10) + leaf(176, 58, 10) + leaf(196, 68, 30) + leaf(222, 100, 70) +
      SH('M196,68 C214,78 226,96 230,118 L224,118 C220,100 208,84 194,74 Z', 0.14) +
      HL('M96,110 C100,84 118,66 140,60 C124,70 110,86 102,112 Z', 0.3) +
      flower(94, 112, 5, b, cc) + flower(114, 76, 5.5, cc, '#f97316') + flower(136, 62, 4, '#c4b5fd', cc) +
      flower(160, 56, 6, '#f8fafc', cc) +
      flower(184, 62, 4, '#c4b5fd', cc) + flower(206, 76, 5.5, b, cc) + flower(226, 112, 5, cc, '#f97316') };
  },
  // Space helmet (legendary): sky-tinted glass bubble with a dark slate rim + inner glass edge, grey collar ring,
  // side light + antenna. Inside the sealed glass the hero wears a white comms ("snoopy") cap with grey ear pads and
  // a mic boom, so ALL hair is hidden (avatar.js cannot clip hair to the dome yet, and hair outside glass is wrong).
  // Everything stays inside the hat thumbnail crop (collar outline ends at y≈238).
  helmet_space: (c) => {
    const a = c.a || '#cbd5e1', b = c.b || '#ef4444', rim = '#64748b', cap = '#f8fafc', pad = '#cbd5e1';
    const domePath = 'M66,128 A94,102 0 1 0 254,128 A94,102 0 1 0 66,128 Z';
    const earPad = x => C(x, 146, 15, pad, { stroke: '#94a3b8' }) + C(x, 146, 6, rim, { sw: 0 }) + HL(`M${x - 9},137 a3.5,3.5 0 1 0 0.1,0 Z`, 0.6);
    return { hidesHair: true, hidesHairFront: true, front:
      L('M160,30 L160,20', rim, 3.5) + C(160, 17, 5, b) + HL('M157,14 a2,2 0 1 0 0.1,0 Z', 0.6) +
      R(112, 214, 96, 18, 9, '#94a3b8') +
      P(DOME, cap, { stroke: WHITE_LN }) +
      SH('M198,42 C228,58 240,94 240,122 L212,122 C216,92 214,60 198,42 Z', 0.1) +
      HL('M94,84 C98,60 116,44 138,38 C124,52 110,66 102,88 Z', 0.5) +
      L('M160,36 L160,110 M118,46 C108,70 102,96 102,114 M202,46 C212,70 218,96 218,114', '#cbd5e1', 2, { op: 0.9 }) +
      P('M80,112 L240,112 L240,131 L80,131 Z', cap, { stroke: WHITE_LN }) + F('M82,118 L238,118 L238,125 L82,125 Z', '#1e3a8a') +
      SH('M204,112 L240,112 L240,131 L204,131 Z', 0.1) +
      R(104, 115, 16, 13, 2.5, b, { sw: 1.5, stroke: dark(b, 0.35) }) + HL('M106,117 L112,117 L112,120 L106,120 Z', 0.5) +
      earPad(84) + earPad(236) +
      TUBE('M228,156 C220,174 208,186 194,190', '#94a3b8', 2.5) + C(191, 191, 4.5, '#1f2937', { sw: 1.5, stroke: '#0f172a' }) +
      F(domePath, '#7dd3fc', { op: 0.2 }) +
      L(domePath, rim, 4.5) +
      L('M72,128 A88,96 0 1 1 248,128', '#fff', 2.5, { op: 0.55 }) +
      L('M76,108 C80,68 112,38 150,32', '#fff', 3.5, { op: 0.7 }) +
      F('M92,74 C100,52 122,38 146,34 C128,46 110,60 100,84 Z', '#fff', { op: 0.75 }) +
      F('M84,104 C82,114 82,126 84,136 C87,126 89,116 92,108 Z', '#fff', { op: 0.6 }) +
      SH('M238,84 C252,116 250,176 228,218 C244,176 246,116 230,88 Z', 0.1) +
      SPARK(122, 50, 6) +
      C(70, 116, 6.5, b) + HL('M66,113 a3,3 0 1 0 0.1,0 Z', 0.6) +
      R(106, 219, 108, 18, 9, a) + R(116, 224, 88, 8, 4, rim, { sw: 0 }) +
      HL('M110,221 L150,221 L150,226 L112,226 Z', 0.45) +
      C(124, 228, 2.4, '#22c55e', { sw: 0 }) + C(133, 228, 2.4, b, { sw: 0 }) + C(142, 228, 2.4, '#facc15', { sw: 0 }) };
  },
};

// ---------- catalog ----------
const col = (key, rarity, extra) => [key, COLORS[key][0], COLORS[key][1], rarity, extra];
export const ITEMS = [
  // --- everyday caps (hat_cap_red / hat_cap_blue are the scripted stage-4 gifts) ---
  ...variants('hat', 'cap', { en: 'Cap', ar: 'كاب' }, [
    col('red', 'common'),
    col('blue', 'common'),
    col('black', 'common', { tier: 2 }),
    ['navy', { a: COLORS.navy[0], b: COLORS.red[0] }, COLORS.navy[1], 'common', { tier: 3 }],
  ], { tier: 1 }),
  single('hat', 'snapback', 'ny', { a: '#1e3a8a', b: '#f97316' }, { en: 'NY Snapback', ar: 'سنابباك NY' }, 'common', { tier: 2, txt: 'NY' }),
  single('hat', 'snapback', 'nyblack', { a: '#2b2b33', b: '#f8fafc' }, { en: 'Black NY Snapback', ar: 'سنابباك NY أسود' }, 'common', { tier: 2, txt: 'NY' }),
  single('hat', 'snapback', 'la', { a: '#2563eb', b: '#f8fafc' }, { en: 'LA Snapback', ar: 'سنابباك LA' }, 'common', { tier: 2, txt: 'LA' }),
  single('hat', 'snapback', 'lapink', { a: '#f472b6', b: '#2b2b33' }, { en: 'Pink LA Snapback', ar: 'سنابباك LA وردي' }, 'rare', { tier: 3, txt: 'LA' }),
  single('hat', 'snapback', 'chi', { a: '#dc2626', b: '#2b2b33' }, { en: 'CHI Snapback', ar: 'سنابباك CHI' }, 'common', { tier: 3, txt: 'CHI' }),
  single('hat', 'trucker', 'usa', { a: '#1e3a8a', b: '#f8fafc' }, { en: 'USA Trucker', ar: 'كاب تراكر USA' }, 'common', { tier: 2, txt: 'USA' }),
  single('hat', 'trucker', 'cali', { a: '#ef4444', b: '#fdf6e3' }, { en: 'Cali Trucker', ar: 'كاب تراكر كالي' }, 'common', { tier: 3, txt: 'CALI' }),
  single('hat', 'trucker', 'nyc', { a: '#2b2b33', b: '#f8fafc' }, { en: 'NYC Trucker', ar: 'كاب تراكر NYC' }, 'rare', { tier: 3, txt: 'NYC' }),
  ...variants('hat', 'beanie', { en: 'Beanie', ar: 'طاقية' }, [
    col('grey', 'common'),
    ['pink', { a: COLORS.pink[0], b: '#fdf2f8' }, COLORS.pink[1], 'common'],
  ], { tier: 2 }),
  // --- sport & streetwear ---
  ...variants('hat', 'sweatband', { en: 'Sweatband', ar: 'عصابة رياضية' }, [
    ['white', { a: '#f8fafc', b: '#ef4444', c: '#3b82f6' }, COLORS.white[1], 'common'],
    ['black', { a: '#2b2b33', b: '#a3e635', c: '#a3e635' }, COLORS.black[1], 'common'],
    ['pink', { a: '#f472b6', b: '#f8fafc', c: '#f8fafc' }, COLORS.pink[1], 'common'],
  ], { tier: 1 }),
  ...variants('hat', 'visor_cap', { en: 'Sun Visor', ar: 'فايزر' }, [
    ['white', { a: '#f8fafc', b: '#f472b6' }, COLORS.white[1], 'common'],
    ['black', { a: '#2b2b33', b: '#a3e635' }, COLORS.black[1], 'common'],
  ], { tier: 2 }),
  ...variants('hat', 'durag', { en: 'Durag', ar: 'دوراق' }, [
    col('black', 'common'),
    ['violet', { a: '#7c3aed' }, { en: 'Violet', ar: 'بنفسجي' }, 'common'],
    ['red', { a: '#dc2626' }, COLORS.red[1], 'common'],
  ], { tier: 2 }),
  ...variants('hat', 'bucket', { en: 'Bucket Hat', ar: 'قبعة دلو' }, [
    col('olive', 'common'),
    ['pink', { a: COLORS.pink[0], b: '#fdf2f8' }, COLORS.pink[1], 'common'],
  ], { tier: 3 }),
  single('hat', 'bandana', 'red', { a: COLORS.red[0] }, { en: 'Red Bandana', ar: 'باندانا حمراء' }, 'common', { tier: 2 }),
  ...variants('hat', 'football_helmet', { en: 'Football Helmet', ar: 'خوذة فوتبول' }, [
    ['navy', { a: '#1e3a8a', b: '#f8fafc' }, COLORS.navy[1], 'epic'],
    ['red', { a: '#dc2626', b: '#facc15' }, COLORS.red[1], 'epic', { tier: 7 }],
    ['black', { a: '#2b2b33', b: '#cbd5e1' }, COLORS.black[1], 'epic', { tier: 8 }],
  ], { tier: 6 }),
  ...variants('hat', 'baseball_helmet', { en: 'Batting Helmet', ar: 'خوذة بيسبول' }, [
    ['navy', { a: '#1e3a8a', b: '#f8fafc' }, COLORS.navy[1], 'rare', { txt: '7' }],
    ['red', { a: '#dc2626', b: '#f8fafc' }, COLORS.red[1], 'rare', { txt: '23' }],
  ], { tier: 4 }),
  // --- fun & costume ---
  single('hat', 'party', 'pink', { a: COLORS.pink[0], b: '#facc15' }, { en: 'Party Hat', ar: 'قبعة حفلة' }, 'common', { tier: 2 }),
  single('hat', 'cowboy', 'brown', { a: COLORS.brown[0], b: '#1c1917' }, { en: 'Texas Cowboy Hat', ar: 'قبعة كاوبوي تكساس' }, 'rare', { tier: 4 }),
  single('hat', 'beret', 'red', { a: COLORS.red[0] }, { en: 'Artist Beret', ar: 'بيريه الفنان' }, 'rare', { tier: 3 }),
  single('hat', 'chef_hat', 'white', { a: '#f8fafc', b: '#e2e8f0' }, { en: 'Chef Hat', ar: 'قبعة الشيف' }, 'rare', { tier: 4 }),
  single('hat', 'santa', 'red', { a: '#dc2626', b: '#f8fafc' }, { en: 'Santa Hat', ar: 'قبعة سانتا' }, 'rare', { tier: 4 }),
  single('hat', 'hard_hat', 'yellow', { a: '#facc15' }, { en: 'Hard Hat', ar: 'خوذة بناء' }, 'rare', { tier: 3 }),
  single('hat', 'bike_helmet', 'lime', { a: '#84cc16', b: '#1f2937' }, { en: 'Bike Helmet', ar: 'خوذة دراجة' }, 'rare', { tier: 4 }),
  single('hat', 'earflap', 'plaid', { a: '#b91c1c', b: '#fdf6e3' }, { en: 'Aspen Trapper Hat', ar: 'قبعة ترابر' }, 'rare', { tier: 5 }),
  single('hat', 'grad_cap', 'black', { a: '#2b2b33', b: '#f59e0b' }, { en: 'Grad Cap', ar: 'قبعة التخرج' }, 'rare', { tier: 5 }),
  single('hat', 'wizard', 'purple', { a: '#6d28d9', b: '#facc15' }, { en: 'Wizard Hat', ar: 'قبعة الساحر' }, 'epic', { tier: 7 }),
  single('hat', 'pirate', 'black', { a: '#2b2b33', b: '#f59e0b' }, { en: 'Pirate Hat', ar: 'قبعة القرصان' }, 'epic', { tier: 7 }),
  // --- girls ---
  single('hat', 'headband', 'pink', { a: COLORS.pink[0] }, { en: 'Bow Headband', ar: 'ربطة شعر بفيونكة' }, 'common', { gender: 'girl', tier: 1 }),
  single('hat', 'flower_crown', 'spring', { a: '#4d7c0f', b: '#f472b6', c: '#fde047' }, { en: 'Flower Crown', ar: 'تاج الزهور' }, 'rare', { gender: 'girl', tier: 4 }),
  single('hat', 'tiara', 'silver', { a: COLORS.silver[0], b: '#f472b6', c: '#7dd3fc' }, { en: 'Princess Tiara', ar: 'تاج الأميرة' }, 'epic', { gender: 'girl', tier: 6 }),
  // --- legendary showpieces ---
  single('hat', 'crown', 'gold', { a: COLORS.gold[0], b: '#ef4444', c: '#3b82f6' }, { en: 'Royal Crown', ar: 'تاج ملكي' }, 'legendary', { tier: 8 }),
  single('hat', 'uncle_sam_hat', 'stars', { a: '#f8fafc', b: '#dc2626', c: '#1e3a8a' }, { en: 'Uncle Sam Hat', ar: 'قبعة العم سام' }, 'legendary', { tier: 7 }),
  single('hat', 'liberty_crown', 'patina', { a: '#6ee7b7' }, { en: 'Liberty Crown', ar: 'تاج الحرية' }, 'legendary', { tier: 8 }),
  single('hat', 'helmet_space', 'glass', { a: '#cbd5e1', b: '#ef4444' }, { en: 'Space Helmet', ar: 'خوذة الفضاء' }, 'legendary', { tier: 9 }),
];
