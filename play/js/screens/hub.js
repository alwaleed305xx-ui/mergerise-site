// Home hub: the hero in their current home, progress, play / wardrobe / shop.
import { el, $, haptic, pick, fmt } from '../util.js';
import { t, name } from '../i18n.js';
import { state, save, tierFor, TIER_AT, canClaimDaily, claimDaily, addCoins, wonStages, reserveNow, reserveEta, addReserve, RESERVE_CAP } from '../store.js';
import { renderAvatar, moodFor } from '../avatar.js';
import { styleScore, wearingRags, getItem, getTemplateFor } from '../wardrobe.js';
import { TIER_SCENES } from '../art/bg.js';
import { sfx } from '../audio.js';
import { I, modal, toast, bump, coinsFly } from '../ui.js';
import { fx } from '../particles.js';
import { openSettings } from './settings.js';
import { gems, passSettle, starterAvailable } from '../economy.js';
import { PRODUCTS } from '../economy.js';
import { canPay, productShown, purchasable, priceLabel } from '../payments.js';
import { gemIcon } from './shop.js';
import { missions, claimMission, missionsClaimable, streakStatus, claimStreak, checkAchievements, setCounter } from '../missions.js';
import { activeSets } from '../sets.js';
import * as rivals from '../rivals.js';
import * as daily from '../daily.js';
import { streakStrip } from '../missions.js';
import { askIfDue } from '../review.js';
import { tourRow, enterStage } from '../tour.js';
import { entryCost, CITIES } from '../cities.js';

export function sceneSVG(equipped) {
  const bgId = equipped && equipped.bg;
  const it = bgId && getItem(bgId);
  const tpl = it && getTemplateFor(it);
  let inner = '';
  if (tpl) inner = (tpl(it.colors || {}, { gender: state.profile?.gender }, it) || {}).scene || '';
  else inner = (TIER_SCENES[tierFor(state.stage)] || TIER_SCENES[0])();
  return `<svg viewBox="0 0 360 640" preserveAspectRatio="xMidYMax slice" xmlns="http://www.w3.org/2000/svg">${inner}</svg>`;
}

let missionsOpen = false;   // the hub stack is tall: the missions list stays folded until something is claimable
export function render(root, params, app) {
  root.classList.add('hub');
  const p = state.profile;
  const tier = tierFor(state.stage);
  const score = styleScore(state.equipped);
  const mood = moodFor(score, wearingRags(state.equipped));

  const scene = el('div', { class: 'hub-scene', html: sceneSVG(state.equipped) });
  const avatar = el('div', { class: 'hub-avatar', html: renderAvatar({ gender: p.gender, skin: p.skin, equipped: state.equipped, mood }) });
  let bubble = null, bubbleT = 0;
  const say = txt => {
    if (bubble) bubble.remove();
    bubble = el('div', { class: 'bubble' }, txt); root.append(bubble);
    clearTimeout(bubbleT); bubbleT = setTimeout(() => { bubble && bubble.remove(); bubble = null; }, 2200);
  };
  avatar.addEventListener('pointerdown', () => {
    avatar.classList.remove('jump'); void avatar.offsetWidth; avatar.classList.add('jump');
    sfx.jump(); haptic(10);
    const r = avatar.getBoundingClientRect(), a = $('#app').getBoundingClientRect();
    fx.sparkle(r.left + r.width / 2 - a.left, r.top + r.height * 0.3 - a.top, 8);
    say(t('moodHints')[mood]);
  });

  const coinChip = el('div', { class: 'chip gold', id: 'coinChip', html: I.coin() + `<span>${fmt(state.coins)}</span>` });
  const gemChip = el('div', { class: 'chip gem', html: gemIcon() + `<span>${fmt(gems())}</span>`, onclick: () => { sfx.tap(); app.go('shop', { tab: 'gems' }); } });
  const reserveChip = el('div', { class: 'chip reserve', html: I.bolt() + `<span>${reserveNow()}/${RESERVE_CAP}</span><i></i>` });
  const paintReserve = () => { const n = reserveNow(); reserveChip.querySelector('span').textContent = `${n}/${RESERVE_CAP}`; const eta = reserveEta(); reserveChip.querySelector('i').textContent = eta ? ` ${Math.floor(eta / 60000)}:${String(Math.floor((eta % 60000) / 1000)).padStart(2, '0')}` : ''; };
  paintReserve(); const reserveTimer = setInterval(paintReserve, 1000);
  const styleChip = el('div', { class: 'chip', html: I.sparkle() + `<span>${score}</span>` });
  const top = el('div', { class: 'topbar' }, [
    el('div', { class: 'name-tag' }, p.name),
    el('div', { class: 'spacer' }),
    styleChip, reserveChip, gemChip, coinChip,
    el('button', { class: 'btn icon ghost', onclick: () => { sfx.tap(); openSettings(app); } }, el('span', { html: I.gear() })),
  ]);

  // home progress
  const nextAt = TIER_AT[tier + 1];
  const won = state.stage - 1;
  const prevAt = TIER_AT[tier];
  const frac = nextAt ? Math.min(1, (won - prevAt) / (nextAt - prevAt)) : 1;
  const tourEl = tourRow(app);   // past the mansion the home row becomes the World Tour row (js/tour.js)
  const home = tourEl || el('div', { class: 'hub-home' }, [
    el('span', { html: I.home() }),
    el('span', {}, t('tiers')[tier]),
    el('div', { class: 'bar' }, el('i', { style: { width: '0%' } })),
    el('span', { class: 'tiny', style: { color: '#fff' } }, nextAt ? `${won - prevAt}/${nextAt - prevAt}` : '★'),
  ]);
  if (!tourEl) requestAnimationFrame(() => { home.querySelector('.bar i').style.width = (frac * 100) + '%'; });

  const missionsEl = el('div', { class: 'missions' });
  const paintMissions = () => {
    missionsEl.innerHTML = '';
    const list = missions(); const done = list.filter(m => m.claimed).length, ready = list.filter(m => !m.claimed && m.progress >= m.n).length;
    if (ready) missionsOpen = true;
    missionsEl.classList.toggle('collapsed', !missionsOpen);
    const head = el('div', { class: 'm-head', onclick: () => { sfx.tap(); missionsOpen = !missionsOpen; paintMissions(); } }, [el('span', {}, `🎯 ${t('missions')}`), el('span', { class: 'tiny m-sum' }, [ready ? el('b', { class: 'm-ready' }, `${ready} ${t('claim')}`) : `${done}/${list.length}`, el('i', { class: 'chev' })])]);
    missionsEl.append(head);
    for (const m of list) {
      const row = el('div', { class: 'm-row' + (m.claimed ? ' claimed' : m.progress >= m.n ? ' ready' : '') });
      row.append(el('div', { class: 'm-t' }, [el('div', {}, name(m.def.text).replace('{n}', m.n)), el('div', { class: 'bar' }, el('i', { style: { width: Math.min(100, m.progress / m.n * 100) + '%' } }))]));
      row.append(m.claimed ? el('span', { class: 'tiny' }, '✓') : m.progress >= m.n ? el('button', { class: 'btn sm gold', onclick: () => { const r = claimMission(m.id); if (r) { sfx.coin(); coinChip.querySelector('span').textContent = fmt(state.coins); gemChip.querySelector('span').textContent = fmt(gems()); toast(r.coins ? `+${r.coins}` : `+${r.gems} 💎`, { icon: r.coins ? I.coin() : gemIcon() }); paintMissions(); } } }, t('claim')) : el('span', { class: 'tiny' }, `${m.progress}/${m.n} · ${m.def.reward.coins ? m.def.reward.coins + ' 🪙' : m.def.reward.gems + ' 💎'}`));
      missionsEl.append(row);
    }
  };
  paintMissions();
  const sets = activeSets(state.equipped);
  const setsChip = sets.length ? el('div', { class: 'stage-badge', title: sets.map(s => name(s.perk.text)).join(' · ') }, sets.map(s => s.emoji).join(' ') + ' ' + t('setActive')) : null;
  const cost = entryCost(state.stage);
  const playBtn = el('button', { class: 'btn primary play pulse', onclick: () => { sfx.tap(); haptic(); enterStage(app, state.stage); } }, [el('span', { html: I.play() }), `${t('play')} · ${state.stage}`, cost ? el('small', { class: 'play-cost' }, `⚡${cost}`) : null]);
  const side = (icon, label, fn, cls = '') => el('div', { class: 'side' }, [el('button', { class: 'btn icon ' + cls, onclick: () => { sfx.tap(); fn(); } }, el('span', { html: icon })), label]);
  const actions = el('div', { class: 'hub-actions' }, [
    side(I.hanger(), t('wardrobe'), () => app.go('wardrobe'), 'purple'),
    playBtn,
    side(I.cart(), t('shop'), () => app.go('shop'), 'green'),
  ]);
  const collectBtn = el('button', { class: 'btn sm ghost collect', onclick: () => { sfx.tap(); app.go('collection'); } }, [el('span', { html: I.trophy() }), t('collection')]);
  const bottom = el('div', { class: 'hub-bottom' }, [
    el('div', { class: 'row-c', style: { flexWrap: 'wrap' } }, [el('span', { class: 'stage-badge' }, `${t('stage')} ${state.stage}`), setsChip, collectBtn]),
    (() => { try { rivals.evaluate(); return rivals.rivalCard(app); } catch (e) { console.warn('rivalCard', e); return el('span', { class: 'stage-badge gold' }, `${t('giftIn', 5 - ((state.stage - 1) % 5))}`); } })(),
    home, missionsEl, actions,
    (() => { try { return daily.dailyCard(app); } catch (e) { console.warn('dailyCard', e); return null; } })(),
  ]);

  root.append(scene, avatar, top, bottom);
  try { const dock = el('div', { class: 'streak-dock' }, streakStrip(app, { onChange: () => { coinChip.querySelector('span').textContent = fmt(state.coins); gemChip.querySelector('span').textContent = fmt(gems()); paintReserve(); } })); root.append(dock); } catch (e) { console.warn('streakStrip', e); }
  (async () => { try { if (daily.welcomeBackFlow) await daily.welcomeBackFlow(app); } catch (e) { console.warn('welcomeBack', e); } try { await rivals.settleIfDue(app); await rivals.introIfNeeded(app); const cb = rivals.comebackToast(); if (cb) toast(name(cb), { icon: I.trophy(), ms: 3200 }); } catch (e) { console.warn('rivals', e); } })();

  // daily gift
  const streak = streakStatus();
  if (false) {
    const chip = el('div', { class: 'gift-chip' }, el('button', { class: 'btn gold sm', onclick: async () => {
      const st = claimStreak(); if (!st) return; setCounter('streakMax', st.day); checkAchievements();
      const amount = st.reward.coins || 0; if (st.reward.gems) { gemChip.querySelector('span').textContent = fmt(gems()); }
      claimDaily(); sfx.coin(); haptic([15, 20, 15]);
      const r = chip.getBoundingClientRect(), a = $('#app').getBoundingClientRect();
      fx.coins(r.left + r.width / 2 - a.left, r.top + r.height / 2 - a.top, 14);
      chip.remove();
      await coinsFly({ x: r.left + r.width / 2, y: r.top + r.height / 2 }, coinChip, 8);
      addReserve(10); paintReserve(); coinChip.querySelector('span').textContent = fmt(state.coins); bump(coinChip);
      toast(`${t('day')} ${st.day}: ${st.reward.coins ? '+' + st.reward.coins + ' 🪙' : '+' + st.reward.gems + ' 💎'} · +10 ⚡`, { icon: I.gift(true), ms: 2800 });
    } }, [el('span', { html: I.gift(true) }), `${t('day')} ${streak.day}`]));
    root.append(chip);
  }
  if (params.first) setTimeout(() => say(t('moodHints')[0]), 600);
  if (params.say) setTimeout(() => say(params.say), 500);
  askIfDue(app);   // the store's own rating sheet, only after a great win (js/review.js)
  { const r = passSettle(); if (r) { setTimeout(() => { sfx.coin(); coinChip.querySelector('span').textContent = fmt(state.coins); gemChip.querySelector('span').textContent = fmt(gems()); toast(`${t('passTitle')}: +${r.coins} 🪙 +${r.gems} 💎 (${r.days} ${t('days')})`, { icon: I.trophy(), ms: 3000 }); }, 700); } }
  // one-time starter pitch: only once the store can actually sell the pack (native: its price has loaded), and it is
  // marked as seen only when it is shown, so a store that is off or slow never burns the pitch
  let alive = true, pitchT = 0;
  const starter = PRODUCTS.find(x => x.id === 'starter_pack');
  const pitchDue = () => starterAvailable() && !state.seen['offer:starter'] && canPay() && productShown(starter.id) && purchasable(starter.id);
  const pitch = () => {
    if (!alive || app.current !== 'hub' || !pitchDue() || document.querySelector('#overlay .modal')) return;
    state.seen['offer:starter'] = true; save();
    modal({ title: `🎁 ${t('starterPack')}`, body: el('div', { class: 'win-story' }, t('starterPitch', priceLabel(starter))), closable: true, actions: [{ label: t('later'), cls: 'light' }, { label: t('viewOffer'), cls: 'gold', onClick: () => app.go('shop', { tab: 'deals' }) }] });
  };
  const onPrices = () => { clearTimeout(pitchT); pitchT = setTimeout(pitch, 600); };
  if (starterAvailable() && !state.seen['offer:starter']) { pitchT = setTimeout(pitch, 1500); window.addEventListener('mr:prices', onPrices); }
  if (params.cityUp != null && CITIES[params.cityUp]) setTimeout(() => { toast(t('nextCity', name(CITIES[params.cityUp].name)), { icon: I.globe(), ms: 3400 }); fx.confetti(90); }, 900);
  if (params.tierUp != null) setTimeout(() => { toast(`🏠 ${t('homeUpgraded')} ${t('tiers')[params.tierUp]}`, { icon: I.home(), ms: 3200 }); fx.confetti(90); }, 900);
  return () => { alive = false; clearInterval(reserveTimer); clearTimeout(pitchT); window.removeEventListener('mr:prices', onPrices); };
}
