// Balık 3B araç sayfalarının ortak istemci mantığı (SpeciesPage.astro ile birlikte çalışır).
import type { SexId, SpeciesForm, SpeciesModule, SpeciesPart, SpeciesVariant, SpeciesViewer } from './types';

export interface FishPart extends SpeciesPart {
  /** Parçayı en iyi gösteren kamera görünümü */
  view: string;
}

export interface PageConfig {
  partsFor(sex: SexId, form?: string): FishPart[];
  parts: FishPart[];
  variants: SpeciesVariant[];
  /** Form (şekil) varyeteleri; verilirse sayfada #form seçicisi beklenir */
  forms?: SpeciesForm[];
  sexNotes: Record<SexId, string>;
  defaultSex: SexId;
  defaultView: string;
  /** Tür modülünü tembel yükler (three.js paketi burada ayrılır) */
  load(): Promise<{ species: SpeciesModule }>;
}

export function initSpeciesPage(cfg: PageConfig) {
  const $ = <T extends HTMLElement>(id: string) => document.getElementById(id) as T;
  const stage = $('stage'), cv = $<HTMLCanvasElement>('cv'), hot = $('hot'), status = $('status'), fallback = $('fallback');
  const detail = $('detail'), sexnote = $('sexnote');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

  let sex: SexId = cfg.defaultSex;
  let selected: string | null = null;
  let viewer: SpeciesViewer | null = null;
  const variantSel = $<HTMLSelectElement>('variant');
  const formSel = document.getElementById('form') as HTMLSelectElement | null;
  const formNote = document.getElementById('formnote');
  let form: string | undefined = cfg.forms?.[0]?.id;
  const hotChk = $<HTMLInputElement>('hotspots');

  function renderList() {
    const vis = cfg.partsFor(sex, form).map((p) => p.id);
    document.querySelectorAll<HTMLLIElement>('#parts li').forEach((li) => {
      const i = vis.indexOf(li.dataset.part!);
      li.hidden = i < 0;
      const n = li.querySelector('.v3-n');
      if (n && i >= 0) n.textContent = String(i + 1);
    });
  }

  function renderDetail() {
    detail.textContent = '';
    const p = cfg.partsFor(sex, form).find((x) => x.id === selected) ?? cfg.parts.find((x) => x.id === selected);
    if (!p) {
      const m = document.createElement('p');
      m.className = 'muted';
      m.textContent = 'Bir parça seçin: modelde numaralı noktaya ya da listeden bir öğeye tıklayın.';
      detail.appendChild(m);
      return;
    }
    const h = document.createElement('h3');
    h.textContent = p.ad;
    const t = document.createElement('p');
    t.textContent = p.aciklama;
    if (p.uyari) t.className = 'warn';
    detail.append(h, t);
    if (p.dogrulanmali) {
      const b = document.createElement('p');
      b.innerHTML = '<span class="badge">Kaynakla doğrulanmalı</span>';
      detail.appendChild(b);
    }
  }

  function select(id: string | null, fromList = false) {
    selected = id;
    stage.dataset.selected = id ?? '';
    document.querySelectorAll<HTMLButtonElement>('.v3-part').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.part === id)));
    renderDetail();
    viewer?.select(id);
    if (id && fromList && viewer && (!hotChk.checked || !viewer.isPartVisible(id))) {
      const v = cfg.parts.find((x) => x.id === id)!.view;
      stage.dataset.view = v;
      viewer.setView(v);
    }
  }

  document.querySelectorAll<HTMLButtonElement>('.v3-part').forEach((b) => b.addEventListener('click', () => {
    const id = b.dataset.part!;
    select(selected === id ? null : id, true);
  }));

  function describeVariant() {
    const v = cfg.variants.find((x) => x.id === variantSel.value);
    return v ? ` Renk — ${v.ad}: ${v.aciklama}${v.dogrulanmali ? ' (Kaynakla doğrulanmalı.)' : ''}` : '';
  }

  function setSex(s: SexId, announce = true) {
    sex = s;
    stage.dataset.sex = s;
    sexnote.textContent = cfg.sexNotes[s] + (announce && stage.dataset.variantTouched ? describeVariant() : '');
    if (selected && !cfg.partsFor(s, form).some((p) => p.id === selected)) select(null);
    renderList();
    viewer?.setSex(s);
  }
  document.querySelectorAll<HTMLInputElement>('input[name=sex]').forEach((r) => r.addEventListener('change', () => { if (r.checked) setSex(r.value as SexId); }));

  variantSel.addEventListener('change', () => {
    stage.dataset.variant = variantSel.value;
    stage.dataset.variantTouched = '1';
    viewer?.setVariant(variantSel.value);
    status.textContent = '';
    sexnote.textContent = cfg.sexNotes[sex] + describeVariant();
  });

  function describeForm() {
    const f = cfg.forms?.find((x) => x.id === form);
    return f ? `Form — ${f.ad}: ${f.aciklama}${f.dogrulanmali ? ' (Kaynakla doğrulanmalı.)' : ''}` : '';
  }
  if (formSel && cfg.forms) {
    if (formNote) formNote.textContent = describeForm();
    formSel.addEventListener('change', () => {
      form = formSel.value;
      stage.dataset.form = form;
      if (selected && !cfg.partsFor(sex, form).some((p) => p.id === selected)) select(null);
      renderList();
      renderDetail();
      viewer?.setForm?.(form);
      if (formNote) formNote.textContent = describeForm();
    });
  }

  const swim = $<HTMLInputElement>('swim'), rot = $<HTMLInputElement>('rot');
  swim.checked = !reduced;
  swim.addEventListener('change', () => { stage.dataset.swim = swim.checked ? 'on' : 'off'; viewer?.setSwim(swim.checked); });
  rot.addEventListener('change', () => { stage.dataset.rotate = rot.checked ? 'on' : 'off'; viewer?.setAutoRotate(rot.checked); });
  stage.dataset.swim = swim.checked ? 'on' : 'off';
  hotChk.addEventListener('change', () => { stage.dataset.hotspots = hotChk.checked ? 'on' : 'off'; viewer?.setHotspots(hotChk.checked); });
  stage.dataset.hotspots = hotChk.checked ? 'on' : 'off';

  document.querySelectorAll<HTMLButtonElement>('.v3-btn[data-view]').forEach((b) => b.addEventListener('click', () => {
    stage.dataset.view = b.dataset.view!;
    viewer?.setView(b.dataset.view!);
  }));
  $('zin').addEventListener('click', () => viewer?.zoom(0.8));
  $('zout').addEventListener('click', () => viewer?.zoom(1.25));
  $('zreset').addEventListener('click', () => { stage.dataset.view = cfg.defaultView; viewer?.reset(); });

  cv.addEventListener('keydown', (e) => {
    if (!viewer) return;
    const step = 0.16, k = e.key;
    if (k === 'ArrowLeft') viewer.rotate(-step, 0);
    else if (k === 'ArrowRight') viewer.rotate(step, 0);
    else if (k === 'ArrowUp') viewer.rotate(0, -step);
    else if (k === 'ArrowDown') viewer.rotate(0, step);
    else if (k === '+' || k === '=') viewer.zoom(0.85);
    else if (k === '-' || k === '_') viewer.zoom(1.18);
    else if (k === '0' || k === 'Home') viewer.reset();
    else return;
    e.preventDefault();
  });

  function showFallback(msg?: string) {
    stage.setAttribute('data-fallback', '');
    fallback.hidden = false;
    status.textContent = msg ?? '';
  }
  function hasWebGL(): boolean {
    try {
      const c = document.createElement('canvas');
      return !!(c.getContext('webgl2') || c.getContext('webgl'));
    } catch { return false; }
  }

  let started = false;
  async function start() {
    if (started) return;
    started = true;
    if (!hasWebGL()) { showFallback(); return; }
    status.textContent = '3B model yükleniyor…';
    try {
      const { species } = await cfg.load();
      viewer = species.createViewer({
        canvas: cv, overlay: hot, sex, form, variant: variantSel.value, reducedMotion: reduced,
        onSelect: (id) => select(id),
      });
      viewer.setSwim(swim.checked);
      viewer.setAutoRotate(rot.checked);
      viewer.setHotspots(hotChk.checked);
      if (selected) viewer.select(selected);
    } catch (err) {
      console.error(err);
      showFallback();
    }
  }

  setSex(cfg.defaultSex, false);
  renderDetail();
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver((e) => { if (e.some((x) => x.isIntersecting)) { io.disconnect(); start(); } }, { rootMargin: '1400px' });
    io.observe(stage);
  } else start();
}
