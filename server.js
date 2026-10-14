'use strict';
const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const roku = require('./lib/roku');
const atv = require('./lib/androidtv');
const { discover } = require('./lib/discovery');
const { KEYS, APPS } = require('./lib/keys');

const PORT = +process.env.PORT || 3000;
const HOST = process.env.HOST || '0.0.0.0';
const DB = process.env.DEVICES_FILE || path.join(__dirname, 'devices.json');
const PUB = path.join(__dirname, 'public');

let devices = [];
try { devices = JSON.parse(fs.readFileSync(DB, 'utf8')); } catch {}
const save = () => fs.writeFileSync(DB, JSON.stringify(devices, null, 2), { mode: 0o600 });
const pub = (d) => ({ id: d.id, name: d.name, host: d.host, type: d.type, paired: d.type === 'roku' || !!d.cert });
const driver = (d) => (d.type === 'roku' ? roku : atv);
const find = (id) => { const d = devices.find((x) => x.id === id); if (!d) throw Object.assign(new Error('TV bulunamadı'), { status: 404 }); return d; };
const isIPv4 = (s) => /^(\d{1,3}\.){3}\d{1,3}$/.test(s) && s.split('.').every((n) => +n <= 255);

const routes = {
  'GET /api/meta': async () => ({ keys: Object.keys(KEYS), apps: Object.fromEntries(Object.entries(APPS).map(([k, v]) => [k, v.label])) }),
  'GET /api/devices': async () => devices.map(pub),
  'GET /api/discover': async () => (await discover()).filter((f) => !devices.some((d) => d.host === f.host)),
  // Add a TV by IP; type is auto-detected (Roku TV vs Android/Google TV) unless given.
  'POST /api/devices': async ({ host, name, type }) => {
    host = String(host || '').trim();
    if (!isIPv4(host)) throw Object.assign(new Error('Geçerli bir IPv4 adresi girin'), { status: 400 });
    if (devices.some((d) => d.host === host)) throw Object.assign(new Error('Bu TV zaten ekli'), { status: 409 });
    let info, t = type;
    if (!t || t === 'roku') { try { info = await roku.probe(host); t = 'roku'; } catch {} }
    if (!t || t === 'android') { try { info = await atv.probe(host); t = 'android'; } catch {} }
    if (!t) throw Object.assign(new Error('TV bulunamadı. TV açık mı, aynı Wi-Fi ağında mı, ağ kontrolü açık mı?'), { status: 404 });
    const d = { id: crypto.randomUUID(), host, type: t, name: (name || (info && info.name) || 'TCL TV').slice(0, 40) };
    devices.push(d); save();
    return pub(d);
  },
  'DELETE /api/devices': async ({ id }) => { const d = find(id); atv.stop(d.id); devices = devices.filter((x) => x !== d); save(); return { ok: true }; },
  'POST /api/pair/start': async ({ id }) => { const d = find(id); if (d.type !== 'android') return { ok: true }; await atv.startPairing(d); return { ok: true }; },
  'POST /api/pair/code': async ({ id, code }) => {
    const d = find(id);
    await atv.submitCode(d, code, (cert) => { d.cert = cert; save(); });
    return { ok: true };
  },
  'POST /api/key': async ({ id, key }) => { const d = find(id); await driver(d).key(d, key); return { ok: true }; },
  'POST /api/text': async ({ id, text }) => { const d = find(id); await driver(d).text(d, String(text).slice(0, 200)); return { ok: true }; },
  'POST /api/launch': async ({ id, app }) => { const d = find(id); await driver(d).launch(d, app); return { ok: true }; },
};

const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.json': 'application/json', '.svg': 'image/svg+xml', '.webmanifest': 'application/manifest+json' };

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, 'http://x');
  const send = (code, body, type = 'application/json') => { res.writeHead(code, { 'Content-Type': type, 'Cache-Control': 'no-store' }); res.end(typeof body === 'string' ? body : JSON.stringify(body)); };
  if (url.pathname.startsWith('/api/')) {
    const handler = routes[`${req.method} ${url.pathname}`];
    if (!handler) return send(404, { error: 'Yok' });
    try {
      let body = Object.fromEntries(url.searchParams);
      if (req.method === 'POST') {
        const chunks = []; let n = 0;
        for await (const c of req) { n += c.length; if (n > 1e5) throw Object.assign(new Error('Too large'), { status: 413 }); chunks.push(c); }
        if (chunks.length) body = { ...body, ...JSON.parse(Buffer.concat(chunks).toString()) };
      }
      return send(200, await handler(body));
    } catch (e) { return send(e.status || 500, { error: e.message }); }
  }
  const file = path.join(PUB, url.pathname === '/' ? 'index.html' : url.pathname);
  if (!file.startsWith(PUB + path.sep)) return send(403, 'Forbidden', 'text/plain');
  fs.readFile(file, (err, data) => err ? send(404, 'Not found', 'text/plain') : send(200, data, MIME[path.extname(file)] || 'application/octet-stream'));
});

if (require.main === module) {
  server.listen(PORT, HOST, () => console.log(`TCL Kumanda hazır: http://localhost:${PORT}  (telefonunuzdan: http://<bilgisayar-IP>:${PORT})`));
}
module.exports = { server };
