// PWA simgelerini üretir (public/icons/*.png). Çalıştırma: CHROME=<yol> node scripts/make-icons.mjs
import { chromium } from 'playwright-core';

const fish = (bg, maskable) => `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <rect width="512" height="512" ${maskable ? '' : 'rx="112"'} fill="${bg}"/>
  <g transform="${maskable ? 'translate(256 256) scale(.78) translate(-256 -256)' : ''}">
    <path d="M96 256c40-76 160-104 250-40l70-62v204l-70-62c-90 64-210 36-250-40z" fill="#fff"/>
    <path d="M226 168c20-34 50-52 84-52-6 28-22 52-52 66z" fill="#f08a24"/>
    <path d="M236 346c24 28 52 42 84 42-4-26-20-46-48-58z" fill="#f08a24"/>
    <circle cx="170" cy="236" r="13" fill="${bg}"/>
  </g>
</svg>`;

const jobs = [
  ['icon-192.png', 192, false], ['icon-512.png', 512, false], ['apple-touch-icon.png', 180, false], ['icon-maskable-512.png', 512, true],
];
const browser = await chromium.launch({ executablePath: process.env.CHROME || undefined, args: ['--no-sandbox'] });
for (const [name, size, maskable] of jobs) {
  const page = await browser.newPage({ viewport: { width: size, height: size } });
  await page.setContent(`<body style="margin:0;background:transparent">${fish('#0b6e8a', maskable).replace('width="512" height="512"', `width="${size}" height="${size}"`)}</body>`);
  await page.screenshot({ path: `public/icons/${name}`, omitBackground: true });
  await page.close();
}
await browser.close();
console.log('Simgeler üretildi.');
