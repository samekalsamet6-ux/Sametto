import { defineConfig } from 'vite';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(here, '..');

// Tür modülleri ../src/lib altındadır ve SALT OKUNURDUR (kopyalanmaz); three.js kök node_modules'tan gelir.
export default defineConfig({
  root: here,
  publicDir: path.resolve(here, 'public'),
  resolve: { alias: { three: path.resolve(repoRoot, 'node_modules/three') }, dedupe: ['three'] },
  server: { fs: { allow: [repoRoot] } },
  build: {
    outDir: 'dist/client',
    emptyOutDir: true,
    manifest: true,
    chunkSizeWarningLimit: 900,
    rollupOptions: {
      input: {
        site: path.resolve(here, 'client/site.ts'),
        ilanForm: path.resolve(here, 'client/ilan-form.ts'),
        ilanDetay: path.resolve(here, 'client/ilan-detay.ts'),
        ilanlar: path.resolve(here, 'client/ilanlar.ts'),
        satici: path.resolve(here, 'client/satici.ts'),
        akvaryumDuzenle: path.resolve(here, 'client/akvaryum-duzenle.ts'),
      },
    },
  },
});
