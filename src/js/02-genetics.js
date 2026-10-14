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

/* ---------------- Tür şemaları: lokuslar, varsayılanlar, mutasyon ----------------
   Her tür SCHEMA'da tanımlanır (lepistes burada, diğerleri 17-species.js'te).
   auto: otozomal lokuslar · sc: cinsiyete bağlı lokuslar · quant: nicel özellik aralıkları */
const SCHEMA = {
  guppy: {
    auto: AUTO_LOCI, sc: SC_LOCI, xy: XY_CROSS,
    defAuto: { body: ['W', 'W'], tail: ['delta', 'delta'], purple: ['pb', 'pb'], metal: ['mg', 'mg'] },
    defSc: { tc: 'none', tux: 0, sb: 0, st: 0, grass: 0, mosaic: 0, moscow: 0 },
    quant: { size: [0.75, 1.3], tailLen: [0.6, 1.4], vigor: [0.5, 1.4], intensity: [0.55, 1.3] },
    mut(locus, al, rng) {
      if (locus === 'body') { if (rng.chance(0.12)) return rng.pick(['obs', 'aur']); return rng.pick(BODY_RANK.filter((a) => a !== al && a !== 'obs' && a !== 'aur')); }
      if (locus === 'tail') return rng.pick(TAIL_RANK.filter((a) => a !== al));
      if (locus === 'purple') return al === 'Pb' ? 'pb' : 'Pb'; if (locus === 'metal') return al === 'Mg' ? 'mg' : 'Mg'; return al;
    },
    mutSc(locus, v, rng) { if (locus === 'tc') return rng.pick(Object.keys(TAILCOL).filter((c) => c !== v)); return v ? 0 : 1; },
  },
};
const sch = (sp) => SCHEMA[sp || 'guppy'];

const Genetics = {
  blankHap(isY, sp) { const S = sch(sp), h = Object.assign({}, S.defSc); h.Y = !!isY; return h; },

  /** Tanımdan (spec) genom üretir. Cinsiyete bağlı genler erkekte Y'ye, dişide X'e konur. */
  make(spec = {}, sex = 'M', rng = R, sp) {
    sp = sp || spec.sp || 'guppy'; const S = sch(sp), two = (v, d) => (Array.isArray(v) ? v.slice() : [v ?? d, v ?? d]);
    const g = { sex, sp, auto: {}, sc: [], quant: {} };
    for (const l of S.auto) g.auto[l] = spec[l] === undefined ? S.defAuto[l].slice() : (S.dom && S.dom[l] ? S.dom[l](spec[l]) : two(spec[l]));
    if (sp === 'guppy') { // lepistes: bayrak biçimli özel kısaltmalar
      g.auto.purple = spec.purple ? (spec.purple === 2 ? ['Pb', 'Pb'] : ['Pb', 'pb']) : ['pb', 'pb'];
      g.auto.metal = spec.metal ? (spec.metal === 2 ? ['Mg', 'Mg'] : ['Mg', 'mg']) : ['mg', 'mg'];
    }
    const flat = {}; for (const k of S.sc) if (spec[k] !== undefined) flat[k] = spec[k];
    const x0 = Object.assign(this.blankHap(false, sp), spec.X || {}), x1 = Object.assign(this.blankHap(sex === 'M', sp), sex === 'M' ? (spec.Y || {}) : (spec.X2 || {}));
    if (sex === 'M') Object.assign(x1, flat); else Object.assign(x0, flat);
    g.sc = [x0, x1];
    for (const q in S.quant) { const [a, b] = S.quant[q]; g.quant[q] = spec[q] ?? clamp((S.qdef && S.qdef[q] !== undefined ? S.qdef[q] : 1) + rng.gauss(0, 0.07), a, b); }
    return g;
  },

  /** Rastgele başlangıç genomu — yaygın genler. */
  randomFounder(sex, rng = R, sp = 'guppy') {
    if (sp !== 'guppy') return sch(sp).founder(sex, rng);
    const spec = { body: rng.chance(0.12) ? rng.pick(['bld', 'gld', 'alb', 'blu']) : 'W', tail: rng.pick(TAIL_COMMON), X: { tc: rng.chance(0.18) ? rng.pick(['red', 'blue']) : 'none' } };
    return this.make(spec, sex, rng);
  },

  /* ------------ İfade (fenotip) ------------ */
  expressMin(alleles, rank) { return rank[Math.min(rank.indexOf(alleles[0]), rank.indexOf(alleles[1]))]; },

  phenotype(g) {
    if (g.sp && g.sp !== 'guppy') return sch(g.sp).pheno(g);
    const p = {
      sex: g.sex, sp: 'guppy', body: this.expressMin(g.auto.body, BODY_RANK), purple: g.auto.purple.includes('Pb'), metal: g.auto.metal.includes('Mg'),
      metalDouble: g.auto.metal[0] === 'Mg' && g.auto.metal[1] === 'Mg', tail: this.expressMin(g.auto.tail, TAIL_RANK), tailColor: 'none', tailColor2: null,
      tux: 0, sb: 0, st: 0, grass: 0, mosaic: 0, moscow: 0, size: g.quant.size, tailLen: g.quant.tailLen, vigor: g.quant.vigor, intensity: g.quant.intensity,
    };
    if (g.sex === 'M') {
      const [x, y] = g.sc;
      const a = y.tc !== 'none' ? y.tc : x.tc, b = y.tc !== 'none' && x.tc !== 'none' && x.tc !== y.tc ? x.tc : null;
      p.tailColor = a; p.tailColor2 = b;
      for (const k of ['tux', 'sb', 'st', 'grass', 'mosaic', 'moscow']) p[k] = (x[k] || y[k]) ? 1 : 0;
    }
    p.penalty = p.metalDouble ? 0.65 : 1;
    p.sig = [p.sex, p.body, p.purple | 0, p.metal | 0, p.tail, p.tailColor, p.tailColor2, p.tux, p.sb, p.st, p.grass, p.mosaic, p.moscow].join('|');
    return p;
  },

  breedOf(p) { const list = p.sp && p.sp !== 'guppy' ? SP_BREEDS[p.sp] : BREEDS; return list.find((b) => b.test(p)); },

  /** Taşıyıcılık: dişide/erkekte gizli ama aktarılabilen genler (genetik defter için). */
  carried(g) {
    if (g.sp && g.sp !== 'guppy') return sch(g.sp).carried ? sch(g.sp).carried(g) : [];
    const out = [];
    if (g.sex === 'F') for (const h of g.sc) {
      if (h.tc !== 'none') out.push('Kuyruk: ' + TAILCOL[h.tc].name);
      if (h.tux) out.push('Tuxedo'); if (h.sb) out.push('Snakeskin gövde'); if (h.st) out.push('Snakeskin kuyruk');
      if (h.grass) out.push('Grass'); if (h.mosaic) out.push('Mozaik'); if (h.moscow) out.push('Moscow');
    }
    return [...new Set(out)];
  },

  /* ------------ Kalıtım ------------ */
  mutateAllele(locus, al, rng, sp) { return sch(sp).mut(locus, al, rng); },
  mutateSc(locus, v, rng, sp) { return sch(sp).mutSc(locus, v, rng); },

  /** Gamet: hedef şemadaki (forSp) lokuslar için; ebeveynde olmayan lokus varsayılanla doldurulur (melez). */
  gamete(g, rng = R, opts = {}, forSp) {
    const S = sch(forSp || g.sp), own = sch(g.sp), mut = opts.noMut ? 0 : MUT_RATE * (opts.mutMul || 1), auto = {};
    for (const l of S.auto) { const pair = g.auto[l] || S.defAuto[l]; let al = pair[rng.next() < 0.5 ? 0 : 1]; if (rng.next() < mut) al = S.mut(l, al, rng); auto[l] = al; }
    const mk = (h) => { const o = Object.assign({}, S.defSc); for (const l of S.sc) if (h[l] !== undefined) o[l] = h[l]; o.Y = h.Y; return o; };
    const h0 = mk(g.sc[0]), h1 = mk(g.sc[1]);
    const rec = opts.noCross ? 0 : (g.sex === 'M' ? (opts.xyCross ?? S.xy ?? XY_CROSS) : XX_CROSS);
    for (const l of S.sc) if (rng.next() < rec) { const t = h0[l]; h0[l] = h1[l]; h1[l] = t; }
    const sc = rng.next() < 0.5 ? h0 : h1;
    for (const l of S.sc) if (rng.next() < mut) sc[l] = S.mutSc(l, sc[l], rng);
    return { auto, sc };
  },

  /** Bir yavru genomu üretir (yavru anne türünde olur). Ebeveyn genomları değişmez. */
  breed(sire, dam, rng = R, opts = {}) {
    const sp = dam.sp || 'guppy', S = sch(sp), pg = this.gamete(sire, rng, opts, sp), mg = this.gamete(dam, rng, opts, sp);
    const g = { sex: pg.sc.Y ? 'M' : 'F', sp, auto: {}, sc: [mg.sc, pg.sc], quant: {} };
    for (const l of S.auto) g.auto[l] = [mg.auto[l], pg.auto[l]];
    for (const q in S.quant) {
      const [lo, hi] = S.quant[q], dflt = (S.qdef && S.qdef[q]) ?? 1, sv = sire.quant[q] ?? ((sire.sp || 'guppy') !== sp && S.qOther && S.qOther[q] !== undefined ? S.qOther[q] : dflt), dv = dam.quant[q] ?? dflt;
      let v = (sv + dv) / 2 + rng.gauss(0, 0.045);
      if (!opts.noMut && rng.chance(0.01)) v += rng.gauss(0, 0.2);     // nadir sıçrama
      g.quant[q] = clamp(v, lo, hi);
    }
    if (S.post) S.post(g, sire, dam, rng, opts);                       // türe özel (geri dönüş, melez saflığı…)
    return g;
  },

  /** Sağlık çarpanı: dayanıklılık, akrabalı üreme ve türe özgü ceza (çift Metal, balon vb.). */
  health(g, F = 0) { const p = this.phenotype(g); return clamp(p.vigor * (1 - 1.6 * F) * (p.penalty ?? 1), 0.1, 1.4); },

  /** Genotip metni (test sonrası görünen). */
  describe(g) {
    if (g.sp && g.sp !== 'guppy') return sch(g.sp).describe(g);
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
