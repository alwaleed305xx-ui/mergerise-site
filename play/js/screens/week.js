// This Week (F10): Race tab = the full Rival Row (standings, the next Fit Check, every rival's look on the rig with
// schedule hint + taunt of the day, your steal history, the signature checklist). Goals tab = stub until the weekly
// goals sheet (missions.js ensureWeek / WEEKLY_POOL / claimWeekly) lands; it feature-detects those exports.
import { el, fmt, haptic } from '../util.js';
import { t, name } from '../i18n.js';
import { state, tierFor } from '../store.js';
import { renderAvatar } from '../avatar.js';
import { getItem } from '../wardrobe.js';
import { sfx } from '../audio.js';
import { I, itemCard } from '../ui.js';
import * as rivals from '../rivals.js';

const { L, HONESTY } = rivals;

export function render(root, params, app) {
  root.classList.add('ward', 'week');
  let tab = params.tab || 'race';
  const p = state.profile;
  const coinChip = el('div', { class: 'chip gold', html: I.coin() + `<span>${fmt(state.coins)}</span>` });
  root.append(el('div', { class: 'topbar' }, [
    el('button', { class: 'btn icon ghost', onclick: () => { sfx.tap(); app.go(params.back || 'hub'); } }, el('span', { html: I.back() })),
    el('div', { class: 'title', style: { fontSize: '20px' } }, name(L.thisWeek)),
    el('div', { class: 'spacer' }), coinChip,
  ]));
  const tabs = el('div', { class: 'tabs' });
  const list = el('div', { class: 'collection week-list' });
  const paintTabs = () => {
    tabs.innerHTML = '';
    for (const [k, label] of [['race', `🏁 ${name(L.race)}`], ['goals', `🎯 ${t('goals')}`]]) tabs.append(el('button', { class: 'tab' + (k === tab ? ' on' : ''), onclick: () => { tab = k; sfx.tap(); paintTabs(); paint(); } }, label));
  };
  let timerEl = null, race = null;
  const paintTimer = () => { if (!timerEl || !race) return; timerEl.textContent = `⏱ ${name(race.finishedAt ? L.nextIn : L.endsIn)} ${name(L.dur(race.weekEnd - Date.now()))}`; };
  const iv = setInterval(paintTimer, 30000);

  const paintRace = () => {
    race = rivals.evaluate();
    if (!race || !p) { list.append(el('div', { class: 'empty' }, name(HONESTY))); return; }
    const theme = rivals.weekTheme();
    const rows = rivals.standings(race);
    // --- header: theme, finish line, countdown, pace, honesty ---
    timerEl = el('span', { class: 'rr-timer' });
    const head = el('div', { class: 'wk-card wk-head' }, [
      el('div', { class: 'wk-theme' }, [el('span', { class: 'wk-emoji' }, theme.emoji || '👗'), el('div', {}, [el('div', { class: 'tiny' }, name(L.theme)), el('b', {}, name(theme.name))])]),
      el('div', { class: 'wk-meta' }, [el('span', { class: 'stage-badge gold' }, race.finishedAt ? name(L.raceOver) : `${name(L.firstTo(race.finish))} ${name(L.wins)}`), timerEl, el('span', { class: 'tiny' }, name(L.pace(race.basePace)))]),
      el('div', { class: 'rr-foot' }, `${name(HONESTY)} · ${name(L.rubber)}`),
    ]);
    paintTimer();
    list.append(head);
    // --- standings ---
    const stand = el('div', { class: 'wk-card' }, el('div', { class: 'coll-head' }, [el('span', {}, `🏆 ${name(L.standings)}`), el('span', { class: 'n' }, race.finishedAt ? name(L.placed(race.place)) : `${rivals.playerWins(race)}/${race.finish}`)]));
    for (const row of rows) {
      const you = row.id === 'you'; const rv = row.rival;
      const stage = you ? state.stage : rv.stage;
      const r = el('div', { class: 'wk-row' + (you ? ' you' : '') }, [
        el('span', { class: 'wk-rank' }, ['🥇', '🥈', '🥉', '4', '5'][row.place - 1] || String(row.place)),
        el('div', { class: 'rr-pic', html: rivals.headCrop(row.id, race) }),
        el('div', { class: 'wk-row-t' }, [
          el('div', { class: 'ach-n' }, you ? `${p.name} · ${name(L.you)}` : `${name(rv.name)} “${name(rv.nick)}”`),
          el('div', { class: 'tiny' }, `${name(L.stageN(stage))} · ${t('tiers')[tierFor(stage)]}${!you && rv.active ? ' · 🔥 ' + name(L.onARun) : ''}`),
          el('div', { class: 'bar' }, el('i', { style: { width: Math.min(100, row.wins / race.finish * 100) + '%' } })),
        ]),
        el('b', { class: 'wk-wins' }, `${row.wins}`),
      ]);
      r.querySelector('.rr-pic').style.setProperty('--c', you ? '#ec4899' : rv.color);
      stand.append(r);
    }
    list.append(stand);
    // --- next Fit Check ---
    const n = rivals.nextFitCheckIn();
    const cl = rivals.claimant();
    if (cl) {
      const stageN = state.stage + n - 1;
      const player = rivals.fitCheckScore(state.equipped, theme, { unwornBonus: true });
      const rs = rivals.fitCheckScore(rivals.rivalLook(cl), theme);
      const hc = rivals.fitCheckHandicap(stageN); const target = Math.round(rs * hc * 10) / 10;
      const gap = Math.max(0, Math.round((target - player) * 10) / 10);
      const fit = el('div', { class: 'wk-card wk-fit' }, [
        el('div', { class: 'coll-head' }, [el('span', {}, `👗 ${name(n === 1 ? L.fitNext(name(theme.name), name(cl.name)) : L.fitIn(n, name(theme.name), name(cl.name)))}`)]),
        el('div', { class: 'wk-fit-row' }, [
          el('div', { class: 'wk-score you' }, [el('div', { class: 'rr-pic', html: rivals.headCrop('you', race) }), el('b', {}, String(player)), el('span', { class: 'tiny' }, name(L.yourFit))]),
          el('div', { class: 'wk-vs' }, 'VS'),
          el('div', { class: 'wk-score' }, [el('div', { class: 'rr-pic', html: rivals.headCrop(cl.id, race) }), el('b', {}, String(target)), el('span', { class: 'tiny' }, `${name(L.toBeat)} · ×${hc}`)]),
        ]),
        el('div', { class: 'tiny wk-hint' }, (gap > 0 ? '' : '✓ ') + name(rivals.fitGapHint(gap, theme, cl, state.equipped))),
        el('button', { class: 'btn sm purple', onclick: () => { sfx.tap(); app.go('wardrobe', { theme: theme.id, back: 'week' }); } }, [el('span', { html: I.hanger() }), name(L.changeOutfit)]),
      ]);
      fit.querySelector('.wk-score.you .rr-pic').style.setProperty('--c', '#ec4899');
      fit.querySelector('.wk-score:not(.you) .rr-pic').style.setProperty('--c', cl.color);
      list.append(fit);
    }
    // --- rival looks on the rig ---
    const strip = el('div', { class: 'wk-rivals' });
    for (const rv of rivals.ROSTER) {
      const v = rivals.rivalView(rv.id);
      const look = rivals.rivalLook(v);
      const score = rivals.fitCheckScore(look, theme);
      const sg = rivals.stealPool(rv.id, race).signature;
      const card = el('div', { class: 'wk-rival' }, [
        el('div', { class: 'rig', html: renderAvatar({ gender: rv.gender, skin: rv.skin, equipped: look, mood: v.active ? 3 : 2 }, { anim: false }) }),
        el('div', { class: 'ach-n' }, name(rv.name)),
        el('div', { class: 'tiny' }, `“${name(rv.nick)}” · ${name(L.plays)} ${name(rv.hours)}`),
        el('div', { class: 'wk-status' + (v.active ? ' on' : '') }, v.active ? `🔥 ${name(L.onARun)}` : `💤 ${name(L.resting)}`),
        el('div', { class: 'wk-say' }, `“${name(rivals.tauntOfDay(rv, p.name))}”`),
        el('div', { class: 'wk-fitpts' }, `${theme.emoji || '👗'} ${score} ${t('score').toLowerCase()}`),
        el('div', { class: 'wk-sig' + (sg && sg.ok ? ' ok' : '') }, `★ ${name(rv.signature.name)} · ${name(L.beaten(Math.min(3, v.beaten)))}`),
      ]);
      card.style.setProperty('--c', rv.color);
      strip.append(card);
    }
    list.append(el('div', { class: 'section-title' }, name(L.title)), strip);
    // --- steal history ---
    const stolen = Object.entries(state.stolen || {}).map(([id, from]) => ({ item: getItem(id), from: rivals.rivalById(from) })).filter(x => x.item);
    const hist = el('div', { class: 'wk-card' }, el('div', { class: 'coll-head' }, [el('span', {}, `👜 ${name(L.stealHistory)}`), el('span', { class: 'n' }, String(stolen.length))]));
    if (!stolen.length) hist.append(el('div', { class: 'tiny' }, name(L.noSteals)));
    else { const g = el('div', { class: 'steal-pick history' }); for (const s of stolen) g.append(itemCard(s.item, { owned: true, equipped: state.equipped[s.item.cat] === s.item.id, gender: p.gender, skin: p.skin, baseEq: state.equipped, badge: s.from ? name(L.stolenFrom(name(s.from.name))) : undefined })); hist.append(g); }
    list.append(hist);
    // --- signature checklist ---
    const sigs = el('div', { class: 'wk-card' }, el('div', { class: 'coll-head' }, [el('span', {}, `★ ${name(L.signatures)}`), el('span', { class: 'n' }, `${rivals.ROSTER.filter(r => state.rivals?.[r.id]?.beaten >= 3).length}/4`)]));
    for (const rv of rivals.ROSTER) {
      const b = Math.min(3, state.rivals?.[rv.id]?.beaten || 0); const sgItem = getItem(rv.signature.id); const have = sgItem && (state.inventory || []).includes(sgItem.id);
      sigs.append(el('div', { class: 'wk-sigrow' + (have ? ' done' : b >= 3 ? ' ready' : '') }, [
        el('span', { class: 'wk-sigdots' }, [0, 1, 2].map(i => el('i', { class: i < b ? 'on' : '' }))),
        el('div', { class: 'wk-row-t' }, [el('div', { class: 'ach-n' }, `${name(rv.signature.name)} · ${t('cat.' + rv.signature.cat)}`), el('div', { class: 'tiny' }, have ? `✓ ${name(L.wildNote)}` : b >= 3 ? name(L.wildNote) : name(L.beatMore(name(rv.name), 3 - b)))]),
        el('span', { class: 'wk-sigicon' }, have ? '★' : '🔒'),
      ]));
    }
    list.append(sigs);
  };
  const paintGoals = () => {
    // Feature-detect the weekly goals sheet (missions.js, F10); until then a stub so the tab never breaks.
    import('../missions.js').then(m => {
      if (typeof m.ensureWeek === 'function' && Array.isArray(m.WEEKLY_POOL) && typeof m.weeklyGoals === 'function') {
        try { m.ensureWeek(); list.innerHTML = ''; for (const g of m.weeklyGoals()) list.append(el('div', { class: 'wk-card tiny' }, `${name(g.text || g.def?.text || { en: g.id, ar: g.id })} · ${g.progress || 0}/${g.n || g.target || 0}`)); return; } catch (_) { /* fall back to the stub */ }
      }
    }).catch(() => null);
    list.append(el('div', { class: 'wk-card wk-stub' }, [el('div', { class: 'wk-emoji', style: { fontSize: '40px' } }, '🎯'), el('div', { class: 'ach-n' }, t('goals')), el('div', { class: 'tiny' }, name(L.goalsSoon))]));
  };
  const paint = () => { list.innerHTML = ''; timerEl = null; (tab === 'goals' ? paintGoals : paintRace)(); };
  root.append(tabs, list);
  paintTabs(); paint();
  return () => clearInterval(iv);
}
