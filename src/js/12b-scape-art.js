'use strict';
/* =====================================================================
   12b · AQUASCAPE ÇİZİMİ — taş, kök, dekor sprite'ları + bitki çizicileri
   Sert peyzaj parçaları bir kez (tohuma göre) offscreen tuvale çizilir ve
   önbelleğe alınır; bitkiler akıntıya göre her karede canlı çizilir.
   ===================================================================== */
const Art = {
  RES: 2, cache: new Map(),

  /** Sprite: {cv, ax, ay (px, taban-orta), w, h (dünya birimi)} */
  sprite(it) {
    const key = it.k + '|' + it.d + '|' + it.seed; let s = this.cache.get(key); if (s) return s;
    const def = it.k === 'rock' || it.k === 'wood' || it.k === 'leaf' ? HARDSCAPE[it.d] : DECOR[it.d], rng = new RNG(it.seed >>> 0);
    const R_ = this.RES, pad = 12, W = Math.ceil((def.w * 1.4 + pad) * R_), H = Math.ceil((def.h * 1.4 + pad) * R_);
    const cv = document.createElement('canvas'); cv.width = W; cv.height = H; const c = cv.getContext('2d');
    c.scale(R_, R_); c.translate(W / R_ / 2, H / R_ - pad / 2);        // taban-orta orijin
    if (it.k === 'rock') this.rock(c, def, rng); else if (it.k === 'wood') this.wood(c, def, rng); else if (it.k === 'leaf') this.leaf(c, it.d, def, rng); else this.decor(c, def, rng);
    s = { cv, ax: W / 2, ay: H - pad * R_ / 2, w: def.w, h: def.h }; this.cache.set(key, s); return s;
  },

  rock(c, d, rng) {
    const [hh, ss, ll] = d.col, n = { seiryu: 8, dragon: 14, lava: 11, elephant: 13, manten: 7 }[d.tex === 'vein' ? 'seiryu' : d.tex === 'honey' ? 'dragon' : d.tex === 'pore' ? 'lava' : d.tex === 'wrinkle' ? 'elephant' : 'manten'];
    const jit = { vein: 0.28, honey: 0.1, pore: 0.2, wrinkle: 0.09, plain: 0.3 }[d.tex];
    const pts = [];
    for (let i = 0; i < n; i++) { const a = Math.PI + (Math.PI * i) / (n - 1), j = 1 - jit * 0.5 + rng.next() * jit; pts.push([Math.cos(a) * d.w * 0.5 * j, Math.sin(a) * d.h * (0.82 + rng.next() * 0.2) * (d.tex === 'plain' ? 1.05 : 1)]); }
    pts.push([d.w * 0.5 * 0.96, 2], [-d.w * 0.5 * 0.96, 2]);
    const path = () => { c.beginPath(); pts.forEach(([x, y], i) => (i ? c.lineTo(x, y) : c.moveTo(x, y))); c.closePath(); };
    const cx = 0, cy = -d.h * 0.32;
    for (let i = 0; i < pts.length; i++) {            // yüzey (facet) gölgelemesi
      const a = pts[i], b = pts[(i + 1) % pts.length], ang = Math.atan2((a[1] + b[1]) / 2 - cy, (a[0] + b[0]) / 2 - cx), lum = Math.cos(ang - Math.atan2(-0.8, -0.6));
      c.beginPath(); c.moveTo(cx, cy); c.lineTo(a[0], a[1]); c.lineTo(b[0], b[1]); c.closePath();
      c.fillStyle = hsl(hh + lum * 4, ss, ll + lum * 14 + (rng.next() - 0.5) * 6); c.fill();
    }
    c.save(); path(); c.clip();
    if (d.tex === 'vein') { c.strokeStyle = 'rgba(235,245,255,.4)'; c.lineWidth = 1.2; for (let i = 0; i < 6; i++) { const x = rng.float(-d.w * 0.4, d.w * 0.4), y = rng.float(-d.h * 0.9, -4); c.beginPath(); c.moveTo(x, y); c.lineTo(x + rng.float(-30, 30), y + rng.float(-14, 18)); c.stroke(); } }
    else if (d.tex === 'honey') { for (let i = 0; i < 46; i++) { const x = rng.float(-d.w * 0.45, d.w * 0.45), y = rng.float(-d.h * 0.9, -4), r = rng.float(2, 6); c.fillStyle = hsl(hh, ss, ll - 30, 0.65); c.beginPath(); c.ellipse(x, y, r, r * 0.75, 0, 0, TAU); c.fill(); c.strokeStyle = 'rgba(255,255,255,.22)'; c.lineWidth = 0.8; c.stroke(); } }
    else if (d.tex === 'pore') { for (let i = 0; i < 90; i++) { c.fillStyle = `rgba(10,5,5,${rng.float(0.25, 0.6)})`; c.beginPath(); c.arc(rng.float(-d.w * 0.5, d.w * 0.5), rng.float(-d.h, 0), rng.float(0.8, 3), 0, TAU); c.fill(); } }
    else if (d.tex === 'wrinkle') { c.strokeStyle = 'rgba(0,0,0,.22)'; c.lineWidth = 1.2; for (let i = 0; i < 14; i++) { const x = rng.float(-d.w * 0.45, d.w * 0.45), y = rng.float(-d.h * 0.9, -6); c.beginPath(); c.moveTo(x, y); c.quadraticCurveTo(x + rng.float(-14, 14), y - 10, x + rng.float(8, 30), y + rng.float(-6, 6)); c.stroke(); } }
    const g = c.createLinearGradient(0, -d.h, 0, 0); g.addColorStop(0, 'rgba(255,255,255,.18)'); g.addColorStop(0.45, 'rgba(255,255,255,0)'); g.addColorStop(1, 'rgba(0,0,0,.3)'); c.fillStyle = g; c.fillRect(-d.w, -d.h * 1.2, d.w * 2, d.h * 1.4);
    c.restore(); path(); c.strokeStyle = 'rgba(0,0,0,.4)'; c.lineWidth = 1.5; c.stroke();
  },

  wood(c, d, rng) {
    const [hh, ss, ll] = d.col; c.lineCap = 'round'; c.lineJoin = 'round';
    const seg = (x0, y0, x1, y1, w0, w1, dep) => {
      const N = 6; for (let i = 0; i < N; i++) { const t0 = i / N, t1 = (i + 1) / N; c.strokeStyle = hsl(hh, ss, ll + dep * 3 + (i % 2) * 2); c.lineWidth = lerp(w0, w1, (t0 + t1) / 2); c.beginPath(); c.moveTo(lerp(x0, x1, t0), lerp(y0, y1, t0)); c.lineTo(lerp(x0, x1, t1), lerp(y0, y1, t1)); c.stroke(); }
      c.strokeStyle = 'rgba(255,230,200,.18)'; c.lineWidth = Math.max(0.8, w1 * 0.25); c.beginPath(); c.moveTo(x0 - w0 * 0.2, y0); c.lineTo(x1 - w1 * 0.2, y1); c.stroke();
    };
    const branch = (x, y, ang, len, w, dep, maxDep, spread) => {
      const bend = rng.float(-0.35, 0.35), x1 = x + Math.cos(ang) * len, y1 = y + Math.sin(ang) * len, mx = (x + x1) / 2 + Math.sin(ang) * len * bend, my = (y + y1) / 2 - Math.cos(ang) * len * bend;
      seg(x, y, mx, my, w, w * 0.82, dep); seg(mx, my, x1, y1, w * 0.82, w * 0.62, dep);
      if (dep < maxDep) { const k = dep < 1 ? 3 : 2; for (let i = 0; i < k; i++) branch(x1 - (x1 - x) * 0.05 * i, y1 - (y1 - y) * 0.05 * i, ang + rng.float(-spread, spread) + (i - (k - 1) / 2) * 0.35, len * rng.float(0.55, 0.78), w * 0.6, dep + 1, maxDep, spread); }
    };
    if (d.branches === 'log') {
      const pts = []; for (let i = 0; i <= 14; i++) { const t = i / 14; pts.push([lerp(-d.w * 0.42, d.w * 0.4, t), -d.h * 0.55 * Math.sin(t * Math.PI * 0.95) * (0.8 + 0.3 * Math.sin(t * 5))]); }
      for (let i = 0; i < pts.length - 1; i++) seg(pts[i][0], pts[i][1], pts[i + 1][0], pts[i + 1][1], lerp(28, 12, i / pts.length), lerp(28, 12, (i + 1) / pts.length), 0);
      for (let k = 0; k < 3; k++) { const p = pts[3 + k * 3]; branch(p[0], p[1], -Math.PI / 2 + rng.float(-0.8, 0.8), rng.float(25, 50), 7, 2, 3, 0.6); }
      c.fillStyle = 'rgba(20,10,5,.5)'; for (let k = 0; k < 4; k++) { const p = pts[2 + k * 3]; c.beginPath(); c.ellipse(p[0], p[1], 4, 6, rng.float(0, 3), 0, TAU); c.fill(); }
    } else {
      const roots = d.branches === 'many' ? 3 : 2;
      for (let i = 0; i < roots; i++) branch((i - (roots - 1) / 2) * 22, 0, -Math.PI / 2 + (i - (roots - 1) / 2) * 0.55 + rng.float(-0.15, 0.15), d.h * 0.42, d.branches === 'many' ? 12 : 11, 0, d.branches === 'many' ? 4 : 3, d.branches === 'many' ? 0.7 : 0.5);
    }
  },

  leaf(c, id, d, rng) {
    if (id === 'cone') {
      c.fillStyle = hsl(20, 42, 24); c.beginPath(); c.ellipse(0, -13, 9, 13, 0, 0, TAU); c.fill();
      c.strokeStyle = 'rgba(0,0,0,.35)'; c.lineWidth = 1; for (let i = 0; i < 6; i++) { c.beginPath(); c.arc(0, -4 - i * 4, 7 - Math.abs(i - 2) * 0.7, 0.2, Math.PI - 0.2); c.stroke(); }
    } else {
      c.save(); c.rotate(rng.float(-0.12, 0.12)); const g = c.createLinearGradient(-26, 0, 26, 0); g.addColorStop(0, hsl(30, 55, 34)); g.addColorStop(1, hsl(26, 50, 24));
      c.fillStyle = g; c.beginPath(); c.moveTo(-26, -6); c.quadraticCurveTo(-4, -20, 26, -4); c.quadraticCurveTo(0, 2, -26, -6); c.fill();
      c.strokeStyle = 'rgba(0,0,0,.35)'; c.lineWidth = 1; c.beginPath(); c.moveTo(-26, -6); c.quadraticCurveTo(0, -9, 26, -4); c.stroke(); c.restore();
    }
  },

  decor(c, d, rng) {
    const [hh, ss, ll] = d.col, shade = (x0, x1, l) => { const g = c.createLinearGradient(x0, 0, x1, 0); g.addColorStop(0, hsl(hh, ss, ll + 12)); g.addColorStop(0.5, hsl(hh, ss, ll)); g.addColorStop(1, hsl(hh, ss, ll - 14)); return g; };
    if (d.shape === 'cave') {
      c.fillStyle = shade(-d.w / 2, d.w / 2, ll); c.beginPath(); c.moveTo(-d.w * 0.5, 0); c.bezierCurveTo(-d.w * 0.55, -d.h * 1.1, d.w * 0.55, -d.h * 1.1, d.w * 0.5, 0); c.closePath(); c.fill();
      c.fillStyle = 'rgba(5,10,14,.9)'; c.beginPath(); c.moveTo(-d.w * 0.26, 0); c.bezierCurveTo(-d.w * 0.28, -d.h * 0.7, d.w * 0.28, -d.h * 0.7, d.w * 0.26, 0); c.closePath(); c.fill();
      c.strokeStyle = 'rgba(0,0,0,.4)'; c.lineWidth = 1.5; c.stroke();
    } else if (d.shape === 'amphora') {
      c.fillStyle = shade(-30, 30, ll); c.beginPath(); c.moveTo(-10, -d.h); c.bezierCurveTo(-34, -d.h * 0.7, -34, -d.h * 0.2, -14, 0); c.lineTo(14, 0); c.bezierCurveTo(34, -d.h * 0.2, 34, -d.h * 0.7, 10, -d.h); c.closePath(); c.fill();
      c.strokeStyle = hsl(hh, ss, ll - 20); c.lineWidth = 5; c.beginPath(); c.arc(-26, -d.h * 0.7, 10, Math.PI * 0.4, Math.PI * 1.5); c.stroke(); c.beginPath(); c.arc(26, -d.h * 0.7, 10, Math.PI * 1.5, Math.PI * 0.6, true); c.stroke();
      c.fillStyle = hsl(40, 60, 62); c.fillRect(-26, -d.h * 0.55, 52, 6);
    } else if (d.shape === 'column') {
      c.fillStyle = shade(-24, 24, ll); c.fillRect(-24, -d.h, 48, d.h); c.fillRect(-30, -10, 60, 10); c.fillRect(-28, -d.h - 8, 56, 8);
      c.strokeStyle = 'rgba(0,0,0,.18)'; c.lineWidth = 1.5; for (let i = -3; i <= 3; i++) { c.beginPath(); c.moveTo(i * 6, -d.h); c.lineTo(i * 6, -10); c.stroke(); }
      c.fillStyle = 'rgba(40,70,40,.5)'; c.beginPath(); c.ellipse(-8, -d.h * 0.4, 14, 20, 0.4, 0, TAU); c.fill();
    } else if (d.shape === 'chest') {
      c.fillStyle = hsl(hh, ss, ll - 8); c.fillRect(-d.w / 2, -d.h * 0.6, d.w, d.h * 0.6);
      c.beginPath(); c.moveTo(-d.w / 2, -d.h * 0.6); c.quadraticCurveTo(0, -d.h * 1.25, d.w / 2, -d.h * 0.6); c.closePath(); c.fillStyle = hsl(hh, ss, ll); c.fill();
      c.strokeStyle = hsl(44, 70, 55); c.lineWidth = 4; c.strokeRect(-d.w / 2, -d.h * 0.6, d.w, d.h * 0.6); c.fillStyle = hsl(44, 80, 60); c.fillRect(-5, -d.h * 0.52, 10, 14);
      c.fillStyle = hsl(46, 90, 62); for (let i = 0; i < 6; i++) { c.beginPath(); c.arc(rng.float(-26, 26), -d.h * 0.62 - rng.float(0, 8), 3, 0, TAU); c.fill(); }
    } else { // pipe
      c.fillStyle = shade(-d.w / 2, d.w / 2, ll); c.beginPath(); c.moveTo(-d.w / 2, 0); c.lineTo(-d.w / 2, -d.h * 0.8); c.quadraticCurveTo(0, -d.h * 1.1, d.w / 2, -d.h * 0.8); c.lineTo(d.w / 2, 0); c.closePath(); c.fill();
      c.fillStyle = 'rgba(5,10,14,.9)'; c.beginPath(); c.ellipse(d.w / 2 - 6, -d.h * 0.4, 9, d.h * 0.38, 0, 0, TAU); c.fill(); c.strokeStyle = 'rgba(0,0,0,.35)'; c.stroke();
    }
  },

  /* ---------------- Bitki çizimi ---------------- */
  /** env: {flow (0..1.5), ground(worldX)->y, t, light, fry} ; it.g büyüme, it.s ölçek, it.tint kırmızılaşma, it.vert uzama */
  drawPlant(c, it, def, x, y, env) {
    const t = env.t, g = it.g ?? 1, hs = lerp(0.3, 1, clamp(g, 0, 1)) * (it.s || 1) * (it.vert || 1) * (def.type === 'stem' || def.type === 'ribbon' ? (it.ht || 1) : 1), seed = it.seed || 1, fl = 0.35 + 0.65 * env.flow;
    let [ph, ps, pl] = def.col; const tint = it.tint || 0; if (def.red && tint > 0) { ph = hueLerp(ph, def.col[0] < 60 ? 350 : 5, tint * 0.9); ps = lerp(ps, 62, tint); pl = lerp(pl, 40, tint * 0.4); }
    if (it.melt > 0) { ph += 25 * it.melt; ps *= 1 - 0.5 * it.melt; pl += 8 * it.melt; }
    const col = (dl = 0, a = 1) => hsl(ph, ps, pl + dl, a), hz = (n) => hash1(n * 12.9898 + seed * 0.37);
    c.lineCap = 'round'; c.lineJoin = 'round';
    const sway = (k, ph2) => (Math.sin(t * 0.8 + seed + ph2) * 0.07 + Math.sin(t * 1.35 + ph2 * 2) * 0.02) * k * fl;
    if (def.type === 'ribbon') {
      const n = 5 + Math.round(9 * Math.min(1, it.s || 1)), spread = def.w * (it.s || 1) * (it.ht > 1.4 ? 1.2 : 1);
      for (let i = 0; i < n; i++) {
        const bx = x + (i - n / 2) * (spread / n), hh = def.h * hs * (0.62 + 0.38 * hz(i)), sw = sway(hh, i * 0.7) + hh * 0.04 * env.flow;
        const tx = bx + sw * 1.8, ty = y - hh, cx = bx + sw * 0.5 + Math.sin(i) * 6, cy = y - hh * 0.55;
        c.strokeStyle = col(-2 + (i % 3) * 3); c.lineWidth = 3 + 3 * hs; c.beginPath(); c.moveTo(bx, y); c.quadraticCurveTo(cx, cy, tx, ty); c.stroke();
        c.strokeStyle = col(14, 0.5); c.lineWidth = 1.2; c.beginPath(); c.moveTo(bx + 1, y); c.quadraticCurveTo(cx + 1, cy, tx, ty + 6); c.stroke();
      }
    } else if (def.type === 'rosette') {
      const n = 6 + Math.round(5 * Math.min(1.3, it.s || 1));
      for (let i = 0; i < n; i++) {
        const a = -Math.PI / 2 + (i - (n - 1) / 2) * (1.9 / n) + sway(1, i), L = def.h * hs * (0.5 + 0.5 * hz(i + 3)), wd = Math.max(5, def.w * hs * 0.1);
        const tx = x + Math.cos(a) * L, ty = y + Math.sin(a) * L * 0.95, mx = x + Math.cos(a) * L * 0.55 + (i % 2 ? 5 : -5), my = y + Math.sin(a) * L * 0.55;
        const gr = c.createLinearGradient(x, y, tx, ty); gr.addColorStop(0, col(-8)); gr.addColorStop(1, col(8));
        c.fillStyle = gr; c.beginPath(); c.moveTo(x, y); c.quadraticCurveTo(mx - wd, my, tx, ty); c.quadraticCurveTo(mx + wd, my, x, y); c.fill();
        c.strokeStyle = col(18, 0.45); c.lineWidth = 1; c.beginPath(); c.moveTo(x, y); c.quadraticCurveTo(mx, my, tx, ty); c.stroke();
      }
    } else if (def.type === 'stem') {
      const stems = it.stems || 3;
      for (let k = 0; k < stems; k++) {
        const bx = x + (k - (stems - 1) / 2) * 14, h0 = def.h * hs * (0.8 + 0.2 * hz(k)), ph2 = k * 1.3, pts = [];
        for (let i = 0; i <= 10; i++) { const f = i / 10; pts.push([bx + Math.sin(f * 2.2 + ph2) * 7 + sway(h0, ph2) * f * f * 1.6, y - h0 * f, f]); }
        c.strokeStyle = col(-12); c.lineWidth = 2.4; c.beginPath(); pts.forEach(([px, py], i) => (i ? c.lineTo(px, py) : c.moveTo(px, py))); c.stroke();
        for (const [px, py, f] of pts.slice(1)) {
          const L = (def.sub === 'fine' ? 26 : def.sub === 'bushy' ? 20 : def.sub === 'fern' ? 30 : 17) * (1 - f * 0.4) * Math.max(0.6, it.s || 1);
          for (const sg of [-1, 1]) {
            c.save(); c.translate(px, py); c.rotate(sg * (0.95 - f * 0.25) + Math.sin(t + ph2 + f * 3) * 0.05 * fl);
            if (def.sub === 'fine' || def.sub === 'bushy') { c.strokeStyle = col(2 + f * 10, 0.9); c.lineWidth = 1.1; for (let q = -2; q <= 2; q++) { c.beginPath(); c.moveTo(0, 0); c.lineTo(q * 3, -L); c.stroke(); } }
            else if (def.sub === 'fern') { c.strokeStyle = col(4 + f * 8); c.lineWidth = 3; c.beginPath(); c.moveTo(0, 0); c.quadraticCurveTo(L * 0.3, -L * 0.6, L * 0.1, -L); c.stroke(); }
            else { c.fillStyle = col(f * 14, 0.95); c.beginPath(); c.ellipse(0, -L * 0.5, 3.4, L * 0.5, 0, 0, TAU); c.fill(); }
            c.restore();
          }
        }
      }
    } else if (def.type === 'carpet') {
      const half = def.w * (it.s || 1) * (it.sp || 1) * 0.5 * (0.45 + 0.55 * clamp(g, 0, 1)), step = def.sub === 'tiny' ? 2.6 : def.sub === 'grass' ? 3.4 : 4.4;
      for (let dx = -half; dx <= half; dx += step) {
        const wx = x + dx, gy = env.ground ? env.ground(wx) : y, edge = 1 - Math.pow(Math.abs(dx) / half, 3), hh = def.h * 0.42 * hs * (0.65 + 0.35 * hz(dx * 0.7 + 3)) * (0.4 + 0.6 * edge);
        if (def.sub === 'grass') { c.strokeStyle = col(hz(dx) * 8, 0.95); c.lineWidth = 1.6; for (let b = 0; b < 3; b++) { const lean = (b - 1) * 3 + sway(hh, dx * 0.1) * 2; c.beginPath(); c.moveTo(wx + b - 1, gy); c.quadraticCurveTo(wx + lean * 0.4, gy - hh * 0.6, wx + lean, gy - hh); c.stroke(); } }
        else { c.fillStyle = col(hz(dx * 1.7) * 10, 0.95); const r = def.sub === 'tiny' ? 2.1 : def.sub === 'clover' ? 4.4 : 3.8; for (let b = 0; b < 3; b++) { const yy = gy - hh * (0.25 + 0.75 * hz(dx + b * 7)); c.beginPath(); c.ellipse(wx + (b - 0.5) * 3 + sway(hh, dx * 0.1), yy, r, r * 0.85, 0, 0, TAU); c.fill(); } }
      }
    } else if (def.type === 'epi') {
      c.strokeStyle = col(-18); c.lineWidth = 3; c.beginPath(); c.moveTo(x - 8, y + 1); c.lineTo(x + 8, y + 1); c.stroke();
      const n = def.sub === 'fern' ? 7 : def.sub === 'wavy' ? 6 : 5;
      for (let i = 0; i < n; i++) {
        const a = -Math.PI / 2 + (i - (n - 1) / 2) * 0.46 + sway(1, i), L = def.h * hs * (0.62 + 0.38 * hz(i + 9));
        c.save(); c.translate(x, y); c.rotate(a + Math.PI / 2);
        if (def.sub === 'fern') { c.strokeStyle = col(2 + (i % 3) * 3); c.lineWidth = 6 * Math.min(1, hs + 0.2); c.beginPath(); c.moveTo(0, 0); c.quadraticCurveTo(5, -L * 0.5, 0, -L); c.stroke(); c.strokeStyle = col(14, 0.4); c.lineWidth = 1.2; c.beginPath(); c.moveTo(0, 0); c.quadraticCurveTo(5, -L * 0.5, 0, -L); c.stroke(); }
        else { const gr = c.createLinearGradient(0, 0, 0, -L); gr.addColorStop(0, col(-10)); gr.addColorStop(1, col(8)); c.strokeStyle = col(-14); c.lineWidth = 2; c.beginPath(); c.moveTo(0, 0); c.lineTo(0, -L * 0.45); c.stroke(); c.fillStyle = gr; c.beginPath(); c.ellipse(0, -L * 0.72, L * (def.sub === 'wavy' ? 0.16 : 0.22), L * 0.3, 0, 0, TAU); c.fill(); c.strokeStyle = 'rgba(190,255,180,.25)'; c.lineWidth = 1; c.beginPath(); c.moveTo(0, -L * 0.42); c.lineTo(0, -L * 1.0); c.stroke(); }
        c.restore();
      }
    } else if (def.type === 'moss') {
      const rx = def.w * (it.s || 1) * (it.sp || 1) * 0.5 * (0.5 + 0.5 * clamp(g, 0, 1)), ry = def.h * hs * 0.8;
      for (let i = 0; i < 26; i++) { const a = hz(i) * TAU, r = Math.sqrt(hz(i + 40)); c.fillStyle = col(-6 + hz(i + 9) * 14, 0.5); c.beginPath(); c.arc(x + Math.cos(a) * rx * r + sway(6, i), y - 4 - Math.abs(Math.sin(a)) * ry * r, 5 + hz(i + 77) * 6, 0, TAU); c.fill(); }
    } else if (def.type === 'float') {
      const n = 3 + Math.round(5 * clamp(g, 0, 1) * (it.s || 1) * (it.sp || 1)), sy = 27 + Math.sin(t * 1.1 + seed) * 1.2;
      for (let i = 0; i < n; i++) {
        const lx = x + (i - n / 2) * 15 + Math.sin(t * 0.3 + i + seed) * 4, ly = sy + Math.sin(t * 1.3 + i) * 0.8, r = 8 + 5 * hz(i);
        c.strokeStyle = 'rgba(210,190,150,.5)'; c.lineWidth = 1; for (let q = 0; q < 2; q++) { c.beginPath(); c.moveTo(lx + q * 3, ly + 2); c.quadraticCurveTo(lx + q * 6 + sway(20, i), ly + 22, lx + q * 4 + sway(34, i + q), ly + 28 + 22 * hs); c.stroke(); }
        c.fillStyle = col(hz(i + 3) * 8); c.beginPath(); c.ellipse(lx, ly, r, r * 0.55, 0, 0, TAU); c.fill(); c.strokeStyle = col(18, 0.5); c.lineWidth = 1; c.stroke();
      }
    }
  },
};
