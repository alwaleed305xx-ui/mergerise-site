// Book: Items (discovery stickers per chain) · Sets (outfit perks) · Achievements · Friends (customers).
import { el, $, fmt, haptic } from '../util.js';
import { t, name } from '../i18n.js';
import { state, save, addCoins, addItem, equip } from '../store.js';
import { CHAINS } from '../items.js';
import { rollGift, getItem } from '../wardrobe.js';
import { ALL_SETS, setProgress } from '../sets.js';
import { ACHIEVEMENTS, achievementsDone } from '../missions.js';
import { NPCS, portrait, friendLevel, friendProgress, FRIEND_STEP, friends } from '../customers.js';
import { sfx } from '../audio.js';
import { fx } from '../particles.js';
import { I, toast, itemThumb } from '../ui.js';
import { giftFlow } from '../gift.js';
import { gemIcon } from './shop.js';
import { renderAvatar } from '../avatar.js';
import { THEMES, weekTheme, themeScore, themeStars, fmtStars, lookbook, tryLook, STAR_TIERS, STAR_CAP } from '../style.js';

const icon = (chain, lvl) => `<svg viewBox="0 0 100 100">${CHAINS[chain].levels[lvl - 1].icon()}</svg>`;
// Lookbook strings (bilingual, rendered with name())
const LB = {
  tab: { en: 'Lookbook', ar: 'الإطلالات' },
  intro: { en: 'One page per theme. Score your outfit any time — the best stars stay forever, and crossing 3.5 / 4.0 / 4.5 / 5.0★ pays gems once per page. The week\'s Fit Check theme opens a new page every Monday.', ar: 'صفحة لكل ثيم. قيّم لبسك وقتما تشاء — أفضل نجوم تبقى للأبد، وتجاوز 3.5 / 4.0 / 4.5 / 5.0★ يدفع جواهر مرة لكل صفحة. ثيم الأسبوع يفتح صفحة جديدة كل يوم اثنين.' },
  now: { en: 'Now', ar: 'الآن' }, best: { en: 'Best', ar: 'الأفضل' }, tryLook: { en: 'Try this look', ar: 'جرّب لبسي' }, dressFor: { en: 'Dress for it', ar: 'لبّسني له' },
  thisWeek: { en: 'This week', ar: 'هذا الأسبوع' }, locked: { en: 'Opens the week it is the Fit Check theme', ar: 'تفتح في أسبوعها كثيم الفت-تشك' },
  newBest: { en: 'New best!', ar: 'رقم جديد!' }, noGain: { en: 'Same as your best', ar: 'نفس أفضل نتيجة' }, yourOutfit: { en: 'Your outfit now', ar: 'لبسك الآن' },
  pages: { en: 'pages open', ar: 'صفحات مفتوحة' }, gemsEarned: { en: 'gems earned', ar: 'جواهر مكتسبة' },
};

export function render(root, params, app) {
  root.classList.add('ward');
  let tab = params.tab || 'items';
  const coinChip = el('div', { class: 'chip gold', html: I.coin() + `<span>${fmt(state.coins)}</span>` });
  root.append(el('div', { class: 'topbar' }, [
    el('button', { class: 'btn icon ghost', onclick: () => { sfx.tap(); app.go('hub'); } }, el('span', { html: I.back() })),
    el('div', { class: 'title', style: { fontSize: '20px' } }, t('collection')),
    el('div', { class: 'spacer' }), coinChip,
  ]));
  const tabs = el('div', { class: 'tabs' });
  const list = el('div', { class: 'collection' });
  const paintTabs = () => {
    tabs.innerHTML = '';
    const lbOpen = lookbook().open.length;
    for (const [k, label] of [['items', t('items')], ['sets', t('sets')], ['lookbook', `${name(LB.tab)} ${lbOpen}/${THEMES.length}`], ['achievements', `${t('achievements')} ${achievementsDone()}/${ACHIEVEMENTS.length}`], ['friends', t('friends')]]) tabs.append(el('button', { class: 'tab' + (k === tab ? ' on' : ''), onclick: () => { tab = k; sfx.tap(); paintTabs(); paint(); } }, label));
  };
  const discovered = new Set(state.discovered || []);
  const claimed = state.collectionClaimed || {};
  const p = state.profile;

  const paintItems = () => {
    for (const [key, ch] of Object.entries(CHAINS)) {
      const n = ch.levels.length;
      const known = ch.levels.filter((_, i) => discovered.has(key + ':' + (i + 1))).length;
      const complete = known >= n && key !== 'energy';
      const box = el('div', { class: 'coll-chain' + (complete ? ' complete' : '') });
      const head = el('div', { class: 'coll-head', html: (ch.gen ? `<svg viewBox="0 0 100 100">${ch.gen.icon()}</svg>` : icon(key, 1)) + `<span>${name(ch.name)}</span><span class="n">${known}/${n}</span>` });
      if (complete && !claimed[key]) head.append(el('button', { class: 'btn sm gold', onclick: async () => {
        sfx.coin(); haptic([15, 20, 15]);
        state.collectionClaimed = { ...(state.collectionClaimed || {}), [key]: true }; save();
        addCoins(400); coinChip.querySelector('span').textContent = fmt(state.coins);
        const a = $('#app').getBoundingClientRect(); fx.coins(a.width / 2, a.height / 2, 14); fx.confetti(80);
        const item = rollGift(Math.max(state.stage, 6), p.gender, state.inventory, Math.random, 'rare');
        if (item) {
          const choice = await giftFlow({ item, golden: false, dup: false, dupCoins: 0, gender: p.gender, skin: p.skin, equipped: state.equipped, title: t('chainComplete') });
          addItem(item.id); state.seen.newIds = [...new Set([...(state.seen.newIds || []), item.id])]; save();
          if (choice === 'wear') { equip(item.cat, item.id); if (item.cat === 'top' || item.cat === 'bottom') equip('outfit', null); }
        } else toast('+400', { icon: I.coin() });
        paint();
      } }, `${t('claim')} 400`));
      box.append(head);
      const grid = el('div', { class: 'coll-grid' });
      ch.levels.forEach((lv, i) => { const k = discovered.has(key + ':' + (i + 1)); grid.append(el('div', { class: 'coll-item ' + (k ? 'known' : 'unknown'), title: k ? name(lv.name) : '???', html: icon(key, i + 1) })); });
      box.append(grid); list.append(box);
    }
  };
  const paintSets = () => {
    list.append(el('div', { class: 'tiny', style: { color: '#fff', padding: '0 4px' } }, t('setsIntro')));
    for (const s of ALL_SETS) {
      const pr = setProgress(s, state.equipped);
      const box = el('div', { class: 'coll-chain' + (pr.active ? ' complete' : '') });
      box.append(el('div', { class: 'coll-head', html: `<span style="font-size:26px">${s.emoji}</span><span>${name(s.name)}</span><span class="n">${pr.count}/${pr.need}${pr.active ? ' ✓' : ''}</span>` }));
      box.append(el('div', { class: 'tiny', style: { color: pr.active ? '#fde68a' : 'var(--muted)', marginBottom: '6px' } }, `${t('perk')}: ${name(s.perk.text)}`));
      const row = el('div', { class: 'set-pieces' });
      for (const sel of s.pieces) {
        const eqId = state.equipped[sel.cat]; const eqIt = eqId && getItem(eqId); const worn = eqIt && sel.tpl.includes(eqIt.tpl);
        const ownedMatch = (state.inventory || []).map(getItem).find(it => it && it.cat === sel.cat && sel.tpl.includes(it.tpl));
        const show = worn ? eqIt : ownedMatch;
        row.append(el('div', { class: 'set-piece' + (worn ? ' worn' : ownedMatch ? ' owned' : ''), title: t('cat.' + sel.cat), html: show ? itemThumb(show, p.gender, p.skin, state.equipped) : `<span class="q">${t('cat.' + sel.cat)}</span>` }));
      }
      box.append(row); list.append(box);
    }
  };
  const paintAchievements = () => {
    const done = new Set((state.achievements && state.achievements.unlocked) || []);
    for (const a of ACHIEVEMENTS) {
      const ok = done.has(a.id);
      list.append(el('div', { class: 'ach' + (ok ? ' done' : '') }, [el('div', { class: 'ach-ic', html: ok ? I.trophy() : I.lock() }), el('div', { class: 'ach-t' }, [el('div', { class: 'ach-n' }, name(a.text)), el('div', { class: 'tiny' }, name(a.desc))]), el('div', { class: 'ach-r', html: a.reward.coins ? I.coin() + a.reward.coins : gemIcon() + a.reward.gems })]));
    }
  };
  const paintFriends = () => {
    list.append(el('div', { class: 'tiny', style: { color: '#fff', padding: '0 4px' } }, t('friendsIntro', FRIEND_STEP)));
    const rows = NPCS.map(n => ({ n, lvl: friendLevel(n.name), prog: friendProgress(n.name), total: friends()[n.name] || 0 })).sort((a, b) => b.total - a.total);
    for (const r of rows) {
      list.append(el('div', { class: 'friend' }, [
        el('div', { class: 'friend-pic', style: { borderColor: r.n.color }, html: portrait(r.n) }),
        el('div', { class: 'friend-t' }, [el('div', { class: 'ach-n' }, `${r.n.name} · ${t('level')} ${r.lvl}`), el('div', { class: 'bar', style: { height: '8px', background: 'rgba(255,255,255,.12)', borderRadius: '999px', overflow: 'hidden', margin: '4px 0' } }, el('i', { style: { display: 'block', height: '100%', width: (r.prog / FRIEND_STEP * 100) + '%', background: 'var(--grad)' } })), el('div', { class: 'tiny' }, `${r.prog}/${FRIEND_STEP} · ${r.total} ${t('deliveries')}`)]),
      ]));
    }
  };
  // ---------- Lookbook (F1): one page per theme, best stars kept, gem tiers once per page ----------
  const paintLookbook = () => {
    const lb = lookbook(); const wk = weekTheme(); const stageN = state.stage || 1;
    const gemsEarned = Object.values(lb.pages).reduce((a, pg) => a + (pg.claimed || []).reduce((s, st) => s + ((STAR_TIERS.find(x => x.stars === st) || {}).gems || 0), 0), 0);
    list.append(el('div', { class: 'tiny', style: { color: '#fff', padding: '0 4px' } }, name(LB.intro)));
    list.append(el('div', { class: 'lb-summary' }, [
      el('div', { class: 'av', html: renderAvatar({ gender: p.gender, skin: p.skin, equipped: state.equipped, mood: 2 }, { anim: false }).replace('viewBox="0 0 320 520"', 'viewBox="60 10 200 300"') }),
      el('div', { class: 't' }, [el('span', {}, name(LB.yourOutfit)), el('small', {}, `${lb.open.length}/${THEMES.length} ${name(LB.pages)} · ${gemsEarned} ${name(LB.gemsEarned)}`)]),
      el('span', { class: 'lb-week' }, `${wk.emoji} ${name(LB.thisWeek)}`),
    ]));
    // this week's page first, then the other open pages, locked pages last
    const ordered = [...THEMES].sort((a, b) => (b.id === wk.id) - (a.id === wk.id) || lb.open.includes(b.id) - lb.open.includes(a.id));
    for (const th of ordered) {
      const open = lb.open.includes(th.id); const pg = lb.pages[th.id];
      const bestStars = pg ? pg.stars || 0 : 0;
      const nowStars = themeStars(themeScore(state.equipped, th), stageN);
      const box = el('div', { class: 'coll-chain lb-page' + (open ? '' : ' locked') + (bestStars >= 5 ? ' complete' : '') });
      box.append(el('div', { class: 'coll-head' }, [
        el('span', { style: { fontSize: '26px' } }, th.emoji), el('span', {}, name(th.name)),
        th.id === wk.id ? el('span', { class: 'lb-week' }, name(LB.thisWeek)) : null,
        el('span', { class: 'n' }, open ? `${name(LB.best)} ${fmtStars(bestStars)}★` : ''),
      ]));
      box.append(el('div', { class: 'brief' }, name(th.brief)));
      if (!open) { box.append(el('div', { class: 'lb-lock', html: I.lock() + `<span>${name(LB.locked)}</span>` })); list.append(box); continue; }
      const claimed = new Set((pg && pg.claimed) || []);
      const nextTier = STAR_TIERS.find(x => !claimed.has(x.stars));
      const tiers = el('div', { class: 'lb-tiers' });
      for (const x of STAR_TIERS) tiers.append(el('div', { class: 'lb-tier' + (claimed.has(x.stars) ? ' claimed' : nextTier && nextTier.stars === x.stars ? ' next' : ''), html: `${x.stars.toFixed(1)}★ ${claimed.has(x.stars) ? '✓' : gemIcon() + x.gems}` }));
      box.append(tiers);
      const bar = el('div', { class: 'bar' }, [el('i', { style: { width: Math.min(100, nowStars / STAR_CAP * 100) + '%' } }), ...STAR_TIERS.map(x => el('b', { style: { insetInlineStart: (x.stars / STAR_CAP * 100) + '%' } }))]);
      box.append(el('div', { class: 'lb-now' }, [el('span', {}, `${name(LB.now)} ${fmtStars(nowStars)}★`), bar, el('span', { style: { color: '#fde68a' } }, `${fmtStars(bestStars)}★`)]));
      box.append(el('div', { class: 'lb-acts' }, [
        el('button', { class: 'btn sm gold', onclick: () => {
          const r = tryLook(th.id, state.equipped, stageN); if (!r) return;
          sfx.coin(); haptic(r.gems ? [15, 20, 15] : 12);
          if (r.gems) { const a = $('#app').getBoundingClientRect(); fx.confetti(60); fx.sparkle(a.width / 2, a.height / 2, 20, '#22d3ee'); }
          toast(`${th.emoji} ${fmtStars(r.stars)}★ ${r.improved ? name(LB.newBest) : name(LB.noGain)}${r.gems ? ` · +${r.gems} 💎` : ''}`, { icon: r.gems ? gemIcon() : I.star(true), ms: 2800 });
          paintTabs(); paint();
        } }, [el('span', { html: I.star(true) }), name(LB.tryLook)]),
        el('button', { class: 'btn sm purple', onclick: () => { sfx.tap(); app.go('wardrobe', { theme: th.id, back: 'collection', backParams: { tab: 'lookbook' } }); } }, [el('span', { html: I.sparkle() }), name(LB.dressFor)]),
      ]));
      list.append(box);
    }
  };
  const paint = () => { list.innerHTML = ''; ({ items: paintItems, sets: paintSets, lookbook: paintLookbook, achievements: paintAchievements, friends: paintFriends })[tab](); };
  root.append(tabs, list);
  paintTabs(); paint();
}
