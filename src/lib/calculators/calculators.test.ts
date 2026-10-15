import { describe, expect, it } from 'vitest';
import { tankVolume } from './volume';
import { waterChange } from './waterChange';

describe('tankVolume', () => {
  it('60x30x35 = 63 L brüt', () => {
    expect(tankVolume({ shape: 'dikdortgen', length: 60, width: 30, height: 35 }).grossLiters).toBe(63);
  });
  it('payı düşer', () => {
    expect(tankVolume({ shape: 'dikdortgen', length: 100, width: 50, height: 40, displacementPct: 10 }).netLiters).toBe(180);
  });
  it('silindir', () => {
    expect(tankVolume({ shape: 'silindir', length: 20, height: 30 }).grossLiters).toBeCloseTo(9.4, 1);
  });
  it('hatalı girdide hata', () => {
    expect(() => tankVolume({ shape: 'dikdortgen', length: 0, width: 1, height: 1 })).toThrow();
    expect(() => tankVolume({ shape: 'dikdortgen', length: 1, height: 1 })).toThrow();
    expect(() => tankVolume({ shape: 'dikdortgen', length: 1, width: 1, height: 1, displacementPct: 100 })).toThrow();
  });
});

describe('waterChange', () => {
  it('80 -> 40 mg/L, kaynak 0: %50', () => {
    expect(waterChange({ netLiters: 100, currentNitrate: 80, targetNitrate: 40 })).toEqual({ fraction: 0.5, liters: 50 });
  });
  it('çeşme suyu nitratını hesaba katar', () => {
    expect(waterChange({ netLiters: 100, currentNitrate: 80, freshNitrate: 20, targetNitrate: 50 }).fraction).toBe(0.5);
  });
  it('hedefin altındaysa değişim gerekmez', () => {
    expect(waterChange({ netLiters: 100, currentNitrate: 10, targetNitrate: 40 }).liters).toBe(0);
  });
  it('ulaşılamaz hedefte hata', () => {
    expect(() => waterChange({ netLiters: 100, currentNitrate: 80, freshNitrate: 50, targetNitrate: 40 })).toThrow();
  });
});
