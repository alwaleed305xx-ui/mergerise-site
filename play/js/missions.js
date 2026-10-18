// Daily missions (3 per day, date-seeded), a 7-day streak calendar, and lifetime achievements.
// Progress is fed by play.js events through `track(type, n)`; everything lives in state (no backend).
import { state, save, addCoins, addItem, addReserve, equip, claimDaily, RESERVE_CAP } from './store.js';
import { todayKey, rng, el, $, haptic } from './util.js';
import { addGems, spendGems, passActive } from './economy.js';
import { rollGift } from './wardrobe.js';
import { t, name } from './i18n.js';
import { I, modal, toast } from './ui.js';
import { giftFlow } from './gift.js';
import { showRewardedAd, adsAvailable } from './ads.js';
import { sfx } from './audio.js';
import { fx } from './particles.js';
import { npcByName, portrait, lineFor, hostFor } from './customers.js';

const DAY = 86400000;
const POOL = [
  { id: 'deliver', text: { en: 'Deliver {n} orders', ar: 'سلّم {n} طلبات' }, n: [4, 6, 8], reward: { coins: 150 } },
  { id: 'merge', text: { en: 'Merge {n} times', ar: 'ادمج {n} مرة' }, n: [20, 30, 45], reward: { coins: 150 } },
  { id: 'merge5', text: { en: 'Merge 5 at once {n}×', ar: 'ادمج ٥ دفعة واحدة {n} مرات' }, n: [1, 2, 3], reward: { gems: 5 } },
  { id: 'bubble', text: { en: 'Pop {n} bubbles', ar: 'فرقع {n} فقاعات' }, n: [1, 2, 3], reward: { coins: 120 } },
  { id: 'crate', text: { en: 'Open {n} crate drops', ar: 'افتح {n} من الصناديق' }, n: [4, 8, 12], reward: { coins: 120 } },
  { id: 'win', text: { en: 'Win {n} stages', ar: 'افز بـ {n} مراحل' }, n: [1, 2, 3], reward: { gems: 6 } },
  { id: 'discover', text: { en: 'Discover {n} new items', ar: 'اكتشف {n} عناصر جديدة' }, n: [1, 2, 3], reward: { gems: 4 } },
  { id: 'unlock', text: { en: 'Free {n} locked items', ar: 'حرّر {n} عناصر مقفلة' }, n: [1, 2, 3], reward: { coins: 150 } },
  { id: 'stars', text: { en: 'Earn {n} stars', ar: 'اجمع {n} نجوم' }, n: [3, 5, 8], reward: { gems: 5 } },
  { id: 'make5', text: { en: 'Create {n} level-5 items', ar: 'اصنع {n} عناصر مستوى 5' }, n: [1, 2, 3], reward: { coins: 200 } },
];
// Streak calendar v2 (F5): the 7-day lane, a day 8–14 lane, then loop with +10 % coins per loop (gems/gifts unchanged).
export const STREAK_TABLE = [
  { coins: 120 }, { coins: 150 }, { gems: 10 }, { coins: 200 }, { gems: 15 }, { coins: 250 }, { gems: 30, gift: 'rare' },
  { coins: 150 }, { coins: 200 }, { gems: 10 }, { coins: 250 }, { gems: 15 }, { coins: 300 }, { gift: 'epic' },
];
export const STREAK_LEN = STREAK_TABLE.length, STREAK_LOOP_BONUS = 0.10, SHIELD_GEMS = 10, WELCOME_BACK_DAYS = 14;
// A node is paid at most once per lane: a re-claim after a miss (day <= streak.paidMax) pays this coin fallback
// (the node's own coins when it has them) and never the gems / gift again (§3.6 gem discipline).
export const STREAK_REPEAT_COINS = 100;
// F4: the 4th daily mission comes from today's Daily Hustle host ("Deliver 5 of Jay's orders", 3 gems). It is not in
// the random POOL and cannot be rerolled. play.js feeds it with track('host') (or trackHostDelivery(name)) per delivery.
export const HOST_MISSION = { id: 'host', text: { en: "Deliver {n} of {host}'s orders", ar: 'سلّم {n} من طلبات {host}' }, n: [5, 5, 5], reward: { gems: 3 } };
const defOf = id => id === HOST_MISSION.id ? HOST_MISSION : POOL.find(p => p.id === id);
const missionTier = () => Math.min(2, Math.floor(((state.stage || 1) - 1) / 10));
const hostEntry = () => ({ id: HOST_MISSION.id, host: hostFor().name, n: HOST_MISSION.n[missionTier()], progress: 0, claimed: false });

function ensure() {
  const d = todayKey();
  if (!state.missions || state.missions.day !== d) {
    const R = rng(parseInt(d.replace(/-/g, ''), 10) * 31 + 7);
    const pool = POOL.slice(); const picks = [];
    while (picks.length < 3 && pool.length) { const m = pool.splice(Math.floor(R() * pool.length), 1)[0]; picks.push({ id: m.id, n: m.n[missionTier()], progress: 0, claimed: false }); }
    picks.push(hostEntry());                                                   // F4: 4th mission from the host
    state.missions = { day: d, list: picks, rerolled: false }; save();
  }
  if (!state.missions.list.some(m => m.id === HOST_MISSION.id)) { state.missions.list.push(hostEntry()); save(); }   // older save from today
  if (!state.streak) state.streak = { last: null, count: 0, claimedDay: null };
  ensureStreak();
  if (!state.achievements) state.achievements = { unlocked: [], counters: {} };
}
// Each entry gets `def` ({ id, text{en,ar}, n, reward }); the host mission's text has {host} resolved, {n} is left for
// the caller (hub.js renders `name(m.def.text).replace('{n}', m.n)`).
export function missions() {
  ensure();
  return state.missions.list.map(m => {
    const def = defOf(m.id);
    if (m.id !== HOST_MISSION.id) return { ...m, def };
    const host = m.host || hostFor().name;
    return { ...m, host, def: { ...def, text: { en: def.text.en.replace('{host}', host), ar: def.text.ar.replace('{host}', host) } } };
  });
}
export function track(type, n = 1) {
  ensure();
  let changed = false;
  for (const m of state.missions.list) if (m.id === type && !m.claimed && m.progress < m.n) { m.progress = Math.min(m.n, m.progress + n); changed = true; }
  const c = state.achievements.counters; c[type] = (c[type] || 0) + n;
  if (changed) save(); else save();
  return state.missions.list.filter(m => m.id === type && m.progress >= m.n && !m.claimed).length;
}
// Convenience for play.js: call on EVERY delivery with the order's customer name; counts for the host mission only
// when that customer is today's host (every order on the Daily Hustle board, plus the host's own orders elsewhere).
export function trackHostDelivery(customerName) {
  ensure();
  const m = state.missions.list.find(x => x.id === HOST_MISSION.id);
  const host = (m && m.host) || hostFor().name;
  if (!customerName || customerName !== host) return 0;
  return track(HOST_MISSION.id);
}
export function claimMission(id) {
  ensure();
  const m = state.missions.list.find(x => x.id === id); if (!m || m.claimed || m.progress < m.n) return null;
  const def = defOf(id); m.claimed = true;
  if (def.reward.coins) addCoins(def.reward.coins); if (def.reward.gems) addGems(def.reward.gems);
  save(); return def.reward;
}
export const missionsClaimable = () => missions().filter(m => !m.claimed && m.progress >= m.n).length;
// ----- F4: one free reroll per day — swaps one unclaimed POOL mission for an unused POOL entry (progress reset) -----
export const canReroll = () => { ensure(); return !state.missions.rerolled; };
// returns the new mission entry (with def) or null (already rerolled today, unknown / claimed / host mission, no spare entry)
export function rerollMission(id) {
  ensure();
  if (state.missions.rerolled) return null;
  const i = state.missions.list.findIndex(x => x.id === id);
  const m = state.missions.list[i];
  if (!m || m.claimed || m.id === HOST_MISSION.id) return null;
  const used = new Set(state.missions.list.map(x => x.id));
  const spare = POOL.filter(p => !used.has(p.id));
  if (!spare.length) return null;
  const R = rng(seedOfDay() * 17 + i + 101);
  const pick = spare[Math.floor(R() * spare.length)];
  const fresh = { id: pick.id, n: pick.n[missionTier()], progress: 0, claimed: false };
  state.missions.list[i] = fresh; state.missions.rerolled = true; save();
  return { ...fresh, def: defOf(fresh.id) };
}
const seedOfDay = () => parseInt(todayKey().replace(/-/g, ''), 10);

// ---------- streak v2: soft reset, shields, welcome-back (F5) ----------
// state.streak = { last, count, claimedDay, paidMax, shields, shieldWeek, passWeek, shieldUsed, restored, lastSeen }
//   paidMax  = highest streak day ever paid; a claim of a day <= paidMax (after a miss) pays the coin fallback only
//   lastSeen = ms of the last hub visit (welcome-back after 14+ days); migrated from the old top-level state.lastSeen
const keyOf = d => `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
const dateOfKey = k => { const [y, m, d] = String(k).split('-').map(Number); return new Date(y, (m || 1) - 1, d || 1); };
// whole days from day key `a` to day key `b` (DST-safe: both keys are local midnights)
const daysBetween = (a, b) => Math.round((dateOfKey(b) - dateOfKey(a)) / DAY);
// ISO week key (Monday 00:00 local), e.g. "2026-W42"
export function weekKey(d = new Date()) {
  const x = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  x.setDate(x.getDate() - ((x.getDay() + 6) % 7) + 3);            // the Thursday of this week decides the ISO year
  const y = x.getFullYear();
  const w1 = new Date(y, 0, 4); w1.setDate(w1.getDate() - ((w1.getDay() + 6) % 7) + 3);
  return `${y}-W${String(1 + Math.round((x - w1) / 604800000)).padStart(2, '0')}`;
}
function ensureStreak() {
  const s = state.streak;
  if (typeof s.shields !== 'number') s.shields = 0;
  if (s.shieldWeek === undefined) s.shieldWeek = null;
  if (s.passWeek === undefined) s.passWeek = null;
  if (typeof s.paidMax !== 'number') s.paidMax = s.count || 0;                 // older saves: everything up to count was paid
  if (s.lastSeen === undefined) { s.lastSeen = typeof state.lastSeen === 'number' ? state.lastSeen : null; delete state.lastSeen; }
  const wk = weekKey();
}
// reward of streak day N (1-based): node = position in the 14-node lane, loop = completed lanes (+10 % coins each)
export function streakReward(day) {
  const n = Math.max(1, Math.round(day || 1));
  const i = (n - 1) % STREAK_LEN, loop = Math.floor((n - 1) / STREAK_LEN);
  const r = { ...STREAK_TABLE[i], node: i + 1, loop };
  if (r.coins) r.coins = Math.round(r.coins * (1 + STREAK_LOOP_BONUS * loop));
  return r;
}
// What a claim of streak day N pays NOW: the table reward, or — when day N was already paid in this run
// (N <= streak.paidMax, i.e. a re-claim after a miss) — the coin fallback only, flagged `repeat`.
export function rewardForDay(day) {
  const r = streakReward(day);
  const paidMax = (state.streak && state.streak.paidMax) || 0;
  if (day > paidMax) return r;
  const base = STREAK_TABLE[r.node - 1].coins || STREAK_REPEAT_COINS;
  return { coins: Math.round(base * (1 + STREAK_LOOP_BONUS * r.loop)), node: r.node, loop: r.loop, repeat: true };
}
// { claimable, day, node, loop, reward, missed, gap, back, shielded, repeat, restored, shields, canEarnShield, count, paidMax }
//   gap  = missed days since the last claim; a shield covers ONE of them, every other missed day steps back one node
//   back = nodes stepped back (floor: day 1 — "never to day 1" means never a full reset, so day 1 itself is reachable)
export function streakStatus() {
  ensure();
  const d = todayKey(), s = state.streak;
  const common = { shields: s.shields, canEarnShield: s.shieldWeek !== weekKey(), count: s.count, restored: s.restored === d, paidMax: s.paidMax || 0 };
  if (s.claimedDay === d) { const reward = streakReward(s.count); return { claimable: false, day: s.count, node: reward.node, loop: reward.loop, reward, missed: false, gap: 0, back: 0, shielded: false, repeat: false, ...common }; }
  const fresh = !s.last || !s.count;
  const gap = fresh ? 0 : Math.max(0, daysBetween(s.last, d) - 1);
  const missed = gap > 0 && !common.restored;
  const shielded = missed && s.shields > 0;
  const back = missed ? Math.max(0, gap - (shielded ? 1 : 0)) : 0;
  const next = fresh ? 1 : Math.max(1, s.count + 1 - back);
  const reward = rewardForDay(next);
  return { claimable: true, day: next, node: reward.node, loop: reward.loop, reward, missed, gap, back, shielded, repeat: !!reward.repeat, ...common };
}
// Pays the day: coins / gems, and a gift (rare day 7, epic day 14) rolled with rollGift, added to the inventory and
// returned as `item` for the reveal. A re-claimed day (repeat) pays the coin fallback only. Consumes a shield when it
// saved a missed day. Raises streak.paidMax so no node is ever paid twice.
export function claimStreak() {
  ensure(); const st = streakStatus(); if (!st.claimable) return null;
  const d = todayKey(), s = state.streak;
  if (st.shielded) { s.shields = Math.max(0, s.shields - 1); s.shieldUsed = d; }
  Object.assign(s, { last: d, count: st.day, claimedDay: d, paidMax: Math.max(s.paidMax || 0, st.day) });
  if (st.reward.coins) addCoins(st.reward.coins); if (st.reward.gems) addGems(st.reward.gems);
  let item = null;
  if (st.reward.gift && state.profile) {
    item = rollGift(Math.max(state.stage || 1, 5), state.profile.gender, state.inventory, Math.random, st.reward.gift);
    if (item) { addItem(item.id); state.seen.newIds = [...new Set([...(state.seen.newIds || []), item.id])]; }
    else { addCoins(300); st.reward = { ...st.reward, coins: (st.reward.coins || 0) + 300 }; }
  }
  setCounter('streakMax', st.day);
  save(); return { ...st, item };
}
// ----- shields: one free per ISO week via the rewarded-ad path or 10 gems -----
export function shieldInfo() { ensure(); const s = state.streak; return { shields: s.shields, canEarn: s.shieldWeek !== weekKey(), gems: SHIELD_GEMS, passWeekly: false }; }
// via = 'ad' (the caller has already shown the rewarded ad) | 'gems'
export function earnShield(via) {
  ensure(); const s = state.streak; const wk = weekKey();
  if (s.shieldWeek === wk) return false;
  if (via === 'gems' && !spendGems(SHIELD_GEMS)) return false;
  s.shieldWeek = wk; s.shields += 1; save(); return true;
}
// ----- welcome back: after 14+ days away → Reserve to 30, 300c, 1 common gift, streak restored to the last node -----
// state.streak.lastSeen (ms) is stamped by touchLastSeen() on every hub visit (welcomeBackFlow does it for you).
const lastSeenMs = () => { ensure(); const v = state.streak.lastSeen; return typeof v === 'number' ? v : 0; };
export function awayDays() { const v = lastSeenMs(); return v ? Math.max(0, Math.floor((Date.now() - v) / DAY)) : 0; }
export function welcomeBackDue() { return !!state.profile && !!lastSeenMs() && awayDays() >= WELCOME_BACK_DAYS; }
export function touchLastSeen() { ensure(); state.streak.lastSeen = Date.now(); save(); }
const streakChanged = () => document.dispatchEvent(new CustomEvent('mr:streak'));
export function claimWelcomeBack() {
  ensure(); const days = awayDays();
  addReserve(RESERVE_CAP); addCoins(300);
  state.streak.restored = todayKey();
  let item = null;
  if (state.profile) {
    item = rollGift(Math.max(state.stage || 1, 1), state.profile.gender, state.inventory, Math.random, 'common');
    if (item) { addItem(item.id); state.seen.newIds = [...new Set([...(state.seen.newIds || []), item.id])]; }
  }
  touchLastSeen(); streakChanged();                                             // the strip repaints: "Luis kept your streak"
  return { days, coins: 300, reserve: RESERVE_CAP, item, streakDay: Math.max(1, (state.streak && state.streak.count) || 1) };
}

// ---------- achievements (lifetime) ----------
export const ACHIEVEMENTS = [
  { id: 'first_win', text: { en: 'First Hustle', ar: 'أول كدّ' }, desc: { en: 'Win a stage', ar: 'افز بمرحلة' }, check: c => (c.win || 0) >= 1, reward: { coins: 100 } },
  { id: 'wins_10', text: { en: 'Block Regular', ar: 'ابن الحي' }, desc: { en: 'Win 10 stages', ar: 'افز بـ 10 مراحل' }, check: c => (c.win || 0) >= 10, reward: { gems: 10 } },
  { id: 'wins_30', text: { en: 'City Mover', ar: 'ابن المدينة' }, desc: { en: 'Win 30 stages', ar: 'افز بـ 30 مرحلة' }, check: c => (c.win || 0) >= 30, reward: { gems: 25 } },
  { id: 'merges_100', text: { en: 'Merge Machine', ar: 'آلة الدمج' }, desc: { en: 'Merge 100 times', ar: 'ادمج 100 مرة' }, check: c => (c.merge || 0) >= 100, reward: { coins: 300 } },
  { id: 'merges_1000', text: { en: 'Merge Legend', ar: 'أسطورة الدمج' }, desc: { en: 'Merge 1,000 times', ar: 'ادمج 1000 مرة' }, check: c => (c.merge || 0) >= 1000, reward: { gems: 40 } },
  { id: 'merge5_10', text: { en: 'High Five', ar: 'هاي فايف' }, desc: { en: 'Merge 5 at once 10 times', ar: 'ادمج ٥ دفعة واحدة 10 مرات' }, check: c => (c.merge5 || 0) >= 10, reward: { gems: 15 } },
  { id: 'deliver_50', text: { en: 'Neighborhood Favorite', ar: 'محبوب الحي' }, desc: { en: 'Deliver 50 orders', ar: 'سلّم 50 طلبًا' }, check: c => (c.deliver || 0) >= 50, reward: { coins: 500 } },
  { id: 'bubbles_20', text: { en: 'Bubble Popper', ar: 'مفرقع الفقاعات' }, desc: { en: 'Pop 20 bubbles', ar: 'فرقع 20 فقاعة' }, check: c => (c.bubble || 0) >= 20, reward: { coins: 300 } },
  { id: 'crates_50', text: { en: 'Crate Digger', ar: 'نبّاش الصناديق' }, desc: { en: 'Open 50 crate drops', ar: 'افتح 50 من الصناديق' }, check: c => (c.crate || 0) >= 50, reward: { gems: 10 } },
  { id: 'discover_20', text: { en: 'Explorer', ar: 'مستكشف' }, desc: { en: 'Discover 20 items', ar: 'اكتشف 20 عنصرًا' }, check: c => (c.discover || 0) >= 20, reward: { gems: 10 } },
  { id: 'wardrobe_25', text: { en: 'Closet Builder', ar: 'باني الخزانة' }, desc: { en: 'Own 25 clothing items', ar: 'املك 25 قطعة لبس' }, check: (c, s) => (s.inventory || []).length >= 25, reward: { coins: 400 } },
  { id: 'wardrobe_100', text: { en: 'Fashion Mogul', ar: 'قطب الموضة' }, desc: { en: 'Own 100 clothing items', ar: 'املك 100 قطعة لبس' }, check: (c, s) => (s.inventory || []).length >= 100, reward: { gems: 50 } },
  { id: 'style_700', text: { en: 'Hollywood Star', ar: 'نجم هوليوود' }, desc: { en: 'Reach 700 style points', ar: 'وصل 700 نقطة ستايل' }, check: c => (c.styleMax || 0) >= 700, reward: { gems: 20 } },
  { id: 'sets_3', text: { en: 'Set Collector', ar: 'جامع الأطقم' }, desc: { en: 'Complete 3 outfit sets', ar: 'أكمل 3 أطقم' }, check: c => (c.setsMax || 0) >= 3, reward: { gems: 20 } },
  { id: 'friend_3', text: { en: 'People Person', ar: 'اجتماعي' }, desc: { en: 'Reach friendship level 3 with a customer', ar: 'وصل مستوى صداقة 3 مع زبون' }, check: c => (c.friendMax || 0) >= 3, reward: { coins: 500 } },
  { id: 'streak_7', text: { en: 'Seven Days Strong', ar: 'سبعة أيام متواصلة' }, desc: { en: 'Keep a 7-day streak', ar: 'حافظ على 7 أيام متتالية' }, check: c => (c.streakMax || 0) >= 7, reward: { gems: 30 } },
  { id: 'golden_5', text: { en: 'Golden Touch', ar: 'اللمسة الذهبية' }, desc: { en: 'Win 5 golden stages', ar: 'افز بـ 5 مراحل ذهبية' }, check: c => (c.golden || 0) >= 5, reward: { gems: 20 } },
  { id: 'tier_4', text: { en: 'Beverly Hills', ar: 'بيفرلي هيلز' }, desc: { en: 'Reach the mansion', ar: 'وصل القصر' }, check: (c, s) => (s.stage || 1) > 30, reward: { gems: 100 } },
];
export function setCounter(key, value) { ensure(); const c = state.achievements.counters; if ((c[key] || 0) < value) { c[key] = value; save(); } }
// returns newly unlocked achievements (and pays their rewards)
export function checkAchievements() {
  ensure();
  const out = [];
  for (const a of ACHIEVEMENTS) {
    if (state.achievements.unlocked.includes(a.id)) continue;
    if (a.check(state.achievements.counters, state)) { state.achievements.unlocked.push(a.id); if (a.reward.coins) addCoins(a.reward.coins); if (a.reward.gems) addGems(a.reward.gems); out.push(a); }
  }
  if (out.length) save();
  return out;
}
export const achievementsDone = () => { ensure(); return state.achievements.unlocked.length; };

// ---------- F5 UI: 7-node streak strip, shield sheet, welcome-back modal (CSS in css/daily.css) ----------
const GEM = '<svg viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg"><path d="M9 4h14l6 8-13 17L3 12z" fill="#22d3ee" stroke="#0e7490" stroke-width="2.2" stroke-linejoin="round"/><path d="M3 12h26M9 4l4 8 3-8 3 8 4-8M13 12l3 17 3-17" fill="none" stroke="#0e7490" stroke-width="1.6" opacity=".8"/><path d="M10 6l3 5" stroke="#fff" stroke-width="2.4" stroke-linecap="round" opacity=".8"/></svg>';
const S = {
  streak: { en: 'Daily streak', ar: 'سلسلة الأيام' },
  day: { en: 'Day', ar: 'اليوم' },
  claim: { en: 'Claim', ar: 'استلم' },
  claimed: { en: 'Claimed today', ar: 'استلمت اليوم' },
  tomorrow: { en: 'tomorrow', ar: 'بكرة' },
  continueFrom: { en: 'Continue from day', ar: 'كمّل من اليوم' },
  kept: { en: 'Luis kept your streak · day', ar: 'لويس حفظ سلسلتك · اليوم' },
  shieldSaved: { en: 'Shield saved a day', ar: 'الدرع حفظ يومًا' },
  shield: { en: 'Streak shield', ar: 'درع السلسلة' },
  shieldHint: { en: 'Covers one missed day (every other missed day steps you back one node — never a full reset). One free shield per week: watch an ad or pay 10 gems.', ar: 'يغطّي يومًا واحدًا فائتًا (كل يوم فائت آخر يرجّعك عقدة واحدة — ما فيه تصفير أبدًا). درع مجاني كل أسبوع: شاهد إعلانًا أو ادفع 10 جواهر.' },
  // same hint for builds without rewarded ads (iOS v1): the "watch an ad" path is not offered there
  shieldHintNoAds: { en: 'Covers one missed day (every other missed day steps you back one node — never a full reset). One shield per week for 10 gems.', ar: 'يغطّي يومًا واحدًا فائتًا (كل يوم فائت آخر يرجّعك عقدة واحدة — ما فيه تصفير أبدًا). درع واحد كل أسبوع مقابل 10 جواهر.' },
  shieldGot: { en: 'Shield ready', ar: 'الدرع جاهز' },
  shieldWeekUsed: { en: 'Next free shield on Monday', ar: 'الدرع المجاني القادم يوم الاثنين' },
  shields: { en: 'shields', ar: 'دروع' },
  gift: { en: 'gift', ar: 'هدية' },
  welcome: { en: 'Welcome back!', ar: 'نوّرت من جديد!' },
  welcomeBody: (days, day) => ({ en: `You were away ${days} days — the block missed you. Luis kept your streak at day ${day}: full Reserve, 300 coins and a gift to get you going.`, ar: `غبت ${days} يوم — الحي اشتاق لك. لويس حفظ سلسلتك عند اليوم ${day}: طاقة احتياطية كاملة، 300 عملة وهدية عشان ترجع بقوة.` }),
};
const wearChoice = (choice, item) => { if (choice === 'wear') { equip(item.cat, item.id); if (item.cat === 'top' || item.cat === 'bottom') equip('outfit', null); } };
const walletChanged = () => document.dispatchEvent(new CustomEvent('mr:wallet'));
const rewardIcon = r => r.gift ? I.gift(r.gift === 'epic') : r.gems ? GEM : I.coin();
const rewardText = r => r.gift ? name(S.gift) : r.gems ? `${r.gems}` : `${r.coins}`;

// streakStrip(app, { onChange }) → HTMLElement: Luis-fronted header, 7-node strip of the current lane (today pulsing,
// claimed nodes ticked, already-paid nodes after a step-back shown as coin-only), shield chip (count, dashed when this
// week's free shield is still available), claim button. Once today is claimed it becomes a single 32 px chip
// (class .collapsed: "✓ Day 5 · tomorrow 250") that expands to the full strip on tap (class .peek) and collapses again
// on a tap of its header. Fires document 'mr:wallet' after any pay-out; repaints on document 'mr:streak'.
export function streakStrip(app, opts = {}) {
  const wrap = el('div', { class: 'streak-strip' });
  const luis = npcByName('Luis');
  let busy = false, expanded = false;
  const paint = () => {
    wrap.innerHTML = '';
    const st = streakStatus();
    const claimedToday = !st.claimable;
    const collapsed = claimedToday && !expanded;
    wrap.classList.toggle('collapsed', collapsed);
    wrap.classList.toggle('peek', claimedToday && expanded);
    wrap.onclick = null;
    const tomorrow = rewardText(rewardForDay(st.day + 1));
    if (collapsed) {                                                       // the tick: one chip, tap to peek at the lane
      wrap.setAttribute('role', 'button'); wrap.setAttribute('title', name(S.streak));
      wrap.append(el('span', { class: 'sk-tick', html: I.check() }), el('span', { class: 'sk-chip-t' }, `${name(S.day)} ${st.day} · ${name(S.tomorrow)} ${tomorrow}`));
      wrap.onclick = () => { sfx.tap(); expanded = true; paint(); };
      return;
    }
    wrap.removeAttribute('role'); wrap.removeAttribute('title');
    const win0 = st.node <= 7 ? 1 : 8;                                   // the 7-node window of the lane the player is on
    const headT = el('div', { class: 'sk-t' });
    headT.append(el('span', {}, `${name(S.streak)} · ${name(S.day)} ${st.day}${st.loop ? ` (+${Math.round(st.loop * STREAK_LOOP_BONUS * 100)}%)` : ''}`));
    const sub = claimedToday ? { cls: '', txt: `${name(S.claimed)} ✓ · ${name(S.tomorrow)}: ${tomorrow}` }
      : st.shielded ? { cls: 'shield', txt: `🛡 ${name(S.shieldSaved)}${st.back ? ` · ${name(S.continueFrom)} ${st.day}` : ''}` }
      : st.restored ? { cls: 'shield', txt: `${name(S.kept)} ${st.day}` }
      : st.missed || st.repeat ? { cls: 'missed', txt: `${name(S.continueFrom)} ${st.day}` }
      : { cls: '', txt: name(lineFor(luis, 'hi', { hero: state.profile && state.profile.name })) };
    headT.append(el('small', { class: sub.cls }, sub.txt));
    const shieldBtn = el('button', { class: 'sk-shield' + (st.canEarnShield ? ' earn' : ''), title: name(S.shield), onclick: e => { e.stopPropagation(); sfx.tap(); shieldSheet(paint); } }, `🛡 ${st.shields}${st.canEarnShield ? ' +' : ''}`);
    const head = el('div', { class: 'sk-head' }, [el('div', { class: 'sk-face', html: portrait(luis) }), headT, shieldBtn]);
    // inner taps stop here: paint() may have just turned `wrap` into the chip, whose own click handler would re-expand it
    if (claimedToday) head.onclick = e => { e.stopPropagation(); sfx.tap(); expanded = false; paint(); };   // peek → back to the tick
    wrap.append(head);
    const nodes = el('div', { class: 'sk-nodes' });
    for (let i = 0; i < 7; i++) {
      const node = win0 + i, day = st.loop * STREAK_LEN + node;
      const isToday = node === st.node;
      const claimed = claimedToday ? node <= st.node : node < st.node;
      const r = (isToday && !claimedToday) ? st.reward : (!claimed && day <= st.paidMax) ? rewardForDay(day) : streakReward(day);
      const n = el('div', { class: 'sk-node' + (claimed ? ' claimed' : '') + (isToday ? ' today' + (claimedToday ? ' done' : '') : '') + (r.gift ? ' big' : '') + (r.repeat ? ' repeat' : ''), title: `${name(S.day)} ${node}` }, [
        el('span', { class: 'd' }, String(node)), el('span', { class: 'ic', html: rewardIcon(r) }), el('span', { class: 'v' }, rewardText(r)),
      ]);
      if (isToday && !claimedToday) n.onclick = e => { e.stopPropagation(); claim(n); };
      nodes.append(n);
    }
    wrap.append(nodes);
    if (!claimedToday) wrap.append(el('button', { class: 'btn gold sm sk-claim', onclick: e => { e.stopPropagation(); claim(e.currentTarget); } }, [el('span', { html: I.gift(true) }), `${name(S.claim)} · ${name(S.day)} ${st.day}`]));
  };
  const onStreak = () => { if (!wrap.isConnected) { document.removeEventListener('mr:streak', onStreak); return; } paint(); };
  document.addEventListener('mr:streak', onStreak);
  async function claim(fromEl) {
    if (busy) return; busy = true;
    const st = claimStreak(); if (!st) { busy = false; return; }
    sfx.coin(); haptic([15, 20, 15]);
    claimDaily(); addReserve(10);                                          // the daily gift's +10 Reserve (research 7.2) stays
    const r = fromEl.getBoundingClientRect(), a = $('#app').getBoundingClientRect();
    fx.coins(r.left + r.width / 2 - a.left, r.top + r.height / 2 - a.top, 14);
    toast(`${name(S.day)} ${st.day}: ${st.reward.coins ? '+' + st.reward.coins + ' 🪙' : ''}${st.reward.gems ? ' +' + st.reward.gems + ' 💎' : ''}${st.item ? ' 🎁' : ''} · +10 ⚡`, { icon: I.gift(true), ms: 2800 });
    walletChanged(); paint();
    const p = state.profile;
    if (st.item && p) wearChoice(await giftFlow({ item: st.item, golden: st.reward.gift === 'epic', dup: false, dupCoins: 0, gender: p.gender, skin: p.skin, equipped: state.equipped, title: `${name(S.streak)} · ${name(S.day)} ${st.day}` }), st.item);
    for (const ach of checkAchievements()) toast(`🏆 ${name(ach.text)}`, { icon: I.trophy(), ms: 3000 });
    if (opts.onChange) opts.onChange(st);
    busy = false;
  }
  paint();
  return wrap;
}
// Shield sheet: count + "watch ad" (rewarded-ad path) / "10 gems" when this week's free shield is still available.
export function shieldSheet(onDone) {
  const info = shieldInfo();
  const body = el('div', { class: 'rescue' });
  body.append(el('div', { class: 'win-story' }, name(adsAvailable() ? S.shieldHint : S.shieldHintNoAds)));
  body.append(el('div', { class: 'shield-count' }, `🛡 ${info.shields} ${name(S.shields)}`));
  const m = modal({ title: `🛡 ${name(S.shield)}`, body, closable: true });
  if (!info.canEarn) { body.append(el('div', { class: 'eta' }, name(S.shieldWeekUsed))); return m; }
  const got = () => { sfx.goal(); toast(`🛡 ${name(S.shieldGot)}`, { icon: I.check() }); walletChanged(); if (onDone) onDone(); };
  if (adsAvailable()) body.append(el('button', { class: 'btn ghost', onclick: async () => { m.close(); const r = await showRewardedAd(); if (r.ok && earnShield('ad')) got(); } }, [el('span', { html: I.play() }), t('watchAd')]));
  body.append(el('button', { class: 'btn purple', onclick: () => { if (!earnShield('gems')) { sfx.error(); toast(t('notEnoughGems'), { icon: GEM }); return; } m.close(); got(); } }, [el('span', { html: GEM }), `${SHIELD_GEMS}`]));
  return m;
}
// Welcome-back flow for the hub (modal priority: race finish → welcome back → home chest → starter offer).
// Always stamps state.lastSeen; resolves true when a pack was shown and claimed.
export function welcomeBackFlow(app) {
  ensure();                                                                     // state.streak exists even on an old / odd save
  if (!welcomeBackDue()) { touchLastSeen(); return Promise.resolve(false); }
  const days = awayDays(), luis = npcByName('Luis'), p = state.profile;
  const streakDay = Math.max(1, (state.streak && state.streak.count) || 1);
  return new Promise(resolve => {
    const body = el('div', { class: 'wb' });
    body.append(el('div', { class: 'wb-face', html: portrait(luis) }));
    body.append(el('div', { class: 'wb-say' }, name(lineFor(luis, 'hi', { hero: p && p.name }))));
    body.append(el('div', { class: 'win-story' }, name(S.welcomeBody(days, streakDay))));
    body.append(el('div', { class: 'rewards', html: `<div class="reward reserve-r">${I.bolt()}<span>${RESERVE_CAP}</span></div><div class="reward">${I.coin()}<span>+300</span></div><div class="reward">${I.gift()}<span>1</span></div>` }));
    modal({ title: `👋 ${name(S.welcome)}`, body, actions: [{ label: t('claim'), cls: 'gold', onClick: async () => {
      const r = claimWelcomeBack(); sfx.coin(); haptic([15, 20, 15]); fx.confetti(60); walletChanged();
      if (r.item && p) wearChoice(await giftFlow({ item: r.item, golden: false, dup: false, dupCoins: 0, gender: p.gender, skin: p.skin, equipped: state.equipped, title: name(S.welcome) }), r.item);
      resolve(true);
    } }] });
  });
}
