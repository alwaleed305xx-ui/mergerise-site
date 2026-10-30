// Shop: Deals (starter pack, 30-day pass, bonus piggy, today's featured pieces, gems→coins) · Gems · clothes by category.
// Compliance notes: store-localised prices when available, no fake 'popular' badges (best value is computed),
// the pass is a one-time 30-day purchase (no auto-renewal), nothing is sold at random (featured pieces show the exact item first),
// gem prices carry a real-money reference, and payments are disabled (not mocked) on store builds without the
// store plugin. Native (App Store on iOS, Google Play on Android): store prices (priceString) only; a product the store
// did not return is hidden; '…' while the prices load. The demo-checkout note shows on the web build only. Restore
// Purchases sits at the bottom whenever the store is active (both platforms).
import { el, $, haptic, fmt, rng, todayKey } from '../util.js';
import { t, name, getLang } from '../i18n.js';
import { state, save, own, addItem, spend, equip, addCoins } from '../store.js';
import { CATS, byCat, forGender, priceOf, getItem, giftPool } from '../wardrobe.js';
import { PRODUCTS, GEM, PIGGY, PASS, gems, spendGems, piggyGems, passActive, passDaysLeft, starterAvailable, bestValueId, granted, gemRef } from '../economy.js';
import { buy, isMock, canPay, priceLabel, entryPrice, providerName, productShown, purchasable, loadPrices, restorePurchases, storeUnavailable, pollPurchases } from '../payments.js';
import { openLegal } from '../legal.js';
import { sfx } from '../audio.js';
import { I, modal, toast, itemCard, itemThumb, rarityColor } from '../ui.js';
import { fx } from '../particles.js';

export const gemIcon = () => `<svg viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg"><path d="M9 4h14l6 8-13 17L3 12z" fill="#22d3ee" stroke="#0e7490" stroke-width="2.2" stroke-linejoin="round"/><path d="M3 12h26M9 4l4 8 3-8 3 8 4-8M13 12l3 17 3-17" fill="none" stroke="#0e7490" stroke-width="1.6" opacity=".8"/><path d="M10 6l3 5" stroke="#fff" stroke-width="2.4" stroke-linecap="round" opacity=".8"/></svg>`;
// "≈ <money>" for a gem amount, from the entry pack's store price; empty until a real price is known (never USD on native)
const approx = n => { const e = entryPrice(); return e ? `≈ ${gemRef(n, e.price, e.currency, getLang() === 'ar' ? 'ar-SA' : 'en-US')}` : ''; };

// Restore Purchases (Settings and the bottom of the Shop): toasts the restored count; a cancelled store sign-in stays silent
export async function runRestore(btn) {
  if (btn) btn.disabled = true;
  toast(t('restoring'), { icon: I.check() });
  let r;
  try { r = await restorePurchases(); } catch (_) { r = { ok: false, error: 'failed' }; }
  if (btn) btn.disabled = false;
  if (r.ok) toast(t('restoredCount', r.restored || 0), { icon: I.check(), ms: 2600 });
  else if (r.error !== 'cancelled') toast(t('restoreFailed'), { icon: I.lock() });
  return r;
}

export function render(root, params, app) {
  root.classList.add('ward');
  const p = state.profile;
  let cat = params.tab || 'deals';
  let alive = true;   // false once the player leaves the shop (async store answers must not repaint a dead screen)
  const coinChip = el('div', { class: 'chip gold', html: I.coin() + `<span>${fmt(state.coins)}</span>` });
  const gemChip = el('div', { class: 'chip gem', html: gemIcon() + `<span>${fmt(gems())}</span>` });
  const paintChips = () => { coinChip.querySelector('span').textContent = fmt(state.coins); gemChip.querySelector('span').textContent = fmt(gems()); };
  const top = el('div', { class: 'topbar' }, [
    el('button', { class: 'btn icon ghost', onclick: () => { sfx.tap(); app.go('hub'); } }, el('span', { html: I.back() })),
    el('div', { class: 'title', style: { fontSize: '20px' } }, t('shop')),
    el('div', { class: 'spacer' }), gemChip, coinChip,
  ]);
  const tabs = el('div', { class: 'tabs' });
  const grid = el('div', { class: 'grid-items' });

  // ---------- real-money checkout (store or demo) ----------
  const ui = { confirmMock: (product) => new Promise(res => modal({ title: t('checkout'), body: el('div', {}, [el('div', { class: 'win-story' }, t('mockCheckout')), el('div', { class: 'reward', style: { marginTop: '8px' }, html: `<b>${priceLabel(product)}</b>` })]), closable: true, onClose: () => res(false), actions: [{ label: t('cancel'), cls: 'light', onClick: () => res(false) }, { label: t('pay'), cls: 'gold', onClick: () => res(true) }] })) };
  let paying = false;
  const purchase = async (id) => {
    sfx.tap();
    if (!canPay()) { toast(t('paymentsOff'), { icon: I.lock() }); return; }
    if (paying) return;
    paying = true;
    let res;
    try { res = await buy(id, ui); } catch (_) { res = { ok: false, error: 'failed' }; }
    paying = false;
    if (!alive) return;
    if (!res.ok) {
      // a cancel (store sheet or demo checkout) stays silent; Ask to Buy / a pending Play payment arrives later.
      // 'already-owned' is silent here: payments.js already said "restored" when Google Play gave the product back
      // (an owned product Play still lists as pending comes back as 'pending'; one that did not come back as 'failed').
      if (res.error === 'pending') toast(t('purchasePending'), { icon: I.check(), ms: 3200 });
      else if (res.error === 'payments-disabled') toast(t('paymentsOff'), { icon: I.lock() });
      else if (res.error === 'unavailable') toast(t('billingUnavailable'), { icon: I.lock(), ms: 3200 });
      else if (res.error && !['cancelled', 'already-owned', 'busy'].includes(res.error)) toast(t('purchaseFailed'), { icon: I.lock() });
      paintChips(); paintGrid();
      return;
    }
    sfx.legendary(); haptic([20, 30, 40]); const a = $('#app').getBoundingClientRect(); fx.confetti(90); fx.coins(a.width / 2, a.height / 2, 14);
    paintChips(); toast(res.gems ? `${t('thanks')} +${res.gems} 💎` : t('thanks'), { icon: I.check() });
    paintGrid();
  };
  // null when the store does not offer the product (hidden, never a USD fallback on native)
  const payBtn = (prod, cls = 'gold', extra = '') => productShown(prod.id) ? el('button', { class: 'btn sm ' + cls, disabled: !purchasable(prod.id), onclick: () => purchase(prod.id) }, `${priceLabel(prod)}${extra}`) : null;

  // ---------- today's featured pieces: the exact item (picture, name, rarity, price) is shown before any gem is
  // spent. Nothing in the shop is random (the old random Premium Box was removed: no loot boxes). The picks are saved
  // with the day (state.featured), so gifts, purchases or a new stage never swap them before local midnight; a piece
  // the player already owns shows as owned until the next day's pick.
  const featured = () => {
    const day = todayKey();
    if (!state.featured || state.featured.day !== day || state.featured.gender !== p.gender) {
      const cap = Math.max(state.stage, 10);
      const pick = rarity => {
        const pool = giftPool(cap, p.gender, state.inventory, rarity);
        if (!pool.length) return null;
        let h = 2166136261; for (const ch of day + rarity) h = Math.imul(h ^ ch.charCodeAt(0), 16777619) >>> 0;
        return pool[h % pool.length].id;
      };
      state.featured = { day, gender: p.gender, epic: pick('epic'), legendary: pick('legendary') };
      save();
    }
    return [state.featured.epic, state.featured.legendary].map(id => id && getItem(id)).filter(Boolean);
  };

  // ---------- clothes purchase (coins, or gems for epic/legendary at the same rate) ----------
  const buyItem = (it, coinPrice, old) => {
    const gemPrice = it.rarity === 'legendary' ? GEM.legendaryItem : it.rarity === 'epic' ? GEM.epicItem : null;
    const finish = () => { addItem(it.id); sfx.coin(); haptic([15, 20, 15]); state.seen.newIds = [...new Set([...(state.seen.newIds || []), it.id])]; save(); paintChips(); const a = $('#app').getBoundingClientRect(); fx.coins(a.width / 2, a.height / 2, 12);
      modal({ title: t('bought'), body: el('div', {}, [el('div', { class: 'th', style: { width: '150px', height: '150px', margin: '0 auto', borderRadius: '18px', background: 'rgba(255,255,255,.1)', overflow: 'hidden' }, html: itemThumb(it, p.gender, p.skin, state.equipped) }), el('div', { class: 'item-name' }, name(it.name))]),
        actions: [{ label: t('wearNow'), cls: 'green', onClick: () => { equip(it.cat, it.id); if (it.cat === 'top' || it.cat === 'bottom') equip('outfit', null); sfx.equip(); app.go('wardrobe', { cat: it.cat }); } }, { label: t('later'), cls: 'light', onClick: () => paintGrid() }] }); };
    const actions = [{ label: t('cancel'), cls: 'light' }, { html: `${I.coin()}<span>${coinPrice}</span>`, cls: 'gold', onClick: () => { if (!spend(coinPrice)) { sfx.error(); toast(t('notEnoughCoins'), { icon: I.coin() }); return; } finish(); } }];
    if (gemPrice) actions.push({ html: `${gemIcon()}<span>${gemPrice}</span>`, cls: 'purple', onClick: () => { if (!spendGems(gemPrice)) { sfx.error(); toast(t('notEnoughGems'), { icon: gemIcon() }); return; } finish(); } });
    modal({ title: name(it.name), closable: true, body: el('div', {}, [el('div', { class: 'th', style: { width: '140px', height: '140px', margin: '0 auto', borderRadius: '18px', background: 'rgba(255,255,255,.1)', overflow: 'hidden' }, html: itemThumb(it, p.gender, p.skin, state.equipped) }), el('div', { class: 'rarity', style: { background: rarityColor(it.rarity) } }, t('rarity.' + it.rarity)), old ? el('div', { class: 'tiny', html: `<s>${old}</s>` }) : null, gemPrice ? el('div', { class: 'tiny' }, `${gemPrice} 💎 ${approx(gemPrice)}`.trim()) : null]), actions });
  };

  // ---------- tabs ----------
  const paintTabs = () => {
    tabs.innerHTML = '';
    const mk = (c, label, cls = '') => el('button', { class: 'tab ' + cls + (c === cat ? ' on' : ''), onclick: () => { cat = c; sfx.tap(); paintTabs(); paintGrid(); } }, label);
    tabs.append(mk('deals', '🔥 ' + t('deals')), mk('gems', el('span', { class: 'row-c', html: gemIcon() + t('gems') }), 'gemtab'), mk('all', '★ ' + t('clothes')));
    for (const c of CATS) tabs.append(mk(c, t('cat.' + c)));
  };

  const productCard = (prod, { title, sub, icon, onBuy }) => {
    const best = prod.id === bestValueId(prod.kind);
    const d = el('div', { class: 'prod' + (best ? ' tag-best' : '') });
    if (best) d.append(el('span', { class: 'ptag' }, t('bestValue')));
    d.append(el('div', { class: 'picon', html: icon }));
    d.append(el('div', { class: 'ptitle' }, title));
    if (sub) d.append(el('div', { class: 'psub', html: sub }));
    d.append(el('button', { class: 'btn sm gold', disabled: !purchasable(prod.id), onclick: onBuy }, priceLabel(prod)));
    return d;
  };
  // bottom of the Deals and Gems tabs: legal links, store status notes, Restore Purchases
  const footer = () => {
    const note = txt => el('div', { class: 'tiny center', style: { gridColumn: '1/-1', opacity: .7 } }, txt);
    grid.append(el('div', { class: 'tiny center', style: { gridColumn: '1/-1', opacity: .8 } }, [el('a', { href: '#', onclick: e => { e.preventDefault(); openLegal('terms'); } }, t('terms')), ' · ', el('a', { href: '#', onclick: e => { e.preventDefault(); openLegal('privacy'); } }, t('privacy'))]));
    if (isMock()) grid.append(note(t('mockNote')));
    if (!canPay()) grid.append(note(t('paymentsOff')));
    else if (storeUnavailable()) grid.append(note(t('storeUnavailable')));
    if (providerName() === 'native') {
      const rb = el('button', { class: 'btn sm ghost', onclick: () => { sfx.tap(); runRestore(rb).then(() => { if (alive) { paintChips(); paintGrid(); } }); } }, `↻ ${t('restore')}`);
      grid.append(el('div', { class: 'center', style: { gridColumn: '1/-1' } }, rb));
    }
  };

  const paintGrid = () => {
    grid.innerHTML = '';
    if (cat === 'deals') {
      const starter = PRODUCTS.find(x => x.id === 'starter_pack');
      if (starterAvailable() && productShown(starter.id)) {
        const it = getItem(starter.item);
        grid.append(el('div', { class: 'deal starter' }, [
          el('div', { class: 'th', html: it ? itemThumb(it, p.gender, p.skin, state.equipped) : I.gift(true) }),
          el('div', { class: 't' }, [el('div', { class: 'dtitle' }, `🎁 ${t('starterPack')}`), el('div', { class: 'tiny', style: { color: '#fff' } }, t('starterContents', starter.coins, starter.gems, it ? name(it.name) : '')), el('div', { class: 'tiny', style: { color: '#fde68a' } }, t('onceOnly'))]),
          payBtn(starter),
        ]));
      }
      const pass = PRODUCTS.find(x => x.id === 'pass_30d');
      const active = passActive();
      if (active || productShown(pass.id)) grid.append(el('div', { class: 'deal pass' }, [
        el('div', { class: 'th', html: I.trophy() }),
        el('div', { class: 't' }, [el('div', { class: 'dtitle' }, `⭐ ${t('passTitle')}`), el('div', { class: 'tiny', style: { color: '#fff' } }, t('passPerks', PASS.dailyCoins, PASS.dailyGems)), el('div', { class: 'tiny' }, t('passOneTime')), active ? el('div', { class: 'tiny', style: { color: '#86efac' } }, `${t('passActive')} · ${passDaysLeft()} ${t('days')}`) : null]),
        payBtn(pass),
      ]));
      const piggy = PRODUCTS.find(x => x.id === 'piggy_break');
      const pg = piggyGems();
      // like the pass and the starter pack: shown only while the store can sell piggy_break (hidden with payments off)
      if (productShown(piggy.id)) grid.append(el('div', { class: 'deal piggy' }, [
        el('div', { class: 'th', html: gemIcon() }),
        el('div', { class: 't' }, [el('div', { class: 'dtitle' }, `🐷 ${t('piggyBank')}`), el('div', { class: 'tiny', style: { color: '#fff' } }, `${pg} / ${PIGGY.cap} 💎`), el('div', { class: 'bar', style: { height: '8px', background: 'rgba(255,255,255,.15)', borderRadius: '999px', marginTop: '4px', overflow: 'hidden' } }, el('i', { style: { display: 'block', height: '100%', width: Math.min(100, pg / PIGGY.cap * 100) + '%', background: 'var(--grad-gold)' } })), el('div', { class: 'tiny' }, t('piggyHint', PIGGY.perWin, PIGGY.cap, (state.purchases || []).includes('piggy_break') ? 0 : PIGGY.start))]),
        // the piggy_break grant (economy.piggyBreak) runs inside payments.grant, so a recovered transaction still pays out.
        // A fresh save starts at PIGGY.start (= minBreak), so the buy button is there on first launch (App Review).
        pg < PIGGY.minBreak ? el('span', { class: 'tiny', style: { color: '#fff', flexShrink: 0 } }, `${t('fillTo')} ${PIGGY.minBreak}`) : payBtn(piggy),
      ]));
      for (const it of featured()) {
        const gemPrice = it.rarity === 'legendary' ? GEM.legendaryItem : GEM.epicItem, owned = own(it.id);
        grid.append(el('div', { class: 'deal box' }, [
          el('div', { class: 'th', html: itemThumb(it, p.gender, p.skin, state.equipped) }),
          el('div', { class: 't' }, [el('div', { class: 'dtitle' }, `✨ ${t('featuredPiece')}`), el('div', { class: 'tiny', style: { color: '#fff' } }, `${name(it.name)} · ${t('rarity.' + it.rarity)}`), el('div', { class: 'tiny' }, owned ? t('featuredOwned') : t('featuredHint')), owned ? null : el('div', { class: 'tiny' }, `${gemPrice} 💎 ${approx(gemPrice)}`.trim())]),
          owned ? el('span', { class: 'tiny', style: { color: '#fff', flexShrink: 0 } }, '✓') : el('button', { class: 'btn sm purple', onclick: () => { sfx.tap(); buyItem(it, priceOf(it)); }, html: `${gemIcon()}<span>${gemPrice}</span>` }),
        ]));
      }
      // gems → coins exchange at the game's single rate
      grid.append(el('div', { class: 'deal' }, [
        el('div', { class: 'th', html: I.coin() }),
        el('div', { class: 't' }, [el('div', { class: 'dtitle' }, `🔁 ${t('exchange')}`), el('div', { class: 'tiny', style: { color: '#fff' } }, `${GEM.coinsPack.gems} 💎 → ${fmt(GEM.coinsPack.coins)} 🪙`), approx(GEM.coinsPack.gems) ? el('div', { class: 'tiny' }, approx(GEM.coinsPack.gems)) : null]),
        el('button', { class: 'btn sm purple', onclick: () => { if (!spendGems(GEM.coinsPack.gems)) { sfx.error(); toast(t('notEnoughGems'), { icon: gemIcon() }); return; } addCoins(GEM.coinsPack.coins); sfx.coin(); paintChips(); toast(`+${fmt(GEM.coinsPack.coins)}`, { icon: I.coin() }); }, html: `${gemIcon()}<span>${GEM.coinsPack.gems}</span>` }),
      ]));
      footer();
      return;
    }
    if (cat === 'gems') {
      for (const prod of PRODUCTS.filter(x => x.kind === 'gems' && productShown(x.id))) {
        grid.append(productCard(prod, { title: `${fmt(granted(prod))} 💎`, sub: prod.bonus ? `${t('bonus')} +${prod.bonus}%` : '', icon: gemIcon(), onBuy: () => purchase(prod.id) }));
      }
      const one = approx(1);
      grid.append(el('div', { class: 'section-title' }, t('gemUses')), el('div', { class: 'tiny', style: { gridColumn: '1/-1', color: '#fff', lineHeight: 1.7 } }, `⚡ ${t('refillEnergy')} +${GEM.refillEnergy}: ${GEM.refillLadder.join(' → ')} 💎 (${t('ladderNote')}) · 🔋 ${t('recharge')} ${GEM.recharge} 💎 · 🔨 ${t('hammer')} ${GEM.hammer} 💎 · 📦 ${t('buySlot')} ${GEM.storageSlot.join('/')} 💎 · ✨ ${t('rarity.epic')} ${GEM.epicItem} 💎 · 👑 ${t('rarity.legendary')} ${GEM.legendaryItem} 💎${one ? ` · ${t('approx')} 1 💎 ${one}` : ''}`));
      footer();
      return;
    }
    const dealPool = forGender(p.gender).filter(it => !own(it.id) && (it.rarity === 'rare' || it.rarity === 'epic' || it.rarity === 'legendary'));
    const R = rng(parseInt(todayKey().replace(/-/g, ''), 10));
    const deal = dealPool.length ? dealPool[Math.floor(R() * dealPool.length)] : null;
    if (deal && cat === 'all') {
      const dprice = Math.round(priceOf(deal) / 2);
      grid.append(el('div', { class: 'deal', onclick: () => { sfx.tap(); buyItem(deal, dprice, priceOf(deal)); } }, [
        el('div', { class: 'th', html: itemThumb(deal, p.gender, p.skin, state.equipped) }),
        el('div', { class: 't' }, [el('div', {}, `🔥 ${t('deal')}`), el('div', { style: { fontSize: '18px' } }, name(deal.name)), el('div', { class: 'old' }, `${priceOf(deal)}`), el('div', { class: 'row-c', style: { justifyContent: 'flex-start' }, html: I.coin() + `<b>${dprice}</b> · -50%` })]),
      ]));
    }
    const items = (cat === 'all' ? forGender(p.gender) : byCat(cat, p.gender)).filter(it => !own(it.id) && it.rarity !== 'rags' && it.id !== 'top_jersey_gold');
    const order = { legendary: 0, epic: 1, rare: 2, common: 3 };
    items.sort((a, b) => (order[a.rarity] - order[b.rarity]) || (a.tier - b.tier));
    if (!items.length) grid.append(el('div', { class: 'empty' }, t('allOwned')));
    for (const it of items.slice(0, cat === 'all' ? 60 : 400)) grid.append(itemCard(it, { owned: false, gender: p.gender, skin: p.skin, price: priceOf(it), baseEq: state.equipped, onClick: () => { sfx.tap(); buyItem(it, priceOf(it)); } }));
  };
  root.append(top, tabs, grid);
  paintTabs(); paintGrid();
  // store prices arriving, and purchases delivered outside the buy call (Ask to Buy approval, launch recovery, restore)
  const refresh = () => { if (alive) { paintChips(); if (cat === 'deals' || cat === 'gems') paintGrid(); } };
  window.addEventListener('mr:prices', refresh);
  window.addEventListener('mr:purchase', refresh);
  // Android also reads Play's purchases (throttled to one poll per 30 s; a no-op on iOS): a purchase finished on the Play
  // sheet after the watchdog released it arrives as soon as the shop is opened again
  if (providerName() === 'native') { loadPrices().catch(() => null); pollPurchases(); }
  return () => { alive = false; window.removeEventListener('mr:prices', refresh); window.removeEventListener('mr:purchase', refresh); };
}
