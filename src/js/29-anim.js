'use strict';
/* =====================================================================
   29 · ANİMASYON CİLASI — sayaç yuvarlanma, paraların kabarcık olup sayaca uçması,
        doğumda ışıltı, yerleştirmede kum tozu / bitki kabarcığı, liste sıralı belirişi.
   Hepsi "Animasyonları azalt" ayarına saygı duyar; yumuşak süre/eğri standardı kullanır.
   ===================================================================== */
const Anim = {
  reduce() { const S = Game.S; return !!(S && S.settings && S.settings.reduce) || (window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches); },
  ptr: { x: innerWidth / 2, y: innerHeight * 0.6 },
  ease: 'cubic-bezier(0.22, 1, 0.36, 1)',

  /** Sayaç: gösterilen değer hedefe 450-700 ms'de yuvarlanır; artışta küçük "zıplama". */
  roll(el, to, key) {
    const st = (this._rv || (this._rv = {})), from = st[key] ?? to; st[key] = to; if (this.reduce() || from === to) { el.textContent = fmt(to); return; }
    cancelAnimationFrame(this['_r' + key]); const t0 = performance.now(), dur = clamp(Math.abs(to - from) * 6, 350, 800);
    const step = (now) => { const p = clamp((now - t0) / dur, 0, 1), e = 1 - Math.pow(1 - p, 3); el.textContent = fmt(Math.round(from + (to - from) * e)); if (p < 1) this['_r' + key] = requestAnimationFrame(step); };
    this['_r' + key] = requestAnimationFrame(step);
    if (to > from) { el.classList.remove('bump'); void el.offsetWidth; el.classList.add('bump'); }
  },

  /** Kabarcık parçacıkları: (x,y) ekran noktasından hedef elemana uçar (ör. coin → sayaç). */
  fly(n, tgtSel, tint = 'rgba(255,214,90,.9)') {
    if (this.reduce()) return; const tg = $(tgtSel); if (!tg) return; const r = tg.getBoundingClientRect(), tx = r.left + r.width / 2, ty = r.top + r.height / 2, sx = this.ptr.x, sy = this.ptr.y;
    for (let i = 0; i < Math.min(9, n); i++) {
      const s = 7 + Math.random() * 8, el = h('div.fly-bub', { style: { width: s + 'px', height: s + 'px', left: sx - s / 2 + 'px', top: sy - s / 2 + 'px', background: `radial-gradient(circle at 30% 30%, #fff, ${tint} 55%, rgba(255,160,40,.6))` } });
      document.body.append(el); const mx = sx + (Math.random() - 0.5) * 90, my = sy - 40 - Math.random() * 60;
      const a = el.animate([{ transform: 'translate(0,0) scale(.4)', opacity: 0 }, { transform: `translate(${mx - sx}px,${my - sy}px) scale(1)`, opacity: 1, offset: 0.3 }, { transform: `translate(${tx - sx}px,${ty - sy}px) scale(.5)`, opacity: 0.9 }], { duration: 650 + Math.random() * 350, delay: i * 55, easing: this.ease, fill: 'forwards' });
      a.onfinish = () => { el.remove(); tg.classList.remove('bump'); void tg.offsetWidth; tg.classList.add('bump'); };
    }
  },

  /** Tank içi efekt parçacıkları: parıltı (doğum), toz (taş/kök yerleşimi), kabarcık (bitki dikme). */
  burst(kind, x, y, n = 8) {
    const t = Game.tank; if (!t || this.reduce()) return; t.fx = t.fx || [];
    for (let i = 0; i < n; i++) {
      if (kind === 'sparkle') t.fx.push({ k: 's', x: x + R.float(-26, 26), y: y + R.float(-18, 18), vx: R.float(-6, 6), vy: R.float(-26, -8), r: R.float(3, 7), life: R.float(1.4, 2.4), max: 2.4, ph: R.float(0, TAU), d: i * 0.08 });
      else if (kind === 'dust') t.fx.push({ k: 'd', x: x + R.float(-40, 40), y: y + R.float(-6, 4), vx: R.float(-40, 40), vy: R.float(-34, -6), r: R.float(2, 5), life: R.float(0.7, 1.3), max: 1.3, d: 0 });
      else t.fx.push({ k: 'b', x: x + R.float(-8, 8), y, vx: R.float(-4, 4), vy: R.float(-60, -30), r: R.float(1.6, 3.6), life: R.float(1.0, 1.8), max: 1.8, ph: R.float(0, TAU), d: i * 0.1 });
    }
  },
};

/* Sayaçlar (para, itibar) yuvarlanır */
UI.refreshTop = ((orig) => function () { const r = orig.apply(this, arguments), S = Game.S; if (S) { Anim.roll($('#v-coins'), S.coins, 'coins'); Anim.roll($('#v-rep'), S.rep, 'rep'); } return r; })(UI.refreshTop);

/* Para kazanınca kabarcıklar sayaca uçar */
Game.addCoins = ((orig) => function (n, earned) { const r = orig.apply(this, arguments); if (n >= 5 && typeof Anim !== 'undefined') Anim.fly(Math.ceil(Math.log2(n)), '#v-coins'); return r; })(Game.addCoins);
document.addEventListener('pointerdown', (e) => { Anim.ptr = { x: e.clientX, y: e.clientY }; }, true);

/* Doğum: yavrular ışıltılarla belirir */
Breeding.birth = ((orig) => function () { const r = orig.apply(this, arguments); try { for (const k of (r && r.kept) || []) Anim.burst('sparkle', k.sw.x, k.sw.y, 6); } catch (e) { /* efekt hatası oyunu durdurmasın */ } return r; })(Breeding.birth);

/* Stüdyo: taş/kök yerleşince kum tozu, bitki dikilince kabarcık */
Editor.place = ((orig) => function () {
  const n0 = this.sc.items.length, r = orig.apply(this, arguments);
  try { if (this.sc.items.length > n0) { const it = this.sc.items[this.sc.items.length - 1], p = Scape.pos(this.sc, this.tank.W, it); Anim.burst(it.k === 'plant' ? 'bubble' : 'dust', p.x, p.y, it.k === 'plant' ? 5 : 12); } } catch (e) { /* yoksay */ }
  return r;
})(Editor.place);

/* Tank: efektleri yaşlandır ve çiz (cam çerçevesinden hemen önce, dünya uzayında) */
Tank.prototype.update = ((orig) => function (dt, minute) {
  const r = orig.apply(this, arguments); if (this.fx && this.fx.length) { for (const f of this.fx) { if (f.d > 0) { f.d -= dt; continue; } f.life -= dt; f.x += f.vx * dt + (f.k === 'b' ? Math.sin(f.ph + this.t * 4) * 6 * dt : 0); f.y += f.vy * dt; if (f.k === 'd') { f.vy += 40 * dt; f.vx *= 0.96; } } this.fx = this.fx.filter((f) => f.life > 0); }
  return r;
})(Tank.prototype.update);
Tank.prototype.drawFrame = ((orig) => function (ctx, W, H) {
  if (this.fx && this.fx.length) {
    ctx.save();
    for (const f of this.fx) {
      if (f.d > 0) continue; const a = clamp(f.life / f.max, 0, 1);
      if (f.k === 's') { const tw = 0.6 + 0.4 * Math.sin(this.t * 9 + f.ph), s = f.r * (0.5 + a) * tw; ctx.globalAlpha = Math.min(1, a * 1.6); ctx.fillStyle = 'rgba(255,248,210,1)'; ctx.shadowColor = 'rgba(255,240,170,.9)'; ctx.shadowBlur = 8; ctx.beginPath(); ctx.moveTo(f.x, f.y - s); ctx.lineTo(f.x + s * 0.28, f.y - s * 0.28); ctx.lineTo(f.x + s, f.y); ctx.lineTo(f.x + s * 0.28, f.y + s * 0.28); ctx.lineTo(f.x, f.y + s); ctx.lineTo(f.x - s * 0.28, f.y + s * 0.28); ctx.lineTo(f.x - s, f.y); ctx.lineTo(f.x - s * 0.28, f.y - s * 0.28); ctx.closePath(); ctx.fill(); }
      else if (f.k === 'd') { ctx.globalAlpha = a * 0.55; ctx.fillStyle = 'rgba(215,190,140,1)'; ctx.beginPath(); ctx.arc(f.x, f.y, f.r * (1.3 - a * 0.4), 0, TAU); ctx.fill(); }
      else { ctx.globalAlpha = Math.min(1, a * 1.5) * 0.8; ctx.strokeStyle = 'rgba(230,255,255,1)'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.arc(f.x, f.y, f.r, 0, TAU); ctx.stroke(); }
    }
    ctx.restore();
  }
  return orig.apply(this, arguments);
})(Tank.prototype.drawFrame);

/* Ekran geçişlerinde liste öğeleri 35 ms aralıkla yükselerek belirir */
UI.go = ((orig) => function (name) {
  const r = orig.apply(this, arguments);
  if (!Anim.reduce()) requestAnimationFrame(() => { const el = $('#s-' + name); if (!el) return; [...el.querySelectorAll(':scope > .wrap > .card, :scope > .wrap > .stack > .card, .dex-tile, .fish-row, .qcard')].slice(0, 16).forEach((c, i) => { c.style.animation = `rise .45s ${Anim.ease} ${i * 35}ms both`; }); });
  return r;
})(UI.go);
