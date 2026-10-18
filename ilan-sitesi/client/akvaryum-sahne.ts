// Satıcı akvaryumu: TEK WebGLRenderer ile cam kutu içinde, katalogdan seçilmiş balıkların temsili 3B sahnesi.
// Balıklar tür modüllerinin renderer'sız `createFishGroup` API'siyle gelir (geometri/doku paylaşımlı); burada yalnızca
// sahne (su, kum, cam), yüzme yolları, kamera denetimi (işaretçi + klavye), duraklatma ve temizlik vardır.
import {
  BackSide, BoxGeometry, BufferGeometry, CanvasTexture, Color, DoubleSide, EdgesGeometry, Float32BufferAttribute, Fog, LineBasicMaterial,
  LineSegments, Material, Mesh, MeshBasicMaterial, MeshStandardMaterial, PerspectiveCamera, RepeatWrapping, Scene, SRGBColorSpace, Box3, Vector3, WebGLRenderer,
} from 'three';
import { applyLook } from '../../src/lib/akvaryum/scene-look';
import { sortFishGroups, groupCacheStats } from '../../src/lib/akvaryum/fishgroup';
import type { FishGroup, FishLod, SexId, SpeciesModule } from '../../src/lib/akvaryum/types';
import { loadSpecies } from './viewer3d.ts';
import { createMotion, fitDistance, tankDims, REL_SIZE, type Extent, type Pose, type TankDims } from './tank-motion.ts';

export interface TankFish { species: string; form: string; variant: string; sex: string }
export interface TankOptions {
  canvas: HTMLCanvasElement;
  fish: TankFish[];
  lod: FishLod;
  reducedMotion: boolean;
  /** Bağlam kaybı gibi kurtarılamayan durumlarda çağrılır */
  onFatal?: (why: string) => void;
}
export interface TankStats {
  fish: number; lod: FishLod; disposed: boolean; active: boolean;
  triangles: number; drawCalls: number; geometries: number; textures: number; programs: number;
  pixelRatio: number; width: number; height: number; azimuth: number; polar: number; distance: number;
  cache: ReturnType<typeof groupCacheStats>; budgetTriangles: number; budgetDrawCalls: number;
}
export interface TankHandle {
  rotate(dAz: number, dPol?: number): void;
  zoom(factor: number): void;
  reset(): void;
  setActive(on: boolean): void;
  dispose(): void;
  stats(): TankStats;
  /** Senkron N kare çizer (güncelle + çiz + gl.finish) ve kare başına ms döndürür: yalnızca ölçüm için. */
  benchmark(frames?: number): number;
}

const FOV = 30;
const WATER_TOP = '#3d9db3', WATER_BOTTOM = '#0a2d3b', FOG = '#104659', ROOM = 0x061820;
const INIT_AZ = 0.32, INIT_POL = 1.47;
const POL_MIN = 0.3, POL_MAX = 1.6;
const MIN_FRAME_MS = 1000 / 30;

function sandTexture(): CanvasTexture {
  const c = document.createElement('canvas'); c.width = c.height = 128;
  const g = c.getContext('2d')!;
  g.fillStyle = '#c4ad82'; g.fillRect(0, 0, 128, 128);
  let s = 12345; const rnd = () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
  for (let i = 0; i < 900; i++) { const l = 55 + rnd() * 30; g.fillStyle = `hsl(36 ${25 + rnd() * 15}% ${l}%)`; g.fillRect(rnd() * 128, rnd() * 128, 1 + rnd() * 2, 1 + rnd() * 2); }
  const t = new CanvasTexture(c);
  t.wrapS = t.wrapT = RepeatWrapping; t.colorSpace = SRGBColorSpace;
  return t;
}

function waterBox(d: TankDims): Mesh {
  const g = new BoxGeometry(d.W, d.H, d.D);
  const pos = g.getAttribute('position');
  const top = new Color(WATER_TOP), bot = new Color(WATER_BOTTOM), c = new Color(), col: number[] = [];
  for (let i = 0; i < pos.count; i++) { const t = (pos.getY(i) + d.H / 2) / d.H; c.copy(bot).lerp(top, Math.pow(t, 0.85)); col.push(c.r, c.g, c.b); }
  g.setAttribute('color', new Float32BufferAttribute(col, 3));
  // BackSide: yalnızca uzak duvarların içi çizilir, yakın duvarlar görünmez (kamera hep dışarıda)
  return new Mesh(g, new MeshBasicMaterial({ vertexColors: true, side: BackSide, fog: false, toneMapped: false }));
}

export async function createTank(o: TankOptions): Promise<TankHandle> {
  const { canvas, lod, reducedMotion } = o;
  // 1) tür modülleri (tembel)
  const ids = [...new Set(o.fish.map((f) => f.species))];
  const mods = new Map<string, SpeciesModule>();
  await Promise.all(ids.map(async (id) => { const m = await loadSpecies(id); if (m) mods.set(id, m); }));

  // 2) tek renderer (WebGL yoksa burada fırlatır)
  const renderer = new WebGLRenderer({ canvas, antialias: true, alpha: false, powerPreference: 'high-performance' });
  const pixelCap = lod === 'low' ? 1.5 : 2;
  renderer.setClearColor(ROOM, 1);
  const scene = new Scene();
  const look = applyLook(renderer, scene);
  const camera = new PerspectiveCamera(FOV, 16 / 9, 0.1, 80);

  // 3) balıklar
  type Item = { g: FishGroup; species: string; ext: Extent; motion: ReturnType<typeof createMotion> | null; roll: number };
  const items: Item[] = [];
  const created: { fish: TankFish; g: FishGroup; ext: Extent }[] = [];
  o.fish.forEach((f) => {
    const sp = mods.get(f.species);
    if (!sp?.createFishGroup) { console.warn('Bu tür için createFishGroup yok:', f.species); return; }
    const sex = (sp.sexes.some((s) => s.id === f.sex) ? f.sex : sp.sexes[0].id) as SexId;
    const form = sp.forms?.some((x) => x.id === f.form) ? f.form : undefined;
    const variant = sp.variants.some((x) => x.id === f.variant) ? f.variant : sp.variants[0].id;
    const g = sp.createFishGroup({ sex, form, variant, reducedMotion, lod });
    g.object.scale.setScalar(REL_SIZE[f.species] ?? 0.8);
    const box = new Box3().setFromObject(g.object);
    const k = 1.06; // animasyon / yüzgeç payı
    created.push({ fish: f, g, ext: { hx: Math.max(Math.abs(box.min.x), box.max.x) * k, hy: Math.max(Math.abs(box.min.y), box.max.y) * k, hz: Math.max(Math.abs(box.min.z), box.max.z) * k } });
  });

  const maxR = created.reduce((m, c) => Math.max(m, Math.hypot(c.ext.hx, c.ext.hz)), 0.5);
  let aspect = (canvas.clientWidth || 16) / (canvas.clientHeight || 9);
  let dims = tankDims(created.length, aspect, maxR);

  // 4) tank: su, kum, cam
  const owned: { dispose(): void }[] = [];
  const addOwned = <T extends { dispose(): void }>(x: T): T => { owned.push(x); return x; };
  const water = waterBox(dims); addOwned(water.geometry); addOwned(water.material as Material);
  scene.add(water);
  const sandTex = addOwned(sandTexture());
  sandTex.repeat.set(dims.W / 1.6, dims.D / 1.6);
  const sand = new Mesh(addOwned(new BoxGeometry(dims.W, dims.sand, dims.D)), addOwned(new MeshStandardMaterial({ map: sandTex, roughness: 1, metalness: 0 })));
  sand.position.y = -dims.H / 2 + dims.sand / 2;
  scene.add(sand);
  const gb = addOwned(new BoxGeometry(dims.W + 0.05, dims.H, dims.D + 0.05));
  const glass = new Mesh(gb, addOwned(new MeshBasicMaterial({ color: 0xbfe8f4, transparent: true, opacity: 0.06, depthWrite: false, side: DoubleSide, fog: false, toneMapped: false })));
  glass.renderOrder = -10; // balıklardan önce çizilir (balıklar sıralı, cam hep arkada kalır)
  scene.add(glass);
  const eg = addOwned(new EdgesGeometry(gb as BufferGeometry));
  const edges = new LineSegments(eg, addOwned(new LineBasicMaterial({ color: 0xd2f0f8, transparent: true, opacity: 0.6, fog: false, toneMapped: false })));
  scene.add(edges);
  const fog = new Fog(FOG, 10, 30); scene.fog = fog;

  created.forEach((c, i) => {
    const motion = createMotion({ index: i, species: c.fish.species, ext: c.ext, dims });
    scene.add(c.g.object);
    items.push({ g: c.g, species: c.fish.species, ext: c.ext, motion, roll: 0 });
  });
  const groups = items.map((i) => i.g);
  const budgetTriangles = groups.reduce((s, g) => s + g.budget.triangles, 0), budgetDrawCalls = groups.reduce((s, g) => s + g.budget.drawCalls, 0);

  // 5) kamera durumu (küresel): hedef değerler ve yumuşatılmış güncel değerler
  const target = new Vector3(0, -0.15, 0);
  let fit = fitDistance(dims, aspect, FOV);
  const limits = () => ({ min: dims.W / 2 + 0.6, max: fit * 1.3 });
  const tgt = { az: INIT_AZ, pol: INIT_POL, dist: fit }, cur = { ...tgt };
  const clampView = () => { const l = limits(); tgt.pol = Math.min(POL_MAX, Math.max(POL_MIN, tgt.pol)); tgt.dist = Math.min(l.max, Math.max(l.min, tgt.dist)); };
  const place = () => {
    const sp = Math.sin(cur.pol);
    camera.position.set(target.x + cur.dist * sp * Math.sin(cur.az), target.y + cur.dist * Math.cos(cur.pol), target.z + cur.dist * sp * Math.cos(cur.az));
    camera.lookAt(target);
    fog.near = cur.dist * 0.85; fog.far = cur.dist * 2.6;
    stage?.setAttribute('data-azimuth', cur.az.toFixed(2));
  };
  const stage = canvas.parentElement;

  // 6) boyut
  // Uyarlanabilir çözünürlük: kare aralığı uzun sürerse (yavaş GPU / yazılım WebGL) çizim çözünürlüğü kademeli düşer (en az 0,5x).
  let pr = 1, W = 0, H = 0, scale = 1, slow = 0, fast = 0, ema = 33;
  const applySize = () => { renderer.setPixelRatio(pr * scale); renderer.setSize(W, H, false); };
  const resize = () => {
    const w = canvas.clientWidth, h = canvas.clientHeight;
    if (!w || !h) return;
    pr = Math.min(window.devicePixelRatio || 1, pixelCap);
    W = w; H = h; applySize();
    const prevFit = fit; aspect = w / h;
    camera.aspect = aspect; camera.updateProjectionMatrix();
    fit = fitDistance(dims, aspect, FOV);
    tgt.dist *= fit / prevFit; cur.dist *= fit / prevFit; clampView();
    invalidate();
  };

  // 7) çizim döngüsü
  let time = 0, last = 0, raf = 0, active = false, disposed = false;
  const posed = (p: Pose, it: Item) => { const o3 = it.g.object; o3.position.set(p.x, p.y, p.z); o3.rotation.order = 'YZX'; o3.rotation.y = p.yaw; o3.rotation.z = p.pitch; };
  const step = (dt: number) => {
    if (!reducedMotion) time += dt;
    for (let i = 0; i < items.length; i++) {
      const it = items[i];
      posed(it.motion!.pose(time), it);
      it.g.update(dt, time + i * 1.7);
    }
    const k = reducedMotion ? 1 : 1 - Math.exp(-dt * 14);
    cur.az += (tgt.az - cur.az) * k; cur.pol += (tgt.pol - cur.pol) * k; cur.dist += (tgt.dist - cur.dist) * k;
    if (Math.abs(tgt.az - cur.az) < 1e-4 && Math.abs(tgt.pol - cur.pol) < 1e-4 && Math.abs(tgt.dist - cur.dist) < 1e-3) { cur.az = tgt.az; cur.pol = tgt.pol; cur.dist = tgt.dist; }
  };
  const settled = () => cur.az === tgt.az && cur.pol === tgt.pol && cur.dist === tgt.dist;
  const draw = () => {
    place();
    sortFishGroups(groups, camera);
    look.sync(camera, target);
    renderer.render(scene, camera);
  };
  const frame = (ts: number) => {
    raf = 0;
    if (!active || disposed) return;
    const gap = ts - last;
    if (gap < MIN_FRAME_MS - 3) { raf = requestAnimationFrame(frame); return; } // en çok ~30 kare/sn
    const dt = Math.min(0.1, Math.max(0, gap / 1000)); last = ts;
    if (!reducedMotion) {
      ema = ema * 0.9 + Math.min(gap, 400) * 0.1;
      if (ema > 70) { if (++slow > 8 && scale > 0.5) { scale = Math.max(0.5, scale * 0.8); applySize(); slow = 0; ema = 40; } fast = 0; }
      else if (ema < 40 && scale < 1) { if (++fast > 240) { scale = Math.min(1, scale * 1.25); applySize(); fast = 0; } slow = 0; } else { slow = 0; fast = 0; }
    }
    step(dt); draw();
    if (!reducedMotion || !settled()) raf = requestAnimationFrame(frame);
  };
  const schedule = () => { if (active && !disposed && !raf) { last = performance.now(); raf = requestAnimationFrame(frame); } };
  function invalidate() { schedule(); }

  // 8) girdi: işaretçi (sürükle/kıstır), tekerlek (odaktayken ya da Ctrl ile), klavye
  const ptrs = new Map<number, { x: number; y: number }>();
  let pinch = 0;
  const pinchDist = () => { const [a, b] = [...ptrs.values()]; return Math.hypot(a.x - b.x, a.y - b.y); };
  const onDown = (e: PointerEvent) => {
    ptrs.set(e.pointerId, { x: e.clientX, y: e.clientY });
    try { canvas.setPointerCapture(e.pointerId); } catch { /* yoksay */ }
    if (ptrs.size === 2) pinch = pinchDist();
    canvas.dataset.drag = '1';
  };
  const onMove = (e: PointerEvent) => {
    const p = ptrs.get(e.pointerId); if (!p) return;
    const dx = e.clientX - p.x, dy = e.clientY - p.y; p.x = e.clientX; p.y = e.clientY;
    if (ptrs.size === 1) { tgt.az -= dx * 0.008; tgt.pol -= dy * 0.006; }
    else if (ptrs.size === 2) { const d = pinchDist(); if (pinch > 0 && d > 0) tgt.dist *= pinch / d; pinch = d; }
    clampView(); invalidate();
  };
  const onUp = (e: PointerEvent) => { ptrs.delete(e.pointerId); pinch = ptrs.size === 2 ? pinchDist() : 0; if (!ptrs.size) delete canvas.dataset.drag; };
  const onWheel = (e: WheelEvent) => {
    if (document.activeElement !== canvas && !e.ctrlKey) return; // sayfa kaydırmasını engelleme
    e.preventDefault(); tgt.dist *= Math.exp(e.deltaY * 0.0012); clampView(); invalidate();
  };
  const api = {
    rotate(dAz: number, dPol = 0) { tgt.az += dAz; tgt.pol += dPol; clampView(); invalidate(); },
    zoom(f: number) { tgt.dist *= f; clampView(); invalidate(); },
    reset() { tgt.az = INIT_AZ; tgt.pol = INIT_POL; tgt.dist = fit; clampView(); invalidate(); },
  };
  const onKey = (e: KeyboardEvent) => {
    if (e.altKey || e.ctrlKey || e.metaKey) return;
    const k = e.key;
    if (k === 'ArrowLeft') api.rotate(-0.18); else if (k === 'ArrowRight') api.rotate(0.18);
    else if (k === 'ArrowUp') api.rotate(0, -0.1); else if (k === 'ArrowDown') api.rotate(0, 0.1);
    else if (k === '+' || k === '=') api.zoom(0.85); else if (k === '-' || k === '_') api.zoom(1.18);
    else if (k === 'Home') api.reset();
    else return;
    e.preventDefault();
  };
  const onLost = (e: Event) => { e.preventDefault(); o.onFatal?.('context-lost'); };
  canvas.addEventListener('pointerdown', onDown); canvas.addEventListener('pointermove', onMove);
  canvas.addEventListener('pointerup', onUp); canvas.addEventListener('pointercancel', onUp);
  canvas.addEventListener('wheel', onWheel, { passive: false });
  canvas.addEventListener('keydown', onKey);
  canvas.addEventListener('webglcontextlost', onLost);
  const ro = new ResizeObserver(resize); ro.observe(canvas);

  // 9) ilk çizim
  resize();
  step(0); place(); draw();

  const info = renderer.info;
  const handle: TankHandle = {
    ...api,
    setActive(on: boolean) { if (disposed || on === active) return; active = on; if (on) schedule(); else if (raf) { cancelAnimationFrame(raf); raf = 0; } stage?.setAttribute('data-active', String(on)); },
    stats() {
      return {
        fish: items.length, lod, disposed, active, triangles: info.render.triangles, drawCalls: info.render.calls, geometries: info.memory.geometries, textures: info.memory.textures,
        programs: info.programs?.length ?? 0, pixelRatio: pr * scale, width: W, height: H, azimuth: tgt.az, polar: tgt.pol, distance: tgt.dist, cache: groupCacheStats(), budgetTriangles, budgetDrawCalls,
      };
    },
    benchmark(frames = 30) {
      if (disposed) return 0;
      const gl = renderer.getContext();
      step(0.016); draw(); gl.finish();
      const t0 = performance.now();
      for (let i = 0; i < frames; i++) { step(0.033); draw(); }
      gl.finish();
      return (performance.now() - t0) / frames;
    },
    dispose() {
      if (disposed) return;
      disposed = true; active = false;
      if (raf) cancelAnimationFrame(raf); raf = 0;
      ro.disconnect();
      canvas.removeEventListener('pointerdown', onDown); canvas.removeEventListener('pointermove', onMove);
      canvas.removeEventListener('pointerup', onUp); canvas.removeEventListener('pointercancel', onUp);
      canvas.removeEventListener('wheel', onWheel); canvas.removeEventListener('keydown', onKey); canvas.removeEventListener('webglcontextlost', onLost);
      groups.forEach((g) => g.dispose());          // paylaşımlı geometri/doku, son kullanıcı bırakınca serbest kalır
      items.length = 0;
      scene.remove(water, sand, glass, edges);
      owned.forEach((x) => x.dispose());
      look.dispose();
      scene.environment = null;
      renderer.dispose();
      renderer.forceContextLoss();
    },
  };
  return handle;
}
