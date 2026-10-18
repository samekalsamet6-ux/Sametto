// createFishGroup: 12 türün renderer'sız, paylaşımlı balık grupları (sahte canvas + başsız three nesneleri).
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { Box3, PerspectiveCamera, Vector3, type Mesh, type MeshStandardMaterial } from 'three';
import type { FishGroup, FishLod, SexId, SpeciesModule } from './types';
import { countObject, groupCacheHas, groupCacheStats, sortFishGroups } from './fishgroup';
import { species as lepistes } from '../guppy';
import { species as molly } from '../molly';
import { species as platy } from '../platy';
import { species as betta } from '../betta';
import { species as neon } from '../neon';
import { species as corydoras } from '../corydoras';
import { species as japon } from '../japon';
import { species as pleco } from '../pleco';
import { species as melek } from '../melek';
import { species as diskus } from '../diskus';
import { species as vatoz } from '../vatoz';
import { species as karides } from '../karides';
import { species as kilickuyruk } from '../kilickuyruk';
import { species as gurami } from '../gurami';
import { species as kaplanbarb } from '../kaplanbarb';
import { species as zebradanio } from '../zebradanio';
import { species as kardinal } from '../kardinal';
import { species as ram } from '../ram';

const ALL: SpeciesModule[] = [lepistes, molly, platy, betta, neon, corydoras, japon, pleco, melek, diskus, vatoz, karides, kilickuyruk, gurami, kaplanbarb, zebradanio, kardinal, ram];
const byId = (id: string) => ALL.find((s) => s.id === id)!;

/**
 * BÜTÇELER (ölçülen en kötü değerin üstünde, bilinçli paylı tavanlar).
 * 'low' = tank sahnesi ayrıntı düzeyi; üçgen sayısı tür başına, tüm formlar ve iki cinsiyet için en büyük değer üzerinden ölçülür.
 * Ölçümler (düşük): bkz. dosya sonundaki rapor testi (FISHGROUP_REPORT=dosya ile yazılır) ve final raporu.
 */
export const LOW_TRIANGLES: Record<string, number> = {
  lepistes: 7500, molly: 7500, platy: 7000, betta: 3800, neon: 3200, corydoras: 3800, japon: 10500, pleco: 9800, melek: 4000, diskus: 4000, vatoz: 10000, karides: 9000, kilickuyruk: 7500, gurami: 3900, kaplanbarb: 4200, zebradanio: 4200, kardinal: 4300, ram: 4600,
};
/** 12 karışık balık (her tür bir kez), düşük ayrıntı: toplam üçgen, çizim çağrısı ve benzersiz doku pikseli tavanı */
export const TANK_LOW = { triangles: 70_000, drawCalls: 650, texturePixels: 2_500_000 };
/** Aynı 12 balık, normal ayrıntı */
export const TANK_NORMAL = { triangles: 280_000, drawCalls: 650, texturePixels: 8_000_000 };

/** Sahte canvas: boyama çağrıları hatasız çalışır; piksel tamponu isteyen çağrılara tampon verir. `made` yaratılan canvas sayısıdır. */
const canvasCalls = { made: 0 };
function fakeCanvas() {
  canvasCalls.made++;
  const ctx: any = new Proxy({}, {
    get: (t: any, k) => {
      if (k in t) return t[k];
      if (k === 'createLinearGradient' || k === 'createRadialGradient' || k === 'createConicGradient') return () => ({ addColorStop: () => {} });
      if (k === 'createImageData' || k === 'getImageData') return (w: number, h: number) => ({ width: w, height: h, data: new Uint8ClampedArray(w * h * 4) });
      if (k === 'measureText') return () => ({ width: 10 });
      if (k === 'createPattern') return () => ({});
      return () => {};
    },
    set: (t: any, k, v) => { t[k] = v; return true; },
  });
  return { width: 0, height: 0, getContext: () => ctx };
}

beforeAll(() => { vi.stubGlobal('document', { createElement: () => fakeCanvas() }); });
const live: FishGroup[] = [];
afterEach(() => {
  const leaked = groupCacheStats().entries;
  live.splice(0).forEach((g) => g.dispose()); // bir test düşse de diğerleri etkilenmesin
  expect(leaked, 'her test kurduğu grupları dispose etmeli').toBe(0);
});

const pick = <T,>(a: T[], n: number): T[] => {
  if (a.length <= n) return a;
  const out: T[] = [];
  for (let i = 0; i < n; i++) out.push(a[Math.round((i * (a.length - 1)) / (n - 1))]);
  return out;
};
const make = (sp: SpeciesModule, sex: SexId, form: string | undefined, variant: string, lod: FishLod = 'low', reducedMotion = false): FishGroup => {
  const g = sp.createFishGroup!({ sex, form, variant, reducedMotion, lod });
  live.push(g);
  return g;
};

const REPORT: string[] = [];

describe('createFishGroup sözleşmesi', () => {
  it('on sekiz türün hepsi createFishGroup sağlar', () => {
    expect(ALL.map((s) => s.id).sort()).toEqual(['betta', 'corydoras', 'diskus', 'gurami', 'japon', 'kaplanbarb', 'kardinal', 'karides', 'kilickuyruk', 'lepistes', 'melek', 'molly', 'neon', 'platy', 'pleco', 'ram', 'vatoz', 'zebradanio']);
    for (const sp of ALL) expect(typeof sp.createFishGroup, sp.id).toBe('function');
  });
});

describe.each(ALL.map((s) => [s.id, s] as const))('balık grubu: %s', (_id, sp) => {
  const forms = (sp.forms?.map((f) => f.id) ?? [undefined]) as (string | undefined)[];
  const variants = sp.variants.map((v) => v.id);

  for (const sex of sp.sexes.map((s) => s.id)) {
    it(`${sex}: örnek form ve varyeteler kurulur; yönelim, boyut, animasyon, dispose`, () => {
      const made: FishGroup[] = [];
      for (const lod of ['low', 'normal'] as const) {
        for (const form of lod === 'low' ? pick(forms, 3) : pick(forms, 1)) for (const variant of lod === 'low' ? pick(variants, 3) : pick(variants, 1)) {
          const g = make(sp, sex, form, variant, lod);
          made.push(g);
          expect(g.boundingRadius).toBeGreaterThan(0.3);
          expect(g.boundingRadius).toBeLessThan(2.5);
          const c = countObject(g.object);
          expect(c.triangles).toBeGreaterThan(500);
          expect(g.budget.triangles).toBe(c.triangles);
          expect(g.budget.drawCalls).toBe(c.drawCalls);
          expect(g.budget.key.startsWith(`${sp.id}|`) && g.budget.key.endsWith(`|${variant}|${sex}|${lod}`), g.budget.key).toBe(true);
          g.object.updateMatrixWorld(true);
          const size = new Box3().setFromObject(g.object).getSize(new Vector3());
          // gövde ~1 birim; yüzgeç/anten dahil kutu makul aralıkta, balık uzunlamasına +X boyunca (vatoz hariç: disk yassı)
          expect(size.x, `${sp.id} x boyu`).toBeGreaterThan(0.9);
          expect(size.x).toBeLessThan(2.6);
          expect(size.y).toBeLessThan(2.6);
          expect(size.z).toBeLessThan(2.6);
          // burun +X: kütle merkezi burnu (kutunun +X ucuna yakın) değil kuyruğu uzun bırakır; en az uzunluk +X'te büyük olmalı
          const box = new Box3().setFromObject(g.object);
          expect(box.max.x + box.min.x, 'orijin gövde merkezinde: kutu yaklaşık simetrik').toBeGreaterThan(-1.6);
          for (let i = 0; i < 6; i++) g.update(0.016);
          g.update(0.016, 3.3);
          g.update(0.016, 3.3 + 0.7);
          if (lod === 'low') REPORT.push(`${sp.id}\t${sex}\t${form ?? '-'}\t${variant}\t${c.triangles}\t${c.drawCalls}\t${g.budget.texturePixels}\t${g.boundingRadius.toFixed(2)}\t${size.x.toFixed(2)}`);
        }
      }
      made.forEach((g) => g.dispose());
      expect(groupCacheStats().entries).toBe(0);
    }, 90_000);
  }

  it('düşük ayrıntı: tüm formlar ve cinsiyetler için üçgen bütçesi, normalden belirgin az', () => {
    let worst = 0;
    for (const sex of sp.sexes.map((s) => s.id)) for (const form of forms) {
      const low = make(sp, sex, form, variants[0], 'low');
      worst = Math.max(worst, low.budget.triangles);
      expect(low.budget.texturePixels).toBeLessThanOrEqual(1_300_000);
      if (form === forms[0]) {
        const normal = make(sp, sex, form, variants[0], 'normal');
        expect(low.budget.triangles, `${sp.id} ${sex} düşük/normal`).toBeLessThan(normal.budget.triangles * 0.6);
        expect(low.budget.texturePixels).toBeLessThan(normal.budget.texturePixels);
        normal.dispose();
      }
      low.dispose();
    }
    REPORT.push(`WORST\t${sp.id}\t${worst}`);
    expect(worst, `${sp.id} düşük üçgen bütçesi`).toBeLessThanOrEqual(LOW_TRIANGLES[sp.id]);
  }, 120_000);

  it('hareket azaltma: animasyon yok, nesne yine kurulur', () => {
    const g = make(sp, sp.sexes[0].id, forms[0], variants[0], 'low', true);
    const before = g.object.matrixWorld.elements.slice();
    g.update(1, 5);
    g.object.updateMatrixWorld(true);
    expect(g.object.matrixWorld.elements).toEqual(before);
    g.dispose();
  });
});

describe('paylaşım ve referans sayımı', () => {
  it('aynı anahtar: geometri ve doku paylaşılır, ikinci balık yeni canvas üretmez', () => {
    const sp = byId('betta');
    const a = make(sp, 'erkek', 'plakat', sp.variants[0].id);
    const made = canvasCalls.made;
    const b = make(sp, 'erkek', 'plakat', sp.variants[0].id);
    expect(canvasCalls.made, 'ikinci balık doku boyamaz').toBe(made);
    expect(groupCacheStats().entries).toBe(1);
    expect(groupCacheStats().refs).toBe(2);
    const meshes = (g: FishGroup) => { const l: Mesh[] = []; g.object.traverse((o) => { if ((o as Mesh).isMesh) l.push(o as Mesh); }); return l; };
    const ma = meshes(a), mb = meshes(b);
    expect(mb.length).toBe(ma.length);
    // paylaşılan geometri ve doku
    expect(mb.filter((m, i) => m.geometry === ma[i].geometry).length).toBeGreaterThan(ma.length * 0.8);
    const mapOf = (m: Mesh) => (m.material as MeshStandardMaterial).map;
    expect(mapOf(mb[0])).toBe(mapOf(ma[0]));
    expect(mapOf(ma[0])).toBeTruthy();
    // ama yüzme malzemesi balık başınadır (farklı faz): aynı nesne değil
    expect(mb[0].material).not.toBe(ma[0].material);
    expect(a.object).not.toBe(b.object);
    a.dispose(); b.dispose();
  });

  it('farklı anahtar (cinsiyet, form, varyete, ayrıntı) ayrı şablon üretir', () => {
    const sp = byId('betta');
    const gs = [
      make(sp, 'erkek', 'plakat', sp.variants[0].id), make(sp, 'disi', 'plakat', sp.variants[0].id),
      make(sp, 'erkek', 'halfmoon', sp.variants[0].id), make(sp, 'erkek', 'plakat', sp.variants[1].id), make(sp, 'erkek', 'plakat', sp.variants[0].id, 'normal'),
    ];
    expect(groupCacheStats().entries).toBe(5);
    gs.forEach((g) => g.dispose());
  });

  it('dispose: son kullanıcı bırakınca paylaşımlı geometri, malzeme ve doku serbest kalır', () => {
    const sp = byId('neon');
    const a = make(sp, 'erkek', undefined, sp.variants[0].id), b = make(sp, 'erkek', undefined, sp.variants[0].id);
    const key = a.budget.key;
    const geos = new Set<any>(), texs = new Set<any>();
    a.object.traverse((o) => {
      const m = o as Mesh;
      if (!m.isMesh) return;
      geos.add(m.geometry);
      for (const k of ['map', 'bumpMap', 'emissiveMap'] as const) { const t = (m.material as any)[k]; if (t) texs.add(t); }
    });
    expect(geos.size).toBeGreaterThan(5);
    expect(texs.size).toBeGreaterThan(2);
    const geoDisposed = vi.fn(), texDisposed = vi.fn();
    geos.forEach((g) => g.addEventListener('dispose', geoDisposed));
    texs.forEach((t) => t.addEventListener('dispose', texDisposed));
    expect(groupCacheHas(key)).toBe(true);
    a.dispose();
    expect(groupCacheHas(key), 'ikinci kullanıcı varken önbellek durur').toBe(true);
    expect(geoDisposed).not.toHaveBeenCalled();
    expect(texDisposed).not.toHaveBeenCalled();
    a.dispose(); // ikinci dispose zararsız (referans bir kez düşer)
    expect(groupCacheHas(key)).toBe(true);
    b.dispose();
    expect(groupCacheHas(key)).toBe(false);
    expect(geoDisposed.mock.calls.length).toBeGreaterThanOrEqual(geos.size);
    expect(texDisposed.mock.calls.length).toBeGreaterThanOrEqual(texs.size);
    expect(groupCacheStats()).toMatchObject({ entries: 0, refs: 0, triangles: 0, texturePixels: 0 });
  });

  it('dispose sonrası aynı anahtar yeniden kurulabilir ve nesne sahneden çıkar', () => {
    const sp = byId('lepistes');
    const parent = new PerspectiveCamera();
    const a = make(sp, 'erkek', undefined, sp.variants[0].id);
    parent.add(a.object);
    expect(a.object.parent).toBe(parent);
    a.dispose();
    expect(a.object.parent).toBeNull();
    a.update(0.1); // dispose sonrası güvenli
    const b = make(sp, 'erkek', undefined, sp.variants[0].id);
    expect(b.boundingRadius).toBeGreaterThan(0);
    b.dispose();
  });
});

describe('animasyon (yüzme, çene, solungaç, eklemler)', () => {
  it('yüzme zamanı balık başınadır: aynı şablondan iki balık bağımsız fazda', () => {
    const sp = byId('melek');
    const a = make(sp, 'erkek', undefined, sp.variants[0].id), b = make(sp, 'erkek', undefined, sp.variants[0].id);
    const uni = (g: FishGroup) => { let u: any = null; g.object.traverse((o) => { const m = o as Mesh; if (!u && m.isMesh) { const mat: any = m.material; const sh: any = { uniforms: {}, vertexShader: '#include <common>\n#include <begin_vertex>' }; mat.onBeforeCompile(sh, {}); u = sh.uniforms; } }); return u; };
    const ua = uni(a), ub = uni(b);
    a.update(0.016, 1.0); b.update(0.016, 2.5);
    expect(ua.uTime.value).toBe(1.0);
    expect(ub.uTime.value).toBe(2.5);
    expect(ua.uAmp.value).toBeGreaterThan(0);
    expect(ua.uTime).not.toBe(ub.uTime);
    a.update(0.5); // dt biriktirilir
    expect(ua.uTime.value).toBeCloseTo(1.5, 6);
    a.dispose(); b.dispose();
  });

  it('karides: eklem animasyonu kopyaya aktarılır, balıklar bağımsız oynar', () => {
    const sp = byId('karides');
    const a = make(sp, 'erkek', undefined, sp.variants[0].id, 'normal'), b = make(sp, 'erkek', undefined, sp.variants[0].id, 'normal');
    const snap = (g: FishGroup) => { const l: number[] = []; g.object.traverse((o) => l.push(o.rotation.x, o.rotation.y, o.rotation.z)); return l; };
    const a0 = snap(a);
    a.update(0.016, 0.9);
    b.update(0.016, 2.1);
    const a1 = snap(a), b1 = snap(b);
    expect(a1.some((x, i) => Math.abs(x - a0[i]) > 1e-4), 'antenler/bacaklar oynar').toBe(true);
    expect(b1.some((x, i) => Math.abs(x - a1[i]) > 1e-4), 'farklı fazda farklı poz').toBe(true);
    a.dispose(); b.dispose();
  });

  it('neon (normal): çene ve solungaç matrisleri her kopyada ayrı oynar; low düzeyinde yüz animasyonu atlanır', () => {
    const sp = byId('neon');
    const frozen = (g: FishGroup) => { const l: number[][] = []; g.object.traverse((o) => { if (!o.matrixAutoUpdate) l.push(Array.from(o.matrix.elements)); }); return l; };
    const a = make(sp, 'erkek', undefined, sp.variants[0].id, 'normal'), b = make(sp, 'erkek', undefined, sp.variants[0].id, 'normal');
    expect(frozen(a).length, 'çene + 2 solungaç').toBeGreaterThanOrEqual(3);
    const a0 = frozen(a);
    a.update(0.016, 0.5);
    expect(frozen(a).some((m, i) => m.some((x, j) => Math.abs(x - a0[i][j]) > 1e-7))).toBe(true);
    expect(frozen(b)).toEqual(a0); // b henüz oynamadı
    const low = make(sp, 'erkek', undefined, sp.variants[0].id, 'low');
    const l0 = frozen(low);
    low.update(0.016, 0.5);
    expect(frozen(low)).toEqual(l0);
    a.dispose(); b.dispose(); low.dispose();
  });

  it('lepistes: çene/solungaç geometrisi balık başına kopyadır (CPU animasyonu paylaşımı bozmaz)', () => {
    const sp = byId('lepistes');
    const a = make(sp, 'erkek', undefined, sp.variants[0].id, 'normal'), b = make(sp, 'erkek', undefined, sp.variants[0].id, 'normal');
    const geos = (g: FishGroup) => { const l: any[] = []; g.object.traverse((o) => { if ((o as Mesh).isMesh) l.push((o as Mesh).geometry); }); return l; };
    const ga = geos(a), gb = geos(b);
    const unshared = ga.filter((g, i) => g !== gb[i]).length;
    expect(unshared, 'en az çene ve iki solungaç kopyalanır').toBeGreaterThanOrEqual(3);
    expect(unshared, 'ama çoğu geometri paylaşılır').toBeLessThan(ga.length / 2);
    a.update(0.016, 0.4); b.update(0.016, 1.1);
    a.dispose(); b.dispose();
  });

  it('sortFishGroups: uzaktaki balığa küçük sıra verir', () => {
    const sp = byId('neon');
    const near = make(sp, 'erkek', undefined, sp.variants[0].id), far = make(sp, 'erkek', undefined, sp.variants[0].id);
    near.object.position.set(0, 0, 2); far.object.position.set(0, 0, -5);
    near.object.updateMatrixWorld(true); far.object.updateMatrixWorld(true);
    const cam = new PerspectiveCamera(); cam.position.set(0, 0, 8); cam.updateMatrixWorld(true);
    sortFishGroups([near, far], cam);
    expect(far.object.renderOrder).toBeLessThan(near.object.renderOrder);
    near.dispose(); far.dispose();
  });
});

describe('12 balıklı sahne bütçesi', () => {
  const MIX: [string, SexId, number][] = [
    ['lepistes', 'erkek', 3], ['molly', 'disi', 0], ['platy', 'erkek', 2], ['betta', 'erkek', 1], ['neon', 'disi', 0], ['corydoras', 'erkek', 0],
    ['japon', 'erkek', 2], ['pleco', 'disi', 0], ['melek', 'erkek', 1], ['diskus', 'disi', 2], ['vatoz', 'erkek', 0], ['karides', 'disi', 1],
  ];
  for (const [lod, budget] of [['low', TANK_LOW], ['normal', TANK_NORMAL]] as const) {
    it(`${lod}: üçgen, çizim çağrısı ve benzersiz doku piksel tavanı`, () => {
      const groups = MIX.map(([id, sex, v]) => { const sp = byId(id); return make(sp, sex, undefined, sp.variants[v % sp.variants.length].id, lod); });
      const tris = groups.reduce((s, g) => s + countObject(g.object).triangles, 0);
      const draws = groups.reduce((s, g) => s + countObject(g.object).drawCalls, 0);
      const stats = groupCacheStats();
      REPORT.push(`TANK\t${lod}\ttris=${tris}\tdraws=${draws}\ttexpx=${stats.texturePixels}\ttextures=${stats.textures}\tgeoms=${stats.geometries}`);
      expect(stats.entries).toBe(12);
      expect(tris).toBeLessThanOrEqual(budget.triangles);
      expect(draws).toBeLessThanOrEqual(budget.drawCalls);
      expect(stats.texturePixels).toBeLessThanOrEqual(budget.texturePixels);
      groups.forEach((g) => g.dispose());
    }, 120_000);
  }

  it('12 özdeş balık: önbellek tek şablon, doku/geometri 12 katına çıkmaz', () => {
    const sp = byId('japon');
    const one = make(sp, 'erkek', undefined, sp.variants[0].id);
    const single = groupCacheStats();
    const rest = Array.from({ length: 11 }, () => make(sp, 'erkek', undefined, sp.variants[0].id));
    const all = groupCacheStats();
    expect(all.entries).toBe(1);
    expect(all.refs).toBe(12);
    expect(all.texturePixels).toBe(single.texturePixels);
    expect(all.geometries).toBe(single.geometries);
    one.dispose(); rest.forEach((g) => g.dispose());
  });
});

it('rapor dosyası (isteğe bağlı)', async () => {
  if (process.env.FISHGROUP_REPORT) (await import('node:fs')).writeFileSync(process.env.FISHGROUP_REPORT, REPORT.join('\n'));
});
