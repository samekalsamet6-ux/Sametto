'use strict';
/* =====================================================================
   17 · TÜRLER — Endler, Moli, Plati, Kılıçkuyruk, Beta, Neocaridina, Salyangoz
   Her tür: genetik şeması (SCHEMA), fenotip (render-spec üretir), ırk tablosu
   (SP_BREEDS), tür tanımı (SPDEF). Lepistes 02-genetics.js'te.
   ===================================================================== */

TAILCOL.orange = { name: 'Turuncu', h: 24, s: 92, l: 52 }; TAILCOL.black = { name: 'Siyah', h: 230, s: 20, l: 14 };
TAILS.double = { name: 'Çift kuyruk', bf: 0.56, soft: 0.6 }; TAILS.plakat = { name: 'Plakat', bf: 0.64, soft: 0.8 };

/** Tür tanımı: kind (çizim/davranış), boy [erkek,dişi] (dünya birimi), üreme tipi */
const SPDEF = {
  guppy:     { pm: 1, kind: 'fish',   len: [49.9, 69.6], breed: 'live',  adult: 35, fry: 'Yavru' },
  endler:    { pm: 0.8, kind: 'fish',   len: [30, 41],     breed: 'live',  adult: 30 },
  molly:     { pm: 1, kind: 'fish',   len: [62, 84],     breed: 'live',  adult: 45 },
  platy:     { pm: 0.9, kind: 'fish',   len: [52, 66],     breed: 'live',  adult: 40 },
  swordtail: { pm: 1, kind: 'fish',   len: [60, 76],     breed: 'live',  adult: 45 },
  betta:     { pm: 1.2, kind: 'fish',   len: [62, 52],     breed: 'bubble', adult: 60, solitary: true },
  shrimp:    { pm: 0.3, kind: 'shrimp', len: [24, 34],     breed: 'shrimp', adult: 50 },
  snail:     { pm: 0.5, kind: 'snail',  len: [32, 32],     breed: 'snail', adult: 40 },
};
/** Melezlenebilen çiftler (diğerleri laboratuvarda reddedilir). */
const HYBRIDS = [['guppy', 'endler'], ['platy', 'swordtail']];
const canCross = (a, b) => a === b || HYBRIDS.some(([x, y]) => (x === a && y === b) || (x === b && y === a));

const pick2 = (alleles, rank) => rank[Math.min(rank.indexOf(alleles[0]), rank.indexOf(alleles[1]))];
const sig = (a) => a.join('|');
const HSL = (h, s, l) => ({ h, s, l });
const mutPool = (pool) => (locus, al, rng) => { const p = pool[locus]; return p ? rng.pick(p.filter((x) => x !== al)) : al; };
const mutScNone = (l, v) => v;
/** Başlangıç popülasyonu için havuzdan seçici */
const rndSpec = (rng, spec) => { const o = {}; for (const k in spec) { const v = spec[k]; o[k] = Array.isArray(v) ? rng.pick(v) : v; } return o; };

/* ======================= ENDLER ======================= */
SCHEMA.endler = {
  auto: ['body', 'tail'], sc: ['pat', 'tc'], xy: 0.03,
  defAuto: { body: ['W', 'W'], tail: ['delta', 'delta'] }, defSc: { pat: 'none', tc: 'none' },
  quant: { size: [0.8, 1.25], vigor: [0.5, 1.4], intensity: [0.55, 1.3], pur: [0, 1] }, qdef: { pur: 1 }, qOther: { pur: 0 },
  mut: mutPool({ body: ['W', 'alb', 'gld'], tail: ['delta', 'fan', 'round', 'spade'] }),
  mutSc(l, v, rng) { return rng.pick((l === 'pat' ? ['none', 'tiger', 'cobra', 'bar'] : ['none', 'orange', 'green']).filter((x) => x !== v)); },
  founder: (sex, rng) => Genetics.make({ sp: 'endler', tail: rng.pick(['delta', 'fan']), X: { tc: 'none' }, body: 'W', ...(sex === 'M' ? { pat: rng.pick(['tiger', 'cobra', 'bar']), tc: rng.pick(['orange', 'green']) } : { X: { pat: rng.pick(['none', 'tiger']), tc: 'none' } }) }, sex, rng, 'endler'),
  post(g, sire, dam) { g.quant.pur = clamp(g.quant.pur, 0, 1); },
  pheno(g) {
    const [x, y] = g.sc, body = pick2(g.auto.body, ['W', 'alb', 'gld']), M = g.sex === 'M', pat = M ? (y.pat !== 'none' ? y.pat : x.pat) : 'none', tc = M ? (y.tc !== 'none' ? y.tc : x.tc) : 'none';
    const base = { W: HSL(60, 14, 56), alb: HSL(48, 70, 84), gld: HSL(44, 85, 58) }[body];
    const p = { sex: g.sex, sp: 'endler', body, tail: pick2(g.auto.tail, ['round', 'fan', 'spade', 'delta']), tailColor: tc === 'none' ? 'none' : tc, tailColor2: null, tux: 0, sb: 0, st: 0, grass: 0, mosaic: 0, moscow: 0, purple: false, metal: false,
      size: g.quant.size, tailLen: 1, vigor: g.quant.vigor, intensity: g.quant.intensity, pur: g.quant.pur, pat, bodyCol: base, penalty: 1, H: 0.9, extra: [] };
    if (M && pat === 'tiger') p.extra.push({ t: 'tiger' }); if (M && pat === 'cobra') p.extra.push({ t: 'cobra' }); if (M && pat === 'bar') p.extra.push({ t: 'bars', n: 4 });
    if (M && tc === 'orange') p.extra.push({ t: 'spots', col: 'hsl(26,95%,52%)', n: 9, r: 6 });
    p.hybrid = g.quant.pur < 0.9; p.sig = ['e', g.sex, body, p.tail, tc, pat, p.hybrid | 0].join('|'); return p;
  },
  describe: (g) => [['Gövde', g.auto.body.join(' / ')], ['Kuyruk', g.auto.tail.join(' / ')], ['Desen (X)', g.sc[0].pat + '/' + g.sc[0].tc], [g.sex === 'M' ? 'Desen (Y)' : 'Desen (X2)', g.sc[1].pat + '/' + g.sc[1].tc], ['Saflık', Math.round(g.quant.pur * 100) + '%']],
  carried: (g) => (g.sex === 'F' ? [...new Set(g.sc.flatMap((h) => [h.pat !== 'none' && 'Desen: ' + h.pat, h.tc !== 'none' && 'Renk: ' + h.tc].filter(Boolean)))] : []),
};
SP_BREEDS.endler = [
  { id: 'en_hybrid', name: 'Melez (Lepistes×Endler)', rarity: 0, test: (p) => p.hybrid, spec: { sp: 'endler', pur: 0.5, pat: 'tiger', tc: 'orange' }, hint: 'Lepistesle karışmış; "Saf Endler" sertifikası kaybolur.', blurb: 'Lepistes genleri taşıyan melez; saf hat değildir.' },
  { id: 'en_cobra', name: 'Cobra', rarity: 2, test: (p) => p.pat === 'cobra', spec: { sp: 'endler', pat: 'cobra', tc: 'orange' }, hint: 'Yılan gibi kıvrımlı siyah bantlar.', blurb: 'Gövdede dalgalı siyah bantlı Endler formu.' },
  { id: 'en_tiger', name: 'Tiger', rarity: 1, test: (p) => p.pat === 'tiger', spec: { sp: 'endler', pat: 'tiger', tc: 'orange' }, hint: 'Turuncu-siyah kaplan desenli.', blurb: 'Kaplan desenli turuncu-siyah Endler.' },
  { id: 'en_bar', name: 'Black Bar', rarity: 1, test: (p) => p.pat === 'bar', spec: { sp: 'endler', pat: 'bar', tc: 'green' }, hint: 'Dikey siyah çubuklar.', blurb: 'Gövdede dikey siyah çubuklu form.' },
  { id: 'en_gold', name: 'Altın Endler', rarity: 1, test: (p) => p.body === 'gld', spec: { sp: 'endler', body: 'gld', pat: 'none' }, hint: 'Altın gövdeli.', blurb: 'Altın sarısı gövdeli seçici hat.' },
  { id: 'en_albino', name: 'Albino Endler', rarity: 1, test: (p) => p.body === 'alb', spec: { sp: 'endler', body: 'alb' }, hint: 'Kırmızı gözlü beyaz.', blurb: 'Pigmentsiz, kırmızı gözlü Endler.' },
  { id: 'en_wild', name: 'Yabani Endler', rarity: 0, test: () => true, spec: { sp: 'endler', pat: 'none' }, hint: 'Doğal görünüm.', blurb: 'Sade gri tonlu doğal Endler.' },
];

/* ======================= MOLİ ======================= */
SCHEMA.molly = {
  auto: ['mel', 'col', 'tail', 'bal'], sc: [], xy: 0,
  defAuto: { mel: ['m0', 'm0'], col: ['W', 'W'], tail: ['norm', 'norm'], bal: ['B', 'B'] }, defSc: {},
  quant: { size: [0.8, 1.3], vigor: [0.5, 1.4], intensity: [0.6, 1.3], sail: [0.6, 1.6], mex: [0, 1] }, qdef: { sail: 0.9, mex: 0.5 },
  mut: mutPool({ mel: ['m0', 'm1', 'm2'], col: ['W', 'gold', 'white', 'orange'], tail: ['norm', 'lyre'], bal: ['B', 'bal'] }), mutSc: mutScNone,
  founder: (sex, rng) => Genetics.make({ sp: 'molly', mel: rng.pick([['m0', 'm0'], ['m1', 'm0'], ['m2', 'm1']]), col: rng.pick(['W', 'W', 'gold', 'white']) }, sex, rng, 'molly'),
  post(g, s, d, rng) { g.quant.mex = clamp(0.5 + rng.gauss(0, 0.22), 0, 1); },       // değişken ifade
  pheno(g) {
    const dose = g.auto.mel.reduce((a, m) => a + (m === 'm2' ? 2 : m === 'm1' ? 1 : 0), 0), pct = clamp(dose / 4 * 100 + (g.quant.mex - 0.5) * 55, 0, 100), col = pick2(g.auto.col, ['W', 'gold', 'orange', 'white']);
    const base = { W: HSL(75, 8, 62), gold: HSL(44, 88, 60), white: HSL(50, 6, 92), orange: HSL(24, 92, 56) }[col], bal = pick2(g.auto.bal, ['B', 'bal']) === 'bal', lyre = pick2(g.auto.tail, ['lyre', 'norm']) === 'lyre';
    const dark = pct >= 85, bodyCol = dark ? HSL(230, 14, 9) : pct >= 45 ? HSL(base.h, base.s * 0.5, base.l * 0.45) : base;
    const p = { sex: g.sex, sp: 'molly', body: col === 'white' ? 'alb' : 'W', tail: lyre ? 'lyre' : 'fan', tailColor: 'none', tailColor2: null, tux: 0, sb: 0, st: 0, grass: 0, mosaic: 0, moscow: 0, purple: false, metal: false, size: g.quant.size * (bal ? 0.85 : 1), tailLen: lyre ? 1.15 : 0.9,
      vigor: g.quant.vigor, intensity: g.quant.intensity, bodyCol, tcol: dark ? HSL(230, 14, 14) : base, H: bal ? 1.55 : 1.15, dorsal: g.quant.sail * 1.2, melPct: pct, colId: col, bal, sail: g.quant.sail, penalty: bal ? 0.7 : 1, extra: [] };
    if (pct >= 8 && pct < 45) p.extra.push({ t: 'spots', col: 'rgba(15,15,25,.85)', n: Math.round(8 + pct * 1.1), r: 5, rand: true });
    else if (pct >= 45 && pct < 85) p.extra.push({ t: 'marble', col: 'rgba(15,15,25,.75)', n: 12 }); if (col === 'white') p.eyeRed = false;
    p.cls = pct >= 85 ? 'black' : pct >= 45 ? 'marble' : pct >= 8 ? 'dalm' : 'none'; p.sig = ['m', g.sex, col, p.cls, lyre | 0, bal | 0, Math.round(g.quant.sail * 4)].join('|'); return p;
  },
  describe: (g) => [['Siyahlık (melanin)', g.auto.mel.join(' / ')], ['Renk', g.auto.col.join(' / ')], ['Kuyruk', g.auto.tail.join(' / ')], ['Balon geni', g.auto.bal.join(' / ')]],
};
SP_BREEDS.molly = [
  { id: 'mo_balloon', name: 'Balon Moli', rarity: 2, test: (p) => p.bal, spec: { sp: 'molly', bal: ['bal', 'bal'], mel: ['m2', 'm2'] }, hint: 'Yuvarlak, kısa gövdeli (sağlık cezalı).', blurb: 'Omurga deformasyonuna bağlı balon form: kısa ömürlü ve zayıf doğurgan — dürüst not.' },
  { id: 'mo_black_sail', name: 'Siyah Sailfin', rarity: 2, test: (p) => p.cls === 'black' && p.sail > 1.25, spec: { sp: 'molly', mel: ['m2', 'm2'], sail: 1.45, mex: 0.9 }, hint: 'Siyah gövde, dev yelken yüzgeç.', blurb: 'Yelkenimsi sırt yüzgeçli siyah moli.' },
  { id: 'mo_black_lyre', name: 'Siyah Lyretail', rarity: 1, test: (p) => p.cls === 'black' && p.tail === 'lyre', spec: { sp: 'molly', mel: ['m2', 'm2'], tail: ['lyre', 'lyre'], mex: 0.9 }, hint: 'Siyah, lir kuyruklu.', blurb: 'Lir kuyruklu siyah moli.' },
  { id: 'mo_black', name: 'Siyah Moli', rarity: 0, test: (p) => p.cls === 'black', spec: { sp: 'molly', mel: ['m2', 'm2'], mex: 0.9 }, hint: 'Tam siyah.', blurb: 'Melanizm geninin tam ifade olduğu klasik siyah moli.' },
  { id: 'mo_marble', name: 'Mermer Moli', rarity: 1, test: (p) => p.cls === 'marble', spec: { sp: 'molly', mel: ['m1', 'm1'], mex: 0.6 }, hint: 'Siyah-gümüş mermer görünümlü.', blurb: 'Melanizmin kısmi ifadesiyle mermer desen.' },
  { id: 'mo_dalm', name: 'Dalmaçyalı Moli', rarity: 1, test: (p) => p.cls === 'dalm', spec: { sp: 'molly', mel: ['m1', 'm0'], mex: 0.6 }, hint: 'Siyah benekli.', blurb: 'Benekli (Dalmaçyalı) moli: melanizm düşük ifade.' },
  { id: 'mo_gold_sail', name: 'Altın Sailfin', rarity: 1, test: (p) => p.colId === 'gold' && p.sail > 1.25, spec: { sp: 'molly', col: 'gold', sail: 1.45 }, hint: 'Altın, büyük yelkenli.', blurb: 'Altın gövdeli sailfin.' },
  { id: 'mo_snow', name: 'Snowball (Beyaz)', rarity: 1, test: (p) => p.colId === 'white', spec: { sp: 'molly', col: 'white' }, hint: 'Kar gibi beyaz.', blurb: 'Pigmentsiz beyaz moli.' },
  { id: 'mo_orange', name: 'Turuncu Moli', rarity: 1, test: (p) => p.colId === 'orange', spec: { sp: 'molly', col: 'orange' }, hint: 'Parlak turuncu.', blurb: 'Turuncu gövdeli seçici form.' },
  { id: 'mo_gold', name: 'Altın Moli', rarity: 0, test: (p) => p.colId === 'gold', spec: { sp: 'molly', col: 'gold' }, hint: 'Altın sarısı.', blurb: 'Altın renkli moli.' },
  { id: 'mo_lyre', name: 'Lyretail Moli', rarity: 1, test: (p) => p.tail === 'lyre', spec: { sp: 'molly', tail: ['lyre', 'lyre'] }, hint: 'Lir kuyruklu.', blurb: 'Baskın lir kuyruk geni.' },
  { id: 'mo_wild', name: 'Gümüş Moli', rarity: 0, test: () => true, spec: { sp: 'molly' }, hint: 'Doğal gümüş-yeşil.', blurb: 'Doğadaki gri-yeşil moli.' },
];

/* ======================= PLATİ ======================= */
SCHEMA.platy = {
  auto: ['base', 'col', 'pat', 'tail', 'tux'], sc: [], xy: 0,
  defAuto: { base: ['W', 'W'], col: ['W', 'W'], pat: ['none', 'none'], tail: ['norm', 'norm'], tux: ['t', 't'] }, defSc: {},
  quant: { size: [0.8, 1.3], vigor: [0.55, 1.4], intensity: [0.6, 1.3] },
  mut: mutPool({ base: ['W', 'alb', 'bld'], col: ['W', 'red', 'blue', 'yellow'], pat: ['none', 'mickey', 'comet', 'moon', 'twospot', 'sp'], tail: ['norm', 'wag'], tux: ['T', 't'] }), mutSc: mutScNone,
  founder: (sex, rng) => Genetics.make({ sp: 'platy', col: rng.pick(['W', 'W', 'red', 'yellow']), pat: rng.pick(['none', 'none', 'mickey', 'twospot', 'sp']) }, sex, rng, 'platy'),
  pheno(g) {
    const base = pick2(g.auto.base, ['W', 'alb', 'bld']), col = pick2(g.auto.col, ['red', 'yellow', 'blue', 'W']), pat = pick2(g.auto.pat, ['mickey', 'comet', 'moon', 'twospot', 'sp', 'none']), wag = pick2(g.auto.tail, ['wag', 'norm']) === 'wag', tux = pick2(g.auto.tux, ['T', 't']) === 'T';
    let bc = { W: HSL(62, 12, 56), red: HSL(8, 82, 52), blue: HSL(208, 62, 55), yellow: HSL(46, 92, 60) }[col];
    if (base === 'alb') bc = HSL(bc.h, bc.s * 0.6, 84); else if (base === 'bld') bc = HSL(bc.h, bc.s * 0.8, Math.min(78, bc.l + 14));
    const p = { sex: g.sex, sp: 'platy', body: base === 'alb' ? 'alb' : 'W', tail: 'round', tailColor: 'none', tailColor2: null, tux: tux ? 1 : 0, sb: 0, st: 0, grass: 0, mosaic: 0, moscow: 0, purple: false, metal: false, size: g.quant.size, tailLen: 0.8, vigor: g.quant.vigor, intensity: g.quant.intensity,
      bodyCol: bc, tcol: wag ? HSL(230, 14, 14) : { h: bc.h, s: bc.s * 0.8, l: bc.l }, H: 1.25, colId: col, patId: pat, wag, penalty: 1, extra: [] };
    if (pat === 'mickey') p.extra.push({ t: 'mickey' }); else if (pat === 'comet') p.extra.push({ t: 'comet' }); else if (pat === 'moon') p.extra.push({ t: 'moon' }); else if (pat === 'twospot') p.extra.push({ t: 'twospot' }); else if (pat === 'sp') p.extra.push({ t: 'saltpepper' });
    p.sig = ['p', g.sex, base, col, pat, wag | 0, tux | 0].join('|'); return p;
  },
  describe: (g) => [['Taban', g.auto.base.join(' / ')], ['Renk', g.auto.col.join(' / ')], ['Desen', g.auto.pat.join(' / ')], ['Kuyruk', g.auto.tail.join(' / ')], ['Tuxedo', g.auto.tux.join(' / ')]],
};
SP_BREEDS.platy = [
  { id: 'pl_bleeding', name: 'Bleeding Heart', rarity: 2, test: (p) => p.colId === 'red' && p.patId === 'sp', spec: { sp: 'platy', col: 'red', pat: 'sp' }, hint: 'Kırmızı zeminde koyu benekler.', blurb: 'Kırmızı gövde ve salt&pepper deseni birleşimi.' },
  { id: 'pl_blue_wag', name: 'Blue Wagtail', rarity: 2, test: (p) => p.colId === 'blue' && p.wag, spec: { sp: 'platy', col: 'blue', tail: ['wag', 'wag'] }, hint: 'Mavi gövde, siyah yüzgeçler.', blurb: 'Mavi gövde ile siyah yüzgeçli (wagtail).' },
  { id: 'pl_mickey', name: 'Mickey Mouse', rarity: 1, test: (p) => p.patId === 'mickey', spec: { sp: 'platy', pat: 'mickey', col: 'yellow' }, hint: 'Kuyruk köküne Mickey kafası.', blurb: 'Kuyruk kökünde Mickey Mouse biçimli üç siyah leke.' },
  { id: 'pl_comet', name: 'Comet', rarity: 1, test: (p) => p.patId === 'comet', spec: { sp: 'platy', pat: 'comet', col: 'red' }, hint: 'Kuyrukta siyah çizgi.', blurb: 'Kuyruk ve sırt boyunca koyu "kuyruklu yıldız" çizgisi.' },
  { id: 'pl_moon', name: 'Moon', rarity: 1, test: (p) => p.patId === 'moon', spec: { sp: 'platy', pat: 'moon', col: 'yellow' }, hint: 'Hilal biçimli leke.', blurb: 'Kuyruk kökünde ay biçimli siyah leke.' },
  { id: 'pl_twospot', name: 'Two-spot', rarity: 1, test: (p) => p.patId === 'twospot', spec: { sp: 'platy', pat: 'twospot', col: 'red' }, hint: 'İki siyah nokta.', blurb: 'Kuyruk kökünde üst ve altta iki siyah nokta.' },
  { id: 'pl_sp', name: 'Salt & Pepper', rarity: 1, test: (p) => p.patId === 'sp', spec: { sp: 'platy', pat: 'sp' }, hint: 'Tuz-karabiber noktalı.', blurb: 'Gövdeye serpilmiş koyu noktalar.' },
  { id: 'pl_coral', name: 'Coral (Kırmızı)', rarity: 0, test: (p) => p.colId === 'red', spec: { sp: 'platy', col: 'red' }, hint: 'Mercan kırmızısı.', blurb: 'Kırmızı gövdeli klasik plati.' },
  { id: 'pl_blue', name: 'Blue Mirror', rarity: 1, test: (p) => p.colId === 'blue', spec: { sp: 'platy', col: 'blue' }, hint: 'Aynı gibi mavi.', blurb: 'Mavi gövdeli, parlak plati.' },
  { id: 'pl_sun', name: 'Sunburst', rarity: 0, test: (p) => p.colId === 'yellow', spec: { sp: 'platy', col: 'yellow' }, hint: 'Güneş sarısı.', blurb: 'Sarı-turuncu gövdeli plati.' },
  { id: 'pl_wag', name: 'Wagtail', rarity: 1, test: (p) => p.wag, spec: { sp: 'platy', tail: ['wag', 'wag'] }, hint: 'Siyah yüzgeçli.', blurb: 'Siyah sırt ve kuyruk yüzgeçli.' },
  { id: 'pl_tux', name: 'Tuxedo Plati', rarity: 1, test: (p) => p.tux, spec: { sp: 'platy', tux: ['T', 't'] }, hint: 'Arka yarısı smokin gibi koyu.', blurb: 'Gövdenin arka yarısı koyu.' },
  { id: 'pl_albino', name: 'Albino Plati', rarity: 1, test: (p) => p.body === 'alb', spec: { sp: 'platy', base: 'alb' }, hint: 'Pembe-beyaz.', blurb: 'Pigmentsiz plati.' },
  { id: 'pl_wild', name: 'Yabani Plati', rarity: 0, test: () => true, spec: { sp: 'platy' }, hint: 'Zeytin-gri.', blurb: 'Doğal zeytin-gri plati.' },
];

/* ======================= KILIÇKUYRUK ======================= */
SCHEMA.swordtail = {
  auto: ['col', 'lyre', 'wag', 'tux', 'pine'], sc: [], xy: 0,
  defAuto: { col: ['W', 'W'], lyre: ['l', 'l'], wag: ['n', 'n'], tux: ['t', 't'], pine: ['p', 'p'] }, defSc: {},
  quant: { size: [0.8, 1.25], vigor: [0.55, 1.4], intensity: [0.6, 1.3], sword: [0.2, 1.5] }, qdef: { sword: 0.9 },
  mut: mutPool({ col: ['W', 'red', 'lemon', 'alb'], lyre: ['L', 'l'], wag: ['wag', 'n'], tux: ['T', 't'], pine: ['P', 'p'] }), mutSc: mutScNone,
  founder: (sex, rng) => Genetics.make({ sp: 'swordtail', col: rng.pick(['W', 'red', 'red', 'lemon']) }, sex, rng, 'swordtail'),
  pheno(g) {
    const col = pick2(g.auto.col, ['red', 'lemon', 'alb', 'W']), lyre = pick2(g.auto.lyre, ['L', 'l']) === 'L', wag = pick2(g.auto.wag, ['wag', 'n']) === 'wag', tux = pick2(g.auto.tux, ['T', 't']) === 'T', pine = pick2(g.auto.pine, ['P', 'p']) === 'P';
    const bc = { W: HSL(100, 25, 42), red: HSL(6, 80, 50), lemon: HSL(52, 92, 64), alb: HSL(48, 55, 86) }[col], M = g.sex === 'M';
    const p = { sex: g.sex, sp: 'swordtail', body: col === 'alb' ? 'alb' : 'W', tail: M ? (lyre ? 'lyre' : 'bottomsword') : 'round', tailColor: 'none', tailColor2: null, tux: tux ? 1 : 0, sb: 0, st: 0, grass: 0, mosaic: 0, moscow: 0, purple: false, metal: false, size: g.quant.size, tailLen: M ? 0.8 + g.quant.sword * 0.35 : 0.8,
      vigor: g.quant.vigor, intensity: g.quant.intensity, bodyCol: bc, tcol: wag ? HSL(230, 14, 14) : { h: bc.h, s: bc.s, l: Math.min(60, bc.l + 4) }, H: 1.0, colId: col, lyre, wag, pine, sword: g.quant.sword, penalty: 1, extra: [] };
    if (pine) p.extra.push({ t: 'saltpepper', dense: true }); if (col === 'red' && M) p.extra.push({ t: 'stripe', col: 'rgba(180,20,20,.6)' });
    p.sig = ['s', g.sex, col, lyre | 0, wag | 0, tux | 0, pine | 0, Math.round(g.quant.sword * 5)].join('|'); return p;
  },
  describe: (g) => [['Renk', g.auto.col.join(' / ')], ['Lyretail', g.auto.lyre.join(' / ')], ['Wagtail', g.auto.wag.join(' / ')], ['Tuxedo', g.auto.tux.join(' / ')], ['Pineapple', g.auto.pine.join(' / ')]],
};
SP_BREEDS.swordtail = [
  { id: 'sw_pineapple', name: 'Pineapple', rarity: 2, test: (p) => p.pine, spec: { sp: 'swordtail', pine: ['P', 'p'], col: 'lemon' }, hint: 'Ananas gibi ağsı desen.', blurb: 'Gövdede ağ biçimli koyu desen.' },
  { id: 'sw_lyre', name: 'Lyretail', rarity: 2, test: (p) => p.lyre, spec: { sp: 'swordtail', lyre: ['L', 'l'], col: 'red' }, hint: 'Lir biçimli kuyruk.', blurb: 'Kılıç yerine lir kuyruk geni.' },
  { id: 'sw_wag', name: 'Wagtail', rarity: 1, test: (p) => p.wag, spec: { sp: 'swordtail', wag: ['wag', 'wag'], col: 'red' }, hint: 'Siyah yüzgeçli.', blurb: 'Siyah yüzgeçli kılıçkuyruk.' },
  { id: 'sw_tux', name: 'Tuxedo', rarity: 1, test: (p) => p.tux, spec: { sp: 'swordtail', tux: ['T', 't'], col: 'red' }, hint: 'Smokinli.', blurb: 'Arka yarısı koyu.' },
  { id: 'sw_albino', name: 'Albino Kılıç', rarity: 1, test: (p) => p.body === 'alb', spec: { sp: 'swordtail', col: 'alb' }, hint: 'Kırmızı gözlü beyaz.', blurb: 'Pigmentsiz form.' },
  { id: 'sw_lemon', name: 'Lemon', rarity: 0, test: (p) => p.colId === 'lemon', spec: { sp: 'swordtail', col: 'lemon' }, hint: 'Limon sarısı.', blurb: 'Parlak sarı form.' },
  { id: 'sw_red', name: 'Red Kılıçkuyruk', rarity: 0, test: (p) => p.colId === 'red', spec: { sp: 'swordtail', col: 'red' }, hint: 'Kırmızı.', blurb: 'En bilinen kırmızı form.' },
  { id: 'sw_wild', name: 'Yeşil Kılıçkuyruk', rarity: 0, test: () => true, spec: { sp: 'swordtail' }, hint: 'Doğal yeşil.', blurb: 'Doğadaki yeşil-kahve form.' },
];

/* ======================= BETA ======================= */
const BETTA_COL = { R: HSL(2, 88, 44), B: HSL(218, 85, 44), Y: HSL(50, 95, 56), Wh: HSL(190, 12, 90), K: HSL(240, 18, 12) };
SCHEMA.betta = {
  auto: ['col', 'pat', 'fin', 'dumbo', 'marble'], sc: [], xy: 0,
  defAuto: { col: ['R', 'R'], pat: ['solid', 'solid'], fin: ['veil', 'veil'], dumbo: ['D', 'D'], marble: ['mb', 'mb'] }, defSc: {},
  quant: { size: [0.85, 1.25], vigor: [0.5, 1.4], intensity: [0.6, 1.3], giant: [0.8, 1.9] }, qdef: { giant: 1.0 },
  mut: mutPool({ col: ['R', 'B', 'Y', 'Wh', 'K'], pat: ['solid', 'bi', 'butterfly', 'koi', 'dragon'], fin: ['veil', 'plakat', 'half', 'crown', 'double'], dumbo: ['D', 'd'], marble: ['Mb', 'mb'] }), mutSc: mutScNone,
  founder: (sex, rng) => Genetics.make({ sp: 'betta', col: rng.pick(['R', 'B', 'Y', 'Wh']), fin: rng.pick(['veil', 'veil', 'plakat', 'half']) }, sex, rng, 'betta'),
  pheno(g) {
    const col = pick2(g.auto.col, ['K', 'B', 'R', 'Y', 'Wh']), col2 = g.auto.col.find((c) => c !== col) || 'Wh', pat = pick2(g.auto.pat, ['dragon', 'koi', 'butterfly', 'bi', 'solid']), fin = pick2(g.auto.fin, ['crown', 'half', 'double', 'plakat', 'veil']);
    const dumbo = g.auto.dumbo[0] === 'd' && g.auto.dumbo[1] === 'd', marble = g.auto.marble.includes('Mb'), M = g.sex === 'M', giant = g.quant.giant;
    const bc = BETTA_COL[col], p = { sex: g.sex, sp: 'betta', body: 'W', tail: M ? ({ veil: 'veil', plakat: 'plakat', half: 'halfmoon', crown: 'crown', double: 'double' })[fin] : 'round', tailColor: 'none', tailColor2: null, tux: 0, sb: 0, st: 0, grass: 0, mosaic: 0, moscow: 0, purple: false, metal: false,
      size: g.quant.size * (0.85 + giant * 0.2), tailLen: M ? 1.15 : 0.7, vigor: g.quant.vigor, intensity: g.quant.intensity, bodyCol: pat === 'bi' ? HSL(bc.h, bc.s * 0.8, bc.l * 0.85) : bc, tcol: pat === 'bi' ? BETTA_COL[col2 === col ? 'Wh' : col2] : bc, H: 0.78, dorsal: M ? 1.9 : 1.0, bigAnal: M, pec: dumbo ? 3.2 : 1.3,
      colId: col, patId: pat, fin, dumbo, marble, giant, fins: fin, penalty: fin === 'double' ? 0.92 : 1, extra: [] };
    if (pat === 'butterfly') p.extra.push({ t: 'butterfly' }); if (pat === 'koi') p.extra.push({ t: 'koi' }); if (pat === 'dragon') { p.extra.push({ t: 'dragon' }); p.metal = true; } if (marble) p.extra.push({ t: 'marble', col: 'rgba(255,255,255,.55)', n: 14, dyn: true });
    p.sig = ['b', g.sex, col, col2, pat, fin, dumbo | 0, marble | 0, Math.round(giant * 5)].join('|'); return p;
  },
  describe: (g) => [['Renk', g.auto.col.join(' / ')], ['Desen', g.auto.pat.join(' / ')], ['Yüzgeç', g.auto.fin.join(' / ')], ['Dumbo (çekinik)', g.auto.dumbo.join(' / ')], ['Marble', g.auto.marble.join(' / ')], ['Giant', g.quant.giant.toFixed(2)]],
};
SP_BREEDS.betta = [
  { id: 'be_marble', name: 'Marble', rarity: 3, test: (p) => p.marble, spec: { sp: 'betta', marble: ['Mb', 'mb'], col: 'B', fin: 'half' }, hint: 'Rengi yaşam boyu değişir.', blurb: 'Zıplayan gen sayesinde renk lekeleri zamanla kayar.' },
  { id: 'be_dragon', name: 'Dragon Scale', rarity: 2, test: (p) => p.patId === 'dragon', spec: { sp: 'betta', pat: ['dragon', 'dragon'], col: 'R', fin: 'plakat' }, hint: 'Metalik, kalın pullu.', blurb: 'Zırh gibi metalik pullu form.' },
  { id: 'be_koi', name: 'Koi', rarity: 2, test: (p) => p.patId === 'koi', spec: { sp: 'betta', pat: ['koi', 'koi'], col: 'R', fin: 'half' }, hint: 'Kırmızı-beyaz-siyah blok renkli.', blurb: 'Koi balığı gibi renkli bloklar.' },
  { id: 'be_butterfly', name: 'Butterfly', rarity: 1, test: (p) => p.patId === 'butterfly', spec: { sp: 'betta', pat: ['butterfly', 'butterfly'], col: 'B', fin: 'half' }, hint: 'Yüzgeç uçları açık renk.', blurb: 'Yüzgeçlerin dış kısmı beyaz-şeffaf bantlı.' },
  { id: 'be_bi', name: 'Bi-color', rarity: 1, test: (p) => p.patId === 'bi', spec: { sp: 'betta', pat: ['bi', 'bi'], col: ['R', 'Wh'], fin: 'crown' }, hint: 'Gövde ve yüzgeç farklı renk.', blurb: 'İki renkli: gövde ve yüzgeçler zıt.' },
  { id: 'be_dumbo', name: 'Dumbo', rarity: 2, test: (p) => p.dumbo, spec: { sp: 'betta', dumbo: ['d', 'd'], col: 'B', fin: 'half' }, hint: 'Fil kulağı gibi göğüs yüzgeçleri.', blurb: 'Büyük göğüs yüzgeçleriyle ünlü çekinik form.' },
  { id: 'be_giant', name: 'Giant', rarity: 2, test: (p) => p.giant >= 1.45, spec: { sp: 'betta', giant: 1.6, col: 'R', fin: 'veil' }, hint: 'Normalden çok iri.', blurb: 'İki katı boyuta ulaşan dev beta.' },
  { id: 'be_half', name: 'Halfmoon', rarity: 1, test: (p) => p.fin === 'half', spec: { sp: 'betta', fin: ['half', 'half'], col: 'R' }, hint: '180° açılan kuyruk.', blurb: 'Kuyruğu yarım daire biçiminde açılır.' },
  { id: 'be_crown', name: 'Crowntail', rarity: 1, test: (p) => p.fin === 'crown', spec: { sp: 'betta', fin: ['crown', 'crown'], col: 'B' }, hint: 'Taç gibi ışınlar.', blurb: 'Işınları uzayan taç kuyruk.' },
  { id: 'be_double', name: 'Double Tail', rarity: 1, test: (p) => p.fin === 'double', spec: { sp: 'betta', fin: ['double', 'double'], col: 'Y' }, hint: 'İki lobdan oluşan kuyruk.', blurb: 'Kuyruğu iki ayrı lob.' },
  { id: 'be_plakat', name: 'Plakat', rarity: 0, test: (p) => p.fin === 'plakat', spec: { sp: 'betta', fin: ['plakat', 'plakat'], col: 'R' }, hint: 'Kısa yüzgeçli, atletik.', blurb: 'Kısa yüzgeçli, dövüşçü görünümlü.' },
  { id: 'be_black', name: 'Black Orchid', rarity: 1, test: (p) => p.colId === 'K', spec: { sp: 'betta', col: 'K' }, hint: 'Simsiyah.', blurb: 'Koyu, siyah beta.' },
  { id: 'be_cello', name: 'Cellophane', rarity: 0, test: (p) => p.colId === 'Wh', spec: { sp: 'betta', col: 'Wh' }, hint: 'Saydam beyaz.', blurb: 'Pigmentsiz saydam görünüm.' },
  { id: 'be_yellow', name: 'Sarı Beta', rarity: 0, test: (p) => p.colId === 'Y', spec: { sp: 'betta', col: 'Y' }, hint: 'Sarı.', blurb: 'Sarı beta.' },
  { id: 'be_blue', name: 'Mavi Beta', rarity: 0, test: (p) => p.colId === 'B', spec: { sp: 'betta', col: 'B' }, hint: 'Mavi.', blurb: 'Mavi beta.' },
  { id: 'be_red', name: 'Kırmızı Veiltail', rarity: 0, test: () => true, spec: { sp: 'betta', col: 'R' }, hint: 'Kırmızı klasik.', blurb: 'Klasik kırmızı veiltail.' },
];

/* ======================= NEOCARİDİNA KARİDES ======================= */
const SH_PAIR = { 'B+O': 'red', 'B+R': 'bloody', 'K+R': 'bloody', 'B+Y': 'green', 'K+Y': 'green', 'O+Y': 'orange', 'O+R': 'red', 'R+Y': 'red', 'B+K': 'black', 'K+O': 'wild' };
const SH_COL = { wild: HSL(32, 24, 34), yellow: HSL(52, 92, 58), orange: HSL(26, 94, 54), red: HSL(2, 86, 44), blue: HSL(218, 78, 40), black: HSL(232, 22, 12), bloody: HSL(354, 72, 24), green: HSL(128, 62, 36) };
const shColor = (a) => { const [x, y] = a; if (x === 'W' || y === 'W') return 'wild'; if (x === y) return { Y: 'yellow', O: 'orange', R: 'red', B: 'blue', K: 'black' }[x]; return SH_PAIR[[x, y].sort().join('+')] || 'wild'; };
SCHEMA.shrimp = {
  auto: ['col', 'rili'], sc: [], xy: 0,
  defAuto: { col: ['W', 'W'], rili: ['r', 'r'] }, defSc: {},
  quant: { size: [0.85, 1.2], vigor: [0.5, 1.4], intensity: [0.6, 1.3], dens: [0.1, 1] }, qdef: { dens: 0.5 },
  mut: mutPool({ col: ['W', 'Y', 'O', 'R', 'B', 'K'], rili: ['r', 'R'] }), mutSc: mutScNone,
  founder: (sex, rng) => Genetics.make({ sp: 'shrimp', col: 'R', dens: 0.4 + rng.next() * 0.2 }, sex, rng, 'shrimp'),
  post(g, sire, dam, rng) { // geri dönüş: karışık hatlar yabani kahverengiye döner
    const mixed = (x) => x.auto.col && x.auto.col[0] !== x.auto.col[1] && x.auto.col[0] !== 'W' && x.auto.col[1] !== 'W';   // karışık hat (melez) ebeveyn
    if (mixed(sire) || mixed(dam)) g.auto.col = g.auto.col.map((a) => (rng.chance(0.1) ? 'W' : a));
  },
  pheno(g) {
    const color = shColor(g.auto.col), rili = g.auto.rili.includes('R'), dens = g.quant.dens, grade = dens < 0.35 ? 'C' : dens < 0.55 ? 'B' : dens < 0.78 ? 'A' : 'S', base = SH_COL[color];
    const p = { sex: g.sex, sp: 'shrimp', shrimpCol: color, rili, dens, grade, size: g.quant.size, vigor: g.quant.vigor, intensity: g.quant.intensity, bodyCol: HSL(base.h, base.s * (0.5 + 0.5 * dens), color === 'wild' ? base.l : base.l + (1 - dens) * 22), penalty: 1 };
    p.sig = ['h', g.sex, color, rili | 0, grade].join('|'); return p;
  },
  describe: (g) => [['Renk geni', g.auto.col.join(' / ')], ['Rili', g.auto.rili.join(' / ')], ['Yoğunluk', g.quant.dens.toFixed(2)]],
};
const shb = (id, name, rarity, test, spec, hint, blurb) => ({ id, name, rarity, test, spec, hint, blurb });
SP_BREEDS.shrimp = [
  shb('sh_carbon', 'Carbon Rili', 2, (p) => p.shrimpCol === 'black' && p.rili && p.dens >= 0.55, { sp: 'shrimp', col: 'K', rili: ['R', 'r'], dens: 0.9 }, 'Simsiyah, orta şeffaf.', 'Kömür gibi siyah, rili desenli.'),
  shb('sh_bloody', 'Bloody Mary', 2, (p) => p.shrimpCol === 'bloody', { sp: 'shrimp', col: ['R', 'K'], dens: 0.8 }, 'Koyu kan kırmızısı.', 'Kırmızı-siyah karışımı koyu kırmızı.'),
  shb('sh_painted', 'Painted Fire Red', 2, (p) => p.shrimpCol === 'red' && !p.rili && p.dens >= 0.78, { sp: 'shrimp', col: 'R', dens: 0.92 }, 'Tam kaplamalı yoğun kırmızı.', 'Yoğunluğu en üst derece kırmızı hat.'),
  shb('sh_bluedream', 'Blue Dream', 2, (p) => p.shrimpCol === 'blue' && !p.rili && p.dens >= 0.55, { sp: 'shrimp', col: 'B', dens: 0.85 }, 'Derin, koyu mavi.', 'Koyu mavi, yoğun kaplama.'),
  shb('sh_bluejelly', 'Blue Jelly', 1, (p) => p.shrimpCol === 'blue', { sp: 'shrimp', col: 'B', rili: ['R', 'R'], dens: 0.5 }, 'Açık mavi, rili.', 'Açık mavi, şeffaf alanlı.'),
  shb('sh_redrili', 'Red Rili', 1, (p) => p.shrimpCol === 'red' && p.rili, { sp: 'shrimp', col: 'R', rili: ['R', 'r'], dens: 0.6 }, 'Kırmızı, gövde ortası şeffaf.', 'Orange Sakura × Blue Jelly F1\'inin klasik formu.'),
  shb('sh_firered', 'Fire Red', 1, (p) => p.shrimpCol === 'red' && p.dens >= 0.55, { sp: 'shrimp', col: 'R', dens: 0.68 }, 'Yoğun kırmızı.', 'Cherry\'den daha yoğun kırmızı.'),
  shb('sh_orangerili', 'Orange Rili', 1, (p) => p.shrimpCol === 'orange' && p.rili, { sp: 'shrimp', col: 'O', rili: ['R', 'r'], dens: 0.6 }, 'Turuncu, rili.', 'Turuncu zeminde şeffaf bölge.'),
  shb('sh_yellowrili', 'Yellow Rili', 1, (p) => p.shrimpCol === 'yellow' && p.rili, { sp: 'shrimp', col: 'Y', rili: ['R', 'r'], dens: 0.6 }, 'Sarı, rili.', 'Sarı zeminde şeffaf bölge.'),
  shb('sh_green', 'Green Jade', 1, (p) => p.shrimpCol === 'green', { sp: 'shrimp', col: ['Y', 'B'], dens: 0.6 }, 'Yeşim yeşili.', 'Sarı ve mavi hatların karışımı yeşil.'),
  shb('sh_black', 'Chocolate / Siyah', 1, (p) => p.shrimpCol === 'black', { sp: 'shrimp', col: 'K', dens: 0.6 }, 'Çikolata-siyah.', 'Koyu kahve-siyah hat.'),
  shb('sh_yfire', 'Yellow Fire', 0, (p) => p.shrimpCol === 'yellow' && p.dens >= 0.55, { sp: 'shrimp', col: 'Y', dens: 0.7 }, 'Yoğun sarı.', 'Yoğun sarı hat.'),
  shb('sh_yneon', 'Yellow Neon', 0, (p) => p.shrimpCol === 'yellow', { sp: 'shrimp', col: 'Y', dens: 0.4 }, 'Açık sarı.', 'Açık sarı neon hat.'),
  shb('sh_sakura_o', 'Orange Sakura', 0, (p) => p.shrimpCol === 'orange', { sp: 'shrimp', col: 'O', dens: 0.5 }, 'Turuncu.', 'Turuncu Sakura hattı.'),
  shb('sh_sakura', 'Sakura', 0, (p) => p.shrimpCol === 'red' && p.dens >= 0.4, { sp: 'shrimp', col: 'R', dens: 0.5 }, 'Orta kırmızı.', 'Cherry\'den iyi, kaplaması orta kırmızı.'),
  shb('sh_cherry', 'Cherry', 0, (p) => p.shrimpCol === 'red', { sp: 'shrimp', col: 'R', dens: 0.3 }, 'Açık kırmızı.', 'En yaygın kırmızı hat.'),
  shb('sh_wild', 'Yabani (kahverengi)', 0, () => true, { sp: 'shrimp', col: 'W', dens: 0.3 }, 'Kahverengi, şeffaf.', 'Doğal, seçilmemiş yabani form.'),
];

/* ======================= GİZEMLİ SALYANGOZ ======================= */
const SN_SHELL = { gold: HSL(44, 88, 55), blue: HSL(210, 70, 50), purple: HSL(280, 50, 42), ivory: HSL(48, 30, 88), black: HSL(240, 14, 12), choc: HSL(24, 50, 28) };
SCHEMA.snail = {
  auto: ['shell', 'body'], sc: [], xy: 0,
  defAuto: { shell: ['gold', 'gold'], body: ['normal', 'normal'] }, defSc: {},
  quant: { size: [0.8, 1.3], vigor: [0.5, 1.4], intensity: [0.6, 1.3] },
  mut: mutPool({ shell: ['gold', 'blue', 'purple', 'ivory', 'black', 'choc'], body: ['normal', 'pale', 'dark'] }), mutSc: mutScNone,
  founder: (sex, rng) => Genetics.make({ sp: 'snail', shell: rng.pick(['gold', 'gold', 'ivory', 'choc']) }, sex, rng, 'snail'),
  pheno(g) {
    const shell = pick2(g.auto.shell, ['gold', 'black', 'purple', 'blue', 'choc', 'ivory']), body = pick2(g.auto.body, ['dark', 'normal', 'pale']);
    const p = { sex: g.sex, sp: 'snail', shell, bodyT: body, size: g.quant.size, vigor: g.quant.vigor, intensity: g.quant.intensity, shellCol: SN_SHELL[shell], bodyCol: body === 'dark' ? HSL(30, 30, 24) : body === 'pale' ? HSL(40, 30, 82) : HSL(36, 40, 56), penalty: 1 };
    p.sig = ['n', g.sex, shell, body].join('|'); return p;
  },
  describe: (g) => [['Kabuk rengi', g.auto.shell.join(' / ')], ['Gövde rengi', g.auto.body.join(' / ')]],
};
SP_BREEDS.snail = [
  { id: 'sn_black', name: 'Siyah Gizemli', rarity: 2, test: (p) => p.shell === 'black', spec: { sp: 'snail', shell: 'black', body: 'dark' }, hint: 'Siyah kabuk.', blurb: 'Nadir siyah kabuklu form.' },
  { id: 'sn_purple', name: 'Mor Gizemli', rarity: 2, test: (p) => p.shell === 'purple', spec: { sp: 'snail', shell: 'purple' }, hint: 'Mor kabuk.', blurb: 'Mor kabuklu, nadir.' },
  { id: 'sn_blue', name: 'Mavi Gizemli', rarity: 1, test: (p) => p.shell === 'blue', spec: { sp: 'snail', shell: 'blue' }, hint: 'Mavi kabuk.', blurb: 'Mavi kabuklu form.' },
  { id: 'sn_choc', name: 'Çikolata Gizemli', rarity: 1, test: (p) => p.shell === 'choc', spec: { sp: 'snail', shell: 'choc' }, hint: 'Çikolata kabuk.', blurb: 'Çikolata renkli.' },
  { id: 'sn_ivory', name: 'Fildişi Gizemli', rarity: 0, test: (p) => p.shell === 'ivory', spec: { sp: 'snail', shell: 'ivory', body: 'pale' }, hint: 'Fildişi.', blurb: 'Fildişi kabuklu.' },
  { id: 'sn_gold', name: 'Altın Gizemli', rarity: 0, test: () => true, spec: { sp: 'snail', shell: 'gold' }, hint: 'Altın sarısı.', blurb: 'En yaygın altın form.' },
];

/** Tüm ırkların birleşik listesi ve kimlikle erişim */
const ALL_BREEDS = [...BREEDS, ...Object.values(SP_BREEDS).flat()];
for (const b of ALL_BREEDS) BREED_BY_ID[b.id] = b;
const breedsOf = (sp) => (sp === 'guppy' ? BREEDS : SP_BREEDS[sp] || []);
