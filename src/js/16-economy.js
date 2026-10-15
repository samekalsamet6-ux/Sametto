'use strict';
/* =====================================================================
   16 · EKONOMİ & İLERLEME — olaylar, görevler, başarımlar, pazar, mağaza stoğu,
        siparişler, araştırma ağacı
   Para birimleri: Altın Pul (coins), İtibar (rep), Yosun Taşı (stone; sadece başarım/sezon).
   Oyuncuya saygı: ceza veren seri yok; kaçırılan günlük görev kaybolur ama borç yaratmaz.
   ===================================================================== */

/* ---- Tür açılış seviyeleri (kilit sırası) ---- */
const SPECIES_LVL = { guppy: 1, shrimp: 5, molly: 10, endler: 15, platy: 20, swordtail: 26, snail: 32, betta: 40 };

/* ---- Araştırma ağacı: İtibar ile açılır ---- */
const RESEARCH = [
  { id: 'lab',       name: 'Genetik Test Lab.',     icon: '🧪', cost: 10, after: null,       desc: 'Genotip testi 40 yerine 10 Altın Pul.' },
  { id: 'nursery',   name: 'Yavru büyütme odası',   icon: '🍼', cost: 20, after: null,       desc: 'Yavruların hayatta kalma oranı %55 → %80.' },
  { id: 'quar',      name: 'Büyük karantina',       icon: '🏥', cost: 15, after: null,       desc: 'Karantina tankı 4 yerine 8 balık alır.' },
  { id: 'feeder',    name: 'Otomatik besleyici',    icon: '⏲️', cost: 30, after: null,       desc: 'Her gün 18:00\'de kendiliğinden yem verir. Çevrimdışı güvenlik.' },
  { id: 'ro',        name: 'RO sistemi',            icon: '🚰', cost: 25, after: null,       desc: 'Musluk suyu seçeneklerine "RO + mineral" eklenir (karides için).' },
  { id: 'co2',       name: 'Basınçlı CO₂',          icon: '🫧', cost: 40, after: 'ro',       desc: 'Basınçlı tüp + difüzör satın alınabilir.' },
  { id: 'bigtank',   name: 'Daha büyük tanklar',    icon: '🛢️', cost: 60, after: 'quar',     desc: '200 L ve 300 L tanklar açılır.' },
  { id: 'hall',      name: 'Sergi salonu',          icon: '🏆', cost: 80, after: 'nursery',  desc: 'Canlı sergilerine ve Aquascape Yarışması\'na katılım.' },
];
TAP_PROFILES.ro = { name: 'RO + mineral', ph: 7.0, gh: 6, kh: 3, tds: 150, temp: 20 };

/* ---- Başarımlar: bronz / gümüş / altın ---- */
const ACHIEVEMENTS = [
  { id: 'born',   name: 'Üretici',        ic: '🍼', desc: 'Yavru dünyaya getir', tiers: [1, 25, 150], get: (S) => S.cnt.born || 0 },
  { id: 'disc',   name: 'Koleksiyoncu',   ic: '📖', desc: 'Lepistes varyasyonu keşfet', tiers: [4, 12, 24], get: (S) => BREEDS.filter((b) => S.discovered[b.id]).length },
  { id: 'sold',   name: 'Satıcı',         ic: '💰', desc: 'Balık sat', tiers: [3, 20, 80], get: (S) => S.stats.sold },
  { id: 'prune',  name: 'Bahçıvan',       ic: '✂️', desc: 'Bitki buda', tiers: [2, 12, 40], get: (S) => S.cnt.prune || 0 },
  { id: 'scape',  name: 'Tasarımcı',      ic: '🪨', desc: 'Stüdyoda öğe yerleştir', tiers: [8, 40, 150], get: (S) => S.cnt.scape || 0 },
  { id: 'photo',  name: 'Fotoğrafçı',     ic: '📷', desc: 'Fotoğraf çek', tiers: [1, 8, 25], get: (S) => S.cnt.photo || 0 },
  { id: 'water',  name: 'Su ustası',      ic: '💧', desc: 'Su değişimi yap', tiers: [3, 15, 50], get: (S) => S.cnt.water || 0 },
  { id: 'lesson', name: 'Mezun',          ic: '🎓', desc: 'Genetik Okulu dersi bitir', tiers: [1, 3, 5], get: (S) => Object.keys(S.lessons || {}).length },
  { id: 'cured',  name: 'Şifacı',         ic: '💚', desc: 'Hasta balığı iyileştir', tiers: [1, 6, 20], get: (S) => S.cnt.cured || 0 },
  { id: 'order',  name: 'Güvenilir esnaf',ic: '📦', desc: 'Sipariş teslim et', tiers: [1, 8, 30], get: (S) => S.cnt.order || 0 },
  { id: 'rich',   name: 'Servet',         ic: '🏦', desc: 'Toplam kazanılan Altın Pul', tiers: [1000, 10000, 60000], get: (S) => S.cnt.earned || 0 },
  { id: 'clean',  name: 'Sorumlu Üretici',ic: '🌱', desc: 'Sağlıklı (kusursuz) yavru', tiers: [25, 100, 400], get: (S) => S.cnt.bornHealthy || 0 },
  { id: 'carpet', name: 'Yeşil Halı',     ic: '🟩', desc: 'Yayılmış halı bitki parçası', tiers: [1, 3, 6], get: () => Game.tank.scape.items.filter((i) => i.k === 'plant' && PLANTS[i.d].type === 'carpet' && (i.sp || 1) >= 1.5).length },
  { id: 'clear',  name: 'Berrak Su',      ic: '✨', desc: 'Su dengede gün (ardışık olmadan toplam)', tiers: [5, 30, 100], get: (S) => S.cnt.goodDays || 0 },
];
const TIER_NAMES = ['Bronz', 'Gümüş', 'Altın'], TIER_REWARD = [{ coins: 50, xp: 20, stone: 0, rep: 0 }, { coins: 150, xp: 60, stone: 0, rep: 3 }, { coins: 400, xp: 150, stone: 3, rep: 10 }];

/* ---- Günlük / haftalık görev havuzu ---- */
const QUEST_POOL = {
  daily: [
    { id: 'feed', ev: 'feed', n: (g) => `Balıkları ${g} kez besle`, g: [2, 4], r: 12 }, { id: 'water', ev: 'water', n: () => 'Su değişimi yap', g: [1, 1], r: 30 },
    { id: 'inspect', ev: 'inspect', n: (g) => `${g} balığın kartını incele`, g: [2, 3], r: 10 }, { id: 'mate', ev: 'mate', n: () => 'Bir çift çiftleştir', g: [1, 1], r: 30 },
    { id: 'sold', ev: 'sold', n: (g) => `${g} balık sat`, g: [1, 2], r: 25 }, { id: 'prune', ev: 'prune', n: () => 'Bir bitkiyi buda', g: [1, 1], r: 30 },
    { id: 'photo', ev: 'photo', n: () => 'Bir fotoğraf çek', g: [1, 1], r: 25 }, { id: 'scape', ev: 'scape', n: (g) => `Stüdyoda ${g} öğe yerleştir`, g: [2, 3], r: 15 },
    { id: 'test', ev: 'test', n: () => 'Bir balığın genotipini test et', g: [1, 1], r: 35 }, { id: 'zoom', ev: 'zoom', n: () => 'Tankı yakınlaştırıp incele', g: [1, 1], r: 15 },
  ],
  weekly: [
    { id: 'feed', ev: 'feed', n: (g) => `${g} kez yem ver`, g: [14, 20], r: 8 }, { id: 'born', ev: 'born', n: (g) => `${g} yavru dünyaya getir`, g: [6, 12], r: 12 },
    { id: 'sold', ev: 'sold', n: (g) => `${g} balık sat`, g: [4, 8], r: 18 }, { id: 'scape', ev: 'scape', n: (g) => `${g} öğe yerleştir`, g: [8, 14], r: 8 },
    { id: 'water', ev: 'water', n: (g) => `${g} su değişimi`, g: [3, 4], r: 28 }, { id: 'order', ev: 'order', n: (g) => `${g} sipariş teslim et`, g: [2, 3], r: 50 },
    { id: 'mate', ev: 'mate', n: (g) => `${g} çiftleştirme`, g: [2, 4], r: 28 }, { id: 'prune', ev: 'prune', n: (g) => `${g} budama`, g: [3, 5], r: 22 },
    { id: 'lesson', ev: 'lesson', n: () => 'Bir Genetik Okulu dersi bitir', g: [1, 1], r: 90 }, { id: 'discover', ev: 'discover', n: () => 'Yeni bir varyasyon keşfet', g: [1, 1], r: 100 },
  ],
};

const Quests = {
  weekKey() { const d = new Date(), t = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate())), day = t.getUTCDay() || 7; t.setUTCDate(t.getUTCDate() + 4 - day); const y0 = new Date(Date.UTC(t.getUTCFullYear(), 0, 1)); return t.getUTCFullYear() + '-W' + Math.ceil(((t - y0) / 86400000 + 1) / 7); },
  mk(scope, tpl, rng) { const g = rng.int(tpl.g[0], tpl.g[1]); return { id: tpl.id, ev: tpl.ev, name: tpl.n(g), goal: g, prog: 0, claimed: false, coins: Math.round(g * tpl.r * (scope === 'weekly' ? 1 : 1)), xp: Math.round(g * tpl.r * 0.4) }; },
  /** Günü/haftayı kontrol edip yeni listeleri üretir (kaçırılan görev ceza yaratmaz). */
  refresh(S) {
    const dk = todayKey(); if (!S.dq || S.dq.key !== dk) { const rng = new RNG(hashStr(dk + S.createdAt)); const pool = rng.shuffle(QUEST_POOL.daily.slice()); S.dq = { key: dk, reroll: 1, list: pool.slice(0, 3).map((t) => this.mk('daily', t, rng)) }; }
    const wk = this.weekKey(); if (!S.wq || S.wq.key !== wk) { const rng = new RNG(hashStr(wk + S.createdAt)); const pool = rng.shuffle(QUEST_POOL.weekly.slice()); S.wq = { key: wk, chest: false, list: pool.slice(0, 5).map((t) => this.mk('weekly', t, rng)) }; }
  },
  bump(S, ev, n) { for (const q of [...S.dq.list, ...S.wq.list]) if (q.ev === ev && q.prog < q.goal) { q.prog = Math.min(q.goal, q.prog + n); if (q.prog >= q.goal) UI.toast(`Görev tamam: ${q.name}`, 'check', 2800); } },
  claim(S, q) { if (q.claimed || q.prog < q.goal) return false; q.claimed = true; Game.addCoins(q.coins, true); Game.addXp(q.xp); AudioSys.SFX.coin(); UI.toast(`+${q.coins} 💰  +${q.xp} XP`, 'coin'); return true; },
  reroll(S, i) { const q = S.dq.list[i]; if (!S.dq.reroll || q.claimed || q.prog >= q.goal) return false; const used = S.dq.list.map((x) => x.id), pool = QUEST_POOL.daily.filter((t) => !used.includes(t.id)); const rng = new RNG((Date.now() >>> 0)); S.dq.list[i] = this.mk('daily', rng.pick(pool), rng); S.dq.reroll = 0; return true; },
  openChest(S) {
    if (S.wq.chest || !S.wq.list.every((q) => q.claimed)) return null; S.wq.chest = true; const rng = new RNG(Date.now() >>> 0), coins = rng.int(150, 320), stone = 1, plant = rng.chance(0.5);
    Game.addCoins(coins, true); S.stone = (S.stone || 0) + stone; Game.addXp(80); const out = [`${coins} 💰`, `${stone} 🪨 Yosun Taşı`, '80 XP'];
    if (plant) { const lvl = Progress.level(S.xp), pool = Object.entries(PLANTS).filter(([, p]) => p.lvl <= lvl + 4).map(([k]) => k); const k = rng.pick(pool); S.gift = S.gift || []; S.gift.push(k); out.push('🌱 ' + PLANTS[k].name + ' (bedava)'); }
    return out;
  },
};

const Ach = {
  /** Kademe geçişlerini kontrol eder: yeni kademe = ödül + rozet. */
  check() {
    const S = Game.S; S.ach = S.ach || {};
    for (const a of ACHIEVEMENTS) { const v = a.get(S), have = S.ach[a.id] || 0; let t = have; while (t < 3 && v >= a.tiers[t]) t++; if (t > have) { S.ach[a.id] = t; for (let k = have; k < t; k++) { const r = TIER_REWARD[k]; Game.addCoins(r.coins, true); Game.addXp(r.xp); S.stone = (S.stone || 0) + r.stone; S.rep += r.rep; } UI.toast(`🏅 ${a.name} — ${TIER_NAMES[t - 1]} rozeti! ${a.desc}`, 'star', 5000); Game.notify('badge', `${a.name}: ${TIER_NAMES[t - 1]} rozeti kazandın.`); AudioSys.SFX.discover(Math.min(3, t)); UI.refreshTop(); } }
  },
};

/* ---- Pazar: talep, fiyat geçmişi ---- */
const Market = {
  ensure(S) { if (!S.market) S.market = { demand: {}, hist: {}, trend: null, lastDay: Math.floor(S.clockMin / 1440) }; return S.market; },
  mult(id) { const m = this.ensure(Game.S); return m.demand[id] ?? 1; },
  price(c) { return Math.max(3, Math.round(c.baseValue() * this.mult(c.breed().id))); },
  /** Satış arzı artırır → fiyat düşer (çeşitliliği teşvik eder). */
  sold(c) { const m = this.ensure(Game.S), id = c.breed().id; m.demand[id] = Math.max(0.45, (m.demand[id] ?? 1) * 0.93); },
  tickDay(S, day) {
    const m = this.ensure(S), rng = new RNG((day ?? Math.floor(S.clockMin / 1440)) * 7919 + 13);
    if (m.trend && --m.trend.days <= 0) m.trend = null;
    if (!m.trend && rng.chance(0.25)) { const b = rng.pick(ALL_BREEDS.filter((x) => x.rarity <= 2)); m.trend = { id: b.id, up: rng.chance(0.7), days: rng.int(5, 9) }; Game.notify('market', `Pazar: ${b.name} ${m.trend.up ? 'moda oldu ↑' : 'ilgi görmüyor ↓'}`); }
    for (const b of ALL_BREEDS) { let d = m.demand[b.id] ?? 1; d += (1 - d) * 0.08 + rng.float(-0.04, 0.04); if (m.trend && m.trend.id === b.id) d += m.trend.up ? 0.06 : -0.05; d = clamp(d, 0.45, 1.7); m.demand[b.id] = d; const h_ = m.hist[b.id] || (m.hist[b.id] = []); h_.push(+d.toFixed(2)); if (h_.length > 14) h_.shift(); }
  },
};

/* ---- Mağaza stoğu: günlük + Gezgin Satıcı ---- */
const Shop = {
  maxRarity() { const l = Progress.level(Game.S.xp); return l < 5 ? 0 : l < 15 ? 1 : 2; },
  day() { return Math.floor(Game.S.clockMin / 1440); },
  /** Günün seçkisi ve haftanın gezgin satıcısı (tohumlu → kayıtsız tutarlı). */
  unlocked(sp) { return Progress.level(Game.S.xp) >= SPECIES_LVL[sp]; },
  daily(sp = 'guppy') { const rng = new RNG(this.day() * 104729 + 7 + hashStr(sp) % 997), pool = breedsOf(sp).filter((b) => b.rarity <= this.maxRarity()); return rng.shuffle(pool.slice()).slice(0, sp === 'guppy' ? 6 : 4).map((b) => ({ b, price: this.price(b), qty: 2 })); },
  trader() { const week = Math.floor(this.day() / 7), rng = new RNG(week * 1299709 + 3), pool = ALL_BREEDS.filter((b) => b.rarity >= 2 && b.rarity <= 3 && this.unlocked(b.spec.sp || 'guppy')); return rng.shuffle(pool.slice()).slice(0, 3).map((b) => ({ b, price: Math.round(this.price(b) * 1.5), qty: 1, rare: true })); },
  price(b) { return Math.round(RARITY[b.rarity].value * 1.9 * SPDEF[b.spec.sp || 'guppy'].pm); },
  bought(key) { const S = Game.S; S.shop = S.shop || {}; if (S.shop.day !== this.day()) S.shop = { day: this.day(), n: {} }; return S.shop.n[key] || 0; },
  buy(offer, sex) {
    const S = Game.S, key = offer.b.id + (offer.rare ? '!' : '');
    if (this.bought(key) >= offer.qty * (offer.rare ? 1 : 1)) return UI.toast('Stok bitti', 'bell');
    if (Game.tank.creatures.length >= tankCap()) return UI.toast('Tank dolu', 'fish');
    if (S.coins < offer.price) return UI.toast('Yeterli Altın Pul yok', 'coin');
    S.coins -= offer.price; S.shop.n[key] = this.bought(key) + 1;
    const c = new Creature({ genome: Genetics.make(offer.b.spec, sex, R, offer.b.spec.sp || 'guppy'), bornT: S.clockMin - R.int(55, 110) * 1440, x: Game.tank.W * 0.5, y: 120 }); c.now = S.clockMin; Breeding.reg(c); Game.addToTank(c);
    UI.refreshTop(); Game.ev('buy'); Game.checkDiscoveries(false); Game.save(); UI.toast(`${c.name} (${sex === 'M' ? 'erkek' : 'dişi'} ${offer.b.name}) tanka eklendi`, 'fish'); AudioSys.SFX.coin(); return c;
  },
};

/* ---- Siparişler: NPC müşteriler ---- */
const NPCS = [['Elif Hanım', '👩‍🦰'], ['Kaan Bey', '👨‍🍳'], ['Dr. Selin', '👩‍🔬'], ['Küçük Efe', '🧒'], ['Nine Hatice', '👵'], ['Mehmet Usta', '👷'], ['Gül Öğretmen', '👩‍🏫'], ['Poyraz Abi', '🧔']];
const Orders = {
  ensure(S) { if (!S.orders) S.orders = { list: [], day: -1, next: 1 }; return S.orders; },
  /** Günde bir yenilenir; süresi dolanlar silinir (ceza yok). */
  refresh(S) {
    const O = this.ensure(S), day = Math.floor(S.clockMin / 1440);
    O.list = O.list.filter((o) => o.until > S.clockMin);
    if (O.day !== day) { O.day = day; const want = 3 + (Progress.level(S.xp) > 10 ? 1 : 0) + (Progress.level(S.xp) > 25 ? 1 : 0); const rng = new RNG(day * 31337 + 5); while (O.list.length < want) { const o = this.gen(S, rng); if (o) O.list.push(o); else break; } }
  },
  gen(S, rng) {
    const lvl = Progress.level(S.xp), maxR = lvl < 5 ? 1 : lvl < 15 ? 2 : 3, kinds = ['breed', 'rarity', 'tail', 'size'], kind = rng.pick(kinds), [name, emo] = rng.pick(NPCS);
    const o = { id: S.orders.next++, npc: name, emo, kind, until: S.clockMin + rng.int(3, 6) * 1440, sex: rng.chance(0.5) ? 'M' : 'F' };
    if (kind === 'breed') { const b = rng.pick(ALL_BREEDS.filter((x) => x.rarity <= Math.min(maxR, 2) && S.discovered[x.id])); if (!b) return null; const sp = b.spec; o.breed = b.id; if (sp.tc && sp.tc !== 'none' || sp.tux || sp.sb || sp.st || sp.grass || sp.mosaic || sp.moscow) o.sex = 'M'; o.text = `${o.sex === 'M' ? 'Erkek' : 'Dişi'} ${b.name}`; o.base = RARITY[b.rarity].value * 1.9; }
    else if (kind === 'rarity') { o.minR = rng.int(0, Math.min(2, maxR)) + (lvl > 12 ? 1 : 0); o.minR = Math.min(o.minR, 3); o.text = `${RARITY[o.minR].name} veya üstü ${o.sex === 'M' ? 'erkek' : 'dişi'} balık`; o.base = RARITY[o.minR].value * 1.8 + 30; }
    else if (kind === 'tail') { const t = rng.pick(['fan', 'delta', 'round', 'veil', 'spade']); o.tail = t; o.sex = 'M'; o.text = `${TAILS[t].name} kuyruklu erkek`; o.base = 70; }
    else { o.size = 1.1; o.text = `İri (büyük boy) ${o.sex === 'M' ? 'erkek' : 'dişi'} balık`; o.base = 80; }
    o.adultOnly = true; o.reward = Math.round(o.base * rng.float(1.15, 1.5)); o.rep = Math.max(2, Math.round(o.reward / 40)); return o;
  },
  matches(o, c) {
    if (c.sex !== o.sex || !c.adult() || c.dis) return false; const p = c.pheno;
    if (o.kind === 'breed') return c.breed().id === o.breed; if (o.kind === 'rarity') return c.rarity() >= o.minR; if (o.kind === 'tail') return p.tail === o.tail; if (o.kind === 'size') return p.size >= o.size; return false;
  },
  deliver(o, c) { const S = Game.S; Game.dropCreature(c); S.orders.list = S.orders.list.filter((x) => x !== o); Game.addCoins(o.reward, true); S.rep += o.rep; Game.addXp(10 + o.rep); Game.ev('order'); S.stats.sold++; UI.refreshTop(); AudioSys.SFX.discover(1); UI.toast(`${o.npc} memnun: +${o.reward} 💰, +${o.rep} İtibar`, 'heart', 4200); Game.save(); },
};

/* Araştırma yardımcıları */
const Research = {
  has(id) { return !!(Game.S.research && Game.S.research[id]); },
  available(n) { return !this.has(n.id) && (!n.after || this.has(n.after)); },
  buy(n) { const S = Game.S; if (!this.available(n)) return false; if (S.rep < n.cost) { UI.toast(`Yeterli İtibar yok (${n.cost})`, 'heart'); return false; } S.rep -= n.cost; (S.research = S.research || {})[n.id] = 1; UI.refreshTop(); UI.toast(`Araştırma tamam: ${n.name}`, 'star', 4000); AudioSys.SFX.discover(2); Game.notify('research', `Araştırma: ${n.name}`); Game.save(); return true; },
  testCost() { return this.has('lab') ? 10 : 40; },
  survival() { return this.has('nursery') ? 0.8 : FRY_SURVIVAL; },
  quarCap() { return this.has('quar') ? 8 : 4; },
};
