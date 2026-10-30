// WebAudio synthesised SFX + a soft generative music loop (no asset files).
let ctx = null, master = null, musicGain = null, sfxGain = null;
let enabledSfx = true, enabledMusic = true, musicTimer = null, musicStep = 0, nextNote = 0;

function ensure() {
  if (ctx) { if (ctx.state === 'suspended' || ctx.state === 'interrupted') ctx.resume().catch(() => null); return ctx; }
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return null;
  ctx = new AC();
  master = ctx.createGain(); master.gain.value = 0.9; master.connect(ctx.destination);
  sfxGain = ctx.createGain(); sfxGain.gain.value = enabledSfx ? 1 : 0; sfxGain.connect(master);
  musicGain = ctx.createGain(); musicGain.gain.value = enabledMusic ? 0.22 : 0; musicGain.connect(master);
  // the first touch after an interruption brings the sound back (iOS leaves the context 'interrupted')
  window.addEventListener('pointerdown', () => { if (ctx && ctx.state !== 'running' && ctx.state !== 'closed') ctx.resume().catch(() => null); }, { passive: true });
  return ctx;
}
export function unlock() { ensure(); if (enabledMusic) startMusic(); }
export function setSfx(on) { enabledSfx = on; if (sfxGain) sfxGain.gain.value = on ? 1 : 0; }
export function setMusic(on) { enabledMusic = on; if (musicGain) musicGain.gain.setTargetAtTime(on ? 0.22 : 0, ctx.currentTime, 0.1); if (on) startMusic(); }

function tone({ f = 440, f2 = null, type = 'sine', dur = 0.15, vol = 0.3, at = 0, attack = 0.005, decay = null, dest = null }) {
  const c = ensure(); if (!c || c.state === 'interrupted' || (!enabledSfx && !dest)) return;
  const t0 = c.currentTime + at;
  const o = c.createOscillator(); const g = c.createGain();
  o.type = type; o.frequency.setValueAtTime(f, t0);
  if (f2) o.frequency.exponentialRampToValueAtTime(f2, t0 + dur);
  g.gain.setValueAtTime(0, t0);
  g.gain.linearRampToValueAtTime(vol, t0 + attack);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + (decay ?? dur));
  o.connect(g); g.connect(dest || sfxGain);
  o.start(t0); o.stop(t0 + (decay ?? dur) + 0.05);
}
function noise({ dur = 0.2, vol = 0.2, at = 0, hp = 800 }) {
  const c = ensure(); if (!c || c.state === 'interrupted' || !enabledSfx) return;
  const t0 = c.currentTime + at;
  const buf = c.createBuffer(1, c.sampleRate * dur, c.sampleRate);
  const d = buf.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / d.length);
  const s = c.createBufferSource(); s.buffer = buf;
  const f = c.createBiquadFilter(); f.type = 'highpass'; f.frequency.value = hp;
  const g = c.createGain(); g.gain.setValueAtTime(vol, t0); g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  s.connect(f); f.connect(g); g.connect(sfxGain); s.start(t0);
}

export const sfx = {
  tap() { tone({ f: 520, f2: 700, type: 'triangle', dur: 0.08, vol: 0.18 }); },
  pick() { tone({ f: 380, f2: 520, type: 'sine', dur: 0.09, vol: 0.2 }); },
  drop() { tone({ f: 300, f2: 220, type: 'triangle', dur: 0.1, vol: 0.18 }); },
  spawn() { tone({ f: 600, f2: 900, type: 'sine', dur: 0.12, vol: 0.2 }); noise({ dur: 0.08, vol: 0.05, hp: 3000 }); },
  merge(lvl = 1, combo = 1) {
    const base = 440 * Math.pow(1.12, Math.min(lvl, 8)) * (1 + (combo - 1) * 0.05);
    tone({ f: base, f2: base * 1.5, type: 'sine', dur: 0.18, vol: 0.28 });
    tone({ f: base * 1.5, f2: base * 2, type: 'triangle', dur: 0.22, vol: 0.14, at: 0.05 });
    noise({ dur: 0.12, vol: 0.06, hp: 2500 });
  },
  bigMerge() {
    [523, 659, 784, 1047].forEach((f, i) => tone({ f, type: 'triangle', dur: 0.3, vol: 0.22, at: i * 0.06 }));
    noise({ dur: 0.3, vol: 0.1, hp: 1500 });
  },
  goal() { [784, 988, 1175, 1568].forEach((f, i) => tone({ f, type: 'sine', dur: 0.25, vol: 0.25, at: i * 0.07 })); },
  coin() { tone({ f: 1320, type: 'sine', dur: 0.12, vol: 0.18 }); tone({ f: 1760, type: 'sine', dur: 0.25, vol: 0.14, at: 0.06 }); },
  energy() { tone({ f: 300, f2: 1200, type: 'sawtooth', dur: 0.25, vol: 0.12 }); },
  error() { tone({ f: 220, f2: 160, type: 'square', dur: 0.18, vol: 0.12 }); },
  win() {
    const seq = [523, 659, 784, 1047, 784, 1047, 1319];
    seq.forEach((f, i) => tone({ f, type: 'triangle', dur: 0.35, vol: 0.22, at: i * 0.11 }));
    seq.forEach((f, i) => tone({ f: f / 2, type: 'sine', dur: 0.4, vol: 0.12, at: i * 0.11 }));
    noise({ dur: 0.6, vol: 0.08, hp: 1200, at: 0.6 });
  },
  lose() { [392, 349, 311, 262].forEach((f, i) => tone({ f, type: 'triangle', dur: 0.4, vol: 0.18, at: i * 0.18 })); },
  giftShake() { noise({ dur: 0.1, vol: 0.12, hp: 600 }); tone({ f: 200, f2: 150, type: 'triangle', dur: 0.1, vol: 0.12 }); },
  giftOpen() {
    noise({ dur: 0.5, vol: 0.18, hp: 900 });
    [659, 880, 1109, 1319, 1760].forEach((f, i) => tone({ f, type: 'sine', dur: 0.5, vol: 0.2, at: 0.1 + i * 0.08 }));
  },
  legendary() {
    [523, 659, 784, 1047, 1319, 1568].forEach((f, i) => { tone({ f, type: 'triangle', dur: 0.6, vol: 0.2, at: i * 0.09 }); tone({ f: f * 2, type: 'sine', dur: 0.5, vol: 0.08, at: i * 0.09 + 0.02 }); });
    noise({ dur: 0.8, vol: 0.12, hp: 800, at: 0.3 });
  },
  equip() { noise({ dur: 0.15, vol: 0.1, hp: 1500 }); tone({ f: 700, f2: 1000, type: 'sine', dur: 0.15, vol: 0.18, at: 0.05 }); },
  pop() { tone({ f: 900, f2: 500, type: 'sine', dur: 0.08, vol: 0.15 }); },
  hammer() { noise({ dur: 0.15, vol: 0.2, hp: 400 }); tone({ f: 150, f2: 80, type: 'square', dur: 0.15, vol: 0.15 }); tone({ f: 800, f2: 1600, type: 'sine', dur: 0.3, vol: 0.12, at: 0.1 }); },
  fog() { noise({ dur: 0.35, vol: 0.12, hp: 500 }); tone({ f: 500, f2: 900, type: 'sine', dur: 0.3, vol: 0.12 }); },
  jump() { tone({ f: 400, f2: 900, type: 'sine', dur: 0.18, vol: 0.18 }); },
};

// ---- music: gentle pentatonic arpeggio over a slow pad, 100 bpm ----
const SCALE = [0, 2, 4, 7, 9, 12, 14, 16];  // C major pentatonic over 2 octaves
const CHORDS = [[0, 4, 7], [-3, 0, 4], [-5, 0, 2], [-7, -3, 0]];  // C, Am, F, G (relative semitones)
const midi = n => 261.63 * Math.pow(2, n / 12);
function startMusic() {
  if (musicTimer || !ctx) return;
  const step = 60 / 100 / 2; // eighth notes, in seconds
  musicStep = 0; nextNote = 0;
  // look-ahead scheduler: a 100 ms timer books every note due in the next 0.35 s at its exact audio-clock time
  musicTimer = setInterval(() => {
    if (!enabledMusic || document.hidden || !ctx || ctx.state !== 'running') return;
    const now = ctx.currentTime;
    if (nextNote < now - step) nextNote = now + 0.05;   // after a stall or a pause: skip, never burst
    while (nextNote < now + 0.35) { musicNote(nextNote - now); nextNote += step; }
  }, 100);
}
function musicNote(at) {
  const bar = Math.floor(musicStep / 8) % CHORDS.length;
  const chord = CHORDS[bar];
  if (musicStep % 8 === 0) {
    chord.forEach(n => tone({ f: midi(n - 12), type: 'sine', dur: 2.3, vol: 0.09, attack: 0.4, at, dest: musicGain }));
    tone({ f: midi(chord[0] - 24), type: 'triangle', dur: 2.3, vol: 0.07, attack: 0.3, at, dest: musicGain });
  }
  const beat = musicStep % 8;
  if (beat % 2 === 0 || Math.random() < 0.35) {
    const n = chord[beat % 3] + 12 + SCALE[Math.floor(Math.random() * 3)];
    tone({ f: midi(n), type: 'triangle', dur: 0.35, vol: 0.07, attack: 0.01, at, dest: musicGain });
  }
  musicStep++;
}
export function stopMusic() { if (musicTimer) { clearInterval(musicTimer); musicTimer = null; } }
