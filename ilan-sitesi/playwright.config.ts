import { defineConfig } from '@playwright/test';

const PORT = Number(process.env.E2E_PORT) || 4180;
const DATA = process.env.E2E_DATA || 'data/e2e';
const launchOptions = { executablePath: process.env.CHROME || undefined, args: ['--no-sandbox', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] };

export default defineConfig({
  testDir: 'tests/e2e', testMatch: '**/*.e2e.ts', fullyParallel: true, workers: 2, timeout: 60_000,
  reporter: 'list',
  use: { baseURL: `http://127.0.0.1:${PORT}`, locale: 'tr-TR', launchOptions, trace: 'off' },
  // Üretim derlemesi + ayrı geçici veri klasörü (data/e2e) ile sunucu başlatılır.
  webServer: {
    command: `rm -rf ${DATA} && npm run build --silent && node scripts/seed.ts --quiet && NODE_ENV=production node server/main.ts`,
    url: `http://127.0.0.1:${PORT}/`, reuseExistingServer: false, timeout: 180_000,
    env: { PORT: String(PORT), DATA_DIR: `./${DATA}`, LOGIN_MAX_FAILS: '5', REGISTER_MAX: '1000' },
  },
  projects: [
    { name: 'masaüstü', use: { viewport: { width: 1280, height: 800 } } },
    { name: 'mobil', use: { viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true } },
  ],
});
