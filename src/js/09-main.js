'use strict';
/* =====================================================================
   09 · ÇEKİRDEK — oyun durumu, döngü, kamera/girdi, görevler, ekonomi
   ===================================================================== */
const Game = {
  S: null, slot: 0, tank: null, cam: { cx: 500, cy: 350, zoom: 1 }, celebQ: [],
  AVATARS: ['🐠', '🐟', '🐡', '🦐', '🐚', '🦀', '🐙', '🪸'],
  DAILY: [50, 60, 70, 80, 90, 100, 200],
  TASKS: [
    { id: 'feed', name: 'Balıkları besle', desc: 'Akvaryumda Yem düğmesine bas', goal: 3, coins: 40, xp: 15, go: 'aq' },
    { id: 'inspect', name: 'Bir balığı tanı', desc: 'Akvaryumda bir balığa dokun ve kartını incele', goal: 1, coins: 30, xp: 10, go: 'aq' },
    { id: 'zoom', name: 'Yakından bak', desc: 'Tankı iki parmakla (veya tekerlekle) yakınlaştır', goal: 1, coins: 30, xp: 10, go: 'aq' },
    { id: 'scape', name: 'Tasarımcı ol', desc: 'Tasarım Stüdyosu\'nda bir öğe yerleştir', goal: 1, coins: 40, xp: 15, go: 'design' },
    { id: 'photo', name: 'Fotoğrafçı', desc: 'Fotoğraf modunda bir kare çek', goal: 1, coins: 30, xp: 10, go: 'aq' },
    { id: 'water', name: 'Su bakımı', desc: 'Su parametreleri panelinden su değişimi yap', goal: 1, coins: 40, xp: 15, go: 'aq' },
    { id: 'prune', name: 'Bahçıvan', desc: 'Bir bitkiyi buda', goal: 1, coins: 40, xp: 15, go: 'aq' },
    { id: 'lesson', name: 'Öğrenci', desc: 'Bilgi Merkezi\'nde bir Genetik Okulu dersini tamamla', goal: 1, coins: 50, xp: 20, go: 'help' },
    { id: 'test', name: 'Gizli genleri ortaya çıkar', desc: 'Bir balığın genotipini test et', goal: 1, coins: 60, xp: 25, go: 'aq' },
  ],
  _samples: new Map(), _sampleN: 0, last: 0, tAcc: 0, topAcc: 0, hiddenAt: 0, sessionWarned: false,

  /* ---------------- Başlangıç ---------------- */
  boot() {
    this.tank = new Tank();
    const meta = Save.meta(); this.slot = meta.slot || 0;
    const r = Save.read(this.slot);
    let offline = null;
    if (r) { this.loadState(r.data); if (r.fromBackup) setTimeout(() => UI.toast('Kayıt bozuktu, yedekten yüklendi', 'bell'), 1200); offline = this.computeOffline(); }
    else this.freshState();
    this.applySettings(); UI.init(); this.bindCanvas(); this.watchLifecycle();
    document.addEventListener('visibilitychange', () => this.onVisibility());
    window.addEventListener('beforeunload', () => this.save(true));
    window.addEventListener('pagehide', () => this.save(true));
    setInterval(() => this.save(), 30000);
    this.last = performance.now(); requestAnimationFrame((t) => this.frame(t));
    // açılış: "Dokun ve dal"
    const splash = $('#splash'), fx = $('#splash-fx'); this.splashFx(fx, splash);
    const enter = () => {
      splash.removeEventListener('click', enter); AudioSys.start(); this.applyAudio();
      splash.classList.add('out'); setTimeout(() => splash.remove(), 700); $('#app').classList.remove('hidden');
      UI.go('hub'); UI.refreshTop();
      if (!this.S.onboarded) setTimeout(() => this.welcome(), 600);
      else if (offline) setTimeout(() => UI.offlineSummary(offline), 700);
    };
    splash.addEventListener('click', enter); splash.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') enter(); });
  },

  splashFx(cv, splash) {
    const dpr = Math.min(2, devicePixelRatio || 1); cv.width = innerWidth * dpr; cv.height = innerHeight * dpr; const c = cv.getContext('2d');
    const bs = Array.from({ length: 36 }, () => ({ x: Math.random(), y: Math.random(), r: 2 + Math.random() * 7, v: 0.03 + Math.random() * 0.07, p: Math.random() * 6 }));
    let last = performance.now(); const f = (t) => { if (!splash.isConnected) return; const dt = (t - last) / 1000; last = t; c.setTransform(dpr, 0, 0, dpr, 0, 0); c.clearRect(0, 0, innerWidth, innerHeight);
      for (const b of bs) { b.y -= b.v * dt; if (b.y < -0.05) { b.y = 1.05; b.x = Math.random(); } c.strokeStyle = 'rgba(200,255,255,.35)'; c.beginPath(); c.arc(b.x * innerWidth + Math.sin(t / 1000 + b.p) * 12, b.y * innerHeight, b.r, 0, TAU); c.stroke(); }
      requestAnimationFrame(f); }; requestAnimationFrame(f);
  },

  welcome() {
    const rec = UI.sheet(h('div.stack', null, h('h2', null, '📜 Büyükbabanın notu'),
      h('p', null, 'Torunum, dükkânı sana bırakıyorum. Tozlu raflar, bakımsız tanklar ve birkaç lepistes… Ama bil ki her balığın içinde yüzlerce nesillik bir hikâye saklı.'),
      h('div.card', null, h('div.small', null, '• Balığa dokun: kartını ve genlerini gör.'), h('div.small', null, '• Tankı iki parmakla yakınlaştır, sürükleyerek gez.'), h('div.small', null, '• Yem ver, ışığı ayarla, zamanı hızlandır.'), h('div.small', null, '• Ansiklopedide keşfettiğin varyasyonları topla.')),
      h('button.btn.primary', { onclick: () => { this.S.onboarded = true; rec.close(); this.save(); } }, 'Başlayalım')));
  },

  /* ---------------- Durum yükleme / yeni oyun ---------------- */
  freshState() {
    this.S = Save.newState(); Pedigree.rec = {}; Pedigree._memo.clear(); _nextId = 1;
    const t = this.tank; t.creatures.length = 0; t.food.length = 0; this.S.scape = Scape.fromTemplate('start'); t.setScape(this.S.scape); t.setAspect(t.W / t.H);
    createStarterFish(t, this.S.clockMin); for (const c of t.creatures) Breeding.reg(c);
    this.checkDiscoveries(true); this.afterLoad(); this.save(true);
  },

  loadState(d) {
    this.S = d; const t = this.tank; t.creatures.length = 0; t.food.length = 0;
    Pedigree.rec = d.pedigree || {}; Pedigree._memo.clear(); _nextId = Math.max(d.nextId || 1, 1);
    Object.defineProperty(d, 'qFish', { value: [], writable: true, enumerable: false, configurable: true }); for (const cd of d.creatures) { try { const c = new Creature(cd); c.sw.x = clamp(cd.x ?? c.sw.x, 40, t.W - 40); c.sw.y = clamp(cd.y ?? c.sw.y, 60, t.H - 90); c.now = d.clockMin; if (c.quarantined) d.qFish.push(c); else t.addCreature(c); } catch (e) { console.warn('Canlı yüklenemedi', e); } }
    this.checkDiscoveries(true); this.afterLoad();
  },
  afterLoad() {
    if (!('qFish' in this.S)) Object.defineProperty(this.S, 'qFish', { value: [], writable: true, enumerable: false, configurable: true });
    const S = this.S; if (!S.scape) S.scape = Scape.fromTemplate('start'); this.tank.setScape(S.scape); this.tank.lampMode = S.settings.lamp; this.tank.light = this.tank.lampTarget(S.clockMin); this.tank.setAspect(this.tank.W / this.tank.H);
    if (!this.tank.bg) this.tank.buildBG();
    if (!this.S.clutches) this.S.clutches = []; this.tank.clutches = this.S.clutches;
    this.scanSeen(); this.S.cnt = this.S.cnt || {}; Quests.refresh(this.S); Orders.refresh(this.S); Market.ensure(this.S);
    this.tank.onEat = () => { if (R.chance(0.45)) AudioSys.SFX.eat(); };
    UI.refreshTop && $('#app') && UI.refreshTop();
  },
  computeOffline() {
    const S = this.S, secs = (Date.now() - (S.lastSeen || Date.now())) / 1000;
    if (secs < 120) return null;
    const minutes = Math.min(secs * 1, 8 * 1440), before = this.tank.creatures.map((c) => c.stage(S.clockMin));
    S.clockMin += minutes; const grown = this.tank.creatures.filter((c, i) => c.stage(S.clockMin) !== before[i]).length;
    this.tank.creatures.forEach((c) => (c.now = S.clockMin));
    Chem.catchUp(minutes); const births = this.tickBreeding(true);
    return { minutes, days: minutes / 1440, grown, births };
  },

  pack() {
    const S = this.S; S.creatures = [...this.tank.creatures, ...(S.qFish || [])].map((c) => c.toJSON()); S.pedigree = Pedigree.rec; S.nextId = _nextId; S.lastSeen = Date.now();
    S.settings.lamp = this.tank.lampMode; return S;
  },
  save(force) {
    if (!this.S) return false; const ok = Save.write(this.slot, this.pack());
    if (!ok && force) UI.toast && UI.toast('Kayıt yapılamadı (depolama dolu olabilir)', 'bell');
    return ok;
  },
  switchSlot(i) {
    this.save(true); this.slot = i; Save.setSlot(i); const r = Save.read(i);
    if (r) this.loadState(r.data); else this.freshState();
    this.applySettings(); this.applyAudio(); UI.refreshTop(); UI.toast(r ? 'Yuva ' + (i + 1) + ' yüklendi' : 'Yeni oyun başladı', 'save');
    this.cur_refresh();
  },
  newGame(i) { Save.clear(i); this.slot = i; Save.setSlot(i); this.freshState(); this.applySettings(); this.applyAudio(); UI.refreshTop(); UI.toast('Yeni oyun başladı', 'fish'); this.cur_refresh(); },
  importSave(str) { const d = Save.importString(str); this.S = d; Save.write(this.slot, d); this.loadState(d); this.applySettings(); this.applyAudio(); UI.refreshTop(); this.cur_refresh(); },
  exportSave() {
    const blob = new Blob([Save.exportString(this.pack())], { type: 'application/json' }), a = h('a', { href: URL.createObjectURL(blob), download: `akvaryum-kayit-yuva${this.slot + 1}.json` });
    document.body.append(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 500); UI.toast('Kayıt dosyası indirildi', 'save');
  },
  cur_refresh() { const c = UI.cur; if (c) { const el = $('#s-' + c); UI['render_' + c] && UI['render_' + c](el); } },

  /* ---------------- Ayarlar ---------------- */
  applySettings() {
    const st = this.S.settings, root = document.documentElement;
    root.dataset.theme = st.theme; root.style.setProperty('--fs', st.font);
    document.body.classList.toggle('reduce', !!st.reduce); document.body.classList.toggle('cb', !!st.cb);
    $$('.rar').forEach((e) => e.setAttribute('data-ico', e.dataset.ico || ''));
    this.tank.lampMode = st.lamp;
  },
  applyAudio() { const a = this.S.settings.audio; for (const k of ['master', 'music', 'amb', 'sfx', 'style']) AudioSys.set(k, a[k]); AudioSys.set('bgMute', this.S.settings.bgMute); },

  /* ---------------- Kaynaklar, XP, görevler ---------------- */
  addCoins(n, earned) { this.S.coins += n; if (earned && n > 0) this.S.cnt.earned = (this.S.cnt.earned || 0) + n; UI.refreshTop(); },
  /** Olay: görev ve başarım sayaçlarını artırır. */
  ev(name, n = 1) { const S = this.S; if (!S.cnt) S.cnt = {}; S.cnt[name] = (S.cnt[name] || 0) + n; if (S.dq) Quests.bump(S, name, n); Ach.check(); },
  addXp(n, onceKey) {
    const S = this.S; if (onceKey) { S.once = S.once || {}; if (S.once[onceKey]) return; S.once[onceKey] = 1; }
    const before = Progress.level(S.xp); S.xp += n; const after = Progress.level(S.xp);
    for (const s of SPECIES) if (SPECIES_LVL[s.id] > before && SPECIES_LVL[s.id] <= after) { UI.toast(`🎉 Yeni tür açıldı: ${s.name}! Mağaza > Canlı`, 'fish', 6000); this.notify('info', `Yeni tür açıldı: ${s.name}`); }
    if (after > before) { UI.toast(`Seviye ${after}! ${Progress.title(after)}`, 'star', 4200); AudioSys.SFX.discover(1); this.notify('level', `Seviye ${after} oldun.`); }
  },
  notify(type, text) { const S = this.S; S.notifs.push({ t: S.clockMin, type, text, read: false }); if (S.notifs.length > 80) S.notifs.shift(); UI.refreshTop(); },
  task(id, n = 1) { this.ev(id, n); const S = this.S; if (S.claimed[id]) return; const t = this.TASKS.find((x) => x.id === id); if (!t) return; const was = S.tasks[id] || 0; S.tasks[id] = Math.min(t.goal, was + n); if (was < t.goal && S.tasks[id] >= t.goal) UI.toast(`Hedef tamam: ${t.name} — Merkez'den ödülünü topla`, 'gift', 3800); },
  claimTask(t) { const S = this.S; if (S.claimed[t.id] || (S.tasks[t.id] || 0) < t.goal) return; S.claimed[t.id] = 1; this.addCoins(t.coins); this.addXp(t.xp); AudioSys.SFX.coin(); UI.toast(`+${t.coins} Altın Pul · +${t.xp} XP`, 'coin'); this.save(); },
  dailyState() { const d = this.S.daily; return { can: d.last !== todayKey(), idx: d.idx % 7, reward: this.DAILY[d.idx % 7] }; },
  claimDaily() { const d = this.S.daily, s = this.dailyState(); if (!s.can) return; d.last = todayKey(); d.idx = (d.idx + 1) % 7; this.addCoins(s.reward); this.addXp(5); AudioSys.SFX.coin(); UI.toast(`Günün ödülü: +${s.reward} Altın Pul`, 'gift'); this.save(); },

  /* ---------------- Eylemler ---------------- */
  feed() {
    if (this.tank.scape.dry) return UI.toast('Tank kuru başlangıçta', 'bell'); if (this.tank.feed()) { const S = this.S, ft = S.feedType || 'std', inv = S.inv || (S.inv = { premium: 0, carotene: 0 }); let mult = 1; if (ft !== 'std' && inv[ft] > 0) { inv[ft]--; if (ft === 'premium') mult = 0.55; else for (const c of this.tank.creatures) if (c.sex === 'M') c.boostUntil = S.clockMin + 3 * 1440; if (inv[ft] === 0) UI.toast('Özel yem stoğu bitti, standart yeme dönüldü', 'bell'); } else if (ft !== 'std') S.feedType = 'std'; Chem.onFeed(mult); this.S.stats.fed++; this.task('feed'); this.addXp(3); AudioSys.SFX.feed(); } else UI.toast('Önceki yemler henüz bitmedi', 'feed', 1800);
  },
  cycleLamp() { const o = ['auto', 'on', 'off'], t = this.tank; t.lampMode = o[(o.indexOf(t.lampMode) + 1) % 3]; this.S.settings.lamp = t.lampMode; UI.toast({ auto: 'Işık: otomatik (07:00–21:00)', on: 'Işık: sürekli açık', off: 'Işık: kapalı' }[t.lampMode], t.lampMode === 'off' ? 'moon' : 'sun', 1800); },
  cycleSpeed() { const o = [1, 2, 4, 8], st = this.S.settings; st.speed = o[(o.indexOf(st.speed) + 1) % o.length]; UI.toast(`Oyun hızı ${st.speed}×`, 'speed', 1500); },
  sell(c) {
    if (this.tank.creatures.length + (this.S.qFish || []).length <= 1) { UI.toast('Son canlını satamazsın', 'fish'); return false; }
    const v = c.value(); Market.sold(c); this.dropCreature(c); this.S.stats.sold++; this.S.stats.maxSale = Math.max(this.S.stats.maxSale, v); this.ev('sold');
    this.addCoins(v, true); this.addXp(2); AudioSys.SFX.sell(); UI.toast(`${c.name} satıldı · +${fmt(v)} Altın Pul`, 'coin'); this.save(); UI.refreshAq(); return true;
  },
  testCreature(c) {
    const cost = Research.testCost(); if (c.tested) return true; if (this.S.coins < cost) { UI.toast(`Yeterli Altın Pul yok (${cost} gerekli)`, 'coin'); return false; }
    this.S.coins -= cost; c.tested = true; this.S.stats.tests++; this.task('test'); this.addXp(10); UI.refreshTop(); AudioSys.SFX.discover(0); this.save(); return true;
  },

  /** Rastgele / mutant test balığı (Aşama 2'de yerini gerçek üreme alacak). */
  addRandomFish(mutant) {
    const t = this.tank, now = this.S.clockMin; let genome, sire = 0, dam = 0;
    const ms = t.creatures.filter((c) => c.sex === 'M'), fs = t.creatures.filter((c) => c.sex === 'F');
    if (mutant && ms.length && fs.length) { const a = R.pick(ms), b = R.pick(fs); genome = Genetics.breed(a.genome, b.genome, R, { mutMul: 80 }); sire = a.id; dam = b.id; }
    else genome = Genetics.randomFounder(R.chance(0.5) ? 'M' : 'F');
    const c = new Creature({ genome, bornT: now - 70 * 1440, sire, dam, x: R.float(100, t.W - 100), y: R.float(120, t.H - 200) });
    c.now = now; Breeding.reg(c); t.addCreature(c); this.checkDiscoveries(false); UI.refreshAq(); this.save(); return c;
  },

  /* ---------------- Üreme ---------------- */
  /** Doğumları işler; bildirim/XP/istatistik üretir. quiet: çevrimdışı özet için sessiz. */
  tickBreeding(quiet) {
    const S = this.S, births = Breeding.tick(S.clockMin, this.tank), out = [];
    for (const b of births) {
      if (b.clutch) { this.notify('birth', `${b.dam.name} su üstüne ${b.n} yumurtalık bir küme bıraktı (14 gün).`); if (!quiet) UI.toast(`🥚 ${b.dam.name} yumurta bıraktı`, 'fish', 3500); continue; }
      if (b.empty) { if (!quiet) UI.toast(`${b.dam.name} doğurdu ama yavru çıkmadı (sperm yoktu)`, 'bell'); continue; }
      const kept = b.kept.length; S.stats.born += kept; this.ev('born', kept); this.ev('bornHealthy', b.kept.filter((k) => !k.defect).length); this.addXp(5 + Math.min(40, kept * 2));
      if (b.released) this.addCoins(b.released * 2);
      S.litters.push({ t: S.clockMin, dam: b.dam.name, kept, lost: b.lost, released: b.released }); if (S.litters.length > 40) S.litters.shift();
      this.notify('birth', `${b.dam.name} ${b.dam.species === 'shrimp' ? 'yavru karides çıkardı' : b.dam.species === 'betta' ? 'kuluçkadan çıkardı' : b.dam.species === 'snail' ? 'yumurtaları açıldı' : 'doğurdu'}: ${kept} yavru yaşıyor${b.lost ? `, ${b.lost} yavru yenildi` : ''}${b.released ? `, ${b.released} yavru tank dolu olduğu için dükkâna verildi` : ''}.`);
      if (!quiet) { UI.toast(`🍼 ${b.dam.name} yavruladı! ${kept} yavru yaşıyor`, 'fish', 4500); AudioSys.SFX.born(); }
      out.push(b);
    }
    if (births.length) { UI.refreshTop(); if (UI.cur === 'aq') UI.refreshAq(); if (UI.cur === 'lab') UI.render_lab($('#s-lab')); }
    return out.length;
  },
  /** Günlük/haftalık yenilemeler, pazar, otomatik besleyici. */
  dayTick() {
    const S = this.S, day = Math.floor(S.clockMin / 1440), hr = (S.clockMin % 1440) / 60;
    if (this._dayInit !== day) {
      const m = Market.ensure(S);
      for (let d = m.lastDay + 1, n = 0; d <= day && n < 10; d++, n++) { Market.tickDay(S, d); if (Chem.overall() === 0) S.cnt.goodDays = (S.cnt.goodDays || 0) + 1; }
      m.lastDay = day; this._dayInit = day; Quests.refresh(S); Orders.refresh(S); Ach.check();
    }
    if (Research.has('feeder') && S.settings.autoFeed !== false && hr >= 18 && S.lastAutoFeed !== day && !this.tank.scape.dry) { S.lastAutoFeed = day; if (this.tank.feed()) { Chem.onFeed(); this.notify('info', 'Otomatik besleyici yem verdi.'); } }
  },
  /** Canlıyı tanktan ve karantina/kavanozdan çıkarır. */
  dropCreature(c) { this.tank.removeCreature(c); this.S.qFish = (this.S.qFish || []).filter((x) => x !== c); },
  /** Yeni canlıyı tanka koyar; ikinci yetişkin beta erkeği kavanoza gider. */
  addToTank(c) {
    if (c.species === 'betta' && c.sex === 'M' && c.adult() && this.tank.creatures.some((x) => x !== c && x.species === 'betta' && x.sex === 'M' && x.adult())) { this.toJar(c); return false; }
    this.tank.addCreature(c); return true;
  },
  toJar(c) { this.tank.removeCreature(c); c.quarantined = true; c.jar = true; if (!(this.S.qFish || []).includes(c)) (this.S.qFish = this.S.qFish || []).push(c); UI.toast(`${c.name}: beta erkekleri aynı tankta tutulamaz — kavanoza alındı`, 'bell', 5000); },
  reapPlants() {
    const sc = this.tank.scape, dead = sc.items.filter((i) => i.dead); if (!dead.length) return;
    sc.items = sc.items.filter((i) => !i.dead && !(i.att && dead.some((d) => d.id === i.att.id))); this.tank.touch();
    this.notify('warn', `${dead.length} bitki öldü (ışık/CO₂/besin yetersiz).`); UI.toast(`${dead.length} bitki soldu 🥀`, 'leaf', 3500);
  },
  /** Tüm balıklar ölürse büyükbabanın yedek balıkları. */
  rescueFish() {
    for (const sex of ['M', 'F']) { const c = new Creature({ genome: Genetics.randomFounder(sex), bornT: this.S.clockMin - 80 * 1440 }); c.now = this.S.clockMin; Breeding.reg(c); this.tank.addCreature(c); }
    this.notify('birth', 'Büyükbabanın yedek balıkları tanka bırakıldı.'); UI.toast('Büyükbabanın yedek iki balığı tanka bırakıldı 🐟', 'fish', 5000);
  },
  mate(m, f, q) {
    const pr = Breeding.problems(m, f, this.S.clockMin); if (pr.length) { UI.toast(pr[0], 'bell'); return null; }
    const r = Breeding.mate(m, f, this.S.clockMin, q); this.ev('mate'); this.addXp(4); AudioSys.SFX.coin();
    UI.toast(r.started ? `${f.name} gebe kaldı! Doğum ~${Math.round((r.due - this.S.clockMin) / 1440)} gün sonra` : `${f.name} sperm depoladı (zaten gebe)`, 'heart', 4200);
    this.save(); return r;
  },
  scanSeen() {
    const S = this.S, sc = this.tank.scape; S.seen = S.seen || {}; S.seen.plant = S.seen.plant || {}; S.seen.hard = S.seen.hard || {};
    for (const it of sc.items) (it.k === 'plant' ? S.seen.plant : S.seen.hard)[it.d] = 1; S.seen.hard[sc.sub.type] = 1;
  },
  markScapeChanged() { this.scanSeen(); clearTimeout(this._svT); this._svT = setTimeout(() => this.save(), 2500); },
  skipDays(n) { this.S.clockMin += n * 1440; this.tank.creatures.forEach((c) => (c.now = this.S.clockMin)); this.tickBreeding(false); UI.refreshTop(); },
  unrevealed() { return this.tank.creatures.filter((c) => c.unrevealed); },
  /** Soyağacı kaydından (genom saklı) portre çizilebilen hafif canlı. */
  creatureFromRec(id) {
    const r = Pedigree.rec[id]; if (!r || !r.g) return null; let c = this._recCache && this._recCache.get(id);
    if (!c) { c = new Creature({ id: -1000000 - id, genome: r.g, bornT: -500 * 1440, seed: r.seed || id * 31 }); c.now = 0; (this._recCache = this._recCache || new Map()).set(id, c); }
    return c;
  },
  /** Yetişkin hali (açılış önizlemesi). */
  adultPreview(c) {
    this._adultCache = this._adultCache || new Map(); let a = this._adultCache.get(c.id);
    if (!a) { a = new Creature({ id: -2000000 - c.id, genome: c.genome, bornT: -500 * 1440, seed: c.seed }); a.now = 0; this._adultCache.set(c.id, a); }
    return a;
  },

  /* ---------------- Keşif ---------------- */
  checkDiscoveries(silent) {
    for (const c of this.tank.creatures) {
      if (c.unrevealed) continue;   // yavrunun rengi açılana kadar keşif sayılmaz
      const b = c.breed(); if (this.S.discovered[b.id]) continue;
      this.S.discovered[b.id] = { t: this.S.clockMin, by: c.id };
      if (!silent) { this.ev('discover'); this.celebQ.push([c, b]); this.addXp(30 * (b.rarity + 1)); this.notify('discovery', `Yeni varyasyon keşfedildi: ${b.name}`); }
    }
    if (!silent) this.afterCelebrate(true);
  },
  afterCelebrate(first) { if (first && $('#celebrate').classList.contains('show')) return; const n = this.celebQ.shift(); if (n && $('#app')) UI.celebrate(n[0], n[1]); },

  sampleCreature(spec) {
    const k = JSON.stringify(spec); let c = this._samples.get(k);
    if (!c) { c = new Creature({ id: -(++this._sampleN), genome: Genetics.make(spec, 'M', new RNG(4)), bornT: -400 * 1440, seed: 12345 + this._sampleN * 17 }); c.now = 0; this._samples.set(k, c); }
    return c;
  },
  describeSpec(b) {
    const s = b.spec, out = [], add = (a, v) => out.push(h('span', null, a), h('span', null, v));
    const body = Array.isArray(s.body) ? s.body[0] : s.body;
    add('Gövde', BODY[body || 'W'].name); add('Kuyruk', TAILS[s.tail || 'delta'].name); add('Kuyruk rengi', TAILCOL[s.tc || 'none'].name);
    const pats = [s.tux && 'Tuxedo', s.sb && 'Snakeskin', s.grass && 'Grass', s.mosaic && 'Mozaik', s.moscow && 'Moscow', s.metal && 'Metal', s.purple && 'Mor gövde'].filter(Boolean);
    if (pats.length) add('Desen / gen', pats.join(', ')); return out;
  },

  /* ---------------- Döngü ---------------- */
  frame(now) {
    requestAnimationFrame((t) => this.frame(t));
    if (document.hidden) { this.last = now; return; }
    const dt = Math.min(0.05, (now - this.last) / 1000); this.last = now; if (!this.S) return;
    const S = this.S; S.clockMin += dt * S.settings.speed; S.stats.playSec += dt;
    this.tank.update(dt, S.clockMin); Chem.advance(dt * S.settings.speed);
    if (S.blackoutUntil && S.clockMin >= S.blackoutUntil) { S.blackoutUntil = 0; this.tank.lampMode = 'auto'; S.settings.lamp = 'auto'; UI.toast('Karartma bitti: ışık otomatiğe döndü', 'sun'); }
    this.reapPlants();
    this.dayTick(dt);
    this.topAcc += dt;
    if (this.topAcc > 1) {
      this.topAcc = 0; this.tickBreeding(); UI.cur === 'aq' && UI.refreshAq();
      if (UI.cur === 'aq' || UI.cur === 'hub') AudioSys.setMood(this.tank.light < 0.4 ? 'night' : 'day');
      if (S.settings.sessionReminder && !this.sessionWarned && S.stats.playSec > 3600) { this.sessionWarned = true; UI.toast('1 saattir oynuyorsun — biraz mola vermeye ne dersin? ☕', 'bell', 6000); }
    }
    // otomatik düşük güç modu: kare süresi uzarsa süs efektlerini azalt
    this.ema = (this.ema || 0.016) * 0.97 + dt * 0.03; this.slowT = clamp((this.slowT || 0) + (this.ema > 0.034 ? dt : -dt * 2), 0, 6);
    if (!this.low && this.slowT > 4) this.low = true; else if (this.low && this.slowT <= 0 && this.ema < 0.022) this.low = false;
    if (UI.cur === 'aq') this.renderMain(); else if (UI.cur === 'design') Editor.render();
  },

  /* ---------------- Görünümler (kamera/girdi) ---------------- */
  get cam() { return this.vp.cam; }, get cw() { return this.vp.cw; }, get ch() { return this.vp.ch; }, get cvs() { return this.vp.cv; },
  worldToScreen(x, y) { return this.vp.toScreen(x, y); }, screenToWorld(x, y) { return this.vp.toWorld(x, y); },
  setZoom(z, sx, sy) { this.vp.setZoom(z, sx, sy); },
  resizeCanvas() { this.vp.resize(); if (this.dvp) this.dvp.resize(); },
  renderMain() { this.vp.render({ reduce: this.S.settings.reduce, showFav: true, low: this.low, dry: !!this.tank.scape.dry }); },
  renderThumb(cv) {
    const r = cv.getBoundingClientRect(), dpr = Math.min(2, devicePixelRatio || 1), w = Math.round(r.width || 320), hh = Math.round(r.height || 180), t = this.tank;
    if (cv.width !== w * dpr) { cv.width = w * dpr; cv.height = hh * dpr; }
    t.render(cv.getContext('2d'), { cw: w, ch: hh, dpr, cx: t.W / 2, cy: t.H / 2, zoom: Math.max(1, (hh / t.H) / (w / t.W)), par: 0, reduce: true });
  },
  bindCanvas() {
    let tipEl = null;
    const showTip = (c) => { if (tipEl) tipEl.remove(); const s = this.vp.toScreen(c.sw.x, c.sw.y); tipEl = h('div.tip', { style: { left: s.x + 'px', top: s.y + 'px' } }, `${c.sex === 'M' ? '♂' : '♀'} ${c.name} · ${c.breed().name}`); $('#s-aq').append(tipEl); const el = tipEl; setTimeout(() => el.remove(), 1800); };
    this.vp = new Viewport($('#tank'), this.tank, {
      down: () => { AudioSys.start(); return false; },
      tap: (p) => this.tap(p.x, p.y),
      long: (p) => { const w = this.vp.toWorld(p.x, p.y), c = this.tank.hit(w.x, w.y, 30 / w.S); if (c) showTip(c); },
      zoomed: (z) => { AudioSys.setZoom(z); if (z > 1.5) this.task('zoom'); },
    });
    document.addEventListener('keydown', (e) => {
      if (/input|textarea/i.test((e.target.tagName || '')) || e.ctrlKey || e.metaKey) return;
      if (UI.sheets.length || $('#celebrate').classList.contains('show')) return;
      const k = e.key.toLowerCase();
      if (UI.cur === 'aq') { if (k === 'f') this.feed(); else if (k === 'l') { this.cycleLamp(); UI.refreshAq(); } else if (k === 's') { this.cycleSpeed(); UI.refreshAq(); } else if (k === '+' || k === '=') this.setZoom(this.cam.zoom * 1.25, this.cw / 2, this.ch / 2); else if (k === '-') this.setZoom(this.cam.zoom / 1.25, this.cw / 2, this.ch / 2); }
      const tabs = ['aq', 'design', 'lab', 'dex', 'profile']; if (/^[1-5]$/.test(k)) UI.go(tabs[+k - 1]); else if (k === 'h') UI.go('hub');
    });
  },
  tap(sx, sy) {
    if (this.pruneMode) {
      const w0 = this.vp.toWorld(sx, sy), it = Scape.hit(this.tank.scape, this.tank.W, w0.x, w0.y);
      if (it && it.k === 'plant') { const n = Chem.prune(it); if (n) UI.pruneResult(it, n); else UI.toast(`${PLANTS[it.d].name} henüz budanacak kadar uzamadı`, 'leaf', 2000); }
      return;
    }
    const w = this.vp.toWorld(sx, sy), c = this.tank.hit(w.x, w.y, 26 / w.S); this.S.stats.taps++;
    const cl = (this.tank.clutches || []).find((k) => Math.abs(k.x - w.x) < 40 && w.y < 90); if (cl && !c) return UI.confirm('Yumurta kümesi temizlensin mi?', `${cl.damName} ~${cl.n} yumurta bıraktı. Temizlersen açılmaz.`, () => { this.tank.clutches.splice(this.tank.clutches.indexOf(cl), 1); });
    if (c) { const s = this.vp.toScreen(c.sw.x, c.sw.y), r = this.vp.cv.getBoundingClientRect(), sz = c.bodyLen() * s.S * 1.4;
      UI.openCreature(c, { left: r.left + s.x - sz / 2, top: r.top + s.y - sz / 4, width: sz, height: sz / 2 }); }
    else this.tank.startleAt(w.x, w.y, 150);   // cama dokunuşu: halka + bazı balıklar ürker
  },
  onScreen(name) { this.tank.frozen = name === 'design'; if (name === 'aq' || name === 'design') requestAnimationFrame(() => { this.resizeCanvas(); name === 'aq' && UI.refreshAq(); }); },

  /* ---------------- Yaşam döngüsü ---------------- */
  watchLifecycle() {},
  onVisibility() {
    if (document.hidden) { this.hiddenAt = Date.now(); this.save(true); AudioSys.suspend(); }
    else {
      AudioSys.resume(); const s = (Date.now() - this.hiddenAt) / 1000;
      if (this.hiddenAt && s > 1) { this.S.clockMin += Math.min(s, 8 * 1440 * 60) * 1; this.tank.creatures.forEach((c) => (c.now = this.S.clockMin)); }
      this.hiddenAt = 0; this.last = performance.now();
    }
  },
};

window.addEventListener('DOMContentLoaded', () => Game.boot());
