// Kullanım: node demo/build.mjs [çıktı.html]   (ilan-sitesi/ içinde; vite ve three kurulu olmalı)
import { build } from 'vite';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const here = path.dirname(fileURLToPath(import.meta.url));
const outFile = path.resolve(process.argv[2] ?? path.join(here, '.out/su-pazari-demo.html'));
const cfg = (await import('./vite.demo.config.mjs')).default;
await build(cfg);
const js = fs.readFileSync(path.join(here, '.out/demo.js'), 'utf8').replace(/<\/script/gi, '<\\/script').replace(/<!--/g, '<\\!--');
const html = `<!doctype html>
<html lang="tr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="color-scheme" content="light dark">
<title>Su Pazarı Demo</title>
</head>
<body>
<p style="font-family:system-ui;padding:1rem">Su Pazarı demosu yükleniyor…</p>
<script>
${js}
</script>
</body>
</html>
`;
fs.mkdirSync(path.dirname(outFile), { recursive: true });
fs.writeFileSync(outFile, html);
console.log(outFile, (html.length / 1048576).toFixed(2) + ' MB');
