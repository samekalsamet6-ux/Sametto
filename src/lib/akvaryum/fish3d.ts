// Ortak balık three.js altyapısı: yalnızca 3B sayfalarda tembel (dynamic import) yüklenir.
// Gövde kaplaması, yüzgeç/tüp geometrileri, yüzme gölgelendirici eki ve numaralı noktalı görüntüleyici.
import {
  BufferAttribute, BufferGeometry, CanvasTexture, CatmullRomCurve3, DoubleSide,
  Float32BufferAttribute, Group, Material, Mesh, MeshBasicMaterial, PerspectiveCamera, Raycaster,
  Scene, SRGBColorSpace, Texture, Vector3, WebGLRenderer, Box3,
} from 'three';
import { applyLook, createFitter } from './scene-look';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { SWIM, bodyPoint, finGrid, swimZ, type Body, type FinDef, type Vec3 } from './fishmath';
import type { FaceHost, FaceRig } from './fishface';
import type { SexId, SpeciesPart, SpeciesViewer, SpeciesViewerOptions } from './types';
import { seg } from './fishgroup';

// ------------------------------------------------------------------ yüzme gölgelendirici eki

export interface SwimUniforms { uTime: { value: number }; uAmp: { value: number } }

const SWIM_PARS = `
uniform float uTime; uniform float uAmp;
attribute float aFlex;`;
const SWIM_VERT = `
#include <begin_vertex>
float swS = clamp(transformed.x + 0.5, 0.0, 1.25);
transformed.z += uAmp * (pow(swS, ${SWIM.power.toFixed(2)}) + aFlex * ${SWIM.flex.toFixed(2)}) * sin(${SWIM.wavenumber.toFixed(2)} * swS - uTime * ${SWIM.speed.toFixed(2)});`;

export function swimify<M extends Material>(m: M, u: SwimUniforms): M {
  m.onBeforeCompile = (shader) => {
    shader.uniforms.uTime = u.uTime;
    shader.uniforms.uAmp = u.uAmp;
    shader.vertexShader = shader.vertexShader.replace('#include <common>', `#include <common>\n${SWIM_PARS}`).replace('#include <begin_vertex>', SWIM_VERT);
  };
  m.customProgramCacheKey = () => 'akvaryum-balik-swim';
  return m;
}

/** Ağı gruba ekler; yüzme özniteliğini (aFlex) yoksa sıfırlarla tamamlar */
export function put(group: Group, geo: BufferGeometry, mat: Material, order = 0): Mesh {
  if (!geo.getAttribute('aFlex')) geo.setAttribute('aFlex', new Float32BufferAttribute(new Float32Array(geo.getAttribute('position').count), 1));
  const m = new Mesh(geo, mat);
  m.renderOrder = order;
  group.add(m);
  return m;
}

// ------------------------------------------------------------------ geometri

/** cut: burnu (c, dir) düzlemiyle keser; dir dışa bakar. Ağız bu düz yüze oturur (kapak noktası yerine). */
export function loftBody(body: Body, NS = 72, NA = 44, cut?: { c: Vec3; dir: Vec3 }): BufferGeometry {
  NS = seg(NS, 16); NA = seg(NA, 12);
  const pos: number[] = [], uv: number[] = [], idx: number[] = [];
  for (let i = 0; i <= NS; i++) {
    const s = 0.5 - 0.5 * Math.cos((i / NS) * Math.PI);
    for (let j = 0; j <= NA; j++) {
      const phi = (j / NA) * Math.PI * 2;
      const q = bodyPoint(body, s, phi);
      if (cut) {
        const d = (q[0] - cut.c[0]) * cut.dir[0] + (q[1] - cut.c[1]) * cut.dir[1] + (q[2] - cut.c[2]) * cut.dir[2];
        if (d > 0) { q[0] -= d * cut.dir[0]; q[1] -= d * cut.dir[1]; q[2] -= d * cut.dir[2]; }
      }
      pos.push(...q);
      uv.push(s, j / NA);
    }
  }
  for (let i = 0; i < NS; i++) for (let j = 0; j < NA; j++) {
    const a = i * (NA + 1) + j, b = a + 1, c = a + NA + 1, d = c + 1;
    idx.push(a, b, c, b, d, c);
  }
  // kuyruk sapı kapağı
  const sec = body.section(1), cy = (sec.yTop + sec.yBot) / 2, base = pos.length / 3;
  pos.push(sec.x, cy, 0); uv.push(0.999, 0.25);
  const last = NS * (NA + 1);
  for (let j = 0; j < NA; j++) idx.push(base, last + j + 1, last + j);
  const g = new BufferGeometry();
  g.setAttribute('position', new Float32BufferAttribute(pos, 3));
  g.setAttribute('uv', new Float32BufferAttribute(uv, 2));
  g.setIndex(idx);
  g.computeVertexNormals();
  const n = g.getAttribute('normal') as BufferAttribute;
  for (let i = 0; i <= NS; i++) {
    const a = i * (NA + 1), b = a + NA;
    const x = n.getX(a) + n.getX(b), y = n.getY(a) + n.getY(b), z = n.getZ(a) + n.getZ(b), l = Math.hypot(x, y, z) || 1;
    n.setXYZ(a, x / l, y / l, z / l); n.setXYZ(b, x / l, y / l, z / l);
  }
  for (let j = 0; j <= NA; j++) n.setXYZ(j, -1, 0, 0);
  n.setXYZ(base, 1, 0, 0);
  return g;
}

export function finGeometry(f: FinDef, side: 1 | -1, rows = 6): BufferGeometry {
  const grid = finGrid(f, side, seg(rows, 2));
  const g = new BufferGeometry();
  g.setAttribute('position', new Float32BufferAttribute(grid.pos, 3));
  g.setAttribute('uv', new Float32BufferAttribute(grid.uv, 2));
  g.setAttribute('aFlex', new Float32BufferAttribute(grid.flex, 1));
  g.setIndex(grid.idx);
  g.computeVertexNormals();
  return g;
}

export function taperedTube(points: Vec3[], radii: number[], radial = 10, samples = 24, closed = false): BufferGeometry {
  radial = seg(radial, 4); samples = seg(samples, 6);
  const curve = new CatmullRomCurve3(points.map((p) => new Vector3(...p)), closed);
  const frames = curve.computeFrenetFrames(samples, closed);
  const pos: number[] = [], idx: number[] = [];
  const rAt = (u: number) => { if (radii.length === 1) return radii[0]; const f = u * (radii.length - 1); const i = Math.min(radii.length - 2, Math.floor(f)); return radii[i] + (radii[i + 1] - radii[i]) * (f - i); };
  for (let i = 0; i <= samples; i++) {
    const u = i / samples, c = curve.getPointAt(u), r = rAt(u);
    for (let j = 0; j <= radial; j++) {
      const a = (j / radial) * Math.PI * 2;
      const n = frames.normals[i].clone().multiplyScalar(Math.cos(a)).add(frames.binormals[i].clone().multiplyScalar(Math.sin(a)));
      pos.push(c.x + n.x * r, c.y + n.y * r, c.z + n.z * r);
    }
  }
  for (let i = 0; i < samples; i++) for (let j = 0; j < radial; j++) { const a = i * (radial + 1) + j, b = a + radial + 1; idx.push(a, a + 1, b, a + 1, b + 1, b); }
  const g = new BufferGeometry();
  g.setAttribute('position', new Float32BufferAttribute(pos, 3));
  g.setIndex(idx);
  g.computeVertexNormals();
  return g;
}

export const tube = (points: Vec3[], r: number, samples = 24, closed = false) => taperedTube(points, [r], 6, samples, closed);

/** Yüz oluşturucuları (fishface) için ev sahibi: ağı gruba ekler, malzemeye yüzme gölgelendiricisini uygular */
export function faceHost(group: Group, u: SwimUniforms, textures: Texture[]): FaceHost {
  return { add: (geo, mat, order = 0) => put(group, geo, mat, order), wrap: (m) => swimify(m, u), textures };
}

export function canvasTexture(c: HTMLCanvasElement, srgb: boolean, store: Texture[], anisotropy = 4): CanvasTexture {
  const t = new CanvasTexture(c);
  if (srgb) t.colorSpace = SRGBColorSpace;
  t.anisotropy = anisotropy;
  t.flipY = false;
  store.push(t);
  return t;
}

export function disposeGroup(g: Group, textures: Texture[], extra: Mesh[] = []) {
  g.traverse((o) => {
    const m = o as Mesh;
    if (m.geometry) m.geometry.dispose();
    const mat = m.material as Material | Material[] | undefined;
    if (Array.isArray(mat)) mat.forEach((x) => x.dispose()); else mat?.dispose();
  });
  extra.forEach((p) => { p.geometry.dispose(); (p.material as Material).dispose(); });
  textures.forEach((t) => t.dispose());
}

// ------------------------------------------------------------------ görüntüleyici

export interface FishAnchor {
  pos: Vec3;
  /** Yüzeye dik dışa yön; null = her yönden görünür (yalnızca gövdeyle örtülme sınanır) */
  normal: Vec3 | null;
  /** +z tarafında tanımlıdır; kamera −z tarafındaysa z işareti çevrilir */
  mirror: boolean;
  /** Yüzgeç dalgalanma ağırlığı (nokta yüzme sırasında yüzgeçle birlikte oynar) */
  flex?: number;
}

export interface FishBuilt {
  group: Group;
  /** Görünmez, kaba gövde vekili (nokta gizlenme sınaması için) */
  proxy: { mesh: Mesh; base: Float32Array }[];
  textures: Texture[];
  /** Yüz canlandırması (ağız açılıp kapanır, solungaç kapağı atar); yüzme açıkken her karede çağrılır */
  face?: FaceRig;
}

export interface FishViewerConfig {
  /** Görünüm kimliği -> [yatay açı, düşey açı] */
  views: Record<string, [number, number]>;
  home: string;
  parts(sex: SexId, form?: string): SpeciesPart[];
  anchors(sex: SexId, form?: string): Record<string, FishAnchor>;
  build(sex: SexId, variant: string, u: SwimUniforms, texW: number, form?: string): FishBuilt;
}

export function proxyFrom(geo: BufferGeometry): { mesh: Mesh; base: Float32Array } {
  const mesh = new Mesh(geo, new MeshBasicMaterial({ side: DoubleSide }));
  return { mesh, base: Float32Array.from(geo.getAttribute('position').array as ArrayLike<number>) };
}

const easeInOut = (t: number) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);

export function createFishViewer(opts: SpeciesViewerOptions, cfg: FishViewerConfig): SpeciesViewer {
  const { canvas, overlay } = opts;
  const small = matchMedia('(max-width: 700px)').matches || navigator.maxTouchPoints > 0;
  const renderer = new WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, small ? 1.5 : 2));

  const scene = new Scene();
  const look = applyLook(renderer, scene);
  const fitter = createFitter();

  const camera = new PerspectiveCamera(30, 1, 0.05, 100);
  const controls = new OrbitControls(camera, canvas);
  controls.enablePan = false;
  controls.enableDamping = !opts.reducedMotion;
  controls.dampingFactor = 0.09;
  controls.rotateSpeed = 0.8;
  controls.autoRotateSpeed = 2.2;

  const uniforms: SwimUniforms = { uTime: { value: 0 }, uAmp: { value: 0 } };
  let sex = opts.sex, variant = opts.variant, form = opts.form;
  let built: FishBuilt | null = null;
  let anchors: Record<string, FishAnchor> = {};
  let swimOn = false, selected: string | null = null, hotOn = true;
  let visible = true, raf = 0, last = 0, disposed = false, proxyDirty = true;
  let tween: { from: [number, number, number]; to: [number, number, number]; t0: number; dur: number } | null = null;
  const texW = small ? 512 : 1024;
  const ray = new Raycaster();

  const hotspots = new Map<string, HTMLButtonElement>();
  const rebuildHotspots = () => {
    overlay.textContent = '';
    hotspots.clear();
    cfg.parts(sex, form).forEach((p, i) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'v3-hot';
      b.tabIndex = -1; // klavye için eşdeğer: sayfadaki parça listesi
      b.setAttribute('aria-hidden', 'true');
      b.dataset.part = p.id;
      b.dataset.label = p.ad;
      b.textContent = String(i + 1);
      b.hidden = !hotOn;
      b.addEventListener('click', () => opts.onSelect(selected === p.id ? null : p.id, true));
      overlay.appendChild(b);
      hotspots.set(p.id, b);
    });
    for (const [id, b] of hotspots) b.classList.toggle('on', id === selected);
    overlay.hidden = !hotOn;
  };

  const spherical = (): [number, number, number] => {
    const o = camera.position.clone().sub(controls.target);
    const r = o.length();
    return [Math.atan2(o.x, o.z), Math.acos(Math.min(1, Math.max(-1, o.y / r))), r];
  };
  const place = (th: number, ph: number, r: number) => {
    const sp = Math.sin(ph);
    camera.position.set(controls.target.x + r * sp * Math.sin(th), controls.target.y + r * Math.cos(ph), controls.target.z + r * sp * Math.cos(th));
    camera.lookAt(controls.target);
  };
  /** Kamera uzaklığı: (th, ph) açısından modelin gerçek izdüşümünü kadrajın ~%78'ine sığdırır (verilmezse mevcut açı). */
  const fitDistance = (th?: number, ph?: number) => {
    const s = th === undefined || ph === undefined ? spherical() : [th, ph];
    return fitter.distance(camera, s[0], s[1]);
  };
  const limits = () => { const [lo, hi] = fitter.range(camera); controls.minDistance = lo; controls.maxDistance = hi; };

  const load = (first: boolean, refit = false) => {
    const old = built;
    if (old) { scene.remove(old.group); disposeGroup(old.group, old.textures, old.proxy.map((p) => p.mesh)); }
    built = cfg.build(sex, variant, uniforms, texW, form);
    anchors = cfg.anchors(sex, form);
    scene.add(built.group);
    const box = new Box3().setFromObject(built.group);
    const prevTarget = controls.target.clone();
    controls.target.copy(box.getCenter(new Vector3()));
    fitter.measure(built.group, controls.target);
    if (first) place(...cfg.views[cfg.home], fitDistance(...cfg.views[cfg.home]));
    else {
      camera.position.add(controls.target.clone().sub(prevTarget));
      if (refit) { const sp = spherical(); place(sp[0], sp[1], fitDistance()); }
    }
    limits();
    rebuildHotspots();
    proxyDirty = true;
    controls.update();
    invalidate();
  };

  const resize = () => {
    const w = canvas.clientWidth || 300, h = canvas.clientHeight || 300;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    limits();
    invalidate();
  };

  const updateProxy = () => {
    if (!built) return;
    const t = uniforms.uTime.value, amp = uniforms.uAmp.value;
    for (const { mesh, base } of built.proxy) {
      const p = mesh.geometry.getAttribute('position') as BufferAttribute;
      for (let i = 0; i < p.count; i++) p.setZ(i, base[i * 3 + 2] + swimZ(base[i * 3] + 0.5, t, amp));
      p.needsUpdate = true;
      mesh.geometry.computeBoundingSphere();
    }
    proxyDirty = false;
  };

  const tmp = new Vector3(), world = new Vector3(), nrm = new Vector3(), toCam = new Vector3(), dir = new Vector3();
  const updateHotspots = () => {
    if (!built) return;
    if (!hotOn) { for (const b of hotspots.values()) b.hidden = true; return; }
    const w = canvas.clientWidth, h = canvas.clientHeight;
    const side = camera.position.z >= 0 ? 1 : -1;
    const t = uniforms.uTime.value, amp = uniforms.uAmp.value;
    if (proxyDirty || amp > 0.0004) updateProxy();
    for (const [id, btn] of hotspots) {
      const a = anchors[id];
      if (!a) { btn.hidden = true; continue; }
      const mirror = a.mirror && side < 0;
      world.set(a.pos[0], a.pos[1], (mirror ? -a.pos[2] : a.pos[2]) + swimZ(a.pos[0] + 0.5, t, amp, a.flex ?? 0));
      toCam.copy(camera.position).sub(world);
      const dist = toCam.length();
      toCam.divideScalar(dist);
      let shown = true;
      let hasN = false;
      if (a.normal) {
        nrm.set(a.normal[0], a.normal[1], mirror ? -a.normal[2] : a.normal[2]);
        hasN = true;
        shown = nrm.dot(toCam) > 0.05;
      }
      if (shown) {
        const target = hasN ? world.clone().addScaledVector(nrm, 0.02) : world.clone();
        dir.copy(target).sub(camera.position);
        const dd = dir.length();
        dir.divideScalar(dd);
        ray.set(camera.position, dir);
        ray.far = Math.max(0, dd - 0.006);
        if (ray.intersectObjects(built.proxy.map((p) => p.mesh), false).length > 0) shown = false;
      }
      tmp.copy(world).project(camera);
      const onScreen = tmp.z < 1 && Math.abs(tmp.x) < 1.02 && Math.abs(tmp.y) < 1.02;
      btn.hidden = !(shown && onScreen);
      if (!btn.hidden) btn.style.transform = `translate(${((tmp.x * 0.5 + 0.5) * w).toFixed(1)}px, ${((-tmp.y * 0.5 + 0.5) * h).toFixed(1)}px) translate(-50%, -50%)`;
    }
  };

  const frame = (now: number) => {
    raf = 0;
    if (disposed) return;
    const dt = Math.min(0.05, last ? (now - last) / 1000 : 0.016);
    last = now;
    let busy = false;

    const targetAmp = swimOn ? SWIM.amp : 0;
    uniforms.uAmp.value += (targetAmp - uniforms.uAmp.value) * (1 - Math.exp(-dt * 5));
    if (swimOn || uniforms.uAmp.value > 0.0008) { uniforms.uTime.value += dt; busy = true; if (!opts.reducedMotion) built?.face?.update(uniforms.uTime.value, Math.min(1, uniforms.uAmp.value / SWIM.amp)); }
    else if (uniforms.uAmp.value !== 0) { uniforms.uAmp.value = 0; proxyDirty = true; built?.face?.update(uniforms.uTime.value, 0); }

    if (tween) {
      const p = tween.dur <= 0 ? 1 : Math.min(1, (now - tween.t0) / tween.dur);
      const e = easeInOut(p), f = tween.from, t = tween.to;
      place(f[0] + (t[0] - f[0]) * e, f[1] + (t[1] - f[1]) * e, f[2] + (t[2] - f[2]) * e);
      if (p >= 1) tween = null; else busy = true;
    }
    if (controls.autoRotate) busy = true;
    if (controls.update(dt)) busy = true;

    look.sync(camera, controls.target);
    fitter.center(camera, controls.target);
    renderer.render(scene, camera);
    updateHotspots();
    canvas.dataset.frames = String((Number(canvas.dataset.frames) || 0) + 1);
    if (!canvas.parentElement?.hasAttribute('data-ready')) canvas.parentElement?.setAttribute('data-ready', 'true');
    if (busy && visible && !document.hidden) invalidate();
    else last = 0;
  };
  function invalidate() { if (!raf && !disposed && visible && !document.hidden) raf = requestAnimationFrame(frame); }

  controls.addEventListener('change', invalidate);
  const ro = new ResizeObserver(resize);
  ro.observe(canvas);
  const io = new IntersectionObserver((e) => { visible = e[e.length - 1]?.isIntersecting ?? true; if (visible) invalidate(); });
  io.observe(canvas);
  const onVis = () => { if (!document.hidden) invalidate(); };
  document.addEventListener('visibilitychange', onVis);
  canvas.addEventListener('webglcontextlost', (e) => e.preventDefault());
  canvas.addEventListener('webglcontextrestored', () => load(false));

  resize();
  load(true);

  const go = (th: number, ph: number, r: number) => {
    const from = spherical();
    let dth = th - from[0];
    dth = Math.atan2(Math.sin(dth), Math.cos(dth));
    tween = { from, to: [from[0] + dth, ph, r], t0: performance.now(), dur: opts.reducedMotion ? 0 : 650 };
    invalidate();
  };

  return {
    setSex(s) {
      if (s === sex) return;
      sex = s;
      if (selected && !cfg.parts(sex, form).some((p) => p.id === selected)) { selected = null; opts.onSelect(null, false); }
      load(false);
    },
    setForm(f) {
      if (f === form) return;
      form = f;
      if (selected && !cfg.parts(sex, form).some((p) => p.id === selected)) { selected = null; opts.onSelect(null, false); }
      load(false, true);
    },
    setVariant(v) { if (v !== variant) { variant = v; load(false); } },
    setAutoRotate(on) { controls.autoRotate = on; invalidate(); },
    setSwim(on) { swimOn = on; invalidate(); },
    setHotspots(on) {
      hotOn = on;
      overlay.hidden = !on;
      if (!on) for (const b of hotspots.values()) b.hidden = true;
      proxyDirty = true;
      invalidate();
    },
    setView(v) { const a = cfg.views[v] ?? cfg.views[cfg.home]; go(a[0], a[1], fitDistance(a[0], a[1])); },
    zoom(f) { const s = spherical(); place(s[0], s[1], Math.min(controls.maxDistance, Math.max(controls.minDistance, s[2] * f))); controls.update(); invalidate(); },
    rotate(dTh, dPh) { const s = spherical(); place(s[0] + dTh, Math.min(Math.PI - 0.03, Math.max(0.03, s[1] + dPh)), s[2]); controls.update(); invalidate(); },
    reset() { go(...cfg.views[cfg.home], fitDistance(...cfg.views[cfg.home])); },
    select(id) {
      selected = id;
      for (const [pid, b] of hotspots) b.classList.toggle('on', pid === id);
      invalidate();
    },
    isPartVisible(id) { const b = hotspots.get(id); return !!b && !b.hidden; },
    dispose() {
      disposed = true;
      cancelAnimationFrame(raf);
      ro.disconnect(); io.disconnect();
      document.removeEventListener('visibilitychange', onVis);
      controls.dispose();
      if (built) disposeGroup(built.group, built.textures, built.proxy.map((p) => p.mesh));
      look.dispose(); renderer.dispose();
    },
  };
}
