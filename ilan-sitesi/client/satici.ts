import './site.ts';
import type { TankHandle, TankFish } from './akvaryum-sahne.ts';

// Satıcı profili: 3B akvaryum görününce yüklenir; ekran dışındayken ya da sekme gizliyken durur; sayfadan çıkınca her şey serbest bırakılır.
const stage = document.getElementById('tank');
const canvas = document.getElementById('tank-cv') as HTMLCanvasElement | null;
const list = document.getElementById('akv-liste');
if (stage && canvas && list) {
  const status = document.getElementById('tank-durum')!, fallback = document.getElementById('tank-yedek')!;
  const bar = document.getElementById('tank-bar')!, hint = document.getElementById('tank-ipucu')!;
  const fish: TankFish[] = [...list.querySelectorAll<HTMLElement>('li')].map((li) => ({ species: li.dataset.species!, form: li.dataset.form ?? '', variant: li.dataset.variant ?? '', sex: li.dataset.sex! }));
  const params = new URLSearchParams(location.search);
  const forced = params.get('lod');
  const lod = forced === 'low' || forced === 'normal' ? forced : fish.length > 6 || Math.min(innerWidth, screen.width || innerWidth) < 700 ? 'low' : 'normal';
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  stage.dataset.lod = lod; stage.dataset.reduced = String(reduced);

  const webgl = (() => { try { const c = document.createElement('canvas'); return !!(c.getContext('webgl2') || c.getContext('webgl')); } catch { return false; } })();
  const giveUp = (state: 'nowebgl' | 'error') => { stage.dataset.state = state; status.hidden = true; fallback.hidden = false; bar.hidden = true; hint.hidden = true; };

  if (!webgl) giveUp('nowebgl');
  else {
    let handle: TankHandle | null = null, started = false, visible = false;
    const sync = () => handle?.setActive(visible && !document.hidden);
    const start = async () => {
      if (started) return; started = true;
      stage.dataset.state = 'loading'; status.hidden = false; status.textContent = '3B akvaryum yükleniyor…';
      try {
        const { createTank } = await import('./akvaryum-sahne.ts');
        handle = await createTank({ canvas, fish, lod, reducedMotion: reduced, onFatal: () => { handle?.dispose(); handle = null; giveUp('error'); } });
        (window as unknown as { __akvaryum?: TankHandle }).__akvaryum = handle;
        status.hidden = true; bar.hidden = false; hint.hidden = false;
        stage.dataset.state = 'ready'; stage.dataset.count = String(fish.length);
        sync();
      } catch (e) { console.error('Akvaryum açılamadı', e); giveUp('error'); }
    };
    if ('IntersectionObserver' in window) {
      new IntersectionObserver((es) => { visible = es[es.length - 1].isIntersecting; if (visible) void start(); sync(); }, { rootMargin: '150px' }).observe(stage);
    } else { visible = true; void start(); }
    document.addEventListener('visibilitychange', sync);
    // bfcache'e giriyorsa (persisted) dondurulur; gerçekten ayrılırken GPU kaynakları bırakılır
    addEventListener('pagehide', (e) => { if (!e.persisted) { handle?.dispose(); } });
    bar.addEventListener('click', (e) => {
      const b = (e.target as HTMLElement).closest<HTMLElement>('[data-act]'); if (!b || !handle) return;
      switch (b.dataset.act) { case 'left': handle.rotate(-0.3); break; case 'right': handle.rotate(0.3); break; case 'in': handle.zoom(0.8); break; case 'out': handle.zoom(1.25); break; case 'reset': handle.reset(); break; }
    });
  }
}
