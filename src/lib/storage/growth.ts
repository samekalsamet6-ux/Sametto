export interface Cohort { id: string; name: string; birthDate: string }
export interface Measurement { cohortId: string; date: string; lengthMm: number; sampleSize: number }
export interface GrowthFile { schemaVersion: 1; cohorts: Cohort[]; measurements: Measurement[] }

const MS = 86_400_000;
const isDate = (s: unknown): s is string => typeof s === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(s) && !Number.isNaN(Date.parse(s));
const day = (s: string) => Date.parse(s + 'T00:00:00Z') / MS;

export function ageDays(birthDate: string, date: string): number {
  if (!isDate(birthDate) || !isDate(date)) throw new RangeError('Tarih YYYY-AA-GG olmalı');
  return Math.round(day(date) - day(birthDate));
}

export interface GrowthPoint { date: string; ageDays: number; lengthMm: number; sampleSize: number }
export interface GrowthSegment { from: string; to: string; mmPerWeek: number }
export interface GrowthSummary { points: GrowthPoint[]; segments: GrowthSegment[]; overallMmPerWeek: number | null }

export function summarize(cohort: Cohort, all: Measurement[]): GrowthSummary {
  const points = all
    .filter((m) => m.cohortId === cohort.id)
    .sort((a, b) => a.date.localeCompare(b.date))
    .map((m) => ({ date: m.date, ageDays: ageDays(cohort.birthDate, m.date), lengthMm: m.lengthMm, sampleSize: m.sampleSize }));
  const segments: GrowthSegment[] = [];
  for (let i = 1; i < points.length; i++) {
    const dd = points[i].ageDays - points[i - 1].ageDays;
    if (dd > 0) segments.push({ from: points[i - 1].date, to: points[i].date, mmPerWeek: Math.round(((points[i].lengthMm - points[i - 1].lengthMm) / dd) * 7 * 100) / 100 });
  }
  let overall: number | null = null;
  if (points.length >= 2) {
    const dd = points[points.length - 1].ageDays - points[0].ageDays;
    if (dd > 0) overall = Math.round(((points[points.length - 1].lengthMm - points[0].lengthMm) / dd) * 7 * 100) / 100;
  }
  return { points, segments, overallMmPerWeek: overall };
}

export function validateMeasurement(m: Measurement, cohort: Cohort): void {
  if (!isDate(m.date)) throw new RangeError('Ölçüm tarihi geçersiz');
  if (ageDays(cohort.birthDate, m.date) < 0) throw new RangeError('Ölçüm tarihi doğum tarihinden önce olamaz');
  if (!(m.lengthMm > 0 && m.lengthMm < 200)) throw new RangeError('Boy 0–200 mm arasında olmalı');
  if (!Number.isInteger(m.sampleSize) || m.sampleSize < 1) throw new RangeError('Örnek sayısı en az 1 olmalı');
}

export const serialize = (cohorts: Cohort[], measurements: Measurement[]): string => JSON.stringify({ schemaVersion: 1, cohorts, measurements } satisfies GrowthFile, null, 2);

export function parseImport(text: string): { cohorts: Cohort[]; measurements: Measurement[] } {
  let data: unknown;
  try { data = JSON.parse(text); } catch { throw new RangeError('Geçerli JSON değil'); }
  const f = data as Partial<GrowthFile>;
  if (f?.schemaVersion !== 1 || !Array.isArray(f.cohorts) || !Array.isArray(f.measurements)) throw new RangeError('Dosya biçimi tanınmadı');
  const cohorts = f.cohorts.map((c, i) => {
    if (typeof c?.id !== 'string' || typeof c?.name !== 'string' || !isDate(c?.birthDate)) throw new RangeError(`Grup ${i + 1} geçersiz`);
    return { id: c.id, name: c.name, birthDate: c.birthDate };
  });
  const ids = new Set(cohorts.map((c) => c.id));
  const measurements = f.measurements.map((m, i) => {
    if (!ids.has(m?.cohortId) || !isDate(m?.date) || typeof m.lengthMm !== 'number' || !(m.lengthMm > 0) || !Number.isInteger(m.sampleSize)) throw new RangeError(`Ölçüm ${i + 1} geçersiz`);
    return { cohortId: m.cohortId, date: m.date, lengthMm: m.lengthMm, sampleSize: m.sampleSize };
  });
  return { cohorts, measurements };
}
