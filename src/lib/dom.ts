/** "1,5" ve "1.5" biçimlerini kabul eder. Boşsa NaN. */
export function num(v: FormDataEntryValue | null | undefined): number {
  const s = String(v ?? '').trim().replace(',', '.');
  return s === '' ? NaN : Number(s);
}
export function el<T extends HTMLElement>(id: string): T {
  return document.getElementById(id) as T;
}
export function download(name: string, mime: string, text: string) {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([text], { type: mime }));
  a.download = name;
  a.click();
  URL.revokeObjectURL(a.href);
}
