'use strict';
/* =====================================================================
   04b · ÜREME — çiftleştirme, sperm depolama, gebelik, doğum, önizleme
   Lepistes canlı doğurur: dişi sperm depolar (tek çiftleşmeyle birkaç batın),
   gebelik 21–31 gün, batın büyüklüğü dişinin boyuna/sağlığına bağlı,
   yetişkinler yavru yer, akrabalı üreme batını küçültür ve kusur riski doğurur.
   ===================================================================== */
const Breeding = {
  /** Soyağacı kaydı: ata ağacında portre çizebilmek için genom da saklanır. */
  reg(c) { Pedigree.add(c.id, c.sire, c.dam, { name: c.name, sex: c.genome.sex, g: c.genome, seed: c.seed, bornT: c.bornT }); },

  /** Çift seçimi uygun mu? Neden listesi döner (boşsa uygun). */
  problems(m, f, now) {
    const out = [];
    if (!m || !f) return ['Bir erkek ve bir dişi seç'];
    if (!canCross(m.species, f.species)) return [`${SPECIES.find((s) => s.id === m.species).name} ile ${SPECIES.find((s) => s.id === f.species).name} melezlenemez`];
    if (!m.adult(now)) out.push(`${m.name} henüz olgun değil`);
    if (!f.adult(now)) out.push(`${f.name} henüz olgun değil`);
    if (f.def.breed === 'bubble' && !(Game.S.bettaPair && Game.S.bettaPair.m === m.id && Game.S.bettaPair.f === f.id && Game.S.bettaPair.ready)) out.push('Önce kavanozları yan yana koyup bir gün bekle');
    return out;
  },
  /** Yavruların beklenen akrabalık katsayısı. */
  predictF(m, f) { return Pedigree.kin(m.id, f.id); },

  gestDays(f) { const b = f.def.breed; return b === 'shrimp' ? R.float(22, 28) : b === 'snail' ? R.float(3, 5) : b === 'bubble' ? 2 : R.float(GEST_DAYS[0], GEST_DAYS[1]); },

  /** Çiftleştirir. Dişi gebe/kuluçkada değilse (ve dinlenmişse) süreç başlar. quality: betta mini oyunu başarısı. */
  mate(m, f, now, quality = 1) {
    let rec = f.sperm.find((s) => s.sire === m.id), batches = f.def.breed === 'live' ? SPERM_BATCHES : 1;
    if (rec) rec.left = batches; else { f.sperm.push({ sire: m.id, name: m.name, g: JSON.parse(JSON.stringify(m.genome)), left: batches }); }
    while (f.sperm.length > 4) f.sperm.sort((a, b) => b.left - a.left).pop();
    let started = false;
    if (!f.preg) { const rest = Math.max(0, f.lastBirth + 2 * 1440 - now), d = this.gestDays(f) * 1440; f.preg = { start: now + rest, due: now + rest + d, q: quality }; started = true; if (f.def.breed === 'bubble') m.nestUntil = now + d + 3 * 1440; }
    return { started, due: f.preg.due };
  },

  progress(f, now) { return f.preg ? clamp((now - f.preg.start) / (f.preg.due - f.preg.start), 0, 1) : 0; },

  litterSize(f) {
    const LIT = { guppy: [5, 40], endler: [4, 18], molly: [12, 50], platy: [10, 40], swordtail: [12, 45], betta: [60, 300], shrimp: [8, 30], snail: [20, 100] }, [lo, hi] = LIT[f.species], p = f.pheno;
    let n = Math.round(R.gauss(lerp(lo, hi, clamp(0.35 + (p.size - 1) * 1.0 + Math.min(0.2, f.ageDays() / 400), 0.05, 0.95)), (hi - lo) * 0.1));
    if (f.def.breed === 'bubble') n = Math.round(n * (0.5 + 0.8 * ((f.preg && f.preg.q) ?? 1)));
    n *= (1 - 1.4 * f.F) * (p.penalty ?? 1) * clamp(p.vigor, 0.6, 1.2);
    return clamp(Math.round(n), 2, 400);
  },

  /** Zamanı gelen doğum/kuluçkaları işler. Sonuç: [{dam, kept, lost, released, …}] */
  tick(now, tank) {
    const births = [], pool = tank.creatures.concat((Game.S && Game.S.qFish) || []);
    for (const f of pool) { let guard = 0; while (f.preg && now >= f.preg.due && guard++ < 12) births.push(this.birth(f, f.preg.due, tank, now)); }
    for (const cl of (tank.clutches || []).slice()) if (now >= cl.due) births.push(this.hatch(cl, tank, now));
    return births.filter(Boolean);
  },

  birth(f, t, tank, now) {
    f.preg = null; f.lastBirth = t;
    const sp = f.sperm.filter((s) => s.left > 0);
    if (!sp.length) return { dam: f, kept: [], lost: 0, released: 0, empty: true };
    const n = this.litterSize(f), kind = f.def.breed;
    if (kind === 'snail') { // yumurta kümesi su üstüne bırakılır, kuluçka 2 hafta
      const rec = sp[0]; rec.left--; f.sperm = f.sperm.filter((s) => s.left > 0);
      (tank.clutches = tank.clutches || []).push({ x: clamp(f.sw.x, 30, tank.W - 30), due: t + 14 * 1440, n, sire: rec.g, sireId: rec.sire, dam: JSON.parse(JSON.stringify(f.genome)), damId: f.id, damName: f.name });
      return { dam: f, kept: [], lost: 0, released: 0, clutch: true, n };
    }
    const surv = kind === 'live' ? Research.survival() : kind === 'shrimp' ? 0.92 : clamp(0.25 + 0.6 * ((f.preg && f.preg.q) ?? 0.7) - (Chem.overall() > 0 ? 0.15 : 0), 0.15, 0.9);
    const res = this.spawn(f, sp, n, t, tank, now, surv);
    if (kind === 'live' && f.sperm.length) f.preg = { start: t + 2 * 1440, due: t + 2 * 1440 + this.gestDays(f) * 1440 };
    else if (kind !== 'live') f.sperm = [];
    f.eggs = 0; return res;
  },

  /** Yumurta kümesi açılır. */
  hatch(cl, tank, now) {
    tank.clutches = tank.clutches.filter((c) => c !== cl);
    const fake = { sp: 'snail', id: cl.damId, name: cl.damName, genome: cl.dam, sw: { x: cl.x, y: tank.H - 100 }, species: 'snail' };
    const kept = []; let lost = 0, released = 0;
    for (let i = 0; i < cl.n; i++) {
      if (R.next() > 0.85) { lost++; continue; } if (tank.creatures.length + kept.length >= tankCap()) { released++; continue; }
      const g = Genetics.breed(cl.sire, cl.dam, R), c = new Creature({ genome: g, bornT: cl.due, sire: cl.sireId, dam: cl.damId, unrevealed: true }); this.reg(c); c.now = now; c.sw.x = cl.x + R.float(-30, 30); c.sw.y = tank.H - 100; tank.addCreature(c); kept.push(c);
    }
    return { dam: fake, kept, lost, released };
  },

  /** Yavruları üretir (canlı doğuran / karides / beta). */
  spawn(f, sp, n, t, tank, now, surv) {
    const kept = [], used = new Set(); let lost = 0, released = 0, dead = 0;
    for (let i = 0; i < n; i++) {
      if (R.next() > surv) { lost++; continue; }
      const tot = sp.reduce((a, s) => a + s.left, 0); let r = R.next() * tot, rec = sp[0];
      for (const s of sp) { r -= s.left; if (r <= 0) { rec = s; break; } }
      used.add(rec);
      if (tank.creatures.length + kept.length >= tankCap()) { released++; continue; }
      const g = Genetics.breed(rec.g, f.genome, R), c = new Creature({ genome: g, bornT: t, sire: rec.sire, dam: f.id, x: f.sw.x, y: f.sw.y, unrevealed: true });
      this.reg(c);
      if (R.next() < Math.min(0.6, 1.8 * c.F)) { c.defect = true; c.sw.bendBase = 0.5 * (c.id % 2 ? 1 : -1); dead++; }
      c.now = now; c.sw.x = f.sw.x + R.float(-12, 12); c.sw.y = f.sw.y + R.float(-8, 8); c.sw.speed = 20;
      tank.addCreature(c); kept.push(c);
    }
    for (const s of used) s.left--;
    f.sperm = f.sperm.filter((s) => s.left > 0);
    return { dam: f, kept, lost, released, defects: dead };
  },

  /** Ebeveyn genomlarından çıkarımla olasılıklar. Bilinmeyen genler için `known` false. */
  preview(m, f, n = 1400) {
    const rng = new RNG(((m.id * 73856093) ^ (f.id * 19349663)) >>> 0), known = m.tested && f.tested;
    const body = {}, tailT = {}, breeds = {}, tc = {}; let males = 0, flags = {};
    for (let i = 0; i < n; i++) {
      const g = Genetics.breed(m.genome, f.genome, rng, { noMut: true }), p = Genetics.phenotype(g);
      if (g.sex === 'M') { males++; tc[p.tailColor] = (tc[p.tailColor] || 0) + 1; for (const k of ['tux', 'sb', 'st', 'grass', 'mosaic', 'moscow']) if (p[k]) flags[k] = (flags[k] || 0) + 1; }
      body[p.body] = (body[p.body] || 0) + 1; tailT[p.tail] = (tailT[p.tail] || 0) + 1;
      const b = Genetics.breedOf(p).id; breeds[b] = (breeds[b] || 0) + 1;
    }
    const norm = (o, d) => Object.entries(o).map(([k, v]) => [k, v / d]).sort((a, b) => b[1] - a[1]);
    return { known, F: this.predictF(m, f), male: males / n, body: norm(body, n), tail: norm(tailT, n), tc: norm(tc, Math.max(1, males)), flags: norm(flags, Math.max(1, males)), breeds: norm(breeds, n) };
  },

  /** Otozomal lokus için 2×2 Punnett karesi (hücre = allel çifti). */
  punnett(a, b) { return [[0, 1].map((j) => [a[0], b[j]]), [0, 1].map((j) => [a[1], b[j]])]; },
};
