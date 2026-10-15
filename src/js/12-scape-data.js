'use strict';
/* =====================================================================
   12 · AQUASCAPE VERİ TABLOLARI — zemin, taş/kök, dekor, bitki, ekipman, şablon
   (eff = günlük kimyasal etki katsayıları; Aşama 4'te simülasyona bağlanır)
   ===================================================================== */

const SUBSTRATES = {
  sand:     { name: 'İnert kum',      cost: 0,   lvl: 1, nut: 0.12, eff: {}, desc: 'Kimyaya etkisiz. Beyaz, siyah ve doğal renkleri var.', colors: { natural: [40, 38, 62], white: [45, 12, 88], black: [220, 10, 16] } },
  gravel:   { name: 'İnert çakıl',    cost: 15,  lvl: 1, nut: 0.12, eff: {}, desc: 'Kimyaya etkisiz, iri taneli; bitki köklenmesi orta.', colors: { natural: [30, 25, 50], white: [40, 8, 82], black: [220, 8, 20] } },
  aquasoil: { name: 'Aquasoil',       cost: 120, lvl: 3, nut: 1.0, eff: { ph: -0.9, kh: -0.6, gh: 0.1, nh3: 0.15 }, desc: 'Besin zengini; pH\'ı düşürür ve tamponlar. Bitkiler için en iyisi, karides için de iyi. İlk haftalarda amonyak salar.', colors: { natural: [22, 34, 20] } },
  coral:    { name: 'Mercan kırığı',  cost: 45,  lvl: 2, nut: 0.05, eff: { ph: 0.35, kh: 0.5, gh: 0.5 }, desc: 'GH, KH ve pH\'ı yükseltir — moliler ve salyangozlar için ideal.', colors: { natural: [40, 22, 84] } },
};

/** Taş ve kök. kind: rock | wood | leaf. w,h dünya birimi. */
const HARDSCAPE = {
  seiryu:   { name: 'Seiryu taşı',     kind: 'rock', w: 240, h: 144,  cost: 35, lvl: 1, col: [208, 14, 52], tex: 'vein',  eff: { kh: 0.05, gh: 0.04, ph: 0.02 }, info: 'Mavi-gri, keskin hatlı; kalsiyum karbonat içerir. Aylar içinde KH ve pH\'ı yükseltir. Iwagumi klasiği — karides tankında dikkat.' },
  dragon:   { name: 'Dragon (Ohko) taşı', kind: 'rock', w: 224, h: 136, cost: 40, lvl: 2, col: [38, 20, 62], tex: 'honey', eff: {}, info: 'Bal peteği dokulu, kimyaya etkisiz. Karides ve yumuşak su için güvenli; kırılgandır.' },
  lava:     { name: 'Lav taşı',        kind: 'rock', w: 192, h: 128,  cost: 25, lvl: 1, col: [12, 28, 30], tex: 'pore',  eff: { bio: 0.5 }, info: 'Gözenekli ve etkisiz; yüzeyi faydalı bakterilere ev olur, epifit bağlamaya uygundur.' },
  elephant: { name: 'Fil derisi taşı', kind: 'rock', w: 216, h: 136,  cost: 38, lvl: 4, col: [30, 8, 56], tex: 'wrinkle', eff: { kh: 0.02, gh: 0.015 }, info: 'Kırışık, gri bir doku; KH\'yi yavaşça yükseltir.' },
  manten:   { name: 'Manten taşı',     kind: 'rock', w: 208, h: 160, cost: 42, lvl: 5, col: [225, 10, 24], tex: 'plain', eff: {}, info: 'Koyu ve köşeli; kompozisyonda kontrast verir.' },
  spider:   { name: 'Spider wood',     kind: 'wood', w: 399, h: 323, cost: 45, lvl: 1, col: [28, 38, 28], branches: 'many', eff: { tannin: 0.5, ph: -0.04 }, info: 'İnce dallı kök. Tanen salar: pH hafif düşer, su çay rengine döner (blackwater).' },
  malaysian:{ name: 'Malezya kökü',    kind: 'wood', w: 361, h: 228, cost: 50, lvl: 3, col: [24, 32, 22], branches: 'log', eff: { tannin: 0.4, ph: -0.03 }, info: 'Kalın, bükülmüş gövde; ön plana güçlü bir odak noktası.' },
  manzanita:{ name: 'Manzanita',       kind: 'wood', w: 380, h: 342, cost: 65, lvl: 6, col: [14, 45, 36], branches: 'smooth', eff: { tannin: 0.2, ph: -0.02 }, info: 'Pürüzsüz, kırmızımsı dallar; az tanen salar.' },
  almond:   { name: 'Badem yaprağı',   kind: 'leaf', w: 156,  h: 54,  cost: 4,  lvl: 2, col: [28, 50, 34], eff: { tannin: 0.25, ph: -0.02, bio: 0.2 }, info: 'Tanen ve bakteri/yavru dostu bonus (biyotop puanı).' },
  cone:     { name: 'Kızılağaç kozalağı', kind: 'leaf', w: 40, h: 47, cost: 3, lvl: 2, col: [20, 40, 24], eff: { tannin: 0.15, ph: -0.01 }, info: 'Hafif tanen salar; blackwater görünümünü destekler.' },
};

const DECOR = {
  cave:    { name: 'Mağara',        w: 240, h: 144,  cost: 30, lvl: 1, col: [30, 14, 44], shape: 'cave' },
  amphora: { name: 'Amfora',        w: 96,  h: 144,  cost: 22, lvl: 2, col: [18, 55, 45], shape: 'amphora' },
  column:  { name: 'Antik sütun',   w: 86,  h: 208, cost: 35, lvl: 4, col: [40, 10, 70], shape: 'column' },
  chest:   { name: 'Hazine sandığı', w: 128, h: 90,  cost: 40, lvl: 6, col: [28, 50, 30], shape: 'chest' },
  pipe:    { name: 'Seramik boru',  w: 176, h: 80,  cost: 20, lvl: 1, col: [12, 45, 42], shape: 'pipe' },
};

/* ---- Bitkiler. type: ribbon | rosette | stem | carpet | epi | moss | float
   light 1 düşük–3 yüksek, co2 0 gereksiz–2 şart, grow göreli hız, red: kırmızılaşabilir ---- */
const PLANTS = {
  anubias:     { name: 'Anubias',            sci: 'Anubias barteri var. nana', type: 'epi',    sub: 'broad', w: 100,  h: 110,  layer: 'mid',  light: 1, co2: 0, grow: 0.35, diff: 1, col: [118, 45, 30], cost: 14, lvl: 1, info: 'Çok dayanıklı, yavaş büyür. Rizomu gömülmemeli; taş veya köke bağlanır.', melt: 0 },
  javafern:    { name: 'Java eğreltisi',     sci: 'Microsorum pteropus',      type: 'epi',    sub: 'fern',  w: 160,  h: 280,  layer: 'mid',  light: 1, co2: 0, grow: 0.4,  diff: 1, col: [108, 45, 28], cost: 12, lvl: 1, info: 'Düşük teknoloji klasiği; karanlık köşelerde bile yaşar.', melt: 0 },
  buce:        { name: 'Bucephalandra',      sci: 'Bucephalandra sp.',        type: 'epi',    sub: 'wavy',  w: 70,  h: 90,  layer: 'mid',  light: 2, co2: 1, grow: 0.45, diff: 2, col: [150, 40, 28], cost: 28, lvl: 4, info: 'Küçük, dalgalı yapraklı; taş üzerinde mücevher gibi durur.', melt: 0 },
  javamoss:    { name: 'Java yosunu',        sci: 'Taxiphyllum barbieri',     type: 'moss',   w: 120,  h: 50,  layer: 'mid',  light: 1, co2: 0, grow: 0.7,  diff: 1, col: [112, 50, 30], cost: 10, lvl: 1, info: 'Yumuşak yosun; karides ve yavrular için harika bir saklanma yeri.', melt: 0 },
  wendtii:     { name: 'Cryptocoryne wendtii', sci: 'Cryptocoryne wendtii',   type: 'rosette',w: 240,  h: 260,  layer: 'mid',  light: 1, co2: 0, grow: 0.5,  diff: 2, col: [100, 38, 28], cost: 16, lvl: 1, info: 'Yeni dikilince birkaç gün yaprak döker ("crypt melt"); panik yok, toparlanır.', melt: 1 },
  cryptparva:  { name: 'Cryptocoryne parva', sci: 'Cryptocoryne parva',       type: 'rosette',w: 110,  h: 100,  layer: 'fg',   light: 2, co2: 1, grow: 0.25, diff: 3, col: [105, 45, 32], cost: 24, lvl: 5, info: 'En küçük crypt; çok yavaş, ön plan halısı için.', melt: 1 },
  sword:       { name: 'Amazon kılıç',       sci: 'Echinodorus bleheri',      type: 'rosette',w: 360, h: 520, layer: 'bg',   light: 2, co2: 0, grow: 0.6,  diff: 2, col: [112, 50, 30], cost: 30, lvl: 3, info: 'Büyük, gösterişli rozet; güçlü kökler için besinli zemin ister.', melt: 0 },
  vallis:      { name: 'Vallisneria',        sci: 'Vallisneria spiralis',     type: 'ribbon', w: 150,  h: 520, layer: 'bg',   light: 1, co2: 0, grow: 1.0,  diff: 1, col: [118, 52, 34], cost: 10, lvl: 1, info: 'Uzun şerit yapraklar; koşucularla yayılır.', melt: 0 },
  hairgrass:   { name: 'Cüce saç otu',       sci: 'Eleocharis parvula',       type: 'carpet', sub: 'grass', w: 110,  h: 80,  layer: 'fg',   light: 2, co2: 1, grow: 0.9,  diff: 3, col: [105, 55, 36], cost: 20, lvl: 4, info: 'İnce, çim gibi halı; CO₂ ile daha sık büyür.', melt: 0 },
  dwarfsag:    { name: 'Cüce sagittaria',    sci: 'Sagittaria subulata',      type: 'carpet', sub: 'grass', w: 110,  h: 110,  layer: 'fg',   light: 1, co2: 0, grow: 0.9,  diff: 2, col: [115, 50, 32], cost: 14, lvl: 2, info: 'Kolay halı bitkisi; düşük ışıkta da yayılır.', melt: 0 },
  monte:       { name: 'Monte Carlo',        sci: 'Micranthemum tweediei',    type: 'carpet', sub: 'leafy', w: 110,  h: 60,  layer: 'fg',   light: 2, co2: 1, grow: 0.7,  diff: 3, col: [105, 58, 38], cost: 26, lvl: 3, info: 'CO₂\'siz de halı yapar ama yavaş; CO₂ ile hızlanır.', melt: 0 },
  marsilea:    { name: 'Marsilea',           sci: 'Marsilea hirsuta',         type: 'carpet', sub: 'clover',w: 110,  h: 50,  layer: 'fg',   light: 2, co2: 1, grow: 0.5,  diff: 3, col: [125, 50, 34], cost: 24, lvl: 4, info: 'Dört yapraklı yonca görünümlü halı.', melt: 0 },
  hccuba:      { name: 'HC Cuba',            sci: 'Hemianthus callitrichoides', type: 'carpet', sub: 'tiny', w: 100, h: 30, layer: 'fg',   light: 3, co2: 2, grow: 0.6,  diff: 5, col: [100, 62, 40], cost: 48, lvl: 8, info: 'En küçük yapraklı halı. Basınçlı CO₂ şart: CO₂ yoksa yayılmak yerine dikine uzar.', melt: 0 },
  glosso:      { name: 'Glossostigma',       sci: 'Glossostigma elatinoides', type: 'carpet', sub: 'clover',w: 110,  h: 40,  layer: 'fg',   light: 3, co2: 2, grow: 0.8,  diff: 5, col: [112, 60, 38], cost: 44, lvl: 8, info: 'Yüksek ışık ve CO₂ ister; sık, parlak bir halı oluşturur.', melt: 0 },
  staurogyne:  { name: 'Staurogyne repens',  sci: 'Staurogyne repens',        type: 'carpet', sub: 'leafy', w: 110,  h: 110,  layer: 'fg',   light: 1, co2: 0, grow: 0.55, diff: 2, col: [108, 52, 32], cost: 18, lvl: 2, info: 'Düşük teknolojide halıya en yakın gövdeli bitki.', melt: 0 },
  watersprite: { name: 'Su sprite',          sci: 'Ceratopteris thalictroides', type: 'stem', sub: 'fern',  w: 150,  h: 380, layer: 'mid',  light: 1, co2: 0, grow: 1.4,  diff: 1, col: [100, 55, 38], cost: 8,  lvl: 1, info: 'Çok hızlı büyür ve besin tüketir; yosunları dengeler.', melt: 0 },
  hornwort:    { name: 'Hornwort',           sci: 'Ceratophyllum demersum',   type: 'stem',   sub: 'bushy', w: 130,  h: 480, layer: 'mid',  light: 1, co2: 0, grow: 1.5,  diff: 1, col: [110, 45, 28], cost: 6,  lvl: 1, info: 'Köksüz, çok hızlı; nitratı hızla tüketir.', melt: 0 },
  guppygrass:  { name: 'Guppy otu',          sci: 'Najas guadalupensis',      type: 'stem',   sub: 'bushy', w: 130,  h: 440, layer: 'mid',  light: 1, co2: 0, grow: 1.6,  diff: 1, col: [96, 50, 34], cost: 6,  lvl: 1, info: 'Lepistes yavruları için en iyi saklanma yeri.', melt: 0 },
  ludwigia:    { name: 'Ludwigia repens',    sci: 'Ludwigia repens',          type: 'stem',   sub: 'leafy', w: 120,  h: 420, layer: 'mid',  light: 2, co2: 1, grow: 1.0,  diff: 2, col: [95, 50, 38], cost: 14, lvl: 3, red: 1, info: 'Yüksek ışıkta üst yaprakları kırmızılaşır.', melt: 0 },
  rotala:      { name: 'Rotala rotundifolia',sci: 'Rotala rotundifolia',      type: 'stem',   sub: 'leafy', w: 120,  h: 440, layer: 'mid',  light: 2, co2: 1, grow: 1.1,  diff: 3, col: [90, 52, 40], cost: 16, lvl: 3, red: 1, info: 'Işıkta turuncu-pembeye döner; grup halinde çok güzeldir.', melt: 0 },
  hygro:       { name: 'Hygrophila polysperma', sci: 'Hygrophila polysperma', type: 'stem',   sub: 'leafy', w: 150,  h: 520, layer: 'bg',   light: 1, co2: 0, grow: 1.5,  diff: 1, col: [105, 48, 34], cost: 8,  lvl: 2, info: 'Dayanıklı ve hızlı; arka plan için idealdir.', melt: 0 },
  cabomba:     { name: 'Cabomba',            sci: 'Cabomba caroliniana',      type: 'stem',   sub: 'fine',  w: 150,  h: 500, layer: 'bg',   light: 2, co2: 1, grow: 1.2,  diff: 3, col: [104, 48, 36], cost: 14, lvl: 4, info: 'Tüy gibi ince yapraklı; besin eksikliğinde çabuk erir.', melt: 1 },
  pogostemon:  { name: 'Pogostemon stellatus', sci: 'Pogostemon stellatus',   type: 'stem',   sub: 'fine',  w: 130,  h: 340, layer: 'mid',  light: 2, co2: 1, grow: 1.0,  diff: 3, col: [92, 52, 40], cost: 18, lvl: 5, red: 1, info: 'Yıldız şeklinde yaprak halkaları.', melt: 0 },
  alternanthera:{ name: 'Alternanthera reineckii', sci: 'Alternanthera reineckii', type: 'stem', sub: 'leafy', w: 120, h: 330, layer: 'mid', light: 3, co2: 2, grow: 0.8, diff: 5, col: [5, 55, 38], cost: 40, lvl: 9, red: 1, info: 'Kırmızı bitki: yüksek ışık + CO₂ + gübre ister.', melt: 0 },
  macrandra:   { name: 'Rotala macrandra',   sci: 'Rotala macrandra',         type: 'stem',   sub: 'leafy', w: 120,  h: 320, layer: 'mid',  light: 3, co2: 2, grow: 0.7,  diff: 5, col: [350, 60, 44], cost: 46, lvl: 10, red: 1, info: 'Tankın en iddialı kırmızısı; zor ve titizdir.', melt: 0 },
  salvinia:    { name: 'Salvinia',           sci: 'Salvinia natans',          type: 'float',  w: 140,  h: 26,  layer: 'float',light: 1, co2: 0, grow: 1.2,  diff: 1, col: [105, 45, 40], cost: 8,  lvl: 1, info: 'Yüzeyi kaplar: alttaki bitkilere ışığı azaltır, yavrulara saklanma sağlar.', melt: 0 },
  limnobium:   { name: 'Limnobium',          sci: 'Limnobium laevigatum',     type: 'float',  w: 150,  h: 36,  layer: 'float',light: 1, co2: 0, grow: 1.0,  diff: 1, col: [110, 55, 36], cost: 9,  lvl: 2, info: 'Uzun kökleri yavrular için orman gibidir; fazlası hasat edilip satılır.', melt: 0 },
};
const PLANT_LAYERS = { bg: 'Arka', mid: 'Orta', fg: 'Ön', epi: 'Epifit', float: 'Yüzen' };

/* ---- Ekipman (seçenekler) ---- */
const EQUIP = {
  filter: { sponge: { name: 'Sünger filtre', cost: 25, lvl: 1, flow: 0.3, bio: 1.0 }, internal: { name: 'İç filtre', cost: 45, lvl: 1, flow: 0.6, bio: 0.85 }, external: { name: 'Dış filtre', cost: 140, lvl: 6, flow: 1.0, bio: 1.6 } },
  heater: { none: { name: 'Isıtıcı yok', cost: 0 }, on: { name: 'Isıtıcı (25 °C)', cost: 40, lvl: 1 } },
  co2: { none: { name: 'CO₂ yok', cost: 0 }, liquid: { name: 'Sıvı karbon', cost: 30, lvl: 2, v: 0.35 }, tank: { name: 'Basınçlı tüp + difüzör', cost: 260, lvl: 10, v: 1.0 } },
  light: { cost: 60, lvl: 1 },
  air: { cost: 10, lvl: 1 },
};
const TANK_SIZES = [{ l: 20, name: 'Nano 20 L', cost: 0, lvl: 1 }, { l: 40, name: '40 L', cost: 80, lvl: 2 }, { l: 60, name: '60 L', cost: 160, lvl: 4 }, { l: 100, name: '100 L', cost: 320, lvl: 8 }, { l: 200, name: '200 L', cost: 700, lvl: 14 }, { l: 300, name: '300 L', cost: 1200, lvl: 22 }];
const BACKDROPS = { blue: 'Mavi gradyan', black: 'Siyah', frost: 'Buzlu', nature: 'Doğa', aurora: 'Aurora gecesi' };

/* ---- Hazır şablonlar (items: [tür, tanım, x(0..1), ek alanlar]) ---- */
const TEMPLATES = {
  start:   { name: 'Başlangıç', desc: 'Dengeli, bakımı kolay bir başlangıç tankı.', liters: 60, sub: { type: 'sand', color: 'natural' }, equip: { filter: 'internal', heater: true, co2: 'none', air: true },
    items: [['rock', 'seiryu', 0.30, { s: 1.0 }], ['rock', 'seiryu', 0.37, { s: 0.6 }], ['rock', 'lava', 0.74, { s: 0.85 }], ['plant', 'vallis', 0.05], ['plant', 'vallis', 0.1], ['plant', 'vallis', 0.9], ['plant', 'vallis', 0.95], ['plant', 'hygro', 0.83], ['plant', 'watersprite', 0.47], ['plant', 'anubias', 0.31, { onRock: 0 }], ['plant', 'javafern', 0.74, { onRock: 2 }], ['plant', 'sagittaria', 0.2]].filter((i) => i[1] !== 'sagittaria') },
  iwagumi: { name: 'Başlangıç Iwagumi', desc: 'Tek halı, tek sayıda taş: Oyaishi üçler kuralı noktasında.', liters: 60, sub: { type: 'aquasoil', color: 'natural' }, equip: { filter: 'internal', heater: true, co2: 'liquid', air: false },
    items: [['rock', 'seiryu', 0.36, { s: 1.5 }], ['rock', 'seiryu', 0.5, { s: 0.95 }], ['rock', 'seiryu', 0.24, { s: 0.7 }], ['plant', 'monte', 0.2], ['plant', 'monte', 0.32], ['plant', 'monte', 0.48], ['plant', 'monte', 0.62], ['plant', 'monte', 0.76], ['plant', 'monte', 0.88]] },
  shrimp:  { name: 'Karides Ormanı', desc: 'Yosun, kök ve dallar: karidesler için yoğun saklanma alanları.', liters: 40, sub: { type: 'aquasoil', color: 'natural' }, equip: { filter: 'sponge', heater: false, co2: 'none', air: true },
    items: [['wood', 'spider', 0.4, { s: 1.15 }], ['rock', 'dragon', 0.75, { s: 0.9 }], ['plant', 'javamoss', 0.34, { onWood: 0 }], ['plant', 'javamoss', 0.46, { onWood: 0 }], ['plant', 'anubias', 0.4, { onWood: 0 }], ['plant', 'wendtii', 0.14], ['plant', 'wendtii', 0.86], ['plant', 'staurogyne', 0.6], ['plant', 'watersprite', 0.25], ['plant', 'hornwort', 0.92], ['leaf', 'almond', 0.55], ['leaf', 'almond', 0.62]] },
  betta:   { name: 'Beta Biyotopu', desc: 'Durgun, gölgeli, yüzen bitkili bir Tayland pirinç tarlası.', liters: 20, sub: { type: 'sand', color: 'natural' }, equip: { filter: 'sponge', heater: true, co2: 'none', air: false },
    items: [['wood', 'malaysian', 0.45, { s: 0.9 }], ['plant', 'wendtii', 0.15], ['plant', 'wendtii', 0.8], ['plant', 'vallis', 0.92], ['plant', 'salvinia', 0.3], ['plant', 'salvinia', 0.65], ['plant', 'limnobium', 0.48], ['leaf', 'almond', 0.3], ['leaf', 'almond', 0.7], ['leaf', 'cone', 0.6]] },
};

/* Işık spektrumu: büyüme/yosun çarpanı (grow), kırmızı bitki renklenmesi (red), hüzme rengi (ray) */
const SPECTRA = {
  white: { name: 'Doğal beyaz (6500 K)', ray: '210,255,250', grow: 1.0, red: 1.0, cost: 0, lvl: 1 },
  warm:  { name: 'Sıcak (3000 K)', ray: '255,222,170', grow: 0.92, red: 1.15, cost: 20, lvl: 2 },
  plant: { name: 'Bitki (kırmızı-mavi)', ray: '255,170,215', grow: 1.14, red: 1.6, cost: 55, lvl: 3 },
  blue:  { name: 'Mavi aktinik', ray: '140,190,255', grow: 0.75, red: 0.7, cost: 40, lvl: 2 },
};
const specOf = (sc) => SPECTRA[(sc.equip.light && sc.equip.light.spec) || 'white'] || SPECTRA.white;
