'use strict';
/* =====================================================================
   19 · TÜRE ÖZEL ARAYÜZ — genel Punnett önizleme, beta üretimi (köpük yuva mini oyunu),
        karides ayıklama, salyangoz yumurta kümeleri
   ===================================================================== */
Object.assign(UI, {
  genericPreview(m, f, P) {
    const out = [], S = SCHEMA[f.species];
    if (m.species !== f.species) out.push(h('div.locked', { style: { color: 'var(--warn)' } }, `Melez: yavrular anne türünde (${SPECIES.find((s) => s.id === f.species).name}) doğar; saf hat bozulur.`));
    if (f.species === 'endler') out.push(h('div.small.muted', null, `Beklenen saflık: %${Math.round(((m.genome.quant.pur ?? (m.species === 'endler' ? 1 : 0)) + (f.genome.quant.pur ?? 1)) / 2 * 100)} (Saf Endler için %90+)`));
    out.push(h('div.small.muted', null, 'Yavru dağılımı'), UI.bar('Erkek', P.male, '#4aa8ff'), UI.bar('Dişi', 1 - P.male, '#ff7ad9'));
    for (const loc of S.auto.slice(0, 2)) { const a = m.genome.auto[loc] || ['–', '–'], b = f.genome.auto[loc], g = Breeding.punnett(a, b);
      out.push(h('div', { style: { margin: '8px 0' } }, h('div.small.muted', null, 'Gen: ' + loc + ' (otozomal)'), h('div.pgrid', null, h('span'), ...a.map((x) => h('b', null, x)), ...g.flatMap((row, i) => [h('b', null, b[i]), ...row.map(([x, y]) => h('span.pc', null, x + '·' + y))])))); }
    out.push(h('h4', { style: { margin: '12px 0 6px' } }, 'Olası ırklar'), h('div.grid2', { style: { gridTemplateColumns: 'repeat(auto-fill,minmax(130px,1fr))' } }, ...P.breeds.slice(0, 8).map(([id, p]) => {
      const b = BREED_BY_ID[id], disc = Game.S.discovered[id], cr = Game.sampleCreature(b.spec), r = RARITY[b.rarity];
      return h('div.dex-tile', { style: { '--c': r.color, cursor: 'default' } }, disc ? UI.thumbCv(cr, 120) : UI.silhouette(cr, 120), h('div.nm', null, disc ? b.name : '???'), h('div.tiny.muted', null, `%${p * 100 < 1 ? '<1' : Math.round(p * 100)}${disc ? '' : ' · yeni olabilir'}`), h('div.rarbar')); })));
    return out;
  },

  /* ---------- Beta: kavanoz + köpük yuva mini oyunu ---------- */
  bettaControls(m, f, el) {
    const S = Game.S, bp = S.bettaPair, same = bp && bp.m === m.id && bp.f === f.id, now = S.clockMin, probs = Breeding.problems(m, f, now).filter((p) => !p.startsWith('Önce kavanozları'));
    if (probs.length) return h('button.btn.primary', { style: { width: '100%', marginTop: '14px' }, disabled: true }, probs[0]);
    if (!same) return h('div.stack', null, h('div.small.muted', null, 'Beta çiftleşmesi: erkek ve dişi kavanozlarda yan yana tutulur (1 oyun günü); sonra salıverilir ve erkek köpük yuva yapar.'), h('button.btn.primary', { onclick: () => { S.bettaPair = { m: m.id, f: f.id, t0: now, ready: false }; UI.toast('Kavanozlar yan yana: 1 gün sonra salıverebilirsin', 'heart'); Game.save(); UI.render_lab(el); } }, icon('heart'), 'Kavanozları yan yana koy'));
    if (now - bp.t0 < 1440) return h('div.card', null, h('b', null, 'Kavanozlar yan yana…'), h('div.small.muted', null, `Salıvermeye ${UI.daysLeft(bp.t0 + 1440 - now)} var`), h('div.pbar', { style: { marginTop: '6px' } }, h('i', { style: { width: (100 * (now - bp.t0) / 1440) + '%' } })));
    bp.ready = true;
    return h('button.btn.primary', { style: { width: '100%', marginTop: '14px' }, onclick: () => UI.bettaGame((q) => { if (Game.mate(m, f, q)) { S.bettaPair = null; UI.render_lab(el); } }) }, icon('heart'), 'Salıver — köpük yuva');
  },
  bettaGame(cb) {
    let hits = 0, round = 0, pos = 0, dir = 1, raf = 0, last = performance.now(), done = false;
    const zone = h('div', { style: { position: 'absolute', left: '40%', width: '20%', top: 0, bottom: 0, background: 'rgba(76,214,148,.55)', borderRadius: '8px' } }), mk = h('div', { style: { position: 'absolute', top: '-6px', width: '8px', bottom: '-6px', background: '#fff', borderRadius: '4px', boxShadow: '0 0 8px #000' } });
    const bar = h('div', { style: { position: 'relative', height: '34px', background: 'rgba(255,255,255,.12)', borderRadius: '10px', margin: '14px 4px' } }, zone, mk), info = h('div.small.muted', null, 'Erkek dişiye sarılırken (beta "kucaklaması") doğru anda dokun! 3 deneme.');
    const btn = h('button.btn.primary', { style: { width: '100%', minHeight: '56px', fontSize: '18px' }, onclick: () => { if (done) return; const ok = Math.abs(pos - 0.5) < 0.1; if (ok) hits++; round++; info.textContent = (ok ? '💚 Mükemmel sarılma!' : '💨 Kaçırdın…') + ` (${round}/3)`; AudioSys.SFX[ok ? 'coin' : 'tick'](); if (round >= 3) { done = true; cancelAnimationFrame(raf); setTimeout(() => { rec.close(); const q = 0.4 + 0.2 * hits; UI.toast(`Yumurtalar döküldü! Kalite %${Math.round(q * 100)}`, 'heart', 3500); cb(q); }, 700); } } }, 'Sarıl!');
    const rec = UI.sheet(h('div.stack', null, UI.sheetHead('🫧 Köpük yuva', { close: () => { done = true; cancelAnimationFrame(raf); rec.close(); } }), info, bar, btn));
    const loop = (now) => { if (done) return; const dt = (now - last) / 1000; last = now; pos += dir * dt * (0.9 + round * 0.35); if (pos > 1) { pos = 1; dir = -1; } if (pos < 0) { pos = 0; dir = 1; } mk.style.left = `calc(${pos * 100}% - 4px)`; raf = requestAnimationFrame(loop); }; raf = requestAnimationFrame(loop);
  },

  /* ---------- Türe özel Laboratuvar kartları ---------- */
  cullT: 0.4,
  speciesExtras(sp, el) {
    const S = Game.S, out = [], t = Game.tank;
    if (sp === 'betta') out.push(h('div.card', null, h('b', null, '🫧 Beta üretimi'), h('div.small.muted', null, 'Beta erkekleri aynı tankta tutulamaz; ikinci erkek otomatik kavanoza alınır. Üretim: çifti seç → kavanozları yan yana koy → 1 gün bekle → köpük yuva mini oyunu. Yumurta kalitesi ve su kalitesi yavru hayatta kalmasını belirler; larvalar ilk günlerde çok hassastır.')));
    if (sp === 'shrimp') {
      const list = (S.qFish || []).concat(t.creatures).filter((c) => c.species === 'shrimp' && !c.preg && c.pheno.dens < this.cullT), pay = (c) => Math.max(2, Math.floor(c.value() * 0.5));
      out.push(h('div.card', null, h('b', null, '✂ Ayıklama (culling)'), h('div.small.muted', null, 'Düşük kaliteli (renk yoğunluğu az) karidesleri üretimden çıkar; hat kalitesi yükselir.'), h('div.seg', { style: { margin: '8px 0' } }, ...[[0.35, 'C altı'], [0.55, 'B altı'], [0.78, 'A altı']].map(([v, l]) => h('button' + (this.cullT === v ? '.on' : ''), { onclick: () => { UI.cullT = v; UI.render_lab(el); } }, l))),
        h('div.row', null, h('div.sp.small', null, `${list.length} karides ayıklanır · ≈ ${list.reduce((a, c) => a + pay(c), 0)} 💰`), h('button.btn.coral.sm', { disabled: list.length ? null : true, onclick: () => UI.confirm(`${list.length} karides ayıklansın mı?`, 'Geri alınamaz.', () => { let tot = 0; for (const c of list) { tot += pay(c); Game.dropCreature(c); } Game.addCoins(tot, true); Game.ev('sold', list.length); S.stats.sold += list.length; Game.addXp(list.length); UI.toast(`${list.length} karides ayıklandı: +${tot} 💰`, 'coin'); UI.render_lab(el); }) }, 'Ayıkla'))));
    }
    if (sp === 'snail') out.push(h('div.card', null, h('b', null, '🥚 Yumurta kümeleri'), h('div.small.muted', null, 'Gizemli salyangoz yumurtalarını su üstüne bırakır; 14 günde açılır. Çok üremesin istersen kümeyi temizle.'), ...(t.clutches || []).map((cl) => h('div.row', { style: { margin: '6px 0' } }, h('div.sp.small', null, `${cl.damName} · ~${cl.n} yumurta · açılmaya ${UI.daysLeft(cl.due - S.clockMin)}`), h('button.btn.sm', { onclick: () => { t.clutches.splice(t.clutches.indexOf(cl), 1); UI.render_lab(el); } }, 'Temizle'))), (t.clutches || []).length ? null : h('div.small.muted', null, 'Şu an küme yok.')));
    return out;
  },
});
