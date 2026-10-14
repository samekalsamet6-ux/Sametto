'use strict';
/* =====================================================================
   04 · CANLI + YÜZME SİMÜLASYONU
   Creature : kalıcı veri (genom, isim, yaş…) + türetilmiş fenotip
   Swimmer  : omurga dalgası, durum makinesi (süzülme / duruş / yeme / kur /
              ürkme / dinlenme), sürü davranışı, ikincil (yaylı) kuyruk hareketi
   ===================================================================== */

let _nextId = 1;
const newId = () => _nextId++;

class Creature {
  constructor(d) {
    this.id = d.id || newId(); if (this.id >= _nextId) _nextId = this.id + 1;
    this.species = 'guppy';
    this.genome = d.genome;
    this.name = d.name || (d.genome.sex === 'F' ? R.pick(NAMES_F) : R.pick(NAMES_M));
    this.bornT = d.bornT ?? 0;                    // oyun dakikası
    this.seed = d.seed || ((R.next() * 2 ** 31) >>> 0);
    this.fav = !!d.fav; this.tested = !!d.tested;
    this.sire = d.sire || 0; this.dam = d.dam || 0;
    this.pers = d.pers || { activity: R.float(0.25, 1), bold: R.float(0.1, 1), curious: R.float(0.1, 1), social: R.float(0.2, 1) };
    this.x = d.x; this.y = d.y;
    this.stress = 0;
    this.preg = d.preg || null;                   // {start, due} gebelik (dakika)
    this.sperm = d.sperm || [];                   // depolanan sperm: [{sire, name, g, left}]
    this.lastBirth = d.lastBirth ?? -1e9; this.defect = !!d.defect; this.unrevealed = !!d.unrevealed;
    this.pheno = Genetics.phenotype(this.genome);
    this.sprite = null; this.sw = new Swimmer(this);
    this.now = 0;                                 // son bilinen oyun dakikası (yaş için)
  }
  get sex() { return this.genome.sex; }
  ageDays(now = this.now) { return Math.max(0, (now - this.bornT) / 1440); }
  /** Yavru→yetişkin büyüme (0.34 → 1). */
  growth(now = this.now) { return 0.34 + 0.66 * smoothstep(0, 42, this.ageDays(now)); }
  /** Erkekte renk olgunluğu: günler içinde yavaşça "açılır". */
  maturity(now = this.now) { return this.sex === 'M' ? smoothstep(14, 70, this.ageDays(now)) : 1; }
  stage(now = this.now) { const a = this.ageDays(now); return a < 10 ? 'Yavru' : a < 42 ? 'Genç' : 'Yetişkin'; }
  /** Dünya birimi cinsinden gövde uzunluğu. */
  /** Akrabalı yetiştirme katsayısı (soyağacı değişmediği için bir kez hesaplanır). */
  get F() { return this._F ?? (this._F = Pedigree.F(this.id)); }
  bodyLen() { return 58 * this.pheno.size * this.growth() * (this.sex === 'F' ? 1.2 : 0.86) * (1 - 0.3 * this.F); }
  adult(now = this.now) { return this.ageDays(now) >= MATURE_DAYS; }
  breed() { return Genetics.breedOf(this.pheno); }
  rarity() { return this.breed().rarity; }
  inbreeding() { return this.F; }
  health() { return Genetics.health(this.genome, this.inbreeding()) * (this.defect ? 0.6 : 1); }
  value() {
    const r = RARITY[this.rarity()].value * (this.defect ? 0.4 : 1), size = 0.6 + 0.4 * this.growth();
    const stageMul = this.ageDays() < 10 ? 0.4 : 1;
    return Math.max(5, Math.round(r * size * stageMul * clamp(this.health(), 0.5, 1.15) * (this.fav ? 1 : 1)));
  }
  toJSON() {
    return { id: this.id, name: this.name, genome: this.genome, bornT: this.bornT, seed: this.seed, fav: this.fav, tested: this.tested, sire: this.sire, dam: this.dam, pers: this.pers, preg: this.preg, sperm: this.sperm, lastBirth: this.lastBirth, defect: this.defect, unrevealed: this.unrevealed, x: Math.round(this.sw.x), y: Math.round(this.sw.y) };
  }
}

const J = FishArt.J;

class Swimmer {
  constructor(c) {
    this.c = c; const p = c.pers;
    this.x = c.x ?? 300; this.y = c.y ?? 300; this.heading = R.float(-0.5, 0.5) + (R.chance(0.5) ? 0 : Math.PI);
    this.speed = 0; this.turn = 0; this.z = R.next(); this.zT = R.float(0, 1000);
    this.flip = 1; this.state = 'glide'; this.stateT = 0; this.t = R.float(0, 100); this.phase = R.float(0, TAU);
    this.freq = 1; this.amp = 0.5; this.bend = 0; this.mouthT = 0; this.pf = R.float(0, TAU); this.pfRate = 3;
    this.tx = this.x; this.ty = this.y; this.targetT = 0; this.seed = R.float(0, 500);
    this.joints = new Array(J).fill(0); this.jv = new Array(J).fill(0);
    this.court = 0; this.courtWith = null; this.startleT = 0; this.eaten = 0; this.foodSeen = -1;
    this.targetAmp = 0.5; this.courtAmp = 0;
    this.speedMul = lerp(0.8, 1.2, p.activity);
    this.bendBase = c.defect ? 0.5 * (c.id % 2 ? 1 : -1) : 0;   // omurga kusuru: kalıcı eğrilik
  }

  /** Portre/kart modu: yerinde, sakin yüzüş (yüzgeçler çalışır, gövde hafifçe dalgalanır, dönüş yok). */
  updateCalm(dt) {
    this.t += dt; const g = 0.5 + 0.5 * noise1(this.t * 0.4 + this.seed);
    this.heading = damp(this.heading, 0.06 * noise1(this.t * 0.35 + this.seed), 2, dt); this.flipTarget = 1; this.flip = damp(this.flip, 1, 6, dt);
    this.freq = damp(this.freq, 0.9 + 0.5 * g, 2, dt); this.amp = damp(this.amp, 0.38 + 0.3 * g, 2, dt); this.phase += TAU * this.freq * dt;
    this.bend = damp(this.bend, 0.12 * noise1(this.t * 0.3 + this.seed), 2, dt);
    this.pfRate = damp(this.pfRate, 4 + 2 * g, 3, dt); this.pf += this.pfRate * dt; this.courtAmp = 0; this.mouthT = Math.max(0, this.mouthT - dt);
    this.updateJoints(dt);
  }

  /** Dünya sınırı ve komşular: env = {W,H,top,bottom,food,others,night,time,calm,onEat} */
  update(dt, env) {
    if (env.calm) return this.updateCalm(Math.min(dt, 0.05));
    const c = this.c, p = c.pers, L = c.bodyLen(); dt = Math.min(dt, 0.05);
    this.t += dt; this.stateT += dt; this.mouthT = Math.max(0, this.mouthT - dt); this.startleT = Math.max(0, this.startleT - dt);
    const margin = env.margin ?? (L * 1.1 + 18), top = env.top ?? 40, bottom = env.bottom ?? env.H - 70;
    c.stress = Math.max(0, c.stress - dt * 0.05);

    /* ---------- 1) Durum seçimi ---------- */
    let st = this.state;
    const wantRest = env.night > 0.62 && !env.calm;
    const food = env.food && env.food.length ? env.food : null;
    if (this.startleT > 0) st = 'startle';
    else if (food && !env.calm && (env.foodAge > (1 - p.bold) * 2.2) && this.eaten < 3) st = 'feed';
    else if (wantRest) st = 'rest';
    else if (st === 'startle' || st === 'feed' || st === 'rest') st = 'glide';
    if (st === 'glide' && this.court > 0) { this.court -= dt; st = this.court > 0 ? 'court' : 'glide'; }
    else if (st === 'court') st = 'glide';
    // kur yapma: olgun erkek, yakında dişi
    if (st === 'glide' && c.sex === 'M' && c.growth() > 0.9 && !env.calm && this.stateT > 2 && R.next() < dt * 0.02 * p.activity) {
      const f = env.others.find((o) => o !== c && o.sex === 'F' && o.growth() > 0.9 && Math.hypot(o.sw.x - this.x, o.sw.y - this.y) < 260);
      if (f) { this.court = R.float(4, 7); this.courtWith = f; st = 'court'; }
    }
    // dinlenmekten uyanınca / glide içinde ara ara duruş
    if (st === 'glide' && !env.calm && this.stateT > 3 && R.next() < dt * 0.05 * (1.15 - p.activity)) st = 'hover';
    if (this.state === 'hover' && st === 'hover' && this.stateT > R.float(2.5, 6) ) st = 'glide';
    if (st !== this.state) { this.state = st; this.stateT = 0; this.targetT = 0; }

    /* ---------- 2) Hedef ve yönlendirme ---------- */
    let spdMul = 0.55, ampT = 0.7, wantTx = this.tx, wantTy = this.ty, steer = 1;
    if (this.targetT <= 0 || Math.hypot(this.tx - this.x, this.ty - this.y) < (env.calm ? L * 0.25 : L * 0.7)) {
      this.targetT = R.float(3, 7);
      const dir = env.calm ? (this.x < env.W / 2 ? 1 : -1) : R.chance(0.7) && Math.abs(Math.cos(this.heading)) > 0.3 ? Math.sign(Math.cos(this.heading)) : (R.chance(0.5) ? -1 : 1);
      const cx = env.calm ? env.W / 2 : this.x;
      this.tx = env.calm ? env.W / 2 + dir * env.W * 0.07 : clamp(cx + dir * R.float(160, 420), margin, env.W - margin);
      this.ty = env.calm ? env.H * 0.46 : clamp(this.y + R.float(-130, 130), top + margin * 0.5, bottom - 10);
    }
    this.targetT -= dt;
    let pecFlap = 3.2;
    switch (st) {
      case 'glide': {
        const gate = smoothstep(-0.25, 0.45, noise1(this.t * 0.5 + this.seed));
        this.gate = gate; spdMul = (0.32 + 0.7 * gate) * 0.62 * this.speedMul; ampT = 0.45 + 0.55 * gate; break;
      }
      case 'hover': spdMul = 0.03; ampT = 0.2; pecFlap = 8; steer = 0.15; this.gate = 0.2; break;
      case 'feed': {
        const f = this.nearestFood(env.food);
        if (f) {
          this.tx = f.x; this.ty = f.y; spdMul = 1.35; ampT = 0.9; pecFlap = 7;
          const d = Math.hypot(f.x - this.x, f.y - this.y);
          if (d < L * 0.42) { f.eaten = true; this.eaten++; this.mouthT = 0.35; this.speed *= 0.1; c.stress = Math.max(0, c.stress - 0.1); env.onEat && env.onEat(c, f); }
          else if (d < L * 1.6) spdMul = Math.max(0.35, d / (L * 1.6) * 1.2);
        } else { spdMul = 0.2; ampT = 0.3; }
        break;
      }
      case 'startle': spdMul = 3.2 * (this.startleT / 0.7 + 0.15); ampT = 1.15; pecFlap = 10; break;
      case 'rest':
        spdMul = 0.04; ampT = 0.12; pecFlap = 1.2; steer = 0.2;
        if (this.stateT < 0.1 || this.targetT <= 0) { this.ty = bottom - R.float(8, 40); this.tx = clamp(this.x + R.float(-60, 60), margin, env.W - margin); this.targetT = R.float(8, 15); }
        break;
      case 'court': {
        const f = this.courtWith;
        if (f && f.sw) { this.tx = f.sw.x - Math.cos(f.sw.heading) * L * 0.2; this.ty = f.sw.y - L * 0.45; }
        const d = f ? Math.hypot(this.tx - this.x, this.ty - this.y) : 99;
        spdMul = d < L ? 0.35 : 0.9; ampT = 0.8; pecFlap = 6; break;
      }
    }

    if (env.calm) spdMul *= 0.4;

    /* ---------- 3) Sürü kuralları (ayrılma / yapışma / hizalanma) ---------- */
    let sx = 0, sy = 0, cx = 0, cy = 0, ax = 0, ay = 0, nCoh = 0;
    for (const o of env.others) {
      if (o === c) continue; const s = o.sw, dx = s.x - this.x, dy = s.y - this.y, d2 = dx * dx + dy * dy, d = Math.sqrt(d2) || 1;
      const sep = L * 0.9 + o.bodyLen() * 0.4;
      if (d < sep) { const w = (sep - d) / sep; sx -= (dx / d) * w; sy -= (dy / d) * w; }
      if (d < 260 && st === 'glide') { cx += s.x; cy += s.y; ax += Math.cos(s.heading); ay += Math.sin(s.heading); nCoh++; }
    }
    const dd = wantDir(this.tx - this.x, this.ty - this.y);
    let dvx = dd.x, dvy = dd.y;
    dvx += sx * 1.6; dvy += sy * 1.6;
    if (nCoh && st === 'glide') {
      const k = 0.22 * p.social; const m = Math.hypot(cx / nCoh - this.x, cy / nCoh - this.y) || 1;
      dvx += ((cx / nCoh - this.x) / m) * k + (ax / nCoh) * 0.18 * p.social; dvy += ((cy / nCoh - this.y) / m) * k + (ay / nCoh) * 0.18 * p.social;
    }
    // duvarlardan kavisle uzaklaş (ileri bakışlı)
    const lx = this.x + Math.cos(this.heading) * L * 2.2, ly = this.y + Math.sin(this.heading) * L * 2.2;
    if (!env.calm) {
      if (lx < margin) dvx += (margin - lx) / margin * 2.2; if (lx > env.W - margin) dvx -= (lx - (env.W - margin)) / margin * 2.2;
      if (ly < top + margin * 0.4) dvy += 1.6; if (ly > bottom) dvy -= 1.6;
    }
    if (st === 'glide' || st === 'hover') dvy *= env.calm ? 0.2 : 0.7;   // dikey eğimi sınırla: yatay yüzüş doğal
    let hd = Math.atan2(dvy, dvx);
    if (st !== 'startle') { // balıklar çoğunlukla yatay yüzer: eğimi sınırla (yüz değiştirirken histerezis)
      const cf = Math.cos(this.heading) >= 0 ? 0 : Math.PI, face = Math.abs(Math.cos(hd)) > 0.3 ? (Math.cos(hd) >= 0 ? 0 : Math.PI) : cf;
      hd = face + clamp(angDiff(face, hd), st === 'feed' ? -1.15 : -0.62, st === 'feed' ? 1.15 : 0.62);
    }
    const err = angDiff(this.heading, hd);
    const maxTurn = st === 'startle' ? 7 : st === 'feed' ? 3.2 : 1.7;
    const wantTurn = clamp(err * 2.4 * steer, -maxTurn, maxTurn);
    this.turn = damp(this.turn, wantTurn, st === 'startle' ? 12 : 3.5, dt);
    this.heading += this.turn * dt;
    if (this.heading > Math.PI) this.heading -= TAU; else if (this.heading < -Math.PI) this.heading += TAU;

    /* ---------- 4) Hız ---------- */
    let vTarget = spdMul * L * (1 - 0.65 * smoothstep(0.6, 2.4, Math.abs(err)));   // keskin dönüşte yavaşla
    if (st === 'startle' && this.startleT > 0.68) this.speed = Math.max(this.speed, spdMul * L * 0.9);
    this.speed = damp(this.speed, vTarget, st === 'startle' ? 9 : 1.6, dt);
    const vx = Math.cos(this.heading) * this.speed, vy = Math.sin(this.heading) * this.speed;
    this.x += vx * dt; this.y += vy * dt;
    // sert sınır (yumuşak itme)
    const pad = env.pad ?? L * 0.6, hx0 = pad, hx1 = env.W - pad;
    if (this.x < hx0) this.x += (hx0 - this.x) * Math.min(1, dt * 4); if (this.x > hx1) this.x += (hx1 - this.x) * Math.min(1, dt * 4);
    if (this.y < top) this.y += (top - this.y) * Math.min(1, dt * 4); if (this.y > bottom) this.y += (bottom - this.y) * Math.min(1, dt * 4);

    /* ---------- 5) Yüzme dalgası ---------- */
    const vn = clamp(this.speed / (1.5 * L), 0, 2);
    // hız = esas olarak kuyruk vuruş frekansı
    const fTarget = clamp(0.55 + 1.9 * vn, 0.4, 6.5) * (st === 'glide' ? 0.55 + 0.45 * (this.gate ?? 1) : 1);
    this.freq = damp(this.freq, fTarget, 2.8, dt);
    this.targetAmp = ampT * lerp(1, 0.68, clamp(vn, 0, 1));
    this.amp = damp(this.amp, this.targetAmp, 2.2, dt);
    this.phase += TAU * this.freq * dt;
    this.bend = damp(this.bend, clamp(this.turn / 2.2, -1, 1), 5, dt);
    this.courtAmp = damp(this.courtAmp, st === 'court' ? 1 : 0, 2.5, dt);
    this.pfRate = damp(this.pfRate, pecFlap, 3, dt); this.pf += this.pfRate * dt;
    // yeme sonrası küçük geri tepme sönümü
    // yüzey / derinlik
    this.zT += dt * 0.02; this.z = 0.5 + 0.5 * noise1(this.zT + this.seed);
    this.flipUpdate(dt);
    this.updateJoints(dt);
  }

  flipUpdate(dt) {
    const cs = Math.cos(this.heading);
    // sola bakarken balığı ters çevir (karın aşağıda kalsın) — kenar-üstü geçişi yumuşak
    if (this.flipTarget === undefined) this.flipTarget = cs >= 0 ? 1 : -1;
    if (cs > 0.18) this.flipTarget = 1; else if (cs < -0.18) this.flipTarget = -1;
    this.flip = damp(this.flip, this.flipTarget, 7, dt);
    if (Math.abs(this.flip) < 0.04) this.flip = this.flipTarget * 0.04;
  }

  updateJoints(dt) {
    const sp = this.c.sprite || FishArt.sprite(this.c), TW = FishArt.TW;
    const n = Math.max(1, Math.ceil(dt / 0.008)), h = dt / n;
    const soft = sp.tailSoft;
    for (let j = 0; j < J; j++) {
      const s = j / (J - 1);
      // ilerleyen dalga: y = A(s) sin(k s − ωt); A(s) = a0 + a1 s + a2 s²  (carangiform)
      const A = 0.02 + 0.02 * s + 0.11 * s * s;
      let y = this.amp * A * TW * Math.sin(TAU * 1.0 * s - this.phase);
      y += (this.bend + this.bendBase) * (s * s) * TW * 0.16;                                 // C-dönüş
      y += this.courtAmp * 0.028 * TW * Math.sin(TAU * 2.4 * s - this.phase * 2.6) * smoothstep(0.05, 0.5, s);  // S-titreşim
      if (s < 0.5) { this.joints[j] = y; this.jv[j] = 0; continue; }
      // kuyruk: gecikmeli sönümlü yay (kumaş gibi)
      const w0 = TAU * lerp(5.5, 2.7, (s - 0.5) / 0.5) * soft, z = 0.5;
      let pos = this.joints[j], vel = this.jv[j];
      for (let i = 0; i < n; i++) { const acc = w0 * w0 * (y - pos) - 2 * z * w0 * vel; vel += acc * h; pos += vel * h; }
      this.joints[j] = pos; this.jv[j] = vel;
    }
  }

  nearestFood(list) {
    let best = null, bd = 1e9;
    for (const f of list) { if (f.eaten) continue; const d = Math.hypot(f.x - this.x, f.y - this.y); if (d < bd) { bd = d; best = f; } }
    return best;
  }

  /** Cama dokunması / ürkme. */
  startle(fromX, fromY, strength = 1) {
    if (this.state === 'rest' && R.chance(0.6)) { this.startleT = 0.5; } else this.startleT = 0.7;
    this.heading = Math.atan2(this.y - fromY, this.x - fromX) + R.float(-0.5, 0.5);
    this.speed = this.c.bodyLen() * 2.5 * strength; this.c.stress = Math.min(1, this.c.stress + 0.3 * strength);
    this.flipTarget = Math.cos(this.heading) >= 0 ? 1 : -1;
  }
}

/** (yardımcı) hedef yönünü normalize eder. */
function wantDir(dx, dy) { const m = Math.hypot(dx, dy) || 1; return { x: dx / m, y: dy / m }; }
