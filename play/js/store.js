// Persistent game state (localStorage, mirrored to native storage in the app) + economy helpers.
import { todayKey } from './util.js';

const KEY = 'mergerise.save.v1';
const DEFAULT = () => ({
  v: 1,
  rev: 0,                            // save counter: the newer of the localStorage and native copies wins at launch
  profile: null,                    // { gender:'boy'|'girl', skin:0..5, name }
  stage: 1,                          // next stage to play
  coins: 0,
  totalScore: 0,
  stars: {},                         // stage -> stars
  inventory: [],                     // item ids
  equipped: { hair: null, top: null, bottom: null, shoes: null, hat: null, glasses: null, acc: null, outfit: null, bg: null },
  settings: { sfx: true, music: true, lang: 'en' },
  daily: null,                       // last daily-gift day
  dailyRun: null,                    // Daily Hustle (F4): { date, stars, tries, hostDone } — owned by js/daily.js
  tutorialDone: false,
  giftsOpened: 0,
  seen: {},                          // one-time hints
  discovered: [],                    // 'chain:lvl' keys ever created (collection + chain preview)
  storage: [null, null, null, null], // persistent off-board storage slots
  storageSlots: 4,
  reserve: { n: 15, at: Date.now() },  // reserve energy: cap 30, +1 per 180 s, regenerates offline
  collectionClaimed: {},
  review: { asks: 0, at: 0, wins: 0 },  // store rating sheet asks (js/review.js)
  featured: null,                    // { day, epic, legendary }: the Shop's featured item ids, fixed for the day
  created: Date.now(),
});

// ---------- where the save lives ----------
// localStorage 'mergerise.save.v1' is the working copy (synchronous). On native it is mirrored into the app's own
// native storage through window.Capacitor.Plugins.Preferences (@capacitor/preferences → UserDefaults), because iOS
// can reclaim a WKWebView's localStorage when the device runs low on space, and purchased gems, paid coins, the pass
// and consumables cannot be restored from StoreKit. Every save carries a counter (`rev`); at launch the copy with the
// higher counter wins (a missing localStorage copy always loses to the native one). Without the plugin (web, or a
// build that does not ship it) nothing changes: localStorage only.
const parse = s => ({ ...DEFAULT(), ...s, equipped: { ...DEFAULT().equipped, ...(s.equipped || {}) }, settings: { ...DEFAULT().settings, ...(s.settings || {}) } });
let hadLocal = false;      // a readable localStorage save existed at launch
let lastJson = '';         // the JSON of the latest save (what the native mirror must hold)

export let state = load();

function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return DEFAULT();
    const s = JSON.parse(raw);
    if (!s || typeof s !== 'object') return DEFAULT();
    hadLocal = true; lastJson = raw;
    return parse(s);
  } catch (_) { return DEFAULT(); }
}
export function save() {
  state.rev = (state.rev || 0) + 1;
  let json = '';
  try { json = JSON.stringify(state); } catch (_) { return; }
  lastJson = json;
  try { localStorage.setItem(KEY, json); } catch (_) { /* private mode */ }
  queueNative();
}
export function reset() {
  // paid state survives a reset (Apple 3.1.1): gems, paid coins, pass, purchases, pack-exclusive items, and the
  // IAP ledger (a transaction still unfinished at reset time must not be granted a second time at the next launch)
  const keep = { settings: state.settings, gems: state.gems || 0, pass: state.pass || null, purchases: state.purchases || [], paidCoins: state.paidCoins || 0, piggy: state.piggy || null, iapLedger: state.iapLedger || {}, rev: state.rev || 0, review: state.review || null };
  const exclusive = (state.inventory || []).filter(id => id === 'top_jersey_gold' && keep.purchases.includes('starter_pack'));
  state = DEFAULT();
  Object.assign(state, { settings: keep.settings, gems: keep.gems, purchases: keep.purchases, paidCoins: keep.paidCoins, coins: keep.paidCoins, iapLedger: keep.iapLedger, rev: keep.rev });
  if (keep.pass) state.pass = keep.pass;
  if (keep.piggy) state.piggy = keep.piggy;
  if (keep.review) state.review = { ...keep.review, wins: 0 };   // asks + date survive (the OS caps per device); the win baseline restarts with the wiped stages
  state.inventory.push(...exclusive);
  save();
  flushNative();   // the caller reloads the page right away: hand the native copy over now, not after the debounce
}

// ---------- native mirror ----------
const NATIVE_DEBOUNCE = 400, NATIVE_TIMEOUT = 2500, WEBKIT_FLUSH = 1500;
function prefs() {
  try {
    const C = typeof window !== 'undefined' ? window.Capacitor : null;
    if (!C || !C.isNativePlatform || !C.isNativePlatform()) return null;
    const P = C.Plugins && C.Plugins.Preferences;
    return P && typeof P.get === 'function' && typeof P.set === 'function' ? P : null;
  } catch (_) { return null; }
}
const wait = ms => new Promise(res => setTimeout(res, ms));
const within = (p, ms) => Promise.race([Promise.resolve(p), wait(ms).then(() => { throw new Error('timeout'); })]);
let nativeOk = false;              // the plugin answered at launch (otherwise the mirror stays off)
let nativeTimer = 0, nativeDirty = false, nativeJob = Promise.resolve(false), nativeHas = '';
function queueNative() {
  if (!nativeOk) return;
  nativeDirty = true;
  if (!nativeTimer) nativeTimer = setTimeout(flushNative, NATIVE_DEBOUNCE);
}
// Write the latest save to native storage now. Resolves true once the native side holds it (or a newer one: every
// later save contains everything an earlier one did), false when the write failed or timed out.
function flushNative() {
  clearTimeout(nativeTimer); nativeTimer = 0;
  const P = nativeOk ? prefs() : null;
  if (!P) return Promise.resolve(false);
  if (!nativeDirty && nativeHas === lastJson) return Promise.resolve(true);
  nativeDirty = false;
  const json = lastJson;
  nativeJob = nativeJob.catch(() => false)
    .then(() => within(P.set({ key: KEY, value: json }), NATIVE_TIMEOUT))
    .then(() => { nativeHas = json; return true; }, () => { nativeDirty = true; return false; });
  return nativeJob;
}
// Resolves once the latest save is durable as far as this platform can tell: the native mirror confirmed it, or,
// without the mirror, after WebKit's ~1 s localStorage write-back. payments.js finishes a StoreKit transaction only
// after this, so a kill right after a purchase can never leave a finished transaction whose grant never hit disk.
export function flushed() {
  if (nativeOk) return flushNative().then(ok => ok || wait(WEBKIT_FLUSH).then(() => false));
  return wait(WEBKIT_FLUSH).then(() => false);
}
async function hydrateNative() {
  const P = prefs(); if (!P) return;
  let raw = null;
  try { const r = await within(P.get({ key: KEY }), NATIVE_TIMEOUT); raw = r && typeof r.value === 'string' && r.value ? r.value : null; }
  catch (_) { return; }               // plugin missing or not answering: localStorage only
  nativeOk = true;
  let s = null;
  if (raw) { try { s = JSON.parse(raw); } catch (_) { s = null; } }
  if (s && typeof s === 'object' && (!hadLocal || (s.rev || 0) > (state.rev || 0))) {
    state = parse(s); lastJson = raw; nativeHas = raw;
    try { localStorage.setItem(KEY, raw); } catch (_) { /* private mode */ }   // working copy back in place
    return;
  }
  if (hadLocal && raw !== lastJson) { nativeDirty = true; flushNative(); }    // first launch with the mirror, or it lagged
}
try {
  if (typeof document !== 'undefined') {
    // hand the latest save to the native side when the app goes to the background or the page is torn down
    document.addEventListener('visibilitychange', () => { if (document.hidden) flushNative(); });
    window.addEventListener('pagehide', () => { flushNative(); });
  }
} catch (_) { /* no DOM */ }
// Top-level await: every module that imports the state waits until the native copy has been read (one bridge call,
// a few ms on a device; skipped at once on the web). Supported by WKWebView since iOS 15, the deployment target.
if (prefs()) await hydrateNative();
export function hasProfile() { return !!state.profile; }
export function own(id) { return state.inventory.includes(id); }
export function addItem(id) { if (!own(id)) { state.inventory.push(id); save(); return true; } return false; }
export function addCoins(n) { state.coins = Math.max(0, Math.round(state.coins + n)); save(); }
export function spend(n) { if (state.coins < n) return false; state.coins -= n; save(); return true; }
export function equip(cat, id) { reserveNow(); state.equipped[cat] = id; save(); }   // regen so far is counted at the old outfit's rate
export function stageStars(n) { return state.stars[n] || 0; }
export function recordWin(stage, stars, score) {
  state.stars[stage] = Math.max(state.stars[stage] || 0, stars);
  state.totalScore += score;
  if (stage >= state.stage) state.stage = stage + 1;
  save();
}
export function canClaimDaily() { return state.daily !== todayKey(); }
export function claimDaily() { state.daily = todayKey(); save(); }
export function totalStars() { return Object.values(state.stars).reduce((a, b) => a + b, 0); }
export function wonStages() { return Object.keys(state.stars).length; }
// home tier: 0 street, 1 room, 2 apartment, 3 villa, 4 palace
export function tierFor(stageNext) { const w = stageNext - 1; return w >= 30 ? 4 : w >= 20 ? 3 : w >= 10 ? 2 : w >= 5 ? 1 : 0; }
export const TIER_AT = [0, 5, 10, 20, 30];
export function markSeen(k) { state.seen[k] = true; save(); }
export const RESERVE_CAP = 30, RESERVE_MS = 180000;
// the West Coast set regenerates 2x faster (js/sets.js reserveRegenMul); app.js registers the lookup so this module
// never imports the wardrobe modules
let regenMul = () => 1;
export function setReserveRegen(fn) { reserveNow(); regenMul = fn; }
export const reserveMs = () => { let m = 1; try { m = regenMul() || 1; } catch (_) { m = 1; } return Math.max(30000, Math.round(RESERVE_MS * m)); };
export const reserveMinutes = () => Math.round(reserveMs() / 6000) / 10;   // 3 or 1.5
export function reserveNow() {
  if (!state.reserve) state.reserve = { n: 15, at: Date.now() };
  const r = state.reserve, now = Date.now();
  if (r.n < RESERVE_CAP) {
    const ms = reserveMs(), gained = Math.floor((now - r.at) / ms);
    if (gained > 0) { r.n = Math.min(RESERVE_CAP, r.n + gained); r.at = r.n >= RESERVE_CAP ? now : r.at + gained * ms; save(); }
  } else r.at = now;
  return r.n;
}
export function reserveEta() { reserveNow(); const r = state.reserve; return r.n >= RESERVE_CAP ? 0 : Math.max(0, reserveMs() - (Date.now() - r.at)); }
export function useReserve(n) { reserveNow(); if (state.reserve.n < n) return false; if (state.reserve.n >= RESERVE_CAP) state.reserve.at = Date.now(); state.reserve.n -= n; save(); return true; }
export function addReserve(n) { reserveNow(); state.reserve.n = Math.min(RESERVE_CAP, state.reserve.n + n); save(); }
export const STORAGE_PRICES = [250, 500, 1000, 2000];
export function storagePrice() { const s = state.storageSlots || 4; return s >= 8 ? null : STORAGE_PRICES[s - 4]; }
export function buyStorageSlot() { const p = storagePrice(); if (p == null || !spend(p)) return false; state.storageSlots = (state.storageSlots || 4) + 1; state.storage.push(null); save(); return true; }
export function discoverItem(k) { if (!state.discovered.includes(k)) { state.discovered.push(k); save(); return true; } return false; }
export function storageSet(i, item) { if (!Array.isArray(state.storage)) state.storage = [null, null, null, null]; while (state.storage.length < (state.storageSlots || 4)) state.storage.push(null); state.storage[i] = item; save(); }
