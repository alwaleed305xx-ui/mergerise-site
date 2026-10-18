// Hero creation: boy / girl, skin tone, name. The hero starts homeless.
import { el, haptic } from '../util.js';
import { t } from '../i18n.js';
import { state, save } from '../store.js';
import { renderAvatar } from '../avatar.js';
import { startingEquip, startingItems, getItem } from '../wardrobe.js';
import { SKIN } from '../art/_kit.js';
import { sfx } from '../audio.js';
import { I } from '../ui.js';
import { addGems, FREE_GEMS } from '../economy.js';

export function render(root, params, app) {
  root.classList.add('intro');
  const keep = !!params.keep;             // changing hero keeps inventory/progress
  let gender = (state.profile && state.profile.gender) || 'boy';
  let skin = state.profile ? state.profile.skin : 1;
  let nm = state.profile ? state.profile.name : '';

  const heroes = el('div', { class: 'heroes' });
  const cards = {};
  const paint = () => {
    for (const g of ['boy', 'girl']) {
      cards[g].classList.toggle('on', g === gender);
      cards[g].querySelector('.av').innerHTML = renderAvatar({ gender: g, skin, equipped: startingEquip(g), mood: g === gender ? 1 : 0 }, { anim: g === gender });
    }
    skinsRow.querySelectorAll('.skin').forEach((s, i) => s.classList.toggle('on', i === skin));
  };
  for (const g of ['boy', 'girl']) {
    cards[g] = el('div', { class: 'hero-card', onclick: () => { gender = g; sfx.pick(); haptic(); paint(); } }, [el('div', { class: 'av' }), el('div', { class: 'lbl' }, t(g))]);
    heroes.append(cards[g]);
  }
  const skinsRow = el('div', { class: 'skins' }, SKIN.map((c, i) => el('div', { class: 'skin', style: { background: c }, onclick: () => { skin = i; sfx.tap(); paint(); } })));
  const input = el('input', { class: 'input', placeholder: t('namePh'), maxlength: 14, value: nm, oninput: e => { nm = e.target.value; } });
  const go = el('button', { class: 'btn primary big pulse', onclick: () => {
    const nameV = (nm || '').trim() || (gender === 'girl' ? 'Emma' : 'Jake');
    const prev = state.profile;
    if (!prev) addGems(FREE_GEMS.welcome);
    state.profile = { gender, skin, name: nameV };
    if (!keep || !prev) {
      state.inventory = [...new Set([...(keep ? state.inventory : []), ...startingItems(gender)])];
      state.equipped = startingEquip(gender);
    } else {
      // keep progress; make sure rags for this gender exist and the hair fits
      for (const id of startingItems(gender)) if (!state.inventory.includes(id)) state.inventory.push(id);
      state.equipped.hair = startingEquip(gender).hair;
      const rags = startingEquip(gender);
      for (const cat of ['top', 'bottom', 'shoes', 'hat', 'glasses', 'acc', 'outfit', 'bg']) {
        const it = state.equipped[cat] && getItem(state.equipped[cat]);
        if (it && it.gender && it.gender !== 'any' && it.gender !== gender) state.equipped[cat] = rags[cat] || null;
      }
    }
    save(); sfx.win(); haptic([20, 30, 20]);
    app.go('hub', { first: !keep });
  } }, [el('span', { html: I.play() }), t('letsGo')]);

  root.append(
    el('h1', { class: 'logo', html: 'MERGE<span class="rise">RISE</span>' }),
    el('div', { class: 'title', style: { fontSize: '22px' } }, t('chooseHero')),
    heroes,
    el('div', { class: 'sub' }, t('skin')), skinsRow,
    input,
    el('div', { class: 'story' }, t('storyIntro')),
    go,
  );
  paint();
}
