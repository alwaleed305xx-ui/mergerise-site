// MergeRise — tops: tees, tanks, polos, shirts, hoodies, sweaters, bombers, jerseys, blazers (+ the starting rags)
// + modern American streetwear: flannels, letterman jackets, the USA flag tee, crop tops, oversized hoodies,
//   denim truckers, puffers, colour-block windbreakers, raglan baseball tees, aloha shirts and turtlenecks.
// Flat sticker style on the shared rig (see STYLE.md): sleeves first, the body over them, details last.
// Only the viewer's left side is authored; the right side is MIRROR()ed. ES2017 syntax only (no nullish/optional operators).
import { P, SH, HL, C, E, R, L, T, MIRROR, STAR, SPARK, heartPath, COLORS, variants, single, dark, light } from './_kit.js';

// ---------- shared geometry (viewer's left, x < 160) ----------
const BODY = 'M100,240 C120,229 200,229 220,240 L226,366 C200,380 120,380 94,366 Z';
const BODY_SH = 'M198,236 L220,240 L226,366 C216,374 206,377 196,378 Z';
const BODY_HL = 'M104,246 C114,238 130,233 146,233 L140,248 C124,254 112,266 106,284 Z';
const SLV_S = 'M102,240 C84,252 76,270 76,300 L112,304 C110,278 114,258 122,246 Z';
const SLV_L = 'M102,240 C82,256 72,300 74,352 L108,354 C106,306 112,268 122,248 Z';
const SLV_S_HL = 'M100,244 C92,250 86,258 84,270 L92,272 C94,262 98,254 106,246 Z';
const SLV_L_HL = 'M100,244 C90,254 84,270 82,292 L90,294 C92,272 98,256 106,246 Z';
const SLV_S_SH = 'M80,286 L112,290 L112,304 L76,300 Z';
const SLV_L_SH = 'M76,324 L108,326 L108,354 L74,352 Z';
const CUFF_S = 'M76,290 L113,294 L113,305 L75,301 Z';
const CUFF_L = 'M73,338 L109,340 L109,355 L73,353 Z';
const HEM = 'M95,352 L225,352 L226,366 C200,380 120,380 94,366 Z';
const NECK = 'M138,236 C143,258 177,258 182,236 C176,229 144,229 138,236 Z';
const V_NECK = 'M142,236 L160,268 L178,236 C172,231 148,231 142,236 Z';
const TANK = 'M106,244 C110,228 130,228 134,246 C138,274 182,274 186,246 C190,228 210,228 214,244 C220,258 224,276 222,300 L226,366 C200,380 120,380 94,366 L98,300 C96,276 100,258 106,244 Z';
// side edges of BODY at a given y (left / right) and the y of its curved bottom at a given x — for patterns that must stay inside
const edgeL = y => 100 - 6 * (y - 240) / 126;
const edgeR = y => 320 - edgeL(y);
function hemY(x) {
  let best = 366, bd = 1e9;
  for (let t = 0; t <= 1.0001; t += 0.02) {
    const u = 1 - t, px = u * u * u * 226 + 3 * u * u * t * 200 + 3 * u * t * t * 120 + t * t * t * 94, py = u * u * u * 366 + 3 * u * u * t * 380 + 3 * u * t * t * 380 + t * t * t * 366;
    const e = Math.abs(px - x);
    if (e < bd) { bd = e; best = py; }
  }
  return Math.round(best);
}

// vertical rib ticks from x0..x1 (step) between y0 and y1
function ribs(x0, x1, y0, y1, step, col) {
  let d = '';
  for (let x = x0; x <= x1; x += step) d += `M${x},${y0} L${x},${y1} `;
  return L(d.trim(), col, 2, { op: 0.55 });
}
// both sleeves (short/long), optional cuff band (+ rib ticks). Left sleeve gets the highlight, right one the shadow.
function sleeves(a, long, cuff, rib) {
  let s = P(long ? SLV_L : SLV_S, a);
  if (cuff) {
    s += P(long ? CUFF_L : CUFF_S, cuff);
    if (rib) s += ribs(80, 104, long ? 342 : 293, long ? 351 : 300, 8, dark(cuff, 0.45));
  }
  return s + HL(long ? SLV_L_HL : SLV_S_HL) + MIRROR(s + SH(long ? SLV_L_SH : SLV_S_SH));
}
// body base; `inner` is drawn between the base and the shadow/highlight so patterns get shaded too
const body = (a, inner) => P(BODY, a) + (inner || '') + SH(BODY_SH) + HL(BODY_HL);
const stitch = a => L('M102,364 C122,375 198,375 218,364', dark(a, 0.3), 2, { dash: '5 4', op: 0.7 });
// sleeve-hem stitches for short sleeves (both sides)
const slvStitch = a => { const s = L('M81,295 L104,298', dark(a, 0.3), 2, { dash: '5 4', op: 0.7 }); return s + MIRROR(s); };
// crew neck: ribbed band + skin-filled opening (so the chest shows through the neckline)
const crew = (a, skin, band) => L('M137,239 C143,262 177,262 183,239', band || dark(a, 0.2), 6) + P(NECK, skin, { stroke: dark(a) });
// collar with two flaps over a V opening (polo / shirt). tip = optional contrast tipping colour.
function collar(a, skin, pointy, tip) {
  const d = pointy ? 'M140,230 C130,242 132,256 148,268 L163,263 C160,248 152,236 146,230 Z' : 'M140,232 C130,244 132,258 146,270 L162,266 C160,250 152,238 144,232 Z';
  const flap = P(d, a) + HL('M141,236 C136,244 136,252 142,260 L146,258 C142,250 142,242 146,236 Z', 0.3) +
    (tip ? L(pointy ? 'M134,254 C137,260 141,265 148,268' : 'M134,256 C136,262 140,267 146,270', tip, 3) : '');
  return P(V_NECK, skin, { stroke: dark(a) }) + flap + MIRROR(flap);
}
// chest prints for tee_logo
function logo(kind, b) {
  const d = dark(b);
  if (kind === 'heart') return P(heartPath(160, 300, 20), b);
  if (kind === 'bolt') return P('M168,270 L144,306 L158,306 L150,332 L178,294 L164,294 Z', b);
  if (kind === 'smiley') { const f = dark(b, 0.78); return C(160, 300, 22, b) + C(152, 295, 3.6, f, { sw: 0 }) + C(168, 295, 3.6, f, { sw: 0 }) + L('M149,306 Q160,318 171,306', f, 3.5) + HL('M144,288 C148,280 158,276 166,278 L160,290 C152,290 148,292 144,296 Z', 0.3); }
  if (kind === 'gem') return P('M160,274 L184,298 L160,328 L136,298 Z', b) + L('M144,298 L176,298 M160,274 L160,328', d, 2, { op: 0.5 });
  if (kind === 'rise') return T(160, 314, 'RISE', 30, b, { stroke: d, sw: 2.5 });
  return STAR(160, 300, 24, b);
}
// metal zipper: tape in `tape`, teeth, a pull tab at the top
const zipper = (x0, y0, y1, tape) => P(`M${x0 - 5},${y0} L${x0 + 5},${y0} L${x0 + 6},${y1} L${x0 - 6},${y1} Z`, tape, { sw: 2 }) +
  L(`M${x0},${y0 + 4} L${x0},${y1 - 4}`, '#e5e7eb', 2.5, { dash: '3 3' }) + R(x0 - 4, y0 + 2, 8, 12, 2, '#cbd5e1', { stroke: '#64748b', sw: 1.5 });
// zipped stand collar (puffer / windbreaker)
const standCollar = (col, stroke) => P('M126,246 C132,228 188,228 194,246 L190,264 C176,256 144,256 130,264 Z', col, stroke ? { stroke } : {}) +
  HL('M130,246 C134,236 144,232 156,232 L154,240 C144,240 136,244 134,252 Z', 0.3) + SH('M164,232 C176,232 186,236 190,246 L190,264 C184,260 176,257 168,256 Z', 0.12);

export const TEMPLATES = {
  // starting junk: dull, torn hems, mismatched ripped sleeves, two patches, holes and grime
  rags: (c, ctx) => {
    const a = c.a, d = dark(a), sk = ctx.skin;
    const slvL = P('M102,240 C84,252 76,270 76,292 L84,284 L90,298 L98,288 L104,300 L112,296 C110,278 114,258 122,246 Z', a) + HL(SLV_S_HL, 0.18);
    const slvR = P('M218,240 C236,252 244,268 244,278 L236,272 L230,286 L222,278 L214,288 L208,282 C210,268 206,258 198,246 Z', a) + SH('M236,262 L244,268 L244,278 L236,272 Z', 0.16);
    const bod = P('M100,240 C120,229 200,229 220,240 L226,350 L218,362 L212,350 L204,370 L194,356 L182,374 L170,360 L158,376 L146,362 L134,374 L124,360 L112,372 L104,358 L96,364 Z', a);
    const patches = R(174, 296, 26, 24, 3, '#a16207', { stroke: '#713f12', sw: 2.5 }) + L('M177,300 L197,300 M177,316 L197,316', '#fde68a', 2, { dash: '3 3' }) +
      R(112, 320, 22, 20, 3, '#64748b', { stroke: '#334155', sw: 2.5 }) + L('M115,324 L131,324 M115,336 L131,336', '#cbd5e1', 2, { dash: '3 3' });
    const holes = E(140, 288, 7, 5, sk, { stroke: d, sw: 2.5 }) + E(198, 342, 6, 4, sk, { stroke: d, sw: 2.5 }) + L('M118,276 L126,290 M204,318 L210,330', d, 2.5);
    const grime = SH('M118,346 C128,338 142,344 136,354 C128,360 114,356 118,346 Z', 0.22) + SH('M196,252 C204,248 212,254 208,262 C202,266 194,260 196,252 Z', 0.18);
    const neck = P('M140,234 L150,254 L160,246 L170,258 L180,234 C172,229 148,229 140,234 Z', sk, { stroke: d });
    return { front: slvL + slvR + bod + SH(BODY_SH, 0.12) + HL(BODY_HL, 0.16) + patches + holes + grime + neck };
  },
  // plain crew tee
  tshirt: (c, ctx) => ({ front: sleeves(c.a) + slvStitch(c.a) + body(c.a) + stitch(c.a) + crew(c.a, ctx.skin) }),
  // crew tee with a printed logo (item.logo: star | heart | bolt | smiley | gem | rise) in c.b
  tee_logo: (c, ctx, item) => ({ front: sleeves(c.a) + slvStitch(c.a) + body(c.a) + logo(item.logo, c.b || '#f8fafc') + stitch(c.a) + crew(c.a, ctx.skin) }),
  // tank top: straps over the shoulders, scoop neck, deep armholes, contrast binding
  tank: (c) => {
    const a = c.a, bind = dark(a, 0.22);
    return { front: P(TANK, a) + SH('M202,248 L222,300 L226,366 C216,374 206,377 196,378 Z') + HL('M108,250 C111,244 118,242 124,246 L120,254 C114,258 110,268 108,280 Z', 0.2) +
      L('M136,248 C140,278 180,278 184,248 M110,248 C104,260 101,276 102,300 M210,248 C216,260 219,276 218,300', bind, 5) + stitch(a) };
  },
  // polo: flap collar with tipping, 2-button placket, banded sleeves
  polo: (c, ctx) => {
    const a = c.a, b = c.b || light(a, 0.5), btn = light(a, 0.6);
    const tip = L('M80,292 L110,295', b, 2.5);
    return { front: sleeves(a, false, dark(a, 0.12)) + tip + MIRROR(tip) + body(a) + P('M151,262 L169,262 L169,306 L151,306 Z', a) +
      C(160, 280, 3.5, btn, { sw: 2 }) + C(160, 294, 3.5, btn, { sw: 2 }) + stitch(a) + collar(a, ctx.skin, false, b) };
  },
  // button-up shirt: pointed collar, placket with 4 buttons, chest pocket, cuffed long sleeves
  shirt: (c, ctx) => {
    const a = c.a, d = dark(a, 0.3), btn = light(a, 0.6);
    const bt = [276, 300, 324, 348].map(y => C(160, y, 3.5, btn, { sw: 2 })).join('');
    const pocket = R(112, 284, 30, 30, 3, a, { stroke: d, sw: 2.5 }) + L('M112,294 L142,294', d, 2.5) + C(127, 289, 2.5, btn, { sw: 1.5 });
    const cb = C(100, 347, 3, btn, { sw: 1.5 });
    return { front: sleeves(a, true, a) + cb + MIRROR(cb) + body(a) + L('M151,262 L149,372 M169,262 L171,372', d, 2.5) + bt + pocket + collar(a, ctx.skin, true) };
  },
  // hoodie: hood behind the neck (back layer), thick front drape, drawstrings, kangaroo pocket, ribbed cuffs + hem
  hoodie: (c, ctx, item) => {
    const a = c.a, b = c.b || '#f8fafc', rib = dark(a, 0.18), gal = item.deco === 'stars';
    const back = P('M96,180 C84,222 88,254 112,262 L208,262 C232,254 236,222 224,180 C210,206 110,206 96,180 Z', a) + SH('M200,204 C214,206 220,196 224,180 C236,222 232,254 208,262 L198,262 Z', 0.16);
    const ring = P('M118,246 C122,230 140,226 160,230 C180,226 198,230 202,246 C206,262 186,276 160,276 C134,276 114,262 118,246 Z', a) +
      SH('M160,232 C180,226 198,230 202,246 C206,262 186,276 160,276 L160,266 C174,266 192,258 192,248 C190,240 178,236 160,238 Z', 0.14) +
      L('M126,262 C138,272 182,272 194,262', dark(a, 0.3), 2.5, { op: 0.6 });
    const pocket = P('M124,310 L196,310 L204,354 L116,354 Z', a) + L('M127,316 L119,350 M193,316 L201,350', dark(a), 3) + HL('M130,314 L142,314 L136,348 L124,348 Z', 0.16) + (gal ? STAR(160, 332, 7, b, { sw: 1.5 }) : '');
    const strings = L('M151,254 L146,300 M169,254 L174,300', b, 3) + C(146, 302, 3.5, b, { sw: 1.5 }) + C(174, 302, 3.5, b, { sw: 1.5 });
    const stars = gal ? STAR(126, 296, 7, b, { sw: 1.5 }) + SPARK(196, 292, 8, b) + SPARK(108, 318, 5, b) + C(206, 318, 2.5, b, { sw: 0 }) + STAR(214, 300, 4, b, { sw: 1.2 }) + C(118, 300, 2, b, { sw: 0 }) : '';
    const slvStars = gal ? STAR(88, 300, 5, b, { sw: 1.2 }) + SPARK(232, 282, 6, b) + C(80, 326, 2, b, { sw: 0 }) : '';
    return { back, front: sleeves(a, true, rib, true) + slvStars + body(a, stars) + pocket + P(HEM, rib) + ribs(104, 216, 356, 366, 12, dark(a, 0.45)) + ring + P(NECK, ctx.skin, { stroke: dark(a) }) + strings };
  },
  // knit sweater: chevron pattern in c.b, ribbed cuffs, hem and collar
  sweater: (c, ctx) => {
    const a = c.a, b = c.b || light(a, 0.4), rib = dark(a, 0.15);
    const zig = y => 'M105,' + y + [116, 127, 138, 149, 160, 171, 182, 193, 204, 215].map((x, i) => ' L' + x + ',' + (i % 2 ? y : y - 9)).join('');
    const knit = L(zig(290) + ' ' + zig(312), b, 4);
    return { front: sleeves(a, true, rib, true) + body(a, knit) + P(HEM, rib) + ribs(104, 216, 356, 366, 12, dark(a, 0.45)) + crew(a, ctx.skin, rib) +
      L('M142,243 L142,249 M150,250 L150,256 M160,253 L160,259 M170,250 L170,256 M178,243 L178,249', dark(a, 0.45), 2, { op: 0.55 }) };
  },
  // open bomber: inner tee in c.b, two panels with zipper tapes, welt pockets, ribbed collar/cuffs/hem (sleeves in c.c)
  jacket: (c) => {
    const a = c.a, b = c.b || '#f8fafc', sc = c.c || a, rib = dark(a, 0.2), tape = dark(a, 0.3);
    const inner = P('M132,236 L188,236 L192,372 C180,380 140,380 128,372 Z', b) + SH('M172,238 L188,236 L192,372 C186,376 178,379 170,380 Z', 0.12);
    const panel = P('M100,240 C112,233 130,232 148,240 L150,372 C124,384 104,380 94,366 Z', a);
    const zip = P('M144,246 L151,246 L153,372 L146,372 Z', tape, { sw: 2 }) + L('M148,252 L150,368', '#e5e7eb', 2.5, { dash: '3 3' });
    const pocket = L('M106,318 L130,320', dark(a), 3.5);
    const hem = P('M94,356 L150,356 L150,372 C124,384 104,380 93,368 Z', rib) + ribs(100, 144, 359, 367, 11, dark(a, 0.5));
    const left = panel + HL('M104,246 C112,240 124,236 136,238 L132,250 C120,254 112,264 108,280 Z') + pocket + hem + zip;
    const right = MIRROR(panel + pocket + hem + zip) + SH('M196,236 L220,240 L226,366 C216,374 206,378 196,380 Z', 0.14);
    const col = P('M122,240 C134,226 186,226 198,240 L194,254 C180,246 140,246 126,254 Z', rib) + ribs(136, 184, 236, 248, 8, dark(a, 0.5));
    return { front: sleeves(sc, true, rib, true) + inner + left + right + R(143, 248, 9, 12, 2, '#cbd5e1', { stroke: '#64748b', sw: 2 }) + col };
  },
  // football jersey: side stripes + sleeve bands in c.b, V-neck band, big number (item.num)
  jersey: (c, ctx, item) => {
    const a = c.a, b = c.b || '#f8fafc';
    const stripe = P('M106,252 L118,250 L116,369 L100,366 Z', b, { sw: 2 });
    const shine = item.deco === 'shine' ? SPARK(118, 270, 8) + SPARK(206, 262, 6) + SPARK(126, 340, 5) : '';
    const crest = C(132, 282, 7, b, { sw: 2 }) + C(132, 282, 3, a, { sw: 0 });
    return { front: sleeves(a, false, b) + body(a, stripe + MIRROR(stripe)) + T(160, 344, item.num || '10', 50, b, { stroke: dark(a), sw: 3 }) + crest +
      P(V_NECK, ctx.skin, { stroke: dark(a) }) + L('M139,238 L160,274 L181,238', b, 5) + shine };
  },
  // blazer: notched lapels over a shirt (c.b) with a tie (c.c), two buttons, welt pocket with a pocket square
  blazer: (c, ctx) => {
    const a = c.a, b = c.b || '#f8fafc', tie = c.c || '#ef4444', lap = dark(a, 0.14), btn = '#1f2937';
    const shirt = P('M131,234 L160,326 L189,234 C178,229 142,229 131,234 Z', b, { stroke: dark(b, 0.3) });
    const scol = P('M144,232 C150,240 156,248 160,258 L150,256 C144,250 142,240 144,232 Z', b, { stroke: dark(b, 0.3) });
    const tieS = P('M160,258 L152,270 L156,316 L160,328 L164,316 L168,270 Z', tie) + P('M151,250 L169,250 L165,262 L155,262 Z', tie) + HL('M156,272 L158,312 L160,316 L159,272 Z', 0.25);
    const lapel = P('M136,232 L160,326 L148,330 C132,304 127,274 128,250 C129,242 132,236 136,232 Z', lap) + HL('M135,240 C132,248 131,262 134,278 L139,276 C137,262 137,250 140,242 Z', 0.22) + L('M128,250 L135,246', dark(lap), 2.5);
    const pocket = P('M106,290 L113,280 L121,284 L126,292 Z', tie) + P('M103,292 L125,294 L124,304 L102,302 Z', lap);
    const cuff = L('M78,340 L106,342', dark(a, 0.35), 2) + C(102, 347, 3, btn, { sw: 0 });
    return { front: sleeves(a, true) + cuff + MIRROR(cuff) + body(a) + shirt + scol + MIRROR(scol) + tieS + lapel + MIRROR(lapel) + pocket +
      C(160, 340, 4.5, btn, { sw: 1.5, stroke: '#111' }) + C(160, 356, 4.5, btn, { sw: 1.5, stroke: '#111' }) };
  },

  // ---------- modern American streetwear ----------
  // flannel: plaid cross-hatch (thick lines in c.b, thin offset lines in c.c) on body + sleeves, pointed collar, placket, two flap pockets, cuffs
  flannel: (c, ctx) => {
    const a = c.a, b = c.b || dark(a, 0.5), k = c.c || light(a, 0.6), d = dark(a, 0.3), btn = light(a, 0.3);
    let v = '', v2 = '', h = '', h2 = '';
    for (let x = 108; x <= 204; x += 18) { v += `M${x},246 L${x},${hemY(x) - 3} `; v2 += `M${x + 9},247 L${x + 9},${hemY(x + 9) - 3} `; }
    for (let y = 258; y <= 354; y += 18) { h += `M${edgeL(y) + 3},${y} L${edgeR(y) - 3},${y} `; if (y <= 345) h2 += `M${edgeL(y + 9) + 3},${y + 9} L${edgeR(y + 9) - 3},${y + 9} `; }
    const plaid = L(v + h, b, 5, { op: 0.8 }) + L(v2 + h2, k, 2, { op: 0.6 });
    const sl = [[264, 88], [282, 81], [300, 78], [318, 77], [336, 77]];
    const sv = L('M90,262 L90,338 ' + sl.map(([y, x]) => `M${x},${y} L112,${y}`).join(' '), b, 5, { op: 0.8 }) +
      L('M82,284 L82,338 ' + sl.slice(0, 4).map(([y, x]) => `M${x - 2},${y + 9} L112,${y + 9}`).join(' '), k, 2, { op: 0.6 });
    const slv = P(SLV_L, a) + sv + P(CUFF_L, a) + C(100, 347, 3, btn, { sw: 1.5 });
    const flap = P('M108,282 L142,282 L141,294 L125,300 L109,294 Z', a, { stroke: d, sw: 2.5 }) + L('M111,288 L139,288', b, 4, { op: 0.8 }) + L('M111,294 L113,316 L139,316 L140,294', d, 2.5) + C(125, 291, 2.6, btn, { sw: 1.5 });
    const bt = [276, 300, 324, 348].map(y => C(160, y, 3.5, btn, { sw: 2 })).join('');
    const placket = P('M151,262 L169,262 L171,372 L149,372 Z', a, { stroke: d, sw: 2.5 }) + L('M160,264 L160,370', b, 5, { op: 0.8 });
    return { front: slv + HL(SLV_L_HL) + MIRROR(slv + SH(SLV_L_SH)) + body(a, plaid) + placket + bt + flap + MIRROR(flap) + collar(a, ctx.skin, true) };
  },
  // letterman jacket: body in c.a, contrast (leather) sleeves in c.c, double-striped rib collar/cuffs/hem in c.b, snap placket, big chenille letter (item.letter) on the chest
  varsity_jacket: (c, ctx, item) => {
    const a = c.a, b = c.b || '#fdf6e3', sc = c.c || b, d = dark(a, 0.3), letter = item.letter || 'R';
    const band = (path, s1, s2) => P(path, b) + L(s1 + ' ' + s2, a, 2.5);
    const slv = P(SLV_L, sc) + band(CUFF_L, 'M75,343 L108,345', 'M75,349 L108,351');
    const col = band('M120,240 C134,226 186,226 200,240 L196,257 C180,247 140,247 124,257 Z', 'M123,244 C140,236 180,236 197,244', 'M126,251 C140,244 180,244 194,251');
    const hem = band(HEM, 'M97,355 C120,363 200,363 223,355', 'M96,361 C120,370 200,370 224,361');
    const snaps = [270, 294, 318, 342].map(y => C(160, y, 3.2, '#e5e7eb', { stroke: '#64748b', sw: 1.5 })).join('');
    const chenille = T(134, 318, letter, 46, dark(b, 0.4), { stroke: dark(b, 0.4), sw: 5 }) + T(131, 315, letter, 46, b, { stroke: dark(b, 0.45), sw: 1.5 });
    const welt = L('M104,326 L124,328', d, 3.5);
    return { front: slv + HL(SLV_L_HL, 0.35) + MIRROR(slv + SH(SLV_L_SH)) + body(a) + hem + welt + MIRROR(welt) + L('M160,254 L160,356', d, 2.5) + snaps + chenille + col };
  },
  // USA flag tee: white body, navy ringer sleeves + neck band, a waving stars-and-stripes chest graphic, "USA" underneath
  flag_tee: (c, ctx) => {
    const a = c.a, b = c.b || '#1e3a8a', red = '#ef4444', wh = '#f8fafc', nd = '#172554';
    const wave = y => `M127,${y} C143,${y - 20} 177,${y + 20} 193,${y}`;
    const flag = 'M124,280 C140,260 180,300 196,280 L196,322 C180,342 140,302 124,322 Z';
    const canton = 'M124,280 C131,274 146,274 158,279 L158,303 C146,298 131,298 124,304 Z';
    const stars = [[131, 287], [140, 285], [150, 286], [131, 296], [140, 294], [150, 295]].map(([x, y]) => C(x, y, 1.9, wh, { sw: 0 })).join('');
    const graphic = P(flag, wh, { stroke: nd }) + L([283, 295, 307, 319].map(wave).join(' '), red, 6) + P(canton, b, { stroke: nd, sw: 2.5 }) + stars + P(flag, 'none', { stroke: nd }) +
      T(160, 352, 'USA', 20, red, { stroke: nd, sw: 2 });
    const star = STAR(92, 278, 6, wh, { sw: 1.2 });
    return { front: sleeves(b) + star + MIRROR(star) + body(a, graphic) + stitch(a) + crew(a, ctx.skin, b) };
  },
  // crop top (girl): cap sleeves, body ends above the waist with a rib hem (or a tie-front knot), small chest print (item.logo: heart | star | bolt | smiley | knot)
  crop_top: (c, ctx, item) => {
    const a = c.a, b = c.b || '#f8fafc', rib = dark(a, 0.18), k = item.logo;
    const bod = 'M100,240 C120,229 200,229 220,240 L222,304 C200,316 120,316 98,304 Z';
    // smiley features are drawn in the SHIRT colour (not dark(b)) so a dark disc on a bright top still reads as a face
    const print = k === 'heart' ? P(heartPath(160, 274, 9), b) : k === 'star' ? STAR(160, 274, 11, b) : k === 'bolt' ? P('M165,258 L149,282 L159,282 L154,298 L172,274 L162,274 Z', b) :
      k === 'smiley' ? C(160, 274, 11, b) + C(156, 271, 2.2, a, { sw: 0 }) + C(164, 271, 2.2, a, { sw: 0 }) + L('M154,277 Q160,284 166,277', a, 2.5) + HL('M152,266 C154,262 160,261 164,263 L160,268 C156,267 154,268 152,270 Z', 0.3) : '';
    // tie-front: gather folds toward a chunky centre knot with two hanging tails
    const knot = k === 'knot' ? L('M118,300 L148,302 M124,308 L150,306 M202,300 L172,302 M196,308 L170,306', dark(a, 0.3), 2.5, { op: 0.6 }) +
      P('M150,304 L136,334 L152,330 Z', a) + P('M170,304 L184,334 L168,330 Z', a) + P('M148,300 C150,288 170,288 172,300 C170,314 150,314 148,300 Z', a) + HL('M152,298 C155,292 165,292 168,298 L160,302 Z', 0.3) + L('M157,296 L158,308', dark(a, 0.3), 2, { op: 0.6 }) : '';
    const hem = k === 'knot' ? L('M100,304 C120,316 200,316 220,304', dark(a, 0.3), 2, { dash: '5 4', op: 0.7 }) : P('M99,292 L221,292 L222,304 C200,316 120,316 98,304 Z', rib) + ribs(106, 214, 295, 302, 12, dark(a, 0.45));
    return { front: sleeves(a) + slvStitch(a) + P(bod, a) + SH('M198,236 L220,240 L222,304 C214,310 206,313 196,314 Z') + HL(BODY_HL) + print + hem + knot + crew(a, ctx.skin) };
  },
  // oversized hoodie: longer body over the hips, wide drop-shoulder sleeves with a seam, big hood, low kangaroo pocket, chest text (item.txt)
  oversized_hoodie: (c, ctx, item) => {
    const a = c.a, b = c.b || '#f8fafc', rib = dark(a, 0.18), d = dark(a, 0.3);
    const BOD = 'M98,240 C120,228 200,228 222,240 L232,398 C200,412 120,412 88,398 Z';
    const SLV = 'M100,240 C76,258 64,300 66,354 L110,358 C108,306 114,268 126,248 Z';
    const slv = P(SLV, a) + P('M65,340 L111,343 L111,359 L65,356 Z', rib) + ribs(72, 104, 344, 354, 8, dark(rib, 0.45)) + L('M114,250 C120,258 121,268 119,280', d, 2, { op: 0.55 });
    const back = P('M96,180 C84,222 88,254 112,262 L208,262 C232,254 236,222 224,180 C210,206 110,206 96,180 Z', a) + SH('M200,204 C214,206 220,196 224,180 C236,222 232,254 208,262 L198,262 Z', 0.16);
    const ring = P('M114,246 C118,228 140,224 160,228 C180,224 202,228 206,246 C210,264 188,280 160,280 C132,280 110,264 114,246 Z', a) +
      SH('M160,230 C180,224 202,228 206,246 C210,264 188,280 160,280 L160,270 C176,270 196,260 196,248 C194,240 180,234 160,236 Z', 0.14) + HL('M118,246 C122,234 138,229 154,230 L152,237 C140,238 128,244 126,252 Z', 0.25) + L('M122,264 C138,276 182,276 198,264', d, 2.5, { op: 0.6 });
    const pocket = P('M120,338 L200,338 L208,384 L112,384 Z', a) + L('M123,344 L115,380 M197,344 L205,380', dark(a), 3) + HL('M126,342 L138,342 L132,380 L120,380 Z', 0.16);
    const strings = L('M151,258 L146,296 M169,258 L174,296', b, 3) + C(146, 298, 3.5, b, { sw: 1.5 }) + C(174, 298, 3.5, b, { sw: 1.5 });
    const print = item.txt ? T(160, 328, item.txt, 30, b, { stroke: dark(b, 0.4), sw: 2 }) : '';
    return { back, front: slv + HL('M98,244 C86,256 78,276 76,300 L84,302 C86,278 94,258 106,246 Z') + MIRROR(slv + SH('M68,326 L110,330 L110,358 L66,354 Z')) +
      P(BOD, a) + SH('M200,234 L222,240 L232,398 C222,406 212,410 200,411 Z') + HL(BODY_HL) + print + pocket + P('M89,384 L231,384 L232,398 C200,412 120,412 88,398 Z', rib) + ribs(98, 222, 388, 398, 12, dark(a, 0.45)) +
      ring + P(NECK, ctx.skin, { stroke: dark(a) }) + strings };
  },
  // denim trucker jacket: contrast thread stitching (c.b), yoke seam, pointed flap chest pockets, copper buttons, waistband, tee underneath (c.c)
  denim_jacket: (c) => {
    const a = c.a, d = dark(a, 0.3), th = c.b || '#f59e0b', tee = c.c || '#f8fafc', btn = '#b45309';
    const st = dd => L(dd, th, 1.8, { dash: '4 3', op: 0.85 });
    const cb = C(100, 347, 3, btn, { sw: 1.5 }) + st('M76,342 L108,344');
    const flap = P('M108,284 L142,284 L141,296 L125,302 L109,296 Z', a, { stroke: d, sw: 2.5 }) + L('M111,296 L112,318 L139,318 L140,296', d, 2.5) + st('M114,300 L115,315 L136,315 L137,300') + C(125, 292, 2.6, btn, { sw: 1.5 });
    const bt = [276, 300, 324, 348].map(y => C(160, y, 3.3, btn, { sw: 1.5 })).join('');
    const waist = P(HEM, a, { stroke: d }) + st('M98,357 C120,369 200,369 222,357') + C(110, 360, 3, btn, { sw: 1.5 }) + C(210, 360, 3, btn, { sw: 1.5 });
    return { front: sleeves(a, true, a) + cb + MIRROR(cb) + body(a) + L('M101,268 C130,262 190,262 219,268', d, 2.5) + st('M102,273 C130,267 190,267 218,273') + st('M105,276 L101,350 M215,276 L219,350') +
      P('M150,258 L170,258 L172,372 L148,372 Z', a, { stroke: d, sw: 2.5 }) + st('M154,262 L155,368 M166,262 L165,368') + bt + flap + MIRROR(flap) + waist + collar(a, tee, true) };
  },
  // puffer: quilted tubes — the body/sleeve outlines pinch at every seam and bulge between them, each tube is lit on top (gloss band under the seam
  // above it) and shaded at its bottom (band hugging the seam below); stand collar, zipper, rib cuffs; item.deco 'chrome' = metallic shine
  puffer: (c, ctx, item) => {
    const a = c.a, d = dark(a, 0.3), chrome = item.deco === 'chrome', rib = dark(a, 0.15), hop = chrome ? 0.5 : 0.3, sop = chrome ? 0.18 : 0.14;
    const ys = [262, 286, 310, 334, 358], xl = i => 99 - i * 2, xr = i => 221 + i * 2;
    const bulge = (pts, out) => { let s = '', px = pts[0][0], py = pts[0][1]; for (let i = 1; i < pts.length; i++) { const [x, y] = pts[i]; s += ` Q${(px + x) / 2 + out},${(py + y) / 2} ${x},${y}`; px = x; py = y; } return s; };
    const right = [[222, 240]].concat(ys.map((y, i) => [xr(i), y])), left = ys.map((y, i) => [xl(i), y]).reverse().concat([[98, 240]]);
    const bod = 'M98,240 C120,228 200,228 222,240' + bulge(right, 7) + ' L230,368 C200,384 120,384 90,368 L91,358' + bulge(left, -7) + ' Z';
    let seams = '', gloss = 'M103,245 C120,236 145,233 160,233 L160,241 C145,241 124,245 106,254 Z ', shade = '';
    ys.forEach((y, i) => {
      const l = xl(i), r = xr(i);
      seams += `M${l},${y} C130,${y + 7} 190,${y + 7} ${r},${y} `;
      shade += `M${l},${y - 8} C130,${y - 1} 190,${y - 1} ${r},${y - 8} L${r},${y} C190,${y + 7} 130,${y + 7} ${l},${y} Z `;
      if (i < 4) gloss += `M${l + 5},${y + 3} C130,${y + 10} 150,${y + 10.5} 162,${y + 10.5} L162,${y + 18} C150,${y + 18} 130,${y + 17} ${l + 6},${y + 11} Z `;
    });
    const sl = [[268, 84], [292, 76], [316, 71], [340, 70]];
    const slv = 'M100,240' + bulge([[100, 240]].concat(sl.map(([y, x]) => [x, y])), -6) + ' L70,352 L110,354 C108,306 114,268 124,248 Z';
    const sseams = sl.map(([y, x]) => `M${x + 2},${y} C90,${y + 5} 100,${y + 5} 112,${y}`).join(' ');
    const sshade = sl.map(([y, x]) => `M${x + 2},${y - 7} C90,${y - 2} 100,${y - 2} 112,${y - 7} L112,${y} C100,${y + 5} 90,${y + 5} ${x + 2},${y} Z`).join(' ');
    const sgloss = 'M99,245 C92,252 88,258 86,264 L92,266 C94,260 98,254 105,248 Z ' + sl.slice(0, 3).map(([y, x]) => `M${x + 5},${y + 3} C${x + 14},${y + 8} 96,${y + 8} 104,${y + 7} L104,${y + 13} C96,${y + 14} ${x + 14},${y + 14} ${x + 6},${y + 10} Z`).join(' ');
    const sleeve = P(slv, a) + SH(sshade, sop) + L(sseams, d, 2.5) + P(CUFF_L, rib) + ribs(80, 104, 342, 351, 8, dark(rib, 0.45));
    const shine = chrome ? SPARK(118, 280, 9) + SPARK(204, 304, 7) + SPARK(132, 348, 5) + SPARK(226, 268, 6) + L('M112,272 L146,279 M110,296 L142,303 M108,320 L140,327', '#fff', 2, { op: 0.7 }) : '';
    return { front: sleeve + HL(sgloss, hop) + MIRROR(sleeve + HL(sgloss, hop * 0.5) + SH('M72,324 L110,326 L110,354 L70,352 Z', 0.1)) + P(bod, a) + SH(shade, sop) + L(seams, d, 2.5) + HL(gloss, hop) + MIRROR(HL(gloss, hop * 0.4)) +
      SH('M200,234 L222,240 L230,368 C220,376 210,380 198,382 Z', 0.12) + zipper(160, 258, 372, d) + shine + standCollar(a) };
  },
  // colour-block windbreaker: body c.a, chevron chest block c.b, sleeves c.c with a stripe, stand collar, zipper, zip chest pocket, elastic hem
  windbreaker: (c) => {
    const a = c.a, b = c.b || '#f8fafc', k = c.c || b, d = dark(a, 0.3), rib = dark(a, 0.2), bd = dark(b, 0.3);
    const slv = P(SLV_L, k) + L('M94,258 C86,284 80,316 80,340', b, 5) + P(CUFF_L, rib) + ribs(80, 104, 342, 351, 8, dark(rib, 0.45));
    const block = P('M100,240 C120,229 200,229 220,240 L221,284 L160,302 L99,284 Z', b, { stroke: bd }) + L('M99,292 L160,310 L221,292', k, 5);
    const pocket = L('M104,322 L126,324', d, 3.5) + L('M104,322 L126,324', '#e5e7eb', 1.2, { dash: '2 2' });
    return { front: slv + HL(SLV_L_HL) + MIRROR(slv + SH(SLV_L_SH)) + body(a, block) + pocket + MIRROR(pocket) + P(HEM, rib) + ribs(104, 216, 356, 366, 12, dark(a, 0.45)) +
      zipper(160, 258, 356, d) + standCollar(b, bd) };
  },
  // raglan baseball tee: body c.a, 3/4 contrast raglan sleeves c.b whose seam runs up to the neck band, small chest text (item.txt)
  baseball_tee: (c, ctx, item) => {
    const a = c.a, b = c.b || '#1e3a8a';
    const RAG = 'M102,240 C82,256 72,296 74,332 L110,334 C110,310 111,290 114,272 L142,240 C128,231 112,232 102,240 Z';
    const slv = P(RAG, b) + P('M73,320 L111,322 L111,335 L73,333 Z', dark(b, 0.15)) + L('M112,270 L140,238', dark(b, 0.3), 2, { dash: '4 3', op: 0.7 });
    const txt = item.txt ? T(160, 319, item.txt, 28, b, { stroke: dark(b, 0.4), sw: 1.5 }) : '';
    return { front: body(a) + slv + HL(SLV_L_HL) + MIRROR(slv + SH('M78,304 L110,308 L110,334 L74,332 Z')) + txt + stitch(a) + crew(a, ctx.skin, b) };
  },
  // aloha shirt: camp collar, placket, scattered dot-petal flowers (c.b) with leaves (c.c) on body + sleeves
  hawaiian: (c, ctx) => {
    const a = c.a, b = c.b || '#f8fafc', k = c.c || '#22c55e', d = dark(a, 0.3), btn = light(a, 0.5);
    const flower = (x, y, r) => { let s = ''; for (let i = 0; i < 5; i++) { const t = -Math.PI / 2 + i * Math.PI * 2 / 5; s += C((x + r * Math.cos(t)).toFixed(1), (y + r * Math.sin(t)).toFixed(1), r * 0.62, b, { sw: 0 }); } return s + C(x, y, r * 0.42, '#facc15', { sw: 0 }); };
    const leaf = (x, y, rot) => E(x, y, 7, 3, k, { sw: 0, extra: { transform: `rotate(${rot} ${x} ${y})` } }) + L(`M${x - 5},${y} L${x + 5},${y}`, dark(k, 0.3), 1.2, { extra: { transform: `rotate(${rot} ${x} ${y})` } });
    const pat = flower(122, 270, 7) + flower(190, 262, 6) + flower(150, 296, 8) + flower(206, 304, 6) + flower(126, 322, 6) + flower(172, 334, 7) + flower(204, 352, 5) + flower(112, 352, 5) +
      leaf(136, 258, -30) + leaf(176, 282, 40) + leaf(118, 298, 20) + leaf(196, 326, -35) + leaf(146, 348, -20) + leaf(214, 282, 60);
    const slv = P(SLV_S, a) + flower(92, 272, 5) + leaf(98, 288, 30);
    const bt = [280, 304, 328, 352].map(y => C(160, y, 3, btn, { sw: 1.5 })).join('');
    return { front: slv + HL(SLV_S_HL) + MIRROR(slv + SH(SLV_S_SH)) + body(a, pat) + L('M152,264 L150,372 M168,264 L170,372', d, 2, { op: 0.6 }) + bt + stitch(a) + collar(a, ctx.skin, false) };
  },
  // turtleneck: slim long sleeves, rib hem + cuffs, tall folded rib collar that covers the neck
  turtleneck: (c) => {
    const a = c.a, rib = dark(a, 0.12), d = dark(a, 0.3);
    const col = R(134, 214, 52, 42, 14, a) + SH('M172,216 L184,218 L186,244 C186,252 180,256 172,256 Z', 0.14) + HL('M138,220 C140,216 146,214 152,214 L150,222 C144,222 140,226 138,232 Z', 0.3) +
      L('M136,234 L184,234', d, 2.5, { op: 0.7 }) + ribs(140, 180, 238, 252, 6, dark(a, 0.3));
    return { front: sleeves(a, true, rib, true) + body(a) + P(HEM, rib) + ribs(104, 216, 356, 366, 12, dark(a, 0.45)) + col };
  },
};

// [key, colours, colour name, rarity, extra] using the shared palette; b = accent colour
const cv = (key, b, rarity, tier, extra) => [key, b ? { a: COLORS[key][0], b } : { a: COLORS[key][0] }, COLORS[key][1], rarity, Object.assign({ tier }, extra || {})];

export const ITEMS = [
  { id: 'top_rags', cat: 'top', tpl: 'rags', colors: { a: '#8c8372' }, rarity: 'rags', name: { en: 'Torn Shirt', ar: 'قميص ممزق' }, gender: 'any', tier: 0 },
  ...variants('top', 'tshirt', { en: 'Tee', ar: 'تيشيرت' }, [
    cv('white', null, 'common', 1), cv('sky', null, 'common', 1), cv('red', null, 'common', 1), cv('blue', null, 'common', 2), cv('green', null, 'common', 2),
    cv('yellow', null, 'common', 2), cv('pink', null, 'common', 2), cv('purple', null, 'common', 3), cv('orange', null, 'common', 3), cv('black', null, 'common', 3),
  ]),
  ...variants('top', 'tee_logo', { en: 'Tee', ar: 'تيشيرت' }, [
    ['star', { a: '#1e3a8a', b: '#facc15' }, { en: 'Star', ar: 'نجمة' }, 'common', { logo: 'star', tier: 2 }],
    ['heart', { a: '#fff1f2', b: '#ef4444' }, { en: 'Heart', ar: 'قلب' }, 'common', { logo: 'heart', tier: 2 }],
    ['bolt', { a: '#2b2b33', b: '#facc15' }, { en: 'Bolt', ar: 'برق' }, 'common', { logo: 'bolt', tier: 2 }],
    ['smiley', { a: '#7dd3fc', b: '#facc15' }, { en: 'Smiley', ar: 'سمايلي' }, 'common', { logo: 'smiley', tier: 3 }],
    ['gem', { a: '#a855f7', b: '#6ee7b7' }, { en: 'Gem', ar: 'جوهرة' }, 'rare', { logo: 'gem', tier: 3 }],
    ['rise', { a: '#ef4444', b: '#fdf6e3' }, { en: 'RISE', ar: 'رايز' }, 'rare', { logo: 'rise', tier: 4 }],
  ]),
  ...variants('top', 'tank', { en: 'Tank', ar: 'تانك' }, [
    cv('white', null, 'common', 2), cv('black', null, 'common', 2), cv('coral', null, 'common', 3), cv('mint', null, 'common', 3),
  ]),
  ...variants('top', 'polo', { en: 'Polo', ar: 'بولو' }, [
    cv('navy', '#f8fafc', 'common', 2), cv('white', '#1e3a8a', 'common', 2), cv('green', '#f8fafc', 'rare', 3), cv('red', '#f8fafc', 'rare', 4),
  ]),
  ...variants('top', 'shirt', { en: 'Shirt', ar: 'قميص' }, [
    cv('white', null, 'common', 3), cv('sky', null, 'common', 3), cv('denim', null, 'rare', 4), cv('pink', null, 'rare', 5), cv('black', null, 'rare', 6),
  ]),
  ...variants('top', 'hoodie', { en: 'Hoodie', ar: 'هودي' }, [
    cv('grey', '#f8fafc', 'common', 3), cv('black', '#f8fafc', 'common', 3), cv('red', '#f8fafc', 'rare', 4),
    cv('purple', '#fde68a', 'rare', 5), cv('teal', '#f8fafc', 'rare', 5), cv('pink', '#f8fafc', 'rare', 6),
  ]),
  single('top', 'hoodie', 'galaxy', { a: '#312e81', b: '#f472b6' }, { en: 'Galaxy Hoodie', ar: 'هودي المجرة' }, 'epic', { tier: 8, deco: 'stars' }),
  ...variants('top', 'sweater', { en: 'Sweater', ar: 'كنزة' }, [
    cv('cream', '#92400e', 'rare', 3), cv('maroon', '#fdf6e3', 'rare', 4), cv('olive', '#facc15', 'rare', 5), cv('navy', '#7dd3fc', 'rare', 6),
  ]),
  ...variants('top', 'jacket', { en: 'Bomber', ar: 'بومبر' }, [
    cv('olive', '#f8fafc', 'rare', 5), cv('black', '#ef4444', 'rare', 6), cv('navy', '#facc15', 'rare', 7),
  ]),
  // legacy id kept (saves may hold it) but now drawn with the proper letterman template; `legacy: true` = exempt from the ${cat}_${tpl}_${key} id rule
  { id: 'top_jacket_varsity', cat: 'top', tpl: 'varsity_jacket', colors: { a: '#7f1d1d', b: '#fdf6e3', c: '#fdf6e3' }, rarity: 'epic', name: { en: 'Varsity Jacket', ar: 'جاكيت فارسيتي' }, gender: 'any', tier: 9, letter: 'R', legacy: true },
  ...variants('top', 'jersey', { en: 'Jersey', ar: 'جيرسي' }, [
    cv('red', '#f8fafc', 'rare', 4, { num: '10' }), cv('blue', '#f8fafc', 'rare', 5, { num: '7' }), cv('green', '#facc15', 'rare', 6, { num: '9' }),
  ]),
  single('top', 'jersey', 'gold', { a: '#f59e0b', b: '#fdf6e3' }, { en: 'Gold Jersey', ar: 'جيرسي ذهبي' }, 'legendary', { tier: 5, num: '1', deco: 'shine' }),
  ...variants('top', 'blazer', { en: 'Blazer', ar: 'بليزر' }, [
    ['navy', { a: COLORS.navy[0], b: '#f8fafc', c: '#ef4444' }, COLORS.navy[1], 'rare', { tier: 6 }],
    ['black', { a: COLORS.black[0], b: '#f8fafc', c: '#3b82f6' }, COLORS.black[1], 'rare', { tier: 7 }],
  ]),
  single('top', 'blazer', 'royal', { a: '#6d28d9', b: '#fdf6e3', c: '#f59e0b' }, { en: 'Royal Blazer', ar: 'بليزر ملكي' }, 'epic', { tier: 10 }),

  // ---------- modern American streetwear ----------
  ...variants('top', 'flannel', { en: 'Flannel', ar: 'قميص فلانيل' }, [
    ['lumberjack', { a: '#dc2626', b: '#1f2937', c: '#fde68a' }, { en: 'Lumberjack', ar: 'الحطاب' }, 'common', { tier: 3 }],
    ['portland', { a: '#15803d', b: '#1e3a8a', c: '#fde68a' }, { en: 'Portland', ar: 'بورتلاند' }, 'common', { tier: 4 }],
    ['seattle', { a: '#2563eb', b: '#1e293b', c: '#f8fafc' }, { en: 'Seattle', ar: 'سياتل' }, 'rare', { tier: 5 }],
    ['smoke', { a: '#64748b', b: '#1e293b', c: '#f8fafc' }, { en: 'Smoke', ar: 'دخاني' }, 'rare', { tier: 6 }],
  ]),
  ...variants('top', 'varsity_jacket', { en: 'Varsity', ar: 'فارسيتي' }, [
    ['brooklyn', { a: '#1e3a8a', b: '#f8fafc', c: '#f8fafc' }, { en: 'Brooklyn', ar: 'بروكلين' }, 'rare', { tier: 7, letter: 'B' }],
    ['la', { a: '#2b2b33', b: '#f59e0b', c: '#f59e0b' }, { en: 'LA', ar: 'لوس أنجلوس' }, 'epic', { tier: 8, letter: 'L' }],
    ['cali', { a: '#0ea5e9', b: '#f8fafc', c: '#fdf6e3' }, { en: 'Cali', ar: 'كالي' }, 'epic', { tier: 10, letter: 'C' }],
  ]),
  single('top', 'flag_tee', 'usa', { a: '#f8fafc', b: '#1e3a8a' }, { en: 'USA Flag Tee', ar: 'تيشيرت علم أمريكا' }, 'epic', { tier: 7 }),
  ...variants('top', 'crop_top', { en: 'Crop Top', ar: 'كروب توب' }, [
    ['malibu', { a: '#fb7185', b: '#f8fafc' }, { en: 'Malibu', ar: 'ماليبو' }, 'common', { tier: 2, logo: 'heart' }],
    ['lime', { a: '#a3e635', b: '#1e293b' }, { en: 'Lime', ar: 'ليموني' }, 'common', { tier: 2, logo: 'bolt' }],
    ['black', { a: '#2b2b33', b: '#f8fafc' }, { en: 'Black', ar: 'أسود' }, 'common', { tier: 3, logo: 'star' }],
    ['lavender', { a: '#c4b5fd', b: '#f8fafc' }, { en: 'Lavender', ar: 'لافندر' }, 'rare', { tier: 4, logo: 'knot' }],
    ['sunny', { a: '#facc15', b: '#1e293b' }, { en: 'Sunny', ar: 'مشمس' }, 'rare', { tier: 5, logo: 'smiley' }],
  ], { gender: 'girl' }),
  ...variants('top', 'oversized_hoodie', { en: 'Oversized Hoodie', ar: 'هودي واسع' }, [
    ['nyc', { a: '#2b2b33', b: '#f8fafc' }, { en: 'NYC', ar: 'نيويورك' }, 'rare', { tier: 4, txt: 'NYC' }],
    ['lilac', { a: '#c4b5fd', b: '#f8fafc' }, { en: 'Lilac', ar: 'ليلكي' }, 'rare', { tier: 5 }],
    ['sand', { a: '#e7d3b1', b: '#92400e' }, { en: 'Sand', ar: 'رملي' }, 'rare', { tier: 5, txt: 'LA' }],
    ['electric', { a: '#2563eb', b: '#facc15' }, { en: 'Electric', ar: 'كهربائي' }, 'epic', { tier: 7, txt: 'RISE' }],
  ]),
  ...variants('top', 'denim_jacket', { en: 'Denim Jacket', ar: 'جاكيت جينز' }, [
    ['classic', { a: '#3b5998', b: '#f59e0b', c: '#f8fafc' }, { en: 'Classic', ar: 'كلاسيكي' }, 'rare', { tier: 4 }],
    ['black', { a: '#2b2b33', b: '#9ca3af', c: '#f8fafc' }, { en: 'Black', ar: 'أسود' }, 'rare', { tier: 6 }],
  ]),
  ...variants('top', 'puffer', { en: 'Puffer', ar: 'جاكيت منفوخ' }, [
    ['black', { a: '#2b2b33' }, { en: 'Black', ar: 'أسود' }, 'rare', { tier: 5 }],
    ['red', { a: '#ef4444' }, { en: 'Red', ar: 'أحمر' }, 'rare', { tier: 6 }],
  ]),
  single('top', 'puffer', 'chrome', { a: '#cbd5e1' }, { en: 'Chrome Puffer', ar: 'جاكيت منفوخ كروم' }, 'epic', { tier: 10, deco: 'chrome' }),
  ...variants('top', 'windbreaker', { en: 'Windbreaker', ar: 'جاكيت رياضي' }, [
    ['miami', { a: '#14b8a6', b: '#f472b6', c: '#f8fafc' }, { en: 'Miami', ar: 'ميامي' }, 'rare', { tier: 4 }],
    ['retro', { a: '#7c3aed', b: '#facc15', c: '#14b8a6' }, { en: 'Retro', ar: 'ريترو' }, 'rare', { tier: 5 }],
    ['neon', { a: '#2b2b33', b: '#a3e635', c: '#f472b6' }, { en: 'Neon', ar: 'نيون' }, 'epic', { tier: 7 }],
  ]),
  ...variants('top', 'baseball_tee', { en: 'Baseball Tee', ar: 'تيشيرت بيسبول' }, [
    ['navy', { a: '#f8fafc', b: '#1e3a8a' }, { en: 'Navy', ar: 'كحلي' }, 'common', { tier: 2, txt: 'NY' }],
    ['red', { a: '#f8fafc', b: '#ef4444' }, { en: 'Red', ar: 'أحمر' }, 'common', { tier: 3, txt: '07' }],
    ['black', { a: '#9ca3af', b: '#2b2b33' }, { en: 'Black', ar: 'أسود' }, 'common', { tier: 3, txt: '99' }],
  ]),
  ...variants('top', 'hawaiian', { en: 'Aloha Shirt', ar: 'قميص ألوها' }, [
    ['coral', { a: '#fb7185', b: '#f8fafc', c: '#22c55e' }, { en: 'Coral', ar: 'مرجاني' }, 'rare', { tier: 4 }],
    ['teal', { a: '#14b8a6', b: '#fde68a', c: '#f472b6' }, { en: 'Teal', ar: 'تركوازي' }, 'rare', { tier: 5 }],
  ]),
  ...variants('top', 'turtleneck', { en: 'Turtleneck', ar: 'بلوزة ياقة عالية' }, [
    ['black', { a: '#2b2b33' }, { en: 'Black', ar: 'أسود' }, 'rare', { tier: 5 }],
    ['cream', { a: '#fdf6e3' }, { en: 'Cream', ar: 'كريمي' }, 'rare', { tier: 6 }],
  ]),
];
