'use strict';
/* =====================================================================
   06 · SES — Web Audio ile üretken (generative) müzik + ambiyans + efektler
   Hiç harici dosya yok. Grafik: katman gain → ortak reverb (prosedürel
   impuls) + delay → limiter. Notalar seçili gam/akorlardan anlık üretilir.
   ===================================================================== */
const AudioSys = (() => {
  let ctx = null, started = false, timer = null, blopTimer = null, nextChordT = 0, chordIdx = 0, sleepAt = 0, sleepFading = false;
  const N = {}; // düğümler
  const S = { master: 0.8, music: 0.5, amb: 0.5, sfx: 0.7, style: 'ambient', sleepMin: 0, bgMute: true, mood: 'day', tr: 0 };
  const mtof = (m) => 440 * Math.pow(2, (m - 69) / 12);

  /* Ruh hali tablosu: root (MIDI), akorlar (yarım ton), melodi gamı, bpm, nota olasılığı */
  const MOODS = {
    day:    { root: 60, bpm: 66, p: 0.34, bass: 0.6, chords: [[0, 4, 7, 11, 14], [5, 9, 12, 16, 19], [9, 12, 16, 19, 23], [7, 11, 14, 16, 21]], scale: [0, 2, 4, 7, 9, 12, 14, 16] },
    night:  { root: 57, bpm: 54, p: 0.17, bass: 0.7, chords: [[0, 3, 7, 10, 14], [8, 12, 15, 19], [5, 8, 12, 15, 19], [7, 10, 14, 17]], scale: [0, 3, 5, 7, 10, 12, 15] },
    studio: { root: 60, bpm: 58, p: 0.12, bass: 0.2, chords: [[0, 7, 11, 14], [5, 9, 12, 16], [9, 12, 16, 19]], scale: [0, 2, 4, 7, 9, 12] },
    lab:    { root: 62, bpm: 70, p: 0.3, bass: 0.4, chords: [[0, 4, 7, 11, 14], [2, 6, 9, 12], [9, 12, 16, 19]], scale: [0, 2, 4, 6, 7, 9, 11, 14] },
  };
  const mood = () => { const m = MOODS[S.mood] || MOODS.day; return S.tr ? Object.assign({}, m, { root: m.root + S.tr }) : m; };
  const scaleNote = (i, oct = 12) => mood().root + oct + mood().scale[((i % mood().scale.length) + mood().scale.length) % mood().scale.length];

  function impulse(c, dur = 4, decay = 2.4) {
    const len = Math.floor(c.sampleRate * dur), b = c.createBuffer(2, len, c.sampleRate);
    for (let ch = 0; ch < 2; ch++) { const d = b.getChannelData(ch); let lp = 0; for (let i = 0; i < len; i++) { const w = Math.random() * 2 - 1; lp += (w - lp) * 0.35; d[i] = lp * Math.pow(1 - i / len, decay); } }
    return b;
  }
  const g = (v = 1) => { const n = ctx.createGain(); n.gain.value = v; return n; };

  function init() {
    ctx = new (window.AudioContext || window.webkitAudioContext)();
    N.master = g(S.master);
    N.limit = ctx.createDynamicsCompressor(); N.limit.threshold.value = -10; N.limit.knee.value = 12; N.limit.ratio.value = 14; N.limit.attack.value = 0.004; N.limit.release.value = 0.25;
    N.master.connect(N.limit).connect(ctx.destination);
    N.music = g(S.music); N.amb = g(S.amb); N.sfx = g(S.sfx);
    N.ambF = ctx.createBiquadFilter(); N.ambF.type = 'lowpass'; N.ambF.frequency.value = 2600;
    N.music.connect(N.master); N.sfx.connect(N.master); N.amb.connect(N.ambF).connect(N.master);
    // reverb + delay gönderimleri
    N.rev = ctx.createConvolver(); N.rev.buffer = impulse(ctx); N.revIn = g(1); N.revOut = g(0.7);
    N.revIn.connect(N.rev); N.rev.connect(N.revOut).connect(N.master);
    N.dly = ctx.createDelay(1.5); N.dly.delayTime.value = 0.46; N.dlyFb = g(0.34); N.dlyLp = ctx.createBiquadFilter(); N.dlyLp.type = 'lowpass'; N.dlyLp.frequency.value = 2200;
    N.dlyIn = g(1); N.dlyIn.connect(N.dly); N.dly.connect(N.dlyLp); N.dlyLp.connect(N.dlyFb).connect(N.dly); N.dlyLp.connect(N.revIn); N.dlyLp.connect(N.master);
    buildAmbience();
  }

  /* ---------- ambiyans: su akışı + kabarcık tıpırtısı ---------- */
  function buildAmbience() {
    const len = ctx.sampleRate * 5, b = ctx.createBuffer(1, len, ctx.sampleRate), d = b.getChannelData(0);
    let b0 = 0, b1 = 0, b2 = 0; // pembe gürültü
    for (let i = 0; i < len; i++) { const w = Math.random() * 2 - 1; b0 = 0.99765 * b0 + w * 0.0990460; b1 = 0.96300 * b1 + w * 0.2965164; b2 = 0.57000 * b2 + w * 1.0526913; d[i] = (b0 + b1 + b2 + w * 0.1848) * 0.11; }
    const src = ctx.createBufferSource(); src.buffer = b; src.loop = true;
    const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 760; lp.Q.value = 0.5;
    const hp = ctx.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 90;
    const gain = g(0.5); const lfo = ctx.createOscillator(), lg = g(0.18); lfo.frequency.value = 0.07; lfo.connect(lg).connect(gain.gain);
    const lfo2 = ctx.createOscillator(), lg2 = g(160); lfo2.frequency.value = 0.045; lfo2.connect(lg2).connect(lp.frequency);
    src.connect(lp).connect(hp).connect(gain).connect(N.amb); src.start(); lfo.start(); lfo2.start();
    N.ambSrc = src; N.ambGain = gain;
  }
  function scheduleBlop() {
    clearTimeout(blopTimer);
    blopTimer = setTimeout(() => { if (ctx && ctx.state === 'running') blop(); scheduleBlop(); }, 1500 + Math.random() * 5200);
  }
  function blop(t = ctx.currentTime, v = 0.14) {
    const o = ctx.createOscillator(), a = g(0), f = 260 + Math.random() * 300;
    o.type = 'sine'; o.frequency.setValueAtTime(f, t); o.frequency.exponentialRampToValueAtTime(f * 1.9, t + 0.07);
    a.gain.setValueAtTime(0, t); a.gain.linearRampToValueAtTime(v, t + 0.006); a.gain.exponentialRampToValueAtTime(0.0005, t + 0.16);
    o.connect(a).connect(N.amb); a.connect(N.revIn); o.start(t); o.stop(t + 0.2);
  }

  /* ---------- müzik sesleri ---------- */
  function pad(freq, t0, dur, vel) {
    const out = g(0), lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.Q.value = 0.4;
    lp.frequency.setValueAtTime(500, t0); lp.frequency.linearRampToValueAtTime(1100, t0 + dur * 0.55); lp.frequency.linearRampToValueAtTime(600, t0 + dur + 2.5);
    const a = 2.8, r = 3.4;
    out.gain.setValueAtTime(0, t0); out.gain.linearRampToValueAtTime(vel, t0 + a); out.gain.setValueAtTime(vel, t0 + Math.max(a, dur)); out.gain.linearRampToValueAtTime(0, t0 + dur + r);
    for (const det of [-7, 0, 7]) { const o = ctx.createOscillator(); o.type = det === 0 ? 'sine' : 'triangle'; o.frequency.value = freq; o.detune.value = det; o.connect(lp); o.start(t0); o.stop(t0 + dur + r + 0.1); }
    lp.connect(out); out.connect(N.music); const s = g(0.6); out.connect(s).connect(N.revIn);
  }
  function pluck(freq, t0, vel, bright = 1) {
    const car = ctx.createOscillator(), mod = ctx.createOscillator(), mg = g(0), a = g(0);
    car.type = 'sine'; mod.type = 'sine'; car.frequency.value = freq; mod.frequency.value = freq * 3.5;
    mg.gain.setValueAtTime(freq * 1.4 * bright, t0); mg.gain.exponentialRampToValueAtTime(freq * 0.02, t0 + 0.35);
    mod.connect(mg).connect(car.frequency);
    a.gain.setValueAtTime(0, t0); a.gain.linearRampToValueAtTime(vel, t0 + 0.006); a.gain.exponentialRampToValueAtTime(vel * 0.25, t0 + 0.5); a.gain.exponentialRampToValueAtTime(0.0004, t0 + 2.4);
    car.connect(a); car.start(t0); mod.start(t0); car.stop(t0 + 2.6); mod.stop(t0 + 2.6);
    return a;
  }
  function bass(freq, t0, dur, vel) {
    const o = ctx.createOscillator(), a = g(0); o.type = 'sine'; o.frequency.value = freq;
    a.gain.setValueAtTime(0, t0); a.gain.linearRampToValueAtTime(vel, t0 + 1.2); a.gain.linearRampToValueAtTime(0, t0 + dur + 1.5);
    o.connect(a).connect(N.music); o.start(t0); o.stop(t0 + dur + 1.6);
  }

  function tick() {
    if (!ctx || S.style === 'nature') return;
    const m = mood(), beat = 60 / m.bpm, chordBeats = 8, dur = beat * chordBeats;
    while (nextChordT < ctx.currentTime + 1.5) {
      const chord = m.chords[chordIdx % m.chords.length]; chordIdx++;
      const t0 = Math.max(nextChordT, ctx.currentTime + 0.05);
      chord.forEach((semi, i) => pad(mtof(m.root - 12 + semi), t0 + i * 0.07, dur, 0.05 / Math.sqrt(chord.length) * 1.6));
      if (m.bass > Math.random()) bass(mtof(m.root - 24 + chord[0]), t0, dur * 0.8, 0.16);
      // melodi damlaları: akor sesleri + gam notaları
      for (let b = 0; b < chordBeats * 2; b++) {
        if (Math.random() > m.p * 0.5) continue;
        const useChord = Math.random() < 0.45;
        const semi = useChord ? chord[Math.floor(Math.random() * chord.length)] + 12 * (Math.random() < 0.5 ? 1 : 2) : m.scale[Math.floor(Math.random() * m.scale.length)] + 12;
        const t = t0 + b * beat * 0.5 + Math.random() * beat * 0.35;
        const a = pluck(mtof(m.root + semi), t, 0.05 + Math.random() * 0.045, S.mood === 'night' ? 0.5 : 1);
        a.connect(N.music); const rs = g(0.9); a.connect(rs).connect(N.revIn); const ds = g(0.45); a.connect(ds).connect(N.dlyIn);
      }
      nextChordT = t0 + dur;
    }
  }

  /* ---------- efektler (mevcut gama uyumlu) ---------- */
  function sfxNote(freq, t, v = 0.12) {
    const a = pluck(freq, t, v, 0.7); a.connect(N.sfx); const rs = g(0.6); a.connect(rs).connect(N.revIn);
  }
  const SFX = {
    tick() { if (!ctx) return; const t = ctx.currentTime, o = ctx.createOscillator(), a = g(0); o.type = 'sine'; o.frequency.setValueAtTime(900, t); o.frequency.exponentialRampToValueAtTime(560, t + 0.07); a.gain.setValueAtTime(0, t); a.gain.linearRampToValueAtTime(0.07, t + 0.004); a.gain.exponentialRampToValueAtTime(0.0005, t + 0.09); o.connect(a).connect(N.sfx); o.start(t); o.stop(t + 0.1); },
    whoosh() { if (!ctx) return; const t = ctx.currentTime, s = ctx.createBufferSource(); s.buffer = N.ambSrc.buffer; const f = ctx.createBiquadFilter(), a = g(0); f.type = 'bandpass'; f.Q.value = 0.8; f.frequency.setValueAtTime(300, t); f.frequency.exponentialRampToValueAtTime(1400, t + 0.28); a.gain.setValueAtTime(0, t); a.gain.linearRampToValueAtTime(0.5, t + 0.1); a.gain.linearRampToValueAtTime(0, t + 0.34); s.connect(f).connect(a).connect(N.sfx); s.start(t, Math.random() * 3, 0.4); },
    feed() { if (!ctx) return; const t = ctx.currentTime; for (let i = 0; i < 5; i++) { const s = ctx.createBufferSource(); s.buffer = N.ambSrc.buffer; const f = ctx.createBiquadFilter(), a = g(0); f.type = 'highpass'; f.frequency.value = 3200; const tt = t + i * 0.045 + Math.random() * 0.02; a.gain.setValueAtTime(0, tt); a.gain.linearRampToValueAtTime(0.35, tt + 0.003); a.gain.exponentialRampToValueAtTime(0.001, tt + 0.05); s.connect(f).connect(a).connect(N.sfx); s.start(tt, Math.random() * 3, 0.06); } blop(t + 0.3, 0.09); },
    eat() { if (!ctx) return; blop(ctx.currentTime, 0.07); },
    coin() { if (!ctx) return; const t = ctx.currentTime; sfxNote(mtof(scaleNote(4, 24)), t, 0.1); sfxNote(mtof(scaleNote(6, 24)), t + 0.09, 0.09); },
    born() { if (!ctx) return; const t = ctx.currentTime; [0, 2, 4].forEach((i, k) => sfxNote(mtof(scaleNote(i + 2, 24)), t + k * 0.14, 0.09)); },
    warn() { if (!ctx) return; const t = ctx.currentTime; sfxNote(mtof(mood().root + 7), t, 0.1); sfxNote(mtof(mood().root + 2), t + 0.22, 0.09); },
    /** Keşif arpejı: nadirlik arttıkça daha zengin. */
    discover(rarity = 0) {
      if (!ctx) return; const t = ctx.currentTime, n = 4 + rarity * 2;
      for (let i = 0; i < n; i++) sfxNote(mtof(scaleNote(i * 1 + 1, 12 + (i > 4 ? 12 : 0)) + (rarity > 2 && i % 2 ? 0 : 0)), t + i * (0.13 - rarity * 0.008), 0.08 + rarity * 0.01);
      if (rarity >= 2) pad(mtof(mood().root), t, 2.5, 0.05); if (rarity >= 3) pad(mtof(mood().root + 7), t, 3.2, 0.04);
    },
    sell() { SFX.coin(); },
  };

  /* ---------- genel API ---------- */
  function applyVolumes() {
    if (!ctx) return; const t = ctx.currentTime;
    N.master.gain.setTargetAtTime(S.master, t, 0.08);
    N.music.gain.setTargetAtTime(S.style === 'nature' ? 0 : S.music * (sleepFading ? 0 : 1), t, sleepFading ? 6 : 0.15);
    N.amb.gain.setTargetAtTime(S.amb, t, 0.15); N.sfx.gain.setTargetAtTime(S.sfx, t, 0.08);
  }
  return {
    S, SFX,
    get running() { return !!ctx && ctx.state === 'running'; },
    start() {
      if (started) { ctx.resume(); return; }
      try { init(); } catch (e) { console.warn('Ses başlatılamadı', e); ctx = null; return; }
      started = true; ctx.resume(); nextChordT = ctx.currentTime + 0.3; timer = setInterval(() => { try { tick(); sleepCheck(); } catch (e) { /* sessiz */ } }, 250); scheduleBlop(); applyVolumes();
    },
    /** Sezon temasına göre ana ses perdesi kayar (yarım ton). */
    setTune(tr) { S.tr = tr || 0; },
    setMood(m) { if (MOODS[m] && S.mood !== m) { S.mood = m; chordIdx = 0; } },
    set(key, v) { S[key] = v; if (key === 'sleepMin') { sleepFading = false; sleepAt = v > 0 ? Date.now() + v * 60000 : 0; } applyVolumes(); },
    /** Yakınlaşınca sesler daha "sualtı" (boğuk) duyulur. */
    setZoom(z) { if (ctx) N.ambF.frequency.setTargetAtTime(lerp(2800, 900, clamp((z - 1) / 1.5, 0, 1)), ctx.currentTime, 0.3); },
    suspend() { if (ctx && S.bgMute) ctx.suspend(); }, resume() { if (ctx) ctx.resume(); },
    /** DİKİŞ NOKTASI — gerçek müzik dosyası (mp3/ogg) bu sisteme takılabilir. */
    async attachExternalTrack(url, { loop = true, gain = 0.8 } = {}) {
      if (!ctx) return null; const res = await fetch(url), buf = await ctx.decodeAudioData(await res.arrayBuffer());
      const src = ctx.createBufferSource(); src.buffer = buf; src.loop = loop; const gn = g(gain); src.connect(gn).connect(N.music); src.start(); return src;
    },
  };
  function sleepCheck() { if (sleepAt && !sleepFading && Date.now() > sleepAt) { sleepFading = true; applyVolumes(); } }
})();
