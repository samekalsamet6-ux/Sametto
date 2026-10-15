// needs_verification: true olan sayfaları docs/OPEN_QUESTIONS.md içine listeler.
import { readdirSync, readFileSync, writeFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const root = 'src/content';
const files = [];
(function walk(d) {
  for (const f of readdirSync(d)) {
    const p = join(d, f);
    statSync(p).isDirectory() ? walk(p) : /\.mdx?$/.test(p) && files.push(p);
  }
})(root);

const rows = [];
let total = 0;
for (const f of files.sort()) {
  total++;
  const m = /^---\n([\s\S]*?)\n---/.exec(readFileSync(f, 'utf8'));
  if (!m) throw new Error(`${f}: frontmatter yok`);
  const fm = m[1];
  if (!/^needs_verification:\s*true\s*$/m.test(fm)) continue;
  const title = /^title:\s*"?(.*?)"?\s*$/m.exec(fm)?.[1] ?? f;
  const conf = /^confidence:\s*(\S+)/m.exec(fm)?.[1] ?? '-';
  rows.push({ f: relative(root, f), title, conf });
}

const out = `# Doğrulama bekleyen içerik

Bu dosya \`npm run open-questions\` ile otomatik üretilir; elle düzenlemeyin.
Bir sayfayı doğruladıktan sonra frontmatter'da \`needs_verification: false\` yapın ve komutu yeniden çalıştırın.

**${rows.length} / ${total}** sayfa doğrulama bekliyor.

| Sayfa | Başlık | Güven |
|---|---|---|
${rows.map((r) => `| \`${r.f}\` | ${r.title} | ${r.conf} |`).join('\n')}
`;
writeFileSync('docs/OPEN_QUESTIONS.md', out);
console.log(`${rows.length}/${total} sayfa doğrulama bekliyor.`);
