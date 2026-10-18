// Shared drawing kit for the "sticker" art style used by EVERY asset in the game:
// flat base colour + darker outline + a soft shadow overlay + a soft highlight overlay. No gradients.
import { dark, light, shade } from '../util.js';
export { dark, light, shade };

const attrs = o => Object.entries(o).filter(([, v]) => v !== undefined && v !== null && v !== false).map(([k, v]) => ` ${k}="${v}"`).join('');

// Outlined path. o: {sw, stroke, op, extra}
export const P = (d, fill, o = {}) =>
  `<path d="${d}" fill="${fill}" stroke="${o.stroke ?? dark(fill)}" stroke-width="${o.sw ?? 3.5}" stroke-linejoin="round" stroke-linecap="round"${attrs({ opacity: o.op, ...(o.extra || {}) })}/>`;
// Plain filled path, no outline.
export const F = (d, fill, o = {}) => `<path d="${d}" fill="${fill}"${attrs({ opacity: o.op, ...(o.extra || {}) })}/>`;
// Shadow / highlight overlays (no outline).
export const SH = (d, op = 0.14) => `<path d="${d}" fill="#000" opacity="${op}"/>`;
export const HL = (d, op = 0.28) => `<path d="${d}" fill="#fff" opacity="${op}"/>`;
// Outlined circle / ellipse / rounded rect.
export const C = (cx, cy, r, fill, o = {}) =>
  `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${fill}" stroke="${o.stroke ?? dark(fill)}" stroke-width="${o.sw ?? 3.5}"${attrs({ opacity: o.op, ...(o.extra || {}) })}/>`;
export const E = (cx, cy, rx, ry, fill, o = {}) =>
  `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="${fill}" stroke="${o.stroke ?? dark(fill)}" stroke-width="${o.sw ?? 3.5}"${attrs({ opacity: o.op, ...(o.extra || {}) })}/>`;
export const R = (x, y, w, h, rx, fill, o = {}) =>
  `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${rx}" fill="${fill}" stroke="${o.stroke ?? dark(fill)}" stroke-width="${o.sw ?? 3.5}" stroke-linejoin="round"${attrs({ opacity: o.op, ...(o.extra || {}) })}/>`;
// Stroke-only line / polyline.
export const L = (d, stroke, sw = 3.5, o = {}) =>
  `<path d="${d}" fill="none" stroke="${stroke}" stroke-width="${sw}" stroke-linecap="round" stroke-linejoin="round"${attrs({ opacity: o.op, 'stroke-dasharray': o.dash, ...(o.extra || {}) })}/>`;
// Text (for jersey numbers etc.)
export const T = (x, y, txt, size, fill, o = {}) =>
  `<text x="${x}" y="${y}" font-family="'Poppins','Baloo 2','Segoe UI',Arial,sans-serif" font-weight="800" font-size="${size}" text-anchor="middle" fill="${fill}"${attrs({ stroke: o.stroke, 'stroke-width': o.sw, 'paint-order': o.stroke ? 'stroke' : undefined, opacity: o.op })}>${txt}</text>`;
export const G = (inner, o = {}) => `<g${attrs(o)}>${inner}</g>`;
// Mirror a fragment across the avatar's vertical centre (x=160, viewBox width 320).
export const MIRROR = s => `<g transform="translate(320 0) scale(-1 1)">${s}</g>`;
// Mirror across an arbitrary centre x (for 100x100 icons use 50).
export const MIRROR_AT = (s, cx) => `<g transform="translate(${cx * 2} 0) scale(-1 1)">${s}</g>`;
// 5-point star path centred at cx,cy with outer radius r.
export function starPath(cx, cy, r, inner = 0.45, points = 5) {
  let d = '';
  for (let i = 0; i < points * 2; i++) {
    const rr = i % 2 === 0 ? r : r * inner;
    const a = -Math.PI / 2 + (i * Math.PI) / points;
    d += (i ? 'L' : 'M') + (cx + rr * Math.cos(a)).toFixed(1) + ',' + (cy + rr * Math.sin(a)).toFixed(1);
  }
  return d + 'Z';
}
export const STAR = (cx, cy, r, fill, o = {}) => P(starPath(cx, cy, r, o.inner ?? 0.45), fill, o);
// Heart path centred at cx,cy with size s.
export const heartPath = (cx, cy, s) =>
  `M${cx},${cy + s * 0.9} C${cx - s * 1.6},${cy - s * 0.2} ${cx - s * 0.9},${cy - s * 1.3} ${cx},${cy - s * 0.4} C${cx + s * 0.9},${cy - s * 1.3} ${cx + s * 1.6},${cy - s * 0.2} ${cx},${cy + s * 0.9} Z`;
// Soft sparkle (4-point) used for shine accents.
export const SPARK = (cx, cy, r, fill = '#fff', op = 0.9) =>
  `<path d="M${cx},${cy - r} Q${cx},${cy} ${cx + r},${cy} Q${cx},${cy} ${cx},${cy + r} Q${cx},${cy} ${cx - r},${cy} Q${cx},${cy} ${cx},${cy - r} Z" fill="${fill}" opacity="${op}"/>`;

// Palette presets used by many catalog colour variants: [key, hex, {en, ar}]
export const COLORS = {
  red: ['#ef4444', { en: 'Red', ar: 'أحمر' }],
  blue: ['#3b82f6', { en: 'Blue', ar: 'أزرق' }],
  green: ['#22c55e', { en: 'Green', ar: 'أخضر' }],
  yellow: ['#facc15', { en: 'Yellow', ar: 'أصفر' }],
  purple: ['#a855f7', { en: 'Purple', ar: 'بنفسجي' }],
  pink: ['#f472b6', { en: 'Pink', ar: 'وردي' }],
  orange: ['#f97316', { en: 'Orange', ar: 'برتقالي' }],
  teal: ['#14b8a6', { en: 'Teal', ar: 'تركوازي' }],
  black: ['#2b2b33', { en: 'Black', ar: 'أسود' }],
  white: ['#f8fafc', { en: 'White', ar: 'أبيض' }],
  grey: ['#9ca3af', { en: 'Grey', ar: 'رمادي' }],
  navy: ['#1e3a8a', { en: 'Navy', ar: 'كحلي' }],
  brown: ['#92400e', { en: 'Brown', ar: 'بني' }],
  beige: ['#e7d3b1', { en: 'Beige', ar: 'بيج' }],
  mint: ['#6ee7b7', { en: 'Mint', ar: 'نعناعي' }],
  sky: ['#7dd3fc', { en: 'Sky', ar: 'سماوي' }],
  gold: ['#f59e0b', { en: 'Gold', ar: 'ذهبي' }],
  silver: ['#cbd5e1', { en: 'Silver', ar: 'فضي' }],
  denim: ['#3b5998', { en: 'Denim', ar: 'جينز' }],
  olive: ['#6b8e23', { en: 'Olive', ar: 'زيتي' }],
  maroon: ['#7f1d1d', { en: 'Maroon', ar: 'عنابي' }],
  cream: ['#fdf6e3', { en: 'Cream', ar: 'كريمي' }],
  lilac: ['#c4b5fd', { en: 'Lilac', ar: 'ليلكي' }],
  coral: ['#fb7185', { en: 'Coral', ar: 'مرجاني' }],
};
export const SKIN = ['#fde3c8', '#f5cba7', '#e0a076', '#c17f55', '#8d5a3a', '#5c3a24'];
export const HAIR_COLORS = {
  black: ['#2b2118', { en: 'Black', ar: 'أسود' }, 'common'],
  brown: ['#6b3f1d', { en: 'Brown', ar: 'بني' }, 'common'],
  blonde: ['#e8c35a', { en: 'Blonde', ar: 'أشقر' }, 'common'],
  red: ['#b5401f', { en: 'Red', ar: 'أحمر' }, 'rare'],
  pink: ['#f472b6', { en: 'Pink', ar: 'وردي' }, 'epic'],
  blue: ['#3b82f6', { en: 'Blue', ar: 'أزرق' }, 'epic'],
  white: ['#e5e7eb', { en: 'Silver', ar: 'فضي' }, 'epic'],
};
export const RARITY = {
  rags: { color: '#6b7280', price: 0, value: 0, weight: 0 },
  common: { color: '#94a3b8', price: 250, value: 60, weight: 60 },
  rare: { color: '#3b82f6', price: 700, value: 180, weight: 28 },
  epic: { color: '#a855f7', price: 1800, value: 450, weight: 10 },
  legendary: { color: '#f59e0b', price: 5000, value: 1200, weight: 2 },
};

// Catalog helper: build colour variants of one template.
// cat, tpl, variants: array of [key, {a,b,c} | hex, name{en,ar}, rarity, extra]
export function variants(cat, tpl, baseName, list, def = {}) {
  return list.map(([key, col, cname, rarity, extra]) => {
    const colors = typeof col === 'string' ? { a: col } : col;
    const nm = cname ? { en: `${cname.en} ${baseName.en}`, ar: `${baseName.ar} ${cname.ar}` } : baseName;
    return { id: `${cat}_${tpl}_${key}`, cat, tpl, colors, rarity: rarity || def.rarity || 'common', name: nm, gender: def.gender || 'any', tier: def.tier ?? 1, ...(extra || {}) };
  });
}
export function single(cat, tpl, key, colors, name, rarity = 'rare', def = {}) {
  return { id: `${cat}_${tpl}_${key}`, cat, tpl, colors: typeof colors === 'string' ? { a: colors } : colors, rarity, name, gender: def.gender || 'any', tier: def.tier ?? 1, ...def };
}
