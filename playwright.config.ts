import { defineConfig } from '@playwright/test';

const PORT = 4173;
const launchOptions = { executablePath: process.env.CHROME || undefined, args: ['--no-sandbox'] };

export default defineConfig({
  testDir: 'tests/e2e',
  testMatch: '**/*.e2e.ts',
  fullyParallel: true,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['github'], ['list']] : 'list',
  use: { baseURL: `http://127.0.0.1:${PORT}`, locale: 'tr-TR', serviceWorkers: 'block', launchOptions },
  webServer: { command: 'node scripts/serve-cli.mjs', url: `http://127.0.0.1:${PORT}/`, reuseExistingServer: !process.env.CI, env: { PORT: String(PORT) } },
  projects: [
    { name: 'masaüstü', use: { viewport: { width: 1280, height: 800 } } },
    { name: 'mobil', use: { viewport: { width: 390, height: 844 }, hasTouch: true } },
  ],
});
