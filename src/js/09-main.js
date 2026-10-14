'use strict';
/* =====================================================================
   09 · ÇEKİRDEK — oyun durumu, döngü, kamera/girdi, görevler, ekonomi
   ===================================================================== */
const Game = {
  S: null, slot: 0, tank: new Tank(), cam: { cx: 500, cy: 350, zoom: 1 }, celebQ: [],
  AVATARS: ['🐠', '🐟', '🐡', '🦐', '🐚', '🦀', '🐙', '🪸'],
  DAILY: [50, 60, 70, 80, 90, 100, 200],
  TASKS: [
    { id: 'feed', name: 'Balıkları besle', desc: 'Akvaryumda Yem düğmesine bas', goal: 3, coins: 40, xp: 15, go: 'aq' },
    { id: 'inspect', name: 'Bir balığı tanı', desc: 'Akvaryumda bir balığa dokun ve kartını incele', goal: 1, coins: 30, xp: 10, go: 'aq' },
    { id: 'zoom', name: 'Yakından bak', desc: 'Tankı iki parmakla (veya tekerlekle) yakınlaştır', goal: 1, coins: 30, xp: 10, go: 'aq' },
    { id: 'test', name: 'Gizli genleri ortaya çıkar', desc: 'Bir balığın genotipini test et', goal: 1, coins: 60, xp: 25, go: 'aq' },
  ],
  _samples: new Map(), _sampleN: 0, last: 0, tAcc: 0, topAcc: 0, hiddenAt: 0, sessionWarned: false,

  /* ---------------- Başlangıç ---------------- */
  boot() {
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
    const t = this.tank; t.creatures.length = 0; t.food.length = 0; t.setAspect(t.W / t.H);
    createStarterFish(t, this.S.clockMin); for (const c of t.creatures) Pedigree.add(c.id, 0, 0, { name: c.name });
    this.checkDiscoveries(true); this.afterLoad(); this.save(true);
  },

  loadState(d) {
    this.S = d; const t = this.tank; t.creatures.length = 0; t.food.length = 0;
    Pedigree.rec = d.pedigree || {}; Pedigree._memo.clear(); _nextId = Math.max(d.nextId || 1, 1);
    for (const cd of d.creatures) { try { const c = new Creature(cd); c.sw.x = clamp(cd.x ?? c.sw.x, 40, t.W - 40); c.sw.y = clamp(cd.y ?? c.sw.y, 60, t.H - 90); c.now = d.clockMin; t.addCreature(c); } catch (e) { console.warn('Canlı yüklenemedi', e); } }
    this.checkDiscoveries(true); this.afterLoad();
  },
  afterLoad() {
    const S = this.S; this.tank.lampMode = S.settings.lamp; this.tank.light = this.tank.lampTarget(S.clockMin); this.tank.setAspect(this.tank.W / this.tank.H);
    if (!this.tank.bg) { this.tank.layout(); this.tank.buildBG(); }
    this.tank.onEat = () => { if (R.chance(0.45)) AudioSys.SFX.eat(); };
    UI.refreshTop && $('#app') && UI.refreshTop();
  },
  computeOffline() {
    const S = this.S, secs = (Date.now() - (S.lastSeen || Date.now())) / 1000;
    if (secs < 120) return null;
    const minutes = Math.min(secs * 1, 8 * 1440), before = this.tank.creatures.map((c) => c.stage(S.clockMin));
    S.clockMin += minutes; const grown = this.tank.creatures.filter((c, i) => c.stage(S.clockMin) !== before[i]).length;
    this.tank.creatures.forEach((c) => (c.now = S.clockMin));
    return { minutes, days: minutes / 1440, grown };
  },

  pack() {
    const S = this.S; S.creatures = this.tank.creatures.map((c) => c.toJSON()); S.pedigree = Pedigree.rec; S.nextId = _nextId; S.lastSeen = Date.now();
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
  addCoins(n) { this.S.coins += n; UI.refreshTop(); },
  addXp(n, onceKey) {
    const S = this.S; if (onceKey) { S.once = S.once || {}; if (S.once[onceKey]) return; S.once[onceKey] = 1; }
    const before = Progress.level(S.xp); S.xp += n; const after = Progress.level(S.xp);
    if (after > before) { UI.toast(`Seviye ${after}! ${Progress.title(after)}`, 'star', 4200); AudioSys.SFX.discover(1); this.notify('level', `Seviye ${after} oldun.`); }
  },
  notify(type, text) { const S = this.S; S.notifs.push({ t: S.clockMin, type, text, read: false }); if (S.notifs.length > 80) S.notifs.shift(); UI.refreshTop(); },
  task(id, n = 1) { const S = this.S; if (S.claimed[id]) return; const t = this.TASKS.find((x) => x.id === id); if (!t) return; const was = S.tasks[id] || 0; S.tasks[id] = Math.min(t.goal, was + n); if (was < t.goal && S.tasks[id] >= t.goal) UI.toast(`Hedef tamam: ${t.name} — Merkez'den ödülünü topla`, 'gift', 3800); },
  claimTask(t) { const S = this.S; if (S.claimed[t.id] || (S.tasks[t.id] || 0) < t.goal) return; S.claimed[t.id] = 1; this.addCoins(t.coins); this.addXp(t.xp); AudioSys.SFX.coin(); UI.toast(`+${t.coins} Altın Pul · +${t.xp} XP`, 'coin'); this.save(); },
  dailyState() { const d = this.S.daily; return { can: d.last !== todayKey(), idx: d.idx % 7, reward: this.DAILY[d.idx % 7] }; },
  claimDaily() { const d = this.S.daily, s = this.dailyState(); if (!s.can) return; d.last = todayKey(); d.idx = (d.idx + 1) % 7; this.addCoins(s.reward); this.addXp(5); AudioSys.SFX.coin(); UI.toast(`Günün ödülü: +${s.reward} Altın Pul`, 'gift'); this.save(); },

  /* ---------------- Eylemler ---------------- */
  feed() {
    if (this.tank.feed()) { this.S.stats.fed++; this.task('feed'); this.addXp(3); AudioSys.SFX.feed(); } else UI.toast('Önceki yemler henüz bitmedi', 'feed', 1800);
  },
  cycleLamp() { const o = ['auto', 'on', 'off'], t = this.tank; t.lampMode = o[(o.indexOf(t.lampMode) + 1) % 3]; this.S.settings.lamp = t.lampMode; UI.toast({ auto: 'Işık: otomatik (07:00–21:00)', on: 'Işık: sürekli açık', off: 'Işık: kapalı' }[t.lampMode], t.lampMode === 'off' ? 'moon' : 'sun', 1800); },
  cycleSpeed() { const o = [1, 2, 4, 8], st = this.S.settings; st.speed = o[(o.indexOf(st.speed) + 1) % o.length]; UI.toast(`Oyun hızı ${st.speed}×`, 'speed', 1500); },
  sell(c) {
    if (this.tank.creatures.length <= 1) { UI.toast('Son balığını satamazsın', 'fish'); return false; }
    const v = c.value(); this.tank.removeCreature(c); this.S.stats.sold++; this.S.stats.maxSale = Math.max(this.S.stats.maxSale, v);
    this.addCoins(v); this.addXp(2); AudioSys.SFX.sell(); UI.toast(`${c.name} satıldı · +${fmt(v)} Altın Pul`, 'coin'); this.save(); UI.refreshAq(); return true;
  },
  testCreature(c) {
    if (c.tested) return true; if (this.S.coins < 40) { UI.toast('Yeterli Altın Pul yok (40 gerekli)', 'coin'); return false; }
    this.S.coins -= 40; c.tested = true; this.S.stats.tests++; this.task('test'); this.addXp(10); UI.refreshTop(); AudioSys.SFX.discover(0); this.save(); return true;
  },

  /** Rastgele / mutant test balığı (Aşama 2'de yerini gerçek üreme alacak). */
  addRandomFish(mutant) {
    const t = this.tank, now = this.S.clockMin; let genome, sire = 0, dam = 0;
    const ms = t.creatures.filter((c) => c.sex === 'M'), fs = t.creatures.filter((c) => c.sex === 'F');
    if (mutant && ms.length && fs.length) { const a = R.pick(ms), b = R.pick(fs); genome = Genetics.breed(a.genome, b.genome, R, { mutMul: 80 }); sire = a.id; dam = b.id; }
    else genome = Genetics.randomFounder(R.chance(0.5) ? 'M' : 'F');
    const c = new Creature({ genome, bornT: now - 70 * 1440, sire, dam, x: R.float(100, t.W - 100), y: R.float(120, t.H - 200) });
    c.now = now; Pedigree.add(c.id, sire, dam, { name: c.name }); t.addCreature(c); this.checkDiscoveries(false); UI.refreshAq(); this.save(); return c;
  },

  /* ---------------- Keşif ---------------- */
  checkDiscoveries(silent) {
    for (const c of this.tank.creatures) {
      const b = c.breed(); if (this.S.discovered[b.id]) continue;
      this.S.discovered[b.id] = { t: this.S.clockMin, by: c.id };
      if (!silent) { this.celebQ.push([c, b]); this.addXp(30 * (b.rarity + 1)); this.notify('discovery', `Yeni varyasyon keşfedildi: ${b.name}`); }
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
    this.tank.update(dt, S.clockMin);
    this.topAcc += dt;
    if (this.topAcc > 1) {
      this.topAcc = 0; UI.cur === 'aq' && UI.refreshAq();
      if (UI.cur === 'aq' || UI.cur === 'hub') AudioSys.setMood(this.tank.light < 0.4 ? 'night' : 'day');
      if (S.settings.sessionReminder && !this.sessionWarned && S.stats.playSec > 3600) { this.sessionWarned = true; UI.toast('1 saattir oynuyorsun — biraz mola vermeye ne dersin? ☕', 'bell', 6000); }
    }
    // otomatik düşük güç modu: kare süresi uzarsa süs efektlerini azalt
    this.ema = (this.ema || 0.016) * 0.97 + dt * 0.03; this.slowT = clamp((this.slowT || 0) + (this.ema > 0.034 ? dt : -dt * 2), 0, 6);
    if (!this.low && this.slowT > 4) this.low = true; else if (this.low && this.slowT <= 0 && this.ema < 0.022) this.low = false;
    if (UI.cur === 'aq') this.renderMain();
  },

  cvs: null, cw: 0, ch: 0, dpr: 1,
  renderMain() {
    if (!this.cw) return; const cam = this.cam, t = this.tank;
    this.clampCam();
    t.render(this.cvs.getContext('2d'), { cw: this.cw, ch: this.ch, dpr: this.dpr, cx: cam.cx, cy: cam.cy, zoom: cam.zoom, par: this.parX || 0, reduce: this.S.settings.reduce, showFav: true, low: this.low });
  },
  renderThumb(cv) {
    const r = cv.getBoundingClientRect(), dpr = Math.min(2, devicePixelRatio || 1), w = Math.round(r.width || 320), hh = Math.round(r.height || 180), t = this.tank;
    if (cv.width !== w * dpr) { cv.width = w * dpr; cv.height = hh * dpr; }
    t.render(cv.getContext('2d'), { cw: w, ch: hh, dpr, cx: t.W / 2, cy: t.H / 2, zoom: Math.max(1, (hh / t.H) / (w / t.W)), par: 0, reduce: true });
  },

  /* ---------------- Tuval, kamera, girdi ---------------- */
  clampCam() { const c = this.cam, t = this.tank, hw = t.W / (2 * c.zoom), hh = t.H / (2 * c.zoom); c.cx = clamp(c.cx, hw, t.W - hw); c.cy = clamp(c.cy, hh, t.H - hh); },
  screenToWorld(sx, sy) { const S = (this.cw / this.tank.W) * this.cam.zoom; return { x: (sx - this.cw / 2) / S + this.cam.cx, y: (sy - this.ch / 2) / S + this.cam.cy, S }; },
  worldToScreen(wx, wy) { const S = (this.cw / this.tank.W) * this.cam.zoom; return { x: (wx - this.cam.cx) * S + this.cw / 2, y: (wy - this.cam.cy) * S + this.ch / 2, S }; },
  resizeCanvas() {
    const cv = this.cvs, r = cv.getBoundingClientRect(); if (r.width < 10 || r.height < 10) return;
    this.dpr = Math.min(2, devicePixelRatio || 1); this.cw = r.width; this.ch = r.height; cv.width = Math.round(r.width * this.dpr); cv.height = Math.round(r.height * this.dpr);
    const oldW = this.tank.W; this.tank.setAspect(r.width / r.height);
    if (this.tank.W !== oldW) { this.cam.cx *= this.tank.W / oldW; }
    this.cam.zoom = Math.max(1, this.cam.zoom); this.clampCam();
  },
  setZoom(z, sx, sy) {
    const cam = this.cam, w = this.screenToWorld(sx, sy); cam.zoom = clamp(z, 1, 3.2);
    const S = (this.cw / this.tank.W) * cam.zoom; cam.cx = w.x - (sx - this.cw / 2) / S; cam.cy = w.y - (sy - this.ch / 2) / S; this.clampCam();
    AudioSys.setZoom(cam.zoom); if (cam.zoom > 1.5) this.task('zoom');
  },
  bindCanvas() {
    const cv = this.cvs = $('#tank'), ptrs = new Map(); let moved = false, pinch = null, lp = 0, tipEl = null, t0 = 0, start = null;
    new ResizeObserver(() => this.resizeCanvas()).observe(cv);
    const rel = (e) => { const r = cv.getBoundingClientRect(); return { x: e.clientX - r.left, y: e.clientY - r.top }; };
    const showTip = (c) => { if (tipEl) tipEl.remove(); const s = this.worldToScreen(c.sw.x, c.sw.y); tipEl = h('div.tip', { style: { left: s.x + 'px', top: s.y + 'px' } }, `${c.sex === 'M' ? '♂' : '♀'} ${c.name} · ${c.breed().name}`); $('#s-aq').append(tipEl); const el = tipEl; setTimeout(() => el.remove(), 1800); };
    cv.addEventListener('pointerdown', (e) => {
      cv.setPointerCapture(e.pointerId); const p = rel(e); ptrs.set(e.pointerId, p); AudioSys.start();
      if (ptrs.size === 1) { moved = false; start = { ...p }; t0 = performance.now(); clearTimeout(lp); lp = setTimeout(() => { if (!moved && ptrs.size === 1) { const w = this.screenToWorld(start.x, start.y), c = this.tank.hit(w.x, w.y, 30 / w.S); if (c) { moved = true; showTip(c); } } }, 520); }
      else if (ptrs.size === 2) { const [a, b] = [...ptrs.values()]; pinch = { d: Math.hypot(a.x - b.x, a.y - b.y), z: this.cam.zoom }; moved = true; clearTimeout(lp); }
    });
    cv.addEventListener('pointermove', (e) => {
      const p = rel(e), prev = ptrs.get(e.pointerId);
      // hafif paralaks: imleç/parmak konumuna göre
      this.parX = ((p.x / this.cw) - 0.5) * -14;
      if (!prev) return; ptrs.set(e.pointerId, p);
      if (ptrs.size === 2 && pinch) { const [a, b] = [...ptrs.values()]; const d = Math.hypot(a.x - b.x, a.y - b.y); this.setZoom(pinch.z * d / pinch.d, (a.x + b.x) / 2, (a.y + b.y) / 2); return; }
      if (ptrs.size === 1) {
        if (!moved && Math.hypot(p.x - start.x, p.y - start.y) > 8) { moved = true; cv.classList.add('drag'); clearTimeout(lp); }
        if (moved && this.cam.zoom > 1.001) { const S = (this.cw / this.tank.W) * this.cam.zoom; this.cam.cx -= (p.x - prev.x) / S; this.cam.cy -= (p.y - prev.y) / S; this.clampCam(); }
      }
    });
    const up = (e) => {
      const had = ptrs.has(e.pointerId); ptrs.delete(e.pointerId); clearTimeout(lp); cv.classList.remove('drag'); if (ptrs.size < 2) pinch = null;
      if (had && ptrs.size === 0 && !moved && performance.now() - t0 < 600) this.tap(start.x, start.y);
    };
    cv.addEventListener('pointerup', up); cv.addEventListener('pointercancel', up);
    cv.addEventListener('wheel', (e) => { e.preventDefault(); const p = rel(e); this.setZoom(this.cam.zoom * Math.exp(-e.deltaY * 0.0014), p.x, p.y); }, { passive: false });
    document.addEventListener('keydown', (e) => {
      if (/input|textarea/i.test((e.target.tagName || '')) || e.ctrlKey || e.metaKey) return;
      if (UI.sheets.length || $('#celebrate').classList.contains('show')) return;
      const k = e.key.toLowerCase();
      if (UI.cur === 'aq') { if (k === 'f') this.feed(); else if (k === 'l') { this.cycleLamp(); UI.refreshAq(); } else if (k === 's') { this.cycleSpeed(); UI.refreshAq(); } else if (k === '+' || k === '=') this.setZoom(this.cam.zoom * 1.25, this.cw / 2, this.ch / 2); else if (k === '-') this.setZoom(this.cam.zoom / 1.25, this.cw / 2, this.ch / 2); }
      const tabs = ['aq', 'design', 'lab', 'dex', 'profile']; if (/^[1-5]$/.test(k)) UI.go(tabs[+k - 1]); else if (k === 'h') UI.go('hub');
    });
  },
  tap(sx, sy) {
    const w = this.screenToWorld(sx, sy), c = this.tank.hit(w.x, w.y, 26 / w.S); this.S.stats.taps++;
    if (c) { const s = this.worldToScreen(c.sw.x, c.sw.y), r = $('#tank').getBoundingClientRect(), sz = c.bodyLen() * s.S * 1.4;
      UI.openCreature(c, { left: r.left + s.x - sz / 2, top: r.top + s.y - sz / 4, width: sz, height: sz / 2 }); }
    else this.tank.startleAt(w.x, w.y, 150);   // cama dokunuşu: halka + bazı balıklar ürker
  },
  onScreen(name) { if (name === 'aq') { requestAnimationFrame(() => { this.resizeCanvas(); UI.refreshAq(); }); } },

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
