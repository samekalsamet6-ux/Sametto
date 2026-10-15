import type { Cause } from '../data/belirtiler';

export type Strength = 'guclu' | 'olasi' | 'mumkun';
export interface Ranked { cause: Cause; score: number; ratio: number; strength: Strength }
export interface Triage { urgent: boolean; reasons: string[] }

const URGENT = new Set(['ani-toplu-olum', 'yuzeyde-nefes']);

/** Seçilen belirtilere göre olası nedenleri sıralar. Kesin teşhis değildir. */
export function rankCauses(selected: string[], causes: Cause[]): Ranked[] {
  const sel = [...new Set(selected)];
  if (sel.length === 0) return [];
  const max = 3 * sel.length;
  return causes
    .map((cause) => {
      const score = sel.reduce((s, id) => s + (cause.weights[id] ?? 0), 0);
      const ratio = score / max;
      const strength: Strength = ratio >= 0.6 ? 'guclu' : ratio >= 0.3 ? 'olasi' : 'mumkun';
      return { cause, score, ratio, strength };
    })
    .filter((r) => r.score > 0)
    .sort((a, b) => b.score - a.score || a.cause.title.localeCompare(b.cause.title, 'tr'));
}

export function triage(selected: string[]): Triage {
  const reasons: string[] = [];
  if (selected.includes('ani-toplu-olum')) reasons.push('Kısa sürede birden çok balık öldü.');
  if (selected.includes('yuzeyde-nefes')) reasons.push('Yüzeyde nefes alma oksijen veya zehirli madde sorununa işaret edebilir.');
  return { urgent: selected.some((s) => URGENT.has(s)), reasons };
}
