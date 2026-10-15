'use strict';
/* =====================================================================
   28 · ÇOKLU TANK — dükkân rafları, tanklar arası geçiş ve balık taşıma
   Etkin tankın canlı verisi eskisi gibi S.scape / S.water / tank.creatures'tadır.
   Diğer tankların verisi S.tanks[i] içinde dondurulur (JSON); geçişte çözülür ve
   geçen süre (en çok 8 gün) kadar kimya + üreme ilerletilir.
   ===================================================================== */
const SHELF_COST = [0, 400, 1200, 3000, 8000, 20000], SHELF_LVL = [1, 6, 14, 24, 36, 48], NEW_TANK_COST = 120, MAX_TANKS = 6;
const tankCapFor = (liters) => clamp(Math.round(liters / 1.6), 10, 100);

const Tanks = {
  ensure(S = Game.S) {
    if (!S.tanks) { S.tanks = [{ id: 1, name: 'Dükkân Tankı' }]; S.activeTank = 0; S.nextTankId = 2; S.shelves = 1; }
    if (S.shelves === undefined) S.shelves = S.tanks.length; return S.tanks;
  },
  active(S = Game.S) { this.ensure(S); return S.tanks[S.activeTank] || S.tanks[0]; },
  count(S = Game.S) { return this.ensure(S).length; },
  /** Bir tankın canlı sayısı (etkin tank için canlı liste, diğerleri için dondurulmuş). */
  fishCount(i, S = Game.S) { this.ensure(S); return i === S.activeTank ? Game.tank.creatures.length : ((S.tanks[i] && S.tanks[i].creatures) || []).length; },
  liters(i, S = Game.S) { this.ensure(S); return i === S.activeTank ? S.scape.liters : (S.tanks[i].scape ? S.tanks[i].scape.liters : 20); },
  status(i, S = Game.S) { // 0 iyi, 1 dikkat, 2 kötü
    this.ensure(S); const w = i === S.activeTank ? S.water : S.tanks[i].water; if (!w) return 0; let m = 0; for (const p of PARAMS) m = Math.max(m, Chem.status(p.k, w[p.k])); return m;
  },

  /** Etkin tankı slota dondur (küçük resimle). */
  snapshot(S = Game.S) {
    const slot = this.active(S), t = Game.tank;
    try { const cv = document.createElement('canvas'); cv.width = 320; cv.height = 180; Game.renderThumb(cv); slot.thumb = cv.toDataURL('image/jpeg', 0.62); } catch (e) { /* küçük resim zorunlu değil */ }
    slot.scape = S.scape; slot.water = S.water; slot.clutches = S.clutches || []; slot.last = S.clockMin;
    slot.creatures = t.creatures.map((c) => { c.sw && (c.x = c.sw.x, c.y = c.sw.y); return c.toJSON(); });
  },
  /** Slotu etkin tank olarak yükle. */
  load(S, idx) {
    const slot = S.tanks[idx], t = Game.tank; t.creatures.length = 0; t.food.length = 0; t.bubbles.length = 0; t.ripples.length = 0; t.molts = [];
    S.scape = slot.scape; S.water = slot.water; S.clutches = slot.clutches || [];
    S.activeTank = idx; t.setScape(S.scape);
    for (const cd of slot.creatures || []) { try { const c = new Creature(cd); c.sw.x = clamp(cd.x ?? c.sw.x, 40, t.W - 40); c.sw.y = clamp(cd.y ?? c.sw.y, 60, t.H - 90); c.now = S.clockMin; t.addCreature(c); } catch (e) { console.warn('Canlı yüklenemedi', e); } }
    const last = slot.last; slot.scape = slot.water = slot.creatures = slot.clutches = slot.thumb = null; slot.last = null;
    return last;
  },
  switchTo(idx) {
    const S = Game.S; this.ensure(S); if (idx === S.activeTank || !S.tanks[idx] || !S.tanks[idx].scape) return false;
    this.snapshot(S); const last = this.load(S, idx);
    Game.afterLoad(); const minutes = clamp(S.clockMin - (last ?? S.clockMin), 0, 8 * 1440);
    if (minutes > 5) { for (const c of Game.tank.creatures) c.now = S.clockMin; Chem.catchUp(minutes); Game.tickBreeding(true); }
    if (Game.vp) Game.vp.fitDefault(); Game.tank.touch(); UI.refreshTop(); UI.refreshAq && UI.refreshAq(); Game.save(); return true;
  },
  /** Yeni (boş, 20 L) tank: ücret + boş raf gerekir. */
  buy(name) {
    const S = Game.S; this.ensure(S); if (S.tanks.length >= S.shelves) return { ok: false, why: 'Boş raf yok. Önce yeni raf satın al.' };
    if (S.coins < NEW_TANK_COST) return { ok: false, why: `Yeterli Altın Pul yok (${NEW_TANK_COST} gerekli).` };
    S.coins -= NEW_TANK_COST; const sc = Scape.fromTemplate('start'); sc.items = []; sc.liters = 20; sc.nid = sc.nid || 1; sc.sub.h = new Array(SUB_COLS).fill(0.05);
    S.tanks.push({ id: S.nextTankId++, name: (name || '').trim().slice(0, 18) || `Tank ${S.tanks.length + 1}`, scape: sc, water: Chem.fresh(S), creatures: [], clutches: [], last: S.clockMin });
    Game.ev('tankbuy'); Game.save(); UI.refreshTop(); return { ok: true, idx: S.tanks.length - 1 };
  },
  shelfInfo(S = Game.S) { this.ensure(S); const n = S.shelves; return n >= MAX_TANKS ? null : { n, cost: SHELF_COST[n], lvl: SHELF_LVL[n] }; },
  buyShelf() {
    const S = Game.S, i = this.shelfInfo(S); if (!i) return { ok: false, why: 'Tüm raflar açık.' }; if (Progress.level(S.xp) < i.lvl) return { ok: false, why: `Seviye ${i.lvl} gerekli.` }; if (S.coins < i.cost) return { ok: false, why: `Yeterli Altın Pul yok (${i.cost}).` };
    S.coins -= i.cost; S.shelves++; Game.save(); UI.refreshTop(); return { ok: true };
  },
  rename(idx, name) { const S = Game.S; this.ensure(S); const n = (name || '').trim().slice(0, 18); if (n) { S.tanks[idx].name = n; Game.save(); } },

  /** Su farkı: aklimatizasyon şoku puanı (sıcaklık, pH, GH). */
  shockScore(a, b) { return Math.abs(a.temp - b.temp) / 2 + Math.abs(a.ph - b.ph) * 2.2 + Math.abs(a.gh - b.gh) / 4; },
  /** Canlıyı etkin tanktan başka bir tanka taşı. */
  transfer(c, idx) {
    const S = Game.S; this.ensure(S); if (idx === S.activeTank) return { ok: false, why: 'Zaten bu tanktasın.' }; const slot = S.tanks[idx]; if (!slot || !slot.scape) return { ok: false, why: 'Tank bulunamadı.' };
    if ((slot.creatures || []).length >= tankCapFor(slot.scape.liters)) return { ok: false, why: 'Hedef tank dolu.' };
    if (c.species === 'betta' && c.sex === 'M' && (slot.creatures || []).some((x) => (x.genome.sp === 'betta') && x.genome.sex === 'M')) return { ok: false, why: 'Hedef tankta zaten bir erkek beta var; erkekler ayrı tutulmalı.' };
    const sc = this.shockScore(Chem.w, slot.water); let msg = `${c.name} ${slot.name} tankına taşındı.`;
    if (sc > 3) { const loss = clamp(0.04 * sc, 0.05, 0.3); c.vit = clamp((c.vit ?? 1) - loss, 0.35, 1); msg += ' Su farkı büyüktü: balık şok geçirdi.'; Game.notify('warn', `${c.name}: tanklar arası su farkı (şok puanı ${sc.toFixed(1)}).`); }
    c.sw && (c.x = c.sw.x = R.float(80, slot.scape.liters ? Scape.dims(slot.scape).W - 80 : 400), c.y = c.sw.y = R.float(120, 360));
    const json = c.toJSON(); json.x = c.x; json.y = c.y; Game.dropCreature(c); (slot.creatures = slot.creatures || []).push(json); Game.ev('transfer'); Game.save(); UI.toast(msg, sc > 3 ? 'bell' : 'fish', 3500); return { ok: true, shock: sc };
  },
};
