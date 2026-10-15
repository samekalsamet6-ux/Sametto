'use strict';
/* =====================================================================
   34 · ÖZELLİK DEFTERİ — Irk isimlerinden bağımsız, tek tek özellik koleksiyonu:
   kuyruk şekli, kuyruk rengi, gövde rengi, desen, gövde şekli, boy sınıfı.
   Bir özellik bir balıkta ilk kez görülünce keşfedilir (isimsiz/karışık kombinasyonlar dahil),
   küçük ödül verir; kategori tamamlanınca bonus. Ansiklopedi > Özellikler sekmesi.
   (Şimdilik lepistes; diğer türler için genişletilebilir.)
   ===================================================================== */
const TRAIT_RARITY_TAIL = { lyre: 2, crown: 2, lace: 2, halfmoon: 2, doublesword: 1, topsword: 1, bottomsword: 1, spade: 1, veil: 0, round: 0, fan: 0, delta: 0 };
const TRAIT_CATS = [
  { id: 'tail', name: 'Kuyruk şekli', emo: '🎏', hint: 'Kuyruk tipi otozomal bir gendir; mutasyon ve çeşitli ebeveynlerle yeni şekiller çıkar.',
    items: () => TAIL_RANK.map((k) => ({ id: k, name: TAILS[k].name, spec: { tail: k, tc: 'blue' }, r: TRAIT_RARITY_TAIL[k] ?? 1 })) },
  { id: 'tcol', name: 'Kuyruk rengi', emo: '🎨', hint: 'Kuyruk rengi cinsiyet kromozomlarındadır: erkekte görünür, dişi gizlice taşır.',
    items: () => Object.keys(TAILCOL).filter((k) => k !== 'none').map((k) => ({ id: k, name: TAILCOL[k].name, spec: { tc: k, tail: 'delta' }, r: ['red', 'blue'].includes(k) ? 0 : 1 })) },
  { id: 'body', name: 'Gövde rengi', emo: '🐟', hint: 'Gövde rengi otozomal çekinik genlerle belirlenir (Albino, Blond, Golden, Blue…).',
    items: () => BODY_RANK.map((k) => ({ id: k, name: BODY[k].name, spec: { body: k, tc: 'red', tail: 'delta' }, r: { W: 0, alb: 1, bld: 1, gld: 1, blu: 1, pnk: 2, obs: 3, aur: 4 }[k] ?? 1 })) },
  { id: 'pat', name: 'Desen', emo: '🔶', hint: 'Desen genlerinin çoğu Y kromozomuna bağlıdır; erkeklerde görünür.',
    items: () => [['tux', 'Tuxedo', { tux: 1 }, 1], ['sb', 'Yılan derisi (gövde)', { sb: 1 }, 2], ['st', 'Yılan derisi (kuyruk)', { st: 1 }, 2], ['grass', 'Grass', { grass: 1 }, 1], ['mosaic', 'Mozaik', { mosaic: 1 }, 1], ['moscow', 'Moscow', { moscow: 1, tc: 'blue' }, 2], ['purple', 'Mor gövde', { purple: 1 }, 2], ['metal', 'Metalik', { metal: 1 }, 3]].map(([id, name, sp, r]) => ({ id, name, spec: Object.assign({ tc: 'red', tail: 'delta' }, sp), r })) },
  { id: 'shape', name: 'Gövde şekli', emo: '⚖️', hint: 'Gövde şekli yeni bir gendir: Normal baskın; Derin ve İnce çekinik. İki taşıyıcıyı eşleştir!',
    items: () => [['n', 'Normal', {}, 0], ['d', 'Derin gövde', { shp: 'd' }, 1], ['s', 'İnce gövde', { shp: 's' }, 1]].map(([id, name, sp, r]) => ({ id, name, spec: Object.assign({ tc: 'red', tail: 'fan' }, sp), r })) },
  { id: 'size', name: 'Boy sınıfı', emo: '📏', hint: 'Boy nicel (poligenik) bir özelliktir: ebeveyn ortalaması + sapma. Seçilim yaparak uç değerlere ulaş.',
    items: () => [['small', 'Minyon', { size: 0.8 }, 1], ['mid', 'Orta boy', {}, 0], ['big', 'İri', { size: 1.27 }, 1]].map(([id, name, sp, r]) => ({ id, name, spec: Object.assign({ tc: 'red', tail: 'fan' }, sp), r })) },
];

/* Diğer türler: [kategori, ad, emoji, ipucu, fenotip alanı, [[değer, ad, nadirlik]]] — örnek balık, o özelliği gösteren ilk varyasyondan seçilir. */
const SP_TRAITS = {
  molly: [['tail', 'Kuyruk şekli', '🎏', 'Lir kuyruk nadir ve değerlidir.', 'tail', [['fan', 'Yelpaze', 0], ['lyre', 'Lir kuyruk', 2]]], ['col', 'Gövde rengi', '🎨', 'Renk lokusu: yabani, altın, beyaz, turuncu.', 'colId', [['W', 'Yabani', 0], ['gold', 'Altın', 1], ['white', 'Beyaz', 1], ['orange', 'Turuncu', 2]]], ['cls', 'Desen', '🔶', 'Siyah, mermer ve dalmaçyalı desenler.', 'cls', [['black', 'Siyah', 1], ['marble', 'Mermer', 2], ['dalm', 'Dalmaçyalı', 3]]], ['bal', 'Gövde şekli', '⚖️', 'Balon moli yuvarlak, kısa gövdelidir.', 'bal', [['true', 'Balon gövde', 2]]]],
  endler: [['body', 'Gövde rengi', '🐟', 'Yabani, altın ve albino gövde.', 'body', [['W', 'Yabani', 0], ['gld', 'Golden', 1], ['alb', 'Albino', 2]]], ['tcol', 'Kuyruk rengi', '🎨', 'Turuncu ve yeşil kuyruk lekeleri.', 'tailColor', [['orange', 'Turuncu', 0], ['green', 'Yeşil', 1]]], ['pat', 'Desen', '🔶', 'Kaplan, kobra ve bar desenleri.', 'pat', [['tiger', 'Kaplan', 1], ['cobra', 'Kobra', 2], ['bar', 'Bar', 1]]], ['hyb', 'Melez', '🧬', 'Lepistes ile melez soy.', 'hybrid', [['true', 'Melez', 2]]]],
  platy: [['body', 'Gövde rengi', '🐟', 'Yabani veya albino.', 'body', [['W', 'Yabani', 0], ['alb', 'Albino', 1]]], ['col', 'Renk', '🎨', 'Kırmızı, mavi ve sarı plati.', 'colId', [['red', 'Kırmızı', 0], ['blue', 'Mavi', 1], ['yellow', 'Sarı', 1]]], ['pat', 'Desen', '🔶', 'Nokta, Mickey, Comet, Moon ve İki Nokta.', 'patId', [['sp', 'Benekli', 0], ['mickey', 'Mickey', 2], ['comet', 'Comet', 2], ['moon', 'Moon', 2], ['twospot', 'İki nokta', 1]]], ['wag', 'Yüzgeç', '🌊', 'Wag platilerin yüzgeçleri siyahtır.', 'wag', [['true', 'Wag', 2]]]],
  swordtail: [['tail', 'Kuyruk şekli', '🎏', 'Kılıç ya da lir.', 'tail', [['bottomsword', 'Kılıç', 0], ['lyre', 'Lir', 2]]], ['col', 'Renk', '🎨', 'Limon, kırmızı ve albino.', 'colId', [['lemon', 'Limon', 1], ['red', 'Kırmızı', 0], ['alb', 'Albino', 2]]], ['wag', 'Yüzgeç', '🌊', 'Siyah yüzgeçli wag.', 'wag', [['true', 'Wag', 2]]], ['pine', 'Pul', '🌲', 'Çam kozalağı pul dokusu.', 'pine', [['true', 'Çam kozalağı', 3]]]],
  betta: [['tail', 'Kuyruk şekli', '🎏', 'Beta yüzgeç tipleri.', 'tail', [['veil', 'Veil', 0], ['plakat', 'Plakat', 0], ['halfmoon', 'Halfmoon', 2], ['crown', 'Crown', 2], ['double', 'Double', 3]]], ['col', 'Renk', '🎨', 'Ana vücut rengi.', 'colId', [['B', 'Mavi', 0], ['R', 'Kırmızı', 0], ['Y', 'Sarı', 1], ['K', 'Siyah', 2], ['Wh', 'Beyaz', 2]]], ['pat', 'Desen', '🔶', 'Ejder, koi, kelebek ve iki renkli.', 'patId', [['dragon', 'Ejder', 3], ['koi', 'Koi', 2], ['butterfly', 'Kelebek', 2], ['bi', 'İki renkli', 1]]], ['x', 'Özel', '✨', 'Metalik, dumbo ve mermer.', 'metal', [['true', 'Metalik', 3]]], ['dumbo', 'Kulak', '👂', 'Dumbo betaların göğüs yüzgeçleri büyüktür.', 'dumbo', [['true', 'Dumbo', 2]]], ['marble', 'Mermer', '🪨', 'Mermer renk deseni.', 'marble', [['true', 'Mermer', 3]]]],
  shrimp: [['col', 'Renk', '🎨', 'Neocaridina renk formları.', 'shrimpCol', [['wild', 'Yabani', 0], ['red', 'Kırmızı', 0], ['orange', 'Turuncu', 1], ['yellow', 'Sarı', 1], ['green', 'Yeşil', 1], ['blue', 'Mavi', 2], ['bloody', 'Kanlı', 2], ['black', 'Siyah', 3]]], ['rili', 'Desen', '🔶', 'Rili: saydam bölgeli şık desen.', 'rili', [['true', 'Rili', 2]]], ['grade', 'Kalite', '⭐', 'C → A → B → S kalite sınıfı.', 'grade', [['C', 'C sınıfı', 0], ['A', 'A sınıfı', 1], ['B', 'B sınıfı', 2], ['S', 'S sınıfı', 3]]]],
  snail: [['shell', 'Kabuk rengi', '🐚', 'Salyangoz kabuk renkleri.', 'shell', [['ivory', 'Fildişi', 0], ['choc', 'Çikolata', 1], ['gold', 'Altın', 1], ['blue', 'Mavi', 2], ['purple', 'Mor', 2], ['black', 'Siyah', 3]]], ['body', 'Vücut rengi', '🎨', 'Koyu, normal ve soluk vücut.', 'bodyT', [['normal', 'Normal', 0], ['dark', 'Koyu', 1], ['pale', 'Soluk', 1]]]],
};
const Traits = {
  _s: new Map(), _sp: {}, sp: 'guppy',
  species() { return ['guppy', ...Object.keys(SP_TRAITS)]; },
  /** Türün kategorileri; diğer türlerde örnek balık yoksa o öğe listeden düşer. */
  cats(sp = 'guppy') {
    if (sp === 'guppy') return this._cats || (this._cats = TRAIT_CATS.map((c) => ({ ...c, list: c.items() })));
    if (this._sp[sp]) return this._sp[sp];
    const bs = breedsOf(sp), found = {};
    for (const b of bs) for (const sex of ['M', 'F']) { const c = Game.sampleCreature(Object.assign({ sex }, b.spec)); for (const k of this.ofSp(c.pheno, sp)) if (!found[k]) found[k] = c; }
    return this._sp[sp] = SP_TRAITS[sp].map(([id, name, emo, hint, , vals]) => ({ id: sp + '.' + id, name, emo, hint, sp, list: vals.map(([v, nm, r]) => ({ id: v, name: nm, r, cr: found[`${sp}.${id}:${v}`] })).filter((i) => i.cr) })).filter((c) => c.list.length);
  },
  ofSp(p, sp) { const o = []; if (!p) return o; for (const [id, , , , f, vals] of SP_TRAITS[sp] || []) { const v = String(p[f]); if (vals.some(([x]) => x === v)) o.push(`${sp}.${id}:${v}`); } return o; },
  allCats() { return this.species().flatMap((sp) => this.cats(sp)); },
  store(S = Game.S) { return S.traits || (S.traits = {}); },
  /** Bir fenotipin gösterdiği özellik kimlikleri ('cat:id'). */
  of(p) {
    if (!p || (p.sp && p.sp !== 'guppy')) return [];
    const o = [`tail:${p.tail}`, `body:${p.body}`, `shape:${p.shp || 'n'}`, `size:${p.size < 0.9 ? 'small' : p.size >= 1.13 ? 'big' : 'mid'}`];
    if (p.tailColor && p.tailColor !== 'none') o.push(`tcol:${p.tailColor}`); if (p.tailColor2) o.push(`tcol:${p.tailColor2}`);
    for (const k of ['tux', 'sb', 'st', 'grass', 'mosaic', 'moscow']) if (p[k]) o.push(`pat:${k}`); if (p.purple) o.push('pat:purple'); if (p.metal) o.push('pat:metal');
    return o;
  },
  find(key) { const [c, id] = key.split(':'); const cat = this.allCats().find((x) => x.id === c); return cat ? { cat, item: cat.list.find((i) => i.id === id) } : null; },
  progress(S = Game.S, sp) { const st = this.store(S); return (sp ? this.cats(sp) : this.allCats()).map((c) => ({ c, n: c.list.filter((i) => st[`${c.id}:${i.id}`]).length, total: c.list.length })); },
  /** Tüm canlıları tara; yeni özellik varsa ödül ver. quiet: toast/ses yok. */
  scan(quiet) {
    const S = Game.S, st = this.store(S), crs = [...Game.tank.creatures, ...(S.qFish || [])], found = [];
    for (const c of crs) { for (const k of c.species === 'guppy' ? this.of(c.pheno) : this.ofSp(c.pheno, c.species)) if (!st[k]) { st[k] = { t: S.clockMin, by: c.name }; found.push(k); } }
    if (!found.length) return found;
    for (const k of found) { const f = this.find(k); if (!f || !f.item) continue; const rw = [10, 25, 50, 90, 150][f.item.r] || 10;
      if (!quiet) { Game.addCoins(rw, true); Game.addXp(10 + f.item.r * 15); }
      if (!quiet) { const pg = this.progress(S).find((x) => x.c.id === f.cat.id); UI.toast(`${f.cat.emo} Yeni özellik: ${f.item.name}! (${f.cat.name} ${pg.n}/${pg.total})`, 'star', 4200); AudioSys.SFX.discover(f.item.r); Game.notify('trait', `Yeni özellik: ${f.item.name}`); } }
    // kategori tamamlama bonusu
    const done = (S.traitDone = S.traitDone || {});
    for (const p of this.progress(S)) if (p.n === p.total && !done[p.c.id]) { done[p.c.id] = 1; if (!quiet) { Game.addCoins(150, true); Game.addXp(100); UI.toast(`🏅 ${p.c.name} koleksiyonu tamamlandı! +150 💰`, 'star', 5000); } }
    if (this.progress(S).every((p) => p.n === p.total) && !done.all) { done.all = 1; if (!quiet) { S.stone = (S.stone || 0) + 3; UI.toast('🌟 Tüm özellikler toplandı! +3 Yosun Taşı', 'star', 6000); } }
    Ach.check(); return found;
  },
  sample(item) { if (item.cr) return item.cr; let c = this._s.get(item.id + JSON.stringify(item.spec)); if (!c) { c = Game.sampleCreature(item.spec); this._s.set(item.id + JSON.stringify(item.spec), c); } return c; },
};

/* Keşif taraması: açılışta sessiz, sonrasında her canlı değişikliğinde */
Game.checkDiscoveries = ((orig) => function (silent) { const r = orig.apply(this, arguments); try { Traits.scan(!!silent); } catch (e) { console.warn('Özellik taraması', e); } return r; })(Game.checkDiscoveries);
ACHIEVEMENTS.push({ id: 'traits', name: 'Özellik Avcısı', ic: '🧬', desc: 'Özellik Defteri\'ni doldur', tiers: [10, 30, 60], get: (S) => Object.keys(Traits.store(S)).length });

/* Ansiklopedi > Özellikler */
Object.assign(UI, {
  traitDexBody() {
    const S = Game.S, st = Traits.store(S), pa = Traits.progress(S), pr = Traits.progress(S, Traits.sp), tot = pa.reduce((a, p) => a + p.n, 0), all = pa.reduce((a, p) => a + p.total, 0);
    const chips = h('div.chips', null, Traits.species().map((sp) => { const q = Traits.progress(S, sp), n = q.reduce((a, p) => a + p.n, 0), t = q.reduce((a, p) => a + p.total, 0); return h('button.sp-chip' + (Traits.sp === sp ? '.on' : ''), { onclick: () => { Traits.sp = sp; UI.render_dex($('#s-dex')); } }, `${SPECIES.find((x) => x.id === sp).name} ${n}/${t}`); }));
    return h('div.stack', null, chips, h('div.card.small', null, h('b', null, `Özellik Defteri · ${tot}/${all}`), h('div.muted', null, 'Bir canlıda ilk kez görülen her özellik (ırk ismi olmasa da) burada kaydedilir. Üstteki simgelerle türler arasında geç.')),
      ...pr.map(({ c, n, total }) => h('div.card', null, h('div.row', null, h('div', { style: { fontSize: '26px' } }, c.emo), h('div.sp', null, h('b', null, c.name), h('div.tiny.muted', null, c.hint)), h('span.pill', { style: n === total ? { color: 'var(--ok)' } : null }, `${n}/${total}`)),
        h('div.trait-grid', null, ...c.list.map((it) => { const got = !!st[`${c.id}:${it.id}`], rr = RARITY[it.r || 0], cr = Traits.sample(it), cv = got ? UI.thumbCv(cr, 96) : UI.silhouette(cr, 96);
          return h('div.trait' + (got ? '' : '.lock'), { style: { '--c': rr.color }, title: got ? `${it.name} · ilk: ${st[`${c.id}:${it.id}`].by}` : 'Henüz keşfedilmedi' }, cv, h('b', null, got ? it.name : '???'), h('span.tiny', { style: { color: rr.color } }, got ? rr.icon + ' ' + rr.name : 'Keşfedilmedi')); })))));
  },
});
