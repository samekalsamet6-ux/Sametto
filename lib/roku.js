'use strict';
// Roku TV (TCL Roku TV models) via External Control Protocol, HTTP :8060.
const { KEYS, APPS } = require('./keys');

const base = (d) => `http://${d.host}:8060`;
const post = (url) => fetch(url, { method: 'POST', signal: AbortSignal.timeout(4000) }).then((r) => {
  if (!r.ok) throw new Error(`Roku HTTP ${r.status} (Ayarlar > Sistem > Gelişmiş sistem ayarları > Harici kontrol / "Control by mobile apps" açık mı?)`);
});

async function probe(host) {
  const r = await fetch(`http://${host}:8060/query/device-info`, { signal: AbortSignal.timeout(2500) });
  if (!r.ok) throw new Error('not roku');
  const xml = await r.text();
  const tag = (t) => (xml.match(new RegExp(`<${t}>([^<]*)</${t}>`)) || [])[1];
  return { name: tag('user-device-name') || tag('friendly-device-name') || 'TCL Roku TV', model: tag('model-name'), vendor: tag('vendor-name') };
}

async function key(d, name) {
  const k = KEYS[name];
  if (!k) throw new Error('Bilinmeyen tuş: ' + name);
  if (!k.roku) throw new Error('Bu tuş Roku TV\'de desteklenmiyor');
  if (name === 'power') {
    // Roku TV toggles on "Power"; fall back to PowerOn when the TV is in standby
    try { return await post(`${base(d)}/keypress/Power`); } catch { return post(`${base(d)}/keypress/PowerOn`); }
  }
  return post(`${base(d)}/keypress/${k.roku}`);
}
const text = async (d, str) => { for (const ch of str) await post(`${base(d)}/keypress/Lit_${encodeURIComponent(ch)}`); };
const launch = (d, app) => {
  if (!APPS[app]) throw new Error('Bilinmeyen uygulama');
  return post(`${base(d)}/launch/${APPS[app].roku}`);
};

module.exports = { probe, key, text, launch };
