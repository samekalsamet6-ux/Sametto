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
    if (!m.adult(now)) out.push(`${m.name} henüz olgun değil`);
    if (!f.adult(now)) out.push(`${f.name} henüz olgun değil`);
    return out;
  },
  /** Yavruların beklenen akrabalık katsayısı. */
  predictF(m, f) { return Pedigree.kin(m.id, f.id); },

  gestDays(f) { return R.float(GEST_DAYS[0], GEST_DAYS[1]); },

  /** Çiftleştirir. Dişi gebe değilse (ve dinlenmişse) gebelik başlar. */
  mate(m, f, now) {
    let rec = f.sperm.find((s) => s.sire === m.id);
    if (rec) rec.left = SPERM_BATCHES; else { f.sperm.push({ sire: m.id, name: m.name, g: JSON.parse(JSON.stringify(m.genome)), left: SPERM_BATCHES }); }
    while (f.sperm.length > 4) f.sperm.sort((a, b) => b.left - a.left).pop();
    let started = false;
    if (!f.preg) { const rest = Math.max(0, f.lastBirth + 2 * 1440 - now); const d = this.gestDays(f) * 1440; f.preg = { start: now + rest, due: now + rest + d }; started = true; }
    return { started, due: f.preg.due };
  },

  progress(f, now) { return f.preg ? clamp((now - f.preg.start) / (f.preg.due - f.preg.start), 0, 1) : 0; },

  litterSize(f) {
    const p = f.pheno, base = 9 + 16 * (p.size - 0.75) + Math.min(6, f.ageDays() / 60);
    let n = Math.round(R.gauss(base, 4)); n *= (1 - 1.4 * f.F) * (p.metalDouble ? 0.6 : 1) * clamp(p.vigor, 0.6, 1.2);
    return clamp(Math.round(n), 2, 60);
  },

  /** Zamanı gelen doğumları işler. Doğan yavruları döndürür: [{dam, kept, lost, released}] */
  tick(now, tank) {
    const births = [];
    for (const f of tank.creatures.slice()) {
      let guard = 0;
      while (f.preg && now >= f.preg.due && guard++ < 12) births.push(this.birth(f, f.preg.due, tank, now));
    }
    return births.filter(Boolean);
  },

  birth(f, t, tank, now) {
    f.preg = null; f.lastBirth = t;
    const sp = f.sperm.filter((s) => s.left > 0);
    if (!sp.length) return { dam: f, kept: [], lost: 0, released: 0, empty: true };
    const n = this.litterSize(f), kept = [], used = new Set(); let lost = 0, released = 0, dead = 0;
    for (const _ of Array(n)) {
      if (R.next() > Research.survival()) { lost++; continue; }
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
    // kalan sperm varsa 2 gün dinlenip yeni gebelik
    if (f.sperm.length) f.preg = { start: t + 2 * 1440, due: t + 2 * 1440 + this.gestDays(f) * 1440 };
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
