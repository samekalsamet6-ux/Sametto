'use strict';
/* =====================================================================
   25 · 3D BALIK — kütüphanesiz WebGL. Her balığın gen dokusu (FishArt sprite) bir
   mesafe alanından "şişirilerek" gerçek 3D ağa dönüşür: gövde yanlardan basık,
   yüzgeçler ince. Hareket GPU'da, şartnamedeki ilerleyen dalga formülüyle:
       yanSapma(s,t) = A(s)·sin(k·s − ω·t),   A(s) = a0 + a1·s + a2·s²
   Göğüs yüzgeçleri ayrı ağ olarak çırpar; poz makinesi: süzülme, yerinde durma,
   dönüş, yeme, kur yapma, ürkme, dinlenme. Yalnızca büyük portrelerde (kart, laboratuvar,
   ansiklopedi, kutlama) kullanılır; tank 2D kalır.
   ===================================================================== */
const M4 = {
  mul(a, b) { const o = new Float32Array(16); for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) { let s = 0; for (let k = 0; k < 4; k++) s += a[k * 4 + j] * b[i * 4 + k]; o[i * 4 + j] = s; } return o; },
  persp(f, asp, n, fa) { const t = 1 / Math.tan(f / 2), o = new Float32Array(16); o[0] = t / asp; o[5] = t; o[10] = (fa + n) / (n - fa); o[11] = -1; o[14] = 2 * fa * n / (n - fa); return o; },
  trans(x, y, z) { const o = new Float32Array([1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, x, y, z, 1]); return o; },
  rotY(a) { const c = Math.cos(a), s = Math.sin(a); return new Float32Array([c, 0, -s, 0, 0, 1, 0, 0, s, 0, c, 0, 0, 0, 0, 1]); },
  rotX(a) { const c = Math.cos(a), s = Math.sin(a); return new Float32Array([1, 0, 0, 0, 0, c, s, 0, 0, -s, c, 0, 0, 0, 0, 1]); },
  rotZ(a) { const c = Math.cos(a), s = Math.sin(a); return new Float32Array([c, s, 0, 0, -s, c, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]); },
  nrm(m) { return new Float32Array([m[0], m[1], m[2], m[4], m[5], m[6], m[8], m[9], m[10]]); },
};

const F3_VS = `
attribute vec3 aPos; attribute vec3 aNrm; attribute vec2 aUV; attribute float aFin;
uniform mat4 uProj, uView, uModel; uniform mat3 uNrmM;
uniform float uOmega, uK, uAmp, uBend, uHead, uLen, uGravid, uFlap, uSide, uMode;
uniform vec3 uBase;
varying vec2 vUV; varying vec3 vN; varying vec3 vW; varying float vS;
void main() {
  vec3 p = aPos, n = aNrm;
  if (uMode > 0.5) { float c = cos(uFlap); p = vec3(uBase.x + aPos.x * c, uBase.y + aPos.y, uSide * (uBase.z + aFin * sin(uFlap))); n = vec3(0.0, 0.0, uSide); }
  float s = clamp((uHead - p.x) / uLen, 0.0, 1.0);
  if (uMode < 0.5) { float belly = smoothstep(0.30, 0.46, s) * (1.0 - smoothstep(0.62, 0.82, s)) * step(p.y, 0.02); p.z *= 1.0 + uGravid * 0.6 * belly; p.y -= uGravid * 0.035 * belly * abs(sign(p.z)); }
  float A = (0.012 + 0.03 * s + 0.19 * s * s) * uAmp * uLen;
  float ph = uK * s - uOmega;
  p.z += A * sin(ph) + uBend * uLen * s * s;
  float dwdx = ((0.03 + 0.38 * s) * uAmp * uLen * sin(ph) + A * uK * cos(ph) + 2.0 * uBend * uLen * s) * (-1.0 / uLen);
  n.x -= dwdx * n.z;
  vec4 wp = uModel * vec4(p, 1.0);
  vW = wp.xyz; vN = uNrmM * n; vUV = aUV; vS = s;
  gl_Position = uProj * uView * wp;
}`;
const F3_FS = `
#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif
uniform sampler2D uTex, uGlow; uniform float uPass, uMode, uHasGlow, uT, uDim, uSick, uSeed; uniform vec3 uCam, uFinCol; uniform float uCamZ;
varying vec2 vUV; varying vec3 vN; varying vec3 vW; varying float vS;
float h21(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
void main() {
  vec3 N = normalize(vN), V = normalize(uCam - vW), L = normalize(vec3(-0.45, 0.8, 0.7));
  if (uMode > 0.5) {
    float rim = pow(1.0 - abs(dot(N, V)), 1.6), al = 0.40 + 0.3 * rim;
    vec3 fc = uFinCol * (0.7 + 0.3 * dot(N, L)) * (0.55 + 0.4 * rim) * uDim;
    gl_FragColor = vec4(fc * al, al); return;
  }
  vec4 t = texture2D(uTex, vUV); float a = t.a;
  if (uPass < 0.5) { if (a < 0.9) discard; } else { if (a >= 0.9 || a < 0.03) discard; }
  float nd = dot(N, L), wrap = 0.5 + 0.5 * nd, fres = 1.0 - max(dot(N, V), 0.0);
  float caust = 0.92 + 0.08 * sin(vW.x * 9.0 + uT * 1.7) * sin(vW.y * 7.0 - uT * 1.3);
  vec3 col = t.rgb * (0.34 + 0.86 * wrap) * caust;
  if (uPass < 0.5) {
    vec3 Hh = normalize(L + V); col += vec3(0.95, 1.0, 1.0) * pow(max(dot(N, Hh), 0.0), 38.0) * 0.30;
    col += vec3(0.30, 0.62, 0.70) * pow(fres, 2.6) * 0.34;
    if (uHasGlow > 0.5) { vec4 g = texture2D(uGlow, vUV); float k = 0.5 + 0.5 * sin(dot(N, vec3(1.3, 0.6, 0.0)) * 5.0 + uT * 0.9 + vS * 6.0); col += g.rgb * g.a * (0.25 + 0.55 * k) * 0.8; }
    if (uSick > 0.0) { vec2 gq = floor(vUV * vec2(46.0, 24.0)); float r = h21(gq + uSeed); vec2 f = fract(vUV * vec2(46.0, 24.0)) - 0.5; if (r > 1.0 - 0.18 * uSick && dot(f, f) < 0.14) col = mix(col, vec3(1.0), 0.9); }
  } else { col += vec3(0.25, 0.55, 0.62) * pow(fres, 2.0) * 0.18; }
  col *= uDim; float fog = clamp((length(uCam - vW) - 1.6) * 0.12, 0.0, 0.35); col = mix(col, vec3(0.08, 0.36, 0.46), fog);
  gl_FragColor = vec4(col * (uPass < 0.5 ? 1.0 : a), uPass < 0.5 ? 1.0 : a);
}`;

const Fish3D = {
  _ok: null, GW: 176, GH: 84,
  supported() { if (this._ok === null) { try { const c = document.createElement('canvas'); this._ok = !!(c.getContext('webgl') || c.getContext('experimental-webgl')); } catch (e) { this._ok = false; } } return this._ok; },
  enabled() { const S = Game.S; return this.supported() && !(S && S.settings && S.settings.fx3d === false); },

  /** Sprite dokusundan 3D ağ: mesafe alanı → kubbe kalınlığı → ön/arka yüzey. Sprite üzerinde önbelleklenir. */
  mesh(sp) {
    if (sp.m3) return sp.m3;
    const GW = this.GW, GH = this.GH, TW = FishArt.TW, TH = FishArt.TH, ASP = TW / TH, NW = GW + 1, NH = GH + 1;
    const cv = document.createElement('canvas'); cv.width = NW; cv.height = NH; const cx = cv.getContext('2d', { willReadFrequently: true }); cx.drawImage(sp.tex, 0, 0, NW, NH);
    const id = cx.getImageData(0, 0, NW, NH).data, al = new Float32Array(NW * NH); for (let i = 0; i < al.length; i++) al[i] = id[i * 4 + 3] / 255;
    // iç mesafe (chamfer 3-4)
    const BIG = 1e4, d = new Float32Array(NW * NH); for (let i = 0; i < d.length; i++) d[i] = al[i] > 0.35 ? BIG : 0;
    const at = (x, y) => (x < 0 || y < 0 || x >= NW || y >= NH ? 0 : d[y * NW + x]);
    for (let y = 0; y < NH; y++) for (let x = 0; x < NW; x++) { const i = y * NW + x; if (!d[i]) continue; d[i] = Math.min(d[i], at(x - 1, y) + 1, at(x, y - 1) + 1, at(x - 1, y - 1) + 1.4, at(x + 1, y - 1) + 1.4); }
    for (let y = NH - 1; y >= 0; y--) for (let x = NW - 1; x >= 0; x--) { const i = y * NW + x; if (!d[i]) continue; d[i] = Math.min(d[i], at(x + 1, y) + 1, at(x, y + 1) + 1, at(x + 1, y + 1) + 1.4, at(x - 1, y + 1) + 1.4); }
    let dmax = 1; for (let i = 0; i < d.length; i++) if (d[i] < BIG && d[i] > dmax) dmax = d[i];
    // yerel en büyük mesafe (dilation): ince yüzgeçler ince, gövde kalın
    const R = 6, dl = new Float32Array(NW * NH), tmp = new Float32Array(NW * NH);
    for (let y = 0; y < NH; y++) for (let x = 0; x < NW; x++) { let m = 0; for (let k = -R; k <= R; k++) { const xx = x + k; if (xx >= 0 && xx < NW) m = Math.max(m, d[y * NW + xx]); } tmp[y * NW + x] = m; }
    for (let y = 0; y < NH; y++) for (let x = 0; x < NW; x++) { let m = 0; for (let k = -R; k <= R; k++) { const yy = y + k; if (yy >= 0 && yy < NH) m = Math.max(m, tmp[yy * NW + x]); } dl[y * NW + x] = m; }
    const cellY = 1 / GH, half = dmax * cellY * 0.62;      // gövde yarı kalınlığı (yanlardan basık)
    let z = new Float32Array(NW * NH);
    for (let i = 0; i < z.length; i++) { if (d[i] <= 0 || d[i] >= BIG) continue; const loc = Math.max(dl[i], 1), f = Math.min(1, d[i] / loc), prof = Math.sqrt(Math.max(0, 1 - (1 - f) * (1 - f))), body = Math.pow(Math.min(1, loc / (dmax * 0.9)), 1.15); z[i] = half * body * prof + 0.0035 * Math.min(1, d[i] / 2); }
    for (let pass = 0; pass < 3; pass++) { const nz = new Float32Array(z.length); for (let y = 0; y < NH; y++) for (let x = 0; x < NW; x++) { const i = y * NW + x; if (z[i] <= 0) continue; let s = 0, c = 0; for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) { const xx = x + dx, yy = y + dy; if (xx < 0 || yy < 0 || xx >= NW || yy >= NH) continue; const v = z[yy * NW + xx]; s += v * (dx || dy ? 1 : 2); c += dx || dy ? 1 : 2; } nz[i] = s / c; } z = nz; }
    // köşe noktaları + normaller
    const V = new Float32Array(NW * NH * 2 * 8), cw = ASP / GW, ch = 1 / GH, X = (i) => (0.5 - i / GW) * ASP, Y = (j) => 0.5 - j / GH;
    const zz = (x, y) => (x < 0 || y < 0 || x >= NW || y >= NH ? 0 : z[y * NW + x]);
    for (let j = 0; j < NH; j++) for (let i = 0; i < NW; i++) {
      const k = j * NW + i, zf = z[k], dzx = (zz(i - 1, j) - zz(i + 1, j)) / (2 * cw) * -1, dzy = (zz(i, j - 1) - zz(i, j + 1)) / (2 * ch);
      // x ekseni aynalı (baş +x): dz/dx işareti ters; y yukarı
      for (const side of [1, -1]) {
        const o = (side === 1 ? k : k + NW * NH) * 8, nx = side * dzx * -1, ny = side * dzy * -1, nz = side, nl = Math.hypot(nx, ny, nz) || 1;
        V[o] = X(i); V[o + 1] = Y(j); V[o + 2] = side * zf; V[o + 3] = nx / nl; V[o + 4] = ny / nl; V[o + 5] = nz / nl; V[o + 6] = i / GW; V[o + 7] = j / GH;
      }
    }
    const fi = [], bi = [];
    for (let j = 0; j < GH; j++) for (let i = 0; i < GW; i++) {
      const a = j * NW + i, b = a + 1, c = a + NW, e = c + 1; if (al[a] < 0.12 && al[b] < 0.12 && al[c] < 0.12 && al[e] < 0.12) continue;
      fi.push(a, c, b, b, c, e);                                   // ön yüzey (x aynalı → sarım ters)
      const o = NW * NH; bi.push(a + o, b + o, c + o, b + o, e + o, c + o);
    }
    // göğüs yüzgeci: gövdenin %20'sinde, karın tarafı; dokudaki uzunluk piksel → dünya
    const P = (sp.bodyLen * 0.2 + 8) / TW, fx = (0.5 - P) * ASP, fy = 0.5 - (sp.MID + sp.H * 0.5) / TH, fr = sp.bodyLen * 0.09 * sp.pec / TH;
    const fv = [], seg = 20, ang = Math.PI - 0.55; fv.push(0, 0, 0, 0, 0, 0, 0, 0);
    for (let q = 0; q <= seg; q++) { const th = (q / seg) * Math.PI * 2, lx = fr * 0.8 + Math.cos(th) * fr, ly = Math.sin(th) * fr * 0.42; const rx = lx * Math.cos(ang) - ly * Math.sin(ang), ry = lx * Math.sin(ang) + ly * Math.cos(ang); const mx = rx, my = -ry; fv.push(mx, my, 0, 0, 0, 1, 0, Math.hypot(mx, my)); }
    const fidx = []; for (let q = 1; q <= seg; q++) fidx.push(0, q, q + 1);
    // dokudaki göğüs yüzgeci boyutu: yüzgeç gövdeye değer; z başlangıcı yüzey kalınlığı
    const gi = Math.round(Math.min(NW - 1, Math.max(0, (0.5 - fx / ASP) * GW))), gj = Math.round(Math.min(NH - 1, Math.max(0, (0.5 - fy) * GH))), zb = Math.max(0.01, z[gj * NW + gi]);
    return (sp.m3 = { V, front: new Uint16Array(fi), back: new Uint16Array(bi), fin: new Float32Array(fv), finIdx: new Uint16Array(fidx), base: [fx, fy, zb], ASP, nIdx: fi.length });
  },

  /** Portre için 3D görünüm kur (WebGL yoksa null). */
  attach(pt) {
    if (!this.enabled() || pt.p.def.kind !== 'fish') return null;
    try { return new Fish3DView(pt); } catch (e) { console.warn('3D başlatılamadı', e); this._ok = false; return null; }
  },
};

class Fish3DView {
  constructor(pt) {
    Fish3D.cur = this; this.pt = pt; this.cr = pt.cr; const cv = pt.cv, par = cv.parentElement; if (getComputedStyle(par).position === 'static') par.style.position = 'relative';
    this.cv = document.createElement('canvas'); this.cv.className = 'f3-cv'; par.append(this.cv); this.par = par; this.place();
    const gl = this.gl = this.cv.getContext('webgl', { alpha: true, antialias: true, premultipliedAlpha: true }) || this.cv.getContext('experimental-webgl'); if (!gl) throw new Error('webgl yok');
    const sh = (t, s) => { const o = gl.createShader(t); gl.shaderSource(o, s); gl.compileShader(o); if (!gl.getShaderParameter(o, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(o)); return o; };
    const pr = this.pr = gl.createProgram(); gl.attachShader(pr, sh(gl.VERTEX_SHADER, F3_VS)); gl.attachShader(pr, sh(gl.FRAGMENT_SHADER, F3_FS)); gl.linkProgram(pr); if (!gl.getProgramParameter(pr, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(pr));
    this.U = {}; for (const n of ['uProj', 'uView', 'uModel', 'uNrmM', 'uOmega', 'uK', 'uAmp', 'uBend', 'uHead', 'uLen', 'uGravid', 'uFlap', 'uSide', 'uMode', 'uBase', 'uTex', 'uGlow', 'uPass', 'uHasGlow', 'uT', 'uDim', 'uSick', 'uSeed', 'uCam', 'uFinCol']) this.U[n] = gl.getUniformLocation(pr, n);
    this.A = { aPos: gl.getAttribLocation(pr, 'aPos'), aNrm: gl.getAttribLocation(pr, 'aNrm'), aUV: gl.getAttribLocation(pr, 'aUV'), aFin: gl.getAttribLocation(pr, 'aFin') };
    this.cv.addEventListener('webglcontextlost', (e) => { e.preventDefault(); this.dispose(); this.pt.f3 = null; });
    this.upload(); this.ui(); this.bindInput();
    // kamera + poz durumu
    this.yaw = 0.55; this.pitch = 0.14; this.zoom = 1; this.view = 'free'; this.userT = -99; this.t = 0; this.phase = 0; this.pf = 0;
    this.pose = 'glide'; this.poseT = 0; this.nextIdle = 3; this.hdg = 0; this.hdgT = 0;
    this.cur = { amp: 0.5, freq: 1.4, bend: 0, k: 5.4, flap: 0.3, pitch: 0, dim: 1 };
  }
  place() { const c = this.pt.cv, s = this.cv.style; s.position = 'absolute'; s.left = c.offsetLeft + 'px'; s.top = c.offsetTop + 'px'; s.width = c.clientWidth + 'px'; s.height = c.clientHeight + 'px'; s.touchAction = 'none'; s.cursor = 'grab'; const dpr = Math.min(window.devicePixelRatio || 1, 2); this.cv.width = Math.max(2, Math.round(c.clientWidth * dpr)); this.cv.height = Math.max(2, Math.round(c.clientHeight * dpr)); }
  upload() {
    const gl = this.gl, sp = FishArt.sprite(this.pt.p), m = this.m = Fish3D.mesh(sp), mk = (type, data) => { const b = gl.createBuffer(); gl.bindBuffer(type, b); gl.bufferData(type, data, gl.STATIC_DRAW); return b; };
    this.sp = sp; this.vb = mk(gl.ARRAY_BUFFER, m.V); this.ibF = mk(gl.ELEMENT_ARRAY_BUFFER, m.front); this.ibB = mk(gl.ELEMENT_ARRAY_BUFFER, m.back); this.fvb = mk(gl.ARRAY_BUFFER, m.fin); this.fib = mk(gl.ELEMENT_ARRAY_BUFFER, m.finIdx);
    const tex = (cvs) => { const t = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, t); gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false); gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, cvs); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE); return t; };
    this.tex = tex(sp.tex); this.glowTex = sp.glow ? tex(sp.glow) : this.tex; this.key = sp.key;
    // yüzgeç rengi: kuyruk rengi varsa onun tonu, yoksa soluk beyaz-mavi
    const ph = this.pt.p.pheno, tc = (ph.tcol) || TAILCOL[ph.tailColor] || null; this.finCol = tc && tc.h !== undefined ? this.hsl(tc.h, Math.min(0.55, (tc.s || 30) / 100), 0.78) : [0.9, 0.96, 1.0];
  }
  hsl(h, s, l) { const f = (n) => { const k = (n + h / 30) % 12, a = s * Math.min(l, 1 - l); return l - a * Math.max(-1, Math.min(k - 3, 9 - k, 1)); }; return [f(0), f(8), f(4)]; }

  /* ---------- Arayüz: görünüm + poz düğmeleri, 2D'ye geçiş ---------- */
  ui() {
    const mk = (t, fn, title) => h('button.f3-btn', { type: 'button', title, onclick: (e) => { e.stopPropagation(); fn(); } }, t);
    this.bar = h('div.f3-bar', null,
      h('div.f3-row', null, mk('Yan', () => this.setView('side')), mk('Üst', () => this.setView('top')), mk('Ön', () => this.setView('front')), mk('↻', () => this.setView('free'), 'Serbest'), mk('2D', () => this.off(), '2D görünüme dön')),
      h('div.f3-row.f3-poses', null, mk('🐟', () => this.setPose('glide'), 'Süzül'), mk('🍽', () => this.setPose('feed'), 'Yem'), mk('💞', () => this.setPose('court'), 'Kur yap'), mk('😱', () => this.setPose('startle'), 'Ürk'), mk('😴', () => this.setPose('rest'), 'Uyu')));
    this.par.append(this.bar); this.bar.style.left = this.cv.style.left; this.bar.style.width = this.cv.style.width; this.bar.style.top = (this.pt.cv.offsetTop + this.pt.cv.clientHeight) + 'px';
  }
  off() { const S = Game.S; if (S) { S.settings.fx3d = false; Game.save(); } this.dispose(); this.pt.f3 = null; UI.toast('3D görünüm kapatıldı (Ayarlar > Görünüm)', 'check', 2200); }
  setView(v) { this.view = v; this.userT = -99; if (v === 'side') { this.ty = 0; this.tp = 0; } else if (v === 'top') { this.ty = 0; this.tp = 1.4; } else if (v === 'front') { this.ty = -1.5; this.tp = 0.05; } }
  setPose(p) { this.pose = p; this.poseT = 0; if (p === 'turn') { this.hdgT = 0; } }
  bindInput() {
    const cv = this.cv, ptrs = new Map(); let pd = 0;
    cv.addEventListener('pointerdown', (e) => { cv.setPointerCapture(e.pointerId); ptrs.set(e.pointerId, [e.clientX, e.clientY]); cv.style.cursor = 'grabbing'; if (ptrs.size === 2) { const [a, b] = [...ptrs.values()]; pd = Math.hypot(a[0] - b[0], a[1] - b[1]); } });
    cv.addEventListener('pointermove', (e) => {
      const q = ptrs.get(e.pointerId); if (!q) return; const dx = e.clientX - q[0], dy = e.clientY - q[1]; ptrs.set(e.pointerId, [e.clientX, e.clientY]);
      if (ptrs.size === 2) { const [a, b] = [...ptrs.values()], dd = Math.hypot(a[0] - b[0], a[1] - b[1]); if (pd) this.zoom = clamp(this.zoom * dd / pd, 0.6, 3); pd = dd; return; }
      this.yaw += dx * 0.009; this.pitch = clamp(this.pitch + dy * 0.009, -1.45, 1.45); this.userT = this.t; this.view = 'free'; this.ty = this.tp = null;
    });
    const up = (e) => { ptrs.delete(e.pointerId); cv.style.cursor = 'grab'; pd = 0; }; cv.addEventListener('pointerup', up); cv.addEventListener('pointercancel', up);
    cv.addEventListener('wheel', (e) => { e.preventDefault(); this.zoom = clamp(this.zoom * Math.exp(-e.deltaY * 0.0015), 0.6, 3); }, { passive: false });
    cv.addEventListener('dblclick', () => { this.yaw = 0.55; this.pitch = 0.14; this.zoom = 1; this.view = 'free'; this.userT = -99; });
  }

  /* ---------- Poz makinesi ---------- */
  params(dt) {
    const t = this.t, c = this.cr, pose = this.pose, lazy = (c.dis ? 0.6 : 1) * (c.preg ? 0.85 : 1);
    this.poseT += dt; if (this.pose !== 'glide' && this.pose !== 'rest' && this.poseT > ({ feed: 3.2, court: 4.5, startle: 1.4, turn: 2.2, hover: 3 }[this.pose] || 3)) { this.pose = 'glide'; this.poseT = 0; }
    if (this.pose === 'glide' && this.poseT > this.nextIdle) { const r = Math.random(); this.pose = r < 0.18 ? 'hover' : r < 0.32 ? 'turn' : 'glide'; this.poseT = 0; this.nextIdle = 3.5 + Math.random() * 5; if (this.pose === 'turn') this.hdgT = 0; }
    let T;
    const burst = Math.max(0, Math.min(1, (Math.sin(t * 0.85) + 0.15) * 1.6)); // "vur ve kay" ritmi
    switch (this.pose) {
      case 'hover': T = { amp: 0.16, freq: 0.6, bend: 0, k: 5, flap: 0.55 + 0.25 * Math.sin(t * 18), pitch: 0, dim: 1 }; break;
      case 'turn': { const p = Math.min(1, this.poseT / 2.2), b = Math.sin(p * Math.PI); T = { amp: 0.5, freq: 1.8, bend: 0.32 * b, k: 5.4, flap: 0.3, pitch: 0, dim: 1 }; this.hdgT = p; break; }
      case 'feed': { const p = this.poseT / 3.2, lunge = p < 0.45 ? Math.sin(p / 0.45 * Math.PI) : 0; T = { amp: 0.55 + 0.7 * lunge, freq: 1.8 + 2.8 * lunge, bend: 0, k: 5.4, flap: 0.45, pitch: -0.45 * lunge + 0.12 * Math.sin(p * 12) * (p > 0.45 && p < 0.8 ? 1 : 0), dim: 1 }; break; }
      case 'court': T = { amp: 0.42, freq: 5.2, bend: 0.1 * Math.sin(t * 3), k: 9.5, flap: 0.7, pitch: 0.06 * Math.sin(t * 5), dim: 1 }; break;
      case 'startle': { const p = Math.min(1, this.poseT / 1.4), f = 1 - p; T = { amp: 1.05 * f + 0.4, freq: 7 * f + 1.4, bend: 0.5 * f * Math.sin(this.poseT * 18), k: 5.4, flap: 0.9 * f + 0.2, pitch: 0.2 * f, dim: 1 }; break; }
      case 'rest': T = { amp: 0.07, freq: 0.3, bend: 0, k: 5, flap: 0.12, pitch: 0.18, dim: 0.78 }; break;
      default: T = { amp: (0.18 + 0.5 * burst) * lazy, freq: (0.9 + 1.1 * burst) * lazy, bend: 0, k: 5.4, flap: 0.25 + 0.14 * Math.sin(t * 5), pitch: 0, dim: 1 };
    }
    const k = 1 - Math.exp(-dt * 5), cur = this.cur; for (const n in T) cur[n] += (T[n] - cur[n]) * k;
    this.phase += dt * cur.freq * Math.PI * 2; this.pf += dt * ({ hover: 22, court: 26, startle: 30, rest: 3 }[this.pose] || 8);
  }

  /* ---------- Kare ---------- */
  frame(dt) {
    const gl = this.gl; if (!gl || gl.isContextLost()) return; this.t += dt;
    const pt = this.pt, c = pt.cv; if (this.cv.clientWidth !== c.clientWidth || this.cv.clientHeight !== c.clientHeight) this.place();
    if (this.sp !== FishArt.sprite(pt.p) || this.sp.key !== this.key) this.upload();
    this.params(dt);
    // kamera: hedef görünümlere yumuşak geçiş; serbestte hafif kendiliğinden salınım
    if (this.ty != null) { this.yaw += (this.ty - this.yaw) * (1 - Math.exp(-dt * 5)); this.pitch += (this.tp - this.pitch) * (1 - Math.exp(-dt * 5)); }
    else if (this.t - this.userT > 4) { const ty = 0.55 + 0.4 * Math.sin(this.t * 0.22), tp = 0.14 + 0.06 * Math.sin(this.t * 0.31); this.yaw += (ty - this.yaw) * (1 - Math.exp(-dt * 0.8)); this.pitch += (tp - this.pitch) * (1 - Math.exp(-dt * 0.8)); }
    const dpr = this.cv.width / Math.max(1, this.cv.clientWidth), W = this.cv.width, Hh = this.cv.height, asp = W / Hh, fov = 0.52, ASP = this.m.ASP;
    gl.viewport(0, 0, W, Hh); gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT); gl.enable(gl.DEPTH_TEST); gl.depthFunc(gl.LEQUAL); gl.useProgram(this.pr);
    const dist = Math.max(ASP * 1.32 / asp, 1.7) / (2 * Math.tan(fov / 2)) / this.zoom, hdg = this.hdgOffset();
    const model = M4.mul(M4.rotX(this.pitch), M4.mul(M4.rotY(this.yaw + hdg), M4.mul(M4.rotZ(this.cur.pitch), M4.trans(0, 0, 0))));
    const U = this.U, camZ = dist; gl.uniformMatrix4fv(U.uProj, false, M4.persp(fov, asp, 0.1, 40)); gl.uniformMatrix4fv(U.uView, false, M4.trans(0, 0, -dist)); gl.uniformMatrix4fv(U.uModel, false, model); gl.uniformMatrix3fv(U.uNrmM, false, M4.nrm(model));
    const cur = this.cur, gravid = this.cr.preg ? clamp((this.cr.now - this.cr.preg.start) / (this.cr.preg.due - this.cr.preg.start), 0, 1) : 0, dis = this.cr.dis;
    gl.uniform1f(U.uOmega, this.phase); gl.uniform1f(U.uK, cur.k); gl.uniform1f(U.uAmp, cur.amp); gl.uniform1f(U.uBend, cur.bend + (this.cr.defect ? 0.18 * (this.cr.id % 2 ? 1 : -1) : 0)); gl.uniform1f(U.uHead, ASP / 2); gl.uniform1f(U.uLen, ASP); gl.uniform1f(U.uGravid, gravid);
    gl.uniform1f(U.uT, this.t); gl.uniform1f(U.uDim, cur.dim); gl.uniform1f(U.uSick, dis && dis.id === 'ich' ? clamp(dis.sev, 0.1, 1) : 0); gl.uniform1f(U.uSeed, this.cr.seed % 97); gl.uniform3f(U.uCam, 0, 0, camZ); gl.uniform1f(U.uHasGlow, this.sp.glow ? 1 : 0); gl.uniform3fv(U.uFinCol, this.finCol); gl.uniform3fv(U.uBase, this.m.base);
    const fa = this.A, st = 32, bindBody = (ib) => { gl.bindBuffer(gl.ARRAY_BUFFER, this.vb); gl.enableVertexAttribArray(fa.aPos); gl.vertexAttribPointer(fa.aPos, 3, gl.FLOAT, false, st, 0); gl.enableVertexAttribArray(fa.aNrm); gl.vertexAttribPointer(fa.aNrm, 3, gl.FLOAT, false, st, 12); gl.enableVertexAttribArray(fa.aUV); gl.vertexAttribPointer(fa.aUV, 2, gl.FLOAT, false, st, 24); gl.disableVertexAttribArray(fa.aFin); gl.vertexAttrib1f(fa.aFin, 0); gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ib); };
    gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, this.tex); gl.uniform1i(U.uTex, 0); gl.activeTexture(gl.TEXTURE1); gl.bindTexture(gl.TEXTURE_2D, this.glowTex); gl.uniform1i(U.uGlow, 1);
    // geçiş 0: opak gövde (iki yüzey)
    gl.disable(gl.BLEND); gl.depthMask(true); gl.uniform1f(U.uMode, 0); gl.uniform1f(U.uPass, 0);
    bindBody(this.ibF); gl.drawElements(gl.TRIANGLES, this.m.front.length, gl.UNSIGNED_SHORT, 0); bindBody(this.ibB); gl.drawElements(gl.TRIANGLES, this.m.back.length, gl.UNSIGNED_SHORT, 0);
    // geçiş 1: yarı saydam yüzgeç/kuyruk (kameraya bakan yüzey) + göğüs yüzgeçleri
    gl.enable(gl.BLEND); gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA); gl.depthMask(false);
    const camSide = model[10] >= 0 ? 'f' : 'b';       // kamera modelin +z tarafında mı
    gl.uniform1f(U.uPass, 1); bindBody(camSide === 'f' ? this.ibF : this.ibB); gl.drawElements(gl.TRIANGLES, (camSide === 'f' ? this.m.front : this.m.back).length, gl.UNSIGNED_SHORT, 0);
    gl.uniform1f(U.uMode, 1); gl.bindBuffer(gl.ARRAY_BUFFER, this.fvb); gl.enableVertexAttribArray(fa.aPos); gl.vertexAttribPointer(fa.aPos, 3, gl.FLOAT, false, st, 0); gl.enableVertexAttribArray(fa.aNrm); gl.vertexAttribPointer(fa.aNrm, 3, gl.FLOAT, false, st, 12); gl.enableVertexAttribArray(fa.aUV); gl.vertexAttribPointer(fa.aUV, 2, gl.FLOAT, false, st, 24); gl.disableVertexAttribArray(fa.aUV); gl.enableVertexAttribArray(fa.aFin); gl.vertexAttribPointer(fa.aFin, 1, gl.FLOAT, false, st, 28); gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.fib);
    for (const side of [1, -1]) { gl.uniform1f(U.uSide, side); gl.uniform1f(U.uFlap, cur.flap + 0.3 * Math.sin(this.pf + (side > 0 ? 0 : 0.5))); gl.drawElements(gl.TRIANGLES, this.m.finIdx.length, gl.UNSIGNED_SHORT, 0); }
    gl.depthMask(true);
  }
  hdgOffset() { if (this.pose !== 'turn') { this.hdgCur = (this.hdgCur || 0) * 0.9; return this.hdgCur; } const p = Math.min(1, this.poseT / 2.2); this.hdgCur = 0.9 * Math.sin(p * Math.PI); return this.hdgCur; }
  dispose() {
    const gl = this.gl; try { if (gl) { const ext = gl.getExtension('WEBGL_lose_context'); ext && ext.loseContext(); } } catch (e) { /* yoksay */ }
    this.cv.remove(); this.bar && this.bar.remove(); this.gl = null;
  }
}

/* ---------- Portrait entegrasyonu ---------- */
(function hookPortrait() {
  const start = Portrait.prototype.start, stop = Portrait.prototype.stop, draw = Portrait.prototype.draw;
  Portrait.prototype.start = function () { if (this.f3 === undefined && !this.noF3) this.f3 = Fish3D.attach(this) || null; return start.apply(this, arguments); };
  Portrait.prototype.stop = function () { if (this.f3) { this.f3.dispose(); this.f3 = undefined; } return stop.apply(this, arguments); };
  Portrait.prototype.draw = function (dt) {
    if (!this.f3) return draw.apply(this, arguments);
    drawBackdropOnly.call(this, dt); this.f3.frame(dt);          // arka plan 2D kalır; balık 3D tuvalinde
  };
  const setZoom = Portrait.prototype.setZoom; Portrait.prototype.setZoom = function (z) { if (this.f3) this.f3.zoom = clamp(z, 0.6, 3); return setZoom.apply(this, arguments); };
  /** Portrait.draw'un arka plan kısmı (gradyan, ışık hüzmeleri, zemin, kabarcıklar). */
  function drawBackdropOnly(dt) {
    const ctx = this.cv.getContext('2d'), cw = this.cw, ch = this.ch, dpr = this.dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0); const g = ctx.createLinearGradient(0, 0, 0, ch); g.addColorStop(0, '#3fc4cf'); g.addColorStop(0.55, '#14708f'); g.addColorStop(1, '#073a55'); ctx.fillStyle = g; ctx.fillRect(0, 0, cw, ch);
    for (let i = 0; i < 4; i++) { const x = cw * (0.15 + i * 0.25) + Math.sin(this.t * 0.3 + i) * 14, rg = ctx.createLinearGradient(0, 0, 0, ch); rg.addColorStop(0, 'rgba(220,255,250,.16)'); rg.addColorStop(1, 'rgba(220,255,250,0)'); ctx.fillStyle = rg; ctx.beginPath(); ctx.moveTo(x - 14, 0); ctx.lineTo(x + 14, 0); ctx.lineTo(x + 58, ch); ctx.lineTo(x - 58, ch); ctx.closePath(); ctx.fill(); }
    ctx.fillStyle = 'rgba(210,190,140,.5)'; ctx.beginPath(); ctx.moveTo(0, ch); for (let x = 0; x <= cw; x += 12) ctx.lineTo(x, ch * 0.9 + Math.sin(x * 0.03) * 4); ctx.lineTo(cw, ch); ctx.fill();
    for (const b of this.bub) { b.y -= b.v * dt; if (b.y < -0.05) { b.y = 1.05; b.x = R.next(); } ctx.strokeStyle = 'rgba(230,255,255,.5)'; ctx.beginPath(); ctx.arc(b.x * cw + Math.sin(this.t * 2 + b.x * 9) * 4, b.y * ch, b.r, 0, TAU); ctx.stroke(); }
  }
})();

/* Ayarlar > Görünüm: 3D balık anahtarı */
UI.render_settings = ((orig) => function (el) {
  const r = orig.apply(this, arguments), card = [...el.querySelectorAll('.card')].find((c) => /Görünüm/.test((c.querySelector('h3') || {}).textContent || '')), S = Game.S;
  if (card && Fish3D.supported()) { const on = S.settings.fx3d !== false; card.append(h('div.set-row', null, h('label', null, '3D balık görünümü (kart, laboratuvar, ansiklopedi)'), h('button.switch' + (on ? '.on' : ''), { role: 'switch', 'aria-checked': String(on), onclick: () => { S.settings.fx3d = !on; Game.save(); UI.render_settings(el); } }))); }
  return r;
})(UI.render_settings);
