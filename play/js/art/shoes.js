// MergeRise art module: shoes. Every template sets hidesFeet:true and draws a full foot that covers the leg
// bottom (leg x118..158, rounded corners from y452, bottom y468). Pants (hem y≈466) are drawn OVER the shoe tops.
import { P, F, SH, HL, C, E, R, L, MIRROR, STAR, SPARK, heartPath, COLORS, variants, single, dark, light } from './_kit.js';

const N = (en, ar) => ({ en, ar });
const both = s => s + MIRROR(s);
const shift = (s, dx) => `<g transform="translate(${dx} 0)">${s}</g>`;

// ---- shared geometry (left foot, centre x≈135) -------------------------------------------------------------------
// Ankle opening x116..160 at y454 (2px over the leg each side); outer side bows out to x107, inner side stays ≤162
// so the mirrored right shoe overlaps by only 4px (158..162), like the rig's own bare feet.
const FOOT = 'M116,454 L160,454 C161.5,456 162,464 162,472 L161,488 C161,498 151,502 135,502 C119,502 108,498 108,488 L107,474 C107,464 110,456 116,454 Z';
const SOLE = 'M108,486 L161,486 L161,490 C161,500 151,503 135,503 C119,503 108,500 108,490 Z';
const SHAFT = top => `M116,${top} L160,${top} L161,462 C162,468 162,478 161,488 C161,498 151,504 135,504 C119,504 107,498 107,488 C106,478 109,468 114,462 Z`;
const BOOT_SOLE = 'M107,490 L161,490 L161,494 C161,502 151,506 135,506 C119,506 107,502 107,494 Z';
const TOE = 'M111,482 C121,475 149,475 158,482';
const collar = (y, col) => R(116, y, 44, 12, 5, col);
// Light from the top-left: highlight on the outer-top-left of the LEFT shoe, shadow down its inner-right; the right
// shoe gets the same two overlays translated (never mirrored) so its lit side is also its left.
const lights = (hlOp, shOp) => {
  const hl = HL('M111,474 C111,464 114,458 120,456 L123,464 C118,466 115,472 115,480 Z', hlOp || 0.3);
  const sh = SH('M152,456 C160,457 162,466 162,474 L161,488 L153,488 L155,470 Z', shOp || 0.12);
  return hl + sh + shift(hl, 47) + shift(sh, 48);
};
const shaftLights = (top) => {
  const s = HL(`M119,${top + 6} L125,${top + 6} L121,484 L113,484 Z`, 0.22) + SH(`M152,${top + 6} L158,${top + 6} L163,488 L156,488 Z`, 0.12);
  return s + shift(s, 46);
};
const LACES = 'M128,464 L148,464 M128,471 L148,471 M128,478 L148,478';

// Low sneaker: dark collar, tongue, three outlined laces, toe seam, side dot, sole with an accent stripe.
function sneakerParts(a, b, sole, lace) {
  const tongue = R(127, 452, 22, 26, 6, light(a, 0.18), { stroke: dark(a, 0.35), sw: 2.5 });
  const laces = L(LACES, dark(a, 0.4), 5) + L(LACES, lace, 2.5);
  return collar(447, dark(a, 0.22)) + P(FOOT, a) + tongue + laces + L(TOE, dark(a, 0.3), 2.5) + C(117, 474, 3.5, b, { stroke: dark(b, 0.3), sw: 2 }) + P(SOLE, sole) + L('M110,491 L159,491', b, 2.5) + L('M111,496 L158,496', dark(sole, 0.25), 1.2, { op: 0.7 });
}

export const TEMPLATES = {
  sneaker: (c) => ({ front: both(sneakerParts(c.a, c.b || '#ef4444', c.c || '#e2e8f0', c.d || '#f8fafc')) + lights(), hidesFeet: true }),

  // High-top: shaft to y438, five lace rows, ankle star patch.
  hightop: (c) => {
    const a = c.a, b = c.b || '#f8fafc', sole = c.c || '#f1f5f9';
    const body = 'M116,438 L160,438 L161,458 C162,462 162,470 162,474 L161,488 C161,498 151,502 135,502 C119,502 108,498 108,488 L107,474 C107,466 110,460 113,458 Z';
    const laceD = [446, 454, 462, 470, 478].map(v => `M129,${v} L147,${v}`).join(' ');
    const parts = R(114, 432, 48, 12, 5, dark(a, 0.22)) + P(body, a) + R(128, 436, 20, 42, 6, light(a, 0.18), { stroke: dark(a, 0.35), sw: 2.5 }) + L(laceD, dark(a, 0.4), 5) + L(laceD, b, 2.5) + STAR(121, 454, 5, b, { sw: 2 }) + L(TOE, dark(a, 0.3), 2.5) + P(SOLE, sole) + L('M110,491 L159,491', b, 2.5);
    return { front: both(parts) + lights(), hidesFeet: true };
  },

  // Boots: shaft to y436 with a dark cuff, ankle strap + buckle on the OUTER side (x110 -> mirrors to the outside of the
  // right boot, so the two buckles never meet at the centre seam), toe seam, chunky dark sole.
  boots: (c) => {
    const a = c.a, strap = c.b || dark(c.a, 0.45), buckle = c.c || '#d1a23c';
    const parts = P(SHAFT(436), a) + R(112, 431, 52, 11, 4, dark(a, 0.25)) + R(109, 466, 54, 9, 3, strap, { sw: 2.5 }) + R(110, 463, 11, 15, 2, buckle, { sw: 2 }) + L('M115.5,466 L115.5,475', dark(buckle, 0.4), 2) + L('M112,484 C122,477 150,477 160,484', dark(a, 0.35), 2.5) + P(BOOT_SOLE, '#3a2a20') + L('M113,490 L159,490', '#8b6b4a', 1.5, { op: 0.6 });
    return { front: both(parts) + shaftLights(436), hidesFeet: true };
  },

  // Sandals: the bare foot (ctx.skin) with three toes, a thick sole, two straps and a buckle.
  sandals: (c, ctx) => {
    const a = c.a, b = c.b || '#fcd34d', sk = ctx.skin, skd = dark(sk, 0.38);
    const foot = E(137, 474, 24, 14, sk, { stroke: skd }) + [[123, 485], [136, 488], [149, 485]].map(([x, y]) => C(x, y, 5, sk, { stroke: skd, sw: 2.5 })).join('');
    const strap = (d) => L(d, dark(a), 8) + L(d, a, 4.5);
    const parts = E(136, 488, 27, 11, a) + foot + SH('M148,466 C156,470 158,480 156,488 L148,488 Z', 0.1) + strap('M114,476 L158,466') + strap('M118,461 L156,461') + C(121, 461, 3.2, b, { sw: 0 }) + HL('M114,472 L121,470 L117,478 Z', 0.35);
    return { front: both(parts), hidesFeet: true };
  },

  // Heels (girl): slim pump, open instep showing skin, ankle strap with a buckle, outer heel block.
  heels: (c, ctx) => {
    const a = c.a, b = c.b || '#fcd34d', sk = ctx.skin;
    const body = 'M121,458 L155,458 C161,459 163,468 162,480 L160,492 C157,500 147,504 137,504 C127,504 117,500 114,492 L112,480 C111,468 114,459 121,458 Z';
    const heel = R(111, 490, 9, 16, 3, dark(a, 0.25), { sw: 2.5 });
    const strap = L('M117,460 L159,460', dark(a), 7) + L('M117,460 L159,460', a, 3.5) + C(121, 460, 3.2, b, { sw: 0 });
    const bow = E(132, 482, 5, 3, b, { stroke: dark(b, 0.3), sw: 1.6 }) + E(144, 482, 5, 3, b, { stroke: dark(b, 0.3), sw: 1.6 }) + C(138, 482, 2.6, b, { stroke: dark(b, 0.3), sw: 1.6 });
    const parts = heel + P(body, a) + E(138, 470, 13, 7.5, sk, { stroke: dark(a, 0.3), sw: 2.5 }) + strap + L('M118,488 C126,481 148,481 156,488', dark(a, 0.25), 2) + bow + SH('M150,462 C160,466 162,480 158,494 L150,494 Z', 0.12) + HL('M116,474 C116,466 118,461 124,460 L126,468 C121,470 119,474 119,480 Z', 0.32);
    return { front: both(parts), hidesFeet: true };
  },

  // Oxfords: sleek body, double toe-cap seam, three short laces, thin sole with a welt line, glossy highlight.
  formal: (c) => {
    const a = c.a, sole = c.b || '#3a2a20';
    const body = 'M118,456 L158,456 C162,457 162,466 162,476 L161,490 C161,498 151,502 135,502 C119,502 108,498 108,490 L107,476 C107,466 111,457 118,456 Z';
    const brogue = [[117, 479], [125, 475.5], [135, 474], [145, 475.5], [153, 479]].map(([x, y]) => C(x, y, 1.5, light(a, 0.5), { sw: 0 })).join('');
    const parts = collar(449, dark(a, 0.25)) + P(body, a) + L('M112,480 C123,473 149,473 159,480', dark(a, 0.45), 2.5) + L('M113,485 C124,478 148,478 158,485', light(a, 0.35), 1.6, { op: 0.6 }) + brogue + L('M130,464 L144,464 M129,470 L145,470 M128,476 L146,476', light(a, 0.5), 2) + P('M108,488 L161,488 L161,491 C161,499 151,503 135,503 C119,503 108,499 108,491 Z', sole) + L('M109,488 L160,488', '#b08968', 1.5, { op: 0.7 }) + HL('M112,470 C113,462 116,458 122,457 L124,464 C119,466 116,470 116,478 Z', 0.4) + SH('M156,458 C162,460 162,470 161,488 L154,488 Z', 0.14);
    return { front: both(parts), hidesFeet: true };
  },

  // Fluffy slippers: open ankle, a row of fluff balls along the opening, a little heart on the toe, soft sole.
  slippers: (c) => {
    const a = c.a, b = c.b || '#ef4444', fl = light(a, 0.35);
    const body = 'M114,462 L162,462 C164,464 164,472 163,480 L162,490 C162,499 151,503 135,503 C119,503 108,499 108,490 L107,480 C107,470 109,463 114,462 Z';
    const fluff = [116, 126, 136, 146, 156].map((x, i) => C(x, i === 0 || i === 4 ? 463 : 460, 6.5, fl, { stroke: dark(a, 0.3), sw: 2.5 })).join('');
    const parts = P(body, a) + P('M108,490 L162,490 L162,492 C162,499 151,503 135,503 C119,503 108,499 108,492 Z', dark(a, 0.2)) + fluff + P(heartPath(136, 484, 6), b, { sw: 2 }) + HL('M112,478 C112,470 114,465 120,464 L122,470 C117,472 115,476 115,482 Z', 0.35) + SH('M154,464 C162,466 163,476 162,490 L154,490 Z', 0.12);
    return { front: both(parts), hidesFeet: true };
  },

  // Rain boots: glossy shaft, contrast rim, pull tab on the OUTER side (x112, mirrors outward), big shine, optional polka dots (item.dots).
  rain_boots: (c, ctx, item) => {
    const a = c.a, b = c.b || '#f8fafc', dots = !!(item && item.dots);
    const dotsSvg = dots ? [[124, 452], [146, 458], [128, 470], [150, 476], [138, 442]].map(([x, y]) => C(x, y, 3.2, b, { sw: 0 })).join('') : '';
    const parts = P(SHAFT(436), a) + R(112, 431, 52, 11, 4, b, { stroke: dark(a, 0.35) }) + R(112, 441, 7, 12, 2, b, { sw: 2 }) + dotsSvg + L('M112,484 C122,477 150,477 160,484', dark(a, 0.3), 2.5) + P(BOOT_SOLE, dark(a, 0.5)) + L('M109,489 L160,489', dark(a, 0.3), 2);
    const gloss = HL('M123,444 L131,444 L127,482 L117,482 Z', 0.4) + SH('M152,444 L158,444 L163,488 L156,488 Z', 0.12);
    return { front: both(parts) + gloss + shift(gloss, 46), hidesFeet: true };
  },

  // Legendary golden sneaker: the sneaker in gold tones plus sparkles.
  gold_sneaker: (c) => ({
    front: both(sneakerParts(c.a || '#f59e0b', c.b || '#fde68a', c.c || '#fef3c7', c.d || '#fff7d6')) + lights(0.4, 0.1) + SPARK(119, 466, 6) + SPARK(151, 488, 5) + SPARK(169, 462, 5) + SPARK(203, 484, 6) + SPARK(136, 496, 3.5),
    hidesFeet: true,
  }),

  // Legendary rocket boots: metal shaft, red rim and side fin, porthole, dark nozzle and little flames underneath.
  rocket_boots: (c) => {
    const a = c.a || '#cbd5e1', b = c.b || '#ef4444';
    const flame = P('M122,500 C118,510 124,518 130,512 C132,520 140,520 142,512 C148,518 154,510 150,500 Z', '#f97316', { stroke: '#c2410c', sw: 2.5 }) + F('M130,500 C127,507 131,512 135,508 C137,514 142,512 141,506 L142,500 Z', '#fde047');
    const parts = flame + P(SHAFT(436), a) + R(112, 431, 52, 11, 4, b, { stroke: dark(b) }) + P('M108,452 L116,452 L116,478 L104,486 Z', b) + C(136, 470, 8, '#7dd3fc', { stroke: '#475569', sw: 3 }) + HL('M131,465 C132,463 135,462 137,463 L133,469 Z', 0.7) + R(110, 492, 52, 12, 4, '#374151', { stroke: '#1f2937' }) + L('M118,498 L154,498', '#9ca3af', 2);
    return { front: both(parts) + shaftLights(436) + SPARK(123, 444, 4) + SPARK(197, 444, 4), hidesFeet: true };
  },

  // ---- v2 additions: modern American street / sport footwear ---------------------------------------------------------
  // Chunky "dad" sneaker: taller upper, wave side panels, mesh toe, thick foam midsole with a heel wedge + dark outsole.
  chunky: (c) => {
    const a = c.a, b = c.b || '#3b82f6', mid = c.c || '#f1f5f9', out = c.d || '#2b2b33';
    const UP = 'M116,450 L160,450 C161.5,452 162,460 162,468 L162,486 L106,486 L106,472 C106,461 109,452 116,450 Z';
    const tongue = R(127, 447, 22, 28, 6, light(a, 0.18), { stroke: dark(a, 0.35), sw: 2.5 });
    const panels = P('M106,470 C112,463 120,477 128,470 L128,486 L106,486 Z', b, { sw: 2.5 }) + P('M148,472 C153,467 158,474 162,470 L162,486 L148,486 Z', b, { sw: 2.5 });
    const mesh = [[132, 482], [138, 480], [144, 482], [135, 487], [141, 487]].map(([x, y]) => C(x, y, 1.3, dark(a, 0.3), { sw: 0 })).join('');
    // two-tone foam: lower layer slightly darker, a wavy seam between them, accent heel wedge, light top rim
    const midsole = P('M103,484 L162,484 L162,498 L102,498 C101,494 101,487 103,484 Z', mid) + F('M103,492 L162,492 L162,498 L102,498 C101.5,496 101.5,494 103,492 Z', dark(mid, 0.1))
      + F('M104,486 L114,486 L112,496 L103,496 Z', b, { op: 0.85 }) + L('M106,491 C120,488 140,494 160,491', dark(mid, 0.3), 1.5, { op: 0.7 }) + L('M106,485.5 L160,485.5', '#fff', 1.2, { op: 0.6 });
    const outsole = P('M102,497 L162,497 L162,502 C162,508 152,510 135,510 C117,510 102,508 102,502 Z', out) + L('M107,504 L157,504', light(out, 0.35), 1.5, { op: 0.6 });
    const parts = collar(443, dark(a, 0.22)) + P(UP, a) + tongue + panels + mesh + L(LACES, dark(a, 0.4), 5) + L(LACES, b, 2.5)
      + L('M108,478 C118,472 150,472 160,478', dark(a, 0.3), 2.5) + L('M110,481.5 C120,475.5 150,475.5 158,481.5', light(a, 0.4), 1.2, { dash: '3 2', op: 0.8 }) + midsole + outsole;
    const ov = HL('M109,470 C109,462 112,456 118,452 L121,460 C116,462 113,468 113,476 Z', 0.3) + SH('M152,452 C160,454 162,462 162,470 L162,486 L154,486 L156,468 Z', 0.12) + SH('M150,485 L162,485 L162,497 L150,497 Z', 0.08);
    return { front: both(parts) + ov + shift(ov, 49), hidesFeet: true };
  },

  // Slides: bare foot with toes on a thick foam sole, one wide padded strap with three stripes.
  slides: (c, ctx) => {
    const a = c.a, b = c.b || '#f8fafc', sk = ctx.skin, skd = dark(sk, 0.38);
    const foot = E(137, 474, 24, 14, sk, { stroke: skd }) + [[123, 485], [136, 488], [149, 485]].map(([x, y]) => C(x, y, 5, sk, { stroke: skd, sw: 2.5 })).join('');
    const sole = P('M110,484 L161,484 C163,488 163,496 161,500 C150,507 120,507 110,500 C106,496 106,488 110,484 Z', a) + L('M112,486.5 L160,486.5', light(a, 0.45), 1.5, { op: 0.7 }) + L('M113,501 L159,501', dark(a, 0.3), 1.5, { op: 0.6 }) + L('M116,504 L122,504 M131,505 L141,505 M150,504 L156,504', dark(a, 0.3), 1.5, { op: 0.6 });
    const strap = P('M113,458 L159,458 C161,458 162,463 162,468 L161,476 L111,476 C109,476 108,470 108,464 C108,460 110,458 113,458 Z', a)
      + L('M122,463 L155,463 M122,467.5 L155,467.5 M122,472 L155,472', b, 2.5) + C(115.5, 467.5, 2.4, b, { sw: 0 }) + L('M111,476 L161,476', dark(a, 0.3), 2);
    const parts = sole + SH('M150,486 L161,486 C162,492 162,496 160,500 L150,500 Z', 0.12) + HL('M110,486 L118,486 L116,499 L111,499 Z', 0.3) + foot + strap
      + HL('M111,461 L122,461 L118,474 L111,474 Z', 0.3) + SH('M152,459 C162,459 162,468 161,476 L152,476 Z', 0.12);
    return { front: both(parts), hidesFeet: true };
  },

  // Cowboy boots: tall shaft with a dipped cuff, pull tabs, double V stitching, pointed toe (outer side), a toe star, a thin
  // leather sole and a STACKED HEEL block under the rear (inner) half so the silhouette steps up at the heel.
  cowboy_boots: (c) => {
    const a = c.a, b = c.b || '#d6a35a', sole = c.c || '#3a2a20';
    const BOOT = 'M114,430 L162,430 L162,462 C163,470 163,480 162,488 C162,498 150,503 134,503 C120,503 108,503 102,498 C96,493 103,485 107,476 C110,468 112,452 114,440 Z';
    const vee = 'M121,444 L138,460 L155,444 M121,454 L138,470 L155,454';
    const stitch = L(vee, b, 2.5) + L(vee, light(b, 0.5), 1, { op: 0.6, dash: '2 2' });
    const cuff = P('M112,425 L164,425 L164,434 L138,440 L112,434 Z', b, { sw: 2.5 }) + HL('M114,427 L132,427 L130,433 L114,433 Z', 0.3) + R(116, 428, 6, 13, 2.5, dark(b, 0.25), { sw: 2 }) + R(154, 428, 6, 13, 2.5, dark(b, 0.25), { sw: 2 });
    const parts = P(BOOT, a) + cuff + stitch + L('M106,490 C118,483 146,483 160,490', b, 2.2) + STAR(116, 494, 4, b, { sw: 1.5 })
      + P('M98,496 L162,496 L162,502 C148,504.5 118,505.5 98,501 Z', sole) + L('M101,499 L160,499', light(sole, 0.4), 1.5, { op: 0.6 })
      + P('M139,500 L157,500 L157,509 C157,513 150,514 143,513 C140,512 139,506 139,500 Z', sole) + L('M141,504.5 L155,504.5 M142,508.5 L155,508.5', light(sole, 0.4), 1.3, { op: 0.7 });
    return { front: both(parts) + shaftLights(430), hidesFeet: true };
  },

  // Basketball high-tops: padded collar, wide ankle strap with a velcro tab, side stripe, contrast toe cap, cushioned sole with an air window.
  basketball_shoes: (c) => {
    const a = c.a, b = c.b || '#f8fafc', acc = c.c || '#2b2b33', sole = c.d || '#f1f5f9';
    const body = 'M114,434 L162,434 L162,458 C162.5,464 162.5,472 162,480 L162,488 C162,498 151,502 135,502 C119,502 107,498 107,488 L106,474 C106,466 109,460 112,458 Z';
    const laceD = [458, 466, 474].map(v => `M129,${v} L147,${v}`).join(' ');
    const toecap = P('M107,480 C118,474 150,474 162,480 L162,488 C162,498 151,502 135,502 C119,502 107,498 107,488 Z', b, { sw: 2.5 }) + [[122, 490], [130, 492], [138, 492], [146, 490]].map(([x, y]) => C(x, y, 1.3, dark(b, 0.3), { sw: 0 })).join('');
    const strap = R(110, 439, 52, 13, 5, acc, { sw: 2.5 }) + R(149, 441, 11, 9, 2, b, { sw: 1.5 }) + L('M122,445.5 L146,445.5', light(acc, 0.45), 1.2, { op: 0.8, dash: '3 2' }) + C(116.5, 445.5, 2.6, b, { sw: 1.5 });
    const parts = R(112, 428, 50, 12, 5, dark(a, 0.22)) + P(body, a) + R(128, 432, 20, 46, 6, light(a, 0.18), { stroke: dark(a, 0.35), sw: 2.5 }) + L(laceD, dark(a, 0.4), 5) + L(laceD, b, 2.5)
      + L('M110,470 C116,476 124,472 128,464', b, 3.5) + toecap + strap
      + P('M105,486 L162,486 L162,492 C162,502 151,506 135,506 C119,506 105,503 105,492 Z', sole) + L('M108,487 L160,487', acc, 2) + R(109, 491, 16, 8, 3, '#7dd3fc', { stroke: '#475569', sw: 1.8 }) + HL('M111,493 L118,493 L114,497 L111,497 Z', 0.7)
      + L('M128,501 L158,501', dark(sole, 0.3), 1.5, { dash: '4 3', op: 0.8 }) + C(154.5, 445.5, 1.8, acc, { sw: 0 });
    return { front: both(parts) + shaftLights(434), hidesFeet: true };
  },

  // Skate shoes: puffy padded collar, fat laces, suede toe cap with an ollie patch, vulcanized sole with a foxing stripe (item.checker = checkerboard sides).
  skate_shoes: (c, ctx, item) => {
    const a = c.a, b = c.b || '#f8fafc', toe = c.c || dark(c.a, 0.25), checker = !!(item && item.checker);
    const checks = checker ? [112, 118, 149, 155].map(x => [464, 470, 476].map(y => (Math.round((x + y) / 6) % 2 === 0 ? F(`M${x},${y} h6 v6 h-6 Z`, '#2b2b33') : '')).join('')).join('') : '';
    const laceD = 'M128,461 L148,461 M128,467.5 L148,467.5 M128,474 L148,474';
    const parts = R(114, 445, 46, 14, 7, dark(a, 0.2)) + HL('M118,447 L136,447 L134,451 L118,451 Z', 0.22) + P(FOOT, a) + checks
      + (checker ? '' : L('M110,474 C116,480 124,476 128,470', b, 3.5))
      + L(laceD, dark(a, 0.4), 6) + L(laceD, b, 3.5) + [461, 467.5, 474].map(y => C(126, y, 1.4, dark(a, 0.5), { sw: 0 }) + C(150, y, 1.4, dark(a, 0.5), { sw: 0 })).join('')
      + P('M107,480 C118,476 150,476 161,480 L161,488 C161,498 151,502 135,502 C119,502 108,498 108,488 Z', toe, { sw: 2.5 })
      + L('M112,485 C122,479 148,479 158,485', light(toe, 0.35), 1.5, { dash: '3 2', op: 0.8 })
      + P(SOLE, '#f8fafc') + L('M110,490 L159,490', '#2b2b33', 1.5) + L('M110,494.5 L159,494.5', '#9ca3af', 1);
    return { front: both(parts) + lights(), hidesFeet: true };
  },

  // Light-up sneakers: upper with neon laces + side dot, a glowing translucent sole (white HL bands + LED dots) and a glow pool beneath.
  light_up: (c) => {
    const a = c.a, glow = c.b || '#22d3ee', b = c.c || '#f8fafc';
    const tongue = R(127, 452, 22, 26, 6, light(a, 0.18), { stroke: dark(a, 0.35), sw: 2.5 });
    const SOLE2 = 'M108,484 L161,484 L161,490 C161,500 151,505 135,505 C119,505 108,500 108,490 Z';
    const pool = F('M104,506 C104,499 118,495 135,495 L185,495 C202,495 216,499 216,506 C216,512 202,514 185,514 L135,514 C118,514 104,512 104,506 Z', glow, { op: 0.28 });
    const leds = [114, 124, 134, 144, 154].map(x => C(x, 497, 1.8, '#fff', { sw: 0, op: 0.9 })).join('');
    const parts = collar(447, dark(a, 0.22)) + P(FOOT, a) + tongue + L(LACES, dark(a, 0.4), 5) + L(LACES, glow, 2.5) + L(TOE, dark(a, 0.3), 2.5)
      + P('M119,459 L112,469 L117,469 L114,478 L122,466 L117,466 Z', glow, { stroke: dark(glow, 0.35), sw: 1.5 })
      + P(SOLE2, glow, { stroke: dark(glow, 0.45) }) + HL('M110,486 L159,486 L159,490 L110,490 Z', 0.55) + HL('M110,491 L158,491 L156,498 L112,498 Z', 0.25) + leds
      + SPARK(104, 486, 5) + SPARK(165, 501, 4);
    return { front: pool + both(parts) + lights(0.3, 0.1), hidesFeet: true };
  },

  // Platform Mary Janes (girl): glossy rounded upper, open instep, buckled strap, and a tall two-layer platform sole.
  platform: (c, ctx) => {
    const a = c.a, b = c.b || '#fcd34d', sole = c.c || '#2b2b33', sk = ctx.skin;
    const upper = 'M118,456 L158,456 C161,457 162,466 162,476 L162,486 L108,486 L107,476 C107,466 112,457 118,456 Z';
    const strap = L('M112,462 L160,462', dark(a), 7) + L('M112,462 L160,462', light(a, 0.15), 3.5) + C(118, 462, 3.2, b, { sw: 0 });
    const plat = P('M105,484 L162,484 L162,503 C150,509 118,509 105,503 C103,499 103,488 105,484 Z', sole) + L('M107,491 L161,491', light(sole, 0.45), 2.5, { op: 0.8 }) + L('M107,498 L161,498', light(sole, 0.45), 1.2, { op: 0.5 })
      + HL('M106,486 L112,486 L111,502 L106,500 Z', 0.25) + SH('M152,486 L162,486 L162,503 L152,505 Z', 0.15);
    const parts = P(upper, a) + E(138, 469, 13, 7, sk, { stroke: dark(a, 0.3), sw: 2.5 }) + strap + L('M112,480 C122,474 148,474 158,480', dark(a, 0.25), 2)
      + HL('M111,474 C111,466 114,460 120,458 L122,466 C117,468 115,472 115,480 Z', 0.35) + SH('M152,459 C162,460 162,470 162,486 L152,486 Z', 0.12) + plat;
    return { front: both(parts), hidesFeet: true };
  },
};

export const ITEMS = [
  ...variants('shoes', 'sneaker', N('Sneakers', 'سنيكرز'), [
    ['white', { a: '#f8fafc', b: '#ef4444', c: '#e2e8f0' }, COLORS.white[1], 'common'],
    ['red', { a: COLORS.red[0], b: '#f8fafc', c: '#f1f5f9' }, COLORS.red[1], 'common', { tier: 2 }],
    ['blue', { a: COLORS.blue[0], b: '#f8fafc', c: '#f1f5f9' }, COLORS.blue[1], 'common', { tier: 2 }],
    ['black', { a: COLORS.black[0], b: '#f8fafc', c: '#f1f5f9' }, COLORS.black[1], 'common', { tier: 3 }],
    ['pink', { a: COLORS.pink[0], b: '#f8fafc', c: '#fdf2f8' }, COLORS.pink[1], 'rare', { tier: 3 }],
    ['green', { a: COLORS.green[0], b: '#facc15', c: '#f1f5f9' }, COLORS.green[1], 'rare', { tier: 3 }],
  ], { tier: 1 }),
  ...variants('shoes', 'hightop', N('High-Tops', 'هاي توب'), [
    ['red', { a: COLORS.red[0], b: '#f8fafc' }, COLORS.red[1], 'common'],
    ['black', { a: COLORS.black[0], b: '#f8fafc' }, COLORS.black[1], 'rare', { tier: 3 }],
    ['white', { a: '#f8fafc', b: '#3b82f6', c: '#e2e8f0' }, COLORS.white[1], 'rare', { tier: 4 }],
  ], { tier: 2 }),
  ...variants('shoes', 'boots', N('Boots', 'بوت'), [
    ['brown', { a: COLORS.brown[0] }, COLORS.brown[1], 'common'],
    ['black', { a: COLORS.black[0], b: '#17171c' }, COLORS.black[1], 'rare', { tier: 3 }],
    ['tan', { a: '#c08a4b' }, N('Tan', 'عسلي'), 'rare', { tier: 5 }],
  ], { tier: 2 }),
  ...variants('shoes', 'sandals', N('Sandals', 'صندل'), [
    ['brown', { a: COLORS.brown[0] }, COLORS.brown[1], 'common'],
    ['blue', { a: COLORS.blue[0] }, COLORS.blue[1], 'common', { tier: 3 }],
  ], { tier: 2 }),
  ...variants('shoes', 'heels', N('Heels', 'كعب عالي'), [
    ['red', { a: COLORS.red[0] }, COLORS.red[1], 'rare'],
    ['black', { a: COLORS.black[0] }, COLORS.black[1], 'rare', { tier: 4 }],
    ['pink', { a: COLORS.pink[0], b: '#fff' }, COLORS.pink[1], 'epic', { tier: 6 }],
  ], { tier: 3, gender: 'girl' }),
  ...variants('shoes', 'formal', N('Oxfords', 'حذاء رسمي'), [
    ['black', { a: COLORS.black[0] }, COLORS.black[1], 'rare'],
    ['brown', { a: '#7a4a1e' }, COLORS.brown[1], 'epic', { tier: 6 }],
  ], { tier: 4 }),
  ...variants('shoes', 'slippers', N('Fluffy Slippers', 'شبشب فرو'), [
    ['pink', { a: COLORS.pink[0], b: '#ef4444' }, COLORS.pink[1], 'common'],
    ['cream', { a: COLORS.cream[0], b: '#f472b6' }, COLORS.cream[1], 'rare', { tier: 3 }],
  ], { tier: 2 }),
  ...variants('shoes', 'rain_boots', N('Rain Boots', 'بوت مطر'), [
    ['yellow', { a: COLORS.yellow[0], b: '#f8fafc' }, COLORS.yellow[1], 'common'],
    ['red', { a: COLORS.red[0], b: '#f8fafc' }, COLORS.red[1], 'rare', { tier: 4, dots: true }],
  ], { tier: 2 }),
  single('shoes', 'gold_sneaker', 'gold', { a: '#f59e0b', b: '#fde68a', c: '#fef3c7', d: '#fff7d6' }, N('Golden Kicks', 'سنيكرز ذهبي'), 'legendary', { tier: 6 }),
  single('shoes', 'rocket_boots', 'fire', { a: '#cbd5e1', b: '#ef4444' }, N('Rocket Boots', 'بوت صاروخي'), 'legendary', { tier: 8 }),
  // ---- v2 additions ---------------------------------------------------------------------------------------------------
  ...variants('shoes', 'chunky', N('Chunky Kicks', 'سنيكرز ضخم'), [
    ['white', { a: '#f8fafc', b: '#3b82f6', c: '#f1f5f9', d: '#2b2b33' }, COLORS.white[1], 'common'],
    ['grey', { a: '#9ca3af', b: '#f97316', c: '#f1f5f9', d: '#2b2b33' }, COLORS.grey[1], 'common', { tier: 3 }],
    ['black', { a: '#2b2b33', b: '#22d3ee', c: '#f1f5f9', d: '#17171c' }, COLORS.black[1], 'rare', { tier: 4 }],
    ['neon', { a: '#f8fafc', b: '#bef264', c: '#f472b6', d: '#2b2b33' }, N('Neon', 'نيون'), 'rare', { tier: 5 }],
  ], { tier: 2 }),
  ...variants('shoes', 'slides', N('Slides', 'سلايدز'), [
    ['black', { a: '#2b2b33', b: '#f8fafc' }, COLORS.black[1], 'common'],
    ['pink', { a: COLORS.pink[0], b: '#f8fafc' }, COLORS.pink[1], 'rare', { tier: 3 }],
  ], { tier: 2 }),
  ...variants('shoes', 'cowboy_boots', N('Cowboy Boots', 'بوت كاوبوي'), [
    ['brown', { a: '#92400e', b: '#d6a35a' }, COLORS.brown[1], 'rare'],
    ['black', { a: '#2b2b33', b: '#cbd5e1', c: '#17171c' }, COLORS.black[1], 'epic', { tier: 6 }],
  ], { tier: 4 }),
  ...variants('shoes', 'basketball_shoes', N('Hoop Hightops', 'حذاء سلة'), [
    ['red', { a: COLORS.red[0], b: '#f8fafc', c: '#2b2b33' }, COLORS.red[1], 'rare'],
    ['black', { a: '#2b2b33', b: '#f8fafc', c: '#ef4444' }, COLORS.black[1], 'rare', { tier: 4 }],
    ['purple', { a: '#7c3aed', b: '#facc15', c: '#2b2b33' }, COLORS.purple[1], 'epic', { tier: 6 }],
  ], { tier: 3 }),
  ...variants('shoes', 'skate_shoes', N('Skate Shoes', 'حذاء سكيت'), [
    ['black', { a: '#2b2b33', b: '#f8fafc', c: '#3f3f46' }, COLORS.black[1], 'common'],
    ['checker', { a: '#f8fafc', b: '#f8fafc', c: '#2b2b33' }, N('Checker', 'شطرنج'), 'rare', { tier: 4, checker: true }],
  ], { tier: 2 }),
  ...variants('shoes', 'light_up', N('Glow Kicks', 'سنيكرز مضيء'), [
    ['cyan', { a: '#2b2b33', b: '#22d3ee', c: '#f8fafc' }, N('Cyan', 'سماوي'), 'epic'],
    ['pink', { a: '#f8fafc', b: '#f472b6', c: '#2b2b33' }, COLORS.pink[1], 'epic', { tier: 7 }],
  ], { tier: 6 }),
  ...variants('shoes', 'platform', N('Platform Janes', 'حذاء بلاتفورم'), [
    ['black', { a: '#2b2b33', b: '#f59e0b' }, COLORS.black[1], 'rare'],
    ['pink', { a: COLORS.pink[0], b: '#f8fafc', c: '#4c1d95' }, COLORS.pink[1], 'epic', { tier: 6 }],
  ], { tier: 4, gender: 'girl' }),
];
