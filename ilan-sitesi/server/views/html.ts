// Küçük, bağımlılıksız şablon yardımcısı: html`...` içindeki her değer varsayılan olarak kaçışlanır.
export class SafeHtml { readonly value: string; constructor(value: string) { this.value = value; } toString() { return this.value; } }
export const raw = (s: string): SafeHtml => new SafeHtml(s);

export function esc(v: unknown): string {
  return String(v ?? '').replace(/[&<>"'`]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;', '`': '&#96;' })[c]!);
}

type Part = unknown;
function render(v: Part): string {
  if (v instanceof SafeHtml) return v.value;
  if (Array.isArray(v)) return v.map(render).join('');
  if (v === null || v === undefined || v === false) return '';
  return esc(v);
}
export function html(strings: TemplateStringsArray, ...values: Part[]): SafeHtml {
  let out = strings[0];
  values.forEach((v, i) => { out += render(v) + strings[i + 1]; });
  return new SafeHtml(out);
}
