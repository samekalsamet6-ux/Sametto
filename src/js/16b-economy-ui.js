'use strict';
/* =====================================================================
   16b · İLERLEME EKRANLARI — Görevler, Siparişler, Mağaza, Pazar, Araştırma, Profil
   ===================================================================== */
Object.assign(UI, {
  avatarEl(av, size = 72) {
    const A = Game.AVATAR_DEF, a = av || { f: 0, a: 0, c: 0 };
    return h('div.avatar', { style: { width: size + 'px', height: size + 'px', fontSize: size * 0.52 + 'px', background: A.cols[a.c % A.cols.length], position: 'relative' } }, A.faces[a.f % A.faces.length], a.a ? h('span', { style: { position: 'absolute', right: '-2px', bottom: '-2px', fontSize: size * 0.3 + 'px' } }, A.accs[a.a % A.accs.length]) : null);
  },

  /* ---------- Görevler ---------- */
  questTab: 'daily',
  render_quests(el) {
    const S = Game.S; Quests.refresh(S);
    const qcard = (q, extra) => h('div.card.qcard' + (q.claimed ? '.done' : ''), null, h('div.row', null, h('div.sp', null, h('b', null, q.name), h('div.small.muted', null, `${q.prog}/${q.goal} · ödül ${q.coins} 💰 ${q.xp} XP`)), extra,
      q.claimed ? h('span.pill', { style: { color: 'var(--ok)' } }, '✔') : q.prog >= q.goal ? h('button.btn.primary.sm', { onclick: () => { Quests.claim(S, q); UI.render_quests(el); } }, 'Topla') : h('button.btn.sm', { onclick: () => UI.go(({ feed: 'aq', water: 'aq', inspect: 'aq', zoom: 'aq', prune: 'aq', photo: 'aq', mate: 'lab', born: 'lab', sold: 'market', scape: 'design', test: 'aq', lesson: 'help', order: 'orders', discover: 'lab' })[q.ev] || 'aq') }, 'Git')), h('div.pbar', { style: { marginTop: '8px' } }, h('i', { style: { width: (100 * q.prog / q.goal) + '%' } })));
    let body;
    if (this.questTab === 'daily') body = h('div.stack', null, h('div.small.muted', null, 'Her gün 3 kolay görev. Kaçırırsan ceza yok; yenileri gelir. Bir görevi günde bir kez değiştirebilirsin.'), ...S.dq.list.map((q, i) => qcard(q, S.dq.reroll && !q.claimed && q.prog < q.goal ? h('button.icon-btn', { title: 'Görevi değiştir', 'aria-label': 'Görevi değiştir', onclick: () => { Quests.reroll(S, i); UI.render_quests(el); } }, '🔄') : null)));
    else if (this.questTab === 'weekly') { const done = S.wq.list.filter((q) => q.claimed).length; body = h('div.stack', null, h('div.card.row', null, h('div', { style: { fontSize: '34px' } }, '🎁'), h('div.sp', null, h('b', null, 'Haftalık sandık'), h('div.small.muted', null, `${done}/5 görev tamam — hepsini toplayınca sandık açılır`)), h('button.btn.primary' + (done === 5 && !S.wq.chest ? '' : ''), { disabled: done === 5 && !S.wq.chest ? null : true, onclick: () => { const r = Quests.openChest(S); if (r) UI.chestSheet(r); } }, S.wq.chest ? 'Açıldı' : 'Aç')), ...S.wq.list.map((q) => qcard(q))); }
    else if (this.questTab === 'ach') body = h('div.stack', null, h('div.small.muted', null, 'Kalıcı başarımlar: bronz → gümüş → altın. Her kademe ödül verir.'), ...ACHIEVEMENTS.map((a) => { const v = a.get(S), t = (S.ach || {})[a.id] || 0, nxt = a.tiers[Math.min(2, t)], prev = t > 0 ? a.tiers[t - 1] : 0;
      return h('div.card.row', null, h('div', { style: { fontSize: '30px' } }, a.ic), h('div.sp', null, h('b', null, a.name, ' ', h('span.small', null, ['', '🥉', '🥈', '🥇'][t])), h('div.small.muted', null, a.desc + ` (${Math.min(v, a.tiers[2])}/${t >= 3 ? a.tiers[2] : nxt})`), h('div.pbar', { style: { marginTop: '6px' } }, h('i', { style: { width: (t >= 3 ? 100 : clamp(100 * (v - prev) / (nxt - prev), 0, 100)) + '%' } })))); }));
    else body = h('div.stack', null, ...Game.TASKS.map((t) => { const pr = S.tasks[t.id] || 0, done = pr >= t.goal, cl = S.claimed[t.id]; return h('div.card.row', null, h('div.sp', null, h('b', null, t.name), h('div.small.muted', null, `${t.desc} (${Math.min(pr, t.goal)}/${t.goal})`), h('div.tiny', { style: { color: 'var(--accent)' } }, `Ödül: ${t.coins} 💰 · ${t.xp} XP`)), cl ? h('span.pill', { style: { color: 'var(--ok)' } }, '✔') : done ? h('button.btn.primary.sm', { onclick: () => { Game.claimTask(t); UI.render_quests(el); } }, 'Topla') : h('button.btn.sm', { onclick: () => UI.go(t.go) }, 'Git')); }));
    el.replaceChildren(h('div.wrap', null, h('h2', { style: { margin: '6px 2px 8px' } }, 'Görevler'), UI.tabs([['daily', 'Günlük'], ['weekly', 'Haftalık'], ['ach', 'Başarımlar'], ['start', 'Başlangıç']], this.questTab, (k) => { this.questTab = k; UI.render_quests(el); }), body));
  },
  chestSheet(items) {
    const box = h('div', { style: { fontSize: '90px', textAlign: 'center', animation: 'shake 0.6s ease 2' } }, '🎁'), list = h('div.stack');
    const rec = UI.sheet(h('div.stack', null, UI.sheetHead('Haftalık sandık', { close: () => rec.close() }), box, list, h('button.btn.primary', { onclick: () => rec.close() }, 'Harika!')));
    AudioSys.SFX.discover(2); setTimeout(() => { box.textContent = '✨'; items.forEach((t, i) => setTimeout(() => list.append(h('div.card', { style: { textAlign: 'center', animation: 'rise .5s var(--ease) both' } }, t)), i * 260)); }, 1100);
  },

  /* ---------- Siparişler ---------- */
  render_orders(el) {
    const S = Game.S; Orders.refresh(S); const O = S.orders;
    el.replaceChildren(h('div.wrap.stack', null, h('h2', { style: { margin: '6px 2px 2px' } }, 'Sipariş Panosu'), h('div.small.muted', null, 'Müşteriler belirli balıklar istiyor. Süresi dolan siparişin cezası yok; her gün yenileri gelir.'),
      ...(O.list.length ? O.list.map((o) => { const left = o.until - S.clockMin, match = Game.tank.creatures.filter((c) => Orders.matches(o, c));
        return h('div.card', null, h('div.row', null, h('div', { style: { fontSize: '40px' } }, o.emo), h('div.sp', null, h('b', null, o.npc), h('div', null, 'İstek: ', h('b', null, o.text)), h('div.small.muted', null, `Süre: ${UI.daysLeft(left)} · Ödül: ${o.reward} 💰 + ${o.rep} İtibar`)),
          h('button.btn.primary', { disabled: match.length ? null : true, onclick: () => UI.pickOrder(o, match, el) }, match.length ? `Teslim (${match.length})` : 'Uygun yok'))); }) : [UI.emptyState('📦', 'Şu an sipariş yok', 'Yarın yeni siparişler gelir.')])));
  },
  pickOrder(o, list, el) {
    const rec = UI.sheet(h('div', null, UI.sheetHead(`${o.npc}: ${o.text}`, { close: () => rec.close() }), ...list.map((c) => h('div.fish-row', { role: 'button', onclick: () => UI.confirm(`${c.name} teslim edilsin mi?`, `${o.reward} Altın Pul + ${o.rep} İtibar kazanırsın; balık gider.`, () => { rec.close(); Orders.deliver(o, c); UI.render_orders(el); }) }, UI.thumbCv(c, 84), h('div.sp', null, h('b', null, c.name), h('div.small.muted', null, c.breed().name)), UI.rarityPill(c.rarity())))));
  },

  /* ---------- Mağaza ---------- */
  shopTab: 'live',
  render_shop(el) {
    const S = Game.S, lvl = Progress.level(S.xp), tabs = [['live', 'Canlı'], ['plant', 'Bitki'], ['hard', 'Taş&Kök'], ['sub', 'Zemin'], ['equip', 'Ekipman'], ['food', 'Yem'], ['cos', 'Kozmetik']]; let body;
    const offer = (o) => { const cr = Game.sampleCreature(o.b.spec), left = o.qty - Shop.bought(o.b.id + (o.rare ? '!' : '')), r = RARITY[o.b.rarity];
      return h('div.dex-tile', { style: { '--c': r.color, cursor: 'default' } }, UI.thumbCv(cr, 120), h('div.nm', null, o.b.name), h('div.tiny', { style: { color: r.color } }, r.icon + ' ' + r.name), h('div.small', null, `${o.price} 💰 · stok ${left}`), h('div.row', { style: { justifyContent: 'center', marginTop: '4px' } }, h('button.btn.sm', { disabled: left > 0 ? null : true, onclick: () => { Shop.buy(o, 'M'); UI.render_shop(el); } }, '♂'), h('button.btn.sm', { disabled: left > 0 ? null : true, onclick: () => { Shop.buy(o, 'F'); UI.render_shop(el); } }, '♀')), h('div.rarbar')); };
    const item = (k, id, def, extra) => { const lock = lvl < (def.lvl || 1); return h('div.cat' + (lock ? '.lock' : ''), { style: { cursor: 'default' } }, k === 'sub' ? UI.subThumb(id) : Editor.thumb(k, id), h('b', null, def.name), h('span.tiny.muted', null, lock ? `🔒 Sv ${def.lvl}` : `💰 ${def.cost}`), h('div.row', { style: { gap: '4px' } }, h('button.btn.sm', { onclick: () => (k === 'plant' ? UI.openPlant(id) : UI.openHard(k, id)) }, 'Bilgi'), h('button.btn.sm.primary', { disabled: lock ? true : null, onclick: () => { UI.go('design'); setTimeout(() => { Editor.mode = k === 'plant' ? 'plant' : k === 'decor' ? 'decor' : k === 'sub' ? 'sub' : 'hard'; if (k === 'sub') Editor.refresh(); else Editor.pick(k, id, def); }, 700); } }, k === 'sub' ? 'Stüdyo' : 'Yerleştir'))); };
    if (this.shopTab === 'live') { this.shopSp = this.shopSp || 'guppy'; if (!Shop.unlocked(this.shopSp)) this.shopSp = 'guppy'; } if (this.shopTab === 'live') body = h('div.stack', null, UI.tabs(SPECIES.map((s) => [s.id, (Shop.unlocked(s.id) ? '' : '🔒 ') + s.name]), this.shopSp, (k) => { if (!Shop.unlocked(k)) return UI.toast(`${SPECIES.find((s) => s.id === k).name}: Seviye ${SPECIES_LVL[k]}'de açılır`, 'lock'); this.shopSp = k; UI.render_shop(el); }), h('div.small.muted', null, `Günün seçkisi (seviyene göre: en çok ${RARITY[Shop.maxRarity()].name}). Yeni seçki her oyun günü gelir.`), h('div.grid2', { style: { gridTemplateColumns: 'repeat(auto-fill,minmax(130px,1fr))' } }, ...Shop.daily(this.shopSp).map(offer)), h('div.section-t', null, h('h3', null, '🧳 Gezgin Satıcı'), h('span.tiny.muted', null, 'haftada bir nadir ürünler')), h('div.grid2', { style: { gridTemplateColumns: 'repeat(auto-fill,minmax(130px,1fr))' } }, ...Shop.trader().map(offer)), h('div.small.muted', null, 'Türler seviye atladıkça açılır: ' + SPECIES.map((s) => `${s.name} (Sv ${SPECIES_LVL[s.id]})`).join(' · ')));
    else if (this.shopTab === 'plant') body = h('div.grid2', { style: { gridTemplateColumns: 'repeat(auto-fill,minmax(112px,1fr))' } }, ...Object.entries(PLANTS).sort((a, b) => a[1].lvl - b[1].lvl).map(([id, d]) => item('plant', id, d)));
    else if (this.shopTab === 'hard') body = h('div.grid2', { style: { gridTemplateColumns: 'repeat(auto-fill,minmax(112px,1fr))' } }, ...Object.entries(HARDSCAPE).map(([id, d]) => item(d.kind, id, d)), ...Object.entries(DECOR).map(([id, d]) => item('decor', id, d)));
    else if (this.shopTab === 'sub') body = h('div.grid2', { style: { gridTemplateColumns: 'repeat(auto-fill,minmax(112px,1fr))' } }, ...Object.entries(SUBSTRATES).map(([id, d]) => item('sub', id, d)));
    else if (this.shopTab === 'equip') body = h('div.stack', null, h('div.small.muted', null, 'Ekipman satın alma ve ayar Tasarım Stüdyosu > Ekipman sekmesinde yapılır.'), ...[...Object.entries(EQUIP.filter).map(([k, d]) => ['Filtre', d]), ['Isıtıcı', EQUIP.heater.on], ['CO₂ — sıvı karbon', EQUIP.co2.liquid], ['CO₂ — basınçlı tüp', EQUIP.co2.tank], ['Hava taşı', EQUIP.air]].map(([t, d]) => h('div.card.row', null, h('div.sp', null, h('b', null, d.name || t), h('div.small.muted', null, t + (d.lvl > 1 ? ` · Sv ${d.lvl}` : ''))), h('span', null, `💰 ${d.cost}`))), h('button.btn.primary', { onclick: () => { UI.go('design'); setTimeout(() => { Editor.mode = 'equip'; Editor.refresh(); }, 700); } }, 'Stüdyoyu aç'));
    else if (this.shopTab === 'food') { const inv = S.inv || (S.inv = { premium: 0, carotene: 0 }); const row = (k, name, desc, cost) => h('div.card.row', null, h('div.sp', null, h('b', null, name, ' ', h('span.small.muted', null, `(stok ${inv[k]})`)), h('div.small.muted', null, desc)), h('button.btn.sm', { onclick: () => { if (S.coins < cost) return UI.toast('Yeterli Altın Pul yok', 'coin'); S.coins -= cost; inv[k] += 20; UI.refreshTop(); Game.ev('buy'); UI.render_shop(el); } }, `×20 · ${cost} 💰`));
      body = h('div.stack', null, h('div.card', null, h('b', null, 'Kullanılan yem'), h('div.seg', { style: { marginTop: '8px' } }, ...[['std', 'Standart'], ['premium', 'Premium'], ['carotene', 'Karotenli']].map(([k, l]) => h('button' + ((S.feedType || 'std') === k ? '.on' : ''), { onclick: () => { S.feedType = k; UI.render_shop(el); } }, l)))), row('premium', 'Premium granül', 'Daha az atık: amonyak yükü −%45.', 30), row('carotene', 'Karotenli renk yemi', 'Erkeklerin renk yoğunluğu 3 gün boyunca +%14.', 40), h('div.small.muted', null, 'Standart pul yem sınırsızdır. Yenmeyen yem suyu kirletir.')); }
    else { const owns = S.owns || (S.owns = {}), buy = (k, cost, label) => { if ((S.stone || 0) < cost) return UI.toast('Yeterli Yosun Taşı yok', 'bell'); S.stone -= cost; owns[k] = 1; Game.save(); UI.toast(label + ' açıldı', 'star'); UI.render_shop(el); };
      body = h('div.stack', null, h('div.card.row', null, h('div.sp', null, h('b', null, `🪨 Yosun Taşı: ${S.stone || 0}`), h('div.small.muted', null, 'Sadece altın başarımlar, haftalık sandık ve sezonlardan kazanılır; satın alınamaz.'))),
        h('div.card.row', null, h('div', { style: { fontSize: '30px' } }, '🌌'), h('div.sp', null, h('b', null, 'Aurora gecesi arka planı'), h('div.small.muted', null, 'Tasarım Stüdyosu > Tank')), owns.aurora ? h('span.pill', null, '✔ Açık') : h('button.btn.sm', { onclick: () => buy('aurora', 3, 'Aurora arka planı') }, '3 🪨')),
        ...Game.AVATAR_DEF.accs.slice(1).map((a, i) => h('div.card.row', null, h('div', { style: { fontSize: '30px' } }, a), h('div.sp', null, h('b', null, 'Avatar aksesuarı'), h('div.small.muted', null, 'Profil > avatar')), owns['acc' + (i + 1)] ? h('span.pill', null, '✔ Açık') : h('button.btn.sm', { onclick: () => buy('acc' + (i + 1), 2, 'Aksesuar') }, '2 🪨')))); }
    el.replaceChildren(h('div.wrap', null, h('div.row', { style: { margin: '6px 0' } }, h('h2.sp', null, 'Mağaza'), h('span.pill', null, '💰 ' + fmt(S.coins))), UI.tabs(tabs, this.shopTab, (k) => { this.shopTab = k; UI.render_shop(el); }), body));
  },

  /* ---------- Pazar ---------- */
  render_market(el) {
    const S = Game.S, m = Market.ensure(S), list = Game.tank.creatures.slice().sort((a, b) => b.value() - a.value());
    const spark = (id, col) => { const hs = m.hist[id] || []; if (hs.length < 2) return h('span.tiny.muted', null, '—'); const W = 70, H_ = 22, mn = Math.min(...hs, 0.5), mx = Math.max(...hs, 1.3), pts = hs.map((v, i) => `${(i / (hs.length - 1) * W).toFixed(1)},${(H_ - 2 - (v - mn) / (mx - mn) * (H_ - 4)).toFixed(1)}`).join(' '); const s = document.createElementNS('http://www.w3.org/2000/svg', 'svg'); s.setAttribute('viewBox', `0 0 ${W} ${H_}`); s.setAttribute('width', W); s.setAttribute('height', H_); s.innerHTML = `<polyline fill="none" stroke="${col}" stroke-width="1.6" points="${pts}"/>`; return s; };
    const trend = m.trend ? BREED_BY_ID[m.trend.id] : null;
    el.replaceChildren(h('div.wrap.stack', null, h('div.row', { style: { margin: '6px 2px 0' } }, h('h2.sp', null, 'Pazar'), h('span.pill', null, '💰 ' + fmt(S.coins))),
      trend ? h('div.card', { style: { borderColor: m.trend.up ? 'var(--ok)' : 'var(--warn)' } }, h('b', null, `${m.trend.up ? '📈' : '📉'} Bu hafta ${trend.name} ${m.trend.up ? 'moda ↑' : 'ilgi görmüyor ↓'}`), h('div.small.muted', null, 'Çok satılan varyasyonun fiyatı düşer: çeşitlilik kazandırır.')) : null,
      h('h3', { style: { margin: '10px 2px 0' } }, 'Balıklarım (güncel fiyat)'),
      ...(list.length ? list.map((c) => { const b = c.breed(), mu = Market.mult(b.id), col = mu > 1.05 ? 'var(--ok)' : mu < 0.95 ? 'var(--warn)' : 'var(--muted)';
        return h('div.fish-row', null, UI.thumbCv(c, 84), h('div.sp', null, h('b', null, (c.fav ? '★ ' : '') + c.name), h('div.small.muted', null, `${b.name} · ${c.stage()}`), h('div.tiny', { style: { color: col } }, `talep ×${mu.toFixed(2)} ${mu > 1.05 ? '↑' : mu < 0.95 ? '↓' : '→'}`)), h('div', { style: { textAlign: 'right' } }, h('b', null, c.value() + ' 💰'), h('div', null, h('button.btn.sm.coral', { disabled: Game.tank.creatures.length <= 1 ? true : null, onclick: () => UI.confirm(`${c.name} satılsın mı?`, `${c.value()} Altın Pul`, () => { Game.sell(c); UI.render_market(el); }) }, 'Sat')))); }) : [UI.emptyState('🐟', 'Satacak balık yok', '')]),
      h('h3', { style: { margin: '14px 2px 0' } }, 'Talep göstergeleri'),
      ...ALL_BREEDS.filter((b) => S.discovered[b.id]).map((b) => { const mu = m.demand[b.id] ?? 1; return h('div.row', { style: { padding: '6px 4px', borderBottom: '1px solid var(--panel-b)' } }, h('b.sp', { style: { color: RARITY[b.rarity].color } }, b.name), spark(b.id, mu >= 1 ? '#4cd694' : '#ffc65c'), h('span', { style: { width: '54px', textAlign: 'right' } }, '×' + mu.toFixed(2))); })));
  },

  /* ---------- Araştırma ağacı ---------- */
  render_research(el) {
    const S = Game.S;
    el.replaceChildren(h('div.wrap.stack', null, h('div.row', { style: { margin: '6px 2px' } }, h('h2.sp', null, 'Araştırma Ağacı'), h('span.pill', null, '💗 ' + S.rep + ' İtibar')), h('div.small.muted', null, 'İtibar; sipariş teslim etme, başarımlar ve yarışmalarla kazanılır.'),
      ...RESEARCH.map((n) => { const has = Research.has(n.id), avail = Research.available(n), pre = n.after && RESEARCH.find((x) => x.id === n.after);
        return h('div.card.row', { style: { opacity: has || avail ? 1 : 0.55 } }, h('div', { style: { fontSize: '32px' } }, n.icon), h('div.sp', null, h('b', null, n.name), h('div.small.muted', null, n.desc), pre ? h('div.tiny.muted', null, 'Önce: ' + pre.name) : null),
          has ? h('span.pill', { style: { color: 'var(--ok)' } }, '✔ Açık') : h('button.btn.primary.sm', { disabled: avail ? null : true, onclick: () => { if (Research.buy(n)) UI.render_research(el); } }, `${n.cost} 💗`)); })));
  },
});

/* Avatar tanımı */
Game.AVATAR_DEF = { faces: ['🙂', '😎', '🤓', '🧑‍🔬', '🧑‍🌾', '👩‍🎨', '🧔', '👩‍🍳'], accs: ['', '🐠', '🐚', '🪸', '🦐', '👑'], cols: ['linear-gradient(135deg,#2fd4c6,#1779c4)', 'linear-gradient(135deg,#ff8a78,#ff5f7a)', 'linear-gradient(135deg,#a98bff,#5a6dff)', 'linear-gradient(135deg,#ffd36b,#ff9d5c)', 'linear-gradient(135deg,#4cd694,#1a9a6a)'] };
Game.AVATARS = Game.AVATAR_DEF.faces;

/* ---------- Merkez ve Profil (ilerleme sistemiyle yeniden) ---------- */
Object.assign(UI, {
  render_hub(el) {
    const S = Game.S, lvl = Progress.level(S.xp), cur = Progress.xpFor(lvl), nxt = Progress.xpFor(lvl + 1); Quests.refresh(S);
    const canvas = h('canvas', { width: 640, height: 360 });
    const tank = h('div.tank-card', { role: 'button', tabindex: 0, onclick: () => UI.go('aq') }, canvas, h('div.meta', null, h('div', { style: { flex: 1 } }, h('h3', null, 'Dükkân Tankı'), h('div.small.muted', { id: 'hub-meta' }, '')), h('span.dot', { style: { background: UI.waterDot(), boxShadow: `0 0 10px ${UI.waterDot()}` } })));
    const daily = Game.dailyState(), starter = Game.TASKS.filter((t) => !S.claimed[t.id]), dq = S.dq.list;
    const claimable = [...dq, ...S.wq.list].filter((q) => !q.claimed && q.prog >= q.goal).length + starter.filter((t) => (S.tasks[t.id] || 0) >= t.goal).length;
    const qrow = (q) => h('div.task' + (q.claimed ? '.done' : ''), null, h('div.ck', null, q.claimed ? icon('check') : null), h('div.sp', null, h('b', null, q.name), h('div.tiny.muted', null, `${q.prog}/${q.goal}`), h('div.pbar', { style: { marginTop: '4px' } }, h('i', { style: { width: (100 * q.prog / q.goal) + '%' } }))), q.claimed ? null : q.prog >= q.goal ? h('button.btn.primary.sm', { onclick: () => { Quests.claim(S, q); UI.render_hub(el); } }, 'Topla') : null);
    el.replaceChildren(h('div.wrap.stack', null,
      h('div.row', null, UI.avatarEl(S.av), h('div', null, h('h2', null, 'Hoş geldin, ' + S.name), h('div.muted.small', null, Progress.title(lvl) + ' · Seviye ' + lvl)), h('div.sp')),
      h('div.pbar', { title: 'XP' }, h('i', { style: { width: (100 * (S.xp - cur) / Math.max(1, nxt - cur)) + '%' } })), tank,
      h('div.card', null, h('div.row', null, icon('gift'), h('div.sp', null, h('b', null, 'Günün Ödülü'), h('div.small.muted', null, daily.can ? `Bugünkü ödülün: ${fmt(daily.reward)} Altın Pul · ${daily.idx + 1}. gün` : 'Bugünkü ödülünü aldın. Yarın yeni ödül seni bekliyor.')), h('button.btn.primary', { disabled: daily.can ? null : true, onclick: () => { Game.claimDaily(); UI.render_hub(el); } }, daily.can ? 'Al' : 'Alındı'))),
      h('div.card', null, h('div.row', null, h('h3.sp', null, 'Günün görevleri'), h('button.btn.sm', { onclick: () => UI.go('quests') }, 'Tümü' + (claimable ? ` (${claimable} 🎁)` : ''))), ...dq.map(qrow)),
      starter.length ? h('div.card', null, h('h3', null, 'Başlangıç hedefleri'), ...starter.slice(0, 3).map((t) => { const pr = S.tasks[t.id] || 0, done = pr >= t.goal; return h('div.task' + (done ? '.done' : ''), null, h('div.ck', null, done ? icon('check') : null), h('div.sp', null, h('b', null, t.name), h('div.small.muted', null, `${t.desc} (${Math.min(pr, t.goal)}/${t.goal})`)), done ? h('button.btn.primary.sm', { onclick: () => { Game.claimTask(t); UI.render_hub(el); } }, 'Topla') : h('button.btn.sm', { onclick: () => UI.go(t.go) }, 'Git')); })) : null,
      h('div.launch-grid', null, ...[['quests', 'star', 'Görevler'], ['orders', 'list', 'Siparişler'], ['shop', 'sell', 'Mağaza'], ['market', 'coin', 'Pazar'], ['research', 'flask', 'Araştırma'], ['dex', 'book', 'Ansiklopedi'], ['lab', 'dna', 'Laboratuvar'], ['design', 'brush', 'Tasarım'], ['help', 'book', 'Bilgi Merkezi'], ['profile', 'user', 'Profil'], ['settings', 'gear', 'Ayarlar']].map(([g, i, n]) => h('button', { onclick: () => UI.go(g) }, icon(i), n)), h('button', { onclick: () => UI.openFishList() }, icon('fish'), 'Balıklarım'))));
    this.hubCanvas = canvas; this.hubMeta = $('#hub-meta', el); this.startThumbs();
  },

  render_profile(el) {
    const S = Game.S, lvl = Progress.level(S.xp), cur = Progress.xpFor(lvl), nxt = Progress.xpFor(lvl + 1), stat = (v, l) => h('div.stat', null, h('b', null, v), h('div.small.muted', null, l));
    const nameIn = h('input', { type: 'text', value: S.name, maxlength: 16, 'aria-label': 'Kullanıcı adı', onchange: (e) => { S.name = e.target.value.trim().slice(0, 16) || 'Misafir'; Game.save(); } });
    const best = Game.tank.creatures.reduce((m, c) => Math.max(m, c.rarity()), 0), earned = Object.entries(S.ach || {}).filter(([, t]) => t > 0).map(([id, t]) => ({ a: ACHIEVEMENTS.find((x) => x.id === id), t }));
    const shown = (S.shown || []).filter((id) => (S.ach || {})[id]).slice(0, 6), vit = h('canvas', { width: 640, height: 360, style: { width: '100%', borderRadius: '14px', display: 'block' } });
    const seen = S.seen || {}, fishP = Math.round(100 * BREEDS.filter((b) => S.discovered[b.id]).length / BREEDS.length), plP = Math.round(100 * Object.keys(PLANTS).filter((k) => (seen.plant || {})[k]).length / Object.keys(PLANTS).length);
    el.replaceChildren(h('div.wrap.stack', null,
      h('div.card', null, h('div.row', null, h('div', { role: 'button', tabindex: 0, title: 'Avatarı düzenle', style: { cursor: 'pointer' }, onclick: () => UI.avatarEditor(el) }, UI.avatarEl(S.av)), h('div.sp', null, nameIn, h('div.small.muted', { style: { marginTop: '6px' } }, Progress.title(lvl) + ' · Seviye ' + lvl))),
        h('div.pbar', { style: { margin: '12px 0 4px' } }, h('i', { style: { width: (100 * (S.xp - cur) / Math.max(1, nxt - cur)) + '%' } })), h('div.tiny.muted', null, `${fmt(S.xp)} XP · sonraki seviye ${fmt(nxt)} XP`),
        h('div.row.wrap-r', { style: { marginTop: '10px' } }, h('span.pill', null, '💰 ' + fmt(S.coins)), h('span.pill', null, '💗 ' + S.rep + ' İtibar'), h('span.pill', null, '🪨 ' + (S.stone || 0) + ' Yosun Taşı'))),
      h('div.card', null, h('h3', { style: { marginBottom: '8px' } }, 'Rozet vitrini'), h('div.row.wrap-r', null, ...(shown.length ? shown : earned.slice(0, 6).map((e) => e.a.id)).map((id) => { const a = ACHIEVEMENTS.find((x) => x.id === id); return h('div', { style: { textAlign: 'center', width: '62px' }, title: a.name }, h('div', { style: { fontSize: '30px' } }, a.ic), h('div.tiny', null, ['', '🥉', '🥈', '🥇'][S.ach[id]])); }), earned.length ? null : h('div.small.muted', null, 'Henüz rozet yok — Görevler > Başarımlar')),
        earned.length ? h('button.btn.sm', { style: { marginTop: '8px' }, onclick: () => UI.badgePicker(el) }, 'Vitrini düzenle') : null),
      h('div.card', null, h('h3', { style: { marginBottom: '8px' } }, 'Vitrin akvaryumu'), vit),
      h('div.card', null, h('h3', { style: { marginBottom: '8px' } }, 'Koleksiyon'), UI.bar('Balık varyasyonları', fishP / 100, '#4aa8ff'), UI.bar('Bitkiler', plP / 100, '#4cd694'), UI.bar('Taş & zemin', ([...Object.keys(HARDSCAPE), ...Object.keys(DECOR), ...Object.keys(SUBSTRATES)].filter((k) => (seen.hard || {})[k]).length) / (Object.keys(HARDSCAPE).length + Object.keys(DECOR).length + Object.keys(SUBSTRATES).length), '#ffc65c')),
      h('div.section-t', null, icon('star'), h('h3', null, 'İstatistikler')),
      h('div.grid2', null, stat(Game.tank.creatures.length, 'Tankındaki balık'), stat(S.cnt.born || 0, 'Doğan yavru'), stat(BREEDS.filter((b) => S.discovered[b.id]).length + '/' + BREEDS.length, 'Keşfedilen varyasyon'), stat(fmt(S.stats.sold), 'Satılan balık'), stat(fmt(S.cnt.earned || 0), 'Kazanılan 💰'), stat(S.cnt.order || 0, 'Teslim edilen sipariş'), stat(Math.floor(S.stats.playSec / 60) + ' dk', 'Oynama süresi'), stat(RARITY[best].name, 'En nadir balığın'), stat(fmt(S.stats.maxSale), 'En değerli satış'), stat(S.stats.deaths || 0, 'Kaybedilen balık')),
      h('div.section-t', null, icon('camera'), h('h3', null, 'Galeri')),
      S.gallery.length ? h('div.grid2', { style: { gridTemplateColumns: 'repeat(auto-fill,minmax(130px,1fr))' } }, ...S.gallery.map((g, i) => h('div', { role: 'button', tabindex: 0, style: { cursor: 'pointer' }, onclick: () => UI.openPhoto(i) }, h('img', { src: g.src, alt: g.n, style: { width: '100%', borderRadius: '12px', display: 'block' } })))) : h('div.muted.small', null, 'Akvaryum ekranındaki kamera düğmesiyle fotoğraf çek.'),
      h('div.section-t', null, icon('star'), h('h3', null, 'Onur listesi')), h('div.muted.small', null, 'Kendi adını verdiğin sabit hatlar burada görünecek.'),
      h('div.row', null, h('button.btn.sp', { onclick: () => UI.go('settings') }, icon('gear'), 'Ayarlar'), h('button.btn.sp', { onclick: () => UI.openNotifs() }, icon('bell'), 'Bildirimler'))));
    requestAnimationFrame(() => Game.renderThumb(vit));
  },

  avatarEditor(el) {
    const S = Game.S, A = Game.AVATAR_DEF, av = S.av; const box = h('div.stack'), draw = () => box.replaceChildren(h('div', { style: { textAlign: 'center' } }, UI.avatarEl(av, 110)),
      h('div.small.muted', null, 'Yüz'), h('div.row.wrap-r', null, ...A.faces.map((f, i) => h('button.sp-chip' + (av.f === i ? '.on' : ''), { onclick: () => { av.f = i; draw(); } }, f))),
      h('div.small.muted', null, 'Aksesuar'), h('div.row.wrap-r', null, ...A.accs.map((f, i) => { const own = i === 0 || i === 1 || (S.owns || {})['acc' + (i - 1)] || i === 1; const locked = i > 1 && !(S.owns || {})['acc' + (i - 1)]; return h('button.sp-chip' + (av.a === i ? '.on' : '') + (locked ? '.lock' : ''), { onclick: () => { if (locked) return UI.toast('Mağaza > Kozmetik\'te Yosun Taşı ile aç', 'lock'); av.a = i; draw(); } }, f || 'Yok', locked ? '🔒' : ''); })),
      h('div.small.muted', null, 'Arka plan'), h('div.row.wrap-r', null, ...A.cols.map((c, i) => h('button.sp-chip' + (av.c === i ? '.on' : ''), { style: { background: c, width: '44px', minHeight: '44px' }, onclick: () => { av.c = i; draw(); } }, av.c === i ? '✔' : ''))));
    draw(); const rec = UI.sheet(h('div.stack', null, UI.sheetHead('Avatar', { close: () => rec.close() }), box, h('button.btn.primary', { onclick: () => rec.close() }, 'Tamam')), { onClose: () => { Game.save(); UI.render_profile(el); } });
  },
  badgePicker(el) {
    const S = Game.S, sel = new Set((S.shown || []).filter((id) => (S.ach || {})[id])); const box = h('div.grid2', { style: { gridTemplateColumns: 'repeat(3,1fr)' } });
    const draw = () => box.replaceChildren(...ACHIEVEMENTS.filter((a) => (S.ach || {})[a.id]).map((a) => h('button.dex-tile', { style: { '--c': sel.has(a.id) ? 'var(--accent)' : 'var(--panel-b)', border: '2px solid ' + (sel.has(a.id) ? 'var(--accent)' : 'var(--panel-b)') }, onclick: () => { if (sel.has(a.id)) sel.delete(a.id); else if (sel.size < 6) sel.add(a.id); draw(); } }, h('div', { style: { fontSize: '30px' } }, a.ic), h('div.tiny', null, a.name))));
    draw(); const rec = UI.sheet(h('div.stack', null, UI.sheetHead('Vitrin rozetleri (en çok 6)', { close: () => rec.close() }), box, h('button.btn.primary', { onclick: () => rec.close() }, 'Tamam')), { onClose: () => { S.shown = [...sel]; Game.save(); UI.render_profile(el); } });
  },
});
