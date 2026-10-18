// Accessories (category 'acc'). front = on the torso (drawn after the top, before the head), back = behind the body,
// top = above hair / hat (earrings, headphones, halo, flowers). Rig: neck 146..174 x 212..246, shoulders y 240,
// left hand (90,360), left foot (138,474), right foot (182,474).
import { P, F, SH, HL, C, E, R, L, T, G, MIRROR, STAR, SPARK, heartPath, COLORS, variants, single, dark, light } from './_kit.js';

// outlined stroke (dark rim under a coloured line)
const OL = (d, col, sw, o = {}) => L(d, dark(col), sw + 3.5, o) + L(d, col, sw, o);
// point on a quadratic bezier
const qpt = (p0, p1, p2, t) => [
  ((1 - t) * (1 - t) * p0[0] + 2 * (1 - t) * t * p1[0] + t * t * p2[0]).toFixed(1),
  ((1 - t) * (1 - t) * p0[1] + 2 * (1 - t) * t * p1[1] + t * t * p2[1]).toFixed(1),
];
// scalloped polyline (feather rows): bumps bulge to the right-hand side of the travel direction
function scallop(pts, bulge) {
  let d = '';
  for (let i = 1; i < pts.length; i++) {
    const x0 = pts[i - 1][0], y0 = pts[i - 1][1], x1 = pts[i][0], y1 = pts[i][1];
    const dx = x1 - x0, dy = y1 - y0, len = Math.hypot(dx, dy) || 1;
    d += ` Q${((x0 + x1) / 2 - (dy / len) * bulge).toFixed(1)},${((y0 + y1) / 2 + (dx / len) * bulge).toFixed(1)} ${x1},${y1}`;
  }
  return d;
}
const dot = (x, y, r, op = 0.85) => C(x, y, r, '#fff', { sw: 0, op });
// right hand (230,360 r14) re-drawn OVER a held object: acc.front sits above the arm, so the hand must come back on top
const HAND_R = (skin) => C(230, 360, 14, skin, { stroke: dark(skin, 0.38) }) + L('M222,367 Q230,373 238,367', dark(skin, 0.38), 2, { op: 0.45 }) + HL('M220,352 Q224,348 230,347 Q225,351 223,357 Z', 0.3);
// n+1 points evenly spaced by arc length along a quadratic bezier: [x, y, tangent angle in degrees]
function alongQ(p0, p1, p2, n) {
  const sm = []; let len = 0, prev = null;
  for (let i = 0; i <= 80; i++) { const q = qpt(p0, p1, p2, i / 80).map(Number); if (prev) len += Math.hypot(q[0] - prev[0], q[1] - prev[1]); sm.push([len, q]); prev = q; }
  const out = [];
  for (let k = 0; k <= n; k++) {
    const target = len * k / n;
    let j = sm.findIndex(e => e[0] >= target - 0.001); if (j < 0) j = sm.length - 1;
    const q = sm[j][1], nb = sm[Math.min(j + 1, sm.length - 1)][1], pb = sm[Math.max(j - 1, 0)][1];
    out.push([q[0], q[1], Math.atan2(nb[1] - pb[1], nb[0] - pb[0]) * 180 / Math.PI]);
  }
  return out;
}

const NECK_CURVE = [[134, 250], [160, 300], [186, 250]];

export const TEMPLATES = {
  necklace: (c, ctx, item) => {
    const col = c.a, style = item.style || 'gold';
    const [p0, p1, p2] = NECK_CURVE;
    const curve = `M${p0} Q${p1} ${p2}`;
    if (style === 'pearl') {
      // pearls spaced by arc length (the quadratic is slowest at the bottom, so even t would bunch them there)
      const sm = []; let len = 0, prev = null;
      for (let i = 0; i <= 60; i++) { const q = qpt(p0, p1, p2, i / 60).map(Number); if (prev) len += Math.hypot(q[0] - prev[0], q[1] - prev[1]); sm.push([len, q]); prev = q; }
      let s = L(curve, dark(col, 0.3), 2);
      for (let k = 0; k <= 10; k++) {
        const target = len * k / 10, hit = sm.find(e => e[0] >= target - 0.001) || sm[sm.length - 1];
        const x = hit[1][0].toFixed(1), y = hit[1][1].toFixed(1);
        s += C(x, y, 5.5, col, { stroke: dark(col, 0.3), sw: 2 }) + dot(x - 2, y - 2, 1.7);
      }
      return { front: s };
    }
    if (style === 'chain') {
      const tag = R(152, 290, 16, 22, 4, col) + SH('M160,292 L166,292 L166,310 L160,310 Z', 0.14) + HL('M154,292 L158,292 L158,304 L154,304 Z', 0.5) + C(160, 295, 2, dark(col, 0.5), { sw: 0 });
      return { front: OL(curve, col, 6) + L(curve, dark(col, 0.35), 2.2, { dash: '5 4' }) + tag };
    }
    const pendant = C(160, 296, 9.5, col) + SH('M163,290 Q169,296 164,304 Q166,297 163,290 Z', 0.2) + HL('M154,293 Q156,289 160,288 Q156,292 155,297 Z', 0.6) + C(160, 296, 3.2, c.b || '#ef4444', { sw: 1.5 }) + SPARK(166, 290, 3);
    return { front: OL(curve, col, 3) + pendant };
  },
  scarf: (c) => {
    const col = c.a, b = c.b || light(col, 0.5);
    const tail = P('M124,254 L116,332 Q120,344 136,344 L152,338 L154,262 Z', col)
      + L('M120,336 L118,352 M128,340 L128,356 M138,342 L140,356 M148,338 L152,352', dark(col), 3)
      + L('M123,290 L150,287 M121,312 L150,309', b, 5) + SH('M146,264 L154,262 L152,338 L142,340 Z', 0.14) + HL('M124,258 L132,258 L128,300 L121,300 Z', 0.22);
    const wrap = P('M122,230 C140,220 180,220 198,230 L200,258 C184,272 136,272 120,258 Z', col)
      + L('M138,240 L140,264 M160,237 L161,268 M182,240 L180,264', dark(col), 2.5, { op: 0.3 })
      + SH('M184,232 L198,230 L200,258 C194,264 184,268 174,270 Z', 0.14) + HL('M124,232 Q136,226 150,224 L148,238 L126,246 Z', 0.3);
    return { front: tail + wrap };
  },
  tie: (c) => {
    const col = c.a, b = c.b;
    const tail = P('M150,264 L170,264 L174,330 L160,346 L146,330 Z', col)
      + (b ? L('M152,288 L169,282 M152,308 L169,302 M153,326 L168,320', b, 5) : L('M160,270 L160,336', light(col, 0.5), 1.8, { op: 0.35 }))
      + SH('M162,266 L170,264 L174,330 L160,346 L160,330 Z', 0.14) + HL('M151,266 L158,266 L152,326 L148,314 Z', 0.25);
    const knot = P('M147,246 L173,246 L177,258 L160,268 L143,258 Z', col) + HL('M149,248 L160,248 L154,258 L147,254 Z', 0.3) + L('M160,250 L160,262', dark(col), 2.5, { op: 0.45 });
    return { front: tail + knot };
  },
  bowtie: (c) => {
    const col = c.a, b = c.b;
    const dots = b ? C(140, 250, 2.6, b, { sw: 0 }) + C(146, 262, 2.6, b, { sw: 0 }) + C(136, 262, 2, b, { sw: 0 }) + C(150, 254, 1.8, b, { sw: 0 }) : L('M138,246 L142,266', light(col, 0.5), 1.8, { op: 0.35 });
    const wing = P('M158,254 L134,240 Q124,256 134,272 L158,260 Z', col) + HL('M136,244 L152,254 L146,255 L135,251 Z', 0.3) + SH('M136,268 L156,258 L158,260 L134,272 Z', 0.16) + dots;
    const knot = R(152, 247, 16, 18, 5, col) + HL('M154,249 L160,249 L156,261 L154,259 Z', 0.3) + SH('M163,250 L166,250 L166,263 L163,263 Z', 0.16);
    return { front: wing + MIRROR(wing) + knot };
  },
  watch: (c, ctx, item) => {
    const strap = c.a, face = c.b || '#fdf6e3';
    // sits on the wrist (arm/hand join y≈352): long-sleeve cuffs (y 338..355) end behind it instead of under it
    const band = R(76, 346, 30, 12, 5, strap) + SH('M98,348 L104,348 L104,356 L98,356 Z', 0.16) + L('M79,350 L79,354 M103,350 L103,354', dark(strap, 0.3), 1.5, { op: 0.7 });
    if (item.style === 'smart') {
      // slim fitness band (NOT the smartwatch family): lime strap + narrow pill screen with a single heart-rate trace, no rings
      const scr = c.b || '#111827';
      return { front: band + R(82, 340, 18, 24, 9, scr) + L('M85,352 L88,352 L90,347 L93,357 L95,352 L98,352', strap, 1.6) + C(91, 345, 1.3, strap, { sw: 0, op: 0.9 })
        + HL('M84,344 Q85,341 89,340.5 Q86,343 85,349 Z', 0.4) + SH('M96,346 Q99,352 96,360 Q97,352 96,346 Z', 0.18) };
    }
    const dial = C(91, 352, 10.5, face, { stroke: dark(strap), sw: 3 }) + L('M91,352 L91,346 M91,352 L95,355', '#1f2937', 2) + L('M91,352 L86.5,357', '#ef4444', 1.2) + C(91, 352, 1.3, '#1f2937', { sw: 0 })
      + L('M91,344 L91,345.5 M98,352 L99.5,352 M91,359 L91,360.5 M84,352 L82.5,352', dark(strap), 1.5) + HL('M84,348 Q86,344 91,343 Q87,346 85,351 Z', 0.55) + C(104, 352, 2.5, dark(strap), { sw: 0 });
    return { front: band + dial };
  },
  bag: (c) => {
    const col = c.a, b = c.b || '#f59e0b';
    // crossbody bag hangs over the left hand (circle x 76..104, y 346..374): the body covers it completely (no skin sliver)
    const flap = P('M84,342 L138,342 Q146,342 146,350 L146,360 Q111,374 76,360 L76,350 Q76,342 84,342 Z', dark(col, 0.2));
    const body = R(76, 340, 70, 44, 8, col) + flap + SH('M134,346 L146,346 L146,378 Q146,384 140,384 L128,384 Z', 0.14)
      + HL('M80,345 L112,345 L100,356 L80,355 Z', 0.3) + L('M84,377 L138,377', dark(col), 2, { op: 0.35 })
      + C(111, 364, 5, b) + dot(109, 362, 1.6);
    // strap ring where the crossbody strap clips onto the bag
    const ring = C(111, 344, 4, 'none', { stroke: dark(b, 0.3), sw: 3.5 }) + C(111, 344, 4, 'none', { stroke: b, sw: 2 });
    return { front: OL('M204,244 L111,344', col, 6) + body + ring };
  },
  backpack: (c) => {
    const col = c.a, b = c.b || dark(col, 0.3);
    const back = OL('M132,230 C136,198 184,198 188,230', col, 7) + R(88, 220, 144, 154, 30, col)
      + HL('M98,234 Q104,226 118,224 L112,246 L100,258 Z', 0.3) + SH('M208,230 L222,230 L222,360 L208,360 Z', 0.12)
      + L('M118,229 L202,229', b, 2.5, { dash: '3 3' });
    const strap = P('M114,236 Q126,230 138,236 L140,348 L120,348 Z', col) + L('M127,246 L130,340', b, 2.5, { dash: '5 5', op: 0.8 })
      + HL('M117,240 L123,240 L121,300 L118,300 Z', 0.3) + SH('M133,250 L138,250 L139,345 L134,345 Z', 0.14) + R(115, 296, 24, 10, 3, b);
    const chest = L('M138,284 L182,284', b, 5) + R(152, 279, 16, 11, 3, '#334155') + HL('M154,281 L158,281 L158,288 L154,288 Z', 0.3);
    return { back, front: strap + MIRROR(strap) + chest };
  },
  wings: (c, ctx, item) => {
    const col = c.a, b = c.b || dark(col, 0.25);
    let left;
    if (item.style === 'bat') {
      // wrist at (30,176), finger tips (20,236) (44,286) (78,324); membrane edges bow toward the body
      left = P('M118,252 C98,216 62,186 30,176 L22,184 L20,236 Q46,254 44,286 Q74,292 78,324 Q108,322 124,350 Z', col)
        + L('M30,180 L20,236 M30,180 L44,286 M30,180 L78,324', dark(col), 3, { op: 0.5 })
        + SH('M44,286 Q74,292 78,324 Q108,322 124,350 L124,322 Q100,306 84,312 Q70,298 58,300 Z', 0.18)
        + HL('M38,184 C60,190 84,208 104,236 C82,214 60,198 40,192 Z', 0.3) + C(60, 236, 3, b, { sw: 0, op: 0.8 });
    } else {
      // leading edge sweeps up to the tip (36,168); the outer edge comes down in three feather tiers
      const trail = [[24, 186], [30, 216], [40, 246], [52, 274], [66, 300], [84, 324], [104, 342], [124, 352]];
      // default dark(col) rim like every other white item (a lightened rim made the white wings vanish on light backgrounds)
      left = P('M118,252 C98,216 64,184 36,168 C22,162 16,176 24,186' + scallop(trail, 9) + ' L120,300 Z', col)
        + L('M36,176' + scallop([[36, 176], [42, 206], [52, 236], [64, 264], [78, 290], [96, 314], [114, 332]], 8), dark(col, 0.25), 2.5)
        + L('M52,196' + scallop([[52, 196], [62, 226], [74, 254], [88, 280], [104, 304]], 7), dark(col, 0.25), 2.5)
        // soft shade on the lower two feather tiers (outer trailing row + the band between the middle and inner rows) keeps the white voluminous
        + SH('M66,300' + scallop(trail.slice(4), 9) + ' L124,336 L108,330 L92,316 L80,302 Z', 0.1)
        + SH('M64,264' + scallop([[64, 264], [78, 290], [96, 314], [114, 332]], 8) + ' L104,304 L88,280 L74,254 Z', 0.1)
        + L('M42,178 C64,190 90,214 110,246', b, 3, { op: 0.9 }) + SPARK(40, 190, 5, b, 0.95);
    }
    return { back: left + MIRROR(left) };
  },
  cape: (c) => {
    const col = c.a, trim = c.b;
    const body = P('M112,238 C130,230 190,230 208,238 C250,268 278,360 284,470 Q262,478 240,470 Q214,480 186,470 Q160,478 134,470 Q106,480 80,470 Q58,478 36,470 C42,360 70,268 112,238 Z', col)
      + L('M122,262 C98,320 88,400 84,462', dark(col), 3, { op: 0.3 }) + L('M198,262 C222,320 232,400 236,462', dark(col), 3, { op: 0.3 })
      + HL('M110,244 C92,262 76,300 70,340 C72,300 86,266 104,246 Z', 0.3) + SH('M236,296 C260,350 270,420 274,462 C260,420 254,360 230,300 Z', 0.16)
      + (trim ? L('M42,462 C48,360 74,272 110,246', trim, 4) + L('M278,462 C272,360 246,272 210,246', trim, 4) + L('M40,468 Q58,474 80,468 Q106,476 134,468 Q160,474 186,468 Q214,476 240,468 Q262,474 280,468', trim, 4) : '');
    const clasp = OL('M136,244 Q160,258 184,244', col, 4) + C(160, 254, 7, trim || '#f59e0b') + dot(158, 252, 2);
    return { back: body, front: clasp };
  },
  earrings: (c, ctx, item) => {
    const col = c.a, style = item.style || 'hoop';
    let left;
    if (style === 'pearl') left = OL('M84,158 L84,167', col, 2) + C(84, 175, 7.5, c.b || '#fdf6e3', { sw: 2.5 }) + SH('M88,170 Q92,175 88,181 Q90,176 88,170 Z', 0.18) + dot(81, 172, 2.4);
    else if (style === 'star') left = OL('M84,158 L84,166', col, 2) + STAR(84, 175, 8.5, col, { sw: 2.5 }) + SPARK(80, 171, 3) + SH('M86,170 L90,180 L84,183 Z', 0.15);
    else left = C(84, 168, 9, 'none', { stroke: dark(col), sw: 7 }) + C(84, 168, 9, 'none', { stroke: col, sw: 3.5 }) + L('M77,164 Q79,160 84,159', '#fff', 2, { op: 0.75 }) + SH('M90,172 Q93,168 92,164 Q94,172 90,176 Z', 0.2);
    return { top: left + MIRROR(left) };
  },
  headphones: (c) => {
    const col = c.a, b = c.b || dark(col, 0.3);
    const cup = R(63, 121, 36, 50, 14, col) + R(70, 129, 22, 34, 8, b) + HL('M67,126 L80,126 L72,152 L67,152 Z', 0.3) + SH('M91,130 L96,130 L96,164 L91,164 Z', 0.16) + C(81, 146, 4, light(col, 0.4), { sw: 0 });
    const band = OL('M84,142 C80,62 110,24 160,24 C210,24 240,62 236,142', col, 9) + L('M92,110 C96,70 118,42 150,34', '#fff', 3, { op: 0.4 }) + L('M170,34 C200,42 224,72 228,110', '#000', 3, { op: 0.14 });
    return { top: band + cup + MIRROR(cup) };
  },
  halo: (c) => {
    const col = c.a;
    const ring = E(160, 26, 44, 11, 'none', { stroke: dark(col), sw: 11 }) + E(160, 26, 44, 11, 'none', { stroke: col, sw: 7 })
      + L('M122,24 Q134,15 160,15', '#fff', 2.5, { op: 0.65 }) + L('M190,36 Q180,37 170,37', '#000', 2.5, { op: 0.2 })
      + SPARK(206, 16, 6) + SPARK(116, 38, 4) + SPARK(176, 10, 3);
    return { top: ring };
  },
  flower: (c) => {
    const col = c.a, b = c.b || '#facc15', cx = 100, cy = 78;
    let petals = '';
    for (let i = 0; i < 6; i++) { const a = -Math.PI / 2 + i * Math.PI / 3; petals += C((cx + 12 * Math.cos(a)).toFixed(1), (cy + 12 * Math.sin(a)).toFixed(1), 8, col, { sw: 2.5 }); }
    const leaf = P('M108,90 Q124,86 128,100 Q114,104 108,90 Z', '#22c55e') + L('M110,91 L124,98', dark('#22c55e'), 1.5, { op: 0.6 });
    const centre = C(cx, cy, 7, b) + SH('M100,74 Q106,78 101,84 Q102,78 100,74 Z', 0.2) + dot(97, 75, 2);
    return { top: leaf + petals + HL('M86,70 Q92,62 100,62 Q93,66 90,74 Z', 0.5) + SH('M106,86 Q112,84 114,78 Q116,88 108,92 Z', 0.12) + centre };
  },
  medal: (c) => {
    const col = c.a, b = c.b || '#f59e0b';
    const ribbon = P('M144,244 L160,298 L176,244 L190,252 L166,316 L154,316 L130,252 Z', col) + L('M150,251 L160,286 L170,251', '#fff', 3, { op: 0.5 }) + SH('M176,244 L190,252 L166,316 L162,316 Z', 0.16) + HL('M144,246 L150,248 L158,276 L152,268 Z', 0.25);
    const disc = C(160, 320, 17, b) + C(160, 320, 11, 'none', { stroke: dark(b), sw: 2 }) + STAR(160, 320, 8, light(b, 0.45), { sw: 1.5, stroke: dark(b) })
      + SH('M168,308 Q178,318 172,332 Q174,320 168,308 Z', 0.16) + HL('M148,311 Q151,305 159,304 Q152,308 150,316 Z', 0.55);
    return { front: ribbon + disc };
  },
  fannypack: (c) => {
    const col = c.a, b = c.b || '#a3e635';
    // crossbody fanny pack: strap right shoulder → left hip (the sling bag runs the other way); the chunky pouch rides the strap angle on the chest
    const lid = light(col, 0.16);
    const strap = OL('M206,244 L108,354', col, 10) + L('M202,250 L112,350', b, 1.5, { dash: '3 4', op: 0.6 }) + SH('M206,250 L212,250 L116,356 L110,356 Z', 0.14)
      + R(190, 252, 10, 14, 2, '#9ca3af', { sw: 2, extra: { transform: 'rotate(-48 195 259)' } });
    // chunky two-panel pouch (lighter lid above the zipper) so it separates from its own strap even at game scale
    const pouch = G(R(126, 284, 64, 40, 13, col)
      + P('M139,284 L177,284 Q190,284 190,297 L190,301 L126,301 L126,297 Q126,284 139,284 Z', lid, { sw: 2.5 })
      + L('M132,301 L184,301', dark(col, 0.3), 5) + L('M132,301 L184,301', b, 2, { dash: '3 2' }) + C(185, 301, 3.2, b, { sw: 1.5 }) + L('M186,303 L190,308', dark(b, 0.3), 2.5)
      + L('M136,315 L180,315', b, 2.5, { op: 0.85 })
      + R(150, 277, 16, 10, 3, '#9ca3af', { sw: 2 }) + L('M158,279 L158,287', '#4b5563', 2)
      + HL('M130,288 L148,288 L140,299 L130,299 Z', 0.3) + SH('M182,290 L188,290 L188,316 Q188,322 182,322 L168,322 Z', 0.14), { transform: 'rotate(-48 158 304)' });
    return { front: strap + pouch };
  },
  pet_cat: (c) => {
    const col = c.a, b = c.b || dark(col, 0.3);
    const tail = OL('M270,482 C292,478 294,452 282,446', col, 7);
    const body = E(250, 474, 22, 18, col) + E(250, 479, 11, 10, light(col, 0.45), { sw: 0 }) + SH('M260,460 Q274,474 266,490 Q262,476 258,462 Z', 0.12);
    const paws = E(240, 489, 8, 5, col, { sw: 2.5 }) + E(260, 489, 8, 5, col, { sw: 2.5 });
    const ears = P('M234,438 L229,416 L247,428 Z', col) + P('M266,438 L271,416 L253,428 Z', col) + F('M236,434 L233,422 L243,429 Z', '#fda4af') + F('M264,434 L267,422 L257,429 Z', '#fda4af');
    const head = C(250, 446, 19, col) + HL('M236,436 Q242,429 250,428 Q242,433 239,442 Z', 0.4) + L('M243,430 L245,436 M250,428 L250,434 M257,430 L255,436', b, 2.5);
    const face = E(243, 446, 4, 5, '#1f2937', { sw: 0 }) + E(257, 446, 4, 5, '#1f2937', { sw: 0 }) + dot(242, 444, 1.5) + dot(256, 444, 1.5)
      + F('M247,452 L253,452 L250,456 Z', '#f472b6') + L('M250,456 Q246,460 243,457 M250,456 Q254,460 257,457', dark(col), 1.8)
      + L('M230,451 L241,453 M230,458 L241,456 M270,451 L259,453 M270,458 L259,456', dark(col), 1.5, { op: 0.8 });
    const collar = L('M234,462 Q250,470 266,462', '#ef4444', 4) + C(250, 469, 4, '#facc15', { sw: 1.5 });
    return { front: tail + body + paws + ears + head + face + collar };
  },
  pet_dog: (c, ctx, item) => {
    const col = c.a, b = c.b || '#fdf6e3', spots = item && item.style === 'spots', patch = spots ? '#1f2937' : dark(col, 0.25);
    // leash runs from the left hand (90,360) down to the collar; the dog's head is drawn over its end
    const leash = OL('M90,372 C82,402 62,430 56,462', '#3b82f6', 3) + C(90, 372, 3.5, '#9ca3af', { sw: 1.5 });
    const tail = OL('M92,478 C108,474 112,452 102,446', col, 6);
    const body = E(70, 476, 24, 17, col) + E(70, 482, 10, 9, b, { sw: 0 }) + SH('M80,462 Q94,476 88,490 Q84,476 78,464 Z', 0.12)
      + (spots ? F('M58,466 C64,462 70,466 68,472 C64,476 56,474 58,466 Z', '#1f2937') + F('M82,478 C88,476 92,482 88,486 C84,488 80,484 82,478 Z', '#1f2937') + F('M78,436 C84,432 90,438 86,444 C82,446 76,442 78,436 Z', '#1f2937') : '');
    const paws = E(60, 491, 8, 5, col, { sw: 2.5 }) + E(80, 491, 8, 5, col, { sw: 2.5 });
    const ears = E(50, 452, 8, 16, patch) + E(90, 452, 8, 16, patch);
    const head = C(70, 446, 20, col) + F('M54,434 Q62,427 68,438 Q60,446 54,434 Z', patch) + HL('M60,432 Q66,426 74,426 Q66,430 62,438 Z', 0.35);
    const snout = E(70, 454, 11, 8, b, { sw: 2.5 }) + C(70, 450, 4.5, '#1f2937', { sw: 0 }) + L('M70,454 Q66,459 62,456 M70,454 Q74,459 78,456', '#1f2937', 1.8) + F('M66,458 Q70,467 74,458 Z', '#fb7185');
    const eyes = E(61, 442, 3.5, 4.5, '#1f2937', { sw: 0 }) + E(79, 442, 3.5, 4.5, '#1f2937', { sw: 0 }) + dot(60, 440, 1.4) + dot(78, 440, 1.4);
    const collar = L('M54,463 Q70,471 86,463', '#3b82f6', 4) + C(70, 470, 4, '#facc15', { sw: 1.5 });
    return { front: leash + tail + body + paws + ears + head + snout + eyes + collar };
  },
  // ---------- modern / tech / American additions ----------
  airpods: (c) => {
    const col = c.a, d = dark(col, 0.3);
    const stem = G(R(85, 147, 8, 18, 4, col, { sw: 2.5 }) + SH('M90,150 L93,150 L93,162 L90,162 Z', 0.16) + HL('M86,149 L88,149 L88,160 L86,160 Z', 0.5) + C(89, 163, 1.5, d, { sw: 0 }), { transform: 'rotate(-12 89 150)' });
    const bud = E(90, 145, 7.5, 7, col, { sw: 2.5 }) + HL('M85,142 Q87,139 91,139 Q88,141 87,145 Z', 0.6) + SH('M94,141 Q97,145 94,150 Q95,145 94,141 Z', 0.18) + C(95, 146, 2, d, { sw: 0 });
    const left = stem + bud;
    return { top: left + MIRROR(left) };
  },
  smartwatch: (c) => {
    const band = c.a, cs = c.b || '#111827';
    const strap = R(74, 345, 34, 12, 5, band) + L('M78,348 L78,354 M104,348 L104,354', dark(band, 0.3), 1.5, { op: 0.7 }) + SH('M100,347 L106,347 L106,355 L100,355 Z', 0.16);
    const kase = R(79, 336, 24, 30, 7, cs) + R(104, 345, 3.5, 8, 1.5, cs, { sw: 2 }) + R(83, 340, 16, 22, 3, '#0b0f19', { sw: 0 });
    const ring = (r, col) => L('M91,' + (351 - r) + ' A' + r + ',' + r + ' 0 1 1 ' + (91 - r) + ',351', col, 2.2);
    return { front: strap + kase + ring(6.8, '#f43f5e') + ring(4.4, '#a3e635') + ring(2, '#22d3ee') + HL('M81,338 L86,338 L82,360 L81,360 Z', 0.35) + SPARK(99, 342, 2.5) };
  },
  phone: (c, ctx) => {
    const col = c.a, scr = c.b || '#38bdf8';
    const body = R(231, 304, 28, 54, 7, col) + R(234.5, 308, 21, 46, 4, scr, { sw: 0 }) + R(239, 310, 12, 3.5, 1.75, '#0b0f19', { sw: 0 })
      + R(238, 318, 10, 5.5, 2.5, '#fff', { sw: 0, op: 0.92 }) + R(242, 327, 10, 5.5, 2.5, '#fff', { sw: 0, op: 0.7 }) + R(238, 336, 13, 5.5, 2.5, '#fff', { sw: 0, op: 0.92 })
      + HL('M235.5,309 L240,309 L236,332 Z', 0.5) + SH('M252,310 L255.5,310 L255.5,354 L252,354 Z', 0.14) + L('M241,351 L249,351', '#fff', 1.6, { op: 0.85 });
    const thumb = E(241, 349, 5, 7.5, ctx.skin, { stroke: dark(ctx.skin, 0.38), sw: 2.5 });
    return { front: G(body, { transform: 'rotate(12 245 356)' }) + HAND_R(ctx.skin) + G(thumb, { transform: 'rotate(-20 241 349)' }) };
  },
  coffee: (c, ctx, item) => {
    const cup = c.a, b = c.b || '#92400e', style = item.style || 'latte';
    const CUP = 'M232,334 L262,334 L258,384 L236,384 Z';
    let s;
    if (style === 'iced' || style === 'boba') {
      const boba = style === 'boba';
      s = P(CUP, cup) + F('M233,350 L261,350 L258,384 L236,384 Z', boba ? '#d8b4fe' : '#a16207') + F('M233,350 L261,350 L260.5,358 L233.5,358 Z', boba ? '#f3e8ff' : '#e7d3b1')
        + (boba ? C(240, 378, 3, '#1f2937', { sw: 0 }) + C(247, 380, 3, '#1f2937', { sw: 0 }) + C(254, 378, 3, '#1f2937', { sw: 0 }) + C(243, 372, 3, '#1f2937', { sw: 0 }) + C(251, 373, 3, '#1f2937', { sw: 0 })
          : R(239, 352, 8, 8, 2, '#fff', { sw: 0, op: 0.55 }) + R(249, 360, 7, 7, 2, '#fff', { sw: 0, op: 0.45 }) + R(241, 366, 7, 7, 2, '#fff', { sw: 0, op: 0.4 }))
        + P('M230,334 Q247,314 264,334 Z', '#e2e8f0') + OL('M250,330 L257,304', b, boba ? 6 : 4) + HL('M234,338 L238,338 L236,380 L237,380 Z', 0.45);
    } else {
      s = P(CUP, cup) + P('M235,352 L259,352 L257,372 L237,372 Z', b) + L('M237,357 L257,357 M237,367 L257,367', dark(b, 0.3), 1.5, { op: 0.5 })
        + C(247, 362, 5.5, '#16a34a', { sw: 1.5 }) + STAR(247, 362, 3.2, '#fff', { sw: 0 })
        + R(229, 326, 36, 10, 4, '#2b2b33') + R(240, 321, 12, 7, 2.5, '#2b2b33', { sw: 2.5 }) + HL('M233,338 L238,338 L236,350 L234,350 Z', 0.5) + HL('M231,328 L240,328 L239,332 L231,332 Z', 0.3);
    }
    return { front: s + SH('M255,336 L261,336 L257,384 L253,384 Z', 0.14) + HAND_R(ctx.skin) };
  },
  basketball: (c, ctx) => {
    const col = c.a, d = dark(col, 0.45);
    const ball = C(252, 382, 31, col) + L('M252,351 Q236,382 252,413 M221,382 Q252,372 283,382 M230,362 Q244,382 230,402 M274,362 Q260,382 274,402', d, 2.8)
      + SH('M268,360 Q286,384 270,408 Q276,384 268,360 Z', 0.16) + HL('M230,368 Q236,356 250,353 Q238,360 233,372 Z', 0.4);
    return { front: ball + HAND_R(ctx.skin) };
  },
  football: (c) => {
    const col = c.a, lace = c.b || '#f8fafc';
    const ball = E(255, 328, 21, 37, col) + L('M242,300 Q255,296 268,300 M242,356 Q255,360 268,356', lace, 4, { op: 0.9 })
      + L('M255,312 L255,344', lace, 3) + L('M250,317 L260,317 M250,324 L260,324 M250,331 L260,331 M250,338 L260,338', lace, 2.2)
      + SH('M264,296 Q280,328 264,360 Q272,328 264,296 Z', 0.16) + HL('M242,310 Q244,298 252,293 Q246,302 245,314 Z', 0.35);
    return { back: G(ball, { transform: 'rotate(-14 255 328)' }) };
  },
  skateboard: (c, ctx, item) => {
    const col = c.a, b = c.b || '#f8fafc';
    const DECK = 'M255,262 C268,262 272,272 272,286 L272,434 C272,448 268,458 255,458 C242,458 238,448 238,434 L238,286 C238,272 242,262 255,262 Z';
    const wheel = (x, y) => C(x, y, 7, '#fde68a', { sw: 2.5 }) + C(x, y, 2.5, '#9ca3af', { sw: 0 });
    let art = '';
    if (item.style === 'flame') art = F('M240,436 C252,404 236,384 254,360 C262,386 274,376 270,414 C270,436 262,448 255,448 C248,448 241,444 240,436 Z', '#f97316') + F('M246,436 C252,414 244,400 255,384 C260,402 266,398 264,420 C262,436 256,440 254,440 C250,440 247,440 246,436 Z', '#fde047');
    else if (item.style === 'usa') art = L('M238,306 L272,290 M238,342 L272,326 M238,378 L272,362 M238,414 L272,398', '#ef4444', 9) + L('M238,324 L272,308 M238,360 L272,344 M238,396 L272,380', '#3b82f6', 9) + STAR(255, 438, 7, '#3b82f6', { sw: 1.5 });
    else art = STAR(248, 300, 5, '#fde047', { sw: 1 }) + STAR(262, 340, 4, '#f8fafc', { sw: 1 }) + STAR(250, 380, 6, '#f472b6', { sw: 1 }) + C(258, 420, 8, '#a855f7', { sw: 2 }) + E(258, 420, 13, 3.5, 'none', { stroke: '#f472b6', sw: 2.5 }) + STAR(245, 440, 3.5, '#fde047', { sw: 1 });
    const deck = wheel(236, 302) + wheel(274, 302) + wheel(236, 420) + wheel(274, 420) + P(DECK, col) + art + L('M238,286 L238,434 M272,286 L272,434', b, 1.5, { op: 0.35 })
      + HL('M241,274 Q244,266 252,265 L252,300 L241,300 Z', 0.3) + SH('M266,340 L270,340 L270,452 Q266,456 262,456 Z', 0.14);
    return { back: deck };
  },
  crossbody: (c) => {
    const col = c.a, b = c.b || '#a3e635';
    const strap = OL('M118,246 L214,354', col, 9) + L('M122,252 L208,348', light(col, 0.35), 1.5, { dash: '4 4', op: 0.5 }) + R(128, 258, 14, 9, 2, b, { sw: 2, extra: { transform: 'rotate(48 135 262)' } });
    const pouch = G(R(146, 290, 60, 42, 11, col) + P('M146,300 L206,300 L206,310 Q206,316 200,316 L152,316 Q146,316 146,310 Z', dark(col, 0.18), { sw: 2.5 })
      + L('M150,322 L202,322', light(col, 0.5), 2, { dash: '3 2', op: 0.7 }) + R(166, 318, 20, 9, 3, b, { sw: 2 }) + C(204, 322, 3.5, b, { sw: 1.5 }) + L('M204,322 L210,328', dark(b, 0.3), 2.5)
      + HL('M149,293 L164,293 L156,312 L149,312 Z', 0.3) + SH('M198,296 L205,296 L205,326 Q205,331 200,331 L190,331 Z', 0.14), { transform: 'rotate(40 176 311)' });
    return { front: strap + pouch };
  },
  camera: (c, ctx, item) => {
    const col = c.a, b = c.b || '#ef4444';
    const strap = OL('M134,248 C126,268 138,294 148,300', '#2b2b33', 5) + OL('M186,248 C194,268 182,294 172,300', '#2b2b33', 5);
    const leather = item.style === 'retro' ? R(133, 312, 54, 14, 2, '#2b2b33', { sw: 0, op: 0.85 }) : '';
    const body = R(132, 296, 56, 36, 8, col) + R(144, 288, 32, 10, 3, col, { sw: 2.5 }) + C(140, 291, 3, b, { sw: 1.5 }) + leather
      + L('M136,304 L136,324 M140,304 L140,324', dark(col, 0.3), 2, { op: 0.6 }) + R(176, 302, 8, 6, 2, light(col, 0.5), { sw: 1.5 })
      + C(160, 316, 13, '#1f2937', { stroke: dark(col) }) + C(160, 316, 9.5, b, { sw: 2 }) + C(160, 316, 6, '#0f172a', { sw: 0 }) + HL('M152,310 Q154,306 159,305 Q155,308 154,313 Z', 0.6)
      + HL('M135,299 L148,299 L143,312 L135,312 Z', 0.3) + SH('M180,300 L186,300 L186,326 Q186,330 182,330 L172,330 Z', 0.14);
    return { front: strap + body };
  },
  guitar: (c, ctx, item) => {
    const col = c.a, b = c.b || '#fdf6e3', neckCol = '#c98a4b', acoustic = item.style === 'acoustic';
    // authored upright (neck up the -y axis), then rotated so the neck pokes over the left shoulder and the body hangs at the right hip
    const neck = R(-7, -250, 14, 236, 3, neckCol) + P('M-9,-250 L9,-250 L13,-292 L-13,-292 Z', '#2b2118') + C(-13, -284, 2.5, '#cbd5e1', { sw: 1 }) + C(-13, -270, 2.5, '#cbd5e1', { sw: 1 }) + C(13, -284, 2.5, '#cbd5e1', { sw: 1 }) + C(13, -270, 2.5, '#cbd5e1', { sw: 1 })
      + L('M-6,-232 L6,-232 M-6,-214 L6,-214 M-6,-196 L6,-196 M-6,-178 L6,-178 M-6,-160 L6,-160 M-6,-142 L6,-142', '#e7d3b1', 1.5, { op: 0.8 });
    const body = acoustic
      ? P('M0,-30 C-27.6,-30 -34.5,-11.5 -29.9,-2.3 C-43.7,9.2 -41.4,48.3 0,50.6 C41.4,48.3 43.7,9.2 29.9,-2.3 C34.5,-11.5 27.6,-30 0,-30 Z', col) + C(0, 6, 10.5, '#1f2937', { stroke: b, sw: 2.5 }) + R(-12, 26, 24, 5.5, 2, '#2b2118', { sw: 1.5 })
      : P('M-24,-36 C-32,-22 -36,-8 -36,6 C-36,28 -20,40 0,40 C20,40 36,28 36,6 C36,-8 32,-22 22,-34 C16,-26 10,-18 0,-18 C-10,-18 -16,-26 -24,-36 Z', col)
        + P('M-14,-14 C-22,-6 -24,10 -20,22 C-14,30 -2,32 6,30 C14,22 18,8 12,-8 Z', b, { sw: 2 }) + R(-13, -6, 26, 6, 2, '#111827', { sw: 1.5 }) + R(-13, 6, 26, 6, 2, '#111827', { sw: 1.5 }) + R(-11, 18, 22, 5, 2, '#cbd5e1', { sw: 1.5 }) + C(26, 18, 3.5, '#111827', { sw: 1.5 }) + C(28, 28, 3.5, '#111827', { sw: 1.5 });
    const strings = L('M-3,-248 L-3,20 M0,-248 L0,20 M3,-248 L3,20', '#f8fafc', 1, { op: 0.7 });
    const shade = HL(acoustic ? 'M-25,-23 Q-30,-5 -28,7 Q-35,-9 -28,-25 Z' : 'M-22,-30 Q-32,-10 -32,6 Q-30,-16 -24,-32 Z', 0.3) + SH(acoustic ? 'M30,5 Q39,28 23,46 Q37,25 30,5 Z' : 'M28,0 Q34,20 18,38 Q30,20 28,0 Z', 0.16);
    const sc = acoustic ? '#5b3a1e' : '#1e3a8a', st = acoustic ? '#e7d3b1' : '#f8fafc';
    const strap = OL('M114,246 L214,354', sc, 12) + L('M118,252 L210,350', st, 3, { dash: acoustic ? '3 5' : '8 6', op: 0.85 })
      + R(151, 287, 14, 18, 3, '#9ca3af', { sw: 2, extra: { transform: 'rotate(47 158 296)' } }) + L('M153,296 L163,296', '#4b5563', 2, { extra: { transform: 'rotate(47 158 296)' } });
    return { back: G(neck + body + shade + strings, { transform: 'translate(260 404) rotate(-47)' }), front: strap };
  },
  goldchain: (c) => {
    const col = c.a, d = dark(col, 0.4);
    const pts = alongQ([126, 248], [160, 326], [194, 248], 14);
    let links = '';
    pts.forEach((p, i) => {
      if (i === 0 || i === pts.length - 1) return;
      const x = p[0].toFixed(1), y = p[1].toFixed(1);
      links += E(x, y, 7.5, 5, i % 2 ? col : light(col, 0.2), { stroke: d, sw: 2.2, extra: { transform: 'rotate(' + p[2].toFixed(1) + ' ' + x + ' ' + y + ')' } }) + C(x, y, 2, d, { sw: 0, op: 0.5 });
    });
    const medal = R(155, 284, 10, 16, 4, col, { stroke: d }) + C(160, 318, 19, col, { stroke: d }) + C(160, 318, 14, 'none', { stroke: d, sw: 2, extra: { 'stroke-dasharray': '3 3' } }) + T(161, 327, '$', 24, '#fff7d6', { stroke: d, sw: 2 })
      + SH('M170,304 Q182,318 172,334 Q176,318 170,304 Z', 0.16) + HL('M146,310 Q149,302 158,300 Q150,304 148,314 Z', 0.55) + SPARK(174, 306, 5) + SPARK(148, 330, 3.5);
    return { front: L('M126,248 Q160,326 194,248', d, 11) + links + medal };
  },
  lanyard: (c) => {
    const col = c.a, b = c.b || '#a3e635';
    const strap = OL('M136,246 L152,296', col, 7) + OL('M184,246 L168,296', col, 7) + L('M138,252 L150,290 M182,252 L170,290', b, 1.5, { dash: '2 6', op: 0.9 });
    const clip = R(155, 292, 10, 9, 2, '#9ca3af', { sw: 2 });
    const badge = R(138, 300, 44, 32, 4, '#f8fafc') + R(138, 300, 44, 9, 4, col, { sw: 0 }) + F('M138,305 L182,305 L182,309 L138,309 Z', col)
      + R(143, 313, 11, 13, 2, '#7dd3fc', { sw: 1.5 }) + C(148.5, 318, 3, '#e0a076', { sw: 0 }) + L('M159,316 L176,316 M159,322 L172,322', '#64748b', 2) + C(174, 304.5, 1.5, b, { sw: 0 })
      + HL('M140,311 L146,311 L142,330 L140,330 Z', 0.3) + SH('M176,302 L182,302 L182,328 Q182,332 178,332 L172,332 Z', 0.12);
    return { front: strap + clip + badge };
  },
  vr: (c) => {
    const col = c.a, b = c.b || '#22d3ee';
    // visor shell covers the eyes (y 136..168) with a dark glass front; side straps run over the ears (84,146) and tuck behind the head
    const strap = OL('M110,150 C96,144 80,148 74,160', col, 9) + L('M104,148 C94,146 84,148 78,154', light(col, 0.35), 1.5, { op: 0.5 });
    const shell = R(104, 130, 112, 44, 14, col) + R(110, 136, 100, 32, 10, '#0b0f19', { stroke: light(col, 0.22), sw: 2 })
      + HL('M114,139 L170,139 L154,151 L114,151 Z', 0.2) + L('M118,163 L202,163', b, 3) + C(120, 145, 3.2, '#1f2937', { stroke: b, sw: 1.5 }) + C(200, 145, 3.2, '#1f2937', { stroke: b, sw: 1.5 })
      + HL('M108,134 Q110,131 116,131 L150,131 L144,136 L108,136 Z', 0.3) + SH('M206,134 L212,134 Q214,134 214,138 L214,166 Q214,172 208,172 L200,172 Z', 0.16) + C(160, 133, 2, b, { sw: 0 });
    return { top: strap + MIRROR(strap) + shell };
  },
  cash: (c, ctx) => {
    const col = c.a, band = c.b || '#fdf6e3', d = dark(col, 0.4);
    // brick of bills in the right hand: lower bills peek out bottom-right, a paper band wraps the middle; hand + thumb come back on top
    const brick = R(234, 330, 38, 26, 3, light(col, 0.1), { sw: 2.5 }) + R(230, 326, 38, 26, 3, light(col, 0.05), { sw: 2.5 }) + R(226, 322, 38, 26, 3, col)
      + R(230, 326, 30, 18, 2, 'none', { stroke: light(col, 0.5), sw: 1.4 })
      + R(239, 318, 14, 34, 2, band, { sw: 2 }) + T(246, 340, '$', 13, '#15803d', { stroke: dark(band, 0.3), sw: 0.5 })
      + HL('M228,324 L238,324 L233,332 L228,332 Z', 0.35) + SH('M258,330 L264,330 L264,346 Q264,348 262,348 L254,348 Z', 0.14);
    const loose = R(266, 290, 22, 13, 2, col, { sw: 2, extra: { transform: 'rotate(22 277 296)' } }) + L('M272,296 L282,296', light(col, 0.5), 1.5, { extra: { transform: 'rotate(22 277 296)' } })
      + R(280, 318, 22, 13, 2, col, { sw: 2, extra: { transform: 'rotate(-18 291 324)' } }) + L('M286,324 L296,324', light(col, 0.5), 1.5, { extra: { transform: 'rotate(-18 291 324)' } })
      + SPARK(262, 282, 4) + SPARK(298, 308, 3);
    const thumb = E(241, 345, 5, 7.5, ctx.skin, { stroke: dark(ctx.skin, 0.38), sw: 2.5 });
    return { front: loose + G(brick, { transform: 'rotate(-8 245 340)' }) + HAND_R(ctx.skin) + G(thumb, { transform: 'rotate(-25 241 345)' }) };
  },
  tote: (c, ctx, item) => {
    const col = c.a, b = c.b || '#111827', style = item.style || 'ny';
    // canvas tote on the left shoulder: the handle loop runs from the bag top over the shoulder (104,244) and back; the bag hides the left hand (76..104 x 346..374)
    const handles = OL('M72,340 C64,300 74,258 102,244 C112,238 122,244 118,254 C112,274 112,308 118,340', b, 5) + OL('M80,340 C72,302 84,262 106,250', b, 5);
    const print = style === 'la'
      ? T(94, 377, 'LA', 24, b, { stroke: dark(b, 0.3), sw: 1 }) + L('M76,381 L112,381', b, 2.5) + C(112, 350, 4, '#facc15', { sw: 1.5 })
      : T(83, 365, 'I', 18, b) + F(heartPath(103, 356, 7.5), '#ef4444') + T(94, 384, 'NY', 18, b);
    const body = R(66, 336, 56, 52, 6, col) + L('M69,344 L119,344', dark(col, 0.3), 2, { op: 0.5 }) + print
      + HL('M69,340 L84,340 L76,354 L69,354 Z', 0.3) + SH('M112,342 L122,342 L122,382 Q122,388 116,388 L108,388 Z', 0.12) + SH('M66,378 L122,378 L122,382 Q122,388 116,388 L72,388 Q66,388 66,382 Z', 0.1);
    return { front: handles + body };
  },
};

export const ITEMS = [
  ...variants('acc', 'necklace', { en: 'Necklace', ar: 'عقد' }, [
    ['gold', { a: '#f59e0b', b: '#ef4444' }, COLORS.gold[1], 'common', { style: 'gold' }],
    ['pearl', { a: '#fdf6e3' }, { en: 'Pearl', ar: 'لؤلؤ' }, 'rare', { style: 'pearl', tier: 3 }],
    ['chain', { a: '#cbd5e1' }, { en: 'Chain', ar: 'سلسلة' }, 'rare', { style: 'chain', tier: 3 }],
  ], { tier: 2 }),
  ...variants('acc', 'scarf', { en: 'Scarf', ar: 'وشاح' }, [
    ['red', { a: '#ef4444', b: '#fecaca' }, COLORS.red[1], 'common'],
    ['navy', { a: '#1e3a8a', b: '#93c5fd' }, COLORS.navy[1], 'common'],
    ['mint', { a: '#6ee7b7', b: '#f8fafc' }, COLORS.mint[1], 'common'],
    ['purple', { a: '#a855f7', b: '#fde68a' }, COLORS.purple[1], 'rare', { tier: 3 }],
  ], { tier: 1 }),
  ...variants('acc', 'tie', { en: 'Tie', ar: 'ربطة عنق' }, [
    ['red', { a: '#ef4444' }, COLORS.red[1], 'common'],
    ['navy', { a: '#1e3a8a' }, COLORS.navy[1], 'common'],
    ['striped', { a: '#7f1d1d', b: '#f59e0b' }, { en: 'Striped', ar: 'مخططة' }, 'rare', { tier: 3 }],
  ], { tier: 2 }),
  ...variants('acc', 'bowtie', { en: 'Bow Tie', ar: 'بابيون' }, [
    ['black', { a: '#2b2b33' }, COLORS.black[1], 'common'],
    ['red', { a: '#ef4444' }, COLORS.red[1], 'common'],
    ['dotty', { a: '#3b82f6', b: '#f8fafc' }, { en: 'Polka', ar: 'منقط' }, 'rare', { tier: 3 }],
  ], { tier: 2 }),
  ...variants('acc', 'watch', { en: 'Watch', ar: 'ساعة' }, [
    ['classic', { a: '#92400e', b: '#fdf6e3' }, { en: 'Classic', ar: 'كلاسيك' }, 'common', { style: 'classic' }],
    ['smart', { a: '#a3e635', b: '#111827' }, null, 'rare', { style: 'smart', tier: 3, name: { en: 'Fit Band', ar: 'سوار لياقة' } }],
  ], { tier: 2 }),
  ...variants('acc', 'bag', { en: 'Handbag', ar: 'حقيبة يد' }, [
    ['pink', { a: '#f472b6', b: '#f59e0b' }, COLORS.pink[1], 'common'],
    ['brown', { a: '#92400e', b: '#f59e0b' }, COLORS.brown[1], 'common'],
    ['teal', { a: '#14b8a6', b: '#cbd5e1' }, COLORS.teal[1], 'rare', { tier: 3 }],
  ], { gender: 'girl', tier: 2 }),
  ...variants('acc', 'backpack', { en: 'Backpack', ar: 'شنطة ظهر' }, [
    ['blue', { a: '#3b82f6', b: '#1e3a8a' }, COLORS.blue[1], 'common'],
    ['green', { a: '#22c55e', b: '#14532d' }, COLORS.green[1], 'common'],
    ['black', { a: '#2b2b33', b: '#f59e0b' }, COLORS.black[1], 'rare', { tier: 3 }],
  ], { tier: 2 }),
  single('acc', 'wings', 'angel', { a: '#f8fafc', b: '#fde68a' }, { en: 'Angel Wings', ar: 'أجنحة ملاك' }, 'legendary', { tier: 8, style: 'angel' }),
  single('acc', 'wings', 'bat', { a: '#7e22ce', b: '#a855f7' }, { en: 'Bat Wings', ar: 'أجنحة خفاش' }, 'epic', { tier: 6, style: 'bat' }),
  single('acc', 'cape', 'red', { a: '#dc2626' }, { en: 'Hero Cape', ar: 'عباءة بطل' }, 'epic', { tier: 6 }),
  single('acc', 'cape', 'royal', { a: '#6d28d9', b: '#f59e0b' }, { en: 'Royal Cape', ar: 'عباءة ملكية' }, 'legendary', { tier: 8 }),
  ...variants('acc', 'earrings', { en: 'Earrings', ar: 'أقراط' }, [
    ['hoop', { a: '#f59e0b' }, { en: 'Hoop', ar: 'حلقة' }, 'common', { style: 'hoop' }],
    ['pearl', { a: '#f59e0b', b: '#fdf6e3' }, { en: 'Pearl', ar: 'لؤلؤ' }, 'rare', { style: 'pearl', tier: 3 }],
    ['star', { a: '#facc15' }, { en: 'Star', ar: 'نجمة' }, 'epic', { style: 'star', tier: 6 }],
  ], { gender: 'girl', tier: 2 }),
  ...variants('acc', 'headphones', { en: 'Headphones', ar: 'سماعات' }, [
    ['black', { a: '#2b2b33', b: '#ef4444' }, COLORS.black[1], 'common'],
    ['pink', { a: '#f472b6', b: '#fdf6e3' }, COLORS.pink[1], 'common'],
    ['sky', { a: '#7dd3fc', b: '#1e3a8a' }, COLORS.sky[1], 'rare'],
  ], { tier: 3 }),
  single('acc', 'halo', 'gold', { a: '#fbbf24' }, { en: 'Angel Halo', ar: 'هالة ملاك' }, 'legendary', { tier: 6 }),
  ...variants('acc', 'flower', { en: 'Hair Flower', ar: 'وردة شعر' }, [
    ['pink', { a: '#f472b6', b: '#facc15' }, COLORS.pink[1], 'common'],
    ['white', { a: '#f8fafc', b: '#f59e0b' }, COLORS.white[1], 'common'],
  ], { gender: 'girl', tier: 2 }),
  ...variants('acc', 'medal', { en: 'Medal', ar: 'ميدالية' }, [
    ['gold', { a: '#dc2626', b: '#f59e0b' }, COLORS.gold[1], 'rare'],
    ['silver', { a: '#1e3a8a', b: '#cbd5e1' }, COLORS.silver[1], 'rare'],
  ], { tier: 4 }),
  single('acc', 'fannypack', 'neon', { a: '#111827', b: '#a3e635' }, { en: 'Neon Fanny Pack', ar: 'حقيبة خصر نيون' }, 'rare', { tier: 4 }),
  ...variants('acc', 'pet_cat', { en: 'Cat', ar: 'قطة' }, [
    ['tabby', { a: '#f97316', b: '#c2410c' }, { en: 'Tabby', ar: 'مخططة' }, 'epic'],
    ['smoky', { a: '#9ca3af', b: '#4b5563' }, { en: 'Smoky', ar: 'رمادية' }, 'epic'],
  ], { tier: 8 }),
  single('acc', 'pet_dog', 'golden', { a: '#f59e0b', b: '#fdf6e3' }, { en: 'Golden Pup', ar: 'جرو ذهبي' }, 'legendary', { tier: 10 }),
  // ---------- modern / tech / American additions ----------
  ...variants('acc', 'airpods', { en: 'Pods', ar: 'سماعات لاسلكية' }, [
    ['white', { a: '#f8fafc' }, COLORS.white[1], 'common'],
    ['black', { a: '#2b2b33' }, COLORS.black[1], 'rare', { tier: 3 }],
  ], { tier: 2 }),
  ...variants('acc', 'smartwatch', { en: 'Smartwatch', ar: 'ساعة ذكية' }, [
    ['midnight', { a: '#2b2b33', b: '#111827' }, { en: 'Midnight', ar: 'ليلية' }, 'common'],
    ['cloud', { a: '#f8fafc', b: '#cbd5e1' }, { en: 'Cloud', ar: 'سحابية' }, 'common'],
    ['sunset', { a: '#f97316', b: '#f59e0b' }, { en: 'Sunset', ar: 'غروب' }, 'rare'],
  ], { tier: 3 }),
  ...variants('acc', 'phone', { en: 'Phone', ar: 'جوال' }, [
    ['titanium', { a: '#4b5563', b: '#38bdf8' }, { en: 'Titanium', ar: 'تيتانيوم' }, 'common'],
    ['rose', { a: '#f472b6', b: '#c4b5fd' }, { en: 'Rose', ar: 'وردي' }, 'rare', { tier: 3 }],
  ], { tier: 1 }),
  ...variants('acc', 'crossbody', { en: 'Sling Bag', ar: 'حقيبة كروس' }, [
    ['black', { a: '#2b2b33', b: '#a3e635' }, COLORS.black[1], 'common'],
    ['navy', { a: '#1e3a8a', b: '#f97316' }, COLORS.navy[1], 'common'],
    ['pink', { a: '#f472b6', b: '#f8fafc' }, COLORS.pink[1], 'rare', { tier: 3 }],
  ], { tier: 2 }),
  ...variants('acc', 'skateboard', { en: 'Skateboard', ar: 'سكيت بورد' }, [
    ['flame', { a: '#111827', b: '#f97316' }, { en: 'Flame', ar: 'لهب' }, 'rare', { style: 'flame' }],
    ['usa', { a: '#f8fafc', b: '#3b82f6' }, { en: 'USA', ar: 'أمريكي' }, 'rare', { style: 'usa' }],
    ['galaxy', { a: '#312e81', b: '#f472b6' }, { en: 'Galaxy', ar: 'مجرة' }, 'epic', { style: 'galaxy', tier: 6 }],
  ], { tier: 4 }),
  single('acc', 'basketball', 'orange', { a: '#f97316' }, { en: 'Street Hoops Ball', ar: 'كرة سلة' }, 'rare', { tier: 3 }),
  single('acc', 'football', 'brown', { a: '#92400e', b: '#f8fafc' }, { en: 'Gridiron Football', ar: 'كرة قدم أمريكية' }, 'rare', { tier: 3 }),
  single('acc', 'coffee', 'latte', { a: '#f8fafc', b: '#92400e' }, { en: 'NYC Latte', ar: 'لاتيه نيويورك' }, 'common', { tier: 1, style: 'latte' }),
  single('acc', 'coffee', 'iced', { a: '#bfdbfe', b: '#f472b6' }, { en: 'Iced Coffee', ar: 'قهوة مثلجة' }, 'rare', { tier: 3, style: 'iced' }),
  single('acc', 'coffee', 'boba', { a: '#e9d5ff', b: '#a855f7' }, { en: 'LA Boba', ar: 'بوبا لوس أنجلوس' }, 'rare', { tier: 3, style: 'boba' }),
  single('acc', 'camera', 'vlog', { a: '#2b2b33', b: '#ef4444' }, { en: 'Vlog Cam', ar: 'كاميرا فلوق' }, 'rare', { tier: 4, style: 'vlog' }),
  single('acc', 'camera', 'retro', { a: '#e5e7eb', b: '#1e3a8a' }, { en: 'Retro Camera', ar: 'كاميرا ريترو' }, 'epic', { tier: 6, style: 'retro' }),
  single('acc', 'guitar', 'electric', { a: '#dc2626', b: '#fdf6e3' }, { en: 'Rock Star Axe', ar: 'جيتار روك' }, 'epic', { tier: 7, style: 'electric' }),
  single('acc', 'guitar', 'acoustic', { a: '#b45309', b: '#fde68a' }, { en: 'Campfire Acoustic', ar: 'جيتار أكوستيك' }, 'rare', { tier: 5, style: 'acoustic' }),
  single('acc', 'goldchain', 'cuban', { a: '#f59e0b' }, { en: 'Big Cuban Chain', ar: 'سلسلة ذهب ضخمة' }, 'epic', { tier: 6 }),
  single('acc', 'lanyard', 'startup', { a: '#1e3a8a', b: '#a3e635' }, { en: 'Startup Lanyard', ar: 'بطاقة شركة ناشئة' }, 'rare', { tier: 3 }),
  single('acc', 'pet_dog', 'spotted', { a: '#f8fafc', b: '#fdf6e3' }, { en: 'Spotted Pup', ar: 'جرو منقط' }, 'legendary', { tier: 11, style: 'spots' }),
  // ---------- tech / city signatures ----------
  ...variants('acc', 'vr', { en: 'VR Headset', ar: 'نظارة VR' }, [
    ['night', { a: '#111827', b: '#22d3ee' }, { en: 'Night', ar: 'ليلية' }, 'rare'],
    ['cloud', { a: '#f8fafc', b: '#a855f7' }, { en: 'Cloud', ar: 'سحابية' }, 'epic', { tier: 6 }],
  ], { tier: 4 }),
  single('acc', 'cash', 'stack', { a: '#22c55e', b: '#fdf6e3' }, { en: 'Dollar Stack', ar: 'رزمة دولارات' }, 'rare', { tier: 4 }),
  ...variants('acc', 'tote', { en: 'Tote', ar: 'حقيبة توت' }, [
    ['nyc', { a: '#fdf6e3', b: '#111827' }, { en: 'NYC', ar: 'نيويورك' }, 'common', { style: 'ny' }],
    ['la', { a: '#111827', b: '#f472b6' }, { en: 'LA', ar: 'لوس أنجلوس' }, 'common', { style: 'la' }],
  ], { tier: 2 }),
];
