// Build flags, loaded by a classic <script> before js/app.js (docs/ios-decisions.md section 6).
// This committed default is what the web/PWA build uses: no ads. CI overwrites www/js/build-config.js for native builds.
window.MR_BUILD = { ads: false, admobRewardedIos: '' };
