#!/usr/bin/env python3
"""src/ altındaki modülleri tek dosyalı index.html'e birleştirir.
Kullanım:  python3 build.py
"""
import glob, os

root = os.path.dirname(os.path.abspath(__file__))
rd = lambda p: open(os.path.join(root, p), encoding='utf-8').read()

css = rd('src/style.css')
body = rd('src/body.html')
js = '\n'.join(
    f'/* ───── {os.path.basename(p)} ───── */\n' + open(p, encoding='utf-8').read()
    for p in sorted(glob.glob(os.path.join(root, 'src/js/*.js')))
)

html = f"""<!doctype html>
<html lang="tr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover,user-scalable=no">
<meta name="theme-color" content="#04161f">
<title>Akvaryum Üreticisi</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Baloo+2:wght@500;700&family=Nunito:wght@400;700;800&display=swap" rel="stylesheet">
<style>
{css}
</style>
</head>
<body>
{body}
<script>
{js}
</script>
</body>
</html>
"""
open(os.path.join(root, 'index.html'), 'w', encoding='utf-8').write(html)
print('index.html yazıldı:', len(html) // 1024, 'KB')
