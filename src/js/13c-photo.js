'use strict';
/* =====================================================================
   13c · FOTOĞRAF MODU — arayüz gizlenir, kamera kaydırılır, filtre / alan derinliği /
   çerçeve; çekimler Profil > Galeri'ye kaydedilir ve PNG olarak indirilebilir.
   ===================================================================== */
const Photo = {
  on: false, filter: 'vivid', dof: false, frame: true,
  FILTERS: { none: ['Doğal', ''], vivid: ['Canlı', 'saturate(1.35) contrast(1.08)'], warm: ['Sıcak', 'sepia(.22) saturate(1.2) hue-rotate(-8deg) brightness(1.05)'], cine: ['Sinematik', 'contrast(1.2) saturate(.85) brightness(.92) hue-rotate(8deg)'] },

  open() {
    if (this.on) return; this.on = true; document.body.classList.add('photo');
    if (Game.cam.zoom < 1.4) Game.setZoom(1.5, Game.cw / 2, Game.ch / 2);
    const ui = h('div#photo-ui'); document.body.append(ui); this.ui = ui; this.draw();
    this._k = (e) => { if (e.key === 'Escape') this.close(); }; document.addEventListener('keydown', this._k);
  },
  close() { if (!this.on) return; this.on = false; document.body.classList.remove('photo'); this.ui && this.ui.remove(); document.removeEventListener('keydown', this._k); },

  draw() {
    const seg = (opts, cur, fn) => h('div.seg', null, opts.map(([v, l]) => h('button' + (v === cur ? '.on' : ''), { onclick: () => { fn(v); this.draw(); } }, l)));
    this.ui.replaceChildren(
      h('div.photo-top', null, h('button.icon-btn', { 'aria-label': 'Kapat', onclick: () => this.close() }, icon('close')), h('div.small', { style: { alignSelf: 'center', textShadow: '0 1px 4px #000' } }, 'Sürükle · yakınlaştır · çek')),
      h('div.photo-bottom', null, seg(Object.entries(this.FILTERS).map(([k, [l]]) => [k, l]), this.filter, (v) => (this.filter = v)),
        h('div.row', { style: { justifyContent: 'center' } }, h('button.sp-chip' + (this.dof ? '.on' : ''), { onclick: () => { this.dof = !this.dof; this.draw(); } }, 'Alan derinliği'), h('button.sp-chip' + (this.frame ? '.on' : ''), { onclick: () => { this.frame = !this.frame; this.draw(); } }, 'Çerçeve')),
        h('button.shutter', { 'aria-label': 'Fotoğraf çek', onclick: () => this.shoot() })));
  },

  /** Ana tuvali filtreyle/DOF ile yeni bir tuvale çizer. */
  render() {
    const src = Game.cvs, W = src.width, H = src.height, cv = document.createElement('canvas'); cv.width = W; cv.height = H; const c = cv.getContext('2d'), f = this.FILTERS[this.filter][1];
    if (this.dof) { c.filter = 'blur(' + Math.max(2, W / 220) + 'px) ' + f; c.drawImage(src, 0, 0); const sharp = document.createElement('canvas'); sharp.width = W; sharp.height = H; const s = sharp.getContext('2d'); s.filter = f || 'none'; s.drawImage(src, 0, 0); s.filter = 'none'; s.globalCompositeOperation = 'destination-in'; const g = s.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.12, W / 2, H / 2, Math.max(W, H) * 0.55); g.addColorStop(0, '#000'); g.addColorStop(0.55, '#000'); g.addColorStop(1, 'rgba(0,0,0,0)'); s.fillStyle = g; s.fillRect(0, 0, W, H); c.filter = 'none'; c.drawImage(sharp, 0, 0); }
    else { c.filter = f || 'none'; c.drawImage(src, 0, 0); c.filter = 'none'; }
    if (this.filter === 'cine') { c.fillStyle = '#000'; const bar = H * 0.07; c.fillRect(0, 0, W, bar); c.fillRect(0, H - bar, W, bar); const g = c.createRadialGradient(W / 2, H / 2, H * 0.3, W / 2, H / 2, H * 0.9); g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(0,0,0,.45)'); c.fillStyle = g; c.fillRect(0, 0, W, H); }
    if (this.frame) { const b = Math.round(W * 0.035); c.fillStyle = '#f4f1ea'; c.fillRect(0, 0, W, b); c.fillRect(0, H - b * 2.4, W, b * 2.4); c.fillRect(0, 0, b, H); c.fillRect(W - b, 0, b, H); c.fillStyle = '#556'; c.font = `${Math.round(b * 0.8)}px sans-serif`; c.textAlign = 'center'; c.fillText(`Akvaryum Üreticisi · Gün ${dayOf(Game.S.clockMin)}`, W / 2, H - b * 0.9); }
    return cv;
  },

  shoot() {
    const flash = h('div.flash'); document.body.append(flash); setTimeout(() => flash.remove(), 400);
    const cv = this.render(), S = Game.S;
    const th = document.createElement('canvas'); th.width = 480; th.height = Math.round(480 * cv.height / cv.width); th.getContext('2d').drawImage(cv, 0, 0, th.width, th.height);
    try { S.gallery.unshift({ t: S.clockMin, src: th.toDataURL('image/jpeg', 0.72), n: `Gün ${dayOf(S.clockMin)} · ${clockStr(S.clockMin)}` }); if (S.gallery.length > 10) S.gallery.length = 10; Game.save(); } catch (e) { /* kota */ }
    cv.toBlob((b) => { if (!b) return; const a = h('a', { href: URL.createObjectURL(b), download: `akvaryum-${Date.now()}.png` }); document.body.append(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 500); }, 'image/png');
    AudioSys.SFX.coin(); UI.toast('Fotoğraf Galeri\'ye kaydedildi', 'camera', 2200); Game.task('photo');
  },
};
