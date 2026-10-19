import { createServer } from 'node:http';
import path from 'node:path';
import { loadDotEnv, readConfig, ROOT } from './config.ts';
import { openDb, purgeExpiredSessions } from './db.ts';
import { createApp } from './app.ts';
import { devAssets, prodAssets } from './assets.ts';

loadDotEnv();
const cfg = readConfig();
const db = openDb(cfg.dbPath);
purgeExpiredSessions(db);

let vite: import('vite').ViteDevServer | null = null;
let staticRoot: string | undefined;
let assets;
if (cfg.production) { assets = prodAssets(ROOT); staticRoot = path.join(ROOT, 'dist/client'); }
else {
  const { createServer: createVite } = await import('vite');
  vite = await createVite({ root: ROOT, appType: 'custom', server: { middlewareMode: true, hmr: false }, logLevel: 'warn' });
  assets = devAssets();
}
const app = createApp(cfg, db, assets, staticRoot);
const viteRe = /^\/(client\/|@vite\/|@fs\/|@id\/|node_modules\/|shared\/|favicon\.svg)/;

const server = createServer((req, res) => {
  const p = (req.url ?? '/').split('?')[0];
  if (vite && viteRe.test(p)) return void vite.middlewares(req, res, () => { res.statusCode = 404; res.end('yok'); });
  void app.handler(req, res);
});
server.requestTimeout = 60_000;
server.listen(cfg.port, cfg.host, () => console.log(`Su Pazarı: http://${cfg.host}:${cfg.port}  (${cfg.production ? 'üretim' : 'geliştirme'}, veri: ${path.relative(process.cwd(), cfg.dataDir) || '.'})`));
for (const sig of ['SIGINT', 'SIGTERM'] as const) process.on(sig, () => { server.close(); void vite?.close(); process.exit(0); });
