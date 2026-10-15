'use strict';
/* =====================================================================
   00 · YARDIMCILAR  — matematik, tohumlanabilir RNG, gürültü, DOM
   ===================================================================== */
const TAU = Math.PI * 2;
const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
const lerp = (a, b, t) => a + (b - a) * t;
const smoothstep = (a, b, x) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
/** Kare hızından bağımsız üstel yaklaşma. */
const damp = (cur, target, rate, dt) => cur + (target - cur) * (1 - Math.exp(-rate * dt));
const angDiff = (a, b) => { let d = (b - a) % TAU; if (d > Math.PI) d -= TAU; else if (d < -Math.PI) d += TAU; return d; };

class RNG {
  constructor(seed) { this.s = (seed >>> 0) || 1; }
  next() { let t = (this.s += 0x6D2B79F5); t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }
  float(a = 0, b = 1) { return a + (b - a) * this.next(); }
  int(a, b) { return a + Math.floor(this.next() * (b - a + 1)); }
  chance(p) { return this.next() < p; }
  pick(arr) { return arr[Math.floor(this.next() * arr.length)]; }
  gauss(mu = 0, sigma = 1) { const u = Math.max(1e-9, this.next()), v = this.next(); return mu + sigma * Math.sqrt(-2 * Math.log(u)) * Math.cos(TAU * v); }
  shuffle(arr) { for (let i = arr.length - 1; i > 0; i--) { const j = Math.floor(this.next() * (i + 1)); [arr[i], arr[j]] = [arr[j], arr[i]]; } return arr; }
}
/** Oyunun genel RNG'si. Testler `R.s = seed` ile tohumlayabilir. */
const R = new RNG((Date.now() ^ (Math.random() * 1e9)) >>> 0);

const hash1 = (n) => { const s = Math.sin(n * 127.1 + 311.7) * 43758.5453123; return s - Math.floor(s); };
/** 1B değer gürültüsü, [-1,1] */
const noise1 = (x) => { const i = Math.floor(x), f = x - i, u = f * f * (3 - 2 * f); return lerp(hash1(i), hash1(i + 1), u) * 2 - 1; };

const hsl = (h, s, l, a = 1) => `hsla(${((h % 360) + 360) % 360},${clamp(s, 0, 100).toFixed(1)}%,${clamp(l, 0, 100).toFixed(1)}%,${a})`;
const hueLerp = (a, b, t) => a + angDiff(a * Math.PI / 180, b * Math.PI / 180) * 180 / Math.PI * t;

const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
/** Küçük hyperscript: h('div.card', {onclick}, 'metin', child) */
function h(tag, attrs, ...kids) {
  const m = /^([a-z0-9]+)((?:[.#][\w-]+)*)$/i.exec(tag);
  const el = document.createElement(m ? m[1] : tag);
  if (m && m[2]) m[2].replace(/([.#])([\w-]+)/g, (_, k, v) => { if (k === '.') el.classList.add(v); else el.id = v; });
  if (attrs) for (const k in attrs) {
    const v = attrs[k];
    if (v == null || v === false) continue;
    if (k.startsWith('on') && typeof v === 'function') el.addEventListener(k.slice(2), v);
    else if (k === 'style' && typeof v === 'object') { for (const p in v) (p.startsWith('--') ? el.style.setProperty(p, v[p]) : (el.style[p] = v[p])); }
    else if (k === 'html') el.innerHTML = v;
    else if (k === 'class') v.split(' ').forEach((c) => c && el.classList.add(c));
    else el.setAttribute(k, v === true ? '' : v);
  }
  for (const k of kids.flat(3)) { if (k == null || k === false) continue; el.append(k.nodeType ? k : document.createTextNode(String(k))); }
  return el;
}
const icon = (name, cls = '') => { const s = document.createElementNS('http://www.w3.org/2000/svg', 'svg'); s.setAttribute('class', 'ic ' + cls); s.setAttribute('aria-hidden', 'true'); s.innerHTML = `<use href="#i-${name}"/>`; return s; };
const iconHTML = (name, cls = '') => `<svg class="ic ${cls}" aria-hidden="true"><use href="#i-${name}"/></svg>`;

const fmt = (n) => Math.round(n).toLocaleString('tr-TR');
const pad2 = (n) => String(n).padStart(2, '0');
const clockStr = (minutes) => { const m = Math.floor(minutes % 1440); return pad2(Math.floor(m / 60)) + ':' + pad2(m % 60); };
const dayOf = (minutes) => Math.floor(minutes / 1440) + 1;
const todayKey = () => { const d = new Date(); return d.getFullYear() + '-' + pad2(d.getMonth() + 1) + '-' + pad2(d.getDate()); };
const prefersReduced = () => window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;

/** replaceChildren/append: null ve false "null" yazısı olarak görünmesin. */
for (const m of ['replaceChildren', 'append']) {
  const orig = Element.prototype[m];
  Element.prototype[m] = function (...a) { return orig.apply(this, a.flat(2).filter((x) => x != null && x !== false)); };
}
