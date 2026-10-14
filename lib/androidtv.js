'use strict';
// TCL Android TV / Google TV via Android TV Remote Protocol v2 (TLS, ports 6467 pairing / 6466 remote).
const { AndroidRemote, RemoteKeyCode, RemoteDirection } = require('androidtv-remote');
const net = require('net');
const { KEYS, APPS } = require('./keys');

const live = new Map();     // device id -> { remote, ready }
const pending = new Map();  // device id -> remote waiting for PIN

function tcpOpen(host, port, ms = 2000) {
  return new Promise((res) => {
    const s = net.connect({ host, port, timeout: ms });
    s.on('connect', () => { s.destroy(); res(true); });
    s.on('error', () => res(false));
    s.on('timeout', () => { s.destroy(); res(false); });
  });
}
const probe = async (host) => {
  if (!(await tcpOpen(host, 6466)) && !(await tcpOpen(host, 6467))) throw new Error('not android tv');
  return { name: 'TCL Android/Google TV' };
};

// Begin pairing: the TV shows a 6-digit code. Resolves when the TV asks for it.
function startPairing(d) {
  stop(d.id);
  const remote = new AndroidRemote(d.host, { pairing_port: 6467, remote_port: 6466, name: 'TCL Kumanda', cert: {} });
  return new Promise((resolve, reject) => {
    const t = setTimeout(() => reject(new Error('TV eşleştirme isteğine yanıt vermedi')), 15000);
    remote.on('secret', () => { clearTimeout(t); pending.set(d.id, remote); resolve(); });
    remote.on('error', (e) => { clearTimeout(t); reject(new Error(String(e && e.message || e))); });
    remote.start().catch(reject);
  });
}

function submitCode(d, code, saveCert) {
  const remote = pending.get(d.id);
  if (!remote) throw new Error('Önce eşleştirmeyi başlatın');
  return new Promise((resolve, reject) => {
    const t = setTimeout(() => reject(new Error('Kod doğrulanamadı')), 15000);
    remote.on('ready', () => {
      clearTimeout(t);
      pending.delete(d.id);
      live.set(d.id, { remote, ready: true });
      saveCert(remote.getCertificate());
      resolve();
    });
    remote.on('error', (e) => { clearTimeout(t); reject(new Error(String(e && e.message || e))); });
    remote.sendCode(String(code).trim().toUpperCase());
  });
}

async function connect(d) {
  const cur = live.get(d.id);
  if (cur && cur.ready) return cur.remote;
  if (!d.cert) throw new Error('Bu TV henüz eşleştirilmedi');
  const remote = new AndroidRemote(d.host, { pairing_port: 6467, remote_port: 6466, name: 'TCL Kumanda', cert: d.cert });
  const entry = { remote, ready: false };
  live.set(d.id, entry);
  await new Promise((resolve, reject) => {
    const t = setTimeout(() => { live.delete(d.id); try { remote.stop(); } catch {} reject(new Error('TV\'ye bağlanılamadı (TV açık ve aynı ağda mı?)')); }, 8000);
    remote.on('ready', () => { clearTimeout(t); entry.ready = true; resolve(); });
    remote.on('error', () => {});
    remote.on('unpaired', () => { live.delete(d.id); });
    remote.start().catch((e) => { clearTimeout(t); live.delete(d.id); reject(e); });
  });
  return remote;
}

function stop(id) {
  for (const m of [live, pending]) {
    const e = m.get(id);
    if (e) { try { (e.remote || e).stop(); } catch {} m.delete(id); }
  }
}

async function key(d, name) {
  const k = KEYS[name];
  if (!k) throw new Error('Bilinmeyen tuş: ' + name);
  const remote = await connect(d);
  remote.sendKey(RemoteKeyCode[k.android], RemoteDirection.SHORT);
}
const text = async (d, str) => (await connect(d)).sendText(str);
const launch = async (d, app) => {
  if (!APPS[app]) throw new Error('Bilinmeyen uygulama');
  (await connect(d)).sendAppLink(APPS[app].android);
};

module.exports = { probe, startPairing, submitCode, key, text, launch, stop };
