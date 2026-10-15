'use strict';
/* =====================================================================
   13b · TASARIM STÜDYOSU — aquascape editörü
   Modlar: Tank · Zemin (fırça) · Taş&Kök · Bitki · Ekipman · Dekor
   Seç/taşı/döndür/ölçekle/katmanla/kopyala/sil, geri al/yinele (40 adım),
   ızgara + altın oran/üçler kılavuzu, "su doldur" önizlemesi, şablonlar.
   ===================================================================== */
const Editor = {
  undo: new UndoStack(), mode: 'tank', sel: null, placing: null, grid: false, guides: 'none', dry: false, plantFilter: 'all',
  brush: { mode: 'raise', r: 70, k: 0.6 }, drag: null, hover: null, built: false, stroke: false, dirty: 0,

  get S() { return Game.S; }, get sc() { return Game.tank.scape; }, get tank() { return Game.tank; },

  /* ---------- kurulum ---------- */
  build() {
    if (this.built) return; this.built = true;
    const el = $('#s-design');
    el.replaceChildren(h('canvas#dtank', { 'aria-label': 'Tasarım sahnesi' }), h('div.ed-top#ed-top'), h('div.ed-sel.hidden#ed-sel'), h('div.ed-drawer#ed-drawer'));
    this.dvp = Game.dvp = new Viewport($('#dtank'), Game.tank, {
      down: (p) => this.down(p), move: (p) => this.move(p), up: (p, e, moved) => this.up(p, moved), tap: (p) => this.tap(p), hover: (p) => { this.hover = p; }, cancel: () => { this.drag = null; this.stroke = false; },
    });
    document.addEventListener('keydown', (e) => {
      if (UI.cur !== 'design' || UI.sheets.length || /input|textarea|select/i.test(e.target.tagName || '')) return;
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') { e.preventDefault(); e.shiftKey ? this.redo() : this.doUndo(); }
      else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') { e.preventDefault(); this.redo(); }
      else if (e.key === 'Delete' || e.key === 'Backspace') this.remove();
      else if (e.key === 'Escape') { this.placing = null; this.sel = null; this.refresh(); }
    });
  },

  enter() { this.build(); this.sel = null; this.placing = null; this.dvp.resize(); this.refresh(); },
  render() {
    if (!this.dvp) return; const S = this.dvp;
    if (this.stroke && this.tank.rev === this.dirty) { /* fırça */ }
    S.render({ reduce: Game.S.settings.reduce, low: Game.low, design: true, dry: this.dry || !!this.sc.dry, fishAlpha: 0.28, after: (ctx) => this.overlay(ctx) });
  },

  /* ---------- anlık görüntü / geri al ---------- */
  snap() { return { sc: Scape.clone(this.sc), coins: this.S.coins }; },
  commit() { this.undo.push(this.snap()); },
  restore(s) { if (!s) return; this.S.scape = s.sc; this.S.coins = s.coins; this.tank.setScape(s.sc); this.sel = null; UI.refreshTop(); this.refresh(); },
  doUndo() { this.restore(this.undo.undo(this.snap())); }, redo() { this.restore(this.undo.redo(this.snap())); },
  changed() { this.tank.touch(); Game.markScapeChanged && Game.markScapeChanged(); },

  /* ---------- hesaplar ---------- */
  free(def) { return Game.S.level >= (def.lvl || 1) || Progress.level(Game.S.xp) >= (def.lvl || 1); },
  lvl() { return Progress.level(Game.S.xp); },
  canBuy(def) { if ((this.placing && this.placing.k === 'plant' && (this.S.gift || []).includes(this.placing.d))) return true; if (def === EQUIP.co2.tank && !Research.has('co2')) { UI.toast('Önce "Basınçlı CO₂" araştırmasını aç', 'lock'); return false; } if (this.lvl() < (def.lvl || 1)) { UI.toast(`Seviye ${def.lvl} gerekli`, 'lock'); return false; } if (this.S.coins < (def.cost || 0)) { UI.toast(`Yeterli Altın Pul yok (${def.cost})`, 'coin'); return false; } return true; },
  pay(n) { this.S.coins -= n; UI.refreshTop(); },

  /* ---------- işaretçi ---------- */
  world(p) { return this.dvp.toWorld(p.x, p.y); },
  snapV(v, step) { return this.grid ? Math.round(v / step) * step : v; },

  down(p) {
    const w = this.world(p);
    if (this.placing) { this.hover = p; return true; }              // basılı tut + sürükle: hayalet parmağı izler, bırakınca yerleşir
    if (this.mode === 'sub') { this.commit(); this.stroke = true; this.paint(w); return true; }
    const it = Scape.hit(this.sc, this.tank.W, w.x, w.y);
    if (it) { this.sel = it.id; this.drag = { it, moved: false, snap: this.snap() }; this.refresh(); return true; }
    if (this.sel) { this.sel = null; this.refresh(); }
    return false;
  },
  move(p) {
    const w = this.world(p);
    if (this.placing) { this.hover = p; return; }
    if (this.stroke) { this.paint(w); return; }
    const d = this.drag; if (!d) return; if (!d.moved) { d.moved = true; this.undo.push(d.snap); }
    this.moveItem(d.it, w);
  },
  up(p) { if (this.placing && p) { this.hover = p; this.place(this.world(p)); return; }
    this.stroke = false; if (this.drag) { const it = this.drag.it; if (it.gnd === false && !it.att && Scape.isHard(it)) { const g = this.tank.ground(it.fx * this.tank.W); if (it.y > g - 6) { it.gnd = true; it.y = undefined; } } this.drag = null; this.changed(); this.updateSel(); } },
  tap(p) {
    const w = this.world(p);
    if (this.placing) return this.place(w);
    const it = Scape.hit(this.sc, this.tank.W, w.x, w.y); this.sel = it ? it.id : null; this.refresh();
  },

  moveItem(it, w) {
    const W = this.tank.W, def = Scape.defOf(it);
    if (it.k === 'plant' && def.type === 'epi') {            // epifit: yalnızca taş/kök üzerinde gezer
      const host = this.hostAt(w, it); if (!host) return;
      const hp = Scape.pos(this.sc, W, host), c = Math.cos(-hp.r), s = Math.sin(-hp.r), dx = w.x - hp.x, dy = w.y - hp.y, hd = Scape.defOf(host);
      const lx = (dx * c - dy * s) / hp.s * hp.fl, ly = (dx * s + dy * c) / hp.s;
      it.att = { id: host.id, ox: clamp(lx, -hd.w * 0.4, hd.w * 0.4), oy: clamp(ly, -hd.h * 0.95, -hd.h * 0.15) }; it.gnd = false; it.fx = host.fx; this.tank.touch(); return;
    }
    it.fx = clamp(this.snapV(w.x, 20) / W, 0.01, 0.99);
    if (Scape.isHard(it) && it.k !== 'leaf') { const g = this.tank.ground(it.fx * W); const y = clamp(this.snapV(w.y, 20), SURFACE + 90, g + 10); if (y < g - 8) { it.gnd = false; it.y = y; } else { it.gnd = true; } }
    this.tank.touch();
  },
  hostAt(w, self) {
    const W = this.tank.W, order = Scape.drawOrder(this.sc, W).reverse();
    for (const h_ of order) { if (h_ === self || !(h_.k === 'rock' || h_.k === 'wood')) continue; const def = Scape.defOf(h_), p = Scape.pos(this.sc, W, h_), c = Math.cos(-p.r), s = Math.sin(-p.r), dx = w.x - p.x, dy = w.y - p.y, lx = (dx * c - dy * s) / p.s, ly = (dx * s + dy * c) / p.s; if (Math.abs(lx) < def.w * 0.55 && ly > -def.h * 1.05 && ly < 8) return h_; }
    return null;
  },

  paint(w) {
    const sc = this.sc, W = this.tank.W, b = this.brush, h_ = sc.sub.h, r = b.r;
    const src = h_.slice();
    for (let i = 0; i < SUB_COLS; i++) {
      const cx = (i / (SUB_COLS - 1)) * W, d = Math.abs(cx - w.x); if (d > r) continue; const k = Math.pow(1 - d / r, 1.4) * b.k;
      if (b.mode === 'raise') h_[i] = clamp(h_[i] + 0.05 * k, 0, 1); else if (b.mode === 'lower') h_[i] = clamp(h_[i] - 0.05 * k, 0, 1);
      else { const a = (src[Math.max(0, i - 1)] + src[i] + src[Math.min(SUB_COLS - 1, i + 1)]) / 3; h_[i] = lerp(h_[i], a, 0.5 * k); }
    }
    this.tank.touch();
  },

  /* ---------- yerleştirme / düzenleme ---------- */
  place(w) {
    const p = this.placing, def = p.k === 'plant' ? PLANTS[p.d] : p.k === 'decor' ? DECOR[p.d] : HARDSCAPE[p.d], W = this.tank.W;
    if (!this.canBuy(def)) { this.placing = null; this.refresh(); return; }
    const ex = {}; let fx = clamp(this.snapV(w.x, 20) / W, 0.02, 0.98);
    if (p.k === 'plant' && def.type === 'epi') {
      const host = this.hostAt(w, null); if (!host) { UI.toast('Epifitler taş veya köke bağlanır — bir taşa/köke dokun', 'bell'); return; }
      const hp = Scape.pos(this.sc, W, host), c = Math.cos(-hp.r), s = Math.sin(-hp.r), dx = w.x - hp.x, dy = w.y - hp.y, hd = Scape.defOf(host);
      ex.att = { id: host.id, ox: clamp((dx * c - dy * s) / hp.s * hp.fl, -hd.w * 0.4, hd.w * 0.4), oy: clamp((dx * s + dy * c) / hp.s, -hd.h * 0.95, -hd.h * 0.15) }; ex.gnd = false; fx = host.fx;
    }
    this.commit(); const gi = (this.S.gift || []).indexOf(p.d); if (gi >= 0 && p.k === 'plant') this.S.gift.splice(gi, 1); else this.pay(def.cost || 0);
    const it = Scape.newItem(this.sc, p.k, p.d, fx, Object.assign(ex, p.k === 'plant' ? { g: 0.45, t: this.S.clockMin } : {}));
    if (p.k !== 'plant' && p.k !== 'leaf') { const g = this.tank.ground(fx * W); if (w.y < g - 20 && Scape.isHard(it)) { it.gnd = false; it.y = clamp(w.y, SURFACE + 90, g); } }
    this.sc.items.push(it); this.sel = it.id; this.changed(); it.k === 'plant' ? AudioSys.SFX.plant() : AudioSys.SFX.rock(); Game.task('scape'); this.refresh();
  },
  selItem() { return this.sel ? this.sc.items.find((i) => i.id === this.sel) : null; },
  act(fn) { const it = this.selItem(); if (!it) return; this.commit(); fn(it); this.changed(); this.refresh(); },
  remove() {
    const it = this.selItem(); if (!it) return; this.commit(); const refund = Math.floor(Scape.cost(it) * 0.5);
    this.sc.items = this.sc.items.filter((i) => i !== it && !(i.att && i.att.id === it.id)); this.S.coins += refund; UI.refreshTop(); this.sel = null; this.changed(); this.refresh(); if (refund) UI.toast(`+${refund} Altın Pul iade`, 'coin', 1500);
  },
  duplicate() {
    const it = this.selItem(); if (!it) return; const def = Scape.defOf(it); if (!this.canBuy(def)) return; this.commit(); this.pay(def.cost || 0);
    const c = Scape.newItem(this.sc, it.k, it.d, clamp(it.fx + 0.06, 0.02, 0.98), { s: it.s, r: it.r, z: it.z, y: it.y, gnd: it.gnd, g: it.g, att: it.att ? { ...it.att, ox: it.att.ox + 14 } : null });
    this.sc.items.push(c); this.sel = c.id; this.changed(); this.refresh();
  },

  /* ---------- ekipman / tank / zemin ---------- */
  buyOpt(def, owned, set) { if (owned) return set(); if (!this.canBuy(def)) return; this.commit(); this.pay(def.cost || 0); set(true); this.changed(); this.refresh(); },
  setSub(key, val) { this.commit(); this.sc.sub[key] = val; this.changed(); this.refresh(); },
  applyTemplate(tpl) {
    UI.confirm('Şablon uygulansın mı?', 'Mevcut aquascape\'in silinir (balıkların kalır).', () => {
      this.commit(); const sc = tpl.scape ? Scape.clone(tpl.scape) : Scape.fromTemplate(tpl.key, Math.floor(R.next() * 1000));
      sc.owned = Object.assign({ filter: {}, co2: {}, heater: 1, light: 1, air: 1 }, this.sc.owned); for (const k in sc.owned.filter) { /* korunur */ }
      if (sc.equip.filter) sc.owned.filter[sc.equip.filter] = 1; if (sc.equip.co2 && sc.equip.co2 !== 'none') sc.owned.co2[sc.equip.co2] = 1;
      sc.nid = Math.max(sc.nid, 1); this.S.scape = sc; this.tank.setScape(sc); this.sel = null; this.changed(); this.refresh(); UI.toast('Şablon uygulandı', 'brush');
    });
  },
  saveTemplate() {
    const inp = h('input', { type: 'text', placeholder: 'Tasarımın adı', maxlength: 24 }), rec = UI.sheet(h('div.stack', null, UI.sheetHead('Şablon olarak kaydet', { close: () => rec.close() }), inp,
      h('button.btn.primary', { onclick: () => { const n = inp.value.trim() || `Tasarımım ${this.S.templates.length + 1}`; this.S.templates.push({ name: n, scape: Scape.clone(this.sc) }); Game.save(); rec.close(); UI.toast('Şablon kaydedildi', 'save'); this.refresh(); } }, 'Kaydet')));
  },

  /* ---------- kılavuz / seçim katmanı ---------- */
  overlay(ctx) {
    const W = this.tank.W, H = this.tank.H, z = this.dvp.cam.zoom;
    ctx.save(); ctx.lineWidth = 1 / z;
    if (this.grid) { ctx.strokeStyle = 'rgba(255,255,255,.14)'; for (let x = 0; x <= W; x += 20) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); } for (let y = 0; y <= H; y += 20) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); } }
    if (this.guides !== 'none') {
      const f = this.guides === 'thirds' ? [1 / 3, 2 / 3] : [0.382, 0.618]; ctx.strokeStyle = 'rgba(255,214,107,.7)'; ctx.setLineDash([8 / z, 6 / z]);
      for (const a of f) { ctx.beginPath(); ctx.moveTo(W * a, 24); ctx.lineTo(W * a, H); ctx.stroke(); ctx.beginPath(); ctx.moveTo(0, H * a); ctx.lineTo(W, H * a); ctx.stroke(); }
      ctx.setLineDash([]); ctx.fillStyle = 'rgba(255,214,107,.9)'; for (const a of f) for (const b of f) { ctx.beginPath(); ctx.arc(W * a, H * b, 5 / z, 0, TAU); ctx.fill(); }
    }
    const it = this.selItem();
    if (it) { const b = this.bbox(it); ctx.save(); ctx.translate(b.x, b.y); ctx.rotate(b.r); ctx.strokeStyle = '#2fd4c6'; ctx.lineWidth = 2 / z; ctx.setLineDash([7 / z, 5 / z]); ctx.strokeRect(-b.w / 2, -b.h, b.w, b.h + 6); ctx.restore(); }
    if (this.placing && this.hover && !this.stroke && this.dvp.cam) { const w = this.world(this.hover); this.ghost(ctx, w); }
    if (this.mode === 'sub' && this.hover) { const w = this.world(this.hover); ctx.strokeStyle = 'rgba(255,255,255,.7)'; ctx.lineWidth = 2 / z; ctx.beginPath(); ctx.ellipse(w.x, this.tank.ground(w.x), this.brush.r, this.brush.r * 0.35, 0, 0, TAU); ctx.stroke(); }
    ctx.restore();
  },
  bbox(it) {
    const def = Scape.defOf(it), p = Scape.pos(this.sc, this.tank.W, it); let w = def.w * p.s, h_ = def.h * p.s;
    if (it.k === 'plant') { h_ = def.type === 'float' ? 28 : def.h * lerp(0.3, 1, it.g ?? 1) * p.s; if (def.type === 'float') return { x: p.x, y: p.y + 14, w, h: 28, r: 0 }; if (def.type === 'carpet') h_ = def.h * 0.6; }
    return { x: p.x, y: p.y, w, h: h_, r: p.r };
  },
  ghost(ctx, w) {
    const p = this.placing; if (!p) return; const fake = { id: -1, k: p.k, d: p.d, fx: clamp(w.x / this.tank.W, 0, 1), s: 1, r: 0, fl: 1, z: 1, seed: 7, g: 1, gnd: false, y: w.y, att: null };
    ctx.save(); ctx.globalAlpha = 0.55;
    if (p.k === 'plant' && PLANTS[p.d].type !== 'epi') fake.gnd = true; if (p.k === 'plant' && PLANTS[p.d].type === 'epi') fake.y = w.y;
    if (p.k !== 'plant' && Scape.isHard(fake)) { const g = this.tank.ground(w.x); if (w.y >= g - 20) fake.gnd = true; }
    this.tank.drawItem(ctx, fake, this.tank.t, 0); ctx.restore();
  },

  /* ---------- arayüz ---------- */
  refresh() { this.drawTop(); this.drawDrawer(); this.updateSel(); },

  drawTop() {
    const top = $('#ed-top'); if (!top) return;
    const b = (ic, label, fn, on, dis) => h('button.icon-btn' + (on ? '.on' : ''), { 'aria-label': label, title: label, disabled: dis ? true : null, onclick: fn }, typeof ic === 'string' && ic.length < 3 ? h('b', null, ic) : icon(ic));
    top.replaceChildren(
      b('undo', 'Geri al', () => this.doUndo(), false, !this.undo.u.length), b('redo', 'Yinele', () => this.redo(), false, !this.undo.r.length),
      b('grid', 'Izgara', () => { this.grid = !this.grid; this.refresh(); }, this.grid),
      b('guide', 'Kılavuz: ' + { none: 'yok', thirds: 'üçler kuralı', golden: 'altın oran' }[this.guides], () => { this.guides = { none: 'thirds', thirds: 'golden', golden: 'none' }[this.guides]; this.refresh(); }, this.guides !== 'none'),
      b('water', 'Su doldur önizlemesi', () => { this.dry = !this.dry; this.refresh(); }, !this.dry),
      h('div.sp'), h('div.chip', null, icon('coin'), fmt(this.S.coins)), b('check', 'Bitti', () => UI.go('aq')));
  },

  updateSel() {
    const bar = $('#ed-sel'); if (!bar) return; const it = this.selItem();
    if (!it) { bar.classList.add('hidden'); return; } bar.classList.remove('hidden');
    const def = Scape.defOf(it), plant = it.k === 'plant', epi = plant && def.type === 'epi';
    const lb = (z) => ['Arka', 'Orta', 'Ön'][Math.floor(z)];
    const mk = (ic, t, fn) => h('button.icon-btn', { 'aria-label': t, title: t, onclick: fn }, typeof ic === 'string' && ic.length < 3 ? h('b', null, ic) : icon(ic));
    bar.replaceChildren(h('b.small', { style: { padding: '0 6px', alignSelf: 'center' } }, def.name),
      !plant ? mk('↺', 'Sola döndür', () => this.act((i) => (i.r -= 0.2))) : null, !plant ? mk('↻', 'Sağa döndür', () => this.act((i) => (i.r += 0.2))) : null,
      mk('−', 'Küçült', () => this.act((i) => (i.s = clamp(i.s * 0.9, 0.4, 2.2)))), mk('+', 'Büyüt', () => this.act((i) => (i.s = clamp(i.s * 1.1, 0.4, 2.2)))),
      mk('⇄', 'Çevir', () => this.act((i) => (i.fl *= -1))),
      !epi && !(plant && def.type === 'float') ? h('button.btn.sm', { onclick: () => this.act((i) => (i.z = (i.z + 1) % 3)) }, 'Katman: ' + lb(it.z)) : null,
      mk('copy', 'Kopyala', () => this.duplicate()), mk('trash', 'Sil', () => this.remove()));
  },

  tabs: [['tank', 'tank', 'Tank'], ['sub', 'layers', 'Zemin'], ['hard', 'rock', 'Taş&Kök'], ['plant', 'leaf', 'Bitki'], ['equip', 'gear', 'Ekipman'], ['decor', 'chest', 'Dekor']],

  drawDrawer() {
    const dr = $('#ed-drawer'); if (!dr) return;
    const tabs = h('div.ed-tabs', null, ...this.tabs.map(([k, ic, l]) => h('button.ed-tab' + (this.mode === k ? '.on' : ''), { onclick: () => { if (this.mode === k) this.collapsed = !this.collapsed; else { this.mode = k; this.collapsed = false; } this.placing = null; this.refresh(); } }, icon(ic), h('span', null, l))));
    const body = h('div.ed-body');
    if (this.placing) body.append(h('div.row', { style: { padding: '4px 2px' } }, h('div.sp', null, h('b', null, 'Yerleştiriliyor: ' + (this.placing.k === 'plant' ? PLANTS[this.placing.d] : this.placing.k === 'decor' ? DECOR[this.placing.d] : HARDSCAPE[this.placing.d]).name), h('div.small.muted', null, this.placing.k === 'plant' && PLANTS[this.placing.d].type === 'epi' ? 'Bir taşa veya köke dokun.' : 'Parmağını basılı tutup sürükle, bıraktığın yere konur. Birden fazla yerleştirebilirsin.')), h('button.btn.primary', { onclick: () => { this.placing = null; this.refresh(); } }, 'Bitti')));
    else if (!this.collapsed) this['tab_' + this.mode](body);
    dr.replaceChildren(...(this.collapsed && !this.placing ? [tabs] : [tabs, body]));
    requestAnimationFrame(() => { $('#s-design').style.setProperty('--drawer-h', dr.offsetHeight + 'px'); if (this.dvp) { this.dvp.inset = dr.offsetHeight + 48 + 6; this.dvp.clamp(); } });
  },

  lockNote(def) { return this.lvl() < (def.lvl || 1) ? `🔒 Sv ${def.lvl}` : (def.cost ? `💰 ${def.cost}` : 'Ücretsiz'); },
  catalogTile(def, k, d, onclick, sub) {
    const cv = this.thumb(k, d), locked = this.lvl() < (def.lvl || 1);
    return h('button.cat' + (locked ? '.lock' : ''), { onclick }, cv, h('b', null, def.name), h('span.tiny.muted', null, sub || this.lockNote(def)));
  },
  _th: new Map(),
  thumb(k, d) {
    const key = k + d; let src = this._th.get(key);
    if (!src) {
      src = document.createElement('canvas'); src.width = src.height = 96; const c = src.getContext('2d');
      if (k === 'plant') {
        const def = PLANTS[d], sc = Math.min(70 / def.h, 84 / (def.w * 1.1)); c.translate(48, 88); c.scale(sc, sc);
        const it = { g: 1, s: 1, seed: 5, stems: 3 }; if (def.type === 'float') c.translate(0, 18);
        Art.drawPlant(c, it, def, 0, 0, { t: 0, flow: 0, ground: () => 0 });
      } else {
        const def = k === 'decor' ? DECOR[d] : HARDSCAPE[d], s = Art.sprite({ k, d, seed: 11 }), sc = Math.min(80 / def.w, 76 / def.h, 1.2);
        c.drawImage(s.cv, 48 - (s.ax / Art.RES) * sc, 90 - (s.ay / Art.RES) * sc, (s.cv.width / Art.RES) * sc, (s.cv.height / Art.RES) * sc);
      }
      this._th.set(key, src);
    }
    const cv = document.createElement('canvas'); cv.width = cv.height = 96; cv.getContext('2d').drawImage(src, 0, 0); return cv;
  },

  tab_tank(body) {
    const sizes = h('div.chips', null, ...TANK_SIZES.map((s) => h('button.sp-chip' + (this.sc.liters === s.l ? '.on' : '') + (this.lvl() < s.lvl ? '.lock' : ''), { onclick: () => { if (this.sc.liters === s.l) return; if (s.l >= 200 && !Research.has('bigtank')) return UI.toast('Önce "Daha büyük tanklar" araştırmasını aç', 'lock'); if (this.lvl() < s.lvl) return UI.toast(`Seviye ${s.lvl} gerekli`, 'lock'); const cheaper = s.l < this.sc.liters; if (!cheaper && !this.canBuy(s)) return; if (cheaper && Game.tank.creatures.length > s.l) return UI.toast('Tankındaki balıklar bu boya sığmaz', 'fish'); this.commit(); if (!cheaper) this.pay(s.cost); this.sc.liters = s.l; this.changed(); this.refresh(); } }, s.name, this.lvl() < s.lvl ? ` 🔒${s.lvl}` : this.sc.liters === s.l ? '' : s.cost && s.l > this.sc.liters ? ` 💰${s.cost}` : '')));
    const bgs = h('div.chips', null, ...Object.entries(BACKDROPS).filter(([k]) => k !== 'aurora' || (this.S.owns || {}).aurora).map(([k, n]) => h('button.sp-chip' + (this.sc.bg === k ? '.on' : ''), { onclick: () => { this.commit(); this.sc.bg = k; this.tank.buildBG(); this.changed(); this.refresh(); } }, n)));
    const tpls = [...Object.keys(TEMPLATES).map((k) => ({ key: k, name: TEMPLATES[k].name, desc: TEMPLATES[k].desc })), ...this.S.templates.map((t, i) => ({ scape: t.scape, name: t.name, desc: 'Kendi tasarımın', own: i }))];
    body.append(h('div.small.muted', null, `Hacim: ${this.sc.liters} L · kapasite ≈ ${tankCap()} balık`), sizes, h('div.small.muted', null, 'Arka plan'), bgs,
      h('div.set-row', null, h('label', null, h('div', null, 'Kuru başlangıç (Dry Start)'), h('div.tiny.muted', null, 'Susuz, nemli ortamda halı bitkileri kökleşir; yosun riski düşük.')), h('button.switch' + (this.sc.dry ? '.on' : ''), { role: 'switch', onclick: () => Chem.dryStart(!this.sc.dry) })),
      h('div.row', { style: { margin: '8px 0 2px' } }, h('b.sp', null, 'Şablonlar'), h('button.btn.sm', { onclick: () => this.saveTemplate() }, icon('save'), 'Tasarımı kaydet')),
      h('div.tpl-row', null, ...tpls.map((t) => h('div.tpl', null, h('b', null, t.name), h('div.tiny.muted', null, t.desc), h('button.btn.sm.primary', { onclick: () => this.applyTemplate(t) }, 'Uygula'), t.own !== undefined ? h('button.btn.sm.ghost', { onclick: () => { this.S.templates.splice(t.own, 1); this.refresh(); } }, 'Sil') : null))));
  },

  tab_sub(body) {
    const types = h('div.chips', null, ...Object.entries(SUBSTRATES).map(([k, s]) => h('button.sp-chip' + (this.sc.sub.type === k ? '.on' : '') + (this.lvl() < s.lvl ? '.lock' : ''), { title: s.desc, onclick: () => { if (this.sc.sub.type === k) return; if (!this.canBuy(s)) return; this.commit(); this.pay(s.cost); this.sc.sub.type = k; if (!s.colors[this.sc.sub.color]) this.sc.sub.color = 'natural'; this.changed(); this.refresh(); } }, s.name, s.cost ? ` 💰${s.cost}` : '')));
    const cols = h('div.chips', null, ...Object.keys(SUBSTRATES[this.sc.sub.type].colors).map((k) => h('button.sp-chip' + (this.sc.sub.color === k ? '.on' : ''), { onclick: () => this.setSub('color', k) }, { natural: 'Doğal', white: 'Beyaz', black: 'Siyah' }[k])));
    const seg = h('div.seg', null, ...[['raise', 'Yükselt'], ['lower', 'Alçalt'], ['smooth', 'Düzle']].map(([k, l]) => h('button' + (this.brush.mode === k ? '.on' : ''), { onclick: () => { this.brush.mode = k; this.refresh(); } }, l)));
    body.append(h('div.small.muted', null, SUBSTRATES[this.sc.sub.type].desc), types, cols, h('b.small', null, 'Fırça — tankta sürükleyerek zemini şekillendir (arkaya doğru yükselen eğim derinlik hissi verir)'), seg,
      h('div.set-row', null, h('label', null, 'Boyut'), h('input', { type: 'range', min: 25, max: 160, value: this.brush.r, style: { maxWidth: '60%' }, oninput: (e) => (this.brush.r = +e.target.value) })),
      h('div.set-row', null, h('label', null, 'Güç'), h('input', { type: 'range', min: 10, max: 100, value: this.brush.k * 100, style: { maxWidth: '60%' }, oninput: (e) => (this.brush.k = e.target.value / 100) })),
      h('button.btn.sm', { onclick: () => { this.commit(); this.sc.sub.h.fill(0.05); this.changed(); } }, 'Zemini düzleştir'));
  },
  tab_hard(body) { body.append(h('div.cat-grid', null, ...Object.entries(HARDSCAPE).map(([d, def]) => this.catalogTile(def, def.kind, d, () => this.pick(def.kind, d, def))))); },
  tab_decor(body) { body.append(h('div.cat-grid', null, ...Object.entries(DECOR).map(([d, def]) => this.catalogTile(def, 'decor', d, () => this.pick('decor', d, def))))); },
  tab_plant(body) {
    const f = this.plantFilter, chips = h('div.chips', null, ...[['all', 'Hepsi'], ...Object.entries(PLANT_LAYERS)].map(([k, l]) => h('button.sp-chip' + (f === k ? '.on' : ''), { onclick: () => { this.plantFilter = k; this.refresh(); } }, l)));
    const list = Object.entries(PLANTS).filter(([, p]) => f === 'all' || (f === 'epi' ? p.type === 'epi' : f === 'float' ? p.type === 'float' : p.layer === f && p.type !== 'epi' && p.type !== 'float'));
    body.append(chips, h('div.cat-grid', null, ...list.map(([d, p]) => this.catalogTile(p, 'plant', d, () => this.pick('plant', d, p), `${'☀'.repeat(p.light)} ${p.co2 === 2 ? 'CO₂!' : p.co2 === 1 ? 'CO₂+' : ''} ${p.cost ? '💰' + p.cost : ''}${this.lvl() < p.lvl ? ' 🔒' + p.lvl : ''}`))));
  },
  pick(k, d, def) { if (this.lvl() < (def.lvl || 1)) return UI.toast(`Seviye ${def.lvl} gerekli`, 'lock'); this.placing = { k, d }; this.sel = null; this.refresh(); },

  tab_equip(body) {
    const e = this.sc.equip, o = this.sc.owned, row = (title, ...els) => h('div', { style: { margin: '6px 0' } }, h('div.small.muted', null, title), h('div.chips', null, ...els));
    const opt = (def, on, label, fn, ownedFlag) => h('button.sp-chip' + (on ? '.on' : '') + (this.lvl() < (def.lvl || 1) ? '.lock' : ''), { onclick: fn }, label + (ownedFlag || !def.cost ? '' : ` 💰${def.cost}`) + (this.lvl() < (def.lvl || 1) ? ` 🔒${def.lvl}` : ''));
    const L = e.light;
    body.append(
      row('Filtre', ...Object.entries(EQUIP.filter).map(([k, d]) => opt(d, e.filter === k, d.name, () => this.buyOpt(d, o.filter[k], (b) => { if (b) o.filter[k] = 1; e.filter = k; if (!b) { this.commit(); this.changed(); this.refresh(); } }), o.filter[k]))),
      row('Isıtıcı', ...Object.entries(EQUIP.heater).map(([k, d]) => opt(d, (k === 'on') === !!e.heater, d.name, () => { const on = k === 'on'; if (on && !o.heater) return this.buyOpt(d, false, () => { o.heater = 1; e.heater = true; }); this.commit(); e.heater = on; this.changed(); this.refresh(); }, k === 'none' || o.heater))),
      row('CO₂', ...Object.entries(EQUIP.co2).map(([k, d]) => opt(d, e.co2 === k, d.name, () => this.buyOpt(d, k === 'none' || o.co2[k], (b) => { if (b) o.co2[k] = 1; e.co2 = k; if (!b) { this.commit(); this.changed(); this.refresh(); } }), k === 'none' || o.co2[k]))),
      row('Hava taşı', opt(EQUIP.air, e.air, e.air ? 'Açık' : 'Kapalı', () => { this.commit(); e.air = !e.air; this.changed(); this.refresh(); }, true)),
      h('div.small.muted', { style: { marginTop: '6px' } }, `Işık gücü: ${L.p}% · ${pad2(L.from)}:00–${pad2(L.to)}:00`),
      h('div.set-row', null, h('label', null, 'Güç'), h('input', { type: 'range', min: 20, max: 100, value: L.p, style: { maxWidth: '65%' }, onchange: (ev) => { this.commit(); L.p = +ev.target.value; this.changed(); this.refresh(); } })),
      h('div.set-row', null, h('label', null, 'Açılış saati'), h('input', { type: 'range', min: 0, max: 23, value: L.from, style: { maxWidth: '65%' }, onchange: (ev) => { this.commit(); L.from = +ev.target.value; if (L.to <= L.from) L.to = Math.min(24, L.from + 1); this.changed(); this.refresh(); } })),
      h('div.set-row', null, h('label', null, 'Kapanış saati'), h('input', { type: 'range', min: 1, max: 24, value: L.to, style: { maxWidth: '65%' }, onchange: (ev) => { this.commit(); L.to = Math.max(+ev.target.value, L.from + 1); this.changed(); this.refresh(); } })));
  },
};
