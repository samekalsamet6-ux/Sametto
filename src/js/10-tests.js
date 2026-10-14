'use strict';
/* =====================================================================
   10 · KONSOL TESTLERİ — Tests.mendel(), Tests.sexLinked(), Tests.all() …
   ===================================================================== */
const Tests = {
  _log(name, ok, info) { console.log(`${ok ? '✅' : '❌'} ${name}`, info || ''); return ok; },

  /** Aa × Aa → ~3:1 (1000 yavru); mutasyon kapalı. */
  mendel(n = 1000) {
    const rng = new RNG(1234);
    const het = Genetics.make({ body: ['W', 'alb'] }, 'M', rng), hetF = Genetics.make({ body: ['W', 'alb'] }, 'F', rng);
    let wild = 0, alb = 0, wwCount = 0;
    for (let i = 0; i < n; i++) {
      const c = Genetics.breed(het, hetF, rng, { noMut: true });
      const p = Genetics.phenotype(c); if (p.body === 'W') wild++; else alb++;
      if (c.auto.body[0] === 'W' && c.auto.body[1] === 'W') wwCount++;
    }
    const ratio = wild / Math.max(1, alb);
    return this._log('Mendel 3:1 (gövde rengi)', Math.abs(wild / n - 0.75) < 0.05, { wild, albino: alb, oran: ratio.toFixed(2), homozigotBaskin: wwCount });
  },

  /** Y'ye bağlı gen: tüm oğullar taşır, kızlar taşımaz (çaprazlama kapalı). */
  sexLinked(n = 400) {
    const rng = new RNG(99);
    const sire = Genetics.make({ tux: 1, tc: 'red' }, 'M', rng), dam = Genetics.make({}, 'F', rng);
    let sons = 0, sonsTux = 0, dau = 0, dauCarry = 0;
    for (let i = 0; i < n; i++) {
      const c = Genetics.breed(sire, dam, rng, { noMut: true, noCross: true });
      const p = Genetics.phenotype(c);
      if (c.sex === 'M') { sons++; if (p.tux && p.tailColor === 'red') sonsTux++; }
      else { dau++; if (Genetics.carried(c).length) dauCarry++; }
    }
    return this._log('Y\'ye bağlı kalıtım', sons > 0 && sonsTux === sons && dauCarry === 0, { oğul: sons, tuxedoOğul: sonsTux, kız: dau, taşıyıcıKız: dauCarry });
  },

  /** X–Y çaprazlama oranı ≈ %3: Y'deki gen oğullarda X'e / kızlara sızar. */
  crossover(n = 6000) {
    const rng = new RNG(7);
    const sire = Genetics.make({ tux: 1 }, 'M', rng), dam = Genetics.make({}, 'F', rng);
    let leak = 0, dau = 0;
    for (let i = 0; i < n; i++) {
      const c = Genetics.breed(sire, dam, rng, { noMut: true });
      if (c.sex === 'F') { dau++; if (c.sc[1].tux) leak++; }
    }
    const r = leak / dau;
    return this._log('X–Y çaprazlama ≈ %3 (kızlara sızan Tuxedo)', r > 0.01 && r < 0.05, { kız: dau, sızan: leak, oran: (r * 100).toFixed(1) + '%' });
  },

  /** Cinsiyet oranı ≈ 1:1 */
  sexRatio(n = 2000) {
    const rng = new RNG(5); const f = Genetics.make({}, 'M', rng), m = Genetics.make({}, 'F', rng);
    let males = 0; for (let i = 0; i < n; i++) if (Genetics.breed(f, m, rng).sex === 'M') males++;
    return this._log('Cinsiyet oranı 1:1', Math.abs(males / n - 0.5) < 0.05, { erkek: males, dişi: n - males });
  },

  /** Akrabalı yetiştirme: kardeş çiftleşmesi F≈0.25. */
  inbreeding() {
    Pedigree.rec = {}; Pedigree._memo.clear();
    Pedigree.add(1, 0, 0); Pedigree.add(2, 0, 0); Pedigree.add(3, 1, 2); Pedigree.add(4, 1, 2); Pedigree.add(5, 3, 4);
    const f = Pedigree.F(5);
    Pedigree.rec = {}; Pedigree._memo.clear();
    return this._log('Akrabalık katsayısı (kardeş × kardeş = 0.25)', Math.abs(f - 0.25) < 1e-9, { F: f });
  },

  /** Mutasyon sıklığı ~ gen başına %0.5 */
  mutation(n = 20000) {
    const rng = new RNG(31); const a = Genetics.make({}, 'M', rng), b = Genetics.make({}, 'F', rng);
    let mut = 0; for (let i = 0; i < n; i++) { const c = Genetics.breed(a, b, rng, { noCross: true }); const p = Genetics.phenotype(c); if (p.body !== 'W' || p.metal || p.purple) mut++; }
    return this._log('Mutasyon oranı makul', mut / n < 0.05, { yavru: n, görünenMutasyon: mut });
  },

  breeds() {
    const bad = BREEDS.filter((b) => { const p = Genetics.phenotype(Genetics.make(b.spec, 'M')); return Genetics.breedOf(p).id !== b.id; });
    return this._log('Her ırk kendi örnek genomunu tanır', bad.length === 0, bad.map((b) => b.id));
  },

  all() { const r = [this.mendel(), this.sexLinked(), this.crossover(), this.sexRatio(), this.inbreeding(), this.mutation(), this.breeds()]; console.log(r.every(Boolean) ? '🎉 Tüm testler geçti' : '⚠️ Başarısız test var'); return r.every(Boolean); },
};
