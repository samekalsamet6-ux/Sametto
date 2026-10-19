import { describe, expect, it } from 'vitest';
import { SEXES, type Sex, type Vec2 } from './model';
import { FORMS, PATCHES, kit } from './forms';
import { partAnchors, partsFor } from './parts';
import { species } from './index';

const ext = (form: string, sex: Sex, key: 'body' | 'tail' | 'dorsal') => {
  const pts: Vec2[] = kit.modelFor(form).silhouette(sex)[key];
  const xs = pts.map((p) => p[0]), ys = pts.map((p) => p[1]);
  return { w: Math.max(...xs) - Math.min(...xs), h: Math.max(...ys) - Math.min(...ys), x1: Math.max(...xs), y0: Math.min(...ys) };
};
const tips = (form: string, sex: Sex) => kit.modelFor(form).tailFin(sex).rays.map((q) => q[q.length - 1]);

describe('kılıçkuyruk formları', () => {
  it('standart ilk; kimlikler benzersiz; her formun yaması ve açıklaması var; wagtail/tuxedo form değil', () => {
    expect(FORMS[0].id).toBe('standart');
    expect(new Set(FORMS.map((f) => f.id)).size).toBe(FORMS.length);
    for (const f of FORMS) { expect(f.id in PATCHES).toBe(true); expect(f.aciklama.length).toBeGreaterThan(30); expect(f.id).not.toMatch(/wag|tuxedo|koi|pineapple/); }
    expect(species.forms?.map((f) => f.id)).toEqual(FORMS.map((f) => f.id));
    expect(FORMS.filter((f) => f.dogrulanmali).map((f) => f.id).sort()).toEqual(['delta', 'simpson']);
  });
  it('her formun silueti standarttan ölçülebilir biçimde farklı ve sonlu', () => {
    for (const f of FORMS.slice(1)) for (const s of SEXES) {
      const a = kit.modelFor(f.id).silhouette(s), b = kit.modelFor('standart').silhouette(s);
      expect(JSON.stringify(a)).not.toBe(JSON.stringify(b));
      expect([...a.body, ...a.tail, ...a.dorsal].every((p) => p.every(Number.isFinite))).toBe(true);
    }
  });
  it('bilinmeyen form standarta düşer', () => { expect(kit.modelFor('yok')).toBe(kit.modelFor('standart')); });

  it('kılıç: her formda erkeğin alt kuyruk ışını diğerlerinin çok ötesine uzar ve alt kenardadır; dişide kılıç yok', () => {
    for (const f of FORMS) {
      const t = tips(f.id, 'erkek');
      const xs = t.map((p) => p[0]);
      const sword = xs[0], rest = Math.max(...xs.slice(4));
      expect(sword, f.id).toBeGreaterThan(rest + 0.6);
      expect(t[0][1], f.id).toBeLessThan(t[Math.floor(t.length / 2)][1]); // alt kenardan çıkar
      const fem = tips(f.id, 'disi').map((p) => p[0]);
      expect(fem[0], `${f.id} dişi`).toBeLessThan(Math.max(...fem) + 1e-9);
      expect(Math.max(...fem), f.id).toBeLessThan(sword - 0.5);
    }
  });
  it('kılıç ince bir şerit: en alt 3 ışının uçları birbirine yakın', () => {
    const t = tips('standart', 'erkek');
    expect(Math.abs(t[0][1] - t[2][1])).toBeLessThan(0.12);
  });
  it('hifin: sırt yüzgeci standarttan çok yüksek', () => {
    for (const s of SEXES) expect(ext('hifin', s, 'dorsal').h).toBeGreaterThan(ext('standart', s, 'dorsal').h * 1.5);
  });
  it('lyretail: üst uç dışa uzar, ortası içeri çekilir', () => {
    for (const s of SEXES) {
      const r = tips('lyretail', s).map((q) => q[0]);
      const mid = r[Math.floor(r.length / 2)], top = r[r.length - 1];
      expect(top).toBeGreaterThan(mid + 0.1);
    }
  });
  it('simpson: hifin sırt + lyretail kuyruk; delta: hifin sırt + standarttan geniş kuyruk', () => {
    for (const s of SEXES) {
      expect(ext('simpson', s, 'dorsal').h).toBeGreaterThan(ext('standart', s, 'dorsal').h * 1.4);
      expect(ext('delta', s, 'dorsal').h).toBeGreaterThan(ext('standart', s, 'dorsal').h * 1.4);
      expect(ext('delta', s, 'tail').h).toBeGreaterThan(ext('standart', s, 'tail').h * 1.1);
      const r = tips('simpson', s).map((q) => q[0]);
      expect(r[r.length - 1]).toBeGreaterThan(r[Math.floor(r.length / 2)] + 0.1);
    }
  });
  it('çapalar ve parçalar her formda sonlu; kılıç yalnızca erkekte; gonopodium/gravid korunur', () => {
    for (const f of FORMS) for (const s of SEXES) {
      const a = kit.anchorsFor(f.id)(s);
      for (const v of Object.values(a)) expect(v!.pos.every(Number.isFinite)).toBe(true);
      expect(Object.keys(a).sort()).toEqual(Object.keys(partAnchors(s)).sort());
      expect(partsFor(s, f.id).map((p) => p.id)).toEqual(partsFor(s).map((p) => p.id));
      expect(!!a.kilic).toBe(s === 'erkek');
    }
    expect(species.partsFor('erkek', 'delta').some((p) => p.id === 'gonopodium')).toBe(true);
  });
  it('forma özgü parça metinleri standarttan farklı', () => {
    const std = partsFor('erkek').map((p) => p.aciklama).join('|');
    for (const f of FORMS.slice(1)) expect(partsFor('erkek', f.id).map((p) => p.aciklama).join('|')).not.toBe(std);
  });
});
