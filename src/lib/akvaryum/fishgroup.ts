// Renderer'sız, hafif balık grupları (paylaşımlı çok balıklı sahne için). Tuval, WebGLRenderer, hotspot ve arayüz YOK.
// Her tür, mevcut geometri/doku kurucularını bir "şablon" (GroupTemplateSpec) olarak sarar; şablon anahtara
// (tür|form|varyete|cinsiyet|lod) göre önbelleğe alınır ve referans sayılır. Her balık şablondan ucuz bir kopyadır:
//  - geometri ve doku PAYLAŞILIR (yalnızca CPU'da değişen küçük parçalar — çene, solungaç — balık başına kopyalanır),
//  - yüzme gölgelendiricili malzemeler balık başına hafif kopyadır (kendi uTime/uAmp'si olsun diye; program önbellek
//    anahtarı aynı olduğundan GPU programı paylaşılır), gölgelendiricisiz malzemeler doğrudan paylaşılır,
//  - eklem animasyonu (karides, çene) şablon üzerinde sürülüp kopyaya aktarılır.
import { Box3, BufferGeometry, Camera, Group, Material, Mesh, Object3D, Texture, Vector3, type BufferAttribute } from 'three';
import type { FishGroup, FishGroupBudget, FishGroupOptions, FishLod } from './types';

// ------------------------------------------------------------------ ayrıntı düzeyi (kurulum sırasında geçerli)

/** Kurucuların okuduğu geçici düzey ayarı: k = ağ yoğunluğu çarpanı, eye = göz dokusu genişliği. Varsayılan (1) hiçbir şeyi değiştirmez. */
export const tess = { k: 1, eye: 512 };

/** Bölüm sayısını düzeye göre küçültür; varsayılan düzeyde n aynen döner. */
export const seg = (n: number, min = 3): number => (tess.k === 1 ? n : Math.max(min, Math.round(n * tess.k)));

export const LOD_SETTINGS: Record<FishLod, { k: number; eye: number; tex: number }> = {
  normal: { k: 1, eye: 512, tex: 512 },
  low: { k: 0.4, eye: 128, tex: 256 },
};

export function withLod<T>(lod: FishLod, fn: () => T): T {
  const prev = { ...tess };
  const s = LOD_SETTINGS[lod];
  tess.k = s.k; tess.eye = s.eye;
  try { return fn(); } finally { tess.k = prev.k; tess.eye = prev.eye; }
}

// ------------------------------------------------------------------ şablon

type Uniforms = Record<string, { value: number }>;

export interface GroupTemplateSpec {
  /** Şablon sahne grafiği (hiçbir sahneye eklenmez). Burun −X, sırt +Y varsayılır (yaw ile düzeltilir). */
  root: Object3D;
  textures: Texture[];
  /** Şablon malzemeleri swimify edilirken kullanılan uniform kümesi (balık başına kopyalanır); yoksa gölgelendirici yüzmesi yok. */
  uniforms?: object;
  /** Yüzme açıkken uniform değerleri (uTime her zaman sürülür): ör. { uAmp: 0.05 } */
  swimOn?: Record<string, number>;
  /** Şablon üzerinde (t = yüzme zamanı, k = 0..1 yüzme ağırlığı) eklem / çene / solungaç animasyonunu sürer. */
  drive?: (t: number, k: number) => void;
  /** drive yalnızca küçük yüz ayrıntısını oynatıyorsa true: 'low' düzeyinde atlanır. false = gövde animasyonu (karides). */
  driveIsDetail?: boolean;
  /** Burnu +X'e çeviren Y dönüşü (rad); varsayılan π (modeller burnu −X'te kurar). */
  yaw?: number;
  /** Uzunluğu ölçülen nesne (gövde); yoksa tüm kök. */
  lengthRef?: Object3D | Object3D[];
  /** Ek serbest bırakma (ör. vekil ağlar) */
  onDispose?: () => void;
}

interface AnimatedNode { tpl: Object3D; index: number }
interface DynamicMesh { tpl: Mesh; index: number }

interface Template {
  key: string;
  refs: number;
  spec: GroupTemplateSpec;
  nodes: Object3D[];
  animated: AnimatedNode[];
  dynamic: DynamicMesh[];
  /** Normalleştirme: ölçek, merkez (şablon uzayında) ve yarıçap (normalleştirilmiş) */
  scale: number;
  center: Vector3;
  radius: number;
  yaw: number;
  stats: Omit<FishGroupBudget, 'key'> & { geometries: number; materials: number };
}

const cache = new Map<string, Template>();

const isRenderable = (o: Object3D): o is Mesh => (o as Mesh).isMesh === true || (o as Mesh & { isLine?: boolean }).isLine === true;
const matsOf = (o: Mesh): Material[] => (Array.isArray(o.material) ? o.material : [o.material]);

export function triangleCount(g: BufferGeometry): number {
  if (g.index) return g.index.count / 3;
  const p = g.getAttribute('position');
  return p ? p.count / 3 : 0;
}

function texturePixels(t: Texture): number {
  const im = t.image as { width?: number; height?: number } | undefined;
  return (im?.width ?? 0) * (im?.height ?? 0);
}

function analyse(key: string, spec: GroupTemplateSpec): Template {
  const nodes: Object3D[] = [];
  spec.root.traverse((o) => nodes.push(o));
  spec.root.updateMatrixWorld(true);
  const yaw = spec.yaw ?? Math.PI;

  // etkin çizim bütçesi (şablon geometrisi tek kez sayılır)
  const geos = new Set<BufferGeometry>(), mats = new Set<Material>();
  let tris = 0, draws = 0;
  for (const o of nodes) {
    if (!isRenderable(o)) continue;
    draws++;
    if ((o as Mesh).isMesh) tris += triangleCount(o.geometry);
    geos.add(o.geometry);
    matsOf(o).forEach((m) => mats.add(m));
  }
  const pixels = spec.textures.reduce((s, t) => s + texturePixels(t), 0);

  // animasyonlu düğümleri ve CPU'da değişen geometrileri sondalayarak bul
  const animated: AnimatedNode[] = [], dynamic: DynamicMesh[] = [];
  if (spec.drive) {
    const snap = () => nodes.map((n) => { if (n.matrixAutoUpdate) n.updateMatrix(); return Array.from(n.matrix.elements); });
    const vers = () => nodes.map((n) => (isRenderable(n) ? (n.geometry.getAttribute('position') as BufferAttribute | undefined)?.version ?? 0 : 0));
    spec.drive(0, 0);
    const s0 = snap(), v0 = vers();
    const shots = [[0.4, 1], [1.7, 1], [2.9, 0.6]].map(([t, k]) => { spec.drive!(t, k); return snap(); });
    const v1 = vers();
    spec.drive(0, 0);
    nodes.forEach((n, i) => {
      if (shots.some((s) => s[i].some((x, j) => Math.abs(x - s0[i][j]) > 1e-9))) animated.push({ tpl: n, index: i });
      if (isRenderable(n) && v1[i] !== v0[i]) dynamic.push({ tpl: n as Mesh, index: i });
    });
    spec.root.updateMatrixWorld(true);
  }

  // normalleştirme: yaw sonrası +X boyunca gövde uzunluğu 1; orijin = gövde kutusunun merkezi
  const R = new Object3D(); R.rotation.y = yaw; R.updateMatrix();
  const refs = spec.lengthRef ? ([] as Object3D[]).concat(spec.lengthRef) : [spec.root];
  const box = new Box3();
  for (const r of refs) box.expandByObject(r);
  box.applyMatrix4(R.matrix);
  const len = Math.max(1e-6, box.max.x - box.min.x);
  const scale = 1 / len;
  const centerR = box.getCenter(new Vector3());
  const center = centerR.clone().applyAxisAngle(new Vector3(0, 1, 0), -yaw); // şablon uzayı
  // kapsayan küre: tüm köşelerden merkeze en uzak mesafe
  let r2 = 0;
  const v = new Vector3();
  for (const o of nodes) {
    if (!isRenderable(o)) continue;
    const p = o.geometry.getAttribute('position');
    if (!p) continue;
    for (let i = 0; i < p.count; i++) { v.fromBufferAttribute(p as BufferAttribute, i).applyMatrix4(o.matrixWorld).sub(center); r2 = Math.max(r2, v.lengthSq()); }
  }
  const radius = Math.sqrt(r2) * scale * 1.02;
  return {
    key, refs: 0, spec, nodes, animated, dynamic, scale, center, radius, yaw,
    stats: { triangles: tris, drawCalls: draws, textures: spec.textures.length, texturePixels: pixels, geometries: geos.size, materials: mats.size },
  };
}

function disposeTemplate(t: Template) {
  const geos = new Set<BufferGeometry>(), mats = new Set<Material>();
  for (const o of t.nodes) {
    if (!isRenderable(o)) continue;
    geos.add(o.geometry);
    matsOf(o).forEach((m) => mats.add(m));
  }
  geos.forEach((g) => g.dispose());
  mats.forEach((m) => m.dispose());
  t.spec.textures.forEach((x) => x.dispose());
  t.spec.onDispose?.();
}

export const fishGroupKey = (species: string, o: FishGroupOptions): string => `${species}|${o.form ?? ''}|${o.variant}|${o.sex}|${o.lod ?? 'normal'}`;

/** Önbellekteki durum (testler ve bütçe raporu için) */
export function groupCacheStats() {
  let triangles = 0, drawCalls = 0, textures = 0, texturePixels = 0, geometries = 0, refs = 0;
  for (const t of cache.values()) {
    triangles += t.stats.triangles; drawCalls += t.stats.drawCalls; textures += t.stats.textures; texturePixels += t.stats.texturePixels; geometries += t.stats.geometries; refs += t.refs;
  }
  return { entries: cache.size, refs, triangles, drawCalls, textures, texturePixels, geometries };
}

export const groupCacheHas = (key: string): boolean => cache.has(key);

// ------------------------------------------------------------------ örnek (balık başına)

export function instantiate(species: string, opts: FishGroupOptions, factory: (lod: FishLod) => GroupTemplateSpec): FishGroup {
  const lod: FishLod = opts.lod ?? 'normal';
  const key = fishGroupKey(species, opts);
  let tpl = cache.get(key);
  if (!tpl) {
    tpl = analyse(key, withLod(lod, () => factory(lod)));
    cache.set(key, tpl);
  }
  tpl.refs++;
  const T = tpl;

  // sahne grafiğini kopyala: geometri/malzeme referansları paylaşılır
  const clone = T.spec.root.clone(true);
  const inst: Object3D[] = [];
  clone.traverse((o) => inst.push(o));

  // yüzme gölgelendiricili malzemeler: balık başına hafif kopya; kendi uniform'ları
  const own: Uniforms = {};
  const tu = T.spec.uniforms as Uniforms | undefined;
  if (tu) for (const k of Object.keys(tu)) own[k] = { value: tu[k].value };
  const swimOn = T.spec.swimOn ?? {};
  const matMap = new Map<Material, Material>();
  const ownedMats: Material[] = [];
  const own1 = (m: Material): Material => {
    if (!Object.prototype.hasOwnProperty.call(m, 'onBeforeCompile') || !T.spec.uniforms) return m;
    let c = matMap.get(m);
    if (!c) {
      c = m.clone();
      const orig = m.onBeforeCompile;
      c.onBeforeCompile = (shader, r) => { orig.call(m, shader, r); for (const k of Object.keys(own)) shader.uniforms[k] = own[k]; };
      c.customProgramCacheKey = m.customProgramCacheKey;
      matMap.set(m, c); ownedMats.push(c);
    }
    return c;
  };
  const ownedGeos: BufferGeometry[] = [];
  const dyn = new Map<number, Mesh>();
  for (const d of T.dynamic) dyn.set(d.index, d.tpl);
  inst.forEach((o, i) => {
    if (!isRenderable(o)) return;
    const m = o as Mesh;
    m.material = Array.isArray(m.material) ? m.material.map(own1) : own1(m.material);
    if (dyn.has(i)) { m.geometry = dyn.get(i)!.geometry.clone(); ownedGeos.push(m.geometry); }
  });

  const groupNodes: Object3D[] = inst.filter((o) => (o as Group).isGroup);
  // normalleştirme sarmalayıcıları: object (serbest konum/döndürme) > pivot (yaw + ölçek) > kopya (merkezleme)
  const object = new Group();
  object.name = `balik:${key}`;
  const pivot = new Group();
  pivot.rotation.y = T.yaw;
  pivot.scale.setScalar(T.scale);
  clone.position.copy(T.center).negate();
  pivot.add(clone);
  object.add(pivot);

  groupNodes.push(object, pivot);
  const sync = () => {
    for (const a of T.animated) {
      const s = a.tpl, d = inst[a.index];
      if (s.matrixAutoUpdate) { d.position.copy(s.position); d.quaternion.copy(s.quaternion); d.scale.copy(s.scale); }
      else { d.matrix.copy(s.matrix); d.matrixWorldNeedsUpdate = true; }
    }
    for (const dm of T.dynamic) {
      const src = dm.tpl.geometry, dst = (inst[dm.index] as Mesh).geometry;
      for (const name of ['position', 'normal']) {
        const sa = src.getAttribute(name) as BufferAttribute | undefined, da = dst.getAttribute(name) as BufferAttribute | undefined;
        if (sa && da) { (da.array as Float32Array).set(sa.array as Float32Array); da.needsUpdate = true; }
      }
    }
  };
  const pose = (t: number, k: number) => { T.spec.drive?.(t, k); sync(); };

  const still = opts.reducedMotion;
  const detailOnly = T.spec.driveIsDetail !== false;
  const animateDrive = !still && !!T.spec.drive && !(lod === 'low' && detailOnly);
  if (T.spec.drive) pose(0, 0);
  if (!still) for (const k of Object.keys(swimOn)) if (own[k]) own[k].value = swimOn[k];
  let time = 0, disposed = false;

  // bütçe: bu balığın çizdikleri
  const budget: FishGroupBudget = { triangles: T.stats.triangles, drawCalls: T.stats.drawCalls, textures: T.stats.textures, texturePixels: T.stats.texturePixels, key };

  return {
    object,
    boundingRadius: T.radius,
    budget,
    setSortRank(rank: number) { for (const g of groupNodes) g.renderOrder = rank; },
    update(dt: number, swimTime?: number) {
      if (disposed || still) return;
      time = swimTime ?? time + dt;
      if (own.uTime) own.uTime.value = time;
      if (animateDrive) pose(time, 1);
    },
    dispose() {
      if (disposed) return;
      disposed = true;
      object.removeFromParent();
      ownedMats.forEach((m) => m.dispose());
      ownedGeos.forEach((g) => g.dispose());
      if (--T.refs <= 0) { cache.delete(T.key); disposeTemplate(T); }
    },
  };
}

/** Çıkarım: tek bir kopyadaki üçgen sayısı / çizim çağrısı (testler için) */
export function countObject(o: Object3D): { triangles: number; drawCalls: number } {
  let triangles = 0, drawCalls = 0;
  o.traverse((n) => { if (isRenderable(n)) { drawCalls++; if ((n as Mesh).isMesh) triangles += triangleCount(n.geometry); } });
  return { triangles, drawCalls };
}

/** Balıkları kameraya uzaklıkla sıralar (uzak = küçük sıra): saydam yüzgeçler balıklar arasında arkadan öne çizilir. Her karede çağırın. */
export function sortFishGroups(groups: FishGroup[], camera: Camera): void {
  const c = camera.getWorldPosition(new Vector3()), p = new Vector3();
  const d = groups.map((g) => ({ g, d: g.object.getWorldPosition(p).distanceToSquared(c) })).sort((a, b) => b.d - a.d);
  d.forEach((e, i) => e.g.setSortRank(i));
}
