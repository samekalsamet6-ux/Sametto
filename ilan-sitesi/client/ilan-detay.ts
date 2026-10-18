import './site.ts';
import { mountViewer } from './viewer3d.ts';

// Fotoğraf galerisi
const main = document.querySelector<HTMLImageElement>('#foto-ana');
document.querySelectorAll<HTMLButtonElement>('.thumb').forEach((b) => b.addEventListener('click', () => {
  if (main) { main.src = b.dataset.src!; main.alt = b.dataset.alt!; }
  document.querySelectorAll('.thumb').forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
}));

// 3B: sahne görünür olunca yüklenir
const stage = document.querySelector<HTMLElement>('#sahne');
if (stage) {
  const bar = document.querySelector<HTMLElement>('#gorunum');
  const mount = mountViewer(stage, { onState: (s) => { if (bar) bar.hidden = s !== 'ready'; } });
  const sel = { species: stage.dataset.species!, sex: stage.dataset.sex!, form: stage.dataset.form!, variant: stage.dataset.variant! };
  let started = false;
  const start = () => { if (!started) { started = true; void mount.update(sel); } };
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver((e) => { if (e.some((x) => x.isIntersecting)) { io.disconnect(); start(); } }, { rootMargin: '200px' });
    io.observe(stage);
  } else start();

  bar?.querySelectorAll<HTMLButtonElement>('[data-view]').forEach((b) => b.addEventListener('click', () => mount.viewer()?.setView(b.dataset.view!)));
  const spin = bar?.querySelector<HTMLButtonElement>('#don');
  spin?.addEventListener('click', () => { const on = spin.getAttribute('aria-pressed') !== 'true'; spin.setAttribute('aria-pressed', String(on)); mount.viewer()?.setAutoRotate(on); });
  // Klavye: canvas odaktayken oklar döndürür, +/- yakınlaştırır (canvas dışı kullanım için de düğmeler yukarıda)
  const cv = () => document.querySelector<HTMLCanvasElement>('#cv')!;
  stage.addEventListener('keydown', (ev) => {
    const v = mount.viewer(); if (!v || ev.target !== cv()) return;
    const k = ev.key;
    if (k === 'ArrowLeft') v.rotate(-0.25, 0); else if (k === 'ArrowRight') v.rotate(0.25, 0);
    else if (k === 'ArrowUp') v.rotate(0, -0.2); else if (k === 'ArrowDown') v.rotate(0, 0.2);
    else if (k === '+' || k === '=') v.zoom(0.85); else if (k === '-') v.zoom(1.15);
    else return;
    ev.preventDefault();
  });
}
