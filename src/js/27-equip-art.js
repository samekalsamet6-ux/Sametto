'use strict';
/* =====================================================================
   27 · EKİPMAN ÇİZİMİ — sünger/iç/dış filtre, ısıtıcı, CO₂ difüzör, hava taşı,
        LED armatür ve tank dışı parçalar (hortumlar, CO₂ tüpü, hava pompası).
   Ölçek: 20 dünya birimi = 1 cm. Tümü gradyanlarla "gerçek ürün" görünümünde çizilir.
   ===================================================================== */
const EquipArt = {
  /** Yarı saydam cam/akrilik boru: dış gövde + iç parlama + ince yansıma. */
  tube(c, pts, w, tint = '190,230,240', a = 0.4) {
    const path = () => { c.beginPath(); c.moveTo(pts[0][0], pts[0][1]); for (let i = 1; i < pts.length; i++) { const p = pts[i]; if (p.length === 4) c.quadraticCurveTo(p[0], p[1], p[2], p[3]); else c.lineTo(p[0], p[1]); } };
    c.lineCap = 'round'; c.lineJoin = 'round';
    c.strokeStyle = `rgba(${tint},${a * 0.7})`; c.lineWidth = w + 3; path(); c.stroke();
    c.strokeStyle = `rgba(${tint},${a})`; c.lineWidth = w; path(); c.stroke();
    c.strokeStyle = `rgba(255,255,255,${a * 0.9})`; c.lineWidth = Math.max(1, w * 0.18); c.save(); c.translate(-w * 0.22, -w * 0.12); path(); c.stroke(); c.restore();
  },
  metal(c, x, y, w, h, base = '#8f9aa0') {
    const g = c.createLinearGradient(x, 0, x + w, 0); g.addColorStop(0, '#4b565c'); g.addColorStop(0.25, '#d6dde0'); g.addColorStop(0.5, base); g.addColorStop(1, '#3d474c'); c.fillStyle = g; c.fillRect(x, y, w, h);
  },
  suction(c, x, y, r = 7) { const g = c.createRadialGradient(x - r * 0.3, y - r * 0.3, 1, x, y, r); g.addColorStop(0, 'rgba(200,215,220,.85)'); g.addColorStop(1, 'rgba(90,110,118,.7)'); c.fillStyle = g; c.beginPath(); c.arc(x, y, r, 0, TAU); c.fill(); },

  sponge(c, x, y, t) { // y: zemin
    const w = 104, h = 168, top = y - h;
    c.fillStyle = '#16191b'; c.beginPath(); c.roundRect(x - w / 2 - 6, y - 20, w + 12, 24, 7); c.fill();                              // taban
    c.fillStyle = '#2a3034'; for (let i = 0; i < 6; i++) c.fillRect(x - w / 2 + 6 + i * 16, y - 14, 9, 10);                                // süzgeç aralıkları
    const g = c.createLinearGradient(x - w / 2, 0, x + w / 2, 0); g.addColorStop(0, '#5d6b36'); g.addColorStop(0.35, '#9aab5c'); g.addColorStop(0.7, '#7f8f46'); g.addColorStop(1, '#4b5829');
    c.fillStyle = g; c.beginPath(); c.roundRect(x - w / 2, top, w, h - 18, 14); c.fill();
    const r = new RNG(7); for (let i = 0; i < 110; i++) { const px = x - w / 2 + 6 + r.next() * (w - 12), py = top + 8 + r.next() * (h - 40), pr = 1.4 + r.next() * 3.4; c.fillStyle = r.next() < 0.6 ? 'rgba(40,50,18,.42)' : 'rgba(210,225,150,.28)'; c.beginPath(); c.ellipse(px, py, pr, pr * 0.8, 0, 0, TAU); c.fill(); }
    c.fillStyle = '#16191b'; c.beginPath(); c.roundRect(x - 26, top - 12, 52, 20, 6); c.fill();                                          // üst başlık
    this.tube(c, [[x, top - 8], [x, 30]], 11, '215,235,240', 0.5);                                                                          // hava borusu
  },
  internal(c, x, y, t) {
    const bw = 62, bh = 188, top = y - bh;
    const g = c.createLinearGradient(x - bw / 2, 0, x + bw / 2, 0); g.addColorStop(0, '#0d1316'); g.addColorStop(0.3, '#2b363c'); g.addColorStop(0.6, '#1a2328'); g.addColorStop(1, '#0a0f12');
    c.fillStyle = g; c.beginPath(); c.roundRect(x - bw / 2, top, bw, bh, 9); c.fill(); c.strokeStyle = 'rgba(255,255,255,.1)'; c.lineWidth = 1.5; c.stroke();
    c.fillStyle = '#7e8a52'; c.fillRect(x - bw / 2 + 8, top + 52, bw - 16, bh - 66);                                                      // içerideki sünger
    c.strokeStyle = '#10171a'; c.lineWidth = 6; for (let i = 0; i < 10; i++) { const yy = top + 58 + i * 13; c.beginPath(); c.moveTo(x - bw / 2 + 5, yy); c.lineTo(x + bw / 2 - 5, yy); c.stroke(); } // emme ızgarası
    const mg = c.createLinearGradient(0, top - 36, 0, top + 4); mg.addColorStop(0, '#34424a'); mg.addColorStop(1, '#161e22'); c.fillStyle = mg; c.beginPath(); c.roundRect(x - bw / 2 - 4, top - 34, bw + 8, 42, 10); c.fill(); // motor başı
    c.fillStyle = '#10171a'; c.beginPath(); c.roundRect(x + bw / 2 - 2, top - 24, 62, 20, 6); c.fill();                                   // çıkış nozulu
    c.strokeStyle = 'rgba(210,235,245,.25)'; c.lineWidth = 2; c.setLineDash([10, 12]); c.lineDashOffset = -t * 30; for (let i = 0; i < 3; i++) { c.beginPath(); c.moveTo(x + bw / 2 + 62, top - 14 + (i - 1) * 8); c.quadraticCurveTo(x + bw / 2 + 130, top - 14 + (i - 1) * 14, x + bw / 2 + 190, top - 4 + (i - 1) * 26); c.stroke(); } c.setLineDash([]); // akıntı çizgileri
    this.suction(c, x - bw / 2 + 4, top + 30, 6); this.suction(c, x - bw / 2 + 4, top + 140, 6); c.fillStyle = 'rgba(80,255,140,.9)'; c.beginPath(); c.arc(x + 4, top - 14, 3, 0, TAU); c.fill(); // vantuz + LED
  },
  external(c, W, y0, gyAt, t) {
    // emme borusu (cam) süzgeçli uç
    const xi = W - 34, yb = gyAt(xi) - 34; this.tube(c, [[xi, 0], [xi, yb]], 26, '200,236,244', 0.42);
    c.fillStyle = 'rgba(190,230,240,.5)'; c.beginPath(); c.roundRect(xi - 20, yb - 6, 40, 54, 8); c.fill(); c.strokeStyle = 'rgba(0,0,0,.35)'; c.lineWidth = 2; for (let i = 0; i < 6; i++) { c.beginPath(); c.moveTo(xi - 16, yb + 2 + i * 8); c.lineTo(xi + 16, yb + 2 + i * 8); c.stroke(); }
    // lily pipe çıkış borusu: yukarıdan kıvrılıp genişleyerek biter
    const xo = W - 110; this.tube(c, [[xo, 0], [xo, 44], [xo, 90, xo - 40, 96]], 22, '200,236,244', 0.42);
    c.fillStyle = 'rgba(205,240,248,.5)'; c.beginPath(); c.ellipse(xo - 44, 96, 11, 26, 0.2, 0, TAU); c.fill(); c.strokeStyle = 'rgba(255,255,255,.55)'; c.lineWidth = 1.6; c.stroke();
    c.strokeStyle = 'rgba(220,245,255,.22)'; c.lineWidth = 2; c.setLineDash([8, 12]); c.lineDashOffset = -t * 34; for (let i = 0; i < 4; i++) { c.beginPath(); c.moveTo(xo - 56, 80 + i * 12); c.quadraticCurveTo(xo - 160, 80 + i * 18, xo - 260, 70 + i * 34); c.stroke(); } c.setLineDash([]);
  },
  heater(c, W, gyAt, t) {
    const x1 = W - 52, y1 = 40, x2 = W - 26, y2 = gyAt(W - 26) - 90, ang = Math.atan2(y2 - y1, x2 - x1);
    c.save(); c.translate(x1, y1); c.rotate(ang - Math.PI / 2 + Math.PI); // üst başlıktan aşağı doğru
    const L = Math.hypot(x2 - x1, y2 - y1); c.rotate(Math.PI);
    c.fillStyle = 'rgba(190,225,235,.22)'; c.strokeStyle = 'rgba(210,240,248,.5)'; c.lineWidth = 2; c.beginPath(); c.roundRect(-18, 0, 36, L, 16); c.fill(); c.stroke();                          // cam tüp
    const glow = 0.45 + 0.25 * Math.sin(t * 2.2); const hg = c.createLinearGradient(0, 0, 0, L); hg.addColorStop(0, 'rgba(255,90,40,0)'); hg.addColorStop(0.3, `rgba(255,110,50,${glow})`); hg.addColorStop(1, `rgba(255,170,70,${glow + 0.1})`);
    c.strokeStyle = hg; c.lineWidth = 5; c.beginPath(); for (let i = 0; i <= 28; i++) { const yy = 60 + (i / 28) * (L - 80); c.lineTo(Math.sin(i * 1.4) * 8, yy); } c.stroke();                                 // ısıtıcı bobin
    c.fillStyle = 'rgba(255,255,255,.35)'; c.fillRect(-12, 20, 3, L - 40);                                                                                                                      // yansıma
    const cap = c.createLinearGradient(-20, 0, 20, 0); cap.addColorStop(0, '#12181b'); cap.addColorStop(0.5, '#3a464c'); cap.addColorStop(1, '#0d1214'); c.fillStyle = cap; c.beginPath(); c.roundRect(-21, -42, 42, 54, 8); c.fill(); // termostat başlığı
    c.fillStyle = '#c33'; c.beginPath(); c.arc(0, -26, 4.5, 0, TAU); c.fill(); c.fillStyle = `rgba(255,60,50,${0.5 + 0.5 * Math.sin(t * 2.2)})`; c.beginPath(); c.arc(0, -26, 8, 0, TAU); c.fill(); c.restore();
    this.suction(c, (x1 + x2) / 2 + 20, (y1 + y2) / 2, 7);
  },
  diffuser(c, x, y, tank, t) {
    const x0 = x - 70; this.tube(c, [[x, y - 24], [x - 36, 140, x - 70, 30], [x - 72, 0]], 6, '230,240,245', 0.6);
    c.save(); c.translate(x, y - 22);
    const g = c.createRadialGradient(-10, -6, 3, 0, 0, 38); g.addColorStop(0, 'rgba(240,250,255,.85)'); g.addColorStop(0.6, 'rgba(170,205,220,.55)'); g.addColorStop(1, 'rgba(110,150,170,.5)');
    c.fillStyle = g; c.beginPath(); c.ellipse(0, 0, 36, 13, 0, 0, TAU); c.fill(); c.strokeStyle = 'rgba(255,255,255,.7)'; c.lineWidth = 1.6; c.stroke();
    c.strokeStyle = 'rgba(120,150,165,.6)'; c.lineWidth = 1; for (const k of [0.35, 0.65]) { c.beginPath(); c.ellipse(0, 0, 36 * k, 13 * k, 0, 0, TAU); c.stroke(); } c.fillStyle = '#2a3236'; c.beginPath(); c.arc(0, -2, 4, 0, TAU); c.fill();
    c.restore();
  },
  airstone(c, x, y, t) {
    this.tube(c, [[x, y - 8], [x, 0]], 6, '235,240,245', 0.55);
    const g = c.createLinearGradient(0, y - 18, 0, y); g.addColorStop(0, '#9aa3a8'); g.addColorStop(1, '#4a5358'); c.fillStyle = g; c.beginPath(); c.roundRect(x - 22, y - 16, 44, 16, 8); c.fill(); c.fillStyle = 'rgba(255,255,255,.35)'; c.fillRect(x - 15, y - 13, 24, 3);
    c.fillStyle = 'rgba(0,0,0,.25)'; const r = new RNG(5); for (let i = 0; i < 9; i++) { c.beginPath(); c.arc(x - 18 + r.next() * 36, y - 12 + r.next() * 10, 1.2, 0, TAU); c.fill(); }
  },

  /** Tank içi ekipman (kırpılmış cam içinde çizilir). */
  drawInside(c, e, W, H, gyAt, t) {
    c.save(); c.lineCap = 'round';
    if (e.filter === 'sponge') this.sponge(c, W * 0.07, gyAt(W * 0.07), t);
    else if (e.filter === 'internal') this.internal(c, W * 0.045, gyAt(W * 0.045), t);
    else if (e.filter === 'external') this.external(c, W, 0, gyAt, t);
    if (e.heater) this.heater(c, W, gyAt, t);
    if (e.co2 === 'tank') this.diffuser(c, W * 0.2, gyAt(W * 0.2), true, t);
    if (e.air) this.airstone(c, W * 0.115, gyAt(W * 0.115), t);
    c.restore();
  },

  /** Cam dışı: armatür, hortumlar, CO₂ tüpü, hava pompası. */
  drawOutside(c, tank, v, t) {
    const e = tank.scape.equip, W = tank.W, H = tank.H, on = tank.light > 0.2, pw = tank.lightPower;
    // — LED armatür: iki çelik askı + alüminyum gövde + LED sırası + ışık hüzmesi
    { const lx0 = W * 0.12, lx1 = W * 0.88, ly = -64, lw = lx1 - lx0;
      c.strokeStyle = 'rgba(190,200,205,.55)'; c.lineWidth = 3; for (const hx of [lx0 + lw * 0.12, lx1 - lw * 0.12]) { c.beginPath(); c.moveTo(hx, ly); c.lineTo(hx, ly - 900); c.stroke(); }
      const g = c.createLinearGradient(0, ly, 0, ly + 50); g.addColorStop(0, '#4d5a61'); g.addColorStop(0.3, '#cfd8dc'); g.addColorStop(0.55, '#7f8d94'); g.addColorStop(1, '#232d32');
      c.fillStyle = g; c.beginPath(); c.roundRect(lx0, ly, lw, 50, 14); c.fill(); c.fillStyle = '#10171a'; c.beginPath(); c.roundRect(lx0 + 14, ly + 34, lw - 28, 12, 6); c.fill();
      const n = Math.max(8, Math.floor(lw / 46)); for (let i = 0; i < n; i++) { const lx = lx0 + 26 + (i + 0.5) * (lw - 52) / n; c.fillStyle = on ? `rgba(255,248,225,${0.55 + 0.4 * pw})` : 'rgba(95,105,110,.8)'; c.fillRect(lx - 7, ly + 36, 14, 8); }
      c.fillStyle = '#10171a'; c.beginPath(); c.roundRect(lx1 - 70, ly + 8, 46, 20, 6); c.fill(); c.fillStyle = on ? '#6ef2a0' : '#3a4a44'; c.beginPath(); c.arc(lx1 - 56, ly + 18, 4, 0, TAU); c.fill(); c.fillStyle = '#ffb04a'; c.beginPath(); c.arc(lx1 - 42, ly + 18, 4, 0, TAU); c.fill();
      if (on && !v.dry) { const bg = c.createLinearGradient(0, ly + 50, 0, 70); bg.addColorStop(0, `rgba(255,245,220,${0.22 * pw})`); bg.addColorStop(1, 'rgba(255,245,220,0)'); c.fillStyle = bg; c.beginPath(); c.moveTo(lx0 + 20, ly + 46); c.lineTo(lx1 - 20, ly + 46); c.lineTo(lx1, 70); c.lineTo(lx0, 70); c.fill(); }
    }
    const base = H;                                                                                  // sehpa üstü
    // — dış filtre: tank arkasından sehpaya inen iki hortum + sehpa üstünde kutu görünümü
    if (e.filter === 'external') {
      const hx1 = W + 34, hx2 = W + 66, hose = (x) => { c.strokeStyle = '#1b2327'; c.lineWidth = 14; c.beginPath(); c.moveTo(W - (x === hx1 ? 34 : 110), -6); c.lineTo(W - (x === hx1 ? 34 : 110), -26); c.quadraticCurveTo(x + 8, -34, x, 10); c.lineTo(x, base + 60); c.stroke(); c.strokeStyle = 'rgba(255,255,255,.14)'; c.lineWidth = 3; c.setLineDash([6, 8]); c.stroke(); c.setLineDash([]); };
      hose(hx1); hose(hx2); c.fillStyle = '#10171a'; c.beginPath(); c.arc(hx1, base + 64, 8, 0, TAU); c.arc(hx2, base + 64, 8, 0, TAU); c.fill();
    }
    // — CO₂ tüpü + regülatör + kabarcık sayacı (tank solunda, sehpa üstünde)
    if (e.co2 === 'tank') {
      const cx = -112, cy = base;
      const tg = c.createLinearGradient(cx - 34, 0, cx + 34, 0); tg.addColorStop(0, '#6a1717'); tg.addColorStop(0.35, '#d34040'); tg.addColorStop(1, '#4d1010'); c.fillStyle = tg; c.beginPath(); c.roundRect(cx - 34, cy - 330, 68, 330, [30, 30, 6, 6]); c.fill();
      c.fillStyle = '#c9d0d3'; c.fillRect(cx - 14, cy - 352, 28, 24);
      const rg = c.createLinearGradient(cx - 30, 0, cx + 30, 0); rg.addColorStop(0, '#8a6a1c'); rg.addColorStop(0.5, '#e7c34f'); rg.addColorStop(1, '#6c5314'); c.fillStyle = rg; c.beginPath(); c.roundRect(cx - 28, cy - 400, 56, 52, 8); c.fill();
      c.fillStyle = '#10171a'; c.beginPath(); c.arc(cx - 40, cy - 372, 16, 0, TAU); c.fill(); c.fillStyle = '#f1f5f6'; c.beginPath(); c.arc(cx - 40, cy - 372, 13, 0, TAU); c.fill(); c.strokeStyle = '#c33'; c.lineWidth = 2; c.beginPath(); c.moveTo(cx - 40, cy - 372); c.lineTo(cx - 36, cy - 382); c.stroke();
      c.strokeStyle = 'rgba(235,240,245,.65)'; c.lineWidth = 5; c.beginPath(); c.moveTo(cx + 28, cy - 378); c.lineTo(cx + 62, cy - 378); c.quadraticCurveTo(cx + 90, cy - 378, cx + 92, cy - 440); c.lineTo(cx + 92, -10); c.lineTo(W * 0.2 - 72, -10); c.stroke();      // CO₂ hortumu
      c.fillStyle = 'rgba(200,235,245,.5)'; c.beginPath(); c.roundRect(cx + 82, cy - 330, 20, 46, 6); c.fill(); c.fillStyle = 'rgba(255,255,255,.8)'; for (let i = 0; i < 3; i++) { const by = cy - 296 - ((t * 24 + i * 13) % 34); c.beginPath(); c.arc(cx + 92, by, 2.4, 0, TAU); c.fill(); }   // sayaç
    }
    // — hava pompası (tankın sağında, sehpa üstünde)
    if (e.air) {
      const ax = W + 120, ay = base;
      const g = c.createLinearGradient(0, ay - 70, 0, ay); g.addColorStop(0, '#2c383e'); g.addColorStop(1, '#10171a'); c.fillStyle = g; c.beginPath(); c.roundRect(ax - 52, ay - 70, 104, 70, 12); c.fill(); c.fillStyle = 'rgba(255,255,255,.15)'; c.fillRect(ax - 44, ay - 62, 88, 3);
      c.fillStyle = '#10171a'; for (let i = 0; i < 5; i++) c.fillRect(ax - 36 + i * 16, ay - 38, 8, 22); c.fillStyle = '#6ef2a0'; c.beginPath(); c.arc(ax + 36, ay - 54, 3.2, 0, TAU); c.fill();
      c.strokeStyle = 'rgba(235,240,245,.6)'; c.lineWidth = 4; c.beginPath(); c.moveTo(ax - 20, ay - 70); c.lineTo(ax - 20, -22); c.lineTo(W * 0.115, -22); c.lineTo(W * 0.115, -4); c.stroke();
    }
  },
};

/* Tank'a bağla: eski drawEquip yerine yenisi; armatür ve dış parçalar render sonrasında çizilir. */
Tank.prototype.drawEquip = function (ctx, t) { EquipArt.drawInside(ctx, this.scape.equip, this.W, this.H, (x) => this.ground(x), t); };
Tank.prototype.drawEquipOutside = function (ctx, v) { EquipArt.drawOutside(ctx, this, v, this.t); };
