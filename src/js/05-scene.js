'use strict';
/* =====================================================================
   05 · SAHNE — tank, ışık/gün döngüsü, bitkiler, kabarcıklar, yem, çizim
   Dünya birimi: yükseklik 700. Genişlik, ekranın en-boy oranına uyar.
   ===================================================================== */

class Tank {
  constructor() {
    this.creatures = []; this.food = []; this.bubbles = []; this.ripples = []; this.motes = []; this.sparks = [];
    this.t = 0; this.W = 1000; this.H = 700; this.light = 1; this.lightTarget = 1; this.foodAge = 99; this.bgKey = '';
    this.lampMode = 'auto'; this.bubbleT = 0; this.minute = 12 * 60; this.plants = []; this.rocks = [];
    this.onEat = null; this.caus = null;
    for (let i = 0; i < 46; i++) this.motes.push({ x: R.next(), y: R.next(), r: R.float(0.6, 1.8), v: R.float(2, 7), ph: R.float(0, TAU), z: R.float(0.5, 1.3) });
  }

  /** Ekran oranına göre dünya genişliği. */
  setAspect(aspect) {
    const W = Math.round(clamp(700 * aspect, 440, 1700));
    if (Math.abs(W - this.W) < 2 && this.bg) return;
    const old = this.W; this.W = W;
    for (const c of this.creatures) { c.sw.x *= W / old; c.sw.tx *= W / old; }
    this.layout(); this.buildBG();
  }

  layout() {
    const r = new RNG(20240612), W = this.W, H = this.H, gy = H - 74;
    this.rocks = [
      { x: W * 0.30, y: gy + 6, w: 150, h: 92, ph: 0 }, { x: W * 0.37, y: gy + 10, w: 92, h: 58, ph: 1 },
      { x: W * 0.74, y: gy + 8, w: 130, h: 70, ph: 2 },
    ];
    const P = [];
    const frac = [0.05, 0.1, 0.16, 0.54, 0.6, 0.9, 0.95];
    frac.forEach((f, i) => P.push({ type: 'vallis', x: W * f + r.float(-10, 10), y: gy + r.float(2, 10), h: r.float(190, 300) * (i % 2 ? 0.9 : 1), n: 8, layer: 'mid', ph: r.float(0, TAU) }));
    P.push({ type: 'stem', x: W * 0.83, y: gy + 4, h: 230, n: 3, layer: 'mid', ph: 1.2 }, { type: 'stem', x: W * 0.47, y: gy + 6, h: 170, n: 3, layer: 'mid', ph: 2.4 });
    P.push({ type: 'anubias', x: this.rocks[0].x + 20, y: this.rocks[0].y - this.rocks[0].h * 0.55, h: 70, n: 6, layer: 'mid', ph: 0.5 });
    P.push({ type: 'anubias', x: this.rocks[2].x - 10, y: this.rocks[2].y - this.rocks[2].h * 0.5, h: 56, n: 5, layer: 'mid', ph: 3 });
    // uzak (arka plan) bitkiler — soluk, yavaş paralaks
    [0.22, 0.42, 0.66, 0.8].forEach((f) => P.push({ type: 'vallis', x: W * f, y: gy - 6, h: r.float(150, 210), n: 6, layer: 'far', ph: r.float(0, TAU) }));
    // ön plan
    [0.2, 0.68, 0.98].forEach((f) => P.push({ type: 'vallis', x: W * f, y: gy + 40, h: r.float(110, 150), n: 5, layer: 'front', ph: r.float(0, TAU) }));
    this.plants = P;
  }

  buildBG() {
    const W = this.W, H = this.H, sc = Math.min(1.6, 2200 / W);
    const cv = this.bg || (this.bg = document.createElement('canvas'));
    cv.width = Math.round(W * sc); cv.height = Math.round(H * sc);
    const c = cv.getContext('2d'); c.setTransform(sc, 0, 0, sc, 0, 0);
    const g = c.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, '#2fb9c8'); g.addColorStop(0.35, '#17869f'); g.addColorStop(0.75, '#0b4a68'); g.addColorStop(1, '#062c43');
    c.fillStyle = g; c.fillRect(0, 0, W, H);
    // yumuşak ışık havuzları
    for (const [fx, fy, r, a] of [[0.25, 0.1, 0.55, 0.22], [0.7, 0.05, 0.6, 0.18], [0.5, 0.5, 0.8, 0.07]]) {
      const rg = c.createRadialGradient(W * fx, H * fy, 0, W * fx, H * fy, Math.max(W, H) * r);
      rg.addColorStop(0, `rgba(190,255,250,${a})`); rg.addColorStop(1, 'rgba(190,255,250,0)'); c.fillStyle = rg; c.fillRect(0, 0, W, H);
    }
    // zemin (kum) — dalgalı profil
    const r = new RNG(77), gy = H - 78;
    c.beginPath(); c.moveTo(0, H);
    for (let x = 0; x <= W; x += 10) c.lineTo(x, gy + 8 + Math.sin(x * 0.011) * 7 + Math.sin(x * 0.027 + 1) * 4);
    c.lineTo(W, H); c.closePath();
    const gs = c.createLinearGradient(0, gy, 0, H); gs.addColorStop(0, '#cdb88c'); gs.addColorStop(0.5, '#a58f66'); gs.addColorStop(1, '#6a5a3e');
    c.fillStyle = gs; c.fill();
    c.save(); c.clip();
    for (let i = 0; i < W / 3.2; i++) { const x = r.float(0, W), y = r.float(gy, H), rr = r.float(0.8, 3.2); c.fillStyle = r.pick(['rgba(255,240,200,.28)', 'rgba(60,45,25,.3)', 'rgba(255,255,255,.12)', 'rgba(110,90,60,.35)']); c.beginPath(); c.ellipse(x, y, rr * 1.4, rr, 0, 0, TAU); c.fill(); }
    c.restore();
    // taşlar
    for (const k of this.rocks) {
      const pts = []; const n = 11;
      for (let i = 0; i < n; i++) { const a = Math.PI + (i / (n - 1)) * Math.PI; pts.push([k.x + Math.cos(a) * k.w * 0.5 * (0.88 + r.next() * 0.2), k.y + Math.sin(a) * k.h * (0.8 + r.next() * 0.25)]); }
      pts.push([k.x + k.w * 0.5, k.y + 14], [k.x - k.w * 0.5, k.y + 14]);
      c.beginPath(); pts.forEach(([x, y], i) => (i ? c.lineTo(x, y) : c.moveTo(x, y))); c.closePath();
      const rg = c.createLinearGradient(k.x - k.w * 0.4, k.y - k.h, k.x + k.w * 0.4, k.y + 10);
      rg.addColorStop(0, '#7e8f9c'); rg.addColorStop(0.5, '#4e5e6c'); rg.addColorStop(1, '#2a3541');
      c.fillStyle = rg; c.fill(); c.strokeStyle = 'rgba(0,0,0,.35)'; c.lineWidth = 1.5; c.stroke();
      c.strokeStyle = 'rgba(255,255,255,.14)'; c.lineWidth = 1; for (let i = 0; i < 4; i++) { c.beginPath(); c.moveTo(k.x - k.w * 0.3 + i * 18, k.y - k.h * 0.6 + i * 6); c.lineTo(k.x - k.w * 0.1 + i * 16, k.y - k.h * 0.2); c.stroke(); }
    }
    // arka cam gölgesi
    const gv = c.createLinearGradient(0, 0, 0, H); gv.addColorStop(0, 'rgba(0,20,30,0)'); gv.addColorStop(1, 'rgba(0,15,25,.35)'); c.fillStyle = gv; c.fillRect(0, 0, W, H);
    // kostik deseni
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

  /* ---------------- Işık / gün döngüsü ---------------- */
  lampTarget(min) {
    if (this.lampMode === 'on') return 1; if (this.lampMode === 'off') return 0;
    const m = min % 1440; return m >= 420 && m < 1260 ? 1 : 0;           // 07:00–21:00
  }

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
    this.t += dt; this.minute = minute; this.foodAge += dt;
    this.lightTarget = this.lampTarget(minute);
    this.light = damp(this.light, this.lightTarget, 0.55, dt);
    const env = { W: this.W, H: this.H, top: 56, bottom: this.H - 76, food: this.food, foodAge: this.foodAge, others: this.creatures, night: 1 - this.light, time: this.t, onEat: this.onEat };
    for (const c of this.creatures) { c.now = minute; c.sw.update(dt, env); }
    // yem
    for (const f of this.food) {
      f.life -= dt; if (!f.eaten) { f.y += f.vy * dt * (f.y < 40 ? 0.5 : 1); f.x += Math.sin(this.t * 1.7 + f.ph) * 6 * dt; f.vy = Math.min(f.vy, 28); if (f.y > this.H - 82) { f.y = this.H - 82; f.vy = 0; } }
    }
    this.food = this.food.filter((f) => !f.eaten && f.life > 0);
    // kabarcıklar
    this.bubbleT -= dt;
    if (this.bubbleT <= 0) { this.bubbleT = R.float(0.18, 0.6); const bx = this.W * 0.115 + R.float(-3, 3); this.bubbles.push({ x: bx, y: this.H - 84, r: R.float(1.6, 4), vy: R.float(40, 70), ph: R.float(0, TAU) }); }
    for (const b of this.bubbles) { b.y -= b.vy * dt; b.x += Math.sin(this.t * 3 + b.ph) * 9 * dt; b.r += dt * 0.5; }
    for (let i = this.bubbles.length - 1; i >= 0; i--) if (this.bubbles[i].y < 30) { if (R.chance(0.25)) this.ripples.push({ x: this.bubbles[i].x, y: 28, r: 2, life: 0.9, max: 18 }); this.bubbles.splice(i, 1); }
    for (const r of this.ripples) { r.life -= dt; r.r += (r.max / 1.2) * dt; }
    this.ripples = this.ripples.filter((r) => r.life > 0);
    for (const m of this.motes) { m.y -= m.v * dt * 0.004; m.x += Math.sin(this.t * 0.2 + m.ph) * 0.0002; if (m.y < 0) m.y = 1; }
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

  /* ---------------- Çizim ---------------- */
  drawPlant(ctx, p, t, off) {
    const x = p.x + off, y = p.y, cur = 0.5 + 0.5 * Math.max(0, 1 - p.x / (this.W * 0.5));   // filtre çıkışı solda: daha çok sallanır
    ctx.lineCap = 'round';
    if (p.type === 'vallis') {
      const far = p.layer === 'far', front = p.layer === 'front';
      for (let i = 0; i < p.n; i++) {
        const bx = x + (i - p.n / 2) * 5, hh = p.h * (0.62 + 0.38 * hash1(i * 7.3 + p.x)), ph = p.ph + i * 0.7;
        const sway = Math.sin(t * 0.75 + ph) * hh * 0.07 * cur + Math.sin(t * 1.3 + ph * 2) * hh * 0.02 + hh * 0.05 * cur;
        const tx = bx + sway * 1.8, ty = y - hh, cx = bx + sway * 0.5 + Math.sin(i) * 6, cy = y - hh * 0.55;
        const hue = far ? 160 : 118 + (i % 3) * 8, l = far ? 24 : front ? 40 : 34, s = far ? 38 : 52;
        ctx.strokeStyle = hsl(hue, s, l, far ? 0.5 : 0.95); ctx.lineWidth = far ? 4 : front ? 7 : 5.5;
        ctx.beginPath(); ctx.moveTo(bx, y); ctx.quadraticCurveTo(cx, cy, tx, ty); ctx.stroke();
        if (!far) { ctx.strokeStyle = hsl(hue - 5, s + 6, l + 16, 0.55); ctx.lineWidth = 1.6; ctx.beginPath(); ctx.moveTo(bx + 1, y); ctx.quadraticCurveTo(cx + 1, cy, tx, ty + 6); ctx.stroke(); }
      }
    } else if (p.type === 'stem') {
      for (let k = 0; k < p.n; k++) {
        const bx = x + (k - 1) * 12, ph = p.ph + k, sw = Math.sin(t * 0.8 + ph) * 16 * cur, h = p.h * (0.8 + k * 0.1);
        const pts = []; for (let i = 0; i <= 9; i++) { const f = i / 9; pts.push([bx + Math.sin(f * 2.2 + ph) * 8 + sw * f * f, y - h * f, f]); }
        ctx.strokeStyle = 'hsl(110,35%,30%)'; ctx.lineWidth = 2.4; ctx.beginPath(); pts.forEach(([px, py], i) => (i ? ctx.lineTo(px, py) : ctx.moveTo(px, py))); ctx.stroke();
        for (const [px, py, f] of pts.slice(1)) { const L = 20 * (1 - f * 0.45); for (const sgn of [-1, 1]) { ctx.save(); ctx.translate(px, py); ctx.rotate(sgn * (0.9 - f * 0.25) + Math.sin(t + ph + f) * 0.06); ctx.fillStyle = hsl(104 + f * 18, 55, 34 + f * 12, 0.92); ctx.beginPath(); ctx.ellipse(0, -L * 0.5, 2.8, L * 0.5, 0, 0, TAU); ctx.fill(); ctx.restore(); } }
      }
    } else if (p.type === 'anubias') {
      for (let i = 0; i < p.n; i++) {
        const a = -Math.PI / 2 + (i - (p.n - 1) / 2) * 0.42 + Math.sin(t * 0.6 + p.ph + i) * 0.04;
        ctx.save(); ctx.translate(x, y); ctx.rotate(a + Math.PI / 2);
        const L = p.h * (0.7 + 0.3 * hash1(i * 3.1)), g = ctx.createLinearGradient(0, 0, 0, -L);
        g.addColorStop(0, 'hsl(120,45%,18%)'); g.addColorStop(1, 'hsl(110,50%,34%)');
        ctx.strokeStyle = 'hsl(120,40%,20%)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, -L * 0.45); ctx.stroke();
        ctx.fillStyle = g; ctx.beginPath(); ctx.ellipse(0, -L * 0.72, L * 0.2, L * 0.34, 0, 0, TAU); ctx.fill();
        ctx.strokeStyle = 'rgba(180,255,170,.25)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(0, -L * 0.4); ctx.lineTo(0, -L * 1.04); ctx.stroke(); ctx.restore();
      }
    }
  }

  /**
   * v: {cw, ch, dpr, cx, cy, zoom, par, rays}
   * Önce oda rengi, sonra sahne katmanları (paralaks) ve ışık.
   */
  render(ctx, v) {
    const S = (v.cw / this.W) * v.zoom, dpr = v.dpr, t = this.t, W = this.W, H = this.H, reduce = v.reduce;
    ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.fillStyle = '#06141d'; ctx.fillRect(0, 0, v.cw * dpr, v.ch * dpr);
    const tx = v.cw / 2 - v.cx * S, ty = v.ch / 2 - v.cy * S;
    const base = [dpr * S, 0, 0, dpr * S, dpr * tx, dpr * ty];
    ctx.setTransform(base[0], base[1], base[2], base[3], base[4], base[5]);
    const px = v.cx - W / 2 + (v.par || 0);
    ctx.drawImage(this.bg, 0, 0, W, H);
    const L = this.light;
    // uzak bitkiler
    for (const p of this.plants) if (p.layer === 'far') this.drawPlant(ctx, p, t, px * 0.35);
    // ışık hüzmeleri
    const rayA = 0.13 * L + 0.05 * (1 - L);
    if (rayA > 0.01) {
      ctx.save(); ctx.globalCompositeOperation = 'lighter';
      for (let i = 0; i < (v.low ? 3 : 7); i++) {
        const bx = W * (0.08 + i * 0.14) + Math.sin(t * 0.15 + i * 2) * 24 + px * 0.15, wTop = 30 + 20 * ((i * 7) % 3), wBot = wTop * 2.6, br = 0.65 + 0.35 * Math.sin(t * 0.45 + i * 1.7);
        const g = ctx.createLinearGradient(0, 24, 0, H * 0.9);
        const col = L > 0.5 ? '210,255,250' : '150,180,255';
        g.addColorStop(0, `rgba(${col},${rayA * br})`); g.addColorStop(1, `rgba(${col},0)`);
        ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(bx - wTop / 2, 24); ctx.lineTo(bx + wTop / 2, 24); ctx.lineTo(bx + wBot / 2 - 90, H * 0.9); ctx.lineTo(bx - wBot / 2 - 90, H * 0.9); ctx.closePath(); ctx.fill();
      }
      ctx.restore();
    }
    // kostikler (zemine ve taşlara)
    if (L > 0.05 && !reduce && !v.low) {
      ctx.save(); ctx.globalAlpha = 0.2 * L; ctx.globalCompositeOperation = 'lighter';
      ctx.beginPath(); ctx.rect(0, H - 150, W, 150); ctx.clip();        // yalnızca zemin ve taşların üstünde
      const cs = 1.7, ox = t * 7, oy = t * 4; ctx.translate(ox, oy); ctx.scale(cs, cs);
      ctx.fillStyle = ctx.createPattern(this.caus, 'repeat'); ctx.fillRect(-ox / cs, (H - 150 - oy) / cs, W / cs, 150 / cs);
      ctx.restore();
    }
    // orta bitkiler
    for (const p of this.plants) if (p.layer === 'mid') this.drawPlant(ctx, p, t, px * -0.05);
    // balıklar (derinliğe göre)
    const list = this.creatures.slice().sort((a, b) => a.sw.z - b.sw.z);
    const vx0 = (-tx) / S - 160, vx1 = (v.cw - tx) / S + 160, vy0 = (-ty) / S - 160, vy1 = (v.ch - ty) / S + 160;
    for (const c of list) {
      const s = c.sw; if (s.x < vx0 || s.x > vx1 || s.y < vy0 || s.y > vy1) continue;
      FishArt.draw(ctx, c, t, 0.9 + 0.2 * s.z, 0.82 + 0.18 * s.z, base);
      if (c.fav && v.showFav) { ctx.fillStyle = '#ffd36b'; ctx.font = '14px sans-serif'; ctx.fillText('★', s.x - 5, s.y - c.bodyLen() * 0.55); }
    }
    // ön plan bitkileri
    for (const p of this.plants) if (p.layer === 'front') this.drawPlant(ctx, p, t, px * 0.18);
    // yem
    for (const f of this.food) { ctx.fillStyle = `rgba(230,190,110,${clamp(f.life / 6, 0.2, 1)})`; ctx.beginPath(); ctx.ellipse(f.x, f.y, f.r * 1.5, f.r, f.ph, 0, TAU); ctx.fill(); }
    // kabarcıklar
    for (const b of this.bubbles) {
      ctx.strokeStyle = 'rgba(220,255,255,.55)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(b.x, b.y, b.r, 0, TAU); ctx.stroke();
      ctx.fillStyle = 'rgba(255,255,255,.12)'; ctx.fill(); ctx.fillStyle = 'rgba(255,255,255,.7)'; ctx.beginPath(); ctx.arc(b.x - b.r * 0.35, b.y - b.r * 0.35, b.r * 0.22, 0, TAU); ctx.fill();
    }
    // asılı parçacıklar
    ctx.fillStyle = 'rgba(220,255,250,.35)';
    for (const m of (v.low ? [] : this.motes)) { ctx.globalAlpha = (0.25 + 0.5 * L) * m.z * 0.6; ctx.beginPath(); ctx.arc(m.x * W + px * 0.3 * m.z, m.y * H, m.r, 0, TAU); ctx.fill(); }
    ctx.globalAlpha = 1;
    // su yüzeyi
    ctx.save(); ctx.fillStyle = '#081a24'; ctx.beginPath(); ctx.moveTo(-50, -60);
    ctx.lineTo(W + 50, -60); for (let x = W + 50; x >= -50; x -= 12) ctx.lineTo(x, 24 + Math.sin(x * 0.02 + t * 1.1) * 1.8 + Math.sin(x * 0.047 - t * 1.7) * 1.1);
    ctx.closePath(); ctx.fill();
    const sg = ctx.createLinearGradient(0, 22, 0, 70); sg.addColorStop(0, `rgba(210,255,255,${0.35 * L + 0.1})`); sg.addColorStop(1, 'rgba(210,255,255,0)'); ctx.fillStyle = sg; ctx.fillRect(-50, 22, W + 100, 50);
    ctx.strokeStyle = 'rgba(230,255,255,.5)'; ctx.lineWidth = 1.4; ctx.beginPath(); for (let x = -50; x <= W + 50; x += 12) { const y = 24 + Math.sin(x * 0.02 + t * 1.1) * 1.8 + Math.sin(x * 0.047 - t * 1.7) * 1.1; x === -50 ? ctx.moveTo(x, y) : ctx.lineTo(x, y); } ctx.stroke();
    ctx.restore();
    for (const r of this.ripples) { ctx.strokeStyle = `rgba(230,255,255,${clamp(r.life, 0, 1) * 0.5})`; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.ellipse(r.x, r.y, r.r * 1.6, r.r * 0.5, 0, 0, TAU); ctx.stroke(); }
    // gece / gün-doğumu rengi
    const night = 1 - L;
    if (night > 0.01) { ctx.fillStyle = `rgba(8,18,60,${0.58 * night})`; ctx.fillRect(0, 0, W, H); }
    const warm = Math.sin(Math.PI * L); if (warm > 0.02 && L > 0.02 && L < 0.98) { ctx.fillStyle = `rgba(255,140,70,${0.16 * warm})`; ctx.fillRect(0, 0, W, H); }
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
