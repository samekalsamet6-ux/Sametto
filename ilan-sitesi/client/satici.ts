import './site.ts';
import type { TankHandle, TankFish } from './akvaryum-sahne.ts';
import { decide3d, readEnv3d, remember3d } from '../shared/lazy3d.ts';
import { parseStock, summarizeStock, formatKurus, priceText } from '../shared/stock.ts';

// Satıcı profili: 3B akvaryum görününce yüklenir; ekran dışındayken ya da sekme gizliyken durur; sayfadan çıkınca her şey serbest bırakılır.
const stage = document.getElementById('tank');
const canvas = document.getElementById('tank-cv') as HTMLCanvasElement | null;
const list = document.getElementById('akv-liste');
if (stage && canvas && list) {
  const status = document.getElementById('tank-durum')!, fallback = document.getElementById('tank-yedek')!;
  const bar = document.getElementById('tank-bar')!, hint = document.getElementById('tank-ipucu')!;
  const fish: TankFish[] = [...list.querySelectorAll<HTMLElement>('li')].map((li) => ({ species: li.dataset.species!, form: li.dataset.form ?? '', variant: li.dataset.variant ?? '', sex: li.dataset.sex! }));
  // ---- balık kartı: stok ve fiyat, satıcının aktif ilanlarından (sayfaya gömülü kısa kayıt) ----
  const stock = parseStock(stage.dataset.stock);
  const card = document.getElementById('balik-karti')!, cardTitle = document.getElementById('balik-karti-b')!;
  const cardFacts = document.getElementById('balik-karti-bilgi')!, cardStock = document.getElementById('balik-karti-stok')!;
  const lis = [...list.querySelectorAll<HTMLElement>('li')];
  let handle: TankHandle | null = null, openIdx = -1, opener: HTMLElement | null = null;
  const el = <K extends keyof HTMLElementTagNameMap>(tag: K, text?: string, cls?: string) => { const n = document.createElement(tag); if (text !== undefined) n.textContent = text; if (cls) n.className = cls; return n; };
  const showCard = (i: number, from: HTMLElement | null, focus: boolean) => {
    const li = lis[i]; if (!li) return;
    openIdx = i; opener = from;
    lis.forEach((x, k) => x.classList.toggle('is-selected', k === i));
    cardTitle.textContent = li.dataset.ad ?? '';
    cardFacts.replaceChildren();
    for (const [k, v] of [['Tür', li.dataset.ad], ['Şekil', li.dataset.formAd], ['Renk', li.dataset.variantAd], ['Cinsiyet', li.dataset.sexAd]]) if (v) { cardFacts.append(el('dt', k), el('dd', v)); }
    cardStock.replaceChildren();
    const sum = summarizeStock(stock, fish[i]);
    if (!sum) cardStock.append(el('p', 'Şu an bu balık için ilan yok', 'fish-card-none'));
    else {
      cardStock.append(el('p', `Satıcının aktif ilanlarında toplam ${sum.quantity} adet (${sum.count} ilan)`, 'fish-card-none'));
      if (sum.minPrice !== sum.maxPrice) cardStock.append(el('p', `En düşük ilan fiyatı ${formatKurus(sum.minPrice)}, en yüksek ${formatKurus(sum.maxPrice)} (her fiyat ilanın kendi fiyatıdır)`));
      const ul = el('ul');
      for (const l of sum.shown) {
        const row = el('li'); row.append(el('span', `${l.q} adet · ${priceText(l)}`));
        const a = el('a', 'İlana git'); a.href = `/ilan/${l.id}`; a.setAttribute('aria-label', `İlana git: ${l.t}`); row.append(a); ul.append(row);
      }
      cardStock.append(ul);
      if (sum.more) cardStock.append(el('p', `ve ${sum.more} ilan daha: aşağıdaki ilanlara bakın`, 'muted small'));
    }
    card.hidden = false; handle?.select(i);
    if (focus) card.focus({ preventScroll: false });
  };
  const closeCard = () => {
    if (openIdx < 0) return;
    const back = opener; openIdx = -1; opener = null; card.hidden = true; lis.forEach((x) => x.classList.remove('is-selected')); handle?.select(null);
    if (back && document.contains(back)) back.focus();
  };
  document.getElementById('balik-karti-kapat')!.addEventListener('click', closeCard);
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && openIdx >= 0) { e.preventDefault(); closeCard(); } });
  lis.forEach((li, i) => li.querySelector<HTMLElement>('[data-pick]')?.addEventListener('click', (e) => showCard(i, e.currentTarget as HTMLElement, true)));

  const params = new URLSearchParams(location.search);
  const forced = params.get('lod');
  const lod = forced === 'low' || forced === 'normal' ? forced : fish.length > 6 || Math.min(innerWidth, screen.width || innerWidth) < 700 ? 'low' : 'normal';
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  stage.dataset.lod = lod; stage.dataset.reduced = String(reduced);

  const webgl = (() => { try { const c = document.createElement('canvas'); return !!(c.getContext('webgl2') || c.getContext('webgl')); } catch { return false; } })();
  const giveUp = (state: 'nowebgl' | 'error') => { stage.dataset.state = state; status.hidden = true; fallback.hidden = false; bar.hidden = true; hint.hidden = true; };

  if (!webgl) giveUp('nowebgl');
  else {
    let started = false, visible = false;
    const sync = () => handle?.setActive(visible && !document.hidden);
    const start = async () => {
      if (started) return; started = true;
      stage.dataset.state = 'loading'; status.hidden = false; status.textContent = '3B akvaryum yükleniyor…';
      try {
        const { createTank } = await import('./akvaryum-sahne.ts');
        handle = await createTank({ canvas, fish, lod, reducedMotion: reduced, onPick: (i) => { if (i !== null) showCard(i, null, false); }, onFatal: () => { handle?.dispose(); handle = null; giveUp('error'); } });
        (window as unknown as { __akvaryum?: TankHandle }).__akvaryum = handle;
        if (openIdx >= 0) handle.select(openIdx);
        status.hidden = true; bar.hidden = false; hint.hidden = false;
        stage.dataset.state = 'ready'; stage.dataset.count = String(fish.length);
        sync();
      } catch (e) { console.error('Akvaryum açılamadı', e); giveUp('error'); }
    };
    const arm = () => {
      if ('IntersectionObserver' in window) {
        new IntersectionObserver((es) => { visible = es[es.length - 1].isIntersecting; if (visible) void start(); sync(); }, { rootMargin: '150px' }).observe(stage);
      } else { visible = true; void start(); }
    };
    // Geniş ekranda sahne görününce yüklenir; dar ekranda/veri tasarrufunda yalnızca "Akvaryumu aç" dokunuşundan sonra (three.js ve tür kodu o ana kadar istenmez).
    const poster = document.getElementById('tank-poster'), openBtn = document.getElementById('tank-ac');
    if (decide3d(readEnv3d()) === 'auto' || !poster || !openBtn) arm();
    else {
      stage.dataset.state = 'poster'; poster.hidden = false; canvas.style.display = 'none'; bar.hidden = true; hint.hidden = true;
      openBtn.addEventListener('click', () => { remember3d(); poster.hidden = true; canvas.style.display = ''; arm(); });
    }
    document.addEventListener('visibilitychange', sync);
    // bfcache'e giriyorsa (persisted) dondurulur; gerçekten ayrılırken GPU kaynakları bırakılır
    addEventListener('pagehide', (e) => { if (!e.persisted) { handle?.dispose(); } });
    bar.addEventListener('click', (e) => {
      const b = (e.target as HTMLElement).closest<HTMLElement>('[data-act]'); if (!b || !handle) return;
      switch (b.dataset.act) { case 'left': handle.rotate(-0.3); break; case 'right': handle.rotate(0.3); break; case 'in': handle.zoom(0.8); break; case 'out': handle.zoom(1.25); break; case 'reset': handle.reset(); break; }
    });
  }
}
