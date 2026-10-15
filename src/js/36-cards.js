'use strict';
/* =====================================================================
   36 · PROFİL KARTI PAYLAŞIMI — sunucusuz. Oyuncu kartı bir koda dönüşür (kopyala/paylaş);
   arkadaşı kodu yapıştırıp kartı görür ve "Arkadaşlar" listesine ekler.
   Güvenlik/çocuk: kartlar yalnızca elle yapıştırılırsa görünür (keşif/sohbet yok); alınan veri
   katı biçimde temizlenir (metin kısıtlı, rozet/özellik beyaz liste); kart ayrıca silinebilir.
   ===================================================================== */
const CARD_PREFIX = 'AKV1', CARD_MAX = 4000, FRIEND_MAX = 30;
const CARD_SPEC_KEYS = ['tux', 'sb', 'st', 'grass', 'mosaic', 'moscow', 'purple', 'metal'];
const BAD_LONG = ['orospu', 'orosbu', 'siktir', 'sikik', 'sikeyim', 'sikis', 'sikim', 'sikerim', 'yarrak', 'yarak', 'amcik', 'gotveren', 'ibne', 'pezevenk', 'gavat', 'kahpe', 'fuck', 'shit', 'bitch', 'nigg', 'fagg', 'whore', 'slut', 'porno', 'nazi', 'hitler', 'rapist', 'pedo'];
const BAD_TOKEN = ['amk', 'aq', 'pic', 'got', 'sik', 'dick', 'sex', 'bok', 'rape', 'porn', 'cunt'];
const Cards = {
  /** Küfür/uygunsuz ad süzgeci: aksan ve rakam-harf (1→i, 0→o…) hilelerini normalleştirir. */
  bad(t) {
    const n = String(t || '').toLowerCase().replace(/ı/g, 'i').replace(/ğ/g, 'g').replace(/ş/g, 's').replace(/ç/g, 'c').replace(/ö/g, 'o').replace(/ü/g, 'u').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[0]/g, 'o').replace(/[1!|]/g, 'i').replace(/3/g, 'e').replace(/[4@]/g, 'a').replace(/[5$]/g, 's').replace(/7/g, 't');
    const flat = n.replace(/[^a-z]/g, ''), toks = n.split(/[^a-z]+/).filter(Boolean);
    return BAD_LONG.some((w) => flat.includes(w)) || toks.some((w) => BAD_TOKEN.includes(w)) || BAD_TOKEN.includes(flat);
  },
  safeName(t, n = 16) { const c = this.clean(t, n); return !c || this.bad(c) ? 'Misafir' : c; },
  clean(t, n) { return String(t == null ? '' : t).replace(/[\u0000-\u001f<>&"'`\\]/g, '').replace(/\s+/g, ' ').trim().slice(0, n); },
  sum(s) { let a = 5381; for (let i = 0; i < s.length; i++) a = ((a * 33) ^ s.charCodeAt(i)) >>> 0; return a.toString(36).slice(0, 5); },
  /** Oyuncunun kartı (paylaşılabilir en küçük veri). */
  make(S = Game.S) {
    const lvl = Progress.level(S.xp), a = S.av || { f: 0, a: 0, c: 0 };
    const fish = [...Game.tank.creatures].filter((c) => c.species === 'guppy' && c.pheno).sort((x, y) => y.rarity() - x.rarity() || y.value() - x.value()).slice(0, 3).map((c) => { const p = c.pheno, sp = { body: p.body, tail: p.tail, tc: p.tailColor === 'none' ? 'red' : p.tailColor, shp: p.shp === 'n' ? undefined : [p.shp, p.shp], size: Math.round(p.size * 100) / 100 }; for (const k of CARD_SPEC_KEYS) if (p[k]) sp[k] = 1; return { nm: this.clean(c.name, 14), sex: c.sex, r: c.rarity(), sp }; });
    return { n: this.safeName(S.name), av: { f: a.f | 0, a: a.a | 0, c: a.c | 0 }, lv: lvl, rep: S.rep | 0, disc: BREEDS.filter((b) => S.discovered[b.id]).length, tr: Object.keys(S.traits || {}).length, born: (S.cnt && S.cnt.born) | 0, sold: (S.stats && S.stats.sold) | 0, bd: (S.shown || []).filter((id) => (S.ach || {})[id]).slice(0, 6).map((id) => [id, S.ach[id]]), fi: fish, tk: (S.tanks ? S.tanks.length : 1) };
  },
  encode(card) { const j = JSON.stringify(card), b = btoa(unescape(encodeURIComponent(j))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, ''); return `${CARD_PREFIX}.${b}.${this.sum(b)}`; },
  /** Koddan kart: {ok, card} | {ok:false, err}. Her alan doğrulanır/kısıtlanır. */
  decode(code) {
    try {
      code = String(code || '').replace(/\s+/g, ''); const m = code.match(/(AKV1)\.([A-Za-z0-9_-]+)\.([a-z0-9]{1,5})$/); if (code.length > CARD_MAX || !m) return { ok: false, err: 'Kod tanınmadı' };
      if (this.sum(m[2]) !== m[3]) return { ok: false, err: 'Kod bozuk veya eksik kopyalanmış' };
      const raw = JSON.parse(decodeURIComponent(escape(atob(m[2].replace(/-/g, '+').replace(/_/g, '/'))))), num = (v, lo, hi) => Math.min(hi, Math.max(lo, Number.isFinite(+v) ? Math.round(+v) : 0));
      const card = { n: this.safeName(raw.n), av: { f: num(raw.av && raw.av.f, 0, 40), a: num(raw.av && raw.av.a, 0, 40), c: num(raw.av && raw.av.c, 0, 40) }, lv: num(raw.lv, 1, 999), rep: num(raw.rep, 0, 1e6), disc: num(raw.disc, 0, 999), tr: num(raw.tr, 0, 999), born: num(raw.born, 0, 1e7), sold: num(raw.sold, 0, 1e7), tk: num(raw.tk, 1, MAX_TANKS), bd: [], fi: [] };
      for (const b of Array.isArray(raw.bd) ? raw.bd.slice(0, 6) : []) { if (Array.isArray(b) && ACHIEVEMENTS.some((a) => a.id === b[0])) card.bd.push([String(b[0]), num(b[1], 1, 3)]); }
      for (const f of Array.isArray(raw.fi) ? raw.fi.slice(0, 3) : []) {
        const s = f && f.sp || {}, sp = { body: BODY[s.body] ? s.body : 'W', tail: TAILS[s.tail] ? s.tail : 'delta', tc: TAILCOL[s.tc] && s.tc !== 'none' ? s.tc : 'red', size: Math.min(1.5, Math.max(0.6, +s.size || 1)) };
        if (Array.isArray(s.shp) && ['d', 's'].includes(s.shp[0])) sp.shp = [s.shp[0], s.shp[0]]; for (const k of CARD_SPEC_KEYS) if (s[k]) sp[k] = 1;
        card.fi.push({ nm: this.safeName(f && f.nm, 14) === 'Misafir' ? 'Balık' : this.safeName(f && f.nm, 14), sex: f && f.sex === 'F' ? 'F' : 'M', r: num(f && f.r, 0, RARITY.length - 1), sp });
      }
      return { ok: true, card };
    } catch (e) { return { ok: false, err: 'Kod okunamadı' }; }
  },
  list(S = Game.S) { return S.friends || (S.friends = []); },
  add(card, S = Game.S) {
    const l = this.list(S), id = this.sum(JSON.stringify(card.n + card.av.f + card.av.c)), i = l.findIndex((f) => f.card.n === card.n && f.card.av.f === card.av.f && f.card.av.c === card.av.c);
    if (i >= 0) { l[i].card = card; l[i].t = Date.now(); return 'updated'; } if (l.length >= FRIEND_MAX) return 'full';
    l.push({ id, card, t: Date.now() }); return 'added';
  },
  remove(card, S = Game.S) { S.friends = this.list(S).filter((f) => f.card !== card); },
};

Object.assign(UI, {
  cardView(card, actions) {
    const A = ACHIEVEMENTS, pill = (t) => h('span.pill', null, t), tiers = ['', '🥉', '🥈', '🥇'];
    return h('div.stack', null,
      h('div.row', null, UI.avatarEl(card.av, 64), h('div.sp', null, h('h3', null, card.n), h('div.small.muted', null, `${Progress.title(card.lv)} · Seviye ${card.lv}`))),
      h('div.row.wrap-r', null, pill('💗 ' + card.rep), pill('📖 ' + card.disc + ' varyasyon'), pill('🧬 ' + card.tr + ' özellik'), pill('🍼 ' + card.born + ' doğum'), pill('💰 ' + card.sold + ' satış'), pill('🐠 ' + card.tk + ' tank')),
      card.bd.length ? h('div.row.wrap-r', null, ...card.bd.map(([id, t]) => { const a = A.find((x) => x.id === id); return h('span.pill', { title: a.name }, `${a.ic} ${a.name} ${tiers[t] || ''}`); })) : null,
      card.fi.length ? h('div.trait-grid', null, ...card.fi.map((f) => { const cr = Game.sampleCreature(Object.assign({ sex: f.sex }, f.sp)), rr = RARITY[f.r]; return h('div.trait', { style: { '--c': rr.color } }, UI.thumbCv(cr, 96), h('b', null, f.nm), h('span.tiny', { style: { color: rr.color } }, rr.icon + ' ' + rr.name)); })) : h('div.small.muted', null, 'Vitrinde lepistes yok.'),
      actions || null);
  },
  shareCard() {
    const card = Cards.make(), code = Cards.encode(card), rec = UI.sheet(h('div.stack'), {}), box = rec.wrap.querySelector('.sheet > div');
    const ta = h('textarea', { readonly: true, rows: 4, style: { width: '100%', fontSize: '12px', borderRadius: '10px' } }); ta.value = code;
    const copy = () => (navigator.clipboard ? navigator.clipboard.writeText(code) : Promise.reject()).then(() => UI.toast('Kod kopyalandı', 'check'), () => { ta.select(); UI.toast('Kodu seçip kopyala', 'bell'); });
    box.replaceChildren(UI.sheetHead('Kartımı paylaş', { close: () => rec.close() }), UI.cardView(card), h('div.small.muted', null, 'Bu kodu arkadaşına gönder; o da "Arkadaş ekle" ile yapıştırsın. Kodda yalnızca bu kartta görünen bilgiler vardır.'), ta,
      h('div.row', null, h('button.btn.primary.sp', { onclick: copy }, 'Kopyala'), navigator.share ? h('button.btn.sp', { onclick: () => navigator.share({ title: 'Akvaryum Dünyam kartım', text: `Akvaryum Dünyam'nde profilim! Arkadaş ekle → kodu yapıştır:\n${code}` }).catch(() => {}) }, 'Paylaş') : null));
  },
  addFriend(prefill) {
    const rec = UI.sheet(h('div.stack'), {}), box = rec.wrap.querySelector('.sheet > div'), ta = h('textarea', { rows: 4, placeholder: 'AKV1.… kodunu buraya yapıştır', style: { width: '100%', fontSize: '12px', borderRadius: '10px' } }), out = h('div');
    if (prefill) ta.value = prefill;
    const check = () => { const r = Cards.decode(ta.value); if (!ta.value.trim()) return out.replaceChildren(); if (!r.ok) return out.replaceChildren(h('div.small', { style: { color: 'var(--bad,#ff6b6b)' } }, r.err));
      out.replaceChildren(UI.cardView(r.card, h('button.btn.primary', { onclick: () => { const s = Cards.add(r.card); if (s === 'full') return UI.toast(`En fazla ${FRIEND_MAX} arkadaş`, 'bell'); Game.save(); rec.close(); UI.toast(s === 'added' ? `${r.card.n} arkadaş eklendi` : `${r.card.n} kartı güncellendi`, 'heart'); if (UI.cur === 'profile') UI.render_profile($('#s-profile')); } }, 'Arkadaş ekle'))); };
    ta.oninput = check; box.replaceChildren(UI.sheetHead('Arkadaş ekle', { close: () => rec.close() }), ta, h('div.row', null, navigator.clipboard && navigator.clipboard.readText ? h('button.btn.sm', { onclick: () => navigator.clipboard.readText().then((t) => { ta.value = t; check(); }, () => UI.toast('Panoya erişilemedi; elle yapıştır', 'bell')) }, 'Panodan yapıştır') : null), out); if (prefill) check();
  },
  friendList() {
    const rec = UI.sheet(h('div.stack'), {}), box = rec.wrap.querySelector('.sheet > div'), l = Cards.list(), draw = () => box.replaceChildren(UI.sheetHead(`Arkadaşlar (${Cards.list().length}/${FRIEND_MAX})`, { close: () => rec.close() }),
      ...(Cards.list().length ? Cards.list().map((f) => h('div.card', null, UI.cardView(f.card, h('button.btn.sm.ghost', { onclick: () => UI.confirm(`${f.card.n} silinsin mi?`, 'Kart listenden kalkar.', () => { Cards.remove(f.card); Game.save(); draw(); if (UI.cur === 'profile') UI.render_profile($('#s-profile')); }) }, 'Sil')))) : [UI.emptyState('🤝', 'Henüz arkadaş yok', 'Arkadaşının kart kodunu yapıştırarak ekle.')]));
    draw();
  },
});
UI.render_profile = ((orig) => function (el) {
  const r = orig.apply(this, arguments), w = el.querySelector('.wrap'); if (!w) return r;
  w.insertBefore(h('div.card', null, h('div.row', null, h('div', { style: { fontSize: '26px' } }, '🤝'), h('div.sp', null, h('b', null, 'Arkadaşlar'), h('div.tiny.muted', null, `${Cards.list().length} kart · kodla paylaş, hesap gerekmez`))),
    h('div.row', { style: { marginTop: '8px' } }, h('button.btn.sm.primary.sp', { onclick: () => UI.shareCard() }, 'Kartımı paylaş'), h('button.btn.sm.sp', { onclick: () => UI.addFriend() }, 'Arkadaş ekle'), Cards.list().length ? h('button.btn.sm.sp', { onclick: () => UI.friendList() }, 'Liste') : null)), w.children[1] || null);
  return r;
})(UI.render_profile);
/* Web: sayfa #kart=KOD ile açılırsa içe aktarma ekranı */
setTimeout(() => { const m = location.hash.match(/kart=([^&]+)/); if (m && window.Game && Game.S) { UI.addFriend(decodeURIComponent(m[1])); history.replaceState(null, '', location.pathname + location.search); } }, 2500);
