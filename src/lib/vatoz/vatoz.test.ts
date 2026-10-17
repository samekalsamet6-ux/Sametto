import { describe, expect, it, vi } from 'vitest';
import {
  DISC, SEXES, SPINE, SWIM, clasper, discPoint, discRho, discSurfacePoint, discWaveY, eyeSpec, gillSlits, mouthLine, naresRing, pelvicOutline,
  silhouette, spineProfile, spineSpec, spiracleSpec, surfaceY, tailPoint, tailRadii, tailSwayZ, texUV, type Sex,
} from './model';
import { PARTS, partAnchors, partsFor } from './parts';
import { VARIANTS, VARIANT_GROUPS, groupedVariants, hexToRgb, mulberry32, tailColor, variantById } from './variants';

const finite = (v: readonly number[]) => v.every((n) => Number.isFinite(n));

describe('disk geometrisi', () => {
  it('rho: merkez 0, kenar 1; discPoint ile ters dönüşüm tutarlı', () => {
    for (const s of SEXES) {
      expect(discRho(s, 0, 0)).toBeCloseTo(0, 9);
      for (let i = 0; i < 48; i++) {
        const psi = (i / 48) * Math.PI * 2;
        const [x, z] = discPoint(s, 1, psi);
        expect(discRho(s, x, z), `${s} ${i}`).toBeCloseTo(1, 6);
        const [x2, z2] = discPoint(s, 0.5, psi);
        expect(discRho(s, x2, z2)).toBeCloseTo(0.5, 6);
      }
    }
  });
  it('disk burun -x yönünde, yaklaşık yuvarlak: genişlik uzunluğa yakın; burun tarafı daha dar', () => {
    for (const s of SEXES) {
      const nose = discPoint(s, 1, Math.PI), tail = discPoint(s, 1, 0);
      expect(nose[0]).toBeLessThan(0); expect(tail[0]).toBeGreaterThan(0);
      const w = discPoint(s, 1, Math.PI / 2)[1] * 2, len = tail[0] - nose[0];
      expect(w / len).toBeGreaterThan(0.85); expect(w / len).toBeLessThan(1.25);
      // burna yakın kesit, kuyruğa yakın kesitten daha dar
      const half = (x: number) => { let m = 0; for (let i = 0; i < 360; i++) { const [px, pz] = discPoint(s, 1, (i / 360) * Math.PI * 2); if (Math.abs(px - x) < 0.02) m = Math.max(m, Math.abs(pz)); } return m; };
      expect(half(-0.7)).toBeLessThan(half(0.7));
    }
  });
  it('üst ve alt yüz kenarda birleşir; üst yüz her yerde alttan yüksek; merkezde en kalın', () => {
    for (const s of SEXES) {
      for (let i = 0; i < 24; i++) {
        const [x, z] = discPoint(s, 1, (i / 24) * Math.PI * 2);
        expect(surfaceY(s, 'ust', x, z)).toBeCloseTo(0, 6);
        expect(surfaceY(s, 'alt', x, z)).toBeCloseTo(0, 6);
      }
      for (const r of [0.2, 0.5, 0.8]) for (let i = 0; i < 24; i++) {
        const [x, z] = discPoint(s, r, (i / 24) * Math.PI * 2);
        expect(surfaceY(s, 'ust', x, z)).toBeGreaterThan(surfaceY(s, 'alt', x, z));
        expect(surfaceY(s, 'ust', x, z)).toBeGreaterThanOrEqual(0);
        expect(surfaceY(s, 'alt', x, z)).toBeLessThanOrEqual(0);
      }
      const peak = surfaceY(s, 'ust', -0.25, 0);
      expect(peak).toBeGreaterThan(surfaceY(s, 'ust', 0.7, 0)); expect(peak).toBeGreaterThan(surfaceY(s, 'ust', -0.25, 0.8));
      // yassı: en kalın nokta disk genişliğinin %20'sinden azdır
      expect((peak - surfaceY(s, 'alt', -0.25, 0)) / (2 * DISC[s].b)).toBeLessThan(0.2);
    }
  });
  it('dişi diski erkekten biraz büyük ve dolgun', () => {
    expect(DISC.disi.aB + DISC.disi.aF).toBeGreaterThan(DISC.erkek.aB + DISC.erkek.aF);
    expect(surfaceY('disi', 'ust', -0.25, 0)).toBeGreaterThan(surfaceY('erkek', 'ust', -0.25, 0));
  });
  it('discSurfacePoint ofseti dışarı iter; texUV 0..1 aralığında', () => {
    const a = discSurfacePoint('disi', 'ust', 0.4, 1, 0), b = discSurfacePoint('disi', 'ust', 0.4, 1, 0.05);
    expect(b[1] - a[1]).toBeCloseTo(0.05, 9);
    const c = discSurfacePoint('disi', 'alt', 0.4, 1, 0.05);
    expect(c[1]).toBeLessThan(discSurfacePoint('disi', 'alt', 0.4, 1, 0)[1]);
    for (const s of SEXES) for (let i = 0; i < 32; i++) { const [u, v] = texUV(...discPoint(s, 1, (i / 32) * Math.PI * 2)); expect(u).toBeGreaterThan(0); expect(u).toBeLessThan(1); expect(v).toBeGreaterThan(0); expect(v).toBeLessThan(1); }
  });
});

describe('baş ve alt yüz ayrıntıları', () => {
  it('gözler üst yüzde, burna yakın, iki yanda simetrik, spirakül gözün hemen arkasında', () => {
    for (const s of SEXES) {
      const l = eyeSpec(s, 1), r = eyeSpec(s, -1);
      expect(l.center[2]).toBeCloseTo(-r.center[2], 9);
      expect(l.center[1]).toBeGreaterThan(surfaceY(s, 'ust', l.center[0], l.center[2]));
      expect(l.normal[1]).toBeGreaterThan(0.6);
      expect(Math.hypot(...l.normal)).toBeCloseTo(1, 6);
      expect(l.center[0]).toBeLessThan(-0.4);
      const sp = spiracleSpec(s, 1);
      expect(sp.center[0]).toBeGreaterThan(l.center[0]); // arkasında
      expect(sp.center[0] - l.center[0]).toBeLessThan(0.3);
      expect(Math.abs(sp.center[2])).toBeGreaterThanOrEqual(Math.abs(l.center[2]) * 0.9);
    }
  });
  it('ağız alt yüzde ve iki yana simetrik; burun delikleri ağzın önünde; 5 çift solungaç yarığı ağzın arkasında alt yüzde', () => {
    for (const s of SEXES) {
      const m = mouthLine(s);
      for (const p of m) expect(p[1]).toBeLessThanOrEqual(surfaceY(s, 'alt', p[0], p[2]) + 1e-9);
      expect(m[0][2]).toBeCloseTo(-m[m.length - 1][2], 9);
      const mx = Math.max(...m.map((p) => p[0]));
      for (const side of [1, -1] as const) {
        expect(naresRing(s, side).every((p) => p[0] < Math.min(...m.map((q) => q[0])))).toBe(true);
        const gs = gillSlits(s, side);
        expect(gs).toHaveLength(5);
        for (const slit of gs) { expect(slit.every((p) => finite(p) && p[0] > mx - 0.1)).toBe(true); expect(slit[0][1]).toBeLessThan(0.001); }
        // slitler geriye doğru sıralı
        for (let i = 1; i < 5; i++) expect(gs[i][3][0]).toBeGreaterThan(gs[i - 1][3][0]);
      }
    }
  });
  it('pelvik yüzgeç arka disk kenarından taşar; klasper yalnızca erkekte, uca doğru incelir ve geriye uzanır', () => {
    for (const s of SEXES) {
      const out = pelvicOutline(s, 1);
      const maxX = Math.max(...out.map((p) => p[0]));
      expect(maxX).toBeGreaterThan(discPoint(s, 1, 0)[0]);
      expect(out.every((p) => p[1] > -0.05)).toBe(true);
      const l = pelvicOutline(s, -1);
      expect(l[0][1]).toBeCloseTo(-out[0][1], 1);
    }
    expect(clasper('disi', 1)).toBeNull();
    for (const side of [1, -1] as const) {
      const c = clasper('erkek', side)!;
      expect(c.path).toHaveLength(c.radii.length);
      for (let i = 1; i < c.radii.length; i++) expect(c.radii[i]).toBeLessThan(c.radii[i - 1]);
      expect(c.path[c.path.length - 1][0]).toBeGreaterThan(c.path[0][0]);
      expect(Math.sign(c.path[2][2])).toBe(side);
      expect(c.path.every((p) => p[1] < 0)).toBe(true); // alt yüzde
    }
  });
});

describe('kuyruk ve diken', () => {
  it('kuyruk disk gerisine uzanır, uca doğru incelir, uzunluğu disk genişliğiyle aynı mertebede', () => {
    for (const s of SEXES) {
      const a = tailPoint(s, 0), b = tailPoint(s, 1);
      expect(a[0]).toBeLessThan(DISC[s].aB); // diske gömülü başlar
      expect(b[0]).toBeGreaterThan(DISC[s].aB + 0.8);
      expect(finite(b)).toBe(true);
      for (let i = 1; i <= 10; i++) { const r0 = tailRadii((i - 1) / 10), r1 = tailRadii(i / 10); expect(r1.rz).toBeLessThan(r0.rz); expect(r1.ry).toBeLessThan(r0.ry); }
      expect(tailRadii(0).rz).toBeGreaterThan(tailRadii(0).ry); // dibi yassı
    }
  });
  it('diken kuyruğun üstünde, geriye doğru ve hafif yukarı bakar; dişli kenar (profil dalgalı) ve uca doğru sivrilir', () => {
    for (const s of SEXES) {
      const sp = spineSpec(s);
      expect(sp.base[1]).toBeGreaterThan(tailPoint(s, 0.25)[1]);
      expect(sp.dir[0]).toBeGreaterThan(0.9); expect(sp.dir[1]).toBeGreaterThan(0);
      expect(Math.hypot(...sp.dir)).toBeCloseTo(1, 9);
      expect(sp.length).toBeCloseTo(SPINE.length, 9);
    }
    const pr = spineProfile();
    expect(pr).toHaveLength(SPINE.teeth * 2 + 1);
    expect(pr[pr.length - 1].w).toBe(0);
    let teeth = 0;
    for (let i = 1; i < pr.length - 1; i++) if (pr[i].w > pr[i - 1].w * 0.99 && pr[i].w > pr[i + 1].w) teeth++; // yerel tepeler
    expect(teeth).toBeGreaterThanOrEqual(SPINE.teeth - 1);
    expect(pr[0].w).toBeCloseTo(SPINE.baseWidth / 2, 9);
  });
});

describe('yüzme dalgası', () => {
  it('merkezde sabit, kenarda en büyük; genlik sınırlı; genlik 0 ise hareket yok', () => {
    let mid = 0, edge = 0;
    for (let k = 0; k < 400; k++) {
      const t = k * 0.05;
      mid = Math.max(mid, Math.abs(discWaveY(0.3, 0.1, t)));
      edge = Math.max(edge, Math.abs(discWaveY(0.3, 1, t)));
      expect(Math.abs(discWaveY(0.9, 1.5, t))).toBeLessThanOrEqual(SWIM.amp + 1e-12); // rho 1'e kırpılır
    }
    expect(edge).toBeGreaterThan(10 * mid);
    expect(discWaveY(0.5, 1, 3, 0)).toBe(0);
  });
  it('dalga öne-arkaya ilerler: sabit fazda x arttıkça zaman ilerleyince tepe x yönünde kayar', () => {
    const peakX = (t: number) => { let best = -9, bx = 0; for (let x = -1; x <= 1; x += 0.005) { const v = discWaveY(x, 1, t); if (v > best) { best = v; bx = x; } } return bx; };
    const x0 = peakX(0.2), x1 = peakX(0.25);
    expect(x1).toBeGreaterThan(x0);
  });
  it('kuyruk sallanması uca doğru artar, kökte 0', () => {
    expect(tailSwayZ(0, 1.2)).toBeCloseTo(0, 12);
    let a = 0, b = 0;
    for (let k = 0; k < 400; k++) { a = Math.max(a, Math.abs(tailSwayZ(0.3, k * 0.05))); b = Math.max(b, Math.abs(tailSwayZ(1, k * 0.05))); }
    expect(b).toBeGreaterThan(a);
    expect(Math.abs(tailSwayZ(1, 2, 0))).toBe(0);
  });
});

describe('anatomi parçaları', () => {
  it('kimlikler benzersiz; metinler dolu', () => {
    const ids = new Set<string>();
    for (const p of PARTS) {
      expect(ids.has(p.id)).toBe(false); ids.add(p.id);
      expect(p.ad.length).toBeGreaterThan(2);
      expect(p.ozet.length).toBeGreaterThan(10);
      expect(p.aciklama.length).toBeGreaterThan(60);
    }
  });
  it('istenen tüm parçalar var; cinsiyete özgü süzme (klasper yalnızca erkekte)', () => {
    const want = ['disk', 'disk-kenari', 'burun-ucu', 'goz', 'spirakul', 'desen', 'agiz', 'burun-delikleri', 'solungac-yarigi', 'pelvik-yuzgec', 'klasper', 'kuyruk', 'kuyruk-dikeni'];
    expect(PARTS.map((p) => p.id).sort()).toEqual([...want].sort());
    expect(partsFor('erkek').map((p) => p.id)).toContain('klasper');
    expect(partsFor('disi').map((p) => p.id)).not.toContain('klasper');
    expect(partsFor('erkek')).toHaveLength(13); expect(partsFor('disi')).toHaveLength(12);
  });
  it('kuyruk dikeni güvenlik uyarısı içerir ve doğrulanmalı işaretli; tıbbi yardım vurgusu var', () => {
    const p = PARTS.find((x) => x.id === 'kuyruk-dikeni')!;
    expect(p.uyari).toBe(true); expect(p.dogrulanmali).toBe(true);
    expect(p.aciklama).toMatch(/tıbbi yardım/);
    expect(p.aciklama).toMatch(/zehir/);
  });
  it('üst yüz / alt yüz işaretleri anatomiyle uyumlu', () => {
    const yuz = (id: string) => PARTS.find((p) => p.id === id)!.yuz;
    for (const id of ['goz', 'spirakul', 'desen', 'burun-ucu', 'kuyruk-dikeni']) expect(yuz(id)).toBe('ust');
    for (const id of ['agiz', 'burun-delikleri', 'solungac-yarigi']) expect(yuz(id)).toBe('alt');
  });
  it('bağlantı noktaları: sonlu, yüz yönüyle uyumlu normal; üst parçalar üst yüzde, alt parçalar alt yüzde', () => {
    for (const s of SEXES) {
      const anchors = partAnchors(s);
      for (const p of partsFor(s)) {
        const a = anchors[p.id];
        expect(a, `${s}/${p.id}`).toBeDefined();
        expect(finite(a!.pos)).toBe(true);
        expect(a!.rho).toBeGreaterThanOrEqual(0); expect(a!.rho).toBeLessThanOrEqual(1);
        if (a!.normal) {
          expect(Math.hypot(...a!.normal)).toBeCloseTo(1, 5);
          if (p.yuz === 'ust') expect(a!.normal[1], `${s}/${p.id}`).toBeGreaterThan(0);
          if (p.yuz === 'alt') expect(a!.normal[1], `${s}/${p.id}`).toBeLessThan(0);
        } else expect(p.yuz).toBe('her');
        if (p.yuz === 'alt') expect(a!.pos[1], `${s}/${p.id}`).toBeLessThan(0);
      }
      for (const p of PARTS.filter((x) => x.sex && x.sex !== s)) expect(anchors[p.id]).toBeUndefined();
    }
  });
  it('ön-arka sıralama: burun < göz < spirakül < pelvik < kuyruk dikeni < kuyruk', () => {
    const a = partAnchors('disi');
    expect(a['burun-ucu']!.pos[0]).toBeLessThan(a.goz!.pos[0]);
    expect(a.goz!.pos[0]).toBeLessThan(a.spirakul!.pos[0]);
    expect(a.spirakul!.pos[0]).toBeLessThan(a['pelvik-yuzgec']!.pos[0]);
    expect(a['kuyruk-dikeni']!.pos[0]).toBeLessThan(a.kuyruk!.pos[0]);
    expect(a.agiz!.pos[0]).toBeLessThan(a['solungac-yarigi']!.pos[0]);
  });
});

describe('varyeteler', () => {
  it('kimlikler/adlar benzersiz; gruplar geçerli; tüm renkler geçerli; açıklamalar doğruluk uyarısı taşır', () => {
    const ids = VARIANTS.map((v) => v.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(new Set(VARIANTS.map((v) => v.ad)).size).toBe(ids.length);
    expect(ids.length).toBeGreaterThanOrEqual(5);
    expect(VARIANTS[0].id).toBe('motoro');
    for (const v of VARIANTS) {
      expect(v.id).toMatch(/^[a-z]+(-[a-z]+)*$/);
      expect(VARIANT_GROUPS as readonly string[]).toContain(v.grup);
      const hex = [...Object.values(v.goz), v.sirt.merkez, v.sirt.kenar, v.karin.orta, v.karin.kenar, v.kuyruk.taban, v.kuyruk.uc, v.diken];
      const layers = v.desen.flatMap((l) => ('renk' in l ? [l.renk] : []).concat('ic' in l ? [l.ic, l.halka] : []));
      for (const h of [...hex, ...layers]) expect(() => hexToRgb(h), `${v.id} ${h}`).not.toThrow();
      expect(v.aciklama).toMatch(/Şematik|şematik/);
      expect(v.desen.length).toBeGreaterThan(0);
      for (const l of v.desen) expect(l.rho[0]).toBeLessThan(l.rho[1]), expect(l.rho[1]).toBeLessThanOrEqual(1);
    }
  });
  it('kaynakla desteklenen türler doğrulanmalı değil; belirsiz adlar ve albino işaretli; "cüce" varsayımı yok', () => {
    for (const id of ['motoro', 'leopoldi', 'wallacei']) expect(variantById(id).dogrulanmali, id).toBe(false);
    for (const id of ['retikule', 'marmorlu', 'albino']) expect(variantById(id).dogrulanmali, id).toBe(true);
    for (const v of VARIANTS) expect(`${v.ad} ${v.aciklama}`, v.id).not.toMatch(/cüce/i);
    expect(variantById('leopoldi').aciklama).toMatch(/Black Diamond/);
    expect(variantById('wallacei').aciklama).toMatch(/hystrix/);
    expect(variantById('albino').goz.iris).not.toBe(variantById('motoro').goz.iris);
  });
  it('gruplama ve bilinmeyen kimlik davranışı', () => {
    const g = groupedVariants();
    expect(g.flatMap((x) => x.items).length).toBe(VARIANTS.length);
    for (const x of g) expect(x.items.length).toBeGreaterThan(0);
    expect(variantById('yok').id).toBe('motoro');
    expect(hexToRgb('#ff8000')).toEqual([1, 128 / 255, 0]);
    expect(() => hexToRgb('kırmızı')).toThrow(RangeError);
  });
  it('kuyruk rengi 0..1; dibinden ucuna koyulaşır; üreteç deterministik', () => {
    for (const v of VARIANTS) for (let u = 0; u <= 1; u += 0.05) for (const c of tailColor(v, u)) { expect(c).toBeGreaterThanOrEqual(0); expect(c).toBeLessThanOrEqual(1); }
    const v = variantById('wallacei');
    const lum = (c: number[]) => c[0] + c[1] + c[2];
    expect(lum(tailColor(v, 0.95))).toBeLessThan(lum(tailColor(v, 0)));
    const a = mulberry32(7), b = mulberry32(7);
    for (let i = 0; i < 5; i++) { const x = a(); expect(x).toBe(b()); expect(x).toBeGreaterThanOrEqual(0); expect(x).toBeLessThan(1); }
  });
  it('tüm varyeteler her iki cinsiyette dokuyu hatasız boyar (sahte canvas)', async () => {
    const calls = { n: 0 };
    const ctx: any = new Proxy({}, {
      get: (t: any, k) => (k in t ? t[k] : k === 'createLinearGradient' || k === 'createRadialGradient' ? () => ({ addColorStop: () => {} }) : () => { calls.n++; }),
      set: (t: any, k, val) => { t[k] = val; return true; },
    });
    vi.stubGlobal('document', { createElement: () => ({ width: 0, height: 0, getContext: () => ctx }) });
    try {
      const { paintBody } = await import('./texture');
      for (const v of VARIANTS) for (const sex of ['erkek', 'disi'] as Sex[]) {
        const t = paintBody(v, sex, 256);
        expect(t.dorsal.width, `${v.id} ${sex}`).toBe(256);
        expect(t.ventral.height).toBe(256);
      }
      expect(calls.n).toBeGreaterThan(1000);
    } finally { vi.unstubAllGlobals(); }
  });
});

describe('SVG yedeği için siluet', () => {
  it('sonlu noktalar; klasper yalnızca erkekte; iki göz, iki spirakül, 10 solungaç yarığı', () => {
    for (const s of SEXES) {
      const sil = silhouette(s);
      for (const poly of [sil.disc, sil.tail, sil.mouth, ...sil.pelvic, ...sil.spiracles, ...sil.gills]) { expect(poly.length).toBeGreaterThan(3); expect(poly.every((p) => finite(p))).toBe(true); }
      expect(sil.eyes).toHaveLength(2); expect(sil.spiracles).toHaveLength(2); expect(sil.gills).toHaveLength(10); expect(sil.nares).toHaveLength(2);
      expect(sil.claspers).toHaveLength(s === 'erkek' ? 2 : 0);
      expect(sil.tail[sil.tail.length - 1][0]).toBeGreaterThan(sil.disc.reduce((m, p) => Math.max(m, p[0]), -9));
    }
  });
});
