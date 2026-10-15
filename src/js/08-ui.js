'use strict';
/* =====================================================================
   08 · ARAYÜZ — gezinti, sayfa geçişleri, sheet'ler, Canlı Kartı, Ansiklopedi,
        Profil, Ayarlar, kutlama. (Tüm metinler Türkçe.)
   ===================================================================== */

/* ---------------- Portre: tek canlıyı küçük sahnede canlı gösterir ---------------- */
class Portrait {
  constructor(cr, canvas, o = {}) {
    this.cr = cr; this.cv = canvas; this.zoom = o.zoom || 1; this.t = 0; this.bub = []; this.run = false; this.big = !!o.big;
    this.p = Object.create(cr); this.p.sprite = null; this.p.sw = cr.def.kind === 'fish' ? new Swimmer(this.p) : new Crawler(this.p); this.p.stress = 0;
    this.p.sw.heading = 0; this.p.sw.flipTarget = 1; this.p.sw.flip = 1;
    for (let i = 0; i < 14; i++) this.bub.push({ x: R.next(), y: R.next(), r: R.float(1, 3.2), v: R.float(0.04, 0.1) });
    this.resize(); this._f = this._f.bind(this);
  }
  resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);   // clientWidth: dönüşümlerden (FLIP) etkilenmez
    this.dpr = dpr; this.cw = Math.max(40, this.cv.clientWidth); this.ch = Math.max(40, this.cv.clientHeight);
    this.cv.width = Math.round(this.cw * dpr); this.cv.height = Math.round(this.ch * dpr);
  }
  setZoom(z) { this.zoom = z; }
  start() { if (this.run) return; this.run = true; this.last = performance.now(); requestAnimationFrame(this._f); }
  stop() { this.run = false; }
  _f(now) {
    if (!this.run) return; const dt = Math.min(0.05, (now - this.last) / 1000); this.last = now; this.t += dt; this.draw(dt); requestAnimationFrame(this._f);
  }
  draw(dt) {
    const ctx = this.cv.getContext('2d'), cw = this.cw, ch = this.ch, dpr = this.dpr, p = this.p, fishy = p.def.kind === 'fish', sp = fishy ? FishArt.sprite(p) : { bf: p.species === 'shrimp' ? 0.78 : 0.9 };
    const adultLen = p.bodyLen() / p.growth() / sp.bf;
    const scale = (cw * (this.big ? 0.46 : 0.5) / adultLen) * this.zoom, W = cw / scale, H = ch / scale;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const g = ctx.createLinearGradient(0, 0, 0, ch); g.addColorStop(0, '#3fc4cf'); g.addColorStop(0.55, '#14708f'); g.addColorStop(1, '#073a55'); ctx.fillStyle = g; ctx.fillRect(0, 0, cw, ch);
    for (let i = 0; i < 4; i++) { const x = cw * (0.15 + i * 0.25) + Math.sin(this.t * 0.3 + i) * 14; const rg = ctx.createLinearGradient(0, 0, 0, ch); rg.addColorStop(0, 'rgba(220,255,250,.16)'); rg.addColorStop(1, 'rgba(220,255,250,0)'); ctx.fillStyle = rg; ctx.beginPath(); ctx.moveTo(x - 14, 0); ctx.lineTo(x + 14, 0); ctx.lineTo(x + 70, ch); ctx.lineTo(x - 40, ch); ctx.fill(); }
    // zemin
    ctx.fillStyle = 'rgba(210,190,140,.5)'; ctx.beginPath(); ctx.moveTo(0, ch); for (let x = 0; x <= cw; x += 12) ctx.lineTo(x, ch * 0.9 + Math.sin(x * 0.03) * 4); ctx.lineTo(cw, ch); ctx.fill();
    for (const b of this.bub) { b.y -= b.v * dt; if (b.y < -0.05) { b.y = 1.05; b.x = R.next(); } ctx.strokeStyle = 'rgba(230,255,255,.5)'; ctx.beginPath(); ctx.arc(b.x * cw + Math.sin(this.t * 2 + b.x * 9) * 4, b.y * ch, b.r, 0, TAU); ctx.stroke(); }
    // balık
    p.now = this.cr.now;
    p.sw.update(dt, { calm: true });
    if (!fishy) { p.sw.x = W / 2; p.sw.y = H * (p.species === 'shrimp' ? 0.64 : 0.72); const bs = [dpr * scale, 0, 0, dpr * scale, 0, 0]; ctx.setTransform(bs[0], 0, 0, bs[3], 0, 0); CrawlerArt.draw(ctx, p, this.t, 1, 1, bs); return; }
    const len = p.bodyLen() / sp.bf;   // yüzen balık, kuyruğu soldaysa merkez sağa kaydırılır
    p.sw.x = W / 2 + 0.22 * len + noise1(this.t * 0.3) * W * 0.025; p.sw.y = H * 0.47 + noise1(this.t * 0.37 + 9) * H * 0.04;
    const base = [dpr * scale, 0, 0, dpr * scale, 0, 0];
    ctx.setTransform(base[0], base[1], base[2], base[3], base[4], base[5]);
    FishArt.draw(ctx, p, this.t, 1, 1, base);
  }
}

/* ---------------- UI çekirdeği ---------------- */
const UI = {
  cur: null, tabs: ['aq', 'design', 'lab', 'dex', 'profile'], sheets: [], timers: [],

  init() {
    for (const b of $$('#tabbar .tab')) b.addEventListener('click', () => UI.go(b.dataset.go));
    $('#btn-hub').addEventListener('click', () => UI.go('hub'));
    $('#btn-bell').addEventListener('click', () => UI.openNotifs());
    document.addEventListener('pointerdown', (e) => { const b = e.target.closest && e.target.closest('.btn,.icon-btn,.qbtn'); if (b) UI.ripple(b, e); }, true);
    document.addEventListener('click', (e) => { if (e.target.closest && e.target.closest('button')) AudioSys.SFX.tick(); }, true);
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') { if ($('#celebrate').classList.contains('show')) UI.closeCelebrate(); else UI.closeTop(); } });
  },

  ripple(el, e) {
    if (Game.S && Game.S.settings.reduce) return;
    const r = el.getBoundingClientRect(), d = Math.max(r.width, r.height);
    const s = h('span.ripple', { style: { width: d + 'px', height: d + 'px', left: (e.clientX - r.left - d / 2) + 'px', top: (e.clientY - r.top - d / 2) + 'px' } });
    el.append(s); setTimeout(() => s.remove(), 650);
  },

  bubbleBurst() {
    if (Game.S.settings.reduce || prefersReduced()) return;
    for (let i = 0; i < 12; i++) {
      const s = 8 + Math.random() * 20, b = h('div.fx-bub', { style: { width: s + 'px', height: s + 'px', left: (Math.random() * 100) + 'vw', '--dx': (Math.random() * 80 - 40) + 'px', animationDelay: (Math.random() * 0.25) + 's', animationDuration: (0.8 + Math.random() * 0.5) + 's' } });
      document.body.append(b); setTimeout(() => b.remove(), 1700);
    }
  },

  /** "Suya dalma" geçişi: eski ekran bulanıp söner, yenisi kabarcıklarla yükselir. */
  go(name) {
    if (name === this.cur) return;
    const prev = this.cur ? $('#s-' + this.cur) : null, next = $('#s-' + name);
    this.cur = name;
    if (prev) { prev.classList.remove('enter'); prev.classList.add('leave'); setTimeout(() => { prev.classList.remove('leave', 'active'); }, 320); }
    next.classList.add('active', 'enter'); setTimeout(() => next.classList.remove('enter'), 600);
    $$('#tabbar .tab').forEach((t) => t.classList.toggle('active', t.dataset.go === name));
    this.stopThumbs();
    UI['render_' + name] && UI['render_' + name](next);
    if (name !== 'aq') next.scrollTop = 0;
    AudioSys.SFX.whoosh(); this.bubbleBurst();
    AudioSys.setMood(name === 'aq' || name === 'hub' || name === 'profile' ? (Game.tank.light < 0.4 ? 'night' : 'day') : name === 'design' ? 'studio' : 'lab');
    Game.onScreen(name);
  },

  refreshTop() {
    const S = Game.S; $('#v-coins').textContent = fmt(S.coins); $('#v-rep').textContent = fmt(S.rep);
    const n = S.notifs.filter((x) => !x.read).length, b = $('#bell-n'); b.textContent = n > 9 ? '9+' : n; b.classList.toggle('hidden', n === 0);
  },

  toast(msg, ic = 'check', ms = 3200) {
    const t = h('div.toast', null, icon(ic), h('span', null, msg)); $('#toasts').append(t);
    setTimeout(() => { t.classList.add('out'); setTimeout(() => t.remove(), 380); }, ms);
  },

  /* ---------- sheet (modal) ---------- */
  sheet(content, o = {}) {
    const back = h('div.sheet-back'), sheet = h('div.sheet' + (o.full ? '.full' : ''), { role: 'dialog', 'aria-modal': 'true' }, content);
    if (o.cls) o.cls.split(' ').forEach((c) => sheet.classList.add(c));
    const wrap = h('div.sheet-wrap', null, back, sheet); const rec = { wrap, onClose: o.onClose, closed: false };
    const close = () => { if (rec.closed) return; rec.closed = true; wrap.classList.add('closing'); rec.onClose && rec.onClose(); UI.sheets = UI.sheets.filter((s) => s !== rec); setTimeout(() => wrap.remove(), 300); };
    rec.close = close; back.addEventListener('click', close); $('#sheets').append(wrap); UI.sheets.push(rec);
    return rec;
  },
  closeTop() { const s = UI.sheets[UI.sheets.length - 1]; if (s) s.close(); },
  sheetHead(title, rec) { return h('div.sheet-h', null, h('h3', null, title), h('button.icon-btn', { 'aria-label': 'Kapat', onclick: () => rec.close() }, icon('close'))); },

  rarityPill(r) { const R_ = RARITY[r]; return h('span.pill.rar' + (r === 4 ? '.rar-4' : ''), { style: { '--c': R_.color }, 'data-ico': R_.icon }, R_.name); },
  emptyState(ill, title, text, ...actions) { return h('div.empty', null, h('div.ill', null, ill), h('b', null, title), h('div', null, text), actions.length ? h('div.row', { style: { justifyContent: 'center', marginTop: '14px' } }, actions) : null); },

  /* ---------- Merkez (Hub) ---------- */
  render_hub(el) {
    const S = Game.S, lvl = Progress.level(S.xp), cur = Progress.xpFor(lvl), nxt = Progress.xpFor(lvl + 1);
    const canvas = h('canvas', { width: 640, height: 360 });
    const tank = h('div.tank-card', { role: 'button', tabindex: 0, onclick: () => UI.go('aq') }, canvas,
      h('div.meta', null, h('div', { style: { flex: 1 } }, h('h3', null, 'Dükkân Tankı'), h('div.small.muted', { id: 'hub-meta' }, '')), h('span.dot')));
    const daily = Game.dailyState();
    const tasks = Game.TASKS.filter((t) => !S.claimed[t.id]);
    el.replaceChildren(h('div.wrap.stack', null,
      h('div.row', null, h('div.avatar', null, Game.AVATARS[S.avatar % Game.AVATARS.length]), h('div', null, h('h2', null, 'Hoş geldin, ' + S.name), h('div.muted.small', null, Progress.title(lvl) + ' · Seviye ' + lvl)), h('div.sp')),
      h('div.pbar', { title: 'XP' }, h('i', { style: { width: (100 * (S.xp - cur) / Math.max(1, nxt - cur)) + '%' } })),
      tank,
      h('div.card', null, h('div.row', null, icon('gift'), h('div.sp', null, h('b', null, 'Günün Ödülü'), h('div.small.muted', null, daily.can ? `Bugünkü ödülün: ${fmt(daily.reward)} Altın Pul · ${daily.idx + 1}. gün` : 'Bugünkü ödülünü aldın. Yarın yeni ödül seni bekliyor.')),
        h('button.btn.primary', { disabled: daily.can ? null : true, onclick: () => { Game.claimDaily(); UI.render_hub(el); } }, daily.can ? 'Al' : 'Alındı'))),
      h('div.card', null, h('h3', null, 'Başlangıç hedefleri'),
        tasks.length ? tasks.map((t) => { const pr = S.tasks[t.id] || 0, done = pr >= t.goal;
          return h('div.task' + (done ? '.done' : ''), null, h('div.ck', null, done ? icon('check') : null),
            h('div.sp', null, h('b', null, t.name), h('div.small.muted', null, t.desc + ` (${Math.min(pr, t.goal)}/${t.goal})`), h('div.tiny', { style: { color: 'var(--accent)' } }, `Ödül: ${t.coins} Altın Pul · ${t.xp} XP`)),
            done ? h('button.btn.primary.sm', { onclick: () => { Game.claimTask(t); UI.render_hub(el); } }, 'Topla') : h('button.btn.sm', { onclick: () => UI.go(t.go) }, 'Git'));
        }) : UI.emptyState('🎉', 'Hepsi tamam!', 'Yeni hedefler sonraki aşamalarda açılacak.')),
      h('div.launch-grid', null,
        ...[['dex', 'book', 'Ansiklopedi'], ['lab', 'flask', 'Laboratuvar'], ['design', 'brush', 'Tasarım'], ['profile', 'user', 'Profil'], ['story', 'book', 'Hikâye'], ['contest', 'star', 'Yarışma'], ['season', 'gift', 'Sezon'], ['legacy', 'dna', 'Miras'], ['help', 'book', 'Bilgi Merkezi'], ['settings', 'gear', 'Ayarlar']].map(([g, i, n]) => h('button', { onclick: () => UI.go(g) }, icon(i), n)),
        h('button', { onclick: () => UI.openFishList() }, icon('list'), 'Balıklarım')),
    ));
    this.hubCanvas = canvas; this.hubMeta = $('#hub-meta', el); this.startThumbs();
  },
  startThumbs() { this.stopThumbs(); const f = () => { if (this.cur === 'hub' && this.hubCanvas && this.hubCanvas.isConnected) { Game.renderThumb(this.hubCanvas); const S = Game.S; if (this.hubMeta) this.hubMeta.textContent = `Gün ${dayOf(S.clockMin)} · ${clockStr(S.clockMin)} · ${Game.tank.creatures.length} balık`; } }; f(); this.timers.push(setInterval(() => { if (!document.hidden) f(); }, 70)); },
  stopThumbs() { this.timers.forEach(clearInterval); this.timers = []; },

  /* ---------- Akvaryum: üst şerit + hızlı eylemler ---------- */
  render_aq() { this.refreshAq(); },
  refreshAq() {
    const S = Game.S, t = Game.tank, info = $('#aq-info'), qa = $('#aq-qa');
    const lampOn = t.lightTarget > 0.5;
    info.replaceChildren(
      h('div.chip', null, icon(lampOn ? 'sun' : 'moon'), `Gün ${dayOf(S.clockMin)} · ${clockStr(S.clockMin)}`),
      h('button.chip', { style: { cursor: 'pointer' }, onclick: () => UI.openWater() }, h('span.dot', { style: { background: UI.waterDot(), boxShadow: `0 0 8px ${UI.waterDot()}`, width: '9px', height: '9px' } }), 'Su'),
      h('div.chip', null, icon('fish'), `${t.creatures.length}/${tankCap()}`),
      Game.pruneMode ? h('button.chip', { style: { border: '1px solid var(--accent)', cursor: 'pointer' }, onclick: () => { Game.pruneMode = false; UI.refreshAq(); } }, '✂ Budama modu · Bitti') : null,
      Game.unrevealed().length ? h('button.chip', { style: { border: '1px solid var(--accent)', cursor: 'pointer' }, onclick: () => UI.openReveal() }, '🍼 ' + Game.unrevealed().length + ' yeni yavru') : null,
      h('div.chip', { style: { marginLeft: 'auto' } }, icon('speed'), S.settings.speed + '×'));
    const mk = (ic, label, fn, on) => h('button.qbtn' + (on ? '.on' : ''), { onclick: fn, 'aria-label': label }, icon(ic), label);
    qa.replaceChildren(
      mk('feed', 'Yem', () => Game.feed()),
      mk(lampOn ? 'sun' : 'moon', S.settings.lamp === 'auto' ? 'Işık: oto' : S.settings.lamp === 'on' ? 'Işık: açık' : 'Işık: kapalı', () => { Game.cycleLamp(); UI.refreshAq(); }),
      mk('water', 'Su', () => UI.openWater()),
      mk('speed', 'Hız', () => { Game.cycleSpeed(); UI.refreshAq(); }),
      mk('list', 'Balıklar', () => UI.openFishList()),
      mk('camera', 'Fotoğraf', () => Photo.open()));
  },

  /* ---------- Henüz açılmamış ekranlar (dürüst boş durum) ---------- */
  render_design() { Editor.enter(); },
  render_lab_old(el) {
    const S = Game.S, males = Game.tank.creatures.filter((c) => c.sex === 'M').length, females = Game.tank.creatures.length - males;
    el.replaceChildren(h('div.wrap.stack', null,
      UI.emptyState('🧬', 'Üretim Laboratuvarı', 'Gebelik, sperm depolama, Punnett önizlemesi ve soyağacı Aşama 2\'de açılıyor. Genetik motoru hazır: şimdilik balıklarının kartında genotipini test ederek gen kombinasyonlarını inceleyebilirsin.', h('button.btn.primary', { onclick: () => UI.openFishList() }, 'Balıklarım')),
      h('div.card', null, h('div.row', null, icon('dna'), h('div.sp', null, h('b', null, 'Tankında ' + males + ' erkek, ' + females + ' dişi var'), h('div.small.muted', null, 'Dişiler, yalnızca erkeklerde görünen kuyruk ve desen genlerini taşıyabilir.'))))));
  },

  /* ---------- Ansiklopedi ---------- */
  dexSpecies: 'guppy',
  render_dex(el) {
    const S = Game.S, found = BREEDS.filter((b) => S.discovered[b.id]).length, pc = Math.round(100 * found / BREEDS.length);
    const chips = h('div.chips', null, SPECIES.map((s) => h('button.sp-chip' + (s.id === this.dexSpecies ? '.on' : '') + (s.status === 'soon' ? '.lock' : ''), {
      onclick: () => { if (s.status === 'soon') return UI.toast(`${s.name}: Aşama ${s.stage}'de eklenecek`, 'lock'); this.dexSpecies = s.id; UI.render_dex(el); } }, s.status === 'soon' ? icon('lock') : null, s.name)));
    const tiles = BREEDS.slice().sort((a, b) => b.rarity - a.rarity).map((b) => {
      const disc = !!S.discovered[b.id], cr = Game.sampleCreature(b.spec), r = RARITY[b.rarity];
      const cv = h('canvas', { width: 220, height: 105 }); cv.getContext('2d').drawImage(FishArt.sprite(cr).tex, 0, 0, 220, 105);
      return h('div.dex-tile' + (disc ? '' : '.undisc'), { style: { '--c': r.color }, role: 'button', tabindex: 0, onclick: () => UI.openBreed(b) }, cv,
        h('div.nm', null, disc ? b.name : '???'), h('div.tiny.muted', null, disc ? r.icon + ' ' + r.name : 'Keşfedilmedi'), h('div.rarbar'));
    });
    el.replaceChildren(h('div.wrap', null,
      h('div.row', { style: { margin: '6px 0 10px' } }, h('div.ring', { style: { '--p': pc } }, h('span', null, pc + '%')), h('div', null, h('h2', null, 'Ansiklopedi'), h('div.muted.small', null, `${found}/${BREEDS.length} lepistes varyasyonu keşfedildi`))),
      chips, h('div.grid2', null, tiles)));
  },
  openBreed(b) {
    const disc = !!Game.S.discovered[b.id], cr = Game.sampleCreature(b.spec), r = RARITY[b.rarity];
    const cv = h('canvas'), box = h('div.cc-portrait' + (b.rarity === 4 ? '.r4' : ''), { style: { '--c': r.color } }, cv);
    let pt = null;
    const rec = UI.sheet(h('div', null, UI.sheetHead(disc ? b.name : 'Bilinmeyen varyasyon', { close: () => rec.close() }), box,
      h('div.row.wrap-r', null, UI.rarityPill(b.rarity), h('span.pill', null, disc ? '✔ Keşfedildi' : '? Keşfedilmedi')),
      h('p', null, disc ? b.blurb : 'İpucu: ' + b.hint),
      disc ? h('div.kv', null, ...Game.describeSpec(b)) : h('div.locked', null, icon('lock'), 'Bu varyasyonu keşfetmek için doğru gen kombinasyonunu yetiştir.')), {
      onClose: () => pt && pt.stop() });
    if (disc) { pt = new Portrait(cr, cv); pt.start(); } else { const sc = FishArt.sprite(cr); const ctx = (cv.width = 420, cv.height = 200, cv.getContext('2d')); const g = ctx.createLinearGradient(0, 0, 0, 200); g.addColorStop(0, '#12404f'); g.addColorStop(1, '#06202c'); ctx.fillStyle = g; ctx.fillRect(0, 0, 420, 200); ctx.drawImage(sc.tex, 40, 0, 340, 162); ctx.globalCompositeOperation = 'source-atop'; ctx.fillStyle = 'rgba(2,10,16,.96)'; ctx.fillRect(0, 0, 420, 200); cv.style.width = '100%'; cv.style.height = '100%'; }
  },

  /* ---------- Profil ---------- */
  render_profile(el) {
    const S = Game.S, lvl = Progress.level(S.xp), cur = Progress.xpFor(lvl), nxt = Progress.xpFor(lvl + 1);
    const nameIn = h('input', { type: 'text', value: S.name, maxlength: 16, 'aria-label': 'Kullanıcı adı', onchange: (e) => { S.name = e.target.value.trim().slice(0, 16) || 'Misafir'; Game.save(); } });
    const stat = (v, l) => h('div.stat', null, h('b', null, v), h('div.small.muted', null, l));
    const best = Game.tank.creatures.reduce((m, c) => Math.max(m, c.rarity()), 0);
    el.replaceChildren(h('div.wrap.stack', null,
      h('div.card', null, h('div.row', null, h('div.avatar', { role: 'button', tabindex: 0, title: 'Avatarı değiştir', onclick: () => { S.avatar = (S.avatar + 1) % Game.AVATARS.length; Game.save(); UI.render_profile(el); } }, Game.AVATARS[S.avatar % Game.AVATARS.length]),
        h('div.sp', null, nameIn, h('div.small.muted', { style: { marginTop: '6px' } }, Progress.title(lvl) + ' · Seviye ' + lvl))),
        h('div.pbar', { style: { margin: '12px 0 4px' } }, h('i', { style: { width: (100 * (S.xp - cur) / Math.max(1, nxt - cur)) + '%' } })), h('div.tiny.muted', null, `${fmt(S.xp)} XP · sonraki seviye ${fmt(nxt)} XP`)),
      h('div.section-t', null, icon('star'), h('h3', null, 'İstatistikler')),
      h('div.grid2', null, stat(Game.tank.creatures.length, 'Tankındaki balık'), stat(BREEDS.filter((b) => S.discovered[b.id]).length + '/' + BREEDS.length, 'Keşfedilen varyasyon'), stat(fmt(S.stats.sold), 'Satılan balık'), stat(fmt(S.stats.fed), 'Yem verme'), stat(fmt(S.stats.tests), 'Genotip testi'), stat(Math.floor(S.stats.playSec / 60) + ' dk', 'Oynama süresi'), stat(RARITY[best].name, 'En nadir balığın'), stat(fmt(S.stats.maxSale), 'En değerli satış')),
      h('div.section-t', null, icon('camera'), h('h3', null, 'Galeri')),
      S.gallery.length ? h('div.grid2', { style: { gridTemplateColumns: 'repeat(auto-fill,minmax(130px,1fr))' } }, ...S.gallery.map((g, i) => h('div', { role: 'button', tabindex: 0, style: { cursor: 'pointer' }, onclick: () => UI.openPhoto(i) }, h('img', { src: g.src, alt: g.n, style: { width: '100%', borderRadius: '12px', display: 'block' } })))) : h('div.muted.small', null, 'Akvaryum ekranındaki kamera düğmesiyle fotoğraf çek.'),
      h('div.row', null, h('button.btn.sp', { onclick: () => UI.go('settings') }, icon('gear'), 'Ayarlar'), h('button.btn.sp', { onclick: () => UI.openNotifs() }, icon('bell'), 'Bildirimler'))));
  },

  openPhoto(i) {
    const g = Game.S.gallery[i], rec = UI.sheet(h('div.stack', null, UI.sheetHead(g.n, { close: () => rec.close() }), h('img', { src: g.src, style: { width: '100%', borderRadius: '14px' } }),
      h('div.row', null, h('a.btn.sp', { href: g.src, download: 'akvaryum-foto.jpg' }, 'İndir'), h('button.btn.coral.sp', { onclick: () => { Game.S.gallery.splice(i, 1); Game.save(); rec.close(); UI.render_profile($('#s-profile')); } }, 'Sil'))));
  },

  /* ---------- Ayarlar ---------- */
  render_settings(el) {
    const S = Game.S, st = S.settings, au = st.audio;
    const slider = (label, key) => h('div.set-row', null, h('label', null, label), h('input', { type: 'range', min: 0, max: 100, value: Math.round(au[key] * 100), style: { maxWidth: '55%' }, 'aria-label': label, oninput: (e) => { au[key] = e.target.value / 100; AudioSys.set(key, au[key]); }, onchange: () => Game.save() }));
    const seg = (opts, cur, fn) => h('div.seg', null, opts.map(([v, l]) => h('button' + (v === cur ? '.on' : ''), { onclick: () => { fn(v); UI.render_settings(el); } }, l)));
    const sw = (on, fn) => h('button.switch' + (on ? '.on' : ''), { role: 'switch', 'aria-checked': String(!!on), onclick: () => { fn(!on); UI.render_settings(el); } });
    const slots = [0, 1, 2].map((i) => { const inf = Save.slotInfo(i), active = Game.slot === i;
      return h('div.set-row', { style: { borderTop: i ? '1px solid var(--panel-b)' : 'none' } }, h('div.sp', null, h('b', null, `Yuva ${i + 1}` + (active ? ' · aktif' : '')),
        h('div.small.muted', null, inf ? `${inf.name} · Gün ${inf.day} · ${inf.fish} balık · Sv ${inf.level}${inf.backup ? ' (yedekten)' : ''}` : 'Boş')),
        active ? h('button.btn.sm', { onclick: () => { Game.save(true); UI.toast('Kaydedildi', 'save'); UI.render_settings(el); } }, 'Kaydet') : null,
        !active ? h('button.btn.sm' + (inf ? '' : '.primary'), { onclick: () => { Game.switchSlot(i); } }, inf ? 'Yükle' : 'Yeni oyun') : null,
        inf && !active ? h('button.btn.sm.ghost', { onclick: () => UI.confirm('Yuva ' + (i + 1) + ' silinsin mi?', 'Bu işlem geri alınamaz.', () => { Save.clear(i); UI.render_settings(el); }) }, 'Sil') : null);
    });
    el.replaceChildren(h('div.wrap.stack', null,
      h('h2', { style: { margin: '4px 2px 6px' } }, 'Ayarlar'),
      h('div.card', null, h('h3', null, '🔊 Ses'), slider('Ana ses', 'master'), slider('Müzik', 'music'), slider('Ambiyans', 'amb'), slider('Efektler', 'sfx'),
        h('div.set-row', null, h('label', null, 'Müzik tarzı'), seg([['ambient', 'Ambient'], ['lofi', 'Lo-fi'], ['nature', 'Sadece doğa']], au.style, (v) => { au.style = v; AudioSys.set('style', v); Game.save(); })),
        h('div.set-row', null, h('label', null, 'Uyku zamanlayıcısı'), seg([[0, 'Kapalı'], [15, '15 dk'], [30, '30 dk'], [60, '60 dk']], AudioSys.S.sleepMin, (v) => AudioSys.set('sleepMin', v))),
        h('div.set-row', null, h('label', null, 'Arka plandayken sesi kıs'), sw(st.bgMute, (v) => { st.bgMute = v; AudioSys.set('bgMute', v); Game.save(); }))),
      h('div.card', null, h('h3', null, '🎨 Görünüm'),
        h('div.set-row', null, h('label', null, 'Tema'), seg([['ocean', 'Okyanus'], ['light', 'Gündüz'], ['oled', 'Gece']], st.theme, (v) => { st.theme = v; Game.applySettings(); Game.save(); })),
        h('div.set-row', null, h('label', null, 'Yazı boyutu'), seg([[0.9, 'Küçük'], [1, 'Orta'], [1.15, 'Büyük']], st.font, (v) => { st.font = v; Game.applySettings(); Game.save(); })),
        h('div.set-row', null, h('label', null, 'Animasyonları azalt'), sw(st.reduce, (v) => { st.reduce = v; Game.applySettings(); Game.save(); })),
        h('div.set-row', null, h('label', null, 'Renk körü modu (şekil işaretleri)'), sw(st.cb, (v) => { st.cb = v; Game.applySettings(); Game.save(); }))),
      h('div.card', null, h('h3', null, '⏱ Oyun'),
        h('div.set-row', null, h('label', null, 'Oyun hızı'), seg([[1, '1×'], [2, '2×'], [4, '4×'], [8, '8×']], st.speed, (v) => { st.speed = v; Game.save(); })),
        h('div.set-row', null, h('label', null, 'Tank ışığı'), seg([['auto', 'Oto'], ['on', 'Açık'], ['off', 'Kapalı']], st.lamp, (v) => { st.lamp = v; Game.tank.lampMode = v; Game.save(); })),
        h('div.set-row', null, h('label', null, 'Musluk suyu'), seg(Object.entries(TAP_PROFILES).filter(([k]) => k !== 'ro' || Research.has('ro')).map(([k, p]) => [k, p.name.split(' ')[0]]), st.tap || 'mid', (v) => { st.tap = v; Game.save(); })),
        Research.has('feeder') ? h('div.set-row', null, h('label', null, 'Otomatik besleyici (18:00)'), sw(st.autoFeed !== false, (v) => { st.autoFeed = v; Game.save(); })) : null,
        h('div.set-row', null, h('label', null, 'Oturum süresi hatırlatıcısı (60 dk)'), sw(st.sessionReminder, (v) => { st.sessionReminder = v; Game.save(); }))),
      h('div.card', null, h('h3', null, '💾 Kayıt'), ...slots,
        h('div.row.wrap-r', { style: { marginTop: '10px' } },
          h('button.btn.sm', { onclick: () => Game.exportSave() }, 'Dışa aktar (.json)'), h('button.btn.sm', { onclick: () => UI.openImport() }, 'İçe aktar'),
          h('button.btn.sm.coral', { onclick: () => UI.confirm('Bu yuva sıfırlansın mı?', 'Tüm balıkların ve ilerlemen silinir.', () => Game.newGame(Game.slot)) }, 'Yuvayı sıfırla'))),
      h('div.card', null, h('h3', null, '🧪 Geliştirici'),
        h('div.small.muted', { style: { marginBottom: '8px' } }, 'Genetik motorunu denemek için. Konsol: Tests.all()'),
        h('div.row.wrap-r', null, h('button.btn.sm', { onclick: () => { const c = Game.addRandomFish(); UI.toast(c.name + ' tanka eklendi', 'fish'); } }, 'Rastgele balık ekle'),
          h('button.btn.sm', { onclick: () => { const c = Game.addRandomFish(true); UI.toast(c.name + ' (yüksek mutasyon) eklendi', 'dna'); } }, 'Mutant balık ekle'),
          h('button.btn.sm', { onclick: () => { Game.skipDays(10); UI.toast('Zaman 10 gün ileri sarıldı', 'speed'); } }, '10 gün ileri sar'),
          h('button.btn.sm', { onclick: () => { const ok = Tests.all(); UI.toast(ok ? 'Tüm testler geçti (konsola bak)' : 'Başarısız test var (konsola bak)', ok ? 'check' : 'close'); } }, 'Testleri çalıştır'))),
    ));
  },
  confirm(title, text, ok) {
    const rec = UI.sheet(h('div', null, h('h3', null, title), h('p.muted', null, text), h('div.row', { style: { justifyContent: 'flex-end', marginTop: '10px' } }, h('button.btn', { onclick: () => rec.close() }, 'Vazgeç'), h('button.btn.coral', { onclick: () => { rec.close(); ok(); } }, 'Evet'))));
  },
  openImport() {
    const ta = h('textarea', { placeholder: 'Dışa aktardığın JSON metnini buraya yapıştır…' }), file = h('input', { type: 'file', accept: '.json,application/json' });
    file.addEventListener('change', async () => { const f = file.files[0]; if (f) ta.value = await f.text(); });
    const rec = UI.sheet(h('div.stack', null, UI.sheetHead('İçe aktar', { close: () => rec.close() }), ta, file,
      h('button.btn.primary', { onclick: () => { try { Game.importSave(ta.value); rec.close(); UI.toast('Kayıt yüklendi', 'check'); } catch (e) { UI.toast('Geçersiz kayıt: ' + e.message, 'close'); } } }, 'Yükle')));
  },

  /* ---------- Bildirimler ---------- */
  openNotifs() {
    const S = Game.S, rec = UI.sheet(h('div', null, UI.sheetHead('Bildirimler', { close: () => rec.close() }),
      S.notifs.length ? S.notifs.slice().reverse().slice(0, 60).map((n) => h('div.task', null, h('div.ck', { style: { borderColor: n.read ? 'var(--panel-b)' : 'var(--coral)' } }, icon(n.type === 'discovery' ? 'dna' : n.type === 'warn' ? 'bell' : 'fish')), h('div.sp', null, h('div', null, n.text), h('div.tiny.muted', null, `Gün ${dayOf(n.t)} · ${clockStr(n.t)}`))))
        : UI.emptyState('🔔', 'Henüz bildirim yok', 'Doğumlar, keşifler ve uyarılar burada görünecek.')));
    S.notifs.forEach((n) => (n.read = true)); UI.refreshTop();
  },

  /* ---------- Balık listesi ---------- */
  openFishList() {
    const list = Game.tank.creatures.slice().sort((a, b) => (b.fav - a.fav) || (b.rarity() - a.rarity()));
    const rec = UI.sheet(h('div', null, UI.sheetHead(`Balıklarım (${list.length})`, { close: () => rec.close() }),
      list.length ? list.map((c) => { const r = RARITY[c.rarity()], cv = h('canvas', { width: 168, height: 80 }); cv.getContext('2d').drawImage(FishArt.sprite(c).tex, 0, 0, 168, 80);
        return h('div.fish-row', { role: 'button', tabindex: 0, onclick: (e) => { const rect = cv.getBoundingClientRect(); rec.close(); setTimeout(() => UI.openCreature(c, rect), 60); } }, cv,
          h('div.sp', null, h('b', null, (c.fav ? '★ ' : '') + c.name + (c.preg ? ' 🤰' : '') + (c.unrevealed ? ' 🍼' : '')), h('div.small.muted', null, `${c.sex === 'M' ? '♂ Erkek' : '♀ Dişi'} · ${c.breed().name} · ${c.stage()}`)), UI.rarityPill(c.rarity())); })
        : UI.emptyState('🐟', 'Tank bomboş', 'Mağaza Aşama 6\'da açılacak; şimdilik Ayarlar > Geliştirici bölümünden balık ekleyebilirsin.')), { full: list.length > 6 });
  },

  /* ---------- Canlı Kartı ---------- */
  openCreature(c, fromRect) {
    Game.task('inspect'); Game.addXp(1, 'inspect:' + c.id);
    const r = RARITY[c.rarity()], cv = h('canvas');
    const zoomBtn = h('button.icon-btn', { 'aria-label': 'Yakınlaştır', onclick: () => { zoomed = !zoomed; pt.setZoom(zoomed ? 1.8 : 1); } }, icon('zoom'));
    const portrait = h('div.cc-portrait' + (c.rarity() === 4 ? '.r4' : ''), { style: { '--c': r.color } }, cv, h('div.cc-tools', null, zoomBtn, h('button.icon-btn', { 'aria-label': 'Kapat', onclick: () => rec.close() }, icon('close'))), h('div.cc-rar', null, UI.rarityPill(c.rarity())));
    const body = h('div');
    let zoomed = false, pt = null, iv = 0;
    const build = () => {
      const p = c.pheno, F = c.inbreeding(), hp = clamp(c.health(), 0, 1.2) / 1.2 * 100 * (c.vit ?? 1);
      const parents = Pedigree.rec[c.id], pn = (id) => (Pedigree.rec[id] && Pedigree.rec[id].name) || '—';
      const kids = Object.values(Pedigree.rec).filter((x) => x.s === c.id || x.d === c.id).length;
      const pats = [p.tux && 'Tuxedo', p.sb && 'Snakeskin gövde', p.st && 'Snakeskin kuyruk', p.grass && 'Grass', p.mosaic && 'Mozaik', p.moscow && 'Moscow', p.metal && (p.metalDouble ? 'Metal ×2 ⚠' : 'Metal'), p.purple && 'Mor gövde'].filter(Boolean);
      const meter = (label, v, cls) => h('div', null, h('label', null, label), h('div.pbar' + (cls || ''), null, h('i', { style: { width: clamp(v, 0, 100) + '%' } })));
      const nameIn = h('input.cc-name', { type: 'text', value: c.name, maxlength: 18, 'aria-label': 'Balık adı', onchange: (e) => { c.name = e.target.value.trim().slice(0, 18) || c.name; if (Pedigree.rec[c.id]) Pedigree.rec[c.id].name = c.name; Game.save(); } });
      body.replaceChildren(...[
        h('div.row', null, nameIn, h('span.pill', null, c.sex === 'M' ? '♂ Erkek' : '♀ Dişi')),
        h('div.row.wrap-r', { style: { margin: '6px 0' } }, h('span.pill', null, c.breed().name), h('span.pill', null, `${Math.floor(c.ageDays())} gün · ${c.stage()}`), h('span.pill', null, '💰 ' + fmt(c.value()))),
        h('div.meters', null, meter('Sağlık', hp, hp < 45 ? '.bad' : hp < 70 ? '.warn' : ''), meter('Stres', Math.max(c.stress, c.envStress || 0) * 100, Math.max(c.stress, c.envStress || 0) > 0.6 ? '.bad' : Math.max(c.stress, c.envStress || 0) > 0.3 ? '.warn' : ''), meter('Akrabalık', F * 100, F > 0.12 ? '.bad' : F > 0.05 ? '.warn' : '')),
        c.dis ? h('div.locked', { style: { color: 'var(--bad)', marginBottom: '8px' } }, h('div.sp', null, `🤒 ${DISEASES[c.dis.id].name} · şiddet %${Math.round(c.dis.sev * 100)}`, h('div.tiny.muted', null, DISEASES[c.dis.id].why)), h('button.btn.sm', { onclick: () => { UI.closeTop(); setTimeout(() => UI.openWater(), 350); } }, 'Tedavi')) : null,
        p.metalDouble ? h('div.locked', { style: { color: 'var(--warn)', marginBottom: '8px' } }, '⚠ Çift kopya Metal geni sağlığı ve doğurganlığı düşürür.') : null,
        h('h4', { style: { margin: '12px 0 6px' } }, 'Özellikler'),
        h('div.kv', null, h('span', null, 'Gövde rengi'), h('span', null, BODY[p.body].name), h('span', null, 'Kuyruk tipi'), h('span', null, TAILS[p.tail].name),
          h('span', null, 'Kuyruk rengi'), h('span', null, c.sex === 'F' ? 'Şeffaf' : TAILCOL[p.tailColor].name + (p.tailColor2 ? ' + ' + TAILCOL[p.tailColor2].name : '')),
          h('span', null, 'Desenler'), h('span', null, c.sex === 'F' ? '—' : pats.join(', ') || 'Yok'),
          h('span', null, 'Boy'), h('span', null, p.size < 0.92 ? 'Küçük' : p.size > 1.12 ? 'Büyük' : 'Orta'),
          h('span', null, 'Renk yoğunluğu'), h('span', null, p.intensity < 0.85 ? 'Soluk' : p.intensity > 1.1 ? 'Canlı' : 'Normal')),
        h('h4', { style: { margin: '14px 0 6px' } }, 'Genotip'),
        c.tested ? h('div.kv', null, Genetics.describe(c.genome).flatMap(([a, b]) => [h('span', null, a), h('span', null, b)]))
          : h('div.locked', null, icon('lock'), h('div.sp', null, 'Genotip gizli. Test, görünmeyen taşıyıcı genleri açığa çıkarır.'), h('button.btn.sm.primary', { onclick: () => { if (Game.testCreature(c)) build(); } }, '40 💰 Test et')),
        c.sex === 'F' && !c.tested ? null : (c.sex === 'F' && Genetics.carried(c.genome).length ? h('div.small.muted', { style: { marginTop: '6px' } }, 'Taşıdığı gizli genler: ' + Genetics.carried(c.genome).join(', ')) : null),
        h('h4', { style: { margin: '14px 0 6px' } }, 'Soy'),
        c.sex === 'F' ? h('div.small.muted', { style: { marginBottom: '6px' } }, c.preg ? `🤰 Gebe · doğuma ${UI.daysLeft(c.preg.due - c.now)}` : 'Gebe değil', c.sperm.length ? ' · Depodaki sperm: ' + c.sperm.map((s) => `${s.name} ×${s.left}`).join(', ') : '') : null,
        c.defect ? h('div.small', { style: { color: 'var(--warn)', marginBottom: '6px' } }, '🩹 Omurga kusuru: sağlık ve değer düşük.') : null,
        h('div.small.muted', null, parents && (parents.s || parents.d) ? `Anne: ${pn(parents.d)} · Baba: ${pn(parents.s)}` : 'Kurucu (ilk nesil)', ` · ${kids} yavru`),
        h('div.row.wrap-r', { style: { marginTop: '16px' } },
          h('button.btn' + (c.fav ? '.primary' : ''), { onclick: () => { c.fav = !c.fav; Game.save(); build(); } }, icon('star'), c.fav ? 'Favori' : 'Favorile'),
          h('button.btn.coral', { onclick: () => UI.confirm(`${c.name} satılsın mı?`, `${fmt(c.value())} Altın Pul kazanacaksın.`, () => { if (Game.sell(c)) rec.close(); }) }, icon('sell'), 'Sat · ' + fmt(c.value())),
          h('button.btn', { onclick: () => UI.openTree(c) }, icon('dna'), 'Soyağacı'),
          h('button.btn', { onclick: () => { Chem.quarantine(c, true); rec.close(); UI.refreshAq(); } }, icon('heart'), 'Karantina'),
          typeof Tanks !== 'undefined' && Tanks.count() > 1 ? h('button.btn', { onclick: () => UI.moveSheet(c, rec) }, icon('tank'), 'Tanka taşı') : null,
          h('button.btn.ghost', { onclick: () => nameIn.focus() }, icon('edit'), 'Adlandır'))].filter(Boolean));
    };
    build();
    const rec = UI.sheet(h('div', null, portrait, body), { cls: fromRect ? 'flip' : '', onClose: () => { pt && pt.stop(); clearInterval(iv); } });
    pt = new Portrait(c, cv); pt.start();
    iv = setInterval(() => { /* yaş / stres canlı güncel */ const m = $('.meters', body); if (m) build(); }, 4000);
    if (fromRect && !Game.S.settings.reduce) {
      requestAnimationFrame(() => { const to = portrait.getBoundingClientRect(); const dx = fromRect.left + fromRect.width / 2 - (to.left + to.width / 2), dy = fromRect.top + fromRect.height / 2 - (to.top + to.height / 2);
        portrait.animate([{ transform: `translate(${dx}px,${dy}px) scale(${fromRect.width / to.width},${Math.max(0.1, fromRect.height / to.height)})`, opacity: 0.4, borderRadius: '40px' }, { transform: 'none', opacity: 1, borderRadius: '20px' }], { duration: 480, easing: 'cubic-bezier(.22,1,.36,1)' }); pt.resize(); });
    } else requestAnimationFrame(() => pt.resize());
    return rec;
  },

  /* ---------- Yeni varyasyon keşfi: sakin ama etkileyici ---------- */
  celebrate(c, breed) {
    const el = $('#celebrate'), r = RARITY[breed.rarity];
    el.className = 'show' + (breed.rarity === 4 ? ' r4' : ''); el.style.setProperty('--c', r.color);
    const cv = h('canvas'), nm = h('div.nm'), fx = h('canvas', { style: { position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 0 } });
    const cp = h('div.cp', null, cv);
    el.replaceChildren(h('div.glow'), fx, h('div.tiny', { style: { letterSpacing: '3px', color: 'var(--muted)' } }, 'YENİ VARYASYON KEŞFEDİLDİ'), cp, nm, h('div', null, UI.rarityPill(breed.rarity)), h('p.muted', { style: { maxWidth: '36ch' } }, breed.blurb), h('button.btn.primary', { onclick: () => UI.closeCelebrate() }, 'Harika!'));
    UI._cel = { pt: new Portrait(c, cv, { big: true }), raf: 0 }; UI._cel.pt.start();
    // isim zarif yazı efektiyle belirir
    let i = 0; const name = breed.name; const typer = setInterval(() => { nm.textContent = name.slice(0, ++i); if (i >= name.length) clearInterval(typer); }, 70); UI._cel.typer = typer;
    // yavaş yükselen parıltılar
    const dpr = Math.min(2, devicePixelRatio || 1), fr = fx.getBoundingClientRect(); fx.width = innerWidth * dpr; fx.height = innerHeight * dpr;
    const sp = Array.from({ length: 40 + breed.rarity * 20 }, () => ({ x: Math.random(), y: 1 + Math.random() * 0.4, v: 0.04 + Math.random() * 0.1, r: 1 + Math.random() * 2.6, h: Math.random() * 360 }));
    let last = performance.now(); const loop = (now) => { if (!el.classList.contains('show')) return; const dt = (now - last) / 1000; last = now; const x = fx.getContext('2d'); x.setTransform(dpr, 0, 0, dpr, 0, 0); x.clearRect(0, 0, innerWidth, innerHeight);
      for (const s of sp) { s.y -= s.v * dt; if (s.y < -0.05) { s.y = 1.05; s.x = Math.random(); } x.fillStyle = breed.rarity === 4 ? `hsla(${(s.h + now / 20) % 360},90%,70%,.8)` : (breed.rarity === 3 ? 'rgba(255,215,120,.8)' : 'rgba(210,255,250,.7)'); x.beginPath(); x.arc(s.x * innerWidth + Math.sin(now / 900 + s.h) * 10, s.y * innerHeight, s.r, 0, TAU); x.fill(); }
      UI._cel.raf = requestAnimationFrame(loop); }; UI._cel.raf = requestAnimationFrame(loop);
    AudioSys.SFX.discover(breed.rarity);
  },
  closeCelebrate() { const el = $('#celebrate'); el.classList.remove('show'); if (UI._cel) { UI._cel.pt.stop(); clearInterval(UI._cel.typer); cancelAnimationFrame(UI._cel.raf); UI._cel = null; } Game.afterCelebrate && Game.afterCelebrate(); },

  /* ---------- Sen Yokken ---------- */
  offlineSummary(info) {
    const rec = UI.sheet(h('div.stack', null, UI.sheetHead('Sen yokken…', { close: () => rec.close() }),
      h('div.card', null, h('div', null, `Tankında ${info.days >= 1 ? info.days.toFixed(1) + ' gün' : Math.round(info.minutes / 60) + ' saat'} geçti.`),
        info.grown ? h('div.small.muted', null, `${info.grown} balık yeni bir büyüme evresine ulaştı.`) : null,
        info.births ? h('div.small', null, `🍼 ${info.births} doğum oldu! Laboratuvar'dan yavruları aç.`) : null,
        h('div.small.muted', null, 'Balıkların güvende; geri dönmen için hiçbir ceza yok. 🌊')),
      h('button.btn.primary', { onclick: () => rec.close() }, 'Devam')));
  },
};

/* Kayıt bozuk ve yedekten de kurtarılamadıysa: çökmeden yeni oyun + ham veriyi kurtarma seçeneği */
Object.assign(UI, {
  corruptSheet(raw) {
    const rec = UI.sheet(h('div.stack', null, h('h3', null, '⚠️ Kayıt okunamadı'), h('p.muted', null, 'Kayıt dosyası bozulmuş ve yedek yuva da kurtarılamadı. Yeni bir oyun başlatıldı. Bozuk veriyi indirip saklayabilirsin; bir geliştirici onarabilir.'),
      h('div.row.wrap-r', null, h('button.btn', { onclick: () => { try { const a = h('a', { href: URL.createObjectURL(new Blob([raw], { type: 'application/json' })), download: 'akvaryum-bozuk-kayit.json' }); document.body.append(a); a.click(); a.remove(); } catch (e) { UI.toast('İndirilemedi', 'bell'); } } }, 'Bozuk veriyi indir'), h('button.btn.primary', { onclick: () => rec.close() }, 'Tamam'))));
  },
});
