'use strict';
// Spins up a fake Roku ECP server on :8060 and drives the real API against it.
const test = require('node:test');
const assert = require('node:assert');
const http = require('http');
const os = require('os'); const path = require('path');
process.env.DEVICES_FILE = path.join(os.tmpdir(), `tcl-test-${process.pid}.json`);
const { server } = require('../server');

test('roku flow: add, key, launch, text, delete', async () => {
  const hits = [];
  const roku = http.createServer((req, res) => {
    hits.push(`${req.method} ${req.url}`);
    res.end(req.url === '/query/device-info' ? '<device-info><user-device-name>Salon</user-device-name></device-info>' : '');
  });
  await new Promise((r) => roku.listen(8060, '127.0.0.1', r));
  await new Promise((r) => server.listen(0, '127.0.0.1', r));
  const base = `http://127.0.0.1:${server.address().port}/api/`;
  const call = async (p, m = 'GET', b) => { const r = await fetch(base + p, { method: m, body: b && JSON.stringify(b) }); return [r.status, await r.json()]; };
  try {
    let [s, d] = await call('devices', 'POST', { host: '127.0.0.1' });
    assert.equal(s, 200); assert.equal(d.type, 'roku'); assert.equal(d.name, 'Salon');
    assert.equal((await call('devices', 'POST', { host: '127.0.0.1' }))[0], 409);
    assert.equal((await call('devices', 'POST', { host: 'abc' }))[0], 400);
    assert.equal((await call('key', 'POST', { id: d.id, key: 'volup' }))[0], 200);
    assert.equal((await call('key', 'POST', { id: d.id, key: 'nope' }))[0], 500);
    assert.equal((await call('launch', 'POST', { id: d.id, app: 'netflix' }))[0], 200);
    assert.equal((await call('text', 'POST', { id: d.id, text: 'a b' }))[0], 200);
    assert.deepEqual(hits.slice(1), ['POST /keypress/VolumeUp', 'POST /launch/12', 'POST /keypress/Lit_a', 'POST /keypress/Lit_%20', 'POST /keypress/Lit_b']);
    assert.equal((await call('devices?id=' + d.id, 'DELETE'))[0], 200);
    assert.equal((await fetch(base.replace('/api/', '/')).then((r) => r.status)), 200);
    assert.equal((await fetch(base.replace('/api/', '/../server.js')).then((r) => r.status)), 404);
  } finally { server.close(); roku.close(); }
});
