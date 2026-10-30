// MergeRise art module: bottoms (pants, shorts, skirts, leggings).
// Rig: legs x118..158 / 162..202, y350..468; torso hips span x98..222 at y362. Bottoms are drawn OVER shoes and UNDER tops.
import { P, F, SH, HL, C, E, R, L, MIRROR, SPARK, COLORS, variants, single, dark, light } from './_kit.js';

const N = (en, ar) => ({ en, ar });

// ---- shared geometry --------------------------------------------------------------------------------------------
// Left outer edge: waist (101,350) -> hip (99,366, hugs the torso) -> mid-thigh (112,414). The right side is the mirror.
const OUT_L = 'M101,350 L99,366 C101,390 108,402 112,414';
const OUT_R = 'L208,414 C212,402 219,390 221,366 L219,350 Z';
// Both legs as ONE path. hem = hem y, oh = outer hem x of the left leg. The inner hems meet in a 2px slit (159/161)
// that the 3.5px outline fills, so a dark seam separates the legs and the skin edges (158/162) stay covered.
const pants = (hem, oh) => `${OUT_L} L${oh},${hem} L159,${hem} L160,396 L161,${hem} L${320 - oh},${hem} ${OUT_R}`;
// Skirt: waist 101..219 (torso is 98.8..221.2 at y350, hidden by the waistband), hem 93..227 at y436..448.
const SKIRT = 'M101,350 L93,436 C116,452 204,452 227,436 L219,350 Z';
const hemY = dx => 445 - 12 * (dx / 67) * (dx / 67); // y just above the skirt hem at centre offset dx
// Waistband across the hips, belt loops, belt with buckle.
const band = (col, o) => R(97, 349, 126, 17, 5, col, o);
const loops = (col, xs) => (xs || [112, 160, 208]).map(x => R(x - 3, 347, 6, 21, 2, col, { sw: 2.5 })).join('');
const belt = (col, buckle) => band(col) + R(151, 351, 18, 13, 3, buckle, { sw: 2.5 }) + R(157, 355, 6, 5, 1, col, { sw: 0 });
// Light from the top-left: shade the RIGHT side of each leg and lighten the LEFT side (translated, never mirrored).
const legSH = (top, bottom, op, x) => [0, 50].map(dx => SH(`M${(x || 147) + dx},${top} L${(x || 147) + 8 + dx},${top} L${(x || 147) + 8 + dx},${bottom} L${(x || 147) + dx},${bottom} Z`, op || 0.12)).join('');
const legHL = (top, bottom, op, x) => [0, 50].map(dx => HL(`M${(x || 114) + dx},${top} L${(x || 114) + 7 + dx},${top} L${(x || 114) + 6 + dx},${bottom} L${(x || 114) - 1 + dx},${bottom} Z`, op || 0.22)).join('');
// Same fragment on both legs, translated by the leg pitch (50px) — for lighting-dependent bits that must not mirror.
const twice = s => s + `<g transform="translate(50 0)">${s}</g>`;
const kneeWear = op => twice(HL('M126,412 C134,405 146,407 149,418 C147,429 131,431 126,424 Z', op || 0.12));

export const TEMPLATES = {
  // Starting junk: muddy torn pants, uneven ragged hems, a rope belt, a knee hole showing skin and a patch.
  rags: (c, ctx) => {
    const a = c.a || '#8a6d4e', dk = dark(a, 0.3);
    const d = `${OUT_L} L110,428 L117,440 L124,430 L131,444 L140,434 L148,446 L156,436 L159,442 L160,396 L161,452 L168,462 L176,450 L184,464 L192,452 L200,462 L208,452 L209,440 ${OUT_R}`;
    const hole = P('M128,402 C135,396 146,399 144,409 C142,418 129,417 128,402 Z', ctx.skin, { stroke: dk, sw: 2.5 });
    const patch = R(182, 404, 20, 17, 3, '#6b7280', { stroke: '#374151', sw: 2.5 }) + L('M185,407 L199,407 M185,418 L199,418', '#cbd5e1', 1.5, { dash: '3 3' });
    const rope = L('M98,358 L222,358', '#c9a067', 6) + L('M98,358 L222,358', '#8a6a3c', 1.5, { dash: '5 4' }) + C(160, 358, 6, '#c9a067', { stroke: '#8a6a3c', sw: 2.5 }) + L('M158,363 L154,378 M163,363 L168,376', '#c9a067', 4);
    const dirt = SH('M118,380 C126,376 134,384 128,392 C120,396 114,388 118,380 Z', 0.2) + SH('M188,428 C196,424 202,430 198,438 C192,442 184,436 188,428 Z', 0.2) + SH('M140,420 C146,416 150,422 146,428 C142,430 138,426 140,420 Z', 0.16);
    const fray = L('M117,441 L115,450 M131,445 L133,453 M148,447 L147,455 M176,451 L178,459 M184,465 L183,473 M200,463 L202,471', dk, 2);
    return { front: P(d, a) + legSH(372, 426) + legHL(372, 420) + hole + patch + dirt + fray + rope };
  },

  // Denim: contrast stitching, scoop pockets with rivet, J-stitch fly, outer seam, rolled lighter cuffs.
  jeans: (c) => {
    const a = c.a, st = c.b || '#e9b54a', dk = dark(a, 0.3);
    const pocket = L('M103,394 C116,394 130,386 137,368', dk, 3) + L('M106,398 C119,398 134,389 141,370', st, 1.6, { dash: '4 3' }) + C(141, 373, 2.4, st, { sw: 0 });
    const cuff = R(109, 451, 52, 15, 3, light(a, 0.25), { stroke: dark(a) }) + L('M113,462 L157,462', st, 1.4, { dash: '4 3' });
    const seam = L('M110,420 L109,449', st, 1.4, { dash: '4 3' });
    const side = pocket + seam + cuff;
    const fly = L('M165,368 L165,392 Q165,399 171,399', st, 1.6, { dash: '4 3' });
    return { front: P(pants(466, 111), a) + legSH(372, 450) + legHL(372, 450) + kneeWear() + band(a) + L('M100,362 L220,362', st, 1.4, { dash: '4 3' }) + loops(dk) + fly + side + MIRROR(side) };
  },

  // Shorts: legs end at y420 with a contrast rolled cuff, scoop pockets, waist button.
  shorts: (c) => {
    const a = c.a, b = c.b || light(a, 0.3), dk = dark(a, 0.3);
    const cuff = R(107, 407, 54, 14, 3, b, { stroke: dark(a) }) + L('M111,414 L157,414', dark(a, 0.3), 1.4, { dash: '4 3' });
    const pocket = L('M103,394 C116,394 130,386 137,368', dk, 3) + L('M106,398 C119,398 134,389 141,370', light(a, 0.45), 1.6, { dash: '4 3' });
    const side = pocket + cuff;
    return { front: P(pants(420, 109), a) + legSH(372, 406) + legHL(372, 406) + band(a) + loops(dk) + L('M160,366 L160,392', dk, 2.5) + C(160, 357, 4.5, b, { stroke: dark(a), sw: 2.5 }) + side + MIRROR(side) };
  },

  // Joggers: tapered legs, ribbed elastic cuffs, side stripe, drawstring waist.
  joggers: (c) => {
    const a = c.a, b = c.b || '#f8fafc', dk = dark(a, 0.3), lt = light(a, 0.45);
    const cuff = R(113, 451, 47, 17, 6, dark(a, 0.18), { stroke: dark(a) }) + L('M121,455 L121,464 M128,455 L128,464 M135,455 L135,464 M142,455 L142,464 M149,455 L149,464', dark(a, 0.4), 1.6);
    const stripe = L('M107,382 C110,394 115,406 118,416 L121,454', b, 4.5);
    const pocket = L('M110,378 L124,402', dark(a, 0.35), 2.5) + R(144, 438, 7, 9, 1.5, b, { sw: 0 });
    const side = stripe + pocket + cuff;
    const string = L('M154,366 L150,386 M166,366 L170,386', lt, 2.5) + C(150, 387, 2.4, lt, { sw: 0 }) + C(170, 387, 2.4, lt, { sw: 0 });
    return { front: P(pants(458, 116), a) + legSH(372, 450) + legHL(372, 450) + band(dark(a, 0.12)) + L('M100,356 L220,356 M100,360 L220,360', dk, 1.2, { op: 0.6 }) + string + side + MIRROR(side) };
  },

  // Chinos: slim, front crease, slanted pockets, belt, turn-up hem.
  chinos: (c) => {
    const a = c.a, dk = dark(a, 0.3), beltCol = c.b || '#5b3a1f';
    const crease = L('M135,404 L134,452', dk, 2, { op: 0.7 }) + L('M131,404 L130,452', light(a, 0.5), 1.6, { op: 0.7 });
    const pocket = L('M106,372 L126,398', dk, 3) + L('M109,375 L128,400', light(a, 0.45), 1.4, { dash: '3 3' });
    const cuff = R(110, 452, 50, 14, 3, dark(a, 0.1), { stroke: dark(a) });
    const side = crease + pocket + cuff;
    return { front: P(pants(466, 113), a) + legSH(372, 450) + legHL(372, 450) + belt(beltCol, '#d1a23c') + loops(dk, [112, 208]) + side + MIRROR(side) };
  },

  // Cargo: baggy legs, big flap pockets with a button, stitched hem.
  cargo: (c) => {
    const a = c.a, dk = dark(a, 0.3);
    const pocket = R(113, 408, 33, 28, 4, a, { stroke: dk, sw: 3 }) + SH('M138,412 L144,412 L144,434 L138,434 Z', 0.12) + R(111, 405, 37, 12, 3, dark(a, 0.08), { stroke: dk, sw: 3 }) + C(129.5, 417, 2.6, dk, { sw: 0 }) + L('M118,426 L118,432', light(a, 0.4), 1.5, { dash: '2 2' });
    const hem = L('M111,460 L157,460', dk, 1.6, { dash: '4 3' }) + L('M113,446 L157,445', dk, 1.6, { dash: '4 3' });
    const hip = L('M106,372 L123,394', dk, 3) + L('M109,375 L125,396', light(a, 0.4), 1.4, { dash: '3 3' });
    const side = pocket + hem + hip;
    return { front: P(pants(468, 107), a) + legSH(372, 464) + legHL(372, 464) + band(dark(a, 0.12)) + loops(dk) + L('M160,366 L160,392', dk, 2.5) + side + MIRROR(side) };
  },

  // Pleated skirt (girl): 7 fanned pleats, alternate panels shaded, bow at the waist.
  skirt: (c) => {
    const a = c.a, dk = dark(a, 0.3), lt = light(a, 0.3);
    let pleats = '';
    for (let i = 0; i < 7; i++) {
      const x1 = 100.5 + i * 17, x2 = x1 + 17, h1 = 93.5 + i * 19, h2 = h1 + 19;
      if (i % 2) pleats += SH(`M${x1},366 L${x2},366 L${h2},${hemY(h2 - 160)} L${h1},${hemY(h1 - 160)} Z`, 0.1);
      if (i) pleats += L(`M${x1},366 L${h1},${hemY(h1 - 160)}`, dk, 2.2);
    }
    const bow = E(150, 358, 7, 4.5, lt, { stroke: dk, sw: 2.5 }) + E(170, 358, 7, 4.5, lt, { stroke: dk, sw: 2.5 }) + C(160, 358, 4, lt, { stroke: dk, sw: 2.5 });
    return { front: P(SKIRT, a) + pleats + HL('M103,368 L117,368 L110,420 L96,420 Z', 0.22) + SH('M205,368 L218,368 L225,436 L211,436 Z', 0.12) + band(a) + bow };
  },

  // Plaid skirt (girl): tartan bands both ways with a thin accent thread, hem band, button.
  plaid_skirt: (c) => {
    const a = c.a, b = c.b || '#facc15', dk = dark(a, 0.4);
    const xL = y => 101 - 8 * (y - 350) / 86;
    let pat = '';
    for (const y of [380, 408]) pat += F(`M${xL(y)},${y} L${320 - xL(y)},${y} L${320 - xL(y + 9)},${y + 9} L${xL(y + 9)},${y + 9} Z`, dk, { op: 0.4 }) + L(`M${xL(y + 4.5)},${y + 4.5} L${320 - xL(y + 4.5)},${y + 4.5}`, b, 1.6, { op: 0.85 });
    for (const dx of [-54, -22, 22, 54]) { const x = 160 + dx, f = 1.12; pat += F(`M${x - 4},366 L${x + 4},366 L${160 + (dx + 4) * f},${hemY(dx + 4)} L${160 + (dx - 4) * f},${hemY(dx - 4)} Z`, dk, { op: 0.4 }) + L(`M${x},366 L${160 + dx * f},${hemY(dx)}`, b, 1.6, { op: 0.85 }); }
    const hem = L('M97,433 C118,448 202,448 223,433', dk, 4, { op: 0.5 });
    return { front: P(SKIRT, a) + pat + hem + HL('M103,368 L117,368 L110,420 L96,420 Z', 0.2) + SH('M205,368 L218,368 L225,436 L211,436 Z', 0.12) + band(dark(a, 0.15)) + C(160, 357.5, 4, b, { stroke: dk, sw: 2.5 }) };
  },

  // Leggings (girl): skin-tight, follow the leg rig with a 3px overlap, wide waistband, side seams, knee sheen.
  leggings: (c) => {
    const a = c.a, b = c.b || light(a, 0.45), wb = c.c || b;
    const d = 'M101,350 L99,362 C104,368 112,374 115,388 L115,454 Q115,466 126,466 L159,466 L159,392 L160,386 L161,392 L161,466 L194,466 Q205,466 205,454 L205,388 C208,374 216,368 221,362 L219,350 Z';
    const seam = L('M118,392 L118,458', b, 3.5, { op: 0.8 }) + L('M128,440 L148,440', b, 1.6, { op: 0.45 }) + L('M121,462 L155,462', b, 1.4, { op: 0.45 });
    const waist = R(97, 348, 126, 20, 6, wb, { stroke: dark(wb) }) + L('M100,354 L220,354 M100,362 L220,362', dark(wb, 0.3), 1.2, { op: 0.5 });
    return { front: P(d, a) + legSH(380, 460, 0.12, 148) + legHL(380, 460, 0.2, 118) + waist + seam + MIRROR(seam) + HL('M124,382 L132,382 L130,420 L122,420 Z', 0.18) + HL('M174,382 L182,382 L180,420 L172,420 Z', 0.18) };
  },

  // Dress pants: sharp creases, belt with buckle, clean hem. Legendary gold adds a satin side stripe + sparkles.
  pants_formal: (c, ctx, item) => {
    const a = c.a, buckle = c.b || '#d1a23c', beltCol = c.c || '#2b2b33';
    const gold = !!(item && item.rarity === 'legendary');
    const crease = L('M135,402 L134,462', dark(a, 0.28), 2) + L('M131,402 L130,462', light(a, 0.55), 1.8, { op: 0.75 });
    const hem = L('M113,461 L158,461', dark(a, 0.3), 1.6);
    const side = crease + hem + (gold ? L('M106,392 C109,412 113,436 116,460', '#fff', 2.5, { op: 0.6 }) : '');
    const sparks = gold ? SPARK(120, 384, 6) + SPARK(204, 430, 5) + SPARK(146, 440, 4) + SPARK(174, 380, 4) : '';
    return { front: P(pants(468, 112), a) + legSH(372, 460) + legHL(372, 460) + belt(beltCol, buckle) + loops(dark(a, 0.3), [112, 208]) + side + MIRROR(side) + sparks };
  },
};

export const ITEMS = [
  { id: 'bottom_rags', cat: 'bottom', tpl: 'rags', colors: { a: '#8a6d4e' }, rarity: 'rags', name: N('Torn Rags', 'خرق ممزقة'), gender: 'any', tier: 0 },
  ...variants('bottom', 'jeans', N('Jeans', 'جينز'), [
    ['blue', { a: COLORS.denim[0] }, COLORS.blue[1], 'common'],
    ['light', { a: '#7c9fd4' }, N('Light', 'فاتح'), 'common', { tier: 2 }],
    ['grey', { a: '#6b7280' }, COLORS.grey[1], 'common', { tier: 2 }],
    ['black', { a: COLORS.black[0] }, COLORS.black[1], 'rare', { tier: 3 }],
    ['navy', { a: COLORS.navy[0] }, COLORS.navy[1], 'rare', { tier: 4 }],
  ], { tier: 1 }),
  ...variants('bottom', 'shorts', N('Shorts', 'شورت'), [
    ['khaki', { a: '#d4b483', b: '#e9d7b4' }, N('Khaki', 'كاكي'), 'common'],
    ['navy', { a: COLORS.navy[0], b: '#4b67b8' }, COLORS.navy[1], 'common', { tier: 2 }],
    ['red', { a: COLORS.red[0], b: '#fca5a5' }, COLORS.red[1], 'common', { tier: 3 }],
    ['green', { a: COLORS.green[0], b: '#bbf7d0' }, COLORS.green[1], 'rare', { tier: 3 }],
  ], { tier: 1 }),
  ...variants('bottom', 'joggers', N('Joggers', 'جوقرز'), [
    ['grey', { a: COLORS.grey[0], b: '#f8fafc' }, COLORS.grey[1], 'common'],
    ['black', { a: COLORS.black[0], b: '#f8fafc' }, COLORS.black[1], 'common', { tier: 3 }],
    ['navy', { a: COLORS.navy[0], b: COLORS.red[0] }, COLORS.navy[1], 'rare', { tier: 4 }],
  ], { tier: 2 }),
  ...variants('bottom', 'chinos', N('Chinos', 'تشينو'), [
    ['khaki', { a: '#d2b48c' }, N('Khaki', 'كاكي'), 'common'],
    ['olive', { a: COLORS.olive[0] }, COLORS.olive[1], 'rare', { tier: 3 }],
    ['navy', { a: COLORS.navy[0] }, COLORS.navy[1], 'rare', { tier: 4 }],
  ], { tier: 2 }),
  ...variants('bottom', 'cargo', N('Cargo Pants', 'بنطلون كارجو'), [
    ['olive', { a: COLORS.olive[0] }, COLORS.olive[1], 'rare'],
    ['sand', { a: '#c9b27c' }, N('Sand', 'رملي'), 'rare', { tier: 5 }],
  ], { tier: 4 }),
  ...variants('bottom', 'skirt', N('Pleated Skirt', 'تنورة بليسيه'), [
    ['pink', { a: COLORS.pink[0] }, COLORS.pink[1], 'common'],
    ['red', { a: COLORS.red[0] }, COLORS.red[1], 'common', { tier: 2 }],
    ['navy', { a: COLORS.navy[0] }, COLORS.navy[1], 'common', { tier: 2 }],
    ['purple', { a: COLORS.purple[0] }, COLORS.purple[1], 'rare', { tier: 3 }],
    ['yellow', { a: COLORS.yellow[0] }, COLORS.yellow[1], 'rare', { tier: 4 }],
  ], { tier: 1, gender: 'girl' }),
  ...variants('bottom', 'plaid_skirt', N('Plaid Skirt', 'تنورة مربعات'), [
    ['red', { a: '#dc2626', b: '#facc15' }, COLORS.red[1], 'rare'],
    ['green', { a: '#166534', b: '#fde68a' }, COLORS.green[1], 'epic', { tier: 6 }],
  ], { tier: 4, gender: 'girl' }),
  ...variants('bottom', 'leggings', N('Leggings', 'ليقنز'), [
    ['black', { a: COLORS.black[0], b: '#8b93a3', c: '#4b5563' }, COLORS.black[1], 'common'],
    ['purple', { a: COLORS.purple[0], b: '#e9d5ff', c: '#7e22ce' }, COLORS.purple[1], 'rare', { tier: 3 }],
  ], { tier: 1, gender: 'girl' }),
  single('bottom', 'pants_formal', 'black', { a: COLORS.black[0], b: '#d1a23c', c: '#4a2f1a' }, N('Dress Pants', 'بنطلون رسمي'), 'epic', { tier: 6 }),
  single('bottom', 'pants_formal', 'gold', { a: '#f5b50a', b: '#fff7d6', c: '#2b2b33' }, N('Golden Slacks', 'بنطلون ذهبي'), 'legendary', { tier: 8 }),
];
