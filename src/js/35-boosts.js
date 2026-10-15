'use strict';
/* =====================================================================
   35 · ÖDÜLLÜ REKLAM GÜÇLENDİRMELERİ — yalnızca oyuncu isteyince izlenen, günlük sınırlı,
   geçici bonuslar. Ara/zorunlu reklam YOK; oyun hiçbir güçlendirme olmadan tam oynanır.
   Çocuk dostu: günlük sınır, "Reklamları gizle" anahtarı, kişiselleştirilmiş reklam istenmez.
   Sağlayıcı: AdMob eklentisi (Capacitor) varsa gerçek; yoksa açıkça "Demo" etiketli simülasyon.
   ===================================================================== */
const BOOST_DAILY_CAP = 5, BOOST_MAX_MS = 2 * 3600e3;
/* AdMob: test=true iken Google'ın TEST reklamları gelir (geliştirme sırasında gerçek reklama tıklamak hesabı tehlikeye atar).
   Mağazaya yüklemeden önce test:false yap. Çocuklara yönelik muamele + Genel (G) içerik sınırı her zaman açık. */
const ADS_CFG = { test: true, unit: 'ca-app-pub-4685172291502564/1511031324' };
const BOOSTS = {
  coin: { name: 'Altın Bereketi', ic: '💰', desc: 'Satış ve ödül gelirleri %50 artar', ms: 30 * 60e3, mult: 1.5 },
  xp: { name: 'Bilgi Işığı', ic: '✨', desc: 'Kazanılan XP iki katı olur', ms: 30 * 60e3, mult: 2 },
};
const Boost = {
  st(S = Game.S) { return S.boost || (S.boost = {}); },
  left(id, S = Game.S) { return Math.max(0, (this.st(S)[id] || 0) - Date.now()); },
  active(id) { return Game.S ? this.left(id) > 0 : false; },
  mult(id) { return this.active(id) ? BOOSTS[id].mult : 1; },
  grant(id, S = Game.S) { const b = BOOSTS[id]; if (!b) return false; const st = this.st(S), now = Date.now(); st[id] = Math.min(now + BOOST_MAX_MS, Math.max(st[id] || 0, now) + b.ms); return true; },
};
const Ads = {
  ads(S = Game.S) { const a = S.ads || (S.ads = { day: '', n: 0, off: false }); if (a.day !== todayKey()) { a.day = todayKey(); a.n = 0; } return a; },
  left() { return Math.max(0, BOOST_DAILY_CAP - this.ads().n); },
  enabled() { return !this.ads().off; },
  real() { const c = window.Capacitor; return !!(c && c.isNativePlatform && c.isNativePlatform() && c.Plugins && c.Plugins.AdMob); },
  _init: null, lastErr: '',
  err(e) { const m = e && (e.message || e.errorMessage || (e.code != null ? 'kod ' + e.code : '')) || (typeof e === 'string' ? e : ''); this.lastErr = String(m || 'bilinmeyen').slice(0, 90); return this.lastErr; },
  init(A) { return this._init || (this._init = A.initialize({ initializeForTesting: ADS_CFG.test, tagForChildDirectedTreatment: true, tagForUnderAgeOfConsent: true, maxAdContentRating: 'General' }).catch((e) => { this.err(e); this._init = null; })); },
  /** Sağlayıcıdan 'ödül kazanıldı mı' sözü döner. */
  show() {
    if (this.real()) { // gerçek AdMob: ödül yalnızca 'Rewarded' olayı gelirse sayılır
      const A = Capacitor.Plugins.AdMob; let got = false, hs = [];
      return new Promise((res) => {
        const end = (v) => { hs.forEach((x) => x && x.remove && x.remove()); res(v); };
        Promise.all([A.addListener('onRewardedVideoAdReward', () => { got = true; }), A.addListener('onRewardedVideoAdDismissed', () => end(got)), A.addListener('onRewardedVideoAdFailedToLoad', (e) => { this.err(e); end(false); }), A.addListener('onRewardedVideoAdFailedToShow', (e) => { this.err(e); end(false); })]).then((x) => { hs = x; })
          .then(() => this.init(A)).then(() => A.prepareRewardVideoAd({ adId: ADS_CFG.unit, isTesting: ADS_CFG.test, npa: true })).then(() => A.showRewardVideoAd()).catch((e) => { this.err(e); end(false); });
      }).then((v) => { if (!v) UI.toast('Reklam yüklenemedi' + (this.lastErr ? ' (' + this.lastErr + ')' : '') + ' — biraz sonra tekrar dene', 'bell', 5500); return v; });
    }
    return new Promise((res) => { // demo: 5 sn geri sayım, erken kapatılırsa ödül yok
      let n = 5; const num = h('b', { style: { fontSize: '44px' } }, n), close = h('button.btn.sm', { disabled: true }, 'Kapat'), ov = h('div', { style: { position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(5,15,25,.96)', color: '#fff', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '14px', textAlign: 'center', padding: '24px' } },
        h('div.tiny.muted', null, 'DEMO REKLAM (gerçek reklam değil)'), num, h('div.small', null, 'Bitince ödülün hazır. Erken çıkarsan ödül verilmez.'), close, h('button.btn.sm.ghost', { onclick: () => { clearInterval(t); ov.remove(); res(false); } }, 'Vazgeç'));
      const t = setInterval(() => { n--; num.textContent = Math.max(n, 0); if (n <= 0) { clearInterval(t); close.disabled = false; close.textContent = 'Ödülü al'; close.onclick = () => { ov.remove(); res(true); }; } }, 1000);
      document.body.append(ov);
    });
  },
  watch(id, done) {
    if (!this.enabled()) return UI.toast('Reklamlar kapalı (Ayarlar)', 'bell'); if (!this.left()) return UI.toast('Bugünkü reklam hakkın doldu, yarın yenilenir', 'bell');
    this.show().then((ok) => { if (!ok) return; this.ads().n++; Boost.grant(id); AudioSys.SFX.discover(2); UI.toast(`${BOOSTS[id].ic} ${BOOSTS[id].name} aktif! (${Math.round(Boost.left(id) / 60000)} dk)`, 'star', 4000); Game.save(); if (done) done(); });
  },
};
/* Etkiler */
Game.addCoins = ((orig) => function (n, earned) { if (earned && n > 0 && Boost.active('coin')) n = Math.round(n * Boost.mult('coin')); return orig.call(this, n, earned); })(Game.addCoins);
Game.addXp = ((orig) => function (n, onceKey) { if (n > 0 && Boost.active('xp')) n = Math.round(n * Boost.mult('xp')); return orig.call(this, n, onceKey); })(Game.addXp);

const fmtLeft = (ms) => { const m = Math.ceil(ms / 60000); return m >= 60 ? `${Math.floor(m / 60)} sa ${m % 60} dk` : `${m} dk`; };
UI.boostCard = function (el, rerender) {
  if (!Ads.enabled()) return null;
  return h('div.card', null, h('div.row', null, h('div', { style: { fontSize: '26px' } }, '🎬'), h('div.sp', null, h('b', null, 'Güçlendirmeler'), h('div.tiny.muted', null, `İsteğe bağlı reklam izle, geçici bonus kazan. Bugün kalan hak: ${Ads.left()}/${BOOST_DAILY_CAP}${Ads.real() ? '' : ' · demo'}`))),
    ...Object.entries(BOOSTS).map(([id, b]) => { const l = Boost.left(id); return h('div.row', { style: { marginTop: '8px' } }, h('div', { style: { fontSize: '22px' } }, b.ic), h('div.sp', null, h('b', null, b.name), h('div.tiny.muted', null, l ? `Aktif · ${fmtLeft(l)} kaldı` : b.desc)), h('button.btn.sm' + (Ads.left() ? '.primary' : ''), { disabled: Ads.left() ? null : true, onclick: () => Ads.watch(id, rerender) }, l ? '+30 dk' : 'İzle')); }));
};
UI.render_hub = ((orig) => function (el) {
  const r = orig.apply(this, arguments), w = el.querySelector('.wrap'); if (!w) return r; const c = UI.boostCard(el, () => UI.render_hub(el));
  if (c) w.insertBefore(c, w.children[2] || null); return r;
})(UI.render_hub);
UI.render_settings = ((orig) => function (el) {
  const r = orig.apply(this, arguments), w = el.querySelector('.wrap') || el.firstElementChild, a = Ads.ads();
  if (w) w.append(h('div.card.row', null, h('div.sp', null, h('b', null, 'Ödüllü reklamlar'), h('div.small.muted', null, 'Yalnızca sen istersen izlenir; zorunlu reklam yoktur. Kapatırsan Güçlendirmeler gizlenir.')), h('button.switch' + (a.off ? '' : '.on'), { role: 'switch', 'aria-checked': String(!a.off), onclick: () => { a.off = !a.off; Game.save(); UI.render_settings(el); } })));
  return r;
})(UI.render_settings);
