'use strict';
// LAN discovery: SSDP (Roku ECP) + mDNS (_androidtvremote2._tcp).
const dgram = require('dgram');
const { Bonjour } = require('bonjour-service');

function ssdpRoku(ms) {
  return new Promise((resolve) => {
    const found = new Map();
    const sock = dgram.createSocket({ type: 'udp4', reuseAddr: true });
    const msg = Buffer.from('M-SEARCH * HTTP/1.1\r\nHOST: 239.255.255.250:1900\r\nMAN: "ssdp:discover"\r\nMX: 2\r\nST: roku:ecp\r\n\r\n');
    sock.on('message', (buf, rinfo) => found.set(rinfo.address, { host: rinfo.address, type: 'roku', name: 'Roku TV' }));
    sock.on('error', () => {});
    sock.bind(0, () => { try { sock.send(msg, 1900, '239.255.255.250'); } catch {} });
    setTimeout(() => { try { sock.close(); } catch {} resolve([...found.values()]); }, ms);
  });
}

function mdnsAndroid(ms) {
  return new Promise((resolve) => {
    const found = new Map();
    let bj;
    try {
      bj = new Bonjour();
      bj.find({ type: 'androidtvremote2' }, (s) => {
        const host = (s.addresses || []).find((a) => /^\d+\.\d+\.\d+\.\d+$/.test(a));
        if (host) found.set(host, { host, type: 'android', name: s.name || 'Android TV' });
      });
    } catch { return resolve([]); }
    setTimeout(() => { try { bj.destroy(); } catch {} resolve([...found.values()]); }, ms);
  });
}

async function discover(ms = 4000) {
  const [a, b] = await Promise.all([ssdpRoku(ms), mdnsAndroid(ms)]);
  return [...a, ...b];
}
module.exports = { discover };
