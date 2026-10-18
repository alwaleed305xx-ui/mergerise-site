// Stage definitions v3 (docs/merge-core-research.md §7): orders board sorted easy → hard with a crate on the
// medium order and an optional tip order, guaranteed first merge, clutter boards from stage 8, sawtooth
// difficulty (breather every 4th stage, golden peak every 5th), generators with charges + cooldown + rare line,
// locked items, fog (some hiding crates), bubbles, two optional star quests. Hand-tuned 1-3, generated afterwards.
import { rng, clamp, todayKey } from './util.js';
import { MAX_LEVEL } from './items.js';
import { state, tierFor } from './store.js';
import { hostFor, CAST } from './customers.js';
export { MAX_LEVEL };

// Deterministic 32-bit seed from any string (FNV-1a) — e.g. seedFrom(todayKey()) for the Daily Hustle.
export function seedFrom(key) {
  let h = 2166136261; const s = String(key);
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  return h >>> 0;
}

export const COLS = 7, ROWS = 8;
const SPAWN_VALUE = 1.31;                 // expected level-1 equivalents per generator tap (75% L1, 22% L2, 3% L3)
const MAIN_YIELD = 1.16;                  // same, after the rare drop line (8%) and energy drops (~8%) take their share
const CHAIN_UNLOCK = { food: 1, money: 3, fashion: 5, home: 8, tech: 12 };
const CHAIN_ORDER = ['food', 'money', 'fashion', 'home', 'tech'];
const CUSTOMERS = [
  ['Mia', '#f472b6'], ['Jay', '#60a5fa'], ['Luis', '#f59e0b'], ['Ava', '#a78bfa'], ['Noah', '#34d399'], ['Zoe', '#fb7185'],
  ['Omar', '#38bdf8'], ['Lily', '#fbbf24'], ['Max', '#4ade80'], ['Nina', '#c084fc'], ['Leo', '#fb923c'], ['Sofia', '#2dd4bf'],
];
const QUEST_TEXT = {
  merge5: { en: 'Merge 5 at once', ar: 'ادمج ٥ دفعة واحدة' },
  discover: n => ({ en: `Discover ${n} new item${n > 1 ? 's' : ''}`, ar: `اكتشف ${n} عنصر جديد` }),
  fog: n => ({ en: `Clear ${n} fog tile${n > 1 ? 's' : ''}`, ar: `اكشف ${n} خلايا ضباب` }),
  unlock: n => ({ en: `Free ${n} locked item${n > 1 ? 's' : ''}`, ar: `حرّر ${n} عناصر مقفلة` }),
  bubble: { en: 'Pop a bubble', ar: 'فرقع فقاعة' },
  crate: n => ({ en: `Open ${n} crate drops`, ar: `افتح ${n} من الصندوق` }),
  energyLeft: n => ({ en: `Finish with ${n}+ energy`, ar: `أنهِ وعندك ${n}+ طاقة` }),
};

const itemCost = it => it.count * Math.pow(2, it.lvl - 1);
const orderCost = o => o.items.reduce((a, it) => a + itemCost(it), 0);
const cost = orders => orders.filter(o => !o.optional).reduce((a, o) => a + orderCost(o), 0);
const placedValue = items => items.reduce((a, it) => a + Math.pow(2, it.lvl - 1), 0);
const TIER_RANK = { easy: 0, medium: 1, hard: 2 };

// Energy budget is computed PER CHAIN: pre-placed and locked items only pay for orders of their own chain.
const chainCost = (orders, ch) => orders.filter(o => !o.optional).reduce((a, o) => a + o.items.filter(i => i.chain === ch).reduce((x, i) => x + itemCost(i), 0), 0);
const chainCredit = (ch, free, locked, fogItems) => placedValue(free.filter(i => i.chain === ch)) + placedValue(locked.filter(i => i.chain === ch)) * 0.5 + placedValue(fogItems.filter(i => !i.crate && i.chain === ch)) * 0.8;
function budget(orders, free, locked, fogItems, factor, crateHelp) {
  const chains = [...new Set(orders.filter(o => !o.optional).flatMap(o => o.items.map(i => i.chain)))];
  let need = 0, total = 0;
  for (const ch of chains) { const c = chainCost(orders, ch); total += c; need += Math.max(c * 0.4, c - chainCredit(ch, free, locked, fogItems)); }
  need = Math.max(total * 0.3, 2, need - crateHelp);
  return Math.ceil((need / MAIN_YIELD) * factor) + 4;
}
function grid(openCols, openRows) {
  const c0 = Math.floor((COLS - openCols) / 2), r0 = Math.floor((ROWS - openRows) / 2);
  const cells = [];
  for (let r = 0; r < ROWS; r++) { cells.push([]); for (let c = 0; c < COLS; c++) cells[r].push(c >= c0 && c < c0 + openCols && r >= r0 && r < r0 + openRows ? null : 'wall'); }
  return cells;
}
const customer = i => { const [name, color] = CUSTOMERS[i % CUSTOMERS.length]; return { name, color, initial: name[0] }; };
const customerNamed = nm => { const c = CUSTOMERS.find(x => x[0] === nm) || CUSTOMERS[0]; return { name: c[0], color: c[1], initial: c[0][0] }; };
// F6c cast per home: 80 % of a stage's orders come from the home tier's cast of 4 (customers.CAST), 20 % are drop-ins
// from the union of earlier casts (tier 0 has no earlier cast → always its own four). ONE R() call per pick, so every
// stage's seed sequence (layout, fog, quests) stays byte for byte what the balance bot measured.
const castPick = (R, tier) => {
  const own = CAST[Math.min(Math.max(0, tier | 0), CAST.length - 1)] || CAST[0];
  const earlier = tier > 0 ? [...new Set(CAST.slice(0, tier).flat())].filter(nm => !own.includes(nm)) : [];
  const x = R();
  if (earlier.length && x < 0.2) return customerNamed(earlier[Math.min(earlier.length - 1, Math.floor((x / 0.2) * earlier.length))]);
  const u = earlier.length ? (x - 0.2) / 0.8 : x;
  return customerNamed(own[Math.min(own.length - 1, Math.floor(u * own.length))]);
};
const reward = (o, tier) => ({ coins: Math.round(orderCost(o) * 6 + (tier === 'hard' ? 60 : tier === 'medium' ? 25 : 10)), score: Math.round(orderCost(o) * 10) });
// ci = CUSTOMERS index (hand-tuned stages) or a ready customer object (castPick)
const order = (items, tier, ci) => { const o = { customer: typeof ci === 'number' ? customer(ci) : ci, items, tier }; o.reward = reward(o, tier); return o; };
const gen = (r, c, chain, charges, cooldown, extra = {}) => ({ r, c, chain, charges, cooldown, ...extra });
const quest = (type, target, extra = {}) => ({ type, target, ...extra, text: type === 'make' ? null : (typeof QUEST_TEXT[type] === 'function' ? QUEST_TEXT[type](target) : QUEST_TEXT[type]) });
// crate pools: weighted toward L1 of the given chains, a few L2, a spark of energy
const cratePool = (chains, lvls = [1, 2], energy = 0.15) => [...chains.flatMap(ch => lvls.map((l, i) => ({ chain: ch, lvl: l, w: i === 0 ? 3 : 1 }))), ...(energy ? [{ chain: 'energy', lvl: 1, w: Math.round(energy * 10) }] : [])];

const HAND = {
  1: () => ({ cells: grid(5, 5), gens: [gen(4, 3, 'food', 8, 8000)], items: [{ r: 3, c: 2, chain: 'food', lvl: 1 }, { r: 3, c: 4, chain: 'food', lvl: 1 }],
    orders: [order([{ chain: 'food', lvl: 3, count: 1 }], 'easy', 0)], quests: [quest('energyLeft', 3), quest('make', 1, { chain: 'food', lvl: 3 })], charges: 8, tutorial: true }),
  2: () => ({ cells: grid(5, 6), gens: [gen(4, 3, 'food', 8, 9000)], items: [{ r: 2, c: 2, chain: 'food', lvl: 2 }, { r: 5, c: 4, chain: 'food', lvl: 1 }, { r: 2, c: 4, chain: 'food', lvl: 1 }, { r: 3, c: 1, chain: 'food', lvl: 1 }],
    orders: [order([{ chain: 'food', lvl: 2, count: 2 }], 'easy', 1), { ...order([{ chain: 'food', lvl: 4, count: 1 }], 'medium', 2), crate: { drops: 4, pool: cratePool(['food']) } }], quests: [quest('discover', 1), quest('energyLeft', 2)], charges: 14 }),
  3: () => ({ cells: grid(6, 6), gens: [gen(4, 2, 'food', 7, 10000, { rare: { chain: 'money', p: 0.1 } }), gen(4, 4, 'money', 6, 12000)], items: [{ r: 2, c: 2, chain: 'food', lvl: 2 }, { r: 6, c: 3, chain: 'money', lvl: 1 }, { r: 2, c: 4, chain: 'money', lvl: 1 }, { r: 5, c: 2, chain: 'money', lvl: 1 }],
    locked: [{ r: 6, c: 1, chain: 'food', lvl: 3 }], orders: [order([{ chain: 'money', lvl: 3, count: 1 }], 'easy', 7), { ...order([{ chain: 'food', lvl: 4, count: 1 }], 'medium', 0), crate: { drops: 4, pool: cratePool(['food', 'money']) } }], quests: [quest('unlock', 1), quest('merge5', 1)], charges: 16, bubble: 0.12 }),
};

// generate(n, seed, opts): `seed` undefined keeps the stage's own seed (today's behaviour byte for byte);
// opts.chain = host chain (every order's main item), opts.host = customer who posts every order,
// opts.golden overrides the n % 5 golden flag, opts.breather overrides the n % 4 breather (the Daily Hustle passes
// false for both). The R() call sequence is unchanged when opts is empty.
function generate(n, seed, opts = {}) {
  const R = rng(seed === undefined ? n * 7919 + 13 : seed);
  const avail = CHAIN_ORDER.filter(k => CHAIN_UNLOCK[k] <= n);
  const golden = opts.golden !== undefined ? !!opts.golden : n % 5 === 0;
  const breather = opts.breather !== undefined ? !!opts.breather : (n % 4 === 0 && !golden);   // sawtooth: an easy stage after every three
  const homeTier = tierFor(n);                        // the home the player lives in while playing stage n (F6c cast)
  let nOrders = n < 5 ? 2 : n < 12 ? 3 : 3 + (R() < 0.35 ? 1 : 0);
  if (breather) nOrders = Math.max(2, nOrders - 1);
  const nGens = Math.min(avail.length, n < 10 ? 2 : 3);
  const pool = [...avail];
  const hostChain = opts.chain && avail.includes(opts.chain) ? opts.chain : null;
  const gensChains = [hostChain ? pool.splice(pool.indexOf(hostChain), 1)[0] : pool.pop()];
  while (gensChains.length < nGens && pool.length) gensChains.push(pool.splice(Math.floor(R() * pool.length), 1)[0]);
  const hostCustomer = opts.host ? { name: opts.host.name, color: opts.host.color || '#38bdf8', initial: opts.host.name[0] } : null;
  // orders: easy / medium / hard mix (hard = two different items), sorted easy → hard
  const baseL = Math.min(5, 3 + Math.floor(n / 6));
  const orders = [];
  const tiers = nOrders === 2 ? ['easy', 'medium'] : nOrders === 3 ? ['easy', 'medium', 'hard'] : ['easy', 'medium', 'medium', 'hard'];
  tiers.forEach((tier, i) => {
    const chain = hostChain || gensChains[i % gensChains.length];
    const lvl = tier === 'easy' ? Math.max(2, baseL - 1) : tier === 'medium' ? baseL : Math.min(6, baseL + (golden ? 1 : 0) + (R() < 0.3 ? 1 : 0));
    const items = [{ chain, lvl, count: tier === 'easy' ? 1 + Math.floor(R() * 2) : 1 }];
    if (tier === 'hard' && gensChains.length > 1) { const other = hostChain ? (gensChains.find(x => x !== hostChain) || gensChains[(i + 1) % gensChains.length]) : gensChains[(i + 1) % gensChains.length]; items.push({ chain: other, lvl: Math.max(2, lvl - 2 + Math.floor(R() * 2)), count: 1 }); }
    else if (tier === 'medium' && R() < 0.4) items[0].count = 2;
    const o = order(items, tier, castPick(R, homeTier));
    if (hostCustomer) o.customer = { ...hostCustomer };                  // Daily Hustle: the host posts every order
    orders.push(o);
  });
  const cap = 20 + n * 1.1 + (golden ? 8 : 0);
  while (cost(orders) > cap) {
    const o = orders.slice().sort((a, b) => orderCost(b) - orderCost(a))[0];
    const it = o.items.slice().sort((a, b) => itemCost(b) - itemCost(a))[0];
    if (it.count > 1) it.count--; else if (it.lvl > 2) it.lvl--; else break;
    o.reward = reward(o, o.tier);
  }
  orders.sort((a, b) => TIER_RANK[a.tier] - TIER_RANK[b.tier]);
  const hardChains = [...new Set(orders.filter(o => o.tier !== 'easy').flatMap(o => o.items.map(i => i.chain)))];
  const med = orders.find(o => o.tier === 'medium'); if (med) med.crate = { drops: 4, pool: cratePool(hardChains.length ? hardChains : gensChains) };
  // generators: charges + cooldown tighten slowly; one rare line each; an auto producer sometimes from stage 10
  const gpos = nGens === 1 ? [[4, 3]] : nGens === 2 ? [[4, 2], [4, 4]] : [[3, 1], [3, 5], [6, 3]];
  const charges = n < 10 ? 10 : n < 20 ? 9 : 8;
  const cooldown = Math.min(14000, 6000 + n * 200);
  const gens = gensChains.map((chain, i) => {
    const rareChain = gensChains.find(x => x !== chain) || null;
    return gen(gpos[i][0], gpos[i][1], chain, charges, cooldown, rareChain ? { rare: { chain: rareChain, p: 0.08 } } : {});
  });
  if (n >= 10 && R() < 0.4) {
    const spot = [[0, 3], [7, 3], [0, 0], [7, 6]][Math.floor(R() * 4)];
    gens.push(gen(spot[0], spot[1], gensChains[0], 3, 14000, { auto: true, label: 'AUTO' }));
  }
  // board + fog
  const cells = grid(7, 8);
  const fogCount = n < 10 ? 2 + Math.floor(R() * 3) : 4 + Math.floor(R() * 5);
  const edge = [];
  for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) if ((r === 0 || r === ROWS - 1 || c === 0 || c === COLS - 1) && !gens.some(g => g.c === c && g.r === r)) edge.push([r, c]);
  const fogCells = [];
  for (let i = 0; i < fogCount && edge.length; i++) { const [r, c] = edge.splice(Math.floor(R() * edge.length), 1)[0]; cells[r][c] = 'fog'; fogCells.push([r, c]); }
  // open spots
  const spots = [];
  for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) if (cells[r][c] === null && !gens.some(g => g.c === c && g.r === r)) spots.push([r, c]);
  const openCells = spots.length + gens.length;
  const take = () => spots.splice(Math.floor(R() * spots.length), 1)[0];
  const takeNear = (r0, c0) => { spots.sort((a, b) => (Math.abs(a[0] - r0) + Math.abs(a[1] - c0)) - (Math.abs(b[0] - r0) + Math.abs(b[1] - c0))); return spots.shift(); };
  const orderChains = orders.flatMap(o => o.items);
  const easy = orders[0];
  const free = [];
  // guaranteed instant first merge: a close pair of the easy order's chain, plus enough easy-chain value
  const easyIt = easy.items[0];
  const pairLvl = Math.max(1, Math.min(2, easyIt.lvl - 1));
  const p1 = take(); if (p1) free.push({ r: p1[0], c: p1[1], chain: easyIt.chain, lvl: pairLvl });
  const p2 = p1 && takeNear(p1[0], p1[1]); if (p2) free.push({ r: p2[0], c: p2[1], chain: easyIt.chain, lvl: pairLvl });
  if (breather) { const b1 = take(); const b2 = b1 && takeNear(b1[0], b1[1]); if (b1 && b2) { free.push({ r: b1[0], c: b1[1], chain: easyIt.chain, lvl: pairLvl }, { r: b2[0], c: b2[1], chain: easyIt.chain, lvl: pairLvl }); } }
  while (placedValue(free.filter(f => f.chain === easyIt.chain)) < orderCost(easy) * 0.5 && spots.length) { const s = take(); free.push({ r: s[0], c: s[1], chain: easyIt.chain, lvl: 1 }); }
  const nFree = 2 + Math.floor(R() * 3);
  for (let i = 0; i < nFree && spots.length; i++) { const [r, c] = take(); const g = orderChains[Math.floor(R() * orderChains.length)]; free.push({ r, c, chain: g.chain, lvl: 1 + Math.floor(R() * Math.min(3, g.lvl - 1)) }); }
  // clutter from stage 8: the board opens 30-45 % full of low items of the order chains (counted in the budget)
  if (n >= 8) {
    const target = Math.round(openCells * (0.30 + Math.min(0.15, (n - 8) * 0.01)));
    while (free.length < target && spots.length) { const [r, c] = take(); const g = orderChains[Math.floor(R() * orderChains.length)]; free.push({ r, c, chain: g.chain, lvl: R() < 0.7 ? 1 : 2 }); }
  }
  const junkChain = CHAIN_ORDER.find(k => !orderChains.some(i => i.chain === k) && CHAIN_UNLOCK[k] <= Math.max(n, 3)) || null;
  const junk = [];
  if (n >= 15 && junkChain) for (let i = 0; i < 1 + Math.floor(R() * 2) && spots.length; i++) { const [r, c] = take(); junk.push({ r, c, chain: junkChain, lvl: 1 }); }

  const locked = [];
  const nLocked = n < 4 ? 0 : Math.min(5, 1 + Math.floor(n / 6) + (R() < 0.5 ? 1 : 0));
  for (let i = 0; i < nLocked && spots.length; i++) { const [r, c] = take(); const g = orderChains[Math.floor(R() * orderChains.length)]; locked.push({ r, c, chain: g.chain, lvl: Math.max(2, Math.min(g.lvl - 1, 3, 2 + Math.floor(R() * 2))) }); }
  const fogItems = fogCells.filter(() => R() < 0.6).map(([r, c]) => {
    const g = orderChains[Math.floor(R() * orderChains.length)];
    const x = R();
    if (x < 0.2) return { r, c, crate: true, drops: 4, pool: cratePool([g.chain]) };
    if (x < 0.4) return { r, c, chain: 'energy', lvl: 1 + Math.floor(R() * 3) };
    return { r, c, chain: g.chain, lvl: 1 + Math.floor(R() * 2) };
  });
  // free progress is capped: pre-placed + locked + fog value per chain never exceeds 60 % of what the orders
  // demand of it, so every stage still needs the generators; surplus clutter turns into junk (sell fodder)
  for (const ch of new Set(orderChains.map(i => i.chain))) {
    const costC = chainCost(orders, ch);
    let guard = 40;
    while (guard-- > 0 && chainCredit(ch, free, locked, fogItems) > costC * 0.6) {
      const fi = fogItems.findIndex(f => !f.crate && f.chain === ch);
      if (fi >= 0) { fogItems.splice(fi, 1); continue; }
      const mine = free.filter(f => f.chain === ch);
      if (mine.length <= 2) break;
      const victim = mine.sort((x, y) => y.lvl - x.lvl)[0];
      free.splice(free.indexOf(victim), 1);
      if (junkChain && n >= 8) junk.push({ r: victim.r, c: victim.c, chain: junkChain, lvl: 1 });
    }
  }
  const crates = [];
  if (golden) { const s = take(); if (s) crates.push({ r: s[0], c: s[1], drops: 6, golden: true, pool: cratePool(gensChains, [2, 3], 0.1) }); }
  // quests (optional stars, 3 stars max)
  const qpool = [];
  if (fogCells.length) qpool.push(quest('fog', Math.min(fogCells.length, 2 + Math.floor(R() * 2))));
  if (locked.length) qpool.push(quest('unlock', Math.min(locked.length, 1 + Math.floor(R() * 2))));
  qpool.push(quest('merge5', 1));
  qpool.push(quest('discover', 1 + Math.floor(R() * 2)));
  if (n >= 3) qpool.push(quest('bubble', 1));
  if (med || crates.length) qpool.push(quest('crate', 4));
  const top = orderChains.slice().sort((a, b) => b.lvl - a.lvl)[0];
  qpool.push(quest('make', 1, { chain: top.chain, lvl: Math.min(MAX_LEVEL, top.lvl + 1) }));
  const quests = [qpool.splice(Math.floor(R() * qpool.length), 1)[0]];
  let factor = n < 6 ? 1.45 : n < 15 ? 1.42 : n < 30 ? 1.32 : 1.26;   // King's rule: bands that tested under 80 % pass got their factor raised
  if (breather) factor += 0.15;
  const crateHelp = (med ? 4 : 0) + fogItems.filter(f => f.crate).length * 3 + (golden ? 8 : 0);
  // per-stage designer bonus for generated layouts that the balance bot passed under 80 % (never cut, only add)
  const STAGE_BONUS = { 6: 2, 9: 5, 17: 2, 34: 6, 36: 8 };
  const energyBudget = budget(orders, free, locked, fogItems, factor, crateHelp) + (golden ? 3 : 0) + (STAGE_BONUS[n] || 0);
  if (R() < 0.5 || !qpool.length) quests.push(quest('energyLeft', Math.max(2, Math.round(energyBudget * 0.2))));
  else quests.push(qpool.splice(Math.floor(R() * qpool.length), 1)[0]);
  return { cells, gens, items: [...free, ...junk], locked, fogItems, crates, orders, quests: quests.slice(0, 2), charges: energyBudget, breather, energy: n >= 5 ? Math.min(0.14, 0.08 + n * 0.001) : 0, bubble: n >= 3 ? 0.12 : 0 };
}

export function getLevel(n) {
  const base = HAND[n] ? HAND[n]() : generate(n);
  return { n, cols: COLS, rows: ROWS, golden: n % 5 === 0, breather: false, fogItems: [], locked: [], crates: [], energy: 0, bubble: 0, tutorial: false, quests: [], ...base, chains: [...new Set([...base.gens.map(g => g.chain), ...base.orders.flatMap(o => o.items.map(i => i.chain))])] };
}

// ---------- Daily Hustle (F4) ----------
// Today's host (weekday customer), its chain preference resolved against CHAIN_UNLOCK at n = clamp(stage, 5, 40),
// and the date; cheap enough for the hub card (no board generation).
export const DAILY_TRIES = 3;
export function dailyInfo(d = new Date()) {
  const n = clamp(state.stage || 1, 5, 40);
  const host = hostFor(d);
  const chain = host.chains.find(k => CHAIN_UNLOCK[k] <= n) || 'food';
  return { n, date: todayKey(), host: { name: host.name, chains: host.chains, title: host.title, lines: host.lines }, chain, tries: DAILY_TRIES };
}
// dailyLevel() = generate(clamp(stage, 5, 40), seedFrom(todayKey())) with every order posted by the host from the
// host's chain, no golden flag and NO breather (the challenge is never the easy sawtooth stage), flagged
// { daily: true, host, date, tries }.
export function dailyLevel() {
  const info = dailyInfo();
  const { n } = info;
  const base = generate(n, seedFrom(info.date), { host: { name: info.host.name }, chain: info.chain, golden: false, breather: false });
  const level = { n, cols: COLS, rows: ROWS, golden: false, breather: false, fogItems: [], locked: [], crates: [], energy: 0, bubble: 0, tutorial: false, quests: [], ...base, chains: [...new Set([...base.gens.map(g => g.chain), ...base.orders.flatMap(o => o.items.map(i => i.chain))])] };
  const hostColor = (CUSTOMERS.find(c => c[0] === info.host.name) || CUSTOMERS[0])[1];
  for (const o of level.orders) o.customer = { name: info.host.name, color: hostColor, initial: info.host.name[0] };
  return { ...level, daily: true, date: info.date, host: { ...info.host, color: hostColor, chain: info.chain }, tries: info.tries };
}
// Optional tip order after the easy order: 1-2 items <= L3 of a chain already on the board; never blocks the win.
export function tipOrderFor(level, boardItems, rnd = Math.random) {
  const cand = boardItems.filter(it => it.lvl >= 1 && it.lvl <= 3 && it.chain !== 'energy');
  if (!cand.length) return null;
  const pick = cand[Math.floor(rnd() * cand.length)];
  const lvl = Math.min(3, pick.lvl + (rnd() < 0.5 ? 1 : 0));
  const cust = castPick(rnd, tierFor((level && level.n) || 1));         // tips follow the home cast too (F6c)
  // Daily Hustle: the host posts every order, tips included
  const o = { customer: level && level.daily && level.host ? { name: level.host.name, color: level.host.color || cust.color, initial: level.host.name[0] } : cust, items: [{ chain: pick.chain, lvl, count: 1 + (rnd() < 0.3 ? 1 : 0) }], tier: 'tip', optional: true };
  o.reward = { coins: orderCost(o) * 4 + 10, score: orderCost(o) * 5 };
  return o;
}
export function rewardFor(level, stars, score) {
  return 40 + level.n * 10 + stars * 30 + Math.round(score / 30) + (level.golden ? 150 : 0);
}
