#!/usr/bin/env python3
"""src/ altındaki modülleri tek dosyalı index.html'e birleştirir.
Kullanım:  python3 build.py
"""
import glob, os, sys, base64

root = os.path.dirname(os.path.abspath(__file__))
rd = lambda p: open(os.path.join(root, p), encoding='utf-8').read()

css = rd('src/style.css')
body = rd('src/body.html')
js = '\n'.join(
    f'/* ───── {os.path.basename(p)} ───── */\n' + open(p, encoding='utf-8').read()
    for p in sorted(glob.glob(os.path.join(root, 'src/js/*.js')))
)

native = '--native' in sys.argv
WEB_FONTS = '<link rel="preconnect" href="https://fonts.googleapis.com">\n<link href="https://fonts.googleapis.com/css2?family=Baloo+2:wght@500;700&family=Nunito:wght@400;700;800&display=swap" rel="stylesheet">\n'
RANGES = {'latin': 'U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+2000-206F,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD',
          'latin-ext': 'U+0100-02AF,U+0304,U+0308,U+0329,U+1E00-1E9F,U+1EF2-1EFF,U+2020,U+20A0-20AB,U+20AD-20CF,U+2113,U+2C60-2C7F,U+A720-A7FF'}

def embedded_fonts():
    """npm i @fontsource/baloo-2 @fontsource/nunito sonrası: woff2 dosyalarını base64 gömer (APK çevrimdışı çalışır)."""
    out, found = [], 0
    for pkg, fam, ws in (('baloo-2', 'Baloo 2', (500, 700)), ('nunito', 'Nunito', (400, 700, 800))):
        for w in ws:
            for sub in ('latin-ext', 'latin'):
                f = os.path.join(root, 'node_modules/@fontsource', pkg, 'files', f'{pkg}-{sub}-{w}-normal.woff2')
                if os.path.exists(f):
                    found += 1
                    b = base64.b64encode(open(f, 'rb').read()).decode()
                    out.append(f"@font-face{{font-family:'{fam}';font-weight:{w};font-display:swap;src:url(data:font/woff2;base64,{b}) format('woff2');unicode-range:{RANGES[sub]}}}")
    if not found:
        print('UYARI: @fontsource paketleri yok; sistem yazı tipleri kullanılacak (npm install çalıştır).')
    return '<style>\n' + '\n'.join(out) + '\n</style>\n' if out else ''

fonts_link = embedded_fonts() if native else WEB_FONTS

import subprocess, datetime
try: _sha = subprocess.check_output(['git', 'rev-parse', '--short', 'HEAD'], cwd=root, stderr=subprocess.DEVNULL).decode().strip()
except Exception: _sha = 'dev'
build_id = f"{_sha} · {datetime.datetime.utcnow().strftime('%d.%m %H:%M')} UTC" + (' · native' if native else '')

html = f"""<!doctype html>
<html lang="tr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover,user-scalable=no">
<meta name="theme-color" content="#04161f">
<title>Akvaryum Dünyam</title>
{fonts_link}<style>
{css}
</style>
</head>
<body>
{body}
<script>
window.BUILD_ID = {build_id!r};
{js}
</script>
</body>
</html>
"""
if native:  # Capacitor: www/index.html (yazı tipleri gömülü, dış bağlantı yok)
    os.makedirs(os.path.join(root, 'www'), exist_ok=True)
    open(os.path.join(root, 'www', 'index.html'), 'w', encoding='utf-8').write(html)
    print('www/index.html yazıldı:', len(html) // 1024, 'KB (native)')
else:
    open(os.path.join(root, 'index.html'), 'w', encoding='utf-8').write(html)
    print('index.html yazıldı:', len(html) // 1024, 'KB')
