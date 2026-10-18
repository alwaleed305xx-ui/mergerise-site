// Rewarded-video abstraction (docs/ios-decisions.md section 6, docs/monetization.md).
//   'mock'  web build only: a 5-second demo card. It can never show inside a store build.
//   'admob' native, only when the build enabled ads: window.MR_BUILD = { ads: true, admobRewardedIos: '<unit id>' }
//           (js/build-config.js, overwritten by CI). The AdMob plugin is reached through the Capacitor bridge
//           (window.Capacitor.Plugins.AdMob, never an npm import); non-personalised ads only, no tracking prompt.
//   'none'  everything else. v1 ships without ads, so every "watch an ad" button is hidden (adsAvailable() false).
import { el, $ } from './util.js';
import { t } from './i18n.js';

export const AD_CONFIG = { provider: 'auto', mockSeconds: 5, testing: false };   // 'auto' | 'mock' | 'admob' | 'none'

function cap() { return (typeof window !== 'undefined' && window.Capacitor) || null; }
function isNative() { try { const C = cap(); return !!(C && C.isNativePlatform && C.isNativePlatform()); } catch (_) { return false; } }
function platform() { try { const C = cap(); return (C && C.getPlatform && C.getPlatform()) || 'web'; } catch (_) { return 'web'; } }
function buildConfig() { const w = typeof window !== 'undefined' ? window : {}; const b = w.MR_BUILD || w.MERGERISE_CONFIG; return b && typeof b === 'object' ? b : {}; }
function rewardedId() {
  const b = buildConfig();
  const id = platform() === 'ios' ? (b.admobRewardedIos || b.admobIosRewardedId) : platform() === 'android' ? (b.admobRewardedAndroid || b.admobAndroidRewardedId) : '';
  return typeof id === 'string' ? id.trim() : '';
}
function admobPlugin() { const C = cap(); return (C && C.Plugins && C.Plugins.AdMob) || null; }

export function adProvider() {
  const native = isNative();
  let p = AD_CONFIG.provider;
  if (p === 'auto') p = native ? 'admob' : 'mock';
  if (native && p === 'mock') p = 'none';
  if (p === 'admob' && !(native && buildConfig().ads === true && rewardedId() && admobPlugin())) p = 'none';
  return ['mock', 'admob', 'none'].includes(p) ? p : 'none';
}
export const adsAvailable = () => adProvider() !== 'none';

// AdMob event names (RewardAdPluginEvents of @capacitor-community/admob 8.x)
const EV = { rewarded: 'onRewardedVideoAdReward', dismissed: 'onRewardedVideoAdDismissed', failedToShow: 'onRewardedVideoAdFailedToShow', failedToLoad: 'onRewardedVideoAdFailedToLoad' };
let admobReady = null;
function admobInit() {
  if (admobReady) return admobReady;
  admobReady = (async () => {
    const AdMob = admobPlugin(); if (!AdMob) throw new Error('admob-missing');
    // Google UMP consent (UK/CH and other consent regions); no App Tracking Transparency prompt: ads are non-personalised
    try { const info = await AdMob.requestConsentInfo(); if (info && info.isConsentFormAvailable && info.status === 'REQUIRED') await AdMob.showConsentForm(); } catch (_) { /* no form configured */ }
    await AdMob.initialize({ initializeForTesting: !!AD_CONFIG.testing, tagForUnderAgeOfConsent: false });
    return AdMob;
  })();
  admobReady.catch(() => { admobReady = null; });
  return admobReady;
}

const providers = {
  mock() {
    return new Promise(resolve => {
      const bg = el('div', { class: 'modal-bg' });
      let left = AD_CONFIG.mockSeconds;
      const num = el('div', { class: 'ad-count' }, String(left));
      const m = el('div', { class: 'modal dark ad' }, [el('h2', {}, t('adTitle')), el('div', { class: 'ad-box' }, [el('div', { class: 'ad-logo' }, 'AD'), num]), el('div', { class: 'tiny' }, t('adHint'))]);
      bg.append(m); $('#overlay').append(bg);
      const tick = setInterval(() => { left--; num.textContent = String(Math.max(0, left)); if (left <= 0) { clearInterval(tick); bg.remove(); resolve({ ok: true }); } }, 1000);
    });
  },
  async admob() {
    const handles = [];
    const drop = () => { for (const h of handles) Promise.resolve(h).then(x => x && x.remove && x.remove()).catch(() => null); };
    try {
      const AdMob = await admobInit();
      await AdMob.prepareRewardVideoAd({ adId: rewardedId(), npa: true, isTesting: !!AD_CONFIG.testing });
      return await new Promise(resolve => {
        let rewarded = false, done = false;
        const end = ok => { if (done) return; done = true; drop(); resolve({ ok }); };
        handles.push(AdMob.addListener(EV.rewarded, () => { rewarded = true; }));
        handles.push(AdMob.addListener(EV.dismissed, () => end(rewarded)));
        handles.push(AdMob.addListener(EV.failedToShow, () => end(false)));
        Promise.resolve(AdMob.showRewardVideoAd()).then(item => { if (item && item.amount != null) rewarded = true; }, () => end(false));
      });
    } catch (e) { drop(); return { ok: false, error: e && e.message ? e.message : String(e) }; }
  },
  async none() { return { ok: false, error: 'ads-disabled' }; },
};
export function showRewardedAd() { return (providers[adProvider()] || providers.none)(); }
