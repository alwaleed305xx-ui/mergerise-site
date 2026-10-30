// MergeRise bootstrap + screen router.
import { el, $ } from './util.js';
import { state, hasProfile, save, setReserveRegen } from './store.js';
import { perksFor } from './sets.js';
import { setLang, t } from './i18n.js';
import * as audio from './audio.js';
import * as create from './screens/create.js';
import * as hub from './screens/hub.js';
import * as play from './screens/play.js';
import * as wardrobe from './screens/wardrobe.js';
import * as shop from './screens/shop.js';
import * as collection from './screens/collection.js';
import * as week from './screens/week.js';
import { initPayments } from './payments.js';

const SCREENS = { create, hub, play, wardrobe, shop, collection, week };
const rootEl = $('#app');
let cleanup = null;

export const app = {
  current: null,
  go(name, params = {}) {
    const mod = SCREENS[name]; if (!mod) return;
    if (cleanup) { try { cleanup(); } catch (_) { /* ignore */ } cleanup = null; }
    $('#overlay').innerHTML = '';
    for (const old of rootEl.querySelectorAll(':scope > .screen:not(.leaving)')) { old.classList.add('leaving'); setTimeout(() => old.remove(), 220); }
    const screen = el('div', { class: 'screen' });
    rootEl.append(screen);
    rootEl.scrollTop = 0; rootEl.scrollLeft = 0;
    app.current = name;
    cleanup = mod.render(screen, params, app) || null;
    try { location.hash = name; } catch (_) { /* ignore */ }
  },
};
window.app = app;

// Android Back button (docs/android-decisions.md section 6). android-extra/MainActivity.java calls window.mrBack() on
// every Back press: true = handled here; anything else = Android's own Back (the app goes to the background), which
// only happens on the hub and on the first-run hero editor. iOS and the web never call it.
function back() {
  // 1. the top sheet: × closes it exactly as a tap would; a sheet without × (win, gift, pause, out of energy, rival
  //    results) keeps Back to itself, like a non-cancelable Android dialog, so no reward or choice is ever skipped.
  //    A sheet that is already closing carries an inline reverse animation and no longer counts.
  const sheets = [...document.querySelectorAll('#overlay > .modal-bg')].filter(b => !b.style.animation);
  const top = sheets[sheets.length - 1];
  if (top) { const x = top.querySelector('.modal > .x'); if (x) x.click(); return true; }
  if (app.current === 'hub') return false;
  if (app.current === 'create') { if (!hasProfile()) return false; app.go('hub'); return true; }   // nothing is saved
  // 2. the screen's own top-left button: Pause on the board (a stage is never silently abandoned), Back on shop,
  //    wardrobe, collection and This Week (each keeps its own return target).
  const screens = rootEl.querySelectorAll(':scope > .screen:not(.leaving)');
  const screen = screens[screens.length - 1];
  const own = screen && screen.querySelector('.hud > .btn.icon, .topbar > .btn.icon');
  if (own) { own.click(); return true; }
  app.go('hub'); return true;
}
window.mrBack = () => {
  try { return back(); } catch (e) {
    console.error('MergeRise back', e);
    if (app.current === 'hub') return false;
    try { app.go('hub'); return true; } catch (_) { return false; }
  }
};

function boot() {
  // the app container must never scroll (focus / scrollIntoView would shift the whole game)
  rootEl.addEventListener('scroll', () => { rootEl.scrollTop = 0; rootEl.scrollLeft = 0; });
  setLang(state.settings.lang || 'en');
  setReserveRegen(() => perksFor(state.equipped).reserveRegenMul || 1);   // West Coast set: reserve +1 twice as fast
  audio.setSfx(state.settings.sfx); audio.setMusic(state.settings.music);
  const unlock = () => { audio.unlock(); };
  window.addEventListener('pointerdown', unlock, { once: true });
  window.addEventListener('keydown', unlock, { once: true });
  document.addEventListener('visibilitychange', () => { if (!document.hidden) audio.unlock(); });
  if ('serviceWorker' in navigator && location.protocol.startsWith('http')) navigator.serviceWorker.register('sw.js').catch(() => null);
  app.go(hasProfile() ? 'hub' : 'create', {});
  initPayments().catch(() => null);
}
window.addEventListener('error', e => { console.error('MergeRise error', e.error || e.message); });
boot();
