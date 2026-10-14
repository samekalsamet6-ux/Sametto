'use strict';
/* =====================================================================
   02 · GENETİK MOTORU — Lepistes
   · XX/XY cinsiyet, X–Y arası düşük çaprazlama (%3)
   · Otozomal: body (çekinik), purple (baskın), metal (baskın, çift kopya = ceza), tail
   · Cinsiyete bağlı: tc, tux, sb, st, grass, mosaic, moscow
   · Nicel: size, tailLen, vigor, intensity (ebeveyn ortalaması + Gauss sapma)
   · Mutasyon, akrabalık katsayısı (soyağacından), ırk tanıma
   ===================================================================== */

const AUTO_LOCI = ['body', 'purple', 'metal', 'tail'];
const SC_LOCI = ['tc', 'tux', 'sb', 'st', 'grass', 'mosaic', 'moscow'];
const XY_CROSS = 0.03;      // erkekte X–Y arası çaprazlama (lokus başına)
const XX_CROSS = 0.25;      // dişide X–X arası
const MUT_RATE = 0.0025;    // lokus başına gamet mutasyonu → yavruda gen başına ~%0.5

/* ---------------- Soyağacı kaydı (balık öldükten/satıldıktan sonra da kalır) ---------------- */
const Pedigree = {
  rec: {}, _memo: new Map(),
  add(id, sire, dam, extra) { this.rec[id] = Object.assign({ s: sire || 0, d: dam || 0 }, extra); this._memo.clear(); },
  /** İki bireyin akrabalık (kinship) katsayısı. */
  kin(a, b) {
    if (!a || !b) return 0;
    if (a === b) return 0.5 * (1 + this.F(a));
    if (a < b) { const t = a; a = b; b = t; }          // id arttıkça gençleşir
    const key = a + ',' + b; if (this._memo.has(key)) return this._memo.get(key);
    const r = this.rec[a]; let v = 0;
    if (r && (r.s || r.d)) v = 0.5 * (this.kin(r.s, b) + this.kin(r.d, b));
    this._memo.set(key, v); return v;
  },
  /** Akrabalı yetiştirme katsayısı F = ebeveynlerin akrabalığı. */
  F(id) { const r = this.rec[id]; return r && r.s && r.d ? this.kin(r.s, r.d) : 0; },
};

/* ---------------- Genom yardımcıları ---------------- */
const Genetics = {
  blankHap(isY) { return { tc: 'none', tux: 0, sb: 0, st: 0, grass: 0, mosaic: 0, moscow: 0, Y: !!isY }; },

  /** Tanımdan (spec) genom üretir. Cinsiyete bağlı genler erkekte Y'ye, dişide X'e konur. */
  make(spec = {}, sex = 'M', rng = R) {
    const two = (v, d) => (Array.isArray(v) ? v.slice() : [v ?? d, v ?? d]);
    const g = { sex, auto: {}, sc: [], quant: {} };
    g.auto.body = two(spec.body, 'W');
    g.auto.tail = two(spec.tail, 'delta');
    g.auto.purple = spec.purple ? (spec.purple === 2 ? ['Pb', 'Pb'] : ['Pb', 'pb']) : ['pb', 'pb'];
    g.auto.metal = spec.metal ? (spec.metal === 2 ? ['Mg', 'Mg'] : ['Mg', 'mg']) : ['mg', 'mg'];
    const flat = {}; for (const k of SC_LOCI) if (spec[k] !== undefined) flat[k] = spec[k];
    const x0 = Object.assign(this.blankHap(false), spec.X || {});
    const x1 = Object.assign(this.blankHap(sex === 'M'), sex === 'M' ? (spec.Y || {}) : (spec.X2 || {}));
    if (sex === 'M') Object.assign(x1, flat); else Object.assign(x0, flat);
    g.sc = [x0, x1];
    for (const q in QUANT) {
      const [a, b] = QUANT[q].range;
      g.quant[q] = spec[q] ?? clamp(1 + rng.gauss(0, 0.07), a, b);
    }
    return g;
  },

  /** Rastgele başlangıç genomu — yaygın genler. */
  randomFounder(sex, rng = R) {
    const spec = {
      body: rng.chance(0.12) ? rng.pick(['bld', 'gld', 'alb', 'blu']) : 'W',
      tail: rng.pick(TAIL_COMMON),
      X: { tc: rng.chance(0.18) ? rng.pick(['red', 'blue']) : 'none' },
    };
    return this.make(spec, sex, rng);
  },

  /* ------------ İfade (fenotip) ------------ */
  expressMin(alleles, rank) { return rank[Math.min(rank.indexOf(alleles[0]), rank.indexOf(alleles[1]))]; },

  phenotype(g) {
    const p = {
      sex: g.sex,
      body: this.expressMin(g.auto.body, BODY_RANK),
      purple: g.auto.purple.includes('Pb'),
      metal: g.auto.metal.includes('Mg'),
      metalDouble: g.auto.metal[0] === 'Mg' && g.auto.metal[1] === 'Mg',
      tail: this.expressMin(g.auto.tail, TAIL_RANK),
      tailColor: 'none', tailColor2: null,
      tux: 0, sb: 0, st: 0, grass: 0, mosaic: 0, moscow: 0,
      size: g.quant.size, tailLen: g.quant.tailLen, vigor: g.quant.vigor, intensity: g.quant.intensity,
    };
    if (g.sex === 'M') {
      const [x, y] = g.sc;
      // Y'deki kuyruk rengi öncelikli; X'tekiyle farklıysa iki renkli (alt/üst) görünür.
      const a = y.tc !== 'none' ? y.tc : x.tc, b = y.tc !== 'none' && x.tc !== 'none' && x.tc !== y.tc ? x.tc : null;
      p.tailColor = a; p.tailColor2 = b;
      for (const k of ['tux', 'sb', 'st', 'grass', 'mosaic', 'moscow']) p[k] = (x[k] || y[k]) ? 1 : 0;
    }
    p.sig = [p.sex, p.body, p.purple | 0, p.metal | 0, p.tail, p.tailColor, p.tailColor2, p.tux, p.sb, p.st, p.grass, p.mosaic, p.moscow].join('|');
    return p;
  },

  breedOf(p) { return BREEDS.find((b) => b.test(p)); },

  /** Taşıyıcılık: dişide/erkekte gizli ama aktarılabilen genler (genetik defter için). */
  carried(g) {
    const out = [];
    if (g.sex === 'F') for (const h of g.sc) {
      if (h.tc !== 'none') out.push('Kuyruk: ' + TAILCOL[h.tc].name);
      if (h.tux) out.push('Tuxedo'); if (h.sb) out.push('Snakeskin gövde'); if (h.st) out.push('Snakeskin kuyruk');
      if (h.grass) out.push('Grass'); if (h.mosaic) out.push('Mozaik'); if (h.moscow) out.push('Moscow');
    }
    return [...new Set(out)];
  },

  /* ------------ Kalıtım ------------ */
  mutateAllele(locus, al, rng) {
    if (locus === 'body') {
      const pool = BODY_RANK.filter((a) => a !== al);
      // efsanevi/mitik mutasyonlar çok nadir
      if (rng.chance(0.12)) return rng.pick(['obs', 'aur']);
      return rng.pick(pool.filter((a) => a !== 'obs' && a !== 'aur'));
    }
    if (locus === 'tail') return rng.pick(TAIL_RANK.filter((a) => a !== al));
    if (locus === 'purple') return al === 'Pb' ? 'pb' : 'Pb';
    if (locus === 'metal') return al === 'Mg' ? 'mg' : 'Mg';
    return al;
  },
  mutateSc(locus, v, rng) {
    if (locus === 'tc') return rng.pick(Object.keys(TAILCOL).filter((c) => c !== v));
    return v ? 0 : 1;
  },

  gamete(g, rng = R, opts = {}) {
    const mut = opts.noMut ? 0 : MUT_RATE * (opts.mutMul || 1);
    const auto = {};
    for (const l of AUTO_LOCI) {
      let al = g.auto[l][rng.next() < 0.5 ? 0 : 1];
      if (rng.next() < mut) al = this.mutateAllele(l, al, rng);
      auto[l] = al;
    }
    const h0 = Object.assign({}, g.sc[0]), h1 = Object.assign({}, g.sc[1]);
    const rec = opts.noCross ? 0 : (g.sex === 'M' ? (opts.xyCross ?? XY_CROSS) : XX_CROSS);
    for (const l of SC_LOCI) if (rng.next() < rec) { const t = h0[l]; h0[l] = h1[l]; h1[l] = t; }
    const sc = rng.next() < 0.5 ? h0 : h1;
    for (const l of SC_LOCI) if (rng.next() < mut) sc[l] = this.mutateSc(l, sc[l], rng);
    return { auto, sc };
  },

  /** Bir yavru genomu üretir. Ebeveyn genomları değişmez. */
  breed(sire, dam, rng = R, opts = {}) {
    const pg = this.gamete(sire, rng, opts), mg = this.gamete(dam, rng, opts);
    const g = { sex: pg.sc.Y ? 'M' : 'F', auto: {}, sc: [mg.sc, pg.sc], quant: {} };
    for (const l of AUTO_LOCI) g.auto[l] = [mg.auto[l], pg.auto[l]];
    for (const q in QUANT) {
      const [lo, hi] = QUANT[q].range;
      let v = (sire.quant[q] + dam.quant[q]) / 2 + rng.gauss(0, 0.045);
      if (!opts.noMut && rng.chance(0.01)) v += rng.gauss(0, 0.2);     // nadir sıçrama
      g.quant[q] = clamp(v, lo, hi);
    }
    return g;
  },

  /** Sağlık çarpanı: dayanıklılık, akrabalı üreme ve çift Metal geni. */
  health(g, F = 0) {
    const p = this.phenotype(g);
    let v = p.vigor * (1 - 1.6 * F) * (p.metalDouble ? 0.65 : 1);
    return clamp(v, 0.1, 1.4);
  },

  /** Genotip metni (test sonrası görünen). */
  describe(g) {
    const rows = [];
    rows.push(['Gövde rengi (otozomal)', g.auto.body.map((a) => BODY[a].name).join(' / ')]);
    rows.push(['Mor gövde (Pb)', g.auto.purple.join(' / ')]);
    rows.push(['Metal (Mg)', g.auto.metal.join(' / ')]);
    rows.push(['Kuyruk tipi', g.auto.tail.map((a) => TAILS[a].name).join(' / ')]);
    const hn = (h) => { const l = [h.tc !== 'none' ? 'kuyruk ' + TAILCOL[h.tc].name : null, h.tux ? 'Tuxedo' : null, h.sb ? 'Snake-gövde' : null, h.st ? 'Snake-kuyruk' : null, h.grass ? 'Grass' : null, h.mosaic ? 'Mozaik' : null, h.moscow ? 'Moscow' : null].filter(Boolean); return l.length ? l.join(', ') : '–'; };
    rows.push(['X kromozomu', hn(g.sc[0])]);
    rows.push([g.sex === 'M' ? 'Y kromozomu' : '2. X kromozomu', hn(g.sc[1])]);
    return rows;
  },
};
