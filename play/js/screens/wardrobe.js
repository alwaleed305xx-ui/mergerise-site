// Wardrobe: preview + category tabs + item grid (owned → equip, locked → buy).
// F1 header strip (js/style.js): theme pill, Auto-dress with undo, sort Best-for/Newest/Rarity,
// filters New/Never worn/Set, EN+AR search, "+N" theme-delta badges, saved looks (3 free, +1 per 300c, max 9).
import { el, $, haptic, fmt } from '../util.js';
import { t, name } from '../i18n.js';
import { state, save, own, addItem, spend, equip } from '../store.js';
import { renderAvatar, moodFor } from '../avatar.js';
import { CATS, byCat, styleScore, wearingRags, priceOf, getItem } from '../wardrobe.js';
import { sfx } from '../audio.js';
import { I, modal, toast, itemCard, bump, itemThumb } from '../ui.js';
import { fx } from '../particles.js';
import { sceneSVG } from './hub.js';
import { ALL_SETS, setProgress, setsOfItem } from '../sets.js';
import { THEMES, themeById, weekTheme, themeScore, themeStars, fmtStars, bestLook, itemDelta, sameLook, neverWorn, looks, saveLook, deleteLook, lookSlotPrice, buyLookSlot, wearLook, lookName, SLOTS } from '../style.js';

const CAT_ICON = { outfit: I.sparkle, top: I.hanger, bottom: I.hanger, shoes: I.hanger, hat: I.hanger, hair: I.hanger, glasses: I.hanger, acc: I.sparkle, bg: I.home };
// strings of this screen's F1 strip (bilingual, rendered with name())
const S = {
  autoDress: { en: 'Auto-dress', ar: 'لبّسني' }, dressed: { en: 'Dressed for', ar: 'تلبّست لـ' }, alreadyBest: { en: 'This is already your best look', ar: 'هذا أفضل لوك عندك' },
  noTheme: { en: 'No theme', ar: 'بدون ثيم' }, pickTheme: { en: 'Dress for a theme', ar: 'تلبّس لثيم' }, thisWeek: { en: 'This week', ar: 'هذا الأسبوع' }, inBook: { en: 'in your Lookbook', ar: 'في دفتر الإطلالات' },
  sort: { en: 'Sort', ar: 'ترتيب' }, bestFor: { en: 'Best for', ar: 'الأنسب' }, newest: { en: 'Newest', ar: 'الأحدث' }, rarity: { en: 'Rarity', ar: 'الندرة' },
  fNew: { en: 'New', ar: 'جديد' }, fUnworn: { en: 'Never worn', ar: 'ما لبسته' }, fSet: { en: 'Set', ar: 'طقم' }, search: { en: 'Search clothes…', ar: 'ابحث عن لبس…' }, noMatch: { en: 'Nothing matches', ar: 'ما فيه نتائج' },
  looks: { en: 'Looks', ar: 'لوكات' }, lookSaved: { en: 'Look saved', ar: 'حُفظ اللوك' }, lookOn: { en: 'Look on', ar: 'لبست اللوك' }, holdHint: { en: 'Tap to wear · hold to overwrite', ar: 'اضغط للبس · مطوّلًا للاستبدال' },
  overwrite: { en: 'Overwrite with current outfit', ar: 'استبدله باللبس الحالي' }, deleteLook: { en: 'Delete look', ar: 'احذف اللوك' }, slotBought: { en: 'New look slot', ar: 'خانة لوك جديدة' }, maxSlots: { en: 'All 9 slots unlocked', ar: 'فتحت كل الخانات التسع' },
  emptySlot: { en: 'Tap + to save your current outfit', ar: 'اضغط + لحفظ لبسك الحالي' },
};

export function render(root, params, app) {
  root.classList.add('ward');
  const p = state.profile;
  let cat = params.cat || 'top';
  const newIds = new Set(state.seen.newIds || []);
  // F1 strip state: theme (week's Fit Check theme or params.theme), sort, filters, search, looks strip
  let theme = themeById(params.theme) || weekTheme();
  let themeOn = params.theme !== null && params.theme !== false;
  let sort = params.theme ? 'best' : (params.sort || 'rarity');
  const filters = { new: false, unworn: false, set: false };
  let q = '';
  let looksOpen = looks().some(Boolean);

  const scene = el('div', { class: 'scene', html: sceneSVG(state.equipped) });
  const av = el('div', { class: 'av' });
  const styleChip = el('div', { class: 'chip stylebox', html: I.sparkle() + `<span>0</span>` });
  const preview = el('div', { class: 'ward-preview' }, [scene, av, styleChip]);
  const setsBar = el('div', { class: 'sets-bar' });
  const paintSets = () => { setsBar.innerHTML = ''; for (const s of ALL_SETS) { const pr = setProgress(s, state.equipped); if (!pr.count) continue; setsBar.append(el('span', { class: 'setchip' + (pr.active ? ' on' : ''), title: name(s.perk.text), onclick: () => { sfx.tap(); toast(`${s.emoji} ${name(s.name)}: ${name(s.perk.text)}`, { ms: 2600 }); } }, `${s.emoji} ${pr.count}/${pr.need}`)); } if (!setsBar.children.length) setsBar.append(el('span', { class: 'tiny' }, t('setsHint'))); };
  const coinChip = el('div', { class: 'chip gold', html: I.coin() + `<span>${fmt(state.coins)}</span>` });
  const goBack = () => { sfx.tap(); if (params.back) app.go(params.back, { ...(params.stage != null ? { stage: params.stage } : {}), ...(params.backParams || {}) }); else app.go('hub'); };
  const top = el('div', { class: 'topbar', style: { position: 'absolute', left: 0, right: 0, zIndex: 3 } }, [
    el('button', { class: 'btn icon ghost', onclick: goBack }, el('span', { html: I.back() })),
    el('div', { class: 'title', style: { fontSize: '20px' } }, t('wardrobe')),
    el('div', { class: 'spacer' }), coinChip,
  ]);
  const tabs = el('div', { class: 'tabs' });
  const grid = el('div', { class: 'grid-items' });

  // ---------- F1 header strip ----------
  const themePill = el('button', { class: 'theme-pill', onclick: () => { sfx.tap(); chooseTheme(); } });
  const autoBtn = el('button', { class: 'btn sm purple', onclick: () => autoDress() }, [el('span', { html: I.sparkle() }), name(S.autoDress)]);
  // the looks row swaps in for the chip row (never a third row, so the grid keeps its height); the 👗 chip leads both rows
  const looksBtn = el('button', { class: 'fchip looks', onclick: () => { sfx.tap(); looksOpen = !looksOpen; paintChips(); paintLooks(); } }, '👗');
  const chips = el('div', { class: 'sh-chips' });
  const search = el('input', { class: 'sh-search hidden', type: 'search', placeholder: name(S.search), autocomplete: 'off', oninput: e => { q = e.target.value.trim().toLowerCase(); paintChips(); paintGrid(); } });
  const looksStrip = el('div', { class: 'looks-strip hidden' });
  const head = el('div', { class: 'style-head' }, [el('div', { class: 'sh-row' }, [themePill, autoBtn]), chips, search, looksStrip]);

  const curStars = () => themeStars(themeScore(state.equipped, theme), state.stage);
  const paintPill = () => {
    themePill.innerHTML = '';
    themePill.classList.toggle('off', !themeOn);
    if (!themeOn) { themePill.append(el('span', { class: 'em' }, '🎯'), el('span', { class: 'tn' }, name(S.noTheme))); return; }
    themePill.append(el('span', { class: 'em' }, theme.emoji), el('span', { class: 'tn' }, name(theme.name)), el('span', { class: 'ts' }, `${fmtStars(curStars())}★`));
  };
  const chooseTheme = () => {
    const wk = weekTheme();
    const list = el('div', { class: 'theme-list' });
    let m;
    for (const th of THEMES) {
      const st = fmtStars(themeStars(themeScore(state.equipped, th), state.stage));
      const row = el('div', { class: 'theme-row' + (themeOn && th.id === theme.id ? ' on' : ''), onclick: () => { sfx.tap(); theme = th; themeOn = true; if (sort === 'rarity') sort = 'best'; m.close(); paintAll(); } }, [
        el('span', { class: 'em' }, th.emoji),
        el('div', { class: 'tt' }, [el('span', {}, [name(th.name), ' ', th.id === wk.id ? el('span', { class: 'lb-week' }, name(S.thisWeek)) : null]), el('small', {}, name(th.brief))]),
        el('span', { class: 'st' }, `${st}★`),
      ]);
      list.append(row);
    }
    list.append(el('div', { class: 'theme-row off' + (!themeOn ? ' on' : ''), onclick: () => { sfx.tap(); themeOn = false; if (sort === 'best') sort = 'rarity'; m.close(); paintAll(); } }, [el('span', { class: 'em' }, '🎯'), el('div', { class: 'tt' }, name(S.noTheme))]));
    m = modal({ title: name(S.pickTheme), body: list, closable: true });
  };
  const autoDress = () => {
    const th = themeOn ? theme : weekTheme();
    const prev = { ...state.equipped };
    const best = bestLook(th, state.inventory, p.gender, { current: state.equipped });
    if (sameLook(best, prev)) { sfx.tap(); toast(name(S.alreadyBest), { icon: I.sparkle() }); return; }
    for (const k of SLOTS) state.equipped[k] = best[k] || null;
    save();
    sfx.equip(); haptic([12, 20, 12]);
    const r = av.getBoundingClientRect(), a = $('#app').getBoundingClientRect();
    fx.sparkle(r.left + r.width / 2 - a.left, r.top + r.height / 2 - a.top, 22, '#fde68a');
    paintAvatar(); paintGrid(); paintLooks();
    toast(`${th.emoji} ${name(S.dressed)} ${name(th.name)} · ${fmtStars(themeStars(themeScore(state.equipped, th), state.stage))}★`, { icon: I.sparkle(), ms: 3600, action: { label: t('undo'), onClick: () => { Object.assign(state.equipped, prev); save(); sfx.drop(); paintAvatar(); paintGrid(); paintLooks(); } } });
  };
  const paintChips = () => {
    chips.innerHTML = '';
    chips.classList.toggle('hidden', looksOpen);
    const chip = (label, on, fn, cls = '') => el('button', { class: 'fchip ' + cls + (on ? ' on' : ''), onclick: () => { sfx.tap(); fn(); } }, label);
    looksBtn.classList.toggle('on', looksOpen);
    if (!looksOpen) chips.append(looksBtn, el('span', { class: 'sep' }));
    chips.append(el('span', { class: 'fchip lbl' }, name(S.sort)));
    chips.append(chip(name(S.bestFor), sort === 'best', () => { sort = 'best'; if (!themeOn) { themeOn = true; } paintAll(); }));
    chips.append(chip(name(S.newest), sort === 'newest', () => { sort = 'newest'; paintChips(); paintGrid(); }));
    chips.append(chip(name(S.rarity), sort === 'rarity', () => { sort = 'rarity'; paintChips(); paintGrid(); }));
    chips.append(el('span', { class: 'sep' }));
    chips.append(chip(name(S.fNew), filters.new, () => { filters.new = !filters.new; paintChips(); paintGrid(); }, 'filter'));
    chips.append(chip(name(S.fUnworn), filters.unworn, () => { filters.unworn = !filters.unworn; paintChips(); paintGrid(); }, 'filter'));
    chips.append(chip(name(S.fSet), filters.set, () => { filters.set = !filters.set; paintChips(); paintGrid(); }, 'filter'));
    chips.append(el('span', { class: 'sep' }));
    chips.append(chip('🔍' + (q ? ' ' + (q.length > 14 ? q.slice(0, 13) + '…' : q) : ''), !search.classList.contains('hidden'), () => { const open = search.classList.toggle('hidden'); if (!open) { try { search.focus(); } catch (_) { /* hidden pane */ } } else { search.value = ''; q = ''; paintGrid(); } paintChips(); }, 'filter'));
  };
  const lookThumb = lk => renderAvatar({ gender: p.gender, skin: p.skin, equipped: lk.equipped, mood: 2 }, { anim: false }).replace('viewBox="0 0 320 520"', 'viewBox="60 10 200 300"');
  const paintLooks = () => {
    const ls = looks();
    const filled = ls.filter(Boolean).length;
    looksBtn.textContent = `👗 ${name(S.looks)} ${filled}/${ls.length}`;
    looksBtn.classList.toggle('on', looksOpen);
    looksStrip.classList.toggle('hidden', !looksOpen);
    chips.classList.toggle('hidden', looksOpen);
    looksStrip.innerHTML = '';
    if (!looksOpen) { if (looksBtn.parentNode !== chips) chips.prepend(looksBtn); return; }
    looksStrip.append(looksBtn, el('span', { class: 'sep' }));
    ls.forEach((lk, i) => {
      const slot = el('button', { class: 'look-slot' + (lk ? ' full' : '') + (lk && sameLook(lk.equipped, state.equipped) ? ' on' : ''), title: lk ? name(lk.name || lookName(i)) : name(S.emptySlot) });
      if (lk) { slot.innerHTML = lookThumb(lk); slot.append(el('span', { class: 'idx' }, String(i + 1))); } else slot.append(el('span', { class: 'plus' }, '+'));
      let held = false, timer = null;
      const stop = () => { clearTimeout(timer); timer = null; };
      slot.addEventListener('pointerdown', () => { held = false; if (!lk) return; stop(); timer = setTimeout(() => { held = true; haptic([20, 30, 20]); lookMenu(i); }, 550); });
      for (const ev of ['pointerup', 'pointerleave', 'pointercancel']) slot.addEventListener(ev, stop);
      slot.addEventListener('click', () => {
        if (held) { held = false; return; }
        if (lk) { wearLook(lk, p.gender); sfx.equip(); haptic(12); paintAvatar(); paintGrid(); paintLooks(); toast(`${name(S.lookOn)} · ${name(lk.name || lookName(i))}`, { icon: I.check() }); }
        else { saveLook(i, state.equipped); sfx.coin(); haptic(12); paintLooks(); toast(`${name(S.lookSaved)} · ${name(S.holdHint)}`, { icon: I.check(), ms: 2600 }); }
      });
      looksStrip.append(slot);
    });
    const price = lookSlotPrice();
    if (price != null) looksStrip.append(el('button', { class: 'look-slot buy', onclick: () => { sfx.tap(); if (!buyLookSlot()) { sfx.error(); toast(t('notEnoughCoins'), { icon: I.coin() }); return; } sfx.coin(); coinChip.querySelector('span').textContent = fmt(state.coins); bump(coinChip); toast(name(S.slotBought), { icon: I.check() }); paintLooks(); } }, [el('span', { html: I.coin() }), String(price)]));
    if (!filled) looksStrip.append(el('span', { class: 'tiny' }, name(S.emptySlot)));
  };
  const lookMenu = i => {
    const lk = looks()[i]; if (!lk) return;
    modal({ title: name(lk.name || lookName(i)), body: el('div', { class: 'look-slot full', style: { width: '96px', height: '96px', margin: '0 auto', borderRadius: '22px' }, html: lookThumb(lk) }), closable: true, actions: [
      { label: name(S.overwrite), cls: 'gold', onClick: () => { saveLook(i, state.equipped); sfx.coin(); toast(name(S.lookSaved), { icon: I.check() }); paintLooks(); } },
      { label: name(S.deleteLook), cls: 'ghost', onClick: () => { deleteLook(i); sfx.drop(); paintLooks(); } },
    ] });
  };

  const paintAvatar = () => {
    const score = styleScore(state.equipped);
    av.innerHTML = renderAvatar({ gender: p.gender, skin: p.skin, equipped: state.equipped, mood: moodFor(score, wearingRags(state.equipped)) });
    styleChip.querySelector('span').textContent = score;
    scene.innerHTML = sceneSVG(state.equipped);
    paintSets(); paintPill();
  };
  const paintTabs = () => {
    tabs.innerHTML = '';
    for (const c of CATS) {
      const items = byCat(c, p.gender);
      const ownedN = items.filter(it => own(it.id)).length;
      const hasNew = items.some(it => newIds.has(it.id));
      const b = el('button', { class: 'tab' + (c === cat ? ' on' : ''), onclick: () => { cat = c; sfx.tap(); paintTabs(); paintGrid(); } }, [t('cat.' + c), el('span', { class: 'n' }, `${ownedN}/${items.length}`)]);
      if (hasNew) b.append(el('span', { class: 'badge', style: { position: 'static', marginInlineStart: '4px' } }, '!'));
      tabs.append(b);
    }
  };
  const doEquip = (it) => {
    const eq = state.equipped;
    if (eq[it.cat] === it.id) {
      // taking something off: the hero never goes naked — rags / messy hair come back
      equip(it.cat, it.cat === 'top' ? 'top_rags' : it.cat === 'bottom' ? 'bottom_rags' : it.cat === 'hair' ? (p.gender === 'girl' ? 'hair_messyg_dull' : 'hair_messy_dull') : null);
      sfx.drop();
    }
    else {
      equip(it.cat, it.id);
      if (it.cat === 'outfit') { /* top & bottom stay stored but hidden */ }
      if (it.cat === 'top' || it.cat === 'bottom') equip('outfit', null);
      sfx.equip(); haptic(12);
      const r = av.getBoundingClientRect(), a = $('#app').getBoundingClientRect();
      fx.sparkle(r.left + r.width / 2 - a.left, r.top + r.height / 2 - a.top, 14, '#fff');
    }
    paintAvatar(); paintGrid(); paintLooks();
  };
  const buy = (it) => {
    const price = priceOf(it);
    modal({ title: name(it.name), body: el('div', {}, [el('div', { class: 'th', style: { width: '140px', height: '140px', margin: '0 auto', borderRadius: '18px', background: 'rgba(255,255,255,.1)', overflow: 'hidden' }, html: itemThumb(it, p.gender, p.skin, state.equipped) }), el('div', { class: 'rarity', style: { background: `var(--r-${it.rarity})` } }, t('rarity.' + it.rarity)), el('div', { class: 'reward', style: { marginTop: '10px' }, html: I.coin() + `<span>${price}</span>` })]), closable: true,
      actions: [{ label: t('cancel'), cls: 'light' }, { label: t('buy'), cls: 'gold', onClick: () => {
        if (!spend(price)) { sfx.error(); toast(t('notEnoughCoins'), { icon: I.coin() }); return; }
        addItem(it.id); sfx.coin(); toast(t('bought'), { icon: I.check() }); coinChip.querySelector('span').textContent = fmt(state.coins); bump(coinChip);
        doEquip(it);
      } }] });
  };
  const matches = it => !q || name(it.name).toLowerCase().includes(q) || (it.name && typeof it.name === 'object' && Object.values(it.name).some(v => String(v).toLowerCase().includes(q)));
  const paintGrid = () => {
    grid.innerHTML = '';
    let items = byCat(cat, p.gender).filter(it => it.rarity !== 'rags' || own(it.id));
    const all = items.length;
    if (q) items = items.filter(matches);
    if (filters.new) items = items.filter(it => newIds.has(it.id));
    if (filters.unworn) items = items.filter(it => own(it.id) && neverWorn(it.id));   // owned-but-never-worn only (state.worn only ever holds owned pieces)
    if (filters.set) items = items.filter(it => setsOfItem(it).length > 0);
    const ownedItems = items.filter(it => own(it.id)), locked = items.filter(it => !own(it.id));
    const order = { legendary: 0, epic: 1, rare: 2, common: 3, rags: 4 };
    const delta = new Map();
    if (themeOn) for (const it of items) delta.set(it.id, Math.round(itemDelta(it, state.equipped, theme)));
    const inv = state.inventory || [];
    if (sort === 'best' && themeOn) { ownedItems.sort((a, b) => (delta.get(b.id) - delta.get(a.id)) || (order[a.rarity] - order[b.rarity])); locked.sort((a, b) => (delta.get(b.id) - delta.get(a.id)) || (a.tier - b.tier)); }
    else if (sort === 'newest') { ownedItems.sort((a, b) => inv.indexOf(b.id) - inv.indexOf(a.id)); locked.sort((a, b) => (a.tier - b.tier) || (order[a.rarity] - order[b.rarity])); }
    else { ownedItems.sort((a, b) => order[a.rarity] - order[b.rarity]); locked.sort((a, b) => (a.tier - b.tier) || (order[a.rarity] - order[b.rarity])); }
    if (!all) grid.append(el('div', { class: 'empty' }, t('wardrobeEmpty')));
    else if (!items.length) grid.append(el('div', { class: 'empty' }, name(S.noMatch)));
    const withDelta = (card, it) => { const d = delta.get(it.id); if (themeOn && d) card.append(el('span', { class: 'delta' + (d > 0 ? '' : ' down') }, (d > 0 ? '+' : '') + d)); return card; };
    for (const it of ownedItems) grid.append(withDelta(itemCard(it, { owned: true, equipped: state.equipped[it.cat] === it.id, isNew: newIds.has(it.id), gender: p.gender, skin: p.skin, baseEq: state.equipped, badge: setsOfItem(it).map(s => s.emoji).join(''), onClick: () => doEquip(it) }), it));
    if (locked.length) grid.append(el('div', { class: 'section-title' }, `${t('shop')} · ${locked.length}`));
    for (const it of locked) grid.append(withDelta(itemCard(it, { owned: false, gender: p.gender, skin: p.skin, price: priceOf(it), baseEq: state.equipped, badge: setsOfItem(it).map(s => s.emoji).join(''), onClick: () => { sfx.tap(); buy(it); } }), it));
    // clear NEW marks for this category
    const before = (state.seen.newIds || []).length;
    state.seen.newIds = (state.seen.newIds || []).filter(id => { const it = getItem(id); return it && it.cat !== cat; });
    if (before !== state.seen.newIds.length) save();
  };
  const paintAll = () => { paintPill(); paintChips(); paintGrid(); };
  root.append(top, preview, setsBar, head, tabs, grid);
  paintAvatar(); paintTabs(); paintChips(); paintLooks(); paintGrid();
}
