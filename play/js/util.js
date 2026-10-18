// Small shared helpers: colour math for the sticker art style, ids, rng, DOM.
export function hex2rgb(h) {
  h = h.replace('#', '');
  if (h.length === 3) h = h.split('').map(c => c + c).join('');
  const n = parseInt(h, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
export function rgb2hex([r, g, b]) {
  return '#' + [r, g, b].map(v => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')).join('');
}
// mix colour toward black (amt<0) or white (amt>0); amt in -1..1
export function shade(hex, amt) {
  const [r, g, b] = hex2rgb(hex);
  const t = amt < 0 ? 0 : 255;
  const a = Math.abs(amt);
  return rgb2hex([r + (t - r) * a, g + (t - g) * a, b + (t - b) * a]);
}
export const dark = (c, a = 0.42) => shade(c, -a);
export const light = (c, a = 0.35) => shade(c, a);

export function uid() { return Math.random().toString(36).slice(2, 9); }
export const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
export const lerp = (a, b, t) => a + (b - a) * t;
export const rand = (a, b) => a + Math.random() * (b - a);
export const pick = arr => arr[Math.floor(Math.random() * arr.length)];
export const sleep = ms => new Promise(r => setTimeout(r, ms));

// deterministic PRNG (mulberry32) for level generation
export function rng(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0; a = a + 0x6D2B79F5 | 0;
    let t = Math.imul(a ^ a >>> 15, 1 | a);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

export function el(tag, attrs = {}, children = []) {
  const e = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (k === 'class') e.className = v;
    else if (k === 'html') e.innerHTML = v;
    else if (k === 'text') e.textContent = v;
    else if (k.startsWith('on')) e.addEventListener(k.slice(2), v);
    else if (k === 'style' && typeof v === 'object') Object.assign(e.style, v);
    else if (v !== null && v !== undefined && v !== false) e.setAttribute(k, v === true ? '' : v);
  }
  for (const c of [].concat(children)) {
    if (c === null || c === undefined || c === false) continue;
    e.append(c.nodeType ? c : document.createTextNode(String(c)));
  }
  return e;
}
export const $ = (sel, root = document) => root.querySelector(sel);
export const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

export function fmt(n) {
  n = Math.round(n);
  if (n >= 1e6) return (n / 1e6).toFixed(1).replace(/\.0$/, '') + 'M';
  if (n >= 1e4) return (n / 1e3).toFixed(1).replace(/\.0$/, '') + 'K';
  return String(n);
}

// Native (iOS WKWebView has no navigator.vibrate): Capacitor Haptics impact, style by the pattern's strongest pulse
// (≤15 ms LIGHT, ≤30 ms MEDIUM, else HEAVY). Web: navigator.vibrate. Never throws.
let hapticAt = 0;
export function haptic(pattern = 12) {
  try {
    const C = typeof window !== 'undefined' ? window.Capacitor : null;
    if (C && C.isNativePlatform && C.isNativePlatform()) {
      const H = C.Plugins && C.Plugins.Haptics;
      if (!H || typeof H.impact !== 'function') return;
      const now = Date.now(); if (now - hapticAt < 35) return;   // no bridge spam while dragging
      hapticAt = now;
      const ms = Math.max(0, ...[].concat(pattern).map(v => +v || 0));
      const r = H.impact({ style: ms <= 15 ? 'LIGHT' : ms <= 30 ? 'MEDIUM' : 'HEAVY' });
      if (r && typeof r.catch === 'function') r.catch(() => null);
      return;
    }
    const ua = navigator.userActivation;
    if (ua && !ua.hasBeenActive) return;      // Chrome logs an error if vibrate runs before a real tap
    if (navigator.vibrate) navigator.vibrate(pattern);
  } catch (_) { /* blocked before activation */ }
}

export function todayKey() {
  const d = new Date();
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
}
