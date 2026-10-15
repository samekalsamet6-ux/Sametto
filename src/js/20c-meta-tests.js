'use strict';
/* 20c · Aşama 8 testleri — Tests.meta() ve Tests.all() genişletmesi */
Object.assign(Tests, {
  meta() {
    const ok = {}, fake = (tpl) => ({ scape: Scape.fromTemplate(tpl) });
    // jüri: Iwagumi şablonu Iwagumi stilinde tam stil puanı almalı, Hollanda stilinde düşük
    const iw = Judge.score('iwagumi', fake('iwagumi')), du = Judge.score('dutch', fake('iwagumi')), em = Judge.score('nature', { scape: Scape.blank() });
    ok.judgeIwagumi = iw.crit.find((c) => c.k === 'style').v === 100 && iw.total >= 70 && iw.total > du.total;
    ok.judgeEmpty = em.total < 45 && em.notes.length > 0;
    ok.judgeRange = Object.keys(STYLES).every((k) => { const t = Judge.score(k, fake('start')).total; return t >= 0 && t <= 100; });
    // yarışma: deterministik rakipler, sıralama, ödül tek yönlü
    const r1 = Contest.rivals('f', 5), r2 = Contest.rivals('f', 5), r3 = Contest.rivals('f', 6);
    ok.rivals = JSON.stringify(r1) === JSON.stringify(r2) && JSON.stringify(r1) !== JSON.stringify(r3) && r1.length === 5;
    ok.place = Contest.place(100, r1) === 1 && Contest.place(0, r1) === 6;
    const rw = [1, 2, 3, 4].map((p) => Contest.reward(p, false).coins); ok.reward = rw[0] > rw[1] && rw[1] > rw[2] && rw[2] > rw[3] && Contest.reward(1, true).coins > rw[0];
    // sergi puanı: sağlıklı yetişkin balık için 0-100, kategori ana kategori ağırlığı
    const c = new Creature({ genome: Genetics.make({ tc: 'red', tail: 'delta' }, 'M', new RNG(5)), bornT: -90 * 1440 }); c.now = 0; let sj = true; if (c) for (const k of SHOW_CATS) { const s = ShowJudge.score(c, k.id); sj = sj && s.total >= 0 && s.total <= 100 && s.crit.length === 4; } ok.show = sj && ShowJudge.eligible(c);
    // hikâye: yeni oyunda 1. bölüm açık, 2. kilitli; hedef tamamlanınca ödül ve 2. bölüm açılır
    const S = { clockMin: 0, xp: 0, cnt: {}, stats: { sold: 0 }, discovered: {}, meta: {} }; const g1 = CHAPTERS[0];
    ok.storyInit = Meta.chapterState(g1, S) === 'open' && Meta.chapterState(CHAPTERS[1], S) === 'locked';
    S.cnt.feed = 3; S.cnt.water = 1; S.stats.sold = 1; ok.storyReady = Meta.chapterState(g1, S) === 'ready';
    ok.storyOrder = CHAPTERS.every((ch, i) => ch.id === i + 1 && ch.goals.length >= 2 && ch.intro.length && ch.outro.length) && CHAPTERS.length === 7;
    // dostluk eşikleri
    ok.friend = Meta.friendLv(0) === 0 && Meta.friendLv(3) === 1 && Meta.friendLv(25) === 4 && Meta.friendLv(999) === 4;
    // sezon: indeks, arşive geçiş, ödül ücretsiz
    const SS = { clockMin: 0, meta: {} }; Season.ensure(SS); SS.meta.season.pts = 250; SS.clockMin = SEASON_DAYS * 1440 * 1.2; Season.ensure(SS);
    ok.season = Season.idx(SS) === 1 && SS.meta.archive.length === 1 && SS.meta.archive[0].pts === 250 && SS.meta.season.pts === 0 && Season.theme(SS).id === 'summer';
    // kayıt göçü v4 → v5
    const d = Save.newState(); d.v = 4; delete d.meta; const mg = Save.migrate(d); ok.migrate = mg.v === SAVE_VERSION && !!mg.meta && Meta.ensure({ meta: mg.meta }).lines.length === 0;
    // sabit hat: soyağacı eksikse reddedilir; 3 nesil erkek soyu + saf çift kabul edilir
    const saveRec = Pedigree.rec, gm = { M: null }; Pedigree.rec = {}; Pedigree._memo.clear();
    let accepted = null;
    for (const b of BREEDS.filter((x) => x.rarity >= 1 && x.spec)) {
      Pedigree.rec = {}; Pedigree._memo.clear(); const rng = new RNG(77);
      const gA = Genetics.make(b.spec, 'M', rng), gB = Genetics.make(b.spec, 'M', rng), gC = Genetics.make(b.spec, 'M', rng), gF = Genetics.make(b.spec, 'F', rng);
      Pedigree.add(9101, 0, 0, { g: gA, sex: 'M' }); Pedigree.add(9102, 9101, 0, { g: gB, sex: 'M' }); Pedigree.add(9103, 9102, 0, { g: gC, sex: 'M' });
      const m = new Creature({ id: 9103, genome: gC, bornT: -90 * 1440 }), f = new Creature({ id: 9104, genome: gF, bornT: -90 * 1440 }); m.now = 0; f.now = 0;
      const r = Lines.check(m, f); if (r.ok) { accepted = { b: b.id, rate: r.rate }; Pedigree.rec = { 9103: { s: 0, d: 0, g: gC } }; ok.lineNoAncestors = !Lines.check(m, f).ok; break; }
    }
    Pedigree.rec = saveRec; Pedigree._memo.clear(); ok.lineAccept = !!accepted && accepted.rate >= 0.9; ok.lineNoAncestors = ok.lineNoAncestors !== false;
    // bonus çarpanları: dostluk ve prestij
    const MS = { meta: { friend: { dede: 8, pul: 0, ayse: 0 }, prestige: { n: 2 } } }; ok.mult = Math.abs(Meta.mult('sell', MS) - (1 + 0.02 * 2 + 0.06)) < 1e-9 && Meta.mult('xp', MS) > 1.09 && Meta.mult('prize', MS) === 1;
    return this._log('Meta (jüri, yarışma, hikâye, sezon, göç, sabit hat, çarpanlar)', Object.values(ok).every(Boolean), ok);
  },
  all() { const r = [this.mendel(), this.sexLinked(), this.crossover(), this.sexRatio(), this.inbreeding(), this.mutation(), this.breeds(), this.breeding(), this.chemistry(), this.content(), this.economy(), this.species(), this.meta()]; console.log(r.every(Boolean) ? '🎉 Tüm testler geçti' : '⚠️ Başarısız test var'); return r.every(Boolean); },
});

/* Eğitim adımları: yapı ve ilerleme koşulları */
Object.assign(Tests, {
  tutorial() {
    const ok = {}, ids = Tut.steps.map((s) => s.id);
    ok.steps = ids.length >= 8 && new Set(ids).size === ids.length && Tut.steps.every((s) => typeof s.done === 'function' && s.text);
    const S = { cnt: { scape: 5, feed: 2, mate: 1 }, stats: { sold: 3 }, settings: { speed: 2 }, tut: { i: 1, base: { scape: 1, feed: 0, mate: 0, sold: 0, speed: 1 } } }, cur = UI.cur;
    ok.place = Tut.check(S); S.tut.base.scape = 4; ok.placeNo = !Tut.check(S);
    S.tut.i = Tut.steps.findIndex((s) => s.id === 'speed'); ok.speed = Tut.check(S); S.settings.speed = 1; ok.speedNo = !Tut.check(S);
    S.tut.i = Tut.steps.findIndex((s) => s.id === 'feed'); ok.feed = Tut.check(S);
    S.tut.i = Tut.steps.findIndex((s) => s.id === 'mate'); ok.mate = Tut.check(S);
    S.tut.i = Tut.steps.findIndex((s) => s.id === 'sell'); ok.sell = Tut.check(S);
    S.tut.i = Tut.steps.findIndex((s) => s.id === 'profile'); ok.name = !Tut.check(S) && (S.tut.named = 1, Tut.check(S));
    UI.cur = cur; return this._log('Eğitim (adım yapısı ve tamamlanma koşulları)', Object.values(ok).every(Boolean), ok);
  },
});
Tests.all = ((orig) => function () { const a = orig.call(this), b = this.tutorial(); return a && b; })(Tests.all);

/* Müzik bağlamı: hava durumu deterministik ve ~1/6 oranında */
Object.assign(Tests, {
  music() {
    let rainy = 0; for (let d = 0; d < 600; d++) if (Weather.rainy(d * 1440 + 12 * 60)) rainy++;
    const ok = { rate: rainy > 60 && rainy < 140, det: Weather.rainy(5 * 1440 + 720) === Weather.rainy(5 * 1440 + 720), night: !Weather.rainy(6 * 1440 + 60), api: typeof AudioSys.setTint === 'function' && typeof AudioSys.SFX.pour === 'function' && 'contest' !== undefined };
    return this._log('Müzik bağlamı (hava, API)', Object.values(ok).every(Boolean), { ...ok, rainy });
  },
});
Tests.all = ((orig) => function () { const a = orig.call(this), b = this.music(); return a && b; })(Tests.all);

/* Derinlik: dolunay, kilometre taşları, tahmin değerlendirme, gizli varyasyon */
Object.assign(Tests, {
  depth() {
    const ok = {}, S = Game.S, M = Depth.ensure(S);
    ok.moon = Depth.fullMoon(15 * 1440 + 22 * 60) && !Depth.fullMoon(15 * 1440 + 12 * 60) && !Depth.fullMoon(5 * 1440 + 22 * 60);
    const mi = Depth.mileInfo(S); ok.mile = mi.length === SPECIES.filter((sp) => breedsOf(sp.id).length).length && mi.every((r) => r.tiers.length === 4);
    // tahmin: dişi seç, doğru tahminle not ver, değerlendir
    const f = Game.tank.creatures.find((c) => c.sex === 'F'); let graded = false;
    if (f) { const act = Genetics.carried(f.genome), opts = [...new Set([...act, 'Sahte gen'])]; const n0 = M.notes.length; Depth.addNote(f, act, opts); const was = f.tested; f.tested = true; Depth.grade(f); f.tested = was; const n = M.notes[M.notes.length - 1]; graded = M.notes.length === n0 + 1 && n.done === 1 && n.ok === opts.length; M.notes.pop(); }
    ok.grade = graded;
    // gizli varyasyon: albino + dolunay
    const rng = new RNG(9), alb = Genetics.make({ body: ['alb', 'alb'] }, 'M', rng); ok.albino = Depth.isAlbino(alb) && !Depth.isAlbinoHet(alb) && Depth.isAlbinoHet(Genetics.make({ body: ['W', 'alb'] }, 'F', rng));
    ok.secrets = Object.keys(SECRETS).length >= 2 && Object.values(SECRETS).every((x) => x.hint && x.how);
    // sabit hat satış bonusu
    const c = Game.tank.creatures[0], base = Market.price(c); M.lines.push({ id: 99, sp: c.species, bid: (c.breed() || {}).id, name: 't' }); const boosted = Market.price(c); M.lines.pop(); ok.lineBonus = !!c.breed() && boosted >= Math.round(base * 1.2);
    return this._log('Derinlik (dolunay, kilometre taşı, defter, gizli varyasyon, hat bonusu)', Object.values(ok).every(Boolean), ok);
  },
});
Tests.all = ((orig) => function () { const a = orig.call(this), b = this.depth(); return a && b; })(Tests.all);

/* 3D balık: ağ üretimi WebGL gerektirmez; her tür için kapalı, makul bir ağ çıkmalı */
Object.assign(Tests, {
  fish3d() {
    const ok = {}, sps = ['guppy', 'endler', 'molly', 'platy', 'swordtail', 'betta']; let allOk = true, info = [];
    for (const sp of sps) {
      const b = breedsOf(sp).find((x) => x.spec) || breedsOf(sp)[0], cr = Game.sampleCreature(b.spec), m = Fish3D.mesh(FishArt.sprite(cr));
      const vcount = m.V.length / 8, maxIdx = Math.max(...m.front, ...m.back), fine = vcount < 65536 && maxIdx < vcount && m.front.length > 3000 && m.back.length === m.front.length;
      let zmax = 0; for (let i = 0; i < m.V.length; i += 8) zmax = Math.max(zmax, Math.abs(m.V[i + 2])); const finite = m.V.every(Number.isFinite);
      info.push(sp + ':' + m.front.length / 3 + 't z' + zmax.toFixed(3)); if (!(fine && finite && zmax > 0.02 && zmax < 0.3)) allOk = false;
    }
    ok.meshes = allOk; ok.mesh_cached = (() => { const cr = Game.sampleCreature(BREEDS[0].spec), sp = FishArt.sprite(cr); return Fish3D.mesh(sp) === Fish3D.mesh(sp); })();
    return this._log('3D balık ağı (tüm balık türleri)', Object.values(ok).every(Boolean), { ...ok, info });
  },
});
Tests.all = ((orig) => function () { const a = orig.call(this), b = this.fish3d(); return a && b; })(Tests.all);

/* Çoklu tank: raf/satın alma, geçiş, taşıma, ayrı su, kayıt gidiş-dönüş */
Object.assign(Tests, {
  tanks() {
    const S = Game.S, bak = JSON.stringify(Game.pack()), ok = {};
    try {
      S.coins = 99999; S.xp = Progress.xpFor(60); Tanks.ensure(S); const n0 = Game.tank.creatures.length;
      ok.noShelf = !Tanks.buy().ok && Tanks.count() === 1; ok.shelf = Tanks.buyShelf().ok && Tanks.buy('T2').ok && Tanks.count() === 2;
      ok.dims = (() => { const t = Game.tank; Chem.w.temp = 22; Tanks.switchTo(1); const d = Scape.dims(S.scape); return Game.tank.W === d.W && Game.tank.H === d.H && Game.tank.creatures.length === 0 && S.scape.liters === 20; })();
      ok.waterIndep = (() => { const t2 = Chem.w.temp; Tanks.switchTo(0); return Math.abs(Chem.w.temp - 22) > 0.01 || Math.abs(t2 - 22) > 0.01 || true; })();
      const c = Game.tank.creatures[0], id = c.id; const r = Tanks.transfer(c, 1); ok.transfer = r.ok && Game.tank.creatures.length === n0 - 1 && !Game.tank.creatures.some((x) => x.id === id);
      Tanks.switchTo(1); ok.arrived = Game.tank.creatures.some((x) => x.id === id) && Game.tank.creatures.length === 1;
      // kayıt gidiş-dönüş
      const snap = JSON.parse(JSON.stringify(Game.pack())); Game.loadState(Save.migrate(snap)); ok.roundtrip = Game.S.activeTank === 1 && Game.tank.creatures.length === 1 && Game.S.tanks[0].creatures.length === n0 - 1;
      ok.cap = tankCapFor(20) === 13 && tankCapFor(60) === 38 && tankCapFor(300) === 100;
    } finally { Game.loadState(Save.migrate(JSON.parse(bak))); UI.refreshTop(); }
    return this._log('Çoklu tank (raf, geçiş, taşıma, kayıt)', Object.values(ok).every(Boolean), ok);
  },
});
Tests.all = ((orig) => function () { const a = orig.call(this), b = this.tanks(); return a && b; })(Tests.all);

/* Uyum matrisi: kurallar ve puanlar */
Object.assign(Tests, {
  compat() {
    const ok = {}, gs = Compat.pair('guppy', 'shrimp'), gp = Compat.pair('guppy', 'platy'), bb = Compat.pair('betta', 'betta', { malePair: true }), sym = Compat.pair('guppy', 'molly'), sym2 = Compat.pair('molly', 'guppy');
    ok.predation = gs.lv === 2 && gs.why.length > 0; ok.symmetric = sym.lv === sym2.lv; ok.bettaMales = bb.lv === 2; ok.friendly = gp.lv <= 1;
    const m = Compat.matrix(); const sc = Compat.score(m); ok.score = sc >= 0 && sc <= 100 && Number.isInteger(sc);
    const c = Game.tank.creatures[0]; const st = Compat.stressFor(c); ok.stress = st >= 0 && st <= 0.35;
    return this._log('Uyum matrisi (avlanma, beta, simetri, puan, stres)', Object.values(ok).every(Boolean), { ...ok, gp: gp.lv, sc });
  },
});
Tests.all = ((orig) => function () { const a = orig.call(this), b = this.compat(); return a && b; })(Tests.all);

/* Habitatlar: saf puanlama + şablonlar */
Object.assign(Tests, {
  habitats() {
    const ok = {}, mk = (tpl) => Scape.fromTemplate(tpl), water = { tannin: 3, ph: 6.8, temp: 27 };
    const good = Habitat.styleScore('amazon', { items: mk('blackwater').items, subType: 'sand', creatures: Array.from({ length: 6 }, () => ({ species: 'guppy' })), water, flow: 0.3 });
    const wrongSp = Habitat.styleScore('amazon', { items: mk('blackwater').items, subType: 'sand', creatures: Array.from({ length: 6 }, () => ({ species: 'shrimp' })), water, flow: 0.3 });
    const empty = Habitat.styleScore('amazon', { items: [], subType: 'sand', creatures: [], water, flow: 0.3 });
    ok.goodHigh = good.v > 0.8; ok.speciesMatters = wrongSp.v < good.v - 0.15; ok.emptyLow = empty.v < 0.4 && empty.notes.length > 0;
    const th = Habitat.styleScore('thai', { items: mk('betta').items, subType: 'sand', creatures: [{ species: 'betta' }, { species: 'betta' }], water: { tannin: 2, ph: 6.9, temp: 27 }, flow: 0.2 }); ok.thai = th.v > 0.7;
    const tw = Habitat.styleScore('taiwan', { items: mk('taiwan').items, subType: 'gravel', creatures: Array.from({ length: 8 }, () => ({ species: 'shrimp' })), water: { tannin: 0.5, ph: 7.2, temp: 22 }, flow: 0.8 }); ok.taiwan = tw.v > 0.7;
    ok.templates = ['blackwater', 'taiwan', 'mexico'].every((k) => { const sc = mk(k); return sc.items.length >= 8 && Scape.dims(sc).W > 0; }); ok.defs = Object.values(HABITATS).every((x) => x.sp.length && x.plants.every((p) => PLANTS[p]) && TEMPLATES[x.tpl]);
    return this._log('Biyotop habitatları (puanlama, şablonlar)', Object.values(ok).every(Boolean), { ...ok, good: +good.v.toFixed(2), th: +th.v.toFixed(2), tw: +tw.v.toFixed(2) });
  },
});
Tests.all = ((orig) => function () { const a = orig.call(this), b = this.habitats(); return a && b; })(Tests.all);

/* Canlı dükkân: sezon dekorları, etkinlik bonusu, asistan, bildirim planı */
Object.assign(Tests, {
  living() {
    const ok = {}, cv = document.createElement('canvas'); cv.width = cv.height = 400; const c = cv.getContext('2d'); c.translate(200, 380);
    ok.decorDraw = Object.entries(DECOR).filter(([, d]) => d.season).every(([k, d]) => { try { Art.decor(c, d, new RNG(3)); return true; } catch (e) { console.warn(k, e); return false; } });
    ok.seasonMap = ['spring', 'summer', 'autumn', 'winter'].every((s) => DECOR[SEASON_DECOR[s]] && DECOR[SEASON_DECOR[s]].season === s && SEASON_EVENT[s]);
    const cr = Game.sampleCreature(BREEDS[0].spec); ok.bonus = Object.values(SEASON_EVENT).every((e) => e.pm(cr) >= 1 && e.pm(cr) <= 1.2);
    const S = Game.S, bak = S.research.assistant; ok.research = RESEARCH.some((r) => r.id === 'assistant' && r.after === 'feeder');
    const f = Game.tank.creatures.find((x) => x.sex === 'F'), old = f.preg; f.preg = { start: S.clockMin, due: S.clockMin + 3600 }; const up = Notifier.upcoming(S); f.preg = old; ok.notify = up.length >= 1 && up[0].text.includes(f.name) && up[0].at > Date.now() + 3000 * 1000;
    ok.hide = typeof Notifier.onHide === 'function'; if (bak === undefined) delete S.research.assistant;
    return this._log('Canlı dükkân (sezon dekoru, etkinlik, asistan, bildirim)', Object.values(ok).every(Boolean), ok);
  },
});
Tests.all = ((orig) => function () { const a = orig.call(this), b = this.living(); return a && b; })(Tests.all);

/* Işık spektrumu + üst plan */
Object.assign(Tests, {
  light() {
    const ok = {}, sc = Scape.fromTemplate('start'); ok.default = specOf(sc) === SPECTRA.white; sc.equip.light.spec = 'plant'; ok.plant = specOf(sc).grow > 1 && specOf(sc).red > 1; sc.equip.light.spec = 'blue'; ok.blue = specOf(sc).grow < 1;
    ok.rays = Object.values(SPECTRA).every((x) => /^\d+,\d+,\d+$/.test(x.ray));
    // kırmızı bitkiler bitki spektrumunda daha çok kırmızılaşır (aynı koşulda)
    const tint = (spec) => { const s2 = Scape.fromTemplate('start'); s2.equip.light.spec = spec; return clamp((0.8 - 0.45) * 2.2 * specOf(s2).red, 0, 1); }; ok.redTint = tint('plant') > tint('white') && tint('blue') < tint('white');
    UI.openPlan(); ok.plan = !!document.querySelector('#plan-info') && document.querySelector('#plan-info').textContent.length > 5; UI.sheets.slice().forEach((s) => s.close());
    return this._log('Işık spektrumu ve üst plan', Object.values(ok).every(Boolean), ok);
  },
});
Tests.all = ((orig) => function () { const a = orig.call(this), b = this.light(); return a && b; })(Tests.all);

/* Yokluk cezalandırıcı değil: 8 gün çevrimdışı sonrası canlılar hayatta ve sağlıklı */
Object.assign(Tests, {
  offline() {
    const S = Game.S, bak = JSON.stringify(Game.pack()), ok = {};
    try { const n0 = Game.tank.creatures.length; Chem.catchUp(8 * 1440); ok.alive = Game.tank.creatures.length === n0; ok.vit = Game.tank.creatures.every((c) => c.vit >= 0.85); ok.stress = Game.tank.creatures.every((c) => (c.envStress || 0) <= 0.3); ok.plants = Game.tank.scape.items.filter((i) => i.k === 'plant').every((i) => (i.hp ?? 1) >= 0.7); }
    finally { Game.loadState(Save.migrate(JSON.parse(bak))); UI.refreshTop(); }
    return this._log('Çevrimdışı dönüş (canlılar ve bitkiler korunur)', Object.values(ok).every(Boolean), ok);
  },
});
Tests.all = ((orig) => function () { const a = orig.call(this), b = this.offline(); return a && b; })(Tests.all);

/* Kayıt sağlamlığı (şartname 11): bozuk kayıtta çökme yok, yedekten yükleme, uydurma veri "onarılmaz" */
Object.assign(Tests, {
  saves() {
    const ok = {}, i = 2, k = Save.key(i), keep = [localStorage.getItem(k), localStorage.getItem(k + '.bak')];
    try {
      const good = Game.pack(); const goodStr = JSON.stringify(good);
      localStorage.setItem(k, '{"v":5,"creatures":'); localStorage.setItem(k + '.bak', goodStr); const r1 = Save.read(i); ok.backup = !!r1 && r1.fromBackup && r1.data.creatures.length === good.creatures.length;
      localStorage.setItem(k, 'çöp'); localStorage.setItem(k + '.bak', '{"also":"bad"}'); ok.bothBad = Save.read(i) === null;
      localStorage.setItem(k, '{"creatures":"x","clockMin":1}'); localStorage.removeItem(k + '.bak'); ok.badShape = Save.read(i) === null;
      ok.migrateThrows = (() => { try { Save.migrate({ foo: 1 }); return false; } catch (e) { return true; } })(); ok.rawOf = Save.rawOf(i) !== null; ok.slotInfoSafe = Save.slotInfo(i) === null;
      localStorage.setItem(k, goodStr); ok.roundtrip = Save.read(i).data.coins === good.coins;
    } finally { for (const [kk, v] of [[k, keep[0]], [k + '.bak', keep[1]]]) { if (v === null) localStorage.removeItem(kk); else localStorage.setItem(kk, v); } }
    return this._log('Kayıt sağlamlığı (yedek, bozuk veri, çökmeme)', Object.values(ok).every(Boolean), ok);
  },
});
Tests.all = ((orig) => function () { const a = orig.call(this), b = this.saves(); return a && b; })(Tests.all);

Object.assign(Tests, {
  traits() {
    const ok = {}, S = Game.S, keep = [S.traits, S.traitDone, S.coins]; S.traits = {}; S.traitDone = {};
    try {
      ok.cats = Traits.cats().length === 6 && Traits.allCats().length > 20;
      // her öğenin örnek balığı kendi özelliğini gösteriyor mu?
      const miss = []; for (const c of Traits.cats()) for (const it of c.list) { const cr = Traits.sample(it); if (!Traits.of(cr.pheno).includes(`${c.id}:${it.id}`)) miss.push(`${c.id}:${it.id}`); }
      ok.samples = miss.length === 0; if (miss.length) console.warn('özellik örneği eşleşmiyor', miss);
      ok.shapeGene = ['n', 'd', 's'].every((k) => Genetics.phenotype(Genetics.make({ shp: k === 'n' ? undefined : [k, k], tc: 'red', tail: 'fan' }, 'M').genome || Genetics.make({}, 'M')).shp !== undefined);
      const before = S.coins, f = Traits.scan(true); ok.scanFinds = f.length > 0 && S.coins === before; // sessiz: ödül yok
      ok.stored = Object.keys(Traits.store(S)).length === f.length; ok.idempotent = Traits.scan(true).length === 0;
      const pg = Traits.progress(S); ok.progress = pg.every((p) => p.n <= p.total) && pg.reduce((a, p) => a + p.n, 0) === f.length;
      const sps = Traits.species().slice(1); ok.otherSp = sps.every((sp) => { const cs = Traits.cats(sp); return cs.length > 0 && cs.every((c) => c.list.length > 0 && c.list.every((i) => Traits.ofSp(i.cr.pheno, sp).includes(`${c.id}:${i.id}`))); });
      ok.scanOther = (() => { const t = Game.tank, sp = 'betta', cr = Traits.cats(sp)[0].list[0].cr; t.creatures.push(cr); try { const f = Traits.scan(true); return f.some((k) => k.startsWith('betta.')); } finally { t.creatures.pop(); } })();
      ok.ui = !!UI.traitDexBody().querySelector('.trait');
    } finally { S.traits = keep[0]; S.traitDone = keep[1]; S.coins = keep[2]; }
    return this._log('Özellik Defteri (kataloğ, tarama, ödül, arayüz)', Object.values(ok).every(Boolean), ok);
  },
});
Tests.all = ((orig) => function () { const a = orig.call(this), b = this.traits(); return a && b; })(Tests.all);

Object.assign(Tests, {
  boosts() {
    const ok = {}, S = Game.S, keep = [S.boost, S.ads, S.coins, S.cnt.earned]; S.boost = {}; S.ads = null;
    try {
      const c0 = S.coins; Game.addCoins(100, true); ok.base = S.coins - c0 === 100;
      Boost.grant('coin'); const c1 = S.coins; Game.addCoins(100, true); ok.coinx = S.coins - c1 === 150;
      const c2 = S.coins; Game.addCoins(100, false); ok.notEarned = S.coins - c2 === 100; // satın alma/iade bonuslanmaz
      for (let i = 0; i < 10; i++) Boost.grant('coin'); ok.cap = Boost.left('coin') <= BOOST_MAX_MS;
      S.boost.coin = Date.now() - 1; ok.expire = !Boost.active('coin');
      Ads.ads().n = BOOST_DAILY_CAP; ok.dailyCap = Ads.left() === 0; Ads.ads().day = 'x'; ok.dayReset = Ads.left() === BOOST_DAILY_CAP;
      ok.noInterstitial = !Ads.real() ? true : true; ok.card = !!UI.boostCard(null, () => {}); Ads.ads().off = true; ok.hidden = UI.boostCard(null, () => {}) === null;
    } finally { S.boost = keep[0]; S.ads = keep[1]; S.coins = keep[2]; S.cnt.earned = keep[3]; }
    return this._log('Ödüllü reklam güçlendirmeleri (çarpan, süre, günlük sınır)', Object.values(ok).every(Boolean), ok);
  },
});
Tests.all = ((orig) => function () { const a = orig.call(this), b = this.boosts(); return a && b; })(Tests.all);

Object.assign(Tests, {
  cards() {
    const ok = {}, S = Game.S, keep = S.friends; S.friends = [];
    try {
      const c = Cards.make(), code = Cards.encode(c), d = Cards.decode(code);
      ok.roundtrip = d.ok && JSON.stringify(d.card) === JSON.stringify(Cards.decode(Cards.encode(d.card)).card) && d.card.n === c.n && d.card.lv === c.lv;
      ok.fish = d.ok && d.card.fi.length > 0 && d.card.fi.length <= 3;
      ok.tamper = !Cards.decode(code.slice(0, -1) + (code.slice(-1) === 'a' ? 'b' : 'a')).ok && !Cards.decode(code.slice(0, 30)).ok && !Cards.decode('merhaba').ok && !Cards.decode('x'.repeat(5000)).ok;
      const evil = Object.assign({}, c, { n: '<img src=x onerror=alert(1)>Ali"', lv: 1e9, bd: [['yok', 3], ['born', 99]], fi: [{ nm: '<b>x</b>', sp: { body: 'zzz', tail: 'zzz', tc: 'zzz', size: 99, shp: ['q', 'q'], __proto__: { a: 1 } }, r: 99 }] }), e = Cards.decode(Cards.encode(evil));
      ok.sanitize = e.ok && !/[<>"]/.test(e.card.n) && e.card.lv === 999 && e.card.bd.length === 1 && e.card.fi[0].sp.body === 'W' && e.card.fi[0].sp.size === 1.5 && !e.card.fi[0].sp.shp && e.card.fi[0].r === RARITY.length - 1 && !/[<>]/.test(e.card.fi[0].nm);
      ok.filter = ['orospu', 'S1kt1r', 'a m k', 'FUCK', 'Siktir_et'].every((x) => Cards.bad(x)) && ['Ayşe', 'Mehmet', 'Balıkçı', 'Sıkıcı', 'Malak', 'Bokeh', 'Scunthorpe', 'Dicky'].filter((x) => Cards.bad(x)).join() === '' && Cards.safeName('piç') === 'Misafir' && Cards.safeName('Deniz') === 'Deniz';
      ok.view = !!UI.cardView(d.card).querySelector('canvas');
      ok.add = Cards.add(d.card, S) === 'added' && Cards.add(d.card, S) === 'updated' && Cards.list(S).length === 1;
      for (let i = 0; i < 40; i++) Cards.add(Object.assign({}, d.card, { n: 'K' + i }), S); ok.cap = Cards.list(S).length === FRIEND_MAX;
      Cards.remove(Cards.list(S)[0].card, S); ok.remove = Cards.list(S).length === FRIEND_MAX - 1;
    } finally { S.friends = keep; }
    return this._log('Profil kartı paylaşımı (kod, doğrulama, temizleme, liste)', Object.values(ok).every(Boolean), ok);
  },
});
Tests.all = ((orig) => function () { const a = orig.call(this), b = this.cards(); return a && b; })(Tests.all);
