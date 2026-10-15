'use strict';
/* =====================================================================
   23 · MÜZİK BAĞLAMI — sezon, tank içeriği, yarışma ruh hali, hava durumu
   Ses motoru (06) sadece "tint" bilir; oyun durumunu burada okuruz.
   ===================================================================== */
const Weather = {
  /** Günlük deterministik: ~her 6 günde bir yağmurlu gün, 09–19 arası. */
  rainy(clockMin) { const day = Math.floor(clockMin / 1440), hr = (clockMin % 1440) / 60; let x = Math.imul(day ^ (day >>> 15), 2246822519); x ^= x >>> 13; x = Math.imul(x, 3266489917); x ^= x >>> 16; return (x >>> 0) % 6 === 0 && hr >= 9 && hr < 19; },
};

const MusicLink = {
  last: {}, slow: 0,
  update() {
    const S = Game.S; if (!S || !Game.tank || !AudioSys.setTint) return; Season.ensure(S);
    const sc = S.scape, T = { season: Season.theme(S).id, plants: sc.items.filter((i) => i.k === 'plant' && !i.dead).length, beta: Game.tank.creatures.some((c) => c.species === 'betta'), rain: Weather.rainy(S.clockMin), air: !!(sc.equip && sc.equip.air) && !sc.dry };
    if (Date.now() - this.slow > 20000) { this.slow = Date.now(); try { const j = Judge.score('biotope'); this.bio = j.crit.find((c) => c.k === 'style').v >= 60; } catch (e) { this.bio = false; } }
    T.biotope = !!this.bio; const key = JSON.stringify(T); if (key !== this.key) { this.key = key; AudioSys.setTint(T); }
    if (T.rain !== this.rain) { this.rain = T.rain; Game.tank.rainy = T.rain; if (UI.cur === 'aq') UI.refreshAq(); }
  },
};
setInterval(() => { try { MusicLink.update(); } catch (e) { /* ses bağlamı oyunu durdurmasın */ } }, 4000);

/* Yarışma ekranında "contest" ruh hali */
UI.go = ((orig) => function (name) { const r = orig.apply(this, arguments); if (name === 'contest') AudioSys.setMood('contest'); return r; })(UI.go);
/* Akvaryum bilgi şeridinde yağmur rozeti */
UI.refreshAq = ((orig) => function () { const r = orig.apply(this, arguments); const info = $('#aq-info'); if (info && Game.S && Weather.rainy(Game.S.clockMin)) info.append(h('div.chip', null, '🌧 Yağmurlu')); return r; })(UI.refreshAq);

/* Ses kalitesi: yüksek / düşük güç (zayıf telefonlarda ağır yankıyı ve ses sayısını azaltır); yavaş çerçeveler görülünce otomatik düşer */
UI.render_settings = ((orig) => function (el) {
  const r = orig.apply(this, arguments), S = Game.S, card = [...el.querySelectorAll('.card')].find((c) => /Ses/.test((c.querySelector('h3') || {}).textContent || ''));
  if (card) { const q = (S.settings.audio.q || 'high'); card.append(h('div.set-row', null, h('label', null, 'Ses kalitesi'), h('div.seg', null, [['high', 'Yüksek'], ['low', 'Düşük güç']].map(([v, l]) => h('button' + (v === q ? '.on' : ''), { onclick: () => { S.settings.audio.q = v; S.settings.audio.qUser = 1; AudioSys.set('q', v); Game.save(); UI.render_settings(el); } }, l))))); }
  return r;
})(UI.render_settings);
setInterval(() => { try { const S = Game.S; if (!S || !AudioSys.set) return; const au = S.settings.audio; if (Game.low && !au.qUser && au.q !== 'low') { au.q = 'low'; AudioSys.set('q', 'low'); UI.toast('Ses "düşük güç" moduna alındı (Ayarlar > Ses)', 'bell', 3500); } else if (au.q && AudioSys.S.q !== au.q) AudioSys.set('q', au.q); } catch (e) { /* yoksay */ } }, 5000);
