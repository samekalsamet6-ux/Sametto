// Yanlardan basık balıklar için ortak three.js sahnesi. Yalnızca ilgili 3B sayfasında tembel (dynamic import) yüklenir.
import {
  BufferAttribute, BufferGeometry, CanvasTexture, CatmullRomCurve3, Color, DoubleSide,
  FrontSide, Float32BufferAttribute, Group, Material, Mesh, MeshBasicMaterial, MeshPhysicalMaterial, MeshStandardMaterial,
  PerspectiveCamera, Raycaster, Scene, SRGBColorSpace, Texture, TubeGeometry, Vector3,
  WebGLRenderer, Box3,
} from 'three';
import { applyLook, createFitter } from './scene-look';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import type { SpeciesViewer, SpeciesViewerOptions, SexId } from './types';
import {
  atlasUV, bodyPoint, bodySurfaceZ, finPoint, flankNormal, swimZ, type Anchor, type FishSpec, type FishVariant, type Pt, type Vec3,
} from './yanal-model';
import { paintAtlas } from './yanal-texture';
import { addEye, addMouth, createFaceRig, pulseGill, type FaceHost, type FaceRig } from './fishface';
import { seg } from './fishgroup';

export interface FishDef {
  id: string;
  spec: FishSpec;
  /** Numaralandırma sırası */
  partIds: { id: string; ad: string }[];
  anchors: Record<string, Anchor>;
  variantById(id: string, sex?: SexId): FishVariant;
  /** Kamera açıları [yatay, düşey] */
  views: Record<string, [number, number]>;
  defaultView: string;
  /** Form (şekil) varyetesi desteği: forma göre geometri ve bağlantı noktaları (isteğe bağlı) */
  forms?: { defaultForm: string; specFor(id: string, sex?: SexId): FishSpec; anchorsFor(id: string, sex?: SexId): Record<string, Anchor> };
  /** İsteğe bağlı: cinsiyete göre geometri ve renk (cüce gurami gibi dışarıdan ayırt edilebilen türler); yoksa setSex etkisizdir. */
  sexed?: boolean;
}

interface SwimUniforms { uTime: { value: number }; uAmp: { value: number } }

// ------------------------------------------------------------------ yüzme gölgelendirici eki

function swimify<M extends Material>(m: M, u: SwimUniforms, sw: FishSpec['swim'], key: string): M {
  m.onBeforeCompile = (shader) => {
    shader.uniforms.uTime = u.uTime;
    shader.uniforms.uAmp = u.uAmp;
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', `#include <common>\nuniform float uTime; uniform float uAmp; attribute vec2 aSwim;`)
      .replace('#include <begin_vertex>', `#include <begin_vertex>
float swW = pow(clamp((transformed.x - ${sw.x0.toFixed(3)}) / ${(sw.x1 - sw.x0).toFixed(3)}, 0.0, 1.0), 1.6);
transformed.z += uAmp * ${sw.amp.toFixed(4)} * swW * sin(transformed.x * ${sw.k.toFixed(3)} - uTime * ${sw.speed.toFixed(3)});
transformed.z += uAmp * ${(sw.amp * 0.7).toFixed(4)} * aSwim.x * sin(transformed.x * ${(sw.k * 1.3).toFixed(3)} - uTime * ${(sw.speed * 1.25).toFixed(3)} + aSwim.y * 3.0);`);
  };
  m.customProgramCacheKey = () => `yanal-swim-${key}`;
  return m;
}

function swimAttr(g: BufferGeometry, fn: (x: number, y: number, z: number) => [number, number] = () => [0, 0]): BufferGeometry {
  const p = g.getAttribute('position');
  const a = new Float32Array(p.count * 2);
  for (let i = 0; i < p.count; i++) { const [r, s] = fn(p.getX(i), p.getY(i), p.getZ(i)); a[i * 2] = r; a[i * 2 + 1] = s; }
  g.setAttribute('aSwim', new BufferAttribute(a, 2));
  return g;
}

// ------------------------------------------------------------------ geometri

function ringsFor(spec: FishSpec, NX: number, NA: number): Vec3[][] {
  const b = spec.body;
  const rings: Vec3[][] = [];
  for (let i = 0; i <= NX; i++) {
    const t = 0.5 - 0.5 * Math.cos((i / NX) * Math.PI);
    const r: Vec3[] = [];
    for (let j = 0; j <= NA; j++) r.push(bodyPoint(b, t, (j / NA) * Math.PI * 2));
    rings.push(r);
  }
  // kuyruk ucunu kapat: halka küçülerek noktaya iner
  const last = rings[rings.length - 1];
  const cy = last.reduce((s, p) => s + p[1], 0) / last.length;
  for (const [k, dx] of [[0.7, 0.004], [0.4, 0.008], [0.12, 0.011], [0, 0.012]] as const) {
    rings.push(last.map((p) => [p[0] + dx, cy + (p[1] - cy) * k, p[2] * k] as Vec3));
  }
  return rings;
}

function bodyGeometry(spec: FishSpec, NX: number, NA: number, cut?: { c: Vec3; dir: Vec3 }): BufferGeometry {
  NX = seg(NX, 20); NA = seg(NA, 14);
  const rings = ringsFor(spec, NX, NA);
  if (cut) for (const r of rings) for (const q of r) {
    const d = (q[0] - cut.c[0]) * cut.dir[0] + (q[1] - cut.c[1]) * cut.dir[1] + (q[2] - cut.c[2]) * cut.dir[2];
    if (d > 0) { q[0] -= d * cut.dir[0]; q[1] -= d * cut.dir[1]; q[2] -= d * cut.dir[2]; }
  }
  const pos: number[] = [], uv: number[] = [], idx: number[] = [];
  for (const r of rings) for (const p of r) { pos.push(...p); uv.push(...atlasUV(spec.atlas, p[0], p[1])); }
  const W = NA + 1;
  for (let i = 0; i < rings.length - 1; i++) {
    for (let j = 0; j < NA; j++) {
      const a = i * W + j, b = a + 1, c = a + W, d = c + 1;
      idx.push(a, c, b, b, c, d);
    }
  }
  const g = new BufferGeometry();
  g.setAttribute('position', new Float32BufferAttribute(pos, 3));
  g.setAttribute('uv', new Float32BufferAttribute(uv, 2));
  g.setIndex(idx);
  g.computeVertexNormals();
  const n = g.getAttribute('normal') as BufferAttribute;
  for (let i = 0; i < rings.length; i++) { // dikiş
    const a = i * W, b = a + NA;
    const x = n.getX(a) + n.getX(b), y = n.getY(a) + n.getY(b), z = n.getZ(a) + n.getZ(b), l = Math.hypot(x, y, z) || 1;
    n.setXYZ(a, x / l, y / l, z / l); n.setXYZ(b, x / l, y / l, z / l);
  }
  return g;
}

function finGeometry(spec: FishSpec, fin: { base: Pt[]; edge: Pt[] }, ripple: number, flutter: number, NS: number, NR = 8, side = 0, zOff?: (x: number, y: number, r: number) => number): BufferGeometry {
  NS = seg(NS, 8); NR = seg(NR, 3);
  const pos: number[] = [], uv: number[] = [], sw: number[] = [], idx: number[] = [];
  for (let i = 0; i <= NS; i++) {
    const s = i / NS;
    for (let j = 0; j <= NR; j++) {
      const r = j / NR, [x, y] = finPoint(fin, s, r);
      const z = (zOff ? zOff(x, y, r) : 0) + ripple * Math.sin(s * 22 + r * 1.6) * Math.min(1, r * 2.5);
      pos.push(x, y, side ? side * z : z);
      uv.push(...atlasUV(spec.atlas, x, y));
      sw.push(flutter * Math.pow(r, 1.5), s);
    }
  }
  const W = NR + 1;
  for (let i = 0; i < NS; i++) for (let j = 0; j < NR; j++) { const a = i * W + j, b = a + 1, c = a + W, d = c + 1; idx.push(a, c, b, b, c, d); }
  const g = new BufferGeometry();
  g.setAttribute('position', new Float32BufferAttribute(pos, 3));
  g.setAttribute('uv', new Float32BufferAttribute(uv, 2));
  g.setAttribute('aSwim', new Float32BufferAttribute(sw, 2));
  g.setIndex(idx);
  g.computeVertexNormals();
  return g;
}

function taperedTube(points: Vec3[], radii: number[], radial = 10, samples = 28): BufferGeometry {
  radial = seg(radial, 4); samples = seg(samples, 8);
  const curve = new CatmullRomCurve3(points.map((p) => new Vector3(...p)));
  const frames = curve.computeFrenetFrames(samples, false);
  const pos: number[] = [], idx: number[] = [];
  const rAt = (u: number) => { const f = u * (radii.length - 1); const i = Math.min(radii.length - 2, Math.floor(f)); return radii[i] + (radii[i + 1] - radii[i]) * (f - i); };
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

const tube = (pts: Vec3[], radius: number, segs = 24) => new TubeGeometry(new CatmullRomCurve3(pts.map((p) => new Vector3(...p))), seg(segs, 8), radius, seg(6, 4), false);
const shade = (hex: string, k: number) => new Color(hex).multiplyScalar(k);

// ------------------------------------------------------------------ balığı kur

interface Built {
  group: Group;
  textures: Texture[];
  box: Box3;
  center: Vector3;
  proxy: Mesh;
  proxyBase: Float32Array;
  face: FaceRig;
}

export function buildFish(def: FishDef, variantId: string, u: SwimUniforms, texW: number, specIn?: FishSpec, sex?: SexId): Built {
  const spec = specIn ?? def.spec, v = def.variantById(variantId, sex), sw = spec.swim;
  const group = new Group();
  const textures: Texture[] = [];
  const add = (geo: BufferGeometry, mat: Material, order = 0) => { const m = new Mesh(geo, mat); m.renderOrder = order; group.add(m); return m; };
  const std = (color: Color | string, rough = 0.6, extra: Record<string, unknown> = {}) => swimify(new MeshStandardMaterial({ color: new Color(color), roughness: rough, ...extra }), u, sw, def.id);
  const shine = v.parlak ?? 0;

  const tex = paintAtlas(spec, v, texW);
  const mk = (c: HTMLCanvasElement, srgb: boolean) => { const t = new CanvasTexture(c); if (srgb) t.colorSpace = SRGBColorSpace; t.anisotropy = 4; t.flipY = false; textures.push(t); return t; };
  const map = mk(tex.map, true), bump = mk(tex.bump, false);

  // ---- gövde
  add(swimAttr(bodyGeometry(spec, 84, 40, spec.mouthGeom)), swimify(new MeshPhysicalMaterial({
    map, bumpMap: bump, bumpScale: v.inci ? 2.4 : 1.1, roughness: 0.5 - 0.28 * shine, metalness: 0.28 * shine,
    clearcoat: 0.25 + 0.5 * shine, clearcoatRoughness: 0.35, envMapIntensity: 0.55 + 0.7 * shine, side: FrontSide,
  }), u, sw, def.id));

  // ---- yüzgeçler (atlas dokusu, saydam zar)
  const finMat = () => swimify(new MeshStandardMaterial({
    map, bumpMap: bump, bumpScale: 0.7, roughness: 0.55, transparent: true, alphaTest: 0.012, depthWrite: false, side: DoubleSide, envMapIntensity: 0.5,
  }), u, sw, def.id);
  for (const f of spec.fins) add(finGeometry(spec, f, f.ripple, f.flutter, 56), finMat(), 2);

  // ---- göğüs yüzgeçleri: yan yüzeyin hemen üstünde
  for (const side of [1, -1] as const) {
    const g = finGeometry(spec, spec.pectoral, 0.004, 0.9, 16, 6, side, (x, y, r) => bodySurfaceZ(spec.body, x, y) + 0.006 + r * 0.04);
    add(g, swimify(new MeshStandardMaterial({
      color: new Color(v.yuzgec.isin), roughness: 0.5, transparent: true, opacity: Math.min(0.85, 0.25 + v.yuzgec.a * 0.5), depthWrite: false, side: DoubleSide,
    }), u, sw, def.id), 3);
  }

  // ---- gözler, ağız, solungaç kapağı
  const host: FaceHost = { add: (geo, mat, order = 0) => add(swimAttr(geo), mat, order), wrap: (m) => swimify(m, u, sw, def.id), textures };
  const rig = createFaceRig();
  const e = spec.eye, socket = bodyGeometry(spec, 44, 28);
  let eyeTex;
  for (const side of [1, -1] as const) {
    const n0 = flankNormal(spec.body, e.x, e.y);
    const nrm = new Vector3(n0[0] - 0.12, n0[1] + 0.02, n0[2] * side).normalize();
    const cz = side * (bodySurfaceZ(spec.body, e.x, e.y) - e.r * 0.55);
    eyeTex = addEye(host, { center: [e.x, e.y, cz], r: e.r, normal: [nrm.x, nrm.y, nrm.z], style: { ball: v.goz.halka, iris: v.goz.iris, pupil: v.goz.pupil, pupilAngle: 0.5, irisAngle: 1.0, ring: '#' + shade(v.govde.sirt, 0.45).getHexString() }, body: socket }, eyeTex);
  }
  socket.dispose();
  const onSurface = (pts: Pt[], side: 1 | -1, lift = 0.0035): Vec3[] => pts.map(([x, y]) => [x, y, side * (bodySurfaceZ(spec.body, x, y) + lift)]);
  for (const side of [1, -1] as const) pulseGill(rig, add(swimAttr(tube(onSurface(spec.gill, side), 0.0055, 30)), std(shade(v.govde.orta, 0.55), 0.55)), side, 0.004);
  if (spec.mouthGeom) {
    const lipCol = '#' + shade(v.govde.karin, 0.8).lerp(new Color('#b87a6a'), 0.25).getHexString();
    addMouth(host, rig, { ...spec.mouthGeom, lipColor: lipCol, innerColor: '#1a0a0a' });
  }

  // ---- karın yüzgeci iplikleri
  for (const f of spec.filaments) {
    for (const side of [1, -1] as const) {
      const pts: Vec3[] = f.path.map(([x, y]) => [x, y, side * f.z]);
      const top = f.path[0][1], bottom = f.path[f.path.length - 1][1];
      add(swimAttr(taperedTube(pts, f.radii), (_x, y) => [Math.min(1, Math.max(0, (top - y) / (top - bottom))) * 0.9, 1.2]), std(v.iplik, 0.45), 1);
    }
  }

  // ---- gizlenme sınaması için kaba vekil yüzey (görüntülenmez)
  const pg = bodyGeometry(spec, 36, 18);
  const proxy = new Mesh(pg, new MeshBasicMaterial({ side: DoubleSide }));
  const proxyBase = Float32Array.from(pg.getAttribute('position').array as ArrayLike<number>);

  const box = new Box3().setFromObject(group);
  return { group, textures, box, center: box.getCenter(new Vector3()), proxy, proxyBase, face: rig };
}

function disposeGroup(g: Group, textures: Texture[], proxy: Mesh) {
  g.traverse((o) => {
    const m = o as Mesh;
    if (m.geometry) m.geometry.dispose();
    const mat = m.material as Material | Material[] | undefined;
    if (Array.isArray(mat)) mat.forEach((x) => x.dispose()); else mat?.dispose();
  });
  proxy.geometry.dispose(); (proxy.material as Material).dispose();
  textures.forEach((t) => t.dispose());
}

// ------------------------------------------------------------------ görüntüleyici

const easeInOut = (t: number) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);

export function createFishViewer(def: FishDef, opts: SpeciesViewerOptions): SpeciesViewer {
  const { canvas, overlay } = opts;
  let form = opts.form ?? def.forms?.defaultForm ?? '';
  let sex: SexId = def.sexed ? opts.sex : 'disi';
  let spec = def.forms ? def.forms.specFor(form, def.sexed ? sex : undefined) : def.spec;
  let anchors = def.forms ? def.forms.anchorsFor(form, def.sexed ? sex : undefined) : def.anchors;
  const small = matchMedia('(max-width: 700px)').matches || navigator.maxTouchPoints > 0;
  const renderer = new WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, small ? 1.5 : 2));

  const scene = new Scene();
  const look = applyLook(renderer, scene);
  const fitter = createFitter();

  const camera = new PerspectiveCamera(30, 1, 0.1, 100);
  const controls = new OrbitControls(camera, canvas);
  controls.enablePan = false;
  controls.enableDamping = !opts.reducedMotion;
  controls.dampingFactor = 0.09;
  controls.rotateSpeed = 0.8;
  controls.autoRotateSpeed = 2.2;

  const uniforms: SwimUniforms = { uTime: { value: 0 }, uAmp: { value: 0 } };
  let variant = opts.variant;
  let built: Built | null = null;
  let swimOn = false, selected: string | null = null, hotspotsOn = true;
  let dims = new Vector3(1, 1, 1), visible = true, raf = 0, last = 0, disposed = false;
  let tween: { from: [number, number, number]; to: [number, number, number]; t0: number; dur: number } | null = null;
  const texW = small ? 640 : 1280;
  const ray = new Raycaster();

  const hotspots = new Map<string, HTMLButtonElement>();
  const shown = new Map<string, boolean>();
  const rebuildHotspots = () => {
    overlay.textContent = '';
    hotspots.clear();
    def.partIds.forEach((p, i) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'v3-hot';
      b.tabIndex = -1; // klavye için eşdeğer: sayfadaki parça listesi
      b.setAttribute('aria-hidden', 'true');
      b.dataset.part = p.id;
      b.dataset.label = p.ad;
      b.textContent = String(i + 1);
      b.hidden = true;
      b.addEventListener('click', () => opts.onSelect(selected === p.id ? null : p.id, true));
      overlay.appendChild(b);
      hotspots.set(p.id, b);
    });
    for (const [id, b] of hotspots) b.classList.toggle('on', id === selected);
    overlay.hidden = !hotspotsOn;
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
  const home = (): [number, number] => def.views[def.defaultView];

  const load = (first: boolean) => {
    const old = built;
    if (old) { scene.remove(old.group); disposeGroup(old.group, old.textures, old.proxy); }
    built = buildFish(def, variant, uniforms, texW, spec, def.sexed ? sex : undefined);
    scene.add(built.group);
    built.box.getSize(dims);
    const prevTarget = controls.target.clone();
    controls.target.copy(built.center);
    fitter.measure(built.group, controls.target);
    if (first) place(...home(), fitDistance(...home()));
    else camera.position.add(controls.target.clone().sub(prevTarget));
    limits();
    rebuildHotspots();
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
    const p = built.proxy.geometry.getAttribute('position') as BufferAttribute;
    const base = built.proxyBase;
    for (let i = 0; i < p.count; i++) p.setZ(i, base[i * 3 + 2] + swimZ(spec.swim, base[i * 3], t, amp));
    p.needsUpdate = true;
    built.proxy.geometry.computeBoundingSphere();
    built.proxy.geometry.computeBoundingBox();
  };

  const tmp = new Vector3(), world = new Vector3(), nrm = new Vector3(), toCam = new Vector3(), dir = new Vector3();
  const updateHotspots = () => {
    if (!built) return;
    const w = canvas.clientWidth, h = canvas.clientHeight;
    const side = camera.position.z >= 0 ? 1 : -1;
    const t = uniforms.uTime.value, amp = uniforms.uAmp.value;
    updateProxy();
    for (const [id, btn] of hotspots) {
      const a = anchors[id];
      if (!a) { shown.set(id, false); btn.hidden = true; continue; }
      const mirror = a.mirror && side < 0;
      const px = a.pos[0];
      const pz = (mirror ? -a.pos[2] : a.pos[2]) + (a.swim ? swimZ(spec.swim, px, t, amp) : 0);
      world.set(px, a.pos[1], pz);
      toCam.copy(camera.position).sub(world);
      const dist = toCam.length();
      toCam.divideScalar(dist);
      let vis = true;
      const hasN = !!a.normal;
      if (a.normal) {
        nrm.set(a.normal[0], a.normal[1], mirror ? -a.normal[2] : a.normal[2]);
        vis = nrm.dot(toCam) > 0.06;
      }
      if (vis) {
        const target = hasN ? world.clone().addScaledVector(nrm, 0.04) : world.clone();
        dir.copy(target).sub(camera.position);
        const dd = dir.length();
        dir.divideScalar(dd);
        ray.set(camera.position, dir);
        ray.far = dd - 0.005;
        if (ray.intersectObject(built.proxy, false).length > 0) vis = false;
      }
      tmp.copy(world).project(camera);
      const onScreen = tmp.z < 1 && Math.abs(tmp.x) < 1.02 && Math.abs(tmp.y) < 1.02;
      vis = vis && onScreen;
      shown.set(id, vis);
      btn.hidden = !(hotspotsOn && vis);
      if (!btn.hidden) btn.style.transform = `translate(${((tmp.x * 0.5 + 0.5) * w).toFixed(1)}px, ${((-tmp.y * 0.5 + 0.5) * h).toFixed(1)}px) translate(-50%, -50%)`;
    }
  };

  const frame = (now: number) => {
    raf = 0;
    if (disposed) return;
    const dt = Math.min(0.05, last ? (now - last) / 1000 : 0.016);
    last = now;
    let busy = false;

    const targetAmp = swimOn ? 1 : 0;
    const k = 1 - Math.exp(-dt * 5);
    uniforms.uAmp.value += (targetAmp - uniforms.uAmp.value) * k;
    if (swimOn || uniforms.uAmp.value > 0.0015) { uniforms.uTime.value += dt; busy = true; if (!opts.reducedMotion) built?.face.update(uniforms.uTime.value, uniforms.uAmp.value); }
    else if (uniforms.uAmp.value !== 0) { uniforms.uAmp.value = 0; built?.face.update(uniforms.uTime.value, 0); }

    if (tween) {
      const p = tween.dur <= 0 ? 1 : Math.min(1, (now - tween.t0) / tween.dur);
      const e = easeInOut(p);
      const f = tween.from, t = tween.to;
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
  const io = new IntersectionObserver((en) => { visible = en[0]?.isIntersecting ?? true; if (visible) invalidate(); });
  io.observe(canvas);
  const onVis = () => { if (!document.hidden) invalidate(); };
  document.addEventListener('visibilitychange', onVis);
  canvas.addEventListener('webglcontextlost', (ev) => ev.preventDefault());
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

  const api: SpeciesViewer = {
    setSex(s: SexId) {
      // Dış görünüşte güvenilir cinsiyet ayrımı olmayan türlerde (def.sexed yok) model değişmez.
      if (!def.sexed || !def.forms || s === sex) return;
      sex = s;
      spec = def.forms.specFor(form, sex);
      anchors = def.forms.anchorsFor(form, sex);
      load(false);
      const sp = spherical();
      place(sp[0], sp[1], fitDistance());
      controls.update();
      invalidate();
    },
    setVariant(v) { if (v !== variant) { variant = v; load(false); } },
    setForm(f) {
      if (!def.forms || f === form) return;
      form = f;
      spec = def.forms.specFor(form, def.sexed ? sex : undefined);
      anchors = def.forms.anchorsFor(form, def.sexed ? sex : undefined);
      load(false);
      const s = spherical();
      place(s[0], s[1], fitDistance());
      controls.update();
      invalidate();
    },
    setAutoRotate(on) { controls.autoRotate = on; invalidate(); },
    setSwim(on) { swimOn = on; invalidate(); },
    setHotspots(on) {
      hotspotsOn = on;
      overlay.hidden = !on;
      for (const b of hotspots.values()) if (!on) b.hidden = true;
      updateHotspots(); // görünür olmasa da hemen güncelle (kare döngüsü durmuş olabilir)
      invalidate();
    },
    setView(v) { const a = def.views[v]; if (a) go(a[0], a[1], fitDistance(a[0], a[1])); },
    zoom(f) { const s = spherical(); const r = Math.min(controls.maxDistance, Math.max(controls.minDistance, s[2] * f)); place(s[0], s[1], r); controls.update(); invalidate(); },
    rotate(dTh, dPh) { const s = spherical(); place(s[0] + dTh, Math.min(Math.PI - 0.03, Math.max(0.03, s[1] + dPh)), s[2]); controls.update(); invalidate(); },
    reset() { go(...home(), fitDistance(...home())); },
    select(id) {
      selected = id;
      for (const [pid, b] of hotspots) b.classList.toggle('on', pid === id);
      invalidate();
    },
    isPartVisible(id) { return shown.get(id) === true; },
    dispose() {
      disposed = true;
      cancelAnimationFrame(raf);
      ro.disconnect(); io.disconnect();
      document.removeEventListener('visibilitychange', onVis);
      controls.dispose();
      if (built) disposeGroup(built.group, built.textures, built.proxy);
      look.dispose(); renderer.dispose();
    },
  };
  return api;
}
