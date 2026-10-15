'use strict';
/* =====================================================================
   37 · GRAFİK KALİTESİ — Ayarlar: Otomatik (önerilen) / Yüksek / Orta / Düşük.
   Düşük kademeler çizim çözünürlüğünü azaltır; eski telefonlarda akıcılığı artırır.
   ===================================================================== */
UI.render_settings = ((orig) => function (el) {
  const r = orig.apply(this, arguments), w = el.querySelector('.wrap') || el.firstElementChild, S = Game.S; if (!w || !S) return r;
  const cur = S.settings.gfx || 'auto';
  w.append(h('div.card', null, h('div.sp', null, h('b', null, 'Grafik kalitesi'), h('div.small.muted', null, 'Oyun kasıyorsa Orta ya da Düşük seç. Otomatik, kare hızına göre kendi ayarlanır.')),
    h('div.seg', { style: { marginTop: '8px' } }, [['auto', 'Otomatik'], ['high', 'Yüksek'], ['mid', 'Orta'], ['low', 'Düşük']].map(([v, l]) => h('button' + (v === cur ? '.on' : ''), { onclick: () => { S.settings.gfx = v; if (v === 'auto') { Game.gfxTier = 0; Game.ema = 0.016; try { localStorage.removeItem('akv.gfx'); } catch (e) { /* yoksay */ } } Game.applyGfx(); Game.save(); UI.render_settings(el); } }, l)))));
  return r;
})(UI.render_settings);
