import { describe, expect, it } from 'vitest';
import { costModel } from './calculators/cost';
import { fromTargetConcentration, scaleLabelRate } from './calculators/dosage';
import { layoutPedigree } from './calculators/pedigree-layout';
import { parsePedigree } from './calculators/inbreeding';
import { ageDays, parseImport, serialize, summarize, validateMeasurement } from './storage/growth';

const base = { watts: 100, hoursPerDay: 10, pricePerKwh: 3, feedPerMonth: 200, waterTreatmentPerMonth: 50, medicinePerMonth: 0, otherPerMonth: 0, equipmentCost: 1200, equipmentLifeMonths: 24, fishSoldPerMonth: 20, pricePerFish: 40 };

describe('costModel', () => {
  it('temel hesap', () => {
    const r = costModel(base);
    expect(r.electricityPerMonth).toBe(90); // 0,1 kW × 10 sa × 30 gün × 3
    expect(r.equipmentPerMonth).toBe(50);
    expect(r.totalPerMonth).toBe(390);
    expect(r.costPerFish).toBe(19.5);
    expect(r.revenuePerMonth).toBe(800);
    expect(r.profitPerMonth).toBe(410);
    expect(r.breakEvenFishPerMonth).toBe(10);
  });
  it('satış yoksa balık başı maliyet yok', () => {
    const r = costModel({ ...base, fishSoldPerMonth: 0 });
    expect(r.costPerFish).toBeNull();
    expect(r.profitPerMonth).toBe(-390);
  });
  it('fiyat 0 ise başa baş hesaplanamaz', () => { expect(costModel({ ...base, pricePerFish: 0 }).breakEvenFishPerMonth).toBeNull(); });
  it('geçersiz girdi', () => {
    expect(() => costModel({ ...base, watts: -1 })).toThrow();
    expect(() => costModel({ ...base, equipmentLifeMonths: 0 })).toThrow();
    expect(() => costModel({ ...base, hoursPerDay: 25 })).toThrow();
    expect(() => costModel({ ...base, feedPerMonth: NaN })).toThrow();
  });
});

describe('dosage (yalnızca etiket oranı ölçekleme)', () => {
  it('etiket oranı ölçeklenir', () => { expect(scaleLabelRate({ netLiters: 100, labelAmount: 5, labelPerLiters: 40 }).amount).toBe(12.5); });
  it('hedef derişimden mL', () => { expect(fromTargetConcentration({ netLiters: 50, targetMgPerL: 2, stockMgPerMl: 100 }).amount).toBe(1); });
  it('geçersiz girdi', () => {
    expect(() => scaleLabelRate({ netLiters: 0, labelAmount: 5, labelPerLiters: 40 })).toThrow();
    expect(() => scaleLabelRate({ netLiters: 10, labelAmount: -1, labelPerLiters: 40 })).toThrow();
    expect(() => fromTargetConcentration({ netLiters: 10, targetMgPerL: 1, stockMgPerMl: 0 })).toThrow();
    expect(() => scaleLabelRate({ netLiters: NaN, labelAmount: 1, labelPerLiters: 1 })).toThrow();
  });
});

describe('pedigree layout', () => {
  const rows = parsePedigree('S\nM\nA,S,M\nB,S,M\nC,A,B');
  const l = layoutPedigree(rows);
  it('kuşaklar', () => {
    const g = Object.fromEntries(l.nodes.map((n) => [n.id, n.generation]));
    expect(g).toEqual({ S: 0, M: 0, A: 1, B: 1, C: 2 });
  });
  it('kenar sayısı ve roller', () => {
    expect(l.edges).toHaveLength(6);
    expect(l.edges.filter((e) => e.to === 'C').map((e) => e.role).sort()).toEqual(['anne', 'baba']);
  });
  it('F değerleri', () => {
    const f = Object.fromEntries(l.nodes.map((n) => [n.id, n.f]));
    expect(f.C).toBe(0.25);
    expect(f.A).toBe(0);
  });
  it('koordinatlar tuval içinde', () => {
    for (const n of l.nodes) { expect(n.x).toBeGreaterThanOrEqual(0); expect(n.x).toBeLessThanOrEqual(l.width); expect(n.y).toBeLessThanOrEqual(l.height); }
  });
  it('tanımsız ata soluk düğüm olarak eklenir', () => {
    const r = layoutPedigree(parsePedigree('X,P,Q'));
    expect(r.nodes.find((n) => n.id === 'P')!.known).toBe(false);
    expect(r.nodes.find((n) => n.id === 'X')!.generation).toBe(1);
  });
  it('döngü hata verir', () => { expect(() => layoutPedigree(parsePedigree('A,B,\nB,A,'))).toThrow(); });
});

describe('growth', () => {
  const cohort = { id: 'c1', name: 'Parti 1', birthDate: '2026-01-01' };
  const ms = [
    { cohortId: 'c1', date: '2026-01-15', lengthMm: 10, sampleSize: 5 },
    { cohortId: 'c1', date: '2026-01-29', lengthMm: 16, sampleSize: 5 },
    { cohortId: 'c2', date: '2026-01-29', lengthMm: 99, sampleSize: 5 },
  ];
  it('yaş günleri', () => { expect(ageDays('2026-01-01', '2026-01-29')).toBe(28); });
  it('segment ve genel hız', () => {
    const s = summarize(cohort, ms);
    expect(s.points).toHaveLength(2);
    expect(s.segments).toEqual([{ from: '2026-01-15', to: '2026-01-29', mmPerWeek: 3 }]);
    expect(s.overallMmPerWeek).toBe(3);
  });
  it('tek ölçümde hız yok', () => { expect(summarize(cohort, [ms[0]]).overallMmPerWeek).toBeNull(); });
  it('doğrulama', () => {
    expect(() => validateMeasurement({ ...ms[0], date: '2025-12-31' }, cohort)).toThrow(/doğum/);
    expect(() => validateMeasurement({ ...ms[0], lengthMm: 0 }, cohort)).toThrow();
    expect(() => validateMeasurement({ ...ms[0], sampleSize: 0 }, cohort)).toThrow();
    expect(() => validateMeasurement(ms[0], cohort)).not.toThrow();
  });
  it('dışa/içe aktarma gidiş-dönüş', () => {
    const out = parseImport(serialize([cohort], ms.slice(0, 2)));
    expect(out.cohorts).toEqual([cohort]);
    expect(out.measurements).toHaveLength(2);
  });
  it('bozuk içe aktarma', () => {
    expect(() => parseImport('x')).toThrow();
    expect(() => parseImport(serialize([cohort], ms))).toThrow(); // c2 grubu yok
    expect(() => parseImport('{"schemaVersion":1,"cohorts":[{"id":"a","name":"x","birthDate":"bad"}],"measurements":[]}')).toThrow();
  });
});
