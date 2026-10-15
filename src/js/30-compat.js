'use strict';
/* =====================================================================
   30 · UYUM MATRİSİ — mizaç puanı (1-10), yaşam katmanı, yeme/avlanma, su aralığı
   çakışması ve beta kuralları. Tank içindeki her tür çifti için renkli hücre +
   gerekçe; uyumsuzluk balıklara gerçek stres olarak yansır.
   ===================================================================== */
const Compat = {
  _c: { t: -1, key: '' },
  info: (sp) => SPECIES_INFO[sp] || {},
  layerOf(sp) { const l = (this.info(sp).layer || '').toLowerCase(); return l.includes('üst') ? 0 : l.includes('zemin') ? 2 : 1; },
  overlap(a, b) { return Math.max(a[0], b[0]) <= Math.min(a[1], b[1]); },
  /** İki tür için {lv: 0 uyumlu | 1 dikkat | 2 uyumsuz, why: [metin]} */
  pair(a, b, o = {}) {
    const ia = this.info(a), ib = this.info(b), why = []; let lv = 0; const up = (n, t) => { lv = Math.max(lv, n); why.push(t); };
    if (a === 'betta' && b === 'betta') { if (o.malePair) up(2, 'Erkek betalar aynı tankta tutulamaz; dövüşürler.'); else up(1, 'Beta çiftleri yalnızca üreme için bir araya getirilir.'); }
    const na = SPECIES.find((s) => s.id === a).name, nb = SPECIES.find((s) => s.id === b).name;
    if ((ia.mates && ia.mates.bad && ia.mates.bad.includes(b)) || (ib.mates && ib.mates.bad && ib.mates.bad.includes(a))) up(2, `${na} ve ${nb} birlikte tutulması önerilmez (tür kartındaki uyum listesi).`);
    // avlanma: balık, karidesi/yavruyu yer
    const la = SPDEF[a], lb = SPDEF[b]; if (la && lb) { const big = la.kind === 'fish' ? la : lb.kind === 'fish' ? lb : null, small = big === la ? lb : la; if (big && small && small.kind === 'shrimp') up(2, 'Balıklar minik karidesleri avlar.'); }
    // mizaç farkı
    const dt = Math.abs((ia.temper || 3) - (ib.temper || 3)); if (dt >= 5) up(1, `Mizaç farkı büyük (${ia.temper || '?'} ↔ ${ib.temper || '?'}): sakin tür ezilir.`); else if (dt >= 3) up(1, 'Mizaç farkı orta: yakından izle.');
    if ((ia.temper || 0) >= 6 && (ib.temper || 0) >= 6 && this.layerOf(a) === this.layerOf(b)) up(1, 'İkisi de iddialı ve aynı katmanda: bölge kavgası çıkabilir.');
    // su aralığı
    const ea = SP_ENV[a], eb = SP_ENV[b]; if (ea && eb) for (const [k, nm] of [['temp', 'Sıcaklık'], ['ph', 'pH'], ['gh', 'GH']]) { if (!ea[k] || !eb[k]) continue; if (!this.overlap(ea[k][1], eb[k][1])) up(2, `${nm} aralıkları çakışmıyor: ikisi birden rahat edemez.`); else if (!this.overlap(ea[k][0], eb[k][0])) up(1, `${nm} ideal aralıkları farklı: ortak bir değer seçmek gerekir.`); }
    if (!lv && ia.mates && ia.mates.ok && (ia.mates.ok.includes(b) || (ib.mates && ib.mates.ok && ib.mates.ok.includes(a)))) why.push('Birlikte iyi geçinirler.');
    return { lv, why };
  },
  /** Etkin tankın türleri ve tüm çiftler. */
  matrix() {
    const cr = Game.tank.creatures, sps = [...new Set(cr.map((c) => c.species))], malePair = cr.filter((c) => c.species === 'betta' && c.sex === 'M').length > 1, cells = {};
    for (const a of sps) for (const b of sps) cells[a + '|' + b] = this.pair(a, b, { malePair: a === 'betta' && b === 'betta' && malePair });
    return { sps, cells, malePair };
  },
  /** Tankın genel uyum puanı 0-100 (çiftlerin ağırlıklı ortalaması). */
  score(m = this.matrix()) { const sp = m.sps; if (sp.length < 2 && !m.malePair) return 100; let tot = 0, n = 0; for (let i = 0; i < sp.length; i++) for (let j = i; j < sp.length; j++) { if (i === j && !(sp[i] === 'betta' && m.malePair)) continue; tot += [0, 0.5, 1][m.cells[sp[i] + '|' + sp[j]].lv]; n++; } return n ? Math.round(100 * (1 - tot / n)) : 100; },
  /** Bir canlının uyumsuzluk stresi (0-0.35); ~2 sn'de bir önbelleğe alınır. */
  stressFor(c) {
    const t = Game.tank, key = t.creatures.length + ':' + t.creatures.filter((x) => x.species === 'betta' && x.sex === 'M').length;
    if (this._c.t !== Math.floor(t.t / 2) || this._c.key !== key) { this._c = { t: Math.floor(t.t / 2), key, m: this.matrix() }; }
    const m = this._c.m; let s = 0; for (const o of m.sps) { if (o === c.species && !(o === 'betta' && m.malePair && c.sex === 'M')) continue; const lv = m.cells[c.species + '|' + o].lv; s += lv === 2 ? 0.12 : lv === 1 ? 0.025 : 0; }
    return Math.min(0.35, s);
  },
};

/* Gerçek etki: uyumsuz komşular stres yaratır */
Chem.envStress = ((orig) => function (c) { return clamp(orig.apply(this, arguments) + Compat.stressFor(c), 0, 1.2); })(Chem.envStress);
/* Yeni canlı eklenince uyumsuzluk uyarısı */
Game.addToTank = ((orig) => function (c) {
  const r = orig.apply(this, arguments);
  try { const m = Compat.matrix(), bad = m.sps.filter((s) => s !== c.species && m.cells[c.species + '|' + s].lv === 2); if (bad.length) UI.toast(`⚠ ${SPECIES.find((s) => s.id === c.species).name}, tankındaki ${bad.map((s) => SPECIES.find((x) => x.id === s).name).join(', ')} ile uyumsuz — Uyum matrisine bak`, 'bell', 5200); } catch (e) { /* uyarı zorunlu değil */ }
  return r;
})(Game.addToTank);

Object.assign(UI, {
  openCompat() {
    const m = Compat.matrix(), sc = Compat.score(m), rec = UI.sheet(h('div.stack'), { cls: 'compat-sheet' }), box = rec.wrap.querySelector('.sheet > div'), nm = (s) => SPECIES.find((x) => x.id === s);
    const col = ['rgba(60,200,140,.55)', 'rgba(255,194,71,.6)', 'rgba(255,90,90,.65)'], sym = ['✓', '!', '✗']; let sel = null;
    const detail = h('div.card.small');
    const show = (a, b) => { const p = m.cells[a + '|' + b]; detail.replaceChildren(h('b', null, `${nm(a).name} × ${nm(b).name}: ${['Uyumlu', 'Dikkat', 'Uyumsuz'][p.lv]}`), ...(p.why.length ? p.why.map((w) => h('div', null, '• ' + w)) : [h('div.muted', null, 'Bilinen bir sorun yok.')])); };
    const grid = m.sps.length ? h('div', { style: { display: 'grid', gridTemplateColumns: `34px repeat(${m.sps.length}, 1fr)`, gap: '4px', alignItems: 'center' } },
      h('div'), ...m.sps.map((s) => h('div', { style: { textAlign: 'center', fontSize: '22px' }, title: nm(s).name }, SPECIES_INFO[s].emoji)),
      ...m.sps.flatMap((a) => [h('div', { style: { fontSize: '22px' } }, SPECIES_INFO[a].emoji), ...m.sps.map((b) => { const p = m.cells[a + '|' + b]; return h('button', { style: { minHeight: '44px', borderRadius: '10px', border: '1px solid rgba(255,255,255,.2)', background: col[p.lv], color: '#fff', fontSize: '18px', fontWeight: 800 }, onclick: () => show(a, b) }, sym[p.lv]); })])) : null;
    box.replaceChildren(UI.sheetHead('Uyum matrisi', { close: () => rec.close() }),
      h('div.card.row', null, h('div', { style: { fontSize: '30px' } }, sc >= 80 ? '😊' : sc >= 50 ? '😐' : '😟'), h('div.sp', null, h('b', null, `Tank uyum puanı: ${sc}/100`), h('div.small.muted', null, 'Mizaç (1-10), yaşam katmanı, avlanma ve su aralığı çakışmasına bakar. Uyumsuz komşular balıklarda stres yaratır.'))),
      grid || UI.emptyState('🐟', 'Tankta canlı yok', 'Canlı eklenince uyum tablosu burada görünür.'), grid ? detail : null,
      h('div.small.muted', null, m.sps.map((s) => `${SPECIES_INFO[s].emoji} ${nm(s).name}: mizaç ${SPECIES_INFO[s].temper}/10 · ${SPECIES_INFO[s].layer}`).join('  ·  ')));
    if (m.sps.length) show(m.sps[0], m.sps[m.sps.length > 1 ? 1 : 0]);
  },
});

/* Akvaryum bilgi şeridine "Uyum" rozeti (iki tür varsa) */
UI.refreshAq = ((orig) => function () {
  const r = orig.apply(this, arguments), info = $('#aq-info'); if (!info || !Game.tank) return r;
  const m = Compat.matrix(); if (m.sps.length > 1 || m.malePair) { const sc = Compat.score(m); info.append(h('button.chip', { style: { cursor: 'pointer', border: '1px solid ' + (sc >= 80 ? 'var(--ok,#3fe0a0)' : sc >= 50 ? 'var(--warn,#ffc247)' : 'var(--bad,#ff6b6b)') }, onclick: () => UI.openCompat() }, '🐠 Uyum ' + sc)); }
  return r;
})(UI.refreshAq);
