'use strict';
/* =====================================================================
   21 · YEREL (APK) — Android geri tuşu, uygulama yaşam döngüsü
   Capacitor yoksa (tarayıcı) hiçbir şey yapmaz.
   ===================================================================== */
(function native() {
  const cap = window.Capacitor; if (!cap || !cap.isNativePlatform || !cap.isNativePlatform()) return;
  document.documentElement.classList.add('native');
  const App = cap.Plugins && cap.Plugins.App; if (!App) return;
  let lastBack = 0;
  App.addListener('backButton', () => {
    if ($('#celebrate').classList.contains('show')) return UI.closeCelebrate();
    if (UI.sheets.length) return UI.closeTop();
    if (Photo.on) return Photo.close();
    if (UI.cur && UI.cur !== 'hub') return UI.go(UI.cur === 'aq' ? 'hub' : 'aq');
    if (Date.now() - lastBack < 2000) { Game.save(true); return App.exitApp(); }
    lastBack = Date.now(); UI.toast('Çıkmak için tekrar geri bas', 'bell', 1800);
  });
  App.addListener('appStateChange', (st) => { if (!st.isActive) { Game.save(true); AudioSys.suspend(); } else AudioSys.resume(); });
})();
