import './styles.css';

// Onay isteyen formlar (CSP satır içi olay işleyicilerine izin vermez): <form data-confirm="...">
document.addEventListener('submit', (ev) => {
  const msg = (ev.target as HTMLElement | null)?.getAttribute?.('data-confirm');
  if (msg && !window.confirm(msg)) ev.preventDefault();
});

// "Parolayı göster": betik varsa görünür olur; formdaki [data-pw] alanlarının türünü değiştirir.
document.querySelectorAll<HTMLElement>('[data-show-pw]').forEach((box) => {
  const cb = box.querySelector<HTMLInputElement>('input[type=checkbox]');
  const form = box.closest('form');
  if (!cb || !form) return;
  box.hidden = false;
  cb.addEventListener('change', () => form.querySelectorAll<HTMLInputElement>('input[data-pw]').forEach((i) => { i.type = cb.checked ? 'text' : 'password'; }));
});

// Yüklenemeyen ilan fotoğrafı yerine "Fotoğraf yok" kutusu (boş/kırık alan kalmasın).
const noPhoto = (img: HTMLImageElement) => {
  const tile = document.createElement('span');
  tile.className = 'photo-none'; tile.textContent = 'Fotoğraf yok';
  img.replaceWith(tile);
};
document.querySelectorAll<HTMLImageElement>('.card-photo img').forEach((img) => {
  if (img.complete && img.naturalWidth === 0 && img.currentSrc) noPhoto(img);
  else img.addEventListener('error', () => noPhoto(img), { once: true });
});
