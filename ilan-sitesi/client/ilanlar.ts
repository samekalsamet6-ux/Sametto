import './site.ts';
import { narrowOptions } from '../shared/filters.ts';

const panel = document.querySelector<HTMLDetailsElement>('#filtre-panel');
const form = document.querySelector<HTMLFormElement>('#filtre');

// Filtre: tür seçilince şekil ve renk listeleri o türe göre daralır; seçim değişince sonuçlar otomatik yenilenir
// ("Ara" düğmesi betiksiz kullanım ve metin alanları için durur).
const tur = document.querySelector<HTMLSelectElement>('#f-tur');
const sekil = document.querySelector<HTMLSelectElement>('#f-sekil');
const renk = document.querySelector<HTMLSelectElement>('#f-renk');
function fill(sel: HTMLSelectElement, items: { id: string; ad: string }[]) {
  sel.replaceChildren(new Option('Tümü', ''), ...items.map((i) => new Option(i.ad, i.id)));
  sel.disabled = items.length === 0;
}
tur?.addEventListener('change', () => {
  const n = narrowOptions(tur.value);
  if (sekil) fill(sekil, n.forms);
  if (renk) fill(renk, n.variants);
});
const FLAG = 'sp-filtre-acik';
if (form) {
  form.addEventListener('change', (ev) => {
    if ((ev.target as HTMLElement).tagName !== 'SELECT') return;
    try { sessionStorage.setItem(FLAG, '1'); } catch { /* yoksay */ }
    form.requestSubmit();
  });
}

// Dar ekranda filtre kapalı başlar (üstteki "Filtrele" düğmesiyle açılır); geniş ekranda her zaman açıktır.
if (panel) {
  const mq = matchMedia('(max-width: 640px)');
  let keepOpen = false; // seçimle yenilenen sayfada filtre açık kalır (sıradaki seçimi yapabilsin)
  try { keepOpen = sessionStorage.getItem(FLAG) === '1'; sessionStorage.removeItem(FLAG); } catch { /* yoksay */ }
  const sync = () => { panel.open = !mq.matches || keepOpen; keepOpen = false; };
  sync();
  mq.addEventListener('change', sync);
}
