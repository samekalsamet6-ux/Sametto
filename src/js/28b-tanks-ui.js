'use strict';
/* 28b · ÇOKLU TANK ARAYÜZÜ — Merkez'de tank kaydırıcısı, Tanklar penceresi, balık taşıma */
Object.assign(UI, {
  tankDot(st) { return ['var(--ok,#3fe0a0)', 'var(--warn,#ffc247)', 'var(--bad,#ff6b6b)'][st] || 'var(--ok,#3fe0a0)'; },
  openTanks() {
    const S = Game.S; Tanks.ensure(S);
    const rec = UI.sheet(h('div.stack'), { cls: 'tanks-sheet' }), box = rec.wrap.querySelector('.sheet > div');
    const draw = () => {
      const shelf = Tanks.shelfInfo(S), rows = S.tanks.map((tk, i) => {
        const act = i === S.activeTank, st = Tanks.status(i), L = Tanks.liters(i), n = Tanks.fishCount(i), cap = tankCapFor(L);
        return h('div.card.row', { style: act ? { borderColor: 'var(--accent)' } : null },
          h('span', { style: { width: '12px', height: '12px', borderRadius: '50%', background: UI.tankDot(st), boxShadow: `0 0 8px ${UI.tankDot(st)}`, flex: 'none' } }),
          h('div.sp', null, h('b', null, tk.name, act ? ' · açık' : ''), h('div.small.muted', null, `${L} L · ${n}/${cap} canlı · ${['su dengede', 'su dikkat ister', 'su kötü'][st]}`)),
          h('button.btn.sm', { onclick: () => { const nn = prompt('Tank adı', tk.name); if (nn) { Tanks.rename(i, nn); draw(); } } }, icon('edit')),
          act ? null : h('button.btn.sm.primary', { onclick: () => { if (Tanks.switchTo(i)) { rec.close(); UI.go('aq'); UI.toast(`${tk.name} açıldı`, 'tank', 2200); } } }, 'Aç'));
      });
      const buyRow = S.tanks.length < S.shelves ? h('button.btn.primary', { onclick: () => { const r = Tanks.buy(); if (!r.ok) return UI.toast(r.why, 'bell'); draw(); UI.toast('Yeni tank kuruldu (20 L, boş). Tasarım Stüdyosu\'nda donat.', 'check', 3500); } }, `＋ Yeni tank kur · ${NEW_TANK_COST} 💰`)
        : shelf ? h('button.btn', { onclick: () => UI.confirm('Yeni raf açılsın mı?', `${shelf.cost} Altın Pul · seviye ${shelf.lvl} gerekir. Yeni bir tank için yer açar.`, () => { const r = Tanks.buyShelf(); if (!r.ok) return UI.toast(r.why, 'bell'); draw(); }) }, `🔒 Yeni raf · ${shelf.cost} 💰 · sev. ${shelf.lvl}`) : h('div.small.muted', null, 'Tüm raflar açık.');
      box.replaceChildren(UI.sheetHead('Tanklarım', { close: () => rec.close() }), h('div.small.muted', null, 'Her tank ayrı su, bitki ve canlılara sahiptir. Başka tanka geçince aradaki süre kadar ilerleme (en çok 8 gün) işlenir.'), ...rows, buyRow);
    };
    draw();
  },
  moveSheet(c, parent) {
    const S = Game.S, list = S.tanks.map((tk, i) => ({ tk, i })).filter(({ i }) => i !== S.activeTank);
    const rec = UI.sheet(h('div.stack', null, UI.sheetHead(`${c.name}: hangi tanka?`, { close: () => rec.close() }), h('div.small.muted', null, 'Su değerleri çok farklıysa balık şok geçirir (sağlığı düşer).'),
      ...list.map(({ tk, i }) => { const L = Tanks.liters(i), n = Tanks.fishCount(i), full = n >= tankCapFor(L), sc = tk.water ? Tanks.shockScore(Chem.w, tk.water) : 0;
        return h('div.card.row', null, h('div.sp', null, h('b', null, tk.name), h('div.small.muted', null, `${L} L · ${n}/${tankCapFor(L)} canlı · su farkı ${sc < 1.5 ? 'küçük' : sc < 3 ? 'orta' : 'BÜYÜK (şok riski)'}`)),
          h('button.btn.sm.primary', { disabled: full ? true : null, onclick: () => UI.confirm(`${c.name} ${tk.name} tankına taşınsın mı?`, sc > 3 ? 'Su farkı büyük: balık şok geçirebilir.' : 'Su değerleri yakın, sorun beklenmiyor.', () => { const r = Tanks.transfer(c, i); if (!r.ok) return UI.toast(r.why, 'bell'); rec.close(); parent && parent.close(); UI.refreshAq && UI.refreshAq(); }) }, full ? 'Dolu' : 'Taşı')); })));
  },
});

/* Merkez: tank kaydırıcısı (etkin tank canlı önizleme, diğerleri son görüntü) */
UI.render_hub = ((orig) => function (el) {
  const r = orig.apply(this, arguments), S = Game.S; Tanks.ensure(S); const card = el.querySelector('.tank-card'); if (!card) return r;
  const ph = document.createElement('div'); card.replaceWith(ph);
  const act = Tanks.active(S), h3 = card.querySelector('h3'); if (h3) h3.textContent = act.name; const dot = card.querySelector('.dot'); if (dot) dot.style.background = UI.tankDot(Tanks.status(S.activeTank));
  const cards = S.tanks.map((tk, i) => {
    if (i === S.activeTank) return card;
    const img = tk.thumb ? h('img', { src: tk.thumb, alt: tk.name, style: { width: '100%', height: '100%', objectFit: 'cover', display: 'block' } }) : h('div', { style: { height: '100%', background: 'linear-gradient(#1b6f8a,#0a3044)' } });
    return h('div.tank-card.alt', { role: 'button', tabindex: 0, onclick: () => { if (Tanks.switchTo(i)) UI.go('aq'); } }, h('div.tc-img', null, img), h('div.meta', null, h('div', { style: { flex: 1 } }, h('h3', null, tk.name), h('div.small.muted', null, `${Tanks.liters(i)} L · ${Tanks.fishCount(i)} canlı`)), h('span.dot', { style: { background: UI.tankDot(Tanks.status(i)) } })));
  });
  const shelf = Tanks.shelfInfo(S);
  const add = h('div.tank-card.alt.add', { role: 'button', tabindex: 0, onclick: () => UI.openTanks() }, h('div', { style: { fontSize: '34px', textAlign: 'center', padding: '22px 0 4px' } }, S.tanks.length < S.shelves ? '＋' : '🔒'), h('div.small.muted', { style: { textAlign: 'center', paddingBottom: '14px' } }, S.tanks.length < S.shelves ? `Yeni tank kur · ${NEW_TANK_COST} 💰` : shelf ? `Yeni raf · ${shelf.cost} 💰 · sev. ${shelf.lvl}` : 'Tüm raflar açık'));
  const slider = h('div.tank-slider', null, ...cards, add);
  ph.replaceWith(h('div', null, h('div.row', { style: { margin: '0 2px 4px' } }, h('div.sp.small.muted', null, S.tanks.length > 1 ? 'Kaydır: diğer tanklar · karta dokun: aç' : 'Tankını kur; raf açıp yeni tanklar ekleyebilirsin.'), h('button.btn.sm', { onclick: () => UI.openTanks() }, icon('tank'), 'Tanklarım')), slider));
  return r;
})(UI.render_hub);

/* Akvaryum bilgi şeridi: tank adı rozeti */
UI.refreshAq = ((orig) => function () {
  const r = orig.apply(this, arguments); const info = $('#aq-info'), S = Game.S;
  if (info && S && S.tanks && S.tanks.length > 1) info.prepend(h('button.chip', { style: { cursor: 'pointer', border: '1px solid var(--accent)' }, onclick: () => UI.openTanks() }, icon('tank'), Tanks.active(S).name));
  return r;
})(UI.refreshAq);
