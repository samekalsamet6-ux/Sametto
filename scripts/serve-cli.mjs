// dist/ klasörünü sabit bir portta sunar (Playwright webServer için).
import { serve } from './serve.mjs';
const port = Number(process.env.PORT ?? 4173);
await serve('dist', port);
console.log(`dist sunuluyor: http://127.0.0.1:${port}`);
