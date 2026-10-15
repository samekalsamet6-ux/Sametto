'use strict';
/* =====================================================================
   14b · SU PANELİ — parametre çubukları, 7 günlük grafikler, tanı, ilaç,
         karantina, budama modu, kuru başlangıç
   ===================================================================== */
const PARAM_INFO = {
  temp: 'Sıcaklık metabolizmayı ve oksijeni etkiler. Ani değişim şok yapar; ısıtıcı 25 °C\'de tutar.',
  ph: 'Asitlik. KH ve CO₂\'ye bağlıdır: CO₂ artarsa pH düşer. Zemin ve kökler pH\'ı aşağı çeker.',
  gh: 'Genel sertlik (kalsiyum+magnezyum). Moliler ve salyangozlar sert su sever; karidesler orta.',
  kh: 'Karbonat sertliği — pH tamponu. Seiryu taşı ve mercan kırığı KH\'yi yükseltir, aquasoil düşürür.',
  tds: 'Çözünmüş toplam madde. Karideslerde ani TDS değişimi öldürücüdür.',
  nh3: 'Amonyak: balık atığı; çok zehirli. Bakteri kolonisi nitrite çevirir.',
  no2: 'Nitrit: döngünün ara ürünü; zehirli. Olgun tankta ~0 olmalı.',
  no3: 'Nitrat: döngünün sonu; bitkiler tüketir, su değişimi azaltır.',
  o2: 'Çözünmüş oksijen: akıntı, hava taşı ve bitkilerle artar; sıcak suda azalır.',
  co2: 'Bitkiler için besin; fazlası balıkları boğar. pH–KH–CO₂ üçgeni.',
};

Object.assign(UI, {
  waterDot() { return ['var(--ok)', 'var(--warn)', 'var(--bad)'][Chem.overall()]; },

  spark(key, color) {
    const hist = Chem.w.hist; if (hist.length < 2) return h('div.tiny.muted', null, 'veri toplanıyor');
    const vals = hist.map((s) => s[key]), mn = Math.min(...vals), mx = Math.max(...vals), rg = Math.max(1e-6, mx - mn), W = 110, H = 26;
    const pts = vals.map((v, i) => `${(i / (vals.length - 1) * W).toFixed(1)},${(H - 3 - (v - mn) / rg * (H - 6)).toFixed(1)}`).join(' ');
    const s = document.createElementNS('http://www.w3.org/2000/svg', 'svg'); s.setAttribute('viewBox', `0 0 ${W} ${H}`); s.setAttribute('width', W); s.setAttribute('height', H);
    s.innerHTML = `<polyline fill="none" stroke="${color}" stroke-width="1.8" stroke-linejoin="round" points="${pts}"/>`; return s;
  },

  rangeBar(p) {
    const w = Chem.w, v = w[p.k], r = Chem.range(p.k), [lo, hi] = p.ax, pc = (x) => clamp((x - lo) / (hi - lo), 0, 1) * 100;
    const tl = pc(Math.max(r.tol[0], lo)), th = pc(Math.min(r.tol[1], hi)), il = pc(Math.max(r.ideal[0], lo)), ih = pc(Math.min(r.ideal[1], hi));
    return h('div.rbar', null, h('i.tol', { style: { left: tl + '%', width: Math.max(0, th - tl) + '%' } }), h('i.ide', { style: { left: il + '%', width: Math.max(0, ih - il) + '%' } }), h('b.mk', { style: { left: pc(v) + '%' } }));
  },

  openWater() {
    const w = Chem.w, st = Chem.overall(), S = Game.S, pct = h('input', { type: 'range', min: 10, max: 70, value: 30, step: 5, style: { maxWidth: '50%' } }), pl = h('b', null, '%30');
    pct.addEventListener('input', () => (pl.textContent = '%' + pct.value));
    const card = h('div.stack'), tpl = [];
    const build = () => {
      const diag = Chem.diagnose(), sick = Game.tank.creatures.filter((c) => c.dis), qf = S.qFish || [];
      card.replaceChildren(
        h('div.card', { style: { borderColor: ['var(--ok)', 'var(--warn)', 'var(--bad)'][Chem.overall()] } }, h('div.row', null, h('span.dot', { style: { background: UI.waterDot(), boxShadow: `0 0 10px ${UI.waterDot()}` } }), h('b.sp', null, ['Su dengeli', 'Dikkat: bazı değerler ideal dışı', 'Tehlike: hemen müdahale et'][Chem.overall()]), h('span.small.muted', null, `${Game.tank.scape.liters} L · ${TAP_PROFILES[S.settings.tap || 'mid'].name}`))),
        ...PARAMS.map((p) => { const v = w[p.k], s = Chem.status(p.k, v), col = ['var(--ok)', 'var(--warn)', 'var(--bad)'][s], info = h('div.tiny.muted.hidden', { style: { marginTop: '4px' } }, PARAM_INFO[p.k]);
          return h('div.prow', { role: 'button', onclick: () => info.classList.toggle('hidden') }, h('div.row', null, h('span.dot', { style: { background: col, boxShadow: `0 0 8px ${col}` } }), h('b.sp', null, p.n), h('span', { style: { fontFamily: 'var(--font-h)', fontSize: '20px' } }, v.toFixed(p.dp) + ' ', h('span.tiny.muted', null, p.u)), UI.spark(p.k, col)), UI.rangeBar(p), info); }),
        h('div.card', null, h('h3', null, 'Eylemler'),
          h('div.set-row', null, h('label', null, h('div', null, 'Su değişimi ', pl), h('div.tiny.muted', null, 'Kötü maddeleri seyreltir; musluk suyu (yeni değer + 20 °C) karışır. Büyük değişim şok yapabilir.')), pct),
          h('div.row.wrap-r', null, h('button.btn.primary', { onclick: () => { Chem.waterChange(+pct.value); build(); UI.refreshAq(); } }, icon('water'), 'Su değiştir'), h('button.btn', { onclick: () => { Chem.cleanGlass(); build(); } }, 'Camı temizle'),
            h('button.btn', { onclick: () => { UI.closeTop(); Game.pruneMode = true; UI.refreshAq(); UI.toast('Budama modu: bir bitkiye dokun', 'scissors'); } }, icon('scissors'), 'Budama'), h('button.btn', { onclick: () => { Chem.blackout(); build(); } }, icon('moon'), 'Karartma (3 gün)'))),
        h('div.card', null, h('h3', null, 'Tanı'), diag.length ? diag.map((d) => h('div.diag', null, h('b', { style: { color: d.sev === 2 ? 'var(--bad)' : 'var(--warn)' } }, (d.sev === 2 ? '⛔ ' : '⚠ ') + d.title), h('div.small.muted', null, 'Neden: ' + d.why), h('div.small', null, '→ ' + d.fix))) : h('div.small.muted', null, '✅ Sorun yok. Su kristal berrak!')),
        sick.length || w.med ? h('div.card', null, h('h3', null, 'Hastalık & ilaç'), w.med ? h('div.small', { style: { color: 'var(--accent)', marginBottom: '6px' } }, `Aktif ilaç: ${MEDS[w.med.id].name} · ${w.med.days.toFixed(1)} gün kaldı`) : null,
          ...sick.map((c) => h('div.row', { style: { margin: '6px 0' } }, h('div.sp', null, h('b', null, c.name), h('div.tiny.muted', null, `${DISEASES[c.dis.id].name} · şiddet %${Math.round(c.dis.sev * 100)}`)), h('button.btn.sm', { onclick: () => { Chem.quarantine(c, true); build(); UI.refreshAq(); } }, 'Karantina'))),
          h('div.small.muted', null, 'İlaç seç (hasta türüne uygun olmalı):'), h('div.row.wrap-r', { style: { marginTop: '6px' } }, ...Object.entries(MEDS).map(([id, m]) => h('button.btn.sm' + (m.copper ? '.coral' : ''), { title: m.copper ? 'Bakır: omurgasızlar için ölümcül' : '', onclick: () => { Chem.treat(id); setTimeout(build, 50); } }, `${m.name} · ${m.cost}💰`)))) : null,
        qf.length ? h('div.card', null, h('h3', null, 'Karantina / depo (' + qf.length + ')'), ...qf.map((c) => h('div.row', { style: { margin: '6px 0' } }, h('div.sp', null, h('b', null, c.name), h('div.tiny.muted', null, c.dis ? DISEASES[c.dis.id].name : 'Sağlıklı')), h('button.btn.sm', { onclick: () => { Chem.quarantine(c, false); build(); UI.refreshAq(); } }, 'Tanka al')))) : null);
    };
    build();
    const rec = UI.sheet(h('div', null, UI.sheetHead('Su parametreleri', { close: () => rec.close() }), card), { full: true, cls: 'water-sheet' });
    const iv = setInterval(() => { if (rec.closed) clearInterval(iv); else build(); }, 5000);
  },

  /* ---------- Budama sonucu ---------- */
  pruneResult(it, n) {
    const d = PLANTS[it.d], each = Math.max(2, Math.floor(d.cost * 0.3)), total = n * each;
    const rec = UI.sheet(h('div.stack', null, UI.sheetHead('✂ Budama', { close: () => rec.close() }), h('div', null, `${d.name}: ${n} kesik uç elde ettin.`),
      h('div.row', null, h('button.btn.primary.sp', { onclick: () => { Game.addCoins(total); Game.task('prune'); AudioSys.SFX.sell(); UI.toast(`+${total} Altın Pul`, 'coin'); rec.close(); } }, `Sat · +${total} 💰`),
        h('button.btn.sp', { onclick: () => { const sc = Game.tank.scape; for (let i = 0; i < Math.min(3, n); i++) { const c = Scape.newItem(sc, 'plant', it.d, clamp(it.fx + R.float(-0.1, 0.1), 0.03, 0.97), { g: 0.4, z: it.z, t: Game.S.clockMin }); sc.items.push(c); } Game.tank.touch(); Game.task('prune'); rec.close(); UI.toast('Kesik uçlar yeniden dikildi 🌱', 'leaf'); } }, 'Yeniden dik'))));
  },
});

/* Kuru başlangıç (Dry Start Method) */
Chem.dryStart = function (on) {
  const S = Game.S, sc = Game.tank.scape, t = Game.tank;
  if (on) {
    if (sc.dry) return;
    UI.confirm('Kuru başlangıç başlasın mı?', 'Su boşaltılır; balıklar geçici olarak depoya alınır. Halı bitkileri nemli ortamda kökleşir (yavaş ama yosunsuz). Su doldurunca azot döngüsü baştan başlar.', () => {
      for (const c of t.creatures.slice()) { c.quarantined = true; t.removeCreature(c); (S.qFish = S.qFish || []).push(c); }
      sc.dry = true; sc.dryDays = 0; Game.markScapeChanged(); Editor.refresh(); UI.toast('Kuru başlangıç: bitkiler kökleşiyor', 'leaf', 3500);
    });
  } else {
    UI.confirm('Su doldurulsun mu?', 'Balıklar tanka geri döner. Tank yeni sayılır: amonyak yükselebilir, yavaş ilerle.', () => {
      sc.dry = false; const w = Chem.fresh(S); w.b1 = 0.03; w.b2 = 0.02; w.soilAge = 0; S.water = w;
      for (const it of sc.items) if (it.k === 'plant') { const d = PLANTS[it.d]; if (d.type === 'carpet') it.sp = Math.max(it.sp || 1, 1.3); it.melt = 0; it.hp = 1; }
      for (const c of (S.qFish || []).slice()) if (!c.dis || true) { c.quarantined = false; t.addCreature(c); } S.qFish = [];
      Game.markScapeChanged(); Editor.refresh(); UI.toast('Su dolduruldu! Azot döngüsü başlıyor — ilk günlerde su değişimi yap.', 'water', 5500); Game.notify('info', 'Tank dolduruldu. Yeni tank: amonyak/nitrit izle.');
    });
  }
};
