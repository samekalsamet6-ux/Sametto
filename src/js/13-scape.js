'use strict';
/* =====================================================================
   13 · AQUASCAPE MODELİ — zemin yüksekliği, öğeler, bağlanma, şablonlar, geri alma
   Dünya: yükseklik 700 sabit; x, ekran oranına göre genişleyen W'nin oranı (fx).
   ===================================================================== */
const GROUND0 = 626, SURFACE = 26, SUB_COLS = 48, SUB_MAX = 150;

const Scape = {
  blank() {
    return {
      v: 1, liters: 60, bg: 'blue', nid: 1, rev: 0,
      sub: { type: 'sand', color: 'natural', h: new Array(SUB_COLS).fill(0.05) },
      equip: { filter: 'internal', heater: true, co2: 'none', air: true, light: { p: 55, from: 8, to: 20 } },
      owned: { filter: { sponge: 1, internal: 1 }, heater: 1, co2: {}, light: 1, air: 1 },
      items: [],
    };
  },

  /** Zemin yüksekliği: dünya x'inden y (üstten aşağı). */
  ground(sc, W, wx) {
    const f = clamp(wx / W, 0, 1) * (SUB_COLS - 1), i = Math.min(SUB_COLS - 2, Math.floor(f)), t = f - i, h = sc.sub.h;
    return GROUND0 - lerp(h[i], h[i + 1], t) * SUB_MAX;
  },

  defOf(it) { return it.k === 'plant' ? PLANTS[it.d] : it.k === 'decor' ? DECOR[it.d] : HARDSCAPE[it.d]; },
  isHard(it) { return it.k === 'rock' || it.k === 'wood' || it.k === 'leaf' || it.k === 'decor'; },
  cost(it) { return this.defOf(it).cost || 0; },

  defaultZ(k, d) {
    if (k === 'plant') { const L = PLANTS[d].layer; return L === 'bg' ? 0 : L === 'fg' ? 2 : L === 'float' ? 2 : 1; }
    return k === 'leaf' ? 2 : 1;
  },

  newItem(sc, k, d, fx, extra = {}, rng = R) {
    const it = Object.assign({ id: sc.nid++, k, d, fx, s: 1, r: 0, fl: rng.chance(0.5) ? 1 : -1, z: this.defaultZ(k, d), seed: (rng.next() * 2 ** 31) >>> 0, g: 1, att: null, gnd: true }, extra);
    if (k === 'plant' && PLANTS[d].type === 'epi' && !extra.att) it.gnd = false;
    return it;
  },

  /** Bir öğenin dünya konumu {x,y,s,r,fl}; bağlı bitkiler ev sahibini izler. */
  pos(sc, W, it, depth = 0) {
    if (it.att && depth < 2) {
      const host = sc.items.find((h) => h.id === it.att.id);
      if (host) { const p = this.pos(sc, W, host, depth + 1), c = Math.cos(p.r), s = Math.sin(p.r), lx = it.att.ox * p.fl * p.s, ly = it.att.oy * p.s; return { x: p.x + lx * c - ly * s, y: p.y + lx * s + ly * c, s: it.s, r: 0, fl: it.fl }; }
    }
    const x = it.fx * W; let y;
    if (it.k === 'plant' && PLANTS[it.d].type === 'float') y = SURFACE;
    else if (it.gnd !== false) y = this.ground(sc, W, x) + (it.k === 'plant' ? 3 : it.k === 'leaf' ? 0 : 7 * (it.s || 1));
    else y = it.y ?? this.ground(sc, W, x);
    return { x, y, s: it.s, r: it.r || 0, fl: it.fl || 1 };
  },

  /** Noktanın (dünya) içinde olduğu en üstteki öğe. */
  hit(sc, W, wx, wy) {
    const order = this.drawOrder(sc, W).reverse();
    for (const it of order) {
      const def = this.defOf(it), p = this.pos(sc, W, it), c = Math.cos(-p.r), s = Math.sin(-p.r), dx = wx - p.x, dy = wy - p.y;
      const lx = (dx * c - dy * s) / (p.s || 1) * p.fl, ly = (dx * s + dy * c) / (p.s || 1);
      let w = def.w, h = def.h, y0 = -h;
      if (it.k === 'plant') { const hs = lerp(0.3, 1, it.g ?? 1); h = def.h * hs; y0 = def.type === 'float' ? -14 : -h; if (def.type === 'float') h = 28; if (def.type === 'carpet') { y0 = -def.h * 0.5; h = def.h * 0.5 + 8; } }
      if (Math.abs(lx) < w * 0.5 + 6 && ly > y0 - 6 && ly < (it.k === 'plant' && def.type === 'float' ? 30 : 12)) return it;
    }
    return null;
  },

  /** Çizim sırası: önce z, sonra y (aşağıdakiler öne). */
  drawOrder(sc, W) {
    return sc.items.slice().sort((a, b) => ((this.zOf(sc, a) - this.zOf(sc, b)) || (this.pos(sc, W, a).y - this.pos(sc, W, b).y)));
  },
  zOf(sc, it) { if (it.att) { const h = sc.items.find((x) => x.id === it.att.id); if (h) return h.z + 0.1; } return it.z; },

  /** Şablondan tam bir aquascape kurar (öğeler ücretsiz). */
  fromTemplate(key, extraSeed = 0) {
    const T = TEMPLATES[key], sc = this.blank(), rng = new RNG(hashStr(key) + extraSeed);
    sc.liters = T.liters; sc.sub.type = T.sub.type; sc.sub.color = T.sub.color; Object.assign(sc.equip, T.equip);
    for (const k in T.equip) { if (k === 'filter') sc.owned.filter[T.equip.filter] = 1; if (k === 'co2' && T.equip.co2 !== 'none') sc.owned.co2[T.equip.co2] = 1; }
    for (let i = 0; i < SUB_COLS; i++) sc.sub.h[i] = 0.05 + 0.04 * Math.sin(i * 0.5) + (key === 'iwagumi' ? 0.12 * smoothstep(0, SUB_COLS, i) : 0);
    const hosts = { rock: [], wood: [] };
    for (const [k, d, fx, ex = {}] of T.items) {
      const { onRock, onWood, ...rest } = ex, it = this.newItem(sc, k, d, fx, rest, rng);
      const hostKey = onRock !== undefined ? ['rock', onRock] : onWood !== undefined ? ['wood', onWood] : null;
      if (hostKey && hosts[hostKey[0]][hostKey[1]]) { const h = hosts[hostKey[0]][hostKey[1]], hd = this.defOf(h); it.att = { id: h.id, ox: rng.float(-0.2, 0.2) * hd.w, oy: -hd.h * (hostKey[0] === 'rock' ? 0.86 : 0.55) }; it.fx = h.fx; it.gnd = false; }
      sc.items.push(it); if (hosts[k]) hosts[k].push(it);
    }
    return sc;
  },

  clone(sc) { return JSON.parse(JSON.stringify(sc)); },
};
function hashStr(s) { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }

/** Geri al / yinele (en az 30 adım). Anlık görüntü: aquascape + para. */
class UndoStack {
  constructor() { this.u = []; this.r = []; }
  push(snap) { this.u.push(snap); if (this.u.length > 40) this.u.shift(); this.r.length = 0; }
  undo(cur) { if (!this.u.length) return null; this.r.push(cur); return this.u.pop(); }
  redo(cur) { if (!this.r.length) return null; this.u.push(cur); return this.r.pop(); }
}

/** Tank kapasitesi (litre ≈ balık sayısı, en çok 100). */
function tankCap() { return clamp(Math.round(Game.tank.scape.liters), 15, 100); }
