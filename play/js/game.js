// Merge board engine v3 (pure logic, no DOM). Built on docs/merge-core-research.md:
// energy is a tap tax (merging is free), generators carry charges + cooldown with a main/rare drop line,
// orders are delivered by hand (tip orders are optional), merge-5 pays two results, locked items are freed by
// merging onto them, crates drop free items per tap and merge together, bubbles offer one timed duplicate,
// items can be sold (with undo) or parked in storage, new items are discovered.
import { uid } from './util.js';
import { MAX_LEVEL, tipOrderFor } from './levels.js';

export const ENERGY_MAX = 3;
const ENERGY_GAIN = [1, 2, 5];
const SPAWN_ROLL = [[0.75, 1], [0.97, 2], [1, 3]];
export const SELL_VALUE = [2, 5, 12, 25, 50, 100, 200];
export const BUBBLE_MS = 7000;
export const mergePoints = (lvl, combo) => Math.round(5 * Math.pow(2, lvl) * Math.min(3, 1 + 0.25 * (combo - 1)));
const key = (chain, lvl) => chain + ':' + lvl;

export class Game {
  constructor(level, opts = {}) {
    this.level = level; this.rnd = opts.rnd || Math.random; this.now = opts.now || (() => Date.now());
    this.discovered = opts.discovered || new Set();
    this.perks = Object.assign({ genCharges: {}, cooldownMul: 1, orderCoinsMul: 1, crateDrops: 0, bubbleMul: 1, bubbleMs: 0, startEnergy: 0, deliverEnergy: 0, petFinder: 0, sets: [] }, opts.perks || {});
    this.rows = level.rows; this.cols = level.cols;
    this.cells = level.cells.map(row => row.map(v => (v === 'fog' ? { kind: 'fog', id: uid() } : v === 'wall' ? { kind: 'wall' } : null)));
    for (const fi of level.fogItems || []) { const cell = this.cells[fi.r][fi.c]; if (cell && cell.kind === 'fog') cell.hidden = fi; }
    for (const g of level.gens) { const bonus = this.perks.genCharges[g.chain] || 0; this.cells[g.r][g.c] = { kind: 'gen', id: uid(), chain: g.chain, charges: g.charges + bonus, max: g.charges + bonus, cooldown: Math.round(g.cooldown * this.perks.cooldownMul), nextAt: 0, rare: g.rare || null, auto: !!g.auto, label: g.label || null }; }
    for (const it of level.items) if (!this.cells[it.r][it.c]) this.cells[it.r][it.c] = { kind: 'item', id: uid(), chain: it.chain, lvl: it.lvl };
    for (const it of level.locked || []) if (!this.cells[it.r][it.c]) this.cells[it.r][it.c] = { kind: 'item', id: uid(), chain: it.chain, lvl: it.lvl, locked: true };
    for (const cr of level.crates || []) if (!this.cells[cr.r][cr.c]) this.cells[cr.r][cr.c] = this.makeCrate(cr);
    this.charges = level.charges + (this.perks.startEnergy || 0);
    this.boost = false;
    this.petAt = 0;
    this.score = 0; this.combo = 0; this.comboAt = 0; this.merges = 0; this.coinsEarned = 0;
    this.orders = level.orders.map((o, i) => ({ ...o, idx: i, done: false }));
    this.quests = (level.quests || []).map(q => ({ ...q, progress: 0, done: false }));
    this.stats = { merge5: 0, discover: 0, fog: 0, unlock: 0, bubble: 0, maxCombo: 0, maxLevel: 0, sells: 0, delivered: 0, crates: 0 };
    this.won = false; this.lost = false;
    this.lastSale = null; this.tipGiven = false;
    this.listeners = {};
  }
  on(ev, fn) { (this.listeners[ev] = this.listeners[ev] || []).push(fn); return this; }
  emit(ev, data) { for (const fn of this.listeners[ev] || []) fn(data); }
  makeCrate(cr) { return { kind: 'crate', id: uid(), drops: (cr.drops || 4) + (this.perks.crateDrops || 0), pool: cr.pool || [{ chain: this.level.chains[0], lvl: 1, w: 1 }], golden: !!cr.golden }; }

  // ---------- board helpers ----------
  at(r, c) { return (r >= 0 && r < this.rows && c >= 0 && c < this.cols) ? this.cells[r][c] : undefined; }
  isItem(cell) { return !!cell && cell.kind === 'item'; }
  isFree(cell) { return this.isItem(cell) && !cell.locked && !cell.bubble; }
  same(a, b) { return this.isItem(a) && this.isItem(b) && a.chain === b.chain && a.lvl === b.lvl; }
  maxFor(chain) { return chain === 'energy' ? ENERGY_MAX : MAX_LEVEL; }
  canMergeCell(cell) { return this.isItem(cell) && cell.lvl < this.maxFor(cell.chain) && !cell.bubble; }
  emptyCells() { const out = []; for (let r = 0; r < this.rows; r++) for (let c = 0; c < this.cols; c++) if (this.cells[r][c] === null) out.push([r, c]); return out; }
  openCells() { let n = 0; for (let r = 0; r < this.rows; r++) for (let c = 0; c < this.cols; c++) { const x = this.cells[r][c]; if (!x || x.kind !== 'wall') n++; } return n; }
  fullness() { const open = this.openCells(); return open ? 1 - this.emptyCells().length / open : 1; }
  items() { const out = []; for (let r = 0; r < this.rows; r++) for (let c = 0; c < this.cols; c++) if (this.isItem(this.cells[r][c])) out.push({ r, c, cell: this.cells[r][c] }); return out; }
  gens() { const out = []; for (let r = 0; r < this.rows; r++) for (let c = 0; c < this.cols; c++) { const x = this.cells[r][c]; if (x && x.kind === 'gen') out.push({ r, c, cell: x }); } return out; }
  crates() { const out = []; for (let r = 0; r < this.rows; r++) for (let c = 0; c < this.cols; c++) { const x = this.cells[r][c]; if (x && x.kind === 'crate') out.push({ r, c, cell: x }); } return out; }
  nearestEmpty(r0, c0) {
    const empties = this.emptyCells();
    if (!empties.length) return null;
    const d = (a) => Math.abs(a[0] - r0) + Math.abs(a[1] - c0) + this.rnd() * 0.3;
    empties.sort((a, b) => d(a) - d(b));
    return empties[0];
  }
  adjacentEmpty(r, c) {
    const opts = [[1, 0], [-1, 0], [0, 1], [0, -1]].map(([dr, dc]) => [r + dr, c + dc]).filter(([rr, cc]) => this.at(rr, cc) === null);
    return opts.length ? opts[Math.floor(this.rnd() * opts.length)] : null;
  }
  place([r, c], spec) { const item = { kind: 'item', id: uid(), chain: spec.chain, lvl: spec.lvl }; this.cells[r][c] = item; return item; }

  // ---------- time (cooldowns, bubbles, auto producers) ----------
  tick() {
    const now = this.now();
    for (const { r, c, cell } of this.gens()) {
      if (cell.charges < cell.max && cell.nextAt && now >= cell.nextAt) {
        cell.charges++; cell.nextAt = cell.charges < cell.max ? now + cell.cooldown : 0;
        this.emit('charge', { at: [r, c], cell });
      }
      if (cell.auto && cell.charges > 0 && !this.won && !this.lost && (!cell.autoAt || now >= cell.autoAt)) {
        cell.autoAt = now + cell.cooldown;
        const target = this.adjacentEmpty(r, c);
        if (target) { cell.charges--; if (cell.charges < cell.max && !cell.nextAt) cell.nextAt = now + cell.cooldown * 2; this.place(target, this.rollSpawn(cell, false)); this.emit('spawn', { from: [r, c], to: target, item: this.at(target[0], target[1]), auto: true }); }
      }
    }
    if (this.perks.petFinder && !this.won && !this.lost) {
      if (!this.petAt) this.petAt = now + this.perks.petFinder;
      else if (now >= this.petAt) { this.petAt = now + this.perks.petFinder; const chains = this.level.chains.filter(c => c !== 'energy'); const target = this.nearestEmpty(this.rows - 1, this.cols - 1); if (target && chains.length) { const item = this.place(target, { chain: chains[Math.floor(this.rnd() * chains.length)], lvl: 1 }); this.emit('spawn', { from: target, to: target, item, pet: true }); this.discover(item); } }
    }
    for (const { r, c, cell } of this.items()) {
      if (cell.bubble && now >= cell.bubble.expires) {
        const coins = SELL_VALUE[Math.min(cell.lvl, SELL_VALUE.length) - 1] || 2;
        this.cells[r][c] = null; this.coinsEarned += coins;
        this.emit('bubbleGone', { at: [r, c], item: cell, coins });
      }
    }
  }

  // ---------- generators ----------
  rollSpawn(gen, boosted) {
    if (gen.rare && this.rnd() < gen.rare.p) return { chain: gen.rare.chain, lvl: gen.rare.lvl || 1 };
    if (this.level.energy && this.rnd() < this.level.energy) return { chain: 'energy', lvl: this.rnd() < 0.8 ? 1 : 2 };
    const x = this.rnd();
    let lvl = 1;
    for (const [p, l] of SPAWN_ROLL) if (x <= p) { lvl = l; break; }
    if (boosted) lvl = Math.min(lvl + 1, this.maxFor(gen.chain) - 1);
    return { chain: gen.chain, lvl };
  }
  spawn(r, c) {
    const gen = this.at(r, c);
    if (!gen || gen.kind !== 'gen' || gen.auto || this.won || this.lost) return null;
    const cost = this.boost ? 2 : 1;
    if (this.charges < cost) { this.emit('noCharges'); return null; }
    if (gen.charges <= 0) { this.emit('genEmpty', { at: [r, c], cell: gen }); return null; }
    const target = this.nearestEmpty(r, c);
    if (!target) { this.emit('full'); return null; }
    const roll = this.rollSpawn(gen, this.boost);
    const item = this.place(target, roll);
    gen.charges--;
    if (gen.charges < gen.max && !gen.nextAt) gen.nextAt = this.now() + gen.cooldown;
    this.charges -= cost;
    this.emit('charges', this.charges);
    this.emit('spawn', { from: [r, c], to: target, item, boosted: this.boost && roll.chain === gen.chain });
    this.checkLose();
    return item;
  }
  setBoost(on) { this.boost = !!on; this.emit('boost', this.boost); }
  // Booster: every generator fully recharged.
  recharge() { let n = 0; for (const { r, c, cell } of this.gens()) { if (cell.charges < cell.max) { cell.charges = cell.max; cell.nextAt = 0; n++; this.emit('charge', { at: [r, c], cell }); } } this.emit('recharge', n); return n; }

  // ---------- crates: free drops, one per tap ----------
  openCrate(r, c) {
    const cr = this.at(r, c);
    if (!cr || cr.kind !== 'crate' || this.won || this.lost) return null;
    const target = this.nearestEmpty(r, c);
    if (!target) { this.emit('full'); return null; }
    const total = cr.pool.reduce((a, p) => a + (p.w || 1), 0);
    let x = this.rnd() * total, pick = cr.pool[cr.pool.length - 1];
    for (const p of cr.pool) { x -= (p.w || 1); if (x <= 0) { pick = p; break; } }
    const item = this.place(target, pick);
    cr.drops--; this.stats.crates++;
    this.emit('crateDrop', { at: [r, c], to: target, item, left: cr.drops });
    if (cr.drops <= 0) { this.cells[r][c] = null; this.emit('crateDone', { at: [r, c] }); }
    this.discover(item);
    this.questEvent('crate');
    this.checkLose();
    return item;
  }
  spawnCrate(near, spec) {
    const target = this.nearestEmpty(near[0], near[1]);
    if (!target) return null;
    const cr = this.makeCrate(spec); this.cells[target[0]][target[1]] = cr;
    this.emit('crate', { at: target, cell: cr });
    return target;
  }

  // ---------- taps on items ----------
  tap(r, c) {
    const cell = this.at(r, c);
    if (cell && cell.kind === 'crate') return this.openCrate(r, c) ? { crate: true } : null;
    if (!this.isItem(cell) || this.won || this.lost) return null;
    if (cell.bubble) {
      delete cell.bubble; this.stats.bubble++;
      this.emit('bubblePop', { at: [r, c], item: cell });
      this.questEvent('bubble');
      this.discover(cell);
      return { popped: true };
    }
    if (cell.locked) { this.emit('lockedTap', { at: [r, c], item: cell }); return null; }
    if (cell.chain === 'energy') {
      const gain = ENERGY_GAIN[cell.lvl - 1] || 1;
      this.cells[r][c] = null;
      this.charges += gain; this.lost = false;
      this.emit('charges', this.charges);
      this.emit('collect', { at: [r, c], item: cell, gain });
      return { energy: gain };
    }
    return null;
  }
  // ---------- drag & drop ----------
  drop(r1, c1, r2, c2) {
    if (this.won || this.lost || (r1 === r2 && c1 === c2)) return 'none';   // dropped back on its own cell
    const a = this.at(r1, c1), b = this.at(r2, c2);
    if (a && a.kind === 'crate') {
      if (b === null) { this.cells[r2][c2] = a; this.cells[r1][c1] = null; this.emit('move', { from: [r1, c1], to: [r2, c2], item: a }); return 'move'; }
      if (b && b.kind === 'crate') { b.drops += a.drops + 2; b.golden = b.golden || a.golden; this.cells[r1][c1] = null; this.emit('crateMerge', { from: [r1, c1], to: [r2, c2], cell: b }); return 'merge'; }
      return 'none';
    }
    if (!this.isFree(a) || b === undefined || (r1 === r2 && c1 === c2)) return 'none';
    if (b === null) { this.cells[r2][c2] = a; this.cells[r1][c1] = null; this.emit('move', { from: [r1, c1], to: [r2, c2], item: a }); return 'move'; }
    if (b.kind === 'wall' || b.kind === 'fog' || b.kind === 'crate') return 'none';
    if (this.same(a, b) && this.canMergeCell(a) && !b.bubble) { this.merge(r1, c1, r2, c2); return 'merge'; }
    if (b.locked || b.bubble) return 'none';
    if (b.kind === 'item' || b.kind === 'gen') { this.cells[r2][c2] = a; this.cells[r1][c1] = b; this.emit('swap', { from: [r1, c1], to: [r2, c2], a, b }); return 'swap'; }
    return 'none';
  }
  component(r, c, ref) {
    const seen = new Set(), out = [], stack = [[r, c]];
    while (stack.length) {
      const [rr, cc] = stack.pop(); const k = rr + ',' + cc;
      if (seen.has(k)) continue; seen.add(k);
      const cell = this.at(rr, cc);
      if (!this.same(cell, ref) || cell.bubble) continue;
      out.push([rr, cc]);
      stack.push([rr + 1, cc], [rr - 1, cc], [rr, cc + 1], [rr, cc - 1]);
    }
    return out;
  }
  merge(r1, c1, r2, c2) {
    const a = this.cells[r1][c1], b = this.cells[r2][c2];
    const now = this.now();
    this.combo = now - this.comboAt < 2200 ? this.combo + 1 : 1; this.comboAt = now;
    this.stats.maxCombo = Math.max(this.stats.maxCombo, this.combo);
    const wasLocked = !!b.locked;
    const group = this.component(r2, c2, b).filter(([r, c]) => !(r === r1 && c === c1));
    let consumed = [[r1, c1], [r2, c2]];
    let results = 1;
    if (group.length + 1 >= 5) {
      const others = group.filter(([r, c]) => !(r === r2 && c === c2)).sort((p, q) => (Math.abs(p[0] - r2) + Math.abs(p[1] - c2)) - (Math.abs(q[0] - r2) + Math.abs(q[1] - c2))).slice(0, 3);
      consumed = [[r1, c1], [r2, c2], ...others];
      results = 2;
      this.stats.merge5++;
      this.questEvent('merge5');
    }
    const unlocked = consumed.filter(([r, c]) => this.cells[r][c].locked).length;
    for (const [r, c] of consumed) this.cells[r][c] = null;
    const lvl = a.lvl + 1;
    const made = [];
    const spots = [[r2, c2], [r1, c1]];
    for (let i = 0; i < results; i++) {
      const [r, c] = spots[i];
      const item = { kind: 'item', id: uid(), chain: a.chain, lvl };
      this.cells[r][c] = item; made.push({ r, c, item });
    }
    const pts = mergePoints(lvl, this.combo) * results + unlocked * 20;
    this.score += pts; this.merges++;
    if (unlocked) { this.stats.unlock += unlocked; this.questEvent('unlock', unlocked); }
    this.stats.maxLevel = Math.max(this.stats.maxLevel, lvl);
    this.emit('merge', { consumed, made, lvl, chain: a.chain, points: pts, combo: this.combo, big: results === 2, unlocked: wasLocked });
    this.emit('score', this.score);
    this.questEvent('make', 1, { chain: a.chain, lvl });
    for (const m of made) this.discover(m.item);
    this.revealAround(r2, c2);
    // bubble: one timed duplicate of a level-3+ result, only with room to breathe
    if (lvl >= 3 && a.chain !== 'energy' && this.rnd() < (this.level.bubble || 0) * (this.perks.bubbleMul || 1) && this.emptyCells().length >= 2 && !this.items().some(x => x.cell.bubble)) {
      const spot = this.nearestEmpty(r2, c2);
      if (spot) { const dup = this.place(spot, { chain: a.chain, lvl }); dup.bubble = { expires: now + BUBBLE_MS + (this.perks.bubbleMs || 0) }; this.emit('bubble', { at: spot, item: dup }); }
    }
    this.checkLose();
  }
  discover(item) {
    const k = key(item.chain, item.lvl);
    if (item.chain === 'energy' || this.discovered.has(k)) return false;
    this.discovered.add(k); this.stats.discover++;
    this.emit('discover', { item, key: k });
    this.questEvent('discover');
    return true;
  }
  revealAround(r, c) {
    for (const [dr, dc] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const cell = this.at(r + dr, c + dc);
      if (cell && cell.kind === 'fog') {
        let item = null;
        if (cell.hidden && cell.hidden.crate) item = this.makeCrate(cell.hidden);
        else if (cell.hidden) item = { kind: 'item', id: uid(), chain: cell.hidden.chain, lvl: cell.hidden.lvl };
        this.cells[r + dr][c + dc] = item;
        this.stats.fog++;
        this.emit('fog', { at: [r + dr, c + dc], item });
        this.questEvent('fog');
        if (item && item.kind === 'item') this.discover(item);
      }
    }
  }
  // ---------- orders ----------
  countOf(chain, lvl) { return this.items().filter(x => this.isFree(x.cell) && x.cell.chain === chain && x.cell.lvl === lvl).length; }
  canDeliver(order) { return !order.done && order.items.every(it => this.countOf(it.chain, it.lvl) >= it.count); }
  deliver(idx) {
    const order = this.orders[idx];
    if (!order || !this.canDeliver(order) || this.won || this.lost) return null;
    const removed = [];
    for (const need of order.items) {
      let left = need.count;
      for (const x of this.items()) {
        if (left <= 0) break;
        if (this.isFree(x.cell) && x.cell.chain === need.chain && x.cell.lvl === need.lvl) { removed.push({ r: x.r, c: x.c, item: x.cell }); this.cells[x.r][x.c] = null; left--; }
      }
    }
    order.done = true; this.stats.delivered++;
    order.paid = Math.round(order.reward.coins * (this.perks.orderCoinsMul || 1));
    this.coinsEarned += order.paid; this.score += order.reward.score || 0;
    if (this.perks.deliverEnergy) { this.charges += this.perks.deliverEnergy; this.emit('charges', this.charges); }
    this.emit('deliver', { order, removed, idx });
    this.emit('score', this.score);
    // medium orders pay a crate; the first delivered easy order opens a tip order for leftovers
    if (order.tier === 'medium' && order.crate && removed.length) this.spawnCrate([removed[0].r, removed[0].c], order.crate);
    if (order.tier === 'easy' && !this.tipGiven) {
      this.tipGiven = true;
      const tip = tipOrderFor(this.level, this.items().filter(x => this.isFree(x.cell)).map(x => x.cell), this.rnd);
      if (tip) { tip.idx = this.orders.length; tip.done = false; tip.optional = true; this.orders.push(tip); this.emit('order', { order: tip }); }
    }
    this.checkWin();
    this.checkLose();
    return removed;
  }
  // ---------- selling / storage ----------
  sell(r, c) {
    const cell = this.at(r, c);
    if (!this.isFree(cell) || cell.chain === 'energy' || this.won || this.lost) return null;
    const coins = SELL_VALUE[Math.min(cell.lvl, SELL_VALUE.length) - 1] || 2;
    this.cells[r][c] = null; this.coinsEarned += coins; this.stats.sells++;
    this.lastSale = { r, c, item: cell, coins };
    this.emit('sell', { at: [r, c], item: cell, coins });
    this.checkLose();
    return coins;
  }
  undoSell() {
    const s = this.lastSale; if (!s || this.cells[s.r][s.c] !== null) return false;
    this.cells[s.r][s.c] = s.item; this.coinsEarned -= s.coins; this.lastSale = null;
    this.emit('undoSell', { at: [s.r, s.c], item: s.item, coins: s.coins });
    return true;
  }
  takeOut(r, c) { const cell = this.at(r, c); if (!this.isFree(cell) || cell.chain === 'energy') return null; this.cells[r][c] = null; this.emit('out', { at: [r, c], item: cell }); return cell; }
  putIn(item) {
    const target = this.nearestEmpty(Math.floor(this.rows / 2), Math.floor(this.cols / 2));
    if (!target) { this.emit('full'); return null; }
    const placed = this.place(target, item); this.emit('in', { at: target, item: placed }); return target;
  }
  // Pack-up at win: leftovers >= L3 (highest first) go to free storage slots, the rest sells at half price.
  packUp(freeSlots) {
    const left = this.items().filter(x => this.isFree(x.cell) && x.cell.chain !== 'energy').map(x => x.cell).sort((a, b) => b.lvl - a.lvl);
    const stored = [], sold = [];
    let coins = 0;
    for (const it of left) {
      if (it.lvl >= 3 && stored.length < freeSlots) stored.push({ chain: it.chain, lvl: it.lvl });
      else { const v = Math.floor((SELL_VALUE[Math.min(it.lvl, SELL_VALUE.length) - 1] || 2) / 2); coins += v; sold.push(it); }
    }
    return { stored, sold, coins };
  }
  // ---------- boosters ----------
  hammer(r, c) {
    const cell = this.at(r, c);
    if (!this.isFree(cell) || !this.canMergeCell(cell)) return false;
    const item = { kind: 'item', id: uid(), chain: cell.chain, lvl: cell.lvl + 1 };
    this.cells[r][c] = item;
    this.stats.maxLevel = Math.max(this.stats.maxLevel, item.lvl);
    this.emit('hammer', { at: [r, c], item });
    this.questEvent('make', 1, { chain: item.chain, lvl: item.lvl });
    this.discover(item);
    return true;
  }
  addCharges(n) { this.charges += n; this.lost = false; this.emit('charges', this.charges); }
  // ---------- quests (optional stars) ----------
  questEvent(type, n = 1, data = null) {
    for (const q of this.quests) {
      if (q.done || q.type !== type) continue;
      if (type === 'make') { if (data && data.chain === q.chain && data.lvl >= q.lvl) q.progress = q.target; else continue; }
      else q.progress = Math.min(q.target, q.progress + n);
      if (q.progress >= q.target) { q.done = true; this.emit('quest', { quest: q }); }
    }
  }
  finishQuests() { for (const q of this.quests) if (!q.done && q.type === 'energyLeft' && this.charges >= q.target) { q.done = true; q.progress = q.target; this.emit('quest', { quest: q }); } }
  stars() { return 1 + this.quests.filter(q => q.done).length; }
  // ---------- state checks ----------
  hasMergeablePair() {
    const seen = new Map();
    for (const { cell } of this.items()) {
      if (!this.canMergeCell(cell) || cell.bubble) continue;
      const k = key(cell.chain, cell.lvl);
      if (seen.has(k)) { if (!(cell.locked && seen.get(k).locked)) return true; } else seen.set(k, cell);
    }
    return false;
  }
  hasEnergy() { return this.items().some(x => x.cell.chain === 'energy' && !x.cell.locked); }
  hasCrate() { return this.crates().length > 0 && this.emptyCells().length > 0; }
  deliverable() { return this.orders.some(o => this.canDeliver(o)); }
  required() { return this.orders.filter(o => !o.optional); }
  checkWin() {
    if (this.won) return;
    if (this.required().every(o => o.done)) {
      this.won = true; this.finishQuests();
      this.emit('win', { stars: this.stars(), score: this.score, charges: this.charges, coins: this.coinsEarned });
    }
  }
  checkLose() {
    if (this.won || this.lost) return;
    if (this.charges <= 0 && !this.hasMergeablePair() && !this.hasEnergy() && !this.deliverable() && !this.hasCrate()) { this.lost = true; this.emit('lose', { score: this.score }); }
  }
  hint() {
    const by = new Map();
    for (const x of this.items()) { if (!this.canMergeCell(x.cell) || x.cell.bubble) continue; const k = key(x.cell.chain, x.cell.lvl); if (by.has(k)) { const o = by.get(k); if (!(o.cell.locked && x.cell.locked)) return o.cell.locked ? [x, o] : [o, x]; } else by.set(k, x); }
    return null;
  }
}
