'use strict';
/* =====================================================================
   09a · GÖRÜNÜM (Viewport) — bir tuvale kamera, yakınlaştırma, sürükleme, iki parmak
   Akvaryum ve Tasarım Stüdyosu aynı sınıfı farklı işleyicilerle kullanır.
   h: { down(p,e)->bool (true: hareketi sen yönet), move(p,e), up(p,e), tap(p), long(p) , wheel? }
   ===================================================================== */
class Viewport {
  constructor(canvas, tank, h = {}) {
    this.cv = canvas; this.tank = tank; this.h = h; this.cam = { cx: 500, cy: 350, zoom: 1 };
    this.cw = 0; this.ch = 0; this.dpr = 1; this.inset = 0; this.parX = 0; this.captured = false;
    new ResizeObserver(() => this.resize()).observe(canvas); this.bind();
  }
  /** inset: alttan kapanan piksel (ör. editör çekmecesi); tank kalan alana sığdırılır. */
  cy0() { return (this.ch - this.inset) / 2; }
  scale() { const t = this.tank; return Math.min(this.cw / t.W, (this.ch - this.inset) / t.H) * this.cam.zoom; }
  clamp() { const c = this.cam, t = this.tank, S = this.scale(), hw = this.cw / (2 * S), hh = this.cy0() / S; c.cx = hw >= t.W / 2 ? t.W / 2 : clamp(c.cx, hw, t.W - hw); c.cy = hh >= t.H / 2 ? t.H / 2 : clamp(c.cy, hh, t.H - hh); }
  toWorld(sx, sy) { const S = this.scale(); return { x: (sx - this.cw / 2) / S + this.cam.cx, y: (sy - this.cy0()) / S + this.cam.cy, S }; }
  toScreen(wx, wy) { const S = this.scale(); return { x: (wx - this.cam.cx) * S + this.cw / 2, y: (wy - this.cam.cy) * S + this.cy0(), S }; }
  resize() {
    const r = this.cv.getBoundingClientRect(); if (r.width < 10 || r.height < 10) return;
    this.dpr = Math.min(2, devicePixelRatio || 1); this.cw = r.width; this.ch = r.height; this.cv.width = Math.round(r.width * this.dpr); this.cv.height = Math.round(r.height * this.dpr);
    const oldW = this.tank.W; this.tank.setAspect(r.width / r.height); if (this.tank.W !== oldW) this.cam.cx *= this.tank.W / oldW;
    this.cam.zoom = Math.max(1, this.cam.zoom); this.clamp();
  }
  setZoom(z, sx, sy) {
    const cam = this.cam, w = this.toWorld(sx, sy); cam.zoom = clamp(z, 1, 3.2);
    const S = this.scale(); cam.cx = w.x - (sx - this.cw / 2) / S; cam.cy = w.y - (sy - this.cy0()) / S; this.clamp();
    this.h.zoomed && this.h.zoomed(cam.zoom);
  }
  render(extra) {
    if (!this.cw) return; this.clamp(); const cam = this.cam;
    this.tank.render(this.cv.getContext('2d'), Object.assign({ cw: this.cw, ch: this.ch, dpr: this.dpr, cx: cam.cx, cy: cam.cy, zoom: cam.zoom, par: this.parX, S: this.scale(), cy0: this.cy0() }, extra));
  }
  bind() {
    const cv = this.cv, ptrs = new Map(); let moved = false, pinch = null, lp = 0, start = null, t0 = 0, owned = false;
    const rel = (e) => { const r = cv.getBoundingClientRect(); return { x: e.clientX - r.left, y: e.clientY - r.top }; };
    cv.addEventListener('pointerdown', (e) => {
      cv.setPointerCapture(e.pointerId); const p = rel(e); ptrs.set(e.pointerId, p);
      if (ptrs.size === 1) {
        moved = false; owned = !!(this.h.down && this.h.down(p, e)); start = { ...p }; t0 = performance.now(); clearTimeout(lp);
        if (this.h.long) lp = setTimeout(() => { if (!moved && ptrs.size === 1) { moved = true; this.h.long(start); } }, 520);
      } else if (ptrs.size === 2) { const [a, b] = [...ptrs.values()]; pinch = { d: Math.hypot(a.x - b.x, a.y - b.y), z: this.cam.zoom }; moved = true; clearTimeout(lp); if (owned && this.h.cancel) this.h.cancel(); owned = false; }
    });
    cv.addEventListener('pointermove', (e) => {
      const p = rel(e), prev = ptrs.get(e.pointerId); this.parX = ((p.x / this.cw) - 0.5) * -14; this.h.hover && this.h.hover(p, e);
      if (!prev) return; ptrs.set(e.pointerId, p);
      if (ptrs.size === 2 && pinch) { const [a, b] = [...ptrs.values()]; this.setZoom(pinch.z * Math.hypot(a.x - b.x, a.y - b.y) / pinch.d, (a.x + b.x) / 2, (a.y + b.y) / 2); return; }
      if (ptrs.size === 1) {
        if (!moved && Math.hypot(p.x - start.x, p.y - start.y) > 8) { moved = true; clearTimeout(lp); if (!owned) cv.classList.add('drag'); }
        if (owned) { this.h.move && this.h.move(p, e); return; }
        if (moved && this.cam.zoom > 1.001) { const S = this.scale(); this.cam.cx -= (p.x - prev.x) / S; this.cam.cy -= (p.y - prev.y) / S; this.clamp(); }
      }
    });
    const up = (e) => {
      const had = ptrs.has(e.pointerId), p = rel(e); ptrs.delete(e.pointerId); clearTimeout(lp); cv.classList.remove('drag'); if (ptrs.size < 2) pinch = null;
      if (had && ptrs.size === 0) { if (owned) { this.h.up && this.h.up(p, e, moved); owned = false; } else if (!moved && performance.now() - t0 < 600) this.h.tap && this.h.tap(start); }
    };
    cv.addEventListener('pointerup', up); cv.addEventListener('pointercancel', up);
    cv.addEventListener('wheel', (e) => { e.preventDefault(); const p = rel(e); this.setZoom(this.cam.zoom * Math.exp(-e.deltaY * 0.0014), p.x, p.y); }, { passive: false });
  }
}
