import './styles.css';

// Onay isteyen formlar (CSP satır içi olay işleyicilerine izin vermez): <form data-confirm="...">
document.addEventListener('submit', (ev) => {
  const msg = (ev.target as HTMLElement | null)?.getAttribute?.('data-confirm');
  if (msg && !window.confirm(msg)) ev.preventDefault();
});
