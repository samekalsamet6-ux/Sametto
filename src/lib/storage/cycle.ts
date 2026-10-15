export interface CycleEntry { date: string; nh3: number; no2: number; no3: number }
export interface CycleFile { schemaVersion: 1; entries: CycleEntry[] }
export type CycleState = 'veri-yok' | 'amonyak-asamasi' | 'nitrit-asamasi' | 'bekleniyor' | 'neredeyse' | 'tamamlandi-olasi';

export interface CycleStatus { state: CycleState; message: string }

export function evaluateCycle(entries: CycleEntry[]): CycleStatus {
  if (entries.length === 0) return { state: 'veri-yok', message: 'Henüz ölçüm yok.' };
  const s = [...entries].sort((a, b) => a.date.localeCompare(b.date));
  const ok = (e: CycleEntry) => e.nh3 === 0 && e.no2 === 0 && e.no3 > 0;
  const last = s[s.length - 1];
  if (ok(last)) {
    return s.length >= 2 && ok(s[s.length - 2])
      ? { state: 'tamamlandi-olasi', message: 'Son iki ölçümde amonyak ve nitrit 0, nitrat görünür: döngü büyük olasılıkla tamamlandı. Balık eklemeden önce amonyak dozuyla 24 saatlik doğrulama yapmanız önerilir.' }
      : { state: 'neredeyse', message: 'Amonyak ve nitrit 0, nitrat görünür. Bir sonraki ölçümde de aynıysa döngü tamamlanmış olabilir.' };
  }
  if (last.no2 > 0) return { state: 'nitrit-asamasi', message: 'Nitrit yüksek: döngünün orta aşamasındasınız. Sabırla ölçmeye devam edin.' };
  if (last.nh3 > 0) return { state: 'amonyak-asamasi', message: 'Amonyak görülüyor: bakteri topluluğu oluşuyor. Ölçüme devam edin.' };
  return { state: 'bekleniyor', message: 'Tüm değerler 0 veya nitrat yok: amonyak kaynağı eklediniz mi?' };
}

export function serialize(entries: CycleEntry[]): string {
  return JSON.stringify({ schemaVersion: 1, entries } satisfies CycleFile, null, 2);
}

export function parseImport(text: string): CycleEntry[] {
  let data: unknown;
  try { data = JSON.parse(text); } catch { throw new RangeError('Geçerli JSON değil'); }
  const f = data as Partial<CycleFile>;
  if (f?.schemaVersion !== 1 || !Array.isArray(f.entries)) throw new RangeError('Dosya biçimi tanınmadı');
  return f.entries.map((e, i) => {
    const ok = typeof e?.date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(e.date) && [e.nh3, e.no2, e.no3].every((n) => typeof n === 'number' && n >= 0 && Number.isFinite(n));
    if (!ok) throw new RangeError(`Kayıt ${i + 1} geçersiz`);
    return { date: e.date, nh3: e.nh3, no2: e.no2, no3: e.no3 };
  });
}
