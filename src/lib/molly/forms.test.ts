import { describe, expect, it } from 'vitest';
import { SEXES, type Sex, type Vec2 } from './model';
import { FORMS, PATCHES, kit } from './forms';
import { partAnchors, partsFor } from './parts';
import { species } from './index';

const ext = (form: string, sex: Sex, key: 'body' | 'tail' | 'dorsal') => {
  const pts: Vec2[] = kit.modelFor(form).silhouette(sex)[key];
  const xs = pts.map((p) => p[0]), ys = pts.map((p) => p[1]);
  return { w: Math.max(...xs) - Math.min(...xs), h: Math.max(...ys) - Math.min(...ys) };
};

describe('molly formları', () => {
  it('standart ilk; kimlikler benzersiz; her formun yaması ve açıklaması var', () => {
    expect(FORMS[0].id).toBe('standart');
    expect(new Set(FORMS.map((f) => f.id)).size).toBe(FORMS.length);
    for (const f of FORMS) { expect(f.id in PATCHES).toBe(true); expect(f.aciklama.length).toBeGreaterThan(30); }
    expect(species.forms?.map((f) => f.id)).toEqual(FORMS.map((f) => f.id));
  });
  it('her formun silueti standarttan ölçülebilir biçimde farklı ve sonlu', () => {
    for (const f of FORMS.slice(1)) for (const s of SEXES) {
      const a = kit.modelFor(f.id).silhouette(s), b = kit.modelFor('standart').silhouette(s);
      expect(JSON.stringify(a)).not.toBe(JSON.stringify(b));
      expect([...a.body, ...a.tail, ...a.dorsal].every((p) => p.every(Number.isFinite))).toBe(true);
    }
  });
  it('bilinmeyen form standarta düşer', () => {
    expect(kit.modelFor('yok')).toBe(kit.modelFor('standart'));
  });

  it('sailfin: erkekte sırt yüzgeci standarttan çok yüksek, dişide erkekten alçak', () => {
    const h = (f: string, s: Sex) => ext(f, s, 'dorsal').h;
    expect(h('sailfin', 'erkek')).toBeGreaterThan(h('standart', 'erkek') * 1.5);
    expect(h('sailfin', 'disi')).toBeGreaterThan(h('standart', 'disi') * 1.2);
    expect(h('sailfin', 'disi')).toBeLessThan(h('sailfin', 'erkek'));
  });
  it('lyretail: kuyruk uçları dışa uzar, ortası içeri çekilir', () => {
    for (const s of SEXES) {
      const r = kit.modelFor('lyretail').tailFin(s).rays.map((q) => q[q.length - 1][0]);
      const mid = r[Math.floor(r.length / 2)], edge = Math.max(r[0], r[r.length - 1]);
      expect(edge).toBeGreaterThan(mid + 0.15);
      expect(ext('lyretail', s, 'tail').h).toBeGreaterThan(ext('standart', s, 'tail').h * 1.2);
    }
  });
  it('veiltail: kuyruk standarttan belirgin uzun, çatallanmaz', () => {
    expect(ext('veiltail', 'erkek', 'tail').w).toBeGreaterThan(ext('standart', 'erkek', 'tail').w * 1.3);
  });
  it('balloon: gövde kısa ve derin', () => {
    for (const s of SEXES) {
      expect(ext('balloon', s, 'body').w).toBeLessThan(ext('standart', s, 'body').w * 0.9);
      expect(ext('balloon', s, 'body').h).toBeGreaterThan(ext('standart', s, 'body').h * 1.3);
    }
  });
  it('çapalar ve parçalar her formda sonlu; cinsiyete özgü parçalar korunur', () => {
    for (const f of FORMS) for (const s of SEXES) {
      const a = kit.anchorsFor(f.id)(s);
      for (const v of Object.values(a)) expect(v!.pos.every(Number.isFinite)).toBe(true);
      expect(Object.keys(a).sort()).toEqual(Object.keys(partAnchors(s)).sort());
      expect(partsFor(s, f.id).map((p) => p.id)).toEqual(partsFor(s).map((p) => p.id));
    }
    expect(species.partsFor('erkek', FORMS[FORMS.length - 1].id).some((p) => p.id === 'gonopodium')).toBe(true);
  });
  it('forma özgü parça metinleri standarttan farklı', () => {
    const f = FORMS[1].id;
    const std = partsFor('erkek').map((p) => p.aciklama).join('|');
    expect(partsFor('erkek', f).map((p) => p.aciklama).join('|')).not.toBe(std);
  });
});
