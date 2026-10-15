'use strict';
/* =====================================================================
   32 · CANLI DÜKKÂN — asistan (personel), sezon etkinlikleri + sınırlı dekor + Merkez
   bannerı, hatırlatma bildirimleri (opt-in).
   ===================================================================== */

/* ---------- Sezonluk dekorlar (sezon yolunun 5. kademesinde ücretsiz; sonra arşivden Yosun Taşı ile) ---------- */
Object.assign(DECOR, {
  sakura:  { name: 'Sakura dalı', w: 220, h: 320, cost: 0, lvl: 1, col: [20, 40, 24], shape: 'sakura', season: 'spring' },
  lantern: { name: 'Taş fener', w: 110, h: 190, cost: 0, lvl: 1, col: [210, 8, 52], shape: 'lantern', season: 'summer' },
  pumpkin: { name: 'Balkabağı', w: 150, h: 120, cost: 0, lvl: 1, col: [26, 85, 50], shape: 'pumpkin', season: 'autumn' },
  crystal: { name: 'Buz kristali', w: 150, h: 230, cost: 0, lvl: 1, col: [200, 70, 70], shape: 'crystal', season: 'winter' },
});
const SEASON_DECOR = { spring: 'sakura', summer: 'lantern', autumn: 'pumpkin', winter: 'crystal' };
const SEASON_EVENT = {
  spring: { name: 'Bahar Sergisi', bonus: 'Nadir+ balıklar %10 daha değerli', pm: (c) => (c.rarity() >= 1 ? 1.1 : 1) },
  summer: { name: 'Karides Festivali', bonus: 'Karides ve salyangozlar %15 daha değerli', pm: (c) => (c.species === 'shrimp' || c.species === 'snail' ? 1.15 : 1) },
  autumn: { name: 'Sonbahar Pazarı', bonus: 'Endler ve Platy %10 daha değerli', pm: (c) => (c.species === 'endler' || c.species === 'platy' ? 1.1 : 1) },
  winter: { name: 'Kış Mavisi', bonus: 'Beta %12 daha değerli', pm: (c) => (c.species === 'betta' ? 1.12 : 1) },
};

Art.decor = ((orig) => function (c, d, rng) {
  if (d.shape === 'sakura') {
    c.strokeStyle = hsl(22, 38, 22); c.lineCap = 'round'; c.lineWidth = 11; c.beginPath(); c.moveTo(-10, 0); c.bezierCurveTo(-14, -d.h * 0.35, 40, -d.h * 0.5, 30, -d.h * 0.8); c.stroke();
    c.lineWidth = 6; c.beginPath(); c.moveTo(14, -d.h * 0.5); c.bezierCurveTo(60, -d.h * 0.52, 90, -d.h * 0.62, 100, -d.h * 0.78); c.stroke(); c.beginPath(); c.moveTo(24, -d.h * 0.7); c.bezierCurveTo(-20, -d.h * 0.78, -60, -d.h * 0.86, -76, -d.h * 0.96); c.stroke();
    for (let i = 0; i < 90; i++) { const t = rng.next(), b = rng.next(), bx = [(-10 + 40 * t), 30 + 70 * t, 30 - 100 * t][i % 3], by = -d.h * (0.35 + 0.6 * t * (0.6 + 0.4 * b)) - rng.float(0, 12); c.fillStyle = hsl(340 + rng.float(-8, 8), 70, 78 + rng.float(-6, 10), 0.9); c.beginPath(); c.arc(bx + rng.float(-22, 22), by + rng.float(-18, 14), rng.float(4, 9), 0, TAU); c.fill(); }
  } else if (d.shape === 'lantern') {
    const g = c.createLinearGradient(-30, 0, 30, 0); g.addColorStop(0, hsl(210, 6, 62)); g.addColorStop(0.5, hsl(210, 6, 48)); g.addColorStop(1, hsl(210, 6, 30)); c.fillStyle = g;
    c.fillRect(-34, -14, 68, 14); c.fillRect(-12, -d.h * 0.46, 24, d.h * 0.46 - 14); c.fillRect(-30, -d.h * 0.52, 60, 10); c.fillRect(-26, -d.h * 0.78, 52, d.h * 0.26);
    c.fillStyle = 'rgba(255,205,110,.95)'; c.fillRect(-16, -d.h * 0.74, 32, d.h * 0.18); c.fillStyle = 'rgba(255,225,150,.28)'; c.beginPath(); c.arc(0, -d.h * 0.65, 52, 0, TAU); c.fill();
    c.fillStyle = g; c.beginPath(); c.moveTo(-46, -d.h * 0.78); c.lineTo(0, -d.h * 0.98); c.lineTo(46, -d.h * 0.78); c.closePath(); c.fill(); c.beginPath(); c.arc(0, -d.h * 0.99, 8, 0, TAU); c.fill();
  } else if (d.shape === 'pumpkin') {
    for (const [dx, w] of [[-34, 40], [34, 40], [-16, 44], [16, 44], [0, 46]]) { const g = c.createLinearGradient(dx - w, 0, dx + w, 0); g.addColorStop(0, hsl(24, 85, 44)); g.addColorStop(0.5, hsl(28, 92, 56)); g.addColorStop(1, hsl(22, 80, 38)); c.fillStyle = g; c.beginPath(); c.ellipse(dx, -d.h * 0.42, w * 0.62, d.h * 0.42, 0, 0, TAU); c.fill(); }
    c.strokeStyle = 'rgba(80,30,0,.35)'; c.lineWidth = 2; for (const x of [-26, -8, 8, 26]) { c.beginPath(); c.moveTo(x, -d.h * 0.8); c.quadraticCurveTo(x * 1.3, -d.h * 0.4, x, -4); c.stroke(); }
    c.fillStyle = hsl(95, 35, 28); c.fillRect(-5, -d.h * 0.98, 10, 22); c.strokeStyle = hsl(110, 45, 36); c.lineWidth = 3; c.beginPath(); c.moveTo(5, -d.h * 0.9); c.quadraticCurveTo(26, -d.h * 0.96, 24, -d.h * 0.84); c.stroke();
  } else if (d.shape === 'crystal') {
    for (const [x, w, hh, a] of [[-40, 26, 0.55, -0.22], [-12, 34, 0.9, -0.06], [22, 30, 1, 0.08], [50, 24, 0.5, 0.26], [4, 22, 0.42, 0.0]]) {
      c.save(); c.translate(x, 0); c.rotate(a); const H = d.h * hh, g = c.createLinearGradient(-w, 0, w, 0); g.addColorStop(0, 'rgba(170,225,255,.85)'); g.addColorStop(0.5, 'rgba(110,190,255,.7)'); g.addColorStop(1, 'rgba(60,130,220,.75)');
      c.fillStyle = g; c.beginPath(); c.moveTo(-w, 0); c.lineTo(-w * 0.8, -H * 0.8); c.lineTo(0, -H); c.lineTo(w * 0.8, -H * 0.8); c.lineTo(w, 0); c.closePath(); c.fill(); c.strokeStyle = 'rgba(255,255,255,.7)'; c.lineWidth = 1.5; c.stroke();
      c.fillStyle = 'rgba(255,255,255,.35)'; c.beginPath(); c.moveTo(-w * 0.5, -6); c.lineTo(-w * 0.45, -H * 0.75); c.lineTo(-w * 0.15, -H * 0.9); c.lineTo(-w * 0.2, -6); c.closePath(); c.fill(); c.restore();
    }
  } else return orig.apply(this, arguments);
})(Art.decor);

/* Stüdyo dekor sekmesi: sezonluk eşya yalnızca sahibine görünür */
Editor.tab_decor = function (body) {
  const own = (Meta.ensure(Game.S).decorOwned || {});
  body.append(h('div.cat-grid', null, ...Object.entries(DECOR).filter(([k, def]) => !def.season || own[k]).map(([d, def]) => this.catalogTile(def, 'decor', d, () => this.pick('decor', d, def), def.season ? '🎁 sezon eşyası' : undefined))));
};
/* Sezon yolu 5. kademe = o sezonun dekoru; arşivden Yosun Taşı ile */
Season.claim = ((orig) => function (i) { const ok = orig.apply(this, arguments); if (ok && i === 4) { const M = Meta.ensure(Game.S); (M.decorOwned = M.decorOwned || {})[SEASON_DECOR[Season.theme().id]] = 1; UI.toast(`🎁 ${DECOR[SEASON_DECOR[Season.theme().id]].name} Stüdyo > Dekor'da açıldı`, 'gift', 4500); } return ok; })(Season.claim);
const archiveDecorCost = 3;
UI.render_season = ((orig) => function (el) {
  const r = orig.apply(this, arguments), S = Game.S, M = Meta.ensure(S); M.decorOwned = M.decorOwned || {};
  const rows = [...el.querySelectorAll('.card.row')].filter((x) => /puan · \d+ kademe/.test(x.textContent));
  M.archive.slice().reverse().forEach((a, k) => { const row = rows[k]; if (!row) return; const id = SEASON_DECOR[SEASON_THEMES[a.idx % 4].id]; if (M.decorOwned[id]) row.append(h('span.pill', null, '🎁 ' + DECOR[id].name)); else row.append(h('button.btn.sm', { onclick: () => { if ((S.stone || 0) < archiveDecorCost) return UI.toast('Yeterli Yosun Taşı yok', 'bell'); S.stone -= archiveDecorCost; M.decorOwned[id] = 1; Game.save(); UI.refreshTop(); UI.render_season(el); } }, `🎁 ${archiveDecorCost} 💎`)); });
  return r;
})(UI.render_season);

/* Etkinlik fiyat bonusu (sezona göre) */
Market.price = ((orig) => function (c) { const e = SEASON_EVENT[Season.theme().id]; return Math.max(3, Math.round(orig.apply(this, arguments) * (e ? e.pm(c) : 1))); })(Market.price);

/* Merkez: etkinlik bannerı */
UI.render_hub = ((orig) => function (el) {
  const r = orig.apply(this, arguments), S = Game.S, th = Season.theme(S), ev = SEASON_EVENT[th.id], s = Season.ensure(S), tiers = s.claimed.length, wrap = el.querySelector('.wrap');
  if (wrap) wrap.prepend(h('div.card.mt-season', { style: { '--c': th.col, cursor: 'pointer' }, role: 'button', onclick: () => UI.go('season') }, h('div.row', null, h('div', { style: { fontSize: '34px' } }, th.emo), h('div.sp', null, h('b', null, `${ev.name} · ${Season.daysLeft(S)} gün kaldı`), h('div.small.muted', null, `${ev.bonus} · sezon yolu ${tiers}/${SEASON_TIERS}`)), h('span.pill', null, 'Aç'))));
  return r;
})(UI.render_hub);

/* ---------- Asistan (personel): sabah beslemesi, haftalık cam silme + %15 su değişimi ---------- */
RESEARCH.push({ id: 'assistant', name: 'Asistan Deniz', icon: '🧑‍🔧', cost: 120, after: 'feeder', desc: 'Sabah 09:00\'da besler; haftada bir camı siler ve %15 su değişimi yapar (her işlem 10 Altın Pul). Rutini devralır.' });
const Assistant = {
  tick(S) {
    if (!Research.has('assistant') || S.settings.assistant === false || Game.tank.scape.dry) return; const day = Math.floor(S.clockMin / 1440), hr = (S.clockMin % 1440) / 60, M = Meta.ensure(S); M.assist = M.assist || { feed: -1, clean: -99 };
    if (hr >= 9 && hr < 18 && M.assist.feed !== day && Game.tank.creatures.length) { M.assist.feed = day; if (Game.tank.feed()) { Chem.onFeed(); Game.notify('info', 'Asistan Deniz sabah yemini verdi.'); } }
    if (day - M.assist.clean >= 7 && S.coins >= 10) { M.assist.clean = day; S.coins -= 10; Chem.cleanGlass(); Chem.waterChange(15); UI.refreshTop(); Game.notify('info', 'Asistan Deniz camı sildi ve %15 su değişimi yaptı (−10 Altın Pul).'); }
  },
};
Game.dayTick = ((orig) => function () { const r = orig.apply(this, arguments); try { if (this.S) Assistant.tick(this.S); } catch (e) { console.warn('Asistan', e); } return r; })(Game.dayTick);

/* ---------- Hatırlatma bildirimleri (varsayılan KAPALI; Ayarlar > Oyun) ---------- */
const Notifier = {
  cap() { const c = window.Capacitor; return c && c.isNativePlatform && c.isNativePlatform() && c.Plugins && c.Plugins.LocalNotifications; },
  /** Önümüzdeki 24 gerçek saat içinde bitecek gebelik/kuluçkalar: [{id, at(ms), text}] */
  upcoming(S = Game.S) {
    const out = [], now = Date.now(), cm = S.clockMin, lim = cm + 24 * 60 * 60; let id = 100;
    for (const c of Game.tank.creatures) if (c.preg && c.preg.due > cm && c.preg.due < lim) out.push({ id: id++, at: now + (c.preg.due - cm) * 1000, text: `${c.name} doğurmak üzere! 🍼` });
    for (const cl of Game.tank.clutches || []) if (cl.due > cm && cl.due < lim) out.push({ id: id++, at: now + (cl.due - cm) * 1000, text: 'Salyangoz yumurtaları çıkmak üzere! 🥚' });
    return out.sort((a, b) => a.at - b.at).slice(0, 12);
  },
  async onHide() {
    const S = Game.S; if (!S || !S.settings.notify) return; const list = this.upcoming(S), LN = this.cap();
    if (LN) { try { await LN.cancel({ notifications: Array.from({ length: 12 }, (_, i) => ({ id: 100 + i })) }); if (list.length) await LN.schedule({ notifications: list.map((n) => ({ id: n.id, title: 'Akvaryum Dünyam', body: n.text, schedule: { at: new Date(n.at) } })) }); } catch (e) { console.warn('Bildirim', e); } return; }
    if ('Notification' in window && Notification.permission === 'granted') { this._timers = (this._timers || []).filter((t) => { clearTimeout(t); return false; }); for (const n of list.slice(0, 4)) { const d = n.at - Date.now(); if (d > 0 && d < 2147483000) this._timers.push(setTimeout(() => { try { new Notification('Akvaryum Dünyam', { body: n.text }); } catch (e) { /* yoksay */ } }, d)); } }
  },
  async onShow() { const LN = this.cap(); if (LN) { try { await LN.cancel({ notifications: Array.from({ length: 12 }, (_, i) => ({ id: 100 + i })) }); } catch (e) { /* yoksay */ } } for (const t of this._timers || []) clearTimeout(t); this._timers = []; },
  async enable() {
    const LN = this.cap(); try { if (LN) { const r = await LN.requestPermissions(); return r.display === 'granted'; } if ('Notification' in window) return (await Notification.requestPermission()) === 'granted'; } catch (e) { /* yoksay */ } return false;
  },
};
document.addEventListener('visibilitychange', () => { if (document.hidden) Notifier.onHide(); else Notifier.onShow(); });
UI.render_settings = ((orig) => function (el) {
  const r = orig.apply(this, arguments), S = Game.S, card = [...el.querySelectorAll('.card')].find((c) => /Oyun/.test((c.querySelector('h3') || {}).textContent || ''));
  const row = (label, on, fn) => h('div.set-row', null, h('label', null, label), h('button.switch' + (on ? '.on' : ''), { role: 'switch', 'aria-checked': String(!!on), onclick: () => fn(!on) }));
  if (card) {
    card.append(row('Doğum hatırlatma bildirimi (uygulama kapalıyken)', S.settings.notify, async (v) => { if (v && !(await Notifier.enable())) { UI.toast('Bildirim izni verilmedi', 'bell'); return; } S.settings.notify = v; Game.save(); UI.render_settings(el); }));
    if (Research.has('assistant')) card.append(row('Asistan Deniz çalışsın', S.settings.assistant !== false, (v) => { S.settings.assistant = v; Game.save(); UI.render_settings(el); }));
  }
  return r;
})(UI.render_settings);
