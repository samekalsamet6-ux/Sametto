'use strict';
/* =====================================================================
   24 · DERİNLİK — Genetik Defter (tahminler), gizli varyasyonlar + ipuçları,
        Sabit Hat satış bonusu, ek başarımlar, koleksiyon kilometre taşları
   ===================================================================== */
const SECRETS = {
  moon:   { name: 'Ay Işığı Albino', emo: '🌕', how: 'Dolunay gecesi doğan bir albino lepistes.', hint: { npc: 'dede', lv: 1, text: 'Dedem derdi ki: "Albino bir yavru dolunay gecesi doğarsa, ışığı bir başka olur." Ay takvimini izle.' } },
  seiryu: { name: 'Seiryu Mavisi', emo: '💠', how: 'Seiryu taşlı bir Iwagumi tankında 3 nesil yetişmiş mavi bir lepistes.', hint: { npc: 'ayse', lv: 2, text: 'Seiryu taşı suyu yavaş yavaş sertleştirir. Mavi balıklar aynı Iwagumi tankında üç kuşak yetişirse gizli bir ton ortaya çıkarmış, diye duydum.' } },
};
const SECRET_BOOK = { text: 'Genetik Okulu\'ndaki notlardan: "Bazı varyasyonlar yalnızca doğru koşullarda ve doğru zamanda ortaya çıkar. Ay, su ve tank da bir gendir." (3 ders bitirince açılır)', lessons: 3 };
const MILESTONES = [0.25, 0.5, 0.75, 1];

const Depth = {
  ensure(S = Game.S) {
    const M = Meta.ensure(S);
    if (!M.secrets) M.secrets = {}; if (!M.found) M.found = {}; if (!M.notes) M.notes = []; if (!M.mendel) M.mendel = {}; if (!M.mendelOk) M.mendelOk = 0;
    if (!M.noAlgae) M.noAlgae = { day: -1, n: 0, best: 0 }; if (!M.mile) M.mile = {}; if (!M.deduce) M.deduce = 0; if (!M.oldest) M.oldest = 0;
    return M;
  },
  /** Dolunay: ay evresi ~29.5 günlük döngüde 14–16. günler, gece 20:00–06:00. */
  fullMoon(clockMin) { const day = Math.floor(clockMin / 1440), hr = (clockMin % 1440) / 60, ph = ((day % 30) + 30) % 30; return ph >= 14 && ph <= 16 && (hr >= 20 || hr < 6); },
  moonPhase(clockMin) { const ph = (Math.floor(clockMin / 1440) % 30 + 30) % 30; return ph >= 14 && ph <= 16 ? '🌕 Dolunay' : ph < 3 || ph > 27 ? '🌑 Yeni ay' : ph < 14 ? '🌓 Büyüyen ay' : '🌗 Küçülen ay'; },
  lineOf(c, S = Game.S) { const b = c.breed(); return b ? Meta.ensure(S).lines.find((l) => l.sp === c.species && l.bid === b.id) : null; },

  /* ---------- Doğum kancası: Mendel, Rili, gizli varyasyonlar ---------- */
  isAlbinoHet(g) { const b = g && g.auto && g.auto.body; return !!b && b.includes('alb') && b.includes('W'); },
  isAlbino(g) { const b = g && g.auto && g.auto.body; return !!b && b[0] === 'alb' && b[1] === 'alb'; },
  iwTank(S) { try { const sc = S.scape; return sc.items.some((i) => i.d === 'seiryu') && Judge.score('iwagumi', S).crit.find((c) => c.k === 'style').v >= 80; } catch (e) { return false; } },
  onBirth(res) {
    if (!res || !res.kept || !res.kept.length) return; const S = Game.S, M = this.ensure(S), rec = Pedigree.rec, iw = this.iwTank(S);
    for (const k of res.kept) {
      const sg = rec[k.sire] && rec[k.sire].g, dg = rec[k.dam] && rec[k.dam].g;
      // Mendel'in Torunu: iki heterozigot albino ebeveynden ≥16 yavruda ~%25 albino
      if (k.species === 'guppy' && this.isAlbinoHet(sg) && this.isAlbinoHet(dg)) {
        const key = k.sire + '-' + k.dam, m = M.mendel[key] || (M.mendel[key] = { n: 0, a: 0, ok: 0 }); m.n++; if (this.isAlbino(k.genome)) m.a++;
        if (!m.ok && m.n >= 16 && m.a / m.n >= 0.15 && m.a / m.n <= 0.38) { m.ok = 1; M.mendelOk++; Game.notify('mendel', `Mendel 3:1 oranını gözlemledin (${m.a}/${m.n} albino)!`); UI.toast('🧬 Mendel 3:1 oranını gözlemledin!', 'star', 4000); Ach.check(); }
      }
      if (k.species === 'shrimp' && k.pheno && k.pheno.rili) Game.S.cnt.rili = (Game.S.cnt.rili || 0) + 1;
      // gizli varyasyonlar
      const r = rec[k.id]; if (r) r.iw = iw ? Math.min((rec[k.sire] && rec[k.sire].iw) || 0, (rec[k.dam] && rec[k.dam].iw) || 0) + 1 : 0;
      let sec = null;
      if (k.species === 'guppy' && this.isAlbino(k.genome) && this.fullMoon(k.bornT)) sec = 'moon';
      else if (k.species === 'guppy' && r && r.iw >= 3 && ['blue_body', 'blue_tail', 'moscow_blue'].includes((k.breed() || {}).id)) sec = 'seiryu';
      if (sec) this.grantSecret(k, sec);
    }
  },
  grantSecret(c, key) {
    const S = Game.S, M = this.ensure(S), d = SECRETS[key]; M.secrets[c.id] = key; const first = !M.found[key]; M.found[key] = 1;
    c.boostUntil = 1e12; c.name += ' ✨'; Game.addXp(first ? 200 : 40); Game.notify('secret', `Gizli varyasyon: ${d.name}!`); UI.toast(`${d.emo} Gizli varyasyon: ${d.name}!`, 'star', 5000); AudioSys.SFX.discover(4); Ach.check();
  },

  /* ---------- Genetik Defter: tahminler ---------- */
  options(c) {
    const set = new Set(Genetics.carried(c.genome)); for (const id in Pedigree.rec) { const g = Pedigree.rec[id].g; if (g && g.sex === 'F' && (g.sp || 'guppy') === c.species) Genetics.carried(g).forEach((x) => set.add(x)); }
    for (const x of Game.tank.creatures) if (x.species === c.species && x.sex === 'F') Genetics.carried(x.genome).forEach((o) => set.add(o));
    return [...set].sort();
  },
  addNote(c, yes, opts) { const M = this.ensure(); M.notes.push({ id: Date.now() + '' + c.id, fid: c.id, name: c.name, sp: c.species, opts, yes, t: Game.S.clockMin, done: 0 }); Game.save(); },
  grade(c) {
    const M = this.ensure(); const actual = Genetics.carried(c.genome);
    for (const n of M.notes) {
      if (n.fid !== c.id || n.done) continue;
      const ok = n.opts.filter((o) => n.yes.includes(o) === actual.includes(o)).length, all = ok === n.opts.length; n.done = 1; n.ok = ok; n.total = n.opts.length; n.actual = actual;
      Game.addXp(ok * 6 + (all ? 40 : 0)); if (all && n.total >= 2) { M.deduce++; Ach.check(); }
      Game.notify('note', `${n.name}: tahminlerin ${ok}/${n.total} doğru${all ? ' — tam isabet!' : ''}`); UI.toast(`📝 ${n.name}: ${ok}/${n.total} doğru tahmin${all ? '!' : ''}`, all ? 'star' : 'check', 4000);
    }
  },

  /* ---------- Koleksiyon kilometre taşları ---------- */
  mileInfo(S = Game.S) {
    const M = this.ensure(S);
    return SPECIES.map((sp) => { const L = breedsOf(sp.id), f = L.filter((b) => S.discovered[b.id]).length, p = L.length ? f / L.length : 0;
      return { sp, f, n: L.length, p, tiers: MILESTONES.map((t, i) => ({ t, i, key: sp.id + ':' + t, got: !!M.mile[sp.id + ':' + t], can: !M.mile[sp.id + ':' + t] && p >= t - 1e-9 })) }; }).filter((r) => r.n > 0);
  },
  claimMile(key) {
    const S = Game.S, M = this.ensure(S), [, t] = key.split(':'), i = MILESTONES.indexOf(+t); if (M.mile[key] || i < 0) return false;
    const [sid] = key.split(':'), info = this.mileInfo(S).find((r) => r.sp.id === sid); if (!info || info.p < +t - 1e-9) return false;
    M.mile[key] = 1; const r = { coins: [100, 250, 500, 1200][i], xp: [40, 90, 160, 400][i], rep: [1, 2, 4, 10][i], stone: i === 3 ? 2 : 0 }; Game.addCoins(r.coins, true); Game.addXp(r.xp); S.rep += r.rep; S.stone = (S.stone || 0) + r.stone; Game.save(); return r;
  },
};

/* ---------- Başarımlar ---------- */
ACHIEVEMENTS.push(
  { id: 'mendel', name: 'Mendel\'in Torunu', ic: '🧬', desc: 'Bir F2 grubunda albino 3:1 oranını gözlemle', tiers: [1, 3, 10], get: (S) => Depth.ensure(S).mendelOk },
  { id: 'rili', name: 'Rili Ustası', ic: '🦐', desc: 'Rili desenli karides yavrusu yetiştir', tiers: [1, 10, 50], get: (S) => S.cnt.rili || 0 },
  { id: 'glow', name: 'Karanlıkta Parlayan', ic: '✨', desc: 'Efsanevi veya Mitik varyasyon keşfet', tiers: [1, 2, 4], get: (S) => ALL_BREEDS.filter((b) => b.rarity >= 3 && S.discovered[b.id]).length },
  { id: 'noalg', name: 'Sıfır Yosun', ic: '🫧', desc: 'Ardışık gün yosunsuz tank', tiers: [7, 30, 90], get: (S) => Depth.ensure(S).noAlgae.best },
  { id: 'legacy', name: 'Büyükbabanın Mirası', ic: '📜', desc: 'Dedenin hattını bul, şampiyona ve 3 sabit hat', tiers: [1, 2, 3], get: (S) => { const M = Meta.ensure(S); return (M.story.claimed[6] ? 1 : 0) + (M.story.claimed[7] ? 1 : 0) + (M.lines.length >= 3 ? 1 : 0); } },
  { id: 'deduce', name: 'Genetik Dedektif', ic: '📝', desc: 'Defterde tam isabetli tahmin', tiers: [1, 5, 20], get: (S) => Depth.ensure(S).deduce },
  { id: 'secret', name: 'Sır Avcısı', ic: '🔍', desc: 'Gizli varyasyon keşfet', tiers: [1, 2, 3], get: (S) => Object.keys(Depth.ensure(S).found).length },
);

/* ---------- Oyuna bağlama ---------- */
(function hook() {
  const bb = Breeding.birth; Breeding.birth = function () { const r = bb.apply(this, arguments); try { Depth.onBirth(r); } catch (e) { console.warn('Derinlik kancası', e); } return r; };
  const tc = Game.testCreature; Game.testCreature = function (c) { const was = c.tested, r = tc.apply(this, arguments); if (r && !was && c.tested) { try { Depth.grade(c); } catch (e) { console.warn('Defter', e); } } return r; };
  const px = Market.price; Market.price = function (c) { const M = Depth.ensure(); let m = M.secrets[c.id] ? 3 : 1; if (Depth.lineOf(c)) m *= 1.25; return Math.max(3, Math.round(px.call(this, c) * m)); };
  const dt = Game.dayTick; Game.dayTick = function () {
    const r = dt.apply(this, arguments); const S = this.S; if (!S) return r; const M = Depth.ensure(S), day = Math.floor(S.clockMin / 1440);
    if (M.noAlgae.day !== day) {
      if (M.noAlgae.day >= 0) { const al = Chem.w.algae, clean = Math.max(al.green, al.hair, al.bba, al.cyano, al.gw) < 0.05; M.noAlgae.n = clean ? M.noAlgae.n + 1 : 0; M.noAlgae.best = Math.max(M.noAlgae.best, M.noAlgae.n); }
      M.noAlgae.day = day; M.oldest = Math.max(M.oldest, ...this.tank.creatures.map((c) => Math.floor(c.ageDays()))); Ach.check();
    }
    return r;
  };
})();

/* ---------- Arayüz ---------- */
Object.assign(UI, {
  legacyNotes() {
    const S = Game.S, M = Depth.ensure(S), pend = M.notes.filter((n) => !n.done), done = M.notes.filter((n) => n.done).slice().reverse();
    return h('div.stack', null, h('div.small.muted', null, 'Genetik Defter: dişilerin taşıdığı gizli genleri tahmin et, sonra genotip testi yaptırarak doğrula. Her doğru tahmin XP verir; hepsi doğruysa bonus!'),
      h('button.btn.primary', { onclick: () => UI.pickNote() }, 'Yeni tahmin yaz'),
      pend.length ? h('div.stack', null, h('b', null, 'Bekleyen tahminler (test edilince değerlendirilir)'), ...pend.map((n) => h('div.card.small', null, h('b', null, n.name), h('span.muted', null, ` — taşıyor dediklerin: ${n.yes.length ? n.yes.join(', ') : 'hiçbiri'}`)))) : null,
      done.length ? h('div.stack', null, h('b', null, 'Değerlendirilenler'), ...done.map((n) => h('div.card.small', null, h('b', null, `${n.name}: ${n.ok}/${n.total}`), h('div.muted', null, `Gerçek: ${n.actual.length ? n.actual.join(', ') : 'taşıdığı gizli gen yok'}`)))) : null,
      !pend.length && !done.length ? UI.emptyState('📝', 'Henüz tahmin yok', 'Bir dişi seç, hangi gizli genleri taşıdığını tahmin et.') : null);
  },
  pickNote() {
    const pending = new Set(Depth.ensure().notes.filter((n) => !n.done).map((n) => n.fid)), list = Game.tank.creatures.filter((c) => c.sex === 'F' && !c.tested && !pending.has(c.id));
    const rec = UI.sheet(h('div', null, UI.sheetHead('Tahmin: hangi dişi?', { close: () => rec.close() }), h('div.small.muted', null, 'Yalnızca henüz test edilmemiş dişiler.'),
      list.length ? list.map((c) => h('div.fish-row', { role: 'button', onclick: () => { rec.close(); UI.noteSheet(c); } }, UI.thumbCv(c, 84), h('div', null, h('b', null, c.name), h('div.small.muted', null, c.breed() ? c.breed().name : '?')))) : UI.emptyState('🐟', 'Uygun dişi yok', 'Test edilmemiş bir dişin gerekir.')));
  },
  noteSheet(c) {
    const opts = Depth.options(c), yes = new Set(); const box = h('div.stack');
    const draw = () => box.replaceChildren(...opts.map((o) => h('label.set-row', null, h('span', null, o), h('input', { type: 'checkbox', checked: yes.has(o) ? true : null, onchange: (e) => { e.target.checked ? yes.add(o) : yes.delete(o); } }))));
    draw(); const rec = UI.sheet(h('div.stack', null, UI.sheetHead(`${c.name}: taşıyor mu?`, { close: () => rec.close() }), h('div.small.muted', null, opts.length ? 'Taşıdığını düşündüklerini işaretle. Seçenekler, soyağacında ve tankında görülen genlerden gelir.' : 'Henüz tahmin edilebilecek gen görülmedi; önce birkaç dişi gözle.'),
      box, h('button.btn.primary', { disabled: opts.length ? null : true, onclick: () => { Depth.addNote(c, [...yes], opts); rec.close(); UI.render_legacy($('#s-legacy')); UI.toast('Tahmin deftere yazıldı. Test ettirince değerlendirilir.', 'check', 3500); } }, 'Deftere yaz')));
  },
  legacySecrets() {
    const S = Game.S, M = Depth.ensure(S), fr = (id) => Meta.friendLv(M.friend[id]), lessons = Object.keys(S.lessons || {}).length;
    const hints = Object.entries(SECRETS).map(([k, d]) => ({ k, d, open: fr(d.hint.npc) >= d.hint.lv }));
    return h('div.stack', null, h('div.small.muted', null, `Gizli varyasyonlar özel koşul ister. İpuçları dostluk seviyeni artırdıkça ve ders bitirdikçe açılır. Bugünün ay evresi: ${Depth.moonPhase(S.clockMin)}.`),
      ...hints.map(({ k, d, open }) => h('div.card.row', null, h('div', { style: { fontSize: '30px' } }, M.found[k] ? d.emo : '❔'), h('div.sp', null, h('b', null, M.found[k] ? d.name : '??? Gizli varyasyon'), h('div.small.muted', null, M.found[k] ? d.how : open ? `${STORY_NPCS[d.hint.npc].emo} ${d.hint.text}` : `${STORY_NPCS[d.hint.npc].name} ile dostluk seviyesi ${d.hint.lv} olunca ipucu açılır.`)))),
      h('div.card.row', null, h('div', { style: { fontSize: '30px' } }, '📖'), h('div.sp', null, h('b', null, 'Kitap notu'), h('div.small.muted', null, lessons >= SECRET_BOOK.lessons ? SECRET_BOOK.text : `${SECRET_BOOK.lessons} Genetik Okulu dersi bitirince açılır (${lessons}/${SECRET_BOOK.lessons}).`))));
  },
  mileCard() {
    const S = Game.S, rows = Depth.mileInfo(S);
    return h('div.card.stack', null, h('h3', null, '🏅 Koleksiyon ödülleri'), h('div.small.muted', null, 'Her türde %25 / %50 / %75 / %100 keşif için ödül.'),
      ...rows.map((r) => h('div', null, h('div.row.small', null, h('b', { style: { flex: 1 } }, r.sp.name), h('span.muted', null, `${r.f}/${r.n}`)),
        h('div.row', { style: { gap: '6px', flexWrap: 'wrap' } }, ...r.tiers.map((t) => h('button.btn.sm' + (t.can ? '.primary' : ''), { disabled: t.can ? null : true, onclick: () => { const rw = Depth.claimMile(t.key); if (rw) { AudioSys.SFX.coin(); UI.toast(`+${rw.coins} 💰 +${rw.xp} XP${rw.stone ? ' +' + rw.stone + ' 💎' : ''}`, 'gift', 3000); UI.refreshTop(); UI.render_dex($('#s-dex')); } } }, t.got ? '✔ ' + t.t * 100 + '%' : t.t * 100 + '%'))))));
  },
});

/* Koleksiyon ödülleri: Ansiklopedi'nin altına */
UI.render_dex = ((orig) => function (el) { const r = orig.apply(this, arguments); const w = el.querySelector('.wrap') || el.firstElementChild; if (w && UI.dexTab === 'fish') w.append(UI.mileCard()); return r; })(UI.render_dex);

/* Profil: onur listesi, ek istatistikler */
UI.render_profile = ((orig) => function (el) {
  const r = orig.apply(this, arguments), S = Game.S, M = Depth.ensure(S);
  const hall = [...el.querySelectorAll('.muted.small')].find((x) => /sabit hatlar burada/.test(x.textContent));
  if (hall) hall.replaceChildren(...(M.lines.length ? M.lines.map((l) => h('div', { style: { margin: '4px 0' } }, '🧬 ', h('b', null, l.name), ` — ${l.bn} (%${l.rate} saf, +%25 satış)`)) : ['Kendi adını verdiğin sabit hatlar burada görünecek. (Miras > Hatlar)']));
  const g = el.querySelector('.grid2'), stat = (v, l) => h('div.stat', null, h('b', null, v), h('div.small.muted', null, l));
  if (g) g.append(stat(M.lines.length, 'Sabit hat'), stat(M.shows.wins + ' / ' + M.shows.podium, 'Birincilik / podyum'), stat(Math.max(M.oldest, ...Game.tank.creatures.map((c) => Math.floor(c.ageDays()))) + ' gün', 'En uzun yaşayan'), stat(Object.keys(M.found).length + '/' + Object.keys(SECRETS).length, 'Gizli varyasyon'));
  return r;
})(UI.render_profile);
