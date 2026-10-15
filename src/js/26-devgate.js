'use strict';
/* =====================================================================
   26 · GELİŞTİRİCİ PANELİ KİLİDİ — Ayarlar > Geliştirici bir şifreyle açılır.
   Şifre kaynakta düz yazılmaz, yalnızca karması tutulur. Not: istemci tarafı
   koruması "kazara açılmasın" içindir; kaynağı okuyan biri aşabilir.
   Şifreyi değiştirmek için konsolda  DevGate.hash('yeni şifre')  çalıştırıp
   çıkan değeri DEV_HASH sabitine yaz.
   ===================================================================== */
const DEV_HASH = '1f3fb027-0ddad16e';   // varsayılan şifrenin karması (şifre sahibine iletildi)
const DevGate = {
  open: false, fails: 0, until: 0,
  /** cyrb53 tabanlı iki turlu karma (kriptografik değil; şifreyi düz yazmamak için). */
  hash(s) {
    const f = (str, seed) => { let h1 = 0xdeadbeef ^ seed, h2 = 0x41c6ce57 ^ seed; for (let i = 0; i < str.length; i++) { const ch = str.charCodeAt(i); h1 = Math.imul(h1 ^ ch, 2654435761); h2 = Math.imul(h2 ^ ch, 1597334677); }
      h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909); h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909); return (h2 >>> 0).toString(16).padStart(8, '0') + (h1 >>> 0).toString(16).padStart(8, '0'); };
    const a = f('akv|' + s, 11), b = f(a + '|' + s, 29); return a.slice(0, 8) + '-' + b.slice(8, 16);
  },
  try(pw) {
    if (Date.now() < this.until) return { ok: false, wait: Math.ceil((this.until - Date.now()) / 1000) };
    if (this.hash(pw) === DEV_HASH) { this.open = true; this.fails = 0; return { ok: true }; }
    this.fails++; if (this.fails >= 3) { this.until = Date.now() + 15000 * this.fails; } return { ok: false };
  },
};

UI.render_settings = ((orig) => function (el) {
  const r = orig.apply(this, arguments);
  if (DevGate.open) return r;
  const card = [...el.querySelectorAll('.card')].find((c) => /Geliştirici/.test((c.querySelector('h3') || {}).textContent || ''));
  if (!card) return r;
  const inp = h('input', { type: 'password', placeholder: 'Geliştirici şifresi', autocomplete: 'off', 'aria-label': 'Geliştirici şifresi', style: { width: '100%' } }), msg = h('div.small', { style: { minHeight: '18px', color: 'var(--coral, #ff7a7a)' } });
  const go = () => { const res = DevGate.try(inp.value); if (res.ok) { UI.render_settings(el); UI.toast('Geliştirici paneli açıldı', 'check', 2000); } else { msg.textContent = res.wait ? `Çok fazla deneme. ${res.wait} sn bekle.` : 'Şifre yanlış.'; inp.value = ''; } };
  inp.addEventListener('keydown', (e) => { if (e.key === 'Enter') go(); });
  card.replaceChildren(h('h3', null, '🔒 Geliştirici'), h('div.small.muted', { style: { marginBottom: '8px' } }, 'Bu bölüm şifre ile korunur.'), inp, msg, h('button.btn.sm', { onclick: go }, 'Aç'));
  return r;
})(UI.render_settings);
