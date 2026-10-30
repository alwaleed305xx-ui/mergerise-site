// Daily Hustle (F4): hub pill, per-day state + rewards, the host card for the board — and the reaction pop (F6b).
// Data (spec F4): state.dailyRun = { date, stars, tries, hostDone }; the pre-review state.daily2 is migrated on first
// read. Strings live here (no i18n keys added).
// Rewards per docs/unique-features.md F4: 1★ 150c · 2★ +10 Reserve · 3★ a common gift (rare on Sat/Sun); tiers
// stack (add-never-cut); the win pays +2 friendship with the host; once per day; 3 tries; resets 00:00 local.
import { el, $, clamp, todayKey, haptic } from './util.js';
import { t, name } from './i18n.js';
import { state, save, addCoins, addItem, addReserve, equip } from './store.js';
import { rollGift } from './wardrobe.js';
import { I, toast, flyTo } from './ui.js';
import { giftFlow } from './gift.js';
import { sfx } from './audio.js';
import { fx } from './particles.js';
import { npcByName, portrait, lineFor, recordDelivery } from './customers.js';
import { dailyInfo, DAILY_TRIES } from './levels.js';

const S = {
  title: { en: 'Daily Hustle', ar: 'كدّ اليوم' },
  hostedBy: { en: 'hosted by', ar: 'يستضيفه' },
  play: { en: 'Play', ar: 'العب' },
  done: { en: 'Done for today', ar: 'خلّصت اليوم' },
  back: { en: 'next in', ar: 'القادم بعد' },
  tries: { en: 'tries', ar: 'محاولات' },
  noTries: { en: 'No tries left', ar: 'خلصت المحاولات' },
  rules: { en: 'No rescues · retry is free', ar: 'بدون إنقاذ · الإعادة مجانية' },
  gift: { en: 'gift', ar: 'هدية' },
  rare: { en: 'rare gift', ar: 'هدية نادرة' },
  won: { en: 'Daily Hustle complete!', ar: 'كدّ اليوم مكتمل!' },
};
export const DAILY_REWARDS = { coins: 150, reserve: 10, gift: 'common', weekendGift: 'rare', friendship: 2 };
const isWeekend = (d = new Date()) => d.getDay() === 0 || d.getDay() === 6;
const DEF = () => ({ date: todayKey(), stars: 0, tries: 0, hostDone: false });
const hms = ms => { const s = Math.max(0, Math.floor(ms / 1000)); return `${Math.floor(s / 3600)}:${String(Math.floor((s % 3600) / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`; };
const wearChoice = (choice, item) => { if (choice === 'wear') { equip(item.cat, item.id); if (item.cat === 'top' || item.cat === 'bottom') equip('outfit', null); } };
const starsHtml = n => [1, 2, 3].map(i => I.star(true).replace('<svg', `<svg class="${i <= n ? 'on' : ''}"`)).join('');

// ---------- state ----------
// Today's record (created / reset lazily at local midnight). hostDone = today's Hustle was won and paid.
export function dailyState() {
  if (!state.dailyRun && state.daily2) {                                      // migrate the pre-review field name
    const o = state.daily2;
    state.dailyRun = { date: o.date, stars: o.stars || 0, tries: o.tries || 0, hostDone: !!o.won, wonAt: o.wonAt };
    delete state.daily2; save();
  }
  if (!state.dailyRun || state.dailyRun.date !== todayKey()) { state.dailyRun = DEF(); save(); }
  const d = state.dailyRun;
  if (typeof d.tries !== 'number') d.tries = 0;
  if (typeof d.stars !== 'number') d.stars = 0;
  d.hostDone = !!d.hostDone;
  return d;
}
export const dailyDone = () => dailyState().hostDone;
export const dailyTriesLeft = () => Math.max(0, DAILY_TRIES - (dailyState().tries || 0));
// Count an attempt when the daily board starts (3 per day). Returns false when no try is left (a won day is always playable).
export function useDailyTry() { const d = dailyState(); if (d.hostDone) return true; if (d.tries >= DAILY_TRIES) return false; d.tries++; save(); return true; }
// true when `level` is today's Daily Hustle level (flagged by levels.dailyLevel())
export const isDailyToday = level => !!(level && level.daily && level.date === todayKey());
export const msToMidnight = () => { const n = new Date(); return new Date(n.getFullYear(), n.getMonth(), n.getDate() + 1) - n; };
export function dailyRewardFor(stars) { return { coins: stars >= 1 ? DAILY_REWARDS.coins : 0, reserve: stars >= 2 ? DAILY_REWARDS.reserve : 0, gift: stars >= 3 ? (isWeekend() ? DAILY_REWARDS.weekendGift : DAILY_REWARDS.gift) : null }; }

// Pays today's reward once (later wins only raise the recorded stars). Returns the reward summary or null
// (already paid today, or stars < 1 — a 0-star call never marks the day done).
export function recordDailyWin(stars) {
  stars = clamp(Math.round(stars || 0), 0, 3);
  if (stars < 1) return null;
  const d = dailyState();
  d.stars = Math.max(d.stars || 0, stars);
  if (d.hostDone) { save(); return null; }
  d.hostDone = true; d.wonAt = Date.now();
  const info = dailyInfo(); const host = npcByName(info.host.name);
  const rw = dailyRewardFor(stars);
  const r = { stars, coins: 0, reserve: 0, item: null, rarity: rw.gift, host: host.name, friendship: DAILY_REWARDS.friendship, friend: { level: 0, leveledUp: false, reward: 0 } };
  if (rw.coins) { r.coins += rw.coins; addCoins(rw.coins); }
  if (rw.reserve) { r.reserve = rw.reserve; addReserve(rw.reserve); }
  if (rw.gift && state.profile) {
    const item = rollGift(Math.max(state.stage || 1, 5), state.profile.gender, state.inventory, Math.random, rw.gift);
    if (item) { addItem(item.id); state.seen.newIds = [...new Set([...(state.seen.newIds || []), item.id])]; r.item = item; }
    else { addCoins(300); r.coins += 300; }
  }
  // +2 friendship with the host (deliveries on the daily board itself do not count)
  for (let i = 0; i < DAILY_REWARDS.friendship; i++) {
    const fr = recordDelivery(host.name);
    r.friend.level = fr.level;
    if (fr.leveledUp) { r.friend.leveledUp = true; r.friend.reward += fr.reward; addCoins(fr.reward); r.coins += fr.reward; }
  }
  save(); return r;
}
// Full win reward UI: toast + gift reveal. Returns the reward (null when today was already won or stars < 1).
export async function dailyWinFlow(stars) {
  const r = recordDailyWin(stars); if (!r) return null;
  const p = state.profile;
  sfx.coin();
  toast(`${name(S.won)} +${r.coins} 🪙${r.reserve ? ` · +${r.reserve} ⚡` : ''} · ${r.host} ❤️ +${r.friendship}`, { icon: I.gift(r.rarity === 'rare'), ms: 3200 });
  if (r.friend.leveledUp) toast(`${r.host} ❤️ ${t('level')} ${r.friend.level} · +${r.friend.reward}`, { icon: I.trophy(), ms: 2600 });
  if (r.item && p) wearChoice(await giftFlow({ item: r.item, golden: r.rarity === 'rare', dup: false, dupCoins: 0, gender: p.gender, skin: p.skin, equipped: state.equipped, title: name(S.title) }), r.item);
  return r;
}

// ---------- hub pill (spec F4: "one pill under the Play button") ----------
// 36 px pill: 24 px host portrait + "Daily Hustle · Jay · 3/3 · 9:45:35"; done → green tick + today's stars.
// The whole pill is tappable → app.go('play', { daily: true }); no tries left → toast; done → toast with the countdown.
// Reward chips and the host's brief live on the play screen's host card (dailyHostCard), not on the hub.
export function dailyCard(app) {
  const info = dailyInfo(); const npc = npcByName(info.host.name);
  const pill = el('button', { class: 'daily-pill', type: 'button' }); pill.style.setProperty('--c', npc.color);
  pill.title = `${name(info.host.title)} · ${DAILY_REWARDS.coins} 🪙 · +${DAILY_REWARDS.reserve} ⚡ · ${name(isWeekend() ? S.rare : S.gift)}`;
  const txt = el('span', { class: 'dp-t' });
  const tick = () => {
    const d = dailyState(); const left = dailyTriesLeft();
    txt.innerHTML = '';
    txt.append(el('b', {}, name(S.title)), el('span', { class: 'dp-host' }, ` · ${npc.name} · `));
    if (d.hostDone) txt.append(el('span', { class: 'dp-stars', html: starsHtml(d.stars) }));
    else txt.append(el('span', { class: 'dp-tries' }, `${left}/${DAILY_TRIES}`));
    txt.append(el('span', { class: 'dp-time' }, ` · ${hms(msToMidnight())}`));
  };
  const paint = () => {
    const d = dailyState(); const left = dailyTriesLeft();
    pill.classList.toggle('done', d.hostDone); pill.classList.toggle('empty', !d.hostDone && left <= 0);
    pill.innerHTML = '';
    pill.append(d.hostDone ? el('span', { class: 'dp-tick', html: I.check() }) : el('span', { class: 'dp-pic', html: portrait(npc) }), txt);
    tick();
  };
  pill.onclick = () => {
    const d = dailyState();
    if (d.hostDone) { sfx.tap(); toast(`${name(S.done)} · ${name(S.back)} ${hms(msToMidnight())}`, { icon: I.check(), ms: 2200 }); return; }
    if (dailyTriesLeft() <= 0) { sfx.error(); toast(`${name(S.noTries)} · ${name(S.back)} ${hms(msToMidnight())}`, { ms: 2200 }); return; }
    sfx.tap(); haptic(); app.go('play', { daily: true });
  };
  paint();
  let lastDate = todayKey(), ticks = 0;
  const timer = setInterval(() => {
    ticks++;
    if (!pill.isConnected && ticks > 3) { clearInterval(timer); return; }
    if (todayKey() !== lastDate) { lastDate = todayKey(); paint(); } else tick();
  }, 1000);
  return pill;
}

// ---------- board: host card above the orders ----------
// the host's portrait + 2 lines (a greeting from the voice pool and the host's brief), then the reward row
// (1★ 150c · 2★ +10 Reserve · 3★ gift) with tries left and the rules line.
export function dailyHostCard(level, hero) {
  const host = (level && level.host) || dailyInfo().host; const npc = npcByName(host.name);
  const h = hero === undefined ? (state.profile && state.profile.name) : hero;
  const d = dailyState(); const left = dailyTriesLeft(); const weekend = isWeekend();
  const card = el('div', { class: 'daily-host' }); card.style.setProperty('--c', npc.color);
  card.append(el('div', { class: 'dh-pic', html: portrait(npc) }));
  const rw = (icon, v, star) => el('span', { class: 'rw', html: icon + `<span>${v}</span><i>${star}★</i>` });
  card.append(el('div', { class: 'dh-t' }, [
    el('div', { class: 'dh-name' }, [el('b', {}, `${name(S.title)} · ${npc.name}`), el('span', { class: 'dh-title' }, name(host.title))]),
    el('div', { class: 'dh-line' }, name(lineFor(npc, 'hi', { hero: h }))),
    el('div', { class: 'dh-line brief' }, name(host.lines ? host.lines.brief : S.rules).replace(/\{hero\}/g, h || '')),
    el('div', { class: 'dh-rw' }, [
      rw(I.coin(), DAILY_REWARDS.coins, 1), rw(I.bolt(), `+${DAILY_REWARDS.reserve}`, 2), rw(I.gift(weekend), name(weekend ? S.rare : S.gift), 3),
      el('span', { class: 'rw meta' }, d.hostDone ? `✓ ${name(S.done)}` : `${left}/${DAILY_TRIES} ${name(S.tries)} · ${name(S.rules)}`),
    ]),
  ]));
  return card;
}

// ---------- F6b: reaction pop ----------
// The NPC's portrait slides up over the order card for 1.2 s with `text`, and a heart flies to the card's
// friendship pip (.cust). Pure DOM on #overlay; no modal, no tap. Safe to call on a card inside a scroller.
const HEART = '<svg viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg"><path d="M16 28S5 21 5 13a6 6 0 0111-3 6 6 0 0111 3c0 8-11 15-11 15z" fill="#f43f5e" stroke="#be123c" stroke-width="2" stroke-linejoin="round"/><path d="M9 11c1-2 3-3 5-2" stroke="#fff" stroke-width="2" stroke-linecap="round" opacity=".8"/></svg>';
export const REACT_POP_MS = 1200;
export function reactionPop(cardEl, npc, text) {
  if (!cardEl || !cardEl.isConnected || !npc) return;
  const overlay = $('#overlay'), appEl = $('#app'); if (!overlay || !appEl) return;
  const a = appEl.getBoundingClientRect(), r = cardEl.getBoundingClientRect();
  const x = r.left + r.width / 2 - a.left, y = r.top - a.top + 14;
  const pop = el('div', { class: 'react-pop', style: { left: x + 'px', top: y + 'px' } }, [
    el('div', { class: 'rp-pic', html: portrait(npc) }),
    el('div', { class: 'rp-say' }, String(text || '')),
  ]);
  pop.style.setProperty('--c', npc.color || '#ec4899');
  overlay.append(pop);
  const pip = cardEl.querySelector('.cust') || cardEl;
  setTimeout(() => {
    if (!pip.isConnected) return;
    flyTo({ x: r.left + r.width / 2, y: r.top + 4 }, pip, HEART, { dur: 480, size: 22 }).then(() => {
      pip.classList.remove('rp-hit'); void pip.offsetWidth; pip.classList.add('rp-hit');
      const pr = pip.getBoundingClientRect(); fx.sparkle(pr.left + pr.width / 2 - a.left, pr.top + pr.height / 2 - a.top, 6, '#f43f5e');
      setTimeout(() => pip.classList.remove('rp-hit'), 600);
    });
  }, 320);
  setTimeout(() => { pop.classList.add('out'); setTimeout(() => pop.remove(), 240); }, REACT_POP_MS);
  setTimeout(() => { if (pop.isConnected) pop.remove(); }, REACT_POP_MS + 600);   // throttled timers never leave ghosts
}
