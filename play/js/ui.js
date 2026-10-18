// Shared UI components: icons, modal, toast, floating text, fly-to animation, hold button, item thumbnails.
import { el, $, sleep, haptic } from './util.js';
import { t, name } from './i18n.js';
import { RARITY } from './art/_kit.js';
import { renderAvatar } from './avatar.js';
import { getItem, getTemplateFor } from './wardrobe.js';
import { sfx } from './audio.js';

const svg = (inner, vb = '0 0 32 32') => `<svg viewBox="${vb}" xmlns="http://www.w3.org/2000/svg">${inner}</svg>`;
export const I = {
  coin: () => svg('<circle cx="16" cy="16" r="13" fill="#f5b301" stroke="#c98a00" stroke-width="2.5"/><circle cx="16" cy="16" r="8.5" fill="none" stroke="#c98a00" stroke-width="2"/><text x="16" y="21.5" text-anchor="middle" font-family="Arial Black, Arial, sans-serif" font-weight="900" font-size="15" fill="#c98a00">$</text><path d="M8 9c2-3 5-4 8-4" stroke="#fff" stroke-width="2.5" stroke-linecap="round" opacity=".7" fill="none"/>'),
  star: (on = true) => svg(`<path d="M16 3l4 8.3 9 1.3-6.5 6.3 1.5 9-8-4.2-8 4.2 1.5-9L3 12.6l9-1.3z" fill="${on ? '#ffd34d' : '#d6d0ea'}" stroke="${on ? '#c98a00' : '#b4acd0'}" stroke-width="2.2" stroke-linejoin="round"/>${on ? '<path d="M11 10l3-4" stroke="#fff" stroke-width="2.2" stroke-linecap="round" opacity=".8"/>' : ''}`),
  bolt: () => svg('<path d="M18 2L6 18h8l-2 12 14-18h-8z" fill="#ffd34d" stroke="#c98a00" stroke-width="2.2" stroke-linejoin="round"/><path d="M15 6l-5 8" stroke="#fff" stroke-width="2" stroke-linecap="round" opacity=".8"/>'),
  gift: (gold = false) => svg(`<rect x="5" y="13" width="22" height="16" rx="3" fill="${gold ? '#f5b301' : '#ff5c8a'}" stroke="${gold ? '#c98a00' : '#d63b68'}" stroke-width="2.2"/><rect x="3" y="8" width="26" height="7" rx="2.5" fill="${gold ? '#ffd34d' : '#ff7fa3'}" stroke="${gold ? '#c98a00' : '#d63b68'}" stroke-width="2.2"/><path d="M16 8v21" stroke="${gold ? '#fff8dc' : '#ffe9f0'}" stroke-width="3.5"/><path d="M16 8c-5-1-8-5-5-6s5 4 5 6c0-2 2-7 5-6s0 5-5 6z" fill="${gold ? '#fff3c4' : '#ffe9f0'}" stroke="${gold ? '#c98a00' : '#d63b68'}" stroke-width="2"/>`),
  lock: () => svg('<rect x="7" y="14" width="18" height="14" rx="3" fill="#8b7fb0" stroke="#4e4472" stroke-width="2.2"/><path d="M10 14V10a6 6 0 0112 0v4" fill="none" stroke="#4e4472" stroke-width="3"/><circle cx="16" cy="21" r="2.2" fill="#fff"/>'),
  back: () => svg('<path d="M20 6L10 16l10 10" fill="none" stroke="#fff" stroke-width="4.5" stroke-linecap="round" stroke-linejoin="round"/>'),
  gear: () => svg('<path d="M16 3l3 2.5 3.8-.8 1.6 3.6 3.6 1.6-.8 3.8L29 16l-2.5 3 .8 3.8-3.6 1.6-1.6 3.6-3.8-.8L16 29l-3-2.5-3.8.8-1.6-3.6-3.6-1.6.8-3.8L3 16l2.5-3-.8-3.8 3.6-1.6 1.6-3.6 3.8.8z" fill="#cbd5e1" stroke="#475569" stroke-width="2"/><circle cx="16" cy="16" r="5" fill="#475569"/>'),
  hanger: () => svg('<path d="M16 7a3 3 0 10-3-3" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round"/><path d="M16 7v4L3 21c-1 1 0 3 1 3h24c1 0 2-2 1-3L16 11" fill="#ff8a3d" stroke="#d9641c" stroke-width="2.2" stroke-linejoin="round"/>'),
  cart: () => svg('<path d="M3 6h4l3 14h14l3-9H9" fill="#4f8cff" stroke="#2e63d6" stroke-width="2.4" stroke-linejoin="round"/><circle cx="12" cy="25" r="2.5" fill="#2e63d6"/><circle cx="22" cy="25" r="2.5" fill="#2e63d6"/>'),
  home: () => svg('<path d="M4 15L16 4l12 11v13H4z" fill="#ff8a3d" stroke="#d9641c" stroke-width="2.4" stroke-linejoin="round"/><rect x="13" y="18" width="6" height="10" fill="#fff3c4" stroke="#d9641c" stroke-width="2"/>'),
  play: () => svg('<path d="M9 5l18 11-18 11z" fill="#fff" stroke="#fff" stroke-width="2" stroke-linejoin="round"/>'),
  pause: () => svg('<rect x="7" y="6" width="7" height="20" rx="2" fill="#fff"/><rect x="18" y="6" width="7" height="20" rx="2" fill="#fff"/>'),
  hammer: () => svg('<path d="M7 27l12-12" stroke="#92400e" stroke-width="5" stroke-linecap="round"/><path d="M15 5l10 10-4 4-10-10z" fill="#8b5cf6" stroke="#6d3fd6" stroke-width="2.2" stroke-linejoin="round"/><path d="M18 7l7 7" stroke="#fff" stroke-width="2" stroke-linecap="round" opacity=".7"/>'),
  check: () => svg('<path d="M6 17l7 7L27 9" fill="none" stroke="#fff" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/>'),
  sound: () => svg('<path d="M5 12h6l7-6v20l-7-6H5z" fill="#fff"/><path d="M21 11c3 3 3 7 0 10M24 7c5 5 5 13 0 18" fill="none" stroke="#fff" stroke-width="2.5" stroke-linecap="round"/>'),
  music: () => svg('<path d="M12 24V8l14-3v16" fill="none" stroke="#fff" stroke-width="3" stroke-linejoin="round"/><circle cx="9" cy="24" r="4" fill="#fff"/><circle cx="23" cy="21" r="4" fill="#fff"/>'),
  sparkle: () => svg('<path d="M16 3c1 7 4 10 11 13-7 3-10 6-11 13-1-7-4-10-11-13 7-3 10-6 11-13z" fill="#ffd34d" stroke="#c98a00" stroke-width="2" stroke-linejoin="round"/>'),
  hint: () => svg('<path d="M16 3a9 9 0 00-5 16.5V23h10v-3.5A9 9 0 0016 3z" fill="#ffd34d" stroke="#c98a00" stroke-width="2.2"/><rect x="11" y="24" width="10" height="4" rx="2" fill="#c98a00"/>'),
  share: () => svg('<circle cx="24" cy="7" r="4" fill="#fff"/><circle cx="8" cy="16" r="4" fill="#fff"/><circle cx="24" cy="25" r="4" fill="#fff"/><path d="M11 14l10-5M11 18l10 5" stroke="#fff" stroke-width="2.5"/>'),
  hand: () => svg('<path d="M14 30l-8-9c-1-1.5 1-3.5 2.5-2.5L12 21V7c0-2.5 4-2.5 4 0v8c0-2 4-2 4 0v1c0-2 4-2 4 0v1c0-2 4-2 4 0v8c0 3-2 5-5 5z" fill="#fff" stroke="#2a1d4d" stroke-width="2" stroke-linejoin="round"/>'),
  trophy: () => svg('<path d="M9 4h14v9a7 7 0 01-14 0z" fill="#ffd34d" stroke="#c98a00" stroke-width="2.2"/><path d="M9 7H4c0 5 2 8 6 8M23 7h5c0 5-2 8-6 8" fill="none" stroke="#c98a00" stroke-width="2.4"/><path d="M13 20h6v4h-6zM10 24h12v4H10z" fill="#c98a00"/>'),
};
export const rarityColor = r => (RARITY[r] || RARITY.common).color;

// ---------- modal ----------
export function modal({ title, body, actions = [], closable = false, cls = '', onClose } = {}) {
  const bg = el('div', { class: 'modal-bg' });
  const m = el('div', { class: 'modal ' + cls });
  if (closable) m.append(el('button', { class: 'x', onclick: () => close() }, '×'));
  if (title) m.append(el('h2', {}, title));
  if (body) m.append(typeof body === 'string' ? el('div', { html: body }) : body);
  const acts = el('div', { class: 'actions' });
  for (const a of actions) {
    acts.append(el('button', { class: 'btn ' + (a.cls || ''), onclick: () => { sfx.tap(); haptic(); const r = a.onClick && a.onClick(); if (a.close !== false) close(); return r; } }, a.html ? el('span', { html: a.html }) : a.label));
  }
  if (actions.length) m.append(acts);
  bg.append(m);
  $('#overlay').append(bg);
  let closed = false;
  function close() { if (closed) return; closed = true; bg.style.animation = 'fade .18s ease reverse'; m.style.animation = 'modalIn .18s ease reverse'; setTimeout(() => bg.remove(), 170); onClose && onClose(); }
  return { el: m, bg, close };
}
export function toast(msg, { icon, ms = 1800, action } = {}) {
  const tt = el('div', { class: 'toast' });
  if (icon) tt.append(el('span', { html: icon }));
  tt.append(el('span', {}, msg));
  if (action) { tt.style.pointerEvents = 'auto'; tt.append(el('button', { class: 'toast-act', onclick: () => { action.onClick(); tt.remove(); } }, action.label)); }
  $('#toasts').append(tt);
  setTimeout(() => { tt.classList.add('out'); setTimeout(() => tt.remove(), 260); }, ms);
}
export function floatText(x, y, text, cls = '') {
  const f = el('div', { class: 'float ' + cls, style: { left: x + 'px', top: y + 'px' } }, text);
  $('#overlay').append(f); setTimeout(() => f.remove(), 950);
}
export function comboText(text) {
  const c = el('div', { class: 'combo' }, text); $('#overlay').append(c); setTimeout(() => c.remove(), 650);
}
// Move a clone of `html` from a point to an element's centre.
export function flyTo(from, toEl, html, { dur = 600, size = 48 } = {}) {
  return new Promise(res => {
    const r2 = toEl.getBoundingClientRect(), app = $('#app').getBoundingClientRect();
    const x1 = from.x - app.left, y1 = from.y - app.top, x2 = r2.left + r2.width / 2 - app.left, y2 = r2.top + r2.height / 2 - app.top;
    const f = el('div', { class: 'flyer', html, style: { left: x1 + 'px', top: y1 + 'px', width: size + 'px', height: size + 'px' } });
    $('#overlay').append(f);
    const cx = (x1 + x2) / 2 + (x2 - x1) * 0.2, cy = Math.min(y1, y2) - 80;
    f.animate([
      { transform: 'translate(-50%,-50%) scale(1)', offset: 0 },
      { transform: `translate(calc(-50% + ${cx - x1}px), calc(-50% + ${cy - y1}px)) scale(1.3)`, offset: 0.5 },
      { transform: `translate(calc(-50% + ${x2 - x1}px), calc(-50% + ${y2 - y1}px)) scale(.5)`, offset: 1 },
    ], { duration: dur, easing: 'cubic-bezier(.3,.7,.4,1)' }).onfinish = () => { f.remove(); res(); };
    setTimeout(() => { if (f.isConnected) { f.remove(); res(); } }, dur + 200);   // paused animations (hidden tab) never leave ghosts behind
  });
}
export function coinsFly(from, toEl, n = 8) {
  const ps = [];
  for (let i = 0; i < n; i++) ps.push(sleep(i * 50).then(() => flyTo({ x: from.x + (Math.random() - 0.5) * 60, y: from.y + (Math.random() - 0.5) * 40 }, toEl, I.coin(), { dur: 550, size: 28 })));
  return Promise.all(ps);
}
export function shake(elm) { elm.classList.remove('shake'); void elm.offsetWidth; elm.classList.add('shake'); }
export function bump(elm) { if (!elm) return; elm.classList.remove('bump'); void elm.offsetWidth; elm.classList.add('bump'); }

// Hold-to-confirm button (1.3 s).
export function holdButton(btn, onConfirm, ms = 1300) {
  btn.classList.add('hold');
  const fill = el('div', { class: 'fill' }); btn.prepend(fill);
  let timer = null, start = 0, raf = 0;
  const stop = () => { clearTimeout(timer); cancelAnimationFrame(raf); timer = null; fill.style.width = '0'; };
  const tick = () => { fill.style.width = Math.min(100, ((performance.now() - start) / ms) * 100) + '%'; raf = requestAnimationFrame(tick); };
  btn.addEventListener('pointerdown', e => { e.preventDefault(); start = performance.now(); tick(); timer = setTimeout(() => { stop(); haptic([30, 40, 30]); onConfirm(); }, ms); });
  for (const ev of ['pointerup', 'pointerleave', 'pointercancel']) btn.addEventListener(ev, stop);
}

// Thumbnail of an item: the avatar wearing it, cropped to the relevant region.
const CROP = { top: '58 212 204 190', outfit: '40 30 240 480', bottom: '70 330 180 170', shoes: '82 420 156 100', hat: '50 10 220 230', hair: '50 10 220 230', glasses: '70 80 180 130', acc: '40 30 240 480' };
export function itemThumb(item, gender, skin, extraEq = {}) {
  if (item.cat === 'bg') {
    const tpl = getTemplateFor(item); const scene = tpl ? (tpl(item.colors || {}, { gender }, item).scene || '') : '';
    return `<svg viewBox="0 0 360 640" preserveAspectRatio="xMidYMid slice">${scene}</svg>`;
  }
  const eq = { ...extraEq, [item.cat]: item.id };
  if (item.cat === 'outfit') { delete eq.top; delete eq.bottom; delete eq.hat; delete eq.glasses; }
  if (item.cat === 'top' || item.cat === 'bottom') delete eq.outfit;
  if (item.cat === 'acc' && (item.tpl === 'pet_cat' || item.tpl === 'pet_dog')) return renderAvatar({ gender, skin, equipped: eq, mood: 2 }, { anim: false }).replace('viewBox="0 0 320 520"', 'viewBox="150 330 170 190"');
  let s = renderAvatar({ gender, skin, equipped: eq, mood: 2 }, { anim: false });
  const crop = item.crop || CROP[item.cat];
  if (crop) s = s.replace('viewBox="0 0 320 520"', `viewBox="${crop}"`);
  return s;
}
export function itemCard(item, { owned, equipped, isNew, gender, skin, price, onClick, baseEq, badge } = {}) {
  const d = el('div', { class: `item ${item.rarity} ${equipped ? 'on' : ''} ${owned ? '' : 'locked'} ${isNew ? 'new' : ''}`, style: { '--rc': rarityColor(item.rarity) }, onclick: onClick });
  d.style.setProperty('--rc', rarityColor(item.rarity));
  d.append(el('div', { class: 'th', html: itemThumb(item, gender, skin, baseEq || {}) }));
  d.append(el('span', { class: 'rar' }));
  d.append(el('div', { class: 'nm' }, name(item.name)));
  if (badge) d.append(el('span', { class: 'setbadge', title: 'set' }, badge));
  if (!owned && price != null) d.append(el('div', { class: 'price', html: I.coin() + `<span>${price}</span>` }));
  return d;
}
export function giftBoxSVG(gold = false) {
  const a = gold ? '#f5b301' : '#ff5c8a', ad = gold ? '#c98a00' : '#d63b68', rb = gold ? '#fff3c4' : '#ffe9f0', lid = gold ? '#ffd34d' : '#ff7fa3';
  return `<svg viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg">
    <ellipse cx="60" cy="108" rx="40" ry="7" fill="#000" opacity=".15"/>
    <rect x="22" y="52" width="76" height="52" rx="8" fill="${a}" stroke="${ad}" stroke-width="4"/>
    <path d="M26 56h12v44H26z" fill="#000" opacity=".1"/><path d="M82 56h12v44H82z" fill="#000" opacity=".12"/>
    <rect x="14" y="38" width="92" height="20" rx="6" fill="${lid}" stroke="${ad}" stroke-width="4"/>
    <rect x="52" y="38" width="16" height="66" fill="${rb}" stroke="${ad}" stroke-width="3"/>
    <path d="M60 38c-16-2-26-14-18-20s18 10 18 20c0-10 10-26 18-20s-2 18-18 20z" fill="${rb}" stroke="${ad}" stroke-width="3.5" stroke-linejoin="round"/>
    <circle cx="60" cy="38" r="5" fill="${lid}" stroke="${ad}" stroke-width="3"/>
    <path d="M30 60c0 8 0 20 2 34" stroke="#fff" stroke-width="4" stroke-linecap="round" opacity=".35"/>
    ${gold ? '<path d="M40 70l3 6 6 1-4.5 4 1 6-5.5-3-5.5 3 1-6-4.5-4 6-1z" fill="#fff" opacity=".8"/><path d="M84 80l2 4 4 1-3 3 1 4-4-2-4 2 1-4-3-3 4-1z" fill="#fff" opacity=".8"/>' : ''}
  </svg>`;
}
export const starsRow = n => `<div class="stars-row">${[1, 2, 3].map(i => I.star(true).replace('<svg', `<svg class="${i <= n ? 'on' : ''}" data-i="${i}"`)).join('')}</div>`;
