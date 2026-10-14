'use strict';
/* =====================================================================
   14 · KİMYA & BİYOLOJİ — su parametreleri, azot döngüsü, bitki büyümesi,
        yosun, stres/sağlık, hastalık, ilaç, karantina
   Değerler birbirine bağlıdır: zemin, taş, kök, bitki, balık yükü, yem,
   filtre, ışık, CO₂ ve su değişimi hepsi parametreleri etkiler.
   Oyun dakikası → gün: dd = dakika / 1440.  (60 L'ye göre ölçeklenir.)
   ===================================================================== */

/* ---- Tür ortam aralıkları: [ideal[min,max], tolere[min,max]] ---- */
const SP_ENV = {
  guppy: { temp: [[24, 28], [20, 31]], ph: [[7.0, 7.8], [6.4, 8.5]], gh: [[8, 15], [4, 25]], kh: [[4, 15], [2, 20]], tds: [[150, 400], [80, 700]], nh3: [[0, 0.1], [0, 0.5]], no2: [[0, 0.1], [0, 0.6]], no3: [[0, 30], [0, 80]], o2: [[6, 20], [4, 20]], co2: [[0, 18], [0, 35]], salt: [[0, 2], [0, 6]] },
};
/** Parametre listesi: ad, birim, ondalık, grafik ekseni, kötü yön */
const PARAMS = [
  { k: 'temp', n: 'Sıcaklık', u: '°C', dp: 1, ax: [14, 36] }, { k: 'ph', n: 'pH', u: '', dp: 2, ax: [5.5, 9] },
  { k: 'gh', n: 'GH', u: '°dH', dp: 1, ax: [0, 30] }, { k: 'kh', n: 'KH', u: '°dH', dp: 1, ax: [0, 20] }, { k: 'tds', n: 'TDS', u: 'ppm', dp: 0, ax: [0, 800] },
  { k: 'nh3', n: 'Amonyak', u: 'ppm', dp: 2, ax: [0, 1] }, { k: 'no2', n: 'Nitrit', u: 'ppm', dp: 2, ax: [0, 1] }, { k: 'no3', n: 'Nitrat', u: 'ppm', dp: 0, ax: [0, 100] },
  { k: 'o2', n: 'Oksijen', u: 'mg/L', dp: 1, ax: [0, 12] }, { k: 'co2', n: 'CO₂', u: 'mg/L', dp: 1, ax: [0, 50] },
];
const PWEIGHT = { temp: 1, ph: 1, nh3: 1.3, no2: 1.3, no3: 0.6, o2: 1.2, co2: 1, gh: 0.5, kh: 0.4, tds: 0.4, salt: 0.5 };
const TAP_PROFILES = { soft: { name: 'Yumuşak su (şehir)', ph: 6.8, gh: 3, kh: 2, tds: 90, temp: 19 }, mid: { name: 'Orta sert', ph: 7.4, gh: 8, kh: 5, tds: 200, temp: 20 }, hard: { name: 'Sert su (kasaba)', ph: 7.9, gh: 16, kh: 9, tds: 380, temp: 20 } };

/* ---- Hastalıklar ---- */
const DISEASES = {
  ich:     { name: 'Beyaz benek (Ich)', cures: ['ich', 'copper', 'general'], why: 'Ani sıcaklık düşüşü veya stres sonrası görülür; vücutta beyaz noktalar.' },
  finrot:  { name: 'Yüzgeç çürümesi', cures: ['antibiotic', 'general'], why: 'Kirli su (amonyak/nitrat yüksek) yüzgeçleri çürütür.' },
  fungus:  { name: 'Mantar', cures: ['antifungal', 'general'], why: 'Zayıf, stresli balıkta beyaz pamuksu leke.' },
  velvet:  { name: 'Kadife', cures: ['copper', 'general'], why: 'Gövdede altın tozu görünümü; stres ve kötü su.' },
};
/** İlaçlar: id, ad, fiyat, bakır içerir mi (omurgasızlar için ölümcül) */
const MEDS = {
  ich: { name: 'Beyaz benek ilacı', cost: 25, copper: false }, antibiotic: { name: 'Antibiyotik', cost: 30, copper: false, hurtBact: true },
  antifungal: { name: 'Antifungal', cost: 28, copper: false }, copper: { name: 'Bakırlı ilaç', cost: 35, copper: true }, general: { name: 'Genel tedavi', cost: 22, copper: false },
};

const ALGAE = {
  green: { name: 'Yeşil nokta (cam)', why: 'Çok ışık (güç × süre) ve/veya fazla nitrat.', fix: 'Işık süresini kısalt, su değiştir; camı temizle.' },
  hair:  { name: 'Saç yosunu', why: 'Amonyak dalgalanmaları veya yüksek ışık + yetersiz CO₂/bitki.', fix: 'Su değişimi, yemi azalt, CO₂\'yi dengele, hızlı büyüyen bitki ekle.' },
  bba:   { name: 'Siyah sakal (BBA)', why: 'Zayıf akıntı + yüksek ışık / dengesiz CO₂.', fix: 'Akıntıyı güçlendir, ışığı kıs, CO₂\'yi istikrarlı tut.' },
  gw:    { name: 'Yeşil su', why: 'Yüksek amonyak + çok ışık; yüzen bitki yok.', fix: 'Karartma (ışığı 2-3 gün kapat), su değişimi, yüzen bitki ekle.' },
  cyano: { name: 'Siyanobakteri', why: 'Çok düşük nitrat ve ölü akıntı noktaları.', fix: 'Akıntıyı artır, nitratı 5-10 ppm\'de tut, su değiştir.' },
};

const Chem = {
  active: true, noDeath: false, acc: 0, cleaners: 0,

  /* ---------- durum ---------- */
  fresh(S) {
    const tp = TAP_PROFILES[S.settings.tap || 'mid'];
    return { temp: 25, ph: 7.4, gh: tp.gh, kh: tp.kh, tds: tp.tds, nh3: 0.02, no2: 0, no3: 8, o2: 7.5, co2: 4, salt: 0, tannin: 0, b1: 0.75, b2: 0.7, soilAge: 0, shock: 0,
      algae: { green: 0, hair: 0, bba: 0, gw: 0, cyano: 0 }, hist: [], hT: 0, lastP: null, med: null, glassT: 0 };
  },
  get w() { return Game.S.water || (Game.S.water = this.fresh(Game.S)); },
  tap() { return TAP_PROFILES[Game.S.settings.tap || 'mid']; },

  /** Tankta bulunan türlerin ortak ideal/tolerans aralığı. */
  range(k) {
    const sp = [...new Set(Game.tank.creatures.map((c) => c.species))].filter((s) => SP_ENV[s]); if (!sp.length) sp.push('guppy');
    const id = [-1e9, 1e9], tol = [-1e9, 1e9];
    for (const s of sp) { const r = SP_ENV[s][k]; if (!r) continue; id[0] = Math.max(id[0], r[0][0]); id[1] = Math.min(id[1], r[0][1]); tol[0] = Math.max(tol[0], r[1][0]); tol[1] = Math.min(tol[1], r[1][1]); }
    if (id[0] > id[1]) { id[0] = tol[0]; id[1] = tol[1]; }
    return { ideal: id, tol };
  },
  /** 0 iyi, 1 dikkat, 2 tehlike */
  status(k, v) { const r = this.range(k); if (v >= r.ideal[0] && v <= r.ideal[1]) return 0; return v >= r.tol[0] && v <= r.tol[1] ? 1 : 2; },
  overall() { let m = 0; for (const p of PARAMS) m = Math.max(m, this.status(p.k, this.w[p.k])); return m; },

  /* ---------- girdiler ---------- */
  load() { return Game.tank.creatures.reduce((a, c) => a + Math.pow(c.bodyLen() / 58, 3) * (c.sex === 'F' ? 1.1 : 0.8), 0); },
  plants() { return Game.tank.scape.items.filter((i) => i.k === 'plant'); },
  bio(it) { const d = PLANTS[it.d]; return (it.g ?? 1) * (it.s || 1) * (d.type === 'carpet' ? (it.sp || 1) * 0.7 : d.type === 'float' ? (it.sp || 1) * 0.5 : (it.ht || 1)) * 0.6; },
  lightHours() { const L = Game.tank.scape.equip.light; return Game.tank.lampMode === 'on' ? 24 : Game.tank.lampMode === 'off' ? 0 : L.to - L.from; },

  /* ---------- ana adım ---------- */
  /** minutes kadar oyun zamanını ilerlet (15 dk'lık adımlarla). */
  advance(minutes, quiet) {
    this.acc += minutes; let n = 0;
    while (this.acc >= 15 && n++ < 800) { this.acc -= 15; this.step(15 / 1440, quiet); }
    if (n >= 800) this.acc = 0;
  },

  step(dd, quiet) {
    const S = Game.S, w = this.w, t = Game.tank, sc = t.scape, V = Math.max(10, sc.liters), vk = 60 / V, e = sc.equip, now = S.clockMin;
    if (sc.dry) { this.dryStep(dd); return; }
    const lampOn = (t.lampMode === 'on') || (t.lampMode === 'auto' && ((now % 1440) / 60 >= e.light.from && (now % 1440) / 60 < e.light.to));
    const P = e.light.p / 100, flow = t.flowPow, items = sc.items, plants = this.plants();
    // --- hardscape / zemin etkileri ---
    let dKH = 0, dGH = 0, dTan = 0, hardBio = 0;
    for (const it of items) { if (!Scape.isHard(it)) continue; const d = HARDSCAPE[it.d] || {}, f = d.eff; if (!f) continue; const k = (it.s || 1) * (it.k === 'leaf' ? 0.25 : 1); dKH += (f.kh || 0) * k; dGH += (f.gh || 0) * k; dTan += (f.tannin || 0) * k; hardBio += (f.bio || 0) * k; }
    w.kh += (dKH * vk) * dd * 0.8; w.gh += (dGH * vk) * dd * 0.8; w.tannin += dTan * vk * dd * 0.8;
    const sub = sc.sub; w.soilAge += dd;
    if (sub.type === 'aquasoil') { const f = Math.exp(-w.soilAge / 45); w.kh += (1.5 - w.kh) * 0.06 * dd * vk * f; w.gh += 0.05 * dd * f; w.nh3 += 0.35 * f * dd * vk * 0.5; }
    else if (sub.type === 'coral') { w.kh += (14 - w.kh) * 0.035 * dd * vk; w.gh += (17 - w.gh) * 0.03 * dd * vk; }
    // --- sıcaklık ---
    const room = 21 + (lampOn ? 0.6 : 0), target = e.heater ? Math.max(25, room) : room + 0.5 * (e.filter === 'external' ? 0 : 0);
    w.temp += (target - w.temp) * (1 - Math.exp(-dd / 0.3));
    // --- yük, yem, azot döngüsü ---
    const load = this.load(), cap = clamp((EQUIP.filter[e.filter] ? EQUIP.filter[e.filter].bio : 0.3) * 0.75 + hardBio * 0.08 * vk + 0.2, 0.15, 1.2);
    const hungerDays = (now - (S.lastFeed ?? now)) / 1440;
    w.nh3 += load * 0.32 * vk * dd * (hungerDays > 3 ? 0.7 : 1);                 // balık atığı
    const conv = w.nh3 * (1 - Math.exp(-dd * 60 * w.b1 * (w.temp > 31 ? 0.5 : 1)));
    w.nh3 -= conv; w.no2 += conv * 0.95;
    const conv2 = w.no2 * (1 - Math.exp(-dd * 46 * w.b2));
    w.no2 -= conv2; w.no3 += conv2; w.kh = Math.max(0.5, w.kh - conv * 0.05);
    // bakteri kolonileri: substrat (amonyak/nitrit) varsa büyür, kapasiteyi aşmaz
    w.b1 += dd * 0.22 * clamp((w.nh3 + 0.03) / 0.25, 0, 1) * (1 - w.b1 / cap); w.b2 += dd * 0.15 * clamp((w.no2 + 0.02) / 0.2, 0, 1) * (1 - w.b2 / cap);
    w.b1 = clamp(w.b1 - dd * 0.004 * (w.b1 > cap ? 5 : 1), 0.01, 1.25); w.b2 = clamp(w.b2 - dd * 0.004 * (w.b2 > cap ? 5 : 1), 0.01, 1.25);
    if (w.med && w.med.hurtBact) { w.b1 *= 1 - dd * 0.25; w.b2 *= 1 - dd * 0.25; }
    // --- ışık, CO₂, bitkiler ---
    const shade = clamp(plants.filter((p) => PLANTS[p.d].type === 'float').reduce((a, p) => a + this.bio(p) * 0.22, 0), 0, 0.6), pe = P * (1 - shade), on = lampOn ? 1 : 0;
    const inj = e.co2 === 'tank' ? 22 : e.co2 === 'liquid' ? 4 : 0, bioSum = plants.reduce((a, p) => a + this.bio(p), 0) * vk;
    const co2T = 3 + load * 0.4 * vk + (on ? inj : inj * 0.15) - on * Math.min(2.5, bioSum * 0.35);
    w.co2 += (Math.max(1, co2T) - w.co2) * (1 - Math.exp(-dd / 0.15));
    const sat = 14.2 - 0.24 * w.temp;
    const o2T = sat * (0.72 + 0.28 * clamp(flow + (e.air ? 0.2 : 0), 0, 1)) + on * Math.min(3, bioSum * 0.8) - (on ? 0 : Math.min(2, bioSum * 0.5)) - load * 0.45 * vk;
    w.o2 += (clamp(o2T, 1.5, sat * 1.25) - w.o2) * (1 - Math.exp(-dd / 0.1));
    // pH: KH–CO₂ ilişkisi (+ tanen, aquasoil)
    const aq = sub.type === 'aquasoil' ? -0.7 * Math.exp(-w.soilAge / 90) : 0;
    w.ph = 6.35 + Math.log10(Math.max(0.3, w.kh) * 17.9 / Math.max(0.6, w.co2)) - 0.3 * clamp(w.tannin / 6, 0, 1) + aq * 0.5;
    w.tds = 18 + w.gh * 12 + w.kh * 10 + w.no3 * 1.2 + w.tannin * 6 + w.salt * 100;
    // bitki büyümesi ve azot tüketimi
    let uptake = 0; const cb = { light: pe, co2: w.co2, no3: w.no3 };
    for (const it of plants) uptake += this.growPlant(it, dd, on, pe, w, sub, e, cb, quiet);
    const upN = uptake * 1.6 * vk * dd; w.no3 = Math.max(0, w.no3 - upN * 0.7); w.nh3 = Math.max(0, w.nh3 - upN * 0.3 * 0.2);
    // yosun
    this.algaeStep(dd, on, P, pe, flow, shade, bioSum);
    // zaman içinde sapmalar (taze musluk suyu değil) ve sınırlar
    w.tannin = Math.max(0, w.tannin - dd * 0.02 * w.tannin * 0 - dd * 0.015); for (const k of ['nh3', 'no2', 'no3', 'gh']) w[k] = Math.max(0, w[k]);
    w.kh = clamp(w.kh, 0.5, 20); w.gh = clamp(w.gh, 0.5, 30);
    t.tint = clamp(w.tannin / 6, 0, 1); t.greenWater = clamp(w.algae.gw, 0, 1); t.algae = w.algae;
    // ilaç süresi
    if (w.med) { w.med.days -= dd; if (w.med.days <= 0) { w.med = null; if (!quiet) UI.toast('İlaç etkisi bitti', 'bell'); } }
    // şok izleme (saatlik), geçmiş kaydı (6 saatte bir)
    w.hT += dd; if (w.hT >= 1 / 24) { w.hT = 0; this.shockCheck(); }
    w.hist.hT = (w.hist.hT || 0) + dd; if (w.hist.hT >= 0.25) { w.hist.hT = 0; const s = { t: now }; for (const p of PARAMS) s[p.k] = +w[p.k].toFixed(3); w.hist.push(s); if (w.hist.length > 28) w.hist.shift(); }
    this.fishStep(dd, quiet); this.speciesStep(dd, quiet);
  },

  /** Kuru başlangıç: su yok, nemli ortamda bitkiler (halılar) kökleşir; yosun/azot yok. */
  dryStep(dd) {
    for (const it of this.plants()) { const d = PLANTS[it.d]; if (d.type === 'float') continue; it.g = Math.min(1, (it.g ?? 1) + dd * d.grow * 0.12 * 0.6); if (d.type === 'carpet') it.sp = Math.min(1.8, (it.sp || 1) + dd * 0.025); it.hp = 1; }
    Game.S.scape.dryDays = (Game.S.scape.dryDays || 0) + dd;
  },

  /** Tek bitkinin büyümesi. Döndürdüğü: azot tüketim ağırlığı. */
  growPlant(it, dd, on, pe, w, sub, e, cb, quiet) {
    const d = PLANTS[it.d], g = it.g ?? 1; if (it.hp === undefined) it.hp = 1;
    const need = [0, 0.3, 0.55, 0.8][d.light], lf = on ? clamp(pe / need, 0, 1.15) : 0.15 + 0.1 * (pe / need);
    const cf = d.co2 === 0 ? 1 : d.co2 === 1 ? 0.62 + 0.38 * clamp(w.co2 / 14, 0, 1) : 0.2 + 0.8 * clamp(w.co2 / 20, 0, 1);
    const rooted = d.type === 'carpet' || d.type === 'rosette' || d.type === 'ribbon' || d.type === 'stem' && it.d !== 'hornwort';
    const nf = clamp(0.3 + w.no3 / 8, 0.2, 1) * (rooted ? 0.55 + 0.45 * Math.min(1, SUBSTRATES[sub.type].nut + 0.3) : 1);
    const tf = 1 - clamp(Math.abs(w.temp - 25) / 10, 0, 0.6), lim = Math.min(lf, cf, nf), fac = lim * tf;
    const algPen = (w.algae.hair + w.algae.bba + w.algae.green * 0.5) * 0.25;
    // yeni dikilen bazı bitkiler erir (crypt melt) — panik yok, toparlanır
    const age = it.t !== undefined ? (Game.S.clockMin - it.t) / 1440 : 99;
    it.melt = d.melt && age < 6 ? 0.75 * (1 - age / 6) : Math.max(0, (it.melt || 0) - dd * 0.4);
    if (it.melt > 0.05 && !Game.S.once?.meltTip && !this.noDeath) { Game.S.once = Game.S.once || {}; Game.S.once.meltTip = 1; UI.toast('💡 Yeni dikilen Cryptocoryne yaprak döküyor — buna "erime" denir, birkaç gün sonra toparlanır.', 'leaf', 6500); }
    // sağlık: ağır eksiklik → solma
    if (lim < 0.3 || w.nh3 > 1) it.hp = clamp(it.hp - dd * (0.04 + algPen * 0.3), 0, 1); else if (lim > 0.5) it.hp = clamp(it.hp + dd * 0.08, 0, 1);
    it.melt = clamp(Math.max(it.melt, 1 - it.hp) , 0, 1);
    if (it.hp <= 0 && !this.noDeath) { it.dead = true; return 0; }
    const rate = d.grow * fac * 0.45 * (1 - algPen) * (it.hp > 0.4 ? 1 : 0.3);
    if (g < 1) it.g = Math.min(1, g + dd * rate * 0.7);
    else if (d.type === 'carpet') { if (cf > 0.55) it.sp = Math.min(2.4, (it.sp || 1) + dd * rate * 0.22); else it.vert = clamp((it.vert || 1) + dd * 0.15 * (1 - cf), 1, 2.2); } // CO₂ yoksa dikine uzar
    else if (d.type === 'float') it.sp = Math.min(2.6, (it.sp || 1) + dd * rate * 0.45);
    else if (d.type === 'moss') it.sp = Math.min(2, (it.sp || 1) + dd * rate * 0.12);
    else if (d.type === 'stem' || d.type === 'ribbon' || d.type === 'rosette') it.ht = Math.min(2.4, (it.ht || 1) + dd * rate * (d.type === 'stem' ? 0.35 : 0.08));
    // kırmızılaşma
    if (d.red) { const tg = clamp((pe - 0.45) * 2.2, 0, 1) * Math.min(cf, nf) * (on ? 1 : 0.8); it.tint = lerp(it.tint || 0, tg, clamp(dd * 1.2, 0, 1)); }
    return rate * (it.g ?? 1) * 0.5 + 0.01;
  },

  algaeStep(dd, on, P, pe, flow, shade, bioSum) {
    const w = this.w, a = w.algae, lh = this.lightHours(), strong = P * lh / 10, dark = Game.tank.light < 0.1;
    const co2Poor = Game.tank.scape.equip.co2 === 'none' && this.plants().some((p) => PLANTS[p.d].co2 === 2);
    const g = (k, up, dn) => { a[k] = clamp(a[k] + dd * (up - dn), 0, 1); };
    const dec = 0.012 + (dark ? 0.09 : 0) + Chem.cleaners * 0.02 + clamp(bioSum * 0.01, 0, 0.03);
    g('green', (strong > 0.8 ? (strong - 0.8) * 0.55 : 0) + (w.no3 > 30 ? 0.04 : 0), dec);
    g('hair', Math.max(0, w.nh3 - 0.15) * 0.35 + (strong > 0.75 && co2Poor ? 0.05 : 0) + (w.no3 > 40 ? 0.02 : 0), dec);
    g('bba', (flow < 0.45 && strong > 0.65 ? 0.03 : 0) + (Game.tank.scape.equip.co2 !== 'none' && flow < 0.35 ? 0.04 : 0), dec * 0.6);
    g('gw', (w.nh3 > 0.25 && strong > 0.5 && shade < 0.15 ? 0.22 : 0), 0.04 + (dark ? 0.35 : 0));
    g('cyano', (w.no3 < 2 && flow < 0.55 ? 0.05 : 0) + (w.nh3 > 0.5 ? 0.05 : 0), dec * 0.7);
  },

  shockCheck() {
    const w = this.w, p = { temp: w.temp, ph: w.ph, tds: w.tds, gh: w.gh }, l = w.lastP; w.shock *= 0.55;
    if (l) w.shock += clamp(Math.abs(p.temp - l.temp) / 2.5 + Math.abs(p.ph - l.ph) / 0.5 + Math.abs(p.tds - l.tds) / 90 + Math.abs(p.gh - l.gh) / 3, 0, 3) * 0.8;
    w.shock = clamp(w.shock, 0, 2); w.lastP = p;
  },

  /* ---------- balık: stres, sağlık, hastalık ---------- */
  envStress(c) {
    const env = SP_ENV[c.species] || SP_ENV.guppy, w = this.w; let m = 0, parts = [];
    for (const k in env) { if (w[k] === undefined) continue; const [id, tol] = env[k], v = w[k]; let dev = 0; if (v < id[0]) dev = (id[0] - v) / Math.max(1e-6, id[0] - tol[0]); else if (v > id[1]) dev = (v - id[1]) / Math.max(1e-6, tol[1] - id[1]); if (dev > 0) { dev = Math.min(2, dev) * (PWEIGHT[k] || 0.5); parts.push(dev); m = Math.max(m, dev); } }
    return clamp(m * 0.75 + w.shock * 0.35, 0, 1.2);
  },

  fishStep(dd, quiet) {
    const w = this.w, S = Game.S, list = Game.tank.creatures, now = S.clockMin;
    const sick = list.filter((c) => c.dis).reduce((a, c) => a + c.dis.sev, 0), hungerDays = (now - (S.lastFeed ?? now)) / 1440;
    for (const c of list.slice()) {
      const es = this.envStress(c); c.envStress = lerp(c.envStress ?? 0, es, clamp(dd * 6, 0, 1)); if (c.vit === undefined) c.vit = 1;
      let dv = es < 0.3 ? 0.06 : -0.14 * (es - 0.3) / 0.7;
      if (hungerDays > 4) dv -= 0.03 * Math.min(2, hungerDays - 4);
      if (c.defect) dv -= 0.004; if (c.genome.sex && c.health() < 0.5) dv -= 0.004;
      // hastalık
      if (!c.dis) {
        const risk = 0.002 + 0.05 * es * es + 0.03 * w.shock + 0.2 * (sick / Math.max(1, list.length)) * (c.envStress > 0.2 ? 1 : 0.4);
        if (R.next() < risk * dd) { const id = w.shock > 0.6 && w.temp < 23 ? 'ich' : (w.nh3 > 0.2 || w.no3 > 60) ? 'finrot' : R.pick(Object.keys(DISEASES)); c.dis = { id, sev: 0.15 }; if (!quiet) { UI.toast(`${c.name} hasta: ${DISEASES[id].name}`, 'bell', 4500); Game.notify('warn', `${c.name} ${DISEASES[id].name} oldu. İlaç veya karantina gerekebilir.`); AudioSys.SFX.warn(); } }
      } else {
        const d = c.dis, cure = w.med && DISEASES[d.id].cures.includes(w.med.id) ? (w.med.id === 'general' ? 0.5 : 1) : 0, q = S.quarantine && S.quarantine.includes(c.id);
        d.sev += dd * (0.15 + 0.3 * es - cure * 0.7 - (c.envStress < 0.15 && c.vit > 0.8 ? 0.06 : 0) - (q ? 0.05 : 0));
        dv -= d.sev * 0.1;
        if (d.sev <= 0) { c.dis = null; Game.ev('cured'); if (!quiet) { UI.toast(`${c.name} iyileşti 💚`, 'heart'); } }
      }
      c.vit = clamp(c.vit + dv * dd, this.noDeath ? 0.15 : 0, 1);
      if (c.vit <= 0 && !this.noDeath) { this.die(c); }
    }
  },
  /** Türe özgü kurallar: temizlikçiler, karides yenmesi/deri değişimi, beta çatışması, kılıçkuyruk dönüşümü. */
  speciesStep(dd, quiet) {
    const t = Game.tank, list = t.creatures, w = this.w, fish = list.filter((c) => c.def.kind === 'fish'), pred = fish.filter((c) => c.adult()).length;
    this.cleaners = list.reduce((a, c) => a + (c.species === 'snail' ? 0.35 : c.species === 'shrimp' ? 0.12 : 0), 0);
    const cover = clamp(this.plants().length / 12, 0, 1) * 0.5;
    for (const c of list.slice()) {
      if (c.species === 'shrimp') {
        if (pred > 0 && !this.noDeath && R.next() < dd * pred * 0.012 * (c.ageDays() < 10 ? 3 : 1) * (1 - cover)) { t.removeCreature(c); Game.notify('warn', `${c.name} (karides) balıklara yem oldu. Saklanma için bitki/yosun artır veya balıklardan ayır.`); if (!quiet) UI.toast(`${c.name} yenildi 🦐`, 'bell'); continue; }
        c.moltT = (c.moltT ?? R.float(0, 10)) + dd;
        if (c.moltT > 12) { c.moltT = R.float(0, 2); (t.molts = t.molts || []).push({ x: c.sw.x, y: c.sw.y, t: t.t }); if (w.gh < 4 && !this.noDeath && R.next() < 0.4) { this.die(c); continue; } }
      }
      if (c.species === 'swordtail' && c.sex === 'F' && c.ageDays() > 200 && !this.noDeath && R.next() < dd * 0.0006) {
        c.genome.sex = 'M'; c.genome.sc[1].Y = true; c.pheno = Genetics.phenotype(c.genome); c.sprite = null; Game.notify('info', `${c.name} dişiden erkeğe dönüştü! (nadir olay)`); if (!quiet) UI.toast(`${c.name} erkeğe dönüştü — nadir bir olay!`, 'dna', 5000);
      }
    }
    const bm = list.filter((c) => c.species === 'betta' && c.sex === 'M' && c.adult());
    for (const c of bm.slice(1)) Game.toJar(c);
    if (bm.length && t.scape.liters < 40) for (const c of fish) if ((c.species === 'guppy' || c.species === 'endler') && c.adult()) c.stress = Math.max(c.stress, 0.25);
  },
  die(c) {
    Game.tank.removeCreature(c); Game.S.stats.deaths = (Game.S.stats.deaths || 0) + 1;
    Game.notify('warn', `${c.name} öldü. Su değerlerini kontrol et.`); UI.toast(`${c.name} öldü… su değerlerine bak 💧`, 'bell', 5000); AudioSys.SFX.warn();
    if (Game.tank.creatures.length === 0) Game.rescueFish();
  },

  /* ---------- oyuncu eylemleri ---------- */
  onFeed(mult = 1) { const w = this.w, V = Math.max(10, Game.tank.scape.liters); Game.S.lastFeed = Game.S.clockMin; w.nh3 += 0.05 * mult * (60 / V); },
  waste(n) { const V = Math.max(10, Game.tank.scape.liters); this.w.nh3 += 0.01 * n * (60 / V); },

  waterChange(pct) {
    const w = this.w, tp = this.tap(), f = clamp(pct / 100, 0, 0.9), pre = { temp: w.temp, ph: w.ph, tds: w.tds, gh: w.gh };
    w.nh3 *= 1 - f; w.no2 *= 1 - f; w.no3 *= 1 - f; w.tannin *= 1 - f * 0.9; w.salt *= 1 - f; w.algae.gw *= 1 - f * 0.9;
    w.gh = lerp(w.gh, tp.gh, f); w.kh = lerp(w.kh, tp.kh, f); w.temp = lerp(w.temp, tp.temp, f); w.co2 = lerp(w.co2, 8, f);
    w.tds = 18 + w.gh * 12 + w.kh * 10 + w.no3 * 1.2 + w.tannin * 6;
    w.ph = 6.35 + Math.log10(Math.max(0.3, w.kh) * 17.9 / Math.max(0.6, w.co2));
    w.shock = clamp(w.shock + (Math.abs(w.temp - pre.temp) / 2.5 + Math.abs(w.gh - pre.gh) / 3 + Math.abs(w.ph - pre.ph) / 0.5) * 0.7, 0, 2);
    w.b1 *= 1 - f * 0.05; w.hist.hT = 0.25;
    Game.task('water'); Game.addXp(3); AudioSys.SFX.whoosh(); UI.toast(`%${Math.round(pct)} su değişimi yapıldı`, 'water', 2200);
    return { dTemp: w.temp - pre.temp };
  },
  cleanGlass() { const a = this.w.algae; a.green *= 0.1; a.gw *= 1; AudioSys.SFX.tick(); UI.toast('Cam temizlendi', 'check', 1500); },
  /** Karartma: ışığı 3 gün kapat (yosun azalır, bitkiler yavaşlar) */
  blackout() { Game.tank.lampMode = 'off'; Game.S.settings.lamp = 'off'; Game.S.blackoutUntil = Game.S.clockMin + 3 * 1440; UI.toast('Karartma başladı: ışık 3 gün kapalı', 'moon', 3500); },
  treat(id) {
    const m = MEDS[id], S = Game.S, w = this.w; if (!m) return;
    if (S.coins < m.cost) return UI.toast(`Yeterli Altın Pul yok (${m.cost})`, 'coin');
    const inv = Game.tank.creatures.filter((c) => c.species === 'shrimp' || c.species === 'snail');
    const go = () => { S.coins -= m.cost; w.med = { id, days: 4, hurtBact: !!m.hurtBact }; UI.refreshTop(); UI.toast(`${m.name} uygulandı (4 gün)`, 'heart'); if (m.copper) for (const c of inv) this.die(c); };
    if (m.copper && inv.length) UI.confirm('Bakır uyarısı!', `Bakırlı ilaç karides ve salyangozlar için ÖLÜMCÜLDÜR. ${inv.length} omurgasız ölecek. Yine de uygulansın mı?`, go); else go();
  },
  quarantine(c, on) {
    const S = Game.S; S.quarantine = S.quarantine || [];
    if (on) { if (S.quarantine.length >= Research.quarCap()) return UI.toast(`Karantina tankı dolu (${Research.quarCap()} balık)`, 'bell'); S.quarantine.push(c.id); c.quarantined = true; Game.tank.removeCreature(c); S.qFish = S.qFish || []; S.qFish.push(c); UI.toast(`${c.name} karantinaya alındı`, 'heart'); }
    else { S.quarantine = S.quarantine.filter((i) => i !== c.id); S.qFish = (S.qFish || []).filter((x) => x !== c); c.quarantined = false; Game.tank.addCreature(c); UI.toast(`${c.name} tanka geri döndü`, 'fish'); }
  },

  /** Budama: kesilen uç sayısını döndürür. */
  prune(it) {
    const d = PLANTS[it.d]; let n = 0, over = 0;
    if (d.type === 'stem' || d.type === 'ribbon') { over = (it.ht || 1) - 1; if (over < 0.2) return 0; n = Math.round(over * 4); it.ht = 1; it.g = Math.min(it.g, 0.75); }
    else if (d.type === 'carpet') { over = (it.sp || 1) - 1; if (over < 0.25 && (it.vert || 1) < 1.3) return 0; n = Math.round(over * 3) + ((it.vert || 1) > 1.3 ? 1 : 0); it.sp = 1; it.vert = 1; }
    else if (d.type === 'float') { over = (it.sp || 1) - 1; if (over < 0.3) return 0; n = Math.round(over * 4); it.sp = 1; }
    else if (d.type === 'moss') { over = (it.sp || 1) - 1; if (over < 0.25) return 0; n = Math.round(over * 3); it.sp = 1; }
    else return 0;
    // budama yosun yükünü de düşürür
    for (const k of ['hair', 'bba']) this.w.algae[k] *= 0.7;
    return Math.max(1, n);
  },

  /** Sorun tanısı: [{sev, title, why, fix}] */
  diagnose() {
    const w = this.w, out = [], P = (k) => PARAMS.find((p) => p.k === k), add = (sev, title, why, fix) => out.push({ sev, title, why, fix });
    if (w.nh3 > 0.1) add(w.nh3 > 0.4 ? 2 : 1, `Amonyak yüksek (${w.nh3.toFixed(2)})`, 'Yeni tank, aşırı yem veya fazla balık; bakteri kolonisi yetmiyor.', 'Hemen %30–50 su değişimi yap, yemi azalt, filtre/bakteri kapasitesini artır.');
    if (w.no2 > 0.1) add(w.no2 > 0.4 ? 2 : 1, `Nitrit yüksek (${w.no2.toFixed(2)})`, 'Azot döngüsü henüz tamamlanmadı (Nitrobacter yetersiz).', 'Su değişimi yap; tankı yavaş yavaş balıkla doldur.');
    if (w.no3 > 40) add(w.no3 > 80 ? 2 : 1, `Nitrat yüksek (${Math.round(w.no3)})`, 'Atıklar birikti; bitkiler yetmiyor.', 'Su değişimi yap, hızlı büyüyen bitki (hornwort, su sprite) ekle.');
    if (w.o2 < 5) add(w.o2 < 4 ? 2 : 1, `Oksijen düşük (${w.o2.toFixed(1)})`, 'Sıcak su, zayıf akıntı veya fazla yük.', 'Hava taşı aç, filtre akıntısını artır, sıcaklığı düşür.');
    if (w.co2 > 22) add(w.co2 > 35 ? 2 : 1, `CO₂ yüksek (${Math.round(w.co2)})`, 'CO₂ enjeksiyonu fazla; balıklar yüzeyde nefes alabilir.', 'Ekipmandan CO₂\'yi kıs veya kapat; hava taşı ekle.');
    for (const k of ['temp', 'ph', 'gh', 'kh', 'tds']) { const s = this.status(k, w[k]); if (s) { const r = this.range(k); add(s === 2 ? 2 : 1, `${P(k).n} ideal dışı (${w[k].toFixed(P(k).dp)})`, `Tanktaki canlılar için ideal ${r.ideal[0].toFixed(0)}–${r.ideal[1].toFixed(0)}.`, k === 'temp' ? 'Isıtıcıyı kontrol et.' : 'Zemin/taş seçimini gözden geçir, su değişimiyle yavaşça düzelt (ani değişim şok yapar).'); } }
    if (w.shock > 0.6) add(1, 'Su şoku', 'Parametreler kısa sürede çok değişti.', 'Değişiklikleri küçük adımlarla yap; su değişimini %20-30 ile sınırla.');
    for (const [k, v] of Object.entries(w.algae)) if (v > 0.25) add(v > 0.6 ? 2 : 1, `${ALGAE[k].name} (%${Math.round(v * 100)})`, ALGAE[k].why, ALGAE[k].fix);
    const melting = this.plants().filter((p) => (p.hp ?? 1) < 0.5); if (melting.length) add(1, `${melting.length} bitki zayıf`, 'Işık, CO₂ veya besin eksik.', 'Bitkinin kartında ihtiyaçlarına bak; ışığı/CO₂\'yi ayarla.');
    const sickN = Game.tank.creatures.filter((c) => c.dis); if (sickN.length) add(2, `${sickN.length} hasta balık`, [...new Set(sickN.map((c) => DISEASES[c.dis.id].name))].join(', '), 'Hastalığa uygun ilaç uygula veya balığı karantinaya al.');
    const hd = (Game.S.clockMin - (Game.S.lastFeed ?? Game.S.clockMin)) / 1440; if (hd > 3) add(hd > 5 ? 2 : 1, `Balıklar ${Math.floor(hd)} gündür aç`, 'Uzun süre yem verilmedi.', 'Yem ver. (Otomatik besleyici araştırması bu işi üstlenir.)');
    return out.sort((a, b) => b.sev - a.sev);
  },

  /** Çevrimdışı ilerleme: ölüm yok, yumuşak. */
  catchUp(minutes) { this.noDeath = true; try { const keep = Game.tank.lampMode; this.advance(minutes, true); } finally { this.noDeath = false; } },
};
