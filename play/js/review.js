// Ratings. Two routes, both allowed by App Store Guideline 5.6.1 and Google Play's review policy:
//   1. the store's own rating sheet (iOS SKStoreReviewController / Play In-App Review) through the native plugin
//      @capacitor-community/in-app-review, reached as window.Capacitor.Plugins.InAppReview (no bundler, no npm import).
//      Asked only right after a great stage win, back on the hub, never after a loss or a purchase. The OS decides
//      whether the sheet really shows (iOS: at most 3 times a year) and never says if it did or what was rated.
//   2. a "Rate MergeRise" row in Settings that opens the store's write-review page, for players who want to rate.
// Never: a custom "do you like the game?" pop-up, a reward for rating, or asking only happy players first.
import { state, save, wonStages } from './store.js';

export const APP_STORE_ID = '6824475862';
const PLAY_ID = 'app.mergerise.game';
const FIRST_AT_WINS = 6;                 // first ask: 6 stages won (about 15 minutes of play)
const GAP_WINS = 20, GAP_DAYS = 45;      // later asks: 20 more stages and 45 days after the previous one
const MAX_ASKS = 3;                      // our own cap per install, under Apple's 3 per year
const DAY = 86400000;

function cap() { return (typeof window !== 'undefined' && window.Capacitor) || null; }
function native() { try { const C = cap(); return !!(C && C.isNativePlatform && C.isNativePlatform()); } catch (_) { return false; } }
function platform() { try { const C = cap(); return (C && C.getPlatform && C.getPlatform()) || 'web'; } catch (_) { return 'web'; } }
function plugin() { if (!native()) return null; const C = cap(); return (C && C.Plugins && C.Plugins.InAppReview) || null; }

// the store's write-review page; null on the web build (there is no store listing to rate from a browser)
export function rateUrl() {
  if (!native()) return null;
  const pf = platform();
  if (pf === 'ios') return `https://apps.apple.com/app/id${APP_STORE_ID}?action=write-review`;
  if (pf === 'android') return `https://play.google.com/store/apps/details?id=${PLAY_ID}`;
  return null;
}
export function openRatePage() {
  const url = rateUrl(); if (!url) return;
  // Capacitor hands an external https URL opened with _blank to the system, which opens the App Store / Play Store app
  try { window.open(url, '_blank', 'noopener'); } catch (_) { location.href = url; }
}

const rec = () => { const r = state.review; return r && typeof r === 'object' ? r : (state.review = { asks: 0, at: 0, wins: 0 }); };
let due = false;   // set by a qualifying win in play, used once by the hub that follows it

// play.js calls this from a normal stage win (not the Daily Hustle): a 3-star or golden win is the "happy moment"
export function noteWin({ stars, golden }) {
  if (!plugin() || !(stars >= 3 || golden)) return;
  const r = rec(), won = wonStages();
  if ((r.asks || 0) >= MAX_ASKS) return;
  if (!r.asks) { if (won >= FIRST_AT_WINS) due = true; return; }
  if (won - (r.wins || 0) >= GAP_WINS && Date.now() - (r.at || 0) >= GAP_DAYS * DAY) due = true;
}

// hub.js calls this on render; waits until the hub is idle (no modal open, still on the hub), then asks once
export function askIfDue(app) {
  if (!due) return;
  due = false;
  let tries = 0;
  const tick = () => {
    if (!app || app.current !== 'hub') return;                                   // left the hub: next great win asks
    if (document.querySelector('#overlay .modal-bg')) { if (++tries < 12) setTimeout(tick, 1500); return; }
    const p = plugin(); if (!p || typeof p.requestReview !== 'function') return;
    const r = rec(); r.asks = (r.asks || 0) + 1; r.at = Date.now(); r.wins = wonStages(); save();
    try { const res = p.requestReview(); if (res && typeof res.catch === 'function') res.catch(() => null); } catch (_) { /* optional */ }
  };
  setTimeout(tick, 2200);   // after the hub's win line, confetti and tier-up toast
}
