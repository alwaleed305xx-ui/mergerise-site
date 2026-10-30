// World Tour UI (data in js/cities.js): the energy gate in front of every tour stage, the hub row + tour map, and the
// once-per-city finale reward. A tour stage costs ENTRY_COST reserve energy to start or retry; the reserve refills
// +1 every 3 min (store.js), offline too. Short of it the player waits (live countdown), watches an ad (+5) or buys
// +10 at today's ladder price, in gems or in coins at the one exchange rate (COINS_PER_GEM); coins pay only the
// first 3 refills of a day (late tour wins pay more coins than the top price), the ladder resets at local midnight
// and the next price is always shown before buying.
import { el, fmt, todayKey } from './util.js';
import { t, name } from './i18n.js';
import { state, save, reserveNow, reserveEta, useReserve, addReserve, spend, addCoins, RESERVE_CAP, reserveMs, reserveMinutes } from './store.js';
import { gems, spendGems, addGems, adsLeft, adUsed, ADS, COINS_PER_GEM } from './economy.js';
import { showRewardedAd, adsAvailable } from './ads.js';
import { sfx } from './audio.js';
import { I, modal, toast } from './ui.js';
import { gemIcon } from './screens/shop.js';
import { CITIES, CITY_LEN, CITY_REWARD, ENTRY_COST, tourFor, entryCost, citiesDone } from './cities.js';

export const TOUR_REFILL = { energy: 10, gems: [5, 10, 20, 40, 60], coinRefills: 3 };   // per refill today; coins = gems × 50
function ladder() { const d = todayKey(); if (!state.tourRefills || state.tourRefills.day !== d) state.tourRefills = { day: d, n: 0 }; return state.tourRefills; }
export const refillGems = (step = 0) => TOUR_REFILL.gems[Math.min(ladder().n + step, TOUR_REFILL.gems.length - 1)];
export const refillCoins = (step = 0) => refillGems(step) * COINS_PER_GEM;
const mmss = ms => { const s = Math.max(0, Math.ceil(ms / 1000)); return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`; };
// time until the reserve holds `cost`: the running +1 tick, then one regen period per further point
const etaFor = cost => { const n = reserveNow(); return n >= cost ? 0 : reserveEta() + (cost - n - 1) * reserveMs(); };

// The only way into a tour stage: pays the entry from the reserve and opens the board, or shows the energy sheet.
// opts.home = closing the sheet any way (Later, ×, Android Back) goes back to the hub: the board behind it is lost.
export function enterStage(app, n, params = {}, opts = {}) {
  const cost = entryCost(n);
  if (!cost) { app.go('play', { ...params, stage: n }); return true; }
  if (useReserve(cost)) { app.go('play', { ...params, stage: n, paid: true }); return true; }
  needEnergy(app, n, params, opts);
  return false;
}

function needEnergy(app, n, params, opts) {
  const cost = entryCost(n);
  sfx.error();
  const meter = el('div', { class: 'rewards', html: `<div class="reward reserve-r">${I.bolt()}<span>${reserveNow()}/${RESERVE_CAP}</span></div><div class="reward">${gemIcon()}<span>${fmt(gems())}</span></div><div class="reward">${I.coin()}<span>${fmt(state.coins)}</span></div>` });
  const eta = el('div', { class: 'eta tour-eta' });
  const rescue = el('div', { class: 'rescue' });
  const body = el('div', {}, [el('div', { class: 'win-story' }, t('tourCost', cost, reserveMinutes())), meter, eta, rescue]);
  let m = null, ready = false, left = false;
  const leave = () => { left = true; m.close(); };                 // closing on purpose: no trip to the hub
  const go = () => { leave(); enterStage(app, n, params, opts); };
  const buy = paid => { if (!paid) return; ladder().n++; save(); addReserve(TOUR_REFILL.energy); sfx.energy(); go(); };
  const day = ladder().day, g = refillGems(), c = refillCoins(), coinsOk = ladder().n < TOUR_REFILL.coinRefills;
  // a sheet left open past midnight reopens with today's prices instead of charging yesterday's
  const stale = () => { if (ladder().day === day) return false; leave(); needEnergy(app, n, params, opts); return true; };
  rescue.append(el('button', { class: 'btn purple', onclick: () => {
    if (stale()) return;
    if (!spendGems(g)) { sfx.error(); toast(t('notEnoughGems'), { icon: gemIcon() }); leave(); app.go('shop', { tab: 'gems' }); return; }
    buy(true);
  } }, [el('span', { html: gemIcon() }), `${t('refillTour', TOUR_REFILL.energy)} · ${g}`]));
  if (coinsOk) rescue.append(el('button', { class: 'btn gold', onclick: () => {
    if (stale()) return;
    if (state.coins < c) { sfx.error(); toast(t('notEnoughCoins'), { icon: I.coin() }); return; }
    buy(spend(c));
  } }, [el('span', { html: I.coin() }), `${t('refillTour', TOUR_REFILL.energy)} · ${fmt(c)}`]));
  if (adsAvailable() && adsLeft('energy') > 0) rescue.append(el('button', { class: 'btn ghost', onclick: async () => {
    leave();
    const r = await showRewardedAd();
    if (!r.ok) { if (opts.home && app.current === 'play') app.go('hub'); return; }
    adUsed('energy'); addReserve(ADS.energyPerAd); sfx.energy();
    enterStage(app, n, params, opts);
  } }, [el('span', { html: I.play() }), `${t('watchAd')} +${ADS.energyPerAd} ⚡ (${adsLeft('energy')})`]));
  rescue.append(el('div', { class: 'eta' }, t('tourLadder', refillGems(1), ladder().n + 1 < TOUR_REFILL.coinRefills ? fmt(refillCoins(1)) : null, TOUR_REFILL.coinRefills)));
  const paint = () => {
    if (m && !m.bg.isConnected) { clearInterval(timer); return; }
    if (m && todayKey() !== day) { clearInterval(timer); stale(); return; }
    const left = etaFor(cost);
    if (left > 0) { eta.textContent = t('readyIn', mmss(left)); return; }
    if (ready) return;
    ready = true; eta.textContent = t('readyNow');
    rescue.prepend(el('button', { class: 'btn primary', onclick: go }, [el('span', { html: I.play() }), `${t('play')} · ${n}`]));
  };
  const timer = setInterval(paint, 1000);
  m = modal({ title: t('needEnergy'), body, closable: true,
    onClose: () => { clearInterval(timer); if (!left && opts.home && app.current === 'play') app.go('hub'); },
    actions: [{ label: t('later'), cls: 'light' }] });
  paint();
}

// ---------- hub ----------
// every finished city pays its reward once: saves that passed a finale before the tour existed (1.0.0 had endless
// stages) or that closed between recordWin and cityReward settle here
export function settleCities() {
  const done = citiesDone(state.stage); if (!done) return 0;
  if (!state.tourPaid) state.tourPaid = {};
  let owed = 0;
  for (let i = 0; i < done; i++) if (!state.tourPaid[CITIES[i].id]) { state.tourPaid[CITIES[i].id] = Date.now(); owed++; }
  if (owed) { addGems(CITY_REWARD.gems * owed); addCoins(CITY_REWARD.coins * owed); }
  return owed;
}
export function tourRow(app) {
  const T = tourFor(state.stage); if (!T) return null;
  const owed = settleCities();
  if (owed) setTimeout(() => { sfx.coin(); toast(t('citiesSettled', owed, CITY_REWARD.gems * owed, fmt(CITY_REWARD.coins * owed)), { icon: I.globe(), ms: 3400 }); }, 1200);
  const won = T.champion ? CITY_LEN : T.step - 1;
  const row = el('div', { class: 'hub-home tour-row', role: 'button', onclick: () => { sfx.tap(); tourMap(); } }, [
    el('span', { html: T.champion ? I.trophy() : I.globe() }),
    el('span', { class: 'tour-city' }, T.champion ? t('champion') : name(T.city.name)),
    el('div', { class: 'bar' }, el('i', { style: { width: '0%' } })),
    el('span', { class: 'tiny', style: { color: '#fff' } }, T.champion ? `${citiesDone(state.stage)}/${CITIES.length}` : `${won}/${CITY_LEN}`),
  ]);
  requestAnimationFrame(() => { row.querySelector('.bar i').style.width = (won / CITY_LEN * 100) + '%'; });
  return row;
}
export function tourMap() {
  const T = tourFor(state.stage), done = citiesDone(state.stage);
  const list = el('div', { class: 'tour-map' });
  CITIES.forEach((c, i) => {
    const st = i < done ? 'done' : T && !T.champion && i === T.idx ? 'now' : 'next';
    list.append(el('div', { class: 'tour-stop ' + st }, [
      el('b', { class: 'tour-n' }, st === 'done' ? '✓' : String(i + 1)),
      el('div', { class: 'tour-t' }, [el('div', { class: 'tour-name' }, name(c.name)), st === 'next' && i > done + 1 ? null : el('div', { class: 'tiny' }, name(c.rule))]),
      el('span', { class: 'tiny' }, st === 'done' ? `${CITY_LEN}/${CITY_LEN}` : st === 'now' ? `${T.step - 1}/${CITY_LEN}` : ''),
    ]));
  });
  const body = el('div', {}, [
    el('div', { class: 'win-story' }, T && T.champion ? t('championIntro') : t('tourIntro')),
    el('div', { class: 'tiny tour-note' }, `${t('cityReward', CITY_REWARD.gems, fmt(CITY_REWARD.coins))} · ${t('tourCost', ENTRY_COST, reserveMinutes())}`),
    list,
  ]);
  const m = modal({ title: t('tour'), body, closable: true });
  const now = list.querySelector('.now'); if (now) requestAnimationFrame(() => { list.scrollTop = Math.max(0, now.offsetTop - list.offsetTop - 60); });
  return m;
}

// ---------- play ----------
// the start-of-stage line: "Miami 17/50 · Beach fog hides the edges"; a city's first stage says so
export function stageToast(level) {
  const tr = level && level.tour; if (!tr) return;
  const c = CITIES[tr.idx];
  const head = tr.champion ? `${t('champion')} · ${level.n}` : `${name(c.name)} ${tr.step}/${CITY_LEN}`;
  setTimeout(() => toast(`${tr.step === 1 && !tr.champion ? t('newCity') + ' ' : ''}${tr.finale ? t('cityFinale') + ' · ' : ''}${head} · ${name(c.rule)}`, { icon: I.globe(), ms: tr.step === 1 ? 4200 : 2800 }), 700);
}
// paid once per city, after the win of its 50th stage was recorded; returns { city, next, nextIdx } or null
export function cityReward(level) {
  const tr = level && level.tour; if (!tr || !tr.finale) return null;
  if (!state.tourPaid) state.tourPaid = {};
  if (state.tourPaid[tr.id]) return null;
  state.tourPaid[tr.id] = Date.now();
  addGems(CITY_REWARD.gems); addCoins(CITY_REWARD.coins);
  return { city: CITIES[tr.idx], next: CITIES[tr.idx + 1] || null, nextIdx: tr.idx + 1 };
}
