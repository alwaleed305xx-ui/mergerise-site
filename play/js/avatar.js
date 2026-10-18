// Character rig + face + layer composition. Every clothing template draws in this 320x520 space.
import { P, SH, HL, C, E, R, L, F, MIRROR, SPARK, starPath, SKIN, dark, light } from './art/_kit.js';
// The wardrobe registry installs itself here (keeps this module usable in isolation, e.g. gallery.html?mod=).
let resolver = () => null;
export function setResolver(fn) { resolver = fn; }

export const RIG = {
  W: 320, H: 520,
  HEAD: 'M82,128 C82,62 112,38 160,38 C208,38 238,62 238,128 C238,182 210,224 160,224 C110,224 82,182 82,128 Z',
  TORSO: 'M106,240 C124,230 196,230 214,240 L222,362 C200,374 120,374 98,362 Z',
  ARM_L: 'M106,242 C84,258 76,300 78,350 L104,352 C104,306 110,270 122,250 Z',
  HAND_L: [90, 360, 14],
  LEG_L: [118, 350, 40, 118, 16],
  FOOT_L: [138, 474, 25, 14],
  NECK: [146, 212, 28, 34, 9],
  EAR_L: [84, 146, 13],
  EYE_L: [130, 152], EYE_R: [190, 152],
};

function body(skin) {
  const sk = { stroke: dark(skin, 0.38) };
  const [hx, hy, hr] = RIG.HAND_L;
  const [lx, ly, lw, lh, lr] = RIG.LEG_L;
  const [fx, fy, frx, fry] = RIG.FOOT_L;
  const [nx, ny, nw, nh, nr] = RIG.NECK;
  const [ex, ey, er] = RIG.EAR_L;
  const legs = R(lx, ly, lw, lh, lr, skin, sk) + MIRROR(R(lx, ly, lw, lh, lr, skin, sk)) + SH(`M${lx + 2},${ly + 20} L${lx + 2},${ly + lh - 10} L${lx + 12},${ly + lh - 10} L${lx + 12},${ly + 20} Z`, 0.08);
  const feet = E(fx, fy, frx, fry, skin, sk) + MIRROR(E(fx, fy, frx, fry, skin, sk));
  const arms = P(RIG.ARM_L, skin, sk) + MIRROR(P(RIG.ARM_L, skin, sk)) + C(hx, hy, hr, skin, sk) + MIRROR(C(hx, hy, hr, skin, sk));
  const neck = R(nx, ny, nw, nh, nr, skin, sk) + SH(`M${nx},${ny + 2} L${nx + nw},${ny + 2} L${nx + nw},${ny + 18} L${nx},${ny + 18} Z`, 0.12);
  const torso = P(RIG.TORSO, skin, sk);
  const ears = C(ex, ey, er, skin, sk) + MIRROR(C(ex, ey, er, skin, sk)) + C(ex, ey, 5, dark(skin, 0.18), { sw: 0 }) + MIRROR(C(ex, ey, 5, dark(skin, 0.18), { sw: 0 }));
  const head = P(RIG.HEAD, skin, sk) + SH('M200,70 C236,100 236,170 196,214 C222,180 226,110 200,70 Z', 0.08) + HL('M104,86 C112,66 132,54 150,52 C132,64 118,76 104,86 Z', 0.35);
  return { feet, legs, lower: feet + legs, upper: arms + neck + torso, head: ears + head };
}

// mood: 0 sad, 1 neutral, 2 happy, 3 star, 4 surprised (round mouth, brows raised ~8 px — merge-5),
// 5 determined (flat brows, straight mouth — charges <= 2). Moods 0–3 draw exactly as before (F6e).
function face(gender, skin, mood, dirty) {
  const [lx, ly] = RIG.EYE_L;
  const iris = '#3b2a20', line = dark(skin, 0.55);
  const eye = (x) => {
    const star = mood === 3;
    return `<g class="eye">${E(x, ly, 13, 16, '#fff', { stroke: line, sw: 3 })}${C(x, ly + 2, 8.5, iris, { sw: 0 })}${C(x, ly + 2, 4.2, '#120c08', { sw: 0 })}` +
      (star ? F(starPath(x - 1, ly - 1, 7, 0.5), '#fff', { op: 0.95 }) : `${C(x - 3.5, ly - 3.5, 3.2, '#fff', { sw: 0 })}${C(x + 3, ly + 5, 1.6, '#fff', { sw: 0 })}`) + '</g>';
  };
  const lashes = gender === 'girl' ? L(`M${lx - 12},${ly - 11} L${lx - 17},${ly - 16} M${lx - 6},${ly - 15} L${lx - 8},${ly - 21} M${lx + 2},${ly - 15} L${lx + 3},${ly - 21}`, line, 3) : '';
  const browW = gender === 'girl' ? 3.5 : 5.5;
  const brow = mood === 0 ? `M${lx - 16},${ly - 26} Q${lx - 2},${ly - 36} ${lx + 14},${ly - 30}` : mood === 1 ? `M${lx - 16},${ly - 30} Q${lx},${ly - 34} ${lx + 16},${ly - 30}`
    : mood === 4 ? `M${lx - 16},${ly - 38} Q${lx},${ly - 48} ${lx + 16},${ly - 40}`      // surprised: the happy brow lifted 8 px
    : mood === 5 ? `M${lx - 16},${ly - 32} L${lx + 16},${ly - 28}`                        // determined: flat, inner end a touch lower
    : `M${lx - 16},${ly - 30} Q${lx},${ly - 40} ${lx + 16},${ly - 32}`;
  const browsAll = L(brow, line, browW) + MIRROR(L(brow, line, browW));
  const nose = L('M156,170 Q160,175 164,170', line, 2.5, { op: 0.6 });
  let mouth;
  if (mood === 0) mouth = L('M146,196 Q160,184 174,196', line, 3.5);
  else if (mood === 1) mouth = L('M148,190 Q160,196 172,190', line, 3.5);
  else if (mood === 2) mouth = P('M142,184 Q160,206 178,184 Q160,192 142,184 Z', '#7f1d1d', { stroke: line, sw: 3 });
  else if (mood === 4) mouth = E(160, 195, 8, 10, '#7f1d1d', { stroke: line, sw: 3 }) + E(160, 199, 4.5, 4, '#f87171', { sw: 0, op: 0.9 });   // round "O"
  else if (mood === 5) mouth = L('M147,192 L173,192', line, 3.5);                                                                          // straight line
  else mouth = P('M138,182 Q160,218 182,182 Q160,194 138,182 Z', '#7f1d1d', { stroke: line, sw: 3 }) + F('M150,196 Q160,206 170,196 Q160,200 150,196 Z', '#f87171');
  const blushOp = mood === 2 || mood === 3 || mood === 4 ? 0.45 : 0.25;
  const blush = E(114, 174, 12, 7, '#f87171', { sw: 0, op: blushOp }) + MIRROR(E(114, 174, 12, 7, '#f87171', { sw: 0, op: blushOp }));
  const lips = gender === 'girl' && mood <= 1 ? L(mood === 0 ? 'M146,196 Q160,184 174,196' : 'M148,190 Q160,196 172,190', '#e11d48', 5, { op: 0.35 }) : '';
  const dirt = dirty ? F('M98,186 C104,180 112,184 110,190 C108,196 100,194 98,186 Z', '#5b4636', { op: 0.35 }) + F('M214,110 C220,104 230,108 228,116 C224,122 214,118 214,110 Z', '#5b4636', { op: 0.3 }) + F('M186,208 C192,204 198,208 196,214 C192,218 186,214 186,208 Z', '#5b4636', { op: 0.3 }) : '';
  return `<g class="face">${blush}${eye(lx)}${MIRROR(eye(lx))}${lashes}${MIRROR(lashes)}${browsAll}${nose}${lips}${mouth}${dirt}</g>`;
}

const LAYERS = ['bg', 'acc', 'hat', 'hair', 'outfit', 'top', 'bottom', 'shoes', 'glasses'];

// state: { gender, skin (index), equipped {cat:id}, mood 0..3 }
// opts: { bg: false (scene drawn elsewhere), anim: true }
export function renderAvatar(state, opts = {}) {
  const gender = state.gender || 'boy';
  const skin = SKIN[state.skin ?? 1] || SKIN[1];
  const eq = state.equipped || {};
  const ctx = { gender, skin };
  const parts = {};
  for (const cat of LAYERS) {
    const id = eq[cat];
    if (!id) continue;
    const r = (opts.resolve || resolver)(id);
    const item = r && r.item, tpl = r && r.tpl;
    if (!tpl) continue;
    try { parts[cat] = tpl(item.colors || {}, ctx, item) || {}; } catch (e) { console.warn('template failed', id, e); }
  }
  const outfit = parts.outfit;
  const top = outfit ? null : parts.top;
  const bottom = outfit && !outfit.showBottom ? null : parts.bottom;
  const dirty = (eq.top === 'top_rags' || eq.bottom === 'bottom_rags') && !outfit;
  const b = body(skin);
  const hideFeet = !!(parts.shoes || outfit?.hidesFeet || bottom?.hidesFeet);
  const hideHairBack = !!(parts.hat?.hidesHair);
  const hideHairFront = !!(parts.hat?.hidesHairFront ?? parts.hat?.hidesHair);
  const mood = state.mood ?? 1;
  const g = (k, s) => (s ? `<g class="L-${k}">${s}</g>` : '');
  const svg = [
    g('acc-back', parts.acc?.back),
    g('hat-back', parts.hat?.back),
    hideHairBack ? '' : g('hair-back', parts.hair?.back),
    g('outfit-back', outfit?.back), g('top-back', top?.back),
    `<g class="L-body">${hideFeet ? b.legs : b.lower}${b.upper}</g>`,
    g('shoes', parts.shoes?.front),
    g('bottom', bottom?.front),
    g('top', top?.front), g('outfit', outfit?.front),
    g('acc', parts.acc?.front),
    `<g class="L-head">${b.head}</g>`,
    face(gender, skin, mood, dirty),
    hideHairFront ? '' : g('hair', parts.hair?.front),
    g('glasses', parts.glasses?.front),
    g('hat', parts.hat?.front),
    g('acc-top', parts.acc?.top),
  ].join('');
  const cls = `avatar${opts.anim === false ? '' : ' anim'}${opts.cls ? ' ' + opts.cls : ''}`;
  return `<svg class="${cls}" viewBox="0 0 320 520" xmlns="http://www.w3.org/2000/svg" overflow="visible"><g class="rig">${svg}</g></svg>`;
}

// Mood from progress: rags → sad, few items → neutral, decent → happy, strong style → star.
export function moodFor(styleScore, wearingRags) {
  if (wearingRags) return 0;
  if (styleScore < 150) return 1;
  if (styleScore < 700) return 2;
  return 3;
}
