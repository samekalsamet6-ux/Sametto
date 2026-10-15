import { describe, expect, it } from 'vitest';
import { stockRange } from './calculators/stock';
import { addDays, gestationWindow } from './calculators/gestation';
import { feedingTimes, planFeeding } from './calculators/feeding';
import { buildIcs, fold } from './calculators/ics';
import { autosomal, expectedCounts, normGenotype, xLinked, yLinked } from './calculators/genetics';
import { Pedigree, parsePedigree } from './calculators/inbreeding';
import { evaluateCycle, parseImport, serialize } from './storage/cycle';

describe('stockRange', () => {
  it('100 L varsayılan', () => {
    const r = stockRange({ netLiters: 100, filtration: 'orta', plants: 'orta', waterChange: 'haftalik', fryPresent: false });
    expect(r.litersPerFish).toBe(4);
    expect(r.recommended).toBe(25);
    expect(r.upperLimit).toBe(31);
  });
  it('yavru ve zayıf filtre sayıyı düşürür', () => {
    const a = stockRange({ netLiters: 100, filtration: 'orta', plants: 'orta', waterChange: 'haftalik', fryPresent: false });
    const b = stockRange({ netLiters: 100, filtration: 'zayif', plants: 'orta', waterChange: 'haftalik', fryPresent: true });
    expect(b.recommended).toBeLessThan(a.recommended);
  });
  it('geçersiz girdi', () => {
    expect(() => stockRange({ netLiters: 0, filtration: 'orta', plants: 'orta', waterChange: 'haftalik', fryPresent: false })).toThrow();
  });
});

describe('gestation', () => {
  it('21-30 gün', () => {
    expect(gestationWindow({ startDate: '2026-01-01' })).toEqual({ earliest: '2026-01-22', middle: '2026-01-27', latest: '2026-01-31' });
  });
  it('ay sınırı ve artık yıl', () => {
    expect(addDays('2024-02-28', 2)).toBe('2024-03-01');
  });
  it('geçersiz tarih ve aralık', () => {
    expect(() => gestationWindow({ startDate: '2026-02-30' })).toThrow();
    expect(() => gestationWindow({ startDate: '2026-01-01', minDays: 30, maxDays: 21 })).toThrow();
  });
});

describe('feeding', () => {
  it('saatleri eşit dağıtır', () => {
    expect(feedingTimes(3, 8, 20)).toEqual(['08:00', '14:00', '20:00']);
    expect(feedingTimes(1)).toEqual(['08:00']);
    expect(feedingTimes(2, 8, 20)).toEqual(['08:00', '20:00']);
  });
  it('sayısı 0 olan grup atlanır', () => {
    expect(planFeeding([{ name: 'a', count: 0, mealsPerDay: 2 }, { name: 'b', count: 3, mealsPerDay: 2 }])).toHaveLength(1);
  });
  it('geçersiz öğün', () => { expect(() => feedingTimes(0)).toThrow(); });
});

describe('ics', () => {
  const ics = buildIcs([{ title: 'Su değişimi, %30', freq: 'WEEKLY', byDay: 'SA' }], '2026-03-07', new Date('2026-01-01T00:00:00Z'));
  it('temel yapı', () => {
    expect(ics).toContain('BEGIN:VCALENDAR');
    expect(ics).toContain('RRULE:FREQ=WEEKLY;BYDAY=SA');
    expect(ics).toContain('DTSTART;VALUE=DATE:20260307');
    expect(ics).toContain('SUMMARY:Su değişimi\\, %30');
    expect(ics.endsWith('END:VCALENDAR\r\n')).toBe(true);
  });
  it('uzun satırları böler', () => {
    const folded = fold('X'.repeat(200));
    for (const l of folded.split('\r\n')) expect(new TextEncoder().encode(l).length).toBeLessThanOrEqual(75);
    expect(folded.replace(/\r\n /g, '')).toBe('X'.repeat(200));
  });
  it('geçersiz tarih', () => { expect(() => buildIcs([], 'dün')).toThrow(); });
});

describe('genetics', () => {
  it('Bb x Bb = 1:2:1', () => {
    expect(autosomal(['B', 'b'], ['B', 'b'])).toEqual({ BB: 0.25, Bb: 0.5, bb: 0.25 });
  });
  it('Bb x bb = 1:1', () => {
    expect(autosomal(['B', 'b'], ['b', 'b'])).toEqual({ Bb: 0.5, bb: 0.5 });
  });
  it('genotip normalizasyonu', () => { expect(normGenotype('b', 'B')).toBe('Bb'); });
  it('Y-bağlantılı: yalnızca erkekler', () => {
    const r = yLinked('t');
    expect(r.sons).toEqual({ XYt: 1 });
    expect(r.daughters).toEqual({ XX: 1 });
  });
  it('X-bağlantılı', () => {
    const r = xLinked(['a', 'A'], 'A');
    expect(r.daughters).toEqual({ AA: 0.5, Aa: 0.5 });
    expect(r.sons).toEqual({ aY: 0.5, AY: 0.5 });
  });
  it('beklenen sayılar', () => { expect(expectedCounts({ bb: 0.25 }, 40)).toEqual({ bb: 10 }); });
  it('geçersiz alel', () => { expect(() => autosomal(['BB', 'b'], ['b', 'b'])).toThrow(); });
});

describe('inbreeding (Wright)', () => {
  const ped = new Pedigree(parsePedigree(`
    S
    M
    A,S,M
    B,S,M
    C,S,N
    D,S,M
    X,A,
    # ilk kuzen: büyükanne/büyükbaba G1,G2
    G1
    G2
    P,G1,G2
    Q,G1,G2
    R,P,
    T,Q,
    DD,S,M
    SD,S,DD
  `));
  it('tam kardeş = 0,25', () => { expect(ped.matingF('A', 'B')).toBe(0.25); });
  it('yarım kardeş = 0,125', () => { expect(ped.matingF('A', 'C')).toBe(0.125); });
  it('ebeveyn x yavru = 0,25', () => { expect(ped.matingF('S', 'DD')).toBe(0.25); });
  it('ilk kuzen = 0,0625', () => { expect(ped.matingF('R', 'T')).toBe(0.0625); });
  it('akraba olmayan = 0', () => { expect(ped.matingF('S', 'G1')).toBe(0); });
  it('bireyin F değeri', () => { expect(ped.f('SD')).toBe(0.25); expect(ped.f('A')).toBe(0); });
  it('ortak atanın F değeri hesaba katılır', () => {
    // SD (F=0.25) ile kendi ebeveyni S'ye yeniden dönüş
    expect(ped.matingF('SD', 'S')).toBeCloseTo(0.5 * (0.5 + 0.25) + 0, 10);
  });
  it('döngü hatası', () => { expect(() => new Pedigree(parsePedigree('A,B,\nB,A,'))).toThrow(); });
  it('bilinmeyen birey', () => { expect(() => ped.matingF('Z', 'S')).toThrow(); });
  it('yinelenen kod', () => { expect(() => parsePedigree('A\nA')).toThrow(); });
});

describe('cycle', () => {
  const e = (date: string, nh3: number, no2: number, no3: number) => ({ date, nh3, no2, no3 });
  it('aşamalar', () => {
    expect(evaluateCycle([]).state).toBe('veri-yok');
    expect(evaluateCycle([e('2026-01-01', 2, 0, 0)]).state).toBe('amonyak-asamasi');
    expect(evaluateCycle([e('2026-01-01', 0, 1, 0)]).state).toBe('nitrit-asamasi');
    expect(evaluateCycle([e('2026-01-01', 0, 0, 10)]).state).toBe('neredeyse');
    expect(evaluateCycle([e('2026-01-02', 0, 0, 10), e('2026-01-01', 0, 0, 5)]).state).toBe('tamamlandi-olasi');
    expect(evaluateCycle([e('2026-01-01', 0, 0, 0)]).state).toBe('bekleniyor');
  });
  it('dışa/içe aktarma gidiş-dönüş', () => {
    const list = [e('2026-01-01', 1, 0, 0)];
    expect(parseImport(serialize(list))).toEqual(list);
  });
  it('bozuk içe aktarma', () => {
    expect(() => parseImport('x')).toThrow();
    expect(() => parseImport('{"schemaVersion":2,"entries":[]}')).toThrow();
    expect(() => parseImport('{"schemaVersion":1,"entries":[{"date":"x"}]}')).toThrow();
  });
});
