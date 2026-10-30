// Hair (cat 'hair'): 8 boy styles + 8 girl styles in the sticker style. `front` is drawn over the face
// (after the face, before glasses/hat) and must leave the eyes (y 136..168) uncovered; `back` is drawn
// behind the whole body (long hair, tails, braids) and survives caps that set hidesHairFront.
// Every shape: base + outline + SH + HL + one detail. ui.js crops hair thumbnails to viewBox '50 10 220 230'
// inside overflow:hidden boxes, so every front piece stays inside y >= 12 and x 52..268.
import { P, F, SH, HL, C, E, R, L, G, MIRROR, HAIR_COLORS, variants, single, dark, light } from './_kit.js';

// ---- colour helpers ---------------------------------------------------------------------------
const lum = h => { const n = parseInt(h.slice(1), 16); return (0.299 * ((n >> 16) & 255) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255)) / 255; };
const isLight = a => lum(a) > 0.85;   // silver (#e5e7eb)
const isDark = a => lum(a) < 0.2;     // black (#2b2118)
// Highlight: white on normal hair, a cool blue tint on silver where white would vanish.
const hl = (a, d, op) => isLight(a) ? F(d, '#bfdbfe', { op: 0.5 }) : HL(d, op || 0.3);
// Shadow: a touch stronger on silver so the form still reads.
const sh = (a, d, op) => SH(d, isLight(a) ? Math.max(op || 0.14, 0.2) : (op || 0.14));
// Detail strokes that read at card size: a darker line on most colours, a lighter sheen line on black
// (a darker line on near-black is invisible), softer on blonde/pink/silver.
const strokeFor = a => isDark(a) ? light(a, 0.22) : dark(a, 0.45);
const opFor = a => isLight(a) ? 0.6 : lum(a) > 0.55 ? 0.65 : 0.8;
const strands = (d, a, op) => L(d, strokeFor(a), 3, { op: op || opFor(a) });
const curl = (d, a) => L(d, strokeFor(a), 3.5, { op: 0.85 });
// Thin glossy sheen stroke (white, or the cool tint on silver).
const sheen = (d, a) => L(d, isLight(a) ? '#93c5fd' : '#fff', 2.5, { op: isLight(a) ? 0.5 : 0.3 });

// ---- shared rig bits -------------------------------------------------------------------------
// Outer dome: hair volume 2-4px outside the head, from the left temple over the top to the right temple.
const TOP = 'C80,58 110,34 160,34 C210,34 240,58 240,128';
// Boy sideburns (right side goes down first, left side ends at 80,142 and Z closes back up to 80,128).
const BURN_R = 'L240,142 C238,148 230,148 228,138 L226,124';
const BURN_L = 'L92,138 C90,148 82,148 80,142';
// Neat boy hairline between the sideburns (right temple -> forehead -> left temple).
const NEAT = 'C222,100 208,94 198,94 C186,88 170,86 160,88 C150,86 134,88 122,94 C112,94 98,100 94,124';
const dome = (a, hairline, o) => P('M80,128 ' + TOP + ' ' + hairline + ' Z', a, o);
const hlDome = a => hl(a, 'M96,86 C100,62 122,44 148,40 C128,54 110,68 96,86 Z', 0.3);
const shDome = a => sh(a, 'M202,44 C230,58 240,92 240,128 C236,100 226,68 202,44 Z', 0.14);
// Long back piece (behind the body) used by the straight girl styles.
const LONG_BACK = 'M80,128 C80,56 108,36 160,36 C212,36 240,56 240,128 L252,308 C236,324 84,324 68,308 Z';
const backShade = a => sh(a, 'M226,70 C244,120 250,220 252,308 C244,316 236,318 230,318 C236,220 236,130 226,70 Z', 0.14) +
  hl(a, 'M90,76 C100,52 124,42 150,40 C120,56 104,72 90,76 Z', 0.26);
// Front side locks hanging in front of the ears (girls).
const lock = (a, d) => P(d, a) + MIRROR(P(d, a)) + MIRROR(sh(a, 'M236,150 C242,190 240,220 234,232 C228,228 226,210 228,190 C230,170 232,160 236,150 Z', 0.12));
const LOCK = 'M80,116 C62,150 64,196 74,232 C80,242 96,240 100,228 C96,196 96,154 100,118 Z';
// Soft bangs: gently curved fringe with three shallow lobes (lowest point y≈110, well above the brows).
const BANGS = 'C240,112 232,102 224,102 C214,102 206,110 196,110 C184,110 178,102 168,104 C160,110 150,110 142,104 C132,102 126,110 114,110 C104,110 96,102 86,102 C82,104 80,114 80,128';
const bangLines = a => strands('M128,108 L130,94 M160,109 L160,96 M192,108 L190,94', a, 0.45);
// Hair tie (b colour) with a highlight.
const tie = (x, y, rx, ry, b) => E(x, y, rx, ry, b, { stroke: dark(b, 0.4) }) + HL(`M${x - rx * 0.5},${y - ry * 0.5} L${x + rx * 0.3},${y - ry * 0.5} L${x + rx * 0.1},${y - ry * 0.1} L${x - rx * 0.6},${y - ry * 0.1} Z`, 0.4);
// Bow (two loops + knot) for braids.
const bow = (x, y, b) => E(x - 9, y, 9, 6, b, { stroke: dark(b, 0.4), extra: { transform: `rotate(-18 ${x - 9} ${y})` } }) +
  E(x + 9, y, 9, 6, b, { stroke: dark(b, 0.4), extra: { transform: `rotate(18 ${x + 9} ${y})` } }) + C(x, y, 4, b, { stroke: dark(b, 0.4), sw: 2.5 }) +
  HL(`M${x - 14},${y - 3} L${x - 6},${y - 4} L${x - 8},${y} L${x - 14},${y} Z`, 0.45);
// One braid link: rotated ellipse with its own top-left highlight and bottom-right shadow (drawn in the link's frame).
const link = (a, x, y, r) => G(E(0, 0, 13, 10, a) + hl(a, 'M-10,-5 C-7,-9 -2,-10.5 3,-9.5 C-1,-8 -6,-7 -10,-5 Z', 0.3) + sh(a, 'M0,10 C7,10 12,6 13,0 C11,5 7,7.5 0,10 Z', 0.14),
  { transform: `translate(${x} ${y}) rotate(${r})` });
// Braid: chained links hanging beside the head, drawn bottom-up so upper links overlap lower ones. It lives in
// `back` (behind the body) so it survives caps; the chain drifts outward (x≈73 → 65) so the bow clears the arm
// (arm outer edge x≈83 at y=284).
function braid(a, b) {
  const cx = i => Math.round(75 - i * 1.3 + (i % 2 ? 2 : -2));
  let s = P('M58,266 C60,282 64,292 68,296 C72,292 76,282 78,266 Z', a) + sh(a, 'M68,270 C72,282 72,290 68,296 C70,288 70,280 68,270 Z', 0.14);
  for (let i = 6; i >= 0; i--) s += link(a, cx(i), 150 + i * 20, i % 2 ? 28 : -28);
  return s + bow(67, 282, b);
}
// Tight cap just inside the head outline (buzz cut, mohawk sides) + 22 stubble dots, all inside the cap and
// above its hairline (the hairline sits at y≈92 centre, y≈104 at x=102, y≈112 at x=97).
const CAP = 'M83,128 C83,64 112,39 160,39 C208,39 237,64 237,128 L237,140 C236,146 230,146 228,138 L226,122 C222,102 210,96 200,96 C188,92 170,90 160,92 C150,90 132,92 120,96 C110,96 98,102 94,122 L92,138 C90,146 84,146 83,140 Z';
const STUBBLE = [[128, 57], [144, 54], [160, 57], [176, 54], [192, 57], [114, 69], [130, 66], [146, 70], [162, 67], [178, 70], [194, 66], [210, 69],
  [102, 81], [120, 78], [138, 82], [156, 79], [174, 82], [192, 78], [206, 82], [220, 79], [96, 96], [224, 96]];
const stubble = a => STUBBLE.map(([x, y]) => C(x, y, 1.9, dark(a, 0.4), { sw: 0, op: 0.5 })).join('');
const capCut = a => P(CAP, a, { op: 0.85, sw: 2.5 }) + hl(a, 'M100,84 C104,64 122,48 146,44 C128,56 110,70 100,84 Z', 0.22) +
  sh(a, 'M206,48 C228,62 236,92 236,126 C232,98 224,70 206,48 Z', 0.14) + stubble(a);

export const TEMPLATES = {
  // ---------------- BOY ----------------
  // Starting junk: ragged uneven chunks, stray hairs. Dull brown only.
  messy: (c) => {
    const a = c.a;
    const d = 'M80,128 C80,104 82,86 88,70 L74,60 L96,58 L98,40 L112,44 L120,26 L130,38 L146,20 L152,34 L168,18 L176,34 L190,24 L196,40 L212,34 L216,52 L232,50 L230,66 C238,84 240,106 240,128 ' +
      'L240,146 L232,150 L228,134 L224,120 C218,104 208,100 200,102 L194,110 L186,98 L176,104 L166,96 L156,106 L146,96 L136,104 L126,98 L116,108 L108,100 C100,102 94,112 94,124 L90,138 L86,152 L80,146 Z';
    return {
      front: P(d, a) + hl(a, 'M100,80 C104,62 118,48 134,42 C120,56 108,68 100,80 Z', 0.22) + sh(a, 'M206,40 C228,58 240,92 240,128 L232,128 C230,96 222,64 206,40 Z', 0.16) +
        L('M88,70 L70,66 M232,50 L250,40 M146,20 L140,12 M196,40 L212,30', dark(a, 0.3), 3) + strands('M104,64 L112,84 M176,46 L182,66 M140,52 L138,70', a, 0.45),
    };
  },
  // Clean short crop: side part line + comb strokes.
  short: (c) => {
    const a = c.a;
    return {
      front: dome(a, BURN_R + ' ' + NEAT + ' ' + BURN_L) + hlDome(a) + shDome(a) +
        strands('M120,94 C112,76 116,56 132,44', a) + strands('M140,52 Q154,42 170,40 M184,44 Q198,50 210,62 M126,70 Q140,60 156,58', a),
    };
  },
  // Regular upward spikes (anime energy). Tips stay at y >= 12 for the thumbnail crop.
  spiky: (c) => {
    const a = c.a;
    const d = 'M80,128 C80,100 82,78 90,64 L74,46 L104,52 L106,22 L126,40 L136,12 L152,34 L162,12 L174,34 L188,12 L198,40 L216,22 L218,52 L246,46 L230,64 C238,78 240,100 240,128 ' +
      BURN_R + ' C222,104 210,96 200,98 L192,104 L180,94 L168,102 L160,92 L152,102 L140,94 L128,104 L120,98 C110,96 98,104 94,124 ' + BURN_L + ' Z';
    return {
      front: P(d, a) + hl(a, 'M106,24 L116,56 L108,62 Z M136,14 L146,48 L138,54 Z M162,14 L170,44 L162,48 Z', 0.3) + sh(a, 'M198,40 L190,70 C208,70 226,86 238,128 L240,128 C240,96 230,64 216,52 L218,24 L208,42 Z', 0.14) +
        strands('M112,64 L124,86 M158,52 L160,78 M204,60 L196,84', a, 0.45),
    };
  },
  // Cluster of outlined curls; the second (strokeless) pass hides the inner crossings.
  curly: (c) => {
    const a = c.a;
    const ring = [[92, 124, 18], [96, 98, 18], [108, 74, 18], [126, 56, 18], [146, 44, 18], [168, 42, 18], [190, 48, 18], [208, 60, 18], [222, 78, 18], [230, 100, 18], [230, 124, 18]];
    const fringe = [[112, 100, 14], [132, 94, 14], [152, 90, 14], [172, 90, 14], [192, 94, 14], [212, 100, 14]];
    const all = ring.concat(fringe);
    let s = all.map(([x, y, r]) => C(x, y, r, a)).join('');
    s += F('M96,124 C96,70 124,46 160,46 C196,46 226,70 226,124 C206,100 180,96 160,96 C140,96 114,100 96,124 Z', a);
    s += all.map(([x, y, r]) => C(x, y, r, a, { sw: 0 })).join('');
    s += hl(a, 'M120,52 C124,44 134,40 142,44 C134,46 126,50 120,52 Z M150,38 C156,32 166,32 172,36 C164,36 156,38 150,38 Z M100,88 C100,82 106,76 112,76 C106,80 102,84 100,88 Z', 0.35);
    s += sh(a, 'M214,70 C230,82 240,104 238,130 C232,110 226,90 214,70 Z M204,106 C212,110 216,116 212,122 C210,116 206,110 204,106 Z', 0.15);
    s += strands('M118,74 a6,6 0 1 1 8,6 M160,62 a6,6 0 1 1 8,6 M196,80 a6,6 0 1 1 8,6 M134,100 a5,5 0 1 1 7,4 M186,98 a5,5 0 1 1 7,4', a, 0.45);
    return { front: s };
  },
  // Side part with a swoop across the forehead.
  side: (c) => {
    const a = c.a;
    const hair = BURN_R + ' C224,112 222,104 214,102 C196,114 160,114 136,100 C128,94 124,88 122,80 C116,90 106,96 100,104 C94,112 92,120 92,130 ' + BURN_L;
    return {
      front: dome(a, hair) + hlDome(a) + shDome(a) + hl(a, 'M138,96 C160,106 190,108 210,102 C192,112 160,110 138,96 Z', 0.2) +
        strands('M122,80 C118,64 118,50 128,38 M146,102 C172,110 196,106 210,100', a, 0.55),
    };
  },
  // Buzz cut: tight semi-transparent cap with stubble dots.
  buzz: (c) => ({ front: capCut(c.a) }),
  // Mohawk: buzzed sides (same cap + stubble as the buzz cut) with a tall spiked crest on top.
  mohawk: (c) => {
    const a = c.a;
    const crest = 'M128,100 C122,76 124,46 134,24 L142,14 L152,34 L160,13 L168,34 L178,14 L186,24 C196,46 198,76 192,100 C180,92 140,92 128,100 Z';
    return {
      front: capCut(a) + P(crest, a) + hl(a, 'M134,30 L142,18 L148,34 L142,66 L132,70 Z', 0.3) + sh(a, 'M176,18 L186,26 C196,46 198,76 192,98 L180,96 C186,70 184,44 176,18 Z', 0.16) +
        strands('M146,44 L144,90 M160,36 L160,90 M174,44 L176,90', a, 0.45),
    };
  },
  // Pompadour: tight cap on the sides + a big quiff rolled up and forward on top, with a curl line.
  pompadour: (c) => {
    const a = c.a;
    const cap = 'M84,128 C84,104 86,86 92,74 C106,52 130,44 160,44 C190,44 214,52 228,74 C234,86 238,104 238,128 ' + BURN_R + ' ' + NEAT + ' ' + BURN_L + ' Z';
    const roll = 'M100,98 C96,70 112,30 150,22 C186,14 222,30 226,62 C228,80 220,96 204,100 C196,80 180,70 160,68 C140,68 118,78 100,98 Z';
    return {
      front: P(cap, a) + sh(a, 'M214,62 C230,78 236,102 238,128 L232,128 C230,104 224,82 214,62 Z', 0.14) +
        sh(a, 'M100,98 C118,78 140,68 160,68 C180,70 196,80 204,100 C190,86 172,82 160,82 C148,82 122,86 100,98 Z', 0.16) +
        P(roll, a) + hl(a, 'M106,80 C110,50 128,32 150,26 C134,40 118,58 106,80 Z', 0.35) +
        sh(a, 'M196,28 C216,36 226,48 226,62 C228,80 220,96 204,100 C214,84 218,66 212,52 C208,42 202,34 196,28 Z', 0.14) +
        curl('M110,86 C120,48 160,30 206,48', a) + sheen('M122,62 C136,42 164,34 192,40', a) + strands('M130,76 C146,58 172,48 200,52', a, 0.5),
    };
  },

  // ---------------- GIRL ----------------
  // Starting junk: tangled long back + uneven fringe + stray hairs. Dull brown only.
  messyg: (c) => {
    const a = c.a;
    const back = 'M80,128 C80,56 108,36 160,36 C212,36 240,56 240,128 L246,170 L258,204 L248,236 L262,270 L250,300 L260,322 L240,310 L226,328 L210,308 L192,326 L176,306 L160,326 L144,306 L128,326 L112,308 L96,324 L82,306 L62,320 L72,296 L58,266 L70,232 L60,198 L74,164 Z';
    const front = 'M80,128 C80,56 108,34 160,34 C212,34 240,56 240,128 L238,144 L230,132 L224,118 C220,106 212,98 204,100 L198,110 L190,98 L180,106 L172,96 L160,108 L148,98 L138,106 L128,96 L118,110 L108,100 C100,104 96,114 94,124 L90,134 L84,146 L80,140 Z';
    const lk = 'M80,122 C64,160 62,210 70,250 L78,264 L86,248 C82,210 86,170 96,124 Z';
    return {
      back: P(back, a) + sh(a, 'M226,70 C244,120 254,220 256,300 L244,300 C240,220 236,130 226,70 Z', 0.16) + L('M60,198 L52,192 M258,204 L266,198 M72,296 L52,302', dark(a, 0.3), 3),
      front: P(front, a) + P(lk, a) + MIRROR(P(lk, a)) + hl(a, 'M100,80 C104,62 118,48 136,42 C120,56 108,68 100,80 Z', 0.22) + sh(a, 'M206,40 C228,58 240,92 240,128 L232,128 C230,96 222,64 206,40 Z', 0.16) +
        L('M110,42 L94,32 M204,40 L220,30', dark(a, 0.3), 3) + strands('M104,66 L112,86 M172,46 L178,66 M74,170 L72,214 M246,176 L248,214', a, 0.45),
    };
  },
  // Straight long hair with a soft fringe.
  long: (c) => {
    const a = c.a;
    return {
      back: P(LONG_BACK, a) + backShade(a) + strands('M110,150 L104,290 M216,150 L222,290', a, 0.35),
      front: lock(a, LOCK) + dome(a, BANGS) + hlDome(a) + shDome(a) + bangLines(a) + strands('M120,70 C130,56 146,48 160,48 M176,50 C190,54 204,64 212,76 M80,160 L78,210', a),
    };
  },
  // High ponytail falling down the right side (kept inside x <= 266 for the thumbnail crop).
  ponytail: (c) => {
    const a = c.a, b = c.b || '#ef4444';
    const tail = 'M222,100 C250,96 268,140 266,196 C264,246 254,290 240,312 C232,318 224,310 228,300 C244,272 250,214 240,176 C236,152 230,126 222,116 Z';
    const hair = 'C240,110 234,100 222,100 C204,100 192,108 180,106 C166,104 150,104 136,100 C122,96 110,96 100,104 C90,110 82,118 80,128';
    return {
      back: P(tail, a) + sh(a, 'M250,150 C268,190 264,250 242,300 L236,306 C254,260 258,200 250,150 Z', 0.16) + hl(a, 'M240,118 C250,124 256,140 258,160 C250,144 246,130 240,118 Z', 0.3) + strands('M244,150 C254,200 252,250 238,296', a, 0.4),
      front: dome(a, hair) + hlDome(a) + shDome(a) + strands('M120,60 C150,44 196,46 226,78 M136,98 C160,88 200,86 226,94', a) + tie(238, 104, 11, 8, b),
    };
  },
  // Chin-length bob with a heavy fringe.
  bob: (c) => {
    const a = c.a;
    const back = 'M78,128 C78,56 108,36 160,36 C212,36 242,56 242,128 L250,210 C248,232 72,232 70,210 Z';
    const side = 'M80,118 C62,150 62,192 78,214 C88,226 106,222 108,206 C100,192 98,160 100,122 Z';
    return {
      back: P(back, a) + sh(a, 'M232,70 C246,120 250,180 250,210 L240,214 C240,180 238,120 232,70 Z', 0.14),
      front: P(side, a) + MIRROR(P(side, a)) + MIRROR(sh(a, 'M236,150 C242,180 242,200 234,214 C226,210 224,190 226,170 C228,160 230,154 236,150 Z', 0.14)) + dome(a, BANGS) + hlDome(a) + shDome(a) + bangLines(a) +
        strands('M118,66 C130,52 146,46 160,46 M176,48 C190,52 204,62 212,74 M80,160 C76,180 76,196 80,206', a),
    };
  },
  // Centre part with two chained braids and bows (c.b). The braids live in `back` so a cap keeps them.
  braids: (c) => {
    const a = c.a, b = c.b || '#f472b6';
    const hair = 'C240,112 230,100 216,98 C200,96 182,88 164,80 L160,76 L156,80 C138,88 120,96 104,98 C90,100 80,112 80,128';
    const temple = 'M78,124 C74,134 76,146 86,152 C94,148 100,138 98,128 Z';
    return {
      back: braid(a, b) + MIRROR(braid(a, b)),
      front: dome(a, hair) + hlDome(a) + shDome(a) + strands('M158,56 C140,60 124,70 112,84 M162,56 C180,60 196,70 208,84 M160,76 L160,44', a, 0.55) +
        P(temple, a) + MIRROR(P(temple, a)),
    };
  },
  // Slick top bun with a hair tie (c.b) and small temple wisps; a nape piece in `back` keeps the head
  // covered when a cap hides hair.front. Bun top at y=16 (inside the thumbnail crop).
  bun: (c) => {
    const a = c.a, b = c.b || '#ef4444';
    const hair = 'C240,110 232,100 220,98 C200,96 176,92 160,94 C144,92 120,96 100,98 C88,100 80,112 80,128';
    return {
      back: P('M86,130 C82,170 88,200 108,216 L212,216 C232,200 238,170 234,130 Z', a) + sh(a, 'M226,140 C234,172 228,200 212,216 L200,216 C220,200 228,172 226,140 Z', 0.14),
      front: dome(a, hair) + hlDome(a) + shDome(a) + strands('M108,70 C128,52 148,44 160,44 M212,70 C192,52 172,44 160,44 M90,122 C82,130 84,142 92,148 M230,122 C238,130 236,142 228,148', a) +
        C(160, 40, 24, a) + hl(a, 'M144,32 C148,20 160,16 170,20 C158,20 150,26 144,32 Z', 0.35) + sh(a, 'M172,18 C184,24 188,42 180,56 C184,42 180,28 172,18 Z', 0.16) +
        strands('M148,36 C154,26 170,28 172,40 C170,50 154,50 150,42', a, 0.55) + R(140, 54, 40, 10, 5, b, { stroke: dark(b, 0.4) }) + HL('M144,56 L168,56 L166,59 L144,59 Z', 0.4),
    };
  },
  // Long wavy hair with scalloped edges.
  wavy: (c) => {
    const a = c.a;
    const back = 'M82,128 Q62,146 76,164 Q56,186 74,206 Q54,228 72,248 Q52,270 70,290 Q58,310 78,318 Q96,334 114,318 Q130,334 146,318 Q160,334 174,318 Q190,334 206,318 Q224,334 242,318 ' +
      'Q262,310 250,290 Q268,270 248,248 Q266,228 246,206 Q264,186 244,164 Q258,146 238,128 C238,56 212,36 160,36 C108,36 82,56 82,128 Z';
    const lk = 'M80,116 Q56,142 72,166 Q52,192 72,214 Q56,236 78,250 C88,256 100,250 100,240 C96,200 96,156 100,118 Z';
    const hair = 'Q234,110 226,104 Q206,116 186,104 Q170,116 152,104 Q134,116 114,104 Q96,116 86,104 Q82,112 80,128';
    return {
      back: P(back, a) + sh(a, 'M230,70 C248,130 254,230 250,300 L238,306 C244,230 240,130 230,70 Z', 0.14) + hl(a, 'M90,76 C100,52 124,42 150,40 C120,56 104,72 90,76 Z', 0.26) +
        strands('M104,160 Q92,190 104,220 Q92,250 104,280 M216,160 Q228,190 216,220 Q228,250 216,280', a, 0.35),
      front: lock(a, lk) + dome(a, hair) + hlDome(a) + shDome(a) + strands('M118,70 C130,54 146,46 160,46 M176,48 C190,54 204,64 212,76 M86,150 Q80,170 86,190 Q80,210 86,230', a),
    };
  },
  // Two pigtails swinging out from the sides, tied with c.b (tails stay inside x 52..268 for the thumbnail crop).
  pigtails: (c) => {
    const a = c.a, b = c.b || '#facc15';
    const tail = 'M76,118 C52,136 48,196 58,246 C62,266 74,270 80,258 C88,246 84,232 82,216 C80,186 84,150 94,126 Z';
    const hair = 'C240,110 232,102 222,104 C206,108 196,100 184,106 C170,112 150,112 136,106 C124,100 114,108 98,104 C88,102 80,114 80,128';
    return {
      back: P(tail, a) + MIRROR(P(tail, a)) + MIRROR(sh(a, 'M58,150 C50,190 50,230 62,256 L70,250 C62,226 58,190 58,150 Z', 0.16)) + hl(a, 'M66,150 C60,170 58,196 62,220 C56,196 58,170 66,150 Z', 0.3) +
        strands('M68,170 C62,200 62,230 68,250', a, 0.4) + MIRROR(strands('M68,170 C62,200 62,230 68,250', a, 0.4)),
      front: dome(a, hair) + hlDome(a) + shDome(a) + strands('M118,68 C130,54 146,46 160,46 M176,48 C190,54 204,64 212,76 M132,104 Q160,96 188,104', a) + tie(80, 126, 9, 8, b) + MIRROR(tie(80, 126, 9, 8, b)),
    };
  },
};

// ---- catalog ---------------------------------------------------------------------------------
const TIER = { common: 1, rare: 4, epic: 8 };
const colours = () => Object.keys(HAIR_COLORS).map(k => [k, { a: HAIR_COLORS[k][0] }, HAIR_COLORS[k][1], HAIR_COLORS[k][2], { tier: TIER[HAIR_COLORS[k][2]] || 1 }]);
const BOY = [
  ['short', { en: 'Short Cut', ar: 'قصة قصيرة' }], ['spiky', { en: 'Spiky Top', ar: 'شعر شائك' }], ['curly', { en: 'Curly Top', ar: 'شعر مجعد' }], ['side', { en: 'Side Swoop', ar: 'فرق جانبي' }],
  ['buzz', { en: 'Buzz Cut', ar: 'قصة حلاقة' }], ['mohawk', { en: 'Mohawk', ar: 'موهوك' }], ['pompadour', { en: 'Pompadour', ar: 'بومبادور' }],
];
const GIRL = [
  ['long', { en: 'Long Hair', ar: 'شعر طويل' }], ['ponytail', { en: 'Ponytail', ar: 'ذيل حصان' }], ['bob', { en: 'Bob Cut', ar: 'قصة بوب' }], ['braids', { en: 'Twin Braids', ar: 'ضفيرتان' }],
  ['bun', { en: 'Top Bun', ar: 'كعكة شعر' }], ['wavy', { en: 'Wavy Locks', ar: 'شعر مموج' }], ['pigtails', { en: 'Pigtails', ar: 'ذيلان' }],
];
export const ITEMS = [
  single('hair', 'messy', 'dull', { a: '#5b4a3a' }, { en: 'Scruffy Mop', ar: 'شعر مبعثر' }, 'rags', { tier: 0, gender: 'boy' }),
  single('hair', 'messyg', 'dull', { a: '#5b4a3a' }, { en: 'Tangled Mane', ar: 'شعر متشابك' }, 'rags', { tier: 0, gender: 'girl' }),
  ...BOY.flatMap(([tpl, name]) => variants('hair', tpl, name, colours(), { gender: 'boy' })),
  ...GIRL.flatMap(([tpl, name]) => variants('hair', tpl, name, colours(), { gender: 'girl' })),
];
