'use strict';
/* =====================================================================
   05 · SAHNE — tank, ışık/gün döngüsü, bitkiler, kabarcıklar, yem, çizim
   Dünya birimi: 20 birim = 1 cm. Tank ölçüsü modele (litreye) bağlıdır; ekran oranından bağımsız.
   ===================================================================== */

class Tank {
  constructor() {
    this.creatures = []; this.food = []; this.bubbles = []; this.ripples = []; this.motes = [];
    this.t = 0; this.W = 1000; this.H = 700; this.light = 1; this.lightTarget = 1; this.foodAge = 99;
    this.lampMode = 'auto'; this.bubbleT = 0; this.co2T = 0; this.minute = 12 * 60; this._lastMin = null;
    this.onEat = null; this.caus = null; this.scape = Scape.blank(); this.rev = 0; this._builtRev = -1; this.frozen = false; this.flowPow = 0.5; this.tint = 0; this.algae = null;
    for (let i = 0; i < 46; i++) this.motes.push({ x: R.next(), y: R.next(), r: R.float(0.6, 1.8), v: R.float(2, 7), ph: R.float(0, TAU), z: R.float(0.5, 1.3) });
  }

  setScape(sc) { this.scape = sc; this.syncDims(); this.touch(); }
  /** Aquascape değişti: zemin dokusu yeniden çizilsin. */
  touch() { this.rev++; this.updateEquipment(); }
  ground(wx) { return Scape.ground(this.scape, this.W, wx); }

  /** Ekipmandan akıntı gücü ve çıkış konumu. */
  updateEquipment() {
    const e = this.scape.equip, f = EQUIP.filter[e.filter];
    this.flowPow = (f ? f.flow : 0) + (e.air ? 0.1 : 0) + 0.08; this.outX = e.filter === 'external' ? 0.93 : 0.06;
  }

  /** Tank modeline göre sabit dünya ölçüsü (ekran oranından bağımsız). */
  setAspect() { this.syncDims(); }
  syncDims() {
    const d = Scape.dims(this.scape); if (d.W === this.W && d.H === this.H && this.bg) return;
    const oW = this.W, oH = this.H; this.W = d.W; this.H = d.H;
    if (this.bg) for (const c of this.creatures) { c.sw.x *= d.W / oW; c.sw.tx *= d.W / oW; c.sw.y = clamp(c.sw.y * d.H / oH, 60, d.H - 90); c.sw.ty = clamp(c.sw.ty * d.H / oH, 60, d.H - 90); }
    for (const it of this.scape.items) if (it.gnd === false && it.y !== undefined) it.y = clamp(it.y, SURFACE + 90, Scape.ground(this.scape, d.W, it.fx * d.W));
    this.buildBG(); this.touch(); if (this.onDims) this.onDims(d);
  }

  buildBG() {
    const W = this.W, H = this.H, sc = Math.min(1.6, 2200 / W); this.bgScale = sc;
    const cv = this.bg || (this.bg = document.createElement('canvas'));
    cv.width = Math.round(W * sc); cv.height = Math.round(H * sc);
    const c = cv.getContext('2d'); c.setTransform(sc, 0, 0, sc, 0, 0); this.drawBackdrop(c);
    if (!this.caus) {
      const cs = 192, cc = document.createElement('canvas'); cc.width = cc.height = cs; const cx = cc.getContext('2d'), id = cx.createImageData(cs, cs);
      for (let y = 0; y < cs; y++) for (let x = 0; x < cs; x++) {
        const u = (x / cs) * TAU, v = (y / cs) * TAU;
        const a = Math.sin(u * 2 + Math.sin(v * 3) * 1.1) + Math.sin(v * 2 + Math.sin(u * 3 + 1) * 1.1) + Math.sin((u + v) * 3 + 0.5);
        const b = Math.max(0, 1 - Math.abs(a) * 1.5), i = (y * cs + x) * 4;
        id.data[i] = 220; id.data[i + 1] = 255; id.data[i + 2] = 255; id.data[i + 3] = Math.pow(b, 2) * 255;
      }
      cx.putImageData(id, 0, 0); this.caus = cc;
    }
  }

  drawBackdrop(c) {
    const W = this.W, H = this.H, kind = this.scape.bg;
    const pal = { blue: ['#2fb9c8', '#17869f', '#0b4a68', '#062c43'], black: ['#10242c', '#0a1a22', '#071218', '#040a0e'], frost: ['#6cc9d0', '#4aa6b4', '#2d7e92', '#175468'], aurora: ['#1b6a8a', '#2a5aa0', '#4a2a7a', '#120a2a'], nature: ['#2fb9c8', '#17869f', '#0b4a68', '#062c43'] }[kind] || [];
    const g = c.createLinearGradient(0, 0, 0, H); g.addColorStop(0, pal[0]); g.addColorStop(0.35, pal[1]); g.addColorStop(0.75, pal[2]); g.addColorStop(1, pal[3]);
    c.fillStyle = g; c.fillRect(0, 0, W, H);
    for (const [fx, fy, r, a] of [[0.25, 0.1, 0.55, 0.22], [0.7, 0.05, 0.6, 0.18], [0.5, 0.5, 0.8, 0.07]]) {
      const rg = c.createRadialGradient(W * fx, H * fy, 0, W * fx, H * fy, Math.max(W, H) * r); rg.addColorStop(0, `rgba(190,255,250,${kind === 'black' ? a * 0.4 : a})`); rg.addColorStop(1, 'rgba(190,255,250,0)'); c.fillStyle = rg; c.fillRect(0, 0, W, H);
    }
    if (kind === 'frost') { c.fillStyle = 'rgba(255,255,255,.12)'; c.fillRect(0, 0, W, H); const r = new RNG(5); for (let i = 0; i < 70; i++) { c.fillStyle = `rgba(255,255,255,${r.float(0.02, 0.07)})`; c.beginPath(); c.arc(r.float(0, W), r.float(0, H), r.float(10, 60), 0, TAU); c.fill(); } }
    if (kind === 'nature') { const r = new RNG(21); for (let i = 0; i < 26; i++) { const x = r.float(0, W), y = H - 90, h = r.float(120, 380); c.strokeStyle = `rgba(10,50,45,${r.float(0.18, 0.4)})`; c.lineWidth = r.float(4, 9); c.lineCap = 'round'; c.beginPath(); c.moveTo(x, y); c.quadraticCurveTo(x + r.float(-40, 40), y - h * 0.5, x + r.float(-30, 30), y - h); c.stroke(); } }
    const gv = c.createLinearGradient(0, 0, 0, H); gv.addColorStop(0, 'rgba(0,20,30,0)'); gv.addColorStop(1, 'rgba(0,15,25,.35)'); c.fillStyle = gv; c.fillRect(0, 0, W, H);
  }

  /** Zemin: yükseklik haritasından, türüne göre dokulu. */
  buildSub() {
    const sc = this.scape, W = this.W, H = this.H, k = this.bgScale || 1, cv = this.subCv || (this.subCv = document.createElement('canvas'));
    if (cv.width !== Math.round(W * k) || cv.height !== Math.round(H * k)) { cv.width = Math.round(W * k); cv.height = Math.round(H * k); }
    const c = cv.getContext('2d'); c.setTransform(k, 0, 0, k, 0, 0); c.clearRect(0, 0, W, H);
    const S = SUBSTRATES[sc.sub.type], [hh, ss, ll] = S.colors[sc.sub.color] || S.colors.natural;
    c.beginPath(); c.moveTo(0, H); for (let x = 0; x <= W + 8; x += 8) c.lineTo(x, this.ground(Math.min(x, W)));
    c.lineTo(W, H); c.closePath();
    const g = c.createLinearGradient(0, H - 74 - SUB_MAX, 0, H); g.addColorStop(0, hsl(hh, ss, ll + 8)); g.addColorStop(0.5, hsl(hh, ss, ll - 6)); g.addColorStop(1, hsl(hh, ss, ll - 20));
    c.fillStyle = g; c.fill(); c.save(); c.clip();
    const r = new RNG(77), n = Math.min(900, W / 2.2), dark = ll < 30;
    for (let i = 0; i < n; i++) {
      const x = r.float(0, W), gy = this.ground(x), y = r.float(gy, H), rr = sc.sub.type === 'gravel' ? r.float(2, 5) : sc.sub.type === 'aquasoil' ? r.float(1.5, 3.5) : sc.sub.type === 'coral' ? r.float(1.5, 4.5) : r.float(0.8, 2.8);
      c.fillStyle = r.pick(dark ? ['rgba(255,255,255,.1)', 'rgba(0,0,0,.4)', 'rgba(90,70,50,.25)'] : ['rgba(255,245,215,.3)', 'rgba(50,40,25,.28)', 'rgba(255,255,255,.14)', 'rgba(100,80,55,.3)']); c.beginPath(); c.ellipse(x, y, rr * 1.35, rr, r.float(0, 3), 0, TAU); c.fill();
    }
    c.restore();
    c.strokeStyle = hsl(hh, ss, ll + 22, 0.55); c.lineWidth = 2; c.beginPath(); for (let x = 0; x <= W + 8; x += 8) { const y = this.ground(Math.min(x, W)); x ? c.lineTo(x, y) : c.moveTo(x, y); } c.stroke();
    this._builtRev = this.rev;
  }

  /* ---------------- Işık / gün döngüsü ---------------- */
  lampTarget(min) {
    if (this.lampMode === 'on') return 1; if (this.lampMode === 'off') return 0;
    const L = this.scape.equip.light, m = (min % 1440) / 60; return m >= L.from && m < L.to ? 1 : 0;
  }
  get lightPower() { return this.scape.equip.light.p / 100; }

  addCreature(c) { this.creatures.push(c); return c; }
  removeCreature(c) { const i = this.creatures.indexOf(c); if (i >= 0) this.creatures.splice(i, 1); }

  feed() {
    if (this.food.filter((f) => !f.eaten).length > 6) return false;
    const n = 14, cx = R.float(this.W * 0.3, this.W * 0.7);
    for (let i = 0; i < n; i++) this.food.push({ x: cx + R.float(-70, 70), y: 30 + R.float(-6, 8), vy: R.float(20, 30), ph: R.float(0, TAU), life: 40, eaten: false, r: R.float(1.6, 2.8) });
    this.ripples.push({ x: cx, y: 28, r: 4, life: 1.4, max: 60 });
    this.foodAge = 0; for (const c of this.creatures) c.sw.eaten = 0;
    return true;
  }

  startleAt(x, y, radius, strength = 1) {
    this.ripples.push({ x, y, r: 3, life: 1.2, max: 50 });
    for (const c of this.creatures) { const d = Math.hypot(c.sw.x - x, c.sw.y - y); if (d < radius && R.next() < 0.9 - c.pers.bold * 0.5) c.sw.startle(x, y, strength * (1 - d / radius * 0.6)); }
  }

  update(dt, minute) {
    if (this._dl !== this.scape.liters) { this._dl = this.scape.liters; this.syncDims(); }
    this.t += dt; this.minute = minute; this.foodAge += dt;
    this.lightTarget = this.lampTarget(minute);
    this.light = damp(this.light, this.lightTarget, 0.55, dt);
    const env = { W: this.W, H: this.H, top: 56, bottom: Math.min(this.H - 76, this.ground(this.W * 0.5) - 6), food: this.food, foodAge: this.foodAge, others: this.creatures, night: 1 - this.light, time: this.t, onEat: this.onEat, ground: (x) => this.ground(x), scape: this.scape };
    if (!this.frozen) for (const c of this.creatures) { c.now = minute; env.bottom = Math.min(this.H - 70, this.ground(c.sw.x) - 10); c.sw.update(dt, env); }
    // yem
    for (const f of this.food) {
      f.life -= dt; if (!f.eaten) { f.y += f.vy * dt * (f.y < 40 ? 0.5 : 1); f.x += Math.sin(this.t * 1.7 + f.ph) * 6 * dt; f.vy = Math.min(f.vy, 28); const gy = this.ground(f.x) - 6; if (f.y > gy) { f.y = gy; f.vy = 0; } }
    }
    for (const f of this.food) if (!f.eaten && f.life <= 0 && typeof Chem !== 'undefined') Chem.waste(1);     // yenmeyen yem suyu kirletir
    this.food = this.food.filter((f) => !f.eaten && f.life > 0);
    // kabarcıklar: hava taşı + CO₂
    const e = this.scape.equip; this.bubbleT -= dt;
    if (e.air && this.bubbleT <= 0) { this.bubbleT = R.float(0.18, 0.6); const bx = this.W * 0.115 + R.float(-3, 3); this.bubbles.push({ x: bx, y: this.ground(bx) - 4, r: R.float(1.6, 4), vy: R.float(40, 70), ph: R.float(0, TAU) }); }
    this.co2T -= dt; if (e.co2 !== 'none' && this.co2T <= 0) { this.co2T = (e.co2 === 'tank' ? 0.12 : 0.5) * R.float(0.7, 1.3); const bx = this.W * 0.2 + R.float(-2, 2); this.bubbles.push({ x: bx, y: this.ground(bx) - 30, r: R.float(0.9, 1.6), vy: R.float(28, 44), ph: R.float(0, TAU), co2: 1 }); }
    // CO₂ + ışık → bitkilerde oksijen kabarcığı (pearling)
    if (e.co2 !== 'none' && typeof Chem !== 'undefined' && Chem.w.co2 > 14 && this.light > 0.5 && R.next() < dt * 2.5) {
      const ps = this.scape.items.filter((i) => i.k === 'plant' && (PLANTS[i.d].type === 'stem' || PLANTS[i.d].type === 'carpet')); if (ps.length) { const it = R.pick(ps), p = Scape.pos(this.scape, this.W, it), d = PLANTS[it.d]; this.bubbles.push({ x: p.x + R.float(-14, 14), y: p.y - (d.type === 'carpet' ? 10 : d.h * R.float(0.3, 0.9) * (it.g ?? 1)), r: R.float(0.8, 1.5), vy: R.float(30, 50), ph: R.float(0, TAU), co2: 1 }); }
    }
    for (const b of this.bubbles) { b.y -= b.vy * dt; b.x += Math.sin(this.t * 3 + b.ph) * 9 * dt; b.r += dt * (b.co2 ? 0.1 : 0.5); }
    for (let i = this.bubbles.length - 1; i >= 0; i--) if (this.bubbles[i].y < 30) { if (R.chance(0.25)) this.ripples.push({ x: this.bubbles[i].x, y: 28, r: 2, life: 0.9, max: 18 }); this.bubbles.splice(i, 1); }
    for (const r of this.ripples) { r.life -= dt; r.r += (r.max / 1.2) * dt; }
    if (this.molts) this.molts = this.molts.filter((m) => this.t - m.t < 110);
    this.ripples = this.ripples.filter((r) => r.life > 0);
    for (const m of this.motes) { m.y -= m.v * dt * 0.004; m.x += Math.sin(this.t * 0.2 + m.ph) * 0.0002; if (m.y < 0) m.y = 1; }
    // bitki büyümesi (Aşama 4'te kimyaya bağlanır): Chem.growPlants varsa o kullanılır
    if (this._lastMin !== null && minute > this._lastMin && !(typeof Chem !== 'undefined' && Chem.active)) { const dm = minute - this._lastMin; for (const it of this.scape.items) if (it.k === 'plant' && it.g < 1) it.g = Math.min(1, it.g + dm * PLANTS[it.d].grow / (6 * 1440)); }
    this._lastMin = minute;
  }

  /** Dokunma/tıklama: dünya koordinatında en yakın balık. */
  hit(wx, wy, minR = 24) {
    let best = null, bd = 1e9;
    for (const c of this.creatures) {
      const s = c.sw, r = Math.max(minR, c.bodyLen() * 0.8), d = Math.hypot(s.x - wx, s.y - wy);
      if (d < r && d < bd) { bd = d; best = c; }
    }
    return best;
  }

  /* ---------------- Öğe çizimi ---------------- */
  drawItem(ctx, it, t, off) {
    const sc = this.scape, def = Scape.defOf(it), p = Scape.pos(sc, this.W, it);
    if (Scape.isHard(it)) {
      const s = Art.sprite(it), R_ = Art.RES; ctx.save(); ctx.translate(p.x + off, p.y); ctx.rotate(p.r); ctx.scale(p.s * p.fl, p.s);
      ctx.drawImage(s.cv, -s.ax / R_, -s.ay / R_, s.cv.width / R_, s.cv.height / R_); ctx.restore();
    } else {
      const prox = 0.5 + 0.5 * Math.max(0, 1 - Math.abs(p.x - this.outX * this.W) / (this.W * 0.55));
      Art.drawPlant(ctx, it, def, p.x + off, p.y, { t, flow: this.flowPow * prox * 0.9, ground: (wx) => this.ground(wx - off) });
    }
  }

  /** Yosunlar: camda yeşil nokta, yapraklarda saç, taşlarda siyah sakal, zeminde siyanobakteri. */
  drawAlgae(ctx, t) {
    const a = this.algae, sc = this.scape, W = this.W, H = this.H;
    if (a.green > 0.04) { const r = new RNG(11), n = Math.floor(a.green * 110); ctx.fillStyle = 'rgba(80,175,55,.5)'; for (let i = 0; i < n; i++) { ctx.beginPath(); ctx.arc(r.float(0, W), r.float(50, H - 40), r.float(1, 3.4), 0, TAU); ctx.fill(); } }
    if (a.cyano > 0.05) { const r = new RNG(31), n = Math.floor(a.cyano * 30); for (let i = 0; i < n; i++) { const x = r.float(0, W), gy = this.ground(x), wd = r.float(18, 52); ctx.fillStyle = `rgba(30,150,125,${0.35 + 0.25 * Math.sin(t * 0.6 + i)})`; ctx.beginPath(); ctx.ellipse(x, gy - 1, wd, r.float(3, 7), 0, 0, TAU); ctx.fill(); } }
    if (a.hair > 0.05 || a.bba > 0.05) {
      for (const it of sc.items) {
        if (it.k === 'leaf') continue; const def = Scape.defOf(it), p = Scape.pos(sc, W, it), r = new RNG(it.seed), hw = def.w * (it.s || 1), hh = (it.k === 'plant' ? def.h * lerp(0.3, 1, it.g ?? 1) : def.h) * (it.s || 1);
        if (it.k === 'plant' && PLANTS[it.d].type === 'float') continue;
        for (let i = 0, n = Math.floor(a.hair * 10); i < n; i++) { const x = p.x + (r.next() - 0.5) * hw * 0.8, y = p.y - hh * r.float(0.15, 0.9), L = 10 + r.next() * 14; ctx.strokeStyle = 'rgba(100,170,70,.75)'; ctx.lineWidth = 1.1; ctx.beginPath(); ctx.moveTo(x, y); ctx.bezierCurveTo(x + Math.sin(t * 1.2 + i) * 4, y - L * 0.3, x - Math.sin(t + i) * 5, y - L * 0.7, x + Math.sin(t * 0.8 + i * 2) * 5, y - L); ctx.stroke(); }
        if (it.k !== 'plant') for (let i = 0, n = Math.floor(a.bba * 9); i < n; i++) { const x = p.x + (r.next() - 0.5) * hw * 0.8, y = p.y - hh * r.float(0.1, 0.8); ctx.strokeStyle = 'rgba(40,46,52,.9)'; ctx.lineWidth = 1.8; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + r.float(-5, 5), y - r.float(4, 9)); ctx.stroke(); }
      }
    }
  }

  drawEquip(ctx, t) {
    const e = this.scape.equip, W = this.W, H = this.H, gy = (x) => this.ground(x);
    ctx.save(); ctx.lineCap = 'round';
    if (e.filter === 'sponge') { const x = W * 0.07, y = gy(x); ctx.fillStyle = '#7b8a52'; ctx.strokeStyle = '#4c5a31'; ctx.lineWidth = 2; ctx.beginPath(); ctx.roundRect(x - 18, y - 58, 36, 62, 8); ctx.fill(); ctx.stroke(); ctx.fillStyle = 'rgba(0,0,0,.25)'; for (let i = 0; i < 14; i++) { ctx.beginPath(); ctx.arc(x - 12 + (i * 7) % 24, y - 52 + ((i * 13) % 50), 1.8, 0, TAU); ctx.fill(); } ctx.strokeStyle = '#223'; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(x, y - 58); ctx.lineTo(x, 14); ctx.stroke(); }
    else if (e.filter === 'internal') { const x = W * 0.045, y = gy(x); ctx.fillStyle = '#1b2428'; ctx.beginPath(); ctx.roundRect(x - 16, y - 110, 32, 112, 6); ctx.fill(); ctx.strokeStyle = 'rgba(255,255,255,.12)'; ctx.stroke(); ctx.strokeStyle = '#2b363c'; ctx.lineWidth = 3; for (let i = 0; i < 9; i++) { ctx.beginPath(); ctx.moveTo(x - 10, y - 20 - i * 9); ctx.lineTo(x + 10, y - 20 - i * 9); ctx.stroke(); } ctx.fillStyle = '#1b2428'; ctx.fillRect(x - 5, y - 130, 56, 12); ctx.fillStyle = 'rgba(255,255,255,.2)'; for (let i = 0; i < 5; i++) ctx.fillRect(x + 4 + i * 9, y - 126, 3, 4); }
    else if (e.filter === 'external') { const x = W - 26; ctx.strokeStyle = 'rgba(190,230,240,.55)'; ctx.lineWidth = 7; ctx.beginPath(); ctx.moveTo(x, 8); ctx.lineTo(x, gy(x) - 30); ctx.stroke(); ctx.strokeStyle = 'rgba(190,230,240,.35)'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(x - 4, 8); ctx.lineTo(x - 4, gy(x) - 30); ctx.stroke(); ctx.strokeStyle = 'rgba(190,230,240,.5)'; ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(W - 58, 8); ctx.lineTo(W - 58, 36); ctx.quadraticCurveTo(W - 58, 62, W - 100, 62); ctx.stroke(); }
    if (e.heater) { const x = W - 12; ctx.strokeStyle = 'rgba(210,225,230,.5)'; ctx.lineWidth = 7; ctx.beginPath(); ctx.moveTo(x - 30, 14); ctx.lineTo(x - 12, gy(x) - 80); ctx.stroke(); ctx.strokeStyle = `rgba(255,120,60,${0.4 + 0.2 * Math.sin(t * 2)})`; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(x - 29, gy(x) - 150); ctx.lineTo(x - 12, gy(x) - 80); ctx.stroke(); }
    if (e.co2 !== 'none') { const x = W * 0.2, y = gy(x); ctx.strokeStyle = 'rgba(160,200,215,.5)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x, y - 24); ctx.quadraticCurveTo(x - 30, 100, x - 60, 14); ctx.stroke(); ctx.fillStyle = 'rgba(210,225,230,.7)'; ctx.beginPath(); ctx.ellipse(x, y - 24, 14, 6, 0, 0, TAU); ctx.fill(); ctx.strokeStyle = 'rgba(0,0,0,.3)'; ctx.lineWidth = 1; ctx.stroke(); }
    if (e.air) { const x = W * 0.115, y = gy(x); ctx.fillStyle = '#556'; ctx.beginPath(); ctx.ellipse(x, y - 2, 11, 5, 0, 0, TAU); ctx.fill(); }
    ctx.restore();
  }

  /**
   * v: {cw, ch, dpr, cx, cy, zoom, par, low, reduce, design, dry, after(ctx), fishAlpha}
   */
  /** Oda: duvar, tank sehpası (dolap), zemin gölgesi — tank letterbox'ta gerçek bir akvaryum gibi görünsün. */
  drawRoom(ctx, v, tx, ty, S, dpr) {
    const cw = v.cw, ch = v.ch, W = this.W, H = this.H, L = tx, T = ty, Rr = tx + W * S, B = ty + H * S;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const night = 1 - this.light, wall = ctx.createLinearGradient(0, 0, 0, ch); wall.addColorStop(0, '#16303d'); wall.addColorStop(0.6, '#0e222d'); wall.addColorStop(1, '#091820'); ctx.fillStyle = wall; ctx.fillRect(0, 0, cw, ch);
    // duvarda hafif doku/ışık
    const wl = ctx.createRadialGradient((L + Rr) / 2, T, 10, (L + Rr) / 2, T, Math.max(cw, ch)); wl.addColorStop(0, `rgba(120,200,210,${0.16 * (1 - night * 0.7)})`); wl.addColorStop(1, 'rgba(120,200,210,0)'); ctx.fillStyle = wl; ctx.fillRect(0, 0, cw, ch);
    if (B < ch + 4) { // sehpa
      const sw = 14 * S, x0 = L - 190 * S, x1 = Rr + 190 * S, y0 = B + 4 * S;
      ctx.fillStyle = 'rgba(0,0,0,.35)'; ctx.fillRect(x0 + 6 * S, y0 - 2, x1 - x0, 10 * S + 6);                           // tank altı gölge
      const wood = ctx.createLinearGradient(0, y0, 0, y0 + 40 * S); wood.addColorStop(0, '#7a5232'); wood.addColorStop(0.1, '#5e3e26'); wood.addColorStop(1, '#3a2617');
      ctx.fillStyle = wood; ctx.fillRect(x0, y0, x1 - x0, Math.max(0, ch - y0));                                              // dolap gövdesi
      ctx.fillStyle = '#8c6240'; ctx.fillRect(x0 - 4 * S, y0 - sw * 0.35, x1 - x0 + 8 * S, sw * 0.7); ctx.fillStyle = 'rgba(255,230,190,.25)'; ctx.fillRect(x0 - 4 * S, y0 - sw * 0.35, x1 - x0 + 8 * S, Math.max(1, 2 * S)); // üst tabla
      const dw = (x1 - x0) / 2; ctx.strokeStyle = 'rgba(0,0,0,.4)'; ctx.lineWidth = Math.max(1, 2 * S);
      for (let i = 0; i < 2; i++) { const dx = x0 + i * dw + 8 * S; ctx.strokeRect(dx, y0 + 16 * S, dw - 16 * S, Math.max(10, 90 * S)); ctx.fillStyle = '#b6a58d'; ctx.beginPath(); ctx.arc(dx + (i ? 12 : dw - 28) * S, y0 + 60 * S, Math.max(2, 4 * S), 0, TAU); ctx.fill(); }
    }
  }
  /** Cam kenarı: siyah silikon çerçeve, kalınlık vurguları, ince yansıma. */
  drawFrame(ctx, W, H) {
    const rim = 7, g = ctx.createLinearGradient(0, -rim, 0, 0); g.addColorStop(0, '#1c2a31'); g.addColorStop(1, '#0a1014');
    ctx.fillStyle = g; ctx.fillRect(-rim, -rim, W + rim * 2, rim); ctx.fillStyle = '#0a1014'; ctx.fillRect(-rim, H, W + rim * 2, rim); ctx.fillStyle = '#10181d'; ctx.fillRect(-rim, 0, rim, H); ctx.fillRect(W, 0, rim, H);
    ctx.fillStyle = 'rgba(200,235,240,.22)'; ctx.fillRect(0, 0, W, 2); ctx.fillRect(0, 0, 2, H); ctx.fillStyle = 'rgba(0,0,0,.25)'; ctx.fillRect(W - 3, 0, 3, H); ctx.fillRect(0, H - 3, W, 3);
    const gl = ctx.createLinearGradient(0, 0, W * 0.35, H * 0.5); gl.addColorStop(0, 'rgba(255,255,255,.07)'); gl.addColorStop(1, 'rgba(255,255,255,0)'); ctx.fillStyle = gl; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(W * 0.28, 0); ctx.lineTo(0, H * 0.45); ctx.fill();
  }

  render(ctx, v) {
    if (this._builtRev !== this.rev) this.buildSub();
    const S = v.S ?? (v.cw / this.W) * v.zoom, dpr = v.dpr, t = this.t, W = this.W, H = this.H, reduce = v.reduce, sc = this.scape;
    ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.fillStyle = '#06141d'; ctx.fillRect(0, 0, v.cw * dpr, v.ch * dpr);
    const tx = v.cw / 2 - v.cx * S, ty = (v.cy0 ?? v.ch / 2) - v.cy * S, base = [dpr * S, 0, 0, dpr * S, dpr * tx, dpr * ty];
    this.drawRoom(ctx, v, tx, ty, S, dpr);
    ctx.setTransform(base[0], base[1], base[2], base[3], base[4], base[5]);
    ctx.save(); ctx.beginPath(); ctx.rect(0, 0, W, H); ctx.clip();       // sahne yalnızca cam içinde
    const px = v.cx - W / 2 + (v.par || 0), L = v.dry ? 0.6 : this.light * (0.35 + 0.65 * this.lightPower) + (1 - this.lightPower) * 0 + (this.light > 0.5 ? 0 : 0);
    const lightK = this.light;
    if (v.dry) { const g = ctx.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#dfe9ee'); g.addColorStop(1, '#a9bcc4'); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H); }
    else ctx.drawImage(this.bg, 0, 0, W, H);
    // ışık hüzmeleri
    const rayA = v.dry ? 0 : (0.13 * lightK + 0.05 * (1 - lightK)) * (0.45 + 0.8 * this.lightPower);
    if (rayA > 0.01) {
      ctx.save(); ctx.globalCompositeOperation = 'lighter';
      for (let i = 0; i < (v.low ? 3 : 7); i++) {
        const bx = W * (0.08 + i * 0.14) + Math.sin(t * 0.15 + i * 2) * 24 + px * 0.15, wTop = 30 + 20 * ((i * 7) % 3), wBot = wTop * 2.6, br = 0.65 + 0.35 * Math.sin(t * 0.45 + i * 1.7);
        const g = ctx.createLinearGradient(0, 24, 0, H * 0.9), col = lightK > 0.5 ? specOf(this.scape).ray : '150,180,255';
        g.addColorStop(0, `rgba(${col},${rayA * br})`); g.addColorStop(1, `rgba(${col},0)`);
        ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(bx - wTop / 2, 24); ctx.lineTo(bx + wTop / 2, 24); ctx.lineTo(bx + wBot / 2 - 90, H * 0.9); ctx.lineTo(bx - wBot / 2 - 90, H * 0.9); ctx.closePath(); ctx.fill();
      }
      ctx.restore();
    }
    // öğeler: arka → zemin → orta → (kostik) → balıklar → ön
    const order = Scape.drawOrder(sc, W), bucket = (z) => order.filter((it) => Math.floor(Scape.zOf(sc, it) + 0.001) === z);
    const off = (z) => (z === 0 ? px * 0.3 : z === 2 ? px * -0.12 : 0);
    for (const it of bucket(0)) this.drawItem(ctx, it, t, off(0));
    ctx.drawImage(this.subCv, 0, 0, W, H);
    for (const it of bucket(1)) this.drawItem(ctx, it, t, off(1));
    this.drawEquip(ctx, t);
    if (!v.dry && lightK > 0.05 && !reduce && !v.low) {
      ctx.save(); ctx.globalAlpha = 0.12 * lightK * (0.4 + 0.8 * this.lightPower); ctx.globalCompositeOperation = 'lighter';
      ctx.beginPath(); ctx.rect(0, H - 170, W, 170); ctx.clip();
      const cs = 1.7, ox = t * 7, oy = t * 4; ctx.translate(ox, oy); ctx.scale(cs, cs);
      ctx.fillStyle = ctx.createPattern(this.caus, 'repeat'); ctx.fillRect(-ox / cs, (H - 170 - oy) / cs, W / cs, 170 / cs);
      ctx.restore();
    }
    // balıklar (derinliğe göre)
    if (!v.dry) {
      const list = this.creatures.slice().sort((a, b) => a.sw.z - b.sw.z), fa = v.fishAlpha ?? 1;
      const vx0 = (-tx) / S - 160, vx1 = (v.cw - tx) / S + 160, vy0 = (-ty) / S - 160, vy1 = (v.ch - ty) / S + 160;
      for (const c of list) {
        const s = c.sw; if (s.x < vx0 || s.x > vx1 || s.y < vy0 || s.y > vy1) continue;
        (c.def.kind === 'fish' ? FishArt : CrawlerArt).draw(ctx, c, t, 0.9 + 0.2 * s.z, (0.82 + 0.18 * s.z) * fa, base);
        if (c.fav && v.showFav) { ctx.fillStyle = '#ffd36b'; ctx.font = '14px sans-serif'; ctx.fillText('★', s.x - 5, s.y - c.bodyLen() * 0.55); }
      }
    }
    for (const it of bucket(2)) this.drawItem(ctx, it, t, off(2));
    if (!v.dry && this.algae) this.drawAlgae(ctx, t);
    // yem
    for (const f of this.food) { ctx.fillStyle = `rgba(230,190,110,${clamp(f.life / 6, 0.2, 1)})`; ctx.beginPath(); ctx.ellipse(f.x, f.y, f.r * 1.5, f.r, f.ph, 0, TAU); ctx.fill(); }
    // kabarcıklar
    if (!v.dry) for (const b of this.bubbles) {
      ctx.strokeStyle = b.co2 ? 'rgba(235,255,255,.75)' : 'rgba(220,255,255,.55)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(b.x, b.y, b.r, 0, TAU); ctx.stroke();
      ctx.fillStyle = 'rgba(255,255,255,.12)'; ctx.fill(); if (!b.co2) { ctx.fillStyle = 'rgba(255,255,255,.7)'; ctx.beginPath(); ctx.arc(b.x - b.r * 0.35, b.y - b.r * 0.35, b.r * 0.22, 0, TAU); ctx.fill(); }
    }
    // asılı parçacıklar
    if (!v.dry) { ctx.fillStyle = 'rgba(220,255,250,.35)'; for (const m of (v.low ? [] : this.motes)) { ctx.globalAlpha = (0.25 + 0.5 * lightK) * m.z * 0.6; ctx.beginPath(); ctx.arc(m.x * W + px * 0.3 * m.z, m.y * H, m.r, 0, TAU); ctx.fill(); } ctx.globalAlpha = 1; }
    // su yüzeyi
    ctx.save(); ctx.fillStyle = v.dry ? '#e9f0f3' : '#081a24'; ctx.beginPath(); ctx.moveTo(-50, -60);
    ctx.lineTo(W + 50, -60); for (let x = W + 50; x >= -50; x -= 12) ctx.lineTo(x, 24 + (v.dry ? 0 : Math.sin(x * 0.02 + t * 1.1) * 1.8 + Math.sin(x * 0.047 - t * 1.7) * 1.1));
    ctx.closePath(); ctx.fill();
    if (!v.dry) {
      const sg = ctx.createLinearGradient(0, 22, 0, 70); sg.addColorStop(0, `rgba(210,255,255,${0.35 * lightK + 0.1})`); sg.addColorStop(1, 'rgba(210,255,255,0)'); ctx.fillStyle = sg; ctx.fillRect(-50, 22, W + 100, 50);
      ctx.strokeStyle = 'rgba(230,255,255,.5)'; ctx.lineWidth = 1.4; ctx.beginPath(); for (let x = -50; x <= W + 50; x += 12) { const y = 24 + Math.sin(x * 0.02 + t * 1.1) * 1.8 + Math.sin(x * 0.047 - t * 1.7) * 1.1; x === -50 ? ctx.moveTo(x, y) : ctx.lineTo(x, y); } ctx.stroke();
    }
    ctx.restore();
    ctx.restore();
    this.drawEquipOutside(ctx, v);                                         // armatür, hortumlar, tüp, pompa (cam dışı)
    if (!v.dry) {
      for (const cl of this.clutches || []) { const r = new RNG(Math.floor(cl.x) + cl.n); for (let i = 0, n = Math.min(26, 8 + cl.n / 5); i < n; i++) { ctx.fillStyle = `rgba(255,${120 + (i * 13) % 50},${160 + (i * 7) % 40},.92)`; ctx.beginPath(); ctx.arc(cl.x + r.float(-14, 14), 15 - r.float(0, 7) * 0.5, r.float(2, 3.4), 0, TAU); ctx.fill(); } }
      for (const c of this.creatures) if (c.nestUntil > this.minute && c.sex === 'M') { const r = new RNG(c.id); ctx.strokeStyle = 'rgba(240,250,255,.8)'; ctx.fillStyle = 'rgba(255,255,255,.35)'; for (let i = 0; i < 18; i++) { const bx = c.sw.x + r.float(-26, 26), br = r.float(2.5, 5); ctx.beginPath(); ctx.arc(bx, 29 + r.float(-2, 4), br, 0, TAU); ctx.fill(); ctx.stroke(); } }
      for (const m of this.molts || []) { const a = clamp(1 - (this.t - m.t) / 110, 0, 1) * 0.55; ctx.strokeStyle = `rgba(235,245,250,${a})`; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.ellipse(m.x, m.y + 2, 9, 2.4, 0.1, 0, TAU); ctx.stroke(); ctx.beginPath(); ctx.moveTo(m.x - 9, m.y + 2); ctx.quadraticCurveTo(m.x - 14, m.y - 4, m.x - 6, m.y - 5); ctx.stroke(); }
    }
    if (!v.dry) for (const r of this.ripples) { ctx.strokeStyle = `rgba(230,255,255,${clamp(r.life, 0, 1) * 0.5})`; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.ellipse(r.x, r.y, r.r * 1.6, r.r * 0.5, 0, 0, TAU); ctx.stroke(); }
    // gece / gün-doğumu rengi
    const night = 1 - this.light;
    if (!v.dry) {
      if (night > 0.01) { ctx.fillStyle = `rgba(8,18,60,${0.58 * night})`; ctx.fillRect(0, 0, W, H); }
      const warm = Math.sin(Math.PI * this.light); if (warm > 0.02 && this.light > 0.02 && this.light < 0.98) { ctx.fillStyle = `rgba(255,140,70,${0.16 * warm})`; ctx.fillRect(0, 0, W, H); }
      if (this.tint > 0.01) { ctx.fillStyle = `rgba(110,70,20,${0.32 * this.tint})`; ctx.fillRect(0, 24, W, H); }          // tanen: çay rengi
      if (this.greenWater > 0.01) { ctx.fillStyle = `rgba(60,150,40,${0.35 * this.greenWater})`; ctx.fillRect(0, 24, W, H); }
    }
    if (!v.dry) this.drawFrame(ctx, W, H);
    if (v.after) v.after(ctx);
    // cam: ekran uzayında vinyet + yansıma
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const vg = ctx.createRadialGradient(v.cw / 2, v.ch / 2, Math.min(v.cw, v.ch) * 0.35, v.cw / 2, v.ch / 2, Math.max(v.cw, v.ch) * 0.75);
    vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(0,10,18,.5)'); ctx.fillStyle = vg; ctx.fillRect(0, 0, v.cw, v.ch);
    const rg = ctx.createLinearGradient(0, 0, v.cw, v.ch * 0.6); rg.addColorStop(0, 'rgba(255,255,255,.07)'); rg.addColorStop(0.18, 'rgba(255,255,255,0)'); ctx.fillStyle = rg; ctx.fillRect(0, 0, v.cw, v.ch);
  }
}

/** Başlangıç popülasyonu: karışık erkek/dişi; dişiler gizli gen taşır. */
function createStarterFish(tank, now) {
  const mk = (spec, sex, age) => tank.addCreature(new Creature({ genome: Genetics.make(spec, sex), bornT: now - age * 1440, x: R.float(160, tank.W - 160), y: R.float(160, tank.H - 220) }));
  const A = 90;
  mk({ tc: 'red', tail: 'delta' }, 'M', A); mk({ tc: 'blue', tail: 'fan', body: ['W', 'blu'] }, 'M', A + 5);
  mk({ body: ['gld', 'gld'], tail: 'round', tc: 'none' }, 'M', A + 12);
  mk({ tail: 'veil', X: { tc: 'blue' }, X2: {}, body: ['W', 'alb'] }, 'F', A + 20);
  mk({ tail: 'delta', X: { tc: 'red', tux: 1 }, X2: { tc: 'green' } }, 'F', A + 8);
  mk({ tail: 'fan', body: ['W', 'bld'], X: { sb: 1 } }, 'F', A + 3);
  for (const c of tank.creatures) { Pedigree.add(c.id, 0, 0); }
  return tank.creatures;
}
