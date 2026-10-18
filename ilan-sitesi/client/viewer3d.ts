// Tür modüllerini (../../src/lib/<tür>/index.ts; salt okunur) tembel yükler ve bir canvas'a bağlar.
import type { SpeciesModule, SpeciesViewer, SexId } from '../../src/lib/akvaryum/types';

const LOADERS: Record<string, () => Promise<{ species: SpeciesModule }>> = {
  lepistes: () => import('../../src/lib/guppy/index.ts'),
  molly: () => import('../../src/lib/molly/index.ts'),
  platy: () => import('../../src/lib/platy/index.ts'),
  kilickuyruk: () => import('../../src/lib/kilickuyruk/index.ts'),
  betta: () => import('../../src/lib/betta/index.ts'),
  vatoz: () => import('../../src/lib/vatoz/index.ts'),
  karides: () => import('../../src/lib/karides/index.ts'),
  melek: () => import('../../src/lib/melek/index.ts'),
  diskus: () => import('../../src/lib/diskus/index.ts'),
  pleco: () => import('../../src/lib/pleco/index.ts'),
  neon: () => import('../../src/lib/neon/index.ts'),
  corydoras: () => import('../../src/lib/corydoras/index.ts'),
  japon: () => import('../../src/lib/japon/index.ts'),
};

/** Tür modülünü tembel yükler (aynı modül tekrar istenirse tarayıcı önbelleği kullanılır); 3B modeli olmayan tür için undefined. */
export async function loadSpecies(id: string): Promise<SpeciesModule | undefined> {
  const l = LOADERS[id];
  return l ? (await l()).species : undefined;
}

export interface Selection { species: string; sex: string; form: string; variant: string }
export interface Mount { update(sel: Selection): Promise<void>; viewer(): SpeciesViewer | null; dispose(): void }

export function webglAvailable(): boolean {
  try { const c = document.createElement('canvas'); return !!(c.getContext('webgl2') || c.getContext('webgl')); } catch { return false; }
}

/** `stage` içindeki canvas'ı yönetir. Tür değişince canvas yenilenir (bir canvas bağlamı yeniden kullanılamaz). */
export function mountViewer(stage: HTMLElement, hooks: { onState?: (s: 'loading' | 'ready' | 'nowebgl' | 'error') => void } = {}): Mount {
  const status = stage.querySelector<HTMLElement>('[role=status]');
  const fallback = stage.querySelector<HTMLElement>('.stage-fallback');
  let canvas = stage.querySelector<HTMLCanvasElement>('canvas')!;
  const overlay = stage.querySelector<HTMLElement>('.hot')!;
  let viewer: SpeciesViewer | null = null, current = '', token = 0, curSpecies = '';
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const setStatus = (t: string) => { if (status) { status.textContent = t; status.hidden = !t; } };
  const mod: Record<string, SpeciesModule> = {};

  async function update(sel: Selection): Promise<void> {
    const my = ++token;
    if (!LOADERS[sel.species]) { clear(); setStatus('Bu tür için 3B model yok.'); return; }
    if (!webglAvailable()) { clear(); setStatus(''); if (fallback) fallback.hidden = false; stage.dataset.state = 'nowebgl'; hooks.onState?.('nowebgl'); return; }
    if (fallback) fallback.hidden = true;
    try {
      if (!mod[sel.species]) { setStatus('3B model yükleniyor…'); stage.dataset.state = 'loading'; hooks.onState?.('loading'); mod[sel.species] = (await LOADERS[sel.species]()).species; }
      if (my !== token) return;
      const sp = mod[sel.species];
      const sex = (sp.sexes.some((s) => s.id === sel.sex) ? sel.sex : sp.sexes[0].id) as SexId;
      const form = sp.forms?.some((f) => f.id === sel.form) ? sel.form : sp.forms?.[0]?.id;
      const variant = sp.variants.some((v) => v.id === sel.variant) ? sel.variant : sp.variants[0].id;
      if (viewer && curSpecies === sel.species) {
        viewer.setSex(sex); if (form) viewer.setForm?.(form); viewer.setVariant(variant);
      } else {
        clear();
        const fresh = document.createElement('canvas');
        for (const a of ['id', 'tabindex', 'role', 'aria-label', 'aria-describedby', 'aria-keyshortcuts']) { const v = canvas.getAttribute(a); if (v !== null) fresh.setAttribute(a, v); }
        canvas.replaceWith(fresh); canvas = fresh;
        viewer = sp.createViewer({ canvas, overlay, sex, form, variant, reducedMotion: reduced, onSelect: () => {} });
        viewer.setHotspots(false); viewer.setSwim(!reduced);
        curSpecies = sel.species;
      }
      current = `${sel.species}|${sex}|${form}|${variant}`;
      stage.dataset.state = 'ready'; stage.dataset.model = current;
      setStatus(''); hooks.onState?.('ready');
    } catch (e) {
      console.error('3B yüklenemedi', e);
      if (my !== token) return;
      clear(); setStatus(''); if (fallback) fallback.hidden = false; stage.dataset.state = 'error'; hooks.onState?.('error');
    }
  }
  function clear() { try { viewer?.dispose(); } catch { /* yoksay */ } viewer = null; curSpecies = ''; delete stage.dataset.model; }
  return { update, viewer: () => viewer, dispose: () => { token++; clear(); } };
}
