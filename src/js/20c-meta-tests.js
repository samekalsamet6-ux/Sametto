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
