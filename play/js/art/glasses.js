// Glasses (category 'glasses'). Lenses sit on the eye whites: centres (130,152)/(190,152), whites rx13 ry16 → y 136..168.
// Draw the LEFT lens, MIRROR() it for the right. Frames are chunky: dark rim under a coloured stroke.
import { P, F, SH, HL, C, R, L, MIRROR, SPARK, starPath, COLORS, variants, single, dark, light } from './_kit.js';

// outlined stroke (dark rim + colour) — the sticker "outline" for thin frame parts
const OL = (d, col, sw, o = {}) => L(d, dark(col), sw + 3.5, o) + L(d, col, sw, o);
// closed lens: tinted glass (op) + outlined frame around it
const LENS = (d, glass, op, frame, sw) => F(d, glass, { op }) + P(d, 'none', { stroke: dark(frame), sw: sw + 3.5 }) + P(d, 'none', { stroke: frame, sw });
const circ = (cx, cy, r) => `M${cx - r},${cy} a${r},${r} 0 1 0 ${r * 2},0 a${r},${r} 0 1 0 ${-r * 2},0 Z`;
// temple arm from the lens edge back to the ear (ear centre 84,146)
const TEMPLE = (x, y, col, sw) => OL(`M${x},${y} L88,${y - 4}`, col, sw);

// lens shapes (left eye)
const WAYFARER = 'M108,135 L154,135 Q158,135 157,139 L153,161 Q151,170 141,170 L120,170 Q110,170 108,161 L104,139 Q103,135 108,135 Z';
const SQUARE = 'M108,135 L152,135 Q156,135 156,139 L156,166 Q156,170 152,170 L108,170 Q104,170 104,166 L104,139 Q104,135 108,135 Z';
const TEAR = 'M105,136 L156,136 Q159,136 158,140 L155,156 Q150,175 131,175 Q112,175 108,156 L104,140 Q103,136 105,136 Z';
const HEART = 'M130,172 C112,161 104,151 104,142 C104,134 111,129 119,129 C124,129 128,131 130,135 C132,131 136,129 141,129 C149,129 156,134 156,142 C156,151 148,161 130,172 Z';
const VISOR = 'M100,136 L220,136 Q228,136 228,144 L224,165 Q222,172 214,172 L106,172 Q98,172 96,165 L92,144 Q92,136 100,136 Z';

export const TEMPLATES = {
  sunglasses: (c) => {
    const frame = c.a, glass = c.b || '#1e293b';
    const left = TEMPLE(104, 146, frame, 4) + LENS(WAYFARER, glass, 1, frame, 4)
      + SH('M126,150 Q142,152 151,162 Q149,170 141,170 L124,170 Z', 0.3)
      + HL('M113,140 L125,140 L117,165 L110,159 Z', 0.4) + HL('M131,140 L137,140 L126,163 L122,160 Z', 0.22);
    return { front: left + MIRROR(left) + OL('M157,145 Q160,141 163,145', frame, 4) + OL('M105,136 L156,136', frame, 5) + MIRROR(OL('M105,136 L156,136', frame, 5)) };
  },
  round: (c) => {
    const col = c.a, tint = c.b || '#bae6fd';
    const left = TEMPLE(111, 150, col, 3) + LENS(circ(130, 152, 19), tint, 0.35, col, 3)
      + SH('M136,164 Q146,160 148,150 Q149,162 140,169 Z', 0.12)
      + HL('M116,143 Q121,135 131,134 Q123,138 118,148 Z', 0.65) + C(113, 156, 1.6, light(col, 0.6), { sw: 0 });
    return { front: left + MIRROR(left) + OL('M149,149 Q160,141 171,149', col, 3) };
  },
  square: (c) => {
    const col = c.a, tint = c.b || '#dbeafe';
    const left = TEMPLE(104, 146, col, 4.5) + LENS(SQUARE, tint, 0.2, col, 4.5)
      + SH('M140,158 L153,150 L153,166 Q153,168 150,168 L130,168 Z', 0.12)
      + HL('M108,139 L120,139 L111,164 L107,160 Z', 0.55) + HL('M125,139 L130,139 L118,164 L114,163 Z', 0.3);
    return { front: left + MIRROR(left) + OL('M156,146 L164,146', col, 4.5) + OL('M106,136 L154,136', col, 5.5) + MIRROR(OL('M106,136 L154,136', col, 5.5)) };
  },
  star: (c) => {
    const col = c.a, tint = c.b || '#fde68a';
    const left = TEMPLE(105, 150, col, 3.5) + LENS(starPath(130, 152, 28, 0.6), tint, 0.55, col, 3.5)
      + SH('M136,162 L152,174 L142,170 Z', 0.12)
      + HL('M118,140 Q124,134 130,134 L128,142 L120,146 Z', 0.6) + SPARK(118, 136, 5);
    return { front: left + MIRROR(left) + OL('M156,144 L164,144', col, 3.5) };
  },
  heart: (c) => {
    const col = c.a, tint = c.b || '#fbcfe8';
    const left = TEMPLE(105, 146, col, 3.5) + LENS(HEART, tint, 0.55, col, 3.5)
      + SH('M136,160 Q146,152 150,146 Q148,156 138,166 Z', 0.12)
      + HL('M110,140 Q112,133 119,133 Q114,138 113,146 Z', 0.7) + SPARK(144, 136, 4.5);
    return { front: left + MIRROR(left) + OL('M156,146 L164,146', col, 3.5) };
  },
  threed: (c) => {
    const frame = c.a, red = c.b || '#ef4444', cyan = c.c || '#22d3ee';
    const lens = (glass) => TEMPLE(104, 146, frame, 4) + LENS(SQUARE, glass, 0.55, frame, 4)
      + SH('M140,160 L153,152 L153,166 Q153,168 150,168 L132,168 Z', 0.1) + HL('M108,139 L117,139 L110,160 L107,156 Z', 0.6);
    return { front: lens(red) + MIRROR(lens(cyan)) + OL('M156,146 L164,146', frame, 4) + OL('M106,136 L154,136', frame, 5) + MIRROR(OL('M106,136 L154,136', frame, 5)) + C(108, 139, 1.8, dark(frame, 0.2), { sw: 0 }) + MIRROR(C(108, 139, 1.8, dark(frame, 0.2), { sw: 0 })) };
  },
  aviator: (c) => {
    const col = c.a, glass = c.b || '#78350f';
    const left = TEMPLE(104, 142, col, 2.5) + LENS(TEAR, glass, 0.85, col, 2.5)
      + SH('M126,160 Q146,160 154,150 Q150,172 132,174 Z', 0.25)
      + HL('M110,141 L124,141 L116,168 L110,160 Z', 0.4) + HL('M130,141 L135,141 L124,170 L120,168 Z', 0.22);
    return { front: left + MIRROR(left) + OL('M157,141 Q160,137 163,141', col, 2.5) + OL('M157,148 Q160,152 163,148', col, 2.5) };
  },
  visor: (c) => {
    const col = c.a, mount = c.b || '#334155';
    // ear pod: covers the whole ear circle (84,146) r13 + outline, so no skin crescent pokes out beside the mount
    const side = R(68, 130, 32, 36, 11, mount) + R(74, 136, 14, 24, 5, dark(mount, 0.3), { sw: 0 })
      + HL('M72,134 L82,134 L78,148 L72,148 Z', 0.3) + SH('M92,134 L98,134 L98,162 L92,162 Z', 0.14)
      + L('M78,141 L78,150', col, 2, { op: 0.85 }) + C(80, 158, 2.5, '#f43f5e', { sw: 0 });
    const band = P(VISOR, col, { sw: 4, op: 0.7 })
      + HL('M102,140 L148,140 L134,166 L106,166 Z', 0.35) + HL('M160,140 L172,140 L160,166 L150,166 Z', 0.2)
      + SH('M170,166 L222,166 Q218,172 214,172 L168,172 Z', 0.18)
      + L('M106,160 L214,160', '#fff', 1.5, { op: 0.5 }) + L('M110,150 L210,150', '#fff', 1, { op: 0.25 }) + SPARK(116, 146, 6) + SPARK(206, 150, 3.5);
    return { front: side + MIRROR(side) + band };
  },
  eyepatch: (c) => {
    const col = c.a, strap = c.b || '#111827';
    const patch = P('M108,134 Q130,124 152,134 Q158,152 148,172 Q130,182 112,172 Q102,152 108,134 Z', col)
      + SH('M136,170 Q150,160 152,146 Q156,162 148,172 Q140,178 130,178 Z', 0.3)
      + HL('M112,139 Q122,130 134,130 Q120,134 114,148 Z', 0.28)
      + L('M116,160 L122,166 M122,160 L116,166', '#fff', 2.2, { op: 0.65 });
    return { front: L('M110,140 L84,126', strap, 5) + L('M150,136 L232,106', strap, 5) + patch };
  },
  // Scouter lens (template key kept as 'monocle'): dark tech ring over the right eye on a slim temple arm to the right ear
  // with a speaker pod, a cyan HUD bar + data ticks inside the lens and a green sensor LED on the ring.
  monocle: (c) => {
    const col = c.a, tint = c.b || '#a5f3fc', hud = c.c || '#22d3ee';
    const arm = MIRROR(TEMPLE(109, 150, col, 2.5) + R(90, 140, 15, 11, 4, col, { sw: 2 }) + C(97, 145.5, 1.8, hud, { sw: 0 }) + HL('M92,142 L100,142 L98,145 L92,145 Z', 0.3));
    const ring = LENS(circ(190, 152, 21), tint, 0.35, col, 4)
      + SH('M196,166 Q208,160 210,150 Q211,164 200,171 Z', 0.12)
      + HL('M175,144 Q180,134 191,133 Q182,138 178,150 Z', 0.6)
      + C(190, 152, 16.5, 'none', { stroke: light(tint, 0.4), sw: 1.2, op: 0.7 })
      + R(186, 139, 12, 5.5, 2, hud, { stroke: dark(hud, 0.35), sw: 1.4 }) + HL('M188,140.5 L196,140.5 L196,142 L188,142 Z', 0.6)
      + L('M176,148 L176,156 M204,148 L204,156', hud, 1.3, { op: 0.55 })
      + L('M178,160 L186,160', hud, 1.8, { op: 0.9 }) + L('M181,164 L189,164', hud, 1.3, { op: 0.6 })
      + C(207, 136, 3.5, col, { sw: 2 }) + C(207, 136, 1.4, '#4ade80', { sw: 0 }) + SPARK(174, 140, 3.5);
    return { front: arm + ring };
  },
  // ---- v2 additions: modern tech + sport eyewear ---------------------------------------------------------------------
  // VR headset: white shell, black faceplate covering both eyes, side straps wrapping over the ears, LED light bar.
  vr_headset: (c) => {
    const a = c.a || '#f8fafc', b = c.b || '#1e293b', led = c.c || '#22d3ee', strap = c.d || '#334155';
    const BODY = 'M108,120 L212,120 Q228,120 228,136 L228,170 Q228,186 212,186 L108,186 Q92,186 92,170 L92,136 Q92,120 108,120 Z';
    const PLATE = 'M112,130 L208,130 Q218,130 218,140 L218,166 Q218,176 208,176 L112,176 Q102,176 102,166 L102,140 Q102,130 112,130 Z';
    const side = P('M98,128 L76,132 Q66,134 66,150 Q66,166 76,168 L98,172 Z', strap) + HL('M78,133 L94,131 L94,137 L78,139 Z', 0.25) + SH('M74,162 L96,166 L96,172 L76,168 Z', 0.2)
      + L('M78,142 L78,158', light(strap, 0.3), 2, { op: 0.7 });
    const cam = C(112, 140, 3.6, '#0f172a', { stroke: '#64748b', sw: 1.6 }) + C(111, 139, 1.2, '#fff', { sw: 0, op: 0.8 });
    const CROWN = 'M88,128 C88,66 116,44 160,44 C204,44 232,66 232,128';
    const crown = L(CROWN, dark(strap), 13) + L(CROWN, strap, 9) + R(150, 40.5, 20, 7, 3, light(strap, 0.25), { sw: 0 }) + L('M100,70 C104,62 110,56 118,51', light(strap, 0.35), 2, { op: 0.6 });
    // foam face gasket under the shell (gives the headset depth against the cheeks) + top vents + a small brand ring
    const gasket = P('M102,180 L218,180 Q226,180 224,188 L220,196 L100,196 L96,188 Q94,180 102,180 Z', dark(strap, 0.2), { sw: 3 }) + SH('M100,189 L220,189 L218,195 L102,195 Z', 0.2);
    const vents = [168, 180, 192].map(x => R(x, 123.5, 8, 3, 1.5, dark(a, 0.18), { sw: 0 })).join('');
    const front = crown + side + MIRROR(side) + gasket + P(BODY, a)
      + SH('M206,122 L226,122 L226,184 L210,184 Z', 0.12) + SH('M96,178 L224,178 L222,185 L98,185 Z', 0.1) + HL('M96,124 L150,122 L144,130 L98,132 Z', 0.5)
      + R(146, 122.5, 28, 5, 2.5, dark(a, 0.15), { sw: 0 }) + vents + C(160, 181, 2.6, 'none', { stroke: dark(a, 0.3), sw: 1.6 })
      + P(PLATE, b, { stroke: dark(b, 0.5), sw: 3 })
      + HL('M108,134 L142,134 L124,172 L104,172 Z', 0.16) + HL('M118,134 L126,134 L108,172 L102,164 Z', 0.3) + HL('M160,134 L170,134 L150,172 L142,172 Z', 0.1)
      + L('M108,170 L212,170', led, 7, { op: 0.35 }) + L('M108,170 L212,170', led, 3) + cam + MIRROR(cam) + SPARK(214, 130, 4);
    return { front };
  },
  // Smart glasses: slim rectangular frames, a speaker pod on each temple, and a tiny HUD display in the right lens.
  smart_glasses: (c) => {
    const col = c.a, tint = c.b || '#e0f2fe', disp = c.c || '#22d3ee';
    const SLIM = 'M109,138 L152,138 Q156,138 156,142 L155,163 Q155,167 151,167 L110,167 Q106,167 105,163 L104,142 Q104,138 109,138 Z';
    const pod = R(90, 140, 15, 11, 4, col, { sw: 2 }) + C(97, 145.5, 1.8, disp, { sw: 0 }) + HL('M92,142 L100,142 L98,145 L92,145 Z', 0.3) + L('M92,148.5 L102,148.5', light(col, 0.4), 1.2, { op: 0.6 });
    const left = TEMPLE(104, 146, col, 2.5) + pod + LENS(SLIM, tint, 0.2, col, 2.5)
      + SH('M140,156 L153,150 L153,163 Q153,165 151,165 L132,165 Z', 0.1)
      + HL('M109,142 L121,142 L112,164 L108,160 Z', 0.5) + HL('M126,142 L131,142 L119,164 L115,163 Z', 0.25);
    const hud = F('M186,141 L194,141 L194,152 L186,152 Z', disp, { op: 0.2 }) + R(194, 141, 17, 11, 2.5, disp, { stroke: dark(disp, 0.35), sw: 1.6 })
      + HL('M196,143 L209,143 L209,146 L196,146 Z', 0.55) + L('M198,149 L206,149', '#fff', 1.5, { op: 0.9 }) + C(210.5, 141, 2.2, '#4ade80', { sw: 0 }) + SPARK(213, 139, 3.5);
    return { front: left + MIRROR(left) + OL('M156,146 L164,146', col, 2.5) + hud };
  },
  // Ski goggles: wide frame with top vents, mirrored one-piece lens with a nose notch, wide strap over the ears.
  ski_goggles: (c) => {
    const col = c.a, lens = c.b || '#7c3aed', strap = c.c || '#2b2b33';
    const FRAME = 'M104,126 L216,126 Q232,126 232,142 L228,168 Q224,182 206,182 L180,182 Q168,182 160,174 Q152,182 140,182 L114,182 Q96,182 92,168 L88,142 Q88,126 104,126 Z';
    const GLASS = 'M108,134 L212,134 Q223,134 223,145 L219,164 Q216,174 204,174 L182,174 Q170,174 160,167 Q150,174 138,174 L116,174 Q104,174 101,164 L97,145 Q97,134 108,134 Z';
    // strap centred on the ear (84,146) so no skin crescent peeks above it; top edge lit, two elastic lines + a tab
    const band = P('M96,132 L76,136 Q70,138 70,149 Q70,160 76,162 L96,166 Z', strap) + HL('M78,136 L94,134 L94,139 L78,141 Z', 0.25)
      + L('M76,143 L92,141 M76,156 L92,158', light(strap, 0.35), 2, { op: 0.6 }) + R(78, 146, 9, 7, 2, light(strap, 0.5), { sw: 0 });
    const vents = [116, 128, 140].map(x => R(x, 127.5, 8, 3, 1.5, dark(col, 0.3), { sw: 0 })).join('');
    const front = band + MIRROR(band) + P(FRAME, col) + vents + MIRROR(vents) + L('M106,131.5 L214,131.5', light(col, 0.5), 1.5, { op: 0.55 })
      + SH('M206,130 L226,130 L224,170 Q220,180 206,180 Z', 0.12) + HL('M92,140 Q92,130 104,128 L112,130 Q100,132 98,144 Z', 0.35)
      + P(GLASS, lens, { stroke: dark(lens, 0.5), sw: 2.5 })
      + HL('M104,138 L130,138 L112,172 L102,168 Z', 0.45) + HL('M140,138 L150,138 L126,172 L118,172 Z', 0.25) + HL('M190,138 L200,138 L176,172 L170,172 Z', 0.12)
      + SH('M170,160 Q200,172 218,150 L219,164 Q216,174 204,174 L182,174 Z', 0.22) + SPARK(110, 142, 4);
    return { front };
  },
  // Sport shield: one-piece wrap lens with a thick half-rim brow bar, nose notch, thick temples and a tiny logo.
  shield_sunglasses: (c) => {
    const col = c.a, glass = c.b || '#1e293b';
    const SHIELD = 'M98,136 L222,136 Q230,136 229,143 L223,163 Q219,175 206,175 L174,175 Q165,175 160,167 Q155,175 146,175 L114,175 Q101,175 97,163 L91,143 Q90,136 98,136 Z';
    const temple = TEMPLE(96, 142, col, 5);
    const front = temple + MIRROR(temple) + F(SHIELD, glass, { op: 0.9 }) + P(SHIELD, 'none', { stroke: dark(glass, 0.5), sw: 3 })
      + HL('M102,142 L120,142 L108,170 L100,165 Z', 0.4) + HL('M128,142 L136,142 L122,170 L116,170 Z', 0.2) + HL('M186,142 L192,142 L178,170 L172,170 Z', 0.1)
      + SH('M174,160 Q204,172 224,150 L223,163 Q219,175 206,175 L174,175 Z', 0.25)
      + OL('M94,137 L226,137', col, 6) + L('M106,137 L116,137 M124,137 L134,137', light(col, 0.4), 1.5, { op: 0.7 }) + OL('M153,141 Q160,148 167,141', col, 2.5)
      + F('M112,165 L123,161 L119,167 Z', '#fff', { op: 0.85 });
    return { front };
  },
  // Clear frames: translucent acetate. The rim is a thin dark edge, the SKIN restored underneath, then the colour at 60 %
  // so the face shows through, plus a white gloss line; hinge rivets and a barely-tinted lens. The temple stays solid
  // because it crosses hair side-locks and the ear.
  clear_frames: (c, ctx) => {
    const col = c.a, tint = c.b || '#f0f9ff', sk = ctx.skin;
    const CLR = 'M109,134 L152,134 Q157,134 157,139 L155,165 Q154,171 148,171 L112,171 Q106,171 105,165 L103,139 Q103,134 109,134 Z';
    const edge = (d, sw) => L(d, dark(col, 0.35), sw + 3);
    const rim = (d, sw) => edge(d, sw) + L(d, sk, sw) + L(d, col, sw, { op: 0.65 }) + L(d, '#fff', sw * 0.35, { op: 0.55 });
    const ARM = 'M104,146 L88,142';
    const temple = edge(ARM, 4) + L(ARM, col, 4) + L(ARM, '#fff', 1.4, { op: 0.45 });
    const left = temple + F(CLR, tint, { op: 0.12 }) + rim(CLR, 5)
      + HL('M110,139 L122,139 L112,166 L107,160 Z', 0.3) + SH('M140,158 L152,150 L151,166 Q150,168 147,168 L130,168 Z', 0.06)
      + C(108, 139, 1.8, dark(col, 0.5), { sw: 0 }) + C(152, 139, 1.8, dark(col, 0.5), { sw: 0 }) + SPARK(113, 137, 3);
    return { front: left + MIRROR(left) + rim('M157,145 Q160,141 163,145', 4) };
  },
};

export const ITEMS = [
  ...variants('glasses', 'sunglasses', { en: 'Shades', ar: 'نظارة شمس' }, [
    ['black', { a: COLORS.black[0], b: '#1e293b' }, COLORS.black[1], 'common'],
    ['red', { a: COLORS.red[0], b: '#1e293b' }, COLORS.red[1], 'common'],
    ['white', { a: COLORS.white[0], b: '#1e293b' }, COLORS.white[1], 'common'],
    ['pink', { a: COLORS.pink[0], b: '#4c1d95' }, COLORS.pink[1], 'rare'],
  ], { tier: 1 }),
  ...variants('glasses', 'round', { en: 'Round Specs', ar: 'نظارة دائرية' }, [
    ['gold', { a: COLORS.gold[0] }, COLORS.gold[1], 'common'],
    ['black', { a: COLORS.black[0] }, COLORS.black[1], 'common'],
    ['teal', { a: COLORS.teal[0], b: '#99f6e4' }, COLORS.teal[1], 'rare'],
  ], { tier: 2 }),
  ...variants('glasses', 'square', { en: 'Nerd Frames', ar: 'نظارة مربعة' }, [
    ['black', { a: COLORS.black[0] }, COLORS.black[1], 'common'],
    ['red', { a: COLORS.red[0] }, COLORS.red[1], 'common'],
  ], { tier: 2 }),
  ...variants('glasses', 'star', { en: 'Star Shades', ar: 'نظارة نجوم' }, [
    ['gold', { a: '#f59e0b', b: '#fde68a' }, COLORS.gold[1], 'epic'],
    ['purple', { a: '#a855f7', b: '#e9d5ff' }, COLORS.purple[1], 'epic'],
  ], { tier: 6 }),
  single('glasses', 'heart', 'pink', { a: '#ec4899', b: '#fbcfe8' }, { en: 'Heart Shades', ar: 'نظارة قلوب' }, 'epic', { gender: 'girl', tier: 6 }),
  single('glasses', 'threed', 'classic', { a: '#f8fafc', b: '#ef4444', c: '#22d3ee' }, { en: '3D Specs', ar: 'نظارة 3D' }, 'rare', { tier: 3 }),
  ...variants('glasses', 'aviator', { en: 'Aviators', ar: 'نظارة طيار' }, [
    ['gold', { a: '#f59e0b', b: '#78350f' }, COLORS.gold[1], 'rare'],
    ['silver', { a: '#cbd5e1', b: '#2563eb' }, COLORS.silver[1], 'rare'],
  ], { tier: 4 }),
  single('glasses', 'visor', 'cyber', { a: '#22d3ee', b: '#334155' }, { en: 'Cyber Visor', ar: 'حاجب سايبر' }, 'legendary', { tier: 8 }),
  single('glasses', 'eyepatch', 'pirate', { a: '#1f2937', b: '#111827' }, { en: 'Pirate Patch', ar: 'عصابة قرصان' }, 'rare', { tier: 3 }),
  single('glasses', 'monocle', 'gold', { a: '#2b2b33', b: '#a5f3fc', c: '#22d3ee' }, { en: 'Scouter Lens', ar: 'عدسة سكاوتر' }, 'rare', { tier: 4 }),
  // ---- v2 additions ---------------------------------------------------------------------------------------------------
  single('glasses', 'vr_headset', 'pro', { a: '#f8fafc', b: '#1e293b', c: '#22d3ee', d: '#334155' }, { en: 'VR Pro Headset', ar: 'نظارة VR برو' }, 'legendary', { tier: 8 }),
  ...variants('glasses', 'smart_glasses', { en: 'Smart Specs', ar: 'نظارة ذكية' }, [
    ['black', { a: '#2b2b33', b: '#e0f2fe', c: '#22d3ee' }, COLORS.black[1], 'epic'],
    ['silver', { a: '#cbd5e1', b: '#e0f2fe', c: '#a855f7' }, COLORS.silver[1], 'epic'],
  ], { tier: 7 }),
  ...variants('glasses', 'ski_goggles', { en: 'Aspen Goggles', ar: 'نظارة تزلج' }, [
    ['white', { a: '#f8fafc', b: '#7c3aed', c: '#2b2b33' }, COLORS.white[1], 'rare'],
    ['orange', { a: '#f97316', b: '#0ea5e9', c: '#1e293b' }, COLORS.orange[1], 'rare'],
  ], { tier: 4 }),
  ...variants('glasses', 'shield_sunglasses', { en: 'Sport Shields', ar: 'نظارة رياضية' }, [
    ['black', { a: '#2b2b33', b: '#1e293b' }, COLORS.black[1], 'common'],
    ['white', { a: '#f8fafc', b: '#2563eb' }, COLORS.white[1], 'rare'],
    ['lime', { a: '#bef264', b: '#f97316' }, { en: 'Lime', ar: 'ليموني' }, 'rare'],
  ], { tier: 3 }),
  ...variants('glasses', 'clear_frames', { en: 'Clear Frames', ar: 'إطار شفاف' }, [
    ['crystal', { a: '#bfdbfe', b: '#f0f9ff' }, { en: 'Crystal', ar: 'كريستال' }, 'common'],
    ['rose', { a: '#f9a8d4', b: '#fdf2f8' }, { en: 'Rose', ar: 'وردي' }, 'rare'],
  ], { tier: 2 }),
];
