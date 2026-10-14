'use strict';
/* =====================================================================
   15b · ANSİKLOPEDİ & BİLGİ MERKEZİ
   Tür Kartı (canlı portre + 7 sekme), Bitki Kartı, Taş/Zemin Kartı,
   Balıkdex/Bitkidex/Taşdex, Genetik Okulu, rehberler, sözlük, SSS
   ===================================================================== */
Object.assign(UI, {
  /* ---------- sözlük bağlantılı metin: [[terim]] ---------- */
  rich(str) {
    const el = h('span'); const re = /\[\[(.+?)\]\]/g; let last = 0, m;
    while ((m = re.exec(str))) { if (m.index > last) el.append(str.slice(last, m.index)); const term = m[1]; el.append(h('button.term', { onclick: (e) => { e.stopPropagation(); UI.openTerm(term); } }, term)); last = m.index + m[0].length; }
    if (last < str.length) el.append(str.slice(last)); return el;
  },
  findTerm(t) { const k = Object.keys(GLOSSARY).find((x) => x.toLowerCase() === t.toLowerCase()); return k || null; },
  openTerm(t) { const k = this.findTerm(t); const rec = UI.sheet(h('div.stack', null, UI.sheetHead(k || t, { close: () => rec.close() }), h('p', null, k ? UI.rich(GLOSSARY[k].replace(/\b(GH|KH|TDS)\b/g, '$1')) : 'Bu terim sözlükte yok.'))); },

  /* ---------- yardımcılar ---------- */
  stars(n) { return '⭐'.repeat(n) + '☆'.repeat(5 - n); },
  paramBar(ideal, tol, ax, val) {
    const [lo, hi] = ax, pc = (x) => clamp((x - lo) / (hi - lo), 0, 1) * 100, tl = pc(tol[0]), th = pc(tol[1]), il = pc(ideal[0]), ih = pc(ideal[1]);
    return h('div.rbar', null, h('i.tol', { style: { left: tl + '%', width: Math.max(0, th - tl) + '%' } }), h('i.ide', { style: { left: il + '%', width: Math.max(0, ih - il) + '%' } }), val != null ? h('b.mk', { style: { left: pc(val) + '%' } }) : null);
  },
  speciesCreature(sp, variant, sex, ageDays) {
    const key = [sp, variant, sex, ageDays].join('|'); this._spc = this._spc || new Map(); let c = this._spc.get(key);
    if (!c) { const b = sp === 'guppy' ? BREEDS[variant % BREEDS.length] : null; if (!b) return null; c = new Creature({ id: -3000000 - this._spc.size, genome: Genetics.make(b.spec, sex, new RNG(9)), bornT: -ageDays * 1440, seed: 777 + variant }); c.now = 0; this._spc.set(key, c); }
    return c;
  },
  tabs(names, cur, fn) { return h('div.chips', null, names.map(([k, l]) => h('button.sp-chip' + (cur === k ? '.on' : ''), { onclick: () => fn(k) }, l))); },

  /* ---------- Ansiklopedi ana ekranı ---------- */
  dexTab: 'fish',
  render_dex(el) {
    const S = Game.S, seen = S.seen || {};
    const fishFound = BREEDS.filter((b) => S.discovered[b.id]).length, plantFound = Object.keys(PLANTS).filter((k) => (seen.plant || {})[k]).length;
    const hardAll = [...Object.keys(HARDSCAPE), ...Object.keys(DECOR), ...Object.keys(SUBSTRATES)], hardFound = hardAll.filter((k) => ((seen.hard || {})[k])).length;
    const total = BREEDS.length + Object.keys(PLANTS).length + hardAll.length, found = fishFound + plantFound + hardFound, pc = Math.round(100 * found / total);
    const ring = (p, label) => h('div.ring', { style: { '--p': p, width: '56px', height: '56px' } }, h('span', { style: { width: '44px', height: '44px', fontSize: '13px' } }, label));
    let body;
    if (this.dexTab === 'fish') {
      body = h('div.stack', null, ...SPECIES.map((s) => { const i = SPECIES_INFO[s.id], open = s.status === 'open', p = open ? Math.round(100 * fishFound / BREEDS.length) : 0;
        return h('div.card.sptile', { role: 'button', tabindex: 0, onclick: () => UI.openSpecies(s.id) }, h('div', { style: { fontSize: '38px' } }, i.emoji), h('div.sp', null, h('b', null, s.name), h('div.small.muted', null, s.sci), h('div.tiny.muted', null, open ? `${fishFound}/${BREEDS.length} varyasyon` : `Seviye ${SPECIES_LVL[s.id]}'de açılır · bilgi kartı açık`)), open ? ring(p, p + '%') : icon('lock')); }));
    } else if (this.dexTab === 'plant') {
      body = h('div.grid2', { style: { gridTemplateColumns: 'repeat(auto-fill,minmax(104px,1fr))' } }, ...Object.entries(PLANTS).map(([id, pl]) => { const d = !!(seen.plant || {})[id], cv = Editor.thumb('plant', id); if (!d) { cv.style.filter = 'brightness(0) opacity(.35)'; }
        return h('div.cat', { role: 'button', tabindex: 0, onclick: () => UI.openPlant(id) }, cv, h('b', null, d ? pl.name : '???'), h('span.tiny.muted', null, d ? ['', 'Kolay', 'Kolay', 'Orta', 'Zor', 'Uzman'][pl.diff] : 'Keşfedilmedi')); }));
    } else {
      const mk = (k, id, def) => { const d = !!(seen.hard || {})[id]; const cv = k === 'sub' ? UI.subThumb(id) : Editor.thumb(k, id); if (!d) cv.style.filter = 'brightness(0) opacity(.35)'; return h('div.cat', { role: 'button', tabindex: 0, onclick: () => UI.openHard(k, id) }, cv, h('b', null, d ? def.name : '???'), h('span.tiny.muted', null, d ? '' : 'Keşfedilmedi')); };
      body = h('div.grid2', { style: { gridTemplateColumns: 'repeat(auto-fill,minmax(104px,1fr))' } }, ...Object.entries(HARDSCAPE).map(([id, d]) => mk(d.kind, id, d)), ...Object.entries(SUBSTRATES).map(([id, d]) => mk('sub', id, d)), ...Object.entries(DECOR).map(([id, d]) => mk('decor', id, d)));
    }
    el.replaceChildren(h('div.wrap', null,
      h('div.row', { style: { margin: '6px 0 10px' } }, h('div.ring', { style: { '--p': pc } }, h('span', null, pc + '%')), h('div', null, h('h2', null, 'Ansiklopedi'), h('div.muted.small', null, `${found}/${total} keşif · Balık ${fishFound}/${BREEDS.length} · Bitki ${plantFound}/${Object.keys(PLANTS).length} · Taş&zemin ${hardFound}/${hardAll.length}`))),
      UI.tabs([['fish', 'Balıkdex'], ['plant', 'Bitkidex'], ['hard', 'Taşdex']], this.dexTab, (k) => { this.dexTab = k; UI.render_dex(el); }), body));
  },
  subThumb(id) { const cv = document.createElement('canvas'); cv.width = cv.height = 96; const c = cv.getContext('2d'), [h_, s, l] = SUBSTRATES[id].colors.natural; c.fillStyle = hsl(h_, s, l); c.beginPath(); c.moveTo(6, 70); c.quadraticCurveTo(48, 40, 90, 66); c.lineTo(90, 90); c.lineTo(6, 90); c.fill(); const r = new RNG(3); for (let i = 0; i < 60; i++) { c.fillStyle = r.pick(['rgba(255,255,255,.25)', 'rgba(0,0,0,.25)']); c.beginPath(); c.arc(r.float(10, 88), r.float(62, 88), r.float(0.8, 2.4), 0, TAU); c.fill(); } return cv; },

  /* ---------- Tür Kartı ---------- */
  openSpecies(id) {
    const sp = SPECIES.find((s) => s.id === id), info = SPECIES_INFO[id], S = Game.S; let tab = 'gen', vi = Math.max(0, BREEDS.findIndex((b) => S.discovered[b.id])), sex = 'M', age = 120, zoomed = false, pt = null;
    const portrait = h('div.cc-portrait.sp-portrait'), cv = h('canvas'); portrait.append(cv);
    const label = h('div.sp-label'), controls = h('div.cc-tools'), body = h('div.sp-body');
    const open = sp.status === 'open';
    const setPortrait = () => {
      pt && pt.stop(); pt = null; const b = open ? BREEDS[vi % BREEDS.length] : null, disc = b ? !!S.discovered[b.id] : false;
      if (open) {
        const cr = UI.speciesCreature(id, vi, sex, age); portrait.style.setProperty('--c', b ? RARITY[b.rarity].color : '#4aa');
        if (disc) { pt = new Portrait(cr, cv); pt.setZoom(zoomed ? 1.8 : 1); pt.start(); }
        else { const c = cv.getContext('2d'); cv.width = 600; cv.height = 340; const g = c.createLinearGradient(0, 0, 0, 340); g.addColorStop(0, info.hab[0]); g.addColorStop(1, info.hab[2]); c.fillStyle = g; c.fillRect(0, 0, 600, 340); const sp2 = FishArt.sprite(cr), tmp = document.createElement('canvas'); tmp.width = 600; tmp.height = 340; const tc = tmp.getContext('2d'); tc.drawImage(sp2.tex, 100, 60, 400, 190); tc.globalCompositeOperation = 'source-atop'; tc.fillStyle = 'rgba(0,10,16,.92)'; tc.fillRect(0, 0, 600, 340); c.drawImage(tmp, 0, 0); cv.style.width = '100%'; cv.style.height = '100%'; }
        label.replaceChildren(h('b', null, disc ? b.name : '??? · Keşfedilmedi'), b ? UI.rarityPill(b.rarity) : null, h('span.tiny', { style: { color: '#fff', textShadow: '0 1px 3px #000' } }, disc ? '' : 'İpucu: ' + b.hint));
      } else {
        const c = cv.getContext('2d'); cv.width = 600; cv.height = 340; const g = c.createLinearGradient(0, 0, 0, 340); g.addColorStop(0, info.hab[0]); g.addColorStop(0.6, info.hab[1]); g.addColorStop(1, info.hab[2]); c.fillStyle = g; c.fillRect(0, 0, 600, 340); c.font = '120px serif'; c.textAlign = 'center'; c.fillText(info.emoji, 300, 210); cv.style.width = '100%'; cv.style.height = '100%';
        label.replaceChildren(h('b', null, sp.name), h('span.tiny', { style: { color: '#fff', textShadow: '0 1px 3px #000' } }, `Canlı portre: Aşama ${sp.stage}`));
      }
      controls.replaceChildren(...[open ? h('button.icon-btn', { 'aria-label': 'Önceki varyasyon', onclick: () => { vi = (vi + BREEDS.length - 1) % BREEDS.length; setPortrait(); if (tab === 'gen2') draw(); } }, '◀') : null, open ? h('button.icon-btn', { 'aria-label': 'Sonraki varyasyon', onclick: () => { vi = (vi + 1) % BREEDS.length; setPortrait(); } }, '▶') : null,
        open ? h('button.icon-btn', { 'aria-label': 'Cinsiyet', onclick: () => { sex = sex === 'M' ? 'F' : 'M'; setPortrait(); } }, sex === 'M' ? '♂' : '♀') : null,
        open ? h('button.icon-btn', { 'aria-label': 'Yaş', title: 'Yavru / genç / yetişkin', onclick: () => { age = age === 120 ? 5 : age === 5 ? 25 : 120; setPortrait(); } }, age === 120 ? 'Yet.' : age === 5 ? 'Yav.' : 'Genç') : null,
        open ? h('button.icon-btn', { 'aria-label': 'Yakınlaştır', onclick: () => { zoomed = !zoomed; pt && pt.setZoom(zoomed ? 1.8 : 1); } }, icon('zoom')) : null, h('button.icon-btn', { 'aria-label': 'Kapat', onclick: () => rec.close() }, icon('close'))].filter(Boolean));
    };
    portrait.style.background = `linear-gradient(${info.hab[0]},${info.hab[2]})`; portrait.append(controls, h('div.cc-rar', null, label));
    const tabNames = [['gen', 'Genel'], ['env', 'Yaşam Şartları'], ['tank', 'Akvaryum Ortamı'], ['food', 'Beslenme'], ['breed', 'Üreme'], ['gen2', 'Genetik'], ['fun', 'İlginç & Sağlık']];
    const kv = (rows) => h('div.kv', null, ...rows.flatMap(([a, b]) => [h('span', null, a), h('span', null, b)]));
    const draw = () => {
      const tabEl = UI.tabs(tabNames, tab, (k) => { tab = k; draw(); }); let c;
      if (tab === 'gen') c = h('div.stack', null, kv([['Türkçe ad', sp.name], ['Bilimsel ad', h('i', null, sp.sci)], ['Köken', info.origin], ['Boy (erkek/dişi)', `${info.sizeM} / ${info.sizeF}`], ['Ömür', info.life], ['Zorluk', UI.stars(info.diff)], ['Mizaç (1–10)', `${info.temper}/10`], ['Yaşadığı katman', info.layer]]), h('p', null, UI.rich(info.desc)));
      else if (tab === 'env') {
        const E = SP_ENV[id], w = Chem.w, rows = [['temp', 'Sıcaklık', '°C', [14, 36]], ['ph', 'pH', '', [5.5, 9.5]], ['gh', 'GH', '°dH', [0, 30]], ['kh', 'KH', '°dH', [0, 22]], ['tds', 'TDS', 'ppm', [0, 800]]];
        c = h('div.stack', null, h('div.small.muted', null, 'Yeşil: ideal · sarı: tolere edilen · kırmızı: tehlike · beyaz işaret: tankındaki mevcut değer'),
          ...rows.map(([k, n, u, ax]) => h('div', null, h('div.row', null, h('b.sp', null, n), h('span.small.muted', null, `${E[k][0][0]}–${E[k][0][1]} ${u}`)), UI.paramBar(E[k][0], E[k][1], ax, w[k]))),
          kv([['Tuz toleransı', info.salt], ['Akıntı', info.flow], ['Işık', info.light]]), h('div.tiny.muted', null, 'Amonyak ve nitrit her tür için ~0 olmalıdır; ayrıntılar Su panelinde.'));
      } else if (tab === 'tank') {
        const badge = (sid, ok) => { const s = SPECIES.find((x) => x.id === sid), i2 = SPECIES_INFO[sid]; return h('div.mate' + (ok ? '.ok' : '.bad'), null, h('span', { style: { fontSize: '22px' } }, i2.emoji), h('span.tiny', null, s.name), h('span.tiny', null, ok ? '✔' : '✖')); };
        c = h('div.stack', null, kv([['Min. tank hacmi', info.minL + ' L'], ['Grup büyüklüğü', info.group], ['Cinsiyet oranı', info.ratio], ['Zemin', info.substrate]]), h('div.small', null, info.decor),
          h('b.small', null, 'Sevdiği bitkiler'), h('div.row.wrap-r', null, ...info.plants.map((pid) => h('button.cat', { style: { width: '84px', minHeight: '88px' }, onclick: () => UI.openPlant(pid) }, Editor.thumb('plant', pid), h('b', { style: { fontSize: '11px' } }, PLANTS[pid].name)))),
          h('b.small', null, 'Tank arkadaşları'), h('div.row.wrap-r', null, ...info.mates.ok.map((s) => badge(s, true)), ...info.mates.bad.map((s) => badge(s, false))), h('div.small.muted', null, info.mates.note),
          h('button.btn.primary', { onclick: () => { rec.close(); UI.go('design'); setTimeout(() => Editor.applyTemplate({ key: info.tpl }), 700); } }, icon('brush'), 'Bu tür için örnek tank'));
      } else if (tab === 'food') c = kv([['Yem türleri', info.food.types], ['Sıklık', info.food.freq], ['Renk artırıcı', info.food.color], ['Yavru yemi', info.food.fry]]);
      else if (tab === 'breed') c = h('div.stack', null, kv([['Üreme tipi', info.breed.type], ['Gebelik / kuluçka', info.breed.time], ['Yavru sayısı', info.breed.count]]), h('p', null, info.breed.care));
      else if (tab === 'gen2') {
        c = h('div.stack', null, ...info.genetics.map((g) => h('p', { style: { margin: 0 } }, '• ', UI.rich(g))));
        if (open) { const found = BREEDS.filter((b) => S.discovered[b.id]).length; c.append(h('b', null, `Varyasyonlar (${found}/${BREEDS.length})`), h('div.grid2', { style: { gridTemplateColumns: 'repeat(auto-fill,minmax(92px,1fr))' } }, ...BREEDS.map((b, i) => { const d = !!S.discovered[b.id], cr = Game.sampleCreature(b.spec); return h('div.dex-tile' + (d ? '' : '.undisc'), { style: { '--c': RARITY[b.rarity].color, padding: '6px' }, onclick: () => { vi = i; setPortrait(); portrait.scrollIntoView({ behavior: 'smooth', block: 'nearest' }); } }, UI.thumbCv(cr, 90), h('div.tiny', null, d ? b.name : '???'), h('div.rarbar')); })),
          h('b', null, 'Örnek Punnett: iki taşıyıcı'), h('div.pgrid', null, h('span'), h('b', null, 'Yabani'), h('b', null, 'Albino'), h('b', null, 'Yabani'), h('span.pc', null, 'YY'), h('span.pc', null, 'YA'), h('b', null, 'Albino'), h('span.pc', null, 'YA'), h('span.pc', null, 'AA')), h('div.small.muted', null, '¼ albino · ¾ yabani görünüm (3:1).')); }
      } else c = h('div.stack', null, h('b', null, 'İlginç bilgiler'), ...info.trivia.map((t) => h('p', { style: { margin: 0 } }, '💡 ', t)), h('b', null, 'Sağlık ve dürüst notlar'), ...info.health.map((t) => h('p', { style: { margin: 0 } }, '🩺 ', t)));
      body.replaceChildren(tabEl, c);
    };
    const rec = UI.sheet(h('div', null, portrait, body), { full: true, onClose: () => pt && pt.stop() });
    setPortrait(); draw(); requestAnimationFrame(() => pt && pt.resize());
  },

  /* ---------- Bitki Kartı ---------- */
  openPlant(id) {
    const d = PLANTS[id], sc = Game.tank.scape, e = sc.equip, P = e.light.p / 100, need = [0, 0.3, 0.55, 0.8][d.light]; (Game.S.seen = Game.S.seen || {}).plant = Game.S.seen.plant || {};
    const cv = h('canvas'), box = h('div.cc-portrait', { style: { height: '220px', '--c': 'hsl(' + d.col[0] + ',50%,45%)' } }, cv);
    const ok = (b, t) => h('span.pill', { style: { color: b ? 'var(--ok)' : 'var(--warn)' } }, (b ? '✔ ' : '⚠ ') + t);
    const rec = UI.sheet(h('div.stack', null, UI.sheetHead(d.name, { close: () => rec.close() }), box,
      h('div.row.wrap-r', null, h('span.pill', null, PLANT_LAYERS[d.layer] || 'Epifit'), h('span.pill', null, '☀'.repeat(d.light) + ' ışık'), h('span.pill', null, ['CO₂ gereksiz', 'CO₂ faydalı', 'CO₂ şart'][d.co2]), h('span.pill', null, UI.stars(d.diff).slice(0, 5)), d.red ? h('span.pill', { style: { color: '#ff7a8a' } }, 'Kırmızılaşır') : null),
      h('div.kv', null, h('span', null, 'Bilimsel ad'), h('span', null, h('i', null, d.sci)), h('span', null, 'Tür'), h('span', null, { ribbon: 'Şerit yapraklı', rosette: 'Rozet', stem: 'Gövdeli', carpet: 'Halı', epi: 'Epifit', moss: 'Yosun', float: 'Yüzen' }[d.type]), h('span', null, 'Büyüme'), h('span', null, d.grow < 0.6 ? 'Yavaş' : d.grow < 1.1 ? 'Orta' : 'Hızlı'), h('span', null, 'Boy'), h('span', null, `~${Math.round(d.h / 10)} cm`), h('span', null, 'Fiyat'), h('span', null, `${d.cost} 💰 · Seviye ${d.lvl}`)),
      h('p', null, UI.rich(d.info + (d.type === 'carpet' ? ' [[halı bitki]] CO₂ yoksa yayılmak yerine dikine uzayabilir.' : d.type === 'epi' ? ' [[epifit]]: rizomunu gömme, taşa/köke bağla.' : ''))),
      h('b', null, 'Tankın için uygun mu?'), h('div.row.wrap-r', null, ok(P >= need, P >= need ? 'Işık yeterli' : 'Işık yetersiz'), d.co2 === 2 ? ok(e.co2 !== 'none', e.co2 !== 'none' ? 'CO₂ var' : 'CO₂ yok — şart') : d.co2 === 1 ? ok(e.co2 !== 'none', e.co2 !== 'none' ? 'CO₂ var' : 'CO₂ ile daha iyi') : ok(true, 'CO₂ gerekmez'), ok(sc.sub.type === 'aquasoil' || d.type === 'epi' || d.type === 'float' || d.type === 'moss', sc.sub.type === 'aquasoil' || d.type === 'epi' || d.type === 'float' || d.type === 'moss' ? 'Zemin uygun' : 'Besinli zemin iyi olur')),
      h('div.small.muted', null, d.type === 'stem' ? 'İpucu: Uzayınca budayıp kesilen uçları sat ya da yeniden dik.' : d.type === 'float' ? 'İpucu: Fazlasını hasat edip sat; alttaki bitkilere ışığı keser.' : d.type === 'carpet' ? 'İpucu: Yayıldıkça budayıp sat; sık halı için ışık ve CO₂ dengesi önemli.' : 'İpucu: Yavaş büyür; sabırlı ol.'),
      h('button.btn.primary', { onclick: () => { rec.close(); UI.go('design'); setTimeout(() => { Editor.mode = 'plant'; Editor.pick('plant', id, d); }, 700); } }, icon('brush'), 'Stüdyoda yerleştir')), { full: true, onClose: () => (stop = true) });
    let stop = false; const dpr = Math.min(2, devicePixelRatio || 1), t0 = performance.now();
    const loop = (now) => { if (stop || !cv.isConnected) return; const w = cv.clientWidth, hh = cv.clientHeight; if (cv.width !== w * dpr) { cv.width = w * dpr; cv.height = hh * dpr; } const c = cv.getContext('2d'); c.setTransform(dpr, 0, 0, dpr, 0, 0); const g = c.createLinearGradient(0, 0, 0, hh); g.addColorStop(0, '#2fb9c8'); g.addColorStop(1, '#0b4a68'); c.fillStyle = g; c.fillRect(0, 0, w, hh);
      const sc2 = Math.min((hh - 30) / (d.type === 'float' ? 60 : d.h), (w - 40) / (d.w * 1.2)); c.save(); c.translate(w / 2, hh - 16); c.scale(sc2, sc2); if (d.type === 'float') c.translate(0, -hh * 0.2 / sc2); Art.drawPlant(c, { g: 1, s: 1, seed: 5, stems: 3, tint: d.red ? 0.6 : 0, sp: 1 }, d, 0, 0, { t: (now - t0) / 1000, flow: 0.5, ground: () => 0 }); c.restore(); requestAnimationFrame(loop); };
    requestAnimationFrame(loop);
  },

  /* ---------- Taş / kök / zemin / dekor kartı ---------- */
  openHard(k, id) {
    const def = k === 'sub' ? SUBSTRATES[id] : k === 'decor' ? DECOR[id] : HARDSCAPE[id], f = def.eff || {}, fx = [];
    if (f.kh) fx.push('KH ' + (f.kh > 0 ? '↑' : '↓')); if (f.gh) fx.push('GH ↑'); if (f.ph) fx.push('pH ' + (f.ph > 0 ? '↑' : '↓')); if (f.tannin) fx.push('Tanen ↑ (çay rengi)'); if (f.bio) fx.push('Bakteri yüzeyi ↑'); if (f.nh3) fx.push('İlk haftalarda amonyak salar');
    const cv = k === 'sub' ? UI.subThumb(id) : Editor.thumb(k, id); cv.style.width = '120px'; cv.style.height = '120px';
    const rec = UI.sheet(h('div.stack', null, UI.sheetHead(def.name, { close: () => rec.close() }), h('div', { style: { textAlign: 'center' } }, cv),
      h('div.row.wrap-r', null, h('span.pill', null, k === 'sub' ? 'Zemin' : k === 'wood' ? 'Kök' : k === 'rock' ? 'Taş' : k === 'leaf' ? 'Yaprak/kozalak' : 'Dekor'), h('span.pill', null, `${def.cost || 0} 💰 · Seviye ${def.lvl}`)),
      h('p', null, def.info || def.desc || 'Süs amaçlı dekor.'), h('b', null, 'Su kimyasına etkisi'), h('div.row.wrap-r', null, ...(fx.length ? fx.map((x) => h('span.pill', null, x)) : [h('span.pill', null, 'Kimyaya etkisiz')])),
      k !== 'sub' ? h('div.small.muted', null, def.eff && (def.eff.kh || def.eff.tannin) ? 'Etki aylar içinde yavaşça gerçekleşir; boyut büyüdükçe artar.' : '') : null));
  },

  /* ---------- Bilgi Merkezi ---------- */
  helpTab: 'guides',
  render_help(el) {
    const S = Game.S, done = S.lessons || {};
    let body;
    if (this.helpTab === 'guides') body = h('div.grid2', { style: { gridTemplateColumns: 'repeat(auto-fill,minmax(150px,1fr))' } }, ...GUIDES.map((g) => h('div.card.gcard', { role: 'button', tabindex: 0, onclick: () => UI.openGuide(g) }, h('div', { style: { fontSize: '34px' } }, g.ill), h('b', null, g.title), h('div.tiny.muted', null, g.pages.length + ' sayfa'))));
    else if (this.helpTab === 'school') body = h('div.stack', null, h('div.small.muted', null, 'Etkileşimli mini dersler. Tamamlayınca ödül kazanırsın (bir kez).'), ...LESSONS.map((l) => h('div.card.row', { role: 'button', tabindex: 0, style: { cursor: 'pointer' }, onclick: () => UI.openLesson(l) }, h('div', { style: { fontSize: '30px' } }, l.ill), h('div.sp', null, h('b', null, l.title), h('div.tiny.muted', null, `${l.pages.length} adım · ${l.reward.coins} 💰 + ${l.reward.xp} XP`)), done[l.id] ? h('span.pill', { style: { color: 'var(--ok)' } }, '✔ Tamam') : icon('book'))));
    else if (this.helpTab === 'gloss') { const inp = h('input', { type: 'text', placeholder: 'Terim ara…' }), list = h('div.stack'); const fill = () => { const q = inp.value.trim().toLowerCase(); list.replaceChildren(...Object.keys(GLOSSARY).filter((k) => !q || k.toLowerCase().includes(q) || GLOSSARY[k].toLowerCase().includes(q)).sort((a, b) => a.localeCompare(b, 'tr')).map((k) => h('div.card', { style: { padding: '10px 12px' } }, h('b', null, k), h('div.small', null, UI.rich(GLOSSARY[k]))))); }; inp.addEventListener('input', fill); fill(); body = h('div.stack', null, inp, list); }
    else body = h('div.stack', null, ...FAQ.map(([q, a]) => h('details.card', null, h('summary', { style: { fontWeight: 800, cursor: 'pointer' } }, q), h('p', { style: { margin: '8px 0 0' } }, UI.rich(a)))));
    el.replaceChildren(h('div.wrap', null, h('h2', { style: { margin: '6px 2px 8px' } }, 'Bilgi Merkezi'), UI.tabs([['guides', 'Rehberler'], ['school', 'Genetik Okulu'], ['gloss', 'Sözlük'], ['faq', 'SSS']], this.helpTab, (k) => { this.helpTab = k; UI.render_help(el); }), body));
  },
  openGuide(g) {
    let i = 0; const box = h('div.stack'), rec = UI.sheet(h('div', null, UI.sheetHead(g.title, { close: () => rec.close() }), box));
    const draw = () => { const [t, b] = g.pages[i]; box.replaceChildren(h('div.small.muted', null, `${i + 1} / ${g.pages.length}`), h('h3', null, t), h('p', { style: { fontSize: '16px' } }, UI.rich(b)), h('div.row', null, h('button.btn.sp', { disabled: i === 0 ? true : null, onclick: () => { i--; draw(); } }, 'Geri'), i < g.pages.length - 1 ? h('button.btn.primary.sp', { onclick: () => { i++; draw(); } }, 'İleri') : h('button.btn.primary.sp', { onclick: () => rec.close() }, 'Bitti'))); }; draw();
  },
  openLesson(l) {
    let i = 0, answered = false; const box = h('div.stack'), rec = UI.sheet(h('div', null, UI.sheetHead(l.title, { close: () => rec.close() }), box));
    const finish = () => { const S = Game.S; S.lessons = S.lessons || {}; const first = !S.lessons[l.id]; S.lessons[l.id] = 1; if (first) { Game.addCoins(l.reward.coins); Game.addXp(l.reward.xp); AudioSys.SFX.discover(2); UI.toast(`Ders tamam! +${l.reward.coins} 💰 +${l.reward.xp} XP`, 'star', 4000); Game.task('lesson'); } rec.close(); if (UI.cur === 'help') UI.render_help($('#s-help')); };
    const draw = () => {
      const p = l.pages[i]; answered = false; const nav = (ok) => h('div.row', null, h('button.btn.sp', { disabled: i === 0 ? true : null, onclick: () => { i--; draw(); } }, 'Geri'), h('button.btn.primary.sp', { id: 'lnext', disabled: ok ? null : true, onclick: () => { if (i < l.pages.length - 1) { i++; draw(); } else finish(); } }, i < l.pages.length - 1 ? 'İleri' : 'Tamamla'));
      const head = h('div.small.muted', null, `Adım ${i + 1} / ${l.pages.length}`);
      if (p[0] === 't') box.replaceChildren(head, h('h3', null, p[1]), h('p', { style: { fontSize: '16px' } }, UI.rich(p[2])), nav(true));
      else if (p[0] === 'p') {
        const A = p[2].slice(), B = p[3].slice(), alleles = [...new Set([...p[2], ...p[3]])], name = (a) => (a === 'W' ? 'Yabani' : a === 'a' ? 'albino' : a);
        const grid = h('div'), sum = h('div.small'), mk = (arr, idx) => h('button.sp-chip.on', { onclick: () => { arr[idx] = alleles[(alleles.indexOf(arr[idx]) + 1) % alleles.length]; upd(); } }, name(arr[idx]));
        const upd = () => { const cells = [[A[0], B[0]], [A[0], B[1]], [A[1], B[0]], [A[1], B[1]]], ph = (c) => (c.includes('W') ? 'Yabani' : 'Albino'), nW = cells.filter((c) => c.includes('W')).length;
          grid.replaceChildren(h('div.row.wrap-r', null, h('span.small', null, 'Baba:'), mk(A, 0), mk(A, 1), h('span.small', { style: { marginLeft: '12px' } }, 'Anne:'), mk(B, 0), mk(B, 1)), h('div.pgrid', { style: { margin: '10px 0' } }, h('span'), h('b', null, name(B[0])), h('b', null, name(B[1])), h('b', null, name(A[0])), h('span.pc', { style: { color: ph(cells[0]) === 'Albino' ? '#ffd36b' : '' } }, name(cells[0][0]) + '·' + name(cells[0][1])), h('span.pc', { style: { color: ph(cells[1]) === 'Albino' ? '#ffd36b' : '' } }, name(cells[1][0]) + '·' + name(cells[1][1])), h('b', null, name(A[1])), h('span.pc', { style: { color: ph(cells[2]) === 'Albino' ? '#ffd36b' : '' } }, name(cells[2][0]) + '·' + name(cells[2][1])), h('span.pc', { style: { color: ph(cells[3]) === 'Albino' ? '#ffd36b' : '' } }, name(cells[3][0]) + '·' + name(cells[3][1]))));
          sum.textContent = `Yabani görünümlü: %${nW * 25} · Albino: %${(4 - nW) * 25}`; };
        upd(); box.replaceChildren(head, h('h3', null, p[1]), h('div.small.muted', null, 'Alel düğmelerine dokunarak ebeveyn genotiplerini değiştir.'), grid, sum, h('div.small.muted', null, UI.rich(p[4])), nav(true));
      } else {
        const opts = h('div.stack'), fb = h('div.small', { style: { minHeight: '40px' } });
        p[2].forEach((o, k) => opts.append(h('button.btn', { style: { justifyContent: 'flex-start' }, onclick: (e) => { if (answered) return; if (k === p[3]) { answered = true; e.currentTarget.style.background = 'var(--ok)'; e.currentTarget.style.color = '#03281a'; fb.textContent = '✅ ' + p[4]; $('#lnext').disabled = false; AudioSys.SFX.coin(); } else { e.currentTarget.style.background = 'rgba(255,107,107,.35)'; fb.textContent = '❌ Tekrar dene.'; } } }, o)));
        box.replaceChildren(head, h('h3', null, 'Soru'), h('p', { style: { fontSize: '16px' } }, p[1]), opts, fb, nav(false));
      }
    }; draw();
  },
});

const FAQ = [
  ['Balıklarım neden hastalandı?', 'Çoğunlukla su kalitesi: amonyak/nitrit yüksek, ani sıcaklık düşüşü veya aşırı kalabalık. Su panelindeki Tanı bölümü nedenini ve çözümünü söyler. Hasta balığı karantinaya alıp uygun ilacı uygula; bakır karides ve salyangozlar için ölümcüldür.'],
  ['Yavrularım neden azaldı?', 'Yetişkin lepistesler yavruları yer. Yüzen ve sık bitkiler (guppy otu, salvinia) yavrulara saklanma sağlar. Tank dolduğunda fazla yavrular dükkâna verilir.'],
  ['Genotipi nasıl öğrenirim?', 'Balığın kartında "Test et" düğmesi gizli genleri açar. Yavru oranlarından da çıkarım yapabilirsin: Punnett önizlemesi, test edilmiş ebeveynler için olasılıkları gösterir.'],
  ['pH neden değişiyor?', '[[pH]], [[KH]] ve [[CO₂]] birbirine bağlıdır. Seiryu taşı KH\'yi, aquasoil pH\'ı değiştirir; CO₂ artınca pH düşer.'],
  ['Yosun çıktı, ne yapmalıyım?', 'Su panelinde hangi yosun olduğu ve nedeni yazar. Genellikle ışık süresini kısmak, su değiştirmek ve bitki sayısını artırmak yeter.'],
  ['Çevrimdışıyken ne olur?', 'Tankın en fazla 8 oyun günü ilerler. Ölüm olmaz; dönünce "Sen yokken" özeti görürsün.'],
  ['Kaydım nerede?', 'Tarayıcının yerel depolamasında (3 yuva). Ayarlar > Kayıt bölümünden JSON olarak dışa aktarabilirsin.'],
];
