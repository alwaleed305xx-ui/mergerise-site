// StoreKit / Google Play Billing bridge (docs/ios-decisions.md section 5, docs/android-decisions.md section 5). This is
// the ONLY module that talks to the native in-app purchase plugin @capgo/native-purchases. There is no bundler, so the
// plugin is reached through the Capacitor bridge object window.Capacitor.Plugins.NativePurchases (never an npm import).
// Enabled on native iOS and native Android. Every Android-only path sits behind isAndroid(); iOS calls are unchanged.
const TYPE = 'inapp';   // the plugin's PURCHASE_TYPE.INAPP; App Store Connect / Play Console decide consumable vs non-consumable

function cap() { return (typeof window !== 'undefined' && window.Capacitor) || null; }
export function isNativeShell() { try { const C = cap(); return !!(C && C.isNativePlatform && C.isNativePlatform()); } catch (_) { return false; } }
export function platform() { try { const C = cap(); return (C && C.getPlatform && C.getPlatform()) || 'web'; } catch (_) { return 'web'; } }
export const isAndroid = () => isNativeShell() && platform() === 'android';
function plugin() {
  if (!isNativeShell()) return null;
  const pf = platform();
  if (pf !== 'ios' && pf !== 'android') return null;
  const C = cap(); return (C && C.Plugins && C.Plugins.NativePurchases) || null;
}
export const available = () => !!plugin();
const P = () => { const p = plugin(); if (!p) throw new Error('iap-unavailable'); return p; };
const msgOf = e => String((e && (e.message || e.errorMessage)) || e || '');
const codeOf = e => String((e && e.code) || '');

// ---------- Android: one serial queue for every plugin call (android-decisions 5.1) ----------
// The plugin keeps a single BillingClient and every call closes the previous one, so a price reload or a poll that
// started while the Play purchase sheet is open would kill that purchase's listener. Nothing runs in parallel.
let chain = Promise.resolve();
function q(fn) {
  const run = chain.then(() => fn());
  chain = run.then(() => undefined, () => undefined);
  return run;
}
// Play setup / availability codes (5.7). The plugin swaps code and message on setup errors, so both are tested.
const UNAVAILABLE = ['ITEM_UNAVAILABLE', 'BILLING_UNAVAILABLE', 'SERVICE_UNAVAILABLE', 'SERVICE_DISCONNECTED', 'BILLING_SETUP_FAILED', 'BILLING_SETUP_TIMEOUT', 'BILLING_INTERRUPTED'];
const hasCode = (e, c) => codeOf(e) === c || msgOf(e) === c;

// cancel stays silent, pending (Ask to Buy / Play pending payment) gets a toast, everything else is a generic failure
// (StoreKit error text is localised, so only these two plugin strings are matched). Android adds 'owned'
// (ITEM_ALREADY_OWNED: payments.js restores instead) and 'unavailable' (Play billing missing on the device/account).
export function errorKind(e) {
  const m = msgOf(e);
  if ((e && e.code === 'USER_CANCELED') || /user cancel/i.test(m)) return 'cancelled';
  if (isAndroid()) {
    if (hasCode(e, 'USER_CANCELED')) return 'cancelled';
    if (hasCode(e, 'ITEM_ALREADY_OWNED')) return 'owned';
    if (UNAVAILABLE.some(c => hasCode(e, c))) return 'unavailable';
  }
  if (/pending/i.test(m)) return 'pending';
  return 'failed';
}

// backup for capacitor.config.json plugins.NativePurchases.autoFinishTransactions=false (Android reads it in load() too)
export async function configure() { if (isAndroid()) { await q(() => P().configure({ autoFinishTransactions: false })); return; } await P().configure({ autoFinishTransactions: false }); }
// iOS only: Android never fires transactionUpdated, so payments.js polls with getPurchases instead
export function onTransaction(fn) { return P().addListener('transactionUpdated', fn); }
// iOS only: on Android getUnfinishedTransactions also queries SUBS, and that failing query fails the whole call
export async function unfinished() { const r = await P().getUnfinishedTransactions(); return (r && r.transactions) || []; }

// Localised products. iOS: getProducts silently drops ids it cannot find, so gaps are retried one by one,
// strictly in sequence (the native billing client does not support parallel queries).
export async function products(ids) {
  if (isAndroid()) return playProducts(ids);
  const p = P(); const out = new Map();
  try { const r = await p.getProducts({ productIdentifiers: ids, productType: TYPE }); for (const sp of (r && r.products) || []) if (sp && sp.identifier) out.set(sp.identifier, sp); } catch (_) { /* filled below */ }
  for (const id of ids) {
    if (out.has(id)) continue;
    try { const r = await p.getProduct({ productIdentifier: id, productType: TYPE }); if (r && r.product && r.product.identifier === id) out.set(id, r.product); } catch (_) { /* not on the store (yet) */ }
  }
  return out;
}
// Android: one getProducts call, no getProduct loop. Play returns one entry per one-time offer: keep the first entry per
// identifier, preferring the base offer (no offerId). Rejects ("Product not found") when Play knows none of the ids.
async function playProducts(ids) {
  const out = new Map();
  const r = await q(() => P().getProducts({ productIdentifiers: ids, productType: TYPE }));
  for (const sp of (r && r.products) || []) {
    if (!sp || !sp.identifier || !ids.includes(sp.identifier)) continue;
    const had = out.get(sp.identifier);
    if (!had || (had.offerId && !sp.offerId)) out.set(sp.identifier, sp);
  }
  return out;
}

// onLate (Android, best effort only): receives a purchase that resolves after the watchdog already released it. In
// practice it rarely runs: the next queued plugin call (payments.js's own getPurchases right after the release) starts
// with initBillingClient(), which closes the BillingClient that holds this purchase's listener. payments.js therefore
// relies on getPurchases polls (follow-ups at +20 s / +60 s / +180 s, shop open, visibilitychange, launch, Restore).
export function purchase(id, consumable, onLate) {
  if (isAndroid()) return playPurchase(id, consumable, onLate);
  return P().purchaseProduct({ productIdentifier: id, productType: TYPE, quantity: 1, isConsumable: !!consumable, autoAcknowledgePurchases: false });
}
// Android watchdog (5.2): a purchase still unsettled 60 s after the app became visible again is released from the queue
// (it rejects as pending, payments.js then polls getPurchases now and in follow-ups); a late resolution, if the listener
// is still alive, reaches onLate, and the ledger blocks a duplicate either way.
export const WATCHDOG_MS = 60000;
export const isWatchdog = e => !!(e && e.code === 'WATCHDOG');
function playPurchase(id, consumable, onLate) {
  return q(() => new Promise((resolve, reject) => {
    let settled = false, timer = 0;
    const doc = typeof document !== 'undefined' ? document : null;
    const stop = () => { clearTimeout(timer); timer = 0; if (doc) doc.removeEventListener('visibilitychange', onVis); };
    const release = () => {
      if (settled) return;
      settled = true; stop();
      const e = new Error('Purchase is pending (no answer from Google Play yet)'); e.code = 'WATCHDOG';
      reject(e);
    };
    function onVis() { clearTimeout(timer); timer = 0; if (!doc.hidden) timer = setTimeout(release, WATCHDOG_MS); }
    if (doc) doc.addEventListener('visibilitychange', onVis);
    let call;
    try { call = Promise.resolve(P().purchaseProduct({ productIdentifier: id, productType: TYPE, quantity: 1, isConsumable: !!consumable, autoAcknowledgePurchases: false })); }
    catch (e) { call = Promise.reject(e); }
    call.then(tx => {
      if (!settled) { settled = true; stop(); resolve(tx); return; }
      if (onLate && tx) { try { onLate(tx); } catch (_) { /* recovered by the next getPurchases */ } }
    }, e => { if (!settled) { settled = true; stop(); reject(e); } });
  }));
}

// iOS: true when StoreKit no longer holds the transaction; "not found or already finished" counts as success
export async function finish(transactionId) {
  try { await P().finishTransaction({ transactionId: String(transactionId) }); return true; }
  catch (e) { return /not found or already finished/i.test(msgOf(e)); }
}

// AppStore.sync: may show an Apple ID sheet, so only call it from a user tap (iOS only; Android's restorePurchases
// returns before it runs and carries no data)
export async function restore() { await P().restorePurchases(); }
// Transaction.currentEntitlements of THIS Apple ID (never consumables). iOS only.
export async function entitlements() { const r = await P().getPurchases({ productType: TYPE, onlyCurrentEntitlements: true }); return (r && r.purchases) || []; }

// ---------- Android only ----------
// Every in-app purchase Play still holds for this account: unconsumed consumables, the starter pack, pending payments.
// purchaseState '1' = PURCHASED, '2' = PENDING. Rejects (QUERY_PURCHASES_FAILED) instead of returning a partial list:
// a rejection never means "owns nothing".
export async function playPurchases() {
  const r = await q(() => P().getPurchases({ productType: TYPE }));
  return (r && Array.isArray(r.purchases)) ? r.purchases : [];
}
const tokenOf = tx => String((tx && (tx.purchaseToken || tx.transactionId)) || '');
// Consumables: consumePurchase. starter_pack: acknowledgePurchase unless Play already lists it as acknowledged.
// Never finishTransaction (it always rejects on Android). A failed call carries no code, so it counts as done only when
// a follow-up getPurchases no longer lists the token (consumable) or lists it as acknowledged (5.6); otherwise the
// next recovery retries it. Play refunds anything not finished within 3 days.
export async function settle(tx, consumable) {
  const token = tokenOf(tx);
  if (!token) return false;
  if (!consumable && tx.isAcknowledged === true) return true;
  try {
    await q(() => (consumable ? P().consumePurchase({ purchaseToken: token }) : P().acknowledgePurchase({ purchaseToken: token })));
    return true;
  } catch (_) {
    try {
      const hit = (await playPurchases()).find(p => tokenOf(p) === token);
      return consumable ? !hit : !!(hit && hit.isAcknowledged === true);
    } catch (__) { return false; }
  }
}
