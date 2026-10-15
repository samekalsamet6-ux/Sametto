'use strict';
/* =====================================================================
   38 · TANILAMA — Ayarlar: sürüm bilgisi, "Performans bilgisi" (canlı kare hızı) ve son reklam hatası.
   Sorun bildirirken oyuncu bu değerleri paylaşabilir.
   ===================================================================== */
const Diag = {
  box: null, raf: 0, fr: [], t0: 0,
  on() { return !!(Game.S && Game.S.settings && Game.S.settings.diag); },
  start() {
    if (this.box) return; this.box = h('div', { style: { position: 'fixed', left: '6px', top: 'calc(env(safe-area-inset-top) + 4px)', zIndex: 9990, background: 'rgba(0,0,0,.72)', color: '#7dffb0', font: '11px/1.35 monospace', padding: '4px 7px', borderRadius: '8px', pointerEvents: 'none', whiteSpace: 'pre' } }); document.body.append(this.box);
    let last = performance.now(), acc = 0, n = 0, worst = 0; const loop = (now) => {
      if (!this.box) return; const d = now - last; last = now; acc += d; n++; worst = Math.max(worst, d);
      if (acc >= 1000) { const g = Game.vp, cv = g && g.cv; this.box.textContent = `${(n * 1000 / acc).toFixed(0)} fps · en kötü ${worst.toFixed(0)} ms\nkademe ${Game.gfxTier ?? '-'} (${Game.GFX_DPR[Game.gfxTarget()]}x) · ${cv ? cv.width + '×' + cv.height : '-'}\nekran ${UI.cur} · ${Game.tank.creatures.length} balık${Game.low ? ' · DÜŞÜK GÜÇ' : ''}`; acc = 0; n = 0; worst = 0; }
      this.raf = requestAnimationFrame(loop);
    }; this.raf = requestAnimationFrame(loop);
  },
  stop() { cancelAnimationFrame(this.raf); if (this.box) this.box.remove(); this.box = null; },
  sync() { if (this.on()) this.start(); else this.stop(); },
};
setInterval(() => Diag.sync(), 1500);

UI.render_settings = ((orig) => function (el) {
  const r = orig.apply(this, arguments), w = el.querySelector('.wrap') || el.firstElementChild, S = Game.S; if (!w || !S) return r;
  w.append(h('div.card', null, h('div.row', null, h('div.sp', null, h('b', null, 'Performans bilgisi'), h('div.small.muted', null, 'Ekranın köşesinde canlı kare hızını gösterir. Sorun bildirirken bu değerleri paylaş.')),
    h('button.switch' + (S.settings.diag ? '.on' : ''), { role: 'switch', 'aria-checked': String(!!S.settings.diag), onclick: () => { S.settings.diag = !S.settings.diag; Game.save(); Diag.sync(); UI.render_settings(el); } })),
    h('div.tiny.muted', { style: { marginTop: '8px' } }, `Sürüm: ${window.BUILD_ID || 'dev'}`), Ads.lastErr ? h('div.tiny', { style: { marginTop: '4px', color: 'var(--warn,#ffc247)' } }, 'Son reklam hatası: ' + Ads.lastErr) : null));
  return r;
})(UI.render_settings);
