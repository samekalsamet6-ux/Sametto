'use strict';
/* =====================================================================
   31 · BİYOTOP HABİTATLARI — Aquascape Yarışması "Biyotop" stilinde jüri belirli bir
   doğal habitata bakar: tür, bitki, sert peyzaj, su değerleri ve akıntı o yere uymalı.
   Hazır şablonlar: Güney Amerika kara su, Tayland pirinç tarlası (Beta Biyotopu),
   Tayvan deresi, Orta Amerika acı suları, Venezuela lagünü.
   ===================================================================== */
const HABITATS = {
  amazon:    { name: 'Güney Amerika kara su', emo: '🌳', sp: ['guppy', 'endler'], min: 5, plants: ['sword', 'vallis', 'wendtii', 'hornwort', 'salvinia', 'limnobium', 'javafern'], wood: 2, leaf: 3, rock: 0, sub: ['sand', 'gravel'], water: { tannin: [1.5, 7], ph: [6.2, 7.5], temp: [24, 29] }, flow: [0, 0.75], float: true, tpl: 'blackwater', desc: 'Çay rengi, tanenli, yaprak çöpü ve kök dolu sakin dere. Lepistes ve Endler\'in vatanı.' },
  thai:      { name: 'Tayland pirinç tarlası', emo: '🌾', sp: ['betta'], min: 2, plants: ['wendtii', 'vallis', 'salvinia', 'limnobium', 'hygro', 'watersprite', 'javamoss'], wood: 1, leaf: 2, rock: 0, sub: ['sand', 'gravel'], water: { tannin: [0.5, 5], ph: [6.0, 7.5], temp: [25, 30] }, flow: [0, 0.45], float: true, tpl: 'betta', desc: 'Durgun, sığ, gölgeli; yüzen bitkiler ve yaprak çöpü. Beta\'nın doğal evi.' },
  taiwan:    { name: 'Tayvan deresi', emo: '🏞️', sp: ['shrimp'], min: 6, plants: ['javamoss', 'anubias', 'javafern', 'buce', 'wendtii', 'watersprite', 'staurogyne'], wood: 1, leaf: 0, rock: 2, sub: ['gravel', 'sand', 'aquasoil'], water: { tannin: [0, 3], ph: [6.7, 7.8], temp: [19, 25] }, flow: [0.45, 1.4], float: false, tpl: 'taiwan', desc: 'Serin, akıntılı, taşlı dere; taş ve köklerde yosun. Neocaridina\'nın evi.' },
  mexico:    { name: 'Orta Amerika acı suları', emo: '🌴', sp: ['molly', 'platy', 'swordtail'], min: 5, plants: ['vallis', 'javafern', 'anubias', 'hornwort', 'watersprite', 'hygro'], wood: 1, leaf: 0, rock: 1, sub: ['coral', 'sand'], water: { tannin: [0, 2.5], ph: [7.6, 8.7], temp: [24, 29] }, flow: [0.25, 1.1], float: false, tpl: 'mexico', desc: 'Sert, bazik, hafif tuzlu su; mercan kırığı zemin. Moli, Plati ve Kılıçkuyruk\'un vatanı.' },
  venezuela: { name: 'Venezuela lagünü', emo: '🌿', sp: ['endler', 'guppy'], min: 6, plants: ['guppygrass', 'salvinia', 'hornwort', 'limnobium', 'vallis', 'watersprite'], wood: 0, leaf: 1, rock: 0, sub: ['sand', 'gravel', 'coral'], water: { tannin: [0, 3], ph: [7.2, 8.4], temp: [25, 30] }, flow: [0, 0.6], float: true, tpl: 'betta', desc: 'Sıcak, sert ve sığ lagün; yüzen ve ince yapraklı bitkiler. Endler\'in vatanı.' },
};

const Habitat = {
  /** Saf puanlama: ctx = {items, subType, creatures:[{species}], water:{tannin,ph,temp}, flow}. 0-1 ve notlar döner. */
  styleScore(id, ctx) {
    const H = HABITATS[id], notes = [], inR = (v, r) => (v >= r[0] && v <= r[1] ? 1 : Math.max(0, 1 - Math.min(Math.abs(v - r[0]), Math.abs(v - r[1])) / Math.max(0.5, (r[1] - r[0]))));
    const cr = ctx.creatures, n = cr.length, ours = cr.filter((c) => H.sp.includes(c.species)).length;
    const spF = n ? Math.min(1, ours / H.min) * (ours / n) : 0; if (!n) notes.push(`${H.name}: ${H.sp.map((s) => SPECIES.find((x) => x.id === s).name).join(' / ')} (en az ${H.min}) tut.`); else if (ours < H.min) notes.push(`Habitat türünden en az ${H.min} canlı gerekir (şu an ${ours}).`); else if (ours / n < 0.85) notes.push('Habitata uymayan türler jüriyi düşürür.');
    const plants = ctx.items.filter((i) => i.k === 'plant' && !i.dead), ps = new Set(plants.map((p) => p.d)), good = [...ps].filter((p) => H.plants.includes(p)).length;
    let plF = ps.size ? (good / ps.size) * Math.min(1, ps.size / 3) : 0; if (ps.size < 3) notes.push('En az 3 farklı bitki türü kullan.'); else if (good / ps.size < 0.7) notes.push('Bitkilerin çoğu o habitata ait değil: ' + H.plants.slice(0, 4).map((p) => PLANTS[p].name).join(', ') + '… kullan.');
    if (H.float && !plants.some((p) => PLANTS[p.d].type === 'float')) { plF *= 0.7; notes.push('Bu habitat yüzen bitki ister.'); }
    const wood = ctx.items.filter((i) => i.k === 'wood').length, leaf = ctx.items.filter((i) => i.k === 'leaf').length, rock = ctx.items.filter((i) => i.k === 'rock').length, decor = ctx.items.filter((i) => i.k === 'decor').length;
    let hdF = (H.wood ? Math.min(1, wood / H.wood) : 1) * 0.4 + (H.leaf ? Math.min(1, leaf / H.leaf) : 1) * 0.3 + (H.rock ? Math.min(1, rock / H.rock) : (rock ? 0.6 : 1)) * 0.3; if (decor) { hdF *= 0.6; notes.push('Yapay dekor biyotopa uymaz.'); }
    if (H.wood && wood < H.wood) notes.push(`${H.wood}+ kök/dal ekle.`); if (H.leaf && leaf < H.leaf) notes.push(`${H.leaf}+ badem yaprağı veya kozalak ekle.`); if (H.rock && rock < H.rock) notes.push(`${H.rock}+ taş ekle.`);
    const w = ctx.water, wF = (inR(w.tannin, H.water.tannin) + inR(w.ph, H.water.ph) + inR(w.temp, H.water.temp)) / 3; if (wF < 0.8) notes.push(`Su değerleri: tanen ${H.water.tannin.join('–')}, pH ${H.water.ph.join('–')}, sıcaklık ${H.water.temp.join('–')} °C hedeflenmeli.`);
    const fl = inR(ctx.flow, H.flow), sb = H.sub.includes(ctx.subType) ? 1 : 0.3; if (fl < 0.8) notes.push(ctx.flow > H.flow[1] ? 'Akıntı bu habitat için fazla güçlü.' : 'Akıntı bu habitat için fazla zayıf.'); if (!sb || sb < 1) notes.push('Zemin: ' + H.sub.join(' / ') + ' olmalı.');
    return { v: clamp(0.30 * spF + 0.20 * plF + 0.15 * hdF + 0.20 * wF + 0.15 * (0.6 * fl + 0.4 * sb), 0, 1), notes };
  },
};

/* Jüri: Biyotop stilinde seçili habitata göre değerlendir */
Judge.score = ((orig) => function (style, S = Game.S) {
  const res = orig.call(this, style, S); if (style !== 'biotope') return res;
  const M = Meta.ensure(S), id = HABITATS[M.habitat] ? M.habitat : 'amazon', t = Game.tank;
  const r = Habitat.styleScore(id, { items: S.scape.items.filter((i) => !i.dead), subType: S.scape.sub.type, creatures: t.creatures, water: { tannin: Chem.w.tannin ?? 0, ph: Chem.w.ph, temp: Chem.w.temp }, flow: t.flowPow ?? 0 });
  const c = res.crit.find((x) => x.k === 'style'); c.v = Math.round(r.v * 100); const v = res.crit.map((x) => x.v / 100);
  res.total = Math.round(100 * (0.25 * v[0] + 0.2 * v[1] + 0.2 * v[2] + 0.25 * v[3] + 0.1 * v[4])); res.habitat = id;
  res.notes = [...r.notes, ...res.notes.filter((n) => !/Biyotopta|Kum veya|Kök ve yaprak/.test(n))].slice(0, 6); return res;
})(Judge.score);

/* Hazır şablonlar */
Object.assign(TEMPLATES, {
  blackwater: { name: 'Kara Su Deresi', desc: 'Tanenli, yaprak çöpü ve köklerle Güney Amerika kara su biyotopu (lepistes).', liters: 60, sub: { type: 'sand', color: 'natural' }, equip: { filter: 'sponge', heater: true, co2: 'none', air: true },
    items: [['wood', 'spider', 0.28, { s: 1.2 }], ['wood', 'malaysian', 0.64, { s: 1.0 }], ['leaf', 'almond', 0.2], ['leaf', 'almond', 0.46], ['leaf', 'almond', 0.56], ['leaf', 'almond', 0.8], ['leaf', 'cone', 0.4], ['plant', 'sword', 0.12], ['plant', 'vallis', 0.92], ['plant', 'hornwort', 0.78], ['plant', 'wendtii', 0.5], ['plant', 'salvinia', 0.35], ['plant', 'salvinia', 0.62], ['plant', 'limnobium', 0.5]] },
  taiwan: { name: 'Tayvan Deresi', desc: 'Taş, kök ve yosun: akıntılı, serin Tayvan deresi (karides).', liters: 40, sub: { type: 'gravel', color: 'natural' }, equip: { filter: 'internal', heater: false, co2: 'none', air: false },
    items: [['rock', 'seiryu', 0.24, { s: 1.0 }], ['rock', 'seiryu', 0.4, { s: 0.7 }], ['rock', 'seiryu', 0.72, { s: 0.9 }], ['wood', 'spider', 0.55, { s: 1.0 }], ['plant', 'javamoss', 0.3, { onRock: 0 }], ['plant', 'javamoss', 0.58, { onWood: 0 }], ['plant', 'anubias', 0.4, { onRock: 1 }], ['plant', 'javafern', 0.72, { onRock: 2 }], ['plant', 'buce', 0.24, { onRock: 0 }], ['plant', 'wendtii', 0.1], ['plant', 'watersprite', 0.9]] },
  mexico: { name: 'Orta Amerika Acı Suyu', desc: 'Mercan zemin, sert-bazik su, dayanıklı bitkiler (moli, plati, kılıçkuyruk).', liters: 100, sub: { type: 'coral', color: 'natural' }, equip: { filter: 'internal', heater: true, co2: 'none', air: true },
    items: [['rock', 'dragon', 0.3, { s: 1.0 }], ['wood', 'malaysian', 0.7, { s: 1.0 }], ['plant', 'vallis', 0.08], ['plant', 'vallis', 0.14], ['plant', 'vallis', 0.94], ['plant', 'javafern', 0.7, { onWood: 0 }], ['plant', 'anubias', 0.3, { onRock: 0 }], ['plant', 'hornwort', 0.5], ['plant', 'watersprite', 0.86]] },
});

/* Yarışma ekranı: Biyotop seçiliyken habitat çipleri */
UI.render_contest = ((orig) => function (el) {
  const r = orig.apply(this, arguments), S = Game.S, M = Meta.ensure(S); if (!HABITATS[M.habitat]) M.habitat = 'amazon';
  if (this.contestTab === 'scape' && this.judgeStyle === 'biotope') {
    const chips = el.querySelectorAll('.chips')[1]; if (chips) chips.after(h('div.stack', { style: { margin: '6px 0' } }, UI.tabs(Object.entries(HABITATS).map(([k, x]) => [k, x.emo + ' ' + x.name]), M.habitat, (k) => { M.habitat = k; UI.render_contest(el); }),
      h('div.card.small', null, h('b', null, `${HABITATS[M.habitat].emo} ${HABITATS[M.habitat].name}`), h('div.muted', null, HABITATS[M.habitat].desc), h('button.btn.sm', { style: { marginTop: '6px' }, onclick: () => { UI.go('design'); setTimeout(() => Editor.applyTemplate({ key: HABITATS[M.habitat].tpl }), 450); } }, 'Hazır şablonu uygula'))));
  }
  return r;
})(UI.render_contest);
