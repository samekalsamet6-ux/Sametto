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
    const saved = Pedigree.rec; Pedigree.rec = {}; Pedigree._memo.clear();
    Pedigree.add(1, 0, 0); Pedigree.add(2, 0, 0); Pedigree.add(3, 1, 2); Pedigree.add(4, 1, 2); Pedigree.add(5, 3, 4);
    const f = Pedigree.F(5);
    Pedigree.rec = saved; Pedigree._memo.clear();
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

  /** Gebelik/doğum döngüsü: sperm depolama, batın, akrabalık, tank sınırı. */
  breeding() {
    const rs = R.s; R.s = 4242;
    const fake = { creatures: [], addCreature(c) { this.creatures.push(c); return c; } }, saved = Pedigree.rec; Pedigree.rec = {}; Pedigree._memo.clear();
    const m = new Creature({ id: 9001, genome: Genetics.make({ tc: 'red' }, 'M'), bornT: -100 * 1440 }), f = new Creature({ id: 9002, genome: Genetics.make({}, 'F'), bornT: -100 * 1440 });
    Breeding.reg(m); Breeding.reg(f); fake.creatures.push(m, f); m.now = f.now = 0;
    const r = Breeding.mate(m, f, 0); const gd = (f.preg.due - f.preg.start) / 1440;
    const early = Breeding.tick(1000, fake).length;                                   // erken doğum olmamalı
    const out = Breeding.tick(f.preg.due + 1, fake); const b = out[0];
    const kids = fake.creatures.filter((c) => c.dam === 9002);
    const okSperm = f.sperm.length === 1 && f.sperm[0].left === SPERM_BATCHES - 1 && f.preg && true;   // 2. gebelik otomatik
    const sibs = kids.length >= 2 ? Pedigree.kin(kids[0].id, kids[1].id) : 0.25;
    const okKin = kids.every((k) => k.F === 0) && Math.abs(sibs - 0.25) < 0.3;
    const okSex = kids.every((k) => k.sire === 9001 && (k.sex === 'M' ? k.pheno.tailColor === 'red' : true));
    Pedigree.rec = saved; Pedigree._memo.clear(); R.s = rs;
    return this._log('Üreme döngüsü', r.started && gd >= 21 && gd <= 31 && early === 0 && b && b.kept.length > 0 && okSperm && okKin && okSex, { gebelikGün: gd.toFixed(1), yavru: kids.length, yenen: b && b.lost, spermKalan: f.sperm[0] && f.sperm[0].left });
  },

  /** Kimya: taş/zemin etkisi, aşırı yük, CO₂–pH, HC Cuba davranışı. */
  chemistry() {
    const S = Game.S, bk = { w: S.water, sc: S.scape, noDeath: Chem.noDeath, acc: Chem.acc }, crs = Game.tank.creatures.slice();
    const run = (setup, days, extraFish = 0) => {
      S.water = Chem.fresh(S); const sc = Scape.fromTemplate('start', 1); setup && setup(sc); S.scape = sc; Game.tank.setScape(sc); Chem.noDeath = true; Chem.acc = 0;
      const extra = []; for (let i = 0; i < extraFish; i++) { const c = new Creature({ id: -9000 - i, genome: Genetics.randomFounder('F'), bornT: -90 * 1440 }); c.now = 0; extra.push(c); Game.tank.creatures.push(c); }
      for (let d = 0; d < days; d++) Chem.advance(1440, true); const w = S.water, it = sc.items.find((i) => i.d === 'hccuba'); Game.tank.creatures.length = 0; Game.tank.creatures.push(...crs); return { w, it };
    };
    const base = run(null, 60).w, rocks = run((sc) => { for (let i = 0; i < 3; i++) sc.items.push(Scape.newItem(sc, 'rock', 'seiryu', 0.5 + i * 0.05, { s: 1.3 })); }, 60).w;
    const soil = run((sc) => (sc.sub.type = 'aquasoil'), 60).w, over = run(null, 3, 30).w;
    const base3 = run(null, 3).w, co2 = run((sc) => (sc.equip.co2 = 'tank'), 3).w, cub = run((sc) => { sc.items.push(Scape.newItem(sc, 'plant', 'hccuba', 0.5, { g: 1 })); }, 25).it;
    S.water = bk.w; S.scape = bk.sc; Game.tank.setScape(bk.sc); Chem.noDeath = bk.noDeath; Chem.acc = bk.acc; Game.tank.creatures.length = 0; Game.tank.creatures.push(...crs);
    const ok1 = rocks.kh > base.kh + 0.6, ok2 = soil.kh <= base.kh && soil.ph < base.ph - 0.1, ok3 = over.nh3 > 0.25 || over.no2 > 0.25, ok4 = co2.ph < base3.ph - 0.2, ok5 = cub && (cub.vert || 1) > 1.15 && (cub.sp || 1) < 1.2;
    return this._log('Kimya (seiryu KH↑, aquasoil KH/pH↓, aşırı yük NH₃/NO₂↑, CO₂→pH↓, HC Cuba dikine uzar)', ok1 && ok2 && ok3 && ok4 && ok5, { flags: [ok1, ok2, ok3, ok4, ok5].map(Number).join(''), b3: +base3.ph.toFixed(2), kh: [base.kh, rocks.kh, soil.kh].map((x) => +x.toFixed(2)), ph: [base.ph, soil.ph, co2.ph].map((x) => +x.toFixed(2)), asırı: [+over.nh3.toFixed(2), +over.no2.toFixed(2)], cuba: cub && [+(cub.vert || 1).toFixed(2), +(cub.sp || 1).toFixed(2)] });
  },

  /** Bilgi içeriği tutarlılığı: her tür/bitki/taş için kart verisi tam mı? */
  content() {
    const bad = []; for (const s of SPECIES) { const i = SPECIES_INFO[s.id]; if (!i || !SP_ENV[s.id] || !i.mates || !i.breed || !i.food) bad.push('tür:' + s.id); else { for (const p of i.plants) if (!PLANTS[p]) bad.push('bitki:' + p); for (const m of [...i.mates.ok, ...i.mates.bad]) if (!SPECIES_INFO[m]) bad.push('arkadaş:' + m); if (!TEMPLATES[i.tpl]) bad.push('şablon:' + i.tpl); } }
    for (const [k, p] of Object.entries(PLANTS)) if (!p.info || !p.sci) bad.push('bitki bilgi:' + k);
    const terms = new Set(); const scan = (s) => (String(s).match(/\[\[(.+?)\]\]/g) || []).forEach((m) => terms.add(m.slice(2, -2)));
    Object.values(SPECIES_INFO).forEach((i) => i.genetics.forEach(scan)); LESSONS.forEach((l) => l.pages.forEach((p) => scan(p.join(' ')))); GUIDES.forEach((g) => g.pages.forEach((p) => scan(p.join(' ')))); Object.values(GLOSSARY).forEach(scan);
    for (const t of terms) if (!UI.findTerm(t)) bad.push('sözlük:' + t);
    return this._log('Bilgi içeriği tutarlı (tür, bitki, şablon, [[terim]] bağlantıları)', bad.length === 0, bad);
  },

  /** Ekonomi: görev/başarım, pazar, mağaza stoğu (tutarlılık), siparişler. */
  economy() {
    const S = Game.S, bak = { dq: S.dq, wq: S.wq, market: JSON.stringify(S.market), ach: JSON.stringify(S.ach), coins: S.coins, cnt: JSON.stringify(S.cnt) };
    S.dq = null; S.wq = null; Quests.refresh(S); const a = JSON.stringify(S.dq.list.map((q) => q.id)); S.dq = null; Quests.refresh(S);
    const ok1 = S.dq.list.length === 3 && S.wq.list.length === 5 && a === JSON.stringify(S.dq.list.map((q) => q.id));
    const id = 'tuxedo', m0 = Market.mult(id); Market.sold({ breed: () => ({ id }) }); const ok2 = Market.mult(id) < m0;
    const d1 = JSON.stringify(Shop.daily().map((o) => o.b.id)), d2 = JSON.stringify(Shop.daily().map((o) => o.b.id)), ok3 = d1 === d2 && Shop.trader().length === 3;
    const o = Orders.gen(S, new RNG(5)) || Orders.gen(S, new RNG(6)), ok4 = !!o && o.reward > 0 && o.text.length > 3;
    const ok5 = ACHIEVEMENTS.every((x) => x.tiers.length === 3 && x.tiers[0] < x.tiers[1] && x.tiers[1] < x.tiers[2]) && RESEARCH.every((n) => !n.after || RESEARCH.some((x) => x.id === n.after));
    S.dq = bak.dq; S.wq = bak.wq; S.market = JSON.parse(bak.market); S.coins = bak.coins;
    return this._log('Ekonomi (görevler, pazar talebi, mağaza stoğu, sipariş, başarım/araştırma tutarlılığı)', ok1 && ok2 && ok3 && ok4 && ok5, { ok1, ok2, ok3, ok4, ok5 });
  },

  /** Türler: ırk örnekleri, karides F1/F2, molly melanizm, beta dumbo oranı, melezleme kuralları, yürüyen canlı simülasyonu. */
  species() {
    const bad = []; for (const sp of Object.keys(SP_BREEDS)) for (const b of SP_BREEDS[sp]) { const g = Genetics.make(b.spec, 'M', new RNG(3), sp), got = Genetics.breedOf(Genetics.phenotype(g)); if (got.id !== b.id) bad.push(b.id + '→' + got.id); }
    const rng = new RNG(77), orange = Genetics.make({ sp: 'shrimp', col: 'O', dens: 0.5 }, 'M', rng, 'shrimp'), blueF = Genetics.make({ sp: 'shrimp', col: 'B', rili: ['R', 'R'], dens: 0.5 }, 'F', rng, 'shrimp');
    let f1ok = 0; const F1 = []; for (let i = 0; i < 200; i++) { const c = Genetics.breed(orange, blueF, rng, { noMut: true }), p = Genetics.phenotype(c); if (p.shrimpCol === 'red' && p.rili) f1ok++; F1.push(c); }
    const m1 = F1.find((g) => g.sex === 'M'), f1 = F1.find((g) => g.sex === 'F'); let orangeRili = 0, N2 = 2000; for (let i = 0; i < N2; i++) { const p = Genetics.phenotype(Genetics.breed(m1, f1, rng, { noMut: true })); if (p.shrimpCol === 'orange' && p.rili) orangeRili++; }
    const blk = Genetics.phenotype(Genetics.make({ sp: 'molly', mel: ['m2', 'm2'], mex: 0.5 }, 'M', rng, 'molly')), wht = Genetics.phenotype(Genetics.make({ sp: 'molly' }, 'M', rng, 'molly'));
    const bm = Genetics.make({ sp: 'betta', dumbo: ['D', 'd'] }, 'M', rng, 'betta'), bf = Genetics.make({ sp: 'betta', dumbo: ['D', 'd'] }, 'F', rng, 'betta'); let dumbo = 0; for (let i = 0; i < 2000; i++) if (Genetics.phenotype(Genetics.breed(bm, bf, rng, { noMut: true })).dumbo) dumbo++;
    const gm = Genetics.make({ tc: 'red' }, 'M', rng), ef = Genetics.make({ sp: 'endler', pur: 1 }, 'F', rng, 'endler'), hy = Genetics.breed(gm, ef, rng, { noMut: true });
    // yürüyen canlı: sınırda kalır, NaN üretmez
    const cr = new Creature({ id: -7777, genome: Genetics.make({ sp: 'shrimp', col: 'R' }, 'F', rng, 'shrimp'), bornT: -90 * 1440 }); cr.now = 0; const env = { W: 800, H: 700, ground: () => 620, scape: { items: [] }, food: [], night: 0 }; for (let i = 0; i < 3000; i++) cr.sw.update(0.03, env);
    const ok = { breeds: bad.length === 0, f1: f1ok === 200, f2: orangeRili / N2 > 0.08 && orangeRili / N2 < 0.25, molly: blk.cls === 'black' && wht.cls === 'none', dumbo: Math.abs(dumbo / 2000 - 0.25) < 0.05, hybrid: hy.sp === 'endler' && Math.abs(hy.quant.pur - 0.5) < 0.12, cross: canCross('platy', 'swordtail') && !canCross('guppy', 'betta') && !canCross('molly', 'platy'), walk: Number.isFinite(cr.sw.x) && cr.sw.x >= 14 && cr.sw.x <= 786 && cr.sw.y > 400 };
    return this._log('Türler (ırk tanıma, karides F1=Red Rili/F2 Orange Rili, molly, beta dumbo 25%, melez, yürüyüş)', Object.values(ok).every(Boolean), { ...ok, bad, orangeRili: +(orangeRili / N2).toFixed(3) });
  },

  all() { const r = [this.mendel(), this.sexLinked(), this.crossover(), this.sexRatio(), this.inbreeding(), this.mutation(), this.breeds(), this.breeding(), this.chemistry(), this.content(), this.economy(), this.species()]; console.log(r.every(Boolean) ? '🎉 Tüm testler geçti' : '⚠️ Başarısız test var'); return r.every(Boolean); },
};
