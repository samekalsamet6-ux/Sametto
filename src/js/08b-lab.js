'use strict';
/* =====================================================================
   08b · LABORATUVAR (çiftleştirme + Punnett önizleme), yavru açılışı, soyağacı
   ===================================================================== */
Object.assign(UI, {
  labSel: { m: null, f: null },

  /* ---------- yardımcılar ---------- */
  daysLeft(min) { const d = Math.max(0, min); return d >= 1440 ? `${Math.floor(d / 1440)} gün ${Math.floor((d % 1440) / 60)} sa` : `${Math.floor(d / 60)} sa ${Math.floor(d % 60)} dk`; },
  bar(label, p, color, extra) {
    return h('div', { style: { margin: '5px 0' } }, h('div.row', { style: { fontSize: '13.5px' } }, h('span.sp', null, label), h('b', null, (p * 100 < 1 && p > 0 ? '<1' : Math.round(p * 100)) + '%')),
      h('div.pbar', null, h('i', { style: { width: Math.max(2, p * 100) + '%', background: color || '' } })), extra);
  },
  thumbCv(cr, w = 90) { const cv = h('canvas', { width: w, height: Math.round(w * FishArt.TH / FishArt.TW) }); cv.getContext('2d').drawImage(FishArt.sprite(cr).tex, 0, 0, cv.width, cv.height); return cv; },
  silhouette(cr, w = 90) { const cv = this.thumbCv(cr, w), c = cv.getContext('2d'); c.globalCompositeOperation = 'source-in'; c.fillStyle = 'rgba(0,0,0,.9)'; c.fillRect(0, 0, cv.width, cv.height); cv.style.opacity = '.35'; return cv; },

  /* ---------- Laboratuvar ---------- */
  render_lab(el) {
    const S = Game.S, t = Game.tank, now = S.clockMin, sel = this.labSel;
    if (sel.m && !t.creatures.includes(sel.m)) sel.m = null; if (sel.f && !t.creatures.includes(sel.f)) sel.f = null;
    const males = t.creatures.filter((c) => c.sex === 'M'), females = t.creatures.filter((c) => c.sex === 'F');
    const unrev = Game.unrevealed(), pregs = females.filter((f) => f.preg), stored = females.filter((f) => !f.preg && f.sperm.length);
    const pick = (list, key) => h('div.chips', { style: { flexWrap: 'nowrap' } }, list.length ? list.map((c) => {
      const ok = c.adult(now), r = RARITY[c.rarity()];
      return h('button.pickc' + (sel[key] === c ? '.on' : '') + (ok ? '' : '.dis'), { style: { '--c': r.color }, onclick: () => { if (!ok) return UI.toast(`${c.name} henüz olgun değil (${Math.floor(c.ageDays())}/${MATURE_DAYS} gün)`, 'bell'); sel[key] = sel[key] === c ? null : c; UI.render_lab(el); } },
        UI.thumbCv(c, 84), h('b', null, (c.fav ? '★ ' : '') + c.name), h('span.tiny.muted', null, c.preg ? `🤰 %${Math.round(100 * Breeding.progress(c, now))}` : !ok ? 'Yavru' : c.breed().name));
    }) : h('div.muted.small', { style: { padding: '8px' } }, 'Bu cinsiyetten balığın yok.'));

    const blocks = [];
    blocks.push(h('div.row', { style: { margin: '4px 2px' } }, h('h2.sp', null, 'Üretim Laboratuvarı'), h('span.pill', null, icon('fish'), `${t.creatures.length}/${tankCap()}`)));
    if (unrev.length) blocks.push(h('div.card.glow', null, h('div.row', null, h('div', { style: { fontSize: '34px' } }, '🍼'), h('div.sp', null, h('b', null, `${unrev.length} yeni yavru seni bekliyor`), h('div.small.muted', null, 'Renklerinin ilk kez ortaya çıkma anı!')), h('button.btn.primary', { onclick: () => UI.openReveal() }, 'Aç'))));
    if (pregs.length || stored.length) blocks.push(h('div.card', null, h('h3', { style: { marginBottom: '6px' } }, 'Gebelikler'),
      pregs.map((f) => { const pr = Breeding.progress(f, now), wait = f.preg.start > now;
        return h('div', { style: { margin: '8px 0' } }, h('div.row', null, h('b.sp', null, f.name), h('span.small.muted', null, wait ? 'dinleniyor…' : 'doğuma ' + UI.daysLeft(f.preg.due - now))), h('div.pbar', null, h('i', { style: { width: (pr * 100) + '%' } })), h('div.tiny.muted', null, 'Depodaki sperm: ' + (f.sperm.map((s) => `${s.name} ×${s.left}`).join(', ') || '—'))); }),
      stored.map((f) => h('div.tiny.muted', { style: { margin: '6px 0' } }, `${f.name}: depoda sperm var (${f.sperm.map((s) => `${s.name} ×${s.left}`).join(', ')}) · gebe değil`))));

    blocks.push(h('div.card', null, h('h3', null, '♂ Baba adayı'), pick(males, 'm'), h('h3', { style: { marginTop: '4px' } }, '♀ Anne adayı'), pick(females, 'f')));

    if (sel.m && sel.f) blocks.push(this.pairCard(sel.m, sel.f, el));
    else blocks.push(h('div.card', null, UI.emptyState('🧬', 'Bir çift seç', 'Olgun bir erkek ve bir dişi seçince olası yavruların Punnett önizlemesi burada belirir. Gizli genleri görmek için balıklarını test et.')));
    el.replaceChildren(h('div.wrap.stack', null, ...blocks));
  },

  pairCard(m, f, el) {
    const now = Game.S.clockMin, P = Breeding.preview(m, f), F = P.F, probs = Breeding.problems(m, f, now);
    const fcls = F > 0.125 ? 'bad' : F > 0.05 ? 'warn' : 'ok';
    const out = [];
    out.push(h('div.row', { style: { justifyContent: 'center', gap: '16px' } }, h('div', { style: { textAlign: 'center' } }, UI.thumbCv(m, 110), h('b', null, m.name)), h('div', { style: { fontSize: '26px' } }, '✕'), h('div', { style: { textAlign: 'center' } }, UI.thumbCv(f, 110), h('b', null, f.name))));
    out.push(h('div.row.wrap-r', { style: { margin: '10px 0' } },
      h('span.pill', { style: { borderColor: `var(--${fcls})`, color: `var(--${fcls})` } }, `Akrabalık: ${(F * 100).toFixed(1)}%`),
      f.preg ? h('span.pill', null, '🤰 Dişi gebe: sperm depolar') : null,
      f.sperm.some((s) => s.sire === m.id) ? h('span.pill', null, 'Daha önce eşleşmişler') : null,
      m.pheno.metalDouble || f.pheno.metalDouble ? h('span.pill', { style: { color: 'var(--warn)' } }, '⚠ Çift Metal') : null));
    if (F > 0.05) out.push(h('div.locked', { style: { color: F > 0.125 ? 'var(--bad)' : 'var(--warn)', marginBottom: '8px' } }, `Yakın akraba çiftleşmesi: yavrular daha küçük kalabilir, batın küçülür, omurga kusuru riski ≈ %${Math.min(60, Math.round(180 * F))}.`));
    out.push(h('div.small.muted', { style: { marginBottom: '8px' } }, `Beklenen batın ≈ ${Math.max(2, Math.round(Breeding.litterSize(f) * 0.9))} yavru · yetişkinler yavruların ~%${Math.round((1 - FRY_SURVIVAL) * 100)}'ini yer.`));

    out.push(h('h4', { style: { margin: '10px 0 4px' } }, 'Punnett önizleme'));
    if (!P.known) {
      const need = [m, f].filter((c) => !c.tested);
      out.push(h('div.locked', null, icon('lock'), h('div.sp', null, 'Ebeveynlerin genotipi bilinmiyor; olasılıklar "?" olarak gizli.'), ...need.map((c) => h('button.btn.sm.primary', { onclick: () => { if (Game.testCreature(c)) UI.render_lab(el); } }, `${c.name} · 40 💰`))));
      out.push(h('div.row.wrap-r', { style: { marginTop: '8px' } }, ...['Gövde ?', 'Kuyruk ?', 'Desen ?', 'Irk ?'].map((x) => h('span.pill', null, x))));
    } else {
      const grid = (title, loc, name) => {
        const g = Breeding.punnett(m.genome.auto[loc], f.genome.auto[loc]);
        return h('div', { style: { marginBottom: '10px' } }, h('div.small.muted', null, title),
          h('div.pgrid', null, h('span'), ...m.genome.auto[loc].map((a) => h('b', null, name(a))), ...g.flatMap((row, i) => [h('b', null, f.genome.auto[loc][i] ? name(f.genome.auto[loc][i]) : ''), ...row.map(([a, b]) => h('span.pc', null, name(a) + '·' + name(b)))])));
      };
      out.push(grid('Gövde rengi (otozomal)', 'body', (a) => BODY[a].name.slice(0, 6)), grid('Kuyruk tipi (otozomal)', 'tail', (a) => TAILS[a].name.slice(0, 6)));
      out.push(h('div.small.muted', null, 'Yavru dağılımı'), UI.bar('Erkek yavru', P.male, '#4aa8ff'), UI.bar('Dişi yavru', 1 - P.male, '#ff7ad9'));
      out.push(h('h4', { style: { margin: '10px 0 2px' } }, 'Gövde rengi'), ...P.body.map(([k, p]) => UI.bar(BODY[k].name, p, `hsl(${BODY[k].h},${BODY[k].s}%,${BODY[k].l}%)`)));
      out.push(h('h4', { style: { margin: '10px 0 2px' } }, 'Erkek yavrularda kuyruk rengi'), ...P.tc.map(([k, p]) => UI.bar(TAILCOL[k].name, p, `hsl(${TAILCOL[k].h},${TAILCOL[k].s}%,${TAILCOL[k].l}%)`)));
      if (P.flags.length) out.push(h('div.small.muted', { style: { marginTop: '6px' } }, 'Erkeklerde desen: ' + P.flags.map(([k, p]) => `${({ tux: 'Tuxedo', sb: 'Snake gövde', st: 'Snake kuyruk', grass: 'Grass', mosaic: 'Mozaik', moscow: 'Moscow' })[k]} %${Math.round(p * 100)}`).join(' · ')));
      out.push(h('h4', { style: { margin: '12px 0 6px' } }, 'Olası ırklar'));
      out.push(h('div.grid2', { style: { gridTemplateColumns: 'repeat(auto-fill,minmax(130px,1fr))' } }, ...P.breeds.slice(0, 8).map(([id, p]) => {
        const b = BREED_BY_ID[id], disc = Game.S.discovered[id], cr = Game.sampleCreature(b.spec), r = RARITY[b.rarity];
        return h('div.dex-tile', { style: { '--c': r.color, cursor: 'default' } }, disc ? UI.thumbCv(cr, 120) : UI.silhouette(cr, 120), h('div.nm', null, disc ? b.name : '???'), h('div.tiny.muted', null, `%${p * 100 < 1 ? '<1' : Math.round(p * 100)}${disc ? '' : ' · yeni olabilir'}`), h('div.rarbar'));
      })));
    }
    out.push(h('button.btn.primary', { style: { width: '100%', marginTop: '14px' }, disabled: probs.length ? true : null, onclick: () => { if (Game.mate(m, f)) UI.render_lab(el); } }, icon('heart'), probs.length ? probs[0] : 'Çiftleştir'));
    return h('div.card', null, ...out);
  },

  /* ---------- Yavru açılışı: renkler ilk kez ortaya çıkar ---------- */
  openReveal() {
    const kids = Game.unrevealed(); if (!kids.length) return UI.toast('Açılacak yavru yok', 'fish');
    const seen = new Set(), tiles = [];
    const open = (c, tile) => {
      if (tile.dataset.open) return; tile.dataset.open = 1; const a = Game.adultPreview(c), b = a.breed(), isNew = !Game.S.discovered[b.id] && !seen.has(b.id); seen.add(b.id);
      tile.classList.add('flip'); setTimeout(() => { tile.classList.add('shown'); tile.replaceChildren(...[UI.thumbCv(a, 110), h('div.nm', null, `${c.sex === 'M' ? '♂' : '♀'} ${c.name}`), h('div.tiny', { style: { color: RARITY[b.rarity].color } }, `${RARITY[b.rarity].icon} ${b.name}${isNew ? ' · ✨ Yeni!' : ''}`), c.defect ? h('div.tiny', { style: { color: 'var(--warn)' } }, '🩹 Omurga kusuru') : null].filter(Boolean)); tile.style.setProperty('--c', RARITY[b.rarity].color); AudioSys.SFX.discover(Math.min(2, b.rarity)); }, 160);
    };
    const grid = h('div.grid2', { style: { gridTemplateColumns: 'repeat(auto-fill,minmax(112px,1fr))' } }, ...kids.map((c) => { const tl = h('div.dex-tile.seal', { role: 'button', tabindex: 0, onclick: () => open(c, tl) }, h('div', { style: { fontSize: '40px', padding: '14px 0' } }, '🫧'), h('div.tiny.muted', null, 'Dokun')); tiles.push([c, tl]); return tl; }));
    const rec = UI.sheet(h('div.stack', null, UI.sheetHead(`Yeni yavrular (${kids.length})`, { close: () => rec.close() }), h('div.small.muted', null, `${kids[0].dam ? 'Anne: ' + ((Pedigree.rec[kids[0].dam] || {}).name || '—') : ''} · Her kabarcığı açıp yavrunun yetişkin rengini gör.`), grid,
      h('div.row', null, h('button.btn.sp', { onclick: () => tiles.forEach(([c, t], i) => setTimeout(() => open(c, t), i * 110)) }, 'Hepsini aç'), h('button.btn.primary.sp', { onclick: () => rec.close() }, 'Bitir'))), {
      full: kids.length > 6, onClose: () => { kids.forEach((c) => (c.unrevealed = false)); Game.save(); Game.checkDiscoveries(false); if (UI.cur === 'lab') UI.render_lab($('#s-lab')); UI.refreshAq && UI.refreshAq(); } });
  },

  /* ---------- Soyağacı ---------- */
  treeDepth: 3, treeMode: 'up',
  openTree(c) {
    const rec = UI.sheet(h('div'), { full: true }); const box = rec.wrap.querySelector('.sheet'); let zoom = 1;
    const render = () => {
      const counts = {}; const walk = (id, d) => { if (!id || d > UI.treeDepth) return; counts[id] = (counts[id] || 0) + 1; const r = Pedigree.rec[id]; if (r) { walk(r.s, d + 1); walk(r.d, d + 1); } };
      walk(c.id, 0);
      const node = (id, d) => {
        const r = Pedigree.rec[id], cr = Game.creatureFromRec(id) || (id === c.id ? c : null), col = cr ? RARITY[cr.breed().rarity].color : '#778';
        const nd = h('div.tn' + (counts[id] > 1 ? '.dup' : '') + (id === c.id ? '.me' : ''), { style: { '--c': col }, title: counts[id] > 1 ? 'Ortak ata (akrabalık)' : '' }, cr ? UI.thumbCv(cr, 70) : h('div', { style: { height: '33px' } }, '?'), h('b', null, r ? r.name : '?'), h('span.tiny.muted', null, r ? (r.sex === 'M' ? '♂ ' : '♀ ') + (cr ? cr.breed().name : '') : ''));
        const rr = r || {}; const kids = d < UI.treeDepth && (rr.s || rr.d) ? [rr.s, rr.d].filter(Boolean) : [];
        return h('div.tsub', null, kids.length ? h('div.tpar', null, ...kids.map((k) => node(k, d + 1))) : null, kids.length ? h('div.tline') : null, nd);
      };
      let body;
      if (UI.treeMode === 'up') body = h('div.tree', { style: { zoom } }, node(c.id, 0));
      else {
        const kids = Object.entries(Pedigree.rec).filter(([, r]) => r.s === c.id || r.d === c.id).map(([id, r]) => [+id, r]);
        body = kids.length ? h('div.grid2', { style: { gridTemplateColumns: 'repeat(auto-fill,minmax(110px,1fr))' } }, ...kids.map(([id, r]) => { const cr = Game.creatureFromRec(id); const mate = Pedigree.rec[r.s === c.id ? r.d : r.s]; return h('div.dex-tile', { style: { '--c': cr ? RARITY[cr.breed().rarity].color : '#778', cursor: 'default' } }, cr ? UI.thumbCv(cr, 100) : null, h('div.nm', null, r.name), h('div.tiny.muted', null, (r.sex === 'M' ? '♂ ' : '♀ ') + (cr ? cr.breed().name : '')), h('div.tiny.muted', null, 'Eş: ' + (mate ? mate.name : '—')), h('div.rarbar')); })) : UI.emptyState('🥚', 'Henüz yavrusu yok', 'Laboratuvar\'dan bir eşle çiftleştir.');
      }
      const seg = (opts, cur, fn) => h('div.seg', null, opts.map(([v, l]) => h('button' + (v === cur ? '.on' : ''), { onclick: () => { fn(v); render(); } }, l)));
      box.replaceChildren(UI.sheetHead('Soyağacı · ' + c.name, rec), h('div.row.wrap-r', { style: { marginBottom: '8px' } }, seg([['up', 'Atalar'], ['down', 'Yavrular']], UI.treeMode, (v) => (UI.treeMode = v)),
        UI.treeMode === 'up' ? seg([[2, '2 nesil'], [3, '3'], [4, '4']], UI.treeDepth, (v) => (UI.treeDepth = v)) : null,
        UI.treeMode === 'up' ? h('div.row', null, h('button.icon-btn', { 'aria-label': 'Uzaklaştır', onclick: () => { zoom = Math.max(0.5, zoom - 0.15); render(); } }, '−'), h('button.icon-btn', { 'aria-label': 'Yakınlaştır', onclick: () => { zoom = Math.min(1.8, zoom + 0.15); render(); } }, '+')) : null),
        h('div.small.muted', null, `Akrabalık katsayısı: ${(c.F * 100).toFixed(1)}% · kenar rengi = ırk nadirliği · altın kesik çizgi = ortak ata`),
        h('div.tree-wrap', null, body));
    };
    render();
  },
});
