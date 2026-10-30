// MergeRise — full outfits (category 'outfit': replaces top + bottom). Flat sticker style, see STYLE.md.
// Art direction v2: modern American sets (varsity, football, streetwear, Hollywood…) — no Gulf garments, no costume history.
// Floor-length hems (ROBE / prom / gown / hollywood) drop to y≈510 so an equipped sneaker (footprint y≤505) never peeks out.
// Every template draws on the 320x520 rig; right-side pieces are MIRROR() of the left piece. ES2017 only (no ?? / ?.).
import { P, F, SH, HL, C, E, R, L, T, MIRROR, STAR, SPARK, starPath, heartPath, COLORS, variants, single, dark, light } from './_kit.js';

// ---- rig silhouettes + shared shading (coordinates from STYLE.md) --------------------------------
const BODY = 'M102,242 C122,232 198,232 218,242 L226,366 C200,380 120,380 94,366 Z';
const BODY_SH = 'M202,238 C210,238 216,240 218,242 L226,366 C220,371 212,375 203,377 Z';
const BODY_HL = 'M108,252 C116,244 128,240 140,240 L134,298 L112,302 Z';
const LONGBODY = 'M102,242 C122,232 198,232 218,242 L230,396 C200,412 120,412 90,396 Z'; // oversized tee / hoodie / coat
const LONGBODY_SH = 'M202,238 C210,238 216,240 218,242 L230,396 C224,400 216,404 206,406 Z';
const ROBE = 'M102,242 C122,232 198,232 218,242 L242,490 C200,518 120,518 78,490 Z';
const ROBE_SH = 'M202,238 C210,238 216,240 218,242 L242,490 C236,498 226,504 214,508 Z';
const ROBE_HL = 'M108,252 C116,244 128,240 140,240 L132,340 L106,344 Z';
const SLEEVE = 'M104,240 C82,256 72,300 74,352 L108,354 C106,306 112,268 122,248 Z';
const SLEEVE_SH = 'M116,262 C106,290 100,320 98,352 L108,354 C107,322 109,292 118,266 Z';
const SLEEVE_HL = 'M100,246 C92,256 86,270 84,290 L92,288 C94,272 98,260 106,250 Z';
const CUFF = 'M73,338 L109,340 L108,355 L73,353 Z';
const BAGGY = 'M104,240 C76,258 64,304 68,356 L112,358 C108,306 112,268 122,248 Z'; // oversized sleeve
const BAGGY_SH = 'M116,262 C104,296 96,330 94,356 L112,358 C108,330 110,296 118,266 Z';
const WIDE = 'M104,240 C78,262 60,310 58,356 L112,358 C108,306 112,268 122,248 Z';
const WIDE_SH = 'M116,262 C104,296 94,330 90,356 L112,358 C108,330 110,296 118,266 Z';
const WIDE_HL = 'M100,246 C90,258 80,276 74,296 L82,296 C86,278 94,262 106,250 Z';
const SHORT = 'M104,242 C86,252 78,272 80,300 L112,302 C110,278 114,258 124,246 Z';
const SHORT_SH = 'M118,258 C110,274 108,290 108,302 L112,302 C112,288 114,272 120,260 Z';
const SHORT_HL = 'M100,248 C92,256 86,268 84,282 L92,280 C94,268 98,258 106,250 Z';
const PANTS = 'M114,352 L110,470 L154,470 L158,392 L162,392 L166,470 L210,470 L206,352 Z';
const PANTS_SH = 'M194,352 L206,352 L210,470 L196,470 Z';
const PANTS_HL = 'M117,358 L129,358 L127,440 L115,440 Z';
const BAGGY_PANTS = 'M112,352 L102,472 L156,472 L158,392 L162,392 L164,472 L218,472 L208,352 Z';
const TAPER_PANTS = 'M114,352 L112,454 L156,454 L158,392 L162,392 L164,454 L208,454 L206,352 Z';
const SHORTS = 'M114,352 L111,420 L156,420 L158,392 L162,392 L164,420 L209,420 L206,352 Z';
const LONG_SHORTS = 'M112,352 L106,434 L157,434 L158,392 L162,392 L163,434 L214,434 L208,352 Z';
const NECK = 'M138,236 C143,258 177,258 182,236 C176,229 144,229 138,236 Z'; // skin-filled crew opening
const V_NECK = 'M142,236 L160,268 L178,236 C172,231 148,231 142,236 Z';
const TANK = 'M106,244 C110,228 130,228 134,246 C138,274 182,274 186,246 C190,228 210,228 214,244 C220,258 224,276 222,300 L226,366 C200,380 120,380 94,366 L98,300 C96,276 100,258 106,244 Z';
const HEM = 'M95,352 L225,352 L226,366 C200,380 120,380 94,366 Z';
// Full boot: shaft over the leg (x108..158) flaring into a foot that covers the rig foot ellipse AND the sneaker
// footprint of shoes.js (x105..164, y445..505), so the outfit boot hides any equipped shoe underneath.
const BOOT = 'M108,426 C120,432 146,432 158,426 L160,448 L162,462 C163,470 164,480 163,490 C163,500 152,506 134,506 C116,506 104,500 104,490 C103,480 105,470 109,462 L110,448 Z';
const BOOT_SH = 'M149,433 C153,432 156,430 158,427 L160,448 L162,462 C163,470 164,480 163,490 L151,490 C153,480 152,470 150,462 Z';
const BOOT_SOLE = 'M104,491 L163,491 C163,500 152,506 134,506 C116,506 104,500 104,491 Z';
const GOLD = '#f59e0b', WHITE = '#f8fafc', INK = '#2b2b33', DENIM = '#3b5998', SILVER = '#cbd5e1';

const both = s => s + MIRROR(s);
const sleevesLong = (col, o = {}) => both(P(SLEEVE, col, o.stroke ? { stroke: o.stroke } : {}) + SH(SLEEVE_SH, 0.12) + HL(SLEEVE_HL, 0.26) +
  (o.cuff ? P(CUFF, o.cuff) + HL('M76,341 L92,342 L92,347 L76,346 Z', 0.3) : '') + (o.cuffLine ? L('M75,350 L107,352', o.cuffLine, 4) : ''));
const sleevesBaggy = (col, cuff) => both(P(BAGGY, col) + SH(BAGGY_SH, 0.12) + HL('M98,248 C88,260 80,278 76,300 L84,300 C88,280 94,264 104,252 Z', 0.24) +
  (cuff ? P('M67,340 L112,342 L112,358 L68,357 Z', cuff) + L('M76,345 L76,354 M84,345 L84,354 M92,345 L92,354 M100,346 L100,355', dark(cuff, 0.4), 1.6) : ''));
const sleevesWide = col => both(P(WIDE, col) + SH(WIDE_SH, 0.12) + HL(WIDE_HL, 0.24));
const sleevesShort = (col, band) => both(P(SHORT, col) + SH(SHORT_SH, 0.12) + HL(SHORT_HL, 0.26) + (band ? P('M78,288 L113,292 L112,303 L80,300 Z', band) : ''));
const torso = (col, o = {}) => P(BODY, col, o) + SH(BODY_SH, 0.12) + HL(BODY_HL, 0.22);
const longTorso = col => P(LONGBODY, col) + SH(LONGBODY_SH, 0.12) + HL(BODY_HL, 0.22);
const robe = col => P(ROBE, col) + SH(ROBE_SH, 0.12) + HL(ROBE_HL, 0.22);
const pants = (col, o = {}) => P(PANTS, col, o) + SH(PANTS_SH, 0.12) + SH('M150,352 L170,352 L162,392 L158,392 Z', 0.1) + HL(PANTS_HL, 0.2);
const legs = (d, col, hem) => P(d, col) + SH(`M194,352 L206,352 L${320 - (hem.x || 110)},${hem.y} L${320 - (hem.x || 110) - 14},${hem.y} Z`, 0.12) + SH('M150,352 L170,352 L162,392 L158,392 Z', 0.1) + HL(`M117,358 L129,358 L${(hem.x || 110) + 15},${hem.y - 16} L${(hem.x || 110) + 3},${hem.y - 16} Z`, 0.2);
const gloves = col => both(C(90, 360, 15, col) + C(85, 355, 4, '#fff', { sw: 0, op: 0.35 }));
// Hands redrawn OVER a wide sleeve so a full hand hangs out instead of a skin crescent.
const hands = skin => both(C(90, 364, 13, skin, { stroke: dark(skin, 0.38) }) + HL('M82,358 C84,354 88,352 92,353 C88,356 85,359 84,363 Z', 0.3));
const boots = (col, o = {}) => both(P(BOOT, col) + SH(BOOT_SH, 0.14) + HL('M113,434 L122,436 L120,462 L111,462 Z', 0.25) + HL('M110,480 C116,473 128,470 138,471 L136,476 C126,476 118,479 113,486 Z', 0.22) +
  L('M111,441 C122,447 146,447 157,441', dark(col, 0.3), 2.5, { op: 0.6 }) + L('M111,484 C122,477 148,477 160,484', dark(col, 0.3), 2.5) + P(BOOT_SOLE, o.sole || dark(col, 0.3)));
const belt = (col, buckle) => R(94, 348, 132, 16, 6, col) + (buckle ? R(150, 345, 20, 22, 5, buckle) + HL('M153,348 L163,348 L163,353 L153,353 Z', 0.4) : '');
const bandCollar = col => P('M134,240 C144,232 176,232 186,240 L184,256 C170,250 150,250 136,256 Z', col) + HL('M138,242 C146,237 154,236 160,236 L160,241 C150,241 142,244 138,248 Z', 0.3);
const scoopNeck = (skin, col) => F('M136,235 C140,264 180,264 184,235 Z', skin) + L('M136,237 C140,264 180,264 184,237', dark(col), 3.5);
const crewNeck = (skin, col, band) => L('M137,239 C143,262 177,262 183,239', band || dark(col, 0.2), 6) + P(NECK, skin, { stroke: dark(col) });
const vNeck = (skin, col, band) => P(V_NECK, skin, { stroke: dark(col) }) + (band ? L('M139,238 L160,274 L181,238', band, 5) : '');
const diamond = (x, y, s, col) => F(`M${x},${y - s} L${x + s},${y} L${x},${y + s} L${x - s},${y} Z`, col);
const ribs = (x0, x1, y0, y1, step, col) => { let d = ''; for (let x = x0; x <= x1; x += step) d += `M${x},${y0} L${x},${y1} `; return L(d.trim(), col, 2, { op: 0.55 }); };
const hemBand = (col, stripe) => P(HEM, col) + (stripe ? L('M96,358 L224,358 M95,364 C120,374 200,374 225,364', stripe, 2.5) : ribs(104, 216, 356, 366, 12, dark(col, 0.45)));
// Jeans: contrast stitching, scoop pockets, fly, rolled cuffs; ripped = knee holes showing skin.
const jeans = (col, skin, o = {}) => {
  const dk = dark(col, 0.3), st = o.stitch || '#e9b54a';
  const pocket = L('M113,396 C124,396 134,388 139,372', dk, 2.5) + L('M116,400 C127,400 137,391 142,374', st, 1.5, { dash: '4 3' });
  const cx = o.baggy ? 103 : 109, cw = o.baggy ? 53 : 46;
  const cuff = o.cuff === false ? L('M112,460 L153,460', st, 1.4, { dash: '4 3' }) : R(cx, 454, cw, 15, 3, light(col, 0.22), { stroke: dark(col) }) + L(`M${cx + 4},465 L${cx + cw - 4},465`, st, 1.4, { dash: '4 3' });
  const rip = o.ripped ? P('M126,410 C134,403 146,405 146,414 C145,423 128,424 126,410 Z', skin, { stroke: dk, sw: 2.5 }) + L('M128,412 L144,411 M129,418 L143,418', light(col, 0.5), 2) + L('M118,438 L138,437', light(col, 0.45), 2.5) : '';
  return legs(o.baggy ? BAGGY_PANTS : PANTS, col, { x: o.baggy ? 102 : 110, y: 470 }) + both(pocket + cuff + rip) + L('M160,366 L160,392', dk, 2.5) + L('M164,370 L164,388 Q164,394 169,394', st, 1.5, { dash: '4 3' });
};
// Cargo pants: big flap pockets on the thighs + stitched hems.
const cargo = col => {
  const dk = dark(col, 0.3);
  const pocket = R(114, 410, 32, 26, 4, col, { stroke: dk, sw: 3 }) + SH('M138,414 L144,414 L144,434 L138,434 Z', 0.12) + R(112, 407, 36, 11, 3, dark(col, 0.08), { stroke: dk, sw: 3 }) + C(130, 418, 2.6, dk, { sw: 0 });
  const hem = L('M112,462 L153,462', dk, 1.6, { dash: '4 3' }) + L('M114,448 L154,448', dk, 1.6, { dash: '4 3' });
  return legs(BAGGY_PANTS, col, { x: 102, y: 472 }) + both(pocket + hem) + L('M160,366 L160,392', dk, 2.5);
};
// Joggers: tapered legs with ribbed cuffs and a side stripe.
const joggers = (col, stripe) => {
  const cuff = R(111, 450, 47, 18, 6, dark(col, 0.18), { stroke: dark(col) }) + L('M120,455 L120,464 M128,455 L128,464 M136,455 L136,464 M144,455 L144,464 M152,455 L152,464', dark(col, 0.4), 1.6);
  const side = stripe ? L('M114,372 C116,400 118,430 120,452', stripe, 4) : L('M114,372 C116,400 118,430 120,452', dark(col, 0.3), 2.5);
  return legs(TAPER_PANTS, col, { x: 112, y: 454 }) + both(side + cuff) + L('M160,366 L160,392', dark(col, 0.3), 2.5);
};
const waistband = col => R(112, 350, 96, 16, 4, col) + HL('M116,353 L150,353 L150,358 L116,358 Z', 0.25);
const number = (txt, y, size, col, stroke) => T(160, y, txt, size, col, { stroke, sw: 3 });

// jacket + trousers shared by tuxedo and suit (shirt V, lapels, buttons, welt pocket)
function jacket(a, shirt, lapel) {
  const v = P('M130,235 L160,340 L190,235 Z', shirt, { stroke: dark(shirt, 0.3), sw: 3 });
  const lap = both(P('M126,244 C132,238 142,235 146,236 L160,336 L152,338 Z', lapel) + HL('M130,246 C136,240 142,238 146,238 L150,272 L140,274 Z', 0.2));
  const collar = both(P('M142,232 L160,246 L148,255 Z', shirt, { stroke: dark(shirt, 0.3), sw: 2.5 }));
  const btn = C(160, 350, 4, dark(a, 0.3), { sw: 1.5 }) + C(160, 364, 4, dark(a, 0.3), { sw: 1.5 });
  const pocket = L('M184,322 L212,320', dark(a, 0.3), 3.5);
  const square = P('M118,290 L124,282 L132,286 L136,292 Z', shirt, { stroke: dark(shirt, 0.3), sw: 2 }); // left chest, over the sleeve
  const crease = both(L('M134,400 L132,462', dark(a, 0.25), 2, { op: 0.7 }));
  return pants(a) + crease + torso(a) + v + lap + collar + btn + pocket + sleevesLong(a, { cuffLine: shirt }) + square;
}

export const TEMPLATES = {
  // Summer dress — scoop neck, puff sleeves, belt, polka-dot flared skirt with a stitched hem ruffle (knee length).
  dress: (c, ctx) => {
    const a = c.a, b = c.b || WHITE, dot = light(a, 0.55);
    const skirt = P('M100,336 L220,336 L244,428 C200,444 120,444 76,428 Z', a) + SH('M206,336 L220,336 L244,428 C236,431 228,434 220,436 Z', 0.12) + HL('M104,344 L120,344 L108,420 L90,420 Z', 0.22) +
      [[112, 380], [142, 400], [172, 374], [204, 404], [128, 422], [188, 428], [160, 350], [226, 380]].map(([x, y]) => C(x, y, 4.5, dot, { sw: 0 })).join('') +
      L('M80,424 C120,440 200,440 240,424', b, 3, { dash: '6 5', op: 0.9 });
    const bodice = P('M104,242 C122,232 198,232 218,242 L222,348 C200,356 120,356 98,348 Z', a) + SH('M202,238 C210,238 216,240 218,242 L222,348 C216,352 210,354 204,355 Z', 0.12) + HL(BODY_HL, 0.22) +
      [272, 292, 312].map(y => C(160, y, 3.2, b, { sw: 1.5 })).join('');
    const waist = R(100, 338, 120, 16, 5, b) + R(150, 335, 20, 22, 5, dark(b, 0.25)) + HL('M153,338 L163,338 L163,343 L153,343 Z', 0.4);
    return { front: skirt + bodice + sleevesShort(a) + scoopNeck(ctx.skin, a) + waist };
  },
  // Ball gown — strapless sweetheart bodice, off-shoulder puffs, huge sparkling skirt, satin sash + bow.
  gown: (c) => {
    const a = c.a, b = c.b || WHITE;
    const skirt = P('M100,346 L220,346 C250,390 280,440 296,490 C230,516 90,516 24,490 C40,440 70,390 100,346 Z', a) +
      SH('M220,346 C250,390 280,440 296,490 C282,498 266,503 250,506 C244,450 226,396 206,346 Z', 0.14) + HL('M100,346 C70,390 44,440 36,484 L56,476 C66,436 84,392 108,350 Z', 0.26) +
      L('M44,452 C110,476 210,476 276,452 M66,412 C120,432 200,432 254,412', light(a, 0.4), 3, { op: 0.6 });
    const bodice = P('M104,258 C120,268 150,270 160,258 C170,270 200,268 216,258 L220,350 C200,358 120,358 100,350 Z', a) + SH('M204,262 C210,262 216,260 216,258 L220,350 C216,352 210,354 204,355 Z', 0.12) + HL('M108,262 C114,266 122,268 130,268 L126,330 L108,332 Z', 0.24);
    const puff = both(P('M80,250 C86,242 112,242 118,252 C116,270 112,282 110,290 L82,286 C78,272 78,260 80,250 Z', a) + HL('M86,254 C90,248 100,248 104,252 C98,254 92,258 88,262 Z', 0.3));
    const sash = R(102, 340, 116, 16, 6, b) + E(112, 348, 14, 10, b) + E(136, 348, 14, 10, b) + C(124, 348, 6, dark(b, 0.2)) + P('M118,356 L108,384 L120,384 Z', b) + P('M130,356 L128,386 L140,382 Z', b);
    const sparks = [[120, 400], [204, 418], [92, 462], [240, 470], [160, 476], [150, 300], [64, 430], [256, 440]].map(([x, y], i) => SPARK(x, y, i % 2 ? 9 : 6)).join('');
    return { front: skirt + bodice + puff + sash + sparks, hidesFeet: true };
  },
  // Tuxedo — black jacket with satin lapels, white shirt, bow tie, satin-striped trousers, pocket square.
  tuxedo: (c) => {
    const a = c.a, b = c.b || INK;
    const bow = both(P('M140,242 L157,249 L140,256 Z', b)) + R(155, 243, 10, 12, 3, b) + HL('M141,244 L150,248 L141,250 Z', 0.3);
    const satin = both(L('M115,372 L112,462', light(a, 0.22), 3, { op: 0.8 }));
    return { front: jacket(a, WHITE, light(a, 0.14)) + satin + bow, showBottom: false };
  },
  // Suit — plain lapels, white shirt, neck tie (colour b), matching trousers.
  suit: (c) => {
    const a = c.a, b = c.b || COLORS.red[0];
    const tie = P('M152,244 L168,244 L164,256 L167,316 L160,328 L153,316 L156,256 Z', b) + L('M160,262 L160,312', light(b, 0.3), 1.5, { dash: '4 5', op: 0.8 }) + HL('M153,246 L160,246 L158,254 L155,254 Z', 0.3);
    return { front: jacket(a, WHITE, a) + tie, showBottom: false };
  },
  // Superhero — tight suit (a) with trunks + boots + gloves (b), gold belt + star emblem (c), cape behind.
  superhero: (c) => {
    const a = c.a, b = c.b || COLORS.red[0], g = c.c || COLORS.yellow[0];
    const cape = P('M100,246 C120,238 200,238 220,246 L250,470 C200,486 120,486 70,470 Z', b) + SH('M160,244 C190,242 210,243 220,246 L250,470 C222,480 190,484 160,484 Z', 0.14) + HL('M104,250 C112,246 122,244 132,244 L112,440 L88,440 Z', 0.16);
    const trunks = P('M96,360 L224,360 L218,400 C200,410 120,410 102,400 Z', b) + HL('M102,366 L120,366 L118,392 L104,392 Z', 0.22);
    const emblem = C(160, 292, 30, dark(a, 0.3), { sw: 0, op: 0.35 }) + STAR(160, 292, 24, g, { inner: 0.5 }) + HL('M160,272 L166,284 L160,290 L150,286 Z', 0.35);
    const seams = L('M126,254 C140,300 140,320 160,340 M194,254 C180,300 180,320 160,340', dark(a, 0.25), 2.5, { op: 0.6 });
    return { back: cape, front: pants(a) + boots(b) + torso(a) + seams + trunks + belt(g, light(g, 0.4)) + emblem + sleevesLong(a) + gloves(b), showBottom: false, hidesFeet: true };
  },
  // Astronaut — white suit, neck ring, chest control panel, flag + mission patches, air tube, grey gloves/boots.
  astronaut: (c) => {
    const a = c.a, b = c.b || '#94a3b8', panel = '#475569';
    const ring = E(160, 240, 32, 11, b) + HL('M134,238 C140,232 160,230 160,232 L160,236 C150,236 140,238 134,240 Z', 0.4);
    const chest = R(136, 266, 48, 36, 6, panel) + C(146, 278, 4, COLORS.red[0], { sw: 0 }) + C(160, 278, 4, COLORS.green[0], { sw: 0 }) + C(174, 278, 4, COLORS.sky[0], { sw: 0 }) +
      R(142, 288, 36, 8, 2, '#1e293b', { sw: 0 }) + HL('M140,270 L160,270 L160,274 L140,274 Z', 0.3);
    const flag = R(84, 266, 24, 16, 2, WHITE, { sw: 2 }) + L('M84,270 L108,270 M84,275 L108,275 M84,280 L108,280', COLORS.red[0], 2) + R(84, 266, 11, 8, 1, COLORS.navy[0], { sw: 0 });
    const patch = MIRROR(C(96, 274, 11, COLORS.red[0]) + STAR(96, 274, 6, WHITE, { sw: 0 }));
    const tube = L('M184,300 C210,312 214,344 206,368', b, 7) + L('M184,300 C210,312 214,344 206,368', light(b, 0.4), 2.5, { dash: '5 5' });
    const pads = both(E(138, 420, 16, 10, b) + HL('M126,416 C130,412 138,411 144,413 C136,414 130,416 126,420 Z', 0.3));
    return { front: pants(a) + boots(b) + pads + torso(a) + chest + belt(b, panel) + ring + sleevesLong(a, { cuff: b }) + flag + patch + tube + gloves(b), showBottom: false, hidesFeet: true };
  },
  // Velvet Tux (legendary) — Beverly Hills red-carpet look: velvet dinner jacket (a) with black satin shawl lapels,
  // white shirt + black bow tie, gold button / lapel pin / pocket-watch chain (b), black slim pants with a satin stripe.
  // Template key `royal` + item id outfit_royal_purple are kept from the retired robe so saved wardrobes stay valid.
  royal: (c) => {
    const a = c.a, g = c.b || GOLD, satin = '#1f1f26', shirt = WHITE;
    const slacks = pants(INK) + both(L('M115,372 L112,462', light(INK, 0.22), 3, { op: 0.8 })) + both(L('M134,400 L132,462', '#111', 2, { op: 0.5 }));
    const nap = L('M104,314 L114,306 M103,336 L113,328 M102,358 L112,350 M214,314 L206,306 M216,338 L208,330', light(a, 0.5), 2.2, { op: 0.45 });
    const cuffBtns = both(C(80, 345, 2.4, g, { sw: 0 }) + C(88, 346, 2.4, g, { sw: 0 }));
    const v = P('M134,235 L160,340 L186,235 Z', shirt, { stroke: dark(shirt, 0.3), sw: 3 });
    const lapel = both(P('M124,246 C128,238 140,233 148,236 C150,270 156,310 160,338 C150,306 138,274 124,246 Z', satin) + HL('M130,246 C136,240 144,238 148,240 L150,270 L140,272 Z', 0.18));
    const collar = both(P('M142,232 L160,246 L148,255 Z', shirt, { stroke: dark(shirt, 0.3), sw: 2.5 }));
    const bow = both(P('M142,240 L158,247 L142,254 Z', satin)) + R(155, 241, 10, 12, 3, satin) + HL('M143,242 L152,246 L143,249 Z', 0.25);
    const button = C(160, 342, 4.5, g, { stroke: dark(g, 0.35), sw: 1.5 }) + C(158, 340, 1.5, '#fff', { sw: 0, op: 0.7 });
    const chain = L('M184,322 L212,320', dark(a, 0.3), 3.5) + L('M160,344 C166,364 192,362 202,326', g, 2.5) + L('M160,344 C166,364 192,362 202,326', '#fde68a', 1.2, { dash: '2 3' });
    const pin = STAR(134, 262, 6, g, { inner: 0.5, stroke: dark(g, 0.35), sw: 1.5 });
    const square = P('M118,290 L124,282 L132,286 L136,292 Z', shirt, { stroke: dark(shirt, 0.3), sw: 2 });
    const sparks = SPARK(108, 268, 5) + SPARK(214, 296, 6) + SPARK(126, 354, 4);
    return { front: slacks + torso(a) + nap + v + lapel + collar + bow + button + chain + sleevesLong(a, { cuffLine: shirt }) + cuffBtns + pin + square + sparks, showBottom: false };
  },
  // Tracksuit — zip jacket with stand collar + double sleeve stripes, pants with side stripes.
  tracksuit: (c) => {
    const a = c.a, b = c.b || WHITE;
    const legStripes = both(L('M122,356 L116,468', b, 3.5) + L('M130,356 L124,468', b, 3.5));
    const armStripes = both(L('M96,252 C84,270 78,304 78,348', b, 3) + L('M106,254 C92,272 86,306 86,350', b, 3));
    const zip = L('M160,256 L160,374', dark(a, 0.35), 5) + L('M160,258 L160,372', light(a, 0.5), 1.5, { dash: '3 3' }) + R(155, 258, 10, 14, 3, '#cbd5e1');
    const hems = both(P('M109,456 L155,456 L154,470 L110,470 Z', dark(a, 0.2)));
    return { front: pants(a) + legStripes + hems + torso(a) + sleevesLong(a, { cuff: dark(a, 0.2) }) + armStripes + bandCollar(a) + zip, showBottom: false };
  },
  // Pajamas — piped collar + cuffs (b), button placket, chest pocket, star or heart pattern (item.pattern).
  pajamas: (c, ctx, item) => {
    const a = c.a, b = c.b || WHITE, star = item.pattern !== 'heart';
    const pat = [[120, 270], [196, 268], [126, 326], [190, 330], [160, 300], [130, 390], [190, 410], [138, 440], [184, 450]]
      .map(([x, y]) => F(star ? starPath(x, y, 6, 0.5) : heartPath(x, y, 5), b, { op: 0.9 })).join('');
    const collar = both(P('M136,236 L160,250 L150,262 L130,252 Z', b, { stroke: dark(a, 0.3), sw: 2.5 }));
    const placket = L('M160,262 L160,372', dark(a, 0.25), 2.5) + [280, 310, 340].map(y => C(160, y, 3.4, b, { sw: 1.5 })).join('');
    const pocket = R(186, 282, 24, 22, 3, a, { sw: 2.5 }) + L('M186,284 L210,284', b, 3);
    return { front: pants(a) + both(P('M109,454 L155,454 L154,470 L110,470 Z', b)) + torso(a) + pat + placket + pocket + sleevesLong(a, { cuff: b }) + collar, showBottom: false };
  },
  // Chef — white double-breasted jacket, red neckerchief, charcoal apron, checked pants.
  chef: (c) => {
    const a = c.a, b = c.b || '#374151', red = COLORS.red[0];
    const checks = both([426, 440, 454].map((y, i) => (i % 2 ? [124, 140] : [116, 132, 148]).map(x => R(x, y, 6, 6, 1, '#9ca3af', { sw: 0 })).join('')).join(''));
    const apron = P('M104,356 L100,418 C130,428 190,428 220,418 L216,356 Z', b) + HL('M108,360 L124,360 L122,410 L106,408 Z', 0.2) + R(146, 384, 28, 22, 3, b, { stroke: light(b, 0.4), sw: 2 });
    const tie = light(b, 0.22);
    const bow = E(112, 378, 8, 5, tie) + E(126, 380, 7, 5, tie) + P('M116,384 L108,404 L120,400 Z', tie) + P('M122,384 L126,404 L132,398 Z', tie) + C(119, 379, 3.5, light(b, 0.5), { sw: 0 });
    const flap = L('M160,250 L190,262 L188,336', dark(a, 0.3), 2.5, { op: 0.8 });
    const buttons = [148, 172].map(x => [268, 292, 316].map(y => C(x, y, 4, dark(a, 0.2), { sw: 1.5 })).join('')).join('');
    const scarf = P('M140,236 C150,246 170,246 180,236 L166,262 L160,276 L154,262 Z', red) + HL('M144,240 C150,246 158,247 160,246 L156,258 Z', 0.3);
    return { front: pants(b) + checks + apron + torso(a) + flap + buttons + bow + sleevesLong(a, { cuff: a }) + bandCollar(a) + scarf, showBottom: false };
  },
  // Stealth Ops Suit — black tactical fit (a): chest harness with a square buckle, utility belt (b) with pouches,
  // knee + elbow pads, sleeve patches, gloves, high collar. Template key `ninja` / id outfit_ninja_black kept.
  ninja: (c) => {
    const a = c.a, b = c.b || COLORS.red[0], pad = '#3f3f46', line = '#18181b', strap = '#4b5563';
    const kneePads = both(E(138, 428, 19, 13, pad, { stroke: line }) + HL('M124,422 C128,417 136,415 142,417 C134,419 128,422 125,427 Z', 0.3) + L('M127,432 L150,432', line, 2, { op: 0.7 }) + L('M131,424 L145,424', '#71717a', 2.5, { dash: '2 3' }));
    const elbowPads = both(E(90, 300, 12, 15, pad, { stroke: line }) + HL('M84,290 C86,286 90,284 94,285 C90,288 87,292 86,296 Z', 0.3));
    const patches = both(R(90, 268, 16, 10, 2, pad, { stroke: line, sw: 1.5 }) + L('M93,273 L103,273', '#9ca3af', 2));
    const harness = L('M108,250 L214,350 M212,250 L106,350', strap, 8) + L('M108,250 L214,350 M212,250 L106,350', '#9ca3af', 1.5, { dash: '4 6' }) +
      R(152, 292, 16, 16, 3, SILVER, { stroke: '#475569', sw: 2 }) + L('M156,300 L164,300', '#475569', 2) + C(164, 296, 1.8, COLORS.red[0], { sw: 0 });
    const beltBand = R(94, 346, 132, 18, 6, b) + both(R(104, 343, 22, 24, 4, pad, { stroke: line, sw: 2 }) + L('M108,351 L122,351', line, 2) + HL('M107,346 L115,346 L115,349 L107,349 Z', 0.3)) +
      R(150, 343, 20, 24, 4, SILVER, { stroke: '#475569', sw: 2 }) + HL('M153,346 L163,346 L163,351 L153,351 Z', 0.4);
    const collar = P('M134,240 C146,232 174,232 186,240 L188,258 C172,252 148,252 132,258 Z', '#3f3f46') + HL('M138,242 C146,236 158,235 160,235 L160,241 C150,241 142,244 138,248 Z', 0.25);
    return { front: pants(a) + kneePads + torso(a) + harness + beltBand + sleevesLong(a) + elbowPads + patches + gloves(a) + collar, showBottom: false };
  },

  // ---------------- modern American sets ----------------
  // Varsity — letterman jacket: wool body (a), contrast leather sleeves (b), striped rib collar/cuffs/hem, snaps, chenille letter (c) + jeans.
  varsity: (c, ctx) => {
    const a = c.a, b = c.b || COLORS.cream[0], lt = c.c || b;
    const stripes = d => L(d, a, 2.5);
    const slv = both(P(SLEEVE, b) + SH(SLEEVE_SH, 0.12) + HL(SLEEVE_HL, 0.26) + P(CUFF, b) + stripes('M74,343 L108,345 M74,349 L107,351'));
    const hem = P(HEM, b) + stripes('M96,357 L224,357 M95,363 C120,374 200,374 225,363');
    const snaps = L('M160,256 L160,356', dark(a, 0.3), 2.5) + [268, 292, 316, 340].map(y => C(160, y, 3.6, SILVER, { stroke: '#64748b', sw: 1.5 })).join('');
    const letter = R(112, 286, 34, 36, 7, lt, { op: 0.22, sw: 0 }) + T(129, 318, 'R', 34, lt, { stroke: dark(lt, 0.35), sw: 3 });
    const pocket = L('M186,318 L212,316', dark(a, 0.3), 3.5);
    const collar = P('M126,240 C134,228 186,228 194,240 L190,256 C178,248 142,248 130,256 Z', b) + stripes('M132,247 C144,240 176,240 188,247');
    return { front: jeans(DENIM, ctx.skin) + slv + torso(a) + hem + snaps + letter + pocket + collar, showBottom: false };
  },
  // Football — jersey (a) with shoulder-pad bulk, contrast sleeve stripes + big number (b), pants (c) with side stripe, striped socks.
  football: (c, ctx, item) => {
    const a = c.a, b = c.b || WHITE, p = c.c || WHITE, num = item.num || '12', st = (b === p) ? a : b; // stripe never b-on-b (Dallas silver)
    const pad = P('M94,246 C98,230 128,226 150,236 L146,276 C128,268 108,270 96,278 Z', a) + HL('M100,246 C106,236 122,232 136,236 L134,246 C120,244 108,246 100,254 Z', 0.3);
    const slv = both(P(SHORT, a) + SH(SHORT_SH, 0.12) + HL(SHORT_HL, 0.26) + P('M79,284 L113,288 L112,303 L80,300 Z', b) + L('M80,292 L112,295', a, 2.5));
    const pant = P('M112,352 L108,436 L156,436 L158,392 L162,392 L164,436 L212,436 L208,352 Z', p) + SH('M196,352 L208,352 L212,436 L198,436 Z', 0.12) + HL('M116,360 L128,360 L126,420 L114,420 Z', 0.2) +
      both(L('M118,360 L114,432', st, 4)) + L('M160,366 L160,392', dark(p, 0.3), 2.5);
    const socks = both(R(117, 438, 42, 32, 6, p) + L('M118,448 L158,448 M118,456 L158,456', st, 3.5) + HL('M120,441 L126,441 L126,466 L120,466 Z', 0.25));
    const big = number(num, 340, 56, b, dark(a)) + T(116, 266, num, 13, b, { stroke: dark(a), sw: 1.5 }) + T(204, 266, num, 13, b, { stroke: dark(a), sw: 1.5 }); // x=204 mirrors the spot, not the glyphs
    return { front: pant + socks + pad + MIRROR(pad) + slv + torso(a) + big + vNeck(ctx.skin, a, b), showBottom: false };
  },
  // Basketball — tank jersey (a) with contrast binding, team tag + number (b), long baggy shorts with side panels.
  basketball: (c, ctx, item) => {
    const a = c.a, b = c.b || WHITE, num = item.num || '23', tag = item.tag || 'LA';
    const bind = L('M136,248 C140,278 180,278 184,248 M110,248 C104,260 101,276 102,300 M210,248 C216,260 219,276 218,300', b, 5);
    const shorts = P(LONG_SHORTS, a) + SH('M196,352 L208,352 L214,434 L200,434 Z', 0.12) + HL('M116,360 L128,360 L122,420 L110,420 Z', 0.2) +
      both(P('M114,366 L109,430 L121,430 L125,366 Z', b, { sw: 2 })) + L('M160,366 L160,392', dark(a, 0.3), 2.5) + L('M108,430 C130,438 190,438 212,430', b, 3);
    const tank = P(TANK, a) + SH('M202,248 L222,300 L226,366 C216,374 206,377 196,378 Z', 0.12) + HL('M108,250 C112,242 124,240 132,250 L128,262 C118,268 112,278 108,294 Z', 0.22);
    const text = T(160, 292, tag, 20, b, { stroke: dark(a), sw: 2 }) + number(num, 346, 54, b, dark(a));
    return { front: shorts + tank + bind + text, showBottom: false };
  },
  // Baseball — pinstripe button jersey (a, stripes b), sleeve bands, chest number, belted pinstripe pants.
  baseball: (c, ctx, item) => {
    const a = c.a, b = c.b || COLORS.navy[0], num = item.num || '7';
    let pin = '';
    for (let x = 112; x <= 208; x += 12) if (x !== 160) pin += `M${x},${x < 150 || x > 170 ? 250 : 256} L${x},368 `;
    const pins = L(pin.trim(), b, 1.6, { op: 0.55 }) + both(L('M122,372 L120,466 M134,372 L133,466 M146,372 L146,466', b, 1.6, { op: 0.5 }));
    const placket = L('M160,262 L160,368', dark(a, 0.3), 2.5) + [276, 300, 324, 348].map(y => C(160, y, 3.4, b, { sw: 1.5 })).join('');
    const crest = C(130, 290, 9, b, { sw: 2 }) + STAR(130, 290, 5, a, { sw: 0 });
    const text = T(190, 310, num, 28, b, { stroke: a, sw: 4 });
    return { front: pants(a) + sleevesShort(a, b) + torso(a) + pins + placket + crest + text + belt(INK, SILVER) + vNeck(ctx.skin, a, b), showBottom: false };
  },
  // Cheer (girl) — sleeveless shell top with chevron + team tag (b), pleated skirt with contrast pleats, pom-poms in both hands.
  cheer: (c, ctx, item) => {
    const a = c.a, b = c.b || WHITE, tag = item.tag || 'NYC';
    const top = P('M106,244 C110,228 130,228 134,246 C138,274 182,274 186,246 C190,228 210,228 214,244 C220,258 224,276 222,300 L222,352 C200,360 120,360 98,352 L98,300 C96,276 100,258 106,244 Z', a) +
      SH('M202,248 L222,300 L222,352 C216,355 210,357 204,358 Z', 0.12) + HL('M108,250 C112,242 124,240 132,250 L128,262 C118,268 112,278 108,294 Z', 0.22);
    const chevron = P('M104,290 L160,318 L216,290 L216,308 L160,336 L104,308 Z', b, { sw: 2 }) + T(160, 284, tag, 19, b, { stroke: dark(a), sw: 2 });
    const bind = L('M136,248 C140,278 180,278 184,248 M110,248 C104,260 101,276 102,300 M210,248 C216,260 219,276 218,300', b, 5);
    const hemY = x => 440 - 12 * ((x - 160) / 70) * ((x - 160) / 70);
    let pleats = '';
    for (let i = 0; i < 7; i++) {
      const x1 = 102 + i * 116 / 7, x2 = x1 + 116 / 7, h1 = 90 + i * 20, h2 = h1 + 20;
      if (i % 2) pleats += F(`M${x1},348 L${x2},348 L${h2},${hemY(h2)} L${h1},${hemY(h1)} Z`, b);
      if (i) pleats += L(`M${x1},348 L${h1},${hemY(h1)}`, dark(a, 0.3), 2.2);
    }
    const skirt = P('M102,346 L90,428 C118,444 202,444 230,428 L218,346 Z', a) + pleats + HL('M104,352 L116,352 L108,420 L94,420 Z', 0.2) + SH('M206,350 L218,350 L228,430 L214,434 Z', 0.12) + R(100, 342, 120, 14, 4, b);
    const pom = C(88, 368, 17, b, { stroke: dark(b, 0.25) }) + [[80, 360], [96, 360], [84, 374], [95, 376], [101, 367], [88, 366]].map(([x, y]) => C(x, y, 4, a, { sw: 0 })).join('') +
      L('M74,356 L69,350 M104,357 L109,351 M88,386 L87,392 M76,378 L71,383', a, 3) + HL('M76,362 C78,356 84,353 90,354 C84,357 80,361 78,366 Z', 0.4);
    return { front: top + chevron + bind + skirt + both(pom) };
  },
  // Western (boy) — plaid snap shirt (a, lines b), suede vest (c), jeans, star buckle, leather boots.
  western: (c, ctx) => {
    const a = c.a, b = c.b || dark(c.a, 0.35), v = c.c || '#8b5a2b';
    const plaid = L('M118,250 L116,372 M140,246 L140,372 M180,246 L180,372 M202,250 L204,372 M104,268 L216,268 M100,298 L220,298 M98,328 L222,328 M96,356 L224,356', b, 3, { op: 0.45 }) +
      L('M129,248 L128,372 M191,248 L192,372 M102,283 L218,283 M99,313 L221,313 M97,343 L223,343', light(a, 0.5), 1.5, { op: 0.6 });
    const slvPlaid = both(L('M94,266 L116,268 M86,292 L112,294 M80,318 L110,320 M77,344 L108,346 M98,250 C88,280 82,316 80,352', b, 2.5, { op: 0.45 }));
    const snaps = L('M160,258 L160,370', dark(a, 0.3), 2) + [272, 296, 320, 344].map(y => C(160, y, 3, SILVER, { stroke: '#64748b', sw: 1.2 })).join('');
    const flap = P('M140,230 C130,242 132,256 148,268 L163,263 C160,248 152,236 146,230 Z', a) + HL('M141,236 C136,244 136,252 142,260 L146,258 C142,250 142,242 146,236 Z', 0.3);
    const collar = P(V_NECK, ctx.skin, { stroke: dark(a) }) + both(flap);
    const vest = both(P('M104,244 C112,238 126,238 136,246 C130,280 128,320 134,370 L102,370 C98,320 98,280 104,244 Z', v) + SH('M124,250 C120,300 119,340 123,370 L134,370 C128,320 130,280 136,246 Z', 0.14) +
      HL('M112,250 C116,246 122,244 126,246 L122,300 L112,302 Z', 0.22) + L('M104,318 L124,320', dark(v, 0.3), 2.5) + C(116, 264, 2.6, '#fde68a', { sw: 0 }) + C(118, 300, 2.6, '#fde68a', { sw: 0 }));
    const buckle = belt('#5b3a1e') + E(160, 356, 15, 11, GOLD) + STAR(160, 356, 7, dark(GOLD, 0.3), { sw: 0 });
    const boot = boots('#7c4a1e', { sole: '#3a2a20' }) + both(L('M118,446 L130,460 L142,446', '#fde68a', 2, { op: 0.6 }));
    return { front: sleevesLong(a, { cuff: a }) + slvPlaid + torso(a) + plaid + snaps + jeans(DENIM, ctx.skin, { cuff: false }) + boot + buckle + vest + collar, showBottom: false, hidesFeet: true };
  },
  // Cowgirl (girl) — plaid shirt (a, lines b), fringe suede vest (c), denim skirt, star buckle, coloured boots (d).
  cowgirl: (c, ctx) => {
    const a = c.a, b = c.b || dark(c.a, 0.35), v = c.c || '#c08a4e', bc = c.d || '#be185d', st = '#e9b54a';
    const plaid = L('M118,250 L116,372 M140,246 L140,372 M180,246 L180,372 M202,250 L204,372 M104,268 L216,268 M100,298 L220,298 M98,328 L222,328', b, 3, { op: 0.45 }) +
      L('M129,248 L128,372 M191,248 L192,372 M102,283 L218,283 M99,313 L221,313 M97,343 L223,343', light(a, 0.5), 1.5, { op: 0.6 });
    const slvPlaid = both(L('M94,266 L116,268 M86,292 L112,294 M80,318 L110,320 M77,344 L108,346 M98,250 C88,280 82,316 80,352', b, 2.5, { op: 0.45 }));
    const snaps = L('M160,258 L160,346', dark(a, 0.3), 2) + [272, 296, 320].map(y => C(160, y, 3, SILVER, { stroke: '#64748b', sw: 1.2 })).join('');
    const flap = P('M140,230 C130,242 132,256 148,268 L163,263 C160,248 152,236 146,230 Z', a) + HL('M141,236 C136,244 136,252 142,260 L146,258 C142,250 142,242 146,236 Z', 0.3);
    const collar = P(V_NECK, ctx.skin, { stroke: dark(a) }) + both(flap);
    const skirt = P('M104,346 L96,432 C120,446 200,446 224,432 L216,346 Z', DENIM) + SH('M204,346 L216,346 L224,432 C218,435 212,437 206,439 Z', 0.12) + HL('M108,352 L120,352 L114,424 L100,424 Z', 0.2) +
      L('M100,426 C120,438 200,438 220,426 M160,368 L160,436', st, 1.6, { dash: '4 3' }) + both(L('M112,386 C122,386 130,378 134,366', st, 1.6, { dash: '4 3' }));
    const vest = both(P('M104,244 C112,238 126,238 136,246 C130,270 128,300 134,338 L102,338 C98,300 98,270 104,244 Z', v) + SH('M124,250 C120,290 119,320 123,338 L134,338 C128,300 130,270 136,246 Z', 0.14) +
      HL('M112,250 C116,246 122,244 126,246 L122,290 L112,292 Z', 0.22) + L('M103,340 L106,356 L110,340 L114,358 L118,340 L122,356 L126,340 L130,358 L134,340', v, 2.5) + C(117, 268, 2.6, '#fde68a', { sw: 0 }));
    const buckle = belt('#5b3a1e') + E(160, 356, 15, 11, GOLD) + STAR(160, 356, 7, dark(GOLD, 0.3), { sw: 0 });
    const boot = boots(bc) + both(STAR(134, 466, 6, WHITE, { sw: 0 }));
    return { front: sleevesLong(a, { cuff: a }) + slvPlaid + torso(a) + plaid + snaps + boot + skirt + buckle + vest + collar, hidesFeet: true };
  },
  // Streetwear — oversized hoodie (a) with hood behind, kangaroo pocket, drawstrings + chest print (b); cargo pants (c).
  streetwear: (c, ctx) => {
    const a = c.a, b = c.b || WHITE, p = c.c || '#4b5563', rib = dark(a, 0.18);
    const back = P('M96,180 C84,222 88,254 112,262 L208,262 C232,254 236,222 224,180 C210,206 110,206 96,180 Z', a) + SH('M200,204 C214,206 220,196 224,180 C236,222 232,254 208,262 L198,262 Z', 0.16);
    const ring = P('M118,246 C122,230 140,226 160,230 C180,226 198,230 202,246 C206,262 186,276 160,276 C134,276 114,262 118,246 Z', a) +
      SH('M160,232 C180,226 198,230 202,246 C206,262 186,276 160,276 L160,266 C174,266 192,258 192,248 C190,240 178,236 160,238 Z', 0.14) + L('M126,262 C138,272 182,272 194,262', dark(a, 0.3), 2.5, { op: 0.6 });
    const pocket = P('M122,330 L198,330 L206,384 L114,384 Z', a) + L('M125,336 L117,380 M195,336 L203,380', dark(a), 3) + HL('M128,334 L140,334 L134,378 L122,378 Z', 0.16);
    const strings = L('M151,254 L146,304 M169,254 L174,304', b, 3) + C(146, 306, 3.5, b, { sw: 1.5 }) + C(174, 306, 3.5, b, { sw: 1.5 });
    const print = T(160, 318, 'RISE', 22, b, { stroke: dark(a), sw: 2 });
    const hem = P('M91,384 L229,384 L230,396 C200,412 120,412 90,396 Z', rib) + ribs(100, 220, 388, 398, 12, dark(a, 0.45));
    return { back, front: cargo(p) + sleevesBaggy(a, rib) + longTorso(a) + print + pocket + hem + ring + P(NECK, ctx.skin, { stroke: dark(a) }) + strings, showBottom: false };
  },
  // Techwear — black shell jacket: high collar, chest strap + buckle, utility pockets, reflective piping (c); tapered joggers with thigh straps.
  techwear: (c) => {
    const a = c.a, b = c.b || '#6b7280', ref = c.c || '#a3e635', line = '#4b5563';
    const strap = L('M118,252 L204,362', b, 9) + L('M118,252 L204,362', dark(b, 0.4), 1.5, { dash: '3 6' }) + R(154, 294, 16, 14, 3, SILVER, { stroke: '#475569', sw: 2 }) + L('M157,301 L167,301', '#475569', 2);
    const pockets = R(112, 318, 34, 30, 4, a, { stroke: line, sw: 2.5 }) + L('M112,326 L146,326', ref, 2) + R(176, 262, 30, 22, 4, a, { stroke: line, sw: 2.5 }) + L('M176,268 L206,268', line, 2);
    const zip = L('M160,252 L160,372', line, 4) + L('M160,254 L160,370', SILVER, 1.4, { dash: '3 3' }) + R(155, 256, 10, 12, 3, b);
    const collar = P('M132,236 C144,226 176,226 188,236 L190,262 C172,256 148,256 130,262 Z', a, { stroke: line }) + HL('M136,240 C146,232 158,231 160,231 L160,238 C150,238 142,242 136,248 Z', 0.2);
    const piping = both(L('M100,252 C90,268 84,300 82,348', ref, 2.5, { op: 0.9 })) + L('M96,366 C120,378 200,378 224,366', ref, 2.5, { op: 0.9 });
    const thigh = both(R(108, 404, 44, 10, 3, b, { stroke: dark(b, 0.4), sw: 2 }) + R(126, 402, 10, 14, 2, SILVER, { sw: 1.5, stroke: '#475569' }));
    return { front: joggers(a, ref) + thigh + sleevesLong(a, { cuff: dark(a, 0.25) }) + torso(a) + piping + strap + pockets + zip + collar, showBottom: false };
  },
  // Biker — black leather jacket: asymmetric zip, wide lapels with studs, epaulettes, zip pockets, white tee; ripped jeans.
  biker: (c, ctx) => {
    const a = c.a, b = c.b || WHITE, line = '#4b5563', stud = SILVER;
    const tee = P('M134,236 L186,236 L190,372 C180,380 140,380 130,372 Z', b) + SH('M172,238 L186,236 L190,372 C184,376 178,379 170,380 Z', 0.12);
    const panelL = P('M100,240 C112,233 130,232 148,240 L150,372 C124,384 104,380 94,366 Z', a) + HL('M104,246 C112,240 124,236 136,238 L132,250 C120,254 112,264 108,280 Z', 0.2);
    const panelR = P('M172,240 C190,232 208,233 220,240 L226,366 C200,380 160,384 146,372 L156,300 L166,250 Z', a) + SH('M200,236 L220,240 L226,366 C216,374 206,378 196,380 Z', 0.14);
    const lapels = P('M126,244 C132,238 142,235 148,238 L156,292 L144,294 Z', a) + HL('M130,246 C136,240 142,238 148,240 L152,268 L142,270 Z', 0.22) + P('M194,244 C188,238 178,235 172,238 L164,292 L176,294 Z', a) + HL('M190,246 C184,240 178,238 172,240 L168,268 L178,270 Z', 0.12);
    const zip = L('M166,252 L148,370', line, 4) + L('M165,254 L149,368', SILVER, 1.4, { dash: '3 3' }) + L('M106,312 L124,332 M196,312 L214,332', line, 3) + L('M107,313 L123,331 M197,313 L213,331', SILVER, 1.2, { dash: '2 3' });
    const epaulette = both(R(100, 246, 30, 10, 3, a, { stroke: line, sw: 2 }) + C(104, 251, 3, stud, { sw: 1, stroke: '#64748b' }));
    const collar = both(P('M126,240 C136,228 160,226 160,232 L160,250 C148,246 136,254 126,262 Z', a, { stroke: line }) + C(131, 256, 3, stud, { sw: 1, stroke: '#64748b' }));
    const hem = L('M94,366 C120,380 200,380 226,366', line, 2.5);
    return { front: jeans(DENIM, ctx.skin, { ripped: true }) + sleevesLong(a, { cuff: dark(a, 0.3) }) + tee + panelL + panelR + lapels + zip + epaulette + hem + collar, showBottom: false };
  },
  // Skater — graphic tee (a) with a wheel + bolt print (b), knee shorts (c) with a wallet chain, striped tube socks.
  skater: (c, ctx) => {
    const a = c.a, b = c.b || WHITE, s = c.c || INK;
    const print = C(160, 306, 30, light(a, 0.25), { stroke: dark(a, 0.3), sw: 3 }) + P('M172,274 L140,316 L158,316 L148,342 L182,298 L164,298 Z', b);
    const shorts = legs(SHORTS, s, { x: 111, y: 420 }) + both(L('M113,396 C124,396 134,388 139,372', dark(s, 0.3), 2.5) + R(108, 408, 50, 14, 3, dark(s, 0.12), { stroke: dark(s) })) + L('M160,366 L160,392', dark(s, 0.3), 2.5);
    const chain = L('M112,372 C104,390 110,404 122,412', '#64748b', 4) + L('M112,372 C104,390 110,404 122,412', SILVER, 2, { dash: '3 3' });
    const socks = both(R(118, 436, 40, 30, 6, WHITE) + L('M119,444 L157,444 M119,452 L157,452', a, 3.5));
    return { front: shorts + chain + socks + sleevesShort(a) + torso(a) + print + L('M102,364 C122,375 198,375 218,364', dark(a, 0.3), 2, { dash: '5 4', op: 0.7 }) + crewNeck(ctx.skin, a), showBottom: false };
  },
  // Surfer — wetsuit: black suit (a) with colour side panels + cuffs (b), front zip with leash, wave logo, knee-length legs.
  surfer: (c) => {
    const a = c.a, b = c.b || COLORS.teal[0];
    const legD = 'M114,352 L111,436 L156,436 L158,392 L162,392 L164,436 L209,436 L206,352 Z';
    const legsD = P(legD, a) + SH('M194,352 L206,352 L209,436 L197,436 Z', 0.12) + HL('M117,358 L129,358 L127,420 L115,420 Z', 0.2) + both(P('M115,356 L113,432 L125,432 L129,356 Z', b, { sw: 2 }) + L('M112,428 L155,428', b, 3)) + L('M160,366 L160,392', dark(a, 0.3), 2.5);
    const panel = both(P('M104,244 C112,238 120,240 122,250 C112,290 106,330 108,368 L96,366 C96,320 100,280 104,244 Z', b, { sw: 2 }) + L('M98,250 C90,268 84,296 82,330', b, 4));
    const zip = L('M160,254 L160,330', '#4b5563', 4) + L('M160,256 L160,328', SILVER, 1.4, { dash: '3 3' }) + L('M160,254 C176,258 184,272 180,286', b, 3) + C(180, 288, 4, b, { sw: 1.5 });
    const logo = L('M130,322 Q138,308 146,322 T162,322 T178,322', b, 4);
    return { front: legsD + sleevesLong(a, { cuff: b }) + torso(a) + panel + zip + logo + bandCollar(a), showBottom: false };
  },
  // Prom (girl) — sparkly fitted dress: sweetheart bodice with thin straps, glitter dots, satin waist bow, long A-line skirt.
  prom: (c) => {
    const a = c.a, b = c.b || light(c.a, 0.5), gl = light(a, 0.7);
    const skirt = P('M100,346 L220,346 L262,490 C200,518 120,518 58,490 Z', a) + SH('M206,346 L220,346 L262,490 C254,496 244,501 234,505 Z', 0.14) + HL('M104,352 L120,352 L84,486 L66,484 Z', 0.22);
    const glitter = [[112, 372], [150, 364], [196, 376], [132, 404], [176, 398], [218, 412], [96, 436], [160, 428], [240, 448], [122, 456], [204, 462], [150, 476], [78, 470], [186, 450], [108, 410], [224, 384]]
      .map(([x, y]) => C(x, y, 2.2, gl, { sw: 0, op: 0.85 })).join('');
    const bodice = P('M104,258 C120,268 150,270 160,258 C170,270 200,268 216,258 L220,350 C200,358 120,358 100,350 Z', a) + SH('M204,262 C210,262 216,260 216,258 L220,350 C216,352 210,354 204,355 Z', 0.12) + HL('M108,262 C114,266 122,268 130,268 L126,330 L108,332 Z', 0.24) +
      [[122, 290], [150, 300], [184, 286], [138, 326], [174, 322], [200, 334]].map(([x, y]) => C(x, y, 2.2, gl, { sw: 0, op: 0.85 })).join('');
    const straps = both(L('M112,262 L124,238', b, 4));
    const waist = R(100, 340, 120, 14, 5, b) + E(146, 347, 12, 8, b) + E(174, 347, 12, 8, b) + C(160, 347, 5, dark(b, 0.2)) + P('M152,354 L146,380 L158,378 Z', b) + P('M168,354 L174,380 L162,378 Z', b);
    const sparks = [[128, 400], [196, 428], [100, 462], [228, 470], [160, 444], [140, 300], [186, 320]].map(([x, y], i) => SPARK(x, y, i % 2 ? 8 : 5)).join('');
    return { front: skirt + glitter + bodice + straps + waist + sparks, hidesFeet: true };
  },
  // Hollywood (girl) — red-carpet mermaid gown: one-shoulder bodice with gold trim, fitted to the knee, flaring train, necklace, sparkles.
  hollywood: (c) => {
    const a = c.a, g = c.b || GOLD;
    const gown = 'M104,250 C120,262 160,262 160,248 L216,240 L222,352 L212,420 C236,450 262,470 272,490 C220,514 100,514 48,490 C58,470 84,450 108,420 L98,352 Z';
    const base = P(gown, a) + SH('M200,241 L216,240 L222,352 L212,420 C236,450 262,470 272,490 C258,497 244,502 230,505 C230,470 214,448 200,420 Z', 0.14) +
      HL('M108,256 C120,262 130,264 140,262 L130,352 L104,352 Z', 0.22) + HL('M98,400 C106,430 92,460 60,486 L76,490 C100,470 114,440 112,410 Z', 0.16);
    const folds = L('M140,424 C150,452 140,480 128,500 M186,424 C180,452 190,480 204,500', dark(a, 0.25), 2.5, { op: 0.6 });
    const trim = L('M104,250 C120,262 160,262 160,248 L216,240', g, 4) + L('M54,489 C102,511 218,511 266,489', g, 3, { op: 0.9 });
    const necklace = L('M132,250 Q160,288 188,250', g, 3) + diamond(160, 288, 7, '#fde68a') + C(160, 288, 2.5, '#fff', { sw: 0, op: 0.8 });
    const sparks = [[120, 300], [200, 330], [150, 380], [96, 470], [236, 466], [176, 440], [128, 350], [210, 400]].map(([x, y], i) => SPARK(x, y, i % 2 ? 9 : 6)).join('');
    return { front: base + folds + trim + necklace + sparks, hidesFeet: true };
  },
  // Uncle Sam — blue tailcoat (a) with gold buttons + tails behind, starred white vest, red bow tie (b), red/white striped pants.
  uncle_sam: (c) => {
    const a = c.a || COLORS.navy[0], red = c.b || COLORS.red[0], w = WHITE;
    const tail = P('M100,340 L82,470 L120,478 L128,350 Z', a) + SH('M112,346 L104,474 L120,478 L128,350 Z', 0.14);
    const stripes = both(L('M121,370 L118,466 M133,370 L132,466 M145,370 L145,466', red, 5));
    // coat panels stop at x=138/182 so a 44px strip of the starred vest stays visible between them
    const vest = P('M132,236 L188,236 L192,364 C180,372 140,372 128,364 Z', w) + [[150, 288], [170, 288], [160, 314], [150, 340], [170, 340]].map(([x, y]) => F(starPath(x, y, 5, 0.5), a)).join('') + [272, 300, 328, 356].map(y => C(160, y, 2.6, '#9ca3af', { sw: 0 })).join('');
    const panel = P('M100,240 C112,233 126,232 138,240 L140,372 C124,384 104,380 94,366 Z', a) + HL('M104,246 C112,240 120,236 128,238 L126,250 C116,254 110,264 108,280 Z', 0.2) + [300, 324, 348].map(y => C(128, y, 3.6, GOLD, { stroke: dark(GOLD, 0.3), sw: 1.5 })).join('');
    const lapel = both(P('M116,244 C122,238 132,235 138,238 L146,300 L134,302 Z', light(a, 0.14)));
    const bow = both(P('M140,242 L157,249 L140,256 Z', red)) + R(155, 243, 10, 12, 3, red) + HL('M141,244 L150,248 L141,250 Z', 0.3);
    const collar = both(P('M142,232 L160,246 L148,255 Z', w, { stroke: dark(w, 0.3), sw: 2.5 }));
    return { back: both(tail), front: pants(w) + stripes + sleevesLong(a, { cuffLine: GOLD }) + vest + panel + MIRROR(panel) + SH('M196,236 L220,240 L226,366 C216,374 206,378 196,380 Z', 0.14) + lapel + collar + bow, showBottom: false };
  },
  // Liberty — verdigris robe (a) with draped folds, wide sleeves, toga drape over the shoulder, sash, torch (b flame) + tablet.
  liberty: (c, ctx) => {
    const a = c.a || '#5fb3a1', g = c.b || GOLD;
    const folds = L('M120,300 C112,360 112,420 118,486 M150,330 C146,390 148,440 150,494 M196,300 C206,360 206,420 200,486 M174,330 C178,390 178,440 176,494', dark(a, 0.2), 2.5, { op: 0.55 });
    const drape = P('M96,240 C120,230 160,232 164,248 C150,290 140,330 150,372 L108,370 C98,330 94,290 96,240 Z', light(a, 0.12)) + SH('M136,262 C128,300 126,340 136,372 L150,372 C140,330 150,290 164,248 Z', 0.12) + HL('M102,246 C112,240 124,238 134,240 L126,290 L104,292 Z', 0.22);
    const sash = R(98, 346, 124, 14, 5, dark(a, 0.15)) + C(160, 353, 6, g, { sw: 1.5 });
    const torch = L('M230,352 L238,302', '#8b5a2b', 7) + P('M226,304 L250,304 L246,290 L230,290 Z', g) + P('M238,290 C228,278 232,262 240,256 C244,266 252,270 250,282 C250,288 244,292 238,290 Z', COLORS.orange[0]) + F('M240,286 C235,280 237,272 241,268 C243,274 247,276 246,282 C246,285 243,287 240,286 Z', COLORS.yellow[0]) + SPARK(252, 262, 5);
    const tablet = R(64, 330, 30, 40, 3, light(a, 0.1)) + L('M72,340 L88,340 M72,348 L88,348 M72,356 L88,356', dark(a, 0.3), 1.6);
    return { front: robe(a) + folds + sleevesWide(a) + drape + sash + torch + tablet + hands(ctx.skin), hidesFeet: true };
  },
  // Rapper — oversized tee (a) with print (c), two gold chains + "$" medallion, bling watch, baggy sagging jeans (b).
  rapper: (c, ctx) => {
    const a = c.a, p = c.b || DENIM, pr = c.c || WHITE;
    const slv = both(P('M104,242 C84,254 72,280 72,312 L112,314 C110,282 114,258 124,246 Z', a) + SH('M118,258 C110,278 108,296 108,314 L112,314 C112,296 114,276 120,260 Z', 0.12) + HL('M100,248 C92,258 86,272 84,290 L92,288 C94,272 98,260 106,250 Z', 0.26) + L('M74,306 L110,308', dark(a, 0.3), 2, { dash: '5 4', op: 0.7 }));
    const chains = L('M120,250 Q160,320 200,250', GOLD, 5) + L('M120,250 Q160,320 200,250', '#fde68a', 1.5, { dash: '3 4' }) + L('M126,250 Q160,298 194,250', GOLD, 4) + C(160, 320, 14, GOLD) + T(160, 327, '$', 20, dark(GOLD, 0.45)) + SPARK(150, 310, 5);
    const print = T(160, 372, 'NYC', 26, pr, { stroke: dark(a), sw: 2 });
    const watch = R(80, 334, 22, 12, 3, GOLD, { sw: 2 }) + R(86, 336, 10, 8, 2, INK, { sw: 0 });
    return { front: jeans(p, ctx.skin, { baggy: true }) + slv + longTorso(a) + print + chains + crewNeck(ctx.skin, a) + watch, showBottom: false };
  },
  // Firefighter — tan turnout coat (a) with reflective bands (b), clasps, radio, name patch; black pants with bands, big boots.
  firefighter: (c) => {
    const a = c.a || '#d9b36a', y = c.b || '#facc15', dk = INK;
    const band = d => L(d, y, 7) + L(d, SILVER, 2.5, { dash: '6 4' });
    const clasps = [272, 332, 360].map(yy => R(148, yy - 6, 24, 12, 3, dk, { stroke: '#111', sw: 2 }) + HL(`M150,${yy - 4} L160,${yy - 4} L160,${yy} L150,${yy} Z`, 0.3)).join('');
    const radio = R(184, 262, 16, 26, 3, dk) + L('M192,262 L192,250', dk, 3) + C(192, 270, 2.5, COLORS.red[0], { sw: 0 });
    const patch = R(110, 262, 28, 14, 2, y, { sw: 2 }) + L('M114,269 L134,269', dk, 3);
    const collar = P('M130,238 C142,228 178,228 190,238 L192,258 C172,252 148,252 128,258 Z', dk) + HL('M134,240 C144,234 156,233 160,233 L160,240 C150,240 142,243 134,248 Z', 0.2);
    return { front: pants(dk) + both(band('M111,418 L157,418')) + boots(INK, { sole: '#111' }) + sleevesLong(a, { cuff: dk }) + both(band('M78,322 L108,324')) + longTorso(a) + band('M102,300 L218,304') + band('M96,380 L224,384') + clasps + radio + patch + collar, showBottom: false, hidesFeet: true };
  },
  // Lifeguard — Malibu beach patrol: white tank (b) with red cross + LIFEGUARD print, red board shorts (a) with a white
  // side stripe, hem band, wave logo + drawstrings, whistle on a lanyard, orange rescue can (c) gripped in the right hand.
  lifeguard: (c, ctx) => {
    const a = c.a, b = c.b || WHITE, fl = c.c || COLORS.orange[0], cord = '#1e293b';
    const shorts = legs(LONG_SHORTS, a, { x: 106, y: 434 }) + both(L('M116,370 L111,430', b, 4) + L('M124,370 L120,430', b, 2) + L('M109,428 L155,428', b, 3) + L('M120,412 Q126,404 132,412 T144,412', b, 2.5, { op: 0.9 })) + L('M160,366 L160,392', dark(a, 0.3), 2.5);
    const tank = P(TANK, b) + SH('M202,248 L222,300 L226,366 C216,374 206,377 196,378 Z', 0.12) + HL('M108,250 C112,242 124,240 132,250 L128,262 C118,268 112,278 108,294 Z', 0.22) +
      L('M136,248 C140,278 180,278 184,248 M110,248 C104,260 101,276 102,300 M210,248 C216,260 219,276 218,300', a, 4);
    const cross = P('M131,272 L139,272 L139,280 L147,280 L147,288 L139,288 L139,296 L131,296 L131,288 L123,288 L123,280 L131,280 Z', a, { sw: 2 });
    const print = T(160, 338, 'LIFEGUARD', 15, a, { stroke: dark(a), sw: 1.2 });
    const whistle = L('M142,246 C148,286 172,286 178,246', cord, 2.5) + L('M160,276 L160,294', cord, 2.5) + R(150, 293, 18, 11, 3, SILVER, { stroke: '#64748b', sw: 1.5 }) + C(168, 300, 6, SILVER, { stroke: '#64748b', sw: 1.5 }) + C(168, 300, 2, '#64748b', { sw: 0 });
    const strings = L('M153,376 L149,394 M167,376 L171,394', b, 2.5) + C(149, 395, 2.5, b, { sw: 0 }) + C(171, 395, 2.5, b, { sw: 0 });
    const can = R(228, 350, 22, 76, 11, fl) + SH('M242,354 L248,354 L248,420 L242,420 Z', 0.14) + HL('M232,356 L238,356 L238,392 L232,392 Z', 0.26) + L('M228,372 L250,372 M228,404 L250,404', '#fff', 2.5, { op: 0.6 }) + L('M239,426 L239,438 C239,444 246,444 246,438', cord, 2.5);
    const hand = MIRROR(C(90, 362, 14, ctx.skin, { stroke: dark(ctx.skin, 0.38) }) + HL('M82,356 C84,352 88,350 92,351 C88,354 85,357 84,361 Z', 0.3));
    return { front: shorts + tank + cross + print + whistle + strings + can + hand, showBottom: false };
  },
};

const N = (en, ar) => ({ en, ar });
export const ITEMS = [
  ...variants('outfit', 'dress', N('Dress', 'فستان'), [
    ['red', { a: COLORS.red[0], b: WHITE }, COLORS.red[1], 'common', { tier: 1 }],
    ['sky', { a: COLORS.sky[0], b: COLORS.navy[0] }, COLORS.sky[1], 'common', { tier: 2 }],
    ['mint', { a: COLORS.mint[0], b: WHITE }, COLORS.mint[1], 'common', { tier: 2 }],
    ['lilac', { a: COLORS.lilac[0], b: COLORS.purple[0] }, COLORS.lilac[1], 'rare', { tier: 3 }],
  ], { gender: 'girl', tier: 1 }),
  ...variants('outfit', 'gown', N('Gown', 'فستان سهرة'), [
    ['rose', { a: COLORS.pink[0], b: WHITE }, N('Rose', 'وردي'), 'legendary', { tier: 8 }],
    ['ice', { a: COLORS.sky[0], b: WHITE }, N('Ice', 'جليدي'), 'legendary', { tier: 10 }],
  ], { gender: 'girl', tier: 8 }),
  single('outfit', 'tuxedo', 'black', { a: INK, b: INK }, N('Tuxedo', 'توكسيدو'), 'epic', { tier: 7 }),
  ...variants('outfit', 'suit', N('Suit', 'بدلة'), [
    ['navy', { a: COLORS.navy[0], b: COLORS.red[0] }, COLORS.navy[1], 'rare', { tier: 4 }],
    ['grey', { a: '#6b7280', b: COLORS.navy[0] }, COLORS.grey[1], 'rare', { tier: 5 }],
  ], { tier: 4 }),
  ...variants('outfit', 'superhero', N('Hero Suit', 'بدلة البطل'), [
    ['blue', { a: COLORS.blue[0], b: COLORS.red[0], c: COLORS.yellow[0] }, COLORS.blue[1], 'epic', { tier: 6 }],
    ['red', { a: COLORS.red[0], b: COLORS.navy[0], c: COLORS.yellow[0] }, COLORS.red[1], 'epic', { tier: 7 }],
  ], { tier: 6 }),
  single('outfit', 'astronaut', 'white', { a: '#f1f5f9', b: '#94a3b8' }, N('Astronaut Suit', 'بدلة رائد فضاء'), 'legendary', { tier: 9 }),
  single('outfit', 'royal', 'purple', { a: '#7e22ce', b: GOLD }, N('Velvet Tux', 'توكسيدو مخملي'), 'legendary', { tier: 10 }),
  ...variants('outfit', 'tracksuit', N('Tracksuit', 'تراك سوت'), [
    ['navy', { a: COLORS.navy[0], b: WHITE }, COLORS.navy[1], 'common', { tier: 2 }],
    ['black', { a: INK, b: COLORS.yellow[0] }, COLORS.black[1], 'rare', { tier: 4 }],
  ], { tier: 2 }),
  ...variants('outfit', 'pajamas', N('Pajamas', 'بيجاما'), [
    ['star', { a: COLORS.sky[0], b: WHITE }, N('Starry', 'نجوم'), 'common', { tier: 1, pattern: 'star' }],
    ['heart', { a: COLORS.pink[0], b: WHITE }, N('Heart', 'قلوب'), 'common', { tier: 2, pattern: 'heart' }],
  ], { tier: 1 }),
  single('outfit', 'chef', 'white', { a: WHITE, b: '#374151' }, N('Chef Whites', 'زي الشيف'), 'rare', { tier: 4 }),
  single('outfit', 'lifeguard', 'malibu', { a: COLORS.red[0], b: WHITE, c: COLORS.orange[0] }, N('Malibu Lifeguard', 'منقذ ماليبو'), 'epic', { tier: 6 }),
  single('outfit', 'ninja', 'black', { a: INK, b: COLORS.red[0] }, N('Stealth Ops Suit', 'بدلة العمليات الخاصة'), 'epic', { tier: 7 }),
  // ---- modern American sets ----
  ...variants('outfit', 'varsity', N('Varsity', 'فارسيتي'), [
    ['brooklyn', { a: COLORS.navy[0], b: COLORS.cream[0], c: COLORS.yellow[0] }, N('Brooklyn', 'بروكلين'), 'rare', { tier: 4 }],
    ['boston', { a: COLORS.maroon[0], b: COLORS.cream[0], c: COLORS.cream[0] }, N('Boston', 'بوسطن'), 'rare', { tier: 5 }],
    ['la', { a: INK, b: COLORS.cream[0], c: GOLD }, N('LA', 'لوس أنجلوس'), 'rare', { tier: 6 }],
    ['chicago', { a: '#15803d', b: WHITE, c: WHITE }, N('Chicago', 'شيكاغو'), 'rare', { tier: 7 }],
  ], { tier: 4 }),
  ...variants('outfit', 'football', N('Football Kit', 'طقم فوتبول'), [
    ['ny', { a: COLORS.blue[0], b: WHITE, c: WHITE }, N('NY', 'نيويورك'), 'rare', { tier: 4, num: '12' }],
    ['dallas', { a: COLORS.navy[0], b: SILVER, c: SILVER }, N('Dallas', 'دالاس'), 'rare', { tier: 5, num: '4' }],
    ['philly', { a: '#15803d', b: WHITE, c: WHITE }, N('Philly', 'فيلي'), 'rare', { tier: 6, num: '1' }],
  ], { tier: 4 }),
  ...variants('outfit', 'basketball', N('Hoops Kit', 'طقم سلة'), [
    ['la', { a: '#6d28d9', b: COLORS.yellow[0] }, N('LA', 'لوس أنجلوس'), 'rare', { tier: 4, num: '23', tag: 'LA' }],
    ['chicago', { a: COLORS.red[0], b: WHITE }, N('Chicago', 'شيكاغو'), 'rare', { tier: 5, num: '33', tag: 'CHI' }],
    ['boston', { a: '#15803d', b: WHITE }, N('Boston', 'بوسطن'), 'rare', { tier: 6, num: '7', tag: 'BOS' }],
  ], { tier: 4 }),
  ...variants('outfit', 'baseball', N('Pinstripes', 'بيسبول'), [
    ['bronx', { a: WHITE, b: COLORS.navy[0] }, N('Bronx', 'برونكس'), 'rare', { tier: 4, num: '2' }],
    ['philly', { a: COLORS.cream[0], b: COLORS.red[0] }, N('Philly', 'فيلي'), 'rare', { tier: 5, num: '7' }],
  ], { tier: 4 }),
  ...variants('outfit', 'cheer', N('Cheer', 'تشير'), [
    ['nyc', { a: COLORS.red[0], b: WHITE }, N('NYC', 'نيويورك'), 'rare', { tier: 3, tag: 'NYC' }],
    ['cali', { a: COLORS.blue[0], b: COLORS.yellow[0] }, N('Cali', 'كاليفورنيا'), 'rare', { tier: 4, tag: 'CAL' }],
    ['miami', { a: COLORS.pink[0], b: WHITE }, N('Miami', 'ميامي'), 'rare', { tier: 5, tag: 'MIA' }],
  ], { gender: 'girl', tier: 3 }),
  ...variants('outfit', 'western', N('Cowboy', 'كاوبوي'), [
    ['texas', { a: '#dc2626', b: '#7f1d1d', c: '#8b5a2b' }, N('Texas', 'تكساس'), 'rare', { tier: 5 }],
    ['nashville', { a: COLORS.blue[0], b: COLORS.navy[0], c: '#c08a4e' }, N('Nashville', 'ناشفيل'), 'rare', { tier: 6 }],
  ], { gender: 'boy', tier: 5 }),
  ...variants('outfit', 'cowgirl', N('Cowgirl', 'كاوغيرل'), [
    ['texas', { a: COLORS.pink[0], b: '#be185d', c: '#c08a4e', d: '#be185d' }, N('Texas', 'تكساس'), 'rare', { tier: 5 }],
    ['nashville', { a: COLORS.sky[0], b: '#1d4ed8', c: '#8b5a2b', d: '#7c4a1e' }, N('Nashville', 'ناشفيل'), 'rare', { tier: 6 }],
  ], { gender: 'girl', tier: 5 }),
  ...variants('outfit', 'streetwear', N('Street Fit', 'ستريت'), [
    ['brooklyn', { a: INK, b: '#a3e635', c: '#6b7280' }, N('Brooklyn', 'بروكلين'), 'common', { tier: 2 }],
    ['harlem', { a: '#6b7280', b: COLORS.orange[0], c: INK }, N('Harlem', 'هارلم'), 'common', { tier: 3 }],
    ['queens', { a: '#7c3aed', b: WHITE, c: COLORS.beige[0] }, N('Queens', 'كوينز'), 'rare', { tier: 4 }],
    ['bronx', { a: COLORS.navy[0], b: COLORS.pink[0], c: COLORS.olive[0] }, N('Bronx', 'برونكس'), 'rare', { tier: 5 }],
  ], { tier: 2 }),
  single('outfit', 'techwear', 'black', { a: INK, b: '#6b7280', c: '#a3e635' }, N('Techwear Shell', 'طقم تك وير'), 'epic', { tier: 7 }),
  single('outfit', 'biker', 'black', { a: INK, b: WHITE }, N('Leather Biker', 'طقم البايكر'), 'epic', { tier: 7 }),
  ...variants('outfit', 'skater', N('Skater', 'سكيتر'), [
    ['venice', { a: COLORS.teal[0], b: WHITE, c: INK }, N('Venice', 'فينيس'), 'common', { tier: 3 }],
    ['brooklyn', { a: COLORS.orange[0], b: WHITE, c: DENIM }, N('Brooklyn', 'بروكلين'), 'common', { tier: 3 }],
  ], { tier: 3 }),
  ...variants('outfit', 'surfer', N('Wetsuit', 'بدلة سيرف'), [
    ['malibu', { a: INK, b: COLORS.teal[0] }, N('Malibu', 'ماليبو'), 'rare', { tier: 4 }],
    ['huntington', { a: COLORS.navy[0], b: COLORS.orange[0] }, N('Huntington', 'هنتنغتون'), 'rare', { tier: 5 }],
  ], { tier: 4 }),
  single('outfit', 'prom', 'violet', { a: '#7c3aed', b: '#f5d0fe' }, N('Prom Night Dress', 'فستان البروم'), 'epic', { gender: 'girl', tier: 7 }),
  single('outfit', 'hollywood', 'red', { a: '#dc2626', b: GOLD }, N('Red Carpet Gown', 'فستان السجادة الحمراء'), 'legendary', { gender: 'girl', tier: 9 }),
  single('outfit', 'uncle_sam', 'classic', { a: COLORS.navy[0], b: COLORS.red[0] }, N('Uncle Sam Suit', 'بدلة العم سام'), 'legendary', { tier: 8 }),
  single('outfit', 'liberty', 'teal', { a: '#5fb3a1', b: GOLD }, N('Lady Liberty Robe', 'رداء تمثال الحرية'), 'legendary', { gender: 'girl', tier: 9 }),
  single('outfit', 'rapper', 'nyc', { a: INK, b: DENIM, c: WHITE }, N('Hip-Hop Icon Fit', 'طقم الهيب هوب'), 'epic', { tier: 6 }),
  single('outfit', 'firefighter', 'tan', { a: '#d9b36a', b: '#facc15' }, N('Firefighter Gear', 'زي الإطفائي'), 'rare', { tier: 4 }),
];
