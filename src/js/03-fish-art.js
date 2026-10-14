'use strict';
/* =====================================================================
   03 · BALIK ÇİZİCİ — genlerden prosedürel doku + omurga tabanlı deformasyon
   ---------------------------------------------------------------------
   1) build(): fenotipten, düz poz (burun solda, kuyruk sağda) bir doku üretir
      (vücut, pul, desen, yüzgeçler, kuyruk, göz). Yalnızca gen / olgunluk
      değişince yeniden çizilir (offscreen önbellek).
   2) draw(): dokuyu dilimler halinde, yüzme dalgasıyla bükülen omurga
      çizgisine (midline) yerleştirir. Gövde ve kuyruk aynı dalgayla hareket
      eder; kuyruk uçları sönümlü yaylarla gecikmeli takip eder.
   ===================================================================== */
const FishArt = {
  TW: 440, TH: 210, J: 11, SUB: 3,
  SC: 0.28, // vücut ağırlık merkezinin doku boyunca konumu (0..1)

  /* ---------- renk hesapları ---------- */
  bodyColor(p, mat) {
    const b = BODY[p.body]; let h = b.h, s = b.s, l = b.l;
    if (p.purple) { h = hueLerp(h, 285, 0.55); s = Math.max(s, 40) + 12; l *= 0.86; }
    if (p.moscow) { const tc = TAILCOL[p.tailColor]; h = hueLerp(h, p.tailColor === 'none' ? 225 : tc.h, 0.55); s = clamp(s + 8, 0, 70); l *= 0.36; }
    if (p.sex === 'M') s *= lerp(0.4, 1, mat) * clamp(p.intensity, 0.65, 1.2);
    else { s *= 0.62; l = Math.min(90, l + 6); }
    return { h, s, l };
  },

  /* ---------- desen yardımcıları ---------- */
  rings(ctx, x0, y0, x1, y1, r, rng, col, lw) {
    ctx.strokeStyle = col; ctx.lineWidth = lw;
    for (let y = y0, row = 0; y < y1; y += r * 1.55, row++) for (let x = x0 + (row % 2 ? r : 0); x < x1; x += r * 2) { ctx.beginPath(); ctx.arc(x + rng.float(-1, 1), y + rng.float(-1, 1), r * 0.88, 0, TAU); ctx.stroke(); }
  },
  dots(ctx, n, x0, y0, x1, y1, rmin, rmax, col, rng) {
    ctx.fillStyle = col;
    for (let i = 0; i < n; i++) { ctx.beginPath(); ctx.arc(rng.float(x0, x1), rng.float(y0, y1), rng.float(rmin, rmax), 0, TAU); ctx.fill(); }
  },
  blotches(ctx, n, x0, y0, x1, y1, rmin, rmax, cols, rng) {
    for (let i = 0; i < n; i++) {
      ctx.fillStyle = rng.pick(cols); const cx = rng.float(x0, x1), cy = rng.float(y0, y1), r = rng.float(rmin, rmax);
      ctx.beginPath(); for (let k = 0; k <= 10; k++) { const a = (k / 10) * TAU, rr = r * (0.65 + 0.5 * rng.next()); const px = cx + Math.cos(a) * rr * 1.4, py = cy + Math.sin(a) * rr; k ? ctx.lineTo(px, py) : ctx.moveTo(px, py); }
      ctx.closePath(); ctx.fill();
    }
  },
  smoothPoly(ctx, pts) {
    const n = pts.length; ctx.beginPath(); ctx.moveTo((pts[0][0] + pts[n - 1][0]) / 2, (pts[0][1] + pts[n - 1][1]) / 2);
    for (let i = 0; i < n; i++) { const a = pts[i], b = pts[(i + 1) % n]; ctx.quadraticCurveTo(a[0], a[1], (a[0] + b[0]) / 2, (a[1] + b[1]) / 2); }
    ctx.closePath();
  },

  /* ---------- kuyruk geometrisi: kök (0,0) → uç (+x) ---------- */
  tailPoly(type, L, Hh) {
    const prof = (f, Lm, hh = Hh, N = 22) => {
      const top = [], bot = [];
      for (let i = 0; i <= N; i++) { const u = i / N, v = f(u) * hh; top.push([Lm * u, -v]); bot.push([Lm * u, v]); }
      return top.concat(bot.reverse());
    };
    const fanF = (e) => (u) => (u <= e ? 0.10 + 0.90 * Math.pow(Math.sin((u / e) * Math.PI / 2), 0.9) : Math.sqrt(Math.max(0, 1 - Math.pow((u - e) / (1 - e), 2))));
    const out = { poly: null, extra: null, edge: 'smooth' };
    switch (type) {
      case 'delta': out.poly = prof((u) => 0.10 + 0.90 * u, L, Hh, 12); out.edge = 'sharp'; break;
      case 'fan': out.poly = prof(fanF(0.86), L); break;
      case 'veil': out.poly = prof((u) => fanF(0.9)(u) + 0.03 * Math.sin(u * 38) * smoothstep(0.55, 1, u), L, Hh * 1.02, 34); break;
      case 'lace': out.poly = prof((u) => fanF(0.92)(u) + 0.045 * Math.sin(u * 52) * smoothstep(0.5, 1, u), L, Hh * 1.05, 40); break;
      case 'round': out.poly = prof((u) => 0.12 + 0.88 * Math.sqrt(Math.max(0, 1 - Math.pow((u - 0.55) / 0.55, 2))), L, Hh * 0.95); break;
      case 'spade': out.poly = prof((u) => (u < 0.6 ? 0.10 + 0.90 * Math.sin((u / 0.6) * Math.PI / 2) : Math.max(0.03, Math.pow(1 - (u - 0.6) / 0.4, 1.15))), L, Hh * 0.9); break;
      case 'lyre': {
        const P = [[0, -0.1], [0.35, -0.38], [0.7, -0.78], [0.98, -1], [0.93, -0.72], [0.86, -0.4], [0.78, -0.12], [0.76, 0], [0.78, 0.12], [0.86, 0.4], [0.93, 0.72], [0.98, 1], [0.7, 0.78], [0.35, 0.38], [0, 0.1]];
        out.poly = P.map(([u, v]) => [u * L, v * Hh]); break;
      }
      case 'plakat': out.poly = prof((u) => 0.14 + 0.86 * Math.sqrt(Math.max(0, 1 - Math.pow((u - 0.55) / 0.5, 2))), L * 0.8, Hh * 0.62); break;
      case 'double': {
        const P = [[0, -0.1], [0.4, -0.5], [0.8, -0.95], [1, -0.9], [0.95, -0.45], [0.82, -0.05], [0.95, 0.05], [0.95, 0.45], [1, 0.9], [0.8, 0.95], [0.4, 0.5], [0, 0.1]];
        out.poly = P.map(([u, v]) => [u * L, v * Hh]); break;
      }
      case 'halfmoon': {
        const R = Math.min(L, Hh * 1.05), pts = [[0, -R * 0.12]];
        for (let i = 0; i <= 20; i++) { const a = -Math.PI / 2 + (i / 20) * Math.PI; pts.push([R * Math.cos(a) * (L / R > 1 ? 1 : 1), R * Math.sin(a)]); }
        pts.push([0, R * 0.12]); out.poly = pts; out.edge = 'sharp'; break;
      }
      case 'crown': {
        const pts = [[0, -Hh * 0.1]]; const n = 11;
        for (let i = 0; i <= 3; i++) pts.push([L * 0.9 * (i / 3), -Hh * (0.1 + 0.9 * (i / 3))]);
        for (let k = 0; k <= n; k++) { const v = -1 + (2 * k) / n; pts.push([L * (k % 2 ? 0.86 : 1.0), v * Hh]); }
        for (let i = 3; i >= 0; i--) pts.push([L * 0.9 * (i / 3), Hh * (0.1 + 0.9 * (i / 3))]);
        out.poly = pts; out.edge = 'sharp'; break;
      }
      case 'topsword': case 'bottomsword': case 'doublesword': {
        const Lm = L * 0.78;
        out.poly = prof((u) => 0.10 + 0.78 * Math.sin((u * Math.PI) / 1.45), Lm, Hh * 0.62, 18);
        out.swords = [];
        const sw = (sign) => { const y0 = sign * Hh * 0.62 * 0.6; return [[Lm * 0.45, y0 - sign * 3], [L, sign * Hh * 0.34], [L, sign * Hh * 0.34 + sign * 1.2], [Lm * 0.45, y0 + sign * 4]]; };
        if (type !== 'bottomsword') out.swords.push(sw(-1));
        if (type !== 'topsword') out.swords.push(sw(1));
        break;
      }
      default: out.poly = prof((u) => 0.1 + 0.9 * u, L);
    }
    return out;
  },

  /* ---------- doku üretimi ---------- */
  build(p, mat, seed) {
    const TW = this.TW, TH = this.TH, MID = TH / 2, rng = new RNG(seed || 1);
    const male = p.sex === 'M';
    const tt = TAILS[p.tail];
    const tailFrac = (1 - tt.bf) * clamp(0.78 + 0.22 * p.tailLen, 0.7, 1.15) * (male ? lerp(0.78, 1, mat) : 0.72);
    const bf = 1 - tailFrac;
    const x0 = 8, bodyLen = bf * TW - x0, xb = x0 + bodyLen;
    const H = bodyLen * (male ? 0.150 : 0.190) * (p.H || 1);
    const col = p.bodyCol ? { h: p.bodyCol.h, s: p.bodyCol.s * (male ? lerp(0.55, 1, mat) : 0.85) * clamp(p.intensity, 0.65, 1.2), l: p.bodyCol.l } : this.bodyColor(p, mat);
    const tcol = p.tcol || TAILCOL[p.tailColor] || TAILCOL.none;
    const solid = p.moscow && p.tailColor !== 'none';
    const tex = document.createElement('canvas'); tex.width = TW; tex.height = TH;
    const glow = document.createElement('canvas'); glow.width = TW; glow.height = TH;
    const c = tex.getContext('2d'), gl = glow.getContext('2d');

    const prof = (s) => Math.pow(Math.sin(Math.PI * Math.pow(Math.max(s, 0), 0.62)), 0.85) * (1 - 0.32 * s) + 0.21 * smoothstep(0.4, 1, s);
    const topY = (s) => MID - prof(s) * H * 0.93;
    const botY = (s) => MID + prof(s) * H * (male ? 1.0 : 1.0 + 0.28 * Math.sin(Math.PI * Math.min(1, s * 1.1)));
    const bodyPath = (cx) => {
      cx.beginPath(); const N = 44;
      for (let i = 0; i <= N; i++) { const s = i / N; const x = x0 + s * bodyLen, y = topY(s); i ? cx.lineTo(x, y) : cx.moveTo(x, y); }
      for (let i = N; i >= 0; i--) { const s = i / N; cx.lineTo(x0 + s * bodyLen, botY(s)); }
      cx.closePath();
    };

    /* --- kuyruk --- */
    const tailLen = TW - 3 - (xb - 6), tailH = Math.min(TH / 2 - 6, male ? tailLen * lerp(0.62, 0.95, mat) : tailLen * 0.55);
    const T = this.tailPoly(p.tail, tailLen, tailH);
    const tAlpha = solid ? 0.98 : male ? lerp(0.38, 0.9, mat) : 0.34;
    const tc = p.tcol || (male && p.tailColor !== 'none') ? tcol : { h: 205, s: 18, l: 74 };
    const tS = tc.s * (male ? lerp(0.45, 1, mat) : 1);
    c.save(); c.translate(xb - 6, MID);
    const tailPath = () => { if (T.edge === 'smooth') this.smoothPoly(c, T.poly); else { c.beginPath(); T.poly.forEach(([x, y], i) => (i ? c.lineTo(x, y) : c.moveTo(x, y))); c.closePath(); } };
    const g1 = c.createLinearGradient(0, 0, tailLen, 0);
    g1.addColorStop(0, hsl(tc.h, tS, tc.l + 8, tAlpha * 0.35)); g1.addColorStop(0.4, hsl(tc.h, tS, tc.l, tAlpha * 0.78)); g1.addColorStop(1, hsl(tc.h, tS, tc.l - 6, tAlpha));
    tailPath(); c.fillStyle = g1; c.fill();
    if (male && p.tailColor2) { // ikinci renk: alt yarı
      const t2 = TAILCOL[p.tailColor2]; c.save(); tailPath(); c.clip();
      const g2 = c.createLinearGradient(0, 0, tailLen, 0); g2.addColorStop(0, hsl(t2.h, t2.s, t2.l, 0)); g2.addColorStop(1, hsl(t2.h, t2.s * lerp(0.5, 1, mat), t2.l, tAlpha));
      c.fillStyle = g2; c.fillRect(0, 0, tailLen, tailH + 4); c.restore();
    }
    // ışınlar
    c.save(); tailPath(); c.clip();
    c.strokeStyle = hsl(tc.h, tS * 0.8, tc.l - 18, solid ? 0.2 : 0.24); c.lineWidth = 1;
    const rays = p.tail === 'lace' ? 26 : 16;
    for (let i = 0; i < rays; i++) { const v = -1 + (2 * (i + 0.5)) / rays; c.beginPath(); c.moveTo(2, v * 3); c.lineTo(tailLen * (p.tail === 'halfmoon' ? Math.cos(v * Math.PI / 2) : 1), v * tailH * 1.02); c.stroke(); }
    if (p.tail === 'lace') { c.strokeStyle = hsl(tc.h, tS, tc.l + 12, 0.22); for (let k = 1; k < 9; k++) { c.beginPath(); c.arc(0, 0, tailLen * k / 9, -1.4, 1.4); c.stroke(); } }
    // kuyruk desenleri
    if (p.extra) for (const e of p.extra) this.extra(c, e, { x0, bodyLen, xb, H, MID, tailLen, tailH, p }, new RNG(seed * 11 + (e.dyn ? (p.mphase || 0) * 997 : 0)), 'tail');
    if (male && p.st) this.rings(c, 0, -tailH, tailLen, tailH, 6.5, rng, hsl(tc.h, tS, Math.max(8, tc.l - 30), 0.5 * mat + 0.1), 1.2);
    if (male && p.grass) this.dots(c, 120, 0, -tailH, tailLen, tailH, 0.8, 1.7, hsl(tc.h, tS, 14, 0.55 * mat + 0.1), rng);
    if (male && p.mosaic) this.blotches(c, 18, 0, -tailH, tailLen, tailH, 5, 13, [hsl(tc.h, tS, tc.l - 10, 0.55), 'rgba(20,20,20,.45)', hsl(30, 80 * mat, 55, 0.5)], rng);
    c.restore();
    tailPath(); c.strokeStyle = hsl(tc.h, tS, tc.l - 22, solid ? 0.8 : 0.5); c.lineWidth = T.edge === 'sharp' ? 1.6 : 2; c.stroke();
    if (T.swords) for (const sw of T.swords) { c.beginPath(); sw.forEach(([x, y], i) => (i ? c.lineTo(x, y) : c.moveTo(x, y))); c.closePath(); c.fillStyle = hsl(tc.h, tS, tc.l - 4, Math.max(tAlpha, 0.7)); c.fill(); c.strokeStyle = hsl(tc.h, tS, tc.l - 24, 0.7); c.lineWidth = 1; c.stroke(); }
    c.restore();

    /* --- sırt ve anal yüzgeç (gövdenin arkasında) --- */
    const dAlpha = male ? lerp(0.35, 0.85, mat) : 0.35;
    const dCol = p.tcol || (male && p.tailColor !== 'none') ? tcol : { h: 205, s: 15, l: 70 };
    const dsc = (male ? 1.9 : 0.95) * (p.dorsal || 1);
    const dx0 = x0 + bodyLen * 0.34, dx1 = x0 + bodyLen * 0.68, dxa = x0 + bodyLen * 0.62;
    c.beginPath(); c.moveTo(dx0, topY(0.34) + 4);
    c.bezierCurveTo(dx0 + 14, MID - H * dsc, dxa - 6, MID - H * (dsc + 0.5), dxa + 14, MID - H * (dsc * 0.9));
    c.bezierCurveTo(dx1 + 14, MID - H * 1.15, dx1, topY(0.68), dx1 - 8, topY(0.68) + 4); c.closePath();
    const gd = c.createLinearGradient(0, MID - H * 2.4, 0, MID - H);
    gd.addColorStop(0, hsl(dCol.h, dCol.s * (male ? lerp(0.5, 1, mat) : 1), dCol.l + 4, dAlpha)); gd.addColorStop(1, hsl(dCol.h, dCol.s * 0.8, dCol.l, dAlpha * 0.5));
    c.fillStyle = gd; c.fill(); c.strokeStyle = hsl(dCol.h, dCol.s, dCol.l - 20, 0.35); c.lineWidth = 1; c.stroke();
    // anal yüzgeç / gonopodyum
    const ax = x0 + bodyLen * 0.58;
    c.beginPath();
    if (p.bigAnal) { c.moveTo(ax - 30, botY(0.5) - 2); c.bezierCurveTo(ax - 20, botY(0.5) + H * 2.2, ax + 20, botY(0.6) + H * 2.6, ax + 50, botY(0.7) + H * 0.6); c.lineTo(ax + 40, botY(0.7) - 3); }
    else if (male) { c.moveTo(ax, botY(0.58) - 3); c.lineTo(ax + 22, botY(0.58) + H * 0.8); c.lineTo(ax + 25, botY(0.58) + H * 0.8); c.lineTo(ax + 7, botY(0.58) - 3); }
    else { c.moveTo(ax, botY(0.58) - 3); c.quadraticCurveTo(ax + 8, botY(0.58) + H * 0.9, ax + 28, botY(0.58) + H * 0.55); c.lineTo(ax + 26, botY(0.65) - 3); }
    c.closePath(); c.fillStyle = hsl(dCol.h, dCol.s * 0.7, dCol.l, 0.5); c.fill();

    /* --- gövde --- */
    c.save(); bodyPath(c);
    const gb = c.createLinearGradient(0, MID - H, 0, MID + H * 1.1);
    const sat = col.s;
    gb.addColorStop(0, hsl(col.h, sat, col.l - 14)); gb.addColorStop(0.5, hsl(col.h, sat, col.l)); gb.addColorStop(1, hsl(col.h, sat * 0.75, Math.min(96, col.l + 16)));
    c.fillStyle = gb; c.fill(); c.clip();
    // pul dokusu
    c.strokeStyle = 'rgba(255,255,255,0.07)'; c.lineWidth = 1;
    for (let yy = MID - H, row = 0; yy < MID + H * 1.2; yy += 8, row++) for (let xx = x0 + 30 + (row % 2 ? 6 : 0); xx < xb; xx += 12) { c.beginPath(); c.arc(xx, yy, 6, -0.9, 0.9); c.stroke(); }
    // desenler
    if (male) {
      const mA = 0.25 + 0.75 * mat;
      if (p.mosaic) this.blotches(c, 26, x0 + bodyLen * 0.3, MID - H, xb, MID + H, 3, 9, [hsl(tc.h, 75, 45, 0.6 * mA), 'rgba(15,15,20,.5)', hsl(35, 80, 52, 0.5 * mA)], rng);
      if (p.sb) this.rings(c, x0 + bodyLen * 0.22, MID - H, xb, MID + H, 5.5, rng, hsl(col.h, Math.min(60, col.s + 10), Math.max(6, col.l - 34), 0.55 * mA), 1.1);
      if (p.grass) this.dots(c, 190, x0 + bodyLen * 0.15, MID - H, xb, MID + H, 0.7, 1.6, hsl(col.h, 40, 12, 0.6 * mA), rng);
      if (p.tux) {
        const gt = c.createLinearGradient(x0 + bodyLen * 0.42, 0, x0 + bodyLen * 0.58, 0);
        gt.addColorStop(0, 'rgba(8,10,22,0)'); gt.addColorStop(1, `rgba(8,10,22,${0.9 * mA})`);
        c.fillStyle = gt; c.fillRect(x0 + bodyLen * 0.4, MID - H * 1.2, bodyLen, H * 2.6);
      }
    }
    if (p.metal || BODY[p.body].sheen) { // metalik kuşak
      const gm = c.createLinearGradient(0, MID - H, 0, MID + H);
      gm.addColorStop(0, 'rgba(255,255,255,.38)'); gm.addColorStop(0.35, 'rgba(255,255,255,.02)'); gm.addColorStop(0.75, 'rgba(255,255,255,.14)'); gm.addColorStop(1, 'rgba(255,255,255,.04)');
      c.fillStyle = gm; c.fillRect(x0, MID - H * 1.2, bodyLen, H * 2.6);
    }
    if (p.extra) for (const e of p.extra) this.extra(c, e, { x0, bodyLen, xb, H, MID, tailLen, tailH, p }, new RNG(seed * 7 + (e.dyn ? (p.mphase || 0) * 997 : 0)), 'body');
    // üst parlama + yan çizgi
    c.fillStyle = 'rgba(255,255,255,.17)'; c.beginPath(); c.ellipse(x0 + bodyLen * 0.42, MID - H * 0.52, bodyLen * 0.3, H * 0.2, 0, 0, TAU); c.fill();
    c.strokeStyle = 'rgba(0,0,0,.08)'; c.lineWidth = 1.2; c.beginPath(); c.moveTo(x0 + bodyLen * 0.2, MID + 1); c.lineTo(xb, MID + 1); c.stroke();
    c.restore();
    bodyPath(c); c.strokeStyle = hsl(col.h, col.s, Math.max(5, col.l - 28), 0.5); c.lineWidth = 1.5; c.stroke();

    /* --- göz --- */
    const alb = BODY[p.body].eye === 'red' || p.eyeRed;
    const ex = x0 + bodyLen * 0.1, ey = MID - H * 0.14, er = H * 0.19 + 1.5;
    c.beginPath(); c.arc(ex, ey, er + 1.2, 0, TAU); c.fillStyle = alb ? 'hsl(350,60%,70%)' : 'rgba(20,22,26,.9)'; c.fill();
    c.beginPath(); c.arc(ex, ey, er * 0.78, 0, TAU); c.fillStyle = alb ? 'hsl(352,85%,48%)' : 'hsl(42,80%,52%)'; c.fill();
    c.beginPath(); c.arc(ex + 0.5, ey, er * 0.48, 0, TAU); c.fillStyle = alb ? 'hsl(350,70%,22%)' : '#0b0c10'; c.fill();
    c.beginPath(); c.arc(ex - er * 0.28, ey - er * 0.32, er * 0.2, 0, TAU); c.fillStyle = 'rgba(255,255,255,.9)'; c.fill();

    /* --- parıltı dokusu (metal / aurora: dilim açısına göre kayan) --- */
    let hasGlow = false;
    if (p.metal || BODY[p.body].sheen) {
      hasGlow = true; bodyPath(gl);
      const gg = gl.createLinearGradient(x0, 0, xb, 0);
      if (BODY[p.body].iri) for (let i = 0; i <= 6; i++) gg.addColorStop(i / 6, `hsla(${150 + i * 28},95%,70%,.9)`);
      else { gg.addColorStop(0, 'rgba(255,255,255,.85)'); gg.addColorStop(1, 'rgba(210,235,255,.85)'); }
      gl.fillStyle = gg; gl.fill();
    }
    // dikey kırpma: her dikey şeritte dolu piksellerin yarı yüksekliği (çizim alanını küçültür)
    const B = 88, ext = new Float32Array(B).fill(8), id = c.getImageData(0, 0, TW, TH).data;
    for (let x = 0; x < TW; x++) { const bk = Math.min(B - 1, Math.floor((x / TW) * B)); for (let y = 0; y < TH; y++) { if (id[(y * TW + x) * 4 + 3] > 6) { const e = Math.abs(y - MID) + 4; if (e > ext[bk]) ext[bk] = e; } } }
    return { tex, glow: hasGlow ? glow : null, pec: p.pec || 1, bf, bodyLen, H, MID, ext, tailSoft: tt.soft, tailStart: 1 - tailFrac };
  },

  /** Tür desenleri: region 'body' (gövde kırpmasında, mutlak koordinat) veya 'tail' (kuyruk kökü orijin). */
  extra(c, e, g, rng, region) {
    const { x0, bodyLen, xb, H, MID, tailLen, tailH } = g;
    if (region === 'body') switch (e.t) {
      case 'tiger': for (let i = 0; i < 7; i++) { c.fillStyle = i % 2 ? 'rgba(20,15,10,.6)' : 'rgba(255,140,30,.55)'; c.beginPath(); c.ellipse(x0 + bodyLen * (0.22 + i * 0.1), MID + rng.float(-3, 3), 9, H * 1.1, rng.float(-0.2, 0.2), 0, TAU); c.fill(); } break;
      case 'cobra': c.strokeStyle = 'rgba(15,12,10,.7)'; c.lineWidth = 5; for (let i = 0; i < 5; i++) { const x = x0 + bodyLen * (0.25 + i * 0.13); c.beginPath(); c.moveTo(x, MID - H); c.bezierCurveTo(x + 10, MID - H * 0.4, x - 10, MID + H * 0.3, x + 4, MID + H); c.stroke(); } break;
      case 'bars': c.fillStyle = 'rgba(15,12,12,.7)'; for (let i = 0; i < e.n; i++) c.fillRect(x0 + bodyLen * (0.3 + i * 0.14), MID - H * 1.2, 7, H * 2.6); break;
      case 'spots': c.fillStyle = e.col; for (let i = 0; i < e.n; i++) { c.beginPath(); c.arc(rng.float(x0 + bodyLen * 0.2, xb - 6), MID + rng.float(-0.8, 0.8) * H, e.rand ? rng.float(2, e.r + 2) : e.r * rng.float(0.6, 1), 0, TAU); c.fill(); } break;
      case 'marble': this.blotches(c, e.n, x0 + bodyLen * 0.15, MID - H, xb, MID + H, 4, 12, [e.col, 'rgba(230,235,240,.35)'], rng); break;
      case 'koi': this.blotches(c, 7, x0 + bodyLen * 0.1, MID - H, xb, MID + H, 8, 20, ['rgba(250,250,245,.9)', 'rgba(235,90,40,.9)', 'rgba(20,18,20,.85)'], rng); break;
      case 'dragon': this.rings(c, x0 + bodyLen * 0.15, MID - H, xb, MID + H, 5.5, rng, 'rgba(40,30,10,.55)', 1.2); break;
      case 'saltpepper': this.dots(c, e.dense ? 160 : 90, x0 + bodyLen * 0.2, MID - H, xb, MID + H, 0.9, 2.1, 'rgba(15,12,14,.7)', rng); this.dots(c, 40, x0 + bodyLen * 0.2, MID - H, xb, MID + H, 0.8, 1.6, 'rgba(255,255,255,.5)', rng); break;
      case 'stripe': c.strokeStyle = e.col || 'rgba(120,20,20,.6)'; c.lineWidth = 4; c.beginPath(); c.moveTo(x0 + bodyLen * 0.2, MID + 2); c.lineTo(xb, MID + 2); c.stroke(); break;
      case 'mickey': c.fillStyle = '#0c0c10'; c.beginPath(); c.arc(xb - 20, MID, 8.5, 0, TAU); c.arc(xb - 10, MID - 9, 5, 0, TAU); c.arc(xb - 10, MID + 9, 5, 0, TAU); c.fill(); break;
      case 'comet': c.strokeStyle = '#0c0c10'; c.lineWidth = 4.5; c.beginPath(); c.moveTo(x0 + bodyLen * 0.55, MID - H * 0.55); c.lineTo(xb, MID - H * 0.15); c.stroke(); break;
      case 'moon': c.strokeStyle = '#0c0c10'; c.lineWidth = 5; c.beginPath(); c.arc(xb - 4, MID, H * 0.65, Math.PI * 0.62, Math.PI * 1.38); c.stroke(); break;
      case 'twospot': c.fillStyle = '#0c0c10'; for (const s of [-1, 1]) { c.beginPath(); c.arc(xb - 14, MID + s * H * 0.45, 5.5, 0, TAU); c.fill(); } break;
    } else switch (e.t) {
      case 'butterfly': c.fillStyle = 'rgba(245,245,250,.6)'; c.fillRect(tailLen * 0.58, -tailH * 1.2, tailLen, tailH * 2.4); break;
      case 'koi': this.blotches(c, 5, 0, -tailH, tailLen, tailH, 8, 18, ['rgba(250,250,245,.8)', 'rgba(235,90,40,.85)', 'rgba(20,18,20,.7)'], rng); break;
      case 'saltpepper': this.dots(c, 90, 0, -tailH, tailLen, tailH, 0.9, 1.9, 'rgba(15,12,14,.6)', rng); break;
      case 'marble': this.blotches(c, e.n, 0, -tailH, tailLen, tailH, 5, 14, [e.col, 'rgba(255,255,255,.3)'], rng); break;
      case 'comet': c.strokeStyle = 'rgba(12,12,16,.7)'; c.lineWidth = 4; c.beginPath(); c.moveTo(0, -tailH * 0.1); c.lineTo(tailLen, -tailH * 0.55); c.stroke(); break;
      case 'tiger': this.blotches(c, 4, 0, -tailH * 0.6, tailLen, tailH * 0.6, 4, 8, ['rgba(255,140,30,.6)', 'rgba(20,15,10,.5)'], rng); break;
      case 'spots': c.fillStyle = e.col; for (let i = 0; i < 5; i++) { c.beginPath(); c.arc(rng.float(tailLen * 0.2, tailLen * 0.9), rng.float(-tailH * 0.5, tailH * 0.5), e.r * 0.7, 0, TAU); c.fill(); } break;
    }
  },

  /** Yaratığın dokusunu (gerekirse) yeniden üretir. */
  sprite(cr) {
    const mat = cr.maturity();
    const mph = cr.pheno.marble ? Math.floor(cr.ageDays() / 5) % 6 : 0, key = cr.pheno.sig + '|' + Math.round(mat * 6) + '|' + cr.seed + (cr.boosted ? '|b' : '') + '|' + mph;
    if (!cr.sprite || cr.sprite.key !== key) { cr.sprite = this.build(Object.assign({}, cr.pheno, { mphase: mph }, cr.boosted ? { intensity: cr.pheno.intensity * 1.14 } : {}), Math.round(mat * 6) / 6, cr.seed); cr.sprite.key = key; cr._thumb = null; }
    return cr.sprite;
  },

  /** Düz poz küçük resim (liste, ansiklopedi). */
  thumb(cr, w = 96) {
    const sp = this.sprite(cr);
    if (cr._thumb && cr._thumb.width === w) return cr._thumb;
    const cv = document.createElement('canvas'); cv.width = w; cv.height = Math.round(w * this.TH / this.TW);
    cv.getContext('2d').drawImage(sp.tex, 0, 0, cv.width, cv.height);
    return (cr._thumb = cv);
  },

  /** Catmull-Rom ile eklem değerlerinden sürekli y(s) */
  _cr(a, b, c, d, t) { const t2 = t * t, t3 = t2 * t; return 0.5 * ((2 * b) + (-a + c) * t + (2 * a - 5 * b + 4 * c - d) * t2 + (-a + 3 * b - 3 * c + d) * t3); },

  /** Omurga noktaları: joints (dokunun birimlerinde yanal sapma) → SUB*(J-1)+1 nokta */
  /** Dilim konumları: gövdede seyrek, bükülmenin yoğun olduğu kuyrukta sık. İki ayrıntı düzeyi (LOD). */
  _lists: (() => {
    const J = 11, mk = (nb, nt) => { const a = []; for (let j = 0; j < J - 1; j++) { const n = j < 5 ? nb : nt; for (let k = 0; k < n; k++) a.push((j + k / n) / (J - 1)); } a.push(1); return a; };
    return [mk(2, 5), mk(1, 2)];
  })(),
  spine(joints, out, lod = 0) {
    const J = joints.length, L = this._lists[lod], S = L.length - 1, TW = this.TW;
    for (let i = 0; i <= S; i++) {
      const s = L[i], jf = s * (J - 1), j = Math.min(J - 2, Math.floor(jf)), t = jf - j;
      const y = this._cr(joints[Math.max(0, j - 1)], joints[j], joints[j + 1], joints[Math.min(J - 1, j + 2)], t);
      const o = out[i] || (out[i] = { x: 0, y: 0, s: 0 });
      o.x = (this.SC - s) * TW; o.y = y; o.s = s;
    }
    return S;
  },
  _pts: [],

  /**
   * Yüzen bir balığı çizer. ctx'in taban dönüşümü `base` = [a,b,c,d,e,f] (dünya → aygıt pikseli).
   * Dilim başına tek setTransform (save/restore yok) — 60+ balıkta hızlı.
   * mul: ek ölçek, alpha: saydamlık, t: saniye (parıltı zamanı).
   */
  draw(ctx, cr, t, mul, alpha, base) {
    const sw = cr.sw, sp = this.sprite(cr), TW = this.TW, TH = this.TH, tex = sp.tex, glow = sp.glow, ext = sp.ext;
    const k = (cr.bodyLen() / sp.bodyLen) * mul;                       // doku birimi → dünya birimi
    const lod = k * TW * base[0] < 175 ? 1 : 0;                         // küçük balık: daha az dilim
    const S = this.spine(sw.joints, this._pts, lod), P = this._pts;
    const hc = Math.cos(sw.heading), hs = Math.sin(sw.heading), fl = sw.flip;
    const la = hc * k, lb = hs * k, lc = -hs * fl * k, ld = hc * fl * k;
    const Fa = base[0] * la + base[2] * lb, Fb = base[1] * la + base[3] * lb, Fc = base[0] * lc + base[2] * ld, Fd = base[1] * lc + base[3] * ld;
    const Fe = base[0] * sw.x + base[2] * sw.y + base[4], Ff = base[1] * sw.x + base[3] * sw.y + base[5];
    ctx.globalAlpha = alpha;
    const hy = TH / 2;
    for (let i = 0; i < S; i++) {
      const a = P[i], b = P[i + 1], dx = b.x - a.x, dy = b.y - a.y, len = Math.hypot(dx, dy) || 1e-6, cs = dx / len, sn = dy / len;
      const srcW = (b.s - a.s) * TW, sx = a.s * TW;
      // dış bükey boşluğu kapatan küçük taşma (eğim değişimiyle orantılı)
      const nx = P[i + 2 > S ? S : i + 2], ex = nx.x - b.x, ey = nx.y - b.y, el = Math.hypot(ex, ey) || 1, dth = Math.abs(cs * (ey / el) - sn * (ex / el));
      const ov = 0.2 + dth * TH * 0.22, sw2 = Math.min(srcW + ov * srcW / len, TW - sx);
      ctx.setTransform(Fa * cs + Fc * sn, Fb * cs + Fd * sn, Fa * sn - Fc * cs, Fb * sn - Fd * cs, Fa * a.x + Fc * a.y + Fe, Fb * a.x + Fd * a.y + Ff);
      const b0 = Math.floor(sx / TW * 88), b1 = Math.min(87, Math.floor((sx + sw2) / TW * 88)); let eh = 0; for (let q = b0; q <= b1; q++) if (ext[q] > eh) eh = ext[q]; eh = Math.min(eh, hy);
      ctx.drawImage(tex, sx, hy - eh, sw2, eh * 2, 0, -eh, len + ov, eh * 2);
      if (glow && a.s < sp.tailStart) { // açıya göre kayan parıltı
        const ang = Math.atan2(dy, dx) + Math.PI, gA = Math.pow(Math.max(0, Math.sin(ang * 3 + t * 0.9 - a.s * 4.5)), 1.5) * 0.5;
        if (gA > 0.02) { ctx.globalAlpha = alpha * gA; ctx.globalCompositeOperation = 'lighter'; ctx.drawImage(glow, sx, hy - eh, sw2, eh * 2, 0, -eh, len + ov, eh * 2); ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = alpha; }
      }
    }
    // göğüs yüzgeci (ayrı animasyon)
    ctx.setTransform(Fa, Fb, Fc, Fd, Fe, Ff);
    const pp = P[Math.round(S * 0.2)], flap = Math.sin(sw.pf) * 0.5, fr = sp.bodyLen * 0.09 * sp.pec;
    ctx.translate(pp.x, pp.y + sp.H * 0.5); ctx.rotate(Math.PI - 0.55 + flap);
    ctx.beginPath(); ctx.ellipse(fr * 0.8, 0, fr, fr * 0.42, 0, 0, TAU); ctx.fillStyle = 'rgba(235,245,250,.38)'; ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,.35)'; ctx.lineWidth = 0.8; ctx.stroke();
    // hastalık belirtileri
    if (cr.dis) {
      ctx.setTransform(Fa, Fb, Fc, Fd, Fe, Ff); const sev = cr.dis.sev, id = cr.dis.id, r = new RNG(cr.seed + 5);
      if (id === 'ich') { ctx.fillStyle = 'rgba(255,255,255,.92)'; for (let i = 0, n = 5 + Math.round(sev * 22); i < n; i++) { const q = P[Math.round(S * r.float(0.1, 0.62))]; ctx.beginPath(); ctx.arc(q.x, q.y + r.float(-0.7, 0.7) * sp.H, r.float(3.5, 6), 0, TAU); ctx.fill(); } }
      else if (id === 'velvet') { ctx.fillStyle = 'rgba(245,215,120,.65)'; for (let i = 0, n = 30 + Math.round(sev * 70); i < n; i++) { const q = P[Math.round(S * r.float(0.08, 0.65))]; ctx.beginPath(); ctx.arc(q.x, q.y + r.float(-0.8, 0.8) * sp.H, r.float(1.6, 2.8), 0, TAU); ctx.fill(); } }
      else if (id === 'fungus') { ctx.fillStyle = 'rgba(245,245,240,.72)'; for (let i = 0, n = 3 + Math.round(sev * 6); i < n; i++) { const q = P[Math.round(S * r.float(0.08, 0.55))]; ctx.beginPath(); ctx.arc(q.x, q.y + r.float(-0.6, 0.6) * sp.H, r.float(8, 15), 0, TAU); ctx.fill(); } }
      else { ctx.strokeStyle = 'rgba(190,35,35,.65)'; ctx.lineWidth = 2.4; for (let i = Math.round(S * 0.72); i <= S; i++) { const q = P[i]; ctx.beginPath(); ctx.moveTo(q.x, q.y); ctx.lineTo(q.x - r.float(4, 10), q.y + r.float(-1, 1) * sp.H * (1.4 + sev)); ctx.stroke(); } }
    }
    // gebelik lekesi: gebelik ilerledikçe koyulaşır
    if (cr.preg) {
      const pr = clamp((cr.now - cr.preg.start) / (cr.preg.due - cr.preg.start), 0, 1);
      if (pr > 0) { ctx.setTransform(Fa, Fb, Fc, Fd, Fe, Ff); const gp = P[Math.round(S * 0.5)]; ctx.beginPath(); ctx.ellipse(gp.x - 4, gp.y + sp.H * (0.62 - 0.1 * pr), sp.H * (0.28 + 0.34 * pr), sp.H * (0.2 + 0.26 * pr), 0, 0, TAU); ctx.fillStyle = `rgba(55,22,12,${0.12 + 0.5 * pr})`; ctx.fill(); }
    }
    // ağız (yeme anı)
    if (sw.mouthT > 0) { ctx.setTransform(Fa, Fb, Fc, Fd, Fe, Ff); const n = P[0], o = Math.sin(clamp(sw.mouthT / 0.35, 0, 1) * Math.PI); ctx.beginPath(); ctx.moveTo(n.x + 1, n.y + 1); ctx.lineTo(n.x - 7, n.y - 4 * o); ctx.lineTo(n.x - 7, n.y + 5 * o); ctx.closePath(); ctx.fillStyle = 'rgba(20,10,10,.65)'; ctx.fill(); }
    ctx.globalAlpha = 1; ctx.setTransform(base[0], base[1], base[2], base[3], base[4], base[5]);
  },
};
