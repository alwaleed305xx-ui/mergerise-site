// Gift unboxing flow: tap the box, it shakes, bursts, reveals the item with rarity rays.
import { el, $, sleep, haptic } from './util.js';
import { t, name } from './i18n.js';
import { modal, giftBoxSVG, itemThumb, rarityColor, I } from './ui.js';
import { sfx } from './audio.js';
import { fx } from './particles.js';
import { lookbookGain } from './style.js';

const S = { lookbook: { en: 'Lookbook', ar: 'الإطلالات' } };

// returns Promise<'wear'|'later'>
export function giftFlow({ item, golden = false, dup = false, dupCoins = 0, gender, skin, equipped, title }) {
  return new Promise(resolve => {
    const stage = el('div', { class: 'gift-stage' });
    const box = el('div', { class: 'gift-box', html: giftBoxSVG(golden) });
    stage.append(box);
    const hint = el('div', { class: 'sub', style: { color: 'var(--muted)', fontWeight: 800 } }, t('tapToOpen'));
    const body = el('div', {}, [stage, hint]);
    const m = modal({ title: title || (golden ? t('goldenGift') : t('gift')), body, actions: [] });
    let taps = 0, opening = false;
    const open = async () => {
      opening = true;
      box.classList.add('open'); sfx.giftOpen(); haptic([20, 30, 60]);
      const r = box.getBoundingClientRect(), app = $('#app').getBoundingClientRect();
      const cx = r.left + r.width / 2 - app.left, cy = r.top + r.height / 2 - app.top;
      fx.burst(cx, cy, { count: golden ? 70 : 40, colors: golden ? ['#ffd34d', '#fff', '#f59e0b', '#fff3c4'] : undefined, speed: 520 });
      await sleep(420);
      box.remove();
      const rc = rarityColor(item.rarity);
      const rays = el('div', { class: 'rays', style: { '--ray': rc + '66' } }); rays.style.setProperty('--ray', rc + '66');
      const reveal = el('div', { class: 'reveal' });
      reveal.style.setProperty('--rc', rc);
      reveal.append(el('div', { class: 'thumb', html: itemThumb(item, gender, skin, equipped) }));
      stage.append(rays, reveal);
      if (item.rarity === 'legendary') { sfx.legendary(); fx.confetti(80); fx.rain('#ffd34d', 30); } else if (item.rarity === 'epic') { sfx.bigMerge(); fx.sparkle(cx, cy, 24, '#a855f7'); } else { sfx.goal(); fx.sparkle(cx, cy, 14); }
      hint.innerHTML = '';
      hint.append(el('div', { class: 'rarity', style: { '--rc': rc } }, t('rarity.' + item.rarity)));
      hint.querySelector('.rarity').style.setProperty('--rc', rc);
      hint.append(el('div', { class: 'item-name' }, name(item.name)));
      hint.append(el('div', { class: 'tiny' }, dup ? `${t('duplicate')} +${dupCoins}` : t('newItem')));
      // F1: the Lookbook page this piece would raise the most ("Lookbook: +0.4★ Comic Con") — every gift becomes a wardrobe visit
      let g = null; try { g = !dup && lookbookGain(item, equipped); } catch (_) { g = null; }
      if (g) hint.append(el('div', { class: 'tiny lb-gain' }, `${name(S.lookbook)}: +${g.delta.toFixed(1)}★ ${g.theme.emoji} ${name(g.theme.name)}`));
      const acts = el('div', { class: 'actions' });
      if (!dup && item.cat !== 'bg') acts.append(el('button', { class: 'btn green', onclick: () => { sfx.equip(); m.close(); resolve('wear'); } }, [el('span', { html: I.check() }), t('wearNow')]));
      if (!dup && item.cat === 'bg') acts.append(el('button', { class: 'btn green', onclick: () => { sfx.equip(); m.close(); resolve('wear'); } }, t('equip')));
      acts.append(el('button', { class: 'btn ' + (dup ? 'primary' : 'light'), onclick: () => { m.close(); resolve('later'); } }, dup ? t('great') : t('later')));
      m.el.append(acts);
    };
    box.addEventListener('pointerdown', () => {
      if (opening) return;
      taps++; sfx.giftShake(); haptic(15);
      box.classList.remove('shake1', 'shake2'); void box.offsetWidth; box.classList.add(taps % 2 ? 'shake1' : 'shake2');
      if (taps >= 2) open();
    });
  });
}
