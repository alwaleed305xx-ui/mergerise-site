// Style engine (docs/unique-features.md F1): 12 themes, theme score + stars, Auto-dress (bestLook),
// "+N" item deltas, worn log (Fit Check +4), saved looks and the Lookbook pages with their gem tiers.
// Families = the set ids of js/sets.js; an item's families come from setsOfItem(), so no per-item data is needed.
import { state, save, spend } from './store.js';
import { getItem, fitsGender } from './wardrobe.js';
import { setsOfItem, ALL_SETS } from './sets.js';
import { addGems, FREE_GEMS } from './economy.js';

export const FAMILIES = ALL_SETS.map(s => s.id);
// ---------- numbers (F1 "Numbers", do not retune without the doc) ----------
export const rarityPts = { rags: 0, common: 10, rare: 16, epic: 24, legendary: 36 };
export const familyMul = { main: 3.0, side: 1.8, other: 1.0 };
export const CHARM = new Set(['pet_cat', 'pet_dog', 'coffee', 'basketball', 'football', 'skateboard', 'cash']);   // acc templates: flat +6 each (doc F1; an item may also carry charm: true)
export const charm = 6;
export const unworn = 4;                 // Fit Check only: +4 per piece never worn in a judged event
export const STAR_CAP = 5.8;
export const par = n => 90 + 5 * Math.min(60, Math.max(1, Math.round(n || 1)));   // stops growing at stage 60 (390): a full legendary look can still reach 5★ on the 1,000-stage World Tour
// gem tiers once per Lookbook page: 3.5 / 4.0 / 4.5 / 5.0★ pay FREE_GEMS.lookbook (2 / 4 / 6 / 8) so the gem audit in economy.js never drifts
const LOOKBOOK_GEMS = Array.isArray(FREE_GEMS.lookbook) && FREE_GEMS.lookbook.length === 4 ? FREE_GEMS.lookbook : [2, 4, 6, 8];
export const STAR_TIERS = [3.5, 4.0, 4.5, 5.0].map((stars, i) => ({ stars, gems: LOOKBOOK_GEMS[i] }));
export const LOOK_SLOTS_FREE = 3, LOOK_SLOT_PRICE = 300, LOOK_SLOTS_MAX = 9;
export const LOOKBOOK_START = 3;         // pages open from the start; the week's page unlocks every Monday
// slots that count as outfit pieces (the background is a scene, not a piece)
export const SLOTS = ['hair', 'outfit', 'top', 'bottom', 'shoes', 'hat', 'glasses', 'acc'];

// ---------- themes: main family ×3.0, side family ×1.8; thin families (chef, pets) only ever score as charm ----------
export const THEMES = [
  { id: 'block_party', name: { en: 'Brooklyn Block Party', ar: 'حفلة حي بروكلين' }, brief: { en: 'Hydrants open, speakers out. Streetwear with a splash of summer.', ar: 'صنابير مفتوحة وسماعات بالشارع. لبس شوارع بلمسة صيفية.' }, main: 'street', side: 'beach', emoji: '🎉' },
  { id: 'yankees', name: { en: 'Baseball Game', ar: 'مباراة بيسبول' }, brief: { en: 'Bleacher seats in the Bronx. Jerseys, caps and sneakers.', ar: 'مدرجات البرونكس. جيرسي وكاب وسنيكرز.' }, main: 'athlete', side: 'street', emoji: '⚾' },
  { id: 'wall_street', name: { en: 'Wall Street Interview', ar: 'مقابلة وول ستريت' }, brief: { en: 'Nail the interview: sharp suit, clean shoes, a smart watch.', ar: 'انجح بالمقابلة: بدلة أنيقة وحذاء نظيف وساعة ذكية.' }, main: 'banker', side: 'techie', emoji: '💼' },
  { id: 'coney', name: { en: 'Coney Island', ar: 'كوني آيلاند' }, brief: { en: 'Boardwalk, hot dogs and the Wonder Wheel. Beach vibes with a city edge.', ar: 'الممشى والهوت دوغ والعجلة الكبيرة. أجواء شاطئ بروح المدينة.' }, main: 'beach', side: 'street', emoji: '🎡' },
  { id: 'tech_meetup', name: { en: 'Tech Meetup', ar: 'لقاء التقنية' }, brief: { en: 'Demo night in Silicon Alley. Gadgets first, blazer optional.', ar: 'ليلة عروض في سيليكون آلي. الأجهزة أولًا والبليزر اختياري.' }, main: 'techie', side: 'banker', emoji: '🤖' },
  { id: 'rodeo', name: { en: 'Rodeo Night', ar: 'ليلة الروديو' }, brief: { en: 'Boots, hat and grit. Bonus points for sporty swagger.', ar: 'بوت وقبعة وجرأة. نقاط إضافية للروح الرياضية.' }, main: 'cowboy', side: 'athlete', emoji: '🤠' },
  { id: 'red_carpet', name: { en: 'Red Carpet Premiere', ar: 'عرض السجادة الحمراء' }, brief: { en: 'Flashbulbs on Hollywood Boulevard. Glamour with a tailored touch.', ar: 'فلاشات على هوليوود بوليفارد. فخامة بلمسة مفصّلة.' }, main: 'hollywood', side: 'banker', emoji: '🌟' },
  { id: 'comic_con', name: { en: 'Comic Con', ar: 'كوميك كون' }, brief: { en: 'Capes, visors and gadgets. The hall floor is your stage.', ar: 'عباءات وخوذ وأجهزة. أرض المعرض مسرحك.' }, main: 'hero', side: 'techie', emoji: '🦸' },
  { id: 'fifth_ave', name: { en: 'Fifth Avenue Brunch', ar: 'برانش الجادة الخامسة' }, brief: { en: 'Mimosa hour on Fifth. Polished, pricey, photographed.', ar: 'برانش على الجادة الخامسة. أناقة وغلا وكاميرات.' }, main: 'banker', side: 'hollywood', emoji: '🥂' },
  { id: 'skate_park', name: { en: 'Skate Park', ar: 'حديقة السكيت' }, brief: { en: 'Kickflips under the bridge. Loose fits, grippy shoes.', ar: 'حركات سكيت تحت الجسر. لبس فضفاض وحذاء ماسك.' }, main: 'street', side: 'athlete', emoji: '🛹' },
  { id: 'malibu', name: { en: 'Malibu Beach Day', ar: 'يوم شاطئ ماليبو' }, brief: { en: 'Sun, surf and a celebrity sighting. Beachwear that still shines.', ar: 'شمس وأمواج ونجوم. لبس شاطئ يلمع.' }, main: 'beach', side: 'hollywood', emoji: '🏖️' },
  { id: 'july4', name: { en: 'Fourth of July', ar: 'الرابع من يوليو' }, brief: { en: 'Stars, stripes and fireworks. Go all-American, go big.', ar: 'نجوم وخطوط وألعاب نارية. كل شيء أمريكي وبالكبير.' }, main: 'hero', side: 'cowboy', emoji: '🎆' },
];
export const themeById = id => (id && typeof id === 'object' && id.id) ? (THEMES.find(t => t.id === id.id) || null) : (THEMES.find(t => t.id === id) || null);

// ---------- calendar: ISO week (Monday 00:00 local) ----------
// every helper takes a Date, a timestamp number or nothing (= now)
const toDate = d => d instanceof Date ? d : new Date(d ?? Date.now());
export function isoWeek(d = new Date()) {
  d = toDate(d);
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const day = date.getUTCDay() || 7;
  date.setUTCDate(date.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  return Math.ceil(((date - yearStart) / 86400000 + 1) / 7);
}
export function weekKey(d = new Date()) {
  d = toDate(d);
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const day = date.getUTCDay() || 7;
  date.setUTCDate(date.getUTCDate() + 4 - day);
  return `${date.getUTCFullYear()}-W${String(isoWeek(d)).padStart(2, '0')}`;
}
export const weekTheme = (d = new Date()) => THEMES[isoWeek(toDate(d)) % 12];

// ---------- scoring ----------
export const itemFamilies = item => (item ? setsOfItem(item).map(s => s.id) : []);
export function itemMul(item, theme) {
  if (!theme) return familyMul.other;
  const f = itemFamilies(item);
  return f.includes(theme.main) ? familyMul.main : f.includes(theme.side) ? familyMul.side : familyMul.other;
}
export const isCharm = item => !!item && item.cat === 'acc' && (item.charm === true || CHARM.has(item.tpl));
const wornSet = () => new Set(Array.isArray(state.worn) ? state.worn : []);
// what one piece adds to the theme score; opts.fitCheck adds the never-worn bonus
export function piecePts(item, theme, opts = {}) {
  if (!item || item.cat === 'bg') return 0;
  const base = rarityPts[item.rarity] || 0;
  let v = base * itemMul(item, theme);
  if (isCharm(item)) v += charm;
  if (opts.fitCheck && base > 0 && !wornSet().has(item.id)) v += unworn;
  return v;
}
// the pieces the avatar actually shows: an outfit hides top + bottom
export function visiblePieces(equipped) {
  const eq = equipped || {}; const out = [];
  for (const slot of SLOTS) {
    if (eq.outfit && (slot === 'top' || slot === 'bottom')) continue;
    const it = eq[slot] && getItem(eq[slot]);
    if (it) out.push(it);
  }
  return out;
}
export function themeScore(equipped, theme, opts = {}) {
  let s = 0;
  for (const it of visiblePieces(equipped)) s += piecePts(it, theme, opts);
  return Math.round(s * 10) / 10;
}
// stars for a score at stage n: par(n) = 90 + 5·min(n, 60) is 5★, capped at 5.8★
export function themeStars(score, stageN = state.stage || 1) { return Math.min(STAR_CAP, 5 * (score || 0) / par(stageN)); }
export const fmtStars = s => (Math.round((s || 0) * 10) / 10).toFixed(1);

// the equipped object after wearing `item` (same rules as the wardrobe: a top/bottom removes the outfit)
export function wearPreview(item, equipped) {
  const eq = { ...(equipped || {}) };
  if (!item) return eq;
  eq[item.cat] = item.id;
  if (item.cat === 'top' || item.cat === 'bottom') eq.outfit = null;
  return eq;
}
// theme-score change if the item were worn now (0 for the background and for what is already on)
export function itemDelta(item, equipped, theme, opts = {}) {
  if (!item || item.cat === 'bg') return 0;
  // already on → 0, except a top/bottom hidden under an outfit (wearing it again would drop the outfit)
  if (equipped && equipped[item.cat] === item.id && !(equipped.outfit && (item.cat === 'top' || item.cat === 'bottom'))) return 0;
  return Math.round((themeScore(wearPreview(item, equipped), theme, opts) - themeScore(equipped, theme, opts)) * 10) / 10;
}

// Greedy best look per slot (owned, gender-fit); outfit vs top+bottom decided by the better sum.
// Signature per the integrator: bestLook(theme, inventory, gender, { current, fitCheck }); the doc's (ownedIds, theme, gender) order is tolerated.
export function bestLook(theme, inventory, gender, opts = {}) {
  if (Array.isArray(theme) && !Array.isArray(inventory)) [theme, inventory] = [inventory, theme];
  theme = themeById(theme) || theme || null;
  const cur = opts.current || state.equipped || {};
  gender = gender || (state.profile && state.profile.gender) || 'boy';
  const owned = (Array.isArray(inventory) ? inventory : (state.inventory || [])).map(getItem).filter(it => it && it.cat !== 'bg' && fitsGender(it, gender));
  const bestOf = cat => {
    let best = null, bv = -1;
    for (const it of owned) {
      if (it.cat !== cat) continue;
      const v = piecePts(it, theme, opts) + (cur[cat] === it.id ? 0.01 : 0);   // ties keep what is on
      if (v > bv) { bv = v; best = it; }
    }
    return { it: best, v: best ? bv : 0 };
  };
  const eq = { hair: null, top: null, bottom: null, shoes: null, hat: null, glasses: null, acc: null, outfit: null, bg: cur.bg || null };
  for (const cat of ['hair', 'shoes', 'hat', 'glasses', 'acc']) eq[cat] = bestOf(cat).it ? bestOf(cat).it.id : null;
  const o = bestOf('outfit'), tp = bestOf('top'), bt = bestOf('bottom');
  eq.top = tp.it ? tp.it.id : null; eq.bottom = bt.it ? bt.it.id : null;
  if (o.it && (o.v > tp.v + bt.v || (o.v === tp.v + bt.v && cur.outfit === o.it.id))) eq.outfit = o.it.id;
  // the hero is never naked: rags / messy hair only when nothing else is owned
  if (!eq.top) eq.top = cur.top || 'top_rags';
  if (!eq.bottom) eq.bottom = cur.bottom || 'bottom_rags';
  if (!eq.hair) eq.hair = cur.hair || (gender === 'girl' ? 'hair_messyg_dull' : 'hair_messy_dull');
  return eq;
}
// true when `look` would change nothing visible compared with `equipped`
export const sameLook = (a, b) => SLOTS.every(k => ((a && a[k]) || null) === ((b && b[k]) || null));

// ---------- worn log (judged events only: Fit Checks) ----------
export function markWorn(ids) {
  if (!Array.isArray(state.worn)) state.worn = [];
  const list = Array.isArray(ids) ? ids : (ids && typeof ids === 'object') ? visiblePieces(ids).map(it => it.id) : [ids];
  let n = 0;
  for (const id of list) if (id && getItem(id) && !state.worn.includes(id)) { state.worn.push(id); n++; }
  if (n) save();
  return n;
}
export const neverWorn = id => !(Array.isArray(state.worn) && state.worn.includes(id));

// ---------- saved looks: 3 free slots, +1 for 300 coins up to 9 ----------
// default look names are bilingual objects (render with name() from i18n.js); old saves may hold a plain string
export const lookName = i => ({ en: `Look ${i + 1}`, ar: `لوك ${i + 1}` });
export function looks() {
  if (!Array.isArray(state.looks)) state.looks = [];
  if (!(state.lookSlots >= LOOK_SLOTS_FREE)) state.lookSlots = LOOK_SLOTS_FREE;
  state.lookSlots = Math.min(LOOK_SLOTS_MAX, state.lookSlots);
  while (state.looks.length < state.lookSlots) state.looks.push(null);
  if (state.looks.length > state.lookSlots) state.looks.length = state.lookSlots;
  // older saves named looks with a plain English string; lift the default ones to bilingual objects
  state.looks.forEach((lk, i) => { if (lk && typeof lk.name === 'string' && /^Look \d+$/.test(lk.name)) lk.name = lookName(i); });
  return state.looks;
}
export function saveLook(i, equipped = state.equipped, nm = null) {
  const l = looks(); if (i < 0 || i >= l.length) return null;
  l[i] = { name: nm || lookName(i), equipped: { ...(equipped || {}) }, at: Date.now() };
  save(); return l[i];
}
export function deleteLook(i) { const l = looks(); if (i < 0 || i >= l.length || !l[i]) return false; l[i] = null; save(); return true; }
export function lookSlotPrice() { looks(); return state.lookSlots >= LOOK_SLOTS_MAX ? null : LOOK_SLOT_PRICE; }
export function buyLookSlot() { const p = lookSlotPrice(); if (p == null || !spend(p)) return false; state.lookSlots++; state.looks.push(null); save(); return true; }
// apply a saved look (skips items that are no longer owned / wrong gender); returns the equipped object applied
export function wearLook(look, gender = (state.profile && state.profile.gender) || 'boy') {
  if (!look || !look.equipped) return null;
  const inv = new Set(state.inventory || []);
  for (const k of Object.keys(state.equipped)) {
    const id = look.equipped[k] || null;
    if (!id) { if (k !== 'top' && k !== 'bottom' && k !== 'hair') state.equipped[k] = null; continue; }
    const it = getItem(id);
    if (it && inv.has(id) && fitsGender(it, gender)) state.equipped[k] = id;
  }
  save();
  return state.equipped;
}

// ---------- Lookbook: one page per theme, best stars kept forever, 4 gem tiers once per page ----------
export function lookbook() {
  let lb = state.lookbook;
  if (!lb || typeof lb !== 'object' || Array.isArray(lb)) lb = state.lookbook = {};
  if (!lb.pages || typeof lb.pages !== 'object') lb.pages = {};
  if (!Array.isArray(lb.open)) lb.open = [];
  if (!Array.isArray(lb.weeks)) lb.weeks = [];
  let changed = false;
  if (!lb.open.length) {
    // first visit: the themes the weekly calendar would reach last, so every page is open by week 10
    const i = isoWeek() % 12;
    for (let k = 1; k <= LOOKBOOK_START; k++) lb.open.push(THEMES[(i - k + 12 * 2) % 12].id);
    changed = true;
  }
  const wk = weekKey();
  if (!lb.weeks.includes(wk)) {
    lb.weeks.push(wk); if (lb.weeks.length > 60) lb.weeks.splice(0, lb.weeks.length - 60);
    const id = weekTheme().id; if (!lb.open.includes(id)) lb.open.push(id);
    changed = true;
  }
  let best = null;
  for (const [id, pg] of Object.entries(lb.pages)) if (pg && (!best || pg.stars > best.stars)) best = { themeId: id, stars: pg.stars, score: pg.score };
  lb.best = best;
  if (changed) save();
  return lb;
}
export const lookbookPage = id => lookbook().pages[id] || null;
export const lookbookOpen = id => lookbook().open.includes(id);
export const lookbookBest = () => lookbook().best;
// "Try this look": re-score the outfit on a page right now; keeps the best, pays newly crossed tiers
export function tryLook(themeId, equipped = state.equipped, stageN = state.stage || 1) {
  const theme = themeById(themeId); if (!theme) return null;
  const lb = lookbook(); if (!lb.open.includes(theme.id)) return null;
  const score = themeScore(equipped, theme), stars = Math.round(themeStars(score, stageN) * 100) / 100;
  const pg = lb.pages[theme.id] || (lb.pages[theme.id] = { score: 0, stars: 0, at: 0, claimed: [] });
  if (!Array.isArray(pg.claimed)) pg.claimed = [];
  const prev = pg.stars || 0, improved = stars > prev;
  if (improved) { pg.score = score; pg.stars = stars; pg.at = Date.now(); }
  let gems = 0; const unlocked = [];
  for (const tier of STAR_TIERS) if (pg.stars + 1e-9 >= tier.stars && !pg.claimed.includes(tier.stars)) { pg.claimed.push(tier.stars); gems += tier.gems; unlocked.push(tier); }
  if (gems) addGems(gems);
  lookbook();   // refresh `best`
  save();
  return { theme, score, stars, prev, improved, gems, unlocked, page: pg };
}
// For the gift reveal: the open page that gains the most stars if the new item were worn ("Lookbook: +0.4★ Comic Con")
export function lookbookGain(item, equipped = state.equipped, stageN = state.stage || 1) {
  if (!item || item.cat === 'bg') return null;
  const lb = lookbook(); let best = null;
  for (const id of lb.open) {
    const theme = themeById(id); if (!theme) continue;
    const pg = lb.pages[id];
    const now = themeStars(themeScore(wearPreview(item, equipped), theme), stageN);
    const base = Math.max(pg ? pg.stars || 0 : 0, themeStars(themeScore(equipped, theme), stageN));
    const d = Math.round((now - base) * 10) / 10;
    if (d >= 0.1 && (!best || d > best.delta)) best = { theme, delta: d, stars: now };
  }
  return best;
}
