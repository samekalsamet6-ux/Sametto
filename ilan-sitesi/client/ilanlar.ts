import './site.ts';
import { CATALOG } from '../shared/catalog.ts';

// Filtre: tür seçilince şekil ve renk listeleri o türe göre dolar.
const tur = document.querySelector<HTMLSelectElement>('#f-tur');
const sekil = document.querySelector<HTMLSelectElement>('#f-sekil');
const renk = document.querySelector<HTMLSelectElement>('#f-renk');
function fill(sel: HTMLSelectElement, items: { id: string; ad: string }[]) {
  sel.replaceChildren(new Option('Tümü', ''), ...items.map((i) => new Option(i.ad, i.id)));
  sel.disabled = items.length === 0;
}
tur?.addEventListener('change', () => {
  const sp = CATALOG.find((s) => s.id === tur.value);
  if (sekil) fill(sekil, sp?.forms ?? []);
  if (renk) fill(renk, sp?.variants ?? []);
});
