// Legal + support links shown in Settings and on the shop.
// Native (Capacitor iOS/Android): the public pages on GitHub Pages, the same URLs as in App Store Connect
// (docs/ios-decisions.md 10.2). Web: the files in this repo, so the web build works offline and on localhost.
// There is deliberately no email address here: the public contact route is the support page (GitHub Issues).
const SITE = 'https://alwaleed305xx-ui.github.io/mergerise-site/';
const isNative = () => { try { return !!window.Capacitor?.isNativePlatform?.(); } catch (_) { return false; } };

const NATIVE = { privacy: SITE + 'privacy.html', terms: SITE + 'terms.html', support: SITE };
const WEB = { privacy: 'privacy.html', terms: 'terms.html', support: 'site/index.html' };

export const LEGAL = {
  get privacy() { return (isNative() ? NATIVE : WEB).privacy; },
  get terms() { return (isNative() ? NATIVE : WEB).terms; },
  get support() { return (isNative() ? NATIVE : WEB).support; },
  developer: 'MergeRise',                                              // the developer name used in the store listing
  issues: 'https://github.com/alwaleed305xx-ui/mergerise-site/issues', // public contact route (linked from the support page)
};

// Opens in a new window. On iOS, Capacitor hands window.open / target=_blank for an external https URL to Safari,
// so the game keeps running underneath; on the web it is a new tab.
export function openLegal(which) {
  const url = { privacy: LEGAL.privacy, terms: LEGAL.terms, support: LEGAL.support, issues: LEGAL.issues }[which] || LEGAL.privacy;
  try { window.open(url, '_blank', 'noopener'); } catch (_) { location.href = url; }
}
