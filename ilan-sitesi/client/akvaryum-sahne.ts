// Satıcı akvaryumu: TEK WebGLRenderer ile cam kutu içinde, katalogdan seçilmiş balıkların temsili 3B sahnesi.
// Balıklar tür modüllerinin renderer'sız `createFishGroup` API'siyle gelir (geometri/doku paylaşımlı); burada yalnızca
// sahne (su, kum, cam), yüzme yolları, kamera denetimi (işaretçi + klavye), duraklatma ve temizlik vardır.
import {
  BackSide, BoxGeometry, BufferGeometry, Color, CanvasTexture, DoubleSide, EdgesGeometry, Float32BufferAttribute, Fog, LineBasicMaterial,
  LineSegments, Material, Mesh, MeshBasicMaterial, MeshStandardMaterial, PerspectiveCamera, RepeatWrapping, Scene, SRGBColorSpace, Box3, Vector3, WebGLRenderer,
} from 'three';
import { applyLook } from '../../src/lib/akvaryum/scene-look';
import { sortFishGroups, groupCacheStats } from '../../src/lib/akvaryum/fishgroup';
import type { FishGroup, FishLod, SexId, SpeciesModule } from '../../src/lib/akvaryum/types';
import { loadSpecies } from './viewer3d.ts';
import { createDecor } from './tank-decor.ts';
import { createMotion, fitDistance, tankDims, REL_SIZE, type Extent, type Pose, type TankDims } from './tank-motion.ts';

export interface TankFish { species: string; form: string; variant: string; sex: string }
export interface TankOptions {
  canvas: HTMLCanvasElement;
  fish: TankFish[];
  lod: FishLod;
  reducedMotion: boolean;
  /** Dokunma/tıklama (sürükleme değil): dokunulan balığın `fish` dizisindeki sırası ya da boş suya dokunulduysa null */
  onPick?: (index: number | null, at: { x: number; y: number }) => void;
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
  /** Bir balığı vurgular (yavaşlatır); null kaldırır. */
  select(index: number | null): void;
  /** Balığın ekrandaki (clientX/clientY) konumu: testler ve kart yerleşimi için */
  screenPos(index: number): { x: number; y: number } | null;
  setActive(on: boolean): void;
  dispose(): void;
  stats(): TankStats;
  /** Senkron N kare çizer (güncelle + çiz + gl.finish) ve kare başına ms döndürür: yalnızca ölçüm için. */
  benchmark(frames?: number): number;
}

const FOV = 30;
const WATER_TOP = '#5bb8c9', WATER_BOTTOM = '#10445a', FOG = '#1a6074', ROOM = 0x061820;
const INIT_AZ = 0.32, INIT_POL = 1.47;
const POL_MIN = 0.3, POL_MAX = 1.6;
const MIN_FRAME_MS = 1000 / 30;
const TAP_PX = 6, TAP_MS = 400, PICK_MIN_PX = 20;

/** Camda hafif çapraz yansıma: düşük alfalı beyaz zemin + iki yumuşak şerit */
function glassSheen(): CanvasTexture {
  const c = document.createElement('canvas'); c.width = c.height = 256;
  const g = c.getContext('2d')!;
  g.fillStyle = 'rgba(255,255,255,0.25)'; g.fillRect(0, 0, 256, 256);
  for (const [x0, w, a] of [[40, 30, 0.7], [110, 12, 0.5]] as const) {
    const gr = g.createLinearGradient(x0, 0, x0 + w + 80, 256);
    gr.addColorStop(0, 'rgba(255,255,255,0)'); gr.addColorStop(0.5, `rgba(255,255,255,${a})`); gr.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = gr; g.fillRect(0, 0, 256, 256);
  }
  const t = new CanvasTexture(c); t.colorSpace = SRGBColorSpace; return t;
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
  type Item = { g: FishGroup; species: string; ext: Extent; motion: ReturnType<typeof createMotion>; src: number; clock: number; speed: number; want: number };
  const items: Item[] = [];
  const created: { fish: TankFish; g: FishGroup; ext: Extent; src: number }[] = [];
  o.fish.forEach((f, src) => {
    const sp = mods.get(f.species);
    if (!sp?.createFishGroup) { console.warn('Bu tür için createFishGroup yok:', f.species); return; }
    const sex = (sp.sexes.some((s) => s.id === f.sex) ? f.sex : sp.sexes[0].id) as SexId;
    const form = sp.forms?.some((x) => x.id === f.form) ? f.form : undefined;
    const variant = sp.variants.some((x) => x.id === f.variant) ? f.variant : sp.variants[0].id;
    const g = sp.createFishGroup({ sex, form, variant, reducedMotion, lod });
    g.object.scale.setScalar(REL_SIZE[f.species] ?? 0.8);
    const box = new Box3().setFromObject(g.object);
    const k = 1.06; // animasyon / yüzgeç payı
    created.push({ src, fish: f, g, ext: { hx: Math.max(Math.abs(box.min.x), box.max.x) * k, hy: Math.max(Math.abs(box.min.y), box.max.y) * k, hz: Math.max(Math.abs(box.min.z), box.max.z) * k } });
  });

  const maxR = created.reduce((m, c) => Math.max(m, Math.hypot(c.ext.hx, c.ext.hz)), 0.5);
  let aspect = (canvas.clientWidth || 16) / (canvas.clientHeight || 9);
  let dims = tankDims(created.length, aspect, maxR);

  // 4) tank: su, kum, cam
  const owned: { dispose(): void }[] = [];
  const addOwned = <T extends { dispose(): void }>(x: T): T => { owned.push(x); return x; };
  const water = waterBox(dims); addOwned(water.geometry); addOwned(water.material as Material);
  scene.add(water);
  const decor = createDecor(scene, dims, addOwned);
  const gb = addOwned(new BoxGeometry(dims.W + 0.05, dims.H, dims.D + 0.05));
  const glass = new Mesh(gb, addOwned(new MeshBasicMaterial({ map: addOwned(glassSheen()), color: 0xcfeef7, transparent: true, opacity: 0.22, depthWrite: false, side: DoubleSide, fog: false, toneMapped: false })));
  glass.renderOrder = -10; // balıklardan önce çizilir (balıklar sıralı, cam hep arkada kalır)
  scene.add(glass);
  const eg = addOwned(new EdgesGeometry(gb as BufferGeometry));
  const edges = new LineSegments(eg, addOwned(new LineBasicMaterial({ color: 0xd2f0f8, transparent: true, opacity: 0.55, fog: false, toneMapped: false })));
  scene.add(edges);
  const fog = new Fog(FOG, 10, 30); scene.fog = fog;

  const seen = new Map<string, number>();
  created.forEach((c, i) => {
    const rank = seen.get(c.fish.species) ?? 0; seen.set(c.fish.species, rank + 1);
    const motion = createMotion({ index: i, species: c.fish.species, ext: c.ext, dims, rank });
    scene.add(c.g.object);
    items.push({ g: c.g, species: c.fish.species, ext: c.ext, motion, src: c.src, clock: i * 3.1, speed: 1, want: 1 });
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
      if (!reducedMotion) { it.speed += (it.want - it.speed) * (1 - Math.exp(-dt * 3)); it.clock += dt * it.speed; }
      posed(it.motion.pose(it.clock), it);
      it.g.update(dt, time + i * 1.7);
    }
    decor.update(time, reducedMotion ? 0 : dt);
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

  // seçim: balığın burun-kuyruk doğrusunu ekrana izdüşürüp tıklamaya en yakın balığı bulur (animasyonlu geometriye ışın atmaktan sağlam)
  const vA = new Vector3(), vB = new Vector3(), vC = new Vector3(), vU = new Vector3();
  const toPx = (v: Vector3, rect: DOMRect) => ({ x: (v.x * 0.5 + 0.5) * rect.width, y: (-v.y * 0.5 + 0.5) * rect.height, z: v.z });
  const fishPx = (it: Item, rect: DOMRect) => {
    const o3 = it.g.object, yaw = o3.rotation.y, hx = it.ext.hx * 0.85;
    vC.copy(o3.position).project(camera);
    vA.set(o3.position.x + Math.cos(yaw) * hx, o3.position.y, o3.position.z - Math.sin(yaw) * hx).project(camera);
    vB.set(o3.position.x - Math.cos(yaw) * hx, o3.position.y, o3.position.z + Math.sin(yaw) * hx).project(camera);
    vU.set(o3.position.x, o3.position.y + it.ext.hy * 1.2, o3.position.z).project(camera);
    const c = toPx(vC, rect), a = toPx(vA, rect), b = toPx(vB, rect), u = toPx(vU, rect);
    return { c, a, b, r: Math.max(PICK_MIN_PX, Math.abs(u.y - c.y)) };
  };
  const pickAt = (cx: number, cy: number): number | null => {
    const rect = canvas.getBoundingClientRect(); if (!rect.width) return null;
    camera.updateMatrixWorld();
    const px = cx - rect.left, py = cy - rect.top;
    let best = -1, bestScore = Infinity;
    items.forEach((it, i) => {
      const { a, b, c, r } = fishPx(it, rect);
      const abx = b.x - a.x, aby = b.y - a.y, l2 = abx * abx + aby * aby;
      const t = l2 ? Math.max(0, Math.min(1, ((px - a.x) * abx + (py - a.y) * aby) / l2)) : 0;
      const dist = Math.hypot(px - (a.x + abx * t), py - (a.y + aby * t));
      if (dist > r) return;
      const score = dist / r + c.z * 0.05;   // yakın ve öndeki kazanır
      if (score < bestScore) { bestScore = score; best = i; }
    });
    return best < 0 ? null : items[best].src;
  };

  // 8) girdi: işaretçi (sürükle/kıstır), tekerlek (odaktayken ya da Ctrl ile), klavye
  const ptrs = new Map<number, { x: number; y: number }>();
  let pinch = 0, tap: { x: number; y: number; t: number; ok: boolean } | null = null;
  const pinchDist = () => { const [a, b] = [...ptrs.values()]; return Math.hypot(a.x - b.x, a.y - b.y); };
  const onDown = (e: PointerEvent) => {
    ptrs.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (ptrs.size === 1) tap = { x: e.clientX, y: e.clientY, t: performance.now(), ok: true }; else if (tap) tap.ok = false; // ikinci parmak: kıstırma/döndürme, dokunma değil
    try { canvas.setPointerCapture(e.pointerId); } catch { /* yoksay */ }
    if (ptrs.size === 2) pinch = pinchDist();
    canvas.dataset.drag = '1';
  };
  const onMove = (e: PointerEvent) => {
    const p = ptrs.get(e.pointerId); if (!p) return;
    if (tap && Math.hypot(e.clientX - tap.x, e.clientY - tap.y) >= TAP_PX) tap.ok = false;
    const dx = e.clientX - p.x, dy = e.clientY - p.y; p.x = e.clientX; p.y = e.clientY;
    if (ptrs.size === 1) { tgt.az -= dx * 0.008; tgt.pol -= dy * 0.006; }
    else if (ptrs.size === 2) { const d = pinchDist(); if (pinch > 0 && d > 0) tgt.dist *= pinch / d; pinch = d; }
    clampView(); invalidate();
  };
  const onUp = (e: PointerEvent) => {
    if (e.type === 'pointerup' && tap?.ok && ptrs.size === 1 && performance.now() - tap.t < TAP_MS && Math.hypot(e.clientX - tap.x, e.clientY - tap.y) < TAP_PX) o.onPick?.(pickAt(e.clientX, e.clientY), { x: e.clientX, y: e.clientY });
    if (e.type === 'pointercancel' || ptrs.size <= 1) tap = null;
    ptrs.delete(e.pointerId); pinch = ptrs.size === 2 ? pinchDist() : 0; if (!ptrs.size) delete canvas.dataset.drag; };
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
    select(index: number | null) { items.forEach((it) => { it.want = index !== null && it.src === index ? 0.12 : 1; }); invalidate(); },
    screenPos(index: number) {
      const it = items.find((x) => x.src === index); if (!it) return null;
      const rect = canvas.getBoundingClientRect(); camera.updateMatrixWorld();
      const p = fishPx(it, rect).c; return { x: rect.left + p.x, y: rect.top + p.y };
    },
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
      scene.remove(water, glass, edges, ...decor.objects);
      owned.forEach((x) => x.dispose());
      look.dispose();
      scene.environment = null;
      renderer.dispose();
      renderer.forceContextLoss();
    },
  };
  return handle;
}
