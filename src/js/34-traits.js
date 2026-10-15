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

const Traits = {
  _s: new Map(), cats() { return this._cats || (this._cats = TRAIT_CATS.map((c) => ({ ...c, list: c.items() }))); },
  store(S = Game.S) { return S.traits || (S.traits = {}); },
  /** Bir fenotipin gösterdiği özellik kimlikleri ('cat:id'). */
  of(p) {
    if (!p || (p.sp && p.sp !== 'guppy')) return [];
    const o = [`tail:${p.tail}`, `body:${p.body}`, `shape:${p.shp || 'n'}`, `size:${p.size < 0.9 ? 'small' : p.size >= 1.13 ? 'big' : 'mid'}`];
    if (p.tailColor && p.tailColor !== 'none') o.push(`tcol:${p.tailColor}`); if (p.tailColor2) o.push(`tcol:${p.tailColor2}`);
    for (const k of ['tux', 'sb', 'st', 'grass', 'mosaic', 'moscow']) if (p[k]) o.push(`pat:${k}`); if (p.purple) o.push('pat:purple'); if (p.metal) o.push('pat:metal');
    return o;
  },
  find(key) { const [c, id] = key.split(':'); const cat = this.cats().find((x) => x.id === c); return cat ? { cat, item: cat.list.find((i) => i.id === id) } : null; },
  progress(S = Game.S) { const st = this.store(S); return this.cats().map((c) => ({ c, n: c.list.filter((i) => st[`${c.id}:${i.id}`]).length, total: c.list.length })); },
  /** Tüm canlıları tara; yeni özellik varsa ödül ver. quiet: toast/ses yok. */
  scan(quiet) {
    const S = Game.S, st = this.store(S), crs = [...Game.tank.creatures, ...(S.qFish || [])], found = [];
    for (const c of crs) { if (c.species !== 'guppy') continue; for (const k of this.of(c.pheno)) if (!st[k]) { st[k] = { t: S.clockMin, by: c.name }; found.push(k); } }
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
  sample(item) { let c = this._s.get(item.id + JSON.stringify(item.spec)); if (!c) { c = Game.sampleCreature(item.spec); this._s.set(item.id + JSON.stringify(item.spec), c); } return c; },
};

/* Keşif taraması: açılışta sessiz, sonrasında her canlı değişikliğinde */
Game.checkDiscoveries = ((orig) => function (silent) { const r = orig.apply(this, arguments); try { Traits.scan(!!silent); } catch (e) { console.warn('Özellik taraması', e); } return r; })(Game.checkDiscoveries);
ACHIEVEMENTS.push({ id: 'traits', name: 'Özellik Avcısı', ic: '🧬', desc: 'Özellik Defteri\'ni doldur', tiers: [8, 16, 28], get: (S) => Object.keys(Traits.store(S)).length });

/* Ansiklopedi > Özellikler */
Object.assign(UI, {
  traitDexBody() {
    const S = Game.S, st = Traits.store(S), pr = Traits.progress(S), tot = pr.reduce((a, p) => a + p.n, 0), all = pr.reduce((a, p) => a + p.total, 0);
    return h('div.stack', null, h('div.card.small', null, h('b', null, `Özellik Defteri · ${tot}/${all}`), h('div.muted', null, 'Irk ismi olmasa da bir balıkta ilk kez görülen her özellik burada kaydedilir. Karışık özellikli yavrular da sayılır.')),
      ...pr.map(({ c, n, total }) => h('div.card', null, h('div.row', null, h('div', { style: { fontSize: '26px' } }, c.emo), h('div.sp', null, h('b', null, c.name), h('div.tiny.muted', null, c.hint)), h('span.pill', { style: n === total ? { color: 'var(--ok)' } : null }, `${n}/${total}`)),
        h('div.trait-grid', null, ...c.list.map((it) => { const got = !!st[`${c.id}:${it.id}`], rr = RARITY[it.r || 0], cr = Traits.sample(it), cv = got ? UI.thumbCv(cr, 96) : UI.silhouette(cr, 96);
          return h('div.trait' + (got ? '' : '.lock'), { style: { '--c': rr.color }, title: got ? `${it.name} · ilk: ${st[`${c.id}:${it.id}`].by}` : 'Henüz keşfedilmedi' }, cv, h('b', null, got ? it.name : '???'), h('span.tiny', { style: { color: rr.color } }, got ? rr.icon + ' ' + rr.name : 'Keşfedilmedi')); })))));
  },
});
