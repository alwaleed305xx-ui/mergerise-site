// Monetisation catalogue + rules (docs/monetization.md). Two currencies, ONE exchange rate:
//   coins = soft currency earned by playing; gems = hard currency bought with money (plus small free drips).
//   COINS_PER_GEM = 50 — every gem price below is the coin price / 50, so the two currencies never contradict.
// Reviewed against Apple/Google policies and genre economics (docs/monetization.md "Review log").
import { state, save, addCoins, RESERVE_CAP } from './store.js';
import { todayKey } from './util.js';

export const COINS_PER_GEM = 50;
const DAY = 86400000;

// amount = what is actually granted (bonus already included); bonus = card label only
export const PRODUCTS = [
  { id: 'gems_100', kind: 'gems', amount: 100, usd: 0.99 },
  { id: 'gems_550', kind: 'gems', amount: 550, usd: 4.99, bonus: 10 },
  { id: 'gems_1200', kind: 'gems', amount: 1200, usd: 9.99, bonus: 20 },
  { id: 'gems_2600', kind: 'gems', amount: 2600, usd: 19.99, bonus: 30 },
  { id: 'gems_7000', kind: 'gems', amount: 7000, usd: 49.99, bonus: 40 },
  { id: 'gems_15000', kind: 'gems', amount: 15000, usd: 99.99, bonus: 50 },
  // one-time 30-day pass: a consumable, NOT an auto-renewing subscription (no renewal disclosures needed)
  { id: 'pass_30d', kind: 'pass', usd: 4.99, days: 30 },
  { id: 'starter_pack', kind: 'starter', usd: 2.99, coins: 3000, gems: 400, item: 'top_jersey_gold', once: true },
  { id: 'piggy_break', kind: 'piggy', usd: 1.99 },
];
export const productById = id => PRODUCTS.find(p => p.id === id) || null;
export const granted = p => p.amount || 0;
export const perThousand = p => p.usd / granted(p) * 1000;
export function bestValueId(kind) { const list = PRODUCTS.filter(p => p.kind === kind && p.amount); if (!list.length) return null; return list.reduce((a, b) => perThousand(b) < perThousand(a) ? b : a).id; }
// real-money reference for a gem amount, from the entry pack (never the bonused tiers)
export function gemRef(n, priceOf100 = 0.99, currency = 'USD', locale = 'en-US') {
  const v = n * priceOf100 / 100;
  try { return new Intl.NumberFormat(locale, { style: 'currency', currency }).format(v); } catch (_) { return '$' + v.toFixed(2); }
}

// gem sinks (coin price / 50)
export const GEM = {
  refillEnergy: 15,                    // energy granted per gem refill
  refillLadder: [5, 10, 15, 25, 40],   // per refill today; resets at local midnight (shown in full before buying)
  reserveFull: 15,
  recharge: 2,                         // = 100 coins
  hammer: 2,                           // = 100 coins
  storageSlot: [5, 10, 20, 40],        // = 250 / 500 / 1000 / 2000 coins
  premiumBox: 36,                      // = direct price of an epic item: the worst case is never worse than buying it
  legendaryItem: 100,                  // = 5000 coins
  epicItem: 36,                        // = 1800 coins
  coinsPack: { gems: 20, coins: 1000 },// in-shop exchange at the same rate
};
export const PREMIUM_BOX_ODDS = { epic: 0.85, legendary: 0.15 };
// gems, fills in days not weeks. start: a one-time welcome fill (= minBreak), so piggy_break can be bought, and
// reviewed by App Review, on a fresh install; after a break it refills from wins only.
export const PIGGY = { perWin: 6, perGolden: 14, cap: 400, minBreak: 240, start: 240 };
export const ADS = { energyPerAd: 5, perDay: 5, doubleWinPerDay: 3 };
export const PASS = { dailyCoins: 150, dailyGems: 10 };   // coins + gems only: a consumable that unlocks no content (App Review 3.1.1)
export const FREE_GEMS = { welcome: 30, discoverHigh: 1, goldenWin: 2, lookbook: [2, 4, 6, 8] };   // lookbook: per page at 3.5/4.0/4.5/5.0★ (≤ 20/page, 240 lifetime; js/style.js STAR_TIERS)

// ---------- helpers on state ----------
function ensure() {
  if (typeof state.gems !== 'number') state.gems = 0;
  if (!state.piggy || typeof state.piggy.gems !== 'number') state.piggy = { gems: 0 };
  if (!state.piggy.seeded) { state.piggy.gems = Math.min(PIGGY.cap, Math.max(state.piggy.gems, PIGGY.start)); state.piggy.seeded = true; }   // once per save
  if (!state.pass) state.pass = { start: 0, until: 0, paidDays: 0, lastExtra: null };
  if (state.pass.lastClaim !== undefined) { // migrate the old per-day claim shape without owing retroactive days
    const until = state.pass.until || 0; const start = until ? Math.min(Date.now(), until - 30 * DAY) : 0;
    const accrued = until ? Math.min(30, Math.floor((Math.min(Date.now(), until) - start) / DAY) + 1) : 0;
    state.pass = { start, until, paidDays: accrued, lastExtra: null };
  }
  if (!state.refills) state.refills = { day: todayKey(), n: 0 };
  if (!state.ads) state.ads = { day: todayKey(), energy: 0, double: 0 };
  if (!state.purchases) state.purchases = [];
  if (typeof state.paidCoins !== 'number') state.paidCoins = 0;
}
export function gems() { ensure(); return state.gems; }
export function addGems(n) { ensure(); state.gems = Math.max(0, Math.round(state.gems + n)); save(); }
export function spendGems(n) { ensure(); if (state.gems < n) return false; state.gems -= n; save(); return true; }

// piggy bank: a BONUS pot of gems filled by wins (the player's own currency is never taken)
export function piggyAddWin(golden) { ensure(); state.piggy.gems = Math.min(PIGGY.cap, state.piggy.gems + (golden ? PIGGY.perGolden : PIGGY.perWin)); save(); }
export function piggyGems() { ensure(); return state.piggy.gems; }
export function piggyBreak() { ensure(); const g = state.piggy.gems; state.piggy.gems = 0; addGems(g); return g; }

// pass: one-time 30 days; daily coins+gems settle automatically (no check-in needed, missed days are never lost)
export function passActive() { ensure(); return state.pass.until > Date.now(); }
export function passDaysLeft() { ensure(); return Math.max(0, Math.ceil((state.pass.until - Date.now()) / DAY)); }
export function passGrant(days) {
  ensure();
  const now = Date.now();
  if (state.pass.until > now) state.pass.until += days * DAY;           // extend
  else state.pass = { start: now, until: now + days * DAY, paidDays: 0, lastExtra: null };
  save();
}
export function passSettle() {
  ensure();
  const p = state.pass; if (!p.until) return null;
  const total = Math.round((p.until - p.start) / DAY);
  const accrued = Math.min(total, Math.floor((Math.min(Date.now(), p.until) - p.start) / DAY) + 1);
  const owed = accrued - (p.paidDays || 0);
  if (owed <= 0) return null;
  p.paidDays = accrued; addCoins(PASS.dailyCoins * owed); addGems(PASS.dailyGems * owed); save();
  return { days: owed, coins: PASS.dailyCoins * owed, gems: PASS.dailyGems * owed };
}

export function refillPrice(step = 0) { ensure(); const d = todayKey(); if (state.refills.day !== d) { state.refills = { day: d, n: 0 }; save(); } return GEM.refillLadder[Math.min(state.refills.n + step, GEM.refillLadder.length - 1)]; }
export function refillCount() { ensure(); refillPrice(); return state.refills.n; }
export function refillBuy() { const price = refillPrice(); if (!spendGems(price)) return false; state.refills.n++; save(); return true; }

export function adsLeft(kind = 'energy') { ensure(); const d = todayKey(); if (state.ads.day !== d) { state.ads = { day: d, energy: 0, double: 0 }; save(); } return (kind === 'energy' ? ADS.perDay : ADS.doubleWinPerDay) - state.ads[kind]; }
export function adUsed(kind = 'energy') { ensure(); adsLeft(kind); state.ads[kind]++; save(); }

export function starterAvailable() { ensure(); return !state.purchases.includes('starter_pack') && (state.stage || 1) >= 3; }
export function recordPurchase(id) { ensure(); state.purchases.push(id); save(); }
export function addPaidCoins(n) { ensure(); state.paidCoins += n; addCoins(n); }
export const RESERVE_FULL = RESERVE_CAP;
