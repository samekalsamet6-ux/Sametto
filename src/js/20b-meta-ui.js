'use strict';
/* =====================================================================
   20b · META EKRANLARI — Hikâye, Yarışma, Sezon, Miras (hatlar/defter/prestij)
   ===================================================================== */
const themedScape = (st) => ({ spring: 'dutch', summer: 'jungle', autumn: 'nature', winter: 'iwagumi' })[Season.theme().id] === st;

Object.assign(UI, {
  mtBar(v, goal, color) { return h('div.mt-bar', null, h('i', { style: { width: Math.round(clamp(v / goal, 0, 1) * 100) + '%', background: color || 'var(--accent)' } })); },

  /** Konuşma penceresi: dokununca metin tamamlanır / sonraki sayfa. */
  dialog(npcId, pages, done) {
    const np = STORY_NPCS[npcId], txt = h('div.mt-say', null, ''), hint = h('div.tiny.muted', { style: { textAlign: 'right' } }, 'Dokun ▸'); let i = 0, tm = 0, full = '';
    const show = () => { full = pages[i]; let k = 0; clearInterval(tm); txt.textContent = ''; tm = setInterval(() => { k += 2; txt.textContent = full.slice(0, k); if (k >= full.length) clearInterval(tm); }, 22); };
    const rec = UI.sheet(h('div.stack', { onclick: () => { if (txt.textContent.length < full.length) { clearInterval(tm); txt.textContent = full; return; } i++; if (i >= pages.length) { clearInterval(tm); rec.close(); done && done(); } else { AudioSys.SFX.tick(); show(); } } },
      h('div.row', null, h('div', { style: { fontSize: '44px' } }, np.emo), h('b', null, np.name)), txt, hint));
    show();
  },

  /* ---------- Hikâye ---------- */
  render_story(el) {
    const S = Game.S, M = Meta.ensure(S);
    const npcCards = Object.entries(STORY_NPCS).map(([id, np]) => { const pts = M.friend[id], lv = Meta.friendLv(pts), nxt = FRIEND_AT[lv + 1];
      return h('div.card.row', null, h('div', { style: { fontSize: '34px' } }, np.emo), h('div.sp', null, h('b', null, np.name, ' ', h('span.pill', null, FRIEND_NAMES[lv])), h('div.tiny.muted', null, np.perk + ` (şu an +${Math.round((Meta.mult(np.lv) - 1) * 100 - (np.lv === 'sell' ? Math.min(30, 3 * (M.prestige.n || 0)) : np.lv === 'xp' ? Math.min(50, 5 * (M.prestige.n || 0)) : 0))}%)`), UI.mtBar(pts, nxt || pts || 1, '#ff9eb5'))); });
    const chs = CHAPTERS.map((ch) => { const st = Meta.chapterState(ch), np = STORY_NPCS[ch.npc];
      const goals = ch.goals.map((g) => { const v = Math.min(g.goal, g.get(S)); return h('div', { style: { margin: '4px 0' } }, h('div.small', null, (v >= g.goal ? '✔ ' : '• ') + g.t + ` (${v}/${g.goal})`), UI.mtBar(v, g.goal)); });
      const act = st === 'ready' ? h('button.btn.primary', { onclick: () => UI.dialog(ch.npc, ch.outro, () => { if (Meta.claimChapter(ch)) { AudioSys.SFX.discover(2); UI.toast(`Bölüm tamamlandı! +${ch.reward.coins} 💰`, 'star', 4000); UI.render_story(el); } }) }, 'Bölümü bitir')
        : st === 'open' ? h('button.btn.sm', { onclick: () => UI.dialog(ch.npc, ch.intro) }, 'Konuşmayı oku') : null;
      return h('div.card' + (st === 'done' ? '.done' : ''), { style: { opacity: st === 'locked' || st === 'lvl' ? 0.55 : 1 } }, h('div.row', null, h('div', { style: { fontSize: '30px' } }, np.emo), h('div.sp', null, h('b', null, `Bölüm ${ch.id}: ${ch.title}`), h('div.tiny.muted', null, st === 'locked' ? 'Önceki bölümü bitir.' : st === 'lvl' ? `Seviye ${ch.lvl} gerekir.` : st === 'done' ? 'Tamamlandı ✔' : `Ödül: ${ch.reward.coins} 💰 · ${ch.reward.xp} XP`))),
        st === 'open' || st === 'ready' ? h('div', { style: { marginTop: '6px' } }, ...goals, act) : null); });
    el.replaceChildren(h('div.wrap.stack', null, h('h2', { style: { margin: '6px 2px 2px' } }, 'Hikâye'), h('div.small.muted', null, 'Dedenin dükkânından ulusal şampiyonluğa. Acele yok; kendi hızında ilerle.'), ...npcCards, h('h3', { style: { margin: '8px 2px 0' } }, 'Bölümler'), ...chs));
  },

  /* ---------- Karne animasyonu ---------- */
  scorecard(title, sub, crit, total, res, onClose) {
    const rows = crit.map((c) => ({ c, fill: h('i', { style: { width: '0%' } }), num: h('b', null, '–') })), tot = h('div.mt-total', null, '0'), rank = h('div.stack', { style: { opacity: 0, transition: 'opacity .6s' } });
    const rec = UI.sheet(h('div.stack', null, UI.sheetHead(title, { close: () => { rec.close(); onClose && onClose(); } }), h('div.small.muted', null, sub),
      ...rows.map((r) => h('div.mt-sc' + (r.c.main ? '.main' : ''), null, h('div.row', null, h('span.sp', null, r.c.name), r.num), h('div.mt-bar', null, r.fill))), h('div.row', { style: { justifyContent: 'center', gap: '8px' } }, h('span.muted', null, 'Toplam'), tot), rank));
    rows.forEach((r, i) => setTimeout(() => { if (rec.closed) return; r.fill.style.width = r.c.v + '%'; r.num.textContent = r.c.v; AudioSys.SFX.tick(); }, 500 + i * 650));
    setTimeout(() => { let n = 0; const step = Math.max(1, Math.round(total / 18)), iv = setInterval(() => { n = Math.min(total, n + step); tot.textContent = n; if (n >= total) clearInterval(iv); }, 40); }, 500 + rows.length * 650);
    if (res) setTimeout(() => {
      const list = [...res.rivals.map((r) => ({ name: r.emo + ' ' + r.name, score: r.score })), { name: '⭐ Sen', score: total, me: true }].sort((a, b) => b.score - a.score);
      rank.replaceChildren(h('b', null, 'Sıralama'), ...list.map((r, i) => h('div.row.small' + (r.me ? '.mt-me' : ''), null, h('span', { style: { width: '24px' } }, i + 1 + '.'), h('span.sp', null, r.name), h('b', null, r.score))),
        h('div.card', { style: { textAlign: 'center' } }, h('div', { style: { fontSize: '40px' } }, ['', '🥇', '🥈', '🥉'][res.place] || '🎗️'), h('b', null, `${res.place}. oldun!`), h('div.small', null, `+${res.rw.coins} 💰 · +${res.rw.xp} XP${res.rw.rep ? ` · +${res.rw.rep} itibar` : ''}`)));
      rank.style.opacity = 1; res.place <= 3 ? AudioSys.SFX.discover(res.place === 1 ? 3 : 2) : AudioSys.SFX.coin();
    }, 1100 + rows.length * 650);
  },

  /* ---------- Yarışma ---------- */
  contestTab: 'fish', judgeStyle: 'nature',
  render_contest(el) {
    const S = Game.S, M = Meta.ensure(S), ed = Contest.edition(S), cat = Contest.fishCat(ed), sty = Contest.scapeStyle(ed), th = Season.theme(), hall = Research.has('hall'), daysLeft = 7 - (Math.floor(S.clockMin / 1440) % 7);
    let body;
    const locked = h('div.card', null, h('b', null, '🔒 Sergi Salonu gerekli'), h('div.small.muted', null, 'Yarışmalara katılmak için Araştırma ağacından "Sergi salonu"nu aç (80 itibar). Jüri puanını yine de deneyebilirsin.'), h('button.btn.sm', { onclick: () => UI.go('research') }, 'Araştırmaya git'));
    if (this.contestTab === 'fish') {
      const done = Contest.entered('f'), themed = th.cat === cat.id;
      body = h('div.stack', null, h('div.card', null, h('div.row', null, h('div', { style: { fontSize: '38px' } }, cat.emo), h('div.sp', null, h('b', null, `Bu haftanın sergisi: ${cat.name}`), h('div.small.muted', null, `${daysLeft} gün kaldı · ana kategori puanın %60'ı${themed ? ' · ' + th.emo + ' sezon bonusu +%25' : ''}`)))),
        hall ? (done ? h('div.card', null, h('b', null, `Bu hafta katıldın: ${done}. oldun`), h('div.small.muted', null, 'Yeni sergi her hafta açılır.')) : h('button.btn.primary', { onclick: () => UI.pickShowFish(cat, themed, el) }, 'Balık kaydet')) : locked,
        h('div.small.muted', null, 'Rakipler seviyene göre güçlenir. Sergi puanı: seçili kategori %60, diğerleri %40. Yetişkin ve sağlıklı balıklar katılabilir.'));
    } else if (this.contestTab === 'scape') {
      const J = Judge.score(this.judgeStyle, S); M.best[this.judgeStyle] = Math.max(M.best[this.judgeStyle] || 0, J.total);
      const done = Contest.entered('s'), canEnter = hall && !done && this.judgeStyle === sty;
      body = h('div.stack', null, h('div.card', null, h('div.row', null, h('div', { style: { fontSize: '38px' } }, STYLES[sty].emo), h('div.sp', null, h('b', null, `Bu haftanın teması: ${STYLES[sty].name}`), h('div.small.muted', null, `${daysLeft} gün kaldı${themedScape(sty) ? ' · ' + th.emo + ' sezon bonusu +%25' : ''}`)))),
        UI.tabs(Object.entries(STYLES).map(([k, s]) => [k, s.emo + ' ' + s.name]), this.judgeStyle, (k) => { this.judgeStyle = k; UI.render_contest(el); }),
        h('div.card', null, h('b', null, `Jüri ön izleme: ${STYLES[this.judgeStyle].name} — ${J.total}/100`), h('div.small.muted', null, STYLES[this.judgeStyle].desc),
          ...J.crit.map((c) => h('div', { style: { margin: '5px 0' } }, h('div.row.small', null, h('span.sp', null, c.name), h('b', null, c.v)), UI.mtBar(c.v, 100))),
          J.notes.length ? h('div.small', { style: { marginTop: '6px' } }, h('b', null, 'Jüri notları'), ...J.notes.map((n) => h('div', null, '• ' + n))) : h('div.small', { style: { color: 'var(--ok)' } }, 'Jüri notu yok: harika!')),
        hall ? (done ? h('div.card', null, h('b', null, `Bu hafta katıldın: ${done}. oldun`)) : h('button.btn.primary', { disabled: canEnter ? null : true, onclick: () => UI.enterScape(el, sty) }, canEnter ? 'Yarışmaya gir' : 'Haftanın temasını seç')) : locked);
    } else {
      body = h('div.stack', null, h('div.small.muted', null, `Toplam katılım ${M.shows.count} · podyum ${M.shows.podium} · birincilik ${M.shows.wins}`),
        M.trophies.length ? h('div.trophy-grid', null, ...M.trophies.slice().reverse().map((t) => h('div.card', { style: { textAlign: 'center' } }, h('div', { style: { fontSize: '34px' } }, ['', '🥇', '🥈', '🥉'][t.place]), h('div.small', null, h('b', null, t.name)), h('div.tiny.muted', null, `${t.score} puan · gün ${Math.floor(t.t / 1440) + 1}`)))) : UI.emptyState('🏆', 'Kupa dolabı boş', 'Bir yarışmada ilk üçe girince kupan burada sergilenir.'));
    }
    el.replaceChildren(h('div.wrap.stack', null, h('h2', { style: { margin: '6px 2px 2px' } }, 'Yarışmalar'), UI.tabs([['fish', '🐟 Sergi'], ['scape', '🌿 Aquascape'], ['trophy', '🏆 Kupalar']], this.contestTab, (k) => { this.contestTab = k; UI.render_contest(el); }), body));
  },
  pickShowFish(cat, themed, el) {
    const list = Game.tank.creatures.filter((c) => ShowJudge.eligible(c)).map((c) => ({ c, s: ShowJudge.score(c, cat.id) })).sort((a, b) => b.s.total - a.s.total);
    const rec = UI.sheet(h('div', null, UI.sheetHead(`${cat.emo} ${cat.name} sergisi`, { close: () => rec.close() }), h('div.small.muted', null, 'Tahmini puana göre sıralı. Yalnızca yetişkin ve sağlıklı balıklar.'),
      list.length ? list.map(({ c, s }) => h('div.fish-row', { role: 'button', onclick: () => UI.confirm(`${c.name} sergiye girsin mi?`, `Tahmini puan ${s.total}. Bu hafta yalnızca bir balık katılabilir.`, () => { rec.close(); const res = Contest.finish('f', `${cat.name} Sergisi`, s.total, themed); UI.scorecard(`${c.name}: ${cat.name}`, 'Jüri değerlendiriyor…', s.crit, s.total, res, () => UI.render_contest(el)); }) },
        UI.thumbCv(c, 84), h('div', null, h('b', null, c.name), h('div.small.muted', null, `${c.breed() ? c.breed().name : '?'} · tahmin ${s.total}`))) ) : UI.emptyState('🐟', 'Uygun balık yok', 'Yetişkin, hasta olmayan ve karantinada olmayan bir balık gerekir.')));
  },
  enterScape(el, sty) {
    const J = Judge.score(sty), M = Meta.ensure(Game.S); M.best[sty] = Math.max(M.best[sty] || 0, J.total); Ach.check();
    const res = Contest.finish('s', `${STYLES[sty].name} Yarışması`, J.total, themedScape(sty));
    UI.scorecard(`${STYLES[sty].emo} ${STYLES[sty].name} Yarışması`, 'Jüri tankı inceliyor…', J.crit, J.total, res, () => UI.render_contest(el));
  },

  /* ---------- Sezon ---------- */
  render_season(el) {
    const S = Game.S, M = Meta.ensure(S), s = Season.ensure(S), th = Season.theme(S), tiers = [];
    for (let i = 0; i < SEASON_TIERS; i++) { const need = (i + 1) * SEASON_PTS, r = Season.reward(i), got = s.claimed.includes(i), can = !got && s.pts >= need;
      tiers.push(h('div.card.row' + (got ? '.done' : ''), null, h('div', { style: { fontSize: '26px', width: '34px' } }, got ? '✔' : i + 1), h('div.sp', null, h('b', null, `${r.coins} 💰 · ${r.xp} XP${r.rep ? ' · ' + r.rep + ' itibar' : ''}${r.stone ? ' · ' + r.stone + ' 💎' : ''}`), h('div.tiny.muted', null, `${need} puan${r.title ? ' · unvan: ' + th.name + ' Üstadı' : ''}`)),
        can ? h('button.btn.primary.sm', { onclick: () => { Season.claim(i); AudioSys.SFX.coin(); UI.refreshTop(); UI.render_season(el); } }, 'Al') : got ? h('span.pill', { style: { color: 'var(--ok)' } }, 'Alındı') : h('span.tiny.muted', null, `${Math.max(0, need - s.pts)} kaldı`))); }
    const arch = M.archive.length ? M.archive.slice().reverse().map((a) => { const t = SEASON_THEMES[a.idx % 4], key = 's' + a.idx, own = M.badges.includes(key);
      return h('div.card.row', null, h('div', { style: { fontSize: '28px' } }, t.badge), h('div.sp', null, h('b', null, `${t.name} (Yıl ${1 + Math.floor(a.idx / 4)})`), h('div.tiny.muted', null, `${a.pts} puan · ${a.tiers} kademe`)),
        own ? h('span.pill', null, 'Sende') : h('button.btn.sm', { onclick: () => { if ((S.stone || 0) < Season.badgeCost) return UI.toast('Yeterli Yosun Taşı yok', 'bell'); S.stone -= Season.badgeCost; M.badges.push(key); Game.save(); UI.refreshTop(); UI.render_season(el); } }, `${Season.badgeCost} 💎`)); }) : [UI.emptyState('📚', 'Arşiv boş', 'Biten sezonların rozetleri burada her zaman satın alınabilir; hiçbir şey kaçmaz.')];
    el.replaceChildren(h('div.wrap.stack', null,
      h('div.card.mt-season', { style: { '--c': th.col } }, h('div.row', null, h('div', { style: { fontSize: '44px' } }, th.emo), h('div.sp', null, h('b', null, th.name), h('div.small.muted', null, `Yıl ${Season.year(S)} · ${Season.daysLeft(S)} gün kaldı · tema kategorisi: ${SHOW_CATS.find((c) => c.id === th.cat).name}`))), UI.mtBar(s.pts, SEASON_TIERS * SEASON_PTS, th.col), h('div.tiny.muted', null, `${s.pts} / ${SEASON_TIERS * SEASON_PTS} puan · ücretsiz sezon yolu, süre bitince arşive geçer.`)),
      h('div.small.muted', null, 'Puan kaynakları: yem, su değişimi, çiftleştirme, doğum, satış, sipariş, keşif, ders ve yarışmalar.'), ...tiers,
      h('h3', { style: { margin: '8px 2px 0' } }, 'Arşiv Mağazası'), ...arch,
      M.titles.length ? h('div.small', null, '🎖️ Unvanların: ' + M.titles.join(', ')) : null));
  },

  /* ---------- Miras: sabit hatlar, defter, yeni şube ---------- */
  legacyTab: 'lines',
  render_legacy(el) {
    const S = Game.S, M = Meta.ensure(S); let body;
    if (this.legacyTab === 'lines') {
      body = h('div.stack', null, h('div.small.muted', null, 'Sabit Hat: 3 nesil aynı ırkı koruyan erkek soyu ve oğulların ≥%90\'ı aynı ırk çıkan bir çift. En fazla 3 hat; "Yeni Şube"de korunur.'),
        h('button.btn.primary', { onclick: () => UI.pickLine() }, 'Yeni Sabit Hat kaydet'),
        h('h3', { style: { margin: '6px 2px 0' } }, 'Onur Listesi'),
        ...(M.lines.length ? M.lines.map((l) => h('div.card.row', null, h('div', { style: { fontSize: '30px' } }, '🧬'), h('div.sp', null, h('b', null, l.name), h('div.small.muted', null, `${SPECIES.find((s) => s.id === l.sp).name} · ${l.bn} · %${l.rate} saf · gün ${Math.floor(l.t / 1440) + 1}`)))) : [UI.emptyState('🧬', 'Henüz hat yok', 'Aynı ırkı 3 nesil üret ve tutarlılığını kanıtla.')]),
        M.badges.length ? h('div.small', null, '🏷️ Sezon rozetleri: ' + M.badges.map((k) => SEASON_THEMES[+k.slice(1) % 4].badge).join(' ')) : null);
    } else if (this.legacyTab === 'ledger') {
      body = h('div.stack', null, h('div.small.muted', null, 'Genetik Defter: yaptığın son çiftleştirmeler.'),
        ...(M.ledger.length ? M.ledger.slice().reverse().map((e) => h('div.card.small', null, h('b', null, `${e.m} × ${e.f}`), h('span.muted', null, ` — ${e.b} · gün ${Math.floor(e.t / 1440) + 1}`))) : [UI.emptyState('📓', 'Defter boş', 'Laboratuvarda bir çift eşleştirince burada kayıt tutulur.')]));
    } else {
      const can = Prestige.can(S), n = M.prestige.n;
      body = h('div.stack', null, h('div.card', null, h('b', null, `🏪 Yeni Şube (${n} kez açıldı)`), h('div.small.muted', null, `Şampiyona hikâyesini bitirince (veya 100. seviyede) açılır. Kalıcı bonus: satış +%${Math.min(30, 3 * n)}, XP +%${Math.min(50, 5 * n)}, başlangıç parası +${250 * n}. Korunanlar: ansiklopedi, başarımlar, unvanlar, kupalar, 3 Sabit Hat (çiftleriyle birlikte), Yosun Taşı. Sıfırlananlar: para, seviye, tank, araştırma.`)),
        ...BRANCHES.map((b) => h('div.card.row', null, h('div', { style: { fontSize: '30px' } }, b.emo), h('div.sp', null, h('b', null, b.name), h('div.small.muted', null, b.desc)), h('button.btn.sm' + (can ? '.coral' : ''), { disabled: can ? null : true, onclick: () => UI.confirm(`${b.name} açılsın mı?`, 'Mevcut dükkân kapanır; ilerleme sıfırlanır (korunanlar hariç). Bu geri alınamaz — önce dışa aktararak yedek alabilirsin.', () => { Prestige.perform(b.id); UI.go('hub'); UI.toast('Yeni şube açıldı! 🎉', 'star', 4000); }) }, can ? 'Aç' : '🔒'))));
    }
    el.replaceChildren(h('div.wrap.stack', null, h('h2', { style: { margin: '6px 2px 2px' } }, 'Miras'), UI.tabs([['lines', '🧬 Hatlar'], ['ledger', '📓 Defter'], ['prestige', '🏪 Yeni Şube']], this.legacyTab, (k) => { this.legacyTab = k; UI.render_legacy(el); }), body));
  },
  pickLine() {
    const sel = { m: null, f: null }, out = h('div.small'), nameIn = h('input', { type: 'text', placeholder: 'Hat adı (isteğe bağlı)', maxlength: 24, style: { width: '100%' } }), box = h('div');
    const draw = () => { const cr = Game.tank.creatures.filter((c) => c.adult());
      box.replaceChildren(...['M', 'F'].map((sx) => h('div', null, h('b', null, sx === 'M' ? 'Erkek' : 'Dişi'), h('div.chips', null, cr.filter((c) => c.sex === sx).map((c) => h('button.sp-chip' + (sel[sx.toLowerCase()] === c ? '.on' : ''), { onclick: () => { sel[sx.toLowerCase()] = c; draw(); } }, `${c.name} · ${c.breed() ? c.breed().name : '?'}`))))));
      const r = sel.m && sel.f ? Lines.check(sel.m, sel.f) : null; out.textContent = r ? (r.ok ? `✔ Uygun: oğulların %${Math.round(r.rate * 100)}'i ${r.breed.name}.` : r.why) : 'Bir erkek ve bir dişi seç.'; out.style.color = r && r.ok ? 'var(--ok)' : ''; };
    const rec = UI.sheet(h('div.stack', null, UI.sheetHead('Sabit Hat kaydet', { close: () => rec.close() }), box, out, nameIn, h('button.btn.primary', { onclick: () => { if (!sel.m || !sel.f) return; const r = Lines.register(sel.m, sel.f, nameIn.value); if (!r.ok) { out.textContent = r.why; return; } rec.close(); AudioSys.SFX.discover(3); UI.toast('Sabit Hat kaydedildi! 🧬', 'star', 3500); UI.render_legacy($('#s-legacy')); } }, 'Kaydet'))); draw();
  },
});
