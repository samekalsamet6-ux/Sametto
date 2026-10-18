// İlan formu ve akvaryum düzenleyicisi için ortak: katalogdan <select> doldurma.
import { itemLabel } from '../shared/catalog.ts';
export interface SelItem { id: string; ad: string; grup?: string; dogrulanmali?: boolean }

/** `sel` içeriğini yeniden kurar (gruplu ise <optgroup>); `keep` listede varsa seçili bırakır. */
export function fillSelect(sel: HTMLSelectElement, items: SelItem[], keep?: string): void {
  sel.replaceChildren();
  const groups = new Map<string, HTMLElement>();
  for (const it of items) {
    let parent: HTMLElement = sel;
    if (it.grup) { if (!groups.has(it.grup)) { const g = document.createElement('optgroup'); g.label = it.grup; sel.append(g); groups.set(it.grup, g); } parent = groups.get(it.grup)!; }
    parent.append(new Option(itemLabel({ ...it, grup: it.grup ?? '' }), it.id));
  }
  if (keep && items.some((i) => i.id === keep)) sel.value = keep;
}
