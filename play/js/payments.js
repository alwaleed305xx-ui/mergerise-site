// Payment provider abstraction (docs/ios-decisions.md section 5, docs/android-decisions.md section 5, docs/monetization.md).
//   'mock'   web build only: a demo checkout that charges nothing.
//   'native' native iOS: Apple In-App Purchase (StoreKit 2); native Android: Google Play Billing. Both through js/iap.js
//            (@capgo/native-purchases); the store verifies and charges.
//   'none'   payments off: a native build without the plugin. The shop hides buy buttons.
// A demo checkout can never run inside a store build: on native a forced 'mock' becomes 'none'.
// Delivery is "grant, save, then finish": every transaction id is written to state.iapLedger in the same save as
// its grant, and the store is told to finish only after that save is durable (store.flushed: the native mirror, or
// WebKit's write-back window), so nothing is granted twice and nothing is lost. iOS finishes with finishTransaction;
// Android consumes (consumables) or acknowledges (starter_pack), and its ledger key is the purchase token.
import { productById, addGems, addPaidCoins, passGrant, piggyBreak, recordPurchase, PRODUCTS } from './economy.js';
import { state, save, addItem, flushed } from './store.js';
import { t } from './i18n.js';
import { toast, I } from './ui.js';
import * as iap from './iap.js';

export const CONFIG = {
  provider: 'auto',      // 'auto' | 'mock' | 'native' | 'none'
  // Store product ids are economy.js PRODUCTS ids, identical on both stores (store/iap.json): starter_pack is
  // NON_CONSUMABLE (restorable); gems_*, pass_30d (30 days, never renews) and piggy_break are CONSUMABLE.
};
const LEDGER_MAX = 300;          // newest processed transaction ids kept in the save
const DAY = 86400000;
const RECOVER_GAP = 30000;       // Android: at most one getPurchases poll per 30 s from visibilitychange or the shop opening
const android = () => iap.isAndroid();

export function providerName() {
  const native = iap.isNativeShell();
  let p = CONFIG.provider;
  if (p === 'auto') p = native ? 'native' : 'mock';
  if (native && p === 'mock') p = 'none';
  if (p === 'native' && !iap.available()) p = 'none';   // plugin missing, or not iOS/Android
  return ['mock', 'native', 'none'].includes(p) ? p : 'none';
}
export const isMock = () => providerName() === 'mock';
export const canPay = () => providerName() !== 'none';
export const isConsumable = id => { const p = productById(id); return !!p && !p.once; };

// ---------- store-localised prices: native shows priceString only, never a hard-coded USD ----------
const priceCache = new Map();
let priceTried = false, priceJob = null, priceAt = 0;
export async function loadPrices() {
  if (providerName() !== 'native') return;
  if (priceJob) return priceJob;
  const missing = PRODUCTS.map(p => p.id).filter(id => !priceCache.has(id));
  if (!missing.length || (priceTried && Date.now() - priceAt < 60000)) return;
  priceJob = (async () => {
    try {
      const found = await iap.products(missing);
      for (const [id, sp] of found) if (sp && sp.priceString) priceCache.set(id, { price: sp.price, currencyCode: sp.currencyCode, priceString: sp.priceString });
    } catch (_) { /* store unreachable: products stay hidden, retried when the shop opens again */ }
    priceTried = true; priceAt = Date.now(); priceJob = null;
    try { window.dispatchEvent(new CustomEvent('mr:prices')); } catch (_) { /* no DOM */ }
  })();
  return priceJob;
}
export function storePrice(id) { return priceCache.get(id) || null; }
export function priceLabel(p) { const sp = priceCache.get(p.id); if (sp) return sp.priceString; return isMock() ? `$${p.usd.toFixed(2)}` : '…'; }
// gem → money reference uses the entry pack; null on native until the store answered (the shop then shows no figure)
export function entryPrice() {
  const sp = priceCache.get('gems_100');
  if (sp && typeof sp.price === 'number' && sp.currencyCode) return { price: sp.price, currency: sp.currencyCode };
  return isMock() ? { price: 0.99, currency: 'USD' } : null;
}
// shown: the shop renders this product (native: while prices load, or when the store returned it)
export function productShown(id) { const pv = providerName(); if (pv === 'mock') return true; if (pv !== 'native') return false; return priceCache.has(id) || !priceTried; }
// purchasable: the buy button is enabled
export function purchasable(id) { const pv = providerName(); return pv === 'mock' || (pv === 'native' && priceCache.has(id)); }
// the store answered and returned nothing at all (offline, or products not live yet)
export const storeUnavailable = () => providerName() === 'native' && priceTried && !priceJob && priceCache.size === 0;

// ---------- grant ----------
function owned(id) { return (state.purchases || []).includes(id); }
// An old starter pack coming back gets its item + owned flag only. iOS: purchased more than 24 h ago. Android: Play lists
// it as acknowledged (an unacknowledged Play purchase was never finished, so never fully granted, however old it is).
function redownload(tx) {
  if (android()) return !!(tx && tx.isAcknowledged === true);
  const when = tx && tx.purchaseDate ? Date.parse(tx.purchaseDate) : NaN;
  return Number.isFinite(when) && Date.now() - when > DAY;
}
// Grant what a product contains. Returns the gems it added for piggy_break, true for others, false when nothing.
export function grant(id, tx = null) {
  const p = productById(id); if (!p) return false;
  if (p.kind === 'gems') { addGems(p.amount || 0); recordPurchase(id); return true; }
  if (p.kind === 'pass') { passGrant(p.days); recordPurchase(id); return true; }
  if (p.kind === 'piggy') { const g = piggyBreak(); recordPurchase(id); return g; }
  if (p.kind === 'starter') {
    if (owned(id)) return false;
    if (!redownload(tx)) { addPaidCoins(p.coins); addGems(p.gems); }
    if (p.item) addItem(p.item);
    recordPurchase(id);
    return true;
  }
  return false;
}
function ledger() { if (!state.iapLedger || typeof state.iapLedger !== 'object' || Array.isArray(state.iapLedger)) state.iapLedger = {}; return state.iapLedger; }
function trimLedger() { const L = ledger(), ks = Object.keys(L); for (let i = 0; i < ks.length - LEDGER_MAX; i++) delete L[ks[i]]; }
export const ledgerHas = txId => !!ledger()[String(txId)];

// Tell the store the transaction is done. iOS: finishTransaction. Android: consume / acknowledge, one at a time per token
// (a recovery poll and the shop's own delivery can meet on the same purchase).
const settling = new Map();
function finishTx(tx, txId, productId) {
  if (!android()) return iap.finish(txId);
  if (settling.has(txId)) return settling.get(txId);
  const job = iap.settle(tx, isConsumable(productId)).finally(() => settling.delete(txId));
  settling.set(txId, job);
  return job;
}

// Deliver one store transaction: synchronous until the first await (grant + ledger + one save), then finish.
// source: 'purchase' (the buy call), 'update' (transactionUpdated: Ask to Buy, other devices; Android: a late purchase),
// 'boot' (unfinished at launch; Android: every getPurchases poll)
function deliver(tx, source, { finish = true } = {}) {
  const id = tx && tx.productIdentifier;
  const txId = tx && tx.transactionId != null ? String(tx.transactionId) : '';
  const product = id ? productById(id) : null;
  if (!txId || !product) return Promise.resolve({ ok: false, error: 'unknown-product', productId: id || null });   // left unfinished for a newer app version
  const L = ledger();
  let res;
  if (tx.revocationDate) res = { ok: false, error: 'revoked', productId: id };
  else if (L[txId]) res = { ok: true, granted: false, dup: true, productId: id };
  else {
    L[txId] = id;                         // written before the grant, so every save that holds the grant holds the id
    const g = grant(id, tx);
    trimLedger(); save();
    res = { ok: true, granted: g !== false, productId: id, gems: typeof g === 'number' ? g : undefined };
  }
  if (res.granted && source !== 'purchase') {
    try { toast(`${t('purchaseArrived')}${res.gems ? ` +${res.gems} 💎` : ''}`, { icon: I.check(), ms: 2600 }); } catch (_) { /* no DOM yet */ }
  }
  try { window.dispatchEvent(new CustomEvent('mr:purchase', { detail: { ...res, source } })); } catch (_) { /* no DOM */ }
  if (!finish || res.error === 'unknown-product') return Promise.resolve(res);
  // The store's finish is durable at once, but WebKit writes localStorage back to disk about a second later: finish
  // only after store.flushed() (the native mirror confirmed the save, or WebKit's write-back window has passed).
  // A kill before that leaves the transaction unfinished; the next launch redelivers it and the ledger blocks a
  // second grant. A purchase made from the shop does not wait for this: its result returns now, the finish follows.
  const done = flushed().then(() => finishTx(tx, txId, id)).then(ok => ({ ...res, finished: ok }), () => ({ ...res, finished: false }));
  return source === 'purchase' ? Promise.resolve({ ...res, finished: null }) : done;
}

// ---------- providers ----------
const providers = {
  async mock(product, ui) {
    const ok = await ui.confirmMock(product);
    if (!ok) return { ok: false, error: 'cancelled' };
    const tx = { transactionId: `mock-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`, productIdentifier: product.id, purchaseDate: new Date().toISOString() };
    return deliver(tx, 'purchase', { finish: false });
  },
  async native(product) {
    let tx;
    // Android: a purchase that answers after the watchdog released it is delivered like any other (the ledger blocks a
    // duplicate). Best effort only: the next plugin call usually closes the BillingClient holding that listener first,
    // so the follow-up polls below are what actually deliver it.
    try { tx = await iap.purchase(product.id, !product.once, late => { deliver(late, 'update').catch(() => null); }); }
    catch (e) {
      const kind = iap.errorKind(e);
      if (android()) {
        // Play says the account already holds this product: deliver / restore it from getPurchases instead of failing.
        // "Restored" is said only when this product really came back; a PENDING one is reported as pending.
        if (kind === 'owned') {
          const r = await recover({ force: true });
          if (!r.ok) return { ok: false, error: 'failed' };      // Play could not list it right now: nothing changed
          if (r.got.includes(product.id)) {
            try { toast(t('alreadyOwned'), { icon: I.check(), ms: 2800 }); } catch (_) { /* no DOM */ }
            return { ok: false, error: 'already-owned', restored: r.restored + r.granted };
          }
          if (r.pending.includes(product.id)) { followUp(); return { ok: false, error: 'pending' }; }
          // already delivered earlier (its consume / acknowledge was just retried) or Play no longer lists it: try again
          return { ok: false, error: 'failed' };
        }
        // the watchdog released a purchase Play never answered: read Play's own list now (the ledger blocks a duplicate)
        if (iap.isWatchdog(e)) recover({ force: true }).catch(() => null);
        // a released or pending purchase can complete without any visibilitychange (the Play sheet is translucent)
        if (kind === 'pending') followUp();
      }
      return { ok: false, error: kind };       // 'cancelled' | 'pending' | 'failed' | (Android) 'unavailable'
    }
    if (!tx || !tx.transactionId) return { ok: false, error: 'failed' };
    return deliver(tx, 'purchase');
  },
  async none() { return { ok: false, error: 'payments-disabled' }; },
};

let buying = false;
// → { ok, error?: 'cancelled'|'pending'|'failed'|'unavailable'|'already-owned'|'payments-disabled'|'busy'|'unknown-product', gems? }
export async function buy(id, ui) {
  const product = productById(id); if (!product) return { ok: false, error: 'unknown-product' };
  if (product.once && owned(id)) return { ok: false, error: 'already-owned' };
  const pv = providerName();
  if (pv === 'native' && !priceCache.has(id)) return { ok: false, error: 'failed' };
  if (buying) return { ok: false, error: 'busy' };
  buying = true;
  try { return await (providers[pv] || providers.none)(product, ui); }
  finally { buying = false; }
}

// iOS only (Android never calls getUnfinishedTransactions: its SUBS query fails the whole call)
async function processUnfinished() {
  let list = [];
  try { list = await iap.unfinished(); } catch (_) { return 0; }
  let n = 0;
  for (const tx of list) { try { const r = await deliver(tx, 'boot'); if (r.granted) n++; } catch (_) { /* retried next launch */ } }
  return n;
}
// Owned starter packs from the store: the item and owned flag only (its coins and gems are never re-granted, so Restore
// cannot be farmed). Returns how many were restored.
function restoreOwned(list) {
  let restored = 0;
  for (const tx of list) {
    if (!tx || tx.productIdentifier !== 'starter_pack' || tx.revocationDate) continue;
    const L = ledger();
    if (tx.transactionId != null && !L[String(tx.transactionId)]) L[String(tx.transactionId)] = 'starter_pack';
    if (!owned('starter_pack')) {
      const p = productById('starter_pack');
      if (p.item) addItem(p.item);
      recordPurchase('starter_pack');
      restored++;
    }
  }
  trimLedger(); save();
  if (restored) { try { window.dispatchEvent(new CustomEvent('mr:purchase', { detail: { ok: true, granted: true, productId: 'starter_pack', source: 'restore' } })); } catch (_) { /* no DOM */ } }
  return restored;
}
// iOS: the current entitlements of this Apple ID
async function syncOwned() { return restoreOwned(await iap.entitlements()); }

// ---------- Android: getPurchases polling (android-decisions 5.4) ----------
// Play has no live purchase events in this plugin, so every in-app purchase Play still holds is read back: at launch,
// when the app becomes visible again and when the shop opens (at most once per 30 s for both), after
// ITEM_ALREADY_OWNED or the watchdog, in the follow-up polls after a watchdog release or a pending payment, and from
// Restore Purchases. PURCHASED ('1'): a consumable or an unacknowledged starter pack gets the full delivery, then is
// consumed / acknowledged; an acknowledged starter pack gets the item + owned flag only. PENDING ('2'): nothing yet.
// A failed query (QUERY_PURCHASES_FAILED) changes nothing: it never means "owns nothing", and nothing is ever revoked.
// → { ok, restored, granted, got: product ids granted or restored by this poll, pending: product ids Play lists as PENDING }
let recoverJob = null, recoverAt = 0;
const NONE = ok => ({ ok, restored: 0, granted: 0, got: [], pending: [] });
function recover({ force = false } = {}) {
  if (!android() || providerName() !== 'native') return Promise.resolve(NONE(false));
  if (recoverJob) return recoverJob;
  if (!force && Date.now() - recoverAt < RECOVER_GAP) return Promise.resolve({ ...NONE(true), skipped: true });
  recoverAt = Date.now();
  recoverJob = (async () => {
    let list;
    try { list = await iap.playPurchases(); } catch (_) { return NONE(false); }
    const bought = list.filter(tx => tx && String(tx.purchaseState) === '1' && tx.transactionId != null);
    const pending = list.filter(tx => tx && String(tx.purchaseState) === '2').map(tx => tx.productIdentifier);
    const keep = bought.filter(tx => tx.productIdentifier === 'starter_pack' && tx.isAcknowledged === true);
    let granted = 0; const got = [];
    for (const tx of bought) {
      if (keep.includes(tx)) continue;
      try { const r = await deliver(tx, 'boot'); if (r.granted) { granted++; got.push(r.productId); } } catch (_) { /* retried by the next poll */ }
    }
    const restored = keep.length ? restoreOwned(keep) : 0;
    if (restored) got.push('starter_pack');
    return { ok: true, restored, granted, got, pending };
  })().finally(() => { recoverJob = null; });
  return recoverJob;
}
// Android: a throttled poll (RECOVER_GAP) for screens that sell, so a purchase finished on the Play sheet after the
// watchdog let it go shows up as soon as the player looks at the shop. No-op on iOS and the web.
export function pollPurchases() { return recover().catch(() => NONE(false)); }

// Android follow-up polls (android-decisions 5.2). After the watchdog releases a purchase, the plugin call that comes
// next (this module's own recover) closes the BillingClient that holds the purchase listener, so iap.js's late answer is
// best effort only; and closing the translucent Play sheet fires no visibilitychange. So after a release or a pending
// payment, getPurchases is read again at +20 s, +60 s and +180 s, each one only while the page is visible (a hidden
// page polls on its own when it comes back). A new release or pending result restarts the schedule.
const FOLLOW_UP_GAPS = [20000, 40000, 120000];   // gaps between the polls, not offsets
let followTimer = 0;
function followUp() {
  if (!android()) return;
  clearTimeout(followTimer);
  let i = 0;
  const step = () => {
    if (i >= FOLLOW_UP_GAPS.length) { followTimer = 0; return; }
    followTimer = setTimeout(() => {
      i++;
      let hidden = false;
      try { hidden = !!document.hidden; } catch (_) { /* no DOM */ }
      if (!hidden) recover({ force: true }).catch(() => null);
      step();
    }, FOLLOW_UP_GAPS[i]);
  };
  step();
}

// "Restore Purchases" (Guideline 3.1.1; on Android whenever Play billing is active). Only from a user tap: on iOS
// AppStore.sync may show an Apple ID sheet. → { ok, restored } | { ok:false, error:'not-available'|'cancelled'|'failed' }
export async function restorePurchases() {
  if (providerName() !== 'native') return { ok: false, error: 'not-available' };
  if (android()) {
    const r = await recover({ force: true });
    return r.ok ? { ok: true, restored: r.restored + r.granted } : { ok: false, error: 'failed' };
  }
  try { await iap.restore(); }
  catch (e) { if (iap.errorKind(e) === 'cancelled') return { ok: false, error: 'cancelled' }; /* entitlements are still readable below */ }
  await processUnfinished();
  try { return { ok: true, restored: await syncOwned() }; }
  catch (_) { return { ok: false, error: 'failed' }; }
}

// Startup (crash-safe order). iOS: configure → listen → deliver unfinished → silent owned sync → prices.
// Capacitor drops plugin events fired before JS listens, and StoreKit reports unfinished transactions at launch.
// Android: configure → getPurchases recovery → prices, then a recovery poll whenever the app becomes visible again.
let initJob = null;
export function initPayments() {
  if (initJob) return initJob;
  initJob = (async () => {
    if (providerName() !== 'native') return;
    try { await iap.configure(); } catch (_) { /* the capacitor.config.json key already set it */ }
    if (android()) {
      await recover({ force: true });
      try { document.addEventListener('visibilitychange', () => { if (!document.hidden) recover().catch(() => null); }); } catch (_) { /* no DOM */ }
      await loadPrices();
      return;
    }
    try { await iap.onTransaction(tx => { deliver(tx, 'update').catch(() => null); }); } catch (_) { /* recovered at next launch */ }
    await processUnfinished();
    try { await syncOwned(); } catch (_) { /* offline: Restore Purchases retries */ }
    await loadPrices();
  })();
  return initJob;
}
