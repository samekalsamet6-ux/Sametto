'use strict';
/* =====================================================================
   07 · KAYIT — 3 yuva, sürüm/göç, yedek, JSON dışa/içe aktarma
   ===================================================================== */
const SAVE_VERSION = 2;
const SLOTS = 3;

const Save = {
  key: (i) => `akv.slot.${i}`,
  metaKey: 'akv.meta',
  meta() { try { return JSON.parse(localStorage.getItem(this.metaKey)) || { slot: 0 }; } catch (e) { return { slot: 0 }; } },
  setSlot(i) { try { localStorage.setItem(this.metaKey, JSON.stringify({ slot: i })); } catch (e) { /* kota / gizli mod */ } },

  newState() {
    return {
      v: SAVE_VERSION, name: 'Misafir', avatar: 0, coins: 500, rep: 0, xp: 0, clockMin: 8 * 60 + 30,
      creatures: [], pedigree: {}, discovered: {}, notifs: [], tasks: {}, claimed: {},
      daily: { last: '', idx: 0 }, stats: { born: 0, sold: 0, fed: 0, playSec: 0, maxSale: 0, tests: 0, taps: 0 },
      settings: {
        theme: 'ocean', font: 1, reduce: false, cb: false, speed: 1, lamp: 'auto', bgMute: true, sessionReminder: false,
        audio: { master: 0.8, music: 0.5, amb: 0.5, sfx: 0.7, style: 'ambient' },
      },
      onboarded: false, litters: [], nextId: 1, lastSeen: Date.now(), savedAt: 0, createdAt: Date.now(),
    };
  },

  /** Eski kayıtları şimdiki sürüme taşır. Yeni sürüm = yeni `case`. */
  migrate(d) {
    if (!d || typeof d !== 'object') throw new Error('Geçersiz kayıt');
    d.v = d.v || 1;
    while (d.v < SAVE_VERSION) {
      switch (d.v) {
        case 1: // v1 → v2: soyağacına genom/cinsiyet kaydı, üreme alanları
          d.pedigree = d.pedigree || {};
          for (const c of d.creatures || []) { const r = d.pedigree[c.id] || (d.pedigree[c.id] = { s: c.sire || 0, d: c.dam || 0 }); Object.assign(r, { name: r.name || c.name, sex: c.genome.sex, g: c.genome, seed: c.seed, bornT: c.bornT }); }
          d.litters = d.litters || [];
          break;
        default: break;
      }
      d.v++;
    }
    // eksik alanları varsayılanla tamamla (ileriye dönük güvenlik)
    const base = this.newState();
    for (const k in base) if (d[k] === undefined) d[k] = base[k];
    d.settings = Object.assign({}, base.settings, d.settings); d.settings.audio = Object.assign({}, base.settings.audio, d.settings.audio);
    d.stats = Object.assign({}, base.stats, d.stats);
    if (!Array.isArray(d.creatures)) throw new Error('Kayıt bozuk: canlılar yok');
    return d;
  },

  write(i, obj) {
    try {
      const k = this.key(i), prev = localStorage.getItem(k);
      obj.savedAt = Date.now();
      localStorage.setItem(k, JSON.stringify(obj));
      if (prev && Date.now() - (this._bakT || 0) > 300000) { // yedek: en fazla 5 dakikada bir tazelenir
        try { JSON.parse(prev); localStorage.setItem(k + '.bak', prev); this._bakT = Date.now(); } catch (e) { /* bozuk önceki kaydı yedeğe yazma */ }
      }
      return true;
    } catch (e) { console.warn('Kayıt yazılamadı', e); return false; }
  },

  /** Yuvayı okur; bozuksa yedekten dener. {data, fromBackup} ya da null. */
  read(i) {
    for (const [suffix, bak] of [['', false], ['.bak', true]]) {
      try { const raw = localStorage.getItem(this.key(i) + suffix); if (!raw) continue; return { data: this.migrate(JSON.parse(raw)), fromBackup: bak }; } catch (e) { console.warn('Kayıt okunamadı', suffix, e); }
    }
    return null;
  },
  clear(i) { try { localStorage.removeItem(this.key(i)); localStorage.removeItem(this.key(i) + '.bak'); } catch (e) { /* yoksay */ } },

  slotInfo(i) {
    const r = this.read(i); if (!r) return null; const d = r.data;
    return { name: d.name, day: dayOf(d.clockMin), fish: d.creatures.length, savedAt: d.savedAt, level: Progress.level(d.xp), backup: r.fromBackup };
  },

  exportString(obj) { return JSON.stringify(obj, null, 1); },
  importString(str) { return this.migrate(JSON.parse(str)); },
};

/* ---------------- İlerleme: XP → seviye (1–100) ---------------- */
const Progress = {
  level: (xp) => clamp(1 + Math.floor(Math.sqrt(Math.max(0, xp) / 25)), 1, 100),
  xpFor: (lvl) => 25 * (lvl - 1) * (lvl - 1),
  title(lvl) { let t = TITLES[0][1]; for (const [l, n] of TITLES) if (lvl >= l) t = n; return t; },
};
