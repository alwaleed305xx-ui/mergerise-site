// Play screen v3: orders board (easy → hard, tip orders, "Show"), star quests, generators with charges/cooldown,
// crates, locked items, bubbles, sell/undo, persistent storage (+ slot purchase), pack-up at win, discovery,
// boost x2 + recharge boosters, reserve-energy rescue ladder, one-time contextual hints, tutorial, win/lose + gifts.
import { el, $, $$, haptic, sleep, fmt, clamp } from '../util.js';
import { t, name } from '../i18n.js';
import { state, save, addCoins, spend, recordWin, addItem, equip, tierFor, own, discoverItem, storageSet, markSeen, reserveNow, reserveEta, useReserve, storagePrice, buyStorageSlot } from '../store.js';
import { getLevel, rewardFor, MAX_LEVEL, dailyLevel } from '../levels.js';
import { Game, SELL_VALUE, BUBBLE_MS } from '../game.js';
import { CHAINS } from '../items.js';
import { rollGift, valueOf } from '../wardrobe.js';
import { sfx } from '../audio.js';
import { fx } from '../particles.js';
import { I, modal, toast, floatText, comboText, flyTo, bump, shake, starsRow } from '../ui.js';
import { giftFlow } from '../gift.js';
import { GEM, ADS, FREE_GEMS, gems, addGems, spendGems, refillPrice, refillCount, refillBuy, adsLeft, adUsed, piggyAddWin } from '../economy.js';
import { showRewardedAd, adsAvailable } from '../ads.js';
import { gemIcon } from './shop.js';
import { perksFor } from '../sets.js';
import { npcByName, portrait, line, recordDelivery } from '../customers.js';
import { track, checkAchievements, setCounter } from '../missions.js';
import { styleScore } from '../wardrobe.js';
import * as rivals from '../rivals.js';
import * as daily from '../daily.js';
import { lineFor } from '../customers.js';
import { weekTheme, themeScore, markWorn } from '../style.js';
import { trackHostDelivery } from '../missions.js';
import { renderAvatar } from '../avatar.js';

const HAMMER_COST = 100, RECHARGE_COST = 100, RESCUE_BASE = 150;   // 100 coins = 2 gems (COINS_PER_GEM 50)
const icon = (chain, lvl) => `<svg viewBox="0 0 100 100">${CHAINS[chain].levels[lvl - 1].icon()}</svg>`;
const genIcon = chain => `<svg viewBox="0 0 100 100">${CHAINS[chain].gen.icon()}</svg>`;
const itemName = (chain, lvl) => name(CHAINS[chain].levels[lvl - 1].name);
const questText = q => q.type === 'make' ? `${t('goal')} ${itemName(q.chain, q.lvl)}` : name(q.text);
const crateIcon = golden => {
  const a = golden ? '#fbbf24' : '#b45309', d = golden ? '#b45309' : '#78350f', l = golden ? '#fde68a' : '#d97706';
  return `<svg viewBox="0 0 100 100"><ellipse cx="50" cy="88" rx="30" ry="6" fill="#000" opacity=".15"/><path d="M18 40 L50 26 L82 40 L82 78 L50 92 L18 78 Z" fill="${a}" stroke="${d}" stroke-width="3.5" stroke-linejoin="round"/><path d="M18 40 L50 54 L82 40" fill="none" stroke="${d}" stroke-width="3.5" stroke-linejoin="round"/><path d="M50 54 L50 92" stroke="${d}" stroke-width="3.5"/><path d="M26 44 L50 55 L50 86 L26 76 Z" fill="#000" opacity=".12"/><path d="M22 42 L50 30 L58 33 L30 46 Z" fill="#fff" opacity=".3"/><path d="M34 60 L44 64 M34 68 L44 72" stroke="${l}" stroke-width="3" stroke-linecap="round"/>${golden ? '<path d="M50 8 l3 6 6 1-4.5 4 1 6-5.5-3-5.5 3 1-6-4.5-4 6-1z" fill="#fff" opacity=".9"/>' : ''}</svg>`;
};

export function render(root, params, app) {
  root.classList.add('play');
  const isDaily = !!params.daily;
  const stageN = isDaily ? Math.max(5, Math.min(40, state.stage)) : (params.stage || state.stage);
  if (isDaily && daily.useDailyTry && !params.retry && !daily.useDailyTry()) { setTimeout(() => app.go('hub', {}), 0); return; }
  const level = isDaily ? dailyLevel() : getLevel(stageN);
  try { markWorn(Object.values(state.equipped).filter(Boolean)); } catch (_) { /* optional */ }
  const discovered = new Set(state.discovered || []);
  const perks = perksFor(state.equipped);
  const game = new Game(level, { discovered, perks });
  window.__game = game;
  const p = state.profile;
  let locked = false, hammerMode = false, tutorialStep = level.tutorial && !state.tutorialDone ? 1 : 0, lastInput = Date.now(), finished = false, rescues = 0, beatOrder = false, lowEnergySaid = false, fitCheckWon = false, rivalHard = null;
  const once = (key, fn) => { if (state.seen[key]) return; markSeen(key); fn(); };
  const rescuePrice = () => RESCUE_BASE * Math.pow(2, Math.min(rescues, 2));   // 150 → 300 → 600 and stays at 600

  // ---------- HUD ----------
  const chargeChip = el('div', { class: 'chip', html: I.bolt() + `<span>${game.charges}</span>` });
  const scoreChip = el('div', { class: 'chip', html: I.sparkle() + `<span>0</span>` });
  const coinChip = el('div', { class: 'chip gold', html: I.coin() + `<span>${fmt(state.coins)}</span>` });
  const paintCoins = () => { coinChip.querySelector('span').textContent = fmt(state.coins); };
  const hud = el('div', { class: 'hud' }, [
    el('button', { class: 'btn icon ghost', onclick: () => { sfx.tap(); pause(); } }, el('span', { html: I.pause() })),
    el('span', { class: 'stage-badge' + (level.golden ? ' gold' : '') }, `${t('stage')} ${stageN}`),
    el('div', { class: 'spacer' }), chargeChip, scoreChip, coinChip,
  ]);

  // ---------- orders ----------
  const ordersEl = el('div', { class: 'orders' });
  const orderEls = [];
  const addOrderCard = (o) => {
    const d = el('div', { class: 'order ' + o.tier });
    const npc = npcByName(o.customer.name);
    d.append(el('div', { class: 'cust pic', style: { background: o.customer.color }, html: portrait(npc) }));
    d.append(el('div', { class: 'say' }, name(line(npc, o.tier === 'tip' ? 'tip' : 'hi', p.name))));
    const needs = el('div', { class: 'needs' });
    for (const it of o.items) needs.append(el('div', { class: 'need', html: icon(it.chain, it.lvl) + `<span class="cnt">0/${it.count}</span>`, onclick: () => showNeed(it, d.querySelectorAll('.need')[o.items.indexOf(it)]) }));
    d.append(needs);
    d.append(el('div', { class: 'rw', html: I.coin() + `<span>${o.reward.coins}</span>` + (o.crate ? crateIcon(false).replace('<svg', '<svg style="width:16px;height:16px"') : '') }));
    d.append(el('button', { class: 'btn sm green deliver', onclick: () => { sfx.tap(); doDeliver(o.idx); } }, t('deliver')));
    ordersEl.append(d); orderEls[o.idx] = d; return d;
  };
  game.orders.forEach(addOrderCard);
  const paintOrders = () => game.orders.forEach((o) => {
    const d = orderEls[o.idx]; if (!d) return;
    o.items.forEach((it, k) => { const have = Math.min(it.count, game.countOf(it.chain, it.lvl)); const n = d.querySelectorAll('.need .cnt')[k]; n.textContent = `${have}/${it.count}`; n.parentElement.classList.toggle('ok', have >= it.count); });
    const ready = game.canDeliver(o);
    d.classList.toggle('ready', ready); d.classList.toggle('done', o.done);
    d.querySelector('.deliver').disabled = !ready;
  });
  // "Show": flash matching board items and the generator that feeds this chain
  function showNeed(it, needEl) {
    sfx.tap(); lastInput = Date.now();
    if (needEl) { needEl.classList.remove('flash'); void needEl.offsetWidth; needEl.classList.add('flash'); }
    for (const x of game.items()) if (x.cell.chain === it.chain && x.cell.lvl <= it.lvl) { const tl = cellEls[x.r][x.c].firstChild; if (tl) { tl.classList.add('hinting'); setTimeout(() => tl.classList.remove('hinting'), 1500); } }
    for (const g of game.gens()) if (g.cell.chain === it.chain || (g.cell.rare && g.cell.rare.chain === it.chain)) { const tl = cellEls[g.r][g.c].firstChild; if (tl) { tl.classList.add('hint'); setTimeout(() => tl.classList.remove('hint'), 1500); } }
  }

  // ---------- quests ----------
  const questsEl = el('div', { class: 'quests' });
  const questEls = game.quests.map(q => { const d = el('div', { class: 'quest', html: I.star(false) + `<span>${questText(q)}</span><b>${q.type === 'energyLeft' || q.type === 'make' ? '' : `0/${q.target}`}</b>` }); questsEl.append(d); return d; });
  const paintQuests = () => game.quests.forEach((q, i) => { const d = questEls[i]; d.classList.toggle('done', q.done); d.querySelector('b').textContent = q.done ? '✓' : (q.type === 'energyLeft' || q.type === 'make') ? '' : `${q.progress}/${q.target}`; if (q.done && !d.dataset.lit) { d.dataset.lit = '1'; d.querySelector('svg').outerHTML = I.star(true); } });

  // ---------- board ----------
  const wrap = el('div', { class: 'board-wrap' });
  const board = el('div', { class: 'board' });
  board.style.setProperty('--cols', game.cols); board.style.setProperty('--rows', game.rows);
  const cellEls = [];
  for (let r = 0; r < game.rows; r++) { cellEls.push([]); for (let c = 0; c < game.cols; c++) { const d = el('div', { class: 'cell', 'data-r': r, 'data-c': c }); board.append(d); cellEls[r].push(d); } }
  wrap.append(board);

  // ---------- storage + info + boosters ----------
  const storageEl = el('div', { class: 'storage' });
  const paintStorage = () => {
    storageEl.innerHTML = '';
    const slots = state.storage || [];
    slots.forEach((it, i) => {
      const s = el('div', { class: 'slot' + (it ? ' full' : ''), 'data-slot': i, html: it ? icon(it.chain, it.lvl) + `<span class="lvl">${it.lvl}</span>` : '', onclick: () => { if (it && !locked && !game.won && !game.lost) { const at = game.putIn(it); if (at) { storageSet(i, null); sfx.drop(); paintStorage(); } } } });
      storageEl.append(s);
    });
    const price = storagePrice();
    if (price != null) storageEl.append(el('div', { class: 'slot buy', html: I.coin() + `<span>${price}</span>`, onclick: () => { sfx.tap(); if (buyStorageSlot()) { sfx.coin(); paintCoins(); paintStorage(); toast(t('buySlot'), { icon: I.check() }); return; } const gp = GEM.storageSlot[(state.storageSlots || 4) - 4]; if (gems() >= gp) { modal({ title: t('buySlot'), body: el('div', { class: 'win-story' }, t('payWithGems', gp)), actions: [{ label: t('cancel'), cls: 'light' }, { html: `${gemIcon()}<span>${gp}</span>`, cls: 'purple', onClick: () => { if (spendGems(gp)) { addCoins(price); buyStorageSlot(); paintCoins(); paintStorage(); } } }] }); return; } sfx.error(); toast(t('notEnoughCoins'), { icon: I.coin() }); } }));
  };
  const info = el('div', { class: 'info' });
  const boostEnergy = el('button', { class: 'boost', html: I.bolt() + `<span>${t('buyEnergy')}</span><span class="cost">${I.coin()}<b>${rescuePrice()}</b></span>` });
  const boostHammer = el('button', { class: 'boost', html: I.hammer() + `<span>${t('hammer')}</span><span class="cost">${I.coin()}${HAMMER_COST}</span>` });
  const boostX2 = el('button', { class: 'boost', html: I.sparkle() + `<span>${t('boost')}</span><span class="cost">2 ${I.bolt()}</span>` });
  const boostRecharge = el('button', { class: 'boost', html: I.gear() + `<span>${t('recharge')}</span><span class="cost">${I.coin()}${RECHARGE_COST}</span>` });
  const boostHint = el('button', { class: 'boost', html: I.hint() + `<span>${t('hint')}</span><span class="cost">${t('free')}</span>` });
  const boosters = el('div', { class: 'boosters five' }, [boostEnergy, boostHammer, boostX2, boostRecharge, boostHint]);
  const perksEl = el('div', { class: 'perks' + (perks.sets.length ? '' : ' hidden') }, perks.sets.map(s => el('span', { class: 'perk', title: name(s.perk.text) }, `${s.emoji} ${name(s.perk.text)}`)));
  const hostEl = (() => { try { return isDaily && daily.dailyHostCard ? daily.dailyHostCard(level, p.name) : null; } catch (e) { console.warn('hostCard', e); return null; } })();
  // native append() would turn the null hostEl of a normal stage into a visible "null" text node
  root.append(...[hud, perksEl, hostEl, ordersEl, questsEl, wrap, el('div', { class: 'under' }, [storageEl, info]), boosters].filter(Boolean));
  paintStorage();
  const paintRescue = () => { boostEnergy.querySelector('.cost b').textContent = rescuePrice(); };

  const sizeBoard = () => {
    const W = wrap.clientWidth - 20 - 16, H = wrap.clientHeight - 20 - 8;
    const tile = clamp(Math.floor(Math.min((W - (game.cols - 1) * 4) / game.cols, (H - (game.rows - 1) * 4) / game.rows)), 34, 70);
    board.style.setProperty('--tile', tile + 'px');
  };
  requestAnimationFrame(sizeBoard); const onResize = () => sizeBoard(); window.addEventListener('resize', onResize);

  const tileHTML = (cell) => {
    if (cell.kind === 'gen') return genIcon(cell.chain) + `<span class="chg">${cell.auto ? 'A' : cell.charges}</span><span class="cd"></span>`;
    if (cell.kind === 'crate') return crateIcon(cell.golden) + `<span class="chg">${cell.drops}</span>`;
    return icon(cell.chain, cell.lvl) + (cell.chain === 'energy' ? '' : `<span class="lvl">${cell.lvl}</span>`) + (cell.locked ? `<span class="lockbadge">${I.lock()}</span>` : '') + (cell.bubble ? '<span class="bub"></span>' : '');
  };
  const tileClass = (cell) => 'tile' + (cell.kind === 'gen' ? ' gen' + (cell.charges <= 0 ? ' empty' : '') + (cell.auto ? ' auto' : '') : '') + (cell.kind === 'crate' ? ' crate' + (cell.golden ? ' golden' : '') : '') + (cell.kind === 'item' && cell.lvl >= MAX_LEVEL ? ' max' : '') + (cell.chain === 'energy' ? ' energy' : '') + (cell.locked ? ' locked' : '') + (cell.bubble ? ' bubble' : '');
  const paintCell = (r, c, anim) => {
    const cell = game.cells[r][c], d = cellEls[r][c];
    d.className = 'cell' + (cell && cell.kind === 'fog' ? ' fog' : cell && cell.kind === 'wall' ? ' wall' : '');
    d.innerHTML = '';
    if (cell && (cell.kind === 'item' || cell.kind === 'gen' || cell.kind === 'crate')) d.append(el('div', { class: tileClass(cell) + (anim ? ' ' + anim : ''), html: tileHTML(cell), 'data-id': cell.id }));
  };
  const paintTemp = (r, c, item) => { const d = cellEls[r][c]; d.innerHTML = ''; d.append(el('div', { class: 'tile pop', html: tileHTML(item) })); };
  const paintAll = (anim) => { for (let r = 0; r < game.rows; r++) for (let c = 0; c < game.cols; c++) paintCell(r, c, anim); };
  paintAll('pop'); paintOrders(); paintQuests();
  const center = (r, c) => { const b = cellEls[r][c].getBoundingClientRect(), a = $('#app').getBoundingClientRect(); return { x: b.left + b.width / 2 - a.left, y: b.top + b.height / 2 - a.top, X: b.left + b.width / 2, Y: b.top + b.height / 2 }; };
  const cellAt = (X, Y) => { const b = board.getBoundingClientRect(); const tile = parseFloat(getComputedStyle(board).getPropertyValue('--tile')); const c = Math.floor((X - b.left - 10) / (tile + 4)), r = Math.floor((Y - b.top - 10) / (tile + 4)); return (r >= 0 && r < game.rows && c >= 0 && c < game.cols) ? [r, c] : null; };
  const setInfo = (html) => { info.innerHTML = ''; if (typeof html === 'string') info.innerHTML = html; else info.append(...[].concat(html)); };
  const describe = (cell, r, c) => {
    if (!cell) return setInfo(stageN <= 2 ? `<span class="arrow">${t('tapGenerator')} · ${t('dragToMerge')}</span>` : '');
    if (cell.kind === 'gen') return setInfo(`${genIcon(cell.chain)}<span>${name(CHAINS[cell.chain].gen.name)} · ${cell.auto ? t('autoGen') : `${cell.charges}/${cell.max} ${t('charges')}`}</span>`);
    if (cell.kind === 'crate') return setInfo(`${crateIcon(cell.golden)}<span>${t('crate')} · ${t('crateHint')}</span>`);
    if (cell.chain === 'energy') return setInfo(`${icon(cell.chain, cell.lvl)}<span>${itemName(cell.chain, cell.lvl)} · ${t('collectEnergy')}</span>`);
    const max = cell.lvl >= MAX_LEVEL;
    const parts = [el('span', { html: icon(cell.chain, cell.lvl) }), el('span', {}, itemName(cell.chain, cell.lvl) + (cell.locked ? ` · ${t('lockedItem')}` : ''))];
    if (!max) parts.push(el('span', { class: 'arrow' }, '→'), el('span', { html: icon(cell.chain, cell.lvl + 1) }));
    parts.push(el('button', { class: 'mini', onclick: () => { sfx.tap(); chainSheet(cell.chain); } }, 'i'));
    if (!cell.locked && !cell.bubble) {
      parts.push(el('button', { class: 'mini sell', onclick: () => {
        const coins = game.sell(r, c);
        if (coins == null) return;
        toast(`${t('sold')} ${coins}`, { icon: I.coin(), ms: 3500, action: { label: t('undo'), onClick: () => { if (game.undoSell()) { addCoins(-coins); paintCoins(); paintCell(r, c, 'pop'); paintOrders(); sfx.drop(); } } } });
      } }, `${t('sell')} ${SELL_VALUE[Math.min(cell.lvl, SELL_VALUE.length) - 1]}`));
      const slot = (state.storage || []).indexOf(null);
      if (slot >= 0) parts.push(el('button', { class: 'mini', onclick: () => { const it = game.takeOut(r, c); if (it) { storageSet(slot, { chain: it.chain, lvl: it.lvl }); paintStorage(); sfx.pick(); describe(null); } } }, t('store')));
    }
    setInfo(parts);
  };

  // ---------- engine events ----------
  game.on('charges', n => { chargeChip.querySelector('span').textContent = n; bump(chargeChip); if (n <= 2 && !lowEnergySaid && !game.won) { lowEnergySaid = true; try { const o = game.orders.find(x => !x.done); if (o) { const npc = npcByName(o.customer.name); const card = orderEls[o.idx]; const txt = name(lineFor(npc, 'lowEnergy', { hero: p.name })); const say = card && card.querySelector('.say'); if (say) say.textContent = txt; } } catch (_) { /* optional */ } } });
  game.on('score', s => { scoreChip.querySelector('span').textContent = fmt(s); });
  game.on('noCharges', () => { sfx.error(); shake(board); toast(t('outOfEnergy'), { icon: I.bolt() }); });
  game.on('full', () => { sfx.error(); shake(board); toast(t('emptyBoard')); storageEl.classList.add('glow'); setTimeout(() => storageEl.classList.remove('glow'), 2000); });
  game.on('genEmpty', ({ at }) => { sfx.error(); const tl = cellEls[at[0]][at[1]].firstChild; if (tl) { tl.classList.remove('land'); void tl.offsetWidth; tl.classList.add('land'); } toast(t('generatorEmpty'), { icon: I.bolt() }); });
  game.on('charge', ({ at }) => { paintCell(at[0], at[1], 'land'); });
  game.on('recharge', () => { sfx.energy(); for (const g of game.gens()) { const c = center(g.r, g.c); fx.sparkle(c.x, c.y, 8, '#22d3ee'); } toast(t('rechargeHint'), { icon: I.bolt() }); });
  game.on('lockedTap', () => { sfx.error(); toast(t('lockedHint'), { icon: I.lock() }); });
  game.on('spawn', ({ from, to, item, boosted, auto, pet }) => {
    sfx.spawn(); if (!auto && !pet) haptic(8);
    if (pet) { const c0 = center(to[0], to[1]); floatText(c0.x, c0.y - 14, '🐾', 'gold'); }
    paintCell(from[0], from[1], 'land');
    paintCell(to[0], to[1], 'pop');
    const { x, y } = center(to[0], to[1]); fx.sparkle(x, y, boosted ? 10 : 5, boosted ? '#f472b6' : '#ffd34d');
    paintOrders();
    if (tutorialStep === 1 && game.hint()) { tutorialStep = 2; paintTutorial(); }
  });
  game.on('move', ({ from, to }) => { paintCell(from[0], from[1]); paintCell(to[0], to[1], 'land'); sfx.drop(); paintOrders(); });
  game.on('swap', ({ from, to }) => { paintCell(from[0], from[1], 'land'); paintCell(to[0], to[1], 'land'); sfx.drop(); });
  game.on('merge', async ({ consumed, made, lvl, chain, points, combo, big, unlocked }) => {
    locked = true;
    const target = made[0];
    const tc = center(target.r, target.c);
    const anims = [];
    for (const [r, c] of consumed) {
      if (r === target.r && c === target.c) continue;
      const tl = cellEls[r][c].firstChild; if (!tl) continue;
      const fc = center(r, c);
      anims.push(tl.animate([{ transform: 'translate(0,0) scale(1)' }, { transform: `translate(${tc.x - fc.x}px,${tc.y - fc.y}px) scale(.5)`, opacity: .6 }], { duration: 160, easing: 'ease-in', fill: 'forwards' }).finished);
    }
    await Promise.race([Promise.all(anims), sleep(420)]);   // never hang if animations are paused (background tab)
    for (const [r, c] of consumed) paintCell(r, c);
    for (const m of made) { if (game.cells[m.r][m.c]) paintCell(m.r, m.c, 'pop'); else paintTemp(m.r, m.c, m.item); }
    (big ? sfx.bigMerge : sfx.merge)(lvl, combo); haptic(big ? [20, 30, 40] : 14);
    fx.burst(tc.x, tc.y, { count: big ? 36 : 12 + lvl * 2, speed: 260 + lvl * 30, colors: [CHAINS[chain].color, '#fff', '#ffd34d'] });
    floatText(tc.x, tc.y - 10, `+${points}`);
    if (combo >= 2) comboText(`${t('combo')} x${combo}!`);
    if (big) toast(t('mergeFive'), { icon: I.sparkle() });
    if (unlocked) { toast(t('unlocked'), { icon: I.lock() }); fx.sparkle(tc.x, tc.y, 16, '#22d3ee'); }
    if (lvl >= MAX_LEVEL) fx.sparkle(tc.x, tc.y, 20, '#ffd34d');
    paintOrders(); paintQuests();
    track('merge'); if (big) track('merge5'); if (lvl === 5) track('make5'); if (unlocked) track('unlock');
    if (tutorialStep === 2) { tutorialStep = game.orders.some(o => game.canDeliver(o)) ? 3 : (game.hint() ? 2 : 1); paintTutorial(); }
    locked = false;
  });
  game.on('discover', ({ item }) => { track('discover'); discoverItem(item.chain + ':' + item.lvl); const bonus = 8 * item.lvl; addCoins(bonus); const g = item.lvl >= 5 ? FREE_GEMS.discoverHigh : 0; if (g) addGems(g); paintCoins(); bump(coinChip); toast(`${t('newItemFound')}: ${itemName(item.chain, item.lvl)} +${bonus}${g ? ' +' + g + ' 💎' : ''}`, { icon: I.sparkle(), ms: 2400 }); });
  game.on('fog', ({ at, item }) => { paintCell(at[0], at[1], item ? 'pop' : null); sfx.fog(); const { x, y } = center(at[0], at[1]); fx.burst(x, y, { count: 14, colors: ['#b9a8e8', '#fff', '#6a5a8a'], speed: 200, g: 200, life: [0.5, 0.9] }); paintQuests(); paintOrders(); if (item && item.kind === 'crate') once('hint:crate', () => toast(t('hintCrate'), { icon: I.gift(true), ms: 2600 })); });
  game.on('bubble', ({ at }) => { paintCell(at[0], at[1], 'pop'); sfx.pop(); const { x, y } = center(at[0], at[1]); fx.sparkle(x, y, 8, '#22d3ee'); once('hint:bubble', () => toast(t('hintBubble'), { icon: I.sparkle(), ms: 2600 })); });
  game.on('bubblePop', ({ at }) => { track('bubble'); paintCell(at[0], at[1], 'pop'); sfx.goal(); haptic(10); const { x, y } = center(at[0], at[1]); fx.burst(x, y, { count: 16, colors: ['#22d3ee', '#fff'], speed: 220, g: 300 }); paintOrders(); paintQuests(); });
  game.on('bubbleGone', ({ at, coins }) => { paintCell(at[0], at[1]); sfx.coin(); const c = center(at[0], at[1]); fx.coins(c.x, c.y, 4); addCoins(coins); paintCoins(); floatText(c.x, c.y, `+${coins}`, 'gold'); });
  game.on('collect', ({ at, gain }) => { paintCell(at[0], at[1]); sfx.energy(); haptic(12); const c = center(at[0], at[1]); floatText(c.x, c.y, `+${gain} ⚡`, 'gold'); fx.sparkle(c.x, c.y, 12, '#ffd34d'); });
  game.on('sell', ({ at, coins }) => { paintCell(at[0], at[1]); sfx.coin(); const c = center(at[0], at[1]); fx.coins(c.x, c.y, 5); addCoins(coins); paintCoins(); bump(coinChip); floatText(c.x, c.y, `+${coins}`, 'gold'); describe(null); paintOrders(); });
  game.on('out', ({ at }) => { paintCell(at[0], at[1]); paintOrders(); });
  game.on('in', ({ at }) => { paintCell(at[0], at[1], 'pop'); paintOrders(); });
  game.on('hammer', ({ at }) => { paintCell(at[0], at[1], 'pop'); sfx.hammer(); const c = center(at[0], at[1]); fx.burst(c.x, c.y, { count: 20, colors: ['#a855f7', '#fff'] }); paintOrders(); paintQuests(); });
  game.on('quest', ({ quest }) => { paintQuests(); sfx.goal(); toast(`⭐ ${questText(quest)}`, { icon: I.star(true) }); fx.rain('#fbbf24', 12); });
  game.on('crate', ({ at }) => { paintCell(at[0], at[1], 'pop'); sfx.goal(); const c = center(at[0], at[1]); fx.sparkle(c.x, c.y, 14, '#fbbf24'); once('hint:crate', () => toast(t('hintCrate'), { icon: I.gift(true), ms: 2600 })); });
  game.on('crateDrop', ({ at, to, left }) => { track('crate'); paintCell(at[0], at[1], 'land'); paintCell(to[0], to[1], 'pop'); sfx.spawn(); haptic(8); const c = center(to[0], to[1]); fx.sparkle(c.x, c.y, 6, '#fbbf24'); paintOrders(); paintQuests(); });
  game.on('crateDone', ({ at }) => { paintCell(at[0], at[1]); const c = center(at[0], at[1]); fx.burst(c.x, c.y, { count: 14, colors: ['#fbbf24', '#fff'], speed: 200 }); sfx.pop(); });
  game.on('crateMerge', ({ from, to }) => { paintCell(from[0], from[1]); paintCell(to[0], to[1], 'pop'); sfx.bigMerge(); toast(t('crateMerge'), { icon: I.gift(true) }); });
  game.on('order', ({ order }) => { const d = addOrderCard(order); d.classList.add('tip'); paintOrders(); sfx.goal(); toast(t('tipOrder'), { icon: I.coin() }); });
  game.on('deliver', async ({ removed, idx, order }) => {
    locked = true; sfx.goal(); haptic([10, 20, 10]);
    const card = orderEls[idx];
    { const npc = npcByName(order.customer.name); const say = card.querySelector('.say'); const thanks = (() => { try { return name(lineFor(npc, 'thanks', { hero: p.name })); } catch (_) { return name(line(npc, 'thanks', p.name)); } })(); if (say) say.textContent = thanks; try { daily.reactionPop(card, npc, thanks); } catch (_) { /* optional */ } try { trackHostDelivery(npc.name); } catch (_) { /* optional */ }
      if (rivalHard && order === rivalHard && game.charges >= level.charges * 0.4) { beatOrder = true; addCoins(50); paintCoins(); toast(t('beatOrder'), { icon: I.trophy() }); }
      const fr = recordDelivery(npc.name); setCounter('friendMax', fr.level); if (fr.leveledUp) { addCoins(fr.reward); paintCoins(); toast(`${npc.name} ❤️ ${t('level')} ${fr.level} · +${fr.reward}`, { icon: I.trophy(), ms: 2600 }); } }
    track('deliver');
    for (const rm of removed) { const from = center(rm.r, rm.c); cellEls[rm.r][rm.c].innerHTML = ''; flyTo({ x: from.X, y: from.Y }, card, icon(rm.item.chain, rm.item.lvl), { dur: 520, size: 48 }); }
    await sleep(540);
    card.classList.remove('hit'); void card.offsetWidth; card.classList.add('hit');
    const gr = card.getBoundingClientRect(), a = $('#app').getBoundingClientRect();
    fx.coins(gr.left + gr.width / 2 - a.left, gr.top + gr.height / 2 - a.top, 10); sfx.coin();
    const paid = order.paid || order.reward.coins; addCoins(paid); paintCoins(); bump(coinChip);
    floatText(gr.left + gr.width / 2 - a.left, gr.top + gr.height - a.top, `+${paid}`, 'gold');
    paintOrders(); locked = false;
    if (tutorialStep === 3) { tutorialStep = 0; state.tutorialDone = true; save(); paintTutorial(); }
  });
  game.on('boost', on => { boostX2.classList.toggle('on', on); });
  game.on('win', async ({ stars, score }) => { locked = true; finished = true; await sleep(900); winFlow(stars, score); });
  game.on('lose', async () => { locked = true; await sleep(500); loseFlow(); });

  // ---------- clock: cooldowns, bubbles, auto producers, idle hint, fullness ----------
  const clock = setInterval(() => {
    if (finished) return;
    game.tick();
    const now = Date.now();
    for (const { r, c, cell } of game.gens()) {
      const tl = cellEls[r][c].firstChild; if (!tl) continue;
      const cd = tl.querySelector('.cd'); const chg = tl.querySelector('.chg');
      if (chg) chg.textContent = cell.auto ? 'A' : cell.charges;
      tl.classList.toggle('empty', cell.charges <= 0);
      if (cd) cd.textContent = cell.nextAt && cell.charges < cell.max ? Math.max(0, Math.ceil((cell.nextAt - now) / 1000)) + 's' : '';
    }
    for (const { r, c, cell } of game.items()) if (cell.bubble) { const tl = cellEls[r][c].firstChild; if (tl) tl.style.setProperty('--left', Math.max(0, (cell.bubble.expires - now) / BUBBLE_MS)); }
    if (game.fullness() >= 0.8 && !game.won && !game.lost) { storageEl.classList.add('glow'); once('hint:full', () => toast(t('boardFull'), { icon: I.lock(), ms: 2800 })); } else storageEl.classList.remove('glow');
    if (now - lastInput > 7000 && !locked && !game.won && !game.lost) { lastInput = now; const h = game.hint(); if (h) for (const x of h) { const tl = cellEls[x.r][x.c].firstChild; if (tl) { tl.classList.add('hinting'); setTimeout(() => tl.classList.remove('hinting'), 2000); } } }
  }, 250);

  // ---------- input: tap + drag ----------
  let drag = null;
  const clearMarks = () => { $$('.cell.target, .cell.can', board).forEach(d => d.classList.remove('target', 'can')); $$('.tile.dragging, .tile.sel', board).forEach(d => d.classList.remove('dragging', 'sel')); $$('.slot.target', storageEl).forEach(d => d.classList.remove('target')); };
  const draggable = cell => cell && ((cell.kind === 'item' && game.isFree(cell)) || cell.kind === 'crate');
  board.addEventListener('pointerdown', e => {
    lastInput = Date.now();
    if (locked || game.won || game.lost) return;
    const cellEl = e.target.closest('.cell'); if (!cellEl) return;
    const r = +cellEl.dataset.r, c = +cellEl.dataset.c;
    const cell = game.at(r, c);
    if (!cell || cell.kind === 'fog' || cell.kind === 'wall') { clearMarks(); describe(null); return; }
    e.preventDefault();
    drag = { r, c, cell, x0: e.clientX, y0: e.clientY, moved: false, ghost: null };
    try { board.setPointerCapture(e.pointerId); } catch (_) { /* ignore */ }
  });
  board.addEventListener('pointermove', e => {
    if (!drag || !draggable(drag.cell)) return;
    const dx = e.clientX - drag.x0, dy = e.clientY - drag.y0;
    if (!drag.moved && Math.hypot(dx, dy) < 7) return;
    if (!drag.moved) {
      drag.moved = true; sfx.pick(); haptic(6);
      const dtl = cellEls[drag.r][drag.c].firstChild; if (dtl) dtl.classList.add('dragging');
      drag.ghost = el('div', { class: 'drag-ghost', html: tileHTML(drag.cell) }); $('#overlay').append(drag.ghost);
      if (drag.cell.kind === 'item') for (const { r, c, cell } of game.items()) if (game.same(cell, drag.cell) && game.canMergeCell(cell) && !(r === drag.r && c === drag.c)) cellEls[r][c].classList.add('can');
      if (drag.cell.kind === 'crate') for (const x of game.crates()) if (!(x.r === drag.r && x.c === drag.c)) cellEls[x.r][x.c].classList.add('can');
      if (tutorialStep === 2) hideHand();
    }
    if (!drag.ghost) return;
    const a = $('#app').getBoundingClientRect();
    drag.ghost.style.left = (e.clientX - a.left) + 'px'; drag.ghost.style.top = (e.clientY - a.top) + 'px';
    $$('.cell.target', board).forEach(d => d.classList.remove('target')); $$('.slot.target', storageEl).forEach(d => d.classList.remove('target'));
    const at = cellAt(e.clientX, e.clientY);
    if (at && !(at[0] === drag.r && at[1] === drag.c)) { const cc = game.at(at[0], at[1]); if (cc !== undefined && !(cc && (cc.kind === 'fog' || cc.kind === 'wall'))) cellEls[at[0]][at[1]].classList.add('target'); }
    else if (drag.cell.kind === 'item') { const s = document.elementFromPoint(e.clientX, e.clientY); const slot = s && s.closest && s.closest('.slot'); if (slot && !slot.classList.contains('full') && !slot.classList.contains('buy')) slot.classList.add('target'); }
  });
  const endDrag = e => {
    if (!drag) return;
    const d = drag; drag = null;
    if (d.ghost) d.ghost.remove();
    clearMarks();
    if (!d.moved) { onTap(d.r, d.c, d.cell); return; }
    const at = cellAt(e.clientX, e.clientY);
    if (!at) {
      const s = document.elementFromPoint(e.clientX, e.clientY); const slot = s && s.closest && s.closest('.slot');
      if (d.cell.kind === 'item' && slot && !slot.classList.contains('full') && !slot.classList.contains('buy')) { const it = game.takeOut(d.r, d.c); if (it) { storageSet(+slot.dataset.slot, { chain: it.chain, lvl: it.lvl }); paintStorage(); sfx.pick(); describe(null); return; } }
      paintCell(d.r, d.c, 'land'); return;
    }
    const res = game.drop(d.r, d.c, at[0], at[1]);
    if (res === 'none') { paintCell(d.r, d.c, 'land'); sfx.drop(); }
    if (res === 'merge' && d.cell.kind === 'item') describe(game.at(at[0], at[1]), at[0], at[1]);
  };
  board.addEventListener('pointerup', endDrag);
  board.addEventListener('pointercancel', endDrag);

  function onTap(r, c, cell) {
    if (hammerMode) {
      if (cell.kind === 'item' && game.canMergeCell(cell) && game.isFree(cell)) { if (!spend(HAMMER_COST)) { sfx.error(); toast(t('notEnoughCoins'), { icon: I.coin() }); } else { paintCoins(); game.hammer(r, c); } }
      setHammer(false); return;
    }
    if (cell.kind === 'gen') { if (!cell.auto) game.spawn(r, c); describe(game.at(r, c)); return; }
    if (cell.kind === 'crate') { game.tap(r, c); const now = game.at(r, c); describe(now && now.kind === 'crate' ? now : null); return; }
    if (cell.locked) once('hint:locked', () => toast(t('hintLocked'), { icon: I.lock(), ms: 2800 }));
    const res = game.tap(r, c);
    if (res) { describe(null); return; }
    sfx.tap();
    const tl = cellEls[r][c].firstChild; if (tl) tl.classList.add('sel');
    describe(cell, r, c);
  }
  function doDeliver(i) { if (locked) return; const res = game.deliver(i); if (!res) { sfx.error(); shake(orderEls[i]); } }

  // ---------- boosters ----------
  const setHammer = on => { hammerMode = on; boostHammer.classList.toggle('on', on); $$('.tile.hammerable', board).forEach(d => d.classList.remove('hammerable')); if (on) { for (const { r, c, cell } of game.items()) if (game.canMergeCell(cell) && game.isFree(cell)) cellEls[r][c].firstChild.classList.add('hammerable'); setInfo(`${I.hammer()}<span>${t('hammerHint')}</span>`); } };
  boostHammer.onclick = () => { sfx.tap(); if (state.coins < HAMMER_COST) { if (gems() >= GEM.hammer) { modal({ title: t('hammer'), body: el('div', { class: 'win-story' }, t('payWithGems', GEM.hammer)), actions: [{ label: t('cancel'), cls: 'light' }, { html: `${gemIcon()}<span>${GEM.hammer}</span>`, cls: 'purple', onClick: () => { if (spendGems(GEM.hammer)) { addCoins(HAMMER_COST); paintCoins(); setHammer(true); } } }] }); return; } sfx.error(); toast(t('notEnoughCoins'), { icon: I.coin() }); return; } setHammer(!hammerMode); };
  const buyEnergy = () => { const price = rescuePrice(); if (!spend(price)) { sfx.error(); toast(t('notEnoughCoins'), { icon: I.coin() }); return false; } rescues++; paintRescue(); paintCoins(); game.addCharges(5); locked = false; sfx.energy(); const r = chargeChip.getBoundingClientRect(), a = $('#app').getBoundingClientRect(); fx.sparkle(r.left + r.width / 2 - a.left, r.top + r.height / 2 - a.top, 14, '#ffd34d'); return true; };
  boostEnergy.onclick = () => { sfx.tap(); const body = el('div', { class: 'rescue' }); const m = modal({ title: t('energy'), body, closable: true }); body.append(el('button', { class: 'btn gold', onclick: () => { if (buyEnergy()) m.close(); } }, [el('span', { html: I.coin() }), `+5 · ${rescuePrice()}`])); body.append(el('button', { class: 'btn purple', onclick: () => { if (!refillBuy()) { sfx.error(); toast(t('notEnoughGems'), { icon: gemIcon() }); return; } m.close(); game.addCharges(GEM.refillEnergy); sfx.energy(); } }, [el('span', { html: gemIcon() }), `+${GEM.refillEnergy} · ${refillPrice()}`])); body.append(el('div', { class: 'eta' }, t('refillNext', refillCount() + 2, refillPrice(1)))); if (adsAvailable() && adsLeft('energy') > 0) body.append(el('button', { class: 'btn ghost', onclick: async () => { m.close(); const r = await showRewardedAd(); if (r.ok) { adUsed('energy'); game.addCharges(ADS.energyPerAd); sfx.energy(); toast(`+${ADS.energyPerAd} ⚡`, { icon: I.bolt() }); } } }, [el('span', { html: I.play() }), `${t('watchAd')} +${ADS.energyPerAd} (${adsLeft('energy')})`])); };
  boostX2.onclick = () => { sfx.tap(); if (stageN < 6 && !game.boost) { toast(t('needLevel', 6), { icon: I.lock() }); return; } game.setBoost(!game.boost); toast(game.boost ? t('boostOn') : t('boostOff'), { icon: I.sparkle() }); };
  boostRecharge.onclick = () => { sfx.tap(); if (stageN < 4) { toast(t('needLevel', 4), { icon: I.lock() }); return; } if (!game.gens().some(g => g.cell.charges < g.cell.max)) { toast(t('rechargeHint'), { icon: I.bolt() }); return; } if (state.coins < RECHARGE_COST) { if (gems() >= GEM.recharge) { modal({ title: t('recharge'), body: el('div', { class: 'win-story' }, t('payWithGems', GEM.recharge)), actions: [{ label: t('cancel'), cls: 'light' }, { html: `${gemIcon()}<span>${GEM.recharge}</span>`, cls: 'purple', onClick: () => { if (spendGems(GEM.recharge)) game.recharge(); } }] }); return; } sfx.error(); toast(t('notEnoughCoins'), { icon: I.coin() }); return; } spend(RECHARGE_COST); paintCoins(); game.recharge(); };
  boostHint.onclick = () => {
    sfx.tap(); lastInput = Date.now();
    const h = game.hint();
    $$('.tile.hinting', board).forEach(d => d.classList.remove('hinting'));
    if (!h) { const o = game.orders.find(x => !x.done); if (o) showNeed(o.items[0], orderEls[o.idx] && orderEls[o.idx].querySelector('.need')); for (const x of game.crates()) { const tl = cellEls[x.r][x.c].firstChild; if (tl) { tl.classList.add('hinting'); setTimeout(() => tl.classList.remove('hinting'), 2000); } } return; }
    for (const x of h) { const tl = cellEls[x.r][x.c].firstChild; tl.classList.add('hinting'); setTimeout(() => tl.classList.remove('hinting'), 2200); }
  };
  if (stageN === 6) once('hint:boost', () => setTimeout(() => toast(t('hintBoost'), { icon: I.sparkle(), ms: 2800 }), 1200));

  // ---------- chain sheet ----------
  function chainSheet(chain) {
    const ch = CHAINS[chain];
    const body = el('div', { class: 'chain' });
    body.append(el('div', { class: 'chain-gen', html: genIcon(chain) + `<span>${name(ch.gen.name)}</span>` }));
    ch.levels.forEach((lv, i) => { const known = discovered.has(chain + ':' + (i + 1)); body.append(el('div', { class: 'chain-item' + (known ? '' : ' unknown'), html: icon(chain, i + 1) + `<span>${known ? name(lv.name) : '???'}</span><b>${i + 1}</b>` })); });
    modal({ title: `${name(ch.name)} ${t('chainName')}`, body, closable: true });
  }

  // ---------- tutorial ----------
  let tut = null, hand = null;
  const hideHand = () => { if (hand) { hand.remove(); hand = null; } };
  function paintTutorial() {
    if (tut) { tut.remove(); tut = null; } hideHand();
    if (!tutorialStep) return;
    const tip = tutorialStep === 1 ? t('tutorial1') : tutorialStep === 2 ? t('tutorial2') : t('tutorial3');
    tut = el('div', { class: 'tutorial' }, el('div', { class: 'tip' }, tip)); root.append(tut);
    requestAnimationFrame(() => {
      if (tutorialStep === 1) {
        const g = level.gens[0]; const c = center(g.r, g.c);
        hand = el('div', { class: 'hand', html: I.hand(), style: { left: (c.x + 6) + 'px', top: (c.y + 8) + 'px' } }); $('#overlay').append(hand);
        cellEls[g.r][g.c].firstChild.classList.add('hint');
      } else if (tutorialStep === 2) {
        const h = game.hint(); if (!h) return;
        const a = center(h[0].r, h[0].c), b = center(h[1].r, h[1].c);
        hand = el('div', { class: 'hand drag', html: I.hand(), style: { left: (a.x + 6) + 'px', top: (a.y + 8) + 'px' } });
        hand.style.setProperty('--dx', (b.x - a.x) + 'px'); hand.style.setProperty('--dy', (b.y - a.y) + 'px');
        $('#overlay').append(hand);
        for (const x of h) cellEls[x.r][x.c].firstChild.classList.add('hinting');
      } else if (tutorialStep === 3) {
        const d = orderEls[0]; d.classList.add('hit');
        const b = d.getBoundingClientRect(), a = $('#app').getBoundingClientRect();
        hand = el('div', { class: 'hand', html: I.hand(), style: { left: (b.left + b.width / 2 - a.left + 10) + 'px', top: (b.bottom - a.top - 6) + 'px' } }); $('#overlay').append(hand);
      }
    });
  }
  if (tutorialStep) setTimeout(paintTutorial, 500);

  // ---------- pause / lose / win ----------
  function pause() {
    modal({ title: t('pause'), cls: 'dark', actions: [
      { label: t('resume'), cls: 'green' },
      { label: t('retry'), cls: 'light', onClick: () => app.go('play', isDaily ? { daily: true, retry: true } : { stage: stageN, retry: true }) },
      { label: t('home'), cls: 'ghost', onClick: () => app.go('hub') },
    ] });
  }
  // Rescue ladder: reserve (+5, free, regenerates) → coins (150 → 300 → 600 per stage) → retry → home.
  function loseFlow() {
    sfx.lose(); haptic([40, 60, 40]);
    if (isDaily) { modal({ title: t('outOfEnergy'), body: el('div', { class: 'win-story' }, t('dailyNoRescue')), actions: [{ label: t('retry'), cls: 'primary', onClick: () => app.go('play', { daily: true, retry: true }) }, { label: t('home'), cls: 'light', onClick: () => app.go('hub') }] }); return; }
    const reserve = reserveNow(), eta = reserveEta();
    const etaTxt = eta ? `${Math.floor(eta / 60000)}:${String(Math.floor((eta % 60000) / 1000)).padStart(2, '0')}` : '';
    const body = el('div', {}, [el('div', { class: 'win-story' }, t('noMoves')), el('div', { class: 'rewards', html: `<div class="reward">${I.coin()}<span>${fmt(state.coins)}</span></div><div class="reward reserve-r">${I.bolt()}<span>${reserve}/30</span></div>` })]);
    const rescue = el('div', { class: 'rescue' });
    body.append(rescue);
    const m = modal({ title: t('outOfEnergy'), body, actions: [{ label: t('retry'), cls: 'light', onClick: () => app.go('play', { stage: stageN }) }, { label: t('home'), cls: 'ghost', onClick: () => app.go('hub') }] });
    const useBtn = el('button', { class: 'btn green', disabled: reserve < 5, onclick: () => { if (useReserve(5)) { m.close(); game.addCharges(5); locked = false; sfx.energy(); } } }, [el('span', { html: I.bolt() }), `${t('useReserve')}`]);
    rescue.append(useBtn, el('div', { class: 'eta' }, reserve >= 5 ? t('reserveRegen') : `${t('reserveRegen')} · ${etaTxt}`));
    const gp = refillPrice();
    rescue.append(el('button', { class: 'btn purple', onclick: () => { if (!refillBuy()) { sfx.error(); toast(t('notEnoughGems'), { icon: gemIcon() }); app.go('shop', { tab: 'gems' }); return; } m.close(); game.addCharges(GEM.refillEnergy); locked = false; sfx.energy(); } }, [el('span', { html: gemIcon() }), `${t('refillEnergy')} +${GEM.refillEnergy} · ${gp}`]));
    // the button above is refill #(count+1) at refillPrice(); this line names the one after it
    rescue.append(el('div', { class: 'eta' }, t('refillNext', refillCount() + 2, refillPrice(1))));
    if (adsAvailable() && adsLeft('energy') > 0) rescue.append(el('button', { class: 'btn ghost', onclick: async () => { m.close(); const r = await showRewardedAd(); if (r.ok) { adUsed('energy'); game.addCharges(ADS.energyPerAd); locked = false; sfx.energy(); toast(`+${ADS.energyPerAd} ⚡`, { icon: I.bolt() }); } else loseFlow(); } }, [el('span', { html: I.play() }), `${t('watchAd')} +${ADS.energyPerAd} (${adsLeft('energy')})`]));
    rescue.append(el('button', { class: 'btn gold', onclick: () => { if (buyEnergy()) m.close(); } }, [el('span', { html: I.coin() }), `${t('buyEnergy')} · ${rescuePrice()}`]));
  }
  async function winFlow(stars, score) {
    sfx.win(); haptic([30, 50, 30, 50, 60]); fx.confetti(140);
    const coins = rewardFor(level, stars, score);
    const tierBefore = tierFor(state.stage);
    if (!isDaily) recordWin(stageN, stars, score);
    const tierAfter = tierFor(state.stage);
    track('win'); track('stars', stars); if (level.golden) track('golden');
    if (!isDaily) { try { rivals.onPlayerWin(stageN, { golden: level.golden, energyLeftFrac: game.charges / Math.max(1, level.charges), fitCheckWon, beatOrder }); } catch (e) { console.warn('race', e); } }
    try { const o = game.orders[0]; if (o) { const npc = npcByName(o.customer.name); setTimeout(() => toast(`${npc.name}: ${name(lineFor(npc, 'win', { hero: p.name }))}`, { ms: 2600 }), 900); } } catch (_) { /* optional */ }
    setCounter('styleMax', styleScore(state.equipped)); setCounter('setsMax', perks.sets.length);
    const newAch = checkAchievements(); for (const a of newAch) setTimeout(() => toast(`🏆 ${name(a.text)}`, { icon: I.trophy(), ms: 3000 }), 400);
    // pack-up: leftovers >= L3 into free storage slots, the rest sold at half price
    const freeSlots = (state.storage || []).filter(x => x === null).length;
    const pack = game.packUp(freeSlots);
    for (const it of pack.stored) { const i = state.storage.indexOf(null); if (i >= 0) storageSet(i, it); }
    if (pack.stored.length) once('hint:storage', () => toast(t('hintStorage'), { icon: I.lock(), ms: 3200 }));
    const storyIdx = Math.min(4, Math.floor((stageN - 1) / 8));
    const body = el('div', {}, [
      el('div', { html: starsRow(0) }),
      el('div', { class: 'win-story' }, t('storyWin')[storyIdx]),
      el('div', { class: 'quest-summary' }, game.quests.map(q => el('div', { class: 'qs' + (q.done ? ' done' : ''), html: I.star(q.done) + `<span>${questText(q)}</span>` }))),
      el('div', { class: 'rewards', html: `<div class="reward">${I.sparkle()}<span>${fmt(score)}</span></div><div class="reward">${I.coin()}<span>+${coins}</span></div>` }),
    ]);
    if (pack.stored.length || pack.coins) body.append(el('div', { class: 'packed', html: (pack.stored.length ? `<span>${t('packed')}:</span>` + pack.stored.map(it => icon(it.chain, it.lvl)).join('') : '') + (pack.coins ? `<span>+${pack.coins} ${t('leftovers')}</span>` : '') }));
    modal({ title: t('win'), body, actions: [{ html: `${I.gift(level.golden)}<span>${t('openGift')}</span>`, cls: 'gold', onClick: async () => { await gifts(); } }] });
    const starSvgs = body.querySelectorAll('.stars-row svg');
    for (let i = 0; i < stars; i++) { await sleep(260); starSvgs[i].classList.add('on'); sfx.coin(); }
    addCoins(coins + pack.coins); piggyAddWin(level.golden); if (level.golden) addGems(FREE_GEMS.goldenWin); paintCoins();
    if (adsAvailable() && adsLeft('double') > 0) { const dbl = el('button', { class: 'btn ghost sm', style: { marginTop: '8px' } }, [el('span', { html: I.play() }), `${t('watchAd')} ×2 (+${coins})`]); dbl.onclick = async () => { dbl.disabled = true; const r = await showRewardedAd(); if (r.ok) { adUsed('double'); addCoins(coins); paintCoins(); sfx.coin(); toast(`+${coins}`, { icon: I.coin() }); dbl.remove(); } else dbl.disabled = false; }; body.append(dbl); }

    async function gifts() {
      if (isDaily) { try { if (daily.dailyWinFlow) await daily.dailyWinFlow(stars); else daily.recordDailyWin(stars); } catch (e) { console.warn('daily', e); } app.go('hub', { say: t('storyWin')[storyIdx] }); return; }
      await giveGift(false);
      if (level.golden) await giveGift(true);
      app.go('hub', { say: t('storyWin')[storyIdx], tierUp: tierAfter !== tierBefore ? tierAfter : null });
    }
    async function giveGift(golden, rarity = null) {
      const lucky = !golden && !rarity && perks.giftLuck && Math.random() < perks.giftLuck ? 'epic' : null;
      const item = rollGift(stageN, p.gender, state.inventory, Math.random, rarity || lucky || (golden ? 'legendary' : null));
      if (!item) { addCoins(300); toast(`+300`, { icon: I.coin() }); return; }
      const dup = own(item.id);
      const dupCoins = valueOf(item);
      const choice = await giftFlow({ item, golden, dup, dupCoins, gender: p.gender, skin: p.skin, equipped: state.equipped });
      if (dup) { addCoins(dupCoins); return; }
      addItem(item.id);
      state.seen.newIds = [...new Set([...(state.seen.newIds || []), item.id])]; state.giftsOpened++; save();
      if (choice === 'wear') { equip(item.cat, item.id); if (item.cat === 'top' || item.cat === 'bottom') equip('outfit', null); }
    }
  }

  // ---------- golden stage: Fit Check vs the rival ahead (F3) ----------
  if (level.golden && !isDaily && !params.retry) {
    try {
      const fc = rivals.fitCheckFor(stageN);
      if (fc) {
        fitCheckWon = fc.won;
        rivalHard = game.orders.find(o => o.tier === 'hard') || null;
        if (fitCheckWon) { game.addCharges(3); if (rivalHard) { rivalHard.reward.coins = Math.round(rivalHard.reward.coins * 1.5); paintOrders(); } }
        rivals.markWorn(state.equipped);
        const rv = fc.rival, who = { gender: rv.gender, skin: rv.skin };
        const body = el('div', {}, [
          el('div', { class: 'win-story' }, `${fc.theme.emoji || '✨'} ${name(fc.theme.name)}`),
          el('div', { class: 'fitcheck' }, [
            el('div', { class: 'fc' }, [el('div', { class: 'fc-av', html: renderAvatarSafe(state.equipped, p) }), el('b', {}, p.name), el('span', {}, `${t('style')} ${Math.round(fc.player)}`)]),
            el('div', { class: 'fc-vs' }, 'VS'),
            el('div', { class: 'fc' }, [el('div', { class: 'fc-av', html: renderAvatarSafe(rivals.rivalLook(rv), who) }), el('b', {}, name(rv.name)), el('span', {}, `${t('style')} ${Math.round(fc.target)}`)]),
          ]),
          el('div', { class: 'win-story' }, fitCheckWon ? t('fitWin') : t('fitLose')),
          el('div', { class: 'tiny' }, name(fc.hint)),
        ]);
        modal({ title: t('fitCheck'), body, actions: [{ label: t('letsGo'), cls: 'primary' }] });
      }
    } catch (e) { console.warn('fitcheck', e); }
  }
  function renderAvatarSafe(eq, who) { try { return renderAvatar({ gender: who.gender, skin: who.skin, equipped: eq, mood: 2 }, { anim: false }); } catch (_) { return ''; } }
  describe(null);
  return () => { clearInterval(clock); window.removeEventListener('resize', onResize); hideHand(); };
}
