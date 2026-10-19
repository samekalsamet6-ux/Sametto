import './site.ts';
import { CATALOG, OTHER_ID, UNKNOWN_SEX, sexOptions, modelSex, itemLabel } from '../shared/catalog.ts';
import { mountViewer } from './viewer3d.ts';
import { fillSelect } from './catalog-select.ts';

const $ = <T extends HTMLElement>(id: string) => document.getElementById(id) as T;
const tur = $<HTMLSelectElement>('tur'), form = $<HTMLSelectElement>('form'), variant = $<HTMLSelectElement>('variant'), sex = $<HTMLSelectElement>('sex');
const digerKutu = $('diger-kutu'), sekilKutu = $('sekil-kutu'), renkKutu = $('renk-kutu'), ozet = $('onizleme-ozet');
const stage = $('sahne');
const mount = mountViewer(stage);

const fill = fillSelect;

function onSpecies(first: boolean) {
  const sp = CATALOG.find((s) => s.id === tur.value);
  digerKutu.hidden = tur.value !== OTHER_ID;
  if (!first || !form.value) {
    if (sp) { fill(form, sp.forms); fill(variant, sp.variants); }
    else { form.replaceChildren(new Option(tur.value ? 'Bu tür için şekil seçeneği yok' : 'Önce tür seçin', '')); variant.replaceChildren(new Option(tur.value ? 'Bu tür için renk seçeneği yok' : 'Önce tür seçin', '')); }
  }
  sekilKutu.hidden = !!sp && sp.forms.length === 0; renkKutu.hidden = !!sp && sp.variants.length === 0;
  form.disabled = !sp || sp.forms.length === 0; variant.disabled = !sp || sp.variants.length === 0;
  const keep = sex.value;
  sex.replaceChildren(...sexOptions(tur.value || OTHER_ID).map((o) => new Option(o.ad, o.id)));
  sex.value = [...sex.options].some((o) => o.value === keep) ? keep : UNKNOWN_SEX;
  const ozelL = document.getElementById('ozel-l'), ozelG = document.getElementById('ozel-grade');
  if (ozelL) ozelL.hidden = tur.value !== 'pleco';
  if (ozelG) ozelG.hidden = tur.value !== 'karides';
  preview();
}

function preview() {
  const sp = CATALOG.find((s) => s.id === tur.value);
  if (!sp) {
    mount.dispose();
    const st = stage.querySelector<HTMLElement>('[role=status]')!;
    st.hidden = false; st.textContent = tur.value === OTHER_ID ? 'Bu tür için 3B model yok; ilanda yalnızca fotoğraflarınız görünür.' : 'Tür seçtiğinizde 3B önizleme burada görünür.';
    ozet.textContent = '';
    return;
  }
  const f = sp.forms.find((x) => x.id === form.value), v = sp.variants.find((x) => x.id === variant.value);
  const sx = modelSex(sp.id, sex.value);
  ozet.textContent = `Önizleme: ${[sp.ad, f && itemLabel(f), v && itemLabel(v), sex.value === UNKNOWN_SEX ? undefined : sp.sexes.find((s) => s.id === sx)?.ad].filter(Boolean).join(' · ')}`;
  void mount.update({ species: sp.id, sex: sx, form: form.value, variant: variant.value });
}

tur.addEventListener('change', () => onSpecies(false));
for (const el of [form, variant, sex]) el.addEventListener('change', preview);
onSpecies(true);

// Fotoğraf seçimi: istemci tarafı ön kontrol (asıl doğrulama sunucudadır)
const foto = $<HTMLInputElement>('foto'), list = $('onizleme');
const urls: string[] = [];
foto.addEventListener('change', () => {
  urls.splice(0).forEach((u) => URL.revokeObjectURL(u));
  list.replaceChildren();
  const files = [...(foto.files ?? [])];
  const problems: string[] = [];
  if (files.length > 5) problems.push('En fazla 5 fotoğraf seçebilirsiniz.');
  for (const f of files) {
    if (!/^image\/(jpeg|png|webp)$/.test(f.type)) problems.push(`${f.name}: yalnızca JPEG, PNG ya da WebP.`);
    else if (f.size > 5 * 1024 * 1024) problems.push(`${f.name}: 5 MB'tan büyük.`);
  }
  foto.setCustomValidity(problems.join(' '));
  if (problems.length) { const li = document.createElement('li'); li.className = 'field-err'; li.textContent = problems.join(' '); list.append(li); return; }
  files.forEach((f, i) => {
    const u = URL.createObjectURL(f); urls.push(u);
    const li = document.createElement('li'); const img = document.createElement('img');
    img.src = u; img.alt = `Seçilen fotoğraf ${i + 1}: ${f.name}`; img.width = 96; img.height = 72;
    li.append(img); list.append(li);
  });
});
foto.closest('form')!.addEventListener('submit', (ev) => {
  const f = ev.currentTarget as HTMLFormElement;
  if (!f.checkValidity()) { ev.preventDefault(); f.reportValidity(); }
});
