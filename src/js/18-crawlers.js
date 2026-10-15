'use strict';
/* =====================================================================
   18 · YÜRÜYEN CANLILAR — karides ve salyangoz: davranış (Crawler) + prosedürel çizim
   Karides: zeminde yürür, otlar, bitkiye tırmanır, ara sıra yüzer; tehlikede kuyruk
   darbesiyle fırlar. Salyangoz: çok yavaş kayar, camda tırmanır, siphon uzatır.
   Aynı arayüz (update/startle/x/y/z/eaten…) Swimmer ile uyumludur.
   ===================================================================== */
class Crawler {
  constructor(c) {
    this.c = c; this.kind = c.def.kind; const p = c.pers;
    this.x = c.x ?? 300; this.y = c.y ?? 600; this.heading = 0; this.face = R.chance(0.5) ? 1 : -1; this.flip = 1; this.z = 0.5; this.speed = 0;
    this.state = 'walk'; this.stateT = 0; this.t = R.float(0, 100); this.legPh = R.float(0, TAU); this.tx = this.x; this.ty = this.y; this.eaten = 0; this.mouthT = 0;
    this.mode = 'ground'; this.swimT = 0; this.vx = 0; this.vy = 0; this.climbT = 0; this.joints = []; this.pf = 0; this.molt = 0; this.rot = 0; this.antPh = R.float(0, TAU);
    this.speedMul = lerp(0.8, 1.2, p.activity);
  }
  startle(fx, fy, k = 1) { if (this.kind === 'shrimp') { this.mode = 'swim'; this.swimT = 0.8; this.vx = (Math.sign(this.x - fx) || 1) * 260 * k; this.vy = -90 * k; this.c.stress = Math.min(1, this.c.stress + 0.2); } else { this.state = 'hide'; this.stateT = 0; } }

  update(dt, env) {
    dt = Math.min(dt, 0.05); const c = this.c, L = c.bodyLen(), ground = env.ground ? env.ground(this.x) : env.H - 76; this.t += dt; this.stateT += dt; this.mouthT = Math.max(0, this.mouthT - dt);
    c.stress = Math.max(0, c.stress - dt * 0.05);
    if (env.calm) { this.calm(dt, env); return; }
    const night = env.night > 0.62, shrimp = this.kind === 'shrimp', bottom = ground - (shrimp ? 2 : 3);
    // --- yem arama (zemine inmiş yem) ---
    let food = null, bd = 1e9; if (env.food) for (const f of env.food) { if (f.eaten || f.vy > 0) continue; const d = Math.abs(f.x - this.x) + Math.abs(f.y - this.y) * 0.5; if (d < bd && d < 420) { bd = d; food = f; } }
    if (this.mode === 'swim') { // yüzme / fırlama
      this.swimT -= dt; this.vy += 140 * dt; this.x += this.vx * dt; this.y += this.vy * dt; this.vx *= Math.exp(-dt * 2); this.heading = Math.atan2(this.vy, this.vx * this.face * 0 + this.vx);
      const gy = env.ground ? env.ground(this.x) - 3 : bottom; if (this.swimT <= 0 && this.y >= gy) { this.y = gy; this.mode = 'ground'; this.vx = this.vy = 0; this.state = 'walk'; }
      this.y = Math.min(this.y, gy + 40); this.x = clamp(this.x, 14, env.W - 14); this.legPh += dt * 20; this.facing(); return;
    }
    if (this.mode === 'climb') { // bitki/taş üstüne tırmanma
      this.climbT -= dt; this.y += (this.ty - this.y) * Math.min(1, dt * 0.8); this.x += (this.tx - this.x) * Math.min(1, dt * 1.2); this.legPh += dt * 6;
      if (this.climbT <= 0) { this.mode = 'fall'; this.vy = 0; } this.facing(); return;
    }
    if (this.mode === 'fall') { this.vy += 160 * dt; this.y += this.vy * dt; if (this.y >= bottom) { this.y = bottom; this.mode = 'ground'; this.state = 'walk'; } return; }
    if (this.mode === 'glass') { this.glass(dt, env, ground); return; }
    // --- zeminde ---
    this.y += (bottom - this.y) * Math.min(1, dt * 6);
    let st = this.state;
    if (st === 'hide') { if (this.stateT > 6) st = 'walk'; }
    else if (night && R.next() < dt * 0.2) st = 'rest'; else if (!night && st === 'rest') st = 'walk';
    else if (food) st = 'walk';
    else if (this.stateT > R.float(4, 12) && st === 'walk') st = R.chance(0.65) ? 'graze' : 'walk';
    else if (this.stateT > R.float(3, 8) && st === 'graze') st = 'walk';
    if (st !== this.state) { this.state = st; this.stateT = 0; this.tx = this.x + R.float(-1, 1) * 160; }
    const sp0 = shrimp ? L * 0.9 : L * 0.28; let spd = 0;
    if (st === 'walk') {
      let tx = food ? food.x : this.tx; tx = clamp(tx, 20, env.W - 20); const dx = tx - this.x; if (Math.abs(dx) < 4) { this.tx = this.x + R.float(-1, 1) * 200; if (R.chance(0.2)) this.startClimb(env); } this.face = dx >= 0 ? 1 : -1;
      spd = sp0 * this.speedMul * (food ? 1.5 : 0.55) * lerp(0.55, 1, c.vit ?? 1);
      if (food && Math.abs(food.x - this.x) < L * 0.5 && Math.abs(food.y - this.y) < L) { food.eaten = true; this.eaten++; this.mouthT = 0.3; env.onEat && env.onEat(c, food); }
      if (shrimp && R.next() < dt * 0.01 && !food) { this.mode = 'swim'; this.swimT = 1.4; this.vx = this.face * 90; this.vy = -80; }   // kısa yüzüş
      if (!shrimp && R.next() < dt * 0.015 && !night) this.startGlass(env);
    } else if (st === 'rest' || st === 'hide') spd = 0; else spd = 0;
    this.speed = damp(this.speed, spd, 3, dt); this.x = clamp(this.x + this.face * this.speed * dt, 14, env.W - 14);
    this.legPh += this.speed * dt * 0.22 + (st === 'graze' ? dt * 14 : 0); this.antPh += dt * (st === 'rest' ? 0.4 : 2); this.facing();
  }
  facing() { this.flip = damp(this.flip, this.face, 8, 0.016); if (Math.abs(this.flip) < 0.05) this.flip = this.face * 0.05; }
  startClimb(env) {
    const sc = env.scape; if (!sc || this.kind !== 'shrimp') return; const cand = sc.items.filter((i) => i.k !== 'leaf' && i.k !== 'decor' && !(i.k === 'plant' && PLANTS[i.d].type === 'float')); if (!cand.length) return;
    const it = R.pick(cand), p = Scape.pos(sc, env.W, it), def = Scape.defOf(it), h = (it.k === 'plant' ? def.h * lerp(0.3, 1, it.g ?? 1) : def.h) * (it.s || 1);
    this.mode = 'climb'; this.tx = p.x + R.float(-12, 12); this.ty = p.y - h * R.float(0.35, 0.8); this.climbT = R.float(5, 11);
  }
  startGlass(env) { this.mode = 'glass'; this.gx = this.x < env.W / 2 ? 20 : env.W - 20; this.stateT = 0; this.climbT = R.float(14, 30); this.gDir = -1; }
  glass(dt, env, ground) {
    this.x += (this.gx - this.x) * Math.min(1, dt * 1.5); const top = 90, bot = ground - 4; this.y += this.gDir * L_SNAIL * dt; this.rot = this.gx < env.W / 2 ? -Math.PI / 2 : Math.PI / 2;
    if (this.y < top + (this.c.id % 7) * 20) this.gDir = 1; this.climbT -= dt; if (this.climbT <= 0 && this.y >= bot - 20) { this.mode = 'ground'; this.rot = 0; }
    if (this.y >= bot) { this.y = bot; if (this.climbT <= 0) { this.mode = 'ground'; this.rot = 0; } else this.gDir = -1; } this.legPh += dt * 2;
  }
  calm(dt) { this.legPh += dt * 4; this.antPh += dt * 2; this.face = 1; this.flip = damp(this.flip, 1, 6, dt); this.speed = 0; this.mode = 'ground'; this.rot = 0; }
}
const L_SNAIL = 6;

const CrawlerArt = {
  snailSprite(p) {
    const key = p.shell + p.bodyT; this._ss = this._ss || new Map(); let s = this._ss.get(key); if (s) return s;
    const cv = document.createElement('canvas'); cv.width = cv.height = 128; const c = cv.getContext('2d'), sc = p.shellCol; c.translate(64, 70);
    const pts = []; for (let i = 0; i <= 90; i++) { const a = i * 0.09, r = 5 * Math.exp(0.2 * a); pts.push([Math.cos(a) * r - 6, -Math.sin(a) * r]); }
    const g = c.createRadialGradient(-6, -4, 2, 0, 0, 56); g.addColorStop(0, hsl(sc.h, sc.s, sc.l + 18)); g.addColorStop(1, hsl(sc.h, sc.s, sc.l - 12));
    c.fillStyle = g; c.beginPath(); c.arc(-4, -2, 52, 0, TAU); c.fill(); c.strokeStyle = hsl(sc.h, sc.s, sc.l - 28, 0.85); c.lineWidth = 3;
    c.beginPath(); pts.forEach(([x, y], i) => (i ? c.lineTo(x, y) : c.moveTo(x, y))); c.stroke();
    c.strokeStyle = 'rgba(0,0,0,.18)'; c.lineWidth = 1; for (let k = 1; k < 6; k++) { c.beginPath(); c.arc(-4, -2, 52 - k * 9, 0.4 * k, 5 + 0.4 * k); c.stroke(); }
    c.fillStyle = 'rgba(255,255,255,.28)'; c.beginPath(); c.ellipse(-22, -24, 12, 6, -0.7, 0, TAU); c.fill();
    s = { cv }; this._ss.set(key, s); return s;
  },

  draw(ctx, cr, t, mul, alpha, base) {
    const sw = cr.sw, p = cr.pheno, L = cr.bodyLen() * mul; ctx.setTransform(base[0], base[1], base[2], base[3], base[4], base[5]); ctx.globalAlpha = alpha;
    ctx.translate(sw.x, sw.y); if (sw.rot) ctx.rotate(sw.rot); ctx.scale(sw.flip, 1);
    if (cr.species === 'shrimp') this.shrimp(ctx, cr, sw, p, L, t); else this.snail(ctx, cr, sw, p, L, t);
    ctx.globalAlpha = 1; ctx.setTransform(base[0], base[1], base[2], base[3], base[4], base[5]);
  },

  shrimp(c, cr, sw, p, L, t) {
    const u = L / 10, bc = p.bodyCol, swim = sw.mode === 'swim', walk = sw.speed > 1, N = 7, alpha = p.shrimpCol === 'wild' ? 0.72 : 0.92;
    const col = (dl = 0, a = alpha) => hsl(bc.h, bc.s, clamp(bc.l + dl, 4, 92), a);
    // gövde noktaları: baştan (sağ) kuyruğa (sol); abdomen kavisli
    const pts = []; for (let i = 0; i <= N; i++) { const f = i / N, curl = swim ? Math.sin(t * 22) * 0.3 + 0.7 : 0.55 + (walk ? Math.sin(sw.legPh * 0.5) * 0.04 : 0); pts.push([u * (4.2 - f * 9.2 + Math.sin(f * 3) * 0.5), -u * (1.6 - Math.sin(f * Math.PI * 0.95) * 1.2 * curl) + u * f * f * 1.3]); }
    // antenler
    c.strokeStyle = hsl(bc.h, bc.s * 0.6, bc.l + 20, 0.7); c.lineWidth = Math.max(0.5, u * 0.08);
    for (const s of [-1, 1]) { c.beginPath(); c.moveTo(u * 4.6, -u * 1.7); c.quadraticCurveTo(u * 7.5, -u * (2.6 + s * 0.8 + Math.sin(sw.antPh + s) * 0.5), u * 10.5, -u * (1.6 + s * 1.4 + Math.sin(sw.antPh * 1.3 + s) * 0.6)); c.stroke(); }
    // bacaklar
    c.strokeStyle = hsl(bc.h, bc.s * 0.5, bc.l + 14, 0.75); c.lineWidth = Math.max(0.6, u * 0.1); for (let i = 0; i < 5; i++) { const px = u * (3.2 - i * 1.2), ph = sw.legPh * (swim ? 0.4 : 1) + i * 1.3, sx = Math.sin(ph) * u * 0.5 * (walk ? 1 : 0.15), lift = Math.max(0, Math.cos(ph)) * u * 0.4 * (walk ? 1 : 0); c.beginPath(); c.moveTo(px, -u * 0.5); c.lineTo(px + sx, u * 0.9 - lift); c.stroke(); }
    // ön bacaklar: otlama hareketi
    if (sw.state === 'graze') { c.strokeStyle = hsl(bc.h, bc.s * 0.5, bc.l + 20, 0.85); c.lineWidth = u * 0.12; for (const s of [0, 1]) { c.beginPath(); c.moveTo(u * 4, -u * 0.8); c.lineTo(u * (5.4 + Math.sin(sw.legPh + s * 1.5) * 0.7), u * (0.5 + Math.cos(sw.legPh * 1.2 + s) * 0.3)); c.stroke(); } }
    // karın altı yumurtalar
    if (cr.preg && cr.sex === 'F') { const pr = clamp((cr.now - cr.preg.start) / (cr.preg.due - cr.preg.start), 0, 1); if (pr > 0.02) { c.fillStyle = `rgba(${pr > 0.8 ? '120,200,90' : '235,200,80'},.9)`; for (let i = 0; i < 16; i++) { const q = pts[2 + (i % 4)]; c.beginPath(); c.arc(q[0] + Math.sin(i * 2.1) * u * 0.5, q[1] + u * (0.65 + (i % 3) * 0.22), u * 0.2, 0, TAU); c.fill(); } } }
    // gövde segmentleri (kuyruktan başa)
    for (let i = N - 1; i >= 0; i--) { const a = pts[i], b = pts[i + 1], mx = (a[0] + b[0]) / 2, my = (a[1] + b[1]) / 2, ang = Math.atan2(a[1] - b[1], a[0] - b[0]), rx = u * (i === 0 ? 2.3 : 1.15 + (N - i) * 0.0 + (i < 3 ? 0.3 : 0)) * (1 - i / N * 0.35), ry = u * (1.95 - i * 0.2);
      c.save(); c.translate(mx, my); c.rotate(ang); const g = c.createLinearGradient(0, -ry, 0, ry); g.addColorStop(0, col(10)); g.addColorStop(0.5, col(0)); g.addColorStop(1, col(-10)); c.fillStyle = g; c.beginPath(); c.ellipse(0, 0, rx, Math.max(ry, u * 0.5), 0, 0, TAU); c.fill();
      c.strokeStyle = col(-24, 0.45); c.lineWidth = Math.max(0.4, u * 0.06); c.stroke();
      if (p.rili && i > 0 && i < 5) { c.fillStyle = 'rgba(200,235,240,.5)'; c.beginPath(); c.ellipse(0, 0, rx * 0.8, ry * 0.7, 0, 0, TAU); c.fill(); }
      else if (p.shrimpCol === 'wild') { c.fillStyle = 'rgba(60,40,25,.35)'; c.fillRect(-rx * 0.7, -ry * 0.12, rx * 1.4, ry * 0.3); }
      c.restore(); }
    // kuyruk yelpazesi
    const tl = pts[N], tf = swim ? 0.7 + Math.sin(t * 24) * 0.3 : 1; c.fillStyle = col(-4, 0.8); for (const k of [-0.5, 0, 0.5]) { c.save(); c.translate(tl[0], tl[1]); c.rotate(Math.PI + k * 0.8 * tf + 0.3); c.beginPath(); c.ellipse(u * 0.8, 0, u * 1.1, u * 0.45, 0, 0, TAU); c.fill(); c.restore(); }
    // göz
    c.fillStyle = '#0a0a0e'; c.beginPath(); c.arc(u * 5.3, -u * 1.55, u * 0.32, 0, TAU); c.fill(); c.fillStyle = 'rgba(255,255,255,.8)'; c.beginPath(); c.arc(u * 5.2, -u * 1.65, u * 0.1, 0, TAU); c.fill();
    if (cr.dis) { c.fillStyle = 'rgba(255,255,255,.7)'; for (let i = 0; i < 5; i++) { c.beginPath(); c.arc(u * (2 - i * 1.4), -u * 0.5, u * 0.3, 0, TAU); c.fill(); } }
  },

  snail(c, cr, sw, p, L, t) {
    const s = this.snailSprite(p), u = L / 26, glide = sw.speed > 0.2 || sw.mode === 'glass', bc = p.bodyCol;
    // ayak ve baş
    const g = c.createLinearGradient(0, -8 * u, 0, 6 * u); g.addColorStop(0, hsl(bc.h, bc.s, bc.l + 8)); g.addColorStop(1, hsl(bc.h, bc.s, bc.l - 8)); c.fillStyle = g;
    c.beginPath(); c.moveTo(-22 * u, 3 * u); c.quadraticCurveTo(-8 * u, -10 * u, 12 * u, -10 * u); c.quadraticCurveTo(24 * u, -9 * u + (sw.state === 'hide' ? 6 * u : 0), 27 * u, 2 * u); c.quadraticCurveTo(10 * u, 7 * u, -22 * u, 3 * u); c.fill();
    if (sw.state !== 'hide') for (const k of [0, 1]) { c.strokeStyle = hsl(bc.h, bc.s, bc.l - 6, 0.9); c.lineWidth = Math.max(0.8, u * 1.2); const sway = Math.sin(sw.antPh + k * 1.2) * 2 * u; c.beginPath(); c.moveTo(22 * u, -5 * u + k * u); c.quadraticCurveTo(28 * u, -9 * u, 31 * u + sway, -12 * u + k * 3 * u); c.stroke(); }
    c.fillStyle = '#0c0c10'; c.beginPath(); c.arc(25 * u, -4 * u, u * 1.2, 0, TAU); c.fill();
    // kabuk
    c.save(); c.translate(-6 * u, -12 * u); const sc = u * 0.3; c.scale(sc, sc); c.rotate(-0.1); c.drawImage(s.cv, -64, -80); c.restore();
    // siphon (nefes borusu) – yüzeye doğru uzar
    if (sw.mode === 'ground' && cr.id % 3 === 0 && Math.sin(t * 0.15 + cr.id) > 0.55) { c.strokeStyle = hsl(bc.h, bc.s, bc.l - 10, 0.75); c.lineWidth = u * 1.6; c.beginPath(); c.moveTo(18 * u, -6 * u); c.quadraticCurveTo(24 * u, -60 * u, 18 * u, -120 * u); c.stroke(); }
    if (cr.dis) { c.fillStyle = 'rgba(255,255,255,.7)'; c.beginPath(); c.arc(0, -3 * u, u * 2.5, 0, TAU); c.fill(); }
  },
};
