'use strict';
/* 33 · ÜST PLAN — tasarımı kuş bakışı gösterir: yatay = tank genişliği, dikey = derinlik katmanları
   (arka/orta/ön). Üçler kuralı kılavuzu, zemin yüksekliği ısı haritası ve odak noktası işaretlenir. */
Object.assign(UI, {
  openPlan() {
    const sc = Game.S.scape, d = Scape.dims(sc), cvs = h('canvas', { width: 720, height: 420, style: { width: '100%', borderRadius: '14px', background: '#0c2430' } }), ctx = cvs.getContext('2d'), Wc = 720, Hc = 420, pad = 18, iw = Wc - pad * 2, ih = Hc - pad * 2;
    const rec = UI.sheet(h('div.stack', null, UI.sheetHead('Üst plan görünümü', { close: () => rec.close() }), h('div.small.muted', null, `${d.wcm} cm × ${d.hcm} cm tank · yatay: genişlik, dikey: derinlik (arka → ön). Daire = bitki, köşeli = taş, çizgi = kök.`), cvs, h('div.small.muted', { id: 'plan-info' })));
    ctx.fillStyle = '#0c2430'; ctx.fillRect(0, 0, Wc, Hc);
    // zemin yüksekliği ısı haritası (şeritler)
    for (let i = 0; i < SUB_COLS; i++) { const v = sc.sub.h[i]; ctx.fillStyle = `rgba(214,190,140,${0.12 + v * 1.6})`; ctx.fillRect(pad + (i / SUB_COLS) * iw, pad, iw / SUB_COLS + 1, ih); }
    ctx.strokeStyle = 'rgba(255,255,255,.35)'; ctx.lineWidth = 2; ctx.strokeRect(pad, pad, iw, ih);
    // katman çizgileri + üçler kuralı
    ctx.setLineDash([6, 6]); ctx.strokeStyle = 'rgba(255,255,255,.18)'; ctx.lineWidth = 1; for (const f of [1 / 3, 2 / 3]) { ctx.beginPath(); ctx.moveTo(pad + iw * f, pad); ctx.lineTo(pad + iw * f, pad + ih); ctx.stroke(); } for (const f of [1 / 3, 2 / 3]) { ctx.beginPath(); ctx.moveTo(pad, pad + ih * f); ctx.lineTo(pad + iw, pad + ih * f); ctx.stroke(); } ctx.setLineDash([]);
    ctx.fillStyle = 'rgba(255,255,255,.35)'; ctx.font = '12px sans-serif'; ctx.fillText('arka', pad + 4, pad + 14); ctx.fillText('ön', pad + 4, pad + ih - 6);
    // öğeler: katmana göre derinlik satırı + tohumdan küçük sapma
    const yOf = (it) => { const z = it.k === 'plant' && PLANTS[it.d].type === 'float' ? 0.5 : Scape.zOf(sc, it); const r = new RNG(it.seed >>> 0); return pad + ih * ((z + 0.5) / 3 + (r.next() - 0.5) * 0.18); }, items = sc.items.filter((i) => !i.dead);
    let cx = 0, cyy = 0, cm = 0;
    for (const it of items.sort((a, b) => Scape.zOf(sc, a) - Scape.zOf(sc, b))) {
      const x = pad + it.fx * iw, y = yOf(it), def = Scape.defOf(it), r = Math.max(5, def.w * (it.s || 1) / d.W * iw * 0.5);
      if (it.k === 'plant') { const t = def.type; ctx.fillStyle = t === 'float' ? 'rgba(150,230,140,.55)' : t === 'carpet' ? 'rgba(80,190,110,.45)' : 'rgba(60,170,90,.7)'; ctx.beginPath(); ctx.arc(x, y, t === 'carpet' ? r * 1.2 : r * 0.7, 0, TAU); ctx.fill(); ctx.strokeStyle = 'rgba(190,255,200,.5)'; ctx.stroke(); }
      else if (it.k === 'rock') { ctx.fillStyle = 'rgba(160,170,180,.85)'; ctx.beginPath(); for (let a = 0; a < 6; a++) { const rr = r * (0.8 + 0.25 * ((a * 7 + (it.seed % 5)) % 3) / 2), an = a * TAU / 6 + (it.r || 0); ctx.lineTo(x + Math.cos(an) * rr, y + Math.sin(an) * rr * 0.75); } ctx.closePath(); ctx.fill(); }
      else if (it.k === 'wood') { ctx.strokeStyle = 'rgba(150,100,60,.95)'; ctx.lineWidth = Math.max(4, r * 0.25); ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(x - r, y + 4); ctx.lineTo(x + r, y - 4); ctx.stroke(); }
      else { ctx.fillStyle = it.k === 'leaf' ? 'rgba(200,150,80,.8)' : 'rgba(170,120,220,.8)'; ctx.fillRect(x - r * 0.5, y - r * 0.4, r, r * 0.8); }
      if (it.k === 'rock' || it.k === 'wood') { const m = def.w * def.h * (it.s || 1) ** 2; cx += x * m; cyy += y * m; cm += m; }
    }
    if (cm) { ctx.strokeStyle = '#ffb04a'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(cx / cm, cyy / cm, 11, 0, TAU); ctx.moveTo(cx / cm - 16, cyy / cm); ctx.lineTo(cx / cm + 16, cyy / cm); ctx.moveTo(cx / cm, cyy / cm - 16); ctx.lineTo(cx / cm, cyy / cm + 16); ctx.stroke(); const f = (cx / cm - pad) / iw; $('#plan-info').textContent = `Odak noktası (turuncu hedef) soldan %${Math.round(f * 100)} konumunda; ideal üçler noktaları %33 ve %67.`; }
    else $('#plan-info').textContent = 'Henüz taş veya kök yok; odak noktası belirlenemedi.';
  },
});

/* Dükkân haritası: raflar + araştırmayla açılan odalar (laboratuvar, yavru odası, sergi salonu, karantina) */
UI.shopMap = function () {
  const S = Game.S; Tanks.ensure(S); const cv = h('canvas', { width: 720, height: 300, style: { width: '100%', borderRadius: '14px' } }), c = cv.getContext('2d'), W = 720, H = 300;
  const wall = c.createLinearGradient(0, 0, 0, H); wall.addColorStop(0, '#16303d'); wall.addColorStop(1, '#0a1c26'); c.fillStyle = wall; c.fillRect(0, 0, W, H);
  c.fillStyle = '#3a2617'; c.fillRect(0, H - 34, W, 34); c.fillStyle = '#5b3d28'; c.fillRect(0, H - 38, W, 6);                                   // zemin
  const rooms = [['lab', '🧪', 'Laboratuvar'], ['nursery', '🍼', 'Yavru odası'], ['quar', '🏥', 'Karantina'], ['hall', '🏆', 'Sergi salonu']];
  rooms.forEach(([id, ic, nm], i) => { const x = 14 + i * 90, has = Research.has(id); c.fillStyle = has ? 'rgba(80,200,170,.22)' : 'rgba(255,255,255,.05)'; c.strokeStyle = has ? 'rgba(120,255,220,.5)' : 'rgba(255,255,255,.12)'; c.lineWidth = 1.5; c.beginPath(); c.roundRect(x, 12, 80, 62, 10); c.fill(); c.stroke(); c.globalAlpha = has ? 1 : 0.3; c.font = '26px sans-serif'; c.textAlign = 'center'; c.fillText(ic, x + 40, 44); c.globalAlpha = 1; c.font = '10px sans-serif'; c.fillStyle = has ? '#cfeee8' : 'rgba(255,255,255,.35)'; c.fillText(has ? nm : '🔒 ' + nm, x + 40, 66); });
  // raflar: iki sıra, her sırada 3 yuva
  for (let i = 0; i < MAX_TANKS; i++) {
    const row = Math.floor(i / 3), col = i % 3, x = 36 + col * 226, y = 100 + row * 96, owned = i < S.shelves, tk = S.tanks[i];
    c.fillStyle = '#5b3d28'; c.fillRect(x - 8, y + 74, 200, 8); c.fillStyle = '#3a2617'; c.fillRect(x - 8, y + 82, 200, 4);                           // raf tahtası
    if (!owned) { c.strokeStyle = 'rgba(255,255,255,.18)'; c.setLineDash([5, 5]); c.strokeRect(x, y, 184, 72); c.setLineDash([]); c.fillStyle = 'rgba(255,255,255,.35)'; c.font = '12px sans-serif'; c.textAlign = 'center'; c.fillText(`🔒 raf · ${SHELF_COST[i]} 💰 · sev. ${SHELF_LVL[i]}`, x + 92, y + 42); continue; }
    if (!tk) { c.strokeStyle = 'rgba(120,255,220,.35)'; c.setLineDash([5, 5]); c.strokeRect(x, y, 184, 72); c.setLineDash([]); c.fillStyle = 'rgba(160,255,230,.6)'; c.font = '12px sans-serif'; c.textAlign = 'center'; c.fillText('boş raf · tank kurulabilir', x + 92, y + 42); continue; }
    const st = Tanks.status(i), act = i === S.activeTank, L = Tanks.liters(i), n = Tanks.fishCount(i), wcm = Scape.dims({ liters: L }).wcm, tw = Math.min(184, 70 + wcm * 1.1);
    const g = c.createLinearGradient(0, y, 0, y + 72); g.addColorStop(0, act ? 'rgba(90,200,230,.55)' : 'rgba(70,150,190,.4)'); g.addColorStop(1, 'rgba(10,60,90,.7)'); c.fillStyle = g; c.fillRect(x, y, tw, 72); c.strokeStyle = act ? '#3fe0d0' : 'rgba(255,255,255,.4)'; c.lineWidth = act ? 3 : 1.5; c.strokeRect(x, y, tw, 72);
    c.fillStyle = 'rgba(214,190,140,.7)'; c.fillRect(x + 2, y + 62, tw - 4, 8); for (let k = 0; k < Math.min(8, n); k++) { c.fillStyle = `hsl(${(k * 47 + i * 90) % 360},70%,62%)`; c.beginPath(); c.ellipse(x + 14 + (k * 29) % (tw - 28), y + 14 + ((k * 17) % 40), 6, 3, 0, 0, TAU); c.fill(); }
    c.textAlign = 'left'; c.fillStyle = '#fff'; c.font = 'bold 11px sans-serif'; c.fillText(tk.name, x + 4, y - 4); c.fillStyle = ['#3fe0a0', '#ffc247', '#ff6b6b'][st]; c.beginPath(); c.arc(x + tw - 8, y + 9, 5, 0, TAU); c.fill();
  }
  return cv;
};
UI.openTanks = ((orig) => function () { const r = orig.apply(this, arguments); const box = document.querySelector('.tanks-sheet .sheet > div') || document.querySelector('.tanks-sheet > div'); const head = box && box.firstElementChild; if (head && !box.querySelector('canvas')) head.after(UI.shopMap()); return r; })(UI.openTanks);
