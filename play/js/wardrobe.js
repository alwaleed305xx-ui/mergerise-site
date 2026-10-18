// Wardrobe registry: merges every art module's TEMPLATES + ITEMS into one catalog.
import { RARITY } from './art/_kit.js';
import { setResolver } from './avatar.js';
import * as tops from './art/tops.js';
import * as outfits from './art/outfits.js';
import * as bottoms from './art/bottoms.js';
import * as shoes from './art/shoes.js';
import * as hats from './art/hats.js';
import * as hair from './art/hair.js';
import * as glasses from './art/glasses.js';
import * as acc from './art/acc.js';
import * as bgs from './art/bg.js';

const MODULES = [tops, outfits, bottoms, shoes, hats, hair, glasses, acc, bgs];
const TEMPLATES = {};
const ITEMS = {};
export const CATALOG = [];
for (const m of MODULES) {
  Object.assign(TEMPLATES, m.TEMPLATES || {});
  for (const it of m.ITEMS || []) {
    if (ITEMS[it.id]) { console.warn('duplicate item id', it.id); continue; }
    if (!(m.TEMPLATES || {})[it.tpl]) { console.warn('item without template', it.id, it.tpl); continue; }
    Object.defineProperty(it, '__tpl', { value: m.TEMPLATES[it.tpl], enumerable: false });
    ITEMS[it.id] = it; CATALOG.push(it);
  }
}
setResolver(id => { const it = ITEMS[id]; return it ? { item: it, tpl: it.__tpl } : null; });
export const CATS = ['outfit', 'top', 'bottom', 'shoes', 'hat', 'hair', 'glasses', 'acc', 'bg'];
export const getItem = id => ITEMS[id] || null;
export const getTemplate = tpl => (tpl && typeof tpl === 'object') ? (tpl.__tpl || null) : (TEMPLATES[tpl] || null);
export const getTemplateFor = it => (it && it.__tpl) || null;
export const rarityOf = id => RARITY[getItem(id)?.rarity] || RARITY.common;
export const priceOf = it => it.price ?? RARITY[it.rarity]?.price ?? 250;
export const valueOf = it => it.value ?? RARITY[it.rarity]?.value ?? 60;
export const fitsGender = (it, gender) => !it.gender || it.gender === 'any' || it.gender === gender;
export const forGender = gender => CATALOG.filter(it => fitsGender(it, gender));
export const byCat = (cat, gender) => CATALOG.filter(it => it.cat === cat && fitsGender(it, gender));

// Starting look of a homeless hero.
export function startingItems(gender) {
  return ['top_rags', 'bottom_rags', gender === 'girl' ? 'hair_messyg_dull' : 'hair_messy_dull'];
}
export function startingEquip(gender) {
  const [top, bottom, hairId] = startingItems(gender);
  return { hair: hairId, top, bottom, shoes: null, hat: null, glasses: null, acc: null, outfit: null, bg: null };
}

// Style score = sum of equipped rarity values (rags count 0).
const STYLE_POINTS = { rags: 0, common: 40, rare: 110, epic: 260, legendary: 600 };
export function styleScore(equipped) {
  let s = 0;
  for (const id of Object.values(equipped || {})) { const it = id && getItem(id); if (it) s += STYLE_POINTS[it.rarity] || 0; }
  return s;
}
// fully ragged = still homeless-looking (both rag pieces, no outfit); one real piece already lifts the mood
export const wearingRags = equipped => !equipped?.outfit && equipped?.top === 'top_rags' && equipped?.bottom === 'bottom_rags';

// Gift pools. Scripted first gifts tell the story (clean tee → jeans → sneakers), then weighted random.
const SCRIPTED = { 1: ['top_tshirt_white', 'top_tshirt_sky'], 2: ['bottom_jeans_blue'], 3: ['shoes_sneaker_white'], 4: ['hat_cap_red', 'hat_cap_blue'] };
const CAT_WEIGHT = { top: 5, bottom: 4, shoes: 4, hat: 3, outfit: 2, acc: 2, glasses: 2, hair: 2, bg: 1 };
// Items that only come from a paid pack (never from gifts, boxes or the collection reward).
export const EXCLUSIVE = new Set(['top_jersey_gold']);
export function giftPool(stage, gender, owned, rarity = null) {
  const ownedSet = new Set(owned);
  return forGender(gender).filter(it => it.rarity !== 'rags' && !EXCLUSIVE.has(it.id) && !ownedSet.has(it.id) && (it.tier ?? 1) <= stage && (!rarity || it.rarity === rarity));
}
// strict = a forced rarity never falls back to a lower one (used by the paid premium box)
export function rollGift(stage, gender, owned, rnd = Math.random, forceRarity = null, strict = false) {
  const ownedSet = new Set(owned);
  const pool = giftPool(stage, gender, owned);
  if (!pool.length) return null;
  if (!forceRarity && SCRIPTED[stage]) {
    const pick = SCRIPTED[stage].find(id => !ownedSet.has(id) && getItem(id) && fitsGender(getItem(id), gender));
    if (pick) return getItem(pick);
  }
  const late = Math.min(1, stage / 40);
  const rw = forceRarity ? { [forceRarity]: 1 } : { common: 60 - 30 * late, rare: 28 + 10 * late, epic: 10 + 14 * late, legendary: 2 + 6 * late };
  const weighted = pool.map(it => ({ it, w: (rw[it.rarity] || 0) * (CAT_WEIGHT[it.cat] || 1) })).filter(x => x.w > 0);
  if (!weighted.length) return forceRarity ? (strict ? null : rollGift(stage, gender, owned, rnd, null)) : pool[Math.floor(rnd() * pool.length)];
  let total = weighted.reduce((a, x) => a + x.w, 0), r = rnd() * total;
  for (const x of weighted) { r -= x.w; if (r <= 0) return x.it; }
  return weighted[weighted.length - 1].it;
}
