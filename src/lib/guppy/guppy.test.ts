import { describe, expect, it, vi } from 'vitest';
import { existsSync } from 'node:fs';
import {
  BODY, DORSAL, SEXES, SWIM, TAIL, analFin, bodyProfile, bodySurfacePoint, dorsalFin, envelope, eyeSpec, fanFin, gonopodium,
  mouthLine, operculumEdge, pectoralFin, pelvicFin, silhouette, swimOffsetZ, tailFin, type Sex, type Vec3,
} from './model';
import { PARTS, partAnchors, partsFor } from './parts';
import { VARIANTS, VARIANT_GROUPS, groupedVariants, finColor, hexToRgb, mulberry32, variantById } from './variants';

const finite = (v: readonly number[]) => v.every((n) => Number.isFinite(n));

describe('gövde geometrisi', () => {
  it('zarf uçlarda 0, tepe noktasında 1, her yerde 0..1 arasında', () => {
    for (const s of SEXES) {
      expect(envelope(s, 0)).toBe(0);
      expect(envelope(s, 1)).toBe(0);
      expect(envelope(s, BODY[s].peak)).toBeCloseTo(1, 5);
      for (let i = 0; i <= 200; i++) {
        const e = envelope(s, i / 200);
        expect(e).toBeGreaterThanOrEqual(0);
        expect(e).toBeLessThanOrEqual(1 + 1e-9);
      }
    }
  });

  it('kuyruk sapı tepe kesitten belirgin biçimde daha ince (iğ biçimli gövde)', () => {
    for (const s of SEXES) {
      const peak = bodyProfile(s, BODY[s].peak);
      const ped = bodyProfile(s, 0.9);
      expect(ped.up + ped.down).toBeLessThan(0.6 * (peak.up + peak.down));
      expect(ped.rz).toBeLessThan(0.6 * peak.rz);
    }
  });

  it('dişi erkekten daha büyük, daha derin ve karnı daha yuvarlak', () => {
    expect(BODY.disi.length).toBeGreaterThan(BODY.erkek.length);
    const m = bodyProfile('erkek', 0.5), f = bodyProfile('disi', 0.5);
    expect(f.up + f.down).toBeGreaterThan(1.3 * (m.up + m.down));
    expect(f.rz).toBeGreaterThan(m.rz);
    // karın sırttan daha çok bombeli (dişide), erkekte neredeyse simetrik
    expect(f.down / f.up).toBeGreaterThan(1.15);
    expect(m.down / m.up).toBeLessThan(1.1);
  });

  it('halka kapalı ve tüm yüzey noktaları sonlu', () => {
    for (const s of SEXES) {
      for (const t of [0, 0.1, 0.35, 0.6, 0.95, 1]) {
        const a = bodySurfacePoint(s, t, 0), b = bodySurfacePoint(s, t, 2 * Math.PI);
        for (let i = 0; i < 3; i++) expect(a[i]).toBeCloseTo(b[i], 9);
        for (let j = 0; j < 16; j++) expect(finite(bodySurfacePoint(s, t, (j / 16) * 2 * Math.PI))).toBe(true);
      }
    }
  });

  it('sırt noktası karından yukarıda, +z yan noktası z>0; ofset dışarı iter', () => {
    const s: Sex = 'erkek';
    const belly = bodySurfacePoint(s, 0.4, 0), back = bodySurfacePoint(s, 0.4, Math.PI);
    expect(back[1]).toBeGreaterThan(belly[1]);
    const side = bodySurfacePoint(s, 0.4, Math.PI / 2), out = bodySurfacePoint(s, 0.4, Math.PI / 2, 0.05);
    expect(side[2]).toBeGreaterThan(0);
    expect(out[2]).toBeCloseTo(side[2] + 0.05, 9);
  });

  it('burun -x, kuyruk +x yönünde', () => {
    expect(bodySurfacePoint('erkek', 0, 0)[0]).toBeCloseTo(-BODY.erkek.length / 2, 9);
    expect(bodySurfacePoint('disi', 1, 0)[0]).toBeCloseTo(BODY.disi.length / 2, 9);
  });
});

describe('yüzgeçler', () => {
  it('fanFin: ışın ve nokta sayıları, dallanma', () => {
    const base: Vec3[] = [[0, 0, 0], [0, 1, 0], [0, 2, 0]];
    const f = fanFin({ base, dir: [[1, 0, 0], [1, 0, 0], [1, 0, 0]], len: [1, 2, 3], segments: 5, branch: 0.6 });
    expect(f.rays).toHaveLength(3);
    for (const r of f.rays) expect(r).toHaveLength(6);
    expect(f.rays[2][5][0]).toBeCloseTo(3, 9);
    expect(f.branches).toHaveLength(6);
    expect(fanFin({ base, dir: [[1, 0, 0], [1, 0, 0], [1, 0, 0]], len: [1, 1, 1] }).branches).toHaveLength(0);
  });

  it('kuyruk: erkekte daha büyük delta, dişide daha küçük; ışın sayıları belirtimle uyumlu', () => {
    const m = tailFin('erkek'), f = tailFin('disi');
    expect(m.rays).toHaveLength(TAIL.erkek.rays);
    expect(f.rays).toHaveLength(TAIL.disi.rays);
    const extent = (fin: ReturnType<typeof tailFin>) => {
      const tips = fin.rays.map((r) => r[r.length - 1]);
      return { w: Math.max(...tips.map((p) => p[0])) - fin.rays[0][0][0], h: Math.max(...tips.map((p) => p[1])) - Math.min(...tips.map((p) => p[1])) };
    };
    expect(extent(m).w).toBeGreaterThan(1.5 * extent(f).w);
    expect(extent(m).h).toBeGreaterThan(1.5 * extent(f).h);
    for (const fin of [m, f]) for (const r of fin.rays) expect(r.every((p) => finite(p))).toBe(true);
  });

  it('kuyruk arka kenarı yaklaşık düşey (delta), üst ve alt ışınlar simetrik', () => {
    const fin = tailFin('erkek');
    const tips = fin.rays.map((r) => r[r.length - 1]);
    const xs = tips.map((p) => p[0]);
    expect(Math.max(...xs) - Math.min(...xs)).toBeLessThan(0.2 * (Math.max(...xs) - fin.rays[0][0][0]));
    const cy = (fin.rays[0][0][1] + fin.rays[fin.rays.length - 1][0][1]) / 2;
    const top = tips[tips.length - 1][1] - cy, bot = cy - tips[0][1];
    expect(Math.abs(top - bot) / top).toBeLessThan(0.15);
  });

  it('sırt yüzgeci erkekte daha yüksek ve daha uzun ışınlı', () => {
    const height = (s: Sex) => Math.max(...dorsalFin(s).rays.map((r) => r[r.length - 1][1] - r[0][1]));
    expect(height('erkek')).toBeGreaterThan(height('disi'));
    expect(DORSAL.erkek.lenRear).toBeGreaterThan(DORSAL.disi.lenRear);
    expect(dorsalFin('erkek').rays).toHaveLength(DORSAL.erkek.rays);
  });

  it('anal yüzgeç yalnızca dişide, gonopodium yalnızca erkekte', () => {
    expect(analFin('erkek')).toBeNull();
    expect(analFin('disi')?.rays.length).toBeGreaterThan(4);
    expect(gonopodium('disi')).toBeNull();
    const g = gonopodium('erkek')!;
    expect(g.path).toHaveLength(g.radii.length);
    // uca doğru incelir
    for (let i = 1; i < g.radii.length; i++) expect(g.radii[i]).toBeLessThan(g.radii[i - 1]);
    // karın altında, geriye doğru uzanır
    expect(g.path[g.path.length - 1][0]).toBeGreaterThan(g.path[0][0]);
  });

  it('göğüs yüzgeçleri iki yanda ayna simetrik; karın yüzgeçleri gövdenin altında', () => {
    const l = pectoralFin('erkek', 1), r = pectoralFin('erkek', -1);
    expect(l.rays.length).toBe(r.rays.length);
    for (let i = 0; i < l.rays.length; i++) {
      const a = l.rays[i][3], b = r.rays[i][3];
      expect(a[0]).toBeCloseTo(b[0], 6);
      expect(a[1]).toBeCloseTo(b[1], 6);
      expect(a[2]).toBeCloseTo(-b[2], 6);
      expect(a[2]).toBeGreaterThan(0);
    }
    const pel = pelvicFin('disi', 1);
    const bellyY = bodySurfacePoint('disi', 0.4, 0)[1];
    expect(Math.min(...pel.rays.flatMap((x) => x.map((p) => p[1])))).toBeLessThan(bellyY);
  });
});

describe('baş ayrıntıları', () => {
  it('göz başın yanında (z>0), gövde içine gömülü değil; yarıçap dişide daha büyük', () => {
    for (const s of SEXES) {
      const e = eyeSpec(s);
      expect(e.center[2]).toBeGreaterThan(0);
      expect(e.normal[2]).toBeGreaterThan(0.5);
      expect(Math.hypot(...e.normal)).toBeCloseTo(1, 6);
      expect(e.center[0]).toBeLessThan(-BODY[s].length * 0.3);
    }
    expect(eyeSpec('disi').radius).toBeGreaterThan(eyeSpec('erkek').radius);
  });

  it('solungaç kapağı kenarı gözün arkasında ve pektoral yüzgeçten önce', () => {
    const e = eyeSpec('erkek');
    const t0 = (e.center[0] / BODY.erkek.length) + 0.5;
    for (const [t] of operculumEdge()) expect(t).toBeGreaterThan(t0 + e.radius / BODY.erkek.length);
    expect(Math.max(...operculumEdge().map(([t]) => t))).toBeLessThan(0.292);
  });

  it('ağız yarığı burun ucundan başlar ve iki yanda simetrik', () => {
    const a = mouthLine('erkek', 1), b = mouthLine('erkek', -1);
    expect(a[0][0]).toBeCloseTo(bodySurfacePoint('erkek', 0.004, 1.28, 0.004)[0], 9);
    for (let i = 0; i < a.length; i++) expect(a[i][2]).toBeCloseTo(-b[i][2], 6);
  });
});

describe('yüzme dalgası', () => {
  it('baş sabit, genlik kuyruğa doğru artar ve sınırlıdır', () => {
    const L = BODY.erkek.length;
    expect(swimOffsetZ(-L / 2, L, 1.3)).toBeCloseTo(0, 12);
    let maxHead = 0, maxTail = 0;
    for (let k = 0; k < 400; k++) {
      const t = k * 0.05;
      maxHead = Math.max(maxHead, Math.abs(swimOffsetZ(-0.2 * L, L, t)));
      maxTail = Math.max(maxTail, Math.abs(swimOffsetZ(0.5 * L, L, t)));
      expect(Math.abs(swimOffsetZ(0.5 * L + 2, L, t))).toBeLessThanOrEqual(SWIM.amp * 1.8 * 1.8 + 1e-12);
    }
    expect(maxTail).toBeGreaterThan(maxHead);
  });
  it('genlik 0 ise hareket yok', () => { expect(swimOffsetZ(1, 2.7, 3, 0)).toBe(0); });
});

describe('anatomi parçaları', () => {
  it('kimlikler benzersiz; metinler dolu; wiki bağlantıları var olan dosyalar', () => {
    const ids = new Set<string>();
    for (const p of PARTS) {
      expect(ids.has(p.id)).toBe(false); ids.add(p.id);
      expect(p.ad.length).toBeGreaterThan(2);
      expect(p.ozet.length).toBeGreaterThan(10);
      expect(p.aciklama.length).toBeGreaterThan(40);
      if (p.wiki) expect(existsSync(`src/content/wiki/${p.wiki}.mdx`), p.id).toBe(true);
    }
  });
  it('talep edilen tüm anatomi parçaları var', () => {
    const want = ['agiz', 'goz', 'solungac-kapagi', 'yan-cizgi', 'pul', 'gogus-yuzgeci', 'karin-yuzgeci', 'sirt-yuzgeci', 'anal-yuzgec', 'gonopodium', 'kuyruk-sapi', 'kuyruk-yuzgeci', 'gravid-spot'];
    expect(PARTS.map((p) => p.id).sort()).toEqual([...want].sort());
  });
  it('cinsiyete özgü parçalar doğru süzülür', () => {
    const m = partsFor('erkek').map((p) => p.id), f = partsFor('disi').map((p) => p.id);
    expect(m).toContain('gonopodium'); expect(m).not.toContain('anal-yuzgec'); expect(m).not.toContain('gravid-spot');
    expect(f).toContain('anal-yuzgec'); expect(f).toContain('gravid-spot'); expect(f).not.toContain('gonopodium');
    expect(m.length).toBe(11); expect(f.length).toBe(12);
  });
  it('doğrulanması gereken (şematik) yan çizgi işaretli', () => {
    expect(PARTS.find((p) => p.id === 'yan-cizgi')?.dogrulanmali).toBe(true);
  });
  it('her görünür parçanın sonlu bir bağlantı noktası var ve model sınırları içinde', () => {
    for (const s of SEXES) {
      const anchors = partAnchors(s);
      const reach = BODY[s].length / 2 + TAIL[s].reach * 1.3;
      for (const p of partsFor(s)) {
        const a = anchors[p.id];
        expect(a, `${s}/${p.id}`).toBeDefined();
        expect(finite(a!.pos)).toBe(true);
        expect(Math.abs(a!.pos[0])).toBeLessThan(reach);
        expect(Math.abs(a!.pos[1])).toBeLessThan(2);
        if (a!.normal) expect(Math.hypot(...a!.normal)).toBeCloseTo(1, 5);
      }
      for (const p of PARTS.filter((x) => x.sex && x.sex !== s)) expect(anchors[p.id], `${s}/${p.id}`).toBeUndefined();
    }
  });
  it('göz bağlantı noktası burna, kuyruk noktası kuyruğa yakın', () => {
    const a = partAnchors('erkek');
    expect(a.goz!.pos[0]).toBeLessThan(a['kuyruk-sapi']!.pos[0]);
    expect(a['kuyruk-yuzgeci']!.pos[0]).toBeGreaterThan(a['kuyruk-sapi']!.pos[0]);
    expect(a.agiz!.pos[0]).toBeLessThan(a.goz!.pos[0]);
  });
});

describe('renk varyeteleri', () => {
  it('varyete sayısı, kimlikler benzersiz, eski beş varyete duruyor, tüm renkler geçerli', () => {
    const ids = VARIANTS.map((v) => v.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(ids.length).toBeGreaterThanOrEqual(25);
    for (const id of ['mozaik', 'cobra', 'blue-grass', 'albino', 'endler', 'full-red', 'red-tuxedo', 'moscow-blue', 'leopard', 'platinum']) expect(ids).toContain(id);
    expect(VARIANTS[0].id).toBe('mozaik');
    const adlar = VARIANTS.map((v) => v.ad);
    expect(new Set(adlar).size).toBe(adlar.length);
    for (const v of VARIANTS) {
      expect(v.id, v.id).toMatch(/^[a-z]+(-[a-z]+)*$/);
      expect(VARIANT_GROUPS as readonly string[], v.id).toContain(v.grup);
      const hex = [...Object.values(v.goz), ...Object.values(v.erkek), ...Object.values(v.disi), v.yuzgec.taban, v.yuzgec.uc, v.yuzgec.benek, ...v.vurgu];
      const layers = v.desen.flatMap((l) => ('renk' in l ? [l.renk] : []).concat('ic' in l ? [l.ic] : []).concat('renkler' in l && l.renkler ? l.renkler : []));
      for (const h of [...hex, ...layers]) expect(() => hexToRgb(h), `${v.id} ${h}`).not.toThrow();
      expect(v.aciklama.length).toBeGreaterThan(20);
      expect(v.yuzgec.opaklik).toBeGreaterThan(0.3); expect(v.yuzgec.opaklik).toBeLessThanOrEqual(1);
      if (v.metal !== undefined) { expect(v.metal).toBeGreaterThanOrEqual(0); expect(v.metal).toBeLessThanOrEqual(1); }
      if (v.maske) { expect(v.maske[0]).toBeGreaterThanOrEqual(0.2); expect(v.maske[0]).toBeLessThan(0.9); expect(v.maske[1]).toBeGreaterThan(0); expect(v.maske[1]).toBeLessThanOrEqual(1); }
      if (v.wiki) expect(existsSync(`src/content/wiki/${v.wiki}.mdx`)).toBe(true);
    }
  });
  it('dişi paletleri erkekten daha soluk (renk doygunluğu düşük)', () => {
    const chroma = (h: string) => { const c = hexToRgb(h); return Math.max(...c) - Math.min(...c); };
    for (const v of VARIANTS) {
      expect(chroma(v.disi.yan), `${v.id} yan`).toBeLessThanOrEqual(chroma(v.erkek.yan) + 0.02);
      expect(chroma(v.disi.sirt), `${v.id} sırt`).toBeLessThanOrEqual(chroma(v.erkek.sirt) + 0.05);
      expect(chroma(v.disi.yan), `${v.id} mutlak`).toBeLessThan(0.3);
    }
  });
  it('gruplama: her varyete tam bir grupta, boş grup yok', () => {
    const g = groupedVariants();
    expect(g.flatMap((x) => x.items).length).toBe(VARIANTS.length);
    for (const x of g) expect(x.items.length).toBeGreaterThan(0);
  });
  it('tüm varyeteler her iki cinsiyette gövde dokusunu hatasız boyar (sahte canvas)', async () => {
    const calls = { n: 0 };
    const ctx: any = new Proxy({}, {
      get: (t: any, k) => (k in t ? t[k] : k === 'createLinearGradient' || k === 'createRadialGradient' ? () => ({ addColorStop: () => {} }) : () => { calls.n++; }),
      set: (t: any, k, val) => { t[k] = val; return true; },
    });
    vi.stubGlobal('document', { createElement: () => ({ width: 0, height: 0, getContext: () => ctx }) });
    try {
      const { paintBody } = await import('./texture');
      for (const v of VARIANTS) for (const sex of ['erkek', 'disi'] as const) {
        const t = paintBody(v, sex, 256);
        expect(t.map.width, `${v.id} ${sex}`).toBe(256);
      }
      expect(calls.n).toBeGreaterThan(1000);
    } finally { vi.unstubAllGlobals(); }
  });
  it('hexToRgb ve bilinmeyen kimlik davranışı', () => {
    expect(hexToRgb('#ff8000')).toEqual([1, 128 / 255, 0]);
    expect(() => hexToRgb('kırmızı')).toThrow(RangeError);
    expect(variantById('yok').id).toBe('mozaik');
  });
  it('yüzgeç renkleri 0..1 aralığında; dişide daha saydam', () => {
    for (const v of VARIANTS) {
      let am = 0, af = 0, n = 0;
      for (let u = 0; u <= 1; u += 0.05) for (let s = 0; s <= 1; s += 0.05) {
        const m = finColor(v, 'erkek', 'kuyruk', u, s), f = finColor(v, 'disi', 'kuyruk', u, s);
        for (const c of [...m, ...f]) { expect(c).toBeGreaterThanOrEqual(0); expect(c).toBeLessThanOrEqual(1); }
        am += m[3]; af += f[3]; n++;
      }
      expect(af / n, v.id).toBeLessThan(am / n);
    }
  });
  it('desen deterministik: aynı girdi aynı renk; üreteç tekrarlanabilir', () => {
    const v = variantById('mozaik');
    expect(finColor(v, 'erkek', 'kuyruk', 0.4, 0.3)).toEqual(finColor(v, 'erkek', 'kuyruk', 0.4, 0.3));
    const a = mulberry32(7), b = mulberry32(7);
    for (let i = 0; i < 5; i++) { const x = a(); expect(x).toBe(b()); expect(x).toBeGreaterThanOrEqual(0); expect(x).toBeLessThan(1); }
  });
});

describe('çapa gizlenmesi (occlusion)', () => {
  it('kürenin arkasındaki nokta gizli, önündeki ve yüzeyindeki görünür', async () => {
    const { Mesh, SphereGeometry, Vector3 } = await import('three');
    const { isOccluded } = await import('./viewer');
    const m = new Mesh(new SphereGeometry(1, 24, 16)); m.updateMatrixWorld(true);
    const cam = new Vector3(0, 0, 5);
    expect(isOccluded(m, cam, new Vector3(0, 0, -1), 0.05)).toBe(true);   // arka yüzey
    expect(isOccluded(m, cam, new Vector3(0, 0, 1), 0.05)).toBe(false);   // ön yüzey
    expect(isOccluded(m, cam, new Vector3(0, 0, 1.2), 0.05)).toBe(false); // yüzeyin biraz önü
    expect(isOccluded(m, cam, new Vector3(3, 0, 0), 0.05)).toBe(false);   // yan, ışın küreyi kesmez
  });
});

describe('SVG yedeği için siluet', () => {
  it('sonlu noktalar; gravid spot yalnızca dişide; gonopodium yalnızca erkekte', () => {
    const m = silhouette('erkek'), f = silhouette('disi');
    for (const s of [m, f]) for (const poly of [s.body, s.tail, s.dorsal, s.pelvic, s.pectoral]) {
      expect(poly.length).toBeGreaterThan(4);
      expect(poly.every((p) => finite(p))).toBe(true);
    }
    expect(m.spot).toBeNull(); expect(f.spot).not.toBeNull();
    expect(m.gono.length).toBeGreaterThan(2); expect(f.gono).toHaveLength(0);
    expect(m.anal).toHaveLength(0); expect(f.anal.length).toBeGreaterThan(4);
  });
});
