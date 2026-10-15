'use strict';
/* =====================================================================
   20 · META — hikâye, sergiler/yarışmalar, aquascape jürisi, sezonlar,
        sabit hatlar, genetik defter, prestij ("Yeni Şube")
   Oyuncuya saygı: kaçırılan şey yok (sezon arşivi), ceza yok, rakipler adil.
   ===================================================================== */

/* ---------- Aquascape stilleri ---------- */
const STYLES = {
  nature:  { name: 'Doğa (Nature)', emo: '🌿', desc: 'Taş ve kök birlikte, 3+ bitki türü, asimetrik denge, derinlik katmanları.' },
  iwagumi: { name: 'Iwagumi', emo: '🪨', desc: 'Tek sayıda aynı cins taş (3-5-7), büyük taş (Oyaishi) üçler noktasında, baskın halı bitki, kök yok.' },
  dutch:   { name: 'Hollanda', emo: '🌸', desc: 'Zeminin ≥%80\'i bitkili, 8+ tür, taş/kök az, renkli ve katmanlı "bitki bahçesi".' },
  jungle:  { name: 'Orman (Jungle)', emo: '🌴', desc: 'Yoğun, uzun gövdeli bitkiler, yüzen bitkiler, serbest ve vahşi görünüm.' },
  biotope: { name: 'Biyotop', emo: '🏞️', desc: 'Tek tür balık sürüsü (4+), kum/çakıl, kök ve yaprak çöpü, yüzen bitki — doğadan bir kesit.' },
};
const STYLE_W = { // [üçler, denge, derinlik] bileşim ağırlıkları
  nature: [0.4, 0.25, 0.35], iwagumi: [0.55, 0.2, 0.25], dutch: [0.1, 0.3, 0.6], jungle: [0, 0.3, 0.7], biotope: [0.3, 0.3, 0.4],
};

const Judge = {
  score(style, S = Game.S) {
    const sc = S.scape, W = Game.tank.W, items = sc.items.filter((i) => !i.dead);
    const plants = items.filter((i) => i.k === 'plant'), rocks = items.filter((i) => i.k === 'rock'), woods = items.filter((i) => i.k === 'wood'), leaves = items.filter((i) => i.k === 'leaf'), decor = items.filter((i) => i.k === 'decor');
    const hard = [...rocks, ...woods], sp = new Set(plants.map((p) => p.d)), notes = [], cr = [];
    const sz = (i) => { const d = Scape.defOf(i); return d.w * d.h * (i.s || 1) * (i.s || 1); };
    const pass = (k, name, v, note) => { v = clamp(v, 0, 1); cr.push({ k, name, v: Math.round(v * 100), note }); return v; };
    /* 1) Kompozisyon */
    const foc = [...hard, ...plants.filter((p) => PLANTS[p.d].h > 150)]; let comp = 0;
    if (foc.length) {
      const tot = foc.reduce((a, i) => a + sz(i), 0), cx = foc.reduce((a, i) => a + i.fx * sz(i), 0) / tot;
      const thirds = 1 - Math.min(Math.abs(cx - 1 / 3), Math.abs(cx - 2 / 3)) / 0.17;
      const L = foc.filter((i) => i.fx < 0.5).reduce((a, i) => a + sz(i), 0), asym = Math.abs(2 * L - tot) / tot, bal = 1 - Math.abs(asym - 0.3) / 0.5;
      const layers = new Set(plants.map((p) => (PLANTS[p.d].layer === 'epi' ? 'mid' : PLANTS[p.d].layer))); if (hard.length) layers.add('mid'); const depth = Math.min(1, layers.size / 3);
      const w = STYLE_W[style]; comp = w[0] * clamp(thirds, 0, 1) + w[1] * clamp(bal, 0, 1) + w[2] * depth;
      if (thirds < 0.4 && w[0] > 0.2) notes.push('Ana kütle üçler noktasına (1/3 veya 2/3) yakın olmalı.');
      if (depth < 0.67) notes.push('Arka, orta ve ön katmanlarda bitki kullan: derinlik artar.');
    } else notes.push('Kompozisyon için taş, kök veya uzun bitki yerleştir.');
    pass('comp', 'Kompozisyon', comp);
    /* 2) Bitki sağlığı */
    const hp = plants.length ? (plants.reduce((a, p) => a + (p.hp ?? 1) * (1 - 0.5 * (p.melt || 0)), 0) / plants.length) * Math.min(1, plants.length / 3) : 0;
    if (plants.length < 3) notes.push('En az 3 bitki dik; jüri bitkisiz tankı sevmez.'); else if (hp < 0.7) notes.push('Bitkiler zayıf: ışık, CO₂ ve besini kontrol et.');
    pass('hp', 'Bitki sağlığı', hp);
    /* 3) Yosunsuzluk */
    const al = Chem.w.algae, algSum = al.green * 0.7 + al.hair + al.bba + al.cyano + al.gw;
    if (algSum > 0.25) notes.push('Yosun görünüyor: su değişimi, ışık süresi ve yosun yiyenler yardımcı olur.');
    pass('alg', 'Yosunsuzluk', 1 - clamp(algSum * 1.2, 0, 1));
    /* 4) Stil uyumu */
    let st = 0; const carp = plants.filter((p) => PLANTS[p.d].type === 'carpet'), tall = plants.filter((p) => PLANTS[p.d].h >= 150), flo = plants.filter((p) => PLANTS[p.d].type === 'float');
    const cre = Game.tank.creatures, spc = new Set(cre.map((c) => c.species));
    if (style === 'iwagumi') {
      const sorted = rocks.slice().sort((a, b) => sz(b) - sz(a)), odd = rocks.length >= 3 && rocks.length % 2 === 1, same = rocks.length > 0 && rocks.every((r) => r.d === rocks[0].d);
      const oy = sorted[0] && Math.min(Math.abs(sorted[0].fx - 1 / 3), Math.abs(sorted[0].fx - 2 / 3)) < 0.12, carpShare = plants.length ? carp.length / plants.length : 0;
      st = (odd ? 0.3 : 0) + (same ? 0.2 : 0) + (woods.length === 0 ? 0.15 : 0) + (carpShare >= 0.6 && carp.length >= 2 ? 0.2 : carpShare * 0.2) + (oy ? 0.15 : 0);
      if (!odd) notes.push('Iwagumi\'de taş sayısı tek olmalı (3, 5, 7).'); if (!same) notes.push('Aynı cins taşları kullan.'); if (woods.length) notes.push('Iwagumi\'de kök kullanılmaz.');
      if (!oy && sorted[0]) notes.push('Oyaishi (en büyük taş) üçler noktasında olmalı.'); if (carpShare < 0.6) notes.push('Halı bitkiler baskın olmalı.');
      const names = ['Oyaishi', 'Fukuishi', 'Soeishi']; if (sorted.length >= 3) notes.push('Taşların rolü: ' + sorted.slice(0, 4).map((r, i) => `${names[i] || 'Suteishi'} (${HARDSCAPE[r.d].name})`).join(', ') + '.');
    } else if (style === 'nature') {
      st = (hard.length >= 2 && hard.length <= 7 ? 0.3 : hard.length ? 0.12 : 0) + (rocks.length && woods.length ? 0.15 : 0.05) + Math.min(0.3, (sp.size / 4) * 0.3) + (sp.size <= 9 ? 0.15 : 0.05) + (decor.length === 0 ? 0.1 : 0);
      if (!hard.length) notes.push('Doğa stilinde taş veya kök gerekir.'); if (sp.size < 3) notes.push('3+ bitki türü kullan.'); if (decor.length) notes.push('Yapay dekor doğal görünümü bozar.');
    } else if (style === 'dutch') {
      const cov = clamp(plants.reduce((a, p) => a + PLANTS[p.d].w * (p.s || 1) * (p.g ?? 1), 0) / (W * 1.6), 0, 1);
      st = 0.5 * Math.min(1, cov / 0.8) + 0.3 * Math.min(1, sp.size / 8) + 0.2 * (hard.length <= 1 ? 1 : hard.length <= 3 ? 0.5 : 0);
      if (cov < 0.8) notes.push(`Zemin %${Math.round(cov * 100)} bitkili; Hollanda stili için ≥%80 gerekir.`); if (sp.size < 8) notes.push('8+ farklı bitki türü kullan.');
    } else if (style === 'jungle') {
      st = Math.min(0.4, (tall.length / 6) * 0.4) + (flo.length ? 0.2 : 0) + Math.min(0.2, (sp.size / 5) * 0.2) + (hard.length ? 0.2 : 0);
      if (tall.length < 6) notes.push('6+ uzun bitki ile yoğun bir orman kur.'); if (!flo.length) notes.push('Yüzen bitki ekle.');
    } else {
      const single = spc.size === 1 && cre.length >= 4, sandy = ['sand', 'gravel'].includes(sc.sub.type);
      st = (single ? 0.35 : 0) + (sandy ? 0.15 : 0) + (woods.length + leaves.length >= 2 ? 0.25 : 0.1 * Math.min(2, woods.length + leaves.length)) + (flo.length || sp.size <= 3 ? 0.15 : 0) + (decor.length === 0 ? 0.1 : 0);
      if (!single) notes.push('Biyotopta tek tür balıktan 4+ adet tut.'); if (!sandy) notes.push('Kum veya çakıl zemin kullan.'); if (leaves.length + woods.length < 2) notes.push('Kök ve yaprak çöpü (badem yaprağı) ekle.');
    }
    pass('style', 'Stil uyumu', st);
    /* 5) Hayvan uyumu */
    let an = 0.4;
    if (cre.length) {
      const ratio = (cre.length * 3) / sc.liters, stock = 1 - Math.max(0, ratio - 1) * 0.6, shelter = Math.min(1, (hard.length + plants.length) / Math.max(1, cre.length * 0.6));
      const bettaOk = !cre.some((c) => c.species === 'betta') || flo.length > 0;
      an = clamp(0.5 * stock + 0.3 * shelter + 0.2 * (Chem.overall() === 0 ? 1 : 0.4), 0, 1) * (bettaOk ? 1 : 0.8);
      if (ratio > 1) notes.push('Tank kalabalık: jüri hayvan refahına bakar.'); if (!bettaOk) notes.push('Beta için yüzen bitki ve gölge gerekir.');
    } else notes.push('Tankta canlı yok; hayvan puanı düşük.');
    pass('an', 'Hayvan uyumu', an);
    const v = cr.map((c) => c.v / 100), total = Math.round(100 * (0.25 * v[0] + 0.2 * v[1] + 0.2 * v[2] + 0.25 * v[3] + 0.1 * v[4]));
    return { style, total, crit: cr, notes: notes.slice(0, 5) };
  },
};

/* ---------- Canlı sergisi puanlaması ---------- */
const SHOW_CATS = [{ id: 'color', name: 'Renk', emo: '🎨' }, { id: 'tail', name: 'Kuyruk & yüzgeç', emo: '🎏' }, { id: 'symm', name: 'Simetri & sağlık', emo: '⚖️' }, { id: 'pat', name: 'Desen & ırk', emo: '🔶' }];
const ShowJudge = {
  eligible(c) { return c.adult() && !c.dis && !c.quarantined && c.health() > 0.5; },
  score(c, cat) {
    const p = c.pheno, rar = c.rarity() / (RARITY.length - 1), health = clamp(c.health(), 0, 1.2), mat = c.maturity();
    const color = 100 * clamp(0.4 * rar + 0.35 * clamp(((p.intensity ?? 1) - 0.6) / 0.8, 0, 1) + 0.25 * mat, 0, 1);
    const tr = TAIL_RANK.indexOf(p.tail), tail = 100 * clamp(0.55 * clamp((p.tailLen ?? p.fin ?? 1) / 1.3, 0, 1) + 0.45 * (tr >= 0 ? tr / (TAIL_RANK.length - 1) : 0.5), 0, 1);
    const symm = 100 * clamp(health * 0.7 + (1 - c.F) * 0.2 + (c.defect ? 0 : 0.1), 0, 1);
    const extra = ['tux', 'sb', 'st', 'grass', 'mosaic', 'moscow', 'lace', 'mask'].reduce((a, k) => a + (p[k] ? 1 : 0), 0), pat = 100 * clamp(0.6 * rar + 0.08 * extra + 0.2 * clamp(health, 0, 1), 0, 1);
    const all = { color, tail, symm, pat }, o = 0.4 / 3, total = Object.keys(all).reduce((a, k) => a + all[k] * (k === cat ? 0.6 : o), 0);
    return { crit: SHOW_CATS.map((s) => ({ k: s.id, name: s.emo + ' ' + s.name, v: Math.round(all[s.id]), main: s.id === cat })), total: Math.round(total) };
  },
};

/* ---------- Rakipler ve sıralama ---------- */
const RIVALS = [{ id: 'pul', name: 'Bay Pul', emo: '🎩', b: 14 }, { id: 'selin', name: 'Selin', emo: '🧑‍🎨', b: 2 }, { id: 'hakki', name: 'Usta Hakkı', emo: '🧔', b: 8 }, { id: 'nehir', name: 'Nehir', emo: '🐟', b: 5 }, { id: 'koray', name: 'Koray', emo: '🧑‍🔬', b: 11 }];
const Contest = {
  edition(S = Game.S) { return Math.floor(S.clockMin / 1440 / 7); },
  fishCat(ed) { return SHOW_CATS[ed % SHOW_CATS.length]; },
  scapeStyle(ed) { return Object.keys(STYLES)[(ed + 2) % 5]; },
  /** Rakip puanları: oyuncu seviyesine ve edisyona bağlı, deterministik. */
  rivals(kind, ed, S = Game.S) {
    const lvl = Progress.level(S.xp), rng = new RNG((ed * 7919 + (kind === 'f' ? 11 : 29)) >>> 0);
    return RIVALS.map((r) => ({ ...r, score: Math.round(clamp(30 + lvl * 0.55 + r.b + rng.float(-9, 9) + (Meta.ensure(S).prestige.n || 0) * 4, 20, 94)) }));
  },
  place(score, rivals) { return 1 + rivals.filter((r) => r.score > score).length; },
  reward(place, themed) {
    const base = [null, { coins: 300, xp: 40, rep: 6 }, { coins: 180, xp: 25, rep: 3 }, { coins: 100, xp: 15, rep: 1 }][place] || { coins: 30, xp: 5, rep: 0 }, m = (themed ? 1.25 : 1) * Meta.mult('prize');
    return { coins: Math.round(base.coins * m), xp: Math.round(base.xp * m), rep: Math.round(base.rep * m) };
  },
  entered(kind, S = Game.S) { return Meta.ensure(S).shows.entered[Contest.edition(S) + kind]; },
  /** Sonucu kaydeder, ödülü verir. */
  finish(kind, title, score, themed) {
    const S = Game.S, M = Meta.ensure(S), ed = this.edition(S), rv = this.rivals(kind, ed), place = this.place(score, rv), rw = this.reward(place, themed);
    M.shows.entered[ed + kind] = place; M.shows.count++; if (place <= 3) M.shows.podium++; if (place === 1) M.shows.wins++; if (kind === 's') M.shows.sc++;
    Game.addCoins(rw.coins, true); Game.addXp(rw.xp); S.rep += rw.rep;
    if (place <= 3) { M.trophies.push({ ed, kind, place, name: title, score, t: S.clockMin }); if (M.trophies.length > 60) M.trophies.shift(); }
    Meta.friend('pul', place <= 3 ? 2 : 1); Season.points(10 + (4 - Math.min(place, 4)) * 5); Game.ev('contest'); Game.notify('contest', `${title}: ${place}. oldun (${score} puan)`); Game.save();
    return { place, rw, rivals: rv };
  },
};

/* ---------- Hikâye ---------- */
const STORY_NPCS = {
  dede: { name: 'Dede Rıza', emo: '👴', perk: 'Satış fiyatı +%2 / seviye', lv: 'sell' },
  pul:  { name: 'Bay Pul', emo: '🎩', perk: 'Yarışma ödülü +%5 / seviye', lv: 'prize' },
  ayse: { name: 'Ayşe', emo: '👩‍🔬', perk: 'Kazanılan XP +%3 / seviye', lv: 'xp' },
};
const FRIEND_AT = [0, 3, 8, 15, 25], FRIEND_NAMES = ['Tanıdık', 'Dost', 'Yakın dost', 'Sırdaş', 'Aile'];
const CHAPTERS = [
  { id: 1, title: 'Dedenin Dükkânı', npc: 'dede', lvl: 1, intro: ['Torunum, dükkân sana emanet. Ben artık yorgunum ama gözüm hep akvaryumlarda.', 'Önce temel işler: balıkları besle, suyu yenile, ilk satışını yap. Sonrası gelir.'],
    goals: [{ t: 'Balıkları 3 kez besle', get: (S) => S.cnt.feed || 0, goal: 3 }, { t: 'Su değişimi yap', get: (S) => S.cnt.water || 0, goal: 1 }, { t: 'Bir balık sat', get: (S) => S.stats.sold, goal: 1 }],
    outro: ['Güzel! Bir dükkân bir günde kurulmaz ama sen iyi başladın.'], reward: { coins: 200, xp: 60, rep: 2 }, friend: { dede: 3 } },
  { id: 2, title: 'İlk Lepistes Hattı', npc: 'dede', lvl: 3, intro: ['Dedem hep derdi ki: "Her güzel balığın arkasında sabırlı bir üretici vardır."', 'Yavru getir, yeni bir varyasyon keşfet, bir balığın genotipini test et.'],
    goals: [{ t: 'Yavru dünyaya getir', get: (S) => S.cnt.born || 0, goal: 10 }, { t: 'Lepistes varyasyonu keşfet', get: (S) => BREEDS.filter((b) => S.discovered[b.id]).length, goal: 4 }, { t: 'Genotip testi yap', get: (S) => S.cnt.test || 0, goal: 1 }],
    outro: ['İşte bu! Genler artık sana tanıdık gelmeye başladı.'], reward: { coins: 300, xp: 100, rep: 4 }, friend: { dede: 3, ayse: 1 } },
  { id: 3, title: 'Karides Çılgınlığı', npc: 'ayse', lvl: 6, intro: ['Merhaba, ben Ayşe, bir üniversite laboratuvarından. Neocaridina renk genetiği tezim için temiz hatlara ihtiyacım var.', 'Birkaç karides getir, suyunu dengede tut, siparişlerimi karşıla.'],
    goals: [{ t: 'Tankta 5 karides bulundur', get: () => Game.tank.creatures.filter((c) => c.species === 'shrimp').length, goal: 5 }, { t: 'Sipariş teslim et', get: (S) => S.cnt.order || 0, goal: 2 }, { t: 'Su dengede gün', get: (S) => S.cnt.goodDays || 0, goal: 3 }],
    outro: ['Harika veriler! Karideslerin renkleri tezime katkı yapacak.'], reward: { coins: 400, xp: 150, rep: 6 }, friend: { ayse: 5 } },
  { id: 4, title: 'Bay Pul\'un Sergisi', npc: 'pul', lvl: 12, intro: ['Ah, dükkânın yeni sahibi! Ben Bay Pul. Şehirdeki her sergiyi ben kazanırım.', 'Gücünü görmek isterim: Sergi Salonu\'nu araştır (80 itibar), bir sergiye katıl ve podyuma çık.'],
    goals: [{ t: 'Sergi Salonu araştırmasını aç', get: () => (Research.has('hall') ? 1 : 0), goal: 1 }, { t: 'Bir yarışmaya katıl', get: (S) => Meta.ensure(S).shows.count, goal: 1 }, { t: 'İlk 3\'e gir', get: (S) => Meta.ensure(S).shows.podium, goal: 1 }],
    outro: ['Hm... Fena değilsin. Gelecek sefere sana rakip olmaya devam edeceğim.'], reward: { coins: 600, xp: 220, rep: 8 }, friend: { pul: 5 } },
  { id: 5, title: 'Aquascape Dünyası', npc: 'ayse', lvl: 20, intro: ['Sualtı bahçeciliği bir sanat. Jüri kompozisyona, bitki sağlığına ve yosunsuzluğa bakar.', 'Tasarım Stüdyosu\'nda bir manzara kur; Yarışma ekranındaki jüri puanını 70\'in üstüne çıkar ve Aquascape Yarışması\'na katıl.'],
    goals: [{ t: 'Stüdyoda öğe yerleştir', get: (S) => S.cnt.scape || 0, goal: 25 }, { t: 'Jüri puanı 70+ (herhangi bir stil)', get: (S) => Math.max(0, ...Object.values(Meta.ensure(S).best)), goal: 70 }, { t: 'Aquascape Yarışması\'na katıl', get: (S) => Meta.ensure(S).shows.sc, goal: 1 }],
    outro: ['Su altında bir tablo gibi! Dedem görse çok gurur duyardı.'], reward: { coins: 800, xp: 300, rep: 10, stone: 1 }, friend: { ayse: 6, dede: 2 } },
  { id: 6, title: 'Dedenin Kayıp Hattı', npc: 'dede', lvl: 30, intro: ['Dükkânın arka rafında eski bir defter buldum: "Altın Sabit Hat". Dedem yıllarca her yavruda aynı çıkan kusursuz bir hat geliştirmiş.', 'Bunu yeniden yaratabilir misin? 3 nesil boyunca aynı ırkı tutarlı biçimde üret ve bir Sabit Hat kaydet.'],
    goals: [{ t: 'Sabit Hat kaydet', get: (S) => Meta.ensure(S).lines.length, goal: 1 }, { t: 'Lepistes varyasyonu keşfet', get: (S) => BREEDS.filter((b) => S.discovered[b.id]).length, goal: 14 }, { t: 'Genetik Okulu dersi bitir', get: (S) => Object.keys(S.lessons || {}).length, goal: 3 }],
    outro: ['Evet! Tam o hat... Dedem bundan çok gurur duyardı.', 'Defteri senin kütüphanene bırakıyorum: bilgi paylaşıldıkça büyür.'], reward: { coins: 1200, xp: 500, rep: 15, stone: 2 }, friend: { dede: 8 } },
  { id: 7, title: 'Ulusal Şampiyona', npc: 'pul', lvl: 40, intro: ['Büyük gün geldi. Ulusal Şampiyona\'da en iyilerle yarışacaksın.', 'Bir sergiyi kazan ve podyum sayını artır. Sonrasında dükkânı yeni bir şubeye taşıyabilirsin.'],
    goals: [{ t: 'Bir sergiyi kazan (1.)', get: (S) => Meta.ensure(S).shows.wins, goal: 1 }, { t: 'Podyum toplamı', get: (S) => Meta.ensure(S).shows.podium, goal: 5 }, { t: 'Seviye', get: (S) => Progress.level(S.xp), goal: 40 }],
    outro: ['Tebrikler şampiyon! Şimdi bir efsane olma vaktin: "Yeni Şube" açma hakkın doğdu.'], reward: { coins: 3000, xp: 800, rep: 25, stone: 5 }, friend: { pul: 10, dede: 5, ayse: 5 } },
];

/* ---------- Sezonlar ---------- */
const SEASON_DAYS = 35;
const SEASON_THEMES = [
  { id: 'spring', name: 'İlkbahar Çiçeklenmesi', emo: '🌸', col: '#f58bb3', cat: 'color', tr: 2, badge: '🌸' },
  { id: 'summer', name: 'Yaz Işıltısı', emo: '☀️', col: '#ffc24a', cat: 'tail', tr: 4, badge: '🌞' },
  { id: 'autumn', name: 'Sonbahar Yaprakları', emo: '🍂', col: '#e0833a', cat: 'pat', tr: -2, badge: '🍂' },
  { id: 'winter', name: 'Kış Sessizliği', emo: '❄️', col: '#8fd3ff', cat: 'symm', tr: -5, badge: '❄️' },
];
const SEASON_EV = { feed: 1, water: 3, born: 2, sold: 2, mate: 3, order: 8, prune: 2, photo: 3, scape: 1, discover: 15, test: 3, lesson: 20 };
const SEASON_TIERS = 10, SEASON_PTS = 100;
const Season = {
  idx: (S = Game.S) => Math.floor(S.clockMin / 1440 / SEASON_DAYS),
  theme: (S = Game.S) => SEASON_THEMES[Season.idx(S) % 4],
  year: (S = Game.S) => 1 + Math.floor(Season.idx(S) / 4),
  daysLeft: (S = Game.S) => SEASON_DAYS - (Math.floor(S.clockMin / 1440) % SEASON_DAYS),
  /** Sezon değişince eskisi arşive taşınır (ceza yok). */
  ensure(S = Game.S) {
    const M = Meta.ensure(S), i = this.idx(S);
    if (M.season.idx !== i) { if (M.season.idx >= 0) M.archive.push({ idx: M.season.idx, pts: M.season.pts, tiers: M.season.claimed.length }); M.season = { idx: i, pts: 0, claimed: [] }; }
    return M.season;
  },
  points(n) { this.ensure().pts += n; },
  reward(i) { return { coins: 60 + i * 25, rep: [2, 5, 8].includes(i) ? 2 : 0, stone: i === 4 || i === 9 ? 1 : 0, xp: 20 + i * 5, title: i === 9 }; },
  claim(i) {
    const S = Game.S, s = this.ensure(S); if (s.claimed.includes(i) || s.pts < (i + 1) * SEASON_PTS) return false;
    const r = this.reward(i), M = Meta.ensure(S); s.claimed.push(i); Game.addCoins(r.coins, true); Game.addXp(r.xp); S.rep += r.rep; S.stone = (S.stone || 0) + r.stone;
    if (r.title) { const t = `${this.theme(S).name} Üstadı`; if (!M.titles.includes(t)) M.titles.push(t); }
    Game.save(); return true;
  },
  badgeCost: 4,
};

/* ---------- Sabit Hat ---------- */
const Lines = {
  ancestorsOk(id, breedId, depth) {
    const r = Pedigree.rec[id]; if (!r || !r.g) return false;
    const b = Genetics.breedOf(Genetics.phenotype(r.g)); if (!b || b.id !== breedId) return false;
    return depth <= 1 || (!!r.s && this.ancestorsOk(r.s, breedId, depth - 1));
  },
  /** Erkek soyunda 3 nesil aynı ırk + 300 oğulda ≥%90 aynı ırk. */
  check(m, f) {
    if (!m || !f || m.species !== f.species || m.sex !== 'M' || f.sex !== 'F') return { ok: false, why: 'Aynı türden bir erkek ve bir dişi seç.' };
    const b = m.breed(); if (!b || b.rarity < 1) return { ok: false, why: 'Sabit hat için nadir veya daha yüksek bir ırk gerekir.' };
    if (!this.ancestorsOk(m.id, b.id, 3)) return { ok: false, why: `${m.name} erkeğinin soyunda 3 nesil (kendisi, babası, dedesi) aynı ırk (${b.name}) olmalı.` };
    const rng = new RNG(12345 + m.id * 7 + f.id); let n = 0, ok = 0;
    for (let i = 0; i < 700 && n < 300; i++) { const g = Genetics.breed(m.genome, f.genome, rng, { noMut: true }); if (g.sex !== 'M') continue; n++; const o = Genetics.breedOf(Genetics.phenotype(g)); if (o && o.id === b.id) ok++; }
    const rate = ok / Math.max(1, n); if (rate < 0.9) return { ok: false, rate, why: `Bu çiftten oğulların yalnızca %${Math.round(rate * 100)}'i ${b.name} çıkıyor; ≥%90 gerekir. Daha saf bir dişi seç.` };
    return { ok: true, rate, breed: b };
  },
  register(m, f, name) {
    const S = Game.S, M = Meta.ensure(S), r = this.check(m, f); if (!r.ok) return r;
    if (M.lines.length >= 3) return { ok: false, why: 'En fazla 3 sabit hat tutulabilir.' };
    if (M.lines.some((l) => l.bid === r.breed.id && l.sp === m.species)) return { ok: false, why: 'Bu ırk için zaten bir sabit hat var.' };
    const line = { id: M.nextLine++, name: (name || '').trim().slice(0, 24) || `${r.breed.name} Hattı`, bid: r.breed.id, bn: r.breed.name, sp: m.species, rate: Math.round(r.rate * 100), t: S.clockMin, mg: JSON.parse(JSON.stringify(m.genome)), fg: JSON.parse(JSON.stringify(f.genome)) };
    M.lines.push(line); Game.ev('line'); Game.addXp(100); Season.points(30); Game.notify('line', `Sabit Hat kaydedildi: ${line.name}`); Game.save(); return { ok: true, line };
  },
};

/* ---------- Meta durum ve çarpanlar ---------- */
const Meta = {
  ensure(S = Game.S) {
    const M = S.meta || (S.meta = {});
    if (!M.story) M.story = { claimed: {} }; if (!M.friend) M.friend = { dede: 0, pul: 0, ayse: 0 };
    if (!M.shows) M.shows = { entered: {}, count: 0, podium: 0, wins: 0, sc: 0 }; if (!M.trophies) M.trophies = []; if (!M.best) M.best = {};
    if (!M.season) M.season = { idx: -1, pts: 0, claimed: [] }; if (!M.archive) M.archive = []; if (!M.badges) M.badges = []; if (!M.titles) M.titles = [];
    if (!M.lines) M.lines = []; if (!M.nextLine) M.nextLine = 1; if (!M.ledger) M.ledger = []; if (!M.prestige) M.prestige = { n: 0, branch: 'main' };
    return M;
  },
  friendLv(pts) { let l = 0; FRIEND_AT.forEach((t, i) => { if (pts >= t) l = i; }); return l; },
  friend(id, n) { const M = this.ensure(), was = this.friendLv(M.friend[id]); M.friend[id] += n; const now = this.friendLv(M.friend[id]); if (now > was && typeof UI !== 'undefined') UI.toast(`${STORY_NPCS[id].emo} ${STORY_NPCS[id].name} ile dostluk: ${FRIEND_NAMES[now]}!`, 'heart', 4000); },
  /** Kalıcı küçük bonuslar: dostluk + prestij. */
  mult(kind, S = Game.S) {
    const M = this.ensure(S), p = M.prestige.n || 0, per = { sell: 0.02, prize: 0.05, xp: 0.03 }[kind] || 0; let m = 1;
    for (const [id, np] of Object.entries(STORY_NPCS)) if (np.lv === kind) m += this.friendLv(M.friend[id]) * per;
    if (kind === 'sell') m += Math.min(0.3, 0.03 * p); if (kind === 'xp') m += Math.min(0.5, 0.05 * p);
    return m;
  },
  /** 'locked' | 'lvl' | 'open' | 'ready' | 'done' */
  chapterState(ch, S = Game.S) {
    const M = this.ensure(S); if (M.story.claimed[ch.id]) return 'done';
    if (ch.id > 1 && !M.story.claimed[ch.id - 1]) return 'locked'; if (Progress.level(S.xp) < ch.lvl) return 'lvl';
    return ch.goals.every((g) => g.get(S) >= g.goal) ? 'ready' : 'open';
  },
  claimChapter(ch) {
    const S = Game.S, M = this.ensure(S); if (this.chapterState(ch, S) !== 'ready') return false; const r = ch.reward;
    M.story.claimed[ch.id] = 1; Game.addCoins(r.coins, true); Game.addXp(r.xp); S.rep += r.rep || 0; S.stone = (S.stone || 0) + (r.stone || 0);
    for (const [k, v] of Object.entries(ch.friend)) this.friend(k, v);
    Game.notify('story', `Bölüm ${ch.id} tamamlandı: ${ch.title}`); Game.ev('chapter'); Game.save(); return true;
  },
  finale(S = Game.S) { return !!this.ensure(S).story.claimed[7]; },
  logMate(m, f) { const M = this.ensure(), bm = m.breed(); M.ledger.push({ t: Game.S.clockMin, m: m.name, f: f.name, sp: m.species, b: bm ? bm.name : '?' }); if (M.ledger.length > 80) M.ledger.shift(); },
};

/* ---------- Prestij: Yeni Şube ---------- */
const BRANCHES = [
  { id: 'nano', name: 'Nano Şube', emo: '🫧', l: 20, coins: 300, lvl: 1, res: [], desc: '20 L nano tankla başla; +300 Altın Pul.' },
  { id: 'shrimp', name: 'Karides Şubesi', emo: '🦐', l: 40, coins: 0, lvl: 5, res: ['ro'], desc: '40 L tank, seviye 5 (karides açık), RO sistemi hazır.' },
  { id: 'salon', name: 'Büyük Salon', emo: '🏛️', l: 100, coins: 0, lvl: 3, res: ['quar', 'bigtank'], desc: '100 L tank, büyük karantina ve büyük tanklar açık.' },
];
const Prestige = {
  can(S = Game.S) { return Meta.finale(S) || Progress.level(S.xp) >= 100; },
  perform(branchId) {
    const S = Game.S, M = Meta.ensure(S), br = BRANCHES.find((b) => b.id === branchId) || BRANCHES[0];
    const keep = { name: S.name, avatar: S.avatar, av: S.av, discovered: S.discovered, lessons: S.lessons, ach: S.ach, owns: S.owns, settings: S.settings, stone: S.stone, gallery: S.gallery, templates: S.templates, once: S.once, meta: M, onboarded: true, tut: { i: 0, base: {}, fin: 1, off: 0 } };
    const lines = M.lines.slice(0, 3); M.prestige = { n: (M.prestige.n || 0) + 1, branch: br.id }; M.shows.entered = {}; M.season = { idx: -1, pts: 0, claimed: [] };
    Game.freshState(); const N = Game.S; Object.assign(N, keep); Meta.ensure(N);
    N.coins = 500 + 250 * M.prestige.n + br.coins; N.xp = Progress.xpFor(br.lvl); N.research = {}; for (const r of br.res) N.research[r] = 1; N.scape.liters = br.l; N.rep = 0;
    const t = Game.tank;
    for (const l of lines) for (const g of [l.mg, l.fg]) { const c = new Creature({ genome: JSON.parse(JSON.stringify(g)), bornT: N.clockMin - 90 * 1440, x: R.float(160, t.W - 160), y: R.float(160, t.H - 220) }); t.addCreature(c); Breeding.reg(c); }
    t.setScape(N.scape); Game.checkDiscoveries(true); Game.afterLoad(); Game.save(true); return br;
  },
};

/* ---------- Ek başarımlar ---------- */
ACHIEVEMENTS.push(
  { id: 'iwagumi', name: 'Iwagumi Ruhu', ic: '🪨', desc: 'Iwagumi jüri puanı', tiers: [70, 80, 90], get: (S) => Meta.ensure(S).best.iwagumi || 0 },
  { id: 'podium', name: 'Madalyacı', ic: '🏅', desc: 'Yarışmalarda ilk 3', tiers: [1, 6, 20], get: (S) => Meta.ensure(S).shows.podium },
  { id: 'line', name: 'Hat Ustası', ic: '🧬', desc: 'Sabit Hat kaydet', tiers: [1, 2, 3], get: (S) => Meta.ensure(S).lines.length },
);

/* ---------- Oyuna bağlama (sarmalayıcılar) ---------- */
(function hook() {
  const ev = Game.ev; Game.ev = function (name, n = 1) {
    ev.call(this, name, n); const S = this.S; if (!S) return; Meta.ensure(S); Season.ensure(S);
    if (SEASON_EV[name]) Season.points(SEASON_EV[name] * n);
    if (name === 'order') Meta.friend('ayse', n); if (name === 'sold' && (S.cnt.sold || 0) % 5 === 0) Meta.friend('dede', 1);
  };
  const mate = Game.mate; Game.mate = function (m, f, q) { const r = mate.call(this, m, f, q); try { Meta.logMate(m, f); } catch (e) { /* defter hatası oyunu durdurmasın */ } return r; };
  const px = Market.price; Market.price = function (c) { return Math.max(3, Math.round(px.call(this, c) * Meta.mult('sell'))); };
  const ax = Game.addXp; Game.addXp = function (n, once) { return ax.call(this, once ? n : Math.round(n * Meta.mult('xp')), once); };
  const al = Game.afterLoad; Game.afterLoad = function () { const r = al.apply(this, arguments); Meta.ensure(this.S); Season.ensure(this.S); AudioSys.setTune(Season.theme(this.S).tr); return r; };
})();
