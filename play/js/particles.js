// Canvas particle effects (confetti, sparkles, coin bursts). Runs only while particles exist.
import { rand, pick } from './util.js';

class Particles {
  constructor(canvas) {
    this.cv = canvas; this.ctx = canvas.getContext('2d'); this.ps = []; this.running = false; this.dpr = Math.min(2, window.devicePixelRatio || 1);
    this.resize(); window.addEventListener('resize', () => this.resize());
  }
  resize() {
    const r = this.cv.getBoundingClientRect();
    this.w = r.width; this.h = r.height; this.cv.width = this.w * this.dpr; this.cv.height = this.h * this.dpr;
    this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
  }
  add(p) { this.ps.push(p); if (!this.running) { this.running = true; this.last = performance.now(); requestAnimationFrame(t => this.loop(t)); } }
  loop(t) {
    const dt = Math.min(0.05, (t - this.last) / 1000); this.last = t;
    const c = this.ctx; c.clearRect(0, 0, this.w, this.h);
    for (let i = this.ps.length - 1; i >= 0; i--) {
      const p = this.ps[i];
      p.life -= dt; if (p.life <= 0) { this.ps.splice(i, 1); continue; }
      p.vy += (p.g ?? 900) * dt; p.vx *= (1 - (p.drag ?? 1.2) * dt); p.vy *= (1 - (p.drag ?? 1.2) * dt * 0.4);
      p.x += p.vx * dt; p.y += p.vy * dt; p.rot += p.vr * dt;
      const a = Math.min(1, p.life / (p.fade ?? 0.4));
      c.save(); c.globalAlpha = a; c.translate(p.x, p.y); c.rotate(p.rot);
      if (p.shape === 'rect') { c.fillStyle = p.color; c.fillRect(-p.s / 2, -p.s / 4, p.s, p.s / 2); }
      else if (p.shape === 'star') { this.star(c, p.s, p.color); }
      else if (p.shape === 'coin') { c.fillStyle = '#f5b301'; c.beginPath(); c.ellipse(0, 0, p.s / 2, p.s / 2 * Math.abs(Math.cos(p.rot * 2)), 0, 0, Math.PI * 2); c.fill(); c.strokeStyle = '#c98a00'; c.lineWidth = 2; c.stroke(); }
      else { c.fillStyle = p.color; c.beginPath(); c.arc(0, 0, p.s / 2, 0, Math.PI * 2); c.fill(); }
      c.restore();
    }
    if (this.ps.length) requestAnimationFrame(t2 => this.loop(t2)); else { this.running = false; c.clearRect(0, 0, this.w, this.h); }
  }
  star(c, s, color) {
    c.fillStyle = color; c.beginPath();
    for (let i = 0; i < 10; i++) { const r = i % 2 ? s * 0.22 : s * 0.5; const a = -Math.PI / 2 + i * Math.PI / 5; c.lineTo(Math.cos(a) * r, Math.sin(a) * r); }
    c.closePath(); c.fill();
  }
  burst(x, y, { count = 24, colors = ['#ffd34d', '#ff8a3d', '#ff5c8a', '#4f8cff', '#3ddc84', '#fff'], speed = 420, shape = 'mix', size = [6, 12], g = 900, life = [0.6, 1.1], spread = Math.PI * 2, angle = -Math.PI / 2 } = {}) {
    for (let i = 0; i < count; i++) {
      const a = angle + (Math.random() - 0.5) * spread, v = rand(speed * 0.3, speed);
      this.add({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, s: rand(size[0], size[1]), color: pick(colors), rot: rand(0, 6.28), vr: rand(-8, 8), life: rand(life[0], life[1]), g, shape: shape === 'mix' ? pick(['rect', 'circle', 'star']) : shape });
    }
  }
  sparkle(x, y, n = 10, color = '#fff') { this.burst(x, y, { count: n, colors: [color, '#ffd34d', '#fff'], speed: 160, shape: 'star', size: [5, 10], g: 60, life: [0.4, 0.8] }); }
  coins(x, y, n = 10) { this.burst(x, y, { count: n, speed: 380, shape: 'coin', size: [14, 20], g: 1100, life: [0.7, 1.2], spread: Math.PI * 1.1 }); }
  confetti(n = 120) {
    for (let i = 0; i < n; i++) {
      this.add({ x: rand(0, this.w), y: rand(-40, -5), vx: rand(-60, 60), vy: rand(60, 220), s: rand(7, 13), color: pick(['#ffd34d', '#ff8a3d', '#ff5c8a', '#4f8cff', '#3ddc84', '#a855f7', '#fff']), rot: rand(0, 6.28), vr: rand(-6, 6), life: rand(2.2, 3.6), g: 160, drag: 0.6, fade: 0.6, shape: pick(['rect', 'rect', 'circle', 'star']) });
    }
  }
  fountain(x, y, colors) { this.burst(x, y, { count: 40, colors, speed: 520, spread: Math.PI * 0.6, g: 1000, life: [0.8, 1.4] }); }
  rain(color = '#ffd34d', n = 40) { for (let i = 0; i < n; i++) this.add({ x: rand(0, this.w), y: rand(-60, -5), vx: 0, vy: rand(120, 260), s: rand(6, 10), color, rot: 0, vr: rand(-4, 4), life: rand(1.5, 2.6), g: 120, shape: 'star' }); }
}
export const fx = new Particles(document.getElementById('fx'));
