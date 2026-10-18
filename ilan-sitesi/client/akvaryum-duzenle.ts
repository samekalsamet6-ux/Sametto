import './site.ts';
import { CATALOG } from '../shared/catalog.ts';
import { mountViewer } from './viewer3d.ts';
import { fillSelect } from './catalog-select.ts';

// Akvaryum düzenleyici: tür seçilince şekil/renk/cinsiyet listeleri katalogdan dolar, seçilen balığın 3B önizlemesi görünür.
const $ = <T extends HTMLElement>(id: string) => document.getElementById(id) as T;
const tur = $<HTMLSelectElement>('tur'), form = $<HTMLSelectElement>('form'), variant = $<HTMLSelectElement>('variant'), sex = $<HTMLSelectElement>('sex');
const sekilKutu = $('sekil-kutu'), renkKutu = $('renk-kutu'), ozet = $('onizleme-ozet'), stage = $('sahne');
const mount = mountViewer(stage);

function onSpecies(first: boolean) {
  const sp = CATALOG.find((s) => s.id === tur.value);
  if (!first || !form.value) {
    if (sp) { fillSelect(form, sp.forms); fillSelect(variant, sp.variants); }
    else { form.replaceChildren(new Option('Önce tür seçin', '')); variant.replaceChildren(new Option('Önce tür seçin', '')); }
  }
  if (sp && (!first || !sex.value)) fillSelect(sex, sp.sexes, sex.value);
  if (!sp) sex.replaceChildren(new Option('Önce tür seçin', ''));
  sekilKutu.hidden = !!sp && sp.forms.length === 0; renkKutu.hidden = !!sp && sp.variants.length === 0;
  form.disabled = !sp || sp.forms.length === 0; variant.disabled = !sp || sp.variants.length === 0;
  preview();
}

function preview() {
  const sp = CATALOG.find((s) => s.id === tur.value);
  if (!sp) {
    mount.dispose();
    const st = stage.querySelector<HTMLElement>('[role=status]')!;
    st.hidden = false; st.textContent = 'Tür seçtiğinizde 3B önizleme burada görünür.';
    ozet.textContent = '';
    return;
  }
  const f = sp.forms.find((x) => x.id === form.value), v = sp.variants.find((x) => x.id === variant.value), sx = sp.sexes.find((s) => s.id === sex.value) ?? sp.sexes[0];
  ozet.textContent = `Önizleme: ${[sp.ad, f?.ad, v?.ad, sx.ad].filter(Boolean).join(' · ')}`;
  void mount.update({ species: sp.id, sex: sx.id, form: form.value, variant: variant.value });
}

tur.addEventListener('change', () => onSpecies(false));
for (const el of [form, variant, sex]) el.addEventListener('change', preview);
onSpecies(true);
// Gönderim: boş seçimle istek atılmasın (sunucu yine doğrular)
$<HTMLFormElement>('balik-formu').addEventListener('submit', (ev) => {
  const f = ev.currentTarget as HTMLFormElement;
  if (!tur.value || !sex.value || (!form.disabled && !form.value) || (!variant.disabled && !variant.value)) { ev.preventDefault(); f.reportValidity(); if (!tur.value) tur.focus(); }
});
