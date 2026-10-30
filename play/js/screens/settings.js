// Settings modal: sound, music, language, change hero, rate (store builds), privacy + terms, Restore Purchases (native store builds), reset.
import { el } from '../util.js';
import { t, setLang, getLang } from '../i18n.js';
import { state, save, reset } from '../store.js';
import { setSfx, setMusic, sfx } from '../audio.js';
import { modal, holdButton, I, toast } from '../ui.js';
import { openLegal } from '../legal.js';
import { providerName } from '../payments.js';
import { runRestore } from './shop.js';
import { rateUrl, openRatePage } from '../review.js';

const APP_VERSION = '1.0.2';   // keep in step with package.json "version"

export function openSettings(app) {
  const sw = (on, fn) => { const b = el('button', { class: 'switch' + (on ? ' on' : '') }); b.onclick = () => { const v = !b.classList.contains('on'); b.classList.toggle('on', v); fn(v); sfx.tap(); }; return b; };
  const rows = el('div', { class: 'rows' }, [
    el('div', { class: 'row' }, [el('span', { class: 'row-c', html: I.sound() + `<span>${t('sound')}</span>` }), sw(state.settings.sfx, v => { state.settings.sfx = v; save(); setSfx(v); })]),
    el('div', { class: 'row' }, [el('span', { class: 'row-c', html: I.music() + `<span>${t('music')}</span>` }), sw(state.settings.music, v => { state.settings.music = v; save(); setMusic(v); })]),
    el('div', { class: 'row' }, [el('span', {}, t('language')), (() => {
      const seg = el('div', { class: 'seg' });
      for (const [k, lbl] of [['en', 'English'], ['ar', 'العربية']]) seg.append(el('button', { class: k === getLang() ? 'on' : '', onclick: () => { state.settings.lang = k; save(); setLang(k); sfx.tap(); m.close(); app.go(app.current, {}); } }, lbl));
      return seg;
    })()]),
    el('div', { class: 'row' }, [el('span', {}, t('changeHero')), el('button', { class: 'btn sm purple', onclick: () => { sfx.tap(); m.close(); app.go('create', { keep: true }); } }, t('changeHero'))]),
  ]);
  // Rate (Guideline 5.6.1: a button the player chooses, opening the store's own write-review page; no reward)
  if (rateUrl()) rows.append(el('div', { class: 'row' }, [el('span', {}, t('rateApp')), el('button', { class: 'btn sm gold', onclick: () => { sfx.tap(); openRatePage(); } }, '★')]));
  rows.append(el('div', { class: 'row' }, [el('span', {}, t('privacy')), el('button', { class: 'btn sm ghost', onclick: () => openLegal('privacy') }, '↗')]));
  rows.append(el('div', { class: 'row' }, [el('span', {}, t('terms')), el('button', { class: 'btn sm ghost', onclick: () => openLegal('terms') }, '↗')]));
  // Restore Purchases (Guideline 3.1.1): whenever store purchases are active (native iOS and native Android)
  if (providerName() === 'native') { const rb = el('button', { class: 'btn sm ghost', onclick: () => { sfx.tap(); runRestore(rb); } }, '↻'); rows.append(el('div', { class: 'row' }, [el('span', {}, t('restore')), rb])); }
  const resetBtn = el('button', { class: 'btn sm', style: { background: 'linear-gradient(135deg,#fb7185,#e11d48)', boxShadow: '0 10px 28px rgba(244,63,94,.35)', width: '100%', marginTop: '6px' } }, `${t('resetProgress')} · ${t('holdToConfirm')}`);
  holdButton(resetBtn, () => { reset(); m.close(); location.reload(); }, 1600);
  rows.append(el('div', { class: 'tiny', style: { marginTop: '6px' } }, t('resetWarn')));
  rows.append(resetBtn);
  rows.append(el('div', { class: 'tiny center', style: { marginTop: '6px' } }, `MergeRise · ${t('version')} ${APP_VERSION}`));
  const m = modal({ title: t('settings'), body: rows, closable: true });
  return m;
}
