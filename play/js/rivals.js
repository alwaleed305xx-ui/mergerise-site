// Rival Row (حي المنافسين) — docs/unique-features.md §1.2 R1–R11, F2, and the F3 hooks that live here.
// Four AI hustlers dressed from the player's own catalog (zero new art: renderAvatar + rollLook) race the player
// up the ladder every ISO week by the real-world clock. Everything is deterministic from (seed, weekKey, clock):
// reloads never change the row, clock changes are accepted, not fought (no server). Rivals are NOT customers.
// State (created lazily): race, racePrev (a finished race awaiting its settlement modal), winLog, rivals, stolen,
// raceHistory { weeks, firsts, firstStreak, steals }, worn (F1/F3, via markWorn).
import { el, rng, clamp, todayKey, fmt, haptic } from './util.js';
import { t, name } from './i18n.js';
import { state, save, addCoins, addItem, own, tierFor, markSeen } from './store.js';
import { CATALOG, getItem, fitsGender, EXCLUSIVE } from './wardrobe.js';
import { ALL_SETS, setsOfItem } from './sets.js';
import { portraitOf } from './customers.js';
import { I, modal, toast, itemCard } from './ui.js';
import { addGems, spendGems, gems } from './economy.js';
import { sfx } from './audio.js';
import { fx } from './particles.js';

const HOUR = 3600000, DAY = 86400000;

// js/style.js (F1) is the single source of THEMES / themeScore / weekTheme; imported statically so the ids a
// Fit Check hands to app.go('wardrobe', { theme }) always match themeById(). THEMES_FALLBACK below mirrors it.
import * as styleMod from './style.js';
export const ready = Promise.resolve(true);

// ---------- R1 roster ----------
// mult(dow, hour): schedule multiplier in LOCAL time (dow: 0 Sun … 6 Sat).
export const ROSTER = [
  { id: 'dex', name: { en: 'Dex', ar: 'ديكس' }, nick: { en: 'The Sprinter', ar: 'العدّاء' }, gender: 'boy', skin: 3, family: 'street', color: '#fb923c',
    hours: { en: 'weekdays 7–19', ar: 'أيام الأسبوع 7–19' }, mult: (dow, h) => (dow >= 1 && dow <= 5 && h >= 7 && h < 19) ? 1.2 : 0.3,
    signature: { id: 'top_brooklyn_bomber', cat: 'top', name: { en: 'Brooklyn Bomber', ar: 'جاكيت بروكلين' } },
    lines: {
      intro: { en: 'Keep up if you can, {hero}.', ar: 'الحق بي إن قدرت يا {hero}.' },
      win: { en: 'Okay okay… nice fit, {hero}.', ar: 'طيب طيب… ستايلك حلو يا {hero}.' },
      lose: { en: 'Told you. Sprinter speed.', ar: 'قلت لك. سرعة العدّاء.' },
      respect: { en: 'Fast delivery. Respect.', ar: 'توصيل سريع. احترام.' },
      taunt: { en: 'Too slow, {hero}. The whole block saw that.', ar: 'بطيء يا {hero}. الحي كله شاف.' },
    } },
  { id: 'kiara', name: { en: 'Kiara', ar: 'كيارا' }, nick: { en: 'Night Owl', ar: 'بومة الليل' }, gender: 'girl', skin: 1, family: 'hollywood', color: '#c084fc',
    hours: { en: 'nights 21–03', ar: 'الليل 21–03' }, mult: (dow, h) => (h >= 21 || h < 3) ? 1.4 : 0.4,
    signature: { id: 'hat_pearl_headband', cat: 'hat', name: { en: 'Pearl Headband', ar: 'طوق اللؤلؤ' } },
    lines: {
      intro: { en: 'The night is mine, darling.', ar: 'الليل لي يا عزيزي.' },
      win: { en: 'Fine. That outfit deserves the spotlight.', ar: 'طيب. هذا اللبس يستاهل الأضواء.' },
      lose: { en: 'Cute try. The cameras are on me.', ar: 'محاولة لطيفة. الكاميرات عليّ أنا.' },
      respect: { en: 'Delivered before midnight? Impressive.', ar: 'سلّمت قبل منتصف الليل؟ مبهر.' },
      taunt: { en: 'Did you even look in a mirror, {hero}?', ar: 'شفت نفسك بالمراية يا {hero}؟' },
    } },
  { id: 'tony', name: { en: 'Tony', ar: 'توني' }, nick: { en: 'Steady', ar: 'الثابت' }, gender: 'boy', skin: 0, family: 'banker', color: '#60a5fa',
    hours: { en: 'steady, 24/7', ar: 'ثابت، 24/7' }, mult: () => 0.8,
    signature: { id: 'acc_gold_tie_clip', cat: 'acc', name: { en: 'Gold Tie Clip', ar: 'مشبك ربطة ذهبي' } },
    lines: {
      intro: { en: 'Slow and steady pays the bills.', ar: 'الهدوء والثبات يدفع الفواتير.' },
      win: { en: 'Noted. You dress like you mean business.', ar: 'ملاحظ. لبسك لبس جد.' },
      lose: { en: "The numbers don't lie, {hero}.", ar: 'الأرقام ما تكذب يا {hero}.' },
      respect: { en: "Efficient. I'd hire you.", ar: 'فعّال. كنت بوظّفك.' },
      taunt: { en: 'Another day, another win for me.', ar: 'يوم جديد وفوز جديد لي.' },
    } },
  { id: 'blu', name: { en: 'Blu', ar: 'بلو' }, nick: { en: 'Weekend Warrior', ar: 'محاربة الويكند' }, gender: 'girl', skin: 2, family: 'beach', color: '#2dd4bf',
    hours: { en: 'weekends', ar: 'الويكند' }, mult: (dow) => (dow === 0 || dow === 6) ? 1.7 : 0.5,
    signature: { id: 'glasses_sunset_shades', cat: 'glasses', name: { en: 'Sunset Shades', ar: 'نظارة الغروب' } },
    lines: {
      intro: { en: 'Weekends are my playground, {hero}!', ar: 'الويكند ملعبي يا {hero}!' },
      win: { en: 'Whoa, beach vibes approved.', ar: 'واو، ستايل الشاطئ معتمد.' },
      lose: { en: "Sun's out, and I'm out… in front of you.", ar: 'الشمس طلعت وأنا قدّامك.' },
      respect: { en: 'That was surf-speed. Nice.', ar: 'سرعة موجة. حلو.' },
      taunt: { en: "See you Saturday, {hero}. I'll be ahead.", ar: 'أشوفك السبت يا {hero}. راح أكون قدّامك.' },
    } },
];
export const RIVAL_IDS = ROSTER.map(r => r.id);
export const rivalById = id => ROSTER.find(r => r.id === id) || null;

// R9 honesty line — printed in full on the intro modal and the This Week screen; the hub card carries the short form
// (HONESTY_SHORT) in its top row next to the title plus the full sentence as its tooltip, so the card stays ≤ 100 px tall.
export const HONESTY = { en: 'AI rivals — they play on their own schedule, never for real money', ar: 'منافسون بالذكاء الاصطناعي — يلعبون على جدولهم الخاص، وبلا أي أموال حقيقية أبدًا' };
export const HONESTY_SHORT = { en: '🤖 AI · no real money', ar: '🤖 ذكاء اصطناعي · بلا مال حقيقي' };

// Module strings (bilingual, rendered with name()). Nothing is added to i18n.js.
export const L = {
  title: { en: 'Rival Row', ar: 'حي المنافسين' },
  thisWeek: { en: 'This Week', ar: 'هذا الأسبوع' },
  race: { en: 'Race', ar: 'السباق' },
  you: { en: 'you', ar: 'أنت' },
  wins: { en: 'wins', ar: 'فوز' },
  firstTo: n => ({ en: `First to ${n}`, ar: `الأول لـ ${n}` }),
  endsIn: { en: 'ends in', ar: 'ينتهي بعد' },
  nextIn: { en: 'next race in', ar: 'السباق القادم بعد' },
  fitIn: (n, theme, rival) => ({ en: `Fit Check in ${n} · ${theme} vs ${rival}`, ar: `فحص الستايل بعد ${n} · ${theme} ضد ${rival}` }),
  fitNext: (theme, rival) => ({ en: `Fit Check next · ${theme} vs ${rival}`, ar: `فحص الستايل التالي · ${theme} ضد ${rival}` }),
  raceOver: { en: 'Race over', ar: 'انتهى السباق' },
  placed: n => ({ en: `you placed ${['1st', '2nd', '3rd', '4th', '5th'][n - 1] || n + 'th'}`, ar: `مركزك ${['الأول', 'الثاني', 'الثالث', 'الرابع', 'الخامس'][n - 1] || n}` }),
  placeShort: n => ({ en: ['1st', '2nd', '3rd', '4th', '5th'][n - 1] || `${n}th`, ar: ['الأول', 'الثاني', 'الثالث', 'الرابع', 'الخامس'][n - 1] || `${n}` }),
  nextRace: { en: 'Next race starts Monday 00:00', ar: 'السباق القادم يبدأ الاثنين 00:00' },
  tapCollect: { en: 'Tap to collect your reward', ar: 'اضغط لاستلام مكافأتك' },
  tapSteal: { en: 'Tap to pick your stolen piece', ar: 'اضغط لاختيار القطعة المسروقة' },
  stealALook: { en: 'Steal a Look', ar: 'اسرق الستايل' },
  stealFrom: r => ({ en: `Pick one piece of ${r}'s look`, ar: `اختر قطعة واحدة من ستايل ${r}` }),
  steal: { en: 'Steal', ar: 'اسرق' },
  stolen: it => ({ en: `Stolen: ${it}`, ar: `سرقت: ${it}` }),
  secondSteal: { en: 'Second steal · 20 💎', ar: 'سرقة ثانية · 20 💎' },
  nothingToSteal: { en: 'Nothing left to steal — +400 coins instead', ar: 'ما فيه شيء يُسرق — +400 عملة بدلًا منها' },
  skip: { en: 'Skip', ar: 'تخطَّ' },
  done: { en: 'Done', ar: 'تم' },
  beatMore: (r, n) => ({ en: `Beat ${r} ${n} more week${n === 1 ? '' : 's'}`, ar: n === 1 ? `اهزم ${r} أسبوعًا آخر` : `اهزم ${r} ${n} أسابيع أخرى` }),
  signature: { en: 'Signature piece', ar: 'القطعة المميزة' },
  signatures: { en: 'Signature pieces', ar: 'القطع المميزة' },
  wildNote: { en: 'counts for every set', ar: 'تُحسب لكل الأطقم' },
  legendaryLock: { en: '3 wins in a row unlock legendary steals', ar: 'ثلاثة انتصارات متتالية تفتح القطع الخرافية' },
  notYourSize: { en: 'not your size', ar: 'مو مقاسك' },
  stolenFrom: r => ({ en: `Stolen from ${r}`, ar: `مسروقة من ${r}` }),
  stealHistory: { en: 'Your steals', ar: 'سرقاتك' },
  noSteals: { en: 'No steals yet — finish 1st on Sunday', ar: 'ما سرقت شيئًا بعد — كن الأول يوم الأحد' },
  beaten: n => ({ en: `beaten ${n}/3`, ar: `هزمته ${n}/3` }),
  plays: { en: 'plays', ar: 'يلعب' },
  onARun: { en: 'on a run now', ar: 'يلعب الآن' },
  resting: { en: 'resting', ar: 'مرتاح' },
  standings: { en: 'Standings', ar: 'الترتيب' },
  startNow: { en: 'Race starts now', ar: 'السباق يبدأ الآن' },
  introPitch: { en: 'Four hustlers on your block race you up the ladder every week. Finish ahead on Sunday and steal one piece of the runner-up’s look — it can switch on a set perk for your next board.', ar: 'أربعة من أهل الحي يسابقونك على السلّم كل أسبوع. كن قدّامهم يوم الأحد واسرق قطعة من ستايل الوصيف — قد تفعّل ميزة طقم في لوحتك القادمة.' },
  introRace: (n) => ({ en: `This week: first to ${n} wins. Every 5th stage is a Fit Check.`, ar: `هذا الأسبوع: الأول لـ ${n} فوز. كل مرحلة خامسة فحص ستايل.` }),
  yourFit: { en: 'Your fit', ar: 'ستايلك' },
  toBeat: { en: 'to beat', ar: 'المطلوب' },
  changeOutfit: { en: 'Change outfit', ar: 'غيّر اللبس' },
  goalsSoon: { en: 'Weekly goals land here soon: 10 goals every Monday, chests at 4 / 7 / 10, a Hustler flame after 3 perfect weeks.', ar: 'الأهداف الأسبوعية قريبًا هنا: 10 أهداف كل اثنين، صناديق عند 4 / 7 / 10، وشعلة «الكدّاد» بعد 3 أسابيع كاملة.' },
  pace: n => ({ en: `your pace ${n}/day`, ar: `وتيرتك ${n}/يوم` }),
  // onePiece = a single owned piece can close the gap (bestPieceDelta ≥ gap); otherwise only the ×3 family hint is promised
  gapHint: (pts, fam, rival, onePiece = true) => onePiece
    ? { en: `+${pts} to beat ${rival} — one more ${fam} piece does it`, ar: `+${pts} لتهزم ${rival} — قطعة ${fam} إضافية تكفي` }
    : { en: `+${pts} to beat ${rival} · ${fam} pieces score ×3`, ar: `+${pts} لتهزم ${rival} · قطع ${fam} تُحسب ×3` },
  youLead: rival => ({ en: `You out-style ${rival}`, ar: `ستايلك يتفوق على ${rival}` }),
  reward: { en: 'Reward', ar: 'المكافأة' },
  overnight: (nm, n) => ({ en: `${nm.en} +${n} overnight`, ar: `${nm.ar} +${n} بالليل` }),   // nm = bilingual name object
  theme: { en: 'Theme', ar: 'الثيم' },
  stageN: n => ({ en: `Stage ${n}`, ar: `المرحلة ${n}` }),
  dur: ms => { const m = Math.max(0, Math.floor(ms / 60000)), h = Math.floor(m / 60), d = Math.floor(h / 24); return d > 0 ? { en: `${d}d ${h % 24}h`, ar: `${d}ي ${h % 24}س` } : h > 0 ? { en: `${h}h ${m % 60}m`, ar: `${h}س ${m % 60}د` } : { en: `${m}m`, ar: `${m}د` }; },
  rubber: { en: 'Rivals never get more than 3 wins ahead', ar: 'المنافسون ما يسبقونك بأكثر من 3 انتصارات' },
};

// 12 week themes (F1 names/families), ids + emoji identical to js/style.js THEMES. Only a safety net for the local scorer.
export const THEMES_FALLBACK = [
  { id: 'block_party', name: { en: 'Brooklyn Block Party', ar: 'حفلة حي بروكلين' }, main: 'street', side: 'beach', emoji: '🎉' },
  { id: 'yankees', name: { en: 'Baseball Game', ar: 'مباراة بيسبول' }, main: 'athlete', side: 'street', emoji: '⚾' },
  { id: 'wall_street', name: { en: 'Wall Street Interview', ar: 'مقابلة وول ستريت' }, main: 'banker', side: 'techie', emoji: '💼' },
  { id: 'coney', name: { en: 'Coney Island', ar: 'كوني آيلاند' }, main: 'beach', side: 'street', emoji: '🎡' },
  { id: 'tech_meetup', name: { en: 'Tech Meetup', ar: 'لقاء التقنية' }, main: 'techie', side: 'banker', emoji: '🤖' },
  { id: 'rodeo', name: { en: 'Rodeo Night', ar: 'ليلة الروديو' }, main: 'cowboy', side: 'athlete', emoji: '🤠' },
  { id: 'red_carpet', name: { en: 'Red Carpet Premiere', ar: 'عرض السجادة الحمراء' }, main: 'hollywood', side: 'banker', emoji: '🌟' },
  { id: 'comic_con', name: { en: 'Comic Con', ar: 'كوميك كون' }, main: 'hero', side: 'techie', emoji: '🦸' },
  { id: 'fifth_ave', name: { en: 'Fifth Avenue Brunch', ar: 'برانش الجادة الخامسة' }, main: 'banker', side: 'hollywood', emoji: '🥂' },
  { id: 'skate_park', name: { en: 'Skate Park', ar: 'حديقة السكيت' }, main: 'street', side: 'athlete', emoji: '🛹' },
  { id: 'malibu', name: { en: 'Malibu Beach Day', ar: 'يوم شاطئ ماليبو' }, main: 'beach', side: 'hollywood', emoji: '🏖️' },
  { id: 'july4', name: { en: 'Fourth of July', ar: 'الرابع من يوليو' }, main: 'hero', side: 'cowboy', emoji: '🎆' },
];

// ---------- clock helpers (ISO week, Monday 00:00 local) ----------
function hash32(s) { let h = 2166136261; s = String(s); for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
export function weekStartOf(now = Date.now()) { const d = new Date(now); d.setHours(0, 0, 0, 0); d.setDate(d.getDate() - ((d.getDay() + 6) % 7)); return d.getTime(); }
export function weekEndOf(now = Date.now()) { const d = new Date(weekStartOf(now)); d.setDate(d.getDate() + 7); return d.getTime(); }
export function isoWeek(now = Date.now()) {
  const d = new Date(now); d.setHours(0, 0, 0, 0); d.setDate(d.getDate() + 3 - ((d.getDay() + 6) % 7));   // Thursday of this week
  const year = d.getFullYear(); const jan4 = new Date(year, 0, 4);
  const week = 1 + Math.round(((d - jan4) / DAY - 3 + ((jan4.getDay() + 6) % 7)) / 7);
  return { year, week };
}
export function weekKeyOf(now = Date.now()) { const { year, week } = isoWeek(now); return `${year}-W${String(week).padStart(2, '0')}`; }
const jitter = (seed, id, h) => 0.85 + 0.3 * rng((seed + hash32(id) + h) >>> 0)();

// Week theme: js/style.js when it exists (weekTheme() or THEMES[isoWeek % n]), else the local fallback.
export function weekTheme(now = Date.now()) {
  if (styleMod) {
    try {
      if (typeof styleMod.weekTheme === 'function') { const th = styleMod.weekTheme(now); if (th) return th; }
      if (Array.isArray(styleMod.THEMES) && styleMod.THEMES.length) return styleMod.THEMES[isoWeek(now).week % styleMod.THEMES.length];
    } catch (_) { /* fall through */ }
  }
  return THEMES_FALLBACK[isoWeek(now).week % 12];
}
export const familyName = id => { const s = ALL_SETS.find(x => x.id === id); return s ? name(s.name) : id; };

// ---------- state ----------
function ensure() {
  let dirty = false;
  if (!Array.isArray(state.winLog)) { state.winLog = []; dirty = true; }
  if (!state.rivals || typeof state.rivals !== 'object') { state.rivals = {}; dirty = true; }
  for (const rv of ROSTER) if (!state.rivals[rv.id]) { state.rivals[rv.id] = { beaten: 0, met: false, stolen: [] }; dirty = true; }
  if (!state.stolen || typeof state.stolen !== 'object') { state.stolen = {}; dirty = true; }
  if (!state.raceHistory) { state.raceHistory = { weeks: 0, firsts: 0, firstStreak: 0, steals: 0 }; dirty = true; }
  if (!Array.isArray(state.stealPending)) { state.stealPending = []; dirty = true; }
  if (dirty) save();
}
const ensureRival = id => { ensure(); return state.rivals[id]; };
// A 1st place keeps its Steal a Look until Skip/Done is tapped: state.stealPending = [{ weekKey, seed, runnerUp, steals, taken, look }]
// (self-contained, so a wiped overlay, a deleted racePrev or a later race can never lose it). Oldest first.
export function pendingSteals() { ensure(); return state.stealPending; }
const raceOfPending = pd => ({ weekKey: pd.weekKey, seed: pd.seed, rivals: { [pd.runnerUp]: { look: pd.look || {} } } });
const racesOfWeek = wk => [state.race, state.racePrev].filter(r => r && r.weekKey === wk);
export const playerWins = (race = state.race) => race ? (race.wins || 0) + (race.bonus || 0) : 0;

// ---------- R3 pace ----------
// median of wins per calendar day over the last 14 days (days with 0 wins excluded), clamped 1.5..6; new save = 2
export function pace(now = Date.now()) {
  const log = (state.winLog || []).filter(ts => typeof ts === 'number' && now - ts <= 14 * DAY && ts <= now + HOUR);
  if (!log.length) return 2;
  const days = {};
  for (const ts of log) { const d = new Date(ts); const k = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`; days[k] = (days[k] || 0) + 1; }
  const counts = Object.values(days).sort((a, b) => a - b);
  const mid = counts.length >> 1;
  const med = counts.length % 2 ? counts[mid] : (counts[mid - 1] + counts[mid]) / 2;
  return clamp(med, 1.5, 6);
}

// ---------- R5 outfits ----------
const rarityWeights = stage => { const late = Math.min(1, stage / 40); return { common: 60 - 30 * late, rare: 28 + 10 * late, epic: 10 + 14 * late, legendary: 2 + 6 * late }; };
const inFamily = (it, fam) => setsOfItem(it).some(s => s.id === fam);
// pool per slot: catalog items of that category, fit the rival, tier <= startStage, not EXCLUSIVE, not rags;
// non-hair slots also fit the PLAYER so what the rival wears can actually be stolen and worn.
function slotPool(cat, rival, startStage, playerGender) {
  return CATALOG.filter(it => it.cat === cat && it.rarity !== 'rags' && !EXCLUSIVE.has(it.id) && (it.tier ?? 1) <= startStage && fitsGender(it, rival.gender) && (cat === 'hair' || !playerGender || fitsGender(it, playerGender)));
}
function pickWeighted(pool, R, rival, startStage) {
  if (!pool.length) return null;
  const rw = rarityWeights(startStage), owned = new Set(state.inventory || []);
  const w = pool.map(it => (rw[it.rarity] || 0) * (inFamily(it, rival.family) ? 4 : 1) * (owned.has(it.id) ? 1 : 2));
  const total = w.reduce((a, b) => a + b, 0);
  if (total <= 0) return pool[Math.floor(R() * pool.length)];
  let r = R() * total;
  for (let i = 0; i < pool.length; i++) { r -= w[i]; if (r <= 0) return pool[i]; }
  return pool[pool.length - 1];
}
// 6 slots: hair; outfit (40 %) or top + bottom; shoes; hat (50 %) or glasses; acc. A slot whose family pool is
// empty naturally falls back to the plain catalog (family only multiplies the weight), so every rival is dressed.
export function rollLook(rival, seed, startStage, playerGender = state.profile?.gender) {
  const R = rng((seed ^ hash32(rival.id)) >>> 0);
  const useOutfit = R() < 0.4, useHat = R() < 0.5;
  const pick = cat => { const it = pickWeighted(slotPool(cat, rival, startStage, playerGender), R, rival, startStage); return it ? it.id : null; };
  const look = { hair: pick('hair'), outfit: null, top: null, bottom: null, shoes: pick('shoes'), hat: null, glasses: null, acc: pick('acc'), bg: null };
  if (useOutfit) look.outfit = pick('outfit');
  if (!look.outfit) { look.top = pick('top'); look.bottom = pick('bottom'); }
  if (useHat) look.hat = pick('hat');
  if (!look.hat) look.glasses = pick('glasses');
  return look;
}
export function rivalLook(rival) {
  const id = typeof rival === 'string' ? rival : rival?.id;
  const fromRace = state.race?.rivals?.[id]?.look;
  if (rival && typeof rival === 'object' && rival.look) return rival.look;
  if (fromRace) return fromRace;
  const rv = rivalById(id); return rv ? rollLook(rv, hash32(id), Math.max(1, state.stage || 1)) : {};
}

// ---------- R2 race lifecycle ----------
function newRace(now, wk) {
  const weekStart = weekStartOf(now), weekEnd = weekEndOf(now);
  const seed = hash32(`${wk}|${state.created || 0}|${state.profile?.name || ''}`);
  const basePace = pace(now), finish = clamp(Math.round(basePace * 4), 8, 15);
  const startStage = Math.max(1, state.stage || 1);
  const first = !state.seen?.['rivals:intro'];               // the very first race starts from zero ("Race starts now")
  const race = { weekKey: wk, weekStart, weekEnd, startStage, seed, basePace, finish, wins: 0, bonus: 0, rivals: {}, finishedAt: null, place: null, standings: null, claimed: false, silent: false, startedAt: now, lastSeen: now, seen: {} };
  for (const rv of ROSTER) { race.rivals[rv.id] = { look: rollLook(rv, seed, startStage), wins: 0, raw: 0, evalAt: first ? now : weekStart }; race.seen[rv.id] = 0; }
  state.raceHistory.weeks++;
  return race;
}
// R3 accrual: per elapsed hour h since week start, step = basePace/24 × mult(h) × jitter(seed,id,h), integrated over
// the exact elapsed fraction so the call frequency never matters. Rubber band (+3) and the 48 h floor clamp raw itself,
// so a rival can never jump more than the elapsed accrual when the player catches up. `now` is clamped to weekEnd, so
// accrue(race, race.weekEnd) settles the hours after the player's last visit exactly as hourly visits would have.
// Returns the earliest moment a rival's wins reached `finish` during this call (null when none did).
function accrue(race, now) {
  const pw = playerWins(race);
  let end = Math.min(now, race.weekEnd);
  const floorAt = race.weekStart + 48 * HOUR;
  const canFinish = pw + 3 >= race.finish;      // the rubber band caps every rival at playerWins + 3
  // walk(r, until, onSeg): integrate the rival's hourly steps from its evalAt to `until`; onSeg(raw, segEnd) may stop it
  const walk = (rv, r, until, onSeg) => {
    let tt = Math.max(r.evalAt || race.weekStart, race.weekStart), raw = r.raw, guard = 0;
    while (tt < until && guard++ < 400) {
      const hIdx = Math.floor((tt - race.weekStart) / HOUR);
      const hStart = race.weekStart + hIdx * HOUR, segEnd = Math.min(until, hStart + HOUR);
      const d = new Date(hStart);
      raw += (race.basePace / 24) * rv.mult(d.getDay(), d.getHours()) * jitter(race.seed, rv.id, hIdx) * ((segEnd - tt) / HOUR);
      tt = segEnd;
      if (onSeg && onSeg(raw, segEnd) === false) break;
    }
    return raw;
  };
  // pass 1 (read-only): the earliest hour end at which any rival's wins would reach `finish` (48 h floor respected)
  let crossedAt = null;
  if (canFinish) for (const rv of ROSTER) {
    const r = race.rivals[rv.id]; if (!r) continue;
    walk(rv, r, end, (raw, segEnd) => { if (segEnd >= floorAt && raw + 1e-9 >= race.finish) { if (crossedAt == null || segEnd < crossedAt) crossedAt = segEnd; return false; } return true; });
  }
  if (crossedAt != null) end = Math.min(end, crossedAt);   // the race ends there: every rival is settled at that same moment
  const frozen = end < floorAt;
  // pass 2: accrue everyone to `end`
  for (const rv of ROSTER) {
    const r = race.rivals[rv.id]; if (!r) continue;
    r.raw = walk(rv, r, end);
    r.evalAt = Math.max(r.evalAt || 0, end);
    r.raw = Math.min(r.raw, pw + 3);
    if (frozen) r.raw = Math.min(r.raw, race.finish - 0.001);
    r.wins = Math.max(0, Math.floor(r.raw + 1e-9));
  }
  return crossedAt;
}
// R4 placement: wins descending, ties → player first, then roster order. Rows: { id: 'you' | rivalId, wins }.
export function placement(race = state.race) {
  if (!race) return [];
  const rows = [{ id: 'you', wins: playerWins(race), order: -1 }, ...ROSTER.map((rv, i) => ({ id: rv.id, wins: race.rivals?.[rv.id]?.wins || 0, order: i }))];
  return rows.sort((a, b) => b.wins - a.wins || a.order - b.order);
}
function finalize(race, at) {
  if (race.finishedAt) return;
  race.finishedAt = at;
  const st = placement(race);
  race.standings = st.map(x => x.id);
  race.place = st.findIndex(x => x.id === 'you') + 1;
}
// Accrue rival progress from the clock. Call-safe anytime (hub.render, play.render, after wins). Returns the race.
export function evaluate(now = Date.now()) {
  ensure();
  if (!state.profile) return null;
  const wk = weekKeyOf(now);
  let race = state.race;
  if (race && race.weekKey !== wk) {
    if (!race.finishedAt && race.rivals && race.weekStart && race.weekEnd) {
      // R3/R4: the clock kept running after the player's last visit — accrue up to Sunday 23:59:59 before settling,
      // so placement never depends on whether the app was opened on Sunday. The race ends the moment a rival crossed
      // `finish` if one did, otherwise at the week's end.
      const crossedAt = accrue(race, race.weekEnd);
      finalize(race, crossedAt || race.weekEnd);
    } else finalize(race, Math.min(now, race.weekEnd || now));
    if (!race.claimed) {
      if (now - (race.lastSeen || race.startedAt || 0) >= 7 * DAY) { race.claimed = true; race.silent = true; }   // 7+ days away: "no result", nothing lost
      else {
        if (state.racePrev && !state.racePrev.claimed) settle(state.racePrev);   // an older pending race pays its coins/gems silently (add-never-cut)
        state.racePrev = race;                                                   // the settlement modal shows on the next hub visit
      }
    }
    race = null;
  }
  if (!race || typeof race !== 'object' || !race.rivals) { race = newRace(now, wk); state.race = race; }
  if (!race.finishedAt) {
    const crossedAt = accrue(race, now);
    const pw = playerWins(race);
    if (pw >= race.finish) finalize(race, now);
    else if (crossedAt) finalize(race, crossedAt);
    else if (ROSTER.some(rv => (race.rivals[rv.id]?.wins || 0) >= race.finish)) finalize(race, now);
    else if (now >= race.weekEnd) finalize(race, race.weekEnd);
  }
  race.lastSeen = now;
  save();
  return race;
}

// Rival as the UI sees it: roster entry + this week's numbers. `look` is the equipped object for renderAvatar.
export function rivalView(id) {
  const rv = rivalById(id); if (!rv) return null;
  const race = state.race; const r = race?.rivals?.[id];
  const wins = r?.wins || 0; const stage = (race?.startStage || state.stage || 1) + wins;
  const st = race ? placement(race) : [];
  const d = new Date();
  return { ...rv, wins, raw: r?.raw || 0, stage, tier: tierFor(stage), look: r?.look || rivalLook(id), place: (st.findIndex(x => x.id === id) + 1) || null, beaten: state.rivals?.[id]?.beaten || 0, active: rv.mult(d.getDay(), d.getHours()) > 1 };
}
export function standings(race = state.race) { return placement(race).map((row, i) => ({ ...row, place: i + 1, rival: row.id === 'you' ? null : rivalView(row.id) })); }
// The rival directly ahead of the player, or the runner-up when the player leads (F3 claimant). null without a race.
export function claimant() {
  if (!state.profile) return null;
  const race = evaluate(); if (!race) return null;
  const st = placement(race); const i = st.findIndex(x => x.id === 'you');
  const id = i > 0 ? st[i - 1].id : (st[1] ? st[1].id : null);
  return id ? rivalView(id) : null;
}
// Rival voice: kind ∈ intro | win | lose | respect | taunt ({hero} replaced). `win` = the player won the Fit Check.
export function rivalLine(rival, kind = 'taunt', hero = state.profile?.name || '') {
  const rv = typeof rival === 'string' ? rivalById(rival) : rival; const v = rv?.lines?.[kind] || rv?.lines?.taunt; if (!v) return { en: '', ar: '' };
  return { en: v.en.replace('{hero}', hero), ar: v.ar.replace('{hero}', hero) };
}
export function tauntOfDay(rival, hero) { const rv = typeof rival === 'string' ? rivalById(rival) : rival; const kinds = ['taunt', 'lose', 'intro']; return rivalLine(rv, kinds[hash32(todayKey() + rv.id) % 3], hero); }

// ---------- R6 wins + race bonuses ----------
// Called by play.js after recordWin(). golden = level.golden; fitCheckWon from the pre-stage Fit Check; "Beat my order" =
// the rival's order delivered with >= 40 % of the stage's energy budget left (pass beatOrder, or energyLeftFrac).
// `now` is only for simulators (tools/race_sim.js); the game never passes it.
export function onPlayerWin(stageN, { golden = false, energyLeftFrac = null, fitCheckWon = false, beatOrder = null, now = Date.now() } = {}) {
  ensure();
  state.winLog.push(now); if (state.winLog.length > 60) state.winLog.splice(0, state.winLog.length - 60);
  const race = evaluate(now);
  const out = { counted: false, bonus: 0, finished: false };
  if (race && !race.finishedAt) {
    race.wins++; out.counted = true;
    if (golden) {
      if (fitCheckWon) { race.bonus++; out.bonus++; }
      const beat = beatOrder != null ? !!beatOrder : (energyLeftFrac != null && energyLeftFrac >= 0.4);
      if (beat) { race.bonus++; out.bonus++; }
    }
    save();
    evaluate(now);
    out.finished = !!race.finishedAt;
  } else save();
  return out;
}

// ---------- F3 Fit Check scoring (delegates to js/style.js when present) ----------
const RARITY_PTS = { rags: 0, common: 10, rare: 16, epic: 24, legendary: 36 };
const CHARM_TPL = new Set(['pet_cat', 'pet_dog', 'coffee', 'basketball', 'football', 'skateboard', 'cash']);
// unwornBonus = the Fit Check's +4 per never-worn piece. Delegates to style.themeScore(eq, theme, { fitCheck }) so both
// scorers always agree; the local fallback mirrors it exactly (rags / messy hair score 0 and never earn the bonus).
export function fitCheckScore(equipped, theme = weekTheme(), { unwornBonus = false } = {}) {
  const eq = equipped || {};
  let s = null;
  if (styleMod && typeof styleMod.themeScore === 'function') { try { s = Number(styleMod.themeScore(eq, theme, { fitCheck: !!unwornBonus })); } catch (_) { s = null; } }
  if (s == null || Number.isNaN(s)) {
    s = 0;
    const worn = new Set(state.worn || []);
    for (const [cat, id] of Object.entries(eq)) {
      if (!id || cat === 'bg') continue;
      if (eq.outfit && (cat === 'top' || cat === 'bottom')) continue;
      const it = getItem(id); if (!it) continue;
      const base = RARITY_PTS[it.rarity] || 0;
      const fams = setsOfItem(it).map(x => x.id);
      const mul = fams.includes(theme?.main) ? 3 : fams.includes(theme?.side) ? 1.8 : 1;
      s += base * mul;
      if (cat === 'acc' && (it.charm || CHARM_TPL.has(it.tpl))) s += 6;
      if (unwornBonus && base > 0 && !worn.has(id)) s += 4;
    }
  }
  return Math.round(s * 10) / 10;
}
// The most one owned, gender-fit piece could add to the player's Fit Check score right now (style.itemDelta with the
// never-worn bonus); without style.js the upper bound of a single piece (legendary main family + charm + unworn).
export function bestPieceDelta(theme = weekTheme(), equipped = state.equipped) {
  if (styleMod && typeof styleMod.itemDelta === 'function') {
    let best = 0; const g = state.profile?.gender;
    for (const id of state.inventory || []) {
      const it = getItem(id); if (!it || it.cat === 'bg' || (g && !fitsGender(it, g))) continue;
      try { best = Math.max(best, Number(styleMod.itemDelta(it, equipped || {}, theme, { fitCheck: true })) || 0); } catch (_) { /* skip */ }
    }
    return Math.round(best * 10) / 10;
  }
  return RARITY_PTS.legendary * 3 + 6 + 4;
}
// The words under the two scores: "+N to beat X — one more <family> piece does it" only when one owned piece really
// closes the gap, otherwise "+N to beat X · <family> pieces score ×3"; "You out-style X" when there is no gap.
export function fitGapHint(gap, theme = weekTheme(), rival, equipped = state.equipped) {
  const rn = rival ? name(rival.name) : '';
  if (!(gap > 0)) return L.youLead(rn);
  return L.gapHint(gap, familyName(theme.main), rn, bestPieceDelta(theme, equipped) >= gap);
}
export const fitCheckHandicap = n => n <= 10 ? 0.7 : n <= 20 ? 0.85 : n <= 40 ? 0.95 : 1;
export const nextFitCheckIn = (stage = state.stage || 1) => 5 - ((stage - 1) % 5);
// Everything the pre-stage card needs for a golden stage (null when not golden or no race).
export function fitCheckFor(stageN = state.stage || 1) {
  if (stageN % 5 !== 0) return null;
  const rival = claimant(); if (!rival) return null;
  const theme = weekTheme();
  const player = fitCheckScore(state.equipped, theme, { unwornBonus: true });
  const rivalScore = fitCheckScore(rivalLook(rival), theme);
  const handicap = fitCheckHandicap(stageN);
  const target = Math.round(rivalScore * handicap * 10) / 10;
  const gap = Math.max(0, Math.round((target - player) * 10) / 10);
  ensureRival(rival.id).met = true; save();
  return { rival, theme, player, rivalScore, handicap, target, won: player >= target, gap, hint: fitGapHint(gap, theme, rival, state.equipped) };
}
// Every piece worn in a judged Fit Check (state.worn, F1/F3).
export function markWorn(equipped = state.equipped) { if (!Array.isArray(state.worn)) state.worn = []; let changed = false; for (const [cat, id] of Object.entries(equipped || {})) { if (!id || cat === 'bg' || state.worn.includes(id)) continue; state.worn.push(id); changed = true; } if (changed) save(); return state.worn; }

// ---------- R7 rewards + steal pool ----------
const REWARDS = { 1: { gems: 10 }, 2: { gems: 8, coins: 300 }, 3: { gems: 5, coins: 200 }, 4: { coins: 150 }, 5: { coins: 80 } };
export function stealPool(rivalId, race = state.race) {
  const rv = rivalById(rivalId); const look = race?.rivals?.[rivalId]?.look; if (!rv || !look) return { pieces: [], signature: null };
  const p = state.profile || {}; const legendOk = (state.raceHistory?.firstStreak || 0) >= 3;
  const pieces = ['hair', 'outfit', 'top', 'bottom', 'shoes', 'hat', 'glasses', 'acc'].map(cat => look[cat] && getItem(look[cat])).filter(Boolean).map(it => {
    const reason = own(it.id) ? 'owned' : !fitsGender(it, p.gender) ? 'gender' : (it.rarity === 'legendary' && !legendOk) ? 'legendary' : null;
    return { item: it, ok: !reason, reason };
  });
  const beaten = state.rivals?.[rivalId]?.beaten || 0; const sigItem = getItem(rv.signature.id);
  const signature = { ...rv.signature, item: sigItem, beaten, left: Math.max(0, 3 - beaten), ok: !!sigItem && beaten >= 3 && !own(sigItem.id) };
  return { pieces, signature };
}
function doSteal(item, rivalId) {
  ensure();
  addItem(item.id);
  state.seen.newIds = [...new Set([...(state.seen.newIds || []), item.id])];
  state.stolen[item.id] = rivalId;
  const r = ensureRival(rivalId); if (!r.stolen.includes(item.id)) r.stolen.push(item.id);
  state.raceHistory.steals++;
  save();
}
// Pays the placement reward exactly once, bumps `beaten` for every rival that finished below the player. A 1st place
// with something stealable persists its Steal a Look (state.stealPending + race.stealPending) until the picker is
// closed with Skip/Done; with nothing stealable the 400-coin fallback is paid here, so no reward depends on a modal.
export function settle(race) {
  if (!race || race.claimed) return null;
  ensure();
  const place = race.place || placement(race).findIndex(x => x.id === 'you') + 1;
  const standingsIds = race.standings || placement(race).map(x => x.id);
  for (const id of standingsIds.slice(standingsIds.indexOf('you') + 1)) if (id !== 'you') ensureRival(id).beaten++;
  const h = state.raceHistory; if (place === 1) { h.firsts++; h.firstStreak++; } else h.firstStreak = 0;
  const rw = { ...(REWARDS[place] || REWARDS[5]) };
  const runnerUp = place === 1 ? standingsIds[1] || null : null;
  let pending = null;
  if (runnerUp) {
    const pool = stealPool(runnerUp, race);
    if (pool.pieces.some(x => x.ok) || pool.signature?.ok) {
      pending = { weekKey: race.weekKey, seed: race.seed, runnerUp, steals: 0, taken: [], look: race.rivals?.[runnerUp]?.look || rivalLook(runnerUp) };
      state.stealPending.push(pending);
      race.stealPending = { runnerUp, steals: 0 };
    } else rw.coins = (rw.coins || 0) + 400;   // R7: nothing left to steal → +400 coins instead
  }
  if (rw.coins) addCoins(rw.coins); if (rw.gems) addGems(rw.gems);
  race.claimed = true; race.place = place; race.standings = standingsIds; race.rewarded = { ...rw }; save();
  return { place, reward: rw, runnerUp, pending, consolation: !!(runnerUp && !pending) };
}
function notePendingSteal(pd, itemId) {
  pd.steals = (pd.steals || 0) + 1; pd.taken = [...new Set([...(pd.taken || []), itemId])];
  for (const r of racesOfWeek(pd.weekKey)) if (r.stealPending) r.stealPending.steals = pd.steals;
  save();
}
function resolvePending(pd) {
  const q = pendingSteals(); const i = q.indexOf(pd); if (i >= 0) q.splice(i, 1);
  for (const r of racesOfWeek(pd.weekKey)) if (r.stealPending) r.stealPending = null;
  save();
}

// ---------- UI: head crops ----------
// Head crop SVG for 'you' or a rival id (cached by id+weekKey+seed for rivals).
export function headCrop(id, race = state.race) {
  if (id === 'you') { const p = state.profile || {}; return portraitOf({ gender: p.gender, skin: p.skin, look: state.equipped || {} }); }
  const rv = rivalById(id); if (!rv) return '';
  const look = race?.rivals?.[id]?.look || rivalLook(id);
  return portraitOf({ gender: rv.gender, skin: rv.skin, look, key: race ? `${id}|${race.weekKey}|${race.seed}` : null });
}
const headSVG = headCrop;
// chip = name + wins in two spans (.rr-nm / .rr-n) so short phones can drop the names and keep the numbers
const headEl = (id, race, { wins = null, cls = '' } = {}) => {
  const you = id === 'you'; const rv = you ? null : rivalById(id);
  const chip = el('span', { class: 'rr-chip' }, [el('span', { class: 'rr-nm' }, you ? name(L.you) : name(rv.name)), wins != null ? el('span', { class: 'rr-n' }, String(wins)) : null]);
  const d = el('div', { class: `rr-head ${you ? 'you' : ''} ${cls}` }, [el('div', { class: 'rr-pic', html: headSVG(id, race) }), chip]);
  d.style.setProperty('--c', you ? '#ec4899' : rv.color);
  return d;
};

// ---------- R8 hub card (replaces the "Golden gift in N" badge; tap → This Week) ----------
export function rivalCard(app) {
  const race = evaluate();
  const card = el('div', { class: 'rival-row', role: 'button' });
  if (!race) { card.classList.add('hidden'); return card; }
  const unclaimed = !!(state.racePrev && !state.racePrev.claimed) || !!(race.finishedAt && !race.claimed);
  const stealDue = pendingSteals().length > 0;
  const due = unclaimed || stealDue;
  card.addEventListener('click', () => { sfx.tap(); haptic(); if (due) settleIfDue(app); else app.go('week'); });
  card.title = name(HONESTY);
  const theme = weekTheme();
  const timer = el('span', { class: 'rr-timer' });
  // top row: title · the short R9 label (the full sentence is the card's tooltip) · finish line · countdown
  const top = el('div', { class: 'rr-top' }, [el('span', { class: 'rr-title' }, `🏁 ${name(L.title)}`), el('span', { class: 'rr-ai' }, name(HONESTY_SHORT)), el('span', { class: 'rr-finish' }, race.finishedAt ? name(L.raceOver) : name(L.firstTo(race.finish))), timer]);
  const strip = el('div', { class: 'rr-strip' });
  for (const row of placement(race)) strip.append(headEl(row.id, race, { wins: row.wins }));
  // message row: the next Fit Check, or what a tap collects
  const line = el('div', { class: 'rr-line' });
  if (unclaimed) line.textContent = `🎁 ${name(L.tapCollect)}`;
  else if (stealDue) line.textContent = `👜 ${name(L.tapSteal)}`;
  else if (race.finishedAt) line.textContent = `🏁 ${name(L.placed(race.place))} · ${name(L.nextRace)}`;
  else { const n = nextFitCheckIn(); const rv = claimant(); const th = `${theme.emoji || '👗'} ${name(theme.name)}`; line.textContent = rv ? name(n === 1 ? L.fitNext(th, name(rv.name)) : L.fitIn(n, th, name(rv.name))) : th; }
  card.append(top, strip, line);
  const paintTimer = () => { timer.textContent = `⏱ ${name(L.dur(race.weekEnd - Date.now()))}`; };   // countdown to Sunday 23:59:59 (= next Monday 00:00)
  paintTimer();
  let ticks = 0; const iv = setInterval(() => { if (ticks++ > 2 && !card.isConnected) return clearInterval(iv); paintTimer(); }, 30000);
  return card;
}

// Once per app open: the rival that gained the most since the last look ("Kiara +2 overnight"), else null.
let comebackShown = false;
export function comebackToast() {
  const race = evaluate(); if (!race) return null;
  race.seen = race.seen || {};
  let best = null;
  for (const rv of ROSTER) { const w = race.rivals[rv.id]?.wins || 0; const gain = w - (race.seen[rv.id] ?? w); if (gain > 0 && (!best || gain > best.gain)) best = { rv, gain }; race.seen[rv.id] = w; }
  save();
  if (!best || comebackShown) return null;
  comebackShown = true;
  return L.overnight(best.rv.name, best.gain);
}

// Resolves when the modal is gone — also when a screen change wiped the overlay (so an await never hangs).
function whenClosed(m, res) { let done = false; const fin = v => { if (done) return; done = true; clearInterval(iv); res(v); }; const iv = setInterval(() => { if (!m.bg.isConnected) fin(true); }, 400); return fin; }

// ---------- F2 intro (one-time, first hub visit after profile creation) ----------
export function introIfNeeded(app) {
  ensure();
  if (!state.profile || state.seen?.['rivals:intro']) return Promise.resolve(false);
  const race = evaluate(); if (!race) return Promise.resolve(false);
  markSeen('rivals:intro');
  for (const rv of ROSTER) ensureRival(rv.id).met = true;
  save();
  return new Promise(res => {
    const walk = el('div', { class: 'ri-walk' });
    ROSTER.forEach((rv, i) => { const d = el('div', { class: 'ri-rival' }, [el('div', { class: 'ri-pic', html: headSVG(rv.id, race) }), el('b', {}, name(rv.name)), el('span', {}, name(rv.nick))]); d.style.setProperty('--i', i); d.style.setProperty('--c', rv.color); walk.append(d); });
    const body = el('div', { class: 'rival-intro' }, [walk, el('div', { class: 'ri-pitch' }, name(L.introPitch)), el('div', { class: 'ri-race' }, name(L.introRace(race.finish))), el('div', { class: 'rr-foot' }, name(HONESTY))]);
    let fin;
    const m = modal({ title: `🏁 ${name(L.title)}`, body, cls: 'rival-modal', actions: [{ label: name(L.startNow), cls: 'primary' }], onClose: () => fin && fin(true) });
    fin = whenClosed(m, res);
  });
}

// ---------- R7 Steal a Look picker (shared by the settlement modal and a reopened pending steal) ----------
// Builds the picker for a pending steal `pd`: { nodes, acts, anyOk }. The first steal is free, the second costs 20 gems.
// Skip/Done resolves the pending steal (removes it from the queue) and closes the modal via getModal().close();
// an overlay wipe leaves it queued, so the hub card re-offers it ("Tap to pick your stolen piece").
function stealSection(pd, getModal, { onResolved } = {}) {
  const p = state.profile || {};
  const rv = rivalById(pd.runnerUp);
  const raceLike = raceOfPending(pd);
  const pool = stealPool(pd.runnerUp, raceLike);
  const taken = new Set(pd.taken || []);
  const anyOk = pool.pieces.some(x => x.ok) || !!pool.signature?.ok;
  const head = el('div', { class: 'settle-steal' }, `👜 ${name(L.stealALook)} — ${name(L.stealFrom(name(rv.name)))}`);
  const grid = el('div', { class: 'steal-pick' });
  let sel = null, steals = pd.steals || 0;
  const cards = new Map();
  const stealBtn = el('button', { class: 'btn gold', disabled: true }, name(L.steal));
  const secondBtn = el('button', { class: 'btn purple hidden' }, name(L.secondSteal));
  const skipBtn = el('button', { class: 'btn light', onclick: () => { sfx.tap(); resolvePending(pd); onResolved && onResolved(); getModal().close(); } }, name(L.skip));
  const stillStealable = () => [...cards.values()].some(c => c.ok && !c.taken);
  const refresh = () => { for (const c of cards.values()) { c.el.classList.toggle('sel', sel === c); c.el.classList.toggle('taken', !!c.taken); } stealBtn.disabled = !sel || (steals >= 1); stealBtn.classList.toggle('hidden', steals >= 1); secondBtn.classList.toggle('hidden', !(steals === 1 && stillStealable())); secondBtn.disabled = !sel; skipBtn.textContent = steals ? name(L.done) : name(L.skip); };
  const addCard = (item, ok, reason, extraBadge) => {
    const wasTaken = taken.has(item.id);
    const c = { item, ok: ok && !wasTaken, reason: wasTaken ? null : reason, taken: wasTaken, el: null };
    c.el = itemCard(item, { owned: ok || wasTaken, gender: p.gender, skin: p.skin, baseEq: state.equipped, badge: extraBadge, onClick: () => { if (!c.ok || c.taken) { if (c.reason === 'legendary') toast(name(L.legendaryLock), { icon: I.lock() }); else if (c.reason === 'gender') toast(name(L.notYourSize)); else if (c.reason === 'owned') toast(t('owned')); return; } sfx.tap(); sel = c; refresh(); } });
    if (!ok && !wasTaken) { c.el.classList.add('nope', reason || 'nope'); c.el.append(el('span', { class: 'why' }, reason === 'owned' ? t('owned') : reason === 'legendary' ? '🔒 3×🥇' : reason === 'gender' ? name(L.notYourSize) : '🔒')); }
    cards.set(item.id, c); grid.append(c.el);
  };
  for (const x of pool.pieces) addCard(x.item, x.ok, x.reason);
  if (pool.signature) {
    const sg = pool.signature;
    if (sg.item) addCard(sg.item, sg.ok, sg.ok ? null : (own(sg.item.id) ? 'owned' : 'signature'), '★');
    const sgEl = cards.get(sg.item?.id)?.el;
    const lockTxt = sg.ok ? name(L.wildNote) : name(L.beatMore(name(rv.name), sg.left || 1));
    if (sgEl) { sgEl.classList.add('signature'); const why = sgEl.querySelector('.why'); if (why) why.textContent = `★ ${lockTxt}`; }
    else grid.append(el('div', { class: 'item nope signature placeholder' }, [el('div', { class: 'th' }, '★'), el('div', { class: 'nm' }, name(sg.name)), el('span', { class: 'why' }, lockTxt)]));
  }
  const takeSel = () => { const c = sel; if (!c) return false; doSteal(c.item, pd.runnerUp); notePendingSteal(pd, c.item.id); c.taken = true; sel = null; steals = pd.steals; sfx.equip(); haptic([15, 20, 15]); fx.confetti(60); toast(name(L.stolen(name(c.item.name))), { icon: I.sparkle(), ms: 2600 }); refresh(); return true; };
  stealBtn.onclick = () => { if (!sel || steals >= 1) return; takeSel(); };
  secondBtn.onclick = () => { if (!sel || steals !== 1) return; if (!spendGems(20)) { sfx.error(); toast(t('notEnoughGems')); return; } takeSel(); };
  refresh();
  return { nodes: [head, grid], acts: [stealBtn, secondBtn, skipBtn], anyOk };
}
// Re-opens the picker of a persisted steal (the settlement modal was wiped by a screen change). Resolves true when the
// player closed it with Skip/Done, false when the overlay was wiped again; chains to the next pending steal if any.
function reopenSteal(app, pd) {
  if ((pd.steals || 0) >= 1) {   // the free steal was taken: reopen only if a second (20 💎) steal is still possible
    const pool = stealPool(pd.runnerUp, raceOfPending(pd)), taken = pd.taken || [];
    const left = pool.pieces.some(x => x.ok && !taken.includes(x.item.id)) || !!(pool.signature?.ok && pool.signature.item && !taken.includes(pool.signature.item.id));
    if (!left) { resolvePending(pd); return Promise.resolve(true); }
  }
  return new Promise(res => {
    const body = el('div', { class: 'settle' });
    let fin, m, tapped = false;
    const sec = stealSection(pd, () => m, { onResolved: () => { tapped = true; } });
    if (!sec.anyOk && !(pd.steals >= 1)) { addCoins(400); resolvePending(pd); toast(name(L.nothingToSteal), { icon: I.coin(), ms: 2600 }); return res(true); }
    const acts = el('div', { class: 'actions' }, sec.acts);
    body.append(...sec.nodes, acts);
    m = modal({ title: `👜 ${name(L.stealALook)}`, body, cls: 'rival-modal', actions: [], onClose: () => fin && fin(tapped) });
    fin = whenClosed(m, res);
    sfx.goal();
  }).then(ok => (ok && pendingSteals().length) ? reopenSteal(app, pendingSteals()[0]) : ok);
}

// ---------- R7 settlement modal (podium + steal picker + rewards), one per finished race ----------
// Also the "Tap to collect" path: with no unclaimed race it re-opens a persisted Steal a Look (state.stealPending).
export function settleIfDue(app) {
  ensure();
  if (!state.profile) return Promise.resolve(null);
  evaluate();
  const race = (state.racePrev && !state.racePrev.claimed) ? state.racePrev : (state.race?.finishedAt && !state.race.claimed) ? state.race : null;
  if (!race) {
    if (state.racePrev?.claimed) { delete state.racePrev; save(); }
    const pd = pendingSteals()[0];
    return pd ? reopenSteal(app, pd) : Promise.resolve(null);
  }
  const result = settle(race);
  if (state.racePrev === race) { delete state.racePrev; save(); }
  if (!result) return Promise.resolve(null);
  return new Promise(res => {
    const { place, reward, pending, consolation } = result;
    const body = el('div', { class: 'settle' });
    const podium = el('div', { class: 'podium' });
    (race.standings || []).forEach((id, i) => { const h = headEl(id, race, { wins: id === 'you' ? playerWins(race) : (race.rivals[id]?.wins || 0), cls: i === 0 ? 'first' : '' }); h.prepend(el('span', { class: 'rank' }, ['🥇', '🥈', '🥉', '4', '5'][i])); podium.append(h); });
    body.append(el('div', { class: 'settle-place' }, `${['🥇', '🥈', '🥉', '🏃', '🚶'][place - 1]} ${name(L.placed(place))}`), podium);
    const rewardTxt = [reward.gems ? `+${reward.gems} 💎` : '', reward.coins ? `+${reward.coins} 🪙` : ''].filter(Boolean).join(' · ');
    body.append(el('div', { class: 'settle-reward' }, `${name(L.reward)}: ${rewardTxt}`));
    const acts = el('div', { class: 'actions' });
    let fin, m;
    const closeBtn = (label, cls = 'light') => el('button', { class: 'btn ' + cls, onclick: () => { sfx.tap(); m.close(); } }, label);
    if (pending) { const sec = stealSection(pending, () => m); body.append(...sec.nodes); acts.append(...sec.acts); }
    else { if (consolation) body.append(el('div', { class: 'win-story' }, name(L.nothingToSteal))); acts.append(closeBtn(t('great'), 'gold')); }
    body.append(el('div', { class: 'tiny', style: { marginTop: '6px' } }, name(L.nextRace)), acts);
    m = modal({ title: `🏁 ${name(L.title)}`, body, cls: 'rival-modal', actions: [], onClose: () => fin && fin(result) });
    fin = whenClosed(m, res);
    if (place === 1) { sfx.win(); fx.confetti(120); } else sfx.goal();
  }).then(r => (tappedOf(r) && pendingSteals().length) ? reopenSteal(app, pendingSteals()[0]).then(() => r) : r);
}
// settleIfDue's modal resolves with the settle() result (closed by a tap) or `true` (overlay wiped): only a tap chains on
const tappedOf = r => !!(r && typeof r === 'object');
