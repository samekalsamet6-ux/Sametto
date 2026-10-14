'use strict';
/* =====================================================================
   01 · VERİ TABLOLARI — türler, aleller, ırklar, nadirlik
   Yeni içerik eklemek = yeni kayıt eklemek.
   ===================================================================== */

const RARITY = [
  { id: 0, name: 'Sıradan', color: '#9aa8b1', icon: '●', value: 20 },
  { id: 1, name: 'Nadir', color: '#4aa8ff', icon: '◆', value: 60 },
  { id: 2, name: 'Epik', color: '#b06cff', icon: '★', value: 160 },
  { id: 3, name: 'Efsanevi', color: '#ffc247', icon: '✦', value: 450 },
  { id: 4, name: 'Mitik', color: '#ff7ad9', icon: '✧', value: 1500 },
];

/** Tür tablosu. `status:'soon'` olanlar ansiklopedide kilitli görünür. */
const SPECIES = [
  { id: 'guppy', name: 'Lepistes', sci: 'Poecilia reticulata', status: 'open' },
  { id: 'shrimp', name: 'Karides', sci: 'Neocaridina davidi', status: 'soon', stage: 7 },
  { id: 'molly', name: 'Moli', sci: 'Poecilia sphenops', status: 'soon', stage: 7 },
  { id: 'endler', name: 'Endler', sci: 'Poecilia wingei', status: 'soon', stage: 7 },
  { id: 'platy', name: 'Plati', sci: 'Xiphophorus maculatus', status: 'soon', stage: 7 },
  { id: 'swordtail', name: 'Kılıçkuyruk', sci: 'Xiphophorus hellerii', status: 'soon', stage: 7 },
  { id: 'snail', name: 'Gizemli Salyangoz', sci: 'Pomacea diffusa', status: 'soon', stage: 7 },
  { id: 'betta', name: 'Beta', sci: 'Betta splendens', status: 'soon', stage: 7 },
];

/* ---- Otozomal çekinik gövde rengi lokusu (W baskın; sıra = baskınlık) ---- */
const BODY = {
  W:   { name: 'Yabani',   h: 48,  s: 12, l: 50 },
  alb: { name: 'Albino',   h: 46,  s: 75, l: 84, eye: 'red' },
  bld: { name: 'Blond',    h: 38,  s: 50, l: 68 },
  gld: { name: 'Golden',   h: 42,  s: 88, l: 56 },
  blu: { name: 'Mavi',     h: 206, s: 52, l: 50 },
  pnk: { name: 'Pembe',    h: 338, s: 50, l: 74 },
  obs: { name: 'Obsidyen', h: 228, s: 35, l: 10, sheen: true },
  aur: { name: 'Aurora',   h: 170, s: 70, l: 62, sheen: true, iri: true },
};
const BODY_RANK = ['W', 'alb', 'bld', 'gld', 'blu', 'pnk', 'obs', 'aur'];

/* ---- Kuyruk tipleri (otozomal; sıra = baskınlık) ---- */
const TAILS = {
  delta:       { name: 'Delta',      bf: 0.60, soft: 1.0 },
  fan:         { name: 'Fan',        bf: 0.60, soft: 1.0 },
  veil:        { name: 'Veil',       bf: 0.55, soft: 0.6 },
  round:       { name: 'Roundtail',  bf: 0.62, soft: 1.0 },
  spade:       { name: 'Spadetail',  bf: 0.60, soft: 1.0 },
  lyre:        { name: 'Lyretail',   bf: 0.56, soft: 0.9 },
  topsword:    { name: 'Üst Kılıç',  bf: 0.54, soft: 0.8 },
  bottomsword: { name: 'Alt Kılıç',  bf: 0.54, soft: 0.8 },
  doublesword: { name: 'Çift Kılıç', bf: 0.50, soft: 0.8 },
  lace:        { name: 'Lace',       bf: 0.55, soft: 0.55 },
  halfmoon:    { name: 'Halfmoon',   bf: 0.58, soft: 0.7 },
  crown:       { name: 'Crowntail',  bf: 0.58, soft: 0.9 },
};
const TAIL_RANK = ['lyre', 'crown', 'lace', 'doublesword', 'topsword', 'bottomsword', 'halfmoon', 'spade', 'veil', 'round', 'fan', 'delta'];
/** Başlangıç popülasyonunda sık görülen (yaygın) kuyruklar. */
const TAIL_COMMON = ['delta', 'fan', 'round', 'veil', 'spade'];

/* ---- Cinsiyete bağlı kuyruk rengi ---- */
const TAILCOL = {
  none:  { name: 'Şeffaf',   h: 200, s: 12, l: 72 },
  red:   { name: 'Kırmızı',  h: 3,   s: 86, l: 48 },
  blue:  { name: 'Mavi',     h: 214, s: 86, l: 50 },
  green: { name: 'Yeşil',    h: 142, s: 66, l: 40 },
};

/** Nicel (poligenik) özellikler: aralık + ad */
const QUANT = {
  size:      { range: [0.75, 1.30], name: 'Boy' },
  tailLen:   { range: [0.60, 1.40], name: 'Kuyruk uzunluğu' },
  vigor:     { range: [0.50, 1.40], name: 'Dayanıklılık' },
  intensity: { range: [0.55, 1.30], name: 'Renk yoğunluğu' },
};

/* ---- Irk tablosu (nadirden yaygına; ilk eşleşen kazanır) ----
   test(p): erkek fenotipine bakar. spec: örnek (temsilî) erkek genomu. */
const BREEDS = [
  { id: 'aurora', name: 'Aurora', rarity: 4, test: (p) => p.body === 'aur',
    spec: { body: 'aur', tc: 'blue', tail: 'veil' }, hint: 'Çok nadir bir mutasyon; her açıdan renk değiştiren bir parıltı…',
    blurb: 'Işığa göre yeşilden mora kayan, mutasyonla doğan efsanevi bir hat.' },
  { id: 'obsidian', name: 'Obsidyen', rarity: 3, test: (p) => p.body === 'obs',
    spec: { body: 'obs', tc: 'red', tail: 'fan' }, hint: 'Gece gibi karanlık, parlak bir mutasyon.',
    blurb: 'Volkanik cam gibi parlayan, nadiren doğan koyu bir hat.' },
  { id: 'lace', name: 'Lace Kuyruk', rarity: 2, test: (p) => p.tail === 'lace',
    spec: { tail: 'lace', tc: 'blue' }, hint: 'Dantel gibi ince, uçuşan bir kuyruk.', blurb: 'Dantel dokulu, çok geniş kuyruk yüzgeci.' },
  { id: 'crown', name: 'Crowntail', rarity: 2, test: (p) => p.tail === 'crown',
    spec: { tail: 'crown', tc: 'red' }, hint: 'Kuyruk ışınları taç gibi sivrilir.', blurb: 'Kuyruğunun ışınları uçlarda uzayan, taç görünümlü hat.' },
  { id: 'halfmoon', name: 'Halfmoon', rarity: 2, test: (p) => p.tail === 'halfmoon',
    spec: { tail: 'halfmoon', tc: 'green' }, hint: '180 derece açılan bir kuyruk.', blurb: 'Kuyruğu yarım daire biçiminde tam açılan gösteri hattı.' },
  { id: 'albino_full_red', name: 'Albino Full Red', rarity: 2, test: (p) => p.body === 'alb' && p.tailColor === 'red' && p.moscow,
    spec: { body: 'alb', tc: 'red', moscow: 1, tail: 'delta' }, hint: 'Beyaz gövde, tamamen kırmızı kuyruk.', blurb: 'Albino gövde ile Moscow kırmızısının nadir birleşimi.' },
  { id: 'moscow_blue', name: 'Moscow Blue', rarity: 2, test: (p) => p.moscow && p.tailColor === 'blue',
    spec: { moscow: 1, tc: 'blue', tail: 'delta' }, hint: 'Koyu gövdeli, düz mavi kuyruklu klasik.', blurb: 'Y\'ye bağlı Moscow geni ve mavi kuyruk geninin birleşimi.' },
  { id: 'moscow_green', name: 'Moscow Green', rarity: 2, test: (p) => p.moscow && p.tailColor === 'green',
    spec: { moscow: 1, tc: 'green', tail: 'delta' }, hint: 'Koyu gövdeli, zümrüt kuyruklu.', blurb: 'Koyu Moscow gövdesi ile yeşil kuyruğun birleşimi.' },
  { id: 'moscow_red', name: 'Moscow Red', rarity: 1, test: (p) => p.moscow && p.tailColor === 'red',
    spec: { moscow: 1, tc: 'red', tail: 'fan' }, hint: 'Koyu gövde, ateş kırmızısı kuyruk.', blurb: 'Siyahımsı gövde üzerinde parlayan kırmızı kuyruk.' },
  { id: 'metal', name: 'Metal Platinum', rarity: 2, test: (p) => p.metal,
    spec: { metal: 1, body: 'blu', tc: 'blue', tail: 'delta' }, hint: 'Gövdesi metal gibi parlar.', blurb: 'Metalik parıltı veren Mg geni. İki kopya sağlığa zarar verir!' },
  { id: 'golden_snake', name: 'Golden Snakeskin', rarity: 2, test: (p) => (p.sb || p.st) && p.body === 'gld',
    spec: { body: 'gld', sb: 1, st: 1, tc: 'red', tail: 'fan' }, hint: 'Altın zeminde yılan derisi deseni.', blurb: 'Altın gövdede pul desenli klasik bir kombinasyon.' },
  { id: 'albino_red', name: 'Albino Red', rarity: 1, test: (p) => p.body === 'alb' && p.tailColor === 'red',
    spec: { body: 'alb', tc: 'red', tail: 'delta' }, hint: 'Kırmızı gözlü, kırmızı kuyruklu albino.', blurb: 'Pigmentsiz gövde, kırmızı kuyruk ve kırmızı gözler.' },
  { id: 'tuxedo', name: 'Tuxedo', rarity: 1, test: (p) => p.tux,
    spec: { tux: 1, tc: 'blue', tail: 'delta' }, hint: 'Gövdenin arka yarısı smokin gibi koyulaşır.', blurb: 'Arka yarısı koyu renkli, "smokinli" lepistes.' },
  { id: 'snakeskin', name: 'Snakeskin', rarity: 1, test: (p) => p.sb || p.st,
    spec: { sb: 1, st: 1, tc: 'none', tail: 'round' }, hint: 'Pullu, yılan derisi gibi bir desen.', blurb: 'Gövde ve kuyrukta halka biçimli yılan derisi deseni.' },
  { id: 'variegated', name: 'Mozaik (Variegated)', rarity: 1, test: (p) => p.mosaic,
    spec: { mosaic: 1, tc: 'green', tail: 'veil' }, hint: 'Lekeli, mozaik görünümlü.', blurb: 'Düzensiz renk lekeleriyle kaplı, her biri farklı bir tablo.' },
  { id: 'grass', name: 'Grass', rarity: 1, test: (p) => p.grass,
    spec: { grass: 1, tc: 'blue', tail: 'fan' }, hint: 'İnce noktalarla kaplı.', blurb: 'Gövde ve kuyruğu sık, küçük noktalarla kaplı.' },
  { id: 'purple', name: 'Mor Gövde', rarity: 1, test: (p) => p.purple,
    spec: { purple: 1, tc: 'blue', tail: 'delta' }, hint: 'Gövdesi mora çalar.', blurb: 'Otozomal baskın Purple Body geniyle morumsu gövde.' },
  { id: 'pink', name: 'Pembe Pul', rarity: 1, test: (p) => p.body === 'pnk',
    spec: { body: 'pnk', tc: 'none', tail: 'fan' }, hint: 'Pastel pembe bir gövde.', blurb: 'Çekinik pembe gövde rengi.' },
  { id: 'blue_body', name: 'Mavi Gövde', rarity: 1, test: (p) => p.body === 'blu' && p.tailColor !== 'none',
    spec: { body: 'blu', tc: 'blue', tail: 'delta' }, hint: 'Gökyüzü mavisi gövde.', blurb: 'Çekinik mavi gövde ile mavi kuyruğun uyumu.' },
  { id: 'albino', name: 'Albino', rarity: 1, test: (p) => p.body === 'alb',
    spec: { body: 'alb', tc: 'none', tail: 'delta' }, hint: 'Pigmentsiz, kırmızı gözlü.', blurb: 'Pigment üretmeyen, pembe-kırmızı gözlü form.' },
  { id: 'blond', name: 'Blond', rarity: 0, test: (p) => p.body === 'bld',
    spec: { body: 'bld', tc: 'none', tail: 'delta' }, hint: 'Açık sarı bir gövde.', blurb: 'Soluk altın tonlu, koyu gözlü klasik form.' },
  { id: 'golden', name: 'Golden', rarity: 0, test: (p) => p.body === 'gld',
    spec: { body: 'gld', tc: 'none', tail: 'delta' }, hint: 'Altın sarısı gövde.', blurb: 'Parlak altın sarısı gövde.' },
  { id: 'green_tail', name: 'Yeşil Kuyruk', rarity: 1, test: (p) => p.tailColor === 'green',
    spec: { tc: 'green', tail: 'fan' }, hint: 'Yeşil kuyruklu.', blurb: 'Yeşil kuyruk rengi geninin (Grt) taşıyıcısı.' },
  { id: 'red_tail', name: 'Kırmızı Kuyruk', rarity: 0, test: (p) => p.tailColor === 'red',
    spec: { tc: 'red', tail: 'delta' }, hint: 'Kırmızı kuyruklu.', blurb: 'Kırmızı kuyruk rengi geni (Rdt) taşıyan klasik form.' },
  { id: 'blue_tail', name: 'Mavi Kuyruk', rarity: 0, test: (p) => p.tailColor === 'blue',
    spec: { tc: 'blue', tail: 'fan' }, hint: 'Mavi kuyruklu.', blurb: 'Mavi kuyruk rengi geni (Blt) taşıyan klasik form.' },
  { id: 'wild', name: 'Yabani Tip', rarity: 0, test: () => true,
    spec: { tc: 'none', tail: 'delta' }, hint: 'Doğal görünüm.', blurb: 'Doğadaki lepistesin sade, gri tonlu hali.' },
];
const BREED_BY_ID = Object.fromEntries(BREEDS.map((b) => [b.id, b]));

/** Hikâye bildirimleri ve unvanlar */
const TITLES = [[1, 'Çaylak Akvaryumcu'], [5, 'Meraklı Üretici'], [12, 'Hat Sabitleyici'], [25, 'Genetik Ustası'], [50, 'Aquascape Sanatçısı'], [80, 'Büyük Usta']];
const NAMES_F = ['Ayşe', 'Elif', 'Defne', 'Zeynep', 'Mina', 'Selin', 'Nehir', 'Deniz', 'İnci', 'Lale', 'Pınar', 'Ela', 'Su', 'Ceren', 'Duru'];
const NAMES_M = ['Kaan', 'Mavi', 'Poyraz', 'Efe', 'Atlas', 'Kerem', 'Yağız', 'Barış', 'Ege', 'Toprak', 'Rüzgar', 'Alp', 'Çınar', 'Umut', 'Bulut'];
