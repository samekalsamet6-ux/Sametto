'use strict';
/* =====================================================================
   22 · ONBOARDING — ilk ~5 dakika: sinematik, tasarım, azot döngüsü, yem,
        çiftleştirme + hızlandırılmış ilk doğum, ilk satış, profil adı.
   Her adımda parlak hedef halkası; adım atlanabilir, eğitim kapatılabilir.
   ===================================================================== */
const Tut = {
  steps: [
    { id: 'tab-design', text: 'Alttaki **Tasarım** sekmesine dokun.', target: () => $('#tabbar .tab[data-go="design"]'), done: () => UI.cur === 'design' },
    { id: 'place', text: (S, T) => `Katalogdan 1 taş ve 2 bitki seçip tanka dokun (${Math.min(3, Math.max(0, (S.cnt.scape || 0) - T.base.scape))}/3).`, target: () => $('#ed-drawer'), enter: (S, T) => { T.base.scape = S.cnt.scape || 0; }, done: (S, T) => (S.cnt.scape || 0) - T.base.scape >= 3 },
    { id: 'water', text: 'Şimdi **Akvaryum** sekmesine dön.', target: () => $('#tabbar .tab[data-go="aq"]'), enter: () => Tut.nitrogenInfo(), done: () => UI.cur === 'aq' },
    { id: 'speed', text: '**Hız** düğmesine bas: zaman hızlanır, bakteriler ve yavrular çabuk gelişir.', target: () => $('.qbtn[aria-label="Hız"]'), enter: (S, T) => { T.base.speed = S.settings.speed; }, done: (S, T) => S.settings.speed !== T.base.speed },
    { id: 'feed', text: '**Yem** düğmesine bas ve balıkların yemesini izle.', target: () => $('.qbtn[aria-label="Yem"]'), enter: (S, T) => { T.base.feed = S.cnt.feed || 0; }, done: (S, T) => (S.cnt.feed || 0) - T.base.feed >= 1 },
    { id: 'tab-lab', text: '**Laboratuvar** sekmesine geç: yavrular burada doğar.', target: () => $('#tabbar .tab[data-go="lab"]'), done: () => UI.cur === 'lab' },
    { id: 'mate', text: 'Bir **erkek** ve bir **dişi** seç, sonra **Çiftleştir**\'e bas.', target: () => $$('#s-lab button').find((b) => /Çiftleştir/.test(b.textContent)), enter: (S, T) => { T.base.mate = S.cnt.mate || 0; }, done: (S, T) => (S.cnt.mate || 0) - T.base.mate >= 1, after: () => Tut.fastBirth() },
    { id: 'reveal', text: 'Yavruların renkleri ilk kez açılıyor — dokun ve gör!', enter: () => { Tut.rv = false; }, done: (S) => (Tut.rv || !Game.unrevealed().length) && !UI.sheets.length },
    { id: 'sell', text: '**Balıklar** listesinden bir balık seç ve **Sat**. (İstemezsen atla.)', target: () => $('.qbtn[aria-label="Balıklar"]'), enter: (S, T) => { T.base.sold = S.stats.sold; if (UI.cur !== 'aq') UI.go('aq'); }, done: (S, T) => S.stats.sold - T.base.sold >= 1 },
    { id: 'profile', text: 'Son adım: dükkânına bir isim ver.', enter: () => Tut.nameSheet(), done: (S, T) => !!T.named },
  ],

  /** Saf kontrol: mevcut adım tamam mı? (testlerde sahte durumla çağrılır) */
  check(S) { const T = S.tut; const st = this.steps[T.i]; return !!st && st.done(S, T); },
  get S() { return Game.S; },

  start(from = 0) {
    const S = Game.S; S.tut = { i: from, base: {}, fin: 0, off: 0 }; S.onboarded = true; this.enter(S); this.ui();
  },
  restart() { this.start(0); UI.go('aq'); },
  enter(S) { const T = S.tut, st = this.steps[T.i]; if (st && st.enter) st.enter(S, T); },
  active() { const S = Game.S; return !!(S && S.tut && !S.tut.fin && !S.tut.off && this.steps[S.tut.i]); },
  next() {
    const S = Game.S, T = S.tut, st = this.steps[T.i]; if (st && st.after) st.after(S, T);
    T.i++; if (T.i >= this.steps.length) return this.finish(); AudioSys.SFX.tick(); this.enter(S); this.render(); Game.save();
  },
  skip() { this.next(); },
  close() { const S = Game.S; if (S.tut) S.tut.off = 1; this.teardown(); Game.save(); UI.toast('Eğitim kapatıldı. Ayarlar > Eğitimi yeniden başlat', 'bell', 3500); },
  finish() {
    const S = Game.S; S.tut.fin = 1; this.teardown(); Game.addCoins(150, true); Game.addXp(60); AudioSys.SFX.discover(2);
    UI.toast('Eğitim bitti! +150 💰 +60 XP — Merkez\'deki hedeflere göz at', 'star', 5000); Game.save();
  },

  /* ---------- Adım içerikleri ---------- */
  nitrogenInfo() {
    const box = (t, s, c) => h('div', { style: { flex: 1, textAlign: 'center', padding: '8px 4px', borderRadius: '12px', background: 'rgba(255,255,255,.07)', border: '1px solid ' + c } }, h('b', null, t), h('div.tiny.muted', null, s));
    const rec = UI.sheet(h('div.stack', null, UI.sheetHead('Azot döngüsü', { close: () => rec.close() }),
      h('div.small', null, 'Balıkların atığı ve yem artığı önce zehirli amonyağa dönüşür. Yararlı bakteriler onu nitrite, sonra daha zararsız nitrata çevirir. Bu bakteri kolonisi yeni kurulan tankta birkaç haftada olgunlaşır; o zamana kadar tankı az balıkla başlat.'),
      h('div.row', { style: { gap: '4px', alignItems: 'stretch' } }, box('NH₃', 'amonyak', '#ff7a7a'), h('span', { style: { alignSelf: 'center' } }, '→'), box('NO₂', 'nitrit', '#ffc247'), h('span', { style: { alignSelf: 'center' } }, '→'), box('NO₃', 'nitrat', '#6be39a')),
      h('div.small.muted', null, 'Nitratı bitkiler yer ve düzenli su değişimi azaltır. Su panelinden değerleri izleyebilirsin. Zamanı hızlandırarak döngünün ilerleyişini seyredebilirsin.'),
      h('button.btn.primary', { onclick: () => rec.close() }, 'Anladım')));
  },
  nameSheet() {
    const S = Game.S, T = S.tut; if (T.named) return; const inp = h('input', { type: 'text', value: S.name === 'Misafir' ? '' : S.name, maxlength: 16, placeholder: 'Dükkân sahibinin adı', 'aria-label': 'Ad', style: { width: '100%', fontSize: '18px' } });
    const rec = UI.sheet(h('div.stack', null, h('h3', null, '🏪 Dükkânına hoş geldin!'), h('div.small.muted', null, 'Adını istediğin zaman Profil ekranından değiştirebilirsin.'), inp,
      h('button.btn.primary', { onclick: () => { S.name = Cards.safeName(inp.value); T.named = 1; rec.close(); UI.refreshTop(); } }, 'Tamam')));
  },
  /** Çiftleştirme sonrası ilk doğumu birkaç saniyeye sığdır (yalnızca eğitimde). */
  fastBirth() {
    const t = Game.tank, now = Game.S.clockMin; let any = false;
    for (const c of t.creatures) if (c.preg && c.preg.due > now) { c.preg.start = Math.min(c.preg.start, now - 1); c.preg.due = now; any = true; }
    if (!any) return; const out = Game.tickBreeding(); UI.go('aq'); setTimeout(() => { if (Game.unrevealed().length) UI.openReveal(); }, 700);
  },

  /* ---------- Arayüz: üstte kart + hedef halkası ---------- */
  ui() {
    this.teardown(); const card = h('div#tut-card', { role: 'status' }), ring = h('div#tut-ring.hidden'); document.body.append(ring, card); this.card = card; this.ring = ring;
    this.timer = setInterval(() => this.tick(), 350); this.render();
  },
  teardown() { clearInterval(this.timer); this.timer = 0; if (this.card) this.card.remove(); if (this.ring) this.ring.remove(); this.card = this.ring = null; },
  fmt(s) { return s.split(/\*\*(.+?)\*\*/g).map((p, i) => (i % 2 ? h('b', null, p) : p)); },
  render() {
    if (!this.card) return; const S = Game.S, T = S.tut, st = this.steps[T.i]; if (!st) return;
    const txt = typeof st.text === 'function' ? st.text(S, T) : st.text;
    this.card.replaceChildren(h('div.tiny.muted', null, `Eğitim ${T.i + 1}/${this.steps.length}`), h('div.tut-t', null, ...this.fmt(txt)),
      h('div.row', { style: { justifyContent: 'flex-end', gap: '6px', marginTop: '4px' } }, h('button.btn.sm.ghost', { onclick: () => this.close() }, 'Kapat'), h('button.btn.sm', { onclick: () => this.skip() }, 'Adımı atla')));
    this._txt = txt;
  },
  tick() {
    const S = Game.S; if (!this.active()) return this.teardown(); const T = S.tut, st = this.steps[T.i];
    if (st.done(S, T)) { this.next(); return; }
    const txt = typeof st.text === 'function' ? st.text(S, T) : st.text; if (txt !== this._txt) this.render();
    const el = st.target && st.target(), r = el && el.isConnected && el.getBoundingClientRect();
    if (r && r.width > 0 && r.height > 0 && !UI.sheets.length) { Object.assign(this.ring.style, { left: r.left - 6 + 'px', top: r.top - 6 + 'px', width: r.width + 12 + 'px', height: r.height + 12 + 'px' }); this.ring.classList.remove('hidden'); } else this.ring.classList.add('hidden');
    this.card.style.display = UI.sheets.length && st.id !== 'place' ? 'none' : '';
  },
};

/* Sinematik açılış: Game.welcome yerine */
Game.welcome = function welcome() {
  if (Tut._welcomed === this.S) return; Tut._welcomed = this.S;
  const pages = [['🏚️', 'Tozlu raflar, solmuş etiketler… Büyükbaban Rıza\'nın dükkânı yıllardır kapalıydı.'], ['🫧', 'Köşedeki tank hâlâ ayakta. İçinde birkaç lepistes seni bekliyor.'], ['📜', '"Torunum, dükkân senin. Beş dakikada temelleri göstereyim; sonrası senin hikâyen."']];
  let i = 0; const ill = h('div', { style: { fontSize: '72px', textAlign: 'center', transition: 'opacity .5s' } }), txt = h('p', { style: { textAlign: 'center', minHeight: '66px', fontSize: '17px', transition: 'opacity .5s' } });
  const show = () => { ill.style.opacity = txt.style.opacity = 0; setTimeout(() => { ill.textContent = pages[i][0]; txt.textContent = pages[i][1]; ill.style.opacity = txt.style.opacity = 1; }, 250); btn.textContent = i === pages.length - 1 ? 'Eğitime başla' : 'Devam'; };
  const done = (tutorial) => { rec.close(); this.S.onboarded = true; if (tutorial) Tut.start(); else this.S.tut = { i: 0, base: {}, fin: 0, off: 1 }; this.save(); };
  const btn = h('button.btn.primary', { onclick: () => { if (i < pages.length - 1) { i++; show(); } else done(true); } }, 'Devam');
  const rec = UI.sheet(h('div.stack', null, ill, txt, btn, h('button.btn.sm.ghost', { onclick: () => done(false) }, 'Eğitimi atla')), { onClose: () => { if (!this.S.onboarded) { this.S.onboarded = true; } } });
  show();
};
UI.openReveal = ((orig) => function () { Tut.rv = true; return orig.apply(this, arguments); })(UI.openReveal);

/* Her durumda (yeni oyun, yuva değişimi, eski kayıt) eğitimi başlat/sürdür */
setInterval(() => {
  const S = Game.S, app = $('#app'); if (!S || !app || app.classList.contains('hidden') || $('#splash')) return;
  if (!S.onboarded) { if (!UI.sheets.length) Game.welcome(); return; }
  if (S.tut && !S.tut.fin && !S.tut.off && !Tut.timer) { Tut.enter(S); Tut.ui(); }
}, 1500);

/* Ayarlar: eğitimi yeniden başlat */
UI.render_settings = ((orig) => function (el) {
  const r = orig.apply(this, arguments); const w = el.querySelector('.wrap') || el.firstElementChild;
  if (w) w.append(h('div.card.row', null, h('div.sp', null, h('b', null, 'Eğitim'), h('div.small.muted', null, '5 dakikalık başlangıç turunu yeniden izle.')), h('button.btn.sm', { onclick: () => Tut.restart() }, 'Başlat')));
  return r;
})(UI.render_settings);
