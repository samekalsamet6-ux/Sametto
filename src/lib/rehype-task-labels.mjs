// GFM görev listesi onay kutularına (disabled checkbox) erişilebilir ad ekler.
function textOf(n) {
  if (n.type === 'text') return n.value;
  if (['ul', 'ol'].includes(n.tagName) || n.tagName === 'input') return '';
  return (n.children ?? []).map(textOf).join('');
}
function findInput(n) {
  if (n.tagName === 'input' && n.properties?.type === 'checkbox') return n;
  for (const c of n.children ?? []) {
    if (['ul', 'ol'].includes(c.tagName)) continue;
    const r = findInput(c);
    if (r) return r;
  }
  return null;
}
function walk(n) {
  if (n.tagName === 'li') {
    const input = findInput(n);
    if (input) input.properties.ariaLabel = textOf(n).trim().replace(/\s+/g, ' ') || 'Kontrol listesi maddesi';
  }
  (n.children ?? []).forEach(walk);
}
export default function rehypeTaskLabels() {
  return (tree) => walk(tree);
}
